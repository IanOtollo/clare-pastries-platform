import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Order, CartItem } from '@/types'

export function useOrders(userId?: string) {
  return useQuery({
    queryKey: ['orders', userId],
    queryFn: async () => {
      if (!userId) return []
      const { data, error } = await supabase
        .from('Order')
        .select('*, items:OrderItem(*)')
        .eq('userId', userId)
        .order('createdAt', { ascending: false })
      if (error) throw error
      return data as Order[]
    },
    enabled: !!userId,
  })
}

export function useOrder(id: string, token?: string) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query: any = supabase
        .from('Order')
        .select('*, items:OrderItem(*)')
        .eq('id', id)

      if (token) {
        query = query.eq('trackingToken', token)
      }

      const { data, error } = await query.single()
      if (error) throw error
      return data as Order
    },
    enabled: !!id,
    refetchInterval: 10000,
  })
}

export function useCreateOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (orderData: {
      customerName?: string
      customerPhone?: string
      guestEmail?: string
      userId?: string
      items: CartItem[]
      subtotalKes: number
      deliveryFeeKes: number
      totalKes: number
      fulfillmentType: 'DELIVERY' | 'PICKUP'
      deliveryAddress?: string
      deliveryLandmark?: string
      deliveryBuilding?: string
      deliveryTown?: string
      deliveryArea?: string
      notes?: string
      paymentMethod: 'MPESA' | 'CASH' | 'CARD'
      displayCurrency: string
      displayTotal: number
    }) => {
      const trackingToken = crypto.randomUUID()
      const orderId = crypto.randomUUID()

      const { data: order, error: orderError } = await supabase
        .from('Order')
        .insert({
          id: orderId,
          trackingToken,
          userId: orderData.userId || null,
          guestName: orderData.customerName,
          guestPhone: orderData.customerPhone,
          guestEmail: orderData.guestEmail,
          subtotalKes: orderData.subtotalKes,
          deliveryFeeKes: orderData.deliveryFeeKes,
          totalKes: orderData.totalKes,
          displayCurrency: orderData.displayCurrency || 'KES',
          displayTotal: orderData.displayTotal || orderData.totalKes,
          fulfillment: orderData.fulfillmentType,
          deliveryArea: orderData.deliveryArea,
          deliveryLandmark: orderData.deliveryAddress, // mapping address to landmark
          notes: orderData.notes,
          status: 'PENDING',
          paymentStatus: 'UNPAID',
          paymentMethod: orderData.paymentMethod,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .select()
        .single()

      if (orderError) throw orderError

      const orderItems = orderData.items.map((item) => ({
        id: crypto.randomUUID(),
        orderId: order.id,
        sanityId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        unitPriceKes: item.product.priceKes,
        totalPriceKes: item.product.priceKes * item.quantity,
      }))

      const { error: itemsError } = await supabase
        .from('OrderItem')
        .insert(orderItems)

      if (itemsError) throw itemsError

      await notifyClare(order, orderData.items)
      
      const payheroChannelId = (import.meta as any).env.VITE_PAYHERO_CHANNEL_ID;
      const payheroApiKey = (import.meta as any).env.VITE_PAYHERO_API_KEY;

      if (orderData.paymentMethod === 'MPESA' && payheroChannelId && payheroApiKey) {
        let formattedPhone = orderData.customerPhone || "";
        if (formattedPhone.startsWith('0')) {
          formattedPhone = '254' + formattedPhone.slice(1);
        } else if (formattedPhone.startsWith('+')) {
          formattedPhone = formattedPhone.slice(1);
        }

        const authString = payheroApiKey.includes(':') ? payheroApiKey : `${payheroApiKey}:`;
        const authHeader = btoa(authString);

        const response = await fetch("https://backend.payhero.co.ke/api/v2/payments", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Basic ${authHeader}`
          },
          body: JSON.stringify({
            amount: Math.round(orderData.totalKes),
            phone_number: formattedPhone,
            channel_id: parseInt(payheroChannelId),
            provider: "m-pesa",
            external_reference: trackingToken,
            callback_url: "https://clarepastries.com/api/callback"
          })
        });

        if (!response.ok) {
          const errorData = await response.text();
          throw new Error(`PayHero STK Failed (${response.status}): ${errorData}`);
        }
      }

      return { order, trackingToken }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}

async function notifyClare(order: Record<string, unknown>, items: CartItem[]) {
  const phone = (import.meta as any).env.VITE_CALLMEBOT_PHONE
  const apikey = (import.meta as any).env.VITE_CALLMEBOT_API_KEY

  if (!phone || !apikey) return

  const itemsList = items
    .map((i) => `${i.quantity}x ${i.product.name}`)
    .join(', ')

  const message = encodeURIComponent(
    `New Order!\nID: ${String(order.id).slice(0, 8)}\n` +
      `Customer: ${order.guestName || 'Registered user'}\n` +
      `Phone: ${order.guestPhone || 'N/A'}\n` +
      `Items: ${itemsList}\n` +
      `Total: KES ${order.totalKes}\n` +
      `Type: ${order.fulfillment}`
  )

  try {
    await fetch(
      `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${message}&apikey=${apikey}`,
      { mode: 'no-cors' }
    )
  } catch {
    // Never block order on notification failure
  }
}

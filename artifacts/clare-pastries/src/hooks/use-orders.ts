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
      return (data as any[]).map(o => ({
        ...o,
        guestName: o.guest_name,
        guestPhone: o.guest_phone,
        guestEmail: o.guest_email,
        subtotalKes: o.subtotal_kes,
        deliveryFeeKes: o.delivery_fee_kes,
        totalKes: o.total_kes,
        deliveryStreet: o.delivery_street,
        trackingToken: o.tracking_token,
        paymentStatus: o.payment_status,
        paymentMethod: o.payment_method,
        createdAt: o.created_at,
        updatedAt: o.updated_at,
      })) as Order[]
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
      const o = data as any
      return {
        ...o,
        guestName: o.guest_name,
        guestPhone: o.guest_phone,
        guestEmail: o.guest_email,
        subtotalKes: o.subtotal_kes,
        deliveryFeeKes: o.delivery_fee_kes,
        totalKes: o.total_kes,
        deliveryStreet: o.delivery_street,
        trackingToken: o.tracking_token,
        paymentStatus: o.payment_status,
        paymentMethod: o.payment_method,
        createdAt: o.created_at,
        updatedAt: o.updated_at,
      } as Order
    },
    enabled: !!id,
    refetchInterval: 10000,
  })
}

export function useCreateOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (orderData: {
      guestName?: string
      guestPhone?: string
      guestEmail?: string
      userId?: string
      items: CartItem[]
      subtotalKes: number
      deliveryFeeKes: number
      totalKes: number
      fulfillment: 'DELIVERY' | 'PICKUP'
      deliveryStreet?: string
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

      const { data: order, error: orderError } = await supabase
        .from('Order')
        .insert({
          tracking_token: trackingToken,
          user_id: orderData.userId || null,
          guest_name: orderData.guestName,
          guest_phone: orderData.guestPhone,
          guest_email: orderData.guestEmail,
          subtotal_kes: orderData.subtotalKes,
          delivery_fee_kes: orderData.deliveryFeeKes,
          total_kes: orderData.totalKes,
          fulfillment: orderData.fulfillment,
          delivery_area: orderData.deliveryArea,
          delivery_landmark: orderData.deliveryLandmark,
          delivery_street: orderData.deliveryStreet,
          delivery_town: orderData.deliveryTown,
          notes: orderData.notes,
          status: 'PENDING',
          payment_method: orderData.paymentMethod,
        })
        .select()
        .single()

      if (orderError) throw orderError

      const orderItems = orderData.items.map((item) => ({
        order_id: order.id,
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        unit_price_kes: item.product.priceKes,
        total_price_kes: item.product.priceKes * item.quantity,
      }))

      const { error: itemsError } = await supabase
        .from('OrderItem')
        .insert(orderItems)

      if (itemsError) throw itemsError

      await notifyClare(order, orderData.items)

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
      `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${message}&apikey=${apikey}`
    )
  } catch {
    // Never block order on notification failure
  }
}

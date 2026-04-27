import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useAdminOrders(status?: string) {
  return useQuery({
    queryKey: ['admin', 'orders', status],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query: any = supabase
        .from('Order')
        .select('*, items:OrderItem(*)')
        .order('createdAt', { ascending: false })

      if (status && status !== 'all') {
        query = query.eq('status', status.toUpperCase())
      }

      const { data, error } = await query
      if (error) throw error
      return (data as any[]).map(o => ({
        ...o,
        guestName: o.guest_name,
        guestPhone: o.guest_phone,
        guestEmail: o.guest_email,
        totalKes: o.total_kes,
        paymentStatus: o.payment_status,
        createdAt: o.created_at,
        deliveryStreet: o.delivery_street,
      }))
    },
    refetchInterval: 30000,
  })
}

export function useAdminOrderDetail(orderId: string | number | null) {
  return useQuery({
    queryKey: ['admin', 'order', orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Order')
        .select('*, items:OrderItem(*)')
        .eq('id', orderId)
        .single()
      if (error) throw error
      const o = data as any
      return {
        ...o,
        guestName: o.guest_name,
        guestPhone: o.guest_phone,
        guestEmail: o.guest_email,
        totalKes: o.total_kes,
        paymentStatus: o.payment_status,
        createdAt: o.created_at,
        deliveryStreet: o.delivery_street,
        items: (o.items || []).map((it: any) => ({
          ...it,
          productName: it.product_name,
          unitPriceKes: it.unit_price_kes,
          totalPriceKes: it.total_price_kes,
        }))
      }
    },
    enabled: orderId != null,
  })
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      orderId,
      status,
      paymentStatus,
    }: {
      orderId: string | number
      status?: string
      paymentStatus?: string
    }) => {
      const updates: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      }
      if (status) updates.status = status.toUpperCase()
      if (paymentStatus) updates.payment_status = paymentStatus.toUpperCase()

      const { error } = await supabase
        .from('Order')
        .update(updates)
        .eq('id', orderId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'order'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
    },
  })
}

export function useAdminCustomers() {
  return useQuery({
    queryKey: ['admin', 'customers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('User')
        .select('*')
        .order('createdAt', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export function useAdminCustomOrders(status?: string) {
  return useQuery({
    queryKey: ['admin', 'custom-orders', status],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query: any = supabase
        .from('CustomOrder')
        .select('*')
        .order('createdAt', { ascending: false })

      if (status && status !== 'all') {
        query = query.eq('status', status.toUpperCase())
      }

      const { data, error } = await query
      if (error) throw error
      return data
    },
    refetchInterval: 60000,
  })
}

export function useUpdateCustomOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      status,
      adminNotes,
    }: {
      id: string | number
      status?: string
      adminNotes?: string
    }) => {
      const updates: Record<string, unknown> = {}
      if (status) updates.status = status
      if (adminNotes !== undefined) updates.adminNotes = adminNotes

      const { error } = await supabase
        .from('CustomOrder')
        .update(updates)
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'custom-orders'] })
    },
  })
}

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const [ordersResult, revenueResult, pendingResult, customResult, allOrdersResult, customersResult] =
        await Promise.all([
          supabase
            .from('Order')
            .select('id', { count: 'exact', head: true })
            .gte('createdAt', today.toISOString()),
          supabase
            .from('Order')
            .select('totalKes')
            .eq('paymentStatus', 'PAID')
            .gte('createdAt', today.toISOString()),
          supabase
            .from('Order')
            .select('id', { count: 'exact', head: true })
            .in('status', ['PENDING', 'CONFIRMED']),
          supabase
            .from('CustomOrder')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'NEW'),
          supabase
            .from('Order')
            .select('id, totalKes, createdAt'),
          supabase
            .from('User')
            .select('id', { count: 'exact', head: true }),
        ])

      const todayRevenue = (revenueResult.data || []).reduce(
        (sum: number, o: Record<string, unknown>) => sum + (Number(o.totalKes) || 0),
        0
      )

      const allOrders = allOrdersResult.data || []
      const last30 = allOrders.filter((o: Record<string, unknown>) => {
        const d = new Date(o.createdAt as string)
        return d >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      })

      return {
        orders: {
          count: allOrders.length,
          revenue: allOrders.reduce((s: number, o: Record<string, unknown>) => s + Number(o.totalKes || 0), 0),
        },
        last30: {
          count: last30.length,
          revenue: last30.reduce((s: number, o: Record<string, unknown>) => s + Number(o.totalKes || 0), 0),
        },
        todayOrders: ordersResult.count || 0,
        todayRevenue,
        pendingOrders: pendingResult.count || 0,
        customRequests: customResult.count || 0,
        newCustomOrders: customResult.count || 0,
        products: 0, // products are in Sanity, not Supabase
        customers: customersResult.count || 0,
        unreadMessages: 0,
        recent: [],
      }
    },
    refetchInterval: 30000,
  })
}

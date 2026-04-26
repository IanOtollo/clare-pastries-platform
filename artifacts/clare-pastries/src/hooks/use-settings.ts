import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { SiteSettings } from '@/types'

const DEFAULT_SETTINGS: SiteSettings = {
  businessName: 'Clare Pastries',
  phone: '+254724848228',
  location: 'Busia Town, Kenya',
  deliveryFeeKes: 100,
  deliveryEstimate: '45–90 minutes',
  pickupEstimate: '30–60 minutes',
  announcementBanner: {
    enabled: false,
    message: '',
    bgColor: 'bg-primary'
  }
}

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('id', 'global')
        .single()
        
      if (error || !data) {
        console.warn('Failed to load settings from Supabase, using defaults', error)
        return DEFAULT_SETTINGS
      }
      
      return {
        businessName: data.business_name,
        phone: data.phone,
        location: data.location,
        deliveryFeeKes: data.delivery_fee_kes,
        deliveryEstimate: data.delivery_estimate,
        pickupEstimate: data.pickup_estimate,
        announcementBanner: {
          enabled: data.announcement_enabled,
          message: data.announcement_message || '',
          bgColor: data.announcement_bg_color || 'bg-primary'
        }
      } as SiteSettings
    },
    staleTime: 1800000,
  })
}

import { useQuery } from '@tanstack/react-query'
import { sanityFetch } from '@/lib/sanity'
import { SiteSettings } from '@/types'

const SETTINGS_QUERY = `
  *[_type == "siteSettings"][0] {
    businessName,
    phone,
    location,
    deliveryFeeKes,
    deliveryEstimate,
    pickupEstimate,
    announcementBanner
  }
`

const DEFAULT_SETTINGS: SiteSettings = {
  businessName: 'Clare Pastries',
  phone: '+254724848228',
  location: 'Busia Town, Kenya',
  deliveryFeeKes: 100,
  deliveryEstimate: '45–90 minutes',
  pickupEstimate: '30–60 minutes',
}

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const settings = await sanityFetch<SiteSettings>(SETTINGS_QUERY)
      return settings || DEFAULT_SETTINGS
    },
    staleTime: 1800000,
  })
}

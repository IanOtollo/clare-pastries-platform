import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { GalleryImage } from '@/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapGallery = (row: any): GalleryImage => ({
  _id: row.id,
  id: row.id,
  title: row.title,
  category: row.category,
  caption: row.caption || undefined,
  imageUrl: row.image_url,
  imageAlt: row.title,
  linkedProductSlug: row.product_slug || undefined,
  productId: undefined // we don't strictly need it if we have slug
})

export function useGallery(category?: string) {
  return useQuery({
    queryKey: ['gallery', category],
    queryFn: async () => {
      let query = supabase
        .from('gallery_images')
        .select('*')
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false })
        
      if (category && category !== 'all' && category !== 'All') {
        query = query.ilike('category', category)
      }
      
      const { data, error } = await query
      if (error) throw error
      
      return data.map(mapGallery)
    },
    staleTime: 300000,
  })
}

// Shim for legacy useListGallery calls
export function useListGallery(params?: { category?: string }) {
  return useGallery(params?.category)
}

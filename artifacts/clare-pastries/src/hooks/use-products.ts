import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Product } from '@/types'

// Helper to map DB row to frontend Product type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapProduct = (row: any): Product => ({
  id: row.id,
  _id: row.id,
  name: row.name,
  slug: { current: row.slug },
  category: row.category as any,
  shortDescription: row.short_description,
  description: row.description,
  priceKes: row.price_kes,
  available: row.available,
  featured: row.featured,
  ingredients: row.ingredients || [],
  allergens: row.allergens || [],
  servings: undefined, // Add to schema if needed
  preparationTime: undefined,
  images: row.image_url ? [{ alt: row.name, url: row.image_url }] : [],
  imageUrl: row.image_url,
  inStock: row.available
})

export function useProducts(category?: string) {
  return useQuery({
    queryKey: ['products', category],
    queryFn: async () => {
      let query = supabase.from('products').select('*').order('created_at', { ascending: false })
      
      if (category && category !== 'all' && category !== 'All') {
        query = query.ilike('category', category)
      }
      
      const { data, error } = await query
      if (error) throw error
      
      return data.map(mapProduct)
    },
    staleTime: 60000,
  })
}

export function useFeaturedProducts() {
  return useQuery({
    queryKey: ['products', 'featured'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('featured', true)
        .eq('available', true)
        .limit(6)
      
      if (error) throw error
      return data.map(mapProduct)
    },
    staleTime: 120000,
  })
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('slug', slug)
        .single()
        
      if (error) throw error
      return mapProduct(data)
    },
    enabled: !!slug,
    staleTime: 300000,
  })
}

// Shim for legacy useListProducts({ featured }) calls
export function useListProducts(
  params?: { featured?: boolean; category?: string },
  _opts?: unknown
) {
  const category = params?.category
  
  return useQuery({
    queryKey: ['products', 'list', params],
    queryFn: async () => {
      let query = supabase.from('products').select('*')
      
      if (params?.featured) {
        query = query.eq('featured', true).eq('available', true).limit(6)
      } else {
        query = query.order('created_at', { ascending: false })
      }
      
      if (category && category !== 'all' && category !== 'All') {
        query = query.ilike('category', category)
      }
      
      const { data, error } = await query
      if (error) throw error
      
      return data.map(mapProduct)
    },
    staleTime: 60000,
  })
}

import { useQuery } from '@tanstack/react-query'
import { sanityFetch } from '@/lib/sanity'
import { Product } from '@/types'

const ALL_PRODUCTS_QUERY = `
  *[_type == "product"] | order(available desc, publishedAt desc) {
    _id,
    "id": _id,
    name,
    slug,
    category,
    shortDescription,
    priceKes,
    available,
    featured,
    ingredients,
    allergens,
    servings,
    preparationTime,
    "images": images[]{
      alt,
      "url": asset->url
    },
    "imageUrl": images[0].asset->url,
    "inStock": available
  }
`

const FEATURED_PRODUCTS_QUERY = `
  *[_type == "product" && featured == true
    && available == true] | order(publishedAt desc) [0...6] {
    _id,
    "id": _id,
    name,
    slug,
    category,
    shortDescription,
    priceKes,
    available,
    featured,
    "images": images[]{
      alt,
      "url": asset->url
    },
    "imageUrl": images[0].asset->url,
    "inStock": available
  }
`

export function useProducts(category?: string) {
  return useQuery({
    queryKey: ['products', category],
    queryFn: async () => {
      const products = await sanityFetch<Product[]>(ALL_PRODUCTS_QUERY)
      if (!products) return []
      if (category && category !== 'all' && category !== 'All') {
        return products.filter((p) => p.category?.toLowerCase() === category.toLowerCase())
      }
      return products
    },
    staleTime: 60000,
  })
}

export function useFeaturedProducts() {
  return useQuery({
    queryKey: ['products', 'featured'],
    queryFn: async () => {
      const products = await sanityFetch<Product[]>(FEATURED_PRODUCTS_QUERY)
      return products || []
    },
    staleTime: 120000,
  })
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: async () => {
      const query = `
        *[_type == "product" && slug.current == $slug][0] {
          _id,
          "id": _id,
          name,
          slug,
          category,
          description,
          shortDescription,
          priceKes,
          available,
          featured,
          ingredients,
          allergens,
          servings,
          preparationTime,
          "images": images[]{
            alt,
            "url": asset->url
          },
          "imageUrl": images[0].asset->url,
          "inStock": available
        }
      `
      return await sanityFetch<Product>(query, { slug })
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
  const query = useQuery({
    queryKey: ['products', 'list', params],
    queryFn: async () => {
      const q = params?.featured ? FEATURED_PRODUCTS_QUERY : ALL_PRODUCTS_QUERY
      const products = await sanityFetch<Product[]>(q)
      if (!products) return []
      if (category && category !== 'all' && category !== 'All') {
        return products.filter((p) => p.category?.toLowerCase() === category.toLowerCase())
      }
      return products
    },
    staleTime: 60000,
  })
  return query
}

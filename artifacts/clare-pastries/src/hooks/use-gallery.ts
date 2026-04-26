import { useQuery } from '@tanstack/react-query'
import { sanityFetch } from '@/lib/sanity'
import { GalleryImage } from '@/types'

const GALLERY_QUERY = `
  *[_type == "galleryImage"]
  | order(featured desc, publishedAt desc) {
    _id,
    "id": _id,
    title,
    category,
    caption,
    "imageUrl": image.asset->url,
    "imageAlt": image.alt,
    "linkedProductSlug": linkedProduct->slug.current,
    "productId": linkedProduct->_id
  }
`

export function useGallery(category?: string) {
  return useQuery({
    queryKey: ['gallery', category],
    queryFn: async () => {
      const images = await sanityFetch<GalleryImage[]>(GALLERY_QUERY)
      if (!images) return []
      if (category && category !== 'all' && category !== 'All') {
        return images.filter(
          (img) => img.category?.toLowerCase() === category.toLowerCase()
        )
      }
      return images
    },
    staleTime: 300000,
  })
}

// Shim for legacy useListGallery calls
export function useListGallery(params?: { category?: string }) {
  return useGallery(params?.category)
}

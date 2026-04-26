import { createClient } from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'

export const sanityClient = createClient({
  projectId: import.meta.env.VITE_SANITY_PROJECT_ID || 'dx9kuri1',
  dataset: import.meta.env.VITE_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: true,
})

const builder = imageUrlBuilder(sanityClient)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function urlFor(source: any) {
  return builder.image(source)
}

export async function sanityFetch<T>(
  query: string,
  params?: Record<string, unknown>
): Promise<T | null> {
  try {
    if (!import.meta.env.VITE_SANITY_PROJECT_ID && !('dx9kuri1')) {
      console.warn('Sanity Project ID not configured')
      return null
    }
    return await sanityClient.fetch<T>(query, params ?? {})
  } catch (error) {
    console.error('Sanity fetch error:', error)
    return null
  }
}

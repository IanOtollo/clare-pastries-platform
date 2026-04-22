import { createClient } from "@sanity/client";
import imageUrlBuilder from "@sanity/image-url";

// Public, read-only client for the storefront.
// Project ID is committed because Sanity treats it as public.
export const sanityClient = createClient({
  projectId: "dx9kuri1",
  dataset: "production",
  apiVersion: "2024-01-01",
  useCdn: true,
});

const builder = imageUrlBuilder(sanityClient);

type SanityImageSource = Parameters<ReturnType<typeof imageUrlBuilder>["image"]>[0];

export function urlFor(source: SanityImageSource) {
  return builder.image(source);
}

export interface SanityGalleryItem {
  _id: string;
  title?: string;
  caption?: string;
  image?: SanityImageSource;
}

/**
 * Fetch gallery items. We try a few common schema shapes so this works
 * even before a strict schema is published. Returns [] on any failure.
 */
export async function fetchGalleryItems(): Promise<SanityGalleryItem[]> {
  try {
    const query = `*[_type in ["gallery", "galleryItem", "bake", "post"] && defined(image)]
      | order(coalesce(publishedAt, _createdAt) desc)[0...24]{
        _id, title, caption, image
      }`;
    const data = await sanityClient.fetch<SanityGalleryItem[]>(query);
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.warn("[sanity] gallery fetch failed:", e);
    return [];
  }
}

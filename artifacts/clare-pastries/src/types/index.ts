export interface Product {
  id: string
  _id: string
  name: string
  slug: { current: string }
  category: 'cakes' | 'pastries' | 'breads' | 'seasonal'
  shortDescription?: string
  description?: string
  priceKes: number
  available: boolean
  featured: boolean
  ingredients?: string[]
  allergens?: string[]
  servings?: string
  preparationTime?: string
  images?: { alt: string; url: string }[]
  // Legacy flat fields used by product-card
  imageUrl?: string
  inStock?: boolean
}

export interface GalleryImage {
  _id: string
  id?: string
  title: string
  category: string
  caption?: string
  imageUrl: string
  imageAlt?: string
  linkedProductSlug?: string
  productId?: string
}

export interface Order {
  id: string
  trackingToken: string
  userId?: string
  customerName?: string
  customerPhone?: string
  customerEmail?: string
  items: OrderItem[]
  subtotalKes: number
  deliveryFeeKes: number
  totalKes: number
  displayCurrency: string
  displayTotal: number
  fulfillmentType: 'DELIVERY' | 'PICKUP'
  deliveryArea?: string
  deliveryLandmark?: string
  deliveryAddress?: string
  deliveryTown?: string
  status: OrderStatus
  paymentStatus: 'UNPAID' | 'PAID' | 'REFUNDED'
  paymentMethod: 'MPESA' | 'CASH' | 'CARD'
  mpesaRef?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'BAKING'
  | 'READY'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'COLLECTED'
  | 'CANCELLED'

export interface OrderItem {
  id: string
  orderId: string
  productId: string
  productName: string
  quantity: number
  unitPriceKes: number
  totalPriceKes: number
}

export interface CartProduct {
  id: string
  name: string
  priceKes: number
  imageUrl?: string
  category?: string
  slug?: string
}

export interface CartItem {
  product: CartProduct
  quantity: number
}

export interface CustomOrder {
  id: string
  fullName: string
  phone: string
  email?: string
  occasion: string
  description: string
  flavors?: string
  servings?: number
  preferredDate?: string
  fulfillment: string
  deliveryArea?: string
  budgetRange?: string
  budget?: string
  notes?: string
  adminNotes?: string
  status: string
  createdAt: string
}

export interface User {
  id: string
  email: string
  name?: string
  phone?: string
  role: 'CUSTOMER' | 'ADMIN' | 'STAFF'
  createdAt?: string
}

export interface SiteSettings {
  businessName: string
  phone: string
  location: string
  deliveryFeeKes: number
  deliveryEstimate: string
  pickupEstimate: string
  announcementBanner?: {
    enabled: boolean
    message: string
    bgColor: string
  }
}

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartProduct {
  id: string;
  name: string;
  priceKes: number;
  imageUrl?: string;
  category?: string;
  slug?: string;
}

export interface CartItem {
  product: CartProduct;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (product: CartProduct, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      itemCount: 0,
      subtotal: 0,
      addItem: (product: CartProduct, quantity: number = 1) => {
        set((state: CartState) => {
          const items = Array.isArray(state.items) ? state.items : [];
          const existingItem = items.find(
            (item) => item.product.id === product.id
          );
          const newItems = existingItem
            ? items.map((item) =>
                item.product.id === product.id
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              )
            : [...items, { product, quantity }];
          
          const itemCount = newItems.reduce((t, it) => t + it.quantity, 0);
          const subtotal = newItems.reduce((t, it) => t + it.product.priceKes * it.quantity, 0);
          
          return { items: newItems, itemCount, subtotal };
        });
      },
      removeItem: (productId: string) => {
        set((state: CartState) => {
          const newItems = Array.isArray(state.items)
            ? state.items.filter((item) => item.product.id !== productId)
            : [];
          const itemCount = newItems.reduce((t, it) => t + it.quantity, 0);
          const subtotal = newItems.reduce((t, it) => t + it.product.priceKes * it.quantity, 0);
          return { items: newItems, itemCount, subtotal };
        });
      },
      updateQuantity: (productId: string, quantity: number) => {
        set((state: CartState) => {
          const newItems = Array.isArray(state.items)
            ? state.items.map((item) =>
                item.product.id === productId ? { ...item, quantity } : item
              )
            : [];
          const itemCount = newItems.reduce((t, it) => t + it.quantity, 0);
          const subtotal = newItems.reduce((t, it) => t + it.product.priceKes * it.quantity, 0);
          return { items: newItems, itemCount, subtotal };
        });
      },
      clearCart: () => set({ items: [], itemCount: 0, subtotal: 0 }),
    }),
    {
      name: 'cp-cart',
      onRehydrateStorage: () => (state) => {
        if (state && !Array.isArray(state.items)) {
          state.items = [];
        }
      },
    }
  ) as any
);

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
      addItem: (product, quantity = 1) => {
        set((state) => {
          const items = Array.isArray(state.items) ? state.items : [];
          const existingItem = items.find(
            (item) => item.product.id === product.id
          );
          if (existingItem) {
            return {
              items: items.map((item) =>
                item.product.id === product.id
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              ),
            };
          }
          return { items: [...items, { product, quantity }] };
        });
      },
      removeItem: (productId) => {
        set((state) => ({
          items: Array.isArray(state.items)
            ? state.items.filter((item) => item.product.id !== productId)
            : [],
        }));
      },
      updateQuantity: (productId, quantity) => {
        set((state) => ({
          items: Array.isArray(state.items)
            ? state.items.map((item) =>
                item.product.id === productId ? { ...item, quantity } : item
              )
            : [],
        }));
      },
      clearCart: () => set({ items: [] }),
      get itemCount() {
        const items = get().items;
        return Array.isArray(items)
          ? items.reduce((total, item) => total + item.quantity, 0)
          : 0;
      },
      get subtotal() {
        const items = get().items;
        return Array.isArray(items)
          ? items.reduce(
              (total, item) => total + item.product.priceKes * item.quantity,
              0
            )
          : 0;
      },
    }),
    {
      name: 'cp-cart',
      onRehydrateStorage: () => (state) => {
        if (state && !Array.isArray(state.items)) {
          state.items = [];
        }
      },
    }
  )
);

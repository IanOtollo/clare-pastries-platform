import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useQuery } from '@tanstack/react-query'

type Currency = 'KES' | 'UGX'

interface CurrencyState {
  currency: Currency
  setCurrency: (c: Currency) => void
  toggleCurrency: () => void
}

export const useCurrencyStore = create(
  persist<CurrencyState>(
    (set) => ({
      currency: 'KES',
      setCurrency: (currency) => set({ currency }),
      toggleCurrency: () =>
        set((state) => ({ currency: state.currency === 'KES' ? 'UGX' : 'KES' })),
    }),
    {
      name: 'cp-currency',
    }
  )
)

export function useExchangeRate() {
  return useQuery({
    queryKey: ['exchange-rate'],
    queryFn: async () => {
      try {
        const res = await fetch('https://open.er-api.com/v6/latest/KES')
        if (!res.ok) throw new Error('Failed to fetch rate')
        const data = await res.json()
        return (data.rates?.UGX as number) || 30
      } catch (err) {
        console.warn('Failed to fetch exchange rate, using fallback', err)
        return 30 // approximate fallback
      }
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  })
}

export function formatPrice(priceKes: number, currency: Currency, rate: number | undefined = 30) {
  if (currency === 'KES') {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      maximumFractionDigits: 0,
    }).format(priceKes)
  } else {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      maximumFractionDigits: 0,
    }).format(priceKes * (rate || 30))
  }
}

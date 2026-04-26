import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'
import { signIn, signOut, getUserRole } from '@/lib/auth'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseUser = any

interface AuthState {
  user: SupabaseUser | null
  role: string | null
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  initialize: () => Promise<void>
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      role: null,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null })
        try {
          const data = await signIn(email, password)
          if (data.user) {
            const role = await getUserRole(data.user.id)
            set({
              user: data.user,
              role,
              isLoading: false,
              error: null,
            })
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Invalid email or password'
          set({ error: msg, isLoading: false })
          throw err
        }
      },

      logout: async () => {
        await signOut()
        set({ user: null, role: null, error: null })
      },

      initialize: async () => {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (session?.user) {
          const role = await getUserRole(session.user.id)
          set({ user: session.user, role })
        }

        supabase.auth.onAuthStateChange(async (_event, session) => {
          if (session?.user) {
            const role = await getUserRole(session.user.id)
            set({ user: session.user, role })
          } else {
            set({ user: null, role: null })
          }
        })
      },
    }),
    {
      name: 'cp-auth',
      partialize: (state: AuthState) => ({
        user: state.user,
        role: state.role,
      }),
    }
  ) as any
)

// Legacy hook shims so existing components keep working
export function useLogin() {
  const { login, isLoading, error } = useAuth()
  return {
    mutate: (
      input: { email: string; password: string },
      opts?: { onSuccess?: (data: unknown) => void; onError?: (err: unknown) => void }
    ) => {
      login(input.email, input.password)
        .then(() => opts?.onSuccess?.({ user: useAuth.getState().user }))
        .catch((err) => opts?.onError?.(err))
    },
    isPending: isLoading,
    isError: !!error,
    error: error ? new Error(error) : null,
  }
}

export function useLogout() {
  const { logout } = useAuth()
  return {
    mutate: (
      _input?: undefined,
      opts?: { onSuccess?: () => void }
    ) => {
      logout().then(() => opts?.onSuccess?.())
    },
    isPending: false,
  }
}

export function useRegister() {
  return {
    mutate: async (
      input: { name: string; email: string; password: string; phone?: string },
      opts?: { onSuccess?: () => void; onError?: (err: unknown) => void }
    ) => {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: input.email,
          password: input.password,
          options: { data: { name: input.name } },
        })
        if (error) throw error
        if (data.user) {
          await supabase.from('User').insert({
            id: data.user.id,
            email: input.email,
            name: input.name,
            phone: input.phone || null,
            role: 'CUSTOMER',
          })
          const role = await getUserRole(data.user.id)
          useAuth.setState({ user: data.user, role })
          opts?.onSuccess?.()
        }
      } catch (err) {
        opts?.onError?.(err)
      }
    },
    isPending: false,
    isError: false,
    error: null,
  }
}

export type AuthUser = {
  id: string
  email: string
  name?: string
  role: 'ADMIN' | 'STAFF' | 'CUSTOMER'
}

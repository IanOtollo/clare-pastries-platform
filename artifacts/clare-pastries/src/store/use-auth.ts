import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiSend } from "@/lib/api";

export type AuthUser = {
  id: number;
  email: string;
  name: string;
  role: "ADMIN" | "STAFF" | "CUSTOMER";
};

export function useAuth() {
  const query = useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      try {
        const data = await apiGet<{ user: AuthUser }>("/auth/me");
        return data.user;
      } catch {
        return null;
      }
    },
    retry: false,
    staleTime: 60_000,
  });
  return {
    user: query.data ?? null,
    loading: query.isLoading,
    refetch: query.refetch,
  };
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { email: string; password: string }) =>
      apiSend<{ user: AuthUser }>("/auth/login", "POST", input),
    onSuccess: (data) => {
      qc.setQueryData(["auth", "me"], data.user);
    },
  });
}

export function useRegister() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      name: string;
      email: string;
      password: string;
      phone?: string;
    }) => apiSend<{ user: AuthUser }>("/auth/register", "POST", input),
    onSuccess: (data) => {
      qc.setQueryData(["auth", "me"], data.user);
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiSend<{ ok: true }>("/auth/logout", "POST"),
    onSuccess: () => {
      qc.setQueryData(["auth", "me"], null);
      qc.invalidateQueries();
    },
  });
}

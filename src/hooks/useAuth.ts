import { useAuthStore } from "@/store/auth.store";

export function useAuth() {
  const session = useAuthStore((s) => s.session);
  const profile = useAuthStore((s) => s.profile);
  const isLoading = useAuthStore((s) => s.isLoading);

  return {
    user: session?.user ?? null,
    session,
    profile,
    role: profile?.role ?? null,
    isAuthenticated: !!session,
    isLoading,
  };
}

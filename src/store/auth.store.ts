import { create } from "zustand";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { fetchProfile } from "@/api/auth.api";
import type { Profile } from "@/types";

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isInitialized: boolean;
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  refreshProfile: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  profile: null,
  isLoading: true,
  isInitialized: false,

  setSession: (session) => set({ session }),
  setProfile: (profile) => set({ profile }),

  refreshProfile: async () => {
    const { session } = get();
    if (!session?.user) {
      set({ profile: null });
      return;
    }
    try {
      const profile = await fetchProfile(session.user.id);
      set({ profile: profile as Profile });
    } catch (err) {
      console.error("Failed to load profile:", err);
      set({ profile: null });
    }
  },

  initialize: async () => {
    set({ isLoading: true });
    const { data } = await supabase.auth.getSession();
    set({ session: data.session });
    if (data.session?.user) {
      await get().refreshProfile();
    }
    set({ isLoading: false, isInitialized: true });

    supabase.auth.onAuthStateChange(async (_event, session) => {
      set({ session });
      if (session?.user) {
        await get().refreshProfile();
      } else {
        set({ profile: null });
      }
    });
  },
}));

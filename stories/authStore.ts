import { create } from "zustand";
import { Session, User } from "@supabase/supabase-js";
import { supabase, Database } from "../services/supabase";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;

  // Actions
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  profile: null,
  isLoading: true,

  setSession: (session) =>
    set({
      session,
      user: session?.user ?? null,
    }),

  setProfile: (profile) => set({ profile }),

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null, profile: null });
  },

  // Dipanggil sekali saat app pertama buka
  initialize: async () => {
    set({ isLoading: true });

    // Cek apakah ada session yang tersimpan
    const {
      data: { session },
    } = await supabase.auth.getSession();
    set({ session, user: session?.user ?? null });

    // Load profile kalau sudah login
    if (session?.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();
      set({ profile });
    }

    set({ isLoading: false });

    // Listen perubahan auth state (login, logout, token refresh)
    // Ini BERBEDA dengan web — di mobile kita perlu listener ini
    // karena token bisa expire saat app di-background
    supabase.auth.onAuthStateChange(async (_event, session) => {
      set({ session, user: session?.user ?? null });

      if (session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();
        set({ profile });
      } else {
        set({ profile: null });
      }
    });
  },
}));

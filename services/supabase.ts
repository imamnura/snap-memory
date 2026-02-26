import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";

// Type untuk database kita nanti bisa di generate otomatis dari supabase CLI
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string | null;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["profiles"]["Row"],
          "created_at"
        >;
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      memories: {
        Row: {
          id: string;
          user_id: string;
          title: string | null;
          story: string | null;
          location_name: string | null;
          latitude: number | null;
          longitude: number | null;
          mood: string | null;
          tags: string[];
          is_synced: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["memories"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["memories"]["Insert"]>;
      };
      photos: {
        Row: {
          id: string;
          memory_id: string;
          user_id: string;
          storage_path: string;
          local_uri: string | null;
          caption: string | null;
          width: number | null;
          height: number | null;
          order_index: number;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["photos"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<Database["public"]["Tables"]["photos"]["Insert"]>;
      };
    };
  };
};

// Custom storage adapter pakai SecureStore
// Ini yang membedakan dari web — di browser pakai localStorage,
// di mobile kita pakai SecureStore yang terenkripsi di keychain/keystore
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Pakai SecureStore bukan localStorage
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // false untuk mobile, true untuk web
  },
});

export type MoodType = "happy" | "good" | "okay" | "sad" | "awful";

export interface Photo {
  id: string;
  memory_id: string;
  user_id: string;
  storage_path: string;
  local_url: string | null;
  caption: string | null;
  width: number | null;
  height: number | null;
  order_index: number;
  created_at: string;
}

export interface Memory {
  id: string;
  user_id: string;
  title: string | null;
  story: string | null;
  location_name: string | null;
  latitude: number | null;
  longitude: number | null;
  mood: MoodType | null;
  tags: string[];
  is_synced: boolean;
  created_at: string;
  updated_at: string;
  // Joined dari tabel photos
  photos?: Photo[];
}

// Foto yang baru dipilih dari kamera/galeri, belum diupload
export interface LocalPhoto {
  uri: string; // local file URI
  width: number;
  height: number;
  fileName?: string;
}

// Untuk form create memory (belum punya id, created_at, dll)
export interface NewMemoryForm {
  title: string;
  photos: LocalPhoto[];
  mood: MoodType | null;
  location_name: string | null;
  latitude: number | null;
  longitude: number | null;
}

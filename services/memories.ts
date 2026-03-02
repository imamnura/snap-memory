import { supabase } from "./supabase";
import type { Database } from "./supabase";
import { uploadPhoto } from "./storage";
import { Memory, NewMemoryForm } from "../types";

type MemoryInsert = Database["public"]["Tables"]["memories"]["Insert"];
type PhotoInsert = Database["public"]["Tables"]["photos"]["Insert"];

// Ambil semua memories user (dengan foto pertama untuk thumbnail)
export async function getMemories(userId: string): Promise<Memory[]> {
  const { data, error } = await supabase
    .from("memories")
    .select(
      `
      *,
      photos (*)
    `,
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as Memory[];
}

// Ambil satu memory by ID
export async function getMemoryById(id: string): Promise<Memory> {
  const { data, error } = await supabase
    .from("memories")
    .select(`*, photos (*)`)
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as Memory;
}

// Buat memory baru beserta upload foto-fotonya
export async function createMemory(
  form: NewMemoryForm,
  userId: string,
): Promise<Memory> {
  // 1. Insert memory dulu untuk dapat ID
  const memoryInsert: MemoryInsert = {
    user_id: userId,
    title: form.title || null,
    story: null,
    location_name: form.location_name,
    latitude: form.latitude,
    longitude: form.longitude,
    mood: form.mood,
    tags: [],
    is_synced: false,
  };

  const { data: memoryRow, error: memoryError } = await supabase
    .from("memories")
    .insert(memoryInsert as never)
    .select()
    .single();

  if (memoryError) throw memoryError;
  const memory = memoryRow as { id: string } | null;
  if (!memory) throw new Error("Memory insert returned no data");

  // 2. Upload semua foto secara parallel
  const photoUploads = await Promise.all(
    form.photos.map(async (photo, index) => {
      const storagePath = await uploadPhoto(
        photo.uri,
        userId,
        memory.id,
        index,
      );
      return {
        memory_id: memory.id,
        user_id: userId,
        storage_path: storagePath,
        local_uri: photo.uri,
        width: photo.width,
        height: photo.height,
        order_index: index,
      } as PhotoInsert;
    }),
  );

  // 3. Insert semua record foto ke database
  const { error: photosError } = await supabase
    .from("photos")
    .insert(photoUploads as never);

  if (photosError) throw photosError;

  // 4. Update is_synced jadi true
  await supabase
    .from("memories")
    .update({ is_synced: true } as never)
    .eq("id", memory.id);

  return getMemoryById(memory.id);
}

// Hapus memory beserta semua fotonya
export async function deleteMemory(
  memoryId: string,
  userId: string,
): Promise<void> {
  // RLS di Supabase akan otomatis handle authorization
  const { error } = await supabase
    .from("memories")
    .delete()
    .eq("id", memoryId)
    .eq("user_id", userId);

  if (error) throw error;
}

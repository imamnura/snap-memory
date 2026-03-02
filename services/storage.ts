import * as FileSystem from "expo-file-system";
import * as ImageManipulator from "expo-image-manipulator";
import { supabase } from "./supabase";
import { LocalPhoto } from "../types";

// Compress gambar sebelum upload
// Penting untuk hemat storage dan bandwidth
export async function compressImage(uri: string): Promise<{
  uri: string;
  width: number;
  height: number;
}> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1200 } }], // Max width 1200px, height auto
    {
      compress: 0.8, // 80% quality — sweet spot size vs quality
      format: ImageManipulator.SaveFormat.JPEG,
    },
  );
  return result;
}

// Upload foto ke Supabase Storage
// Return storage path yang disimpan di database
export async function uploadPhoto(
  localUri: string,
  userId: string,
  memoryId: string,
  index: number,
): Promise<string> {
  // 1. Compress dulu
  const compressed = await compressImage(localUri);

  // 2. Baca file sebagai base 64
  const base64 = await FileSystem.readAsStringAsync(compressed.uri, {
    encoding: "base64",
  });

  // 3. COnvert base64 ke ArrayBuffer untuk supabase
  const arrayBuffer = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

  // 4. Buat path unik di storage
  // Format: userId/memoryId/0.jpg, userId/memoryId/1.jpg, dst
  const storagePath = `${userId}/${memoryId}/${index}.jpg`;

  // 5. Upload ke supabase storage
  const { error } = await supabase.storage
    .from("photos")
    .upload(storagePath, arrayBuffer, {
      contentType: "image/jpeg",
      upsert: true, // Overwrite kalau sudah ada
    });

  if (error) throw error;

  return storagePath;
}

// Ambil signed URL untuk menampilkan foto private
// Signed URL expire setelah durasi tertentu
export async function getPhotoUrl(
  storagePath: string,
  expiresIn = 3600, // 1 jam
): Promise<string> {
  const { data, error } = await supabase.storage
    .from("photos")
    .createSignedUrl(storagePath, expiresIn);

  if (error) throw error;
  return data.signedUrl;
}

// Hapus foto dari storage
export async function deletePhoto(storagePath: string): Promise<void> {
  const { error } = await supabase.storage.from("photos").remove([storagePath]);

  if (error) throw error;
  return;
}

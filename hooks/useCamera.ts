import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { Alert, Linking } from "react-native";
import { LocalPhoto } from "../types";

export function useCamera() {
  const [isLoading, setIsLoading] = useState(false);

  // Helper: arahkan ke settings HP kalau permission denied
  const openSettings = () => {
    Alert.alert("Izin Diperlukan", "Buka Settings untuk mengizinkan akses.", [
      { text: "Batal", style: "cancel" },
      { text: "Buka Settings", onPress: () => Linking.openSettings() },
    ]);
  };

  // Ambil foto dari kamera (izin kamera lewat ImagePicker, sama dengan launchCameraAsync)
  const takePhoto = async (): Promise<LocalPhoto | null> => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status === "denied") {
      openSettings();
      return null;
    }

    setIsLoading(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1, // Ambil kualitas penuh, kita compress sendiri nanti
        allowsEditing: true,
        aspect: [4, 3],
      });

      if (result.canceled) return null;

      const asset = result.assets[0];
      return {
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
        fileName: asset.fileName ?? undefined,
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Import foto dari galeri (support multiple)
  const pickFromGallery = async (multiple = true): Promise<LocalPhoto[]> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status === "denied") {
      openSettings();
      return [];
    }

    setIsLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
        allowsMultipleSelection: multiple, // Pilih banyak foto sekaligus
        selectionLimit: 10, // Max 10 foto
        orderedSelection: true, // Pertahankan urutan pilihan
      });

      if (result.canceled) return [];

      return result.assets.map((asset) => ({
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
        fileName: asset.fileName ?? undefined,
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return { takePhoto, pickFromGallery, isLoading };
}

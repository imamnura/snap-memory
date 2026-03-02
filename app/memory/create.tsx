import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { Image } from "expo-image";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  FadeOut,
  Layout,
} from "react-native-reanimated";
import { useCamera } from "../../hooks/useCamera";
import { useCreateMemory } from "../../hooks/useMemories";
import { LocalPhoto, MoodType } from "../../types";

const MOODS: { type: MoodType; emoji: string; label: string }[] = [
  { type: "happy", emoji: "😄", label: "Happy" },
  { type: "good", emoji: "🙂", label: "Good" },
  { type: "okay", emoji: "😐", label: "Okay" },
  { type: "sad", emoji: "😔", label: "Sad" },
  { type: "awful", emoji: "😢", label: "Awful" },
];

// Komponen thumbnail foto dengan tombol hapus
function PhotoThumbnail({
  photo,
  onRemove,
}: {
  photo: LocalPhoto;
  onRemove: () => void;
}) {
  // Animasi scale saat pertama muncul
  const scale = useSharedValue(0);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Jalankan animasi saat mount
  useState(() => {
    scale.value = withSpring(1, { damping: 12 });
  });

  return (
    // Entering/Exiting adalah animasi preset Reanimated 3
    // Jauh lebih simple dari bikin manual
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(200)}
      layout={Layout.springify()} // Animasi layout saat item dihapus
      style={[styles.thumbnail, animStyle]}
    >
      <Image
        source={{ uri: photo.uri }}
        style={styles.thumbnailImage}
        contentFit="cover"
      />
      <TouchableOpacity style={styles.removeBtn} onPress={onRemove}>
        <Text style={styles.removeBtnText}>✕</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function CreateMemoryScreen() {
  const [title, setTitle] = useState("");
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [photos, setPhotos] = useState<LocalPhoto[]>([]);

  const { takePhoto, pickFromGallery, isLoading: cameraLoading } = useCamera();
  const createMemory = useCreateMemory();

  const handleAddPhoto = () => {
    Alert.alert("Tambah Foto", "Pilih sumber foto", [
      {
        text: "Kamera",
        onPress: async () => {
          const photo = await takePhoto();
          if (photo) setPhotos((prev) => [...prev, photo]);
        },
      },
      {
        text: "Galeri",
        onPress: async () => {
          const picked = await pickFromGallery();
          // Gabungkan foto baru, hindari duplikat
          setPhotos((prev) => {
            const existingUris = new Set(prev.map((p) => p.uri));
            const newPhotos = picked.filter((p) => !existingUris.has(p.uri));
            return [...prev, ...newPhotos];
          });
        },
      },
      { text: "Batal", style: "cancel" },
    ]);
  };

  const handleRemovePhoto = (uri: string) => {
    setPhotos((prev) => prev.filter((p) => p.uri !== uri));
  };

  const handleSave = async () => {
    if (photos.length === 0) {
      Alert.alert("Oops!", "Tambahkan minimal 1 foto.");
      return;
    }

    try {
      await createMemory.mutateAsync({
        title,
        photos,
        mood: selectedMood,
        location_name: null,
        latitude: null,
        longitude: null,
      });

      router.back();
    } catch (error) {
      Alert.alert("Error", "Gagal menyimpan memory. Coba lagi.");
    }
  };

  const isSaving = createMemory.isPending;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Memory Baru</Text>
        <TouchableOpacity
          style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>Simpan</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Section Foto */}
        <Text style={styles.sectionLabel}>Foto</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.photoList}
        >
          {/* Tombol tambah foto */}
          <TouchableOpacity
            style={styles.addPhotoBtn}
            onPress={handleAddPhoto}
            disabled={cameraLoading}
          >
            {cameraLoading ? (
              <ActivityIndicator color="#6C63FF" />
            ) : (
              <>
                <Text style={styles.addPhotoIcon}>📷</Text>
                <Text style={styles.addPhotoText}>Tambah</Text>
              </>
            )}
          </TouchableOpacity>

          {/* List foto yang sudah dipilih */}
          {photos.map((photo) => (
            <PhotoThumbnail
              key={photo.uri}
              photo={photo}
              onRemove={() => handleRemovePhoto(photo.uri)}
            />
          ))}
        </ScrollView>

        {/* Section Judul */}
        <Text style={styles.sectionLabel}>Judul (opsional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Beri judul memory ini..."
          placeholderTextColor="#555"
          value={title}
          onChangeText={setTitle}
          maxLength={100}
        />

        {/* Section Mood */}
        <Text style={styles.sectionLabel}>Mood</Text>
        <View style={styles.moodRow}>
          {MOODS.map((mood) => (
            <TouchableOpacity
              key={mood.type}
              style={[
                styles.moodBtn,
                selectedMood === mood.type && styles.moodBtnSelected,
              ]}
              onPress={() =>
                setSelectedMood(selectedMood === mood.type ? null : mood.type)
              }
            >
              <Text style={styles.moodEmoji}>{mood.emoji}</Text>
              <Text
                style={[
                  styles.moodLabel,
                  selectedMood === mood.type && styles.moodLabelSelected,
                ]}
              >
                {mood.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F0F0F" },
  content: { padding: 20, paddingBottom: 40 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 16,
    backgroundColor: "#0F0F0F",
    borderBottomWidth: 1,
    borderBottomColor: "#1C1C1E",
  },
  headerTitle: { fontSize: 17, fontWeight: "600", color: "#fff" },
  closeBtn: { padding: 8 },
  closeBtnText: { color: "#666", fontSize: 18 },
  saveBtn: {
    backgroundColor: "#6C63FF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: "#fff", fontWeight: "600" },

  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
    marginTop: 24,
  },

  photoList: { gap: 12, paddingRight: 20 },
  addPhotoBtn: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#333",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  addPhotoIcon: { fontSize: 24 },
  addPhotoText: { fontSize: 12, color: "#666" },

  thumbnail: { width: 100, height: 100, borderRadius: 12, overflow: "hidden" },
  thumbnailImage: { width: "100%", height: "100%" },
  removeBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.6)",
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  removeBtnText: { color: "#fff", fontSize: 11, fontWeight: "700" },

  input: {
    backgroundColor: "#1C1C1E",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#fff",
    borderWidth: 1,
    borderColor: "#2C2C2E",
  },

  moodRow: { flexDirection: "row", justifyContent: "space-between" },
  moodBtn: {
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "transparent",
    flex: 1,
    marginHorizontal: 3,
  },
  moodBtnSelected: { borderColor: "#6C63FF", backgroundColor: "#6C63FF15" },
  moodEmoji: { fontSize: 24, marginBottom: 4 },
  moodLabel: { fontSize: 11, color: "#666" },
  moodLabelSelected: { color: "#6C63FF", fontWeight: "600" },
});

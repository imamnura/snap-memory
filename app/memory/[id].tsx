import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Image } from "expo-image";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { getMemoryById } from "../../services/memories";
import { getPhotoUrl } from "../../services/storage";
import { memoryKeys } from "../../hooks/useMemories";
import { useDeleteMemory } from "../../hooks/useMemories";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const MOOD_EMOJI: Record<string, string> = {
  happy: "😄",
  good: "🙂",
  okay: "😐",
  sad: "😔",
  awful: "😢",
};

function PhotoWithSignedUrl({ storagePath }: { storagePath: string }) {
  const { data: photoUrl } = useQuery({
    queryKey: ["photo-url", storagePath],
    queryFn: () => getPhotoUrl(storagePath),
    enabled: !!storagePath,
    staleTime: 1000 * 55 * 60,
  });

  if (!photoUrl) {
    return (
      <View style={styles.photoPlaceholder}>
        <Text style={{ fontSize: 40 }}>📷</Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: photoUrl }}
      style={styles.detailPhoto}
      contentFit="cover"
      transition={300}
    />
  );
}

export default function MemoryDetailScreen() {
  const { id: memoryId } = useLocalSearchParams<{ id: string }>();
  const deleteMemory = useDeleteMemory();

  const { data: memory, isLoading, error } = useQuery({
    queryKey: memoryKeys.detail(memoryId ?? ""),
    queryFn: () => getMemoryById(memoryId!),
    enabled: !!memoryId,
  });

  const handleDelete = () => {
    if (!memoryId) return;
    Alert.alert(
      "Hapus Memory",
      "Memory dan semua fotonya akan dihapus. Lanjutkan?",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            await deleteMemory.mutateAsync(memoryId);
            router.back();
          },
        },
      ],
    );
  };

  if (!memoryId) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>Memory tidak ditemukan</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  if (error || !memory) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>
          Gagal memuat memory. Coba lagi.
        </Text>
      </View>
    );
  }

  const photos = memory.photos ?? [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
          <Text style={styles.deleteBtnText}>Hapus</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {photos.length > 0 ? (
          <View style={styles.photoStack}>
            {photos.map((photo) => (
              <PhotoWithSignedUrl
                key={photo.id}
                storagePath={photo.storage_path}
              />
            ))}
          </View>
        ) : (
          <View style={styles.photoPlaceholder}>
            <Text style={{ fontSize: 48 }}>📷</Text>
          </View>
        )}

        <View style={styles.body}>
          <Text style={styles.title}>{memory.title || "Memory"}</Text>
          <Text style={styles.date}>
            {format(new Date(memory.created_at), "EEEE, d MMMM yyyy", {
              locale: id,
            })}
          </Text>

          {memory.mood && (
            <View style={styles.moodRow}>
              <Text style={styles.moodEmoji}>
                {MOOD_EMOJI[memory.mood] ?? "😐"}
              </Text>
              <Text style={styles.moodLabel}>{memory.mood}</Text>
            </View>
          )}

          {memory.story ? (
            <Text style={styles.story}>{memory.story}</Text>
          ) : null}

          {memory.location_name ? (
            <View style={styles.locationRow}>
              <Text style={styles.locationIcon}>📍</Text>
              <Text style={styles.locationText}>{memory.location_name}</Text>
            </View>
          ) : null}

          {memory.tags.length > 0 ? (
            <View style={styles.tagRow}>
              {memory.tags.map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F0F0F" },
  center: { alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1C1C1E",
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnText: { color: "#fff", fontSize: 20 },
  deleteBtn: { paddingVertical: 8, paddingHorizontal: 12 },
  deleteBtnText: { color: "#FF453A", fontSize: 16, fontWeight: "600" },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  photoStack: { gap: 8 },
  detailPhoto: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
    backgroundColor: "#1C1C1E",
  },
  photoPlaceholder: {
    width: SCREEN_WIDTH,
    height: 240,
    backgroundColor: "#1C1C1E",
    alignItems: "center",
    justifyContent: "center",
  },
  body: { padding: 20, gap: 12 },
  title: { fontSize: 24, fontWeight: "700", color: "#fff" },
  date: { fontSize: 14, color: "#666" },
  moodRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  moodEmoji: { fontSize: 24 },
  moodLabel: { fontSize: 16, color: "#888", textTransform: "capitalize" },
  story: { fontSize: 16, color: "#ccc", lineHeight: 24 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  locationIcon: { fontSize: 18 },
  locationText: { fontSize: 15, color: "#888" },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: {
    backgroundColor: "#2C2C2E",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tagText: { color: "#888", fontSize: 13 },
  errorText: { color: "#888", fontSize: 16 },
});

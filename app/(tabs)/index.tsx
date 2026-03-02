import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  FadeInDown,
} from "react-native-reanimated";
import { Image } from "expo-image";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useMemories } from "../../hooks/useMemories";
import { Memory } from "../../types";
import { getPhotoUrl } from "../../services/storage";
import { useQuery } from "@tanstack/react-query";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_HEIGHT = 280;

// Komponen card untuk satu memory
function MemoryCard({ memory, index }: { memory: Memory; index: number }) {
  const firstPhoto = memory.photos?.[0];

  // Ambil signed URL foto dari Supabase Storage
  const { data: photoUrl } = useQuery({
    queryKey: ["photo-url", firstPhoto?.storage_path],
    queryFn: () => getPhotoUrl(firstPhoto!.storage_path),
    enabled: !!firstPhoto?.storage_path,
    staleTime: 1000 * 55 * 60, // Sedikit kurang dari 1 jam (sebelum signed URL expire)
  });

  return (
    // FadeInDown dengan delay berdasarkan index = stagger effect
    <Animated.View entering={FadeInDown.delay(index * 80).springify()}>
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.92}
        onPress={() => router.push(`/memory/${memory.id}`)}
      >
        {/* Foto utama */}
        <View style={styles.cardImageContainer}>
          {photoUrl ? (
            <Image
              source={{ uri: photoUrl }}
              style={styles.cardImage}
              contentFit="cover"
              transition={400}
            />
          ) : (
            <View style={styles.cardImagePlaceholder}>
              <Text style={{ fontSize: 40 }}>📷</Text>
            </View>
          )}

          {/* Gradient overlay untuk teks di atas foto */}
          <View style={styles.cardOverlay} />

          {/* Badge jumlah foto */}
          {(memory.photos?.length ?? 0) > 1 && (
            <View style={styles.photoBadge}>
              <Text style={styles.photoBadgeText}>
                +{(memory.photos?.length ?? 1) - 1}
              </Text>
            </View>
          )}

          {/* Mood emoji */}
          {memory.mood && (
            <View style={styles.moodBadge}>
              <Text style={styles.moodBadgeText}>
                {
                  {
                    happy: "😄",
                    good: "🙂",
                    okay: "😐",
                    sad: "😔",
                    awful: "😢",
                  }[memory.mood]
                }
              </Text>
            </View>
          )}
        </View>

        {/* Info di bawah foto */}
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {memory.title || "Memory"}
          </Text>
          <Text style={styles.cardDate}>
            {format(new Date(memory.created_at), "EEEE, d MMMM yyyy", {
              locale: id,
            })}
          </Text>

          {/* Tags */}
          {memory.tags.length > 0 && (
            <View style={styles.tagRow}>
              {memory.tags.slice(0, 3).map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// Empty state
function EmptyTimeline() {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>📷</Text>
      <Text style={styles.emptyTitle}>Belum ada memory</Text>
      <Text style={styles.emptySubtitle}>
        Tap tombol + untuk membuat{"\n"}memory pertamamu!
      </Text>
    </View>
  );
}

export default function TimelineScreen() {
  const {
    data: memories = [],
    isLoading,
    refetch,
    isRefetching,
  } = useMemories();

  // Scroll value untuk animasi header
  const scrollY = useSharedValue(0);

  // Handler scroll — berjalan di UI thread
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // Header shrink saat scroll ke bawah
  const headerAnimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 80], [1, 0], Extrapolation.CLAMP),
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [0, 80],
          [0, -20],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  // FAB (Floating Action Button) — sembunyikan saat scroll ke bawah
  const fabAnimStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(
          scrollY.value,
          [0, 100],
          [1, 0.8],
          Extrapolation.CLAMP,
        ),
      },
    ],
    opacity: interpolate(
      scrollY.value,
      [0, 100],
      [1, 0.6],
      Extrapolation.CLAMP,
    ),
  }));

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={{ color: "#666" }}>Memuat memories...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header animasi */}
      <Animated.View style={[styles.header, headerAnimStyle]}>
        <Text style={styles.headerTitle}>SnapMemory</Text>
        <Text style={styles.headerSubtitle}>
          {memories.length} memory tersimpan
        </Text>
      </Animated.View>

      {/* List memories dengan Animated.FlatList */}
      <Animated.FlatList
        data={memories}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <MemoryCard memory={item} index={index} />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<EmptyTimeline />}
        onScroll={scrollHandler} // Pakai animated scroll handler
        scrollEventThrottle={16} // Update setiap ~16ms (60fps)
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#6C63FF"
          />
        }
      />

      {/* FAB — Floating Action Button */}
      <Animated.View style={[styles.fab, fabAnimStyle]}>
        <TouchableOpacity
          style={styles.fabButton}
          onPress={() => router.push("/memory/create")}
          activeOpacity={0.85}
        >
          <Text style={styles.fabIcon}>+</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F0F0F" },
  center: { alignItems: "center", justifyContent: "center" },

  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitle: { fontSize: 32, fontWeight: "800", color: "#fff" },
  headerSubtitle: { fontSize: 14, color: "#555", marginTop: 4 },

  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 100,
    gap: 16,
  },

  card: {
    backgroundColor: "#1C1C1E",
    borderRadius: 20,
    overflow: "hidden",
  },
  cardImageContainer: { height: CARD_HEIGHT, position: "relative" },
  cardImage: { width: "100%", height: "100%" },
  cardImagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#2C2C2E",
    alignItems: "center",
    justifyContent: "center",
  },
  cardOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  photoBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  photoBadgeText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  moodBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "rgba(0,0,0,0.4)",
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  moodBadgeText: { fontSize: 20 },

  cardInfo: { padding: 16, gap: 6 },
  cardTitle: { fontSize: 18, fontWeight: "700", color: "#fff" },
  cardDate: { fontSize: 13, color: "#666" },
  tagRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  tag: {
    backgroundColor: "#2C2C2E",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  tagText: { color: "#888", fontSize: 12 },

  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 120,
    gap: 12,
  },
  emptyEmoji: { fontSize: 64 },
  emptyTitle: { fontSize: 20, fontWeight: "600", color: "#fff" },
  emptySubtitle: {
    fontSize: 15,
    color: "#555",
    textAlign: "center",
    lineHeight: 22,
  },

  fab: { position: "absolute", bottom: 32, right: 24 },
  fabButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#6C63FF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#6C63FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  fabIcon: { color: "#fff", fontSize: 28, fontWeight: "300" },
});

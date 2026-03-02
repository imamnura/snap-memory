import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMemories, createMemory, deleteMemory } from "../services/memories";
import { useAuthStore } from "../stories/authStore";
import { NewMemoryForm } from "../types";

// Query keys — centralize untuk konsistensi
// Ini pattern penting di React Query
export const memoryKeys = {
  all: ["memories"] as const,
  byUser: (userId: string) => ["memories", userId] as const,
  detail: (id: string) => ["memory", id] as const,
};

export function useMemories() {
  const user = useAuthStore((state) => state.user);

  return useQuery({
    queryKey: memoryKeys.byUser(user?.id ?? ""),
    queryFn: () => getMemories(user!.id),
    enabled: !!user, // Jangan fetch kalau user belum login
    staleTime: 1000 * 60 * 2, // 2 menit
  });
}

export function useCreateMemory() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  return useMutation({
    mutationFn: (form: NewMemoryForm) => createMemory(form, user!.id),

    // Optimistic update — update UI sebelum server respond
    onMutate: async (newMemory) => {
      // Cancel query yang sedang berjalan
      await queryClient.cancelQueries({
        queryKey: memoryKeys.byUser(user!.id),
      });

      // Snapshot nilai sebelumnya untuk rollback
      const previousMemories = queryClient.getQueryData(
        memoryKeys.byUser(user!.id),
      );

      // Optimistically update cache
      queryClient.setQueryData(memoryKeys.byUser(user!.id), (old: any[]) => [
        {
          id: "temp-" + Date.now(),
          ...newMemory,
          is_synced: false,
          created_at: new Date().toISOString(),
        },
        ...(old ?? []),
      ]);

      return { previousMemories };
    },

    // Kalau error, rollback ke state sebelumnya
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(
        memoryKeys.byUser(user!.id),
        context?.previousMemories,
      );
    },

    // Setelah sukses atau error, refetch data yang fresh
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: memoryKeys.byUser(user!.id),
      });
    },
  });
}

export function useDeleteMemory() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  return useMutation({
    mutationFn: (memoryId: string) => deleteMemory(memoryId, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: memoryKeys.byUser(user!.id),
      });
    },
  });
}

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";

// Konfigurasi QueryClient untuk mobile
// Berbeda dari web: di mobile kita lebih agresif cache
// karena koneksi tidak selalu stabil
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 menit sebelum dianggap stale
      gcTime: 1000 * 60 * 30, // 30 menit cache di memory
      retry: 2, // Retry 2x kalau gagal
      refetchOnWindowFocus: false, // Di mobile tidak ada "window focus"
      refetchOnReconnect: true, // Refetch saat koneksi balik
    },
  },
});

export function QueryProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

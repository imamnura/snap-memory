import { Stack } from "expo-router";

// Layout untuk semua screen di dalam folder (auth)
// Screen auth tidak punya header dan background gelap
export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#0F0F0F" },
        animation: "fade",
      }}
    />
  );
}

import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryProvider } from "../providers/QueryProvider";
import { useAuthStore } from "../stories/authStore";
import { StyleSheet } from "react-native";

// GestureHandlerRootView WAJIB membungkus seluruh app
// agar Gesture Handler & Reanimated bisa bekerja
export default function RootLayout() {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    initialize();
  }, []);

  return (
    <GestureHandlerRootView style={styles.container}>
      <QueryProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="memory/[id]"
            options={{
              //Presentasi modal - slide dari bawah
              // Ini adalah pattern native yang umum di mobile
              presentation: "modal",
              animation: "slide_from_bottom",
            }}
          />
        </Stack>
      </QueryProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});

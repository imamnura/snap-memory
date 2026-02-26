import { Redirect } from "expo-router";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useAuthStore } from "../stories/authStore";

export default function Index() {
  const { session, isLoading } = useAuthStore();

  // Tampilkan loading saat cek session
  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  // Redirect berdasarkan status auth
  // Expo Router Redirect bekerja seperti Next.js redirect
  if (session) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0F0F0F",
  },
});

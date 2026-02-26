import { View, Text, StyleSheet } from "react-native";

export default function GalleryScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Gallery 🖼️</Text>
      <Text style={styles.sub}>Coming in Minggu 2</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0F0F",
    alignItems: "center",
    justifyContent: "center",
  },
  text: { fontSize: 24, fontWeight: "700", color: "#fff" },
  sub: { fontSize: 14, color: "#555", marginTop: 8 },
});

import { StatusBar } from "expo-status-bar";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";

export default function App() {
  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.brand}>Devio</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>APP NATIVA DEL CLIENTE</Text>
        <Text style={styles.title}>Mis propiedades</Text>
        <Text style={styles.description}>
          La base móvil está lista para conectar autenticación, pagos, documentos, avances y postventa.
        </Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Proyecto de ejemplo</Text>
          <Text style={styles.cardText}>Tu información aparecerá aquí.</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#EAF1F8" },
  header: { backgroundColor: "#1E3B59", paddingHorizontal: 24, paddingVertical: 28 },
  brand: { color: "#FFFFFF", fontSize: 34, fontWeight: "800" },
  content: { flex: 1, padding: 24 },
  eyebrow: { color: "#2FAD66", fontSize: 12, fontWeight: "800", letterSpacing: 1.5 },
  title: { color: "#1E3B59", fontSize: 34, fontWeight: "800", marginTop: 12 },
  description: { color: "#536272", fontSize: 17, lineHeight: 25, marginTop: 12 },
  card: { backgroundColor: "#FFFFFF", borderRadius: 24, marginTop: 32, padding: 24 },
  cardTitle: { color: "#1E3B59", fontSize: 20, fontWeight: "700" },
  cardText: { color: "#68798A", marginTop: 8 },
});

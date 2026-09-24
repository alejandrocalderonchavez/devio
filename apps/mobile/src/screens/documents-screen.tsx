import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Linking,
} from "react-native";
import {
  Search,
  FileText,
  Download,
} from "lucide-react-native";
import { useClientApp } from "../context/client-context";
import { ClientHeader } from "../components/client-header";
import { ClientDocument } from "../types/client";

export const DocumentsScreen: React.FC = () => {
  const { selectedProperty, goBack, formatDateDisplay } = useClientApp();
  const [searchQuery, setSearchQuery] = useState("");

  if (!selectedProperty) return null;

  const filteredDocs = (selectedProperty.documents || []).filter((d) =>
    d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.category && d.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleOpenDoc = (doc: ClientDocument) => {
    if (doc.fileUrl) {
      Linking.openURL(doc.fileUrl).catch(() => {
        Alert.alert(
          "Documento Oficial",
          `Abriendo "${doc.title}" (${doc.fileSize}).`,
          [{ text: "Aceptar" }]
        );
      });
    } else {
      Alert.alert(
        "Documento Oficial",
        `Abriendo "${doc.title}" (${doc.fileSize}).`,
        [{ text: "Aceptar" }]
      );
    }
  };

  return (
    <View style={styles.container}>
      <ClientHeader
        isSubscreen={true}
        screenSubtitle="DOCUMENTACIÓN OFICIAL"
        screenTitle={`${selectedProperty.projectName} · Unidad ${selectedProperty.unitNumber}`}
        onBack={goBack}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Search size={18} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar contrato, plano o reglamento..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Documents List or Empty State */}
        {filteredDocs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <FileText size={36} color="#94A3B8" style={{ marginBottom: 10 }} />
            <Text style={styles.emptyTitle}>
              {searchQuery ? "No se encontraron documentos" : "No hay documentos disponibles"}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? "Prueba buscando con otro término."
                : "Aún no se han cargado contratos o archivos digitales para esta unidad."}
            </Text>
          </View>
        ) : (
          <View style={styles.docsList}>
            {filteredDocs.map((doc) => (
              <View key={doc.id} style={styles.docCard}>
                <View style={styles.docLeftWrap}>
                  <View style={styles.docIconSquare}>
                    <FileText size={22} color="#1F3652" />
                  </View>

                  <View style={styles.docInfoCol}>
                    <Text style={styles.docTitle} numberOfLines={1}>
                      {doc.title}
                    </Text>
                    <Text style={styles.docMeta}>
                      {doc.category || "Legal"} • {doc.fileSize} • {formatDateDisplay(doc.uploadDate)}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.downloadBtn}
                  onPress={() => handleOpenDoc(doc)}
                  activeOpacity={0.8}
                >
                  <Download size={13} color="#FFFFFF" />
                  <Text style={styles.downloadBtnText}>Abrir PDF</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 36,
    gap: 16,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#1F3652",
    fontWeight: "600",
    padding: 0,
  },
  docsList: {
    gap: 10,
  },
  docCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  docLeftWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  docIconSquare: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "rgba(31,54,82,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  docInfoCol: {
    flex: 1,
  },
  docTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E293B",
  },
  docMeta: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 2,
  },
  downloadBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#1B3047",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  downloadBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1F3652",
    textAlign: "center",
    marginTop: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 18,
  },
});

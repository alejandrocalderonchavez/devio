import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import {
  ArrowLeft,
  Search,
  FileText,
  Download,
  Eye,
  FileSpreadsheet,
  FolderOpen,
} from "lucide-react-native";
import { useClientApp } from "../context/client-context";
import { ClientHeader } from "../components/client-header";
import { ClientDocument } from "../types/client";

export const DocumentsScreen: React.FC = () => {
  const { selectedProperty, goBack } = useClientApp();
  const [searchQuery, setSearchQuery] = useState("");

  if (!selectedProperty) return null;

  const filteredDocs = (selectedProperty.documents || []).filter((d) =>
    d.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenDoc = (doc: ClientDocument) => {
    Alert.alert(
      "Visualizador de Documentos",
      `Abriendo "${doc.title}" (${doc.fileSize}).`,
      [{ text: "Aceptar" }]
    );
  };

  return (
    <View style={styles.container}>
      <ClientHeader showGreeting={false} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Navigation & Title Header */}
        <View style={styles.navHeaderRow}>
          <TouchableOpacity onPress={goBack} style={styles.backBtn} activeOpacity={0.7}>
            <ArrowLeft size={18} color="#1F3652" />
            <Text style={styles.backBtnText}>Volver</Text>
          </TouchableOpacity>

          <View style={styles.projectPillBadge}>
            <Text style={styles.projectPillText}>
              {selectedProperty.projectName} · Unidad {selectedProperty.unitNumber}
            </Text>
          </View>
        </View>

        <Text style={styles.screenTitle}>Documentación Oficial</Text>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Search size={18} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar Documentos"
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Documents List or Empty State */}
        {filteredDocs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconWrap}>
              <FileText size={48} color="#1F3652" />
            </View>
            <Text style={styles.emptyTitle}>Aún no tienes ningún documento.</Text>
            <Text style={styles.emptySubtitle}>
              Los contratos, planos y anexos cargados por la desarrolladora aparecerán en esta sección.
            </Text>
          </View>
        ) : (
          <View style={styles.docsList}>
            {filteredDocs.map((doc) => (
              <TouchableOpacity
                key={doc.id}
                style={styles.docCard}
                onPress={() => handleOpenDoc(doc)}
                activeOpacity={0.8}
              >
                <View style={styles.docIconCircle}>
                  <FileText size={20} color="#1F3652" />
                </View>

                <View style={styles.docInfoCol}>
                  <Text style={styles.docTitle} numberOfLines={1}>
                    {doc.title}
                  </Text>
                  <Text style={styles.docMeta}>
                    {doc.fileSize} · Subido el {doc.uploadDate}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.downloadIconBtn}
                  onPress={() => handleOpenDoc(doc)}
                  activeOpacity={0.7}
                >
                  <Download size={18} color="#00C48C" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={goBack} activeOpacity={0.8}>
          <ArrowLeft size={18} color="#1F3652" />
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F1F5F9",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 40,
    gap: 14,
  },
  navHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 6,
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1F3652",
  },
  projectPillBadge: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  projectPillText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1F3652",
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#1F3652",
    letterSpacing: -0.5,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#1F3652",
    fontWeight: "600",
  },
  docsList: {
    gap: 12,
  },
  docCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  docIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  docInfoCol: {
    flex: 1,
  },
  docTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1F3652",
  },
  docMeta: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  downloadIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0, 196, 140, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1F3652",
    marginBottom: 6,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 18,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 8,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    marginTop: 8,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1F3652",
  },
});

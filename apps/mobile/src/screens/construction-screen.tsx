import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
} from "react-native";
import {
  Calendar,
} from "lucide-react-native";
import { useClientApp } from "../context/client-context";
import { ClientHeader } from "../components/client-header";

export const ConstructionScreen: React.FC = () => {
  const { selectedProperty, goBack } = useClientApp();

  if (!selectedProperty) return null;

  return (
    <View style={styles.container}>
      <ClientHeader
        isSubscreen={true}
        screenSubtitle="AVANCE DE OBRA"
        screenTitle={`${selectedProperty.projectName} · Unidad ${selectedProperty.unitNumber}`}
        onBack={goBack}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. General Progress Card */}
        <View style={styles.card}>
          <Text style={styles.generalLabelText}>Avance General de Obra</Text>
          <Text style={styles.generalPctText}>{selectedProperty.constructionPct}%</Text>
          <Text style={styles.deliveryDateText}>
            Fecha estimada de entrega:{" "}
            <Text style={{ fontWeight: "800", color: "#1F3652" }}>
              {selectedProperty.estimatedDeliveryDate}
            </Text>
          </Text>
        </View>

        {/* 2. Avance por Especialidad Card */}
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>Avance por Especialidad</Text>

          <View style={styles.specialtiesList}>
            {selectedProperty.specialtiesProgress.map((esp) => (
              <View key={esp.id} style={styles.specialtyItem}>
                <View style={styles.specialtyHeader}>
                  <Text style={styles.specialtyName}>{esp.name}</Text>
                  <Text style={styles.specialtyPct}>{esp.percentage}%</Text>
                </View>
                <View style={styles.specialtyBarBg}>
                  <View
                    style={[
                      styles.specialtyBarFill,
                      { width: `${esp.percentage}%` },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* 3. Histórico Fotográfico de Obra */}
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>Histórico Fotográfico de Obra</Text>

          <View style={styles.milestonesList}>
            {selectedProperty.constructionMilestones.map((ms) => (
              <View key={ms.id} style={styles.milestoneCard}>
                <Image
                  source={{
                    uri:
                      (ms.photos && ms.photos[0]) ||
                      ms.photo ||
                      "https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=600",
                  }}
                  style={styles.milestonePhoto}
                />
                <View style={styles.milestoneBody}>
                  <View style={styles.milestoneHeaderRow}>
                    <Text style={styles.milestoneTitle}>{ms.title}</Text>
                    <View style={styles.milestoneDateRow}>
                      <Calendar size={12} color="#64748B" />
                      <Text style={styles.milestoneDate}>{ms.date}</Text>
                    </View>
                  </View>
                  {ms.description ? (
                    <Text style={styles.milestoneDesc}>{ms.description}</Text>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        </View>
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
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    gap: 12,
  },
  generalLabelText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748B",
  },
  generalPctText: {
    fontSize: 32,
    fontWeight: "900",
    color: "#00875A",
  },
  deliveryDateText: {
    fontSize: 13,
    color: "#64748B",
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1F3652",
    marginBottom: 4,
  },
  specialtiesList: {
    gap: 14,
  },
  specialtyItem: {
    gap: 6,
  },
  specialtyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  specialtyName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#334155",
  },
  specialtyPct: {
    fontSize: 13,
    fontWeight: "800",
    color: "#00875A",
  },
  specialtyBarBg: {
    height: 8,
    backgroundColor: "#E2E8F0",
    borderRadius: 99,
    overflow: "hidden",
  },
  specialtyBarFill: {
    height: "100%",
    backgroundColor: "#00C48C",
    borderRadius: 99,
  },
  milestonesList: {
    gap: 14,
  },
  milestoneCard: {
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  milestonePhoto: {
    width: "100%",
    height: 160,
    resizeMode: "cover",
  },
  milestoneBody: {
    padding: 14,
    gap: 6,
  },
  milestoneHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  milestoneTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1F3652",
  },
  milestoneDateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  milestoneDate: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
  },
  milestoneDesc: {
    fontSize: 12,
    color: "#475569",
    lineHeight: 17,
  },
});

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import {
  ArrowLeft,
  Calendar,
  Wrench,
  Building2,
  Layers,
  Sparkles,
} from "lucide-react-native";
import { useClientApp } from "../context/client-context";
import { ClientHeader } from "../components/client-header";

export const ConstructionScreen: React.FC = () => {
  const { selectedProperty, goBack } = useClientApp();

  if (!selectedProperty) return null;

  const getSpecialtyIcon = (name: string) => {
    if (name.includes("Cimentación")) return <Wrench size={18} color="#C59B62" />;
    if (name.includes("Estructura")) return <Building2 size={18} color="#C59B62" />;
    if (name.includes("Instalaciones")) return <Layers size={18} color="#C59B62" />;
    return <Sparkles size={18} color="#C59B62" />;
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

        {/* Top Summary Card (General Progress & Delivery Date) */}
        <View style={styles.summaryCard}>
          {/* Left: Avance General */}
          <View style={styles.summaryCol}>
            <View style={styles.generalBarBg}>
              <View
                style={[
                  styles.generalBarFill,
                  { width: `${selectedProperty.constructionPct}%` },
                ]}
              />
            </View>
            <Text style={styles.generalPctText}>{selectedProperty.constructionPct}%</Text>
            <Text style={styles.generalLabelText}>Avance General</Text>
          </View>

          <View style={styles.vDivider} />

          {/* Right: Entrega Estimada */}
          <View style={styles.summaryCol}>
            <View style={styles.calendarIconSquare}>
              <Calendar size={22} color="#C59B62" />
            </View>
            <Text style={styles.deliveryLabelText}>Entrega estimada</Text>
            <Text style={styles.deliveryDateText}>{selectedProperty.estimatedDeliveryDate}</Text>
          </View>
        </View>

        {/* Avance por Especialidad */}
        <View style={styles.specialtiesCard}>
          <Text style={styles.sectionHeading}>Avance por Especialidad</Text>
          <View style={styles.updateRow}>
            <View style={styles.greenPulse} />
            <Text style={styles.updateDateText}>
              Última actualización <Text style={{ fontWeight: "700" }}>{selectedProperty.lastProgressUpdateDate}</Text>
            </Text>
          </View>

          <View style={styles.specialtiesList}>
            {selectedProperty.specialtiesProgress.map((esp) => (
              <View key={esp.id} style={styles.specialtyRow}>
                <View style={styles.specialtyIconWrap}>
                  {getSpecialtyIcon(esp.name)}
                </View>

                <View style={styles.specialtyContent}>
                  <Text style={styles.specialtyName}>{esp.name}</Text>
                  <View style={styles.specialtyBarBg}>
                    <View
                      style={[
                        styles.specialtyBarFill,
                        { width: `${esp.percentage}%` },
                      ]}
                    />
                  </View>
                </View>

                <Text style={styles.specialtyPct}>{esp.percentage}%</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Histórico Avances de Obra */}
        <View style={styles.historyCard}>
          <Text style={styles.sectionHeading}>Histórico Avances de Obra</Text>

          <View style={styles.historyGrid}>
            {selectedProperty.constructionMilestones.map((ms) => (
              <View key={ms.id} style={styles.milestoneCard}>
                <Image
                  source={{ uri: (ms.photos && ms.photos[0]) || ms.photo || "https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=600" }}
                  style={styles.milestonePhoto}
                />
                <View style={styles.milestoneBody}>
                  <Text style={styles.milestoneTitle}>{ms.title}</Text>
                  <View style={styles.milestoneDateRow}>
                    <Calendar size={13} color="#64748B" />
                    <Text style={styles.milestoneDate}>{ms.date}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={goBack} activeOpacity={0.8}>
          <ArrowLeft size={18} color="#1F3652" />
          <Text style={styles.backButtonText}>Volver a la Propiedad</Text>
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
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  summaryCol: {
    flex: 1,
    alignItems: "center",
  },
  vDivider: {
    width: 1,
    height: "80%",
    backgroundColor: "#E2E8F0",
    marginHorizontal: 12,
  },
  generalBarBg: {
    width: "70%",
    height: 6,
    backgroundColor: "#F1F5F9",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 8,
  },
  generalBarFill: {
    height: "100%",
    backgroundColor: "#C59B62",
    borderRadius: 3,
  },
  generalPctText: {
    fontSize: 22,
    fontWeight: "900",
    color: "#1F3652",
  },
  generalLabelText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
    marginTop: 2,
  },
  calendarIconSquare: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  deliveryLabelText: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "600",
  },
  deliveryDateText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#1F3652",
    marginTop: 2,
  },
  specialtiesCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: "900",
    color: "#1F3652",
    marginBottom: 4,
  },
  updateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 16,
  },
  greenPulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#00C48C",
  },
  updateDateText: {
    fontSize: 12,
    color: "#64748B",
  },
  specialtiesList: {
    gap: 16,
  },
  specialtyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  specialtyIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FDF4E7",
    alignItems: "center",
    justifyContent: "center",
  },
  specialtyContent: {
    flex: 1,
    gap: 6,
  },
  specialtyName: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1F3652",
  },
  specialtyBarBg: {
    height: 7,
    backgroundColor: "#F1F5F9",
    borderRadius: 4,
    overflow: "hidden",
  },
  specialtyBarFill: {
    height: "100%",
    backgroundColor: "#C59B62",
    borderRadius: 4,
  },
  specialtyPct: {
    fontSize: 14,
    fontWeight: "900",
    color: "#1F3652",
    minWidth: 42,
    textAlign: "right",
  },
  historyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  historyGrid: {
    flexDirection: "row",
    gap: 14,
    marginTop: 12,
  },
  milestoneCard: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  milestonePhoto: {
    width: "100%",
    height: 110,
  },
  milestoneBody: {
    padding: 12,
  },
  milestoneTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1F3652",
    marginBottom: 4,
  },
  milestoneDateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  milestoneDate: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "600",
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

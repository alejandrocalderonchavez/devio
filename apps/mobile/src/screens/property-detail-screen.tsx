import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  FileText,
  CreditCard,
  ShoppingBag,
  ChevronDown,
  ChevronUp,
  Clock,
  Sparkles,
  Layers,
  Building2,
  CheckCircle2,
} from "lucide-react-native";
import { useClientApp } from "../context/client-context";
import { ClientHeader } from "../components/client-header";

export const PropertyDetailScreen: React.FC = () => {
  const { selectedProperty, goBack, navigateTo, formatMoney, formatDateDisplay } = useClientApp();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isUnitInfoExpanded, setIsUnitInfoExpanded] = useState(true);

  if (!selectedProperty) return null;

  const isPast = selectedProperty.nextPaymentDaysRemaining < 0;

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
          </TouchableOpacity>

          <View style={styles.projectPillBadge}>
            <Text style={styles.projectPillText}>
              {selectedProperty.projectName} | {selectedProperty.unitNumber}
            </Text>
          </View>
        </View>

        {/* Image Gallery */}
        <View style={styles.galleryContainer}>
          <Image
            source={{ uri: selectedProperty.images[selectedImageIndex] || selectedProperty.images[0] }}
            style={styles.mainHeroImage}
          />
          {/* Thumbnails Row */}
          {selectedProperty.images.length > 1 && (
            <View style={styles.thumbnailsRow}>
              {selectedProperty.images.map((img, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => setSelectedImageIndex(idx)}
                  style={[
                    styles.thumbnailWrap,
                    selectedImageIndex === idx && styles.thumbnailWrapActive,
                  ]}
                  activeOpacity={0.8}
                >
                  <Image source={{ uri: img }} style={styles.thumbnailImage} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Payment Summary Pills Card */}
        <View style={styles.paymentSummaryCard}>
          <View style={styles.paymentPillsRow}>
            {/* Próximo Pago */}
            <View style={styles.paymentPillColumn}>
              <View style={[styles.pillTag, isPast && styles.pillTagOverdue]}>
                <Calendar size={12} color={isPast ? "#DC2626" : "#92400E"} />
                <Text style={[styles.pillTagText, isPast && { color: "#991B1B" }]}>
                  {isPast ? "Cuota Vencida" : "Tu próximo pago"}
                </Text>
              </View>
              <Text style={styles.pillAmount}>
                {formatMoney(selectedProperty.nextPaymentAmount)}
              </Text>
              <Text style={styles.pillDueDate}>
                Vence: <Text style={{ fontWeight: "700" }}>{formatDateDisplay(selectedProperty.nextPaymentDueDate)}</Text> | {isPast ? `${Math.abs(selectedProperty.nextPaymentDaysRemaining)} días vencido` : `En ${selectedProperty.nextPaymentDaysRemaining} días`}
              </Text>
            </View>

            {/* Saldo Vencido */}
            {selectedProperty.overdueAmount !== undefined && selectedProperty.overdueAmount > 0 && (
              <View style={styles.paymentPillColumn}>
                <View style={[styles.pillTag, styles.pillTagOverdue]}>
                  <Calendar size={12} color="#DC2626" />
                  <Text style={[styles.pillTagText, { color: "#991B1B" }]}>Saldo Vencido</Text>
                </View>
                <Text style={[styles.pillAmount, { color: "#1F3652" }]}>
                  {formatMoney(selectedProperty.overdueAmount)}
                </Text>
              </View>
            )}
          </View>

          {/* Button: Ver saldo y pagos */}
          <TouchableOpacity
            style={styles.verSaldoBtn}
            onPress={() => navigateTo("account-statement", selectedProperty.id)}
            activeOpacity={0.85}
          >
            <Text style={styles.verSaldoBtnText}>Ver saldo y pagos</Text>
          </TouchableOpacity>
        </View>

        {/* Avance de Obra Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Avance de Obra</Text>
          <View style={styles.obraMainRow}>
            <Text style={styles.obraPctLarge}>{selectedProperty.constructionPct}%</Text>
            <View style={styles.obraBarBg}>
              <View
                style={[
                  styles.obraBarFill,
                  { width: `${selectedProperty.constructionPct}%` },
                ]}
              />
            </View>
          </View>

          <View style={styles.obraFooterRow}>
            <View style={styles.obraUpdateGroup}>
              <View style={styles.greenPulse} />
              <Text style={styles.obraUpdateDate}>
                Última actualización <Text style={{ fontWeight: "700" }}>{selectedProperty.lastProgressUpdateDate}</Text>
              </Text>
            </View>

            <TouchableOpacity
              style={styles.verAvancesBtn}
              onPress={() => navigateTo("construction", selectedProperty.id)}
              activeOpacity={0.8}
            >
              <Text style={styles.verAvancesBtnText}>Ver Avances</Text>
              <ArrowRight size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Resumen Financiero: 3 Cards */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>Resumen Financiero</Text>
          <View style={styles.financialRow}>
            <View style={styles.financialColCard}>
              <Text style={styles.financialVal}>
                ${(selectedProperty.totalPrice / 1000000).toFixed(2)}M
              </Text>
              <Text style={styles.financialLabel}>Precio de Venta</Text>
            </View>

            <View style={styles.financialColCard}>
              <Text style={[styles.financialVal, { color: "#00C48C" }]}>
                ${(selectedProperty.paidAmount / 1000000).toFixed(2)}M
              </Text>
              <Text style={styles.financialLabel}>Total Pagado</Text>
            </View>

            <View style={styles.financialColCard}>
              <Text style={styles.financialVal}>
                ${(selectedProperty.pendingAmount / 1000000).toFixed(2)}M
              </Text>
              <Text style={styles.financialLabel}>Saldo Pendiente</Text>
            </View>
          </View>
        </View>

        {/* Acciones Rápidas */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={styles.quickActionItem}
              onPress={() => navigateTo("documents", selectedProperty.id)}
              activeOpacity={0.8}
            >
              <View style={styles.quickActionIconWrap}>
                <FileText size={22} color="#1F3652" />
              </View>
              <Text style={styles.quickActionText}>Documentos</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionItem}
              onPress={() => navigateTo("account-statement", selectedProperty.id)}
              activeOpacity={0.8}
            >
              <View style={styles.quickActionIconWrap}>
                <CreditCard size={22} color="#1F3652" />
              </View>
              <Text style={styles.quickActionText}>Estado de Cuenta</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionItem}
              onPress={() =>
                Alert.alert(
                  "Marketplace Devio",
                  "Próximamente podrás cotizar paquetes de acabados, domótica y mobiliario directo desde tu app.",
                  [{ text: "Entendido" }]
                )
              }
              activeOpacity={0.8}
            >
              <View style={styles.quickActionIconWrap}>
                <ShoppingBag size={22} color="#1F3652" />
              </View>
              <Text style={styles.quickActionText}>Marketplace</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Información de la Unidad (Card Colapsable) */}
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.collapsibleHeader}
            onPress={() => setIsUnitInfoExpanded(!isUnitInfoExpanded)}
            activeOpacity={0.7}
          >
            <Text style={styles.cardTitle}>Información de la Unidad</Text>
            <View style={styles.collapseIconCircle}>
              {isUnitInfoExpanded ? (
                <ChevronUp size={16} color="#1F3652" />
              ) : (
                <ChevronDown size={16} color="#1F3652" />
              )}
            </View>
          </TouchableOpacity>

          {isUnitInfoExpanded && (
            <View style={styles.collapsibleBody}>
              <View style={styles.unitSpecsPillsRow}>
                <View style={styles.unitSpecPill}>
                  <Text style={styles.unitSpecLabel}>Superficie</Text>
                  <Text style={styles.unitSpecVal}>{selectedProperty.areaM2} m²</Text>
                </View>
                <View style={styles.unitSpecPill}>
                  <Text style={styles.unitSpecLabel}>Cuartos</Text>
                  <Text style={styles.unitSpecVal}>{selectedProperty.bedrooms}</Text>
                </View>
                <View style={styles.unitSpecPill}>
                  <Text style={styles.unitSpecLabel}>Baños</Text>
                  <Text style={styles.unitSpecVal}>{selectedProperty.bathrooms}</Text>
                </View>
              </View>

              {/* Custom Attributes Configured for the Unit */}
              {selectedProperty.customAttributes && selectedProperty.customAttributes.length > 0 && (
                <View style={styles.customAttrList}>
                  {selectedProperty.customAttributes.map((attr) => (
                    <View key={attr.key} style={styles.customAttrRow}>
                      <Text style={styles.customAttrLabel}>{attr.label}</Text>
                      <Text style={styles.customAttrVal}>{attr.value}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 16,
  },
  navHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  projectPillBadge: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  projectPillText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1F3652",
    textAlign: "center",
  },
  galleryContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 10,
  },
  mainHeroImage: {
    width: "100%",
    height: 220,
    borderRadius: 18,
  },
  thumbnailsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  thumbnailWrap: {
    flex: 1,
    height: 60,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
  },
  thumbnailWrapActive: {
    borderColor: "#1F3652",
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
  },
  paymentSummaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  paymentPillsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  paymentPillColumn: {
    flex: 1,
  },
  pillTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#FEF3C7",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
    marginBottom: 6,
  },
  pillTagOverdue: {
    backgroundColor: "#FEE2E2",
  },
  pillTagText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#92400E",
  },
  pillAmount: {
    fontSize: 22,
    fontWeight: "900",
    color: "#1F3652",
  },
  pillDueDate: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 4,
  },
  verSaldoBtn: {
    backgroundColor: "#1F3652",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  verSaldoBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1F3652",
    marginBottom: 10,
  },
  obraMainRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  obraPctLarge: {
    fontSize: 26,
    fontWeight: "900",
    color: "#1F3652",
    minWidth: 65,
  },
  obraBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: "#F1F5F9",
    borderRadius: 4,
    overflow: "hidden",
  },
  obraBarFill: {
    height: "100%",
    backgroundColor: "#C59B62",
    borderRadius: 4,
  },
  obraFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  obraUpdateGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  greenPulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#00C48C",
  },
  obraUpdateDate: {
    fontSize: 11,
    color: "#64748B",
  },
  verAvancesBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#1F3652",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  verAvancesBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  sectionBlock: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1F3652",
  },
  financialRow: {
    flexDirection: "row",
    gap: 10,
  },
  financialColCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  financialVal: {
    fontSize: 16,
    fontWeight: "900",
    color: "#1F3652",
    marginBottom: 4,
  },
  financialLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748B",
    textAlign: "center",
  },
  quickActionsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  quickActionItem: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 8,
  },
  quickActionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  quickActionText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#1F3652",
    textAlign: "center",
  },
  collapsibleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  collapseIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  collapsibleBody: {
    marginTop: 14,
    gap: 14,
  },
  unitSpecsPillsRow: {
    flexDirection: "row",
    gap: 10,
  },
  unitSpecPill: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  unitSpecLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#94A3B8",
    marginBottom: 2,
  },
  unitSpecVal: {
    fontSize: 14,
    fontWeight: "900",
    color: "#1F3652",
  },
  customAttrList: {
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 12,
    gap: 8,
  },
  customAttrRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  customAttrLabel: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
  },
  customAttrVal: {
    fontSize: 12,
    color: "#1F3652",
    fontWeight: "800",
  },
});

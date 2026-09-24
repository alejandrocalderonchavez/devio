import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { AlertTriangle, Building2 } from "lucide-react-native";
import { useClientApp } from "../context/client-context";
import { ClientHeader } from "../components/client-header";

export const PropertiesScreen: React.FC = () => {
  const { properties, navigateTo, formatMoney, formatDateDisplay } = useClientApp();

  const primaryProp = properties[0];
  const isPast = primaryProp ? primaryProp.nextPaymentDaysRemaining < 0 : false;
  const isAllPaid = primaryProp ? primaryProp.pendingAmount <= 0 : false;
  const hasOverdue = primaryProp ? primaryProp.overdueAmount > 0 : false;

  return (
    <View style={styles.container}>
      <ClientHeader showGreeting={true} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Empty State */}
        {properties.length === 0 ? (
          <View style={styles.emptyCard}>
            <Building2 size={48} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No se encontraron propiedades vinculadas</Text>
            <Text style={styles.emptySubtitle}>
              No tienes unidades formalizadas registradas actualmente. Si adquiriste una propiedad, contacta a tu asesor comercial.
            </Text>
          </View>
        ) : (
          <>
            {/* Banner: Tu Próximo Pago (Idéntico a la Web) */}
            {primaryProp && (
              <View style={styles.nextPaymentCard}>
                {/* Status pill & countdown row */}
                <View style={styles.nextPaymentHeader}>
                  <View
                    style={[
                      styles.statusPill,
                      isAllPaid
                        ? styles.statusPillPaid
                        : isPast
                        ? styles.statusPillOverdue
                        : styles.statusPillUpcoming,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        isAllPaid
                          ? styles.statusPillTextPaid
                          : isPast
                          ? styles.statusPillTextOverdue
                          : styles.statusPillTextUpcoming,
                      ]}
                    >
                      {isAllPaid
                        ? "✓ AL CORRIENTE"
                        : isPast
                        ? "⚠️ CUOTA VENCIDA"
                        : "TU PRÓXIMO PAGO"}
                    </Text>
                  </View>

                  <Text style={styles.daysRemainingText}>
                    {isAllPaid ? (
                      "Sin adeudos"
                    ) : isPast ? (
                      <Text style={styles.daysOverdueHighlight}>
                        {Math.abs(primaryProp.nextPaymentDaysRemaining)} días vencido
                      </Text>
                    ) : primaryProp.nextPaymentDaysRemaining === 0 ? (
                      <Text style={styles.daysTodayHighlight}>Vence hoy</Text>
                    ) : (
                      `${primaryProp.nextPaymentDaysRemaining} días restantes`
                    )}
                  </Text>
                </View>

                {/* Amount and Subtitle + Action Button */}
                <View style={styles.amountAndActionRow}>
                  <View style={styles.amountCol}>
                    <Text style={styles.amountText}>
                      {formatMoney(primaryProp.nextPaymentAmount)}
                    </Text>
                    <Text style={styles.amountSubtitle} numberOfLines={2}>
                      {isAllPaid
                        ? `${primaryProp.projectName} (${primaryProp.unitNumber}) - 100% Liquidado`
                        : `${primaryProp.nextPaymentConcept || "Mensual"} · Vence el ${formatDateDisplay(
                            primaryProp.nextPaymentDueDate
                          )} · ${primaryProp.projectName} (${primaryProp.unitNumber})`}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => navigateTo("account-statement", primaryProp.id)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.actionBtnText}>Ver Pagos & Recibos</Text>
                  </TouchableOpacity>
                </View>

                {/* Saldo Vencido Acumulado Alert Banner */}
                {hasOverdue && primaryProp.overdueAmount > 0 && (
                  <View style={styles.overdueAlertBox}>
                    <View style={styles.overdueAlertLeft}>
                      <AlertTriangle size={15} color="#DC2626" />
                      <Text style={styles.overdueAlertLabel}>Saldo Vencido Acumulado</Text>
                    </View>
                    <Text style={styles.overdueAlertAmount}>
                      {formatMoney(primaryProp.overdueAmount)}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Section Heading */}
            <Text style={styles.sectionHeading}>
              Tus Propiedades Adquiridas ({properties.length})
            </Text>

            {/* Properties List */}
            <View style={styles.propertiesList}>
              {properties.map((prop) => (
                <TouchableOpacity
                  key={prop.id}
                  style={styles.propertyCard}
                  onPress={() => navigateTo("property-detail", prop.id)}
                  activeOpacity={0.9}
                >
                  {/* Hero Image with Badges */}
                  <View style={styles.imageContainer}>
                    <Image
                      source={{
                        uri:
                          prop.images[0] ||
                          "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800",
                      }}
                      style={styles.propertyHeroImage}
                    />
                    <View style={styles.developerBadge}>
                      <Text style={styles.developerBadgeText}>
                        {prop.developerName || "Desarrollos Campero"}
                      </Text>
                    </View>
                    <View style={styles.unitNumberBadge}>
                      <Text style={styles.unitNumberBadgeText}>
                        Unidad {prop.unitNumber}
                      </Text>
                    </View>
                  </View>

                  {/* Card Content */}
                  <View style={styles.cardBody}>
                    <Text style={styles.propertyName}>{prop.projectName}</Text>
                    <Text style={styles.propertyAddress} numberOfLines={2}>
                      {prop.projectAddress}
                    </Text>

                    {/* Specs Pills */}
                    <View style={styles.specsRow}>
                      <View style={styles.specPill}>
                        <Text style={styles.specPillText}>{prop.areaM2} m²</Text>
                      </View>
                      <View style={styles.specPill}>
                        <Text style={styles.specPillText}>{prop.bedrooms} Recámaras</Text>
                      </View>
                      <View style={styles.specPill}>
                        <Text style={styles.specPillText}>{prop.bathrooms} Baños</Text>
                      </View>
                    </View>

                    {/* Obra Progress Bar */}
                    <View style={styles.constructionSection}>
                      <View style={styles.constructionHeader}>
                        <Text style={styles.constructionLabel}>Avance de Obra</Text>
                        <Text style={styles.constructionPct}>{prop.constructionPct}%</Text>
                      </View>
                      <View style={styles.constructionBarBg}>
                        <View
                          style={[
                            styles.constructionBarFill,
                            { width: `${prop.constructionPct}%` },
                          ]}
                        />
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </>
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
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1F3652",
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 18,
  },
  nextPaymentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    gap: 12,
  },
  nextPaymentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
  },
  statusPillUpcoming: {
    backgroundColor: "#FEF3C7",
  },
  statusPillOverdue: {
    backgroundColor: "#FEE2E2",
  },
  statusPillPaid: {
    backgroundColor: "#D1FAE5",
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  statusPillTextUpcoming: {
    color: "#1F3652",
  },
  statusPillTextOverdue: {
    color: "#991B1B",
  },
  statusPillTextPaid: {
    color: "#065F46",
  },
  daysRemainingText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
  },
  daysOverdueHighlight: {
    color: "#DC2626",
    fontWeight: "700",
  },
  daysTodayHighlight: {
    color: "#D97706",
    fontWeight: "700",
  },
  amountAndActionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 10,
  },
  amountCol: {
    flex: 1,
  },
  amountText: {
    fontSize: 26,
    fontWeight: "900",
    color: "#1F3652",
    letterSpacing: -0.5,
  },
  amountSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
    lineHeight: 16,
  },
  actionBtn: {
    backgroundColor: "#1F3652",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  overdueAlertBox: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  overdueAlertLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  overdueAlertLabel: {
    color: "#DC2626",
    fontSize: 12,
    fontWeight: "700",
  },
  overdueAlertAmount: {
    color: "#DC2626",
    fontSize: 13,
    fontWeight: "900",
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1F3652",
  },
  propertiesList: {
    gap: 16,
  },
  propertyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  imageContainer: {
    height: 180,
    width: "100%",
    position: "relative",
    backgroundColor: "#E2E8F0",
  },
  propertyHeroImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  developerBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "rgba(31, 54, 82, 0.9)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 99,
  },
  developerBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  unitNumberBadge: {
    position: "absolute",
    bottom: 12,
    right: 12,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  unitNumberBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  cardBody: {
    padding: 16,
    gap: 10,
  },
  propertyName: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1F3652",
  },
  propertyAddress: {
    fontSize: 12,
    color: "#64748B",
    lineHeight: 16,
  },
  specsRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  specPill: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  specPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#334155",
  },
  constructionSection: {
    marginTop: 4,
    gap: 6,
  },
  constructionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  constructionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
  },
  constructionPct: {
    fontSize: 12,
    fontWeight: "800",
    color: "#00875A",
  },
  constructionBarBg: {
    height: 8,
    backgroundColor: "#E2E8F0",
    borderRadius: 99,
    overflow: "hidden",
  },
  constructionBarFill: {
    height: "100%",
    backgroundColor: "#00C48C",
    borderRadius: 99,
  },
});

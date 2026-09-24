import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { ChevronRight, Calendar, ArrowRight } from "lucide-react-native";
import { useClientApp } from "../context/client-context";
import { ClientHeader } from "../components/client-header";

export const PropertiesScreen: React.FC = () => {
  const { properties, navigateTo, formatMoney, formatDateDisplay } = useClientApp();

  const primaryProp = properties[0];
  const isPast = primaryProp ? primaryProp.nextPaymentDaysRemaining < 0 : false;

  return (
    <View style={styles.container}>
      <ClientHeader showGreeting={true} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Next Payment Banner Card */}
        {primaryProp && primaryProp.nextPaymentAmount > 0 && (
          <TouchableOpacity
            style={[styles.nextPaymentCard, isPast && { borderColor: "#FECACA", backgroundColor: "#FFF5F5" }]}
            onPress={() => navigateTo("account-statement", primaryProp.id)}
            activeOpacity={0.85}
          >
            <View style={styles.nextPaymentHeader}>
              <Text style={[styles.nextPaymentLabel, isPast && { color: "#DC2626" }]}>
                {isPast ? "CUOTA VENCIDA" : "TU PRÓXIMO PAGO"}
              </Text>
              <View style={styles.verDetalleRow}>
                <Text style={[styles.verDetalleText, isPast && { color: "#DC2626" }]}>Ver detalle</Text>
                <ArrowRight size={14} color={isPast ? "#DC2626" : "#D97706"} />
              </View>
            </View>

            <View style={styles.nextPaymentAmountRow}>
              <Text style={styles.nextPaymentAmount}>
                {formatMoney(primaryProp.nextPaymentAmount)}
              </Text>
              <Text style={styles.nextPaymentDate}>
                {formatDateDisplay(primaryProp.nextPaymentDueDate)}
              </Text>
            </View>

            {/* Micro Progress Bar */}
            <View style={styles.paymentProgressBarBg}>
              <View
                style={[
                  styles.paymentProgressBarFill,
                  { width: "100%", backgroundColor: isPast ? "#DC2626" : "#00C48C" },
                ]}
              />
            </View>

            <Text style={[styles.nextPaymentCountdown, isPast && { color: "#DC2626" }]}>
              {isPast
                ? `${Math.abs(primaryProp.nextPaymentDaysRemaining)} días vencido`
                : `en ${primaryProp.nextPaymentDaysRemaining} días`}
            </Text>
          </TouchableOpacity>
        )}

        {/* Section: Mis Propiedades */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Mis propiedades</Text>
          <View style={styles.propCountBadge}>
            <Text style={styles.propCountText}>{properties.length}</Text>
          </View>
        </View>

        {/* Properties List */}
        <View style={styles.propertiesList}>
          {properties.map((prop) => (
            <TouchableOpacity
              key={prop.id}
              style={styles.propertyCard}
              onPress={() => navigateTo("property-detail", prop.id)}
              activeOpacity={0.9}
            >
              {/* Image Container with Badges */}
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: prop.images[0] || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800" }}
                  style={styles.propertyHeroImage}
                />
                <View style={styles.unitTypeBadge}>
                  <Text style={styles.unitTypeBadgeText}>{prop.unitType}</Text>
                </View>
                <View style={styles.unitNumberBadge}>
                  <Text style={styles.unitNumberBadgeText}>Unidad {prop.unitNumber}</Text>
                </View>
              </View>

              {/* Card Body */}
              <View style={styles.cardBody}>
                <Text style={styles.propertyName}>{prop.projectName}</Text>
                <Text style={styles.propertyAddress} numberOfLines={1}>
                  {prop.projectAddress}
                </Text>

                {/* Specs Pills */}
                <View style={styles.specsRow}>
                  <View style={styles.specPill}>
                    <Text style={styles.specPillVal}>{prop.areaM2}</Text>
                    <Text style={styles.specPillLabel}>M²</Text>
                  </View>
                  <View style={styles.specPill}>
                    <Text style={styles.specPillVal}>{prop.bedrooms}</Text>
                    <Text style={styles.specPillLabel}>CUARTOS</Text>
                  </View>
                  <View style={styles.specPill}>
                    <Text style={styles.specPillVal}>{prop.bathrooms}</Text>
                    <Text style={styles.specPillLabel}>BAÑOS</Text>
                  </View>
                </View>

                {/* Construction Progress Bar */}
                <View style={styles.constructionRow}>
                  <View style={styles.constructionBarBg}>
                    <View
                      style={[
                        styles.constructionBarFill,
                        { width: `${prop.constructionPct}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.constructionPctText}>
                    {prop.constructionPct}% obra
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
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
  },
  nextPaymentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  nextPaymentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  nextPaymentLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 0.8,
  },
  verDetalleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  verDetalleText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#D97706",
  },
  nextPaymentAmountRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    marginVertical: 4,
  },
  nextPaymentAmount: {
    fontSize: 28,
    fontWeight: "900",
    color: "#1F3652",
    letterSpacing: -0.5,
  },
  nextPaymentDate: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },
  paymentProgressBarBg: {
    height: 6,
    backgroundColor: "#F1F5F9",
    borderRadius: 3,
    marginTop: 8,
    overflow: "hidden",
  },
  paymentProgressBarFill: {
    height: "100%",
    backgroundColor: "#C59B62",
    borderRadius: 3,
  },
  nextPaymentCountdown: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
    marginTop: 8,
    textAlign: "right",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1F3652",
  },
  propCountBadge: {
    backgroundColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  propCountText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#475569",
  },
  propertiesList: {
    gap: 20,
  },
  propertyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  imageContainer: {
    height: 200,
    width: "100%",
    position: "relative",
  },
  propertyHeroImage: {
    width: "100%",
    height: "100%",
  },
  unitTypeBadge: {
    position: "absolute",
    top: 14,
    left: 14,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  unitTypeBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#1F3652",
  },
  unitNumberBadge: {
    position: "absolute",
    bottom: 14,
    right: 14,
    backgroundColor: "rgba(31, 54, 82, 0.85)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
  },
  unitNumberBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  cardBody: {
    padding: 18,
  },
  propertyName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1F3652",
    marginBottom: 4,
  },
  propertyAddress: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 14,
  },
  specsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  specPill: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  specPillVal: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1F3652",
  },
  specPillLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "#94A3B8",
    marginTop: 1,
  },
  constructionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  constructionBarBg: {
    flex: 1,
    height: 7,
    backgroundColor: "#E2E8F0",
    borderRadius: 4,
    overflow: "hidden",
  },
  constructionBarFill: {
    height: "100%",
    backgroundColor: "#C59B62",
    borderRadius: 4,
  },
  constructionPctText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#64748B",
  },
});

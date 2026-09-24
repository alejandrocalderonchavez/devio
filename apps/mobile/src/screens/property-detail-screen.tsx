import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import {
  FileText,
  CreditCard,
  ChevronDown,
  ChevronUp,
} from "lucide-react-native";
import { useClientApp } from "../context/client-context";
import { ClientHeader } from "../components/client-header";

export const PropertyDetailScreen: React.FC = () => {
  const { selectedProperty, navigateTo, formatMoney, formatDateDisplay, goBack } = useClientApp();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isUnitInfoExpanded, setIsUnitInfoExpanded] = useState(true);

  if (!selectedProperty) return null;

  const isPast = selectedProperty.nextPaymentDaysRemaining < 0;

  return (
    <View style={styles.container}>
      <ClientHeader
        isSubscreen={true}
        screenSubtitle="DETALLE DE PROPIEDAD"
        screenTitle={`${selectedProperty.projectName} · Unidad ${selectedProperty.unitNumber}`}
        onBack={goBack}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Photo Carousel & Thumbnails */}
        <View style={styles.galleryCard}>
          <Image
            source={{
              uri:
                selectedProperty.images[selectedImageIndex] ||
                selectedProperty.images[0] ||
                "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800",
            }}
            style={styles.mainHeroImage}
          />
          {selectedProperty.images.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbnailsRow}
            >
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
            </ScrollView>
          )}
        </View>

        {/* 2. Payment Pills & Balance Action Card */}
        {selectedProperty.nextPaymentAmount > 0 && (
          <View style={styles.card}>
            <View style={styles.paymentPillsRow}>
              {/* Próximo Pago */}
              <View style={[styles.pillCol, { backgroundColor: "#FEF3C7", borderColor: "#FDE68A" }]}>
                <Text style={[styles.pillColLabel, { color: "#92400E" }]}>
                  {isPast ? "Cuota Vencida" : "Tu Próximo Pago"}
                </Text>
                <Text style={[styles.pillColAmount, { color: "#78350F" }]}>
                  {formatMoney(selectedProperty.nextPaymentAmount)}
                </Text>
                <Text style={[styles.pillColSub, { color: "#92400E" }]}>
                  Vence {formatDateDisplay(selectedProperty.nextPaymentDueDate)}
                </Text>
              </View>

              {/* Saldo Vencido */}
              <View style={[styles.pillCol, { backgroundColor: "#FEE2E2", borderColor: "#FECACA" }]}>
                <Text style={[styles.pillColLabel, { color: "#991B1B" }]}>Saldo Vencido</Text>
                <Text style={[styles.pillColAmount, { color: "#7F1D1D" }]}>
                  {formatMoney(selectedProperty.overdueAmount || 0)}
                </Text>
                <Text style={[styles.pillColSub, { color: "#991B1B" }]}>
                  {selectedProperty.overdueAmount > 0 ? "Cuotas atrasadas" : "Sin adeudo vencido"}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.primaryActionBtn}
              onPress={() => navigateTo("account-statement", selectedProperty.id)}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryActionBtnText}>
                Ver Saldo y Calendario de Pagos
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 3. Avance de Obra Summary Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderBetween}>
            <View>
              <Text style={styles.metaLabel}>Avance General de Obra</Text>
              <Text style={styles.largeGreenPct}>{selectedProperty.constructionPct}%</Text>
            </View>
            <TouchableOpacity
              style={styles.secondaryActionBtn}
              onPress={() => navigateTo("construction", selectedProperty.id)}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryActionBtnText}>Ver Avances y Fotos</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 4. Resumen Financiero Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Resumen Financiero</Text>
          <View style={styles.dataRowsList}>
            <View style={styles.dataRow}>
              <Text style={styles.dataRowLabel}>Precio Total de Venta:</Text>
              <Text style={[styles.dataRowVal, { color: "#1F3652" }]}>
                {formatMoney(selectedProperty.totalPrice)}
              </Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataRowLabel}>Total Pagado a la Fecha:</Text>
              <Text style={[styles.dataRowVal, { color: "#00875A" }]}>
                {formatMoney(selectedProperty.paidAmount)}
              </Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataRowLabel}>Saldo Pendiente por Liquidar:</Text>
              <Text style={[styles.dataRowVal, { color: "#B45309" }]}>
                {formatMoney(selectedProperty.pendingAmount)}
              </Text>
            </View>
            {selectedProperty.overdueAmount > 0 && (
              <View style={styles.dataRow}>
                <Text style={[styles.dataRowLabel, { color: "#DC2626", fontWeight: "700" }]}>
                  Saldo Vencido Atrasado:
                </Text>
                <Text style={[styles.dataRowVal, { color: "#DC2626" }]}>
                  {formatMoney(selectedProperty.overdueAmount)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* 5. Acciones Rápidas */}
        <View style={styles.quickActionsRow}>
          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={() => navigateTo("documents", selectedProperty.id)}
            activeOpacity={0.8}
          >
            <FileText size={20} color="#1F3652" />
            <Text style={styles.quickActionBtnText}>Documentos</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={() => navigateTo("account-statement", selectedProperty.id)}
            activeOpacity={0.8}
          >
            <CreditCard size={20} color="#1F3652" />
            <Text style={styles.quickActionBtnText}>Estado de Cuenta</Text>
          </TouchableOpacity>
        </View>

        {/* 6. Información de la Unidad (Collapsible) */}
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.collapsibleHeader}
            onPress={() => setIsUnitInfoExpanded(!isUnitInfoExpanded)}
            activeOpacity={0.7}
          >
            <Text style={styles.cardTitle}>Información Técnica de la Unidad</Text>
            {isUnitInfoExpanded ? (
              <ChevronUp size={18} color="#64748B" />
            ) : (
              <ChevronDown size={18} color="#64748B" />
            )}
          </TouchableOpacity>

          {isUnitInfoExpanded && (
            <View style={styles.unitSpecsList}>
              <View style={styles.dataRow}>
                <Text style={styles.dataRowLabel}>Superficie Total:</Text>
                <Text style={styles.dataRowVal}>{selectedProperty.areaM2} m²</Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataRowLabel}>Tipo de Unidad:</Text>
                <Text style={styles.dataRowVal}>{selectedProperty.unitType}</Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataRowLabel}>Nivel / Piso:</Text>
                <Text style={styles.dataRowVal}>Nivel {selectedProperty.floorLevel || 1}</Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataRowLabel}>Recámaras:</Text>
                <Text style={styles.dataRowVal}>{selectedProperty.bedrooms}</Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataRowLabel}>Baños:</Text>
                <Text style={styles.dataRowVal}>{selectedProperty.bathrooms}</Text>
              </View>
              {(selectedProperty.customAttributes || []).map((attr, i) => (
                <View key={i} style={styles.dataRow}>
                  <Text style={styles.dataRowLabel}>{attr.label}:</Text>
                  <Text style={styles.dataRowVal}>{attr.value}</Text>
                </View>
              ))}
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
    backgroundColor: "#F8FAFC",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 36,
    gap: 16,
  },
  galleryCard: {
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
  mainHeroImage: {
    width: "100%",
    height: 240,
    resizeMode: "cover",
  },
  thumbnailsRow: {
    flexDirection: "row",
    gap: 8,
    padding: 10,
    backgroundColor: "#F8FAFC",
  },
  thumbnailWrap: {
    width: 65,
    height: 46,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  thumbnailWrapActive: {
    borderWidth: 2.5,
    borderColor: "#1F3652",
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  card: {
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
  cardHeaderBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1F3652",
  },
  metaLabel: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "700",
  },
  largeGreenPct: {
    fontSize: 24,
    fontWeight: "900",
    color: "#00875A",
    marginTop: 2,
  },
  secondaryActionBtn: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  secondaryActionBtnText: {
    color: "#1F3652",
    fontSize: 12,
    fontWeight: "800",
  },
  paymentPillsRow: {
    flexDirection: "row",
    gap: 10,
  },
  pillCol: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
  },
  pillColLabel: {
    fontSize: 11,
    fontWeight: "700",
  },
  pillColAmount: {
    fontSize: 17,
    fontWeight: "900",
    marginVertical: 2,
  },
  pillColSub: {
    fontSize: 11,
  },
  primaryActionBtn: {
    backgroundColor: "#1F3652",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryActionBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  dataRowsList: {
    gap: 8,
  },
  dataRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dataRowLabel: {
    fontSize: 12,
    color: "#64748B",
  },
  dataRowVal: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1F3652",
  },
  quickActionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  quickActionBtn: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  quickActionBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#1F3652",
  },
  collapsibleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  unitSpecsList: {
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 10,
    gap: 8,
  },
});

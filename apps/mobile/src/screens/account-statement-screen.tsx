import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import {
  Download,
  Calendar,
  CreditCard,
  ExternalLink,
  Eye,
} from "lucide-react-native";
import { useClientApp } from "../context/client-context";
import { ClientHeader } from "../components/client-header";
import { ClientPaymentScheduleItem, ClientPaymentReceiptItem } from "../types/client";

export const AccountStatementScreen: React.FC = () => {
  const {
    selectedProperty,
    goBack,
    formatMoney,
    formatDateDisplay,
    setSelectedReceiptPayment,
  } = useClientApp();
  const [activeSubTab, setActiveSubTab] = useState<"statement" | "payments">("statement");

  if (!selectedProperty) return null;

  const totalPaid = selectedProperty.paidAmount || 0;
  const totalOverdue = selectedProperty.overdueAmount || 0;
  const totalPending = selectedProperty.pendingAmount || 0;
  const totalPrice = selectedProperty.totalPrice || 0;

  const handleDownloadStatement = () => {
    Alert.alert(
      "Estado de Cuenta Digital",
      `Estado de cuenta oficial generado para la Unidad ${selectedProperty.unitNumber} (${selectedProperty.projectName}).`,
      [{ text: "Aceptar" }]
    );
  };

  const handleScheduleRowPress = (item: ClientPaymentScheduleItem) => {
    if (item.status === "PAGADO" || (item as any).status === "Pagado") {
      const match = (selectedProperty.paymentsList || []).find(
        (pl) => pl.reciboFolio === item.receiptNumber || pl.monto === item.amount
      );
      if (match) {
        setSelectedReceiptPayment(match);
      } else {
        setSelectedReceiptPayment(item);
      }
    } else if (item.status === "ATRASADO" || (item as any).status === "Atrasado") {
      Alert.alert(
        "Cuota Vencida",
        `Esta cuota de ${formatMoney(item.amount)} venció el ${formatDateDisplay(item.scheduledDate)}. Te sugerimos realizar tu abono para regularizar tu cuenta.`,
        [{ text: "Entendido" }]
      );
    } else {
      Alert.alert(
        "Cuota Programada",
        `Cuota de ${formatMoney(item.amount)} con vencimiento el ${formatDateDisplay(item.scheduledDate)}.`,
        [{ text: "Aceptar" }]
      );
    }
  };

  const handlePaymentReceiptPress = (receipt: ClientPaymentReceiptItem) => {
    setSelectedReceiptPayment(receipt);
  };

  const scheduleItems = selectedProperty.schedule || selectedProperty.payments || [];
  const paymentsList = selectedProperty.paymentsList || [];

  return (
    <View style={styles.container}>
      <ClientHeader
        isSubscreen={true}
        screenSubtitle="ESTADO DE CUENTA Y PAGOS"
        screenTitle={`${selectedProperty.projectName} · Unidad ${selectedProperty.unitNumber}`}
        onBack={goBack}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 4 Financial KPI Summary Cards (Identical to Web) */}
        <View style={styles.kpiGrid}>
          {/* 1. Total a Pagar */}
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Total a Pagar</Text>
            <Text style={[styles.kpiVal, { color: "#1F3652" }]}>
              {formatMoney(totalPrice)}
            </Text>
          </View>

          {/* 2. Total Pagado */}
          <View style={styles.kpiCard}>
            <Text style={[styles.kpiLabel, { color: "#00875A" }]}>Total Pagado</Text>
            <Text style={[styles.kpiVal, { color: "#00875A" }]}>
              {formatMoney(totalPaid)}
            </Text>
          </View>

          {/* 3. Total Pendiente */}
          <View style={styles.kpiCard}>
            <Text style={[styles.kpiLabel, { color: "#B45309" }]}>Total Pendiente</Text>
            <Text style={[styles.kpiVal, { color: "#B45309" }]}>
              {formatMoney(totalPending)}
            </Text>
          </View>

          {/* 4. Saldo Atrasado */}
          <View style={styles.kpiCard}>
            <Text style={[styles.kpiLabel, { color: totalOverdue > 0 ? "#DC2626" : "#64748B" }]}>
              Saldo Atrasado
            </Text>
            <Text style={[styles.kpiVal, { color: totalOverdue > 0 ? "#DC2626" : "#1F3652" }]}>
              {formatMoney(totalOverdue)}
            </Text>
          </View>
        </View>

        {/* 2 Main Subtabs Selector */}
        <View style={styles.subtabsRow}>
          <TouchableOpacity
            style={[
              styles.subtabBtn,
              activeSubTab === "statement" && styles.subtabBtnActive,
            ]}
            onPress={() => setActiveSubTab("statement")}
            activeOpacity={0.8}
          >
            <Calendar
              size={15}
              color={activeSubTab === "statement" ? "#FFFFFF" : "#64748B"}
            />
            <Text
              style={[
                styles.subtabBtnText,
                activeSubTab === "statement" && styles.subtabBtnTextActive,
              ]}
            >
              Estado de Cuenta
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.subtabBtn,
              activeSubTab === "payments" && styles.subtabBtnActive,
            ]}
            onPress={() => setActiveSubTab("payments")}
            activeOpacity={0.8}
          >
            <CreditCard
              size={15}
              color={activeSubTab === "payments" ? "#FFFFFF" : "#64748B"}
            />
            <Text
              style={[
                styles.subtabBtnText,
                activeSubTab === "payments" && styles.subtabBtnTextActive,
              ]}
            >
              Pagos Realizados ({paymentsList.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* TAB 1: ESTADO DE CUENTA (CALENDARIO DE AMORTIZACIÓN) */}
        {activeSubTab === "statement" && (
          <View style={styles.tabContentWrap}>
            {/* Top Action Header */}
            <View style={styles.statementActionCard}>
              <View style={styles.statementActionLeft}>
                <Text style={styles.statementActionTitle}>
                  Calendario de Amortización
                </Text>
                <Text style={styles.statementActionSub}>
                  Cuotas pactadas y desglose de mensualidades de la unidad {selectedProperty.unitNumber}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.downloadPdfBtn}
                onPress={handleDownloadStatement}
                activeOpacity={0.85}
              >
                <Download size={14} color="#FFFFFF" />
                <Text style={styles.downloadPdfBtnText}>
                  Descargar Estado de Cuenta PDF
                </Text>
              </TouchableOpacity>
            </View>

            {/* Installments Table / Card List */}
            <View style={styles.paymentsListCard}>
              {scheduleItems.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No hay cuotas programadas</Text>
                </View>
              ) : (
                scheduleItems.map((p, idx) => {
                  const isPagado = p.status === "PAGADO" || (p.status as string) === "Pagado";
                  const isAtrasado = p.status === "ATRASADO" || (p.status as string) === "Atrasado";
                  const isParcial = (p.status as string) === "PARCIAL" || (p.status as string) === "Parcial";

                  return (
                    <TouchableOpacity
                      key={p.id || `cuota-${idx}`}
                      style={styles.installmentRow}
                      onPress={() => handleScheduleRowPress(p)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.installmentMain}>
                        <View style={styles.installmentTitleRow}>
                          <Text style={styles.installmentConcept}>
                            {p.concept || `Cuota ${idx + 1}`}
                          </Text>
                          <View
                            style={[
                              styles.statusBadge,
                              isPagado
                                ? styles.statusBadgePagado
                                : isAtrasado
                                ? styles.statusBadgeAtrasado
                                : isParcial
                                ? styles.statusBadgeParcial
                                : styles.statusBadgePendiente,
                            ]}
                          >
                            <Text
                              style={[
                                styles.statusBadgeText,
                                isPagado
                                  ? styles.statusBadgeTextPagado
                                  : isAtrasado
                                  ? styles.statusBadgeTextAtrasado
                                  : isParcial
                                  ? styles.statusBadgeTextParcial
                                  : styles.statusBadgeTextPendiente,
                              ]}
                            >
                              {isPagado ? "Pagado" : isAtrasado ? "Atrasado" : isParcial ? "Parcial" : "Pendiente"}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.installmentDetailsRow}>
                          <Text style={styles.installmentDate}>
                            Vence: {formatDateDisplay(p.scheduledDate)}
                          </Text>
                          <Text style={styles.installmentAmount}>
                            {formatMoney(p.amount)}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          </View>
        )}

        {/* TAB 2: PAGOS REALIZADOS */}
        {activeSubTab === "payments" && (
          <View style={styles.tabContentWrap}>
            <View style={styles.statementActionCard}>
              <Text style={styles.statementActionTitle}>
                Historial de Pagos Realizados
              </Text>
              <Text style={styles.statementActionSub}>
                Transacciones y abonos registrados con comprobante bancario SPEI y recibo oficial ({paymentsList.length} operaciones)
              </Text>
            </View>

            <View style={styles.paymentsListCard}>
              {paymentsList.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No hay pagos registrados para esta unidad.</Text>
                </View>
              ) : (
                paymentsList.map((pl, idx) => (
                  <View
                    key={pl.id || `pl-${idx}`}
                    style={styles.paymentReceiptRow}
                  >
                    <View style={styles.paymentReceiptLeft}>
                      <Text style={styles.receiptFolio}>
                        {pl.reciboFolio || pl.folio || `REC-${idx + 1}`}
                      </Text>
                      <Text style={styles.receiptDate}>
                        {formatDateDisplay(pl.fechaPago)} • {pl.metodoPago || "Transferencia SPEI"}
                      </Text>
                      <Text style={styles.receiptAmount}>
                        {formatMoney(pl.monto)}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.openReceiptBtn}
                      onPress={() => handlePaymentReceiptPress(pl)}
                      activeOpacity={0.8}
                    >
                      <ExternalLink size={12} color="#FFFFFF" />
                      <Text style={styles.openReceiptBtnText}>Abrir Recibo PDF</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
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
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  kpiCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
  },
  kpiVal: {
    fontSize: 15,
    fontWeight: "900",
    marginTop: 4,
  },
  subtabsRow: {
    flexDirection: "row",
    gap: 8,
  },
  subtabBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 9999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  subtabBtnActive: {
    backgroundColor: "#1B3047",
    borderColor: "#1B3047",
    shadowColor: "#1B3047",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  subtabBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },
  subtabBtnTextActive: {
    color: "#FFFFFF",
  },
  tabContentWrap: {
    gap: 14,
  },
  statementActionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 12,
  },
  statementActionLeft: {
    gap: 4,
  },
  statementActionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1F3652",
  },
  statementActionSub: {
    fontSize: 12,
    color: "#64748B",
    lineHeight: 16,
  },
  downloadPdfBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#1B3047",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 9999,
    alignSelf: "flex-start",
  },
  downloadPdfBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  paymentsListCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  installmentRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  installmentMain: {
    gap: 6,
  },
  installmentTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  installmentConcept: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1F3652",
  },
  installmentDetailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  installmentDate: {
    fontSize: 12,
    color: "#64748B",
  },
  installmentAmount: {
    fontSize: 14,
    fontWeight: "900",
    color: "#1F3652",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
    borderWidth: 1,
  },
  statusBadgePagado: {
    backgroundColor: "rgba(0, 196, 140, 0.12)",
    borderColor: "rgba(0, 196, 140, 0.3)",
  },
  statusBadgeAtrasado: {
    backgroundColor: "#FEE2E2",
    borderColor: "#FECACA",
  },
  statusBadgeParcial: {
    backgroundColor: "#EFF6FF",
    borderColor: "#BFDBFE",
  },
  statusBadgePendiente: {
    backgroundColor: "#F1F5F9",
    borderColor: "#CBD5E1",
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  statusBadgeTextPagado: {
    color: "#00A877",
  },
  statusBadgeTextAtrasado: {
    color: "#DC2626",
  },
  statusBadgeTextParcial: {
    color: "#1E40AF",
  },
  statusBadgeTextPendiente: {
    color: "#475569",
  },
  paymentReceiptRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  paymentReceiptLeft: {
    gap: 4,
    flex: 1,
  },
  receiptFolio: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1F3652",
  },
  receiptDate: {
    fontSize: 11,
    color: "#64748B",
  },
  receiptAmount: {
    fontSize: 14,
    fontWeight: "900",
    color: "#00C48C",
  },
  openReceiptBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#1B3047",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 9999,
  },
  openReceiptBtnText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  emptyState: {
    padding: 32,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 13,
    color: "#94A3B8",
    textAlign: "center",
  },
});

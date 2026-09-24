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
  ArrowLeft,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileText,
  ExternalLink,
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
  const totalPlan = selectedProperty.totalPrice || 1;
  const pctPaid = Math.round((totalPaid / totalPlan) * 100);

  const handleDownloadStatement = () => {
    Alert.alert(
      "Estado de Cuenta Digital",
      `Estado de cuenta oficial generado para la Unidad ${selectedProperty.unitNumber} (${selectedProperty.projectName}).`,
      [{ text: "Aceptar" }]
    );
  };

  const handleScheduleRowPress = (item: ClientPaymentScheduleItem) => {
    if (item.status === "PAGADO") {
      // Find matching receipt
      const match = (selectedProperty.paymentsList || []).find(
        (pl) => pl.reciboFolio === item.receiptNumber || pl.monto === item.amount
      );
      if (match) {
        setSelectedReceiptPayment(match);
      } else {
        setSelectedReceiptPayment(item);
      }
    } else if (item.status === "ATRASADO") {
      Alert.alert(
        "Cuota Vencida",
        `Esta cuota de ${formatMoney(item.amount)} venció el ${formatDateDisplay(item.scheduledDate)}. Por favor realiza tu abono para regularizar tu cuenta.`,
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
      <ClientHeader showGreeting={false} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Resumen Financiero Top Card (2x2 Grid) */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Resumen Financiero</Text>

          <View style={styles.grid2x2}>
            {/* 1. Total Pagado */}
            <View style={styles.gridCell}>
              <Text style={[styles.gridVal, { color: "#00C48C" }]}>
                {formatMoney(totalPaid)}
              </Text>
              <Text style={styles.gridLabel}>Total Pagado</Text>
            </View>

            {/* 2. Saldo Vencido */}
            <View style={styles.gridCell}>
              <Text style={[styles.gridVal, { color: totalOverdue > 0 ? "#DC2626" : "#1F3652" }]}>
                {formatMoney(totalOverdue)}
              </Text>
              <Text style={styles.gridLabel}>Saldo Vencido</Text>
            </View>

            {/* 3. Saldo Pendiente */}
            <View style={styles.gridCell}>
              <Text style={styles.gridVal}>{formatMoney(totalPending)}</Text>
              <Text style={styles.gridLabel}>Saldo Pendiente</Text>
            </View>

            {/* 4. % Pagado */}
            <View style={styles.gridCell}>
              <Text style={styles.gridVal}>{pctPaid}%</Text>
              <Text style={styles.gridLabel}>% Pagado</Text>
            </View>
          </View>

          {/* Download Account Statement Button */}
          <TouchableOpacity
            style={styles.downloadStatementBtn}
            onPress={handleDownloadStatement}
            activeOpacity={0.85}
          >
            <Download size={16} color="#FFFFFF" />
            <Text style={styles.downloadStatementBtnText}>
              Descargar Estado de Cuenta
            </Text>
          </TouchableOpacity>
        </View>

        {/* Subtabs Selector: [Estado de Cuenta] [Pagos] */}
        <View style={styles.segmentedControl}>
          <TouchableOpacity
            style={[
              styles.segmentBtn,
              activeSubTab === "statement" && styles.segmentBtnActive,
            ]}
            onPress={() => setActiveSubTab("statement")}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.segmentBtnText,
                activeSubTab === "statement" && styles.segmentBtnTextActive,
              ]}
            >
              Estado de Cuenta ({scheduleItems.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentBtn,
              activeSubTab === "payments" && styles.segmentBtnActive,
            ]}
            onPress={() => setActiveSubTab("payments")}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.segmentBtnText,
                activeSubTab === "payments" && styles.segmentBtnTextActive,
              ]}
            >
              Pagos Realizados ({paymentsList.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* TAB 1: ESTADO DE CUENTA (CALENDARIO DE CUOTAS) */}
        {activeSubTab === "statement" && (
          <View style={styles.sectionWrap}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.tableHeaderCol, { flex: 0.6 }]}>#</Text>
              <Text style={[styles.tableHeaderCol, { flex: 1.3 }]}>Concepto</Text>
              <Text style={[styles.tableHeaderCol, { flex: 1.4 }]}>Monto</Text>
              <Text style={[styles.tableHeaderCol, { flex: 1.1, textAlign: "right" }]}>Estatus</Text>
            </View>

            <View style={styles.paymentsList}>
              {scheduleItems.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No hay cuotas programadas</Text>
                </View>
              ) : (
                scheduleItems.map((p, idx) => (
                  <TouchableOpacity
                    key={p.id || `cuota-${idx}`}
                    style={styles.paymentRowCard}
                    onPress={() => handleScheduleRowPress(p)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.cellIndex, { flex: 0.6 }]}>
                      {p.cuotaNumber || idx + 1}
                    </Text>

                    <View style={{ flex: 1.3 }}>
                      <Text style={styles.cellConcept} numberOfLines={1}>
                        {p.concept || `Cuota ${idx + 1}`}
                      </Text>
                      <Text style={styles.cellDateSub}>
                        {formatDateDisplay(p.scheduledDate)}
                      </Text>
                    </View>

                    <Text style={[styles.cellAmount, { flex: 1.4 }]}>
                      {formatMoney(p.amount)}
                    </Text>

                    <View style={[styles.cellStatusGroup, { flex: 1.1 }]}>
                      {p.status === "PAGADO" ? (
                        <View style={styles.badgePagado}>
                          <Text style={styles.badgePagadoText}>Pagado</Text>
                        </View>
                      ) : p.status === "ATRASADO" ? (
                        <View style={styles.badgeAtrasado}>
                          <Text style={styles.badgeAtrasadoText}>Atrasado</Text>
                        </View>
                      ) : (
                        <View style={styles.badgePendiente}>
                          <Text style={styles.badgePendienteText}>Pendiente</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          </View>
        )}

        {/* TAB 2: PAGOS REALIZADOS & RECIBOS */}
        {activeSubTab === "payments" && (
          <View style={styles.sectionWrap}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.tableHeaderCol, { flex: 1.4 }]}>Folio / Método</Text>
              <Text style={[styles.tableHeaderCol, { flex: 1.3 }]}>Monto</Text>
              <Text style={[styles.tableHeaderCol, { flex: 1.1, textAlign: "right" }]}>Recibo</Text>
            </View>

            <View style={styles.paymentsList}>
              {paymentsList.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No hay pagos registrados aún</Text>
                </View>
              ) : (
                paymentsList.map((pl, idx) => (
                  <TouchableOpacity
                    key={pl.id || `pl-${idx}`}
                    style={styles.paymentRowCard}
                    onPress={() => handlePaymentReceiptPress(pl)}
                    activeOpacity={0.8}
                  >
                    <View style={{ flex: 1.4 }}>
                      <Text style={styles.cellConcept} numberOfLines={1}>
                        {pl.reciboFolio || pl.folio || `REC-${idx + 1}`}
                      </Text>
                      <Text style={styles.cellDateSub}>
                        {formatDateDisplay(pl.fechaPago)} • {pl.metodoPago}
                      </Text>
                    </View>

                    <Text style={[styles.cellAmount, { flex: 1.3, color: "#00C48C" }]}>
                      {formatMoney(pl.monto)}
                    </Text>

                    <View style={[styles.cellStatusGroup, { flex: 1.1 }]}>
                      <View style={styles.badgeRecibo}>
                        <ExternalLink size={11} color="#FFFFFF" />
                        <Text style={styles.badgeReciboText}>Ver Recibo</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          </View>
        )}

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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 16,
  },
  card: {
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
    gap: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#1F3652",
  },
  grid2x2: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  gridCell: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  gridVal: {
    fontSize: 17,
    fontWeight: "900",
    color: "#1F3652",
    marginBottom: 4,
  },
  gridLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
  },
  downloadStatementBtn: {
    backgroundColor: "#1F3652",
    paddingVertical: 14,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  downloadStatementBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  segmentedControl: {
    flexDirection: "row",
    backgroundColor: "#E2E8F0",
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
  },
  segmentBtnActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },
  segmentBtnTextActive: {
    color: "#1F3652",
    fontWeight: "900",
  },
  sectionWrap: {
    gap: 8,
  },
  tableHeaderRow: {
    flexDirection: "row",
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  tableHeaderCol: {
    fontSize: 11,
    fontWeight: "800",
    color: "#64748B",
    textTransform: "uppercase",
  },
  paymentsList: {
    gap: 8,
  },
  paymentRowCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  cellIndex: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1F3652",
  },
  cellConcept: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1F3652",
  },
  cellDateSub: {
    fontSize: 10,
    color: "#94A3B8",
    marginTop: 2,
  },
  cellAmount: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1F3652",
  },
  cellStatusGroup: {
    alignItems: "flex-end",
  },
  badgePagado: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgePagadoText: {
    color: "#166534",
    fontSize: 11,
    fontWeight: "800",
  },
  badgeAtrasado: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeAtrasadoText: {
    color: "#DC2626",
    fontSize: 11,
    fontWeight: "800",
  },
  badgePendiente: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgePendienteText: {
    color: "#2563EB",
    fontSize: 11,
    fontWeight: "800",
  },
  badgeRecibo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#1B3047",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 99,
  },
  badgeReciboText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  emptyState: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  emptyText: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "600",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginTop: 8,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1F3652",
  },
});

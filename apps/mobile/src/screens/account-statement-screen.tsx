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
} from "lucide-react-native";
import { useClientApp } from "../context/client-context";
import { ClientHeader } from "../components/client-header";
import { ClientPaymentScheduleItem } from "../types/client";

export const AccountStatementScreen: React.FC = () => {
  const {
    selectedProperty,
    goBack,
    formatMoney,
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
      `Se ha generado el Estado de Cuenta consolidado para la Unidad ${selectedProperty.unitNumber} (${selectedProperty.projectName}).`,
      [{ text: "Aceptar" }]
    );
  };

  const handlePaymentRowPress = (payment: ClientPaymentScheduleItem) => {
    if (payment.status === "PAGADO") {
      setSelectedReceiptPayment(payment);
    } else if (payment.status === "ATRASADO") {
      Alert.alert(
        "Cuota Vencida",
        `Esta cuota por ${formatMoney(payment.amount)} venció el ${payment.scheduledDate}. Por favor contacta a la desarrolladora para registrar tu pago o generar tu línea de captura.`,
        [{ text: "Entendido" }]
      );
    } else {
      Alert.alert(
        "Cuota Programada",
        `Esta cuota por ${formatMoney(payment.amount)} vence el ${payment.scheduledDate}.`,
        [{ text: "Aceptar" }]
      );
    }
  };

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
              Estado de Cuenta
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
              Pagos
            </Text>
          </TouchableOpacity>
        </View>

        {/* Table Header */}
        <View style={styles.tableHeaderRow}>
          <Text style={[styles.tableHeaderCol, { flex: 0.8 }]}>Unidad</Text>
          <Text style={[styles.tableHeaderCol, { flex: 1.4 }]}>Cantidad</Text>
          <Text style={[styles.tableHeaderCol, { flex: 0.8 }]}>Intereses</Text>
          <Text style={[styles.tableHeaderCol, { flex: 1.2, textAlign: "right" }]}>Estatus</Text>
        </View>

        {/* Payments List */}
        <View style={styles.paymentsList}>
          {selectedProperty.payments.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={styles.paymentRowCard}
              onPress={() => handlePaymentRowPress(p)}
              activeOpacity={0.8}
            >
              {/* Unidad */}
              <Text style={[styles.cellUnit, { flex: 0.8 }]}>
                {selectedProperty.unitNumber}
              </Text>

              {/* Cantidad */}
              <Text style={[styles.cellAmount, { flex: 1.4 }]}>
                {formatMoney(p.amount)}
              </Text>

              {/* Intereses */}
              <Text style={[styles.cellInterest, { flex: 0.8 }]}>
                ${p.interestAmount || 0}
              </Text>

              {/* Estatus Badge + Date */}
              <View style={[styles.cellStatusGroup, { flex: 1.2 }]}>
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
                <Text style={styles.paymentDateSub}>
                  {p.paidDate || p.scheduledDate}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

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
    fontSize: 18,
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
    backgroundColor: "#1F3652",
  },
  segmentBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748B",
  },
  segmentBtnTextActive: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  tableHeaderRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  tableHeaderCol: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },
  paymentsList: {
    gap: 10,
  },
  paymentRowCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  cellUnit: {
    fontSize: 15,
    fontWeight: "900",
    color: "#1F3652",
  },
  cellAmount: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1F3652",
  },
  cellInterest: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },
  cellStatusGroup: {
    alignItems: "flex-end",
    gap: 3,
  },
  badgePagado: {
    backgroundColor: "#00C48C",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
  },
  badgePagadoText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },
  badgeAtrasado: {
    backgroundColor: "#EF4444",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
  },
  badgeAtrasadoText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },
  badgePendiente: {
    backgroundColor: "#1F3652",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
  },
  badgePendienteText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },
  paymentDateSub: {
    fontSize: 10,
    color: "#94A3B8",
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

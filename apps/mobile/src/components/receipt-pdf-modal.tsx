import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from "react-native";
import { X, CheckCircle2, FileText, Download, Printer, ShieldCheck } from "lucide-react-native";
import { useClientApp } from "../context/client-context";

export const ReceiptPdfModal: React.FC = () => {
  const {
    selectedReceiptPayment,
    setSelectedReceiptPayment,
    selectedProperty,
    user,
    formatMoney,
  } = useClientApp();

  if (!selectedReceiptPayment) return null;

  const handleDownload = () => {
    Alert.alert(
      "Recibo Digital Descargado",
      `Se ha generado el recibo oficial ${selectedReceiptPayment.receiptNumber || "REC-2026-0817-01"} en PDF.`,
      [{ text: "Aceptar" }]
    );
  };

  return (
    <Modal
      visible={!!selectedReceiptPayment}
      animationType="fade"
      transparent={true}
      onRequestClose={() => setSelectedReceiptPayment(null)}
    >
      <View style={styles.modalOverlay}>
        <SafeAreaView style={styles.modalCard}>
          {/* Top Bar */}
          <View style={styles.topBar}>
            <View style={styles.topBarTitle}>
              <FileText size={18} color="#1F3652" />
              <Text style={styles.topBarText}>Recibo de Pago Digital Oficial</Text>
            </View>
            <TouchableOpacity
              onPress={() => setSelectedReceiptPayment(null)}
              style={styles.closeBtn}
              activeOpacity={0.7}
            >
              <X size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Printable Receipt Paper Container */}
          <ScrollView contentContainerStyle={styles.receiptPaper}>
            {/* Header with Developer & Devio branding */}
            <View style={styles.receiptHeader}>
              <View>
                <Text style={styles.devioBrand}>DEVIO</Text>
                <Text style={styles.devioSub}>Plataforma Inmobiliaria Integral</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.developerName}>{selectedProperty.developerName}</Text>
                <Text style={styles.projectName}>{selectedProperty.projectName}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Receipt Title & Folio */}
            <View style={styles.folioRow}>
              <View>
                <Text style={styles.receiptMainTitle}>RECIBO DE PAGO</Text>
                <Text style={styles.folioNumber}>
                  Folio: {selectedReceiptPayment.receiptNumber || "REC-2026-0817-01"}
                </Text>
              </View>
              <View style={styles.statusBadge}>
                <CheckCircle2 size={14} color="#166534" />
                <Text style={styles.statusText}>PAGADO</Text>
              </View>
            </View>

            {/* Client and Unit Info Box */}
            <View style={styles.infoBox}>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>CLIENTE / TITULAR</Text>
                <Text style={styles.infoVal}>{user?.name || "Iñigo Heredia Horner"}</Text>
                <Text style={styles.infoSub}>{user?.email || "0242573@up.edu.mx"}</Text>
                <Text style={styles.infoSub}>RFC: {user?.rfc || "HEHI9604128N2"}</Text>
              </View>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>UNIDAD ASIGNADA</Text>
                <Text style={styles.infoVal}>Unidad {selectedProperty.unitNumber}</Text>
                <Text style={styles.infoSub}>{selectedProperty.unitType} · {selectedProperty.areaM2} m²</Text>
                <Text style={styles.infoSub}>{selectedProperty.projectAddress}</Text>
              </View>
            </View>

            {/* Payment Breakdown Box */}
            <View style={styles.amountBox}>
              <Text style={styles.amountLabel}>MONTO RECIBIDO Y APLICADO</Text>
              <Text style={styles.amountValue}>
                {formatMoney(selectedReceiptPayment.paidAmount || selectedReceiptPayment.amount)} MXN
              </Text>
              <Text style={styles.amountWords}>
                (UN MILLÓN DOSCIENTOS MIL PESOS 00/100 M.N.)
              </Text>
            </View>

            {/* Details Table */}
            <View style={styles.detailsTable}>
              <View style={styles.tableRow}>
                <Text style={styles.tableColLabel}>Concepto:</Text>
                <Text style={styles.tableColVal}>{selectedReceiptPayment.concept}</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableColLabel}>Fecha de Aplicación:</Text>
                <Text style={styles.tableColVal}>{selectedReceiptPayment.paidDate || selectedReceiptPayment.scheduledDate}</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableColLabel}>Método de Pago:</Text>
                <Text style={styles.tableColVal}>{selectedReceiptPayment.paymentMethod || "Transferencia SPEI (BBVA)"}</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableColLabel}>Cuenta Receptora:</Text>
                <Text style={styles.tableColVal}>Fideicomiso Inmobiliario · BBVA México</Text>
              </View>
            </View>

            {/* Digital Security Seal */}
            <View style={styles.securitySeal}>
              <ShieldCheck size={18} color="#00C48C" />
              <View style={{ flex: 1 }}>
                <Text style={styles.securityTitle}>Comprobante Digital Verificado por Devio</Text>
                <Text style={styles.securityHash}>
                  Firma SHA256: 8f92a014b9c8112e...d47a0019e0b82
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Action Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.downloadBtn}
              onPress={handleDownload}
              activeOpacity={0.8}
            >
              <Download size={16} color="#FFFFFF" />
              <Text style={styles.downloadBtnText}>Descargar Comprobante PDF</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.7)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    width: "100%",
    maxWidth: 480,
    maxHeight: "90%",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
  },
  topBarTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  topBarText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1F3652",
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  receiptPaper: {
    padding: 20,
  },
  receiptHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  devioBrand: {
    fontSize: 20,
    fontWeight: "900",
    color: "#1F3652",
    letterSpacing: 1,
  },
  devioSub: {
    fontSize: 10,
    color: "#64748B",
    fontWeight: "600",
  },
  developerName: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1F3652",
  },
  projectName: {
    fontSize: 12,
    color: "#00C48C",
    fontWeight: "700",
  },
  divider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 14,
  },
  folioRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  receiptMainTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#1F3652",
    letterSpacing: 0.5,
  },
  folioNumber: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 99,
  },
  statusText: {
    color: "#166534",
    fontSize: 11,
    fontWeight: "800",
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 14,
    gap: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  infoCol: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "#94A3B8",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  infoVal: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1F3652",
  },
  infoSub: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  amountBox: {
    backgroundColor: "rgba(0, 196, 140, 0.08)",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0, 196, 140, 0.25)",
    marginBottom: 16,
  },
  amountLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#00875A",
    letterSpacing: 0.5,
  },
  amountValue: {
    fontSize: 26,
    fontWeight: "900",
    color: "#1F3652",
    marginVertical: 4,
  },
  amountWords: {
    fontSize: 10,
    color: "#475569",
    fontWeight: "600",
    textAlign: "center",
  },
  detailsTable: {
    gap: 8,
    marginBottom: 16,
  },
  tableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  tableColLabel: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
  },
  tableColVal: {
    fontSize: 12,
    color: "#1F3652",
    fontWeight: "700",
  },
  securitySeal: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    padding: 10,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  securityTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#166534",
  },
  securityHash: {
    fontSize: 9,
    color: "#15803D",
    fontFamily: "monospace",
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
  },
  downloadBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1F3652",
    paddingVertical: 12,
    borderRadius: 99,
    gap: 8,
  },
  downloadBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
});

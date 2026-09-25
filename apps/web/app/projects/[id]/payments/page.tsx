"use client";

import React, { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  DollarSign,
  Search,
  Download,
  ArrowUpDown,
  Calendar,
  X,
  FileSpreadsheet,
  Printer,
  CreditCard,
  Building2,
  CheckCircle2,
  Clock,
  UploadCloud,
  Edit3,
  Trash2,
  AlertTriangle,
  Check,
  Info,
  ExternalLink,
  FileText,
  Plus,
  Mail,
  Send,
  BellRing,
  AlertCircle,
} from "lucide-react";
import AppLayout from "../../../../components/layout/app-layout";
import { useProject } from "../../../../context/project-context";
import { INITIAL_PAYMENTS, PaymentScheduleItem, INITIAL_CLIENTS, UnitItem } from "../../../../data/projects-data";
import { exportTableToExcel, exportTableToPDF } from "../../../../lib/export-utils";
import { InfoTooltip } from "../../../../components/ui/tooltip";
import { DevioDatePicker } from "../../../../components/ui/devio-date-picker";
import { UploadPaymentsModal } from "../../../../components/payments/upload-payments-modal";
import { generateReceiptPDF, openReceiptInNewTab } from "../../../../lib/pdf-generator";
import { sendAndLogNotification } from "../../../../lib/notifications";

// Date range formatters
const formatYYYYMMDD = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatShortDate = (d: Date) => {
  const MONTHS_SHORT = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
};

const getInitialDateRange = () => {
  const now = new Date();
  const dStart = new Date(now);
  dStart.setDate(dStart.getDate() - 15);
  const dEnd = new Date(now);
  dEnd.setDate(dEnd.getDate() + 15);

  return {
    start: formatYYYYMMDD(dStart),
    end: formatYYYYMMDD(dEnd),
    label: `${formatShortDate(dStart)} - ${formatShortDate(dEnd)}`,
  };
};

export default function ProjectPaymentsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = (params?.id as string) || "p-1";
  const {
    getProject,
    formatMoney,
    showToast,
    updateSaleScheduleInstallment,
    updateSalePayment,
    deleteSalePayment,
    hasPermission,
    developerName,
    developerLogo,
  } = useProject();
  const project = getProject(projectId);

  // States
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<keyof PaymentScheduleItem>("scheduledDate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDIENTE" | "ATRASADO" | "PAGADO">("ALL");
  const [timeRangePreset, setTimeRangePreset] = useState<string>("WINDOW_15");
  const [dateRangeFilter, setDateRangeFilter] = useState<{ start: string; end: string; label: string }>(getInitialDateRange);
  const [customStartDate, setCustomStartDate] = useState(dateRangeFilter.start);
  const [customEndDate, setCustomEndDate] = useState(dateRangeFilter.end);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showUploadPaymentsModal, setShowUploadPaymentsModal] = useState(false);
  const [selectedPaymentForRecord, setSelectedPaymentForRecord] = useState<PaymentScheduleItem | null>(null);
  const [selectedPaymentForEdit, setSelectedPaymentForEdit] = useState<PaymentScheduleItem | null>(null);
  const [selectedPaymentForAbonos, setSelectedPaymentForAbonos] = useState<any | null>(null);
  const [selectedReceiptForView, setSelectedReceiptForView] = useState<any | null>(null);
  const [selectedVoucherForView, setSelectedVoucherForView] = useState<any | null>(null);
  const [showEditAbonoModal, setShowEditAbonoModal] = useState(false);
  const [editingAbono, setEditingAbono] = useState<any | null>(null);
  const [localPayments, setLocalPayments] = useState<PaymentScheduleItem[] | null>(null);
  const [isRunningCron, setIsRunningCron] = useState(false);

  // Ejecutar cron de cobranza automática
  const handleRunCronCobranza = async () => {
    try {
      setIsRunningCron(true);
      showToast("Ejecutando Cobranza...", "Evaluando cuotas programadas y saldos vencidos...", "info");
      const res = await fetch(`/api/cron/cobranza?projectId=${projectId}`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        showToast(
          "Cobranza Ejecutada",
          data.message || `Proceso completado. Recordatorios: ${data.summary?.remindersSent || 0}, Avisos de mora: ${data.summary?.overdueNoticesSent || 0}.`,
          "success"
        );
      } else {
        showToast("Error en Cobranza", data.error || "No se pudo ejecutar el proceso de cobranza.", "warning");
      }
    } catch (err: any) {
      showToast("Error de Conexión", err.message || "Error al conectar con el servidor", "warning");
    } finally {
      setIsRunningCron(false);
    }
  };

  // Enviar recordatorio preventivo individual
  const handleSendPaymentReminder = async (payment: PaymentScheduleItem) => {
    const payAny = payment as any;
    const rawEmail = payAny.saleRecord?.clientEmail || (payAny.clientId?.includes("@") ? payAny.clientId : undefined);
    const targetEmail = rawEmail || "acalderoncha@gmail.com";

    showToast("Enviando Recordatorio...", `Despachando recordatorio a ${payment.clientName}...`, "info");
    const res = await sendAndLogNotification({
      to: targetEmail,
      templateAlias: "recordatorio-pago",
      templateModel: {
        nombre: payment.clientName,
        correo: targetEmail,
        proyecto: project?.name || "Proyecto Inmobiliario",
        unidad: payment.unit,
        dias: 5,
        fecha_vencimiento: payment.scheduledDate,
        monto: formatMoney(payment.scheduledAmount - (payment.paidAmount || 0)),
        concepto: payAny.concept || "Mensualidad Programada",
        login_link: typeof window !== "undefined" ? `${window.location.origin}/login` : "https://devio.lat/login",
        logo_proyecto: project?.image?.startsWith("http") ? project.image : "https://6d94a8ea50a1bc576a3e8162c197d74f.cdn.bubble.io/f1777398492782x453733136803679400/lirica.jpeg",
        logo_desarrolladora: "https://6d94a8ea50a1bc576a3e8162c197d74f.cdn.bubble.io/f1777398110026x731242031517065300/grupo_veq_logo.jpeg",
        desarrolladora: project?.name ? `${project.name} (Desarrolladora)` : "Desarrolladora Inmobiliaria",
        año: new Date().getFullYear().toString(),
      },
      triggerKey: "payments.upcoming_reminder",
      triggerName: "Recordatorio Preventivo de Pago",
      recipientName: payment.clientName,
      developerName: project?.name || "Desarrolladora Inmobiliaria",
      channel: "POSTMARK",
    });

    if (res.success) {
      showToast("Recordatorio Enviado", `Se envió el recordatorio a ${targetEmail}.`, "success");
    } else {
      showToast("Error al Enviar", res.error || "No se pudo enviar el correo de recordatorio.", "warning");
    }
  };

  // Enviar aviso de morosidad individual
  const handleSendOverdueNotice = async (payment: PaymentScheduleItem) => {
    const payAny = payment as any;
    const rawEmail = payAny.saleRecord?.clientEmail || (payAny.clientId?.includes("@") ? payAny.clientId : undefined);
    const targetEmail = rawEmail || "acalderoncha@gmail.com";

    const pending = (payment.scheduledAmount || 0) - (payment.paidAmount || 0);
    showToast("Enviando Aviso de Mora...", `Despachando aviso urgente a ${payment.clientName}...`, "info");
    const res = await sendAndLogNotification({
      to: targetEmail,
      templateAlias: "moroso",
      templateModel: {
        nombre: payment.clientName,
        correo: targetEmail,
        proyecto: project?.name || "Proyecto Inmobiliario",
        unidad: payment.unit,
        dias_vencido: 10,
        fecha_vencimiento: payment.scheduledDate,
        monto: formatMoney(pending),
        concepto: (payment as any).concept || "Mensualidad Vencida",
        interes_moratorio: "3%",
        login_link: typeof window !== "undefined" ? `${window.location.origin}/login` : "https://devio.lat/login",
        logo_proyecto: project?.image?.startsWith("http") ? project.image : "https://6d94a8ea50a1bc576a3e8162c197d74f.cdn.bubble.io/f1777398492782x453733136803679400/lirica.jpeg",
        logo_desarrolladora: "https://6d94a8ea50a1bc576a3e8162c197d74f.cdn.bubble.io/f1777398110026x731242031517065300/grupo_veq_logo.jpeg",
        desarrolladora: project?.name ? `${project.name} (Desarrolladora)` : "Desarrolladora Inmobiliaria",
        año: new Date().getFullYear().toString(),
      },
      triggerKey: "payments.overdue_notice",
      triggerName: "Aviso de Saldo Vencido / Moroso",
      recipientName: payment.clientName,
      developerName: project?.name || "Desarrolladora Inmobiliaria",
      channel: "POSTMARK",
    });

    if (res.success) {
      showToast("Aviso de Mora Enviado", `Se envió la notificación de mora a ${targetEmail}.`, "success");
    } else {
      showToast("Error al Enviar", res.error || "No se pudo enviar el aviso de mora.", "warning");
    }
  };

  // Helper date parser
  const parseDateFlexible = (dStr: string): Date | null => {
    if (!dStr || dStr === "-" || dStr === "Pendiente" || dStr === "Liquidado") return null;
    if (dStr.includes("-")) {
      const parts = dStr.split("-");
      if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
        if (parts[0].length === 4) {
          return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        } else {
          return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
        }
      }
    }
    if (dStr.includes("/")) {
      const parts = dStr.split("/");
      if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
        return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
      }
    }
    const parsed = new Date(dStr);
    return isNaN(parsed.getTime()) ? null : parsed;
  };

  // Payments List dynamically derived from project sales and installments
  const derivedPayments = useMemo<PaymentScheduleItem[]>(() => {
    if (!project) return [];
    const result: PaymentScheduleItem[] = [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const soldUnitsMap = new Map<string, UnitItem>();
    (project.unitsInventory || []).forEach((u) => {
      if (u.status === "VENDIDA") {
        soldUnitsMap.set(u.unit, u);
      }
    });

    // 1. Process all active sales schedule cuotas for currently sold units
    (project.sales || []).forEach((sale, sIdx) => {
      if (sale.status === "CANCELADA") return;
      const rawUnitStr = typeof sale.unit === "object" && sale.unit !== null ? (sale.unit as any).unitNumber : sale.unit;
      const unitNum = String(rawUnitStr || "").trim();
      const clientName = sale.clientName || (sale as any).primaryClient?.fullName || "Cliente Devio";
      const planName = typeof sale.paymentPlan === "string" ? sale.paymentPlan : (sale.paymentPlan as any)?.name || "Plan de Pago";
      const targetClientId = sale.clientId || sale.clientEmail || (sale as any).primaryClient?.email || clientName;

      const totalPaidAvailable = (sale.payments && sale.payments.length > 0)
        ? sale.payments.reduce((acc: number, p: any) => acc + (Number(p.amount ?? p.monto) || 0), 0)
        : (Number(sale.paidAmount) || 0);

      let remainingPaid = totalPaidAvailable;

      const obligationsList = Array.isArray(sale.schedule) && sale.schedule.length > 0
        ? sale.schedule
        : Array.isArray((sale as any).scheduledObligations)
        ? (sale as any).scheduledObligations
        : [];

      const sortedObligations = [...obligationsList].sort((a: any, b: any) => {
        const dateA = parseDateFlexible(a.scheduledDate || a.dueDate || a.fechaProgramada || "")?.getTime() || 0;
        const dateB = parseDateFlexible(b.scheduledDate || b.dueDate || b.fechaProgramada || "")?.getTime() || 0;
        return dateA - dateB;
      });

      if (sortedObligations.length > 0) {
        sortedObligations.forEach((inst: any, idx: number) => {
          const uniqueId = inst.id && String(inst.id).includes(unitNum)
            ? inst.id
            : `pay-${unitNum}-${inst.id || idx}`;

          const sAmount = Number(inst.scheduledAmount || inst.originalAmount || inst.amount) || 0;
          const sDate = inst.scheduledDate || (inst.dueDate ? new Date(inst.dueDate).toLocaleDateString("es-MX") : "18/09/2026");

          const instDate = parseDateFlexible(sDate);
          const isOverdue = Boolean(instDate && instDate < now);

          let pAmount = 0;
          let pendAmount = sAmount;
          let status = "PENDIENTE";
          let pDate = "-";
          let pMethod = "Pendiente";

          if (remainingPaid >= sAmount && sAmount > 0) {
            pAmount = sAmount;
            pendAmount = 0;
            remainingPaid -= sAmount;
            status = "PAGADO";
            pDate = sDate;
            pMethod = inst.paymentMethod || "Transferencia SPEI";
          } else if (remainingPaid > 0) {
            pAmount = remainingPaid;
            pendAmount = Math.max(0, sAmount - remainingPaid);
            remainingPaid = 0;
            status = isOverdue ? "ATRASADO" : "PENDIENTE";
            pDate = "Parcial";
            pMethod = inst.paymentMethod || "Transferencia SPEI";
          } else {
            pAmount = Number(inst.paidAmount) || 0;
            pendAmount = inst.pendingAmount !== undefined ? Number(inst.pendingAmount) : Math.max(0, sAmount - pAmount);
            status = pendAmount === 0 && sAmount > 0 ? "PAGADO" : isOverdue && pendAmount > 0 ? "ATRASADO" : "PENDIENTE";
            pDate = pAmount > 0 ? (inst.paymentDate || "Parcial") : "-";
            pMethod = pAmount > 0 ? (inst.paymentMethod || "Transferencia SPEI") : "Pendiente";
          }

          result.push({
            id: uniqueId,
            clientId: targetClientId,
            clientName,
            unit: unitNum,
            paymentPlan: planName,
            scheduledAmount: sAmount,
            scheduledDate: sDate,
            paidAmount: pAmount,
            paymentDate: pDate,
            paymentMethod: pMethod as any,
            status: status as any,
            concept: inst.concept || inst.title || `Cuota ${idx + 1}`,
            pendingAmount: pendAmount,
            saleRecord: sale,
          } as any);
        });
      }
    });

    // 2. Fallback if no sales yet, but there are sold units in unitsInventory
    if (result.length === 0 && project.unitsInventory) {
      const soldUnits = project.unitsInventory.filter((u) => u.status === "VENDIDA");
      soldUnits.forEach((u) => {
        const clientName = u.client && u.client !== "-" ? u.client : "Cliente Propietario";
        const planName = u.salePlanName || "Plan Tradicional";
        const paid = u.salePaidAmount !== undefined ? u.salePaidAmount : Math.round(u.price * 0.2);
        const pending = u.salePendingAmount !== undefined ? u.salePendingAmount : Math.max(0, u.price - paid);

        result.push({
          id: `pay-${u.unit}-enganche`,
          clientName,
          unit: u.unit,
          paymentPlan: planName,
          scheduledAmount: paid > 0 ? paid : Math.round(u.price * 0.2),
          scheduledDate: u.saleDate || "18/09/2026",
          paidAmount: paid,
          paymentDate: paid > 0 ? "18/09/2026" : "-",
          paymentMethod: paid > 0 ? "SPEI" : "Pendiente",
          status: paid > 0 ? "PAGADO" : "PENDIENTE",
          concept: "Enganche",
          pendingAmount: 0,
        } as any);

        if (pending > 0) {
          result.push({
            id: `pay-${u.unit}-m1`,
            clientName,
            unit: u.unit,
            paymentPlan: planName,
            scheduledAmount: Math.round(pending / 12),
            scheduledDate: "18/10/2026",
            paidAmount: 0,
            paymentDate: "-",
            paymentMethod: "Pendiente",
            status: "PENDIENTE",
            concept: "Mensualidad 1",
            pendingAmount: Math.round(pending / 12),
          } as any);
        }
      });
    }

    return result;
  }, [project]);

  const payments = localPayments ?? derivedPayments;

  // Record Payment Form Modal State
  const [paymentForm, setPaymentForm] = useState({
    paidAmount: 0,
    paymentDate: new Date().toLocaleDateString("es-MX"),
    paymentMethod: "Transferencia",
    reference: "",
  });

  // Edit Installment Form State (Modificar Cuota Programada)
  const [editPaymentForm, setEditPaymentForm] = useState<{
    id: string;
    concept: string;
    clientName: string;
    unit: string;
    scheduledAmount: number;
    scheduledDate: string;
  }>({
    id: "",
    concept: "Mensualidad",
    clientName: "",
    unit: "",
    scheduledAmount: 0,
    scheduledDate: "",
  });

  // Edit Real Abono Form State (Auditoría Contable / Modificar Abono Real)
  const [editAbonoForm, setEditAbonoForm] = useState<{
    id: string;
    unit: string;
    monto: number;
    fechaPago: string;
    metodoPago: string;
    reciboFolio: string;
    notes: string;
    editReason: string;
  }>({
    id: "",
    unit: "",
    monto: 0,
    fechaPago: "",
    metodoPago: "Transferencia",
    reciboFolio: "",
    notes: "",
    editReason: "",
  });

  // Sorting handler
  const handleSort = (field: keyof PaymentScheduleItem) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Filtered & Sorted Payments
  const processedPayments = useMemo(() => {
    let result = [...payments];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.clientName.toLowerCase().includes(q) ||
          p.unit.toLowerCase().includes(q) ||
          p.paymentPlan.toLowerCase().includes(q) ||
          p.paymentMethod.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (statusFilter !== "ALL") {
      result = result.filter((p) => p.status === statusFilter);
    }

    // Date range filter
    if (dateRangeFilter.start || dateRangeFilter.end) {
      result = result.filter((p) => {
        const pDate = parseDateFlexible(p.scheduledDate);
        if (!pDate) return true;

        if (dateRangeFilter.start) {
          const parts = dateRangeFilter.start.split("-").map(Number);
          const startDate = new Date(parts[0]!, parts[1]! - 1, parts[2]!, 0, 0, 0, 0);
          if (pDate < startDate) return false;
        }
        if (dateRangeFilter.end) {
          const parts = dateRangeFilter.end.split("-").map(Number);
          const endDate = new Date(parts[0]!, parts[1]! - 1, parts[2]!, 23, 59, 59, 999);
          if (pDate > endDate) return false;
        }
        return true;
      });
    }

    // Sort
    result.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (sortField === "scheduledDate" || sortField === "paymentDate") {
        const dateA = parseDateFlexible(String(aVal || ""))?.getTime() || 0;
        const dateB = parseDateFlexible(String(bVal || ""))?.getTime() || 0;
        return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
      }

      if (typeof aVal === "string") {
        return sortDirection === "asc"
          ? (aVal as string).localeCompare(bVal as string)
          : (bVal as string).localeCompare(aVal as string);
      }

      if (typeof aVal === "number") {
        return sortDirection === "asc"
          ? (aVal as number) - (bVal as number)
          : (bVal as number) - (aVal as number);
      }

      return 0;
    });

    return result;
  }, [payments, searchQuery, sortField, sortDirection, statusFilter, timeRangePreset, dateRangeFilter]);

  // Excel Export Handler
  const handleExportExcel = () => {
    if (!project) return;
    const dataToExport = processedPayments.map((p) => ({
      "Cliente": p.clientName,
      "Monto Programado": p.scheduledAmount,
      "Fecha Programada": p.scheduledDate,
      "Monto Pagado": p.paidAmount,
      "Fecha de Pago": p.paymentDate,
      "Unidad": p.unit,
      "Plan de Pago": p.paymentPlan,
      "Método de Pago": p.paymentMethod,
      "Estado": p.status,
    }));

    exportTableToExcel(dataToExport, `Pagos_${project.name.replace(/\s+/g, "_")}`, "Pagos");
    showToast("Excel Exportado", `Se descargaron ${processedPayments.length} registros de pagos.`);
    setShowExportMenu(false);
  };

  // PDF Export Handler
  const handleExportPDF = () => {
    if (!project) return;
    const headers = [
      "Cliente",
      "Monto Programado",
      "Fecha Prog.",
      "Monto Pagado",
      "Fecha Pago",
      "Unidad",
      "Plan de Pago",
      "Método",
    ];
    const rows = processedPayments.map((p) => [
      p.clientName,
      formatMoney(p.scheduledAmount),
      p.scheduledDate,
      formatMoney(p.paidAmount),
      p.paymentDate,
      p.unit,
      p.paymentPlan,
      p.paymentMethod,
    ]);

    const totalProgramado = processedPayments.reduce((acc, p) => acc + p.scheduledAmount, 0);
    const totalCobrado = processedPayments.reduce((acc, p) => acc + p.paidAmount, 0);
    const summary = `Total Pagos: ${processedPayments.length} | Monto Programado: ${formatMoney(totalProgramado)} | Monto Cobrado: ${formatMoney(totalCobrado)}`;

    exportTableToPDF("Control de Pagos y SPEI", project.name, headers, rows, summary);
    showToast("PDF Generado", "Se abrió la ventana para imprimir/guardar PDF.");
    setShowExportMenu(false);
  };

  // Record payment handler
  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPaymentForRecord) return;

    const updated = payments.map((p) => {
      if (p.id !== selectedPaymentForRecord.id) return p;
      return {
        ...p,
        paidAmount: Number(paymentForm.paidAmount),
        paymentDate: paymentForm.paymentDate,
        paymentMethod: paymentForm.paymentMethod as any,
        status: "PAGADO" as const,
      };
    });

    setLocalPayments(updated);
    showToast("Pago Registrado", `Se aplicó el pago de ${formatMoney(paymentForm.paidAmount)} para la unidad ${selectedPaymentForRecord.unit}.`);
    setSelectedPaymentForRecord(null);
  };

  // Open Edit Cuota Programada Modal
  const handleOpenEditPayment = (payment: PaymentScheduleItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedPaymentForEdit(payment);
    setEditPaymentForm({
      id: payment.id,
      concept: (payment as any).concept || "Mensualidad",
      clientName: payment.clientName,
      unit: payment.unit,
      scheduledAmount: payment.scheduledAmount,
      scheduledDate: payment.scheduledDate,
    });
  };

  // Save Modified Cuota Programada (Recomputes cascade on schedule)
  const handleSaveEditPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPaymentForEdit) return;

    updateSaleScheduleInstallment(projectId, selectedPaymentForEdit.unit, selectedPaymentForEdit.id, {
      concept: editPaymentForm.concept,
      scheduledAmount: Number(editPaymentForm.scheduledAmount),
      scheduledDate: editPaymentForm.scheduledDate,
    });

    setSelectedPaymentForEdit(null);
  };

  // Open Edit Real Abono Modal (Auditoría Contable)
  const handleOpenEditAbono = (abono: any) => {
    setEditingAbono(abono);
    setEditAbonoForm({
      id: abono.id,
      unit: abono.unit || selectedPaymentForAbonos?.unit || "",
      monto: abono.paidAmount || abono.monto || abono.amount || 0,
      fechaPago: abono.paymentDate || abono.fechaPago || new Date().toLocaleDateString("es-MX"),
      metodoPago: abono.paymentMethod || abono.metodoPago || "Transferencia",
      reciboFolio: abono.receiptFolio || abono.reciboFolio || `REC-${abono.unit || "DEV"}-001`,
      notes: abono.notes || "",
      editReason: "Corrección de fecha y conciliación bancaria",
    });
    setShowEditAbonoModal(true);
  };

  // Save Modified Real Abono
  const handleSaveEditAbono = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAbono) return;

    const unit = editAbonoForm.unit || selectedPaymentForAbonos?.unit;
    updateSalePayment(projectId, unit, editingAbono.id, {
      amount: Number(editAbonoForm.monto),
      paymentDate: editAbonoForm.fechaPago,
      paymentMethod: editAbonoForm.metodoPago,
      notes: editAbonoForm.notes,
    });

    setShowEditAbonoModal(false);
    setEditingAbono(null);
    setSelectedPaymentForAbonos(null);
  };

  // Delete Real Abono
  const handleDeleteAbono = (abono: any) => {
    const unit = abono.unit || selectedPaymentForAbonos?.unit;
    if (confirm("⚠️ Advertencia: ¿Estás seguro de que deseas revertir este abono? Se actualizará el saldo pendiente y se recalcularán las cuotas en cascada.")) {
      deleteSalePayment(projectId, unit, abono.id);
      setSelectedPaymentForAbonos(null);
    }
  };

  // Navigate to real client page
  const handleNavigateToClient = (payment: PaymentScheduleItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    // 1. Direct clientId if present
    const targetClientId =
      (payment as any).clientId ||
      (payment as any).saleRecord?.clientId ||
      (payment as any).saleRecord?.clientEmail ||
      (payment as any).saleRecord?.clientName;

    if (targetClientId) {
      router.push(`/projects/${projectId}/clients/${encodeURIComponent(targetClientId)}?unit=${encodeURIComponent(payment.unit)}`);
      return;
    }

    // 2. Lookup in project.sales
    const matchedSale = (project?.sales || []).find(
      (s) => s.unit === payment.unit || s.clientName?.toLowerCase() === payment.clientName?.toLowerCase()
    );
    if (matchedSale) {
      const cId = matchedSale.clientId || matchedSale.clientEmail || matchedSale.clientName;
      router.push(`/projects/${projectId}/clients/${encodeURIComponent(cId)}?unit=${encodeURIComponent(payment.unit)}`);
      return;
    }

    // 3. Fallback
    router.push(`/projects/${projectId}/clients/${encodeURIComponent(payment.clientName)}?unit=${encodeURIComponent(payment.unit)}`);
  };

  if (!project) return null;

  if (!hasPermission("payments.view")) {
    return (
      <AppLayout activeProjectId={projectId} projectSubTab="payments">
        <main style={{ padding: "3rem 2rem", flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "50%", backgroundColor: "#FEE2E2", color: "#DC2626", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}>
            <DollarSign size={32} />
          </div>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#1F3652", marginBottom: "0.5rem" }}>
            Módulo No Autorizado
          </h2>
          <p style={{ fontSize: "0.85rem", color: "#64748B", maxWidth: "420px", lineHeight: 1.5 }}>
            Tu usuario no cuenta con el permiso requerido (<strong>payments.view</strong>) para consultar el calendario de pagos y cobranza de este proyecto.
          </p>
        </main>
      </AppLayout>
    );
  }

  return (
    <AppLayout activeProjectId={projectId} projectSubTab="payments">
      <main style={{ padding: "1.25rem 2rem 2rem 2rem", flex: 1, overflowY: "auto" }}>
        
        {/* ENCABEZADO PRINCIPAL */}
        <div style={{ marginBottom: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#1F3652", margin: 0 }}>
              Pagos
            </h1>
            <InfoTooltip
              title="Módulo Central de Pagos"
              content="Control centralizado de cobranza, transferencias bancarias SPEI, emisión de recibos y conciliación de amortizaciones."
            />
          </div>
        </div>

        {/* CONTENEDOR PRINCIPAL BLANCO */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "1.25rem",
            padding: "1.5rem",
            boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
            border: "1px solid rgba(22, 43, 63, 0.05)",
          }}
        >
          {/* BARRA SUPERIOR: BUSCADOR + FECHA + DESCARGAR */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", marginBottom: "1.25rem" }}>
            
            {/* Input Buscar por nombre */}
            <div style={{ position: "relative", flex: 1, maxWidth: "480px" }}>
              <Search
                size={18}
                style={{
                  position: "absolute",
                  left: "1rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#94A3B8",
                  pointerEvents: "none",
                }}
              />
              <input
                type="text"
                placeholder="Buscar por cliente, unidad o plan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.65rem 1rem 0.65rem 2.75rem",
                  borderRadius: "9999px",
                  border: "1px solid #E2E8F0",
                  backgroundColor: "#FFFFFF",
                  fontSize: "0.85rem",
                  color: "#1F3652",
                  outline: "none",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  style={{
                    position: "absolute",
                    right: "1rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "#94A3B8",
                    cursor: "pointer",
                  }}
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Selector de Rango de Fechas */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={{ position: "relative" }}>
                <button
                  type="button"
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.45rem",
                    padding: "0.6rem 1.1rem",
                    borderRadius: "9999px",
                    border: "1px solid #E2E8F0",
                    backgroundColor: "#FFFFFF",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    color: "#1F3652",
                    cursor: "pointer",
                  }}
                >
                  <Calendar size={14} color="#64748B" />
                  {dateRangeFilter.label}
                </button>

                {showDatePicker && (
                  <div
                    style={{
                      position: "absolute",
                      right: 0,
                      top: "calc(100% + 6px)",
                      backgroundColor: "#FFFFFF",
                      borderRadius: "0.85rem",
                      boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
                      border: "1px solid #E2E8F0",
                      padding: "0.75rem",
                      zIndex: 50,
                      minWidth: "260px",
                    }}
                  >
                    <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748B", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Rangos Predefinidos
                    </div>
                    {(() => {
                      const now = new Date();
                      const d15Start = new Date(now);
                      d15Start.setDate(d15Start.getDate() - 15);
                      const d15End = new Date(now);
                      d15End.setDate(d15End.getDate() + 15);

                      const d30Start = new Date(now);
                      d30Start.setDate(d30Start.getDate() - 30);

                      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

                      const next30End = new Date(now);
                      next30End.setDate(next30End.getDate() + 30);

                      const next90End = new Date(now);
                      next90End.setDate(next90End.getDate() + 90);

                      const presets = [
                        {
                          label: "±15 días (Recomendado)",
                          start: formatYYYYMMDD(d15Start),
                          end: formatYYYYMMDD(d15End),
                          displayLabel: `${formatShortDate(d15Start)} - ${formatShortDate(d15End)}`,
                        },
                        {
                          label: "Últimos 30 días",
                          start: formatYYYYMMDD(d30Start),
                          end: formatYYYYMMDD(now),
                          displayLabel: `${formatShortDate(d30Start)} - ${formatShortDate(now)}`,
                        },
                        {
                          label: "Mes Actual",
                          start: formatYYYYMMDD(monthStart),
                          end: formatYYYYMMDD(monthEnd),
                          displayLabel: `${formatShortDate(monthStart)} - ${formatShortDate(monthEnd)}`,
                        },
                        {
                          label: "Próximos 30 días",
                          start: formatYYYYMMDD(now),
                          end: formatYYYYMMDD(next30End),
                          displayLabel: `${formatShortDate(now)} - ${formatShortDate(next30End)}`,
                        },
                        {
                          label: "Próximos 90 días",
                          start: formatYYYYMMDD(now),
                          end: formatYYYYMMDD(next90End),
                          displayLabel: `${formatShortDate(now)} - ${formatShortDate(next90End)}`,
                        },
                        {
                          label: "Todo el tiempo",
                          start: "",
                          end: "",
                          displayLabel: "Todo el tiempo",
                        },
                      ];

                      return presets.map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setDateRangeFilter({ start: item.start, end: item.end, label: item.displayLabel });
                            setCustomStartDate(item.start);
                            setCustomEndDate(item.end);
                            setShowDatePicker(false);
                          }}
                          style={{
                            width: "100%",
                            textAlign: "left",
                            padding: "0.45rem 0.65rem",
                            borderRadius: "0.4rem",
                            border: "none",
                            background: dateRangeFilter.start === item.start && dateRangeFilter.end === item.end ? "rgba(31, 54, 82, 0.08)" : "transparent",
                            color: dateRangeFilter.start === item.start && dateRangeFilter.end === item.end ? "#1F3652" : "#64748B",
                            fontSize: "0.78rem",
                            fontWeight: dateRangeFilter.start === item.start && dateRangeFilter.end === item.end ? 700 : 500,
                            cursor: "pointer",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <span>{item.label}</span>
                          {dateRangeFilter.start === item.start && dateRangeFilter.end === item.end && (
                            <Check size={13} color="#1F3652" />
                          )}
                        </button>
                      ));
                    })()}

                    <div style={{ height: "1px", backgroundColor: "#E2E8F0", margin: "0.6rem 0" }} />

                    <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748B", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Rango Personalizado
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem", marginBottom: "0.75rem" }}>
                      <div>
                        <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#64748B", display: "block", marginBottom: "0.25rem" }}>Desde:</label>
                        <DevioDatePicker
                          value={customStartDate}
                          onChange={(val) => setCustomStartDate(val)}
                          placeholder="Fecha inicio"
                          showPresets={false}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#64748B", display: "block", marginBottom: "0.25rem" }}>Hasta:</label>
                        <DevioDatePicker
                          value={customEndDate}
                          onChange={(val) => setCustomEndDate(val)}
                          placeholder="Fecha fin"
                          showPresets={false}
                        />
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "0.4rem" }}>
                      <button
                        type="button"
                        onClick={() => {
                          if (customStartDate && customEndDate) {
                            const [sY, sM, sD] = customStartDate.split("-").map(Number);
                            const [eY, eM, eD] = customEndDate.split("-").map(Number);
                            const dS = new Date(sY!, sM! - 1, sD!);
                            const dE = new Date(eY!, eM! - 1, eD!);
                            const customLabel = `${formatShortDate(dS)} - ${formatShortDate(dE)}`;
                            setDateRangeFilter({ start: customStartDate, end: customEndDate, label: customLabel });
                          } else if (customStartDate) {
                            const [sY, sM, sD] = customStartDate.split("-").map(Number);
                            const dS = new Date(sY!, sM! - 1, sD!);
                            setDateRangeFilter({ start: customStartDate, end: "", label: `Desde ${formatShortDate(dS)}` });
                          } else if (customEndDate) {
                            const [eY, eM, eD] = customEndDate.split("-").map(Number);
                            const dE = new Date(eY!, eM! - 1, eD!);
                            setDateRangeFilter({ start: "", end: customEndDate, label: `Hasta ${formatShortDate(dE)}` });
                          } else {
                            setDateRangeFilter({ start: "", end: "", label: "Todo el tiempo" });
                          }
                          setShowDatePicker(false);
                        }}
                        style={{
                          flex: 1,
                          backgroundColor: "#1F3652",
                          color: "#FFFFFF",
                          padding: "0.45rem",
                          borderRadius: "0.4rem",
                          border: "none",
                          fontSize: "0.78rem",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Aplicar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const initial = getInitialDateRange();
                          setDateRangeFilter(initial);
                          setCustomStartDate(initial.start);
                          setCustomEndDate(initial.end);
                          setShowDatePicker(false);
                        }}
                        style={{
                          padding: "0.45rem 0.6rem",
                          backgroundColor: "#F1F5F9",
                          color: "#64748B",
                          borderRadius: "0.4rem",
                          border: "none",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Botón Ejecutar Cobranza Automática (Cron) */}
              <button
                type="button"
                onClick={handleRunCronCobranza}
                disabled={isRunningCron}
                title="Evalúa todas las cuotas y dispara recordatorios y avisos de mora programados"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.45rem",
                  backgroundColor: isRunningCron ? "#E2E8F0" : "rgba(47, 128, 237, 0.08)",
                  color: isRunningCron ? "#64748B" : "#2F80ED",
                  border: "1.5px solid rgba(47, 128, 237, 0.3)",
                  padding: "0.6rem 1.25rem",
                  borderRadius: "9999px",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  cursor: isRunningCron ? "not-allowed" : "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <BellRing size={15} /> {isRunningCron ? "Procesando..." : "Ejecutar Cobranza"}
              </button>

              {/* Botón Carga Masiva XLSX */}
              {hasPermission("payments.bulk_import") && (
                <button
                  type="button"
                  onClick={() => setShowUploadPaymentsModal(true)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.45rem",
                    backgroundColor: "rgba(0, 196, 140, 0.08)",
                    color: "#00A877",
                    border: "1.5px solid rgba(0, 196, 140, 0.3)",
                    padding: "0.6rem 1.25rem",
                    borderRadius: "9999px",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <FileSpreadsheet size={15} /> Carga Masiva XLSX
                </button>
              )}

              {/* Botón Descargar Pagos (Excel / PDF) */}
              {hasPermission("payments.export") && (
                <div style={{ position: "relative" }}>
                  <button
                    type="button"
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.45rem",
                      backgroundColor: "#1B3047",
                      color: "#FFFFFF",
                      padding: "0.6rem 1.4rem",
                      borderRadius: "9999px",
                      fontSize: "0.82rem",
                      fontWeight: 600,
                      border: "none",
                      cursor: "pointer",
                      boxShadow: "0 2px 6px rgba(27, 48, 71, 0.15)",
                    }}
                  >
                    <Download size={15} /> Descargar Pagos (Excel)
                  </button>

                {showExportMenu && (
                  <div
                    style={{
                      position: "absolute",
                      right: 0,
                      top: "calc(100% + 6px)",
                      backgroundColor: "#FFFFFF",
                      borderRadius: "0.85rem",
                      boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
                      border: "1px solid #E2E8F0",
                      padding: "0.4rem",
                      zIndex: 50,
                      minWidth: "200px",
                    }}
                  >
                    <button
                      type="button"
                      onClick={handleExportExcel}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "0.6rem 0.85rem",
                        borderRadius: "0.5rem",
                        border: "none",
                        background: "transparent",
                        color: "#1F3652",
                        fontSize: "0.82rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <FileSpreadsheet size={16} color="#00C48C" /> Exportar a Excel (.xlsx)
                    </button>
                    <button
                      type="button"
                      onClick={handleExportPDF}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "0.6rem 0.85rem",
                        borderRadius: "0.5rem",
                        border: "none",
                        background: "transparent",
                        color: "#1F3652",
                        fontSize: "0.82rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <Printer size={16} color="#2F80ED" /> Imprimir / Exportar a PDF
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

          {/* TABLA DE PAGOS */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, textAlign: "left" }}>
              <thead>
                <tr style={{ backgroundColor: "#1B3047", color: "#FFFFFF" }}>
                  <th style={{ width: "65px", padding: "0.85rem 0.75rem", borderTopLeftRadius: "0.75rem", borderBottomLeftRadius: "0.75rem", textAlign: "center" }}>
                    Acción
                  </th>

                  <th
                    onClick={() => handleSort("clientName")}
                    style={{
                      padding: "0.85rem 1.25rem",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      userSelect: "none",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      Cliente
                      <ArrowUpDown size={13} style={{ opacity: sortField === "clientName" ? 1 : 0.4 }} />
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort("scheduledAmount")}
                    style={{
                      padding: "0.85rem 1rem",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      userSelect: "none",
                      textAlign: "right",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.4rem" }}>
                      Monto programado
                      <ArrowUpDown size={13} style={{ opacity: sortField === "scheduledAmount" ? 1 : 0.4 }} />
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort("scheduledDate")}
                    style={{
                      padding: "0.85rem 1rem",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      userSelect: "none",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      Fecha programada
                      <ArrowUpDown size={13} style={{ opacity: sortField === "scheduledDate" ? 1 : 0.4 }} />
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort("paidAmount")}
                    style={{
                      padding: "0.85rem 1rem",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      userSelect: "none",
                      textAlign: "right",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.4rem" }}>
                      Monto pagado
                      <ArrowUpDown size={13} style={{ opacity: sortField === "paidAmount" ? 1 : 0.4 }} />
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort("paymentDate")}
                    style={{
                      padding: "0.85rem 1rem",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      userSelect: "none",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}>
                      Fecha de pago
                      <ArrowUpDown size={13} style={{ opacity: sortField === "paymentDate" ? 1 : 0.4 }} />
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort("unit")}
                    style={{
                      padding: "0.85rem 1rem",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      userSelect: "none",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}>
                      Unidad
                      <ArrowUpDown size={13} style={{ opacity: sortField === "unit" ? 1 : 0.4 }} />
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort("paymentPlan")}
                    style={{
                      padding: "0.85rem 1rem",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      userSelect: "none",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      Plan de Pago
                      <ArrowUpDown size={13} style={{ opacity: sortField === "paymentPlan" ? 1 : 0.4 }} />
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort("paymentMethod")}
                    style={{
                      padding: "0.85rem 1.25rem",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      userSelect: "none",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}>
                      Método de pago
                      <ArrowUpDown size={13} style={{ opacity: sortField === "paymentMethod" ? 1 : 0.4 }} />
                    </div>
                  </th>

                  <th
                    style={{
                      padding: "0.85rem 1.25rem",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      borderTopRightRadius: "0.75rem",
                      borderBottomRightRadius: "0.75rem",
                      textAlign: "center",
                      userSelect: "none",
                    }}
                  >
                    Abonos / Recibo
                  </th>
                </tr>
              </thead>

              <tbody>
                {processedPayments.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ padding: "4rem 2rem", textAlign: "center" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                        <div
                          style={{
                            width: "56px",
                            height: "56px",
                            borderRadius: "16px",
                            backgroundColor: "rgba(31, 54, 82, 0.06)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "var(--devio-blue)",
                            marginBottom: "1rem",
                          }}
                        >
                          <DollarSign size={28} />
                        </div>
                        <h4 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--devio-blue-dark)", margin: "0 0 0.35rem 0" }}>
                          {searchQuery.trim() ? "No se encontraron cobros ni pagos" : "No hay calendario de cobranza activo"}
                        </h4>
                        <p style={{ fontSize: "0.85rem", color: "var(--devio-neutral-3)", maxWidth: "440px", margin: "0 0 1.25rem 0", lineHeight: 1.5 }}>
                          {searchQuery.trim()
                            ? "No hay registros de pago que coincidan con la búsqueda."
                            : "El calendario de pagos se generará automáticamente a partir de los planes de financiamiento de las ventas formalizadas."}
                        </p>
                        {!searchQuery.trim() && (
                          <button
                            type="button"
                            onClick={() => router.push(`/projects/${projectId}/sales`)}
                            style={{
                              backgroundColor: "var(--devio-blue-dark)",
                              color: "var(--devio-white)",
                              padding: "0.6rem 1.4rem",
                              borderRadius: "9999px",
                              fontSize: "0.82rem",
                              fontWeight: 700,
                              border: "none",
                              cursor: "pointer",
                              boxShadow: "0 2px 6px rgba(27, 48, 71, 0.15)",
                            }}
                          >
                            Ir a Ventas
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  processedPayments.map((p, pIdx) => {
                    const isPaid = p.paidAmount > 0;

                    return (
                      <tr
                        key={p.id ? `${p.id}-${pIdx}` : `pay-${p.unit}-${pIdx}`}
                        onClick={() => handleNavigateToClient(p)}
                        style={{
                          borderBottom: "1px solid #F1F5F9",
                          cursor: "pointer",
                          transition: "background-color 0.15s ease",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(31, 54, 82, 0.02)")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                      >
                        {/* Botón Editar Pago */}
                        <td style={{ padding: "1rem 0.75rem", textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
                          {hasPermission("payments.edit_schedule") ? (
                            <button
                              type="button"
                              onClick={(e) => handleOpenEditPayment(p, e)}
                              style={{ background: "none", border: "none", color: "#2F80ED", cursor: "pointer", padding: "4px" }}
                              title="Modificar fecha, monto o conciliar pago"
                            >
                              <Edit3 size={15} />
                            </button>
                          ) : (
                            <span title="Sin permiso para modificar plan de pagos" style={{ opacity: 0.3, cursor: "not-allowed", display: "inline-block", padding: "4px" }}>
                              <Edit3 size={15} color="#94A3B8" />
                            </span>
                          )}
                        </td>

                        {/* Cliente (con link a su estado de cuenta) */}
                        <td
                          style={{ padding: "1rem 1.25rem", fontWeight: 600, color: "#1F3652", fontSize: "0.85rem" }}
                          onClick={(e) => handleNavigateToClient(p, e)}
                        >
                          <span style={{ textDecoration: "underline", textUnderlineOffset: "3px", color: "#1F3652" }}>
                            {p.clientName}
                          </span>
                        </td>

                        {/* Monto programado */}
                        <td style={{ padding: "1rem 1rem", fontSize: "0.85rem", color: "#1F3652", textAlign: "right" }}>
                          {formatMoney(p.scheduledAmount)}
                        </td>

                        {/* Fecha programada */}
                        <td style={{ padding: "1rem 1rem", fontSize: "0.85rem", color: "#475569" }}>
                          {p.scheduledDate}
                        </td>

                        {/* Monto pagado */}
                        <td style={{ padding: "1rem 1rem", fontSize: "0.85rem", fontWeight: 800, color: isPaid ? "#00C48C" : "#1F3652", textAlign: "right" }}>
                          {formatMoney(p.paidAmount)}
                        </td>

                        {/* Fecha de pago (Pill Pendiente/Atrasado o fecha) */}
                        <td style={{ padding: "1rem 1rem", textAlign: "center" }}>
                          {p.status === "ATRASADO" ? (
                            <span
                              style={{
                                display: "inline-block",
                                backgroundColor: "#EF4444",
                                color: "#FFFFFF",
                                padding: "0.22rem 0.65rem",
                                borderRadius: "0.45rem",
                                fontSize: "0.74rem",
                                fontWeight: 700,
                              }}
                            >
                              Atrasado
                            </span>
                          ) : p.paymentDate === "Pendiente" || p.status === "PENDIENTE" ? (
                            <span
                              style={{
                                display: "inline-block",
                                backgroundColor: "#E5C46A",
                                color: "#FFFFFF",
                                padding: "0.22rem 0.65rem",
                                borderRadius: "0.45rem",
                                fontSize: "0.74rem",
                                fontWeight: 600,
                              }}
                            >
                              Pendiente
                            </span>
                          ) : (
                            <span style={{ fontSize: "0.85rem", color: "#475569", fontWeight: 500 }}>
                              {p.paymentDate}
                            </span>
                          )}
                        </td>

                        {/* Unidad */}
                        <td style={{ padding: "1rem 1rem", fontWeight: 700, color: "#1F3652", fontSize: "0.85rem", textAlign: "center" }}>
                          {p.unit}
                        </td>

                        {/* Plan de Pago */}
                        <td style={{ padding: "1rem 1rem", fontSize: "0.85rem", color: "#475569" }}>
                          {p.paymentPlan}
                        </td>

                        {/* Método de pago */}
                        <td style={{ padding: "1rem 1.25rem", textAlign: "center" }}>
                          {p.paymentMethod === "Pendiente" ? (
                            <span
                              style={{
                                display: "inline-block",
                                backgroundColor: "#E5C46A",
                                color: "#FFFFFF",
                                padding: "0.22rem 0.65rem",
                                borderRadius: "0.45rem",
                                fontSize: "0.74rem",
                                fontWeight: 600,
                              }}
                            >
                              Pendiente
                            </span>
                          ) : (
                            <span style={{ fontSize: "0.85rem", color: "#1F3652", fontWeight: 600 }}>
                              {p.paymentMethod}
                            </span>
                          )}
                        </td>

                        {/* Botón Ver Abonos / Recibo / Notificar */}
                        <td style={{ padding: "0.75rem 1rem", textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                            <button
                              type="button"
                              onClick={() => setSelectedPaymentForAbonos(p)}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.35rem",
                                backgroundColor: p.paidAmount > 0 ? "rgba(0, 196, 140, 0.12)" : "rgba(47, 128, 237, 0.08)",
                                color: p.paidAmount > 0 ? "#00A877" : "#2F80ED",
                                border: p.paidAmount > 0 ? "1px solid rgba(0, 196, 140, 0.25)" : "1px solid rgba(47, 128, 237, 0.2)",
                                padding: "0.35rem 0.65rem",
                                borderRadius: "0.5rem",
                                fontSize: "0.75rem",
                                fontWeight: 700,
                                cursor: "pointer",
                                transition: "all 0.15s ease",
                                whiteSpace: "nowrap",
                              }}
                            >
                              <FileText size={13} /> {p.paidAmount > 0 ? "Abonos" : "Detalle"}
                            </button>

                            {p.status === "ATRASADO" && (
                              <button
                                type="button"
                                onClick={() => handleSendOverdueNotice(p)}
                                title="Enviar aviso formal de mora con intereses por correo"
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "0.3rem",
                                  backgroundColor: "#FEF2F2",
                                  color: "#DC2626",
                                  border: "1px solid #FECACA",
                                  padding: "0.35rem 0.6rem",
                                  borderRadius: "0.5rem",
                                  fontSize: "0.74rem",
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                <AlertTriangle size={12} /> Notificar Mora
                              </button>
                            )}

                            {p.status === "PENDIENTE" && (
                              <button
                                type="button"
                                onClick={() => handleSendPaymentReminder(p)}
                                title="Enviar recordatorio preventivo de pago por correo"
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "0.3rem",
                                  backgroundColor: "rgba(47, 128, 237, 0.08)",
                                  color: "#2F80ED",
                                  border: "1px solid rgba(47, 128, 237, 0.25)",
                                  padding: "0.35rem 0.6rem",
                                  borderRadius: "0.5rem",
                                  fontSize: "0.74rem",
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                <Send size={12} /> Recordar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer de resumen */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1.25rem", paddingTop: "1rem", borderTop: "1px solid #F1F5F9", fontSize: "0.78rem", color: "#64748B" }}>
            <span>Mostrando <strong>{processedPayments.length}</strong> de <strong>{payments.length}</strong> pagos programados</span>
            <span>Total Cobrado en periodo: <strong>{formatMoney(payments.reduce((acc, p) => acc + p.paidAmount, 0))}</strong></span>
          </div>
        </div>

        {/* MODAL 1: REGISTRAR PAGO RÁPIDO */}
        {selectedPaymentForRecord && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(15, 23, 42, 0.65)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
              padding: "1rem",
              backdropFilter: "blur(4px)",
            }}
          >
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "1.25rem",
                width: "100%",
                maxWidth: "540px",
                maxHeight: "90vh",
                overflowY: "auto",
                boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
                padding: "2rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
                <div>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#2F80ED", textTransform: "uppercase" }}>
                    Gestión de Cobranza
                  </span>
                  <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#1F3652", margin: "0.2rem 0 0" }}>
                    Registrar Pago • Unidad {selectedPaymentForRecord.unit}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPaymentForRecord(null)}
                  style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer" }}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleRecordPayment}>
                <div style={{ backgroundColor: "#F8FAFC", borderRadius: "0.85rem", padding: "1rem", border: "1px solid #E2E8F0", marginBottom: "1.25rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                    <span style={{ fontSize: "0.8rem", color: "#64748B" }}>Cliente:</span>
                    <strong style={{ fontSize: "0.85rem", color: "#1F3652" }}>{selectedPaymentForRecord.clientName}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                    <span style={{ fontSize: "0.8rem", color: "#64748B" }}>Monto Programado:</span>
                    <strong style={{ fontSize: "0.85rem", color: "#1F3652" }}>{formatMoney(selectedPaymentForRecord.scheduledAmount)}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "0.8rem", color: "#64748B" }}>Fecha Programada:</span>
                    <strong style={{ fontSize: "0.85rem", color: "#1F3652" }}>{selectedPaymentForRecord.scheduledDate}</strong>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.5rem" }}>
                  <div>
                    <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#1F3652", display: "block", marginBottom: "0.35rem" }}>
                      Monto Recibido ($ MXN)
                    </label>
                    <input
                      type="number"
                      value={paymentForm.paidAmount}
                      onChange={(e) => setPaymentForm({ ...paymentForm, paidAmount: Number(e.target.value) })}
                      style={{
                        width: "100%",
                        padding: "0.65rem 0.85rem",
                        borderRadius: "0.6rem",
                        border: "1px solid #CBD5E1",
                        fontSize: "0.9rem",
                        fontWeight: 700,
                        color: "#1F3652",
                      }}
                      required
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                    <div>
                      <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#1F3652", display: "block", marginBottom: "0.35rem" }}>
                        Fecha de Depósito
                      </label>
                      <DevioDatePicker
                        value={paymentForm.paymentDate}
                        onChange={(val) => setPaymentForm({ ...paymentForm, paymentDate: val })}
                        placeholder="Seleccionar fecha"
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#1F3652", display: "block", marginBottom: "0.35rem" }}>
                        Método de Pago
                      </label>
                      <select
                        value={paymentForm.paymentMethod}
                        onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                        style={{
                          width: "100%",
                          padding: "0.65rem 0.85rem",
                          borderRadius: "0.6rem",
                          border: "1px solid #CBD5E1",
                          fontSize: "0.85rem",
                          color: "#1F3652",
                          backgroundColor: "#FFFFFF",
                        }}
                      >
                        <option value="Transferencia">Transferencia SPEI</option>
                        <option value="SPEI">SPEI</option>
                        <option value="Cheque">Cheque</option>
                        <option value="Efectivo">Efectivo</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentForRecord(null)}
                    style={{
                      padding: "0.65rem 1.4rem",
                      borderRadius: "9999px",
                      border: "1px solid #CBD5E1",
                      backgroundColor: "#FFFFFF",
                      color: "#64748B",
                      fontSize: "0.82rem",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.45rem",
                      backgroundColor: "#1B3047",
                      color: "#FFFFFF",
                      padding: "0.65rem 1.75rem",
                      borderRadius: "9999px",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    <CheckCircle2 size={16} /> Aplicar Pago
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* MODAL 2: MODIFICAR CUOTA PROGRAMADA (EFECTO CASCADA)           */}
        {/* ============================================================== */}
        {selectedPaymentForEdit && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(15, 23, 42, 0.65)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
              padding: "1.5rem",
              backdropFilter: "blur(5px)",
            }}
          >
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "1.5rem",
                width: "100%",
                maxWidth: "540px",
                maxHeight: "90vh",
                overflowY: "auto",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                padding: "2rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
                <div>
                  <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#2F80ED", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Calendario de Amortización
                  </span>
                  <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#1F3652", margin: "0.2rem 0 0" }}>
                    Modificar Cuota Programada
                  </h2>
                  <p style={{ fontSize: "0.8rem", color: "#64748B", margin: "0.2rem 0 0" }}>
                    Unidad {selectedPaymentForEdit.unit} • Cliente: {selectedPaymentForEdit.clientName}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPaymentForEdit(null)}
                  style={{ background: "#F1F5F9", border: "none", color: "#64748B", cursor: "pointer", width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* BANNER INFORMATIVO DE EFECTO CASCADA */}
              <div
                style={{
                  backgroundColor: "#EFF6FF",
                  border: "1.5px solid #BFDBFE",
                  borderRadius: "0.85rem",
                  padding: "1rem",
                  marginBottom: "1.25rem",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.75rem",
                }}
              >
                <Info size={20} color="#2563EB" style={{ flexShrink: 0, marginTop: "2px" }} />
                <div style={{ fontSize: "0.78rem", color: "#1E40AF", lineHeight: 1.4 }}>
                  <strong>Lógica de Amortización:</strong> Aquí se edita el compromiso pactado (monto o fecha). El <em>Monto Pagado</em> de esta cuota se recalculará automáticamente distribuyendo los abonos reales ya registrados mediante el <strong>efecto cascada</strong>.
                </div>
              </div>

              <form onSubmit={handleSaveEditPayment}>
                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1F3652", display: "block", marginBottom: "0.35rem" }}>
                    Concepto de la Cuota
                  </label>
                  <input
                    type="text"
                    value={editPaymentForm.concept}
                    onChange={(e) => setEditPaymentForm({ ...editPaymentForm, concept: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.85rem",
                      borderRadius: "0.6rem",
                      border: "1px solid #CBD5E1",
                      fontSize: "0.85rem",
                      color: "#1F3652",
                      fontWeight: 600,
                    }}
                    required
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
                  <div>
                    <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1F3652", display: "block", marginBottom: "0.35rem" }}>
                      Monto Programado ($ MXN)
                    </label>
                    <input
                      type="number"
                      value={editPaymentForm.scheduledAmount}
                      onChange={(e) => setEditPaymentForm({ ...editPaymentForm, scheduledAmount: Number(e.target.value) })}
                      style={{
                        width: "100%",
                        padding: "0.65rem 0.85rem",
                        borderRadius: "0.6rem",
                        border: "1px solid #CBD5E1",
                        fontSize: "0.9rem",
                        fontWeight: 700,
                        color: "#1F3652",
                      }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1F3652", display: "block", marginBottom: "0.35rem" }}>
                      Fecha Programada
                    </label>
                    <DevioDatePicker
                      value={editPaymentForm.scheduledDate}
                      onChange={(val) => setEditPaymentForm({ ...editPaymentForm, scheduledDate: val })}
                      placeholder="Seleccionar fecha"
                    />
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentForEdit(null)}
                    style={{
                      padding: "0.7rem 1.5rem",
                      borderRadius: "9999px",
                      border: "1px solid #CBD5E1",
                      backgroundColor: "#FFFFFF",
                      color: "#64748B",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.45rem",
                      backgroundColor: "#1B3047",
                      color: "#FFFFFF",
                      padding: "0.7rem 1.75rem",
                      borderRadius: "9999px",
                      fontSize: "0.88rem",
                      fontWeight: 700,
                      border: "none",
                      cursor: "pointer",
                      boxShadow: "0 4px 12px rgba(27, 48, 71, 0.2)",
                    }}
                  >
                    <Check size={16} /> Guardar y Recalcular Cascada
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 3: DESGLOSE DE ABONOS Y RECIBO DE CUOTA */}
        {selectedPaymentForAbonos && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(10, 25, 41, 0.7)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10001,
              padding: "1rem",
            }}
          >
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "1.25rem",
                width: "100%",
                maxWidth: "680px",
                maxHeight: "90vh",
                overflowY: "auto",
                padding: "1.75rem",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.3)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 800,
                        backgroundColor: "#1B3047",
                        color: "#FFFFFF",
                        padding: "0.2rem 0.6rem",
                        borderRadius: "0.35rem",
                      }}
                    >
                      Unidad {selectedPaymentForAbonos.unit}
                    </span>
                    <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#1F3652", margin: 0 }}>
                      Desglose de Cuota: {selectedPaymentForAbonos.scheduledDate}
                    </h3>
                  </div>
                  <span style={{ fontSize: "0.8rem", color: "#64748B" }}>
                    Cliente: <strong>{selectedPaymentForAbonos.clientName}</strong> • Plan: {selectedPaymentForAbonos.paymentPlan} • Estatus: <strong>{selectedPaymentForAbonos.status}</strong>
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedPaymentForAbonos(null)}
                  style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer" }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Tarjeta Resumen Financiero */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "0.75rem",
                  backgroundColor: "#F8FAFC",
                  padding: "1rem",
                  borderRadius: "0.85rem",
                  border: "1px solid #E2E8F0",
                  marginBottom: "1.25rem",
                }}
              >
                <div>
                  <span style={{ fontSize: "0.72rem", color: "#64748B", display: "block" }}>Importe Programado</span>
                  <strong style={{ fontSize: "1rem", color: "#1F3652" }}>
                    {formatMoney(selectedPaymentForAbonos.scheduledAmount)}
                  </strong>
                </div>
                <div>
                  <span style={{ fontSize: "0.72rem", color: "#64748B", display: "block" }}>Monto Abonado</span>
                  <strong style={{ fontSize: "1rem", color: selectedPaymentForAbonos.paidAmount > 0 ? "#00C48C" : "#64748B" }}>
                    {formatMoney(selectedPaymentForAbonos.paidAmount)}
                  </strong>
                </div>
                <div>
                  <span style={{ fontSize: "0.72rem", color: "#64748B", display: "block" }}>Saldo Pendiente</span>
                  <strong style={{ fontSize: "1rem", color: selectedPaymentForAbonos.pendingAmount > 0 ? "#1F3652" : "#00C48C" }}>
                    {formatMoney(selectedPaymentForAbonos.pendingAmount !== undefined ? selectedPaymentForAbonos.pendingAmount : Math.max(0, selectedPaymentForAbonos.scheduledAmount - selectedPaymentForAbonos.paidAmount))}
                  </strong>
                </div>
              </div>

              {/* Historial de Abonos */}
              <h4 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#1F3652", marginBottom: "0.75rem" }}>
                Historial de Abonos y Transacciones ({selectedPaymentForAbonos.paidAmount > 0 ? 1 : 0})
              </h4>

              {selectedPaymentForAbonos.paidAmount <= 0 ? (
                <div
                  style={{
                    padding: "2rem 1.5rem",
                    textAlign: "center",
                    backgroundColor: "#FAFBFD",
                    borderRadius: "0.75rem",
                    border: "1px dashed #CBD5E1",
                    marginBottom: "1.5rem",
                  }}
                >
                  <CreditCard size={32} color="#94A3B8" style={{ margin: "0 auto 0.5rem auto" }} />
                  <p style={{ fontSize: "0.85rem", color: "#64748B", margin: 0 }}>
                    Aún no se han registrado transacciones de abono para esta cuota.
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginBottom: "1.5rem" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "0.85rem 1rem",
                      backgroundColor: "#FFFFFF",
                      border: "1px solid #E2E8F0",
                      borderRadius: "0.75rem",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.02)",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span
                          style={{
                            fontSize: "0.72rem",
                            fontWeight: 800,
                            backgroundColor: "rgba(0, 196, 140, 0.12)",
                            color: "#00A877",
                            padding: "0.15rem 0.5rem",
                            borderRadius: "0.3rem",
                          }}
                        >
                          REC-DEV-{selectedPaymentForAbonos.unit}-{Date.now().toString().slice(-4)}
                        </span>
                        <strong style={{ fontSize: "0.9rem", color: "#1F3652" }}>
                          {formatMoney(selectedPaymentForAbonos.paidAmount)}
                        </strong>
                      </div>
                      <span style={{ fontSize: "0.75rem", color: "#64748B", display: "block", marginTop: "0.2rem" }}>
                        Fecha de cobro: {selectedPaymentForAbonos.paymentDate} • Método: {selectedPaymentForAbonos.paymentMethod}
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      {hasPermission("payments.audit_abonos") && (
                        <button
                          type="button"
                          onClick={() => handleOpenEditAbono(selectedPaymentForAbonos)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.25rem",
                            backgroundColor: "#F1F5F9",
                            color: "#1F3652",
                            border: "1px solid #CBD5E1",
                            padding: "0.35rem 0.6rem",
                            borderRadius: "0.45rem",
                            fontSize: "0.74rem",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                          title="Auditoría contable: modificar monto real, fecha bancaria o método"
                        >
                          <Edit3 size={12} color="#2F80ED" /> Editar
                        </button>
                      )}

                      {hasPermission("payments.delete") && (
                        <button
                          type="button"
                          onClick={() => handleDeleteAbono(selectedPaymentForAbonos)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.25rem",
                            backgroundColor: "#FEF2F2",
                            color: "#EF4444",
                            border: "1px solid #FECACA",
                            padding: "0.35rem 0.6rem",
                            borderRadius: "0.45rem",
                            fontSize: "0.74rem",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                          title="Revertir este abono"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedReceiptForView(selectedPaymentForAbonos);
                          setSelectedPaymentForAbonos(null);
                        }}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.35rem",
                          padding: "0.35rem 0.65rem",
                          borderRadius: "0.45rem",
                          border: "1px solid #CBD5E1",
                          backgroundColor: "#FFFFFF",
                          color: "#1F3652",
                          fontSize: "0.74rem",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        <Printer size={12} color="#2F80ED" /> Recibo
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedVoucherForView(selectedPaymentForAbonos);
                          setSelectedPaymentForAbonos(null);
                        }}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.35rem",
                          padding: "0.35rem 0.65rem",
                          borderRadius: "0.45rem",
                          border: "1px solid rgba(47, 128, 237, 0.25)",
                          backgroundColor: "rgba(47, 128, 237, 0.08)",
                          color: "#2F80ED",
                          fontSize: "0.74rem",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        <FileText size={12} /> SPEI
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                {hasPermission("payments.register") ? (
                  <button
                    type="button"
                    onClick={() => {
                      const payToRecord = selectedPaymentForAbonos;
                      setSelectedPaymentForAbonos(null);
                      setSelectedPaymentForRecord(payToRecord);
                    }}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      padding: "0.55rem 1.15rem",
                      borderRadius: "9999px",
                      border: "none",
                      backgroundColor: "rgba(0, 196, 140, 0.15)",
                      color: "#00A877",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    <Plus size={15} /> Registrar Nuevo Abono
                  </button>
                ) : <div />}

                <button
                  type="button"
                  onClick={() => setSelectedPaymentForAbonos(null)}
                  style={{
                    padding: "0.55rem 1.25rem",
                    borderRadius: "9999px",
                    border: "1px solid #CBD5E1",
                    backgroundColor: "#FFFFFF",
                    color: "#1F3652",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 6: AUDITORÍA CONTABLE / MODIFICAR ABONO REAL */}
        {showEditAbonoModal && editingAbono && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(15, 23, 42, 0.65)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10003,
              padding: "1.5rem",
              backdropFilter: "blur(5px)",
            }}
          >
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "1.5rem",
                width: "100%",
                maxWidth: "580px",
                maxHeight: "90vh",
                overflowY: "auto",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                padding: "2rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
                <div>
                  <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#E05345", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Auditoría Contable
                  </span>
                  <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#1F3652", margin: "0.2rem 0 0" }}>
                    Modificar Registro de Pago ({editAbonoForm.reciboFolio})
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEditAbonoModal(false)}
                  style={{ background: "#F1F5F9", border: "none", color: "#64748B", cursor: "pointer", width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* BANNER DE ADVERTENCIA INSTITUCIONAL */}
              <div
                style={{
                  backgroundColor: "#FFFBEB",
                  border: "1.5px solid #FCD34D",
                  borderRadius: "0.85rem",
                  padding: "1rem",
                  marginBottom: "1.25rem",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.75rem",
                }}
              >
                <AlertTriangle size={20} color="#D97706" style={{ flexShrink: 0, marginTop: "2px" }} />
                <div style={{ fontSize: "0.78rem", color: "#92400E", lineHeight: 1.4 }}>
                  <strong>Advertencia de Impacto Financiero:</strong> Modificar una fecha o monto de pago alterará de inmediato el calendario de amortización, el saldo insoluto pendiente y los cálculos de cobranza de la unidad {editAbonoForm.unit}.
                </div>
              </div>

              <form onSubmit={handleSaveEditAbono}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                  <div>
                    <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1F3652", display: "block", marginBottom: "0.35rem" }}>
                      Monto Pagado / Cobrado ($ MXN)
                    </label>
                    <input
                      type="number"
                      value={editAbonoForm.monto}
                      onChange={(e) => setEditAbonoForm({ ...editAbonoForm, monto: Number(e.target.value) })}
                      style={{
                        width: "100%",
                        padding: "0.65rem 0.85rem",
                        borderRadius: "0.6rem",
                        border: "1px solid #CBD5E1",
                        fontSize: "0.9rem",
                        fontWeight: 700,
                        color: "#1F3652",
                      }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1F3652", display: "block", marginBottom: "0.35rem" }}>
                      Fecha Real de Pago
                    </label>
                    <DevioDatePicker
                      value={editAbonoForm.fechaPago}
                      onChange={(val) => setEditAbonoForm({ ...editAbonoForm, fechaPago: val })}
                      placeholder="Seleccionar fecha de pago"
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                  <div>
                    <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1F3652", display: "block", marginBottom: "0.35rem" }}>
                      Método de Pago
                    </label>
                    <select
                      value={editAbonoForm.metodoPago}
                      onChange={(e) => setEditAbonoForm({ ...editAbonoForm, metodoPago: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "0.65rem 0.85rem",
                        borderRadius: "0.6rem",
                        border: "1px solid #CBD5E1",
                        fontSize: "0.85rem",
                        color: "#1F3652",
                        backgroundColor: "#FFFFFF",
                        fontWeight: 600,
                      }}
                    >
                      <option value="Transferencia">Transferencia</option>
                      <option value="SPEI">SPEI Interbancario</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Efectivo">Efectivo</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1F3652", display: "block", marginBottom: "0.35rem" }}>
                      Folio / Recibo
                    </label>
                    <input
                      type="text"
                      value={editAbonoForm.reciboFolio}
                      onChange={(e) => setEditAbonoForm({ ...editAbonoForm, reciboFolio: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "0.65rem 0.85rem",
                        borderRadius: "0.6rem",
                        border: "1px solid #CBD5E1",
                        fontSize: "0.85rem",
                        color: "#1F3652",
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: "1.5rem" }}>
                  <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1F3652", display: "block", marginBottom: "0.35rem" }}>
                    Motivo o Justificación del Reajuste Contable
                  </label>
                  <input
                    type="text"
                    value={editAbonoForm.editReason}
                    onChange={(e) => setEditAbonoForm({ ...editAbonoForm, editReason: e.target.value })}
                    placeholder="Ej. Aclaración bancaria de fecha real de depósito SPEI"
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.85rem",
                      borderRadius: "0.6rem",
                      border: "1px solid #CBD5E1",
                      fontSize: "0.85rem",
                      color: "#1F3652",
                    }}
                    required
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                  <button
                    type="button"
                    onClick={() => setShowEditAbonoModal(false)}
                    style={{
                      padding: "0.7rem 1.5rem",
                      borderRadius: "9999px",
                      border: "1px solid #CBD5E1",
                      backgroundColor: "#FFFFFF",
                      color: "#64748B",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.45rem",
                      backgroundColor: "#1B3047",
                      color: "#FFFFFF",
                      padding: "0.7rem 2rem",
                      borderRadius: "9999px",
                      fontSize: "0.88rem",
                      fontWeight: 700,
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    <Check size={16} /> Aplicar Reajuste
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* MODAL 4: RECIBO OFICIAL DE PAGO (PREVIEW & ABRIR)             */}
        {/* ============================================================== */}
        {selectedReceiptForView && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(15, 23, 42, 0.65)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10002,
              padding: "1rem",
              backdropFilter: "blur(4px)",
            }}
          >
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "1.25rem",
                width: "100%",
                maxWidth: "620px",
                maxHeight: "92vh",
                overflowY: "auto",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                padding: "2rem",
              }}
            >
              {/* Encabezado con Folio */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
                <div>
                  <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#1F3652", margin: 0 }}>
                    Recibo Oficial de Pago
                  </h3>
                  <span style={{ fontSize: "0.8rem", color: "#64748B" }}>
                    Folio: {selectedReceiptForView.folio || selectedReceiptForView.receiptFolio || `REC-DEV-${selectedReceiptForView.unit}-${Date.now().toString().slice(-4)}`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedReceiptForView(null)}
                  style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer", padding: "4px" }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Vista Previa Documental (PDF Preview Card) */}
              <div style={{ border: "1px solid #E2E8F0", borderRadius: "1rem", padding: "1.5rem", backgroundColor: "#FFFFFF", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)", marginBottom: "1.5rem" }}>
                {/* Header de Logos del Documento */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "1rem", borderBottom: "2px solid #1F3652", marginBottom: "1.2rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    {(developerLogo || (typeof window !== "undefined" && localStorage.getItem("devio_developer_logo"))) ? (
                      <img
                        src={
                          developerLogo ||
                          (typeof window !== "undefined" && (localStorage.getItem("devio_developer_logo") || sessionStorage.getItem("devio_developer_logo"))) ||
                          ""
                        }
                        style={{ height: "36px", maxWidth: "120px", objectFit: "contain" }}
                        alt="Logo Desarrollador"
                      />
                    ) : (
                      <span style={{ fontWeight: 800, fontSize: "0.95rem", color: "#1F3652" }}>{developerName || "Devio"}</span>
                    )}
                    <div style={{ width: "1px", height: "26px", backgroundColor: "#CBD5E1" }}></div>
                    <img
                      src={
                        project?.logoFileName ||
                        project?.logoUrl ||
                        project?.logo ||
                        (project?.image && project.image.startsWith("http") ? project.image : developerLogo || "")
                      }
                      style={{ height: "36px", maxWidth: "120px", objectFit: "contain", borderRadius: "4px" }}
                      alt="Logo Proyecto"
                    />
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ display: "inline-block", fontSize: "0.75rem", fontWeight: 700, color: "#166534", backgroundColor: "#DCFCE7", padding: "3px 9px", borderRadius: "99px" }}>
                      ✓ Pago Aplicado
                    </span>
                  </div>
                </div>

                {/* Resumen del Monto */}
                <div style={{ backgroundColor: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "0.75rem", padding: "1rem 1.25rem", borderTop: "3px solid #1F3652", marginBottom: "1rem" }}>
                  <div style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748B", fontWeight: 700, marginBottom: "2px" }}>
                    Monto Total Abonado
                  </div>
                  <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#1F3652" }}>
                    {formatMoney(selectedReceiptForView.paidAmount || selectedReceiptForView.amount || selectedReceiptForView.scheduledAmount || 0)}
                  </div>
                </div>

                {/* Datos de la transacción */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", fontSize: "0.82rem" }}>
                  <div>
                    <span style={{ color: "#64748B", display: "block", fontSize: "0.75rem" }}>Proyecto / Unidad:</span>
                    <strong style={{ color: "#1F3652" }}>{project.name} • {selectedReceiptForView.unit}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748B", display: "block", fontSize: "0.75rem" }}>Cliente:</span>
                    <strong style={{ color: "#1F3652" }}>{selectedReceiptForView.clientName || selectedReceiptForView.client || "Cliente Devio"}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748B", display: "block", fontSize: "0.75rem" }}>Fecha de Pago:</span>
                    <strong style={{ color: "#1F3652" }}>{selectedReceiptForView.paymentDate || new Date().toLocaleDateString("es-MX")}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748B", display: "block", fontSize: "0.75rem" }}>Método:</span>
                    <strong style={{ color: "#1F3652" }}>{selectedReceiptForView.paymentMethod || selectedReceiptForView.method || "Transferencia SPEI"}</strong>
                  </div>
                </div>
              </div>

              {/* Botones de Acción: Abrir en Nueva Ventana y Descargar PDF */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                <button
                  type="button"
                  onClick={() => {
                    const devLogoUrl =
                      developerLogo ||
                      (typeof window !== "undefined" && (localStorage.getItem("devio_developer_logo") || sessionStorage.getItem("devio_developer_logo"))) ||
                      "";
                    const projLogoUrl =
                      project?.logoFileName ||
                      project?.logoUrl ||
                      project?.logo ||
                      (project?.image && project.image.startsWith("http") ? project.image : devLogoUrl);

                    openReceiptInNewTab({
                      folio: selectedReceiptForView.folio || selectedReceiptForView.receiptFolio || `REC-DEV-${selectedReceiptForView.unit}-${Date.now().toString().slice(-4)}`,
                      projectName: project?.name || "Proyecto Inmobiliario",
                      unitNumber: selectedReceiptForView.unit,
                      clientName: selectedReceiptForView.clientName || selectedReceiptForView.client || "Cliente Devio",
                      paymentMethod: selectedReceiptForView.paymentMethod || selectedReceiptForView.method || "Transferencia SPEI",
                      totalAmount: Number(selectedReceiptForView.paidAmount || selectedReceiptForView.amount || selectedReceiptForView.scheduledAmount || 0),
                      capitalAmount: Number(selectedReceiptForView.paidAmount || selectedReceiptForView.amount || selectedReceiptForView.scheduledAmount || 0),
                      interestAmount: 0,
                      emissionDate: selectedReceiptForView.paymentDate || new Date().toLocaleDateString("es-MX"),
                      developerLogoUrl: devLogoUrl,
                      projectLogoUrl: projLogoUrl,
                      developerName: developerName || "Desarrolladora Inmobiliaria",
                    });
                  }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.45rem",
                    padding: "0.65rem 1.25rem",
                    borderRadius: "9999px",
                    border: "1.5px solid #CBD5E1",
                    backgroundColor: "#FFFFFF",
                    color: "#1F3652",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <ExternalLink size={15} /> Abrir
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      showToast("Generando Recibo...", "Preparando documento oficial para descarga.", "info");
                      const devLogoUrl =
                        developerLogo ||
                        (typeof window !== "undefined" && (localStorage.getItem("devio_developer_logo") || sessionStorage.getItem("devio_developer_logo"))) ||
                        "";
                      const projLogoUrl =
                        project?.logoFileName ||
                        project?.logoUrl ||
                        project?.logo ||
                        (project?.image && project.image.startsWith("http") ? project.image : devLogoUrl);

                      await generateReceiptPDF({
                        folio: selectedReceiptForView.folio || selectedReceiptForView.receiptFolio || `REC-DEV-${selectedReceiptForView.unit}-${Date.now().toString().slice(-4)}`,
                        projectName: project?.name || "Proyecto Inmobiliario",
                        unitNumber: selectedReceiptForView.unit,
                        clientName: selectedReceiptForView.clientName || selectedReceiptForView.client || "Cliente Devio",
                        paymentMethod: selectedReceiptForView.paymentMethod || selectedReceiptForView.method || "Transferencia SPEI",
                        totalAmount: Number(selectedReceiptForView.paidAmount || selectedReceiptForView.amount || selectedReceiptForView.scheduledAmount || 0),
                        capitalAmount: Number(selectedReceiptForView.paidAmount || selectedReceiptForView.amount || selectedReceiptForView.scheduledAmount || 0),
                        interestAmount: 0,
                        emissionDate: selectedReceiptForView.paymentDate || new Date().toLocaleDateString("es-MX"),
                        developerLogoUrl: devLogoUrl,
                        projectLogoUrl: projLogoUrl,
                        developerName: developerName || "Desarrolladora Inmobiliaria",
                      });
                      showToast("Descarga Lista", "Se descargó el recibo en formato PDF.", "success");
                    } catch (err) {
                      console.error("Error generating receipt PDF:", err);
                      showToast("Error al Generar", "No se pudo generar el PDF del recibo.", "warning");
                    }
                    setSelectedReceiptForView(null);
                  }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.45rem",
                    padding: "0.65rem 1.5rem",
                    borderRadius: "9999px",
                    border: "none",
                    backgroundColor: "#1B3047",
                    color: "#FFFFFF",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  <Download size={15} /> Descargar PDF
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* MODAL 5: COMPROBANTE BANCARIO SPEI (SUBIR O ABRIR)             */}
        {/* ============================================================== */}
        {selectedVoucherForView && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(15, 23, 42, 0.65)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10002,
              padding: "1rem",
              backdropFilter: "blur(4px)",
            }}
          >
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "1.25rem",
                width: "100%",
                maxWidth: "620px",
                maxHeight: "92vh",
                overflowY: "auto",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                padding: "2rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
                <div>
                  <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#1F3652", margin: 0 }}>
                    Comprobante Bancario SPEI
                  </h3>
                  <span style={{ fontSize: "0.8rem", color: "#64748B" }}>Unidad {selectedVoucherForView.unit} • {selectedVoucherForView.paymentDate || "Fecha de pago"}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedVoucherForView(null)}
                  style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer", padding: "4px" }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Si hay comprobante adjunto, mostrar tarjeta limpia con acciones de ver/descargar */}
              {(() => {
                const voucherUrl = (selectedVoucherForView as any).comprobanteUrl || (selectedVoucherForView as any).voucherUrl;
                const hasVoucher = Boolean(selectedVoucherForView.voucherName || voucherUrl);

                if (hasVoucher) {
                  return (
                    <>
                      <div
                        style={{
                          border: "1px solid #E2E8F0",
                          borderRadius: "1rem",
                          padding: "2rem 1.5rem",
                          textAlign: "center",
                          backgroundColor: "#F8FAFC",
                          marginBottom: "1.5rem",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: "0.75rem",
                        }}
                      >
                        <div style={{ width: "48px", height: "48px", borderRadius: "12px", backgroundColor: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <FileText size={26} color="#2F80ED" />
                        </div>
                        <strong style={{ fontSize: "0.95rem", color: "#1F3652", wordBreak: "break-all" }}>
                          {selectedVoucherForView.voucherName || `Comprobante_Unidad_${selectedVoucherForView.unit}.pdf`}
                        </strong>
                        <span style={{ fontSize: "0.82rem", color: "#64748B" }}>
                          Monto transferido: <strong>{formatMoney(selectedVoucherForView.paidAmount || selectedVoucherForView.scheduledAmount || 0)}</strong>
                          {selectedVoucherForView.reference ? ` • Ref: ${selectedVoucherForView.reference}` : ""}
                        </span>
                      </div>

                      {/* Botones de Acción cuando SÍ hay comprobante */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <input
                            id="voucher-replace-file-input-payments"
                            type="file"
                            accept=".pdf,image/*"
                            style={{ display: "none" }}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file && selectedVoucherForView) {
                                const reader = new FileReader();
                                reader.onload = (loadEvent) => {
                                  const dataUrl = (loadEvent.target?.result as string) || "";
                                  setSelectedVoucherForView({
                                    ...selectedVoucherForView,
                                    voucherName: file.name,
                                    comprobanteUrl: dataUrl,
                                  });
                                  updateSalePayment(projectId, selectedVoucherForView.unit, selectedVoucherForView.id, {
                                    voucherName: file.name,
                                    voucherUrl: dataUrl,
                                  });
                                  showToast("Comprobante Actualizado", `Se actualizó "${file.name}".`, "success");
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const input = document.getElementById("voucher-replace-file-input-payments");
                              if (input) input.click();
                            }}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.4rem",
                              padding: "0.55rem 1rem",
                              borderRadius: "9999px",
                              border: "1px solid #CBD5E1",
                              backgroundColor: "#FFFFFF",
                              color: "#64748B",
                              fontSize: "0.78rem",
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            <UploadCloud size={14} /> Cambiar Archivo
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (confirm("¿Estás seguro de que deseas eliminar este comprobante?")) {
                                updateSalePayment(projectId, selectedVoucherForView.unit, selectedVoucherForView.id, {
                                  voucherName: undefined,
                                  voucherUrl: undefined,
                                });
                                setSelectedVoucherForView({
                                  ...selectedVoucherForView,
                                  voucherName: undefined,
                                  comprobanteUrl: undefined,
                                });
                                showToast("Comprobante Eliminado", "Se eliminó el comprobante adjunto.", "info");
                              }
                            }}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.4rem",
                              padding: "0.55rem 1rem",
                              borderRadius: "9999px",
                              border: "1px solid #FCA5A5",
                              backgroundColor: "#FEF2F2",
                              color: "#DC2626",
                              fontSize: "0.78rem",
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            <Trash2 size={14} /> Eliminar
                          </button>
                        </div>

                        <div style={{ display: "flex", gap: "0.75rem" }}>
                          <button
                            type="button"
                            onClick={() => {
                              if (voucherUrl) {
                                if (voucherUrl.startsWith("data:") || voucherUrl.startsWith("http") || voucherUrl.startsWith("blob:")) {
                                  const newTab = window.open();
                                  if (newTab) {
                                    if (voucherUrl.startsWith("data:image")) {
                                      newTab.document.write(`<img src="${voucherUrl}" style="max-width:100%;" />`);
                                    } else if (voucherUrl.startsWith("data:application/pdf")) {
                                      newTab.document.write(`<iframe src="${voucherUrl}" style="width:100%; height:100vh; border:none;"></iframe>`);
                                    } else {
                                      newTab.location.href = voucherUrl;
                                    }
                                  }
                                } else {
                                  window.open(voucherUrl, "_blank");
                                }
                              } else {
                                showToast("Vista Previa", `Abriendo comprobante ${selectedVoucherForView.voucherName}...`);
                              }
                            }}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.45rem",
                              padding: "0.65rem 1.25rem",
                              borderRadius: "9999px",
                              border: "1.5px solid #CBD5E1",
                              backgroundColor: "#FFFFFF",
                              color: "#1F3652",
                              fontSize: "0.82rem",
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            <ExternalLink size={15} /> Abrir
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const downloadUrl = voucherUrl;
                              const fileName = selectedVoucherForView.voucherName || `Comprobante_${selectedVoucherForView.unit}.pdf`;
                              if (downloadUrl) {
                                const a = document.createElement("a");
                                a.href = downloadUrl;
                                a.download = fileName;
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                                showToast("Descarga Completa", `Descargando ${fileName}...`, "success");
                              } else {
                                showToast("Descarga", `Descargando ${fileName}...`, "info");
                              }
                            }}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.45rem",
                              padding: "0.65rem 1.5rem",
                              borderRadius: "9999px",
                              border: "none",
                              backgroundColor: "#1B3047",
                              color: "#FFFFFF",
                              fontSize: "0.82rem",
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            <Download size={15} /> Descargar Archivo
                          </button>
                        </div>
                      </div>
                    </>
                  );
                }

                // Si NO hay comprobante adjunto: SOLO mostrar zona de subida y botón de cerrar
                return (
                  <>
                    <div
                      onClick={() => {
                        const input = document.getElementById("voucher-file-input-payments");
                        if (input) input.click();
                      }}
                      style={{
                        border: "2px dashed #CBD5E1",
                        borderRadius: "1rem",
                        padding: "2.5rem 1.5rem",
                        textAlign: "center",
                        backgroundColor: "#F8FAFC",
                        marginBottom: "1.5rem",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "0.75rem",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F1F5F9")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#F8FAFC")}
                    >
                      <input
                        id="voucher-file-input-payments"
                        type="file"
                        accept=".pdf,image/*"
                        style={{ display: "none" }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file && selectedVoucherForView) {
                            const reader = new FileReader();
                            reader.onload = (loadEvent) => {
                              const dataUrl = (loadEvent.target?.result as string) || "";
                              setSelectedVoucherForView({
                                ...selectedVoucherForView,
                                voucherName: file.name,
                                comprobanteUrl: dataUrl,
                              });
                              updateSalePayment(projectId, selectedVoucherForView.unit, selectedVoucherForView.id, {
                                voucherName: file.name,
                                voucherUrl: dataUrl,
                              });
                              showToast("Comprobante Guardado", `Se adjuntó "${file.name}" a este pago.`, "success");
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      <div style={{ width: "48px", height: "48px", borderRadius: "50%", backgroundColor: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <UploadCloud size={24} color="#2F80ED" />
                      </div>
                      <div>
                        <strong style={{ fontSize: "0.95rem", color: "#1F3652", display: "block" }}>
                          Sin comprobante adjunto
                        </strong>
                        <span style={{ fontSize: "0.8rem", color: "#64748B", display: "block", marginTop: "2px" }}>
                          Haz clic para seleccionar o arrastra el archivo (PDF o Imagen)
                        </span>
                      </div>
                    </div>

                    {/* Botones cuando NO hay archivo: Solo subir y cerrar */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <button
                        type="button"
                        onClick={() => {
                          const input = document.getElementById("voucher-file-input-payments");
                          if (input) input.click();
                        }}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.4rem",
                          padding: "0.65rem 1.25rem",
                          borderRadius: "9999px",
                          border: "1px solid #CBD5E1",
                          backgroundColor: "#FFFFFF",
                          color: "#1F3652",
                          fontSize: "0.82rem",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        <UploadCloud size={15} color="#2F80ED" /> Subir Archivo
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedVoucherForView(null)}
                        style={{
                          padding: "0.65rem 1.4rem",
                          borderRadius: "9999px",
                          border: "none",
                          backgroundColor: "#1B3047",
                          color: "#FFFFFF",
                          fontSize: "0.82rem",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Cerrar
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {/* MODAL DE CARGA MASIVA DE PAGOS */}
        {showUploadPaymentsModal && project && (
          <UploadPaymentsModal
            isOpen={showUploadPaymentsModal}
            onClose={() => setShowUploadPaymentsModal(false)}
            project={project}
          />
        )}

      </main>
    </AppLayout>
  );
}

"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  User,
  Mail,
  Phone,
  Building2,
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  CreditCard,
  Download,
  Plus,
  X,
  FileText,
  UploadCloud,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Trash2,
  Eye,
  FileSpreadsheet,
  Printer,
  Check,
  Info,
  Layers,
  ArrowUpDown,
  Edit3,
  Users,
  Percent,
  AlertTriangle,
  Receipt,
  Sparkles,
  HelpCircle,
  Package,
  Box,
  ShieldAlert,
  Send,
} from "lucide-react";
import AppLayout from "../../../../../components/layout/app-layout";
import { useProject } from "../../../../../context/project-context";
import { INITIAL_CLIENTS, ClientProfile, ClientOwnedUnit, QuoteRecord, ClientDocument } from "../../../../../data/projects-data";
import { exportTableToExcel, exportTableToPDF } from "../../../../../lib/export-utils";
import { generateQuotePDF, openQuoteInNewTab, generateReceiptPDF, openReceiptInNewTab } from "../../../../../lib/pdf-generator";
import { sendAndLogNotification } from "../../../../../lib/notifications";
import { InfoTooltip } from "../../../../../components/ui/tooltip";
import CurrencyInput from "../../../../../components/ui/currency-input";
import { DevioDatePicker } from "../../../../../components/ui/devio-date-picker";
import { UploadPaymentsModal } from "../../../../../components/payments/upload-payments-modal";
import { EditSaleModal } from "../../../../../components/sales/edit-sale-modal";

interface InstallmentItem {
  id: string;
  concept?: string;
  unit: string;
  montoProgramado: number;
  fechaProgramada: string;
  montoPagado: number;
  montoPendiente: number;
  fechaPago: string;
  planPago: string;
  metodoPago: string;
  status: "Atrasado" | "Pendiente" | "Pagado" | "Parcial";
  interesMoratorio: number;
}

interface PaymentReceipt {
  id: string;
  fechaPago: string;
  metodoPago: string;
  monto: number;
  unit: string;
  reciboFolio: string;
  comprobanteUrl?: string;
  voucherName?: string;
  reference?: string;
  scheduledAmount?: number;
  scheduledDate?: string;
  notes?: string;
  moratoryAmount?: number;
  moratoryAction?: string;
  waiveReason?: string;
}

export default function ClientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const unitParam = searchParams?.get("unit");
  const projectId = (params?.id as string) || "p-1";
  const clientId = (params?.clientId as string) || "cli-1";

  const {
    getProject,
    formatMoney,
    showToast,
    registerPayment,
    updateSaleScheduleInstallment,
    updateSalePayment,
    deleteSalePayment,
    addClientDocument,
    updateClientDocument,
    deleteClientDocument,
    paymentPlans,
    hasPermission,
    developerName,
    developerLogo,
  } = useProject();
  const project = getProject(projectId);

  const parseDateFlexible = (dateStr: string): Date | null => {
    if (!dateStr || typeof dateStr !== "string") return null;
    const clean = dateStr.trim();
    if (!clean || clean.toLowerCase() === "pendiente" || clean === "-") return null;

    // Handle ISO format YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}/.test(clean)) {
      const datePart = clean.split("T")[0] || clean;
      const parts = datePart.split("-").map(Number);
      if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
        return new Date(parts[0], parts[1] - 1, parts[2]);
      }
    }

    // Handle DD/MM/YYYY or DD-MM-YYYY
    if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(clean)) {
      const parts = clean.split(/[\/\-]/).map(Number);
      if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
        return new Date(parts[2], parts[1] - 1, parts[0]);
      }
    }

    // Handle Spanish text dates like "18 Sep 2026" or "18 Septiembre 2026"
    const monthMap: Record<string, number> = {
      ene: 0, feb: 1, mar: 2, abr: 3, may: 4, jun: 5,
      jul: 6, ago: 7, sep: 8, sept: 8, oct: 9, nov: 10, dic: 11,
      jan: 0, apr: 3, aug: 7, dec: 11,
    };
    const parts = clean.replace(/,/g, "").split(/\s+/);
    if (parts.length >= 3 && parts[0] && parts[1] && parts[2]) {
      const day = parseInt(parts[0], 10);
      const monthKey = parts[1].toLowerCase().slice(0, 3);
      const year = parseInt(parts[2], 10);
      if (!isNaN(day) && !isNaN(year) && monthMap[monthKey] !== undefined) {
        return new Date(year, monthMap[monthKey], day);
      }
    }

    const parsed = new Date(clean);
    return isNaN(parsed.getTime()) ? null : parsed;
  };

  // Derive rich client data from project sales and inventory
  const rawClient = useMemo<ClientProfile>(() => {
    if (!project) {
      return {
        id: clientId,
        name: "Cliente Devio",
        email: "cliente@devio.mx",
        phone: "+52 33 1234 5678",
        rfc: "XAXX010101000",
        totalPaid: 0,
        totalPending: 0,
        unitsCount: 0,
        ownedUnits: [],
      };
    }

    const soldUnitsMap = new Map<string, (typeof project.unitsInventory)[0]>();
    (project.unitsInventory || []).forEach((u) => {
      if (u.status === "VENDIDA" || u.status === "APARTADA") {
        soldUnitsMap.set(u.unit, u);
      }
    });

    // 1. Try finding in project.sales (active only and sold/apartada unit)
    const candidateSales = (project.sales || []).filter((s) => {
      if (s.status === "CANCELADA" || !soldUnitsMap.has(s.unit)) return false;

      const emailSlug = s.clientEmail ? `cli-${s.clientEmail.toLowerCase().replace(/[^a-z0-9]/g, "-")}` : "";
      const nameSlug = s.clientName ? `cli-${s.clientName.toLowerCase().replace(/[^a-z0-9]/g, "-")}` : "";

      const matchesId = Boolean(s.clientId && s.clientId !== "primary-1" && s.clientId === clientId);
      const matchesEmail = Boolean(s.clientEmail && s.clientEmail.toLowerCase() === clientId.toLowerCase());
      const matchesEmailSlug = Boolean(emailSlug && emailSlug === clientId);
      const matchesSaleId = s.id === clientId;
      const matchesName = Boolean(s.clientName && s.clientName.toLowerCase() === clientId.toLowerCase());
      const matchesNameSlug = Boolean(nameSlug && nameSlug === clientId);

      const matchesCoOwner = s.coOwners?.some((co) => {
        const coEmailSlug = co.email ? `cli-${co.email.toLowerCase().replace(/[^a-z0-9]/g, "-")}` : "";
        return (
          (co.id && co.id !== "primary-1" && co.id === clientId) ||
          (co.email && co.email.toLowerCase() === clientId.toLowerCase()) ||
          (coEmailSlug && coEmailSlug === clientId) ||
          co.name.toLowerCase() === clientId.toLowerCase()
        );
      });

      const matchesLegacyPrimary = clientId === "primary-1" && s.clientId === "primary-1";

      return matchesId || matchesEmail || matchesEmailSlug || matchesSaleId || matchesName || matchesNameSlug || matchesCoOwner || matchesLegacyPrimary;
    });

    if (candidateSales.length > 0) {
      const firstSale = candidateSales[0]!;
      const coOwnerMatch = firstSale.coOwners?.find((co) => {
        const coEmailSlug = co.email ? `cli-${co.email.toLowerCase().replace(/[^a-z0-9]/g, "-")}` : "";
        return (
          (co.id && co.id !== "primary-1" && co.id === clientId) ||
          (co.email && co.email.toLowerCase() === clientId.toLowerCase()) ||
          (coEmailSlug && coEmailSlug === clientId) ||
          co.name.toLowerCase() === clientId.toLowerCase()
        );
      });

      const clientName = coOwnerMatch?.name || firstSale.clientName;
      const clientEmail = coOwnerMatch?.email || firstSale.clientEmail;
      const clientPhone = coOwnerMatch?.phone || firstSale.clientPhone;
      const clientRfc = coOwnerMatch?.rfc || firstSale.clientRfc || "-";

      // Filter strictly to ALL sales in the project belonging to THIS client (by matching email or name)
      const matchingSales = (project.sales || []).filter((s) => {
        if (s.status === "CANCELADA" || !soldUnitsMap.has(s.unit)) return false;
        if (clientEmail && clientEmail !== "-" && s.clientEmail) {
          if (s.clientEmail.toLowerCase() === clientEmail.toLowerCase()) return true;
        }
        if (clientName && s.clientName) {
          if (s.clientName.toLowerCase() === clientName.toLowerCase()) return true;
        }
        if (s.coOwners?.some((co) => (clientEmail && clientEmail !== "-" && co.email?.toLowerCase() === clientEmail.toLowerCase()) || (clientName && co.name.toLowerCase() === clientName.toLowerCase()))) {
          return true;
        }
        return false;
      });

      const ownedUnits: ClientOwnedUnit[] = matchingSales.map((s) => {
        const uObj = soldUnitsMap.get(s.unit);
        const coMatch = s.coOwners?.find((co) => co.name.toLowerCase() === clientName.toLowerCase());
        const ownershipPct = coMatch ? coMatch.ownershipPct : (s.coOwners && s.coOwners.length > 0 ? (s.coOwners[0]?.ownershipPct || 100) : 100);
        return {
          unit: s.unit,
          type: uObj?.type || "Departamento",
          price: s.totalPrice,
          ownershipPct,
          isPrimary: coMatch ? coMatch.isPrimary : true,
          coOwners: s.coOwners,
          additionals: (project.additionals || []).filter((a) => a.assignedToUnit === s.unit),
        };
      });

      const totalPaid = matchingSales.reduce((acc, s) => acc + (s.paidAmount || 0), 0);
      const totalPending = matchingSales.reduce((acc, s) => acc + (s.pendingAmount || 0), 0);

      return {
        id: clientId,
        name: clientName,
        email: clientEmail,
        phone: clientPhone,
        rfc: clientRfc,
        totalPaid,
        totalPending,
        unitsCount: ownedUnits.length,
        ownedUnits,
      };
    }

    // 2. Try finding in project.unitsInventory
    const candidateUnits = project.unitsInventory.filter((u) => {
      if (u.status !== "VENDIDA" && u.status !== "APARTADA") return false;
      if (u.coOwners?.some((co) => co.id === clientId || co.email?.toLowerCase() === clientId.toLowerCase() || co.name.toLowerCase() === clientId.toLowerCase())) {
        return true;
      }
      return u.client.toLowerCase() === clientId.toLowerCase() || u.unit.toLowerCase() === clientId.toLowerCase();
    });

    if (candidateUnits.length > 0) {
      const firstUnit = candidateUnits[0]!;
      const coMatch = firstUnit.coOwners?.find((co) => co.id === clientId || co.email?.toLowerCase() === clientId.toLowerCase() || co.name.toLowerCase() === clientId.toLowerCase());
      const clientName = coMatch?.name || (firstUnit.client !== "-" ? firstUnit.client : "Cliente Propietario");
      const clientEmail = coMatch?.email || "-";
      const clientPhone = coMatch?.phone || "-";
      const clientRfc = coMatch?.rfc || "-";

      const matchingUnits = candidateUnits.filter((u) => {
        if (clientEmail && clientEmail !== "-" && (u as any).clientEmail) {
          if ((u as any).clientEmail.toLowerCase() === clientEmail.toLowerCase()) return true;
        }
        if (clientName && u.client && u.client.toLowerCase() === clientName.toLowerCase()) return true;
        if (u.coOwners?.some((co) => (clientEmail && clientEmail !== "-" && co.email?.toLowerCase() === clientEmail.toLowerCase()) || (clientName && co.name.toLowerCase() === clientName.toLowerCase()))) {
          return true;
        }
        return false;
      });

      const ownedUnits: ClientOwnedUnit[] = matchingUnits.map((u) => {
        const coOwner = u.coOwners?.find((co) => co.name.toLowerCase() === clientName.toLowerCase());
        return {
          unit: u.unit,
          type: u.type,
          price: u.price,
          ownershipPct: coOwner ? coOwner.ownershipPct : 100,
          isPrimary: coOwner ? coOwner.isPrimary : true,
          coOwners: u.coOwners,
          additionals: (project.additionals || []).filter((a) => a.assignedToUnit === u.unit),
        };
      });

      const totalPaid = matchingUnits.reduce((acc, u) => acc + (u.salePaidAmount || 0), 0);
      const totalPending = matchingUnits.reduce((acc, u) => acc + (u.salePendingAmount || u.price), 0);

      return {
        id: clientId,
        name: clientName,
        email: clientEmail,
        phone: clientPhone,
        rfc: clientRfc,
        totalPaid,
        totalPending,
        unitsCount: ownedUnits.length,
        ownedUnits,
      };
    }

    // 3. Fallback to INITIAL_CLIENTS or clean empty profile
    const staticClient = INITIAL_CLIENTS.find((c) => c.id === clientId);
    if (staticClient) {
      const validOwnedUnits = staticClient.ownedUnits.filter((u) => soldUnitsMap.has(u.unit));
      return {
        ...staticClient,
        ownedUnits: validOwnedUnits,
        unitsCount: validOwnedUnits.length,
        totalPaid: validOwnedUnits.length > 0 ? staticClient.totalPaid : 0,
        totalPending: validOwnedUnits.length > 0 ? staticClient.totalPending : 0,
      };
    }

    return {
      id: clientId,
      name: "Cliente Inversionista",
      email: "contacto@cliente.com",
      phone: "-",
      rfc: "-",
      totalPaid: 0,
      totalPending: 0,
      unitsCount: 0,
      ownedUnits: [],
    };
  }, [project, clientId]);

  // Selected Unit State
  const [selectedUnit, setSelectedUnit] = useState<string>(() => {
    if (unitParam) return unitParam;
    return rawClient.ownedUnits[0]?.unit || "";
  });

  // Handle switching unit with seamless URL sync
  const handleSelectUnit = (unit: string) => {
    setSelectedUnit(unit);
    if (typeof window !== "undefined") {
      const newParams = new URLSearchParams(window.location.search);
      newParams.set("unit", unit);
      router.replace(`/projects/${projectId}/clients/${clientId}?${newParams.toString()}`, { scroll: false });
    }
  };

  // Sync selectedUnit when unitParam in URL changes or client loads
  useEffect(() => {
    if (unitParam) {
      const match = rawClient.ownedUnits.find((u) => u.unit.toLowerCase() === unitParam.toLowerCase());
      if (match) {
        setSelectedUnit(match.unit);
        return;
      }
      if (project?.unitsInventory?.some((u) => u.unit.toLowerCase() === unitParam.toLowerCase())) {
        setSelectedUnit(unitParam);
        return;
      }
    }
    // If no unitParam or unitParam not found, ensure a valid owned unit is selected
    if (rawClient.ownedUnits.length > 0) {
      const exists = rawClient.ownedUnits.some((u) => u.unit === selectedUnit);
      if (!exists && rawClient.ownedUnits[0]?.unit) {
        setSelectedUnit(rawClient.ownedUnits[0].unit);
      }
    }
  }, [unitParam, rawClient.ownedUnits, project?.unitsInventory]);

  // Current Sale for Selected Unit
  const currentSale = useMemo(() => {
    return (project?.sales || []).find((s) => s.unit === selectedUnit && s.status !== "CANCELADA");
  }, [project, selectedUnit]);

  // Co-ownership view mode: "global" (100% of unit) vs "proportional" (client's share %)
  const [coOwnershipViewMode, setCoOwnershipViewMode] = useState<"global" | "proportional">("global");

  // Active View Tab: "statement" (Estado de Cuenta) vs "payments" (Pagos) vs "quotes" (Cotizaciones)
  const [activeTab, setActiveTab] = useState<"statement" | "payments" | "quotes">("statement");

  // Client Quotes
  const clientQuotes = useMemo<QuoteRecord[]>(() => {
    if (!project || !project.quotes) return [];
    return project.quotes.filter(
      (q) =>
        q.clientName?.toLowerCase() === rawClient.name?.toLowerCase() ||
        (q.clientEmail && rawClient.email && q.clientEmail.toLowerCase() === rawClient.email.toLowerCase()) ||
        (rawClient.ownedUnits && rawClient.ownedUnits.some((ou) => ou.unit === q.unit))
    );
  }, [project, rawClient]);

  // Sorting state for Statement Table
  const [statementSortField, setStatementSortField] = useState<keyof InstallmentItem>("fechaProgramada");
  const [statementSortDirection, setStatementSortDirection] = useState<"asc" | "desc">("asc");

  // Sorting state for Payments Table
  const [paymentSortField, setPaymentSortField] = useState<keyof PaymentReceipt>("fechaPago");
  const [paymentSortDirection, setPaymentSortDirection] = useState<"asc" | "desc">("desc");

  // Modals state
  const [showRegisterPaymentModal, setShowRegisterPaymentModal] = useState(false);
  const [showEditPaymentModal, setShowEditPaymentModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentReceipt | null>(null);
  const [showEditInstallmentModal, setShowEditInstallmentModal] = useState(false);
  const [editingInstallment, setEditingInstallment] = useState<InstallmentItem | null>(null);
  const [showUploadPaymentsModal, setShowUploadPaymentsModal] = useState(false);
  const [showEditSaleModal, setShowEditSaleModal] = useState(false);
  const [showUploadDocModal, setShowUploadDocModal] = useState(false);
  const [selectedDocForView, setSelectedDocForView] = useState<ClientDocument | null>(null);
  const [selectedDocForEdit, setSelectedDocForEdit] = useState<ClientDocument | null>(null);
  const [selectedReceiptForView, setSelectedReceiptForView] = useState<PaymentReceipt | null>(null);
  const [selectedVoucherForView, setSelectedVoucherForView] = useState<PaymentReceipt | null>(null);
  const [showPlanAccordion, setShowPlanAccordion] = useState(false);

  // File Picker Refs & Upload States
  const clientDocFileInputRef = useRef<HTMLInputElement>(null);
  const paymentVoucherInputRef = useRef<HTMLInputElement>(null);
  const [clientDocUploadedFile, setClientDocUploadedFile] = useState<File | null>(null);
  const [clientDocDragActive, setClientDocDragActive] = useState(false);

  // Current Unit Object & Co-ownership Info
  const currentUnitObj: ClientOwnedUnit = useMemo(() => {
    return (
      rawClient.ownedUnits.find((u) => u.unit === selectedUnit) ||
      rawClient.ownedUnits[0] || {
        unit: selectedUnit || "1A",
        type: "Departamento",
        price: currentSale?.totalPrice || 0,
        ownershipPct: 100,
        isPrimary: true,
      }
    );
  }, [rawClient, selectedUnit, currentSale]);

  const isCoOwned = Boolean(
    (currentUnitObj?.coOwners && currentUnitObj.coOwners.length > 1) ||
    (currentUnitObj?.ownershipPct !== undefined && currentUnitObj.ownershipPct < 100)
  );
  const clientShareRatio = (isCoOwned && coOwnershipViewMode === "proportional")
    ? (currentUnitObj?.ownershipPct || 100) / 100
    : 1;

  // Payments History List (Transacciones Reales)
  const paymentsList: PaymentReceipt[] = useMemo(() => {
    if (currentSale?.payments && currentSale.payments.length > 0) {
      return currentSale.payments.map((p: any) => ({
        id: p.id,
        fechaPago: p.paymentDate || p.fechaPago || "",
        metodoPago: p.paymentMethod || p.metodoPago || "Transferencia SPEI",
        monto: Number(p.amount ?? p.monto) || 0,
        unit: selectedUnit,
        reciboFolio: p.receiptFolio || p.reciboFolio || "",
        comprobanteUrl: p.voucherUrl || p.comprobanteUrl,
        scheduledAmount: p.scheduledAmount || p.amount || p.monto,
        scheduledDate: p.scheduledDate || p.paymentDate || p.fechaPago,
        notes: p.notes,
        moratoryAmount: p.moratoryAmount,
        moratoryAction: p.moratoryAction,
        waiveReason: p.waiveReason,
      }));
    }
    const invUnit = project?.unitsInventory?.find((u) => u.unit === selectedUnit);
    const totalPaid = (currentSale?.paidAmount || 0) > 0 ? (currentSale?.paidAmount || 0) : (invUnit?.salePaidAmount || 0);
    if (totalPaid > 0) {
      const saleDate = currentSale?.saleDate || invUnit?.saleDate;
      const formattedDate = saleDate
        ? new Date(saleDate).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })
        : new Date().toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
      return [
        {
          id: `pay-${selectedUnit}-init`,
          fechaPago: formattedDate,
          metodoPago: "Transferencia SPEI",
          monto: totalPaid,
          unit: selectedUnit,
          reciboFolio: `REC-${(currentSale?.id || selectedUnit || "001").replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase()}`,
          notes: "Pago de enganche inicial",
          scheduledAmount: totalPaid,
          scheduledDate: formattedDate,
        },
      ];
    }
    return [];
  }, [currentSale, selectedUnit, project]);

  // Statement Schedule Data (Cuotas Programadas) with Cascading Amortization
  const statementData: InstallmentItem[] = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const salePlanName = currentSale?.paymentPlan || "Plan Tradicional";
    const matchedPlan = (paymentPlans || []).find(
      (p) =>
        p.id.toLowerCase() === salePlanName.toLowerCase() ||
        p.name.toLowerCase() === salePlanName.toLowerCase()
    );
    const defaultMonthlyRatePct = matchedPlan?.moratoryRatePct ?? 3.0;

    const totalPaidAvailable = paymentsList.length > 0
      ? paymentsList.reduce((acc, p) => acc + (Number(p.monto) || 0), 0)
      : (Number(currentSale?.paidAmount) || 0);

    if (currentSale?.schedule && currentSale.schedule.length > 0) {
      let remainingPaid = totalPaidAvailable;

      // Sort obligations chronologically
      const sortedSchedule = [...currentSale.schedule].sort((a: any, b: any) => {
        const dateA = parseDateFlexible(a.scheduledDate || a.fechaProgramada || "")?.getTime() || 0;
        const dateB = parseDateFlexible(b.scheduledDate || b.fechaProgramada || "")?.getTime() || 0;
        return dateA - dateB;
      });

      return sortedSchedule.map((inst: any, idx: number) => {
        const instPlanName = inst.planName || currentSale.paymentPlan || "Plan de Pago";
        const instMatchedPlan = (paymentPlans || []).find(
          (p) =>
            p.id.toLowerCase() === instPlanName.toLowerCase() ||
            p.name.toLowerCase() === instPlanName.toLowerCase()
        );
        const monthlyRatePct = instMatchedPlan?.moratoryRatePct !== undefined
          ? instMatchedPlan.moratoryRatePct
          : defaultMonthlyRatePct;

        const sDate = inst.scheduledDate || inst.fechaProgramada || "";
        const sAmount = Number(inst.scheduledAmount ?? inst.montoProgramado) || 0;

        const instDate = parseDateFlexible(sDate);
        const isPastDue = Boolean(instDate && instDate < now);

        let pAmount = 0;
        let pendAmount = sAmount;
        let status: "Atrasado" | "Pendiente" | "Pagado" = "Pendiente";
        let pDate = "Pendiente";

        if (remainingPaid >= sAmount && sAmount > 0) {
          pAmount = sAmount;
          pendAmount = 0;
          remainingPaid -= sAmount;
          status = "Pagado";
          pDate = sDate;
        } else if (remainingPaid > 0) {
          pAmount = remainingPaid;
          pendAmount = Math.max(0, sAmount - remainingPaid);
          remainingPaid = 0;
          status = isPastDue ? "Atrasado" : "Pendiente";
          pDate = "Parcial";
        } else {
          pAmount = 0;
          pendAmount = sAmount;
          status = isPastDue ? "Atrasado" : "Pendiente";
          pDate = "Pendiente";
        }

        let calculatedMoratorio = 0;
        if (status === "Atrasado" && instDate) {
          const diffMs = now.getTime() - instDate.getTime();
          const daysOverdue = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
          calculatedMoratorio = Math.round(pendAmount * (monthlyRatePct / 100) * (daysOverdue / 30));
        }

        return {
          id: inst.id || `inst-${idx}`,
          unit: selectedUnit,
          montoProgramado: sAmount,
          fechaProgramada: sDate,
          montoPagado: pAmount,
          montoPendiente: pendAmount,
          fechaPago: pDate,
          planPago: instPlanName,
          metodoPago: pAmount > 0 ? (inst.paymentMethod || inst.metodoPago || "Transferencia SPEI") : "Pendiente",
          status,
          interesMoratorio: calculatedMoratorio,
        };
      });
    }

    // Fallback if no explicit sale record exists yet
    const unitPrice = currentUnitObj.price || 5000000;
    const invUnit = project?.unitsInventory?.find((u) => u.unit === selectedUnit);
    const unitPaid = totalPaidAvailable > 0 ? totalPaidAvailable : (invUnit?.salePaidAmount !== undefined ? invUnit.salePaidAmount : 0);
    const engancheAmount = Math.round(unitPrice * 0.2);
    const m1Amount = Math.round(unitPrice * 0.1);
    const m2Amount = Math.round(unitPrice * 0.1);
    const liqAmount = Math.max(0, unitPrice - engancheAmount - m1Amount - m2Amount);

    let remainingFallback = unitPaid;
    const fallbackRaw = [
      { id: `inst-${selectedUnit}-1`, concept: "Enganche", amount: engancheAmount, date: "17 Ago 2026" },
      { id: `inst-${selectedUnit}-2`, concept: "Mensualidad 1", amount: m1Amount, date: "17 Sep 2026" },
      { id: `inst-${selectedUnit}-3`, concept: "Mensualidad 2", amount: m2Amount, date: "17 Oct 2026" },
      { id: `inst-${selectedUnit}-4`, concept: "Liquidación", amount: liqAmount, date: "17 Nov 2026" },
    ];

    return fallbackRaw.map((item) => {
      const instDate = parseDateFlexible(item.date);
      const isPastDue = Boolean(instDate && instDate < now);
      let pAmount = 0;
      let pendAmount = item.amount;
      let status: "Atrasado" | "Pendiente" | "Pagado" = "Pendiente";
      let pDate = "Pendiente";

      if (remainingFallback >= item.amount && item.amount > 0) {
        pAmount = item.amount;
        pendAmount = 0;
        remainingFallback -= item.amount;
        status = "Pagado";
        pDate = item.date;
      } else if (remainingFallback > 0) {
        pAmount = remainingFallback;
        pendAmount = Math.max(0, item.amount - remainingFallback);
        remainingFallback = 0;
        status = isPastDue ? "Atrasado" : "Pendiente";
        pDate = "Parcial";
      } else {
        pAmount = 0;
        pendAmount = item.amount;
        status = isPastDue ? "Atrasado" : "Pendiente";
        pDate = "Pendiente";
      }

      let calculatedMoratorio = 0;
      if (status === "Atrasado" && instDate) {
        const diffMs = now.getTime() - instDate.getTime();
        const daysOverdue = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
        calculatedMoratorio = Math.round(pendAmount * (defaultMonthlyRatePct / 100) * (daysOverdue / 30));
      }

      return {
        id: item.id,
        unit: selectedUnit,
        montoProgramado: item.amount,
        fechaProgramada: item.date,
        montoPagado: pAmount,
        montoPendiente: pendAmount,
        fechaPago: pDate,
        planPago: invUnit?.salePlanName || "Plan Tradicional",
        metodoPago: pAmount > 0 ? "SPEI" : "Pendiente",
        status,
        interesMoratorio: calculatedMoratorio,
      };
    });
  }, [currentSale, selectedUnit, currentUnitObj, project, paymentPlans, paymentsList]);

  // Documents List derived directly from project context (Strictly real documents, NO synthetic dummy data)
  const clientDocuments: ClientDocument[] = useMemo(() => {
    if (!project) return [];
    const all = project.clientDocuments || [];
    const filtered = all.filter(
      (d) =>
        d.clientId === clientId ||
        (rawClient.name && d.clientName?.toLowerCase() === rawClient.name.toLowerCase()) ||
        (rawClient.ownedUnits && rawClient.ownedUnits.some((ou) => ou.unit === d.unit))
    );
    return filtered;
  }, [project, clientId, rawClient]);

  // Base Overdue and Moratory Interest Calculation
  const baseSaldoAtrasado = statementData
    .filter((s) => s.unit === selectedUnit && s.status === "Atrasado")
    .reduce((acc, s) => acc + s.montoPendiente, 0);

  const baseCalculatedMoratorio = statementData
    .filter((s) => s.unit === selectedUnit && s.status === "Atrasado")
    .reduce((acc, s) => acc + (s.interesMoratorio || 0), 0);

  // Next Pending Installment
  const nextPaymentItem = useMemo(() => {
    return statementData.find((s) => s.montoPendiente > 0) || statementData[0];
  }, [statementData]);

  // Register Payment Form State (Cleaned, no dummy fixed amounts)
  const [paymentForm, setPaymentForm] = useState({
    amountReceived: 0,
    paymentMethod: "Transferencia SPEI",
    paymentDate: new Date().toLocaleDateString("es-MX"),
    sendEmail: true,
    voucherName: "",
    reference: "",
    notes: "",
    moratoryAction: "full" as "full" | "waive" | "partial",
    waivePct: 50,
    waiveReason: "",
  });

  // Effective Moratory
  const effectiveMoratoryToCharge = useMemo(() => {
    if (paymentForm.moratoryAction === "waive") return 0;
    if (paymentForm.moratoryAction === "partial") {
      return Math.round(baseCalculatedMoratorio * (1 - paymentForm.waivePct / 100));
    }
    return baseCalculatedMoratorio;
  }, [paymentForm.moratoryAction, paymentForm.waivePct, baseCalculatedMoratorio]);

  // Automatically sync amountReceived with next cuota when opening modal if 0
  useEffect(() => {
    if (showRegisterPaymentModal && paymentForm.amountReceived === 0 && nextPaymentItem?.montoPendiente) {
      setPaymentForm((prev) => ({
        ...prev,
        amountReceived: nextPaymentItem.montoPendiente,
      }));
    }
  }, [showRegisterPaymentModal, nextPaymentItem]);

  // LIVE CASCADE SIMULATION: Previews how the entered amount will be allocated
  const cascadePreview = useMemo(() => {
    const capitalAmount = Number(paymentForm.amountReceived) || 0;
    const moratoryCharged = Number(effectiveMoratoryToCharge) || 0;
    if (capitalAmount <= 0 && moratoryCharged <= 0) return [];

    const previewList: Array<{
      id: string;
      concept: string;
      date: string;
      scheduledAmount: number;
      currentPending: number;
      amountToApply: number;
      resultingPending: number;
      willFullyPay: boolean;
      type: "capital" | "moratory";
    }> = [];

    // Si se están cobrando intereses moratorios, desglosarlo claramente al inicio
    if (moratoryCharged > 0) {
      previewList.push({
        id: "preview-moratory",
        concept: "Interés Moratorio (Retraso en cuotas)",
        date: "Cobro por días vencidos",
        scheduledAmount: baseCalculatedMoratorio,
        currentPending: baseCalculatedMoratorio,
        amountToApply: moratoryCharged,
        resultingPending: Math.max(0, baseCalculatedMoratorio - moratoryCharged),
        willFullyPay: moratoryCharged >= baseCalculatedMoratorio,
        type: "moratory",
      });
    }

    let remaining = capitalAmount;
    statementData.forEach((st) => {
      if (st.montoPendiente <= 0 || remaining <= 0) return;
      const alloc = Math.min(remaining, st.montoPendiente);
      const remPend = Math.max(0, st.montoPendiente - alloc);
      previewList.push({
        id: st.id,
        concept: st.planPago ? `${st.planPago}` : `Cuota ${st.fechaProgramada}`,
        date: st.fechaProgramada,
        scheduledAmount: st.montoProgramado,
        currentPending: st.montoPendiente,
        amountToApply: alloc,
        resultingPending: remPend,
        willFullyPay: remPend === 0,
        type: "capital",
      });
      remaining -= alloc;
    });

    return previewList;
  }, [paymentForm.amountReceived, effectiveMoratoryToCharge, baseCalculatedMoratorio, statementData]);

  // Edit Payment Form State
  const [editPaymentForm, setEditPaymentForm] = useState({
    id: "",
    monto: 0,
    fechaPago: "",
    metodoPago: "Transferencia",
    reciboFolio: "",
    scheduledAmount: 0,
    scheduledDate: "",
    notes: "",
    editReason: "",
  });

  // Edit Installment Form State
  const [editInstallmentForm, setEditInstallmentForm] = useState({
    id: "",
    concept: "Mensualidad",
    scheduledAmount: 0,
    scheduledDate: "",
  });

  // Upload Document Form State (Cleaned, no dummy initial values)
  const [docForm, setDocForm] = useState({
    docName: "",
    unit: "",
    internalNotes: "",
    visibleToClient: true,
  });

  // Modal para ver abonos aplicados a una cuota específica
  const [selectedCuotaForAbonos, setSelectedCuotaForAbonos] = useState<InstallmentItem | null>(null);

  // Payments / Abonos filtered specifically for the selected cuota
  const cuotaSpecificPayments = useMemo<PaymentReceipt[]>(() => {
    if (!selectedCuotaForAbonos || selectedCuotaForAbonos.montoPagado <= 0) return [];

    // 1. Direct match by scheduledDate, ID in notes, or exact paymentDate
    const direct = paymentsList.filter((p) => {
      if (p.scheduledDate && (p.scheduledDate === selectedCuotaForAbonos.fechaProgramada || p.scheduledDate === selectedCuotaForAbonos.id)) return true;
      if (p.notes && (p.notes.includes(selectedCuotaForAbonos.id) || p.notes.includes(selectedCuotaForAbonos.fechaProgramada))) return true;
      if (selectedCuotaForAbonos.fechaPago && selectedCuotaForAbonos.fechaPago !== "Pendiente" && p.fechaPago === selectedCuotaForAbonos.fechaPago) return true;
      return false;
    });

    if (direct.length > 0) return direct;

    const engancheMatch = paymentsList.filter((p) =>
      (p.notes || "").toLowerCase().includes("enganche") || (p.reciboFolio || "").toLowerCase().includes("rec")
    );
    if (engancheMatch.length > 0) return [engancheMatch[0]!];

    // 3. Fallback: create synthesized abono receipt for this exact cuota
    return [
      {
        id: `abono-${selectedCuotaForAbonos.id}`,
        reciboFolio: `REC-${selectedCuotaForAbonos.unit}-${selectedCuotaForAbonos.id.slice(-4)}`,
        fechaPago: selectedCuotaForAbonos.fechaPago && selectedCuotaForAbonos.fechaPago !== "Pendiente" ? selectedCuotaForAbonos.fechaPago : new Date().toLocaleDateString("es-MX"),
        monto: selectedCuotaForAbonos.montoPagado,
        metodoPago: selectedCuotaForAbonos.metodoPago !== "Pendiente" ? selectedCuotaForAbonos.metodoPago : "SPEI",
        unit: selectedCuotaForAbonos.unit,
        notes: `Abono aplicado a cuota programada (${selectedCuotaForAbonos.fechaProgramada})`,
      }
    ];
  }, [selectedCuotaForAbonos, paymentsList, statementData]);

  // Financial Summary
  const fullUnitAPagar = currentSale?.totalPrice || (currentSale as any)?.totalAmount || (statementData.reduce((acc, s) => acc + s.montoProgramado, 0) > 0 ? statementData.reduce((acc, s) => acc + s.montoProgramado, 0) : currentUnitObj?.price || 0);
  const fullUnitPagado = paymentsList.length > 0
    ? paymentsList.reduce((acc, p) => acc + (Number(p.monto) || 0), 0)
    : statementData.reduce((acc, s) => acc + s.montoPagado, 0);
  const fullUnitMoratorioPagado = paymentsList.reduce((acc, p) => acc + (p.moratoryAmount || 0), 0);
  const totalAPagar = fullUnitAPagar * clientShareRatio;
  const totalPagado = fullUnitPagado * clientShareRatio;
  const totalMoratorioPagado = fullUnitMoratorioPagado * clientShareRatio;
  const totalCobradoTotal = (fullUnitPagado + fullUnitMoratorioPagado) * clientShareRatio;
  const totalPendiente = Math.max(0, totalAPagar - totalPagado);
  const saldoAtrasado = baseSaldoAtrasado * clientShareRatio;
  const interesMoratorio = baseCalculatedMoratorio * clientShareRatio;

  // Sorting handlers for Statement Table
  const handleSortStatement = (field: keyof InstallmentItem) => {
    if (statementSortField === field) {
      setStatementSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setStatementSortField(field);
      setStatementSortDirection("asc");
    }
  };

  const sortedStatementData = useMemo(() => {
    const list = [...statementData];
    list.sort((a, b) => {
      let aVal = a[statementSortField];
      let bVal = b[statementSortField];

      if (typeof aVal === "string") {
        return statementSortDirection === "asc"
          ? (aVal as string).localeCompare(bVal as string)
          : (bVal as string).localeCompare(aVal as string);
      }
      if (typeof aVal === "number") {
        return statementSortDirection === "asc"
          ? (aVal as number) - (bVal as number)
          : (bVal as number) - (aVal as number);
      }
      return 0;
    });
    return list;
  }, [statementData, statementSortField, statementSortDirection]);

  // Sorting handlers for Payments Table
  const handleSortPayments = (field: keyof PaymentReceipt) => {
    if (paymentSortField === field) {
      setPaymentSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setPaymentSortField(field);
      setPaymentSortDirection("asc");
    }
  };

  const sortedPaymentsList = useMemo(() => {
    const list = [...paymentsList];
    list.sort((a, b) => {
      let aVal = a[paymentSortField];
      let bVal = b[paymentSortField];

      if (typeof aVal === "string") {
        return paymentSortDirection === "asc"
          ? (aVal as string).localeCompare(bVal as string)
          : (bVal as string).localeCompare(aVal as string);
      }
      if (typeof aVal === "number") {
        return paymentSortDirection === "asc"
          ? (aVal as number) - (bVal as number)
          : (bVal as number) - (aVal as number);
      }
      return 0;
    });
    return list;
  }, [paymentsList, paymentSortField, paymentSortDirection]);

  // Enviar recordatorio preventivo de cuota individual
  const handleSendInstallmentReminder = async (item: InstallmentItem) => {
    const targetEmail = rawClient.email || "acalderoncha@gmail.com";
    showToast("Enviando Recordatorio...", `Despachando recordatorio de pago a ${rawClient.name}...`, "info");
    const res = await sendAndLogNotification({
      to: targetEmail,
      templateAlias: "recordatorio-pago",
      templateModel: {
        nombre: rawClient.name,
        correo: targetEmail,
        proyecto: project?.name || "Proyecto Inmobiliario",
        unidad: item.unit,
        dias: 5,
        fecha_vencimiento: item.fechaProgramada,
        monto: formatMoney(item.montoPendiente),
        concepto: item.concept || `Cuota ${item.unit}`,
        login_link: typeof window !== "undefined" ? `${window.location.origin}/login` : "https://devio.lat/login",
        logo_proyecto: project?.image?.startsWith("http") ? project.image : "https://6d94a8ea50a1bc576a3e8162c197d74f.cdn.bubble.io/f1777398492782x453733136803679400/lirica.jpeg",
        logo_desarrolladora: "https://6d94a8ea50a1bc576a3e8162c197d74f.cdn.bubble.io/f1777398110026x731242031517065300/grupo_veq_logo.jpeg",
        desarrolladora: project?.name ? `${project.name} (Desarrolladora)` : "Desarrolladora Inmobiliaria",
        año: new Date().getFullYear().toString(),
      },
      triggerKey: "payments.upcoming_reminder",
      triggerName: "Recordatorio Preventivo de Pago",
      recipientName: rawClient.name,
      developerName: project?.name || "Desarrolladora Inmobiliaria",
      channel: "POSTMARK",
    });

    if (res.success) {
      showToast("Recordatorio Enviado", `Se envió el recordatorio a ${targetEmail}.`, "success");
    } else {
      showToast("Error al Enviar", res.error || "No se pudo enviar el recordatorio.", "warning");
    }
  };

  // Enviar aviso de mora de cuota individual
  const handleSendInstallmentOverdueNotice = async (item: InstallmentItem) => {
    const targetEmail = rawClient.email || "acalderoncha@gmail.com";
    showToast("Enviando Aviso de Mora...", `Despachando aviso urgente a ${rawClient.name}...`, "info");
    const res = await sendAndLogNotification({
      to: targetEmail,
      templateAlias: "moroso",
      templateModel: {
        nombre: rawClient.name,
        correo: targetEmail,
        proyecto: project?.name || "Proyecto Inmobiliario",
        unidad: item.unit,
        dias_vencido: 10,
        fecha_vencimiento: item.fechaProgramada,
        monto: formatMoney(item.montoPendiente),
        concepto: item.concept || `Cuota Vencida ${item.unit}`,
        interes_moratorio: item.interesMoratorio > 0 ? formatMoney(item.interesMoratorio) : "3%",
        login_link: typeof window !== "undefined" ? `${window.location.origin}/login` : "https://devio.lat/login",
        logo_proyecto: project?.image?.startsWith("http") ? project.image : "https://6d94a8ea50a1bc576a3e8162c197d74f.cdn.bubble.io/f1777398492782x453733136803679400/lirica.jpeg",
        logo_desarrolladora: "https://6d94a8ea50a1bc576a3e8162c197d74f.cdn.bubble.io/f1777398110026x731242031517065300/grupo_veq_logo.jpeg",
        desarrolladora: project?.name ? `${project.name} (Desarrolladora)` : "Desarrolladora Inmobiliaria",
        año: new Date().getFullYear().toString(),
      },
      triggerKey: "payments.overdue_notice",
      triggerName: "Aviso de Saldo Vencido / Moroso",
      recipientName: rawClient.name,
      developerName: project?.name || "Desarrolladora Inmobiliaria",
      channel: "POSTMARK",
    });

    if (res.success) {
      showToast("Aviso de Mora Enviado", `Se envió el aviso de morosidad a ${targetEmail}.`, "success");
    } else {
      showToast("Error al Enviar", res.error || "No se pudo enviar el aviso de mora.", "warning");
    }
  };

  // Excel Export Handler
  const handleExportStatementExcel = () => {
    const dataToExport = sortedStatementData.map((item) => ({
      "Monto Programado": item.montoProgramado,
      "Fecha Programada": item.fechaProgramada,
      "Monto Pagado": item.montoPagado,
      "Monto Pendiente": item.montoPendiente,
      "Fecha de Pago": item.fechaPago,
      "Unidad": item.unit,
      "Plan de Pago": item.planPago,
      "Método de Pago": item.metodoPago,
      "Status": item.status,
      "Interés Moratorio": item.interesMoratorio,
    }));

    exportTableToExcel(
      dataToExport,
      `Estado_de_Cuenta_${rawClient.name.replace(/\s+/g, "_")}_${selectedUnit}`,
      "EstadoDeCuenta"
    );
    showToast("Excel Exportado", `Se descargó el estado de cuenta de la unidad ${selectedUnit}.`);
  };

  // PDF Export Handler
  const handleExportStatementPDF = () => {
    const headers = [
      "Monto Programado",
      "Fecha Programada",
      "Monto Pagado",
      "Monto Pendiente",
      "Fecha Pago",
      "Unidad",
      "Plan de Pago",
      "Status",
    ];
    const rows = sortedStatementData.map((item) => [
      formatMoney(item.montoProgramado),
      item.fechaProgramada,
      formatMoney(item.montoPagado),
      formatMoney(item.montoPendiente),
      item.fechaPago,
      item.unit,
      item.planPago,
      item.status,
    ]);

    const summary = `Cliente: ${rawClient.name} | Unidad: ${selectedUnit} (${isCoOwned ? `Copropiedad ${currentUnitObj.ownershipPct}%` : "100%"}) | Total: ${formatMoney(totalAPagar)} | Pagado: ${formatMoney(totalPagado)} | Pendiente: ${formatMoney(totalPendiente)} | Atrasado: ${formatMoney(saldoAtrasado)}`;

    exportTableToPDF("Estado de Cuenta Individual", `${project?.name || "Proyecto"} - ${rawClient.name}`, headers, rows, summary);
    showToast("PDF Generado", "Se abrió el estado de cuenta listo para imprimir o guardar.");
  };

  // Handle Register Payment with Persisted Cascade
  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();

    const principal = Number(paymentForm.amountReceived) || 0;
    const moratory = Number(effectiveMoratoryToCharge) || 0;
    const totalAmount = principal + moratory;

    if (totalAmount <= 0) {
      showToast("Monto Inválido", "Ingresa una cantidad mayor a cero.", "warning");
      return;
    }

    registerPayment(projectId, {
      unitNumber: selectedUnit,
      amount: totalAmount,
      paymentDate: paymentForm.paymentDate,
      paymentMethod: paymentForm.paymentMethod,
      reference: paymentForm.reference,
      notes: paymentForm.notes,
      voucherName: paymentForm.voucherName,
      sendReceiptEmail: paymentForm.sendEmail,
      moratoryAction: paymentForm.moratoryAction,
      moratoryAmount: moratory,
      waiveReason: paymentForm.waiveReason,
    });

    showToast("Pago Registrado", `Se registró exitosamente el abono de ${formatMoney(totalAmount)} para la unidad ${selectedUnit}.`);
    setShowRegisterPaymentModal(false);
  };

  // Open Edit Installment Modal (Cuota Programada)
  const handleOpenEditInstallment = (inst: InstallmentItem) => {
    setEditingInstallment(inst);
    setEditInstallmentForm({
      id: inst.id,
      concept: inst.concept || "Mensualidad",
      scheduledAmount: inst.montoProgramado,
      scheduledDate: inst.fechaProgramada,
    });
    setShowEditInstallmentModal(true);
  };

  // Save Modified Installment (Recomputes cascade on schedule)
  const handleSaveEditInstallment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInstallment) return;

    updateSaleScheduleInstallment(projectId, selectedUnit, editingInstallment.id, {
      concept: editInstallmentForm.concept,
      scheduledAmount: Number(editInstallmentForm.scheduledAmount),
      scheduledDate: editInstallmentForm.scheduledDate,
    });

    setShowEditInstallmentModal(false);
    setEditingInstallment(null);
  };

  // Open Edit Payment Modal (Abono Real)
  const handleOpenEditPayment = (payment: PaymentReceipt) => {
    setEditingPayment(payment);
    setEditPaymentForm({
      id: payment.id,
      monto: payment.monto,
      fechaPago: payment.fechaPago,
      metodoPago: payment.metodoPago,
      reciboFolio: payment.reciboFolio,
      scheduledAmount: payment.scheduledAmount || payment.monto,
      scheduledDate: payment.scheduledDate || "17 Ago 2026",
      notes: payment.notes || "",
      editReason: "Corrección de fecha y conciliación bancaria",
    });
    setShowEditPaymentModal(true);
  };

  // Save Modified Payment (Recomputes balance and schedule)
  const handleSaveEditPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayment) return;

    updateSalePayment(projectId, selectedUnit, editingPayment.id, {
      amount: Number(editPaymentForm.monto),
      paymentDate: editPaymentForm.fechaPago,
      paymentMethod: editPaymentForm.metodoPago,
      notes: editPaymentForm.notes,
    });

    setShowEditPaymentModal(false);
    setEditingPayment(null);
  };

  // Delete Payment Record
  const handleDeletePayment = (id: string) => {
    if (confirm("⚠️ Advertencia: ¿Estás seguro de que deseas revertir este pago? Se actualizará el saldo pendiente y se recalcularán las cuotas.")) {
      deleteSalePayment(projectId, selectedUnit, id);
    }
  };

  // Handle Save Document
  const handleSaveDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docForm.docName.trim()) {
      showToast("Título Requerido", "Por favor ingresa un nombre para el documento.", "warning");
      return;
    }

    const calculatedSize = clientDocUploadedFile
      ? clientDocUploadedFile.size > 1024 * 1024
        ? `${(clientDocUploadedFile.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(clientDocUploadedFile.size / 1024)} KB`
      : "1.2 MB";

    const rawExt = clientDocUploadedFile?.name.split(".").pop()?.toUpperCase() || "PDF";

    const finalize = (dataUrl?: string) => {
      const newDoc: ClientDocument = {
        id: `doc-cli-${Date.now()}`,
        clientId: clientId,
        clientName: rawClient.name,
        title: docForm.docName.trim(),
        unit: docForm.unit ? docForm.unit.split("/").pop()?.trim() || selectedUnit : selectedUnit,
        fileType: rawExt,
        fileSize: calculatedSize,
        uploadDate: new Date().toLocaleDateString("es-MX"),
        updatedAt: new Date().toLocaleDateString("es-MX"),
        url: dataUrl,
        notes: docForm.internalNotes.trim() || undefined,
        isVisibleToClient: docForm.visibleToClient,
      };

      addClientDocument(projectId, newDoc);
      setShowUploadDocModal(false);
      setDocForm({ docName: "", unit: "", internalNotes: "", visibleToClient: true });
      setClientDocUploadedFile(null);
    };

    if (clientDocUploadedFile) {
      const reader = new FileReader();
      reader.onload = (loadEv) => {
        const dataUrl = (loadEv.target?.result as string) || "";
        finalize(dataUrl);
      };
      reader.readAsDataURL(clientDocUploadedFile);
    } else {
      finalize();
    }
  };

  if (!project) return null;

  if (!hasPermission("clients.view")) {
    return (
      <AppLayout activeProjectId={projectId} projectSubTab="clients">
        <main style={{ padding: "3rem 2rem", flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ backgroundColor: "#FFFFFF", borderRadius: "1.25rem", padding: "3rem", textAlign: "center", maxWidth: "480px", border: "1px solid #E2E8F0", boxShadow: "0 4px 12px rgba(0,0,0,0.04)" }}>
            <div style={{ width: "56px", height: "56px", borderRadius: "50%", backgroundColor: "#FEF2F2", color: "#EF4444", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem auto" }}>
              <ShieldAlert size={28} />
            </div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#1F3652", marginBottom: "0.5rem" }}>Acceso Restringido</h2>
            <p style={{ fontSize: "0.88rem", color: "#64748B", lineHeight: 1.5, margin: 0 }}>
              Tu perfil de usuario no cuenta con permisos para ver expedientes ni estados de cuenta de clientes. Contacta a un administrador.
            </p>
          </div>
        </main>
      </AppLayout>
    );
  }

  return (
    <AppLayout activeProjectId={projectId} projectSubTab="clients">
      <main style={{ padding: "1.25rem 2rem 2.5rem 2rem", flex: 1, overflowY: "auto" }}>
        
        {/* BOTÓN VOLVER AL DIRECTORIO DE CLIENTES */}
        <div style={{ marginBottom: "0.85rem" }}>
          <Link
            href={`/projects/${projectId}/clients`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              color: "#64748B",
              fontSize: "0.82rem",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            <ChevronLeft size={16} /> Volver a Clientes
          </Link>
        </div>

        {/* HEADER TITULO: NOMBRE DEL CLIENTE + BADGE COPROPIEDAD */}
        <div style={{ marginBottom: "1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div
              style={{
                backgroundColor: "#FFFFFF",
                padding: "0.4rem 1.25rem",
                borderRadius: "9999px",
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                border: "1px solid #E2E8F0",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <h1 style={{ fontSize: "1.45rem", fontWeight: 800, color: "#1F3652", margin: 0 }}>
                {rawClient.name}
              </h1>
              <InfoTooltip
                title="Ficha del Cliente"
                content="Expediente consolidado de cuenta, amortización, recibos oficiales y bóveda documental para este cliente."
              />
            </div>

            {isCoOwned && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  backgroundColor: "#EFF6FF",
                  color: "#2F80ED",
                  padding: "0.35rem 0.85rem",
                  borderRadius: "9999px",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  border: "1px solid #BFDBFE",
                }}
              >
                <Users size={14} /> Copropiedad ({currentUnitObj.ownershipPct}% Titular)
              </span>
            )}
          </div>

          {/* TOGGLE VISTA GLOBAL VS PROPORCIONAL SI ES COPROPIEDAD */}
          {isCoOwned && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                backgroundColor: "#F1F5F9",
                padding: "0.25rem",
                borderRadius: "9999px",
                border: "1px solid #E2E8F0",
                gap: "0.25rem",
              }}
            >
              <button
                type="button"
                onClick={() => setCoOwnershipViewMode("global")}
                style={{
                  padding: "0.35rem 0.85rem",
                  borderRadius: "9999px",
                  border: "none",
                  backgroundColor: coOwnershipViewMode === "global" ? "#1B3047" : "transparent",
                  color: coOwnershipViewMode === "global" ? "#FFFFFF" : "#64748B",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                Unidad Completa (100%)
              </button>
              <button
                type="button"
                onClick={() => setCoOwnershipViewMode("proportional")}
                style={{
                  padding: "0.35rem 0.85rem",
                  borderRadius: "9999px",
                  border: "none",
                  backgroundColor: coOwnershipViewMode === "proportional" ? "#2F80ED" : "transparent",
                  color: coOwnershipViewMode === "proportional" ? "#FFFFFF" : "#64748B",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                Proporcional ({currentUnitObj.ownershipPct}%)
              </button>
              <InfoTooltip
                title="Modo de Visualización de Copropiedad"
                content="Permite alternar entre el estado de cuenta total del inmueble (100%) o el desglose proporcional a la participación legal de este comprador."
              />
            </div>
          )}
        </div>

        {/* ROW 1: TARJETA DE PERFIL + TARJETA COPROPIETARIOS + TARJETAS DE UNIDADES */}
        <div style={{ display: "grid", gridTemplateColumns: isCoOwned ? "1.1fr 1.3fr 1fr" : "1.2fr 1fr", gap: "1.25rem", marginBottom: "1.25rem" }}>
          
          {/* Card Perfil del Cliente */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.4rem" }}>
              <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#1F3652" }}>
                Unidad activa: {selectedUnit}
              </span>
              <InfoTooltip
                title="Unidad en Consulta"
                content="Indica la propiedad actualmente seleccionada para la cual se calculan los saldos y amortizaciones."
              />
            </div>
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "1.1rem",
                padding: "1rem 1.25rem",
                boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                border: "1px solid rgba(22, 43, 63, 0.05)",
                display: "flex",
                alignItems: "center",
                gap: "1.25rem",
                minHeight: "95px",
              }}
            >
              <div
                style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "50%",
                  border: "2px solid #CBD5E1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#64748B",
                  backgroundColor: "#F8FAFC",
                  flexShrink: 0,
                }}
              >
                <User size={24} />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", fontSize: "0.8rem", color: "#1F3652", flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  <Mail size={14} color="#64748B" />
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}><strong>Correo:</strong> {rawClient.email}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <Phone size={14} color="#64748B" />
                  <span><strong>Teléfono:</strong> {rawClient.phone}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <InfoTooltip
                    title="RFC del Comprador"
                    content="Registro Federal de Contribuyentes para timbrado oficial de recibos de pago y facturación."
                  />
                  <span><strong>RFC:</strong> {rawClient.rfc}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card Detalle de Copropietarios (Si aplica a la unidad) */}
          {isCoOwned && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.4rem" }}>
                <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#1F3652" }}>
                  Estructura de Copropiedad
                </span>
                <InfoTooltip
                  title="Régimen de Copropiedad"
                  content="Esta unidad se encuentra adquirida bajo co-titularidad compartida. Aquí se desglosan los compradores legales y sus porcentajes."
                />
              </div>
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "1.1rem",
                  padding: "0.85rem 1.15rem",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                  border: "1px solid rgba(22, 43, 63, 0.05)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  gap: "0.4rem",
                  minHeight: "95px",
                  fontSize: "0.78rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ color: "#1F3652", fontWeight: 600 }}>
                    • {rawClient.name} <strong>({currentUnitObj.ownershipPct}%)</strong> - Titular
                  </span>
                  <span style={{ color: "#00C48C", fontWeight: 700 }}>Activo</span>
                </div>

                {currentUnitObj.coOwners?.filter((co) => !co.isPrimary && co.name.toLowerCase() !== rawClient.name.toLowerCase()).map((co) => (
                  <div key={co.id || co.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: "#64748B", borderTop: "1px dashed #E2E8F0", paddingTop: "0.3rem" }}>
                    <span>
                      • {co.name} <strong>({co.ownershipPct}%)</strong> - Co-titular
                    </span>
                    <span style={{ fontSize: "0.72rem", color: "#2F80ED", fontWeight: 600 }}>{co.phone}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Selector de Unidades del Cliente */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", marginBottom: "0.4rem" }}>
              <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#1F3652" }}>Unidades</span>
              <InfoTooltip
                title="Unidades Adquiridas"
                content="Listado de unidades adquiridas por este cliente en este desarrollo. Haz clic en una para ver su estado de cuenta específico."
              />
            </div>

            <div style={{ display: "flex", gap: "0.85rem", overflowX: "auto" }}>
              {rawClient.ownedUnits.map((u) => {
                const isSelected = u.unit === selectedUnit;
                const uSale = (project?.sales || []).find((s) => s.unit === u.unit && s.status !== "CANCELADA");
                const uPaid = uSale?.paidAmount ?? (project?.unitsInventory.find((item) => item.unit === u.unit)?.salePaidAmount ?? 0);
                const uTotal = uSale?.totalPrice ?? u.price ?? 1;
                const paidPct = uTotal > 0 ? Math.min(100, Math.round((uPaid / uTotal) * 100)) : 0;
                const paidMonto = uPaid;

                return (
                  <div
                    key={u.unit}
                    onClick={() => handleSelectUnit(u.unit)}
                    style={{
                      flex: 1,
                      minWidth: "190px",
                      backgroundColor: isSelected ? "rgba(0, 196, 140, 0.04)" : "#FFFFFF",
                      borderRadius: "1.1rem",
                      padding: "0.85rem 1rem",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                      border: isSelected ? "2px solid #00C48C" : "1px solid #E2E8F0",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      minHeight: "95px",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {/* Logo Castellana / Desarrollo */}
                    <div style={{ width: "42px", height: "42px", borderRadius: "0.5rem", backgroundColor: "#F8FAFC", border: "1px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, textAlign: "center" }}>
                      <Building2 size={20} color="#C7B28B" />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                          <strong style={{ fontSize: "0.95rem", color: "#1F3652" }}>{u.unit}</strong>
                          {u.ownershipPct < 100 && (
                            <span style={{ fontSize: "0.68rem", backgroundColor: "#EFF6FF", color: "#2F80ED", padding: "0.1rem 0.35rem", borderRadius: "4px", fontWeight: 700 }}>
                              {u.ownershipPct}%
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#00C48C" }}>{paidPct}%</span>
                      </div>

                      {/* Mini Barra de progreso */}
                      <div style={{ height: "4px", width: "100%", backgroundColor: "#E2E8F0", borderRadius: "2px", overflow: "hidden", marginBottom: "0.35rem" }}>
                        <div style={{ height: "100%", width: `${paidPct}%`, backgroundColor: "#00C48C" }} />
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.72rem", color: "#64748B" }}>
                        <DollarSign size={13} color="#00C48C" />
                        <span><strong>{formatMoney(paidMonto)}</strong> Pagado</span>
                      </div>

                      {u.additionals && u.additionals.length > 0 && (
                        <div style={{ marginTop: "0.35rem", display: "flex", flexWrap: "wrap", gap: "0.2rem" }}>
                          {u.additionals.map((a, aIdx) => (
                            <span
                              key={a.id || aIdx}
                              title={`${a.name} (${a.category}) - ${formatMoney(a.price)}`}
                              style={{
                                fontSize: "0.62rem",
                                fontWeight: 700,
                                backgroundColor: "rgba(47, 128, 237, 0.1)",
                                color: "#2F80ED",
                                padding: "0.05rem 0.35rem",
                                borderRadius: "3px",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.2rem",
                              }}
                            >
                              <Package size={9} />
                              {a.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ROW 2: 6 KPI CARDS DE RESUMEN FINANCIERO CON TOOLTIPS INFORMATIVOS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "0.85rem", marginBottom: "1.25rem" }}>
          
          {/* 1. Total a pagar */}
          <div style={{ backgroundColor: "#FFFFFF", borderRadius: "0.95rem", padding: "0.85rem 1rem", boxShadow: "0 2px 8px rgba(0,0,0,0.02)", border: "1px solid #E2E8F0" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.35rem" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748B" }}>
                Total a pagar
              </span>
              <InfoTooltip
                title="Total a Pagar"
                content="Valor total acordado en el contrato de compraventa para la unidad seleccionada."
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <DollarSign size={16} color="#00C48C" />
              <strong style={{ fontSize: "1.05rem", color: "#1F3652" }}>{formatMoney(totalAPagar)}</strong>
            </div>
          </div>

          {/* 2. Total Pendiente */}
          <div style={{ backgroundColor: "#FFFFFF", borderRadius: "0.95rem", padding: "0.85rem 1rem", boxShadow: "0 2px 8px rgba(0,0,0,0.02)", border: "1px solid #E2E8F0" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.35rem" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748B" }}>
                Total Pendiente
              </span>
              <InfoTooltip
                title="Total Pendiente"
                content="Saldo insoluto que resta por cubrir del plan de financiamiento."
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <FileText size={16} color="#C7B28B" />
              <strong style={{ fontSize: "1.05rem", color: "#1F3652" }}>{formatMoney(totalPendiente)}</strong>
            </div>
          </div>

          {/* 3. Saldo Atrasado */}
          <div style={{ backgroundColor: "#FFFFFF", borderRadius: "0.95rem", padding: "0.85rem 1rem", boxShadow: "0 2px 8px rgba(0,0,0,0.02)", border: "1px solid #E2E8F0" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.35rem" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748B" }}>
                Saldo Atrasado
              </span>
              <InfoTooltip
                title="Saldo Atrasado"
                content="Suma de mensualidades o cuotas cuya fecha límite ya venció y aún no cuentan con registro de pago."
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <AlertCircle size={16} color={saldoAtrasado > 0 ? "#E05345" : "#94A3B8"} />
              <strong style={{ fontSize: "1.05rem", color: saldoAtrasado > 0 ? "#E05345" : "#1F3652" }}>
                {formatMoney(saldoAtrasado)}
              </strong>
            </div>
          </div>

          {/* 4. Interés moratorio */}
          <div style={{ backgroundColor: "#FFFFFF", borderRadius: "0.95rem", padding: "0.85rem 1rem", boxShadow: "0 2px 8px rgba(0,0,0,0.02)", border: "1px solid #E2E8F0" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.35rem" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748B" }}>
                Interés moratorio
              </span>
              <InfoTooltip
                title="Intereses Moratorios"
                content="Intereses calculados por días de retraso en pagos vencidos. Pueden cobrarse o condonarse parcial o totalmente por acuerdo comercial."
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <ShieldCheck size={16} color={interesMoratorio > 0 ? "#E05345" : "#F59E0B"} />
              <strong style={{ fontSize: "1.05rem", color: interesMoratorio > 0 ? "#E05345" : "#1F3652" }}>{formatMoney(interesMoratorio)}</strong>
            </div>
          </div>

          {/* 5. Total Pagado */}
          <div style={{ backgroundColor: "#FFFFFF", borderRadius: "0.95rem", padding: "0.85rem 1rem", boxShadow: "0 2px 8px rgba(0,0,0,0.02)", border: "1px solid #E2E8F0" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.35rem" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748B" }}>
                Total Pagado
              </span>
              <InfoTooltip
                title="Total Pagado"
                content="Monto acumulado de pagos registrados y validados con comprobante bancario (capital liquidado e intereses moratorios cobrados)."
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <CheckCircle2 size={16} color="#00C48C" />
              <strong style={{ fontSize: "1.05rem", color: "#00C48C" }}>{formatMoney(totalCobradoTotal)}</strong>
            </div>
            {totalMoratorioPagado > 0 && (
              <div style={{ fontSize: "0.7rem", color: "#64748B", fontWeight: 500, marginTop: "0.25rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                <span>Cap: {formatMoney(totalPagado)}</span>
                <span>•</span>
                <span style={{ color: "#D97706", fontWeight: 600 }}>Int: +{formatMoney(totalMoratorioPagado)}</span>
              </div>
            )}
          </div>

          {/* 6. Siguiente pago */}
          <div style={{ backgroundColor: "#FFFFFF", borderRadius: "0.95rem", padding: "0.85rem 1rem", boxShadow: "0 2px 8px rgba(0,0,0,0.02)", border: "1px solid #E2E8F0" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.2rem" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748B" }}>
                Siguiente pago
              </span>
              <InfoTooltip
                title="Próxima Cuota"
                content="Fecha de vencimiento y monto programado de la mensualidad más cercana."
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <Calendar size={14} color="#F59E0B" />
              <strong style={{ fontSize: "0.85rem", color: "#1F3652" }}>{nextPaymentItem?.fechaProgramada || "Sep 26, 2026"}</strong>
            </div>
            <span style={{ fontSize: "0.72rem", color: "#64748B", display: "block", marginTop: "0.15rem" }}>
              {formatMoney(nextPaymentItem?.montoProgramado || 259583)}
            </span>
          </div>
        </div>

        {/* BOTONES DE PESTAÑAS: ESTADO DE CUENTA vs PAGOS */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
          <button
            type="button"
            onClick={() => setActiveTab("statement")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.45rem",
              padding: "0.5rem 1.15rem",
              borderRadius: "9999px",
              fontSize: "0.82rem",
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
              backgroundColor: activeTab === "statement" ? "#1B3047" : "#FFFFFF",
              color: activeTab === "statement" ? "#FFFFFF" : "#64748B",
              boxShadow: activeTab === "statement" ? "0 2px 6px rgba(27, 48, 71, 0.2)" : "0 1px 3px rgba(0,0,0,0.03)",
            }}
          >
            <Calendar size={15} /> Estado de Cuenta
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("payments")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.45rem",
              padding: "0.5rem 1.15rem",
              borderRadius: "9999px",
              fontSize: "0.82rem",
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
              backgroundColor: activeTab === "payments" ? "#1B3047" : "#FFFFFF",
              color: activeTab === "payments" ? "#FFFFFF" : "#64748B",
              boxShadow: activeTab === "payments" ? "0 2px 6px rgba(27, 48, 71, 0.2)" : "0 1px 3px rgba(0,0,0,0.03)",
            }}
          >
            <CreditCard size={15} /> Pagos Realizados ({paymentsList.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("quotes")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.45rem",
              padding: "0.5rem 1.15rem",
              borderRadius: "9999px",
              fontSize: "0.82rem",
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
              backgroundColor: activeTab === "quotes" ? "#1B3047" : "#FFFFFF",
              color: activeTab === "quotes" ? "#FFFFFF" : "#64748B",
              boxShadow: activeTab === "quotes" ? "0 2px 6px rgba(27, 48, 71, 0.2)" : "0 1px 3px rgba(0,0,0,0.03)",
            }}
          >
            <FileText size={15} /> Cotizaciones ({clientQuotes.length})
          </button>
        </div>

        {/* CONTENIDO PRINCIPAL: VISTA ESTADO DE CUENTA vs VISTA PAGOS */}
        {activeTab === "statement" ? (
          /* ============================================================== */
          /* PESTAÑA 1: ESTADO DE CUENTA (CON ORDENAMIENTO POR COLUMNA)     */
          /* ============================================================== */
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "1.25rem",
              padding: "1.5rem",
              boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
              border: "1px solid rgba(22, 43, 63, 0.05)",
              marginBottom: "1.5rem",
            }}
          >
            {/* Header del Bloque */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#1F3652", margin: 0 }}>
                  Estado de cuenta
                </h3>
                <InfoTooltip
                  title="Calendario de Amortización"
                  content="Haz clic en los encabezados de cualquier columna para ordenar las cuotas de forma ascendente o descendente."
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                {currentSale && hasPermission("sales.edit") && (
                  <button
                    type="button"
                    onClick={() => setShowEditSaleModal(true)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.45rem",
                      backgroundColor: "rgba(47, 128, 237, 0.08)",
                      color: "#2F80ED",
                      padding: "0.55rem 1.1rem",
                      borderRadius: "9999px",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      border: "1px solid rgba(47, 128, 237, 0.25)",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <Package size={15} /> Editar Venta & Adicionales
                  </button>
                )}

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
                      padding: "0.55rem 1.1rem",
                      borderRadius: "9999px",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      border: "1px solid rgba(0, 196, 140, 0.25)",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <FileSpreadsheet size={15} /> Carga Masiva XLSX
                  </button>
                )}

                {hasPermission("payments.register") && (
                  <button
                    type="button"
                    onClick={() => setShowRegisterPaymentModal(true)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.45rem",
                      backgroundColor: "#1B3047",
                      color: "#FFFFFF",
                      padding: "0.55rem 1.25rem",
                      borderRadius: "9999px",
                      fontSize: "0.82rem",
                      fontWeight: 600,
                      border: "none",
                      cursor: "pointer",
                      boxShadow: "0 2px 6px rgba(27, 48, 71, 0.15)",
                    }}
                  >
                    <CreditCard size={15} /> Registrar pago
                  </button>
                )}

                {hasPermission("clients.export_statement") && (
                  <>
                    <button
                      type="button"
                      onClick={handleExportStatementExcel}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.45rem",
                        backgroundColor: "#FFFFFF",
                        color: "#1F3652",
                        padding: "0.55rem 1.15rem",
                        borderRadius: "9999px",
                        fontSize: "0.82rem",
                        fontWeight: 600,
                        border: "1px solid #CBD5E1",
                        cursor: "pointer",
                      }}
                    >
                      <Download size={15} /> Excel
                    </button>

                    <button
                      type="button"
                      onClick={handleExportStatementPDF}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.45rem",
                        backgroundColor: "#FFFFFF",
                        color: "#1F3652",
                        padding: "0.55rem 1.15rem",
                        borderRadius: "9999px",
                        fontSize: "0.82rem",
                        fontWeight: 600,
                        border: "1px solid #CBD5E1",
                        cursor: "pointer",
                      }}
                    >
                      <Printer size={15} color="#2F80ED" /> PDF
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Adicionales / Addons de la Unidad Seleccionada */}
            {currentUnitObj?.additionals && currentUnitObj.additionals.length > 0 && (
              <div
                style={{
                  backgroundColor: "#F8FAFC",
                  borderRadius: "0.85rem",
                  padding: "1rem 1.25rem",
                  border: "1px solid #E2E8F0",
                  marginBottom: "1.25rem",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#1F3652", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <Package size={16} color="#2F80ED" /> Adicionales / Addons Incluidos en Unidad {selectedUnit} ({currentUnitObj.additionals.length})
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "#64748B" }}>
                    Monto total en adicionales: <strong style={{ color: "#1F3652" }}>{formatMoney(currentUnitObj.additionals.reduce((sum, a) => sum + (a.price || 0), 0))}</strong>
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "0.5rem" }}>
                  {currentUnitObj.additionals.map((addon, aIdx) => (
                    <div
                      key={addon.id || aIdx}
                      style={{
                        backgroundColor: "#FFFFFF",
                        padding: "0.55rem 0.85rem",
                        borderRadius: "0.5rem",
                        border: "1px solid #E2E8F0",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        fontSize: "0.8rem",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                        <Box size={14} color="#2F80ED" />
                        <div>
                          <strong style={{ color: "#1F3652", display: "block" }}>{addon.name}</strong>
                          <span style={{ fontSize: "0.7rem", color: "#64748B", textTransform: "capitalize" }}>
                            {addon.category} {addon.areaM2 ? `• ${addon.areaM2} m²` : ""}
                          </span>
                        </div>
                      </div>
                      <span style={{ fontWeight: 700, color: "#00C48C" }}>
                        {formatMoney(addon.price)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TABLA ESTADO DE CUENTA CON ORDENAMIENTO */}
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, textAlign: "left", fontSize: "0.82rem" }}>
                <thead>
                  <tr style={{ backgroundColor: "#1B3047", color: "#FFFFFF" }}>
                    
                    {/* Monto programado */}
                    <th
                      onClick={() => handleSortStatement("montoProgramado")}
                      style={{ padding: "0.85rem 1rem", fontWeight: 700, borderTopLeftRadius: "0.75rem", borderBottomLeftRadius: "0.75rem", cursor: "pointer", userSelect: "none" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                        Monto programado
                        <ArrowUpDown size={13} style={{ opacity: statementSortField === "montoProgramado" ? 1 : 0.4 }} />
                      </div>
                    </th>

                    {/* Fecha programada */}
                    <th
                      onClick={() => handleSortStatement("fechaProgramada")}
                      style={{ padding: "0.85rem 1rem", fontWeight: 700, cursor: "pointer", userSelect: "none" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                        Fecha programada
                        <ArrowUpDown size={13} style={{ opacity: statementSortField === "fechaProgramada" ? 1 : 0.4 }} />
                      </div>
                    </th>

                    {/* Monto pagado */}
                    <th
                      onClick={() => handleSortStatement("montoPagado")}
                      style={{ padding: "0.85rem 1rem", fontWeight: 700, textAlign: "right", cursor: "pointer", userSelect: "none" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.35rem" }}>
                        Monto pagado
                        <ArrowUpDown size={13} style={{ opacity: statementSortField === "montoPagado" ? 1 : 0.4 }} />
                      </div>
                    </th>

                    {/* Monto pendiente */}
                    <th
                      onClick={() => handleSortStatement("montoPendiente")}
                      style={{ padding: "0.85rem 1rem", fontWeight: 700, textAlign: "right", cursor: "pointer", userSelect: "none" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.35rem" }}>
                        Monto pendiente
                        <ArrowUpDown size={13} style={{ opacity: statementSortField === "montoPendiente" ? 1 : 0.4 }} />
                      </div>
                    </th>

                    {/* Fecha de pago */}
                    <th
                      onClick={() => handleSortStatement("fechaPago")}
                      style={{ padding: "0.85rem 1rem", fontWeight: 700, textAlign: "center", cursor: "pointer", userSelect: "none" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem" }}>
                        Fecha de pago
                        <ArrowUpDown size={13} style={{ opacity: statementSortField === "fechaPago" ? 1 : 0.4 }} />
                      </div>
                    </th>

                    {/* Unidad */}
                    <th
                      onClick={() => handleSortStatement("unit")}
                      style={{ padding: "0.85rem 1rem", fontWeight: 700, textAlign: "center", cursor: "pointer", userSelect: "none" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem" }}>
                        Unidad
                        <ArrowUpDown size={13} style={{ opacity: statementSortField === "unit" ? 1 : 0.4 }} />
                      </div>
                    </th>

                    {/* Plan de Pago */}
                    <th
                      onClick={() => handleSortStatement("planPago")}
                      style={{ padding: "0.85rem 1rem", fontWeight: 700, cursor: "pointer", userSelect: "none" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                        Plan de Pago
                        <ArrowUpDown size={13} style={{ opacity: statementSortField === "planPago" ? 1 : 0.4 }} />
                      </div>
                    </th>

                    {/* Método de pago */}
                    <th
                      onClick={() => handleSortStatement("metodoPago")}
                      style={{ padding: "0.85rem 1rem", fontWeight: 700, textAlign: "center", cursor: "pointer", userSelect: "none" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem" }}>
                        Método de pago
                        <ArrowUpDown size={13} style={{ opacity: statementSortField === "metodoPago" ? 1 : 0.4 }} />
                      </div>
                    </th>

                    {/* Status */}
                    <th
                      onClick={() => handleSortStatement("status")}
                      style={{ padding: "0.85rem 1rem", fontWeight: 700, textAlign: "center", cursor: "pointer", userSelect: "none" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem" }}>
                        Status
                        <ArrowUpDown size={13} style={{ opacity: statementSortField === "status" ? 1 : 0.4 }} />
                      </div>
                    </th>

                    {/* Interés moratorio */}
                    <th
                      onClick={() => handleSortStatement("interesMoratorio")}
                      style={{ padding: "0.85rem 1rem", fontWeight: 700, textAlign: "right", cursor: "pointer", userSelect: "none" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.35rem" }}>
                        Interés moratorio
                        <ArrowUpDown size={13} style={{ opacity: statementSortField === "interesMoratorio" ? 1 : 0.4 }} />
                      </div>
                    </th>

                    {/* Acciones */}
                    <th style={{ padding: "0.85rem 1rem", fontWeight: 700, borderTopRightRadius: "0.75rem", borderBottomRightRadius: "0.75rem", textAlign: "center", userSelect: "none" }}>
                      Abonos / Recibo
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {sortedStatementData.map((row, idx) => (
                    <tr
                      key={row.id ? `${row.id}-${idx}` : `stmt-${selectedUnit}-${idx}`}
                      style={{
                        borderBottom: "1px solid #F1F5F9",
                        transition: "background-color 0.15s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(31, 54, 82, 0.02)")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      {/* Monto programado */}
                      <td style={{ padding: "1rem 1rem", fontWeight: 700, color: "#1F3652" }}>
                        {formatMoney(row.montoProgramado)}
                      </td>

                      {/* Fecha programada */}
                      <td style={{ padding: "1rem 1rem", color: "#475569" }}>
                        {row.fechaProgramada}
                      </td>

                      {/* Monto pagado */}
                      <td style={{ padding: "1rem 1rem", fontWeight: 700, color: row.montoPagado > 0 ? "#00C48C" : "#1F3652", textAlign: "right" }}>
                        {formatMoney(row.montoPagado)}
                      </td>

                      {/* Monto pendiente */}
                      <td style={{ padding: "1rem 1rem", fontWeight: 700, color: "#1F3652", textAlign: "right" }}>
                        {formatMoney(row.montoPendiente)}
                      </td>

                      {/* Fecha de pago */}
                      <td style={{ padding: "1rem 1rem", textAlign: "center" }}>
                        {row.fechaPago === "Pendiente" ? (
                          <span style={{ display: "inline-block", backgroundColor: "#E5C46A", color: "#FFFFFF", padding: "0.22rem 0.65rem", borderRadius: "0.45rem", fontSize: "0.74rem", fontWeight: 600 }}>
                            Pendiente
                          </span>
                        ) : (
                          <span style={{ color: "#475569", fontWeight: 500 }}>{row.fechaPago}</span>
                        )}
                      </td>

                      {/* Unidad */}
                      <td style={{ padding: "1rem 1rem", textAlign: "center", fontWeight: 700, color: "#1F3652" }}>
                        {row.unit}
                      </td>

                      {/* Plan de Pago */}
                      <td style={{ padding: "1rem 1rem", color: "#475569" }}>
                        {row.planPago}
                      </td>

                      {/* Método de pago */}
                      <td style={{ padding: "1rem 1rem", textAlign: "center" }}>
                        {row.metodoPago === "Pendiente" ? (
                          <span style={{ display: "inline-block", backgroundColor: "#E5C46A", color: "#FFFFFF", padding: "0.22rem 0.65rem", borderRadius: "0.45rem", fontSize: "0.74rem", fontWeight: 600 }}>
                            Pendiente
                          </span>
                        ) : (
                          <span style={{ color: "#1F3652", fontWeight: 600 }}>{row.metodoPago}</span>
                        )}
                      </td>

                      {/* Status */}
                      <td style={{ padding: "1rem 1rem", textAlign: "center" }}>
                        {row.status === "Atrasado" ? (
                          <span style={{ display: "inline-block", backgroundColor: "#EF4444", color: "#FFFFFF", padding: "0.22rem 0.75rem", borderRadius: "9999px", fontSize: "0.74rem", fontWeight: 700 }}>
                            Atrasado
                          </span>
                        ) : row.status === "Pagado" ? (
                          <span style={{ display: "inline-block", backgroundColor: "#10B981", color: "#FFFFFF", padding: "0.22rem 0.75rem", borderRadius: "9999px", fontSize: "0.74rem", fontWeight: 700 }}>
                            Pagado
                          </span>
                        ) : (
                          <span style={{ display: "inline-block", backgroundColor: "#E2E8F0", color: "#475569", padding: "0.22rem 0.75rem", borderRadius: "9999px", fontSize: "0.74rem", fontWeight: 600 }}>
                            Pendiente
                          </span>
                        )}
                      </td>

                      {/* Interés moratorio */}
                      <td style={{ padding: "1rem 1rem", color: row.interesMoratorio > 0 ? "#EF4444" : "#64748B", textAlign: "right", fontWeight: 600 }}>
                        {formatMoney(row.interesMoratorio)}
                      </td>

                      {/* Botones de Acción: Editar Cuota y Ver Abonos */}
                      <td style={{ padding: "0.75rem 1rem", textAlign: "center" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                          <button
                            type="button"
                            onClick={() => handleOpenEditInstallment(row)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.25rem",
                              backgroundColor: "#F1F5F9",
                              color: "#1F3652",
                              border: "1px solid #CBD5E1",
                              padding: "0.35rem 0.6rem",
                              borderRadius: "0.5rem",
                              fontSize: "0.74rem",
                              fontWeight: 700,
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                              whiteSpace: "nowrap",
                            }}
                            title="Modificar Cuota Programada (monto o fecha pactada)"
                          >
                            <Edit3 size={12} color="#2F80ED" /> Editar
                          </button>

                            <button
                              type="button"
                              onClick={() => setSelectedCuotaForAbonos(row)}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.35rem",
                                backgroundColor: row.montoPagado > 0 ? "rgba(0, 196, 140, 0.12)" : "rgba(47, 128, 237, 0.08)",
                                color: row.montoPagado > 0 ? "#00A877" : "#2F80ED",
                                border: row.montoPagado > 0 ? "1px solid rgba(0, 196, 140, 0.25)" : "1px solid rgba(47, 128, 237, 0.2)",
                                padding: "0.35rem 0.65rem",
                                borderRadius: "0.5rem",
                                fontSize: "0.74rem",
                                fontWeight: 700,
                                cursor: "pointer",
                                transition: "all 0.15s ease",
                                whiteSpace: "nowrap",
                              }}
                            >
                              <FileText size={13} /> {row.montoPagado > 0 ? "Abonos" : "Detalle"}
                            </button>

                            {row.status === "Atrasado" && (
                              <button
                                type="button"
                                onClick={() => handleSendInstallmentOverdueNotice(row)}
                                title="Enviar aviso formal de mora con cálculo de interés al comprador"
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

                            {row.status === "Pendiente" && (
                              <button
                                type="button"
                                onClick={() => handleSendInstallmentReminder(row)}
                                title="Enviar recordatorio preventivo de pago al comprador"
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
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* ============================================================== */
          /* PESTAÑA 2: PAGOS RECIBIDOS CON EDICIÓN Y COMPROBANTES          */
          /* ============================================================== */
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "1.25rem",
              padding: "1.5rem",
              boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
              border: "1px solid rgba(22, 43, 63, 0.05)",
              marginBottom: "1.5rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#1F3652", margin: 0 }}>
                  Historial de Pagos Realizados
                </h3>
                <InfoTooltip
                  title="Auditoría de Pagos"
                  content="Registros validados de transferencias, cheques o depósitos. Puedes editar fechas o montos en caso de correcciones contables."
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => setShowUploadPaymentsModal(true)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.45rem",
                    backgroundColor: "rgba(0, 196, 140, 0.08)",
                    color: "#00A877",
                    padding: "0.55rem 1.1rem",
                    borderRadius: "9999px",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    border: "1px solid rgba(0, 196, 140, 0.25)",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <FileSpreadsheet size={15} /> Carga Masiva XLSX
                </button>

                <button
                  type="button"
                  onClick={() => setShowRegisterPaymentModal(true)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.45rem",
                    backgroundColor: "#1B3047",
                    color: "#FFFFFF",
                    padding: "0.55rem 1.25rem",
                    borderRadius: "9999px",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    border: "none",
                    cursor: "pointer",
                    boxShadow: "0 2px 6px rgba(27, 48, 71, 0.15)",
                  }}
                >
                  <CreditCard size={15} /> Registrar pago
                </button>
              </div>
            </div>

            {/* TABLA DE HISTORIAL DE PAGOS */}
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, textAlign: "left", fontSize: "0.82rem" }}>
                <thead>
                  <tr style={{ backgroundColor: "#1B3047", color: "#FFFFFF" }}>
                    <th style={{ width: "75px", padding: "0.85rem 0.75rem", borderTopLeftRadius: "0.75rem", borderBottomLeftRadius: "0.75rem", textAlign: "center" }}>
                      Acciones
                    </th>
                    <th onClick={() => handleSortPayments("fechaPago")} style={{ padding: "0.85rem 1rem", fontWeight: 700, cursor: "pointer" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                        Fecha pago
                        <ArrowUpDown size={13} style={{ opacity: paymentSortField === "fechaPago" ? 1 : 0.4 }} />
                      </div>
                    </th>
                    <th onClick={() => handleSortPayments("metodoPago")} style={{ padding: "0.85rem 1rem", fontWeight: 700, cursor: "pointer" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                        Método pago
                        <ArrowUpDown size={13} style={{ opacity: paymentSortField === "metodoPago" ? 1 : 0.4 }} />
                      </div>
                    </th>
                    <th onClick={() => handleSortPayments("monto")} style={{ padding: "0.85rem 1rem", fontWeight: 700, cursor: "pointer" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                        Monto
                        <ArrowUpDown size={13} style={{ opacity: paymentSortField === "monto" ? 1 : 0.4 }} />
                      </div>
                    </th>
                    <th onClick={() => handleSortPayments("unit")} style={{ padding: "0.85rem 1rem", fontWeight: 700, textAlign: "center", cursor: "pointer" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem" }}>
                        Unidad
                        <ArrowUpDown size={13} style={{ opacity: paymentSortField === "unit" ? 1 : 0.4 }} />
                      </div>
                    </th>
                    <th style={{ padding: "0.85rem 1rem", fontWeight: 700, textAlign: "center" }}>Recibo</th>
                    <th style={{ padding: "0.85rem 1rem", fontWeight: 700, borderTopRightRadius: "0.75rem", borderBottomRightRadius: "0.75rem", textAlign: "center" }}>Comprobante</th>
                  </tr>
                </thead>

                <tbody>
                  {sortedPaymentsList.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: "3rem", textAlign: "center", color: "#94A3B8" }}>
                        No hay pagos registrados para este cliente.
                      </td>
                    </tr>
                  ) : (
                    sortedPaymentsList.map((p, idx) => (
                      <tr
                        key={p.id ? `${p.id}-${idx}` : `pay-${selectedUnit}-${idx}`}
                        style={{ borderBottom: "1px solid #F1F5F9" }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(31, 54, 82, 0.02)")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                      >
                        {/* Botones de acción: Editar y Eliminar */}
                        <td style={{ padding: "1rem 0.75rem", textAlign: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                            <button
                              type="button"
                              onClick={() => handleOpenEditPayment(p)}
                              style={{ background: "none", border: "none", color: "#2F80ED", cursor: "pointer", padding: "2px" }}
                              title="Modificar datos del pago (monto, fecha, método)"
                            >
                              <Edit3 size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePayment(p.id)}
                              style={{ background: "none", border: "none", color: "#EF4444", cursor: "pointer", padding: "2px" }}
                              title="Eliminar registro de pago"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>

                        {/* Fecha pago */}
                        <td style={{ padding: "1rem 1rem", color: "#475569" }}>{p.fechaPago}</td>

                        {/* Metodo pago */}
                        <td style={{ padding: "1rem 1rem", color: "#1F3652", fontWeight: 600 }}>{p.metodoPago}</td>

                        {/* Monto */}
                        <td style={{ padding: "1rem 1rem", fontWeight: 800, color: "#1F3652" }}>
                          <div>{formatMoney(p.monto)}</div>
                          {p.moratoryAmount && p.moratoryAmount > 0 ? (
                            <div style={{ fontSize: "0.72rem", color: "#64748B", fontWeight: 500, marginTop: "0.2rem", display: "flex", gap: "0.35rem", alignItems: "center" }}>
                              <span style={{ backgroundColor: "#F1F5F9", padding: "0.1rem 0.35rem", borderRadius: "0.25rem", color: "#1F3652" }}>
                                Cap: {formatMoney(p.monto - p.moratoryAmount)}
                              </span>
                              <span style={{ backgroundColor: "#FEF3C7", padding: "0.1rem 0.35rem", borderRadius: "0.25rem", color: "#92400E" }}>
                                Int: +{formatMoney(p.moratoryAmount)}
                              </span>
                            </div>
                          ) : null}
                        </td>

                        {/* Unidad */}
                        <td style={{ padding: "1rem 1rem", textAlign: "center", fontWeight: 700, color: "#1F3652" }}>
                          {p.unit}
                        </td>

                        {/* Recibo -> [ Abrir ] */}
                        <td style={{ padding: "1rem 1rem", textAlign: "center" }}>
                          <button
                            type="button"
                            onClick={() => setSelectedReceiptForView(p)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.35rem",
                              backgroundColor: "#1B3047",
                              color: "#FFFFFF",
                              padding: "0.4rem 1rem",
                              borderRadius: "9999px",
                              fontSize: "0.78rem",
                              fontWeight: 600,
                              border: "none",
                              cursor: "pointer",
                            }}
                          >
                            <ExternalLink size={13} /> Abrir
                          </button>
                        </td>

                        {/* Comprobante -> [ Abrir ] */}
                        <td style={{ padding: "1rem 1rem", textAlign: "center" }}>
                          <button
                            type="button"
                            onClick={() => setSelectedVoucherForView(p)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.35rem",
                              backgroundColor: "#1B3047",
                              color: "#FFFFFF",
                              padding: "0.4rem 1rem",
                              borderRadius: "9999px",
                              fontSize: "0.78rem",
                              fontWeight: 600,
                              border: "none",
                              cursor: "pointer",
                            }}
                          >
                            <ExternalLink size={13} /> Abrir
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* PESTAÑA 3: COTIZACIONES DEL CLIENTE                            */}
        {/* ============================================================== */}
        {activeTab === "quotes" && (
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "1.25rem",
              padding: "1.5rem",
              boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
              border: "1px solid rgba(22, 43, 63, 0.05)",
              marginBottom: "1.5rem",
            }}
          >
            {/* Header del Bloque */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#1F3652", margin: 0 }}>
                  Cotizaciones Emitidas para este Cliente
                </h3>
                <InfoTooltip
                  title="Historial de Cotizaciones"
                  content="Propuestas comerciales y planes de amortización elaborados para este cliente o prospecto."
                />
              </div>

              <span style={{ fontSize: "0.82rem", color: "#64748B" }}>
                Total: <strong>{clientQuotes.length}</strong> cotizaciones
              </span>
            </div>

            {/* TABLA DE COTIZACIONES */}
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, textAlign: "left", fontSize: "0.82rem" }}>
                <thead>
                  <tr style={{ backgroundColor: "#1B3047", color: "#FFFFFF" }}>
                    <th style={{ padding: "0.85rem 1.25rem", borderTopLeftRadius: "0.75rem", borderBottomLeftRadius: "0.75rem" }}>
                      Folio
                    </th>
                    <th style={{ padding: "0.85rem 1rem" }}>Unidad</th>
                    <th style={{ padding: "0.85rem 1rem" }}>Plan Financiero</th>
                    <th style={{ padding: "0.85rem 1rem", textAlign: "right" }}>Monto Cotizado</th>
                    <th style={{ padding: "0.85rem 1rem" }}>Asesor</th>
                    <th style={{ padding: "0.85rem 1rem" }}>Vigencia</th>
                    <th style={{ padding: "0.85rem 1rem", textAlign: "center" }}>Estado</th>
                    <th style={{ padding: "0.85rem 1.25rem", borderTopRightRadius: "0.75rem", borderBottomRightRadius: "0.75rem", textAlign: "center" }}>
                      Acción
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {clientQuotes.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ padding: "3rem 1rem", textAlign: "center", color: "#94A3B8" }}>
                        No hay cotizaciones registradas específicamente para este cliente o sus unidades en este proyecto.
                      </td>
                    </tr>
                  ) : (
                    clientQuotes.map((q) => (
                      <tr key={q.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                        <td style={{ padding: "1rem 1.25rem", fontWeight: 700, color: "#1F3652" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                            <FileText size={14} color="#2F80ED" />
                            {q.folio}
                          </div>
                        </td>
                        <td style={{ padding: "1rem 1rem", fontWeight: 700, color: "#1F3652" }}>
                          {q.unit} <span style={{ fontSize: "0.72rem", color: "#64748B", fontWeight: 500 }}>({q.unitType})</span>
                        </td>
                        <td style={{ padding: "1rem 1rem", color: "#475569" }}>
                          <strong>{q.planName}</strong>
                          <div style={{ fontSize: "0.72rem", color: "#64748B" }}>
                            Eng: {q.downPaymentPct}% • {q.installmentsCount} m. • Liq: {q.settlementPct}%
                          </div>
                        </td>
                        <td style={{ padding: "1rem 1rem", fontWeight: 700, color: "#1F3652", textAlign: "right" }}>
                          {formatMoney(q.totalQuoteAmount)}
                        </td>
                        <td style={{ padding: "1rem 1rem", color: "#475569" }}>{q.advisorName}</td>
                        <td style={{ padding: "1rem 1rem", color: "#64748B" }}>
                          {new Date(q.expiresAt).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}
                        </td>
                        <td style={{ padding: "1rem 1rem", textAlign: "center" }}>
                          <span
                            style={{
                              fontSize: "0.72rem",
                              fontWeight: 800,
                              padding: "0.2rem 0.6rem",
                              borderRadius: "9999px",
                              backgroundColor:
                                q.status === "VIGENTE"
                                  ? "rgba(0, 196, 140, 0.12)"
                                  : q.status === "CONVERTIDA_A_VENTA"
                                  ? "rgba(47, 128, 237, 0.12)"
                                  : "rgba(242, 153, 74, 0.12)",
                              color:
                                q.status === "VIGENTE"
                                  ? "#00C48C"
                                  : q.status === "CONVERTIDA_A_VENTA"
                                  ? "#2F80ED"
                                  : "#F2994A",
                            }}
                          >
                            {q.status === "VIGENTE" ? "● Vigente" : q.status === "CONVERTIDA_A_VENTA" ? "✓ Vendida" : q.status}
                          </span>
                        </td>
                        <td style={{ padding: "0.75rem 1.25rem", textAlign: "center" }}>
                          {(() => {
                            const buildPayload = () => {
                              const devLogoUrl =
                                developerLogo ||
                                (typeof window !== "undefined" && (localStorage.getItem("devio_developer_logo") || sessionStorage.getItem("devio_developer_logo"))) ||
                                "";
                              const projLogoUrl =
                                project?.logoFileName ||
                                project?.logoUrl ||
                                project?.logo ||
                                (project?.image && project.image.startsWith("http") ? project.image : devLogoUrl);

                              const unitObj = project.unitsInventory?.find((u) => u.unit === q.unit);
                              const unitPhoto = (unitObj?.images && unitObj.images.length > 0 && unitObj.images[0])
                                ? unitObj.images[0]
                                : (project.coverFileName || project.image || project.logoFileName || devLogoUrl);

                              const floorPlanUrl =
                                (unitObj?.floorPlan && project.floorPlans?.find((fp) => fp.name === unitObj.floorPlan || fp.id === unitObj.floorPlan)?.imageUrl) ||
                                (project.floorPlans && project.floorPlans.length > 0 && project.floorPlans[0]?.imageUrl) ||
                                undefined;

                              const chars: Array<{ label: string; value: string }> = [];
                              if (unitObj?.areaM2 || q.superficieM2) chars.push({ label: "Superficie Total", value: `${unitObj?.areaM2 || q.superficieM2} m²` });
                              if (unitObj?.interiorAreaM2) chars.push({ label: "Superficie Interior", value: `${unitObj.interiorAreaM2} m²` });
                              if (unitObj?.terraceAreaM2) chars.push({ label: "Terraza / Balcón", value: `${unitObj.terraceAreaM2} m²` });
                              if (unitObj?.gardenAreaM2) chars.push({ label: "Jardín / Roof", value: `${unitObj.gardenAreaM2} m²` });
                              if (unitObj?.bedrooms !== undefined && unitObj?.bedrooms !== null && unitObj?.bedrooms > 0) chars.push({ label: "Recámaras", value: `${unitObj.bedrooms}` });
                              if (unitObj?.bathrooms !== undefined && unitObj?.bathrooms !== null && unitObj?.bathrooms > 0) chars.push({ label: "Baños", value: `${unitObj.bathrooms}` });
                              if (unitObj?.parkingSpots !== undefined && unitObj?.parkingSpots !== null && unitObj?.parkingSpots > 0) chars.push({ label: "Estacionamientos", value: `${unitObj.parkingSpots}` });
                              if (unitObj?.storageUnits !== undefined && unitObj?.storageUnits !== null && unitObj?.storageUnits > 0) chars.push({ label: "Bodegas", value: `${unitObj.storageUnits}` });
                              if (unitObj?.floor !== undefined && unitObj?.floor !== null) chars.push({ label: "Nivel / Piso", value: `Nivel ${unitObj.floor}` });
                              if (unitObj?.orientation) chars.push({ label: "Orientación", value: unitObj.orientation });
                              if (unitObj?.viewType) chars.push({ label: "Vista", value: unitObj.viewType });
                              if (q.deliveryDate || unitObj?.deliveryDate || project.estimatedDeliveryDate) chars.push({ label: "Entrega Estimada", value: q.deliveryDate || unitObj?.deliveryDate || project.estimatedDeliveryDate || "" });
                              if (unitObj?.maintenanceFee) chars.push({ label: "Cuota Mantto.", value: `$${unitObj.maintenanceFee.toLocaleString("es-MX")}/mes` });
                              if (unitObj?.levelHeightM) chars.push({ label: "Altura Libre", value: `${unitObj.levelHeightM} m` });

                              return {
                                quoteFolio: q.folio,
                                unitNumber: q.unit,
                                unitType: q.unitType || "Departamento",
                                superficieM2: q.superficieM2 || unitObj?.areaM2 || 0,
                                deliveryDate: q.deliveryDate || unitObj?.deliveryDate || project.estimatedDeliveryDate || "Mayo 2028",
                                projectName: project.name,
                                developerLogoUrl: devLogoUrl,
                                projectLogoUrl: projLogoUrl,
                                projectCoverUrl: project.coverFileName || project.image,
                                unitImageUrl: unitPhoto,
                                floorPlanUrl: floorPlanUrl,
                                developerName: "Desarrolladora Inmobiliaria",
                                characteristics: chars,
                                isCoOwnership: q.isCoOwnership,
                                coOwners: q.coOwners,
                                listPrice: q.listPrice || q.totalQuoteAmount,
                                discountPct: q.discountPct,
                                discountAmount: q.discountAmount,
                                totalQuoteAmount: q.totalQuoteAmount,
                                planName: q.planName || "Plan de Pago",
                                downPaymentAmount: q.downPaymentAmount,
                                downPaymentPct: q.downPaymentPct,
                                installmentsCount: q.installmentsCount,
                                installmentAmount: q.installmentAmount,
                                settlementAmount: q.settlementAmount,
                                settlementPct: q.settlementPct,
                                additionals: q.additionals || [],
                                client: {
                                  name: q.clientName,
                                  email: q.clientEmail,
                                  phone: q.clientPhone,
                                  rfc: q.clientRfc,
                                },
                                advisor: {
                                  name: q.advisorName || "Asesor Comercial",
                                  role: "Asesor Comercial",
                                },
                                brandColor: "#1F3652",
                              };
                            };

                            return (
                              <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", justifyContent: "center" }}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const payload = buildPayload();
                                    openQuoteInNewTab(payload);
                                    showToast("Cotización", `Abriendo vista previa de ${q.folio}...`);
                                  }}
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "0.3rem",
                                    backgroundColor: "rgba(31, 54, 82, 0.08)",
                                    color: "#1F3652",
                                    padding: "0.35rem 0.75rem",
                                    borderRadius: "9999px",
                                    fontSize: "0.72rem",
                                    fontWeight: 700,
                                    border: "1px solid rgba(31, 54, 82, 0.15)",
                                    cursor: "pointer",
                                  }}
                                  title="Abrir cotización en pestaña nueva"
                                >
                                  <ExternalLink size={12} /> Abrir
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const payload = buildPayload();
                                    generateQuotePDF(payload);
                                    showToast("PDF Generado", `Descargando cotización ${q.folio}...`);
                                  }}
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "0.3rem",
                                    backgroundColor: "#1B3047",
                                    color: "#FFFFFF",
                                    padding: "0.35rem 0.75rem",
                                    borderRadius: "9999px",
                                    fontSize: "0.72rem",
                                    fontWeight: 700,
                                    border: "none",
                                    cursor: "pointer",
                                  }}
                                  title="Descargar PDF"
                                >
                                  <Download size={12} /> PDF
                                </button>
                              </div>
                            );
                          })()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SECCIÓN DOCUMENTOS DEL CLIENTE */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "1.25rem",
            padding: "1.5rem",
            boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
            border: "1px solid rgba(22, 43, 63, 0.05)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#1F3652", margin: 0 }}>
                Documentos
              </h3>
              <InfoTooltip
                title="Bóveda de Expedientes Digitales"
                content="Almacena contratos de compraventa, pagarés, identificaciones oficiales, escrituras y actas constitutivas vinculadas al cliente y a sus unidades."
              />
            </div>

            <button
              type="button"
              onClick={() => setShowUploadDocModal(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.45rem",
                backgroundColor: "#1B3047",
                color: "#FFFFFF",
                padding: "0.55rem 1.25rem",
                borderRadius: "9999px",
                fontSize: "0.82rem",
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(27, 48, 71, 0.15)",
              }}
            >
              <FileText size={15} /> Subir documento
            </button>
          </div>

          {/* Empty State or Cards Grid */}
          {clientDocuments.length === 0 ? (
            <div
              style={{
                border: "1px solid #E2E8F0",
                borderRadius: "1rem",
                padding: "3.5rem 2rem",
                textAlign: "center",
                backgroundColor: "#F8FAFC",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.75rem",
              }}
            >
              <div style={{ width: "56px", height: "48px", border: "2.5px solid #1B3047", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", padding: "4px" }}>
                <div style={{ width: "16px", height: "16px", border: "2px solid #1B3047", marginRight: "4px" }} />
                <div style={{ flex: 1, height: "2px", backgroundColor: "#1B3047" }} />
              </div>
              <strong style={{ fontSize: "0.95rem", color: "#1F3652", display: "block" }}>
                No tienes documentos cargados todavía.
              </strong>
              <span style={{ fontSize: "0.82rem", color: "#64748B" }}>
                Agrega contratos, planos, fichas técnicas u otros archivos importantes del proyecto.
              </span>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1rem" }}>
              {clientDocuments.map((doc) => (
                <div
                  key={doc.id}
                  style={{
                    padding: "1.25rem",
                    borderRadius: "1rem",
                    border: "1px solid #E2E8F0",
                    backgroundColor: "#FFFFFF",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: "1rem",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "10px",
                        backgroundColor: "#EFF6FF",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <FileText size={22} color="#2F80ED" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.25rem" }}>
                        <strong style={{ fontSize: "0.92rem", color: "#1F3652", wordBreak: "break-word" }}>{doc.title}</strong>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", fontSize: "0.75rem", color: "#64748B" }}>
                        <span>Unidad <strong>{doc.unit}</strong></span>
                        <span>•</span>
                        <span>{doc.fileSize || "1.2 MB"}</span>
                        <span>•</span>
                        <span>{doc.uploadDate}</span>
                      </div>
                      <div style={{ marginTop: "0.4rem" }}>
                        <span
                          style={{
                            fontSize: "0.68rem",
                            fontWeight: 700,
                            padding: "0.15rem 0.5rem",
                            borderRadius: "9999px",
                            backgroundColor: doc.isVisibleToClient ? "rgba(0, 196, 140, 0.12)" : "rgba(100, 116, 139, 0.12)",
                            color: doc.isVisibleToClient ? "#00C48C" : "#64748B",
                          }}
                        >
                          {doc.isVisibleToClient ? "✓ Visible al cliente" : "🔒 Solo uso interno"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Barra de Acciones del Documento */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #F1F5F9", paddingTop: "0.75rem" }}>
                    <div style={{ display: "flex", gap: "0.35rem" }}>
                      <button
                        type="button"
                        onClick={() => setSelectedDocForEdit(doc)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#64748B",
                          cursor: "pointer",
                          padding: "0.3rem",
                          borderRadius: "6px",
                          display: "inline-flex",
                          alignItems: "center",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          gap: "0.25rem",
                        }}
                        title="Editar documento"
                      >
                        <Edit3 size={14} /> Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`¿Estás seguro de que deseas eliminar "${doc.title}"?`)) {
                            deleteClientDocument(projectId, doc.id);
                          }
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#EF4444",
                          cursor: "pointer",
                          padding: "0.3rem",
                          borderRadius: "6px",
                          display: "inline-flex",
                          alignItems: "center",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          gap: "0.25rem",
                        }}
                        title="Eliminar documento"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div style={{ display: "flex", gap: "0.4rem" }}>
                      <button
                        type="button"
                        onClick={() => {
                          const docUrl = doc.url;
                          if (docUrl) {
                            if (docUrl.startsWith("data:") || docUrl.startsWith("http") || docUrl.startsWith("blob:")) {
                              const newTab = window.open();
                              if (newTab) {
                                if (docUrl.startsWith("data:image")) {
                                  newTab.document.write(`<img src="${docUrl}" style="max-width:100%;" />`);
                                } else if (docUrl.startsWith("data:application/pdf")) {
                                  newTab.document.write(`<iframe src="${docUrl}" style="width:100%; height:100vh; border:none;"></iframe>`);
                                } else {
                                  newTab.location.href = docUrl;
                                }
                              }
                            } else {
                              window.open(docUrl, "_blank");
                            }
                          } else {
                            setSelectedDocForView(doc);
                          }
                        }}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.3rem",
                          backgroundColor: "rgba(31, 54, 82, 0.08)",
                          color: "#1F3652",
                          padding: "0.35rem 0.75rem",
                          borderRadius: "9999px",
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          border: "1px solid rgba(31, 54, 82, 0.15)",
                          cursor: "pointer",
                        }}
                        title="Abrir en pestaña nueva"
                      >
                        <ExternalLink size={12} /> Abrir
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const docUrl = doc.url;
                          const ext = doc.fileType ? doc.fileType.toLowerCase() : "pdf";
                          const fileName = `${doc.title}.${ext}`;
                          if (docUrl && (docUrl.startsWith("data:") || docUrl.startsWith("http") || docUrl.startsWith("blob:"))) {
                            const a = document.createElement("a");
                            a.href = docUrl;
                            a.download = fileName;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            showToast("Descarga Completa", `Descargando ${fileName}...`, "success");
                          } else {
                            const blob = new Blob([`Expediente Oficial: ${doc.title}\nCliente: ${rawClient.name}\nUnidad: ${doc.unit}\nFecha: ${doc.uploadDate}\nNotas: ${doc.notes || ""}`], { type: "text/plain" });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = `${doc.title}.txt`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                            showToast("Descarga Completa", `Descargando ${doc.title}...`, "success");
                          }
                        }}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.3rem",
                          backgroundColor: "#1B3047",
                          color: "#FFFFFF",
                          padding: "0.35rem 0.75rem",
                          borderRadius: "9999px",
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          border: "none",
                          cursor: "pointer",
                        }}
                        title="Descargar archivo"
                      >
                        <Download size={12} /> PDF
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* MODAL 1: REGISTRAR PAGO (REDISEÑADO, ELEVADO Y OPTIMIZADO)     */}
        {/* ============================================================== */}
        {showRegisterPaymentModal && (
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
                maxWidth: "680px",
                maxHeight: "92vh",
                overflowY: "auto",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                padding: "2rem",
                position: "relative",
              }}
            >
              {/* Header Modal */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#2F80ED", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Gestión de Cobranza & SPEI
                    </span>
                    <span style={{ fontSize: "0.7rem", backgroundColor: "#F1F5F9", color: "#1F3652", padding: "0.15rem 0.55rem", borderRadius: "9999px", fontWeight: 700 }}>
                      Unidad {selectedUnit}
                    </span>
                    {isCoOwned && (
                      <span style={{ fontSize: "0.7rem", backgroundColor: "#EFF6FF", color: "#2F80ED", padding: "0.15rem 0.55rem", borderRadius: "9999px", fontWeight: 700 }}>
                        Copropiedad ({currentUnitObj.ownershipPct}%)
                      </span>
                    )}
                  </div>
                  <h2 style={{ fontSize: "1.45rem", fontWeight: 800, color: "#1F3652", margin: 0 }}>
                    Registrar Abono a Unidad
                  </h2>
                  <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.82rem", color: "#64748B" }}>
                    Titular: <strong>{rawClient.name}</strong> ({rawClient.email})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRegisterPaymentModal(false)}
                  style={{ background: "#F1F5F9", border: "none", color: "#64748B", cursor: "pointer", width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSavePayment}>
                {/* 1. SECCIÓN RESUMEN FINANCIERO DE LA UNIDAD */}
                <div style={{ backgroundColor: "#F8FAFC", borderRadius: "1rem", padding: "1.15rem", border: "1px solid #E2E8F0", marginBottom: "1.25rem" }}>
                  
                  {/* Selector de Unidad (si tiene varias) */}
                  {rawClient.ownedUnits.length > 1 && (
                    <div style={{ marginBottom: "1rem" }}>
                      <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1F3652", display: "flex", alignItems: "center", gap: "0.35rem", marginBottom: "0.35rem" }}>
                        <Building2 size={15} color="#2F80ED" /> Unidad a aplicar pago:
                      </label>
                      <select
                        value={selectedUnit}
                        onChange={(e) => handleSelectUnit(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "0.65rem 0.85rem",
                          borderRadius: "0.6rem",
                          border: "1px solid #CBD5E1",
                          fontSize: "0.85rem",
                          backgroundColor: "#FFFFFF",
                          color: "#1F3652",
                          fontWeight: 600,
                        }}
                      >
                        {rawClient.ownedUnits.map((u) => (
                          <option key={u.unit} value={u.unit}>
                            {project.name} / {u.unit} {u.ownershipPct < 100 ? `(Copropiedad ${u.ownershipPct}%)` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Grid de Métricas Reales */}
                  <div style={{ display: "grid", gridTemplateColumns: baseCalculatedMoratorio > 0 ? "repeat(5, 1fr)" : "repeat(4, 1fr)", gap: "0.65rem", fontSize: "0.8rem" }}>
                    <div style={{ backgroundColor: "#FFFFFF", padding: "0.65rem", borderRadius: "0.6rem", border: "1px solid #E2E8F0" }}>
                      <span style={{ fontSize: "0.7rem", color: "#64748B", display: "block", marginBottom: "0.15rem" }}>Total Venta</span>
                      <strong style={{ fontSize: "0.9rem", color: "#1F3652" }}>{formatMoney(totalAPagar)}</strong>
                    </div>

                    <div style={{ backgroundColor: "#FFFFFF", padding: "0.65rem", borderRadius: "0.6rem", border: "1px solid #E2E8F0" }}>
                      <span style={{ fontSize: "0.7rem", color: "#64748B", display: "block", marginBottom: "0.15rem" }}>Total Cobrado</span>
                      <strong style={{ fontSize: "0.9rem", color: "#00C48C" }}>{formatMoney(totalCobradoTotal)}</strong>
                      {totalMoratorioPagado > 0 && (
                        <span style={{ fontSize: "0.65rem", color: "#D97706", display: "block", marginTop: "0.1rem" }}>
                          (Int: +{formatMoney(totalMoratorioPagado)})
                        </span>
                      )}
                    </div>

                    <div style={{ backgroundColor: "#FFFFFF", padding: "0.65rem", borderRadius: "0.6rem", border: "1px solid #E2E8F0" }}>
                      <span style={{ fontSize: "0.7rem", color: "#64748B", display: "block", marginBottom: "0.15rem" }}>Saldo Pendiente</span>
                      <strong style={{ fontSize: "0.9rem", color: "#2F80ED" }}>{formatMoney(totalPendiente)}</strong>
                    </div>

                    {baseCalculatedMoratorio > 0 && (
                      <div style={{ backgroundColor: "#FFFBEB", padding: "0.65rem", borderRadius: "0.6rem", border: "1px solid #FDE68A" }}>
                        <span style={{ fontSize: "0.7rem", color: "#92400E", display: "block", marginBottom: "0.15rem", fontWeight: 700 }}>Interés Moratorio</span>
                        <strong style={{ fontSize: "0.9rem", color: "#D97706" }}>{formatMoney(baseCalculatedMoratorio)}</strong>
                      </div>
                    )}

                    <div style={{ backgroundColor: "#FFFFFF", padding: "0.65rem", borderRadius: "0.6rem", border: "1px solid #E2E8F0" }}>
                      <span style={{ fontSize: "0.7rem", color: "#64748B", display: "block", marginBottom: "0.15rem" }}>Próxima Cuota</span>
                      <strong style={{ fontSize: "0.9rem", color: "#1F3652" }}>{formatMoney(nextPaymentItem?.montoPendiente || 0)}</strong>
                    </div>
                  </div>
                </div>

                {/* 2. GESTIÓN DE INTERESES MORATORIOS (Cobro o Condonación) */}
                {baseCalculatedMoratorio > 0 && (
                  <div
                    style={{
                      backgroundColor: "#FFFBEB",
                      borderRadius: "1rem",
                      padding: "1.15rem",
                      border: "1px solid #FCD34D",
                      marginBottom: "1.25rem",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.75rem", marginBottom: "0.85rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <div style={{ backgroundColor: "#FEF3C7", padding: "0.45rem", borderRadius: "0.5rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <AlertTriangle size={18} color="#D97706" />
                        </div>
                        <div>
                          <strong style={{ fontSize: "0.88rem", color: "#92400E", display: "block" }}>
                            Intereses Moratorios Devengados: {formatMoney(baseCalculatedMoratorio)}
                          </strong>
                          <span style={{ fontSize: "0.74rem", color: "#78350F" }}>
                            Esta unidad cuenta con cuotas vencidas. Elige cómo gestionar los intereses en esta operación:
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Selector de Acción de Moratorios */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.6rem", marginBottom: "0.85rem" }}>
                      <button
                        type="button"
                        onClick={() => setPaymentForm({ ...paymentForm, moratoryAction: "full" })}
                        style={{
                          padding: "0.65rem 0.5rem",
                          borderRadius: "0.6rem",
                          border: paymentForm.moratoryAction === "full" ? "2px solid #D97706" : "1px solid #FDE68A",
                          backgroundColor: paymentForm.moratoryAction === "full" ? "#FEF3C7" : "#FFFFFF",
                          color: paymentForm.moratoryAction === "full" ? "#92400E" : "#78350F",
                          fontWeight: 700,
                          fontSize: "0.76rem",
                          cursor: "pointer",
                          textAlign: "center",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <div>Cobrar 100%</div>
                        <div style={{ fontSize: "0.7rem", fontWeight: 500, marginTop: "0.15rem", color: "#B45309" }}>
                          +{formatMoney(baseCalculatedMoratorio)}
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentForm({ ...paymentForm, moratoryAction: "waive" })}
                        style={{
                          padding: "0.65rem 0.5rem",
                          borderRadius: "0.6rem",
                          border: paymentForm.moratoryAction === "waive" ? "2px solid #00C48C" : "1px solid #FDE68A",
                          backgroundColor: paymentForm.moratoryAction === "waive" ? "#ECFDF5" : "#FFFFFF",
                          color: paymentForm.moratoryAction === "waive" ? "#065F46" : "#78350F",
                          fontWeight: 700,
                          fontSize: "0.76rem",
                          cursor: "pointer",
                          textAlign: "center",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <div>Perdonar / Condonar</div>
                        <div style={{ fontSize: "0.7rem", fontWeight: 500, marginTop: "0.15rem", color: "#059669" }}>
                          $0 a cobrar (100% Condonado)
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentForm({ ...paymentForm, moratoryAction: "partial" })}
                        style={{
                          padding: "0.65rem 0.5rem",
                          borderRadius: "0.6rem",
                          border: paymentForm.moratoryAction === "partial" ? "2px solid #2F80ED" : "1px solid #FDE68A",
                          backgroundColor: paymentForm.moratoryAction === "partial" ? "#EFF6FF" : "#FFFFFF",
                          color: paymentForm.moratoryAction === "partial" ? "#1E40AF" : "#78350F",
                          fontWeight: 700,
                          fontSize: "0.76rem",
                          cursor: "pointer",
                          textAlign: "center",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <div>Condonar Parcial</div>
                        <div style={{ fontSize: "0.7rem", fontWeight: 500, marginTop: "0.15rem", color: "#2563EB" }}>
                          {paymentForm.waivePct}% condonado
                        </div>
                      </button>
                    </div>

                    {/* Condonación parcial slider / selector */}
                    {paymentForm.moratoryAction === "partial" && (
                      <div style={{ backgroundColor: "#FFFFFF", padding: "0.75rem", borderRadius: "0.55rem", border: "1px solid #E2E8F0", marginBottom: "0.75rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                          <span style={{ fontSize: "0.75rem", color: "#1F3652", fontWeight: 600 }}>Porcentaje a condonar:</span>
                          <strong style={{ fontSize: "0.82rem", color: "#2F80ED" }}>{paymentForm.waivePct}%</strong>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="90"
                          step="5"
                          value={paymentForm.waivePct}
                          onChange={(e) => setPaymentForm({ ...paymentForm, waivePct: Number(e.target.value) })}
                          style={{ width: "100%", accentColor: "#2F80ED", cursor: "pointer" }}
                        />
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "#64748B", marginTop: "0.35rem" }}>
                          <span>Monto Condonado: <strong style={{ color: "#059669" }}>{formatMoney(Math.round(baseCalculatedMoratorio * (paymentForm.waivePct / 100)))}</strong></span>
                          <span>Monto a Cobrar: <strong style={{ color: "#D97706" }}>{formatMoney(effectiveMoratoryToCharge)}</strong></span>
                        </div>
                      </div>
                    )}

                    {/* Campo de Motivo de Condonación */}
                    {(paymentForm.moratoryAction === "waive" || paymentForm.moratoryAction === "partial") && (
                      <div>
                        <label style={{ fontSize: "0.74rem", fontWeight: 700, color: "#78350F", display: "block", marginBottom: "0.25rem" }}>
                          Motivo de Condonación / Acuerdo Comercial:
                        </label>
                        <input
                          type="text"
                          value={paymentForm.waiveReason}
                          onChange={(e) => setPaymentForm({ ...paymentForm, waiveReason: e.target.value })}
                          placeholder="Ej. Acuerdo comercial por pago en una sola exhibición"
                          style={{
                            width: "100%",
                            padding: "0.55rem 0.75rem",
                            borderRadius: "0.5rem",
                            border: "1px solid #CBD5E1",
                            fontSize: "0.8rem",
                            backgroundColor: "#FFFFFF",
                            color: "#1F3652",
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* 3. CAMPO MONTO A RECIBIR */}
                <div style={{ marginBottom: "1.25rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.45rem" }}>
                    <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "#1F3652" }}>
                      Monto a Aplicar a Cuotas / Capital *
                    </label>
                    <div style={{ display: "flex", gap: "0.4rem" }}>
                      {nextPaymentItem && nextPaymentItem.montoPendiente > 0 && (
                        <button
                          type="button"
                          onClick={() => setPaymentForm({ ...paymentForm, amountReceived: nextPaymentItem.montoPendiente })}
                          style={{
                            fontSize: "0.72rem",
                            padding: "0.2rem 0.55rem",
                            borderRadius: "9999px",
                            border: "1px solid #BFDBFE",
                            backgroundColor: "#EFF6FF",
                            color: "#1D4ED8",
                            cursor: "pointer",
                            fontWeight: 600,
                          }}
                        >
                          Próxima cuota ({formatMoney(nextPaymentItem.montoPendiente)})
                        </button>
                      )}
                      {totalPendiente > 0 && (
                        <button
                          type="button"
                          onClick={() => setPaymentForm({ ...paymentForm, amountReceived: totalPendiente })}
                          style={{
                            fontSize: "0.72rem",
                            padding: "0.2rem 0.55rem",
                            borderRadius: "9999px",
                            border: "1px solid #BBF7D0",
                            backgroundColor: "#F0FDF4",
                            color: "#166534",
                            cursor: "pointer",
                            fontWeight: 600,
                          }}
                        >
                          Liquidar saldo ({formatMoney(totalPendiente)})
                        </button>
                      )}
                    </div>
                  </div>

                  <CurrencyInput
                    value={paymentForm.amountReceived}
                    onChange={(val) => setPaymentForm({ ...paymentForm, amountReceived: val })}
                    currencySymbol="$"
                    placeholder="0.00"
                    required
                  />
                </div>

                {/* 4. SIMULADOR DE CASCADA EN TIEMPO REAL */}
                {cascadePreview.length > 0 && (
                  <div
                    style={{
                      backgroundColor: "#F0FDF4",
                      borderRadius: "0.85rem",
                      padding: "1rem",
                      border: "1px solid #BBF7D0",
                      marginBottom: "1.25rem",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", marginBottom: "0.65rem" }}>
                      <Sparkles size={16} color="#166534" />
                      <strong style={{ fontSize: "0.82rem", color: "#166534" }}>
                        Distribución en cascada del abono (orden cronológico):
                      </strong>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem", maxHeight: "160px", overflowY: "auto" }}>
                      {cascadePreview.map((item, idx) => {
                        const isMoratory = item.type === "moratory";
                        return (
                          <div
                            key={item.id || idx}
                            style={{
                              backgroundColor: isMoratory ? "#FFFBEB" : "#FFFFFF",
                              borderRadius: "0.55rem",
                              padding: "0.55rem 0.75rem",
                              border: isMoratory ? "1px solid #FDE68A" : "1px solid #DCFCE7",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              fontSize: "0.78rem",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                              <span
                                style={{
                                  fontSize: "0.68rem",
                                  fontWeight: 800,
                                  padding: "0.15rem 0.45rem",
                                  borderRadius: "0.3rem",
                                  backgroundColor: isMoratory ? "#FEF3C7" : "rgba(0, 196, 140, 0.12)",
                                  color: isMoratory ? "#92400E" : "#00A877",
                                }}
                              >
                                {isMoratory ? "INTERÉS" : "CAPITAL"}
                              </span>
                              <div>
                                <span style={{ fontWeight: 700, color: "#1F3652" }}>{item.concept}</span>
                                <span style={{ color: "#64748B", marginLeft: "0.35rem", fontSize: "0.72rem" }}>({item.date})</span>
                              </div>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                              <span style={{ color: isMoratory ? "#D97706" : "#166534", fontWeight: 700 }}>
                                + {formatMoney(item.amountToApply)}
                              </span>
                              {item.willFullyPay ? (
                                <span style={{ fontSize: "0.7rem", backgroundColor: isMoratory ? "#FEF3C7" : "#DCFCE7", color: isMoratory ? "#92400E" : "#166534", padding: "0.1rem 0.45rem", borderRadius: "9999px", fontWeight: 700 }}>
                                  {isMoratory ? "Interés Cubierto 100%" : "Liquidada 100%"}
                                </span>
                              ) : (
                                <span style={{ fontSize: "0.7rem", backgroundColor: "#FEF3C7", color: "#92400E", padding: "0.1rem 0.45rem", borderRadius: "9999px", fontWeight: 700 }}>
                                  Saldo restante: {formatMoney(item.resultingPending)}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 5. MÉTODO Y FECHA DE PAGO */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem", marginBottom: "1.25rem" }}>
                  <div>
                    <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1F3652", display: "block", marginBottom: "0.35rem" }}>
                      Método de Pago *
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
                        fontWeight: 600,
                      }}
                    >
                      <option value="Transferencia SPEI">Transferencia SPEI</option>
                      <option value="SPEI">SPEI Interbancario</option>
                      <option value="Cheque de Caja">Cheque de Caja</option>
                      <option value="Efectivo">Efectivo / Caja</option>
                      <option value="Tarjeta de Débito / Crédito">Tarjeta de Débito / Crédito</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1F3652", display: "block", marginBottom: "0.35rem" }}>
                      Fecha de Depósito *
                    </label>
                    <DevioDatePicker
                      value={paymentForm.paymentDate}
                      onChange={(val) => setPaymentForm({ ...paymentForm, paymentDate: val })}
                      placeholder="DD/MM/AAAA"
                    />
                  </div>
                </div>

                {/* 6. REFERENCIA Y NOTAS */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem", marginBottom: "1.25rem" }}>
                  <div>
                    <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1F3652", display: "block", marginBottom: "0.35rem" }}>
                      Referencia / Folio Bancario
                    </label>
                    <input
                      type="text"
                      value={paymentForm.reference}
                      onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                      placeholder="Ej. SPEI-84920491"
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

                  <div>
                    <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1F3652", display: "block", marginBottom: "0.35rem" }}>
                      Concepto / Notas Adicionales
                    </label>
                    <input
                      type="text"
                      value={paymentForm.notes}
                      onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                      placeholder="Ej. Abono mensualidad"
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

                {/* 7. SUBIR COMPROBANTE SPEI */}
                <input
                  type="file"
                  ref={paymentVoucherInputRef}
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setPaymentForm((prev) => ({ ...prev, voucherName: file.name }));
                      showToast("Comprobante Adjunto", `Archivo "${file.name}" seleccionado con éxito.`);
                    }
                  }}
                  style={{ display: "none" }}
                />
                <div style={{ marginBottom: "1.25rem" }}>
                  <button
                    type="button"
                    onClick={() => paymentVoucherInputRef.current?.click()}
                    style={{
                      width: "100%",
                      padding: "0.75rem 1rem",
                      borderRadius: "0.65rem",
                      border: paymentForm.voucherName ? "1px solid #00C48C" : "1px dashed #2F80ED",
                      backgroundColor: paymentForm.voucherName ? "#F0FDF4" : "#F0F7FF",
                      color: paymentForm.voucherName ? "#166534" : "#1F3652",
                      fontSize: "0.82rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    {paymentForm.voucherName ? (
                      <>
                        <CheckCircle2 size={18} color="#00C48C" />
                        Comprobante adjunto: {paymentForm.voucherName}
                      </>
                    ) : (
                      <>
                        <UploadCloud size={18} color="#2F80ED" />
                        Adjuntar comprobante bancario SPEI (PDF / Imagen)
                      </>
                    )}
                  </button>
                </div>

                {/* 8. CHECKBOX ENVIAR CORREO */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1.25rem" }}>
                  <input
                    type="checkbox"
                    id="sendEmailCheck"
                    checked={paymentForm.sendEmail}
                    onChange={(e) => setPaymentForm({ ...paymentForm, sendEmail: e.target.checked })}
                    style={{ width: "16px", height: "16px", accentColor: "#1B3047", cursor: "pointer" }}
                  />
                  <label htmlFor="sendEmailCheck" style={{ fontSize: "0.82rem", color: "#1F3652", fontWeight: 600, cursor: "pointer" }}>
                    Enviar recibo oficial de pago por correo al cliente ({rawClient.email})
                  </label>
                </div>

                {/* 9. RESUMEN TOTAL DE LA TRANSACCIÓN */}
                <div
                  style={{
                    backgroundColor: "#F8FAFC",
                    borderRadius: "0.85rem",
                    padding: "0.9rem 1.15rem",
                    border: "1px solid #E2E8F0",
                    marginBottom: "1.25rem",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "#64748B", marginBottom: "0.3rem" }}>
                    <span>Abono a capital / cuotas programadas:</span>
                    <strong style={{ color: "#1F3652" }}>{formatMoney(paymentForm.amountReceived)}</strong>
                  </div>
                  {baseCalculatedMoratorio > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "#64748B", marginBottom: "0.3rem" }}>
                      <span>
                        Intereses moratorios {paymentForm.moratoryAction === "waive" ? "(100% Condonados)" : paymentForm.moratoryAction === "partial" ? `(${paymentForm.waivePct}% Condonados)` : "(Cobrados)"}:
                      </span>
                      <strong style={{ color: effectiveMoratoryToCharge > 0 ? "#E05345" : "#059669" }}>
                        {effectiveMoratoryToCharge > 0 ? `+ ${formatMoney(effectiveMoratoryToCharge)}` : "$0 (Condonado)"}
                      </strong>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "1rem", fontWeight: 800, color: "#1F3652", borderTop: "1px dashed #CBD5E1", paddingTop: "0.5rem", marginTop: "0.4rem" }}>
                    <span>Total Recibido / Registrado:</span>
                    <span style={{ color: "#00A877", fontSize: "1.15rem" }}>
                      {formatMoney(paymentForm.amountReceived + effectiveMoratoryToCharge)}
                    </span>
                  </div>
                </div>

                {/* BOTONES DE SUBMIT */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                  <button
                    type="button"
                    onClick={() => setShowRegisterPaymentModal(false)}
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
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      border: "none",
                      cursor: "pointer",
                      boxShadow: "0 4px 12px rgba(27, 48, 71, 0.2)",
                    }}
                  >
                    <CreditCard size={17} /> Confirmar y Registrar Pago ({formatMoney(paymentForm.amountReceived + effectiveMoratoryToCharge)})
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* MODAL: EDITAR / MODIFICAR PAGO EXISTENTE (CON ADVERTENCIA)     */}
        {/* ============================================================== */}
        {showEditPaymentModal && editingPayment && (
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
                    Modificar Registro de Pago ({editingPayment.reciboFolio})
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEditPaymentModal(false)}
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
                  <strong>Advertencia de Impacto Financiero:</strong> Modificar una fecha o monto de pago alterará de inmediato el calendario de amortización, el saldo insoluto pendiente y los intereses moratorios calculados para la unidad {editingPayment.unit}.
                </div>
              </div>

              <form onSubmit={handleSaveEditPayment}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                  <div>
                    <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1F3652", display: "block", marginBottom: "0.35rem" }}>
                      Monto Pagado / Cobrado ($ MXN)
                    </label>
                    <input
                      type="number"
                      value={editPaymentForm.monto}
                      onChange={(e) => setEditPaymentForm({ ...editPaymentForm, monto: Number(e.target.value) })}
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
                    <input
                      type="text"
                      value={editPaymentForm.fechaPago}
                      onChange={(e) => setEditPaymentForm({ ...editPaymentForm, fechaPago: e.target.value })}
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
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                  <div>
                    <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1F3652", display: "block", marginBottom: "0.35rem" }}>
                      Método de Pago
                    </label>
                    <select
                      value={editPaymentForm.metodoPago}
                      onChange={(e) => setEditPaymentForm({ ...editPaymentForm, metodoPago: e.target.value })}
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
                      value={editPaymentForm.reciboFolio}
                      onChange={(e) => setEditPaymentForm({ ...editPaymentForm, reciboFolio: e.target.value })}
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
                    value={editPaymentForm.editReason}
                    onChange={(e) => setEditPaymentForm({ ...editPaymentForm, editReason: e.target.value })}
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
                    onClick={() => setShowEditPaymentModal(false)}
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
        {/* MODAL: MODIFICAR CUOTA PROGRAMADA (EFECTO CASCADA)             */}
        {/* ============================================================== */}
        {showEditInstallmentModal && editingInstallment && (
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
                    Unidad {editingInstallment.unit} • {editingInstallment.concept || "Cuota"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEditInstallmentModal(false)}
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

              <form onSubmit={handleSaveEditInstallment}>
                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1F3652", display: "block", marginBottom: "0.35rem" }}>
                    Concepto de la Cuota
                  </label>
                  <input
                    type="text"
                    value={editInstallmentForm.concept}
                    onChange={(e) => setEditInstallmentForm({ ...editInstallmentForm, concept: e.target.value })}
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
                      value={editInstallmentForm.scheduledAmount}
                      onChange={(e) => setEditInstallmentForm({ ...editInstallmentForm, scheduledAmount: Number(e.target.value) })}
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
                    <input
                      type="text"
                      value={editInstallmentForm.scheduledDate}
                      onChange={(e) => setEditInstallmentForm({ ...editInstallmentForm, scheduledDate: e.target.value })}
                      placeholder="Ej. 17 Oct 2026"
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
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                  <button
                    type="button"
                    onClick={() => setShowEditInstallmentModal(false)}
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

        {/* MODAL: CARGA MASIVA DE PAGOS POR EXCEL */}
        {showUploadPaymentsModal && project && (
          <UploadPaymentsModal
            isOpen={showUploadPaymentsModal}
            onClose={() => setShowUploadPaymentsModal(false)}
            project={project}
            defaultUnit={selectedUnit}
          />
        )}

        {/* MODAL: EDITAR VENTA Y ADICIONALES */}
        {showEditSaleModal && currentSale && project && (
          <EditSaleModal
            isOpen={showEditSaleModal}
            onClose={() => setShowEditSaleModal(false)}
            project={project}
            sale={currentSale}
          />
        )}

        {/* ============================================================== */}
        {/* MODAL 2: SUBIR DOCUMENTO                                       */}
        {/* ============================================================== */}
        {showUploadDocModal && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(15, 23, 42, 0.6)",
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
                maxWidth: "580px",
                maxHeight: "90vh",
                overflowY: "auto",
                boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
                padding: "2rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#1F3652", margin: 0 }}>
                  Documento
                </h2>
                <button
                  type="button"
                  onClick={() => setShowUploadDocModal(false)}
                  style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer" }}
                >
                  <X size={20} />
                </button>
              </div>

              <p style={{ fontSize: "0.82rem", color: "#64748B", margin: "0 0 1.5rem" }}>
                Agrega contratos, planos, fichas técnicas u otros archivos importantes. Así podrás tener todo organizado desde el inicio.
              </p>

              <form onSubmit={handleSaveDocument}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
                  <div>
                    <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1F3652", display: "block", marginBottom: "0.35rem" }}>
                      Nombre del documento
                    </label>
                    <input
                      type="text"
                      placeholder="Contrato Tipo A"
                      value={docForm.docName}
                      onChange={(e) => setDocForm({ ...docForm, docName: e.target.value })}
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

                  <div>
                    <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1F3652", display: "block", marginBottom: "0.35rem" }}>
                      Unidad
                    </label>
                    <select
                      value={docForm.unit}
                      onChange={(e) => setDocForm({ ...docForm, unit: e.target.value })}
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
                      {rawClient.ownedUnits.map((u) => (
                        <option key={u.unit} value={`${project.name} / ${u.unit}`}>
                          {project.name} / {u.unit}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Dropzone Documento Real */}
                <input
                  type="file"
                  ref={clientDocFileInputRef}
                  accept=".pdf,.docx,.doc,.xlsx,.xls,.png,.jpg,.jpeg"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setClientDocUploadedFile(file);
                      if (!docForm.docName.trim()) {
                        setDocForm((prev) => ({ ...prev, docName: file.name.replace(/\.[^/.]+$/, "") }));
                      }
                    }
                  }}
                  style={{ display: "none" }}
                />

                <div style={{ marginBottom: "1.25rem" }}>
                  <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1F3652", display: "block", marginBottom: "0.35rem" }}>
                    Archivo del Documento
                  </label>
                  <div
                    onClick={() => clientDocFileInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setClientDocDragActive(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setClientDocDragActive(false);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setClientDocDragActive(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) {
                        setClientDocUploadedFile(file);
                        if (!docForm.docName.trim()) {
                          setDocForm((prev) => ({ ...prev, docName: file.name.replace(/\.[^/.]+$/, "") }));
                        }
                      }
                    }}
                    style={{
                      border: clientDocDragActive ? "2px dashed #00C48C" : clientDocUploadedFile ? "2px solid #00C48C" : "1.5px dashed #CBD5E1",
                      borderRadius: "0.75rem",
                      padding: "1.5rem 1rem",
                      textAlign: "center",
                      backgroundColor: clientDocDragActive ? "rgba(0, 196, 140, 0.05)" : clientDocUploadedFile ? "#F0FDF4" : "#F8FAFC",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {clientDocUploadedFile ? (
                      <div>
                        <CheckCircle2 size={24} color="#00C48C" style={{ margin: "0 auto 0.4rem" }} />
                        <strong style={{ fontSize: "0.85rem", color: "#1F3652", display: "block" }}>
                          {clientDocUploadedFile.name}
                        </strong>
                        <span style={{ fontSize: "0.75rem", color: "#64748B", display: "block", marginTop: "0.2rem" }}>
                          {clientDocUploadedFile.size > 1024 * 1024
                            ? `${(clientDocUploadedFile.size / (1024 * 1024)).toFixed(1)} MB`
                            : `${Math.round(clientDocUploadedFile.size / 1024)} KB`}
                        </span>
                        <span style={{ fontSize: "0.72rem", color: "#2F80ED", fontWeight: 600, display: "inline-block", marginTop: "0.4rem" }}>
                          Clic para cambiar archivo
                        </span>
                      </div>
                    ) : (
                      <div>
                        <UploadCloud size={26} color="#2F80ED" style={{ margin: "0 auto 0.4rem" }} />
                        <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1F3652", display: "block" }}>
                          Arrastra tu archivo aquí o haz clic para seleccionarlo
                        </span>
                        <span style={{ fontSize: "0.72rem", color: "#94A3B8" }}>
                          Soporta PDF, DOCX, XLSX, PNG, JPG (hasta 50 MB)
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notas Internas */}
                <div style={{ marginBottom: "1.25rem" }}>
                  <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1F3652", display: "block", marginBottom: "0.35rem" }}>
                    Notas Internas
                  </label>
                  <textarea
                    rows={2}
                    value={docForm.internalNotes}
                    onChange={(e) => setDocForm({ ...docForm, internalNotes: e.target.value })}
                    placeholder="Contrato para venta a plazo"
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

                {/* Radio Question: ¿El cliente puede ver este documento? */}
                <div style={{ marginBottom: "1.75rem" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem", marginBottom: "0.75rem" }}>
                    <label style={{ fontSize: "0.9rem", fontWeight: 800, color: "#1F3652" }}>
                      ¿El cliente puede ver este documento?
                    </label>
                    <InfoTooltip
                      title="Visibilidad del Expediente"
                      content="Si activas esta opción, el cliente podrá ver y descargar este documento desde su portal personal de comprador."
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem" }}>
                    <label
                      style={{
                        border: docForm.visibleToClient ? "1.5px solid #1B3047" : "1px solid #E2E8F0",
                        borderRadius: "0.65rem",
                        padding: "0.75rem",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "0.5rem",
                        cursor: "pointer",
                        backgroundColor: docForm.visibleToClient ? "rgba(27, 48, 71, 0.03)" : "#FFFFFF",
                      }}
                    >
                      <input
                        type="radio"
                        name="clientVisibility"
                        checked={docForm.visibleToClient}
                        onChange={() => setDocForm({ ...docForm, visibleToClient: true })}
                        style={{ marginTop: "2px", accentColor: "#1B3047" }}
                      />
                      <span style={{ fontSize: "0.78rem", color: "#1F3652", fontWeight: 600, lineHeight: 1.3 }}>
                        Sí, este documento será visible para el cliente
                      </span>
                    </label>

                    <label
                      style={{
                        border: !docForm.visibleToClient ? "1.5px solid #1B3047" : "1px solid #E2E8F0",
                        borderRadius: "0.65rem",
                        padding: "0.75rem",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "0.5rem",
                        cursor: "pointer",
                        backgroundColor: !docForm.visibleToClient ? "rgba(27, 48, 71, 0.03)" : "#FFFFFF",
                      }}
                    >
                      <input
                        type="radio"
                        name="clientVisibility"
                        checked={!docForm.visibleToClient}
                        onChange={() => setDocForm({ ...docForm, visibleToClient: false })}
                        style={{ marginTop: "2px", accentColor: "#1B3047" }}
                      />
                      <span style={{ fontSize: "0.78rem", color: "#1F3652", fontWeight: 600, lineHeight: 1.3 }}>
                        No, documento de uso interno exclusivo
                      </span>
                    </label>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                  <button
                    type="button"
                    onClick={() => setShowUploadDocModal(false)}
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
                    <Check size={16} /> Guardar Documento
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* MODAL: VISUALIZAR DOCUMENTO DE CLIENTE                          */}
        {/* ============================================================== */}
        {selectedDocForView && (
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
                    {selectedDocForView.title}
                  </h3>
                  <span style={{ fontSize: "0.8rem", color: "#64748B" }}>
                    Unidad {selectedDocForView.unit} • {selectedDocForView.uploadDate} • {selectedDocForView.fileSize || "1.2 MB"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedDocForView(null)}
                  style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer", padding: "4px" }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Vista Previa Card */}
              <div
                style={{
                  border: "1px solid #E2E8F0",
                  borderRadius: "1rem",
                  padding: "2.5rem 1.5rem",
                  textAlign: "center",
                  backgroundColor: "#F8FAFC",
                  marginBottom: "1.5rem",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                <div style={{ width: "56px", height: "56px", borderRadius: "14px", backgroundColor: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <FileText size={32} color="#2F80ED" />
                </div>
                <strong style={{ fontSize: "1.05rem", color: "#1F3652", wordBreak: "break-all" }}>
                  {selectedDocForView.title}.{selectedDocForView.fileType ? selectedDocForView.fileType.toLowerCase() : "pdf"}
                </strong>
                <p style={{ fontSize: "0.85rem", color: "#64748B", margin: 0, maxWidth: "420px" }}>
                  {selectedDocForView.notes || "Documento oficial del expediente del cliente."}
                </p>
                <span
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    padding: "0.2rem 0.6rem",
                    borderRadius: "9999px",
                    backgroundColor: selectedDocForView.isVisibleToClient ? "rgba(0, 196, 140, 0.12)" : "rgba(100, 116, 139, 0.12)",
                    color: selectedDocForView.isVisibleToClient ? "#00C48C" : "#64748B",
                  }}
                >
                  {selectedDocForView.isVisibleToClient ? "✓ Visible al cliente" : "🔒 Solo uso interno"}
                </span>
              </div>

              {/* Botones de Acción */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                <button
                  type="button"
                  onClick={() => {
                    const docUrl = selectedDocForView.url;
                    if (docUrl) {
                      if (docUrl.startsWith("data:") || docUrl.startsWith("http") || docUrl.startsWith("blob:")) {
                        const newTab = window.open();
                        if (newTab) {
                          if (docUrl.startsWith("data:image")) {
                            newTab.document.write(`<img src="${docUrl}" style="max-width:100%;" />`);
                          } else if (docUrl.startsWith("data:application/pdf")) {
                            newTab.document.write(`<iframe src="${docUrl}" style="width:100%; height:100vh; border:none;"></iframe>`);
                          } else {
                            newTab.location.href = docUrl;
                          }
                        }
                      } else {
                        window.open(docUrl, "_blank");
                      }
                    } else {
                      showToast("Vista Previa", `Abriendo ${selectedDocForView.title}...`);
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
                    const docUrl = selectedDocForView.url;
                    const ext = selectedDocForView.fileType ? selectedDocForView.fileType.toLowerCase() : "pdf";
                    const fileName = `${selectedDocForView.title}.${ext}`;
                    if (docUrl && (docUrl.startsWith("data:") || docUrl.startsWith("http") || docUrl.startsWith("blob:"))) {
                      const a = document.createElement("a");
                      a.href = docUrl;
                      a.download = fileName;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      showToast("Descarga Completa", `Descargando ${fileName}...`, "success");
                    } else {
                      const blob = new Blob([`Expediente Oficial: ${selectedDocForView.title}\nCliente: ${rawClient.name}\nUnidad: ${selectedDocForView.unit}\nFecha: ${selectedDocForView.uploadDate}\nNotas: ${selectedDocForView.notes || ""}`], { type: "text/plain" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `${selectedDocForView.title}.txt`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                      showToast("Descarga Completa", `Descargando ${selectedDocForView.title}...`, "success");
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
          </div>
        )}

        {/* ============================================================== */}
        {/* MODAL: EDITAR DOCUMENTO DE CLIENTE                             */}
        {/* ============================================================== */}
        {selectedDocForEdit && (
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
                maxHeight: "92vh",
                overflowY: "auto",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                padding: "2rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <div>
                  <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#1F3652", margin: 0 }}>
                    Editar Documento
                  </h3>
                  <span style={{ fontSize: "0.8rem", color: "#64748B" }}>Actualiza los detalles y permisos del documento</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedDocForEdit(null)}
                  style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer", padding: "4px" }}
                >
                  <X size={20} />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!selectedDocForEdit.title.trim()) {
                    showToast("Campo Requerido", "Por favor ingresa un título para el documento.", "warning");
                    return;
                  }
                  updateClientDocument(projectId, {
                    ...selectedDocForEdit,
                    title: selectedDocForEdit.title,
                    unit: selectedDocForEdit.unit,
                    notes: selectedDocForEdit.notes,
                    isVisibleToClient: selectedDocForEdit.isVisibleToClient,
                  });
                  showToast("Documento Actualizado", `Se guardaron los cambios de "${selectedDocForEdit.title}".`, "success");
                  setSelectedDocForEdit(null);
                }}
              >
                <div style={{ marginBottom: "1.2rem" }}>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#1F3652", marginBottom: "0.4rem" }}>
                    Título del Documento *
                  </label>
                  <input
                    type="text"
                    value={selectedDocForEdit.title}
                    onChange={(e) => setSelectedDocForEdit({ ...selectedDocForEdit, title: e.target.value })}
                    required
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.85rem",
                      borderRadius: "0.5rem",
                      border: "1px solid #CBD5E1",
                      fontSize: "0.85rem",
                      color: "#1F3652",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div style={{ marginBottom: "1.2rem" }}>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#1F3652", marginBottom: "0.4rem" }}>
                    Unidad Asociada
                  </label>
                  <select
                    value={selectedDocForEdit.unit}
                    onChange={(e) => setSelectedDocForEdit({ ...selectedDocForEdit, unit: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.85rem",
                      borderRadius: "0.5rem",
                      border: "1px solid #CBD5E1",
                      fontSize: "0.85rem",
                      color: "#1F3652",
                      outline: "none",
                      backgroundColor: "#FFFFFF",
                      boxSizing: "border-box",
                    }}
                  >
                    {rawClient.ownedUnits.map((u) => (
                      <option key={u.unit} value={u.unit}>Unidad {u.unit} ({u.type})</option>
                    ))}
                    <option value="General">General (Todas las unidades)</option>
                  </select>
                </div>

                <div style={{ marginBottom: "1.2rem" }}>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#1F3652", marginBottom: "0.4rem" }}>
                    Notas / Observaciones
                  </label>
                  <textarea
                    rows={3}
                    value={selectedDocForEdit.notes || ""}
                    onChange={(e) => setSelectedDocForEdit({ ...selectedDocForEdit, notes: e.target.value })}
                    placeholder="Descripción o anotaciones sobre el documento..."
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.85rem",
                      borderRadius: "0.5rem",
                      border: "1px solid #CBD5E1",
                      fontSize: "0.85rem",
                      color: "#1F3652",
                      outline: "none",
                      boxSizing: "border-box",
                      resize: "vertical",
                    }}
                  />
                </div>

                <div style={{ marginBottom: "1.5rem" }}>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#1F3652", marginBottom: "0.5rem" }}>
                    Visibilidad para el Cliente
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                    <label
                      style={{
                        border: selectedDocForEdit.isVisibleToClient ? "1.5px solid #00C48C" : "1px solid #E2E8F0",
                        borderRadius: "0.65rem",
                        padding: "0.75rem",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "0.5rem",
                        cursor: "pointer",
                        backgroundColor: selectedDocForEdit.isVisibleToClient ? "rgba(0, 196, 140, 0.04)" : "#FFFFFF",
                      }}
                    >
                      <input
                        type="radio"
                        name="editClientVisibility"
                        checked={selectedDocForEdit.isVisibleToClient}
                        onChange={() => setSelectedDocForEdit({ ...selectedDocForEdit, isVisibleToClient: true })}
                        style={{ marginTop: "2px", accentColor: "#00C48C" }}
                      />
                      <span style={{ fontSize: "0.78rem", color: "#1F3652", fontWeight: 600, lineHeight: 1.3 }}>
                        Sí, visible en el portal del cliente
                      </span>
                    </label>

                    <label
                      style={{
                        border: !selectedDocForEdit.isVisibleToClient ? "1.5px solid #1B3047" : "1px solid #E2E8F0",
                        borderRadius: "0.65rem",
                        padding: "0.75rem",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "0.5rem",
                        cursor: "pointer",
                        backgroundColor: !selectedDocForEdit.isVisibleToClient ? "rgba(27, 48, 71, 0.03)" : "#FFFFFF",
                      }}
                    >
                      <input
                        type="radio"
                        name="editClientVisibility"
                        checked={!selectedDocForEdit.isVisibleToClient}
                        onChange={() => setSelectedDocForEdit({ ...selectedDocForEdit, isVisibleToClient: false })}
                        style={{ marginTop: "2px", accentColor: "#1B3047" }}
                      />
                      <span style={{ fontSize: "0.78rem", color: "#1F3652", fontWeight: 600, lineHeight: 1.3 }}>
                        No, documento de uso interno exclusivo
                      </span>
                    </label>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                  <button
                    type="button"
                    onClick={() => setSelectedDocForEdit(null)}
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
                    <Check size={16} /> Guardar Cambios
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* MODAL 3: RECIBO OFICIAL DE PAGO (PREVIEW & ABRIR)             */}
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
                maxWidth: "620px",
                maxHeight: "92vh",
                overflowY: "auto",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                padding: "2rem",
              }}
            >
              {/* Encabezado con Logos y Folio */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
                <div>
                  <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#1F3652", margin: 0 }}>
                    Recibo Oficial de Pago
                  </h3>
                  <span style={{ fontSize: "0.8rem", color: "#64748B" }}>Folio: {selectedReceiptForView.reciboFolio || `REC-${Date.now().toString().slice(-6)}`}</span>
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
                    Monto Total Recibido
                  </div>
                  <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#1F3652" }}>
                    {formatMoney(selectedReceiptForView.monto)}
                  </div>
                </div>

                {/* Desglose Capital / Moratorio si aplica */}
                {selectedReceiptForView.moratoryAmount && selectedReceiptForView.moratoryAmount > 0 ? (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem", marginBottom: "1rem" }}>
                    <div style={{ backgroundColor: "#F1F5F9", border: "1px solid #E2E8F0", borderRadius: "0.6rem", padding: "0.6rem 0.85rem" }}>
                      <span style={{ fontSize: "0.72rem", color: "#64748B", fontWeight: 600, display: "block" }}>Abono a Capital:</span>
                      <strong style={{ fontSize: "0.95rem", color: "#1F3652" }}>
                        {formatMoney(selectedReceiptForView.monto - selectedReceiptForView.moratoryAmount)}
                      </strong>
                    </div>
                    <div style={{ backgroundColor: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: "0.6rem", padding: "0.6rem 0.85rem" }}>
                      <span style={{ fontSize: "0.72rem", color: "#92400E", fontWeight: 700, display: "block" }}>Interés Moratorio:</span>
                      <strong style={{ fontSize: "0.95rem", color: "#D97706" }}>
                        + {formatMoney(selectedReceiptForView.moratoryAmount)}
                      </strong>
                    </div>
                  </div>
                ) : null}

                {/* Datos de la transacción */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", fontSize: "0.82rem" }}>
                  <div>
                    <span style={{ color: "#64748B", display: "block", fontSize: "0.75rem" }}>Proyecto / Unidad:</span>
                    <strong style={{ color: "#1F3652" }}>{project.name} • {selectedReceiptForView.unit}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748B", display: "block", fontSize: "0.75rem" }}>Cliente / Pagador:</span>
                    <strong style={{ color: "#1F3652" }}>{rawClient.name}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748B", display: "block", fontSize: "0.75rem" }}>Fecha de Emisión / Pago:</span>
                    <strong style={{ color: "#1F3652" }}>{selectedReceiptForView.fechaPago}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748B", display: "block", fontSize: "0.75rem" }}>Método de Pago:</span>
                    <strong style={{ color: "#1F3652" }}>{selectedReceiptForView.metodoPago || "Transferencia SPEI"}</strong>
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
                      folio: selectedReceiptForView.reciboFolio || `REC-${Date.now().toString().slice(-6)}`,
                      projectName: project?.name || "Proyecto Inmobiliario",
                      unitNumber: selectedReceiptForView.unit,
                      clientName: rawClient.name,
                      paymentMethod: selectedReceiptForView.metodoPago || "Transferencia SPEI",
                      totalAmount: selectedReceiptForView.monto,
                      capitalAmount: selectedReceiptForView.moratoryAmount
                        ? selectedReceiptForView.monto - selectedReceiptForView.moratoryAmount
                        : selectedReceiptForView.monto,
                      interestAmount: selectedReceiptForView.moratoryAmount || 0,
                      emissionDate: selectedReceiptForView.fechaPago,
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
                        folio: selectedReceiptForView.reciboFolio || `REC-${Date.now().toString().slice(-6)}`,
                        projectName: project?.name || "Proyecto Inmobiliario",
                        unitNumber: selectedReceiptForView.unit,
                        clientName: rawClient.name,
                        paymentMethod: selectedReceiptForView.metodoPago || "Transferencia SPEI",
                        totalAmount: selectedReceiptForView.monto,
                        capitalAmount: selectedReceiptForView.moratoryAmount
                          ? selectedReceiptForView.monto - selectedReceiptForView.moratoryAmount
                          : selectedReceiptForView.monto,
                        interestAmount: selectedReceiptForView.moratoryAmount || 0,
                        emissionDate: selectedReceiptForView.fechaPago,
                        developerLogoUrl: devLogoUrl,
                        projectLogoUrl: projLogoUrl,
                        developerName: developerName || "Desarrolladora Inmobiliaria",
                      });
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
        {/* MODAL 4: COMPROBANTE BANCARIO SPEI (SUBIR O ABRIR)             */}
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
                  <span style={{ fontSize: "0.8rem", color: "#64748B" }}>
                    Unidad {selectedVoucherForView.unit} • {selectedVoucherForView.fechaPago || (selectedVoucherForView as any).paymentDate || "Fecha de pago"}
                  </span>
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
                          Monto transferido: <strong>{formatMoney(selectedVoucherForView.monto || (selectedVoucherForView as any).paidAmount || 0)}</strong>
                          {selectedVoucherForView.reference ? ` • Ref: ${selectedVoucherForView.reference}` : ""}
                        </span>
                      </div>

                      {/* Botones de Acción cuando SÍ hay comprobante */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <input
                            id="voucher-replace-file-input-client"
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
                              const input = document.getElementById("voucher-replace-file-input-client");
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
                        const input = document.getElementById("voucher-file-input-client");
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
                        id="voucher-file-input-client"
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
                          const input = document.getElementById("voucher-file-input-client");
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

        {/* ------------------------------------------------------------------ */}
        {/* SUB-MODAL: DESGLOSE DE ABONOS Y RECIBOS DE CUOTA                   */}
        {/* ------------------------------------------------------------------ */}
        {selectedCuotaForAbonos && (
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
                      Unidad {selectedCuotaForAbonos.unit}
                    </span>
                    <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#1F3652", margin: 0 }}>
                      Desglose de Cuota: {selectedCuotaForAbonos.fechaProgramada}
                    </h3>
                  </div>
                  <span style={{ fontSize: "0.8rem", color: "#64748B" }}>
                    Plan: {selectedCuotaForAbonos.planPago} • Estatus: <strong>{selectedCuotaForAbonos.status}</strong>
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedCuotaForAbonos(null)}
                  style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer" }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Tarjeta Resumen Financiero de la Cuota */}
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
                    {formatMoney(selectedCuotaForAbonos.montoProgramado)}
                  </strong>
                </div>
                <div>
                  <span style={{ fontSize: "0.72rem", color: "#64748B", display: "block" }}>Monto Abonado</span>
                  <strong style={{ fontSize: "1rem", color: selectedCuotaForAbonos.montoPagado > 0 ? "#00C48C" : "#64748B" }}>
                    {formatMoney(selectedCuotaForAbonos.montoPagado)}
                  </strong>
                </div>
                <div>
                  <span style={{ fontSize: "0.72rem", color: "#64748B", display: "block" }}>Saldo Pendiente</span>
                  <strong style={{ fontSize: "1rem", color: selectedCuotaForAbonos.montoPendiente > 0 ? "#1F3652" : "#00C48C" }}>
                    {formatMoney(selectedCuotaForAbonos.montoPendiente)}
                  </strong>
                </div>
              </div>

              {/* Lista de Abonos Realizados */}
              <h4 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#1F3652", marginBottom: "0.75rem" }}>
                Historial de Abonos y Transacciones ({cuotaSpecificPayments.length})
              </h4>

              {cuotaSpecificPayments.length === 0 ? (
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
                  {cuotaSpecificPayments.map((pay) => (
                    <div
                      key={pay.id}
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
                            {pay.reciboFolio}
                          </span>
                          <strong style={{ fontSize: "0.9rem", color: "#1F3652" }}>
                            {formatMoney(pay.monto)}
                          </strong>
                        </div>
                        <span style={{ fontSize: "0.75rem", color: "#64748B", display: "block", marginTop: "0.2rem" }}>
                          Fecha de cobro: {pay.fechaPago} • Método: {pay.metodoPago}
                        </span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedReceiptForView(pay);
                            setSelectedCuotaForAbonos(null);
                          }}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.35rem",
                            padding: "0.4rem 0.8rem",
                            borderRadius: "0.45rem",
                            border: "1px solid #CBD5E1",
                            backgroundColor: "#FFFFFF",
                            color: "#1F3652",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          <Printer size={13} color="#2F80ED" /> Recibo
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedVoucherForView(pay);
                            setSelectedCuotaForAbonos(null);
                          }}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.35rem",
                            padding: "0.4rem 0.8rem",
                            borderRadius: "0.45rem",
                            border: "1px solid rgba(47, 128, 237, 0.25)",
                            backgroundColor: "rgba(47, 128, 237, 0.08)",
                            color: "#2F80ED",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          <FileText size={13} /> Comprobante
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCuotaForAbonos(null);
                    setShowRegisterPaymentModal(true);
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

                <button
                  type="button"
                  onClick={() => setSelectedCuotaForAbonos(null)}
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

      </main>
    </AppLayout>
  );
}

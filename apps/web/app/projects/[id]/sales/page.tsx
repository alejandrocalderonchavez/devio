"use client";

import React, { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import {
  CreditCard,
  Search,
  Download,
  ArrowUpDown,
  Calendar,
  Plus,
  DollarSign,
  X,
  FileSpreadsheet,
  Printer,
  FileText,
  CheckCircle2,
  Building2,
  User,
  ShieldCheck,
  Package,
  Box,
  Edit3,
  FileCheck2,
  Clock,
  Send,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Percent,
  Check,
  AlertTriangle,
  Mail,
  Share2,
  Copy,
  ExternalLink,
  ChevronRight,
  Filter,
  ChevronDown,
} from "lucide-react";
import AppLayout from "../../../../components/layout/app-layout";
import { useProject } from "../../../../context/project-context";
import {
  INITIAL_SALES,
  SaleRecord,
  UnitItem,
  CoOwner,
  QuoteRecord,
} from "../../../../data/projects-data";
import CreateSaleWizardModal from "../../../../components/sales/create-sale-wizard-modal";
import { EditSaleModal } from "../../../../components/sales/edit-sale-modal";
import QuoteUnitWizardModal from "../../../../components/units/quote-unit-wizard-modal";
import { exportTableToExcel, exportTableToPDF } from "../../../../lib/export-utils";
import { generateQuotePDF } from "../../../../lib/pdf-generator";

export default function ProjectSalesPage() {
  const params = useParams();
  const projectId = (params?.id as string) || "p-1";
  const {
    projects,
    getProject,
    formatMoney,
    updateUnit,
    updateProjectAdditionals,
    addQuote,
    updateQuote,
    deleteQuote,
    showToast,
    hasPermission,
    userName,
    userEmail,
  } = useProject();
  const project = getProject(projectId);

  // Main Section Tab
  const [activeTab, setActiveTab] = useState<"SALES" | "QUOTES">("SALES");

  // Sales States
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<keyof SaleRecord>("saleDate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [dateRangeFilter, setDateRangeFilter] = useState<{ start: string; end: string; label: string }>({
    start: "2026-08-14",
    end: "2026-09-17",
    label: "18 Ago 2026 - 17 Sep 2026",
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showNewSaleModal, setShowNewSaleModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState<SaleRecord | null>(null);
  const [showEditSaleModal, setShowEditSaleModal] = useState(false);
  const [saleToEdit, setSaleToEdit] = useState<SaleRecord | null>(null);
  const [localSales, setLocalSales] = useState<SaleRecord[] | null>(null);

  // Quotes States & CRM Pipeline
  const [quoteSearchQuery, setQuoteSearchQuery] = useState("");
  const [quoteStatusFilter, setQuoteStatusFilter] = useState<"ALL" | "VIGENTE" | "EN_ESPERA" | "CONVERTIDA_A_VENTA" | "PERDIDA" | "EXPIRADA" | "RECHAZADA">("ALL");
  const [selectedQuoteForDetail, setSelectedQuoteForDetail] = useState<QuoteRecord | null>(null);
  const [selectedQuoteToConvert, setSelectedQuoteToConvert] = useState<QuoteRecord | null>(null);
  const [statusMenuQuoteId, setStatusMenuQuoteId] = useState<string | null>(null);
  const [lostReasonQuote, setLostReasonQuote] = useState<QuoteRecord | null>(null);
  const [lostReasonCategory, setLostReasonCategory] = useState("Precio fuera de presupuesto");
  const [lostReasonText, setLostReasonText] = useState("");
  const [showUnitPickerForQuote, setShowUnitPickerForQuote] = useState(false);
  const [selectedUnitForQuoteModal, setSelectedUnitForQuoteModal] = useState<UnitItem | null>(null);
  const [showQuoteWizardModal, setShowQuoteWizardModal] = useState(false);
  const [copiedQuoteId, setCopiedQuoteId] = useState<string | null>(null);
  const [resendingQuoteId, setResendingQuoteId] = useState<string | null>(null);

  // Sales List dynamically derived from project inventory & active sales
  const derivedSales = useMemo<SaleRecord[]>(() => {
    if (!project || !project.unitsInventory) return [];

    const soldUnitsMap = new Map<string, UnitItem>();
    project.unitsInventory.forEach((u) => {
      if (u.status === "VENDIDA") soldUnitsMap.set(u.unit, u);
    });

    // 1. Process from real project.sales
    if (project.sales && project.sales.length > 0) {
      const activeSales = project.sales
        .filter((s) => s.status !== "CANCELADA" && soldUnitsMap.has(s.unit))
        .map((s) => {
          const matchingAddons =
            s.additionals && s.additionals.length > 0
              ? s.additionals
              : (project.additionals || []).filter((a) => a.assignedToUnit === s.unit);
          return {
            ...s,
            additionals: matchingAddons,
          };
        });
      if (activeSales.length > 0) {
        return activeSales;
      }
    }

    // 2. Fallback to sold units in inventory
    const soldUnits = Array.from(soldUnitsMap.values());
    return soldUnits.map((u, i) => {
      const isCoOwnership = (u.coOwners && u.coOwners.length > 1) || false;
      const clientName = u.client && u.client !== "-" ? u.client : "Cliente Propietario";
      const downPayment = u.salePaidAmount !== undefined ? u.salePaidAmount : Math.round(u.price * 0.2);
      const pending = u.salePendingAmount !== undefined ? u.salePendingAmount : Math.max(0, u.price - downPayment);
      const formattedDate = u.saleDate
        ? u.saleDate.includes("-")
          ? new Date(u.saleDate).toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "2-digit" })
          : u.saleDate
        : "17/09/26";
      const matchingAddons = (project.additionals || []).filter((a) => a.assignedToUnit === u.unit);

      return {
        id: `sale-${u.unit}-${i}`,
        folio: u.saleFolio || `VTA-2026-${(100 + i * 15).toString().padStart(3, "0")}`,
        clientName,
        clientEmail: u.coOwners?.[0]?.email || "-",
        clientPhone: u.coOwners?.[0]?.phone || "-",
        unit: u.unit,
        paymentPlan: u.salePlanName || "Plan Tradicional (20/80)",
        totalPrice: u.price,
        paidAmount: downPayment,
        pendingAmount: pending,
        saleDate: formattedDate,
        status: "ACTIVA" as const,
        isCoOwnership,
        additionals: matchingAddons,
        coOwnersSummary: isCoOwnership
          ? u.coOwners?.map((c: CoOwner) => `${c.name} (${c.ownershipPct}%)`).join(" + ")
          : undefined,
      };
    });
  }, [project]);

  const sales = localSales ?? derivedSales;

  // Quotes List
  const quotes = useMemo<QuoteRecord[]>(() => {
    if (!project || !project.quotes) return [];
    return project.quotes;
  }, [project]);

  // Quotes KPI metrics
  const quotesMetrics = useMemo(() => {
    const totalCount = quotes.length;
    const vigentesCount = quotes.filter((q) => q.status === "VIGENTE").length;
    const enEsperaCount = quotes.filter((q) => q.status === "EN_ESPERA").length;
    const convertidasCount = quotes.filter((q) => q.status === "CONVERTIDA_A_VENTA").length;
    const perdidasCount = quotes.filter((q) => q.status === "PERDIDA").length;
    const expiradasCount = quotes.filter((q) => q.status === "EXPIRADA").length;
    const totalCotizadoMonto = quotes.reduce((acc, q) => acc + (q.totalQuoteAmount || 0), 0);
    const conversionRate = totalCount > 0 ? Math.round((convertidasCount / totalCount) * 100) : 0;

    return {
      totalCount,
      vigentesCount,
      enEsperaCount,
      convertidasCount,
      perdidasCount,
      expiradasCount,
      totalCotizadoMonto,
      conversionRate,
    };
  }, [quotes]);

  // Available units for starting a new quote
  const availableUnitsForQuote = useMemo(() => {
    if (!project || !project.unitsInventory) return [];
    return project.unitsInventory.filter((u) => u.status === "DISPONIBLE");
  }, [project]);

  // Filtered and sorted quotes
  const processedQuotes = useMemo(() => {
    let result = [...quotes];

    if (quoteStatusFilter !== "ALL") {
      result = result.filter((q) => q.status === quoteStatusFilter);
    }

    if (quoteSearchQuery.trim()) {
      const q = quoteSearchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.clientName.toLowerCase().includes(q) ||
          item.folio.toLowerCase().includes(q) ||
          item.unit.toLowerCase().includes(q) ||
          (item.clientEmail && item.clientEmail.toLowerCase().includes(q)) ||
          item.advisorName.toLowerCase().includes(q) ||
          item.planName.toLowerCase().includes(q)
      );
    }

    // Default sort by created at desc
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return result;
  }, [quotes, quoteStatusFilter, quoteSearchQuery]);

  // Sorting handler for sales
  const handleSort = (field: keyof SaleRecord) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Filtered and sorted sales
  const processedSales = useMemo(() => {
    let result = [...sales];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.clientName.toLowerCase().includes(q) ||
          s.unit.toLowerCase().includes(q) ||
          s.folio.toLowerCase().includes(q) ||
          s.paymentPlan.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];

      if (typeof valA === "number" && typeof valB === "number") {
        return sortDirection === "asc" ? valA - valB : valB - valA;
      }

      const strA = String(valA || "").toLowerCase();
      const strB = String(valB || "").toLowerCase();
      return sortDirection === "asc" ? strA.localeCompare(strB) : strB.localeCompare(strA);
    });

    return result;
  }, [sales, searchQuery, sortField, sortDirection]);

  // Export handlers
  const handleExportExcel = () => {
    if (!project) return;
    if (activeTab === "SALES") {
      const data = processedSales.map((s) => ({
        Folio: s.folio,
        Cliente: s.clientName,
        Unidad: s.unit,
        "Plan de Pago": s.paymentPlan,
        "Precio Total": s.totalPrice,
        "Monto Pagado": s.paidAmount,
        "Monto Pendiente": s.pendingAmount,
        "Fecha de Venta": s.saleDate,
        Estado: s.status,
      }));
      exportTableToExcel(data, `Ventas_${project.name}_${new Date().toISOString().slice(0, 10)}`);
      showToast("Excel Exportado", "El libro de ventas se descargó correctamente.");
    } else {
      const data = processedQuotes.map((q) => ({
        Folio: q.folio,
        Cliente: q.clientName,
        Email: q.clientEmail || "-",
        Teléfono: q.clientPhone || "-",
        Unidad: q.unit,
        Tipología: q.unitType,
        "Superficie m²": q.superficieM2,
        "Plan Cotizado": q.planName,
        "Precio Lista": q.listPrice,
        "Descuento ($)": q.discountAmount,
        "Monto Total Cotizado": q.totalQuoteAmount,
        "Enganche (%)": `${q.downPaymentPct}%`,
        "Enganche ($)": q.downPaymentAmount,
        Mensualidades: q.installmentsCount,
        "Monto Mensualidad": q.installmentAmount,
        "Liquidación (%)": `${q.settlementPct}%`,
        "Liquidación ($)": q.settlementAmount,
        Asesor: q.advisorName,
        "Fecha Cotización": new Date(q.createdAt).toLocaleDateString("es-MX"),
        "Fecha Vigencia": new Date(q.expiresAt).toLocaleDateString("es-MX"),
        Estado: q.status,
      }));
      exportTableToExcel(data, `Cotizaciones_Prospectos_${project.name}_${new Date().toISOString().slice(0, 10)}`);
      showToast("Excel Exportado", "El reporte de cotizaciones y prospectos se descargó correctamente.");
    }
    setShowExportMenu(false);
  };

  const handleExportPDF = () => {
    if (!project) return;
    if (activeTab === "SALES") {
      const headers = ["Folio", "Cliente", "Unidad", "Plan", "Precio Total", "Pagado", "Pendiente", "Fecha", "Estado"];
      const rows = processedSales.map((s) => [
        s.folio,
        s.clientName,
        s.unit,
        s.paymentPlan,
        formatMoney(s.totalPrice),
        formatMoney(s.paidAmount),
        formatMoney(s.pendingAmount),
        s.saleDate,
        s.status,
      ]);
      const totalVendido = processedSales.reduce((sum, s) => sum + s.totalPrice, 0);
      const totalCobrado = processedSales.reduce((sum, s) => sum + s.paidAmount, 0);
      const summary = `Total de Ventas: ${processedSales.length} | Valor Facturado: ${formatMoney(totalVendido)} | Total Cobrado: ${formatMoney(totalCobrado)}`;
      exportTableToPDF("Libro de Ventas y Contratos", project.name, headers, rows, summary);
      showToast("PDF Generado", "Se abrió la ventana para imprimir/guardar PDF.");
    } else {
      const headers = ["Folio", "Prospecto", "Unidad", "Plan", "Total Cotizado", "Enganche", "Asesor", "Vigencia", "Estado"];
      const rows = processedQuotes.map((q) => [
        q.folio,
        q.clientName,
        q.unit,
        q.planName,
        formatMoney(q.totalQuoteAmount),
        `${formatMoney(q.downPaymentAmount)} (${q.downPaymentPct}%)`,
        q.advisorName,
        new Date(q.expiresAt).toLocaleDateString("es-MX"),
        q.status,
      ]);
      const totalCotizado = processedQuotes.reduce((sum, q) => sum + q.totalQuoteAmount, 0);
      const summary = `Total Cotizaciones: ${processedQuotes.length} | Monto Total Cotizado: ${formatMoney(totalCotizado)}`;
      exportTableToPDF("Seguimiento Comercial de Cotizaciones y Prospectos", project.name, headers, rows, summary);
      showToast("PDF Generado", "Se abrió la ventana para imprimir/guardar PDF.");
    }
    setShowExportMenu(false);
  };

  // Update Quote CRM Status
  const handleUpdateQuoteStatus = (quoteId: string, newStatus: QuoteRecord["status"], reason?: string) => {
    if (!project || !updateQuote) return;
    const updateData: Partial<QuoteRecord> = { status: newStatus };
    if (reason !== undefined) {
      updateData.lostReason = reason;
    }
    updateQuote(projectId, quoteId, updateData);
    setStatusMenuQuoteId(null);
    if (selectedQuoteForDetail && selectedQuoteForDetail.id === quoteId) {
      setSelectedQuoteForDetail({
        ...selectedQuoteForDetail,
        status: newStatus,
        ...(reason !== undefined ? { lostReason: reason } : {}),
      });
    }
    const statusLabels: Record<string, string> = {
      VIGENTE: "Vigente",
      EN_ESPERA: "En Espera / Seguimiento",
      CONVERTIDA_A_VENTA: "Convertida a Venta",
      PERDIDA: "Perdida",
      EXPIRADA: "Expirada",
      RECHAZADA: "Rechazada",
    };
    showToast("Estado Actualizado", `La cotización cambió a estado "${statusLabels[newStatus] || newStatus}".`, "success");
  };

  const handleOpenLostReason = (quote: QuoteRecord) => {
    setStatusMenuQuoteId(null);
    setLostReasonQuote(quote);
    setLostReasonCategory("Precio fuera de presupuesto");
    setLostReasonText("");
  };

  const handleConfirmLostReason = () => {
    if (!lostReasonQuote) return;
    const finalReason = lostReasonText.trim()
      ? `${lostReasonCategory} - ${lostReasonText.trim()}`
      : lostReasonCategory;
    handleUpdateQuoteStatus(lostReasonQuote.id, "PERDIDA", finalReason);
    setLostReasonQuote(null);
    setLostReasonText("");
  };

  // Convert Quote to Direct Sale (with flexible editable conditions)
  const handleConvertQuoteToSale = (quote: QuoteRecord) => {
    if (!project) return;
    setSelectedQuoteToConvert(quote);
    setSelectedQuoteForDetail(null);
    setShowNewSaleModal(true);
  };

  // Download Quote PDF with high DPI engine
  const handleDownloadQuotePDF = (quote: QuoteRecord) => {
    if (!project) return;
    const devLogoUrl =
      (typeof window !== "undefined" && (localStorage.getItem("devio_developer_logo") || sessionStorage.getItem("devio_developer_logo"))) ||
      "https://6d94a8ea50a1bc576a3e8162c197d74f.cdn.bubble.io/f1777398110026x731242031517065300/grupo_veq_logo.jpeg";
    const projLogoUrl =
      (project?.image && project.image.startsWith("http"))
        ? project.image
        : "https://6d94a8ea50a1bc576a3e8162c197d74f.cdn.bubble.io/f1777398492782x453733136803679400/lirica.jpeg";

    const unitObj = project.unitsInventory?.find((u) => u.unit === quote.unit);
    const unitPhoto = (unitObj?.images && unitObj.images.length > 0 && unitObj.images[0])
      ? unitObj.images[0]
      : (project.coverFileName || project.image || project.logoFileName || "https://6d94a8ea50a1bc576a3e8162c197d74f.cdn.bubble.io/f1777398492782x453733136803679400/lirica.jpeg");

    const floorPlanUrl =
      (unitObj?.floorPlan && project.floorPlans?.find((fp) => fp.name === unitObj.floorPlan || fp.id === unitObj.floorPlan)?.imageUrl) ||
      (project.floorPlans && project.floorPlans.length > 0 && project.floorPlans[0]?.imageUrl) ||
      undefined;

    const chars: Array<{ label: string; value: string }> = [];
    if (unitObj?.areaM2 || quote.superficieM2) chars.push({ label: "Superficie Total", value: `${unitObj?.areaM2 || quote.superficieM2} m²` });
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
    if (quote.deliveryDate || unitObj?.deliveryDate || project.estimatedDeliveryDate) chars.push({ label: "Entrega Estimada", value: quote.deliveryDate || unitObj?.deliveryDate || project.estimatedDeliveryDate || "" });
    if (unitObj?.maintenanceFee) chars.push({ label: "Cuota Mantto.", value: `$${unitObj.maintenanceFee.toLocaleString("es-MX")}/mes` });
    if (unitObj?.levelHeightM) chars.push({ label: "Altura Libre", value: `${unitObj.levelHeightM} m` });

    generateQuotePDF({
      quoteFolio: quote.folio,
      unitNumber: quote.unit,
      unitType: quote.unitType || "Departamento",
      superficieM2: quote.superficieM2 || unitObj?.areaM2 || 0,
      deliveryDate: quote.deliveryDate || unitObj?.deliveryDate || project.estimatedDeliveryDate || "Mayo 2028",
      projectName: project.name,
      developerLogoUrl: devLogoUrl,
      projectLogoUrl: projLogoUrl,
      projectCoverUrl: project.coverFileName || project.image,
      unitImageUrl: unitPhoto,
      floorPlanUrl: floorPlanUrl,
      developerName: "Desarrolladora Inmobiliaria",
      characteristics: chars,
      isCoOwnership: quote.isCoOwnership,
      coOwners: quote.coOwners,
      listPrice: quote.listPrice || quote.totalQuoteAmount,
      discountPct: quote.discountPct,
      discountAmount: quote.discountAmount,
      totalQuoteAmount: quote.totalQuoteAmount,
      planName: quote.planName || "Plan de Pago",
      downPaymentAmount: quote.downPaymentAmount,
      downPaymentPct: quote.downPaymentPct,
      installmentsCount: quote.installmentsCount,
      installmentAmount: quote.installmentAmount,
      settlementAmount: quote.settlementAmount,
      settlementPct: quote.settlementPct,
      additionals: quote.additionals || [],
      client: {
        name: quote.clientName,
        email: quote.clientEmail,
        phone: quote.clientPhone,
        rfc: quote.clientRfc,
      },
      advisor: {
        name: quote.advisorName || userName || "Asesor Comercial",
        role: "Asesor de Ventas",
        email: quote.advisorEmail || userEmail || "ventas@devio.mx",
        phone: quote.advisorPhone,
      },
      brandColor: "#1F3652",
    });
    showToast("PDF Generado", `Descargando cotización ${quote.folio}...`);
  };

  // Resend Quote Email
  const handleResendQuoteEmail = async (quote: QuoteRecord) => {
    if (!quote.clientEmail) {
      showToast("Sin Correo", "Esta cotización no tiene un correo de prospecto asociado.", "warning");
      return;
    }
    const projName = project ? project.name : "Proyecto";
    setResendingQuoteId(quote.id);
    try {
      const res = await fetch("/api/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: quote.clientEmail,
          templateAlias: "nueva-cotizacion",
          templateModel: {
            nombre_cliente: quote.clientName,
            unidad: quote.unit,
            proyecto: projName,
            monto_total: quote.totalQuoteAmount,
            folio_cotizacion: quote.folio,
            nombre_asesor: quote.advisorName,
            anio: new Date().getFullYear().toString(),
          },
        }),
      });
      if (res.ok) {
        showToast("Correo Enviado", `Se reenvió la cotización ${quote.folio} a ${quote.clientEmail}.`, "success");
      } else {
        showToast("Notificación Enviada", `Se procesó el envío de la cotización a ${quote.clientEmail}.`);
      }
    } catch (e) {
      showToast("Notificación Enviada", `Se registró el envío para ${quote.clientEmail}.`);
    } finally {
      setResendingQuoteId(null);
    }
  };

  // Copy Quote Link
  const handleCopyQuoteLink = (quote: QuoteRecord) => {
    setCopiedQuoteId(quote.id);
    navigator.clipboard?.writeText?.(`${window.location.origin}/projects/${projectId}/sales?quoteFolio=${quote.folio}`);
    showToast("Enlace Copiado", `Enlace de la cotización ${quote.folio} copiado al portapapeles.`);
    setTimeout(() => setCopiedQuoteId(null), 2500);
  };

  const handleSaleCreated = (salePayload: any) => {
    setShowNewSaleModal(false);
  };

  if (!project) return null;

  if (!hasPermission("sales.view")) {
    return (
      <AppLayout activeProjectId={projectId} projectSubTab="sales">
        <main style={{ padding: "3rem 2rem", flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "50%", backgroundColor: "#FEE2E2", color: "#DC2626", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}>
            <CreditCard size={32} />
          </div>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#1F3652", marginBottom: "0.5rem" }}>
            Módulo No Autorizado
          </h2>
          <p style={{ fontSize: "0.85rem", color: "#64748B", maxWidth: "420px", lineHeight: 1.5 }}>
            Tu usuario no cuenta con el permiso requerido (<strong>sales.view</strong>) para consultar el libro de ventas y cotizaciones de este proyecto.
          </p>
        </main>
      </AppLayout>
    );
  }

  return (
    <AppLayout activeProjectId={projectId} projectSubTab="sales">
      <main style={{ padding: "1.25rem 2rem 2rem 2rem", flex: 1, overflowY: "auto" }}>
        
        {/* ENCABEZADO PRINCIPAL & SWITCHER DE PESTAÑAS */}
        <div style={{ marginBottom: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#1F3652", margin: 0 }}>
              {activeTab === "SALES" ? "Ventas" : "Cotizaciones y Prospectos"}
            </h1>
            <p style={{ fontSize: "0.85rem", color: "#64748B", margin: "0.2rem 0 0" }}>
              {activeTab === "SALES"
                ? "Libro oficial de contratos, unidades vendidas y estados financieros"
                : "Seguimiento comercial de propuestas emitidas, prospectos y cotizaciones en curso"}
            </p>
          </div>

          {/* TAB SWITCHER */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              backgroundColor: "#F1F5F9",
              padding: "0.3rem",
              borderRadius: "9999px",
              border: "1px solid #E2E8F0",
              boxShadow: "inset 0 1px 2px rgba(0,0,0,0.04)",
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab("SALES")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.45rem",
                padding: "0.55rem 1.25rem",
                borderRadius: "9999px",
                fontSize: "0.84rem",
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
                backgroundColor: activeTab === "SALES" ? "#1B3047" : "transparent",
                color: activeTab === "SALES" ? "#FFFFFF" : "#64748B",
                boxShadow: activeTab === "SALES" ? "0 2px 6px rgba(27, 48, 71, 0.25)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              <CreditCard size={15} /> Ventas Concretadas ({sales.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("QUOTES")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.45rem",
                padding: "0.55rem 1.25rem",
                borderRadius: "9999px",
                fontSize: "0.84rem",
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
                backgroundColor: activeTab === "QUOTES" ? "#1B3047" : "transparent",
                color: activeTab === "QUOTES" ? "#FFFFFF" : "#64748B",
                boxShadow: activeTab === "QUOTES" ? "0 2px 6px rgba(27, 48, 71, 0.25)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              <FileCheck2 size={15} /> Cotizaciones y Prospectos ({quotes.length})
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* VISTA 1: VENTAS CONCRETADAS */}
        {/* ========================================================================= */}
        {activeTab === "SALES" && (
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "1.25rem",
              padding: "1.5rem",
              boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
              border: "1px solid rgba(22, 43, 63, 0.05)",
            }}
          >
            {/* BARRA SUPERIOR: BUSCADOR + FECHA + NUEVA VENTA + DESCARGAR */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
              {/* Input Buscar por cliente */}
              <div style={{ position: "relative", flex: 1, minWidth: "260px", maxWidth: "420px" }}>
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
                  placeholder="Buscar por cliente o folio"
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
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
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
                    <Calendar size={14} color="#64748B" /> {dateRangeFilter.label}
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
                        padding: "0.5rem",
                        zIndex: 50,
                        minWidth: "220px",
                      }}
                    >
                      {[
                        { label: "18 Ago 2026 - 17 Sep 2026", start: "2026-08-18", end: "2026-09-17" },
                        { label: "Últimos 30 días", start: "2026-08-17", end: "2026-09-17" },
                        { label: "Mes Actual (Septiembre)", start: "2026-09-01", end: "2026-09-30" },
                        { label: "Año Completo 2026", start: "2026-01-01", end: "2026-12-31" },
                      ].map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setDateRangeFilter(preset);
                            setShowDatePicker(false);
                          }}
                          style={{
                            width: "100%",
                            textAlign: "left",
                            padding: "0.5rem 0.85rem",
                            borderRadius: "0.5rem",
                            border: "none",
                            background: dateRangeFilter.label === preset.label ? "rgba(31, 54, 82, 0.08)" : "transparent",
                            color: dateRangeFilter.label === preset.label ? "#1F3652" : "#64748B",
                            fontSize: "0.8rem",
                            fontWeight: dateRangeFilter.label === preset.label ? 700 : 500,
                            cursor: "pointer",
                          }}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Botón $ Nueva Venta */}
                {hasPermission("sales.create") && (
                  <button
                    type="button"
                    onClick={() => setShowNewSaleModal(true)}
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
                    <DollarSign size={15} /> Nueva Venta
                  </button>
                )}

                {/* Botón Descargar Ventas (Excel / PDF) */}
                {hasPermission("sales.export") && (
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
                      <Download size={15} /> Descargar Ventas (Excel)
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

            {/* TABLA DE VENTAS */}
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, textAlign: "left" }}>
                <thead>
                  <tr style={{ backgroundColor: "#1B3047", color: "#FFFFFF" }}>
                    <th
                      onClick={() => handleSort("clientName")}
                      style={{
                        padding: "0.85rem 1.25rem",
                        fontSize: "0.82rem",
                        fontWeight: 700,
                        borderTopLeftRadius: "0.75rem",
                        borderBottomLeftRadius: "0.75rem",
                        cursor: "pointer",
                        userSelect: "none",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        Nombre
                        <ArrowUpDown size={13} style={{ opacity: sortField === "clientName" ? 1 : 0.4 }} />
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
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
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
                        Plan de pago
                        <ArrowUpDown size={13} style={{ opacity: sortField === "paymentPlan" ? 1 : 0.4 }} />
                      </div>
                    </th>

                    <th
                      onClick={() => handleSort("totalPrice")}
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
                        Precio total
                        <ArrowUpDown size={13} style={{ opacity: sortField === "totalPrice" ? 1 : 0.4 }} />
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
                        Pagado
                        <ArrowUpDown size={13} style={{ opacity: sortField === "paidAmount" ? 1 : 0.4 }} />
                      </div>
                    </th>

                    <th
                      onClick={() => handleSort("pendingAmount")}
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
                        Por pagar
                        <ArrowUpDown size={13} style={{ opacity: sortField === "pendingAmount" ? 1 : 0.4 }} />
                      </div>
                    </th>

                    <th
                      onClick={() => handleSort("saleDate")}
                      style={{
                        padding: "0.85rem 1.25rem",
                        fontSize: "0.82rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        userSelect: "none",
                        textAlign: "right",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.4rem" }}>
                        Fecha de venta
                        <ArrowUpDown size={13} style={{ opacity: sortField === "saleDate" ? 1 : 0.4 }} />
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
                      Acciones
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {processedSales.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ padding: "4rem 2rem", textAlign: "center" }}>
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
                            <CreditCard size={28} />
                          </div>
                          <h4 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--devio-blue-dark)", margin: "0 0 0.35rem 0" }}>
                            {searchQuery.trim() ? "No se encontraron ventas" : "No hay ventas registradas"}
                          </h4>
                          <p style={{ fontSize: "0.85rem", color: "var(--devio-neutral-3)", maxWidth: "440px", margin: "0 0 1.25rem 0", lineHeight: 1.5 }}>
                            {searchQuery.trim()
                              ? "No hay resultados que coincidan con los términos de búsqueda ingresados."
                              : "Comienza formalizando tu primera venta seleccionando una unidad disponible y asignando a su comprador."}
                          </p>
                          {!searchQuery.trim() && (
                            <button
                              type="button"
                              onClick={() => setShowNewSaleModal(true)}
                              style={{
                                backgroundColor: "var(--devio-blue-dark)",
                                color: "var(--devio-white)",
                                padding: "0.6rem 1.4rem",
                                borderRadius: "9999px",
                                fontSize: "0.82rem",
                                fontWeight: 700,
                                border: "none",
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.5rem",
                                boxShadow: "0 2px 6px rgba(27, 48, 71, 0.15)",
                              }}
                            >
                              <Plus size={16} /> Crear Primera Venta
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    processedSales.map((sale) => (
                      <tr
                        key={sale.id}
                        onClick={() => setSelectedSale(sale)}
                        style={{
                          borderBottom: "1px solid #F1F5F9",
                          cursor: "pointer",
                          transition: "background-color 0.15s ease",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(31, 54, 82, 0.02)")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                      >
                        {/* Nombre */}
                        <td style={{ padding: "1rem 1.25rem", fontWeight: 600, color: "#1F3652", fontSize: "0.85rem" }}>
                          {sale.clientName}
                        </td>

                        {/* Unidad */}
                        <td style={{ padding: "1rem 1rem", fontSize: "0.85rem" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                            <span style={{ fontWeight: 700, color: "#1F3652" }}>{sale.unit}</span>
                            {sale.additionals && sale.additionals.length > 0 && (
                              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
                                {sale.additionals.map((a, aIdx) => (
                                  <span
                                    key={a.id || aIdx}
                                    title={`${a.name} (${a.category}) - ${formatMoney(a.price)}`}
                                    style={{
                                      fontSize: "0.68rem",
                                      fontWeight: 700,
                                      backgroundColor: "rgba(47, 128, 237, 0.08)",
                                      color: "#2F80ED",
                                      padding: "0.1rem 0.4rem",
                                      borderRadius: "4px",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "0.25rem",
                                    }}
                                  >
                                    <Package size={10} />
                                    {a.name}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Plan de pago */}
                        <td style={{ padding: "1rem 1rem", fontSize: "0.85rem", color: "#475569" }}>
                          {sale.paymentPlan}
                        </td>

                        {/* Precio total */}
                        <td style={{ padding: "1rem 1rem", fontSize: "0.85rem", fontWeight: 600, color: "#1F3652", textAlign: "right" }}>
                          {formatMoney(sale.totalPrice)}
                        </td>

                        {/* Pagado */}
                        <td style={{ padding: "1rem 1rem", fontSize: "0.85rem", fontWeight: 600, color: sale.paidAmount > 0 ? "#00C48C" : "#1F3652", textAlign: "right" }}>
                          {formatMoney(sale.paidAmount)}
                        </td>

                        {/* Por pagar */}
                        <td style={{ padding: "1rem 1rem", fontSize: "0.85rem", fontWeight: 600, color: "#1F3652", textAlign: "right" }}>
                          {formatMoney(sale.pendingAmount)}
                        </td>

                        {/* Fecha de venta */}
                        <td style={{ padding: "1rem 1.25rem", fontSize: "0.85rem", color: "#475569", textAlign: "right" }}>
                          {sale.saleDate}
                        </td>

                        {/* Acciones */}
                        <td style={{ padding: "0.75rem 1rem", textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
                          {hasPermission("sales.edit") ? (
                            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSaleToEdit(sale);
                                  setShowEditSaleModal(true);
                                }}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "0.3rem",
                                  backgroundColor: "rgba(47, 128, 237, 0.08)",
                                  color: "#2F80ED",
                                  border: "1px solid rgba(47, 128, 237, 0.2)",
                                  padding: "0.35rem 0.75rem",
                                  borderRadius: "0.5rem",
                                  fontSize: "0.75rem",
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  transition: "all 0.15s ease",
                                  whiteSpace: "nowrap",
                                }}
                                title="Editar adicionales, precio y reajuste de cuotas"
                              >
                                <Edit3 size={13} /> Editar
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize: "0.75rem", color: "#94A3B8" }}>-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer de resumen */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1.25rem", paddingTop: "1rem", borderTop: "1px solid #F1F5F9", fontSize: "0.78rem", color: "#64748B" }}>
              <span>Mostrando <strong>{processedSales.length}</strong> de <strong>{sales.length}</strong> ventas registradas</span>
              <span>Valor Total Vendido: <strong>{formatMoney(sales.reduce((acc, s) => acc + s.totalPrice, 0))}</strong></span>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VISTA 2: COTIZACIONES Y PROSPECTOS */}
        {/* ========================================================================= */}
        {activeTab === "QUOTES" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            
            {/* KPI METRICS DE COTIZACIONES (CRM FUNNEL) */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "1rem",
                marginBottom: "1.5rem",
              }}
            >
              {/* Total Cotizaciones */}
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "1rem",
                  padding: "1.1rem",
                  border: "1px solid rgba(22, 43, 63, 0.06)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.85rem",
                }}
              >
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "12px",
                    backgroundColor: "rgba(47, 128, 237, 0.1)",
                    color: "#2F80ED",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <FileText size={22} />
                </div>
                <div>
                  <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "#64748B", textTransform: "uppercase" }}>
                    Total Propuestas
                  </span>
                  <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "#1F3652", lineHeight: 1.1 }}>
                    {quotesMetrics.totalCount}
                  </div>
                  <span style={{ fontSize: "0.7rem", color: "#94A3B8" }}>Cotizaciones emitidas</span>
                </div>
              </div>

              {/* Cotizaciones Vigentes */}
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "1rem",
                  padding: "1.1rem",
                  border: "1px solid rgba(22, 43, 63, 0.06)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.85rem",
                }}
              >
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "12px",
                    backgroundColor: "rgba(0, 196, 140, 0.1)",
                    color: "#00C48C",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Clock size={22} />
                </div>
                <div>
                  <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "#64748B", textTransform: "uppercase" }}>
                    Vigentes
                  </span>
                  <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "#00C48C", lineHeight: 1.1 }}>
                    {quotesMetrics.vigentesCount}
                  </div>
                  <span style={{ fontSize: "0.7rem", color: "#64748B" }}>En seguimiento activo</span>
                </div>
              </div>

              {/* Cotizaciones En Espera */}
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "1rem",
                  padding: "1.1rem",
                  border: "1px solid rgba(22, 43, 63, 0.06)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.85rem",
                }}
              >
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "12px",
                    backgroundColor: "rgba(242, 153, 74, 0.12)",
                    color: "#F2994A",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Clock size={22} />
                </div>
                <div>
                  <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "#64748B", textTransform: "uppercase" }}>
                    En Espera
                  </span>
                  <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "#F2994A", lineHeight: 1.1 }}>
                    {quotesMetrics.enEsperaCount}
                  </div>
                  <span style={{ fontSize: "0.7rem", color: "#64748B" }}>Prospecto evaluando</span>
                </div>
              </div>

              {/* Concretadas / Vendidas */}
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "1rem",
                  padding: "1.1rem",
                  border: "1px solid rgba(22, 43, 63, 0.06)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.85rem",
                }}
              >
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "12px",
                    backgroundColor: "rgba(47, 128, 237, 0.12)",
                    color: "#2F80ED",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <TrendingUp size={22} />
                </div>
                <div>
                  <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "#64748B", textTransform: "uppercase" }}>
                    Concretadas ({quotesMetrics.conversionRate}%)
                  </span>
                  <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "#2F80ED", lineHeight: 1.1 }}>
                    {quotesMetrics.convertidasCount}
                  </div>
                  <span style={{ fontSize: "0.7rem", color: "#00C48C", fontWeight: 600 }}>Convertidas a venta</span>
                </div>
              </div>

              {/* Perdidas / Descartadas */}
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "1rem",
                  padding: "1.1rem",
                  border: "1px solid rgba(22, 43, 63, 0.06)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.85rem",
                }}
              >
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "12px",
                    backgroundColor: "rgba(235, 87, 87, 0.1)",
                    color: "#EB5757",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <AlertTriangle size={22} />
                </div>
                <div>
                  <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "#64748B", textTransform: "uppercase" }}>
                    Perdidas
                  </span>
                  <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "#EB5757", lineHeight: 1.1 }}>
                    {quotesMetrics.perdidasCount}
                  </div>
                  <span style={{ fontSize: "0.7rem", color: "#94A3B8" }}>Oportunidades cerradas</span>
                </div>
              </div>

              {/* Monto Total Cotizado */}
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "1rem",
                  padding: "1.1rem",
                  border: "1px solid rgba(22, 43, 63, 0.06)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.85rem",
                }}
              >
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "12px",
                    backgroundColor: "rgba(31, 54, 82, 0.08)",
                    color: "#1F3652",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <DollarSign size={22} />
                </div>
                <div>
                  <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "#64748B", textTransform: "uppercase" }}>
                    Monto en Pipeline
                  </span>
                  <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#1F3652", lineHeight: 1.1 }}>
                    {formatMoney(quotesMetrics.totalCotizadoMonto)}
                  </div>
                  <span style={{ fontSize: "0.7rem", color: "#64748B" }}>Valor total cotizado</span>
                </div>
              </div>
            </div>

            {/* TABLA Y CONTROLES DE COTIZACIONES */}
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "1.25rem",
                padding: "1.5rem",
                boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                border: "1px solid rgba(22, 43, 63, 0.05)",
              }}
            >
              {/* FILTROS SUPERIORES */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
                
                {/* Search Bar */}
                <div style={{ position: "relative", flex: 1, minWidth: "260px", maxWidth: "340px" }}>
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
                    placeholder="Buscar por prospecto, folio, unidad..."
                    value={quoteSearchQuery}
                    onChange={(e) => setQuoteSearchQuery(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.65rem 1rem 0.65rem 2.75rem",
                      borderRadius: "9999px",
                      border: "1px solid #E2E8F0",
                      backgroundColor: "#FFFFFF",
                      fontSize: "0.85rem",
                      color: "#1F3652",
                      outline: "none",
                    }}
                  />
                  {quoteSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setQuoteSearchQuery("")}
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

                {/* Status Filter Pills (CRM Pipeline) */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", flexWrap: "wrap" }}>
                  {[
                    { key: "ALL", label: "Todas" },
                    { key: "VIGENTE", label: "Vigentes" },
                    { key: "EN_ESPERA", label: "En Espera" },
                    { key: "CONVERTIDA_A_VENTA", label: "Convertidas" },
                    { key: "PERDIDA", label: "Perdidas" },
                    { key: "EXPIRADA", label: "Expiradas" },
                    { key: "RECHAZADA", label: "Rechazadas" },
                  ].map((filter) => {
                    const isActive = quoteStatusFilter === filter.key;
                    return (
                      <button
                        key={filter.key}
                        type="button"
                        onClick={() => setQuoteStatusFilter(filter.key as any)}
                        style={{
                          padding: "0.45rem 0.85rem",
                          borderRadius: "9999px",
                          fontSize: "0.78rem",
                          fontWeight: isActive ? 700 : 500,
                          border: isActive ? "1px solid #1B3047" : "1px solid #E2E8F0",
                          backgroundColor: isActive ? "#1B3047" : "#FFFFFF",
                          color: isActive ? "#FFFFFF" : "#64748B",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {filter.label}
                      </button>
                    );
                  })}
                </div>

                {/* Actions: + Nueva Cotización & Export */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  {hasPermission("quotes.create") && (
                    <button
                      type="button"
                      onClick={() => setShowUnitPickerForQuote(true)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.45rem",
                        backgroundColor: "#1B3047",
                        color: "#FFFFFF",
                        padding: "0.6rem 1.25rem",
                        borderRadius: "9999px",
                        fontSize: "0.82rem",
                        fontWeight: 700,
                        border: "none",
                        cursor: "pointer",
                        boxShadow: "0 2px 6px rgba(27, 48, 71, 0.15)",
                      }}
                    >
                      <Plus size={15} /> Nueva Cotización
                    </button>
                  )}

                  {hasPermission("quotes.export") && (
                    <button
                      type="button"
                      onClick={handleExportExcel}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.45rem",
                        backgroundColor: "#FFFFFF",
                        color: "#1F3652",
                        padding: "0.6rem 1.1rem",
                        borderRadius: "9999px",
                        fontSize: "0.82rem",
                        fontWeight: 600,
                        border: "1px solid #E2E8F0",
                        cursor: "pointer",
                      }}
                      title="Descargar reporte en Excel"
                    >
                      <Download size={14} /> Exportar
                    </button>
                  )}
                </div>
              </div>

              {/* TABLA DE COTIZACIONES */}
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, textAlign: "left" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#1B3047", color: "#FFFFFF" }}>
                      <th style={{ padding: "0.85rem 1.25rem", fontSize: "0.82rem", fontWeight: 700, borderTopLeftRadius: "0.75rem", borderBottomLeftRadius: "0.75rem" }}>
                        Folio
                      </th>
                      <th style={{ padding: "0.85rem 1rem", fontSize: "0.82rem", fontWeight: 700 }}>
                        Prospecto / Cliente
                      </th>
                      <th style={{ padding: "0.85rem 1rem", fontSize: "0.82rem", fontWeight: 700 }}>
                        Unidad
                      </th>
                      <th style={{ padding: "0.85rem 1rem", fontSize: "0.82rem", fontWeight: 700 }}>
                        Plan Financiero
                      </th>
                      <th style={{ padding: "0.85rem 1rem", fontSize: "0.82rem", fontWeight: 700, textAlign: "right" }}>
                        Monto Cotizado
                      </th>
                      <th style={{ padding: "0.85rem 1rem", fontSize: "0.82rem", fontWeight: 700 }}>
                        Asesor
                      </th>
                      <th style={{ padding: "0.85rem 1rem", fontSize: "0.82rem", fontWeight: 700 }}>
                        Vigencia
                      </th>
                      <th style={{ padding: "0.85rem 1rem", fontSize: "0.82rem", fontWeight: 700, textAlign: "center" }}>
                        Estado CRM
                      </th>
                      <th style={{ padding: "0.85rem 1.25rem", fontSize: "0.82rem", fontWeight: 700, borderTopRightRadius: "0.75rem", borderBottomRightRadius: "0.75rem", textAlign: "center" }}>
                        Acciones
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {processedQuotes.length === 0 ? (
                      <tr>
                        <td colSpan={9} style={{ padding: "4rem 2rem", textAlign: "center" }}>
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
                              <FileText size={28} />
                            </div>
                            <h4 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--devio-blue-dark)", margin: "0 0 0.35rem 0" }}>
                              {quoteSearchQuery.trim() ? "No se encontraron cotizaciones" : "No hay cotizaciones registradas"}
                            </h4>
                            <p style={{ fontSize: "0.85rem", color: "var(--devio-neutral-3)", maxWidth: "440px", margin: "0 0 1.25rem 0", lineHeight: 1.5 }}>
                              {quoteSearchQuery.trim()
                                ? "Intenta modificar los filtros o los términos de búsqueda."
                                : "Genera tu primera propuesta comercial seleccionando una unidad disponible del inventario."}
                            </p>
                            {hasPermission("quotes.create") && (
                              <button
                                type="button"
                                onClick={() => setShowUnitPickerForQuote(true)}
                                style={{
                                  backgroundColor: "var(--devio-blue-dark)",
                                  color: "var(--devio-white)",
                                  padding: "0.6rem 1.4rem",
                                  borderRadius: "9999px",
                                  fontSize: "0.82rem",
                                  fontWeight: 700,
                                  border: "none",
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "0.5rem",
                                  boxShadow: "0 2px 6px rgba(27, 48, 71, 0.15)",
                                }}
                              >
                                <Plus size={16} /> Crear Cotización
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      processedQuotes.map((quote) => {
                        const isVigente = quote.status === "VIGENTE";
                        const isEnEspera = quote.status === "EN_ESPERA";
                        const isConvertida = quote.status === "CONVERTIDA_A_VENTA";
                        const isPerdida = quote.status === "PERDIDA";
                        const isExpirada = quote.status === "EXPIRADA";
                        const isRechazada = quote.status === "RECHAZADA";

                        const statusBadge = isVigente ? (
                          <span style={{ fontSize: "0.72rem", fontWeight: 800, padding: "0.25rem 0.65rem", borderRadius: "9999px", backgroundColor: "rgba(0, 196, 140, 0.12)", color: "#00C48C", border: "1px solid rgba(0, 196, 140, 0.3)" }}>
                            ● Vigente
                          </span>
                        ) : isEnEspera ? (
                          <span style={{ fontSize: "0.72rem", fontWeight: 800, padding: "0.25rem 0.65rem", borderRadius: "9999px", backgroundColor: "rgba(242, 153, 74, 0.12)", color: "#F2994A", border: "1px solid rgba(242, 153, 74, 0.3)" }}>
                            ⏳ En Espera
                          </span>
                        ) : isConvertida ? (
                          <span style={{ fontSize: "0.72rem", fontWeight: 800, padding: "0.25rem 0.65rem", borderRadius: "9999px", backgroundColor: "rgba(47, 128, 237, 0.12)", color: "#2F80ED", border: "1px solid rgba(47, 128, 237, 0.3)" }}>
                            ✓ Concretada
                          </span>
                        ) : isPerdida ? (
                          <span
                            title={quote.lostReason ? `Motivo: ${quote.lostReason}` : "Venta perdida"}
                            style={{ fontSize: "0.72rem", fontWeight: 700, padding: "0.25rem 0.65rem", borderRadius: "9999px", backgroundColor: "rgba(100, 116, 139, 0.12)", color: "#475569", border: "1px solid rgba(100, 116, 139, 0.3)" }}
                          >
                            ✕ Perdida
                          </span>
                        ) : isExpirada ? (
                          <span style={{ fontSize: "0.72rem", fontWeight: 700, padding: "0.25rem 0.65rem", borderRadius: "9999px", backgroundColor: "rgba(242, 153, 74, 0.12)", color: "#F2994A", border: "1px solid rgba(242, 153, 74, 0.3)" }}>
                            Expirada
                          </span>
                        ) : (
                          <span style={{ fontSize: "0.72rem", fontWeight: 700, padding: "0.25rem 0.65rem", borderRadius: "9999px", backgroundColor: "rgba(235, 87, 87, 0.12)", color: "#EB5757", border: "1px solid rgba(235, 87, 87, 0.3)" }}>
                            Rechazada
                          </span>
                        );

                        const isStatusOpen = statusMenuQuoteId === quote.id;

                        return (
                          <tr
                            key={quote.id}
                            onClick={() => setSelectedQuoteForDetail(quote)}
                            style={{
                              borderBottom: "1px solid #F1F5F9",
                              cursor: "pointer",
                              transition: "background-color 0.15s ease",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(31, 54, 82, 0.02)")}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                          >
                            {/* Folio */}
                            <td style={{ padding: "1rem 1.25rem", fontWeight: 700, color: "#1F3652", fontSize: "0.85rem" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                                <FileText size={14} color="#2F80ED" />
                                <span>{quote.folio}</span>
                              </div>
                            </td>

                            {/* Prospecto */}
                            <td style={{ padding: "1rem 1rem", fontSize: "0.85rem" }}>
                              <div>
                                <strong style={{ color: "#1F3652", display: "block" }}>{quote.clientName}</strong>
                                <span style={{ fontSize: "0.74rem", color: "#64748B" }}>
                                  {quote.clientEmail || quote.clientPhone || "-"}
                                </span>
                              </div>
                            </td>

                            {/* Unidad */}
                            <td style={{ padding: "1rem 1rem", fontSize: "0.85rem" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                <span style={{ fontWeight: 700, color: "#1F3652" }}>{quote.unit}</span>
                                <span style={{ fontSize: "0.72rem", color: "#64748B", backgroundColor: "#F1F5F9", padding: "0.1rem 0.4rem", borderRadius: "4px" }}>
                                  {quote.unitType} ({quote.superficieM2} m²)
                                </span>
                              </div>
                            </td>

                            {/* Plan Financiero */}
                            <td style={{ padding: "1rem 1rem", fontSize: "0.82rem", color: "#475569" }}>
                              <div>
                                <strong style={{ color: "#1F3652" }}>{quote.planName}</strong>
                                <div style={{ fontSize: "0.72rem", color: "#64748B" }}>
                                  Eng: {quote.downPaymentPct}% • {quote.installmentsCount} m. • Liq: {quote.settlementPct}%
                                </div>
                              </div>
                            </td>

                            {/* Monto Cotizado */}
                            <td style={{ padding: "1rem 1rem", fontSize: "0.85rem", fontWeight: 700, color: "#1F3652", textAlign: "right" }}>
                              <div>
                                <span>{formatMoney(quote.totalQuoteAmount)}</span>
                                {quote.discountAmount > 0 && (
                                  <div style={{ fontSize: "0.7rem", color: "#00C48C" }}>
                                    Desc: -{formatMoney(quote.discountAmount)}
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* Asesor */}
                            <td style={{ padding: "1rem 1rem", fontSize: "0.82rem", color: "#475569" }}>
                              {quote.advisorName}
                            </td>

                            {/* Vigencia */}
                            <td style={{ padding: "1rem 1rem", fontSize: "0.8rem", color: "#64748B" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                                <Calendar size={13} color="#94A3B8" />
                                <span>{new Date(quote.expiresAt).toLocaleDateString("es-MX", { day: "2-digit", month: "short" })}</span>
                              </div>
                            </td>

                            {/* Estado CRM con Quick-Status Switcher */}
                            <td style={{ padding: "1rem 1rem", textAlign: "center", position: "relative" }} onClick={(e) => e.stopPropagation()}>
                              <div style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                                {statusBadge}
                                {hasPermission("quotes.change_status") && (
                                  <div style={{ position: "relative" }}>
                                    <button
                                      type="button"
                                      onClick={() => setStatusMenuQuoteId(isStatusOpen ? null : quote.id)}
                                      style={{
                                        border: "none",
                                        background: "transparent",
                                        color: "#64748B",
                                        cursor: "pointer",
                                        padding: "0.15rem",
                                        display: "flex",
                                        alignItems: "center",
                                        borderRadius: "4px",
                                      }}
                                      title="Cambiar estado CRM"
                                    >
                                      <ChevronDown size={14} />
                                    </button>

                                    {isStatusOpen && (
                                      <div
                                        style={{
                                          position: "absolute",
                                          top: "100%",
                                          right: 0,
                                          marginTop: "0.35rem",
                                          backgroundColor: "#FFFFFF",
                                          borderRadius: "0.75rem",
                                          boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
                                          border: "1px solid #E2E8F0",
                                          padding: "0.4rem",
                                          zIndex: 50,
                                          minWidth: "170px",
                                          textAlign: "left",
                                        }}
                                      >
                                        <div style={{ fontSize: "0.68rem", fontWeight: 800, color: "#94A3B8", padding: "0.25rem 0.5rem", textTransform: "uppercase" }}>
                                          Cambiar Estado
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => handleUpdateQuoteStatus(quote.id, "VIGENTE")}
                                          style={{ width: "100%", textAlign: "left", padding: "0.4rem 0.6rem", fontSize: "0.75rem", border: "none", background: "none", cursor: "pointer", borderRadius: "0.4rem", color: "#00C48C", fontWeight: 700 }}
                                        >
                                          ● Vigente
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleUpdateQuoteStatus(quote.id, "EN_ESPERA")}
                                          style={{ width: "100%", textAlign: "left", padding: "0.4rem 0.6rem", fontSize: "0.75rem", border: "none", background: "none", cursor: "pointer", borderRadius: "0.4rem", color: "#F2994A", fontWeight: 700 }}
                                        >
                                          ⏳ En Espera
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleOpenLostReason(quote)}
                                          style={{ width: "100%", textAlign: "left", padding: "0.4rem 0.6rem", fontSize: "0.75rem", border: "none", background: "none", cursor: "pointer", borderRadius: "0.4rem", color: "#64748B", fontWeight: 600 }}
                                        >
                                          ✕ Marcar como Perdida
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleUpdateQuoteStatus(quote.id, "EXPIRADA")}
                                          style={{ width: "100%", textAlign: "left", padding: "0.4rem 0.6rem", fontSize: "0.75rem", border: "none", background: "none", cursor: "pointer", borderRadius: "0.4rem", color: "#F2994A", fontWeight: 500 }}
                                        >
                                          Expirada
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleUpdateQuoteStatus(quote.id, "RECHAZADA")}
                                          style={{ width: "100%", textAlign: "left", padding: "0.4rem 0.6rem", fontSize: "0.75rem", border: "none", background: "none", cursor: "pointer", borderRadius: "0.4rem", color: "#EB5757", fontWeight: 500 }}
                                        >
                                          Rechazada
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                              {isPerdida && quote.lostReason && (
                                <div style={{ fontSize: "0.68rem", color: "#94A3B8", marginTop: "0.15rem", maxWidth: "140px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={quote.lostReason}>
                                  {quote.lostReason}
                                </div>
                              )}
                            </td>

                            {/* Acciones */}
                            <td style={{ padding: "0.75rem 1.25rem", textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
                              <div style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                                
                                {/* Descargar PDF */}
                                {hasPermission("quotes.export") && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDownloadQuotePDF(quote);
                                    }}
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "0.25rem",
                                      backgroundColor: "rgba(31, 54, 82, 0.06)",
                                      color: "#1F3652",
                                      border: "1px solid #E2E8F0",
                                      padding: "0.35rem 0.65rem",
                                      borderRadius: "0.5rem",
                                      fontSize: "0.75rem",
                                      fontWeight: 700,
                                      cursor: "pointer",
                                    }}
                                    title="Descargar carátula en PDF"
                                  >
                                    <Download size={13} /> PDF
                                  </button>
                                )}

                                {/* Convertir a Venta */}
                                {!isConvertida && hasPermission("quotes.convert_to_sale") && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleConvertQuoteToSale(quote);
                                    }}
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "0.25rem",
                                      backgroundColor: "rgba(0, 196, 140, 0.1)",
                                      color: "#00C48C",
                                      border: "1px solid rgba(0, 196, 140, 0.3)",
                                      padding: "0.35rem 0.65rem",
                                      borderRadius: "0.5rem",
                                      fontSize: "0.75rem",
                                      fontWeight: 700,
                                      cursor: "pointer",
                                    }}
                                    title="Convertir propuesta a Venta (condiciones editables)"
                                  >
                                    <DollarSign size={13} /> Vender
                                  </button>
                                )}

                                {/* Copiar Enlace */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopyQuoteLink(quote);
                                  }}
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    padding: "0.35rem 0.5rem",
                                    borderRadius: "0.5rem",
                                    border: "1px solid #E2E8F0",
                                    backgroundColor: "#FFFFFF",
                                    color: copiedQuoteId === quote.id ? "#00C48C" : "#64748B",
                                    fontSize: "0.75rem",
                                    cursor: "pointer",
                                  }}
                                  title="Copiar enlace de cotización"
                                >
                                  {copiedQuoteId === quote.id ? <Check size={13} /> : <Copy size={13} />}
                                </button>
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
                <span>Mostrando <strong>{processedQuotes.length}</strong> de <strong>{quotes.length}</strong> cotizaciones</span>
                <span>Monto Total de Propuestas: <strong>{formatMoney(processedQuotes.reduce((acc, q) => acc + q.totalQuoteAmount, 0))}</strong></span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL DETALLE DE COTIZACIÓN */}
        {/* ========================================================================= */}
        {selectedQuoteForDetail && (
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
                maxWidth: "680px",
                maxHeight: "90vh",
                overflowY: "auto",
                boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
                padding: "2rem",
              }}
            >
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#2F80ED", textTransform: "uppercase" }}>
                      Cotización Folio {selectedQuoteForDetail.folio}
                    </span>
                    {selectedQuoteForDetail.status === "VIGENTE" && (
                      <span style={{ fontSize: "0.7rem", fontWeight: 800, padding: "0.2rem 0.55rem", borderRadius: "9999px", backgroundColor: "rgba(0, 196, 140, 0.12)", color: "#00C48C" }}>
                        ● Vigente
                      </span>
                    )}
                    {selectedQuoteForDetail.status === "EN_ESPERA" && (
                      <span style={{ fontSize: "0.7rem", fontWeight: 800, padding: "0.2rem 0.55rem", borderRadius: "9999px", backgroundColor: "rgba(242, 153, 74, 0.12)", color: "#F2994A" }}>
                        ⏳ En Espera
                      </span>
                    )}
                    {selectedQuoteForDetail.status === "CONVERTIDA_A_VENTA" && (
                      <span style={{ fontSize: "0.7rem", fontWeight: 800, padding: "0.2rem 0.55rem", borderRadius: "9999px", backgroundColor: "rgba(47, 128, 237, 0.12)", color: "#2F80ED" }}>
                        ✓ Concretada
                      </span>
                    )}
                    {selectedQuoteForDetail.status === "PERDIDA" && (
                      <span style={{ fontSize: "0.7rem", fontWeight: 700, padding: "0.2rem 0.55rem", borderRadius: "9999px", backgroundColor: "rgba(100, 116, 139, 0.12)", color: "#475569" }}>
                        ✕ Perdida
                      </span>
                    )}
                    {selectedQuoteForDetail.status === "EXPIRADA" && (
                      <span style={{ fontSize: "0.7rem", fontWeight: 700, padding: "0.2rem 0.55rem", borderRadius: "9999px", backgroundColor: "rgba(242, 153, 74, 0.12)", color: "#F2994A" }}>
                        Expirada
                      </span>
                    )}
                    {selectedQuoteForDetail.status === "RECHAZADA" && (
                      <span style={{ fontSize: "0.7rem", fontWeight: 700, padding: "0.2rem 0.55rem", borderRadius: "9999px", backgroundColor: "rgba(235, 87, 87, 0.12)", color: "#EB5757" }}>
                        Rechazada
                      </span>
                    )}
                  </div>
                  <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#1F3652", margin: "0.2rem 0 0" }}>
                    Unidad {selectedQuoteForDetail.unit} • {selectedQuoteForDetail.unitType}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedQuoteForDetail(null)}
                  style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer" }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Status Action Switcher Bar in Detail Modal */}
              {hasPermission("quotes.change_status") && (
                <div style={{ backgroundColor: "#F1F5F9", borderRadius: "0.75rem", padding: "0.6rem 0.85rem", marginBottom: "1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569" }}>
                    Etapa / Estatus CRM:
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={() => handleUpdateQuoteStatus(selectedQuoteForDetail.id, "VIGENTE")}
                      style={{
                        padding: "0.3rem 0.65rem",
                        borderRadius: "9999px",
                        fontSize: "0.72rem",
                        fontWeight: selectedQuoteForDetail.status === "VIGENTE" ? 800 : 500,
                        backgroundColor: selectedQuoteForDetail.status === "VIGENTE" ? "#00C48C" : "#FFFFFF",
                        color: selectedQuoteForDetail.status === "VIGENTE" ? "#FFFFFF" : "#00C48C",
                        border: "1px solid #00C48C",
                        cursor: "pointer",
                      }}
                    >
                      ● Vigente
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateQuoteStatus(selectedQuoteForDetail.id, "EN_ESPERA")}
                      style={{
                        padding: "0.3rem 0.65rem",
                        borderRadius: "9999px",
                        fontSize: "0.72rem",
                        fontWeight: selectedQuoteForDetail.status === "EN_ESPERA" ? 800 : 500,
                        backgroundColor: selectedQuoteForDetail.status === "EN_ESPERA" ? "#F2994A" : "#FFFFFF",
                        color: selectedQuoteForDetail.status === "EN_ESPERA" ? "#FFFFFF" : "#F2994A",
                        border: "1px solid #F2994A",
                        cursor: "pointer",
                      }}
                    >
                      ⏳ En Espera
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenLostReason(selectedQuoteForDetail)}
                      style={{
                        padding: "0.3rem 0.65rem",
                        borderRadius: "9999px",
                        fontSize: "0.72rem",
                        fontWeight: selectedQuoteForDetail.status === "PERDIDA" ? 800 : 500,
                        backgroundColor: selectedQuoteForDetail.status === "PERDIDA" ? "#64748B" : "#FFFFFF",
                        color: selectedQuoteForDetail.status === "PERDIDA" ? "#FFFFFF" : "#64748B",
                        border: "1px solid #64748B",
                        cursor: "pointer",
                      }}
                    >
                      ✕ Perdida
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateQuoteStatus(selectedQuoteForDetail.id, "EXPIRADA")}
                      style={{
                        padding: "0.3rem 0.65rem",
                        borderRadius: "9999px",
                        fontSize: "0.72rem",
                        fontWeight: selectedQuoteForDetail.status === "EXPIRADA" ? 800 : 500,
                        backgroundColor: selectedQuoteForDetail.status === "EXPIRADA" ? "#E2E8F0" : "#FFFFFF",
                        color: "#475569",
                        border: "1px solid #CBD5E1",
                        cursor: "pointer",
                      }}
                    >
                      Expirada
                    </button>
                  </div>
                </div>
              )}

              {/* Motivo de Pérdida Banner si aplica */}
              {selectedQuoteForDetail.lostReason && (
                <div style={{ backgroundColor: "rgba(235, 87, 87, 0.08)", borderRadius: "0.85rem", padding: "0.85rem 1rem", border: "1px solid rgba(235, 87, 87, 0.25)", marginBottom: "1.25rem" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#EB5757", display: "block" }}>
                    Motivo de Descarte / Pérdida:
                  </span>
                  <p style={{ fontSize: "0.82rem", color: "#1F3652", margin: "0.25rem 0 0" }}>
                    {selectedQuoteForDetail.lostReason}
                  </p>
                </div>
              )}

              {/* Info Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
                <div style={{ backgroundColor: "#F8FAFC", borderRadius: "0.85rem", padding: "1rem", border: "1px solid #E2E8F0" }}>
                  <span style={{ fontSize: "0.75rem", color: "#64748B", display: "block" }}>Prospecto / Cliente</span>
                  <strong style={{ fontSize: "0.95rem", color: "#1F3652" }}>{selectedQuoteForDetail.clientName}</strong>
                  <span style={{ fontSize: "0.75rem", color: "#64748B", display: "block", marginTop: "0.25rem" }}>
                    {selectedQuoteForDetail.clientEmail || "-"} • {selectedQuoteForDetail.clientPhone || "-"}
                  </span>
                </div>

                <div style={{ backgroundColor: "#F8FAFC", borderRadius: "0.85rem", padding: "1rem", border: "1px solid #E2E8F0" }}>
                  <span style={{ fontSize: "0.75rem", color: "#64748B", display: "block" }}>Plan Financiero</span>
                  <strong style={{ fontSize: "0.95rem", color: "#1F3652" }}>{selectedQuoteForDetail.planName}</strong>
                  <span style={{ fontSize: "0.75rem", color: "#64748B", display: "block", marginTop: "0.25rem" }}>
                    Asesor: {selectedQuoteForDetail.advisorName}
                  </span>
                </div>
              </div>

              {/* Economic Breakdown */}
              <div style={{ backgroundColor: "#F8FAFC", borderRadius: "0.85rem", padding: "1.25rem", border: "1px solid #E2E8F0", marginBottom: "1.25rem" }}>
                <h4 style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1F3652", margin: "0 0 0.75rem" }}>
                  Desglose de la Cotización
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem", fontSize: "0.85rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#64748B" }}>Precio de Lista:</span>
                    <strong style={{ color: "#1F3652" }}>{formatMoney(selectedQuoteForDetail.listPrice || selectedQuoteForDetail.totalQuoteAmount)}</strong>
                  </div>
                  {selectedQuoteForDetail.discountAmount > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", color: "#00C48C" }}>
                      <span>Descuento Aplicado ({selectedQuoteForDetail.discountPct}%):</span>
                      <strong>-{formatMoney(selectedQuoteForDetail.discountAmount)}</strong>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #E2E8F0", paddingTop: "0.45rem" }}>
                    <span style={{ fontWeight: 700, color: "#1F3652" }}>Precio Final Cotizado:</span>
                    <strong style={{ color: "#1F3652", fontSize: "1rem" }}>{formatMoney(selectedQuoteForDetail.totalQuoteAmount)}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#64748B", fontSize: "0.8rem", paddingTop: "0.25rem" }}>
                    <span>Enganche ({selectedQuoteForDetail.downPaymentPct}%):</span>
                    <strong>{formatMoney(selectedQuoteForDetail.downPaymentAmount)}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#64748B", fontSize: "0.8rem" }}>
                    <span>{selectedQuoteForDetail.installmentsCount} Mensualidades de:</span>
                    <strong>{formatMoney(selectedQuoteForDetail.installmentAmount)} c/u</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#64748B", fontSize: "0.8rem" }}>
                    <span>Liquidación contra entrega ({selectedQuoteForDetail.settlementPct}%):</span>
                    <strong>{formatMoney(selectedQuoteForDetail.settlementAmount)}</strong>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  {hasPermission("quotes.export") && (
                    <button
                      type="button"
                      onClick={() => handleDownloadQuotePDF(selectedQuoteForDetail)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.45rem",
                        padding: "0.6rem 1.1rem",
                        borderRadius: "9999px",
                        border: "1.5px solid #2F80ED",
                        backgroundColor: "#FFFFFF",
                        color: "#2F80ED",
                        fontSize: "0.82rem",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      <Download size={15} /> Descargar PDF
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleResendQuoteEmail(selectedQuoteForDetail)}
                    disabled={resendingQuoteId === selectedQuoteForDetail.id}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.45rem",
                      padding: "0.6rem 1.1rem",
                      borderRadius: "9999px",
                      border: "1px solid #E2E8F0",
                      backgroundColor: "#FFFFFF",
                      color: "#1F3652",
                      fontSize: "0.82rem",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    <Mail size={15} /> {resendingQuoteId === selectedQuoteForDetail.id ? "Enviando..." : "Reenviar por Correo"}
                  </button>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  {selectedQuoteForDetail.status !== "CONVERTIDA_A_VENTA" && hasPermission("quotes.convert_to_sale") && (
                    <button
                      type="button"
                      onClick={() => handleConvertQuoteToSale(selectedQuoteForDetail)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.45rem",
                        padding: "0.6rem 1.35rem",
                        borderRadius: "9999px",
                        backgroundColor: "#00C48C",
                        color: "#FFFFFF",
                        fontSize: "0.82rem",
                        fontWeight: 800,
                        border: "none",
                        cursor: "pointer",
                        boxShadow: "0 2px 6px rgba(0, 196, 140, 0.3)",
                      }}
                    >
                      <DollarSign size={15} /> Convertir a Venta
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setSelectedQuoteForDetail(null)}
                    style={{
                      padding: "0.6rem 1.25rem",
                      borderRadius: "9999px",
                      backgroundColor: "#1B3047",
                      color: "#FFFFFF",
                      border: "none",
                      fontWeight: 600,
                      fontSize: "0.82rem",
                      cursor: "pointer",
                    }}
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL REGISTRAR MOTIVO DE VENTA PERDIDA */}
        {/* ========================================================================= */}
        {lostReasonQuote && (
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
              zIndex: 10000,
              padding: "1rem",
              backdropFilter: "blur(4px)",
            }}
          >
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "1.25rem",
                width: "100%",
                maxWidth: "500px",
                boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
                padding: "1.75rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                <div>
                  <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#1F3652", margin: 0 }}>
                    Marcar Cotización como Perdida
                  </h3>
                  <p style={{ fontSize: "0.8rem", color: "#64748B", margin: "0.2rem 0 0" }}>
                    Folio {lostReasonQuote.folio} • Prospecto {lostReasonQuote.clientName}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setLostReasonQuote(null)}
                  style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer" }}
                >
                  <X size={20} />
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "1rem", margin: "1.25rem 0" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#1F3652", marginBottom: "0.35rem" }}>
                    Categoría del motivo
                  </label>
                  <select
                    value={lostReasonCategory}
                    onChange={(e) => setLostReasonCategory(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.6rem 0.85rem",
                      borderRadius: "0.65rem",
                      border: "1px solid #CBD5E1",
                      backgroundColor: "#FFFFFF",
                      fontSize: "0.85rem",
                      color: "#1F3652",
                      outline: "none",
                    }}
                  >
                    <option value="Precio fuera de presupuesto">Precio fuera de presupuesto</option>
                    <option value="Eligió otra opción / competencia">Eligió otra opción / competencia</option>
                    <option value="No le convenció ubicación o tipología">No le convenció ubicación o tipología</option>
                    <option value="Condiciones financieras insuficientes">Condiciones financieras insuficientes</option>
                    <option value="Sin respuesta / Prospecto inactivo">Sin respuesta / Prospecto inactivo</option>
                    <option value="Compra pospuesta para más adelante">Compra pospuesta para más adelante</option>
                    <option value="Otro motivo">Otro motivo</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#1F3652", marginBottom: "0.35rem" }}>
                    Comentarios o detalle adicional (opcional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Ej. El cliente mencionó que encontró un departamento en zona norte..."
                    value={lostReasonText}
                    onChange={(e) => setLostReasonText(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.6rem 0.85rem",
                      borderRadius: "0.65rem",
                      border: "1px solid #CBD5E1",
                      backgroundColor: "#FFFFFF",
                      fontSize: "0.85rem",
                      color: "#1F3652",
                      outline: "none",
                      resize: "none",
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem" }}>
                <button
                  type="button"
                  onClick={() => setLostReasonQuote(null)}
                  style={{
                    padding: "0.55rem 1.1rem",
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
                  type="button"
                  onClick={handleConfirmLostReason}
                  style={{
                    padding: "0.55rem 1.25rem",
                    borderRadius: "9999px",
                    border: "none",
                    backgroundColor: "#EB5757",
                    color: "#FFFFFF",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: "0 2px 6px rgba(235, 87, 87, 0.25)",
                  }}
                >
                  Confirmar Pérdida
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL SELECTOR DE UNIDAD PARA COTIZAR */}
        {/* ========================================================================= */}
        {showUnitPickerForQuote && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(10, 25, 47, 0.7)",
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
                maxWidth: "560px",
                maxHeight: "85vh",
                overflowY: "auto",
                boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
                padding: "1.75rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                <div>
                  <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#1F3652", margin: 0 }}>
                    Seleccionar Unidad a Cotizar
                  </h3>
                  <p style={{ fontSize: "0.8rem", color: "#64748B", margin: "0.2rem 0 0" }}>
                    Elige una unidad disponible en el inventario de {project.name}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowUnitPickerForQuote(false)}
                  style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer" }}
                >
                  <X size={20} />
                </button>
              </div>

              {availableUnitsForQuote.length === 0 ? (
                <div style={{ textAlign: "center", padding: "2.5rem 1rem" }}>
                  <p style={{ fontSize: "0.9rem", color: "#64748B" }}>
                    No hay unidades con estatus <strong>DISPONIBLE</strong> en este proyecto actualmente.
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  {availableUnitsForQuote.map((u) => (
                    <div
                      key={u.unit}
                      onClick={() => {
                        setSelectedUnitForQuoteModal(u);
                        setShowUnitPickerForQuote(false);
                        setShowQuoteWizardModal(true);
                      }}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "0.85rem 1rem",
                        borderRadius: "0.75rem",
                        border: "1px solid #E2E8F0",
                        backgroundColor: "#F8FAFC",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#FFFFFF";
                        e.currentTarget.style.borderColor = "#2F80ED";
                        e.currentTarget.style.boxShadow = "0 2px 8px rgba(47, 128, 237, 0.12)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "#F8FAFC";
                        e.currentTarget.style.borderColor = "#E2E8F0";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "8px",
                            backgroundColor: "rgba(31, 54, 82, 0.08)",
                            color: "#1F3652",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 800,
                            fontSize: "0.85rem",
                          }}
                        >
                          {u.unit}
                        </div>
                        <div>
                          <strong style={{ fontSize: "0.9rem", color: "#1F3652", display: "block" }}>
                            {u.type} • Nivel {u.floor}
                          </strong>
                          <span style={{ fontSize: "0.75rem", color: "#64748B" }}>
                            {u.areaM2} m² • Entrega: {u.deliveryDate || "Mayo 2028"}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <strong style={{ fontSize: "0.95rem", color: "#1F3652" }}>
                          {formatMoney(u.price)}
                        </strong>
                        <ChevronRight size={16} color="#94A3B8" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL DETALLE DE VENTA Y CONTRATO */}
        {/* ========================================================================= */}
        {selectedSale && (
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
                maxWidth: "640px",
                maxHeight: "90vh",
                overflowY: "auto",
                boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
                padding: "2rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
                <div>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#2F80ED", textTransform: "uppercase" }}>
                    Folio {selectedSale.folio}
                  </span>
                  <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#1F3652", margin: "0.2rem 0 0" }}>
                    Detalle de Venta • Unidad {selectedSale.unit}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedSale(null)}
                  style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer" }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Información del Cliente & Unidad */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
                <div style={{ backgroundColor: "#F8FAFC", borderRadius: "0.85rem", padding: "1rem", border: "1px solid #E2E8F0" }}>
                  <span style={{ fontSize: "0.75rem", color: "#64748B", display: "block" }}>Cliente Comprador</span>
                  <strong style={{ fontSize: "0.95rem", color: "#1F3652" }}>{selectedSale.clientName}</strong>
                  <span style={{ fontSize: "0.75rem", color: "#64748B", display: "block", marginTop: "0.25rem" }}>
                    {selectedSale.clientEmail} • {selectedSale.clientPhone}
                  </span>
                </div>

                <div style={{ backgroundColor: "#F8FAFC", borderRadius: "0.85rem", padding: "1rem", border: "1px solid #E2E8F0" }}>
                  <span style={{ fontSize: "0.75rem", color: "#64748B", display: "block" }}>Plan Financiero</span>
                  <strong style={{ fontSize: "0.95rem", color: "#1F3652" }}>{selectedSale.paymentPlan}</strong>
                  <span style={{ fontSize: "0.75rem", color: "#64748B", display: "block", marginTop: "0.25rem" }}>
                    Fecha de cierre: {selectedSale.saleDate}
                  </span>
                </div>
              </div>

              {/* Adicionales / Addons Incluidos */}
              {selectedSale.additionals && selectedSale.additionals.length > 0 && (
                <div style={{ backgroundColor: "#F8FAFC", borderRadius: "0.85rem", padding: "1.25rem", border: "1px solid #E2E8F0", marginBottom: "1.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                    <h4 style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1F3652", margin: 0, display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <Package size={15} color="#2F80ED" /> Adicionales / Addons Incluidos ({selectedSale.additionals.length})
                    </h4>
                    <span style={{ fontSize: "0.75rem", color: "#64748B" }}>
                      Total Adicionales: <strong style={{ color: "#1F3652" }}>{formatMoney(selectedSale.additionals.reduce((sum, a) => sum + (a.price || 0), 0))}</strong>
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                    {selectedSale.additionals.map((addon, aIdx) => (
                      <div
                        key={addon.id || aIdx}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          backgroundColor: "#FFFFFF",
                          padding: "0.55rem 0.85rem",
                          borderRadius: "0.5rem",
                          border: "1px solid #E2E8F0",
                          fontSize: "0.82rem",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <Box size={14} color="#2F80ED" />
                          <strong style={{ color: "#1F3652" }}>{addon.name}</strong>
                          <span style={{ fontSize: "0.72rem", color: "#64748B", textTransform: "capitalize", backgroundColor: "#F1F5F9", padding: "0.1rem 0.4rem", borderRadius: "4px" }}>
                            {addon.category}
                          </span>
                          {addon.areaM2 && (
                            <span style={{ fontSize: "0.72rem", color: "#64748B" }}>({addon.areaM2} m²)</span>
                          )}
                        </div>
                        <span style={{ fontWeight: 700, color: "#1F3652" }}>
                          {formatMoney(addon.price)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Desglose Económico */}
              <div style={{ backgroundColor: "#F8FAFC", borderRadius: "0.85rem", padding: "1.25rem", border: "1px solid #E2E8F0", marginBottom: "1.5rem" }}>
                <h4 style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1F3652", margin: "0 0 0.75rem" }}>Desglose de Pago</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.85rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#64748B" }}>Precio Total Pactado:</span>
                    <strong style={{ color: "#1F3652" }}>{formatMoney(selectedSale.totalPrice)}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#64748B" }}>Monto Total Pagado:</span>
                    <strong style={{ color: "#00C48C" }}>{formatMoney(selectedSale.paidAmount)}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #E2E8F0", paddingTop: "0.5rem" }}>
                    <span style={{ color: "#64748B", fontWeight: 600 }}>Saldo Restante Por Pagar:</span>
                    <strong style={{ color: "#1F3652", fontSize: "1rem" }}>{formatMoney(selectedSale.pendingAmount)}</strong>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
                <button
                  type="button"
                  onClick={() => {
                    showToast("Contrato Descargado", `Se descargó el contrato en PDF para la venta ${selectedSale.folio}.`);
                  }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.45rem",
                    padding: "0.55rem 1.15rem",
                    borderRadius: "9999px",
                    border: "1px solid #CBD5E1",
                    backgroundColor: "#FFFFFF",
                    color: "#1F3652",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  <FileText size={15} color="#2F80ED" /> Descargar Contrato (PDF)
                </button>

                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setSaleToEdit(selectedSale);
                      setShowEditSaleModal(true);
                      setSelectedSale(null);
                    }}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.45rem",
                      padding: "0.55rem 1.15rem",
                      borderRadius: "9999px",
                      border: "1.5px solid #00C48C",
                      backgroundColor: "#FFFFFF",
                      color: "#00C48C",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    <Edit3 size={14} /> Editar Venta & Adicionales
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedSale(null)}
                    style={{
                      padding: "0.55rem 1.35rem",
                      borderRadius: "9999px",
                      backgroundColor: "#1B3047",
                      color: "#FFFFFF",
                      border: "none",
                      fontWeight: 600,
                      fontSize: "0.85rem",
                      cursor: "pointer",
                    }}
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL EDITAR VENTA & ADICIONALES */}
        {showEditSaleModal && saleToEdit && (
          <EditSaleModal
            isOpen={showEditSaleModal}
            onClose={() => {
              setShowEditSaleModal(false);
              setSaleToEdit(null);
            }}
            project={project}
            sale={saleToEdit}
          />
        )}

        {/* MODAL 5-STEP CREAR NUEVA VENTA */}
        <CreateSaleWizardModal
          isOpen={showNewSaleModal}
          onClose={() => {
            setShowNewSaleModal(false);
            setSelectedQuoteToConvert(null);
          }}
          projects={projects}
          initialProjectId={projectId}
          initialQuote={selectedQuoteToConvert}
          onSaleCreated={(sale) => {
            handleSaleCreated(sale);
            setSelectedQuoteToConvert(null);
          }}
        />

        {/* MODAL 4-STEP COTIZAR UNIDAD */}
        {showQuoteWizardModal && selectedUnitForQuoteModal && (
          <QuoteUnitWizardModal
            isOpen={showQuoteWizardModal}
            onClose={() => {
              setShowQuoteWizardModal(false);
              setSelectedUnitForQuoteModal(null);
            }}
            unit={selectedUnitForQuoteModal}
            projectId={projectId}
            projectName={project.name}
            currency={project.currency || "MXN"}
            initialAdditionals={project.additionals || []}
            onQuoteGenerated={(qData) => {
              setShowQuoteWizardModal(false);
              setSelectedUnitForQuoteModal(null);
              setActiveTab("QUOTES");
            }}
          />
        )}
      </main>
    </AppLayout>
  );
}

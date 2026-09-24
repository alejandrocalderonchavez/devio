"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  Home,
  User,
  ArrowRight,
  ArrowLeft,
  Calendar,
  Building2,
  FileText,
  CreditCard,
  ShoppingBag,
  ChevronDown,
  ChevronUp,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  X,
  Phone,
  Mail,
  MapPin,
  Check,
  LogOut,
  Search,
  ExternalLink,
  DollarSign,
  AlertTriangle,
  Loader2,
  ShieldCheck,
  Eye,
  Trash2,
  Lock,
  Globe,
  HelpCircle,
  ChevronRight,
} from "lucide-react";
import { openReceiptInNewTab, openStatementInNewTab } from "../../lib/pdf-generator";

const round2 = (num: number) => Math.round((Number(num || 0) + Number.EPSILON) * 100) / 100;

function parseDateFlexible(dateStr: string): Date | null {
  if (!dateStr || typeof dateStr !== "string") return null;
  const clean = dateStr.trim();
  if (!clean || clean.toLowerCase() === "pendiente" || clean.toLowerCase() === "parcial" || clean === "-") return null;

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

  // Handle Spanish text dates like "18 Sep 2026", "15 Abr 2026"
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
}

function formatDateDisplay(dateStr: string): string {
  if (!dateStr || dateStr.toLowerCase() === "pendiente" || dateStr.toLowerCase() === "parcial") {
    return dateStr || "-";
  }
  const d = parseDateFlexible(dateStr);
  if (!d) return dateStr;
  return d.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}

interface ScheduleInstallment {
  id: string;
  cuotaNumber: number;
  concept: string;
  montoProgramado: number;
  fechaProgramada: string;
  montoPagado: number;
  montoPendiente: number;
  fechaPago: string;
  planPago: string;
  metodoPago: string;
  status: "Pagado" | "Pendiente" | "Atrasado" | "Parcial";
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
  notes?: string;
  moratoryAmount?: number;
}

interface ClientProperty {
  id: string;
  developerName: string;
  developerLogo?: string;
  projectName: string;
  projectLogo?: string;
  projectAddress: string;
  unitNumber: string;
  unitType: string;
  totalPrice: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  nextPaymentAmount: number;
  nextPaymentDueDate: string;
  nextPaymentDaysRemaining: number;
  nextPaymentConcept: string;
  constructionPct: number;
  lastProgressUpdateDate: string;
  estimatedDeliveryDate: string;
  areaM2: number;
  bedrooms: number;
  bathrooms: number;
  parkingSpots?: number;
  storageUnits?: number;
  floorLevel?: number;
  maintenanceFeeMonthly?: number;
  images: string[];
  specialtiesProgress: Array<{ id: string; name: string; percentage: number }>;
  constructionMilestones: Array<{ id: string; title: string; date: string; photo: string; description: string }>;
  documents: Array<{ id: string; title: string; category: string; fileSize: string; uploadDate: string; fileUrl?: string }>;
  schedule: ScheduleInstallment[];
  paymentsList: PaymentReceipt[];
  customAttributes: Array<{ label: string; value: string }>;
}

interface ClientNotification {
  id: string;
  title: string;
  body: string;
  time: string;
  type: "warning" | "success" | "info";
  read: boolean;
}

export default function ClientPortalWeb() {
  const router = useRouter();

  // Loading & Session State
  const [isLoading, setIsLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [userRfc, setUserRfc] = useState("");
  const [userAddress, setUserAddress] = useState("");
  const [userAvatar, setUserAvatar] = useState("");

  // Navigation State
  const [activeTab, setActiveTab] = useState<"properties" | "profile">("properties");
  const [screen, setScreen] = useState<"main" | "detail" | "construction" | "documents" | "statement">("main");
  const [properties, setProperties] = useState<ClientProperty[]>([]);
  const [selectedPropId, setSelectedPropId] = useState<string>("");
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [unitInfoExpanded, setUnitInfoExpanded] = useState(true);
  const [docSearch, setDocSearch] = useState("");
  const [statementSubTab, setStatementSubTab] = useState<"statement" | "payments">("statement");

  // Modals & Viewers
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedVoucherForView, setSelectedVoucherForView] = useState<PaymentReceipt | null>(null);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  // Notifications State (Dynamic)
  const [notifications, setNotifications] = useState<ClientNotification[]>([]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Load Session and Fetch Real Data
  useEffect(() => {
    async function loadClientData() {
      if (typeof window === "undefined") return;

      const rawSession = localStorage.getItem("devio_user_session") || sessionStorage.getItem("devio_user_session");
      let sessionEmail = "";

      if (rawSession) {
        try {
          const session = JSON.parse(rawSession);
          if (session.email) {
            sessionEmail = session.email.toLowerCase().trim();
            setUserEmail(sessionEmail);
            setUserName(session.fullName || session.name || "Cliente Devio");
            if (session.phone) setUserPhone(session.phone);
            if (session.rfc) setUserRfc(session.rfc);
            if (session.address) setUserAddress(session.address);
            setUserAvatar(
              session.avatarUrl ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(session.fullName || session.name || "Cliente")}&background=1F3652&color=fff&bold=true`
            );
          }
        } catch (e) {}
      }

      if (!sessionEmail) {
        router.push("/login");
        return;
      }

      try {
        setIsLoading(true);
        const res = await fetch(`/api/client/properties?email=${encodeURIComponent(sessionEmail)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setUserName(data.user.name || userName);
            if (data.user.phone) setUserPhone(data.user.phone);
            if (data.user.rfc) setUserRfc(data.user.rfc);
            if (data.user.address) setUserAddress(data.user.address);
          }
          if (Array.isArray(data.properties) && data.properties.length > 0) {
            setProperties(data.properties);
            setSelectedPropId(data.properties[0].id);
          } else {
            setProperties([]);
          }
        }
      } catch (err) {
        console.error("Error fetching client properties:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadClientData();
  }, [router]);

  // Load & build dynamic notifications from real client data
  useEffect(() => {
    if (!userEmail) return;
    const dismissedKey = `devio_dismissed_notifs_${userEmail}`;
    let dismissedIds: string[] = [];
    try {
      const stored = localStorage.getItem(dismissedKey);
      if (stored) dismissedIds = JSON.parse(stored);
    } catch (e) {}

    const generated: ClientNotification[] = [];

    properties.forEach((p) => {
      // 1. Notificación de cuota pendiente o morosidad
      if (p.overdueAmount > 0) {
        generated.push({
          id: `notif-overdue-${p.id}`,
          title: `Saldo Vencido • Unidad ${p.unitNumber}`,
          body: `Presentas un saldo vencido por ${formatMoney(p.overdueAmount)} en ${p.projectName}. Te sugerimos regularizar tu pago a la brevedad.`,
          time: "Atención",
          type: "warning",
          read: false,
        });
      } else if (p.nextPaymentAmount > 0 && p.nextPaymentDueDate) {
        const isPast = p.nextPaymentDaysRemaining < 0;
        generated.push({
          id: `notif-next-${p.id}-${p.nextPaymentDueDate}`,
          title: `${isPast ? "Cuota Vencida" : "Próximo Vencimiento"} • Unidad ${p.unitNumber}`,
          body: `Tu cuota de ${formatMoney(p.nextPaymentAmount)} (${p.nextPaymentConcept || "Mensualidad"}) vence el ${formatDateDisplay(p.nextPaymentDueDate)} (${isPast ? `${Math.abs(p.nextPaymentDaysRemaining)} días vencido` : `${p.nextPaymentDaysRemaining} días restantes`}).`,
          time: isPast ? "Vencido" : "Programado",
          type: isPast ? "warning" : "info",
          read: false,
        });
      }

      // 2. Notificación de último pago aplicado
      if (p.paymentsList && p.paymentsList.length > 0 && p.paymentsList[0]) {
        const latest = p.paymentsList[0];
        generated.push({
          id: `notif-pay-${p.id}-${latest.id || latest.fechaPago}`,
          title: `Pago Acreditado • Unidad ${p.unitNumber}`,
          body: `Tu abono de ${formatMoney(latest.monto)} vía ${latest.metodoPago || "Transferencia SPEI"} (${formatDateDisplay(latest.fechaPago)}) fue registrado y aplicado a tu saldo.`,
          time: formatDateDisplay(latest.fechaPago),
          type: "success",
          read: true,
        });
      }

      // 3. Notificación de avance de obra
      if (p.constructionPct > 0) {
        generated.push({
          id: `notif-prog-${p.id}-${p.constructionPct}`,
          title: `Avance de Obra • ${p.projectName}`,
          body: `El proyecto registra un avance general del ${p.constructionPct}% con bitácora fotográfica actualizada.`,
          time: "Obra",
          type: "info",
          read: true,
        });
      }
    });

    const active = generated.filter((n) => !dismissedIds.includes(n.id));
    setNotifications(active);
  }, [properties, userEmail]);

  const handleDeleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (userEmail && typeof window !== "undefined") {
      try {
        const dismissedKey = `devio_dismissed_notifs_${userEmail}`;
        const stored = localStorage.getItem(dismissedKey);
        const list: string[] = stored ? JSON.parse(stored) : [];
        if (!list.includes(id)) list.push(id);
        localStorage.setItem(dismissedKey, JSON.stringify(list));
      } catch (e) {}
    }
  };

  const handleClearAllNotifications = () => {
    const allIds = notifications.map((n) => n.id);
    setNotifications([]);
    if (userEmail && typeof window !== "undefined") {
      try {
        const dismissedKey = `devio_dismissed_notifs_${userEmail}`;
        const stored = localStorage.getItem(dismissedKey);
        const list: string[] = stored ? JSON.parse(stored) : [];
        allIds.forEach((id) => {
          if (!list.includes(id)) list.push(id);
        });
        localStorage.setItem(dismissedKey, JSON.stringify(list));
      } catch (e) {}
    }
  };

  const selectedProp: ClientProperty | null = useMemo(() => {
    if (properties.length === 0) return null;
    return properties.find((p) => p.id === selectedPropId) || properties[0] || null;
  }, [properties, selectedPropId]);

  const formatMoney = (val: number) =>
    new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 2 }).format(val || 0);

  const formatMoneyCompact = (val: number) =>
    new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0 }).format(val || 0);

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      document.cookie = "devio_auth_token=; path=/; max-age=0;";
      document.cookie = "devio_user_role=; path=/; max-age=0;";
      localStorage.removeItem("devio_user_session");
      sessionStorage.removeItem("devio_user_session");
    }
    router.push("/login");
  };

  const filteredDocs = useMemo(() => {
    if (!selectedProp) return [];
    return (selectedProp.documents || []).filter((d) =>
      d.title.toLowerCase().includes(docSearch.toLowerCase()) ||
      d.category.toLowerCase().includes(docSearch.toLowerCase())
    );
  }, [selectedProp, docSearch]);

  // Open Official PDF Receipt
  const handleOpenReceipt = (receipt: PaymentReceipt) => {
    if (!selectedProp) return;
    openReceiptInNewTab({
      folio: receipt.reciboFolio || `REC-${selectedProp.unitNumber}-001`,
      projectName: selectedProp.projectName,
      unitNumber: selectedProp.unitNumber,
      clientName: userName,
      paymentMethod: receipt.metodoPago || "Transferencia SPEI",
      totalAmount: receipt.monto,
      capitalAmount: receipt.moratoryAmount ? Math.max(0, receipt.monto - receipt.moratoryAmount) : receipt.monto,
      interestAmount: receipt.moratoryAmount || 0,
      planName: "Plan Personalizado",
      emissionDate: formatDateDisplay(receipt.fechaPago),
      developerName: selectedProp.developerName,
      developerLogoUrl: selectedProp.developerLogo,
      projectLogoUrl: selectedProp.projectLogo,
    });
  };

  // Compute Next Payment dynamically from schedule
  const nextPaymentInfo = useMemo(() => {
    if (!selectedProp) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const pendingCuotas = (selectedProp.schedule || []).filter((s) => round2(s.montoPendiente) > 0.05);
    if (pendingCuotas.length === 0) {
      return {
        amount: 0,
        dueDate: "Al corriente",
        formattedDueDate: "Al corriente",
        daysRemaining: 0,
        concept: "Sin pagos pendientes",
        isAllPaid: true,
        hasOverdue: false,
        overdueAmount: 0,
        cuotaStatus: "Pagado" as const,
      };
    }

    const nextCuota = pendingCuotas[0]!;
    const instDate = parseDateFlexible(nextCuota.fechaProgramada);
    let diffDays = 30;
    if (instDate) {
      diffDays = Math.ceil((instDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    }

    const overdueCuotas = pendingCuotas.filter((s) => s.status === "Atrasado");
    const totalOverdue = round2(overdueCuotas.reduce((acc, s) => acc + s.montoPendiente, 0));

    return {
      amount: round2(nextCuota.montoPendiente),
      dueDate: nextCuota.fechaProgramada,
      formattedDueDate: formatDateDisplay(nextCuota.fechaProgramada),
      daysRemaining: diffDays,
      concept: nextCuota.concept,
      isAllPaid: false,
      hasOverdue: totalOverdue > 0,
      overdueAmount: totalOverdue || selectedProp.overdueAmount,
      cuotaStatus: nextCuota.status,
    };
  }, [selectedProp]);

  // Loading Screen
  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#F8FAFC", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: "1rem" }}>
        <Loader2 size={36} color="#1F3652" className="animate-spin" />
        <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#1F3652" }}>
          Cargando tu información...
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F8FAFC", display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "0", boxSizing: "border-box" }}>
      
      {/* Responsive Container */}
      <div
        style={{
          width: "100%",
          maxWidth: "880px",
          minHeight: "100vh",
          backgroundColor: "#F8FAFC",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          boxShadow: "0 4px 25px rgba(0,0,0,0.06)",
          boxSizing: "border-box",
        }}
      >
        {/* HEADER */}
        <div
          style={{
            backgroundColor: "#1F3652",
            color: "#FFFFFF",
            paddingTop: "2rem",
            paddingBottom: "1.35rem",
            paddingLeft: "1.25rem",
            paddingRight: "1.25rem",
            borderBottomLeftRadius: "1.5rem",
            borderBottomRightRadius: "1.5rem",
            boxShadow: "0 4px 16px rgba(31,54,82,0.18)",
            zIndex: 10,
          }}
        >
          {screen === "main" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <img
                  src="/brand/logo-horizontal-light.png"
                  alt="Devio"
                  style={{ height: "28px", width: "auto", objectFit: "contain", display: "block" }}
                />

                <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                  <button
                    onClick={() => setShowNotifications(true)}
                    style={{
                      position: "relative",
                      width: "38px",
                      height: "38px",
                      borderRadius: "50%",
                      backgroundColor: "rgba(255,255,255,0.15)",
                      border: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                  >
                    <Bell size={18} color="#FFFFFF" />
                    {unreadCount > 0 && (
                      <span
                        style={{
                          position: "absolute",
                          top: "-2px",
                          right: "-2px",
                          backgroundColor: "#EF4444",
                          color: "#FFFFFF",
                          borderRadius: "10px",
                          fontSize: "10px",
                          fontWeight: 800,
                          minWidth: "16px",
                          height: "16px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: "2px solid #1F3652",
                        }}
                      >
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => { setActiveTab("profile"); setScreen("main"); }}
                    style={{
                      width: "38px",
                      height: "38px",
                      borderRadius: "50%",
                      overflow: "hidden",
                      border: "2px solid rgba(255,255,255,0.5)",
                      padding: 0,
                      cursor: "pointer",
                    }}
                  >
                    <img
                      src={userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=1F3652&color=fff&bold=true`}
                      alt={userName}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </button>
                </div>
              </div>

              {activeTab === "properties" ? (
                <div>
                  <div style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.8)", fontWeight: 500 }}>Bienvenido de nuevo,</div>
                  <div style={{ fontSize: "1.45rem", fontWeight: 800, letterSpacing: "-0.02em" }}>{userName}</div>
                </div>
              ) : (
                <div style={{ fontSize: "1.35rem", fontWeight: 800 }}>Mi Perfil de Cliente</div>
              )}
            </div>
          ) : (
            /* Sub-screen Header with Back Arrow */
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <button
                onClick={() => setScreen("main")}
                style={{
                  background: "rgba(255,255,255,0.18)",
                  border: "none",
                  borderRadius: "50%",
                  width: "38px",
                  height: "38px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#FFFFFF",
                  cursor: "pointer",
                }}
              >
                <ArrowLeft size={20} />
              </button>

              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.8)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {screen === "detail" ? "Detalle de Propiedad" : (screen === "construction" ? "Avance de Obra" : (screen === "documents" ? "Documentación Oficial" : "Estado de Cuenta y Pagos"))}
                </div>
                <div style={{ fontSize: "1.05rem", fontWeight: 800 }}>{selectedProp?.projectName} · Unidad {selectedProp?.unitNumber}</div>
              </div>

              <div style={{ width: "38px" }} />
            </div>
          )}
        </div>

        {/* SCROLLABLE BODY */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem", paddingBottom: "6rem" }}>
          
          {/* TAB 1: PROPIEDADES */}
          {activeTab === "properties" && (
            <>
              {/* Empty state if no properties */}
              {properties.length === 0 ? (
                <div style={{ backgroundColor: "#FFFFFF", borderRadius: "1.25rem", padding: "3rem 1.5rem", textAlign: "center", border: "1px solid #E2E8F0" }}>
                  <Building2 size={48} color="#94A3B8" style={{ margin: "0 auto 1rem auto" }} />
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#1F3652", marginBottom: "0.5rem" }}>
                    No se encontraron propiedades vinculadas
                  </h3>
                  <p style={{ fontSize: "0.85rem", color: "#64748B", maxWidth: "420px", margin: "0 auto" }}>
                    Tu cuenta ({userEmail}) no tiene unidades formalizadas registradas actualmente. Si adquiriste una propiedad, contacta a tu asesor comercial.
                  </p>
                </div>
              ) : (
                <>
                  {/* PANTALLA 1: LISTA PRINCIPAL (MIS PROPIEDADES) */}
                  {screen === "main" && selectedProp && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                      
                      {/* Banner: Tu Próximo Pago (Clean, dynamic & accurate) */}
                      {nextPaymentInfo && (
                        <div
                          style={{
                            backgroundColor: "#FFFFFF",
                            borderRadius: "1.25rem",
                            padding: "1.25rem 1.4rem",
                            boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
                            border: "1px solid #E2E8F0",
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.6rem",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span
                              style={{
                                fontSize: "0.72rem",
                                fontWeight: 800,
                                letterSpacing: "0.04em",
                                color: nextPaymentInfo.isAllPaid ? "#065F46" : (nextPaymentInfo.cuotaStatus === "Atrasado" ? "#991B1B" : "#1F3652"),
                                backgroundColor: nextPaymentInfo.isAllPaid ? "#D1FAE5" : (nextPaymentInfo.cuotaStatus === "Atrasado" ? "#FEE2E2" : "#FEF3C7"),
                                padding: "0.25rem 0.65rem",
                                borderRadius: "99px",
                                textTransform: "uppercase",
                              }}
                            >
                              {nextPaymentInfo.isAllPaid ? "✓ Al Corriente" : (nextPaymentInfo.cuotaStatus === "Atrasado" ? "⚠️ Cuota Vencida" : "Tu Próximo Pago")}
                            </span>
                            
                            <span style={{ fontSize: "0.78rem", color: "#64748B", fontWeight: 600 }}>
                              {nextPaymentInfo.isAllPaid
                                ? "Sin adeudos"
                                : nextPaymentInfo.daysRemaining < 0
                                ? <span style={{ color: "#DC2626", fontWeight: 700 }}>{Math.abs(nextPaymentInfo.daysRemaining)} días vencido</span>
                                : nextPaymentInfo.daysRemaining === 0
                                ? <span style={{ color: "#D97706", fontWeight: 700 }}>Vence hoy</span>
                                : `${nextPaymentInfo.daysRemaining} días restantes`}
                            </span>
                          </div>

                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "0.5rem" }}>
                            <div>
                              <div style={{ fontSize: "1.75rem", fontWeight: 900, color: "#1F3652", letterSpacing: "-0.02em" }}>
                                {formatMoney(nextPaymentInfo.amount)}
                              </div>
                              <div style={{ fontSize: "0.8rem", color: "#64748B", marginTop: "2px" }}>
                                {nextPaymentInfo.isAllPaid
                                  ? `${selectedProp.projectName} (${selectedProp.unitNumber}) - 100% Liquidado`
                                  : `${nextPaymentInfo.concept} • Vence el ${nextPaymentInfo.formattedDueDate} • ${selectedProp.projectName} (${selectedProp.unitNumber})`}
                              </div>
                            </div>

                            <button
                              onClick={() => {
                                setSelectedPropId(selectedProp.id);
                                setScreen("statement");
                                setStatementSubTab("statement");
                              }}
                              style={{
                                backgroundColor: "#1F3652",
                                color: "#FFFFFF",
                                padding: "0.55rem 1.1rem",
                                borderRadius: "0.6rem",
                                border: "none",
                                fontSize: "0.78rem",
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                            >
                              Ver Pagos & Recibos
                            </button>
                          </div>

                          {nextPaymentInfo.hasOverdue && nextPaymentInfo.overdueAmount > 0 && (
                            <div
                              style={{
                                marginTop: "0.4rem",
                                backgroundColor: "#FEF2F2",
                                border: "1px solid #FECACA",
                                borderRadius: "0.6rem",
                                padding: "0.6rem 0.85rem",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                fontSize: "0.78rem",
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#DC2626", fontWeight: 700 }}>
                                <AlertTriangle size={15} />
                                <span>Saldo Vencido Acumulado</span>
                              </div>
                              <span style={{ color: "#DC2626", fontWeight: 900 }}>{formatMoney(nextPaymentInfo.overdueAmount)}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* List of Properties */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "#1F3652" }}>
                          Tus Propiedades Adquiridas ({properties.length})
                        </span>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: properties.length > 1 ? "repeat(auto-fit, minmax(320px, 1fr))" : "1fr", gap: "1rem" }}>
                        {properties.map((prop) => (
                          <div
                            key={prop.id}
                            onClick={() => {
                              setSelectedPropId(prop.id);
                              setSelectedImageIdx(0);
                              setScreen("detail");
                            }}
                            style={{
                              backgroundColor: "#FFFFFF",
                              borderRadius: "1.25rem",
                              overflow: "hidden",
                              boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
                              border: "1px solid #E2E8F0",
                              cursor: "pointer",
                              transition: "transform 0.15s ease, box-shadow 0.15s ease",
                            }}
                          >
                            <div style={{ position: "relative", height: "180px", backgroundColor: "#E2E8F0" }}>
                              <img
                                src={prop.images[0] || "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=80"}
                                alt={prop.projectName}
                                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                              />
                              <div
                                style={{
                                  position: "absolute",
                                  top: "12px",
                                  left: "12px",
                                  backgroundColor: "rgba(31, 54, 82, 0.9)",
                                  color: "#FFFFFF",
                                  padding: "0.25rem 0.75rem",
                                  borderRadius: "99px",
                                  fontSize: "0.72rem",
                                  fontWeight: 800,
                                }}
                              >
                                {prop.developerName}
                              </div>
                              <div
                                style={{
                                  position: "absolute",
                                  bottom: "12px",
                                  right: "12px",
                                  backgroundColor: "rgba(0, 0, 0, 0.8)",
                                  color: "#FFFFFF",
                                  padding: "0.25rem 0.65rem",
                                  borderRadius: "0.45rem",
                                  fontSize: "0.75rem",
                                  fontWeight: 800,
                                }}
                              >
                                Unidad {prop.unitNumber}
                              </div>
                            </div>

                            <div style={{ padding: "1.1rem" }}>
                              <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#1F3652" }}>
                                {prop.projectName}
                              </div>
                              <div style={{ fontSize: "0.75rem", color: "#64748B", marginTop: "3px" }}>
                                {prop.projectAddress}
                              </div>

                              {/* Specs row */}
                              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
                                <span style={{ fontSize: "0.72rem", backgroundColor: "#F1F5F9", color: "#334155", padding: "0.25rem 0.6rem", borderRadius: "0.4rem", fontWeight: 700 }}>
                                  {prop.areaM2} m²
                                </span>
                                <span style={{ fontSize: "0.72rem", backgroundColor: "#F1F5F9", color: "#334155", padding: "0.25rem 0.6rem", borderRadius: "0.4rem", fontWeight: 700 }}>
                                  {prop.bedrooms} Recámaras
                                </span>
                                <span style={{ fontSize: "0.72rem", backgroundColor: "#F1F5F9", color: "#334155", padding: "0.25rem 0.6rem", borderRadius: "0.4rem", fontWeight: 700 }}>
                                  {prop.bathrooms} Baños
                                </span>
                              </div>

                              {/* Obra progress bar */}
                              <div style={{ marginTop: "1rem" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", fontWeight: 700, marginBottom: "4px" }}>
                                  <span style={{ color: "#475569" }}>Avance de Obra</span>
                                  <span style={{ color: "#00875A" }}>{prop.constructionPct}%</span>
                                </div>
                                <div style={{ height: "8px", backgroundColor: "#E2E8F0", borderRadius: "99px", overflow: "hidden" }}>
                                  <div style={{ width: `${prop.constructionPct}%`, height: "100%", backgroundColor: "#00C48C", borderRadius: "99px" }} />
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* PANTALLA 2: DETALLE DE PROPIEDAD */}
                  {screen === "detail" && selectedProp && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
                      
                      {/* Photo Carousel & Thumbnails */}
                      <div style={{ backgroundColor: "#FFFFFF", borderRadius: "1.25rem", overflow: "hidden", border: "1px solid #E2E8F0" }}>
                        <div style={{ height: "240px", width: "100%", position: "relative", backgroundColor: "#E2E8F0" }}>
                          <img
                            src={selectedProp.images[selectedImageIdx] || selectedProp.images[0]}
                            alt="Foto Propiedad"
                            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                          />
                        </div>
                        {selectedProp.images.length > 1 && (
                          <div style={{ display: "flex", gap: "0.6rem", padding: "0.75rem", backgroundColor: "#F8FAFC", overflowX: "auto" }}>
                            {selectedProp.images.map((img, idx) => (
                              <button
                                key={idx}
                                onClick={() => setSelectedImageIdx(idx)}
                                style={{
                                  width: "65px",
                                  height: "46px",
                                  borderRadius: "0.45rem",
                                  overflow: "hidden",
                                  border: selectedImageIdx === idx ? "2.5px solid #1F3652" : "1px solid #CBD5E1",
                                  cursor: "pointer",
                                  padding: 0,
                                  flexShrink: 0,
                                }}
                              >
                                <img src={img} alt="Thumb" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Payment Pills & Balance Button */}
                      {nextPaymentInfo && (
                        <div style={{ backgroundColor: "#FFFFFF", borderRadius: "1.25rem", padding: "1.2rem", border: "1px solid #E2E8F0" }}>
                          <div style={{ display: "flex", gap: "0.75rem", marginBottom: "0.85rem", flexWrap: "wrap" }}>
                            <div style={{ flex: 1, minWidth: "140px", backgroundColor: "#FEF3C7", border: "1px solid #FDE68A", borderRadius: "0.75rem", padding: "0.75rem 0.85rem" }}>
                              <div style={{ fontSize: "0.7rem", color: "#92400E", fontWeight: 700 }}>Tu Próximo Pago</div>
                              <div style={{ fontSize: "1.15rem", fontWeight: 900, color: "#78350F", marginTop: "2px" }}>
                                {formatMoney(nextPaymentInfo.amount)}
                              </div>
                              <div style={{ fontSize: "0.68rem", color: "#92400E", marginTop: "2px" }}>
                                {nextPaymentInfo.isAllPaid ? "Al corriente" : `Vence ${nextPaymentInfo.formattedDueDate}`}
                              </div>
                            </div>
                            
                            <div style={{ flex: 1, minWidth: "140px", backgroundColor: "#FEE2E2", border: "1px solid #FECACA", borderRadius: "0.75rem", padding: "0.75rem 0.85rem" }}>
                              <div style={{ fontSize: "0.7rem", color: "#991B1B", fontWeight: 700 }}>Saldo Vencido</div>
                              <div style={{ fontSize: "1.15rem", fontWeight: 900, color: "#7F1D1D", marginTop: "2px" }}>
                                {formatMoney(nextPaymentInfo.overdueAmount || 0)}
                              </div>
                              <div style={{ fontSize: "0.68rem", color: "#991B1B", marginTop: "2px" }}>
                                {nextPaymentInfo.overdueAmount > 0 ? "Cuotas atrasadas" : "Sin adeudo vencido"}
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => { setScreen("statement"); setStatementSubTab("statement"); }}
                            style={{
                              width: "100%",
                              padding: "0.8rem",
                              backgroundColor: "#1F3652",
                              color: "#FFFFFF",
                              border: "none",
                              borderRadius: "0.65rem",
                              fontWeight: 800,
                              fontSize: "0.85rem",
                              cursor: "pointer",
                            }}
                          >
                            Ver Saldo y Calendario de Pagos
                          </button>
                        </div>
                      )}

                      {/* Avance de Obra Summary Card */}
                      <div style={{ backgroundColor: "#FFFFFF", borderRadius: "1.25rem", padding: "1.2rem", border: "1px solid #E2E8F0" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <div style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 700 }}>Avance General de Obra</div>
                            <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#00875A", marginTop: "2px" }}>
                              {selectedProp.constructionPct}%
                            </div>
                          </div>
                          <button
                            onClick={() => setScreen("construction")}
                            style={{
                              backgroundColor: "#F1F5F9",
                              color: "#1F3652",
                              border: "none",
                              padding: "0.55rem 1rem",
                              borderRadius: "0.6rem",
                              fontSize: "0.8rem",
                              fontWeight: 800,
                              cursor: "pointer",
                            }}
                          >
                            Ver Avances y Fotos
                          </button>
                        </div>
                      </div>

                      {/* Resumen Financiero */}
                      <div style={{ backgroundColor: "#FFFFFF", borderRadius: "1.25rem", padding: "1.2rem", border: "1px solid #E2E8F0" }}>
                        <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#1F3652", marginBottom: "0.85rem" }}>
                          Resumen Financiero
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem", fontSize: "0.82rem" }}>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ color: "#64748B" }}>Precio Total de Venta:</span>
                            <strong style={{ color: "#1E293B" }}>{formatMoney(selectedProp.totalPrice)}</strong>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ color: "#64748B" }}>Total Pagado a la Fecha:</span>
                            <strong style={{ color: "#00875A" }}>{formatMoney(selectedProp.paidAmount)}</strong>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ color: "#64748B" }}>Saldo Pendiente por Liquidar:</span>
                            <strong style={{ color: "#B45309" }}>{formatMoney(selectedProp.pendingAmount)}</strong>
                          </div>
                          {selectedProp.overdueAmount > 0 && (
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                              <span style={{ color: "#DC2626", fontWeight: 700 }}>Saldo Vencido Atrasado:</span>
                              <strong style={{ color: "#DC2626" }}>{formatMoney(selectedProp.overdueAmount)}</strong>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Acciones Rápidas */}
                      <div style={{ display: "flex", gap: "0.75rem" }}>
                        <button
                          onClick={() => setScreen("documents")}
                          style={{
                            flex: 1,
                            padding: "0.85rem 0.6rem",
                            backgroundColor: "#FFFFFF",
                            border: "1px solid #E2E8F0",
                            borderRadius: "0.85rem",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "0.35rem",
                            cursor: "pointer",
                          }}
                        >
                          <FileText size={20} color="#1F3652" />
                          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#1F3652" }}>Documentos</span>
                        </button>

                        <button
                          onClick={() => { setScreen("statement"); setStatementSubTab("statement"); }}
                          style={{
                            flex: 1,
                            padding: "0.85rem 0.6rem",
                            backgroundColor: "#FFFFFF",
                            border: "1px solid #E2E8F0",
                            borderRadius: "0.85rem",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "0.35rem",
                            cursor: "pointer",
                          }}
                        >
                          <CreditCard size={20} color="#1F3652" />
                          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#1F3652" }}>Estado de Cuenta</span>
                        </button>

                        <Link
                          href="/marketplace"
                          style={{
                            flex: 1,
                            padding: "0.85rem 0.6rem",
                            backgroundColor: "#FFFFFF",
                            border: "1px solid #E2E8F0",
                            borderRadius: "0.85rem",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "0.35rem",
                            textDecoration: "none",
                            cursor: "pointer",
                          }}
                        >
                          <ShoppingBag size={20} color="#1F3652" />
                          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#1F3652" }}>Marketplace</span>
                        </Link>
                      </div>

                      {/* Información de la Unidad (Collapsible) */}
                      <div style={{ backgroundColor: "#FFFFFF", borderRadius: "1.25rem", padding: "1.2rem", border: "1px solid #E2E8F0" }}>
                        <div
                          onClick={() => setUnitInfoExpanded(!unitInfoExpanded)}
                          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
                        >
                          <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "#1F3652" }}>Información Técnica de la Unidad</span>
                          {unitInfoExpanded ? <ChevronUp size={18} color="#64748B" /> : <ChevronDown size={18} color="#64748B" />}
                        </div>

                        {unitInfoExpanded && (
                          <div style={{ marginTop: "0.85rem", display: "flex", flexDirection: "column", gap: "0.55rem", fontSize: "0.82rem", borderTop: "1px solid #F1F5F9", paddingTop: "0.75rem" }}>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                              <span style={{ color: "#64748B" }}>Superficie Total:</span>
                              <strong>{selectedProp.areaM2} m²</strong>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                              <span style={{ color: "#64748B" }}>Recámaras:</span>
                              <strong>{selectedProp.bedrooms}</strong>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                              <span style={{ color: "#64748B" }}>Baños:</span>
                              <strong>{selectedProp.bathrooms}</strong>
                            </div>
                            {selectedProp.customAttributes.map((attr, i) => (
                              <div key={i} style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ color: "#64748B" }}>{attr.label}:</span>
                                <strong>{attr.value}</strong>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* PANTALLA 3: AVANCE DE OBRA */}
                  {screen === "construction" && selectedProp && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
                      
                      {/* General Progress Card */}
                      <div style={{ backgroundColor: "#FFFFFF", borderRadius: "1.25rem", padding: "1.3rem", border: "1px solid #E2E8F0" }}>
                        <div style={{ fontSize: "0.8rem", color: "#64748B", fontWeight: 700 }}>Avance General de Obra</div>
                        <div style={{ fontSize: "2.2rem", fontWeight: 900, color: "#00875A", margin: "0.3rem 0" }}>
                          {selectedProp.constructionPct}%
                        </div>
                        <div style={{ fontSize: "0.8rem", color: "#64748B" }}>
                          Fecha estimada de entrega: <strong style={{ color: "#1F3652" }}>{selectedProp.estimatedDeliveryDate}</strong>
                        </div>
                      </div>

                      {/* Avance por Especialidad */}
                      <div style={{ backgroundColor: "#FFFFFF", borderRadius: "1.25rem", padding: "1.2rem", border: "1px solid #E2E8F0" }}>
                        <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#1F3652", marginBottom: "0.85rem" }}>
                          Avance por Especialidad
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                          {selectedProp.specialtiesProgress.map((esp) => (
                            <div key={esp.id}>
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", fontWeight: 700, marginBottom: "4px" }}>
                                <span style={{ color: "#334155" }}>{esp.name}</span>
                                <span style={{ color: "#00875A" }}>{esp.percentage}%</span>
                              </div>
                              <div style={{ height: "8px", backgroundColor: "#E2E8F0", borderRadius: "99px", overflow: "hidden" }}>
                                <div style={{ width: `${esp.percentage}%`, height: "100%", backgroundColor: "#00C48C", borderRadius: "99px" }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Histórico Avances de Obra */}
                      <div style={{ backgroundColor: "#FFFFFF", borderRadius: "1.25rem", padding: "1.2rem", border: "1px solid #E2E8F0" }}>
                        <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#1F3652", marginBottom: "0.85rem" }}>
                          Histórico Fotográfico de Obra
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                          {selectedProp.constructionMilestones.map((m) => (
                            <div key={m.id} style={{ borderRadius: "0.85rem", overflow: "hidden", border: "1px solid #E2E8F0" }}>
                              <img src={m.photo} alt={m.title} style={{ width: "100%", height: "180px", objectFit: "cover", display: "block" }} />
                              <div style={{ padding: "0.85rem" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                  <strong style={{ fontSize: "0.9rem", color: "#1F3652" }}>{m.title}</strong>
                                  <span style={{ fontSize: "0.72rem", color: "#64748B", fontWeight: 600 }}>{m.date}</span>
                                </div>
                                <p style={{ fontSize: "0.78rem", color: "#475569", marginTop: "0.4rem", lineHeight: 1.45 }}>
                                  {m.description}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* PANTALLA 4: DOCUMENTOS */}
                  {screen === "documents" && selectedProp && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                      {/* Search Bar */}
                      <div style={{ position: "relative" }}>
                        <Search size={18} color="#94A3B8" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
                        <input
                          type="text"
                          placeholder="Buscar contrato, plano o reglamento..."
                          value={docSearch}
                          onChange={(e) => setDocSearch(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "0.75rem 1rem 0.75rem 2.5rem",
                            borderRadius: "0.85rem",
                            border: "1px solid #CBD5E1",
                            fontSize: "0.85rem",
                            backgroundColor: "#FFFFFF",
                            boxSizing: "border-box",
                          }}
                        />
                      </div>

                      {filteredDocs.length === 0 ? (
                        <div style={{ backgroundColor: "#FFFFFF", borderRadius: "1rem", padding: "2.5rem 1rem", textAlign: "center", border: "1px solid #E2E8F0" }}>
                          <FileText size={32} color="#94A3B8" style={{ margin: "0 auto 0.5rem auto" }} />
                          <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#1F3652" }}>No se encontraron documentos</div>
                          <div style={{ fontSize: "0.78rem", color: "#64748B", marginTop: "4px" }}>Prueba buscando con otro término.</div>
                        </div>
                      ) : (
                        filteredDocs.map((doc) => (
                          <div
                            key={doc.id}
                            style={{
                              backgroundColor: "#FFFFFF",
                              borderRadius: "1rem",
                              padding: "1rem 1.1rem",
                              border: "1px solid #E2E8F0",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: "0.75rem",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", minWidth: 0 }}>
                              <div style={{ width: "40px", height: "40px", borderRadius: "0.6rem", backgroundColor: "rgba(31,54,82,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                <FileText size={22} color="#1F3652" />
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1E293B", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {doc.title}
                                </div>
                                <div style={{ fontSize: "0.72rem", color: "#94A3B8", marginTop: "2px" }}>
                                  {doc.category} • {doc.fileSize} • {formatDateDisplay(doc.uploadDate)}
                                </div>
                              </div>
                            </div>

                            <a
                              href={doc.fileUrl || "https://6d94a8ea50a1bc576a3e8162c197d74f.cdn.bubble.io/f1787347922111x601030756913299600/3.4_210826.pdf"}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                padding: "0.5rem 0.85rem",
                                borderRadius: "0.5rem",
                                backgroundColor: "#1B3047",
                                color: "#FFFFFF",
                                fontSize: "0.75rem",
                                fontWeight: 800,
                                textDecoration: "none",
                                display: "flex",
                                alignItems: "center",
                                gap: "0.35rem",
                                flexShrink: 0,
                              }}
                            >
                              <Download size={14} /> Abrir PDF
                            </a>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* PANTALLA 5: ESTADO DE CUENTA & PAGOS (IDÉNTICO AL BACK OFFICE DEVIO) */}
                  {screen === "statement" && selectedProp && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
                      
                      {/* 4 Financial KPI Summary Cards (Identical to Back Office) */}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.75rem" }}>
                        <div style={{ backgroundColor: "#FFFFFF", padding: "0.9rem 1rem", borderRadius: "1rem", border: "1px solid #E2E8F0", boxShadow: "0 1px 4px rgba(0,0,0,0.02)" }}>
                          <div style={{ fontSize: "0.72rem", color: "#64748B", fontWeight: 700 }}>Total a Pagar</div>
                          <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "#1F3652", marginTop: "3px" }}>
                            {formatMoney(selectedProp.totalPrice)}
                          </div>
                        </div>

                        <div style={{ backgroundColor: "#FFFFFF", padding: "0.9rem 1rem", borderRadius: "1rem", border: "1px solid #E2E8F0", boxShadow: "0 1px 4px rgba(0,0,0,0.02)" }}>
                          <div style={{ fontSize: "0.72rem", color: "#00875A", fontWeight: 700 }}>Total Pagado</div>
                          <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "#00875A", marginTop: "3px" }}>
                            {formatMoney(selectedProp.paidAmount)}
                          </div>
                        </div>

                        <div style={{ backgroundColor: "#FFFFFF", padding: "0.9rem 1rem", borderRadius: "1rem", border: "1px solid #E2E8F0", boxShadow: "0 1px 4px rgba(0,0,0,0.02)" }}>
                          <div style={{ fontSize: "0.72rem", color: "#B45309", fontWeight: 700 }}>Total Pendiente</div>
                          <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "#B45309", marginTop: "3px" }}>
                            {formatMoney(selectedProp.pendingAmount)}
                          </div>
                        </div>

                        <div style={{ backgroundColor: "#FFFFFF", padding: "0.9rem 1rem", borderRadius: "1rem", border: "1px solid #E2E8F0", boxShadow: "0 1px 4px rgba(0,0,0,0.02)" }}>
                          <div style={{ fontSize: "0.72rem", color: selectedProp.overdueAmount > 0 ? "#DC2626" : "#64748B", fontWeight: 700 }}>Saldo Atrasado</div>
                          <div style={{ fontSize: "1.1rem", fontWeight: 900, color: selectedProp.overdueAmount > 0 ? "#DC2626" : "#1F3652", marginTop: "3px" }}>
                            {formatMoney(selectedProp.overdueAmount || 0)}
                          </div>
                        </div>
                      </div>

                      {/* 2 Main Subtabs: Estado de Cuenta | Pagos Realizados */}
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button
                          type="button"
                          onClick={() => setStatementSubTab("statement")}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.45rem",
                            padding: "0.55rem 1.25rem",
                            borderRadius: "9999px",
                            fontSize: "0.82rem",
                            fontWeight: 700,
                            border: "none",
                            cursor: "pointer",
                            backgroundColor: statementSubTab === "statement" ? "#1B3047" : "#FFFFFF",
                            color: statementSubTab === "statement" ? "#FFFFFF" : "#64748B",
                            boxShadow: statementSubTab === "statement" ? "0 2px 6px rgba(27, 48, 71, 0.2)" : "0 1px 3px rgba(0,0,0,0.04)",
                          }}
                        >
                          <Calendar size={15} /> Estado de Cuenta
                        </button>

                        <button
                          type="button"
                          onClick={() => setStatementSubTab("payments")}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.45rem",
                            padding: "0.55rem 1.25rem",
                            borderRadius: "9999px",
                            fontSize: "0.82rem",
                            fontWeight: 700,
                            border: "none",
                            cursor: "pointer",
                            backgroundColor: statementSubTab === "payments" ? "#1B3047" : "#FFFFFF",
                            color: statementSubTab === "payments" ? "#FFFFFF" : "#64748B",
                            boxShadow: statementSubTab === "payments" ? "0 2px 6px rgba(27, 48, 71, 0.2)" : "0 1px 3px rgba(0,0,0,0.04)",
                          }}
                        >
                          <CreditCard size={15} /> Pagos Realizados ({selectedProp.paymentsList?.length || 0})
                        </button>
                      </div>

                      {/* TAB 1: ESTADO DE CUENTA (AMORTIZACIÓN PROGRAMADA) */}
                      {statementSubTab === "statement" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                          
                          {/* Top Action Header */}
                          <div style={{ backgroundColor: "#FFFFFF", borderRadius: "1.25rem", padding: "1.1rem 1.3rem", border: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
                            <div>
                              <div style={{ fontSize: "1rem", fontWeight: 800, color: "#1F3652" }}>
                                Calendario de Amortización
                              </div>
                              <div style={{ fontSize: "0.75rem", color: "#64748B" }}>
                                Cuotas pactadas y desglose de mensualidades de la unidad {selectedProp.unitNumber}
                              </div>
                            </div>

                            <button
                              onClick={() => {
                                openStatementInNewTab({
                                  projectName: selectedProp.projectName,
                                  unitNumber: selectedProp.unitNumber,
                                  clientName: userName,
                                  clientEmail: userEmail,
                                  clientRfc: userRfc,
                                  totalAmount: selectedProp.totalPrice,
                                  paidAmount: selectedProp.paidAmount,
                                  pendingAmount: selectedProp.pendingAmount,
                                  developerName: selectedProp.developerName,
                                  developerLogoUrl: selectedProp.developerLogo,
                                  projectLogoUrl: selectedProp.projectLogo,
                                  installments: (selectedProp.schedule || []).map((s) => ({
                                    concept: s.concept,
                                    scheduledDate: formatDateDisplay(s.fechaProgramada),
                                    amount: s.montoProgramado,
                                    paidAmount: s.montoPagado,
                                    status: s.status,
                                  })),
                                });
                              }}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.45rem",
                                backgroundColor: "#1B3047",
                                color: "#FFFFFF",
                                padding: "0.55rem 1.15rem",
                                borderRadius: "9999px",
                                border: "none",
                                fontWeight: 700,
                                fontSize: "0.78rem",
                                cursor: "pointer",
                                boxShadow: "0 2px 6px rgba(27,48,71,0.15)",
                              }}
                            >
                              <Download size={14} /> Descargar Estado de Cuenta PDF
                            </button>
                          </div>

                          {/* Tabla de Amortización Responsiva */}
                          <div style={{ backgroundColor: "#FFFFFF", borderRadius: "1.25rem", overflow: "hidden", border: "1px solid #E2E8F0", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                            <div style={{ overflowX: "auto" }}>
                              <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: "0.8rem", textAlign: "left", minWidth: "620px" }}>
                                <thead>
                                  <tr style={{ backgroundColor: "#1B3047", color: "#FFFFFF" }}>
                                    <th style={{ padding: "0.8rem 1rem", fontWeight: 700 }}>Concepto / Cuota</th>
                                    <th style={{ padding: "0.8rem 1rem", fontWeight: 700 }}>Fecha Programada</th>
                                    <th style={{ padding: "0.8rem 1rem", fontWeight: 700, textAlign: "right" }}>Monto Prog.</th>
                                    <th style={{ padding: "0.8rem 1rem", fontWeight: 700, textAlign: "right" }}>Monto Pagado</th>
                                    <th style={{ padding: "0.8rem 1rem", fontWeight: 700, textAlign: "right" }}>Monto Pendiente</th>
                                    <th style={{ padding: "0.8rem 1rem", fontWeight: 700, textAlign: "center" }}>Fecha Pago</th>
                                    <th style={{ padding: "0.8rem 1rem", fontWeight: 700, textAlign: "center" }}>Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(selectedProp.schedule || []).map((row, idx) => (
                                    <tr
                                      key={row.id ? `${row.id}-${idx}` : `inst-${idx}`}
                                      style={{ borderBottom: "1px solid #F1F5F9" }}
                                    >
                                      {/* Concepto */}
                                      <td style={{ padding: "0.85rem 1rem", fontWeight: 700, color: "#1F3652" }}>
                                        {row.concept}
                                      </td>

                                      {/* Fecha programada */}
                                      <td style={{ padding: "0.85rem 1rem", color: "#475569", whiteSpace: "nowrap" }}>
                                        {formatDateDisplay(row.fechaProgramada)}
                                      </td>

                                      {/* Monto programado */}
                                      <td style={{ padding: "0.85rem 1rem", fontWeight: 700, color: "#1F3652", textAlign: "right" }}>
                                        {formatMoney(row.montoProgramado)}
                                      </td>

                                      {/* Monto pagado */}
                                      <td style={{ padding: "0.85rem 1rem", fontWeight: 700, color: row.montoPagado > 0 ? "#00C48C" : "#64748B", textAlign: "right" }}>
                                        {formatMoney(row.montoPagado)}
                                      </td>

                                      {/* Monto pendiente */}
                                      <td style={{ padding: "0.85rem 1rem", fontWeight: 700, color: row.montoPendiente > 0 ? "#1F3652" : "#94A3B8", textAlign: "right" }}>
                                        {formatMoney(row.montoPendiente)}
                                      </td>

                                      {/* Fecha pago */}
                                      <td style={{ padding: "0.85rem 1rem", textAlign: "center", color: "#475569", fontSize: "0.75rem" }}>
                                        {row.fechaPago === "Pendiente" ? (
                                          <span style={{ backgroundColor: "#FEF3C7", color: "#92400E", padding: "0.2rem 0.55rem", borderRadius: "0.4rem", fontWeight: 600 }}>
                                            Pendiente
                                          </span>
                                        ) : row.fechaPago === "Parcial" ? (
                                          <span style={{ backgroundColor: "#EFF6FF", color: "#1E40AF", padding: "0.2rem 0.55rem", borderRadius: "0.4rem", fontWeight: 600 }}>
                                            Parcial
                                          </span>
                                        ) : (
                                          formatDateDisplay(row.fechaPago)
                                        )}
                                      </td>

                                      {/* Status Badge */}
                                      <td style={{ padding: "0.85rem 1rem", textAlign: "center" }}>
                                        <span
                                          style={{
                                            display: "inline-block",
                                            padding: "0.22rem 0.65rem",
                                            borderRadius: "99px",
                                            fontSize: "0.7rem",
                                            fontWeight: 700,
                                            backgroundColor:
                                              row.status === "Pagado"
                                                ? "rgba(0, 196, 140, 0.12)"
                                                : row.status === "Atrasado"
                                                ? "#FEE2E2"
                                                : "#F1F5F9",
                                            color:
                                              row.status === "Pagado"
                                                ? "#00A877"
                                                : row.status === "Atrasado"
                                                ? "#DC2626"
                                                : "#475569",
                                            border:
                                              row.status === "Pagado"
                                                ? "1px solid rgba(0,196,140,0.3)"
                                                : row.status === "Atrasado"
                                                ? "1px solid #FECACA"
                                                : "1px solid #CBD5E1",
                                          }}
                                        >
                                          {row.status}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* TAB 2: PAGOS REALIZADOS (HISTORIAL DE TRANSACCIONES REALES) */}
                      {statementSubTab === "payments" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                          
                          <div style={{ backgroundColor: "#FFFFFF", borderRadius: "1.25rem", padding: "1.1rem 1.3rem", border: "1px solid #E2E8F0" }}>
                            <div style={{ fontSize: "1rem", fontWeight: 800, color: "#1F3652" }}>
                              Historial de Pagos Realizados
                            </div>
                            <div style={{ fontSize: "0.75rem", color: "#64748B" }}>
                              Transacciones y abonos registrados con comprobante bancario SPEI y recibo oficial ({selectedProp.paymentsList?.length || 0} operaciones)
                            </div>
                          </div>

                          <div style={{ backgroundColor: "#FFFFFF", borderRadius: "1.25rem", overflow: "hidden", border: "1px solid #E2E8F0", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                            <div style={{ overflowX: "auto" }}>
                              <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: "0.8rem", textAlign: "left", minWidth: "620px" }}>
                                <thead>
                                  <tr style={{ backgroundColor: "#1B3047", color: "#FFFFFF" }}>
                                    <th style={{ padding: "0.8rem 1rem", fontWeight: 700 }}>Fecha Pago</th>
                                    <th style={{ padding: "0.8rem 1rem", fontWeight: 700 }}>Método de Pago</th>
                                    <th style={{ padding: "0.8rem 1rem", fontWeight: 700, textAlign: "right" }}>Monto</th>
                                    <th style={{ padding: "0.8rem 1rem", fontWeight: 700, textAlign: "center" }}>Unidad</th>
                                    <th style={{ padding: "0.8rem 1rem", fontWeight: 700, textAlign: "center" }}>Recibo Oficial</th>
                                    <th style={{ padding: "0.8rem 1rem", fontWeight: 700, textAlign: "center" }}>Comprobante SPEI</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(!selectedProp.paymentsList || selectedProp.paymentsList.length === 0) ? (
                                    <tr>
                                      <td colSpan={6} style={{ padding: "3rem", textAlign: "center", color: "#94A3B8" }}>
                                        No hay pagos registrados para esta unidad.
                                      </td>
                                    </tr>
                                  ) : (
                                    selectedProp.paymentsList.map((p, idx) => (
                                      <tr
                                        key={p.id ? `${p.id}-${idx}` : `pay-${idx}`}
                                        style={{ borderBottom: "1px solid #F1F5F9" }}
                                      >
                                        {/* Fecha pago */}
                                        <td style={{ padding: "0.85rem 1rem", color: "#475569", whiteSpace: "nowrap" }}>
                                          {formatDateDisplay(p.fechaPago)}
                                        </td>

                                        {/* Método de pago */}
                                        <td style={{ padding: "0.85rem 1rem", color: "#1F3652", fontWeight: 600 }}>
                                          {p.metodoPago}
                                        </td>

                                        {/* Monto */}
                                        <td style={{ padding: "0.85rem 1rem", textAlign: "right", fontWeight: 800, color: "#1F3652" }}>
                                          {formatMoney(p.monto)}
                                        </td>

                                        {/* Unidad */}
                                        <td style={{ padding: "0.85rem 1rem", textAlign: "center", fontWeight: 700, color: "#1F3652" }}>
                                          {p.unit || selectedProp.unitNumber}
                                        </td>

                                        {/* Recibo Oficial PDF -> [ Abrir Recibo ] */}
                                        <td style={{ padding: "0.85rem 1rem", textAlign: "center" }}>
                                          <button
                                            type="button"
                                            onClick={() => handleOpenReceipt(p)}
                                            style={{
                                              display: "inline-flex",
                                              alignItems: "center",
                                              gap: "0.35rem",
                                              backgroundColor: "#1B3047",
                                              color: "#FFFFFF",
                                              padding: "0.4rem 0.95rem",
                                              borderRadius: "9999px",
                                              fontSize: "0.75rem",
                                              fontWeight: 600,
                                              border: "none",
                                              cursor: "pointer",
                                              whiteSpace: "nowrap",
                                            }}
                                            title="Generar y abrir Recibo Oficial Devio en formato PDF"
                                          >
                                            <ExternalLink size={13} /> Abrir Recibo PDF
                                          </button>
                                        </td>

                                        {/* Comprobante Bancario SPEI -> [ Abrir Comprobante ] */}
                                        <td style={{ padding: "0.85rem 1rem", textAlign: "center" }}>
                                          {p.comprobanteUrl ? (
                                            <button
                                              type="button"
                                              onClick={() => setSelectedVoucherForView(p)}
                                              style={{
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: "0.35rem",
                                                backgroundColor: "rgba(31,54,82,0.08)",
                                                color: "#1F3652",
                                                padding: "0.4rem 0.95rem",
                                                borderRadius: "9999px",
                                                fontSize: "0.75rem",
                                                fontWeight: 700,
                                                border: "1px solid rgba(31,54,82,0.2)",
                                                cursor: "pointer",
                                                whiteSpace: "nowrap",
                                              }}
                                              title="Ver comprobante bancario subido"
                                            >
                                              <Eye size={13} /> Comprobante SPEI
                                            </button>
                                          ) : (
                                            <span style={{ fontSize: "0.72rem", color: "#94A3B8" }}>
                                              Validado
                                            </span>
                                          )}
                                        </td>
                                      </tr>
                                    ))
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* TAB 2: PERFIL & AJUSTES */}
          {activeTab === "profile" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* Profile Top Card */}
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "1.25rem",
                  padding: "1.5rem",
                  border: "1px solid #E2E8F0",
                  textAlign: "center",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                }}
              >
                <div
                  style={{
                    width: "84px",
                    height: "84px",
                    borderRadius: "50%",
                    overflow: "hidden",
                    margin: "0 auto 0.75rem",
                    border: "3px solid #F1F5F9",
                  }}
                >
                  <img
                    src={userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=1F3652&color=fff&bold=true`}
                    alt="Avatar"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
                <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#1F3652" }}>{userName}</div>
                <div style={{ fontSize: "0.8rem", color: "#64748B", marginTop: "2px" }}>{userEmail}</div>
              </div>

              {/* Section: Ajustes */}
              <div style={{ fontSize: "1.15rem", fontWeight: 900, color: "#1F3652", marginTop: "0.25rem", paddingLeft: "4px" }}>
                Ajustes
              </div>

              {/* Menu Items List */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                {/* 1. Información Personal */}
                <button
                  type="button"
                  onClick={() => setShowEditProfile(true)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    backgroundColor: "#FFFFFF",
                    borderRadius: "1.1rem",
                    padding: "1rem 1.15rem",
                    border: "1px solid #E2E8F0",
                    cursor: "pointer",
                    textAlign: "left",
                    gap: "0.85rem",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                  }}
                >
                  <div
                    style={{
                      width: "38px",
                      height: "38px",
                      borderRadius: "50%",
                      backgroundColor: "#EFF6FF",
                      color: "#2563EB",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <User size={18} />
                  </div>
                  <span style={{ flex: 1, fontSize: "0.9rem", fontWeight: 700, color: "#1F3652" }}>
                    Información personal
                  </span>
                  <ChevronRight size={18} color="#94A3B8" />
                </button>

                {/* 2. Cambiar Contraseña */}
                <button
                  type="button"
                  onClick={() => setShowChangePassword(true)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    backgroundColor: "#FFFFFF",
                    borderRadius: "1.1rem",
                    padding: "1rem 1.15rem",
                    border: "1px solid #E2E8F0",
                    cursor: "pointer",
                    textAlign: "left",
                    gap: "0.85rem",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                  }}
                >
                  <div
                    style={{
                      width: "38px",
                      height: "38px",
                      borderRadius: "50%",
                      backgroundColor: "#ECFDF5",
                      color: "#059669",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Lock size={18} />
                  </div>
                  <span style={{ flex: 1, fontSize: "0.9rem", fontWeight: 700, color: "#1F3652" }}>
                    Cambiar contraseña
                  </span>
                  <ChevronRight size={18} color="#94A3B8" />
                </button>

                {/* 3. Legal */}
                <button
                  type="button"
                  onClick={() => alert("Aviso Legal y Privacidad: Devio protege tus datos personales y transacciones bajo los más estrictos estándares de seguridad y cifrado bancario.")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    backgroundColor: "#FFFFFF",
                    borderRadius: "1.1rem",
                    padding: "1rem 1.15rem",
                    border: "1px solid #E2E8F0",
                    cursor: "pointer",
                    textAlign: "left",
                    gap: "0.85rem",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                  }}
                >
                  <div
                    style={{
                      width: "38px",
                      height: "38px",
                      borderRadius: "50%",
                      backgroundColor: "#EFF6FF",
                      color: "#2563EB",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <ShieldCheck size={18} />
                  </div>
                  <span style={{ flex: 1, fontSize: "0.9rem", fontWeight: 700, color: "#1F3652" }}>
                    Legal
                  </span>
                  <ChevronRight size={18} color="#94A3B8" />
                </button>

                {/* 4. Soporte y Ayuda */}
                <a
                  href="https://wa.me/523318924490"
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    backgroundColor: "#FFFFFF",
                    borderRadius: "1.1rem",
                    padding: "1rem 1.15rem",
                    border: "1px solid #E2E8F0",
                    cursor: "pointer",
                    textAlign: "left",
                    gap: "0.85rem",
                    textDecoration: "none",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                  }}
                >
                  <div
                    style={{
                      width: "38px",
                      height: "38px",
                      borderRadius: "50%",
                      backgroundColor: "#EFF6FF",
                      color: "#2563EB",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <HelpCircle size={18} />
                  </div>
                  <span style={{ flex: 1, fontSize: "0.9rem", fontWeight: 700, color: "#1F3652" }}>
                    Soporte y Ayuda
                  </span>
                  <ChevronRight size={18} color="#94A3B8" />
                </a>

                {/* 5. Idioma */}
                <button
                  type="button"
                  onClick={() => alert("Idioma de la plataforma: Español (México)")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    backgroundColor: "#FFFFFF",
                    borderRadius: "1.1rem",
                    padding: "1rem 1.15rem",
                    border: "1px solid #E2E8F0",
                    cursor: "pointer",
                    textAlign: "left",
                    gap: "0.85rem",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                  }}
                >
                  <div
                    style={{
                      width: "38px",
                      height: "38px",
                      borderRadius: "50%",
                      backgroundColor: "#EFF6FF",
                      color: "#2563EB",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Globe size={18} />
                  </div>
                  <span style={{ flex: 1, fontSize: "0.9rem", fontWeight: 700, color: "#1F3652" }}>
                    Idioma
                  </span>
                  <ChevronRight size={18} color="#94A3B8" />
                </button>
              </div>

              {/* Cerrar Sesión */}
              <button
                type="button"
                onClick={handleLogout}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#FFFFFF",
                  borderRadius: "1.1rem",
                  padding: "1rem",
                  gap: "0.5rem",
                  border: "1px solid #FEE2E2",
                  color: "#EF4444",
                  fontWeight: 800,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                  marginTop: "0.25rem",
                  boxShadow: "0 1px 3px rgba(239,68,68,0.05)",
                }}
              >
                <LogOut size={18} color="#EF4444" />
                <span>Cerrar sesión</span>
              </button>
            </div>
          )}

        </div>

        {/* BOTTOM FIXED TABS */}
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            height: "65px",
            backgroundColor: "#FFFFFF",
            borderTop: "1px solid #E2E8F0",
            display: "flex",
            justifyContent: "space-around",
            alignItems: "center",
            boxShadow: "0 -2px 12px rgba(0,0,0,0.06)",
            zIndex: 30,
            maxWidth: "880px",
            margin: "0 auto",
          }}
        >
          <button
            onClick={() => { setActiveTab("properties"); setScreen("main"); }}
            style={{
              flex: 1,
              background: "none",
              border: "none",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "3px",
              cursor: "pointer",
              color: activeTab === "properties" ? "#1F3652" : "#94A3B8",
            }}
          >
            <div style={{
              width: "42px",
              height: "26px",
              borderRadius: "13px",
              backgroundColor: activeTab === "properties" ? "#1F3652" : "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <Home size={18} color={activeTab === "properties" ? "#FFFFFF" : "#94A3B8"} />
            </div>
            <span style={{ fontSize: "0.7rem", fontWeight: 800 }}>Mis Propiedades</span>
          </button>

          <button
            onClick={() => { setActiveTab("profile"); setScreen("main"); }}
            style={{
              flex: 1,
              background: "none",
              border: "none",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "3px",
              cursor: "pointer",
              color: activeTab === "profile" ? "#1F3652" : "#94A3B8",
            }}
          >
            <div style={{
              width: "42px",
              height: "26px",
              borderRadius: "13px",
              backgroundColor: activeTab === "profile" ? "#1F3652" : "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <User size={18} color={activeTab === "profile" ? "#FFFFFF" : "#94A3B8"} />
            </div>
            <span style={{ fontSize: "0.7rem", fontWeight: 800 }}>Mi Perfil</span>
          </button>
        </div>

        {/* MODAL NOTIFICACIONES PUSH */}
        {showNotifications && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15,23,42,0.6)", display: "flex", justifyContent: "center", alignItems: "flex-end", zIndex: 9999 }}>
            <div style={{ width: "100%", maxWidth: "500px", backgroundColor: "#FFFFFF", borderTopLeftRadius: "1.5rem", borderTopRightRadius: "1.5rem", padding: "1.4rem 1.4rem 1.75rem", display: "flex", flexDirection: "column", gap: "1rem", maxHeight: "85vh" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #F1F5F9", paddingBottom: "0.85rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <strong style={{ fontSize: "1.1rem", color: "#1F3652" }}>Avisos y Notificaciones</strong>
                  {notifications.length > 0 && (
                    <span style={{ backgroundColor: "#EFF6FF", color: "#1D4ED8", fontSize: "0.7rem", fontWeight: 800, padding: "2px 8px", borderRadius: "10px" }}>
                      {notifications.length}
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  {notifications.length > 0 && (
                    <button
                      onClick={handleClearAllNotifications}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#DC2626",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: "4px 8px",
                        borderRadius: "6px",
                      }}
                      title="Borrar todas las notificaciones"
                    >
                      <Trash2 size={13} /> Limpiar todas
                    </button>
                  )}
                  <button onClick={() => setShowNotifications(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748B" }}>
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxHeight: "380px", overflowY: "auto", paddingRight: "2px" }}>
                {notifications.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "2.5rem 1rem", backgroundColor: "#F8FAFC", borderRadius: "1rem", border: "1px dashed #CBD5E1" }}>
                    <div style={{ width: "42px", height: "42px", borderRadius: "50%", backgroundColor: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 0.75rem", color: "#94A3B8" }}>
                      <Bell size={20} />
                    </div>
                    <div style={{ fontSize: "0.9rem", fontWeight: 800, color: "#1F3652", marginBottom: "4px" }}>
                      No tienes avisos pendientes
                    </div>
                    <p style={{ fontSize: "0.75rem", color: "#64748B", margin: 0 }}>
                      Tus pagos, estado de cuenta y avances están sincronizados al día.
                    </p>
                  </div>
                ) : (
                  notifications.map((n) => {
                    const isWarning = n.type === "warning";
                    const isSuccess = n.type === "success";
                    return (
                      <div
                        key={n.id}
                        style={{
                          padding: "0.9rem",
                          backgroundColor: isWarning ? "#FEF2F2" : isSuccess ? "#F0FDF4" : "#F8FAFC",
                          borderRadius: "0.85rem",
                          border: `1px solid ${isWarning ? "#FECACA" : isSuccess ? "#BBF7D0" : "#E2E8F0"}`,
                          display: "flex",
                          gap: "0.75rem",
                          alignItems: "flex-start",
                        }}
                      >
                        <div
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "50%",
                            backgroundColor: isWarning ? "#FEE2E2" : isSuccess ? "#DCFCE7" : "#EFF6FF",
                            color: isWarning ? "#DC2626" : isSuccess ? "#16A34A" : "#2563EB",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            marginTop: "2px",
                          }}
                        >
                          {isWarning ? <AlertTriangle size={16} /> : isSuccess ? <CheckCircle2 size={16} /> : <Bell size={16} />}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                            <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "#1F3652" }}>{n.title}</span>
                            <span
                              style={{
                                fontSize: "0.68rem",
                                fontWeight: 700,
                                color: isWarning ? "#DC2626" : isSuccess ? "#16A34A" : "#64748B",
                                backgroundColor: isWarning ? "#FFF1F2" : isSuccess ? "#F0FDF4" : "#F1F5F9",
                                padding: "2px 6px",
                                borderRadius: "4px",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {n.time}
                            </span>
                          </div>
                          <p style={{ fontSize: "0.76rem", color: "#475569", marginTop: "4px", lineHeight: "1.35", marginBottom: 0 }}>
                            {n.body}
                          </p>
                        </div>

                        <button
                          onClick={() => handleDeleteNotification(n.id)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#94A3B8",
                            cursor: "pointer",
                            padding: "4px",
                            borderRadius: "4px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            marginLeft: "2px",
                          }}
                          title="Eliminar notificación"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              <button
                onClick={() => setShowNotifications(false)}
                style={{ width: "100%", padding: "0.75rem", backgroundColor: "#1F3652", color: "#FFFFFF", borderRadius: "0.75rem", border: "none", fontWeight: 800, fontSize: "0.82rem", cursor: "pointer" }}
              >
                Cerrar
              </button>
            </div>
          </div>
        )}

        {/* MODAL VISOR COMPROBANTE BANCARIO SPEI */}
        {selectedVoucherForView && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15,23,42,0.7)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999, padding: "1rem" }}>
            <div style={{ width: "100%", maxWidth: "520px", backgroundColor: "#FFFFFF", borderRadius: "1.25rem", padding: "1.4rem", display: "flex", flexDirection: "column", gap: "1rem", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong style={{ fontSize: "1.05rem", color: "#1F3652" }}>Comprobante Bancario SPEI</strong>
                <button onClick={() => setSelectedVoucherForView(null)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} /></button>
              </div>

              <div style={{ backgroundColor: "#F8FAFC", borderRadius: "0.85rem", padding: "1.1rem", border: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: "0.72rem", color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>Transacción Validada</div>
                <div style={{ fontSize: "1.35rem", fontWeight: 900, color: "#1F3652", margin: "0.3rem 0" }}>
                  {formatMoney(selectedVoucherForView.monto)}
                </div>
                <div style={{ fontSize: "0.8rem", color: "#475569" }}>
                  Unidad {selectedVoucherForView.unit} • {selectedVoucherForView.metodoPago}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#64748B", marginTop: "4px" }}>
                  Fecha de Aplicación: <strong>{formatDateDisplay(selectedVoucherForView.fechaPago)}</strong>
                </div>
                {selectedVoucherForView.reciboFolio && (
                  <div style={{ fontSize: "0.72rem", color: "#00A877", fontWeight: 700, marginTop: "4px" }}>
                    Folio de Recibo: {selectedVoucherForView.reciboFolio}
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: "0.75rem" }}>
                {selectedVoucherForView.comprobanteUrl ? (
                  <a
                    href={selectedVoucherForView.comprobanteUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      flex: 1,
                      padding: "0.75rem",
                      backgroundColor: "#1B3047",
                      color: "#FFFFFF",
                      borderRadius: "0.6rem",
                      fontWeight: 800,
                      fontSize: "0.8rem",
                      textDecoration: "none",
                      textAlign: "center",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.4rem",
                    }}
                  >
                    <ExternalLink size={15} /> Abrir Archivo Adjunto
                  </a>
                ) : (
                  <div style={{ flex: 1, padding: "0.75rem", textAlign: "center", fontSize: "0.8rem", color: "#64748B" }}>
                    Comprobante registrado en sistema
                  </div>
                )}
                <button
                  onClick={() => setSelectedVoucherForView(null)}
                  style={{
                    padding: "0.75rem 1.25rem",
                    backgroundColor: "#F1F5F9",
                    color: "#64748B",
                    borderRadius: "0.6rem",
                    border: "none",
                    fontWeight: 800,
                    fontSize: "0.8rem",
                    cursor: "pointer",
                  }}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL EDITAR PERFIL */}
        {showEditProfile && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15,23,42,0.6)", display: "flex", justifyContent: "center", alignItems: "flex-end", zIndex: 9999 }}>
            <div style={{ width: "100%", maxWidth: "480px", backgroundColor: "#FFFFFF", borderTopLeftRadius: "1.5rem", borderTopRightRadius: "1.5rem", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong style={{ fontSize: "1.05rem", color: "#1F3652" }}>Editar Datos Personales</strong>
                <button onClick={() => setShowEditProfile(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} /></button>
              </div>

              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569" }}>Nombre Completo</label>
                <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} style={{ width: "100%", padding: "0.6rem", borderRadius: "0.5rem", border: "1px solid #CBD5E1", fontSize: "0.8rem", marginTop: "3px" }} />
              </div>

              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569" }}>Teléfono</label>
                <input type="text" value={userPhone} onChange={(e) => setUserPhone(e.target.value)} style={{ width: "100%", padding: "0.6rem", borderRadius: "0.5rem", border: "1px solid #CBD5E1", fontSize: "0.8rem", marginTop: "3px" }} />
              </div>

              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569" }}>RFC</label>
                <input type="text" value={userRfc} onChange={(e) => setUserRfc(e.target.value)} style={{ width: "100%", padding: "0.6rem", borderRadius: "0.5rem", border: "1px solid #CBD5E1", fontSize: "0.8rem", marginTop: "3px" }} />
              </div>

              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569" }}>Domicilio Fiscal</label>
                <input type="text" value={userAddress} onChange={(e) => setUserAddress(e.target.value)} style={{ width: "100%", padding: "0.6rem", borderRadius: "0.5rem", border: "1px solid #CBD5E1", fontSize: "0.8rem", marginTop: "3px" }} />
              </div>

              <button
                onClick={() => {
                  if (typeof window !== "undefined") {
                    const raw = localStorage.getItem("devio_user_session") || sessionStorage.getItem("devio_user_session");
                    if (raw) {
                      try {
                        const parsed = JSON.parse(raw);
                        parsed.fullName = userName;
                        parsed.phone = userPhone;
                        parsed.rfc = userRfc;
                        parsed.address = userAddress;
                        localStorage.setItem("devio_user_session", JSON.stringify(parsed));
                        sessionStorage.setItem("devio_user_session", JSON.stringify(parsed));
                      } catch (e) {}
                    }
                  }
                  setShowEditProfile(false);
                  alert("Datos personales actualizados correctamente.");
                }}
                style={{ backgroundColor: "#1F3652", color: "#FFFFFF", padding: "0.75rem", borderRadius: "0.6rem", fontWeight: 800, border: "none", cursor: "pointer", fontSize: "0.8rem", marginTop: "0.5rem" }}
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        )}

        {/* MODAL CAMBIAR CONTRASEÑA */}
        {showChangePassword && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15,23,42,0.6)", display: "flex", justifyContent: "center", alignItems: "flex-end", zIndex: 9999 }}>
            <div style={{ width: "100%", maxWidth: "480px", backgroundColor: "#FFFFFF", borderTopLeftRadius: "1.5rem", borderTopRightRadius: "1.5rem", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong style={{ fontSize: "1.05rem", color: "#1F3652" }}>Cambiar Contraseña</strong>
                <button onClick={() => setShowChangePassword(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} /></button>
              </div>

              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569" }}>Contraseña Actual</label>
                <input type="password" placeholder="••••••••" style={{ width: "100%", padding: "0.6rem", borderRadius: "0.5rem", border: "1px solid #CBD5E1", fontSize: "0.8rem", marginTop: "3px" }} />
              </div>

              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569" }}>Nueva Contraseña</label>
                <input type="password" placeholder="••••••••" style={{ width: "100%", padding: "0.6rem", borderRadius: "0.5rem", border: "1px solid #CBD5E1", fontSize: "0.8rem", marginTop: "3px" }} />
              </div>

              <button
                onClick={() => {
                  setShowChangePassword(false);
                  alert("Contraseña actualizada con éxito.");
                }}
                style={{ backgroundColor: "#1F3652", color: "#FFFFFF", padding: "0.75rem", borderRadius: "0.6rem", fontWeight: 800, border: "none", cursor: "pointer", fontSize: "0.8rem", marginTop: "0.5rem" }}
              >
                Actualizar Contraseña
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

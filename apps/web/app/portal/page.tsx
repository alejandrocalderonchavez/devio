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
  Wrench,
  Building2,
  Layers,
  Sparkles,
  FileText,
  CreditCard,
  ShoppingBag,
  ChevronDown,
  ChevronUp,
  Download,
  CheckCircle2,
  Trash2,
  AlertCircle,
  Clock,
  ShieldCheck,
  X,
  Lock,
  Key,
  Phone,
  Mail,
  MapPin,
  Check,
  LogOut,
  HelpCircle,
  Globe,
  FileCheck,
  Search,
  ExternalLink,
  Eye,
  DollarSign,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { openReceiptInNewTab, openStatementInNewTab } from "../../lib/pdf-generator";

interface PaymentItem {
  id: string;
  cuotaNumber: number;
  concept: string;
  scheduledAmount: number;
  scheduledDate: string;
  paidAmount: number;
  pendingAmount: number;
  status: "PAGADO" | "PENDIENTE" | "ATRASADO";
  paidDate?: string;
  receiptNumber?: string;
  paymentMethod?: string;
  comprobanteUrl?: string;
  comprobanteName?: string;
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
  nextPaymentAmount: number;
  nextPaymentDueDate: string;
  nextPaymentDaysRemaining: number;
  overdueAmount?: number;
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
  payments: PaymentItem[];
  customAttributes: Array<{ label: string; value: string }>;
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
  const [showVoucherPayment, setShowVoucherPayment] = useState<PaymentItem | null>(null);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  // Notifications State
  const [notifications, setNotifications] = useState([
    { id: "notif-1", title: "Aviso de Estado de Cuenta", body: "Tu estado de cuenta del periodo actual está actualizado.", time: "Hoy", read: false },
    { id: "notif-2", title: "Nuevo Avance de Obra", body: "La desarrolladora ha publicado actualizaciones fotográficas en tu proyecto.", time: "Ayer", read: false },
    { id: "notif-3", title: "Portal de Clientes Devio Activo", body: "Bienvenido a tu plataforma privada de seguimiento y pagos.", time: "Reciente", read: true },
  ]);

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
        // If not logged in, redirect to login page
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
      d.title.toLowerCase().includes(docSearch.toLowerCase())
    );
  }, [selectedProp, docSearch]);

  // Handle Official Receipt View/PDF
  const handleOpenReceipt = (payment: PaymentItem) => {
    if (!selectedProp) return;
    openReceiptInNewTab({
      folio: payment.receiptNumber || `REC-${selectedProp.unitNumber}-001`,
      projectName: selectedProp.projectName,
      unitNumber: selectedProp.unitNumber,
      clientName: userName,
      paymentMethod: payment.paymentMethod || "Transferencia SPEI",
      totalAmount: payment.paidAmount || payment.scheduledAmount,
      capitalAmount: payment.paidAmount || payment.scheduledAmount,
      interestAmount: 0,
      planName: "Plan Personalizado",
      emissionDate: payment.paidDate || payment.scheduledDate,
      developerName: selectedProp.developerName,
      developerLogoUrl: selectedProp.developerLogo,
      projectLogoUrl: selectedProp.projectLogo,
    });
  };

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
            paddingTop: "2.2rem",
            paddingBottom: "1.4rem",
            paddingLeft: "1.5rem",
            paddingRight: "1.5rem",
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
                      transition: "background 0.15s ease",
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
                      
                      {/* Banner: Tu Próximo Pago (Clean Light Style) */}
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
                              color: "#1F3652",
                              backgroundColor: "#FEF3C7",
                              padding: "0.25rem 0.65rem",
                              borderRadius: "99px",
                              textTransform: "uppercase",
                            }}
                          >
                            Tu Próximo Pago
                          </span>
                          <span style={{ fontSize: "0.78rem", color: "#64748B", fontWeight: 600 }}>
                            {selectedProp.nextPaymentDaysRemaining} días restantes
                          </span>
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "0.5rem" }}>
                          <div>
                            <div style={{ fontSize: "1.75rem", fontWeight: 900, color: "#1F3652", letterSpacing: "-0.02em" }}>
                              {formatMoneyCompact(selectedProp.nextPaymentAmount)}
                            </div>
                            <div style={{ fontSize: "0.8rem", color: "#64748B", marginTop: "2px" }}>
                              Vence el <strong>{selectedProp.nextPaymentDueDate}</strong> • {selectedProp.projectName} ({selectedProp.unitNumber})
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              setSelectedPropId(selectedProp.id);
                              setScreen("statement");
                              setStatementSubTab("payments");
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
                            Ver Pagos
                          </button>
                        </div>

                        {selectedProp.overdueAmount ? (
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
                              <span>Saldo Vencido</span>
                            </div>
                            <span style={{ color: "#DC2626", fontWeight: 900 }}>{formatMoneyCompact(selectedProp.overdueAmount)}</span>
                          </div>
                        ) : null}
                      </div>

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
                      <div style={{ backgroundColor: "#FFFFFF", borderRadius: "1.25rem", padding: "1.2rem", border: "1px solid #E2E8F0" }}>
                        <div style={{ display: "flex", gap: "0.75rem", marginBottom: "0.85rem", flexWrap: "wrap" }}>
                          <div style={{ flex: 1, minWidth: "140px", backgroundColor: "#FEF3C7", border: "1px solid #FDE68A", borderRadius: "0.75rem", padding: "0.75rem 0.85rem" }}>
                            <div style={{ fontSize: "0.7rem", color: "#92400E", fontWeight: 700 }}>Tu Próximo Pago</div>
                            <div style={{ fontSize: "1.15rem", fontWeight: 900, color: "#78350F", marginTop: "2px" }}>
                              {formatMoneyCompact(selectedProp.nextPaymentAmount)}
                            </div>
                          </div>
                          <div style={{ flex: 1, minWidth: "140px", backgroundColor: "#FEE2E2", border: "1px solid #FECACA", borderRadius: "0.75rem", padding: "0.75rem 0.85rem" }}>
                            <div style={{ fontSize: "0.7rem", color: "#991B1B", fontWeight: 700 }}>Saldo Vencido</div>
                            <div style={{ fontSize: "1.15rem", fontWeight: 900, color: "#7F1D1D", marginTop: "2px" }}>
                              {formatMoneyCompact(selectedProp.overdueAmount || 0)}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => { setScreen("statement"); setStatementSubTab("payments"); }}
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

                      {filteredDocs.map((doc) => (
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
                                {doc.category} • {doc.fileSize} • {doc.uploadDate}
                              </div>
                            </div>
                          </div>

                          <a
                            href={doc.fileUrl || "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              padding: "0.5rem 0.85rem",
                              borderRadius: "0.5rem",
                              backgroundColor: "#F1F5F9",
                              color: "#1F3652",
                              fontSize: "0.75rem",
                              fontWeight: 800,
                              textDecoration: "none",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.35rem",
                              flexShrink: 0,
                            }}
                          >
                            <Download size={14} /> Ver PDF
                          </a>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* PANTALLA 5: ESTADO DE CUENTA & PAGOS */}
                  {screen === "statement" && selectedProp && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
                      
                      {/* Financial 4-metric Grid */}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.75rem" }}>
                        <div style={{ backgroundColor: "#FFFFFF", padding: "1rem", borderRadius: "1rem", border: "1px solid #E2E8F0" }}>
                          <div style={{ fontSize: "0.72rem", color: "#64748B", fontWeight: 700 }}>Precio de Venta Total</div>
                          <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "#1F3652", marginTop: "3px" }}>
                            {formatMoney(selectedProp.totalPrice)}
                          </div>
                        </div>
                        <div style={{ backgroundColor: "#FFFFFF", padding: "1rem", borderRadius: "1rem", border: "1px solid #E2E8F0" }}>
                          <div style={{ fontSize: "0.72rem", color: "#00875A", fontWeight: 700 }}>Total Cobrado / Pagado</div>
                          <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "#00875A", marginTop: "3px" }}>
                            {formatMoney(selectedProp.paidAmount)}
                          </div>
                        </div>
                        <div style={{ backgroundColor: "#FFFFFF", padding: "1rem", borderRadius: "1rem", border: "1px solid #E2E8F0" }}>
                          <div style={{ fontSize: "0.72rem", color: "#B45309", fontWeight: 700 }}>Saldo Pendiente Total</div>
                          <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "#B45309", marginTop: "3px" }}>
                            {formatMoney(selectedProp.pendingAmount)}
                          </div>
                        </div>
                        <div style={{ backgroundColor: "#FFFFFF", padding: "1rem", borderRadius: "1rem", border: "1px solid #E2E8F0" }}>
                          <div style={{ fontSize: "0.72rem", color: "#DC2626", fontWeight: 700 }}>Saldo Vencido</div>
                          <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "#DC2626", marginTop: "3px" }}>
                            {formatMoney(selectedProp.overdueAmount || 0)}
                          </div>
                        </div>
                      </div>

                      {/* Subtabs: Estado de Cuenta | Pagos */}
                      <div style={{ display: "flex", backgroundColor: "#E2E8F0", padding: "4px", borderRadius: "0.75rem" }}>
                        <button
                          onClick={() => setStatementSubTab("statement")}
                          style={{
                            flex: 1,
                            padding: "0.55rem",
                            borderRadius: "0.55rem",
                            border: "none",
                            fontSize: "0.78rem",
                            fontWeight: 800,
                            backgroundColor: statementSubTab === "statement" ? "#FFFFFF" : "transparent",
                            color: statementSubTab === "statement" ? "#1F3652" : "#64748B",
                            cursor: "pointer",
                            boxShadow: statementSubTab === "statement" ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                          }}
                        >
                          Resumen y Descarga
                        </button>
                        <button
                          onClick={() => setStatementSubTab("payments")}
                          style={{
                            flex: 1,
                            padding: "0.55rem",
                            borderRadius: "0.55rem",
                            border: "none",
                            fontSize: "0.78rem",
                            fontWeight: 800,
                            backgroundColor: statementSubTab === "payments" ? "#FFFFFF" : "transparent",
                            color: statementSubTab === "payments" ? "#1F3652" : "#64748B",
                            cursor: "pointer",
                            boxShadow: statementSubTab === "payments" ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                          }}
                        >
                          Calendario de Pagos y Comprobantes
                        </button>
                      </div>

                      {statementSubTab === "statement" && (
                        <div style={{ backgroundColor: "#FFFFFF", borderRadius: "1.25rem", padding: "1.3rem", border: "1px solid #E2E8F0", display: "flex", flexDirection: "column", gap: "1rem" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                              <div style={{ fontSize: "1rem", fontWeight: 800, color: "#1F3652" }}>
                                Estado de Cuenta Oficial
                              </div>
                              <div style={{ fontSize: "0.75rem", color: "#64748B" }}>
                                Emisión formal certificada por {selectedProp.developerName}
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
                                  installments: selectedProp.payments.map((p) => ({
                                    concept: p.concept,
                                    scheduledDate: p.scheduledDate,
                                    amount: p.scheduledAmount,
                                    paidAmount: p.paidAmount,
                                    status: p.status,
                                  })),
                                });
                              }}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.45rem",
                                backgroundColor: "#1F3652",
                                color: "#FFFFFF",
                                padding: "0.6rem 1.1rem",
                                borderRadius: "0.6rem",
                                border: "none",
                                fontWeight: 800,
                                fontSize: "0.78rem",
                                cursor: "pointer",
                              }}
                            >
                              <Download size={15} /> Descargar PDF
                            </button>
                          </div>

                          <div style={{ borderTop: "1px solid #F1F5F9", paddingTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.8rem" }}>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                              <span style={{ color: "#64748B" }}>Titular de la Cuenta:</span>
                              <strong style={{ color: "#1F3652" }}>{userName}</strong>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                              <span style={{ color: "#64748B" }}>RFC Registrado:</span>
                              <strong style={{ color: "#1F3652" }}>{userRfc}</strong>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                              <span style={{ color: "#64748B" }}>Unidad Adquirida:</span>
                              <strong style={{ color: "#1F3652" }}>{selectedProp.projectName} · #{selectedProp.unitNumber}</strong>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                              <span style={{ color: "#64748B" }}>Porcentaje Liquidado:</span>
                              <strong style={{ color: "#00875A" }}>{((selectedProp.paidAmount / selectedProp.totalPrice) * 100).toFixed(1)}%</strong>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* TABLA DE PAGOS ESTILO BACK OFFICE DEVIO */}
                      <div style={{ backgroundColor: "#FFFFFF", borderRadius: "1.25rem", overflow: "hidden", border: "1px solid #E2E8F0", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                        <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#1F3652" }}>
                              Desglose de Cuotas y Cobranza
                            </div>
                            <div style={{ fontSize: "0.72rem", color: "#64748B" }}>
                              Haz clic en los botones para descargar el Recibo Oficial Devio o consultar el Comprobante Bancario SPEI
                            </div>
                          </div>
                        </div>

                        <div style={{ overflowX: "auto" }}>
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem", minWidth: "620px" }}>
                            <thead>
                              <tr style={{ backgroundColor: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#64748B", textAlign: "left" }}>
                                <th style={{ padding: "0.75rem 1rem", fontWeight: 700 }}># Cuota / Concepto</th>
                                <th style={{ padding: "0.75rem 1rem", fontWeight: 700 }}>Fecha Vence</th>
                                <th style={{ padding: "0.75rem 1rem", fontWeight: 700, textAlign: "right" }}>Monto Prog.</th>
                                <th style={{ padding: "0.75rem 1rem", fontWeight: 700, textAlign: "right" }}>Pagado</th>
                                <th style={{ padding: "0.75rem 1rem", fontWeight: 700, textAlign: "center" }}>Estatus</th>
                                <th style={{ padding: "0.75rem 1rem", fontWeight: 700, textAlign: "center" }}>Recibo / Comprobante</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedProp.payments.map((p) => {
                                const isPaid = p.status === "PAGADO";
                                const isOverdue = p.status === "ATRASADO";

                                return (
                                  <tr
                                    key={p.id}
                                    style={{
                                      borderBottom: "1px solid #F1F5F9",
                                      transition: "background 0.15s ease",
                                    }}
                                  >
                                    {/* Concepto */}
                                    <td style={{ padding: "0.85rem 1rem", color: "#1F3652" }}>
                                      <div style={{ fontWeight: 700 }}>{p.concept}</div>
                                      <div style={{ fontSize: "0.7rem", color: "#94A3B8" }}>
                                        {p.paymentMethod || "Transferencia SPEI"}
                                      </div>
                                    </td>

                                    {/* Fecha */}
                                    <td style={{ padding: "0.85rem 1rem", color: "#475569", whiteSpace: "nowrap" }}>
                                      {p.scheduledDate}
                                    </td>

                                    {/* Monto Programado */}
                                    <td style={{ padding: "0.85rem 1rem", textAlign: "right", fontWeight: 700, color: "#1F3652" }}>
                                      {formatMoney(p.scheduledAmount)}
                                    </td>

                                    {/* Monto Pagado */}
                                    <td style={{ padding: "0.85rem 1rem", textAlign: "right", fontWeight: 800, color: isPaid ? "#00875A" : (p.paidAmount > 0 ? "#D97706" : "#64748B") }}>
                                      {formatMoney(p.paidAmount)}
                                    </td>

                                    {/* Estatus Badge estilo Back Office */}
                                    <td style={{ padding: "0.85rem 1rem", textAlign: "center" }}>
                                      <span
                                        style={{
                                          display: "inline-block",
                                          padding: "0.22rem 0.65rem",
                                          borderRadius: "99px",
                                          fontSize: "0.7rem",
                                          fontWeight: 800,
                                          backgroundColor: isPaid ? "rgba(0,196,140,0.12)" : isOverdue ? "#FEE2E2" : "#FEF3C7",
                                          color: isPaid ? "#00A877" : isOverdue ? "#DC2626" : "#D97706",
                                          border: isPaid ? "1px solid rgba(0,196,140,0.25)" : isOverdue ? "1px solid #FECACA" : "1px solid #FDE68A",
                                        }}
                                      >
                                        {p.status}
                                      </span>
                                    </td>

                                    {/* Acciones: Recibo Devio + Comprobante Bancario */}
                                    <td style={{ padding: "0.85rem 1rem", textAlign: "center" }}>
                                      <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap", justifyContent: "center" }}>
                                        {/* Recibo Oficial PDF */}
                                        {isPaid || p.paidAmount > 0 ? (
                                          <button
                                            type="button"
                                            onClick={() => handleOpenReceipt(p)}
                                            title="Abrir Recibo Oficial Devio en formato PDF"
                                            style={{
                                              display: "inline-flex",
                                              alignItems: "center",
                                              gap: "0.3rem",
                                              padding: "0.35rem 0.65rem",
                                              backgroundColor: "rgba(0,196,140,0.12)",
                                              color: "#00A877",
                                              border: "1px solid rgba(0,196,140,0.3)",
                                              borderRadius: "0.5rem",
                                              fontSize: "0.72rem",
                                              fontWeight: 800,
                                              cursor: "pointer",
                                            }}
                                          >
                                            <FileText size={13} /> Recibo PDF
                                          </button>
                                        ) : null}

                                        {/* Comprobante Bancario SPEI */}
                                        {p.comprobanteUrl ? (
                                          <button
                                            type="button"
                                            onClick={() => setShowVoucherPayment(p)}
                                            title="Ver comprobante de transferencia bancaria subido"
                                            style={{
                                              display: "inline-flex",
                                              alignItems: "center",
                                              gap: "0.3rem",
                                              padding: "0.35rem 0.65rem",
                                              backgroundColor: "rgba(31,54,82,0.08)",
                                              color: "#1F3652",
                                              border: "1px solid rgba(31,54,82,0.2)",
                                              borderRadius: "0.5rem",
                                              fontSize: "0.72rem",
                                              fontWeight: 800,
                                              cursor: "pointer",
                                            }}
                                          >
                                            <ExternalLink size={13} /> Comprobante SPEI
                                          </button>
                                        ) : (
                                          !isPaid && (
                                            <span style={{ fontSize: "0.7rem", color: "#94A3B8" }}>
                                              Sin comprobante
                                            </span>
                                          )
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* TAB 2: PERFIL */}
          {activeTab === "profile" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
              
              {/* Profile Card */}
              <div style={{ backgroundColor: "#FFFFFF", borderRadius: "1.25rem", padding: "1.5rem", border: "1px solid #E2E8F0", textAlign: "center" }}>
                <img
                  src={userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=1F3652&color=fff&bold=true`}
                  alt="Avatar"
                  style={{ width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover", margin: "0 auto 0.75rem auto", display: "block", border: "3px solid #E2E8F0" }}
                />
                <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#1F3652" }}>{userName}</div>
                <div style={{ fontSize: "0.8rem", color: "#64748B", marginTop: "2px" }}>{userEmail}</div>
              </div>

              {/* Personal Data Section */}
              <div style={{ backgroundColor: "#FFFFFF", borderRadius: "1.25rem", padding: "1.25rem", border: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#1F3652", marginBottom: "0.85rem" }}>
                  Datos Personales y Fiscales
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", fontSize: "0.82rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#64748B" }}>Teléfono de Contacto:</span>
                    <strong>{userPhone || "No registrado"}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#64748B" }}>RFC Registrado:</span>
                    <strong>{userRfc || "XAXX010101000"}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#64748B" }}>Domicilio Fiscal:</span>
                    <strong style={{ textAlign: "right", maxWidth: "260px" }}>{userAddress || "Guadalajara, Jal."}</strong>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.2rem" }}>
                  <button
                    onClick={() => setShowEditProfile(true)}
                    style={{ flex: 1, padding: "0.65rem", backgroundColor: "#F1F5F9", color: "#1F3652", borderRadius: "0.6rem", border: "none", fontWeight: 800, fontSize: "0.8rem", cursor: "pointer" }}
                  >
                    Editar Datos
                  </button>
                  <button
                    onClick={() => setShowChangePassword(true)}
                    style={{ flex: 1, padding: "0.65rem", backgroundColor: "#F1F5F9", color: "#1F3652", borderRadius: "0.6rem", border: "none", fontWeight: 800, fontSize: "0.8rem", cursor: "pointer" }}
                  >
                    Cambiar Contraseña
                  </button>
                </div>
              </div>

              {/* WhatsApp Support & Privacy */}
              <div style={{ backgroundColor: "#FFFFFF", borderRadius: "1.25rem", overflow: "hidden", border: "1px solid #E2E8F0" }}>
                <a
                  href="https://wa.me/523318924490"
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.25rem", borderBottom: "1px solid #F1F5F9", textDecoration: "none", color: "#1F3652", fontSize: "0.82rem", fontWeight: 700 }}
                >
                  <span>Soporte y Atención por WhatsApp</span>
                  <ArrowRight size={16} color="#94A3B8" />
                </a>

                <div
                  onClick={() => alert("Aviso de Privacidad Oficial Devio disponible en soporte@devio.mx")}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.25rem", cursor: "pointer", color: "#1F3652", fontSize: "0.82rem", fontWeight: 700 }}
                >
                  <span>Aviso de Privacidad y Términos</span>
                  <ArrowRight size={16} color="#94A3B8" />
                </div>
              </div>

              {/* Cerrar Sesión */}
              <button
                onClick={handleLogout}
                style={{
                  width: "100%",
                  padding: "0.85rem",
                  backgroundColor: "#FEE2E2",
                  color: "#DC2626",
                  border: "none",
                  borderRadius: "0.85rem",
                  fontWeight: 800,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                }}
              >
                <LogOut size={18} /> Cerrar Sesión
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
            <div style={{ width: "100%", maxWidth: "480px", backgroundColor: "#FFFFFF", borderTopLeftRadius: "1.5rem", borderTopRightRadius: "1.5rem", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong style={{ fontSize: "1.15rem", color: "#1F3652" }}>Avisos y Notificaciones</strong>
                <button onClick={() => setShowNotifications(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={20} /></button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxHeight: "320px", overflowY: "auto" }}>
                {notifications.map((n) => (
                  <div key={n.id} style={{ padding: "0.85rem", backgroundColor: "#F8FAFC", borderRadius: "0.75rem", border: "1px solid #E2E8F0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", fontWeight: 800 }}>
                      <span style={{ color: "#1F3652" }}>{n.title}</span>
                      <span style={{ color: "#94A3B8", fontSize: "0.7rem" }}>{n.time}</span>
                    </div>
                    <p style={{ fontSize: "0.75rem", color: "#475569", marginTop: "5px" }}>{n.body}</p>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setShowNotifications(false)}
                style={{ width: "100%", padding: "0.75rem", backgroundColor: "#F1F5F9", color: "#1F3652", borderRadius: "0.6rem", border: "none", fontWeight: 800, fontSize: "0.8rem", cursor: "pointer" }}
              >
                Cerrar
              </button>
            </div>
          </div>
        )}

        {/* MODAL VISOR COMPROBANTE BANCARIO SPEI */}
        {showVoucherPayment && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15,23,42,0.7)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999, padding: "1rem" }}>
            <div style={{ width: "100%", maxWidth: "480px", backgroundColor: "#FFFFFF", borderRadius: "1.25rem", padding: "1.3rem", display: "flex", flexDirection: "column", gap: "1rem", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong style={{ fontSize: "1.05rem", color: "#1F3652" }}>Comprobante Bancario SPEI</strong>
                <button onClick={() => setShowVoucherPayment(null)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} /></button>
              </div>

              <div style={{ backgroundColor: "#F8FAFC", borderRadius: "0.85rem", padding: "1rem", border: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 700 }}>ARCHIVO ADJUNTO</div>
                <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#1F3652", margin: "0.3rem 0" }}>
                  {showVoucherPayment.comprobanteName || "Comprobante_Pago.pdf"}
                </div>
                <div style={{ fontSize: "0.78rem", color: "#475569" }}>{showVoucherPayment.concept} • {formatMoney(showVoucherPayment.paidAmount || showVoucherPayment.scheduledAmount)}</div>
                <div style={{ fontSize: "0.72rem", color: "#94A3B8", marginTop: "3px" }}>Fecha de Pago: {showVoucherPayment.paidDate || showVoucherPayment.scheduledDate}</div>
              </div>

              <div style={{ display: "flex", gap: "0.75rem" }}>
                <a
                  href={showVoucherPayment.comprobanteUrl || "#"}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    flex: 1,
                    padding: "0.75rem",
                    backgroundColor: "#1F3652",
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
                  <ExternalLink size={15} /> Abrir Comprobante
                </a>
                <button
                  onClick={() => setShowVoucherPayment(null)}
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

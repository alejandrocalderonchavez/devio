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
} from "lucide-react";

interface ClientProperty {
  id: string;
  clientEmail?: string;
  developerName: string;
  projectName: string;
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
  payments: Array<{
    id: string;
    cuotaNumber: number;
    concept: string;
    amount: number;
    interestAmount: number;
    scheduledDate: string;
    status: "PAGADO" | "PENDIENTE" | "ATRASADO";
    paidDate?: string;
    receiptNumber?: string;
    paymentMethod?: string;
  }>;
  customAttributes: Array<{ label: string; value: string }>;
}

const INITIAL_PROPERTIES: ClientProperty[] = [
  {
    id: "prop-campero-51",
    clientEmail: "jaimepozospizano@gmail.com",
    developerName: "Desarrollos Campero",
    projectName: "Mainstreet Valle Real",
    projectAddress: "Av. del Servidor Público 1425, Zapopan, Jal.",
    unitNumber: "5.1",
    unitType: "Departamento",
    totalPrice: 3077961.5,
    paidAmount: 1613980.36,
    pendingAmount: 1463981.14,
    nextPaymentAmount: 25000,
    nextPaymentDueDate: "Nov 28, 2026",
    nextPaymentDaysRemaining: 65,
    overdueAmount: 125000.14,
    constructionPct: 48,
    lastProgressUpdateDate: "19/03/26",
    estimatedDeliveryDate: "Dic 15, 2027",
    areaM2: 55,
    bedrooms: 1,
    bathrooms: 1,
    parkingSpots: 1,
    floorLevel: 5,
    maintenanceFeeMonthly: 2200,
    images: [
      "https://6d94a8ea50a1bc576a3e8162c197d74f.cdn.bubble.io/f1786128446577x181472833978802980/ChatGPT%20Image%2019%20mar%202026%2C%2011_35_22.png",
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=80",
    ],
    specialtiesProgress: [
      { id: "esp-1", name: "1. Cimentación", percentage: 100 },
      { id: "esp-2", name: "2. Estructura", percentage: 65 },
      { id: "esp-3", name: "3. Instalaciones", percentage: 40 },
      { id: "esp-4", name: "4. Acabados", percentage: 25 },
    ],
    constructionMilestones: [
      {
        id: "ms-1",
        title: "Avance Cimentación y Muros",
        date: "Mar 19, 26",
        photo: "https://6d94a8ea50a1bc576a3e8162c197d74f.cdn.bubble.io/f1786128446577x181472833978802980/ChatGPT%20Image%2019%20mar%202026%2C%2011_35_22.png",
        description: "Muros milán concluidos y zapatas armadas en sótano 2.",
      },
    ],
    documents: [
      { id: "doc-1", title: "Contrato Compraventa Mainstreet 5.1.pdf", category: "CONTRATO", fileSize: "3.2 MB", uploadDate: "28 Ene 2026" },
      { id: "doc-2", title: "Plano Arquitectónico Unidad 5.1.pdf", category: "PLANO", fileSize: "5.1 MB", uploadDate: "28 Ene 2026" },
      { id: "doc-3", title: "Reglamento Interno Mainstreet.pdf", category: "REGLAMENTO", fileSize: "1.4 MB", uploadDate: "30 Ene 2026" },
    ],
    payments: [
      { id: "pay-1", cuotaNumber: 1, concept: "Enganche (50%)", amount: 1538980.5, interestAmount: 0, scheduledDate: "28 Ene 2026", status: "PAGADO", paidDate: "28 Ene 2026", receiptNumber: "REC-001", paymentMethod: "SPEI" },
      { id: "pay-2", cuotaNumber: 2, concept: "Mensualidad 1", amount: 25000, interestAmount: 0, scheduledDate: "28 Feb 2026", status: "PAGADO", paidDate: "28 Feb 2026", receiptNumber: "REC-002", paymentMethod: "SPEI" },
      { id: "pay-3", cuotaNumber: 3, concept: "Mensualidad 2", amount: 25000, interestAmount: 0, scheduledDate: "30 Mar 2026", status: "PAGADO", paidDate: "30 Mar 2026", receiptNumber: "REC-003", paymentMethod: "SPEI" },
      { id: "pay-4", cuotaNumber: 4, concept: "Mensualidad 3", amount: 25000, interestAmount: 0, scheduledDate: "29 Abr 2026", status: "ATRASADO" },
      { id: "pay-5", cuotaNumber: 5, concept: "Mensualidad 4", amount: 25000, interestAmount: 0, scheduledDate: "29 May 2026", status: "ATRASADO" },
      { id: "pay-6", cuotaNumber: 6, concept: "Mensualidad 5", amount: 25000, interestAmount: 0, scheduledDate: "28 Jun 2026", status: "PENDIENTE" },
    ],
    customAttributes: [
      { label: "Orientación", value: "Norte - Panorámica" },
      { label: "Tipo de Vista", value: "Valle Real / Andares" },
      { label: "Cajón Asignado", value: "Sótano 1, #51" },
    ],
  },
  {
    id: "prop-castellana-1c",
    clientEmail: "0242573@up.edu.mx",
    developerName: "Grupo VEQ",
    projectName: "Castellana Residencial",
    projectAddress: "Ramón Aldama del Puerto 5403, Dr. Atl · Guadalajara, Jal.",
    unitNumber: "1C",
    unitType: "Departamento",
    totalPrice: 6000000,
    paidAmount: 1200000,
    pendingAmount: 4800000,
    nextPaymentAmount: 250000,
    nextPaymentDueDate: "Oct 17, 2026",
    nextPaymentDaysRemaining: 24,
    overdueAmount: 250000,
    constructionPct: 66,
    lastProgressUpdateDate: "9/01/26",
    estimatedDeliveryDate: "May 15, 2028",
    areaM2: 57,
    bedrooms: 1,
    bathrooms: 1,
    images: [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1000&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&auto=format&fit=crop&q=80",
    ],
    specialtiesProgress: [
      { id: "esp-1", name: "1. Cimentación", percentage: 43 },
      { id: "esp-2", name: "2. Estructura", percentage: 36 },
      { id: "esp-3", name: "3. Instalaciones", percentage: 73 },
      { id: "esp-4", name: "4. Acabados", percentage: 30 },
    ],
    constructionMilestones: [
      {
        id: "ms-2",
        title: "Avance 2",
        date: "Sep 01, 26",
        photo: "https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=800&auto=format&fit=crop&q=80",
        description: "Colado de losa en nivel 3 e instalación hidrosanitaria principal concluida.",
      },
      {
        id: "ms-1",
        title: "Avance 1",
        date: "Ago 26, 26",
        photo: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&auto=format&fit=crop&q=80",
        description: "Finalización de zapatas y arranque de columnas perimetrales.",
      },
    ],
    documents: [
      { id: "doc-1", title: "Contrato Compraventa Castellana 1C.pdf", category: "CONTRATO", fileSize: "2.4 MB", uploadDate: "17 Ago 2026" },
      { id: "doc-2", title: "Planos Arquitectónicos y Distribución.pdf", category: "PLANO", fileSize: "4.8 MB", uploadDate: "18 Ago 2026" },
      { id: "doc-3", title: "Reglamento de Régimen de Condominio.pdf", category: "REGLAMENTO", fileSize: "1.1 MB", uploadDate: "20 Ago 2026" },
    ],
    payments: [
      { id: "pay-1", cuotaNumber: 1, concept: "Enganche Inicial (20%)", amount: 1200000, interestAmount: 0, scheduledDate: "Ago 17, 26", status: "PAGADO", paidDate: "17 Ago 2026", receiptNumber: "REC-2026-0817-01", paymentMethod: "SPEI Bancomer" },
      { id: "pay-2", cuotaNumber: 2, concept: "Mensualidad 1 de 18", amount: 250000, interestAmount: 0, scheduledDate: "Sep 17, 26", status: "ATRASADO" },
      { id: "pay-3", cuotaNumber: 3, concept: "Mensualidad 2 de 18", amount: 250000, interestAmount: 0, scheduledDate: "Oct 17, 26", status: "PENDIENTE" },
    ],
    customAttributes: [
      { label: "Orientación", value: "Sur - Poniente" },
      { label: "Tipo de Vista", value: "Parque Central / Alberca" },
      { label: "Cajón Asignado", value: "Sótano 2, #E-14" },
      { label: "Bodega", value: "Nivel S1, #B-08" },
      { label: "Paquete de Acabados", value: "Premium Nogal / Granito San Gabriel" },
    ],
  },
  {
    id: "prop-blackeleven-4b",
    clientEmail: "0242573@up.edu.mx",
    developerName: "Desarrollos Black Eleven",
    projectName: "Black Eleven Residencial",
    projectAddress: "Av. Rubén Darío 1120, Col. Providencia · Guadalajara, Jal.",
    unitNumber: "4B",
    unitType: "Departamento",
    totalPrice: 7500000,
    paidAmount: 4500000,
    pendingAmount: 3000000,
    nextPaymentAmount: 300000,
    nextPaymentDueDate: "Nov 01, 2026",
    nextPaymentDaysRemaining: 39,
    overdueAmount: 0,
    constructionPct: 82,
    lastProgressUpdateDate: "15/09/26",
    estimatedDeliveryDate: "Nov 30, 2027",
    areaM2: 84,
    bedrooms: 2,
    bathrooms: 2,
    images: [
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1000&auto=format&fit=crop&q=80",
    ],
    specialtiesProgress: [
      { id: "esp-11", name: "1. Cimentación", percentage: 100 },
      { id: "esp-12", name: "2. Estructura", percentage: 100 },
      { id: "esp-13", name: "3. Instalaciones", percentage: 88 },
      { id: "esp-14", name: "4. Acabados", percentage: 55 },
    ],
    constructionMilestones: [
      { id: "ms-11", title: "Avance Acabados", date: "Sep 15, 26", photo: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800", description: "Pisos porcelánicos y cancelería." },
    ],
    documents: [
      { id: "doc-11", title: "Contrato Compraventa Black Eleven 4B.pdf", category: "CONTRATO", fileSize: "3.1 MB", uploadDate: "05 Jun 2026" },
    ],
    payments: [
      { id: "pay-11", cuotaNumber: 1, concept: "Enganche (30%)", amount: 2250000, interestAmount: 0, scheduledDate: "Jun 05, 26", status: "PAGADO", paidDate: "05 Jun 2026", receiptNumber: "REC-BE-001" },
    ],
    customAttributes: [
      { label: "Orientación", value: "Norte - Oriente" },
      { label: "Vista", value: "Panorámica Ciudad" },
    ],
  },
];

export default function ClientPortalWeb() {
  const router = useRouter();

  // Navigation State
  const [activeTab, setActiveTab] = useState<"properties" | "profile">("properties");
  const [screen, setScreen] = useState<"main" | "detail" | "construction" | "documents" | "statement">("main");
  const [selectedPropId, setSelectedPropId] = useState("prop-campero-51");
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [unitInfoExpanded, setUnitInfoExpanded] = useState(true);
  const [docSearch, setDocSearch] = useState("");
  const [statementSubTab, setStatementSubTab] = useState<"statement" | "payments">("statement");

  // Modals
  const [showNotifications, setShowNotifications] = useState(false);
  const [showReceiptPayment, setShowReceiptPayment] = useState<any | null>(null);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  // User
  const [userName, setUserName] = useState("Jaime Pozos Pizano");
  const [userEmail, setUserEmail] = useState("jaimepozospizano@gmail.com");
  const [userPhone, setUserPhone] = useState("+52 33 3858 9824");
  const [userRfc, setUserRfc] = useState("POPJ991118QC8");
  const [userAddress, setUserAddress] = useState("Av. del Servidor Público 1425, Zapopan, Jal.");

  // Sync user session on mount if logged in from login screen
  useEffect(() => {
    if (typeof window !== "undefined") {
      const rawSession = localStorage.getItem("devio_user_session") || sessionStorage.getItem("devio_user_session");
      if (rawSession) {
        try {
          const session = JSON.parse(rawSession);
          if (session.email) {
            setUserEmail(session.email);
            setUserName(session.fullName || session.name || "Cliente Devio");
            if (session.phone) setUserPhone(session.phone);
            if (session.rfc) setUserRfc(session.rfc);
            if (session.address) setUserAddress(session.address);
          }
        } catch (e) {}
      }
    }
  }, []);

  // Filter properties strictly by logged-in client email
  const userProperties = useMemo(() => {
    const cleanEmail = userEmail.trim().toLowerCase();
    const filtered = INITIAL_PROPERTIES.filter(
      (p) => !p.clientEmail || p.clientEmail.trim().toLowerCase() === cleanEmail
    );
    return filtered.length > 0 ? filtered : [INITIAL_PROPERTIES[0]!];
  }, [userEmail]);

  const selectedProp: ClientProperty = useMemo(() => {
    return (userProperties.find((p) => p.id === selectedPropId) || userProperties[0] || INITIAL_PROPERTIES[0]) as ClientProperty;
  }, [userProperties, selectedPropId]);

  // Notifications
  const [notifications, setNotifications] = useState([
    { id: "notif-1", title: "Aviso de Cuota Vencida", body: "Tu cuota de Desarrollos Campero (Mainstreet Valle Real 5.1) tiene un saldo pendiente.", time: "Hace 2 horas", read: false },
    { id: "notif-2", title: "Nuevo Avance de Obra Publicado", body: "Desarrollos Campero ha subido fotografías del Avance de Cimentación.", time: "Ayer a las 11:30 AM", read: false },
    { id: "notif-3", title: "Recibo de Enganche Emitido", body: "Se generó tu recibo digital oficial por $1,538,980.50 MXN.", time: "28 Ene 2026", read: true },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const formatMoney = (val: number) =>
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
    return selectedProp.documents.filter((d) =>
      d.title.toLowerCase().includes(docSearch.toLowerCase())
    );
  }, [selectedProp.documents, docSearch]);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0F172A", display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "0", boxSizing: "border-box" }}>
      
      {/* Mobile Shell Frame */}
      <div
        style={{
          width: "100%",
          maxWidth: "460px",
          minHeight: "100vh",
          backgroundColor: "#F4F6F9",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          boxShadow: "0 0 40px rgba(0,0,0,0.5)",
          boxSizing: "border-box"
        }}
      >
        {/* HEADER */}
        <div
          style={{
            backgroundColor: "#1F3652",
            color: "#FFFFFF",
            paddingTop: "2.5rem",
            paddingBottom: "1.25rem",
            paddingLeft: "1.25rem",
            paddingRight: "1.25rem",
            borderBottomLeftRadius: "1.5rem",
            borderBottomRightRadius: "1.5rem",
            boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
            zIndex: 10
          }}
        >
          {screen === "main" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <img
                  src="/brand/logo-horizontal-light.png"
                  alt="Devio"
                  style={{ height: "26px", width: "auto", objectFit: "contain", display: "block" }}
                />

                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <button
                    onClick={() => setShowNotifications(true)}
                    style={{
                      position: "relative",
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      backgroundColor: "#F1F5F9",
                      border: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer"
                    }}
                  >
                    <Bell size={18} color="#1F3652" />
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
                          border: "2px solid #1F3652"
                        }}
                      >
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => { setActiveTab("profile"); setScreen("main"); }}
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      overflow: "hidden",
                      border: "2px solid rgba(255,255,255,0.4)",
                      padding: 0,
                      cursor: "pointer"
                    }}
                  >
                    <img
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"
                      alt="Avatar"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </button>
                </div>
              </div>

              {activeTab === "properties" ? (
                <div>
                  <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.75)", fontWeight: 500 }}>Hola,</div>
                  <div style={{ fontSize: "1.35rem", fontWeight: 800, letterSpacing: "-0.02em" }}>{userName}</div>
                </div>
              ) : (
                <div style={{ fontSize: "1.25rem", fontWeight: 800 }}>Mi Perfil</div>
              )}
            </div>
          ) : (
            /* Sub-screen Header with Back Arrow */
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <button
                onClick={() => setScreen("main")}
                style={{
                  background: "rgba(255,255,255,0.15)",
                  border: "none",
                  borderRadius: "50%",
                  width: "36px",
                  height: "36px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#FFFFFF",
                  cursor: "pointer"
                }}
              >
                <ArrowLeft size={18} />
              </button>

              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.75)", fontWeight: 700, textTransform: "uppercase" }}>
                  {screen === "detail" ? "Detalle Propiedad" : (screen === "construction" ? "Avance de Obra" : (screen === "documents" ? "Documentación" : "Estado de Cuenta"))}
                </div>
                <div style={{ fontSize: "0.95rem", fontWeight: 800 }}>{selectedProp.projectName} ({selectedProp.unitNumber})</div>
              </div>

              <div style={{ width: "36px" }} />
            </div>
          )}
        </div>

        {/* SCROLLABLE BODY */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1rem", paddingBottom: "5.5rem" }}>
          
          {/* TAB 1: PROPIEDADES */}
          {activeTab === "properties" && (
            <>
              {/* PANTALLA 1: LISTA PRINCIPAL (MIS PROPIEDADES) */}
              {screen === "main" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  
                  {/* Banner: Tu Próximo Pago */}
                  <div
                    style={{
                      background: "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)",
                      borderRadius: "1rem",
                      padding: "1rem 1.15rem",
                      color: "#FFFFFF",
                      boxShadow: "0 4px 10px rgba(0,0,0,0.12)",
                      border: "1px solid rgba(255,255,255,0.08)"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                      <span style={{ fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.05em", color: "#FBBF24", textTransform: "uppercase" }}>
                        Tu Próximo Pago
                      </span>
                      <span style={{ fontSize: "0.7rem", color: "#94A3B8" }}>
                        {selectedProp.nextPaymentDaysRemaining} días restantes
                      </span>
                    </div>

                    <div style={{ fontSize: "1.45rem", fontWeight: 900, color: "#FFFFFF" }}>
                      {formatMoney(selectedProp.nextPaymentAmount)}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#94A3B8", marginTop: "0.2rem" }}>
                      Vence el {selectedProp.nextPaymentDueDate} • {selectedProp.projectName} ({selectedProp.unitNumber})
                    </div>

                    {selectedProp.overdueAmount ? (
                      <div
                        style={{
                          marginTop: "0.65rem",
                          backgroundColor: "rgba(239, 68, 68, 0.15)",
                          border: "1px solid rgba(239, 68, 68, 0.3)",
                          borderRadius: "0.5rem",
                          padding: "0.4rem 0.6rem",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          fontSize: "0.7rem"
                        }}
                      >
                        <span style={{ color: "#F87171", fontWeight: 700 }}>Saldo Vencido</span>
                        <span style={{ color: "#F87171", fontWeight: 900 }}>{formatMoney(selectedProp.overdueAmount)}</span>
                      </div>
                    ) : null}
                  </div>

                  {/* List of Properties */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.25rem" }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#1F3652" }}>
                      Tus Propiedades ({userProperties.length})
                    </span>
                  </div>

                  {userProperties.map((prop) => (
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
                        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                        border: "1px solid #E2E8F0",
                        cursor: "pointer",
                        transition: "transform 0.15s ease"
                      }}
                    >
                      <div style={{ position: "relative", height: "160px", backgroundColor: "#E2E8F0" }}>
                        <img
                          src={prop.images[0]}
                          alt={prop.projectName}
                          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                        />
                        <div
                          style={{
                            position: "absolute",
                            top: "10px",
                            left: "10px",
                            backgroundColor: "rgba(31, 54, 82, 0.85)",
                            color: "#FFFFFF",
                            padding: "0.2rem 0.6rem",
                            borderRadius: "99px",
                            fontSize: "0.7rem",
                            fontWeight: 800
                          }}
                        >
                          {prop.developerName}
                        </div>
                        <div
                          style={{
                            position: "absolute",
                            bottom: "10px",
                            right: "10px",
                            backgroundColor: "rgba(0, 0, 0, 0.75)",
                            color: "#FFFFFF",
                            padding: "0.2rem 0.55rem",
                            borderRadius: "0.4rem",
                            fontSize: "0.7rem",
                            fontWeight: 800
                          }}
                        >
                          Unidad {prop.unitNumber}
                        </div>
                      </div>

                      <div style={{ padding: "0.9rem" }}>
                        <div style={{ fontSize: "1rem", fontWeight: 800, color: "#1F3652" }}>
                          {prop.projectName}
                        </div>
                        <div style={{ fontSize: "0.7rem", color: "#64748B", marginTop: "2px" }}>
                          {prop.projectAddress}
                        </div>

                        {/* Specs row */}
                        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.6rem" }}>
                          <span style={{ fontSize: "0.7rem", backgroundColor: "#F1F5F9", color: "#475569", padding: "0.2rem 0.5rem", borderRadius: "0.4rem", fontWeight: 600 }}>
                            {prop.areaM2} m²
                          </span>
                          <span style={{ fontSize: "0.7rem", backgroundColor: "#F1F5F9", color: "#475569", padding: "0.2rem 0.5rem", borderRadius: "0.4rem", fontWeight: 600 }}>
                            {prop.bedrooms} Rec.
                          </span>
                          <span style={{ fontSize: "0.7rem", backgroundColor: "#F1F5F9", color: "#475569", padding: "0.2rem 0.5rem", borderRadius: "0.4rem", fontWeight: 600 }}>
                            {prop.bathrooms} Baños
                          </span>
                        </div>

                        {/* Obra progress bar */}
                        <div style={{ marginTop: "0.75rem" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", fontWeight: 700, marginBottom: "3px" }}>
                            <span style={{ color: "#475569" }}>Avance de Obra</span>
                            <span style={{ color: "#00875A" }}>{prop.constructionPct}%</span>
                          </div>
                          <div style={{ height: "6px", backgroundColor: "#E2E8F0", borderRadius: "99px", overflow: "hidden" }}>
                            <div style={{ width: `${prop.constructionPct}%`, height: "100%", backgroundColor: "#00C48C", borderRadius: "99px" }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* PANTALLA 2: DETALLE DE PROPIEDAD */}
              {screen === "detail" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  
                  {/* Photo Carousel & Thumbnails */}
                  <div style={{ backgroundColor: "#FFFFFF", borderRadius: "1.25rem", overflow: "hidden", border: "1px solid #E2E8F0" }}>
                    <div style={{ height: "200px", width: "100%", position: "relative", backgroundColor: "#E2E8F0" }}>
                      <img
                        src={selectedProp.images[selectedImageIdx] || selectedProp.images[0]}
                        alt="Foto Propiedad"
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      />
                    </div>
                    {selectedProp.images.length > 1 && (
                      <div style={{ display: "flex", gap: "0.5rem", padding: "0.6rem", backgroundColor: "#F8FAFC", overflowX: "auto" }}>
                        {selectedProp.images.map((img, idx) => (
                          <button
                            key={idx}
                            onClick={() => setSelectedImageIdx(idx)}
                            style={{
                              width: "50px",
                              height: "38px",
                              borderRadius: "0.35rem",
                              overflow: "hidden",
                              border: selectedImageIdx === idx ? "2px solid #1F3652" : "1px solid #CBD5E1",
                              cursor: "pointer",
                              padding: 0,
                              flexShrink: 0
                            }}
                          >
                            <img src={img} alt="Thumb" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Payment Pills & Balance Button */}
                  <div style={{ backgroundColor: "#FFFFFF", borderRadius: "1rem", padding: "1rem", border: "1px solid #E2E8F0" }}>
                    <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
                      <div style={{ flex: 1, backgroundColor: "#FEF3C7", border: "1px solid #FDE68A", borderRadius: "0.6rem", padding: "0.5rem 0.65rem" }}>
                        <div style={{ fontSize: "0.65rem", color: "#92400E", fontWeight: 700 }}>Tu Próximo Pago</div>
                        <div style={{ fontSize: "0.95rem", fontWeight: 900, color: "#78350F", marginTop: "2px" }}>
                          {formatMoney(selectedProp.nextPaymentAmount)}
                        </div>
                      </div>
                      <div style={{ flex: 1, backgroundColor: "#FEE2E2", border: "1px solid #FECACA", borderRadius: "0.6rem", padding: "0.5rem 0.65rem" }}>
                        <div style={{ fontSize: "0.65rem", color: "#991B1B", fontWeight: 700 }}>Saldo Vencido</div>
                        <div style={{ fontSize: "0.95rem", fontWeight: 900, color: "#7F1D1D", marginTop: "2px" }}>
                          {formatMoney(selectedProp.overdueAmount || 0)}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => { setScreen("statement"); setStatementSubTab("payments"); }}
                      style={{
                        width: "100%",
                        padding: "0.7rem",
                        backgroundColor: "#1F3652",
                        color: "#FFFFFF",
                        border: "none",
                        borderRadius: "0.6rem",
                        fontWeight: 800,
                        fontSize: "0.8rem",
                        cursor: "pointer"
                      }}
                    >
                      Ver Saldo y Pagos
                    </button>
                  </div>

                  {/* Avance de Obra Summary Card */}
                  <div style={{ backgroundColor: "#FFFFFF", borderRadius: "1rem", padding: "1rem", border: "1px solid #E2E8F0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: "0.7rem", color: "#64748B", fontWeight: 700 }}>Avance de Obra</div>
                        <div style={{ fontSize: "1.25rem", fontWeight: 900, color: "#00875A", marginTop: "2px" }}>
                          {selectedProp.constructionPct}%
                        </div>
                      </div>
                      <button
                        onClick={() => setScreen("construction")}
                        style={{
                          backgroundColor: "#F1F5F9",
                          color: "#1F3652",
                          border: "none",
                          padding: "0.45rem 0.85rem",
                          borderRadius: "0.5rem",
                          fontSize: "0.75rem",
                          fontWeight: 800,
                          cursor: "pointer"
                        }}
                      >
                        Ver Avances
                      </button>
                    </div>
                  </div>

                  {/* Resumen Financiero */}
                  <div style={{ backgroundColor: "#FFFFFF", borderRadius: "1rem", padding: "1rem", border: "1px solid #E2E8F0" }}>
                    <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "#1F3652", marginBottom: "0.65rem" }}>
                      Resumen Financiero
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", fontSize: "0.75rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#64748B" }}>Precio de Venta:</span>
                        <strong style={{ color: "#1E293B" }}>{formatMoney(selectedProp.totalPrice)}</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#64748B" }}>Total Pagado:</span>
                        <strong style={{ color: "#00875A" }}>{formatMoney(selectedProp.paidAmount)}</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#64748B" }}>Saldo Pendiente:</span>
                        <strong style={{ color: "#B45309" }}>{formatMoney(selectedProp.pendingAmount)}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Acciones Rápidas */}
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      onClick={() => setScreen("documents")}
                      style={{
                        flex: 1,
                        padding: "0.75rem 0.5rem",
                        backgroundColor: "#FFFFFF",
                        border: "1px solid #E2E8F0",
                        borderRadius: "0.75rem",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "0.25rem",
                        cursor: "pointer"
                      }}
                    >
                      <FileText size={18} color="#1F3652" />
                      <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#1F3652" }}>Documentos</span>
                    </button>

                    <button
                      onClick={() => { setScreen("statement"); setStatementSubTab("statement"); }}
                      style={{
                        flex: 1,
                        padding: "0.75rem 0.5rem",
                        backgroundColor: "#FFFFFF",
                        border: "1px solid #E2E8F0",
                        borderRadius: "0.75rem",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "0.25rem",
                        cursor: "pointer"
                      }}
                    >
                      <CreditCard size={18} color="#1F3652" />
                      <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#1F3652" }}>Estado de Cuenta</span>
                    </button>

                    <Link
                      href="/marketplace"
                      style={{
                        flex: 1,
                        padding: "0.75rem 0.5rem",
                        backgroundColor: "#FFFFFF",
                        border: "1px solid #E2E8F0",
                        borderRadius: "0.75rem",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "0.25rem",
                        textDecoration: "none",
                        cursor: "pointer"
                      }}
                    >
                      <ShoppingBag size={18} color="#1F3652" />
                      <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#1F3652" }}>Marketplace</span>
                    </Link>
                  </div>

                  {/* Información de la Unidad (Collapsible) */}
                  <div style={{ backgroundColor: "#FFFFFF", borderRadius: "1rem", padding: "1rem", border: "1px solid #E2E8F0" }}>
                    <div
                      onClick={() => setUnitInfoExpanded(!unitInfoExpanded)}
                      style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
                    >
                      <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#1F3652" }}>Información de la Unidad</span>
                      {unitInfoExpanded ? <ChevronUp size={16} color="#64748B" /> : <ChevronDown size={16} color="#64748B" />}
                    </div>

                    {unitInfoExpanded && (
                      <div style={{ marginTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.45rem", fontSize: "0.75rem", borderTop: "1px solid #F1F5F9", paddingTop: "0.6rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: "#64748B" }}>Superficie:</span>
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
              {screen === "construction" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  
                  {/* General Progress Card */}
                  <div style={{ backgroundColor: "#FFFFFF", borderRadius: "1rem", padding: "1.1rem", border: "1px solid #E2E8F0" }}>
                    <div style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 700 }}>Avance de Obra</div>
                    <div style={{ fontSize: "2rem", fontWeight: 900, color: "#00875A", margin: "0.2rem 0" }}>
                      {selectedProp.constructionPct}%
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "#64748B" }}>
                      Fecha estimada de entrega: <strong>{selectedProp.estimatedDeliveryDate}</strong>
                    </div>
                  </div>

                  {/* Avance por Especialidad */}
                  <div style={{ backgroundColor: "#FFFFFF", borderRadius: "1rem", padding: "1rem", border: "1px solid #E2E8F0" }}>
                    <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "#1F3652", marginBottom: "0.75rem" }}>
                      Avance por Especialidad
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                      {selectedProp.specialtiesProgress.map((esp) => (
                        <div key={esp.id}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", fontWeight: 700, marginBottom: "4px" }}>
                            <span style={{ color: "#334155" }}>{esp.name}</span>
                            <span style={{ color: "#00875A" }}>{esp.percentage}%</span>
                          </div>
                          <div style={{ height: "6px", backgroundColor: "#E2E8F0", borderRadius: "99px", overflow: "hidden" }}>
                            <div style={{ width: `${esp.percentage}%`, height: "100%", backgroundColor: "#00C48C", borderRadius: "99px" }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Histórico Avances de Obra */}
                  <div style={{ backgroundColor: "#FFFFFF", borderRadius: "1rem", padding: "1rem", border: "1px solid #E2E8F0" }}>
                    <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "#1F3652", marginBottom: "0.75rem" }}>
                      Histórico Avances de Obra
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                      {selectedProp.constructionMilestones.map((m) => (
                        <div key={m.id} style={{ borderRadius: "0.75rem", overflow: "hidden", border: "1px solid #E2E8F0" }}>
                          <img src={m.photo} alt={m.title} style={{ width: "100%", height: "140px", objectFit: "cover", display: "block" }} />
                          <div style={{ padding: "0.75rem" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <strong style={{ fontSize: "0.85rem", color: "#1F3652" }}>{m.title}</strong>
                              <span style={{ fontSize: "0.65rem", color: "#64748B" }}>{m.date}</span>
                            </div>
                            <p style={{ fontSize: "0.7rem", color: "#475569", marginTop: "0.35rem", lineHeight: 1.4 }}>
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
              {screen === "documents" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                  {/* Search Bar */}
                  <div style={{ position: "relative" }}>
                    <Search size={16} color="#94A3B8" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
                    <input
                      type="text"
                      placeholder="Buscar documentos..."
                      value={docSearch}
                      onChange={(e) => setDocSearch(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "0.65rem 0.85rem 0.65rem 2.2rem",
                        borderRadius: "0.75rem",
                        border: "1px solid #CBD5E1",
                        fontSize: "0.8rem",
                        backgroundColor: "#FFFFFF",
                        boxSizing: "border-box"
                      }}
                    />
                  </div>

                  {filteredDocs.map((doc) => (
                    <div
                      key={doc.id}
                      style={{
                        backgroundColor: "#FFFFFF",
                        borderRadius: "0.85rem",
                        padding: "0.85rem",
                        border: "1px solid #E2E8F0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", minWidth: 0 }}>
                        <FileText size={20} color="#1F3652" style={{ flexShrink: 0 }} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#1E293B", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {doc.title}
                          </div>
                          <div style={{ fontSize: "0.65rem", color: "#94A3B8" }}>
                            {doc.fileSize} • {doc.uploadDate}
                          </div>
                        </div>
                      </div>

                      <a
                        href={doc.fileUrl || "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          padding: "0.4rem 0.65rem",
                          borderRadius: "0.4rem",
                          backgroundColor: "#F1F5F9",
                          color: "#1F3652",
                          fontSize: "0.7rem",
                          fontWeight: 800,
                          textDecoration: "none",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.25rem"
                        }}
                      >
                        <Download size={13} /> Ver
                      </a>
                    </div>
                  ))}
                </div>
              )}

              {/* PANTALLA 5: ESTADO DE CUENTA & PAGOS */}
              {screen === "statement" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  
                  {/* Financial 2x2 Grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                    <div style={{ backgroundColor: "#FFFFFF", padding: "0.75rem", borderRadius: "0.75rem", border: "1px solid #E2E8F0" }}>
                      <div style={{ fontSize: "0.65rem", color: "#64748B", fontWeight: 700 }}>Precio de Venta</div>
                      <div style={{ fontSize: "0.95rem", fontWeight: 900, color: "#1F3652", marginTop: "2px" }}>
                        {formatMoney(selectedProp.totalPrice)}
                      </div>
                    </div>
                    <div style={{ backgroundColor: "#FFFFFF", padding: "0.75rem", borderRadius: "0.75rem", border: "1px solid #E2E8F0" }}>
                      <div style={{ fontSize: "0.65rem", color: "#00875A", fontWeight: 700 }}>Total Pagado</div>
                      <div style={{ fontSize: "0.95rem", fontWeight: 900, color: "#00875A", marginTop: "2px" }}>
                        {formatMoney(selectedProp.paidAmount)}
                      </div>
                    </div>
                    <div style={{ backgroundColor: "#FFFFFF", padding: "0.75rem", borderRadius: "0.75rem", border: "1px solid #E2E8F0" }}>
                      <div style={{ fontSize: "0.65rem", color: "#B45309", fontWeight: 700 }}>Saldo Pendiente</div>
                      <div style={{ fontSize: "0.95rem", fontWeight: 900, color: "#B45309", marginTop: "2px" }}>
                        {formatMoney(selectedProp.pendingAmount)}
                      </div>
                    </div>
                    <div style={{ backgroundColor: "#FFFFFF", padding: "0.75rem", borderRadius: "0.75rem", border: "1px solid #E2E8F0" }}>
                      <div style={{ fontSize: "0.65rem", color: "#DC2626", fontWeight: 700 }}>Moratorios</div>
                      <div style={{ fontSize: "0.95rem", fontWeight: 900, color: "#DC2626", marginTop: "2px" }}>
                        {formatMoney(0)}
                      </div>
                    </div>
                  </div>

                  {/* Descargar Estado de Cuenta button */}
                  <button
                    onClick={() => alert("Descargando Estado de Cuenta en formato oficial PDF...")}
                    style={{
                      width: "100%",
                      padding: "0.7rem",
                      backgroundColor: "#1F3652",
                      color: "#FFFFFF",
                      borderRadius: "0.6rem",
                      border: "none",
                      fontWeight: 800,
                      fontSize: "0.75rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.4rem",
                      cursor: "pointer"
                    }}
                  >
                    <Download size={15} /> Descargar Estado de Cuenta
                  </button>

                  {/* Subtabs: Estado de Cuenta | Pagos */}
                  <div style={{ display: "flex", backgroundColor: "#E2E8F0", padding: "3px", borderRadius: "0.6rem" }}>
                    <button
                      onClick={() => setStatementSubTab("statement")}
                      style={{
                        flex: 1,
                        padding: "0.45rem",
                        borderRadius: "0.45rem",
                        border: "none",
                        fontSize: "0.7rem",
                        fontWeight: 800,
                        backgroundColor: statementSubTab === "statement" ? "#FFFFFF" : "transparent",
                        color: statementSubTab === "statement" ? "#1F3652" : "#64748B",
                        cursor: "pointer"
                      }}
                    >
                      Estado de Cuenta
                    </button>
                    <button
                      onClick={() => setStatementSubTab("payments")}
                      style={{
                        flex: 1,
                        padding: "0.45rem",
                        borderRadius: "0.45rem",
                        border: "none",
                        fontSize: "0.7rem",
                        fontWeight: 800,
                        backgroundColor: statementSubTab === "payments" ? "#FFFFFF" : "transparent",
                        color: statementSubTab === "payments" ? "#1F3652" : "#64748B",
                        cursor: "pointer"
                      }}
                    >
                      Pagos
                    </button>
                  </div>

                  {/* Installments Table */}
                  <div style={{ backgroundColor: "#FFFFFF", borderRadius: "1rem", overflow: "hidden", border: "1px solid #E2E8F0" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.7rem" }}>
                      <thead>
                        <tr style={{ backgroundColor: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#64748B", textAlign: "left" }}>
                          <th style={{ padding: "0.55rem 0.65rem" }}>Unidad</th>
                          <th style={{ padding: "0.55rem 0.65rem" }}>Cantidad</th>
                          <th style={{ padding: "0.55rem 0.65rem" }}>Intereses</th>
                          <th style={{ padding: "0.55rem 0.65rem", textAlign: "right" }}>Estatus</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedProp.payments.map((p) => (
                          <tr
                            key={p.id}
                            onClick={() => {
                              if (p.status === "PAGADO") setShowReceiptPayment(p);
                            }}
                            style={{
                              borderBottom: "1px solid #F1F5F9",
                              cursor: p.status === "PAGADO" ? "pointer" : "default"
                            }}
                          >
                            <td style={{ padding: "0.6rem 0.65rem", fontWeight: 700 }}>
                              {selectedProp.unitNumber}
                            </td>
                            <td style={{ padding: "0.6rem 0.65rem", fontWeight: 800, color: "#1F3652" }}>
                              {formatMoney(p.amount)}
                            </td>
                            <td style={{ padding: "0.6rem 0.65rem", color: "#64748B" }}>
                              $0
                            </td>
                            <td style={{ padding: "0.6rem 0.65rem", textAlign: "right" }}>
                              <span
                                style={{
                                  display: "inline-block",
                                  padding: "0.15rem 0.45rem",
                                  borderRadius: "99px",
                                  fontSize: "0.65rem",
                                  fontWeight: 800,
                                  backgroundColor: p.status === "PAGADO" ? "rgba(0,196,140,0.15)" : (p.status === "ATRASADO" ? "rgba(240,61,48,0.15)" : "rgba(234,207,78,0.2)"),
                                  color: p.status === "PAGADO" ? "#00875A" : (p.status === "ATRASADO" ? "#D92D20" : "#B58A00")
                                }}
                              >
                                {p.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {/* TAB 2: PERFIL */}
          {activeTab === "profile" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              
              {/* Profile Card */}
              <div style={{ backgroundColor: "#FFFFFF", borderRadius: "1.25rem", padding: "1.25rem", border: "1px solid #E2E8F0", textAlign: "center" }}>
                <img
                  src={userEmail === "0242573@up.edu.mx" ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80" : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80"}
                  alt="Avatar"
                  style={{ width: "70px", height: "70px", borderRadius: "50%", objectFit: "cover", margin: "0 auto 0.5rem auto", display: "block" }}
                />
                <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#1F3652" }}>{userName}</div>
                <div style={{ fontSize: "0.75rem", color: "#64748B" }}>{userEmail}</div>

                {/* Staging Account Switcher */}
                <div style={{ marginTop: "0.85rem", paddingTop: "0.75rem", borderTop: "1px solid #F1F5F9", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                  <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase" }}>Cambiar de Cliente (Pruebas)</span>
                  <select
                    value={userEmail}
                    onChange={(e) => {
                      const newEmail = e.target.value;
                      setUserEmail(newEmail);
                      if (newEmail === "jaimepozospizano@gmail.com") {
                        setUserName("Jaime Pozos Pizano");
                        setUserPhone("+52 33 3858 9824");
                        setUserRfc("POPJ991118QC8");
                        setUserAddress("Av. del Servidor Público 1425, Zapopan, Jal.");
                        setSelectedPropId("prop-campero-51");
                      } else {
                        setUserName("Iñigo Heredia Horner");
                        setUserPhone("+52 33 1892 4490");
                        setUserRfc("HEHI9604128N2");
                        setUserAddress("Av. Providencia 2340, Depto 402, Guadalajara, Jal.");
                        setSelectedPropId("prop-castellana-1c");
                      }
                    }}
                    style={{
                      width: "100%",
                      padding: "0.45rem",
                      borderRadius: "0.5rem",
                      border: "1px solid #CBD5E1",
                      backgroundColor: "#F8FAFC",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      color: "#1F3652",
                      cursor: "pointer"
                    }}
                  >
                    <option value="jaimepozospizano@gmail.com">Jaime Pozos (Desarrollos Campero)</option>
                    <option value="0242573@up.edu.mx">Iñigo Heredia (Grupo VEQ)</option>
                  </select>
                </div>
              </div>

              {/* Personal Data Section */}
              <div style={{ backgroundColor: "#FFFFFF", borderRadius: "1rem", padding: "1rem", border: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: "0.8rem", fontWeight: 800, color: "#1F3652", marginBottom: "0.75rem" }}>
                  Datos Personales
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.75rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#64748B" }}>Teléfono:</span>
                    <strong>{userPhone}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#64748B" }}>RFC:</span>
                    <strong>{userRfc}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#64748B" }}>Domicilio:</span>
                    <strong style={{ textAlign: "right", maxWidth: "200px" }}>{userAddress}</strong>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
                  <button
                    onClick={() => setShowEditProfile(true)}
                    style={{ flex: 1, padding: "0.55rem", backgroundColor: "#F1F5F9", color: "#1F3652", borderRadius: "0.5rem", border: "none", fontWeight: 800, fontSize: "0.75rem", cursor: "pointer" }}
                  >
                    Editar Datos
                  </button>
                  <button
                    onClick={() => setShowChangePassword(true)}
                    style={{ flex: 1, padding: "0.55rem", backgroundColor: "#F1F5F9", color: "#1F3652", borderRadius: "0.5rem", border: "none", fontWeight: 800, fontSize: "0.75rem", cursor: "pointer" }}
                  >
                    Cambiar Contraseña
                  </button>
                </div>
              </div>

              {/* WhatsApp Support & Legal */}
              <div style={{ backgroundColor: "#FFFFFF", borderRadius: "1rem", overflow: "hidden", border: "1px solid #E2E8F0" }}>
                <a
                  href="https://wa.me/523318924490"
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.85rem 1rem", borderBottom: "1px solid #F1F5F9", textDecoration: "none", color: "#1F3652", fontSize: "0.75rem", fontWeight: 700 }}
                >
                  <span>Soporte por WhatsApp</span>
                  <ArrowRight size={14} color="#94A3B8" />
                </a>

                <div
                  onClick={() => alert("Aviso de Privacidad Oficial Devio disponible en soporte@devio.mx")}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.85rem 1rem", cursor: "pointer", color: "#1F3652", fontSize: "0.75rem", fontWeight: 700 }}
                >
                  <span>Aviso de Privacidad</span>
                  <ArrowRight size={14} color="#94A3B8" />
                </div>
              </div>

              {/* Cerrar Sesión */}
              <button
                onClick={handleLogout}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  backgroundColor: "#FEE2E2",
                  color: "#DC2626",
                  border: "none",
                  borderRadius: "0.75rem",
                  fontWeight: 800,
                  fontSize: "0.8rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.4rem"
                }}
              >
                <LogOut size={16} /> Cerrar Sesión
              </button>
            </div>
          )}

        </div>

        {/* BOTTOM FIXED TABS */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "60px",
            backgroundColor: "#FFFFFF",
            borderTop: "1px solid #E2E8F0",
            display: "flex",
            justifyContent: "space-around",
            alignItems: "center",
            boxShadow: "0 -2px 10px rgba(0,0,0,0.05)",
            zIndex: 30
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
              gap: "2px",
              cursor: "pointer",
              color: activeTab === "properties" ? "#1F3652" : "#94A3B8"
            }}
          >
            <div style={{
              width: "36px",
              height: "24px",
              borderRadius: "12px",
              backgroundColor: activeTab === "properties" ? "#1F3652" : "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <Home size={18} color={activeTab === "properties" ? "#FFFFFF" : "#94A3B8"} />
            </div>
            <span style={{ fontSize: "0.65rem", fontWeight: 800 }}>Propiedades</span>
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
              gap: "2px",
              cursor: "pointer",
              color: activeTab === "profile" ? "#1F3652" : "#94A3B8"
            }}
          >
            <div style={{
              width: "36px",
              height: "24px",
              borderRadius: "12px",
              backgroundColor: activeTab === "profile" ? "#1F3652" : "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <User size={18} color={activeTab === "profile" ? "#FFFFFF" : "#94A3B8"} />
            </div>
            <span style={{ fontSize: "0.65rem", fontWeight: 800 }}>Perfil</span>
          </button>
        </div>

        {/* MODAL NOTIFICACIONES PUSH */}
        {showNotifications && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15,23,42,0.6)", display: "flex", justifyContent: "center", alignItems: "flex-end", zIndex: 9999 }}>
            <div style={{ width: "100%", maxWidth: "440px", backgroundColor: "#FFFFFF", borderTopLeftRadius: "1.5rem", borderTopRightRadius: "1.5rem", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong style={{ fontSize: "1.1rem", color: "#1F3652" }}>Avisos y Notificaciones</strong>
                <button onClick={() => setShowNotifications(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} /></button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", maxHeight: "300px", overflowY: "auto" }}>
                {notifications.map((n) => (
                  <div key={n.id} style={{ padding: "0.75rem", backgroundColor: "#F8FAFC", borderRadius: "0.6rem", border: "1px solid #E2E8F0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", fontWeight: 800 }}>
                      <span style={{ color: "#1F3652" }}>{n.title}</span>
                      <span style={{ color: "#94A3B8", fontSize: "0.65rem" }}>{n.time}</span>
                    </div>
                    <p style={{ fontSize: "0.7rem", color: "#475569", marginTop: "4px" }}>{n.body}</p>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setShowNotifications(false)}
                style={{ width: "100%", padding: "0.65rem", backgroundColor: "#F1F5F9", color: "#1F3652", borderRadius: "0.5rem", border: "none", fontWeight: 800, fontSize: "0.75rem", cursor: "pointer" }}
              >
                Cerrar
              </button>
            </div>
          </div>
        )}

        {/* MODAL RECIBO OFICIAL PDF */}
        {showReceiptPayment && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15,23,42,0.7)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999, padding: "1rem" }}>
            <div style={{ width: "100%", maxWidth: "380px", backgroundColor: "#FFFFFF", borderRadius: "1.25rem", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.85rem", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <img src="/brand/logo-horizontal-main.png" alt="Devio" style={{ height: "20px", width: "auto" }} />
                <button onClick={() => setShowReceiptPayment(null)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={16} /></button>
              </div>

              <div style={{ backgroundColor: "#F8FAFC", borderRadius: "0.75rem", padding: "0.85rem", border: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: "0.65rem", color: "#64748B", fontWeight: 700 }}>FOLIO OFICIAL: {showReceiptPayment.receiptNumber}</div>
                <div style={{ fontSize: "1.35rem", fontWeight: 900, color: "#00875A", margin: "0.25rem 0" }}>
                  {formatMoney(showReceiptPayment.amount)} MXN
                </div>
                <div style={{ fontSize: "0.7rem", color: "#475569" }}>{showReceiptPayment.concept}</div>
                <div style={{ fontSize: "0.65rem", color: "#94A3B8", marginTop: "2px" }}>Fecha: {showReceiptPayment.paidDate || showReceiptPayment.scheduledDate}</div>
              </div>

              <button
                onClick={() => {
                  alert(`Descargando comprobante oficial ${showReceiptPayment.receiptNumber} en PDF...`);
                  setShowReceiptPayment(null);
                }}
                style={{ width: "100%", padding: "0.7rem", backgroundColor: "#1F3652", color: "#FFFFFF", borderRadius: "0.6rem", border: "none", fontWeight: 800, fontSize: "0.75rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}
              >
                <Download size={14} /> Descargar Recibo PDF
              </button>
            </div>
          </div>
        )}

        {/* MODAL EDITAR PERFIL */}
        {showEditProfile && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15,23,42,0.6)", display: "flex", justifyContent: "center", alignItems: "flex-end", zIndex: 9999 }}>
            <div style={{ width: "100%", maxWidth: "460px", backgroundColor: "#FFFFFF", borderTopLeftRadius: "1.5rem", borderTopRightRadius: "1.5rem", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong style={{ fontSize: "1rem", color: "#1F3652" }}>Editar Datos</strong>
                <button onClick={() => setShowEditProfile(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={16} /></button>
              </div>

              <div>
                <label style={{ fontSize: "0.7rem", fontWeight: 700, color: "#475569" }}>Nombre</label>
                <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} style={{ width: "100%", padding: "0.5rem", borderRadius: "0.4rem", border: "1px solid #CBD5E1", fontSize: "0.75rem", marginTop: "2px" }} />
              </div>

              <div>
                <label style={{ fontSize: "0.7rem", fontWeight: 700, color: "#475569" }}>Teléfono</label>
                <input type="text" value={userPhone} onChange={(e) => setUserPhone(e.target.value)} style={{ width: "100%", padding: "0.5rem", borderRadius: "0.4rem", border: "1px solid #CBD5E1", fontSize: "0.75rem", marginTop: "2px" }} />
              </div>

              <div>
                <label style={{ fontSize: "0.7rem", fontWeight: 700, color: "#475569" }}>RFC</label>
                <input type="text" value={userRfc} onChange={(e) => setUserRfc(e.target.value)} style={{ width: "100%", padding: "0.5rem", borderRadius: "0.4rem", border: "1px solid #CBD5E1", fontSize: "0.75rem", marginTop: "2px" }} />
              </div>

              <div>
                <label style={{ fontSize: "0.7rem", fontWeight: 700, color: "#475569" }}>Domicilio</label>
                <input type="text" value={userAddress} onChange={(e) => setUserAddress(e.target.value)} style={{ width: "100%", padding: "0.5rem", borderRadius: "0.4rem", border: "1px solid #CBD5E1", fontSize: "0.75rem", marginTop: "2px" }} />
              </div>

              <button
                onClick={() => {
                  setShowEditProfile(false);
                  alert("Datos actualizados correctamente.");
                }}
                style={{ backgroundColor: "#1F3652", color: "#FFFFFF", padding: "0.65rem", borderRadius: "0.5rem", fontWeight: 800, border: "none", cursor: "pointer", fontSize: "0.75rem" }}
              >
                Guardar
              </button>
            </div>
          </div>
        )}

        {/* MODAL CAMBIAR CONTRASEÑA */}
        {showChangePassword && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15,23,42,0.6)", display: "flex", justifyContent: "center", alignItems: "flex-end", zIndex: 9999 }}>
            <div style={{ width: "100%", maxWidth: "460px", backgroundColor: "#FFFFFF", borderTopLeftRadius: "1.5rem", borderTopRightRadius: "1.5rem", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong style={{ fontSize: "1rem", color: "#1F3652" }}>Cambiar Contraseña</strong>
                <button onClick={() => setShowChangePassword(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={16} /></button>
              </div>

              <div>
                <label style={{ fontSize: "0.7rem", fontWeight: 700, color: "#475569" }}>Contraseña Actual</label>
                <input type="password" placeholder="••••••••" style={{ width: "100%", padding: "0.5rem", borderRadius: "0.4rem", border: "1px solid #CBD5E1", fontSize: "0.75rem", marginTop: "2px" }} />
              </div>

              <div>
                <label style={{ fontSize: "0.7rem", fontWeight: 700, color: "#475569" }}>Nueva Contraseña</label>
                <input type="password" placeholder="••••••••" style={{ width: "100%", padding: "0.5rem", borderRadius: "0.4rem", border: "1px solid #CBD5E1", fontSize: "0.75rem", marginTop: "2px" }} />
              </div>

              <button
                onClick={() => {
                  setShowChangePassword(false);
                  alert("Contraseña actualizada con éxito.");
                }}
                style={{ backgroundColor: "#1F3652", color: "#FFFFFF", padding: "0.65rem", borderRadius: "0.5rem", fontWeight: 800, border: "none", cursor: "pointer", fontSize: "0.75rem" }}
              >
                Actualizar
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

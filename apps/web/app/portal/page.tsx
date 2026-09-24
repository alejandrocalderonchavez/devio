"use client";

import React, { useState, useMemo } from "react";
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
  images: string[];
  specialtiesProgress: Array<{ id: string; name: string; percentage: number }>;
  constructionMilestones: Array<{ id: string; title: string; date: string; photo: string; description: string }>;
  documents: Array<{ id: string; title: string; category: string; fileSize: string; uploadDate: string }>;
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
  }>;
  customAttributes: Array<{ label: string; value: string }>;
}

const INITIAL_PROPERTIES: ClientProperty[] = [
  {
    id: "prop-castellana-1c",
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
      "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=800&auto=format&fit=crop&q=80",
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
        title: "Vance 1",
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
      { id: "pay-1", cuotaNumber: 1, concept: "Enganche Inicial (20%)", amount: 1200000, interestAmount: 0, scheduledDate: "Ago 17, 26", status: "PAGADO", paidDate: "17 Ago 2026", receiptNumber: "REC-2026-0817-01" },
      { id: "pay-2", cuotaNumber: 2, concept: "Mensualidad 1 de 18", amount: 250000, interestAmount: 0, scheduledDate: "Sep 17, 26", status: "ATRASADO" },
      { id: "pay-3", cuotaNumber: 3, concept: "Mensualidad 2 de 18", amount: 250000, interestAmount: 0, scheduledDate: "Oct 17, 26", status: "PENDIENTE" },
      { id: "pay-4", cuotaNumber: 4, concept: "Mensualidad 3 de 18", amount: 250000, interestAmount: 0, scheduledDate: "Nov 17, 26", status: "PENDIENTE" },
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
      { id: "ms-11", title: "Avance Acabados", date: "Sep 15, 26", photo: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800", description: "Pisos y cancelería." },
    ],
    documents: [],
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

  // State
  const [activeTab, setActiveTab] = useState<"properties" | "profile">("properties");
  const [screen, setScreen] = useState<"main" | "detail" | "construction" | "documents" | "statement">("main");
  const [selectedPropId, setSelectedPropId] = useState("prop-castellana-1c");
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
  const [userName, setUserName] = useState("Iñigo Heredia Horner");
  const [userEmail] = useState("0242573@up.edu.mx");
  const [userPhone, setUserPhone] = useState("+52 33 1892 4490");
  const [userRfc, setUserRfc] = useState("HEHI9604128N2");
  const [userAddress, setUserAddress] = useState("Av. Providencia 2340, Depto 402, Guadalajara, Jal.");

  // Notifications
  const [notifications, setNotifications] = useState([
    { id: "notif-1", title: "Aviso de Cuota Vencida", body: "Tu cuota de $250,000 en Castellana Residencial (Unidad 1C) venció el Sep 17, 26.", time: "Hace 2 horas", read: false },
    { id: "notif-2", title: "Nuevo Avance de Obra Publicado", body: "Grupo VEQ ha subido fotografías del Avance 2 (66% de obra general).", time: "Ayer a las 11:30 AM", read: false },
    { id: "notif-3", title: "Recibo de Enganche Emitido", body: "Se generó tu recibo digital oficial por $1,200,000 MXN correspondiente al enganche.", time: "17 Ago 2026", read: true },
  ]);

  const selectedProp: ClientProperty = useMemo(() => {
    return (INITIAL_PROPERTIES.find((p) => p.id === selectedPropId) || INITIAL_PROPERTIES[0]) as ClientProperty;
  }, [selectedPropId]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const formatMoney = (val: number) =>
    new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0 }).format(val || 0);

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      document.cookie = "devio_auth_token=; path=/; max-age=0;";
      localStorage.removeItem("devio_user_session");
      sessionStorage.removeItem("devio_user_session");
    }
    router.push("/login");
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0F172A", display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "0" }}>
      {/* Mobile Shell Container */}
      <div
        style={{
          width: "100%",
          maxWidth: "440px",
          minHeight: "100vh",
          backgroundColor: "#F1F5F9",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          overflow: "hidden",
        }}
      >
        {/* HEADER SUPERIOR */}
        <div
          style={{
            backgroundColor: "#1F3652",
            padding: "1.75rem 1.25rem 1.25rem 1.25rem",
            borderBottomLeftRadius: "1.75rem",
            borderBottomRightRadius: "1.75rem",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            {/* Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  backgroundColor: "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                }}
              >
                <span style={{ color: "#1F3652", fontSize: "1.4rem", fontWeight: 900, lineHeight: 1 }}>D</span>
                <div style={{ position: "absolute", right: "7px", top: "7px", bottom: "7px", width: "3px", backgroundColor: "#1F3652", borderRadius: "2px" }} />
              </div>
              <span style={{ color: "#FFFFFF", fontSize: "1.35rem", fontWeight: 800, letterSpacing: "-0.5px" }}>devio</span>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <button
                onClick={() => setShowNotifications(true)}
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "50%",
                  backgroundColor: "#F1F5F9",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  cursor: "pointer",
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
                      fontSize: "10px",
                      fontWeight: 800,
                      borderRadius: "99px",
                      minWidth: "17px",
                      height: "17px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "0 3px",
                      border: "2px solid #1F3652",
                    }}
                  >
                    {unreadCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  setActiveTab("profile");
                  setScreen("main");
                }}
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: "2px solid rgba(255,255,255,0.4)",
                  cursor: "pointer",
                  padding: 0,
                  backgroundColor: "#D97706",
                }}
              >
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80"
                  alt="Avatar"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </button>
            </div>
          </div>

          {/* Saludo si estamos en main */}
          {screen === "main" && activeTab === "properties" && (
            <div style={{ marginTop: "1.25rem" }}>
              <span style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.85rem", fontWeight: 500 }}>Hola,</span>
              <h2 style={{ color: "#FFFFFF", fontSize: "1.6rem", fontWeight: 800, margin: "0.15rem 0 0 0", letterSpacing: "-0.5px" }}>
                {userName}
              </h2>
            </div>
          )}
        </div>

        {/* CONTENIDO PRINCIPAL SEGÚN PANTALLA */}
        <div style={{ flex: 1, padding: "1.25rem", overflowY: "auto", display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* PANTALLA 1: MIS PROPIEDADES (HOME) */}
          {screen === "main" && activeTab === "properties" && (
            <>
              {/* Tarjeta Próximo Pago */}
              <div
                onClick={() => setScreen("statement")}
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "1.25rem",
                  padding: "1.25rem",
                  border: "1px solid #E2E8F0",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                  <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "#64748B", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    Tu próximo pago
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "#D97706", fontSize: "0.75rem", fontWeight: 700 }}>
                    Ver detalle <ArrowRight size={13} />
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", margin: "0.3rem 0" }}>
                  <span style={{ fontSize: "1.75rem", fontWeight: 900, color: "#1F3652", letterSpacing: "-0.5px" }}>
                    {formatMoney(selectedProp.nextPaymentAmount)}
                  </span>
                  <span style={{ fontSize: "0.8rem", color: "#64748B", fontWeight: 600 }}>{selectedProp.nextPaymentDueDate.split(",")[0]}</span>
                </div>

                <div style={{ height: "6px", backgroundColor: "#F1F5F9", borderRadius: "99px", overflow: "hidden", margin: "0.5rem 0" }}>
                  <div style={{ width: "35%", height: "100%", backgroundColor: "#C59B62", borderRadius: "99px" }} />
                </div>

                <div style={{ textAlign: "right", fontSize: "0.75rem", color: "#64748B", fontWeight: 600 }}>
                  en {selectedProp.nextPaymentDaysRemaining} días
                </div>
              </div>

              {/* Título Mis Propiedades */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", margin: "0.5rem 0 0 0" }}>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#1F3652", margin: 0 }}>Mis propiedades</h3>
                <span style={{ backgroundColor: "#E2E8F0", padding: "0.15rem 0.5rem", borderRadius: "99px", fontSize: "0.75rem", fontWeight: 800, color: "#475569" }}>
                  {INITIAL_PROPERTIES.length}
                </span>
              </div>

              {/* Lista de Propiedades */}
              {INITIAL_PROPERTIES.map((prop) => (
                <div
                  key={prop.id}
                  onClick={() => {
                    setSelectedPropId(prop.id);
                    setScreen("detail");
                  }}
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: "1.5rem",
                    overflow: "hidden",
                    border: "1px solid #E2E8F0",
                    boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
                    cursor: "pointer",
                    transition: "transform 0.15s ease",
                  }}
                >
                  <div style={{ position: "relative", height: "190px", width: "100%" }}>
                    <img src={prop.images[0]} alt={prop.projectName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <span style={{ position: "absolute", top: "12px", left: "12px", backgroundColor: "#FFFFFF", padding: "0.3rem 0.75rem", borderRadius: "99px", fontSize: "0.72rem", fontWeight: 800, color: "#1F3652", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
                      {prop.unitType}
                    </span>
                    <span style={{ position: "absolute", bottom: "12px", right: "12px", backgroundColor: "rgba(31,54,82,0.88)", color: "#FFFFFF", padding: "0.3rem 0.75rem", borderRadius: "99px", fontSize: "0.72rem", fontWeight: 800 }}>
                      Unidad {prop.unitNumber}
                    </span>
                  </div>

                  <div style={{ padding: "1.1rem" }}>
                    <h4 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#1F3652", margin: "0 0 0.25rem 0" }}>
                      {prop.projectName}
                    </h4>
                    <p style={{ fontSize: "0.75rem", color: "#64748B", margin: "0 0 0.85rem 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {prop.projectAddress}
                    </p>

                    <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.85rem" }}>
                      <div style={{ flex: 1, backgroundColor: "#F8FAFC", borderRadius: "0.6rem", padding: "0.4rem", textAlign: "center", border: "1px solid #F1F5F9" }}>
                        <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "#1F3652" }}>{prop.areaM2}</div>
                        <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "#94A3B8" }}>M²</div>
                      </div>
                      <div style={{ flex: 1, backgroundColor: "#F8FAFC", borderRadius: "0.6rem", padding: "0.4rem", textAlign: "center", border: "1px solid #F1F5F9" }}>
                        <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "#1F3652" }}>{prop.bedrooms}</div>
                        <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "#94A3B8" }}>CUARTOS</div>
                      </div>
                      <div style={{ flex: 1, backgroundColor: "#F8FAFC", borderRadius: "0.6rem", padding: "0.4rem", textAlign: "center", border: "1px solid #F1F5F9" }}>
                        <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "#1F3652" }}>{prop.bathrooms}</div>
                        <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "#94A3B8" }}>BAÑOS</div>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <div style={{ flex: 1, height: "6px", backgroundColor: "#E2E8F0", borderRadius: "99px", overflow: "hidden" }}>
                        <div style={{ width: `${prop.constructionPct}%`, height: "100%", backgroundColor: "#C59B62", borderRadius: "99px" }} />
                      </div>
                      <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#64748B" }}>
                        {prop.constructionPct}% obra
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* PANTALLA 2: DETALLE DE PROPIEDAD */}
          {screen === "detail" && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <button
                  onClick={() => setScreen("main")}
                  style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "#FFFFFF", border: "1px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                >
                  <ArrowLeft size={16} color="#1F3652" />
                </button>
                <div style={{ flex: 1, backgroundColor: "#FFFFFF", padding: "0.6rem 1rem", borderRadius: "99px", border: "1px solid #E2E8F0", textAlign: "center", fontSize: "0.95rem", fontWeight: 800, color: "#1F3652" }}>
                  {selectedProp.projectName} | {selectedProp.unitNumber}
                </div>
              </div>

              {/* Galería */}
              <div style={{ backgroundColor: "#FFFFFF", borderRadius: "1.25rem", padding: "0.6rem", border: "1px solid #E2E8F0" }}>
                <img src={selectedProp.images[selectedImageIdx]} alt="Hero" style={{ width: "100%", height: "200px", objectFit: "cover", borderRadius: "0.9rem" }} />
                <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.5rem" }}>
                  {selectedProp.images.map((img, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedImageIdx(idx)}
                      style={{
                        flex: 1,
                        height: "50px",
                        borderRadius: "0.4rem",
                        overflow: "hidden",
                        border: selectedImageIdx === idx ? "2px solid #1F3652" : "2px solid transparent",
                        cursor: "pointer",
                      }}
                    >
                      <img src={img} alt="Thumb" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Resumen Próximo Pago y Saldo Vencido */}
              <div style={{ backgroundColor: "#FFFFFF", borderRadius: "1.25rem", padding: "1.1rem", border: "1px solid #E2E8F0" }}>
                <div style={{ display: "flex", gap: "0.75rem", marginBottom: "0.85rem" }}>
                  <div style={{ flex: 1 }}>
                    <span style={{ backgroundColor: "#FEF3C7", color: "#92400E", padding: "0.2rem 0.55rem", borderRadius: "99px", fontSize: "0.65rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                      <Calendar size={10} /> Tu próximo pago
                    </span>
                    <div style={{ fontSize: "1.3rem", fontWeight: 900, color: "#1F3652", margin: "0.2rem 0" }}>
                      {formatMoney(selectedProp.nextPaymentAmount)}
                    </div>
                    <div style={{ fontSize: "0.68rem", color: "#64748B" }}>
                      Vence: <strong>{selectedProp.nextPaymentDueDate.split(",")[0]}</strong> | En {selectedProp.nextPaymentDaysRemaining} días
                    </div>
                  </div>

                  {selectedProp.overdueAmount && selectedProp.overdueAmount > 0 && (
                    <div style={{ flex: 1 }}>
                      <span style={{ backgroundColor: "#FEE2E2", color: "#991B1B", padding: "0.2rem 0.55rem", borderRadius: "99px", fontSize: "0.65rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                        <Calendar size={10} /> Saldo Vencido
                      </span>
                      <div style={{ fontSize: "1.3rem", fontWeight: 900, color: "#1F3652", margin: "0.2rem 0" }}>
                        {formatMoney(selectedProp.overdueAmount)}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setScreen("statement")}
                  style={{ width: "100%", padding: "0.75rem", borderRadius: "0.75rem", backgroundColor: "#1F3652", color: "#FFFFFF", fontWeight: 800, fontSize: "0.85rem", border: "none", cursor: "pointer" }}
                >
                  Ver saldo y pagos
                </button>
              </div>

              {/* Card Avance de Obra */}
              <div style={{ backgroundColor: "#FFFFFF", borderRadius: "1.25rem", padding: "1.1rem", border: "1px solid #E2E8F0" }}>
                <h4 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#1F3652", margin: "0 0 0.5rem 0" }}>Avance de Obra</h4>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
                  <span style={{ fontSize: "1.5rem", fontWeight: 900, color: "#1F3652" }}>{selectedProp.constructionPct}%</span>
                  <div style={{ flex: 1, height: "7px", backgroundColor: "#F1F5F9", borderRadius: "99px", overflow: "hidden" }}>
                    <div style={{ width: `${selectedProp.constructionPct}%`, height: "100%", backgroundColor: "#C59B62", borderRadius: "99px" }} />
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.7rem", color: "#64748B", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#00C48C" }} />
                    Última actualización <strong>{selectedProp.lastProgressUpdateDate}</strong>
                  </span>
                  <button
                    onClick={() => setScreen("construction")}
                    style={{ backgroundColor: "#1F3652", color: "#FFFFFF", border: "none", borderRadius: "0.5rem", padding: "0.4rem 0.75rem", fontSize: "0.72rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "0.3rem", cursor: "pointer" }}
                  >
                    Ver Avances <ArrowRight size={12} />
                  </button>
                </div>
              </div>

              {/* Resumen Financiero: 3 Cards */}
              <div>
                <h4 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#1F3652", margin: "0 0 0.5rem 0" }}>Resumen Financiero</h4>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <div style={{ flex: 1, backgroundColor: "#FFFFFF", padding: "0.85rem 0.5rem", borderRadius: "0.9rem", textAlign: "center", border: "1px solid #E2E8F0" }}>
                    <div style={{ fontSize: "1rem", fontWeight: 900, color: "#1F3652" }}>${(selectedProp.totalPrice / 1000000).toFixed(2)}M</div>
                    <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "#64748B", marginTop: "2px" }}>Precio Venta</div>
                  </div>
                  <div style={{ flex: 1, backgroundColor: "#FFFFFF", padding: "0.85rem 0.5rem", borderRadius: "0.9rem", textAlign: "center", border: "1px solid #E2E8F0" }}>
                    <div style={{ fontSize: "1rem", fontWeight: 900, color: "#00C48C" }}>${(selectedProp.paidAmount / 1000000).toFixed(2)}M</div>
                    <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "#64748B", marginTop: "2px" }}>Total Pagado</div>
                  </div>
                  <div style={{ flex: 1, backgroundColor: "#FFFFFF", padding: "0.85rem 0.5rem", borderRadius: "0.9rem", textAlign: "center", border: "1px solid #E2E8F0" }}>
                    <div style={{ fontSize: "1rem", fontWeight: 900, color: "#1F3652" }}>${(selectedProp.pendingAmount / 1000000).toFixed(2)}M</div>
                    <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "#64748B", marginTop: "2px" }}>Saldo Pendiente</div>
                  </div>
                </div>
              </div>

              {/* Acciones Rápidas */}
              <div>
                <h4 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#1F3652", margin: "0 0 0.5rem 0" }}>Acciones Rápidas</h4>
                <div style={{ display: "flex", gap: "0.6rem" }}>
                  <button
                    onClick={() => setScreen("documents")}
                    style={{ flex: 1, backgroundColor: "#FFFFFF", borderRadius: "1rem", padding: "1rem 0.5rem", border: "1px solid #E2E8F0", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4rem", cursor: "pointer" }}
                  >
                    <div style={{ width: "36px", height: "36px", borderRadius: "8px", backgroundColor: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <FileText size={18} color="#1F3652" />
                    </div>
                    <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#1F3652" }}>Documentos</span>
                  </button>

                  <button
                    onClick={() => setScreen("statement")}
                    style={{ flex: 1, backgroundColor: "#FFFFFF", borderRadius: "1rem", padding: "1rem 0.5rem", border: "1px solid #E2E8F0", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4rem", cursor: "pointer" }}
                  >
                    <div style={{ width: "36px", height: "36px", borderRadius: "8px", backgroundColor: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <CreditCard size={18} color="#1F3652" />
                    </div>
                    <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#1F3652" }}>Estado Cuenta</span>
                  </button>

                  <button
                    onClick={() => alert("Marketplace Devio: Cotiza acabados, domótica y mobiliario para tu unidad.")}
                    style={{ flex: 1, backgroundColor: "#FFFFFF", borderRadius: "1rem", padding: "1rem 0.5rem", border: "1px solid #E2E8F0", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4rem", cursor: "pointer" }}
                  >
                    <div style={{ width: "36px", height: "36px", borderRadius: "8px", backgroundColor: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <ShoppingBag size={18} color="#1F3652" />
                    </div>
                    <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#1F3652" }}>Marketplace</span>
                  </button>
                </div>
              </div>

              {/* Información de la Unidad Colapsable */}
              <div style={{ backgroundColor: "#FFFFFF", borderRadius: "1.25rem", padding: "1.1rem", border: "1px solid #E2E8F0" }}>
                <div onClick={() => setUnitInfoExpanded(!unitInfoExpanded)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
                  <h4 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#1F3652", margin: 0 }}>Información de la Unidad</h4>
                  <div style={{ width: "24px", height: "24px", borderRadius: "50%", backgroundColor: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {unitInfoExpanded ? <ChevronUp size={14} color="#1F3652" /> : <ChevronDown size={14} color="#1F3652" />}
                  </div>
                </div>

                {unitInfoExpanded && (
                  <div style={{ marginTop: "0.85rem", display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <div style={{ flex: 1, backgroundColor: "#F8FAFC", padding: "0.6rem", borderRadius: "0.6rem", textAlign: "center" }}>
                        <div style={{ fontSize: "0.65rem", color: "#94A3B8", fontWeight: 700 }}>Superficie</div>
                        <div style={{ fontSize: "0.9rem", fontWeight: 900, color: "#1F3652" }}>{selectedProp.areaM2} m²</div>
                      </div>
                      <div style={{ flex: 1, backgroundColor: "#F8FAFC", padding: "0.6rem", borderRadius: "0.6rem", textAlign: "center" }}>
                        <div style={{ fontSize: "0.65rem", color: "#94A3B8", fontWeight: 700 }}>Cuartos</div>
                        <div style={{ fontSize: "0.9rem", fontWeight: 900, color: "#1F3652" }}>{selectedProp.bedrooms}</div>
                      </div>
                      <div style={{ flex: 1, backgroundColor: "#F8FAFC", padding: "0.6rem", borderRadius: "0.6rem", textAlign: "center" }}>
                        <div style={{ fontSize: "0.65rem", color: "#94A3B8", fontWeight: 700 }}>Baños</div>
                        <div style={{ fontSize: "0.9rem", fontWeight: 900, color: "#1F3652" }}>{selectedProp.bathrooms}</div>
                      </div>
                    </div>

                    <div style={{ backgroundColor: "#F8FAFC", borderRadius: "0.75rem", padding: "0.75rem", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                      {selectedProp.customAttributes.map((attr, idx) => (
                        <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", paddingBottom: "0.25rem", borderBottom: "1px solid #F1F5F9" }}>
                          <span style={{ color: "#64748B" }}>{attr.label}</span>
                          <strong style={{ color: "#1F3652" }}>{attr.value}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* PANTALLA 3: AVANCE DE OBRA */}
          {screen === "construction" && (
            <>
              <div>
                <h2 style={{ fontSize: "1.5rem", fontWeight: 900, color: "#1F3652", margin: "0 0 0.4rem 0" }}>{selectedProp.projectName}</h2>
                <span style={{ border: "1px solid #C59B62", color: "#C59B62", padding: "0.25rem 0.75rem", borderRadius: "99px", fontSize: "0.75rem", fontWeight: 800 }}>
                  Unidad {selectedProp.unitNumber}
                </span>
              </div>

              {/* Resumen Top */}
              <div style={{ backgroundColor: "#FFFFFF", borderRadius: "1.25rem", padding: "1.25rem", border: "1px solid #E2E8F0", display: "flex", alignItems: "center" }}>
                <div style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ width: "70%", height: "5px", backgroundColor: "#F1F5F9", borderRadius: "99px", margin: "0 auto 0.4rem auto", overflow: "hidden" }}>
                    <div style={{ width: `${selectedProp.constructionPct}%`, height: "100%", backgroundColor: "#C59B62" }} />
                  </div>
                  <div style={{ fontSize: "1.35rem", fontWeight: 900, color: "#1F3652" }}>{selectedProp.constructionPct}%</div>
                  <div style={{ fontSize: "0.72rem", color: "#64748B", fontWeight: 700 }}>Avance General</div>
                </div>

                <div style={{ width: "1px", height: "50px", backgroundColor: "#E2E8F0" }} />

                <div style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "8px", backgroundColor: "#FEF3C7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 0.3rem auto" }}>
                    <Calendar size={18} color="#C59B62" />
                  </div>
                  <div style={{ fontSize: "0.68rem", color: "#64748B" }}>Entrega estimada</div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 900, color: "#1F3652" }}>{selectedProp.estimatedDeliveryDate}</div>
                </div>
              </div>

              {/* Avance por Especialidad */}
              <div style={{ backgroundColor: "#FFFFFF", borderRadius: "1.25rem", padding: "1.25rem", border: "1px solid #E2E8F0" }}>
                <h4 style={{ fontSize: "1rem", fontWeight: 900, color: "#1F3652", margin: "0 0 0.25rem 0" }}>Avance por Especialidad</h4>
                <div style={{ fontSize: "0.72rem", color: "#64748B", display: "flex", alignItems: "center", gap: "0.3rem", marginBottom: "1rem" }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#00C48C" }} />
                  Última actualización <strong>{selectedProp.lastProgressUpdateDate}</strong>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                  {selectedProp.specialtiesProgress.map((esp) => (
                    <div key={esp.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "#FDF4E7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Wrench size={16} color="#C59B62" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "0.8rem", fontWeight: 800, color: "#1F3652", marginBottom: "0.3rem" }}>{esp.name}</div>
                        <div style={{ height: "6px", backgroundColor: "#F1F5F9", borderRadius: "99px", overflow: "hidden" }}>
                          <div style={{ width: `${esp.percentage}%`, height: "100%", backgroundColor: "#C59B62" }} />
                        </div>
                      </div>
                      <span style={{ fontSize: "0.85rem", fontWeight: 900, color: "#1F3652", minWidth: "35px", textAlign: "right" }}>{esp.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Histórico Avances */}
              <div style={{ backgroundColor: "#FFFFFF", borderRadius: "1.25rem", padding: "1.25rem", border: "1px solid #E2E8F0" }}>
                <h4 style={{ fontSize: "1rem", fontWeight: 900, color: "#1F3652", margin: "0 0 0.85rem 0" }}>Histórico Avances de Obra</h4>
                <div style={{ display: "flex", gap: "0.75rem" }}>
                  {selectedProp.constructionMilestones.map((ms) => (
                    <div key={ms.id} style={{ flex: 1, borderRadius: "0.9rem", overflow: "hidden", border: "1px solid #E2E8F0" }}>
                      <img src={ms.photo} alt={ms.title} style={{ width: "100%", height: "90px", objectFit: "cover" }} />
                      <div style={{ padding: "0.6rem" }}>
                        <div style={{ fontSize: "0.8rem", fontWeight: 800, color: "#1F3652" }}>{ms.title}</div>
                        <div style={{ fontSize: "0.68rem", color: "#64748B", display: "flex", alignItems: "center", gap: "0.25rem", marginTop: "2px" }}>
                          <Calendar size={10} /> {ms.date}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setScreen("detail")}
                style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.6rem 1.25rem", borderRadius: "99px", backgroundColor: "#FFFFFF", border: "1px solid #E2E8F0", color: "#1F3652", fontWeight: 800, fontSize: "0.85rem", cursor: "pointer" }}
              >
                <ArrowLeft size={16} /> Volver
              </button>
            </>
          )}

          {/* PANTALLA 4: DOCUMENTOS */}
          {screen === "documents" && (
            <>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 900, color: "#1F3652", margin: 0 }}>Documentos</h2>

              {/* Buscador */}
              <div style={{ display: "flex", alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: "1rem", padding: "0.75rem 1rem", gap: "0.5rem", border: "1px solid #E2E8F0" }}>
                <Search size={16} color="#94A3B8" />
                <input
                  type="text"
                  placeholder="Buscar Documentos"
                  value={docSearch}
                  onChange={(e) => setDocSearch(e.target.value)}
                  style={{ border: "none", outline: "none", width: "100%", fontSize: "0.85rem", color: "#1F3652" }}
                />
              </div>

              {/* Lista */}
              {selectedProp.documents.length === 0 ? (
                <div style={{ backgroundColor: "#FFFFFF", borderRadius: "1.25rem", padding: "3rem 1.5rem", textAlign: "center", border: "1px solid #E2E8F0" }}>
                  <div style={{ width: "60px", height: "60px", borderRadius: "50%", backgroundColor: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem auto" }}>
                    <FileText size={32} color="#1F3652" />
                  </div>
                  <h4 style={{ fontSize: "1rem", fontWeight: 800, color: "#1F3652", margin: "0 0 0.35rem 0" }}>Aún no tienes ningún documento.</h4>
                  <p style={{ fontSize: "0.75rem", color: "#64748B", margin: 0 }}>Los contratos y planos aparecerán aquí.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  {selectedProp.documents
                    .filter((d) => d.title.toLowerCase().includes(docSearch.toLowerCase()))
                    .map((doc) => (
                      <div
                        key={doc.id}
                        style={{
                          backgroundColor: "#FFFFFF",
                          borderRadius: "1rem",
                          padding: "0.85rem 1rem",
                          border: "1px solid #E2E8F0",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.75rem",
                        }}
                      >
                        <div style={{ width: "36px", height: "36px", borderRadius: "8px", backgroundColor: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <FileText size={18} color="#1F3652" />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "#1F3652", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{doc.title}</div>
                          <div style={{ fontSize: "0.68rem", color: "#64748B" }}>{doc.fileSize} · {doc.uploadDate}</div>
                        </div>
                        <button
                          onClick={() => alert(`Descargando documento: ${doc.title}`)}
                          style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: "rgba(0,196,140,0.1)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                        >
                          <Download size={15} color="#00C48C" />
                        </button>
                      </div>
                    ))}
                </div>
              )}

              <button
                onClick={() => setScreen("detail")}
                style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.6rem 1.25rem", borderRadius: "99px", backgroundColor: "#FFFFFF", border: "1px solid #E2E8F0", color: "#1F3652", fontWeight: 800, fontSize: "0.85rem", cursor: "pointer" }}
              >
                <ArrowLeft size={16} /> Volver
              </button>
            </>
          )}

          {/* PANTALLA 5: ESTADO DE CUENTA & PAGOS */}
          {screen === "statement" && (
            <>
              {/* Resumen Financiero Top 2x2 */}
              <div style={{ backgroundColor: "#FFFFFF", borderRadius: "1.25rem", padding: "1.25rem", border: "1px solid #E2E8F0" }}>
                <h4 style={{ fontSize: "1rem", fontWeight: 900, color: "#1F3652", margin: "0 0 0.75rem 0" }}>Resumen Financiero</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "1rem" }}>
                  <div style={{ backgroundColor: "#FFFFFF", padding: "0.75rem", borderRadius: "0.75rem", border: "1px solid #E2E8F0", textAlign: "center" }}>
                    <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "#00C48C" }}>{formatMoney(selectedProp.paidAmount)}</div>
                    <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "#64748B" }}>Total Pagado</div>
                  </div>
                  <div style={{ backgroundColor: "#FFFFFF", padding: "0.75rem", borderRadius: "0.75rem", border: "1px solid #E2E8F0", textAlign: "center" }}>
                    <div style={{ fontSize: "1.1rem", fontWeight: 900, color: (selectedProp.overdueAmount || 0) > 0 ? "#EF4444" : "#1F3652" }}>{formatMoney(selectedProp.overdueAmount || 0)}</div>
                    <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "#64748B" }}>Saldo Vencido</div>
                  </div>
                  <div style={{ backgroundColor: "#FFFFFF", padding: "0.75rem", borderRadius: "0.75rem", border: "1px solid #E2E8F0", textAlign: "center" }}>
                    <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "#1F3652" }}>{formatMoney(selectedProp.pendingAmount)}</div>
                    <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "#64748B" }}>Saldo Pendiente</div>
                  </div>
                  <div style={{ backgroundColor: "#FFFFFF", padding: "0.75rem", borderRadius: "0.75rem", border: "1px solid #E2E8F0", textAlign: "center" }}>
                    <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "#1F3652" }}>
                      {Math.round((selectedProp.paidAmount / selectedProp.totalPrice) * 100)}%
                    </div>
                    <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "#64748B" }}>% Pagado</div>
                  </div>
                </div>

                <button
                  onClick={() => alert(`Descargando Estado de Cuenta en PDF para ${selectedProp.projectName} (${selectedProp.unitNumber})...`)}
                  style={{ width: "100%", padding: "0.75rem", borderRadius: "0.75rem", backgroundColor: "#1F3652", color: "#FFFFFF", fontWeight: 800, fontSize: "0.85rem", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}
                >
                  <Download size={15} /> Descargar Estado de Cuenta
                </button>
              </div>

              {/* Subtabs Selector */}
              <div style={{ display: "flex", backgroundColor: "#E2E8F0", padding: "3px", borderRadius: "0.75rem", gap: "3px" }}>
                <button
                  onClick={() => setStatementSubTab("statement")}
                  style={{ flex: 1, padding: "0.55rem", borderRadius: "0.6rem", border: "none", backgroundColor: statementSubTab === "statement" ? "#1F3652" : "transparent", color: statementSubTab === "statement" ? "#FFFFFF" : "#64748B", fontWeight: 800, fontSize: "0.8rem", cursor: "pointer" }}
                >
                  Estado de Cuenta
                </button>
                <button
                  onClick={() => setStatementSubTab("payments")}
                  style={{ flex: 1, padding: "0.55rem", borderRadius: "0.6rem", border: "none", backgroundColor: statementSubTab === "payments" ? "#1F3652" : "transparent", color: statementSubTab === "payments" ? "#FFFFFF" : "#64748B", fontWeight: 800, fontSize: "0.8rem", cursor: "pointer" }}
                >
                  Pagos
                </button>
              </div>

              {/* Encabezado Tabla */}
              <div style={{ display: "flex", padding: "0 0.85rem", fontSize: "0.72rem", fontWeight: 700, color: "#64748B" }}>
                <span style={{ flex: 0.8 }}>Unidad</span>
                <span style={{ flex: 1.4 }}>Cantidad</span>
                <span style={{ flex: 0.8 }}>Intereses</span>
                <span style={{ flex: 1.2, textAlign: "right" }}>Estatus</span>
              </div>

              {/* Filas */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {selectedProp.payments.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      if (p.status === "PAGADO") {
                        setShowReceiptPayment(p);
                      } else if (p.status === "ATRASADO") {
                        alert(`Cuota Vencida por ${formatMoney(p.amount)}. Comunícate con la desarrolladora para liquidar tu pago.`);
                      }
                    }}
                    style={{
                      backgroundColor: "#FFFFFF",
                      borderRadius: "1rem",
                      padding: "0.85rem 1rem",
                      border: "1px solid #E2E8F0",
                      display: "flex",
                      alignItems: "center",
                      cursor: p.status === "PAGADO" ? "pointer" : "default",
                    }}
                  >
                    <span style={{ flex: 0.8, fontSize: "0.95rem", fontWeight: 900, color: "#1F3652" }}>{selectedProp.unitNumber}</span>
                    <span style={{ flex: 1.4, fontSize: "0.85rem", fontWeight: 800, color: "#1F3652" }}>{formatMoney(p.amount)}</span>
                    <span style={{ flex: 0.8, fontSize: "0.8rem", color: "#64748B" }}>$0</span>
                    <div style={{ flex: 1.2, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px" }}>
                      <span
                        style={{
                          backgroundColor: p.status === "PAGADO" ? "#00C48C" : p.status === "ATRASADO" ? "#EF4444" : "#1F3652",
                          color: "#FFFFFF",
                          padding: "0.2rem 0.6rem",
                          borderRadius: "99px",
                          fontSize: "0.65rem",
                          fontWeight: 800,
                        }}
                      >
                        {p.status === "PAGADO" ? "Pagado" : p.status === "ATRASADO" ? "Atrasado" : "Pendiente"}
                      </span>
                      <span style={{ fontSize: "0.65rem", color: "#94A3B8" }}>{p.paidDate || p.scheduledDate}</span>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setScreen("detail")}
                style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.6rem 1.25rem", borderRadius: "99px", backgroundColor: "#FFFFFF", border: "1px solid #E2E8F0", color: "#1F3652", fontWeight: 800, fontSize: "0.85rem", cursor: "pointer" }}
              >
                <ArrowLeft size={16} /> Volver
              </button>
            </>
          )}

          {/* PANTALLA 6: PERFIL Y AJUSTES */}
          {screen === "main" && activeTab === "profile" && (
            <>
              {/* Tarjeta Perfil */}
              <div style={{ backgroundColor: "#FFFFFF", borderRadius: "1.5rem", padding: "1.5rem", textAlign: "center", border: "1px solid #E2E8F0" }}>
                <div style={{ width: "80px", height: "80px", borderRadius: "50%", overflow: "hidden", margin: "0 auto 0.75rem auto", border: "3px solid #F1F5F9" }}>
                  <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80" alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#1F3652", margin: "0 0 0.2rem 0" }}>{userName}</h3>
                <span style={{ fontSize: "0.8rem", color: "#64748B" }}>{userEmail}</span>
              </div>

              <h4 style={{ fontSize: "1.1rem", fontWeight: 900, color: "#1F3652", margin: "0.5rem 0 0 0" }}>Ajustes</h4>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                <button
                  onClick={() => setShowEditProfile(true)}
                  style={{ backgroundColor: "#FFFFFF", borderRadius: "1rem", padding: "1rem", border: "1px solid #E2E8F0", display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer" }}
                >
                  <div style={{ width: "34px", height: "34px", borderRadius: "50%", backgroundColor: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <User size={18} color="#2563EB" />
                  </div>
                  <span style={{ flex: 1, textAlign: "left", fontSize: "0.9rem", fontWeight: 700, color: "#1F3652" }}>Información personal</span>
                  <ArrowRight size={16} color="#94A3B8" />
                </button>

                <button
                  onClick={() => setShowChangePassword(true)}
                  style={{ backgroundColor: "#FFFFFF", borderRadius: "1rem", padding: "1rem", border: "1px solid #E2E8F0", display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer" }}
                >
                  <div style={{ width: "34px", height: "34px", borderRadius: "50%", backgroundColor: "#ECFDF5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Lock size={18} color="#00C48C" />
                  </div>
                  <span style={{ flex: 1, textAlign: "left", fontSize: "0.9rem", fontWeight: 700, color: "#1F3652" }}>Cambiar contraseña</span>
                  <ArrowRight size={16} color="#94A3B8" />
                </button>

                <button
                  onClick={() => alert("Aviso Legal: Datos protegidos con encriptación Devio Cloud.")}
                  style={{ backgroundColor: "#FFFFFF", borderRadius: "1rem", padding: "1rem", border: "1px solid #E2E8F0", display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer" }}
                >
                  <div style={{ width: "34px", height: "34px", borderRadius: "50%", backgroundColor: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <FileCheck size={18} color="#2563EB" />
                  </div>
                  <span style={{ flex: 1, textAlign: "left", fontSize: "0.9rem", fontWeight: 700, color: "#1F3652" }}>Legal</span>
                  <ArrowRight size={16} color="#94A3B8" />
                </button>

                <button
                  onClick={() => alert("Soporte Devio: WhatsApp oficial +52 (33) 2256 7499")}
                  style={{ backgroundColor: "#FFFFFF", borderRadius: "1rem", padding: "1rem", border: "1px solid #E2E8F0", display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer" }}
                >
                  <div style={{ width: "34px", height: "34px", borderRadius: "50%", backgroundColor: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <HelpCircle size={18} color="#2563EB" />
                  </div>
                  <span style={{ flex: 1, textAlign: "left", fontSize: "0.9rem", fontWeight: 700, color: "#1F3652" }}>Soporte y Ayuda</span>
                  <ArrowRight size={16} color="#94A3B8" />
                </button>

                <button
                  onClick={handleLogout}
                  style={{ backgroundColor: "#FFFFFF", borderRadius: "1rem", padding: "1rem", border: "1px solid #FEE2E2", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", cursor: "pointer", color: "#EF4444", fontWeight: 800, fontSize: "0.85rem" }}
                >
                  <LogOut size={16} /> Cerrar sesión
                </button>
              </div>
            </>
          )}
        </div>

        {/* BOTTOM TABS */}
        {screen === "main" && (
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderTop: "1px solid #F1F5F9",
              padding: "0.6rem 1rem 1.5rem 1rem",
              display: "flex",
              justifyContent: "space-around",
              boxShadow: "0 -2px 8px rgba(0,0,0,0.04)",
            }}
          >
            <button
              onClick={() => setActiveTab("properties")}
              style={{ flex: 1, background: "none", border: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: "3px", cursor: "pointer" }}
            >
              <div style={{ padding: "4px 16px", borderRadius: "99px", backgroundColor: activeTab === "properties" ? "#1F3652" : "transparent" }}>
                <Home size={20} color={activeTab === "properties" ? "#FFFFFF" : "#94A3B8"} />
              </div>
              <span style={{ fontSize: "11px", fontWeight: activeTab === "properties" ? 800 : 600, color: activeTab === "properties" ? "#1F3652" : "#94A3B8" }}>
                Propiedades
              </span>
            </button>

            <button
              onClick={() => setActiveTab("profile")}
              style={{ flex: 1, background: "none", border: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: "3px", cursor: "pointer" }}
            >
              <div style={{ padding: "4px 16px", borderRadius: "99px", backgroundColor: activeTab === "profile" ? "#1F3652" : "transparent" }}>
                <User size={20} color={activeTab === "profile" ? "#FFFFFF" : "#94A3B8"} />
              </div>
              <span style={{ fontSize: "11px", fontWeight: activeTab === "profile" ? 800 : 600, color: activeTab === "profile" ? "#1F3652" : "#94A3B8" }}>
                Perfil
              </span>
            </button>
          </div>
        )}

        {/* MODAL NOTIFICACIONES */}
        {showNotifications && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15,23,42,0.6)", display: "flex", justifyContent: "center", alignItems: "flex-end", zIndex: 9999 }}>
            <div style={{ width: "100%", maxWidth: "440px", backgroundColor: "#F8FAFC", borderTopLeftRadius: "1.5rem", borderTopRightRadius: "1.5rem", maxHeight: "80vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#FFFFFF" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 800, color: "#1F3652" }}>
                  <Bell size={18} /> Notificaciones Push
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  {notifications.length > 0 && (
                    <button onClick={() => setNotifications([])} style={{ background: "none", border: "none", color: "#EF4444", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}>
                      Borrar todas
                    </button>
                  )}
                  <button onClick={() => setShowNotifications(false)} style={{ width: "28px", height: "28px", borderRadius: "50%", backgroundColor: "#F1F5F9", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div style={{ padding: "1rem", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {notifications.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "2.5rem 1rem", color: "#64748B" }}>
                    <CheckCircle2 size={36} color="#00C48C" style={{ margin: "0 auto 0.5rem auto" }} />
                    <div style={{ fontWeight: 800, color: "#1F3652" }}>¡Todo al día!</div>
                    <div style={{ fontSize: "0.75rem" }}>No tienes notificaciones pendientes.</div>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} style={{ backgroundColor: "#FFFFFF", borderRadius: "1rem", padding: "0.85rem", border: "1px solid #E2E8F0" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.3rem" }}>
                        <strong style={{ fontSize: "0.85rem", color: "#1F3652" }}>{n.title}</strong>
                        <button onClick={() => setNotifications(notifications.filter((x) => x.id !== n.id))} style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer" }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <p style={{ fontSize: "0.75rem", color: "#475569", margin: "0 0 0.3rem 0" }}>{n.body}</p>
                      <span style={{ fontSize: "0.65rem", color: "#94A3B8" }}>{n.time}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* MODAL RECIBO DE PAGO PDF */}
        {showReceiptPayment && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15,23,42,0.7)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999, padding: "1rem" }}>
            <div style={{ width: "100%", maxWidth: "420px", backgroundColor: "#FFFFFF", borderRadius: "1.5rem", overflow: "hidden", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}>
              <div style={{ padding: "0.85rem 1.25rem", backgroundColor: "#F8FAFC", borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#1F3652" }}>Recibo de Pago Oficial</span>
                <button onClick={() => setShowReceiptPayment(null)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                  <X size={16} />
                </button>
              </div>

              <div style={{ padding: "1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.85rem" }}>
                  <div>
                    <h3 style={{ fontSize: "1.2rem", fontWeight: 900, color: "#1F3652", margin: 0 }}>DEVIO</h3>
                    <span style={{ fontSize: "0.65rem", color: "#64748B" }}>Plataforma Inmobiliaria</span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <strong style={{ fontSize: "0.85rem", color: "#1F3652" }}>{selectedProp.developerName}</strong>
                    <div style={{ fontSize: "0.7rem", color: "#00C48C", fontWeight: 700 }}>{selectedProp.projectName}</div>
                  </div>
                </div>

                <div style={{ height: "1px", backgroundColor: "#E2E8F0", margin: "0.5rem 0 0.85rem 0" }} />

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem" }}>
                  <div>
                    <div style={{ fontSize: "0.95rem", fontWeight: 900, color: "#1F3652" }}>RECIBO DE PAGO</div>
                    <div style={{ fontSize: "0.72rem", color: "#64748B" }}>Folio: {showReceiptPayment.receiptNumber || "REC-2026-0817-01"}</div>
                  </div>
                  <span style={{ backgroundColor: "#DCFCE7", color: "#166534", padding: "0.2rem 0.6rem", borderRadius: "99px", fontSize: "0.7rem", fontWeight: 800 }}>
                    PAGADO
                  </span>
                </div>

                <div style={{ backgroundColor: "rgba(0,196,140,0.08)", border: "1px solid rgba(0,196,140,0.25)", borderRadius: "0.75rem", padding: "1rem", textAlign: "center", margin: "0.85rem 0" }}>
                  <div style={{ fontSize: "0.65rem", fontWeight: 800, color: "#00875A" }}>MONTO RECIBIDO</div>
                  <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "#1F3652", margin: "0.2rem 0" }}>
                    {formatMoney(showReceiptPayment.amount)} MXN
                  </div>
                  <div style={{ fontSize: "0.65rem", color: "#475569" }}>(UN MILLÓN DOSCIENTOS MIL PESOS 00/100 M.N.)</div>
                </div>

                <div style={{ fontSize: "0.75rem", display: "flex", flexDirection: "column", gap: "0.35rem", marginBottom: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#64748B" }}>Titular:</span>
                    <strong>{userName}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#64748B" }}>Unidad:</span>
                    <strong>Unidad {selectedProp.unitNumber} ({selectedProp.unitType})</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#64748B" }}>Concepto:</span>
                    <strong>{showReceiptPayment.concept}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#64748B" }}>Fecha de Pago:</span>
                    <strong>{showReceiptPayment.paidDate || showReceiptPayment.scheduledDate}</strong>
                  </div>
                </div>

                <button
                  onClick={() => {
                    alert(`Comprobante Oficial ${showReceiptPayment.receiptNumber} descargado con éxito.`);
                    setShowReceiptPayment(null);
                  }}
                  style={{ width: "100%", padding: "0.75rem", borderRadius: "99px", backgroundColor: "#1F3652", color: "#FFFFFF", fontWeight: 800, fontSize: "0.85rem", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}
                >
                  <Download size={15} /> Descargar Comprobante PDF
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL EDITAR PERFIL */}
        {showEditProfile && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15,23,42,0.6)", display: "flex", justifyContent: "center", alignItems: "flex-end", zIndex: 9999 }}>
            <div style={{ width: "100%", maxWidth: "440px", backgroundColor: "#FFFFFF", borderTopLeftRadius: "1.5rem", borderTopRightRadius: "1.5rem", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong style={{ fontSize: "1.1rem", color: "#1F3652" }}>Información Personal</strong>
                <button onClick={() => setShowEditProfile(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={16} /></button>
              </div>

              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569" }}>Nombre Completo</label>
                <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} style={{ width: "100%", padding: "0.6rem", borderRadius: "0.5rem", border: "1px solid #CBD5E1", fontSize: "0.85rem", marginTop: "4px" }} />
              </div>

              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569" }}>Teléfono</label>
                <input type="text" value={userPhone} onChange={(e) => setUserPhone(e.target.value)} style={{ width: "100%", padding: "0.6rem", borderRadius: "0.5rem", border: "1px solid #CBD5E1", fontSize: "0.85rem", marginTop: "4px" }} />
              </div>

              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569" }}>RFC</label>
                <input type="text" value={userRfc} onChange={(e) => setUserRfc(e.target.value)} style={{ width: "100%", padding: "0.6rem", borderRadius: "0.5rem", border: "1px solid #CBD5E1", fontSize: "0.85rem", marginTop: "4px" }} />
              </div>

              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569" }}>Domicilio</label>
                <input type="text" value={userAddress} onChange={(e) => setUserAddress(e.target.value)} style={{ width: "100%", padding: "0.6rem", borderRadius: "0.5rem", border: "1px solid #CBD5E1", fontSize: "0.85rem", marginTop: "4px" }} />
              </div>

              <button
                onClick={() => {
                  setShowEditProfile(false);
                  alert("Tus datos personales se han actualizado correctamente.");
                }}
                style={{ backgroundColor: "#1F3652", color: "#FFFFFF", padding: "0.75rem", borderRadius: "99px", fontWeight: 800, border: "none", cursor: "pointer" }}
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        )}

        {/* MODAL CAMBIAR CONTRASEÑA */}
        {showChangePassword && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15,23,42,0.6)", display: "flex", justifyContent: "center", alignItems: "flex-end", zIndex: 9999 }}>
            <div style={{ width: "100%", maxWidth: "440px", backgroundColor: "#FFFFFF", borderTopLeftRadius: "1.5rem", borderTopRightRadius: "1.5rem", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong style={{ fontSize: "1.1rem", color: "#1F3652" }}>Cambiar Contraseña</strong>
                <button onClick={() => setShowChangePassword(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={16} /></button>
              </div>

              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569" }}>Contraseña Actual</label>
                <input type="password" placeholder="••••••••" style={{ width: "100%", padding: "0.6rem", borderRadius: "0.5rem", border: "1px solid #CBD5E1", fontSize: "0.85rem", marginTop: "4px" }} />
              </div>

              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569" }}>Nueva Contraseña</label>
                <input type="password" placeholder="Mínimo 6 caracteres" style={{ width: "100%", padding: "0.6rem", borderRadius: "0.5rem", border: "1px solid #CBD5E1", fontSize: "0.85rem", marginTop: "4px" }} />
              </div>

              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569" }}>Confirmar Nueva Contraseña</label>
                <input type="password" placeholder="Repite la contraseña" style={{ width: "100%", padding: "0.6rem", borderRadius: "0.5rem", border: "1px solid #CBD5E1", fontSize: "0.85rem", marginTop: "4px" }} />
              </div>

              <button
                onClick={() => {
                  setShowChangePassword(false);
                  alert("Tu contraseña ha sido actualizada con éxito.");
                }}
                style={{ backgroundColor: "#1F3652", color: "#FFFFFF", padding: "0.75rem", borderRadius: "99px", fontWeight: 800, border: "none", cursor: "pointer" }}
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

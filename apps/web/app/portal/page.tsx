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
  ChevronRight,
  Share2,
  Maximize2,
  Building,
} from "lucide-react";

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

const CLIENT_ACCOUNTS = [
  {
    id: "jaime",
    name: "Jaime Pozos Pizano",
    email: "jaimepozospizano@gmail.com",
    phone: "+52 33 3858 9824",
    rfc: "POPJ991118QC8",
    address: "Av. del Servidor Público 1425, Depto 5.1, Zapopan, Jal.",
    primaryDeveloper: "Desarrollos Campero",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "inigo",
    name: "Iñigo Heredia Horner",
    email: "0242573@up.edu.mx",
    phone: "+52 33 1892 4490",
    rfc: "HEHI9604128N2",
    address: "Av. Providencia 2340, Depto 402, Guadalajara, Jal.",
    primaryDeveloper: "Grupo VEQ",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "brandon",
    name: "Brandon Gonzalez Villagomez",
    email: "bgv2021@gmail.com",
    phone: "+52 33 2635 0316",
    rfc: "GOVB950820X71",
    address: "Av. del Servidor Público 1425, Depto 5.3, Zapopan, Jal.",
    primaryDeveloper: "Desarrollos Campero",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80",
  },
];

const ALL_PROPERTIES: ClientProperty[] = [
  {
    id: "prop-campero-mainstreet-51",
    developerName: "Desarrollos Campero",
    developerLogo: "https://6d94a8ea50a1bc576a3e8162c197d74f.cdn.bubble.io/f1786129320528x689494565312590000/WhatsApp%20Image%202026-08-07%20at%201.01.25%20p.%C2%A0m..jpeg",
    projectName: "Mainstreet Valle Real",
    projectLogo: "https://6d94a8ea50a1bc576a3e8162c197d74f.cdn.bubble.io/f1786128334428x994079386517365000/Dise%C3%B1o%20sin%20t%C3%ADtulo%20%281%29.png",
    projectAddress: "Av. del Servidor Público 1425, Residencial Poniente, 45136 Zapopan, Jal.",
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
    storageUnits: 0,
    floorLevel: 5,
    maintenanceFeeMonthly: 2200,
    images: [
      "https://6d94a8ea50a1bc576a3e8162c197d74f.cdn.bubble.io/f1786128446577x181472833978802980/ChatGPT%20Image%2019%20mar%202026%2C%2011_35_22.png",
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1000&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1000&auto=format&fit=crop&q=80",
    ],
    specialtiesProgress: [
      { id: "esp-c1", name: "1. Cimentación y Muros Milán", percentage: 100 },
      { id: "esp-c2", name: "2. Estructura y Losas", percentage: 65 },
      { id: "esp-c3", name: "3. Instalaciones Especiales", percentage: 40 },
      { id: "esp-c4", name: "4. Fachada y Cancelería", percentage: 25 },
    ],
    constructionMilestones: [
      {
        id: "ms-c1",
        title: "Avance Cimentación Concluida",
        date: "Mar 19, 26",
        photo: "https://6d94a8ea50a1bc576a3e8162c197d74f.cdn.bubble.io/f1786128446577x181472833978802980/ChatGPT%20Image%2019%20mar%202026%2C%2011_35_22.png",
        description: "Se concluyeron los muros milán y el armado de zapatas en sótano 2. Inicio de armado de columnas piso 1.",
      },
    ],
    documents: [
      { id: "doc-c1", title: "Contrato Compraventa Mainstreet Valle Real 5.1.pdf", category: "CONTRATO", fileSize: "3.2 MB", uploadDate: "28 Ene 2026" },
      { id: "doc-c2", title: "Plano Arquitectónico y Distribución Unidad 5.1.pdf", category: "PLANO", fileSize: "5.1 MB", uploadDate: "28 Ene 2026" },
      { id: "doc-c3", title: "Reglamento Interno Mainstreet Valle Real.pdf", category: "REGLAMENTO", fileSize: "1.4 MB", uploadDate: "30 Ene 2026" },
    ],
    payments: [
      { id: "pay-c1", cuotaNumber: 1, concept: "Enganche", amount: 1538980.5, interestAmount: 0, scheduledDate: "28 Ene 2026", status: "PAGADO", paidDate: "28 Ene 2026", receiptNumber: "REC-CAMPERO-001", paymentMethod: "Transferencia SPEI" },
      { id: "pay-c2", cuotaNumber: 2, concept: "Mensualidad 1", amount: 25000, interestAmount: 0, scheduledDate: "28 Feb 2026", status: "PAGADO", paidDate: "28 Feb 2026", receiptNumber: "REC-CAMPERO-002", paymentMethod: "Transferencia SPEI" },
      { id: "pay-c3", cuotaNumber: 3, concept: "Mensualidad 2", amount: 25000, interestAmount: 0, scheduledDate: "30 Mar 2026", status: "PAGADO", paidDate: "30 Mar 2026", receiptNumber: "REC-CAMPERO-003", paymentMethod: "Transferencia SPEI" },
      { id: "pay-c4", cuotaNumber: 4, concept: "Mensualidad 3", amount: 25000, interestAmount: 0, scheduledDate: "29 Abr 2026", status: "ATRASADO", paidDate: "Parcial ($24,999.86)" },
      { id: "pay-c5", cuotaNumber: 5, concept: "Mensualidad 4", amount: 25000, interestAmount: 0, scheduledDate: "29 May 2026", status: "ATRASADO" },
      { id: "pay-c6", cuotaNumber: 6, concept: "Mensualidad 5", amount: 25000, interestAmount: 0, scheduledDate: "28 Jun 2026", status: "ATRASADO" },
      { id: "pay-c7", cuotaNumber: 7, concept: "Mensualidad 6", amount: 25000, interestAmount: 0, scheduledDate: "28 Jul 2026", status: "PENDIENTE" },
      { id: "pay-c8", cuotaNumber: 8, concept: "Mensualidad 7", amount: 25000, interestAmount: 0, scheduledDate: "28 Ago 2026", status: "PENDIENTE" },
    ],
    customAttributes: [
      { label: "Orientación", value: "Norte - Panorámica" },
      { label: "Tipo de Vista", value: "Valle Real / Andares" },
      { label: "Cajón Asignado", value: "Sótano 1, #51" },
    ],
  },
  {
    id: "prop-castellana-1c",
    developerName: "Grupo VEQ",
    developerLogo: "https://6d94a8ea50a1bc576a3e8162c197d74f.cdn.bubble.io/f1777398110026x731242031517065300/grupo_veq_logo.jpeg",
    projectName: "Castellana Residencial",
    projectLogo: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=300&auto=format&fit=crop&q=80",
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
    parkingSpots: 1,
    storageUnits: 1,
    floorLevel: 1,
    maintenanceFeeMonthly: 2850,
    images: [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1000&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&auto=format&fit=crop&q=80",
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
        title: "Avance 2 - Estructura Nivel 3",
        date: "Sep 01, 26",
        photo: "https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=800&auto=format&fit=crop&q=80",
        description: "Colado de losa en nivel 3 e instalación hidrosanitaria principal concluida.",
      },
    ],
    documents: [
      { id: "doc-1", title: "Contrato Compraventa Castellana 1C.pdf", category: "CONTRATO", fileSize: "2.4 MB", uploadDate: "17 Ago 2026" },
      { id: "doc-2", title: "Planos Arquitectónicos y Distribución.pdf", category: "PLANO", fileSize: "4.8 MB", uploadDate: "18 Ago 2026" },
    ],
    payments: [
      { id: "pay-1", cuotaNumber: 1, concept: "Enganche Inicial (20%)", amount: 1200000, interestAmount: 0, scheduledDate: "Ago 17, 26", status: "PAGADO", paidDate: "17 Ago 2026", receiptNumber: "REC-2026-0817-01", paymentMethod: "SPEI Bancomer" },
      { id: "pay-2", cuotaNumber: 2, concept: "Mensualidad 1 de 18", amount: 250000, interestAmount: 0, scheduledDate: "Sep 17, 26", status: "ATRASADO" },
    ],
    customAttributes: [
      { label: "Orientación", value: "Sur - Poniente" },
      { label: "Tipo de Vista", value: "Parque Central / Alberca" },
      { label: "Cajón Asignado", value: "Sótano 2, #E-14" },
    ],
  },
  {
    id: "prop-blackeleven-4b",
    developerName: "Desarrollos Black Eleven",
    developerLogo: "https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=300&auto=format&fit=crop&q=80",
    projectName: "Black Eleven Residencial",
    projectLogo: "https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=300&auto=format&fit=crop&q=80",
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
    parkingSpots: 2,
    storageUnits: 1,
    floorLevel: 4,
    maintenanceFeeMonthly: 3400,
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
      { id: "ms-11", title: "Avance Acabados", date: "Sep 15, 26", photo: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800", description: "Pisos porcelánicos y cancelería Eurovent." },
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

  // Selected client user
  const [selectedUserKey, setSelectedUserKey] = useState("jaime");
  const currentUser = useMemo(() => {
    return CLIENT_ACCOUNTS.find((a) => a.id === selectedUserKey) || CLIENT_ACCOUNTS[0]!;
  }, [selectedUserKey]);

  // State
  const [activeTab, setActiveTab] = useState<"properties" | "profile">("properties");
  const [screen, setScreen] = useState<"main" | "detail" | "construction" | "documents" | "statement">("main");
  const [selectedPropId, setSelectedPropId] = useState("prop-campero-mainstreet-51");
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [unitInfoExpanded, setUnitInfoExpanded] = useState(true);
  const [docSearch, setDocSearch] = useState("");
  const [selectedDocCategory, setSelectedDocCategory] = useState("TODOS");
  const [statementSubTab, setStatementSubTab] = useState<"statement" | "payments">("statement");

  // Modals
  const [showNotifications, setShowNotifications] = useState(false);
  const [showReceiptPayment, setShowReceiptPayment] = useState<any | null>(null);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  // User form data
  const [userName, setUserName] = useState(CLIENT_ACCOUNTS[0]!.name);
  const [userPhone, setUserPhone] = useState(CLIENT_ACCOUNTS[0]!.phone);
  const [userRfc, setUserRfc] = useState(CLIENT_ACCOUNTS[0]!.rfc);
  const [userAddress, setUserAddress] = useState(CLIENT_ACCOUNTS[0]!.address);

  // Sync user state when switching accounts
  useEffect(() => {
    if (currentUser) {
      setUserName(currentUser.name);
      setUserPhone(currentUser.phone);
      setUserRfc(currentUser.rfc);
      setUserAddress(currentUser.address);
      if (currentUser.id === "jaime" || currentUser.id === "brandon") {
        setSelectedPropId("prop-campero-mainstreet-51");
      } else {
        setSelectedPropId("prop-castellana-1c");
      }
    }
  }, [currentUser]);

  // Notifications
  const [notifications, setNotifications] = useState([
    { id: "notif-1", title: "Aviso de Cuota Vencida", body: "Tu cuota de Desarrollos Campero (Mainstreet Valle Real 5.1) tiene un saldo pendiente.", time: "Hace 2 horas", read: false },
    { id: "notif-2", title: "Nuevo Avance de Obra Publicado", body: "Desarrollos Campero ha subido fotografías del colado de cimentación.", time: "Ayer a las 11:30 AM", read: false },
    { id: "notif-3", title: "Recibo Digital Generado", body: "Se generó tu recibo oficial por el pago de Enganche.", time: "28 Ene 2026", read: true },
  ]);

  const selectedProp: ClientProperty = useMemo(() => {
    return (ALL_PROPERTIES.find((p) => p.id === selectedPropId) || ALL_PROPERTIES[0]) as ClientProperty;
  }, [selectedPropId]);

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
    return selectedProp.documents.filter((d) => {
      const matchesSearch = d.title.toLowerCase().includes(docSearch.toLowerCase());
      const matchesCategory = selectedDocCategory === "TODOS" || d.category === selectedDocCategory;
      return matchesSearch && matchesCategory;
    });
  }, [selectedProp.documents, docSearch, selectedDocCategory]);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0F172A", display: "flex", flexDirection: "column", alignItems: "center", width: "100%", boxSizing: "border-box" }}>
      
      {/* Top Test Banner */}
      <div style={{
        width: "100%",
        backgroundColor: "#020617",
        borderBottom: "1px solid #1E293B",
        padding: "0.5rem 1rem",
        fontSize: "0.75rem",
        color: "#94A3B8",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "0.75rem",
        position: "sticky",
        top: 0,
        zIndex: 50
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "9999px", backgroundColor: "#10B981" }} />
          <span style={{ fontWeight: 600, color: "#E2E8F0" }}>Devio Portal Cliente</span>
          <span style={{ color: "#475569" }}>•</span>
          <span>Ambiente Staging Multidesarrollador</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ color: "#94A3B8" }}>Probar cuenta:</span>
          <select
            value={selectedUserKey}
            onChange={(e) => setSelectedUserKey(e.target.value)}
            style={{
              backgroundColor: "#1E293B",
              color: "#FFFFFF",
              borderRadius: "0.5rem",
              padding: "0.25rem 0.6rem",
              fontSize: "0.75rem",
              border: "1px solid #334155",
              outline: "none",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            <option value="jaime">Jaime Pozos (Desarrollos Campero - Mainstreet 5.1)</option>
            <option value="inigo">Iñigo Heredia (Grupo VEQ - Castellana 1C)</option>
            <option value="brandon">Brandon Gonzalez (Desarrollos Campero - Mainstreet 5.3)</option>
          </select>
        </div>
      </div>

      {/* Main Responsive Wrapper */}
      <div style={{ width: "100%", maxWidth: "1240px", padding: "1.25rem 1rem", display: "flex", flexDirection: "column", gap: "1.5rem", boxSizing: "border-box" }}>
        
        {/* Apple Style Header Card */}
        <header style={{
          width: "100%",
          background: "linear-gradient(135deg, #1B3047 0%, #1F3652 50%, #2A486C 100%)",
          borderRadius: "1.5rem",
          padding: "1.25rem 1.5rem",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          color: "#FFFFFF",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          boxSizing: "border-box"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <img
              src="/brand/logo-horizontal-light.png"
              alt="Devio"
              style={{ height: "32px", width: "auto", objectFit: "contain", display: "block" }}
            />
            <span style={{
              fontSize: "0.7rem",
              backgroundColor: "rgba(255, 255, 255, 0.15)",
              padding: "0.25rem 0.6rem",
              borderRadius: "9999px",
              fontWeight: 600,
              letterSpacing: "0.02em"
            }}>
              Portal de Propietarios
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: "0.75rem", color: "rgba(255, 255, 255, 0.7)", margin: 0 }}>Hola,</p>
              <p style={{ fontSize: "1.1rem", fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>{userName}</p>
            </div>

            <button
              onClick={() => setShowNotifications(true)}
              style={{
                position: "relative",
                padding: "0.6rem",
                borderRadius: "0.75rem",
                backgroundColor: "rgba(255, 255, 255, 0.12)",
                border: "none",
                cursor: "pointer",
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
              title="Notificaciones"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span style={{
                  position: "absolute",
                  top: "-4px",
                  right: "-4px",
                  backgroundColor: "#EF4444",
                  color: "#FFFFFF",
                  fontSize: "0.6rem",
                  fontWeight: 800,
                  width: "16px",
                  height: "16px",
                  borderRadius: "9999px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2px solid #1F3652"
                }}>
                  {unreadCount}
                </span>
              )}
            </button>

            <button
              onClick={() => { setActiveTab(activeTab === "profile" ? "properties" : "profile"); setScreen("main"); }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.45rem 0.85rem",
                borderRadius: "0.75rem",
                fontSize: "0.75rem",
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
                backgroundColor: activeTab === "profile" ? "#FFFFFF" : "rgba(255, 255, 255, 0.12)",
                color: activeTab === "profile" ? "#1F3652" : "#FFFFFF"
              }}
            >
              <img src={currentUser.avatarUrl} alt="Avatar" style={{ width: "20px", height: "20px", borderRadius: "9999px", objectFit: "cover" }} />
              <span>{activeTab === "profile" ? "Ver Propiedades" : "Mi Perfil"}</span>
            </button>

            <button
              onClick={handleLogout}
              style={{
                padding: "0.6rem",
                borderRadius: "0.75rem",
                backgroundColor: "rgba(255, 255, 255, 0.08)",
                border: "none",
                cursor: "pointer",
                color: "#CBD5E1"
              }}
              title="Cerrar Sesión"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {/* Content Layout */}
        {activeTab === "properties" ? (
          <div className="portal-layout-grid">
            
            {/* Left Sidebar */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              
              {/* Next Payment Wallet Card */}
              <div style={{
                background: "linear-gradient(145deg, #1E293B 0%, #0F172A 100%)",
                borderRadius: "1.25rem",
                padding: "1.25rem",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "#FFFFFF",
                boxShadow: "0 4px 12px rgba(0,0,0,0.2)"
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                  <span style={{
                    fontSize: "0.65rem",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: "#FBBF24",
                    backgroundColor: "rgba(251, 191, 36, 0.12)",
                    padding: "0.2rem 0.5rem",
                    borderRadius: "9999px",
                    border: "1px solid rgba(251, 191, 36, 0.25)"
                  }}>
                    Tu Próximo Pago
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "#94A3B8", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                    <Clock size={12} /> {selectedProp.nextPaymentDaysRemaining} días restantes
                  </span>
                </div>

                <p style={{ fontSize: "1.75rem", fontWeight: 900, color: "#FFFFFF", margin: "0 0 0.25rem 0" }}>
                  {formatMoney(selectedProp.nextPaymentAmount)}
                </p>
                <p style={{ fontSize: "0.75rem", color: "#94A3B8", margin: "0 0 1rem 0" }}>
                  Vence el <strong style={{ color: "#E2E8F0" }}>{selectedProp.nextPaymentDueDate}</strong> • {selectedProp.projectName} ({selectedProp.unitNumber})
                </p>

                {selectedProp.overdueAmount ? (
                  <div style={{
                    backgroundColor: "rgba(239, 68, 68, 0.12)",
                    border: "1px solid rgba(239, 68, 68, 0.25)",
                    borderRadius: "0.75rem",
                    padding: "0.6rem 0.75rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontSize: "0.75rem",
                    marginBottom: "1rem"
                  }}>
                    <span style={{ color: "#F87171", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.35rem" }}>
                      <AlertCircle size={14} /> Saldo vencido
                    </span>
                    <span style={{ color: "#F87171", fontWeight: 800 }}>{formatMoney(selectedProp.overdueAmount)}</span>
                  </div>
                ) : null}

                <button
                  onClick={() => { setScreen("statement"); setStatementSubTab("payments"); }}
                  style={{
                    width: "100%",
                    background: "linear-gradient(90deg, #10B981 0%, #059669 100%)",
                    color: "#FFFFFF",
                    fontWeight: 700,
                    fontSize: "0.75rem",
                    padding: "0.75rem 1rem",
                    borderRadius: "0.75rem",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                    boxShadow: "0 2px 8px rgba(16, 185, 129, 0.3)"
                  }}
                >
                  <CreditCard size={15} />
                  <span>Ver Estado de Cuenta y Pagos</span>
                </button>
              </div>

              {/* Property Selector List */}
              <div style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "1.25rem",
                padding: "1.25rem",
                border: "1px solid #E2E8F0",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem"
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                  <h3 style={{ fontSize: "0.7rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: "#94A3B8", margin: 0 }}>
                    Tus Propiedades ({ALL_PROPERTIES.length})
                  </h3>
                  <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#1F3652", backgroundColor: "#EFF6FF", padding: "0.15rem 0.45rem", borderRadius: "9999px" }}>
                    Multidesarrollo
                  </span>
                </div>

                {ALL_PROPERTIES.map((prop) => {
                  const isSelected = prop.id === selectedProp.id;
                  return (
                    <div
                      key={prop.id}
                      onClick={() => { setSelectedPropId(prop.id); setSelectedImageIdx(0); }}
                      style={{
                        padding: "0.75rem",
                        borderRadius: "1rem",
                        cursor: "pointer",
                        border: isSelected ? "2px solid #1F3652" : "1px solid #E2E8F0",
                        backgroundColor: isSelected ? "#1F3652" : "#F8FAFC",
                        color: isSelected ? "#FFFFFF" : "#1E293B",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        transition: "all 0.15s ease"
                      }}
                    >
                      <img
                        src={prop.images[0]}
                        alt={prop.projectName}
                        style={{ width: "48px", height: "48px", borderRadius: "0.6rem", objectFit: "cover", flexShrink: 0 }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.25rem" }}>
                          <span style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", color: isSelected ? "#CBD5E1" : "#64748B", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {prop.developerName}
                          </span>
                          <span style={{
                            fontSize: "0.7rem",
                            fontWeight: 800,
                            padding: "0.1rem 0.35rem",
                            borderRadius: "0.25rem",
                            backgroundColor: isSelected ? "rgba(255,255,255,0.2)" : "#E2E8F0",
                            color: isSelected ? "#FFFFFF" : "#334155"
                          }}>
                            {prop.unitNumber}
                          </span>
                        </div>
                        <p style={{ fontSize: "0.85rem", fontWeight: 800, margin: "0.15rem 0", color: isSelected ? "#FFFFFF" : "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {prop.projectName}
                        </p>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.25rem" }}>
                          <div style={{ flex: 1, height: "5px", borderRadius: "9999px", backgroundColor: isSelected ? "rgba(255,255,255,0.2)" : "#E2E8F0", overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${prop.constructionPct}%`, backgroundColor: "#10B981", borderRadius: "9999px" }} />
                          </div>
                          <span style={{ fontSize: "0.65rem", fontWeight: 800, color: isSelected ? "#6EE7B7" : "#059669" }}>
                            {prop.constructionPct}%
                          </span>
                        </div>
                      </div>
                      <ChevronRight size={16} color={isSelected ? "#FFFFFF" : "#94A3B8"} />
                    </div>
                  );
                })}
              </div>

              {/* Sub-Navigation */}
              <div style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "1.25rem",
                padding: "0.75rem",
                border: "1px solid #E2E8F0",
                display: "flex",
                flexDirection: "column",
                gap: "0.25rem"
              }}>
                {[
                  { id: "detail", label: "Detalle de Propiedad", icon: Building },
                  { id: "statement", label: "Estado de Cuenta & Pagos", icon: CreditCard },
                  { id: "construction", label: "Avance de Obra", icon: Wrench },
                  { id: "documents", label: "Documentos Oficiales", icon: FileText },
                ].map((item) => {
                  const isActive = screen === item.id;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setScreen(item.id as any)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0.75rem 1rem",
                        borderRadius: "0.85rem",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        border: "none",
                        cursor: "pointer",
                        backgroundColor: isActive ? "#1F3652" : "transparent",
                        color: isActive ? "#FFFFFF" : "#475569",
                        textAlign: "left"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                        <Icon size={16} color={isActive ? "#FFFFFF" : "#64748B"} />
                        <span>{item.label}</span>
                      </div>
                      <ChevronRight size={14} color={isActive ? "rgba(255,255,255,0.6)" : "#CBD5E1"} />
                    </button>
                  );
                })}
              </div>

            </div>

            {/* Right Main Content */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              
              {/* SCREEN: DETALLE */}
              {(screen === "detail" || screen === "main") && (
                <>
                  {/* Photo Gallery Hero */}
                  <div style={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: "1.5rem",
                    overflow: "hidden",
                    border: "1px solid #E2E8F0",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.04)"
                  }}>
                    <div style={{
                      position: "relative",
                      width: "100%",
                      height: "340px",
                      backgroundColor: "#0F172A",
                      overflow: "hidden"
                    }}>
                      <img
                        src={selectedProp.images[selectedImageIdx] || selectedProp.images[0]}
                        alt={selectedProp.projectName}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                      <div style={{
                        position: "absolute",
                        inset: 0,
                        background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        padding: "1.25rem",
                        boxSizing: "border-box"
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{
                            backgroundColor: "rgba(255,255,255,0.95)",
                            color: "#1F3652",
                            fontWeight: 900,
                            fontSize: "0.75rem",
                            padding: "0.35rem 0.75rem",
                            borderRadius: "9999px"
                          }}>
                            Unidad {selectedProp.unitNumber} • {selectedProp.unitType}
                          </span>
                          <span style={{
                            backgroundColor: "#10B981",
                            color: "#FFFFFF",
                            fontWeight: 800,
                            fontSize: "0.75rem",
                            padding: "0.35rem 0.75rem",
                            borderRadius: "9999px",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.35rem"
                          }}>
                            <CheckCircle2 size={14} /> {selectedProp.constructionPct}% Avance
                          </span>
                        </div>

                        <div>
                          <p style={{ fontSize: "0.75rem", fontWeight: 800, color: "#FBBF24", textTransform: "uppercase", margin: 0 }}>
                            {selectedProp.developerName}
                          </p>
                          <h2 style={{ fontSize: "1.5rem", fontWeight: 900, color: "#FFFFFF", margin: "0.2rem 0" }}>
                            {selectedProp.projectName}
                          </h2>
                          <p style={{ fontSize: "0.75rem", color: "#E2E8F0", margin: 0, display: "flex", alignItems: "center", gap: "0.35rem" }}>
                            <MapPin size={13} /> {selectedProp.projectAddress}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Thumbnail Switcher */}
                    {selectedProp.images.length > 1 && (
                      <div style={{ padding: "0.75rem 1rem", backgroundColor: "#F8FAFC", borderTop: "1px solid #E2E8F0", display: "flex", gap: "0.5rem", overflowX: "auto" }}>
                        {selectedProp.images.map((img, idx) => (
                          <button
                            key={idx}
                            onClick={() => setSelectedImageIdx(idx)}
                            style={{
                              width: "60px",
                              height: "44px",
                              borderRadius: "0.5rem",
                              overflow: "hidden",
                              border: selectedImageIdx === idx ? "2px solid #1F3652" : "2px solid transparent",
                              opacity: selectedImageIdx === idx ? 1 : 0.6,
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

                  {/* Financial Stats Grid */}
                  <div className="portal-stats-grid">
                    <div style={{ backgroundColor: "#FFFFFF", padding: "1rem", borderRadius: "1rem", border: "1px solid #E2E8F0" }}>
                      <p style={{ fontSize: "0.65rem", fontWeight: 800, color: "#94A3B8", textTransform: "uppercase", margin: 0 }}>Precio Total</p>
                      <p style={{ fontSize: "1.1rem", fontWeight: 900, color: "#0F172A", margin: "0.25rem 0 0 0" }}>{formatMoney(selectedProp.totalPrice)}</p>
                    </div>
                    <div style={{ backgroundColor: "#FFFFFF", padding: "1rem", borderRadius: "1rem", border: "1px solid #E2E8F0" }}>
                      <p style={{ fontSize: "0.65rem", fontWeight: 800, color: "#059669", textTransform: "uppercase", margin: 0 }}>Total Pagado</p>
                      <p style={{ fontSize: "1.1rem", fontWeight: 900, color: "#059669", margin: "0.25rem 0 0 0" }}>{formatMoney(selectedProp.paidAmount)}</p>
                    </div>
                    <div style={{ backgroundColor: "#FFFFFF", padding: "1rem", borderRadius: "1rem", border: "1px solid #E2E8F0" }}>
                      <p style={{ fontSize: "0.65rem", fontWeight: 800, color: "#D97706", textTransform: "uppercase", margin: 0 }}>Saldo Pendiente</p>
                      <p style={{ fontSize: "1.1rem", fontWeight: 900, color: "#D97706", margin: "0.25rem 0 0 0" }}>{formatMoney(selectedProp.pendingAmount)}</p>
                    </div>
                    <div style={{ backgroundColor: "#FFFFFF", padding: "1rem", borderRadius: "1rem", border: "1px solid #E2E8F0" }}>
                      <p style={{ fontSize: "0.65rem", fontWeight: 800, color: "#1F3652", textTransform: "uppercase", margin: 0 }}>Entrega Estimada</p>
                      <p style={{ fontSize: "1rem", fontWeight: 900, color: "#1F3652", margin: "0.25rem 0 0 0" }}>{selectedProp.estimatedDeliveryDate}</p>
                    </div>
                  </div>

                  {/* Specs & Custom Attributes */}
                  <div style={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: "1.25rem",
                    padding: "1.25rem",
                    border: "1px solid #E2E8F0",
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <h3 style={{ fontSize: "1rem", fontWeight: 900, color: "#0F172A", margin: 0 }}>Especificaciones de la Unidad</h3>
                      <button
                        onClick={() => setUnitInfoExpanded(!unitInfoExpanded)}
                        style={{ background: "none", border: "none", color: "#64748B", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.25rem" }}
                      >
                        {unitInfoExpanded ? "Ocultar" : "Mostrar"}
                        {unitInfoExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </div>

                    {unitInfoExpanded && (
                      <div className="portal-specs-grid">
                        <div style={{ backgroundColor: "#F8FAFC", padding: "0.85rem", borderRadius: "0.85rem", border: "1px solid #F1F5F9" }}>
                          <p style={{ fontSize: "0.7rem", color: "#64748B", margin: 0 }}>Superficie</p>
                          <p style={{ fontSize: "0.9rem", fontWeight: 800, color: "#1E293B", margin: "0.2rem 0 0 0" }}>{selectedProp.areaM2} m²</p>
                        </div>
                        <div style={{ backgroundColor: "#F8FAFC", padding: "0.85rem", borderRadius: "0.85rem", border: "1px solid #F1F5F9" }}>
                          <p style={{ fontSize: "0.7rem", color: "#64748B", margin: 0 }}>Recámaras</p>
                          <p style={{ fontSize: "0.9rem", fontWeight: 800, color: "#1E293B", margin: "0.2rem 0 0 0" }}>{selectedProp.bedrooms} Rec.</p>
                        </div>
                        <div style={{ backgroundColor: "#F8FAFC", padding: "0.85rem", borderRadius: "0.85rem", border: "1px solid #F1F5F9" }}>
                          <p style={{ fontSize: "0.7rem", color: "#64748B", margin: 0 }}>Baños</p>
                          <p style={{ fontSize: "0.9rem", fontWeight: 800, color: "#1E293B", margin: "0.2rem 0 0 0" }}>{selectedProp.bathrooms} Baños</p>
                        </div>
                        <div style={{ backgroundColor: "#F8FAFC", padding: "0.85rem", borderRadius: "0.85rem", border: "1px solid #F1F5F9" }}>
                          <p style={{ fontSize: "0.7rem", color: "#64748B", margin: 0 }}>Nivel / Piso</p>
                          <p style={{ fontSize: "0.9rem", fontWeight: 800, color: "#1E293B", margin: "0.2rem 0 0 0" }}>Piso {selectedProp.floorLevel || 1}</p>
                        </div>
                        <div style={{ backgroundColor: "#F8FAFC", padding: "0.85rem", borderRadius: "0.85rem", border: "1px solid #F1F5F9" }}>
                          <p style={{ fontSize: "0.7rem", color: "#64748B", margin: 0 }}>Estacionamiento</p>
                          <p style={{ fontSize: "0.9rem", fontWeight: 800, color: "#1E293B", margin: "0.2rem 0 0 0" }}>{selectedProp.parkingSpots || 1} Cajón</p>
                        </div>
                        <div style={{ backgroundColor: "#F8FAFC", padding: "0.85rem", borderRadius: "0.85rem", border: "1px solid #F1F5F9" }}>
                          <p style={{ fontSize: "0.7rem", color: "#64748B", margin: 0 }}>Mantenimiento Sugerido</p>
                          <p style={{ fontSize: "0.9rem", fontWeight: 800, color: "#1E293B", margin: "0.2rem 0 0 0" }}>{formatMoney(selectedProp.maintenanceFeeMonthly || 0)}/mes</p>
                        </div>
                        {selectedProp.customAttributes.map((attr, idx) => (
                          <div key={idx} style={{ backgroundColor: "#F8FAFC", padding: "0.85rem", borderRadius: "0.85rem", border: "1px solid #F1F5F9" }}>
                            <p style={{ fontSize: "0.7rem", color: "#64748B", margin: 0 }}>{attr.label}</p>
                            <p style={{ fontSize: "0.9rem", fontWeight: 800, color: "#1E293B", margin: "0.2rem 0 0 0" }}>{attr.value}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* SCREEN: ESTADO DE CUENTA */}
              {screen === "statement" && (
                <div style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "1.5rem",
                  padding: "1.5rem",
                  border: "1px solid #E2E8F0",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.5rem"
                }}>
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
                    <div>
                      <h2 style={{ fontSize: "1.25rem", fontWeight: 900, color: "#0F172A", margin: 0 }}>Estado de Cuenta & Pagos</h2>
                      <p style={{ fontSize: "0.75rem", color: "#64748B", margin: "0.2rem 0 0 0" }}>
                        {selectedProp.projectName} • Unidad {selectedProp.unitNumber}
                      </p>
                    </div>

                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        onClick={() => setStatementSubTab("statement")}
                        style={{
                          padding: "0.5rem 0.85rem",
                          borderRadius: "0.6rem",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          border: "none",
                          cursor: "pointer",
                          backgroundColor: statementSubTab === "statement" ? "#1F3652" : "#F1F5F9",
                          color: statementSubTab === "statement" ? "#FFFFFF" : "#475569"
                        }}
                      >
                        Resumen General
                      </button>
                      <button
                        onClick={() => setStatementSubTab("payments")}
                        style={{
                          padding: "0.5rem 0.85rem",
                          borderRadius: "0.6rem",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          border: "none",
                          cursor: "pointer",
                          backgroundColor: statementSubTab === "payments" ? "#1F3652" : "#F1F5F9",
                          color: statementSubTab === "payments" ? "#FFFFFF" : "#475569"
                        }}
                      >
                        Desglose de Cuotas ({selectedProp.payments.length})
                      </button>
                    </div>
                  </div>

                  {statementSubTab === "statement" ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                      <div className="portal-specs-grid">
                        <div style={{ backgroundColor: "#F8FAFC", padding: "1rem", borderRadius: "1rem", border: "1px solid #E2E8F0" }}>
                          <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "#64748B", margin: 0 }}>Monto Contratado</p>
                          <p style={{ fontSize: "1.25rem", fontWeight: 900, color: "#0F172A", margin: "0.25rem 0 0 0" }}>{formatMoney(selectedProp.totalPrice)}</p>
                        </div>
                        <div style={{ backgroundColor: "#ECFDF5", padding: "1rem", borderRadius: "1rem", border: "1px solid #A7F3D0" }}>
                          <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "#065F46", margin: 0 }}>Monto Liquidado</p>
                          <p style={{ fontSize: "1.25rem", fontWeight: 900, color: "#047857", margin: "0.25rem 0 0 0" }}>{formatMoney(selectedProp.paidAmount)}</p>
                        </div>
                        <div style={{ backgroundColor: "#FFFBEB", padding: "1rem", borderRadius: "1rem", border: "1px solid #FDE68A" }}>
                          <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "#92400E", margin: 0 }}>Saldo por Liquidar</p>
                          <p style={{ fontSize: "1.25rem", fontWeight: 900, color: "#B45309", margin: "0.25rem 0 0 0" }}>{formatMoney(selectedProp.pendingAmount)}</p>
                        </div>
                      </div>

                      <div style={{ backgroundColor: "#F8FAFC", padding: "1.25rem", borderRadius: "1rem", border: "1px solid #E2E8F0" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", fontWeight: 800, marginBottom: "0.5rem" }}>
                          <span style={{ color: "#475569" }}>Progreso de Pago Total</span>
                          <span style={{ color: "#059669" }}>{Math.round((selectedProp.paidAmount / selectedProp.totalPrice) * 100)}%</span>
                        </div>
                        <div style={{ width: "100%", height: "10px", backgroundColor: "#E2E8F0", borderRadius: "9999px", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${(selectedProp.paidAmount / selectedProp.totalPrice) * 100}%`, backgroundColor: "#10B981", borderRadius: "9999px" }} />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.75rem" }}>
                        <thead>
                          <tr style={{ borderBottom: "1px solid #E2E8F0", textAlign: "left", color: "#94A3B8", fontWeight: 800, textTransform: "uppercase" }}>
                            <th style={{ padding: "0.75rem" }}>#</th>
                            <th style={{ padding: "0.75rem" }}>Concepto</th>
                            <th style={{ padding: "0.75rem" }}>Monto</th>
                            <th style={{ padding: "0.75rem" }}>Fecha Prog.</th>
                            <th style={{ padding: "0.75rem" }}>Estado</th>
                            <th style={{ padding: "0.75rem", textAlign: "right" }}>Recibo Oficial</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedProp.payments.map((p) => (
                            <tr key={p.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                              <td style={{ padding: "0.75rem", fontWeight: 800 }}>{p.cuotaNumber}</td>
                              <td style={{ padding: "0.75rem", fontWeight: 700, color: "#1E293B" }}>{p.concept}</td>
                              <td style={{ padding: "0.75rem", fontWeight: 800, color: "#0F172A" }}>{formatMoney(p.amount)}</td>
                              <td style={{ padding: "0.75rem", color: "#64748B" }}>{p.scheduledDate}</td>
                              <td style={{ padding: "0.75rem" }}>
                                <span style={{
                                  display: "inline-block",
                                  padding: "0.2rem 0.5rem",
                                  borderRadius: "9999px",
                                  fontSize: "0.65rem",
                                  fontWeight: 800,
                                  backgroundColor: p.status === "PAGADO" ? "#D1FAE5" : (p.status === "ATRASADO" ? "#FEE2E2" : "#FEF3C7"),
                                  color: p.status === "PAGADO" ? "#065F46" : (p.status === "ATRASADO" ? "#991B1B" : "#92400E")
                                }}>
                                  {p.status}
                                </span>
                              </td>
                              <td style={{ padding: "0.75rem", textAlign: "right" }}>
                                {p.status === "PAGADO" ? (
                                  <button
                                    onClick={() => setShowReceiptPayment(p)}
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "0.35rem",
                                      padding: "0.3rem 0.6rem",
                                      borderRadius: "0.5rem",
                                      backgroundColor: "#EEF2FF",
                                      color: "#4338CA",
                                      border: "none",
                                      fontWeight: 700,
                                      fontSize: "0.7rem",
                                      cursor: "pointer"
                                    }}
                                  >
                                    <FileCheck size={13} />
                                    <span>Ver Recibo</span>
                                  </button>
                                ) : (
                                  <span style={{ color: "#94A3B8" }}>—</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* SCREEN: OBRA */}
              {screen === "construction" && (
                <div style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "1.5rem",
                  padding: "1.5rem",
                  border: "1px solid #E2E8F0",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.5rem"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <h2 style={{ fontSize: "1.25rem", fontWeight: 900, color: "#0F172A", margin: 0 }}>Avance de Obra</h2>
                      <p style={{ fontSize: "0.75rem", color: "#64748B", margin: "0.2rem 0 0 0" }}>Reporte verificado al {selectedProp.lastProgressUpdateDate}</p>
                    </div>
                    <span style={{ backgroundColor: "#D1FAE5", color: "#065F46", fontWeight: 900, fontSize: "0.9rem", padding: "0.4rem 0.85rem", borderRadius: "0.75rem" }}>
                      {selectedProp.constructionPct}% General
                    </span>
                  </div>

                  <div className="portal-specialties-grid">
                    {selectedProp.specialtiesProgress.map((esp) => (
                      <div key={esp.id} style={{ backgroundColor: "#F8FAFC", padding: "1rem", borderRadius: "1rem", border: "1px solid #E2E8F0" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", fontWeight: 800, marginBottom: "0.5rem" }}>
                          <span style={{ color: "#1E293B" }}>{esp.name}</span>
                          <span style={{ color: "#059669" }}>{esp.percentage}%</span>
                        </div>
                        <div style={{ width: "100%", height: "8px", backgroundColor: "#E2E8F0", borderRadius: "9999px", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${esp.percentage}%`, backgroundColor: "#10B981", borderRadius: "9999px" }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <h3 style={{ fontSize: "0.8rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748B", margin: 0 }}>
                      Historial Fotográfico
                    </h3>
                    {selectedProp.constructionMilestones.map((m) => (
                      <div key={m.id} style={{ backgroundColor: "#F8FAFC", borderRadius: "1rem", overflow: "hidden", border: "1px solid #E2E8F0", display: "flex", flexWrap: "wrap" }}>
                        <img src={m.photo} alt={m.title} style={{ width: "200px", height: "140px", objectFit: "cover" }} />
                        <div style={{ padding: "1rem", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                          <div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <h4 style={{ fontSize: "0.9rem", fontWeight: 800, color: "#0F172A", margin: 0 }}>{m.title}</h4>
                              <span style={{ fontSize: "0.7rem", color: "#94A3B8" }}>{m.date}</span>
                            </div>
                            <p style={{ fontSize: "0.75rem", color: "#475569", margin: "0.5rem 0 0 0", lineHeight: 1.5 }}>{m.description}</p>
                          </div>
                          <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#059669", marginTop: "0.5rem" }}>Supervisión Devio Aprobada</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SCREEN: DOCUMENTOS */}
              {screen === "documents" && (
                <div style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "1.5rem",
                  padding: "1.5rem",
                  border: "1px solid #E2E8F0",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.25rem"
                }}>
                  <div>
                    <h2 style={{ fontSize: "1.25rem", fontWeight: 900, color: "#0F172A", margin: 0 }}>Documentos Oficiales</h2>
                    <p style={{ fontSize: "0.75rem", color: "#64748B", margin: "0.2rem 0 0 0" }}>Contratos, planos y reglamentos autorizados</p>
                  </div>

                  <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                    <div style={{ position: "relative", flex: 1, minWidth: "220px" }}>
                      <Search size={16} color="#94A3B8" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }} />
                      <input
                        type="text"
                        placeholder="Buscar documento..."
                        value={docSearch}
                        onChange={(e) => setDocSearch(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "0.6rem 0.75rem 0.6rem 2.2rem",
                          borderRadius: "0.6rem",
                          border: "1px solid #CBD5E1",
                          fontSize: "0.75rem",
                          outline: "none",
                          boxSizing: "border-box"
                        }}
                      />
                    </div>
                    <div style={{ display: "flex", gap: "0.35rem" }}>
                      {["TODOS", "CONTRATO", "PLANO", "REGLAMENTO"].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setSelectedDocCategory(cat)}
                          style={{
                            padding: "0.5rem 0.75rem",
                            borderRadius: "0.5rem",
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            border: "none",
                            cursor: "pointer",
                            backgroundColor: selectedDocCategory === cat ? "#1F3652" : "#F1F5F9",
                            color: selectedDocCategory === cat ? "#FFFFFF" : "#64748B"
                          }}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                    {filteredDocs.map((doc) => (
                      <div
                        key={doc.id}
                        style={{
                          padding: "0.85rem 1rem",
                          borderRadius: "0.85rem",
                          backgroundColor: "#F8FAFC",
                          border: "1px solid #E2E8F0",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "1rem"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", minWidth: 0 }}>
                          <div style={{ width: "36px", height: "36px", borderRadius: "0.6rem", backgroundColor: "#EEF2FF", color: "#4338CA", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <FileText size={18} />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <p style={{ fontSize: "0.8rem", fontWeight: 800, color: "#0F172A", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.title}</p>
                            <p style={{ fontSize: "0.65rem", color: "#94A3B8", margin: "0.15rem 0 0 0" }}>{doc.fileSize} • Subido el {doc.uploadDate}</p>
                          </div>
                        </div>
                        <a
                          href={doc.fileUrl || "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.35rem",
                            padding: "0.4rem 0.75rem",
                            borderRadius: "0.6rem",
                            backgroundColor: "#FFFFFF",
                            border: "1px solid #CBD5E1",
                            color: "#334155",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            textDecoration: "none"
                          }}
                        >
                          <Download size={14} />
                          <span>Descargar</span>
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        ) : (
          /* TAB: PERFIL */
          <div style={{
            maxWidth: "640px",
            margin: "0 auto",
            width: "100%",
            backgroundColor: "#FFFFFF",
            borderRadius: "1.5rem",
            padding: "2rem",
            border: "1px solid #E2E8F0",
            display: "flex",
            flexDirection: "column",
            gap: "1.5rem",
            boxSizing: "border-box"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <img src={currentUser.avatarUrl} alt="Avatar" style={{ width: "64px", height: "64px", borderRadius: "9999px", objectFit: "cover" }} />
              <div>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 900, color: "#0F172A", margin: 0 }}>{userName}</h2>
                <p style={{ fontSize: "0.75rem", color: "#64748B", margin: "0.2rem 0 0 0" }}>{currentUser.email}</p>
                <span style={{ display: "inline-block", marginTop: "0.25rem", fontSize: "0.65rem", fontWeight: 800, backgroundColor: "#D1FAE5", color: "#065F46", padding: "0.15rem 0.5rem", borderRadius: "9999px" }}>
                  Propietario Verificado
                </span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div style={{ padding: "0.85rem", backgroundColor: "#F8FAFC", borderRadius: "0.85rem" }}>
                <p style={{ fontSize: "0.65rem", color: "#94A3B8", fontWeight: 700, margin: 0 }}>Teléfono</p>
                <p style={{ fontSize: "0.85rem", fontWeight: 800, color: "#1E293B", margin: "0.2rem 0 0 0" }}>{userPhone}</p>
              </div>
              <div style={{ padding: "0.85rem", backgroundColor: "#F8FAFC", borderRadius: "0.85rem" }}>
                <p style={{ fontSize: "0.65rem", color: "#94A3B8", fontWeight: 700, margin: 0 }}>RFC Fiscal</p>
                <p style={{ fontSize: "0.85rem", fontWeight: 800, color: "#1E293B", margin: "0.2rem 0 0 0" }}>{userRfc}</p>
              </div>
              <div style={{ gridColumn: "1 / -1", padding: "0.85rem", backgroundColor: "#F8FAFC", borderRadius: "0.85rem" }}>
                <p style={{ fontSize: "0.65rem", color: "#94A3B8", fontWeight: 700, margin: 0 }}>Domicilio Registrado</p>
                <p style={{ fontSize: "0.85rem", fontWeight: 800, color: "#1E293B", margin: "0.2rem 0 0 0" }}>{userAddress}</p>
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.75rem", paddingTop: "1rem", borderTop: "1px solid #F1F5F9" }}>
              <button
                onClick={() => setShowEditProfile(true)}
                style={{
                  flex: 1,
                  backgroundColor: "#1F3652",
                  color: "#FFFFFF",
                  fontWeight: 800,
                  fontSize: "0.75rem",
                  padding: "0.75rem",
                  borderRadius: "0.75rem",
                  border: "none",
                  cursor: "pointer"
                }}
              >
                Editar Información
              </button>
              <button
                onClick={() => setShowChangePassword(true)}
                style={{
                  flex: 1,
                  backgroundColor: "#F1F5F9",
                  color: "#334155",
                  fontWeight: 800,
                  fontSize: "0.75rem",
                  padding: "0.75rem",
                  borderRadius: "0.75rem",
                  border: "none",
                  cursor: "pointer"
                }}
              >
                Cambiar Contraseña
              </button>
            </div>
          </div>
        )}

      </div>

      {/* MODAL: RECEIPT PDF */}
      {showReceiptPayment && (
        <div style={{
          position: "fixed",
          inset: 0,
          zIndex: 999,
          backgroundColor: "rgba(0,0,0,0.75)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem"
        }}>
          <div style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "1.5rem",
            maxWidth: "480px",
            width: "100%",
            padding: "1.75rem",
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)"
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #F1F5F9", paddingBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <img src="/brand/logo-horizontal-main.png" alt="Devio" style={{ height: "22px", width: "auto" }} />
                <span style={{ fontSize: "0.65rem", fontWeight: 800, backgroundColor: "#D1FAE5", color: "#065F46", padding: "0.15rem 0.45rem", borderRadius: "9999px" }}>
                  RECIBO OFICIAL
                </span>
              </div>
              <button onClick={() => setShowReceiptPayment(null)} style={{ background: "none", border: "none", cursor: "pointer", padding: "0.25rem" }}>
                <X size={18} color="#64748B" />
              </button>
            </div>

            <div style={{ backgroundColor: "#F8FAFC", borderRadius: "1rem", padding: "1rem", border: "1px solid #E2E8F0", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem" }}>
                <span style={{ color: "#64748B" }}>Folio:</span>
                <span style={{ fontWeight: 800, color: "#0F172A" }}>{showReceiptPayment.receiptNumber}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem" }}>
                <span style={{ color: "#64748B" }}>Fecha de Pago:</span>
                <span style={{ fontWeight: 800, color: "#0F172A" }}>{showReceiptPayment.paidDate || showReceiptPayment.scheduledDate}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem" }}>
                <span style={{ color: "#64748B" }}>Método:</span>
                <span style={{ fontWeight: 800, color: "#0F172A" }}>{showReceiptPayment.paymentMethod || "SPEI"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem" }}>
                <span style={{ color: "#64748B" }}>Concepto:</span>
                <span style={{ fontWeight: 800, color: "#0F172A" }}>{showReceiptPayment.concept}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1rem", fontWeight: 900, color: "#047857", borderTop: "1px solid #E2E8F0", paddingTop: "0.5rem", marginTop: "0.25rem" }}>
                <span>Total Pagado:</span>
                <span>{formatMoney(showReceiptPayment.amount)}</span>
              </div>
            </div>

            <p style={{ fontSize: "0.65rem", color: "#94A3B8", textAlign: "center", margin: 0 }}>
              Comprobante digital emitido con certificación electrónica oficial de {selectedProp.developerName}.
            </p>

            <button
              onClick={() => {
                alert("Descargando recibo oficial en PDF...");
                setShowReceiptPayment(null);
              }}
              style={{
                width: "100%",
                backgroundColor: "#1F3652",
                color: "#FFFFFF",
                fontWeight: 800,
                fontSize: "0.75rem",
                padding: "0.75rem",
                borderRadius: "0.75rem",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem"
              }}
            >
              <Download size={15} />
              <span>Descargar PDF Oficial</span>
            </button>
          </div>
        </div>
      )}

      {/* MODAL: NOTIFICATIONS */}
      {showNotifications && (
        <div style={{
          position: "fixed",
          inset: 0,
          zIndex: 999,
          backgroundColor: "rgba(0,0,0,0.75)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem"
        }}>
          <div style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "1.5rem",
            maxWidth: "420px",
            width: "100%",
            padding: "1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem"
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #F1F5F9", paddingBottom: "0.75rem" }}>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 900, color: "#0F172A", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Bell size={18} color="#1F3652" /> Avisos y Notificaciones
              </h3>
              <button onClick={() => setShowNotifications(false)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <X size={18} color="#64748B" />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxHeight: "300px", overflowY: "auto" }}>
              {notifications.map((n) => (
                <div key={n.id} style={{ padding: "0.85rem", borderRadius: "0.85rem", backgroundColor: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#0F172A" }}>{n.title}</span>
                    <span style={{ fontSize: "0.65rem", color: "#94A3B8" }}>{n.time}</span>
                  </div>
                  <p style={{ fontSize: "0.7rem", color: "#475569", margin: 0 }}>{n.body}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowNotifications(false)}
              style={{
                width: "100%",
                backgroundColor: "#F1F5F9",
                color: "#334155",
                fontWeight: 700,
                fontSize: "0.75rem",
                padding: "0.65rem",
                borderRadius: "0.75rem",
                border: "none",
                cursor: "pointer"
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* MODAL: EDIT PROFILE */}
      {showEditProfile && (
        <div style={{
          position: "fixed",
          inset: 0,
          zIndex: 999,
          backgroundColor: "rgba(0,0,0,0.75)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem"
        }}>
          <div style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "1.5rem",
            maxWidth: "420px",
            width: "100%",
            padding: "1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem"
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #F1F5F9", paddingBottom: "0.75rem" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 900, color: "#0F172A", margin: 0 }}>Editar Datos Personales</h3>
              <button onClick={() => setShowEditProfile(false)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <X size={18} color="#64748B" />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div>
                <label style={{ fontSize: "0.7rem", fontWeight: 700, color: "#64748B" }}>Nombre Completo</label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: "0.6rem", border: "1px solid #CBD5E1", fontSize: "0.75rem", marginTop: "0.25rem", boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "0.7rem", fontWeight: 700, color: "#64748B" }}>Teléfono</label>
                <input
                  type="text"
                  value={userPhone}
                  onChange={(e) => setUserPhone(e.target.value)}
                  style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: "0.6rem", border: "1px solid #CBD5E1", fontSize: "0.75rem", marginTop: "0.25rem", boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "0.7rem", fontWeight: 700, color: "#64748B" }}>RFC</label>
                <input
                  type="text"
                  value={userRfc}
                  onChange={(e) => setUserRfc(e.target.value)}
                  style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: "0.6rem", border: "1px solid #CBD5E1", fontSize: "0.75rem", marginTop: "0.25rem", boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "0.7rem", fontWeight: 700, color: "#64748B" }}>Domicilio</label>
                <input
                  type="text"
                  value={userAddress}
                  onChange={(e) => setUserAddress(e.target.value)}
                  style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: "0.6rem", border: "1px solid #CBD5E1", fontSize: "0.75rem", marginTop: "0.25rem", boxSizing: "border-box" }}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
              <button
                onClick={() => setShowEditProfile(false)}
                style={{ flex: 1, backgroundColor: "#F1F5F9", color: "#475569", fontWeight: 700, fontSize: "0.75rem", padding: "0.65rem", borderRadius: "0.75rem", border: "none", cursor: "pointer" }}
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  alert("Datos guardados con éxito.");
                  setShowEditProfile(false);
                }}
                style={{ flex: 1, backgroundColor: "#1F3652", color: "#FFFFFF", fontWeight: 700, fontSize: "0.75rem", padding: "0.65rem", borderRadius: "0.75rem", border: "none", cursor: "pointer" }}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CHANGE PASSWORD */}
      {showChangePassword && (
        <div style={{
          position: "fixed",
          inset: 0,
          zIndex: 999,
          backgroundColor: "rgba(0,0,0,0.75)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem"
        }}>
          <div style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "1.5rem",
            maxWidth: "420px",
            width: "100%",
            padding: "1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem"
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #F1F5F9", paddingBottom: "0.75rem" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 900, color: "#0F172A", margin: 0 }}>Cambiar Contraseña</h3>
              <button onClick={() => setShowChangePassword(false)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <X size={18} color="#64748B" />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div>
                <label style={{ fontSize: "0.7rem", fontWeight: 700, color: "#64748B" }}>Contraseña Actual</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: "0.6rem", border: "1px solid #CBD5E1", fontSize: "0.75rem", marginTop: "0.25rem", boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "0.7rem", fontWeight: 700, color: "#64748B" }}>Nueva Contraseña</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: "0.6rem", border: "1px solid #CBD5E1", fontSize: "0.75rem", marginTop: "0.25rem", boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "0.7rem", fontWeight: 700, color: "#64748B" }}>Confirmar Nueva Contraseña</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: "0.6rem", border: "1px solid #CBD5E1", fontSize: "0.75rem", marginTop: "0.25rem", boxSizing: "border-box" }}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
              <button
                onClick={() => setShowChangePassword(false)}
                style={{ flex: 1, backgroundColor: "#F1F5F9", color: "#475569", fontWeight: 700, fontSize: "0.75rem", padding: "0.65rem", borderRadius: "0.75rem", border: "none", cursor: "pointer" }}
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  alert("Contraseña actualizada con éxito.");
                  setShowChangePassword(false);
                }}
                style={{ flex: 1, backgroundColor: "#1F3652", color: "#FFFFFF", fontWeight: 700, fontSize: "0.75rem", padding: "0.65rem", borderRadius: "0.75rem", border: "none", cursor: "pointer" }}
              >
                Actualizar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

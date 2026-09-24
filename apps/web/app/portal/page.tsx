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
        title: "Avance 2 - Estructura Nivel 3",
        date: "Sep 01, 26",
        photo: "https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=800&auto=format&fit=crop&q=80",
        description: "Colado de losa en nivel 3 e instalación hidrosanitaria principal concluida.",
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
    <div className="min-h-screen bg-slate-900 text-slate-800 antialiased flex flex-col items-center">
      {/* Top Banner with Account Switcher for testing */}
      <div className="w-full bg-slate-950/80 border-b border-slate-800/60 px-4 py-2 text-xs text-slate-300 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-50 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-medium text-slate-200">Devio Portal Cliente</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400">Ambiente Staging Multidesarrollador</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Probar como:</span>
          <select
            value={selectedUserKey}
            onChange={(e) => setSelectedUserKey(e.target.value)}
            className="bg-slate-800 text-white rounded-lg px-2.5 py-1 text-xs border border-slate-700 outline-none font-medium focus:ring-1 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="jaime">Jaime Pozos (Desarrollos Campero - Mainstreet 5.1)</option>
            <option value="inigo">Iñigo Heredia (Grupo VEQ - Castellana 1C)</option>
            <option value="brandon">Brandon Gonzalez (Desarrollos Campero - Mainstreet 5.3)</option>
          </select>
        </div>
      </div>

      {/* Main Responsive Wrapper */}
      <div className="w-full max-w-7xl px-3 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col gap-6">
        
        {/* Apple Style Floating Header */}
        <header className="w-full bg-gradient-to-r from-[#1B3047] via-[#1F3652] to-[#254266] rounded-3xl p-4 sm:p-6 shadow-xl border border-white/10 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center justify-between md:justify-start gap-4">
            <div className="flex items-center gap-3">
              <img
                src="/brand/logo-horizontal-light.png"
                alt="Devio"
                className="h-8 sm:h-9 w-auto object-contain"
              />
              <span className="hidden sm:inline-block text-xs bg-white/15 px-2.5 py-1 rounded-full text-white/90 font-medium">
                Portal de Propietarios
              </span>
            </div>
            
            {/* Mobile Actions: Notifications & Profile */}
            <div className="flex items-center gap-2 md:hidden">
              <button
                onClick={() => setShowNotifications(true)}
                className="relative p-2.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                title="Notificaciones"
              >
                <Bell size={18} className="text-white" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center border border-[#1F3652]">
                    {unreadCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => { setActiveTab("profile"); setScreen("main"); }}
                className="p-1 rounded-full border border-white/30"
              >
                <img src={currentUser.avatarUrl} alt="Avatar" className="w-7 h-7 rounded-full object-cover" />
              </button>
            </div>
          </div>

          {/* Center Greeting & Property Quick Switcher */}
          <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
            <div className="text-left md:text-right">
              <p className="text-xs text-slate-300 font-medium">Bienvenido de vuelta,</p>
              <p className="text-lg sm:text-xl font-extrabold tracking-tight text-white">{userName}</p>
            </div>

            {/* Desktop Action Buttons */}
            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={() => setShowNotifications(true)}
                className="relative p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 transition-all text-white flex items-center gap-2 text-xs font-semibold"
              >
                <Bell size={16} />
                <span>Avisos</span>
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => { setActiveTab(activeTab === "profile" ? "properties" : "profile"); setScreen("main"); }}
                className={`flex items-center gap-2 px-3 py-2 rounded-2xl text-xs font-semibold transition-all ${
                  activeTab === "profile" ? "bg-white text-[#1F3652]" : "bg-white/10 hover:bg-white/20 text-white"
                }`}
              >
                <img src={currentUser.avatarUrl} alt="Avatar" className="w-5 h-5 rounded-full object-cover" />
                <span>{activeTab === "profile" ? "Ver Propiedades" : "Mi Perfil"}</span>
              </button>

              <button
                onClick={handleLogout}
                className="p-2.5 rounded-2xl bg-white/5 hover:bg-red-500/20 text-slate-300 hover:text-red-300 transition-all"
                title="Cerrar Sesión"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </header>

        {/* Content Tabs (Propiedades vs Perfil) */}
        {activeTab === "properties" ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column / Sidebar (Property Selector & Next Payment Banner) */}
            <div className="lg:col-span-4 flex flex-col gap-5">
              
              {/* Next Payment Card (Apple Wallet Style) */}
              <div className="bg-gradient-to-br from-[#1E293B] via-[#0F172A] to-[#1E293B] rounded-3xl p-5 border border-slate-700/60 shadow-lg text-white">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold tracking-wider uppercase text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20">
                    Tu Próximo Pago
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock size={13} /> {selectedProp.nextPaymentDaysRemaining} días restantes
                  </span>
                </div>
                <p className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-1">
                  {formatMoney(selectedProp.nextPaymentAmount)}
                </p>
                <p className="text-xs text-slate-400 mb-4">
                  Vence el <span className="font-semibold text-slate-200">{selectedProp.nextPaymentDueDate}</span> • {selectedProp.projectName} ({selectedProp.unitNumber})
                </p>
                
                {selectedProp.overdueAmount ? (
                  <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-xl p-2.5 flex items-center justify-between text-xs">
                    <span className="text-red-400 font-medium flex items-center gap-1.5">
                      <AlertCircle size={14} /> Saldo vencido
                    </span>
                    <span className="text-red-400 font-bold">{formatMoney(selectedProp.overdueAmount)}</span>
                  </div>
                ) : null}

                <button
                  onClick={() => { setScreen("statement"); setStatementSubTab("payments"); }}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98]"
                >
                  <CreditCard size={15} />
                  <span>Ver Estado de Cuenta y Pagos</span>
                </button>
              </div>

              {/* Multi-Property Selector List */}
              <div className="bg-white/95 rounded-3xl p-5 border border-slate-200/80 shadow-sm flex flex-col gap-3">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Tus Propiedades ({ALL_PROPERTIES.length})
                  </h3>
                  <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                    Multidesarrolladora
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  {ALL_PROPERTIES.map((prop) => {
                    const isSelected = prop.id === selectedProp.id;
                    return (
                      <div
                        key={prop.id}
                        onClick={() => { setSelectedPropId(prop.id); setSelectedImageIdx(0); }}
                        className={`group relative p-3.5 rounded-2xl cursor-pointer transition-all border flex items-center gap-3.5 ${
                          isSelected
                            ? "bg-[#1F3652] text-white border-[#1F3652] shadow-md"
                            : "bg-slate-50 hover:bg-slate-100/80 text-slate-800 border-slate-200/60"
                        }`}
                      >
                        <img
                          src={prop.images[0]}
                          alt={prop.projectName}
                          className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className={`text-[10px] font-bold uppercase truncate ${isSelected ? "text-slate-300" : "text-slate-500"}`}>
                              {prop.developerName}
                            </span>
                            <span className={`text-[11px] font-extrabold px-1.5 py-0.5 rounded ${
                              isSelected ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                            }`}>
                              {prop.unitNumber}
                            </span>
                          </div>
                          <p className={`text-sm font-bold truncate ${isSelected ? "text-white" : "text-slate-900"}`}>
                            {prop.projectName}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 h-1.5 rounded-full bg-black/10 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${isSelected ? "bg-emerald-400" : "bg-emerald-500"}`}
                                style={{ width: `${prop.constructionPct}%` }}
                              />
                            </div>
                            <span className={`text-[10px] font-bold ${isSelected ? "text-emerald-300" : "text-emerald-600"}`}>
                              {prop.constructionPct}%
                            </span>
                          </div>
                        </div>
                        <ChevronRight size={16} className={`flex-shrink-0 ${isSelected ? "text-white" : "text-slate-400"}`} />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick Sub-Navigation Menu */}
              <div className="bg-white/95 rounded-3xl p-3 border border-slate-200/80 shadow-sm flex flex-col gap-1">
                {[
                  { id: "detail", label: "Detalle de Propiedad", icon: Building },
                  { id: "statement", label: "Estado de Cuenta & Recibos", icon: CreditCard },
                  { id: "construction", label: "Avances de Obra", icon: Wrench },
                  { id: "documents", label: "Documentos Oficiales", icon: FileText },
                ].map((item) => {
                  const isActive = screen === item.id;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setScreen(item.id as any)}
                      className={`flex items-center justify-between p-3 rounded-2xl text-xs font-bold transition-all ${
                        isActive
                          ? "bg-[#1F3652] text-white shadow-sm"
                          : "text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon size={16} className={isActive ? "text-white" : "text-slate-500"} />
                        <span>{item.label}</span>
                      </div>
                      <ChevronRight size={14} className={isActive ? "text-white/60" : "text-slate-400"} />
                    </button>
                  );
                })}
              </div>

            </div>

            {/* Right Column (Dynamic Main Workspace) */}
            <div className="lg:col-span-8 flex flex-col gap-6">

              {/* SCREEN 1: DETALLE DE PROPIEDAD */}
              {screen === "detail" || screen === "main" ? (
                <div className="flex flex-col gap-6">
                  
                  {/* Hero Gallery Card with Apple Style Carousel */}
                  <div className="bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-sm">
                    <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full bg-slate-900 overflow-hidden">
                      <img
                        src={selectedProp.images[selectedImageIdx] || selectedProp.images[0]}
                        alt="Propiedad"
                        className="w-full h-full object-cover transition-all duration-300"
                      />
                      
                      {/* Gradient overlay & badges */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-between p-4 sm:p-6">
                        <div className="flex items-center justify-between">
                          <span className="bg-white/90 backdrop-blur-md text-[#1F3652] font-black text-xs px-3 py-1.5 rounded-full shadow">
                            Unidad {selectedProp.unitNumber} • {selectedProp.unitType}
                          </span>
                          <span className="bg-emerald-500 text-white font-bold text-xs px-3 py-1.5 rounded-full shadow flex items-center gap-1">
                            <CheckCircle2 size={13} /> {selectedProp.constructionPct}% Avance
                          </span>
                        </div>
                        
                        <div>
                          <p className="text-xs font-bold text-amber-300 uppercase tracking-wider">{selectedProp.developerName}</p>
                          <h2 className="text-xl sm:text-2xl font-black text-white">{selectedProp.projectName}</h2>
                          <p className="text-xs text-slate-200 flex items-center gap-1 mt-1">
                            <MapPin size={13} /> {selectedProp.projectAddress}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Thumbnail Switcher */}
                    {selectedProp.images.length > 1 && (
                      <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center gap-2 overflow-x-auto">
                        {selectedProp.images.map((img, idx) => (
                          <button
                            key={idx}
                            onClick={() => setSelectedImageIdx(idx)}
                            className={`relative w-16 h-12 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all ${
                              selectedImageIdx === idx ? "border-[#1F3652] ring-2 ring-indigo-300" : "border-transparent opacity-60 hover:opacity-100"
                            }`}
                          >
                            <img src={img} alt="Thumb" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Financial Quick Glance & Specs */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
                      <p className="text-[11px] font-bold text-slate-400 uppercase">Precio Total</p>
                      <p className="text-base sm:text-lg font-black text-slate-900 mt-0.5">{formatMoney(selectedProp.totalPrice)}</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
                      <p className="text-[11px] font-bold text-emerald-600 uppercase">Total Pagado</p>
                      <p className="text-base sm:text-lg font-black text-emerald-600 mt-0.5">{formatMoney(selectedProp.paidAmount)}</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
                      <p className="text-[11px] font-bold text-amber-600 uppercase">Saldo Pendiente</p>
                      <p className="text-base sm:text-lg font-black text-amber-600 mt-0.5">{formatMoney(selectedProp.pendingAmount)}</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
                      <p className="text-[11px] font-bold text-indigo-600 uppercase">Entrega Estimada</p>
                      <p className="text-base sm:text-lg font-black text-indigo-900 mt-0.5">{selectedProp.estimatedDeliveryDate}</p>
                    </div>
                  </div>

                  {/* Specs & Attributes Card */}
                  <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-extrabold text-slate-900">Especificaciones de la Unidad</h3>
                      <button
                        onClick={() => setUnitInfoExpanded(!unitInfoExpanded)}
                        className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
                      >
                        {unitInfoExpanded ? "Ocultar" : "Mostrar"}
                        {unitInfoExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </div>

                    {unitInfoExpanded && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                        <div className="bg-slate-50 p-3.5 rounded-2xl">
                          <p className="text-xs text-slate-500">Superficie Total</p>
                          <p className="text-sm font-bold text-slate-800 mt-0.5">{selectedProp.areaM2} m²</p>
                        </div>
                        <div className="bg-slate-50 p-3.5 rounded-2xl">
                          <p className="text-xs text-slate-500">Recámaras</p>
                          <p className="text-sm font-bold text-slate-800 mt-0.5">{selectedProp.bedrooms} Rec.</p>
                        </div>
                        <div className="bg-slate-50 p-3.5 rounded-2xl">
                          <p className="text-xs text-slate-500">Baños</p>
                          <p className="text-sm font-bold text-slate-800 mt-0.5">{selectedProp.bathrooms} Baños</p>
                        </div>
                        <div className="bg-slate-50 p-3.5 rounded-2xl">
                          <p className="text-xs text-slate-500">Nivel / Piso</p>
                          <p className="text-sm font-bold text-slate-800 mt-0.5">Piso {selectedProp.floorLevel || 1}</p>
                        </div>
                        <div className="bg-slate-50 p-3.5 rounded-2xl">
                          <p className="text-xs text-slate-500">Estacionamiento</p>
                          <p className="text-sm font-bold text-slate-800 mt-0.5">{selectedProp.parkingSpots || 1} Cajón</p>
                        </div>
                        <div className="bg-slate-50 p-3.5 rounded-2xl">
                          <p className="text-xs text-slate-500">Mantenimiento Sugerido</p>
                          <p className="text-sm font-bold text-slate-800 mt-0.5">{formatMoney(selectedProp.maintenanceFeeMonthly || 0)} /mes</p>
                        </div>

                        {selectedProp.customAttributes.map((attr, i) => (
                          <div key={i} className="bg-slate-50 p-3.5 rounded-2xl col-span-2 sm:col-span-1">
                            <p className="text-xs text-slate-500">{attr.label}</p>
                            <p className="text-sm font-bold text-slate-800 mt-0.5">{attr.value}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              ) : null}

              {/* SCREEN 2: ESTADO DE CUENTA & RESUMEN FINANCIERO */}
              {screen === "statement" && (
                <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm flex flex-col gap-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-black text-slate-900">Estado de Cuenta & Pagos</h2>
                      <p className="text-xs text-slate-500">{selectedProp.projectName} • Unidad {selectedProp.unitNumber}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setStatementSubTab("statement")}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                          statementSubTab === "statement" ? "bg-[#1F3652] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        Resumen General
                      </button>
                      <button
                        onClick={() => setStatementSubTab("payments")}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                          statementSubTab === "payments" ? "bg-[#1F3652] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        Desglose de Cuotas ({selectedProp.payments.length})
                      </button>
                    </div>
                  </div>

                  {statementSubTab === "statement" ? (
                    <div className="flex flex-col gap-5">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
                          <p className="text-xs font-bold text-slate-500">Monto Contratado</p>
                          <p className="text-xl font-black text-slate-900 mt-1">{formatMoney(selectedProp.totalPrice)}</p>
                        </div>
                        <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200/60">
                          <p className="text-xs font-bold text-emerald-700">Monto Liquidado</p>
                          <p className="text-xl font-black text-emerald-700 mt-1">{formatMoney(selectedProp.paidAmount)}</p>
                        </div>
                        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200/60">
                          <p className="text-xs font-bold text-amber-700">Saldo por Liquidar</p>
                          <p className="text-xl font-black text-amber-700 mt-1">{formatMoney(selectedProp.pendingAmount)}</p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60 flex flex-col gap-2">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-slate-600">Progreso de Pago Total</span>
                          <span className="text-emerald-600">
                            {Math.round((selectedProp.paidAmount / selectedProp.totalPrice) * 100)}%
                          </span>
                        </div>
                        <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${(selectedProp.paidAmount / selectedProp.totalPrice) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Installments Table */
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                            <th className="py-3 px-3">#</th>
                            <th className="py-3 px-3">Concepto</th>
                            <th className="py-3 px-3">Monto</th>
                            <th className="py-3 px-3">Fecha Prog.</th>
                            <th className="py-3 px-3">Estado</th>
                            <th className="py-3 px-3 text-right">Recibo Oficial</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                          {selectedProp.payments.map((p) => (
                            <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-3 px-3 font-bold text-slate-900">{p.cuotaNumber}</td>
                              <td className="py-3 px-3 font-semibold text-slate-900">{p.concept}</td>
                              <td className="py-3 px-3 font-bold text-slate-900">{formatMoney(p.amount)}</td>
                              <td className="py-3 px-3 text-slate-500">{p.scheduledDate}</td>
                              <td className="py-3 px-3">
                                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  p.status === "PAGADO"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : p.status === "ATRASADO"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-amber-100 text-amber-800"
                                }`}>
                                  {p.status}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-right">
                                {p.status === "PAGADO" ? (
                                  <button
                                    onClick={() => setShowReceiptPayment(p)}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors"
                                  >
                                    <FileCheck size={13} />
                                    <span>Ver Recibo</span>
                                  </button>
                                ) : (
                                  <span className="text-slate-400 text-xs">—</span>
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

              {/* SCREEN 3: AVANCES DE OBRA */}
              {screen === "construction" && (
                <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm flex flex-col gap-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-black text-slate-900">Avance de Obra en Tiempo Real</h2>
                      <p className="text-xs text-slate-500">Última actualización: {selectedProp.lastProgressUpdateDate}</p>
                    </div>
                    <span className="text-lg font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-xl">
                      {selectedProp.constructionPct}% General
                    </span>
                  </div>

                  {/* Specialties Progress Bars */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedProp.specialtiesProgress.map((esp) => (
                      <div key={esp.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 flex flex-col gap-2">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-slate-800">{esp.name}</span>
                          <span className="text-emerald-600">{esp.percentage}%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${esp.percentage}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Milestones History */}
                  <div className="flex flex-col gap-4 mt-2">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Historial de Reportes Fotográficos</h3>
                    {selectedProp.constructionMilestones.map((m) => (
                      <div key={m.id} className="bg-slate-50 rounded-2xl overflow-hidden border border-slate-200/80 flex flex-col sm:flex-row">
                        <img src={m.photo} alt={m.title} className="w-full sm:w-48 h-40 object-cover" />
                        <div className="p-4 flex flex-col justify-between flex-1">
                          <div>
                            <div className="flex items-center justify-between">
                              <h4 className="font-bold text-slate-900 text-sm">{m.title}</h4>
                              <span className="text-xs text-slate-400 font-medium">{m.date}</span>
                            </div>
                            <p className="text-xs text-slate-600 mt-2 leading-relaxed">{m.description}</p>
                          </div>
                          <span className="text-[11px] font-semibold text-emerald-600 mt-3">Verificado por Supervisión de Obra</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SCREEN 4: DOCUMENTOS OFICIALES */}
              {screen === "documents" && (
                <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm flex flex-col gap-5">
                  <div>
                    <h2 className="text-xl font-black text-slate-900">Documentos de la Propiedad</h2>
                    <p className="text-xs text-slate-500">Contratos, planos y reglamentos autorizados por el desarrollador</p>
                  </div>

                  {/* Search and Filters */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="relative flex-1">
                      <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Buscar por nombre de documento..."
                        value={docSearch}
                        onChange={(e) => setDocSearch(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-medium focus:ring-1 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                      {["TODOS", "CONTRATO", "PLANO", "REGLAMENTO"].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setSelectedDocCategory(cat)}
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors whitespace-nowrap ${
                            selectedDocCategory === cat ? "bg-[#1F3652] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Docs List */}
                  <div className="flex flex-col gap-2.5">
                    {filteredDocs.length > 0 ? (
                      filteredDocs.map((doc) => (
                        <div
                          key={doc.id}
                          className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/60 flex items-center justify-between gap-4 transition-all"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center flex-shrink-0">
                              <FileText size={20} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 truncate">{doc.title}</p>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                {doc.fileSize} • Subido el {doc.uploadDate}
                              </p>
                            </div>
                          </div>
                          <a
                            href={doc.fileUrl || "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
                          >
                            <Download size={14} />
                            <span className="hidden sm:inline">Descargar</span>
                          </a>
                        </div>
                      ))
                    ) : (
                      <p className="text-center py-8 text-xs text-slate-400">No se encontraron documentos en esta categoría.</p>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
        ) : (
          /* TAB 2: PERFIL DE CLIENTE */
          <div className="max-w-2xl mx-auto w-full bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <img src={currentUser.avatarUrl} alt="Avatar" className="w-16 h-16 rounded-full object-cover shadow" />
              <div>
                <h2 className="text-xl font-black text-slate-900">{userName}</h2>
                <p className="text-xs text-slate-500">{currentUser.email}</p>
                <span className="inline-block mt-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md">
                  Propietario Verificado
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-3.5 bg-slate-50 rounded-2xl">
                <p className="text-xs text-slate-400 font-medium">Teléfono</p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">{userPhone}</p>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-2xl">
                <p className="text-xs text-slate-400 font-medium">RFC Fiscal</p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">{userRfc}</p>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-2xl sm:col-span-2">
                <p className="text-xs text-slate-400 font-medium">Domicilio Registrado</p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">{userAddress}</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => setShowEditProfile(true)}
                className="w-full sm:w-auto flex-1 bg-[#1F3652] hover:bg-[#16273B] text-white font-bold text-xs py-3 px-4 rounded-xl transition-all"
              >
                Editar Información
              </button>
              <button
                onClick={() => setShowChangePassword(true)}
                className="w-full sm:w-auto flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-3 px-4 rounded-xl transition-all"
              >
                Cambiar Contraseña
              </button>
            </div>
          </div>
        )}

      </div>

      {/* MODAL: OFFICIAL DEVIO PAYMENT RECEIPT PDF */}
      {showReceiptPayment && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <img src="/brand/logo-horizontal-main.png" alt="Devio" className="h-6 w-auto" />
                <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  RECIBO OFICIAL DIGITAL
                </span>
              </div>
              <button onClick={() => setShowReceiptPayment(null)} className="p-1 rounded-full hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 flex flex-col gap-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Folio:</span>
                <span className="font-bold text-slate-900">{showReceiptPayment.receiptNumber}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Fecha de Pago:</span>
                <span className="font-bold text-slate-900">{showReceiptPayment.paidDate || showReceiptPayment.scheduledDate}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Método de Pago:</span>
                <span className="font-bold text-slate-900">{showReceiptPayment.paymentMethod || "Transferencia SPEI"}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Concepto:</span>
                <span className="font-bold text-slate-900">{showReceiptPayment.concept}</span>
              </div>
              <div className="flex justify-between text-base font-black pt-2 border-t border-slate-200 text-emerald-700">
                <span>Total Pagado:</span>
                <span>{formatMoney(showReceiptPayment.amount)}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 text-center leading-relaxed">
              Este comprobante es generado automáticamente por la Plataforma Devio y cuenta con validez legal y fiscal ante {selectedProp.developerName}.
            </p>

            <button
              onClick={() => {
                alert("Descargando recibo oficial en PDF...");
                setShowReceiptPayment(null);
              }}
              className="w-full bg-[#1F3652] hover:bg-[#16273B] text-white font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow"
            >
              <Download size={15} />
              <span>Descargar PDF Oficial</span>
            </button>
          </div>
        </div>
      )}

      {/* MODAL: NOTIFICACIONES PUSH */}
      {showNotifications && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Bell size={18} className="text-[#1F3652]" /> Avisos y Notificaciones
              </h3>
              <button onClick={() => setShowNotifications(false)} className="p-1 rounded-full hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-3 max-h-80 overflow-y-auto">
              {notifications.map((n) => (
                <div key={n.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{n.title}</span>
                    <span className="text-[10px] text-slate-400">{n.time}</span>
                  </div>
                  <p className="text-xs text-slate-600">{n.body}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowNotifications(false)}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-2.5 rounded-xl mt-2"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* MODAL: EDIT PROFILE */}
      {showEditProfile && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base">Editar Datos Personales</h3>
              <button onClick={() => setShowEditProfile(false)} className="p-1 rounded-full hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-500">Nombre Completo</label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium mt-1 outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500">Teléfono</label>
                <input
                  type="text"
                  value={userPhone}
                  onChange={(e) => setUserPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium mt-1 outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500">RFC</label>
                <input
                  type="text"
                  value={userRfc}
                  onChange={(e) => setUserRfc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium mt-1 outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500">Domicilio</label>
                <input
                  type="text"
                  value={userAddress}
                  onChange={(e) => setUserAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium mt-1 outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => setShowEditProfile(false)}
                className="flex-1 bg-slate-100 text-slate-700 font-bold text-xs py-2.5 rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  alert("Datos guardados con éxito.");
                  setShowEditProfile(false);
                }}
                className="flex-1 bg-[#1F3652] text-white font-bold text-xs py-2.5 rounded-xl"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CAMBIO DE CONTRASEÑA */}
      {showChangePassword && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base">Cambiar Contraseña</h3>
              <button onClick={() => setShowChangePassword(false)} className="p-1 rounded-full hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-500">Contraseña Actual</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium mt-1 outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500">Nueva Contraseña</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium mt-1 outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500">Confirmar Nueva Contraseña</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium mt-1 outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => setShowChangePassword(false)}
                className="flex-1 bg-slate-100 text-slate-700 font-bold text-xs py-2.5 rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  alert("Contraseña actualizada exitosamente.");
                  setShowChangePassword(false);
                }}
                className="flex-1 bg-[#1F3652] text-white font-bold text-xs py-2.5 rounded-xl"
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

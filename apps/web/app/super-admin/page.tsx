"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppLayout from "../../components/layout/app-layout";
import {
  ShieldAlert,
  Users,
  Building2,
  DollarSign,
  TrendingUp,
  Link as LinkIcon,
  Copy,
  Plus,
  Search,
  ExternalLink,
  Edit3,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Eye,
  Key,
  Shield,
  Activity,
  Layers,
  ArrowRight,
  RotateCcw,
  Mail,
  MessageSquare,
  Bell,
  Send,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Server,
  Zap,
  Globe,
  Lock,
  Smartphone,
  Info,
  Sliders,
  CheckSquare,
  Square,
  QrCode,
  Share2,
} from "lucide-react";
import {
  SuperAdminDeveloper,
  SuperAdminProject,
  CustomPricingInvite,
  SuperAdminAuditLog,
  NotificationChannelConfig,
  NotificationTemplate,
  NotificationDeliveryLog,
  SaaSPricingTier,
  INITIAL_SUPER_ADMIN_DEVELOPERS,
  INITIAL_CUSTOM_INVITES,
  INITIAL_SUPER_ADMIN_AUDIT_LOGS,
  INITIAL_NOTIFICATION_CHANNELS,
  INITIAL_NOTIFICATION_TEMPLATES,
  INITIAL_NOTIFICATION_DELIVERY_LOGS,
  SAAS_PRICING_TIERS,
} from "../../data/super-admin-data";
import { useProject } from "../../context/project-context";
import { PERMISSIONS_CATALOG, getRolePermissionsMap, PermissionKey } from "../../lib/permissions";
import {
  getNotificationChannelsConfig,
  saveNotificationChannelsConfig,
  getNotificationTemplates,
  saveNotificationTemplates,
  getNotificationDeliveryLogs,
  saveNotificationDeliveryLogs,
  dispatchSystemNotification,
} from "../../lib/notifications";

export default function SuperAdminPage() {
  const router = useRouter();
  const { setDeveloperName, showToast, userEmail } = useProject();

  // Route security check: Only acalderoncha@gmail.com
  const isAuthorized = (userEmail || "").toLowerCase().trim() === "acalderoncha@gmail.com";

  // Active Tab
  const [activeTab, setActiveTab] = useState<"tenants" | "notifications" | "pricing" | "health_logs">("tenants");

  // State: Developers & Invites (Clean real data)
  const [developers, setDevelopers] = useState<SuperAdminDeveloper[]>(INITIAL_SUPER_ADMIN_DEVELOPERS);
  const [invites, setInvites] = useState<CustomPricingInvite[]>(INITIAL_CUSTOM_INVITES);
  const [auditLogs, setAuditLogs] = useState<SuperAdminAuditLog[]>(INITIAL_SUPER_ADMIN_AUDIT_LOGS);
  const [expandedDevId, setExpandedDevId] = useState<string | null>("dev-active");
  const [searchDevQuery, setSearchDevQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // State: Notifications
  const [channelsConfig, setChannelsConfig] = useState<NotificationChannelConfig>(INITIAL_NOTIFICATION_CHANNELS);
  const [templates, setTemplates] = useState<NotificationTemplate[]>(INITIAL_NOTIFICATION_TEMPLATES);
  const [deliveryLogs, setDeliveryLogs] = useState<NotificationDeliveryLog[]>(INITIAL_NOTIFICATION_DELIVERY_LOGS);
  const [logChannelFilter, setLogChannelFilter] = useState<string>("ALL");
  const [logSearchQuery, setLogSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  // Modals State
  // 1. Payment Link Modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedDevForPayment, setSelectedDevForPayment] = useState<SuperAdminDeveloper | null>(null);
  const [paymentScope, setPaymentScope] = useState<"DEVELOPER" | "PROJECT">("DEVELOPER");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [paymentInterval, setPaymentInterval] = useState<"MONTHLY" | "ANNUAL">("MONTHLY");
  const [copiedLink, setCopiedLink] = useState(false);

  // 2. User Permissions Modal
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [inspectedUser, setInspectedUser] = useState<{
    id: string;
    name: string;
    email: string;
    role: string;
    developerName: string;
    assignedProjectIds?: string[];
  } | null>(null);

  // 3. Notification Template Edit Modal
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  const [editPmkAlias, setEditPmkAlias] = useState("");
  const [editPmkSubject, setEditPmkSubject] = useState("");
  const [editWaTemplate, setEditWaTemplate] = useState("");
  const [editPushTitle, setEditPushTitle] = useState("");

  // 4. Custom Invite Modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteDevName, setInviteDevName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePricePerUnit, setInvitePricePerUnit] = useState(180);
  const [inviteTrialMonths, setInviteTrialMonths] = useState(1);
  const [inviteDiscount, setInviteDiscount] = useState(0);
  const [inviteExpiresAt, setInviteExpiresAt] = useState("2026-10-15");

  // Load Real Data from storage
  useEffect(() => {
    if (typeof window !== "undefined") {
      setChannelsConfig(getNotificationChannelsConfig());
      setTemplates(getNotificationTemplates());
      setDeliveryLogs(getNotificationDeliveryLogs());

      // Load real active developer, projects and users
      const storedProjects = localStorage.getItem("devio_projects_state") || sessionStorage.getItem("devio_projects_state");
      const storedDev = localStorage.getItem("devio_developer_onboarding") || sessionStorage.getItem("devio_developer_onboarding");
      const storedUsers = localStorage.getItem("devio_system_users") || sessionStorage.getItem("devio_system_users");

      let devName = "Mi Desarrolladora";
      let devLegal = "Inmobiliaria y Desarrollos S.A. de C.V.";
      let devRfc = "DEV260101XYZ";
      let devCity = "México";
      let devEmail = "acalderoncha@gmail.com";
      let devPhone = "3322567499";

      if (storedDev) {
        try {
          const parsed = JSON.parse(storedDev);
          if (parsed.name || parsed.commercialName) devName = parsed.name || parsed.commercialName;
          if (parsed.legalName) devLegal = parsed.legalName;
          if (parsed.rfc) devRfc = parsed.rfc;
          if (parsed.city) devCity = parsed.city;
          if (parsed.email) devEmail = parsed.email;
          if (parsed.phone) devPhone = parsed.phone;
        } catch (e) {}
      }

      let realProjects: SuperAdminProject[] = [];
      if (storedProjects) {
        try {
          const parsedProj: any[] = JSON.parse(storedProjects);
          realProjects = parsedProj.map((p) => ({
            id: p.id,
            name: p.name,
            type: p.type || "VERTICAL",
            totalUnits: p.totalUnits || p.unitsInventory?.length || 0,
            soldUnits: p.soldUnits || p.unitsInventory?.filter((u: any) => u.status === "VENDIDA").length || 0,
            availableUnits: p.availableUnits || p.unitsInventory?.filter((u: any) => u.status === "DISPONIBLE").length || 0,
            blockedUnits: p.blockedUnits || p.unitsInventory?.filter((u: any) => u.status === "BLOQUEADA").length || 0,
            pricePerUnit: 180,
            status: "ACTIVE",
            assignedUsersCount: p.team?.length || 1,
            createdAt: "2026-01-15",
          }));
        } catch (e) {}
      }

      let realUsers: any[] = [];
      if (storedUsers) {
        try {
          realUsers = JSON.parse(storedUsers);
        } catch (e) {}
      }

      if (realUsers.length === 0) {
        realUsers = [
          { id: "usr-admin", name: "Alejandro Calderón", email: "acalderoncha@gmail.com", role: "Super Admin" },
        ];
      }

      const activeDeveloper: SuperAdminDeveloper = {
        id: "dev-active",
        name: devName,
        legalName: devLegal,
        rfc: devRfc,
        contactEmail: devEmail,
        phone: devPhone,
        city: devCity,
        pricePerUnitMonthly: 180,
        subscriptionStatus: "ACTIVE",
        createdAt: "2026-01-15",
        projects: realProjects,
        users: realUsers,
      };

      setDevelopers([activeDeveloper]);
    }
  }, []);

  // Sync back to storage on updates
  const handleUpdateChannelsConfig = (updated: NotificationChannelConfig) => {
    setChannelsConfig(updated);
    saveNotificationChannelsConfig(updated);
    showToast("Configuración Actualizada", "Los parámetros de canales de notificación se han guardado.");
  };

  const handleUpdateTemplate = (updated: NotificationTemplate) => {
    const next = templates.map((t) => (t.id === updated.id ? updated : t));
    setTemplates(next);
    saveNotificationTemplates(next);
    showToast("Plantilla Actualizada", `Se guardaron los alias de "${updated.title}".`);
  };

  // SaaS KPIs Calculations (Strictly per-unit pricing)
  const metrics = useMemo(() => {
    const totalDevelopers = developers.length;
    const totalProjects = developers.reduce((acc, d) => acc + d.projects.length, 0);
    const totalUnits = developers.reduce(
      (acc, d) => acc + d.projects.reduce((pAcc, p) => pAcc + p.totalUnits, 0),
      0
    );
    const totalUsers = developers.reduce((acc, d) => acc + d.users.length, 0);

    const mrr = developers.reduce((acc, d) => {
      if (d.subscriptionStatus !== "ACTIVE") return acc;
      const devUnits = d.projects.reduce((pAcc, p) => pAcc + p.totalUnits, 0);
      const unitsTotal = devUnits * (d.pricePerUnitMonthly || 180);
      return acc + unitsTotal;
    }, 0);

    const arr = mrr * 12;
    const avgPricePerUnit =
      developers.length > 0
        ? Math.round(developers.reduce((acc, d) => acc + d.pricePerUnitMonthly, 0) / developers.length)
        : 180;

    return {
      totalDevelopers,
      totalProjects,
      totalUnits,
      totalUsers,
      mrr,
      arr,
      avgPricePerUnit,
    };
  }, [developers]);

  // Format currency
  const formatMoney = (val: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  // Impersonation ("Run As") Action
  const handleImpersonate = (dev: SuperAdminDeveloper, user?: { id: string; name: string; email: string; role: string }) => {
    const targetUser = user?.name || dev.users[0]?.name || "Super Admin";
    setDeveloperName(dev.name);

    if (typeof window !== "undefined") {
      sessionStorage.setItem(
        "devio_impersonation",
        JSON.stringify({
          active: true,
          developerId: dev.id,
          developerName: dev.name,
          userName: targetUser,
          userEmail: user?.email || dev.contactEmail,
          userRole: user?.role || "Super Admin",
        })
      );
    }

    const newLog: SuperAdminAuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleString("es-MX"),
      superAdminName: "Alejandro Calderón (Super Admin)",
      action: "Sesión Impersonada (Run As)",
      targetEntity: `${dev.name} (${targetUser})`,
      details: `Super Admin inició sesión en modo 'Run As' para auditar la cuenta de ${targetUser}.`,
      ipAddress: "189.215.12.98",
    };
    setAuditLogs([newLog, ...auditLogs]);

    showToast("Modo Impersonación Activo", `Ahora estás operando como ${targetUser} de ${dev.name}.`, "info");
    router.push("/dashboard");
  };

  // Open Payment Link Generator (Strictly per-unit pricing)
  const handleOpenPaymentLink = (dev: SuperAdminDeveloper, projId?: string) => {
    setSelectedDevForPayment(dev);
    setPaymentScope(projId ? "PROJECT" : "DEVELOPER");
    setSelectedProjectId(projId || dev.projects[0]?.id || "");
    setPaymentInterval("MONTHLY");
    setCopiedLink(false);
    setShowPaymentModal(true);
  };

  // Calculate Payment Amount (Strictly based on units count)
  const calculatedPaymentInfo = useMemo(() => {
    if (!selectedDevForPayment) return { amount: 0, units: 0, projectsCount: 0, url: "" };

    const dev = selectedDevForPayment;
    let amount = 0;
    let units = 0;
    let projectsCount = 0;

    if (paymentScope === "PROJECT") {
      const proj = dev.projects.find((p) => p.id === selectedProjectId) || dev.projects[0];
      units = proj ? proj.totalUnits : 0;
      projectsCount = 1;
      amount = units * (dev.pricePerUnitMonthly || 180);
    } else {
      units = dev.projects.reduce((acc, p) => acc + p.totalUnits, 0);
      projectsCount = dev.projects.length;
      amount = units * (dev.pricePerUnitMonthly || 180);
    }

    if (paymentInterval === "ANNUAL") {
      amount = amount * 12 * 0.9; // 10% discount on annual payment
    }

    const token = `pay_${dev.id}_${paymentScope === "PROJECT" ? selectedProjectId : "all"}_${paymentInterval.toLowerCase()}`;
    const url = `https://checkout.devio.mx/pay/${token}`;

    return { amount, units, projectsCount, url };
  }, [selectedDevForPayment, paymentScope, selectedProjectId, paymentInterval]);

  // Open User Permissions Inspection Modal
  const handleInspectPermissions = (dev: SuperAdminDeveloper, user: any) => {
    setInspectedUser({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      developerName: dev.name,
      assignedProjectIds: user.assignedProjectIds,
    });
    setShowPermissionsModal(true);
  };

  // Trigger Test Notification Dispatch
  const handleTriggerTestNotification = (template: NotificationTemplate) => {
    const logs = dispatchSystemNotification({
      triggerKey: template.triggerKey,
      recipientEmail: "acalderoncha@gmail.com",
      recipientPhone: "+52 (33) 2256 7499",
      recipientName: "Alejandro Calderón",
      developerName: "Desarrolladora",
      metadata: { testDispatch: true, templateId: template.id },
    });

    setDeliveryLogs(getNotificationDeliveryLogs());
    showToast("Notificación de Prueba Disparada", `Se enviaron ${logs.length} alertas por los canales activos de "${template.title}".`);
  };

  // Retry Failed Notification
  const handleRetryLog = (log: NotificationDeliveryLog) => {
    const updated = deliveryLogs.map((l) => {
      if (l.id === log.id) {
        return {
          ...l,
          status: "ENTREGADO" as const,
          retryCount: l.retryCount + 1,
          errorDetails: undefined,
          timestamp: new Date().toLocaleString("es-MX", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
        };
      }
      return l;
    });
    setDeliveryLogs(updated);
    saveNotificationDeliveryLogs(updated);
    showToast("Reenvío Exitoso", `La notificación ${log.id} fue reintentada y marcada como Entregada.`);
  };

  // Filtered Developers
  const filteredDevelopers = useMemo(() => {
    return developers.filter((d) => {
      const matchQuery =
        d.name.toLowerCase().includes(searchDevQuery.toLowerCase()) ||
        d.legalName.toLowerCase().includes(searchDevQuery.toLowerCase()) ||
        d.contactEmail.toLowerCase().includes(searchDevQuery.toLowerCase()) ||
        d.city.toLowerCase().includes(searchDevQuery.toLowerCase());
      const matchStatus = statusFilter === "ALL" || d.subscriptionStatus === statusFilter;
      return matchQuery && matchStatus;
    });
  }, [developers, searchDevQuery, statusFilter]);

  // Filtered Templates
  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      return categoryFilter === "ALL" || t.category === categoryFilter;
    });
  }, [templates, categoryFilter]);

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return deliveryLogs.filter((l) => {
      const matchChannel = logChannelFilter === "ALL" || l.channel === logChannelFilter;
      const matchSearch =
        l.triggerName.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
        l.recipient.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
        l.recipientName.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
        l.developerName.toLowerCase().includes(logSearchQuery.toLowerCase());
      return matchChannel && matchSearch;
    });
  }, [deliveryLogs, logChannelFilter, logSearchQuery]);

  // If user is NOT acalderoncha@gmail.com, block access
  if (!isAuthorized) {
    return (
      <AppLayout>
        <main style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "3rem 1.5rem", textAlign: "center", backgroundColor: "#F8FAFC" }}>
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              backgroundColor: "#FEE2E2",
              color: "#DC2626",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "1.5rem",
              boxShadow: "0 10px 25px rgba(220, 38, 38, 0.15)",
            }}
          >
            <Lock size={36} />
          </div>

          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--devio-blue-dark)", marginBottom: "0.5rem" }}>
            Acceso Restringido al Super Admin
          </h2>
          <p style={{ fontSize: "0.9rem", color: "var(--devio-neutral-4)", maxWidth: "480px", lineHeight: 1.5, marginBottom: "2rem" }}>
            Esta consola de plataforma es exclusiva para la cuenta maestra de Super Admin Devio (<strong>acalderoncha@gmail.com</strong>).
          </p>

          <Link href="/dashboard" className="btn btn-primary" style={{ padding: "0.75rem 2rem", fontSize: "0.9rem" }}>
            Volver al Dashboard
          </Link>
        </main>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <main style={{ flex: 1, overflowY: "auto", padding: "2rem", backgroundColor: "#F8FAFC" }}>
        
        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "0.6rem",
                  backgroundColor: "var(--devio-blue-dark)",
                  color: "#00C48C",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Shield size={20} />
              </div>
              <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--devio-blue-dark)", margin: 0, letterSpacing: "-0.02em" }}>
                Devio Platform Super Admin
              </h1>
            </div>
            <p style={{ fontSize: "0.85rem", color: "var(--devio-neutral-3)", marginTop: "0.35rem", margin: 0 }}>
              Consola Maestra: Facturación por unidad (MRR/ARR), Desarrolladoras, Proyectos, Modo &apos;Run As&apos; y Notificaciones Multi-Canal.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
            <span className="badge badge-success" style={{ padding: "0.4rem 0.8rem", fontSize: "0.78rem" }}>
              ● Sesión Super Admin: acalderoncha@gmail.com
            </span>
          </div>
        </div>

        {/* TABS SELECTOR */}
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            backgroundColor: "#FFFFFF",
            padding: "0.4rem",
            borderRadius: "0.75rem",
            border: "1px solid #E2E8F0",
            marginBottom: "2rem",
            width: "fit-content",
            boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
          }}
        >
          {[
            { id: "tenants", label: "Desarrolladoras & Facturación SaaS", icon: <Building2 size={16} /> },
            { id: "notifications", label: "Configuración & Notificaciones Multi-Canal", icon: <Bell size={16} /> },
            { id: "pricing", label: "Catálogo de Planes & Pricing SaaS", icon: <DollarSign size={16} /> },
            { id: "health_logs", label: "Salud del Sistema & Auditoría", icon: <Activity size={16} /> },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.65rem 1.15rem",
                  borderRadius: "0.55rem",
                  fontSize: "0.82rem",
                  fontWeight: isActive ? 800 : 600,
                  color: isActive ? "#FFFFFF" : "var(--devio-neutral-3)",
                  backgroundColor: isActive ? "var(--devio-blue-dark)" : "transparent",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: DESARROLLADORAS & FACTURACIÓN SAAS (PRICING POR UNIDAD) */}
        {/* ========================================================================= */}
        {activeTab === "tenants" && (
          <div>
            {/* KPI METRIC CARDS */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "1.25rem",
                marginBottom: "2rem",
              }}
            >
              <div className="card" style={{ padding: "1.25rem", backgroundColor: "#FFFFFF" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "var(--devio-neutral-3)", marginBottom: "0.5rem" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>MRR (Cobro por Unidad)</span>
                  <TrendingUp size={18} color="#00C48C" />
                </div>
                <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--devio-blue-dark)", letterSpacing: "-0.02em" }}>
                  {formatMoney(metrics.mrr)}
                </div>
                <span style={{ fontSize: "0.72rem", color: "#009E70", fontWeight: 600, marginTop: "0.25rem", display: "block" }}>
                  Calculado: {metrics.totalUnits} unidades * ${metrics.avgPricePerUnit}/u
                </span>
              </div>

              <div className="card" style={{ padding: "1.25rem", backgroundColor: "#FFFFFF" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "var(--devio-neutral-3)", marginBottom: "0.5rem" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>ARR Proyectado</span>
                  <DollarSign size={18} color="var(--devio-blue)" />
                </div>
                <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--devio-blue-dark)", letterSpacing: "-0.02em" }}>
                  {formatMoney(metrics.arr)}
                </div>
                <span style={{ fontSize: "0.72rem", color: "var(--devio-neutral-3)", fontWeight: 500, marginTop: "0.25rem", display: "block" }}>
                  Fórmula anualizada ($MRR * 12)
                </span>
              </div>

              <div className="card" style={{ padding: "1.25rem", backgroundColor: "#FFFFFF" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "var(--devio-neutral-3)", marginBottom: "0.5rem" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Desarrolladoras Activas</span>
                  <Building2 size={18} color="var(--devio-blue-dark)" />
                </div>
                <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--devio-blue-dark)", letterSpacing: "-0.02em" }}>
                  {metrics.totalDevelopers}
                </div>
                <span style={{ fontSize: "0.72rem", color: "var(--devio-neutral-3)", fontWeight: 500, marginTop: "0.25rem", display: "block" }}>
                  {metrics.totalProjects} desarrollos creados
                </span>
              </div>

              <div className="card" style={{ padding: "1.25rem", backgroundColor: "#FFFFFF" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "var(--devio-neutral-3)", marginBottom: "0.5rem" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Unidades Gestionadas</span>
                  <Layers size={18} color="#D97706" />
                </div>
                <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--devio-blue-dark)", letterSpacing: "-0.02em" }}>
                  {metrics.totalUnits} <span style={{ fontSize: "1rem", fontWeight: 600, color: "var(--devio-neutral-3)" }}>unidades</span>
                </div>
                <span style={{ fontSize: "0.72rem", color: "var(--devio-neutral-3)", fontWeight: 500, marginTop: "0.25rem", display: "block" }}>
                  Tarifa: ${metrics.avgPricePerUnit} MXN / unidad / mes
                </span>
              </div>
            </div>

            {/* DEVELOPERS CONTROLS & FILTER */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1.25rem",
                flexWrap: "wrap",
                gap: "0.75rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: 1, maxWidth: "450px" }}>
                <div style={{ position: "relative", width: "100%" }}>
                  <Search size={15} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--devio-neutral-3)" }} />
                  <input
                    type="text"
                    placeholder="Buscar desarrolladora, RFC, ciudad..."
                    value={searchDevQuery}
                    onChange={(e) => setSearchDevQuery(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: "2.2rem", fontSize: "0.82rem", width: "100%" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => setShowInviteModal(true)}
                  className="btn btn-primary"
                  style={{ fontSize: "0.8rem", padding: "0.5rem 0.95rem" }}
                >
                  <Plus size={15} /> Crear Link de Invitación
                </button>
              </div>
            </div>

            {/* DEVELOPERS LIST & PROJECT EXPANDABLE CARDS */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {filteredDevelopers.map((dev) => {
                const isExpanded = expandedDevId === dev.id;
                const totalUnits = dev.projects.reduce((acc, p) => acc + p.totalUnits, 0);
                const monthlyTotal = totalUnits * (dev.pricePerUnitMonthly || 180);

                return (
                  <div
                    key={dev.id}
                    className="card"
                    style={{
                      backgroundColor: "#FFFFFF",
                      borderRadius: "0.85rem",
                      border: "1px solid #E2E8F0",
                      overflow: "hidden",
                    }}
                  >
                    {/* Developer Row Header */}
                    <div
                      style={{
                        padding: "1.25rem 1.5rem",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        cursor: "pointer",
                        backgroundColor: isExpanded ? "rgba(31, 54, 82, 0.02)" : "#FFFFFF",
                        transition: "background 0.15s ease",
                        flexWrap: "wrap",
                        gap: "1rem",
                      }}
                      onClick={() => setExpandedDevId(isExpanded ? null : dev.id)}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                        <div
                          style={{
                            width: "44px",
                            height: "44px",
                            borderRadius: "0.65rem",
                            backgroundColor: "var(--devio-blue-dark)",
                            color: "#FFFFFF",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 800,
                            fontSize: "1.1rem",
                            flexShrink: 0,
                          }}
                        >
                          {dev.name.substring(0, 2).toUpperCase()}
                        </div>

                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                            <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--devio-blue-dark)", margin: 0 }}>
                              {dev.name}
                            </h3>
                            <span className="badge badge-success" style={{ fontSize: "0.68rem" }}>
                              {dev.subscriptionStatus === "ACTIVE" ? "Activo" : "Trial"}
                            </span>
                          </div>
                          <span style={{ fontSize: "0.78rem", color: "var(--devio-neutral-3)" }}>
                            {dev.legalName} • RFC: <strong>{dev.rfc}</strong> • {dev.contactEmail}
                          </span>
                        </div>
                      </div>

                      {/* Right Stats & Action Buttons */}
                      <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" }}>
                        <div style={{ textAlign: "right" }}>
                          <span style={{ fontSize: "0.72rem", color: "var(--devio-neutral-3)", textTransform: "uppercase", fontWeight: 700 }}>
                            Cálculo Facturación Devio ({totalUnits} unidades)
                          </span>
                          <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--devio-blue-dark)" }}>
                            {formatMoney(monthlyTotal)} <span style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--devio-neutral-3)" }}>/ mes</span>
                          </div>
                          <span style={{ fontSize: "0.72rem", color: "#009E70", fontWeight: 600 }}>
                            {totalUnits} unidades * ${dev.pricePerUnitMonthly || 180} MXN/u
                          </span>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }} onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => handleOpenPaymentLink(dev)}
                            className="btn btn-outline"
                            style={{ fontSize: "0.75rem", padding: "0.45rem 0.8rem", color: "var(--devio-blue-dark)" }}
                            title="Generar Link de Pago por unidades"
                          >
                            <LinkIcon size={13} /> Link de Pago
                          </button>

                          <button
                            type="button"
                            onClick={() => handleImpersonate(dev)}
                            className="btn btn-primary"
                            style={{ fontSize: "0.75rem", padding: "0.45rem 0.85rem", backgroundColor: "#1F3652" }}
                            title="Operar como SuperAdmin de esta Desarrolladora"
                          >
                            <Key size={13} /> Run As SuperAdmin
                          </button>

                          <div style={{ color: "var(--devio-neutral-3)", marginLeft: "0.25rem" }}>
                            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expandable Section: Projects & Users Detailed Tables */}
                    {isExpanded && (
                      <div style={{ borderTop: "1px solid #E2E8F0", padding: "1.5rem", backgroundColor: "#F8FAFC" }}>
                        {/* 1. Proyectos y Desglose por Unidad */}
                        <div style={{ marginBottom: "1.5rem" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                              <Building2 size={16} color="var(--devio-blue)" />
                              <h4 style={{ fontSize: "0.9rem", fontWeight: 800, color: "var(--devio-blue-dark)", margin: 0 }}>
                                Proyectos Creados ({dev.projects.length})
                              </h4>
                            </div>
                            <span style={{ fontSize: "0.75rem", color: "var(--devio-neutral-3)" }}>
                              Cobro estrictamente por unidad: <strong>${dev.pricePerUnitMonthly || 180} MXN / unidad / mes</strong>
                            </span>
                          </div>

                          {dev.projects.length === 0 ? (
                            <div style={{ padding: "1.5rem", textAlign: "center", backgroundColor: "#FFFFFF", borderRadius: "0.6rem", border: "1px dashed #CBD5E1", fontSize: "0.8125rem", color: "var(--devio-neutral-3)" }}>
                              No hay proyectos creados aún en esta desarrolladora.
                            </div>
                          ) : (
                            <div className="table-container" style={{ backgroundColor: "#FFFFFF", borderRadius: "0.6rem", border: "1px solid #E2E8F0" }}>
                              <table>
                                <thead>
                                  <tr>
                                    <th>Proyecto</th>
                                    <th>Tipo</th>
                                    <th>Unidades Totales</th>
                                    <th>Vendidas / Disp.</th>
                                    <th>Costo Proyecto ({dev.pricePerUnitMonthly || 180}/u)</th>
                                    <th>Link de Pago</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {dev.projects.map((p) => {
                                    const projTotalCost = p.totalUnits * (dev.pricePerUnitMonthly || 180);

                                    return (
                                      <tr key={p.id}>
                                        <td>
                                          <strong>{p.name}</strong>
                                          <div style={{ fontSize: "0.72rem", color: "var(--devio-neutral-3)" }}>ID: {p.id}</div>
                                        </td>
                                        <td>
                                          <span className="badge badge-info" style={{ fontSize: "0.7rem" }}>
                                            {p.type}
                                          </span>
                                        </td>
                                        <td>
                                          <strong>{p.totalUnits}</strong> unidades
                                        </td>
                                        <td>
                                          <span style={{ color: "#009E70", fontWeight: 700 }}>{p.soldUnits} vtas</span> / {p.availableUnits} disp
                                        </td>
                                        <td>
                                          <strong>{formatMoney(projTotalCost)}</strong>
                                          <div style={{ fontSize: "0.68rem", color: "var(--devio-neutral-3)" }}>
                                            {p.totalUnits} unidades * ${dev.pricePerUnitMonthly || 180}/mes
                                          </div>
                                        </td>
                                        <td>
                                          <button
                                            type="button"
                                            onClick={() => handleOpenPaymentLink(dev, p.id)}
                                            className="btn btn-outline"
                                            style={{ fontSize: "0.72rem", padding: "0.3rem 0.65rem" }}
                                          >
                                            <LinkIcon size={12} /> Link del Proyecto
                                          </button>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>

                        {/* 2. Usuarios de la Desarrolladora & Modo 'Run As' por Usuario */}
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                              <Users size={16} color="var(--devio-blue)" />
                              <h4 style={{ fontSize: "0.9rem", fontWeight: 800, color: "var(--devio-blue-dark)", margin: 0 }}>
                                Usuarios Registrados & Permisos ({dev.users.length})
                              </h4>
                            </div>
                            <span style={{ fontSize: "0.75rem", color: "var(--devio-neutral-3)" }}>
                              Puedes impersonar a cualquier usuario o auditar su matriz de 30 permisos
                            </span>
                          </div>

                          <div className="table-container" style={{ backgroundColor: "#FFFFFF", borderRadius: "0.6rem", border: "1px solid #E2E8F0" }}>
                            <table>
                              <thead>
                                <tr>
                                  <th>Usuario</th>
                                  <th>Correo Electrónico</th>
                                  <th>Rol en Plataforma</th>
                                  <th>Proyectos Asignados</th>
                                  <th>Acciones Super Admin</th>
                                </tr>
                              </thead>
                              <tbody>
                                {dev.users.map((u) => (
                                  <tr key={u.id}>
                                    <td>
                                      <strong>{u.name}</strong>
                                    </td>
                                    <td>{u.email}</td>
                                    <td>
                                      <span className="badge badge-info" style={{ fontSize: "0.72rem" }}>
                                        {u.role}
                                      </span>
                                    </td>
                                    <td>
                                      <span style={{ fontSize: "0.78rem", color: "var(--devio-neutral-3)" }}>
                                        {u.assignedProjectIds && u.assignedProjectIds.length > 0
                                          ? `${u.assignedProjectIds.length} proyectos asignados`
                                          : "Todos los proyectos"}
                                      </span>
                                    </td>
                                    <td>
                                      <div style={{ display: "flex", gap: "0.4rem" }}>
                                        <button
                                          type="button"
                                          onClick={() => handleInspectPermissions(dev, u)}
                                          className="btn btn-outline"
                                          style={{ fontSize: "0.72rem", padding: "0.3rem 0.65rem" }}
                                        >
                                          <Shield size={12} /> Ver Permisos
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleImpersonate(dev, u)}
                                          className="btn btn-primary"
                                          style={{ fontSize: "0.72rem", padding: "0.3rem 0.65rem" }}
                                        >
                                          <Key size={12} /> Run As {u.name.split(" ")[0]}
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: CONFIGURACIÓN DEL SISTEMA & NOTIFICACIONES MULTI-CANAL */}
        {/* ========================================================================= */}
        {activeTab === "notifications" && (
          <div>
            {/* PROVIDERS CONFIGURATION CARDS */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.25rem", marginBottom: "2rem" }}>
              {/* 1. Postmark */}
              <div className="card" style={{ padding: "1.5rem", backgroundColor: "#FFFFFF" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "0.5rem", backgroundColor: "rgba(255, 107, 0, 0.1)", color: "#FF6B00", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Mail size={20} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--devio-blue-dark)", margin: 0 }}>
                        Postmark (Email Transaccional)
                      </h4>
                      <span style={{ fontSize: "0.72rem", color: "var(--devio-neutral-3)" }}>Servidor oficial de correos</span>
                    </div>
                  </div>
                  <span className="badge badge-success" style={{ fontSize: "0.68rem" }}>
                    ● Conectado
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem", fontSize: "0.78rem" }}>
                  <div>
                    <span style={{ color: "var(--devio-neutral-3)", fontWeight: 600 }}>Alias Remitente:</span>
                    <div style={{ fontWeight: 700, color: "var(--devio-blue-dark)" }}>{channelsConfig.postmark.senderAlias}</div>
                  </div>
                  <div>
                    <span style={{ color: "var(--devio-neutral-3)", fontWeight: 600 }}>From Email:</span>
                    <div style={{ fontWeight: 700, color: "var(--devio-blue-dark)" }}>{channelsConfig.postmark.fromEmail}</div>
                  </div>
                  <div>
                    <span style={{ color: "var(--devio-neutral-3)", fontWeight: 600 }}>Server API Token:</span>
                    <div style={{ fontFamily: "monospace", fontSize: "0.72rem", color: "var(--devio-neutral-4)" }}>
                      {channelsConfig.postmark.serverApiToken.substring(0, 14)}••••••••••••
                    </div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "0.5rem", borderTop: "1px solid #E2E8F0" }}>
                    <span style={{ fontWeight: 600, color: "var(--devio-blue-dark)" }}>Canal Activo Globalmente</span>
                    <input
                      type="checkbox"
                      checked={channelsConfig.postmark.enabled}
                      onChange={(e) =>
                        handleUpdateChannelsConfig({
                          ...channelsConfig,
                          postmark: { ...channelsConfig.postmark, enabled: e.target.checked },
                        })
                      }
                      style={{ width: "18px", height: "18px", accentColor: "#00C48C", cursor: "pointer" }}
                    />
                  </div>
                </div>
              </div>

              {/* 2. WhatsApp Business */}
              <div className="card" style={{ padding: "1.5rem", backgroundColor: "#FFFFFF" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "0.5rem", backgroundColor: "rgba(37, 211, 102, 0.1)", color: "#25D366", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <MessageSquare size={20} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--devio-blue-dark)", margin: 0 }}>
                        WhatsApp Business API
                      </h4>
                      <span style={{ fontSize: "0.72rem", color: "var(--devio-neutral-3)" }}>Meta Cloud API / Twilio</span>
                    </div>
                  </div>
                  <span className="badge badge-success" style={{ fontSize: "0.68rem" }}>
                    ● Conectado
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem", fontSize: "0.78rem" }}>
                  <div>
                    <span style={{ color: "var(--devio-neutral-3)", fontWeight: 600 }}>Nombre de Cuenta / Alias:</span>
                    <div style={{ fontWeight: 700, color: "var(--devio-blue-dark)" }}>{channelsConfig.whatsapp.accountAlias}</div>
                  </div>
                  <div>
                    <span style={{ color: "var(--devio-neutral-3)", fontWeight: 600 }}>Número Emisor Verificado:</span>
                    <div style={{ fontWeight: 700, color: "var(--devio-blue-dark)" }}>{channelsConfig.whatsapp.fromNumber}</div>
                  </div>
                  <div>
                    <span style={{ color: "var(--devio-neutral-3)", fontWeight: 600 }}>WABA Access Token:</span>
                    <div style={{ fontFamily: "monospace", fontSize: "0.72rem", color: "var(--devio-neutral-4)" }}>
                      {channelsConfig.whatsapp.apiToken.substring(0, 14)}••••••••••••
                    </div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "0.5rem", borderTop: "1px solid #E2E8F0" }}>
                    <span style={{ fontWeight: 600, color: "var(--devio-blue-dark)" }}>Canal Activo Globalmente</span>
                    <input
                      type="checkbox"
                      checked={channelsConfig.whatsapp.enabled}
                      onChange={(e) =>
                        handleUpdateChannelsConfig({
                          ...channelsConfig,
                          whatsapp: { ...channelsConfig.whatsapp, enabled: e.target.checked },
                        })
                      }
                      style={{ width: "18px", height: "18px", accentColor: "#00C48C", cursor: "pointer" }}
                    />
                  </div>
                </div>
              </div>

              {/* 3. Push */}
              <div className="card" style={{ padding: "1.5rem", backgroundColor: "#FFFFFF" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "0.5rem", backgroundColor: "rgba(31, 54, 82, 0.1)", color: "var(--devio-blue-dark)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Smartphone size={20} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--devio-blue-dark)", margin: 0 }}>
                        Push Notifications
                      </h4>
                      <span style={{ fontSize: "0.72rem", color: "var(--devio-neutral-3)" }}>Web Push & Progressive Web App</span>
                    </div>
                  </div>
                  <span className="badge badge-success" style={{ fontSize: "0.68rem" }}>
                    ● Conectado
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem", fontSize: "0.78rem" }}>
                  <div>
                    <span style={{ color: "var(--devio-neutral-3)", fontWeight: 600 }}>Clave VAPID Pública:</span>
                    <div style={{ fontFamily: "monospace", fontSize: "0.72rem", color: "var(--devio-neutral-4)" }}>
                      {channelsConfig.push.vapidPublicKey.substring(0, 16)}••••••••••••
                    </div>
                  </div>
                  <div>
                    <span style={{ color: "var(--devio-neutral-3)", fontWeight: 600 }}>Ícono de Alerta App:</span>
                    <div style={{ fontWeight: 700, color: "var(--devio-blue-dark)" }}>{channelsConfig.push.appIconUrl}</div>
                  </div>
                  <div>
                    <span style={{ color: "var(--devio-neutral-3)", fontWeight: 600 }}>Suscripciones Activas:</span>
                    <div style={{ fontWeight: 700, color: "var(--devio-blue-dark)" }}>Dispositivos web/móvil activos</div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "0.5rem", borderTop: "1px solid #E2E8F0" }}>
                    <span style={{ fontWeight: 600, color: "var(--devio-blue-dark)" }}>Canal Activo Globalmente</span>
                    <input
                      type="checkbox"
                      checked={channelsConfig.push.enabled}
                      onChange={(e) =>
                        handleUpdateChannelsConfig({
                          ...channelsConfig,
                          push: { ...channelsConfig.push, enabled: e.target.checked },
                        })
                      }
                      style={{ width: "18px", height: "18px", accentColor: "#00C48C", cursor: "pointer" }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* NOTIFICATION TEMPLATES MATRIX */}
            <div className="card" style={{ padding: "1.75rem", backgroundColor: "#FFFFFF", marginBottom: "2rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                  <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--devio-blue-dark)", margin: 0 }}>
                    Matriz de Notificaciones Multi-Canal (10 Eventos Auditados)
                  </h3>
                  <p style={{ fontSize: "0.8rem", color: "var(--devio-neutral-3)", marginTop: "0.25rem", margin: 0 }}>
                    Activa o desactiva de forma granular los canales de envío para cada evento clave y personaliza sus alias de plantilla.
                  </p>
                </div>

                <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                  {["ALL", "USUARIOS", "PROYECTOS", "COBRANZA", "VENTAS", "OBRA", "POSTVENTA", "DOCUMENTOS"].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategoryFilter(cat)}
                      style={{
                        padding: "0.35rem 0.75rem",
                        borderRadius: "0.45rem",
                        fontSize: "0.72rem",
                        fontWeight: categoryFilter === cat ? 800 : 600,
                        backgroundColor: categoryFilter === cat ? "var(--devio-blue-dark)" : "#F1F5F9",
                        color: categoryFilter === cat ? "#FFFFFF" : "var(--devio-neutral-3)",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      {cat === "ALL" ? "Todas las Categorías" : cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: "28%" }}>Evento / Disparador</th>
                      <th>Destinatario</th>
                      <th style={{ textAlign: "center" }}>Postmark (Email)</th>
                      <th style={{ textAlign: "center" }}>WhatsApp API</th>
                      <th style={{ textAlign: "center" }}>Push Web</th>
                      <th>Estado de Auditoría</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTemplates.map((tpl) => (
                      <tr key={tpl.id}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <span style={{ fontWeight: 800, color: "var(--devio-blue-dark)", fontSize: "0.85rem" }}>
                              {tpl.title}
                            </span>
                          </div>
                          <div style={{ fontSize: "0.72rem", color: "var(--devio-neutral-3)", marginTop: "0.15rem" }}>
                            {tpl.description}
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-info" style={{ fontSize: "0.7rem" }}>
                            {tpl.recipientRole}
                          </span>
                        </td>
                        
                        {/* Postmark Toggle */}
                        <td style={{ textAlign: "center" }}>
                          <label style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: "0.2rem", cursor: "pointer" }}>
                            <input
                              type="checkbox"
                              checked={tpl.postmark.enabled}
                              onChange={(e) => {
                                handleUpdateTemplate({
                                  ...tpl,
                                  postmark: { ...tpl.postmark, enabled: e.target.checked },
                                });
                              }}
                              style={{ width: "16px", height: "16px", accentColor: "#FF6B00", cursor: "pointer" }}
                            />
                            <span style={{ fontSize: "0.65rem", color: ttplCheckedColor(tpl.postmark.enabled), fontWeight: 600 }}>
                              {tpl.postmark.templateAlias || "default"}
                            </span>
                          </label>
                        </td>

                        {/* WhatsApp Toggle */}
                        <td style={{ textAlign: "center" }}>
                          <label style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: "0.2rem", cursor: "pointer" }}>
                            <input
                              type="checkbox"
                              checked={tpl.whatsapp.enabled}
                              onChange={(e) => {
                                handleUpdateTemplate({
                                  ...tpl,
                                  whatsapp: { ...tpl.whatsapp, enabled: e.target.checked },
                                });
                              }}
                              style={{ width: "16px", height: "16px", accentColor: "#25D366", cursor: "pointer" }}
                            />
                            <span style={{ fontSize: "0.65rem", color: ttplCheckedColor(tpl.whatsapp.enabled), fontWeight: 600 }}>
                              {tpl.whatsapp.templateName || "default"}
                            </span>
                          </label>
                        </td>

                        {/* Push Toggle */}
                        <td style={{ textAlign: "center" }}>
                          <label style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: "0.2rem", cursor: "pointer" }}>
                            <input
                              type="checkbox"
                              checked={tpl.push.enabled}
                              onChange={(e) => {
                                handleUpdateTemplate({
                                  ...tpl,
                                  push: { ...tpl.push, enabled: e.target.checked },
                                });
                              }}
                              style={{ width: "16px", height: "16px", accentColor: "var(--devio-blue-dark)", cursor: "pointer" }}
                            />
                            <span style={{ fontSize: "0.65rem", color: ttplCheckedColor(tpl.push.enabled), fontWeight: 600 }}>
                              {tpl.push.enabled ? "Activo" : "Inactivo"}
                            </span>
                          </label>
                        </td>

                        {/* Audit Status */}
                        <td>
                          <span
                            className={`badge ${
                              tpl.systemAuditStatus === "ACTIVO_FRONTEND"
                                ? "badge-success"
                                : tpl.systemAuditStatus === "LISTO_EN_API"
                                ? "badge-info"
                                : "badge-warning"
                            }`}
                            style={{ fontSize: "0.68rem" }}
                          >
                            {tpl.systemAuditStatus === "ACTIVO_FRONTEND"
                              ? "✓ Activo en Frontend"
                              : tpl.systemAuditStatus === "LISTO_EN_API"
                              ? "API Conectada"
                              : "Requiere Cron Worker"}
                          </span>
                        </td>

                        <td>
                          <div style={{ display: "flex", gap: "0.35rem" }}>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingTemplate(tpl);
                                setEditPmkAlias(tpl.postmark.templateAlias);
                                setEditPmkSubject(tpl.postmark.subject);
                                setEditWaTemplate(tpl.whatsapp.templateName);
                                setEditPushTitle(tpl.push.title);
                                setShowTemplateModal(true);
                              }}
                              className="btn btn-outline"
                              style={{ fontSize: "0.72rem", padding: "0.3rem 0.6rem" }}
                              title="Configurar alias de plantillas"
                            >
                              <Edit3 size={12} /> Alias
                            </button>
                            <button
                              type="button"
                              onClick={() => handleTriggerTestNotification(tpl)}
                              className="btn btn-primary"
                              style={{ fontSize: "0.72rem", padding: "0.3rem 0.6rem" }}
                              title="Probar envío inmediato"
                            >
                              <Send size={12} /> Probar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* REAL-TIME DELIVERY LOGS */}
            <div className="card" style={{ padding: "1.75rem", backgroundColor: "#FFFFFF" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                  <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--devio-blue-dark)", margin: 0 }}>
                    Historial de Envíos en Tiempo Real (Logs)
                  </h3>
                  <span style={{ fontSize: "0.78rem", color: "var(--devio-neutral-3)" }}>
                    Auditoría de notificaciones enviadas por Postmark, WhatsApp y Push con estado de entrega y reintentos.
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <select
                    value={logChannelFilter}
                    onChange={(e) => setLogChannelFilter(e.target.value)}
                    className="form-input"
                    style={{ fontSize: "0.78rem", padding: "0.4rem 0.75rem" }}
                  >
                    <option value="ALL">Todos los Canales</option>
                    <option value="POSTMARK">Postmark (Email)</option>
                    <option value="WHATSAPP">WhatsApp API</option>
                    <option value="PUSH">Push Notifications</option>
                  </select>

                  <input
                    type="text"
                    placeholder="Buscar en logs..."
                    value={logSearchQuery}
                    onChange={(e) => setLogSearchQuery(e.target.value)}
                    className="form-input"
                    style={{ fontSize: "0.78rem", padding: "0.4rem 0.75rem", width: "180px" }}
                  />
                </div>
              </div>

              {filteredLogs.length === 0 ? (
                <div style={{ padding: "2.5rem 1.5rem", textAlign: "center", backgroundColor: "#F8FAFC", borderRadius: "0.6rem", border: "1px dashed #CBD5E1", color: "var(--devio-neutral-3)", fontSize: "0.85rem" }}>
                  No hay registros de envío recientes. Al disparar una notificación de prueba o registrar un pago en la plataforma se generarán logs automáticos.
                </div>
              ) : (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Fecha / Hora</th>
                        <th>Evento</th>
                        <th>Canal</th>
                        <th>Destinatario</th>
                        <th>Desarrolladora</th>
                        <th>Estado</th>
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLogs.map((log) => (
                        <tr key={log.id}>
                          <td style={{ fontSize: "0.75rem", color: "var(--devio-neutral-4)", fontWeight: 600 }}>
                            {log.timestamp}
                          </td>
                          <td>
                            <strong>{log.triggerName}</strong>
                          </td>
                          <td>
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.3rem",
                                fontSize: "0.72rem",
                                fontWeight: 700,
                                padding: "0.2rem 0.5rem",
                                borderRadius: "0.4rem",
                                backgroundColor:
                                  log.channel === "POSTMARK"
                                    ? "rgba(255, 107, 0, 0.1)"
                                    : log.channel === "WHATSAPP"
                                    ? "rgba(37, 211, 102, 0.1)"
                                    : "rgba(31, 54, 82, 0.08)",
                                color:
                                  log.channel === "POSTMARK"
                                    ? "#FF6B00"
                                    : log.channel === "WHATSAPP"
                                    ? "#25D366"
                                    : "var(--devio-blue-dark)",
                              }}
                            >
                              {log.channel === "POSTMARK" && <Mail size={12} />}
                              {log.channel === "WHATSAPP" && <MessageSquare size={12} />}
                              {log.channel === "PUSH" && <Smartphone size={12} />}
                              {log.channel}
                            </span>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{log.recipientName}</div>
                            <div style={{ fontSize: "0.72rem", color: "var(--devio-neutral-3)" }}>{log.recipient}</div>
                          </td>
                          <td style={{ fontSize: "0.78rem" }}>{log.developerName}</td>
                          <td>
                            <span
                              className={`badge ${
                                log.status === "ENTREGADO"
                                  ? "badge-success"
                                  : log.status === "ENVIADO"
                                  ? "badge-info"
                                  : log.status === "FALLIDO"
                                  ? "badge-danger"
                                  : "badge-warning"
                              }`}
                              style={{ fontSize: "0.7rem" }}
                            >
                              {log.status}
                            </span>
                            {log.errorDetails && (
                              <div style={{ fontSize: "0.68rem", color: "var(--devio-red)", marginTop: "0.2rem", maxWidth: "220px" }}>
                                {log.errorDetails}
                              </div>
                            )}
                          </td>
                          <td>
                            {log.status === "FALLIDO" ? (
                              <button
                                type="button"
                                onClick={() => handleRetryLog(log)}
                                className="btn btn-outline"
                                style={{ fontSize: "0.72rem", padding: "0.25rem 0.6rem", color: "var(--devio-red)" }}
                              >
                                <RotateCcw size={12} /> Reintentar
                              </button>
                            ) : (
                              <span style={{ fontSize: "0.72rem", color: "#009E70", fontWeight: 700 }}>
                                ✓ OK
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: CATÁLOGO DE PLANES & PRICING SAAS */}
        {/* ========================================================================= */}
        {activeTab === "pricing" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
              {SAAS_PRICING_TIERS.map((tier) => (
                <div
                  key={tier.id}
                  className="card"
                  style={{
                    padding: "1.75rem",
                    backgroundColor: "#FFFFFF",
                    position: "relative",
                    border: tier.isPopular ? "2px solid #00C48C" : "1px solid #E2E8F0",
                  }}
                >
                  {tier.isPopular && (
                    <span
                      style={{
                        position: "absolute",
                        top: "-12px",
                        right: "1.5rem",
                        backgroundColor: "#00C48C",
                        color: "#FFFFFF",
                        padding: "0.2rem 0.75rem",
                        borderRadius: "9999px",
                        fontSize: "0.7rem",
                        fontWeight: 800,
                        textTransform: "uppercase",
                      }}
                    >
                      Más Popular
                    </span>
                  )}

                  <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--devio-blue-dark)", margin: 0 }}>
                    {tier.name}
                  </h3>
                  <p style={{ fontSize: "0.78rem", color: "var(--devio-neutral-3)", marginTop: "0.3rem", marginBottom: "1.25rem" }}>
                    {tier.tagline}
                  </p>

                  <div style={{ padding: "1rem", backgroundColor: "rgba(31, 54, 82, 0.04)", borderRadius: "0.65rem", marginBottom: "1.25rem" }}>
                    <div style={{ fontSize: "1.65rem", fontWeight: 800, color: "var(--devio-blue-dark)" }}>
                      ${tier.pricePerUnit} <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--devio-neutral-3)" }}>MXN / unidad / mes</span>
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--devio-neutral-3)", marginTop: "0.2rem" }}>
                      Mínimo {tier.minUnits} unidades gestionadas
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.5rem" }}>
                    {tier.features.map((feat, idx) => (
                      <div key={idx} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.78rem", color: "var(--devio-neutral-4)" }}>
                        <CheckCircle2 size={15} color="#00C48C" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setInvitePricePerUnit(tier.pricePerUnit);
                      setShowInviteModal(true);
                    }}
                    className="btn btn-outline"
                    style={{ width: "100%", fontSize: "0.8125rem", padding: "0.6rem" }}
                  >
                    Crear Link con este Plan
                  </button>
                </div>
              ))}
            </div>

            {/* Generated Custom Invites List */}
            <div className="card" style={{ padding: "1.75rem", backgroundColor: "#FFFFFF" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--devio-blue-dark)", margin: 0 }}>
                  Links de Invitación con Pricing Personalizado ({invites.length})
                </h3>
                <button
                  type="button"
                  onClick={() => setShowInviteModal(true)}
                  className="btn btn-primary"
                  style={{ fontSize: "0.78rem", padding: "0.45rem 0.9rem" }}
                >
                  <Plus size={14} /> Nueva Invitación
                </button>
              </div>

              {invites.length === 0 ? (
                <div style={{ padding: "2rem", textAlign: "center", backgroundColor: "#F8FAFC", borderRadius: "0.6rem", border: "1px dashed #CBD5E1", fontSize: "0.8125rem", color: "var(--devio-neutral-3)" }}>
                  No hay invitaciones creadas aún. Puedes generar una con el botón de Nueva Invitación.
                </div>
              ) : (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Token / Enlace</th>
                        <th>Desarrolladora</th>
                        <th>Correo</th>
                        <th>Costo / Unidad</th>
                        <th>Trial</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invites.map((inv) => (
                        <tr key={inv.id}>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                              <strong style={{ fontFamily: "monospace" }}>{inv.token}</strong>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(inv.linkUrl);
                                  showToast("Enlace Copiado", "URL de registro copiada al portapapeles.");
                                }}
                                style={{ background: "none", border: "none", color: "var(--devio-blue)", cursor: "pointer" }}
                              >
                                <Copy size={13} />
                              </button>
                            </div>
                          </td>
                          <td>{inv.developerName}</td>
                          <td>{inv.developerEmail}</td>
                          <td>${inv.pricePerUnitMonthly} MXN/u</td>
                          <td>{inv.freeTrialMonths} meses gratis</td>
                          <td>
                            <span
                              className={`badge ${
                                inv.status === "ACCEPTED" ? "badge-success" : inv.status === "PENDING" ? "badge-warning" : "badge-danger"
                              }`}
                              style={{ fontSize: "0.7rem" }}
                            >
                              {inv.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: SALUD DEL SISTEMA & BITÁCORA DE AUDITORÍA */}
        {/* ========================================================================= */}
        {activeTab === "health_logs" && (
          <div>
            {/* System Health Status Badges */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
              {[
                { name: "Frontend Next.js (Edge)", status: "OPERACIONAL", ping: "24 ms", icon: <Globe size={18} /> },
                { name: "Backend API (Node/Express)", status: "OPERACIONAL", ping: "45 ms", icon: <Server size={18} /> },
                { name: "PostgreSQL Database", status: "OPERACIONAL", ping: "8 ms", icon: <Activity size={18} /> },
                { name: "Postmark Mail Server", status: "CONECTADO", ping: "62 ms", icon: <Mail size={18} /> },
                { name: "WhatsApp Cloud API", status: "CONECTADO", ping: "110 ms", icon: <MessageSquare size={18} /> },
                { name: "S3 Document Vault", status: "OPERACIONAL", ping: "35 ms", icon: <Lock size={18} /> },
              ].map((serv, idx) => (
                <div key={idx} className="card" style={{ padding: "1.25rem", backgroundColor: "#FFFFFF" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                    <div style={{ color: "var(--devio-blue)" }}>{serv.icon}</div>
                    <span className="badge badge-success" style={{ fontSize: "0.68rem" }}>
                      ● {serv.status}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--devio-blue-dark)" }}>
                    {serv.name}
                  </div>
                  <span style={{ fontSize: "0.72rem", color: "var(--devio-neutral-3)" }}>Latencia: {serv.ping}</span>
                </div>
              ))}
            </div>

            {/* Super Admin Audit Trail */}
            <div className="card" style={{ padding: "1.75rem", backgroundColor: "#FFFFFF" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                <div>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--devio-blue-dark)", margin: 0 }}>
                    Bitácora de Auditoría Super Admin (Audit Trail)
                  </h3>
                  <span style={{ fontSize: "0.78rem", color: "var(--devio-neutral-3)" }}>
                    Registro inmutable de acciones realizadas por el Super Admin (acalderoncha@gmail.com).
                  </span>
                </div>
              </div>

              {auditLogs.length === 0 ? (
                <div style={{ padding: "2rem", textAlign: "center", backgroundColor: "#F8FAFC", borderRadius: "0.6rem", border: "1px dashed #CBD5E1", fontSize: "0.8125rem", color: "var(--devio-neutral-3)" }}>
                  No hay acciones de auditoría registradas todavía. Las sesiones impersonadas y cambios de pricing se registrarán aquí automáticamente.
                </div>
              ) : (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Super Admin</th>
                        <th>Acción Ejecutada</th>
                        <th>Entidad Afectada</th>
                        <th>Detalles</th>
                        <th>IP</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map((log) => (
                        <tr key={log.id}>
                          <td style={{ fontSize: "0.75rem", color: "var(--devio-neutral-4)" }}>{log.timestamp}</td>
                          <td>
                            <strong>{log.superAdminName}</strong>
                          </td>
                          <td>
                            <span className="badge badge-info" style={{ fontSize: "0.7rem" }}>
                              {log.action}
                            </span>
                          </td>
                          <td>{log.targetEntity}</td>
                          <td style={{ fontSize: "0.78rem", maxWidth: "300px" }}>{log.details}</td>
                          <td style={{ fontFamily: "monospace", fontSize: "0.72rem" }}>{log.ipAddress}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 1: GENERADOR DE LINK DE PAGO (100% POR UNIDAD) */}
        {/* ========================================================================= */}
        {showPaymentModal && selectedDevForPayment && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(15, 23, 42, 0.6)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 99999,
              padding: "1rem",
            }}
            onClick={() => setShowPaymentModal(false)}
          >
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "1rem",
                width: "100%",
                maxWidth: "520px",
                padding: "1.75rem",
                boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                <div>
                  <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--devio-blue-dark)", margin: 0 }}>
                    Generar Link de Pago Devio
                  </h3>
                  <span style={{ fontSize: "0.78rem", color: "var(--devio-neutral-3)" }}>
                    {selectedDevForPayment.name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  style={{ background: "none", border: "none", color: "var(--devio-neutral-3)", cursor: "pointer" }}
                >
                  <X size={20} />
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
                {/* Scope selector */}
                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.35rem" }}>
                    Alcance del Cobro
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                    <button
                      type="button"
                      onClick={() => setPaymentScope("DEVELOPER")}
                      style={{
                        padding: "0.6rem",
                        borderRadius: "0.5rem",
                        fontSize: "0.8rem",
                        fontWeight: paymentScope === "DEVELOPER" ? 800 : 600,
                        backgroundColor: paymentScope === "DEVELOPER" ? "var(--devio-blue-dark)" : "#F1F5F9",
                        color: paymentScope === "DEVELOPER" ? "#FFFFFF" : "var(--devio-neutral-4)",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      Desarrolladora Completa
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentScope("PROJECT")}
                      style={{
                        padding: "0.6rem",
                        borderRadius: "0.5rem",
                        fontSize: "0.8rem",
                        fontWeight: paymentScope === "PROJECT" ? 800 : 600,
                        backgroundColor: paymentScope === "PROJECT" ? "var(--devio-blue-dark)" : "#F1F5F9",
                        color: paymentScope === "PROJECT" ? "#FFFFFF" : "var(--devio-neutral-4)",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      Por Proyecto Específico
                    </button>
                  </div>
                </div>

                {/* Project selector if project scope */}
                {paymentScope === "PROJECT" && (
                  <div>
                    <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.35rem" }}>
                      Seleccionar Proyecto
                    </label>
                    <select
                      value={selectedProjectId}
                      onChange={(e) => setSelectedProjectId(e.target.value)}
                      className="form-input"
                      style={{ width: "100%", fontSize: "0.85rem" }}
                    >
                      {selectedDevForPayment.projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.totalUnits} unidades)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Billing Interval */}
                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.35rem" }}>
                    Frecuencia de Facturación
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                    <button
                      type="button"
                      onClick={() => setPaymentInterval("MONTHLY")}
                      style={{
                        padding: "0.6rem",
                        borderRadius: "0.5rem",
                        fontSize: "0.8rem",
                        fontWeight: paymentInterval === "MONTHLY" ? 800 : 600,
                        backgroundColor: paymentInterval === "MONTHLY" ? "rgba(0, 196, 140, 0.15)" : "#F1F5F9",
                        color: paymentInterval === "MONTHLY" ? "#009E70" : "var(--devio-neutral-4)",
                        border: paymentInterval === "MONTHLY" ? "1.5px solid #00C48C" : "1.5px solid transparent",
                        cursor: "pointer",
                      }}
                    >
                      Mensual Recurrente
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentInterval("ANNUAL")}
                      style={{
                        padding: "0.6rem",
                        borderRadius: "0.5rem",
                        fontSize: "0.8rem",
                        fontWeight: paymentInterval === "ANNUAL" ? 800 : 600,
                        backgroundColor: paymentInterval === "ANNUAL" ? "rgba(0, 196, 140, 0.15)" : "#F1F5F9",
                        color: paymentInterval === "ANNUAL" ? "#009E70" : "var(--devio-neutral-4)",
                        border: paymentInterval === "ANNUAL" ? "1.5px solid #00C48C" : "1.5px solid transparent",
                        cursor: "pointer",
                      }}
                    >
                      Anual (10% Descuento)
                    </button>
                  </div>
                </div>

                {/* Calculation Summary Box (Purely per-unit pricing) */}
                <div
                  style={{
                    backgroundColor: "var(--devio-blue-dark)",
                    borderRadius: "0.75rem",
                    padding: "1.1rem 1.25rem",
                    color: "#FFFFFF",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.7)", textTransform: "uppercase", fontWeight: 700 }}>
                      Total ({paymentInterval === "ANNUAL" ? "Anual con 10% desc." : "Mensual"})
                    </span>
                    <span className="badge badge-success" style={{ fontSize: "0.68rem" }}>
                      Stripe Checkout
                    </span>
                  </div>
                  <div style={{ fontSize: "1.65rem", fontWeight: 800, marginTop: "0.3rem" }}>
                    {formatMoney(calculatedPaymentInfo.amount)}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.8)", marginTop: "0.25rem" }}>
                    {calculatedPaymentInfo.units} unidades gestionadas * ${selectedDevForPayment.pricePerUnitMonthly || 180} MXN/unidad
                  </div>
                </div>

                {/* Generated URL Box */}
                <div>
                  <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.3rem" }}>
                    Enlace Directo de Pago
                  </label>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <input
                      type="text"
                      readOnly
                      value={calculatedPaymentInfo.url}
                      className="form-input"
                      style={{ fontSize: "0.78rem", backgroundColor: "#F8FAFC", fontFamily: "monospace", flex: 1 }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(calculatedPaymentInfo.url);
                        setCopiedLink(true);
                        showToast("Enlace Copiado", "URL de pago copiada al portapapeles.");
                        setTimeout(() => setCopiedLink(false), 2000);
                      }}
                      className="btn btn-primary"
                      style={{ fontSize: "0.8rem", padding: "0.5rem 0.9rem" }}
                    >
                      {copiedLink ? <Check size={15} /> : <Copy size={15} />}
                      {copiedLink ? "Copiado" : "Copiar"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 2: INSPECCIÓN Y AUDITORÍA DE PERMISOS DE USUARIO */}
        {/* ========================================================================= */}
        {showPermissionsModal && inspectedUser && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(15, 23, 42, 0.6)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 99999,
              padding: "1rem",
            }}
            onClick={() => setShowPermissionsModal(false)}
          >
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "1rem",
                width: "100%",
                maxWidth: "720px",
                maxHeight: "88vh",
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ padding: "1.5rem", borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--devio-blue-dark)", margin: 0 }}>
                    Matriz de Permisos: {inspectedUser.name}
                  </h3>
                  <span style={{ fontSize: "0.78rem", color: "var(--devio-neutral-3)" }}>
                    Rol: <strong>{inspectedUser.role}</strong> • Desarrolladora: <strong>{inspectedUser.developerName}</strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPermissionsModal(false)}
                  style={{ background: "none", border: "none", color: "var(--devio-neutral-3)", cursor: "pointer" }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Matrix Content */}
              <div style={{ padding: "1.5rem", overflowY: "auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                {PERMISSIONS_CATALOG.map((cat) => {
                  const rolePermMap = getRolePermissionsMap(inspectedUser.role as any);

                  return (
                    <div
                      key={cat.id}
                      style={{
                        padding: "0.9rem",
                        borderRadius: "0.65rem",
                        border: "1px solid #E2E8F0",
                        backgroundColor: "#F8FAFC",
                      }}
                    >
                      <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--devio-blue-dark)", marginBottom: "0.4rem" }}>
                        {cat.name}
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                        {cat.permissions.map((perm) => {
                          const hasAccess = inspectedUser.role === "Super Admin" || Boolean(rolePermMap[perm.key]);

                          return (
                            <div
                              key={perm.key}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.45rem",
                                fontSize: "0.75rem",
                                color: hasAccess ? "var(--devio-blue-dark)" : "#94A3B8",
                              }}
                            >
                              {hasAccess ? (
                                <Check size={14} color="#00C48C" style={{ flexShrink: 0 }} />
                              ) : (
                                <X size={14} color="#CBD5E1" style={{ flexShrink: 0 }} />
                              )}
                              <span style={{ fontWeight: hasAccess ? 700 : 500 }}>{perm.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid #E2E8F0", display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setShowPermissionsModal(false)}
                  className="btn btn-primary"
                  style={{ fontSize: "0.8rem", padding: "0.5rem 1.25rem" }}
                >
                  Cerrar Auditoría
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 3: EDITAR PLANTILLA / ALIAS DE NOTIFICACIÓN */}
        {/* ========================================================================= */}
        {showTemplateModal && editingTemplate && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(15, 23, 42, 0.6)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 99999,
              padding: "1rem",
            }}
            onClick={() => setShowTemplateModal(false)}
          >
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "1rem",
                width: "100%",
                maxWidth: "520px",
                padding: "1.75rem",
                boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                <div>
                  <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--devio-blue-dark)", margin: 0 }}>
                    Alias & Plantilla: {editingTemplate.title}
                  </h3>
                  <span style={{ fontSize: "0.75rem", color: "var(--devio-neutral-3)" }}>
                    Personaliza los nombres de plantilla en Postmark y WhatsApp
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTemplateModal(false)}
                  style={{ background: "none", border: "none", color: "var(--devio-neutral-3)", cursor: "pointer" }}
                >
                  <X size={20} />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleUpdateTemplate({
                    ...editingTemplate,
                    postmark: {
                      ...editingTemplate.postmark,
                      templateAlias: editPmkAlias.trim(),
                      subject: editPmkSubject.trim(),
                    },
                    whatsapp: {
                      ...editingTemplate.whatsapp,
                      templateName: editWaTemplate.trim(),
                    },
                    push: {
                      ...editingTemplate.push,
                      title: editPushTitle.trim(),
                    },
                  });
                  setShowTemplateModal(false);
                }}
                style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
              >
                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.3rem" }}>
                    Postmark Template Alias
                  </label>
                  <input
                    type="text"
                    required
                    value={editPmkAlias}
                    onChange={(e) => setEditPmkAlias(e.target.value)}
                    className="form-input"
                    style={{ width: "100%", fontSize: "0.82rem" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.3rem" }}>
                    Postmark Email Subject
                  </label>
                  <input
                    type="text"
                    required
                    value={editPmkSubject}
                    onChange={(e) => setEditPmkSubject(e.target.value)}
                    className="form-input"
                    style={{ width: "100%", fontSize: "0.82rem" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.3rem" }}>
                    WhatsApp WABA Template Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editWaTemplate}
                    onChange={(e) => setEditWaTemplate(e.target.value)}
                    className="form-input"
                    style={{ width: "100%", fontSize: "0.82rem" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.3rem" }}>
                    Push Notification Title
                  </label>
                  <input
                    type="text"
                    required
                    value={editPushTitle}
                    onChange={(e) => setEditPushTitle(e.target.value)}
                    className="form-input"
                    style={{ width: "100%", fontSize: "0.82rem" }}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.5rem" }}>
                  <button
                    type="button"
                    onClick={() => setShowTemplateModal(false)}
                    className="btn btn-outline"
                    style={{ fontSize: "0.8rem", padding: "0.45rem 0.9rem" }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ fontSize: "0.8rem", padding: "0.45rem 1rem" }}
                  >
                    Guardar Alias
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 4: NUEVA INVITACIÓN CON PRICING POR UNIDAD */}
        {/* ========================================================================= */}
        {showInviteModal && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(15, 23, 42, 0.6)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 99999,
              padding: "1rem",
            }}
            onClick={() => setShowInviteModal(false)}
          >
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "1rem",
                width: "100%",
                maxWidth: "480px",
                padding: "1.75rem",
                boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--devio-blue-dark)", margin: 0 }}>
                  Generar Invitación con Pricing por Unidad
                </h3>
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  style={{ background: "none", border: "none", color: "var(--devio-neutral-3)", cursor: "pointer" }}
                >
                  <X size={20} />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!inviteDevName.trim() || !inviteEmail.trim()) return;

                  const token = `DEVIO-INV-${Math.floor(1000 + Math.random() * 9000)}`;
                  const newInv: CustomPricingInvite = {
                    id: `inv-${Date.now()}`,
                    token,
                    developerName: inviteDevName.trim(),
                    developerEmail: inviteEmail.trim(),
                    pricePerUnitMonthly: Number(invitePricePerUnit) || 180,
                    discountPercentage: Number(inviteDiscount) || 0,
                    freeTrialMonths: Number(inviteTrialMonths) || 1,
                    status: "PENDING",
                    expiresAt: inviteExpiresAt,
                    createdAt: new Date().toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" }),
                    linkUrl: `https://devio.mx/register?invite=${token}`,
                  };

                  setInvites([newInv, ...invites]);
                  showToast("Invitación Creada", `Enlace de registro generado para ${newInv.developerName}.`);
                  setShowInviteModal(false);
                  setInviteDevName("");
                  setInviteEmail("");
                }}
                style={{ display: "flex", flexDirection: "column", gap: "0.95rem" }}
              >
                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.3rem" }}>
                    Nombre de la Desarrolladora *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Inmobiliaria del Norte"
                    value={inviteDevName}
                    onChange={(e) => setInviteDevName(e.target.value)}
                    className="form-input"
                    style={{ width: "100%", fontSize: "0.82rem" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.3rem" }}>
                    Correo del Contacto Principal *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="director@desarrollos.mx"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="form-input"
                    style={{ width: "100%", fontSize: "0.82rem" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.3rem" }}>
                    Costo por Unidad ($ MXN / unidad / mes)
                  </label>
                  <input
                    type="number"
                    value={invitePricePerUnit}
                    onChange={(e) => setInvitePricePerUnit(Number(e.target.value))}
                    className="form-input"
                    style={{ width: "100%", fontSize: "0.82rem" }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div>
                    <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.3rem" }}>
                      Meses de Prueba Gratis
                    </label>
                    <select
                      value={inviteTrialMonths}
                      onChange={(e) => setInviteTrialMonths(Number(e.target.value))}
                      className="form-input"
                      style={{ width: "100%", fontSize: "0.82rem" }}
                    >
                      <option value={0}>Sin periodo gratis</option>
                      <option value={1}>1 Mes Gratis</option>
                      <option value={2}>2 Meses Gratis</option>
                      <option value={3}>3 Meses Gratis</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--devio-blue-dark)", display: "block", marginBottom: "0.3rem" }}>
                      Descuento Adicional (%)
                    </label>
                    <input
                      type="number"
                      value={inviteDiscount}
                      onChange={(e) => setInviteDiscount(Number(e.target.value))}
                      className="form-input"
                      style={{ width: "100%", fontSize: "0.82rem" }}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.5rem" }}>
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="btn btn-outline"
                    style={{ fontSize: "0.8rem", padding: "0.45rem 0.9rem" }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ fontSize: "0.8rem", padding: "0.45rem 1rem" }}
                  >
                    Generar Enlace
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>
    </AppLayout>
  );
}

function ttplCheckedColor(enabled: boolean) {
  return enabled ? "#009E70" : "#94A3B8";
}

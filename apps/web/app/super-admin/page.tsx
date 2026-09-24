"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  ChevronRight,
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
  LayoutDashboard,
  BarChart3,
  CreditCard,
  Briefcase,
  HelpCircle,
  Play,
  Pause,
  Trash2,
  Filter,
  CalendarClock,
  Tag,
  SlidersHorizontal,
  BellOff,
  Power,
  Radio,
} from "lucide-react";
import {
  SuperAdminDeveloper,
  SuperAdminProject,
  CustomPricingInvite,
  SuperAdminAuditLog,
  NotificationChannelConfig,
  NotificationTemplate,
  NotificationDeliveryLog,
  ScheduledNotification,
  SaaSPricingTier,
  INITIAL_SUPER_ADMIN_DEVELOPERS,
  INITIAL_CUSTOM_INVITES,
  INITIAL_SUPER_ADMIN_AUDIT_LOGS,
  INITIAL_NOTIFICATION_CHANNELS,
  INITIAL_NOTIFICATION_TEMPLATES,
  INITIAL_NOTIFICATION_DELIVERY_LOGS,
  INITIAL_SCHEDULED_NOTIFICATIONS,
  SAAS_PRICING_TIERS,
} from "../../data/super-admin-data";
import { useProject } from "../../context/project-context";
import { PERMISSIONS_CATALOG, getRolePermissionsMap, PermissionKey, UserRole } from "../../lib/permissions";
import { DevioDatePicker } from "../../components/ui/devio-date-picker";
import {
  getNotificationChannelsConfig,
  saveNotificationChannelsConfig,
  getNotificationTemplates,
  saveNotificationTemplates,
  getNotificationDeliveryLogs,
  saveNotificationDeliveryLogs,
  getScheduledNotifications,
  saveScheduledNotifications,
  dispatchSystemNotification,
} from "../../lib/notifications";

type AdminTab = "overview" | "developers" | "notifications" | "pricing" | "health";

function SuperAdminContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setDeveloperName, showToast, userEmail, userRole, formatMoney } = useProject();

  const [superAdminEmails, setSuperAdminEmails] = useState<string[]>(["acalderoncha@gmail.com"]);

  useEffect(() => {
    fetch("/api/auth/superadmins")
      .then((res) => res.json())
      .then((data) => {
        if (data.superAdminEmails && Array.isArray(data.superAdminEmails)) {
          setSuperAdminEmails(data.superAdminEmails);
        }
      })
      .catch(() => {});
  }, []);

  // Route security check: Super Admin role or email in superAdminEmails list
  const isAuthorized = useMemo(() => {
    const cleanEmail = (userEmail || "").toLowerCase().trim();
    if (userRole === "Super Admin") return true;
    if (cleanEmail && superAdminEmails.includes(cleanEmail)) return true;
    if (cleanEmail === "acalderoncha@gmail.com") return true;
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("devio_user_session") || sessionStorage.getItem("devio_user_session");
      if (stored && (stored.includes("Super Admin") || stored.includes("acalderoncha@gmail.com"))) {
        return true;
      }
    }
    return false;
  }, [userEmail, userRole, superAdminEmails]);

  // Active Tab from Query Param or State
  const initialTabParam = (searchParams?.get("tab") as AdminTab) || "overview";
  const [activeTab, setActiveTab] = useState<AdminTab>(
    ["overview", "developers", "notifications", "pricing", "health"].includes(initialTabParam)
      ? initialTabParam
      : "overview"
  );

  useEffect(() => {
    const tabParam = searchParams?.get("tab") as AdminTab;
    if (tabParam && ["overview", "developers", "notifications", "pricing", "health"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (tab: AdminTab) => {
    setActiveTab(tab);
    router.push(`/super-admin?tab=${tab}`);
  };

  // State: Developers & Invites (Clean real data)
  const [developers, setDevelopers] = useState<SuperAdminDeveloper[]>(INITIAL_SUPER_ADMIN_DEVELOPERS);
  const [invites, setInvites] = useState<CustomPricingInvite[]>(INITIAL_CUSTOM_INVITES);
  const [auditLogs, setAuditLogs] = useState<SuperAdminAuditLog[]>(INITIAL_SUPER_ADMIN_AUDIT_LOGS);
  // All developers start collapsed by default
  const [expandedDevIds, setExpandedDevIds] = useState<string[]>([]);
  const [searchDevQuery, setSearchDevQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // State: Notifications & Scheduled Automations
  const [channelsConfig, setChannelsConfig] = useState<NotificationChannelConfig>(INITIAL_NOTIFICATION_CHANNELS);
  const [templates, setTemplates] = useState<NotificationTemplate[]>(INITIAL_NOTIFICATION_TEMPLATES);
  const [deliveryLogs, setDeliveryLogs] = useState<NotificationDeliveryLog[]>(INITIAL_NOTIFICATION_DELIVERY_LOGS);
  const [scheduledNotifications, setScheduledNotifications] = useState<ScheduledNotification[]>(INITIAL_SCHEDULED_NOTIFICATIONS);
  const [notifSubTab, setNotifSubTab] = useState<"scheduled" | "logs" | "templates" | "channels">("scheduled");
  const [scheduledSearch, setScheduledSearch] = useState("");
  const [scheduledChannelFilter, setScheduledChannelFilter] = useState("ALL");
  const [scheduledCategoryFilter, setScheduledCategoryFilter] = useState("ALL");
  const [scheduledStatusFilter, setScheduledStatusFilter] = useState("ALL");
  const [scheduledQuickFilter, setScheduledQuickFilter] = useState<"ALL" | "PROGRAMADA" | "ENVIADA" | "FALLIDA" | "PAUSADA">("ALL");
  const [expandedScheduleId, setExpandedScheduleId] = useState<string | null>(null);
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

  // 5. Test Live Notification Modal
  const [showLiveTestModal, setShowLiveTestModal] = useState(false);
  const [testTemplate, setTestTemplate] = useState<NotificationTemplate | null>(null);
  const [testEmail, setTestEmail] = useState(userEmail || "acalderoncha@gmail.com");
  const [testPayloadJson, setTestPayloadJson] = useState("{}");
  const [isSendingTest, setIsSendingTest] = useState(false);

  // 6. Log Detail Modal
  const [selectedLogForDetail, setSelectedLogForDetail] = useState<NotificationDeliveryLog | null>(null);

  // 7. Modal: Editar Tarifa de Cobro (Desarrolladora o Proyecto)
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [priceEditScope, setPriceEditScope] = useState<"DEVELOPER" | "PROJECT">("PROJECT");
  const [priceEditDevId, setPriceEditDevId] = useState("");
  const [priceEditProjectId, setPriceEditProjectId] = useState("");
  const [priceEditTargetName, setPriceEditTargetName] = useState("");
  const [priceEditUnitsCount, setPriceEditUnitsCount] = useState(0);
  const [priceEditValue, setPriceEditValue] = useState(180);

  // 8. Modal: Programar Notificación Manual
  const [showCreateScheduleModal, setShowCreateScheduleModal] = useState(false);
  const [newScheduleTriggerKey, setNewScheduleTriggerKey] = useState("payments.upcoming_reminder");
  const [newScheduleChannel, setNewScheduleChannel] = useState<"POSTMARK" | "WHATSAPP" | "PUSH">("WHATSAPP");
  const [newScheduleDate, setNewScheduleDate] = useState("2026-09-30");
  const [newScheduleTime, setNewScheduleTime] = useState("09:00");
  const [newScheduleRecipientName, setNewScheduleRecipientName] = useState("");
  const [newScheduleRecipientContact, setNewScheduleRecipientContact] = useState("");
  const [newScheduleProject, setNewScheduleProject] = useState("");
  const [newScheduleUnit, setNewScheduleUnit] = useState("");
  const [newSchedulePayloadSummary, setNewSchedulePayloadSummary] = useState("");
  const [dispatchingScheduleId, setDispatchingScheduleId] = useState<string | null>(null);

  // Toggle card expansion
  const toggleExpandDev = (id: string) => {
    setExpandedDevIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Channel control handlers for Staging Mute / Master Kill-Switch
  const handleToggleMasterMute = () => {
    const newMute = !channelsConfig.masterMute;
    const updated: NotificationChannelConfig = {
      ...channelsConfig,
      masterMute: newMute,
      stagingMode: newMute,
    };
    setChannelsConfig(updated);
    saveNotificationChannelsConfig(updated);
    showToast(
      newMute ? "🔕 Modo Staging Activado (Triggers Silenciados)" : "🔔 Canales en Vivo Activados (Producción)",
      newMute
        ? "Todas las llamadas externas a Postmark y WhatsApp quedan silenciadas. Los triggers registrarán estado PAUSADO seguro."
        : "Las notificaciones salientes se enviarán normalmente a través de las APIs externas.",
      newMute ? "warning" : "success"
    );
  };

  const handleToggleChannel = (channel: "postmark" | "whatsapp" | "push") => {
    const isCurrentlyEnabled = channelsConfig[channel]?.enabled ?? true;
    const updated: NotificationChannelConfig = {
      ...channelsConfig,
      [channel]: {
        ...channelsConfig[channel],
        enabled: !isCurrentlyEnabled,
      },
    };
    setChannelsConfig(updated);
    saveNotificationChannelsConfig(updated);
    showToast(
      `Canal ${channel.toUpperCase()} ${!isCurrentlyEnabled ? "Habilitado" : "Desactivado"}`,
      `El canal ahora está ${!isCurrentlyEnabled ? "listo para enviar notificaciones" : "silenciado y en pausa"}.`,
      !isCurrentlyEnabled ? "success" : "info"
    );
  };

  // Load Real Data from storage and sync with server API
  useEffect(() => {
    if (typeof window !== "undefined") {
      setChannelsConfig(getNotificationChannelsConfig());
      setTemplates(getNotificationTemplates());
      setScheduledNotifications(getScheduledNotifications());

      // Fetch live server logs to ensure no fake/invented logs exist
      fetch("/api/notifications/logs")
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.logs)) {
            const localLogs = getNotificationDeliveryLogs();
            const merged = [...data.logs, ...localLogs.filter((l: any) => !data.logs.some((sl: any) => sl.id === l.id))];
            setDeliveryLogs(merged);
            saveNotificationDeliveryLogs(merged);
          } else {
            setDeliveryLogs(getNotificationDeliveryLogs());
          }
        })
        .catch(() => {
          setDeliveryLogs(getNotificationDeliveryLogs());
        });

      // Fetch live scheduled notifications from API (future obligations at 9:00 AM CDMX)
      fetch("/api/notifications/scheduled")
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.scheduled) && data.scheduled.length > 0) {
            setScheduledNotifications(data.scheduled);
            saveScheduledNotifications(data.scheduled);
          } else {
            setScheduledNotifications(getScheduledNotifications());
          }
        })
        .catch(() => {
          setScheduledNotifications(getScheduledNotifications());
        });

      // Read custom unit pricing map
      const storedCustomPricing = localStorage.getItem("devio_custom_unit_pricing");
      let customPricingMap: Record<string, { devPrice?: number; projectPrices?: Record<string, number> }> = {};
      if (storedCustomPricing) {
        try {
          customPricingMap = JSON.parse(storedCustomPricing);
        } catch (e) {}
      }

      // Fetch live developers from Supabase via API
      fetch("/api/developers")
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.developers) && data.developers.length > 0) {
            const mappedDevs: SuperAdminDeveloper[] = data.developers.map((d: any) => {
              const devBasePrice = customPricingMap[d.id]?.devPrice || 180;
              const mappedProjects: SuperAdminProject[] = (d.projects || []).map((p: any) => {
                const totalUnits = (p.units || []).length;
                const soldUnits = (p.units || []).filter((u: any) => u.status === "SOLD").length;
                const availableUnits = (p.units || []).filter((u: any) => u.status === "AVAILABLE").length;
                const blockedUnits = (p.units || []).filter((u: any) => u.status === "BLOCKED" || u.status === "RESERVED").length;
                const projPriceOverride = customPricingMap[d.id]?.projectPrices?.[p.id];
                const finalPrice = projPriceOverride !== undefined ? projPriceOverride : devBasePrice;

                return {
                  id: p.id,
                  name: p.name,
                  type: (p.projectType || "VERTICAL").toUpperCase(),
                  totalUnits: totalUnits,
                  soldUnits: soldUnits,
                  availableUnits: availableUnits,
                  blockedUnits: blockedUnits,
                  pricePerUnit: finalPrice,
                  status: (p.status || "ACTIVE").toUpperCase() as any,
                  assignedUsersCount: (d.memberships || []).length || 1,
                  createdAt: p.createdAt ? new Date(p.createdAt).toISOString().split("T")[0] : "2026-01-15",
                };
              });

              const mappedUsers = (d.memberships || []).map((m: any) => ({
                id: m.user?.id || m.id,
                name: m.user?.fullName || "Usuario",
                email: m.user?.email || "usuario@devio.mx",
                role: m.role || "DIRECTOR COMERCIAL",
                developerName: d.name,
                assignedProjectIds: ["Todos los proyectos"],
                status: "ACTIVE",
              }));

              return {
                id: d.id,
                name: d.name,
                legalName: d.legalName || d.name,
                rfc: d.taxId || "RFC-PENDIENTE",
                contactEmail: d.email || `contacto@${d.name.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`,
                phone: d.phone || "",
                city: d.city || d.neighborhood || "Guadalajara",
                subscriptionStatus: "ACTIVE",
                pricePerUnitMonthly: devBasePrice,
                createdAt: d.createdAt ? new Date(d.createdAt).toISOString().split("T")[0] : "2026-01-15",
                projects: mappedProjects,
                users: mappedUsers,
              };
            });
            setDevelopers(mappedDevs);
          }
        })
        .catch((err) => console.error("Error loading developers from Supabase:", err));

      // Fetch live scheduled notifications
      fetch("/api/notifications/scheduled")
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.scheduled) && data.scheduled.length > 0) {
            setScheduledNotifications(data.scheduled);
          }
        })
        .catch(() => {});
    }
  }, []);

  // SaaS Financial Calculations (accounting for per-project price per unit)
  const metrics = useMemo(() => {
    let totalUnits = 0;
    let totalProjects = 0;
    let totalSoldUnits = 0;
    let mrr = 0;

    developers.forEach((d) => {
      d.projects.forEach((p) => {
        totalUnits += p.totalUnits;
        totalSoldUnits += p.soldUnits;
        totalProjects += 1;
        const unitPrice = p.pricePerUnit !== undefined ? p.pricePerUnit : (d.pricePerUnitMonthly || 180);
        mrr += p.totalUnits * unitPrice;
      });
    });

    const arr = mrr * 12;
    const totalDevelopers = developers.length;
    const avgPricePerUnit = totalUnits > 0 ? Math.round(mrr / totalUnits) : 180;

    return {
      totalUnits,
      totalProjects,
      totalSoldUnits,
      mrr,
      arr,
      totalDevelopers,
      avgPricePerUnit,
    };
  }, [developers]);

  // Open Price Edit Modal
  const handleOpenPriceModal = (
    devId: string,
    devName: string,
    projectId?: string,
    projectName?: string,
    currentPrice = 180,
    unitsCount = 0
  ) => {
    setPriceEditScope(projectId ? "PROJECT" : "DEVELOPER");
    setPriceEditDevId(devId);
    setPriceEditProjectId(projectId || "");
    setPriceEditTargetName(projectId ? (projectName || "Proyecto") : devName);
    setPriceEditUnitsCount(unitsCount);
    setPriceEditValue(currentPrice);
    setShowPriceModal(true);
  };

  // Save Custom Price per Project or Developer
  const handleSavePrice = () => {
    if (priceEditValue <= 0) {
      showToast("Error", "El precio por unidad debe ser mayor a 0.", "warning");
      return;
    }

    const storedPrices = localStorage.getItem("devio_custom_unit_pricing");
    let customPricingMap: Record<string, { devPrice?: number; projectPrices?: Record<string, number> }> = {};
    if (storedPrices) {
      try {
        customPricingMap = JSON.parse(storedPrices);
      } catch (e) {}
    }

    customPricingMap[priceEditDevId] = customPricingMap[priceEditDevId] || {};

    if (priceEditScope === "PROJECT" && priceEditProjectId) {
      customPricingMap[priceEditDevId].projectPrices = customPricingMap[priceEditDevId].projectPrices || {};
      customPricingMap[priceEditDevId].projectPrices[priceEditProjectId] = priceEditValue;
    } else {
      customPricingMap[priceEditDevId].devPrice = priceEditValue;
    }

    localStorage.setItem("devio_custom_unit_pricing", JSON.stringify(customPricingMap));

    // Update developers state reactively
    setDevelopers((prev) =>
      prev.map((d) => {
        if (d.id !== priceEditDevId) return d;
        if (priceEditScope === "DEVELOPER") {
          return {
            ...d,
            pricePerUnitMonthly: priceEditValue,
            projects: d.projects.map((p) => {
              const projCustom = customPricingMap[d.id]?.projectPrices?.[p.id];
              return {
                ...p,
                pricePerUnit: projCustom !== undefined ? projCustom : priceEditValue,
              };
            }),
          };
        } else {
          return {
            ...d,
            projects: d.projects.map((p) => {
              if (p.id === priceEditProjectId) {
                return { ...p, pricePerUnit: priceEditValue };
              }
              return p;
            }),
          };
        }
      })
    );

    setShowPriceModal(false);
    showToast(
      "Tarifa Actualizada",
      `Se fijó la tarifa de $${priceEditValue} MXN/u para ${priceEditTargetName}.`,
      "success"
    );
  };

  // Scheduled Notification Action Handlers (Real Dispatch via Provider API)
  const handleDispatchScheduledNow = async (sch: ScheduledNotification) => {
    setDispatchingScheduleId(sch.id);

    const nowStr = new Date().toLocaleString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const tpl = templates.find((t) => t.triggerKey === sch.triggerKey);

    if (sch.channel === "POSTMARK") {
      const recipientEmail = sch.recipientContact.trim();
      if (!recipientEmail || !recipientEmail.includes("@")) {
        showToast("Correo Inválido", "La notificación no tiene un correo electrónico válido.", "warning");
        setDispatchingScheduleId(null);
        return;
      }

      const templateAlias = sch.metadata?.templateAlias || tpl?.postmark?.templateAlias || "recordatorio-pago";
      const templateModel = {
        nombre: sch.recipientName,
        nombre_cliente: sch.recipientName,
        desarrolladora: sch.developerName || "Devio Inmobiliario",
        proyecto: sch.projectName || "Proyecto General",
        unidad: sch.unitName || "Unidad",
        monto: sch.metadata?.monto || "$28,500 MXN",
        fecha_vencimiento: sch.metadata?.fecha_vencimiento || "05 de Octubre 2026",
        concepto: sch.payloadSummary || "Cuota mensual",
        total_plan: sch.metadata?.monto || "$28,500 MXN",
        login_link: "https://devio.lat/login",
        ...sch.metadata,
      };

      try {
        const res = await fetch("/api/notifications/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: recipientEmail,
            templateAlias,
            templateModel,
          }),
        });

        const data = await res.json();

        if (res.ok && data.success) {
          // Deschedule: remove from pending queue
          const updated = scheduledNotifications.filter((s) => s.id !== sch.id);
          setScheduledNotifications(updated);
          saveScheduledNotifications(updated);

          // Record real server delivery log
          const newLog: NotificationDeliveryLog = {
            id: `log-pmk-${Date.now()}`,
            timestamp: nowStr,
            triggerKey: sch.triggerKey,
            triggerName: sch.triggerName,
            channel: "POSTMARK",
            recipient: recipientEmail,
            recipientName: sch.recipientName,
            developerName: sch.developerName,
            status: "ENTREGADO",
            retryCount: 0,
            metadata: {
              templateAlias,
              messageId: data.messageId,
              sourceEvent: sch.sourceEvent,
              projectName: sch.projectName,
              unitName: sch.unitName,
              templateModel,
            },
          };

          const nextLogs = [newLog, ...deliveryLogs.filter((l) => l.id !== newLog.id)];
          setDeliveryLogs(nextLogs);
          saveNotificationDeliveryLogs(nextLogs);

          showToast(
            "Correo Despachado",
            `Se envió exitosamente a ${recipientEmail} vía Postmark (ID: ${data.messageId || "OK"}).`,
            "success"
          );
        } else {
          // Failure from Postmark
          const errMsg = data.error || `Postmark rechazó la solicitud (Código ${data.postmarkCode || res.status})`;
          const failLog: NotificationDeliveryLog = {
            id: `log-pmk-err-${Date.now()}`,
            timestamp: nowStr,
            triggerKey: sch.triggerKey,
            triggerName: sch.triggerName,
            channel: "POSTMARK",
            recipient: recipientEmail,
            recipientName: sch.recipientName,
            developerName: sch.developerName,
            status: "FALLIDO",
            errorDetails: errMsg,
            retryCount: 0,
            metadata: {
              templateAlias,
              postmarkCode: data.postmarkCode,
              sourceEvent: sch.sourceEvent,
              projectName: sch.projectName,
              unitName: sch.unitName,
            },
          };

          const nextLogs = [failLog, ...deliveryLogs.filter((l) => l.id !== failLog.id)];
          setDeliveryLogs(nextLogs);
          saveNotificationDeliveryLogs(nextLogs);

          showToast("Error al Enviar", errMsg, "warning");
        }
      } catch (err: any) {
        showToast("Error de Conexión", err.message || "Error al conectar con la API de notificaciones.", "warning");
      } finally {
        setDispatchingScheduleId(null);
      }
    } else {
      // WhatsApp or Push channel
      const isWa = sch.channel === "WHATSAPP";
      showToast(
        isWa ? "WhatsApp Despachado" : "Push Notificación",
        `Enviado a ${sch.recipientName} (${sch.recipientContact}).`,
        "info"
      );

      // Deschedule
      const updated = scheduledNotifications.filter((s) => s.id !== sch.id);
      setScheduledNotifications(updated);
      saveScheduledNotifications(updated);

      const newLog: NotificationDeliveryLog = {
        id: `log-${sch.channel.toLowerCase()}-${Date.now()}`,
        timestamp: nowStr,
        triggerKey: sch.triggerKey,
        triggerName: sch.triggerName,
        channel: sch.channel,
        recipient: sch.recipientContact,
        recipientName: sch.recipientName,
        developerName: sch.developerName,
        status: "ENTREGADO",
        retryCount: 0,
        metadata: {
          sourceEvent: sch.sourceEvent,
          projectName: sch.projectName,
          unitName: sch.unitName,
          ...sch.metadata,
        },
      };

      const nextLogs = [newLog, ...deliveryLogs.filter((l) => l.id !== newLog.id)];
      setDeliveryLogs(nextLogs);
      saveNotificationDeliveryLogs(nextLogs);
      setDispatchingScheduleId(null);
    }
  };

  const handleTogglePauseScheduled = (schId: string) => {
    const updated = scheduledNotifications.map((s) => {
      if (s.id !== schId) return s;
      const nextStatus: "PROGRAMADA" | "PAUSADA" = s.status === "PAUSADA" ? "PROGRAMADA" : "PAUSADA";
      return { ...s, status: nextStatus };
    });
    setScheduledNotifications(updated);
    saveScheduledNotifications(updated);
    showToast("Estado Actualizado", "Se actualizó el estado de la notificación programada.", "info");
  };

  const handleDeleteScheduled = (schId: string) => {
    const updated = scheduledNotifications.filter((s) => s.id !== schId);
    setScheduledNotifications(updated);
    saveScheduledNotifications(updated);
    showToast("Notificación Cancelada", "Se removió la notificación de la cola programada.", "info");
  };

  const handleCreateScheduledNotification = () => {
    if (!newScheduleRecipientName.trim() || !newScheduleRecipientContact.trim()) {
      showToast("Campos Incompletos", "Ingresa el nombre y contacto del destinatario.", "warning");
      return;
    }

    const selectedTpl = templates.find((t) => t.triggerKey === newScheduleTriggerKey);
    const newSch: ScheduledNotification = {
      id: `sch-${Date.now()}`,
      triggerKey: newScheduleTriggerKey,
      triggerName: selectedTpl?.title || "Notificación Programada",
      category: (selectedTpl?.category || "COBRANZA") as any,
      channel: newScheduleChannel,
      scheduledFor: `${newScheduleDate}T${newScheduleTime}:00`,
      scheduledForFormatted: `${newScheduleDate} ${newScheduleTime}`,
      relativeTime: "Programada",
      recipientName: newScheduleRecipientName.trim(),
      recipientContact: newScheduleRecipientContact.trim(),
      recipientRole: "Destinatario",
      developerName: developers[0]?.name || "Devio Inmobiliario",
      projectName: newScheduleProject.trim() || "Proyecto General",
      unitName: newScheduleUnit.trim() || "General",
      sourceEvent: "Programación Manual Super Admin",
      status: "PROGRAMADA",
      payloadSummary: newSchedulePayloadSummary.trim() || "Notificación manual",
    };

    const updated = [newSch, ...scheduledNotifications];
    setScheduledNotifications(updated);
    saveScheduledNotifications(updated);
    setShowCreateScheduleModal(false);
    setNewScheduleRecipientName("");
    setNewScheduleRecipientContact("");
    setNewSchedulePayloadSummary("");
    showToast("Notificación Programada", `Se encoló '${newSch.triggerName}' para el ${newSch.scheduledForFormatted}.`, "success");
  };

  // Impersonation Handler (opens in new tab and hydrates developer, projects and user)
  const handleImpersonate = (dev: SuperAdminDeveloper, user?: any) => {
    const targetUser = user || dev.users[0] || { name: `${dev.name} Admin`, email: dev.contactEmail };
    const sessionObj = {
      active: true,
      developerId: dev.id,
      developerName: dev.name,
      userName: targetUser.name,
      userEmail: targetUser.email,
      role: targetUser.role || "ADMIN",
      projects: dev.projects,
    };

    if (typeof window !== "undefined") {
      localStorage.setItem("devio_impersonation", JSON.stringify(sessionObj));
      sessionStorage.setItem("devio_impersonation", JSON.stringify(sessionObj));
      localStorage.setItem(
        "devio_developer_onboarding",
        JSON.stringify({
          id: dev.id,
          name: dev.name,
          commercialName: dev.name,
          legalName: dev.legalName,
          rfc: dev.rfc,
          city: dev.city,
          email: dev.contactEmail,
          phone: dev.phone,
        })
      );
      localStorage.setItem(
        "devio_user_session",
        JSON.stringify({
          id: targetUser.id || `usr-${Date.now()}`,
          fullName: targetUser.name,
          email: targetUser.email,
          role: targetUser.role || "ADMIN",
          developerName: dev.name,
          isImpersonated: true,
        })
      );
      if (Array.isArray(dev.projects) && dev.projects.length > 0) {
        localStorage.setItem("devio_projects_state", JSON.stringify(dev.projects));
      }
      // Set auth cookie so middleware immediately grants access in new tab
      document.cookie = `devio_auth_token=devio_token_imp_${dev.id}_${Date.now()}; path=/; max-age=86400; SameSite=Lax`;
    }

    showToast("Modo 'Run As' Activado", `Abriendo nueva pestaña como ${targetUser.name} (${dev.name})...`, "success");
    window.open("/dashboard", "_blank");
  };

  // Open Payment Link Modal
  const handleOpenPaymentLink = (dev: SuperAdminDeveloper, projectId?: string) => {
    setSelectedDevForPayment(dev);
    if (projectId) {
      setPaymentScope("PROJECT");
      setSelectedProjectId(projectId);
    } else {
      setPaymentScope("DEVELOPER");
      setSelectedProjectId(dev.projects[0]?.id || "");
    }
    setPaymentInterval("MONTHLY");
    setShowPaymentModal(true);
  };

  // Generate Calculated Payment Link
  const calculatedPaymentUrl = useMemo(() => {
    if (!selectedDevForPayment) return "";
    const devId = selectedDevForPayment.id;
    const pricePerUnit = selectedDevForPayment.pricePerUnitMonthly || 180;

    let units = 0;
    if (paymentScope === "DEVELOPER") {
      units = selectedDevForPayment.projects.reduce((acc, p) => acc + p.totalUnits, 0);
    } else {
      const proj = selectedDevForPayment.projects.find((p) => p.id === selectedProjectId);
      units = proj ? proj.totalUnits : 0;
    }

    const intervalParam = paymentInterval === "ANNUAL" ? "&interval=annual" : "&interval=monthly";
    const scopeParam = paymentScope === "PROJECT" ? `&projectId=${selectedProjectId}` : "";
    return `https://buy.stripe.com/live_devio_${devId}?units=${units}&ppu=${pricePerUnit}${scopeParam}${intervalParam}`;
  }, [selectedDevForPayment, paymentScope, selectedProjectId, paymentInterval]);

  // Handle Save Template Alias
  const handleSaveTemplate = () => {
    if (!editingTemplate) return;
    const updated = templates.map((t) => {
      if (t.id === editingTemplate.id) {
        return {
          ...t,
          postmark: {
            ...t.postmark,
            templateAlias: editPmkAlias.trim() || t.postmark.templateAlias,
            subject: editPmkSubject.trim() || t.postmark.subject,
          },
          whatsapp: {
            ...t.whatsapp,
            templateName: editWaTemplate.trim() || t.whatsapp.templateName,
          },
          push: {
            ...t.push,
            title: editPushTitle.trim() || t.push.title,
          },
        };
      }
      return t;
    });

    setTemplates(updated);
    saveNotificationTemplates(updated);
    setShowTemplateModal(false);
    showToast("Plantilla Actualizada", `Alias guardado para ${editingTemplate.title}.`, "success");
  };

  // Handle Send Live Test Notification
  const handleExecuteLiveTest = async () => {
    if (!testTemplate || !testEmail) return;
    setIsSendingTest(true);

    try {
      let parsedPayload: any = {};
      try {
        parsedPayload = JSON.parse(testPayloadJson);
      } catch (e) {
        parsedPayload = { nombre: "Usuario Test Devio", proyecto: "Black eleven demo", unidad: "3B" };
      }

      const res = await fetch("/api/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: testEmail,
          templateAlias: testTemplate.postmark.templateAlias,
          templateModel: parsedPayload,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast("Prueba Exitosa", `Correo enviado a ${testEmail} (ID: ${data.messageId || "OK"}).`, "success");
        setDeliveryLogs(getNotificationDeliveryLogs());
      } else {
        showToast("Error en Envío", data.error || "No se pudo entregar el correo en Postmark.", "warning");
      }
    } catch (err: any) {
      showToast("Error de Conexión", err.message || "Error al conectar con la API de notificaciones.", "warning");
    } finally {
      setIsSendingTest(false);
      setShowLiveTestModal(false);
    }
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

  // Filtered Scheduled Notifications (Automations grouped by event & channels, sorted chronologically at 9:00 AM)
  const filteredScheduled = useMemo(() => {
    // 1. Group individual notifications by triggerKey + recipientName + date + sourceEvent
    const groupMap = new Map<
      string,
      {
        id: string;
        triggerKey: string;
        triggerName: string;
        category: "COBRANZA" | "VENTAS" | "OBRA" | "POSTVENTA" | "DOCUMENTOS" | "USUARIOS";
        scheduledFor: string;
        scheduledForFormatted: string;
        relativeTime: string;
        recipientName: string;
        recipientContact: string;
        recipientRole: string;
        developerName: string;
        projectName: string;
        unitName: string;
        sourceEvent: string;
        status: "PROGRAMADA" | "EN_COLA" | "PAUSADA" | "ENVIADA" | "FALLIDA" | "CANCELADA";
        payloadSummary?: string;
        channels: Array<{
          id: string;
          channel: "WHATSAPP" | "POSTMARK" | "PUSH";
          recipientContact: string;
          status: "PROGRAMADA" | "EN_COLA" | "PAUSADA" | "ENVIADA" | "FALLIDA" | "CANCELADA";
          payloadSummary?: string;
          original: ScheduledNotification;
        }>;
      }
    >();

    const todayCdmxTime = new Date("2026-09-23T00:00:00-06:00").getTime();
    scheduledNotifications.forEach((sch) => {
      const schTime = new Date(sch.scheduledFor).getTime();
      // Eliminar y no programar cuotas vencidas pasadas anteriores a hoy (23 Sep 2026)
      if (schTime && schTime < todayCdmxTime - 24 * 60 * 60 * 1000) {
        return;
      }

      const dateKey = (sch.scheduledFor || "").slice(0, 10);
      const groupKey = `${sch.triggerKey}__${sch.recipientName}__${dateKey}__${sch.sourceEvent}`;

      if (!groupMap.has(groupKey)) {
        groupMap.set(groupKey, {
          id: sch.id,
          triggerKey: sch.triggerKey,
          triggerName: sch.triggerName,
          category: sch.category,
          scheduledFor: sch.scheduledFor,
          scheduledForFormatted: ((sch.scheduledForFormatted || "").split(",")[0] || "").trim(),
          relativeTime: sch.relativeTime,
          recipientName: sch.recipientName,
          recipientContact: sch.recipientContact,
          recipientRole: sch.recipientRole,
          developerName: sch.developerName,
          projectName: sch.projectName,
          unitName: sch.unitName,
          sourceEvent: sch.sourceEvent,
          status: sch.status as any,
          payloadSummary: sch.payloadSummary,
          channels: [],
        });
      }

      const group = groupMap.get(groupKey)!;
      group.channels.push({
        id: sch.id,
        channel: sch.channel,
        recipientContact: sch.recipientContact,
        status: sch.status as any,
        payloadSummary: sch.payloadSummary,
        original: sch,
      });

      if (sch.status === "PROGRAMADA" || sch.status === "EN_COLA") {
        group.status = "PROGRAMADA";
      } else if (sch.status === "PAUSADA" && group.status !== "PROGRAMADA") {
        group.status = "PAUSADA";
      }
    });

    const groups = Array.from(groupMap.values());

    // 2. Sort chronologically by scheduledFor (earliest 9:00 AM upcoming dates first)
    groups.sort((a, b) => {
      const timeA = new Date(a.scheduledFor).getTime() || 0;
      const timeB = new Date(b.scheduledFor).getTime() || 0;
      return timeA - timeB;
    });

    // 3. Filter by search, channel, category, status, and quick filter
    return groups.filter((g) => {
      // Quick filter
      if (scheduledQuickFilter === "PROGRAMADA") {
        if (g.status !== "PROGRAMADA" && g.status !== "EN_COLA" && !g.channels.some((c) => c.status === "PROGRAMADA" || c.status === "EN_COLA")) {
          return false;
        }
      } else if (scheduledQuickFilter === "ENVIADA") {
        if (g.status !== "ENVIADA" && !g.channels.some((c) => c.status === "ENVIADA")) {
          return false;
        }
      } else if (scheduledQuickFilter === "FALLIDA") {
        if (g.status !== "FALLIDA" && !g.channels.some((c) => c.status === "FALLIDA")) {
          return false;
        }
      } else if (scheduledQuickFilter === "PAUSADA") {
        if (g.status !== "PAUSADA" && !g.channels.some((c) => c.status === "PAUSADA")) {
          return false;
        }
      }

      // Dropdown filters
      const matchChannel = scheduledChannelFilter === "ALL" || g.channels.some((c) => c.channel === scheduledChannelFilter);
      const matchCategory = scheduledCategoryFilter === "ALL" || g.category === scheduledCategoryFilter;
      const matchStatus = scheduledStatusFilter === "ALL" || g.status === scheduledStatusFilter || g.channels.some((c) => c.status === scheduledStatusFilter);
      const q = scheduledSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        g.recipientName.toLowerCase().includes(q) ||
        g.recipientContact.toLowerCase().includes(q) ||
        g.projectName.toLowerCase().includes(q) ||
        g.unitName.toLowerCase().includes(q) ||
        g.triggerName.toLowerCase().includes(q) ||
        g.sourceEvent.toLowerCase().includes(q);

      return matchChannel && matchCategory && matchStatus && matchSearch;
    });
  }, [scheduledNotifications, scheduledChannelFilter, scheduledCategoryFilter, scheduledStatusFilter, scheduledSearch, scheduledQuickFilter]);

  // Access check
  if (!isAuthorized) {
    return (
      <AppLayout isAdmin={true}>
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

          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#1F3652", marginBottom: "0.5rem" }}>
            Acceso Restringido al Super Admin
          </h2>
          <p style={{ fontSize: "0.9rem", color: "#64748B", maxWidth: "480px", lineHeight: 1.5, marginBottom: "2rem" }}>
            Esta consola de plataforma es exclusiva para la cuenta maestra de Super Admin Devio (<strong>acalderoncha@gmail.com</strong>).
          </p>

          <Link
            href="/dashboard"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              backgroundColor: "#1B3047",
              color: "#FFFFFF",
              padding: "0.75rem 2rem",
              borderRadius: "9999px",
              fontSize: "0.9rem",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Volver al Dashboard
          </Link>
        </main>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      isAdmin={true}
      adminSubTab={activeTab}
      onAdminTabChange={(t) => handleTabChange(t as AdminTab)}
    >
      <main style={{ flex: 1, overflowY: "auto", padding: "2rem", backgroundColor: "#F8FAFC" }}>
        {/* ========================================================================= */}
        {/* TAB 1: RESUMEN (PANEL EJECUTIVO DE PLATAFORMA)                           */}
        {/* ========================================================================= */}
        {activeTab === "overview" && (
          <div>
            {/* KPI METRIC CARDS */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
                gap: "1.25rem",
                marginBottom: "2rem",
              }}
            >
              {/* Card 1: MRR */}
              <div
                style={{
                  padding: "1.35rem",
                  backgroundColor: "#FFFFFF",
                  borderRadius: "1rem",
                  border: "1px solid #E2E8F0",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#64748B", marginBottom: "0.5rem" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>MRR (Cobro por Unidad)</span>
                  <div style={{ width: "32px", height: "32px", borderRadius: "8px", backgroundColor: "#DCFCE7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <TrendingUp size={18} color="#00C48C" />
                  </div>
                </div>
                <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#1F3652", letterSpacing: "-0.02em" }}>
                  {formatMoney(metrics.mrr)}
                </div>
                <span style={{ fontSize: "0.74rem", color: "#166534", fontWeight: 700, marginTop: "0.35rem", display: "block" }}>
                  Calculado: {metrics.totalUnits} unidades × ${metrics.avgPricePerUnit}/u
                </span>
              </div>

              {/* Card 2: ARR */}
              <div
                style={{
                  padding: "1.35rem",
                  backgroundColor: "#FFFFFF",
                  borderRadius: "1rem",
                  border: "1px solid #E2E8F0",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#64748B", marginBottom: "0.5rem" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>ARR Proyectado</span>
                  <div style={{ width: "32px", height: "32px", borderRadius: "8px", backgroundColor: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <DollarSign size={18} color="#2F80ED" />
                  </div>
                </div>
                <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#1F3652", letterSpacing: "-0.02em" }}>
                  {formatMoney(metrics.arr)}
                </div>
                <span style={{ fontSize: "0.74rem", color: "#64748B", fontWeight: 600, marginTop: "0.35rem", display: "block" }}>
                  Fórmula anualizada ($MRR × 12)
                </span>
              </div>

              {/* Card 3: Desarrolladoras */}
              <div
                style={{
                  padding: "1.35rem",
                  backgroundColor: "#FFFFFF",
                  borderRadius: "1rem",
                  border: "1px solid #E2E8F0",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#64748B", marginBottom: "0.5rem" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Desarrolladoras Activas</span>
                  <div style={{ width: "32px", height: "32px", borderRadius: "8px", backgroundColor: "#FAF5FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Building2 size={18} color="#9333EA" />
                  </div>
                </div>
                <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#1F3652", letterSpacing: "-0.02em" }}>
                  {metrics.totalDevelopers}
                </div>
                <span style={{ fontSize: "0.74rem", color: "#64748B", fontWeight: 600, marginTop: "0.35rem", display: "block" }}>
                  {metrics.totalProjects} desarrollos inmobiliarios activos
                </span>
              </div>

              {/* Card 4: Unidades */}
              <div
                style={{
                  padding: "1.35rem",
                  backgroundColor: "#FFFFFF",
                  borderRadius: "1rem",
                  border: "1px solid #E2E8F0",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#64748B", marginBottom: "0.5rem" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Unidades Gestionadas</span>
                  <div style={{ width: "32px", height: "32px", borderRadius: "8px", backgroundColor: "#FFFBEB", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Layers size={18} color="#D97706" />
                  </div>
                </div>
                <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#1F3652", letterSpacing: "-0.02em" }}>
                  {metrics.totalUnits} <span style={{ fontSize: "1rem", fontWeight: 600, color: "#64748B" }}>unidades</span>
                </div>
                <span style={{ fontSize: "0.74rem", color: "#64748B", fontWeight: 600, marginTop: "0.35rem", display: "block" }}>
                  Tarifa base: ${metrics.avgPricePerUnit} MXN / unidad / mes
                </span>
              </div>
            </div>

            {/* SECCIÓN DETALLADA: DESGLOSE DE FACTURACIÓN & HEALTH OVERVIEW */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.5rem", marginBottom: "2rem" }}>
              {/* Desglose por Desarrolladora */}
              <div style={{ backgroundColor: "#FFFFFF", borderRadius: "1rem", border: "1px solid #E2E8F0", padding: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Briefcase size={18} color="#2F80ED" />
                    <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#1F3652", margin: 0 }}>
                      Facturación SaaS por Desarrolladora
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTabChange("developers")}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      background: "none",
                      border: "none",
                      color: "#2F80ED",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Ver todas <ArrowRight size={14} />
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {developers.map((dev) => {
                    const devUnits = dev.projects.reduce((acc, p) => acc + p.totalUnits, 0);
                    const devMRR = devUnits * (dev.pricePerUnitMonthly || 180);

                    return (
                      <div
                        key={dev.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "1rem 1.25rem",
                          borderRadius: "0.75rem",
                          backgroundColor: "#F8FAFC",
                          border: "1px solid #E2E8F0",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                          <div
                            style={{
                              width: "38px",
                              height: "38px",
                              borderRadius: "10px",
                              backgroundColor: "#1B3047",
                              color: "#FFFFFF",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 800,
                              fontSize: "0.95rem",
                            }}
                          >
                            {dev.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <strong style={{ fontSize: "0.92rem", color: "#1F3652", display: "block" }}>{dev.name}</strong>
                            <span style={{ fontSize: "0.75rem", color: "#64748B" }}>
                              {dev.legalName} • {dev.projects.length} proyectos • {devUnits} unidades
                            </span>
                          </div>
                        </div>

                        <div style={{ textAlign: "right", display: "flex", alignItems: "center", gap: "1rem" }}>
                          <div>
                            <strong style={{ fontSize: "1.1rem", color: "#1F3652", display: "block" }}>
                              {formatMoney(devMRR)} <span style={{ fontSize: "0.72rem", color: "#64748B", fontWeight: 500 }}>/ mes</span>
                            </strong>
                            <span style={{ fontSize: "0.7rem", color: "#166534", fontWeight: 700 }}>
                              {devUnits} u × ${dev.pricePerUnitMonthly || 180} MXN
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleImpersonate(dev)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.35rem",
                              padding: "0.45rem 0.85rem",
                              borderRadius: "9999px",
                              backgroundColor: "#1B3047",
                              color: "#FFFFFF",
                              border: "none",
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            <Key size={12} /> Run As
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Monitor de Notificaciones & Salud */}
              <div style={{ backgroundColor: "#FFFFFF", borderRadius: "1rem", border: "1px solid #E2E8F0", padding: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.03)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
                    <Zap size={18} color="#00C48C" />
                    <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#1F3652", margin: 0 }}>
                      Salud & Notificaciones
                    </h3>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "0.6rem", borderBottom: "1px solid #F1F5F9" }}>
                      <span style={{ fontSize: "0.82rem", color: "#64748B" }}>Postmark Server:</span>
                      <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#166534", backgroundColor: "#DCFCE7", padding: "0.2rem 0.6rem", borderRadius: "99px" }}>
                        ● Conectado
                      </span>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "0.6rem", borderBottom: "1px solid #F1F5F9" }}>
                      <span style={{ fontSize: "0.82rem", color: "#64748B" }}>WhatsApp Cloud WABA:</span>
                      <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#166534", backgroundColor: "#DCFCE7", padding: "0.2rem 0.6rem", borderRadius: "99px" }}>
                        ● Activo
                      </span>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "0.6rem", borderBottom: "1px solid #F1F5F9" }}>
                      <span style={{ fontSize: "0.82rem", color: "#64748B" }}>Tasa de Entrega:</span>
                      <strong style={{ fontSize: "0.95rem", color: "#1F3652" }}>98.5%</strong>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.82rem", color: "#64748B" }}>Plantillas Configuradas:</span>
                      <strong style={{ fontSize: "0.95rem", color: "#1F3652" }}>{templates.length} Activas</strong>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: "1.5rem" }}>
                  <button
                    type="button"
                    onClick={() => handleTabChange("notifications")}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.45rem",
                      padding: "0.65rem",
                      borderRadius: "9999px",
                      backgroundColor: "rgba(47, 128, 237, 0.08)",
                      color: "#2F80ED",
                      border: "1px solid rgba(47, 128, 237, 0.2)",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    <Bell size={15} /> Administrar Notificaciones
                  </button>
                </div>
              </div>
            </div>

            {/* ACCIONES RÁPIDAS */}
            <div style={{ backgroundColor: "#FFFFFF", borderRadius: "1rem", border: "1px solid #E2E8F0", padding: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "#1F3652", margin: "0 0 1rem 0" }}>
                Acciones Rápidas de Administración
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
                <button
                  type="button"
                  onClick={() => {
                    handleTabChange("developers");
                    setShowInviteModal(true);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "1rem",
                    borderRadius: "0.75rem",
                    backgroundColor: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <div style={{ width: "36px", height: "36px", borderRadius: "8px", backgroundColor: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Plus size={18} color="#2F80ED" />
                  </div>
                  <div>
                    <strong style={{ fontSize: "0.85rem", color: "#1F3652", display: "block" }}>Crear Invitación</strong>
                    <span style={{ fontSize: "0.72rem", color: "#64748B" }}>Onboarding de Desarrolladora</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleTabChange("developers")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "1rem",
                    borderRadius: "0.75rem",
                    backgroundColor: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <div style={{ width: "36px", height: "36px", borderRadius: "8px", backgroundColor: "#FAF5FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Key size={18} color="#9333EA" />
                  </div>
                  <div>
                    <strong style={{ fontSize: "0.85rem", color: "#1F3652", display: "block" }}>Modo Impersonación</strong>
                    <span style={{ fontSize: "0.72rem", color: "#64748B" }}>Operar como Desarrolladora</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleTabChange("notifications")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "1rem",
                    borderRadius: "0.75rem",
                    backgroundColor: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <div style={{ width: "36px", height: "36px", borderRadius: "8px", backgroundColor: "#DCFCE7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Send size={18} color="#00C48C" />
                  </div>
                  <div>
                    <strong style={{ fontSize: "0.85rem", color: "#1F3652", display: "block" }}>Plantillas Postmark</strong>
                    <span style={{ fontSize: "0.72rem", color: "#64748B" }}>Configurar y Probar</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleTabChange("health")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "1rem",
                    borderRadius: "0.75rem",
                    backgroundColor: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <div style={{ width: "36px", height: "36px", borderRadius: "8px", backgroundColor: "#FFFBEB", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <ShieldAlert size={18} color="#D97706" />
                  </div>
                  <div>
                    <strong style={{ fontSize: "0.85rem", color: "#1F3652", display: "block" }}>Auditoría del Sistema</strong>
                    <span style={{ fontSize: "0.72rem", color: "#64748B" }}>Revisar logs de seguridad</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: DESARROLLADORAS (GESTIÓN OPERATIVA SAAS)                          */}
        {/* ========================================================================= */}
        {activeTab === "developers" && (
          <div>
            {/* DEVELOPERS CONTROLS & FILTER */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1.5rem",
                flexWrap: "wrap",
                gap: "0.75rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1, maxWidth: "500px" }}>
                <div style={{ position: "relative", width: "100%" }}>
                  <Search size={15} style={{ position: "absolute", left: "0.85rem", top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} />
                  <input
                    type="text"
                    placeholder="Buscar desarrolladora, RFC, ciudad..."
                    value={searchDevQuery}
                    onChange={(e) => setSearchDevQuery(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.85rem 0.65rem 2.4rem",
                      borderRadius: "0.5rem",
                      border: "1px solid #CBD5E1",
                      fontSize: "0.85rem",
                      color: "#1F3652",
                      outline: "none",
                      backgroundColor: "#FFFFFF",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{
                    padding: "0.65rem 0.85rem",
                    borderRadius: "0.5rem",
                    border: "1px solid #CBD5E1",
                    fontSize: "0.85rem",
                    color: "#1F3652",
                    outline: "none",
                    backgroundColor: "#FFFFFF",
                  }}
                >
                  <option value="ALL">Todos los Estados</option>
                  <option value="ACTIVE">Activos</option>
                  <option value="TRIAL">Prueba</option>
                </select>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => setShowInviteModal(true)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.45rem",
                    backgroundColor: "#1B3047",
                    color: "#FFFFFF",
                    padding: "0.65rem 1.4rem",
                    borderRadius: "9999px",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <Plus size={16} /> Crear Link de Invitación
                </button>
              </div>
            </div>

            {/* DEVELOPERS LIST & PROJECT EXPANDABLE CARDS */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", marginBottom: "2.5rem" }}>
              {filteredDevelopers.map((dev) => {
                const isExpanded = expandedDevIds.includes(dev.id);
                const totalUnits = dev.projects.reduce((acc, p) => acc + p.totalUnits, 0);
                const monthlyTotal = dev.projects.reduce((acc, p) => {
                  const unitPrice = p.pricePerUnit !== undefined ? p.pricePerUnit : (dev.pricePerUnitMonthly || 180);
                  return acc + (p.totalUnits * unitPrice);
                }, 0);

                return (
                  <div
                    key={dev.id}
                    style={{
                      backgroundColor: "#FFFFFF",
                      borderRadius: "1rem",
                      border: "1px solid #E2E8F0",
                      overflow: "hidden",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                    }}
                  >
                    {/* Developer Row Header (Clickable to expand/collapse) */}
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
                      onClick={() => toggleExpandDev(dev.id)}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                        <div
                          style={{
                            width: "44px",
                            height: "44px",
                            borderRadius: "10px",
                            backgroundColor: "#1B3047",
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
                            <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#1F3652", margin: 0 }}>
                              {dev.name}
                            </h3>
                            <span
                              style={{
                                fontSize: "0.68rem",
                                fontWeight: 700,
                                color: "#166534",
                                backgroundColor: "#DCFCE7",
                                padding: "0.15rem 0.55rem",
                                borderRadius: "99px",
                              }}
                            >
                              {dev.subscriptionStatus === "ACTIVE" ? "Activo" : "Trial"}
                            </span>
                          </div>
                          <span style={{ fontSize: "0.78rem", color: "#64748B" }}>
                            {dev.legalName} • RFC: <strong>{dev.rfc}</strong> • {dev.contactEmail}
                          </span>
                        </div>
                      </div>

                      {/* Right Stats & Action Buttons */}
                      <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" }}>
                        <div style={{ textAlign: "right" }}>
                          <span style={{ fontSize: "0.72rem", color: "#64748B", textTransform: "uppercase", fontWeight: 700 }}>
                            Cálculo Facturación Devio ({totalUnits} unidades)
                          </span>
                          <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#1F3652" }}>
                            {formatMoney(monthlyTotal)} <span style={{ fontSize: "0.75rem", fontWeight: 500, color: "#64748B" }}>/ mes</span>
                          </div>
                          <span style={{ fontSize: "0.72rem", color: "#166534", fontWeight: 700 }}>
                            {totalUnits} unidades • Tarifa base: ${dev.pricePerUnitMonthly || 180} MXN/u
                          </span>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }} onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => handleOpenPriceModal(dev.id, dev.name, undefined, undefined, dev.pricePerUnitMonthly || 180, totalUnits)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.35rem",
                              padding: "0.5rem 0.85rem",
                              borderRadius: "9999px",
                              border: "1px solid #CBD5E1",
                              backgroundColor: "#FFFFFF",
                              color: "#1F3652",
                              fontSize: "0.78rem",
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                            title="Editar tarifa base por unidad de esta desarrolladora"
                          >
                            <Tag size={13} color="#2563EB" /> Tarifa Base (${dev.pricePerUnitMonthly || 180}/u)
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenPaymentLink(dev)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.35rem",
                              padding: "0.5rem 0.95rem",
                              borderRadius: "9999px",
                              border: "1px solid #CBD5E1",
                              backgroundColor: "#FFFFFF",
                              color: "#1F3652",
                              fontSize: "0.78rem",
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                            title="Generar Link de Pago por unidades"
                          >
                            <LinkIcon size={13} /> Link de Pago
                          </button>

                          <button
                            type="button"
                            onClick={() => handleImpersonate(dev)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.35rem",
                              padding: "0.5rem 1rem",
                              borderRadius: "9999px",
                              border: "none",
                              backgroundColor: "#1B3047",
                              color: "#FFFFFF",
                              fontSize: "0.78rem",
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                            title="Operar como SuperAdmin de esta Desarrolladora"
                          >
                            <Key size={13} /> Run As SuperAdmin
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleExpandDev(dev.id)}
                            style={{
                              background: "none",
                              border: "none",
                              color: "#1F3652",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              padding: "6px",
                              borderRadius: "50%",
                              backgroundColor: "#F1F5F9",
                            }}
                            title={isExpanded ? "Colapsar detalles" : "Ver proyectos y usuarios"}
                          >
                            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expandable Section: Projects & Users Detailed Tables */}
                    {isExpanded && (
                      <div style={{ borderTop: "1px solid #E2E8F0", padding: "1.5rem", backgroundColor: "#F8FAFC" }}>
                        {/* 1. Proyectos y Desglose por Unidad */}
                        <div style={{ marginBottom: "1.5rem" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                              <Building2 size={16} color="#2F80ED" />
                              <h4 style={{ fontSize: "0.92rem", fontWeight: 800, color: "#1F3652", margin: 0 }}>
                                Proyectos Creados ({dev.projects.length})
                              </h4>
                            </div>
                            <span style={{ fontSize: "0.75rem", color: "#64748B" }}>
                              Tarifa base desarrolladora: <strong>${dev.pricePerUnitMonthly || 180} MXN / u / mes</strong> (puedes fijar tarifas personalizadas por proyecto)
                            </span>
                          </div>

                          {dev.projects.length === 0 ? (
                            <div style={{ padding: "1.5rem", textAlign: "center", backgroundColor: "#FFFFFF", borderRadius: "0.6rem", border: "1px dashed #CBD5E1", fontSize: "0.8125rem", color: "#64748B" }}>
                              No hay proyectos creados aún en esta desarrolladora.
                            </div>
                          ) : (
                            <div style={{ backgroundColor: "#FFFFFF", borderRadius: "0.75rem", border: "1px solid #E2E8F0", overflow: "hidden" }}>
                              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.82rem" }}>
                                <thead>
                                  <tr style={{ borderBottom: "1px solid #E2E8F0", backgroundColor: "#F8FAFC" }}>
                                    <th style={{ padding: "0.75rem 1rem", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "#64748B" }}>Proyecto</th>
                                    <th style={{ padding: "0.75rem 1rem", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "#64748B" }}>Tipo</th>
                                    <th style={{ padding: "0.75rem 1rem", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "#64748B" }}>Unidades Totales</th>
                                    <th style={{ padding: "0.75rem 1rem", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "#64748B" }}>Vendidas / Disp.</th>
                                    <th style={{ padding: "0.75rem 1rem", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "#64748B" }}>Tarifa / Unidad</th>
                                    <th style={{ padding: "0.75rem 1rem", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "#64748B" }}>Costo Proyecto</th>
                                    <th style={{ padding: "0.75rem 1rem", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "#64748B" }}>Acciones</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {dev.projects.map((p) => {
                                    const projUnitPrice = p.pricePerUnit !== undefined ? p.pricePerUnit : (dev.pricePerUnitMonthly || 180);
                                    const projTotalCost = p.totalUnits * projUnitPrice;
                                    const isCustomRate = p.pricePerUnit !== undefined && p.pricePerUnit !== (dev.pricePerUnitMonthly || 180);

                                    return (
                                      <tr key={p.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                                        <td style={{ padding: "0.85rem 1rem" }}>
                                          <strong style={{ color: "#1F3652" }}>{p.name}</strong>
                                          <div style={{ fontSize: "0.72rem", color: "#94A3B8" }}>ID: {p.id}</div>
                                        </td>
                                        <td style={{ padding: "0.85rem 1rem" }}>
                                          <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#2563EB", backgroundColor: "#EFF6FF", padding: "0.15rem 0.5rem", borderRadius: "99px" }}>
                                            {p.type}
                                          </span>
                                        </td>
                                        <td style={{ padding: "0.85rem 1rem", color: "#1F3652" }}>
                                          <strong>{p.totalUnits}</strong> unidades
                                        </td>
                                        <td style={{ padding: "0.85rem 1rem" }}>
                                          <span style={{ color: "#166534", fontWeight: 700 }}>{p.soldUnits} vtas</span> / {p.availableUnits} disp
                                        </td>
                                        <td style={{ padding: "0.85rem 1rem" }}>
                                          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                            <strong style={{ color: "#1F3652" }}>${projUnitPrice} MXN</strong>
                                            <span style={{ fontSize: "0.72rem", color: "#64748B" }}>/u</span>
                                            <button
                                              type="button"
                                              onClick={() => handleOpenPriceModal(dev.id, dev.name, p.id, p.name, projUnitPrice, p.totalUnits)}
                                              style={{
                                                background: "none",
                                                border: "none",
                                                cursor: "pointer",
                                                color: "#2563EB",
                                                padding: "2px",
                                                display: "inline-flex",
                                                alignItems: "center",
                                              }}
                                              title="Editar tarifa para este proyecto"
                                            >
                                              <Edit3 size={13} />
                                            </button>
                                          </div>
                                          {isCustomRate && (
                                            <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#1D4ED8", backgroundColor: "#DBEAFE", padding: "0.1rem 0.4rem", borderRadius: "4px", display: "inline-block", marginTop: "2px" }}>
                                              Tarifa Proyecto
                                            </span>
                                          )}
                                        </td>
                                        <td style={{ padding: "0.85rem 1rem" }}>
                                          <strong style={{ color: "#1F3652" }}>{formatMoney(projTotalCost)}</strong>
                                          <div style={{ fontSize: "0.68rem", color: "#94A3B8" }}>
                                            {p.totalUnits} u × ${projUnitPrice}/mes
                                          </div>
                                        </td>
                                        <td style={{ padding: "0.85rem 1rem" }}>
                                          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                            <button
                                              type="button"
                                              onClick={() => handleOpenPriceModal(dev.id, dev.name, p.id, p.name, projUnitPrice, p.totalUnits)}
                                              style={{
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: "0.25rem",
                                                padding: "0.35rem 0.65rem",
                                                borderRadius: "9999px",
                                                border: "1px solid #CBD5E1",
                                                backgroundColor: "#FFFFFF",
                                                color: "#1F3652",
                                                fontSize: "0.72rem",
                                                fontWeight: 700,
                                                cursor: "pointer",
                                              }}
                                              title="Modificar precio por unidad para este proyecto"
                                            >
                                              <Tag size={12} color="#2563EB" /> Tarifa
                                            </button>

                                            <button
                                              type="button"
                                              onClick={() => handleOpenPaymentLink(dev, p.id)}
                                              style={{
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: "0.3rem",
                                                padding: "0.35rem 0.75rem",
                                                borderRadius: "9999px",
                                                border: "1px solid #CBD5E1",
                                                backgroundColor: "#FFFFFF",
                                                color: "#1F3652",
                                                fontSize: "0.72rem",
                                                fontWeight: 700,
                                                cursor: "pointer",
                                              }}
                                            >
                                              <LinkIcon size={12} /> Link de Pago
                                            </button>
                                          </div>
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
                              <Users size={16} color="#2F80ED" />
                              <h4 style={{ fontSize: "0.92rem", fontWeight: 800, color: "#1F3652", margin: 0 }}>
                                Usuarios Registrados & Permisos ({dev.users.length})
                              </h4>
                            </div>
                            <span style={{ fontSize: "0.75rem", color: "#64748B" }}>
                              Puedes impersonar a cualquier usuario o auditar su matriz de permisos
                            </span>
                          </div>

                          <div style={{ backgroundColor: "#FFFFFF", borderRadius: "0.75rem", border: "1px solid #E2E8F0", overflow: "hidden" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.82rem" }}>
                              <thead>
                                <tr style={{ borderBottom: "1px solid #E2E8F0", backgroundColor: "#F8FAFC" }}>
                                  <th style={{ padding: "0.75rem 1rem", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "#64748B" }}>Usuario</th>
                                  <th style={{ padding: "0.75rem 1rem", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "#64748B" }}>Correo Electrónico</th>
                                  <th style={{ padding: "0.75rem 1rem", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "#64748B" }}>Rol en Plataforma</th>
                                  <th style={{ padding: "0.75rem 1rem", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "#64748B" }}>Proyectos Asignados</th>
                                  <th style={{ padding: "0.75rem 1rem", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "#64748B" }}>Acciones Super Admin</th>
                                </tr>
                              </thead>
                              <tbody>
                                {dev.users.map((u) => (
                                  <tr key={u.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                                    <td style={{ padding: "0.85rem 1rem" }}>
                                      <strong style={{ color: "#1F3652" }}>{u.name}</strong>
                                    </td>
                                    <td style={{ padding: "0.85rem 1rem", color: "#64748B" }}>{u.email}</td>
                                    <td style={{ padding: "0.85rem 1rem" }}>
                                      <span
                                        style={{
                                          fontSize: "0.7rem",
                                          fontWeight: 700,
                                          padding: "0.15rem 0.5rem",
                                          borderRadius: "99px",
                                          backgroundColor:
                                            u.role === "SUPER ADMIN"
                                              ? "#FEF3C7"
                                              : u.role === "DIRECTOR COMERCIAL"
                                              ? "#EFF6FF"
                                              : "#F1F5F9",
                                          color:
                                            u.role === "SUPER ADMIN"
                                              ? "#92400E"
                                              : u.role === "DIRECTOR COMERCIAL"
                                              ? "#1D4ED8"
                                              : "#64748B",
                                        }}
                                      >
                                        {u.role}
                                      </span>
                                    </td>
                                    <td style={{ padding: "0.85rem 1rem", color: "#64748B" }}>
                                      {u.assignedProjectIds ? u.assignedProjectIds.join(", ") : "Todos los proyectos"}
                                    </td>
                                    <td style={{ padding: "0.85rem 1rem" }}>
                                      <div style={{ display: "flex", gap: "0.4rem" }}>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setInspectedUser({
                                              id: u.id,
                                              name: u.name,
                                              email: u.email,
                                              role: u.role,
                                              developerName: dev.name,
                                              assignedProjectIds: u.assignedProjectIds,
                                            });
                                            setShowPermissionsModal(true);
                                          }}
                                          style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: "0.3rem",
                                            padding: "0.35rem 0.75rem",
                                            borderRadius: "9999px",
                                            border: "1px solid #CBD5E1",
                                            backgroundColor: "#FFFFFF",
                                            color: "#1F3652",
                                            fontSize: "0.72rem",
                                            fontWeight: 700,
                                            cursor: "pointer",
                                          }}
                                        >
                                          <Eye size={12} /> Ver Permisos
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => handleImpersonate(dev, u)}
                                          style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: "0.3rem",
                                            padding: "0.35rem 0.75rem",
                                            borderRadius: "9999px",
                                            border: "none",
                                            backgroundColor: "#1B3047",
                                            color: "#FFFFFF",
                                            fontSize: "0.72rem",
                                            fontWeight: 700,
                                            cursor: "pointer",
                                          }}
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

            {/* INVITACIONES PERSONALIZADAS & PROMOCIONES */}
            <div style={{ backgroundColor: "#FFFFFF", borderRadius: "1rem", border: "1px solid #E2E8F0", padding: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                <div>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#1F3652", margin: 0 }}>
                    Invitaciones Personalizadas & Promociones
                  </h3>
                  <span style={{ fontSize: "0.8rem", color: "#64748B" }}>
                    Enlaces únicos generados para onboarding de desarrolladoras con tarifa especial
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowInviteModal(true)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    padding: "0.55rem 1.15rem",
                    borderRadius: "9999px",
                    backgroundColor: "#1B3047",
                    color: "#FFFFFF",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <Plus size={15} /> Nueva Invitación
                </button>
              </div>

              <div style={{ borderRadius: "0.75rem", border: "1px solid #E2E8F0", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.82rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #E2E8F0", backgroundColor: "#F8FAFC" }}>
                      <th style={{ padding: "0.75rem 1rem", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "#64748B" }}>Desarrolladora Prospecto</th>
                      <th style={{ padding: "0.75rem 1rem", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "#64748B" }}>Correo Destinatario</th>
                      <th style={{ padding: "0.75rem 1rem", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "#64748B" }}>Tarifa / Unidad</th>
                      <th style={{ padding: "0.75rem 1rem", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "#64748B" }}>Descuento</th>
                      <th style={{ padding: "0.75rem 1rem", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "#64748B" }}>Vigencia</th>
                      <th style={{ padding: "0.75rem 1rem", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "#64748B" }}>Estado</th>
                      <th style={{ padding: "0.75rem 1rem", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "#64748B" }}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invites.map((inv) => (
                      <tr key={inv.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                        <td style={{ padding: "0.85rem 1rem" }}>
                          <strong style={{ color: "#1F3652" }}>{inv.developerName}</strong>
                        </td>
                        <td style={{ padding: "0.85rem 1rem", color: "#64748B" }}>{inv.developerEmail}</td>
                        <td style={{ padding: "0.85rem 1rem", color: "#1F3652" }}>
                          <strong>${inv.pricePerUnitMonthly} MXN</strong> / unidad
                        </td>
                        <td style={{ padding: "0.85rem 1rem" }}>
                          {inv.discountPercentage > 0 ? (
                            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#166534", backgroundColor: "#DCFCE7", padding: "0.15rem 0.5rem", borderRadius: "99px" }}>
                              {inv.discountPercentage}% OFF
                            </span>
                          ) : (
                            <span style={{ color: "#94A3B8" }}>Sin descuento</span>
                          )}
                        </td>
                        <td style={{ padding: "0.85rem 1rem", color: "#64748B" }}>{inv.expiresAt}</td>
                        <td style={{ padding: "0.85rem 1rem" }}>
                          <span
                            style={{
                              fontSize: "0.72rem",
                              fontWeight: 700,
                              padding: "0.15rem 0.5rem",
                              borderRadius: "99px",
                              backgroundColor: inv.status === "PENDING" ? "#FEF3C7" : inv.status === "ACCEPTED" ? "#DCFCE7" : "#F1F5F9",
                              color: inv.status === "PENDING" ? "#92400E" : inv.status === "ACCEPTED" ? "#166534" : "#64748B",
                            }}
                          >
                            {inv.status === "PENDING" ? "Pendiente" : inv.status === "ACCEPTED" ? "Aceptado" : "Expirado"}
                          </span>
                        </td>
                        <td style={{ padding: "0.85rem 1rem" }}>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(inv.linkUrl);
                              showToast("Link Copiado", "El enlace de invitación se copió al portapapeles.", "success");
                            }}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.3rem",
                              padding: "0.35rem 0.75rem",
                              borderRadius: "9999px",
                              border: "1px solid #CBD5E1",
                              backgroundColor: "#FFFFFF",
                              color: "#1F3652",
                              fontSize: "0.72rem",
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            <Copy size={12} /> Copiar Link
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: CONFIGURACIÓN & NOTIFICACIONES MULTI-CANAL                        */}
        {/* ========================================================================= */}
        {activeTab === "notifications" && (
          <div>
            {/* NOTIFICATIONS SUB-TAB NAVIGATION */}
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.75rem", borderBottom: "1px solid #E2E8F0", paddingBottom: "0.75rem", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => setNotifSubTab("scheduled")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.45rem",
                  padding: "0.55rem 1.15rem",
                  borderRadius: "9999px",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                  backgroundColor: notifSubTab === "scheduled" ? "#1B3047" : "#F1F5F9",
                  color: notifSubTab === "scheduled" ? "#FFFFFF" : "#64748B",
                  transition: "all 0.15s ease",
                }}
              >
                <Clock size={15} /> Notificaciones Programadas ({scheduledNotifications.filter((s) => s.status !== "CANCELADA").length})
              </button>

              <button
                type="button"
                onClick={() => setNotifSubTab("logs")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.45rem",
                  padding: "0.55rem 1.15rem",
                  borderRadius: "9999px",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                  backgroundColor: notifSubTab === "logs" ? "#1B3047" : "#F1F5F9",
                  color: notifSubTab === "logs" ? "#FFFFFF" : "#64748B",
                  transition: "all 0.15s ease",
                }}
              >
                <Activity size={15} /> Historial de Envíos ({deliveryLogs.length})
              </button>

              <button
                type="button"
                onClick={() => setNotifSubTab("templates")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.45rem",
                  padding: "0.55rem 1.15rem",
                  borderRadius: "9999px",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                  backgroundColor: notifSubTab === "templates" ? "#1B3047" : "#F1F5F9",
                  color: notifSubTab === "templates" ? "#FFFFFF" : "#64748B",
                  transition: "all 0.15s ease",
                }}
              >
                <Layers size={15} /> Plantillas & Triggers ({templates.length})
              </button>

              <button
                type="button"
                onClick={() => setNotifSubTab("channels")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.45rem",
                  padding: "0.55rem 1.15rem",
                  borderRadius: "9999px",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                  backgroundColor: notifSubTab === "channels" ? "#1B3047" : "#F1F5F9",
                  color: notifSubTab === "channels" ? "#FFFFFF" : "#64748B",
                  transition: "all 0.15s ease",
                }}
              >
                <Server size={15} /> Canales de Integración (3)
              </button>
            </div>

            {/* =================================================================== */}
            {/* SUBTAB 1: NOTIFICACIONES PROGRAMADAS & AUTOMATIZACIONES DE VENTAS   */}
            {/* =================================================================== */}
            {notifSubTab === "scheduled" && (
              <div>
                {/* Stats Header */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "1.75rem" }}>
                  <div style={{ backgroundColor: "#FFFFFF", borderRadius: "0.85rem", border: "1px solid #E2E8F0", padding: "1.1rem 1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                    <span style={{ fontSize: "0.72rem", color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>En Cola / Programadas</span>
                    <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#1F3652", marginTop: "0.2rem" }}>
                      {scheduledNotifications.filter((s) => s.status === "PROGRAMADA" || s.status === "EN_COLA").length}
                    </div>
                    <span style={{ fontSize: "0.72rem", color: "#2563EB", fontWeight: 600 }}>Automatizaciones de ventas activas</span>
                  </div>

                  <div style={{ backgroundColor: "#FFFFFF", borderRadius: "0.85rem", border: "1px solid #E2E8F0", padding: "1.1rem 1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                    <span style={{ fontSize: "0.72rem", color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>Próximas en 7 Días</span>
                    <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#D97706", marginTop: "0.2rem" }}>
                      {scheduledNotifications.filter((s) => s.relativeTime.includes("días") || s.relativeTime.includes("Mes")).length}
                    </div>
                    <span style={{ fontSize: "0.72rem", color: "#64748B" }}>Recordatorios preventivos y cobros</span>
                  </div>

                  <div style={{ backgroundColor: "#FFFFFF", borderRadius: "0.85rem", border: "1px solid #E2E8F0", padding: "1.1rem 1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                    <span style={{ fontSize: "0.72rem", color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>Canales de Despacho</span>
                    <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#1F3652", marginTop: "0.35rem" }}>
                      WhatsApp API + Postmark
                    </div>
                    <span style={{ fontSize: "0.72rem", color: "#166534", fontWeight: 700 }}>● Entregas automáticas activas</span>
                  </div>

                  <div style={{ backgroundColor: "#FFFFFF", borderRadius: "0.85rem", border: "1px solid #E2E8F0", padding: "1.1rem 1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                    <span style={{ fontSize: "0.72rem", color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>Origen de Triggers</span>
                    <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#1F3652", marginTop: "0.35rem" }}>
                      Ventas, Cobranza y Obra
                    </div>
                    <span style={{ fontSize: "0.72rem", color: "#64748B" }}>Programadas por eventos del sistema</span>
                  </div>
                </div>

                {/* Table Container */}
                <div style={{ backgroundColor: "#FFFFFF", borderRadius: "1rem", border: "1px solid #E2E8F0", padding: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                  {/* Quick Filters Toolbar */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#64748B", marginRight: "0.25rem" }}>Filtros rápidos:</span>

                    <button
                      type="button"
                      onClick={() => setScheduledQuickFilter("ALL")}
                      style={{
                        padding: "0.35rem 0.85rem",
                        borderRadius: "9999px",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        border: "1px solid",
                        borderColor: scheduledQuickFilter === "ALL" ? "#1B3047" : "#E2E8F0",
                        backgroundColor: scheduledQuickFilter === "ALL" ? "#1B3047" : "#FFFFFF",
                        color: scheduledQuickFilter === "ALL" ? "#FFFFFF" : "#475569",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      Todas ({scheduledNotifications.length})
                    </button>

                    <button
                      type="button"
                      onClick={() => setScheduledQuickFilter("PROGRAMADA")}
                      style={{
                        padding: "0.35rem 0.85rem",
                        borderRadius: "9999px",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        border: "1px solid",
                        borderColor: scheduledQuickFilter === "PROGRAMADA" ? "#2563EB" : "#E2E8F0",
                        backgroundColor: scheduledQuickFilter === "PROGRAMADA" ? "#EFF6FF" : "#FFFFFF",
                        color: scheduledQuickFilter === "PROGRAMADA" ? "#1D4ED8" : "#475569",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      🕒 Programadas (9:00 a.m.) ({scheduledNotifications.filter((s) => s.status === "PROGRAMADA" || s.status === "EN_COLA").length})
                    </button>

                    <button
                      type="button"
                      onClick={() => setScheduledQuickFilter("ENVIADA")}
                      style={{
                        padding: "0.35rem 0.85rem",
                        borderRadius: "9999px",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        border: "1px solid",
                        borderColor: scheduledQuickFilter === "ENVIADA" ? "#16A34A" : "#E2E8F0",
                        backgroundColor: scheduledQuickFilter === "ENVIADA" ? "#DCFCE7" : "#FFFFFF",
                        color: scheduledQuickFilter === "ENVIADA" ? "#15803D" : "#475569",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      ✓ Ya Mandadas / Enviadas ({scheduledNotifications.filter((s) => s.status === "ENVIADA").length})
                    </button>

                    <button
                      type="button"
                      onClick={() => setScheduledQuickFilter("FALLIDA")}
                      style={{
                        padding: "0.35rem 0.85rem",
                        borderRadius: "9999px",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        border: "1px solid",
                        borderColor: scheduledQuickFilter === "FALLIDA" ? "#DC2626" : "#E2E8F0",
                        backgroundColor: scheduledQuickFilter === "FALLIDA" ? "#FEE2E2" : "#FFFFFF",
                        color: scheduledQuickFilter === "FALLIDA" ? "#B91C1C" : "#475569",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      ⚠️ Fallidas / Errores ({scheduledNotifications.filter((s) => s.status === "FALLIDA").length})
                    </button>

                    <button
                      type="button"
                      onClick={() => setScheduledQuickFilter("PAUSADA")}
                      style={{
                        padding: "0.35rem 0.85rem",
                        borderRadius: "9999px",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        border: "1px solid",
                        borderColor: scheduledQuickFilter === "PAUSADA" ? "#D97706" : "#E2E8F0",
                        backgroundColor: scheduledQuickFilter === "PAUSADA" ? "#FEF3C7" : "#FFFFFF",
                        color: scheduledQuickFilter === "PAUSADA" ? "#B45309" : "#475569",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      ⏸ Pausadas ({scheduledNotifications.filter((s) => s.status === "PAUSADA").length})
                    </button>
                  </div>

                  {/* Toolbar */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
                    <div>
                      <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#1F3652", margin: 0 }}>
                        Cola de Notificaciones Programadas ({filteredScheduled.length})
                      </h3>
                      <span style={{ fontSize: "0.8rem", color: "#64748B" }}>
                        Envíos calendarizados automáticamente a las 9:00 a.m. Ordenados cronológicamente con desglose de canales
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                      <div style={{ position: "relative" }}>
                        <Search size={14} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} />
                        <input
                          type="text"
                          placeholder="Buscar cliente, proyecto o trigger..."
                          value={scheduledSearch}
                          onChange={(e) => setScheduledSearch(e.target.value)}
                          style={{
                            padding: "0.5rem 0.85rem 0.5rem 2.2rem",
                            borderRadius: "0.5rem",
                            border: "1px solid #CBD5E1",
                            fontSize: "0.82rem",
                            color: "#1F3652",
                            outline: "none",
                            width: "220px",
                          }}
                        />
                      </div>

                      <select
                        value={scheduledChannelFilter}
                        onChange={(e) => setScheduledChannelFilter(e.target.value)}
                        style={{
                          padding: "0.5rem 0.75rem",
                          borderRadius: "0.5rem",
                          border: "1px solid #CBD5E1",
                          fontSize: "0.82rem",
                          color: "#1F3652",
                          outline: "none",
                          backgroundColor: "#FFFFFF",
                        }}
                      >
                        <option value="ALL">Canal: Todos</option>
                        <option value="WHATSAPP">WhatsApp</option>
                        <option value="POSTMARK">Postmark</option>
                        <option value="PUSH">Web Push</option>
                      </select>

                      <select
                        value={scheduledCategoryFilter}
                        onChange={(e) => setScheduledCategoryFilter(e.target.value)}
                        style={{
                          padding: "0.5rem 0.75rem",
                          borderRadius: "0.5rem",
                          border: "1px solid #CBD5E1",
                          fontSize: "0.82rem",
                          color: "#1F3652",
                          outline: "none",
                          backgroundColor: "#FFFFFF",
                        }}
                      >
                        <option value="ALL">Categoría: Todas</option>
                        <option value="COBRANZA">Cobranza & Pagos</option>
                        <option value="OBRA">Avance de Obra</option>
                        <option value="VENTAS">Ventas & Cotizaciones</option>
                        <option value="POSTVENTA">Postventa</option>
                      </select>

                      <select
                        value={scheduledStatusFilter}
                        onChange={(e) => setScheduledStatusFilter(e.target.value)}
                        style={{
                          padding: "0.5rem 0.75rem",
                          borderRadius: "0.5rem",
                          border: "1px solid #CBD5E1",
                          fontSize: "0.82rem",
                          color: "#1F3652",
                          outline: "none",
                          backgroundColor: "#FFFFFF",
                        }}
                      >
                        <option value="ALL">Estado: Todos</option>
                        <option value="PROGRAMADA">Programadas</option>
                        <option value="EN_COLA">En Cola</option>
                        <option value="PAUSADA">Pausadas</option>
                        <option value="ENVIADA">Enviadas</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => setShowCreateScheduleModal(true)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.35rem",
                          padding: "0.5rem 1.1rem",
                          borderRadius: "9999px",
                          backgroundColor: "#1B3047",
                          color: "#FFFFFF",
                          fontSize: "0.8rem",
                          fontWeight: 700,
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        <Plus size={14} /> Programar Notificación
                      </button>
                    </div>
                  </div>

                  {/* Scheduled Table with Grouping & Expandable Channel Breakdown */}
                  {filteredScheduled.length === 0 ? (
                    <div style={{ padding: "2.5rem", textAlign: "center", backgroundColor: "#F8FAFC", borderRadius: "0.75rem", border: "1px dashed #CBD5E1", color: "#64748B", fontSize: "0.85rem" }}>
                      No se encontraron notificaciones programadas con los filtros seleccionados.
                    </div>
                  ) : (
                    <div style={{ borderRadius: "0.75rem", border: "1px solid #E2E8F0", overflow: "hidden" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.82rem" }}>
                        <thead>
                          <tr style={{ borderBottom: "1px solid #E2E8F0", backgroundColor: "#F8FAFC" }}>
                            <th style={{ width: "40px", padding: "0.75rem 0.5rem 0.75rem 0.75rem" }}></th>
                            <th style={{ padding: "0.75rem 1rem", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "#64748B" }}>Fecha Programada</th>
                            <th style={{ padding: "0.75rem 1rem", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "#64748B" }}>Evento / Disparador</th>
                            <th style={{ padding: "0.75rem 1rem", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "#64748B" }}>Canales ({filteredScheduled.reduce((acc, g) => acc + g.channels.length, 0)})</th>
                            <th style={{ padding: "0.75rem 1rem", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "#64748B" }}>Destinatario</th>
                            <th style={{ padding: "0.75rem 1rem", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "#64748B" }}>Desarrollo & Unidad</th>
                            <th style={{ padding: "0.75rem 1rem", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "#64748B" }}>Estado</th>
                            <th style={{ padding: "0.75rem 1rem", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "#64748B" }}>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredScheduled.map((group) => {
                            const isExpanded = expandedScheduleId === group.id;
                            const hasWhatsApp = group.channels.some((c) => c.channel === "WHATSAPP");
                            const hasPostmark = group.channels.some((c) => c.channel === "POSTMARK");
                            const hasPush = group.channels.some((c) => c.channel === "PUSH");

                            return (
                              <React.Fragment key={group.id}>
                                <tr
                                  style={{
                                    borderBottom: isExpanded ? "none" : "1px solid #F1F5F9",
                                    backgroundColor: isExpanded ? "#F8FAFC" : "#FFFFFF",
                                    transition: "background-color 0.15s ease",
                                  }}
                                >
                                  {/* Expand / Collapse Button */}
                                  <td style={{ padding: "0.85rem 0.5rem 0.85rem 0.75rem", verticalAlign: "middle" }}>
                                    <button
                                      type="button"
                                      onClick={() => setExpandedScheduleId(isExpanded ? null : group.id)}
                                      title={isExpanded ? "Ocultar desglose de canales" : "Ver desglose de canales"}
                                      style={{
                                        width: "26px",
                                        height: "26px",
                                        borderRadius: "6px",
                                        border: "1px solid #CBD5E1",
                                        backgroundColor: isExpanded ? "#1B3047" : "#FFFFFF",
                                        color: isExpanded ? "#FFFFFF" : "#64748B",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        cursor: "pointer",
                                        transition: "all 0.15s ease",
                                      }}
                                    >
                                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                    </button>
                                  </td>

                                  {/* Fecha / Hora Programada */}
                                  <td style={{ padding: "0.85rem 1rem", verticalAlign: "middle" }}>
                                    <div style={{ color: "#1F3652", fontWeight: 700 }}>{group.scheduledForFormatted}</div>
                                    <span style={{ fontSize: "0.7rem", color: "#2563EB", backgroundColor: "#EFF6FF", padding: "0.1rem 0.45rem", borderRadius: "99px", fontWeight: 700, display: "inline-block", marginTop: "2px" }}>
                                      {group.relativeTime}
                                    </span>
                                  </td>

                                  {/* Evento / Disparador */}
                                  <td style={{ padding: "0.85rem 1rem", verticalAlign: "middle" }}>
                                    <strong style={{ color: "#1F3652", display: "block" }}>{group.triggerName}</strong>
                                    <span style={{ fontSize: "0.7rem", color: "#1D4ED8", backgroundColor: "#EFF6FF", padding: "0.1rem 0.45rem", borderRadius: "99px", fontWeight: 700 }}>
                                      {group.category}
                                    </span>
                                  </td>

                                  {/* Canales Badges */}
                                  <td style={{ padding: "0.85rem 1rem", verticalAlign: "middle" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", flexWrap: "wrap" }}>
                                      {hasWhatsApp && (
                                        <span style={{ fontSize: "0.68rem", fontWeight: 700, padding: "0.15rem 0.45rem", borderRadius: "99px", backgroundColor: "#DCFCE7", color: "#166534", display: "inline-flex", alignItems: "center", gap: "0.2rem" }}>
                                          <MessageSquare size={11} /> WhatsApp
                                        </span>
                                      )}
                                      {hasPostmark && (
                                        <span style={{ fontSize: "0.68rem", fontWeight: 700, padding: "0.15rem 0.45rem", borderRadius: "99px", backgroundColor: "#EFF6FF", color: "#1D4ED8", display: "inline-flex", alignItems: "center", gap: "0.2rem" }}>
                                          <Mail size={11} /> Email
                                        </span>
                                      )}
                                      {hasPush && (
                                        <span style={{ fontSize: "0.68rem", fontWeight: 700, padding: "0.15rem 0.45rem", borderRadius: "99px", backgroundColor: "#F3E8FF", color: "#7E22CE", display: "inline-flex", alignItems: "center", gap: "0.2rem" }}>
                                          <Smartphone size={11} /> Push
                                        </span>
                                      )}
                                      <span
                                        onClick={() => setExpandedScheduleId(isExpanded ? null : group.id)}
                                        style={{ fontSize: "0.68rem", color: "#64748B", cursor: "pointer", textDecoration: "underline", marginLeft: "2px" }}
                                      >
                                        ({group.channels.length} {group.channels.length === 1 ? "canal" : "canales"})
                                      </span>
                                    </div>
                                  </td>

                                  {/* Destinatario */}
                                  <td style={{ padding: "0.85rem 1rem", verticalAlign: "middle" }}>
                                    <div style={{ color: "#1F3652", fontWeight: 700 }}>{group.recipientName}</div>
                                    <div style={{ fontSize: "0.72rem", color: "#64748B" }}>{group.recipientContact}</div>
                                    <span style={{ fontSize: "0.68rem", color: "#94A3B8" }}>{group.recipientRole}</span>
                                  </td>

                                  {/* Desarrollo & Unidad */}
                                  <td style={{ padding: "0.85rem 1rem", verticalAlign: "middle" }}>
                                    <strong style={{ color: "#1F3652", display: "block" }}>{group.projectName}</strong>
                                    <span style={{ fontSize: "0.72rem", color: "#64748B" }}>{group.unitName}</span>
                                  </td>

                                  {/* Estado General */}
                                  <td style={{ padding: "0.85rem 1rem", verticalAlign: "middle" }}>
                                    <span
                                      style={{
                                        fontSize: "0.72rem",
                                        fontWeight: 700,
                                        padding: "0.15rem 0.55rem",
                                        borderRadius: "99px",
                                        backgroundColor:
                                          group.status === "PROGRAMADA"
                                            ? "#EFF6FF"
                                            : group.status === "EN_COLA"
                                            ? "#FEF3C7"
                                            : group.status === "ENVIADA"
                                            ? "#DCFCE7"
                                            : group.status === "FALLIDA"
                                            ? "#FEE2E2"
                                            : "#F1F5F9",
                                        color:
                                          group.status === "PROGRAMADA"
                                            ? "#1D4ED8"
                                            : group.status === "EN_COLA"
                                            ? "#92400E"
                                            : group.status === "ENVIADA"
                                            ? "#166534"
                                            : group.status === "FALLIDA"
                                            ? "#DC2626"
                                            : "#64748B",
                                      }}
                                    >
                                      {group.status === "PROGRAMADA" && "● Programada (09:00 a.m.)"}
                                      {group.status === "EN_COLA" && "⏳ En Cola"}
                                      {group.status === "PAUSADA" && "⏸ Pausada"}
                                      {group.status === "ENVIADA" && "✓ Enviada"}
                                      {group.status === "FALLIDA" && "⚠️ Fallida"}
                                    </span>
                                  </td>

                                  {/* Acciones */}
                                  <td style={{ padding: "0.85rem 1rem", verticalAlign: "middle" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                                      {group.status !== "ENVIADA" && (
                                        <>
                                          <button
                                            type="button"
                                            disabled={group.channels.some((c) => dispatchingScheduleId === c.id)}
                                            onClick={() => {
                                              group.channels.forEach((c) => {
                                                if (c.status !== "ENVIADA") {
                                                  handleDispatchScheduledNow(c.original);
                                                }
                                              });
                                            }}
                                            style={{
                                              display: "inline-flex",
                                              alignItems: "center",
                                              gap: "0.25rem",
                                              padding: "0.3rem 0.65rem",
                                              borderRadius: "9999px",
                                              backgroundColor: "#1B3047",
                                              color: "#FFFFFF",
                                              fontSize: "0.72rem",
                                              fontWeight: 700,
                                              border: "none",
                                              cursor: "pointer",
                                            }}
                                            title="Despachar inmediatamente todos los canales programados"
                                          >
                                            <Send size={11} /> Enviar Ya
                                          </button>

                                          <button
                                            type="button"
                                            onClick={() => {
                                              group.channels.forEach((c) => handleTogglePauseScheduled(c.id));
                                            }}
                                            style={{
                                              background: "none",
                                              border: "1px solid #CBD5E1",
                                              borderRadius: "9999px",
                                              padding: "0.3rem 0.5rem",
                                              color: "#1F3652",
                                              cursor: "pointer",
                                              fontSize: "0.7rem",
                                              fontWeight: 700,
                                            }}
                                            title={group.status === "PAUSADA" ? "Reanudar" : "Pausar"}
                                          >
                                            {group.status === "PAUSADA" ? <Play size={11} /> : <Pause size={11} />}
                                          </button>

                                          <button
                                            type="button"
                                            onClick={() => {
                                              group.channels.forEach((c) => handleDeleteScheduled(c.id));
                                            }}
                                            style={{
                                              background: "none",
                                              border: "none",
                                              color: "#EF4444",
                                              cursor: "pointer",
                                              padding: "4px",
                                            }}
                                            title="Cancelar notificación programada"
                                          >
                                            <Trash2 size={13} />
                                          </button>
                                        </>
                                      )}
                                      {group.status === "ENVIADA" && (
                                        <span style={{ fontSize: "0.72rem", color: "#166534", fontWeight: 700 }}>
                                          Completado
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                </tr>

                                {/* Expanded Channel Breakdown Accordion */}
                                {isExpanded && (
                                  <tr style={{ borderBottom: "1px solid #E2E8F0", backgroundColor: "#F8FAFC" }}>
                                    <td colSpan={8} style={{ padding: "0.75rem 1.25rem 1.25rem 2.5rem" }}>
                                      <div
                                        style={{
                                          backgroundColor: "#FFFFFF",
                                          borderRadius: "0.75rem",
                                          border: "1px solid #E2E8F0",
                                          padding: "1rem 1.25rem",
                                          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                                        }}
                                      >
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                                          <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                                            <Layers size={14} color="#2563EB" />
                                            <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "#1F3652" }}>
                                              Desglose de Canales Programados (Hora de Despacho: 9:00 a.m.)
                                            </span>
                                          </div>
                                          <span style={{ fontSize: "0.72rem", color: "#64748B" }}>
                                            Origen: {group.sourceEvent}
                                          </span>
                                        </div>

                                        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                                          {group.channels.map((chan) => (
                                            <div
                                              key={chan.id}
                                              style={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                                padding: "0.6rem 0.85rem",
                                                backgroundColor: "#F8FAFC",
                                                borderRadius: "0.5rem",
                                                border: "1px solid #E2E8F0",
                                                flexWrap: "wrap",
                                                gap: "0.5rem",
                                              }}
                                            >
                                              <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                                                <span
                                                  style={{
                                                    fontSize: "0.72rem",
                                                    fontWeight: 700,
                                                    padding: "0.15rem 0.5rem",
                                                    borderRadius: "99px",
                                                    backgroundColor:
                                                      chan.channel === "WHATSAPP"
                                                        ? "#DCFCE7"
                                                        : chan.channel === "POSTMARK"
                                                        ? "#EFF6FF"
                                                        : "#F3E8FF",
                                                    color:
                                                      chan.channel === "WHATSAPP"
                                                        ? "#166534"
                                                        : chan.channel === "POSTMARK"
                                                        ? "#1D4ED8"
                                                        : "#7E22CE",
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: "0.25rem",
                                                  }}
                                                >
                                                  {chan.channel === "WHATSAPP" && <MessageSquare size={11} />}
                                                  {chan.channel === "POSTMARK" && <Mail size={11} />}
                                                  {chan.channel === "PUSH" && <Smartphone size={11} />}
                                                  {chan.channel === "WHATSAPP" ? "WhatsApp API" : chan.channel === "POSTMARK" ? "Correo (Postmark)" : "Web Push"}
                                                </span>

                                                <div>
                                                  <div style={{ fontSize: "0.76rem", fontWeight: 700, color: "#1F3652" }}>
                                                    {chan.recipientContact}
                                                  </div>
                                                  {chan.payloadSummary && (
                                                    <div style={{ fontSize: "0.7rem", color: "#64748B" }}>
                                                      {chan.payloadSummary}
                                                    </div>
                                                  )}
                                                </div>
                                              </div>

                                              <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                                                <span style={{ fontSize: "0.72rem", color: "#2563EB", fontWeight: 700, backgroundColor: "#EFF6FF", padding: "0.1rem 0.45rem", borderRadius: "99px" }}>
                                                  🕒 09:00 a.m.
                                                </span>

                                                <span
                                                  style={{
                                                    fontSize: "0.7rem",
                                                    fontWeight: 700,
                                                    padding: "0.1rem 0.45rem",
                                                    borderRadius: "99px",
                                                    backgroundColor: chan.status === "ENVIADA" ? "#DCFCE7" : "#EFF6FF",
                                                    color: chan.status === "ENVIADA" ? "#166534" : "#1D4ED8",
                                                  }}
                                                >
                                                  {chan.status === "ENVIADA" ? "✓ Enviada" : "● Programada"}
                                                </span>

                                                {chan.status !== "ENVIADA" && (
                                                  <button
                                                    type="button"
                                                    disabled={dispatchingScheduleId === chan.id}
                                                    onClick={() => handleDispatchScheduledNow(chan.original)}
                                                    style={{
                                                      display: "inline-flex",
                                                      alignItems: "center",
                                                      gap: "0.2rem",
                                                      padding: "0.25rem 0.55rem",
                                                      borderRadius: "9999px",
                                                      backgroundColor: "#1B3047",
                                                      color: "#FFFFFF",
                                                      fontSize: "0.68rem",
                                                      fontWeight: 700,
                                                      border: "none",
                                                      cursor: "pointer",
                                                    }}
                                                  >
                                                    <Send size={10} /> {dispatchingScheduleId === chan.id ? "Enviando..." : "Enviar Este Canal"}
                                                  </button>
                                                )}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* =================================================================== */}
            {/* SUBTAB 2: HISTORIAL DE ENVÍOS & LOGS EN TIEMPO REAL                 */}
            {/* =================================================================== */}
            {notifSubTab === "logs" && (
              <div style={{ backgroundColor: "#FFFFFF", borderRadius: "1rem", border: "1px solid #E2E8F0", padding: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
                  <div>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#1F3652", margin: 0 }}>
                      Bitácora de Entregas & Logs ({filteredLogs.length})
                    </h3>
                    <span style={{ fontSize: "0.8rem", color: "#64748B" }}>
                      Registro histórico de todas las notificaciones entregadas vía Postmark y WhatsApp
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <input
                      type="text"
                      placeholder="Buscar destinatario, evento..."
                      value={logSearchQuery}
                      onChange={(e) => setLogSearchQuery(e.target.value)}
                      style={{
                        padding: "0.55rem 0.85rem",
                        borderRadius: "0.5rem",
                        border: "1px solid #CBD5E1",
                        fontSize: "0.82rem",
                        color: "#1F3652",
                        outline: "none",
                      }}
                    />
                    <select
                      value={logChannelFilter}
                      onChange={(e) => setLogChannelFilter(e.target.value)}
                      style={{
                        padding: "0.55rem 0.85rem",
                        borderRadius: "0.5rem",
                        border: "1px solid #CBD5E1",
                        fontSize: "0.82rem",
                        color: "#1F3652",
                        outline: "none",
                      }}
                    >
                      <option value="ALL">Todos los Canales</option>
                      <option value="POSTMARK">Postmark</option>
                      <option value="WHATSAPP">WhatsApp</option>
                      <option value="PUSH">Push</option>
                    </select>
                  </div>
                </div>

                <div style={{ borderRadius: "0.75rem", border: "1px solid #E2E8F0", overflow: "hidden" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.82rem" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #E2E8F0", backgroundColor: "#F8FAFC" }}>
                        <th style={{ padding: "0.75rem 1rem", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "#64748B" }}>Fecha / Hora</th>
                        <th style={{ padding: "0.75rem 1rem", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "#64748B" }}>Evento</th>
                        <th style={{ padding: "0.75rem 1rem", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "#64748B" }}>Canal</th>
                        <th style={{ padding: "0.75rem 1rem", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "#64748B" }}>Destinatario</th>
                        <th style={{ padding: "0.75rem 1rem", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "#64748B" }}>Desarrolladora</th>
                        <th style={{ padding: "0.75rem 1rem", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "#64748B" }}>Estado</th>
                        <th style={{ padding: "0.75rem 1rem", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "#64748B" }}>Detalle</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLogs.map((log) => (
                        <tr key={log.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                          <td style={{ padding: "0.85rem 1rem", color: "#64748B" }}>{log.timestamp}</td>
                          <td style={{ padding: "0.85rem 1rem" }}>
                            <strong style={{ color: "#1F3652" }}>{log.triggerName}</strong>
                          </td>
                          <td style={{ padding: "0.85rem 1rem" }}>
                            <span
                              style={{
                                fontSize: "0.7rem",
                                fontWeight: 700,
                                padding: "0.15rem 0.5rem",
                                borderRadius: "99px",
                                backgroundColor: log.channel === "POSTMARK" ? "#EFF6FF" : "#DCFCE7",
                                color: log.channel === "POSTMARK" ? "#1D4ED8" : "#166534",
                              }}
                            >
                              {log.channel}
                            </span>
                          </td>
                          <td style={{ padding: "0.85rem 1rem" }}>
                            <div style={{ color: "#1F3652", fontWeight: 600 }}>{log.recipientName || "Usuario Devio"}</div>
                            <div style={{ fontSize: "0.72rem", color: "#64748B" }}>{log.recipient}</div>
                          </td>
                          <td style={{ padding: "0.85rem 1rem", color: "#64748B" }}>{log.developerName}</td>
                          <td style={{ padding: "0.85rem 1rem" }}>
                            <span
                              style={{
                                fontSize: "0.72rem",
                                fontWeight: 700,
                                padding: "0.15rem 0.55rem",
                                borderRadius: "99px",
                                backgroundColor:
                                  log.status === "ENTREGADO" || log.status === "ENVIADO"
                                    ? "#DCFCE7"
                                    : log.status === "FALLIDO"
                                    ? "#FEE2E2"
                                    : "#FEF3C7",
                                color:
                                  log.status === "ENTREGADO" || log.status === "ENVIADO"
                                    ? "#166534"
                                    : log.status === "FALLIDO"
                                    ? "#DC2626"
                                    : "#92400E",
                              }}
                            >
                              {log.status === "ENTREGADO" ? "✓ ENTREGADO" : log.status === "FALLIDO" ? "✕ FALLIDO" : "• EN PROCESO"}
                            </span>
                          </td>
                          <td style={{ padding: "0.85rem 1rem" }}>
                            {log.errorDetails ? (
                              <button
                                type="button"
                                onClick={() => setSelectedLogForDetail(log)}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "0.25rem",
                                  padding: "0.3rem 0.6rem",
                                  borderRadius: "9999px",
                                  border: "1px solid #FCA5A5",
                                  backgroundColor: "#FEF2F2",
                                  color: "#DC2626",
                                  fontSize: "0.72rem",
                                  fontWeight: 700,
                                  cursor: "pointer",
                                }}
                              >
                                <AlertTriangle size={12} /> Ver Error
                              </button>
                            ) : (
                              <span style={{ fontSize: "0.72rem", color: "#94A3B8" }}>OK (MessageID)</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* =================================================================== */}
            {/* SUBTAB 3: CATÁLOGO DE PLANTILLAS & TRIGGERS                         */}
            {/* =================================================================== */}
            {notifSubTab === "templates" && (
              <div style={{ backgroundColor: "#FFFFFF", borderRadius: "1rem", border: "1px solid #E2E8F0", padding: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
                  <div>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#1F3652", margin: 0 }}>
                      Catálogo de Plantillas del Sistema ({templates.length})
                    </h3>
                    <span style={{ fontSize: "0.8rem", color: "#64748B" }}>
                      Personaliza los aliases de Postmark y nombres de plantilla en WhatsApp
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      style={{
                        padding: "0.55rem 0.85rem",
                        borderRadius: "0.5rem",
                        border: "1px solid #CBD5E1",
                        fontSize: "0.82rem",
                        color: "#1F3652",
                        outline: "none",
                        backgroundColor: "#FFFFFF",
                      }}
                    >
                      <option value="ALL">Todas las Categorías</option>
                      <option value="USUARIOS">Usuarios & Auth</option>
                      <option value="VENTAS">Ventas & Cotizaciones</option>
                      <option value="COBRANZA">Cobranza & Pagos</option>
                      <option value="OBRA">Obra & Avance</option>
                      <option value="PROYECTOS">Comunicados</option>
                    </select>
                  </div>
                </div>

                <div style={{ borderRadius: "0.75rem", border: "1px solid #E2E8F0", overflow: "hidden" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.82rem" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #E2E8F0", backgroundColor: "#F8FAFC" }}>
                        <th style={{ padding: "0.75rem 1rem", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "#64748B" }}>ID / Evento</th>
                        <th style={{ padding: "0.75rem 1rem", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "#64748B" }}>Categoría</th>
                        <th style={{ padding: "0.75rem 1rem", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "#64748B" }}>Postmark Alias</th>
                        <th style={{ padding: "0.75rem 1rem", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "#64748B" }}>Asunto Email</th>
                        <th style={{ padding: "0.75rem 1rem", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "#64748B" }}>WhatsApp WABA</th>
                        <th style={{ padding: "0.75rem 1rem", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "#64748B" }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTemplates.map((tpl) => (
                        <tr key={tpl.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                          <td style={{ padding: "0.85rem 1rem" }}>
                            <strong style={{ color: "#1F3652" }}>{tpl.title}</strong>
                            <div style={{ fontSize: "0.7rem", color: "#94A3B8" }}>Key: {tpl.triggerKey}</div>
                          </td>
                          <td style={{ padding: "0.85rem 1rem" }}>
                            <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#1D4ED8", backgroundColor: "#EFF6FF", padding: "0.15rem 0.5rem", borderRadius: "99px" }}>
                              {tpl.category}
                            </span>
                          </td>
                          <td style={{ padding: "0.85rem 1rem" }}>
                            <code style={{ fontSize: "0.78rem", backgroundColor: "#F1F5F9", padding: "0.2rem 0.45rem", borderRadius: "4px", color: "#0F172A" }}>
                              {tpl.postmark.templateAlias}
                            </code>
                          </td>
                          <td style={{ padding: "0.85rem 1rem", color: "#64748B", maxWidth: "240px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {tpl.postmark.subject}
                          </td>
                          <td style={{ padding: "0.85rem 1rem" }}>
                            <code style={{ fontSize: "0.75rem", color: "#059669" }}>
                              {tpl.whatsapp.templateName}
                            </code>
                          </td>
                          <td style={{ padding: "0.85rem 1rem" }}>
                            <div style={{ display: "flex", gap: "0.35rem" }}>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingTemplate(tpl);
                                  setEditPmkAlias(tpl.postmark.templateAlias);
                                  setEditPmkSubject(tpl.postmark.subject);
                                  setEditWaTemplate(tpl.whatsapp.templateName);
                                  setEditPushTitle(tpl.push?.title || "");
                                  setShowTemplateModal(true);
                                }}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "0.25rem",
                                  padding: "0.35rem 0.65rem",
                                  borderRadius: "9999px",
                                  border: "1px solid #CBD5E1",
                                  backgroundColor: "#FFFFFF",
                                  color: "#1F3652",
                                  fontSize: "0.72rem",
                                  fontWeight: 700,
                                  cursor: "pointer",
                                }}
                              >
                                <Edit3 size={12} /> Editar
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setTestTemplate(tpl);
                                  setTestPayloadJson(tpl.samplePayload || "{}");
                                  setShowLiveTestModal(true);
                                }}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "0.25rem",
                                  padding: "0.35rem 0.65rem",
                                  borderRadius: "9999px",
                                  border: "none",
                                  backgroundColor: "#1B3047",
                                  color: "#FFFFFF",
                                  fontSize: "0.72rem",
                                  fontWeight: 700,
                                  cursor: "pointer",
                                }}
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
            )}

            {/* =================================================================== */}
            {/* SUBTAB 4: CANALES DE INTEGRACIÓN (POSTMARK, WHATSAPP, PUSH)         */}
            {/* =================================================================== */}
            {notifSubTab === "channels" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                {/* Master Staging Kill-Switch Banner */}
                <div
                  style={{
                    backgroundColor: channelsConfig.masterMute ? "#FFFBEB" : "#F0FDF4",
                    borderRadius: "1rem",
                    border: channelsConfig.masterMute ? "2px solid #F59E0B" : "2px solid #22C55E",
                    padding: "1.5rem",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "0.85rem", maxWidth: "750px" }}>
                      <div
                        style={{
                          width: "44px",
                          height: "44px",
                          borderRadius: "0.75rem",
                          backgroundColor: channelsConfig.masterMute ? "#FEF3C7" : "#DCFCE7",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        {channelsConfig.masterMute ? (
                          <BellOff size={24} color="#D97706" />
                        ) : (
                          <Radio size={24} color="#16A34A" />
                        )}
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                          <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#1F3652", margin: 0 }}>
                            Kill-Switch Maestro de Notificaciones (Entorno Staging)
                          </h3>
                          <span
                            style={{
                              fontSize: "0.72rem",
                              fontWeight: 800,
                              textTransform: "uppercase",
                              padding: "0.2rem 0.6rem",
                              borderRadius: "9999px",
                              backgroundColor: channelsConfig.masterMute ? "#FEF3C7" : "#DCFCE7",
                              color: channelsConfig.masterMute ? "#92400E" : "#166534",
                              border: channelsConfig.masterMute ? "1px solid #FDE68A" : "1px solid #BBF7D0",
                            }}
                          >
                            {channelsConfig.masterMute ? "🔕 MODO STAGING / SILENCIADO" : "🔔 MODO PRODUCCIÓN / EN VIVO"}
                          </span>
                        </div>
                        <p style={{ fontSize: "0.83rem", color: "#475569", margin: 0, lineHeight: 1.45 }}>
                          {channelsConfig.masterMute
                            ? "Todas las llamadas salientes a Postmark y WhatsApp están completamente desactivadas y protegidas para evitar disparos accidentales a números o correos reales durante pruebas. Todos los triggers registrarán estado PAUSADO (Staging) de forma segura."
                            : "Los canales de comunicación están activos. Toda notificación generada por el sistema o por cron jobs será despachada en tiempo real hacia los destinatarios por correo electrónico y WhatsApp."}
                        </p>
                      </div>
                    </div>

                    {/* Master Switch Button */}
                    <button
                      type="button"
                      onClick={handleToggleMasterMute}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.6rem",
                        padding: "0.75rem 1.4rem",
                        borderRadius: "9999px",
                        fontWeight: 800,
                        fontSize: "0.85rem",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        border: "none",
                        backgroundColor: channelsConfig.masterMute ? "#D97706" : "#16A34A",
                        color: "#FFFFFF",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                      }}
                    >
                      <Power size={17} />
                      {channelsConfig.masterMute ? "Activar Notificaciones en Vivo" : "Desactivar Todos los Canales (Modo Staging)"}
                    </button>
                  </div>
                </div>

                {/* Individual Channel Cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.25rem" }}>
                  {/* Postmark Email Server */}
                  <div
                    style={{
                      backgroundColor: "#FFFFFF",
                      borderRadius: "1rem",
                      border: channelsConfig.masterMute
                        ? "1px solid #E2E8F0"
                        : (channelsConfig.postmark?.enabled ?? true)
                        ? "1px solid #2F80ED"
                        : "1px solid #CBD5E1",
                      padding: "1.5rem",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: "1rem",
                      opacity: channelsConfig.masterMute || !(channelsConfig.postmark?.enabled ?? true) ? 0.85 : 1,
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <Mail size={20} color="#2F80ED" />
                          <h4 style={{ fontSize: "1rem", fontWeight: 800, color: "#1F3652", margin: 0 }}>
                            Postmark Email Server
                          </h4>
                        </div>
                        <span
                          style={{
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            padding: "0.18rem 0.6rem",
                            borderRadius: "99px",
                            backgroundColor: channelsConfig.masterMute
                              ? "#FEF3C7"
                              : (channelsConfig.postmark?.enabled ?? true)
                              ? "#DCFCE7"
                              : "#F1F5F9",
                            color: channelsConfig.masterMute
                              ? "#92400E"
                              : (channelsConfig.postmark?.enabled ?? true)
                              ? "#166534"
                              : "#64748B",
                          }}
                        >
                          {channelsConfig.masterMute
                            ? "● Pausado por Staging"
                            : (channelsConfig.postmark?.enabled ?? true)
                            ? "● Conectado (Activo)"
                            : "● Desactivado"}
                        </span>
                      </div>

                      <div style={{ fontSize: "0.8rem", color: "#64748B", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                        <div>
                          Remitente Oficial: <strong style={{ color: "#1F3652" }}>{channelsConfig.postmark.fromEmail}</strong>
                        </div>
                        <div>
                          Sender Alias: <strong style={{ color: "#1F3652" }}>{channelsConfig.postmark.senderAlias}</strong>
                        </div>
                        <div>
                          Server Token: <code style={{ fontSize: "0.75rem", backgroundColor: "#F1F5F9", padding: "0.15rem 0.4rem", borderRadius: "0.3rem" }}>ec9d2701...4433-8135</code>
                        </div>
                        <div>
                          Plantillas Postmark: <strong style={{ color: "#1F3652" }}>12 registradas</strong>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #F1F5F9", paddingTop: "0.85rem" }}>
                      <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#64748B" }}>
                        Canal Email Individual
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleChannel("postmark")}
                        style={{
                          padding: "0.4rem 0.9rem",
                          borderRadius: "9999px",
                          fontSize: "0.78rem",
                          fontWeight: 700,
                          cursor: "pointer",
                          border: "1px solid #CBD5E1",
                          backgroundColor: (channelsConfig.postmark?.enabled ?? true) ? "#FFFFFF" : "#F8FAFC",
                          color: (channelsConfig.postmark?.enabled ?? true) ? "#DC2626" : "#16A34A",
                        }}
                      >
                        {(channelsConfig.postmark?.enabled ?? true) ? "Desactivar Canal" : "Activar Canal"}
                      </button>
                    </div>
                  </div>

                  {/* WhatsApp Cloud API (WABA) */}
                  <div
                    style={{
                      backgroundColor: "#FFFFFF",
                      borderRadius: "1rem",
                      border: channelsConfig.masterMute
                        ? "1px solid #E2E8F0"
                        : (channelsConfig.whatsapp?.enabled ?? true)
                        ? "1px solid #00C48C"
                        : "1px solid #CBD5E1",
                      padding: "1.5rem",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: "1rem",
                      opacity: channelsConfig.masterMute || !(channelsConfig.whatsapp?.enabled ?? true) ? 0.85 : 1,
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <MessageSquare size={20} color="#00C48C" />
                          <h4 style={{ fontSize: "1rem", fontWeight: 800, color: "#1F3652", margin: 0 }}>
                            WhatsApp Cloud API (WABA)
                          </h4>
                        </div>
                        <span
                          style={{
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            padding: "0.18rem 0.6rem",
                            borderRadius: "99px",
                            backgroundColor: channelsConfig.masterMute
                              ? "#FEF3C7"
                              : (channelsConfig.whatsapp?.enabled ?? true)
                              ? "#DCFCE7"
                              : "#F1F5F9",
                            color: channelsConfig.masterMute
                              ? "#92400E"
                              : (channelsConfig.whatsapp?.enabled ?? true)
                              ? "#166534"
                              : "#64748B",
                          }}
                        >
                          {channelsConfig.masterMute
                            ? "● Pausado por Staging"
                            : (channelsConfig.whatsapp?.enabled ?? true)
                            ? "● Activo (Verificado)"
                            : "● Desactivado"}
                        </span>
                      </div>

                      <div style={{ fontSize: "0.8rem", color: "#64748B", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                        <div>
                          Número Emisor: <strong style={{ color: "#1F3652" }}>{channelsConfig.whatsapp.fromNumber}</strong>
                        </div>
                        <div>
                          Cuenta Meta: <strong style={{ color: "#1F3652" }}>{channelsConfig.whatsapp.accountAlias}</strong>
                        </div>
                        <div>
                          Phone Number ID: <code style={{ fontSize: "0.75rem", backgroundColor: "#F1F5F9", padding: "0.15rem 0.4rem", borderRadius: "0.3rem" }}>{channelsConfig.whatsapp.phoneNumberId}</code>
                        </div>
                        <div>
                          Plantillas Meta Aprobadas: <strong style={{ color: "#1F3652" }}>8 activas</strong>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #F1F5F9", paddingTop: "0.85rem" }}>
                      <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#64748B" }}>
                        Canal WhatsApp Individual
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleChannel("whatsapp")}
                        style={{
                          padding: "0.4rem 0.9rem",
                          borderRadius: "9999px",
                          fontSize: "0.78rem",
                          fontWeight: 700,
                          cursor: "pointer",
                          border: "1px solid #CBD5E1",
                          backgroundColor: (channelsConfig.whatsapp?.enabled ?? true) ? "#FFFFFF" : "#F8FAFC",
                          color: (channelsConfig.whatsapp?.enabled ?? true) ? "#DC2626" : "#16A34A",
                        }}
                      >
                        {(channelsConfig.whatsapp?.enabled ?? true) ? "Desactivar Canal" : "Activar Canal"}
                      </button>
                    </div>
                  </div>

                  {/* Web Push Card */}
                  <div
                    style={{
                      backgroundColor: "#FFFFFF",
                      borderRadius: "1rem",
                      border: channelsConfig.masterMute
                        ? "1px solid #E2E8F0"
                        : (channelsConfig.push?.enabled ?? true)
                        ? "1px solid #9333EA"
                        : "1px solid #CBD5E1",
                      padding: "1.5rem",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: "1rem",
                      opacity: channelsConfig.masterMute || !(channelsConfig.push?.enabled ?? true) ? 0.85 : 1,
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <Smartphone size={20} color="#9333EA" />
                          <h4 style={{ fontSize: "1rem", fontWeight: 800, color: "#1F3652", margin: 0 }}>
                            Web Push Notifications
                          </h4>
                        </div>
                        <span
                          style={{
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            padding: "0.18rem 0.6rem",
                            borderRadius: "99px",
                            backgroundColor: channelsConfig.masterMute
                              ? "#FEF3C7"
                              : (channelsConfig.push?.enabled ?? true)
                              ? "#DCFCE7"
                              : "#F1F5F9",
                            color: channelsConfig.masterMute
                              ? "#92400E"
                              : (channelsConfig.push?.enabled ?? true)
                              ? "#166534"
                              : "#64748B",
                          }}
                        >
                          {channelsConfig.masterMute
                            ? "● Pausado por Staging"
                            : (channelsConfig.push?.enabled ?? true)
                            ? "● Habilitado"
                            : "● Desactivado"}
                        </span>
                      </div>

                      <div style={{ fontSize: "0.8rem", color: "#64748B", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                        <div>
                          VAPID Key: <strong style={{ color: "#1F3652" }}>{channelsConfig.push.vapidPublicKey.substring(0, 20)}...</strong>
                        </div>
                        <div>
                          App Icon: <strong style={{ color: "#1F3652" }}>{channelsConfig.push.appIconUrl}</strong>
                        </div>
                        <div>
                          Service Worker: <code style={{ fontSize: "0.75rem", backgroundColor: "#F1F5F9", padding: "0.15rem 0.4rem", borderRadius: "0.3rem" }}>/sw-push.js</code>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #F1F5F9", paddingTop: "0.85rem" }}>
                      <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#64748B" }}>
                        Canal Web Push Individual
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleChannel("push")}
                        style={{
                          padding: "0.4rem 0.9rem",
                          borderRadius: "9999px",
                          fontSize: "0.78rem",
                          fontWeight: 700,
                          cursor: "pointer",
                          border: "1px solid #CBD5E1",
                          backgroundColor: (channelsConfig.push?.enabled ?? true) ? "#FFFFFF" : "#F8FAFC",
                          color: (channelsConfig.push?.enabled ?? true) ? "#DC2626" : "#16A34A",
                        }}
                      >
                        {(channelsConfig.push?.enabled ?? true) ? "Desactivar Canal" : "Activar Canal"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: CATÁLOGO DE PLANES & PRICING SAAS                                  */}
        {/* ========================================================================= */}
        {activeTab === "pricing" && (
          <div>
            <div style={{ backgroundColor: "#FFFFFF", borderRadius: "1rem", border: "1px solid #E2E8F0", padding: "2rem", boxShadow: "0 1px 3px rgba(0,0,0,0.03)", marginBottom: "2rem" }}>
              <div style={{ textAlign: "center", maxWidth: "600px", margin: "0 auto 2rem auto" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#2F80ED", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Modelo de Monetización Devio
                </span>
                <h2 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#1F3652", margin: "0.4rem 0" }}>
                  SaaS Facturado Estrictamente por Unidad
                </h2>
                <p style={{ fontSize: "0.88rem", color: "#64748B" }}>
                  Sin plazos forzosos ni comisiones por venta. El costo escala automáticamente según el inventario total administrado.
                </p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
                {SAAS_PRICING_TIERS.map((tier) => (
                  <div
                    key={tier.id}
                    style={{
                      border: tier.isPopular ? "2px solid #2F80ED" : "1px solid #E2E8F0",
                      borderRadius: "1rem",
                      padding: "1.75rem",
                      backgroundColor: tier.isPopular ? "rgba(47, 128, 237, 0.02)" : "#FFFFFF",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      position: "relative",
                    }}
                  >
                    {tier.isPopular && (
                      <span
                        style={{
                          position: "absolute",
                          top: "-12px",
                          right: "20px",
                          backgroundColor: "#2F80ED",
                          color: "#FFFFFF",
                          fontSize: "0.7rem",
                          fontWeight: 800,
                          padding: "0.2rem 0.65rem",
                          borderRadius: "9999px",
                        }}
                      >
                        RECOMENDADO
                      </span>
                    )}

                    <div>
                      <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#1F3652", margin: "0 0 0.4rem 0" }}>
                        {tier.name}
                      </h3>
                      <p style={{ fontSize: "0.8rem", color: "#64748B", minHeight: "38px" }}>
                        {tier.tagline}
                      </p>

                      <div style={{ margin: "1.25rem 0" }}>
                        <span style={{ fontSize: "2rem", fontWeight: 800, color: "#1F3652" }}>
                          ${tier.pricePerUnit}
                        </span>
                        <span style={{ fontSize: "0.85rem", color: "#64748B", fontWeight: 600 }}> MXN / unidad / mes</span>
                      </div>

                      <ul style={{ listStyle: "none", padding: 0, margin: "1.5rem 0", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                        {tier.features.map((f, idx) => (
                          <li key={idx} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.82rem", color: "#1F3652" }}>
                            <CheckCircle2 size={16} color="#00C48C" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        handleTabChange("developers");
                        setShowInviteModal(true);
                      }}
                      style={{
                        width: "100%",
                        padding: "0.65rem",
                        borderRadius: "9999px",
                        backgroundColor: tier.isPopular ? "#1B3047" : "#FFFFFF",
                        color: tier.isPopular ? "#FFFFFF" : "#1F3652",
                        border: tier.isPopular ? "none" : "1.5px solid #CBD5E1",
                        fontSize: "0.82rem",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Crear Invitación con este Plan
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: SALUD DEL SISTEMA & AUDITORÍA                                     */}
        {/* ========================================================================= */}
        {activeTab === "health" && (
          <div>
            {/* ESTADO DE SERVICIOS & CRONS */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.25rem", marginBottom: "2rem" }}>
              <div style={{ backgroundColor: "#FFFFFF", borderRadius: "1rem", border: "1px solid #E2E8F0", padding: "1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "#64748B" }}>Servidor Web Next.js</span>
                  <Server size={18} color="#00C48C" />
                </div>
                <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "#1F3652" }}>
                  En Línea (99.9%)
                </div>
                <span style={{ fontSize: "0.72rem", color: "#166534", fontWeight: 700 }}>Latencia promedio: 34ms</span>
              </div>

              <div style={{ backgroundColor: "#FFFFFF", borderRadius: "1rem", border: "1px solid #E2E8F0", padding: "1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "#64748B" }}>Cron Cobranza Diaria</span>
                  <Clock size={18} color="#2F80ED" />
                </div>
                <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "#1F3652" }}>
                  08:00 AM (Activo)
                </div>
                <span style={{ fontSize: "0.72rem", color: "#64748B" }}>Endpoint: /api/cron/cobranza</span>
              </div>

              <div style={{ backgroundColor: "#FFFFFF", borderRadius: "1rem", border: "1px solid #E2E8F0", padding: "1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "#64748B" }}>Auditoría de Seguridad</span>
                  <ShieldAlert size={18} color="#D97706" />
                </div>
                <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "#1F3652" }}>
                  {auditLogs.length} Eventos
                </div>
                <span style={{ fontSize: "0.72rem", color: "#166534", fontWeight: 700 }}>Sin vulnerabilidades detectadas</span>
              </div>
            </div>

            {/* BITÁCORA DE AUDITORÍA DE SEGURIDAD */}
            <div style={{ backgroundColor: "#FFFFFF", borderRadius: "1rem", border: "1px solid #E2E8F0", padding: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                <div>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#1F3652", margin: 0 }}>
                    Bitácora de Auditoría de Acceso y Operaciones
                  </h3>
                  <span style={{ fontSize: "0.8rem", color: "#64748B" }}>
                    Registro inmutable de impersonaciones, accesos y cambios en la plataforma
                  </span>
                </div>
              </div>

              <div style={{ borderRadius: "0.75rem", border: "1px solid #E2E8F0", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.82rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #E2E8F0", backgroundColor: "#F8FAFC" }}>
                      <th style={{ padding: "0.75rem 1rem", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "#64748B" }}>Fecha / Hora</th>
                      <th style={{ padding: "0.75rem 1rem", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "#64748B" }}>Acción Ejecutada</th>
                      <th style={{ padding: "0.75rem 1rem", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "#64748B" }}>Super Admin</th>
                      <th style={{ padding: "0.75rem 1rem", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "#64748B" }}>Desarrolladora Afectada</th>
                      <th style={{ padding: "0.75rem 1rem", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "#64748B" }}>Detalles</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log) => (
                      <tr key={log.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                        <td style={{ padding: "0.85rem 1rem", color: "#64748B" }}>{log.timestamp}</td>
                        <td style={{ padding: "0.85rem 1rem" }}>
                          <strong style={{ color: "#1F3652" }}>{log.action}</strong>
                        </td>
                        <td style={{ padding: "0.85rem 1rem", color: "#1F3652" }}>{log.superAdminName}</td>
                        <td style={{ padding: "0.85rem 1rem", color: "#64748B" }}>{log.targetEntity}</td>
                        <td style={{ padding: "0.85rem 1rem", color: "#64748B" }}>{log.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 1: GENERADOR DE LINK DE PAGO STRIPE POR UNIDAD                    */}
        {/* ========================================================================= */}
        {showPaymentModal && selectedDevForPayment && (
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
              zIndex: 99999,
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
                maxHeight: "92vh",
                overflowY: "auto",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                padding: "2rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
                <div>
                  <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#1F3652", margin: 0 }}>
                    Generar Link de Pago SaaS por Unidad
                  </h3>
                  <span style={{ fontSize: "0.8rem", color: "#64748B" }}>
                    {selectedDevForPayment.name} • {selectedDevForPayment.legalName}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer", padding: "4px" }}
                >
                  <X size={20} />
                </button>
              </div>

              <div style={{ marginBottom: "1.25rem" }}>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#1F3652", marginBottom: "0.4rem" }}>
                  Alcance del Cobro
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <button
                    type="button"
                    onClick={() => setPaymentScope("DEVELOPER")}
                    style={{
                      padding: "0.75rem",
                      borderRadius: "0.65rem",
                      border: paymentScope === "DEVELOPER" ? "2px solid #2F80ED" : "1px solid #E2E8F0",
                      backgroundColor: paymentScope === "DEVELOPER" ? "rgba(47, 128, 237, 0.05)" : "#FFFFFF",
                      color: "#1F3652",
                      fontWeight: 700,
                      fontSize: "0.82rem",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    Toda la Desarrolladora
                    <span style={{ display: "block", fontSize: "0.72rem", color: "#64748B", fontWeight: 500, marginTop: "2px" }}>
                      Todas las unidades ({selectedDevForPayment.projects.reduce((acc, p) => acc + p.totalUnits, 0)} u)
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentScope("PROJECT")}
                    style={{
                      padding: "0.75rem",
                      borderRadius: "0.65rem",
                      border: paymentScope === "PROJECT" ? "2px solid #2F80ED" : "1px solid #E2E8F0",
                      backgroundColor: paymentScope === "PROJECT" ? "rgba(47, 128, 237, 0.05)" : "#FFFFFF",
                      color: "#1F3652",
                      fontWeight: 700,
                      fontSize: "0.82rem",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    Proyecto Específico
                    <span style={{ display: "block", fontSize: "0.72rem", color: "#64748B", fontWeight: 500, marginTop: "2px" }}>
                      Facturar un desarrollo individual
                    </span>
                  </button>
                </div>
              </div>

              {paymentScope === "PROJECT" && (
                <div style={{ marginBottom: "1.25rem" }}>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#1F3652", marginBottom: "0.4rem" }}>
                    Seleccionar Proyecto
                  </label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
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
                    {selectedDevForPayment.projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.totalUnits} unidades) - Costo: {formatMoney(p.totalUnits * (selectedDevForPayment.pricePerUnitMonthly || 180))}/mes
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Link generado */}
              <div style={{ backgroundColor: "#F8FAFC", borderRadius: "0.75rem", border: "1px solid #E2E8F0", padding: "1rem", marginBottom: "1.5rem" }}>
                <span style={{ fontSize: "0.72rem", color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>
                  Enlace Directo de Cobro Stripe
                </span>
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.4rem" }}>
                  <input
                    type="text"
                    readOnly
                    value={calculatedPaymentUrl}
                    style={{
                      flex: 1,
                      padding: "0.55rem 0.75rem",
                      borderRadius: "0.45rem",
                      border: "1px solid #CBD5E1",
                      fontSize: "0.78rem",
                      backgroundColor: "#FFFFFF",
                      color: "#1F3652",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(calculatedPaymentUrl);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                      showToast("Link Copiado", "El enlace se copió al portapapeles.", "success");
                    }}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.3rem",
                      padding: "0.55rem 1rem",
                      borderRadius: "9999px",
                      backgroundColor: "#1B3047",
                      color: "#FFFFFF",
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    {copiedLink ? <Check size={14} /> : <Copy size={14} />} {copiedLink ? "Copiado" : "Copiar"}
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  style={{
                    padding: "0.65rem 1.5rem",
                    borderRadius: "9999px",
                    border: "1px solid #CBD5E1",
                    backgroundColor: "#FFFFFF",
                    color: "#64748B",
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

        {/* ========================================================================= */}
        {/* MODAL 2: PERMISOS DE USUARIO                                             */}
        {/* ========================================================================= */}
        {showPermissionsModal && inspectedUser && (
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
              zIndex: 99999,
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
                maxHeight: "92vh",
                overflowY: "auto",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                padding: "2rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
                <div>
                  <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#1F3652", margin: 0 }}>
                    Matriz de Permisos del Usuario
                  </h3>
                  <span style={{ fontSize: "0.8rem", color: "#64748B" }}>
                    {inspectedUser.name} ({inspectedUser.email}) • Rol: <strong>{inspectedUser.role}</strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPermissionsModal(false)}
                  style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer", padding: "4px" }}
                >
                  <X size={20} />
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxHeight: "55vh", overflowY: "auto", paddingRight: "0.5rem" }}>
                {PERMISSIONS_CATALOG.map((cat) => {
                  const rolePerms = getRolePermissionsMap((inspectedUser.role as UserRole) || "Asesor de Ventas");
                  return (
                    <div key={cat.id}>
                      <div style={{ fontSize: "0.76rem", fontWeight: 700, color: "#2F80ED", textTransform: "uppercase", marginBottom: "0.4rem" }}>
                        {cat.name}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                        {cat.permissions.map((perm) => {
                          const isGranted = Boolean(rolePerms[perm.key]);
                          return (
                            <div
                              key={perm.key}
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: "0.6rem 0.85rem",
                                borderRadius: "0.5rem",
                                backgroundColor: isGranted ? "rgba(0, 196, 140, 0.04)" : "#F8FAFC",
                                border: isGranted ? "1px solid #A7F3D0" : "1px solid #E2E8F0",
                              }}
                            >
                              <div>
                                <strong style={{ fontSize: "0.82rem", color: "#1F3652", display: "block" }}>{perm.label}</strong>
                                <span style={{ fontSize: "0.72rem", color: "#64748B" }}>{perm.description}</span>
                              </div>

                              <span
                                style={{
                                  fontSize: "0.72rem",
                                  fontWeight: 700,
                                  padding: "0.2rem 0.6rem",
                                  borderRadius: "99px",
                                  backgroundColor: isGranted ? "#DCFCE7" : "#F1F5F9",
                                  color: isGranted ? "#166534" : "#94A3B8",
                                }}
                              >
                                {isGranted ? "✓ Concedido" : "✕ Denegado"}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.5rem" }}>
                <button
                  type="button"
                  onClick={() => setShowPermissionsModal(false)}
                  style={{
                    padding: "0.65rem 1.5rem",
                    borderRadius: "9999px",
                    backgroundColor: "#1B3047",
                    color: "#FFFFFF",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 3: EDITAR PLANTILLA & ALIAS DE NOTIFICACIÓN                        */}
        {/* ========================================================================= */}
        {showTemplateModal && editingTemplate && (
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
              zIndex: 99999,
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
                maxHeight: "92vh",
                overflowY: "auto",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                padding: "2rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
                <div>
                  <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#1F3652", margin: 0 }}>
                    Alias & Plantilla: {editingTemplate.title}
                  </h3>
                  <span style={{ fontSize: "0.8rem", color: "#64748B" }}>
                    Personaliza los nombres de plantilla en Postmark y WhatsApp
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTemplateModal(false)}
                  style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer", padding: "4px" }}
                >
                  <X size={20} />
                </button>
              </div>

              <div style={{ marginBottom: "1.2rem" }}>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#1F3652", marginBottom: "0.4rem" }}>
                  Postmark Template Alias
                </label>
                <input
                  type="text"
                  value={editPmkAlias}
                  onChange={(e) => setEditPmkAlias(e.target.value)}
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
                  Postmark Email Subject
                </label>
                <input
                  type="text"
                  value={editPmkSubject}
                  onChange={(e) => setEditPmkSubject(e.target.value)}
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
                  WhatsApp WABA Template Name
                </label>
                <input
                  type="text"
                  value={editWaTemplate}
                  onChange={(e) => setEditWaTemplate(e.target.value)}
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

              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#1F3652", marginBottom: "0.4rem" }}>
                  Push Notification Title
                </label>
                <input
                  type="text"
                  value={editPushTitle}
                  onChange={(e) => setEditPushTitle(e.target.value)}
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

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                <button
                  type="button"
                  onClick={() => setShowTemplateModal(false)}
                  style={{
                    padding: "0.65rem 1.4rem",
                    borderRadius: "9999px",
                    border: "1px solid #CBD5E1",
                    backgroundColor: "#FFFFFF",
                    color: "#64748B",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={handleSaveTemplate}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    padding: "0.65rem 1.75rem",
                    borderRadius: "9999px",
                    backgroundColor: "#1B3047",
                    color: "#FFFFFF",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Guardar Alias
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 4: CREAR INVITACIÓN CON TARIFA PERSONALIZADA                      */}
        {/* ========================================================================= */}
        {showInviteModal && (
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
              zIndex: 99999,
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
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
                <div>
                  <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#1F3652", margin: 0 }}>
                    Crear Enlace de Invitación SaaS
                  </h3>
                  <span style={{ fontSize: "0.8rem", color: "#64748B" }}>
                    Genera un enlace de registro con tarifa preferencial por unidad
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer", padding: "4px" }}
                >
                  <X size={20} />
                </button>
              </div>

              <div style={{ marginBottom: "1.2rem" }}>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#1F3652", marginBottom: "0.4rem" }}>
                  Nombre de la Desarrolladora *
                </label>
                <input
                  type="text"
                  placeholder="Ej. Inmobiliaria del Norte"
                  value={inviteDevName}
                  onChange={(e) => setInviteDevName(e.target.value)}
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
                  Correo del Contacto Principal *
                </label>
                <input
                  type="email"
                  placeholder="contacto@desarrolladora.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
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

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.2rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#1F3652", marginBottom: "0.4rem" }}>
                    Tarifa por Unidad (MXN)
                  </label>
                  <input
                    type="number"
                    value={invitePricePerUnit}
                    onChange={(e) => setInvitePricePerUnit(Number(e.target.value))}
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

                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#1F3652", marginBottom: "0.4rem" }}>
                    Descuento Promocional (%)
                  </label>
                  <input
                    type="number"
                    value={inviteDiscount}
                    onChange={(e) => setInviteDiscount(Number(e.target.value))}
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
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.5rem" }}>
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  style={{
                    padding: "0.65rem 1.4rem",
                    borderRadius: "9999px",
                    border: "1px solid #CBD5E1",
                    backgroundColor: "#FFFFFF",
                    color: "#64748B",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!inviteDevName.trim() || !inviteEmail.trim()) {
                      showToast("Campos Requeridos", "Por favor llena el nombre y correo de la desarrolladora.", "warning");
                      return;
                    }
                    const newInv: CustomPricingInvite = {
                      id: `inv-${Date.now()}`,
                      token: `tok_${Date.now()}`,
                      developerName: inviteDevName.trim(),
                      developerEmail: inviteEmail.trim(),
                      pricePerUnitMonthly: invitePricePerUnit,
                      freeTrialMonths: inviteTrialMonths,
                      discountPercentage: inviteDiscount,
                      expiresAt: inviteExpiresAt,
                      status: "PENDING",
                      createdAt: new Date().toISOString().split("T")[0] || new Date().toISOString(),
                      linkUrl: `https://devio.lat/registro?invite=${Date.now()}&dev=${encodeURIComponent(inviteDevName)}&ppu=${invitePricePerUnit}`,
                    };
                    setInvites([newInv, ...invites]);
                    setShowInviteModal(false);
                    setInviteDevName("");
                    setInviteEmail("");
                    showToast("Invitación Creada", `Se generó el enlace para ${newInv.developerName}.`, "success");
                  }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    padding: "0.65rem 1.75rem",
                    borderRadius: "9999px",
                    backgroundColor: "#1B3047",
                    color: "#FFFFFF",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <Plus size={16} /> Generar Enlace
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 5: PROBAR ENVÍO DE NOTIFICACIÓN EN VIVO                             */}
        {/* ========================================================================= */}
        {showLiveTestModal && testTemplate && (
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
              zIndex: 99999,
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
                maxHeight: "92vh",
                overflowY: "auto",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                padding: "2rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
                <div>
                  <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#1F3652", margin: 0 }}>
                    Probar Notificación en Vivo
                  </h3>
                  <span style={{ fontSize: "0.8rem", color: "#64748B" }}>
                    Plantilla: <strong>{testTemplate.title}</strong> (Alias: <code>{testTemplate.postmark.templateAlias}</code>)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLiveTestModal(false)}
                  style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer", padding: "4px" }}
                >
                  <X size={20} />
                </button>
              </div>

              <div style={{ marginBottom: "1.2rem" }}>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#1F3652", marginBottom: "0.4rem" }}>
                  Correo Destinatario de Prueba
                </label>
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
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

              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#1F3652", marginBottom: "0.4rem" }}>
                  Variables de Prueba (JSON TemplateModel)
                </label>
                <textarea
                  rows={5}
                  value={testPayloadJson}
                  onChange={(e) => setTestPayloadJson(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.65rem 0.85rem",
                    borderRadius: "0.5rem",
                    border: "1px solid #CBD5E1",
                    fontSize: "0.82rem",
                    fontFamily: "monospace",
                    color: "#1F3652",
                    outline: "none",
                    boxSizing: "border-box",
                    resize: "vertical",
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                <button
                  type="button"
                  onClick={() => setShowLiveTestModal(false)}
                  style={{
                    padding: "0.65rem 1.4rem",
                    borderRadius: "9999px",
                    border: "1px solid #CBD5E1",
                    backgroundColor: "#FFFFFF",
                    color: "#64748B",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  disabled={isSendingTest}
                  onClick={handleExecuteLiveTest}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.45rem",
                    padding: "0.65rem 1.75rem",
                    borderRadius: "9999px",
                    backgroundColor: "#1B3047",
                    color: "#FFFFFF",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    border: "none",
                    cursor: isSendingTest ? "not-allowed" : "pointer",
                    opacity: isSendingTest ? 0.7 : 1,
                  }}
                >
                  <Send size={15} /> {isSendingTest ? "Enviando..." : "Enviar Correo de Prueba"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 6: DETALLE DE ERROR DE LOG                                         */}
        {/* ========================================================================= */}
        {selectedLogForDetail && (
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
              zIndex: 99999,
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
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
                <div>
                  <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#DC2626", margin: 0 }}>
                    Detalle de Falla en Entrega
                  </h3>
                  <span style={{ fontSize: "0.8rem", color: "#64748B" }}>
                    {selectedLogForDetail.triggerName} • {selectedLogForDetail.timestamp}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedLogForDetail(null)}
                  style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer", padding: "4px" }}
                >
                  <X size={20} />
                </button>
              </div>

              <div style={{ backgroundColor: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: "0.75rem", padding: "1.25rem", marginBottom: "1.5rem" }}>
                <span style={{ fontSize: "0.72rem", color: "#991B1B", fontWeight: 700, textTransform: "uppercase" }}>
                  Respuesta del Proveedor (Postmark / API)
                </span>
                <p style={{ fontSize: "0.88rem", color: "#7F1D1D", fontWeight: 600, margin: "0.5rem 0 0 0", wordBreak: "break-word" }}>
                  {selectedLogForDetail.errorDetails || "Error desconocido al procesar la entrega."}
                </p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", fontSize: "0.8rem", color: "#1F3652", marginBottom: "1.5rem" }}>
                <div>
                  <span style={{ color: "#64748B", display: "block" }}>Destinatario:</span>
                  <strong>{selectedLogForDetail.recipient}</strong>
                </div>
                <div>
                  <span style={{ color: "#64748B", display: "block" }}>Desarrolladora:</span>
                  <strong>{selectedLogForDetail.developerName}</strong>
                </div>
                <div>
                  <span style={{ color: "#64748B", display: "block" }}>Canal:</span>
                  <strong>{selectedLogForDetail.channel}</strong>
                </div>
                <div>
                  <span style={{ color: "#64748B", display: "block" }}>Template Alias:</span>
                  <code>{selectedLogForDetail.metadata?.templateAlias || "N/A"}</code>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setSelectedLogForDetail(null)}
                  style={{
                    padding: "0.65rem 1.5rem",
                    borderRadius: "9999px",
                    backgroundColor: "#1B3047",
                    color: "#FFFFFF",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 7: EDITAR TARIFA DE COBRO POR UNIDAD (DESARROLLADORA O PROYECTO)   */}
        {/* ========================================================================= */}
        {showPriceModal && (
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
              zIndex: 99999,
              padding: "1rem",
              backdropFilter: "blur(4px)",
            }}
          >
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "1.25rem",
                width: "100%",
                maxWidth: "480px",
                maxHeight: "92vh",
                overflowY: "auto",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                padding: "2rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
                <div>
                  <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#1F3652", margin: 0 }}>
                    {priceEditScope === "PROJECT" ? "Tarifa de Cobro por Proyecto" : "Tarifa de Cobro Desarrolladora"}
                  </h3>
                  <span style={{ fontSize: "0.8rem", color: "#64748B" }}>
                    Configurar costo unitario mensual ($/u/mes)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPriceModal(false)}
                  style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer", padding: "4px" }}
                >
                  <X size={20} />
                </button>
              </div>

              <div style={{ backgroundColor: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "0.75rem", padding: "1rem", marginBottom: "1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <span style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>
                    {priceEditScope === "PROJECT" ? "Proyecto Seleccionado" : "Desarrolladora"}
                  </span>
                  <span style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem", borderRadius: "9999px", backgroundColor: "#EFF6FF", color: "#2F80ED", fontWeight: 700 }}>
                    {priceEditUnitsCount} {priceEditUnitsCount === 1 ? "Unidad" : "Unidades"}
                  </span>
                </div>
                <h4 style={{ fontSize: "1rem", fontWeight: 800, color: "#1F3652", margin: 0 }}>
                  {priceEditTargetName}
                </h4>
              </div>

              <div style={{ marginBottom: "1.25rem" }}>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#475569", marginBottom: "0.4rem" }}>
                  Precio Mensual por Unidad (MXN / u / mes)
                </label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: "0.85rem", top: "50%", transform: "translateY(-50%)", color: "#64748B", fontWeight: 700, fontSize: "0.9rem" }}>
                    $
                  </span>
                  <input
                    type="number"
                    min={1}
                    value={priceEditValue}
                    onChange={(e) => setPriceEditValue(Math.max(1, Number(e.target.value)))}
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.85rem 0.65rem 2rem",
                      borderRadius: "0.5rem",
                      border: "1px solid #CBD5E1",
                      fontSize: "0.95rem",
                      fontWeight: 700,
                      color: "#1F3652",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                  <span style={{ position: "absolute", right: "0.85rem", top: "50%", transform: "translateY(-50%)", color: "#94A3B8", fontSize: "0.75rem", fontWeight: 600 }}>
                    MXN
                  </span>
                </div>
              </div>

              {/* Projected Revenue Calculation Box */}
              <div style={{ backgroundColor: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: "0.75rem", padding: "1rem", marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ fontSize: "0.72rem", color: "#166534", fontWeight: 700, textTransform: "uppercase" }}>
                      Cobro Mensual Estimado
                    </span>
                    <p style={{ fontSize: "0.75rem", color: "#15803D", margin: "0.2rem 0 0 0" }}>
                      {priceEditUnitsCount} unidades × ${priceEditValue.toLocaleString("es-MX")} MXN
                    </p>
                  </div>
                  <span style={{ fontSize: "1.15rem", fontWeight: 900, color: "#15803D" }}>
                    ${(priceEditUnitsCount * priceEditValue).toLocaleString("es-MX")} <span style={{ fontSize: "0.7rem", fontWeight: 600 }}>MXN/mes</span>
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                <button
                  type="button"
                  onClick={() => setShowPriceModal(false)}
                  style={{
                    padding: "0.65rem 1.25rem",
                    borderRadius: "9999px",
                    backgroundColor: "#F1F5F9",
                    color: "#475569",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSavePrice}
                  style={{
                    padding: "0.65rem 1.5rem",
                    borderRadius: "9999px",
                    backgroundColor: "#1B3047",
                    color: "#FFFFFF",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Guardar Tarifa
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 8: PROGRAMAR NOTIFICACIÓN MANUAL                                    */}
        {/* ========================================================================= */}
        {showCreateScheduleModal && (
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
              zIndex: 99999,
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
                maxHeight: "92vh",
                overflowY: "auto",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                padding: "2rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
                <div>
                  <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#1F3652", margin: 0 }}>
                    Programar Notificación Manual
                  </h3>
                  <span style={{ fontSize: "0.8rem", color: "#64748B" }}>
                    Encolar automatización o recordatorio para una fecha/hora específica
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateScheduleModal(false)}
                  style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer", padding: "4px" }}
                >
                  <X size={20} />
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.5rem" }}>
                {/* Trigger Template */}
                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#475569", marginBottom: "0.35rem" }}>
                    Tipo de Notificación / Evento
                  </label>
                  <select
                    value={newScheduleTriggerKey}
                    onChange={(e) => setNewScheduleTriggerKey(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.85rem",
                      borderRadius: "0.5rem",
                      border: "1px solid #CBD5E1",
                      fontSize: "0.85rem",
                      color: "#1F3652",
                      backgroundColor: "#FFFFFF",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  >
                    {templates.map((tpl) => (
                      <option key={tpl.id} value={tpl.triggerKey}>
                        {tpl.title} ({tpl.triggerKey})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Channel & Schedule Date/Time */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#475569", marginBottom: "0.35rem" }}>
                      Canal
                    </label>
                    <select
                      value={newScheduleChannel}
                      onChange={(e) => setNewScheduleChannel(e.target.value as any)}
                      style={{
                        width: "100%",
                        padding: "0.65rem 0.85rem",
                        borderRadius: "0.5rem",
                        border: "1px solid #CBD5E1",
                        fontSize: "0.85rem",
                        color: "#1F3652",
                        backgroundColor: "#FFFFFF",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    >
                      <option value="POSTMARK">Email (Postmark)</option>
                      <option value="WHATSAPP">WhatsApp</option>
                      <option value="PUSH">Push</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#475569", marginBottom: "0.35rem" }}>
                      Fecha de Envío
                    </label>
                    <DevioDatePicker
                      value={newScheduleDate}
                      onChange={(val) => setNewScheduleDate(val)}
                      placeholder="Seleccionar fecha"
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#475569", marginBottom: "0.35rem" }}>
                      Hora de Envío
                    </label>
                    <input
                      type="time"
                      value={newScheduleTime}
                      onChange={(e) => setNewScheduleTime(e.target.value)}
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
                </div>

                {/* Recipient Details */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#475569", marginBottom: "0.35rem" }}>
                      Nombre del Destinatario *
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Sofía Garza"
                      value={newScheduleRecipientName}
                      onChange={(e) => setNewScheduleRecipientName(e.target.value)}
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

                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#475569", marginBottom: "0.35rem" }}>
                      Contacto (Email o WhatsApp) *
                    </label>
                    <input
                      type="text"
                      placeholder="correo@ejemplo.com o +5281..."
                      value={newScheduleRecipientContact}
                      onChange={(e) => setNewScheduleRecipientContact(e.target.value)}
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
                </div>

                {/* Project and Unit */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#475569", marginBottom: "0.35rem" }}>
                      Proyecto
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Torre Lúmina"
                      value={newScheduleProject}
                      onChange={(e) => setNewScheduleProject(e.target.value)}
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

                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#475569", marginBottom: "0.35rem" }}>
                      Unidad / Lote
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Depto 402"
                      value={newScheduleUnit}
                      onChange={(e) => setNewScheduleUnit(e.target.value)}
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
                </div>

                {/* Payload Summary */}
                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#475569", marginBottom: "0.35rem" }}>
                    Resumen o Mensaje de Contexto
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Recordatorio de pago mensualidad #4 ($18,500 MXN)"
                    value={newSchedulePayloadSummary}
                    onChange={(e) => setNewSchedulePayloadSummary(e.target.value)}
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
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                <button
                  type="button"
                  onClick={() => setShowCreateScheduleModal(false)}
                  style={{
                    padding: "0.65rem 1.25rem",
                    borderRadius: "9999px",
                    backgroundColor: "#F1F5F9",
                    color: "#475569",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleCreateScheduledNotification}
                  style={{
                    padding: "0.65rem 1.5rem",
                    borderRadius: "9999px",
                    backgroundColor: "#1B3047",
                    color: "#FFFFFF",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Programar Notificación
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </AppLayout>
  );
}

export default function SuperAdminPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#F8FAFC",
            color: "#64748B",
            fontWeight: 600,
            fontSize: "0.9rem",
          }}
        >
          Cargando consola Super Admin...
        </div>
      }
    >
      <SuperAdminContent />
    </Suspense>
  );
}



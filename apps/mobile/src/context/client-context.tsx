import React, { createContext, useContext, useState, useMemo, useEffect, ReactNode } from "react";
import { createNavigationContainerRef } from "@react-navigation/native";
import {
  ClientUser,
  ClientProperty,
  PushNotificationItem,
  ClientPaymentScheduleItem,
  ClientPaymentReceiptItem,
} from "../types/client";
import { resolveClientPropertiesLocal } from "../data/real-data-resolver";
import { appStorage } from "../utils/storage";

export const navigationRef = createNavigationContainerRef<any>();

export type ClientAppScreen =
  | "main"
  | "property-detail"
  | "construction"
  | "documents"
  | "account-statement";

export type ClientAppTab = "properties" | "profile";

interface ClientContextType {
  user: ClientUser | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  activeTab: ClientAppTab;
  setActiveTab: (tab: ClientAppTab) => void;
  currentScreen: ClientAppScreen;
  navigateTo: (screen: ClientAppScreen, propertyId?: string) => void;
  goBack: () => void;
  properties: ClientProperty[];
  selectedPropertyId: string;
  selectedProperty: ClientProperty | null;
  selectProperty: (id: string) => void;
  notifications: PushNotificationItem[];
  unreadNotificationsCount: number;
  markNotificationAsRead: (id: string) => void;
  deleteNotification: (id: string) => void;
  clearAllNotifications: () => void;
  showNotificationsModal: boolean;
  setShowNotificationsModal: (show: boolean) => void;
  selectedReceiptPayment: ClientPaymentReceiptItem | ClientPaymentScheduleItem | null;
  setSelectedReceiptPayment: (p: ClientPaymentReceiptItem | ClientPaymentScheduleItem | null) => void;
  showEditProfileModal: boolean;
  setShowEditProfileModal: (show: boolean) => void;
  showChangePasswordModal: boolean;
  setShowChangePasswordModal: (show: boolean) => void;
  updateProfile: (data: Partial<ClientUser>) => void;
  changePassword: (oldPass: string, newPass: string) => boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  formatMoney: (amount: number) => string;
  formatDateDisplay: (dateStr: string) => string;
}

const API_BASE_URL = "https://devio-web-git-staging-devio4.vercel.app";

const round2 = (num: number) => Math.round((Number(num || 0) + Number.EPSILON) * 100) / 100;

function parseDateFlexible(dateStr: string): Date | null {
  if (!dateStr || typeof dateStr !== "string") return null;
  const clean = dateStr.trim();
  if (!clean || clean.toLowerCase() === "pendiente" || clean.toLowerCase() === "parcial" || clean === "-") return null;

  if (/^\d{4}-\d{2}-\d{2}/.test(clean)) {
    const datePart = clean.split("T")[0] || clean;
    const parts = datePart.split("-").map(Number);
    if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
      return new Date(parts[0], parts[1] - 1, parts[2]);
    }
  }

  if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(clean)) {
    const parts = clean.split(/[\/\-]/).map(Number);
    if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
      return new Date(parts[2], parts[1] - 1, parts[0]);
    }
  }

  const parsed = new Date(clean);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return "-";
  const d = parseDateFlexible(dateStr);
  if (!d) return dateStr;
  const day = d.getDate();
  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export const ClientProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<ClientUser | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<ClientAppTab>("properties");
  const [screenHistory, setScreenHistory] = useState<ClientAppScreen[]>(["main"]);
  const [properties, setProperties] = useState<ClientProperty[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [notifications, setNotifications] = useState<PushNotificationItem[]>([]);
  const [showNotificationsModal, setShowNotificationsModal] = useState<boolean>(false);
  const [selectedReceiptPayment, setSelectedReceiptPayment] = useState<ClientPaymentReceiptItem | ClientPaymentScheduleItem | null>(null);
  const [showEditProfileModal, setShowEditProfileModal] = useState<boolean>(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState<boolean>(false);
  const [dismissedNotifIds, setDismissedNotifIds] = useState<string[]>([]);

  // Restore Persisted Session on Startup (Stay Logged In)
  useEffect(() => {
    async function restorePersistedSession() {
      try {
        const stored = await appStorage.getItem("@devio_client_session");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.user && Array.isArray(parsed.properties) && parsed.properties.length > 0) {
            setUser(parsed.user);
            setProperties(parsed.properties);
            setSelectedPropertyId(parsed.selectedPropertyId || parsed.properties[0]?.id || "");
            setIsLoggedIn(true);
            generateNotifications(parsed.properties);
          }
        }
      } catch (err) {
        console.warn("Failed to restore session from appStorage:", err);
      } finally {
        setIsLoading(false);
      }
    }
    restorePersistedSession();
  }, []);

  const currentScreen = screenHistory[screenHistory.length - 1] || "main";

  const selectedProperty: ClientProperty | null = useMemo(() => {
    if (properties.length === 0) return null;
    return properties.find((p) => p.id === selectedPropertyId) || properties[0] || null;
  }, [properties, selectedPropertyId]);

  const unreadNotificationsCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  const navigateTo = (screen: ClientAppScreen, propertyId?: string) => {
    if (propertyId) {
      setSelectedPropertyId(propertyId);
    }
    setScreenHistory((prev) => [...prev, screen]);

    if (navigationRef.isReady()) {
      switch (screen) {
        case "property-detail":
          navigationRef.navigate("PropertyDetail", { propertyId });
          break;
        case "account-statement":
          navigationRef.navigate("AccountStatement", { propertyId });
          break;
        case "construction":
          navigationRef.navigate("Construction", { propertyId });
          break;
        case "documents":
          navigationRef.navigate("Documents", { propertyId });
          break;
        case "main":
        default:
          navigationRef.navigate("Main");
          break;
      }
    }
  };

  const goBack = () => {
    setScreenHistory((prev) => (prev.length > 1 ? prev.slice(0, -1) : ["main"]));
    if (navigationRef.isReady() && navigationRef.canGoBack()) {
      navigationRef.goBack();
    }
  };

  const selectProperty = (id: string) => {
    setSelectedPropertyId(id);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setDismissedNotifIds((prev) => [...prev, id]);
  };

  const clearAllNotifications = () => {
    const allIds = notifications.map((n) => n.id);
    setNotifications([]);
    setDismissedNotifIds((prev) => [...prev, ...allIds]);
  };

  const updateProfile = (data: Partial<ClientUser>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...data };
      appStorage.getItem("@devio_client_session").then((stored) => {
        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.user = updated;
          appStorage.setItem("@devio_client_session", JSON.stringify(parsed)).catch(() => {});
        }
      }).catch(() => {});
      return updated;
    });
  };

  const changePassword = (_oldPass: string, _newPass: string): boolean => {
    return true;
  };

  const formatMoney = (val: number): string => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 2,
    }).format(val || 0);
  };

  const generateNotifications = (propsList: ClientProperty[]) => {
    const generated: PushNotificationItem[] = [];

    propsList.forEach((p) => {
      if (p.overdueAmount > 0) {
        generated.push({
          id: `notif-overdue-${p.id}`,
          title: `Saldo Vencido • Unidad ${p.unitNumber}`,
          body: `Presentas un saldo vencido por ${formatMoney(p.overdueAmount)} en ${p.projectName}. Te sugerimos regularizar tu pago a la brevedad.`,
          time: "Atención",
          type: "warning",
          read: false,
          category: "COBRANZA",
          targetScreen: "account-statement",
          propertyId: p.id,
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
          category: "COBRANZA",
          targetScreen: "account-statement",
          propertyId: p.id,
        });
      }

      if (p.paymentsList && p.paymentsList.length > 0 && p.paymentsList[0]) {
        const latest = p.paymentsList[0];
        generated.push({
          id: `notif-pay-${p.id}-${latest.id || latest.fechaPago}`,
          title: `Pago Acreditado • Unidad ${p.unitNumber}`,
          body: `Tu abono de ${formatMoney(latest.monto)} vía ${latest.metodoPago || "Transferencia SPEI"} (${formatDateDisplay(latest.fechaPago)}) fue registrado exitosamente.`,
          time: formatDateDisplay(latest.fechaPago),
          type: "success",
          read: true,
          category: "COBRANZA",
          targetScreen: "account-statement",
          propertyId: p.id,
        });
      }

      if (p.constructionPct > 0) {
        generated.push({
          id: `notif-prog-${p.id}-${p.constructionPct}`,
          title: `Avance de Obra • ${p.projectName}`,
          body: `El proyecto registra un avance físico del ${p.constructionPct}% con bitácora fotográfica actualizada.`,
          time: "Obra",
          type: "info",
          read: true,
          category: "OBRA",
          targetScreen: "construction",
          propertyId: p.id,
        });
      }
    });

    const active = generated.filter((n) => !dismissedNotifIds.includes(n.id));
    setNotifications(active);
  };

  const login = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = pass.trim();

    try {
      let clientInfo: ClientUser | null = null;
      let mappedProperties: ClientProperty[] = [];

      // Try network fetch first (if online & staging returns JSON)
      try {
        const propRes = await fetch(`${API_BASE_URL}/api/client/properties?email=${encodeURIComponent(cleanEmail)}`);
        const contentType = propRes.headers.get("content-type") || "";
        if (propRes.ok && contentType.includes("application/json")) {
          const propData = await propRes.json();
          if (propData && Array.isArray(propData.properties) && propData.properties.length > 0) {
            clientInfo = propData.user || {
              id: "usr-client",
              name: "Eduardo Arroniz Estefan",
              email: cleanEmail,
              phone: "3331234567",
              rfc: "ARRE800101XYZ",
              address: "Paseo Valle Real 1050, Zapopan, Jal.",
            };

            mappedProperties = propData.properties.map((p: any) => ({
              id: p.id,
              clientEmail: cleanEmail,
              developerName: p.developerName || "Campero Desarrollos",
              developerLogo: p.developerLogo,
              projectName: p.projectName || "Mainstreet Valle Real",
              projectLogo: p.projectLogo,
              projectAddress: p.projectAddress || "Paseo Valle Real 1050, Zapopan, Jalisco",
              unitNumber: p.unitNumber || "5.2",
              unitType: p.unitType || "Local Comercial",
              totalPrice: round2(p.totalPrice || 0),
              paidAmount: round2(p.paidAmount || 0),
              pendingAmount: round2(p.pendingAmount || 0),
              overdueAmount: round2(p.overdueAmount || 0),
              nextPaymentAmount: round2(p.nextPaymentAmount || 0),
              nextPaymentDueDate: p.nextPaymentDueDate || "-",
              nextPaymentDaysRemaining: p.nextPaymentDaysRemaining || 0,
              nextPaymentConcept: p.nextPaymentConcept || "Mensualidad",
              constructionPct: p.constructionPct || 65,
              lastProgressUpdateDate: p.lastProgressUpdateDate || "20 Sep 2026",
              estimatedDeliveryDate: p.estimatedDeliveryDate || "Diciembre 2026",
              areaM2: p.areaM2 || 45.5,
              bedrooms: p.bedrooms || 0,
              bathrooms: p.bathrooms || 1,
              parkingSpots: p.parkingSpots || 1,
              storageUnits: p.storageUnits || 0,
              floorLevel: p.floorLevel || 1,
              maintenanceFeeMonthly: p.maintenanceFeeMonthly || 2500,
              images: p.images || ["https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200"],
              specialtiesProgress: p.specialtiesProgress || [],
              constructionMilestones: p.constructionMilestones || [],
              documents: p.documents || [],
              schedule: (p.schedule || []).map((s: any, idx: number) => ({
                id: s.id || `sched-${idx + 1}`,
                cuotaNumber: s.cuotaNumber || idx + 1,
                concept: s.concepto || s.concept || `Cuota ${idx + 1}`,
                amount: Number(s.monto || 0),
                interestAmount: Number(s.interesMoratorio || 0),
                scheduledDate: s.fechaVencimiento || s.fechaProgramada || "-",
                status: s.estado === "Pagado" ? "PAGADO" : s.estado === "Atrasado" ? "ATRASADO" : "PENDIENTE",
                paidDate: s.fechaPago,
                paidAmount: Number(s.montoPagado || 0),
                saldoPendiente: Number(s.saldoPendiente || 0),
                receiptNumber: s.folioRecibo,
              })),
              paymentsList: (p.paymentsList || []).map((pl: any, idx: number) => ({
                id: pl.id || `pay-${idx + 1}`,
                folio: pl.folio || pl.reciboFolio || `REC-${p.unitNumber}-${idx + 1}`,
                fechaPago: pl.fechaPago || "-",
                monto: Number(pl.monto || 0),
                metodoPago: pl.metodoPago || "Transferencia SPEI",
                reciboFolio: pl.reciboFolio || pl.folio,
                comprobanteUrl: pl.comprobanteUrl,
                moratoryAmount: pl.moratoryAmount,
                unit: p.unitNumber,
              })),
              payments: (p.schedule || []).map((s: any, idx: number) => ({
                id: s.id || `sched-${idx + 1}`,
                cuotaNumber: s.cuotaNumber || idx + 1,
                concept: s.concepto || s.concept || `Cuota ${idx + 1}`,
                amount: Number(s.monto || 0),
                interestAmount: Number(s.interesMoratorio || 0),
                scheduledDate: s.fechaVencimiento || s.fechaProgramada || "-",
                status: s.estado === "Pagado" ? "PAGADO" : s.estado === "Atrasado" ? "ATRASADO" : "PENDIENTE",
                paidDate: s.fechaPago,
                paidAmount: Number(s.montoPagado || 0),
                saldoPendiente: Number(s.saldoPendiente || 0),
                receiptNumber: s.folioRecibo,
              })),
              customAttributes: p.customAttributes || [],
            }));
          }
        }
      } catch (networkErr) {
        console.log("Staging network fetch fallback to local real data:", networkErr);
      }

      // If network is protected by Vercel SSO or unavailable, resolve from local real dataset
      if (mappedProperties.length === 0) {
        const localResolved = resolveClientPropertiesLocal(cleanEmail);
        if (localResolved.properties.length > 0) {
          clientInfo = localResolved.user;
          mappedProperties = localResolved.properties;
        }
      }

      // If still no properties found for this email
      if (mappedProperties.length === 0) {
        setIsLoading(false);
        return {
          success: false,
          error: "No se encontraron propiedades vinculadas a este correo electrónico.",
        };
      }

      const activeUser: ClientUser = {
        id: clientInfo?.id || "usr-client",
        name: clientInfo?.name || "Eduardo Arroniz Estefan",
        email: cleanEmail,
        phone: clientInfo?.phone || "+52 33 3123 4567",
        rfc: clientInfo?.rfc || "ARRE800101XYZ",
        address: clientInfo?.address || "Paseo Valle Real 1050, Zapopan, Jal.",
        avatarUrl: clientInfo?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(clientInfo?.name || "Cliente")}&background=1F3652&color=fff&bold=true`,
      };

      setUser(activeUser);
      setProperties(mappedProperties);
      setSelectedPropertyId(mappedProperties[0]?.id || "");
      generateNotifications(mappedProperties);
      setIsLoggedIn(true);
      setScreenHistory(["main"]);
      setActiveTab("properties");
      setIsLoading(false);

      // Save persistent session for subsequent app launches
      try {
        await appStorage.setItem(
          "@devio_client_session",
          JSON.stringify({
            user: activeUser,
            properties: mappedProperties,
            selectedPropertyId: mappedProperties[0]?.id || "",
          })
        );
      } catch (saveErr) {
        console.warn("Failed to persist session to appStorage:", saveErr);
      }

      return { success: true };
    } catch (err: any) {
      console.error("Login execution error:", err);
      setIsLoading(false);
      return { success: false, error: "Ocurrió un error al procesar el inicio de sesión." };
    }
  };

  const logout = () => {
    appStorage.removeItem("@devio_client_session").catch(() => {});
    setIsLoggedIn(false);
    setUser(null);
    setProperties([]);
    setSelectedPropertyId("");
    setNotifications([]);
    setScreenHistory(["main"]);
    setActiveTab("properties");
  };

  return (
    <ClientContext.Provider
      value={{
        user,
        isLoggedIn,
        isLoading,
        activeTab,
        setActiveTab: (t) => {
          setActiveTab(t);
          setScreenHistory(["main"]);
        },
        currentScreen,
        navigateTo,
        goBack,
        properties,
        selectedPropertyId,
        selectedProperty,
        selectProperty,
        notifications,
        unreadNotificationsCount,
        markNotificationAsRead,
        deleteNotification,
        clearAllNotifications,
        showNotificationsModal,
        setShowNotificationsModal,
        selectedReceiptPayment,
        setSelectedReceiptPayment,
        showEditProfileModal,
        setShowEditProfileModal,
        showChangePasswordModal,
        setShowChangePasswordModal,
        updateProfile,
        changePassword,
        login,
        logout,
        formatMoney,
        formatDateDisplay,
      }}
    >
      {children}
    </ClientContext.Provider>
  );
};

export const useClientApp = () => {
  const ctx = useContext(ClientContext);
  if (!ctx) {
    throw new Error("useClientApp must be used within a ClientProvider");
  }
  return ctx;
};

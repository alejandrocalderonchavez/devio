import React, { createContext, useContext, useState, useMemo, ReactNode } from "react";
import {
  ClientUser,
  ClientProperty,
  PushNotificationItem,
  ClientPaymentScheduleItem,
} from "../types/client";
import {
  INITIAL_CLIENT_USER,
  INITIAL_CLIENT_PROPERTIES,
  INITIAL_PUSH_NOTIFICATIONS,
} from "../data/mock-client-data";

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
  activeTab: ClientAppTab;
  setActiveTab: (tab: ClientAppTab) => void;
  currentScreen: ClientAppScreen;
  navigateTo: (screen: ClientAppScreen, propertyId?: string) => void;
  goBack: () => void;
  properties: ClientProperty[];
  selectedPropertyId: string;
  selectedProperty: ClientProperty;
  selectProperty: (id: string) => void;
  notifications: PushNotificationItem[];
  unreadNotificationsCount: number;
  markNotificationAsRead: (id: string) => void;
  deleteNotification: (id: string) => void;
  clearAllNotifications: () => void;
  showNotificationsModal: boolean;
  setShowNotificationsModal: (show: boolean) => void;
  selectedReceiptPayment: ClientPaymentScheduleItem | null;
  setSelectedReceiptPayment: (p: ClientPaymentScheduleItem | null) => void;
  showEditProfileModal: boolean;
  setShowEditProfileModal: (show: boolean) => void;
  showChangePasswordModal: boolean;
  setShowChangePasswordModal: (show: boolean) => void;
  updateProfile: (data: Partial<ClientUser>) => void;
  changePassword: (oldPass: string, newPass: string) => boolean;
  login: (email: string, pass: string) => boolean;
  logout: () => void;
  formatMoney: (amount: number) => string;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export const ClientProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<ClientUser | null>(INITIAL_CLIENT_USER);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<ClientAppTab>("properties");
  const [screenHistory, setScreenHistory] = useState<ClientAppScreen[]>(["main"]);
  const [properties, setProperties] = useState<ClientProperty[]>(INITIAL_CLIENT_PROPERTIES);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("prop-castellana-1c");
  const [notifications, setNotifications] = useState<PushNotificationItem[]>(INITIAL_PUSH_NOTIFICATIONS);
  const [showNotificationsModal, setShowNotificationsModal] = useState<boolean>(false);
  const [selectedReceiptPayment, setSelectedReceiptPayment] = useState<ClientPaymentScheduleItem | null>(null);
  const [showEditProfileModal, setShowEditProfileModal] = useState<boolean>(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState<boolean>(false);

  const currentScreen = screenHistory[screenHistory.length - 1] || "main";

  const userProperties = useMemo(() => {
    if (!user) return [];
    const cleanEmail = user.email.trim().toLowerCase();
    const filtered = properties.filter((p) => !p.clientEmail || p.clientEmail.trim().toLowerCase() === cleanEmail);
    return filtered.length > 0 ? filtered : properties;
  }, [properties, user]);

  const selectedProperty: ClientProperty = useMemo(() => {
    return (
      userProperties.find((p) => p.id === selectedPropertyId) ||
      userProperties[0] ||
      INITIAL_CLIENT_PROPERTIES[0]!
    );
  }, [userProperties, selectedPropertyId]);

  const unreadNotificationsCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  const navigateTo = (screen: ClientAppScreen, propertyId?: string) => {
    if (propertyId) {
      setSelectedPropertyId(propertyId);
    }
    setScreenHistory((prev) => [...prev, screen]);
  };

  const goBack = () => {
    setScreenHistory((prev) => (prev.length > 1 ? prev.slice(0, -1) : ["main"]));
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
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const updateProfile = (data: Partial<ClientUser>) => {
    setUser((prev) => (prev ? { ...prev, ...data } : null));
  };

  const changePassword = (_oldPass: string, _newPass: string): boolean => {
    // In demo / live, safely simulate success
    return true;
  };

  const login = (email: string, _pass: string): boolean => {
    setIsLoggedIn(true);
    setUser({
      ...INITIAL_CLIENT_USER,
      email: email || INITIAL_CLIENT_USER.email,
    });
    setScreenHistory(["main"]);
    setActiveTab("properties");
    return true;
  };

  const logout = () => {
    setIsLoggedIn(false);
    setUser(null);
    setScreenHistory(["main"]);
  };

  const formatMoney = (val: number): string => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  return (
    <ClientContext.Provider
      value={{
        user,
        isLoggedIn,
        activeTab,
        setActiveTab: (t) => {
          setActiveTab(t);
          setScreenHistory(["main"]);
        },
        currentScreen,
        navigateTo,
        goBack,
        properties: userProperties,
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

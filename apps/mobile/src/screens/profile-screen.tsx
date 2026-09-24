import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
} from "react-native";
import * as Haptics from "expo-haptics";
import {
  User,
  HelpCircle,
  Globe,
  Lock,
  ChevronRight,
  LogOut,
  FileCheck,
  DollarSign,
} from "lucide-react-native";
import { useClientApp } from "../context/client-context";
import { ClientHeader } from "../components/client-header";

export const ProfileScreen: React.FC = () => {
  const {
    user,
    logout,
    setShowEditProfileModal,
    setShowChangePasswordModal,
    t,
    language,
    setLanguage,
    currency,
    setCurrency,
    banxicoRate,
  } = useClientApp();

  const triggerHaptic = () => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleLogout = () => {
    if (Platform.OS === "ios") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    Alert.alert(
      t.logoutTitle || "Cerrar Sesión",
      t.logoutConfirm || "¿Estás seguro de que deseas cerrar tu sesión en Devio Cliente?",
      [
        { text: t.cancel || "Cancelar", style: "cancel" },
        { text: t.logout || "Cerrar Sesión", style: "destructive", onPress: logout },
      ]
    );
  };

  const handleLegal = () => {
    triggerHaptic();
    Alert.alert(
      "Aviso Legal & Privacidad",
      "Devio protege tus datos personales y contratos con encriptación de grado bancario según la LFPDPPP y estándares internacionales.",
      [{ text: "Aceptar" }]
    );
  };

  const handleSupport = () => {
    triggerHaptic();
    Alert.alert(
      t.supportTitle || "Soporte y Atención a Clientes",
      "Comunícate directamente con tu asesor inmobiliario o al canal oficial de atención Devio:\n\nWhatsApp: +52 (33) 2256 7499\nEmail: soporte@deviomx.com",
      [{ text: "Cerrar" }]
    );
  };

  const getInitials = (name?: string) => {
    if (!name) return "EE";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2 && parts[0] && parts[1]) {
      const first = parts[0][0] || "";
      const second = parts[1][0] || "";
      return (first + second).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <View style={styles.container}>
      <ClientHeader showGreeting={true} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarWrapper}>
            {user?.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {getInitials(user?.name)}
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.userName}>{user?.name || "Cliente"}</Text>
          <Text style={styles.userEmail}>{user?.email || ""}</Text>
        </View>

        {/* Section: Settings */}
        <Text style={styles.sectionHeading}>{t.settingsSection || "Ajustes"}</Text>

        <View style={styles.menuList}>
          {/* Personal Info */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              triggerHaptic();
              setShowEditProfileModal(true);
            }}
            activeOpacity={0.8}
          >
            <View style={styles.iconCircle}>
              <User size={20} color="#2563EB" />
            </View>
            <Text style={styles.menuLabel}>{t.personalInfo || "Información personal"}</Text>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>

          {/* Change Password */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              triggerHaptic();
              setShowChangePasswordModal(true);
            }}
            activeOpacity={0.8}
          >
            <View style={[styles.iconCircle, { backgroundColor: "#DCFCE7" }]}>
              <Lock size={20} color="#166534" />
            </View>
            <Text style={styles.menuLabel}>{t.changePassword || "Cambiar contraseña"}</Text>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>

          {/* Legal */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleLegal}
            activeOpacity={0.8}
          >
            <View style={styles.iconCircle}>
              <FileCheck size={20} color="#2563EB" />
            </View>
            <Text style={styles.menuLabel}>{t.legal || "Legal"}</Text>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>

          {/* Support */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleSupport}
            activeOpacity={0.8}
          >
            <View style={[styles.iconCircle, { backgroundColor: "#FEF3C7" }]}>
              <HelpCircle size={20} color="#D97706" />
            </View>
            <Text style={styles.menuLabel}>{t.support || "Soporte y Ayuda"}</Text>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Section: Language */}
        <Text style={styles.sectionHeading}>{t.languageSection || "Idioma"}</Text>
        <View style={styles.menuList}>
          <View style={styles.menuItem}>
            <View style={styles.iconCircle}>
              <Globe size={20} color="#2563EB" />
            </View>
            <Text style={styles.menuLabel}>{t.languageLabel || "Idioma"}</Text>
            <View style={styles.segmentControl}>
              <TouchableOpacity
                style={[styles.segmentBtn, language === "es" && styles.segmentBtnActive]}
                onPress={() => { triggerHaptic(); setLanguage("es"); }}
                activeOpacity={0.8}
              >
                <Text style={[styles.segmentBtnText, language === "es" && styles.segmentBtnTextActive]}>ES</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.segmentBtn, language === "en" && styles.segmentBtnActive]}
                onPress={() => { triggerHaptic(); setLanguage("en"); }}
                activeOpacity={0.8}
              >
                <Text style={[styles.segmentBtnText, language === "en" && styles.segmentBtnTextActive]}>EN</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Section: Currency */}
        <Text style={styles.sectionHeading}>{t.currencySection || "Moneda"}</Text>
        <View style={styles.menuList}>
          <View style={styles.menuItem}>
            <View style={[styles.iconCircle, { backgroundColor: "#F0FDF4" }]}>
              <DollarSign size={20} color="#16A34A" />
            </View>
            <View style={styles.menuLabelCol}>
              <Text style={styles.menuLabel}>{t.currencyLabel || "Moneda de visualización"}</Text>
              <Text style={styles.menuSubLabel}>
                {currency === "USD"
                  ? `1 USD = $${banxicoRate.toFixed(2)} MXN (Banxico)`
                  : t.currencyMXNDesc || "Pesos Mexicanos (MXN)"}
              </Text>
            </View>
            <View style={styles.segmentControl}>
              <TouchableOpacity
                style={[styles.segmentBtn, currency === "MXN" && styles.segmentBtnActive]}
                onPress={() => { triggerHaptic(); setCurrency("MXN"); }}
                activeOpacity={0.8}
              >
                <Text style={[styles.segmentBtnText, currency === "MXN" && styles.segmentBtnTextActive]}>MXN</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.segmentBtn, currency === "USD" && styles.segmentBtnActive]}
                onPress={() => { triggerHaptic(); setCurrency("USD"); }}
                activeOpacity={0.8}
              >
                <Text style={[styles.segmentBtnText, currency === "USD" && styles.segmentBtnTextActive]}>USD</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <LogOut size={18} color="#EF4444" />
          <Text style={styles.logoutText}>{t.logout || "Cerrar sesión"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 110,
    gap: 12,
  },
  profileCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  avatarWrapper: {
    width: 84,
    height: 84,
    borderRadius: 42,
    overflow: "hidden",
    marginBottom: 12,
    borderWidth: 3,
    borderColor: "#F1F5F9",
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#1F3652",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 26,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  userName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1F3652",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "500",
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: "800",
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginTop: 4,
    marginLeft: 4,
  },
  menuList: {
    gap: 10,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
    gap: 12,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: "#1F3652",
  },
  menuLabelCol: {
    flex: 1,
  },
  menuSubLabel: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  segmentControl: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: 10,
    padding: 3,
    gap: 2,
  },
  segmentBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  segmentBtnActive: {
    backgroundColor: "#1F3652",
  },
  segmentBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#94A3B8",
  },
  segmentBtnTextActive: {
    color: "#FFFFFF",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingVertical: 15,
    gap: 8,
    borderWidth: 1,
    borderColor: "#FEE2E2",
    marginTop: 4,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#EF4444",
  },
});

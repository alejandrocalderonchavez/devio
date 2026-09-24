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
} from "lucide-react-native";
import { useClientApp } from "../context/client-context";
import { ClientHeader } from "../components/client-header";

export const ProfileScreen: React.FC = () => {
  const {
    user,
    logout,
    setShowEditProfileModal,
    setShowChangePasswordModal,
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
      "Cerrar Sesión",
      "¿Estás seguro de que deseas cerrar tu sesión en Devio Cliente?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Cerrar Sesión", style: "destructive", onPress: logout },
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
      "Soporte y Atención a Clientes",
      "Comunícate directamente con tu asesor inmobiliario o al canal oficial de atención Devio:\n\nWhatsApp: +52 (33) 2256 7499\nEmail: soporte@deviomx.com",
      [{ text: "Cerrar" }]
    );
  };

  const handleLanguage = () => {
    triggerHaptic();
    Alert.alert(
      "Idioma de la Plataforma",
      "Actualmente configurado en: Español (México)",
      [{ text: "Aceptar" }]
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

          <Text style={styles.userName}>{user?.name || "Eduardo Arroniz Estefan"}</Text>
          <Text style={styles.userEmail}>{user?.email || "earronize@gmail.com"}</Text>
        </View>

        {/* Section Heading: Ajustes */}
        <Text style={styles.sectionHeading}>Ajustes</Text>

        {/* Menu Items List */}
        <View style={styles.menuList}>
          {/* 1. Información Personal */}
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
            <Text style={styles.menuLabel}>Información personal</Text>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>

          {/* 2. Seguridad & Cambiar Contraseña */}
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
            <Text style={styles.menuLabel}>Cambiar contraseña</Text>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>

          {/* 3. Legal */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleLegal}
            activeOpacity={0.8}
          >
            <View style={styles.iconCircle}>
              <FileCheck size={20} color="#2563EB" />
            </View>
            <Text style={styles.menuLabel}>Legal</Text>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>

          {/* 4. Soporte y Ayuda */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleSupport}
            activeOpacity={0.8}
          >
            <View style={[styles.iconCircle, { backgroundColor: "#FEF3C7" }]}>
              <HelpCircle size={20} color="#D97706" />
            </View>
            <Text style={styles.menuLabel}>Soporte y Ayuda</Text>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>

          {/* 5. Idioma */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleLanguage}
            activeOpacity={0.8}
          >
            <View style={styles.iconCircle}>
              <Globe size={20} color="#2563EB" />
            </View>
            <Text style={styles.menuLabel}>Idioma</Text>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <LogOut size={18} color="#EF4444" />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
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
    gap: 16,
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
    fontSize: 16,
    fontWeight: "800",
    color: "#1F3652",
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
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  menuLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: "#1F3652",
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

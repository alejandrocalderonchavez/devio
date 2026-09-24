import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import {
  User,
  Shield,
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

  const handleLogout = () => {
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
    Alert.alert(
      "Aviso Legal & Privacidad",
      "Devio protege tus datos personales y contratos con encriptación de grado bancario según la LFPDPPP y estándares internacionales.",
      [{ text: "Aceptar" }]
    );
  };

  const handleSupport = () => {
    Alert.alert(
      "Soporte y Atención a Clientes",
      "Comunícate directamente con tu asesor inmobiliario o al canal oficial de atención Devio:\n\nWhatsApp: +52 (33) 2256 7499\nEmail: soporte@deviomx.com",
      [{ text: "Cerrar" }]
    );
  };

  const handleLanguage = () => {
    Alert.alert(
      "Idioma de la Plataforma",
      "Actualmente configurado en: Español (México)",
      [{ text: "Aceptar" }]
    );
  };

  return (
    <View style={styles.container}>
      <ClientHeader showGreeting={false} />

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
                  {user?.name ? user.name.split(" ").map(w => w[0]).slice(0, 2).join("") : "IH"}
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.userName}>{user?.name || "Iñigo Heredia Horner"}</Text>
          <Text style={styles.userEmail}>{user?.email || "0242573@up.edu.mx"}</Text>
        </View>

        {/* Section Heading: Ajustes */}
        <Text style={styles.sectionHeading}>Ajustes</Text>

        {/* Menu Items List */}
        <View style={styles.menuList}>
          {/* 1. Información Personal */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setShowEditProfileModal(true)}
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
            onPress={() => setShowChangePasswordModal(true)}
            activeOpacity={0.8}
          >
            <View style={styles.iconCircle}>
              <Lock size={20} color="#00C48C" />
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
            <View style={styles.iconCircle}>
              <HelpCircle size={20} color="#2563EB" />
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
    backgroundColor: "#F1F5F9",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 16,
  },
  profileCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
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
    width: 90,
    height: 90,
    borderRadius: 45,
    overflow: "hidden",
    marginBottom: 14,
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
    backgroundColor: "#D97706",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  userName: {
    fontSize: 20,
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
    fontSize: 20,
    fontWeight: "900",
    color: "#1F3652",
    marginTop: 8,
  },
  menuList: {
    gap: 12,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: "#1F3652",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingVertical: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: "#FEE2E2",
    marginTop: 8,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#EF4444",
  },
});

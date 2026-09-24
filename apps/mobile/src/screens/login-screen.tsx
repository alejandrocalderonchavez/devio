import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from "react-native";
import { Mail, Lock, ArrowRight, ShieldCheck, Sparkles } from "lucide-react-native";
import { useClientApp } from "../context/client-context";

export const LoginScreen: React.FC = () => {
  const { login } = useClientApp();
  const [email, setEmail] = useState("0242573@up.edu.mx");
  const [password, setPassword] = useState("password123");

  const handleLogin = () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Campos requeridos", "Por favor ingresa tu correo y contraseña.");
      return;
    }
    login(email.trim(), password.trim());
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.inner}
      >
        {/* Top Logo Section */}
        <View style={styles.logoSection}>
          <Image
            source={require("../../assets/logo-horizontal-light.png")}
            style={styles.officialBrandLogo}
          />
          <Text style={styles.brandSubtitle}>
            Portal exclusivo para propietarios e inversionistas
          </Text>
        </View>

        {/* Login Form Card */}
        <View style={styles.card}>
          <Text style={styles.formTitle}>Iniciar Sesión</Text>
          <Text style={styles.formSubtitle}>
            Accede a todas tus propiedades, avances de obra y estados de cuenta.
          </Text>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Correo Electrónico</Text>
            <View style={styles.inputWrap}>
              <Mail size={18} color="#64748B" />
              <TextInput
                style={styles.textInput}
                value={email}
                onChangeText={setEmail}
                placeholder="cliente@ejemplo.com"
                placeholderTextColor="#94A3B8"
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Contraseña</Text>
            <View style={styles.inputWrap}>
              <Lock size={18} color="#64748B" />
              <TextInput
                style={styles.textInput}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="#94A3B8"
                secureTextEntry={true}
              />
            </View>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={handleLogin}
            activeOpacity={0.85}
          >
            <Text style={styles.loginBtnText}>Ingresar al Portal</Text>
            <ArrowRight size={18} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Demo Auto-fill Helper */}
          <TouchableOpacity
            style={styles.demoPill}
            onPress={() => {
              setEmail("0242573@up.edu.mx");
              setPassword("password123");
              login("0242573@up.edu.mx", "password123");
            }}
            activeOpacity={0.8}
          >
            <Sparkles size={14} color="#00C48C" />
            <Text style={styles.demoPillText}>
              Acceso Rápido Demo: Iñigo Heredia (Castellana 1C)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer Security Note */}
        <View style={styles.footer}>
          <ShieldCheck size={16} color="#94A3B8" />
          <Text style={styles.footerText}>
            Acceso seguro y protegido con encriptación Devio Cloud
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1F3652",
  },
  inner: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  logoSection: {
    alignItems: "center",
    marginTop: 20,
  },
  officialBrandLogo: {
    height: 42,
    width: 170,
    resizeMode: "contain",
    marginBottom: 8,
  },
  brandSubtitle: {
    color: "rgba(255, 255, 255, 0.75)",
    fontSize: 13,
    marginTop: 4,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 24,
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#1F3652",
  },
  formSubtitle: {
    fontSize: 13,
    color: "#64748B",
    lineHeight: 18,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: "#1F3652",
    fontWeight: "600",
  },
  loginBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1F3652",
    borderRadius: 99,
    paddingVertical: 14,
    gap: 8,
    marginTop: 4,
  },
  loginBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  demoPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 196, 140, 0.1)",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 99,
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(0, 196, 140, 0.25)",
  },
  demoPillText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#00875A",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: 10,
  },
  footerText: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.6)",
  },
});

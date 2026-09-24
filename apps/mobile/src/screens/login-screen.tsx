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
  ActivityIndicator,
} from "react-native";
import * as Haptics from "expo-haptics";
import { Mail, Lock, ArrowRight, ShieldCheck, Eye, EyeOff } from "lucide-react-native";
import { useClientApp } from "../context/client-context";

export const LoginScreen: React.FC = () => {
  const { login, isLoading } = useClientApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (!email.trim() || !password.trim()) {
      Alert.alert("Campos requeridos", "Por favor ingresa tu correo y contraseña.");
      return;
    }

    const res = await login(email.trim(), password.trim());
    if (!res.success) {
      if (Platform.OS === "ios") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      Alert.alert("Error de Acceso", res.error || "No se pudo iniciar sesión.");
    } else {
      if (Platform.OS === "ios") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.inner}
      >
        {/* Top Logo Section with Devio Crisp White Brand Logo */}
        <View style={styles.logoSection}>
          <Image
            source={require("../../assets/logo-white.png")}
            style={styles.officialBrandLogo}
          />
        </View>

        {/* Login Form Apple Glass Card */}
        <View style={styles.card}>
          <Text style={styles.formTitle}>Iniciar Sesión</Text>
          <Text style={styles.formSubtitle}>
            Accede a todas tus propiedades, estados de cuenta oficiales y seguimiento de obra en vivo.
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
                placeholder="ejemplo@correo.com"
                placeholderTextColor="#94A3B8"
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!isLoading}
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
                secureTextEntry={!showPassword}
                editable={!isLoading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                {showPassword ? (
                  <EyeOff size={18} color="#94A3B8" />
                ) : (
                  <Eye size={18} color="#94A3B8" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Login Button with Apple Haptics */}
          <TouchableOpacity
            style={[styles.loginBtn, isLoading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.loginBtnText}>Ingresar al Portal</Text>
                <ArrowRight size={18} color="#FFFFFF" />
              </>
            )}
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
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  logoSection: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 8,
  },
  officialBrandLogo: {
    height: 58,
    width: 210,
    resizeMode: "contain",
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.96)",
    borderRadius: 26,
    padding: 24,
    gap: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.8)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
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
    paddingVertical: 15,
    gap: 8,
    marginTop: 6,
    shadowColor: "#1F3652",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: 6,
  },
  footerText: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.6)",
  },
});

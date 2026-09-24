import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  Alert,
} from "react-native";
import { X, Lock, Key, ShieldCheck, Check } from "lucide-react-native";
import { useClientApp } from "../context/client-context";

export const ChangePasswordModal: React.FC = () => {
  const {
    showChangePasswordModal,
    setShowChangePasswordModal,
    changePassword,
  } = useClientApp();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSave = () => {
    if (!currentPassword.trim()) {
      Alert.alert("Campo requerido", "Por favor ingresa tu contraseña actual.");
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert("Contraseña débil", "La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("No coinciden", "La nueva contraseña y su confirmación no coinciden.");
      return;
    }

    const success = changePassword(currentPassword, newPassword);
    if (success) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowChangePasswordModal(false);
      Alert.alert("Contraseña Actualizada", "Tu contraseña se ha cambiado exitosamente.");
    }
  };

  return (
    <Modal
      visible={showChangePasswordModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowChangePasswordModal(false)}
    >
      <View style={styles.modalOverlay}>
        <SafeAreaView style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Lock size={20} color="#00C48C" />
              <Text style={styles.headerTitle}>Cambiar Contraseña</Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowChangePasswordModal(false)}
              style={styles.closeBtn}
              activeOpacity={0.7}
            >
              <X size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Form */}
          <ScrollView contentContainerStyle={styles.formContent}>
            <Text style={styles.helperText}>
              Por tu seguridad, ingresa tu contraseña actual y define una nueva clave segura.
            </Text>

            {/* Contraseña Actual */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Contraseña Actual</Text>
              <View style={styles.inputWrap}>
                <Key size={18} color="#64748B" />
                <TextInput
                  style={styles.textInput}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="••••••••"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={true}
                />
              </View>
            </View>

            {/* Nueva Contraseña */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nueva Contraseña</Text>
              <View style={styles.inputWrap}>
                <Lock size={18} color="#64748B" />
                <TextInput
                  style={styles.textInput}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Mínimo 6 caracteres"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={true}
                />
              </View>
            </View>

            {/* Confirmar Nueva Contraseña */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirmar Nueva Contraseña</Text>
              <View style={styles.inputWrap}>
                <Lock size={18} color="#64748B" />
                <TextInput
                  style={styles.textInput}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Repite la nueva contraseña"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={true}
                />
              </View>
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSave}
              activeOpacity={0.85}
            >
              <Check size={18} color="#FFFFFF" />
              <Text style={styles.saveBtnText}>Actualizar Contraseña</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "85%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1F3652",
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  formContent: {
    padding: 20,
    gap: 16,
  },
  helperText: {
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
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    gap: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: "#1F3652",
    fontWeight: "600",
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1F3652",
    borderRadius: 99,
    paddingVertical: 14,
    gap: 8,
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  saveBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
});

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
import { X, User, Phone, Mail, FileText, MapPin, Check } from "lucide-react-native";
import { useClientApp } from "../context/client-context";

export const EditProfileModal: React.FC = () => {
  const {
    user,
    showEditProfileModal,
    setShowEditProfileModal,
    updateProfile,
  } = useClientApp();

  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [rfc, setRfc] = useState(user?.rfc || "");
  const [address, setAddress] = useState(user?.address || "");

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert("Campo requerido", "Por favor ingresa tu nombre completo.");
      return;
    }
    updateProfile({
      name: name.trim(),
      phone: phone.trim(),
      rfc: rfc.trim(),
      address: address.trim(),
    });
    setShowEditProfileModal(false);
    Alert.alert("Perfil Actualizado", "Tus datos personales se han guardado correctamente.");
  };

  return (
    <Modal
      visible={showEditProfileModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowEditProfileModal(false)}
    >
      <View style={styles.modalOverlay}>
        <SafeAreaView style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Editar Información Personal</Text>
            <TouchableOpacity
              onPress={() => setShowEditProfileModal(false)}
              style={styles.closeBtn}
              activeOpacity={0.7}
            >
              <X size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Form */}
          <ScrollView contentContainerStyle={styles.formContent}>
            {/* Nombre */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nombre Completo</Text>
              <View style={styles.inputWrap}>
                <User size={18} color="#64748B" />
                <TextInput
                  style={styles.textInput}
                  value={name}
                  onChangeText={setName}
                  placeholder="Tu nombre completo"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            {/* Email (Readonly) */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Correo Electrónico (Registrado)</Text>
              <View style={[styles.inputWrap, { backgroundColor: "#F1F5F9" }]}>
                <Mail size={18} color="#94A3B8" />
                <TextInput
                  style={[styles.textInput, { color: "#64748B" }]}
                  value={user?.email}
                  editable={false}
                />
              </View>
            </View>

            {/* Teléfono */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Teléfono de Contacto</Text>
              <View style={styles.inputWrap}>
                <Phone size={18} color="#64748B" />
                <TextInput
                  style={styles.textInput}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+52 33 0000 0000"
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* RFC */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>RFC (Datos Fiscales)</Text>
              <View style={styles.inputWrap}>
                <FileText size={18} color="#64748B" />
                <TextInput
                  style={styles.textInput}
                  value={rfc}
                  onChangeText={setRfc}
                  placeholder="HEHI9604128N2"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="characters"
                />
              </View>
            </View>

            {/* Dirección */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Domicilio Particular</Text>
              <View style={styles.inputWrap}>
                <MapPin size={18} color="#64748B" />
                <TextInput
                  style={styles.textInput}
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Calle, Número, Colonia, Ciudad"
                  placeholderTextColor="#94A3B8"
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
              <Text style={styles.saveBtnText}>Guardar Cambios</Text>
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
    maxHeight: "90%",
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

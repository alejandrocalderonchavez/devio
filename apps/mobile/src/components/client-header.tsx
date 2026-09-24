import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { Bell } from "lucide-react-native";
import { useClientApp } from "../context/client-context";

interface ClientHeaderProps {
  showGreeting?: boolean;
}

export const ClientHeader: React.FC<ClientHeaderProps> = ({ showGreeting = true }) => {
  const { user, unreadNotificationsCount, setShowNotificationsModal, setActiveTab } = useClientApp();

  return (
    <View style={styles.headerContainer}>
      <View style={styles.topRow}>
        {/* Devio Official Logo */}
        <Image
          source={require("../../assets/logo-horizontal-light.png")}
          style={styles.officialLogo}
        />

        {/* Action Icons: Notification Bell & Profile Avatar */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.bellButton}
            onPress={() => setShowNotificationsModal(true)}
            activeOpacity={0.7}
          >
            <Bell size={20} color="#1F3652" />
            {unreadNotificationsCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadNotificationsCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.avatarButton}
            onPress={() => setActiveTab("profile")}
            activeOpacity={0.7}
          >
            {user?.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>
                  {user?.name ? user.name.split(" ").map(w => w[0]).slice(0, 2).join("") : "IH"}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Greeting row */}
      {showGreeting && user && (
        <View style={styles.greetingSection}>
          <Text style={styles.greetingEyebrow}>Hola,</Text>
          <Text style={styles.greetingName}>{user.name}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: "#1F3652",
    paddingTop: 54,
    paddingBottom: 22,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  officialLogo: {
    height: 28,
    width: 110,
    resizeMode: "contain",
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#EF4444",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: "#1F3652",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },
  avatarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.4)",
  },
  avatarImage: {
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
  avatarInitials: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  greetingSection: {
    marginTop: 20,
  },
  greetingEyebrow: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 14,
    fontWeight: "500",
  },
  greetingName: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "800",
    marginTop: 2,
    letterSpacing: -0.5,
  },
});

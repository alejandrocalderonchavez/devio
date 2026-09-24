import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
} from "react-native";
import * as Haptics from "expo-haptics";
import { Bell, ArrowLeft } from "lucide-react-native";
import { useClientApp } from "../context/client-context";

interface ClientHeaderProps {
  showGreeting?: boolean;
  isSubscreen?: boolean;
  screenTitle?: string;
  screenSubtitle?: string;
  onBack?: () => void;
}

export const ClientHeader: React.FC<ClientHeaderProps> = ({
  showGreeting = true,
  isSubscreen = false,
  screenTitle,
  screenSubtitle,
  onBack,
}) => {
  const {
    user,
    unreadNotificationsCount,
    setShowNotificationsModal,
    setActiveTab,
    activeTab,
    goBack,
  } = useClientApp();

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

  const handleBackPress = () => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (onBack) {
      onBack();
    } else {
      goBack();
    }
  };

  const handleBellPress = () => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowNotificationsModal(true);
  };

  const handleProfilePress = () => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setActiveTab("profile");
  };

  return (
    <View style={styles.headerContainer}>
      {isSubscreen ? (
        /* Sub-screen Header with Circular Back Arrow & Centered Title */
        <View style={styles.subscreenRow}>
          <TouchableOpacity
            style={styles.subscreenBackBtn}
            onPress={handleBackPress}
            activeOpacity={0.7}
          >
            <ArrowLeft size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.subscreenTitleCol}>
            {screenSubtitle && (
              <Text style={styles.subscreenSubtitle}>{screenSubtitle}</Text>
            )}
            <Text style={styles.subscreenTitle} numberOfLines={1}>
              {screenTitle || "Detalle"}
            </Text>
          </View>

          <View style={styles.subscreenSpacer} />
        </View>
      ) : (
        /* Main Screen Header with Devio White Brand Logo & Apple Glass */
        <View style={styles.mainHeaderCol}>
          <View style={styles.topRow}>
            {/* Devio Official Brand Logo in Crisp White */}
            <Image
              source={require("../../assets/logo-white.png")}
              style={styles.officialLogo}
            />

            {/* Action Icons: Notification Bell & Profile Avatar */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.bellButton}
                onPress={handleBellPress}
                activeOpacity={0.7}
              >
                <Bell size={18} color="#FFFFFF" />
                {unreadNotificationsCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{unreadNotificationsCount}</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.avatarButton}
                onPress={handleProfilePress}
                activeOpacity={0.7}
              >
                {user?.avatarUrl ? (
                  <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarInitials}>
                      {getInitials(user?.name)}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Greeting row */}
          {showGreeting && (
            <View style={styles.greetingSection}>
              {activeTab === "properties" ? (
                <>
                  <Text style={styles.greetingEyebrow}>Bienvenido de nuevo,</Text>
                  <Text style={styles.greetingName}>{user?.name || "Eduardo Arroniz Estefan"}</Text>
                </>
              ) : (
                <Text style={styles.greetingName}>Mi Perfil de Cliente</Text>
              )}
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: "rgba(31, 54, 82, 0.94)",
    paddingTop: Platform.OS === "ios" ? 54 : 40,
    paddingBottom: 22,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.15)",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
    zIndex: 10,
  },
  mainHeaderCol: {
    gap: 16,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  officialLogo: {
    height: 32,
    width: 120,
    resizeMode: "contain",
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  bellButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
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
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
    borderWidth: 2,
    borderColor: "#1F3652",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
  },
  avatarButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  avatarImage: {
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
  avatarInitials: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  greetingSection: {
    marginTop: 4,
  },
  greetingEyebrow: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 13,
    fontWeight: "500",
  },
  greetingName: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "800",
    marginTop: 2,
    letterSpacing: -0.4,
  },
  subscreenRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  subscreenBackBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  subscreenTitleCol: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    paddingHorizontal: 8,
  },
  subscreenSubtitle: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  subscreenTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  subscreenSpacer: {
    width: 38,
  },
});

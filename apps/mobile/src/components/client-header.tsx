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
    t,
    language,
    setLanguage,
    currency,
    setCurrency,
    banxicoRate,
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
        /* Sub-screen Header */
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
        /* Main Screen Header */
        <View style={styles.mainHeaderCol}>
          {/* Top row: Logo + Bell + Avatar */}
          <View style={styles.topRow}>
            <Image
              source={require("../../assets/logo-white.png")}
              style={styles.officialLogo}
            />

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
                  <Text style={styles.greetingEyebrow}>{t.welcomeBack}</Text>
                  <Text style={styles.greetingName}>{user?.name || "Cliente"}</Text>
                </>
              ) : (
                <Text style={styles.greetingName}>{t.myProfile}</Text>
              )}
            </View>
          )}

          {/* Controls Row: Banxico rate + Currency + Language */}
          <View style={styles.controlsRow}>
            <View style={styles.banxicoBadge}>
              <Text style={styles.banxicoText}>
                ${banxicoRate.toFixed(2)} MXN/USD
              </Text>
            </View>

            {/* Currency toggle */}
            <View style={styles.togglePill}>
              <TouchableOpacity
                style={[styles.toggleBtn, currency === "MXN" && styles.toggleBtnActive]}
                onPress={() => { if (Platform.OS === "ios") Haptics.selectionAsync(); setCurrency("MXN"); }}
                activeOpacity={0.8}
              >
                <Text style={[styles.toggleBtnText, currency === "MXN" && styles.toggleBtnTextActive]}>MXN</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, currency === "USD" && styles.toggleBtnActive]}
                onPress={() => { if (Platform.OS === "ios") Haptics.selectionAsync(); setCurrency("USD"); }}
                activeOpacity={0.8}
              >
                <Text style={[styles.toggleBtnText, currency === "USD" && styles.toggleBtnTextActive]}>USD</Text>
              </TouchableOpacity>
            </View>

            {/* Language toggle */}
            <View style={styles.togglePill}>
              <TouchableOpacity
                style={[styles.toggleBtn, language === "es" && styles.toggleBtnActive]}
                onPress={() => { if (Platform.OS === "ios") Haptics.selectionAsync(); setLanguage("es"); }}
                activeOpacity={0.8}
              >
                <Text style={[styles.toggleBtnText, language === "es" && styles.toggleBtnTextActive]}>ES</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, language === "en" && styles.toggleBtnActive]}
                onPress={() => { if (Platform.OS === "ios") Haptics.selectionAsync(); setLanguage("en"); }}
                activeOpacity={0.8}
              >
                <Text style={[styles.toggleBtnText, language === "en" && styles.toggleBtnTextActive]}>EN</Text>
              </TouchableOpacity>
            </View>
          </View>
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
    gap: 12,
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
    marginTop: 2,
  },
  greetingEyebrow: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 13,
    fontWeight: "500",
  },
  greetingName: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
    marginTop: 2,
    letterSpacing: -0.4,
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  banxicoBadge: {
    backgroundColor: "rgba(0, 196, 140, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(0, 196, 140, 0.4)",
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  banxicoText: {
    color: "#00C48C",
    fontSize: 10,
    fontWeight: "700",
  },
  togglePill: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 99,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    overflow: "hidden",
  },
  toggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
  },
  toggleBtnActive: {
    backgroundColor: "#FFFFFF",
  },
  toggleBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.65)",
  },
  toggleBtnTextActive: {
    color: "#1F3652",
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

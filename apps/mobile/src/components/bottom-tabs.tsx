import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { Home, User } from "lucide-react-native";
import { useClientApp } from "../context/client-context";

export const BottomTabs: React.FC = () => {
  const { activeTab, setActiveTab } = useClientApp();

  const handleTabPress = (tab: "properties" | "profile") => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setActiveTab(tab);
  };

  return (
    <View style={styles.floatingWrapper} pointerEvents="box-none">
      <View style={styles.glassContainer}>
        <BlurView
          intensity={Platform.OS === "ios" ? 80 : 100}
          tint={Platform.OS === "ios" ? "dark" : "dark"}
          style={styles.blurView}
        >
          {/* Tab 1: Mis Propiedades */}
          <TouchableOpacity
            style={[
              styles.tabItem,
              activeTab === "properties" && styles.tabItemActive,
            ]}
            onPress={() => handleTabPress("properties")}
            activeOpacity={0.7}
          >
            <Home
              size={22}
              color={activeTab === "properties" ? "#FFFFFF" : "rgba(255, 255, 255, 0.5)"}
              strokeWidth={activeTab === "properties" ? 2.5 : 2}
            />
            <Text
              style={[
                styles.tabLabel,
                activeTab === "properties" && styles.tabLabelActive,
              ]}
            >
              Mis Propiedades
            </Text>
          </TouchableOpacity>

          {/* Tab 2: Mi Perfil */}
          <TouchableOpacity
            style={[
              styles.tabItem,
              activeTab === "profile" && styles.tabItemActive,
            ]}
            onPress={() => handleTabPress("profile")}
            activeOpacity={0.7}
          >
            <User
              size={22}
              color={activeTab === "profile" ? "#FFFFFF" : "rgba(255, 255, 255, 0.5)"}
              strokeWidth={activeTab === "profile" ? 2.5 : 2}
            />
            <Text
              style={[
                styles.tabLabel,
                activeTab === "profile" && styles.tabLabelActive,
              ]}
            >
              Mi Perfil
            </Text>
          </TouchableOpacity>
        </BlurView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  floatingWrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingBottom: Platform.OS === "ios" ? 28 : 16,
    paddingHorizontal: 20,
    zIndex: 999,
  },
  glassContainer: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 36,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    backgroundColor: Platform.OS === "ios" ? "rgba(22, 36, 56, 0.85)" : "#162438",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  blurView: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 12,
    justifyContent: "space-around",
    alignItems: "center",
  },
  tabItem: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 24,
    gap: 4,
  },
  tabItemActive: {
    backgroundColor: "rgba(255, 255, 255, 0.14)",
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.55)",
    letterSpacing: 0.2,
  },
  tabLabelActive: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
});

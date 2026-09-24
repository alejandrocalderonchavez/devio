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
          tint="dark"
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
            <View
              style={[
                styles.iconWrapper,
                activeTab === "properties" && styles.iconWrapperActive,
              ]}
            >
              <Home
                size={20}
                color={activeTab === "properties" ? "#FFFFFF" : "rgba(255, 255, 255, 0.55)"}
                strokeWidth={activeTab === "properties" ? 2.5 : 2}
              />
            </View>
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
            <View
              style={[
                styles.iconWrapper,
                activeTab === "profile" && styles.iconWrapperActive,
              ]}
            >
              <User
                size={20}
                color={activeTab === "profile" ? "#FFFFFF" : "rgba(255, 255, 255, 0.55)"}
                strokeWidth={activeTab === "profile" ? 2.5 : 2}
              />
            </View>
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
    paddingBottom: Platform.OS === "ios" ? 26 : 16,
    paddingHorizontal: 20,
    zIndex: 999,
  },
  glassContainer: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 36,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.2)",
    backgroundColor: Platform.OS === "ios" ? "rgba(31, 54, 82, 0.92)" : "#1F3652",
    shadowColor: "#1F3652",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 12,
  },
  blurView: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 12,
    justifyContent: "space-around",
    alignItems: "center",
  },
  tabItem: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    paddingHorizontal: 16,
    gap: 3,
  },
  tabItemActive: {},
  iconWrapper: {
    width: 44,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  iconWrapperActive: {
    backgroundColor: "rgba(255, 255, 255, 0.18)",
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.65)",
    letterSpacing: 0.1,
  },
  tabLabelActive: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
});

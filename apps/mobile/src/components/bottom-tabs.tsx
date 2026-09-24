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
          intensity={Platform.OS === "ios" ? 85 : 100}
          tint={Platform.OS === "ios" ? "systemChromeMaterialLight" : "light"}
          style={styles.blurView}
        >
          {/* Tab 1: Mis Propiedades */}
          <TouchableOpacity
            style={[
              styles.tabItem,
              activeTab === "properties" && styles.tabItemActive,
            ]}
            onPress={() => handleTabPress("properties")}
            activeOpacity={0.75}
          >
            <View
              style={[
                styles.iconWrapper,
                activeTab === "properties" && styles.iconWrapperActive,
              ]}
            >
              <Home
                size={20}
                color={activeTab === "properties" ? "#FFFFFF" : "#64748B"}
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
            activeOpacity={0.75}
          >
            <View
              style={[
                styles.iconWrapper,
                activeTab === "profile" && styles.iconWrapperActive,
              ]}
            >
              <User
                size={20}
                color={activeTab === "profile" ? "#FFFFFF" : "#64748B"}
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
    paddingBottom: Platform.OS === "ios" ? 28 : 16,
    paddingHorizontal: 16,
    zIndex: 999,
  },
  glassContainer: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 30,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.75)",
    backgroundColor: Platform.OS === "ios" ? "rgba(255, 255, 255, 0.72)" : "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 10,
  },
  blurView: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 10,
    justifyContent: "space-around",
    alignItems: "center",
  },
  tabItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 22,
    gap: 8,
  },
  tabItemActive: {
    backgroundColor: "rgba(31, 54, 82, 0.06)",
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  iconWrapperActive: {
    backgroundColor: "#1F3652",
    shadowColor: "#1F3652",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },
  tabLabelActive: {
    color: "#1F3652",
    fontWeight: "800",
  },
});

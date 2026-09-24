import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Home, User } from "lucide-react-native";
import { useClientApp } from "../context/client-context";

export const BottomTabs: React.FC = () => {
  const { activeTab, setActiveTab } = useClientApp();

  return (
    <View style={styles.container}>
      {/* Tab 1: Propiedades */}
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => setActiveTab("properties")}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.iconWrapper,
            activeTab === "properties" && styles.iconWrapperActive,
          ]}
        >
          <Home
            size={22}
            color={activeTab === "properties" ? "#FFFFFF" : "#94A3B8"}
          />
        </View>
        <Text
          style={[
            styles.tabLabel,
            activeTab === "properties" && styles.tabLabelActive,
          ]}
        >
          Propiedades
        </Text>
      </TouchableOpacity>

      {/* Tab 2: Perfil */}
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => setActiveTab("profile")}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.iconWrapper,
            activeTab === "profile" && styles.iconWrapperActive,
          ]}
        >
          <User
            size={22}
            color={activeTab === "profile" ? "#FFFFFF" : "#94A3B8"}
          />
        </View>
        <Text
          style={[
            styles.tabLabel,
            activeTab === "profile" && styles.tabLabelActive,
          ]}
        >
          Perfil
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingTop: 10,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
    justifyContent: "space-around",
    alignItems: "center",
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    gap: 4,
  },
  iconWrapper: {
    width: 44,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  iconWrapperActive: {
    backgroundColor: "#1F3652",
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94A3B8",
  },
  tabLabelActive: {
    color: "#1F3652",
    fontWeight: "700",
  },
});

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Home, User } from "lucide-react-native";
import { useClientApp } from "../context/client-context";

export const BottomTabs: React.FC = () => {
  const { activeTab, setActiveTab } = useClientApp();

  return (
    <View style={styles.container}>
      {/* Tab 1: Mis Propiedades */}
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
            size={20}
            color={activeTab === "properties" ? "#FFFFFF" : "#94A3B8"}
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
            size={20}
            color={activeTab === "profile" ? "#FFFFFF" : "#94A3B8"}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingTop: 8,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
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
    gap: 3,
  },
  iconWrapper: {
    width: 42,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  iconWrapperActive: {
    backgroundColor: "#1F3652",
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
  },
  tabLabelActive: {
    color: "#1F3652",
    fontWeight: "800",
  },
});

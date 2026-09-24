import React from "react";
import { View, StyleSheet, SafeAreaView, Platform } from "react-native";
import { useClientApp } from "../context/client-context";
import { PropertiesScreen } from "../screens/properties-screen";
import { PropertyDetailScreen } from "../screens/property-detail-screen";
import { ConstructionScreen } from "../screens/construction-screen";
import { DocumentsScreen } from "../screens/documents-screen";
import { AccountStatementScreen } from "../screens/account-statement-screen";
import { ProfileScreen } from "../screens/profile-screen";
import { LoginScreen } from "../screens/login-screen";
import { BottomTabs } from "../components/bottom-tabs";
import { NotificationsModal } from "../components/notifications-modal";
import { ReceiptPdfModal } from "../components/receipt-pdf-modal";
import { EditProfileModal } from "../screens/edit-profile-modal";
import { ChangePasswordModal } from "../screens/change-password-modal";

export const RootNavigator: React.FC = () => {
  const { isLoggedIn, currentScreen, activeTab } = useClientApp();

  if (!isLoggedIn) {
    return <LoginScreen />;
  }

  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case "property-detail":
        return <PropertyDetailScreen />;
      case "construction":
        return <ConstructionScreen />;
      case "documents":
        return <DocumentsScreen />;
      case "account-statement":
        return <AccountStatementScreen />;
      case "main":
      default:
        return activeTab === "properties" ? (
          <PropertiesScreen />
        ) : (
          <ProfileScreen />
        );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.screenWrapper}>{renderCurrentScreen()}</View>

      {/* Bottom Navigation Tabs (Shown on main home & profile) */}
      {currentScreen === "main" && <BottomTabs />}

      {/* Global Modals & Drawers */}
      <NotificationsModal />
      <ReceiptPdfModal />
      <EditProfileModal />
      <ChangePasswordModal />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    width: "100%",
    maxWidth: Platform.OS === "web" ? 540 : undefined,
    alignSelf: "center",
    shadowColor: Platform.OS === "web" ? "rgba(0,0,0,0.12)" : undefined,
    shadowOffset: Platform.OS === "web" ? { width: 0, height: 0 } : undefined,
    shadowOpacity: Platform.OS === "web" ? 1 : undefined,
    shadowRadius: Platform.OS === "web" ? 24 : undefined,
    minHeight: Platform.OS === "web" ? "100%" as any : undefined,
  },
  screenWrapper: {
    flex: 1,
  },
});

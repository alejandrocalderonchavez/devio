import React from "react";
import { View, StyleSheet, Platform } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
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

const Stack = createNativeStackNavigator();

function MainTabScreen() {
  const { activeTab } = useClientApp();
  return (
    <View style={styles.mainTabWrapper}>
      <View style={styles.tabContent}>
        {activeTab === "properties" ? <PropertiesScreen /> : <ProfileScreen />}
      </View>
      <BottomTabs />
    </View>
  );
}

export const RootNavigator: React.FC = () => {
  const { isLoggedIn } = useClientApp();

  return (
    <View style={styles.container}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
          gestureEnabled: true,
          fullScreenGestureEnabled: true,
          contentStyle: { backgroundColor: "#F1F5F9" },
        }}
      >
        {!isLoggedIn ? (
          <Stack.Screen name="Login" component={LoginScreen} options={{ animation: "fade" }} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabScreen} />
            <Stack.Screen name="PropertyDetail" component={PropertyDetailScreen} />
            <Stack.Screen name="AccountStatement" component={AccountStatementScreen} />
            <Stack.Screen name="Construction" component={ConstructionScreen} />
            <Stack.Screen name="Documents" component={DocumentsScreen} />
          </>
        )}
      </Stack.Navigator>

      {/* Global Modals */}
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
    backgroundColor: "#1F3652",
    width: "100%",
    maxWidth: Platform.OS === "web" ? 540 : undefined,
    alignSelf: "center",
  },
  mainTabWrapper: {
    flex: 1,
    backgroundColor: "#F1F5F9",
  },
  tabContent: {
    flex: 1,
  },
});

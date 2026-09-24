import React from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { ClientProvider, navigationRef } from "./src/context/client-context";
import { RootNavigator } from "./src/navigation/root-navigator";

export default function App() {
  return (
    <NavigationContainer ref={navigationRef}>
      <ClientProvider>
        <View style={styles.root}>
          <StatusBar style="light" />
          <RootNavigator />
        </View>
      </ClientProvider>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#1F3652",
  },
});

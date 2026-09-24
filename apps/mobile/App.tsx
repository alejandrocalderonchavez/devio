import React from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView, StyleSheet, View } from "react-native";
import { ClientProvider } from "./src/context/client-context";
import { RootNavigator } from "./src/navigation/root-navigator";

export default function App() {
  return (
    <ClientProvider>
      <View style={styles.root}>
        <StatusBar style="light" />
        <RootNavigator />
      </View>
    </ClientProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#1F3652",
  },
});

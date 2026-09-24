import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// In-memory fallback in case SecureStore is unavailable or in non-native environments
const memoryFallback: Record<string, string> = {};

export const appStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === "web") {
        const storage = (globalThis as any).localStorage;
        if (storage) {
          return storage.getItem(key);
        }
        return memoryFallback[key] || null;
      }
      const isAvailable = await SecureStore.isAvailableAsync();
      if (isAvailable) {
        return await SecureStore.getItemAsync(key);
      }
      return memoryFallback[key] || null;
    } catch (err) {
      console.warn("Storage getItem fallback to memory:", err);
      return memoryFallback[key] || null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      memoryFallback[key] = value;
      if (Platform.OS === "web") {
        const storage = (globalThis as any).localStorage;
        if (storage) {
          storage.setItem(key, value);
        }
        return;
      }
      const isAvailable = await SecureStore.isAvailableAsync();
      if (isAvailable) {
        await SecureStore.setItemAsync(key, value);
      }
    } catch (err) {
      console.warn("Storage setItem fallback to memory:", err);
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      delete memoryFallback[key];
      if (Platform.OS === "web") {
        const storage = (globalThis as any).localStorage;
        if (storage) {
          storage.removeItem(key);
        }
        return;
      }
      const isAvailable = await SecureStore.isAvailableAsync();
      if (isAvailable) {
        await SecureStore.deleteItemAsync(key);
      }
    } catch (err) {
      console.warn("Storage removeItem fallback to memory:", err);
    }
  },
};

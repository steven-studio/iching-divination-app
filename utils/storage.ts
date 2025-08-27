import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

export async function storageGetItem(key: string): Promise<string | null> {
  try {
    if (Platform.OS === "web") {
      const local = (globalThis as unknown as { localStorage?: Storage }).localStorage;
      return local ? local.getItem(key) : null;
    }
    return await AsyncStorage.getItem(key);
  } catch (e) {
    console.log("[storage] get error", e);
    return null;
  }
}

export async function storageSetItem(key: string, value: string): Promise<void> {
  try {
    if (Platform.OS === "web") {
      const local = (globalThis as unknown as { localStorage?: Storage }).localStorage;
      if (local) local.setItem(key, value);
      return;
    }
    await AsyncStorage.setItem(key, value);
  } catch (e) {
    console.log("[storage] set error", e);
  }
}

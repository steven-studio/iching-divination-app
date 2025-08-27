import { Platform } from "react-native";

export function detectLocale(): string {
  try {
    if (Platform.OS === "web") {
      const nav = (globalThis as unknown as { navigator?: Navigator }).navigator;
      const lang = nav?.language ?? (nav as unknown as { userLanguage?: string })?.userLanguage;
      return (lang ?? "zh-TW");
    }
    const jsIntl = (globalThis as unknown as { Intl?: typeof Intl }).Intl;
    const resolved = jsIntl?.DateTimeFormat?.().resolvedOptions?.().locale;
    return (resolved ?? "zh-TW");
  } catch (e) {
    console.log("[locale] detect error", e);
    return "zh-TW";
  }
}

import React from "react";
import { StyleSheet, Text, View } from "react-native";

type Props = { children: React.ReactNode };
type State = { hasError: boolean; message?: string };

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, message: error instanceof Error ? error.message : "Unknown error" };
  }

  componentDidCatch(error: unknown, info: unknown) {
    console.log("[ErrorBoundary] error", error, "info", info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container} testID="error-boundary">
          <Text style={styles.title}>糟糕，發生錯誤</Text>
          <Text style={styles.message}>{this.state.message ?? "請重新整理頁面"}</Text>
        </View>
      );
    }
    return this.props.children as React.ReactElement;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 8 },
  message: { fontSize: 14, color: "#6B7280", textAlign: "center" },
});

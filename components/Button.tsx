import React, { memo } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from "react-native";
import Colors from "@/constants/colors";

type Props = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "outline";
  style?: ViewStyle;
  testID?: string;
};

export const Button = memo(function Button({
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = "primary",
  style,
  testID,
}: Props) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        variant === "primary" ? styles.primary : styles.outline,
        pressed && !isDisabled ? styles.pressed : undefined,
        isDisabled ? styles.disabled : undefined,
        style,
      ]}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? "#fff" : Colors.light.primary} />
      ) : (
        <Text style={variant === "primary" ? styles.textPrimary : styles.textOutline}>{title}</Text>
      )}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  base: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  primary: { backgroundColor: Colors.light.primary },
  outline: { borderWidth: 1, borderColor: Colors.light.primary, backgroundColor: "transparent" },
  pressed: { opacity: 0.9 },
  disabled: { opacity: 0.6 },
  textPrimary: { color: "#fff", fontWeight: "600", fontSize: 16 },
  textOutline: { color: Colors.light.primary, fontWeight: "600", fontSize: 16 },
});

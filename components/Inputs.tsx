import React, { memo } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import Colors from "@/constants/colors";

type DigitInputProps = {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  onBlur?: () => void;
  error?: string;
  testID?: string;
  width?: number;
};

export const DigitInput = memo(function DigitInput({
  label,
  value,
  onChangeText,
  onBlur,
  error,
  testID,
  width,
}: DigitInputProps) {
  const isEmpty = value.length === 0;
  return (
    <View style={[styles.field, width ? { width } : undefined]} testID={testID ? `${testID}-field` : undefined}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, error ? styles.inputError : undefined, isEmpty ? styles.centerText : styles.leftText]}
        value={value}
        onChangeText={onChangeText}
        onBlur={onBlur}
        keyboardType="numeric"
        maxLength={3}
        placeholder="000"
        placeholderTextColor={Colors.light.placeholder}
        selectTextOnFocus
        inputMode="numeric"
        returnKeyType="next"
        testID={testID}
      />
      {!!error && (
        <Text style={styles.error} testID={testID ? `${testID}-error` : undefined}>
          {error}
        </Text>
      )}
    </View>
  );
});

type TextAreaProps = {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  error?: string;
  maxLength?: number;
  testID?: string;
};

export const TextArea = memo(function TextArea({
  label,
  value,
  onChangeText,
  onBlur,
  placeholder,
  error,
  maxLength = 500,
  testID,
}: TextAreaProps) {
  const count = value.length;
  return (
    <View style={styles.field} testID={testID ? `${testID}-field` : undefined}>
      <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.counter} testID={testID ? `${testID}-counter` : undefined}>
          {count}/{maxLength}
        </Text>
      </View>
      <TextInput
        style={[styles.textarea, error ? styles.inputError : undefined]}
        value={value}
        onChangeText={onChangeText}
        onBlur={onBlur}
        placeholder={placeholder}
        placeholderTextColor={Colors.light.placeholder}
        multiline
        maxLength={maxLength}
        textAlignVertical="top"
        testID={testID}
      />
      {!!error && (
        <Text style={styles.error} testID={testID ? `${testID}-error` : undefined}>
          {error}
        </Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  field: { width: "100%" },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  label: { fontSize: 14, color: Colors.light.muted, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 18,
    backgroundColor: "#fff",
  },
  leftText: { textAlign: "left" },
  centerText: { textAlign: "center" },
  textarea: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 16,
    minHeight: 120,
    backgroundColor: "#fff",
  },
  inputError: { borderColor: Colors.light.danger },
  error: { color: Colors.light.danger, marginTop: 6, fontSize: 12 },
  counter: { fontSize: 12, color: Colors.light.muted },
});

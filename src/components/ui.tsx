import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
export const theme = {
  ink: "#111111",
  muted: "#727272",
  paper: "#F7F7F8",
  line: "#E5E5E7",
  lime: "#EDEDEE",
  white: "#FFFFFF",
};
export function Button({
  title,
  onPress,
  secondary = false,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        pressed && { opacity: 0.78, transform: [{ scale: 0.98 }] },
        secondary && s.secondary,
        disabled && { opacity: 0.45 },
      ]}
    >
      <Text style={[s.buttonText, secondary && { color: theme.ink }]}>
        {title}
      </Text>
    </Pressable>
  );
}
export function Chips({
  options,
  values,
  onChange,
}: {
  options: string[];
  values: string[];
  onChange: (v: string) => void;
}) {
  return (
    <View style={s.wrap}>
      {options.map((v) => (
        <Pressable
          key={v}
          accessibilityRole="button"
          accessibilityState={{ selected: values.includes(v) }}
          onPress={() => onChange(v)}
          style={[s.chip, values.includes(v) && s.selected]}
        >
          <Text
            style={[s.chipText, values.includes(v) && { color: theme.white }]}
          >
            {v}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
export function Field({
  label,
  value,
  onChange,
  placeholder,
  number = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  number?: boolean;
}) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        maxLength={120}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#888888"
        keyboardType={number ? "decimal-pad" : "default"}
        style={s.input}
      />
    </View>
  );
}
export function Title({
  eyebrow,
  title,
  body,
}: {
  eyebrow?: string;
  title: string;
  body?: string;
}) {
  return (
    <View style={{ gap: 10, marginBottom: 22 }}>
      {eyebrow && <Text style={s.eyebrow}>{eyebrow.toUpperCase()}</Text>}
      <Text accessibilityRole="header" style={s.title}>
        {title}
      </Text>
      {body && <Text style={s.body}>{body}</Text>}
    </View>
  );
}
export function Note({
  text,
  error = false,
}: {
  text: string;
  error?: boolean;
}) {
  return (
    <View
      accessibilityRole="alert"
      style={[s.note, error && { backgroundColor: "#FBE9E1" }]}
    >
      <Text
        style={[s.body, { fontSize: 13, color: error ? "#913B25" : theme.ink }]}
      >
        {text}
      </Text>
    </View>
  );
}
export function Page({
  children,
  inset = false,
}: {
  children: React.ReactNode;
  inset?: boolean;
}) {
  const safe = useSafeAreaInsets();
  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
      contentContainerStyle={[
        s.page,
        inset && { paddingTop: 24 + safe.top, paddingBottom: 32 + safe.bottom },
      ]}
    >
      {children}
    </ScrollView>
  );
}
export const toggle = (arr: string[], v: string) =>
  arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
export const s = StyleSheet.create({
  page: {
    width: "100%",
    maxWidth: 620,
    alignSelf: "center",
    padding: 24,
    paddingBottom: 32,
    gap: 18,
  },
  button: {
    backgroundColor: theme.ink,
    borderRadius: 16,
    minHeight: 54,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  secondary: {
    backgroundColor: "#F0F0F2",
    borderWidth: 1,
    borderColor: theme.line,
  },
  buttonText: { fontSize: 14, fontWeight: "700", color: "white" },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: 30,
    backgroundColor: theme.white,
  },
  selected: { backgroundColor: theme.ink, borderColor: theme.ink },
  chipText: { fontSize: 13, color: theme.ink, fontWeight: "500" },
  label: { fontSize: 12, fontWeight: "700", color: theme.ink },
  input: {
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    color: theme.ink,
    backgroundColor: theme.white,
  },
  title: {
    fontSize: 34,
    lineHeight: 39,
    letterSpacing: -1.3,
    fontWeight: "700",
    color: theme.ink,
  },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: "700",
    color: theme.muted,
  },
  body: { fontSize: 14, lineHeight: 22, color: theme.muted },
  note: { backgroundColor: "#EFEFF1", padding: 16, borderRadius: 16 },
  card: {
    backgroundColor: theme.white,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.line,
    gap: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  h2: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.4,
    color: theme.ink,
  },
  small: { fontSize: 12, color: theme.muted, lineHeight: 18 },
});

const tintColorLight = "#2f95dc";
const primary = "#22C55E";
const danger = "#EF4444";
const muted = "#6B7280";
const card = "#F6F8FA";
const placeholder = "#D1D5DB";

export type AppTheme = {
  text: string;
  background: string;
  tint: string;
  primary: string;
  danger: string;
  muted: string;
  card: string;
  placeholder: string;
  tabIconDefault: string;
  tabIconSelected: string;
};

const theme: { light: AppTheme } = {
  light: {
    text: "#000",
    background: "#fff",
    tint: tintColorLight,
    primary,
    danger,
    muted,
    card,
    placeholder,
    tabIconDefault: "#ccc",
    tabIconSelected: tintColorLight,
  },
};

export default theme;

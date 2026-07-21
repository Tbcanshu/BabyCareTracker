import { moderateScale } from '../utils/responsive';

// Single mint-green brand family, used everywhere (splash, auth, and in-app
// screens). Per-activity colors below stay distinct so entries are still
// easy to tell apart at a glance.
export const COLORS = {
  // Primary palette - mint green brand
  primary: "#6BAE8A",
  primaryDark: "#4F8F6E",
  primaryLight: "#DCF0E6",

  // Accent
  accent: "#BFE3D2",
  accentDark: "#4F8F6E",

  // Backgrounds
  background: "#FFFFFF",
  surface: "#FFFFFF",
  surfaceAlt: "#F0FAF5",

  // Task specific colors
  milk: "#FAD4B4",
  milkDark: "#F0A060",
  pee: "#FFF3A3",
  peeDark: "#E8C835",
  poop: "#C8A882",
  poopDark: "#8B6340",
  cry: "#B8D4FF",
  cryDark: "#5B8FD9",
  sleep: "#C4B8FF",
  sleepDark: "#7B65E8",
  shower: "#B8F0E0",
  showerDark: "#3DC99A",

  // Text
  textPrimary: "#22342B",
  textSecondary: "#5C7A6C",
  textLight: "#9DB6AA",
  textOnPrimary: "#FFFFFF",

  // Utility
  border: "#E3F2EA",
  shadow: "rgba(60, 120, 90, 0.15)",
  error: "#E85C7A",
  success: "#4CAF7D",
  divider: "#EAF6F0",
  white: "#FFFFFF",
};

// Kept for backwards compatibility with existing call sites (profile setup,
// gender changes, logout) — the app now uses one consistent mint-green
// theme regardless of the baby's gender, so this no longer branches.
export const setGlobalTheme = () => {
  Object.assign(COLORS, {
    primary: "#6BAE8A",
    primaryDark: "#4F8F6E",
    primaryLight: "#DCF0E6",
    accent: "#BFE3D2",
    accentDark: "#4F8F6E",
    background: "#FFFFFF",
    surfaceAlt: "#F0FAF5",
    textPrimary: "#22342B",
    textSecondary: "#5C7A6C",
    border: "#E3F2EA",
  });
};

export const FONTS = {
  regular: "System",
  medium: "System",
  bold: "System",
  sizes: {
    xs: moderateScale(11),
    sm: moderateScale(13),
    md: moderateScale(15),
    lg: moderateScale(18),
    xl: moderateScale(22),
    xxl: moderateScale(28),
    xxxl: moderateScale(36),
  },
};

export const SPACING = {
  xs: moderateScale(4, 0.15),
  sm: moderateScale(8, 0.15),
  md: moderateScale(16, 0.15),
  lg: moderateScale(24, 0.15),
  xl: moderateScale(32, 0.15),
  xxl: moderateScale(48, 0.15),
};

export const RADIUS = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  full: 999,
};

export const SHADOWS = {
  sm: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 6,
  },
  lg: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 10,
  },
};

export const TASK_CONFIG = {
  milk: {
    label: "Milk Feed",
    emoji: "🍼",
    image: { uri: "https://img.icons8.com/fluency/96/baby-bottle.png" },
    color: COLORS.milk,
    darkColor: COLORS.milkDark,
    lightBg: "#FFF6EE",
    fields: ["amount_ml", "feed_type", "duration_min", "notes"],
  },
  pee: {
    label: "Diaper – Pee",
    emoji: "💧",
    image: { uri: "https://img.icons8.com/fluency/96/nappy.png" },
    color: COLORS.pee,
    darkColor: COLORS.peeDark,
    lightBg: "#FFFDE8",
    fields: ["notes"],
  },
  poop: {
    label: "Diaper – Poop",
    emoji: "💩",
    image: { uri: "https://img.icons8.com/fluency/96/poo.png" },
    color: COLORS.poop,
    darkColor: COLORS.poopDark,
    lightBg: "#F9F3EC",
    fields: ["consistency", "notes"],
  },
  cry: {
    label: "Cry Session",
    emoji: "😢",
    image: { uri: "https://img.icons8.com/fluency/96/crying-baby.png" },
    color: COLORS.cry,
    darkColor: COLORS.cryDark,
    lightBg: "#EEF5FF",
    fields: ["duration_min", "reason", "notes"],
  },
  sleep: {
    label: "Sleep",
    emoji: "😴",
    image: { uri: "https://img.icons8.com/fluency/96/sleeping-in-bed.png" },
    color: COLORS.sleep,
    darkColor: COLORS.sleepDark,
    lightBg: "#F3F0FF",
    fields: ["duration_min", "sleep_type", "notes"],
  },
  shower: {
    label: "Shower / Bath",
    emoji: "🛁",
    image: { uri: "https://img.icons8.com/fluency/96/bath.png" },
    color: COLORS.shower,
    darkColor: COLORS.showerDark,
    lightBg: "#EDFDF6",
    fields: ["bath_type", "notes"],
  },
};

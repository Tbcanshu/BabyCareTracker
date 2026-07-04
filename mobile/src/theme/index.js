export const COLORS = {
  // Primary palette - default neutral
  primary: "#D0D0D0",
  primaryDark: "#A0A0A0",
  primaryLight: "#F0F0F0",

  // Accent
  accent: "#BAD7E9",
  accentDark: "#7DB9D9",

  // Backgrounds
  background: "#FFFFFF",
  surface: "#FFFFFF",
  surfaceAlt: "#F8F8F8",

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
  textPrimary: "#3A2140",
  textSecondary: "#7A5F85",
  textLight: "#B8A0C0",
  textOnPrimary: "#FFFFFF",

  // Utility
  border: "#F0E0F0",
  shadow: "rgba(180, 100, 160, 0.15)",
  error: "#E85C7A",
  success: "#4CAF7D",
  divider: "#F5E5F0",
  white: "#FFFFFF",
};

export const setGlobalTheme = (gender) => {
  if (gender === 'Boy') {
    Object.assign(COLORS, {
      primary: "#A0C4E8",
      primaryDark: "#6B9AC7",
      primaryLight: "#D0E5F5",
      background: "#F4F9FF",
      surfaceAlt: "#EBF4FF",
      textPrimary: "#1A2B4C",
      textSecondary: "#4A5F85",
      border: "#E0EAF5",
    });
  } else if (gender === 'Girl') {
    Object.assign(COLORS, {
      primary: "#E8A0BF",
      primaryDark: "#C76B9A",
      primaryLight: "#F5D0E5",
      background: "#FFF8FB",
      surfaceAlt: "#FFF0F6",
      textPrimary: "#3A2140",
      textSecondary: "#7A5F85",
      border: "#F0E0F0",
    });
  } else {
    Object.assign(COLORS, {
      primary: "#D0D0D0",
      primaryDark: "#A0A0A0",
      primaryLight: "#F0F0F0",
      background: "#FFFFFF",
      surfaceAlt: "#F8F8F8",
      textPrimary: "#3A2140",
      textSecondary: "#7A5F85",
      border: "#F0E0F0",
    });
  }
};

export const FONTS = {
  regular: "System",
  medium: "System",
  bold: "System",
  sizes: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 18,
    xl: 22,
    xxl: 28,
    xxxl: 36,
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
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

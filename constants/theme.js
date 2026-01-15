// file: constants/theme.js

export const COLORS = {
  primary: "#115f9f",
  secondary: "#7aa7cc",
  white: "#FFFFFF",
  black: "#333333",
  gray: "#DDDDDD",
  lightGray: "#F5F5F5",
  danger: "#FF4D4F",
};

export const SIZES = {
  base: 8,
  small: 12,
  font: 14,
  medium: 16,
  large: 18,
  extraLarge: 24,
};

export const FONTS = {
  regular: "FontIOSCustom",
  medium: "FontIOSCustom",
  semiBold: "FontIOSCustomBold",
  bold: "FontIOSCustomBold",
  extraBold: "FontIOSCustomBold",
};

export const SHADOWS = {
  small: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  medium: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4, // Better for Android
  },
  card: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 5, // Significant lift for Android
  }
};

const appTheme = { COLORS, SIZES, FONTS, SHADOWS };

export default appTheme;

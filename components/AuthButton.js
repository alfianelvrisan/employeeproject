// file: components/AuthButton.js
import React from "react";
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from "react-native";
import { COLORS, SIZES, FONTS } from "../constants/theme";

const AuthButton = ({ title, onPress, variant = "primary", isLoading = false, disabled = false }) => {
  const buttonStyle = [
    styles.button,
    variant === "primary" ? styles.primaryButton : styles.secondaryButton,
    (isLoading || disabled) && styles.disabledButton,
  ];
  const textStyle = [
    styles.buttonText,
    variant === "primary" ? styles.primaryText : styles.secondaryText,
  ];

  return (
    <TouchableOpacity style={buttonStyle} onPress={onPress} disabled={isLoading || disabled}>
      {isLoading ? (
        <ActivityIndicator color={COLORS.white} />
      ) : (
        <Text style={textStyle}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: SIZES.base,
    marginBottom: SIZES.medium,
    width: "100%",
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  secondaryButton: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  disabledButton: {
    backgroundColor: COLORS.secondary,
  },
  buttonText: {
    fontSize: SIZES.medium,
    fontFamily: FONTS.bold,
  },
  primaryText: {
    color: COLORS.white,
  },
  secondaryText: {
    color: COLORS.primary,
  },
});

export default AuthButton;
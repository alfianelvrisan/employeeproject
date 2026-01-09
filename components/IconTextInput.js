// file: components/IconTextInput.js
import React from "react";
import { View, TextInput, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SIZES } from "../constants/theme";

const IconTextInput = ({
  iconName,
  iconSize = 22,
  placeholder,
  value,
  onChangeText,
  containerStyle,
  inputStyle,
  ...props
}) => {
  return (
    <View style={[styles.inputContainer, containerStyle]}>
      <Ionicons name={iconName} size={iconSize} color={COLORS.primary} style={styles.icon} />
      <TextInput
        style={[styles.input, inputStyle]}
        placeholder={placeholder}
        placeholderTextColor={COLORS.gray}
        value={value}
        onChangeText={onChangeText}
        {...props}
      />
      {/* Jika Anda ingin menambahkan ikon mata, bisa ditambahkan di sini dengan prop tambahan */}
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.lightGray,
    borderRadius: SIZES.base,
    height: 50,
    paddingHorizontal: SIZES.medium,
    marginBottom: SIZES.medium,
    borderWidth: 1,
    borderColor: COLORS.gray,
  },
  icon: {
    marginRight: SIZES.base,
  },
  input: {
    flex: 1,
    fontSize: SIZES.medium,
    color: COLORS.black,
  },
});

export default IconTextInput;

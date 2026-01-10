import React from "react";
import { useAuth } from "../context/AuthContext";
import { View, ActivityIndicator } from "react-native";

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userToken, isAuthReady } = useAuth();

  if (!isAuthReady || !userToken) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#115f9f" />
      </View>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;

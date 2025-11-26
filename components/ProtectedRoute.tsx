import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "expo-router";
import { View, ActivityIndicator } from "react-native";

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userToken } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userToken) {
      router.replace('/screens/LoginScreen'); // Arahkan ke halaman login jika belum login
    } else {
      setLoading(false);
    }
  }, [userToken]);

  if (loading) {
    return (
      <><View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}></View><ActivityIndicator size="large" color="#115f9f" /></>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;

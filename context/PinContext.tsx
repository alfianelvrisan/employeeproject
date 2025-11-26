import React, { createContext, useContext, useState } from "react";
import { useAuth } from "../context/AuthContext";

const PinContext = createContext<{
  isAuthenticated: number | null;
  authenticate: (pin: string) => Promise<number>;
}>(null as any);

export const PinProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<number | null>(null);
  const { userToken } = useAuth();

  const authenticate = async (pin: string): Promise<number> => {
    console.log("authenticate called with PIN:", pin);
    try {
      const response = await fetch("https://api.laskarbuah.com/api/pinRequire", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${userToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ v_password: pin, v_token_key: userToken }),
      });

      if (!response.ok) {
        throw new Error("PIN tidak valid");
      }

      const result = await response.json();
      console.log("API response:", result);
      if (result[0]?.corp_api_cek_pin_member === 1) {
        setIsAuthenticated(1);
        return 1;
      } else {
        return 0;
      }
    } catch (error) {
      console.error("Error validating PIN:", error);
      return 0;
    }
  };

  return (
    <PinContext.Provider value={{ isAuthenticated, authenticate }}>
      {children}
    </PinContext.Provider>
  );
};

export const usePin = () => useContext(PinContext);

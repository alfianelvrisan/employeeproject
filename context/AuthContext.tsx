import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
} from "react";
import * as SecureStore from 'expo-secure-store';
import { router } from "expo-router";
import * as Network from "expo-network";
import * as Location from "expo-location";

type AuthContextType = {
  userToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  cekode: (kode: string) => Promise<number>;
  cekwhastapp: (whatsapp:string)=>Promise<number>;
  register: (whatsapp: string, pin: string,kode:string,option:string) => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);




export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [userToken, setUserToken] = useState<string | null>(null);
  const [ipt, setIp] = useState("");

  useEffect(() => {
    const loadToken = async () => {
      try {
        const token = await SecureStore.getItemAsync("authToken");
        if (token) {
          setUserToken(token);
          router.replace("/"); // langsung arahkan ke home bila token masih ada
        } else {
          router.replace("/screens/LoginScreen");
        }
      } catch (e) {
        router.replace("/screens/LoginScreen");
      }
    };
    loadToken();
  }, []);

  const getIpAddress = async () => {
    try {
      const ipAddress = await Network.getIpAddressAsync();
      setIp(ipAddress);
      return ipAddress;
    } catch (error) {
      return null;
    }
  };

  useEffect(() => {
    const fetchIp = async () => {
      const ip = await getIpAddress();
    };
  
    fetchIp();
  }, []);

  const fetchWithAuth = async (url: string, options: any = {}) => {
    const token = await SecureStore.getItemAsync("authToken");
  
    if (!token) {
      throw new Error("Token tidak ditemukan. Silakan login kembali.");
    }
  
    const headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    };
  
    const response = await fetch(url, { ...options, headers });
  
    if (response.status === 401) {
      await SecureStore.deleteItemAsync("authToken");
      setUserToken(null);
      router.replace("/screens/LoginScreen")
      throw new Error("Sesi telah berakhir. Silakan login kembali.");
    }
  
    return response;
  };

  async function LoginApp(email: string, password: string) {
    try {

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        throw new Error("Izin lokasi tidak diberikan.");
      }

    const location = await Location.getCurrentPositionAsync({});
    const { latitude, longitude } = location.coords;

      const response = await fetch("https://api.laskarbuah.com/api/LoginValidations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          v_tlp: email,   
          v_ip: ipt,
          v_latitude: latitude.toString(),
          v_longitude:longitude.toString(),
          v_pin: password,
        })
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Login gagal dari server.");
      }
  
      const result = await response.json();
      return result.token;
    } catch (error) {
      throw new Error("Login gagal. " + (error as Error).message);
    }
  }


  const login = async (email: string, password: string) => {
    try {
      const token = await LoginApp(email, password);
      await SecureStore.setItemAsync("authToken", token);
      setUserToken(token);
      router.replace("/");
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync("authToken");
    setUserToken(null);
    router.replace("/screens/LoginScreen");
  };

  const cekode = async (kode: string) => {
    try {
      const response = await fetch("https://api.laskarbuah.com/api/cekkode", {
        method: "POST",
        headers: {
         "Content-Type": "application/json"
        },
        body: JSON.stringify({ v_token:kode }),
      });

      if (!response.ok) {
        throw new Error("Cekode request failed.");
      }

      const result = await response.json();
      console.log("Cekode result:", result);
      return result[0].corp_sp_cek_trx_add_new_member_new;
    } catch (error) {
      throw new Error("Cekode error: " + (error as Error).message);
    }
  };

  const cekwhastapp = async (whatsapp: string) => {
    try{
      const response = await fetch("https://api.laskarbuah.com/api/cekWhatsapp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ v_whatsapp: "0"+whatsapp }),
      });
      if (!response.ok) {
        throw new Error("Cekwhatsapp request failed.");
      }
      const result = await response.json();
      console.log("Cekwhatsapp result:", result);
      return result[0].corp_api_cek_no_member;
    }catch (error) {
      throw new Error("Cekwhatsapp error: " + (error as Error).message);
    }
  };

  async function handleRegister(whatsapp: string, pin: string,kode:string,option:string) {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        throw new Error("Izin lokasi tidak diberikan.");
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
  
      console.log(option)
      const response = await fetch("https://api.laskarbuah.com/api/RegistrasiMem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          v_tlp: "0"+whatsapp,
          v_pin: pin,
          v_ip : ipt,
          v_lat:latitude.toString(),
          v_long:longitude.toString(),
          v_kode:kode,
          v_option:option
        })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Registrasi gagal dari server.");
      }
      const result = await response.json();
      return result.token;
    } catch (error) {
      throw new Error("Registrasi gagal. " + (error as Error).message);
    }
  }

  const register = async (whatsapp: string, pin: string,kode:string,option:string) => {
    console.log("Registering with:", { whatsapp, pin, kode,option });
    try {
      const result = await handleRegister(whatsapp, pin,kode,option);
      await SecureStore.setItemAsync("authToken", result);
      setUserToken(result);
      router.replace("/");
    } catch (error) {
      console.error("Registrasi gagal:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ userToken, login, logout, cekode,cekwhastapp,register }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth harus dipakai dalam <AuthProvider>");
  return context;
};

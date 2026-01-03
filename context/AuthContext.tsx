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
  fetchProfile: () => Promise<any | null>;
};

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);




export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [userToken, setUserToken] = useState<string | null>(null);
  const [ipt, setIp] = useState("");

  const getStoredAccessToken = async () => {
    return await SecureStore.getItemAsync("authToken");
  };

  const getStoredRefreshToken = async () => {
    return await SecureStore.getItemAsync("refreshToken");
  };

  const saveTokens = async (accessToken: string, refreshToken?: string) => {
    console.log("[auth] saveTokens: accessToken?", Boolean(accessToken), "refreshToken?", Boolean(refreshToken));
    await SecureStore.setItemAsync("authToken", accessToken);
    if (refreshToken) {
      await SecureStore.setItemAsync("refreshToken", refreshToken);
    }
  };

  const clearTokens = async () => {
    await SecureStore.deleteItemAsync("authToken");
    await SecureStore.deleteItemAsync("refreshToken");
  };

  const refreshAccessToken = async () => {
    console.log("[auth] refreshAccessToken: start");
    const refreshToken = await getStoredRefreshToken();
    if (!refreshToken) {
      console.log("[auth] refreshAccessToken: missing refresh token");
      throw new Error("Refresh token tidak ditemukan.");
    }

    const response = await fetch(
      "https://api.laskarbuah.com/api/LoginValidations/refresh",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.log("[auth] refreshAccessToken: failed", errorData);
      throw new Error(errorData.message || "Refresh token gagal.");
    }

    const result = await response.json();
    const accessToken = result.access_token || result.token;
    const newRefreshToken = result.refresh_token || refreshToken;
    if (!accessToken) {
      console.log("[auth] refreshAccessToken: no access token in response", result);
      throw new Error("Access token tidak ditemukan dari refresh.");
    }
    console.log("[auth] refreshAccessToken: success");
    await saveTokens(accessToken, newRefreshToken);
    setUserToken(accessToken);
    return accessToken;
  };

  useEffect(() => {
    const loadToken = async () => {
      try {
        const token = await getStoredAccessToken();
        console.log("[auth] loadToken: accessToken exists?", Boolean(token));
        if (token) {
          setUserToken(token);
          router.replace("/"); // langsung arahkan ke home bila token masih ada
        } else {
          const refreshToken = await getStoredRefreshToken();
          console.log("[auth] loadToken: refreshToken exists?", Boolean(refreshToken));
          if (refreshToken) {
            try {
              await refreshAccessToken();
              router.replace("/");
              return;
            } catch {
              console.log("[auth] loadToken: refresh failed, clearing tokens");
              await clearTokens();
            }
          }
          router.replace("/screens/LoginScreen");
        }
      } catch (e) {
        console.log("[auth] loadToken: error", e);
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
    const token = await getStoredAccessToken();
  
    if (!token) {
      throw new Error("Token tidak ditemukan. Silakan login kembali.");
    }
  
    const headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    };
  
    const response = await fetch(url, { ...options, headers });
  
    if (response.status === 401) {
      try {
        const newToken = await refreshAccessToken();
        const retryHeaders = {
          ...options.headers,
          Authorization: `Bearer ${newToken}`,
        };
        return fetch(url, { ...options, headers: retryHeaders });
      } catch {
        await clearTokens();
        setUserToken(null);
        router.replace("/screens/LoginScreen");
        throw new Error("Sesi telah berakhir. Silakan login kembali.");
      }
    }
  
    return response;
  };

  const normalizeProfile = (data: any) => {
    const row =
      Array.isArray(data?.Table) && data.Table.length > 0 ? data.Table[0] : data;
    const totalPoin = Number(
      String(row?.total_poin ?? row?.poin ?? "0").replace(",", ".")
    );
    const totalSavings = Number(
      String(row?.total_savings ?? row?.saving ?? "0").replace(",", ".")
    );
    return {
      ...row,
      poin: Number.isFinite(totalPoin) ? totalPoin : 0,
      saving: Number.isFinite(totalSavings) ? totalSavings : 0,
      ranking: row?.ranking ?? row?.rankd,
      target: row?.target,
      pencapaian: row?.pencapaian,
      greeting: row?.greeting,
    };
  };

  const fetchProfile = async () => {
    const response = await fetchWithAuth(
      "https://api.laskarbuah.com/api/Profil",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      }
    );

    if (!response.ok) {
      throw new Error("Profile request failed.");
    }

    const json = await response.json();
    if (json?.success && json?.data) {
      return normalizeProfile(json.data);
    }
    return null;
  };

  async function LoginApp(email: string, password: string) {
    try {
      console.log("[auth] LoginApp: start", { email });

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
        console.log("[auth] LoginApp: response not ok", errorData);
        throw new Error(errorData.message || "Login gagal dari server.");
      }
  
      const result = await response.json();
      console.log("[auth] LoginApp: response ok", { hasAccessToken: Boolean(result.access_token || result.token), hasRefreshToken: Boolean(result.refresh_token) });
      return {
        accessToken: result.access_token || result.token,
        refreshToken: result.refresh_token,
      };
    } catch (error) {
      console.log("[auth] LoginApp: error", error);
      throw new Error("Login gagal. " + (error as Error).message);
    }
  }


  const login = async (email: string, password: string) => {
    try {
      console.log("[auth] login: start");
      const { accessToken, refreshToken } = await LoginApp(email, password);
      if (!accessToken) {
        console.log("[auth] login: missing access token");
        throw new Error("Token login tidak ditemukan.");
      }
      await saveTokens(accessToken, refreshToken);
      setUserToken(accessToken);
      console.log("[auth] login: success, navigating home");
      router.replace("/");
    } catch (error) {
      console.log("[auth] login: error", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      const refreshToken = await getStoredRefreshToken();
      if (refreshToken) {
        await fetch("https://api.laskarbuah.com/api/LoginValidations/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
      }
    } catch (error) {
      console.log("[auth] logout: server call failed", error);
    } finally {
      await clearTokens();
      setUserToken(null);
      router.replace("/screens/LoginScreen");
    }
  };

  const cekode = async (kode: string) => {
    try {
      const response = await fetch(
        "https://api.laskarbuah.com/api/RegistrasiMem/cek-kode",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ v_token: kode }),
        }
      );

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

  async function handleRegister(
    whatsapp: string,
    pin: string,
    kode: string,
    option: string
  ) {
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
          v_tlp: "0" + whatsapp,
          v_pin: Number(pin),
          v_ip : ipt,
          v_lat: latitude.toString(),
          v_long: longitude.toString(),
          v_kode: Number(kode),
          v_option: Number(option),
        })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Registrasi gagal dari server.");
      }
      const result = await response.json();
      return result;
    } catch (error) {
      throw new Error("Registrasi gagal. " + (error as Error).message);
    }
  }

  const register = async (whatsapp: string, pin: string,kode:string,option:string) => {
    console.log("Registering with:", { whatsapp, pin, kode,option });
    try {
      const result = await handleRegister(whatsapp, pin, kode, option);
      if (result?.success) {
        router.replace("/screens/LoginScreen");
        return;
      }
      throw new Error("Registrasi gagal dari server.");
    } catch (error) {
      console.error("Registrasi gagal:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{ userToken, login, logout, cekode, cekwhastapp, register, fetchProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth harus dipakai dalam <AuthProvider>");
  return context;
};

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

const API_BASE_URL = process.env.EXPO_PUBLIC_BASE_URL ?? "";
const buildApiUrl = (path: string) => {
  if (!API_BASE_URL) {
    throw new Error("EXPO_PUBLIC_BASE_URL belum diset.");
  }
  return `${API_BASE_URL.replace(/\/+$/, "")}${path}`;
};
const getErrorMessage = (data: any, fallback: string) =>
  data?.message || data?.error || data?.msg || fallback;

type AuthContextType = {
  userToken: string | null;
  isAuthReady: boolean;
  login: (nik: string, password: string) => Promise<void>;
  refreshSession: () => Promise<void>;
  logout: () => void;
  register: (whatsapp: string, pin: string,kode:string,option:string) => Promise<void>;
  fetchProfile: () => Promise<any | null>;
  changePassword: (nik: string, currentPassword: string, newPassword: string) => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);




export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [userToken, setUserToken] = useState<string | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
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
      buildApiUrl("/auth/refresh"),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          refresh_token: refreshToken,
          refreshToken,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.log("[auth] refreshAccessToken: failed", errorData);
      throw new Error(getErrorMessage(errorData, "Refresh token gagal."));
    }

    const result = await response.json().catch(() => ({}));
    const payload = result?.data ?? result;
    const accessToken =
      payload?.access_token || payload?.token || payload?.accessToken;
    const newRefreshToken =
      payload?.refresh_token || payload?.refreshToken || refreshToken;
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
    let isActive = true;
    const loadToken = async () => {
      try {
        const token = await getStoredAccessToken();
        console.log("[auth] loadToken: accessToken exists?", Boolean(token));
        if (token) {
          if (isActive) setUserToken(token);
          return;
        }

        const refreshToken = await getStoredRefreshToken();
        console.log("[auth] loadToken: refreshToken exists?", Boolean(refreshToken));
        if (refreshToken) {
          try {
            await refreshAccessToken();
            return;
          } catch {
            console.log("[auth] loadToken: refresh failed, clearing tokens");
            await clearTokens();
          }
        }
      } catch (e) {
        console.log("[auth] loadToken: error", e);
      } finally {
        if (isActive) setIsAuthReady(true);
      }
    };
    loadToken();
    return () => {
      isActive = false;
    };
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
    const response = await fetchWithAuth(buildApiUrl("/profile"), {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error("Profile request failed.");
    }

    const json = await response.json().catch(() => ({}));
    const payload = json?.data ?? json;
    if (!payload) return null;
    return normalizeProfile(payload);
  };

  async function loginWithCredentials(nik: string, password: string) {
    try {
      console.log("[auth] loginWithCredentials: start", { nik });
      const response = await fetch(buildApiUrl("/auth/loginone"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username: nik,
          nik,
          password,
        })
      });
  
      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        let errorData: any = {};
        try {
          errorData = errorText ? JSON.parse(errorText) : {};
        } catch {
          errorData = { raw: errorText };
        }
        console.log("[auth] loginWithCredentials: response not ok", {
          status: response.status,
          statusText: response.statusText,
          errorData,
        });
        throw new Error(getErrorMessage(errorData, "Login gagal dari server."));
      }
  
      const result = await response.json().catch(() => ({}));
      const payload = result?.data ?? result;
      console.log("[auth] loginWithCredentials: response ok", {
        hasAccessToken: Boolean(payload?.access_token || payload?.token || payload?.accessToken),
        hasRefreshToken: Boolean(payload?.refresh_token || payload?.refreshToken),
      });
      return {
        accessToken:
          payload?.access_token || payload?.token || payload?.accessToken,
        refreshToken: payload?.refresh_token || payload?.refreshToken,
      };
    } catch (error) {
      console.log("[auth] loginWithCredentials: error", error);
      throw new Error("Login gagal. " + (error as Error).message);
    }
  }


  const login = async (nik: string, password: string) => {
    try {
      console.log("[auth] login: start");
      const { accessToken, refreshToken } = await loginWithCredentials(
        nik,
        password
      );
      if (!accessToken) {
        console.log("[auth] login: missing access token");
        throw new Error("Token login tidak ditemukan.");
      }
      await saveTokens(accessToken, refreshToken);
      setUserToken(accessToken);
      console.log("[auth] login: success");
    } catch (error) {
      console.log("[auth] login: error", error);
      throw error;
    }
  };

  const refreshSession = async () => {
    try {
      console.log("[auth] refreshSession: start");
      const accessToken = await refreshAccessToken();
      if (!accessToken) {
        throw new Error("Token baru tidak ditemukan.");
      }
    } catch (error) {
      console.log("[auth] refreshSession: error", error);
      throw error;
    }
  };

  const changePassword = async (
    nik: string,
    currentPassword: string,
    newPassword: string
  ) => {
    const response = await fetch(buildApiUrl("/auth/hash"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nik,
        password: currentPassword,
        old_password: currentPassword,
        new_password: newPassword,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(getErrorMessage(errorData, "Gagal mengubah password."));
    }

    const result = await response.json().catch(() => ({}));
    if (result?.success === false) {
      throw new Error(getErrorMessage(result, "Gagal mengubah password."));
    }
  };

  const logout = async () => {
    try {
      const refreshToken = await getStoredRefreshToken();
      if (refreshToken) {
        await fetch(buildApiUrl("/auth/logout"), {
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
        router.replace("/(auth)/login");
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
      value={{
        userToken,
        isAuthReady,
        login,
        refreshSession,
        logout,
        register,
        fetchProfile,
        changePassword,
      }}
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

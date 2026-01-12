import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
  useRef,
} from "react";
import * as SecureStore from 'expo-secure-store';
import { router } from "expo-router";
import * as Network from "expo-network";
import * as Location from "expo-location";

const API_BASE_URL = (process.env.EXPO_PUBLIC_BASE_URL ?? "").trim();
const buildApiUrl = (path: string) => {
  if (!API_BASE_URL) {
    throw new Error("EXPO_PUBLIC_BASE_URL belum diset.");
  }
  return `${API_BASE_URL.replace(/\/+$/, "")}${path}`;
};
const getErrorMessage = (data: any, fallback: string) =>
  data?.message || data?.error || data?.msg || fallback;
const normalizeTokenValue = (token: string) => {
  let trimmed = token.trim();
  const wrapped =
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"));
  if (wrapped) {
    trimmed = trimmed.slice(1, -1).trim();
  }
  return trimmed;
};
const stripBearerPrefix = (token: string) =>
  token.replace(/^bearer\s+/i, "").trim();
const buildAuthHeaderValue = (token: string) => {
  const normalized = stripBearerPrefix(normalizeTokenValue(token));
  return `Bearer ${normalized}`;
};
const readResponseBody = async (response: Response) => {
  const text = await response.text().catch(() => "");
  if (!text) return { text: "", json: null };
  try {
    return { text, json: JSON.parse(text) };
  } catch {
    return { text, json: null };
  }
};
const previewToken = (value: string) => {
  const clean = stripBearerPrefix(normalizeTokenValue(value));
  if (clean.length <= 10) return clean;
  return `${clean.slice(0, 6)}...${clean.slice(-4)}`;
};
const logTokenValue = (label: string, token?: string) => {
  if (!token) {
    console.log("[auth] token", { label, value: "-", length: 0 });
    return;
  }
  const normalized = normalizeTokenValue(token);
  console.log("[auth] token", {
    label,
    value: normalized,
    length: normalized.length,
    full: true,
  });
};
const PROFILE_CACHE_TTL_MS = 2 * 60 * 1000;
const NAVIGATION_CACHE_TTL_MS = 5 * 60 * 1000;
const isAuthErrorPayload = (value: any) => {
  if (!value || typeof value !== "object") return false;
  if (value.success === false || value.status === false) return true;
  const message = String(value.message ?? value.error ?? value.msg ?? "")
    .toLowerCase()
    .trim();
  if (!message) return false;
  return (
    message.includes("unauthor") ||
    message.includes("expired") ||
    message.includes("token") ||
    message.includes("login")
  );
};

type AuthContextType = {
  userToken: string | null;
  isAuthReady: boolean;
  login: (nik: string, password: string) => Promise<void>;
  refreshSession: () => Promise<void>;
  logout: () => void;
  register: (whatsapp: string, pin: string,kode:string,option:string) => Promise<void>;
  fetchProfile: (options?: { force?: boolean }) => Promise<any | null>;
  fetchAbsensiJadwal: () => Promise<any | null>;
  fetchPayrollSlip: (options?: {
    period?: string;
    varWhere?: string;
    pageNumber?: number;
    rowPage?: number;
  }) => Promise<any[] | null>;
  fetchQuran: () => Promise<{ surah?: any[]; ayat?: any[] } | null>;
  startQuranSession: (options?: { sesion?: number }) => Promise<any | null>;
  saveQuranAttendance: (payload: {
    surahayat: string;
    filename: string;
    strat_time: string;
  }[]) => Promise<any | null>;
  clearQuranAttendance: () => Promise<any | null>;
  fetchNavigation: (options?: {
    force?: boolean;
    aplikasiId?: number;
  }) => Promise<any[] | null>;
  changePassword: (nik: string, currentPassword: string, newPassword: string) => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);




export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [userToken, setUserToken] = useState<string | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [ipt, setIp] = useState("");
  const refreshPromiseRef = useRef<Promise<string> | null>(null);
  const profileCacheRef = useRef<{ data: any; ts: number } | null>(null);
  const navigationCacheRef = useRef<{
    key: string;
    data: any[];
    ts: number;
  } | null>(null);

  const getStoredAccessToken = async () => {
    return await SecureStore.getItemAsync("authToken");
  };

  const getStoredRefreshToken = async () => {
    return await SecureStore.getItemAsync("refreshToken");
  };

  const saveTokens = async (accessToken: string, refreshToken?: string) => {
    console.log(
      "[auth] saveTokens: accessToken?",
      Boolean(accessToken),
      "refreshToken?",
      Boolean(refreshToken),
      "accessLen",
      accessToken?.length ?? 0,
      "refreshLen",
      refreshToken?.length ?? 0
    );
    await SecureStore.setItemAsync("authToken", accessToken);
    if (refreshToken) {
      await SecureStore.setItemAsync("refreshToken", refreshToken);
    }
  };

  const clearProfileCache = () => {
    profileCacheRef.current = null;
  };

  const clearNavigationCache = () => {
    navigationCacheRef.current = null;
  };

  const clearTokens = async () => {
    await SecureStore.deleteItemAsync("authToken");
    await SecureStore.deleteItemAsync("refreshToken");
  };

  const refreshAccessToken = async () => {
    console.log("[auth] refreshAccessToken: start");
    const storedRefreshToken = await getStoredRefreshToken();
    const refreshToken = storedRefreshToken
      ? stripBearerPrefix(normalizeTokenValue(storedRefreshToken))
      : null;
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
    console.log("[auth] refreshAccessToken: payload keys", Object.keys(payload ?? {}));
    const accessToken =
      payload?.access_token || payload?.token || payload?.accessToken;
    const newRefreshToken =
      payload?.refresh_token || payload?.refreshToken || refreshToken;
    if (!accessToken) {
      console.log("[auth] refreshAccessToken: no access token in response", result);
      throw new Error("Access token tidak ditemukan dari refresh.");
    }
    console.log("[auth] refreshAccessToken: success", {
      accessTokenPreview: accessToken ? previewToken(accessToken) : "-",
      refreshTokenPreview: newRefreshToken ? previewToken(newRefreshToken) : "-",
    });
    logTokenValue("access(refresh)", accessToken);
    logTokenValue("refresh(refresh)", newRefreshToken);
    await saveTokens(accessToken, newRefreshToken);
    setUserToken(accessToken);
    return accessToken;
  };

  const refreshAccessTokenOnce = async () => {
    if (!refreshPromiseRef.current) {
      refreshPromiseRef.current = refreshAccessToken().finally(() => {
        refreshPromiseRef.current = null;
      });
    }
    return refreshPromiseRef.current;
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
            await refreshAccessTokenOnce();
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
    const storedToken = await getStoredAccessToken();
    const stateToken = userToken;
    const token = storedToken || stateToken;
  
    if (!token) {
      throw new Error("Token tidak ditemukan. Silakan login kembali.");
    }
  
    const method = options?.method ?? "GET";
    const shouldLogProfile = url.toLowerCase().includes("/profile");
    if (shouldLogProfile) {
      console.log("[auth] profile request start", {
        url,
        method,
        tokenPreview: previewToken(token),
        tokenLength: normalizeTokenValue(token).length,
        storedTokenPreview: storedToken ? previewToken(storedToken) : "-",
        storedTokenLength: storedToken ? normalizeTokenValue(storedToken).length : 0,
        stateTokenPreview: stateToken ? previewToken(stateToken) : "-",
        stateTokenLength: stateToken ? normalizeTokenValue(stateToken).length : 0,
      });
    }
    const authToken = buildAuthHeaderValue(token);
    const headers = {
      Accept: "application/json",
      ...options.headers,
      Authorization: authToken,
    };
  
    const response = await fetch(url, { ...options, headers });
    if (shouldLogProfile) {
      console.log("[auth] profile request response", {
        url,
        method,
        status: response.status,
      });
    }
  
    if (response.status === 401 || response.status === 403 || response.status === 419) {
      try {
        const newToken = await refreshAccessTokenOnce();
        const retryHeaders = {
          ...options.headers,
          Authorization: buildAuthHeaderValue(newToken),
        };
        const retryResponse = await fetch(url, { ...options, headers: retryHeaders });
        if (shouldLogProfile) {
          console.log("[auth] profile request retry", {
            url,
            method,
            status: retryResponse.status,
          });
        }
        return retryResponse;
      } catch {
        await clearTokens();
        setUserToken(null);
        throw new Error("Sesi telah berakhir. Silakan login kembali.");
      }
    }
  
    return response;
  };

  const unwrapProfilePayload = (value: any): any => {
    if (!value) return value;
    if (Array.isArray(value)) return value.length > 0 ? value[0] : value;
    if (Array.isArray(value.Table))
      return value.Table.length > 0 ? value.Table[0] : value;
    if (value.data && typeof value.data === "object" && value.data !== value) {
      return unwrapProfilePayload(value.data);
    }
    if (
      value.result &&
      typeof value.result === "object" &&
      value.result !== value
    ) {
      return unwrapProfilePayload(value.result);
    }
    return value;
  };

  const normalizeProfile = (data: any) => {
    const row = unwrapProfilePayload(data);
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

  const fetchProfile = async (options?: { force?: boolean }) => {
    const force = options?.force ?? false;
    const cached = profileCacheRef.current;
    if (!force && cached && Date.now() - cached.ts < PROFILE_CACHE_TTL_MS) {
      return cached.data;
    }
    const response = await fetchWithAuth(buildApiUrl("/profile"), {
      method: "GET",
    });

    if (!response.ok) {
      const errorPayload = await readResponseBody(response);
      console.log("[auth] profile request failed", {
        path: "/profile",
        method: "GET",
        status: response.status,
        body: errorPayload.text?.slice(0, 200),
      });
      throw new Error(
        getErrorMessage(
          errorPayload.json,
          `Profile request failed (${response.status}).`
        )
      );
    }

    const json = await response.json().catch(() => ({}));
    if (isAuthErrorPayload(json)) {
      throw new Error("Sesi telah berakhir. Silakan login kembali.");
    }
    const payload = json?.data ?? json;
    if (!payload) return null;
    const normalized = normalizeProfile(payload);
    profileCacheRef.current = { data: normalized, ts: Date.now() };
    return normalized;
  };

  const fetchAbsensiJadwal = async () => {
    const response = await fetchWithAuth(buildApiUrl("/absensi/jadwal"), {
      method: "GET",
    });

    if (!response.ok) {
      const errorPayload = await readResponseBody(response);
      console.log("[auth] absensi jadwal request failed", {
        path: "/absensi/jadwal",
        method: "GET",
        status: response.status,
        body: errorPayload.text?.slice(0, 200),
      });
      throw new Error(
        getErrorMessage(
          errorPayload.json,
          `Absensi request failed (${response.status}).`
        )
      );
    }

    const json = await response.json().catch(() => ({}));
    const payload = json?.data ?? json;
    return payload ?? null;
  };

  const fetchPayrollSlip = async (options?: {
    period?: string;
    varWhere?: string;
    pageNumber?: number;
    rowPage?: number;
  }) => {
    const now = new Date();
    const defaultPeriod = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}`;
    const period = options?.period ?? defaultPeriod;
    const varWhere = options?.varWhere ?? "";
    const pageNumber = options?.pageNumber ?? 1;
    const rowPage = options?.rowPage ?? 20;
    const query = `periode=${encodeURIComponent(
      period
    )}&var_where=${encodeURIComponent(varWhere)}&page_number=${encodeURIComponent(
      String(pageNumber)
    )}&row_page=${encodeURIComponent(String(rowPage))}`;

    const response = await fetchWithAuth(
      buildApiUrl(`/profile/slip-gaji?${query}`),
      { method: "GET" }
    );

    if (!response.ok) {
      const errorPayload = await readResponseBody(response);
      console.log("[auth] slip gaji request failed", {
        path: "/profile/slip-gaji",
        method: "GET",
        status: response.status,
        body: errorPayload.text?.slice(0, 200),
      });
      throw new Error(
        getErrorMessage(
          errorPayload.json,
          `Slip gaji request failed (${response.status}).`
        )
      );
    }

    const json = await response.json().catch(() => ({}));
    if (isAuthErrorPayload(json)) {
      throw new Error("Sesi telah berakhir. Silakan login kembali.");
    }
    const payload = json?.data ?? json;
    const list = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.data)
        ? payload.data
        : [];
    return list;
  };

  const fetchQuran = async () => {
    const response = await fetchWithAuth(buildApiUrl("/quran"), {
      method: "GET",
    });

    if (!response.ok) {
      const errorPayload = await readResponseBody(response);
      console.log("[auth] quran request failed", {
        path: "/quran",
        method: "GET",
        status: response.status,
        body: errorPayload.text?.slice(0, 200),
      });
      throw new Error(
        getErrorMessage(
          errorPayload.json,
          `Quran request failed (${response.status}).`
        )
      );
    }

    const json = await response.json().catch(() => ({}));
    if (isAuthErrorPayload(json)) {
      throw new Error("Sesi telah berakhir. Silakan login kembali.");
    }
    const payload = json?.data ?? json;
    if (!payload || typeof payload !== "object") return null;
    return payload;
  };

  const startQuranSession = async (options?: { sesion?: number }) => {
    const sesion = options?.sesion ?? 1;
    const response = await fetchWithAuth(buildApiUrl("/quran/subuh/sesion"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sesion }),
    });

    if (!response.ok) {
      const errorPayload = await readResponseBody(response);
      console.log("[auth] quran session request failed", {
        path: "/quran/subuh/sesion",
        method: "POST",
        status: response.status,
        body: errorPayload.text?.slice(0, 200),
      });
      throw new Error(
        getErrorMessage(
          errorPayload.json,
          `Session request failed (${response.status}).`
        )
      );
    }

    const json = await response.json().catch(() => ({}));
    if (isAuthErrorPayload(json)) {
      throw new Error("Sesi telah berakhir. Silakan login kembali.");
    }
    return json ?? null;
  };

  const saveQuranAttendance = async (
    payload: { surahayat: string; filename: string; strat_time: string }[]
  ) => {
    if (!Array.isArray(payload) || payload.length === 0) {
      throw new Error("Payload absensi tidak boleh kosong.");
    }
    const response = await fetchWithAuth(buildApiUrl("/quran/subuh/save"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorPayload = await readResponseBody(response);
      console.log("[auth] quran save request failed", {
        path: "/quran/subuh/save",
        method: "POST",
        status: response.status,
        body: errorPayload.text?.slice(0, 200),
      });
      throw new Error(
        getErrorMessage(
          errorPayload.json,
          `Save request failed (${response.status}).`
        )
      );
    }

    const json = await response.json().catch(() => ({}));
    if (isAuthErrorPayload(json)) {
      throw new Error("Sesi telah berakhir. Silakan login kembali.");
    }
    return json ?? null;
  };

  const clearQuranAttendance = async () => {
    const response = await fetchWithAuth(buildApiUrl("/quran/subuh/clear"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      const errorPayload = await readResponseBody(response);
      console.log("[auth] quran clear request failed", {
        path: "/quran/subuh/clear",
        method: "POST",
        status: response.status,
        body: errorPayload.text?.slice(0, 200),
      });
      throw new Error(
        getErrorMessage(
          errorPayload.json,
          `Clear request failed (${response.status}).`
        )
      );
    }

    const json = await response.json().catch(() => ({}));
    if (isAuthErrorPayload(json)) {
      throw new Error("Sesi telah berakhir. Silakan login kembali.");
    }
    return json ?? null;
  };

  const fetchNavigation = async (options?: {
    force?: boolean;
    aplikasiId?: number;
  }) => {
    const aplikasiId = options?.aplikasiId ?? 5;
    const cacheKey = String(aplikasiId);
    const cached = navigationCacheRef.current;
    if (
      !options?.force &&
      cached &&
      cached.key === cacheKey &&
      Date.now() - cached.ts < NAVIGATION_CACHE_TTL_MS
    ) {
      return cached.data;
    }

    const response = await fetchWithAuth(
      buildApiUrl(`/navigation?aplikasi_id=${encodeURIComponent(cacheKey)}`),
      { method: "GET" }
    );

    if (!response.ok) {
      const errorPayload = await readResponseBody(response);
      console.log("[auth] navigation request failed", {
        path: "/navigation",
        method: "GET",
        status: response.status,
        body: errorPayload.text?.slice(0, 200),
      });
      throw new Error(
        getErrorMessage(
          errorPayload.json,
          `Navigation request failed (${response.status}).`
        )
      );
    }

    const json = await response.json().catch(() => ({}));
    const payload = json?.data ?? json;
    const list = Array.isArray(payload) ? payload : [];
    navigationCacheRef.current = { key: cacheKey, data: list, ts: Date.now() };
    return list;
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
          password,
          ip: ipt || "127.0.0.1",
          aplikasi_id: 5,
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
      console.log("[auth] loginWithCredentials: payload keys", Object.keys(payload ?? {}));
      const previewAccess =
        payload?.access_token || payload?.token || payload?.accessToken;
      const previewRefresh =
        payload?.refresh_token || payload?.refreshToken;
      console.log("[auth] loginWithCredentials: token preview", {
        accessTokenPreview: previewAccess ? previewToken(previewAccess) : "-",
        refreshTokenPreview: previewRefresh ? previewToken(previewRefresh) : "-",
      });
      logTokenValue("access(login)", previewAccess);
      logTokenValue("refresh(login)", previewRefresh);
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
      clearProfileCache();
      clearNavigationCache();
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
      clearProfileCache();
      clearNavigationCache();
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
        fetchAbsensiJadwal,
        fetchPayrollSlip,
        fetchQuran,
        startQuranSession,
        saveQuranAttendance,
        clearQuranAttendance,
        fetchNavigation,
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

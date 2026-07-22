import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { authApi, type UserResponse, type LoginPayload, type RegisterPayload, ApiError } from "../lib/api";
import { tokenStore } from "../lib/tokenStore";

interface AuthContextValue {
  user: UserResponse | null;
  loading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthCtx = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const loadMe = useCallback(async () => {
    const token = await tokenStore.getAccessToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await authApi.me();
      setUser(me);
    } catch {
      await tokenStore.clear();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  const login = useCallback(async (payload: LoginPayload) => {
    const tokens = await authApi.login(payload);
    await tokenStore.setTokens(tokens.access_token, tokens.refresh_token);
    const me = await authApi.me();
    setUser(me);
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const tokens = await authApi.register(payload);
    await tokenStore.setTokens(tokens.access_token, tokens.refresh_token);
    const me = await authApi.me();
    setUser(me);
  }, []);

  const logout = useCallback(async () => {
    await tokenStore.clear();
    setUser(null);
  }, []);

  return (
    <AuthCtx.Provider value={{ user, loading, login, register, logout }}>{children}</AuthCtx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export { ApiError };

"use client";

import React, { createContext, useCallback, useEffect, useState } from "react";
import type { AuthUser } from "@/types/auth";
import { authAPI } from "@/lib/api/auth";

interface AuthContextType {
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<boolean>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  accessToken: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => ({ success: false }),
  register: async () => ({ success: false }),
  logout: async () => {},
  refreshAuth: async () => false,
});

const TOKEN_KEY = "betmaster_access_token";
const REFRESH_KEY = "betmaster_refresh_token";

function setAuthCookie(token: string | null) {
  if (token) {
    document.cookie = `betmaster_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
  } else {
    document.cookie = "betmaster_token=; path=/; max-age=0; SameSite=Lax";
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const saveTokens = useCallback((access: string, refresh: string) => {
    localStorage.setItem(TOKEN_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
    setAccessToken(access);
    setAuthCookie(access);
  }, []);

  const clearAuth = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    setAccessToken(null);
    setUser(null);
    setAuthCookie(null);
  }, []);

  const refreshAuth = useCallback(async (): Promise<boolean> => {
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    if (!refreshToken) return false;

    const res = await authAPI.refresh(refreshToken);
    if (res.success && res.data) {
      saveTokens(res.data.access_token, res.data.refresh_token);
      setUser(res.data.user);
      return true;
    }
    clearAuth();
    return false;
  }, [saveTokens, clearAuth]);

  // Check auth on mount
  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        setIsLoading(false);
        return;
      }
      setAccessToken(token);
      setAuthCookie(token);

      const res = await authAPI.me(token);
      if (res.success && res.data) {
        setUser(res.data.user);
        setIsLoading(false);
      } else {
        // Try refresh
        const refreshed = await refreshAuth();
        if (!refreshed) clearAuth();
        setIsLoading(false);
      }
    };
    init();
  }, [refreshAuth, clearAuth]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await authAPI.login({ email, password });
      if (res.success && res.data) {
        saveTokens(res.data.access_token, res.data.refresh_token);
        setUser(res.data.user);
        return { success: true };
      }
      return { success: false, error: res.error || "Errore durante il login" };
    },
    [saveTokens],
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const res = await authAPI.register({ name, email, password });
      if (res.success && res.data) {
        return { success: true, message: res.data.message };
      }
      return { success: false, error: res.error || "Errore durante la registrazione" };
    },
    [],
  );

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    if (refreshToken) {
      await authAPI.logout(refreshToken);
    }
    clearAuth();
  }, [clearAuth]);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

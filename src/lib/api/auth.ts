// src/lib/api/auth.ts
/**
 * Auth API client for BetMaster Backend
 */

import type {
  AuthResponse,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  AuthUser,
} from "@/types/auth";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:5000";

class AuthAPI {
  private baseUrl: string;

  constructor(baseUrl: string = BACKEND_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<AuthResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      });
      return await response.json();
    } catch (error) {
      return {
        success: false,
        timestamp: new Date().toISOString(),
        error:
          error instanceof Error ? error.message : "Errore di connessione",
      };
    }
  }

  async register(
    data: RegisterRequest,
  ): Promise<AuthResponse<{ message: string; user: AuthUser }>> {
    return this.request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async login(data: LoginRequest): Promise<AuthResponse<LoginResponse>> {
    return this.request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async logout(refreshToken: string): Promise<AuthResponse<{ message: string }>> {
    return this.request("/api/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  }

  async refresh(
    refreshToken: string,
  ): Promise<AuthResponse<LoginResponse>> {
    return this.request("/api/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  }

  async verifyEmail(
    token: string,
  ): Promise<AuthResponse<{ message: string }>> {
    return this.request(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
  }

  async me(accessToken: string): Promise<AuthResponse<{ user: AuthUser }>> {
    return this.request("/api/auth/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  }

  async forgotPassword(
    email: string,
  ): Promise<AuthResponse<{ message: string }>> {
    return this.request("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(
    token: string,
    password: string,
  ): Promise<AuthResponse<{ message: string }>> {
    return this.request("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, password }),
    });
  }

  async resendVerification(
    email: string,
  ): Promise<AuthResponse<{ message: string }>> {
    return this.request("/api/auth/resend-verification", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }
}

export const authAPI = new AuthAPI();
export { AuthAPI };

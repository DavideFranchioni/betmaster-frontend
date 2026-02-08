// src/types/auth.ts

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  is_verified: boolean;
  is_active: boolean;
  is_admin: boolean;
  created_at: string | null;
  last_login_at: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: AuthUser;
}

export interface AuthResponse<T = unknown> {
  success: boolean;
  timestamp: string;
  data?: T;
  error?: string;
}

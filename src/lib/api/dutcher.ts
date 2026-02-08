// src/lib/api/dutcher.ts
/**
 * API client for Dutcher Backend
 * Handles Punta-Punta (Back-Back) combination betting
 */

import type {
  DutcherResponse,
  DutcherFilters,
} from '@/types/dutcher';
import type { EventSearchResult } from '@/types/oddsmatcher';
import { authAPI } from './auth';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:5000';

const TOKEN_KEY = 'betmaster_access_token';
const REFRESH_KEY = 'betmaster_refresh_token';

interface ApiResponse<T> {
  success: boolean;
  timestamp: string;
  data: T;
  error?: string;
}

class DutcherAPI {
  private baseUrl: string;
  private refreshPromise: Promise<string | null> | null = null;

  constructor(baseUrl: string = BACKEND_URL) {
    this.baseUrl = baseUrl;
  }

  private getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  }

  private async tryRefresh(): Promise<string | null> {
    if (this.refreshPromise) return this.refreshPromise;

    this.refreshPromise = this._doRefresh();
    try {
      return await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async _doRefresh(): Promise<string | null> {
    if (typeof window === 'undefined') return null;
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    if (!refreshToken) return null;

    const res = await authAPI.refresh(refreshToken);
    if (res.success && res.data) {
      localStorage.setItem(TOKEN_KEY, res.data.access_token);
      localStorage.setItem(REFRESH_KEY, res.data.refresh_token);
      document.cookie = `betmaster_token=${res.data.access_token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
      return res.data.access_token;
    }
    return null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retry = true,
  ): Promise<ApiResponse<T>> {
    try {
      const token = this.getAccessToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> || {}),
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });

      if (response.status === 401 && retry) {
        const newToken = await this.tryRefresh();
        if (newToken) {
          return this.request(endpoint, options, false);
        }
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Dutcher API Error (${endpoint}):`, error);
      return {
        success: false,
        timestamp: new Date().toISOString(),
        data: null as unknown as T,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Dutcher main endpoint
  async getDutcher(filters: Partial<DutcherFilters> = {}): Promise<DutcherResponse> {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          value.forEach(item => {
            if (item !== undefined && item !== null && item !== '') {
              params.append(key, String(item));
            }
          });
        } else {
          params.append(key, String(value));
        }
      }
    });

    const queryString = params.toString();
    const endpoint = `/api/dutcher${queryString ? `?${queryString}` : ''}`;

    return this.request(endpoint);
  }

  // Event search (same as oddsmatcher)
  async searchEvents(name: string): Promise<ApiResponse<EventSearchResult[]>> {
    const params = new URLSearchParams({ name });
    return this.request(`/api/events/search?${params.toString()}`);
  }
}

// Singleton instance
export const dutcherAPI = new DutcherAPI();

// Export class for custom instances
export { DutcherAPI };

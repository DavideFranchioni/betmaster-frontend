// src/lib/api/backend.ts
/**
 * API client for BetMaster Backend
 */

import type {
  OddsMatcherResponse,
  OddsMatcherFilters,
  BackendConfig,
  BackendStatus,
  EventSearchResult,
  OddsEvent
} from '@/types/oddsmatcher';
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

class BackendAPI {
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
    // Deduplicate concurrent refresh calls
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

  async request<T>(
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
      console.error(`API Error (${endpoint}):`, error);
      return {
        success: false,
        timestamp: new Date().toISOString(),
        data: null as unknown as T,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Health & Status
  async healthCheck(): Promise<ApiResponse<{ status: string; version: string }>> {
    return this.request('/api/health');
  }

  async getStatus(): Promise<ApiResponse<BackendStatus>> {
    return this.request('/api/status');
  }

  async getConfig(): Promise<ApiResponse<BackendConfig>> {
    return this.request('/api/config');
  }

  // NinjaBet Auth
  async login(): Promise<ApiResponse<{ logged_in: boolean; uid: string }>> {
    return this.request('/api/ninjabet/login', { method: 'POST' });
  }

  async logout(): Promise<ApiResponse<{ logged_out: boolean }>> {
    return this.request('/api/ninjabet/logout', { method: 'POST' });
  }

  // Event Search (autocomplete)
  async searchEvents(name: string): Promise<ApiResponse<EventSearchResult[]>> {
    const params = new URLSearchParams({ name });
    return this.request(`/api/events/search?${params.toString()}`);
  }

  async getEventDetails(name: string, id: string): Promise<ApiResponse<any[]>> {
    const params = new URLSearchParams({ name, id });
    return this.request(`/api/events/details?${params.toString()}`);
  }

  // OddsMatcher
  async getOddsMatcher(filters: Partial<OddsMatcherFilters> = {}): Promise<OddsMatcherResponse> {
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
    const endpoint = `/api/oddsmatcher${queryString ? `?${queryString}` : ''}`;

    return this.request(endpoint);
  }

  async getAllOddsMatcher(
    filters: Partial<OddsMatcherFilters> = {},
    maxPages: number = 10
  ): Promise<ApiResponse<{ events: OddsEvent[]; count: number }>> {
    return this.request('/api/oddsmatcher/all', {
      method: 'POST',
      body: JSON.stringify({ ...filters, max_pages: maxPages }),
    });
  }

  // Info endpoints
  async getBookmakers(): Promise<ApiResponse<{ id: string; name: string }[]>> {
    return this.request('/api/bookmakers');
  }

  async getExchanges(): Promise<ApiResponse<{ id: string; name: string }[]>> {
    return this.request('/api/exchanges');
  }

  async getSports(): Promise<ApiResponse<{ id: string; name: string }[]>> {
    return this.request('/api/sports');
  }

  async getBetTypes(): Promise<ApiResponse<{ key: string; name: string }[]>> {
    return this.request('/api/bet-types');
  }
}

// Singleton instance
export const backendAPI = new BackendAPI();

// Export class for custom instances
export { BackendAPI };

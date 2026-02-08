// src/lib/api/admin.ts

import type {
  AdminStats,
  AdminUser,
  PaginatedUsers,
  Subscription,
  Payment,
} from '@/types/subscription';
import { backendAPI } from './backend';

class AdminAPI {
  async getStats() {
    return backendAPI.request<AdminStats>('/api/admin/stats');
  }

  async getUsers(page = 1, perPage = 20, search = '') {
    const params = new URLSearchParams({
      page: String(page),
      per_page: String(perPage),
    });
    if (search) params.set('search', search);
    return backendAPI.request<PaginatedUsers>(`/api/admin/users?${params.toString()}`);
  }

  async getUserDetails(userId: number) {
    return backendAPI.request<AdminUser>(`/api/admin/users/${userId}`);
  }

  async toggleAdmin(userId: number) {
    return backendAPI.request<{ is_admin: boolean }>(
      `/api/admin/users/${userId}/toggle-admin`,
      { method: 'POST' }
    );
  }

  async toggleActive(userId: number) {
    return backendAPI.request<{ is_active: boolean }>(
      `/api/admin/users/${userId}/toggle-active`,
      { method: 'POST' }
    );
  }

  async giftSubscription(userId: number, planId: number, note?: string) {
    return backendAPI.request<{ message: string; subscription: Subscription }>(
      '/api/admin/gift-subscription',
      {
        method: 'POST',
        body: JSON.stringify({ user_id: userId, plan_id: planId, note }),
      }
    );
  }

  async getSubscriptions(filters: { status?: string; is_gifted?: string } = {}) {
    const params = new URLSearchParams();
    if (filters.status) params.set('status', filters.status);
    if (filters.is_gifted) params.set('is_gifted', filters.is_gifted);
    return backendAPI.request<(Subscription & { user_email?: string; user_name?: string })[]>(
      `/api/admin/subscriptions?${params.toString()}`
    );
  }

  async getPayments(filters: { status?: string; date_from?: string; date_to?: string } = {}) {
    const params = new URLSearchParams();
    if (filters.status) params.set('status', filters.status);
    if (filters.date_from) params.set('date_from', filters.date_from);
    if (filters.date_to) params.set('date_to', filters.date_to);
    return backendAPI.request<Payment[]>(`/api/admin/payments?${params.toString()}`);
  }

  async revokeSubscription(subId: number) {
    return backendAPI.request<{ message: string }>(
      `/api/admin/subscriptions/${subId}/revoke`,
      { method: 'POST' }
    );
  }
}

export const adminAPI = new AdminAPI();

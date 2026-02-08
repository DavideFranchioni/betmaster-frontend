// src/lib/api/subscription.ts

import type {
  SubscriptionPlan,
  SubscriptionStatus,
  Subscription,
  PurchaseRequest,
  PurchaseResponse,
  Payment,
} from '@/types/subscription';
import { backendAPI } from './backend';

class SubscriptionAPI {
  async getPlans() {
    return backendAPI.request<SubscriptionPlan[]>('/api/subscription/plans');
  }

  async getStatus() {
    return backendAPI.request<SubscriptionStatus>('/api/subscription/status');
  }

  async getUpgradePrice(planId: number) {
    return backendAPI.request<{
      target_plan: SubscriptionPlan;
      credit_eur: number;
      final_price_eur: number;
    }>('/api/subscription/upgrade-price', {
      method: 'POST',
      body: JSON.stringify({ plan_id: planId }),
    });
  }

  async purchase(data: PurchaseRequest) {
    return backendAPI.request<PurchaseResponse>('/api/subscription/purchase', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getPayments() {
    return backendAPI.request<Payment[]>('/api/subscription/payments');
  }

  async getHistory() {
    return backendAPI.request<Subscription[]>('/api/subscription/history');
  }

  async cancel() {
    return backendAPI.request<{ message: string; expires_at: string | null }>(
      '/api/subscription/cancel',
      { method: 'POST' }
    );
  }
}

export const subscriptionAPI = new SubscriptionAPI();

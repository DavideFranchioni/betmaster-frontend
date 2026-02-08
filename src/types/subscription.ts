// src/types/subscription.ts

export interface SubscriptionPlan {
  id: number;
  name: string;
  slug: string;
  tier: string;
  description: string | null;
  price_eur: number;
  duration_days: number;
  is_active: boolean;
  features: string[] | null;
}

export interface Subscription {
  id: number;
  user_id: number;
  plan_id: number;
  plan: SubscriptionPlan | null;
  status: 'pending' | 'active' | 'expired' | 'cancelled';
  starts_at: string | null;
  expires_at: string | null;
  is_gifted: boolean;
  gifted_by_admin_id: number | null;
  gift_note: string | null;
  cancelled_at: string | null;
  created_at: string | null;
}

export interface Payment {
  id: number;
  user_id: number;
  subscription_id: number | null;
  order_id: string;
  amount_eur: number;
  pay_currency: string | null;
  pay_amount: number | null;
  status: string;
  invoice_url: string | null;
  paid_at: string | null;
  completed_at: string | null;
  created_at: string | null;
  // Admin-only fields
  user_email?: string;
  user_name?: string;
}

export interface SubscriptionStatus {
  has_subscription: boolean;
  subscription: Subscription | null;
}

export interface PurchaseRequest {
  plan_id: number;
}

export interface PurchaseResponse {
  invoice_url: string;
  order_id: string;
}

export interface AdminStats {
  total_users: number;
  verified_users: number;
  active_subscriptions: number;
  total_revenue_eur: number;
  monthly_revenue_eur: number;
  gifted_subscriptions: number;
  subscription_breakdown: { plan: string; count: number }[];
  recent_payments: Payment[];
}

export interface AdminUser {
  id: number;
  email: string;
  name: string;
  is_verified: boolean;
  is_active: boolean;
  is_admin: boolean;
  created_at: string | null;
  last_login_at: string | null;
  active_subscription: Subscription | null;
  subscriptions?: Subscription[];
  payments?: Payment[];
}

export interface PaginatedUsers {
  users: AdminUser[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

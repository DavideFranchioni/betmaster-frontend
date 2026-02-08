"use client";

import React, { useEffect, useState } from "react";
import { Users, CreditCard, TrendingUp, Gift, Receipt } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { adminAPI } from "@/lib/api/admin";
import type { AdminStats } from "@/types/subscription";

const statusBadge: Record<string, { bg: string; text: string; label: string }> = {
  waiting: { bg: "bg-yellow-100", text: "text-yellow-800", label: "In attesa" },
  confirming: { bg: "bg-blue-100", text: "text-blue-800", label: "In conferma" },
  confirmed: { bg: "bg-blue-100", text: "text-blue-800", label: "Confermato" },
  finished: { bg: "bg-green-100", text: "text-green-800", label: "Completato" },
  failed: { bg: "bg-red-100", text: "text-red-800", label: "Fallito" },
  expired: { bg: "bg-gray-100", text: "text-gray-800", label: "Scaduto" },
  refunded: { bg: "bg-purple-100", text: "text-purple-800", label: "Rimborsato" },
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getStats().then((res) => {
      if (res.success && res.data) setStats(res.data);
      setLoading(false);
    });
  }, []);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-brand-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!stats) {
    return <p className="text-center text-gray-500 py-12">Errore nel caricamento delle statistiche</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Stats grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5 mb-8">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Utenti totali</p>
                <p className="text-xl font-bold text-gray-900">{stats.total_users}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Verificati</p>
                <p className="text-xl font-bold text-gray-900">{stats.verified_users}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Sub attive</p>
                <p className="text-xl font-bold text-gray-900">{stats.active_subscriptions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Revenue totale</p>
                <p className="text-xl font-bold text-gray-900">{"\u20AC"}{stats.total_revenue_eur.toFixed(0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Revenue mese</p>
                <p className="text-xl font-bold text-gray-900">{"\u20AC"}{stats.monthly_revenue_eur.toFixed(0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Breakdown + Gifted */}
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Abbonamenti per piano</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.subscription_breakdown.length === 0 ? (
              <p className="text-sm text-gray-500">Nessun abbonamento attivo</p>
            ) : (
              <div className="space-y-3">
                {stats.subscription_breakdown.map((item) => (
                  <div key={item.plan} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{item.plan}</span>
                    <span className="text-sm font-bold text-gray-900">{item.count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Gift className="w-5 h-5 text-brand-accent" />
              Abbonamenti regalati
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900">{stats.gifted_subscriptions}</p>
            <p className="text-sm text-gray-500 mt-1">totale regalati</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent payments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Receipt className="w-5 h-5 text-brand-accent" />
            Ultimi pagamenti
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recent_payments.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">Nessun pagamento</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-2 text-gray-500 font-medium">Ordine</th>
                    <th className="text-left py-2 px-2 text-gray-500 font-medium">Importo</th>
                    <th className="text-left py-2 px-2 text-gray-500 font-medium">Stato</th>
                    <th className="text-left py-2 px-2 text-gray-500 font-medium">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recent_payments.map((p) => {
                    const badge = statusBadge[p.status] || statusBadge.waiting;
                    return (
                      <tr key={p.id} className="border-b border-gray-100">
                        <td className="py-2 px-2 font-mono text-xs">{p.order_id}</td>
                        <td className="py-2 px-2">{"\u20AC"}{p.amount_eur.toFixed(2)}</td>
                        <td className="py-2 px-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-gray-500">{formatDate(p.created_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

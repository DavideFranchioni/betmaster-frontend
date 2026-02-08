"use client";

import React, { useEffect, useState } from "react";
import { Receipt, Gift } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { subscriptionAPI } from "@/lib/api/subscription";
import type { Payment, Subscription } from "@/types/subscription";

const statusBadge: Record<string, { bg: string; text: string; label: string }> = {
  waiting: { bg: "bg-yellow-100", text: "text-yellow-800", label: "In attesa" },
  confirming: { bg: "bg-blue-100", text: "text-blue-800", label: "In conferma" },
  confirmed: { bg: "bg-blue-100", text: "text-blue-800", label: "Confermato" },
  finished: { bg: "bg-green-100", text: "text-green-800", label: "Completato" },
  failed: { bg: "bg-red-100", text: "text-red-800", label: "Fallito" },
  expired: { bg: "bg-gray-100", text: "text-gray-800", label: "Scaduto" },
  refunded: { bg: "bg-purple-100", text: "text-purple-800", label: "Rimborsato" },
};

const subStatusBadge: Record<string, { bg: string; text: string; label: string }> = {
  active: { bg: "bg-green-100", text: "text-green-800", label: "Attivo" },
  pending: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Pending" },
  expired: { bg: "bg-gray-100", text: "text-gray-800", label: "Scaduto" },
  cancelled: { bg: "bg-red-100", text: "text-red-800", label: "Cancellato" },
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      subscriptionAPI.getPayments(),
      subscriptionAPI.getHistory(),
    ]).then(([paymentsRes, historyRes]) => {
      if (paymentsRes.success && paymentsRes.data) setPayments(paymentsRes.data);
      if (historyRes.success && historyRes.data) setSubscriptions(historyRes.data);
      setLoading(false);
    });
  }, []);

  const giftedSubs = subscriptions.filter((s) => s.is_gifted);

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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Storico</h1>

      {/* Gifted subscriptions */}
      {!loading && giftedSubs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Gift className="w-5 h-5 text-amber-500" />
              Abbonamenti regalati
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-2 text-gray-500 font-medium">Piano</th>
                    <th className="text-left py-3 px-2 text-gray-500 font-medium">Stato</th>
                    <th className="text-left py-3 px-2 text-gray-500 font-medium">Inizio</th>
                    <th className="text-left py-3 px-2 text-gray-500 font-medium">Scadenza</th>
                    <th className="text-left py-3 px-2 text-gray-500 font-medium">Nota</th>
                  </tr>
                </thead>
                <tbody>
                  {giftedSubs.map((s) => {
                    const badge = subStatusBadge[s.status] || subStatusBadge.pending;
                    return (
                      <tr key={s.id} className="border-b border-gray-100">
                        <td className="py-3 px-2 font-medium">{s.plan?.name || "-"}</td>
                        <td className="py-3 px-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-gray-500">{formatDate(s.starts_at)}</td>
                        <td className="py-3 px-2 text-gray-500">{formatDate(s.expires_at)}</td>
                        <td className="py-3 px-2 text-gray-500 text-xs">{s.gift_note || "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Receipt className="w-5 h-5 text-brand-accent" />
            Pagamenti
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : payments.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              Nessun pagamento effettuato
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-2 text-gray-500 font-medium">Ordine</th>
                    <th className="text-left py-3 px-2 text-gray-500 font-medium">Importo</th>
                    <th className="text-left py-3 px-2 text-gray-500 font-medium">Crypto</th>
                    <th className="text-left py-3 px-2 text-gray-500 font-medium">Stato</th>
                    <th className="text-left py-3 px-2 text-gray-500 font-medium">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => {
                    const badge = statusBadge[p.status] || statusBadge.waiting;
                    return (
                      <tr key={p.id} className="border-b border-gray-100">
                        <td className="py-3 px-2 font-mono text-xs">{p.order_id}</td>
                        <td className="py-3 px-2">{"\u20AC"}{p.amount_eur.toFixed(2)}</td>
                        <td className="py-3 px-2">
                          {p.pay_currency ? (
                            <span className="text-xs">
                              {p.pay_amount} {p.pay_currency.toUpperCase()}
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="py-3 px-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-gray-500">{formatDate(p.created_at)}</td>
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

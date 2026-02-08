"use client";

import React, { useEffect, useState, useCallback } from "react";
import { CreditCard, X, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { adminAPI } from "@/lib/api/admin";
import type { Subscription } from "@/types/subscription";

type SubWithUser = Subscription & { user_email?: string; user_name?: string };

const statusOptions = [
  { value: "", label: "Tutti" },
  { value: "active", label: "Attivi" },
  { value: "pending", label: "Pending" },
  { value: "expired", label: "Scaduti" },
  { value: "cancelled", label: "Cancellati" },
];

const statusBadge: Record<string, { bg: string; text: string }> = {
  active: { bg: "bg-green-100", text: "text-green-800" },
  pending: { bg: "bg-yellow-100", text: "text-yellow-800" },
  expired: { bg: "bg-gray-100", text: "text-gray-800" },
  cancelled: { bg: "bg-red-100", text: "text-red-800" },
};

export default function AdminSubscriptionsPage() {
  const [subs, setSubs] = useState<SubWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [giftedOnly, setGiftedOnly] = useState(false);
  const [revoking, setRevoking] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadSubs = useCallback(async () => {
    setLoading(true);
    const filters: { status?: string; is_gifted?: string } = {};
    if (statusFilter) filters.status = statusFilter;
    if (giftedOnly) filters.is_gifted = "true";
    const res = await adminAPI.getSubscriptions(filters);
    if (res.success && res.data) setSubs(res.data);
    setLoading(false);
  }, [statusFilter, giftedOnly]);

  useEffect(() => {
    loadSubs();
  }, [loadSubs]);

  const handleRevoke = async (subId: number) => {
    if (!confirm("Sei sicuro di voler revocare questo abbonamento?")) return;
    setRevoking(subId);
    const res = await adminAPI.revokeSubscription(subId);
    if (res.success) {
      setMessage({ type: "success", text: "Abbonamento revocato" });
      await loadSubs();
    } else {
      setMessage({ type: "error", text: res.error || "Errore" });
    }
    setRevoking(null);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Abbonamenti</h1>

      {message && (
        <div
          className={`mb-4 p-3 rounded-lg text-sm ${
            message.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
          }`}
        >
          {message.text}
          <button onClick={() => setMessage(null)} className="float-right font-bold">&times;</button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent"
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={giftedOnly}
            onChange={(e) => setGiftedOnly(e.target.checked)}
            className="rounded"
          />
          Solo regalati
        </label>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="w-5 h-5 text-brand-accent" />
            Abbonamenti ({subs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : subs.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">Nessun abbonamento trovato</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-2 text-gray-500 font-medium">ID</th>
                    <th className="text-left py-2 px-2 text-gray-500 font-medium">Utente</th>
                    <th className="text-left py-2 px-2 text-gray-500 font-medium">Piano</th>
                    <th className="text-left py-2 px-2 text-gray-500 font-medium">Stato</th>
                    <th className="text-left py-2 px-2 text-gray-500 font-medium">Inizio</th>
                    <th className="text-left py-2 px-2 text-gray-500 font-medium">Scadenza</th>
                    <th className="text-left py-2 px-2 text-gray-500 font-medium">Regalato</th>
                    <th className="text-left py-2 px-2 text-gray-500 font-medium">Nota</th>
                    <th className="text-left py-2 px-2 text-gray-500 font-medium">Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {subs.map((s) => {
                    const badge = statusBadge[s.status] || statusBadge.pending;
                    return (
                      <tr key={s.id} className="border-b border-gray-100">
                        <td className="py-2 px-2 text-gray-400">{s.id}</td>
                        <td className="py-2 px-2">
                          <div>
                            <p className="font-medium text-gray-900">{s.user_name}</p>
                            <p className="text-xs text-gray-500">{s.user_email}</p>
                          </div>
                        </td>
                        <td className="py-2 px-2">{s.plan?.name || "-"}</td>
                        <td className="py-2 px-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                            {s.status}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-gray-500">{formatDate(s.starts_at)}</td>
                        <td className="py-2 px-2 text-gray-500">{formatDate(s.expires_at)}</td>
                        <td className="py-2 px-2">
                          {s.is_gifted ? (
                            <span className="text-xs text-amber-600 font-medium">Si</span>
                          ) : (
                            <span className="text-xs text-gray-400">No</span>
                          )}
                        </td>
                        <td className="py-2 px-2 text-xs text-gray-500 max-w-[200px] truncate" title={s.gift_note || ""}>
                          {s.gift_note || "-"}
                        </td>
                        <td className="py-2 px-2">
                          {s.status === "active" && (
                            <button
                              onClick={() => handleRevoke(s.id)}
                              disabled={revoking === s.id}
                              className="p-1 rounded hover:bg-red-50 text-gray-500 hover:text-red-600"
                              title="Revoca"
                            >
                              {revoking === s.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <X className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </td>
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

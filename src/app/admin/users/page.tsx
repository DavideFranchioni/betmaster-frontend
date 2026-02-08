"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Search, Shield, ShieldOff, Ban, CheckCircle, Gift, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { adminAPI } from "@/lib/api/admin";
import type { AdminUser, SubscriptionPlan } from "@/types/subscription";
import { subscriptionAPI } from "@/lib/api/subscription";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [giftDialog, setGiftDialog] = useState<{ userId: number; userName: string } | null>(null);
  const [giftPlanId, setGiftPlanId] = useState<number>(0);
  const [giftNote, setGiftNote] = useState("");
  const [giftLoading, setGiftLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const res = await adminAPI.getUsers(page, 20, search);
    if (res.success && res.data) {
      setUsers(res.data.users);
      setTotal(res.data.total);
      setPages(res.data.pages);
    }
    setLoading(false);
  }, [page, search]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    subscriptionAPI.getPlans().then((res) => {
      if (res.success && res.data) {
        setPlans(res.data);
        if (res.data.length > 0) setGiftPlanId(res.data[0].id);
      }
    });
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const handleToggleAdmin = async (userId: number) => {
    setActionLoading(userId);
    const res = await adminAPI.toggleAdmin(userId);
    if (res.success) {
      await loadUsers();
      setMessage({ type: "success", text: "Stato admin aggiornato" });
    } else {
      setMessage({ type: "error", text: res.error || "Errore" });
    }
    setActionLoading(null);
  };

  const handleToggleActive = async (userId: number) => {
    setActionLoading(userId);
    const res = await adminAPI.toggleActive(userId);
    if (res.success) {
      await loadUsers();
      setMessage({ type: "success", text: "Stato utente aggiornato" });
    } else {
      setMessage({ type: "error", text: res.error || "Errore" });
    }
    setActionLoading(null);
  };

  const handleGift = async () => {
    if (!giftDialog || !giftPlanId) return;
    setGiftLoading(true);
    const res = await adminAPI.giftSubscription(giftDialog.userId, giftPlanId, giftNote || undefined);
    if (res.success && res.data) {
      setMessage({ type: "success", text: res.data.message });
      setGiftDialog(null);
      setGiftNote("");
      await loadUsers();
    } else {
      setMessage({ type: "error", text: res.error || "Errore" });
    }
    setGiftLoading(false);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Gestione utenti</h1>

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

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cerca per email o nome..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent"
            />
          </div>
          <Button type="submit" size="sm">Cerca</Button>
        </div>
      </form>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Utenti ({total})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-2 text-gray-500 font-medium">ID</th>
                      <th className="text-left py-2 px-2 text-gray-500 font-medium">Nome</th>
                      <th className="text-left py-2 px-2 text-gray-500 font-medium">Email</th>
                      <th className="text-left py-2 px-2 text-gray-500 font-medium">Sub</th>
                      <th className="text-left py-2 px-2 text-gray-500 font-medium">Admin</th>
                      <th className="text-left py-2 px-2 text-gray-500 font-medium">Attivo</th>
                      <th className="text-left py-2 px-2 text-gray-500 font-medium">Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b border-gray-100">
                        <td className="py-2 px-2 text-gray-400">{u.id}</td>
                        <td className="py-2 px-2 font-medium">{u.name}</td>
                        <td className="py-2 px-2 text-gray-600">{u.email}</td>
                        <td className="py-2 px-2">
                          {u.active_subscription ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {u.active_subscription.plan?.name || "Attivo"}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">Nessuno</span>
                          )}
                        </td>
                        <td className="py-2 px-2">
                          {u.is_admin ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">Admin</span>
                          ) : (
                            <span className="text-xs text-gray-400">No</span>
                          )}
                        </td>
                        <td className="py-2 px-2">
                          {u.is_active ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Si</span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">No</span>
                          )}
                        </td>
                        <td className="py-2 px-2">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleToggleAdmin(u.id)}
                              disabled={actionLoading === u.id}
                              className="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-purple-600"
                              title={u.is_admin ? "Rimuovi admin" : "Rendi admin"}
                            >
                              {u.is_admin ? <ShieldOff className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => handleToggleActive(u.id)}
                              disabled={actionLoading === u.id}
                              className="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-red-600"
                              title={u.is_active ? "Banna" : "Riattiva"}
                            >
                              {u.is_active ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => setGiftDialog({ userId: u.id, userName: u.name })}
                              className="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-amber-600"
                              title="Regala abbonamento"
                            >
                              <Gift className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-gray-500">
                    Pagina {page} di {pages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage(page - 1)}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= pages}
                      onClick={() => setPage(page + 1)}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Gift Dialog */}
      {giftDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Regala abbonamento a {giftDialog.userName}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Piano</label>
                <select
                  value={giftPlanId}
                  onChange={(e) => setGiftPlanId(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent"
                >
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} ({"\u20AC"}{plan.price_eur} - {plan.duration_days}gg)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nota (opzionale)
                </label>
                <input
                  type="text"
                  value={giftNote}
                  onChange={(e) => setGiftNote(e.target.value)}
                  placeholder="es. Premio contest..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setGiftDialog(null);
                  setGiftNote("");
                }}
              >
                Annulla
              </Button>
              <Button
                variant="gold"
                className="flex-1"
                onClick={handleGift}
                disabled={giftLoading}
              >
                {giftLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Gift className="w-4 h-4 mr-2" />
                )}
                Regala
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

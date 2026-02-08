"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, CreditCard, Gift, X, Loader2, ArrowUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { subscriptionAPI } from "@/lib/api/subscription";
import type { SubscriptionPlan, SubscriptionStatus } from "@/types/subscription";

export default function SubscriptionPage() {
  const searchParams = useSearchParams();
  const paymentResult = searchParams.get("payment");

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subStatus, setSubStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<number | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [upgradePrices, setUpgradePrices] = useState<Record<number, { credit: number; final: number }>>({});

  const loadData = async () => {
    const [plansRes, statusRes] = await Promise.all([
      subscriptionAPI.getPlans(),
      subscriptionAPI.getStatus(),
    ]);
    if (plansRes.success && plansRes.data) setPlans(plansRes.data);
    if (statusRes.success && statusRes.data) setSubStatus(statusRes.data);
    setLoading(false);

    // If user has active sub, calculate upgrade prices for other plans
    if (statusRes.success && statusRes.data?.has_subscription && plansRes.success && plansRes.data) {
      const activePlanId = statusRes.data.subscription?.plan_id;
      const otherPlans = plansRes.data.filter((p) => p.id !== activePlanId);
      const prices: Record<number, { credit: number; final: number }> = {};
      for (const plan of otherPlans) {
        const res = await subscriptionAPI.getUpgradePrice(plan.id);
        if (res.success && res.data) {
          prices[plan.id] = {
            credit: res.data.credit_eur,
            final: res.data.final_price_eur,
          };
        }
      }
      setUpgradePrices(prices);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (paymentResult === "success") {
      setMessage({ type: "success", text: "Pagamento completato! Il tuo abbonamento sara attivato a breve." });
    } else if (paymentResult === "cancelled") {
      setMessage({ type: "error", text: "Pagamento annullato." });
    }
  }, [paymentResult]);

  const handlePurchase = async (planId: number) => {
    setPurchasing(planId);
    setMessage(null);
    const res = await subscriptionAPI.purchase({ plan_id: planId });
    if (res.success && res.data?.invoice_url) {
      window.location.href = res.data.invoice_url;
    } else {
      setMessage({ type: "error", text: res.error || "Errore nella creazione del pagamento" });
      setPurchasing(null);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Sei sicuro di voler cancellare il tuo abbonamento? Rimarra attivo fino alla scadenza.")) return;
    setCancelling(true);
    const res = await subscriptionAPI.cancel();
    if (res.success && res.data) {
      setMessage({ type: "success", text: res.data.message });
      const statusRes = await subscriptionAPI.getStatus();
      if (statusRes.success && statusRes.data) setSubStatus(statusRes.data);
    } else {
      setMessage({ type: "error", text: res.error || "Errore nella cancellazione" });
    }
    setCancelling(false);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("it-IT", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-brand-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const activePlanId = subStatus?.subscription?.plan_id;
  const hasActiveSub = subStatus?.has_subscription && subStatus.subscription;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Abbonamento</h1>

      {/* Messages */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-lg text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Current subscription */}
      {hasActiveSub && subStatus.subscription && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="w-5 h-5 text-brand-accent" />
              Il tuo abbonamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {subStatus.subscription.status === "active" ? "Attivo" : subStatus.subscription.status === "cancelled" ? "Cancellato" : subStatus.subscription.status}
                  </span>
                  <span className="font-semibold text-gray-900">
                    {subStatus.subscription.plan?.name}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  Scade il {formatDate(subStatus.subscription.expires_at)}
                </p>
                {subStatus.subscription.is_gifted && (
                  <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                    <Gift className="w-3 h-3" /> Abbonamento regalato
                    {subStatus.subscription.gift_note && ` - ${subStatus.subscription.gift_note}`}
                  </p>
                )}
              </div>
              {!subStatus.subscription.is_gifted && subStatus.subscription.status === "active" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  {cancelling ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <X className="w-4 h-4 mr-2" />
                  )}
                  Cancella
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plans */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        {hasActiveSub ? "Piani disponibili" : "Scegli il tuo piano"}
      </h2>

      <div className="grid gap-6 md:grid-cols-2">
        {plans.map((plan) => {
          const isAnnual = plan.slug === "pro_annual";
          const isCurrentPlan = activePlanId === plan.id;
          const upgrade = upgradePrices[plan.id];
          const isUpgrade = hasActiveSub && !isCurrentPlan && upgrade;

          return (
            <Card
              key={plan.id}
              variant={isAnnual && !isCurrentPlan ? "bordered" : "default"}
              className={`${isAnnual && !isCurrentPlan ? "border-brand-accent relative" : ""} ${isCurrentPlan ? "ring-2 ring-green-400 relative" : ""}`}
            >
              {isAnnual && !isCurrentPlan && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-brand-accent text-brand-primary text-xs font-bold px-3 py-1 rounded-full">
                    CONSIGLIATO
                  </span>
                </div>
              )}
              {isCurrentPlan && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    PIANO ATTIVO
                  </span>
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <p className="text-sm text-gray-500">{plan.description}</p>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  {isUpgrade && upgrade.credit > 0 ? (
                    <div>
                      <span className="text-lg text-gray-400 line-through">
                        {"\u20AC"}{plan.price_eur}
                      </span>
                      <span className="text-3xl font-bold text-gray-900 ml-2">
                        {"\u20AC"}{upgrade.final.toFixed(2)}
                      </span>
                      <span className="text-gray-500 text-sm">
                        /{plan.duration_days === 30 ? "mese" : "anno"}
                      </span>
                      <p className="text-xs text-green-600 mt-1">
                        Credito dal piano attuale: -{"\u20AC"}{upgrade.credit.toFixed(2)}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <span className="text-3xl font-bold text-gray-900">
                        {"\u20AC"}{plan.price_eur}
                      </span>
                      <span className="text-gray-500 text-sm">
                        /{plan.duration_days === 30 ? "mese" : "anno"}
                      </span>
                    </div>
                  )}
                </div>

                {plan.features && (
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                )}

                {isCurrentPlan ? (
                  <Button className="w-full" variant="outline" disabled>
                    <Check className="w-4 h-4 mr-2" />
                    Piano attivo
                  </Button>
                ) : isUpgrade ? (
                  <Button
                    className="w-full"
                    variant="gold"
                    onClick={() => handlePurchase(plan.id)}
                    disabled={purchasing !== null}
                  >
                    {purchasing === plan.id ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <ArrowUp className="w-4 h-4 mr-2" />
                    )}
                    Upgrade a {plan.name}
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    variant={isAnnual ? "gold" : "default"}
                    onClick={() => handlePurchase(plan.id)}
                    disabled={purchasing !== null}
                  >
                    {purchasing === plan.id ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <CreditCard className="w-4 h-4 mr-2" />
                    )}
                    Acquista
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

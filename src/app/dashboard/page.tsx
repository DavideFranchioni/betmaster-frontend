"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { CreditCard, Mail, Calendar, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { subscriptionAPI } from "@/lib/api/subscription";
import type { SubscriptionStatus } from "@/types/subscription";

export default function DashboardPage() {
  const { user } = useAuth();
  const [subStatus, setSubStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    subscriptionAPI.getStatus().then((res) => {
      if (res.success && res.data) {
        setSubStatus(res.data);
      }
      setLoading(false);
    });
  }, []);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("it-IT", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Panoramica</h1>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Subscription status card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="w-5 h-5 text-brand-accent" />
              Stato abbonamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-20 bg-gray-100 rounded animate-pulse" />
            ) : subStatus?.has_subscription && subStatus.subscription ? (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Attivo
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {subStatus.subscription.plan?.name}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  Scade il {formatDate(subStatus.subscription.expires_at)}
                </p>
                {subStatus.subscription.is_gifted && (
                  <p className="text-xs text-gray-400 mt-1">Abbonamento regalato</p>
                )}
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-500 mb-3">
                  Non hai un abbonamento attivo. Sottoscrivi un piano per accedere a tutti gli strumenti.
                </p>
                <Link href="/dashboard/subscription">
                  <Button size="sm" variant="gold">
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Vedi piani
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account info card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Mail className="w-5 h-5 text-brand-accent" />
              Info account
            </CardTitle>
          </CardHeader>
          <CardContent>
            {user ? (
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-400">Nome</p>
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Email</p>
                  <p className="text-sm font-medium text-gray-900">{user.email}</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Calendar className="w-3 h-3" />
                  Membro dal {formatDate(user.created_at)}
                </div>
              </div>
            ) : (
              <div className="h-20 bg-gray-100 rounded animate-pulse" />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

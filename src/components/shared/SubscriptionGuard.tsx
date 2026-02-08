"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { CreditCard, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { subscriptionAPI } from "@/lib/api/subscription";

export function SubscriptionGuard({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [hasSubscription, setHasSubscription] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    // Admins bypass subscription check
    if (user?.is_admin) {
      setHasSubscription(true);
      setLoading(false);
      return;
    }

    subscriptionAPI.getStatus().then((res) => {
      if (res.success && res.data) {
        setHasSubscription(res.data.has_subscription);
      } else {
        setHasSubscription(false);
      }
      setLoading(false);
    });
  }, [isAuthenticated, user]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!hasSubscription) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-xl bg-brand-primary flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-brand-accent" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Abbonamento richiesto
          </h2>
          <p className="text-gray-500 mb-6">
            Per utilizzare questo strumento hai bisogno di un abbonamento attivo. Scegli il piano che fa per te.
          </p>
          <Link href="/dashboard/subscription">
            <Button variant="gold" className="w-full sm:w-auto">
              <CreditCard className="w-4 h-4 mr-2" />
              Vedi piani
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

"use client";

import React from "react";
import Link from "next/link";
import { LogIn, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-xl bg-brand-primary flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-brand-accent" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Accesso richiesto
          </h2>
          <p className="text-gray-500 mb-6">
            Per utilizzare questo strumento devi avere un account attivo. Accedi o registrati per continuare.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/auth/login">
              <Button className="w-full sm:w-auto">
                <LogIn className="w-4 h-4 mr-2" />
                Accedi
              </Button>
            </Link>
            <Link href="/auth/registrazione">
              <Button variant="outline" className="w-full sm:w-auto">
                Registrati
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

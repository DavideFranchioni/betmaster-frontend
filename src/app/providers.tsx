"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/components/shared/ToastContext";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          {children}
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

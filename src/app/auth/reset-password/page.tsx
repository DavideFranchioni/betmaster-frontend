"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { KeyRound, Eye, EyeOff, Lock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authAPI } from "@/lib/api/auth";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-[60vh]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" /></div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Le password non coincidono");
      return;
    }

    if (!token) {
      setError("Token di reset mancante");
      return;
    }

    setLoading(true);
    const res = await authAPI.resetPassword(token, password);
    if (res.success && res.data) {
      setSuccess(res.data.message);
    } else {
      setError(res.error || "Errore durante il reset");
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 rounded-xl bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Password reimpostata!</h1>
            <p className="text-gray-500 mb-6">{success}</p>
            <Link href="/auth/login">
              <Button className="w-full">Accedi al tuo account</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-xl bg-brand-primary flex items-center justify-center mx-auto mb-4">
              <KeyRound className="w-8 h-8 text-brand-accent" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Reimposta password
            </h1>
            <p className="text-gray-500 mt-2">
              Scegli una nuova password per il tuo account
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="password" className="text-gray-700">Nuova password</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimo 8 caratteri"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Maiuscola, minuscola, numero e carattere speciale
              </p>
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="text-gray-700">Conferma password</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Ripeti la password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10"
                  required
                  autoComplete="new-password"
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Salvataggio..." : "Salva nuova password"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

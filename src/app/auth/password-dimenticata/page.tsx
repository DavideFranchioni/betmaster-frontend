"use client";

import React, { useState } from "react";
import Link from "next/link";
import { KeyRound, Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authAPI } from "@/lib/api/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const res = await authAPI.forgotPassword(email);
    if (res.success && res.data) {
      setSuccess(res.data.message);
    } else {
      setError(res.error || "Errore durante l'invio");
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 rounded-xl bg-green-100 flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Controlla la tua email</h1>
            <p className="text-gray-500 mb-6">{success}</p>
            <Link href="/auth/login">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Torna al login
              </Button>
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
              Password dimenticata?
            </h1>
            <p className="text-gray-500 mt-2">
              Inserisci la tua email e ti invieremo un link per reimpostare la password
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="email" className="text-gray-700">Email</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="tuaemail@esempio.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Invio in corso..." : "Invia link di reset"}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            <Link href="/auth/login" className="text-brand-accent hover:text-yellow-600 font-medium">
              <ArrowLeft className="w-3 h-3 inline mr-1" />
              Torna al login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

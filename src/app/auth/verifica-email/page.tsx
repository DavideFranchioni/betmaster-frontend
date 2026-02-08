"use client";

import React, { Suspense, useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authAPI } from "@/lib/api/auth";

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-emerald-500" /></div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const verifiedRef = useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Token di verifica mancante");
      return;
    }

    if (verifiedRef.current) return;
    verifiedRef.current = true;

    const verify = async () => {
      const res = await authAPI.verifyEmail(token);
      if (res.success && res.data) {
        setStatus("success");
        setMessage(res.data.message);
      } else {
        setStatus("error");
        setMessage(res.error || "Errore durante la verifica");
      }
    };
    verify();
  }, [token]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {status === "loading" && (
            <>
              <Loader2 className="w-16 h-16 text-brand-accent animate-spin mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Verifica in corso...</h1>
              <p className="text-gray-500">Stiamo verificando il tuo indirizzo email</p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="w-16 h-16 rounded-xl bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Email verificata!</h1>
              <p className="text-gray-500 mb-6">{message}</p>
              <Link href="/auth/login">
                <Button className="w-full">Accedi al tuo account</Button>
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-16 h-16 rounded-xl bg-red-100 flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Verifica fallita</h1>
              <p className="text-gray-500 mb-6">{message}</p>
              <div className="space-y-3">
                <Link href="/auth/login">
                  <Button className="w-full">Vai al login</Button>
                </Link>
                <Link href="/auth/registrazione">
                  <Button variant="outline" className="w-full">Registrati di nuovo</Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

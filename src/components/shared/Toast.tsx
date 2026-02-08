"use client";

import React, { useEffect, useState } from "react";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ToastProps {
  id: string;
  message: string;
  type: "success" | "error" | "info";
  duration?: number;
  onClose: (id: string) => void;
}

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
};

const styles = {
  success: "bg-green-50 border-green-200 text-green-800",
  error: "bg-red-50 border-red-200 text-red-800",
  info: "bg-blue-50 border-blue-200 text-blue-800",
};

const iconStyles = {
  success: "text-green-500",
  error: "text-red-500",
  info: "text-blue-500",
};

export function Toast({ id, message, type, duration = 5000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const Icon = icons[type];

  useEffect(() => {
    // Fade in
    requestAnimationFrame(() => setIsVisible(true));

    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose(id), 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg transition-all duration-300",
        styles[type],
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
      )}
    >
      <Icon className={cn("w-5 h-5 flex-shrink-0", iconStyles[type])} />
      <p className="text-sm flex-1">{message}</p>
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(() => onClose(id), 300);
        }}
        className="flex-shrink-0 hover:opacity-70"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function ToastContainer({ toasts, onClose }: { toasts: ToastProps[]; onClose: (id: string) => void }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={onClose} />
      ))}
    </div>
  );
}

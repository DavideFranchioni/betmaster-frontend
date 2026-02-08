"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, CreditCard, Receipt, Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const sidebarLinks = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Utenti", href: "/admin/users", icon: Users },
  { name: "Abbonamenti", href: "/admin/subscriptions", icon: CreditCard },
  { name: "Pagamenti", href: "/admin/payments", icon: Receipt },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user?.is_admin)) {
      router.push("/");
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user?.is_admin) {
    return null;
  }

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Mobile top nav */}
      <div className="md:hidden border-b border-gray-200 bg-white">
        <div className="flex items-center gap-2 px-4 py-2">
          <Shield className="w-4 h-4 text-brand-accent" />
          <span className="text-sm font-semibold">Admin</span>
        </div>
        <div className="flex overflow-x-auto px-4 pb-2 gap-1">
          {sidebarLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                pathname === link.href
                  ? "bg-brand-primary text-white"
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              <link.icon className="w-4 h-4" />
              {link.name}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex md:flex-col md:w-64 border-r border-gray-200 bg-white min-h-[calc(100vh-4rem)]">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-brand-accent" />
              <h2 className="text-lg font-bold text-gray-900">Pannello Admin</h2>
            </div>
            <nav className="space-y-1">
              {sidebarLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    pathname === link.href
                      ? "bg-brand-primary text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  )}
                >
                  <link.icon className="w-5 h-5" />
                  {link.name}
                </Link>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-4 md:p-8 bg-gray-50">
          <div className="max-w-6xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}

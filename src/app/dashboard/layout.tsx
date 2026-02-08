"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CreditCard, Receipt } from "lucide-react";
import { AuthGuard } from "@/components/shared/AuthGuard";
import { cn } from "@/lib/utils";

const sidebarLinks = [
  { name: "Panoramica", href: "/dashboard", icon: LayoutDashboard },
  { name: "Abbonamento", href: "/dashboard/subscription", icon: CreditCard },
  { name: "Pagamenti", href: "/dashboard/payments", icon: Receipt },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <AuthGuard>
      <div className="min-h-[calc(100vh-4rem)]">
        {/* Mobile top nav */}
        <div className="md:hidden border-b border-gray-200 bg-white">
          <div className="flex overflow-x-auto px-4 py-2 gap-1">
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
              <h2 className="text-lg font-bold text-gray-900 mb-4">Il mio account</h2>
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
            <div className="max-w-4xl mx-auto">{children}</div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}

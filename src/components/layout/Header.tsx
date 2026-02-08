"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Menu,
  X,
  Calculator,
  Home,
  ChevronDown,
  User,
  LogIn,
  LogOut,
  Search,
  LayoutDashboard,
  CreditCard,
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: { name: string; href: string }[];
}

const publicNavigation: NavItem[] = [];

const protectedNavigation: NavItem[] = [
  { name: 'OddsMatcher', href: '/oddsmatcher', icon: Search },
  { name: 'Dutcher', href: '/dutcher', icon: Search },
  {
    name: 'Calcolatori',
    href: '#',
    icon: Calculator,
    children: [
      { name: 'Punta-Banca', href: '/calcolatori/punta-banca' },
      { name: 'Punta-Punta', href: '/calcolatori/punta-punta' },
      { name: 'Multiplicatore', href: '/calcolatori/multiplicatore' },
    ]
  },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [calculatorsOpen, setCalculatorsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user menu on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
  };

  const navigation = isAuthenticated
    ? [...publicNavigation, ...protectedNavigation]
    : publicNavigation;

  return (
    <header className="sticky top-0 z-50 bg-brand-primary shadow-lg">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Top">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-brand-accent flex items-center justify-center">
                <span className="text-brand-primary font-bold text-xl">B</span>
              </div>
              <span className="text-white font-bold text-xl hidden sm:block">
                Bet<span className="text-brand-accent">Master</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:gap-x-6">
            {navigation.map((item) => (
              item.children ? (
                <div key={item.name} className="relative">
                  <button
                    onClick={() => setCalculatorsOpen(!calculatorsOpen)}
                    className="flex items-center gap-1 text-gray-300 hover:text-white transition-colors text-sm font-medium"
                  >
                    <item.icon className="w-4 h-4" />
                    {item.name}
                    <ChevronDown className={cn(
                      "w-4 h-4 transition-transform",
                      calculatorsOpen && "rotate-180"
                    )} />
                  </button>

                  {calculatorsOpen && (
                    <div className="absolute top-full left-0 mt-2 w-48 rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 py-1">
                      {item.children.map((child) => (
                        <Link
                          key={child.name}
                          href={child.href}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setCalculatorsOpen(false)}
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center gap-1 text-gray-300 hover:text-white transition-colors text-sm font-medium"
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </Link>
              )
            ))}
          </div>

          {/* Auth Buttons (Desktop) */}
          <div className="hidden md:flex md:items-center md:gap-3">
            {isLoading ? (
              <div className="w-20 h-8 bg-brand-secondary rounded animate-pulse" />
            ) : isAuthenticated && user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors text-sm"
                >
                  <div className="w-8 h-8 rounded-full bg-brand-accent flex items-center justify-center">
                    <span className="text-brand-primary font-bold text-sm">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="hidden lg:block max-w-[120px] truncate">{user.name}</span>
                  <ChevronDown className={cn(
                    "w-4 h-4 transition-transform",
                    userMenuOpen && "rotate-180"
                  )} />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 py-1">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </Link>
                    <Link
                      href="/dashboard/subscription"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <CreditCard className="w-4 h-4" />
                      Abbonamento
                    </Link>
                    {user.is_admin && (
                      <Link
                        href="/admin"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-purple-600 hover:bg-purple-50"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Shield className="w-4 h-4" />
                        Admin
                      </Link>
                    )}
                    <div className="border-t border-gray-100" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4" />
                      Esci
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white">
                    <LogIn className="w-4 h-4 mr-2" />
                    Accedi
                  </Button>
                </Link>
                <Link href="/auth/registrazione">
                  <Button variant="gold" size="sm">
                    <User className="w-4 h-4 mr-2" />
                    Registrati
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              type="button"
              className="text-gray-300 hover:text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">Apri menu</span>
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-brand-secondary">
            <div className="space-y-1">
              {navigation.map((item) => (
                item.children ? (
                  <div key={item.name}>
                    <button
                      onClick={() => setCalculatorsOpen(!calculatorsOpen)}
                      className="w-full flex items-center justify-between px-3 py-2 text-gray-300 hover:text-white hover:bg-brand-secondary rounded-lg"
                    >
                      <span className="flex items-center gap-2">
                        <item.icon className="w-5 h-5" />
                        {item.name}
                      </span>
                      <ChevronDown className={cn(
                        "w-4 h-4 transition-transform",
                        calculatorsOpen && "rotate-180"
                      )} />
                    </button>

                    {calculatorsOpen && (
                      <div className="pl-10 space-y-1 mt-1">
                        {item.children.map((child) => (
                          <Link
                            key={child.name}
                            href={child.href}
                            className="block px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-brand-secondary rounded-lg"
                            onClick={() => {
                              setCalculatorsOpen(false);
                              setMobileMenuOpen(false);
                            }}
                          >
                            {child.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex items-center gap-2 px-3 py-2 text-gray-300 hover:text-white hover:bg-brand-secondary rounded-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                )
              ))}
            </div>

            {/* Mobile Auth */}
            <div className="mt-4 pt-4 border-t border-brand-secondary space-y-2">
              {isLoading ? (
                <div className="w-full h-10 bg-brand-secondary rounded animate-pulse" />
              ) : isAuthenticated && user ? (
                <>
                  <div className="flex items-center gap-3 px-3 py-2 text-gray-300">
                    <div className="w-8 h-8 rounded-full bg-brand-accent flex items-center justify-center flex-shrink-0">
                      <span className="text-brand-primary font-bold text-sm">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{user.name}</p>
                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    </div>
                  </div>
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2 px-3 py-2 text-gray-300 hover:text-white hover:bg-brand-secondary rounded-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Link>
                  <Link
                    href="/dashboard/subscription"
                    className="flex items-center gap-2 px-3 py-2 text-gray-300 hover:text-white hover:bg-brand-secondary rounded-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <CreditCard className="w-4 h-4" />
                    Abbonamento
                  </Link>
                  {user.is_admin && (
                    <Link
                      href="/admin"
                      className="flex items-center gap-2 px-3 py-2 text-purple-300 hover:text-white hover:bg-brand-secondary rounded-lg"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Shield className="w-4 h-4" />
                      Admin
                    </Link>
                  )}
                  <Button
                    variant="ghost"
                    className="w-full text-red-400 hover:text-red-300 justify-start"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Esci
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full text-gray-300 justify-start">
                      <LogIn className="w-4 h-4 mr-2" />
                      Accedi
                    </Button>
                  </Link>
                  <Link href="/auth/registrazione" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="gold" className="w-full justify-start">
                      <User className="w-4 h-4 mr-2" />
                      Registrati
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}

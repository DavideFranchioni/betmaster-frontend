"use client";

import Link from "next/link";
import { Calculator, TrendingUp, Shield, Zap, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Search,
    title: "OddsMatcher",
    description: "Trova le migliori opportunità di matched betting in tempo reale.",
  },
  {
    icon: Calculator,
    title: "Calcolatori Precisi",
    description: "Formule matematiche accurate per calcolare stake ottimali e profitti garantiti.",
  },
  {
    icon: TrendingUp,
    title: "Massimizza i Profitti",
    description: "Ottimizza ogni operazione con calcoli istantanei e rating di convenienza.",
  },
  {
    icon: Shield,
    title: "Rischio Controllato",
    description: "Visualizza sempre responsabilità e scenari possibili prima di piazzare le scommesse.",
  },
];

const calculators = [
  {
    name: "OddsMatcher",
    description: "Trova le migliori quote confrontando bookmaker ed exchange in tempo reale.",
    href: "/oddsmatcher",
    status: "available",
    highlight: true,
  },
  {
    name: "Punta-Banca",
    description: "Calcola l'importo ottimale da bancare sull'exchange per coprire la puntata sul bookmaker.",
    href: "/calcolatori/punta-banca",
    status: "available",
  },
  {
    name: "Punta-Punta",
    description: "Calcola gli importi da puntare su più esiti (2-5) per coprire le scommesse su bookmaker diversi.",
    href: "/calcolatori/punta-punta",
    status: "available",
  },
  {
    name: "Multiplicatore",
    description: "Calcola le coperture per scommesse multiple (2-5 partite) con scenari dettagliati.",
    href: "/calcolatori/multiplicatore",
    status: "available",
  },
];

export default function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="gradient-premium text-white py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-brand-accent/20 text-brand-accent px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Zap className="w-4 h-4" />
              Strumenti Professionali per Match Betting
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-balance">
              Calcola. Analizza.
              <span className="text-brand-accent"> Guadagna.</span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              BetMaster ti offre calcolatori professionali per il match betting. 
              Ottimizza ogni operazione con calcoli precisi e interfacce intuitive.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="gold" size="lg" asChild>
                <Link href="/calcolatori/punta-banca">
                  <Calculator className="w-5 h-5 mr-2" />
                  Inizia a Calcolare
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-white/20 text-white hover:bg-white/10"
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Scopri di più
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Perché scegliere BetMaster?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Strumenti pensati per chi fa match betting seriamente
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="card-hover">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-brand-accent/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="w-6 h-6 text-brand-accent" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Calculators List */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              I Nostri Strumenti
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Strumenti professionali per ogni tipo di operazione
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {calculators.map((calc) => (
              <Card key={calc.name} className={`card-hover ${calc.status === 'coming' ? 'opacity-60' : ''} ${(calc as any).highlight ? 'ring-2 ring-brand-accent' : ''}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-10 h-10 ${(calc as any).highlight ? 'bg-brand-accent' : 'bg-brand-primary'} rounded-lg flex items-center justify-center`}>
                      {(calc as any).highlight ? (
                        <Search className="w-5 h-5 text-brand-primary" />
                      ) : (
                        <Calculator className="w-5 h-5 text-brand-accent" />
                      )}
                    </div>
                    {(calc as any).highlight && (
                      <span className="text-xs font-medium bg-brand-accent text-brand-primary px-2 py-1 rounded-full">
                        Nuovo
                      </span>
                    )}
                    {calc.status === 'coming' && (
                      <span className="text-xs font-medium bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                        Prossimamente
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {calc.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {calc.description}
                  </p>
                  {calc.status === 'available' ? (
                    <Button variant={(calc as any).highlight ? 'gold' : 'default'} className="w-full" asChild>
                      <Link href={calc.href}>
                        {(calc as any).highlight ? 'Apri OddsMatcher' : 'Apri Calcolatore'}
                      </Link>
                    </Button>
                  ) : (
                    <Button variant="outline" className="w-full" disabled>
                      In arrivo
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Card className="gradient-premium text-white overflow-hidden">
            <CardContent className="p-8 md:p-12 text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                Pronto a iniziare?
              </h2>
              <p className="text-gray-300 mb-6 max-w-xl mx-auto">
                Usa subito i nostri strumenti per le tue operazioni di match betting. 
                Gratuiti, veloci e precisi.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="gold" size="lg" asChild>
                  <Link href="/oddsmatcher">
                    <Search className="w-5 h-5 mr-2" />
                    OddsMatcher
                  </Link>
                </Button>
                <Button variant="outline" size="lg" className="border-white/20 text-white hover:bg-white/10" asChild>
                  <Link href="/calcolatori/punta-banca">
                    Punta-Banca
                  </Link>
                </Button>
                <Button variant="outline" size="lg" className="border-white/20 text-white hover:bg-white/10" asChild>
                  <Link href="/calcolatori/multiplicatore">
                    Multiplicatore
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

import React from "react";
import Link from "next/link";
import { Calculator, Mail, Github } from "lucide-react";

const footerLinks = {
  calcolatori: [
    { name: 'Punta-Banca', href: '/calcolatori/punta-banca' },
    { name: 'Punta-Punta', href: '/calcolatori/punta-punta' },
    { name: 'Multiplicatore', href: '/calcolatori/multiplicatore' },
  ],
  risorse: [
    { name: 'Guida Match Betting', href: '#' },
    { name: 'FAQ', href: '#' },
    { name: 'Blog', href: '#' },
  ],
  legale: [
    { name: 'Privacy Policy', href: '#' },
    { name: 'Termini di Servizio', href: '#' },
    { name: 'Cookie Policy', href: '#' },
  ],
};

export function Footer() {
  return (
    <footer className="bg-brand-primary text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-brand-accent flex items-center justify-center">
                <span className="text-brand-primary font-bold text-xl">B</span>
              </div>
              <span className="font-bold text-xl">
                Bet<span className="text-brand-accent">Master</span>
              </span>
            </Link>
            <p className="mt-4 text-sm text-gray-400">
              Strumenti professionali per il match betting. 
              Calcola, analizza e massimizza i tuoi profitti.
            </p>
          </div>

          {/* Calcolatori */}
          <div>
            <h3 className="text-sm font-semibold text-brand-accent uppercase tracking-wider">
              Calcolatori
            </h3>
            <ul className="mt-4 space-y-2">
              {footerLinks.calcolatori.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Risorse */}
          <div>
            <h3 className="text-sm font-semibold text-brand-accent uppercase tracking-wider">
              Risorse
            </h3>
            <ul className="mt-4 space-y-2">
              {footerLinks.risorse.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legale */}
          <div>
            <h3 className="text-sm font-semibold text-brand-accent uppercase tracking-wider">
              Legale
            </h3>
            <ul className="mt-4 space-y-2">
              {footerLinks.legale.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-brand-secondary flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} BetMaster. Tutti i diritti riservati.
          </p>
          <div className="flex items-center gap-4">
            <a 
              href="mailto:info@betmaster.it" 
              className="text-gray-400 hover:text-brand-accent transition-colors"
            >
              <Mail className="w-5 h-5" />
            </a>
            <a 
              href="#" 
              className="text-gray-400 hover:text-brand-accent transition-colors"
            >
              <Github className="w-5 h-5" />
            </a>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 p-4 bg-brand-secondary/50 rounded-lg">
          <p className="text-xs text-gray-400 text-center">
            <strong>Disclaimer:</strong> Il gioco d&apos;azzardo può causare dipendenza. Gioca responsabilmente.
            BetMaster fornisce strumenti di calcolo e non promuove il gioco d&apos;azzardo. 
            I contenuti sono puramente informativi e matematici.
          </p>
        </div>
      </div>
    </footer>
  );
}

import type { Metadata } from "next";
import { PuntaBancaCalculator } from "@/components/calculators/PuntaBancaCalculator";
import { AuthGuard } from "@/components/shared/AuthGuard";
import { SubscriptionGuard } from "@/components/shared/SubscriptionGuard";

export const metadata: Metadata = {
  title: "Calcolatore Punta-Banca",
  description: "Calcola l'importo ottimale da bancare sull'exchange per coprire la tua puntata sul bookmaker. Supporta modalità Normale, RiskFree e Bonus.",
  keywords: ["calcolatore punta banca", "matched betting calculator", "lay calculator", "betfair calculator"],
};

export default function PuntaBancaPage() {
  return (
    <AuthGuard>
      <SubscriptionGuard>
        <div className="py-8 md:py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <PuntaBancaCalculator />
          </div>
        </div>
      </SubscriptionGuard>
    </AuthGuard>
  );
}

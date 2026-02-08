import type { Metadata } from "next";
import { PuntaPuntaCalculator } from "@/components/calculators/PuntaPuntaCalculator";
import { AuthGuard } from "@/components/shared/AuthGuard";
import { SubscriptionGuard } from "@/components/shared/SubscriptionGuard";

export const metadata: Metadata = {
  title: "Calcolatore Punta-Punta",
  description: "Calcola gli importi da puntare su più esiti per coprire le scommesse su bookmaker diversi. Supporta da 2 a 5 esiti con modalità Normale, RiskFree e Bonus.",
  keywords: ["calcolatore punta punta", "dutching calculator", "matched betting", "surebet calculator"],
};

export default function PuntaPuntaPage() {
  return (
    <AuthGuard>
      <SubscriptionGuard>
        <div className="py-8 md:py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <PuntaPuntaCalculator />
          </div>
        </div>
      </SubscriptionGuard>
    </AuthGuard>
  );
}

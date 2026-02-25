import type { Metadata } from "next";
import { MultiplicatoreCoperturCalculator } from "@/components/calculators/MultiplicatoreCoperturCalculator";
import { AuthGuard } from "@/components/shared/AuthGuard";
import { SubscriptionGuard } from "@/components/shared/SubscriptionGuard";

export const metadata: Metadata = {
  title: "Calcolatore Multiplicatore Coperture",
  description: "Calcola le coperture dutching per scommesse multiple (2-5 partite). Supporta 2 o 3 esiti per partita, maggiorazione quote, modalità Normale, RF e BR.",
  keywords: ["calcolatore multipla", "multiplicatore coperture", "dutching", "matched betting", "copertura multipla"],
};

export default function MultiplicatoreCopertPage() {
  return (
    <AuthGuard>
      <SubscriptionGuard>
        <div className="py-8 md:py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <MultiplicatoreCoperturCalculator />
          </div>
        </div>
      </SubscriptionGuard>
    </AuthGuard>
  );
}

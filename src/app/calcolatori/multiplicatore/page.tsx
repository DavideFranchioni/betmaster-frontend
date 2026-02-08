import type { Metadata } from "next";
import { MultiplicatoreCalculator } from "@/components/calculators/MultiplicatoreCalculator";
import { AuthGuard } from "@/components/shared/AuthGuard";
import { SubscriptionGuard } from "@/components/shared/SubscriptionGuard";

export const metadata: Metadata = {
  title: "Calcolatore Multiplicatore",
  description: "Calcola le coperture per scommesse multiple (2-5 partite). Supporta copertura Banca e Punta2, maggiorazione quote, modalità Normale, RF e BR.",
  keywords: ["calcolatore multipla", "multiplicatore", "matched betting", "multiple calculator", "copertura multipla"],
};

export default function MultiplicatorePage() {
  return (
    <AuthGuard>
      <SubscriptionGuard>
        <div className="py-8 md:py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <MultiplicatoreCalculator />
          </div>
        </div>
      </SubscriptionGuard>
    </AuthGuard>
  );
}

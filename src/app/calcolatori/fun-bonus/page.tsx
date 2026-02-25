import type { Metadata } from "next";
import { FunBonusCalculator } from "@/components/calculators/FunBonusCalculator";
import { AuthGuard } from "@/components/shared/AuthGuard";
import { SubscriptionGuard } from "@/components/shared/SubscriptionGuard";

export const metadata: Metadata = {
  title: "Calcolatore Fun Bonus",
  description: "Calcola quando passare dalla fase Big Win alla fase Rollover per convertire i fun bonus slot in modo ottimale.",
  keywords: ["calcolatore fun bonus", "fun bonus calculator", "slot bonus rollover", "conversione bonus"],
};

export default function FunBonusPage() {
  return (
    <AuthGuard>
      <SubscriptionGuard>
        <div className="py-8 md:py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <FunBonusCalculator />
          </div>
        </div>
      </SubscriptionGuard>
    </AuthGuard>
  );
}

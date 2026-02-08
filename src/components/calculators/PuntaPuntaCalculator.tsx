"use client";

import React, { useState, useMemo } from "react";
import { 
  Calculator, 
  Plus,
  Minus,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  calculatePuntaPunta, 
  roundTo,
  type PuntaPuntaInput,
  type PuntaPuntaResult,
} from "@/lib/calculators/punta-punta";
import { 
  parseNumericInput, 
  cn 
} from "@/lib/utils";
import type { BetMode } from "@/types/calculator";

export function PuntaPuntaCalculator() {
  // State per gli input
  const [mode, setMode] = useState<BetMode>('normale');
  const [numOutcomes, setNumOutcomes] = useState<number>(2);
  const [backStake, setBackStake] = useState<string>('100');
  const [backRefundStake, setBackRefundStake] = useState<string>('100');
  const [odds, setOdds] = useState<string[]>(['0.00', '0.00', '0.00', '0.00', '0.00']);

  // Handler per modificare le quote
  const handleOddsChange = (index: number, value: string) => {
    const newOdds = [...odds];
    newOdds[index] = value.replace(',', '.');
    setOdds(newOdds);
  };

  // Handler per aumentare/diminuire numero esiti
  const handleNumOutcomesChange = (delta: number) => {
    const newNum = Math.min(5, Math.max(2, numOutcomes + delta));
    setNumOutcomes(newNum);
  };

  // Handler input con sostituzione virgola
  const handleInputChange = (setter: (value: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value.replace(',', '.'));
  };

  // Parse degli input
  const parsedInput: PuntaPuntaInput = useMemo(() => ({
    mode,
    numOutcomes,
    backStake: parseNumericInput(backStake),
    backOdds: odds.map(o => parseNumericInput(o)),
    backRefundStake: parseNumericInput(backRefundStake),
  }), [mode, numOutcomes, backStake, odds, backRefundStake]);

  // Calcolo risultati
  const result: PuntaPuntaResult = useMemo(() => {
    return calculatePuntaPunta(parsedInput);
  }, [parsedInput]);

  // Formatta profitto con colore
  const ProfitDisplay = ({ value, size = 'default' }: { value: number; size?: 'default' | 'large' }) => {
    const isPositive = value >= 0;
    const formattedValue = isPositive ? `+€${roundTo(Math.abs(value), 2)}` : `-€${roundTo(Math.abs(value), 2)}`;
    return (
      <span className={cn(
        "font-bold",
        isPositive ? "text-profit" : "text-loss",
        size === 'large' ? "text-xl md:text-2xl" : "text-sm"
      )}>
        {formattedValue}
      </span>
    );
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 text-brand-accent mb-2">
          <Calculator className="w-6 h-6" />
          <span className="text-sm font-medium uppercase tracking-wider">Calcolatore</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Punta-Punta
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          Calcola gli importi per coprire più esiti su bookmaker diversi
        </p>
      </div>

      {/* Selezione Modalità */}
      <Card>
        <CardContent className="p-4">
          <Tabs value={mode} onValueChange={(v) => setMode(v as BetMode)}>
            <TabsList className="w-full grid grid-cols-3 h-14">
              <TabsTrigger value="normale" className="text-xs md:text-sm font-semibold">
                <div className="flex flex-col items-center gap-0.5">
                  <span>NORMALE</span>
                  <span className="text-[10px] font-normal opacity-70 hidden md:inline">Soldi Reali</span>
                </div>
              </TabsTrigger>
              <TabsTrigger value="riskfree" variant="gold" className="text-xs md:text-sm font-semibold">
                <div className="flex flex-col items-center gap-0.5">
                  <span>RISKFREE</span>
                  <span className="text-[10px] font-normal opacity-70 hidden md:inline">Rimborso/FreeBet</span>
                </div>
              </TabsTrigger>
              <TabsTrigger value="bonus" variant="gold" className="text-xs md:text-sm font-semibold">
                <div className="flex flex-col items-center gap-0.5">
                  <span>BONUS</span>
                  <span className="text-[10px] font-normal opacity-70 hidden md:inline">Soldi Bonus</span>
                </div>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {/* Numero Esiti */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Numero Esiti</label>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => handleNumOutcomesChange(-1)}
                disabled={numOutcomes <= 2}
                className="h-8 w-8"
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="text-xl font-bold w-8 text-center">{numOutcomes}</span>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => handleNumOutcomesChange(1)}
                disabled={numOutcomes >= 5}
                className="h-8 w-8"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sezione PUNTA 1 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-back">
            <div className="w-3 h-3 rounded-full bg-back" />
            PUNTA 1 (Bookmaker principale)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Importo Puntata
              </label>
              <Input
                type="text"
                inputMode="decimal"
                prefix="€"
                value={backStake}
                onChange={handleInputChange(setBackStake)}
                placeholder="100"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Quota Punta 1
              </label>
              <Input
                type="text"
                inputMode="decimal"
                value={odds[0]}
                onChange={(e) => handleOddsChange(0, e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>
          
          {/* Campo Rimborso (solo RF) */}
          {mode === 'riskfree' && (
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <label className="text-sm font-medium text-gray-700">
                Importo Bonus Rimborso
              </label>
              <Input
                type="text"
                inputMode="decimal"
                prefix="€"
                value={backRefundStake}
                onChange={handleInputChange(setBackRefundStake)}
                placeholder="100"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quote altri esiti */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-back">
            <div className="w-3 h-3 rounded-full bg-back" />
            Quote Altri Esiti
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: numOutcomes - 1 }, (_, i) => i + 1).map((index) => (
            <div key={index} className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700 w-24">
                Punta {index + 1}
              </label>
              <Input
                type="text"
                inputMode="decimal"
                value={odds[index]}
                onChange={(e) => handleOddsChange(index, e.target.value)}
                placeholder="0.00"
                className="flex-1"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Risultati - Importi da Puntare */}
      <Card variant="elevated" className="overflow-hidden">
        <div className="space-y-0">
          {Array.from({ length: numOutcomes }, (_, i) => (
            <div 
              key={i}
              className="bg-back p-3 text-white border-b border-back-dark last:border-b-0"
            >
              <div className="flex items-center justify-center gap-2 text-center">
                <span className="font-medium">PUNTA{i + 1}</span>
                <span className="text-lg md:text-xl font-bold bg-white/20 px-3 py-1 rounded-lg">
                  €{result.stakes[i]}
                </span>
                <span className="font-medium">A QUOTA</span>
                <span className="text-lg md:text-xl font-bold bg-white/20 px-3 py-1 rounded-lg">
                  {odds[i]}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Profitti */}
        <div className="p-4 text-center bg-gradient-to-b from-gray-50 to-white">
          <div className="text-gray-500 text-sm mb-2">GUADAGNERAI</div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {result.profits.slice(0, numOutcomes).map((profit, i) => (
              <React.Fragment key={i}>
                <ProfitDisplay value={profit} size="large" />
                {i < numOutcomes - 1 && <span className="text-gray-400">oppure</span>}
              </React.Fragment>
            ))}
          </div>
          <div className="mt-3 text-sm text-gray-600">
            [ {mode === 'riskfree' ? 'RF' : 'RATING'}:{' '}
            {result.ratings.slice(0, numOutcomes).map((rating, i) => (
              <React.Fragment key={i}>
                <span className="font-semibold">{rating}%</span>
                {i < numOutcomes - 1 && ' oppure '}
              </React.Fragment>
            ))}
            {' ]'}
          </div>
        </div>
      </Card>

      {/* Dettaglio Scenari */}
      <Card>
        <CardContent className="p-0">
          {/* Header */}
          <div className={cn(
            "grid text-center text-xs font-medium text-gray-500 border-b py-3 px-2",
            `grid-cols-${numOutcomes + 2}`
          )} style={{ gridTemplateColumns: `repeat(${numOutcomes + 2}, minmax(0, 1fr))` }}>
            <div></div>
            {Array.from({ length: numOutcomes }, (_, i) => (
              <div key={i}>BOOK{i + 1}</div>
            ))}
            <div>TOT</div>
          </div>
          
          {/* Righe per ogni scenario */}
          {result.details.slice(0, numOutcomes).map((detail, scenarioIndex) => (
            <div 
              key={scenarioIndex}
              className={cn(
                "grid items-center text-center py-3 px-2",
                scenarioIndex < numOutcomes - 1 && "border-b"
              )}
              style={{ gridTemplateColumns: `repeat(${numOutcomes + 2}, minmax(0, 1fr))` }}
            >
              <div className="flex items-center justify-center gap-1">
                <TrendingUp className="w-3 h-3 text-back" />
                <span className="text-xs font-medium text-back">P{scenarioIndex + 1} Vince</span>
              </div>
              {detail.bookieAmounts.slice(0, numOutcomes).map((amount, bookieIndex) => (
                <ProfitDisplay key={bookieIndex} value={amount} />
              ))}
              <ProfitDisplay value={detail.totalProfit} />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Note informative */}
      <div className="text-center text-xs text-gray-400 space-y-1">
        <p>
          <strong>NORMALE:</strong> Soldi reali → il guadagno mostrato sarà negativo (perdita su qualifying)
        </p>
        <p>
          <strong>BONUS:</strong> Soldi bonus → il guadagno mostrato sarà positivo
        </p>
        <p>
          <strong>RISKFREE:</strong> Rimborso/FreeBet → inserisci anche l&apos;importo del rimborso
        </p>
      </div>
    </div>
  );
}

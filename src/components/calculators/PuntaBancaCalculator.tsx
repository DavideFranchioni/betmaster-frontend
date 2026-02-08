"use client";

import React, { useState, useCallback, useMemo } from "react";
import { 
  Calculator, 
  Copy, 
  Check, 
  ChevronDown, 
  ChevronUp,
  TrendingUp,
  TrendingDown,
  Info
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  calculatePuntaBanca, 
  calculateUnmatchedBet,
  roundTo 
} from "@/lib/calculators/punta-banca";
import { 
  parseNumericInput, 
  formatSignedNumber, 
  copyToClipboard,
  cn 
} from "@/lib/utils";
import type { BetMode, CalculatorInput, CalculatorResult, UnmatchedResult } from "@/types/calculator";

export function PuntaBancaCalculator() {
  // State per gli input
  const [mode, setMode] = useState<BetMode>('normale');
  const [backStake, setBackStake] = useState<string>('100');
  const [backOdds, setBackOdds] = useState<string>('2.00');
  const [layOdds, setLayOdds] = useState<string>('2.05');
  // IMPORTANTE: La commissione è in formato decimale come NinjaBet (0.05 = 5%)
  const [layCommission, setLayCommission] = useState<string>('0.05');
  const [backRefundStake, setBackRefundStake] = useState<string>('100');
  
  // State per bancata non abbinata
  const [unmatchedOpen, setUnmatchedOpen] = useState(false);
  const [matched, setMatched] = useState<string>('0');
  const [newOdds, setNewOdds] = useState<string>('0.00');
  const [newCommission, setNewCommission] = useState<string>('0.05');
  
  // State per UI
  const [copied, setCopied] = useState(false);

  // Parse degli input - la commissione è già in decimale (0.05 = 5%)
  const parsedInput: CalculatorInput = useMemo(() => ({
    mode,
    backStake: parseNumericInput(backStake),
    backOdds: parseNumericInput(backOdds),
    layOdds: parseNumericInput(layOdds),
    layCommission: parseNumericInput(layCommission), // GIÀ in decimale, non dividiamo per 100
    backRefundStake: parseNumericInput(backRefundStake),
  }), [mode, backStake, backOdds, layOdds, layCommission, backRefundStake]);

  // Calcolo risultati
  const result: CalculatorResult = useMemo(() => {
    return calculatePuntaBanca(parsedInput);
  }, [parsedInput]);

  // Calcolo bancata non abbinata
  // NOTA: Ora permette anche matched > layStake (come NinjaBet originale)
  const unmatchedResult: UnmatchedResult | null = useMemo(() => {
    if (!unmatchedOpen) return null;
    const matchedValue = parseNumericInput(matched);
    const newOddsValue = parseNumericInput(newOdds);
    
    // Controllo solo che ci siano valori validi
    if (newOddsValue <= 0) return null;
    
    return calculateUnmatchedBet(parsedInput, result, {
      matched: matchedValue,
      newOdds: newOddsValue,
      newCommission: parseNumericInput(newCommission), // GIÀ in decimale
    });
  }, [unmatchedOpen, matched, newOdds, newCommission, parsedInput, result]);

  // Handler per copia
  const handleCopy = useCallback(async (value: string) => {
    const success = await copyToClipboard(value);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, []);

  // Handler input con sostituzione virgola
  const handleInputChange = (setter: (value: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value.replace(',', '.'));
  };

  // Formatta profitto con colore
  const ProfitDisplay = ({ value, size = 'default' }: { value: number; size?: 'default' | 'large' }) => {
    const isPositive = value >= 0;
    return (
      <span className={cn(
        "font-bold",
        isPositive ? "text-profit" : "text-loss",
        size === 'large' ? "text-2xl md:text-3xl" : "text-base"
      )}>
        {formatSignedNumber(value)}
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
          Punta-Banca
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          Calcola l&apos;importo ottimale da bancare sull&apos;exchange
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

      {/* Sezione PUNTA */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-back">
            <div className="w-3 h-3 rounded-full bg-back" />
            PUNTA (Bookmaker)
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
                Quota Punta
              </label>
              <Input
                type="text"
                inputMode="decimal"
                value={backOdds}
                onChange={handleInputChange(setBackOdds)}
                placeholder="2.00"
              />
            </div>
          </div>
          
          {/* Campo Rimborso (solo RF) */}
          {mode === 'riskfree' && (
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                Importo Bonus Rimborso
                <Info className="w-4 h-4 text-gray-400" />
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

      {/* Sezione BANCA */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lay">
            <div className="w-3 h-3 rounded-full bg-lay" />
            BANCA (Exchange)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Quota Banca
              </label>
              <Input
                type="text"
                inputMode="decimal"
                value={layOdds}
                onChange={handleInputChange(setLayOdds)}
                placeholder="2.05"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Commissione
              </label>
              <Input
                type="text"
                inputMode="decimal"
                suffix="%"
                value={layCommission}
                onChange={handleInputChange(setLayCommission)}
                placeholder="0.05"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risultati Principali */}
      <Card variant="elevated" className="overflow-hidden">
        {/* Istruzione PUNTA */}
        <div className="bg-back p-4 text-white">
          <div className="flex flex-col md:flex-row items-center justify-center gap-2 text-center">
            <span className="font-medium">PUNTA</span>
            <span className="text-xl md:text-2xl font-bold bg-white/20 px-3 py-1 rounded-lg">
              €{roundTo(parsedInput.backStake, 2)}
            </span>
            <span className="font-medium">A QUOTA</span>
            <span className="text-xl md:text-2xl font-bold bg-white/20 px-3 py-1 rounded-lg">
              {roundTo(parsedInput.backOdds, 2)}
            </span>
          </div>
        </div>

        {/* Istruzione BANCA */}
        <div className="bg-lay p-4 text-white">
          <div className="flex flex-col md:flex-row items-center justify-center gap-2 text-center">
            <span className="font-medium">BANCA</span>
            <button 
              onClick={() => handleCopy(result.layStake.toFixed(2))}
              className="flex items-center gap-1 text-xl md:text-2xl font-bold bg-white/20 px-3 py-1 rounded-lg hover:bg-white/30 transition-colors"
            >
              €{roundTo(result.layStake, 2)}
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
            <span className="font-medium">A QUOTA</span>
            <span className="text-xl md:text-2xl font-bold bg-white/20 px-3 py-1 rounded-lg">
              {roundTo(parsedInput.layOdds, 2)}
            </span>
          </div>
          <div className="text-center mt-2 text-white/90 text-sm">
            LA RESPONSABILITÀ SARÀ <span className="font-bold">€{roundTo(result.liability, 2)}</span>
          </div>
        </div>

        {/* Profitto */}
        <div className="p-6 text-center bg-gradient-to-b from-gray-50 to-white">
          <div className="text-gray-500 text-sm mb-1">GUADAGNERAI</div>
          <ProfitDisplay value={result.profit} size="large" />
          <div className="mt-2 inline-flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full">
            <span className="text-sm text-gray-600">
              {mode === 'riskfree' ? 'RF' : 'RATING'}
            </span>
            <span className={cn(
              "font-bold text-sm",
              result.rating >= 100 ? "text-profit" : result.rating >= 70 ? "text-amber-600" : "text-gray-600"
            )}>
              {result.rating}%
            </span>
          </div>
        </div>
      </Card>

      {/* Dettaglio Scenari */}
      <Card>
        <CardContent className="p-0">
          <div className="grid grid-cols-4 text-center text-xs font-medium text-gray-500 border-b py-3 px-2">
            <div></div>
            <div>BOOKMAKER</div>
            <div>EXCHANGE</div>
            <div>TOTALE</div>
          </div>
          
          {/* Se vince PUNTA */}
          <div className="grid grid-cols-4 items-center text-center py-3 px-2 border-b">
            <div className="flex items-center justify-center gap-1">
              <TrendingUp className="w-4 h-4 text-back" />
              <span className="text-xs md:text-sm font-medium text-back">Vince Punta</span>
            </div>
            <ProfitDisplay value={result.backWin.bookieAmount} />
            <ProfitDisplay value={result.backWin.exchangeAmount} />
            <ProfitDisplay value={result.backWin.total} />
          </div>
          
          {/* Se vince BANCA */}
          <div className="grid grid-cols-4 items-center text-center py-3 px-2">
            <div className="flex items-center justify-center gap-1">
              <TrendingDown className="w-4 h-4 text-lay" />
              <span className="text-xs md:text-sm font-medium text-lay">Vince Banca</span>
            </div>
            <ProfitDisplay value={result.layWin.bookieAmount} />
            <ProfitDisplay value={result.layWin.exchangeAmount} />
            <ProfitDisplay value={result.layWin.total} />
          </div>
        </CardContent>
      </Card>

      {/* Bancata Non Abbinata */}
      <Collapsible open={unmatchedOpen} onOpenChange={setUnmatchedOpen}>
        <Card>
          <CollapsibleTrigger className="w-full p-4 flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors rounded-xl">
            <span className="text-sm font-medium">Bancata non abbinata?</span>
            {unmatchedOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Abbinata
                  </label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    prefix="€"
                    value={matched}
                    onChange={handleInputChange(setMatched)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Nuova Quota
                  </label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={newOdds}
                    onChange={handleInputChange(setNewOdds)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Commissione
                  </label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    suffix="%"
                    value={newCommission}
                    onChange={handleInputChange(setNewCommission)}
                    placeholder="0.05"
                  />
                </div>
              </div>

              {unmatchedResult && (
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex flex-col md:flex-row items-center justify-center gap-2 text-center">
                    <span className="font-medium text-gray-700">BANCA</span>
                    <button 
                      onClick={() => handleCopy(unmatchedResult.newLayStake.toFixed(2))}
                      className="flex items-center gap-1 font-bold bg-lay/10 text-lay px-3 py-1 rounded-lg hover:bg-lay/20 transition-colors"
                    >
                      €{unmatchedResult.newLayStake}
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <span className="font-medium text-gray-700">A QUOTA</span>
                    <span className="font-bold bg-gray-200 px-3 py-1 rounded-lg">
                      {parseNumericInput(newOdds)}
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-6 text-sm">
                    <span>
                      Guadagno: <span className={cn(
                        "font-bold",
                        unmatchedResult.newProfit >= 0 ? "text-profit" : "text-loss"
                      )}>
                        {unmatchedResult.newProfit}€
                      </span>
                    </span>
                    <span>
                      {mode === 'riskfree' ? 'Rat/RF' : 'Rat/RF'}: <span className="font-bold">{unmatchedResult.newRating}%</span>
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

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

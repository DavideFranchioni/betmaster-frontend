"use client";

import React, { useState, useMemo } from "react";
import { Calculator, Info, CheckCircle, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { calculateFunBonus } from "@/lib/calculators/fun-bonus";
import { parseNumericInput, cn } from "@/lib/utils";

const RTP_PRESETS = [92, 95, 96, 97];

export function FunBonusCalculator() {
  // State per gli input
  const [bonus, setBonus] = useState<string>("200");
  const [cap, setCap] = useState<string>("1");
  const [rollover, setRollover] = useState<string>("40");
  const [rtp, setRtp] = useState<string>("95");
  const [saldo, setSaldo] = useState<string>("200");
  const [saldoGiocatoPerc, setSaldoGiocatoPerc] = useState<string>("90");
  const [altaVarianza, setAltaVarianza] = useState(true);

  // State per tooltip
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  // Parse degli input
  const result = useMemo(() => {
    return calculateFunBonus({
      bonus: parseNumericInput(bonus),
      cap: parseNumericInput(cap),
      rollover: parseNumericInput(rollover),
      rtp: parseNumericInput(rtp),
      saldo: parseNumericInput(saldo),
      saldoGiocatoPerc: parseNumericInput(saldoGiocatoPerc),
      altaVarianza,
    });
  }, [bonus, cap, rollover, rtp, saldo, saldoGiocatoPerc, altaVarianza]);

  // Handler input con sostituzione virgola
  const handleInputChange =
    (setter: (value: string) => void) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setter(e.target.value.replace(",", "."));
    };

  // Percentuale rollover completata
  const rolloverPerc = parseNumericInput(saldoGiocatoPerc);

  const toggleTooltip = (id: string) => {
    setActiveTooltip(activeTooltip === id ? null : id);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 text-brand-accent mb-2">
          <Calculator className="w-6 h-6" />
          <span className="text-sm font-medium uppercase tracking-wider">
            Calcolatore
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Fun Bonus
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          Calcola quando passare dalla fase Big Win alla fase Rollover
        </p>
      </div>

      {/* Input Bonus e CAP */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Parametri Bonus
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                Importo del Bonus
                <button
                  type="button"
                  onClick={() => toggleTooltip("bonus")}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              </label>
              {activeTooltip === "bonus" && (
                <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                  L&apos;importo del fun bonus ricevuto dal bookmaker
                </p>
              )}
              <Input
                type="text"
                inputMode="decimal"
                prefix="€"
                value={bonus}
                onChange={handleInputChange(setBonus)}
                placeholder="200"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                CAP
                <button
                  type="button"
                  onClick={() => toggleTooltip("cap")}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              </label>
              {activeTooltip === "cap" && (
                <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                  Moltiplicatore massimo di prelievo (1x = bonus, 2x = 2 volte
                  il bonus, ecc.)
                </p>
              )}
              <Input
                type="text"
                inputMode="decimal"
                suffix="x"
                value={cap}
                onChange={handleInputChange(setCap)}
                placeholder="1"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                Numero Rollover
                <button
                  type="button"
                  onClick={() => toggleTooltip("rollover")}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              </label>
              {activeTooltip === "rollover" && (
                <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                  Quante volte devi giocare il bonus prima di poter prelevare
                  (es. 40x = 40 volte)
                </p>
              )}
              <Input
                type="text"
                inputMode="decimal"
                suffix="x"
                value={rollover}
                onChange={handleInputChange(setRollover)}
                placeholder="40"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                RTP Slot
                <button
                  type="button"
                  onClick={() => toggleTooltip("rtp")}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              </label>
              {activeTooltip === "rtp" && (
                <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                  Return To Player: percentuale media di ritorno della slot
                  scelta
                </p>
              )}
              <Input
                type="text"
                inputMode="decimal"
                suffix="%"
                value={rtp}
                onChange={handleInputChange(setRtp)}
                placeholder="95"
              />
              <div className="flex gap-1.5 flex-wrap">
                {RTP_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setRtp(String(preset))}
                    className={cn(
                      "px-2.5 py-1 text-xs rounded-full border transition-colors",
                      parseNumericInput(rtp) === preset
                        ? "bg-brand-accent text-brand-primary border-brand-accent font-semibold"
                        : "bg-white text-gray-600 border-gray-200 hover:border-brand-accent hover:text-brand-accent"
                    )}
                  >
                    {preset}%
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stato Attuale */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Stato Attuale
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                Saldo Attuale
                <button
                  type="button"
                  onClick={() => toggleTooltip("saldo")}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              </label>
              {activeTooltip === "saldo" && (
                <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                  Il tuo saldo corrente sul bookmaker
                </p>
              )}
              <Input
                type="text"
                inputMode="decimal"
                prefix="€"
                value={saldo}
                onChange={handleInputChange(setSaldo)}
                placeholder="200"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                Saldo Giocato
                <button
                  type="button"
                  onClick={() => toggleTooltip("giocato")}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              </label>
              {activeTooltip === "giocato" && (
                <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                  Percentuale del rollover totale gi&agrave; completata
                </p>
              )}
              <Input
                type="text"
                inputMode="decimal"
                suffix="%"
                value={saldoGiocatoPerc}
                onChange={handleInputChange(setSaldoGiocatoPerc)}
                placeholder="90"
              />
            </div>
          </div>

          {/* Barra di progresso rollover */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Progresso Rollover</span>
              <span className="font-semibold text-gray-700">
                {Math.min(rolloverPerc, 100).toFixed(0)}%
              </span>
            </div>
            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-300",
                  rolloverPerc >= 100
                    ? "bg-profit"
                    : rolloverPerc >= 70
                      ? "bg-brand-accent"
                      : "bg-amber-400"
                )}
                style={{ width: `${Math.min(rolloverPerc, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>
                €{result.giocatoTotale - result.giocatoRimanente > 0 ? (result.giocatoTotale - result.giocatoRimanente).toFixed(0) : "0"} giocati
              </span>
              <span>€{result.giocatoTotale.toFixed(0)} totale</span>
            </div>
          </div>

          {/* Toggle Slot Alta Varianza */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div>
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                Slot Alta Varianza
                <button
                  type="button"
                  onClick={() => toggleTooltip("varianza")}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              </label>
              {activeTooltip === "varianza" && (
                <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded mt-1">
                  Le slot ad alta varianza hanno vincite pi&ugrave; rare ma pi&ugrave; alte.
                  Influisce sulla puntata minima Big Win.
                </p>
              )}
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={altaVarianza}
              onClick={() => setAltaVarianza(!altaVarianza)}
              className={cn(
                "relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2",
                altaVarianza ? "bg-brand-accent" : "bg-gray-200"
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                  altaVarianza ? "translate-x-5" : "translate-x-0"
                )}
              />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Risultati */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Risultati
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-1">Giocato Totale</div>
              <div className="text-lg font-bold text-gray-900">
                €{result.giocatoTotale.toFixed(2)}
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-1">
                Giocato Rimanente
              </div>
              <div className="text-lg font-bold text-gray-900">
                €{result.giocatoRimanente.toFixed(2)}
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-1">
                Puntata Big Win
              </div>
              <div className="text-lg font-bold text-brand-accent">
                €{result.puntataBigWin.toFixed(2)}
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-1">
                Puntata Rollover
              </div>
              <div className="text-lg font-bold text-brand-accent">
                €{result.puntataRollover.toFixed(2)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* STATUS Card */}
      <Card
        variant="elevated"
        className={cn(
          "overflow-hidden border-2",
          result.faiRollover ? "border-profit" : "border-amber-400"
        )}
      >
        <div
          className={cn(
            "p-6 text-center",
            result.faiRollover
              ? "bg-gradient-to-b from-green-50 to-white"
              : "bg-gradient-to-b from-amber-50 to-white"
          )}
        >
          <div className="flex justify-center mb-3">
            {result.faiRollover ? (
              <CheckCircle className="w-12 h-12 text-profit" />
            ) : (
              <AlertTriangle className="w-12 h-12 text-amber-500" />
            )}
          </div>
          <div
            className={cn(
              "text-xl md:text-2xl font-bold mb-2",
              result.faiRollover ? "text-profit" : "text-amber-600"
            )}
          >
            {result.faiRollover
              ? "Fai Rollover"
              : "Continua a cercare la Big Win"}
          </div>
          <p className="text-sm text-gray-500 mb-4">
            {result.faiRollover
              ? `Il bilancio proiettato (€${result.bilancioProiettato.toFixed(2)}) supera la soglia di €${result.sogliaRollover.toFixed(2)}`
              : `Bilancio proiettato: €${result.bilancioProiettato.toFixed(2)} — Soglia: €${result.sogliaRollover.toFixed(2)}`}
          </p>
          {result.faiRollover ? (
            <div className="inline-flex items-center gap-2 bg-green-100 text-profit px-4 py-2 rounded-full text-sm font-semibold">
              Usa puntata rollover: €{result.puntataRollover.toFixed(2)}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 px-4 py-2 rounded-full text-sm font-semibold">
                Usa puntata big win: €{result.puntataBigWin.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500">
                Saldo minimo necessario per rollover:{" "}
                <span className="font-semibold text-gray-700">
                  €{result.saldoMinimo.toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Note informative */}
      <div className="text-center text-xs text-gray-400 space-y-1">
        <p>
          <strong>BIG WIN:</strong> Punta con puntate alte per cercare una
          vincita importante
        </p>
        <p>
          <strong>ROLLOVER:</strong> Punta con puntate basse per completare il
          requisito di giocata
        </p>
        <p>
          Il calcolatore ti indica quando il tuo saldo &egrave; sufficiente per
          completare il rollover in profitto
        </p>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  Calculator,
  Plus,
  Minus,
  Lock,
  Unlock,
  Copy,
  Check,
  Settings,
  Save,
  FolderOpen,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  calculateMultiplicatore, 
  roundTo,
  type MultiplicatoreInput,
  type MultiplicatoreResult,
  type CoperturaTipo,
} from "@/lib/calculators/multiplicatore";
import {
  parseNumericInput,
  copyToClipboard,
  cn
} from "@/lib/utils";
import { backendAPI } from "@/lib/api/backend";
import { SavedMultipleDialog } from "./SavedMultipleDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import type { BetMode, SavedMultipla } from "@/types/calculator";

// Exchange disponibili (commissioni default come NinjaBet: 0.045 per Betfair, 0.05 per Betflag)
const EXCHANGES = [
  { value: 'betfair', label: 'Betfair', commission: 0.045 },
  { value: 'betflag', label: 'Betflag', commission: 0.05 },
  { value: '-', label: '----------------', commission: 0 },
  { value: 'bet365', label: 'Bet365', commission: 0 },
  { value: 'sisal', label: 'Sisal', commission: 0 },
  { value: 'snai', label: 'Snai', commission: 0 },
  { value: 'eurobet', label: 'Eurobet', commission: 0 },
  { value: 'goldbet', label: 'Goldbet', commission: 0 },
  { value: 'lottomatica', label: 'Lottomatica', commission: 0 },
  { value: 'bwin', label: 'Bwin', commission: 0 },
  { value: 'williamhill', label: 'William Hill', commission: 0 },
  { value: 'altro', label: 'Altro', commission: 0 },
];

// Bookmaker disponibili
const BOOKMAKERS = [
  { value: '888sport', label: '888Sport' },
  { value: 'bet365', label: 'Bet365' },
  { value: 'betclic', label: 'Betclic' },
  { value: 'betfair', label: 'Betfair Sportsbook' },
  { value: 'betflag', label: 'Betflag Sportsbook' },
  { value: 'betway', label: 'Betway' },
  { value: 'bwin', label: 'Bwin' },
  { value: 'eurobet', label: 'Eurobet' },
  { value: 'goldbet', label: 'Goldbet' },
  { value: 'leovegas', label: 'LeoVegas' },
  { value: 'lottomatica', label: 'Lottomatica' },
  { value: 'sisal', label: 'Sisal' },
  { value: 'snai', label: 'Snai' },
  { value: 'unibet', label: 'Unibet' },
  { value: 'williamhill', label: 'William Hill' },
  { value: 'altro', label: 'Altro' },
];

// Interfaccia per i dati di ogni partita (tutti stringhe per permettere input)
interface PartitaState {
  data: string;
  nome: string;
  scommessa: string;
  backOdds: string;
  layOdds: string;
  copertura: CoperturaTipo;
  exchange: string;
  locked: boolean;
  manualStake: string;
}

const DEFAULT_PARTITA: PartitaState = {
  data: '',
  nome: '',
  scommessa: '',
  backOdds: '',
  layOdds: '',
  copertura: 'Banca',
  exchange: 'betfair',
  locked: true,
  manualStake: '',
};

export function MultiplicatoreCalculator() {
  // State per gli input
  const [mode, setMode] = useState<BetMode>('normale');
  const [numPartite, setNumPartite] = useState<number>(2);
  const [backStake, setBackStake] = useState<string>('100');
  const [backRefundStake, setBackRefundStake] = useState<string>('50');
  const [maggiorazioneQuota, setMaggiorazioneQuota] = useState<string>('0');
  const [maggiorazioneTipo, setMaggiorazioneTipo] = useState<'lorda' | 'netta'>('lorda');
  const [nomeMultipla, setNomeMultipla] = useState<string>('');
  const [bookmaker, setBookmaker] = useState<string>('888sport');
  
  // Commissioni personalizzate (default come NinjaBet)
  const [betfairCommission, setBetfairCommission] = useState<string>('0.045');
  const [betflagCommission, setBetflagCommission] = useState<string>('0.05');
  const [showCommissionDialog, setShowCommissionDialog] = useState(false);
  
  // State per le partite (tutto come stringhe)
  const [partite, setPartite] = useState<PartitaState[]>(
    Array(5).fill(null).map(() => ({ ...DEFAULT_PARTITA }))
  );

  // State UI
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  // Save/Load state
  const [currentMultiplaId, setCurrentMultiplaId] = useState<number | null>(null);
  const [currentMultiplaName, setCurrentMultiplaName] = useState<string>('');
  const [showSavedDialog, setShowSavedDialog] = useState(false);
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [saveNameInput, setSaveNameInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Ottieni commissione per exchange
  const getCommissionForExchange = (exchange: string): number => {
    if (exchange === 'betfair') return parseNumericInput(betfairCommission);
    if (exchange === 'betflag') return parseNumericInput(betflagCommission);
    return 0;
  };

  // Handler per modificare una partita
  const updatePartita = (index: number, field: keyof PartitaState, value: string | boolean) => {
    const newPartite = [...partite];
    newPartite[index] = { ...newPartite[index], [field]: value };
    setPartite(newPartite);
  };

  // Handler per input numerici con sostituzione virgola
  const handleNumericInput = (index: number, field: 'backOdds' | 'layOdds' | 'manualStake', value: string) => {
    const cleanValue = value.replace(',', '.');
    updatePartita(index, field, cleanValue);
  };

  // Handler per toggle lock
  const toggleLock = (index: number) => {
    const newPartite = [...partite];
    newPartite[index] = { 
      ...newPartite[index], 
      locked: !newPartite[index].locked,
      manualStake: '',
    };
    setPartite(newPartite);
  };

  // Handler per numero partite
  const handleNumPartiteChange = (delta: number) => {
    const newNum = Math.min(5, Math.max(2, numPartite + delta));
    setNumPartite(newNum);
  };

  // Handler copia
  const handleCopy = async (value: string, idx: number) => {
    const success = await copyToClipboard(value);
    if (success) {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    }
  };

  // Parse degli input per il calcolo
  const parsedInput: MultiplicatoreInput = useMemo(() => ({
    mode,
    numPartite,
    backStake: parseNumericInput(backStake),
    backRefundStake: parseNumericInput(backRefundStake),
    partite: partite.map(p => ({
      backOdds: parseNumericInput(p.backOdds),
      layOdds: parseNumericInput(p.layOdds),
      commission: getCommissionForExchange(p.exchange),
      copertura: p.copertura,
      locked: p.locked,
      manualStake: p.manualStake ? parseNumericInput(p.manualStake) : undefined,
    })),
    maggiorazioneQuota: parseNumericInput(maggiorazioneQuota),
    maggiorazioneTipo,
  }), [mode, numPartite, backStake, backRefundStake, partite, maggiorazioneQuota, maggiorazioneTipo, betfairCommission, betflagCommission]);

  // Calcolo risultati
  const result: MultiplicatoreResult = useMemo(() => {
    return calculateMultiplicatore(parsedInput);
  }, [parsedInput]);

  // Collect state for saving
  const collectState = useCallback(() => {
    return {
      mode,
      numPartite,
      backStake,
      backRefundStake,
      maggiorazioneQuota,
      maggiorazioneTipo,
      nomeMultipla,
      bookmaker,
      betfairCommission,
      betflagCommission,
      partite: partite.slice(0, numPartite).map(p => ({ ...p })),
    };
  }, [mode, numPartite, backStake, backRefundStake, maggiorazioneQuota, maggiorazioneTipo, nomeMultipla, bookmaker, betfairCommission, betflagCommission, partite]);

  // Load state from saved multipla
  const loadState = useCallback((data: Record<string, any>) => {
    if (data.mode) setMode(data.mode);
    if (data.numPartite) setNumPartite(data.numPartite);
    if (data.backStake !== undefined) setBackStake(data.backStake);
    if (data.backRefundStake !== undefined) setBackRefundStake(data.backRefundStake);
    if (data.maggiorazioneQuota !== undefined) setMaggiorazioneQuota(data.maggiorazioneQuota);
    if (data.maggiorazioneTipo) setMaggiorazioneTipo(data.maggiorazioneTipo);
    if (data.nomeMultipla !== undefined) setNomeMultipla(data.nomeMultipla);
    if (data.bookmaker) setBookmaker(data.bookmaker);
    if (data.betfairCommission !== undefined) setBetfairCommission(data.betfairCommission);
    if (data.betflagCommission !== undefined) setBetflagCommission(data.betflagCommission);
    if (data.partite && Array.isArray(data.partite)) {
      const loaded = data.partite.map((p: any) => ({
        ...DEFAULT_PARTITA,
        ...p,
      }));
      // Pad to 5 if needed
      while (loaded.length < 5) {
        loaded.push({ ...DEFAULT_PARTITA });
      }
      setPartite(loaded);
    }
  }, []);

  // Handle load from dialog
  const handleLoadMultipla = useCallback((multipla: SavedMultipla) => {
    loadState(multipla.data);
    setCurrentMultiplaId(multipla.id);
    setCurrentMultiplaName(multipla.name);
    setSaveMessage({ type: 'success', text: `Caricata: ${multipla.name}` });
    setTimeout(() => setSaveMessage(null), 3000);
  }, [loadState]);

  // Handle save
  const handleSave = useCallback(async (name?: string) => {
    const saveName = name || currentMultiplaName || nomeMultipla;
    if (!saveName.trim()) {
      setSaveNameInput(nomeMultipla || '');
      setShowNameDialog(true);
      return;
    }

    setIsSaving(true);
    const stateData = collectState();

    if (currentMultiplaId) {
      // Update existing
      const res = await backendAPI.updateMultipla(currentMultiplaId, {
        calculator_type: 'multiplicatore',
        name: saveName,
        data: stateData,
      });
      if (res.success) {
        setCurrentMultiplaName(saveName);
        setSaveMessage({ type: 'success', text: 'Multipla aggiornata' });
      } else {
        setSaveMessage({ type: 'error', text: res.error || 'Errore nel salvataggio' });
      }
    } else {
      // Create new
      const res = await backendAPI.saveMultipla({
        calculator_type: 'multiplicatore',
        name: saveName,
        data: stateData,
      });
      if (res.success && res.data) {
        setCurrentMultiplaId(res.data.id);
        setCurrentMultiplaName(saveName);
        setSaveMessage({ type: 'success', text: 'Multipla salvata' });
      } else {
        setSaveMessage({ type: 'error', text: res.error || 'Errore nel salvataggio' });
      }
    }
    setIsSaving(false);
    setTimeout(() => setSaveMessage(null), 3000);
  }, [currentMultiplaId, currentMultiplaName, nomeMultipla, collectState]);

  // Handle name dialog confirm
  const handleNameConfirm = useCallback(() => {
    if (saveNameInput.trim()) {
      setShowNameDialog(false);
      handleSave(saveNameInput.trim());
    }
  }, [saveNameInput, handleSave]);

  // Formatta profitto con colore
  const ProfitDisplay = ({ value, size = 'default' }: { value: number; size?: 'default' | 'large' }) => {
    const isPositive = value >= 0;
    const formatted = isPositive ? `+${roundTo(value, 2)}` : `${roundTo(value, 2)}`;
    return (
      <span className={cn(
        "font-bold",
        isPositive ? "text-profit" : "text-loss",
        size === 'large' ? "text-xl" : "text-sm"
      )}>
        {formatted}
      </span>
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-4">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 text-brand-accent mb-2">
          <Calculator className="w-6 h-6" />
          <span className="text-sm font-medium uppercase tracking-wider">Calcolatore</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Multiplicatore
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          Calcola le coperture per scommesse multiple (2-5 partite)
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
                  <span>RF</span>
                  <span className="text-[10px] font-normal opacity-70 hidden md:inline">Rimborso</span>
                </div>
              </TabsTrigger>
              <TabsTrigger value="bonus" variant="gold" className="text-xs md:text-sm font-semibold">
                <div className="flex flex-col items-center gap-0.5">
                  <span>BR</span>
                  <span className="text-[10px] font-normal opacity-70 hidden md:inline">Bonus</span>
                </div>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {/* Impostazioni Generali */}
      <Card>
        <CardContent className="p-4 space-y-4">
          {/* Prima riga: Nome, Bookmaker, Maggiorazione, Commissione */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Nome Multipla</label>
              <Input
                type="text"
                value={nomeMultipla}
                onChange={(e) => setNomeMultipla(e.target.value)}
                placeholder="Es. Serie A Giornata 15"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Bookmaker</label>
              <select
                value={bookmaker}
                onChange={(e) => setBookmaker(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm"
              >
                {BOOKMAKERS.map(b => (
                  <option key={b.value} value={b.value}>{b.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Magg. Quota</label>
              <div className="flex gap-2">
                <select 
                  value={maggiorazioneTipo}
                  onChange={(e) => setMaggiorazioneTipo(e.target.value as 'lorda' | 'netta')}
                  className="text-xs border rounded px-2 py-2"
                >
                  <option value="lorda">Lorda</option>
                  <option value="netta">Netta</option>
                </select>
                <Input
                  type="text"
                  inputMode="decimal"
                  prefix="%"
                  value={maggiorazioneQuota}
                  onChange={(e) => setMaggiorazioneQuota(e.target.value.replace(',', '.'))}
                  placeholder="0"
                  className="w-24"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">&nbsp;</label>
              <Button
                variant="outline"
                onClick={() => setShowCommissionDialog(!showCommissionDialog)}
                className="w-full"
              >
                <Settings className="w-4 h-4 mr-2" />
                Commissione
              </Button>
            </div>
          </div>

          {/* Dialog Commissioni */}
          {showCommissionDialog && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h4 className="font-medium text-sm">Impostazioni Commissione (%)</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600 w-32">Betfair:</label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={betfairCommission}
                    onChange={(e) => setBetfairCommission(e.target.value.replace(',', '.'))}
                    className="w-24"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600 w-32">Betflag:</label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={betflagCommission}
                    onChange={(e) => setBetflagCommission(e.target.value.replace(',', '.'))}
                    className="w-24"
                  />
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowCommissionDialog(false)}
              >
                Chiudi
              </Button>
            </div>
          )}

          {/* Seconda riga: Partite, Importo, Rimborso */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-4 border-t">
            {/* Numero Partite */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Partite</label>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => handleNumPartiteChange(-1)}
                  disabled={numPartite <= 2}
                  className="h-8 w-8"
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="text-xl font-bold w-8 text-center">{numPartite}</span>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => handleNumPartiteChange(1)}
                  disabled={numPartite >= 5}
                  className="h-8 w-8"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Importo Puntata */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Importo Puntata</label>
              <Input
                type="text"
                inputMode="decimal"
                value={backStake}
                onChange={(e) => setBackStake(e.target.value.replace(',', '.'))}
                placeholder="100"
              />
            </div>

            {/* Importo Rimborso (solo RF) */}
            {mode === 'riskfree' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Importo Rimborso</label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={backRefundStake}
                  onChange={(e) => setBackRefundStake(e.target.value.replace(',', '.'))}
                  placeholder="50"
                />
              </div>
            )}

            {/* Rating Medio */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                {mode === 'riskfree' ? 'RF Medio' : 'Rating Medio'}
              </label>
              <div className="h-10 flex items-center">
                <span className="text-lg font-bold">{result.ratingMedio}%</span>
              </div>
            </div>

            {/* Guadagno Medio */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Guadagno Medio</label>
              <div className="h-10 flex items-center">
                <ProfitDisplay value={result.guadagnoMedio} size="large" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabella Partite */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-2 py-2 text-left font-medium text-gray-600 min-w-[140px]">Data</th>
                  <th className="px-2 py-2 text-left font-medium text-gray-600 min-w-[150px]">Partite</th>
                  <th className="px-2 py-2 text-left font-medium text-gray-600 min-w-[100px]">Scommessa</th>
                  <th className="px-2 py-2 text-left font-medium text-gray-600 w-8"></th>
                  <th className="px-2 py-2 text-left font-medium text-gray-600 min-w-[80px]">Copertura</th>
                  <th className="px-2 py-2 text-left font-medium text-gray-600 min-w-[80px]">Quota Punta</th>
                  <th className="px-2 py-2 text-left font-medium text-gray-600 min-w-[80px]">Quota Banca/P2</th>
                  <th className="px-2 py-2 text-left font-medium text-gray-600 min-w-[110px]">Exchange/Book2</th>
                  <th className="px-2 py-2 text-left font-medium text-gray-600 min-w-[60px]">Com</th>
                  <th className="px-2 py-2 text-left font-medium text-gray-600 min-w-[100px]">Banca/Punta2</th>
                  <th className="px-2 py-2 text-left font-medium text-gray-600 min-w-[70px]">Resp</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: numPartite }, (_, i) => (
                  <tr key={i} className="border-t hover:bg-gray-50">
                    {/* Data */}
                    <td className="px-2 py-2">
                      <DateTimePicker
                        value={partite[i].data}
                        onChange={(v) => updatePartita(i, 'data', v)}
                        className="w-[150px]"
                      />
                    </td>
                    {/* Nome Partita */}
                    <td className="px-2 py-2">
                      <Input
                        type="text"
                        value={partite[i].nome}
                        onChange={(e) => updatePartita(i, 'nome', e.target.value)}
                        placeholder="Es. Juve - Inter"
                        className="text-xs"
                      />
                    </td>
                    {/* Scommessa */}
                    <td className="px-2 py-2">
                      <Input
                        type="text"
                        value={partite[i].scommessa}
                        onChange={(e) => updatePartita(i, 'scommessa', e.target.value)}
                        placeholder="Es. 1X2"
                        className="text-xs"
                      />
                    </td>
                    {/* Lock */}
                    <td className="px-2 py-2">
                      <button
                        onClick={() => toggleLock(i)}
                        className={cn(
                          "p-1 rounded",
                          partite[i].locked ? "text-green-600" : "text-gray-400"
                        )}
                        title={partite[i].locked ? "Bloccato (auto)" : "Sbloccato (manuale)"}
                      >
                        {partite[i].locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                      </button>
                    </td>
                    {/* Copertura */}
                    <td className="px-2 py-2">
                      <select
                        value={partite[i].copertura}
                        onChange={(e) => updatePartita(i, 'copertura', e.target.value)}
                        className="border rounded px-2 py-1 text-xs w-full"
                      >
                        <option value="Banca">Banca</option>
                        <option value="Punta2">Punta 2</option>
                      </select>
                    </td>
                    {/* Quota Punta */}
                    <td className="px-2 py-2">
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={partite[i].backOdds}
                        onChange={(e) => handleNumericInput(i, 'backOdds', e.target.value)}
                        placeholder="0.00"
                        className="w-20 text-xs"
                      />
                    </td>
                    {/* Quota Banca/P2 */}
                    <td className="px-2 py-2">
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={partite[i].layOdds}
                        onChange={(e) => handleNumericInput(i, 'layOdds', e.target.value)}
                        placeholder="0.00"
                        className="w-20 text-xs"
                      />
                    </td>
                    {/* Exchange */}
                    <td className="px-2 py-2">
                      <select
                        value={partite[i].exchange}
                        onChange={(e) => updatePartita(i, 'exchange', e.target.value)}
                        className="border rounded px-1 py-1 text-xs w-full"
                      >
                        {EXCHANGES.map(ex => (
                          <option key={ex.value} value={ex.value} disabled={ex.value === '-'}>
                            {ex.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    {/* Commissione */}
                    <td className="px-2 py-2">
                      <Input
                        type="text"
                        value={getCommissionForExchange(partite[i].exchange).toString()}
                        readOnly
                        className="w-16 text-xs bg-gray-50"
                      />
                    </td>
                    {/* Stake */}
                    <td className="px-2 py-2">
                      <div className="flex items-center gap-1">
                        {partite[i].locked ? (
                          <span className="font-medium text-xs w-16">{result.partiteResults[i]?.stake || 0}</span>
                        ) : (
                          <Input
                            type="text"
                            inputMode="decimal"
                            value={partite[i].manualStake}
                            onChange={(e) => handleNumericInput(i, 'manualStake', e.target.value)}
                            placeholder="0"
                            className="w-16 text-xs bg-yellow-50"
                          />
                        )}
                        <button
                          onClick={() => handleCopy(String(result.partiteResults[i]?.stake || 0), i)}
                          className="p-1 hover:bg-gray-100 rounded"
                          title="Copia"
                        >
                          {copiedIdx === i ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3 text-gray-400" />}
                        </button>
                      </div>
                    </td>
                    {/* Responsabilità */}
                    <td className="px-2 py-2 font-medium text-lay text-xs">
                      {result.partiteResults[i]?.liability || 0}
                    </td>
                  </tr>
                ))}
                {/* Riga totali */}
                <tr className="border-t bg-gray-50 font-medium">
                  <td colSpan={5} className="px-2 py-2 text-right text-xs">Quota Multipla:</td>
                  <td className="px-2 py-2 text-xs text-back font-bold">{result.totalBackOdds}</td>
                  <td colSpan={3}></td>
                  <td className="px-2 py-2 text-right text-xs">Resp. Totale:</td>
                  <td className="px-2 py-2 text-xs text-lay font-bold">{result.totalLiability}€</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Scenari */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Scenario Multipla</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-600 w-40">Scenario Multipla</th>
                  {result.scenari.map((s, i) => (
                    <th key={i} className="px-3 py-2 text-center font-medium text-gray-600 min-w-[80px]">
                      {s.nome}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="px-3 py-2 font-medium">Guadagno</td>
                  {result.scenari.map((s, i) => (
                    <td key={i} className="px-3 py-2 text-center">
                      <ProfitDisplay value={s.guadagno} />
                    </td>
                  ))}
                </tr>
                <tr className="border-t">
                  <td className="px-3 py-2 font-medium">{mode === 'riskfree' ? 'RF' : 'Rating'}</td>
                  {result.scenari.map((s, i) => (
                    <td key={i} className="px-3 py-2 text-center font-medium">
                      {s.rating}%
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Bottoni Salva/Carica */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          {currentMultiplaName && (
            <span className="text-xs text-gray-500">
              Multipla: <strong>{currentMultiplaName}</strong>
            </span>
          )}
          {saveMessage && (
            <span className={cn(
              "text-xs font-medium",
              saveMessage.type === 'success' ? "text-green-600" : "text-red-600"
            )}>
              {saveMessage.text}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowSavedDialog(true)}
          >
            <FolderOpen className="w-4 h-4 mr-2" />
            Multiple Salvate
          </Button>
          <Button
            variant="default"
            className="bg-back hover:bg-back/90"
            onClick={() => handleSave()}
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {currentMultiplaId ? 'Aggiorna Multipla' : 'Salva Multipla'}
          </Button>
        </div>
      </div>

      {/* Dialog Multiple Salvate */}
      <SavedMultipleDialog
        open={showSavedDialog}
        onOpenChange={setShowSavedDialog}
        calculatorType="multiplicatore"
        onLoad={handleLoadMultipla}
      />

      {/* Dialog Nome Multipla */}
      <Dialog open={showNameDialog} onOpenChange={setShowNameDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Salva Multipla</DialogTitle>
            <DialogDescription>
              Inserisci un nome per la multipla.
            </DialogDescription>
          </DialogHeader>
          <Input
            type="text"
            value={saveNameInput}
            onChange={(e) => setSaveNameInput(e.target.value)}
            placeholder="Es. Serie A Giornata 15"
            onKeyDown={(e) => e.key === 'Enter' && handleNameConfirm()}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNameDialog(false)}>
              Annulla
            </Button>
            <Button
              onClick={handleNameConfirm}
              disabled={!saveNameInput.trim()}
              className="bg-back hover:bg-back/90"
            >
              Salva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Note informative */}
      <div className="text-center text-xs text-gray-400 space-y-1">
        <p>
          <strong>P</strong> = Prima partita persa | <strong>VP</strong> = Prima vinta, seconda persa | etc.
        </p>
        <p>
          <strong>Lock/Unlock</strong>: Sblocca per inserire stake manuale
        </p>
      </div>
    </div>
  );
}

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
  Save,
  FolderOpen,
  Loader2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  calculateMultiplicatoreCoperture,
  roundTo,
  type MultiplicatoreCopertureInput,
  type MultiplicatoreCopertureResult,
  type CoverageTreeNode,
  type CoverageTreeLeaf,
} from "@/lib/calculators/multiplicatore-coperture";
import {
  parseNumericInput,
  copyToClipboard,
  cn
} from "@/lib/utils";
import { backendAPI } from "@/lib/api/backend";
import { SavedMultipleDialog } from "./SavedMultipleDialog";
import { Input as DialogInput } from "@/components/ui/input";
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

// State per ogni partita
interface PartitaState {
  data: string;
  nome: string;
  numEsiti: 2 | 3;
  odds: string[];    // odds[0]=Q1, odds[1]=QX o Q2, odds[2]=Q2 (se 3 esiti)
  locked: boolean;
  manualStake: string;
}

const DEFAULT_PARTITA: PartitaState = {
  data: '',
  nome: '',
  numEsiti: 3,
  odds: ['', '', ''],
  locked: true,
  manualStake: '',
};

// Tree node component
function TreeNodeView({
  node,
  partite,
  depth,
  mode,
  backStake,
  isPerdi1,
}: {
  node: CoverageTreeNode;
  partite: { nome: string }[];
  depth: number;
  mode: BetMode;
  backStake: number;
  isPerdi1: boolean;
}) {
  const [expanded, setExpanded] = useState(depth < 3);
  const eventName = partite[node.eventIndex]?.nome || node.eventName;

  const renderChild = (child: CoverageTreeNode | CoverageTreeLeaf, isWin: boolean) => {
    const branchColor = isWin ? 'border-green-500' : 'border-red-500';
    const bgColor = isWin ? 'bg-green-50' : 'bg-red-50';
    const label = isWin ? 'Vince' : 'Perde';

    if (child.type === 'leaf') {
      const ratingLabel = (mode === 'riskfree' || isPerdi1) ? 'RF' : 'Rating';
      return (
        <div className={cn("ml-6 mt-1 pl-3 border-l-2", branchColor)}>
          <div className={cn("inline-block rounded px-2 py-1 text-xs", bgColor)}>
            <span className="font-medium">{label}</span>
            <span className="mx-1">→</span>
            <span className={cn("font-bold", child.profit >= 0 ? "text-profit" : "text-loss")}>
              {child.profit >= 0 ? '+' : ''}{child.profit}€
            </span>
            <span className="text-gray-500 ml-1">({ratingLabel}: {child.rating}%)</span>
            {child.hasRefund && (
              <span className="ml-1 px-1 py-0.5 bg-yellow-200 text-yellow-800 rounded text-[10px] font-medium">
                Rimborso
              </span>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className={cn("ml-6 mt-1 pl-3 border-l-2", branchColor)}>
        <div className={cn("text-[10px] font-medium mb-0.5 px-1", isWin ? "text-green-700" : "text-red-700")}>
          {label}
        </div>
        <TreeNodeView
          node={child}
          partite={partite}
          depth={depth + 1}
          mode={mode}
          backStake={backStake}
          isPerdi1={isPerdi1}
        />
      </div>
    );
  };

  return (
    <div className="text-sm">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-left w-full group"
      >
        {expanded ? (
          <ChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
        )}
        <div className="bg-gray-100 rounded px-2 py-1 group-hover:bg-gray-200 transition-colors">
          <span className="font-medium text-gray-800">{eventName}</span>
          <span className="text-gray-500 ml-2 text-xs">
            Cop: {node.coverageStake}€
          </span>
          {node.coverageStakes.length > 0 && (
            <span className="text-gray-400 ml-1 text-[10px]">
              ({node.coverageStakes.map((s, i) => `C${i + 1}: ${s}`).join(', ')})
            </span>
          )}
          <span className="text-gray-500 ml-2 text-xs">
            Prof: <span className="text-profit">{node.coverageProfit > 0 ? '+' : ''}{node.coverageProfit}€</span>
          </span>
        </div>
      </button>
      {expanded && (
        <div className="mt-0.5">
          {renderChild(node.win, true)}
          {renderChild(node.lose, false)}
        </div>
      )}
    </div>
  );
}

export function MultiplicatoreCoperturCalculator() {
  const [mode, setMode] = useState<BetMode>('normale');
  const [subMode, setSubMode] = useState<'standard' | 'perdi1'>('standard');
  const [rimborsoPerdi1, setRimborsoPerdi1] = useState<string>('');
  const [treeOpen, setTreeOpen] = useState(true);
  const [numPartite, setNumPartite] = useState<number>(2);
  const [backStake, setBackStake] = useState<string>('100');
  const [backRefundStake, setBackRefundStake] = useState<string>('50');
  const [maggiorazioneQuota, setMaggiorazioneQuota] = useState<string>('0');
  const [maggiorazioneTipo, setMaggiorazioneTipo] = useState<'lorda' | 'netta'>('lorda');
  const [nomeMultipla, setNomeMultipla] = useState<string>('');
  const [bookmaker, setBookmaker] = useState<string>('888sport');

  const [partite, setPartite] = useState<PartitaState[]>(
    Array(10).fill(null).map(() => ({ ...DEFAULT_PARTITA, odds: ['', '', ''] }))
  );

  const [copiedIdx, setCopiedIdx] = useState<string | null>(null);

  // Save/Load state
  const [currentMultiplaId, setCurrentMultiplaId] = useState<number | null>(null);
  const [currentMultiplaName, setCurrentMultiplaName] = useState<string>('');
  const [showSavedDialog, setShowSavedDialog] = useState(false);
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [saveNameInput, setSaveNameInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const updatePartita = (index: number, field: keyof PartitaState, value: string | boolean | number) => {
    const newPartite = [...partite];
    if (field === 'numEsiti') {
      const numEsiti = value as 2 | 3;
      const oldOdds = newPartite[index].odds;
      // Preserva le quote esistenti dove possibile
      const newOdds = numEsiti === 2
        ? [oldOdds[0], oldOdds[2] || oldOdds[1] || ''] // Q1 + Q2
        : [oldOdds[0], '', oldOdds[1] || ''];           // Q1 + QX + Q2
      newPartite[index] = { ...newPartite[index], numEsiti, odds: newOdds };
    } else {
      newPartite[index] = { ...newPartite[index], [field]: value };
    }
    setPartite(newPartite);
  };

  const updateOdds = (partitaIdx: number, oddsIdx: number, value: string) => {
    const cleanValue = value.replace(',', '.');
    const newPartite = [...partite];
    const newOdds = [...newPartite[partitaIdx].odds];
    newOdds[oddsIdx] = cleanValue;
    newPartite[partitaIdx] = { ...newPartite[partitaIdx], odds: newOdds };
    setPartite(newPartite);
  };

  const toggleLock = (index: number) => {
    const newPartite = [...partite];
    newPartite[index] = {
      ...newPartite[index],
      locked: !newPartite[index].locked,
      manualStake: '',
    };
    setPartite(newPartite);
  };

  const handleNumPartiteChange = (delta: number) => {
    const newNum = Math.min(10, Math.max(2, numPartite + delta));
    setNumPartite(newNum);
  };

  const handleCopy = async (value: string, key: string) => {
    const success = await copyToClipboard(value);
    if (success) {
      setCopiedIdx(key);
      setTimeout(() => setCopiedIdx(null), 2000);
    }
  };

  // Parse input per il calcolo
  const parsedInput: MultiplicatoreCopertureInput = useMemo(() => ({
    mode,
    subMode: mode === 'normale' ? subMode : 'standard',
    numPartite,
    backStake: parseNumericInput(backStake),
    backRefundStake: parseNumericInput(backRefundStake),
    rimborsoPerdi1: parseNumericInput(rimborsoPerdi1),
    partite: partite.map(p => ({
      numEsiti: p.numEsiti,
      odds: p.odds.slice(0, p.numEsiti).map(o => parseNumericInput(o)),
      locked: p.locked,
      manualStake: p.manualStake ? parseNumericInput(p.manualStake) : undefined,
    })),
    maggiorazioneQuota: parseNumericInput(maggiorazioneQuota),
    maggiorazioneTipo,
  }), [mode, subMode, numPartite, backStake, backRefundStake, rimborsoPerdi1, partite, maggiorazioneQuota, maggiorazioneTipo]);

  const result: MultiplicatoreCopertureResult = useMemo(() => {
    return calculateMultiplicatoreCoperture(parsedInput);
  }, [parsedInput]);

  // Etichette esiti di copertura
  const getCoverageLabel = (partita: PartitaState, coverageIdx: number): string => {
    if (partita.numEsiti === 2) {
      return 'Cop. 1';
    }
    // 3 esiti: coverageIdx 0 = Cop. 1, coverageIdx 1 = Cop. 2
    return coverageIdx === 0 ? 'Cop. 1' : 'Cop. 2';
  };

  // Etichette colonne quote
  const getOddsLabels = (numEsiti: 2 | 3): string[] => {
    return numEsiti === 2 ? ['Q. multipla', 'Cop. 1'] : ['Q. multipla', 'Cop. 1', 'Cop. 2'];
  };

  // Collect state for saving
  const collectState = useCallback(() => {
    return {
      mode,
      subMode,
      numPartite,
      backStake,
      backRefundStake,
      rimborsoPerdi1,
      maggiorazioneQuota,
      maggiorazioneTipo,
      nomeMultipla,
      bookmaker,
      partite: partite.slice(0, numPartite).map(p => ({ ...p })),
    };
  }, [mode, subMode, numPartite, backStake, backRefundStake, rimborsoPerdi1, maggiorazioneQuota, maggiorazioneTipo, nomeMultipla, bookmaker, partite]);

  // Load state from saved multipla
  const loadState = useCallback((data: Record<string, any>) => {
    if (data.mode) setMode(data.mode);
    if (data.subMode) setSubMode(data.subMode);
    if (data.numPartite) setNumPartite(data.numPartite);
    if (data.backStake !== undefined) setBackStake(data.backStake);
    if (data.backRefundStake !== undefined) setBackRefundStake(data.backRefundStake);
    if (data.rimborsoPerdi1 !== undefined) setRimborsoPerdi1(data.rimborsoPerdi1);
    if (data.maggiorazioneQuota !== undefined) setMaggiorazioneQuota(data.maggiorazioneQuota);
    if (data.maggiorazioneTipo) setMaggiorazioneTipo(data.maggiorazioneTipo);
    if (data.nomeMultipla !== undefined) setNomeMultipla(data.nomeMultipla);
    if (data.bookmaker) setBookmaker(data.bookmaker);
    if (data.partite && Array.isArray(data.partite)) {
      const loaded = data.partite.map((p: any) => ({
        ...DEFAULT_PARTITA,
        odds: ['', '', ''],
        ...p,
      }));
      while (loaded.length < 10) {
        loaded.push({ ...DEFAULT_PARTITA, odds: ['', '', ''] });
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
      const res = await backendAPI.updateMultipla(currentMultiplaId, {
        calculator_type: 'multiplicatore-coperture',
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
      const res = await backendAPI.saveMultipla({
        calculator_type: 'multiplicatore-coperture',
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
    <div className="w-full max-w-5xl mx-auto space-y-4">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 text-brand-accent mb-2">
          <Calculator className="w-6 h-6" />
          <span className="text-sm font-medium uppercase tracking-wider">Calcolatore</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Multiplicatore Coperture
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          Calcola le coperture dutching per scommesse multiple (2-10 partite)
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

      {/* Sub-mode PERDI 1 (solo Normale) */}
      {mode === 'normale' && (
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500 mr-1">Tipo:</span>
              <button
                onClick={() => setSubMode('standard')}
                className={cn(
                  "px-3 py-1.5 rounded text-xs font-medium transition-colors",
                  subMode === 'standard'
                    ? "bg-brand-accent text-brand-primary"
                    : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                )}
              >
                Standard
              </button>
              <button
                onClick={() => setSubMode('perdi1')}
                className={cn(
                  "px-3 py-1.5 rounded text-xs font-medium transition-colors",
                  subMode === 'perdi1'
                    ? "bg-brand-accent text-brand-primary"
                    : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                )}
              >
                PERDI 1
              </button>
              {subMode === 'perdi1' && (
                <span className="text-[10px] text-gray-400 ml-2 hidden md:inline">
                  Se esattamente 1 evento perde → rimborso
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Impostazioni Generali */}
      <Card>
        <CardContent className="p-4 space-y-4">
          {/* Prima riga */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          </div>

          {/* Seconda riga */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-4 border-t">
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
                  disabled={numPartite >= 10}
                  className="h-8 w-8"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

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

            {mode === 'normale' && subMode === 'perdi1' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Rimborso PERDI 1</label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={rimborsoPerdi1}
                  onChange={(e) => setRimborsoPerdi1(e.target.value.replace(',', '.'))}
                  placeholder="50"
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                {(mode === 'riskfree' || (mode === 'normale' && subMode === 'perdi1')) ? 'RF Medio' : 'Rating Medio'}
              </label>
              <div className="h-10 flex items-center">
                <span className="text-lg font-bold">{result.ratingMedio}%</span>
              </div>
            </div>

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
                  <th className="px-2 py-2 text-left font-medium text-gray-600 w-8">#</th>
                  <th className="px-2 py-2 text-left font-medium text-gray-600 min-w-[150px]">Data</th>
                  <th className="px-2 py-2 text-left font-medium text-gray-600 min-w-[120px]">Partita</th>
                  <th className="px-2 py-2 text-center font-medium text-gray-600 w-20">Esiti</th>
                  <th className="px-2 py-2 text-left font-medium text-gray-600 min-w-[70px]">Quota multipla</th>
                  <th className="px-2 py-2 text-left font-medium text-gray-600 min-w-[70px]">Copertura 1</th>
                  <th className="px-2 py-2 text-left font-medium text-gray-600 min-w-[70px]">Copertura 2</th>
                  <th className="px-2 py-2 text-left font-medium text-gray-600 w-8"></th>
                  <th className="px-2 py-2 text-left font-medium text-gray-600 min-w-[150px]">Puntate Copertura</th>
                  <th className="px-2 py-2 text-left font-medium text-gray-600 min-w-[70px]">Resp.</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: numPartite }, (_, i) => {
                  const p = partite[i];
                  const pr = result.partiteResults[i];
                  const labels = getOddsLabels(p.numEsiti);

                  return (
                    <tr key={i} className="border-t hover:bg-gray-50">
                      {/* # */}
                      <td className="px-2 py-2 text-center font-medium text-gray-500">
                        {i + 1}
                      </td>
                      {/* Data */}
                      <td className="px-2 py-2">
                        <DateTimePicker
                          value={p.data}
                          onChange={(v) => updatePartita(i, 'data', v)}
                          className="w-[150px]"
                        />
                      </td>
                      {/* Nome Partita */}
                      <td className="px-2 py-2">
                        <Input
                          type="text"
                          value={p.nome}
                          onChange={(e) => updatePartita(i, 'nome', e.target.value)}
                          placeholder="Es. Juve - Inter"
                          className="text-xs"
                        />
                      </td>
                      {/* Esiti 2/3 */}
                      <td className="px-2 py-2">
                        <div className="flex gap-1 justify-center">
                          <button
                            onClick={() => updatePartita(i, 'numEsiti', 2)}
                            className={cn(
                              "px-2 py-1 rounded text-xs font-medium transition-colors",
                              p.numEsiti === 2
                                ? "bg-brand-accent text-brand-primary"
                                : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                            )}
                          >
                            2
                          </button>
                          <button
                            onClick={() => updatePartita(i, 'numEsiti', 3)}
                            className={cn(
                              "px-2 py-1 rounded text-xs font-medium transition-colors",
                              p.numEsiti === 3
                                ? "bg-brand-accent text-brand-primary"
                                : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                            )}
                          >
                            3
                          </button>
                        </div>
                      </td>
                      {/* Q1 */}
                      <td className="px-2 py-2">
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={p.odds[0]}
                          onChange={(e) => updateOdds(i, 0, e.target.value)}
                          placeholder={labels[0]}
                          className="w-[70px] text-xs"
                        />
                      </td>
                      {/* QX (solo se 3 esiti) */}
                      <td className="px-2 py-2">
                        {p.numEsiti === 3 ? (
                          <Input
                            type="text"
                            inputMode="decimal"
                            value={p.odds[1]}
                            onChange={(e) => updateOdds(i, 1, e.target.value)}
                            placeholder="Cop. 1"
                            className="w-[70px] text-xs"
                          />
                        ) : (
                          <span className="text-gray-300 text-xs">-</span>
                        )}
                      </td>
                      {/* Q2 */}
                      <td className="px-2 py-2">
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={p.numEsiti === 2 ? p.odds[1] : p.odds[2]}
                          onChange={(e) => updateOdds(i, p.numEsiti === 2 ? 1 : 2, e.target.value)}
                          placeholder={p.numEsiti === 2 ? "Cop. 1" : "Cop. 2"}
                          className="w-[70px] text-xs"
                        />
                      </td>
                      {/* Lock */}
                      <td className="px-2 py-2">
                        <button
                          onClick={() => toggleLock(i)}
                          className={cn(
                            "p-1 rounded",
                            p.locked ? "text-green-600" : "text-gray-400"
                          )}
                          title={p.locked ? "Bloccato (auto)" : "Sbloccato (manuale)"}
                        >
                          {p.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                        </button>
                      </td>
                      {/* Puntate Copertura */}
                      <td className="px-2 py-2">
                        {p.locked ? (
                          <div className="space-y-1">
                            {pr?.coverageStakes.map((stake, j) => (
                              <div key={j} className="flex items-center gap-1">
                                <span className="text-xs text-gray-500 w-10">
                                  {getCoverageLabel(p, j)}:
                                </span>
                                <span className="font-medium text-xs">{stake}</span>
                                <button
                                  onClick={() => handleCopy(String(stake), `${i}-${j}`)}
                                  className="p-0.5 hover:bg-gray-100 rounded"
                                  title="Copia"
                                >
                                  {copiedIdx === `${i}-${j}` ? (
                                    <Check className="w-3 h-3 text-green-600" />
                                  ) : (
                                    <Copy className="w-3 h-3 text-gray-400" />
                                  )}
                                </button>
                              </div>
                            ))}
                            {pr && (
                              <div className="text-[10px] text-gray-400 pt-0.5">
                                Tot: {pr.totalCoverageStake}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gray-500">Tot:</span>
                              <Input
                                type="text"
                                inputMode="decimal"
                                value={p.manualStake}
                                onChange={(e) => {
                                  const cleanValue = e.target.value.replace(',', '.');
                                  updatePartita(i, 'manualStake', cleanValue);
                                }}
                                placeholder="0"
                                className="w-20 text-xs bg-yellow-50"
                              />
                            </div>
                            {pr?.coverageStakes.map((stake, j) => (
                              <div key={j} className="text-[10px] text-gray-400">
                                {getCoverageLabel(p, j)}: {stake}
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                      {/* Responsabilità */}
                      <td className="px-2 py-2 font-medium text-lay text-xs">
                        {pr?.liability || 0}
                      </td>
                    </tr>
                  );
                })}
                {/* Riga totali */}
                <tr className="border-t bg-gray-50 font-medium">
                  <td colSpan={4} className="px-2 py-2 text-right text-xs">Quota Multipla:</td>
                  <td className="px-2 py-2 text-xs text-back font-bold" colSpan={3}>{result.totalBackOdds}</td>
                  <td></td>
                  <td className="px-2 py-2 text-right text-xs">
                    {mode === 'normale' && subMode === 'perdi1' ? 'Max Coperture:' : 'Resp. Totale:'}
                  </td>
                  <td className="px-2 py-2 text-xs text-lay font-bold">{result.totalLiability}&euro;</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Scenari (nascosto per PERDI 1) */}
      {!(mode === 'normale' && subMode === 'perdi1') && (
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
      )}

      {/* Albero Risultati */}
      {result.tree && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Albero Risultati</CardTitle>
              <button
                onClick={() => setTreeOpen(!treeOpen)}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
              >
                {treeOpen ? (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    <span>Chiudi</span>
                  </>
                ) : (
                  <>
                    <ChevronRight className="w-4 h-4" />
                    <span>Apri</span>
                  </>
                )}
              </button>
            </div>
          </CardHeader>
          {treeOpen && (
            <CardContent className="p-4 overflow-x-auto">
              <TreeNodeView
                node={result.tree}
                partite={partite}
                depth={0}
                mode={mode}
                backStake={parseNumericInput(backStake)}
                isPerdi1={mode === 'normale' && subMode === 'perdi1'}
              />
            </CardContent>
          )}
        </Card>
      )}

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
        calculatorType="multiplicatore-coperture"
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
          <DialogInput
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
          <strong>Lock/Unlock</strong>: Sblocca per inserire stake totale copertura manuale
        </p>
        <p>
          Le coperture sono calcolate con il metodo <strong>dutching</strong> (punta-punta): ogni esito di copertura garantisce lo stesso ritorno.
        </p>
      </div>
    </div>
  );
}

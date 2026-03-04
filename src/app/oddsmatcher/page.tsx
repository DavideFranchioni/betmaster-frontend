'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AuthGuard } from '@/components/shared/AuthGuard';
import { SubscriptionGuard } from '@/components/shared/SubscriptionGuard';
import { 
  RefreshCw, 
  Settings, 
  Filter, 
  X, 
  Calculator,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  Clock,
  Copy,
  ExternalLink,
  Check,
  ArrowUpDown,
  Search,
  EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { backendAPI } from '@/lib/api/backend';
import type { OddsEvent, BackendConfig, EventSearchResult } from '@/types/oddsmatcher';

// ============= CONSTANTS =============
const BOOKMAKERS: Record<string, string> = {
  '1': '888sport', '2': 'Bet365', '4': 'Betfairsportbook', '5': 'Betflagsportbook',
  '6': 'Lottomatica', '7': 'Bwin', '9': 'Eurobet', '11': 'Giocodigitale',
  '14': 'Netbet', '15': 'Sisal', '16': 'Snai', '20': 'Williamhill',
  '24': 'Stanleybet', '28': 'Goldbet', '30': 'Quigioco', '32': 'Domusbet',
  '35': 'Leovegas', '39': 'Planetwin365', '41': 'Starvegas', '44': 'Marathonbet',
  '53': 'E-play24', '54': 'Pokerstars', '57': 'Admiral', '64': 'Starcasino',
  '65': 'Betsson', '66': 'Daznbet', '104': 'Codere', '105': 'Betpassion',
  '106': 'Gioca7', '107': 'Zonagioco',
};

const SPORTS: Record<string, { name: string; icon: string }> = {
  '1': { name: 'Calcio', icon: '⚽' },
  '2': { name: 'Tennis', icon: '🎾' },
  '3': { name: 'Basket', icon: '🏀' },
  '4': { name: 'Tennis Tavolo', icon: '🏓' },
  '5': { name: 'Esports', icon: '🎮' },
  '6': { name: 'Tennis (E.R.)', icon: '🎾' },
};

const BET_TYPES: Record<string, string> = {
  'home': '1', 'draw': 'X', 'away': '2',
  'fh_home': '1º Tempo - 1', 'fh_draw': '1º Tempo - X', 'fh_away': '1º Tempo - 2',
  'goal': 'Goal', 'no_goal': 'No Goal',
  'dc_home_draw': 'DC 1X', 'dc_draw_away': 'DC X2', 'dc_home_away': 'DC 12',
  'cs': 'Risultato esatto', 'ht_ft': 'Parziale/Finale',
  'under_05': 'Under 0.5', 'over_05': 'Over 0.5',
  'under_15': 'Under 1.5', 'over_15': 'Over 1.5',
  'under_25': 'Under 2.5', 'over_25': 'Over 2.5',
  'under_35': 'Under 3.5', 'over_35': 'Over 3.5',
  'under_45': 'Under 4.5', 'over_45': 'Over 4.5',
  'under_55': 'Under 5.5', 'over_55': 'Over 5.5',
  'under_65': 'Under 6.5', 'over_65': 'Over 6.5',
  'fh_under_05': '1º Tempo - Under 0.5', 'fh_over_05': '1º Tempo - Over 0.5',
  'fh_under_15': '1º Tempo - Under 1.5', 'fh_over_15': '1º Tempo - Over 1.5',
  'fh_under_25': '1º Tempo - Under 2.5', 'fh_over_25': '1º Tempo - Over 2.5',
};

type SortColumn = 'date' | 'event' | 'selection' | 'rating' | 'snr' | 'bookmaker' | 'back_odd' | 'exchange' | 'lay_odd' | 'liquidity';
type SortDirection = 'asc' | 'desc';

interface SelectedEvent {
  name: string;
  ids: string;
}

function roundTo(num: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(num * factor) / factor;
}

// ============= MULTI-SELECT COMPONENT =============
interface MultiSelectProps {
  options: Record<string, string>;
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder: string;
  allLabel: string;
  showIcons?: boolean;
  icons?: Record<string, string>;
}

function MultiSelect({ options, selected, onChange, placeholder, allLabel, showIcons, icons }: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter(s => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  const selectAll = () => onChange(Object.keys(options));
  const deselectAll = () => onChange([]);

  const filteredOptions = Object.entries(options).filter(([, name]) =>
    name.toLowerCase().includes(search.toLowerCase())
  );

  const displayText = selected.length === 0 
    ? placeholder 
    : selected.length === Object.keys(options).length 
      ? allLabel 
      : `${selected.length} selezionati`;

  return (
    <div className="relative" ref={ref}>
      <Button 
        variant="outline" 
        onClick={() => setOpen(!open)}
        className="w-full sm:w-[180px] justify-between bg-white text-left"
      >
        <span className="truncate text-sm">{displayText}</span>
        <ChevronDown className={`w-4 h-4 transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
      </Button>
      
      {open && (
        <div className="absolute top-full left-0 mt-1 w-[220px] bg-white border rounded-lg shadow-lg z-50">
          <div className="p-2 border-b">
            <Input placeholder="Cerca..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 text-sm" />
          </div>
          <div className="p-2 border-b flex gap-2">
            <Button size="sm" variant="outline" onClick={selectAll} className="flex-1 text-xs h-7">Tutti</Button>
            <Button size="sm" variant="outline" onClick={deselectAll} className="flex-1 text-xs h-7">Nessuno</Button>
          </div>
          <div className="max-h-[250px] overflow-y-auto">
            {filteredOptions.map(([id, name]) => (
              <div key={id} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 cursor-pointer" onClick={() => toggleOption(id)}>
                <div className={`w-4 h-4 border rounded flex items-center justify-center flex-shrink-0 ${selected.includes(id) ? 'bg-brand-primary border-brand-primary' : 'border-gray-300'}`}>
                  {selected.includes(id) && <Check className="w-3 h-3 text-white" />}
                </div>
                {showIcons && icons?.[id] && <span className="text-base">{icons[id]}</span>}
                <span className="text-sm truncate">{name}</span>
              </div>
            ))}
            {filteredOptions.length === 0 && <div className="px-3 py-4 text-center text-gray-500 text-sm">Nessun risultato</div>}
          </div>
          <div className="p-2 border-t flex gap-2">
            <Button size="sm" onClick={() => setOpen(false)} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-xs h-7">Conferma</Button>
            <Button size="sm" variant="outline" onClick={() => { deselectAll(); setOpen(false); }} className="flex-1 text-xs h-7">Cancella</Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============= EVENT AUTOCOMPLETE COMPONENT =============
interface EventAutocompleteProps {
  placeholder: string;
  selectedEvents: SelectedEvent[];
  onEventsChange: (events: SelectedEvent[]) => void;
  variant?: 'search' | 'hide';
}

function EventAutocomplete({ placeholder, selectedEvents, onEventsChange, variant = 'search' }: EventAutocompleteProps) {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<EventSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchEventsAPI = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      console.log('🔍 Searching events for:', query);
      const response = await backendAPI.searchEvents(query);
      console.log('📊 Search response:', response);
      
      if (response.success && response.data) {
        console.log('✅ Found events:', response.data.length);
        setSuggestions(response.data);
        setShowSuggestions(true);
      } else {
        console.log('❌ Search failed:', response.error);
        setSuggestions([]);
      }
    } catch (error) {
      console.error('❌ Search error:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = (value: string) => {
    setInputValue(value);
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      searchEventsAPI(value);
    }, 300);
  };

  const handleSelectEvent = (event: EventSearchResult) => {
    const newEvent: SelectedEvent = {
      name: event.value,
      ids: event.id
    };
    
    // Check if already selected
    if (!selectedEvents.some(e => e.ids === event.id)) {
      onEventsChange([...selectedEvents, newEvent]);
    }
    
    setInputValue('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleRemoveEvent = (ids: string) => {
    onEventsChange(selectedEvents.filter(e => e.ids !== ids));
  };

  const bgColor = variant === 'hide' ? 'bg-red-50 border-red-200' : 'bg-white';
  const tagColor = variant === 'hide' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white';

  return (
    <div className="relative" ref={containerRef}>
      <div className={`min-h-[40px] border rounded-md p-1 flex flex-wrap gap-1 items-center ${bgColor}`}>
        {/* Selected tags */}
        {selectedEvents.map((event) => (
          <span
            key={event.ids}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${tagColor}`}
          >
            <span className="truncate max-w-[100px]">{event.name}</span>
            <X
              className="w-3 h-3 cursor-pointer hover:opacity-70"
              onClick={() => handleRemoveEvent(event.ids)}
            />
          </span>
        ))}
        
        {/* Input */}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => inputValue.length >= 3 && setShowSuggestions(true)}
          placeholder={selectedEvents.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] outline-none text-sm bg-transparent px-1"
        />
        
        {loading && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
      </div>
      
      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg z-50 max-h-[200px] overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
              onClick={() => handleSelectEvent(suggestion)}
            >
              {suggestion.value}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============= SORTABLE TABLE HEADER =============
function SortableHeader({ column, label, currentSort, currentDirection, onSort, className = '' }: {
  column: SortColumn; label: string; currentSort: SortColumn; currentDirection: SortDirection; onSort: (column: SortColumn) => void; className?: string;
}) {
  const isActive = currentSort === column;
  return (
    <TableHead className={`font-bold text-gray-700 cursor-pointer hover:bg-gray-200 select-none ${className}`} onClick={() => onSort(column)}>
      <div className="flex items-center gap-1">
        <span className="hidden sm:inline">{label}</span>
        <span className="sm:hidden text-xs">{label.substring(0, 4)}</span>
        {isActive ? (currentDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
      </div>
    </TableHead>
  );
}

// ============= CALCULATOR MODAL =============
function CalculatorModal({ event, isOpen, onClose, defaultStake, defaultCommission }: {
  event: OddsEvent | null; isOpen: boolean; onClose: () => void; defaultStake: number; defaultCommission: number;
}) {
  const [mode, setMode] = useState<'normale' | 'riskfree' | 'bonus'>('normale');
  const [backStake, setBackStake] = useState(defaultStake.toString());
  const [backOdds, setBackOdds] = useState('');
  const [layOdds, setLayOdds] = useState('');
  const [commission, setCommission] = useState(defaultCommission.toString());
  const [backRefundStake, setBackRefundStake] = useState(defaultStake.toString());
  const [copiedLay, setCopiedLay] = useState(false);

  useEffect(() => {
    if (event) {
      setBackOdds(event.back_odd);
      setLayOdds(event.lay_odd);
      setBackStake(defaultStake.toString());
      setBackRefundStake(defaultStake.toString());
      setCommission(defaultCommission.toString());
    }
  }, [event, defaultStake, defaultCommission]);

  if (!event || !isOpen) return null;

  const stake = parseFloat(backStake) || 0;
  const backOdd = parseFloat(backOdds) || 0;
  const layOdd = parseFloat(layOdds) || 0;
  const layCommission = parseFloat(commission) || 0;
  const refundStake = parseFloat(backRefundStake) || stake;

  let layStake = roundTo((stake * backOdd) / (layOdd - layCommission), 2);
  let netResultBackBackWin = (stake * backOdd) - stake;
  let netResultLayBackWin = stake * -1;

  if (mode === 'riskfree') {
    layStake = roundTo(((stake * backOdd) - refundStake) / (layOdd - layCommission), 2);
    netResultLayBackWin = refundStake - stake;
  } else if (mode === 'bonus') {
    netResultLayBackWin = 0;
    netResultBackBackWin = stake * backOdd;
  }

  const liability = roundTo(layStake * (layOdd - 1), 2);
  const netResultBackLayWin = -1 * liability;
  const netResultLayLayWin = roundTo(layStake * (1 - layCommission), 2);
  const backWinProfit = roundTo(netResultBackBackWin + netResultBackLayWin, 2);
  const layWinProfit = roundTo(netResultLayBackWin + netResultLayLayWin, 2);
  const profit = roundTo(Math.min(layWinProfit, backWinProfit), 2);

  const bookmakerName = BOOKMAKERS[event.bookie_id] || event.bookie_id;
  const exchangeName = event.exchange === 'betfair' ? 'Betfair' : 'Betflag';

  const copyToClipboard = async (value: number) => {
    try {
      await navigator.clipboard.writeText(value.toFixed(2));
      setCopiedLay(true);
      setTimeout(() => setCopiedLay(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[95vh] overflow-y-auto bg-white border-0 shadow-2xl p-0">
        <DialogHeader className="bg-brand-primary text-white p-3 sm:p-4 sticky top-0 z-10">
          <DialogTitle className="text-base sm:text-xl font-bold pr-8 truncate">Calcolatore - {event.event}</DialogTitle>
        </DialogHeader>
        <div className="p-3 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Left side */}
            <div className="space-y-3 sm:space-y-4">
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 space-y-2 border text-sm">
                <div className="flex items-center justify-between"><span className="text-gray-600"><Clock size={14} className="inline mr-1" />Data/Ora</span><span className="font-semibold text-xs sm:text-sm">{event.open_date}</span></div>
                <div className="flex items-center justify-between"><span className="text-gray-600">{SPORTS[event.sport_id]?.icon} Partita</span><span className="font-semibold text-xs sm:text-sm text-right max-w-[60%] truncate">{event.event}</span></div>
                <div className="flex items-center justify-between"><span className="text-gray-600">Rating (%)</span><span className="font-semibold">{event.rating}</span></div>
                <div className="flex items-center justify-between"><span className="text-gray-600">Competizione</span><span className="font-semibold text-xs">{event.competition}</span></div>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                <div className="bg-[#17a2b8] text-white rounded-lg p-3 text-center shadow-lg">
                  <div className="text-xs font-bold mb-1">PUNTATA</div>
                  <div className="text-xs opacity-80 truncate mb-2">{event.selection}</div>
                  <div className="text-2xl sm:text-4xl font-bold my-2">{backOdd.toFixed(2)}</div>
                  <div className="text-xs bg-white/20 rounded px-2 py-1 truncate mt-2">{bookmakerName}</div>
                </div>
                <div className="bg-[#f8a5a5] text-black rounded-lg p-3 text-center shadow-lg">
                  <div className="text-xs font-bold mb-1">BANCATA</div>
                  <div className="text-xs opacity-80 truncate mb-2">{event.selection}</div>
                  <div className="text-2xl sm:text-4xl font-bold my-2">{layOdd.toFixed(2)}</div>
                  <div className="text-xs">€{event.availability} liquidità</div>
                  <div className="text-xs bg-white/20 rounded px-2 py-1 mt-1">{exchangeName}</div>
                </div>
              </div>
            </div>
            {/* Right side */}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex flex-wrap gap-2 sm:gap-4 p-2 sm:p-3 bg-gray-50 rounded-lg border">
                {(['normale', 'riskfree', 'bonus'] as const).map(m => (
                  <label key={m} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={mode === m} onChange={() => setMode(m)} className="accent-brand-primary w-4 h-4" />
                    <span className="text-xs sm:text-sm font-bold text-gray-700">{m === 'normale' ? 'NORMALE' : m === 'riskfree' ? 'RISK FREE (RF)' : 'BONUS (BR)'}</span>
                  </label>
                ))}
              </div>
              <div className="space-y-2 bg-gray-50 p-3 rounded-lg border">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                  <Label className="text-xs sm:text-sm font-medium text-gray-700 sm:w-56">{bookmakerName} - IMPORTO PUNTATA</Label>
                  <div className="flex items-center gap-1"><span className="text-gray-500">€</span><Input type="text" inputMode="decimal" value={backStake} onChange={(e) => setBackStake(e.target.value.replace(',', '.'))} className="w-24 bg-white border-2 border-brand-accent font-bold" /></div>
                </div>
                {mode === 'riskfree' && (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                    <Label className="text-xs sm:text-sm font-medium text-gray-700 sm:w-56">{bookmakerName} - IMPORTO BONUS RIMBORSO</Label>
                    <div className="flex items-center gap-1"><span className="text-gray-500">€</span><Input type="text" inputMode="decimal" value={backRefundStake} onChange={(e) => setBackRefundStake(e.target.value.replace(',', '.'))} className="w-24 bg-white font-bold" /></div>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                  <Label className="text-xs sm:text-sm font-medium text-gray-700 sm:w-56">{bookmakerName} - QUOTA</Label>
                  <Input type="text" inputMode="decimal" value={backOdds} onChange={(e) => setBackOdds(e.target.value.replace(',', '.'))} className="w-24 bg-white" />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                  <Label className="text-xs sm:text-sm font-medium text-gray-700 sm:w-56">{exchangeName} - QUOTA</Label>
                  <Input type="text" inputMode="decimal" value={layOdds} onChange={(e) => setLayOdds(e.target.value.replace(',', '.'))} className="w-24 bg-white" />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                  <Label className="text-xs sm:text-sm font-medium text-gray-700 sm:w-56">{exchangeName} - COMMISSIONE</Label>
                  <div className="flex items-center gap-1"><Input type="text" inputMode="decimal" value={commission} onChange={(e) => setCommission(e.target.value.replace(',', '.'))} className="w-20 bg-white" /><span className="text-gray-500">%</span></div>
                </div>
              </div>
              <div className="bg-[#17a2b8] text-white rounded-lg p-2 shadow text-center">
                <div className="text-sm font-medium mb-1">SU {bookmakerName}</div>
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  <span className="text-xs">PUNTATA</span><span className="bg-white text-[#17a2b8] px-2 py-0.5 rounded font-bold text-sm">€{stake.toFixed(0)}</span>
                  <span className="text-xs">A QUOTA</span><span className="bg-white text-[#17a2b8] px-2 py-0.5 rounded font-bold text-sm">{backOdd.toFixed(2)}</span>
                </div>
              </div>
              <div className="bg-[#f8a5a5] text-black rounded-lg p-2 shadow text-center">
                <div className="text-sm font-medium mb-1">SU {exchangeName}</div>
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  <span className="text-xs">BANCATA</span>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-white/20" onClick={() => copyToClipboard(layStake)}>{copiedLay ? <Check size={14} /> : <Copy size={14} />}</Button>
                  <span className="bg-white text-red-600 px-2 py-0.5 rounded font-bold text-sm">€{layStake.toFixed(2)}</span>
                  <span className="text-xs">A QUOTA</span><span className="bg-white text-red-600 px-2 py-0.5 rounded font-bold text-sm">{layOdd.toFixed(2)}</span>
                </div>
                <div className="mt-2 text-sm">RESPONSABILITÀ <span className="bg-white text-red-600 px-2 py-0.5 rounded font-bold">€{liability.toFixed(2)}</span></div>
              </div>
              <div className="text-center py-3 bg-gray-50 rounded-lg border">
                <div className="text-xl sm:text-3xl font-black">GUADAGNO <span className={profit >= 0 ? 'text-green-600' : 'text-red-500'}>{profit >= 0 ? '+' : ''}€{profit.toFixed(2)}</span></div>
              </div>
              <div className="border rounded-lg overflow-x-auto shadow">
                <Table>
                  <TableHeader><TableRow className="bg-gray-100">
                    <TableHead className="font-bold text-gray-700 text-xs"></TableHead>
                    <TableHead className="text-center font-bold text-gray-700 text-xs">BOOKMAKER</TableHead>
                    <TableHead className="text-center font-bold text-gray-700 text-xs uppercase">{exchangeName}</TableHead>
                    <TableHead className="text-center font-bold text-gray-700 text-xs">TOTALE</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    <TableRow className="bg-[#d1ecf1]">
                      <TableCell className="font-bold text-[#0c5460] text-xs">SE PUNTATA VINCE</TableCell>
                      <TableCell className={`text-center font-bold text-xs ${netResultBackBackWin >= 0 ? 'text-green-600' : 'text-red-500'}`}>{netResultBackBackWin >= 0 ? '+' : ''}€{netResultBackBackWin.toFixed(0)}</TableCell>
                      <TableCell className={`text-center font-bold text-xs ${netResultBackLayWin >= 0 ? 'text-green-600' : 'text-red-500'}`}>{netResultBackLayWin >= 0 ? '+' : ''}€{netResultBackLayWin.toFixed(2)}</TableCell>
                      <TableCell className={`text-center font-black text-sm ${backWinProfit >= 0 ? 'text-green-600' : 'text-red-500'}`}>{backWinProfit >= 0 ? '+' : ''}€{backWinProfit.toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow className="bg-[#f8d7da]">
                      <TableCell className="font-bold text-[#721c24] text-xs">SE BANCATA VINCE</TableCell>
                      <TableCell className={`text-center font-bold text-xs ${netResultLayBackWin >= 0 ? 'text-green-600' : 'text-red-500'}`}>{netResultLayBackWin >= 0 ? '+' : ''}€{netResultLayBackWin.toFixed(0)}</TableCell>
                      <TableCell className="text-center font-bold text-xs text-green-600">+€{netResultLayLayWin.toFixed(2)}</TableCell>
                      <TableCell className={`text-center font-black text-sm ${layWinProfit >= 0 ? 'text-green-600' : 'text-red-500'}`}>{layWinProfit >= 0 ? '+' : ''}€{layWinProfit.toFixed(2)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============= MAIN COMPONENT =============
export default function OddsMatcherPage() {
  const [events, setEvents] = useState<OddsEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<BackendConfig | null>(null);
  
  const [totalEvents, setTotalEvents] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  
  const [sortColumn, setSortColumn] = useState<SortColumn>('rating');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // Filters
  const [exchange, setExchange] = useState<string>('betfair');
  const [selectedBookmakers, setSelectedBookmakers] = useState<string[]>(Object.keys(BOOKMAKERS));
  const [selectedSports, setSelectedSports] = useState<string[]>(Object.keys(SPORTS));
  const [selectedBetTypes, setSelectedBetTypes] = useState<string[]>(Object.keys(BET_TYPES));
  
  // Event search/hide filters
  const [searchEvents, setSearchEvents] = useState<SelectedEvent[]>([]);
  const [hideEvents, setHideEvents] = useState<SelectedEvent[]>([]);
  
  // Advanced filters
  const [showFilters, setShowFilters] = useState(false);
  const [tempFilters, setTempFilters] = useState({ rating_from: '', rating_to: '', odds_from: '', odds_to: '', min_liquidity: '', date_from: '', date_to: '' });
  const [appliedFilters, setAppliedFilters] = useState<Record<string, string>>({});
  const [activeFilters, setActiveFilters] = useState(false);
  
  // Settings
  const [showRfSettings, setShowRfSettings] = useState(false);
  const [showCommission, setShowCommission] = useState(false);
  const [rfSettings, setRfSettings] = useState({ refund: '100', back_stake: '100' });
  const [commissions, setCommissions] = useState({ betfair: '0.045', betflag: '0.05' });

  const [calculatorEvent, setCalculatorEvent] = useState<OddsEvent | null>(null);
  const [showCalculator, setShowCalculator] = useState(false);

  // Fetch config on mount
  useEffect(() => {
    const fetchConfig = async () => {
      const response = await backendAPI.getConfig();
      if (response.success && response.data) {
        setConfig(response.data);
        setRfSettings({ refund: String(response.data.defaults.refund), back_stake: String(response.data.defaults.back_stake) });
        setCommissions({ betfair: String(response.data.defaults.betfair_commission), betflag: String(response.data.defaults.betflag_commission) });
      }
    };
    fetchConfig();
  }, []);

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  // Sort events locally
  const sortEventsLocal = useCallback((eventsToSort: OddsEvent[]) => {
    return [...eventsToSort].sort((a, b) => {
      let aVal: string | number, bVal: string | number;
      switch (sortColumn) {
        case 'date': aVal = a.open_date || ''; bVal = b.open_date || ''; break;
        case 'event': aVal = a.event || ''; bVal = b.event || ''; break;
        case 'selection': aVal = a.selection || ''; bVal = b.selection || ''; break;
        case 'rating': aVal = parseFloat(a.rating) || 0; bVal = parseFloat(b.rating) || 0; break;
        case 'snr': aVal = parseFloat(a.snr) || 0; bVal = parseFloat(b.snr) || 0; break;
        case 'bookmaker': aVal = BOOKMAKERS[a.bookie_id] || ''; bVal = BOOKMAKERS[b.bookie_id] || ''; break;
        case 'back_odd': aVal = parseFloat(a.back_odd) || 0; bVal = parseFloat(b.back_odd) || 0; break;
        case 'exchange': aVal = a.exchange || ''; bVal = b.exchange || ''; break;
        case 'lay_odd': aVal = parseFloat(a.lay_odd) || 0; bVal = parseFloat(b.lay_odd) || 0; break;
        case 'liquidity': aVal = parseFloat(a.availability) || 0; bVal = parseFloat(b.availability) || 0; break;
        default: return 0;
      }
      if (typeof aVal === 'string') { const cmp = aVal.localeCompare(bVal as string); return sortDirection === 'asc' ? cmp : -cmp; }
      return sortDirection === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
  }, [sortColumn, sortDirection]);

  // Fetch events from backend
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const apiParams: Record<string, any> = {
        exchange: exchange,
        back_stake: parseInt(rfSettings.back_stake) || 100,
        refund: parseInt(rfSettings.refund) || 100,
        offset: (currentPage - 1) * pageSize,
        sort_column: 4,
        sort_direction: 'desc',
        betfair_commission: parseFloat(commissions.betfair) || 0.045,
        betflag_commission: parseFloat(commissions.betflag) || 0.05,
      };
      
      // Bookmakers: invia sempre tutti come bookies
      apiParams.bookies = Object.keys(BOOKMAKERS);
      
      // Filterbookies: solo se NON tutti selezionati
      if (selectedBookmakers.length < Object.keys(BOOKMAKERS).length && selectedBookmakers.length > 0) {
        apiParams.filterbookies = selectedBookmakers;
      }
      
      // Sport: solo se NON tutti selezionati
      if (selectedSports.length > 0 && selectedSports.length < Object.keys(SPORTS).length) {
        apiParams.sport = selectedSports;
      }
      
      // Bet Type: solo se NON tutti selezionati
      if (selectedBetTypes.length > 0 && selectedBetTypes.length < Object.keys(BET_TYPES).length) {
        apiParams.bet_type = selectedBetTypes;
      }
      
      // Event search filter (name)
      if (searchEvents.length > 0) {
        apiParams.name = searchEvents.map(e => e.ids);
      }
      
      // Event hide filter (name2)
      if (hideEvents.length > 0) {
        apiParams.name2 = hideEvents.map(e => e.ids);
      }
      
      // Advanced filters
      if (appliedFilters.rating_from) apiParams.rating_from = appliedFilters.rating_from;
      if (appliedFilters.rating_to) apiParams.rating_to = appliedFilters.rating_to;
      if (appliedFilters.odds_from) apiParams.odds_from = appliedFilters.odds_from;
      if (appliedFilters.odds_to) apiParams.odds_to = appliedFilters.odds_to;
      if (appliedFilters.min_liquidity) apiParams.min_liquidity = appliedFilters.min_liquidity;
      if (appliedFilters.date_from) apiParams.date_from = appliedFilters.date_from;
      if (appliedFilters.date_to) apiParams.date_to = appliedFilters.date_to;
      
      console.log('🔍 Fetching with params:', apiParams);
      
      const response = await backendAPI.getOddsMatcher(apiParams);
      
      console.log('📊 Response:', response);
      
      if (response.success && response.data) {
        let filteredEvents = response.data.data || [];
        filteredEvents = sortEventsLocal(filteredEvents);
        setEvents(filteredEvents);
        setTotalEvents(response.data.allEventsCount || filteredEvents.length);
      } else {
        setError(response.error || 'Errore nel caricamento dati');
        setEvents([]);
      }
    } catch (err) {
      console.error('❌ Fetch error:', err);
      setError('Errore di connessione al backend');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [
    exchange, rfSettings, commissions, currentPage, pageSize, 
    selectedBookmakers, selectedSports, selectedBetTypes,
    searchEvents, hideEvents, appliedFilters, sortEventsLocal
  ]);

  // Fetch on dependencies change
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Apply advanced filters
  const applyFilters = () => {
    const newApplied: Record<string, string> = {};
    if (tempFilters.rating_from) newApplied.rating_from = tempFilters.rating_from;
    if (tempFilters.rating_to) newApplied.rating_to = tempFilters.rating_to;
    if (tempFilters.odds_from) newApplied.odds_from = tempFilters.odds_from;
    if (tempFilters.odds_to) newApplied.odds_to = tempFilters.odds_to;
    if (tempFilters.min_liquidity) newApplied.min_liquidity = tempFilters.min_liquidity;
    if (tempFilters.date_from) newApplied.date_from = tempFilters.date_from;
    if (tempFilters.date_to) newApplied.date_to = tempFilters.date_to;
    setAppliedFilters(newApplied);
    setActiveFilters(Object.keys(newApplied).length > 0);
    setShowFilters(false);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setTempFilters({ rating_from: '', rating_to: '', odds_from: '', odds_to: '', min_liquidity: '', date_from: '', date_to: '' });
    setAppliedFilters({});
    setSelectedSports(Object.keys(SPORTS));
    setSelectedBetTypes(Object.keys(BET_TYPES));
    setSelectedBookmakers(Object.keys(BOOKMAKERS));
    setSearchEvents([]);
    setHideEvents([]);
    setActiveFilters(false);
    setCurrentPage(1);
  };

  const formatRating = (rating: string) => {
    const value = parseFloat(rating);
    if (value >= 100) return <span className="bg-red-500 text-white px-2 py-0.5 rounded text-xs font-bold">{value.toFixed(2)}</span>;
    return <span className="text-xs font-medium">{value.toFixed(2)}</span>;
  };

  const totalPages = Math.ceil(totalEvents / pageSize) || 1;
  const sportIcons = Object.fromEntries(Object.entries(SPORTS).map(([k, v]) => [k, v.icon]));
  const sportNames = Object.fromEntries(Object.entries(SPORTS).map(([k, v]) => [k, v.name]));

  return (
    <AuthGuard>
    <SubscriptionGuard>
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
          <div className="text-center mb-4 sm:mb-6">
            <h1 className="text-xl sm:text-3xl font-bold text-gray-800">Oddsmatcher</h1>
            <p className="text-gray-500 mt-1 text-xs sm:text-base">Per visualizzare rating superiori a 100%, acquista <span className="text-brand-accent font-bold">BetMaster Pro</span></p>
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 justify-center mb-3 sm:mb-4">
            <Button onClick={fetchEvents} disabled={loading} size="sm" className="bg-emerald-500 hover:bg-emerald-600">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </Button>

            <Dialog open={showRfSettings} onOpenChange={setShowRfSettings}>
              <DialogTrigger asChild><Button size="sm" className="bg-brand-primary hover:bg-brand-secondary"><Settings size={14} /><span className="ml-1 hidden sm:inline">RF</span></Button></DialogTrigger>
              <DialogContent className="w-[90vw] max-w-md bg-white">
                <DialogHeader className="bg-brand-primary text-white p-3 -m-6 mb-4 rounded-t-lg"><DialogTitle>Impostazioni RF</DialogTitle></DialogHeader>
                <div className="space-y-4 py-2">
                  <div><Label>Importo Puntata (€)</Label><Input type="number" value={rfSettings.back_stake} onChange={(e) => setRfSettings(s => ({ ...s, back_stake: e.target.value }))} className="mt-1" /></div>
                  <div><Label>Importo Rimborso (€)</Label><Input type="number" value={rfSettings.refund} onChange={(e) => setRfSettings(s => ({ ...s, refund: e.target.value }))} className="mt-1" /></div>
                  <Button onClick={() => setShowRfSettings(false)} className="w-full bg-emerald-500 hover:bg-emerald-600 font-bold">Applica</Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showCommission} onOpenChange={setShowCommission}>
              <DialogTrigger asChild><Button size="sm" className="bg-brand-primary hover:bg-brand-secondary"><Settings size={14} /><span className="ml-1 hidden sm:inline">Commissione</span></Button></DialogTrigger>
              <DialogContent className="w-[90vw] max-w-md bg-white">
                <DialogHeader className="bg-brand-primary text-white p-3 -m-6 mb-4 rounded-t-lg"><DialogTitle>Commissioni Exchange</DialogTitle></DialogHeader>
                <div className="space-y-4 py-2">
                  <div><Label>Betfair (decimale, 0.045 = 4.5%)</Label><Input type="text" value={commissions.betfair} onChange={(e) => setCommissions(c => ({ ...c, betfair: e.target.value.replace(',', '.') }))} className="mt-1" /></div>
                  <div><Label>Betflag (decimale, 0.05 = 5%)</Label><Input type="text" value={commissions.betflag} onChange={(e) => setCommissions(c => ({ ...c, betflag: e.target.value.replace(',', '.') }))} className="mt-1" /></div>
                  <Button onClick={() => setShowCommission(false)} className="w-full bg-emerald-500 hover:bg-emerald-600 font-bold">Applica</Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showFilters} onOpenChange={setShowFilters}>
              <DialogTrigger asChild><Button size="sm" className="bg-brand-primary hover:bg-brand-secondary"><Filter size={14} /><span className="ml-1 hidden sm:inline">Filtra</span></Button></DialogTrigger>
              <DialogContent className="w-[95vw] max-w-lg bg-white">
                <DialogHeader className="bg-brand-primary text-white p-3 -m-6 mb-4 rounded-t-lg"><DialogTitle>Filtri Avanzati</DialogTitle></DialogHeader>
                <div className="space-y-3 py-2">
                  <div className="grid grid-cols-3 gap-2 items-center">
                    <Label className="text-sm">Rating (%)</Label>
                    <div className="flex items-center gap-1"><span className="text-xs">da</span><Input type="number" value={tempFilters.rating_from} onChange={(e) => setTempFilters(f => ({ ...f, rating_from: e.target.value }))} /></div>
                    <div className="flex items-center gap-1"><span className="text-xs">a</span><Input type="number" value={tempFilters.rating_to} onChange={(e) => setTempFilters(f => ({ ...f, rating_to: e.target.value }))} /></div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 items-center">
                    <Label className="text-sm">Quote</Label>
                    <div className="flex items-center gap-1"><span className="text-xs">da</span><Input type="number" step="0.01" value={tempFilters.odds_from} onChange={(e) => setTempFilters(f => ({ ...f, odds_from: e.target.value }))} /></div>
                    <div className="flex items-center gap-1"><span className="text-xs">a</span><Input type="number" step="0.01" value={tempFilters.odds_to} onChange={(e) => setTempFilters(f => ({ ...f, odds_to: e.target.value }))} /></div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 items-center">
                    <Label className="text-sm">Liquidità Min.</Label>
                    <div className="flex items-center gap-1 col-span-2"><span className="text-xs">€</span><Input type="number" value={tempFilters.min_liquidity} onChange={(e) => setTempFilters(f => ({ ...f, min_liquidity: e.target.value }))} /></div>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button onClick={applyFilters} className="flex-1 bg-emerald-500 hover:bg-emerald-600 font-bold">Applica</Button>
                    <Button onClick={clearFilters} variant="outline" className="flex-1 font-bold">Cancella</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600"><ExternalLink size={14} /><span className="ml-1 hidden sm:inline">Dutcher</span></Button>
            {activeFilters && <Button variant="outline" size="sm" onClick={clearFilters}><X size={14} /></Button>}
          </div>

          {/* Filters Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end mb-3 max-w-3xl mx-auto">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-500">Sport</span>
              <MultiSelect options={sportNames} selected={selectedSports} onChange={setSelectedSports} placeholder="Sport" allLabel="Tutti" showIcons icons={sportIcons} />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-500">Scommessa</span>
              <MultiSelect options={BET_TYPES} selected={selectedBetTypes} onChange={setSelectedBetTypes} placeholder="Scommessa" allLabel="Tutte" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-500">Bookmaker</span>
              <MultiSelect options={BOOKMAKERS} selected={selectedBookmakers} onChange={setSelectedBookmakers} placeholder="Bookmaker" allLabel="Tutti" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-500">Exchange</span>
              <Select value={exchange} onValueChange={(v) => { setExchange(v); setCurrentPage(1); }}>
                <SelectTrigger className="bg-white text-sm h-9"><SelectValue placeholder="Exchange" /></SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="all">Tutti</SelectItem>
                  <SelectItem value="betfair">Betfair</SelectItem>
                  <SelectItem value="betflag">Betflag</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Search Row */}
          <div className="flex flex-wrap items-end gap-3 justify-center">
            <div className="w-[220px]">
              <EventAutocomplete
                placeholder="Cerca partita/competizione"
                selectedEvents={searchEvents}
                onEventsChange={setSearchEvents}
                variant="search"
              />
            </div>
            <div className="w-[220px]">
              <EventAutocomplete
                placeholder="Nascondi partita/competizione"
                selectedEvents={hideEvents}
                onEventsChange={setHideEvents}
                variant="hide"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-4">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg mb-3 flex items-center gap-2 text-sm"><AlertCircle size={18} />{error}</div>}

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20"><Loader2 size={40} className="animate-spin text-brand-primary" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-100">
                    <SortableHeader column="date" label="DATA" currentSort={sortColumn} currentDirection={sortDirection} onSort={handleSort} className="w-[80px]" />
                    <TableHead className="w-[30px] text-center"></TableHead>
                    <SortableHeader column="event" label="PARTITA" currentSort={sortColumn} currentDirection={sortDirection} onSort={handleSort} />
                    <SortableHeader column="selection" label="SCOMM." currentSort={sortColumn} currentDirection={sortDirection} onSort={handleSort} />
                    <SortableHeader column="rating" label="RATING" currentSort={sortColumn} currentDirection={sortDirection} onSort={handleSort} className="text-center" />
                    <SortableHeader column="snr" label="RF" currentSort={sortColumn} currentDirection={sortDirection} onSort={handleSort} className="text-center hidden sm:table-cell" />
                    <TableHead className="text-center w-[40px]">CALC</TableHead>
                    <SortableHeader column="bookmaker" label="BOOK" currentSort={sortColumn} currentDirection={sortDirection} onSort={handleSort} className="text-center" />
                    <SortableHeader column="back_odd" label="PUNT" currentSort={sortColumn} currentDirection={sortDirection} onSort={handleSort} className="text-center" />
                    <SortableHeader column="exchange" label="EXCH" currentSort={sortColumn} currentDirection={sortDirection} onSort={handleSort} className="text-center hidden md:table-cell" />
                    <SortableHeader column="lay_odd" label="BANC" currentSort={sortColumn} currentDirection={sortDirection} onSort={handleSort} className="text-center" />
                    <SortableHeader column="liquidity" label="LIQ" currentSort={sortColumn} currentDirection={sortDirection} onSort={handleSort} className="hidden lg:table-cell" />
                    <TableHead className="text-center w-[40px] hidden sm:table-cell"><Clock size={14} className="mx-auto text-gray-500" /></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.length === 0 ? (
                    <TableRow><TableCell colSpan={13} className="text-center py-10 text-gray-500">Nessun evento trovato. Verifica i filtri o attendi il caricamento.</TableCell></TableRow>
                  ) : (
                    events.map((event, index) => (
                      <TableRow key={event.id || index} className={event.is_hidden ? 'bg-gray-50' : 'hover:bg-blue-50'}>
                        <TableCell className="text-xs p-1">{event.is_hidden ? '🔒' : <>{event.open_date?.split(' ')[0]?.substring(5)}<br/><span className="text-gray-500">{event.open_date?.split(' ')[1]?.substring(0, 5)}</span></>}</TableCell>
                        <TableCell className="text-center text-lg p-1">{SPORTS[event.sport_id]?.icon || '⚽'}</TableCell>
                        <TableCell className="p-1">{event.is_hidden ? '🔒' : <div><div className="font-medium text-xs truncate max-w-[150px]">{event.event}</div><div className="text-xs text-gray-500 truncate max-w-[150px] hidden sm:block">{event.competition}</div></div>}</TableCell>
                        <TableCell className="text-xs p-1">{event.is_hidden ? '🔒' : <span className="truncate block max-w-[80px]">{event.selection}</span>}</TableCell>
                        <TableCell className="text-center p-1">{formatRating(event.rating)}</TableCell>
                        <TableCell className="text-center text-xs hidden sm:table-cell">{parseFloat(event.snr).toFixed(2)}</TableCell>
                        <TableCell className="text-center p-1">{event.is_hidden ? '🔒' : <Button variant="ghost" size="sm" onClick={() => { setCalculatorEvent(event); setShowCalculator(true); }} className="h-6 w-6 p-0"><Calculator size={16} className="text-brand-primary" /></Button>}</TableCell>
                        <TableCell className="text-center p-1"><div className="bg-amber-400 text-black px-1 py-0.5 rounded text-[10px] font-bold inline-block truncate max-w-[60px]">{BOOKMAKERS[event.bookie_id] || event.bookie_id}</div></TableCell>
                        <TableCell className="text-center p-1">{event.is_hidden ? '🔒' : <span className="font-mono font-bold text-xs">{event.back_odd}</span>}</TableCell>
                        <TableCell className="text-center hidden md:table-cell p-1"><div className={`${event.exchange === 'betfair' ? 'bg-yellow-300' : 'bg-cyan-300'} text-black px-1 py-0.5 rounded text-[10px] font-bold`}>{event.exchange === 'betfair' ? 'BF' : 'BFL'}</div></TableCell>
                        <TableCell className="text-center p-1">{event.is_hidden ? '🔒' : <span className="font-mono font-bold text-xs">{event.lay_odd}</span>}</TableCell>
                        <TableCell className="text-xs hidden lg:table-cell p-1">{event.is_hidden ? '🔒' : `€${event.availability}`}</TableCell>
                        <TableCell className="text-center text-xs text-gray-500 hidden sm:table-cell p-1">{event.update_time}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="mt-3 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="text-xs text-gray-600"><strong>{totalEvents.toLocaleString()}</strong> eventi • Pag. <strong>{currentPage}</strong> di <strong>{totalPages}</strong></div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1 || loading} className="text-xs px-2">Prec</Button>
            <span className="text-sm font-medium px-2">{currentPage}/{totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || loading} className="text-xs px-2">Succ</Button>
          </div>
        </div>
      </div>

      <CalculatorModal event={calculatorEvent} isOpen={showCalculator} onClose={() => setShowCalculator(false)} defaultStake={parseInt(rfSettings.back_stake) || 100} defaultCommission={parseFloat(commissions.betfair) || 0.045} />
    </div>
    </SubscriptionGuard>
    </AuthGuard>
  );
}

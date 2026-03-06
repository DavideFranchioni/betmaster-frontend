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
  Lock,
  EyeOff,
  Trash2
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
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { dutcherAPI } from '@/lib/api/dutcher';
import type { DutcherEvent, DutcherFilters } from '@/types/dutcher';
import type { EventSearchResult } from '@/types/oddsmatcher';

// ============= CONSTANTS =============
const BOOKMAKERS: Record<string, string> = {
  '1': '888sport', '2': 'Bet365', '4': 'Betfairsportbook', '5': 'Betflagsportbook',
  '6': 'Lottomatica', '7': 'Bwin', '9': 'Eurobet', '11': 'Giocodigitale',
  '14': 'Netbet', '15': 'Sisal', '16': 'Snai', '20': 'Williamhill',
  '24': 'Stanleybet', '28': 'Goldbet', '30': 'Quigioco', '32': 'Domusbet',
  '35': 'Leovegas', '39': 'Planetwin365', '41': 'Starvegas', '44': 'Marathonbet',
  '53': 'E-play24', '54': 'Pokerstars', '57': 'Admiral', '64': 'Starcasino',
  '65': 'Betsson', '66': 'Daznbet', '101': 'Betfairexchange', '102': 'Betflagexchange',
  '104': 'Codere', '105': 'Betpassion', '106': 'Gioca7', '107': 'Zonagioco',
};

// Bookmaker website URLs
const BOOKMAKER_WEBSITES: Record<string, string> = {
  '1': 'https://www.888sport.it', '2': 'https://www.bet365.it', 
  '4': 'https://www.betfair.it/sport', '5': 'https://www.betflag.it/sport',
  '6': 'https://www.lottomatica.it/scommesse', '7': 'https://sports.bwin.it',
  '9': 'https://www.eurobet.it', '11': 'https://www.giocodigitale.it',
  '14': 'https://www.netbet.it', '15': 'https://www.sisal.it/scommesse',
  '16': 'https://www.snai.it', '20': 'https://sports.williamhill.it',
  '24': 'https://www.stanleybet.it', '28': 'https://www.goldbet.it',
  '30': 'https://www.quigioco.it', '32': 'https://www.domusbet.it',
  '35': 'https://www.leovegas.it', '39': 'https://www.planetwin365.it',
  '41': 'https://www.starvegas.it', '44': 'https://www.marathonbet.it',
  '53': 'https://www.e-play24.it', '54': 'https://www.pokerstars.it/sports',
  '57': 'https://www.admiralbet.it', '64': 'https://www.starcasino.it',
  '65': 'https://www.betsson.it', '66': 'https://www.daznbet.it',
  '101': 'https://www.betfair.it/exchange', '102': 'https://www.betflag.it/exchange',
  '104': 'https://www.codere.it', '105': 'https://www.betpassion.it',
  '106': 'https://www.gioca7.it', '107': 'https://www.zonagioco.it',
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
  'sh_home': '2º Tempo - 1', 'sh_draw': '2º Tempo - X', 'sh_away': '2º Tempo - 2',
  'goal': 'Goal', 'no_goal': 'No Goal',
  'fh_goal': '1º Tempo - Goal', 'fh_no_goal': '1º Tempo - No Goal',
  'dc_home_draw': 'DC 1X', 'dc_draw_away': 'DC X2', 'dc_home_away': 'DC 12',
  'under_05': 'Under 0.5', 'over_05': 'Over 0.5',
  'under_15': 'Under 1.5', 'over_15': 'Over 1.5',
  'under_25': 'Under 2.5', 'over_25': 'Over 2.5',
  'under_35': 'Under 3.5', 'over_35': 'Over 3.5',
  'under_45': 'Under 4.5', 'over_45': 'Over 4.5',
  'under_55': 'Under 5.5', 'over_55': 'Over 5.5',
};

// Sort column mapping - frontend index to backend column
const SORT_COLUMN_MAP: Record<SortColumn, number> = {
  'date': 1,
  'event': 2,
  'rating': 4,
  'snr': 5,
  'bookmaker1': 6,
  'bookmaker2': 9,
  'bookmaker3': 12,
};

type SortColumn = 'date' | 'event' | 'rating' | 'snr' | 'bookmaker1' | 'bookmaker2' | 'bookmaker3';
type SortDirection = 'asc' | 'desc';

interface SelectedEvent {
  name: string;
  ids: string;
}

// ============= UTILITY FUNCTIONS =============
function roundTo(num: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(num * factor) / factor;
}

// Base64 encode/decode for Unicode strings (like NinjaBet)
function b64EncodeUnicode(str: string): string {
  return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode(parseInt(p1, 16))));
}

function b64DecodeUnicode(str: string): string {
  return decodeURIComponent(Array.prototype.map.call(atob(str), (c: string) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
}

// Parse URL parameters
function getLocationParams(): Record<string, string> {
  const params: Record<string, string> = {};
  if (typeof window === 'undefined') return params;
  const search = window.location.search.substring(1);
  if (!search) return params;
  search.split('&').forEach(pair => {
    const [key, value] = pair.split('=');
    if (key && value) {
      params[decodeURIComponent(key)] = decodeURIComponent(value.replace(/\+/g, ' '));
    }
  });
  return params;
}

// LocalStorage helpers
function saveToStorage(key: string, value: unknown): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`dutcher_${key}`, JSON.stringify(value));
  }
}

function loadFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  const stored = localStorage.getItem(`dutcher_${key}`);
  if (!stored) return defaultValue;
  try {
    return JSON.parse(stored) as T;
  } catch {
    return defaultValue;
  }
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
      const response = await dutcherAPI.searchEvents(query);
      if (response.success && response.data) {
        setSuggestions(response.data);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      console.error('Search error:', error);
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Backspace removes last tag when input is empty
    if (e.key === 'Backspace' && inputValue === '' && selectedEvents.length > 0) {
      onEventsChange(selectedEvents.slice(0, -1));
    }
  };

  const bgColor = variant === 'hide' ? 'bg-red-50 border-red-200' : 'bg-white';
  const tagColor = variant === 'hide' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white';

  return (
    <div className="relative" ref={containerRef}>
      <div className={`min-h-[40px] border rounded-md p-1 flex flex-wrap gap-1 items-center ${bgColor}`}>
        {selectedEvents.map((event) => (
          <span key={event.ids} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${tagColor}`}>
            <span className="truncate max-w-[100px]">{event.name}</span>
            <X className="w-3 h-3 cursor-pointer hover:opacity-70" onClick={() => handleRemoveEvent(event.ids)} />
          </span>
        ))}
        
        <input
          type="text"
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => inputValue.length >= 3 && setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder={selectedEvents.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] outline-none text-sm bg-transparent px-1"
        />
        
        {loading && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
        
        {/* Clear all button */}
        {selectedEvents.length > 0 && (
          <button 
            onClick={() => onEventsChange([])} 
            className="p-1 hover:bg-gray-200 rounded"
            title="Cancella tutti"
          >
            <Trash2 className="w-3 h-3 text-gray-500" />
          </button>
        )}
      </div>
      
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg z-50 max-h-[200px] overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <div key={index} className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm" onClick={() => handleSelectEvent(suggestion)}>
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

// ============= DUTCHER CALCULATOR MODAL =============
function DutcherCalculatorModal({ event, isOpen, onClose, defaultStake, defaultRefund, defaultBfComm, defaultBgComm }: {
  event: DutcherEvent | null; isOpen: boolean; onClose: () => void; defaultStake: number; defaultRefund: number; defaultBfComm: number; defaultBgComm: number;
}) {
  const [mode, setMode] = useState<'normale' | 'riskfree' | 'bonus'>('normale');
  const [backStake, setBackStake] = useState(defaultStake.toString());
  const [backRefundStake, setBackRefundStake] = useState(defaultRefund.toString());
  const [odds1, setOdds1] = useState('');
  const [odds2, setOdds2] = useState('');
  const [odds3, setOdds3] = useState('');
  const [commission1, setCommission1] = useState('0.00');
  const [commission2, setCommission2] = useState('0.00');
  const [commission3, setCommission3] = useState('0.00');
  const [copiedAmount, setCopiedAmount] = useState<number | null>(null);

  useEffect(() => {
    if (event) {
      setOdds1(event.odds1 || '');
      setOdds2(event.odds2 || '');
      setOdds3(event.odds3 || '');
      setBackStake(defaultStake.toString());
      setBackRefundStake(defaultRefund.toString());
      
      // Set commissions based on bookmaker type (exchange vs sportsbook)
      setCommission1(event.bookie_id1 === '101' ? String(defaultBfComm) : event.bookie_id1 === '102' ? String(defaultBgComm) : '0.00');
      setCommission2(event.bookie_id2 === '101' ? String(defaultBfComm) : event.bookie_id2 === '102' ? String(defaultBgComm) : '0.00');
      setCommission3(event.bookie_id3 === '101' ? String(defaultBfComm) : event.bookie_id3 === '102' ? String(defaultBgComm) : '0.00');
    }
  }, [event, defaultStake, defaultRefund, defaultBfComm, defaultBgComm]);

  if (!event || !isOpen) return null;

  const stake = parseFloat(backStake) || 0;
  const bonus = parseFloat(backRefundStake) || stake;
  const backCommission1 = parseFloat(commission1) || 0;
  const backCommission2 = parseFloat(commission2) || 0;
  const backCommission3 = parseFloat(commission3) || 0;
  const odd1 = parseFloat(odds1) || 0;
  const odd2 = parseFloat(odds2) || 0;
  const odd3 = parseFloat(odds3) || 0;

  const isThreeWay = event.type === 'three-way' && odd3 > 0;

  // Calculate amounts (Punta-Punta logic from NinjaBet)
  let amount1 = stake;
  let amount2 = roundTo((stake * (1 + (odd1 - 1) * (1 - backCommission1))) / (1 + (odd2 - 1) * (1 - backCommission2)), 0);
  let amount3 = isThreeWay ? roundTo((stake * (1 + (odd1 - 1) * (1 - backCommission1))) / (1 + (odd3 - 1) * (1 - backCommission3)), 0) : 0;

  if (mode === 'riskfree') {
    amount2 = roundTo(((stake * (1 + (odd1 - 1) * (1 - backCommission1))) - bonus) / (1 + (odd2 - 1) * (1 - backCommission2)), 0);
    amount3 = isThreeWay ? roundTo(((stake * (1 + (odd1 - 1) * (1 - backCommission1))) - bonus) / (1 + (odd3 - 1) * (1 - backCommission3)), 0) : 0;
  }

  // Calculate profits for each outcome
  let bet1Bookie1Amount = roundTo((stake * (odd1 - 1) * (1 - backCommission1)), 2);
  let bet1Bookie2Amount = -1 * amount2;
  let bet1Bookie3Amount = isThreeWay ? -1 * amount3 : 0;

  let bet2Bookie1Amount = -1 * stake;
  let bet2Bookie2Amount = roundTo((amount2 * (odd2 - 1) * (1 - backCommission2)), 2);
  let bet2Bookie3Amount = isThreeWay ? -1 * amount3 : 0;

  let bet3Bookie1Amount = isThreeWay ? -1 * stake : 0;
  let bet3Bookie2Amount = isThreeWay ? -1 * amount2 : 0;
  let bet3Bookie3Amount = isThreeWay ? roundTo((amount3 * (odd3 - 1) * (1 - backCommission3)), 2) : 0;

  if (mode === 'riskfree') {
    bet2Bookie1Amount = bonus - stake;
    bet3Bookie1Amount = isThreeWay ? bonus - stake : 0;
  } else if (mode === 'bonus') {
    bet1Bookie1Amount = roundTo((stake * odd1) * (1 - backCommission1), 2);
    bet2Bookie1Amount = 0;
    bet3Bookie1Amount = 0;
  }

  let bet1Profit = bet1Bookie1Amount + bet1Bookie2Amount + bet1Bookie3Amount;
  let bet2Profit = bet2Bookie1Amount + bet2Bookie2Amount + bet2Bookie3Amount;
  let bet3Profit = bet3Bookie1Amount + bet3Bookie2Amount + bet3Bookie3Amount;

  // Rating calculations
  let rating1 = ((stake + bet1Profit) * 100) / stake;
  let rating2 = ((stake + bet2Profit) * 100) / stake;
  let rating3 = isThreeWay ? ((stake + bet3Profit) * 100) / stake : 0;

  if (mode === 'bonus') {
    rating1 = (bet1Profit * 100) / stake;
    rating2 = (bet2Profit * 100) / stake;
    rating3 = isThreeWay ? (bet3Profit * 100) / stake : 0;
  } else if (mode === 'riskfree') {
    rating1 = (bet1Profit * 100) / bonus;
    rating2 = (bet2Profit * 100) / bonus;
    rating3 = isThreeWay ? (bet3Profit * 100) / bonus : 0;
  }

  const bookmaker1Name = BOOKMAKERS[event.bookie_id1] || event.bookie_id1;
  const bookmaker2Name = BOOKMAKERS[event.bookie_id2] || event.bookie_id2;
  const bookmaker3Name = event.bookie_id3 ? (BOOKMAKERS[event.bookie_id3] || event.bookie_id3) : '';
  
  const bookie1Url = BOOKMAKER_WEBSITES[event.bookie_id1] || '#';
  const bookie2Url = BOOKMAKER_WEBSITES[event.bookie_id2] || '#';
  const bookie3Url = event.bookie_id3 ? (BOOKMAKER_WEBSITES[event.bookie_id3] || '#') : '#';

  const copyToClipboard = async (value: number, index: number) => {
    try {
      await navigator.clipboard.writeText(value.toFixed(2));
      setCopiedAmount(index);
      setTimeout(() => setCopiedAmount(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatProfit = (profit: number) => {
    const color = profit >= 0 ? 'text-green-600' : 'text-red-500';
    const sign = profit >= 0 ? '+' : '';
    return <span className={color}>{sign}€{roundTo(Math.abs(profit), 2)}</span>;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-5xl max-h-[95vh] overflow-y-auto bg-white border-0 shadow-2xl p-0">
        <DialogHeader className="bg-brand-primary text-white p-3 sm:p-4 sticky top-0 z-10">
          <DialogTitle className="text-base sm:text-xl font-bold pr-8 truncate">Calcolatore Punta-Punta - {event.event}</DialogTitle>
        </DialogHeader>
        <div className="p-3 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Left side */}
            <div className="space-y-3 sm:space-y-4">
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 space-y-2 border text-sm">
                <div className="flex items-center justify-between"><span className="text-gray-600"><Clock size={14} className="inline mr-1" />Data/Ora</span><span className="font-semibold text-xs sm:text-sm">{event.open_date}</span></div>
                <div className="flex items-center justify-between"><span className="text-gray-600">{SPORTS[event.sport_id]?.icon || '⚽'} Partita</span><span className="font-semibold text-xs sm:text-sm text-right max-w-[60%] truncate">{event.event}</span></div>
                <div className="flex items-center justify-between"><span className="text-gray-600">Rating (%)</span><span className="font-semibold">{event.rating}</span></div>
                <div className="flex items-center justify-between"><span className="text-gray-600">Competizione</span><span className="font-semibold text-xs">{event.competition}</span></div>
                <div className="flex items-center justify-between"><span className="text-gray-600">Paese</span><span className="font-semibold text-xs">{event.country}</span></div>
              </div>
              
              {/* Odds cards with bookie links */}
              <div className={`grid ${isThreeWay ? 'grid-cols-3' : 'grid-cols-2'} gap-2`}>
                <div className="bg-[#00AEAF] text-white rounded-lg p-3 text-center shadow-lg">
                  <div className="text-xs font-bold mb-1">PUNTATA 1</div>
                  <div className="text-xs opacity-80 truncate mb-2">{event.selection1}</div>
                  <div className="text-xl sm:text-2xl font-bold my-2">{odd1.toFixed(2)}</div>
                  <a 
                    href={`https://href.li/?${bookie1Url}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs bg-white/20 rounded px-2 py-1 truncate mt-2 block hover:bg-white/30 transition"
                  >
                    {bookmaker1Name} <ExternalLink size={10} className="inline ml-1" />
                  </a>
                </div>
                <div className="bg-[#00AEAF] text-white rounded-lg p-3 text-center shadow-lg">
                  <div className="text-xs font-bold mb-1">PUNTATA 2</div>
                  <div className="text-xs opacity-80 truncate mb-2">{event.selection2}</div>
                  <div className="text-xl sm:text-2xl font-bold my-2">{odd2.toFixed(2)}</div>
                  <a 
                    href={`https://href.li/?${bookie2Url}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs bg-white/20 rounded px-2 py-1 truncate mt-2 block hover:bg-white/30 transition"
                  >
                    {bookmaker2Name} <ExternalLink size={10} className="inline ml-1" />
                  </a>
                </div>
                {isThreeWay && (
                  <div className="bg-[#00AEAF] text-white rounded-lg p-3 text-center shadow-lg">
                    <div className="text-xs font-bold mb-1">PUNTATA 3</div>
                    <div className="text-xs opacity-80 truncate mb-2">{event.selection3}</div>
                    <div className="text-xl sm:text-2xl font-bold my-2">{odd3.toFixed(2)}</div>
                    <a 
                      href={`https://href.li/?${bookie3Url}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs bg-white/20 rounded px-2 py-1 truncate mt-2 block hover:bg-white/30 transition"
                    >
                      {bookmaker3Name} <ExternalLink size={10} className="inline ml-1" />
                    </a>
                  </div>
                )}
              </div>
            </div>
            
            {/* Right side */}
            <div className="space-y-3 sm:space-y-4">
              {/* Mode selection */}
              <div className="flex flex-wrap gap-2 sm:gap-4 p-2 sm:p-3 bg-gray-50 rounded-lg border">
                {(['normale', 'riskfree', 'bonus'] as const).map(m => (
                  <label key={m} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={mode === m} onChange={() => setMode(m)} className="accent-brand-primary w-4 h-4" />
                    <span className="text-xs sm:text-sm font-bold text-gray-700">{m === 'normale' ? 'NORMALE' : m === 'riskfree' ? 'RISK FREE (RF)' : 'BONUS (BR)'}</span>
                  </label>
                ))}
              </div>
              
              {/* Input fields */}
              <div className="space-y-2 bg-gray-50 p-3 rounded-lg border">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                  <Label className="text-xs sm:text-sm font-medium text-gray-700 sm:w-56">PUNTATA 1 - IMPORTO PUNTATA</Label>
                  <div className="flex items-center gap-1"><span className="text-gray-500">€</span><Input type="text" inputMode="decimal" value={backStake} onChange={(e) => setBackStake(e.target.value.replace(',', '.'))} className="w-24 bg-white border-2 border-brand-accent font-bold" /></div>
                </div>
                {mode === 'riskfree' && (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                    <Label className="text-xs sm:text-sm font-medium text-gray-700 sm:w-56">PUNTATA 1 - IMPORTO BONUS RIMBORSO</Label>
                    <div className="flex items-center gap-1"><span className="text-gray-500">€</span><Input type="text" inputMode="decimal" value={backRefundStake} onChange={(e) => setBackRefundStake(e.target.value.replace(',', '.'))} className="w-24 bg-white font-bold" /></div>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                  <Label className="text-xs sm:text-sm font-medium text-gray-700 sm:w-56">PUNTATA 1 - QUOTA</Label>
                  <Input type="text" inputMode="decimal" value={odds1} onChange={(e) => setOdds1(e.target.value.replace(',', '.'))} className="w-24 bg-white" />
                </div>
                {(event.bookie_id1 === '101' || event.bookie_id1 === '102') && (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                    <Label className="text-xs sm:text-sm font-medium text-gray-700 sm:w-56">PUNTATA 1 - COMMISSIONE</Label>
                    <Input type="text" inputMode="decimal" value={commission1} onChange={(e) => setCommission1(e.target.value.replace(',', '.'))} className="w-24 bg-white" />
                  </div>
                )}
                
                <div className="border-t pt-2 mt-2">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                    <Label className="text-xs sm:text-sm font-medium text-gray-700 sm:w-56">PUNTATA 2 - QUOTA</Label>
                    <Input type="text" inputMode="decimal" value={odds2} onChange={(e) => setOdds2(e.target.value.replace(',', '.'))} className="w-24 bg-white" />
                  </div>
                  {(event.bookie_id2 === '101' || event.bookie_id2 === '102') && (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-2">
                      <Label className="text-xs sm:text-sm font-medium text-gray-700 sm:w-56">PUNTATA 2 - COMMISSIONE</Label>
                      <Input type="text" inputMode="decimal" value={commission2} onChange={(e) => setCommission2(e.target.value.replace(',', '.'))} className="w-24 bg-white" />
                    </div>
                  )}
                </div>
                
                {isThreeWay && (
                  <div className="border-t pt-2 mt-2">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                      <Label className="text-xs sm:text-sm font-medium text-gray-700 sm:w-56">PUNTATA 3 - QUOTA</Label>
                      <Input type="text" inputMode="decimal" value={odds3} onChange={(e) => setOdds3(e.target.value.replace(',', '.'))} className="w-24 bg-white" />
                    </div>
                    {(event.bookie_id3 === '101' || event.bookie_id3 === '102') && (
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-2">
                        <Label className="text-xs sm:text-sm font-medium text-gray-700 sm:w-56">PUNTATA 3 - COMMISSIONE</Label>
                        <Input type="text" inputMode="decimal" value={commission3} onChange={(e) => setCommission3(e.target.value.replace(',', '.'))} className="w-24 bg-white" />
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Betting instructions with bookie links */}
              <a 
                href={`https://href.li/?${bookie1Url}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block bg-[#00AEAF] text-white rounded-lg p-2 shadow text-center hover:bg-[#009999] transition"
              >
                <div className="text-sm font-medium mb-1">SU {bookmaker1Name} {event.selection1} <ExternalLink size={12} className="inline ml-1" /></div>
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  <span className="text-xs">PUNTATA 1</span>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-white/20" onClick={(e) => { e.preventDefault(); e.stopPropagation(); copyToClipboard(amount1, 1); }}>{copiedAmount === 1 ? <Check size={14} /> : <Copy size={14} />}</Button>
                  <span className="bg-white text-[#00AEAF] px-2 py-0.5 rounded font-bold text-sm">€{amount1.toFixed(0)}</span>
                  <span className="text-xs">A QUOTA</span><span className="bg-white text-[#00AEAF] px-2 py-0.5 rounded font-bold text-sm">{odd1.toFixed(2)}</span>
                </div>
              </a>
              
              <a 
                href={`https://href.li/?${bookie2Url}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block bg-[#00AEAF] text-white rounded-lg p-2 shadow text-center hover:bg-[#009999] transition"
              >
                <div className="text-sm font-medium mb-1">SU {bookmaker2Name} {event.selection2} <ExternalLink size={12} className="inline ml-1" /></div>
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  <span className="text-xs">PUNTATA 2</span>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-white/20" onClick={(e) => { e.preventDefault(); e.stopPropagation(); copyToClipboard(amount2, 2); }}>{copiedAmount === 2 ? <Check size={14} /> : <Copy size={14} />}</Button>
                  <span className="bg-white text-[#00AEAF] px-2 py-0.5 rounded font-bold text-sm">€{amount2.toFixed(0)}</span>
                  <span className="text-xs">A QUOTA</span><span className="bg-white text-[#00AEAF] px-2 py-0.5 rounded font-bold text-sm">{odd2.toFixed(2)}</span>
                </div>
              </a>
              
              {isThreeWay && (
                <a 
                  href={`https://href.li/?${bookie3Url}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block bg-[#00AEAF] text-white rounded-lg p-2 shadow text-center hover:bg-[#009999] transition"
                >
                  <div className="text-sm font-medium mb-1">SU {bookmaker3Name} {event.selection3} <ExternalLink size={12} className="inline ml-1" /></div>
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    <span className="text-xs">PUNTATA 3</span>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-white/20" onClick={(e) => { e.preventDefault(); e.stopPropagation(); copyToClipboard(amount3, 3); }}>{copiedAmount === 3 ? <Check size={14} /> : <Copy size={14} />}</Button>
                    <span className="bg-white text-[#00AEAF] px-2 py-0.5 rounded font-bold text-sm">€{amount3.toFixed(0)}</span>
                    <span className="text-xs">A QUOTA</span><span className="bg-white text-[#00AEAF] px-2 py-0.5 rounded font-bold text-sm">{odd3.toFixed(2)}</span>
                  </div>
                </a>
              )}
              
              {/* Results summary */}
              <div className="text-center py-3 bg-gray-50 rounded-lg border">
                <div className="text-xl sm:text-2xl font-black">
                  GUADAGNO: {formatProfit(bet1Profit)} oppure {formatProfit(bet2Profit)}
                  {isThreeWay && <> oppure {formatProfit(bet3Profit)}</>}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  [ {mode === 'riskfree' ? 'RF' : 'RATING'}: {roundTo(rating1, 2)}% oppure {roundTo(rating2, 2)}%
                  {isThreeWay && <> oppure {roundTo(rating3, 2)}%</>} ]
                </div>
              </div>
              
              {/* Results table */}
              <div className="border rounded-lg overflow-x-auto shadow">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-100">
                      <TableHead className="font-bold text-gray-700 text-xs"></TableHead>
                      <TableHead className="text-center font-bold text-gray-700 text-xs">{bookmaker1Name.substring(0, 8)}</TableHead>
                      <TableHead className="text-center font-bold text-gray-700 text-xs">{bookmaker2Name.substring(0, 8)}</TableHead>
                      {isThreeWay && <TableHead className="text-center font-bold text-gray-700 text-xs">{bookmaker3Name.substring(0, 8)}</TableHead>}
                      <TableHead className="text-center font-bold text-gray-700 text-xs">TOTALE</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="bg-[#d1ecf1]">
                      <TableCell className="font-bold text-[#0c5460] text-xs">SE PUNTATA 1 VINCE</TableCell>
                      <TableCell className="text-center font-bold text-xs">{formatProfit(bet1Bookie1Amount)}</TableCell>
                      <TableCell className="text-center font-bold text-xs">{formatProfit(bet1Bookie2Amount)}</TableCell>
                      {isThreeWay && <TableCell className="text-center font-bold text-xs">{formatProfit(bet1Bookie3Amount)}</TableCell>}
                      <TableCell className="text-center font-black text-sm">{formatProfit(bet1Profit)}</TableCell>
                    </TableRow>
                    <TableRow className="bg-[#d1ecf1]">
                      <TableCell className="font-bold text-[#0c5460] text-xs">SE PUNTATA 2 VINCE</TableCell>
                      <TableCell className="text-center font-bold text-xs">{formatProfit(bet2Bookie1Amount)}</TableCell>
                      <TableCell className="text-center font-bold text-xs">{formatProfit(bet2Bookie2Amount)}</TableCell>
                      {isThreeWay && <TableCell className="text-center font-bold text-xs">{formatProfit(bet2Bookie3Amount)}</TableCell>}
                      <TableCell className="text-center font-black text-sm">{formatProfit(bet2Profit)}</TableCell>
                    </TableRow>
                    {isThreeWay && (
                      <TableRow className="bg-[#d1ecf1]">
                        <TableCell className="font-bold text-[#0c5460] text-xs">SE PUNTATA 3 VINCE</TableCell>
                        <TableCell className="text-center font-bold text-xs">{formatProfit(bet3Bookie1Amount)}</TableCell>
                        <TableCell className="text-center font-bold text-xs">{formatProfit(bet3Bookie2Amount)}</TableCell>
                        <TableCell className="text-center font-bold text-xs">{formatProfit(bet3Bookie3Amount)}</TableCell>
                        <TableCell className="text-center font-black text-sm">{formatProfit(bet3Profit)}</TableCell>
                      </TableRow>
                    )}
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
export default function DutcherPage() {
  const [events, setEvents] = useState<DutcherEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [totalEvents, setTotalEvents] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  
  const [sortColumn, setSortColumn] = useState<SortColumn>('rating');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // Filters
  const NOSTRI_BOOKMAKERS = ['16', '39', '7', '28', '15', '6', '9', '2', '54', '20'];
  const [presetBookmakers, setPresetBookmakers] = useState<'tutti' | 'nostri'>('nostri');
  const [selectedBookmakers1, setSelectedBookmakers1] = useState<string[]>(NOSTRI_BOOKMAKERS);
  const [selectedBookmakers2, setSelectedBookmakers2] = useState<string[]>(NOSTRI_BOOKMAKERS);
  const [selectedBookmakers3, setSelectedBookmakers3] = useState<string[]>(NOSTRI_BOOKMAKERS);
  const [selectedSports, setSelectedSports] = useState<string[]>(Object.keys(SPORTS));
  const [selectedBetTypes, setSelectedBetTypes] = useState<string[]>(Object.keys(BET_TYPES));
  
  // Event search/hide filters
  const [searchEvents, setSearchEvents] = useState<SelectedEvent[]>([]);
  const [hideEvents, setHideEvents] = useState<SelectedEvent[]>([]);
  
  // Combinazioni filter
  const [combinazioni, setCombinazioni] = useState<'tutti' | '2' | '3'>('tutti');
  
  // Advanced filters
  const [showFilters, setShowFilters] = useState(false);
  const [tempFilters, setTempFilters] = useState({ rating_from: '', rating_to: '', odds_from: '', odds_to: '', date_from: '', date_to: '' });
  const [appliedFilters, setAppliedFilters] = useState<Record<string, string>>({});
  const [activeFilters, setActiveFilters] = useState(false);
  
  // Settings
  const [showRfSettings, setShowRfSettings] = useState(false);
  const [showStakeSettings, setShowStakeSettings] = useState(false);
  const [showCommission, setShowCommission] = useState(false);
  const [rfSettings, setRfSettings] = useState({ refund: '100', back_stake: '100' });
  const [commissions, setCommissions] = useState({ betfair: '0.045', betflag: '0.05' });

  const [calculatorEvent, setCalculatorEvent] = useState<DutcherEvent | null>(null);
  const [showCalculator, setShowCalculator] = useState(false);
  
  // Double-click protection
  const lastClickedRef = useRef<number>(0);
  const MIN_CLICK_INTERVAL = 1000; // 1 second

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedRfSettings = loadFromStorage('rfSettings', { refund: '100', back_stake: '100' });
    const savedCommissions = loadFromStorage('commissions', { betfair: '0.045', betflag: '0.05' });
    setRfSettings(savedRfSettings);
    setCommissions(savedCommissions);
    
    // Load filters from URL on mount
    const params = getLocationParams();
    if (params['rating-da']) setTempFilters(f => ({ ...f, rating_from: params['rating-da'] }));
    if (params['rating-a']) setTempFilters(f => ({ ...f, rating_to: params['rating-a'] }));
    if (params['quote-da']) setTempFilters(f => ({ ...f, odds_from: params['quote-da'] }));
    if (params['quote-a']) setTempFilters(f => ({ ...f, odds_to: params['quote-a'] }));
    if (params['data-da']) setTempFilters(f => ({ ...f, date_from: params['data-da'] }));
    if (params['data-a']) setTempFilters(f => ({ ...f, date_to: params['data-a'] }));
    if (params['combinazioni']) setCombinazioni(params['combinazioni'] as 'tutti' | '2' | '3');
    if (params['importo-puntata']) setRfSettings(s => ({ ...s, back_stake: params['importo-puntata'] }));
    if (params['importo-rimborso']) setRfSettings(s => ({ ...s, refund: params['importo-rimborso'] }));
    
    // Apply filters from URL
    const newApplied: Record<string, string> = {};
    if (params['rating-da']) newApplied.rating_from = params['rating-da'];
    if (params['rating-a']) newApplied.rating_to = params['rating-a'];
    if (params['quote-da']) newApplied.odds_from = params['quote-da'];
    if (params['quote-a']) newApplied.odds_to = params['quote-a'];
    if (params['data-da']) newApplied.date_from = params['data-da'];
    if (params['data-a']) newApplied.date_to = params['data-a'];
    if (Object.keys(newApplied).length > 0) {
      setAppliedFilters(newApplied);
      setActiveFilters(true);
    }
  }, []);

  // Save settings to localStorage when they change
  useEffect(() => {
    saveToStorage('rfSettings', rfSettings);
  }, [rfSettings]);
  
  useEffect(() => {
    saveToStorage('commissions', commissions);
  }, [commissions]);

  // Update URL when filters change
  const updateUrlParams = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    const params = new URLSearchParams();
    
    if (appliedFilters.rating_from) params.set('rating-da', appliedFilters.rating_from);
    if (appliedFilters.rating_to) params.set('rating-a', appliedFilters.rating_to);
    if (appliedFilters.odds_from) params.set('quote-da', appliedFilters.odds_from);
    if (appliedFilters.odds_to) params.set('quote-a', appliedFilters.odds_to);
    if (appliedFilters.date_from) params.set('data-da', appliedFilters.date_from);
    if (appliedFilters.date_to) params.set('data-a', appliedFilters.date_to);
    if (combinazioni !== 'tutti') params.set('combinazioni', combinazioni);
    if (rfSettings.back_stake !== '100') params.set('importo-puntata', rfSettings.back_stake);
    if (rfSettings.refund !== '100') params.set('importo-rimborso', rfSettings.refund);
    if (searchEvents.length > 0) params.set('partita', searchEvents.map(e => e.name).join(','));
    if (hideEvents.length > 0) params.set('nascosto', hideEvents.map(e => e.name).join(','));
    
    const queryString = params.toString();
    const newUrl = queryString ? `${window.location.pathname}?${queryString}` : window.location.pathname;
    window.history.pushState(null, '', newUrl);
  }, [appliedFilters, combinazioni, rfSettings, searchEvents, hideEvents]);

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
    setCurrentPage(1); // Reset to first page on sort change
  };

  // Hide event from table row
  const handleHideEvent = useCallback(async (event: DutcherEvent) => {
    try {
      // Call backend to get event data for hiding
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:5000'}/api/events/details`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: event.event, id: event.eid1 })
      });
      const data = await response.json();
      
      if (data.success && data.data && data.data.length > 0) {
        const newHideEvent: SelectedEvent = {
          name: event.event,
          ids: data.data[0].id || event.eid1
        };
        
        if (!hideEvents.some(e => e.ids === newHideEvent.ids)) {
          setHideEvents(prev => [...prev, newHideEvent]);
        }
      } else {
        // Fallback: add directly with eid1
        const newHideEvent: SelectedEvent = {
          name: event.event,
          ids: event.eid1
        };
        if (!hideEvents.some(e => e.ids === newHideEvent.ids)) {
          setHideEvents(prev => [...prev, newHideEvent]);
        }
      }
    } catch (err) {
      console.error('Error hiding event:', err);
      // Fallback: add directly with eid1
      const newHideEvent: SelectedEvent = {
        name: event.event,
        ids: event.eid1
      };
      if (!hideEvents.some(e => e.ids === newHideEvent.ids)) {
        setHideEvents(prev => [...prev, newHideEvent]);
      }
    }
  }, [hideEvents]);

  // Fetch events from backend
  const fetchEvents = useCallback(async () => {
    // Double-click protection
    const now = Date.now();
    if (now - lastClickedRef.current < MIN_CLICK_INTERVAL) {
      console.log('⚠️ Request throttled - too fast');
      return;
    }
    lastClickedRef.current = now;
    
    setLoading(true);
    setError(null);
    
    try {
      const tz = new Date().getTimezoneOffset();
      
      const apiParams: Partial<DutcherFilters> = {
        bf_comm: parseFloat(commissions.betfair) || 0.045,
        bg_comm: parseFloat(commissions.betflag) || 0.05,
        back_stake: parseInt(rfSettings.back_stake) || 100,
        back_stake2: parseInt(rfSettings.back_stake) || 100,
        refund: parseInt(rfSettings.refund) || 100,
        offset: (currentPage - 1) * pageSize,
        sort_column: SORT_COLUMN_MAP[sortColumn],
        sort_direction: sortDirection,
        combinazioni: combinazioni,
        tz: tz,
        game_play: 1,
      };
      
      // Bookies: always send all
      apiParams.bookies = Object.keys(BOOKMAKERS);
      
      // Filterbookies 1: only if not all selected
      if (selectedBookmakers1.length < Object.keys(BOOKMAKERS).length && selectedBookmakers1.length > 0) {
        apiParams.filterbookies = selectedBookmakers1;
      }
      
      // Filterbookies 2: only if not all selected
      if (selectedBookmakers2.length < Object.keys(BOOKMAKERS).length && selectedBookmakers2.length > 0) {
        apiParams.filterbookies2 = selectedBookmakers2;
      }
      
      // Filterbookies 3: only if not all selected
      if (selectedBookmakers3.length < Object.keys(BOOKMAKERS).length && selectedBookmakers3.length > 0) {
        apiParams.filterbookies3 = selectedBookmakers3;
      }
      
      // Sport: only if not all selected
      if (selectedSports.length > 0 && selectedSports.length < Object.keys(SPORTS).length) {
        apiParams.sport = selectedSports;
      }
      
      // Bet Type: only if not all selected  
      if (selectedBetTypes.length > 0 && selectedBetTypes.length < Object.keys(BET_TYPES).length) {
        apiParams['bet-type'] = selectedBetTypes;
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
      if (appliedFilters.rating_from) apiParams.rating_from = parseFloat(appliedFilters.rating_from);
      if (appliedFilters.rating_to) apiParams.rating_to = parseFloat(appliedFilters.rating_to);
      if (appliedFilters.odds_from) apiParams.odds_from = parseFloat(appliedFilters.odds_from);
      if (appliedFilters.odds_to) apiParams.odds_to = parseFloat(appliedFilters.odds_to);
      if (appliedFilters.date_from) apiParams.date_from = appliedFilters.date_from;
      if (appliedFilters.date_to) apiParams.date_to = appliedFilters.date_to;
      
      console.log('🔍 Dutcher fetching with params:', apiParams);
      
      const response = await dutcherAPI.getDutcher(apiParams);
      
      console.log('📊 Dutcher Response:', response);
      
      if (response.success && response.data) {
        setEvents(response.data.data || []);
        setTotalEvents(response.data.allEventsCount || 0);
      } else {
        setError(response.error || 'Errore nel caricamento dati');
        setEvents([]);
      }
      
      // Update URL with current filters
      updateUrlParams();
      
    } catch (err) {
      console.error('❌ Dutcher fetch error:', err);
      setError('Errore di connessione al backend');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [
    commissions, rfSettings, currentPage, pageSize, sortColumn, sortDirection, combinazioni,
    selectedBookmakers1, selectedBookmakers2, selectedBookmakers3,
    selectedSports, selectedBetTypes, searchEvents, hideEvents, appliedFilters, updateUrlParams
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
    if (tempFilters.date_from) newApplied.date_from = tempFilters.date_from;
    if (tempFilters.date_to) newApplied.date_to = tempFilters.date_to;
    setAppliedFilters(newApplied);
    setActiveFilters(Object.keys(newApplied).length > 0 || combinazioni !== 'tutti');
    setShowFilters(false);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setTempFilters({ rating_from: '', rating_to: '', odds_from: '', odds_to: '', date_from: '', date_to: '' });
    setAppliedFilters({});
    setSelectedSports(Object.keys(SPORTS));
    setSelectedBetTypes(Object.keys(BET_TYPES));
    setSelectedBookmakers1(Object.keys(BOOKMAKERS));
    setSelectedBookmakers2(Object.keys(BOOKMAKERS));
    setSelectedBookmakers3(Object.keys(BOOKMAKERS));
    setSearchEvents([]);
    setHideEvents([]);
    setCombinazioni('tutti');
    setActiveFilters(false);
    setCurrentPage(1);
    
    // Clear URL params
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', window.location.pathname);
    }
  };

  const formatRating = (rating: string) => {
    // Rating can be "96.00 - 95.40 - 97.00" format
    const values = rating.split(' - ').map(v => parseFloat(v.trim()));
    const maxValue = Math.max(...values.filter(v => !isNaN(v)));
    if (maxValue >= 100) {
      return <span className="bg-red-500 text-white px-2 py-0.5 rounded text-xs font-bold">{rating}</span>;
    }
    return <span className="text-xs font-medium">{rating}</span>;
  };

  const totalPages = Math.ceil(totalEvents / pageSize) || 1;
  const sportIcons = Object.fromEntries(Object.entries(SPORTS).map(([k, v]) => [k, v.icon]));
  const sportNames = Object.fromEntries(Object.entries(SPORTS).map(([k, v]) => [k, v.name]));

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisiblePages = 10;
    let start = 1;
    
    if (currentPage > 5 && totalPages > maxVisiblePages) {
      start = currentPage - 4;
    }
    
    const end = Math.min(start + maxVisiblePages - 1, totalPages);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  return (
    <AuthGuard>
    <SubscriptionGuard>
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
          <div className="text-center mb-4 sm:mb-6">
            <h1 className="text-xl sm:text-3xl font-bold text-gray-800">Dutcher</h1>
            <p className="text-gray-500 mt-1 text-xs sm:text-base">Combinazioni Punta-Punta (2 o 3 scommesse)</p>
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 justify-center mb-3 sm:mb-4">
            <Button onClick={fetchEvents} disabled={loading} size="sm" className="bg-emerald-500 hover:bg-emerald-600">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </Button>

            <Dialog open={showRfSettings} onOpenChange={setShowRfSettings}>
              <DialogTrigger asChild><Button size="sm" className="bg-brand-primary hover:bg-brand-secondary"><Settings size={14} /><span className="ml-1 hidden sm:inline">RF</span></Button></DialogTrigger>
              <DialogContent className="w-[90vw] max-w-md bg-white">
                <DialogHeader className="bg-brand-primary text-white px-5 py-3.5 -mx-6 -mt-6 mb-2 rounded-t-xl"><DialogTitle>Impostazioni RF (%)</DialogTitle></DialogHeader>
                <div className="space-y-4 py-2">
                  <div><Label>Importo Puntata (€)</Label><Input type="number" value={rfSettings.back_stake} onChange={(e) => setRfSettings(s => ({ ...s, back_stake: e.target.value }))} className="mt-1" /></div>
                  <div><Label>Importo Bonus Rimborso (€)</Label><Input type="number" value={rfSettings.refund} onChange={(e) => setRfSettings(s => ({ ...s, refund: e.target.value }))} className="mt-1" /></div>
                  <Button onClick={() => setShowRfSettings(false)} className="w-full bg-emerald-500 hover:bg-emerald-600 font-bold">Applica</Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showCommission} onOpenChange={setShowCommission}>
              <DialogTrigger asChild><Button size="sm" className="bg-brand-primary hover:bg-brand-secondary"><Settings size={14} /><span className="ml-1 hidden sm:inline">Commissione</span></Button></DialogTrigger>
              <DialogContent className="w-[90vw] max-w-md bg-white">
                <DialogHeader className="bg-brand-primary text-white px-5 py-3.5 -mx-6 -mt-6 mb-2 rounded-t-xl"><DialogTitle>Commissioni Exchange (%)</DialogTitle></DialogHeader>
                <div className="space-y-4 py-2">
                  <div><Label>Betfair (decimale, 0.045 = 4.5%)</Label><Input type="text" value={commissions.betfair} onChange={(e) => setCommissions(c => ({ ...c, betfair: e.target.value.replace(',', '.') }))} className="mt-1" /></div>
                  <div><Label>Betflag (decimale, 0.05 = 5%)</Label><Input type="text" value={commissions.betflag} onChange={(e) => setCommissions(c => ({ ...c, betflag: e.target.value.replace(',', '.') }))} className="mt-1" /></div>
                  <Button onClick={() => setShowCommission(false)} className="w-full bg-emerald-500 hover:bg-emerald-600 font-bold">Applica</Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showStakeSettings} onOpenChange={setShowStakeSettings}>
              <DialogTrigger asChild><Button size="sm" className="bg-brand-primary hover:bg-brand-secondary"><Settings size={14} /><span className="ml-1 hidden sm:inline">PUNTATA (€)</span></Button></DialogTrigger>
              <DialogContent className="w-[90vw] max-w-md bg-white">
                <DialogHeader className="bg-brand-primary text-white px-5 py-3.5 -mx-6 -mt-6 mb-2 rounded-t-xl"><DialogTitle>Impostazioni PUNTATA (€)</DialogTitle></DialogHeader>
                <div className="space-y-4 py-2">
                  <div><Label>Importo Puntata (€)</Label><Input type="number" value={rfSettings.back_stake} onChange={(e) => setRfSettings(s => ({ ...s, back_stake: e.target.value }))} className="mt-1" /></div>
                  <Button onClick={() => setShowStakeSettings(false)} className="w-full bg-emerald-500 hover:bg-emerald-600 font-bold">Applica</Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showFilters} onOpenChange={setShowFilters}>
              <DialogTrigger asChild><Button size="sm" className="bg-brand-primary hover:bg-brand-secondary"><Filter size={14} /><span className="ml-1 hidden sm:inline">Filtra</span></Button></DialogTrigger>
              <DialogContent className="w-[95vw] max-w-lg bg-white">
                <DialogHeader className="bg-brand-primary text-white px-5 py-3.5 -mx-6 -mt-6 mb-2 rounded-t-xl"><DialogTitle>Filtri Avanzati</DialogTitle></DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-gray-700">Rating (%)</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2"><span className="text-xs text-gray-500 w-5">da</span><Input type="number" value={tempFilters.rating_from} onChange={(e) => setTempFilters(f => ({ ...f, rating_from: e.target.value }))} placeholder="0" /></div>
                      <div className="flex items-center gap-2"><span className="text-xs text-gray-500 w-5">a</span><Input type="number" value={tempFilters.rating_to} onChange={(e) => setTempFilters(f => ({ ...f, rating_to: e.target.value }))} placeholder="100" /></div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-gray-700">Quote Bookmaker</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2"><span className="text-xs text-gray-500 w-5">da</span><Input type="number" step="0.01" value={tempFilters.odds_from} onChange={(e) => setTempFilters(f => ({ ...f, odds_from: e.target.value }))} placeholder="1.00" /></div>
                      <div className="flex items-center gap-2"><span className="text-xs text-gray-500 w-5">a</span><Input type="number" step="0.01" value={tempFilters.odds_to} onChange={(e) => setTempFilters(f => ({ ...f, odds_to: e.target.value }))} placeholder="50.00" /></div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-gray-700">Data Evento</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 w-5">da</span>
                        <DateTimePicker value={tempFilters.date_from} onChange={(v) => setTempFilters(f => ({ ...f, date_from: v }))} className="flex-1" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 w-5">a</span>
                        <DateTimePicker value={tempFilters.date_to} onChange={(v) => setTempFilters(f => ({ ...f, date_to: v }))} className="flex-1" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-gray-700">Combinazioni</Label>
                    <Select value={combinazioni} onValueChange={(v: 'tutti' | '2' | '3') => setCombinazioni(v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="tutti">Tutti</SelectItem>
                        <SelectItem value="2">2 Scommesse</SelectItem>
                        <SelectItem value="3">3 Scommesse</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button onClick={applyFilters} className="flex-1 bg-brand-accent hover:bg-brand-gold text-brand-primary font-bold">Applica</Button>
                    <Button onClick={clearFilters} variant="outline" className="flex-1 font-bold">Cancella</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button size="sm" className="bg-brand-primary hover:bg-brand-secondary" onClick={() => window.location.href = '/oddsmatcher'}>
              <ExternalLink size={14} /><span className="ml-1 hidden sm:inline">Oddsmatcher</span>
            </Button>
            {activeFilters && <Button variant="outline" size="sm" onClick={clearFilters}><X size={14} /><span className="ml-1 hidden sm:inline">Cancella filtri</span></Button>}
          </div>

          {/* Filters Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 items-end max-w-7xl mx-auto">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-500">Preset</span>
              <select
                value={presetBookmakers}
                onChange={(e) => {
                  const value = e.target.value as 'tutti' | 'nostri';
                  setPresetBookmakers(value);
                  if (value === 'nostri') {
                    setSelectedBookmakers1(NOSTRI_BOOKMAKERS);
                    setSelectedBookmakers2(NOSTRI_BOOKMAKERS);
                    setSelectedBookmakers3(NOSTRI_BOOKMAKERS);
                  } else {
                    setSelectedBookmakers1(Object.keys(BOOKMAKERS));
                    setSelectedBookmakers2(Object.keys(BOOKMAKERS));
                    setSelectedBookmakers3(Object.keys(BOOKMAKERS));
                  }
                }}
                className="border rounded-md px-2 py-1.5 text-sm bg-white h-9"
              >
                <option value="tutti">Tutti</option>
                <option value="nostri">Nostri</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-500">Sport</span>
              <MultiSelect options={sportNames} selected={selectedSports} onChange={setSelectedSports} placeholder="Sport" allLabel="Tutti" showIcons icons={sportIcons} />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-500">Scommessa</span>
              <MultiSelect options={BET_TYPES} selected={selectedBetTypes} onChange={setSelectedBetTypes} placeholder="Scommessa" allLabel="Tutte" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-500">Bookmaker 1</span>
              <MultiSelect options={BOOKMAKERS} selected={selectedBookmakers1} onChange={setSelectedBookmakers1} placeholder="Book 1" allLabel="Tutti" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-500">Bookmaker 2</span>
              <MultiSelect options={BOOKMAKERS} selected={selectedBookmakers2} onChange={setSelectedBookmakers2} placeholder="Book 2" allLabel="Tutti" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-500">Bookmaker 3</span>
              <MultiSelect options={BOOKMAKERS} selected={selectedBookmakers3} onChange={setSelectedBookmakers3} placeholder="Book 3" allLabel="Tutti" />
            </div>
          </div>

          {/* Search & Actions Row */}
          <div className="flex flex-wrap items-end gap-3 justify-center mt-3">
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
            <Button onClick={fetchEvents} size="sm" className="bg-emerald-500 hover:bg-emerald-600 h-9 px-6">Applica</Button>
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
                    <SortableHeader column="date" label="DATA/ORA" currentSort={sortColumn} currentDirection={sortDirection} onSort={handleSort} className="w-[70px]" />
                    <TableHead className="w-[30px] text-center"></TableHead>
                    <SortableHeader column="event" label="PARTITA" currentSort={sortColumn} currentDirection={sortDirection} onSort={handleSort} />
                    <SortableHeader column="rating" label="RATING" currentSort={sortColumn} currentDirection={sortDirection} onSort={handleSort} className="text-center" />
                    <SortableHeader column="snr" label="RF (%)" currentSort={sortColumn} currentDirection={sortDirection} onSort={handleSort} className="text-center hidden sm:table-cell" />
                    <TableHead className="text-center w-[40px]">CALC</TableHead>
                    <SortableHeader column="bookmaker1" label="BOOK1" currentSort={sortColumn} currentDirection={sortDirection} onSort={handleSort} className="text-center" />
                    <TableHead className="text-center">SCOMM1</TableHead>
                    <TableHead className="text-center">PUNTATA1</TableHead>
                    <SortableHeader column="bookmaker2" label="BOOK2" currentSort={sortColumn} currentDirection={sortDirection} onSort={handleSort} className="text-center" />
                    <TableHead className="text-center">SCOMM2</TableHead>
                    <TableHead className="text-center">PUNTATA2</TableHead>
                    <SortableHeader column="bookmaker3" label="BOOK3" currentSort={sortColumn} currentDirection={sortDirection} onSort={handleSort} className="text-center hidden lg:table-cell" />
                    <TableHead className="text-center hidden lg:table-cell">SCOMM3</TableHead>
                    <TableHead className="text-center hidden lg:table-cell">PUNTATA3</TableHead>
                    <TableHead className="text-center w-[40px]"><Clock size={14} className="mx-auto text-gray-500" /></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.length === 0 ? (
                    <TableRow><TableCell colSpan={16} className="text-center py-10 text-gray-500">Nessun risultato. Verifica i filtri o <a href="https://ninjaclub.ninjabet.it/topic/1250/segnalazioni-quote-oddsmatcher-e-dutcher-non-funzionanti" target="_blank" className="text-blue-500 underline">verifica lo stato delle quote</a></TableCell></TableRow>
                  ) : (
                    events.map((event, index) => (
                      <TableRow key={index} className={event.is_hidden ? 'bg-gray-50' : 'hover:bg-blue-50 group'}>
                        <TableCell className="text-xs p-1">
                          {event.is_hidden ? <Lock size={12} className="text-gray-400" /> : (
                            <>{event.open_date?.split(' ')[0]?.substring(5)}<br/><span className="text-gray-500">{event.open_date?.split(' ')[1]?.substring(0, 5)}</span></>
                          )}
                        </TableCell>
                        <TableCell className="text-center text-lg p-1">{SPORTS[event.sport_id]?.icon || '⚽'}</TableCell>
                        <TableCell className="p-1 relative">
                          {event.is_hidden ? <Lock size={12} className="text-gray-400" /> : (
                            <div className="flex items-center gap-1">
                              <div className="font-medium text-xs truncate max-w-[100px]">{event.event}</div>
                              {/* Hide button - appears on hover */}
                              <button 
                                onClick={() => handleHideEvent(event)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 rounded"
                                title="Nascondi evento"
                              >
                                <EyeOff size={12} className="text-red-500" />
                              </button>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-center p-1">{formatRating(event.rating)}</TableCell>
                        <TableCell className="text-center text-xs hidden sm:table-cell">{event.snr}</TableCell>
                        <TableCell className="text-center p-1">
                          {event.is_hidden ? <Lock size={12} className="text-gray-400" /> : (
                            <Button variant="ghost" size="sm" onClick={() => { setCalculatorEvent(event); setShowCalculator(true); }} className="h-6 w-6 p-0">
                              <Calculator size={16} className="text-brand-primary" />
                            </Button>
                          )}
                        </TableCell>
                        <TableCell className="text-center p-1">
                          <div className="bg-amber-400 text-black px-1 py-0.5 rounded text-[9px] font-bold inline-block truncate max-w-[60px]">
                            {BOOKMAKERS[event.bookie_id1]?.substring(0, 8) || event.bookie_id1}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs p-1">
                          {event.is_hidden ? <Lock size={12} className="text-gray-400" /> : <span className="truncate block max-w-[60px]">{event.selection1}</span>}
                        </TableCell>
                        <TableCell className="text-center p-1">
                          {event.is_hidden ? <Lock size={12} className="text-gray-400" /> : (
                            <span className="font-mono font-bold text-xs bg-[#00AEAF] text-white px-1 py-0.5 rounded">{event.odds1}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center p-1">
                          <div className="bg-amber-400 text-black px-1 py-0.5 rounded text-[9px] font-bold inline-block truncate max-w-[60px]">
                            {BOOKMAKERS[event.bookie_id2]?.substring(0, 8) || event.bookie_id2}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs p-1">
                          {event.is_hidden ? <Lock size={12} className="text-gray-400" /> : <span className="truncate block max-w-[60px]">{event.selection2}</span>}
                        </TableCell>
                        <TableCell className="text-center p-1">
                          {event.is_hidden ? <Lock size={12} className="text-gray-400" /> : (
                            <span className="font-mono font-bold text-xs bg-[#00AEAF] text-white px-1 py-0.5 rounded">{event.odds2}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center p-1 hidden lg:table-cell">
                          {event.bookie_id3 ? (
                            <div className="bg-amber-400 text-black px-1 py-0.5 rounded text-[9px] font-bold inline-block truncate max-w-[60px]">
                              {BOOKMAKERS[event.bookie_id3]?.substring(0, 8) || event.bookie_id3}
                            </div>
                          ) : <span className="text-gray-300">-</span>}
                        </TableCell>
                        <TableCell className="text-xs p-1 hidden lg:table-cell">
                          {event.is_hidden ? <Lock size={12} className="text-gray-400" /> : (
                            event.selection3 ? <span className="truncate block max-w-[60px]">{event.selection3}</span> : <span className="text-gray-300">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center p-1 hidden lg:table-cell">
                          {event.is_hidden ? <Lock size={12} className="text-gray-400" /> : (
                            event.odds3 ? (
                              <span className="font-mono font-bold text-xs bg-[#00AEAF] text-white px-1 py-0.5 rounded">{event.odds3}</span>
                            ) : <span className="text-gray-300">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center text-xs text-gray-500 p-1">{event.update_time}</TableCell>
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
          <div className="text-xs text-gray-600">
            Abbiamo analizzato <strong>{totalEvents.toLocaleString()}</strong> combinazioni di eventi. 
            Ti stiamo mostrando i risultati da <strong>{Math.min((currentPage - 1) * pageSize + 1, totalEvents)}</strong> a <strong>{Math.min(currentPage * pageSize, totalEvents)}</strong>
          </div>
          <div className="flex items-center gap-1 flex-wrap justify-center">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
              disabled={currentPage === 1 || loading} 
              className="text-xs px-2"
            >
              Precedente
            </Button>
            
            {/* Page numbers */}
            {totalPages > 1 && getPageNumbers().map(pageNum => (
              <Button
                key={pageNum}
                variant={pageNum === currentPage ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(pageNum)}
                disabled={loading}
                className={`text-xs px-2 min-w-[32px] ${pageNum === currentPage ? 'bg-brand-primary' : ''}`}
              >
                {pageNum}
              </Button>
            ))}
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
              disabled={currentPage === totalPages || loading} 
              className="text-xs px-2"
            >
              Seguente
            </Button>
          </div>
        </div>
      </div>

      <DutcherCalculatorModal 
        event={calculatorEvent} 
        isOpen={showCalculator} 
        onClose={() => setShowCalculator(false)} 
        defaultStake={parseInt(rfSettings.back_stake) || 100} 
        defaultRefund={parseInt(rfSettings.refund) || 100}
        defaultBfComm={parseFloat(commissions.betfair) || 0.045}
        defaultBgComm={parseFloat(commissions.betflag) || 0.05}
      />
    </div>
    </SubscriptionGuard>
    </AuthGuard>
  );
}
// Tipi per il calcolatore Punta-Banca

export type BetMode = 'normale' | 'riskfree' | 'bonus';

export interface CalculatorInput {
  mode: BetMode;
  backStake: number;         // Importo puntata
  backOdds: number;          // Quota punta
  layOdds: number;           // Quota banca
  layCommission: number;     // Commissione exchange (es. 0.05 = 5%)
  backRefundStake?: number;  // Importo bonus rimborso (solo RF)
}

export interface UnmatchedBetInput {
  matched: number;           // Importo già abbinato
  newOdds: number;           // Nuova quota
  newCommission: number;     // Nuova commissione
}

export interface CalculatorResult {
  // Valori principali
  layStake: number;          // Importo da bancare
  liability: number;         // Responsabilità
  profit: number;            // Profitto garantito
  rating: number;            // Rating % (o RF% in modalità RF)
  
  // Dettaglio scenari
  backWin: {
    bookieAmount: number;    // Profitto/perdita bookmaker
    exchangeAmount: number;  // Profitto/perdita exchange
    total: number;           // Totale se vince punta
  };
  layWin: {
    bookieAmount: number;    // Profitto/perdita bookmaker
    exchangeAmount: number;  // Profitto/perdita exchange
    total: number;           // Totale se vince banca
  };
}

export interface UnmatchedResult {
  newLayStake: number;       // Nuovo importo da bancare
  newProfit: number;         // Nuovo profitto
  newRating: number;         // Nuovo rating/RF
}

// Per future funzionalità (auth, PT, etc.)
export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: Date;
}

export interface ProfitTrackerEntry {
  id: string;
  userId: string;
  type: 'MB P-B' | 'Sure P-B';
  createdDate: Date;
  eventDate?: Date;
  bookie1: string;
  exchange: string;
  event?: string;
  bet?: string;
  realMoney: number;
  bonus: number;
  expectedProfit: number;
  actualProfit?: number;
  settled: boolean;
  notes?: string;
  
  // Dati per il settling
  backwinBookieAmount: number;
  backwinExchangeAmount: number;
  laywinBookieAmount: number;
  laywinExchangeAmount: number;
}

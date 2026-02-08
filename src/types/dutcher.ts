// src/types/dutcher.ts

/**
 * Dutcher Event - Punta-Punta combination (2-way or 3-way)
 */
export interface DutcherEvent {
  // Event info
  event: string;
  eid1: string;
  open_date: string;
  country: string;
  competition: string;
  sport_id: string;
  sport: string;
  update_time: string;
  
  // Bet 1 (first bookmaker)
  bookie_id1: string;
  selection_id1: string;
  selection1: string;
  odds1: string;
  rating1?: string;
  snr1?: string;
  
  // Bet 2 (second bookmaker)
  bookie_id2: string;
  selection_id2: string;
  selection2: string;
  odds2: string;
  rating2?: string;
  snr2?: string;
  
  // Bet 3 (third bookmaker - optional for 3-way)
  bookie_id3: string | null;
  selection_id3?: string;
  selection3?: string;
  odds3?: string;
  rating3?: string;
  snr3?: string;
  bookie3?: string;
  
  // Combined rating/snr (e.g., "96.00 - 95.40 - 97.00")
  rating: string;
  snr: string;
  
  // Type: "two-way" or "three-way"
  type: 'two-way' | 'three-way';
  
  // Visibility
  is_hidden: boolean;
}

export interface DutcherResponse {
  success: boolean;
  timestamp: string;
  data: {
    sortColumn: number;
    sortDirection: string;
    sortDirectionFull?: string;
    allEventsCount: number;
    offset: number;
    data: DutcherEvent[];
  };
  error?: string;
}

export interface DutcherFilters {
  // Commissions
  bf_comm?: number;     // Betfair commission (e.g., 0.045)
  bg_comm?: number;     // Betflag commission (e.g., 0.05)
  
  // Stake settings
  back_stake?: number;
  back_stake2?: number;
  refund?: number;
  
  // Bookmakers
  bookies?: string[];           // All bookmaker IDs (comma-sep in API)
  filterbookies?: string[];     // Filter bookmaker 1
  filterbookies2?: string[];    // Filter bookmaker 2
  filterbookies3?: string[];    // Filter bookmaker 3
  
  // Event filters
  name?: string[];              // Event IDs to include (search)
  name2?: string[];             // Event IDs to exclude (hide)
  
  // Sport and bet type
  sport?: string[];             // Sport IDs
  'bet-type'?: string[];        // Bet types
  
  // Rating/odds filters
  rating_from?: number;
  rating_to?: number;
  odds_from?: number;
  odds_to?: number;
  
  // Date filters
  date_from?: string;
  date_to?: string;
  
  // Sorting/pagination
  sort_column?: number;
  sort_direction?: 'asc' | 'desc';
  offset?: number;
  
  // Combination type filter
  combinazioni?: 'tutti' | '2' | '3';  // tutti = all, 2 = 2-way only, 3 = 3-way only
  
  // Fixed params
  tz?: number;         // Timezone offset
  game_play?: number;  // Always 1
  
  // Legacy params (not sure if used)
  book1?: string;
  book2?: string;
}

export interface DutcherConfig {
  bookmakers: Record<string, string>;
  sports: Record<string, { name: string; icon: string }>;
  bet_types: Record<string, string>;
  defaults: {
    back_stake: number;
    refund: number;
    betfair_commission: number;
    betflag_commission: number;
  };
}

// Calculator types for Dutcher (Punta-Punta)
export interface DutcherCalculatorState {
  mode: 'normale' | 'riskfree' | 'bonus';
  backStake: number;
  backRefundStake: number;
  odds1: number;
  odds2: number;
  odds3: number;
  commission1: number;  // Commission for bookmaker 1 (if exchange)
  commission2: number;  // Commission for bookmaker 2 (if exchange)
  commission3: number;  // Commission for bookmaker 3 (if exchange)
}

export interface DutcherCalculatorResult {
  // Stakes
  amount1: number;
  amount2: number;
  amount3: number;
  
  // Results for each outcome
  bet1Profit: number;  // If bet 1 wins
  bet2Profit: number;  // If bet 2 wins
  bet3Profit: number;  // If bet 3 wins
  
  // Breakdown by bookmaker for each outcome
  bet1Bookie1Amount: number;
  bet1Bookie2Amount: number;
  bet1Bookie3Amount: number;
  
  bet2Bookie1Amount: number;
  bet2Bookie2Amount: number;
  bet2Bookie3Amount: number;
  
  bet3Bookie1Amount: number;
  bet3Bookie2Amount: number;
  bet3Bookie3Amount: number;
  
  // Rating percentages
  rating1: number;
  rating2: number;
  rating3: number;
}

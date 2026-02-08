// src/types/oddsmatcher.ts

export interface OddsEvent {
  id: string;
  event: string;
  event_id?: string;
  bookie_id: string;
  bookie_name?: string;
  exchange?: string;
  exchange_id: string;
  exchange_name?: string;
  selection_id: string;
  selection: string;
  back_odd: string;
  lay_odd: string;
  availability: string;
  open_date: string;
  country: string;
  competition: string;
  sport_id: string;
  sport_name?: string;
  sport: string;
  update_time: string;
  market_id: string;
  rating: string;
  snr: string;
  snr_rating: string;
  is_hidden: boolean;
  bookie_bet_url?: string;
}

export interface OddsMatcherResponse {
  success: boolean;
  timestamp: string;
  data: {
    sortColumn: number;
    sortDirection: string;
    sortDirectionFull: string;
    is_guest: boolean;
    is_premium: boolean;
    is_surebet: boolean;
    allEventsCount: number;
    offset: number;
    data: OddsEvent[];
  };
  error?: string;
}

export interface OddsMatcherFilters {
  // Base params
  exchange: 'betfair' | 'betflag' | 'all';
  back_stake: number;
  refund: number;
  
  // Sorting/pagination
  sort_column: number;
  sort_direction: 'asc' | 'desc';
  offset: number;
  
  // Array filters (sent as multiple params)
  bookies?: string[];           // All available bookmakers
  filterbookies?: string[];     // Specific bookmakers to filter
  sport?: string[];             // Sport IDs to show
  bet_type?: string[];          // Bet types to show
  name?: string[];              // Event IDs to include (search filter)
  name2?: string[];             // Event IDs to exclude (hide filter)
  
  // Single value filters
  rating_from?: number;
  rating_to?: number;
  odds_from?: number;
  odds_to?: number;
  min_liquidity?: number;
  date_from?: string;
  date_to?: string;
  
  // Commissions
  betfair_commission?: number;
  betflag_commission?: number;
}

export interface EventSearchResult {
  value: string;  // Event name (e.g., "Lazio v Napoli")
  id: string;     // Comma-separated event IDs
}

export interface SelectedEvent {
  name: string;
  ids: string;  // Comma-separated event IDs
}

export interface Bookmaker {
  id: string;
  name: string;
}

export interface Exchange {
  id: string;
  name: string;
}

export interface Sport {
  id: string;
  name: string;
}

export interface BetType {
  key: string;
  name: string;
}

export interface BackendConfig {
  bookmakers: Record<string, string>;
  exchanges: Record<string, string>;
  sports: Record<string, string>;
  bet_types?: Record<string, string>;
  defaults: {
    back_stake: number;
    refund: number;
    betfair_commission: number;
    betflag_commission: number;
  };
  ninjabet_enabled: boolean;
  proxy_enabled: boolean;
}

export interface BackendStatus {
  browser_initialized: boolean;
  logged_in: boolean;
  uid: string | null;
  proxy_enabled: boolean;
  ninjabet_enabled: boolean;
  cookies_count: number;
  external_ip: string | null;
  error?: string;
}

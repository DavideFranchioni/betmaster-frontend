/**
 * Calcolatore Punta-Banca
 * 
 * Logica identica al calcolatore NinjaBet originale.
 * Tutte le formule sono state estratte dal sorgente JS.
 */

import type { 
  BetMode, 
  CalculatorInput, 
  CalculatorResult, 
  UnmatchedBetInput, 
  UnmatchedResult 
} from '@/types/calculator';

/**
 * Arrotonda un numero a N decimali
 */
export function roundTo(num: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(num * factor) / factor;
}

/**
 * Calcola i risultati del calcolatore Punta-Banca
 * 
 * @param input - Parametri di input del calcolatore
 * @returns Risultati del calcolo
 */
export function calculatePuntaBanca(input: CalculatorInput): CalculatorResult {
  const { 
    mode, 
    backStake, 
    backOdds, 
    layOdds, 
    layCommission,
    backRefundStake = 0 
  } = input;

  // Calcolo layStake base (modalità NORMALE)
  let layStake = roundTo(
    (backStake * backOdds) / (layOdds - layCommission), 
    2
  );

  // Risultati per scenario "BACK WINS" (vince la puntata)
  let netResultBackBackWin = (backStake * backOdds) - backStake; // Profitto bookmaker
  let netResultLayBackWin = backStake * -1; // Perdita bookmaker (perdiamo la puntata)

  // Aggiustamenti in base alla modalità
  if (mode === 'riskfree') {
    // MODALITÀ RF (RiskFree/Rimborso)
    layStake = roundTo(
      ((backStake * backOdds) - backRefundStake) / (layOdds - layCommission),
      2
    );
    
    // Se perdo la puntata, ricevo il rimborso
    netResultLayBackWin = backRefundStake - backStake;
    netResultBackBackWin = (backStake * backOdds) - backStake;
  } else if (mode === 'bonus') {
    // MODALITÀ BR (Bonus)
    // Non perdo soldi miei se perdo la puntata (era bonus)
    netResultLayBackWin = 0;
    netResultBackBackWin = backStake * backOdds; // Vinco tutto, non sottraggo stake
  }

  // Calcola liability e profitti exchange con il layStake finale
  const finalLiability = layStake * (layOdds - 1);
  const finalNetResultBackLayWin = -1 * finalLiability;
  const finalNetResultLayLayWin = layStake * (1 - layCommission);

  // Calcolo profitti totali per scenario
  const layWinProfit = netResultLayBackWin + finalNetResultLayLayWin;
  const backWinProfit = netResultBackBackWin + finalNetResultBackLayWin;

  // Il profitto garantito è il minimo tra i due scenari
  const profit = Math.min(layWinProfit, backWinProfit);

  // Calcolo Rating/RF%
  let rating: number;
  if (mode === 'riskfree') {
    // RF% = ((-backStake + refund + layStake*(1-layCommission)) / refund) * 100
    const rfProfit = -backStake + backRefundStake + (layStake * (1 - layCommission));
    rating = roundTo((rfProfit / backRefundStake) * 100, 1);
  } else if (mode === 'bonus') {
    // BONUS: Rating% = (profit / backStake) * 100
    // Indica quanto guadagni rispetto al valore del bonus
    rating = roundTo((profit / backStake) * 100, 1);
  } else {
    // NORMALE: Rating% = ((backStake + profit) / backStake) * 100
    rating = roundTo(((backStake + profit) / backStake) * 100, 1);
  }

  return {
    layStake,
    liability: finalLiability,
    profit: roundTo(profit, 2),
    rating,
    backWin: {
      bookieAmount: roundTo(netResultBackBackWin, 2),
      exchangeAmount: roundTo(finalNetResultBackLayWin, 2),
      total: roundTo(backWinProfit, 2),
    },
    layWin: {
      bookieAmount: roundTo(netResultLayBackWin, 2),
      exchangeAmount: roundTo(finalNetResultLayLayWin, 2),
      total: roundTo(layWinProfit, 2),
    },
  };
}

/**
 * Calcola i valori per bancata non abbinata
 * 
 * LOGICA ORIGINALE NINJABET:
 * - uncovered = (layStake - matched) / layStake * backStake
 * - layStakeNew = uncovered * backOdds / (newOdds - newComm)
 * - Per RF: layStakeNew = ((uncovered * backOdds) - refundNew) / (newOdds - newComm)
 * - profitNew dipende dalla modalità
 * 
 * @param input - Input originale del calcolatore
 * @param result - Risultato del calcolo originale
 * @param unmatched - Dati della bancata non abbinata
 * @returns Nuovo layStake, profitto e rating
 */
export function calculateUnmatchedBet(
  input: CalculatorInput,
  result: CalculatorResult,
  unmatched: UnmatchedBetInput
): UnmatchedResult {
  const { mode, backStake, backOdds, layCommission, backRefundStake = 0 } = input;
  const { layStake } = result;
  const { matched, newOdds, newCommission } = unmatched;

  // Formula originale NinjaBet:
  // var uncovered = (layStake-matched)/layStake*backStake
  const uncovered = ((layStake - matched) / layStake) * backStake;
  
  // var refundNew = (refund/backStake*uncovered);
  const refundNew = (backRefundStake / backStake) * uncovered;

  let newLayStake: number;
  let newProfit: number;
  let newRating: number;

  if (mode === 'riskfree') {
    // RF: layStakeNew = ((uncovered*backOdds)-refundNew)/(newOdds-newComm);
    newLayStake = ((uncovered * backOdds) - refundNew) / (newOdds - newCommission);
    
    // profitNew = parseFloat(matched*(1-layCommission)+layStakeNew*(1-newComm)-backStake + ref);
    newProfit = matched * (1 - layCommission) + newLayStake * (1 - newCommission) - backStake + backRefundStake;
    
    // ratingNew = roundup(parseFloat((profitNew/ref)*100),1);
    newRating = roundTo((newProfit / backRefundStake) * 100, 1);
    
  } else if (mode === 'bonus') {
    // BONUS: layStakeNew = uncovered*backOdds/(newOdds-newComm);
    newLayStake = (uncovered * backOdds) / (newOdds - newCommission);
    
    // profitNew = parseFloat(matched*(1-layCommission)+layStakeNew*(1-newComm));
    // NOTA: In modalità BONUS non si sottrae backStake!
    newProfit = matched * (1 - layCommission) + newLayStake * (1 - newCommission);
    
    // ratingNew usa la stessa formula del rating BONUS
    // Dal codice: ratingNew = roundup(parseFloat(((backStake + profitNew)/backStake)*100),1);
    // Ma per BONUS il rating è profit/backStake * 100
    newRating = roundTo((newProfit / backStake) * 100, 1);
    
  } else {
    // NORMALE: layStakeNew = uncovered*backOdds/(newOdds-newComm);
    newLayStake = (uncovered * backOdds) / (newOdds - newCommission);
    
    // profitNew = parseFloat(matched*(1-layCommission)+layStakeNew*(1-newComm)-backStake);
    newProfit = matched * (1 - layCommission) + newLayStake * (1 - newCommission) - backStake;
    
    // ratingNew = roundup(parseFloat(((backStake + profitNew)/backStake)*100),1);
    newRating = roundTo(((backStake + newProfit) / backStake) * 100, 1);
  }

  return {
    newLayStake: roundTo(newLayStake, 2),
    newProfit: roundTo(newProfit, 2),
    newRating,
  };
}

/**
 * Valida gli input del calcolatore
 */
export function validateInput(input: Partial<CalculatorInput>): string[] {
  const errors: string[] = [];

  if (input.backStake !== undefined && input.backStake < 0) {
    errors.push('L\'importo puntata non può essere negativo');
  }

  if (input.backOdds !== undefined && input.backOdds < 1) {
    errors.push('La quota punta deve essere maggiore di 1');
  }

  if (input.layOdds !== undefined && input.layOdds < 1) {
    errors.push('La quota banca deve essere maggiore di 1');
  }

  if (input.layCommission !== undefined && (input.layCommission < 0 || input.layCommission > 1)) {
    errors.push('La commissione deve essere tra 0 e 1');
  }

  if (input.mode === 'riskfree' && (!input.backRefundStake || input.backRefundStake <= 0)) {
    errors.push('In modalità RF è necessario inserire l\'importo del rimborso');
  }

  return errors;
}

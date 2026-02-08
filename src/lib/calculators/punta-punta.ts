/**
 * Calcolatore Punta-Punta (Dutching)
 * 
 * Logica identica al calcolatore NinjaBet originale.
 * Permette di calcolare gli importi da puntare su 2-5 esiti
 * per equalizzare i profitti indipendentemente dal risultato.
 */

import type { BetMode } from '@/types/calculator';

export interface PuntaPuntaInput {
  mode: BetMode;
  numOutcomes: number;        // Numero di esiti (2-5)
  backStake: number;          // Importo puntata sul primo esito
  backOdds: number[];         // Quote per ogni esito (array di 5 elementi)
  backRefundStake?: number;   // Importo bonus rimborso (solo RF)
}

export interface PuntaPuntaResult {
  stakes: number[];           // Importi da puntare per ogni esito
  profits: number[];          // Profitto se vince ciascun esito
  ratings: number[];          // Rating/RF% per ogni scenario
  details: OutcomeDetail[];   // Dettaglio per ogni scenario
}

export interface OutcomeDetail {
  outcomeIndex: number;       // Quale esito vince (0-4)
  bookieAmounts: number[];    // Profitto/perdita per ogni bookmaker
  totalProfit: number;        // Profitto totale
  rating: number;             // Rating %
}

/**
 * Arrotonda un numero a N decimali
 */
export function roundTo(num: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(num * factor) / factor;
}

/**
 * Calcola i risultati del calcolatore Punta-Punta
 * 
 * LOGICA ORIGINALE NINJABET:
 * 
 * Calcolo stakes:
 * - stake[0] = backStake
 * - stake[i] = (backStake * odds[0]) / odds[i]  per NORMALE e BONUS
 * - stake[i] = ((backStake * odds[0]) - refund) / odds[i]  per RF
 * 
 * Calcolo profitti quando vince esito X:
 * - Se X=0 (primo esito vince):
 *   - NORMALE: book[0] = stake[0] * (odds[0] - 1)
 *   - BONUS: book[0] = stake[0] * odds[0]  (guadagno totale, non sottraiamo stake)
 *   - RF: book[0] = stake[0] * (odds[0] - 1)
 *   - Altri: book[i] = -stake[i]
 * 
 * - Se X>0 (altro esito vince):
 *   - NORMALE: book[0] = -stake[0]
 *   - BONUS: book[0] = 0  (non perdiamo nulla, erano soldi bonus)
 *   - RF: book[0] = -stake[0] + refund  (perdiamo stake ma riceviamo rimborso)
 *   - book[X] = stake[X] * (odds[X] - 1)
 *   - Altri: book[i] = -stake[i]
 */
export function calculatePuntaPunta(input: PuntaPuntaInput): PuntaPuntaResult {
  const { 
    mode, 
    numOutcomes, 
    backStake, 
    backOdds, 
    backRefundStake = 0 
  } = input;

  // Calcola gli importi da puntare per ogni esito
  const stakes: number[] = new Array(5).fill(0);
  stakes[0] = backStake;

  // Per gli esiti 2-5: stake = (stake1 * odds1) / oddsN
  // Per RF: stake = ((stake1 * odds1) - refund) / oddsN
  for (let i = 1; i < numOutcomes; i++) {
    if (backOdds[i] > 0) {
      let numerator = backStake * backOdds[0];
      if (mode === 'riskfree') {
        numerator = (backStake * backOdds[0]) - backRefundStake;
      }
      stakes[i] = roundTo(numerator / backOdds[i], 0); // NinjaBet arrotonda a 0 decimali
    }
  }

  // Calcola profitti e dettagli per ogni scenario (quale esito vince)
  const details: OutcomeDetail[] = [];
  const profits: number[] = [];
  const ratings: number[] = [];

  for (let winningOutcome = 0; winningOutcome < numOutcomes; winningOutcome++) {
    const bookieAmounts: number[] = new Array(5).fill(0);

    // Costruisci array dei profitti/perdite per ogni bookmaker
    for (let i = 0; i < numOutcomes; i++) {
      if (i === winningOutcome) {
        // Questo esito vince: guadagno = stake * (odds - 1)
        bookieAmounts[i] = stakes[i] * (backOdds[i] - 1);
      } else {
        // Questo esito perde: perdiamo lo stake
        bookieAmounts[i] = -stakes[i];
      }
    }

    // Aggiustamenti per modalità BONUS e RF sul primo bookmaker
    if (mode === 'bonus') {
      if (winningOutcome === 0) {
        // BONUS e vince P1: guadagno = stake * odds (non stake * (odds-1))
        bookieAmounts[0] = stakes[0] * backOdds[0];
      } else {
        // BONUS e vince altro: non perdiamo nulla sul primo book
        bookieAmounts[0] = 0;
      }
    } else if (mode === 'riskfree') {
      if (winningOutcome === 0) {
        // RF e vince P1: guadagno normale = stake * (odds - 1)
        // (già calcolato sopra, nessuna modifica necessaria)
      } else {
        // RF e vince altro: perdiamo stake ma riceviamo rimborso
        bookieAmounts[0] = (-backStake) + backRefundStake;
      }
    }

    // Calcola profitto totale per questo scenario
    const totalProfit = bookieAmounts.slice(0, numOutcomes).reduce((sum, amount) => sum + amount, 0);
    profits.push(roundTo(totalProfit, 2));

    // Calcola rating
    let rating: number;
    if (mode === 'bonus') {
      // BONUS: rating = (profit / stake) * 100
      rating = roundTo((totalProfit / backStake) * 100, 2);
    } else if (mode === 'riskfree') {
      // RF: rating = (profit / refund) * 100
      rating = roundTo((totalProfit / backRefundStake) * 100, 2);
    } else {
      // NORMALE: rating = ((stake + profit) / stake) * 100
      rating = roundTo(((backStake + totalProfit) / backStake) * 100, 2);
    }
    ratings.push(rating);

    details.push({
      outcomeIndex: winningOutcome,
      bookieAmounts: bookieAmounts.map(a => roundTo(a, 2)),
      totalProfit: roundTo(totalProfit, 2),
      rating,
    });
  }

  return {
    stakes,
    profits,
    ratings,
    details,
  };
}

/**
 * Valida gli input del calcolatore
 */
export function validatePuntaPuntaInput(input: Partial<PuntaPuntaInput>): string[] {
  const errors: string[] = [];

  if (input.numOutcomes !== undefined && (input.numOutcomes < 2 || input.numOutcomes > 5)) {
    errors.push('Il numero di esiti deve essere tra 2 e 5');
  }

  if (input.backStake !== undefined && input.backStake <= 0) {
    errors.push('L\'importo puntata deve essere maggiore di 0');
  }

  if (input.backOdds) {
    for (let i = 0; i < (input.numOutcomes || 2); i++) {
      if (input.backOdds[i] !== undefined && input.backOdds[i] < 1) {
        errors.push(`La quota dell'esito ${i + 1} deve essere maggiore di 1`);
      }
    }
  }

  if (input.mode === 'riskfree' && (!input.backRefundStake || input.backRefundStake <= 0)) {
    errors.push('In modalità RF è necessario inserire l\'importo del rimborso');
  }

  return errors;
}


// ============================================
// TEST DELLE FORMULE
// ============================================

/**
 * Esegue test automatici per verificare la correttezza delle formule
 * Confronta i risultati con quelli attesi dal calcolatore NinjaBet
 */
export function runTests(): { passed: boolean; results: string[] } {
  const results: string[] = [];
  let allPassed = true;

  // Helper per confrontare numeri con tolleranza
  const approxEqual = (a: number, b: number, tolerance = 0.01) => Math.abs(a - b) <= tolerance;

  // ==========================================
  // TEST 1: NORMALE con 2 esiti
  // ==========================================
  const test1 = calculatePuntaPunta({
    mode: 'normale',
    numOutcomes: 2,
    backStake: 100,
    backOdds: [2.0, 2.5, 0, 0, 0],
  });

  // stake2 = (100 * 2.0) / 2.5 = 80
  if (test1.stakes[1] !== 80) {
    results.push(`❌ TEST 1 - stake2: expected 80, got ${test1.stakes[1]}`);
    allPassed = false;
  } else {
    results.push(`✅ TEST 1 - stake2: 80`);
  }

  // Se vince P1: 100*(2-1) - 80 = 100 - 80 = 20
  // Se vince P2: -100 + 80*(2.5-1) = -100 + 120 = 20
  if (!approxEqual(test1.profits[0], 20)) {
    results.push(`❌ TEST 1 - profit P1: expected 20, got ${test1.profits[0]}`);
    allPassed = false;
  } else {
    results.push(`✅ TEST 1 - profit P1: ${test1.profits[0]}`);
  }

  if (!approxEqual(test1.profits[1], 20)) {
    results.push(`❌ TEST 1 - profit P2: expected 20, got ${test1.profits[1]}`);
    allPassed = false;
  } else {
    results.push(`✅ TEST 1 - profit P2: ${test1.profits[1]}`);
  }

  // ==========================================
  // TEST 2: BONUS con 2 esiti
  // ==========================================
  const test2 = calculatePuntaPunta({
    mode: 'bonus',
    numOutcomes: 2,
    backStake: 100,
    backOdds: [2.0, 2.5, 0, 0, 0],
  });

  // stake2 = (100 * 2.0) / 2.5 = 80 (stesso di NORMALE)
  // Se vince P1: 100*2.0 - 80 = 200 - 80 = 120
  // Se vince P2: 0 + 80*(2.5-1) = 0 + 120 = 120
  if (!approxEqual(test2.profits[0], 120)) {
    results.push(`❌ TEST 2 BONUS - profit P1: expected 120, got ${test2.profits[0]}`);
    allPassed = false;
  } else {
    results.push(`✅ TEST 2 BONUS - profit P1: ${test2.profits[0]}`);
  }

  if (!approxEqual(test2.profits[1], 120)) {
    results.push(`❌ TEST 2 BONUS - profit P2: expected 120, got ${test2.profits[1]}`);
    allPassed = false;
  } else {
    results.push(`✅ TEST 2 BONUS - profit P2: ${test2.profits[1]}`);
  }

  // ==========================================
  // TEST 3: RISKFREE con 2 esiti
  // ==========================================
  const test3 = calculatePuntaPunta({
    mode: 'riskfree',
    numOutcomes: 2,
    backStake: 100,
    backOdds: [2.0, 2.5, 0, 0, 0],
    backRefundStake: 100,
  });

  // stake2 = ((100 * 2.0) - 100) / 2.5 = 100 / 2.5 = 40
  if (test3.stakes[1] !== 40) {
    results.push(`❌ TEST 3 RF - stake2: expected 40, got ${test3.stakes[1]}`);
    allPassed = false;
  } else {
    results.push(`✅ TEST 3 RF - stake2: 40`);
  }

  // Se vince P1: 100*(2-1) - 40 = 100 - 40 = 60
  // Se vince P2: (-100 + 100) + 40*(2.5-1) = 0 + 60 = 60
  if (!approxEqual(test3.profits[0], 60)) {
    results.push(`❌ TEST 3 RF - profit P1: expected 60, got ${test3.profits[0]}`);
    allPassed = false;
  } else {
    results.push(`✅ TEST 3 RF - profit P1: ${test3.profits[0]}`);
  }

  if (!approxEqual(test3.profits[1], 60)) {
    results.push(`❌ TEST 3 RF - profit P2: expected 60, got ${test3.profits[1]}`);
    allPassed = false;
  } else {
    results.push(`✅ TEST 3 RF - profit P2: ${test3.profits[1]}`);
  }

  // ==========================================
  // TEST 4: NORMALE con 3 esiti
  // ==========================================
  const test4 = calculatePuntaPunta({
    mode: 'normale',
    numOutcomes: 3,
    backStake: 100,
    backOdds: [3.0, 3.0, 3.0, 0, 0],
  });

  // stake2 = stake3 = (100 * 3.0) / 3.0 = 100
  if (test4.stakes[1] !== 100 || test4.stakes[2] !== 100) {
    results.push(`❌ TEST 4 - stakes: expected [100,100,100], got [${test4.stakes.slice(0,3)}]`);
    allPassed = false;
  } else {
    results.push(`✅ TEST 4 - stakes: [100, 100, 100]`);
  }

  // Se vince P1: 100*(3-1) - 100 - 100 = 200 - 200 = 0
  // Se vince P2: -100 + 100*(3-1) - 100 = -100 + 200 - 100 = 0
  // Se vince P3: -100 - 100 + 100*(3-1) = -200 + 200 = 0
  for (let i = 0; i < 3; i++) {
    if (!approxEqual(test4.profits[i], 0)) {
      results.push(`❌ TEST 4 - profit P${i+1}: expected 0, got ${test4.profits[i]}`);
      allPassed = false;
    } else {
      results.push(`✅ TEST 4 - profit P${i+1}: ${test4.profits[i]}`);
    }
  }

  // ==========================================
  // TEST 5: BONUS con 3 esiti
  // ==========================================
  const test5 = calculatePuntaPunta({
    mode: 'bonus',
    numOutcomes: 3,
    backStake: 100,
    backOdds: [3.0, 3.0, 3.0, 0, 0],
  });

  // Se vince P1: 100*3.0 - 100 - 100 = 300 - 200 = 100
  // Se vince P2: 0 + 100*(3-1) - 100 = 0 + 200 - 100 = 100
  // Se vince P3: 0 - 100 + 100*(3-1) = -100 + 200 = 100
  for (let i = 0; i < 3; i++) {
    if (!approxEqual(test5.profits[i], 100)) {
      results.push(`❌ TEST 5 BONUS 3 esiti - profit P${i+1}: expected 100, got ${test5.profits[i]}`);
      allPassed = false;
    } else {
      results.push(`✅ TEST 5 BONUS 3 esiti - profit P${i+1}: ${test5.profits[i]}`);
    }
  }

  return { passed: allPassed, results };
}

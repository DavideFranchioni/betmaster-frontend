/**
 * Calcolatore Multiplicatore (Multiple)
 * 
 * Logica identica al calcolatore NinjaBet originale.
 * Permette di calcolare le coperture per scommesse multiple (2-5 partite).
 * 
 * SCENARI:
 * - P = Prima partita persa
 * - VP = Prima vinta, seconda persa
 * - VVP = Prime due vinte, terza persa
 * - etc.
 * - VVVVV = Tutte vinte (multipla vinta)
 * 
 * NOTA IMPORTANTE:
 * NinjaBet usa la quota ARROTONDATA per calcolare gli stake,
 * ma usa la quota ESATTA (non arrotondata) per calcolare il guadagno
 * dello scenario "tutto vinto" (VV, VVV, etc.)
 */

import type { BetMode } from '@/types/calculator';

export type CoperturaTipo = 'Banca' | 'Punta2';

export interface PartitaInput {
  backOdds: number;
  layOdds: number;
  commission: number;
  copertura: CoperturaTipo;
  locked: boolean;
  manualStake?: number;
}

export interface MultiplicatoreInput {
  mode: BetMode;
  numPartite: number;
  backStake: number;
  backRefundStake?: number;
  partite: PartitaInput[];
  maggiorazioneQuota?: number;
  maggiorazioneTipo?: 'lorda' | 'netta';
}

export interface PartitaResult {
  stake: number;
  liability: number;
  maggOdds: number;
}

export interface ScenarioResult {
  nome: string;
  guadagno: number;
  rating: number;
}

export interface MultiplicatoreResult {
  partiteResults: PartitaResult[];
  totalBackOdds: number;
  totalMaggOdds: number;
  totalLiability: number;
  scenari: ScenarioResult[];
  ratingMedio: number;
  guadagnoMedio: number;
}

export function roundTo(num: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(num * factor) / factor;
}

export function calculateMultiplicatore(input: MultiplicatoreInput): MultiplicatoreResult {
  const {
    mode,
    numPartite,
    backStake,
    backRefundStake = 0,
    partite,
    maggiorazioneQuota = 0,
    maggiorazioneTipo = 'lorda',
  } = input;

  const bonus = backRefundStake;
  const maggQuota = maggiorazioneQuota / 100;

  // Calcola quota totale multipla - ESATTA (non arrotondata)
  let totalBackExact = 1;
  for (let i = 0; i < numPartite; i++) {
    totalBackExact *= partite[i].backOdds;
  }
  
  // Quota arrotondata per display e calcolo stake
  const totalBack = roundTo(totalBackExact, 2);

  // Calcola quote maggiorate
  const maggOddsArray: number[] = [];
  let totalMaggExact = 1;

  for (let i = 0; i < numPartite; i++) {
    let maggOdds = partite[i].backOdds;
    if (maggQuota > 0) {
      if (maggiorazioneTipo === 'netta') {
        maggOdds = partite[i].backOdds * Math.pow(
          ((totalBackExact - 1) * (1 + maggQuota) + 1) / totalBackExact,
          1 / numPartite
        );
      } else {
        maggOdds = partite[i].backOdds * Math.pow(1 + maggQuota, 1 / numPartite);
      }
      totalMaggExact *= maggOdds;
    } else {
      totalMaggExact = totalBackExact;
    }
    maggOddsArray.push(roundTo(maggOdds, 2));
  }

  const totalMagg = roundTo(totalMaggExact, 2);

  // Quota per calcolo stake (arrotondata)
  const quotaPerStake = maggQuota > 0 ? totalMagg : totalBack;
  
  // Quota per calcolo guadagno VV (ESATTA, come NinjaBet!)
  const quotaPerVV = maggQuota > 0 ? totalMaggExact : totalBackExact;

  // Calcola stakes a cascata
  const stakes: number[] = new Array(numPartite).fill(0);
  const liabilities: number[] = new Array(numPartite).fill(0);

  const lastIdx = numPartite - 1;
  const lastPartita = partite[lastIdx];
  let lastStake: number;

  if (lastPartita.copertura === 'Punta2') {
    lastStake = roundTo((backStake * quotaPerStake) / lastPartita.layOdds, 0);
    if (mode === 'riskfree') {
      lastStake = roundTo(((backStake * quotaPerStake) - bonus) / lastPartita.layOdds, 0);
    }
  } else {
    // NinjaBet NON arrotonda lo stake dell'ultima partita Banca
    lastStake = (backStake * quotaPerStake) / (lastPartita.layOdds - lastPartita.commission);
    if (mode === 'riskfree') {
      lastStake = ((backStake * quotaPerStake) - bonus) / (lastPartita.layOdds - lastPartita.commission);
    }
  }

  if (!lastPartita.locked && lastPartita.manualStake !== undefined) {
    lastStake = lastPartita.manualStake;
  }

  stakes[lastIdx] = roundTo(lastStake, 2);
  liabilities[lastIdx] = lastPartita.copertura === 'Punta2'
    ? roundTo(lastStake, 2)
    : roundTo(lastStake * (lastPartita.layOdds - 1), 2);

  // Calcola stakes precedenti
  let currentStake = lastStake; // Usa valore NON arrotondato per cascata
  for (let i = lastIdx - 1; i >= 0; i--) {
    const currentPartita = partite[i];
    const nextPartita = partite[i + 1];
    const nextCom = nextPartita.commission;
    const nextLayOdds = nextPartita.layOdds;
    const currentLayOdds = currentPartita.layOdds;
    const currentCom = currentPartita.commission;

    let newStake: number;

    if (!currentPartita.locked && currentPartita.manualStake !== undefined) {
      newStake = currentPartita.manualStake;
    } else {
      if (currentPartita.copertura === 'Punta2' && nextPartita.copertura === 'Banca') {
        newStake = roundTo(currentStake * (1 - nextCom) / currentLayOdds, 0);
      } else if (currentPartita.copertura === 'Punta2' && nextPartita.copertura === 'Punta2') {
        newStake = roundTo(currentStake * (nextLayOdds - 1) / currentLayOdds, 0);
      } else if (currentPartita.copertura === 'Banca' && nextPartita.copertura === 'Punta2') {
        newStake = roundTo(currentStake * (nextLayOdds - 1) / (currentLayOdds - currentCom), 2);
      } else {
        // Banca + Banca
        newStake = roundTo(currentStake * (1 - nextCom) / (currentLayOdds - currentCom), 2);
      }
    }

    stakes[i] = newStake;
    liabilities[i] = currentPartita.copertura === 'Punta2'
      ? roundTo(newStake, 2)
      : roundTo(newStake * (currentLayOdds - 1), 2);

    currentStake = newStake;
  }

  const totalLiability = roundTo(liabilities.reduce((sum, l) => sum + l, 0), 2);

  // ================================================
  // CALCOLO SCENARI
  // ================================================
  const scenari: ScenarioResult[] = [];
  let totalGuadagno = 0;

  for (let scenarioIdx = 0; scenarioIdx <= numPartite; scenarioIdx++) {
    let nome = '';
    for (let v = 0; v < scenarioIdx; v++) nome += 'V';
    if (scenarioIdx < numPartite) nome += 'P';

    let guadagno: number;

    if (scenarioIdx === 0) {
      // Scenario P
      guadagno = mode === 'bonus' ? 0 : -backStake;
      
      if (partite[0].copertura === 'Banca') {
        guadagno += stakes[0] * (1 - partite[0].commission);
      } else {
        guadagno += stakes[0] * (partite[0].layOdds - 1);
      }
      
      if (mode === 'riskfree') {
        guadagno += bonus;
      }
    } else if (scenarioIdx === numPartite) {
      // Scenario tutto vinto - usa quota ESATTA (quotaPerVV)
      if (mode === 'bonus') {
        guadagno = (backStake * quotaPerVV) - totalLiability;
      } else {
        guadagno = backStake * (quotaPerVV - 1) - totalLiability;
      }
    } else {
      // Scenari intermedi (VP, VVP, etc.)
      let liabilityCumulative = 0;
      for (let j = 0; j < scenarioIdx; j++) {
        liabilityCumulative += liabilities[j];
      }

      guadagno = mode === 'bonus' ? 0 : -backStake;
      guadagno -= liabilityCumulative;

      if (partite[scenarioIdx].copertura === 'Banca') {
        guadagno += stakes[scenarioIdx] * (1 - partite[scenarioIdx].commission);
      } else {
        guadagno += stakes[scenarioIdx] * (partite[scenarioIdx].layOdds - 1);
      }

      if (mode === 'riskfree') {
        guadagno += bonus;
      }
    }

    guadagno = roundTo(guadagno, 2);
    totalGuadagno += guadagno;

    // Calcola rating
    let rating: number;
    if (mode === 'riskfree') {
      rating = roundTo((guadagno / bonus) * 100, 2);
    } else if (mode === 'bonus') {
      rating = roundTo((((guadagno + backStake) / backStake) - 1) * 100, 2);
    } else {
      rating = roundTo(((guadagno + backStake) / backStake) * 100, 2);
    }

    scenari.push({ nome, guadagno, rating });
  }

  const numScenari = numPartite + 1;
  const guadagnoMedio = roundTo(totalGuadagno / numScenari, 2);

  let ratingMedio: number;
  if (mode === 'riskfree') {
    ratingMedio = roundTo((guadagnoMedio / bonus) * 100, 2);
  } else if (mode === 'bonus') {
    ratingMedio = roundTo((((backStake + guadagnoMedio) / backStake) - 1) * 100, 2);
  } else {
    ratingMedio = roundTo(((backStake + guadagnoMedio) / backStake) * 100, 2);
  }

  const partiteResults: PartitaResult[] = partite.slice(0, numPartite).map((_, i) => ({
    stake: stakes[i],
    liability: liabilities[i],
    maggOdds: maggOddsArray[i],
  }));

  return {
    partiteResults,
    totalBackOdds: totalBack,
    totalMaggOdds: totalMagg,
    totalLiability,
    scenari,
    ratingMedio,
    guadagnoMedio,
  };
}

export function validateMultiplicatoreInput(input: Partial<MultiplicatoreInput>): string[] {
  const errors: string[] = [];

  if (input.numPartite !== undefined && (input.numPartite < 2 || input.numPartite > 5)) {
    errors.push('Il numero di partite deve essere tra 2 e 5');
  }

  if (input.backStake !== undefined && input.backStake <= 0) {
    errors.push('L\'importo puntata deve essere maggiore di 0');
  }

  if (input.mode === 'riskfree' && (!input.backRefundStake || input.backRefundStake <= 0)) {
    errors.push('In modalità RF è necessario inserire l\'importo del rimborso');
  }

  return errors;
}

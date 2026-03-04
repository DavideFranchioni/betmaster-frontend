/**
 * Calcolatore Multiplicatore Coperture
 *
 * Variante del Multiplicatore che usa il dutching per coprire N-1 esiti
 * invece di una singola copertura Banca/Punta2.
 *
 * Per ogni partita:
 * - L'utente seleziona quanti esiti ha (2 per tennis, 3 per calcio)
 * - Inserisce le quote di tutti gli esiti
 * - Il calcolatore calcola automaticamente gli stake di copertura
 *
 * Formula: effectiveOdds = 1 / sum(1/odds_i) per gli esiti di copertura
 * Cascading: identico al multiplicatore Punta2 (commissione 0)
 * Split: stake_i = totalCoverageStake * effectiveOdds / odds_i
 */

import type { BetMode } from '@/types/calculator';

export interface PartitaCopertura {
  numEsiti: 2 | 3;
  odds: number[];     // odds[0] = quota esito puntato, odds[1..] = coperture
  locked: boolean;
  manualStake?: number;
}

export interface MultiplicatoreCopertureInput {
  mode: BetMode;
  numPartite: number;
  backStake: number;
  backRefundStake?: number;
  partite: PartitaCopertura[];
  maggiorazioneQuota?: number;
  maggiorazioneTipo?: 'lorda' | 'netta';
}

export interface PartitaCoperturResult {
  effectiveOdds: number;
  totalCoverageStake: number;
  coverageStakes: number[];
  liability: number;
  maggOdds: number;
}

export interface ScenarioCoperturResult {
  nome: string;
  guadagno: number;
  rating: number;
}

export interface MultiplicatoreCopertureResult {
  partiteResults: PartitaCoperturResult[];
  totalBackOdds: number;
  totalMaggOdds: number;
  totalLiability: number;
  scenari: ScenarioCoperturResult[];
  ratingMedio: number;
  guadagnoMedio: number;
}

export function roundTo(num: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(num * factor) / factor;
}

/**
 * Calcola la quota effettiva combinata per gli esiti di copertura (dutching).
 * effectiveOdds = 1 / sum(1/odds_i)
 */
function calcEffectiveOdds(coverageOdds: number[]): number {
  const sumInverse = coverageOdds.reduce((sum, o) => sum + (o > 0 ? 1 / o : 0), 0);
  return sumInverse > 0 ? 1 / sumInverse : 0;
}

export function calculateMultiplicatoreCoperture(input: MultiplicatoreCopertureInput): MultiplicatoreCopertureResult {
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

  // Calcola effectiveOdds per ogni partita
  const effectiveOddsArray: number[] = [];
  for (let i = 0; i < numPartite; i++) {
    const p = partite[i];
    const coverageOdds = p.odds.slice(1); // esiti di copertura (escluso il puntato)
    effectiveOddsArray.push(calcEffectiveOdds(coverageOdds));
  }

  // Calcola quota totale multipla (usa odds[0] = quota esito puntato) - ESATTA
  let totalBackExact = 1;
  for (let i = 0; i < numPartite; i++) {
    totalBackExact *= partite[i].odds[0];
  }
  const totalBack = roundTo(totalBackExact, 2);

  // Calcola quote maggiorate
  const maggOddsArray: number[] = [];
  let totalMaggExact = 1;

  for (let i = 0; i < numPartite; i++) {
    let maggOdds = partite[i].odds[0];
    if (maggQuota > 0) {
      if (maggiorazioneTipo === 'netta') {
        maggOdds = partite[i].odds[0] * Math.pow(
          ((totalBackExact - 1) * (1 + maggQuota) + 1) / totalBackExact,
          1 / numPartite
        );
      } else {
        maggOdds = partite[i].odds[0] * Math.pow(1 + maggQuota, 1 / numPartite);
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

  // ================================================
  // CASCADING: sempre Punta2 style, commissione 0
  // effectiveOdds viene usato come layOdds
  // ================================================
  const totalCoverageStakes: number[] = new Array(numPartite).fill(0);
  const liabilities: number[] = new Array(numPartite).fill(0);

  const lastIdx = numPartite - 1;
  const lastEffOdds = effectiveOddsArray[lastIdx];

  // Ultima partita
  let lastStake: number;
  if (lastEffOdds > 0) {
    lastStake = roundTo((backStake * quotaPerStake) / lastEffOdds, 0);
    if (mode === 'riskfree') {
      lastStake = roundTo(((backStake * quotaPerStake) - bonus) / lastEffOdds, 0);
    }
  } else {
    lastStake = 0;
  }

  if (!partite[lastIdx].locked && partite[lastIdx].manualStake !== undefined) {
    lastStake = partite[lastIdx].manualStake!;
  }

  totalCoverageStakes[lastIdx] = roundTo(lastStake, 2);
  // Punta2 style: liability = stake
  liabilities[lastIdx] = roundTo(lastStake, 2);

  // Partite precedenti (cascading Punta2 + Punta2)
  let currentStake = lastStake;
  for (let i = lastIdx - 1; i >= 0; i--) {
    const currentEffOdds = effectiveOddsArray[i];
    const nextEffOdds = effectiveOddsArray[i + 1];

    let newStake: number;

    if (!partite[i].locked && partite[i].manualStake !== undefined) {
      newStake = partite[i].manualStake!;
    } else {
      // Punta2 + Punta2: newStake = currentStake * (nextLayOdds - 1) / currentLayOdds
      if (currentEffOdds > 0 && nextEffOdds > 0) {
        newStake = roundTo(currentStake * (nextEffOdds - 1) / currentEffOdds, 0);
      } else {
        newStake = 0;
      }
    }

    totalCoverageStakes[i] = roundTo(newStake, 2);
    liabilities[i] = roundTo(newStake, 2); // Punta2 style

    currentStake = newStake;
  }

  const totalLiability = roundTo(liabilities.reduce((sum, l) => sum + l, 0), 2);

  // Split degli stake in stake individuali per ogni esito di copertura
  const coverageStakesArray: number[][] = [];
  for (let i = 0; i < numPartite; i++) {
    const p = partite[i];
    const effOdds = effectiveOddsArray[i];
    const totalStake = totalCoverageStakes[i];
    const stakes: number[] = [];

    for (let j = 1; j < p.numEsiti; j++) {
      const odd = p.odds[j] || 0;
      if (odd > 0 && effOdds > 0) {
        // stake_j = totalStake * effectiveOdds / odds_j
        stakes.push(roundTo(totalStake * effOdds / odd, 2));
      } else {
        stakes.push(0);
      }
    }

    coverageStakesArray.push(stakes);
  }

  // ================================================
  // CALCOLO SCENARI
  // ================================================
  const scenari: ScenarioCoperturResult[] = [];
  let totalGuadagno = 0;

  for (let scenarioIdx = 0; scenarioIdx <= numPartite; scenarioIdx++) {
    let nome = '';
    for (let v = 0; v < scenarioIdx; v++) nome += 'V';
    if (scenarioIdx < numPartite) nome += 'P';

    let guadagno: number;

    if (scenarioIdx === 0) {
      // Scenario P: prima partita persa, copertura prima partita vinta
      guadagno = mode === 'bonus' ? 0 : -backStake;

      // Punta2 style: guadagno += stake * (effectiveOdds - 1)
      const effOdds = effectiveOddsArray[0];
      guadagno += totalCoverageStakes[0] * (effOdds - 1);

      if (mode === 'riskfree') {
        guadagno += bonus;
      }
    } else if (scenarioIdx === numPartite) {
      // Scenario tutto vinto - usa quota ESATTA
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

      // Punta2 style: guadagno += stake * (effectiveOdds - 1)
      const effOdds = effectiveOddsArray[scenarioIdx];
      guadagno += totalCoverageStakes[scenarioIdx] * (effOdds - 1);

      if (mode === 'riskfree') {
        guadagno += bonus;
      }
    }

    guadagno = roundTo(guadagno, 2);
    totalGuadagno += guadagno;

    // Calcola rating
    let rating: number;
    if (mode === 'riskfree') {
      rating = bonus > 0 ? roundTo((guadagno / bonus) * 100, 2) : 0;
    } else if (mode === 'bonus') {
      rating = backStake > 0 ? roundTo((((guadagno + backStake) / backStake) - 1) * 100, 2) : 0;
    } else {
      rating = backStake > 0 ? roundTo(((guadagno + backStake) / backStake) * 100, 2) : 0;
    }

    scenari.push({ nome, guadagno, rating });
  }

  const numScenari = numPartite + 1;
  const guadagnoMedio = roundTo(totalGuadagno / numScenari, 2);

  let ratingMedio: number;
  if (mode === 'riskfree') {
    ratingMedio = bonus > 0 ? roundTo((guadagnoMedio / bonus) * 100, 2) : 0;
  } else if (mode === 'bonus') {
    ratingMedio = backStake > 0 ? roundTo((((backStake + guadagnoMedio) / backStake) - 1) * 100, 2) : 0;
  } else {
    ratingMedio = backStake > 0 ? roundTo(((backStake + guadagnoMedio) / backStake) * 100, 2) : 0;
  }

  const partiteResults: PartitaCoperturResult[] = [];
  for (let i = 0; i < numPartite; i++) {
    partiteResults.push({
      effectiveOdds: roundTo(effectiveOddsArray[i], 4),
      totalCoverageStake: totalCoverageStakes[i],
      coverageStakes: coverageStakesArray[i],
      liability: liabilities[i],
      maggOdds: maggOddsArray[i],
    });
  }

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

export function validateMultiplicatoreCopertureInput(input: Partial<MultiplicatoreCopertureInput>): string[] {
  const errors: string[] = [];

  if (input.numPartite !== undefined && (input.numPartite < 2 || input.numPartite > 10)) {
    errors.push('Il numero di partite deve essere tra 2 e 10');
  }

  if (input.backStake !== undefined && input.backStake <= 0) {
    errors.push('L\'importo puntata deve essere maggiore di 0');
  }

  if (input.mode === 'riskfree' && (!input.backRefundStake || input.backRefundStake <= 0)) {
    errors.push('In modalità RF è necessario inserire l\'importo del rimborso');
  }

  return errors;
}

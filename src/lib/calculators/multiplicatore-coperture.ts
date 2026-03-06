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
  subMode?: 'standard' | 'perdi1';
  numPartite: number;
  backStake: number;
  backRefundStake?: number;
  rimborsoPerdi1?: number;
  partite: PartitaCopertura[];
  maggiorazioneQuota?: number;
  maggiorazioneTipo?: 'lorda' | 'netta';
}

export interface CoverageTreeLeaf {
  type: 'leaf';
  profit: number;
  rating: number;
  lossCount: number;
  hasRefund: boolean;
  scenario: string;
}

export interface CoverageTreeNode {
  type: 'node';
  eventIndex: number;
  eventName: string;
  coverageStake: number;
  coverageStakes: number[];
  coverageProfit: number;
  win: CoverageTreeNode | CoverageTreeLeaf;
  lose: CoverageTreeNode | CoverageTreeLeaf;
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
  tree?: CoverageTreeNode;
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

/**
 * Calcola lo split dutching degli stake individuali dato uno stake totale.
 */
function splitDutching(totalStake: number, coverageOdds: number[], effOdds: number): number[] {
  return coverageOdds.map(odd => {
    if (odd > 0 && effOdds > 0) {
      return roundTo(totalStake * effOdds / odd, 2);
    }
    return 0;
  });
}

/**
 * PERDI 1: algoritmo ricorsivo per calcolo albero coperture.
 * Se esattamente 1 evento perde → rimborso. Altrimenti multipla vince o perdi >1.
 */
export function calculatePerdi1Tree(input: MultiplicatoreCopertureInput): MultiplicatoreCopertureResult {
  const {
    numPartite,
    backStake,
    partite,
    rimborsoPerdi1 = 0,
    maggiorazioneQuota = 0,
    maggiorazioneTipo = 'lorda',
  } = input;

  // Calcola effectiveOdds per ogni partita
  const effectiveOddsArray: number[] = [];
  for (let i = 0; i < numPartite; i++) {
    const coverageOdds = partite[i].odds.slice(1);
    effectiveOddsArray.push(calcEffectiveOdds(coverageOdds));
  }

  // Quota totale multipla
  let totalBackExact = 1;
  for (let i = 0; i < numPartite; i++) {
    totalBackExact *= partite[i].odds[0];
  }
  const totalBack = roundTo(totalBackExact, 2);

  // Quote maggiorate
  const maggQuota = maggiorazioneQuota / 100;
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
  const quotaPerVV = maggQuota > 0 ? totalMaggExact : totalBackExact;

  // Recursive solve: returns the equalized profit for this subtree
  interface SolveResult {
    profit: number;
    node: CoverageTreeNode | CoverageTreeLeaf;
  }

  function solve(eventIdx: number, lossesSoFar: number, scenarioPrefix: string): SolveResult {
    if (eventIdx >= numPartite) {
      // Leaf
      let profit: number;
      if (lossesSoFar === 0) {
        // All events won → multipla wins
        profit = backStake * (quotaPerVV - 1);
      } else if (lossesSoFar === 1) {
        // Exactly 1 lost → refund applies
        profit = -backStake + rimborsoPerdi1;
      } else {
        // 2+ lost → no refund
        profit = -backStake;
      }
      profit = roundTo(profit, 2);

      const rating = rimborsoPerdi1 > 0 ? roundTo((profit / rimborsoPerdi1) * 100, 2) : 0;

      const leaf: CoverageTreeLeaf = {
        type: 'leaf',
        profit,
        rating,
        lossCount: lossesSoFar,
        hasRefund: lossesSoFar === 1,
        scenario: scenarioPrefix,
      };
      return { profit, node: leaf };
    }

    // Recurse: lose branch (event loses in multipla → coverage wins)
    const loseResult = solve(eventIdx + 1, lossesSoFar + 1, scenarioPrefix + 'P');
    // Recurse: win branch (event wins in multipla → coverage loses)
    const winResult = solve(eventIdx + 1, lossesSoFar, scenarioPrefix + 'V');

    const effOdds = effectiveOddsArray[eventIdx];

    // Calculate coverage stake to equalize profits
    // When coverage wins: profit = coverageStake * (effOdds - 1) + loseResult.profit - cumulative_liabilities
    // When coverage loses: profit = -coverageStake + winResult.profit
    // Equalize: coverageStake * (effOdds - 1) + loseResult.profit = -coverageStake + winResult.profit
    // coverageStake * effOdds = winResult.profit - loseResult.profit
    let coverageStake = 0;
    if (effOdds > 0) {
      coverageStake = roundTo((winResult.profit - loseResult.profit) / effOdds, 0);
    }

    // Equalized profit: -coverageStake + winResult.profit (choosing the win branch formula)
    const equalizedProfit = roundTo(-coverageStake + winResult.profit, 2);

    // Profit when coverage wins (event loses in multipla)
    const coverageProfit = roundTo(coverageStake * (effOdds - 1), 2);

    // Split dutching
    const coverageOdds = partite[eventIdx].odds.slice(1);
    const individualStakes = splitDutching(coverageStake, coverageOdds, effOdds);

    const eventName = `Evento ${eventIdx + 1}`;

    const node: CoverageTreeNode = {
      type: 'node',
      eventIndex: eventIdx,
      eventName,
      coverageStake,
      coverageStakes: individualStakes,
      coverageProfit,
      win: winResult.node,
      lose: loseResult.node,
    };

    return { profit: equalizedProfit, node };
  }

  const rootResult = solve(0, 0, '');
  const tree = rootResult.node as CoverageTreeNode;

  // Post-processing: propagate net coverage costs to leaves.
  // At each node, win branch pays -coverageStake (coverage loses),
  // lose branch gains +coverageProfit (coverage wins).
  function propagateNetProfits(node: CoverageTreeNode | CoverageTreeLeaf, pathCost: number) {
    if (node.type === 'leaf') {
      node.profit = roundTo(node.profit + pathCost, 2);
      node.rating = rimborsoPerdi1 > 0 ? roundTo((node.profit / rimborsoPerdi1) * 100, 2) : 0;
      return;
    }
    // Win branch: event wins in multipla → coverage loses → we pay coverageStake
    propagateNetProfits(node.win, pathCost - node.coverageStake);
    // Lose branch: event loses in multipla → coverage wins → we gain coverageProfit
    propagateNetProfits(node.lose, pathCost + node.coverageProfit);
  }
  propagateNetProfits(tree, 0);

  // Collect all leaves for statistics (after net profit correction)
  const leaves: CoverageTreeLeaf[] = [];
  function collectLeaves(node: CoverageTreeNode | CoverageTreeLeaf) {
    if (node.type === 'leaf') {
      leaves.push(node);
    } else {
      collectLeaves(node.win);
      collectLeaves(node.lose);
    }
  }
  collectLeaves(tree);

  const totalGuadagno = leaves.reduce((sum, l) => sum + l.profit, 0);
  const guadagnoMedio = roundTo(totalGuadagno / leaves.length, 2);
  const ratingMedio = rimborsoPerdi1 > 0 ? roundTo((guadagnoMedio / rimborsoPerdi1) * 100, 2) : 0;

  // Max coverage: sum of all stakes on the most expensive path
  function maxCoveragePath(node: CoverageTreeNode | CoverageTreeLeaf): number {
    if (node.type === 'leaf') return 0;
    const winPath = node.coverageStake + maxCoveragePath(node.win);
    const losePath = node.coverageStake + maxCoveragePath(node.lose);
    return Math.max(winPath, losePath);
  }
  const totalLiability = roundTo(maxCoveragePath(tree), 2);

  // Build scenari from leaves for compatibility
  const scenari: ScenarioCoperturResult[] = leaves.map(l => ({
    nome: l.scenario,
    guadagno: l.profit,
    rating: l.rating,
  }));

  // Populate partiteResults from the "all-win" path of the tree
  // (the principal path with the largest coverage stakes)
  const partiteResults: PartitaCoperturResult[] = [];
  let current: CoverageTreeNode | CoverageTreeLeaf = tree;
  for (let i = 0; i < numPartite; i++) {
    if (current.type === 'node') {
      partiteResults.push({
        effectiveOdds: roundTo(effectiveOddsArray[i], 4),
        totalCoverageStake: current.coverageStake,
        coverageStakes: current.coverageStakes,
        liability: current.coverageStake,
        maggOdds: maggOddsArray[i],
      });
      current = current.win; // follow the win path
    } else {
      partiteResults.push({
        effectiveOdds: roundTo(effectiveOddsArray[i], 4),
        totalCoverageStake: 0,
        coverageStakes: [],
        liability: 0,
        maggOdds: maggOddsArray[i],
      });
    }
  }

  return {
    partiteResults,
    totalBackOdds: totalBack,
    totalMaggOdds: totalMagg,
    totalLiability,
    scenari,
    ratingMedio,
    guadagnoMedio,
    tree,
  };
}

/**
 * Converts existing linear scenario results into a degenerate tree for visualization.
 * Each node: lose = leaf (scenario P at that level), win = next node.
 */
function buildStandardTree(
  result: MultiplicatoreCopertureResult,
  input: MultiplicatoreCopertureInput,
): CoverageTreeNode | undefined {
  const { numPartite } = input;
  if (numPartite < 2 || result.scenari.length === 0) return undefined;

  // Build from last event to first (bottom-up)
  // scenari[0] = P, scenari[1] = VP, ..., scenari[N] = VV..V
  function buildNode(eventIdx: number): CoverageTreeNode {
    const pr = result.partiteResults[eventIdx];
    const scenario = result.scenari[eventIdx]; // scenario where event eventIdx loses

    const loseLeaf: CoverageTreeLeaf = {
      type: 'leaf',
      profit: scenario.guadagno,
      rating: scenario.rating,
      lossCount: 1,
      hasRefund: false,
      scenario: scenario.nome,
    };

    let winChild: CoverageTreeNode | CoverageTreeLeaf;
    if (eventIdx === numPartite - 1) {
      // Last event: win = all events won
      const allWinScenario = result.scenari[numPartite];
      winChild = {
        type: 'leaf',
        profit: allWinScenario.guadagno,
        rating: allWinScenario.rating,
        lossCount: 0,
        hasRefund: false,
        scenario: allWinScenario.nome,
      };
    } else {
      winChild = buildNode(eventIdx + 1);
    }

    const coverageProfit = roundTo(pr.totalCoverageStake * (pr.effectiveOdds - 1), 2);

    return {
      type: 'node',
      eventIndex: eventIdx,
      eventName: `Evento ${eventIdx + 1}`,
      coverageStake: pr.totalCoverageStake,
      coverageStakes: pr.coverageStakes,
      coverageProfit,
      win: winChild,
      lose: loseLeaf,
    };
  }

  return buildNode(0);
}

export function calculateMultiplicatoreCoperture(input: MultiplicatoreCopertureInput): MultiplicatoreCopertureResult {
  // Route to PERDI 1 if subMode is perdi1 and mode is normale
  if (input.mode === 'normale' && input.subMode === 'perdi1') {
    return calculatePerdi1Tree(input);
  }

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

  const baseResult: MultiplicatoreCopertureResult = {
    partiteResults,
    totalBackOdds: totalBack,
    totalMaggOdds: totalMagg,
    totalLiability,
    scenari,
    ratingMedio,
    guadagnoMedio,
  };

  // Build standard tree for visualization
  baseResult.tree = buildStandardTree(baseResult, input);

  return baseResult;
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

/**
 * TEST COMPLETI MULTIPLICATORE
 * 
 * Questo file contiene test dettagliati per verificare che le formule
 * del Multiplicatore siano identiche a quelle di NinjaBet.
 */

import { 
  calculateMultiplicatore, 
  roundTo,
  type MultiplicatoreInput 
} from './multiplicatore';

/**
 * Test VS NinjaBet - Esegui questi test e confronta manualmente
 */
export function runManualTests(): void {
  console.log('='.repeat(60));
  console.log('TEST MULTIPLICATORE VS NINJABET');
  console.log('Confronta questi risultati con NinjaBet');
  console.log('='.repeat(60));

  // ==========================================
  // TEST 1: NORMALE 2P - Banca/Banca
  // ==========================================
  console.log('\n--- TEST 1: NORMALE 2P Banca/Banca ---');
  const test1 = calculateMultiplicatore({
    mode: 'normale',
    numPartite: 2,
    backStake: 100,
    partite: [
      { backOdds: 1.5, layOdds: 1.6, commission: 0.05, copertura: 'Banca', locked: true },
      { backOdds: 1.8, layOdds: 1.9, commission: 0.05, copertura: 'Banca', locked: true },
    ],
  });
  printResult(test1);

  // ==========================================
  // TEST 2: RF 2P - Banca/Banca
  // ==========================================
  console.log('\n--- TEST 2: RF 2P Banca/Banca (bonus=50) ---');
  const test2 = calculateMultiplicatore({
    mode: 'riskfree',
    numPartite: 2,
    backStake: 100,
    backRefundStake: 50,
    partite: [
      { backOdds: 1.5, layOdds: 1.6, commission: 0.05, copertura: 'Banca', locked: true },
      { backOdds: 1.8, layOdds: 1.9, commission: 0.05, copertura: 'Banca', locked: true },
    ],
  });
  printResult(test2, 'RF');

  // ==========================================
  // TEST 3: BR 2P - Banca/Banca
  // ==========================================
  console.log('\n--- TEST 3: BR 2P Banca/Banca ---');
  const test3 = calculateMultiplicatore({
    mode: 'bonus',
    numPartite: 2,
    backStake: 100,
    partite: [
      { backOdds: 1.5, layOdds: 1.6, commission: 0.05, copertura: 'Banca', locked: true },
      { backOdds: 1.8, layOdds: 1.9, commission: 0.05, copertura: 'Banca', locked: true },
    ],
  });
  printResult(test3);

  // ==========================================
  // TEST 4: NORMALE 3P - Banca/Banca/Banca
  // ==========================================
  console.log('\n--- TEST 4: NORMALE 3P Banca/Banca/Banca ---');
  const test4 = calculateMultiplicatore({
    mode: 'normale',
    numPartite: 3,
    backStake: 100,
    partite: [
      { backOdds: 1.3, layOdds: 1.35, commission: 0.05, copertura: 'Banca', locked: true },
      { backOdds: 1.4, layOdds: 1.45, commission: 0.05, copertura: 'Banca', locked: true },
      { backOdds: 1.5, layOdds: 1.55, commission: 0.05, copertura: 'Banca', locked: true },
    ],
  });
  printResult(test4);

  // ==========================================
  // TEST 5: NORMALE 2P - Punta2/Punta2
  // ==========================================
  console.log('\n--- TEST 5: NORMALE 2P Punta2/Punta2 ---');
  const test5 = calculateMultiplicatore({
    mode: 'normale',
    numPartite: 2,
    backStake: 100,
    partite: [
      { backOdds: 1.5, layOdds: 1.6, commission: 0, copertura: 'Punta2', locked: true },
      { backOdds: 1.8, layOdds: 1.9, commission: 0, copertura: 'Punta2', locked: true },
    ],
  });
  printResult(test5);

  // ==========================================
  // TEST 6: NORMALE 2P - Mix Banca/Punta2
  // ==========================================
  console.log('\n--- TEST 6: NORMALE 2P Mix Banca/Punta2 ---');
  const test6 = calculateMultiplicatore({
    mode: 'normale',
    numPartite: 2,
    backStake: 100,
    partite: [
      { backOdds: 1.5, layOdds: 1.6, commission: 0.05, copertura: 'Banca', locked: true },
      { backOdds: 1.8, layOdds: 1.9, commission: 0, copertura: 'Punta2', locked: true },
    ],
  });
  printResult(test6);

  // ==========================================
  // TEST 7: NORMALE 5P
  // ==========================================
  console.log('\n--- TEST 7: NORMALE 5P ---');
  const test7 = calculateMultiplicatore({
    mode: 'normale',
    numPartite: 5,
    backStake: 100,
    partite: [
      { backOdds: 1.2, layOdds: 1.25, commission: 0.05, copertura: 'Banca', locked: true },
      { backOdds: 1.2, layOdds: 1.25, commission: 0.05, copertura: 'Banca', locked: true },
      { backOdds: 1.2, layOdds: 1.25, commission: 0.05, copertura: 'Banca', locked: true },
      { backOdds: 1.2, layOdds: 1.25, commission: 0.05, copertura: 'Banca', locked: true },
      { backOdds: 1.2, layOdds: 1.25, commission: 0.05, copertura: 'Banca', locked: true },
    ],
  });
  printResult(test7);

  // ==========================================
  // TEST 8: MAGG. LORDA 10%
  // ==========================================
  console.log('\n--- TEST 8: NORMALE 2P + Magg. Lorda 10% ---');
  const test8 = calculateMultiplicatore({
    mode: 'normale',
    numPartite: 2,
    backStake: 100,
    partite: [
      { backOdds: 2.0, layOdds: 2.1, commission: 0.05, copertura: 'Banca', locked: true },
      { backOdds: 2.0, layOdds: 2.1, commission: 0.05, copertura: 'Banca', locked: true },
    ],
    maggiorazioneQuota: 10,
    maggiorazioneTipo: 'lorda',
  });
  console.log(`  Quota Originale: 4.0`);
  console.log(`  Quota Maggiorata: ${test8.totalMaggOdds}`);
  printResult(test8);
}

function printResult(result: any, ratingLabel: string = 'Rating'): void {
  console.log(`  Quota Multipla: ${result.totalBackOdds}`);
  console.log(`  Stakes: [${result.partiteResults.map((p: any) => p.stake).join(', ')}]`);
  console.log(`  Liabilities: [${result.partiteResults.map((p: any) => p.liability).join(', ')}]`);
  console.log(`  Resp. Totale: ${result.totalLiability}`);
  console.log(`  ${ratingLabel} Medio: ${result.ratingMedio}%`);
  console.log(`  Guadagno Medio: ${result.guadagnoMedio}`);
  console.log(`  Scenari:`);
  result.scenari.forEach((s: any) => {
    console.log(`    ${s.nome.padEnd(6)}: guadagno=${s.guadagno.toString().padStart(8)}, ${ratingLabel}=${s.rating}%`);
  });
}

// Esporta per uso in browser console
if (typeof window !== 'undefined') {
  (window as any).runManualTests = runManualTests;
}

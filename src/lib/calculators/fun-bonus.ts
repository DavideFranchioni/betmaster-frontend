/**
 * Calcolatore Fun Bonus
 *
 * Calcola quando passare dalla fase "big win" alla fase "rollover"
 * per convertire i fun bonus slot in modo ottimale.
 */

export interface FunBonusInput {
  /** Importo bonus ricevuto in EUR */
  bonus: number;
  /** Moltiplicatore cap (1x, 2x, ecc.) */
  cap: number;
  /** Requisito di rollover (es. 40x) */
  rollover: number;
  /** Return To Player della slot in % */
  rtp: number;
  /** Saldo corrente in EUR */
  saldo: number;
  /** Percentuale del giocato totale già completata */
  saldoGiocatoPerc: number;
  /** Tipo di slot scelta (alta varianza) */
  altaVarianza: boolean;
}

export interface FunBonusResult {
  /** Giocato totale = Rollover x Bonus */
  giocatoTotale: number;
  /** Giocato rimanente in EUR */
  giocatoRimanente: number;
  /** Puntata minima per fase Big Win */
  puntataBigWin: number;
  /** Puntata per fase Rollover */
  puntataRollover: number;
  /** true = "Fai Rollover", false = "Continua a cercare la Big Win" */
  faiRollover: boolean;
  /** Bilancio proiettato */
  bilancioProiettato: number;
  /** Soglia minima per rollover (bonus * cap * 0.6) */
  sogliaRollover: number;
  /** Saldo minimo necessario per passare al rollover (solo se faiRollover = false) */
  saldoMinimo: number;
}

/**
 * Calcola i risultati del calcolatore Fun Bonus
 */
export function calculateFunBonus(input: FunBonusInput): FunBonusResult {
  const { bonus, cap, rollover, rtp, saldo, saldoGiocatoPerc, altaVarianza } = input;

  // 1. Giocato totale = Rollover x Bonus
  const giocatoTotale = rollover * bonus;

  // 2. Giocato rimanente
  const giocatoRimanente = giocatoTotale - (giocatoTotale * saldoGiocatoPerc / 100);

  // 3. Puntata minima Big Win (interpolazione lineare 10x→60x)
  const minPerc = altaVarianza ? 1.5 : 2;
  const maxPerc = altaVarianza ? 4 : 7;
  const clampedRollover = Math.max(10, Math.min(60, rollover));
  const perc = minPerc + (clampedRollover - 10) * (maxPerc - minPerc) / (60 - 10);
  let puntataBigWin = bonus * perc / 100;
  // Scala la puntata in base al rollover rimanente
  puntataBigWin = puntataBigWin * (100 - saldoGiocatoPerc) / 100;

  // 4. Puntata Rollover
  const puntataRollover = bonus / 1000;

  // 5. Status decisionale
  const bilancioProiettato = saldo - (giocatoRimanente * (100 - rtp) / 100);
  const sogliaRollover = bonus * cap * 0.6;
  const faiRollover = bilancioProiettato >= sogliaRollover;

  // Saldo minimo necessario (mostrato solo se non si fa rollover)
  const saldoMinimo = (bonus * cap - (saldo - giocatoTotale * (100 - rtp) / 100)) + saldo;

  return {
    giocatoTotale: roundTo(giocatoTotale, 2),
    giocatoRimanente: roundTo(giocatoRimanente, 2),
    puntataBigWin: roundTo(puntataBigWin, 2),
    puntataRollover: roundTo(puntataRollover, 2),
    faiRollover,
    bilancioProiettato: roundTo(bilancioProiettato, 2),
    sogliaRollover: roundTo(sogliaRollover, 2),
    saldoMinimo: roundTo(saldoMinimo, 2),
  };
}

function roundTo(num: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(num * factor) / factor;
}

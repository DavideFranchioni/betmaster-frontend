import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina classi Tailwind in modo intelligente
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formatta un numero come valuta EUR
 */
export function formatCurrency(value: number, showSign = false): string {
  const formatted = new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(value));

  if (showSign) {
    return value >= 0 ? `+${formatted}` : `-${formatted}`;
  }
  return value < 0 ? `-${formatted}` : formatted;
}

/**
 * Formatta un numero con segno esplicito
 */
export function formatSignedNumber(value: number, decimals = 2): string {
  const formatted = Math.abs(value).toFixed(decimals);
  return value >= 0 ? `+€${formatted}` : `-€${formatted}`;
}

/**
 * Formatta percentuale
 */
export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

/**
 * Parse di un input numerico (supporta virgola italiana)
 */
export function parseNumericInput(value: string): number {
  // Sostituisce virgola con punto
  const normalized = value.replace(',', '.');
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Determina il colore in base al valore (profitto/perdita)
 */
export function getProfitColorClass(value: number): string {
  if (value > 0) return 'text-profit';
  if (value < 0) return 'text-loss';
  return 'text-gray-600';
}

/**
 * Copia testo negli appunti
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback per browser più vecchi
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      return true;
    } catch {
      return false;
    } finally {
      document.body.removeChild(textArea);
    }
  }
}

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Datum als YYYY-MM-DD in de lokale tijdzone van de browser.
// toISOString() geeft UTC en levert tussen 00:00 en 02:00 (NL) de vorige dag op.
export function localDateStr(d: Date = new Date()): string {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

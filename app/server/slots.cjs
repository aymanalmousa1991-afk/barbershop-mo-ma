/**
 * Slimme tijdsloten voor online boeken.
 *
 * Alles rekent in hele kwartieren:
 * - Een afspraak blokkeert zijn duur, naar boven afgerond op 15 min (10 → 15, 20 → 30, 45 → 45).
 * - Klanten zien tijden die aansluiten op bestaande afspraken, zodat er geen onbruikbare gaten ontstaan:
 *   1. Vanaf het begin van elk vrij stuk, elke 30 minuten (9:15, 9:45, 10:15 ...).
 *   2. Plus één tijd die precies eindigt waar het vrije stuk eindigt (gat van achteren dichten).
 *   3. Tijden die een klein gaatje (< 30 min) of dood gaatje (< kortste behandeling) achterlaten,
 *      worden alleen getoond als er in dat vrije stuk geen betere optie is.
 *   4. Korte behandelingen (blok ≤ 15 min) mogen ook losse kwartiergaatjes vullen.
 */

const QUARTER = 15;
const STEP = 30; // klanten zien in principe stappen van 30 minuten

// Openingstijden per weekdag (0 = zondag ... 6 = zaterdag), in hele uren
const OPENING_HOURS = {
  1: { open: 10, close: 18 },
  2: { open: 9, close: 18 },
  3: { open: 9, close: 18 },
  4: { open: 9, close: 18 },
  5: { open: 9, close: 18 },
  6: { open: 8, close: 17 },
};

function toMin(t) {
  const [h, m] = String(t).split(':').map(Number);
  return h * 60 + (m || 0);
}

function fmt(min) {
  return String(Math.floor(min / 60)).padStart(2, '0') + ':' + String(min % 60).padStart(2, '0');
}

// Geblokkeerde tijd van een behandeling: naar boven afgerond op een heel kwartier
function blockMinutes(duration) {
  const d = Number(duration) > 0 ? Number(duration) : 30;
  return Math.ceil(d / QUARTER) * QUARTER;
}

function openingHoursFor(date) {
  return OPENING_HOURS[new Date(date + 'T12:00:00').getDay()] || null;
}

/**
 * Vrije stukken binnen [openMin, closeMin), na aftrek van bezette intervallen.
 * Begin wordt naar boven en eind naar beneden afgerond op een kwartier.
 */
function freeWindows(openMin, closeMin, busy) {
  const sorted = busy
    .map(b => ({ start: Math.max(openMin, b.start), end: Math.min(closeMin, b.end) }))
    .filter(b => b.end > b.start)
    .sort((a, b) => a.start - b.start);

  const windows = [];
  let cursor = openMin;
  for (const b of sorted) {
    if (b.start > cursor) windows.push({ start: cursor, end: b.start });
    cursor = Math.max(cursor, b.end);
  }
  if (cursor < closeMin) windows.push({ start: cursor, end: closeMin });

  return windows
    .map(w => ({
      start: Math.ceil(w.start / QUARTER) * QUARTER,
      end: Math.floor(w.end / QUARTER) * QUARTER,
    }))
    .filter(w => w.end > w.start);
}

/**
 * Bereken de starttijden die een klant te zien krijgt.
 * @param {object} p
 * @param {number} p.openMin      openingstijd in minuten
 * @param {number} p.closeMin     sluitingstijd in minuten
 * @param {{start:number,end:number}[]} p.busy  bezette intervallen (afspraken, pauzes, afwezigheid)
 * @param {number} p.duration     duur van de gekozen behandeling (minuten, wordt afgerond)
 * @param {number} p.minBlock     blok van de kortste actieve behandeling (bepaalt wat een dood gaatje is)
 * @param {number} [p.earliestMin] vroegst mogelijke start (bijv. "nu" voor vandaag)
 * @returns {string[]} tijden als "HH:MM", gesorteerd
 */
function computeSmartSlots({ openMin, closeMin, busy, duration, minBlock, earliestMin = 0 }) {
  const d = blockMinutes(duration);
  const deadBelow = blockMinutes(minBlock || QUARTER);
  const allBusy = [...busy];
  if (earliestMin > openMin) allBusy.push({ start: openMin, end: earliestMin });

  // Strafpunten voor een overgebleven gaatje: dood gaatje weegt zwaar, klein gaatje licht
  const gapPenalty = (gap) => {
    if (gap <= 0) return 0;
    if (gap < deadBelow) return 10;
    if (gap < STEP) return 1;
    return 0;
  };

  const result = new Set();
  for (const w of freeWindows(openMin, closeMin, allBusy)) {
    const length = w.end - w.start;
    if (length < d) continue;

    const candidates = new Set();
    // Regel 1: aansluiten vanaf het begin, elke 30 minuten
    for (let s = w.start; s + d <= w.end; s += STEP) candidates.add(s);
    // Regel 2: precies aansluiten op het eind van het vrije stuk
    candidates.add(w.end - d);
    // Regel 4: korte behandelingen mogen elk kwartier in een klein vrij stuk vullen
    if (d <= QUARTER && length < STEP) {
      for (let s = w.start; s + d <= w.end; s += QUARTER) candidates.add(s);
    }

    // Regel 3: in dit vrije stuk alleen de opties met de minste (dode) gaatjes tonen
    const scored = [...candidates].map(s => ({
      s,
      score: gapPenalty(s - w.start) + gapPenalty(w.end - (s + d)),
    }));
    const best = Math.min(...scored.map(c => c.score));
    scored.filter(c => c.score === best).forEach(c => result.add(c.s));
  }

  return [...result].sort((a, b) => a - b).map(fmt);
}

module.exports = { QUARTER, OPENING_HOURS, toMin, fmt, blockMinutes, openingHoursFor, freeWindows, computeSmartSlots };

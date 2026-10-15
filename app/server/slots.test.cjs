const assert = require('assert');
const S = require('./slots.cjs');
const m = S.toMin;
const run = (busy, duration, opts = {}) => S.computeSmartSlots({ openMin: m('09:00'), closeMin: m('18:00'), busy: busy.map(([a, b]) => ({ start: m(a), end: m(b) })), duration, minBlock: 10, ...opts });
let n = 0; const t = (name, fn) => { fn(); n++; console.log('✓', name); };

t('afronden: 10→15, 15→15, 20→30, 25→30, 30→30, 45→45', () =>
  assert.deepStrictEqual([10, 15, 20, 25, 30, 45].map(S.blockMinutes), [15, 15, 30, 30, 30, 45]));

t('lege dag, 30 min: 9:00, 9:30 ... 17:30', () => {
  const r = run([], 30); assert.strictEqual(r[0], '09:00'); assert.strictEqual(r[1], '09:30'); assert.strictEqual(r.at(-1), '17:30'); assert.strictEqual(r.length, 18);
});

t('jouw voorbeeld: Wassen (10 min) om 9:00 → volgende klant 9:15, 9:45, 10:15', () => {
  const r = run([['09:00', '09:15']], 30); assert.deepStrictEqual(r.slice(0, 3), ['09:15', '09:45', '10:15']);
});

t('45 min op lege dag: geen tijd die 15 min dood laat aan het eind (17:00 niet, 17:15 wel)', () => {
  const r = run([], 45); assert.ok(!r.includes('17:00')); assert.ok(r.includes('17:15'));
});

t('regel 2+3: vrij 9:15–11:00, 30 min → 9:15, 9:45 en 10:30 (10:15 laat kwartiergat)', () => {
  const r = run([['09:00', '09:15'], ['11:00', '18:00']], 30); assert.deepStrictEqual(r, ['09:15', '09:45', '10:30']);
});

t('regel 3: vrij 9:15–10:15, 30 min → 9:15 en 9:45, niet 9:30', () => {
  const r = run([['09:00', '09:15'], ['10:15', '18:00']], 30); assert.deepStrictEqual(r, ['09:15', '09:45']);
});

t('regel 4: kwartiergat 9:45–10:00 alleen voor korte behandeling', () => {
  const busy = [['09:00', '09:45'], ['10:00', '18:00']];
  assert.deepStrictEqual(run(busy, 30), []); assert.deepStrictEqual(run(busy, 10), ['09:45']); assert.deepStrictEqual(run(busy, 15), ['09:45']);
});

t('geen betere optie: vrij 9:15–10:00, 30 min → toch tonen (9:15 en 9:30)', () => {
  const r = run([['09:00', '09:15'], ['10:00', '18:00']], 30); assert.deepStrictEqual(r, ['09:15', '09:30']);
});

t('oude afspraak op rare tijd (10:05, 30 min) → vrij vanaf 10:45', () => {
  const r = run([['09:00', '10:05'], ['10:05', '10:35']], 30); assert.strictEqual(r[0], '10:45');
});

t('vandaag om 14:07 → eerste tijd 14:15', () => {
  const r = run([], 30, { earliestMin: m('14:07') }); assert.strictEqual(r[0], '14:15');
});

t('pauze 12:00–13:00 → niets dat overlapt, wel 11:30 en 13:00', () => {
  const r = run([['12:00', '13:00']], 30); assert.ok(r.includes('11:30') && r.includes('13:00') && !r.includes('12:00') && !r.includes('12:30') && !r.includes('11:45'));
});

t('geen enkele overlap met bezette tijd (willekeurige dagen)', () => {
  for (let i = 0; i < 500; i++) {
    const busy = []; let c = m('09:00');
    while (c < m('18:00')) { c += 15 * Math.floor(Math.random() * 6); const len = [15, 30, 45][Math.floor(Math.random() * 3)]; if (Math.random() < 0.6) busy.push([S.fmt(c), S.fmt(Math.min(c + len, m('18:00')))]); c += len; }
    const dur = [10, 15, 20, 25, 30, 45][Math.floor(Math.random() * 6)];
    for (const slot of run(busy, dur)) {
      const s = m(slot), e = s + S.blockMinutes(dur);
      assert.ok(s % 15 === 0 && s >= m('09:00') && e <= m('18:00'), 'binnen openingstijd op kwartier');
      for (const [a, b] of busy) assert.ok(e <= m(a) || s >= m(b), `overlap ${slot} met ${a}-${b}`);
    }
  }
});
console.log(`\nAlle ${n} tests geslaagd`);

/* FAUVE — cœur : utilitaires, état, logique métier, feedback, composants */
'use strict';

/* ================= Utilitaires ================= */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const round = (v, d = 0) => { const m = 10 ** d; return Math.round(v * m) / m; };
const r25 = v => Math.round(v / 25) * 25;
const avg = a => a.reduce((s, x) => s + x, 0) / (a.length || 1);
const fmt = (v, d = 0) => (v == null || isNaN(v)) ? '–' : round(v, d).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: d });
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const num = v => { const n = parseFloat(String(v).replace(',', '.')); return isNaN(n) ? null : n; };
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

const pad = n => String(n).padStart(2, '0');
const keyOf = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const dateOf = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d, 12); };
const today = () => keyOf(new Date());
const addDays = (k, n) => { const d = dateOf(k); d.setDate(d.getDate() + n); return keyOf(d); };
const diffDays = (a, b) => Math.round((dateOf(b) - dateOf(a)) / 864e5);
const dowOf = k => (dateOf(k).getDay() + 6) % 7;
const mondayOf = k => addDays(k, -dowOf(k));
const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const fdate = k => { const d = dateOf(k); return `${d.getDate()} ${MONTHS[d.getMonth()]}`; };
const fdateL = k => `${DOW[dowOf(k)]} ${fdate(k)}`;
const mmss = s => { s = Math.max(0, Math.round(s)); return `${Math.floor(s / 60)}:${pad(s % 60)}`; };
const nextMonday = k => dowOf(k) === 0 ? k : addDays(mondayOf(k), 7);
const dayLabel = k => { const t = today(); if (k === t) return 'Aujourd’hui'; if (k === addDays(t, -1)) return 'Hier'; if (k === addDays(t, 1)) return 'Demain'; return fdateL(k); };

/* ================= État ================= */
const LS = 'fauve.v1';
const DEF = () => ({
  v: 1, created: today(), profile: null,
  weights: [], measures: [], workouts: [], food: {}, water: {}, habits: {}, customFoods: [],
  tests: [], photos: [], slots: {}, kcalAdj: 0, adjDate: null,
  settings: { sound: true, haptics: true, loud: false, theme: 'auto' }, active: null,
  ui: { tab: 'today', week: null, foodDate: null }, dismiss: {}, lastExport: null
});
let S = load();
function load() {
  try { const raw = localStorage.getItem(LS); if (raw) { const o = JSON.parse(raw); const d = DEF(); return Object.assign(d, o, { settings: Object.assign(d.settings, o.settings), ui: Object.assign(d.ui, o.ui) }); } } catch (e) { /* ignore */ }
  return DEF();
}
let saveT;
function save() { clearTimeout(saveT); saveT = setTimeout(saveNow, 150); }
function saveNow() { try { localStorage.setItem(LS, JSON.stringify(S)); } catch (e) { toast('Stockage plein : exporte tes données'); } }
addEventListener('pagehide', saveNow);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') saveNow(); });

/* ================= Programme ================= */
function weekOf(k) { return Math.floor(diffDays(mondayOf(S.profile.start), k) / 7) + 1; }
function phaseOfWeek(w) { if (w < 1) return null; return PHASES.find(p => w >= p.from && w <= p.to) || PHASES[PHASES.length - 1]; }
function planFor(week, dow) {
  const ph = phaseOfWeek(week); if (!ph) return null;
  const base = ph.days[dow];
  const deload = DELOAD_WEEKS.includes(week);
  const ex = base.ex.map(e => deload ? [e[0], Math.max(1, Math.round(e[1] * 0.6)), e[2], e[3], Math.min(4, e[4] + 2), e[5]] : e.slice());
  return { week, dow, ph, day: Object.assign({}, base, { ex }), deload, test: TEST_WEEKS.includes(week), id: `${week}-${dow}` };
}
function planOn(k) { if (!S.profile) return null; const w = weekOf(k); return w < 1 ? null : planFor(w, dowOf(k)); }
function dateFor(week, dow) { return addDays(mondayOf(S.profile.start), (week - 1) * 7 + dow); }
const doneFor = (week, dow) => S.workouts.find(w => w.week === week && w.dow === dow);
const workoutsOn = k => S.workouts.filter(w => w.date === k);
const KIND_IC = { gym: 'dumbbell', cage: 'tree', swim: 'swim', run: 'run', rest: 'moon', mma: 'users', pre: 'flag' };
const KIND_N = { gym: 'Salle', cage: 'Plein air', swim: 'Piscine', run: 'Course', rest: 'Repos', mma: 'Cours' };

/* ================= Nutrition ================= */
const ACT = [
  { v: 1.55, n: 'Assis la journée', d: 'Bureau, études, voiture' },
  { v: 1.7, n: 'Debout, en mouvement', d: 'Vente, terrain, beaucoup de marche' },
  { v: 1.85, n: 'Métier physique', d: 'Chantier, manutention' }
];
const MODES = {
  auto: { n: 'Auto (suit les phases)' }, cut: { n: 'Sèche', rate: 0.7 }, recomp: { n: 'Recompo', rate: 0.3 },
  maint: { n: 'Maintien', rate: 0 }, bulk: { n: 'Prise de muscle', rate: -0.2 }
};
const FOODMAP = Object.fromEntries(FOODS.map(f => [f.id, f]));
const foodById = id => FOODMAP[id] || S.customFoods.find(f => f.id === id);
function entryMac(e) {
  if (e.q) return { kcal: e.q.kcal || 0, p: e.q.p || 0, c: e.q.c || 0, f: e.q.f || 0, fib: 0 };
  const f = foodById(e.f); if (!f) return { kcal: 0, p: 0, c: 0, f: 0, fib: 0 };
  const m = e.g / 100; return { kcal: f.kcal * m, p: f.p * m, c: f.c * m, f: f.f * m, fib: (f.fib || 0) * m };
}
function sumMac(list) { const t = { kcal: 0, p: 0, c: 0, f: 0, fib: 0 }; for (const e of list) { const m = entryMac(e); for (const x in t) t[x] += m[x] || 0; } return t; }
const dayNut = k => sumMac(S.food[k] || []);
const entryName = e => e.q ? (e.q.n || 'Ajout rapide') : ((foodById(e.f) || {}).n || 'Aliment supprimé');

function trendSeries() {
  const ws = [...S.weights].sort((a, b) => a.d < b.d ? -1 : 1);
  const out = []; let t = null, prev = null;
  for (const x of ws) {
    if (t == null) t = x.kg; else { const gap = Math.max(1, diffDays(prev, x.d)); t += (1 - Math.pow(0.9, gap)) * (x.kg - t); }
    prev = x.d; out.push({ d: x.d, kg: x.kg, t });
  }
  return out;
}
function curWeight() { const t = trendSeries(); return t.length ? t[t.length - 1].t : (S.profile ? S.profile.weight : 80); }
function weeklyRate() {
  const tr = trendSeries(); if (tr.length < 5) return null;
  const last = tr[tr.length - 1].d; const win = tr.filter(x => diffDays(x.d, last) <= 21);
  if (win.length < 5 || diffDays(win[0].d, last) < 10) return null;
  const xs = win.map(x => -diffDays(x.d, last)), ys = win.map(x => x.t);
  const mx = avg(xs), my = avg(ys); let nu = 0, de = 0;
  for (let i = 0; i < xs.length; i++) { nu += (xs[i] - mx) * (ys[i] - my); de += (xs[i] - mx) ** 2; }
  return de ? (nu / de) * 7 / ys[ys.length - 1] * 100 : null;
}
function rateFor(k) {
  const p = S.profile;
  if (p.mode !== 'auto') return MODES[p.mode].rate;
  const pl = planOn(k); return pl ? pl.ph.rate : PHASES[0].rate;
}
function targets(k = today()) {
  const p = S.profile, w = curWeight();
  const bmr = 10 * w + 6.25 * p.height - 5 * p.age + (p.sex === 'f' ? -161 : 5);
  const tdee = bmr * p.act;
  const rate = rateFor(k);
  const deficit = clamp(w * rate / 100 * 7700 / 7, -450, tdee * 0.25);
  const kcal = r25(tdee - deficit + (S.kcalAdj || 0));
  const prot = Math.round(w * (rate > 0 ? 2.2 : 2.0) / 5) * 5;
  const fat = Math.round(Math.max(0.7 * w, kcal * 0.25 / 9));
  const carb = Math.max(0, Math.round((kcal - prot * 4 - fat * 9) / 4));
  const pl = planOn(k); const training = pl && pl.day.k !== 'rest';
  const water = Math.round((w * 35 + (training ? 500 : 0)) / 250) * 250;
  return { bmr: Math.round(bmr), tdee: Math.round(tdee), deficit: Math.round(deficit), rate, kcal, prot, fat, carb, fib: Math.round(kcal / 1000 * 14), water, w };
}
function adaptSuggestion() {
  if (!S.profile) return null;
  if (diffDays(S.profile.start, today()) < 14) return null;
  const r = weeklyRate(); if (r == null) return null;
  if (S.adjDate && diffDays(S.adjDate, today()) < 7) return null;
  const t = targets(), goal = -t.rate;
  const say = r < 0 ? `Tu perds ${fmt(-r, 2)} % de ton poids par semaine` : `Ton poids monte de ${fmt(r, 2)} % par semaine`;
  if (t.rate > 0) {
    if (r > goal + 0.3) return { delta: -150, msg: `${say} (objectif : −${fmt(t.rate, 1)} %). On retire 150 kcal pour relancer la sèche.` };
    if (r < goal - 0.45) return { delta: 150, msg: `${say} : c’est trop rapide, tu risques d’y laisser du muscle. On ajoute 150 kcal.` };
  } else if (t.rate === 0) {
    if (r < -0.3) return { delta: 150, msg: `${say} alors que tu vises le maintien. On ajoute 150 kcal.` };
    if (r > 0.3) return { delta: -150, msg: `${say} alors que tu vises le maintien. On retire 150 kcal.` };
  } else {
    if (r < 0.05) return { delta: 150, msg: `${say} : pas assez pour construire. On ajoute 150 kcal.` };
    if (r > 0.5) return { delta: -100, msg: `${say} : trop rapide, ce serait surtout du gras. On retire 100 kcal.` };
  }
  return null;
}
function planScale(plan, kcal) {
  let pk = 0, ok = 0;
  for (const m of plan.meals) for (const [id, g] of m.items) { const f = FOODMAP[id]; const k = f.kcal * g / 100; if (f.p * 4 / f.kcal > 0.5) pk += k; else ok += k; }
  return clamp((kcal - pk) / (ok || 1), 0.55, 1.7);
}
function scaledItems(items, factor) {
  return items.map(([id, g]) => { const f = FOODMAP[id]; const prot = f.p * 4 / f.kcal > 0.5; let ng = prot ? g : g * factor; ng = ng >= 30 ? Math.round(ng / 5) * 5 : Math.max(1, Math.round(ng)); return [id, ng]; });
}
const itemsMac = items => sumMac(items.map(([f, g]) => ({ f, g })));

/* ================= Records & séances ================= */
function setScore(k, s, bw) {
  const ex = EX[k] || {}; const w = +s.w || 0, r = +s.r || 0;
  if (!r) return 0;
  if (ex.u === 's') return r;
  if (ex.u === 'm') return (w || 1) * r;
  if (ex.bw && !ex.inc) return r;
  const load = ex.bw ? (bw || curWeight()) + w : w;
  return load ? load * (1 + Math.min(r, 15) / 30) : r;
}
function lastFor(k, exceptId) {
  for (let i = S.workouts.length - 1; i >= 0; i--) {
    const w = S.workouts[i]; if (w.id === exceptId || !w.items) continue;
    const it = w.items.find(x => x.k === k && x.sets.length); if (it) return { date: w.date, sets: it.sets, bw: w.bw };
  }
  return null;
}
function bestFor(k, exceptId) {
  let b = 0;
  for (const w of S.workouts) { if (w.id === exceptId || !w.items) continue; for (const it of w.items) if (it.k === k) for (const s of it.sets) b = Math.max(b, setScore(k, s, w.bw)); }
  return b;
}
function suggestFor(k, lo, hi, rir) {
  const ex = EX[k]; const last = lastFor(k); if (!last) return null;
  const top = last.sets.reduce((m, s) => Math.max(m, +s.w || 0), 0);
  const allTop = last.sets.length > 0 && last.sets.every(s => (+s.r || 0) >= hi);
  if (ex.bw && !ex.inc) return { w: 0, r: allTop ? hi : null, up: false, msg: allTop ? 'Ajoute 1–2 reps ou ralentis le tempo' : null };
  if (allTop && ex.inc) return { w: round(top + ex.inc, 2), up: true, msg: `+${fmt(ex.inc, 2)} kg : tu as atteint ${hi} reps partout` };
  return { w: top, up: false, msg: null };
}
const MAIN_LIFTS = ['bench', 'squat', 'trapbar', 'ohp', 'pullup', 'row', 'rdl', 'incline_db'];
function liftHistory(k) {
  const out = [];
  for (const w of S.workouts) { if (!w.items) continue; let b = 0; for (const it of w.items) if (it.k === k) for (const s of it.sets) b = Math.max(b, setScore(k, s, w.bw)); if (b) out.push({ d: w.date, v: b }); }
  return out;
}
function weekVolume(k = today()) {
  const mon = mondayOf(k), v = {};
  for (const w of S.workouts) { if (!w.items || w.date < mon || w.date > addDays(mon, 6)) continue; for (const it of w.items) { const ex = EX[it.k]; if (!ex) continue; for (const [m, f] of Object.entries(ex.m)) v[m] = (v[m] || 0) + f * it.sets.length; } }
  return v;
}

/* ================= XP, missions, série ================= */
let _xpCache = null;
function invalidate() { _xpCache = null; }
function computeXP() {
  if (_xpCache != null) return _xpCache;
  let xp = 0;
  for (const w of S.workouts) xp += (w.kind === 'gym' || w.kind === 'cage' ? 100 : w.kind === 'rest' ? 25 : 70) + (w.prs || 0) * 40;
  if (S.profile) for (const d in S.food) { const n = dayNut(d); if (!n.kcal) continue; const t = targets(d); if (n.p >= t.prot * 0.9) xp += 30; if (n.kcal >= t.kcal * 0.9 && n.kcal <= t.kcal * 1.1) xp += 30; }
  xp += S.weights.length * 10 + S.measures.length * 15 + S.tests.length * 30 + S.photos.length * 20;
  for (const d in S.habits) { const h = S.habits[d]; xp += (h.steps ? 10 : 0) + (h.sleep ? 10 : 0) + (h.creat ? 5 : 0); }
  if (S.profile) for (const d in S.water) { if (S.water[d] >= targets(d).water) xp += 10; }
  return (_xpCache = xp);
}
function rankOf(xp) {
  let i = 0; while (i + 1 < RANKS.length && xp >= RANKS[i + 1][0]) i++;
  const cur = RANKS[i], nxt = RANKS[i + 1];
  return { lvl: i + 1, name: cur[1], from: cur[0], to: nxt ? nxt[0] : cur[0], next: nxt ? nxt[1] : null, pct: nxt ? (xp - cur[0]) / (nxt[0] - cur[0]) : 1 };
}
function missions(k = today()) {
  const pl = planOn(k), t = targets(k), n = dayNut(k), h = S.habits[k] || {}, wt = S.weights.find(x => x.d === k), water = S.water[k] || 0;
  const L = [];
  if (pl && pl.day.k !== 'rest') L.push({ id: 'session', t: `Séance · ${pl.day.t}`, s: pl.day.sub, ok: !!doneFor(pl.week, pl.dow) || workoutsOn(k).length > 0, xp: pl.day.k === 'gym' || pl.day.k === 'cage' ? 100 : 70, a: 'openToday' });
  L.push({ id: 'prot', t: `Protéines · ${t.prot} g`, s: `${fmt(n.p)} g pour l’instant`, ok: n.p >= t.prot * 0.9, xp: 30, a: 'tab', v: 'food' });
  L.push({ id: 'kcal', t: `Calories · ${fmt(t.kcal)} kcal`, s: `${fmt(n.kcal)} kcal (±10 % validé)`, ok: n.kcal >= t.kcal * 0.9 && n.kcal <= t.kcal * 1.1, xp: 30, a: 'tab', v: 'food' });
  L.push({ id: 'water', t: `Eau · ${fmt(t.water / 1000, 2)} L`, s: `${fmt(water / 1000, 2)} L · touche pour +250 ml`, ok: water >= t.water, xp: 10, a: 'water', v: 250 });
  L.push({ id: 'weigh', t: 'Pesée du matin', s: wt ? `${fmt(wt.kg, 1)} kg` : 'À jeun, après les toilettes', ok: !!wt, xp: 10, a: 'weigh' });
  L.push({ id: 'steps', t: '8 000 pas', s: 'Coche quand c’est fait', ok: !!h.steps, xp: 10, a: 'habit', v: 'steps' });
  L.push({ id: 'sleep', t: 'Nuit de 7 h ou plus', s: 'Le sommeil fait fondre le gras', ok: !!h.sleep, xp: 10, a: 'habit', v: 'sleep' });
  L.push({ id: 'creat', t: 'Créatine 5 g', s: 'Tous les jours, même au repos', ok: !!h.creat, xp: 5, a: 'habit', v: 'creat' });
  return L;
}
function validated(k) {
  const pl = planOn(k); const need = pl && pl.day.k !== 'rest';
  const sOK = !need || !!doneFor(pl.week, pl.dow) || workoutsOn(k).length > 0;
  return sOK && dayNut(k).p >= targets(k).prot * 0.9;
}
function streak() {
  let s = 0, k = today(); if (validated(k)) s++;
  k = addDays(k, -1);
  while (s < 400 && k >= S.created && validated(k)) { s++; k = addDays(k, -1); }
  return s;
}
function navyBF(m) {
  const p = S.profile; if (!m || !m.waist || !m.neck) return null;
  if (p.sex === 'f') { if (!m.hips) return null; const v = 495 / (1.29579 - 0.35004 * Math.log10(m.waist + m.hips - m.neck) + 0.221 * Math.log10(p.height)) - 450; return clamp(v, 3, 60); }
  if (m.waist - m.neck <= 0) return null;
  return clamp(495 / (1.0324 - 0.19077 * Math.log10(m.waist - m.neck) + 0.15456 * Math.log10(p.height)) - 450, 3, 60);
}
const lastMeasure = () => [...S.measures].sort((a, b) => a.d < b.d ? -1 : 1).pop();
const firstMeasure = () => [...S.measures].sort((a, b) => a.d < b.d ? -1 : 1)[0];

/* ================= Feedback : son, vibration, toast, effets ================= */
let AC = null;
function audio() {
  if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
  if (AC.state === 'suspended') AC.resume();
  return AC;
}
function setLoud(on) { try { if (navigator.audioSession) navigator.audioSession.type = on && S.settings.loud ? 'playback' : 'auto'; } catch (e) { /* ignore */ } }
function beep(f = 880, d = 0.12, type = 'sine', vol = 0.3, when = 0) {
  if (!S.settings.sound) return; const ac = audio(); if (!ac) return;
  const t = ac.currentTime + when, o = ac.createOscillator(), g = ac.createGain();
  o.type = type; o.frequency.value = f;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  o.connect(g).connect(ac.destination); o.start(t); o.stop(t + d + 0.03);
}
const bell = () => { beep(523, 0.7, 'triangle', 0.4); beep(784, 0.8, 'triangle', 0.25, 0.01); beep(1046, 0.6, 'sine', 0.15, 0.02); };
function tapSwitch() {
  const l = document.createElement('label'); l.setAttribute('aria-hidden', 'true'); l.style.display = 'none';
  const i = document.createElement('input'); i.type = 'checkbox'; i.setAttribute('switch', ''); l.appendChild(i);
  document.head.appendChild(l); l.click(); l.remove();
}
function haptic(n = 1) {
  if (!S.settings.haptics) return;
  try { if (navigator.vibrate) { navigator.vibrate(n > 1 ? [14, 70, 14] : 14); return; } for (let i = 0; i < n; i++) setTimeout(tapSwitch, i * 110); } catch (e) { /* ignore */ }
}
let toastT;
function toast(msg) { const t = $('#toast'); if (!t) return; t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2600); }
function confetti(n = 90) {
  if (reduced()) return;
  const c = $('#fx'), ctx = c.getContext('2d'), dpr = devicePixelRatio || 1, W = innerWidth, H = innerHeight;
  c.width = W * dpr; c.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const cols = ['#2BB884', '#4A7FE8', '#EE6E5C', '#E3A332', '#8FD9BB'];
  const ps = Array.from({ length: n }, (_, i) => ({ x: W / 2 + (Math.random() - .5) * 80, y: H * .3, vx: (Math.random() - .5) * 11, vy: -Math.random() * 11 - 4, s: 3 + Math.random() * 4, r: Math.random() * 6.3, vr: (Math.random() - .5) * .2, c: cols[i % cols.length], round: i % 2 }));
  const t0 = performance.now();
  (function frame(t) {
    const el = t - t0; ctx.clearRect(0, 0, W, H);
    for (const p of ps) {
      p.vy += .3; p.vx *= .985; p.x += p.vx; p.y += p.vy; p.r += p.vr;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.globalAlpha = Math.max(0, 1 - el / 2200); ctx.fillStyle = p.c;
      ctx.beginPath(); if (p.round) ctx.arc(0, 0, p.s, 0, 6.29); else ctx.roundRect ? ctx.roundRect(-p.s, -p.s / 2, p.s * 2, p.s, p.s / 2) : ctx.rect(-p.s, -p.s / 2, p.s * 2, p.s); ctx.fill(); ctx.restore();
    }
    if (el < 2200) requestAnimationFrame(frame); else ctx.clearRect(0, 0, W, H);
  })(t0);
}
function prFlash(text = 'Nouveau record') {
  const d = document.createElement('div'); d.className = 'pr-flash';
  d.innerHTML = `<div class="in"><span class="pr-ic">${ic('trophy')}</span><div><div class="t">${esc(text)}</div><div class="small">Bravo, tu progresses</div></div></div>`;
  document.body.appendChild(d); setTimeout(() => d.remove(), 2300);
}
let WL = null;
async function requestWake() { try { if ('wakeLock' in navigator && !WL) { WL = await navigator.wakeLock.request('screen'); WL.addEventListener('release', () => { WL = null; }); } } catch (e) { WL = null; } }
function releaseWake() { try { if (WL) WL.release(); } catch (e) { /* ignore */ } WL = null; }

/* ================= Icônes ================= */
const I = {
  today: '<path d="M8.3 3h7.4L21 8.3v7.4L15.7 21H8.3L3 15.7V8.3z"/><path d="M12 7.5V12l3 2"/>',
  dumbbell: '<path d="M6.5 7v10M3.5 9.5v5M17.5 7v10M20.5 9.5v5M6.5 12h11"/>',
  food: '<path d="M7 3v7a2 2 0 0 0 4 0V3M9 12v9M17 21V3c-2.2 1.5-3 4-3 7 0 2 1 3 3 3"/>',
  chart: '<path d="M3 21h18M6.5 17v-4M11 17V8M15.5 17v-6M20 17V4"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.4-3.8 4.4-6 8-6s6.6 2.2 8 6"/>',
  cage: '<path d="M8.3 3h7.4L21 8.3v7.4L15.7 21H8.3L3 15.7V8.3z"/><path d="M9 3.5v17M15 3.5v17M3.5 12h17"/>',
  swim: '<path d="M2 17c2 0 2-1.4 4-1.4s2 1.4 4 1.4 2-1.4 4-1.4 2 1.4 4 1.4 2-1.4 4-1.4M2 21c2 0 2-1.4 4-1.4s2 1.4 4 1.4 2-1.4 4-1.4 2 1.4 4 1.4 2-1.4 4-1.4"/><circle cx="17" cy="6" r="2"/><path d="M4.5 13 9.5 8l3.5 3 2-2"/>',
  run: '<circle cx="15" cy="4.5" r="2"/><path d="m6 21 3.5-5 3 2.5L14 13l3 3h3M8.5 10.5 12 8l3 2 1.5 3M5 12l3.5-1.5"/>',
  moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  back: '<path d="M15 5 8 12l7 7"/>',
  next: '<path d="m9 5 7 7-7 7"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
  swap: '<path d="M7 4 4 7l3 3M4 7h13M17 20l3-3-3-3M20 17H7"/>',
  timer: '<circle cx="12" cy="13.5" r="7.5"/><path d="M12 9.5v4l2.5 1.5M9.5 2.5h5M19 6l1.5-1.5"/>',
  flame: '<path d="M12 22c4 0 7-2.7 7-6.8 0-3.2-2-5.4-3.4-7-.3 1.6-1.1 2.8-2.3 3.4.3-3.5-1.3-6.7-4.3-8.6.2 3-1.3 5.1-2.8 6.9C4.9 11.4 5 12.7 5 15.2 5 19.3 8 22 12 22z"/>',
  trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H4.5c0 3 1.5 4.5 3.7 4.8M16 6h3.5c0 3-1.5 4.5-3.7 4.8M12 13v4M8.5 20.5h7M9.5 17h5v3.5h-5z"/>',
  scale: '<rect x="3" y="3" width="18" height="18" rx="5"/><path d="M8 8.5a6 6 0 0 1 8 0l-2.5 3h-3z"/>',
  ruler: '<path d="M3 16.5 16.5 3 21 7.5 7.5 21z"/><path d="m7 12.5 2 2M10 9.5l2 2M13 6.5l2 2"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  play: '<path d="M7 4.5v15l12-7.5z"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  reset: '<path d="M4 12a8 8 0 1 0 2.3-5.7M4 4v4.5h4.5"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16zM14 6l4 4"/>',
  share: '<path d="M12 3v12M7.5 7.5 12 3l4.5 4.5M5 12v8h14v-8"/>',
  download: '<path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 20h14"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',
  drop: '<path d="M12 3s6 6.4 6 11a6 6 0 0 1-12 0c0-4.6 6-11 6-11z"/>',
  book: '<path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5zM4 21.5A2.5 2.5 0 0 1 6.5 19H20"/>',
  octo: '<path d="M8.3 3h7.4L21 8.3v7.4L15.7 21H8.3L3 15.7V8.3z"/>',
  octoCheck: '<path d="M8.3 3h7.4L21 8.3v7.4L15.7 21H8.3L3 15.7V8.3z"/><path d="m8 12.3 2.8 2.8L16.5 9.4"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  sparkle: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
  more: '<circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/>',
  tree: '<path d="M12 21v-6M12 3 6.5 11h3L6 16h12l-3.5-5h3z"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.9-3.3 3.4-5 6.5-5s5.6 1.7 6.5 5M16 4.6a3.5 3.5 0 0 1 0 6.8M18 15.3c1.7.6 3 2.2 3.5 4.7"/>',
  circle: '<circle cx="12" cy="12" r="9"/>',
  circleCheck: '<circle cx="12" cy="12" r="9"/><path d="m8 12.4 2.7 2.7L16.2 9.6"/>',
  heart: '<path d="M12 20s-7.5-4.4-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.6-7.5 10-7.5 10z"/>'
};
const ic = (n, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${I[n] || ''}</svg>`;

/* ================= Composants ================= */
function octPath(cx, cy, a) {
  const R = a / Math.cos(Math.PI / 8); let d = `M${cx.toFixed(2)} ${(cy - a).toFixed(2)}`;
  for (let i = 0; i < 8; i++) { const ang = (-67.5 + 45 * i) * Math.PI / 180; d += ` L${(cx + R * Math.cos(ang)).toFixed(2)} ${(cy + R * Math.sin(ang)).toFixed(2)}`; }
  return d + ' Z';
}
function ring(size, rings, sw, gap, center = '') {
  let s = '', r = size / 2 - sw / 2; const c = size / 2;
  for (const g of rings) {
    const L = 2 * Math.PI * r, pct = clamp(g.pct || 0, 0, 1);
    s += `<circle class="trk" cx="${c}" cy="${c}" r="${r.toFixed(2)}" stroke-width="${sw}"/><circle class="val" cx="${c}" cy="${c}" r="${r.toFixed(2)}" transform="rotate(-90 ${c} ${c})" style="stroke:${g.color}" stroke-width="${sw}" stroke-dasharray="${L.toFixed(1)}" stroke-dashoffset="${L.toFixed(1)}" data-off="${(L * (1 - pct)).toFixed(1)}"/>`;
    r -= sw + gap;
  }
  return `<div class="ring" style="width:${size}px;height:${size}px"><svg viewBox="0 0 ${size} ${size}" aria-hidden="true">${s}</svg><div class="ctr">${center}</div></div>`;
}
const octSmall = (cls = '') => `<svg class="oct ${cls}" viewBox="0 0 26 26"><circle cx="13" cy="13" r="10"/></svg>`;
function bar(pct, cls = '') { const p = clamp(pct, 0, 1); return `<div class="bar ${cls} ${pct > 1.05 ? 'over' : ''}"><i data-w="${(p * 100).toFixed(1)}"></i></div>`; }
function animateIn(root = document) {
  requestAnimationFrame(() => requestAnimationFrame(() => {
    $$('.val[data-off]', root).forEach(p => { p.style.strokeDashoffset = p.dataset.off; });
    $$('.bar>i[data-w], .vb>i[data-w]', root).forEach(b => { b.style.width = b.dataset.w + '%'; });
  }));
}
function spark(vals, w = 80, h = 30, color = 'var(--acc2)') {
  if (vals.length < 2) return `<svg class="spark" viewBox="0 0 ${w} ${h}"><line x1="0" y1="${h / 2}" x2="${w}" y2="${h / 2}" style="stroke:var(--s3)" stroke-width="2" stroke-dasharray="3 4"/></svg>`;
  const mn = Math.min(...vals), mx = Math.max(...vals), rg = mx - mn || 1;
  const pts = vals.map((v, i) => `${(i / (vals.length - 1) * (w - 4) + 2).toFixed(1)},${(h - 3 - (v - mn) / rg * (h - 6)).toFixed(1)}`);
  return `<svg class="spark" viewBox="0 0 ${w} ${h}"><polyline points="${pts.join(' ')}" fill="none" style="stroke:${color}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/><circle cx="${pts[pts.length - 1].split(',')[0]}" cy="${pts[pts.length - 1].split(',')[1]}" r="3" style="fill:${color}"/></svg>`;
}
function targetTxt(e) {
  const ex = EX[e[0]]; const u = ex.u === 's' ? ' s' : ex.u === 'm' ? ' m' : '';
  const reps = e[2] === e[3] ? `${e[2]}` : `${e[2]}–${e[3]}`;
  return `${e[1]} × ${reps}${u} · RIR ${e[4]} · repos ${mmss(e[5])}`;
}
function setsTxt(sets, k) {
  const ex = EX[k] || {};
  return sets.map(s => { const w = +s.w || 0; const r = s.r; if (ex.u === 's') return `${r} s`; if (ex.u === 'm') return `${fmt(w, 2)} kg × ${r} m`; if (ex.bw && !w) return `${r}`; return `${fmt(w, 2)}×${r}`; }).join(' · ');
}

/* ================= Thème ================= */
const darkMQ = matchMedia('(prefers-color-scheme: dark)');
function applyTheme() {
  const t = S.settings.theme || 'auto', root = document.documentElement;
  if (t === 'auto') delete root.dataset.theme; else root.dataset.theme = t;
  const dark = t === 'dark' || (t === 'auto' && darkMQ.matches);
  $$('meta[name="theme-color"]').forEach(m => { m.setAttribute('content', dark ? '#0E1110' : '#F4F4F1'); m.removeAttribute('media'); });
}
darkMQ.addEventListener && darkMQ.addEventListener('change', () => { applyTheme(); if (typeof drawCharts === 'function') drawCharts(); });

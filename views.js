/* FAUVE — écrans, overlays et feuilles */
'use strict';

const isStandalone = () => navigator.standalone === true || matchMedia('(display-mode: standalone)').matches;
const ovBar = (title, right = '') => `<div class="ov-bar"><button class="ibtn" data-a="closeOv" aria-label="Retour">${ic('back')}</button><div class="t">${title}</div>${right || '<span style="width:44px"></span>'}</div>`;
const sec = (title, right = '') => `<div class="sec"><h2 class="h2">${title}</h2>${right}</div>`;

/* ================= Rendu principal ================= */
const TABS = [['today', 'Aujourd’hui', 'today'], ['train', 'Programme', 'dumbbell'], ['food', 'Nutrition', 'food'], ['prog', 'Progrès', 'chart'], ['me', 'Moi', 'user']];
function renderTabbar() {
  const tb = $('#tabbar'); const i = Math.max(0, TABS.findIndex(t => t[0] === S.ui.tab));
  if (!tb.dataset.built) {
    tb.innerHTML = `<span class="pill"></span>` + TABS.map(t => `<button data-a="tab" data-v="${t[0]}" aria-label="${t[1]}">${ic(t[2])}<span>${t[1]}</span></button>`).join('');
    tb.dataset.built = '1';
  }
  $$('button', tb).forEach((b, j) => { b.classList.toggle('on', j === i); b.setAttribute('aria-current', j === i ? 'page' : 'false'); });
  const pill = $('.pill', tb); pill.style.width = `calc((100% - 12px) / ${TABS.length})`; pill.style.transform = `translateX(${i * 100}%)`;
}
function render() {
  if (!S.profile) return;
  invalidate();
  const v = $('#view'); v.style.padding = '';
  v.innerHTML = ({ today: vToday, train: vTrain, food: vFood, prog: vProg, me: vMe }[S.ui.tab] || vToday)();
  renderTabbar(); $('#tabbar').classList.toggle('away', !!OV); animateIn(v); drawCharts(); fillPhotos();
}
function go(tab) {
  if (tab === S.ui.tab) { scrollTo({ top: 0, behavior: 'smooth' }); return; }
  S.ui.tab = tab; if (tab === 'food') S.ui.foodDate = null; save();
  const run = () => { render(); scrollTo(0, 0); };
  if (document.startViewTransition && !reduced()) document.startViewTransition(run); else run();
}

/* ================= Poster ================= */
function poster(o) {
  const open = o.open ? `data-a="${o.open[0]}" ${o.open[1] || ''} role="button" tabindex="0"` : '';
  return `<article class="hero k-${o.kind} anim-in" ${open}>
    <div class="hero-top"><span>${o.top}</span>${o.done ? `<span class="tag done">${ic('check')} Faite</span>` : ''}</div>
    <div class="hero-main"><div class="grow"><div class="hero-t">${esc(o.title)}</div><div class="hero-s">${esc(o.sub)}</div></div><div class="hero-ic">${ic(KIND_IC[o.kind] || 'dumbbell')}</div></div>
    <div class="chips">${(o.chips || []).map(c => `<span class="tag">${c}</span>`).join('')}</div>
    ${o.btn ? `<button class="btn pri block" data-a="${o.btn[0]}" ${o.btn[2] || ''}>${o.btn[1]}</button>` : ''}</article>`;
}
function posterToday(k, pl) {
  const p = S.profile;
  if (!pl) {
    const n = diffDays(k, p.start);
    return poster({ kind: 'pre', top: `Départ dans ${n} jour${n > 1 ? 's' : ''}`, title: 'Prépare ton départ', sub: `Le programme démarre ${DOW[dowOf(p.start)].toLowerCase()} ${fdate(p.start)}`,
      chips: ['Tests de départ', 'Photos', 'Mensurations'], btn: ['tests', `${ic('flag')} Faire les tests de départ`] });
  }
  const d = pl.day, done = doneFor(pl.week, pl.dow);
  const chips = [`${d.dur} min`, KIND_N[d.k]];
  if (d.ex.length) chips.push(`${d.ex.length} exercices`);
  if (pl.deload) chips.push('Décharge');
  if (S.slots[pl.dow]) chips.push(`${ic('clock')} ${esc(S.slots[pl.dow])}`);
  const attrs = `data-w="${pl.week}" data-d="${pl.dow}"`;
  let btn;
  if (done) btn = ['session', 'Voir la séance', attrs];
  else if (d.k === 'gym' || d.k === 'cage') btn = S.active && S.active.week === pl.week && S.active.dow === pl.dow ? ['resume', 'Reprendre la séance'] : ['start', 'Commencer la séance', attrs];
  else btn = ['session', d.k === 'rest' ? 'Voir le programme du jour' : 'Voir la séance', attrs];
  return poster({ kind: d.k, top: `Séance du jour · semaine ${pl.week}`, title: d.t, sub: d.sub, chips, done: !!done, btn, open: ['session', attrs] });
}

/* ================= Aujourd'hui ================= */
function vToday() {
  const k = today(), p = S.profile, pl = planOn(k), t = targets(k), n = dayNut(k), st = streak(), xp = computeXP(), rk = rankOf(xp);
  const hr = new Date().getHours(); const hello = hr < 5 ? 'Bonne nuit' : hr < 12 ? 'Bonjour' : hr < 18 ? 'Salut' : 'Bonsoir';
  let h = `<header class="hd"><div><div class="over">${fdateL(k)}${pl ? ` · ${esc(pl.ph.name)}` : ''}</div><h1 class="h1">${hello}${p.name ? ` ${esc(p.name)}` : ''}</h1></div>
    <div class="hd-r"><button class="chip" data-a="streakInfo" aria-label="Série de jours réussis" style="background:var(--s1);box-shadow:var(--shadow)">${ic('flame', 'sand')}<span class="streak num">${st}</span></button></div></header>`;
  if (!isStandalone() && !S.dismiss.install) h += `<div class="card install anim-in" style="margin-bottom:12px;padding:12px 14px">${ic('share')}<div class="grow small" style="color:var(--ink)">Installe Fauve : dans Safari, touche <b>Partager</b> puis <b>Sur l’écran d’accueil</b>.</div><button class="ibtn" data-a="dismiss" data-v="install" aria-label="Masquer">${ic('x')}</button></div>`;
  if (S.active) h += `<button class="card tight row anim-in" style="width:100%;margin-bottom:12px;text-align:left;border-color:var(--acc2)" data-a="resume"><span class="kico gym">${ic('dumbbell')}</span><span class="grow"><span class="ttl" style="display:block;font-weight:700">Séance en cours · ${esc(S.active.title)}</span><span class="small">Démarrée à ${new Date(S.active.start).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span></span><span class="tag fau">Reprendre</span></button>`;
  h += posterToday(k, pl);
  h += sec('Nutrition', `<button class="link" data-a="tab" data-v="food">Journal</button>`) + nutCard(t, n);
  const sug = adaptSuggestion(); if (sug) h += adaptCard(sug);
  const ms = missions(k);
  h += sec('Objectifs du jour', `<span class="small num">${ms.filter(m => m.ok).length} sur ${ms.length}</span>`) + `<div class="card tight">${ms.map(missionRow).join('')}</div>`;
  h += sec('Cette semaine') + weekCard(k);
  h += levelCard(xp, rk, st);
  const needBackup = S.workouts.length >= 5 && (!S.lastExport || diffDays(S.lastExport, k) > 14);
  if (needBackup) h += `<div class="card tight row" style="margin-top:12px">${ic('download', 'sand')}<div class="grow small" style="color:var(--ink)">Pense à sauvegarder tes données (elles ne vivent que sur ce téléphone).</div><button class="btn sm" data-a="export">Sauver</button></div>`;
  h += `<div class="card tip" style="margin-top:12px"><span class="tip-ic">${ic('sparkle')}</span><div><div class="lbl">Conseil du jour</div><div style="margin-top:2px">${esc(TIPS[Math.abs(diffDays(S.created, k)) % TIPS.length])}</div></div></div>`;
  return h;
}
function nutCard(t, n) {
  const left = t.kcal - n.kcal;
  const center = `<div class="mid num" style="font-size:23px">${fmt(Math.abs(left))}</div><div class="small" style="font-size:11px;line-height:1.2;margin-top:3px">kcal<br>${left >= 0 ? 'restantes' : 'en plus'}</div>`;
  return `<div class="card" data-a="tab" data-v="food" role="button"><div class="nut-hero">${ring(148, [{ pct: n.p / t.prot, color: 'var(--pro)' }, { pct: n.c / t.carb, color: 'var(--carb)' }, { pct: n.f / t.fat, color: 'var(--fat)' }], 10, 3.5, center)}
    <div>${macroRow('Protéines', n.p, t.prot, 'var(--pro)', 'pro')}${macroRow('Glucides', n.c, t.carb, 'var(--carb)', 'cob')}${macroRow('Lipides', n.f, t.fat, 'var(--fat)', 'sand')}</div></div></div>`;
}
const macroRow = (name, v, tgt, col, cls) => `<div class="macro"><div class="row sb" style="gap:6px;margin-bottom:6px"><span class="lbl row" style="gap:7px"><span class="dot" style="background:${col}"></span>${name}</span><span class="small num nowrap"><b style="color:var(--ink)">${fmt(v)}</b>/${fmt(tgt)} g</span></div>${bar(v / (tgt || 1), cls)}</div>`;
const adaptCard = s => `<div class="card" style="margin-top:12px"><div class="row" style="margin-bottom:8px">${ic('sparkle', 'fau')}<span class="h3">Ajustement proposé</span></div><p class="sub">${esc(s.msg)}</p>
  <div class="row"><button class="btn pri sm grow" data-a="adapt" data-v="${s.delta}">${s.delta > 0 ? '+' : '−'}${Math.abs(s.delta)} kcal / jour</button><button class="btn ghost sm" data-a="adaptLater">Plus tard</button></div></div>`;
const missionRow = m => `<button class="mission ${m.ok ? 'ok' : ''}" data-a="${m.a}" data-v="${m.v == null ? '' : m.v}"><span class="mk">${ic(m.ok ? 'circleCheck' : 'circle')}</span><span class="grow"><span class="mt">${esc(m.t)}</span><span class="ms">${esc(m.s)}</span></span><span class="xp">+${m.xp}</span></button>`;
function weekCard(k) {
  const mon = mondayOf(k); let cells = '';
  for (let i = 0; i < 7; i++) {
    const dk = addDays(mon, i), pl = planOn(dk), rest = pl && pl.day.k === 'rest';
    const done = pl ? !!doneFor(pl.week, i) || (rest && dk <= k && validated(dk)) : workoutsOn(dk).length > 0;
    const cls = ['wd', dk === k ? 'today' : '', done ? 'done' : '', rest ? 'rest' : ''].join(' ');
    cells += `<button class="${cls}" ${pl ? `data-a="session" data-w="${pl.week}" data-d="${i}"` : ''} aria-label="${DOW[i]}">${DOW_S[i]}${octSmall()}<span class="num">${dateOf(dk).getDate()}</span></button>`;
  }
  return `<div class="card tight"><div class="week">${cells}</div></div>`;
}
function levelCard(xp, rk, st) {
  return `<div class="card" style="margin-top:12px"><div class="lvl"><div class="badge">${ring(56, [{ pct: rk.pct, color: 'var(--acc2)' }], 5, 0, '')}<span style="position:absolute;inset:0;display:grid;place-items:center">${rk.lvl}</span></div>
    <div class="grow"><div class="lbl">Niveau ${rk.lvl}</div><div class="h2" style="font-size:24px">${esc(rk.name)}</div><div style="margin:8px 0 6px">${bar(rk.pct)}</div>
    <div class="small num">${fmt(xp)} points${rk.next ? ` · encore ${fmt(rk.to - xp)} avant <span class="nowrap">« ${esc(rk.next)} »</span>` : ' · niveau maximal'}</div></div></div>
    <div class="sep"></div><div class="row sb small"><span>${ic('flame', 'sand')}</span><span class="grow" style="color:var(--ink)">Série : <b class="num">${st}</b> jour${st > 1 ? 's' : ''} réussi${st > 1 ? 's' : ''}</span><span>séance + protéines</span></div></div>`;
}

/* ================= Programme ================= */
function vTrain() {
  const k = today(), cw = Math.max(1, weekOf(k)), maxW = Math.max(PROGRAM_WEEKS + 4, cw + 2);
  const w = clamp(S.ui.week || cw, 1, maxW), ph = phaseOfWeek(w);
  let h = `<header class="hd"><div><div class="over">18 semaines, 3 phases</div><h1 class="h1">Programme</h1></div></header>`;
  const fills = PHASES.map(p => p.id === 4 ? clamp((cw - 18) / 6, 0, 1) : clamp((cw - p.from + 1) / (p.to - p.from + 1), 0, 1));
  h += `<div class="card"><div class="over">Phase ${ph.id} · ${ph.to === 999 ? `dès la semaine ${ph.from}` : `semaines ${ph.from} à ${ph.to}`}</div><div class="h1" style="font-size:30px;margin:4px 0 8px">${esc(ph.name)}</div><p class="sub" style="margin:0">${esc(ph.goal)}</p>
    <div class="tl">${fills.map(f => `<div class="tl-seg"><i style="width:${(f * 100).toFixed(0)}%"></i></div>`).join('')}</div>
    <div class="tl-l">${PHASES.map(p => `<span class="${p.id === ph.id ? 'on' : ''}">${esc(p.name)}</span>`).join('')}</div></div>`;
  const tags = []; if (w === cw) tags.push('<span class="tag fau">En cours</span>'); if (DELOAD_WEEKS.includes(w)) tags.push('<span class="tag cob">Décharge</span>'); if (TEST_WEEKS.includes(w)) tags.push('<span class="tag sand">Tests</span>');
  h += `<div class="row" style="margin:22px 0 10px"><button class="ibtn" data-a="weekNav" data-v="-1" ${w <= 1 ? 'disabled style="opacity:.3"' : ''} aria-label="Semaine précédente">${ic('back')}</button>
    <div class="grow" style="text-align:center"><div class="h2" style="font-size:22px">Semaine ${w}</div><div class="small">${fdate(dateFor(w, 0))} – ${fdate(dateFor(w, 6))}</div><div class="chips" style="justify-content:center;margin-top:6px">${tags.join('')}</div></div>
    <button class="ibtn" data-a="weekNav" data-v="1" ${w >= maxW ? 'disabled style="opacity:.3"' : ''} aria-label="Semaine suivante">${ic('next')}</button></div>`;
  h += `<div class="card tight stagger">`;
  for (let i = 0; i < 7; i++) {
    const pl = planFor(w, i), dk = dateFor(w, i), done = doneFor(w, i), d = pl.day;
    h += `<button class="li" data-a="session" data-w="${w}" data-d="${i}"><span class="kico ${done ? 'done' : d.k}">${ic(done ? 'check' : KIND_IC[d.k])}</span><span class="grow"><span class="ttl">${DOW[i]} · ${esc(d.t)}</span><span class="meta">${esc(d.sub)} · ${d.dur} min${dk === k ? ' · <b style="color:var(--fau2)">aujourd’hui</b>' : ''}</span></span><span class="end small">${fdate(dk)}</span></button>`;
  }
  h += `</div>`;
  h += sec('Outils') + `<div class="grid2">
    <button class="card" style="text-align:left;padding:16px" data-a="timer" data-v="mma5">${ic('timer', 'fau')}<div class="h3" style="margin-top:10px">Chrono</div><div class="small">Intervalles, HIIT, Tabata</div></button>
    <button class="card" style="text-align:left;padding:16px;margin:0" data-a="library">${ic('book', 'fau')}<div class="h3" style="margin-top:10px">Exercices</div><div class="small">Placements et conseils</div></button>
    <button class="card" style="text-align:left;padding:16px;margin:0" data-a="tests">${ic('flag', 'fau')}<div class="h3" style="margin-top:10px">Tests</div><div class="small">Semaines 1 et 18</div></button>
    <button class="card" style="text-align:left;padding:16px;margin:0" data-a="slots">${ic('clock', 'fau')}<div class="h3" style="margin-top:10px">Créneaux</div><div class="small">Planifie tes séances</div></button></div>`;
  return h;
}
function blocksHtml(b) {
  return `<ol style="margin:0;padding-left:20px">${b.map(x => x.startsWith('·') ? `<li style="list-style:none;margin-left:-4px;color:var(--mut)">${esc(x)}</li>` : `<li style="margin:6px 0">${esc(x)}</li>`).join('')}</ol>`;
}
function openSession(w, d) {
  const pl = planFor(w, d), day = pl.day, dk = dateFor(w, d), done = doneFor(w, d);
  const chips = [`${day.dur} min`, KIND_N[day.k]]; if (day.ex.length) chips.push(`${day.ex.length} exercices`);
  let h = ovBar(`Semaine ${w} · ${DOW[d]}`);
  h += poster({ kind: day.k, top: `${esc(pl.ph.name)} · ${fdate(dk)}`, title: day.t, sub: day.sub, chips, done: !!done });
  if (pl.deload) h += `<div class="note fau" style="margin-top:12px">Semaine de décharge : séries réduites, garde 3 à 4 reps en réserve. Le corps encaisse le travail des semaines passées.</div>`;
  if (pl.test && d === 0) h += `<div class="note" style="margin-top:12px">Semaine de tests : fais tes 4 tests athlétiques cette semaine (Programme › Tests).</div>`;
  if (day.ex.length) {
    h += sec('Exercices') + `<div class="card tight">`;
    day.ex.forEach(e => {
      const ex = EX[e[0]], last = lastFor(e[0]);
      h += `<details class="acc"><summary><span><span style="display:block;font-weight:700">${esc(ex.n)}</span><span class="small">${esc(targetTxt(e))}</span></span>${ic('plus')}</summary><div class="acc-b"><div class="small" style="margin-bottom:6px">${esc(ex.eq)}</div><ul class="cues">${ex.cues.map(c => `<li>${esc(c)}</li>`).join('')}</ul>${last ? `<div class="exc-last">Dernière fois : <b>${esc(setsTxt(last.sets, e[0]))}</b></div>` : ''}</div></details>`;
    });
    h += `</div>`;
  }
  if (day.b.length) h += sec(day.k === 'cage' ? 'Ensuite' : 'Déroulé') + `<div class="card">${blocksHtml(day.b)}${day.timer ? `<button class="btn cob block" style="margin-top:14px" data-a="timer" data-v="${day.timer}">${ic('timer')} Ouvrir le chrono</button>` : ''}</div>`;
  if (done) h += `<div class="note" style="margin-top:12px">Validée ${dayLabel(done.date).toLowerCase()}${done.dur ? ` · ${done.dur} min` : ''}${done.sets ? ` · ${done.sets} séries` : ''}.</div>`;
  const attrs = `data-w="${w}" data-d="${d}"`;
  let foot;
  if (day.k === 'gym' || day.k === 'cage') {
    const cur = S.active && S.active.week === w && S.active.dow === d;
    foot = `<button class="btn pri block" data-a="${cur ? 'resume' : 'start'}" ${attrs}>${cur ? 'Reprendre la séance' : done ? 'Refaire la séance' : 'Commencer la séance'}</button>`;
  } else if (done) foot = `<button class="btn ghost block" data-a="undoDone" data-v="${done.id}">Annuler la validation</button>`;
  else foot = `<button class="btn pri block" data-a="cardioDone" ${attrs}>${ic('check')} C\u2019est fait</button>`;
  showOv(h, 'session', foot);
}

/* ================= Overlays génériques ================= */
let OV = null;
function showOv(html, name, foot = '') {
  const l = $('#layer');
  l.innerHTML = `<div class="ov" data-ov="${name}"><div class="ov-in">${html}</div></div>${foot ? `<div class="ov-foot"><div>${foot}</div></div>` : ''}`;
  OV = name; $('#tabbar').classList.add('away'); document.documentElement.classList.add('lock'); animateIn(l);
}
function closeOv() {
  const l = $('#layer'); const o = $('.ov', l), f = $('.ov-foot', l);
  OV = null; stopClock(); $('#tabbar').classList.remove('away'); document.documentElement.classList.remove('lock');
  if (f) f.remove();
  if (o) { o.classList.add('closing'); setTimeout(() => { if (o.isConnected) o.remove(); }, 240); }
  render();
}

/* ================= Séance (logger) ================= */
function mkItem(e) {
  const [k, s, lo, hi, rir, rest] = e; const sg = suggestFor(k, lo, hi, rir); const last = lastFor(k);
  return { k, lo, hi, rir, rest, sug: sg, sets: Array.from({ length: s }, (_, j) => ({ w: sg && sg.w ? String(sg.w) : '', r: '', ph: last && last.sets[j] ? String(last.sets[j].r) : String(lo), done: false })) };
}
function startWorkout(w, d, force) {
  if (S.active && S.active.week === w && S.active.dow === d) return openWorkout();
  if (S.active && !force) return confirmSheet('Une séance est déjà en cours. La remplacer par celle-ci ?', 'Remplacer', () => startWorkout(w, d, true), true);
  const pl = planFor(w, d), day = pl.day;
  S.active = { id: uid(), week: w, dow: d, kind: day.k, title: day.t, sub: day.sub, date: today(), start: Date.now(), deload: pl.deload, notes: '', cardio: {}, items: day.ex.map(mkItem) };
  save(); audio(); requestWake(); openWorkout();
}
function openWorkout() {
  const A = S.active; if (!A) return;
  const pl = planFor(A.week, A.dow);
  let h = ovBar(`Semaine ${A.week} · ${DOW[A.dow]}`, `<button class="ibtn" data-a="woMenu" aria-label="Options">${ic('more')}</button>`);
  h += `<div class="wo-top"><div><div class="over">${esc(A.sub)}${A.deload ? ' · décharge' : ''}</div><div class="h1">${esc(A.title)}</div></div><div style="text-align:right"><div class="wo-clock num" id="wo-clock">0:00</div><div class="small">chrono</div></div></div>`;
  h += A.items.map((it, i) => excCard(it, i)).join('');
  h += `<button class="btn ghost block" style="margin-top:12px" data-a="addEx">${ic('plus')} Ajouter un exercice</button>`;
  if (pl.day.b.length) {
    h += sec(A.kind === 'cage' ? 'Ensuite' : 'Déroulé') + `<div class="card">${blocksHtml(pl.day.b)}${pl.day.timer ? `<button class="btn cob block" style="margin-top:14px" data-a="timer" data-v="${pl.day.timer}">${ic('timer')} Ouvrir le chrono</button>` : ''}`;
    if (A.kind === 'cage') h += `<div class="grid2" style="margin-top:14px"><div class="field"><label class="lbl" for="c-min">Course (min)</label><input id="c-min" class="inp" inputmode="numeric" data-in="woCardio" data-f="min" value="${esc(A.cardio.min || '')}"></div><div class="field"><label class="lbl" for="c-km">Distance (km)</label><input id="c-km" class="inp" inputmode="decimal" data-in="woCardio" data-f="km" value="${esc(A.cardio.km || '')}"></div></div>`;
    h += `</div>`;
  }
  h += sec('Notes') + `<textarea class="inp" data-in="woNotes" placeholder="Sensations, douleurs, réglages machine…">${esc(A.notes)}</textarea>`;
  showOv(h, 'workout', `<button class="btn pri block" data-a="finish">${ic('check')} Terminer la séance</button>`);
  startClock();
}
function excCard(it, i) {
  const ex = EX[it.k], A = S.active, allDone = it.sets.length && it.sets.every(s => s.done), last = lastFor(it.k, A.id);
  const wl = ex.bw && !ex.inc && ex.u !== 'm' ? '—' : ex.bw ? 'Lest kg' : 'kg';
  const rl = ex.u === 's' ? 'Secondes' : ex.u === 'm' ? 'Mètres' : 'Reps';
  const reps = it.lo === it.hi ? it.lo : `${it.lo}–${it.hi}`;
  return `<section class="exc ${allDone ? 'done' : ''}" id="exc-${i}">
    <div class="exc-h"><div class="grow"><div class="exc-n">${esc(ex.n)}</div><div class="exc-t">${it.sets.length} × ${reps}${ex.u === 's' ? ' s' : ex.u === 'm' ? ' m' : ''} · RIR ${it.rir} · repos ${mmss(it.rest)} · ${esc(ex.eq)}</div></div>
    <button class="ibtn" data-a="cues" data-i="${i}" aria-label="Conseils d’exécution">${ic('info')}</button><button class="ibtn" data-a="swapEx" data-i="${i}" aria-label="Remplacer l’exercice">${ic('swap')}</button></div>
    <ul class="cues hide" id="cues-${i}">${ex.cues.map(c => `<li>${esc(c)}</li>`).join('')}</ul>
    ${last ? `<div class="exc-last">Dernière fois (${fdate(last.date)}) : <b>${esc(setsTxt(last.sets, it.k))}</b>${it.sug && it.sug.msg ? `<br><span class="up">→ ${esc(it.sug.msg)}</span>` : ''}</div>` : `<div class="exc-last">Première fois : prends une charge qui te laisse ${it.rir} rep${it.rir > 1 ? 's' : ''} en réserve à la fin de la série.</div>`}
    <div class="sets-h"><span>#</span><span>${wl}</span><span>${rl}</span><span>OK</span></div>
    ${it.sets.map((s, j) => setRow(it, i, j)).join('')}
    <div class="exc-f"><button class="btn sm ghost" data-a="addSet" data-i="${i}">${ic('plus')} Série</button>${it.sets.length > 1 ? `<button class="btn sm ghost" data-a="delSet" data-i="${i}">${ic('minus')} Série</button>` : ''}</div></section>`;
}
function setRow(it, i, j) {
  const s = it.sets[j], ex = EX[it.k], noW = ex.bw && !ex.inc && ex.u !== 'm';
  return `<div class="set ${s.done ? 'ok' : ''}" id="set-${i}-${j}"><span class="sn">${s.pr ? '<span class="prb">PR</span>' : j + 1}</span>
    ${noW ? '<span class="small" style="text-align:center">PDC</span>' : `<input class="inp" inputmode="decimal" placeholder="${ex.bw ? '0' : 'kg'}" value="${esc(s.w)}" data-in="set" data-i="${i}" data-j="${j}" data-f="w" aria-label="Charge, série ${j + 1}">`}
    <input class="inp" inputmode="numeric" placeholder="${esc(s.ph)}" value="${esc(s.r)}" data-in="set" data-i="${i}" data-j="${j}" data-f="r" aria-label="Répétitions, série ${j + 1}">
    <button class="ck" data-a="ck" data-i="${i}" data-j="${j}" aria-label="Valider la série ${j + 1}">${ic('check')}</button></div>`;
}
function refreshExc(i) { const el = $(`#exc-${i}`); if (!el) return; const open = !$(`#cues-${i}`).classList.contains('hide'); el.outerHTML = excCard(S.active.items[i], i); if (open) $(`#cues-${i}`).classList.remove('hide'); }
function toggleSet(i, j) {
  const A = S.active; if (!A) return; const it = A.items[i], s = it.sets[j], ex = EX[it.k];
  if (s.done) { s.done = false; s.pr = false; save(); refreshExc(i); return; }
  const noW = ex.bw && !ex.inc && ex.u !== 'm';
  if (s.r === '') s.r = s.ph;
  if (noW || (ex.bw && s.w === '')) s.w = s.w === '' ? '0' : s.w;
  if (s.w === '' || num(s.w) == null) { toast('Indique la charge'); const inp = $(`#set-${i}-${j} [data-f="w"]`); if (inp) inp.focus(); return; }
  if (num(s.r) == null || num(s.r) <= 0) { toast('Indique les répétitions'); return; }
  s.done = true;
  for (let jj = j + 1; jj < it.sets.length; jj++) if (!it.sets[jj].done && it.sets[jj].r === '') it.sets[jj].ph = s.r;
  const bw = curWeight(), prev = bestFor(it.k, A.id), sc = setScore(it.k, s, bw);
  const inSession = Math.max(0, ...it.sets.filter((x, jj) => x.done && jj !== j).map(x => setScore(it.k, x, bw)));
  if (prev > 0 && sc > prev && sc > inSession) { s.pr = true; prFlash('Nouveau record'); haptic(2); beep(988, .12); beep(1319, .22, 'sine', .25, .12); }
  else haptic(1);
  save(); refreshExc(i);
  const left = A.items.some((x, ii) => x.sets.some((y, jj) => !y.done && !(ii === i && jj === j)));
  if (left) startRest(it.rest); else { hideRest(); toast('Toutes les séries sont faites, tu peux terminer'); }
}
let CLOCK = null;
function startClock() { stopClock(); const tick = () => { const el = $('#wo-clock'); if (el && S.active) el.textContent = mmss((Date.now() - S.active.start) / 1000); }; tick(); CLOCK = setInterval(tick, 1000); }
function stopClock() { clearInterval(CLOCK); CLOCK = null; }

let REST = {};
function startRest(sec) {
  clearInterval(REST.iv); REST = { total: sec, end: Date.now() + sec * 1000, beeps: {} };
  let el = $('#rest'); if (!el) { el = document.createElement('div'); el.id = 'rest'; el.className = 'rest'; document.body.appendChild(el); }
  el.classList.remove('end');
  el.innerHTML = `<div id="rest-ring">${ring(48, [{ pct: 1, color: 'var(--fau)' }], 5, 0, '')}</div><div class="grow"><div class="rl">Repos</div><div class="rt num" id="rest-t">${mmss(sec)}</div></div>
    <button class="ibtn" data-a="restAdd" data-v="-15" aria-label="Moins 15 secondes" style="font-weight:800;font-size:13px">−15</button><button class="ibtn" data-a="restAdd" data-v="15" aria-label="Plus 15 secondes" style="font-weight:800;font-size:13px">+15</button><button class="ibtn" data-a="restSkip" aria-label="Passer le repos">${ic('x')}</button>`;
  const p = $('#rest-ring .val'); p.style.transition = 'stroke-dashoffset .3s linear'; p.style.strokeDashoffset = '0';
  requestAnimationFrame(() => el.classList.add('show'));
  REST.iv = setInterval(restTick, 250); restTick();
}
function restTick() {
  const el = $('#rest'); if (!el) { clearInterval(REST.iv); return; }
  const left = (REST.end - Date.now()) / 1000, t = $('#rest-t'), p = $('#rest-ring .val');
  if (p) { const L = parseFloat(p.getAttribute('stroke-dasharray')); p.style.strokeDashoffset = (L * clamp(1 - left / REST.total, 0, 1)).toFixed(1); }
  if (left > 0) { t.textContent = mmss(Math.ceil(left)); const c = Math.ceil(left); if (c <= 3 && !REST.beeps[c]) { REST.beeps[c] = 1; beep(880, .08, 'sine', .25); } return; }
  if (!REST.fired) { REST.fired = true; t.textContent = 'GO'; el.classList.add('end'); beep(1175, .15, 'sine', .35); beep(1568, .3, 'sine', .3, .16); haptic(2); setTimeout(hideRest, 6000); }
}
function hideRest() { clearInterval(REST.iv); const el = $('#rest'); if (el) { el.classList.remove('show'); setTimeout(() => { if (!el.classList.contains('show')) el.remove(); }, 450); } }

function finishWorkout(force) {
  const A = S.active; if (!A) return;
  const doneSets = A.items.reduce((n, it) => n + it.sets.filter(s => s.done).length, 0);
  if (!doneSets && !force) return confirmSheet('Aucune série validée. Abandonner la séance ?', 'Abandonner', () => { S.active = null; save(); hideRest(); releaseWake(); closeOv(); }, true);
  const end = Date.now(), dur = Math.max(1, Math.round((end - A.start) / 60000));
  const items = A.items.map(it => ({ k: it.k, sets: it.sets.filter(s => s.done).map(s => ({ w: num(s.w) || 0, r: num(s.r) || 0, pr: !!s.pr })) })).filter(it => it.sets.length);
  const prs = items.reduce((n, it) => n + it.sets.filter(s => s.pr).length, 0);
  const vol = items.reduce((v, it) => v + it.sets.reduce((a, s) => a + (EX[it.k].u ? 0 : s.w * s.r), 0), 0);
  const cardio = A.cardio && (num(A.cardio.min) || num(A.cardio.km)) ? { min: num(A.cardio.min) || 0, km: num(A.cardio.km) || 0 } : undefined;
  const rec = { id: A.id, date: A.date, week: A.week, dow: A.dow, kind: A.kind, title: A.title, sub: A.sub, start: A.start, end, dur, bw: round(curWeight(), 1), items, prs, vol: Math.round(vol), sets: doneSets, notes: A.notes || '', cardio };
  const before = computeXP();
  S.workouts.push(rec); S.active = null; invalidate(); saveNow(); hideRest(); releaseWake(); stopClock();
  showSummary(rec, before);
}
function showSummary(rec, before) {
  const xp = computeXP(), rk = rankOf(xp), rkB = rankOf(before);
  let h = `<div class="celebrate"><svg class="done-mark" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"><circle cx="50" cy="50" r="44"/><path d="m32 51 12 12 24-25"/></svg>
    <div class="over">Semaine ${rec.week} · ${esc(rec.title)} · ${esc(rec.sub)}</div><div class="big" style="margin-top:8px">Bien joué !</div><p class="sub" style="margin-top:8px">Séance terminée. Pense à manger tes protéines.</p><div style="margin-top:10px"><span class="tag fau" style="font-size:15px;padding:6px 12px">+${xp - before} points</span></div></div>
    <div class="kpis"><div class="kpi"><div class="v num">${rec.dur}</div><div class="k">min</div></div><div class="kpi"><div class="v num">${fmt(rec.vol / 1000, 1)}</div><div class="k">tonnes soulevées</div></div><div class="kpi"><div class="v num">${rec.sets}</div><div class="k">série${rec.sets > 1 ? 's' : ''}</div></div><div class="kpi"><div class="v num" style="color:${rec.prs ? 'var(--fat)' : 'inherit'}">${rec.prs}</div><div class="k">record${rec.prs > 1 ? 's' : ''}</div></div></div>`;
  if (rk.lvl > rkB.lvl) h += `<div class="note fau" style="margin-top:12px;text-align:center">Nouveau niveau : <b>${esc(rk.name)}</b></div>`;
  if (rec.prs) h += sec('Records') + `<div class="card tight">${rec.items.filter(it => it.sets.some(s => s.pr)).map(it => `<div class="li"><span class="prb">PR</span><span class="grow ttl">${esc(EX[it.k].n)}</span><span class="end small num">${esc(setsTxt(it.sets.filter(s => s.pr), it.k))}</span></div>`).join('')}</div>`;
  h += levelCard(xp, rk, streak());
  showOv(h, 'summary', `<button class="btn pri block" data-a="closeOv">Terminer</button>`);
  setTimeout(() => { confetti(); beep(784, .18, 'sine', .25); beep(1046, .3, 'sine', .2, .14); haptic(2); }, 300);
}

/* ================= Chrono rounds ================= */
let TM = null;
function openTimer(key = 'mma5') {
  if (TM) clearInterval(TM.iv);
  const P = TIMERS[key] || TIMERS.mma5;
  TM = { key, n: P.n, rounds: P.rounds, work: P.work, rest: P.rest, round: 1, phase: 'idle', endAt: 0, paused: false, pauseLeft: 0, last: null };
  renderTimer();
}
function renderTimer() {
  if (!TM) return;
  let el = $('#timer'); if (!el) { el = document.createElement('div'); el.id = 'timer'; el.setAttribute('role', 'dialog'); document.body.appendChild(el); }
  const ph = TM.phase; el.className = `timer ph-${ph}`;
  const left = ph === 'idle' ? TM.work : ph === 'done' ? 0 : TM.paused ? Math.ceil(TM.pauseLeft / 1000) : Math.max(0, Math.ceil((TM.endAt - Date.now()) / 1000));
  const label = { idle: 'Chrono intervalles', prep: 'Prêt ?', work: 'Effort', rest: 'Récupération', done: 'Terminé' }[ph];
  const completed = ph === 'done' ? TM.rounds : ph === 'rest' ? TM.round : TM.round - 1;
  el.innerHTML = `<div class="row sb" style="width:100%"><button class="ibtn" data-a="timerClose" aria-label="Fermer le chrono">${ic('x')}</button><div style="font-size:15px;font-weight:600;opacity:.8">${TM.rounds} × ${mmss(TM.work)} · récup ${mmss(TM.rest)}</div><span style="width:44px"></span></div>
    <div style="text-align:center;width:100%"><div class="tp" id="tm-p">${esc(label)}</div><div class="tt" id="tm-t">${ph === 'done' ? 'Bravo' : mmss(left)}</div>
    <div class="tp" style="font-size:20px;opacity:.75">Tour ${Math.min(TM.round, TM.rounds)} sur ${TM.rounds}</div><div class="tr">${Array.from({ length: TM.rounds }, (_, i) => `<i class="${i < completed ? 'on' : ''}"></i>`).join('')}</div>
    ${ph === 'idle' ? `<div class="chips" style="justify-content:center;margin-top:22px">${Object.entries(TIMERS).map(([k, v]) => `<button class="chip ${k === TM.key ? 'on' : ''}" data-a="timerPreset" data-v="${k}">${esc(v.n)}</button>`).join('')}</div>` : ''}</div>
    <div class="ctrls">${ph === 'idle' || ph === 'done' ? `<button class="ibtn main" data-a="timerGo" aria-label="Démarrer">${ic('play')}</button>` : `<button class="ibtn" data-a="timerReset" aria-label="Recommencer">${ic('reset')}</button><button class="ibtn main" data-a="timerPause" aria-label="${TM.paused ? 'Reprendre' : 'Pause'}">${ic(TM.paused ? 'play' : 'pause')}</button><button class="ibtn" data-a="timerSkip" aria-label="Passer">${ic('next')}</button>`}</div>`;
}
function tmGo() { audio(); setLoud(true); requestWake(); TM.round = 1; TM.phase = 'prep'; TM.paused = false; TM.endAt = Date.now() + 10000; TM.last = null; clearInterval(TM.iv); TM.iv = setInterval(tmTick, 200); renderTimer(); haptic(); }
function tmTick() {
  if (!TM || TM.paused || TM.phase === 'idle' || TM.phase === 'done') return;
  const left = Math.ceil((TM.endAt - Date.now()) / 1000);
  if (left !== TM.last) {
    TM.last = left; const t = $('#tm-t'); if (t) t.textContent = mmss(Math.max(0, left));
    if (left <= 3 && left > 0) beep(880, .09, 'sine', .3);
    if (TM.phase === 'work' && left === 10 && TM.work >= 60) { beep(1400, .05, 'square', .15); beep(1400, .05, 'square', .15, .12); }
  }
  if (left <= 0) tmNext();
}
function tmNext() {
  if (TM.phase === 'prep') { TM.phase = 'work'; TM.endAt = Date.now() + TM.work * 1000; bell(); haptic(2); }
  else if (TM.phase === 'work') {
    if (TM.round >= TM.rounds) { TM.phase = 'done'; clearInterval(TM.iv); bell(); setTimeout(bell, 700); confetti(90); releaseWake(); setLoud(false); }
    else { TM.phase = 'rest'; TM.endAt = Date.now() + TM.rest * 1000; bell(); haptic(); }
  } else if (TM.phase === 'rest') { TM.round++; TM.phase = 'work'; TM.endAt = Date.now() + TM.work * 1000; bell(); haptic(2); }
  TM.last = null; renderTimer();
}
function closeTimer() { if (TM) clearInterval(TM.iv); TM = null; const el = $('#timer'); if (el) el.remove(); setLoud(false); if (!S.active) releaseWake(); }

/* ================= Nutrition ================= */
function vFood() {
  const k = S.ui.foodDate || today(), t = targets(k), n = dayNut(k), entries = S.food[k] || [];
  let h = `<header class="hd"><div><div class="over">Objectif ${fmt(t.kcal)} kcal · ${t.prot} g de protéines</div><h1 class="h1">Nutrition</h1></div></header>`;
  h += `<div class="row" style="margin-bottom:12px"><button class="ibtn" data-a="foodDay" data-v="-1" aria-label="Jour précédent">${ic('back')}</button><div class="grow" style="text-align:center;font-weight:700">${dayLabel(k)}</div><button class="ibtn" data-a="foodDay" data-v="1" ${k >= today() ? 'disabled style="opacity:.3"' : ''} aria-label="Jour suivant">${ic('next')}</button></div>`;
  const left = t.kcal - n.kcal;
  h += `<div class="card"><div class="row sb" style="align-items:flex-end"><div><div class="lbl">Mangé</div><span class="big num">${fmt(n.kcal)}</span><span class="sub"> / ${fmt(t.kcal)} kcal</span></div><div style="text-align:right"><div class="mid num ${left < 0 ? 'pro' : 'fau'}">${fmt(Math.abs(left))}</div><div class="small">${left >= 0 ? 'restantes' : 'en plus'}</div></div></div>
    <div style="margin:12px 0 14px">${bar(n.kcal / t.kcal, 'ink')}</div>
    <div class="grid3">${[['Protéines', n.p, t.prot, 'pro'], ['Glucides', n.c, t.carb, 'cob'], ['Lipides', n.f, t.fat, 'sand']].map(([l, v, g, c]) => `<div><div class="lbl">${l}</div><div class="num" style="font-weight:700;margin:2px 0 6px">${fmt(v)}<span class="small"> / ${g} g</span></div>${bar(v / g, c)}</div>`).join('')}</div>
    <div class="small" style="margin-top:12px">Fibres ${fmt(n.fib)} / ${t.fib} g</div></div>`;
  if (k === today()) { const sug = adaptSuggestion(); if (sug) h += adaptCard(sug); }
  const w = S.water[k] || 0;
  h += `<div class="card" style="margin-top:12px"><div class="row sb"><div class="row"><span class="kico" style="background:var(--waterBg);color:var(--water)">${ic('drop')}</span><div><div class="h3">Eau</div><div class="small num">${fmt(w / 1000, 2)} / ${fmt(t.water / 1000, 2)} L</div></div></div><div class="row"><button class="ibtn" data-a="water" data-v="-250" aria-label="Retirer 250 ml">${ic('minus')}</button><button class="btn cob sm" data-a="water" data-v="250">+250 ml</button></div></div><div style="margin-top:12px">${bar(w / t.water, 'water')}</div></div>`;
  for (const m of MEALS) {
    const list = entries.map((e, i) => [e, i]).filter(([e]) => e.m === m.k), mk = sumMac(list.map(x => x[0]));
    h += `<div class="card" style="margin-top:12px"><div class="card-h"><div><div class="h3">${m.n}</div><div class="small num">${fmt(mk.kcal)} kcal · P ${fmt(mk.p)} g</div></div><button class="ibtn" data-a="foodAdd" data-v="${m.k}" aria-label="Ajouter au ${m.n}">${ic('plus')}</button></div>`;
    h += list.length ? list.map(([e, i]) => { const mm = entryMac(e); return `<button class="li" data-a="entry" data-v="${i}"><span class="grow"><span class="ttl">${esc(entryName(e))}</span><span class="meta num">${e.q ? 'Ajout rapide' : `${fmt(e.g)} g`} · P ${fmt(mm.p)} · G ${fmt(mm.c)} · L ${fmt(mm.f)}</span></span><span class="end num" style="font-weight:700">${fmt(mm.kcal)}</span></button>`; }).join('') : `<div class="small">Rien pour l’instant.</div>`;
    h += `</div>`;
  }
  h += sec('Journées types', `<button class="link" data-a="myFoods">Mes aliments</button>`);
  h += `<p class="sub" style="margin:-4px 2px 10px">Trois journées calibrées sur ta cible. Touche un repas pour l’ajouter d’un coup au journal.</p><div class="chips scroll">`;
  for (const pl of PLANS) {
    const f = planScale(pl, t.kcal), all = pl.meals.flatMap(m => scaledItems(m.items, f)), mk = itemsMac(all);
    h += `<button class="card" style="min-width:230px;text-align:left;flex:none" data-a="plan" data-v="${pl.id}"><div class="over">${esc(pl.tag)}</div><div class="h2" style="margin:2px 0 10px">${esc(pl.n)}</div><div class="num" style="font-weight:700">${fmt(mk.kcal)} kcal</div><div class="small num">P ${fmt(mk.p)} · G ${fmt(mk.c)} · L ${fmt(mk.f)} g</div><div class="small" style="margin-top:8px">${pl.meals.map(m => esc(m.n)).join(' · ')}</div></button>`;
  }
  h += `</div>`;
  return h;
}
function openPlan(id) {
  const k = S.ui.foodDate || today(), t = targets(k), pl = PLANS.find(p => p.id === id), f = planScale(pl, t.kcal);
  let h = ovBar(esc(pl.n));
  const all = pl.meals.flatMap(m => scaledItems(m.items, f)), mk = itemsMac(all);
  h += `<div class="over" style="margin-top:6px">${esc(pl.tag)} · ajusté à ta cible</div><div class="h1">${esc(pl.n)}</div><div class="chips" style="margin:12px 0"><span class="tag num">${fmt(mk.kcal)} kcal</span><span class="tag pro num">P ${fmt(mk.p)} g</span><span class="tag cob num">G ${fmt(mk.c)} g</span><span class="tag sand num">L ${fmt(mk.f)} g</span></div>`;
  pl.meals.forEach((m, i) => {
    const its = scaledItems(m.items, f), mm = itemsMac(its), meal = MEALS.find(x => x.k === m.m);
    h += `<div class="card" style="margin-top:12px"><div class="over">${meal.n}</div><div class="h2" style="margin:2px 0 8px">${esc(m.n)}</div>
      ${its.map(([fid, g]) => `<div class="row sb small" style="padding:4px 0"><span style="color:var(--ink)">${esc(FOODMAP[fid].n)}</span><span class="num">${g} g</span></div>`).join('')}
      <div class="small num" style="margin:8px 0">${fmt(mm.kcal)} kcal · P ${fmt(mm.p)} · G ${fmt(mm.c)} · L ${fmt(mm.f)}</div><div class="note">${esc(m.how)}</div>
      <button class="btn sm ghost" style="margin-top:12px" data-a="planMeal" data-v="${id}" data-i="${i}">${ic('plus')} Ajouter au ${meal.n.toLowerCase()}</button></div>`;
  });
  showOv(h, 'plan', `<button class="btn pri block" data-a="planAll" data-v="${id}">${ic('plus')} Ajouter toute la journée</button>`);
}
function addPlanMeal(id, i, quiet) {
  const k = S.ui.foodDate || today(), pl = PLANS.find(p => p.id === id), f = planScale(pl, targets(k).kcal), m = pl.meals[i];
  S.food[k] = (S.food[k] || []).concat(scaledItems(m.items, f).map(([fid, g]) => ({ id: uid(), m: m.m, f: fid, g })));
  invalidate(); save(); if (!quiet) { haptic(); toast(`${m.n} ajouté`); }
}

/* ================= Feuilles ================= */
let SH = null;
function openSheet(html, ctx = {}) {
  const root = $('#sheet-root');
  root.innerHTML = `<div class="scrim" data-a="closeSheet"></div><div class="sheet" role="dialog" aria-modal="true"><div class="grab"></div>${html}</div>`;
  SH = ctx; animateIn(root);
}
function closeSheet() {
  const root = $('#sheet-root'), sh = $('.sheet', root); SH = null; if (!sh) return;
  sh.classList.add('closing'); const sc = $('.scrim', root); if (sc) sc.classList.add('closing');
  setTimeout(() => { if (sh.isConnected) root.innerHTML = ''; }, 220);
}
function confirmSheet(text, ok, fn, danger) {
  openSheet(`<h2 class="h2">${esc(text)}</h2><div class="row" style="margin-top:6px"><button class="btn ghost grow" data-a="closeSheet">Annuler</button><button class="btn ${danger ? 'pri' : 'pri'} grow" data-a="confirmOk">${esc(ok)}</button></div>`, { type: 'confirm', fn });
}
function fieldNum(id, label, val, unit, ph = '', mode = 'decimal') {
  return `<div class="field"><label class="lbl" for="${id}">${label}</label><div class="inp-u"><input id="${id}" class="inp num" inputmode="${mode}" value="${val == null ? '' : esc(String(val).replace('.', ','))}" placeholder="${esc(ph)}" autocomplete="off"><span>${unit}</span></div></div>`;
}
const val = id => { const el = $('#' + id); return el ? num(el.value) : null; };

function sheetWeigh() {
  const last = [...S.weights].sort((a, b) => a.d < b.d ? -1 : 1).pop(), cur = S.weights.find(x => x.d === today());
  openSheet(`<h2 class="h2">Pesée</h2><p class="sub">Le matin, à jeun, après les toilettes. L’appli lisse tes variations : ne panique pas pour 500 g.</p>${fieldNum('w-kg', 'Poids du jour', cur ? cur.kg : (last ? last.kg : S.profile.weight), 'kg')}
    <button class="btn pri block" style="margin-top:16px" data-a="saveWeigh">${ic('check')} Enregistrer</button>`, { type: 'weigh' });
}
function sheetMeasure() {
  const m = lastMeasure() || {}, f = S.profile.sex === 'f';
  const F = [['waist', 'Tour de taille (au nombril)'], ['neck', 'Tour de cou (sous la pomme d’Adam)'], ['shoulders', 'Tour d’épaules (le plus large)'], ['chest', 'Tour de poitrine'], ['arm', 'Bras contracté'], ['thigh', 'Cuisse']].concat(f ? [['hips', 'Hanches']] : []);
  openSheet(`<h2 class="h2">Mensurations</h2><p class="sub">Mètre ruban, le matin, muscles relâchés (sauf le bras). Taille + cou servent à estimer ta masse grasse.</p>${F.map(([k, l]) => fieldNum('m-' + k, l, '', 'cm', m[k] ? `Dernière : ${fmt(m[k], 1)}` : '')).join('')}
    <button class="btn pri block" style="margin-top:16px" data-a="saveMeasure">${ic('check')} Enregistrer</button>`, { type: 'measure', fields: F.map(x => x[0]) });
}
function sheetTests() {
  const wk = S.profile ? weekOf(today()) : 0;
  openSheet(`<h2 class="h2">Tests athlétiques</h2><p class="sub">Fais-les en semaine 1 puis en semaine 18${wk > 0 ? ` (tu es en semaine ${wk})` : ''}. Repos complet entre chaque test, ne fais pas tout le même jour que les jambes.</p>
    ${TESTS.map(t => { const prev = S.tests.filter(x => x.k === t.k).pop(); return fieldNum('t-' + t.k, `${t.n} <span class="small">· ${esc(t.d)}</span>`, '', t.u === 'reps' ? 'reps' : t.u, prev ? `Dernier : ${fmt(prev.v)}` : '', 'numeric'); }).join('')}
    <button class="btn pri block" style="margin-top:16px" data-a="saveTests">${ic('check')} Enregistrer</button>`, { type: 'tests' });
}
function sheetCardio(w, d) {
  const day = planFor(w, d).day, unit = day.k === 'swim' ? 'm' : 'km';
  openSheet(`<h2 class="h2">${esc(day.t)} · ${esc(day.sub)}</h2>${fieldNum('cd-min', 'Durée', day.dur, 'min', '', 'numeric')}${day.k === 'rest' || day.k === 'mma' ? '' : fieldNum('cd-dist', 'Distance (facultatif)', '', unit)}
    <div class="field"><span class="lbl">Ressenti (1 = facile, 10 = à fond)</span><div class="chips">${[5, 6, 7, 8, 9, 10].map(v => `<button class="chip ${v === 7 ? 'on' : ''}" data-a="rpe" data-v="${v}">${v}</button>`).join('')}</div></div>
    <button class="btn pri block" style="margin-top:16px" data-a="saveCardio">${ic('check')} Valider la séance</button>`, { type: 'cardio', w, d, rpe: 7, unit });
}
function sheetProfile() {
  const p = S.profile;
  openSheet(`<h2 class="h2">Profil</h2>
    <div class="field"><label class="lbl" for="p-name">Prénom</label><input id="p-name" class="inp" value="${esc(p.name)}" autocomplete="given-name"></div>
    <div class="field"><span class="lbl">Sexe</span><div class="seg"><button class="${p.sex === 'm' ? 'on' : ''}" data-a="pSex" data-v="m">Homme</button><button class="${p.sex === 'f' ? 'on' : ''}" data-a="pSex" data-v="f">Femme</button></div></div>
    <div class="grid2" style="margin-top:14px">${fieldNum('p-age', 'Âge', p.age, 'ans', '', 'numeric')}${fieldNum('p-h', 'Taille', p.height, 'cm', '', 'numeric')}</div>
    <div class="field"><label class="lbl" for="p-act">Quotidien (hors sport)</label><select id="p-act" class="inp">${ACT.map(a => `<option value="${a.v}" ${a.v === p.act ? 'selected' : ''}>${a.n}</option>`).join('')}</select></div>
    <div class="field"><label class="lbl" for="p-mode">Objectif calorique</label><select id="p-mode" class="inp">${Object.entries(MODES).map(([k, m]) => `<option value="${k}" ${k === p.mode ? 'selected' : ''}>${m.n}</option>`).join('')}</select></div>
    <div class="grid2" style="margin-top:14px"><div class="field"><label class="lbl" for="p-start">Début du programme</label><input id="p-start" type="date" class="inp" value="${p.start}"></div><div class="field" style="margin-top:0"><label class="lbl" for="p-mma">Début du MMA</label><input id="p-mma" type="date" class="inp" value="${p.mma}"></div></div>
    <button class="btn pri block" style="margin-top:16px" data-a="saveProfile">${ic('check')} Enregistrer</button>`, { type: 'profile', sex: p.sex });
}
function sheetSlots() {
  openSheet(`<h2 class="h2">Tes créneaux</h2><p class="sub">Les plans « si-alors » augmentent l’activité physique : « Si c’est lundi 18 h, alors je vais à la salle. » Choisis une heure fixe pour chaque séance.</p>
    ${DOW.map((d, i) => { const pl = S.profile ? planOn(addDays(mondayOf(today()), i)) || planFor(1, i) : null; return `<div class="row" style="padding:6px 0"><span class="grow"><b>${d}</b><span class="small" style="display:block">${pl ? esc(pl.day.t) : ''}</span></span><input type="time" class="inp" style="width:130px" id="sl-${i}" value="${esc(S.slots[i] || '')}"></div>`; }).join('')}
    <button class="btn pri block" style="margin-top:16px" data-a="saveSlots">${ic('check')} Enregistrer</button>`, { type: 'slots' });
}

/* ---- Ajout d'aliments ---- */
function openFoodAdd(meal) { openSheet('<div id="fsheet"></div>', { type: 'food', meal, tab: 'recent', q: '' }); renderFoodSheet(); }
function renderFoodSheet() {
  const box = $('#fsheet'); if (!box || !SH) return;
  box.innerHTML = `<h2 class="h2">Ajouter · ${MEALS.find(m => m.k === SH.meal).n}</h2>
    <div class="inp-u"><input class="inp" id="fq" placeholder="Rechercher : poulet, riz, skyr…" data-in="fq" autocomplete="off" enterkeyhint="search" value="${esc(SH.q)}"><span>${ic('search')}</span></div>
    <div class="seg" style="margin-top:10px">${[['recent', 'Récents'], ['all', 'Tous'], ['mine', 'Les miens']].map(([k, l]) => `<button class="${SH.tab === k ? 'on' : ''}" data-a="ftab" data-v="${k}">${l}</button>`).join('')}</div>
    <div id="fres" style="margin-top:4px">${foodResults()}</div>
    <div class="row" style="margin-top:12px"><button class="btn ghost grow sm" data-a="quickAdd">Ajout rapide</button><button class="btn ghost grow sm" data-a="newFood">Créer un aliment</button></div>`;
}
function recentFoods() {
  const seen = new Set(), out = []; const days = Object.keys(S.food).sort().reverse().slice(0, 30);
  for (const d of days) for (const e of [...S.food[d]].reverse()) { if (e.f && !seen.has(e.f) && foodById(e.f)) { seen.add(e.f); out.push(foodById(e.f)); } }
  return out;
}
function foodResults() {
  const q = norm(SH.q.trim()); const all = [...S.customFoods, ...FOODS]; let list;
  if (q) list = all.filter(f => norm(f.n).includes(q)).sort((a, b) => norm(a.n).indexOf(q) - norm(b.n).indexOf(q));
  else if (SH.tab === 'mine') list = S.customFoods;
  else if (SH.tab === 'recent') { list = recentFoods(); if (!list.length) list = all; }
  else list = all;
  if (!list.length) return `<div class="empty">${SH.tab === 'mine' && !q ? 'Tu n’as pas encore créé d’aliment.' : 'Aucun résultat.'}<br>Utilise « Créer un aliment » avec les valeurs de l’étiquette.</div>`;
  return list.slice(0, 80).map(f => `<button class="li" data-a="pickFood" data-v="${f.id}"><span class="grow"><span class="ttl">${esc(f.n)}</span><span class="meta num">${fmt(f.kcal)} kcal · P ${fmt(f.p, 1)} · G ${fmt(f.c, 1)} · L ${fmt(f.f, 1)} pour 100 g</span></span>${ic('plus', 'fau')}</button>`).join('');
}
function pickFood(id, g, edit) {
  const f = foodById(id); if (!f) return;
  const meal = edit != null ? (S.food[SH.date || S.ui.foodDate || today()] || [])[edit].m : SH.meal;
  SH = { type: 'portion', id, g: g || (f.por ? f.por[1] : 100), edit, meal, back: SH };
  const chips = []; if (f.por) { chips.push([f.por[1], f.por[0]]); chips.push([f.por[1] * 2, `2 × ${f.por[0].replace(/^1 /, '')}`]); }
  [50, 100, 150, 200, 250].forEach(v => chips.push([v, `${v} g`]));
  openSheet(`<h2 class="h2">${esc(f.n)}</h2><div class="small num" style="margin:-8px 0 14px">Pour 100 g : ${fmt(f.kcal)} kcal · P ${fmt(f.p, 1)} · G ${fmt(f.c, 1)} · L ${fmt(f.f, 1)}</div>
    ${fieldNum('fg', 'Quantité', SH.g, 'g', '', 'decimal').replace('class="inp num"', 'class="inp num" data-in="fg"')}
    <div class="chips scroll" style="margin-top:10px">${chips.map(([v, l]) => `<button class="chip" data-a="fgSet" data-v="${v}">${esc(l)}</button>`).join('')}</div>
    <div class="grid3 card tight" id="fprev" style="margin-top:14px"></div>
    <div class="field"><span class="lbl">Repas</span><div class="chips">${MEALS.map(m => `<button class="chip ${m.k === SH.meal ? 'on' : ''}" data-a="fmeal" data-v="${m.k}">${m.n}</button>`).join('')}</div></div>
    <div class="row" style="margin-top:16px">${edit != null ? `<button class="btn ghost" data-a="delEntry" data-v="${edit}" aria-label="Supprimer">${ic('trash')}</button>` : ''}<button class="btn pri grow" data-a="addFood">${ic('check')} ${edit != null ? 'Enregistrer' : 'Ajouter'}</button></div>`, SH);
  updFoodPrev();
}
function updFoodPrev() {
  const box = $('#fprev'); if (!box || !SH) return; const f = foodById(SH.id), m = (SH.g || 0) / 100;
  box.innerHTML = [['kcal', f.kcal * m, ''], ['Prot.', f.p * m, ' g'], ['Gluc.', f.c * m, ' g']].map(([l, v, u]) => `<div style="text-align:center"><div class="mid num">${fmt(v)}${u ? `<span class="small">${u}</span>` : ''}</div><div class="small">${l}</div></div>`).join('');
}
function sheetQuick(edit) {
  const e = edit != null ? (S.food[S.ui.foodDate || today()] || [])[edit] : null, q = e && e.q ? e.q : {};
  openSheet(`<h2 class="h2">Ajout rapide</h2><p class="sub">Pour un resto ou un plat dont tu connais les valeurs.</p>
    <div class="field"><label class="lbl" for="q-n">Nom</label><input id="q-n" class="inp" value="${esc(q.n || '')}" placeholder="Ex. Burger maison"></div>
    <div class="grid2" style="margin-top:14px">${fieldNum('q-k', 'Calories', q.kcal, 'kcal', '', 'numeric')}${fieldNum('q-p', 'Protéines', q.p, 'g')}</div><div class="grid2" style="margin-top:14px">${fieldNum('q-c', 'Glucides', q.c, 'g')}${fieldNum('q-f', 'Lipides', q.f, 'g')}</div>
    <div class="row" style="margin-top:16px">${e ? `<button class="btn ghost" data-a="delEntry" data-v="${edit}" aria-label="Supprimer">${ic('trash')}</button>` : ''}<button class="btn pri grow" data-a="saveQuick">${ic('check')} ${e ? 'Enregistrer' : 'Ajouter'}</button></div>`, { type: 'quick', meal: e ? e.m : (SH && SH.meal) || 'l', edit });
}
function sheetNewFood(edit) {
  const f = edit ? S.customFoods.find(x => x.id === edit) : {};
  openSheet(`<h2 class="h2">${edit ? 'Modifier l’aliment' : 'Créer un aliment'}</h2><p class="sub">Recopie l’étiquette (valeurs pour 100 g).</p>
    <div class="field"><label class="lbl" for="nf-n">Nom</label><input id="nf-n" class="inp" value="${esc(f.n || '')}" placeholder="Ex. Skyr vanille marque X"></div>
    <div class="grid2" style="margin-top:14px">${fieldNum('nf-k', 'Calories', f.kcal, 'kcal', '', 'numeric')}${fieldNum('nf-p', 'Protéines', f.p, 'g')}</div><div class="grid2" style="margin-top:14px">${fieldNum('nf-c', 'Glucides', f.c, 'g')}${fieldNum('nf-f', 'Lipides', f.f, 'g')}</div>
    <div class="grid2" style="margin-top:14px"><div class="field"><label class="lbl" for="nf-pn">Portion (facultatif)</label><input id="nf-pn" class="inp" value="${esc(f.por ? f.por[0] : '')}" placeholder="1 pot"></div>${fieldNum('nf-pg', 'Poids portion', f.por ? f.por[1] : '', 'g', '', 'numeric')}</div>
    <div class="row" style="margin-top:16px">${edit ? `<button class="btn ghost" data-a="delFood" data-v="${edit}" aria-label="Supprimer">${ic('trash')}</button>` : ''}<button class="btn pri grow" data-a="saveNewFood">${ic('check')} Enregistrer</button></div>`, { type: 'newfood', edit, meal: SH && SH.meal });
}
function sheetMyFoods() {
  openSheet(`<h2 class="h2">Mes aliments</h2>${S.customFoods.length ? S.customFoods.map(f => `<button class="li" data-a="editFood" data-v="${f.id}"><span class="grow"><span class="ttl">${esc(f.n)}</span><span class="meta num">${fmt(f.kcal)} kcal · P ${fmt(f.p, 1)} g / 100 g</span></span>${ic('edit')}</button>`).join('') : '<div class="empty">Aucun aliment perso pour l’instant.</div>'}
    <button class="btn pri block" style="margin-top:14px" data-a="newFood">${ic('plus')} Créer un aliment</button>`, { type: 'myfoods' });
}

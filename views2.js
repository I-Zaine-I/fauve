/* FAUVE — Progrès, Moi, bibliothèque, historique, photos, graphiques */
'use strict';

/* ================= Progrès ================= */
function vProg() {
  const p = S.profile, tr = trendSeries(), cur = curWeight(), d0 = cur - p.weight, rate = weeklyRate();
  let h = `<header class="hd"><div><div class="over">Depuis le ${fdate(p.start)}</div><h1 class="h1">Progrès</h1></div><div class="hd-r"><button class="ibtn" data-a="weigh" aria-label="Nouvelle pesée">${ic('scale')}</button></div></header>`;
  h += `<div class="card"><div class="row sb" style="align-items:flex-start"><div><div class="lbl">Poids · tendance lissée</div><span class="big num">${fmt(cur, 1)}</span><span class="sub"> kg</span></div>
    <div style="text-align:right"><span class="tag ${d0 <= 0 ? 'fau' : 'sand'} num">${Math.abs(d0) < 0.05 ? '±0' : (d0 < 0 ? '−' : '+') + fmt(Math.abs(d0), 1)} kg</span><div class="small num" style="margin-top:6px">${rate == null ? 'Rythme : ~2 semaines de pesées' : `${rate <= 0 ? '−' : '+'}${fmt(Math.abs(rate), 2)} %/sem.`}</div></div></div>
    <div class="chart" data-chart="weight"></div>
    <div class="row" style="margin-top:10px"><button class="btn sm pri" data-a="weigh">${ic('plus')} Pesée</button><span class="small grow" style="text-align:right">Points : pesées · courbe : tendance</span></div></div>`;

  const m = lastMeasure(), m0 = firstMeasure(), bf = navyBF(m), vr = m && m.shoulders && m.waist ? m.shoulders / m.waist : null;
  const dWaist = m && m0 && m !== m0 && m.waist && m0.waist ? m.waist - m0.waist : null;
  h += sec('Composition', `<button class="link" data-a="measure">Mensurations</button>`);
  h += `<div class="grid2"><div class="kpi"><div class="v num">${bf == null ? '–' : fmt(bf, 1) + '<span class="small"> %</span>'}</div><div class="k">Masse grasse estimée${bf != null ? ` · ${fmt(cur * (1 - bf / 100), 1)} kg de masse maigre` : ''}</div></div>
    <div class="kpi"><div class="v num">${vr == null ? '–' : fmt(vr, 2)}</div><div class="k">Ratio V (épaules / taille) · repère ~1,6</div>${vr ? `<div style="margin-top:8px">${bar(clamp((vr - 1.2) / 0.4, 0, 1))}</div>` : ''}</div>
    <div class="kpi"><div class="v num">${m && m.waist ? fmt(m.waist, 1) : '–'}<span class="small"> cm</span></div><div class="k">Tour de taille${dWaist != null ? ` · <b class="${dWaist <= 0 ? 'fau' : ''}">${dWaist <= 0 ? '−' : '+'}${fmt(Math.abs(dWaist), 1)} cm</b>` : ''}</div></div>
    <div class="kpi"><div class="v num">${m && m.arm ? fmt(m.arm, 1) : '–'}<span class="small"> cm</span></div><div class="k">Bras contracté${m && m0 && m.arm && m0.arm && m !== m0 ? ` · ${m.arm - m0.arm >= 0 ? '+' : '−'}${fmt(Math.abs(m.arm - m0.arm), 1)} cm` : ''}</div></div></div>
    <p class="small" style="margin:8px 2px 0">Masse grasse : méthode US Navy (taille, cou, taille du corps), précision de ±3 à 4 %. Suis surtout la tendance.</p>`;

  h += sec('Records', `<span class="small">charge × reps → 1RM estimé</span>`) + `<div class="card tight">`;
  let any = false;
  for (const k of MAIN_LIFTS) {
    const hist = liftHistory(k); if (!hist.length) continue; any = true;
    const best = Math.max(...hist.map(x => x.v)), first = hist[0].v, ex = EX[k];
    h += `<div class="li"><span class="grow"><span class="ttl">${esc(ex.n)}</span><span class="meta num">${ex.bw ? '1RM total (corps + lest)' : '1RM estimé'} · ${hist.length} séance${hist.length > 1 ? 's' : ''}${best > first ? ` · <b class="fau">+${fmt((best / first - 1) * 100)} %</b>` : ''}</span></span>${spark(hist.slice(-12).map(x => x.v))}<span class="end num" style="font-weight:800;min-width:56px">${fmt(best, 1)}<span class="small"> kg</span></span></div>`;
  }
  if (!any) h += `<div class="empty">${ic('trophy')}Tes records apparaîtront après ta première séance.</div>`;
  h += `</div>`;

  const vol = weekVolume();
  h += sec('Volume de la semaine', `<span class="small">zone utile 10–20 séries</span>`) + `<div class="card"><div class="vol">`;
  for (const mu of VOLUME_MUSCLES) { const v = vol[mu] || 0; h += `<span>${MUSCLES[mu]}</span><div class="vb"><span class="zone"></span><i data-w="${clamp(v / 25 * 100, 0, 100).toFixed(1)}" style="${v >= 10 ? '' : 'background:var(--s4)'}"></i></div><span class="num" style="text-align:right;font-weight:700">${fmt(v, 1)}</span>`; }
  h += `</div><p class="small" style="margin:10px 0 0">Séries validées depuis lundi. Une série d’un exercice qui sollicite le muscle en second compte pour moitié.</p></div>`;

  h += sec('Tests athlétiques', `<button class="link" data-a="tests">Ajouter</button>`) + `<div class="card tight">`;
  h += TESTS.map(t => { const all = S.tests.filter(x => x.k === t.k), a = all[0], b = all[all.length - 1]; const u = t.u === 'reps' ? '' : ` ${t.u}`;
    return `<div class="li"><span class="grow"><span class="ttl">${esc(t.n)}</span><span class="meta">${a ? `Départ ${fmt(a.v)}${u} (${fdate(a.d)})` : esc(t.d)}</span></span><span class="end num" style="font-weight:800">${b ? fmt(b.v) + `<span class="small">${u}</span>` : '–'}${a && b && b !== a ? `<span class="small fau" style="display:block">${b.v - a.v >= 0 ? '+' : '−'}${fmt(Math.abs(b.v - a.v))}</span>` : ''}</span></div>`; }).join('');
  h += `</div>`;

  h += sec('Photos', S.photos.length >= 2 ? `<button class="link" data-a="compare">Avant / après</button>` : '');
  h += `<div class="card"><div class="photos">${[...S.photos].reverse().slice(0, 6).map(ph => `<button data-a="photo" data-v="${ph.id}"><img data-photo="${ph.id}" alt="Photo du ${fdate(ph.d)}"><span>${fdate(ph.d)}</span></button>`).join('')}</div>
    ${S.photos.length ? '' : '<p class="sub" style="margin:0 0 10px">Même lumière, même pose, même heure. Une photo toutes les 2 semaines suffit.</p>'}
    <label class="btn sm ghost" style="margin-top:${S.photos.length ? 12 : 0}px">${ic('camera')} Ajouter une photo<input type="file" accept="image/*" data-in="photo" hidden></label><div class="small" style="margin-top:8px">Les photos restent sur ton téléphone, elles ne sont jamais envoyées.</div></div>`;

  h += sec('Historique') + `<div class="card tight">`;
  const ws = [...S.workouts].reverse().slice(0, 15);
  h += ws.length ? ws.map(w => `<button class="li" data-a="history" data-v="${w.id}"><span class="kico ${w.kind}">${ic(KIND_IC[w.kind] || 'dumbbell')}</span><span class="grow"><span class="ttl">${esc(w.title)} · ${esc(w.sub || '')}</span><span class="meta">${dayLabel(w.date)} · ${w.dur || '–'} min${w.vol ? ` · ${fmt(w.vol / 1000, 1)} t` : ''}${w.prs ? ` · <b style="color:var(--fat)">${w.prs} record${w.prs > 1 ? 's' : ''}</b>` : ''}</span></span>${ic('next')}</button>`).join('') : `<div class="empty">${ic('dumbbell')}Aucune séance pour l’instant.</div>`;
  h += `</div>`;
  return h;
}

function drawCharts() {
  const el = $('[data-chart="weight"]'); if (!el) return;
  const tr = trendSeries().filter(x => diffDays(x.d, today()) <= 120);
  const W = el.clientWidth || 320, H = el.clientHeight || 190;
  if (tr.length < 2) { el.innerHTML = `<div class="empty" style="padding-top:60px">Pèse-toi chaque matin : la courbe apparaît dès la 2<sup>e</sup> pesée.</div>`; return; }
  const d0 = tr[0].d, span = Math.max(1, diffDays(d0, tr[tr.length - 1].d));
  const vals = tr.flatMap(x => [x.kg, x.t]); let mn = Math.min(...vals), mx = Math.max(...vals); const padv = Math.max(0.4, (mx - mn) * 0.15); mn -= padv; mx += padv;
  const L = 30, R = 8, T = 10, B = 22, cs = getComputedStyle(document.documentElement), acc = cs.getPropertyValue('--acc2').trim() || '#2BB884', dim = cs.getPropertyValue('--s4').trim() || '#bbb', s1 = cs.getPropertyValue('--s1').trim() || '#fff', grid = cs.getPropertyValue('--line').trim() || 'rgba(0,0,0,.06)';
  const X = d => L + diffDays(d0, d) / span * (W - L - R), Y = v => T + (1 - (v - mn) / (mx - mn)) * (H - T - B);
  let s = `<defs><linearGradient id="wg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${acc}" stop-opacity=".22"/><stop offset="1" stop-color="${acc}" stop-opacity="0"/></linearGradient></defs>`;
  for (let i = 0; i <= 3; i++) { const v = mn + (mx - mn) * i / 3, y = Y(v); s += `<line x1="${L}" x2="${W - R}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}" stroke="${grid}"/><text x="${L - 6}" y="${(y + 4).toFixed(1)}" text-anchor="end">${fmt(v, 1)}</text>`; }
  const ticks = W < 360 ? 2 : 3;
  for (let i = 0; i <= ticks; i++) { const d = addDays(d0, Math.round(span * i / ticks)); s += `<text x="${X(d).toFixed(1)}" y="${H - 4}" text-anchor="${i === 0 ? 'start' : i === ticks ? 'end' : 'middle'}">${fdate(d)}</text>`; }
  const line = tr.map((x, i) => `${i ? 'L' : 'M'}${X(x.d).toFixed(1)} ${Y(x.t).toFixed(1)}`).join(' ');
  s += `<path d="${line} L${X(tr[tr.length - 1].d).toFixed(1)} ${H - B} L${X(d0).toFixed(1)} ${H - B} Z" fill="url(#wg)"/>`;
  s += tr.map(x => `<circle cx="${X(x.d).toFixed(1)}" cy="${Y(x.kg).toFixed(1)}" r="2.6" fill="${dim}"/>`).join('');
  s += `<path d="${line}" fill="none" stroke="${acc}" stroke-width="2.8" stroke-linejoin="round" stroke-linecap="round"/>`;
  const lx = tr[tr.length - 1]; s += `<circle cx="${X(lx.d).toFixed(1)}" cy="${Y(lx.t).toFixed(1)}" r="5.5" fill="${acc}" stroke="${s1}" stroke-width="2.5"/>`;
  el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Courbe de poids">${s}</svg>`;
}
let chartRO = null;
function watchCharts() { if (chartRO || !window.ResizeObserver) return; let w = innerWidth; chartRO = true; addEventListener('resize', () => { if (Math.abs(innerWidth - w) > 20) { w = innerWidth; drawCharts(); } }); }

/* ================= Photos (IndexedDB) ================= */
const IDB = {
  db: null,
  open() { return new Promise((res, rej) => { if (this.db) return res(this.db); const r = indexedDB.open('fauve', 1); r.onupgradeneeded = () => r.result.createObjectStore('photos'); r.onsuccess = () => { this.db = r.result; res(this.db); }; r.onerror = () => rej(r.error); }); },
  async tx(mode, fn) { const db = await this.open(); return new Promise((res, rej) => { const t = db.transaction('photos', mode); const st = t.objectStore('photos'); const out = fn(st); t.oncomplete = () => res(out && out.result); t.onerror = () => rej(t.error); }); },
  put(id, blob) { return this.tx('readwrite', st => st.put(blob, id)); },
  get(id) { return this.tx('readonly', st => st.get(id)); },
  del(id) { return this.tx('readwrite', st => st.delete(id)); }
};
const PURL = new Map();
async function photoURL(id) { if (PURL.has(id)) return PURL.get(id); try { const b = await IDB.get(id); if (!b) return null; const u = URL.createObjectURL(b); PURL.set(id, u); return u; } catch (e) { return null; } }
function fillPhotos(root = document) { $$('img[data-photo]', root).forEach(async img => { const u = await photoURL(img.dataset.photo); if (u) img.src = u; }); }
async function addPhoto(file) {
  try {
    const bmp = await createImageBitmap(file).catch(() => null);
    let blob = file;
    if (bmp) { const sc = Math.min(1, 1280 / Math.max(bmp.width, bmp.height)); const c = document.createElement('canvas'); c.width = Math.round(bmp.width * sc); c.height = Math.round(bmp.height * sc); c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height); blob = await new Promise(r => c.toBlob(r, 'image/jpeg', .82)) || file; }
    const id = 'p' + uid(); await IDB.put(id, blob); S.photos.push({ id, d: today() }); invalidate(); save(); haptic(); toast('Photo enregistrée'); render();
  } catch (e) { toast('Impossible d’enregistrer la photo'); }
}
async function openPhoto(id) {
  const ph = S.photos.find(x => x.id === id); if (!ph) return;
  const u = await photoURL(id);
  openSheet(`<h2 class="h2">${fdateL(ph.d)}</h2>${u ? `<img src="${u}" alt="" style="width:100%;border-radius:16px;display:block">` : ''}<button class="btn ghost block" style="margin-top:14px" data-a="delPhoto" data-v="${id}">${ic('trash')} Supprimer</button>`, { type: 'photo' });
}
async function openCompare() {
  const ps = [...S.photos].sort((a, b) => a.d < b.d ? -1 : 1); if (ps.length < 2) return;
  const a = ps[0], b = ps[ps.length - 1], ua = await photoURL(a.id), ub = await photoURL(b.id);
  let h = ovBar('Avant / après');
  h += `<p class="sub" style="margin:8px 2px 12px">Glisse pour comparer le ${fdate(a.d)} et le ${fdate(b.d)} (${diffDays(a.d, b.d)} jours).</p>
    <div class="cmp" id="cmp"><img src="${ua || ''}" alt="Avant"><img class="after" src="${ub || ''}" alt="Après"><div class="hnd"></div><span class="l" style="left:10px">${fdate(a.d)}</span><span class="l" style="right:10px">${fdate(b.d)}</span></div>`;
  showOv(h, 'compare');
  const el = $('#cmp'), set = x => { const r = el.getBoundingClientRect(), p = clamp((x - r.left) / r.width, 0, 1) * 100; $('.after', el).style.clipPath = `inset(0 0 0 ${p}%)`; $('.hnd', el).style.left = p + '%'; };
  el.addEventListener('pointerdown', e => { el.setPointerCapture(e.pointerId); set(e.clientX); });
  el.addEventListener('pointermove', e => { if (e.buttons || e.pointerType === 'touch') set(e.clientX); });
}

/* ================= Historique & bibliothèque ================= */
function openHistory(id) {
  const w = S.workouts.find(x => x.id === id); if (!w) return;
  let h = ovBar(esc(w.title));
  h += `<div class="over" style="margin-top:6px">${fdateL(w.date)} · semaine ${w.week}</div><div class="h1">${esc(w.title)}</div><div class="chips" style="margin:12px 0">${w.dur ? `<span class="tag">${w.dur} min</span>` : ''}${w.sets ? `<span class="tag">${w.sets} séries</span>` : ''}${w.vol ? `<span class="tag">${fmt(w.vol / 1000, 1)} t</span>` : ''}${w.prs ? `<span class="tag sand">${w.prs} PR</span>` : ''}${w.cardio && w.cardio.rpe ? `<span class="tag">Ressenti ${w.cardio.rpe}/10</span>` : ''}</div>`;
  if (w.items && w.items.length) h += `<div class="card tight">${w.items.map(it => `<div class="li"><span class="grow"><span class="ttl">${esc((EX[it.k] || {}).n || it.k)}</span><span class="meta num">${esc(setsTxt(it.sets, it.k))}</span></span>${it.sets.some(s => s.pr) ? '<span class="prb">PR</span>' : ''}</div>`).join('')}</div>`;
  if (w.cardio && (w.cardio.min || w.cardio.km || w.cardio.dist)) h += `<div class="card tight" style="margin-top:12px">${w.cardio.min ? `Durée : <b>${w.cardio.min} min</b> ` : ''}${w.cardio.km ? `· ${fmt(w.cardio.km, 2)} km ` : ''}${w.cardio.dist ? `· ${fmt(w.cardio.dist, 2)} ${w.cardio.unit || ''}` : ''}</div>`;
  if (w.notes) h += `<div class="note" style="margin-top:12px">${esc(w.notes)}</div>`;
  showOv(h, 'history', `<button class="btn ghost block" data-a="delWorkout" data-v="${w.id}">${ic('trash')} Supprimer cette séance</button>`);
}
function openLibrary(pickFor) {
  const list = Object.entries(EX).sort((a, b) => a[1].n.localeCompare(b[1].n, 'fr'));
  let h = ovBar(pickFor != null ? 'Choisir un exercice' : 'Exercices');
  h += `<div class="h1" style="margin:8px 0 12px">Exercices</div><div class="card tight">`;
  h += list.map(([k, e]) => {
    const mus = Object.keys(e.m).filter(m => e.m[m] >= 1).map(m => MUSCLES[m]).join(', ') || 'Puissance / gainage';
    if (pickFor != null) return `<button class="li" data-a="pickEx" data-v="${k}" data-i="${pickFor}"><span class="grow"><span class="ttl">${esc(e.n)}</span><span class="meta">${esc(e.eq)} · ${esc(mus)}</span></span>${ic('plus', 'fau')}</button>`;
    return `<details class="acc"><summary><span><span style="display:block;font-weight:700">${esc(e.n)}</span><span class="small">${esc(e.eq)} · ${esc(mus)}</span></span>${ic('plus')}</summary><div class="acc-b"><ul class="cues">${e.cues.map(c => `<li>${esc(c)}</li>`).join('')}</ul></div></details>`;
  }).join('');
  h += `</div>`;
  if (pickFor != null) { openSheet(`<h2 class="h2">${pickFor === -1 ? 'Ajouter un exercice' : 'Remplacer par'}</h2>${pickFor >= 0 ? altList(pickFor) : ''}<div style="max-height:52vh;overflow:auto">${list.map(([k, e]) => `<button class="li" data-a="pickEx" data-v="${k}" data-i="${pickFor}"><span class="grow"><span class="ttl">${esc(e.n)}</span><span class="meta">${esc(e.eq)}</span></span>${ic('plus', 'fau')}</button>`).join('')}</div>`, { type: 'pickEx' }); return; }
  showOv(h, 'library');
}
function altList(i) {
  const it = S.active.items[i], alts = (EX[it.k].alt || []).filter(k => EX[k]);
  if (!alts.length) return '';
  return `<div class="lbl" style="margin-bottom:4px">Équivalents conseillés</div><div class="card tight" style="margin-bottom:14px">${alts.map(k => `<button class="li" data-a="pickEx" data-v="${k}" data-i="${i}"><span class="grow"><span class="ttl">${esc(EX[k].n)}</span><span class="meta">${esc(EX[k].eq)}</span></span>${ic('swap', 'fau')}</button>`).join('')}</div><div class="lbl" style="margin-bottom:4px">Tous les exercices</div>`;
}

/* ================= Moi ================= */
function vMe() {
  const p = S.profile, t = targets(), hrmax = Math.round(208 - 0.7 * p.age), act = ACT.find(a => a.v === p.act) || ACT[0];
  let h = `<header class="hd"><div><div class="over">Profil & réglages</div><h1 class="h1">${esc(p.name || 'Moi')}</h1></div><div class="hd-r"><button class="ibtn" data-a="profile" aria-label="Modifier le profil">${ic('edit')}</button></div></header>`;
  h += `<div class="card"><div class="grid3">${[['Âge', p.age, 'ans'], ['Taille', p.height, 'cm'], ['Départ', p.weight, 'kg']].map(([l, v, u]) => `<div><div class="lbl">${l}</div><div class="mid num">${fmt(v, 1)}<span class="small"> ${u}</span></div></div>`).join('')}</div>
    <div class="sep"></div><div class="small" style="color:var(--ink)">${esc(act.n)} · ${esc(MODES[p.mode].n)}</div><div class="small">Programme dès le ${fdate(p.start)} · MMA le ${fdate(p.mma)}</div></div>`;
  h += sec('Tes cibles') + `<div class="card"><div class="row sb"><div><div class="lbl">Calories / jour</div><div class="big num">${fmt(t.kcal)}</div></div><div style="text-align:right" class="small num">Repos : ${fmt(t.bmr)} kcal<br>Dépense : ${fmt(t.tdee)} kcal<br>${t.deficit >= 0 ? 'Déficit' : 'Surplus'} : ${fmt(Math.abs(t.deficit))} kcal${S.kcalAdj ? `<br>Ajusté : ${S.kcalAdj > 0 ? '+' : '−'}${Math.abs(S.kcalAdj)} kcal` : ''}</div></div>
    <div class="grid3" style="margin-top:14px">${[['Protéines', t.prot, 'pro'], ['Glucides', t.carb, 'cob'], ['Lipides', t.fat, 'sand']].map(([l, v, c]) => `<div><div class="lbl">${l}</div><div class="mid num ${c}">${v}<span class="small"> g</span></div></div>`).join('')}</div>
    <p class="small" style="margin:12px 0 0">Protéines ${fmt(t.prot / t.w, 1)} g/kg · eau ${fmt(t.water / 1000, 2)} L · fibres ${t.fib} g. Objectif de rythme : ${t.rate > 0 ? `−${fmt(t.rate, 1)} % de poids/semaine` : t.rate < 0 ? `+${fmt(-t.rate, 1)} %/semaine` : 'stable'}.</p>
    ${S.kcalAdj ? '<button class="link" data-a="resetAdj">Annuler les ajustements</button>' : ''}</div>`;
  h += sec('Zones cardio') + `<div class="card"><div class="small" style="margin-bottom:10px">FC max estimée : <b style="color:var(--ink)" class="num">${hrmax} bpm</b> (formule de Tanaka)</div>
    ${[['Zone 2 · endurance', .6, .7, 'cob'], ['Seuil · fractionné', .8, .88, 'sand'], ['Maximal · sprints', .9, 1, 'pro']].map(([l, a, b, c]) => `<div class="row sb" style="padding:6px 0"><span>${l}</span><span class="tag ${c} num">${Math.round(hrmax * a)}–${Math.round(hrmax * b)} bpm</span></div>`).join('')}
    <p class="small" style="margin:8px 0 0">Sans cardiofréquencemètre : en zone 2, tu peux parler en phrases complètes.</p></div>`;
  const wg = S.settings.waterGoal || 'auto';
  h += sec('Eau et rappels') + `<div class="card"><div class="lbl" style="margin-bottom:8px">Objectif quotidien</div><div class="chips">${[['auto', `Auto (${fmt(waterAuto() / 1000, 2)} L)`], [2500, '2,5 L'], [3000, '3 L'], [3500, '3,5 L'], [4000, '4 L']].map(([v, l]) => `<button class="chip ${String(wg) === String(v) ? 'on' : ''}" data-a="waterGoal" data-v="${v}">${l}</button>`).join('')}</div>
    <div class="sep"></div><label class="row sb" style="min-height:44px"><span>Rappels quand tu as du retard</span><span class="toggle"><input type="checkbox" data-in="setting" data-v="waterRemind" ${S.settings.waterRemind ? 'checked' : ''}><i></i></span></label>
    <div class="lbl" style="margin:10px 0 8px">Au plus souvent toutes les</div><div class="chips">${[[60, '1 h'], [90, '1 h 30'], [120, '2 h']].map(([v, l]) => `<button class="chip ${(S.settings.waterEvery || 90) === v ? 'on' : ''}" data-a="waterEvery" data-v="${v}">${l}</button>`).join('')}</div>
    <p class="small" style="margin:12px 0 0">Entre 8 h et 21 h, l\u2019appli calcule ce que tu devrais avoir bu à chaque heure. Si tu as plus de 250 ml de retard, un rappel s\u2019affiche quand l\u2019appli est ouverte. Pour être prévenu appli fermée, utilise les rappels de l\u2019app Rappels de l\u2019iPhone.</p></div>`;
  h += sec('Créneaux', `<button class="link" data-a="slots">Modifier</button>`) + `<div class="card tight">${DOW.map((d, i) => `<div class="row sb" style="padding:6px 0"><span>${d}</span><span class="num ${S.slots[i] ? '' : 'small'}">${S.slots[i] ? esc(S.slots[i]) : 'non défini'}</span></div>`).join('')}</div>`;
  h += sec('Le guide', `<span class="small">appuyé sur la science</span>`) + `<div class="card tight">${GUIDE.map(g => `<details class="acc"><summary>${esc(g.t)}${ic('plus')}</summary><div class="acc-b">${g.p.map(x => `<p>${esc(x)}</p>`).join('')}${g.src ? `<div class="src">${g.src.map(([l, u]) => `<a href="${u}" target="_blank" rel="noopener">${esc(l)} ↗</a>`).join('')}</div>` : ''}</div></details>`).join('')}</div>`;
  h += sec('Réglages') + `<div class="card tight"><div class="row sb" style="min-height:60px"><span>Apparence</span><div class="seg" style="width:210px">${[['auto', 'Auto'], ['light', 'Clair'], ['dark', 'Sombre']].map(([k, l]) => `<button class="${(S.settings.theme || 'auto') === k ? 'on' : ''}" data-a="theme" data-v="${k}">${l}</button>`).join('')}</div></div>${[['sound', 'Sons (chronos, repos)'], ['haptics', 'Vibrations'], ['loud', 'Chrono audible en mode silencieux (coupe ta musique)']].map(([k, l]) => `<label class="row sb" style="min-height:52px"><span>${l}</span><span class="toggle"><input type="checkbox" data-in="setting" data-v="${k}" ${S.settings[k] ? 'checked' : ''}><i></i></span></label>`).join('')}</div>`;
  const ago = S.lastExport ? diffDays(S.lastExport, today()) : null;
  h += sec('Tes données') + `<div class="card"><p class="sub" style="margin-top:0">Tout est stocké sur ce téléphone, rien sur un serveur. Sauvegarde régulièrement dans Fichiers ou iCloud Drive.</p>
    <div class="small" style="margin-bottom:12px;color:${ago == null || ago > 14 ? 'var(--fau2)' : 'var(--mut)'}">Dernière sauvegarde : ${ago == null ? 'jamais' : ago === 0 ? 'aujourd’hui' : `il y a ${ago} jours`}</div>
    <div class="row"><button class="btn pri sm grow" data-a="export">${ic('download')} Sauvegarder</button><label class="btn ghost sm grow">Restaurer<input type="file" accept="application/json,.json" data-in="import" hidden></label></div>
    <button class="link" style="margin-top:8px;color:var(--mut)" data-a="reset">Tout effacer et recommencer</button></div>`;
  h += `<p class="small" style="margin:22px 4px 0">Fauve v3 · Les conseils de l’appli ne remplacent pas un avis médical. Si tu as un souci de santé, une douleur ou un traitement, demande l’avis d’un médecin avant de démarrer.</p>`;
  return h;
}

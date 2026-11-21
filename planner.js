/* Fauve — menu de la semaine, recettes, liste de courses, analyse nutrition, eau */
'use strict';

Object.assign(I, {
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/>',
  apple: '<path d="M12 7.5c-1.5-1-3.4-1.2-4.9-.3C4.8 8.6 4.6 12 5.6 15c1 3 3 5.7 4.8 5.5 1-.1 1.1-.6 1.6-.6s.6.5 1.6.6c1.8.2 3.8-2.5 4.8-5.5s.8-6.4-1.5-7.8c-1.5-.9-3.4-.7-4.9.3zM12 7.5c0-2 1-3.5 3-4"/>',
  cart: '<path d="M3 4h2.5l2.2 11h10.6L20.5 8H7"/><circle cx="9.5" cy="19.5" r="1.5"/><circle cx="17" cy="19.5" r="1.5"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="3"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
  shuffle: '<path d="M3 7h3.5c3 0 4.5 10 8 10H21M3 17h3.5c1.2 0 2.1-1.4 2.9-3.2M14.5 7H21M18 4l3 3-3 3M18 14l3 3-3 3"/>',
  bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20.5a2 2 0 0 0 4 0"/>'
});

const RMAP = Object.fromEntries(RECIPES.map(r => [r.id, r]));
const SLOTS = ['b', 'l', 's', 'd'];
const SLOT_IC = { b: 'sun', l: 'food', s: 'apple', d: 'moon' };
const slotName = k => (MEALS.find(m => m.k === k) || {}).n || '';
const isFixed = id => { const f = FOODMAP[id]; return FOOD_CAT.prot.includes(id) || (f && f.p * 4 / f.kcal > 0.5); };
const hasAny = (r, list) => r.items.some(([id]) => list.includes(id));
const mainProt = r => (r.items.find(([id]) => FOOD_CAT.prot.includes(id)) || [''])[0];
const catOf = id => Object.keys(FOOD_CAT).find(c => FOOD_CAT[c].includes(id)) || 'epi';
function scaleItems(items, f) {
  return items.map(([id, g]) => { let ng = isFixed(id) ? g : g * f; ng = ng >= 30 ? Math.round(ng / 5) * 5 : Math.max(1, Math.round(ng)); return [id, ng]; });
}
function recipeTags(r) {
  const t = r.tags.slice();
  if (hasAny(r, FISH_FAT) && !t.includes('Poisson gras')) t.unshift('Poisson gras');
  else if (hasAny(r, FISH) && !t.some(x => x.startsWith('Poisson'))) t.unshift('Poisson');
  if (!hasAny(r, MEAT) && !hasAny(r, FISH) && !t.includes('Végétarien')) t.push('Végétarien');
  return t;
}
function wkOf(off = 0) { return addDays(mondayOf(today()), off * 7); }
function planDay(wk, d) { return ((S.plan || {})[wk] || {})[d] || {}; }
function dayFactor(ch, kcal) {
  let pk = 0, ok = 0, share = 0;
  for (const sl of SLOTS) {
    const r = RMAP[ch[sl]]; if (!r) continue; share += SLOT_SHARE[sl];
    for (const [id, g] of r.items) { const k = FOODMAP[id].kcal * g / 100; if (isFixed(id)) pk += k; else ok += k; }
  }
  return share ? clamp((kcal * share - pk) / (ok || 1), 0.6, 1.6) : 1;
}
function dayMenu(wk, d) {
  const ch = planDay(wk, d), k = addDays(wk, d), t = targets(k), f = dayFactor(ch, t.kcal), meals = {};
  for (const sl of SLOTS) { const r = RMAP[ch[sl]]; if (r) { const items = scaleItems(r.items, f); meals[sl] = { r, items, mac: itemsMac(items) }; } }
  const tot = sumMac(Object.values(meals).flatMap(m => m.items.map(([fid, g]) => ({ f: fid, g }))));
  return { ch, f, meals, k, t, tot, full: SLOTS.every(sl => meals[sl]) };
}

/* ---------- Remplissage automatique ---------- */
function seeded(seed) { let s = (seed >>> 0) || 1; return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296; }
function hashStr(t) { let h = 2166136261; for (let i = 0; i < t.length; i++) h = Math.imul(h ^ t.charCodeAt(i), 16777619); return h >>> 0; }
function autoFill(wk, salt = 0) {
  const rnd = seeded(hashStr(wk) + salt * 7919), used = { b: [], l: [], s: [], d: [] }, plan = {};
  let red = 0;
  const pick = (sl, ok) => {
    let opts = RECIPES.filter(r => r.m === sl && ok(r)); if (!opts.length) opts = RECIPES.filter(r => r.m === sl);
    const fresh = opts.filter(r => !used[sl].includes(r.id)), pool = fresh.length ? fresh : opts, r = pool[Math.floor(rnd() * pool.length)];
    used[sl].push(r.id); if (used[sl].length >= RECIPES.filter(x => x.m === sl).length) used[sl] = []; return r;
  };
  for (let d = 0; d < 7; d++) {
    const l = pick('l', r => !(hasAny(r, RED) && red >= 3)); if (hasAny(l, RED)) red++;
    const dn = pick('d', r => !(hasAny(r, RED) && red >= 3) && mainProt(r) !== mainProt(l)); if (hasAny(dn, RED)) red++;
    plan[d] = { b: pick('b', () => true).id, l: l.id, s: pick('s', () => true).id, d: dn.id };
  }
  const count = list => Object.values(plan).reduce((n, p) => n + ['l', 'd'].filter(sl => hasAny(RMAP[p[sl]], list)).length, 0);
  const swapDinner = (to, avoid) => { for (const d of [3, 1, 5, 0, 2, 4, 6]) { const r = RMAP[plan[d].d]; if (!hasAny(r, avoid) && mainProt(RMAP[plan[d].l]) !== mainProt(RMAP[to])) { plan[d].d = to; return; } } };
  if (!count(FISH_FAT)) swapDinner('d1', FISH);
  if (count(FISH) < 2) { const usedD = Object.values(plan).map(p => p.d); swapDinner(['d4', 'd7', 'd1'].find(x => !usedD.includes(x)) || 'd4', FISH); }
  return plan;
}

/* ---------- Analyse du menu ---------- */
function planAnalysis(wk) {
  let days = 0, kcal = 0, p = 0, fib = 0, fl = 0, fish = 0, fat = 0, red = 0, legs = 0; const ids = new Set();
  for (let d = 0; d < 7; d++) {
    const dm = dayMenu(wk, d); const ms = Object.values(dm.meals); if (!ms.length) continue;
    days++; kcal += dm.tot.kcal; p += dm.tot.p; fib += dm.tot.fib;
    for (const m of ms) {
      ids.add(m.r.id);
      for (const [id, g] of m.items) { if (FOOD_CAT.fl.includes(id)) fl += g; if (id === 'boeuf5' || id === 'boeuf15') red += g * 0.7; if (id === 'porc_filet') red += g; }
      if (hasAny(m.r, FISH)) fish++; if (hasAny(m.r, FISH_FAT)) fat++; if (hasAny(m.r, LEGUMES_SECS)) legs++;
    }
  }
  return { days, kcal: days ? kcal / days : 0, p: days ? p / days : 0, fib: days ? fib / days : 0, fl: days ? fl / days : 0, fish, fat, red, legs, variety: ids.size };
}

/* ================= Onglet Nutrition : sélecteur ================= */
function foodTabs() {
  const t = S.ui.foodTab || 'journal';
  return `<div class="seg" style="margin-bottom:16px">${[['journal', 'Journal'], ['menu', 'Menu'], ['stats', 'Analyse']].map(([k, l]) => `<button class="${t === k ? 'on' : ''}" data-a="foodTab" data-v="${k}">${l}</button>`).join('')}</div>`;
}

/* ---------- Menu de la semaine ---------- */
function vMenu() {
  const off = S.ui.menuWeek || 0, wk = wkOf(off), plan = (S.plan || {})[wk];
  let h = `<div class="seg" style="margin-bottom:14px">${[0, 1].map(o => `<button class="${off === o ? 'on' : ''}" data-a="menuWeek" data-v="${o}">${o ? 'Semaine prochaine' : 'Cette semaine'}</button>`).join('')}</div>`;
  h += `<p class="small" style="margin:-4px 4px 12px">Du ${fdate(wk)} au ${fdate(addDays(wk, 6))}. Les quantités s’ajustent chaque jour à ta cible (${fmt(targets().kcal)} kcal).</p>`;
  if (!plan) {
    return h + `<div class="card" style="text-align:center;padding:26px 20px"><div class="hero-ic" style="margin:0 auto 12px;--k:var(--acc);--kBg:var(--accBg);background:var(--accBg);color:var(--acc)">${ic('food')}</div>
      <div class="h2">Prépare ton menu</div><p class="sub" style="margin:8px auto 18px;max-width:30ch">Pour chaque repas, choisis parmi ${RECIPES.length} recettes avec grammes, cuisson et étapes. Une liste de courses est générée.</p>
      <button class="btn pri block" data-a="menuAuto" data-v="${wk}">${ic('shuffle')} Me proposer une semaine équilibrée</button>
      <button class="btn ghost block" style="margin-top:10px" data-a="menuBlank" data-v="${wk}">Je choisis tout moi-même</button></div>`;
  }
  const an = planAnalysis(wk), t = targets();
  const ok = (b) => b ? 'fau' : 'sand';
  h += `<div class="card"><div class="row sb" style="align-items:flex-start"><div><div class="lbl">Moyenne par jour</div><div class="mid num">${fmt(an.kcal)} <span class="small">kcal</span></div><div class="small num">${fmt(an.p)} g de protéines · ${fmt(an.fib)} g de fibres</div></div><button class="btn pri sm" data-a="shop" data-v="${wk}">${ic('cart')} Courses</button></div>
    <div class="chips" style="margin-top:14px"><span class="tag ${ok(an.fish >= 2 && an.fat >= 1)}">Poisson ${an.fish}×${an.fat ? ` (dont ${an.fat} gras)` : ''}</span><span class="tag ${ok(an.fl >= 400)}">Fruits et légumes ${fmt(an.fl)} g/j</span><span class="tag ${ok(an.red <= 500)}">Viande rouge ${fmt(an.red)} g</span><span class="tag">${an.variety} recettes</span></div>
    <div class="row" style="margin-top:12px"><button class="btn ghost sm grow" data-a="menuAuto" data-v="${wk}">${ic('shuffle')} Nouvelle proposition</button><button class="btn ghost sm" data-a="foodTab" data-v="stats">Analyse</button></div></div>`;
  for (let d = 0; d < 7; d++) {
    const dm = dayMenu(wk, d), isT = dm.k === today();
    h += `<div class="card" style="margin-top:12px;${isT ? 'border-color:var(--acc2)' : ''}"><div class="card-h"><div><div class="h3">${DOW[d]} ${fdate(dm.k)}${isT ? ' <span class="tag fau" style="margin-left:4px">Aujourd’hui</span>' : ''}</div><div class="small num">${Object.keys(dm.meals).length ? `${fmt(dm.tot.kcal)} kcal · ${fmt(dm.tot.p)} g de protéines` : 'Rien de prévu'}</div></div></div>`;
    for (const sl of SLOTS) {
      const m = dm.meals[sl];
      h += `<button class="li" data-a="menuPick" data-w="${wk}" data-d="${d}" data-v="${sl}"><span class="kico ${m ? 'gym' : ''}">${ic(SLOT_IC[sl])}</span><span class="grow"><span class="meta">${slotName(sl)}</span><span class="ttl">${m ? esc(m.r.n) : '<span style="color:var(--acc)">Choisir un repas</span>'}</span>${m ? `<span class="meta num">${fmt(m.mac.kcal)} kcal · ${fmt(m.mac.p)} g prot. · ${m.r.time} min</span>` : ''}</span>${ic('next')}</button>`;
    }
    h += `</div>`;
  }
  h += `<button class="link" style="margin-top:10px;color:var(--mut)" data-a="menuClear" data-v="${wk}">Effacer le menu de cette semaine</button>`;
  return h;
}
function openMenuPick(wk, d, sl) {
  const cur = planDay(wk, d)[sl], opts = RECIPES.filter(r => r.m === sl);
  openSheet(`<h2 class="h2" style="margin-bottom:4px">${DOW[d]} · ${slotName(sl)}</h2><p class="sub" style="margin-bottom:10px">Les grammes s’adaptent à ta cible du jour. Touche le livre pour voir la recette.</p>
    ${opts.map(r => { const m = itemsMac(r.items), on = r.id === cur; return `<div class="li"><button class="grow" style="text-align:left" data-a="menuSet" data-w="${wk}" data-d="${d}" data-s="${sl}" data-v="${r.id}"><span class="ttl" style="${on ? 'color:var(--acc)' : ''}">${on ? '✓ ' : ''}${esc(r.n)}</span><span class="meta num">≈ ${fmt(m.kcal)} kcal · ${fmt(m.p)} g prot. · ${r.time} min</span><span class="chips" style="margin-top:6px;gap:4px">${recipeTags(r).map(x => `<span class="tag" style="font-size:12px;padding:2px 8px">${esc(x)}</span>`).join('')}</span></button><button class="ibtn" data-a="recipe" data-v="${r.id}" data-w="${wk}" data-d="${d}" data-s="${sl}" aria-label="Recette : ${esc(r.n)}">${ic('book')}</button></div>`; }).join('')}
    ${cur ? `<button class="btn ghost block" style="margin-top:12px" data-a="menuSet" data-w="${wk}" data-d="${d}" data-s="${sl}" data-v="">Retirer ce repas</button>` : ''}`, { type: 'menuPick' });
}
function openRecipe(id, ctx = {}) {
  const r = RMAP[id]; if (!r) return;
  let f = 1, dayTxt = '';
  if (ctx.wk) { const ch = Object.assign({}, planDay(ctx.wk, +ctx.d), { [ctx.s]: id }); f = dayFactor(ch, targets(addDays(ctx.wk, +ctx.d)).kcal); dayTxt = `Quantités pour ${DOW[+ctx.d].toLowerCase()} ${fdate(addDays(ctx.wk, +ctx.d))}`; }
  else { const k = today(), ch = Object.assign({}, planDay(mondayOf(k), dowOf(k)), { [r.m]: id }); f = dayFactor(ch, targets(k).kcal); dayTxt = 'Quantités ajustées à ta cible'; }
  const items = scaleItems(r.items, f), m = itemsMac(items);
  let h = ovBar('Recette');
  h += `<div class="over" style="margin-top:4px">${slotName(r.m)} · ${r.time} min · ${esc(r.cook)}</div><div class="h1">${esc(r.n)}</div>
    <div class="chips" style="margin:12px 0">${recipeTags(r).map(x => `<span class="tag">${esc(x)}</span>`).join('')}</div>
    <div class="card"><div class="grid3" style="grid-template-columns:repeat(4,minmax(0,1fr))">${[['kcal', m.kcal, ''], ['Prot.', m.p, 'pro'], ['Gluc.', m.c, 'cob'], ['Lip.', m.f, 'sand']].map(([l, v, c]) => `<div><div class="mid num ${c}" style="font-size:22px">${fmt(v)}</div><div class="small">${l}${l === 'kcal' ? '' : ' (g)'}</div></div>`).join('')}</div></div>`;
  h += sec('Ingrédients', `<span class="small">${dayTxt}</span>`) + `<div class="card tight">${items.map(([fid, g]) => { const fo = FOODMAP[fid]; const raw = RAW[fid] ? ` · ≈ ${Math.round(g / RAW[fid] / 5) * 5} g cru` : ''; const pc = PIECES[fid] && fid !== 'saumon' ? ` · ${pieceTxt(fid, g)}` : ''; return `<div class="li" style="min-height:48px"><span class="grow"><span class="ttl">${esc(fo.n)}</span>${raw || pc ? `<span class="meta">${(raw + pc).replace(/^ · /, '')}</span>` : ''}</span><span class="end num" style="font-weight:650">${g} g</span></div>`; }).join('')}</div>`;
  h += sec('Préparation') + `<div class="card"><ol style="margin:0;padding-left:22px">${r.steps.map(s => `<li style="margin:6px 0 10px">${esc(s.replace(/\s*\((?:environ|≈)\s*\d+\s*g[^)]*\)/g, ''))}</li>`).join('')}</ol>${r.tip ? `<div class="note fau" style="margin-top:6px">${esc(r.tip)}</div>` : ''}</div>`;
  const foot = ctx.wk ? `<button class="btn pri block" data-a="menuSet" data-w="${ctx.wk}" data-d="${ctx.d}" data-s="${ctx.s}" data-v="${id}">${ic('check')} Choisir pour ${DOW[+ctx.d].toLowerCase()}</button>`
    : `<button class="btn pri block" data-a="recipeLog" data-v="${id}">${ic('plus')} Ajouter au journal d’aujourd’hui</button>`;
  closeSheet(); showOv(h, 'recipe', foot);
}
function pieceTxt(id, g) { const p = PIECES[id]; const n = Math.max(1, Math.round(g / p[2] * 2) / 2); return `${fmt(n, 1)} ${n > 1 ? p[1] : p[0]}`; }

/* ---------- Liste de courses ---------- */
function shopList(wk) {
  const agg = {};
  for (let d = 0; d < 7; d++) { const dm = dayMenu(wk, d); for (const m of Object.values(dm.meals)) for (const [id, g] of m.items) agg[id] = (agg[id] || 0) + g; }
  const wt = g => g >= 1000 ? `${fmt(g / 1000, 2)} kg` : `${Math.max(10, Math.round(g / 10) * 10)} g`;
  const rows = Object.entries(agg).map(([id, g]) => {
    const f = FOODMAP[id]; let n = f.n, q;
    if (RAW[id]) { n = `${RAW_N[id]} (cru)`; q = wt(g / RAW[id]); }
    else if (PIECES[id]) { const p = PIECES[id]; const c = Math.max(1, Math.ceil(g / p[2] - 0.2)); n = f.n.replace(/ \(.*\)$/, ''); q = `${c} ${c > 1 ? p[1] : p[0]}`; }
    else if (id === 'lait') q = `${fmt(g / 1030, 1)} L`;
    else q = wt(g);
    if (id === 'pois_chiches' || id === 'haricots_rouges') n += ' · conserve';
    return { id, n, q, cat: catOf(id) };
  });
  return Object.keys(CAT_N).map(c => ({ c, rows: rows.filter(r => r.cat === c).sort((a, b) => a.n.localeCompare(b.n, 'fr')) })).filter(g => g.rows.length);
}
function openShop(wk) {
  const groups = shopList(wk), done = (S.shop || {})[wk] || {};
  const n = groups.reduce((a, g) => a + g.rows.length, 0), nd = groups.reduce((a, g) => a + g.rows.filter(r => done[r.id]).length, 0);
  let h = ovBar('Liste de courses', `<button class="ibtn" data-a="shopCopy" data-v="${wk}" aria-label="Copier la liste">${ic('copy')}</button>`);
  h += `<div class="over" style="margin-top:4px">Semaine du ${fdate(wk)}</div><div class="h1">Courses</div><p class="sub" style="margin-top:6px">${nd} sur ${n} articles cochés. Touche un article quand il est dans ton panier.</p>`;
  for (const g of groups) {
    h += sec(CAT_N[g.c]) + `<div class="card tight">${g.rows.map(r => `<button class="li" data-a="shopTick" data-w="${wk}" data-v="${r.id}" style="min-height:52px"><span class="mk" style="color:${done[r.id] ? 'var(--acc2)' : 'var(--s4)'}">${ic(done[r.id] ? 'circleCheck' : 'circle')}</span><span class="grow ttl" style="${done[r.id] ? 'color:var(--mut);text-decoration:line-through' : ''}">${esc(r.n)}</span><span class="end num" style="font-weight:650;${done[r.id] ? 'color:var(--mut)' : ''}">${esc(r.q)}</span></button>`).join('')}</div>`;
  }
  h += `<p class="small" style="margin:14px 4px 0">Quantités pour 7 jours, déjà converties en cru pour les féculents et la volaille. Ajoute sel, poivre, épices, ail et citron selon tes goûts.</p>`;
  showOv(h, 'shop');
}
function shopText(wk) { return shopList(wk).map(g => `${CAT_N[g.c]}\n` + g.rows.map(r => `- ${r.n} : ${r.q}`).join('\n')).join('\n\n'); }

/* ---------- Menu du jour (journal + accueil) ---------- */
function menuTodayCard(k, compact) {
  const wk = mondayOf(k), d = dowOf(k), dm = dayMenu(wk, d), logged = (S.planLog || {})[k] || {};
  if (!Object.keys(dm.meals).length) {
    return `<div class="card row" style="margin-top:12px;padding:14px 16px"><span class="kico gym">${ic('food')}</span><div class="grow"><div class="h3">${k === today() ? 'Pas de menu pour aujourd’hui' : 'Pas de menu ce jour-là'}</div><div class="small">Choisis tes repas de la semaine en 2 minutes.</div></div><button class="btn sm pri" data-a="goMenu">Planifier</button></div>`;
  }
  let h = `<div class="card tight" style="margin-top:12px">`;
  if (!compact) h += `<div class="row sb" style="padding:10px 0 4px"><span class="h3">Au menu ${k === today() ? 'aujourd’hui' : 'ce jour-là'}</span><button class="link" style="min-height:32px" data-a="goMenu">Modifier</button></div>`;
  for (const sl of SLOTS) {
    const m = dm.meals[sl]; if (!m) continue; const done = logged[sl];
    h += `<div class="li"><span class="kico ${done ? 'done' : 'gym'}">${ic(done ? 'check' : SLOT_IC[sl])}</span><button class="grow" style="text-align:left" data-a="recipe" data-v="${m.r.id}" data-w="${wk}" data-d="${d}" data-s="${sl}"><span class="meta">${slotName(sl)}</span><span class="ttl">${esc(m.r.n)}</span><span class="meta num">${fmt(m.mac.kcal)} kcal · ${fmt(m.mac.p)} g prot.</span></button>
      ${done ? `<button class="btn sm ghost" data-a="ateUndo" data-k="${k}" data-v="${sl}" aria-label="Annuler">Annuler</button>` : `<button class="btn sm pri" data-a="ate" data-k="${k}" data-v="${sl}">Mangé</button>`}</div>`;
  }
  return h + `</div>`;
}
function logMeal(k, sl) {
  const dm = dayMenu(mondayOf(k), dowOf(k)), m = dm.meals[sl]; if (!m) return;
  const ents = m.items.map(([f, g]) => ({ id: uid(), m: sl, f, g }));
  S.food[k] = (S.food[k] || []).concat(ents);
  S.planLog = S.planLog || {}; S.planLog[k] = S.planLog[k] || {}; S.planLog[k][sl] = ents.map(e => e.id);
  invalidate(); save();
}
function unlogMeal(k, sl) {
  const ids = ((S.planLog || {})[k] || {})[sl]; if (!ids) return;
  S.food[k] = (S.food[k] || []).filter(e => !ids.includes(e.id)); delete S.planLog[k][sl]; invalidate(); save();
}

/* ================= Analyse ================= */
function vStats() {
  const days = [], bw = curWeight();
  for (let i = 7; i >= 1; i--) { const k = addDays(today(), -i), ents = S.food[k] || []; days.push({ k, n: dayNut(k), t: targets(k), logged: ents.length > 0, mp: SLOTS.map(sl => sumMac(ents.filter(e => e.m === sl)).p) }); }
  const L = days.filter(d => d.logged), nL = L.length, av = key => nL ? avg(L.map(d => d.n[key])) : 0, t = targets();
  let h = sec('Tes 7 derniers jours', `<span class="small">${nL} jour${nL > 1 ? 's' : ''} noté${nL > 1 ? 's' : ''}</span>`);
  if (nL < 2) {
    h += `<div class="card"><div class="empty" style="padding:14px 0">${ic('chart')}Note tes repas au moins 2 jours (le bouton « Mangé » du menu suffit) : ton analyse apparaîtra ici chaque matin.</div></div>`;
  } else {
    const kc = av('kcal'), p = av('p'), fib = av('fib'), pOk = L.filter(d => d.n.p >= d.t.prot * 0.9).length;
    const pc = av('p') * 4, cc = av('c') * 4, fc = av('f') * 9, tt = pc + cc + fc || 1;
    h += `<div class="grid2"><div class="kpi"><div class="v num">${fmt(kc)}</div><div class="k">kcal / jour · cible ${fmt(t.kcal)} (${kc >= t.kcal ? '+' : '−'}${fmt(Math.abs(kc / t.kcal - 1) * 100)} %)</div></div>
      <div class="kpi"><div class="v num pro">${fmt(p)} g</div><div class="k">protéines / jour · cible ${t.prot} g</div></div>
      <div class="kpi"><div class="v num">${pOk}/${nL}</div><div class="k">jours avec assez de protéines</div></div>
      <div class="kpi"><div class="v num">${fmt(fib)} g</div><div class="k">fibres / jour · vise 30 g et plus</div></div></div>`;
    h += `<div class="card" style="margin-top:12px"><div class="row sb"><span class="h3">Calories par jour</span><span class="small">trait : ta cible</span></div><div class="chart" data-chart="kcal" style="height:160px"></div></div>`;
    h += `<div class="card" style="margin-top:12px"><div class="h3" style="margin-bottom:10px">Répartition des calories</div><div style="display:flex;height:12px;border-radius:99px;overflow:hidden;gap:2px"><i style="width:${pc / tt * 100}%;background:var(--pro)"></i><i style="width:${cc / tt * 100}%;background:var(--carb)"></i><i style="width:${fc / tt * 100}%;background:var(--fat)"></i></div>
      <div class="row sb small" style="margin-top:8px"><span><b class="pro">${fmt(pc / tt * 100)} %</b> protéines</span><span><b class="cob">${fmt(cc / tt * 100)} %</b> glucides</span><span><b class="sand">${fmt(fc / tt * 100)} %</b> lipides</span></div></div>`;
    const mp = SLOTS.map((sl, i) => avg(L.map(d => d.mp[i]))), goal = Math.round(bw * 0.4);
    h += `<div class="card" style="margin-top:12px"><div class="h3">Protéines par repas</div><p class="small" style="margin:2px 0 10px">Vise ~${goal} g aux repas principaux (0,4 g/kg).</p>${SLOTS.map((sl, i) => `<div class="row sb" style="padding:4px 0"><span style="width:110px">${slotName(sl)}</span><div class="grow">${bar(mp[i] / goal, 'pro')}</div><span class="num" style="width:48px;text-align:right;font-weight:650">${fmt(mp[i])} g</span></div>`).join('')}</div>`;
    const tips = [];
    if (pOk < nL) tips.push(`Protéines atteintes ${pOk} jour${pOk > 1 ? 's' : ''} sur ${nL}. Le plus simple : un skyr ou un shake en collation (+35 g).`);
    if (kc > t.kcal * 1.08) tips.push(`Tu manges en moyenne ${fmt(kc - t.kcal)} kcal de trop par jour : surveille huile, fromage et grignotage.`);
    if (kc < t.kcal * 0.85) tips.push(`Tu manges ${fmt(t.kcal - kc)} kcal de moins que ta cible : à la longue, tu perdras du muscle et de l’énergie à l’entraînement.`);
    if (fib < 25) tips.push('Fibres trop basses : ajoute une portion de légumes par repas, des fruits ou des légumineuses.');
    if (mp[0] < goal * 0.7) tips.push(`Petit-déjeuner léger en protéines (${fmt(mp[0])} g) : œufs, skyr ou whey dans le porridge.`);
    if (!tips.length) tips.push('Rien à redire : calories, protéines et fibres sont dans les clous. Continue comme ça.');
    h += `<div class="card" style="margin-top:12px"><div class="h3" style="margin-bottom:8px">À retenir</div>${tips.map(x => `<div class="tip" style="padding:6px 0"><span class="tip-ic" style="width:30px;height:30px">${ic('sparkle')}</span><span style="font-size:15px">${esc(x)}</span></div>`).join('')}</div>`;
  }
  const wk = wkOf(S.ui.menuWeek || 0), plan = (S.plan || {})[wk];
  h += sec('Ton menu de la semaine');
  if (!plan) h += `<div class="card row" style="padding:14px 16px"><span class="grow small">Aucun menu pour cette semaine.</span><button class="btn sm pri" data-a="goMenu">Créer</button></div>`;
  else {
    const an = planAnalysis(wk);
    const rows = [
      [an.fl >= 400, 'Fruits et légumes', `${fmt(an.fl)} g par jour`, 'Au moins 400 g par jour (OMS)'],
      [an.fib >= 25, 'Fibres', `${fmt(an.fib)} g par jour`, 'Au moins 25 g, idéalement 30 g pour un homme'],
      [an.fish >= 2 && an.fat >= 1, 'Poisson', `${an.fish} repas, dont ${an.fat} poisson gras`, '2 fois par semaine dont 1 poisson gras (ANSES)'],
      [an.red <= 500, 'Viande rouge', `≈ ${fmt(an.red)} g cuits`, 'Pas plus de 350 à 500 g cuits par semaine (WCRF)'],
      [an.legs >= 1, 'Légumineuses', `${an.legs} repas`, 'Lentilles, pois chiches, haricots : fibres et minéraux'],
      [an.variety >= 14, 'Variété', `${an.variety} recettes différentes`, 'Varier = plus de micronutriments, moins de lassitude']
    ];
    h += `<div class="card tight">${rows.map(([ok, n, v, d]) => `<div class="li"><span class="mk" style="width:26px;color:${ok ? 'var(--acc2)' : 'var(--fat)'}">${ic(ok ? 'circleCheck' : 'info')}</span><span class="grow"><span class="ttl">${n} · <span class="num" style="font-weight:500">${v}</span></span><span class="meta">${d}</span></span></div>`).join('')}</div>`;
  }
  h += sec('Les repères') + `<div class="card tight">${NUTRI_REFS.map(r => `<details class="acc"><summary>${esc(r.t)}${ic('plus')}</summary><div class="acc-b"><p>${esc(r.p)}</p><div class="src"><a href="${r.u}" target="_blank" rel="noopener">${esc(r.s)} ↗</a></div></div></details>`).join('')}</div>`;
  return h;
}
const NUTRI_REFS = [
  { t: 'Fruits et légumes : 400 g par jour', p: 'L’OMS recommande au moins 400 g de fruits et légumes par jour (5 portions), pommes de terre et patates douces non comprises.', s: 'OMS · Alimentation saine', u: 'https://www.who.int/news-room/fact-sheets/detail/healthy-diet' },
  { t: 'Fibres : 25 à 35 g par jour', p: 'L’EFSA fixe au moins 25 g par jour ; la plupart des recommandations européennes visent 30 à 35 g pour les hommes. Légumes, fruits, légumineuses et céréales complètes.', s: 'EUFIC · Apports en fibres', u: 'https://eufic.org/en/whats-in-food/article/recommended-daily-intake-of-fibre-and-fibre-rich-foods-to-help-you-achieve-it' },
  { t: 'Poisson : 2 fois par semaine', p: 'L’ANSES conseille deux portions de poisson par semaine, dont un poisson gras (saumon, sardine, maquereau) pour les oméga-3, en variant les espèces.', s: 'ANSES · Manger du poisson', u: 'https://www.anses.fr/fr/content/manger-du-poisson-pourquoi-comment' },
  { t: 'Viande rouge : 500 g cuits maximum par semaine', p: 'Le WCRF recommande de ne pas dépasser environ trois portions de viande rouge par semaine (350 à 500 g cuits) et de limiter fortement la charcuterie.', s: 'WCRF · Viande rouge', u: 'https://www.wcrf.org/research-policy/evidence-for-our-recommendations/limit-red-processed-meat/' },
  { t: 'Sucres ajoutés et sel', p: 'Moins de 10 % des calories en sucres libres (idéalement 5 %) et moins de 5 g de sel par jour, selon l’OMS. Les plats préparés, la charcuterie, le fromage et le pain en apportent beaucoup.', s: 'OMS · Alimentation saine', u: 'https://www.who.int/news-room/fact-sheets/detail/healthy-diet' }
];
function drawKcalChart() {
  const el = $('[data-chart="kcal"]'); if (!el) return;
  const days = []; for (let i = 7; i >= 1; i--) { const k = addDays(today(), -i); days.push({ k, v: dayNut(k).kcal, t: targets(k).kcal }); }
  const W = el.clientWidth || 300, H = el.clientHeight || 160, B = 20, T = 8, mx = Math.max(...days.map(d => Math.max(d.v, d.t))) * 1.1 || 1;
  const cs = getComputedStyle(document.documentElement), acc = cs.getPropertyValue('--acc2').trim(), mut = cs.getPropertyValue('--s3').trim(), ink = cs.getPropertyValue('--mut').trim();
  const bw = (W - 8) / 7, y = v => T + (1 - v / mx) * (H - T - B);
  let s = '';
  days.forEach((d, i) => { const x = 4 + i * bw + bw * 0.18, w = bw * 0.64, top = y(d.v); s += `<rect x="${x.toFixed(1)}" y="${top.toFixed(1)}" width="${w.toFixed(1)}" height="${Math.max(0, H - B - top).toFixed(1)}" rx="6" fill="${d.v ? (Math.abs(d.v / d.t - 1) <= 0.1 ? acc : mut) : 'transparent'}"/><text x="${(x + w / 2).toFixed(1)}" y="${H - 5}" text-anchor="middle">${DOW_S[dowOf(d.k)]}</text>`; });
  const ty = y(days[days.length - 1].t); s += `<line x1="0" x2="${W}" y1="${ty.toFixed(1)}" y2="${ty.toFixed(1)}" stroke="${ink}" stroke-width="1.5" stroke-dasharray="4 4"/>`;
  el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Calories des 7 derniers jours">${s}</svg>`;
}

/* ================= Eau ================= */
function waterAuto(k = today()) {
  const w = curWeight(), pl = planOn(k), training = pl && pl.day.k !== 'rest';
  return Math.round((w * 35 + (training ? 500 : 0)) / 250) * 250;
}
function waterGoal(k = today()) { const g = S.settings.waterGoal; return g && g !== 'auto' ? +g : waterAuto(k); }
function waterPace(k = today()) {
  const goal = waterGoal(k), cur = S.water[k] || 0;
  if (k !== today()) return { goal, cur, exp: goal, behind: 0 };
  const now = new Date(), h = now.getHours() + now.getMinutes() / 60, s = 8, e = 21;
  const exp = Math.round(goal * clamp((h - s) / (e - s), 0, 1) / 50) * 50;
  return { goal, cur, exp, behind: Math.max(0, exp - cur) };
}
function waterCard(k) {
  const w = waterPace(k), pct = w.cur / w.goal, isT = k === today();
  const msg = w.cur >= w.goal ? 'Objectif atteint, bravo' : !isT ? '' : w.behind >= 250 ? `À cette heure, vise ${fmt(w.exp / 1000, 2)} L : bois un verre maintenant` : `Tu es dans le rythme (${fmt(w.exp / 1000, 2)} L attendus à cette heure)`;
  const marker = isT && w.cur < w.goal ? `<i style="position:absolute;top:-3px;bottom:-3px;width:2px;border-radius:2px;background:var(--ink);opacity:.35;left:${clamp(w.exp / w.goal, 0, 1) * 100}%"></i>` : '';
  return `<div class="card" style="margin-top:12px"><div class="row sb"><div class="row"><span class="kico" style="background:var(--waterBg);color:var(--water)">${ic('drop')}</span><div><div class="h3">Eau</div><div class="small num">${fmt(w.cur / 1000, 2)} / ${fmt(w.goal / 1000, 2)} L</div></div></div>
    <div class="row" style="gap:8px"><button class="ibtn" data-a="water" data-v="-250" data-k="${k}" aria-label="Retirer 250 ml">${ic('minus')}</button><button class="btn sm" style="background:var(--waterBg);color:var(--water)" data-a="water" data-v="500" data-k="${k}">+500</button><button class="btn sm cob" style="background:var(--water)" data-a="water" data-v="250" data-k="${k}">+250 ml</button></div></div>
    <div style="margin-top:14px;position:relative">${bar(pct, 'water')}${marker}</div>${msg ? `<div class="small" style="margin-top:8px">${msg}</div>` : ''}</div>`;
}
let lastNudge = 0;
function waterCheck(force) {
  if (!S.profile || !S.settings.waterRemind || document.visibilityState !== 'visible' || OV || SH || TM) return;
  const w = waterPace(), now = Date.now(), every = (S.settings.waterEvery || 90) * 60000;
  if (w.cur >= w.goal || w.behind < 250) return;
  if (!force && now - Math.max(lastNudge, S.lastWaterAt || 0) < every) return;
  if ($('#nudge')) return;
  lastNudge = now;
  const el = document.createElement('div'); el.id = 'nudge'; el.className = 'nudge';
  el.innerHTML = `<span class="kico" style="background:var(--waterBg);color:var(--water)">${ic('drop')}</span><div class="grow"><div style="font-weight:650">Un verre d’eau ?</div><div class="small">${fmt(w.cur / 1000, 2)} L sur ${fmt(w.goal / 1000, 2)} L · vise ${fmt(w.exp / 1000, 2)} L à cette heure</div></div><button class="btn sm cob" style="background:var(--water)" data-a="nudgeDrink">+250</button><button class="ibtn" data-a="nudgeClose" aria-label="Plus tard">${ic('x')}</button>`;
  document.body.appendChild(el); requestAnimationFrame(() => el.classList.add('show'));
  beep(660, .12, 'sine', .15); beep(880, .16, 'sine', .12, .12);
}
function closeNudge() { const el = $('#nudge'); if (el) { el.classList.remove('show'); setTimeout(() => el.remove(), 400); } }
setInterval(() => waterCheck(false), 60000);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') setTimeout(() => waterCheck(false), 1500); });

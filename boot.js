/* FAUVE — actions, saisies, onboarding, démarrage */
'use strict';

const dk = () => S.ui.foodDate || today();
const A = {
  tab: el => go(el.dataset.v),
  closeOv: () => closeOv(),
  closeSheet: () => closeSheet(),
  confirmOk: () => { const fn = SH && SH.fn; closeSheet(); if (fn) fn(); },
  dismiss: el => { S.dismiss[el.dataset.v] = 1; save(); render(); },
  streakInfo: () => { const n = streak(); openSheet(`<h2 class="h2">Ta série</h2><p class="sub">Un jour est réussi quand tu fais la séance prévue (ou que c’est un jour de repos) <b>et</b> que tu atteins au moins 90 % de tes protéines. C’est ce duo qui transforme le corps.</p><div class="big num" style="margin:10px 0">${n} jour${n > 1 ? 's' : ''}</div><button class="btn block" data-a="closeSheet">Compris</button>`); },
  openToday: () => { const pl = planOn(today()); if (pl) openSession(pl.week, pl.dow); },
  session: el => openSession(+el.dataset.w, +el.dataset.d),
  start: el => { closeSheet(); startWorkout(+el.dataset.w, +el.dataset.d); },
  resume: () => openWorkout(),
  weekNav: el => { const cw = Math.max(1, weekOf(today())); S.ui.week = clamp((S.ui.week || cw) + (+el.dataset.v), 1, Math.max(PROGRAM_WEEKS + 4, cw + 2)); save(); render(); haptic(); },
  water: el => {
    const k = el.dataset.k || (S.ui.tab === 'food' ? dk() : today()), v = +el.dataset.v || 250, goal = waterGoal(k), before = S.water[k] || 0;
    S.water[k] = Math.max(0, before + v); if (v > 0 && k === today()) S.lastWaterAt = Date.now();
    invalidate(); save(); haptic(); closeNudge();
    if (v > 0 && before < goal && S.water[k] >= goal) { toast(`Objectif d’eau atteint : ${fmt(goal / 1000, 2)} L, bravo`); confetti(60); beep(784, .15, 'sine', .2); beep(1175, .25, 'sine', .18, .12); }
    else if (v > 0) toast(`+${v} ml · ${fmt(S.water[k] / 1000, 2)} L sur ${fmt(goal / 1000, 2)} L`);
    render();
  },
  nudgeDrink: () => { A.water({ dataset: { v: '250', k: today() } }); },
  nudgeClose: () => { closeNudge(); },
  foodTab: el => { S.ui.foodTab = el.dataset.v; S.ui.foodDate = null; save(); const run = () => { render(); scrollTo(0, 0); }; if (document.startViewTransition && !reduced()) document.startViewTransition(run); else run(); haptic(); },
  goMenu: () => { closeOv(); S.ui.tab = 'food'; S.ui.foodTab = 'menu'; S.ui.menuWeek = 0; save(); render(); scrollTo(0, 0); },
  menuWeek: el => { S.ui.menuWeek = +el.dataset.v; save(); render(); },
  menuAuto: el => {
    const wk = el.dataset.v, run = () => { S.plan[wk] = autoFill(wk, Date.now() % 1000); S.shop[wk] = {}; save(); render(); haptic(2); toast('Semaine proposée : touche un repas pour le changer'); };
    if (S.plan[wk]) confirmSheet('Remplacer le menu de cette semaine par une nouvelle proposition ?', 'Remplacer', run); else run();
  },
  menuBlank: el => { S.plan[el.dataset.v] = {}; save(); render(); },
  menuClear: el => confirmSheet('Effacer tout le menu de cette semaine ?', 'Effacer', () => { delete S.plan[el.dataset.v]; save(); render(); }, true),
  menuPick: el => openMenuPick(el.dataset.w, +el.dataset.d, el.dataset.v),
  menuSet: el => {
    const wk = el.dataset.w, d = +el.dataset.d, sl = el.dataset.s, v = el.dataset.v;
    S.plan[wk] = S.plan[wk] || {}; S.plan[wk][d] = S.plan[wk][d] || {};
    if (v) S.plan[wk][d][sl] = v; else delete S.plan[wk][d][sl];
    save(); closeSheet(); haptic();
    if (OV) closeOv(); else render();
    if (v) toast(`${slotName(sl)} de ${DOW[d].toLowerCase()} : ${RMAP[v].n}`);
  },
  recipe: el => openRecipe(el.dataset.v, el.dataset.w ? { wk: el.dataset.w, d: el.dataset.d, s: el.dataset.s } : {}),
  recipeLog: el => {
    const r = RMAP[el.dataset.v], k = today(), ch = Object.assign({}, planDay(mondayOf(k), dowOf(k)), { [r.m]: r.id }), items = scaleItems(r.items, dayFactor(ch, targets(k).kcal));
    S.food[k] = (S.food[k] || []).concat(items.map(([f, g]) => ({ id: uid(), m: r.m, f, g }))); invalidate(); save(); haptic(); closeOv(); toast(`${r.n} ajouté au journal`);
  },
  ate: el => { logMeal(el.dataset.k, el.dataset.v); haptic(); toast('Ajouté au journal'); render(); },
  ateUndo: el => { unlogMeal(el.dataset.k, el.dataset.v); render(); },
  shop: el => openShop(el.dataset.v),
  shopTick: el => { const wk = el.dataset.w; S.shop[wk] = S.shop[wk] || {}; S.shop[wk][el.dataset.v] = !S.shop[wk][el.dataset.v]; save(); haptic(); const sc = $('.ov') ? $('.ov').scrollTop : 0; openShop(wk); const o = $('.ov'); if (o) { o.style.animation = 'none'; o.scrollTop = sc; } },
  shopCopy: el => { const txt = shopText(el.dataset.v); if (navigator.clipboard) navigator.clipboard.writeText(txt).then(() => toast('Liste copiée : colle-la dans Notes'), () => toast('Copie impossible')); else toast('Copie impossible'); },
  waterGoal: el => { S.settings.waterGoal = el.dataset.v === 'auto' ? 'auto' : +el.dataset.v; invalidate(); save(); haptic(); render(); },
  waterEvery: el => { S.settings.waterEvery = +el.dataset.v; save(); haptic(); render(); },
  habit: el => { const k = today(), h = S.habits[k] = S.habits[k] || {}; h[el.dataset.v] = !h[el.dataset.v]; invalidate(); save(); haptic(); render(); },
  weigh: () => sheetWeigh(),
  saveWeigh: () => { const v = val('w-kg'); if (!v || v < 30 || v > 300) return toast('Poids invalide'); S.weights = S.weights.filter(x => x.d !== today()); S.weights.push({ d: today(), kg: round(v, 2) }); invalidate(); save(); closeSheet(); haptic(); toast(`Pesée enregistrée · tendance ${fmt(curWeight(), 1)} kg`); render(); },
  measure: () => sheetMeasure(),
  saveMeasure: () => { const m = { d: today() }; let n = 0; for (const f of SH.fields) { const v = val('m-' + f); if (v && v > 10 && v < 250) { m[f] = v; n++; } } if (!n) return toast('Renseigne au moins une mesure'); S.measures = S.measures.filter(x => x.d !== today()); S.measures.push(m); invalidate(); save(); closeSheet(); haptic(); toast('Mensurations enregistrées'); render(); },
  tests: () => sheetTests(),
  saveTests: () => { let n = 0; for (const t of TESTS) { const v = val('t-' + t.k); if (v != null && v > 0) { S.tests.push({ d: today(), k: t.k, v }); n++; } } if (!n) return toast('Aucun résultat saisi'); invalidate(); save(); closeSheet(); confetti(60); toast(`${n} test${n > 1 ? 's' : ''} enregistré${n > 1 ? 's' : ''}`); render(); },
  slots: () => sheetSlots(),
  saveSlots: () => { for (let i = 0; i < 7; i++) { const v = $('#sl-' + i).value; if (v) S.slots[i] = v; else delete S.slots[i]; } save(); closeSheet(); toast('Créneaux enregistrés'); render(); },
  profile: () => sheetProfile(),
  pSex: el => { SH.sex = el.dataset.v; $$('.seg button', el.parentNode).forEach(b => b.classList.toggle('on', b === el)); },
  saveProfile: () => {
    const p = S.profile, age = val('p-age'), hgt = val('p-h');
    if (!age || age < 14 || age > 90 || !hgt || hgt < 130 || hgt > 230) return toast('Vérifie l’âge et la taille');
    const st = $('#p-start').value, mma = $('#p-mma').value; if (!st || !mma) return toast('Choisis les deux dates');
    Object.assign(p, { name: $('#p-name').value.trim().slice(0, 24), sex: SH.sex, age, height: hgt, act: +$('#p-act').value, mode: $('#p-mode').value, start: mondayOf(st), mma });
    S.ui.week = null; invalidate(); save(); closeSheet(); toast('Profil mis à jour'); render();
  },
  adapt: el => { S.kcalAdj = (S.kcalAdj || 0) + (+el.dataset.v); S.adjDate = today(); invalidate(); save(); haptic(); toast(`Nouvelle cible : ${fmt(targets().kcal)} kcal`); render(); },
  adaptLater: () => { S.adjDate = today(); save(); render(); },
  resetAdj: () => { S.kcalAdj = 0; S.adjDate = null; save(); render(); },

  /* Séance */
  ck: el => toggleSet(+el.dataset.i, +el.dataset.j),
  cues: el => { $(`#cues-${el.dataset.i}`).classList.toggle('hide'); },
  addSet: el => { const it = S.active.items[+el.dataset.i], l = it.sets[it.sets.length - 1]; it.sets.push({ w: l ? l.w : '', r: '', ph: l ? (l.r || l.ph) : String(it.lo), done: false }); save(); refreshExc(+el.dataset.i); },
  delSet: el => { const it = S.active.items[+el.dataset.i]; if (it.sets.length > 1) { it.sets.pop(); save(); refreshExc(+el.dataset.i); } },
  swapEx: el => openLibrary(+el.dataset.i),
  addEx: () => openLibrary(-1),
  pickEx: el => {
    const k = el.dataset.v, i = +el.dataset.i; closeSheet();
    if (i === -1) { S.active.items.push(mkItem([k, 3, 8, 12, 2, 90])); save(); openWorkout(); setTimeout(() => { const c = $(`#exc-${S.active.items.length - 1}`); if (c) c.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 300); return; }
    const old = S.active.items[i], it = mkItem([k, old.sets.length, old.lo, old.hi, old.rir, old.rest]);
    S.active.items[i] = it; save(); refreshExc(i); toast(`Remplacé par ${EX[k].n}`);
  },
  woMenu: () => openSheet(`<h2 class="h2">Séance</h2><button class="li" data-a="timer" data-v="mma5">${ic('timer')}<span class="grow ttl">Chrono intervalles</span></button><button class="li" data-a="library">${ic('plus')}<span class="grow ttl">Ajouter un exercice</span></button><button class="li" data-a="abandon">${ic('trash', 'pro')}<span class="grow ttl pro">Abandonner la séance</span></button>`),
  abandon: () => { closeSheet(); setTimeout(() => confirmSheet('Abandonner la séance ? Les séries validées seront perdues.', 'Abandonner', () => { S.active = null; save(); hideRest(); releaseWake(); closeOv(); }, true), 250); },
  finish: () => finishWorkout(),
  restAdd: el => { REST.end += (+el.dataset.v) * 1000; REST.total = Math.max(REST.total, (REST.end - Date.now()) / 1000); REST.fired = false; const r = $('#rest'); if (r) r.classList.remove('end'); restTick(); },
  restSkip: () => hideRest(),
  cardioDone: el => sheetCardio(+el.dataset.w, +el.dataset.d),
  rpe: el => { SH.rpe = +el.dataset.v; $$('[data-a="rpe"]').forEach(b => b.classList.toggle('on', b === el)); },
  saveCardio: () => {
    const { w, d, rpe, unit } = SH, pl = planFor(w, d), dkk = dateFor(w, d), date = dkk <= today() ? dkk : today();
    const min = val('cd-min') || pl.day.dur, dist = val('cd-dist');
    const before = computeXP();
    S.workouts.push({ id: uid(), date, week: w, dow: d, kind: pl.day.k, title: pl.day.t, sub: pl.day.sub, dur: Math.round(min), cardio: { min: Math.round(min), dist: dist || 0, unit, rpe } });
    invalidate(); save(); closeSheet(); closeOv(); confetti(70); haptic(2); toast(`${pl.day.t} : c\u2019est fait, bravo`);
  },
  undoDone: el => confirmSheet('Annuler la validation de cette séance ?', 'Annuler la validation', () => { S.workouts = S.workouts.filter(w => w.id !== el.dataset.v); invalidate(); save(); closeOv(); }, true),
  history: el => openHistory(el.dataset.v),
  delWorkout: el => confirmSheet('Supprimer définitivement cette séance ?', 'Supprimer', () => { S.workouts = S.workouts.filter(w => w.id !== el.dataset.v); invalidate(); save(); closeOv(); toast('Séance supprimée'); }, true),
  library: () => { closeSheet(); if (OV === 'workout') { openLibrary(-1); return; } openLibrary(); },

  /* Chrono */
  timer: el => { closeSheet(); openTimer(el.dataset.v || 'mma5'); },
  timerPreset: el => openTimer(el.dataset.v),
  timerGo: () => tmGo(),
  timerPause: () => { if (!TM) return; if (TM.paused) { TM.paused = false; TM.endAt = Date.now() + TM.pauseLeft; } else { TM.paused = true; TM.pauseLeft = TM.endAt - Date.now(); } haptic(); renderTimer(); },
  timerReset: () => { if (TM) { clearInterval(TM.iv); openTimer(TM.key); } },
  timerSkip: () => { if (TM) tmNext(); },
  timerClose: () => closeTimer(),

  /* Nutrition */
  foodDay: el => { const k = addDays(dk(), +el.dataset.v); if (k > today()) return; S.ui.foodDate = k === today() ? null : k; render(); },
  foodAdd: el => openFoodAdd(el.dataset.v),
  ftab: el => { SH.tab = el.dataset.v; SH.q = ''; renderFoodSheet(); },
  pickFood: el => pickFood(el.dataset.v),
  fgSet: el => { SH.g = +el.dataset.v; const i = $('#fg'); if (i) i.value = String(SH.g); updFoodPrev(); haptic(); },
  fmeal: el => { SH.meal = el.dataset.v; $$('[data-a="fmeal"]').forEach(b => b.classList.toggle('on', b === el)); },
  entry: el => { const i = +el.dataset.v, e = (S.food[dk()] || [])[i]; if (!e) return; if (e.q) sheetQuick(i); else { SH = { meal: e.m, date: dk() }; pickFood(e.f, e.g, i); } },
  delEntry: el => { const k = dk(); S.food[k].splice(+el.dataset.v, 1); invalidate(); save(); closeSheet(); toast('Supprimé'); render(); },
  quickAdd: () => sheetQuick(),
  saveQuick: () => {
    const n = ($('#q-n').value || '').trim() || 'Ajout rapide', kcal = val('q-k'); if (!kcal || kcal <= 0) return toast('Indique les calories');
    const q = { n, kcal, p: val('q-p') || 0, c: val('q-c') || 0, f: val('q-f') || 0 }, k = dk();
    S.food[k] = S.food[k] || [];
    if (SH.edit != null) S.food[k][SH.edit].q = q; else S.food[k].push({ id: uid(), m: SH.meal || 'l', q });
    invalidate(); save(); closeSheet(); haptic(); toast('Ajouté'); render();
  },
  newFood: () => sheetNewFood(),
  myFoods: () => sheetMyFoods(),
  editFood: el => sheetNewFood(el.dataset.v),
  saveNewFood: () => {
    const n = ($('#nf-n').value || '').trim(), kcal = val('nf-k'); if (!n || kcal == null) return toast('Nom et calories obligatoires');
    const pn = ($('#nf-pn').value || '').trim(), pg = val('nf-pg');
    const f = { n, kcal, p: val('nf-p') || 0, c: val('nf-c') || 0, f: val('nf-f') || 0, fib: 0, por: pn && pg ? [pn, pg] : null };
    if (SH.edit) Object.assign(S.customFoods.find(x => x.id === SH.edit), f); else { f.id = 'c_' + uid(); S.customFoods.push(f); }
    save(); const meal = SH.meal, id = f.id; toast('Aliment enregistré');
    if (!SH.edit && meal) { SH = { meal }; pickFood(id); } else { closeSheet(); render(); }
  },
  delFood: el => { S.customFoods = S.customFoods.filter(f => f.id !== el.dataset.v); save(); closeSheet(); toast('Aliment supprimé'); },
  plan: el => openPlan(el.dataset.v),
  planMeal: el => addPlanMeal(el.dataset.v, +el.dataset.i),
  planAll: el => { const pl = PLANS.find(p => p.id === el.dataset.v); pl.meals.forEach((_, i) => addPlanMeal(pl.id, i, true)); haptic(2); toast('Journée ajoutée au journal'); closeOv(); },

  /* Progrès */
  compare: () => openCompare(),
  photo: el => openPhoto(el.dataset.v),
  delPhoto: el => { const id = el.dataset.v; IDB.del(id).catch(() => {}); S.photos = S.photos.filter(p => p.id !== id); invalidate(); save(); closeSheet(); render(); },

  /* Données */
  export: () => exportData(),
  reset: () => confirmSheet('Tout effacer ? Séances, repas, pesées et photos seront supprimés.', 'Tout effacer', () => { localStorage.removeItem(LS); try { indexedDB.deleteDatabase('fauve'); } catch (e) { /* ignore */ } location.reload(); }, true),

  theme: el => { S.settings.theme = el.dataset.v; save(); applyTheme(); haptic(); render(); },

  /* Onboarding */
  onbNext: () => onbNext(),
  onbBack: () => { ONB.step = Math.max(0, ONB.step - 1); renderOnboarding(); },
  onbSex: el => { ONB.d.sex = el.dataset.v; $$('[data-a="onbSex"]').forEach(b => b.classList.toggle('on', b === el)); },
  onbAct: el => { ONB.d.act = +el.dataset.v; haptic(); renderOnboarding(); },
  onbGo: () => onbFinish()
};
A.addFood = () => {
  const g = SH.g; if (!g || g <= 0 || g > 3000) return toast('Quantité invalide');
  const k = dk(), f = foodById(SH.id); S.food[k] = S.food[k] || [];
  if (SH.edit != null) Object.assign(S.food[k][SH.edit], { g, m: SH.meal });
  else S.food[k].push({ id: uid(), m: SH.meal, f: SH.id, g });
  invalidate(); save(); closeSheet(); haptic(); toast(`${f.n} · ${fmt(f.kcal * g / 100)} kcal`); render();
};

/* Saisies */
const IN = {
  set: el => {
    const A2 = S.active; if (!A2) return; const i = +el.dataset.i, j = +el.dataset.j, f = el.dataset.f, it = A2.items[i];
    it.sets[j][f] = el.value.replace(',', '.').trim();
    if (f === 'w') for (let jj = j + 1; jj < it.sets.length; jj++) if (!it.sets[jj].done) { it.sets[jj].w = it.sets[j].w; const inp = $(`#set-${i}-${jj} [data-f="w"]`); if (inp) inp.value = it.sets[j].w; }
    save();
  },
  woNotes: el => { if (S.active) { S.active.notes = el.value; save(); } },
  woCardio: el => { if (S.active) { S.active.cardio[el.dataset.f] = el.value; save(); } },
  fq: el => { if (!SH) return; SH.q = el.value; const r = $('#fres'); if (r) r.innerHTML = foodResults(); },
  fg: el => { if (!SH) return; SH.g = num(el.value) || 0; updFoodPrev(); },
  setting: el => { S.settings[el.dataset.v] = el.checked; save(); if (el.checked) haptic(); },
  photo: el => { const f = el.files && el.files[0]; el.value = ''; if (f) addPhoto(f); },
  import: el => { const f = el.files && el.files[0]; el.value = ''; if (f) importData(f); },
  onb: el => { ONB.d[el.dataset.f] = el.value; }
};

document.addEventListener('click', e => {
  const el = e.target.closest('[data-a]'); if (!el || el.disabled) return;
  const fn = A[el.dataset.a]; if (!fn) return;
  if (el.tagName === 'A') e.preventDefault();
  audio(); fn(el, e);
});
document.addEventListener('input', e => { const el = e.target, k = el.dataset && el.dataset.in; if (k && IN[k] && el.type !== 'file' && el.type !== 'checkbox') IN[k](el, e); });
document.addEventListener('change', e => { const el = e.target, k = el.dataset && el.dataset.in; if (k && IN[k] && (el.type === 'file' || el.type === 'checkbox')) IN[k](el, e); });
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target.matches('.set .inp')) { e.preventDefault(); const nx = $$('.set .inp'); const i = nx.indexOf(e.target); if (nx[i + 1]) nx[i + 1].focus(); else e.target.blur(); }
  if (e.key === 'Escape') { if (SH) closeSheet(); else if (TM) closeTimer(); }
});
document.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('article[data-a]')) { e.preventDefault(); e.target.click(); } });

/* Sauvegarde / restauration */
async function exportData() {
  const data = JSON.stringify({ app: 'fauve', v: 1, at: new Date().toISOString(), state: Object.assign({}, S, { active: null }) });
  const name = `fauve-sauvegarde-${today()}.json`;
  const file = new File([data], name, { type: 'application/json' });
  const done = () => { S.lastExport = today(); save(); render(); toast('Sauvegarde créée'); };
  try { if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: 'Sauvegarde Fauve' }); return done(); } } catch (e) { if (e && e.name === 'AbortError') return; }
  const a = document.createElement('a'); a.href = URL.createObjectURL(file); a.download = name; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500); done();
}
function importData(file) {
  const r = new FileReader();
  r.onload = () => {
    try {
      const o = JSON.parse(r.result); if (o.app !== 'fauve' || !o.state || !o.state.profile) throw new Error('format');
      confirmSheet(`Restaurer la sauvegarde du ${new Date(o.at).toLocaleDateString('fr-FR')} ? Les données actuelles seront remplacées.`, 'Restaurer', () => { S = Object.assign(DEF(), o.state, { active: null }); saveNow(); invalidate(); toast('Données restaurées'); render(); });
    } catch (e) { toast('Fichier de sauvegarde invalide'); }
  };
  r.readAsText(file);
}

/* ================= Onboarding ================= */
const ONB = { step: 0, d: { name: '', sex: 'm', age: '', height: '', weight: '', act: 1.55, start: nextMonday(today()), mma: addDays(nextMonday(today()), 126) } };
function renderOnboarding() {
  $('#tabbar').classList.add('away');
  const d = ONB.d, s = ONB.step;
  const steps = `<div class="onb-steps">${[1, 2, 3].map(i => `<i class="${s >= i ? 'on' : ''}"></i>`).join('')}</div>`;
  let h = '';
  if (s === 0) {
    h = `<div class="onb"><div class="onb-hero"><img class="onb-icon" src="apple-touch-icon.png" alt=""><div class="onb-word">Fauve</div>
      <h1 class="h2" style="font-size:26px;margin-top:14px;max-width:18ch;font-weight:600">Ton coach muscu et nutrition, dans ta poche.</h1>
      <p class="sub" style="margin-top:12px;max-width:34ch">Un programme de 18 semaines : salle, plein air, piscine et course. Tes repas sont calculés pour toi et tout s\u2019ajuste à tes progrès.</p></div>
      <button class="btn pri block" data-a="onbNext">Commencer</button><p class="small" style="text-align:center;margin-top:10px">Tes données restent sur ton téléphone.</p></div>`;
  } else if (s === 1) {
    h = `<div class="onb">${steps}<div class="over">Étape 1 sur 3</div><h1 class="h1" style="margin-bottom:20px">Qui es-tu ?</h1>
      <div class="field"><label class="lbl" for="o-name">Prénom</label><input id="o-name" class="inp" data-in="onb" data-f="name" value="${esc(d.name)}" autocomplete="given-name" placeholder="Facultatif"></div>
      <div class="field"><span class="lbl">Sexe (pour le calcul des calories)</span><div class="seg"><button class="${d.sex === 'm' ? 'on' : ''}" data-a="onbSex" data-v="m">Homme</button><button class="${d.sex === 'f' ? 'on' : ''}" data-a="onbSex" data-v="f">Femme</button></div></div>
      <div class="grid3" style="margin-top:14px">${[['age', 'Âge', 'ans', 'numeric'], ['height', 'Taille', 'cm', 'numeric'], ['weight', 'Poids', 'kg', 'decimal']].map(([f, l, u, m]) => `<div class="field" style="margin-top:0"><label class="lbl" for="o-${f}">${l}</label><div class="inp-u"><input id="o-${f}" class="inp num" inputmode="${m}" data-in="onb" data-f="${f}" value="${esc(d[f])}" style="padding-right:38px"><span>${u}</span></div></div>`).join('')}</div>
      <div style="flex:1"></div><div class="row" style="margin-top:24px"><button class="btn ghost" data-a="onbBack">${ic('back')}</button><button class="btn pri grow" data-a="onbNext">Continuer</button></div></div>`;
  } else if (s === 2) {
    h = `<div class="onb">${steps}<div class="over">Étape 2 sur 3</div><h1 class="h1" style="margin-bottom:8px">Ton quotidien</h1><p class="sub" style="margin-bottom:16px">En dehors du sport, tes journées ressemblent à :</p>
      ${ACT.map(a => `<button class="card row ${d.act === a.v ? 'on' : ''}" style="width:100%;text-align:left;margin:0 0 10px;padding:14px 16px;${d.act === a.v ? 'border-color:var(--acc2);box-shadow:0 0 0 1px var(--acc2)' : ''}" data-a="onbAct" data-v="${a.v}"><span class="grow"><span style="display:block;font-weight:700">${a.n}</span><span class="small">${a.d}</span></span></button>`).join('')}
      <div class="grid2" style="margin-top:8px"><div class="field"><label class="lbl" for="o-start">Début du programme</label><input id="o-start" type="date" class="inp" data-in="onb" data-f="start" value="${d.start}"></div><div class="field" style="margin-top:14px"><label class="lbl" for="o-mma">Premier cours de MMA</label><input id="o-mma" type="date" class="inp" data-in="onb" data-f="mma" value="${d.mma}"></div></div>
      <p class="small" style="margin-top:8px">Le programme démarre toujours un lundi. 18 semaines = 4 mois et demi.</p>
      <div style="flex:1"></div><div class="row" style="margin-top:24px"><button class="btn ghost" data-a="onbBack">${ic('back')}</button><button class="btn pri grow" data-a="onbNext">Voir mon plan</button></div></div>`;
  } else {
    const prof = onbProfile(); S.profile = prof; const t = targets(prof.start); S.profile = null;
    h = `<div class="onb">${steps}<div class="over">Étape 3 sur 3</div><h1 class="h1" style="margin-bottom:14px">Ton plan${prof.name ? `, ${esc(prof.name)}` : ''}</h1>
      <div class="card"><div class="lbl">Calories par jour</div><div class="big num">${fmt(t.kcal)}</div><div class="grid3" style="margin-top:12px">${[['Protéines', t.prot], ['Glucides', t.carb], ['Lipides', t.fat]].map(([l, v]) => `<div><div class="lbl">${l}</div><div class="mid num">${v}<span class="small"> g</span></div></div>`).join('')}</div>
      <p class="small" style="margin:12px 0 0">Dépense estimée ${fmt(t.tdee)} kcal, déficit de ${fmt(t.deficit)} kcal : environ −${fmt(prof.weight * t.rate / 100, 2)} kg par semaine pour sécher sans perdre de muscle. L’appli réajuste selon ta courbe.</p></div>
      <div class="card tight" style="margin-top:12px">${PHASES.map(p => `<div class="li"><span class="kico gym" style="font:700 17px var(--display)">${p.id}</span><span class="grow"><span class="ttl">${esc(p.name)} <span class="small">· ${p.to === 999 ? `dès le ${fdate(addDays(prof.start, (p.from - 1) * 7))}` : `${fdate(addDays(prof.start, (p.from - 1) * 7))} → ${fdate(addDays(prof.start, p.to * 7 - 1))}`}</span></span><span class="meta">${esc(p.goal)}</span></span></div>`).join('')}</div>
      <div class="row" style="margin-top:24px"><button class="btn ghost" data-a="onbBack">${ic('back')}</button><button class="btn pri grow" data-a="onbGo">C’est parti</button></div></div>`;
  }
  $('#view').innerHTML = h; $('#view').style.padding = '0';
  if (s === 0) { const sl = $('.slash'); if (sl) $$('path', sl).forEach(p => { p.style.animationDelay = p.style.animationDelay; }); }
}
function onbProfile() {
  const d = ONB.d;
  return { name: (d.name || '').trim().slice(0, 24), sex: d.sex, age: num(d.age), height: num(d.height), weight: num(d.weight), act: d.act, start: mondayOf(d.start || nextMonday(today())), mma: d.mma, mode: 'auto' };
}
function onbNext() {
  if (ONB.step === 1) {
    const p = onbProfile();
    if (!p.age || p.age < 14 || p.age > 90) return toast('Indique ton âge');
    if (!p.height || p.height < 130 || p.height > 230) return toast('Indique ta taille en cm');
    if (!p.weight || p.weight < 35 || p.weight > 250) return toast('Indique ton poids en kg');
  }
  if (ONB.step === 2 && (!ONB.d.start || !ONB.d.mma)) return toast('Choisis les deux dates');
  ONB.step++; haptic(); renderOnboarding(); scrollTo(0, 0);
}
function onbFinish() {
  const p = onbProfile(); if (p.age < 18) p.mode = 'maint';
  S.profile = p; S.created = today();
  S.weights = [{ d: today(), kg: p.weight }];
  save(); saveNow();
  $('#view').style.padding = '';
  confetti(); haptic(2); S.ui.tab = 'today'; render(); scrollTo(0, 0);
  setTimeout(() => toast(p.age < 18 ? 'Moins de 18 ans : objectif maintien, pas de régime' : 'Bienvenue, on commence en douceur'), 400);
}

/* ================= Démarrage ================= */
function registerSW() {
  if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
  navigator.serviceWorker.register('sw.js').then(reg => {
    const prompt = w => { if (!navigator.serviceWorker.controller) return; const t = $('#toast'); t.innerHTML = 'Nouvelle version · <u>mettre à jour</u>'; t.style.pointerEvents = 'auto'; t.classList.add('show'); t.onclick = () => { w.postMessage('skip'); t.classList.remove('show'); }; };
    if (reg.waiting) prompt(reg.waiting);
    reg.addEventListener('updatefound', () => { const nw = reg.installing; if (nw) nw.addEventListener('statechange', () => { if (nw.state === 'installed') prompt(nw); }); });
    setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000);
  }).catch(() => {});
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (reloading) return; reloading = true; saveNow(); location.reload(); });
}
let lastDay = today();
function keyboardFix() {
  const vv = window.visualViewport; if (!vv) return;
  const upd = () => { const kb = Math.max(0, innerHeight - vv.height - vv.offsetTop); document.documentElement.style.setProperty('--kb', (kb > 60 ? kb : 0) + 'px'); };
  vv.addEventListener('resize', upd); vv.addEventListener('scroll', upd);
}
function boot() {
  applyTheme(); keyboardFix();
  document.addEventListener('touchstart', () => audio(), { once: true, passive: true });
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  if (!S.profile) renderOnboarding();
  else { render(); if (S.active) requestWake(); }
  watchCharts();
  registerSW();
  setInterval(() => { const k = today(); if (k !== lastDay) { lastDay = k; if (S.profile && !OV && !SH) render(); } }, 30000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { if (S.active || (TM && TM.phase !== 'idle' && TM.phase !== 'done')) requestWake(); const k = today(); if (k !== lastDay) { lastDay = k; if (S.profile && !OV && !SH) render(); } } });
}
boot();

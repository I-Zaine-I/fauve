/* FAUVE — données : exercices, programme, aliments, plans repas, guide.
   Valeurs nutritionnelles pour 100 g (glucides hors fibres, style étiquette UE),
   d'après CIQUAL / USDA, arrondies. */
'use strict';

const MUSCLES = {
  chest: 'Pectoraux', back: 'Dos', delts: 'Épaules (côté)', fdelt: 'Épaules (avant)',
  rdelt: 'Arrière d’épaule', bi: 'Biceps', tri: 'Triceps', quad: 'Quadriceps',
  ham: 'Ischios', glute: 'Fessiers', calf: 'Mollets', abs: 'Abdos', neck: 'Cou'
};
/* Muscles suivis dans le graphique de volume (cible 10–20 séries / semaine) */
const VOLUME_MUSCLES = ['chest', 'back', 'delts', 'rdelt', 'bi', 'tri', 'quad', 'ham', 'glute'];

const EX = {
  bench: { n: 'Développé couché', eq: 'Barre', m: { chest: 1, tri: .5, fdelt: .5 }, inc: 2.5,
    cues: ['Omoplates serrées et basses, pieds ancrés au sol', 'Barre au bas des pectoraux, coudes à ~45°', 'Pousse en arc vers le rack, sans décoller les fesses'], alt: ['db_bench', 'machine_press'] },
  db_bench: { n: 'Développé couché haltères', eq: 'Haltères', m: { chest: 1, tri: .5, fdelt: .5 }, inc: 2,
    cues: ['Haltères à hauteur de poitrine, poignets droits', 'Descends jusqu’à un bon étirement', 'Rapproche les haltères en haut sans les cogner'], alt: ['bench', 'machine_press'] },
  machine_press: { n: 'Presse pectorale machine', eq: 'Machine', m: { chest: 1, tri: .5, fdelt: .5 }, inc: 5,
    cues: ['Poignées à hauteur du milieu des pecs', 'Omoplates collées au dossier', 'Contrôle 2 s à la descente'], alt: ['bench', 'db_bench'] },
  incline_db: { n: 'Développé incliné haltères', eq: 'Haltères', m: { chest: 1, fdelt: .5, tri: .5 }, inc: 2,
    cues: ['Banc à 30° maximum : c’est le haut des pecs qui bosse', 'Avant-bras verticaux pendant tout le mouvement', 'Descends jusqu’à l’étirement, remonte en serrant'], alt: ['incline_bench', 'machine_press'] },
  incline_bench: { n: 'Développé incliné barre', eq: 'Barre', m: { chest: 1, fdelt: .5, tri: .5 }, inc: 2.5,
    cues: ['Banc à 30°', 'Barre en haut des pectoraux', 'Coudes légèrement rentrés'], alt: ['incline_db'] },
  ohp: { n: 'Développé militaire debout', eq: 'Barre', m: { fdelt: 1, delts: .5, tri: .5 }, inc: 2.5,
    cues: ['Fessiers et abdos contractés, aucune cambrure', 'Trajectoire droite : la tête passe sous la barre', 'Verrouille bras tendus au-dessus de la nuque'], alt: ['db_ohp'] },
  db_ohp: { n: 'Développé épaules haltères', eq: 'Haltères', m: { fdelt: 1, delts: .5, tri: .5 }, inc: 2,
    cues: ['Assis, dos calé contre le dossier', 'Haltères à hauteur d’oreilles en bas', 'Pousse sans verrouiller brutalement'], alt: ['ohp'] },
  pullup: { n: 'Tractions pronation', eq: 'Barre fixe', bw: true, m: { back: 1, bi: .5, rdelt: .5 }, inc: 2.5,
    cues: ['Départ bras tendus, épaules engagées (pas pendu « mou »)', 'Tire les coudes vers les hanches', 'Menton au-dessus de la barre, zéro élan. Ajoute du lest quand tu dépasses la fourchette'], alt: ['lat_pulldown', 'chinup'] },
  chinup: { n: 'Tractions supination', eq: 'Barre fixe', bw: true, m: { back: 1, bi: 1 }, inc: 2.5,
    cues: ['Paumes vers toi, écart largeur d’épaules', 'Poitrine vers la barre', 'Descente lente et complète'], alt: ['pullup', 'lat_pulldown'] },
  lat_pulldown: { n: 'Tirage vertical', eq: 'Poulie', m: { back: 1, bi: .5 }, inc: 5,
    cues: ['Cuisses bien calées sous les boudins', 'Tire vers le haut de la poitrine, buste un peu en arrière', 'Laisse remonter jusqu’à l’étirement complet des dorsaux'], alt: ['pullup'] },
  row: { n: 'Rowing barre', eq: 'Barre', m: { back: 1, rdelt: .5, bi: .5 }, inc: 2.5,
    cues: ['Buste à ~45°, dos neutre et gainé', 'Tire la barre vers le nombril', 'Contrôle la descente, pas d’élan avec les hanches'], alt: ['cable_row', 'chest_row'] },
  cable_row: { n: 'Rowing poulie basse', eq: 'Poulie', m: { back: 1, rdelt: .5, bi: .5 }, inc: 5,
    cues: ['Buste droit, poitrine sortie', 'Coudes le long du corps vers l’arrière', 'Laisse les omoplates s’écarter en revenant'], alt: ['row', 'chest_row'] },
  chest_row: { n: 'Rowing appui pectoral', eq: 'Machine / banc', m: { back: 1, rdelt: .5, bi: .5 }, inc: 2.5,
    cues: ['Poitrine collée au support : zéro triche', 'Tire en serrant les omoplates', 'Pause 1 s en haut'], alt: ['cable_row', 'row'] },
  lateral: { n: 'Élévations latérales', eq: 'Haltères', m: { delts: 1 }, inc: 1,
    cues: ['Buste légèrement penché vers l’avant', 'Monte en menant avec les coudes, jusqu’à l’horizontale', 'Descente lente (2–3 s) : c’est là que l’épaule s’élargit'], alt: ['cable_lateral'] },
  cable_lateral: { n: 'Élévations latérales poulie', eq: 'Poulie', m: { delts: 1 }, inc: 1.25,
    cues: ['Poulie basse, câble derrière le corps', 'Tension constante, même en bas', 'Monte jusqu’à l’horizontale, pas plus'], alt: ['lateral'] },
  face_pull: { n: 'Face pull', eq: 'Poulie + corde', m: { rdelt: 1, back: .5 }, inc: 2.5,
    cues: ['Corde à hauteur des yeux', 'Tire en écartant les mains, pouces vers l’arrière', 'Pause 1 s : épaules saines pour le MMA'], alt: ['rear_fly'] },
  rear_fly: { n: 'Oiseau haltères', eq: 'Haltères', m: { rdelt: 1 }, inc: 1,
    cues: ['Buste penché, dos plat', 'Bras presque tendus', 'Ouvre vers l’extérieur sans hausser les épaules'], alt: ['face_pull'] },
  cable_fly: { n: 'Écarté poulie vis-à-vis', eq: 'Poulie', m: { chest: 1 }, inc: 2.5,
    cues: ['Coudes légèrement fléchis et fixes', 'Grand étirement en arrière', 'Ramène les mains en « câlin », serre 1 s'], alt: ['pec_deck'] },
  pec_deck: { n: 'Pec deck', eq: 'Machine', m: { chest: 1 }, inc: 5,
    cues: ['Coudes à hauteur d’épaules', 'Étire bien en ouvrant', 'Serre en fermant'], alt: ['cable_fly'] },
  ez_curl: { n: 'Curl barre EZ', eq: 'Barre EZ', m: { bi: 1 }, inc: 2.5,
    cues: ['Coudes collés au corps', 'Monte sans balancer le buste', 'Descends jusqu’à bras quasi tendus'], alt: ['db_curl'] },
  db_curl: { n: 'Curl haltères', eq: 'Haltères', m: { bi: 1 }, inc: 1,
    cues: ['Supination en montant (petit doigt vers le haut)', 'Coudes fixes', 'Descente contrôlée'], alt: ['ez_curl'] },
  incline_curl: { n: 'Curl incliné', eq: 'Haltères', m: { bi: 1 }, inc: 1,
    cues: ['Banc à 45–60°, bras pendants derrière le buste', 'Étirement maximal du biceps en bas', 'Monte sans avancer les coudes'], alt: ['db_curl'] },
  pushdown: { n: 'Extension triceps poulie', eq: 'Poulie', m: { tri: 1 }, inc: 2.5,
    cues: ['Coudes collés aux côtes', 'Tends complètement en bas', 'Remonte jusqu’à 90° environ'], alt: ['oh_ext'] },
  oh_ext: { n: 'Extension triceps nuque', eq: 'Poulie', m: { tri: 1 }, inc: 2.5,
    cues: ['Dos à la poulie, bras au-dessus de la tête', 'Le triceps s’étire en bas : c’est voulu', 'Coudes serrés et fixes'], alt: ['pushdown'] },
  squat: { n: 'Squat barre', eq: 'Barre', m: { quad: 1, glute: .5 }, inc: 5,
    cues: ['Grande inspiration et gainage avant chaque descente', 'Genoux dans l’axe des pieds', 'Descends au moins à la parallèle si ta mobilité le permet'], alt: ['hack_squat', 'goblet'] },
  hack_squat: { n: 'Hack squat', eq: 'Machine', m: { quad: 1, glute: .5 }, inc: 5,
    cues: ['Pieds largeur de hanches, milieu de plateforme', 'Descends profond', 'Pousse avec tout le pied'], alt: ['squat', 'leg_press'] },
  goblet: { n: 'Goblet squat', eq: 'Haltère', m: { quad: 1, glute: .5 }, inc: 2,
    cues: ['Haltère contre la poitrine', 'Coudes entre les genoux en bas', 'Buste droit'], alt: ['squat'] },
  rdl: { n: 'Soulevé de terre roumain', eq: 'Barre', m: { ham: 1, glute: .5 }, inc: 5,
    cues: ['Hanches vers l’arrière, genoux légèrement fléchis', 'Barre collée aux cuisses, dos plat', 'Descends jusqu’à sentir les ischios tirer'], alt: ['db_rdl'] },
  db_rdl: { n: 'SDT roumain haltères', eq: 'Haltères', m: { ham: 1, glute: .5 }, inc: 2,
    cues: ['Haltères devant les cuisses', 'Charnière de hanche', 'Dos neutre'], alt: ['rdl'] },
  bss: { n: 'Fentes bulgares', eq: 'Haltères', m: { quad: 1, glute: 1 }, inc: 2,
    cues: ['Pied arrière posé sur le banc', 'Buste un peu penché = plus de fessiers', 'Fais toutes les reps d’une jambe puis l’autre (reps par jambe)'], alt: ['lunge'] },
  lunge: { n: 'Fentes marchées', eq: 'Haltères', m: { quad: 1, glute: 1 }, inc: 2,
    cues: ['Grand pas', 'Genou arrière frôle le sol', 'Buste droit'], alt: ['bss'] },
  leg_curl: { n: 'Leg curl', eq: 'Machine', m: { ham: 1 }, inc: 2.5,
    cues: ['Assis de préférence (plus d’étirement)', 'Plie fort, pause 1 s', 'Remonte lentement'], alt: ['db_rdl'] },
  leg_press: { n: 'Presse à cuisses', eq: 'Machine', m: { quad: 1, glute: .5 }, inc: 10,
    cues: ['Bas du dos toujours collé au dossier', 'Descends le plus bas possible sans décoller le bassin', 'Ne verrouille pas les genoux en haut'], alt: ['hack_squat'] },
  leg_ext: { n: 'Leg extension', eq: 'Machine', m: { quad: 1 }, inc: 2.5,
    cues: ['Genou aligné avec l’axe de la machine', 'Contracte 1 s en haut', 'Descente lente'], alt: ['goblet'] },
  hip_thrust: { n: 'Hip thrust', eq: 'Barre', m: { glute: 1, ham: .5 }, inc: 5,
    cues: ['Haut du dos sur le banc, menton rentré', 'Pousse avec les talons', 'Bassin en rétroversion et pause 1 s en haut'], alt: ['glute_bridge'] },
  glute_bridge: { n: 'Pont fessier', eq: 'Poids du corps / barre', m: { glute: 1, ham: .5 }, inc: 5,
    cues: ['Talons proches des fesses', 'Serre les fessiers en haut', 'Pause 2 s'], alt: ['hip_thrust'] },
  trapbar: { n: 'Soulevé de terre', eq: 'Trap bar / barre', m: { glute: 1, ham: .5, quad: .5, back: .5 }, inc: 5,
    cues: ['Trap bar si dispo (plus sûr), sinon classique', 'Pousse le sol avec les jambes, poitrine fière', 'Dos neutre du début à la fin, verrouille avec les fessiers'], alt: ['rdl'] },
  calf: { n: 'Mollets debout', eq: 'Machine', m: { calf: 1 }, inc: 5,
    cues: ['Grande amplitude : talon bien bas', 'Pause 1 s en bas', 'Monte sur la pointe, serre'], alt: ['calf_seated'] },
  calf_seated: { n: 'Mollets assis', eq: 'Machine', m: { calf: 1 }, inc: 5,
    cues: ['Genoux à 90°', 'Amplitude complète', 'Tempo lent'], alt: ['calf'] },
  ab_wheel: { n: 'Roue abdominale', eq: 'Roue', bw: true, m: { abs: 1 }, inc: 0,
    cues: ['À genoux, dos rond « en coquille »', 'Va aussi loin que possible sans creuser le bas du dos', 'Reviens en contractant les abdos'], alt: ['plank', 'hang_leg_raise'] },
  plank: { n: 'Gainage planche', eq: 'Sol', bw: true, u: 's', m: { abs: 1 }, inc: 0,
    cues: ['Coudes sous les épaules', 'Serre fessiers et abdos', 'Corps parfaitement aligné'], alt: ['ab_wheel'] },
  hang_leg_raise: { n: 'Relevés de jambes suspendu', eq: 'Barre fixe', bw: true, m: { abs: 1 }, inc: 0,
    cues: ['Pas de balancier', 'Enroule le bassin en montant', 'Genoux fléchis si trop dur'], alt: ['ab_wheel'] },
  neck: { n: 'Cou : flexion + extension', eq: 'Disque / élastique', m: { neck: 1 }, inc: 1.25,
    cues: ['Commence TRÈS léger (2,5–5 kg), serviette entre disque et tête', 'Allongé sur un banc : 1 série face au plafond, 1 série face au sol = 1 série', 'Amplitude contrôlée, jamais d’à-coups. Un cou fort encaisse mieux en MMA'], alt: [] },
  farmer: { n: 'Farmer’s walk', eq: 'Haltères lourds', u: 'm', m: { abs: .5 }, inc: 2,
    cues: ['Haltères lourds, épaules basses', 'Petits pas rapides, buste droit', 'Grip + gainage : indispensable pour le grappling'], alt: ['dead_hang'] },
  dead_hang: { n: 'Suspension barre', eq: 'Barre fixe', bw: true, u: 's', m: {}, inc: 0,
    cues: ['Bras tendus, épaules engagées', 'Serre la barre fort', 'Ajoute une serviette autour de la barre pour le grip kimono'], alt: ['farmer'] },
  dips: { n: 'Dips', eq: 'Barres parallèles', bw: true, m: { tri: 1, chest: .5 }, inc: 2.5,
    cues: ['Buste légèrement penché', 'Descends jusqu’à épaules au niveau des coudes', 'Remonte sans verrouiller brutalement'], alt: ['pushup'] },
  pushup: { n: 'Pompes', eq: 'Sol', bw: true, m: { chest: 1, tri: .5 }, inc: 0,
    cues: ['Corps gainé comme une planche', 'Poitrine frôle le sol', 'Trop facile ? Pieds surélevés ou tempo 3 s'], alt: ['dips'] },
  pike_pushup: { n: 'Pompes piquées', eq: 'Sol', bw: true, m: { fdelt: 1, tri: .5 }, inc: 0,
    cues: ['Hanches hautes, corps en V inversé', 'Tête vers le sol devant les mains', 'Pieds surélevés pour progresser'], alt: ['db_ohp'] },
  box_jump: { n: 'Sauts sur box', eq: 'Box / banc stable', bw: true, m: {}, inc: 0,
    cues: ['Qualité > quantité : chaque saut à fond', 'Réception silencieuse, genoux souples', 'Descends en marchant, ne saute pas en arrière'], alt: ['broad_jump'] },
  broad_jump: { n: 'Sauts en longueur', eq: 'Sol', bw: true, m: {}, inc: 0,
    cues: ['Bras en arrière puis lance-les', 'Explose des hanches', 'Réception stable, repos complet entre sauts'], alt: ['box_jump'] },
  mb_throw: { n: 'Lancers médecine-ball', eq: 'Médecine-ball 4–6 kg', m: {}, inc: 1,
    cues: ['Lancer poitrine contre un mur, le plus fort possible', 'Rattrape et relance tout de suite', 'Pas de ballon ? Fais des pompes explosives'], alt: ['plyo_pushup'] },
  plyo_pushup: { n: 'Pompes explosives', eq: 'Sol', bw: true, m: { chest: .5, tri: .5 }, inc: 0,
    cues: ['Pousse si fort que les mains décollent', 'Réception amortie', 'Repos complet entre séries'], alt: ['mb_throw'] },
  kb_swing: { n: 'Kettlebell swing', eq: 'Kettlebell', m: { glute: 1, ham: .5 }, inc: 4,
    cues: ['Charnière de hanche, pas un squat', 'Claque les hanches, la cloche flotte', 'Bras = cordes, c’est le bassin qui travaille'], alt: ['hip_thrust'] }
};

/* Jours : [clé exo, séries, reps min, reps max, RIR cible, repos (s)] */
function D(t, sub, k, dur, ex, b, extra) { return Object.assign({ t, sub, k, dur, ex: ex || [], b: b || [] }, extra || {}); }

const REST_DAY = D('Repos actif', 'Récupération', 'rest', 30, [], [
  'Marche : 8 000 à 10 000 pas',
  'Mobilité 15 min : hanches, chevilles, colonne thoracique',
  'Batch cooking : prépare tes protéines et féculents pour 3 jours',
  'Couche-toi à heure fixe : vise 8 h de sommeil'
]);

const PHASES = [
  {
    id: 1, name: 'Fondations', from: 1, to: 6, short: 'P1',
    goal: 'Apprendre les mouvements, poser une base d’endurance et lancer la sèche.',
    rate: 0.6,
    days: [
      D('Haut A', 'Force', 'gym', 70, [
        ['bench', 4, 5, 7, 2, 150], ['pullup', 4, 5, 8, 2, 150], ['ohp', 3, 6, 8, 2, 120],
        ['row', 3, 6, 8, 2, 120], ['lateral', 4, 12, 15, 1, 60], ['ez_curl', 2, 8, 10, 1, 75], ['pushdown', 2, 10, 12, 1, 75]]),
      D('Bas A', 'Force', 'gym', 65, [
        ['squat', 4, 5, 7, 2, 180], ['rdl', 3, 6, 8, 2, 150], ['bss', 3, 8, 10, 2, 90],
        ['leg_curl', 3, 10, 12, 1, 75], ['calf', 3, 10, 15, 1, 60], ['ab_wheel', 3, 8, 12, 2, 60]]),
      D('Piscine', 'Endurance zone 2', 'swim', 40, [], [
        'Échauffement : 200 m souple, nage au choix',
        'Technique : 8 × 50 m crawl, récup 30 s. Allonge-toi, expire sous l’eau',
        'Bloc continu : 600 à 1 000 m en aisance (tu pourrais parler)',
        'Retour au calme : 100 m dos ou brasse']),
      D('Haut B', 'Volume · V-taper', 'gym', 70, [
        ['incline_db', 4, 8, 12, 1, 120], ['lat_pulldown', 3, 10, 12, 1, 90], ['cable_row', 3, 10, 12, 1, 90],
        ['cable_fly', 2, 12, 15, 1, 60], ['cable_lateral', 4, 12, 20, 1, 60], ['face_pull', 3, 15, 20, 1, 60],
        ['incline_curl', 3, 10, 12, 1, 60], ['oh_ext', 3, 10, 12, 1, 60]]),
      D('Bas B', 'Volume · Cou · Grip', 'gym', 65, [
        ['trapbar', 3, 4, 6, 2, 180], ['leg_press', 3, 10, 15, 1, 120], ['hip_thrust', 3, 8, 12, 1, 90],
        ['leg_ext', 2, 12, 15, 1, 60], ['calf_seated', 3, 12, 20, 1, 60], ['neck', 2, 15, 20, 3, 60], ['farmer', 3, 30, 40, 2, 90]]),
      D('Cage', 'Street workout · Course Z2', 'cage', 75, [
        ['pullup', 3, 6, 12, 1, 120], ['dips', 3, 8, 12, 1, 90], ['pushup', 2, 12, 20, 2, 60], ['hang_leg_raise', 3, 8, 12, 1, 60]], [
        'Après la cage : course zone 2, 30 à 40 min',
        'Allure : tu dois pouvoir parler en phrases complètes',
        'Fréquence cardiaque cible : voir Moi › Zones']),
      REST_DAY
    ]
  },
  {
    id: 2, name: 'Forge', from: 7, to: 12, short: 'P2',
    goal: 'Charges plus lourdes, plus de volume sur épaules et bras, fractionné.',
    rate: 0.6,
    days: [
      D('Haut A', 'Force lourde', 'gym', 75, [
        ['bench', 4, 4, 6, 2, 180], ['pullup', 4, 4, 6, 2, 150], ['ohp', 3, 5, 7, 2, 150],
        ['row', 3, 6, 8, 1, 120], ['lateral', 4, 12, 15, 1, 60], ['ez_curl', 3, 8, 10, 1, 60], ['pushdown', 3, 10, 12, 1, 60]]),
      D('Bas A', 'Force lourde', 'gym', 70, [
        ['squat', 4, 4, 6, 2, 180], ['rdl', 3, 6, 8, 1, 150], ['bss', 3, 8, 10, 1, 90],
        ['leg_curl', 3, 8, 12, 1, 75], ['calf', 4, 10, 15, 1, 60], ['ab_wheel', 3, 10, 15, 1, 60]]),
      D('Piscine', 'Intervalles', 'swim', 45, [], [
        'Échauffement : 300 m progressif',
        '10 × 50 m rapide (8/10 d’effort), récup 30 s',
        '4 × 100 m allure soutenue, récup 20 s',
        'Retour au calme : 200 m souple']),
      D('Haut B', 'Volume · V-taper+', 'gym', 75, [
        ['incline_db', 4, 8, 12, 1, 120], ['lat_pulldown', 4, 8, 12, 1, 90], ['chest_row', 3, 10, 12, 1, 90],
        ['cable_fly', 3, 12, 15, 1, 60], ['cable_lateral', 5, 12, 20, 1, 60], ['face_pull', 3, 15, 20, 1, 60],
        ['incline_curl', 3, 10, 12, 1, 60], ['oh_ext', 3, 10, 12, 1, 60]]),
      D('Bas B', 'Volume · Cou · Grip', 'gym', 70, [
        ['trapbar', 4, 3, 5, 2, 180], ['leg_press', 3, 10, 15, 1, 120], ['hip_thrust', 3, 8, 12, 1, 90],
        ['leg_ext', 3, 12, 15, 1, 60], ['calf_seated', 3, 12, 20, 1, 60], ['neck', 3, 15, 20, 2, 60], ['farmer', 4, 30, 40, 2, 90]]),
      D('Cage', 'Street workout · Fractionné', 'cage', 70, [
        ['pullup', 4, 6, 15, 1, 120], ['dips', 4, 8, 15, 1, 90], ['pike_pushup', 3, 8, 12, 1, 75], ['hang_leg_raise', 3, 10, 15, 1, 60]], [
        'Course fractionnée : 10 min de trot pour t’échauffer',
        '6 × 400 m rapide (allure 5 km), récup 90 s en marchant',
        '5 min de retour au calme']),
      REST_DAY
    ]
  },
  {
    id: 3, name: 'Arme', from: 13, to: 18, short: 'P3',
    goal: 'Puissance, explosivité et cardio de combat. Tu arrives prêt pour la cage.',
    rate: 0.4,
    days: [
      D('Haut A', 'Force · Puissance', 'gym', 70, [
        ['mb_throw', 4, 5, 5, 3, 90], ['bench', 4, 3, 5, 2, 180], ['pullup', 4, 4, 6, 2, 150], ['ohp', 3, 5, 7, 2, 120],
        ['row', 3, 6, 8, 1, 120], ['lateral', 3, 12, 15, 1, 60], ['ez_curl', 2, 8, 10, 1, 60], ['pushdown', 2, 10, 12, 1, 60]]),
      D('Bas A', 'Force · Explosivité', 'gym', 65, [
        ['box_jump', 4, 3, 3, 3, 90], ['squat', 4, 3, 5, 2, 180], ['rdl', 3, 5, 7, 2, 150],
        ['bss', 3, 6, 8, 2, 90], ['calf', 3, 10, 15, 1, 60], ['ab_wheel', 3, 10, 15, 1, 60]]),
      D('Piscine', 'Anaérobie', 'swim', 45, [], [
        'Échauffement : 300 m',
        '12 × 25 m sprint, récup 30 s',
        '6 × 100 m soutenu, récup 20 s',
        '200 m souple']),
      D('Haut B', 'Hypertrophie maintenue', 'gym', 65, [
        ['incline_db', 3, 8, 12, 1, 120], ['lat_pulldown', 3, 8, 12, 1, 90], ['cable_row', 3, 10, 12, 1, 90],
        ['cable_lateral', 4, 12, 20, 1, 60], ['face_pull', 3, 15, 20, 1, 60], ['incline_curl', 2, 10, 12, 1, 60], ['oh_ext', 2, 10, 12, 1, 60]]),
      D('Bas B', 'Puissance · Cou · Grip', 'gym', 65, [
        ['broad_jump', 3, 3, 3, 3, 90], ['trapbar', 3, 3, 5, 2, 180], ['kb_swing', 3, 12, 15, 2, 75], ['hip_thrust', 3, 8, 10, 1, 90],
        ['neck', 3, 15, 20, 2, 60], ['farmer', 3, 40, 40, 2, 90], ['dead_hang', 3, 30, 60, 2, 60]]),
      D('Cage', 'Fight conditioning', 'cage', 70, [
        ['pullup', 3, 6, 15, 1, 120], ['dips', 3, 8, 20, 1, 90]], [
        'Échauffement 8 min : corde à sauter ou jumping jacks + mobilité',
        '5 rounds × 5 min, récup 1 min (format MMA) avec le chrono Rounds :',
        '· 1 min de shadow boxing (jab, direct, crochet, déplacements)',
        '· 10 sprawls + 10 burpees',
        '· 1 min de marche de l’ours avant/arrière',
        '· 15 squats sautés + 20 mountain climbers',
        '· Fin du round : shadow boxing à haut rythme',
        'Finisher : 8 sprints de 15 s, récup 45 s'], { timer: 'mma5' }),
      REST_DAY
    ]
  },
  {
    id: 4, name: 'Cage', from: 19, to: 999, short: 'MMA',
    goal: 'Tu as commencé le MMA : 2 séances de force pour garder le muscle, le reste sur le tapis.',
    rate: 0,
    days: [
      D('Full body A', 'Force', 'gym', 60, [
        ['squat', 3, 4, 6, 2, 180], ['bench', 3, 4, 6, 2, 180], ['pullup', 3, 5, 8, 2, 150],
        ['rdl', 2, 6, 8, 2, 120], ['lateral', 3, 12, 15, 1, 60], ['neck', 2, 15, 20, 2, 60]]),
      D('MMA', 'Cours', 'mma', 90, [], ['Cours de MMA ou de grappling', 'Bois 0,5 à 1 L d’eau par heure de cours', 'Repas riche en glucides 2–3 h avant']),
      D('Full body B', 'Puissance', 'gym', 60, [
        ['box_jump', 3, 3, 3, 3, 90], ['trapbar', 3, 3, 5, 2, 180], ['incline_db', 3, 8, 10, 1, 120],
        ['row', 3, 8, 10, 1, 120], ['cable_lateral', 3, 12, 20, 1, 60], ['farmer', 3, 40, 40, 2, 90]]),
      D('MMA', 'Cours', 'mma', 90, [], ['Cours de MMA ou de grappling', 'Travaille ce que tu as raté la dernière fois']),
      D('Piscine', 'Récupération', 'swim', 30, [], ['30 min de nage facile, zone 2', 'Étirements doux après']),
      D('MMA', 'Sparring / open mat', 'mma', 90, [], ['Sparring léger ou open mat', 'Protège-dents et coquille obligatoires']),
      REST_DAY
    ]
  }
];

const DELOAD_WEEKS = [6, 12, 18];
const TEST_WEEKS = [1, 18];
const PROGRAM_WEEKS = 18;
const DOW = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const DOW_S = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

const TIMERS = {
  mma5: { n: 'MMA pro', rounds: 5, work: 300, rest: 60 },
  mma3: { n: 'MMA amateur', rounds: 3, work: 300, rest: 60 },
  box3: { n: 'Boxe', rounds: 3, work: 180, rest: 60 },
  r53: { n: 'Rounds courts', rounds: 5, work: 180, rest: 60 },
  tabata: { n: 'Tabata', rounds: 8, work: 20, rest: 10 }
};

const TESTS = [
  { k: 'pullups', n: 'Tractions max', u: 'reps', d: 'Une seule série, bras tendus en bas, menton au-dessus' },
  { k: 'pushups', n: 'Pompes max', u: 'reps', d: 'Une série, poitrine au sol, sans pause en haut' },
  { k: 'plank', n: 'Gainage max', u: 's', d: 'Planche sur les coudes, arrêt dès que le bassin tombe' },
  { k: 'cooper', n: 'Test de Cooper', u: 'm', d: 'Distance maximale courue en 12 minutes' }
];

/* ---------- Aliments (pour 100 g) : id, nom, kcal, prot, gluc, lip, fibres, [portion] ---------- */
const FOODS = [
  ['poulet', 'Blanc de poulet (cuit)', 165, 31, 0, 3.6, 0],
  ['dinde', 'Escalope de dinde (cuite)', 147, 30, 0, 2.1, 0],
  ['boeuf5', 'Steak haché 5 % (cru)', 130, 21, 0, 5, 0, ['1 steak', 125]],
  ['boeuf15', 'Steak haché 15 % (cru)', 215, 18.6, 0, 15, 0, ['1 steak', 125]],
  ['saumon', 'Saumon (cru)', 208, 20, 0, 13, 0, ['1 pavé', 125]],
  ['thon', 'Thon au naturel (égoutté)', 116, 26, 0, 0.8, 0, ['1 boîte', 140]],
  ['cabillaud', 'Cabillaud (cru)', 82, 18, 0, 0.7, 0],
  ['crevettes', 'Crevettes (cuites)', 99, 24, 0.2, 0.3, 0],
  ['oeuf', 'Œuf entier', 143, 12.6, 0.7, 9.5, 0, ['1 œuf', 55]],
  ['blanc_oeuf', 'Blancs d’œufs', 52, 10.9, 0.7, 0.2, 0],
  ['jambon', 'Jambon blanc découenné', 110, 21, 1, 2.5, 0, ['1 tranche', 40]],
  ['tofu', 'Tofu ferme', 144, 17.3, 1.6, 8.7, 1.2],
  ['skyr', 'Skyr nature', 62, 11, 4, 0.2, 0],
  ['fromage_blanc', 'Fromage blanc 0 %', 46, 7.5, 4, 0.2, 0],
  ['grec', 'Yaourt grec 2 %', 73, 10, 3.9, 2, 0],
  ['cottage', 'Cottage cheese', 98, 11, 3.4, 4.3, 0],
  ['whey', 'Whey protéine', 390, 78, 7, 6, 0, ['1 dose', 30]],
  ['lait', 'Lait demi-écrémé', 46, 3.3, 4.8, 1.6, 0, ['1 verre', 250]],
  ['emmental', 'Emmental râpé', 375, 28, 0.5, 29, 0],
  ['parmesan', 'Parmesan', 392, 35.8, 3.2, 25.8, 0],
  ['lentilles', 'Lentilles (cuites)', 125, 9.5, 17, 0.5, 7.5],
  ['pois_chiches', 'Pois chiches (cuits)', 147, 8.2, 20, 2.6, 5.6],
  ['haricots_rouges', 'Haricots rouges (cuits)', 113, 8.7, 15, 0.5, 7],
  ['riz', 'Riz blanc (cuit)', 130, 2.7, 28, 0.3, 0.4],
  ['riz_cru', 'Riz blanc (cru)', 360, 7, 79, 0.7, 1.3],
  ['pates', 'Pâtes (cuites)', 155, 5.8, 30, 0.9, 1.8],
  ['pates_crues', 'Pâtes (crues)', 360, 12.5, 71, 1.5, 3],
  ['quinoa', 'Quinoa (cuit)', 116, 4.4, 18.5, 1.9, 2.8],
  ['semoule', 'Semoule (cuite)', 112, 3.8, 22, 0.2, 1.4],
  ['pdt', 'Pommes de terre (cuites)', 85, 1.9, 18.3, 0.1, 1.8],
  ['patate_douce', 'Patate douce (cuite)', 86, 2, 17.4, 0.2, 3.3],
  ['avoine', 'Flocons d’avoine', 370, 13, 59, 7, 10],
  ['pain_complet', 'Pain complet', 240, 9.5, 44, 2, 7, ['1 tranche', 40]],
  ['baguette', 'Baguette', 270, 9, 55, 1.3, 2.7, ['1/4 baguette', 60]],
  ['tortilla', 'Tortilla de blé', 306, 8.2, 50, 8, 3.5, ['1 tortilla', 60]],
  ['galette_riz', 'Galettes de riz soufflé', 387, 8.2, 81.5, 2.8, 2, ['1 galette', 9]],
  ['muesli', 'Muesli sans sucre ajouté', 360, 10, 60, 6, 8],
  ['miel', 'Miel', 304, 0.3, 82, 0, 0, ['1 c. à café', 10]],
  ['banane', 'Banane', 90, 1.1, 20, 0.3, 2.6, ['1 banane', 120]],
  ['pomme', 'Pomme', 53, 0.3, 11.5, 0.2, 2.4, ['1 pomme', 150]],
  ['orange', 'Orange', 47, 0.9, 9.4, 0.1, 2.4, ['1 orange', 150]],
  ['fruits_rouges', 'Fruits rouges (surgelés)', 46, 1, 7, 0.4, 5],
  ['brocoli', 'Brocoli', 35, 2.8, 4, 0.4, 2.6],
  ['haricots_verts', 'Haricots verts', 32, 1.8, 4.3, 0.2, 3.2],
  ['courgette', 'Courgette', 18, 1.2, 2.1, 0.3, 1],
  ['epinards', 'Épinards', 24, 2.9, 1.4, 0.4, 2.2],
  ['tomate', 'Tomate', 19, 0.9, 2.9, 0.2, 1.2],
  ['salade', 'Salade verte', 15, 1.4, 1.5, 0.2, 1.3],
  ['legumes', 'Poêlée de légumes (surgelée)', 42, 2.5, 5.5, 0.5, 3],
  ['coulis', 'Coulis de tomate', 35, 1.5, 5.5, 0.3, 1.5],
  ['avocat', 'Avocat', 160, 2, 1.9, 14.7, 6.7, ['1/2 avocat', 70]],
  ['huile_olive', 'Huile d’olive', 884, 0, 0, 100, 0, ['1 c. à soupe', 10]],
  ['beurre_cacahuete', 'Beurre de cacahuète', 610, 26, 11, 50, 7, ['1 c. à soupe', 15]],
  ['amandes', 'Amandes', 595, 21, 9, 50, 12.5, ['1 poignée', 25]],
  ['noix', 'Noix', 690, 15, 7, 65, 6.7],
  ['chocolat_noir', 'Chocolat noir 85 %', 584, 12.5, 19, 46, 12, ['1 carré', 10]],
  ['sauce_soja', 'Sauce soja', 60, 8, 5, 0.1, 0.8]
].map(a => ({ id: a[0], n: a[1], kcal: a[2], p: a[3], c: a[4], f: a[5], fib: a[6], por: a[7] || null }));

const MEALS = [
  { k: 'b', n: 'Petit-déjeuner' },
  { k: 'l', n: 'Déjeuner' },
  { k: 's', n: 'Collation' },
  { k: 'd', n: 'Dîner' }
];

/* Journées types calibrées ~2 600 kcal · ~195 g prot. L'appli les met à l'échelle de ta cible. */
const PLANS = [
  { id: 'A', n: 'Journée A', tag: 'Classique', meals: [
    { m: 'b', n: 'Porridge protéiné', items: [['avoine', 80], ['lait', 300], ['whey', 30], ['banane', 120]], how: 'Cuis l’avoine dans le lait 3 min, ajoute la whey hors du feu, puis la banane en rondelles.' },
    { m: 'l', n: 'Poulet, riz, brocolis', items: [['poulet', 180], ['riz', 250], ['brocoli', 200], ['huile_olive', 10]], how: 'Le classique du batch cooking. Ajoute paprika, ail et sauce soja pour le goût.' },
    { m: 's', n: 'Bol skyr fruits rouges', items: [['skyr', 300], ['fruits_rouges', 100], ['miel', 15], ['amandes', 20], ['pomme', 150]], how: 'Idéal 1 à 2 h avant l’entraînement.' },
    { m: 'd', n: 'Saumon, patate douce, haricots', items: [['saumon', 150], ['patate_douce', 300], ['haricots_verts', 200], ['huile_olive', 5]], how: 'Patate douce au four 35 min à 200 °C, saumon 12 min au même four.' }
  ] },
  { id: 'B', n: 'Journée B', tag: 'Pâtes & wraps', meals: [
    { m: 'b', n: 'Omelette & pain complet', items: [['oeuf', 165], ['blanc_oeuf', 100], ['pain_complet', 80], ['orange', 150]], how: '3 œufs + blancs, une poignée d’épinards si tu en as.' },
    { m: 'l', n: 'Pâtes bolognaise maison', items: [['boeuf5', 200], ['pates', 250], ['coulis', 150], ['parmesan', 15], ['salade', 100]], how: 'Fais revenir le bœuf, ajoute le coulis, herbes de Provence, 10 min à feu doux.' },
    { m: 's', n: 'Shake banane-cacahuète', items: [['whey', 30], ['lait', 250], ['banane', 120], ['beurre_cacahuete', 15]], how: 'Mixe le tout avec des glaçons. Parfait après la séance.' },
    { m: 'd', n: 'Wraps poulet avocat', items: [['tortilla', 120], ['poulet', 150], ['avocat', 50], ['tomate', 100], ['salade', 50], ['fromage_blanc', 50], ['pomme', 150]], how: 'Fromage blanc + citron + ail = sauce légère.' }
  ] },
  { id: 'C', n: 'Journée C', tag: 'Chili & thon', meals: [
    { m: 'b', n: 'Bol skyr avoine', items: [['skyr', 300], ['avoine', 60], ['fruits_rouges', 100], ['miel', 10], ['noix', 15]], how: 'Prépare-le la veille : l’avoine gonfle dans le skyr (overnight oats).' },
    { m: 'l', n: 'Salade thon, riz, pois chiches', items: [['thon', 140], ['riz', 200], ['pois_chiches', 100], ['tomate', 150], ['huile_olive', 10]], how: 'Se transporte bien. Ajoute oignon rouge et citron.' },
    { m: 's', n: 'Fromage blanc, fruits, amandes', items: [['fromage_blanc', 250], ['banane', 120], ['orange', 150], ['amandes', 15]], how: 'Cannelle par-dessus.' },
    { m: 'd', n: 'Chili con carne', items: [['boeuf5', 180], ['haricots_rouges', 150], ['coulis', 150], ['riz', 200], ['emmental', 20], ['huile_olive', 10]], how: 'Oignon, cumin, paprika fumé, piment. Encore meilleur le lendemain.' }
  ] }
];

const RANKS = [
  [0, 'Recrue'], [600, 'Apprenti'], [1600, 'Combattant'], [3200, 'Guerrier'],
  [5500, 'Prédateur'], [8500, 'Fauve'], [12500, 'Bête'], [18000, 'Légende']
];

/* Guide : principes appuyés sur la littérature */
const GUIDE = [
  { t: 'Perdre du gras sans perdre de muscle', p: [
    'Vise une perte de 0,5 à 1 % de ton poids par semaine. Plus vite, tu perds davantage de muscle. FAUVE démarre à ~0,6 %/semaine puis ralentit en phase 3.',
    'Le poids fluctue chaque jour (eau, sel, glucides). L’appli lisse tes pesées en tendance : seule la tendance compte. Pèse-toi le matin, à jeun, après les toilettes.'],
    src: [['Helms et al. 2014, JISSN', 'https://pubmed.ncbi.nlm.nih.gov/24864135/']] },
  { t: 'Protéines : le non-négociable', p: [
    '1,4 à 2,0 g/kg suffisent pour la plupart des sportifs ; en déficit calorique, monter plus haut aide à garder le muscle. Ta cible : 2,2 g/kg pendant la sèche.',
    'Répartis-les sur 3 à 4 repas d’environ 0,4 g/kg (≈ 35–45 g), dont un avant et un après l’entraînement.'],
    src: [['ISSN 2017 : protéines et exercice', 'https://pubmed.ncbi.nlm.nih.gov/28642676/'], ['Helms et al. 2014', 'https://pubmed.ncbi.nlm.nih.gov/24864135/']] },
  { t: 'Combien de séries ?', p: [
    'Le volume hebdomadaire est le levier principal de l’hypertrophie, avec des rendements décroissants. 10 à 20 séries par muscle et par semaine, réparties sur 2 séances, est la zone efficace.',
    'L’onglet Progrès compte tes séries par muscle en temps réel. Les épaules (côté) et le dos sont volontairement prioritaires : c’est ce qui crée le V.'],
    src: [['Pelland et al. 2024, méta-régression', 'https://sportrxiv.org/index.php/server/preprint/view/460'], ['Revue systématique 2022', 'https://pubmed.ncbi.nlm.nih.gov/35291645/']] },
  { t: 'À quel point pousser ?', p: [
    'Pour le muscle, s’arrêter près de l’échec fait mieux grossir ; pour la force, la distance à l’échec compte peu. D’où le RIR (« reps en réserve ») affiché sur chaque exercice.',
    'RIR 2 = tu pourrais encore faire 2 reps propres. Sur les gros mouvements lourds, reste à RIR 2. Sur l’isolation (élévations, curls), RIR 0–1.'],
    src: [['Robinson et al. 2024 (FAU)', 'https://www.fau.edu/newsdesk/articles/muscle-growth-strength-study']] },
  { t: 'Progression', p: [
    'Double progression : quand tu atteins le haut de la fourchette sur toutes les séries au RIR demandé, l’appli te propose d’augmenter la charge. Sinon, gagne une rep.',
    'Semaines 6, 12 et 18 = décharge (moins de séries, plus de réserve). C’est là que le corps encaisse le travail.'] },
  { t: 'Cardio + muscu sans se saboter', p: [
    'Combiner cardio et musculation ne freine pas la prise de muscle ni la force globale ; seule la puissance peut être un peu atténuée.',
    'L’interférence semble plus marquée avec la course qu’avec le vélo. D’où le planning : natation (sans impact) en milieu de semaine, course le samedi loin des séances de jambes lourdes.'],
    src: [['Schumann et al. 2022, Sports Med', 'https://link.springer.com/article/10.1007/s40279-021-01587-7'], ['Lundberg et al. 2022 (fibres)', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9474354']] },
  { t: 'Sommeil : le stéroïde légal', p: [
    'À déficit identique, dormir 5,5 h au lieu de 8,5 h a réduit de 55 % la part de gras perdu, au profit du muscle. Vise 8 h, heures fixes, chambre fraîche et noire.'],
    src: [['Stronger By Science : Nedeltcheva 2010', 'https://www.strongerbyscience.com/sleep-pt-1/']] },
  { t: 'Compléments qui marchent', p: [
    'Créatine monohydrate : 3 à 5 g par jour, tous les jours, à n’importe quelle heure. Le complément le plus étudié, sûr chez les personnes en bonne santé. Prise de 1–2 kg d’eau dans le muscle : normal.',
    'Caféine : 3 à 6 mg/kg environ 45 min avant la séance (≈ 250–400 mg pour toi). Pas après 14 h pour protéger ton sommeil.',
    'Whey : juste de la protéine pratique. Le reste (BCAA, brûleurs de graisse, boosters de testo) : inutile.'],
    src: [['ISSN 2017 : créatine', 'https://pubmed.ncbi.nlm.nih.gov/28615996/'], ['ISSN 2021 : caféine', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7777221']] },
  { t: 'Calories : point de départ, puis ajustement', p: [
    'La formule de Mifflin-St Jeor est la plus fiable pour estimer ta dépense au repos, mais elle se trompe de plus de 10 % pour environ un tiers des gens.',
    'FAUVE part de cette estimation, puis compare chaque semaine ta tendance de poids à l’objectif et te propose d’ajuster de 100 à 200 kcal.'],
    src: [['Frankenfield et al.', 'https://pubmed.ncbi.nlm.nih.gov/23631843/']] },
  { t: 'Prépa MMA', p: [
    'Le MMA sollicite toutes les filières énergétiques ; les combattants qui réussissent se distinguent par la force maximale, la puissance et la capacité anaérobie.',
    'D’où la phase 3 : sauts, lancers, sprints et rounds de 5 min. Le renforcement du cou est recommandé par un consensus d’experts pour mieux encaisser les impacts à la tête.'],
    src: [['James et al. 2016, Sports Med', 'https://pubmed.ncbi.nlm.nih.gov/26993133/'], ['Consensus Delphi 2025, BJSM', 'https://shura.shu.ac.uk/35723/']] },
  { t: 'La motivation, ça se construit', p: [
    'Une habitude met en médiane 2 mois à s’installer (59 à 66 jours), avec d’énormes écarts entre les gens. Les 8 premières semaines sont les plus dures, ensuite ça roule tout seul.',
    'Le plan « si-alors » marche : « Si c’est lundi 18 h, alors je vais à la salle ». Note ton créneau pour chaque séance dans Moi › Créneaux.'],
    src: [['Méta-analyse 2024, Healthcare', 'https://www.mdpi.com/3079492'], ['Implementation intentions, méta-analyse', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6235272']] }
];

const QUOTES = [
  'La discipline, c’est choisir ce que tu veux le plus plutôt que ce que tu veux maintenant.',
  'Personne ne viendra le faire à ta place.',
  'Le fauve ne négocie pas avec la flemme.',
  'Petit pas, tous les jours. La régularité bat l’intensité.',
  'Tu ne te lèves pas motivé. Tu te lèves et tu y vas.',
  'Chaque série compte. Chaque repas compte.',
  'Le corps que tu veux se construit les jours où tu n’as pas envie.'
];

/* Fauve — banque de recettes au choix, aliments complémentaires, règles de liste de courses.
   Les grammes sont des poids CUITS pour viandes et féculents (sauf mention), comme dans le journal.
   Calibrage de base : petit-déj ~600 kcal, déjeuner ~750, collation ~400, dîner ~700.
   L'appli met chaque journée à l'échelle de ta cible en ajustant féculents et matières grasses,
   les sources de protéines restent fixes. */
'use strict';

/* ---------- Aliments supplémentaires (pour 100 g, glucides hors fibres) ---------- */
[
  ['porc_filet', 'Filet mignon de porc (cuit)', 143, 26.2, 0, 3.5, 0],
  ['sardines', 'Sardines à l’huile (égouttées)', 208, 24.6, 0, 11.5, 0, ['1 boîte', 100]],
  ['feta', 'Feta', 264, 14.2, 4.1, 21.3, 0],
  ['riz_complet', 'Riz complet (cuit)', 110, 2.3, 22, 0.8, 1.8],
  ['pates_completes', 'Pâtes complètes (cuites)', 150, 6, 26, 1.7, 3.9],
  ['nouilles_riz', 'Nouilles de riz (cuites)', 108, 1.8, 24, 0.2, 1],
  ['kiwi', 'Kiwi', 61, 1.1, 11.7, 0.5, 3, ['1 kiwi', 75]],
  ['oignon', 'Oignon', 40, 1.1, 7.6, 0.1, 1.7],
  ['champignons', 'Champignons de Paris', 24, 3.1, 2.3, 0.3, 1],
  ['concombre', 'Concombre', 15, 0.7, 3.1, 0.1, 0.5],
  ['carottes', 'Carottes', 38, 0.9, 6.8, 0.2, 2.8],
  ['mais', 'Maïs doux (égoutté)', 75, 2.5, 12, 1.2, 2]
].forEach(a => FOODS.push({ id: a[0], n: a[1], kcal: a[2], p: a[3], c: a[4], f: a[5], fib: a[6], por: a[7] || null }));

/* ---------- Recettes ---------- */
const R_ = (id, m, n, time, cook, tags, items, steps, tip) => ({ id, m, n, time, cook, tags, items, steps, tip: tip || '' });
const RECIPES = [
  /* Petit-déjeuner */
  R_('b1', 'b', 'Porridge protéiné à la banane', 8, 'Casserole · 4 min', ['Chaud'],
    [['avoine', 80], ['lait', 300], ['whey', 30], ['banane', 120]],
    ['Verse les flocons et le lait dans une petite casserole.', 'Fais chauffer à feu moyen 3 à 4 min en remuant, jusqu’à ce que ça épaississe.', 'Hors du feu, ajoute la whey et mélange bien (sur le feu, elle fait des grumeaux).', 'Coupe la banane en rondelles par-dessus, ajoute une pincée de cannelle.'],
    'Au micro-ondes : 2 min à 800 W en remuant à mi-cuisson.'),
  R_('b2', 'b', 'Overnight oats skyr et fruits rouges', 5, 'Sans cuisson · prépare la veille', ['Sans cuisson', 'À préparer la veille'],
    [['skyr', 250], ['avoine', 60], ['lait', 100], ['fruits_rouges', 100], ['miel', 10], ['amandes', 15]],
    ['Dans un bocal, mélange le skyr, les flocons et le lait.', 'Ajoute les fruits rouges encore surgelés et le miel.', 'Ferme et laisse une nuit au frigo : l’avoine gonfle et les fruits décongèlent.', 'Le matin, parsème d’amandes concassées.'],
    'Se garde 2 jours au frigo : prépares-en deux d’un coup.'),
  R_('b3', 'b', 'Omelette, pain complet et orange', 10, 'Poêle · 4 min', ['Salé'],
    [['oeuf', 165], ['blanc_oeuf', 100], ['pain_complet', 80], ['orange', 150]],
    ['Bats les 3 œufs et les blancs avec sel, poivre et herbes.', 'Verse dans une poêle antiadhésive chaude à peine huilée.', 'Laisse prendre 3 à 4 min à feu moyen, replie l’omelette.', 'Sers avec le pain grillé et l’orange.'],
    'Ajoute une poignée d’épinards ou de champignons dans l’omelette pour plus de légumes.'),
  R_('b4', 'b', 'Œufs brouillés, jambon et tartines', 10, 'Poêle · 3 min', ['Salé'],
    [['pain_complet', 90], ['oeuf', 110], ['jambon', 80], ['tomate', 100], ['kiwi', 150]],
    ['Bats 2 œufs avec sel et poivre.', 'Cuis à feu doux en remuant sans arrêt 2 à 3 min : ils doivent rester crémeux.', 'Grille le pain, garnis de jambon et de tranches de tomate.', 'Ajoute les œufs brouillés dessus, les kiwis en dessert.']),
  R_('b5', 'b', 'Pancakes protéinés', 15, 'Poêle · 2 min par face', ['Sucré', 'Week-end'],
    [['avoine', 60], ['oeuf', 110], ['blanc_oeuf', 100], ['banane', 100], ['fromage_blanc', 100], ['miel', 10]],
    ['Mixe les flocons, les œufs, les blancs et la banane jusqu’à obtenir une pâte lisse.', 'Laisse reposer 5 min pendant que la poêle chauffe.', 'Verse des petits ronds de pâte, cuis 2 min par face à feu moyen.', 'Sers avec le fromage blanc et un filet de miel.'],
    'La pâte se garde 24 h au frigo dans un bocal fermé.'),
  R_('b6', 'b', 'Bol yaourt grec, muesli et fruits', 4, 'Sans cuisson', ['Sans cuisson', 'Rapide'],
    [['grec', 250], ['whey', 20], ['banane', 120], ['fruits_rouges', 100], ['muesli', 40]],
    ['Mélange le yaourt grec et la whey jusqu’à ce que ce soit lisse.', 'Ajoute la banane coupée et les fruits rouges.', 'Termine par le muesli au dernier moment pour qu’il reste croquant.']),
  R_('b7', 'b', 'Fromage blanc, muesli, pomme et noix', 4, 'Sans cuisson', ['Sans cuisson', 'Rapide'],
    [['fromage_blanc', 300], ['whey', 15], ['muesli', 60], ['pomme', 150], ['noix', 15], ['miel', 10]],
    ['Fouette le fromage blanc avec la whey.', 'Coupe la pomme en dés, ajoute-la avec le muesli.', 'Parsème de noix concassées et d’un filet de miel.']),

  /* Déjeuner */
  R_('l1', 'l', 'Poulet, riz basmati et brocolis', 25, 'Poêle + casserole · 20 min', ['Batch cooking'],
    [['poulet', 180], ['riz', 250], ['brocoli', 200], ['huile_olive', 10]],
    ['Fais cuire le riz (environ 90 g cru) dans 2 fois son volume d’eau salée, 12 min.', 'Coupe le poulet (≈ 240 g cru) en dés, assaisonne : paprika, ail, sel, poivre.', 'Saisis-le à la poêle dans l’huile 6 à 8 min, jusqu’à ce qu’il soit doré et cuit à cœur.', 'Cuis les brocolis à la vapeur ou à l’eau 5 min : ils doivent rester croquants.', 'Ajoute un trait de sauce soja ou de citron au moment de servir.'],
    'Prépare 3 portions d’un coup : ça se garde 3 jours au frigo.'),
  R_('l2', 'l', 'Pâtes bolognaise maison', 25, 'Poêle + casserole · 20 min', ['Batch cooking'],
    [['boeuf5', 200], ['pates', 250], ['coulis', 150], ['oignon', 50], ['parmesan', 15], ['salade', 100]],
    ['Fais cuire les pâtes (environ 110 g crues) dans une grande casserole d’eau salée.', 'Fais revenir l’oignon émincé 2 min, ajoute le bœuf haché et émiette-le 5 min.', 'Verse le coulis, des herbes de Provence, sel et poivre, laisse mijoter 10 min.', 'Mélange avec les pâtes égouttées, parsème de parmesan, salade à côté.']),
  R_('l3', 'l', 'Bowl thon, riz et pois chiches', 15, 'Casserole · 12 min', ['Poisson', 'À emporter'],
    [['thon', 140], ['riz', 200], ['pois_chiches', 100], ['tomate', 150], ['concombre', 100], ['huile_olive', 10]],
    ['Fais cuire le riz (environ 75 g cru) et laisse-le tiédir.', 'Rince et égoutte les pois chiches, coupe tomates et concombre en dés.', 'Assemble le bol avec le thon émietté.', 'Assaisonne : huile d’olive, citron, sel, poivre, un peu d’oignon rouge si tu aimes.'],
    'Se transporte très bien : parfait pour le boulot ou les études.'),
  R_('l4', 'l', 'Wok de dinde et nouilles de riz', 20, 'Wok · 10 min', ['Rapide'],
    [['dinde', 170], ['nouilles_riz', 250], ['legumes', 200], ['sauce_soja', 15], ['huile_olive', 10]],
    ['Fais tremper ou cuire les nouilles (environ 110 g sèches) selon le paquet.', 'Coupe la dinde (≈ 230 g crue) en lanières.', 'Saisis-la dans le wok bien chaud avec l’huile, 4 à 5 min.', 'Ajoute les légumes, 4 min, puis les nouilles et la sauce soja, mélange 1 min.'],
    'Gingembre et ail râpés font toute la différence.'),
  R_('l5', 'l', 'Dahl de lentilles corail, riz et yaourt', 30, 'Cocotte · 20 min', ['Végétarien', 'Batch cooking'],
    [['lentilles', 250], ['riz', 150], ['coulis', 100], ['epinards', 100], ['oignon', 50], ['huile_olive', 10], ['grec', 150]],
    ['Fais revenir l’oignon dans l’huile avec curry, cumin et curcuma (1 c. à café de chaque).', 'Ajoute les lentilles corail (≈ 100 g crues), le coulis et 3 fois leur volume d’eau.', 'Laisse mijoter 15 à 20 min jusqu’à ce que ce soit fondant, ajoute les épinards à la fin.', 'Sers avec le riz (≈ 55 g cru) et une grosse cuillère de yaourt grec.']),
  R_('l6', 'l', 'Burrito bowl au bœuf', 20, 'Poêle · 10 min', ['Batch cooking'],
    [['boeuf5', 180], ['riz', 180], ['haricots_rouges', 100], ['mais', 80], ['tomate', 100], ['avocat', 50]],
    ['Fais cuire le riz (≈ 65 g cru), ajoute du citron vert et de la coriandre si tu as.', 'Fais dorer le bœuf haché avec cumin, paprika fumé, sel, 5 à 6 min.', 'Réchauffe les haricots rouges rincés 2 min dans la même poêle.', 'Assemble : riz, bœuf, haricots, maïs, tomate en dés et avocat.']),
  R_('l7', 'l', 'Salade de quinoa, poulet et feta', 20, 'Casserole · 12 min', ['À emporter'],
    [['poulet', 150], ['quinoa', 250], ['feta', 30], ['concombre', 100], ['tomate', 150], ['huile_olive', 10]],
    ['Rince le quinoa (≈ 90 g cru) puis cuis-le 12 min dans 2 volumes d’eau salée.', 'Pendant ce temps, grille le poulet (≈ 200 g cru) assaisonné, 6 à 8 min.', 'Coupe concombre et tomates, émiette la feta.', 'Mélange le tout avec huile d’olive, citron et menthe ou basilic.']),
  R_('l8', 'l', 'Pâtes complètes sardines, tomates et épinards', 15, 'Casserole + poêle · 12 min', ['Poisson gras', 'Rapide'],
    [['pates_completes', 250], ['sardines', 100], ['coulis', 150], ['epinards', 100], ['parmesan', 10]],
    ['Fais cuire les pâtes complètes (≈ 105 g crues).', 'Dans une poêle, chauffe le coulis avec ail et piment doux, ajoute les épinards 2 min.', 'Ajoute les sardines en morceaux, juste pour les réchauffer.', 'Mélange avec les pâtes, parmesan par-dessus.'],
    'Les sardines en boîte sont un des poissons gras les moins chers et les plus riches en oméga-3.'),

  /* Collation */
  R_('s1', 's', 'Skyr, fruits rouges et amandes', 3, 'Sans cuisson', ['Rapide'],
    [['skyr', 300], ['fruits_rouges', 100], ['miel', 15], ['amandes', 20]],
    ['Verse le skyr dans un bol.', 'Ajoute les fruits rouges, le miel et les amandes.']),
  R_('s2', 's', 'Shake banane et beurre de cacahuète', 3, 'Mixeur', ['Après la séance'],
    [['whey', 30], ['lait', 250], ['banane', 120], ['beurre_cacahuete', 15]],
    ['Mets tout dans le blender avec quelques glaçons.', 'Mixe 30 secondes, bois frais.']),
  R_('s3', 's', 'Fromage blanc, banane, orange et amandes', 4, 'Sans cuisson', ['Rapide'],
    [['fromage_blanc', 250], ['banane', 120], ['orange', 150], ['amandes', 15]],
    ['Coupe la banane et l’orange en morceaux.', 'Mélange au fromage blanc, cannelle et amandes par-dessus.']),
  R_('s4', 's', 'Galettes de riz, jambon, cottage et pomme', 4, 'Sans cuisson', ['Salé', 'À emporter'],
    [['galette_riz', 36], ['cottage', 150], ['jambon', 40], ['pomme', 150], ['miel', 10]],
    ['Tartine les galettes de cottage cheese.', 'Ajoute le jambon, poivre.', 'La pomme et le miel en dessert (ou la pomme en lamelles avec le miel).']),
  R_('s5', 's', 'Œufs durs, skyr et pomme', 12, 'Casserole · 10 min', ['À préparer à l’avance'],
    [['oeuf', 110], ['skyr', 150], ['pomme', 150], ['noix', 10]],
    ['Plonge 2 œufs dans l’eau bouillante 10 min, refroidis-les à l’eau froide.', 'Écale-les, sel et poivre.', 'Skyr avec les noix, la pomme à croquer.'],
    'Cuis 6 œufs d’un coup le dimanche : ils se gardent 5 jours au frigo dans leur coquille.'),
  R_('s6', 's', 'Yaourt grec, muesli et miel', 3, 'Sans cuisson', ['Rapide'],
    [['grec', 250], ['muesli', 40], ['miel', 10], ['fruits_rouges', 80]],
    ['Yaourt grec dans un bol.', 'Muesli, fruits rouges et miel par-dessus.']),
  R_('s7', 's', 'Chocolat chaud protéiné et banane', 5, 'Casserole · 3 min', ['Chaud', 'Douceur'],
    [['lait', 300], ['whey', 30], ['chocolat_noir', 20], ['banane', 100]],
    ['Fais fondre le chocolat dans le lait chaud en fouettant.', 'Hors du feu, ajoute la whey (chocolat ou vanille) et fouette bien.', 'La banane à côté.']),

  /* Dîner */
  R_('d1', 'd', 'Saumon, patate douce et haricots verts', 35, 'Four · 30 min', ['Poisson gras'],
    [['saumon', 150], ['patate_douce', 300], ['haricots_verts', 200], ['huile_olive', 5]],
    ['Préchauffe le four à 200 °C.', 'Coupe la patate douce en frites ou en cubes, huile, sel, paprika : 30 min au four.', 'Ajoute le pavé de saumon sur la même plaque pour les 12 dernières minutes.', 'Cuis les haricots verts 8 min à l’eau ou à la vapeur.', 'Citron et aneth sur le saumon.']),
  R_('d2', 'd', 'Wraps poulet et avocat', 15, 'Poêle · 8 min', ['Rapide'],
    [['tortilla', 120], ['poulet', 150], ['avocat', 50], ['tomate', 100], ['salade', 50], ['fromage_blanc', 50]],
    ['Grille le poulet (≈ 200 g cru) en lanières, épices fajitas, 6 à 8 min.', 'Mélange le fromage blanc avec citron, ail, sel : c’est la sauce.', 'Réchauffe les tortillas 20 s à la poêle.', 'Garnis : sauce, salade, tomate, poulet, avocat, puis roule serré.']),
  R_('d3', 'd', 'Chili con carne et riz', 35, 'Cocotte · 25 min', ['Batch cooking'],
    [['boeuf5', 180], ['haricots_rouges', 150], ['coulis', 150], ['oignon', 50], ['riz', 200], ['emmental', 20], ['huile_olive', 5]],
    ['Fais revenir l’oignon dans l’huile, puis le bœuf 5 min.', 'Ajoute cumin, paprika fumé, piment, le coulis et les haricots rincés.', 'Laisse mijoter 20 min à couvert, en remuant de temps en temps.', 'Sers avec le riz (≈ 75 g cru) et un peu d’emmental râpé.'],
    'Encore meilleur réchauffé le lendemain.'),
  R_('d4', 'd', 'Cabillaud, pommes de terre et courgettes', 30, 'Four · 25 min', ['Poisson'],
    [['cabillaud', 200], ['pdt', 350], ['courgette', 200], ['huile_olive', 15], ['grec', 50]],
    ['Préchauffe le four à 200 °C. Coupe pommes de terre et courgettes en morceaux.', 'Huile, sel, herbes : 25 min au four, en retournant à mi-cuisson.', 'Pose le cabillaud sur les légumes pour les 12 dernières minutes.', 'Sauce : yaourt grec, citron, ciboulette.']),
  R_('d5', 'd', 'Omelette aux champignons et salade', 15, 'Poêle · 8 min', ['Végétarien', 'Rapide'],
    [['oeuf', 220], ['champignons', 150], ['emmental', 20], ['pain_complet', 80], ['salade', 100], ['huile_olive', 5]],
    ['Fais sauter les champignons émincés dans l’huile 4 à 5 min.', 'Bats les 4 œufs, verse sur les champignons.', 'Laisse prendre à feu moyen, ajoute l’emmental et replie.', 'Sers avec la salade et le pain complet.']),
  R_('d6', 'd', 'Filet mignon, semoule et légumes rôtis', 30, 'Four · 25 min', [],
    [['porc_filet', 160], ['semoule', 250], ['legumes', 200], ['huile_olive', 10]],
    ['Préchauffe le four à 200 °C. Saisis le filet mignon (≈ 220 g cru) 2 min de chaque côté.', 'Mets-le au four avec les légumes huilés 20 à 25 min (cœur rosé, 65 °C).', 'Pendant ce temps, verse la semoule (≈ 100 g crue) dans le même volume d’eau bouillante salée, couvre 5 min.', 'Laisse reposer la viande 5 min avant de la trancher.']),
  R_('d7', 'd', 'Curry de crevettes et riz', 25, 'Poêle · 15 min', ['Poisson'],
    [['crevettes', 200], ['riz', 200], ['legumes', 200], ['coulis', 100], ['huile_olive', 10], ['grec', 80]],
    ['Fais cuire le riz (≈ 75 g cru).', 'Fais revenir les légumes dans l’huile avec 1 c. à soupe de curry, 5 min.', 'Ajoute le coulis et les crevettes, laisse mijoter 5 min.', 'Hors du feu, ajoute le yaourt grec pour une sauce crémeuse (sans faire bouillir).']),
  R_('d8', 'd', 'Tofu sauté, riz complet et brocolis', 25, 'Poêle · 15 min', ['Végétarien'],
    [['tofu', 200], ['riz_complet', 220], ['brocoli', 200], ['sauce_soja', 15], ['huile_olive', 10]],
    ['Fais cuire le riz complet (≈ 85 g cru), compte 25 min.', 'Coupe le tofu en cubes, sèche-les bien avec du papier absorbant.', 'Fais-les dorer à la poêle dans l’huile 8 min en retournant.', 'Ajoute les brocolis précuits et la sauce soja, mélange 2 min.'])
];

const SLOT_SHARE = { b: 0.25, l: 0.3, s: 0.15, d: 0.3 };
const FOOD_CAT = {
  prot: ['poulet', 'dinde', 'boeuf5', 'boeuf15', 'saumon', 'thon', 'cabillaud', 'crevettes', 'oeuf', 'blanc_oeuf', 'jambon', 'tofu', 'porc_filet', 'sardines'],
  lait: ['skyr', 'fromage_blanc', 'grec', 'cottage', 'lait', 'emmental', 'parmesan', 'feta'],
  fec: ['riz', 'riz_cru', 'riz_complet', 'pates', 'pates_crues', 'pates_completes', 'quinoa', 'semoule', 'pdt', 'patate_douce', 'avoine', 'pain_complet', 'baguette', 'tortilla', 'galette_riz', 'muesli', 'nouilles_riz', 'lentilles', 'pois_chiches', 'haricots_rouges'],
  fl: ['banane', 'pomme', 'orange', 'kiwi', 'fruits_rouges', 'brocoli', 'haricots_verts', 'courgette', 'epinards', 'tomate', 'salade', 'legumes', 'avocat', 'oignon', 'champignons', 'concombre', 'carottes', 'mais'],
  epi: ['huile_olive', 'beurre_cacahuete', 'amandes', 'noix', 'chocolat_noir', 'miel', 'sauce_soja', 'coulis', 'whey']
};
const CAT_N = { prot: 'Viandes, poissons, œufs', lait: 'Produits laitiers', fec: 'Féculents et légumineuses', fl: 'Fruits et légumes', epi: 'Épicerie' };
/* Poids cuit → cru pour la liste de courses (cru = cuit / facteur) */
const RAW = { riz: 2.7, riz_complet: 2.6, pates: 2.3, pates_completes: 2.3, quinoa: 2.7, semoule: 2.4, lentilles: 2.5, nouilles_riz: 2.2, poulet: 0.75, dinde: 0.75, porc_filet: 0.72 };
const RAW_N = { riz: 'Riz basmati', riz_complet: 'Riz complet', pates: 'Pâtes', pates_completes: 'Pâtes complètes', quinoa: 'Quinoa', semoule: 'Semoule', lentilles: 'Lentilles corail', nouilles_riz: 'Nouilles de riz', poulet: 'Blanc de poulet', dinde: 'Escalopes de dinde', porc_filet: 'Filet mignon de porc' };
/* À compter à la pièce : [singulier, pluriel, poids unitaire] */
const PIECES = { oeuf: ['œuf', 'œufs', 55], banane: ['banane', 'bananes', 120], pomme: ['pomme', 'pommes', 150], orange: ['orange', 'oranges', 150], kiwi: ['kiwi', 'kiwis', 75], avocat: ['avocat', 'avocats', 140], tortilla: ['tortilla', 'tortillas', 60], galette_riz: ['galette', 'galettes', 9], thon: ['boîte (140 g égoutté)', 'boîtes (140 g égouttés)', 140], sardines: ['boîte', 'boîtes', 100], saumon: ['pavé', 'pavés', 150] };
const FISH_FAT = ['saumon', 'sardines'], FISH = ['saumon', 'sardines', 'thon', 'cabillaud', 'crevettes'], RED = ['boeuf5', 'boeuf15', 'porc_filet'], MEAT = ['poulet', 'dinde', 'boeuf5', 'boeuf15', 'porc_filet', 'jambon'], LEGUMES_SECS = ['lentilles', 'pois_chiches', 'haricots_rouges'];

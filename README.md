# Fauve

Application web (PWA) de musculation, nutrition et préparation MMA, installable sur iPhone.

**Adresse :** https://i-zaine-i.github.io/fauve/

## Installer sur l'iPhone
1. Ouvre l'adresse ci-dessus dans **Safari**.
2. Touche **Partager**, puis **Sur l'écran d'accueil**.
3. Lance FAUVE depuis son icône : plein écran, fonctionne hors ligne.

## Ce qu'il y a dedans
- Programme de 18 semaines en 3 phases (Fondations, Forge, Arme), puis un mode MMA : salle, cage plein air, piscine, course.
- Carnet de séance : charges proposées (double progression), minuteur de repos, détection des records, consignes d'exécution.
- Chrono rounds (MMA 5 × 5 min, boxe, Tabata) avec sons et écran toujours allumé.
- Nutrition : calories et macros calculées (Mifflin-St Jeor), ajustement hebdomadaire selon la tendance du poids, base d'aliments et aliments personnels.
- Menu de la semaine : 30 recettes au choix (grammes, cuisson, étapes), proposition équilibrée automatique, quantités ajustées chaque jour, liste de courses en poids crus.
- Analyse nutrition : 7 derniers jours (calories, protéines, fibres, répartition, protéines par repas) et contrôle du menu (fruits et légumes, poisson, viande rouge, légumineuses).
- Eau : objectif réglable, rythme horaire, rappels dans l'app.
- Suivi : poids lissé, masse grasse estimée (méthode US Navy), ratio épaules/taille, records, volume par muscle, tests athlétiques, photos avant/après.
- Motivation : missions du jour, XP, rangs, série de jours validés, créneaux « si-alors ».

## Données
Tout reste sur le téléphone (localStorage + IndexedDB pour les photos). Sauvegarde/restauration en JSON depuis l'onglet **Moi**.

## Technique
HTML, CSS et JavaScript sans dépendance ni build. Service worker pour le hors-ligne (`sw.js` : augmenter `V` à chaque mise à jour).

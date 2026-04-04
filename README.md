# THE DEEP

Un jeu de survie sous-marine réalisé avec p5.js, basé sur les steering behaviors de Craig Reynolds.

🎮 **[Jouer au jeu](https://nourelBazzal.github.io/the-deep)**
📺 **[Voir la vidéo de gameplay](VOTRE_LIEN_YOUTUBE)**

---

## C'est quoi ?

THE DEEP est un jeu où tu incarnes un poisson qui descend à travers quatre zones océaniques — Surface, Crépuscule, Minuit, et Abîsse. Tu grandis en mangeant les poissons plus petits que toi, et tu dois fuir ceux qui sont plus grands. Plus tu descends, plus c'est dangereux.

Le monde fait 2000×3000 pixels. Une caméra suit le joueur en douceur. Chaque entité animée dans le jeu est une sous-classe de `Vehicle` et se déplace uniquement grâce aux steering behaviors.

---

## Comment jouer

- **Souris** — ton poisson suit le curseur avec un comportement d'arrivée progressif
- **ESPACE** — dash (temps de recharge de 3 secondes)
- **D** — activer le mode debug (rayons de perception, relations prédateur/proie)
- **V** — debug interne du véhicule (wander, arrive...)
- **R** — recommencer après game over ou victoire

**Objectif :** atteindre la taille 80 pour gagner. Les poissons avec un label vert sont comestibles, les rouges sont dangereux.

---

## Comportements de steering utilisés

Tous les comportements de base viennent de `Vehicle.js` (non modifié). Les comportements personnalisés ou combinés sont dans les sous-classes.

| Comportement           | Fichier          | Usage                                                                   |
| ---------------------- | ---------------- | ----------------------------------------------------------------------- |
| **Seek / Arrive**      | `PlayerFish.js`  | Le joueur suit la souris avec décélération progressive                  |
| **Flee**               | `AIFish.js`      | Les proies fuient le joueur s'il est plus grand et proche               |
| **Pursue**             | `AIFish.js`      | Les prédateurs anticipent la position future du joueur                  |
| **Wander**             | `AIFish.js`      | Tous les poissons IA déambulent quand aucune cible n'est proche         |
| **Boundaries**         | `GameManager.js` | Tous les véhicules rebondissent sur les bords du monde                  |
| **Separation**         | `AIFish.js`      | Les proies gardent leurs distances au sein du banc                      |
| **Alignment**          | `AIFish.js`      | Les proies s'alignent sur la direction moyenne du groupe                |
| **Cohesion**           | `AIFish.js`      | Les proies se dirigent vers le centre de masse du groupe                |
| **Obstacle avoidance** | `Obstacle.js`    | Force de répulsion appliquée à tous les véhicules proches d'un obstacle |

---

## Architecture du projet

```
vehicle.js              ← classe de base, jamais modifiée
├── PlayerFish.js       ← joueur, arrive + dash + animation spritesheet
├── AIFish.js           ← poissons IA avec rôles : proie / neutre / prédateur
ZoneManager.js          ← définit les 4 zones de profondeur
GameManager.js          ← spawn, collisions, croissance, machine d'état
OceanBackground.js      ← dégradé pré-rendu + particules atmosphériques
Camera.js               ← caméra avec suivi lerp
Decoration.js           ← algues en images PNG sur le fond marin
Obstacle.js             ← obstacles statiques avec force de répulsion
HUD.js                  ← écrans start / jeu / game over / victoire
SpriteSheet.js          ← système d'animation image par image
sketch.js               ← point d'entrée p5.js uniquement
```

---

## Réglage des comportements

**Distance de fuite** passée de 100px à 180px — à 100px les proies réagissaient trop tard et l'océan semblait vide. À 180px on voit les bancs s'éparpiller à l'approche, ce qui donne vie à la scène.

**Distance de poursuite** des prédateurs multipliée par un coefficient d'agressivité basé sur leur taille : `1.0 + (taille/35) * 0.5`. Les grands prédateurs voient plus loin, ce qui rend l'abîsse vraiment menaçante.

**Poids du flocking** — séparation à 1.4, alignement à 0.8, cohésion à 0.6. La séparation domine pour éviter que les poissons se superposent, la cohésion reste faible pour que les bancs soient fluides et naturels.

**Courant océanique** (`createVector(0.015, 0.005)`) appliqué uniquement aux poissons IA. La valeur initiale était 0.3, ce qui poussait tous les poissons contre le bord droit — divisée par 20 pour un effet subtil sans dominer les autres forces.

**Rebonds aux bords** — un `constrain()` dur est ajouté après chaque `update()` pour empêcher les véhicules de sortir définitivement du monde quand le courant et la force de boundary se contredisent.

---

## MON EXPÉRIENCE

J'ai choisi de faire un jeu de poissons parce que je voulais explorer les steering behaviors dans un contexte qui ait vraiment du sens — pas juste des triangles qui se suivent sur un canvas blanc. L'idée d'une chaîne alimentaire m'a semblé parfaite pour ça : chaque comportement a un rôle écologique naturel. Les proies forment des bancs pour survivre, les prédateurs chassent en anticipant ta trajectoire, et toi tu arrives en douceur plutôt que de téléporter vers la souris.

Ce qui m'a le plus surpris c'est de voir comment des règles aussi simples créent des comportements qui semblent vraiment vivants. Un banc qui s'éparpille à ton approche, un prédateur qui coupe ta route au lieu de te suivre bêtement — ça ressemble à quelque chose de naturel, alors que c'est juste trois vecteurs additionnés.

**La difficulté principale a été le système d'animation par spritesheet.** Plusieurs problèmes se sont enchaînés et ça m'a pris beaucoup plus de temps que prévu.

D'abord, les images générées par Gemini avaient des fonds non transparents — noir pour certaines, gris pour d'autres — ce qui créait un rectangle visible autour du poisson à l'écran. J'ai dû écrire des scripts Python pour supprimer ces fonds canal par canal, avec des seuils différents selon la couleur du fond.

Ensuite, l'animation de retournement du poisson se déclenchait en permanence, donnant l'impression que le personnage tremblait. La cause était inattendue : le comportement `arrive` ralentit le poisson près de la cible, ce qui fait osciller `vel.x` autour de zéro en permanence. Le poisson "changeait de direction" 60 fois par seconde sans bouger. La solution a été un système de debounce — 25 frames stables à vitesse suffisante avant de valider le changement, plus un cooldown de 45 frames après chaque retournement.

Enfin, le flag `done` des animations en boucle se mettait à `true` après le premier cycle et n'était jamais réinitialisé, cassant les transitions d'état. Résolu en séparant clairement les animations looping (jamais `done`) et one-shot (clamp sur la dernière frame).

Au final ce projet m'a appris autant sur la gestion des assets et le débogage que sur les steering behaviors eux-mêmes. Et le résultat — un océan qui respire, des bancs qui fuient, des prédateurs qui chassent — valait vraiment le travail.

---

## Fichiers fournis aux assistants IA

- `AGENTS.md` — contexte complet du projet, règles d'architecture pour tout agent IA
- `.github/copilot-instructions.md` — instructions spécifiques pour GitHub Copilot en mode agent

---

## Outils utilisés

- **IDE :** Visual Studio Code avec l'extension Live Server
- **IA utilisées :**
  - GitHub Copilot (mode agent) — édition de fichiers, génération de code directement dans VS Code
  - Claude Sonnet 4.6 (claude.ai) — architecture, débogage, rédaction des prompts agents
  - Gemini (Google) — génération des spritesheets d'animation
- **Bibliothèques :** p5.js, p5.sound
- **Assets :** Spritesheets générés avec Gemini, algues depuis Kenney.nl

---

## Références

- Craig Reynolds — [Steering Behaviors For Autonomous Characters (GDC 1999)](https://www.red3d.com/cwr/steer/gdc99/)
- Daniel Shiffman — [The Nature of Code](https://natureofcode.com/book/)
- Michel Buffa — Cours Master 2 MIAGE IA2, Université Côte d'Azur

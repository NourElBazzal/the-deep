# THE DEEP

Un jeu de survie sous-marine réalisé avec p5.js, basé sur les steering behaviors de Craig Reynolds.

🎮 **[Jouer au jeu](https://NourElBazzal.github.io/the-deep)**
📺 **[Voir la vidéo de gameplay](VOTRE_LIEN_YOUTUBE)**

---

## C'est quoi ?

THE DEEP est un jeu où tu incarnes un poisson qui descend à travers quatre zones océaniques — Surface, Crépuscule, Minuit, et Abîsse. Tu grandis en mangeant les poissons plus petits que toi, tu dois fuir ceux qui sont plus grands, et tu dois manger régulièrement pour ne pas mourir de faim. Plus tu descends, plus c'est dangereux.

Le monde fait 2000×3000 pixels. Une caméra suit le joueur en douceur. Chaque entité animée est une sous-classe de `Vehicle` et se déplace uniquement grâce aux steering behaviors.

---

## Comment jouer

- **Souris** — ton poisson suit le curseur avec un comportement d'arrivée progressif
- **ESPACE** — dash (temps de recharge de 3 secondes)
- **D** — activer le mode debug (rayons de perception, BehaviorManager en temps réel)
- **V** — debug interne du véhicule (wander, arrive, boundaries...)
- **S** — sauvegarder la config du premier prédateur (console)
- **L** — charger un preset "prédateur agressif" sur tous les prédateurs
- **R** — recommencer après game over ou victoire

**Objectif :** atteindre la taille 80 pour gagner. Les labels verts indiquent les poissons comestibles, les rouges sont dangereux. Surveille ta jauge de faim — si elle tombe à zéro, c'est la mort.

---

## Comportements de steering utilisés

Tous les comportements de base viennent de `Vehicle.js` (non modifié). Les comportements personnalisés ou combinés sont dans les sous-classes, orchestrés par le `BehaviorManager`.

| Comportement           | Fichier           | Usage                                                                |
| ---------------------- | ----------------- | -------------------------------------------------------------------- |
| **Seek / Arrive**      | `PlayerFish.js`   | Le joueur suit la souris avec décélération progressive               |
| **Flee**               | `AIFish.js`       | Les proies fuient le joueur s'il est plus grand et proche            |
| **Pursue**             | `AIFish.js`       | Les prédateurs anticipent la position future du joueur               |
| **Wander**             | `AIFish.js`       | Tous les poissons IA déambulent quand aucune cible n'est proche      |
| **Boundaries**         | `BehaviorManager` | Géré comme comportement nommé avec poids pour chaque véhicule        |
| **Separation**         | `AIFish.js`       | Les proies gardent leurs distances au sein du banc                   |
| **Alignment**          | `AIFish.js`       | Les proies s'alignent sur la direction moyenne du groupe             |
| **Cohesion**           | `AIFish.js`       | Les proies se dirigent vers le centre de masse du groupe             |
| **Obstacle avoidance** | `Obstacle.js`     | Force de répulsion appliquée à tous les véhicules proches des épaves |

---

## BehaviorManager

Chaque poisson IA possède un `BehaviorManager` qui orchestre ses comportements de steering. C'est une classe qui gère une liste de comportements nommés, chacun avec un poids et un état actif/inactif.

```javascript
// Chaque AIFish construit son BehaviorManager au démarrage
this.bm = new BehaviorManager(this);
this.bm
  .add('wander',   () => this.wander(),    1.0)
  .add('pursue',   () => createVector(0,0), 2.0)  // mis à jour à runtime
  .add('boundary', () => this.boundaries(...),    1.5);
```

**API disponible :**

| Méthode                 | Description                                                |
| ----------------------- | ---------------------------------------------------------- |
| `add(name, fn, weight)` | Ajoute un comportement nommé avec une fonction et un poids |
| `remove(name)`          | Supprime un comportement                                   |
| `activate(name)`        | Active un comportement                                     |
| `deactivate(name)`      | Désactive sans supprimer                                   |
| `setWeight(name, w)`    | Modifie le poids d'un comportement                         |
| `getSteeringForce()`    | Calcule et retourne la force combinée                      |
| `save()`                | Sauvegarde poids et états dans un objet JSON               |
| `load(config)`          | Restaure une configuration sauvegardée                     |
| `describe()`            | Retourne un résumé lisible de tous les comportements       |

En appuyant sur **D** en jeu, le debug affiche en temps réel l'état de chaque comportement sur les 3 premiers poissons à l'écran — tu vois `flee` passer de inactif à actif quand tu approches une proie, et `pursue` s'activer quand un prédateur te repère.

En appuyant sur **L**, tous les prédateurs chargent un preset "agressif" (`pursue` à poids 4.0) instantanément, sans toucher au code.

---

## Architecture du projet

```
vehicle.js              ← classe de base, jamais modifiée
├── PlayerFish.js       ← joueur : arrive, dash, faim, animation spritesheet
├── AIFish.js           ← poissons IA : proie / neutre / prédateur + BehaviorManager
BehaviorManager.js      ← gestionnaire de comportements : add/remove/activate/save/load
SpriteSheet.js          ← système d'animation image par image
ZoneManager.js          ← définit les 4 zones de profondeur
GameManager.js          ← spawn, collisions, croissance, mort, machine d'état
OceanBackground.js      ← dégradé + bulles + rayons + débris + méduses + fond marin
Camera.js               ← caméra lerp avec clamp aux bords du monde
Decoration.js           ← algues PNG sur le fond marin
Obstacle.js             ← épaves (planches, coques, ancres) avec avoidance force
HUD.js                  ← tous les écrans : start, jeu, game over, victoire
sketch.js               ← point d'entrée p5.js uniquement
```

---

## Réglage des comportements

**Distance de fuite** passée de 100px à 180px — à 100px les proies réagissaient trop tard et l'océan semblait vide. À 180px on voit les bancs s'éparpiller à l'approche.

**Distance de poursuite** multipliée par un coefficient d'agressivité : `1.0 + (taille/35) * 0.5`. Les grands prédateurs voient plus loin, ce qui rend l'abîsse vraiment menaçante.

**Poids du flocking** — séparation à 1.4, alignement à 0.8, cohésion à 0.6. La séparation domine pour éviter que les poissons se superposent, la cohésion reste faible pour que les bancs soient fluides.

**Courant océanique** (`createVector(0.015, 0.005)`) appliqué uniquement aux poissons IA. La valeur initiale de 0.3 poussait tous les poissons contre le bord droit — divisée par 20 pour un effet subtil.

**Rebonds aux bords** — un `constrain()` dur après chaque `update()` empêche les véhicules de sortir du monde quand le courant et la boundary force se contredisent. La caméra est également clampée pour ne jamais révéler l'extérieur du monde.

**Faim** — la jauge décroît de 0.008 par frame (environ 12 minutes sans manger). En dessous de 20% le joueur ralentit et un avertissement pulse à l'écran. Chaque poisson mangé restaure 8 à 25 points selon sa taille.

**BehaviorManager** — les poids ont été ajustés pour que `flee` (2.5) domine `wander` (1.0) et `flock` (1.0) quand une menace est détectée, et que `pursue` (2.0) domine `wander` (0.6) chez les prédateurs actifs.

---

## Fonctionnalités visuelles et sonores

- **Musique ambiante** adaptative — volume croît avec la profondeur, s'estompe sur les écrans de fin
- **Screen shake** — petit tremblement en mangeant, tremblement fort à la mort, vibration continue quand un prédateur est tout proche
- **Burst de particules** à chaque repas — couleur selon le type de poisson mangé, intensité selon sa taille
- **Bulles** montantes avec balancement sinusoïdal
- **Rayons lumineux** dans les zones peu profondes avec blend mode ADD
- **Méduses décoratives** pulsantes dans les zones sombres
- **Épaves** (planches, coques de bateau, ancres rouillées) comme obstacles avec avoidance force
- **Animation spritesheet** du joueur : idle, nage montante/descendante, dash, manger, retournement, mort

---

## MON EXPÉRIENCE

J'ai choisi de faire un jeu de poissons parce que je voulais explorer les steering behaviors dans un contexte qui ait vraiment du sens — pas juste des triangles qui se suivent sur un canvas blanc. L'idée d'une chaîne alimentaire m'a semblé parfaite pour ça : chaque comportement a un rôle écologique naturel. Les proies forment des bancs pour survivre, les prédateurs chassent en anticipant ta trajectoire, et toi tu arrives en douceur plutôt que de téléporter vers la souris.

Ce qui m'a le plus surpris c'est de voir comment des règles aussi simples créent des comportements qui semblent vraiment vivants. Un banc qui s'éparpille à ton approche, un prédateur qui coupe ta route au lieu de te suivre bêtement — ça ressemble à quelque chose de naturel, alors que c'est juste trois vecteurs additionnés.

**La difficulté principale a été le système d'animation par spritesheet.** Les images générées par Gemini avaient des fonds non transparents (noir ou gris), ce qui créait un rectangle visible autour du poisson. J'ai dû écrire des scripts Python pour supprimer ces fonds canal par canal. Ensuite l'animation de retournement se déclenchait en permanence à cause du comportement `arrive` qui fait osciller `vel.x` autour de zéro — résolu avec un debounce de 25 frames et un cooldown de 45 frames. Enfin le flag `done` des animations en boucle cassait les transitions d'état — résolu en séparant clairement les modes looping et one-shot.

**Le BehaviorManager** a été une découverte intéressante. Au départ j'avais tout le code de comportement dans des `if/else` dans une seule fonction. Le transformer en système de comportements nommés avec poids m'a forcé à vraiment réfléchir à ce que chaque comportement fait et à quel moment il doit dominer les autres. Voir en debug les comportements s'activer et se désactiver en temps réel, c'est beaucoup plus satisfaisant que de lire du code.

Au final ce projet m'a appris autant sur la gestion des assets, le débogage canvas, et l'architecture logicielle que sur les steering behaviors eux-mêmes.

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
- **Assets :** Spritesheets générés avec Gemini, algues depuis Kenney.nl, musique ambiante depuis freesound.org

---

## Références

- Craig Reynolds — [Steering Behaviors For Autonomous Characters (GDC 1999)](https://www.red3d.com/cwr/steer/gdc99/)
- Daniel Shiffman — [The Nature of Code](https://natureofcode.com/book/)
- Michel Buffa — Cours Master 2 MIAGE IA2, Université Côte d'Azur

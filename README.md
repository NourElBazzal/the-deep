# THE DEEP

Un jeu de survie sous-marine réalisé avec p5.js, basé sur les steering behaviors de Craig Reynolds.

🎮 **[Jouer au jeu](https://NourElBazzal.github.io/the-deep)**
📺 **[Voir la vidéo de gameplay](VOTRE_LIEN_YOUTUBE)**

---

## C'est quoi ?

THE DEEP est un jeu où tu incarnes un poisson bioluminescent qui descend à travers quatre zones océaniques — Surface, Crépuscule, Minuit, et Abîsse. Tu grandis en mangeant les poissons plus petits, tu fuis ceux qui sont plus grands, tu gères ta faim, et tu dois survivre jusqu'à affronter un requin boss. Tu as 2 minutes pour atteindre la taille 80 — ou tu péris.

Le monde fait 2000×3000 pixels. Une caméra suit le joueur en douceur. Chaque entité animée est une sous-classe de `Vehicle` et se déplace uniquement grâce aux steering behaviors.

---

## Comment jouer

- **Souris** — ton poisson suit le curseur avec un comportement d'arrivée progressif
- **ESPACE** — dash (temps de recharge de 3 secondes)
- **M** — couper / remettre la musique
- **F** — faire apparaître un groupe avec leader
- **D** — activer le mode debug (rayons de perception, BehaviorManager en temps réel)
- **V** — debug interne du véhicule (wander, arrive, boundaries...)
- **S** — sauvegarder la config du premier prédateur (console)
- **L** — charger un preset "prédateur agressif" sur tous les prédateurs
- **R** — recommencer après game over ou victoire

**Objectif :** atteindre la taille 80 avant la fin du compte à rebours de 2 minutes. Les labels verts indiquent les poissons comestibles, les rouges sont dangereux. Quand tu atteins la taille 55, un requin géant apparaît — grandis encore pour le vaincre.

**Attention :** ta jauge de faim diminue en permanence. Si elle tombe à zéro, c'est la mort.

---

## Comportements de steering utilisés

Tous les comportements de base viennent de `Vehicle.js` (non modifié). Les comportements personnalisés ou combinés sont dans les sous-classes, orchestrés par le `BehaviorManager`.

| Comportement           | Fichier                      | Usage                                                                    |
| ---------------------- | ---------------------------- | ------------------------------------------------------------------------ |
| **Seek / Arrive**      | `PlayerFish.js`              | Le joueur suit la souris avec décélération progressive                   |
| **Flee**               | `AIFish.js`                  | Les proies fuient le joueur s'il est plus grand et proche                |
| **Pursue**             | `AIFish.js`                  | Les prédateurs et le requin boss anticipent la position future du joueur |
| **Evade**              | `AIFish.js`                  | Les suiveurs s'écartent s'ils se retrouvent devant le leader             |
| **Wander**             | `AIFish.js` + `BossShark.js` | Déambulation organique quand aucune cible n'est proche                   |
| **Boundaries**         | `BehaviorManager`            | Géré comme comportement nommé avec poids pour chaque véhicule            |
| **Separation**         | `AIFish.js`                  | Les proies gardent leurs distances au sein du banc                       |
| **Alignment**          | `AIFish.js`                  | Les proies s'alignent sur la direction moyenne du groupe                 |
| **Cohesion**           | `AIFish.js`                  | Les proies se dirigent vers le centre de masse du groupe                 |
| **Leader following**   | `AIFish.js`                  | Arrive derrière le leader + évitement si en avant + séparation           |
| **Obstacle avoidance** | `Obstacle.js`                | Force de répulsion exponentielle + correction de position physique       |
| **Circle strafe**      | `BossShark.js`               | Le requin orbite autour du joueur à distance moyenne                     |

---

## BehaviorManager

Chaque poisson IA possède un `BehaviorManager` qui orchestre ses comportements de steering. C'est une classe qui gère une liste de comportements nommés, chacun avec un poids et un état actif/inactif.

```javascript
this.bm = new BehaviorManager(this);
this.bm
  .add('wander',   () => this.wander(),     1.0)
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

En appuyant sur **D** en jeu, le debug affiche en temps réel l'état de chaque comportement sur les 3 premiers poissons — tu vois `flee` passer de inactif à actif quand tu approches une proie, et `pursue` s'activer quand un prédateur te repère. En appuyant sur **L**, tous les prédateurs chargent un preset "agressif" instantanément.

---

## Boss shark

Quand le joueur atteint la taille 55, un requin géant apparaît avec une cinématique complète — écran qui s'assombrit, barres de letterbox, message "A PREDATOR AWAKENS", musique qui change. Le requin utilise plusieurs comportements combinés :

- **Wander** quand le joueur est loin
- **Pursue** à portée moyenne — anticipe la trajectoire
- **Circle strafe** à courte distance — orbite autour du joueur de façon imprévisible
- **Flee** brièvement si le joueur dashe à proximité
- **Boundaries** pour rester dans le monde

Pour vaincre le requin, il suffit d'atteindre la taille 80 pendant qu'il est actif. Une barre de progression au-dessus du requin indique à quel point tu es proche de le vaincre.

---

## Architecture du projet

```
vehicle.js              ← classe de base, jamais modifiée
├── PlayerFish.js       ← joueur : arrive, dash, faim, spritesheets
├── AIFish.js           ← poissons IA : proie / neutre / prédateur + BehaviorManager
├── BossShark.js        ← requin boss : pursue, wander, flee, circle strafe
BehaviorManager.js      ← gestionnaire de comportements : add/remove/activate/save/load
SpriteSheet.js          ← système d'animation image par image (looping + one-shot)
ZoneManager.js          ← définit les 4 zones de profondeur
GameManager.js          ← spawn, collisions, croissance, mort, boss, machine d'état
OceanBackground.js      ← dégradé + bulles + rayons + débris + méduses + fond marin
Camera.js               ← caméra lerp avec clamp aux bords du monde
Decoration.js           ← algues PNG sur le fond marin avec balancement
Obstacle.js             ← épaves (planches, coques, ancres) avec avoidance exponentielle
HUD.js                  ← tous les écrans : start, jeu, game over, victoire, cinématique boss
sketch.js               ← point d'entrée p5.js uniquement
```

---

## Réglage des comportements

**Distance de fuite** passée de 100px à 180px — à 100px les proies réagissaient trop tard. À 180px on voit les bancs s'éparpiller à l'approche, ce qui donne vie à l'océan.

**Distance de poursuite** multipliée par un coefficient d'agressivité : `1.0 + (taille/35) * 0.5`. Les grands prédateurs voient plus loin, ce qui rend l'abîsse vraiment menaçante.

**Poids du flocking** — séparation à 1.4, alignement à 0.8, cohésion à 0.6. La séparation domine pour éviter que les poissons se superposent, la cohésion reste faible pour que les bancs soient fluides.

**Courant océanique** (`createVector(0.015, 0.005)`) appliqué uniquement aux poissons IA. La valeur initiale de 0.3 poussait tous les poissons contre le bord droit — divisée par 20 pour un effet subtil.

**Collision avec les obstacles** — double système : une force d'évitement exponentielle (`pow(map(...), 2)`) qui pousse bien avant le contact, plus une correction de position physique qui éjecte tout véhicule qui pénètre quand même dans l'obstacle.

**Faim** — décroît de 0.008 par frame (≈12 minutes sans manger). En dessous de 20% le joueur ralentit et un avertissement pulse à l'écran. Chaque poisson mangé restaure 8 à 25 points selon sa taille.

**Compte à rebours** — 2 minutes (7200 frames). Devient orange à 60s, rouge pulsant à 30s avec vignette sur les bords. Expiration = mort par timeout.

**BehaviorManager** — les poids ont été ajustés pour que `flee` (2.5) domine `wander` (1.0) et `flock` (1.0) quand une menace est détectée, et que `pursue` (2.0) domine `wander` (0.6) chez les prédateurs actifs.

---

## Fonctionnalités visuelles et sonores

- **Musique ambiante** — volume adaptatif selon la profondeur. Quand le boss apparaît : l'ambiante s'arrête, `scary_popup.mp3` joue une fois (4s), puis `scary_ambient.mp3` prend le relais en boucle
- **Screen shake** — tremblement à l'impact, fort à la mort, vibration de proximité avec un prédateur
- **Burst de particules** à chaque repas — couleur selon le type de poisson mangé, intensité selon sa taille
- **Cinématique boss** — overlay noir, barres letterbox, titre rouge avec glow, scan line animée
- **Bulles** montantes avec balancement sinusoïdal, visibilité croissant avec la profondeur
- **Rayons lumineux** (blend ADD) dans les zones peu profondes
- **Méduses décoratives** pulsantes dans Minuit et Abîsse
- **Épaves** dessinées au bezier (planches, coques, ancres rouillées) avec profondeur simulée
- **Fond marin** avec couche sableuse, galets, algues animées
- **Animations spritesheet** : idle, nage montante/descendante, dash, manger, retournement, mort — avec suppression automatique des fonds en Python

---

## MON EXPÉRIENCE

J’ai choisi de faire un jeu de poissons parce que je voulais tester les steering behaviors dans un contexte un peu plus concret que juste des triangles qui bougent sur un fond blanc. L’idée d’une chaîne alimentaire m’a paru assez logique : chaque comportement a un rôle "naturel". Les petits poissons restent en groupe, les prédateurs te suivent en anticipant tes mouvements, et le joueur se déplace de manière plus fluide avec arrive au lieu de snap directement sur la souris.

Ce qui m'a le plus surpris c'est de voir comment des règles aussi simples créent des comportements qui semblent vivants. Par exemple, voir un banc de poissons se disperser quand tu t’approches, ou un requin tourner autour de toi de façon un peu imprévisible… alors qu’en réalité c’est juste quelques vecteurs combinés.

**La difficulté principale a été le système d'animation par spritesheet.** Les images générées par Gemini avaient des fonds non transparents (noir, gris, ou damier selon le format exporté), ce qui créait un rectangle visible autour du poisson. J'ai dû écrire des scripts Python pour supprimer ces fonds canal par canal — avec des stratégies différentes selon le type de fond. J’ai aussi eu un bug où le poisson changeait de direction en boucle, parce que vel.x oscillait autour de zéro avec arrive: résolu avec un debounce de 35 frames à vitesse > 1.8 et un cooldown de 60 frames. Enfin le flag `done` des animations en boucle cassait les transitions d'état: résolu en séparant clairement les modes looping et one-shot.

**Le BehaviorManager** m'a forcé à vraiment réfléchir à ce que chaque comportement fait et quand il doit dominer les autres. Voir en debug les comportements s'activer et se désactiver en temps réel — `flee` qui prend le dessus sur `wander` quand tu approches une proie - c'est bien plus satisfaisant que de lire du code.

**Le boss shark** était clairement la partie la plus fun à faire. J’ai combiné pursue, wander, flee et un genre de circle strafe avec une machine d'état assez simple. Au final, ça donne un comportement qui paraît assez “vivant”. Le moment où la cinématique se lance avec le changement de musique rend bien comme je voulais.

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

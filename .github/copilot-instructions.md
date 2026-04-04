# AGENTS.md — AI Agent Briefing for Steering Behaviors Project

## Project Overview

This is a **p5.js steering behaviors simulation** built for a Master 2 MIAGE IA2 course (Michel Buffa, 2026),
based on Craig Reynolds' 1999 GDC article: https://www.red3d.com/cwr/steer/gdc99/

The project lives in a browser, served locally via VS Code Live Server.
All code runs client-side. No build step, no bundler, no npm.

---

## Absolute Rules — Read Before Touching Any File

1. **NEVER modify `vehicle.js`.**
   It is the base class provided by the course. All new behaviors are built by extending it.

2. **One class per file.** Each new entity gets its own `.js` file (e.g. `Snake.js`, `SnakeSegment.js`, `Boid.js`).

3. **All classes extend `Vehicle`** (or extend a class that already extends `Vehicle`).
   Never duplicate physics logic — `applyForce`, `update`, `edges` are inherited.

4. **Script load order in `index.html` is critical:**

   ```
   vehicle.js  →  SnakeSegment.js  →  Snake.js  →  sketch.js
   ```

   A class must be defined before anything that uses it.
   When you add a new file, add its `<script>` tag in the correct position.

5. **Use only p5.js globals** for drawing and math: `createVector`, `p5.Vector`, `random`, `map`,
   `constrain`, `lerp`, `lerpColor`, `cos`, `sin`, `noise`, `push/pop`, etc.
   Do not import external libraries unless asked.

---

## File Structure

```
/
├── index.html              ← entry point, manages <script> load order
├── sketch.js               ← p5.js setup() + draw() + input handlers only
├── vehicle.js              ← ⛔ DO NOT EDIT — base Vehicle class
├── SnakeSegment.js         ← extends Vehicle, one body segment
├── Snake.js                ← manages array of SnakeSegments
├── assets/
│   └── inconsolata.otf
└── AGENTS.md               ← this file
```

New files you create go in the root alongside the existing `.js` files.

---

## Core Architecture Pattern

Every entity follows this pattern:

```javascript
class MyEntity extends Vehicle {       // or extends AnotherSubclass
  constructor(x, y, ...params) {
    super(x, y);
    // override Vehicle defaults here
    this.maxSpeed = ...;
    this.maxForce = ...;
  }

  show() { /* custom drawing only */ }
  // DO NOT override update() unless strictly necessary
}
```

**Steering forces are computed and applied in a manager class or in sketch.js:**

```javascript
let force = entity.seek(target); // returns a p5.Vector force
entity.applyForce(force); // accumulates into this.acc
entity.update(); // vel += acc, pos += vel, acc = 0
entity.show(); // draw
entity.edges(); // wrap around canvas edges
```

Available steering methods on every Vehicle (already implemented):

- `seek(target, arrival, d)` — seek or arrive at a position vector
- `arrive(target, d)` — alias for seek with arrival=true
- `flee(target)` — ⚠️ stub, needs implementation
- `pursue(vehicle)` — predict future position then seek
- `evade(vehicle)` — inverse of pursue
- `wander()` — random organic wandering
- `boundaries(bx, by, bw, bh, d)` — stay inside a rectangle

**Static debug flag:** `Vehicle.debug = true` draws all debug visuals.

---

## Current Behaviors Implemented

| Behavior      | File                           | Notes                                              |
| ------------- | ------------------------------ | -------------------------------------------------- |
| Seek / Arrive | `vehicle.js`                   | fully working, `d` param offsets stopping distance |
| Wander        | `vehicle.js`                   | uses circle-ahead + wanderTheta                    |
| Pursue        | `vehicle.js`                   | predicts 10 frames ahead                           |
| Evade         | `vehicle.js`                   | inverts pursue                                     |
| Boundaries    | `vehicle.js`                   | billiard-ball reflection at canvas edges           |
| Snake chain   | `Snake.js` + `SnakeSegment.js` | head arrives at mouse, body follows chain          |
| **Flee**      | `vehicle.js`                   | ⚠️ stub — `flee()` body is empty, needs coding     |

---

## Behaviors To Implement Next (Course Roadmap)

Work through these in order. Each one should be a new file unless noted.

### 1. `Flee` — complete the stub in vehicle.js... wait, we can't edit vehicle.js.

> **Workaround:** implement `flee` by overriding it in a subclass, or handle it
> in the manager (multiply seek force by -1 on the desired velocity, not the force).
> The correct Reynolds formula: `flee = normalize(pos - target) * maxSpeed - vel`

### 2. `Boid.js` — flocking simulation

Three neighborhood behaviors combined with weights:

- **Separation** — steer away from nearby boids (force ∝ 1/distance)
- **Alignment** — steer toward average velocity of neighbors
- **Cohesion** — steer toward average position of neighbors (= seek centroid)

```javascript
class Boid extends Vehicle {
  flock(boids) {
    let sep = this.separate(boids); // weight ~1.5
    let ali = this.align(boids); // weight ~1.0
    let coh = this.cohere(boids); // weight ~1.0
    sep.mult(1.5);
    this.applyForce(sep);
    this.applyForce(ali);
    this.applyForce(coh);
  }
}
```

### 3. `Obstacle.js` — circular obstacle avoidance

- Obstacle has `pos` (p5.Vector) and `r` (radius)
- Vehicle projects a "look-ahead" vector: `ahead = pos + normalize(vel) * MAX_SEE_AHEAD`
- If `dist(ahead, obstacle.pos) < obstacle.r`, compute avoidance force:
  `avoidanceForce = normalize(ahead - obstacle.pos) * maxForce`
- Use `ahead` and `ahead2` (half length) to handle vehicle-inside-obstacle edge case

### 4. `BouncingBall.js` — extends Target (which extends Vehicle)

Bounces off canvas edges by reflecting velocity components.

### 5. Path Following (future)

Uses scalar projection to find nearest point on path, then seeks a point ahead on the path.

---

## sketch.js Conventions

`sketch.js` should stay thin — only:

- `preload()` — load font
- `setup()` — create canvas, instantiate top-level objects
- `draw()` — clear background, call `.update()` and `.show()` on all entities
- `keyPressed()` — toggle debug, switch modes
- `mousePressed()` — interact (flee trigger, add obstacles, etc.)
- `windowResized()` — resize canvas

**Do not put steering logic in sketch.js.** It belongs in the entity classes.

---

## p5.js Reminders

```javascript
// Vector math (static = non-destructive)
p5.Vector.sub(a, b); // returns new vector, doesn't modify a or b
p5.Vector.dist(a, b); // distance between two positions
p5.Vector.random2D(); // random unit vector

// Instance methods (mutate in place)
v.add(other);
v.setMag(n); // set length to n
v.limit(n); // cap length at n
v.normalize(); // length = 1
v.heading(); // angle in radians vs X axis
v.copy(); // clone before mutating!

// Mapping
map(val, inMin, inMax, outMin, outMax);
constrain(val, lo, hi);
lerp(start, stop, t); // t in [0,1]
lerpColor(c1, c2, t);
```

---

## How To Add a New Entity

1. Create `MyEntity.js` in the project root
2. Write `class MyEntity extends Vehicle { ... }`
3. Add `<script src="MyEntity.js"></script>` in `index.html` **before** `sketch.js`
   and **after** any class it depends on
4. In `sketch.js`, instantiate and call `.update()` + `.show()` each frame

That's it. No imports, no exports — p5.js uses global scope.

---

## Debug Mode

Press **D** in the browser to toggle `Vehicle.debug = true`.
This renders: wander circles, braking zones, look-ahead vectors, boundary rectangles.
Use it when tuning behavior parameters.

---

## Critical safety rules

1. Never edit `vehicle.js` under any circumstance.
2. Never redefine p5.js globals or built-ins such as:
   `createVector`, `random`, `map`, `width`, `height`, `mouseX`, `mouseY`.
3. Preserve exact filename casing in `index.html`.
4. One class per file.
5. Do not put gameplay logic in `index.html`.
6. Keep `sketch.js` thin: setup, draw, input, resize only.
7. New entity classes must extend `Vehicle` unless explicitly told otherwise.
8. If a needed function does not exist, create a new class or method in a new file — do not fake or override framework functions.
9. Before editing `index.html`, inspect existing filenames and match them exactly.
10. Never remove existing working functionality unless explicitly asked.

---

## Project-specific rules for Deep Descent

- The game world is 2000x3000.
- The camera follows the player.
- The player moves in world coordinates, not screen coordinates.
- The project is a single-player fish survival game using steering behaviors.
- Use Reynolds-style steering logic wherever appropriate.
- Prefer simple, readable game logic over large abstractions.
- Build features incrementally and keep each step playable.

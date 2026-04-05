class Particle {
  constructor(x, y, col) {
    this.pos = createVector(x, y);
    // Random burst direction
    this.vel = p5.Vector.random2D().mult(random(1.5, 5));
    this.acc = createVector(0, 0.06); // slight gravity drift downward
    this.size = random(4, 12);
    this.alpha = 255;
    this.decay = random(6, 12); // how fast it fades
    this.col = col; // [r, g, b]
    this.spin = random(-0.15, 0.15);
    this.angle = random(TWO_PI);
  }

  update() {
    this.vel.add(this.acc);
    this.vel.mult(0.92); // drag — slows down naturally
    this.pos.add(this.vel);
    this.alpha -= this.decay;
    this.angle += this.spin;
    this.size *= 0.97; // shrinks slightly
  }

  isDead() {
    return this.alpha <= 0 || this.size < 1;
  }

  show() {
    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.angle);
    noStroke();
    fill(this.col[0], this.col[1], this.col[2], this.alpha);
    // Mix of circle and diamond shapes
    if (this.size > 7) {
      // Diamond shape for bigger particles
      beginShape();
      vertex(0, -this.size * 0.6);
      vertex(this.size * 0.4, 0);
      vertex(0, this.size * 0.6);
      vertex(-this.size * 0.4, 0);
      endShape(CLOSE);
    } else {
      circle(0, 0, this.size);
    }
    // Bright white core on large particles
    if (this.size > 6 && this.alpha > 150) {
      fill(255, 255, 255, this.alpha * 0.4);
      circle(0, 0, this.size * 0.35);
    }
    pop();
  }
}


class GameManager {
  constructor(zoneManager) {
    this.zoneManager = zoneManager;
    this.player = new PlayerFish(1000, 1500, fishSprites);
    this.aiFish = [];
    this.current = createVector(0.015, 0.005); // gentle ocean current drift (weaker)
    this.gameState = 'start'; // 'start', 'playing', 'dying', 'gameover', 'won'
    this.initialFishCount = 20;
    this.maxFishCount = 25;
    this.winSize = 80;
    this.eatEvents = [];
    this.currentZone = this.zoneManager.getZoneName(this.player.pos.y);
    this.zoneTransitionMessage = '';
    this.zoneTransitionTimer = 0;
    this.timeLimit = 120 * 60; // 2 minutes in frames (120s × 60fps)
    this.timer = this.timeLimit;
    this.timerRunning = false;
    this.obstacles = [];
    this.leaderGroup  = null;  // { leader, followers[] }
    this.boss         = null;
    this.bossActive   = false;
    this.bossThreshold = 55; // player size that triggers boss
    this.bossSpawned  = false;
    this.leaderActive = false;  
    this.decorations = new Decoration(algaeImages);
    this.spawnFish();
    this.spawnObstacles();
    this.particles = [];
    this.dyingTimer = 0;
    this.deathCause = '';
    this.bossMessage = '';
    this.bossMessageTimer = 0;  
  }

  spawnFish() {
    // Divide world into 4 depth bands matching zones
    let bands = [
      { min: 0, max: 700 },      // Surface
      { min: 700, max: 1500 },   // Twilight
      { min: 1500, max: 2300 },  // Midnight
      { min: 2300, max: 3000 }   // Abyss
    ];
    let fishPerBand = Math.floor(this.initialFishCount / 4);
    let remainder = this.initialFishCount % 4;

    // Spawn roughly equal counts per band
    for (let b = 0; b < bands.length; b++) {
      let count = fishPerBand + (b < remainder ? 1 : 0);
      for (let i = 0; i < count; i++) {
        let x = random(0, 2000);
        let y = random(bands[b].min, bands[b].max);
        let fish = this.createFishForDepth(x, y);
        this.aiFish.push(fish);
      }
    }
  }

  spawnBoss() {
    let angle  = random(TWO_PI);
    let spawnX = constrain(this.player.pos.x + cos(angle) * 500, 150, 1850);
    let spawnY = constrain(this.player.pos.y + sin(angle) * 500, 150, 2850);
    this.boss        = new BossShark(spawnX, spawnY);
    this.bossActive  = true;
    this.bossSpawned = true;

    // Boss arrival message
    this.bossMessage      = 'THE DEEP';
    this.bossMessageTimer = 300; // 5 seconds
    this.bossMessagePhase = 0;   // 0=title, 1=subtitle
  }

  createFishForDepth(x, y) {
    let zone = this.zoneManager.getZone(y);
    let type, size;
    if (zone.name === 'Surface') {
      type = random(['prey', 'prey', 'neutral']); // mostly prey
      size = random(10, 20);
    } else if (zone.name === 'Twilight') {
      type = random(['prey', 'neutral', 'predator']); // mix
      size = random(15, 25);
    } else if (zone.name === 'Midnight') {
      type = random(['neutral', 'predator', 'predator']); // more predator
      size = random(20, 30);
    } else { // Abyss
      type = random(['predator', 'predator']); // mostly predator
      size = random(25, 35);
    }
    let depthFactor = y / 3000;
    return new AIFish(x, y, type, size, depthFactor);
  }

  spawnObstacles() {
    this.obstacles = [];
    for (let i = 0; i < 15; i++) {
      let x, y;
      do {
        x = random(0, 2000);
        y = random(0, 3000);
      } while (x > 900 && x < 1100 && y > 1400 && y < 1600);

      // Deeper wreckage is larger and more imposing
      let depthFactor = y / 3000;
      let radius = random(
        lerp(18, 28, depthFactor),
        lerp(32, 55, depthFactor)
      );
      this.obstacles.push(new Obstacle(x, y, radius));
    }
  }

  spawnLeaderGroup() {
    // Pick a random neutral fish as leader — or create one
    let leader = new AIFish(
      random(200, 1800),
      random(300, 1200), // spawn in surface/twilight zone
      'neutral',
      random(22, 28),
      0.2
    );
    leader.isLeader   = true;
    leader.maxSpeed   = 2.2;
    leader.maxForce   = 0.08;

    // Create 5-8 followers (prey type, slightly smaller)
    let followers = [];
    let count     = floor(random(5, 9));
    for (let i = 0; i < count; i++) {
      let f = new AIFish(
        leader.pos.x + random(-80, 80),
        leader.pos.y + random(-80, 80),
        'prey',
        random(10, 18),
        0.1
      );
      f.leaderRole = true;
      f._buildLeaderBehaviors();
      followers.push(f);
      this.aiFish.push(f);
    }

    this.aiFish.push(leader);
    this.leaderGroup  = { leader, followers };
    this.leaderActive = true;
  }

  toggleLeaderGroup() {
    if (this.leaderActive && this.leaderGroup) {
      // Remove all from aiFish
      this.aiFish = this.aiFish.filter(f =>
        f !== this.leaderGroup.leader &&
        !this.leaderGroup.followers.includes(f)
      );
      this.leaderGroup  = null;
      this.leaderActive = false;
    } else {
      this.spawnLeaderGroup();
    }
  }

  update(mouseWorldPos) {
    // Countdown timer
    if (this.timerRunning && this.gameState === 'playing') {
      this.timer--;
      if (this.timer <= 0) {
        this.timer = 0;
        this.timerRunning = false;
        this.gameState   = 'dying';
        this.player.triggerDeath();
        this.dyingTimer  = 0;
        this.deathCause  = 'timeout';
        triggerShake(18, 45);
      }
    }

    // Handle dying state — wait for death animation then go to gameover
    if (this.gameState === 'dying') {
      this.timerRunning = false; // ensure timer stops
      this.dyingTimer++;
      this.player.updateDeathAnimation();
      // Death anim is 7 frames at fps 5 = ~84 game frames, wait 100 to be safe
      if (this.dyingTimer > 150 || this.player.anims.death?.done) {
        this.gameState = 'gameover';
        this.timerRunning = false;
      }
      return; // skip all other updates while dying
    }

    if (this.gameState !== 'playing') return;
    // Decrement boss message timer
    if (this.bossMessageTimer > 0) {
      this.bossMessageTimer--;
    }

    // Leader group update
    if (this.leaderActive && this.leaderGroup) {
      let leader    = this.leaderGroup.leader;
      let followers = this.leaderGroup.followers;

      let leaderForce = leader.wander();
      leader.applyForce(leaderForce);
      let lBoundary = leader.boundaries(0, 0, 2000, 3000, leader.size * 2 + 30);
      leader.applyForce(lBoundary);
      leader.update();
      leader.pos.x = constrain(leader.pos.x, 50, 1950);
      leader.pos.y = constrain(leader.pos.y, 50, 2950);

      for (let f of followers) {
        if (!this.aiFish.includes(f)) continue;
        f.bm.behaviors['leader_follow'].fn =
          () => f.computeLeaderForce(leader, followers);
        let force = f.bm.getSteeringForce();
        f.applyForce(force);
        f.update();
        f.pos.x = constrain(f.pos.x, 50, 1950);
        f.pos.y = constrain(f.pos.y, 50, 2950);
      }

      this.leaderGroup.followers =
        this.leaderGroup.followers.filter(f => this.aiFish.includes(f));

      if (this.leaderGroup.followers.length === 0) {
        this.leaderActive = false;
      }
    }
    
    // Pause countdown during boss arrival cinematic
    if (this.bossMessageTimer > 0 && this.timerRunning) {
      this.timer++; // add back the frame that was decremented
    }

    // Boss spawn trigger 
    if (!this.bossSpawned &&
        this.player.getRadius() >= this.bossThreshold) {
      this.spawnBoss();
      triggerShake(12, 60);
    }

    // Boss update 
    if (this.bossActive && this.boss) {
      let bossForce = this.boss.computeForce(this.player);
      this.boss.applyForce(bossForce);
      this.boss.update();
      this.boss.pos.x = constrain(this.boss.pos.x, 100, 1900);
      this.boss.pos.y = constrain(this.boss.pos.y, 100, 2900);

      // Boss catches player — game over
      let bDist = p5.Vector.dist(this.player.pos, this.boss.pos);
      if (bDist < this.player.getRadius() + this.boss.getRadius() * 0.7) {
        if (this.player.getRadius() >= this.winSize) {
          // Player is big enough — WIN
          this.gameState = 'won';
        } else {
          // Boss eats player
          this.gameState = 'dying';
          this.player.triggerDeath();
          this.dyingTimer  = 0;
          this.deathCause  = 'eaten';
          triggerShake(25, 60);
        }
      }

      // Dash near boss — boss retreats briefly
      if (this.player.dashDuration > 0) {
        let dashDist = p5.Vector.dist(this.player.pos, this.boss.pos);
        if (dashDist < this.boss.size * 2) {
          this.boss.triggerRetreat();
        }
      }
    }

    // Track zone transitions
    let newZone = this.zoneManager.getZoneName(this.player.pos.y);
    if (newZone !== this.currentZone) {
      this.currentZone = newZone;
      this.zoneTransitionMessage = newZone;
      this.zoneTransitionTimer = 180; // 3 seconds at 60fps
    }

    // Decrement zone transition timer
    if (this.zoneTransitionTimer > 0) {
      this.zoneTransitionTimer--;
    }

    // Player: apply arrive and boundary, then update
    if (mouseWorldPos) {
      let arriveForce = this.player.arrive(mouseWorldPos);
      this.player.applyForce(arriveForce);
    }

    // Player boundary — margin based on actual display size
    let playerMargin = this.player.size * 2.6 + 20;
    let boundaryForce = this.player.boundaries(
      0, 0, 2000, 3000, playerMargin
    );
    this.player.applyForce(boundaryForce);

    for (let obs of this.obstacles) {
      this.player.applyForce(obs.computeAvoidanceForce(this.player));
    }
    this.player.update();

    // Update hunger — returns true if starved to death
    let starved = this.player.updateHunger();
    if (starved) {
      this.gameState = 'dying';
      this.player.triggerDeath();
      this.dyingTimer = 0;
      this.deathCause = 'starved'; // track cause for HUD
      triggerShake(18, 45);
    }

    // Hard clamp player inside world bounds
    let pm = this.player.size * 2;
    this.player.pos.x = constrain(this.player.pos.x, pm, 2000 - pm);
    this.player.pos.y = constrain(this.player.pos.y, pm, 3000 - pm);

    // AI fish: apply current + behavior + boundary, then update
    let preyFish = this.aiFish.filter(f => f.type === 'prey');
    for (let fish of this.aiFish) {

      // Skip leader and followers — they are updated separately above
      if (this.leaderActive && this.leaderGroup) {
        if (fish === this.leaderGroup.leader) continue;
        if (this.leaderGroup.followers.includes(fish)) continue;
      }

      // Apply gentle ocean current to AI fish only
      fish.applyForce(this.current);

      let preyArray = (fish.type === 'prey') ? preyFish : null;
      let behaviorForce = fish.computeBehaviorForceBM(this.player, preyArray);
      fish.applyForce(behaviorForce);

      for (let obs of this.obstacles) {
        fish.applyForce(obs.computeAvoidanceForce(fish));
      }
      fish.update();
      let fm = fish.size * 1.5;
      fish.pos.x = constrain(fish.pos.x, fm, 2000 - fm);
      fish.pos.y = constrain(fish.pos.y, fm, 3000 - fm);
    }

    // Check collisions
    this.checkCollisions();

    // Gradual refill
    if (this.aiFish.length < this.maxFishCount) {
      let x = random(0, 2000);
      let y = random(0, 3000);
      let fish = this.createFishForDepth(x, y);
      this.aiFish.push(fish);
    }
  }

  checkCollisions() {
    for (let i = this.aiFish.length - 1; i >= 0; i--) {
      let fish = this.aiFish[i];
      let dist = p5.Vector.dist(this.player.pos, fish.pos);
      let combinedRadius = this.player.getRadius() + fish.getRadius();

      if (dist < combinedRadius) {
        if (this.player.getRadius() > fish.getRadius() * 1.2) {
          // Player eats fish with curve-based growth
          let ratio = fish.getRadius() / this.player.getRadius();
          let growAmount = fish.getRadius() * 0.1 + ratio * fish.getRadius() * 0.4;
          this.player.grow(growAmount);
          let feedAmount = map(fish.getRadius(), 10, 35, 8, 25);
          this.player.feed(feedAmount);
          triggerShake(5, 12); // small shake on eating
          this.player.triggerEat();
          
          if (this.player.getRadius() >= this.winSize && !this.bossSpawned) {
            this.gameState = 'won'; // win before boss spawns (shouldn't happen now)
          }
          // Determine particle color based on eaten fish type
          let col;
          if (fish.type === 'prey')         
            col = [255, 200, 80];   // golden
          else if (fish.type === 'neutral') 
            col = [100, 255, 160];  // green
          else                              
            col = [255, 100, 100];  // red

          // Burst count scales with fish size — big fish = more particles
          let burstCount = floor(map(fish.getRadius(), 10, 35, 8, 22));

          for (let p = 0; p < burstCount; p++) {
            this.particles.push(new Particle(fish.pos.x, fish.pos.y, col));
          }

          // Keep the eat event for the expanding ring effect
          this.eatEvents.push({
            x: fish.pos.x,
            y: fish.pos.y,
            timer: 20
          });

          this.aiFish.splice(i, 1);
        } else if (fish.type === 'predator' && fish.getRadius() > this.player.getRadius() * 1.2) {
          this.gameState = 'dying';
          this.player.triggerDeath();
          this.dyingTimer = 0;
          this.deathCause = 'eaten'; // track cause for HUD
          triggerShake(18, 45); // big shake on death
        }
      }
    }
    // Proximity shake — predator breathing down your neck
    for (let fish of this.aiFish) {
      if (fish.type === 'predator' && fish.getRadius() > this.player.getRadius() * 1.2) {
        let d = p5.Vector.dist(this.player.pos, fish.pos);
        if (d < this.player.getRadius() + fish.getRadius() + 30) {
          triggerShake(4, 8); // small persistent shake when danger is very close
        }
      }
    }

  }

  getTimeSurvived() {
    let survived = this.timeLimit - this.timer;
    return Math.floor(survived / 60); // seconds survived
  }

  show() {
    this.decorations.show();
    for (let obs of this.obstacles) {
      obs.show();
    }

    // Draw player in both playing and dying states
    if (this.gameState === 'playing' || this.gameState === 'dying') {
      this.player.show();
    }

    for (let fish of this.aiFish) {
      fish.show(this.player.getRadius());
    }

    // Draw leader group visuals
    if (this.leaderActive && this.leaderGroup) {
      let leader    = this.leaderGroup.leader;
      let followers = this.leaderGroup.followers;

      // Draw connection lines from followers to leader
      push();
      stroke(255, 220, 80, 30);
      strokeWeight(1);
      for (let f of followers) {
        if (this.aiFish.includes(f)) {
          line(f.pos.x, f.pos.y, leader.pos.x, leader.pos.y);
        }
      }
      pop();

      // Draw crown above leader
      leader.showLeaderMark();
    }

    // Draw boss
    if (this.bossActive && this.boss) {
      this.boss.show();
      this.boss.showHealthBar(this.player.getRadius(), this.winSize);
    }
    
    // Draw expanding ring eat events
    for (let i = this.eatEvents.length - 1; i >= 0; i--) {
      let event = this.eatEvents[i];
      let alpha  = map(event.timer, 0, 20, 0, 180);
      let radius = map(event.timer, 20, 0, 0, 60);

      push();
      noFill();
      stroke(255, 255, 200, alpha);
      strokeWeight(map(event.timer, 20, 0, 3, 0.5));
      circle(event.x, event.y, radius * 2);
      pop();

      event.timer--;
      if (event.timer < 0) this.eatEvents.splice(i, 1);
    }

    // Draw and update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      let p = this.particles[i];
      p.update();
      p.show();
      if (p.isDead()) this.particles.splice(i, 1);
    }
  }

  showDebug() {
    this.player.showDebug();
    for (let fish of this.aiFish) {
      fish.showDebug(this.player.getRadius());
    }
    for (let obs of this.obstacles) {
      obs.showDebug();
    }
  }

  getPlayer() {
    return this.player;
  }

  getElapsedSeconds() {
    return Math.ceil(this.timer / 60);
  }

  isGameOver() {
    return this.gameState === 'gameover';
  }

  isStartScreen() {
    return this.gameState === 'start';
  }

  isWon() {
    return this.gameState === 'won';
  }

  startGame() {
    this.gameState = 'playing';
    this.timerRunning = true;
  }

  restart() {
    this.player = new PlayerFish(1000, 1500, fishSprites);
    this.aiFish = [];
    this.eatEvents = [];
    this.gameState = 'playing';
    this.timer = this.timeLimit;
    this.timerRunning = false;
    // call startGame behavior inline:
    this.timerRunning = true;
    this.dyingTimer = 0;
    this.deathCause = '';
    this.currentZone = this.zoneManager.getZoneName(this.player.pos.y);
    this.zoneTransitionMessage = '';
    this.zoneTransitionTimer = 0;
    this.spawnFish();
    this.spawnObstacles();
    this.particles = [];
    this.leaderGroup  = null;
    this.leaderActive = false;
    this.boss = null;
    this.bossActive  = false;
    this.bossSpawned = false;
    this.bossMessageTimer = 0;
    this.bossMessagePhase = 0;
  }
}
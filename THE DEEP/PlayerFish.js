class PlayerFish extends Vehicle {
  constructor(x, y, sprites = {}) {
    super(x, y);
    this.size = 20;
    this.maxSpeed = 3;
    this.maxForce = 0.1;
    this.hunger       = 100;   // current hunger 0-100
    this.maxHunger    = 100;
    this.hungerDecay  = 0.008; // how fast hunger drains per frame
    this.isStarving   = false; // true when hunger < 20
    this.sprites = sprites;

    this.dashCooldown = 0;
    this.dashDuration = 0;
    this.normalMaxSpeed = 3;
    this.dashMaxSpeed = 7;

    this._flipCooldown = 0;
    this._flipCooldownFrames = 60; // wait 60 frames before allowing another flip

    // Animation state
    this.state = 'idle';
    this.facingLeft = true;
    this.flipPlaying = false;

    // Direction change debounce — only trigger flip if
    // direction is stable for N frames to avoid jitter
    this._directionBuffer = 0;
    this._pendingDirection = null;
    this._directionStableFrames = 35; // frames of stable direction before flipping

    // Build SpriteSheet objects
    this.anims = {};

    if (sprites.idle) {
      this.anims.idle = new SpriteSheet(sprites.idle, 250, 240, 8, 6);
      this.anims.idle.setLooping(true);
    }
    if (sprites.eating) {
      this.anims.eating = new SpriteSheet(sprites.eating, 333, 327, 6, 8);
      this.anims.eating.setLooping(false);
    }
    if (sprites.dash) {
      this.anims.dash = new SpriteSheet(sprites.dash, 400, 400, 5, 8);
      this.anims.dash.setLooping(false);
    }
    if (sprites.flip) {
      this.anims.flip = new SpriteSheet(sprites.flip, 285, 280, 7, 18);
      this.anims.flip.setLooping(false);
    }
    if (sprites.death) {
      this.anims.death = new SpriteSheet(sprites.death, 285, 280, 7, 6);
      this.anims.death.setLooping(false);
    }
    if (sprites.swim_up) {
      this.anims.swim_up = new SpriteSheet(sprites.swim_up, 333, 327, 6, 8);
      this.anims.swim_up.setLooping(true);
    }
    if (sprites.swim_down) {
      this.anims.swim_down = new SpriteSheet(sprites.swim_down, 333, 327, 6, 8);
      this.anims.swim_down.setLooping(true);
    }

    // Vertical state debounce
    this._verticalBuffer = 0;
    this._verticalThreshold = 10; // frames before switching to up/down
  }

  triggerEat() {
    if (this.anims.eating && this.state !== 'death') {
      this.state = 'eating';
      this.anims.eating.reset();
    }
  }

  triggerDeath() {
    this.state = 'death';
    if (this.anims.death) this.anims.death.reset();
  }

  triggerDash() {
    if (this.anims.dash &&
        this.state !== 'death' &&
        this.state !== 'eating') {
      this.state = 'dash';
      this.anims.dash.reset();
    }
  }

  _updateDirectionDebounce() {

    // Decay flip cooldown
    if (this._flipCooldown > 0) {
      this._flipCooldown--;
      return; // block any new flip while cooling down
    }

    // Only count direction when fish is actually moving
    if (this.vel.mag() < 1.8) return;

    let movingLeft = this.vel.x < 0;

    // During dash — snap direction immediately, no flip animation
    if (this.state === 'dash') {
      this.facingLeft = movingLeft;
      this._directionBuffer = 0;
      this._pendingDirection = null;
      return;
    }

    if (movingLeft !== this.facingLeft) {
      // Direction differs from current facing
      if (this._pendingDirection === movingLeft) {
        this._directionBuffer++;
      } else {
        // New pending direction — reset buffer
        this._pendingDirection = movingLeft;
        this._directionBuffer = 1;
      }

      // Only commit the flip after N stable frames
      if (this._directionBuffer >= this._directionStableFrames &&
          !this.flipPlaying &&
          this.state !== 'death' &&
          this.state !== 'eating') {
        this._directionBuffer = 0;
        this._pendingDirection = null;

        if (this.anims.flip) {
          this.state = 'flip';
          this.anims.flip.reset();
          this.flipPlaying = true;
        } else {
          // No flip anim — just snap direction
          this.facingLeft = movingLeft;
        }
      }
    } else {
      // Moving in current facing direction — reset buffer
      this._directionBuffer = 0;
      this._pendingDirection = null;
    }
  }

  updateAnimation() {
    this._updateDirectionDebounce();

    if (this.state === 'flip') {
      this.facingLeft = this._pendingDirection !== null
        ? this._pendingDirection
        : (this.vel.x < 0);
      this.flipPlaying = false;
      this._flipCooldown = this._flipCooldownFrames; // ADD THIS LINE
    }

    // Priority: death > eating > dash > flip > swim_up/down > idle
    // Only switch to up/down if no higher priority anim is active
    let highPriority = ['death', 'eating', 'dash', 'flip'];
    let isHighPriority = highPriority.includes(this.state);

    if (!isHighPriority) {
      let vy = this.vel.y;
      let vx = abs(this.vel.x);
      let speed = this.vel.mag();

      // Only trigger vertical if moving fast enough
      // and vertical component is dominant enough
      if (speed > 0.5 && abs(vy) > 0.8) {
        this._verticalBuffer++;
      } else {
        this._verticalBuffer = max(0, this._verticalBuffer - 2); // decay faster
      }

      if (this._verticalBuffer >= this._verticalThreshold) {
        // Sustained vertical movement — pick up or down
        if (this.vel.y < 0 && this.anims.swim_up) {
          if (this.state !== 'swim_up') {
            this.state = 'swim_up';
            this.anims.swim_up.reset();
          }
        } else if (this.vel.y > 0 && this.anims.swim_down) {
          if (this.state !== 'swim_down') {
            this.state = 'swim_down';
            this.anims.swim_down.reset();
          }
        }
      } else if (this._verticalBuffer === 0 &&
                (this.state === 'swim_up' || this.state === 'swim_down')) {
        // Vertical movement stopped — return to idle
        this.state = 'idle';
        if (this.anims.idle) this.anims.idle.reset();
      }
    }

    let anim = this.anims[this.state] || this.anims.idle;
    if (!anim) return;

    anim.update();

    if (anim.done && this.state !== 'idle') {
      if (this.state === 'death') return; // stay on last frame forever
      if (this.state === 'flip') {
        this.facingLeft = this._pendingDirection !== null
          ? this._pendingDirection
          : (this.vel.x < 0);
        this.flipPlaying = false;
        this._flipCooldown = this._flipCooldownFrames;
      }
      this.state = 'idle';
      if (this.anims.idle) this.anims.idle.reset();
    }
  }

  show() {
    this.updateDash();
    this.updateAnimation();

    let displayW = this.size * 5.2;
    let displayH = this.size * 4.2;

    push();
    translate(this.pos.x, this.pos.y);

    // Subtle vertical tilt — only when in idle or dash, not up/down
    if (this.state !== 'swim_up' && this.state !== 'swim_down') {
      let tiltAngle = constrain(this.vel.y * 0.06, -0.3, 0.3);
      rotate(tiltAngle);
    }

    // Glow in deep zones
    if (this.pos.y > 1500) {
      drawingContext.shadowColor = 'rgba(100, 150, 255, 0.6)';
      drawingContext.shadowBlur = 15;
    }

    try {
      let anim = this.anims[this.state] || this.anims.idle;
      if (anim && anim.img && anim.img.width > 0) {
        anim.draw(displayW, displayH, this.facingLeft);
      } else {
        this._drawFallback();
      }
    } finally {
      drawingContext.shadowBlur = 0;
      drawingContext.shadowColor = 'rgba(0,0,0,0)';
    }

    // Size label
    push();
    textAlign(CENTER, BOTTOM);
    textSize(max(10, this.size * 0.7));
    noStroke();
    fill(255);
    text(this.size.toFixed(0), 0, -displayH / 2 - 4);
    pop();

    pop();
  }

  _drawFallback() {
    fill(100, 150, 255);
    stroke(50, 100, 200);
    strokeWeight(2);
    if (!this.facingLeft) scale(-1, 1);
    ellipse(0, 0, this.size * 2, this.size * 1.4);
    fill(80, 120, 240);
    noStroke();
    triangle(
      -this.size, 0,
      -this.size * 1.6, -this.size * 0.4,
      -this.size * 1.6,  this.size * 0.4
    );
  }

  showDebug() {
    push();
    translate(this.pos.x, this.pos.y);
    stroke(0, 255, 100);
    strokeWeight(2);
    noFill();
    circle(0, 0, this.size * 2);
    pop();
  }

  getRadius() { return this.size; }

  grow(amount) {
    this.size += amount;
    this.maxSpeed = max(1.5, this.maxSpeed - 0.05);
  }

  updateDeathAnimation() {
    let anim = this.anims['death'];
    if (anim && !anim.done) {
      anim.update();
    }
  }

  dash() {
  if (this.dashCooldown > 0) return; // still on cooldown
  this.triggerDash();
  this.dashDuration = 40;   // frames of boosted speed
  this.dashCooldown = 180;  // 3 second cooldown
}

  updateDash() {
    if (this.dashDuration > 0) {
      this.maxSpeed = this.dashMaxSpeed;
      this.dashDuration--;
    } else {
      this.maxSpeed = max(this.normalMaxSpeed, this.maxSpeed - 0.1);
    }
    if (this.dashCooldown > 0) this.dashCooldown--;
  }

  updateHunger() {
    this.hunger -= this.hungerDecay;
    this.hunger  = max(0, this.hunger);
    this.isStarving = this.hunger < 20;

    // When starving, slow down slightly
    if (this.isStarving) {
      this.normalMaxSpeed = max(1.0, this.normalMaxSpeed - 0.0005);
    }

    return this.hunger <= 0; // returns true if dead from starvation
  }

  feed(amount) {
    this.hunger = min(this.maxHunger, this.hunger + amount);
    this.isStarving = this.hunger < 20;
    // Restore speed if was starving
    this.normalMaxSpeed = 3;
  }
}
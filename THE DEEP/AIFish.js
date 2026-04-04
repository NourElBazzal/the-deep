class AIFish extends Vehicle {
  constructor(x, y, type, size, depthFactor = 0, img = null) {
    super(x, y);
    this.img = img;
    this.type = type; // 'prey', 'neutral', 'predator'
    this.size = size;
    this.depthFactor = depthFactor; // 0 to 1 based on y/3000
    
    // Set maxSpeed based on base and depth factor
    this.maxSpeed = random(1.5, 2.5) + depthFactor;
    this.maxForce = 0.05;
    this.fleeDistance = 180;
    this.pursueDistance = 220;
    this.neighborDist = 50;
    
    // Calculate aggression multiplier for predators
    if (this.type === 'predator') {
      this.aggressionMultiplier = 1.0 + (this.size / 35) * 0.5;
    } else {
      this.aggressionMultiplier = 1.0;
    }

    // Build BehaviorManager for this fish
    this.bm = new BehaviorManager(this);
    this._buildBehaviors();

  }

  computeBehaviorForce(player, preyArray = null) {
    let force = createVector(0, 0);

    if (this.type === 'prey') {
      // Wander normally
      force = this.wander();
      // Add flocking if preyArray provided
      if (preyArray) {
        let flockForce = this.flock(preyArray);
        force.add(flockForce);
      }
      // Flee completely overrides wander when threatened
      if (player && player.getRadius() > this.size && p5.Vector.dist(this.pos, player.pos) < this.fleeDistance) {
        force = this.computeFleeForce(player.pos);
      }
    } else if (this.type === 'neutral') {
      // Just wander
      force = this.wander();
    } else if (this.type === 'predator') {
      // Wander normally, but pursue if player is smaller and close
      force = this.wander();
      let adjustedPursueDistance = this.pursueDistance * this.aggressionMultiplier;
      if (player && player.getRadius() < this.size && p5.Vector.dist(this.pos, player.pos) < adjustedPursueDistance) {
        let pursueForce = this.pursue(player);
        force.add(pursueForce);
      }
    }

    return force;
  }

  computeFleeForce(targetPos) {
    let desired = p5.Vector.sub(this.pos, targetPos);
    desired.setMag(this.maxSpeed);
    let steer = p5.Vector.sub(desired, this.vel);
    steer.limit(this.maxForce);
    return steer;
  }

  separate(boids) {
    let force = createVector(0, 0);
    let count = 0;
    for (let other of boids) {
      if (other !== this) {
        let d = p5.Vector.dist(this.pos, other.pos);
        if (d > 0 && d < this.neighborDist) {
          let diff = p5.Vector.sub(this.pos, other.pos);
          diff.normalize();
          diff.div(d); // weight by distance
          force.add(diff);
          count++;
        }
      }
    }
    if (count > 0) {
      force.div(count);
      force.normalize();
      force.mult(this.maxSpeed);
      force.sub(this.vel);
      force.limit(this.maxForce);
    }
    return force;
  }

  align(boids) {
    let sum = createVector(0, 0);
    let count = 0;
    for (let other of boids) {
      if (other !== this) {
        let d = p5.Vector.dist(this.pos, other.pos);
        if (d > 0 && d < this.neighborDist) {
          sum.add(other.vel);
          count++;
        }
      }
    }
    if (count > 0) {
      sum.div(count);
      sum.normalize();
      sum.mult(this.maxSpeed);
      let force = p5.Vector.sub(sum, this.vel);
      force.limit(this.maxForce);
      return force;
    }
    return createVector(0, 0);
  }

  cohere(boids) {
    let sum = createVector(0, 0);
    let count = 0;
    for (let other of boids) {
      if (other !== this) {
        let d = p5.Vector.dist(this.pos, other.pos);
        if (d > 0 && d < this.neighborDist) {
          sum.add(other.pos);
          count++;
        }
      }
    }
    if (count > 0) {
      sum.div(count);
      return this.seek(sum, false); // seek to center without arrival
    }
    return createVector(0, 0);
  }

  flock(boids) {
    let sep = this.separate(boids);
    let ali = this.align(boids);
    let coh = this.cohere(boids);
    sep.mult(1.4);
    ali.mult(0.8);
    coh.mult(0.6);
    let total = createVector(0, 0);
    total.add(sep);
    total.add(ali);
    total.add(coh);
    return total;
  }

  update() {
    super.update();
  }

  show(playerSize) {
    push();
    translate(this.pos.x, this.pos.y);
    if (this.vel.mag() > 0.1) {
      rotate(this.vel.heading());
    }

    // Color based on type
    if (this.type === 'prey') {
      fill(255, 200, 100);
      stroke(200, 150, 50);
    } else if (this.type === 'neutral') {
      fill(150, 255, 150);
      stroke(100, 200, 100);
    } else if (this.type === 'predator') {
      fill(255, 100, 100);
      stroke(200, 50, 50);
    }

    // Add glow effect for deep zones
    if (this.pos.y > 1500) {
      if (this.type === 'predator') {
        drawingContext.shadowColor = 'rgba(255, 100, 100, 0.6)';
      } else if (this.type === 'prey') {
        drawingContext.shadowColor = 'rgba(0, 255, 255, 0.6)';
      } else {
        drawingContext.shadowColor = 'rgba(150, 255, 150, 0.6)';
      }
      drawingContext.shadowBlur = 15;
    }

    strokeWeight(2);

    // Fish forms by type (width/detail)
    let widthFactor = 2.0;
    let bodyCurveY = this.size;
    if (this.type === 'predator') {
      widthFactor = 2.5;
      bodyCurveY = this.size * 1.2;
    } else if (this.type === 'prey') {
      widthFactor = 1.6;
      bodyCurveY = this.size * 0.8;
    } else if (this.type === 'neutral') {
      widthFactor = 2.0;
      bodyCurveY = this.size;
    }

    try {
      if (this.img) {
        imageMode(CENTER);
        if (this.vel.x < 0) scale(-1, 1);
        image(this.img, 0, 0, this.size * 2.5, this.size * 1.8);
      } else {
      
          beginShape();
          curveVertex(-this.size * widthFactor * 0.55, 0);
          curveVertex(-this.size * widthFactor * 0.55, 0);
          curveVertex(-this.size * 0.3, -bodyCurveY * 0.8);
          curveVertex(this.size * 0.7, -bodyCurveY * 0.4);
          curveVertex(this.size * 1.1, 0);
          curveVertex(this.size * 0.7, bodyCurveY * 0.4);
          curveVertex(-this.size * 0.3, bodyCurveY * 0.8);
          curveVertex(-this.size * widthFactor * 0.55, 0);
          curveVertex(-this.size * widthFactor * 0.55, 0);
          endShape();

          // Tail variations in same style
          noStroke();
          if (this.type === 'predator') {
            fill(230, 80, 80);
          } else if (this.type === 'prey') {
            fill(255, 220, 140);
          } else {
            fill(160, 255, 170);
          }
          triangle(-this.size * 0.9, 0, -this.size * 1.6, -this.size * 0.5, -this.size * 1.6, 0);
          triangle(-this.size * 0.9, 0, -this.size * 1.6, this.size * 0.5, -this.size * 1.6, 0);

          // Belly highlight
          noStroke();
          fill(255, 255, 255, 120);
          ellipse(this.size * 0.15, this.size * 0.05, this.size * 1.1, this.size * 0.55);

          // Small eye
          fill(255);
          ellipse(this.size * 0.5, -this.size * 0.1, this.size * 0.2, this.size * 0.2);
          fill(0);
          ellipse(this.size * 0.55, -this.size * 0.1, this.size * 0.08, this.size * 0.08);
        }
    } finally {
      drawingContext.shadowBlur = 0;
      drawingContext.shadowColor = 'rgba(0,0,0,0)';
    }

    // Size label above fish
    push();
    rotate(-this.vel.heading());
    textAlign(CENTER, BOTTOM);
    textSize(max(9, this.size * 0.7));
    noStroke();
    if (playerSize > this.size * 1.2) {
      fill(100, 255, 100);
    } else if (this.size > playerSize * 1.2) {
      fill(255, 80, 80);
    } else {
      fill(255, 255, 255);
    }
    text(this.size.toFixed(0), 0, -this.size - 4);
    pop();

    pop();
  }

  showDebug(playerSize) {
    push();
    translate(this.pos.x, this.pos.y);

    if (playerSize > this.size * 1.2) {
      stroke(0, 255, 100);
    } else if (this.type === 'predator' && this.size > playerSize * 1.2) {
      stroke(255, 100, 100);
    } else {
      stroke(255, 255, 0);
    }

    strokeWeight(2);
    noFill();
    circle(0, 0, this.size * 2);

    stroke(255, 255, 255, 50);
    strokeWeight(1);
    if (this.type === 'prey') {
      circle(0, 0, this.fleeDistance * 2);
    } else if (this.type === 'predator') {
      circle(0, 0, this.pursueDistance * 2);
    }

    pop();
  }

  getRadius() {
    return this.size;
  }

  _buildBehaviors() {
    // Register all behaviors with weights based on role
    if (this.type === 'prey') {
      this.bm
        .add('wander',    () => this.wander(),              1.0)
        .add('flock',     () => createVector(0, 0),         1.0) // filled at runtime
        .add('flee',      () => createVector(0, 0),         2.5) // filled at runtime
        .add('boundary',  () => this.boundaries(0, 0, 2000, 3000, this.size * 1.8 + 20), 1.5);

    } else if (this.type === 'neutral') {
      this.bm
        .add('wander',    () => this.wander(),              1.0)
        .add('boundary',  () => this.boundaries(0, 0, 2000, 3000, this.size * 1.8 + 20), 1.5);

    } else if (this.type === 'predator') {
      this.bm
        .add('wander',    () => this.wander(),              0.6)
        .add('pursue',    () => createVector(0, 0),         2.0) // filled at runtime
        .add('boundary',  () => this.boundaries(0, 0, 2000, 3000, this.size * 1.8 + 20), 1.5);
    }
}

// Update runtime behaviors that need external references
// then return the combined force
computeBehaviorForceBM(player, preyArray = null) {
  if (this.type === 'prey') {
    // Update flee force dynamically
    if (player &&
        player.getRadius() > this.size &&
        p5.Vector.dist(this.pos, player.pos) < this.fleeDistance) {
      this.bm.behaviors['flee'].fn = () => this.computeFleeForce(player.pos);
      this.bm.activate('flee');
      this.bm.deactivate('wander');
      this.bm.deactivate('flock');
    } else {
      this.bm.deactivate('flee');
      this.bm.activate('wander');
      this.bm.activate('flock');
      // Update flock force
      if (preyArray) {
        this.bm.behaviors['flock'].fn = () => this.flock(preyArray);
      }
    }

  } else if (this.type === 'predator') {
    let adjustedDist = this.pursueDistance * this.aggressionMultiplier;
    if (player &&
        player.getRadius() < this.size &&
        p5.Vector.dist(this.pos, player.pos) < adjustedDist) {
      this.bm.behaviors['pursue'].fn = () => this.pursue(player);
      this.bm.activate('pursue');
    } else {
      this.bm.deactivate('pursue');
    }
  }

  return this.bm.getSteeringForce();
}
}
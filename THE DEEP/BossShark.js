class BossShark extends Vehicle {
  constructor(x, y) {
    super(x, y);
    this.size =  120;  // radius — much bigger than any fish
    this.maxSpeed = 3.2;
    this.maxForce = 0.14;
    this.vel = p5.Vector.random2D().mult(2);

    // Behavior state
    this.pursueDistance  = 900;
    this.circleDistance  = 320; // orbit distance
    this.circleAngle     = 0;
    this.state           = 'wander'; // 'wander', 'pursue', 'circle', 'retreat'
    this.retreatTimer    = 0;
    this.stateTimer      = 0;

    // Visual
    this.finAngle        = 0;
    this.tailAngle       = 0;
    this.glowPulse       = 0;

    // Warning flash for spawn
    this.spawnTimer      = 120; // 2 seconds of spawn animation
  }

  computeForce(player) {
    let force = createVector(0, 0);
    let d = p5.Vector.dist(this.pos, player.pos);

    this.stateTimer++;

    // Retreat after player dash hits nearby
    if (this.retreatTimer > 0) {
      this.retreatTimer--;
      this.state = 'retreat';
      let fleeForce = this.flee(player.pos);
      fleeForce.mult(2.5);
      return fleeForce;
    }

    // State machine
    if (d < this.circleDistance * 1.2) {
      // Very close — circle strafe
      this.state = 'circle';
      this.circleAngle += 0.025;
      let target = createVector(
        player.pos.x + cos(this.circleAngle) * this.circleDistance,
        player.pos.y + sin(this.circleAngle) * this.circleDistance
      );
      let seekForce = this.seek(target);
      seekForce.mult(2.2);
      force.add(seekForce);

    } else if (d < this.pursueDistance) {
      // Medium range — pursue
      this.state = 'pursue';
      let pursueForce = this.pursue(player);
      pursueForce.mult(2.0);
      force.add(pursueForce);

    } else {
      // Far — wander
      this.state = 'wander';
      let wanderForce = this.wander();
      wanderForce.mult(1.0);
      force.add(wanderForce);
    }

    // Always apply boundary
    let boundaryForce = this.boundaries(0, 0, 2000, 3000, 100);
    boundaryForce.mult(1.5);
    force.add(boundaryForce);

    force.limit(this.maxForce * 3);
    return force;
  }

  // Called when player dashes nearby — shark briefly retreats
  triggerRetreat() {
    this.retreatTimer = 45;
  }

  getRadius() {
    return this.size;
  }

  show() {
    this.glowPulse += 0.05;
    this.tailAngle  = sin(frameCount * 0.08) * 0.3;

    // Spawn flash effect
    if (this.spawnTimer > 0) {
      this.spawnTimer--;
      push();
      let flashAlpha = map(this.spawnTimer, 120, 0, 200, 0);
      noFill();
      stroke(255, 50, 50, flashAlpha);
      strokeWeight(3);
      let flashR = map(this.spawnTimer, 120, 0, this.size * 6, this.size * 1.5);
      circle(this.pos.x, this.pos.y, flashR * 2);
      pop();
    }

    push();
    translate(this.pos.x, this.pos.y);

    // Face direction of movement
    if (this.vel.mag() > 0.1) rotate(this.vel.heading());

    // Glow aura
    let gAlpha = sin(this.glowPulse) * 15 + 20;
    noStroke();
    fill(180, 20, 20, gAlpha);
    ellipse(0, 0, this.size * 3.5, this.size * 2.2);

    // Tail (behind body, animated) 
    push();
    rotate(this.tailAngle);
    fill(40, 45, 55);
    noStroke();
    // Upper tail lobe
    beginShape();
    vertex(-this.size * 1.0, 0);
    bezierVertex(
      -this.size * 1.6, -this.size * 0.3,
      -this.size * 1.9, -this.size * 0.7,
      -this.size * 1.7, -this.size * 0.9
    );
    bezierVertex(
      -this.size * 1.4, -this.size * 0.8,
      -this.size * 1.1, -this.size * 0.4,
      -this.size * 0.9, 0
    );
    endShape(CLOSE);
    // Lower tail lobe
    beginShape();
    vertex(-this.size * 1.0, 0);
    bezierVertex(
      -this.size * 1.5, this.size * 0.2,
      -this.size * 1.7, this.size * 0.55,
      -this.size * 1.5, this.size * 0.7
    );
    bezierVertex(
      -this.size * 1.2, this.size * 0.6,
      -this.size * 1.0, this.size * 0.3,
      -this.size * 0.85, 0
    );
    endShape(CLOSE);
    pop();

    // Main body
    fill(55, 62, 72);
    stroke(30, 35, 42);
    strokeWeight(2);
    beginShape();
    // Top profile
    curveVertex(-this.size * 0.9, 0);
    curveVertex(-this.size * 0.9, 0);
    curveVertex(-this.size * 0.4, -this.size * 0.55);
    curveVertex(this.size * 0.3,  -this.size * 0.48);
    curveVertex(this.size * 0.85, -this.size * 0.22);
    curveVertex(this.size * 1.1,  0);
    // Bottom profile
    curveVertex(this.size * 0.85, this.size * 0.18);
    curveVertex(this.size * 0.2,  this.size * 0.42);
    curveVertex(-this.size * 0.4, this.size * 0.48);
    curveVertex(-this.size * 0.9, 0);
    curveVertex(-this.size * 0.9, 0);
    endShape(CLOSE);

    // Belly (lighter underside)
    noStroke();
    fill(180, 185, 190, 160);
    beginShape();
    curveVertex(-this.size * 0.5, 0);
    curveVertex(-this.size * 0.5, 0);
    curveVertex(-this.size * 0.1, this.size * 0.28);
    curveVertex(this.size * 0.5,  this.size * 0.25);
    curveVertex(this.size * 0.9,  this.size * 0.08);
    curveVertex(this.size * 0.9,  this.size * 0.08);
    endShape();

    // Dorsal fin
    fill(40, 45, 55);
    stroke(30, 35, 42);
    strokeWeight(1.5);
    beginShape();
    vertex(this.size * 0.1,  -this.size * 0.48);
    bezierVertex(
      this.size * 0.2,  -this.size * 1.35,
      this.size * 0.45, -this.size * 1.4,
      this.size * 0.55, -this.size * 0.5
    );
    bezierVertex(
      this.size * 0.5,  -this.size * 0.5,
      this.size * 0.35, -this.size * 0.48,
      this.size * 0.3,  -this.size * 0.48
    );
    endShape(CLOSE);

    // Pectoral fins 
    fill(45, 50, 60);
    noStroke();
    // Left pectoral
    beginShape();
    vertex(this.size * 0.3,  this.size * 0.35);
    bezierVertex(
      this.size * 0.1,  this.size * 0.8,
      -this.size * 0.2, this.size * 0.9,
      -this.size * 0.3, this.size * 0.65
    );
    bezierVertex(
      -this.size * 0.1, this.size * 0.5,
      this.size * 0.15, this.size * 0.38,
      this.size * 0.3,  this.size * 0.35
    );
    endShape(CLOSE);

    // Gill slits
    stroke(35, 40, 50, 180);
    strokeWeight(1.2);
    noFill();
    for (let i = 0; i < 4; i++) {
      let gx = this.size * (0.55 - i * 0.12);
      let gy = this.size * 0.22;
      line(gx, -gy, gx - this.size * 0.04, gy * 0.9);
    }

    // Eye 
    fill(10, 10, 12);
    noStroke();
    ellipse(this.size * 0.72, -this.size * 0.14,
            this.size * 0.16, this.size * 0.14);
    // Eye shine
    fill(255, 255, 255, 180);
    ellipse(this.size * 0.74, -this.size * 0.16,
            this.size * 0.05, this.size * 0.04);

    // Teeth
    fill(240, 238, 230);
    noStroke();
    let toothCount = 6;
    for (let i = 0; i < toothCount; i++) {
      let tx = map(i, 0, toothCount - 1,
                   this.size * 0.5, this.size * 1.0);
      triangle(
        tx,              this.size * 0.06,
        tx + this.size * 0.06, this.size * 0.06,
        tx + this.size * 0.03, this.size * 0.2
      );
    }

    pop();

    // ── State indicator (debug) 
    if (typeof showDebug !== 'undefined' && showDebug) {
      push();
      fill(255, 80, 80, 160);
      textAlign(CENTER, BOTTOM);
      textFont('Courier New, monospace');
      textSize(12);
      text(`BOSS · ${this.state}`, this.pos.x, this.pos.y - this.size * 2.5);
      noFill();
      stroke(255, 80, 80, 60);
      strokeWeight(1);
      circle(this.pos.x, this.pos.y, this.pursueDistance * 2);
      pop();
    }
  }

  showHealthBar(playerSize, winSize) {
    // Progress bar showing how close player is to beating the boss
    push();
    let prog  = constrain((playerSize - 55) / (winSize - 55), 0, 1);
    let barW  = 220;
    let barH  = 10;
    let barX  = this.pos.x - barW / 2;
    let barY  = this.pos.y - this.size * 2.8;

    // Background
    fill(20, 10, 10, 200);
    noStroke();
    rect(barX, barY, barW, barH, 5);

    // Fill — red to green as player grows
    let barCol = lerpColor(color(220, 40, 40), color(60, 220, 100), prog);
    fill(barCol);
    rect(barX, barY, barW * prog, barH, 5);

    // Border
    noFill();
    stroke(255, 80, 80, 150);
    strokeWeight(1);
    rect(barX, barY, barW, barH, 5);

    // Label
    noStroke();
    fill(255, 180, 180, 200);
    textAlign(CENTER, BOTTOM);
    textFont('Courier New, monospace');
    textSize(11);
    text('GROW TO DEFEAT', this.pos.x, barY - 3);

    pop();
  }
}
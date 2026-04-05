class Obstacle {
  constructor(x, y, radius) {
    this.x = x;
    this.y = y;
    this.radius = radius;

    // Randomly pick a wreck type
    this.wreckType = random(['plank', 'plank', 'hull', 'anchor']);

    // Slight random rotation baked in at spawn
    this.angle = random(TWO_PI);

    // Color varies by depth — shallower = more colour, deeper = more decay
    let depthFactor = y / 3000;
    let r = lerp(120, 40,  depthFactor);
    let g = lerp(90,  35,  depthFactor);
    let b = lerp(60,  25,  depthFactor);
    this.woodCol    = [r,       g,       b      ];
    this.darkCol    = [r * 0.5, g * 0.5, b * 0.5];
    this.metalCol   = [lerp(100, 50, depthFactor),
                       lerp(100, 50, depthFactor),
                       lerp(110, 55, depthFactor)];
    this.rustCol    = [lerp(140, 80, depthFactor),
                       lerp(70,  30, depthFactor),
                       lerp(30,  15, depthFactor)];

    // Moss/algae patches — pre-generated so they don't flicker
    this.mossPatch = [];
    let mossCount = floor(random(3, 7));
    for (let i = 0; i < mossCount; i++) {
      this.mossPatch.push({
        ox: random(-this.radius, this.radius),
        oy: random(-this.radius * 0.5, this.radius * 0.5),
        r:  random(4, 10)
      });
    }
  }

  computeAvoidanceForce(vehicle) {
    let d = dist(vehicle.pos.x, vehicle.pos.y, this.x, this.y);
    let avoidRadius = this.radius + vehicle.getRadius() + 60;

    if (d < avoidRadius && d > 0) {
      let force = p5.Vector.sub(
        vehicle.pos,
        createVector(this.x, this.y)
      );
      force.normalize();

      // Force is exponentially stronger the closer you get
      let strength = pow(map(d, 0, avoidRadius, 3.0, 0), 2);
      force.mult(vehicle.maxForce * strength);
      return force;
    }
    return createVector(0, 0);
  }

  show() {
    push();
    translate(this.x, this.y);
    rotate(this.angle);

    if (this.wreckType === 'plank') {
      this._drawPlank();
    } else if (this.wreckType === 'hull') {
      this._drawHull();
    } else {
      this._drawAnchor();
    }

    // Moss patches on top of everything
    noStroke();
    fill(30, 90, 40, 120);
    for (let m of this.mossPatch) {
      ellipse(m.ox, m.oy, m.r, m.r * 0.6);
    }

    pop();
  }

  _drawPlank() {
    let w = this.radius * 2.8;
    let h = this.radius * 0.55;

    // Shadow underneath
    fill(0, 0, 0, 40);
    noStroke();
    ellipse(0, h * 0.8, w * 0.9, h * 0.4);

    // Main plank body
    fill(...this.woodCol);
    stroke(...this.darkCol);
    strokeWeight(1.5);
    rect(-w / 2, -h / 2, w, h, 3);

    // Wood grain lines
    stroke(...this.darkCol, 180);
    strokeWeight(0.8);
    for (let i = -2; i <= 2; i++) {
      let gx = (i / 2.5) * w * 0.45;
      line(gx, -h / 2 + 2, gx + random(-4, 4), h / 2 - 2);
    }

    // Nail heads
    fill(...this.metalCol);
    noStroke();
    let nailPositions = [-w * 0.38, 0, w * 0.38];
    for (let nx of nailPositions) {
      ellipse(nx, 0, 5, 5);
      // Rust streak below nail
      fill(...this.rustCol, 100);
      rect(nx - 1, 2, 2, h * 0.3);
      fill(...this.metalCol);
    }

    // Broken end — jagged right edge
    fill(...this.woodCol);
    noStroke();
    beginShape();
    vertex(w / 2 - 6, -h / 2);
    vertex(w / 2 + 4, -h / 4);
    vertex(w / 2 - 2, 0);
    vertex(w / 2 + 6, h / 4);
    vertex(w / 2 - 4, h / 2);
    vertex(w / 2 - 8, h / 2);
    vertex(w / 2 - 8, -h / 2);
    endShape(CLOSE);
  }

  _drawHull() {
    let w = this.radius * 2.2;
    let h = this.radius * 1.4;

    // Shadow
    fill(0, 0, 0, 40);
    noStroke();
    ellipse(0, h * 0.55, w * 0.85, h * 0.3);

    // Hull curve — like a broken boat section
    fill(...this.woodCol);
    stroke(...this.darkCol);
    strokeWeight(1.5);
    beginShape();
    vertex(-w / 2, h / 2);
    bezierVertex(-w / 2, -h * 0.1, -w * 0.1, -h / 2, 0, -h / 2);
    bezierVertex(w * 0.1, -h / 2, w / 2, -h * 0.1, w / 2, h / 2);
    endShape(CLOSE);

    // Inner planks
    stroke(...this.darkCol, 160);
    strokeWeight(1);
    for (let i = -2; i <= 2; i++) {
      let py = (i / 2) * h * 0.35;
      line(-w * 0.38, py, w * 0.38, py);
    }

    // Metal ribs
    stroke(...this.metalCol);
    strokeWeight(2.5);
    noFill();
    for (let i = -1; i <= 1; i++) {
      let rx = i * w * 0.28;
      line(rx, -h * 0.3, rx, h * 0.45);
    }

    // Rust streaks from ribs
    noStroke();
    for (let i = -1; i <= 1; i++) {
      let rx = i * w * 0.28;
      fill(...this.rustCol, 80);
      rect(rx - 2, h * 0.1, 4, h * 0.3);
    }

    // Barnacles along bottom edge
    fill(180, 175, 165);
    noStroke();
    for (let i = -4; i <= 4; i++) {
      let bx = i * w * 0.11;
      ellipse(bx, h * 0.42, 5, 4);
    }
  }

  _drawAnchor() {
    let s = this.radius; // scale factor

    // Shadow
    fill(0, 0, 0, 35);
    noStroke();
    ellipse(0, s * 0.2, s * 1.4, s * 0.3);

    // Anchor chain — a few links draped above
    stroke(...this.metalCol);
    strokeWeight(2);
    noFill();
    for (let i = 0; i < 4; i++) {
      let cy = -s * 1.1 - i * s * 0.22;
      let cx = sin(i * 0.8) * s * 0.15;
      ellipse(cx, cy, s * 0.18, s * 0.28);
    }

    // Main shaft
    fill(...this.metalCol);
    stroke(...this.darkCol);
    strokeWeight(1.5);
    rect(-s * 0.08, -s * 0.9, s * 0.16, s * 1.4, 2);

    // Crossbar at top
    rect(-s * 0.55, -s * 0.82, s * 1.1, s * 0.14, 2);

    // Ring at top
    noFill();
    stroke(...this.metalCol);
    strokeWeight(2.5);
    ellipse(0, -s * 0.96, s * 0.22, s * 0.22);

    // Flukes (the curved prongs at bottom)
    fill(...this.metalCol);
    stroke(...this.darkCol);
    strokeWeight(1.5);
    // Left fluke
    beginShape();
    vertex(-s * 0.08, s * 0.42);
    bezierVertex(-s * 0.35, s * 0.3, -s * 0.65, s * 0.35, -s * 0.6, s * 0.55);
    bezierVertex(-s * 0.55, s * 0.72, -s * 0.3, s * 0.68, -s * 0.08, s * 0.52);
    endShape(CLOSE);
    // Right fluke
    beginShape();
    vertex(s * 0.08, s * 0.42);
    bezierVertex(s * 0.35, s * 0.3, s * 0.65, s * 0.35, s * 0.6, s * 0.55);
    bezierVertex(s * 0.55, s * 0.72, s * 0.3, s * 0.68, s * 0.08, s * 0.52);
    endShape(CLOSE);

    // Crown bar across flukes
    rect(-s * 0.42, s * 0.44, s * 0.84, s * 0.1, 2);

    // Rust patches
    noStroke();
    fill(...this.rustCol, 140);
    ellipse(-s * 0.5, s * 0.5, s * 0.2, s * 0.15);
    ellipse(s * 0.3,  s * 0.48, s * 0.15, s * 0.12);
    ellipse(0, s * 0.1, s * 0.12, s * 0.1);
  }

  showDebug() {
    push();
    stroke(255, 255, 255, 100);
    strokeWeight(1);
    noFill();
    circle(this.x, this.y, (this.radius + 50) * 2);
    pop();
  }
}
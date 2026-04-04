class OceanBackground {
  constructor() {
    this.worldWidth  = 2000;
    this.worldHeight = 3000;

    this.surfaceColor  = color(100, 200, 255);
    this.twilightColor = color(50,  150, 200);
    this.midnightColor = color(10,  50,  100);
    this.abyssColor    = color(5,   10,  20);

    this.surfaceHeight  = 700;
    this.twilightHeight = 1500;
    this.midnightHeight = 2300;
    this.abyssHeight    = 3000;

    // Pre-render gradient buffer once
    this.buffer = createGraphics(this.worldWidth, this.worldHeight);
    this.buffer.push();
    this.drawGradientToBuffer(this.buffer, 0, this.surfaceHeight, this.surfaceColor, this.twilightColor);
    this.drawGradientToBuffer(this.buffer, this.surfaceHeight, this.twilightHeight, this.twilightColor, this.midnightColor);
    this.drawGradientToBuffer(this.buffer, this.twilightHeight, this.midnightHeight, this.midnightColor, this.abyssColor);
    this.drawGradientToBuffer(this.buffer, this.midnightHeight, this.abyssHeight, this.abyssColor, this.abyssColor);
    this.buffer.pop();

    // Atmosphere particles
    this.particles = [];
    for (let i = 0; i < 50; i++) {
      this.particles.push({
        x: random(this.worldWidth),
        y: random(this.worldHeight),
        size: random(2, 8),
        alpha: random(10, 50)
      });
    }
    for (let i = 0; i < 20; i++) {
      this.particles.push({
        x: random(this.worldWidth),
        y: random(1500, this.worldHeight),
        size: random(4, 12),
        alpha: random(20, 70),
        deepBlue: true
      });
    }

    // Bubbles
    // More near the bottom, fewer at the top
    this.bubbles = [];
    for (let i = 0; i < 120; i++) {
      this.bubbles.push({
        x:         random(this.worldWidth),
        y:         random(this.worldHeight),
        r:         random(2, 9),
        speed:     random(0.2, 0.8),
        sway:      random(TWO_PI),
        swaySpeed: random(0.01, 0.03),
        swayAmt:   random(3, 12),
        alpha:     random(30, 90)
      });
    }

    // Light rays (Surface + Twilight only) 
    this.rays = [];
    for (let i = 0; i < 10; i++) {
      this.rays.push({
        x:     random(100, this.worldWidth - 100),
        width: random(30, 90),
        alpha: random(8, 22),
        speed: random(0.003, 0.008),
        phase: random(TWO_PI)
      });
    }

    // Floating debris (dust motes) 
    this.debris = [];
    for (let i = 0; i < 200; i++) {
      this.debris.push({
        x:     random(this.worldWidth),
        y:     random(this.worldHeight),
        size:  random(1, 3),
        alpha: random(15, 45),
        vx:    random(-0.05, 0.05),
        vy:    random(-0.02, 0.02)
      });
    }

    // Decorative jellyfish silhouettes (Midnight + Abyss) 
    this.jellyfish = [];
    for (let i = 0; i < 18; i++) {
      let y = random(1500, 2950);
      this.jellyfish.push({
        x:         random(100, this.worldWidth - 100),
        y:         y,
        r:         random(15, 45),
        pulsePhase: random(TWO_PI),
        pulseSpeed: random(0.015, 0.035),
        driftX:    random(-0.15, 0.15),
        driftY:    random(-0.05, 0.03),
        // Deeper = more purple, shallower = more cyan
        hue:       random() > 0.5 ? 'cyan' : 'purple',
        alpha:     random(25, 65),
        tentacles: this._makeTentacles(random(15, 45))
      });
    }

    // Seabed pebbles (y > 2800) 
    this.pebbles = [];
    for (let i = 0; i < 80; i++) {
      this.pebbles.push({
        x:    random(this.worldWidth),
        y:    random(2800, 2990),
        rx:   random(4, 18),
        ry:   random(3, 10),
        col:  [random(20, 55), random(20, 50), random(25, 60)],
        angle: random(TWO_PI)
      });
    }
  }

  _makeTentacles(r) {
    let tentacles = [];
    let count = floor(random(5, 9));
    for (let i = 0; i < count; i++) {
      tentacles.push({
        angle:  map(i, 0, count, -PI * 0.6, PI * 0.6) + PI / 2,
        length: random(r * 1.2, r * 2.8),
        wobble: random(TWO_PI),
        wobbleSpeed: random(0.02, 0.05)
      });
    }
    return tentacles;
  }

  show() {
    push();

    image(this.buffer, 0, 0);
    this._drawLightRays();
    this._drawSeabed();
    this._drawDebris();
    this._drawParticles();
    this._drawBubbles();
    this._drawJellyfish();
    pop();
  }

  //Light rays

  _drawLightRays() {
    push();
    blendMode(ADD);
    noStroke();
    let t = frameCount * 0.01;
    for (let ray of this.rays) {
      let xOffset = sin(t * ray.speed * 60 + ray.phase) * 40;
      let x       = ray.x + xOffset;
      let alpha   = ray.alpha + sin(t * ray.speed * 80 + ray.phase) * 5;

      // Ray only visible in top 1500px (surface + twilight)
      // Fade out toward y=1500
      for (let seg = 0; seg < 8; seg++) {
        let y1 = seg * 200;
        let y2 = y1 + 200;
        let a1 = map(y1, 0, 1500, alpha, 0);
        let a2 = map(y2, 0, 1500, alpha, 0);
        if (a1 <= 0 && a2 <= 0) continue;

        fill(180, 230, 255, max(0, a1));
        beginShape();
        vertex(x - ray.width / 2 * (1 + seg * 0.15), y1);
        vertex(x + ray.width / 2 * (1 + seg * 0.15), y1);
        vertex(x + ray.width / 2 * (1 + (seg + 1) * 0.15), y2);
        vertex(x - ray.width / 2 * (1 + (seg + 1) * 0.15), y2);
        endShape(CLOSE);
      }
    }
    blendMode(BLEND);
    pop();
  }

  //Seabed

  _drawSeabed() {
    push();
    // Dark sandy base layer
    noStroke();
    fill(8, 12, 18, 200);
    rect(0, 2820, this.worldWidth, 180);

    // Sandy texture strip
    fill(25, 22, 18, 160);
    rect(0, 2800, this.worldWidth, 40);

    // Pebbles
    for (let p of this.pebbles) {
      push();
      translate(p.x, p.y);
      rotate(p.angle);
      fill(p.col[0], p.col[1], p.col[2], 180);
      stroke(p.col[0] * 0.6, p.col[1] * 0.6, p.col[2] * 0.6, 120);
      strokeWeight(0.5);
      ellipse(0, 0, p.rx * 2, p.ry * 2);
      pop();
    }
    pop();
  }

  // Debris

  _drawDebris() {
    push();
    noStroke();
    for (let d of this.debris) {
      // Drift slowly
      d.x += d.vx + 0.015; // slight rightward current
      d.y += d.vy;
      // Wrap around world
      if (d.x > this.worldWidth)  d.x = 0;
      if (d.x < 0)                d.x = this.worldWidth;
      if (d.y > this.worldHeight) d.y = 0;
      if (d.y < 0)                d.y = this.worldHeight;

      // Color shifts by depth
      if (d.y < 700) {
        fill(220, 240, 255, d.alpha);
      } else if (d.y < 1500) {
        fill(150, 200, 240, d.alpha);
      } else if (d.y < 2300) {
        fill(80, 120, 180, d.alpha);
      } else {
        fill(60, 80, 120, d.alpha);
      }
      circle(d.x, d.y, d.size);
    }
    pop();
  }

  // Bubbles

  _drawBubbles() {
    push();
    noFill();
    for (let b of this.bubbles) {
      // Rise upward
      b.y -= b.speed;
      // Sway side to side
      let swayX = sin(frameCount * b.swaySpeed + b.sway) * b.swayAmt;

      // Reset when reaching top
      if (b.y < -b.r * 2) {
        b.y = this.worldHeight + b.r;
        b.x = random(this.worldWidth);
      }

      // Bubbles more visible deeper
      let depthAlpha = map(b.y, 0, this.worldHeight, b.alpha * 0.3, b.alpha);

      // Outer ring
      stroke(180, 220, 255, depthAlpha);
      strokeWeight(0.8);
      circle(b.x + swayX, b.y, b.r * 2);

      // Inner highlight
      stroke(255, 255, 255, depthAlpha * 0.6);
      strokeWeight(0.5);
      circle(b.x + swayX - b.r * 0.25, b.y - b.r * 0.25, b.r * 0.5);
    }
    pop();
  }

  // Decorative jellyfish

  _drawJellyfish() {
    push();
    noStroke();
    let t = frameCount;

    for (let j of this.jellyfish) {
      // Drift slowly
      j.x += j.driftX;
      j.y += j.driftY;

      // Wrap
      if (j.x < -j.r * 3)              
        j.x = this.worldWidth + j.r * 3;
      if (j.x > this.worldWidth + j.r * 3) j.x = -j.r * 3;
      if (j.y < 1400)                   
        j.y = 2950;
      if (j.y > 2980)                   
        j.y = 1500;

      // Pulse
      let pulse = sin(t * j.pulseSpeed + j.pulsePhase);
      let scaleY = 1 + pulse * 0.12;
      let scaleX = 1 - pulse * 0.06;

      push();
      translate(j.x, j.y);

      // Color
      let r, g, b;
      if (j.hue === 'cyan') {
        r = 0; g = 200; b = 220;
      } else {
        r = 140; g = 60; b = 220;
      }

      // Bell body
      fill(r, g, b, j.alpha);
      ellipse(0, 0, j.r * 2 * scaleX, j.r * 1.3 * scaleY);

      // Inner glow
      fill(r + 80, g + 80, b + 80, j.alpha * 0.4);
      ellipse(0, j.r * 0.1, j.r * 1.2 * scaleX, j.r * 0.7 * scaleY);

      // Tentacles
      stroke(r, g, b, j.alpha * 0.6);
      strokeWeight(0.8);
      noFill();
      for (let ten of j.tentacles) {
        ten.wobble += ten.wobbleSpeed;
        let wobbleX = sin(ten.wobble) * j.r * 0.3;
        let tx = cos(ten.angle) * j.r * scaleX * 0.8;
        let ty = sin(ten.angle) * j.r * 0.7;
        let ex = tx + wobbleX + cos(ten.angle) * ten.length * 0.6;
        let ey = ty + ten.length;
        beginShape();
        vertex(tx, ty);
        bezierVertex(
          tx + wobbleX * 0.5, ty + ten.length * 0.3,
          ex - wobbleX * 0.3, ey - ten.length * 0.3,
          ex, ey
        );
        endShape();
      }

      pop();
    }
    pop();
  }

  // Atmosphere particles 

  _drawParticles() {
    push();
    noStroke();
    for (let p of this.particles) {
      if (p.deepBlue) {
        fill(150, 220, 255, p.alpha);
      } else if (p.y > 1500) {
        fill(120, 180, 240, p.alpha * 0.8);
      } else {
        fill(255, p.alpha);
      }
      circle(p.x, p.y, p.size);
    }
    pop();
  }

  drawGradientToBuffer(buf, yStart, yEnd, colorStart, colorEnd) {
    for (let y = yStart; y < yEnd; y++) {
      let t = (y - yStart) / (yEnd - yStart);
      let c = lerpColor(colorStart, colorEnd, t);
      buf.stroke(c);
      buf.line(0, y, this.worldWidth, y);
    }
  }

  // Keep old name for compatibility
  drawParticles() {
    this._drawParticles();
  }
}
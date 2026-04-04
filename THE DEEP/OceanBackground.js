// OceanBackground.js
// Draws a gradient background for the ocean world.
// World dimensions: 2000px wide, 3000px tall.

class OceanBackground {
  constructor() {
    this.worldWidth = 2000;
    this.worldHeight = 3000;
    // Zone colors
    this.surfaceColor = color(100, 200, 255); // brighter blue
    this.twilightColor = color(50, 150, 200); // darker teal
    this.midnightColor = color(10, 50, 100); // dark blue-black
    this.abyssColor = color(5, 10, 20); // near-black
    // Zone heights
    this.surfaceHeight = 700;
    this.twilightHeight = 1500;
    this.midnightHeight = 2300;
    this.abyssHeight = 3000;

    // Create graphics buffer and draw gradient once
    this.buffer = createGraphics(this.worldWidth, this.worldHeight);
    this.buffer.push();
    this.drawGradientToBuffer(this.buffer, 0, this.surfaceHeight, this.surfaceColor, this.twilightColor);
    this.drawGradientToBuffer(this.buffer, this.surfaceHeight, this.twilightHeight, this.twilightColor, this.midnightColor);
    this.drawGradientToBuffer(this.buffer, this.twilightHeight, this.midnightHeight, this.midnightColor, this.abyssColor);
    this.drawGradientToBuffer(this.buffer, this.midnightHeight, this.abyssHeight, this.abyssColor, this.abyssColor);
    this.buffer.pop();

    // Generate particles once
    this.particles = [];
    for (let i = 0; i < 50; i++) {
      this.particles.push({
        x: random(this.worldWidth),
        y: random(this.worldHeight),
        size: random(2, 8),
        alpha: random(10, 50)
      });
    }

    // Extra deep particles (bioluminescent)
    for (let i = 0; i < 20; i++) {
      this.particles.push({
        x: random(this.worldWidth),
        y: random(1500, this.worldHeight),
        size: random(4, 12),
        alpha: random(20, 70),
        deepBlue: true
      });
    }
  }

  show() {
    push();
    // Draw the pre-rendered gradient buffer
    image(this.buffer, 0, 0);
    // Add subtle particles on top
    this.drawParticles();
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

  drawParticles() {
    // Draw stored particles for atmosphere
    for (let p of this.particles) {
      if (p.deepBlue) {
        fill(150, 220, 255, p.alpha);
      } else if (p.y > 1500) {
        fill(120, 180, 240, p.alpha * 0.8);
      } else {
        fill(255, p.alpha);
      }
      noStroke();
      circle(p.x, p.y, p.size);
    }
  }
}

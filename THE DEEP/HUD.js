class HUD {
  constructor(zoneManager, gameManager) {
    this.zoneManager = zoneManager;
    this.gameManager = gameManager;

    this.zoneColors = {
      'Surface':  color(100, 200, 255),
      'Twilight': color(100, 180, 200),
      'Midnight': color(60,  100, 160),
      'Abyss':    color(120,  80, 160)
    };

    // Shared animated particles for screens
    this._particles = [];
    for (let i = 0; i < 60; i++) {
      this._particles.push({
        x:     random(0, 1),   // normalized 0-1
        y:     random(0, 1),
        size:  random(2, 6),
        speed: random(0.0003, 0.001),
        alpha: random(80, 200),
        col:   floor(random(3)) // 0=cyan 1=blue 2=teal
      });
    }

    // Typewriter state
    this._typeText    = 'Survive. Grow. Dominate.';
    this._typeIndex   = 0;
    this._typeTimer   = 0;
    this._typeSpeed   = 3; // frames per character
    this._typeDone    = false;

    // Button pulse
    this._btnPulse = 0;
  }

  update(player) {
    this.player = player;
  }

  // ── Shared helpers ───────────────────────────────────────────────

  _updateParticles() {
    for (let p of this._particles) {
      p.y -= p.speed;
      if (p.y < 0) {
        p.y = 1;
        p.x = random(0, 1);
      }
    }
  }

  _drawParticles(tint) {
    noStroke();
    for (let p of this._particles) {
      let px = p.x * width;
      let py = p.y * height;
      if (p.col === 0)      fill(0,   220, 255, p.alpha);
      else if (p.col === 1) fill(80,  140, 255, p.alpha);
      else                  fill(0,   200, 180, p.alpha);
      circle(px, py, p.size);
    }
  }

  _drawWaves(yBase, col, alpha, t, amplitude, freq) {
    noFill();
    stroke(red(col), green(col), blue(col), alpha);
    strokeWeight(1.5);
    beginShape();
    for (let x = 0; x <= width; x += 4) {
      let y = yBase + sin(x * freq + t) * amplitude
                    + sin(x * freq * 1.7 + t * 0.8) * amplitude * 0.4;
      vertex(x, y);
    }
    endShape();
  }

  _drawOceanOverlay(col1, col2) {
    // Deep dark gradient overlay built from rects
    for (let i = 0; i < 8; i++) {
      let t  = i / 7;
      let y  = height * (1 - t * 0.55);
      let a  = lerp(0, 160, t);
      let rc = lerpColor(col1, col2, t);
      noStroke();
      fill(red(rc), green(rc), blue(rc), a);
      rect(0, y, width, height - y);
    }
  }

  // ── Start screen ─────────────────────────────────────────────────

  showStartScreen() {
    this._updateParticles();
    this._btnPulse += 0.04;

    // Advance typewriter
    if (!this._typeDone) {
      this._typeTimer++;
      if (this._typeTimer >= this._typeSpeed) {
        this._typeTimer = 0;
        if (this._typeIndex < this._typeText.length) {
          this._typeIndex++;
        } else {
          this._typeDone = true;
        }
      }
    }

    push();

    // Deep ocean background
    background(2, 8, 24);

    // Layered depth fog
    this._drawOceanOverlay(color(0, 20, 60), color(0, 5, 15));

    // Animated waves at multiple depths
    let t = frameCount * 0.015;
    this._drawWaves(height * 0.72, color(0, 180, 255), 18, t,        12, 0.008);
    this._drawWaves(height * 0.78, color(0, 140, 220), 14, t * 0.9,  9,  0.011);
    this._drawWaves(height * 0.85, color(0,  80, 160), 10, t * 0.7,  6,  0.015);
    this._drawWaves(height * 0.92, color(0,  40, 100),  7, t * 0.5,  4,  0.020);

    // Bioluminescent particles
    this._drawParticles();

    // ── Depth silhouette shapes (seabed rocks) ──
    fill(0, 5, 18);
    noStroke();
    // left rock cluster
    ellipse(width * 0.08,  height * 0.97, 180, 80);
    ellipse(width * 0.15,  height * 0.95, 120, 60);
    // right rock cluster
    ellipse(width * 0.88,  height * 0.97, 200, 70);
    ellipse(width * 0.82,  height * 0.95, 130, 55);
    // center dip
    ellipse(width * 0.5,   height * 0.99, 300, 50);

    // ── Ambient light from above ──
    noStroke();
    for (let i = 3; i >= 0; i--) {
      let a = lerp(0, 25, i / 3);
      fill(0, 160, 255, a);
      ellipse(width / 2, -60, width * 0.9 - i * 80, 350 - i * 40);
    }

    // ── Title: THE DEEP ──
    let titleY   = height * 0.35;
    let pulse    = sin(frameCount * 0.04) * 8;

    // Glow layers
    textAlign(CENTER, CENTER);
    textFont('Georgia, serif');
    for (let g = 4; g >= 0; g--) {
      let ga = map(g, 0, 4, 60, 0);
      fill(0, 200, 255, ga);
      textSize(130 + g * 6 + pulse);
      text('THE DEEP', width / 2, titleY);
    }
    // Solid title
    fill(220, 245, 255);
    textSize(130 + pulse);
    text('THE DEEP', width / 2, titleY);

    // Thin rule under title
    stroke(0, 180, 255, 120);
    strokeWeight(1);
    let ruleW = 320;
    line(width / 2 - ruleW / 2, titleY + 76, width / 2 + ruleW / 2, titleY + 76);

    // ── Typewriter tagline ──
    noStroke();
    fill(140, 210, 240, 200);
    textFont('Courier New, monospace');
    textSize(18);
    textAlign(CENTER, CENTER);
    let shown = this._typeText.substring(0, this._typeIndex);
    let cursor = (!this._typeDone && floor(frameCount / 20) % 2 === 0) ? '_' : '';
    text(shown + cursor, width / 2, titleY + 108);

    // ── Controls hint ──
    fill(80, 160, 200, 160);
    textSize(13);
    textFont('Courier New, monospace');
    text('Mouse to swim   ·   SPACE to dash   ·   Eat smaller fish to grow', width / 2, height * 0.62);

    // ── DIVE IN button ──
    let btnW    = 200;
    let btnH    = 52;
    let btnX    = width / 2 - btnW / 2;
    let btnY    = height * 0.70;
    let bPulse  = sin(this._btnPulse) * 0.15 + 0.85;

    // Outer glow
    noFill();
    for (let g = 3; g >= 0; g--) {
      stroke(0, 200, 255, 20 * bPulse);
      strokeWeight(g * 3 + 1);
      rect(btnX - g * 3, btnY - g * 3, btnW + g * 6, btnH + g * 6, 6);
    }

    // Button body
    fill(0, 30, 70, 200);
    stroke(0, 200, 255, 180 * bPulse);
    strokeWeight(1.5);
    rect(btnX, btnY, btnW, btnH, 4);

    // Button text
    noStroke();
    fill(0, 220, 255, 230 * bPulse);
    textFont('Georgia, serif');
    textSize(22);
    textAlign(CENTER, CENTER);
    text('DIVE IN', width / 2, btnY + btnH / 2);

    // ── Zone preview pills ──
    let zones = [
      { name: 'Surface',  col: color(100, 200, 255) },
      { name: 'Twilight', col: color(60,  150, 200) },
      { name: 'Midnight', col: color(30,  80,  160) },
      { name: 'Abyss',    col: color(60,  20,  100) },
    ];
    let pillW   = 90;
    let pillGap = 12;
    let totalW  = zones.length * (pillW + pillGap) - pillGap;
    let startX  = width / 2 - totalW / 2;
    let pillY   = height * 0.85;

    textFont('Courier New, monospace');
    textSize(11);
    textAlign(CENTER, CENTER);

    for (let i = 0; i < zones.length; i++) {
      let z  = zones[i];
      let px = startX + i * (pillW + pillGap);
      let depth = i * 0.25 + sin(frameCount * 0.03 + i) * 0.05;
      let alpha = lerp(120, 200, depth);

      fill(red(z.col), green(z.col), blue(z.col), 40);
      stroke(red(z.col), green(z.col), blue(z.col), alpha);
      strokeWeight(1);
      rect(px, pillY, pillW, 28, 14);

      noStroke();
      fill(red(z.col), green(z.col), blue(z.col), 220);
      text(z.name, px + pillW / 2, pillY + 14);
    }

    // ── Version tag ──
    noStroke();
    fill(40, 100, 140, 120);
    textSize(11);
    textAlign(RIGHT, BOTTOM);
    text('v1.0  ·  The Deep', width - 16, height - 10);

    pop();
  }

  // ── Win screen ───────────────────────────────────────────────────

  showWinScreen() {
    push();

    background(2, 12, 8);

    // Golden light rays from surface
    noStroke();
    for (let i = 0; i < 8; i++) {
      let angle = map(i, 0, 8, -PI / 5, PI / 5);
      let rayLen = height * 1.4;
      let rayW   = 60;
      let alpha  = sin(frameCount * 0.02 + i * 0.8) * 15 + 25;
      fill(255, 200, 80, alpha);
      push();
      translate(width / 2, -50);
      rotate(angle);
      rect(-rayW / 2, 0, rayW, rayLen);
      pop();
    }

    // Green bioluminescent particles floating up
    for (let p of this._particles) {
      let px = p.x * width;
      let py = p.y * height;
      fill(80, 255, 150, p.alpha * 0.8);
      noStroke();
      circle(px, py, p.size * 0.8);
    }
    this._updateParticles();

    // Seabed
    fill(0, 20, 10);
    noStroke();
    ellipse(width * 0.15, height * 0.97, 200, 60);
    ellipse(width * 0.85, height * 0.97, 220, 55);

    // ── APEX PREDATOR title ──
    let titleY = height * 0.32;
    textFont('Georgia, serif');
    textAlign(CENTER, CENTER);

    // Gold glow
    for (let g = 4; g >= 0; g--) {
      fill(255, 200, 50, map(g, 0, 4, 50, 0));
      textSize(72 + g * 4);
      text('APEX PREDATOR', width / 2, titleY);
    }
    fill(255, 230, 120);
    textSize(72);
    text('APEX PREDATOR', width / 2, titleY);

    // Subtitle
    fill(120, 255, 180, 200);
    textFont('Courier New, monospace');
    textSize(16);
    text('You have conquered the deep.', width / 2, titleY + 60);

    // ── Stats panel ──
    let panelW = 360;
    let panelH = 130;
    let panelX = width / 2 - panelW / 2;
    let panelY = height * 0.50;

    fill(0, 40, 20, 180);
    stroke(80, 200, 120, 100);
    strokeWeight(1);
    rect(panelX, panelY, panelW, panelH, 8);

    noStroke();
    textFont('Courier New, monospace');
    textAlign(LEFT, CENTER);
    textSize(15);

    let finalSize = this.player ? this.player.getRadius().toFixed(1) : '--';
    let finalTime = this.gameManager.getElapsedSeconds();
    let mins      = Math.floor(finalTime / 60);
    let secs      = finalTime % 60;
    let timeStr   = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

    fill(80, 220, 140);
    text('▸ Final size',  panelX + 24, panelY + 34);
    text('▸ Time taken',  panelX + 24, panelY + 66);
    text('▸ Rank',        panelX + 24, panelY + 98);

    fill(220, 255, 220);
    textAlign(RIGHT, CENTER);
    text(finalSize,                   panelX + panelW - 24, panelY + 34);
    text(timeStr,                     panelX + panelW - 24, panelY + 66);
    text(this._rank(finalTime),       panelX + panelW - 24, panelY + 98);

    // ── Restart button ──
    let btnY   = height * 0.76;
    let bPulse = sin(frameCount * 0.05) * 0.12 + 0.88;

    fill(0, 40, 20, 180);
    stroke(80, 220, 120, 160 * bPulse);
    strokeWeight(1.5);
    rect(width / 2 - 110, btnY, 220, 50, 4);

    noStroke();
    fill(100, 255, 160, 220 * bPulse);
    textFont('Georgia, serif');
    textSize(20);
    textAlign(CENTER, CENTER);
    text('DIVE AGAIN  [R]', width / 2, btnY + 25);

    pop();
  }

  // ── Game over screen ─────────────────────────────────────────────

  showGameOver() {
    push();

    background(8, 2, 2);

    // Red light pulse from below
    let rPulse = sin(frameCount * 0.03) * 0.3 + 0.7;
    noStroke();
    for (let i = 4; i >= 0; i--) {
      fill(180, 0, 0, map(i, 0, 4, 0, 30) * rPulse);
      ellipse(width / 2, height + 100, width * 1.2 - i * 100, 400 - i * 50);
    }

    // Dark red particles sinking down
    for (let p of this._particles) {
      let px = p.x * width;
      let py = (1 - p.y) * height; // reversed — sinking
      fill(200, 40, 40, p.alpha * 0.6);
      noStroke();
      circle(px, py, p.size * 0.7);
    }

    // Seabed dark
    fill(15, 2, 2);
    noStroke();
    ellipse(width * 0.1,  height * 0.97, 200, 60);
    ellipse(width * 0.88, height * 0.97, 180, 50);
    ellipse(width * 0.5,  height * 0.99, 350, 40);

    // ── CONSUMED title ──
    let titleY = height * 0.30;
    textFont('Georgia, serif');
    textAlign(CENTER, CENTER);

    // Red glow
    for (let g = 5; g >= 0; g--) {
      fill(255, 30, 30, map(g, 0, 5, 60, 0) * rPulse);
      textSize(96 + g * 5);
      text('CONSUMED', width / 2, titleY);
    }
    fill(255, 80, 80);
    textSize(96);
    text('CONSUMED', width / 2, titleY);

    // Subtitle
    fill(180, 80, 80, 200);
    textFont('Courier New, monospace');
    textSize(15);
    text('Something larger was hungry too.', width / 2, titleY + 62);

    // ── Stats panel ──
    let panelW = 360;
    let panelH = 110;
    let panelX = width / 2 - panelW / 2;
    let panelY = height * 0.50;

    fill(40, 4, 4, 180);
    stroke(160, 40, 40, 100);
    strokeWeight(1);
    rect(panelX, panelY, panelW, panelH, 8);

    noStroke();
    textFont('Courier New, monospace');
    textAlign(LEFT, CENTER);
    textSize(15);

    let finalSize = this.player ? this.player.getRadius().toFixed(1) : '--';
    let finalTime = this.gameManager.getElapsedSeconds();
    let mins      = Math.floor(finalTime / 60);
    let secs      = finalTime % 60;
    let timeStr   = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

    fill(200, 80, 80);
    text('▸ Size reached',  panelX + 24, panelY + 28);
    text('▸ Time survived', panelX + 24, panelY + 60);
    text('▸ Cause',         panelX + 24, panelY + 92);

    fill(255, 180, 180);
    textAlign(RIGHT, CENTER);
    text(finalSize,       panelX + panelW - 24, panelY + 28);
    text(timeStr,         panelX + panelW - 24, panelY + 60);
    text('Eaten alive',   panelX + panelW - 24, panelY + 92);

    // ── Try again button ──
    let btnY   = height * 0.74;
    let bPulse = sin(frameCount * 0.05) * 0.12 + 0.88;

    fill(40, 4, 4, 180);
    stroke(200, 60, 60, 160 * bPulse);
    strokeWeight(1.5);
    rect(width / 2 - 110, btnY, 220, 50, 4);

    noStroke();
    fill(255, 100, 100, 220 * bPulse);
    textFont('Georgia, serif');
    textSize(20);
    textAlign(CENTER, CENTER);
    text('TRY AGAIN  [R]', width / 2, btnY + 25);

    pop();
  }

  // ── Rank helper ──────────────────────────────────────────────────

  _rank(seconds) {
    if (seconds < 30)  return 'Leviathan';
    if (seconds < 60)  return 'Apex Hunter';
    if (seconds < 120) return 'Deep Diver';
    return 'Survivor';
  }

  // ── Main show ────────────────────────────────────────────────────

  show() {
    if (this.gameManager.isStartScreen()) {
      this.showStartScreen();
      return;
    }
    if (this.gameManager.isWon()) {
      this.showWinScreen();
      return;
    }
    if (this.gameManager.isGameOver()) {
      this.showGameOver();
      return;
    }

    if (!this.player) return;

    // ── Zone transition ──
    if (this.gameManager.zoneTransitionTimer > 0) {
      push();
      let zoneColor = this.zoneColors[this.gameManager.zoneTransitionMessage];
      let alpha     = map(this.gameManager.zoneTransitionTimer, 0, 180, 0, 255);
      let c         = color(red(zoneColor), green(zoneColor), blue(zoneColor), alpha);
      fill(c);
      textAlign(CENTER, CENTER);
      textFont('Georgia, serif');
      textSize(52);
      text(this.gameManager.zoneTransitionMessage, width / 2, height / 2);
      pop();
    }

    // ── Timer ──
    push();
    fill(180, 220, 255, 200);
    textAlign(RIGHT, TOP);
    textFont('Courier New, monospace');
    textSize(15);
    text(`${this.gameManager.getElapsedSeconds()}s`, width - 14, 12);
    pop();

    // ── Dash indicator ──
    push();
    let cooldown    = this.player.dashCooldown;
    let maxCooldown = 180;
    let ready       = cooldown === 0;
    textAlign(RIGHT, TOP);
    textFont('Courier New, monospace');
    textSize(13);
    if (ready) {
      fill(80, 255, 160, 220);
      text('DASH  [SPACE]', width - 14, 32);
    } else {
      fill(120, 120, 140, 160);
      let pct = ((maxCooldown - cooldown) / maxCooldown * 100).toFixed(0);
      text(`DASH  ${pct}%`, width - 14, 32);
    }
    pop();

    push();
    fill(80, 140, 180, 120);
    textAlign(RIGHT, TOP);
    textFont('Courier New, monospace');
    textSize(12);
    text('M  mute', width - 14, 52);
    pop();

    // ── Stats top-left ──
    push();
    fill(160, 210, 240, 200);
    textAlign(LEFT, TOP);
    textFont('Courier New, monospace');
    textSize(14);
    let size  = this.player.getRadius();
    let depth = Math.round(this.player.pos.y);
    let zone  = this.zoneManager.getZoneName(this.player.pos.y);
    text(`SIZE   ${size.toFixed(1)}`, 14, 12);
    text(`DEPTH  ${depth}`,           14, 30);
    text(`ZONE   ${zone}`,            14, 48);
    pop();

    // ── Progress bar ──
    push();
    let barW  = 280;
    let barH  = 6;
    let barX  = width / 2 - barW / 2;
    let barY  = height - 28;
    let prog  = constrain(size / this.gameManager.winSize, 0, 1);

    fill(20, 40, 70);
    noStroke();
    rect(barX, barY, barW, barH, 3);

    fill(0, 180, 255);
    rect(barX, barY, barW * prog, barH, 3);

    stroke(0, 160, 220, 120);
    strokeWeight(1);
    noFill();
    rect(barX, barY, barW, barH, 3);

    noStroke();
    fill(100, 180, 220, 160);
    textFont('Courier New, monospace');
    textAlign(CENTER, BOTTOM);
    textSize(12);
    text(`${size.toFixed(1)} / ${this.gameManager.winSize}`, width / 2, barY - 4);
    pop();
  }
}
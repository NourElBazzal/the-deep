// Camera.js
// Smooth camera system that follows a target with lerp-based smoothing.

class Camera {
  constructor(x = 0, y = 0) {
    this.pos = createVector(x, y);
    this.lerpSpeed = 0.05;
  }

  follow(target) {
    let targetPos = target.pos.copy();
    this.pos.lerp(targetPos, this.lerpSpeed);

    // Clamp camera so edges of world are never visible
    // Half screen size in world coords is the margin needed
    let halfW = width  / 2;
    let halfH = height / 2;

    this.pos.x = constrain(this.pos.x, halfW,  2000 - halfW);
    this.pos.y = constrain(this.pos.y, halfH,  3000 - halfH);
  }

  apply() {
    translate(-this.pos.x + width / 2, -this.pos.y + height / 2);
  }
}

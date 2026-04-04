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
  }

  apply() {
    translate(-this.pos.x + width / 2, -this.pos.y + height / 2);
  }
}

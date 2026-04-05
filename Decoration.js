class Decoration {
  constructor(images = []) {
    this.images = images;
    this.items = [];

    for (let i = 0; i < 60; i++) {
      // 60% small, 30% medium, 10% large
      let sizeCategory = random();
      let w, h;
      if (sizeCategory < 0.6) {
        w = random(20, 40);
        h = random(35, 70);
      } else if (sizeCategory < 0.9) {
        w = random(40, 70);
        h = random(70, 110);
      } else {
        w = random(70, 110);
        h = random(110, 180);
      }

      this.items.push({
        x: random(0, 2000),
        y: random(2700, 2980),
        w: w,
        h: h,
        imgIndex: floor(random(this.images.length || 1)),
        sway: random(TWO_PI),
        swaySpeed: random(0.008, 0.02)
      });
    }
  }

  show() {
    if (this.images.length === 0) return;
    push();
    for (let d of this.items) {
      let swayX = sin(frameCount * d.swaySpeed + d.sway) * 3;
      push();
      translate(d.x + swayX, d.y);
      imageMode(CENTER);
      tint(255, 200); // slight transparency
      image(this.images[d.imgIndex], 0, -d.h / 2, d.w, d.h);
      noTint();
      pop();
    }
    pop();
  }
}

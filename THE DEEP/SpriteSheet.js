class SpriteSheet {
  constructor(img, frameWidth, frameHeight, frameCount, fps = 12, removeBlack = false) {
    this.img = img;
    this.frameWidth = frameWidth;
    this.frameHeight = frameHeight;
    this.frameCount = frameCount;
    this.fps = fps;
    this.currentFrame = 0;
    this.timer = 0;
    this.framesPerUpdate = Math.max(1, Math.round(60 / fps));
    this.done = false;
    this.looping = true; // default: loop forever
    this.removeBlack = removeBlack;
  }

  setLooping(val) {
    this.looping = val;
    return this;
  }

  update() {
    // If one-shot and done, stay on last frame
    if (!this.looping && this.done) return;

    this.timer++;
    if (this.timer >= this.framesPerUpdate) {
      this.timer = 0;
      this.currentFrame++;
      if (this.currentFrame >= this.frameCount) {
        if (this.looping) {
          // Loop: reset frame, never set done
          this.currentFrame = 0;
          this.done = false;
        } else {
          // One-shot: clamp to last frame, mark done
          this.currentFrame = this.frameCount - 1;
          this.done = true;
        }
      }
    }
  }

  reset() {
    this.currentFrame = 0;
    this.timer = 0;
    this.done = false;
  }

  draw(displayW, displayH, movingLeft = true) {
    if (!this.img || !this.img.width) return;

    let sx = this.currentFrame * this.frameWidth;
    let sy = 0;

    push();
    imageMode(CENTER);
    if (!movingLeft) scale(-1, 1);
    image(this.img, 0, 0, displayW, displayH, sx, sy, this.frameWidth, this.frameHeight);
    pop();
  }
}
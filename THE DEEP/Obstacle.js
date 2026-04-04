class Obstacle {
  constructor(x, y, radius) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.vertices = [];
    let sides = 8;
    let angleOffset = random(TWO_PI);
    for (let i = 0; i < sides; i++) {
      let angle = angleOffset + map(i, 0, sides, 0, TWO_PI);
      let r = i % 2 === 0 ? this.radius : this.radius * 0.6;
      let vx = cos(angle) * r;
      let vy = sin(angle) * r;
      this.vertices.push({ vx, vy });
    }
  }

  computeAvoidanceForce(vehicle) {
    let d = dist(vehicle.pos.x, vehicle.pos.y, this.x, this.y);
    let avoidRadius = this.radius + vehicle.getRadius() + 40;
    if (d < avoidRadius && d > 0) {
      let force = p5.Vector.sub(vehicle.pos, createVector(this.x, this.y));
      force.normalize();
      force.mult(vehicle.maxForce * map(d, 0, avoidRadius, 3.0, 0));
      return force;
    }
    return createVector(0, 0);
  }

  show() {
    push();
    translate(this.x, this.y);
    fill(40, 35, 45);
    stroke(80, 70, 90);
    strokeWeight(2);
    beginShape();
    for (let v of this.vertices) {
      vertex(v.vx, v.vy);
    }
    endShape(CLOSE);
    pop();
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

class BehaviorManager {
  constructor(vehicle) {
    this.vehicle   = vehicle;
    this.behaviors = {}; // name → { fn, weight, active }
  }

  // API 

  // Add a named behavior with a weight
  // fn must be a function that returns a p5.Vector force
  add(name, fn, weight = 1.0) {
    this.behaviors[name] = {
      fn,
      weight,
      active: true
    };
    return this; // chainable
  }

  // Remove a behavior entirely
  remove(name) {
    delete this.behaviors[name];
    return this;
  }

  // Activate a behavior
  activate(name) {
    if (this.behaviors[name]) {
      this.behaviors[name].active = true;
    }
    return this;
  }

  // Deactivate a behavior (keeps it registered but ignores it)
  deactivate(name) {
    if (this.behaviors[name]) {
      this.behaviors[name].active = false;
    }
    return this;
  }

  // Change the weight of a behavior
  setWeight(name, weight) {
    if (this.behaviors[name]) {
      this.behaviors[name].weight = weight;
    }
    return this;
  }

  // Check if a behavior is registered and active
  isActive(name) {
    return this.behaviors[name] && this.behaviors[name].active;
  }

  // Get list of all registered behavior names
  getNames() {
    return Object.keys(this.behaviors);
  }

  // Core: compute combined steering force 

  getSteeringForce() {
    let total = createVector(0, 0);

    for (let name in this.behaviors) {
      let b = this.behaviors[name];
      if (!b.active) continue;

      let force = b.fn(); // call the behavior function
      if (force && force.mag() > 0) {
        force.mult(b.weight);
        total.add(force);
      }
    }

    total.limit(this.vehicle.maxForce * 3);
    return total;
  }

  // Save / load behavior configurations

  // Save current weights and active states as a plain object
  save() {
    let config = {};
    for (let name in this.behaviors) {
      config[name] = {
        weight: this.behaviors[name].weight,
        active: this.behaviors[name].active
      };
    }
    return config;
  }

  // Restore weights and active states from a saved config
  // Does not change the behavior functions themselves
  load(config) {
    for (let name in config) {
      if (this.behaviors[name]) {
        this.behaviors[name].weight = config[name].weight;
        this.behaviors[name].active = config[name].active;
      }
    }
    return this;
  }

  // Debug

  // Returns a readable summary of all behaviors
  describe() {
    let lines = [];
    for (let name in this.behaviors) {
      let b = this.behaviors[name];
      lines.push(
        `${b.active ? '●' : '○'} ${name.padEnd(14)} w=${b.weight.toFixed(2)}`
      );
    }
    return lines.join('\n');
  }
}
class ZoneManager {
  constructor() {
    this.zones = {
      surface: { min: 0, max: 700, name: "Surface" },
      twilight: { min: 700, max: 1500, name: "Twilight" },
      midnight: { min: 1500, max: 2300, name: "Midnight" },
      abyss: { min: 2300, max: 3000, name: "Abyss" }
    };
  }

  getZone(y) {
    for (let key in this.zones) {
      if (y >= this.zones[key].min && y < this.zones[key].max) {
        return this.zones[key];
      }
    }
    return this.zones.abyss; // default
  }

  getZoneName(y) {
    return this.getZone(y).name;
  }
}
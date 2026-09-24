/*
 * Gridiron Arcade simulation foundation.
 *
 * This file is intentionally dependency-free so it can be imported later by
 * the canvas prototype, a test runner, or a future WebGL client.
 */

export const SURFACES = {
  dryGrass: { friction: 0.82, bounce: 0.34 },
  muddyGrass: { friction: 0.58, bounce: 0.22 },
  wetSynthetic: { friction: 0.68, bounce: 0.42 },
  drySynthetic: { friction: 0.76, bounce: 0.48 },
};

export const WEATHER = {
  clear: { drag: 1, ballMass: 1, grip: 1 },
  rain: { drag: 1.08, ballMass: 1.04, grip: 0.5 },
  snow: { drag: 1.15, ballMass: 1.07, grip: 0.46 },
};

export const DEFAULT_ATTRIBUTES = {
  speed: 80,
  acceleration: 72,
  agility: 72,
  strength: 70,
  awareness: 70,
  catching: 70,
  throwPower: 70,
  throwAccuracy: 70,
  stamina: 100,
  durability: 75,
};

export class PlayerMotor {
  constructor(attributes = {}) {
    this.attributes = { ...DEFAULT_ATTRIBUTES, ...attributes };
    this.position = { x: 0, y: 0 };
    this.velocity = { x: 0, y: 0 };
    this.stamina = this.attributes.stamina;
  }

  step(input, dt, surface = SURFACES.dryGrass) {
    const magnitude = Math.hypot(input.x, input.y) || 1;
    const sprinting = Boolean(input.sprint) && this.stamina > 0;
    const targetSpeed = this.attributes.speed * (sprinting ? 1.18 : 0.72);
    const target = {
      x: (input.x / magnitude) * targetSpeed,
      y: (input.y / magnitude) * targetSpeed,
    };
    const response = Math.min(1, (this.attributes.acceleration / 100) * dt * 8);

    this.velocity.x += (target.x - this.velocity.x) * response;
    this.velocity.y += (target.y - this.velocity.y) * response;
    this.velocity.x *= surface.friction > 0 ? 1 - (1 - surface.friction) * dt : 1;
    this.velocity.y *= surface.friction > 0 ? 1 - (1 - surface.friction) * dt : 1;
    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;

    if (sprinting && (input.x || input.y)) {
      this.stamina = Math.max(0, this.stamina - dt * 10);
    } else {
      this.stamina = Math.min(this.attributes.stamina, this.stamina + dt * 4);
    }

    return this.position;
  }
}

export class BallPhysics {
  constructor({ surface = 'dryGrass', weather = 'clear', wind = { x: 0, y: 0 } } = {}) {
    this.surface = SURFACES[surface] || SURFACES.dryGrass;
    this.weather = WEATHER[weather] || WEATHER.clear;
    this.wind = wind;
    this.position = { x: 0, y: 0, z: 0 };
    this.velocity = { x: 0, y: 0, z: 0 };
    this.spin = { x: 0, y: 0, z: 0 };
  }

  launch(position, velocity, spin = { x: 0, y: 0, z: 0 }) {
    this.position = { ...position };
    this.velocity = { ...velocity };
    this.spin = { ...spin };
  }

  step(dt) {
    const drag = 0.08 * this.weather.drag;
    const magnus = {
      x: this.spin.z * this.velocity.y * 0.0008,
      y: -this.spin.z * this.velocity.x * 0.0008,
    };

    this.velocity.x += (this.wind.x + magnus.x) * dt;
    this.velocity.y += (this.wind.y + magnus.y) * dt;
    this.velocity.z -= 9.81 * dt;
    this.velocity.x *= Math.max(0, 1 - drag * dt);
    this.velocity.y *= Math.max(0, 1 - drag * dt);
    this.velocity.z *= Math.max(0, 1 - drag * dt);
    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;
    this.position.z += this.velocity.z * dt;
    this.spin.x *= Math.max(0, 1 - 0.25 * dt);
    this.spin.y *= Math.max(0, 1 - 0.25 * dt);
    this.spin.z *= Math.max(0, 1 - 0.25 * dt);

    if (this.position.z <= 0) {
      this.position.z = 0;
      this.velocity.z = Math.abs(this.velocity.z) * this.surface.bounce;
      this.velocity.x *= this.surface.friction;
      this.velocity.y *= this.surface.friction;
    }

    return this.position;
  }
}

export class RulesEngine {
  constructor() {
    this.down = 1;
    this.yardsToGo = 10;
    this.lineOfScrimmage = 0;
    this.firstDownMarker = 10;
    this.forwardProgress = 0;
  }

  recordPlay(endPosition, { incomplete = false, touchdown = false, safety = false } = {}) {
    if (touchdown) return { result: 'touchdown' };
    if (safety) return { result: 'safety' };
    if (incomplete) {
      this.down += 1;
      return this.down > 4 ? { result: 'turnoverOnDowns' } : { result: 'incomplete', down: this.down };
    }

    const gained = endPosition - this.lineOfScrimmage;
    this.forwardProgress = Math.max(this.forwardProgress, endPosition);
    this.yardsToGo -= Math.max(0, gained);

    if (this.yardsToGo <= 0) {
      this.down = 1;
      this.lineOfScrimmage = endPosition;
      this.yardsToGo = 10;
      return { result: 'firstDown', gained };
    }

    this.down += 1;
    return this.down > 4
      ? { result: 'turnoverOnDowns', gained }
      : { result: 'tackle', gained, down: this.down, yardsToGo: Math.ceil(this.yardsToGo) };
  }
}

export class StatAggregator {
  constructor() {
    this.stats = {};
  }

  record(playerId, event, amount = 1) {
    if (!this.stats[playerId]) this.stats[playerId] = {};
    this.stats[playerId][event] = (this.stats[playerId][event] || 0) + amount;
  }

  snapshot() {
    return JSON.parse(JSON.stringify(this.stats));
  }
}

export function createPlayer(id, name, position, attributes = {}) {
  return { id, name, position, attributes: { ...DEFAULT_ATTRIBUTES, ...attributes } };
}

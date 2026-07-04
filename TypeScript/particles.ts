/**
 * ParticleSystem — TypeScript implementation mirroring the Rust/WASM API.
 *
 * Drop-in replacement for particles-wasm: identical public interface.
 * Swap `import { ParticleSystem } from './particles'` for the WASM import
 * and everything continues working without any other code changes.
 *
 * get_data() layout — 9 floats per particle (STRIDE = 9):
 *   [0] x        [1] y        [2] r (0–1)   [3] g (0–1)   [4] b (0–1)
 *   [5] alpha    [6] size     [7] rotation  [8] kind
 *
 * kind: 0 = circle · 1 = heart · 2 = star · 3 = sparkle
 */

// ── Constants ─────────────────────────────────────────────────────────────────

const STRIDE      = 9;
const MAX_ACTIVE  = 2000;   // hard cap; oldest evicted when exceeded
const FLEE_RADIUS = 150;    // px, flee trigger distance

// ── Mulberry32 PRNG ───────────────────────────────────────────────────────────
// Fast, high-quality 32-bit PRNG. No BigInt, no global state.
// Each ParticleSystem instance owns its own Rng so simulations are independent.

class Rng {
  private s: number;
  constructor(seed = 0x5eed_1234) { this.s = seed >>> 0; }

  next(): number {
    this.s = (this.s + 0x6d2b_79f5) >>> 0;
    let z = this.s;
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    return ((z ^ (z >>> 14)) >>> 0) / 0x1_0000_0000;
  }

  /** Uniform float in [lo, hi) */
  range(lo: number, hi: number): number { return lo + this.next() * (hi - lo); }
  /** Uniform integer in [lo, hi) */
  int  (lo: number, hi: number): number { return Math.floor(this.range(lo, hi)); }
}

// ── Palettes ──────────────────────────────────────────────────────────────────

const HEART_PALETTE = [
  [1.00, 0.18, 0.27], [1.00, 0.34, 0.47], [1.00, 0.55, 0.68],
  [1.00, 0.75, 0.80], [0.95, 0.20, 0.60], [0.85, 0.10, 0.40],
  [1.00, 0.88, 0.20], [1.00, 0.95, 0.95],
] as const;

const CELEBRATION_PALETTE = [
  [1.00, 0.18, 0.27], [1.00, 0.55, 0.00], [1.00, 0.90, 0.00],
  [0.15, 0.85, 0.40], [0.10, 0.65, 1.00], [0.60, 0.20, 1.00],
  [1.00, 0.20, 0.80], [0.95, 0.20, 0.55], [0.40, 1.00, 0.80],
  [1.00, 0.75, 0.80],
] as const;

// ── Particle internal structure ───────────────────────────────────────────────

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  r: number; g: number; b: number;
  alpha: number;
  size: number;
  rotation: number;
  rotSpeed: number;
  life: number;        // 1 → 0
  decay: number;       // life lost per second
  gravity: number;     // px/s² downward acceleration
  drag: number;        // velocity multiplier per second (≤1)
  drift: number;       // sinusoidal horizontal wind amplitude (px/s)
  driftFreq: number;   // drift oscillation frequency (Hz)
  age: number;         // seconds alive (drives drift phase)
  kind: 0 | 1 | 2 | 3;
}

function freshParticle(): Particle {
  return {
    x:0, y:0, vx:0, vy:0, r:1, g:0, b:0, alpha:1, size:12,
    rotation:0, rotSpeed:0, life:1, decay:0.8, gravity:160,
    drag:0.93, drift:0, driftFreq:1, age:0, kind:1,
  };
}

// ── ParticleSystem ────────────────────────────────────────────────────────────

export class ParticleSystem {
  private active: Particle[] = [];
  private pool:   Particle[] = [];
  private rng:    Rng;
  private _buf:   Float32Array = new Float32Array(STRIDE * 256);

  width:  number;
  height: number;

  constructor(width: number, height: number, seed?: number) {
    this.width  = width;
    this.height = height;
    this.rng    = new Rng(seed);
    // Pre-warm pool
    for (let i = 0; i < 512; i++) this.pool.push(freshParticle());
  }

  // ── Pool management ─────────────────────────────────────────────────────────

  private acquire(): Particle {
    // Evict the least-alive particle if at cap
    if (this.active.length >= MAX_ACTIVE) {
      let minIdx = 0;
      for (let i = 1; i < this.active.length; i++) {
        if (this.active[i].life < this.active[minIdx].life) minIdx = i;
      }
      this.pool.push(this.active.splice(minIdx, 1)[0]);
    }
    return this.pool.length ? this.pool.pop()! : freshParticle();
  }

  // ── Public API (matches Rust/WASM exactly) ──────────────────────────────────

  resize(width: number, height: number): void {
    this.width  = width;
    this.height = height;
  }

  clear(): void {
    for (const p of this.active) this.pool.push(p);
    this.active = [];
  }

  /**
   * Radial burst from a single point — triggered by YES button click.
   * Spawns hearts, stars, sparkles at high velocity.
   */
  spawn_burst(x: number, y: number, count: number): void {
    const { rng } = this;
    for (let i = 0; i < count; i++) {
      const p    = this.acquire();
      const angle = rng.range(0, Math.PI * 2);
      const speed = rng.range(250, 750);
      const col   = HEART_PALETTE[rng.int(0, HEART_PALETTE.length)];
      const kr    = rng.next();
      p.x         = x;
      p.y         = y;
      p.vx        = Math.cos(angle) * speed;
      p.vy        = Math.sin(angle) * speed - rng.range(100, 400);
      p.r         = col[0]; p.g = col[1]; p.b = col[2];
      p.alpha     = 1;
      p.size      = rng.range(10, 34);
      p.rotation  = rng.range(0, Math.PI * 2);
      p.rotSpeed  = rng.range(-6, 6);
      p.life      = 1;
      p.decay     = rng.range(0.30, 0.65);
      p.gravity   = rng.range(120, 300);
      p.drag      = rng.range(0.90, 0.97);
      p.drift     = rng.range(0, 25);
      p.driftFreq = rng.range(1, 4);
      p.age       = 0;
      p.kind      = kr < 0.50 ? 1 : kr < 0.75 ? 2 : kr < 0.90 ? 3 : 0;
      this.active.push(p);
    }
  }

  /**
   * Gentle hearts drifting down from above the viewport.
   * Used as ambient background animation on the question screen.
   */
  spawn_hearts(count: number): void {
    const { rng } = this;
    for (let i = 0; i < count; i++) {
      const p   = this.acquire();
      const col = HEART_PALETTE[rng.int(0, HEART_PALETTE.length)];
      p.x         = rng.range(0, this.width);
      p.y         = rng.range(-50, -5);
      p.vx        = rng.range(-15, 15);
      p.vy        = rng.range(35, 100);
      p.r         = col[0]; p.g = col[1]; p.b = col[2];
      p.alpha     = rng.range(0.45, 0.85);
      p.size      = rng.range(8, 24);
      p.rotation  = rng.range(-0.4, 0.4);
      p.rotSpeed  = rng.range(-0.6, 0.6);
      p.life      = 1;
      p.decay     = rng.range(0.05, 0.14);
      p.gravity   = rng.range(-8, 12);
      p.drag      = 0.99;
      p.drift     = rng.range(20, 60);
      p.driftFreq = rng.range(0.4, 1.8);
      p.age       = rng.range(0, Math.PI * 2); // randomise initial drift phase
      p.kind      = 1;
      this.active.push(p);
    }
  }

  /**
   * Multi-origin celebration burst — fills the screen on YES.
   * Uses the full celebration colour palette (reds, golds, blues, purples…).
   */
  spawn_celebration(count: number): void {
    const { rng } = this;
    for (let i = 0; i < count; i++) {
      const p     = this.acquire();
      const angle  = rng.range(0, Math.PI * 2);
      const speed  = rng.range(100, 650);
      const col    = CELEBRATION_PALETTE[rng.int(0, CELEBRATION_PALETTE.length)];
      const kr     = rng.next();
      p.x         = rng.range(this.width * 0.15, this.width * 0.85);
      p.y         = rng.range(this.height * 0.05, this.height * 0.55);
      p.vx        = Math.cos(angle) * speed;
      p.vy        = Math.sin(angle) * speed - rng.range(0, 300);
      p.r         = col[0]; p.g = col[1]; p.b = col[2];
      p.alpha     = 1;
      p.size      = rng.range(7, 30);
      p.rotation  = rng.range(0, Math.PI * 2);
      p.rotSpeed  = rng.range(-7, 7);
      p.life      = 1;
      p.decay     = rng.range(0.22, 0.55);
      p.gravity   = rng.range(90, 260);
      p.drag      = rng.range(0.88, 0.96);
      p.drift     = rng.range(0, 30);
      p.driftFreq = rng.range(1, 5);
      p.age       = 0;
      p.kind      = kr < 0.35 ? 1 : kr < 0.55 ? 2 : kr < 0.75 ? 3 : 0;
      this.active.push(p);
    }
  }

  // ── Physics step ────────────────────────────────────────────────────────────

  update(dt: number): void {
    const W = this.width;
    const H = this.height;
    let write = 0;

    for (let i = 0; i < this.active.length; i++) {
      const p = this.active[i];
      p.age += dt;

      // Sinusoidal horizontal wind drift
      p.vx += Math.sin(p.age * p.driftFreq * Math.PI * 2) * p.drift * dt;

      // Gravity + drag (exponential decay approach)
      p.vy   += p.gravity * dt;
      const d = Math.pow(p.drag, dt * 60); // frame-rate independent drag
      p.vx   *= d;
      p.vy   *= d;

      p.x        += p.vx * dt;
      p.y        += p.vy * dt;
      p.rotation += p.rotSpeed * dt;
      p.life     -= p.decay * dt;

      // Smooth alpha: full brightness until life < 0.5, then fades out
      p.alpha = Math.max(0, Math.min(1, p.life * 2));

      // Keep if still alive and on-screen (generous margins)
      if (p.life > 0 && p.y < H + 80 && p.x > -80 && p.x < W + 80) {
        this.active[write++] = p;
      } else {
        this.pool.push(p);
      }
    }

    this.active.length = write;
  }

  // ── Output ──────────────────────────────────────────────────────────────────

  /** Returns a Float32Array view of particle data (STRIDE floats per particle). */
  get_data(): Float32Array {
    const count  = this.active.length;
    const needed = count * STRIDE;
    if (this._buf.length < needed) {
      this._buf = new Float32Array(Math.ceil(needed * 1.5));
    }
    for (let i = 0; i < count; i++) {
      const p   = this.active[i];
      const off = i * STRIDE;
      this._buf[off]     = p.x;
      this._buf[off + 1] = p.y;
      this._buf[off + 2] = p.r;
      this._buf[off + 3] = p.g;
      this._buf[off + 4] = p.b;
      this._buf[off + 5] = p.alpha;
      this._buf[off + 6] = p.size;
      this._buf[off + 7] = p.rotation;
      this._buf[off + 8] = p.kind;
    }
    return this._buf;
  }

  particle_count(): number { return this.active.length; }
}

// Re-export flee radius constant so Buttons.tsx can read it
export { FLEE_RADIUS };

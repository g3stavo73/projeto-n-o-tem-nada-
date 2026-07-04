import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { ParticleSystem } from '../particles';
import '../styles/particles.scss';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ParticlesRef {
  triggerExplosion: (x: number, y: number) => void;
}

interface ParticlesProps {
  phase: 'question' | 'celebrating' | 'done';
  onExplosionDone: () => void;
}

// ── Path2D shapes (unit-sized, scaled via ctx.scale) ─────────────────────────
// Built once, reused every frame — much cheaper than rebuilding bezier paths.

function buildHeartPath(): Path2D {
  const p = new Path2D();
  // A proper heart built from two mirrored cubic beziers.
  // Fits in roughly [-5, 5] × [-5, 8].
  p.moveTo(0, -2);
  p.bezierCurveTo(-1, -5,  -5, -5,  -5,  0);
  p.bezierCurveTo(-5,  4,   0,  7,   0,  9);
  p.bezierCurveTo( 0,  7,   5,  4,   5,  0);
  p.bezierCurveTo( 5, -5,   1, -5,   0, -2);
  p.closePath();
  return p;
}

function buildStarPath(): Path2D {
  const p = new Path2D();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 5 : 2.2;
    const a = (Math.PI * 2 * i) / 10 - Math.PI / 2;
    i === 0 ? p.moveTo(Math.cos(a) * r, Math.sin(a) * r)
             : p.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  p.closePath();
  return p;
}

function buildSparklePath(): Path2D {
  const p = new Path2D();
  p.moveTo(0, -5.5);
  p.quadraticCurveTo(0.6,  0,  5.5, 0);
  p.quadraticCurveTo(0.6,  0,  0,   5.5);
  p.quadraticCurveTo(-0.6, 0, -5.5, 0);
  p.quadraticCurveTo(-0.6, 0,  0,  -5.5);
  p.closePath();
  return p;
}

// ── Component ─────────────────────────────────────────────────────────────────

export const Particles = forwardRef<ParticlesRef, ParticlesProps>(
  ({ phase, onExplosionDone }, ref) => {
    const canvasRef    = useRef<HTMLCanvasElement>(null);
    const psRef        = useRef<ParticleSystem | null>(null);
    const rafId        = useRef<number>(0);
    const lastTime     = useRef<number>(0);
    const intervalRef  = useRef<number>(0);
    // Path2D shapes — built once on first render
    const paths = useRef<{ heart: Path2D; star: Path2D; sparkle: Path2D } | null>(null);

    useImperativeHandle(ref, () => ({
      triggerExplosion: (x: number, y: number) => {
        if (psRef.current) {
          psRef.current.spawn_celebration(450);
          psRef.current.spawn_burst(x, y, 220);
        }
      },
    }));

    // ── Canvas setup & rAF render loop ────────────────────────────────────────
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Build shape paths once
      if (!paths.current) {
        paths.current = {
          heart:   buildHeartPath(),
          star:    buildStarPath(),
          sparkle: buildSparklePath(),
        };
      }

      const dpr = window.devicePixelRatio || 1;

      const resize = () => {
        const W = window.innerWidth;
        const H = window.innerHeight;
        // HiDPI: draw at physical resolution, CSS size stays logical
        canvas.width  = W * dpr;
        canvas.height = H * dpr;
        canvas.style.width  = `${W}px`;
        canvas.style.height = `${H}px`;

        if (psRef.current) {
          psRef.current.resize(W, H);
        } else {
          psRef.current = new ParticleSystem(W, H);
        }
      };

      window.addEventListener('resize', resize);
      resize();

      const { heart, star, sparkle } = paths.current!;

      const render = (time: number) => {
        if (!lastTime.current) lastTime.current = time;
        const rawDt = (time - lastTime.current) / 1000;
        // Clamp dt so a tab-switch doesn't explode physics
        const dt = Math.min(rawDt, 0.05);
        lastTime.current = time;

        const ps = psRef.current;
        if (ps) {
          ps.update(dt);
          const data  = ps.get_data();
          const count = ps.particle_count();

          // Scale canvas coordinates to logical pixels
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

          for (let i = 0; i < count; i++) {
            const off  = i * 9;
            const px   = data[off];
            const py   = data[off + 1];
            const r    = data[off + 2];
            const g    = data[off + 3];
            const b    = data[off + 4];
            const a    = data[off + 5];
            const size = data[off + 6];
            const rot  = data[off + 7];
            const kind = data[off + 8];

            ctx.save();
            ctx.translate(px, py);
            ctx.rotate(rot);
            // Normalise: paths are drawn in ~[-5,5] space, scale to desired size
            const s = size / 10;
            ctx.scale(s, s);
            ctx.fillStyle = `rgba(${(r * 255) | 0},${(g * 255) | 0},${(b * 255) | 0},${a.toFixed(3)})`;

            switch (kind) {
              case 1:  // heart
                ctx.fill(heart);
                break;
              case 2:  // star
                ctx.fill(star);
                break;
              case 3:  // sparkle
                ctx.fill(sparkle);
                break;
              default: // circle
                ctx.beginPath();
                ctx.arc(0, 0, 5, 0, Math.PI * 2);
                ctx.fill();
                break;
            }

            ctx.restore();
          }
        }

        rafId.current = requestAnimationFrame(render);
      };

      rafId.current = requestAnimationFrame(render);

      return () => {
        window.removeEventListener('resize', resize);
        cancelAnimationFrame(rafId.current);
      };
    }, []);

    // ── Phase-driven spawning intervals ───────────────────────────────────────
    useEffect(() => {
      clearInterval(intervalRef.current);
      let timeoutId: number;

      if (phase === 'question') {
        // Slow ambient hearts
        intervalRef.current = window.setInterval(() => {
          psRef.current?.spawn_hearts(2);
        }, 900);
      } else if (phase === 'celebrating') {
        // Dense hearts during celebration
        intervalRef.current = window.setInterval(() => {
          psRef.current?.spawn_hearts(5);
        }, 150);
        // Transition to 'done' after explosion settles
        timeoutId = window.setTimeout(onExplosionDone, 1800);
      } else if (phase === 'done') {
        // Steady romantic shower
        intervalRef.current = window.setInterval(() => {
          psRef.current?.spawn_hearts(3);
        }, 500);
      }

      return () => {
        clearInterval(intervalRef.current);
        clearTimeout(timeoutId);
      };
    }, [phase, onExplosionDone]);

    return <canvas ref={canvasRef} className="particles-canvas" />;
  },
);

Particles.displayName = 'Particles';

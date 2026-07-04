import '../styles/code.scss';

function highlight(code: string): string {
  // escape HTML first
  let s = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  // comments
  s = s.replace(/(\/\/[^\n]*)/g, '<span class="cm">$1</span>');
  // strings
  s = s.replace(/('([^'\\]|\\.)*'|"([^"\\]|\\.)*"|`([^`\\]|\\.)*`)/g, '<span class="str">$1</span>');
  // keywords
  s = s.replace(/\b(const|let|var|function|return|export|import|from|interface|type|class|new|if|else|for|while|async|await|pub|fn|impl|struct|use|mut|self|default)\b/g, '<span class="kw">$1</span>');
  // numbers
  s = s.replace(/\b(\d+\.?\d*)\b/g, '<span class="nb">$1</span>');
  return s;
}

const snippet1 = `interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  g: number;
  b: number;
  alpha: number;
  size: number;
  rotation: number;
  rotSpeed: number;
  life: number;
  decay: number;
  gravity: number;
  drag: number;
  kind: number; // 0=circle 1=heart 2=star 3=sparkle
}

export class ParticleSystem {
  // ...
  /** Burst of mixed shapes from a single point — triggered by YES click */
  spawn_burst(x: number, y: number, count: number): void {
    for (let i = 0; i < count; i++) {
      advanceSeed(i + 1);
      const angle = rngRange(0, Math.PI * 2);
      const speed = rngRange(80, 600);
      const [r, g, b] = heartColor();
      const kr = rngRange(0, 1);
      const kind = kr < 0.5 ? 1 : kr < 0.75 ? 2 : 3;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - rngRange(0, 200),
        r, g, b,
        alpha: 1,
        size: rngRange(12, 36),
        rotation: rngRange(0, Math.PI * 2),
        rotSpeed: rngRange(-4, 4),
        life: 1,
        decay: rngRange(0.4, 0.9),
        gravity: rngRange(80, 200),
        drag: rngRange(0.88, 0.96),
        kind,
      });
    }
  }

  /** Physics step — dt in seconds */
  update(dt: number): void {
    const clampedDt = Math.max(0, Math.min(dt, 0.05));
    const shrink = Math.pow(0.95, clampedDt * 30);
    for (const p of this.particles) {
      p.vx *= p.drag;
      p.vy = p.vy * p.drag + p.gravity * clampedDt;
      p.x += p.vx * clampedDt;
      p.y += p.vy * clampedDt;
      p.rotation += p.rotSpeed * clampedDt;
      p.life -= p.decay * clampedDt;
      p.alpha = Math.max(0, p.life * p.life);
      p.size *= shrink;
    }
    // Remove dead particles
    let write = 0;
    for (let read = 0; read < this.particles.length; read++) {
      const p = this.particles[read];
      if (p.life > 0 && p.size > 1) {
        if (write !== read) this.particles[write] = p;
        write++;
      }
    }
    this.particles.length = write;
  }
}`;

const snippet2 = `      const drawHeart = (ctx: CanvasRenderingContext2D) => {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(0, -3, -5, -3, -5, 0);
        ctx.bezierCurveTo(-5, 3, 0, 5, 0, 8);
        ctx.bezierCurveTo(0, 5, 5, 3, 5, 0);
        ctx.bezierCurveTo(5, -3, 0, -3, 0, 0);
        ctx.fill();
      };

      const drawStar = (ctx: CanvasRenderingContext2D) => {
        ctx.beginPath();
        for (let i = 0; i < 10; i++) {
          const r = i % 2 === 0 ? 5 : 2;
          const a = (Math.PI * 2 * i) / 10 - Math.PI / 2;
          ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.closePath();
        ctx.fill();
      };

      const drawSparkle = (ctx: CanvasRenderingContext2D) => {
        ctx.beginPath();
        ctx.moveTo(0, -5);
        ctx.quadraticCurveTo(0, 0, 5, 0);
        ctx.quadraticCurveTo(0, 0, 0, 5);
        ctx.quadraticCurveTo(0, 0, -5, 0);
        ctx.quadraticCurveTo(0, 0, 0, -5);
        ctx.fill();
      };

      const render = (time: number) => {
        if (!lastTime.current) lastTime.current = time;
        const dt = (time - lastTime.current) / 1000;
        lastTime.current = time;

        const ps = psRef.current;
        if (ps) {
          ps.update(dt);
          const data = ps.get_data();
          const count = ps.particle_count();

          ctx.clearRect(0, 0, canvas.width, canvas.height);

          for (let i = 0; i < count; i++) {
            const off = i * 9;
            const px = data[off];
            const py = data[off + 1];
            const r = data[off + 2];
            const g = data[off + 3];
            const b = data[off + 4];
            const alpha = data[off + 5];
            const size = data[off + 6];
            const rotation = data[off + 7];
            const kind = data[off + 8];

            ctx.save();
            ctx.translate(px, py);
            ctx.rotate(rotation);
            ctx.scale(size / 5, size / 5);

            ctx.fillStyle = \`rgba(\${(r * 255) | 0},\${(g * 255) | 0},\${(b * 255) | 0},\${alpha})\`;

            if (kind === 0) {
              ctx.beginPath();
              ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
              ctx.fill();
            } else if (kind === 1) {
              drawHeart(ctx);
            } else if (kind === 2) {
              drawStar(ctx);
            } else if (kind === 3) {
              drawSparkle(ctx);
            }

            ctx.restore();
          }
        }

        rafId.current = requestAnimationFrame(render);
      };`;

const snippet3 = `  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!noBtnRef.current) return;
      const rect = noBtnRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      
      const dist = Math.hypot(e.clientX - cx, e.clientY - cy);
      
      if (dist < 150) {
        // Flee!
        let newX = 0;
        let newY = 0;
        let attempts = 0;
        do {
          newX = 80 + Math.random() * (window.innerWidth - 160);
          newY = 80 + Math.random() * (window.innerHeight - 160);
          attempts++;
        } while (Math.hypot(e.clientX - newX, e.clientY - newY) < 200 && attempts < 50);
        
        setNoPos({ x: newX - rect.width / 2, y: newY - rect.height / 2 });
        setFleeCount(prev => prev + 1);
      }
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);`;

const snippet4 = `import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/final.scss';

const messages = [
  "Eu sabia! 🥰",
  "Que alegria! ✨",
  "Te amo, Sarah! ❤️",
  "Para sempre juntos 💕",
  "Uhuuuuu! 🎉"
];

export function FinalScreen() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % messages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div 
      className="final-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.5 }}
    >
      <div className="final-overlay" />
      
      <div className="final-content">
        <AnimatePresence mode="wait">
          <motion.h1
            key={index}
            initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
            transition={{ duration: 0.8 }}
            className="final-message"
          >
            {messages[index]}
          </motion.h1>
        </AnimatePresence>

        <motion.div
          className="ring-icon"
          initial={{ scale: 0, y: 50, rotate: -20 }}
          animate={{ scale: 1, y: 0, rotate: 0 }}
          transition={{
            type: "spring",
            stiffness: 100,
            damping: 10,
            delay: 1
          }}
        >
          💍
        </motion.div>
      </div>

      {/* Floating Hearts */}
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={i}
          className="floating-heart"
          initial={{ y: "100vh", opacity: 0, x: Math.random() * 200 - 100 }}
          animate={{ 
            y: "-20vh", 
            opacity: [0, 1, 0],
            x: Math.random() * 200 - 100
          }}
          transition={{
            duration: 6 + Math.random() * 4,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: "linear"
          }}
          style={{
            left: \`\${20 + Math.random() * 60}%\`
          }}
        >
          ❤️
        </motion.div>
      ))}
    </motion.div>
  );
}`;

export function CodeShowcase() {
  return (
    <div className="code-page">
      <a href={import.meta.env.BASE_URL.replace(/\/$/, '') || '/'} className="code-back">
        ← voltar
      </a>
      
      <div className="code-header">
        <h1>Código e Carinho</h1>
        <p>Um pouco de como esse pedido foi feito</p>
        <div className="stack-badges">
          <span>React</span>
          <span>TypeScript</span>
          <span>Framer Motion</span>
          <span>Canvas 2D</span>
          <span>SCSS</span>
        </div>
      </div>

      <div className="code-sections">
        <section className="code-section">
          <h2>Motor de Partículas</h2>
          <p>O coração do projeto. Uma classe TypeScript com a mesma API que o crate Rust/WASM em particles-wasm/src/lib.rs — troque o import e tudo continua funcionando.</p>
          <div className="code-block" dangerouslySetInnerHTML={{ __html: highlight(snippet1) }} />
        </section>

        <section className="code-section">
          <h2>Canvas Renderer</h2>
          <p>Loop de requestAnimationFrame que lê os dados do motor e desenha corações, estrelas e sparkles via Canvas 2D API.</p>
          <div className="code-block" dangerouslySetInnerHTML={{ __html: highlight(snippet2) }} />
        </section>

        <section className="code-section">
          <h2>O Botão que Foge</h2>
          <p>O botão 'Não' monitora a posição do mouse e teleporta para longe quando o cursor se aproxima. Puro CSS transition para a animação de fuga.</p>
          <div className="code-block" dangerouslySetInnerHTML={{ __html: highlight(snippet3) }} />
        </section>

        <section className="code-section">
          <h2>Tela de Celebração</h2>
          <p>Mensagens que ciclam com AnimatePresence do Framer Motion, corações flutuantes e um anel com spring animation.</p>
          <div className="code-block" dangerouslySetInnerHTML={{ __html: highlight(snippet4) }} />
        </section>
      </div>
    </div>
  );
}

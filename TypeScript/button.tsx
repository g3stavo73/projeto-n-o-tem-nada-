import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/buttons.scss';

// ── Constants ─────────────────────────────────────────────────────────────────

const FLEE_TRIGGER_PX  = 140;   // cursor distance that triggers flee
const FLEE_DISTANCE_PX = 260;   // how far the button moves away
const FLEE_COOLDOWN_MS =  80;   // min ms between flees (prevents jitter)
const BTN_MARGIN_PX    =  70;   // minimum distance from viewport edge

// ── Types ─────────────────────────────────────────────────────────────────────

interface ButtonsProps {
  onYes: (x: number, y: number) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

/**
 * Compute a position for the No button that:
 *  1. Is in the opposite direction from the cursor.
 *  2. Stays inside the viewport with margin.
 *  3. Falls back to a perpendicular direction when pinned to an edge.
 */
function fleePosition(
  curX: number, curY: number,
  btnX: number, btnY: number,
  btnW: number, btnH: number,
): { x: number; y: number } {
  const W = window.innerWidth;
  const H = window.innerHeight;

  // Direction away from cursor
  const dx = btnX - curX;
  const dy = btnY - curY;
  const len = Math.hypot(dx, dy) || 1;

  let nx = btnX + (dx / len) * FLEE_DISTANCE_PX;
  let ny = btnY + (dy / len) * FLEE_DISTANCE_PX;

  // Clamp to viewport
  nx = clamp(nx, BTN_MARGIN_PX, W - BTN_MARGIN_PX);
  ny = clamp(ny, BTN_MARGIN_PX, H - BTN_MARGIN_PX);

  // If clamping put us back near the cursor, flee perpendicular instead
  if (Math.hypot(curX - nx, curY - ny) < FLEE_TRIGGER_PX) {
    const px = -dy / len;
    const py =  dx / len;
    const nx2 = clamp(btnX + px * FLEE_DISTANCE_PX, BTN_MARGIN_PX, W - BTN_MARGIN_PX);
    const ny2 = clamp(btnY + py * FLEE_DISTANCE_PX, BTN_MARGIN_PX, H - BTN_MARGIN_PX);
    if (Math.hypot(curX - nx2, curY - ny2) > Math.hypot(curX - nx, curY - ny)) {
      nx = nx2; ny = ny2;
    }
  }

  // Convert from center → top-left origin expected by `fixed` positioning
  return { x: nx - btnW / 2, y: ny - btnH / 2 };
}

// ── Component ─────────────────────────────────────────────────────────────────

export function Buttons({ onYes }: ButtonsProps) {
  const [noPos,     setNoPos]     = useState<{ x: number; y: number } | null>(null);
  const [fleeCount, setFleeCount] = useState(0);
  const [clickMsg,  setClickMsg]  = useState<string | null>(null);

  const noBtnRef   = useRef<HTMLButtonElement>(null);
  const lastFlee   = useRef(0);
  const isFixed    = useRef(false); // tracks if the button is in fixed mode

  // ── Flee on cursor proximity ───────────────────────────────────────────────
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      const btn = noBtnRef.current;
      if (!btn) return;

      const now  = Date.now();
      if (now - lastFlee.current < FLEE_COOLDOWN_MS) return;

      const rect = btn.getBoundingClientRect();
      const bx   = rect.left + rect.width  / 2;
      const by   = rect.top  + rect.height / 2;
      const dist = Math.hypot(e.clientX - bx, e.clientY - by);

      if (dist < FLEE_TRIGGER_PX) {
        lastFlee.current = now;
        isFixed.current  = true;
        const pos = fleePosition(e.clientX, e.clientY, bx, by, rect.width, rect.height);
        setNoPos(pos);
        setFleeCount(c => c + 1);
      }
    };

    document.addEventListener('mousemove', onMouseMove, { passive: true });
    return () => document.removeEventListener('mousemove', onMouseMove);
  }, []);

  // ── "Não" click handler ───────────────────────────────────────────────────
  // (If somehow clicked, show a playful message — no alert())
  const handleNoClick = useCallback(() => {
    const msgs = [
      'Tenho certeza? Clica no ❤️',
      'Não é o botão certo! 🥺',
      'Pensa bem antes de clicar…',
      'O Sim é muito melhor! 😏',
    ];
    const msg = msgs[fleeCount % msgs.length];
    setClickMsg(msg);
    setTimeout(() => setClickMsg(null), 2200);
  }, [fleeCount]);

  return (
    <motion.div
      className="buttons-container"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.9, ease: 'easeOut' }}
    >
      {/* ── YES ─────────────────────────────────────────────────────────────── */}
      <motion.button
        className="btn-yes"
        whileHover={{ scale: 1.06, y: -2 }}
        whileTap={{ scale: 0.94 }}
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          onYes(rect.left + rect.width / 2, rect.top + rect.height / 2);
        }}
      >
        ❤️ Sim
      </motion.button>

      {/* ── NO (fleeing) ─────────────────────────────────────────────────────── */}
      <motion.button
        ref={noBtnRef}
        className="btn-no"
        style={noPos ? { position: 'fixed', left: noPos.x, top: noPos.y } : {}}
        onClick={handleNoClick}
        animate={noPos ? { x: 0, y: 0 } : {}}
        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      >
        💔 Não
      </motion.button>

      {/* ── Tooltip after several flee attempts ──────────────────────────────── */}
      <AnimatePresence>
        {fleeCount >= 3 && (
          <motion.p
            key="tooltip"
            className="flee-tooltip"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            {fleeCount >= 8
              ? 'Eu nunca vou deixar você clicar nesse botão… 😤'
              : 'Não foge não! O ❤️ Sim tá te esperando 🥺'}
          </motion.p>
        )}
      </AnimatePresence>

      {/* ── Inline click message (replaces alert) ────────────────────────────── */}
      <AnimatePresence>
        {clickMsg && (
          <motion.p
            key="clickmsg"
            className="flee-tooltip click-msg"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
          >
            {clickMsg}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

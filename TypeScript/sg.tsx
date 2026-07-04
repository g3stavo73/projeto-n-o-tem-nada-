import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/final.scss';

// ── Messages ──────────────────────────────────────────────────────────────────

const MESSAGES = [
  'Ela disse sim! 🎊',
  'Que alegria imensa! ✨',
  'Te amo, Sarah! ❤️',
  'Para sempre juntos 💕',
  'Uhuuuuu! 🎉',
  'O melhor dia da minha vida 🥹',
  'Você é tudo pra mim 🌹',
  'Agora é oficial! 💍',
  'Meu coração está explodindo 💗',
  'Sarah, minha namorada 🥰',
];

// ── Stable floating-heart positions (computed once on mount) ──────────────────
// Using useMemo prevents Math.random() from running on re-renders.

interface HeartConfig {
  left: number;
  duration: number;
  delay: number;
  emoji: string;
}

const EMOJIS = ['❤️', '💕', '💖', '💗', '💝', '🌹'];

function makeHearts(count: number): HeartConfig[] {
  return Array.from({ length: count }, (_, i) => ({
    left:     8 + (i / count) * 84,
    duration: 5 + ((i * 1.37) % 5),
    delay:    (i * 0.72) % 5,
    emoji:    EMOJIS[i % EMOJIS.length],
  }));
}

// ── Component ─────────────────────────────────────────────────────────────────

export function FinalScreen() {
  const [index, setIndex] = useState(0);

  // Cycle through messages
  useEffect(() => {
    const id = setInterval(() => {
      setIndex(i => (i + 1) % MESSAGES.length);
    }, 2800);
    return () => clearInterval(id);
  }, []);

  // Stable heart configs — never recreated across re-renders
  const hearts = useMemo(() => makeHearts(10), []);

  return (
    <motion.div
      className="final-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2 }}
    >
      {/* Radial overlay */}
      <div className="final-overlay" />

      {/* Main content */}
      <div className="final-content">
        {/* Pulsing big heart */}
        <motion.div
          className="final-big-heart"
          initial={{ scale: 0, rotate: -15 }}
          animate={{ scale: [1, 1.08, 1], rotate: 0 }}
          transition={{
            scale:  { repeat: Infinity, duration: 1.4, ease: 'easeInOut' },
            rotate: { duration: 0.8, type: 'spring', stiffness: 200 },
          }}
        >
          ❤️
        </motion.div>

        {/* Cycling message */}
        <AnimatePresence mode="wait">
          <motion.h1
            key={index}
            className="final-message"
            initial={{ opacity: 0, y: 24, filter: 'blur(12px)', scale: 0.95 }}
            animate={{ opacity: 1, y: 0,  filter: 'blur(0px)',  scale: 1 }}
            exit={{    opacity: 0, y: -18, filter: 'blur(8px)',  scale: 1.02 }}
            transition={{ duration: 0.65, ease: 'easeInOut' }}
          >
            {MESSAGES[index]}
          </motion.h1>
        </AnimatePresence>

        {/* Ring — springs in after 1 second */}
        <motion.div
          className="ring-icon"
          initial={{ scale: 0, y: 40, rotate: -25, opacity: 0 }}
          animate={{ scale: 1, y: 0,  rotate: 0,   opacity: 1 }}
          transition={{ type: 'spring', stiffness: 180, damping: 14, delay: 1.1 }}
        >
          💍
        </motion.div>
      </div>

      {/* Floating hearts — stable positions from useMemo */}
      {hearts.map((h, i) => (
        <motion.span
          key={i}
          className="floating-heart"
          style={{ left: `${h.left}%` }}
          initial={{ y: '105vh', opacity: 0 }}
          animate={{ y: '-15vh', opacity: [0, 0.9, 0] }}
          transition={{
            duration: h.duration,
            delay:    h.delay,
            repeat:   Infinity,
            ease:     'linear',
          }}
        >
          {h.emoji}
        </motion.span>
      ))}
    </motion.div>
  );
}
 

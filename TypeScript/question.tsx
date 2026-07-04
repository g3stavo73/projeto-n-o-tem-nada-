import { motion } from 'framer-motion';
import '../styles/question.scss';

const photoUrl = '/photo.svg';

export function Question() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.2, ease: "easeOut" }}
    >
      <motion.div
        className="question-card"
        animate={{ y: [0, -10, 0] }}
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
      >
        <div className="question-content">
          <div className="photo-frame">
            <img
              src={photoUrl}
              alt="Nossa foto"
              onError={(e) => { (e.target as HTMLImageElement).src = '/photo.svg'; }}
            />
          </div>
          <div className="heart-icon-container">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              className="pulse-heart"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </motion.div>
          </div>
          <h1 className="sarah-name">Sarah</h1>
          <h2 className="proposal-text">quer namorar comigo?</h2>
        </div>
      </motion.div>
    </motion.div>
  );
}

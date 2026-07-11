import { motion } from 'framer-motion';

export const springSnappy = {
  type: 'spring',
  stiffness: 400,
  damping: 30,
};

export const springBouncy = {
  type: 'spring',
  stiffness: 300,
  damping: 15,
};

export const springSmooth = {
  type: 'spring',
  stiffness: 120,
  damping: 25,
};

export const CustomTransitions = {
  clipReveal: {
    initial: { clipPath: 'circle(0% at 50% 50%)' },
    animate: { clipPath: 'circle(150% at 50% 50%)' },
    exit: { clipPath: 'circle(0% at 50% 50%)', opacity: 0 },
    transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] }
  },
  wipeRight: {
    initial: { clipPath: 'polygon(0 0, 0 0, 0 100%, 0 100%)' },
    animate: { clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' },
    exit: { clipPath: 'polygon(100% 0, 100% 0, 100% 100%, 100% 100%)', opacity: 0 },
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
  }
};

export const TextReveal = ({ text, delay = 0, className = "" }: { text: string, delay?: number, className?: string }) => {
  return (
    <motion.div className="flex flex-wrap gap-x-[0.3em]">
      {text.split(' ').map((word, i) => (
        <motion.span
          key={i}
          className={`inline-block ${className}`}
          initial={{ y: 80, rotateZ: 15, opacity: 0, scale: 0.8 }}
          animate={{ y: 0, rotateZ: 0, opacity: 1, scale: 1 }}
          exit={{ y: -80, opacity: 0, scale: 0.8 }}
          transition={{
            duration: 0.8,
            ease: [0.16, 1, 0.3, 1],
            delay: delay + i * 0.1,
          }}
        >
          {word}
        </motion.span>
      ))}
    </motion.div>
  );
};

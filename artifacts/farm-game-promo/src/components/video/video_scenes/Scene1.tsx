import { motion } from 'framer-motion';
import { springBouncy, CustomTransitions, TextReveal } from '../utils';

export const Scene1 = () => {
  return (
    <motion.div
      className="absolute inset-0 w-full h-full flex flex-col items-center justify-center z-10"
      {...CustomTransitions.wipeRight}
    >
      <motion.img
        src={`${import.meta.env.BASE_URL}images/mascot-full.png`}
        className="absolute bottom-[-10vh] right-[10vw] h-[80vh] object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
        initial={{ y: '100%', rotate: 10, scale: 0.8 }}
        animate={{ y: 0, rotate: 0, scale: 1 }}
        exit={{ x: '100%', opacity: 0, transition: { duration: 0.8 } }}
        transition={{ ...springBouncy, delay: 0.4 }}
      />

      <div className="absolute left-[8vw] top-[25vh] max-w-[55vw]">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ ...springBouncy, delay: 0.2 }}
          className="bg-primary text-bg-dark font-display font-bold text-3xl px-6 py-3 rounded-full mb-6 inline-block transform -rotate-2 border-4 border-bg-dark shadow-[4px_4px_0px_#1E293B]"
        >
          TELEGRAM'IN EN EĞLENCELİ OYUNU
        </motion.div>

        <h1 className="text-[5.5rem] font-display font-extrabold text-white text-stroke text-shadow-game leading-[1.1] flex flex-col">
          <TextReveal text="SARI'NIN" delay={0.6} className="text-primary" />
          <TextReveal text="ÇİFTLİĞİNE" delay={0.7} />
          <TextReveal text="HOŞ GELDİN!" delay={0.8} />
        </h1>
      </div>
      
      {/* Decorative floating elements */}
      <motion.div 
        className="absolute left-[5vw] bottom-[10vh] w-24 h-24 bg-secondary rounded-full border-4 border-bg-dark shadow-[4px_4px_0px_#1E293B]"
        initial={{ scale: 0 }}
        animate={{ scale: 1, y: [0, -20, 0] }}
        exit={{ scale: 0 }}
        transition={{ scale: { delay: 1, ...springBouncy }, y: { duration: 3, repeat: Infinity, ease: "easeInOut" } }}
      />
      <motion.div 
        className="absolute right-[45vw] top-[15vh] w-16 h-16 bg-accent rounded-full border-4 border-bg-dark shadow-[4px_4px_0px_#1E293B]"
        initial={{ scale: 0 }}
        animate={{ scale: 1, y: [0, 20, 0] }}
        exit={{ scale: 0 }}
        transition={{ scale: { delay: 1.2, ...springBouncy }, y: { duration: 2.5, repeat: Infinity, ease: "easeInOut" } }}
      />
    </motion.div>
  );
};

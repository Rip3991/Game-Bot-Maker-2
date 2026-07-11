import { motion } from 'framer-motion';
import { springBouncy, CustomTransitions, TextReveal } from '../utils';

export const Scene3 = () => {
  return (
    <motion.div
      className="absolute inset-0 w-full h-full flex flex-col items-center justify-center z-10"
      {...CustomTransitions.wipeRight}
    >
      <div className="absolute top-[15vh] w-full text-center z-20">
        <h1 className="text-[6rem] font-display font-extrabold text-white text-stroke text-shadow-game leading-[1.1] inline-flex flex-col items-center">
          <TextReveal text="OYNADIKÇA" delay={0.2} />
          <div className="flex gap-4 items-center">
            <TextReveal text="GERÇEK TL" delay={0.4} className="text-primary" />
            <TextReveal text="KAZAN" delay={0.6} />
          </div>
        </h1>
      </div>

      <div className="relative w-full h-full flex items-center justify-center mt-[10vh]">
        <motion.img
          src={`${import.meta.env.BASE_URL}images/vault.jpg`}
          className="absolute z-10 h-[50vh] object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
          initial={{ scale: 0, y: 100 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0, transition: { duration: 0.5 } }}
          transition={{ ...springBouncy, delay: 0.8 }}
        />
        
        {/* Bursting coins */}
        <motion.img
          src={`${import.meta.env.BASE_URL}images/tl-coins.png`}
          className="absolute z-20 h-[70vh] object-contain drop-shadow-[0_10px_30px_rgba(0,0,0,0.3)]"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ opacity: 0, scale: 1.5 }}
          transition={{ ...springBouncy, delay: 1.2, stiffness: 200 }}
        />
      </div>

      <motion.div
        className="absolute bottom-[12vh] bg-secondary text-bg-dark font-display font-extrabold text-4xl px-12 py-5 rounded-full border-4 border-bg-dark shadow-[6px_6px_0px_#1E293B] z-30 transform rotate-2"
        initial={{ y: '100vh', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100vh', opacity: 0 }}
        transition={{ ...springBouncy, delay: 1.5 }}
      >
        HEMEN ÇEK! 💸
      </motion.div>
    </motion.div>
  );
};

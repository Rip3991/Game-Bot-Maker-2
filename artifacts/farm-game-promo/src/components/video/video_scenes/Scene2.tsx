import { motion } from 'framer-motion';
import { springBouncy, CustomTransitions, TextReveal } from '../utils';

export const Scene2 = () => {
  return (
    <motion.div
      className="absolute inset-0 w-full h-full flex flex-col items-center justify-center z-10"
      {...CustomTransitions.clipReveal}
    >
      <div className="absolute right-[8vw] top-[30vh] max-w-[50vw] text-right">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ ...springBouncy, delay: 0.2 }}
          className="bg-accent text-white font-display font-bold text-4xl px-8 py-4 rounded-full mb-6 inline-block transform rotate-2 border-4 border-bg-dark shadow-[4px_4px_0px_#1E293B]"
        >
          OYNAMASI ÇOK KOLAY!
        </motion.div>

        <h1 className="text-[4.5rem] font-display font-extrabold text-white text-stroke text-shadow-game leading-[1.2] flex flex-col items-end">
          <TextReveal text="Çiftliğini Kur," delay={0.4} />
          <TextReveal text="Hayvanları Büyüt," delay={0.6} />
          <TextReveal text="Otomatik Kazan!" delay={0.8} className="text-secondary" />
        </h1>
      </div>

      <motion.img
        src={`${import.meta.env.BASE_URL}images/farm-game-home.jpg`}
        className="absolute left-[10vw] top-[15vh] h-[70vh] rounded-[3rem] border-8 border-bg-dark shadow-[15px_15px_0px_rgba(0,0,0,0.3)] object-cover"
        initial={{ y: '50vh', rotate: -20, scale: 0.5, opacity: 0 }}
        animate={{ y: 0, rotate: -5, scale: 1, opacity: 1 }}
        exit={{ y: '50vh', opacity: 0, transition: { duration: 0.6 } }}
        transition={{ ...springBouncy, delay: 0.5 }}
      />
      
      {/* Floating farm elements (abstracted as shapes) */}
      <motion.div
        className="absolute left-[35vw] bottom-[15vh] bg-primary text-bg-dark font-display font-bold text-2xl px-6 py-3 rounded-full border-4 border-bg-dark shadow-[4px_4px_0px_#1E293B]"
        initial={{ scale: 0, rotate: 0 }}
        animate={{ scale: 1, rotate: 15 }}
        exit={{ scale: 0 }}
        transition={{ ...springBouncy, delay: 1 }}
      >
        🌾 Buğday
      </motion.div>
      
      <motion.div
        className="absolute left-[5vw] top-[25vh] bg-white text-bg-dark font-display font-bold text-2xl px-6 py-3 rounded-full border-4 border-bg-dark shadow-[4px_4px_0px_#1E293B]"
        initial={{ scale: 0, rotate: 0 }}
        animate={{ scale: 1, rotate: -10 }}
        exit={{ scale: 0 }}
        transition={{ ...springBouncy, delay: 1.2 }}
      >
        🐔 Tavuk
      </motion.div>
    </motion.div>
  );
};

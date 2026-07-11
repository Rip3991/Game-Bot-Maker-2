import { motion } from 'framer-motion';
import { springBouncy, CustomTransitions, TextReveal } from '../utils';

export const Scene4 = () => {
  return (
    <motion.div
      className="absolute inset-0 w-full h-full flex flex-col items-center justify-center z-10"
      {...CustomTransitions.clipReveal}
    >
      <motion.img
        src={`${import.meta.env.BASE_URL}images/mascot-avatar.png`}
        className="absolute left-[15vw] top-[20vh] h-[60vh] object-contain border-8 border-bg-dark rounded-full shadow-[10px_10px_0px_#1E293B] bg-white"
        initial={{ x: '-50vw', rotate: -180 }}
        animate={{ x: 0, rotate: -10 }}
        exit={{ x: '-50vw', opacity: 0 }}
        transition={{ ...springBouncy, delay: 0.3 }}
      />

      <div className="absolute right-[15vw] top-[30vh] max-w-[45vw]">
        <h1 className="text-[5.5rem] font-display font-extrabold text-white text-stroke text-shadow-game leading-[1.1] flex flex-col">
          <TextReveal text="SARI SENİ" delay={0.6} />
          <TextReveal text="BEKLİYOR!" delay={0.8} className="text-primary" />
        </h1>
        
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          transition={{ ...springBouncy, delay: 1.2 }}
          className="mt-10 bg-[#2AABEE] text-white font-display font-extrabold text-4xl px-10 py-6 rounded-3xl border-4 border-bg-dark shadow-[8px_8px_0px_#1E293B] inline-flex items-center gap-4"
        >
          <svg viewBox="0 0 24 24" className="w-12 h-12 fill-current">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.19-.08-.05-.19-.02-.27 0-.12.02-1.96 1.25-5.54 3.69-.52.36-1 .53-1.42.52-.47-.01-1.37-.26-2.03-.48-.82-.27-1.47-.42-1.42-.88.03-.24.29-.48.79-.74 3.08-1.34 5.15-2.23 6.19-2.66 2.95-1.23 3.56-1.45 3.97-1.46.09 0 .28.02.41.1.11.08.15.19.16.29.01.07.01.16 0 .22z"/>
          </svg>
          TELEGRAM'DA OYNA
        </motion.div>
      </div>
    </motion.div>
  );
};

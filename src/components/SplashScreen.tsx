import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(onComplete, 500);
          return 100;
        }
        return prev + 1;
      });
    }, 30); // ~3 seconds total

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0A0A0B] overflow-hidden"
    >
      {/* Background Glow */}
      <div className="absolute inset-0 bg-radial-gradient from-[#00D4FF10] via-transparent to-transparent" />
      
      {/* Particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ y: '110vh', x: Math.random() * 100 + 'vw', opacity: 0 }}
          animate={{
            y: '-10vh',
            opacity: [0, 0.5, 0],
          }}
          transition={{
            duration: Math.random() * 5 + 5,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: "linear"
          }}
          className="absolute w-1 h-1 bg-[#00D4FF] rounded-full blur-[1px]"
        />
      ))}

      <div className="relative z-10 flex flex-col items-center">
        {/* Animated Orb */}
        <div className="relative w-24 h-24 mb-8">
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute inset-0 rounded-full bg-[#00D4FF]/20 blur-xl"
          />
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#00D4FF]/40 animate-orbit" />
          <div className="absolute inset-2 rounded-full bg-gradient-to-tr from-[#00D4FF] to-[#0055FF] flex items-center justify-center overflow-hidden shadow-[0_0_30px_rgba(0,212,255,0.4)]">
            <div className="w-full h-full bg-black/20" />
          </div>
        </div>

        <motion.h1 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-4xl font-light tracking-[0.3em] text-white mb-2"
        >
          HIMALYX
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-zinc-500 text-sm tracking-widest"
        >
          AI-POWERED EXCELLENCE
        </motion.p>
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-16 left-12 right-12">
        <div className="h-[2px] w-full bg-white/5 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-[#00D4FF] shadow-[0_0_10px_#00D4FF]"
          />
        </div>
      </div>
    </motion.div>
  );
};

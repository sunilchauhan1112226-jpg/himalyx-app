import React from 'react';
import { motion } from 'motion/react';
import { LogIn, Sparkles } from 'lucide-react';
import { auth, googleProvider } from '../lib/firebase';
import { signInWithPopup } from 'firebase/auth';

interface LoginProps {
  onLogin?: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      onLogin?.();
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0A0A0B] p-6 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10% ] left-[-10%] w-96 h-96 bg-[#00D4FF] opacity-10 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-[#0055FF] opacity-5 rounded-full blur-[100px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 flex flex-col items-center text-center max-w-md"
      >
        <div className="w-20 h-20 bg-gradient-to-tr from-[#00D4FF] to-[#0055FF] rounded-full flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(0,212,255,0.3)]">
          <Sparkles size={40} className="text-white drop-shadow-[0_0_10px_white]" />
        </div>

        <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase mb-2">HIMALYX AI</h1>
        <p className="text-[#00D4FF] font-bold text-[10px] tracking-[0.5em] mb-8 uppercase animate-pulse">Neural Synchronization Required</p>
        
        <p className="text-zinc-500 text-sm mb-12 leading-relaxed">
          Access the super-intelligent core of your agency operations. Sunil, please authorize your neural link to continue.
        </p>

        <button
          onClick={handleLogin}
          className="group relative flex items-center gap-3 px-8 py-4 bg-white text-black font-black uppercase text-xs tracking-widest rounded-2xl overflow-hidden hover:scale-105 transition-all duration-300 active:scale-95"
        >
          <div className="absolute inset-0 bg-[#00D4FF] translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300" />
          <LogIn size={18} className="relative z-10 group-hover:text-white transition-colors" />
          <span className="relative z-10 group-hover:text-white transition-colors">Authorize with Google</span>
        </button>
        
        <p className="mt-8 text-[9px] text-zinc-700 font-bold uppercase tracking-widest">Secure Premium Access • Authenticated Core</p>
      </motion.div>
    </div>
  );
};

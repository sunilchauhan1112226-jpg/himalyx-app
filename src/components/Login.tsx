import React, { useState } from 'react';
import { motion } from 'motion/react';
import { LogIn, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { auth, googleProvider } from '../lib/firebase';
import { signInWithPopup } from 'firebase/auth';

interface LoginProps {
  onLogin?: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
      onLogin?.();
    } catch (err: any) {
      console.error("Login failed:", err);
      // Handle the case where the popup was blocked by the browser
      if (err.code === 'auth/popup-blocked') {
        setError("Neural Link Blocked: Please enable popups or open the app in a new window/tab.");
      } else if (err.code === 'auth/cancelled-popup-request' || err.code === 'auth/popup-closed-by-user') {
        setError("Synchronization Cancelled. Ready for re-auth.");
      } else {
        setError("Neural synchronization failed. Please check your connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0A0A0B] p-6 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[#00D4FF] opacity-10 rounded-full blur-[100px]" />
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
        <motion.p 
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-[#00D4FF] font-bold text-[10px] tracking-[0.5em] mb-8 uppercase"
        >
          Neural Synchronization Required
        </motion.p>
        
        <p className="text-zinc-500 text-sm mb-12 leading-relaxed">
          Access the super-intelligent core of your agency operations. Sunil, please authorize your neural link to continue.
        </p>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-xs text-left"
          >
            <AlertCircle size={16} className="shrink-0" />
            <p>{error}</p>
          </motion.div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          className="group relative flex items-center gap-3 px-8 py-4 bg-white text-black font-black uppercase text-xs tracking-widest rounded-2xl overflow-hidden hover:scale-105 transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:scale-100"
        >
          <div className="absolute inset-0 bg-[#00D4FF] translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300" />
          {loading ? (
            <Loader2 size={18} className="relative z-10 animate-spin text-[#00D4FF]" />
          ) : (
            <LogIn size={18} className="relative z-10 group-hover:text-white transition-colors" />
          )}
          <span className="relative z-10 group-hover:text-white transition-colors">
            {loading ? "Synchronizing..." : "Authorize with Google"}
          </span>
        </button>
        
        <p className="mt-8 text-[9px] text-zinc-700 font-bold uppercase tracking-widest">Secure Premium Access • Authenticated Core</p>
      </motion.div>
    </div>
  );
};

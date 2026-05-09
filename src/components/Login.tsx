import React, { useState } from 'react';
import { motion } from 'motion/react';
import { LogIn, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { auth, googleProvider } from '../lib/firebase';
import { signInWithPopup, signInWithRedirect, getRedirectResult } from 'firebase/auth';

interface LoginProps {
  onLogin?: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for redirect results on mount
  React.useEffect(() => {
    const checkRedirect = async () => {
      setLoading(true);
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          onLogin?.();
        }
      } catch (err: any) {
        console.error("Neural Redirect Sync Failure:", err);
        if (err.code === 'auth/unauthorized-domain') {
          setError("Authorized Domain Required: Please add the Vercel URL to your Firebase Console settings.");
        } else {
          setError(`Sync Link Broken: ${err.message || "Please refresh and try again."}`);
        }
      } finally {
        setLoading(false);
      }
    };
    checkRedirect();
  }, [onLogin]);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    
    // Check if we are in a mobile/embedded environment
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    try {
      if (isMobile) {
        // Redirect is much more stable for mobile wrappers like Median.co
        await signInWithRedirect(auth, googleProvider);
      } else {
        await signInWithPopup(auth, googleProvider);
        onLogin?.();
      }
    } catch (err: any) {
      console.error("Neural Sync Failure:", err);
      // Handle details for debugging
      if (err.code === 'auth/popup-blocked') {
        setError("Neural Link Blocked: The browser prevented the identification window. Please enable popups for this site.");
      } else if (err.code === 'auth/cancelled-popup-request' || err.code === 'auth/popup-closed-by-user') {
        setError("Synchronization Interrupted: The login window was closed before completion.");
      } else if (err.code === 'auth/unauthorized-domain') {
        setError("Unauthorized Domain: Please add this URL to your Firebase Authorized Domains in settings.");
      } else {
        setError(`Neural Sync Error: ${err.message || "Connection lost during synchronization."}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0A0A0B] p-6 relative overflow-hidden">
      {/* Reduced background complexity for performance */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-[#00D4FF]/5 to-transparent pointer-events-none" />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 flex flex-col items-center text-center max-w-md w-full"
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

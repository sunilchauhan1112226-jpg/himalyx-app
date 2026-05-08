/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SplashScreen } from './components/SplashScreen';
import { Login } from './components/Login';
import { Dashboard } from './components/screens/Dashboard';
import { Projects } from './components/screens/Projects';
import { Vault } from './components/screens/Vault';
import { Tasks } from './components/screens/Tasks';
import { AIAssistant } from './components/screens/AIAssistant';
import { Analytics } from './components/screens/Analytics';
import { BottomNav } from './components/BottomNav';
import { BarChart3 } from 'lucide-react';
import { auth } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  const renderScreen = () => {
    switch (activeTab) {
      case 'home': return <Dashboard />;
      case 'projects': return <Projects />;
      case 'vault': return <Vault />;
      case 'tasks': return <Tasks />;
      case 'ai': return <AIAssistant />;
      case 'analytics': return <Analytics />;
      default: return <Dashboard />;
    }
  };

  if (authLoading) return <div className="min-h-screen bg-[#0A0A0B]" />;

  if (!user && !showSplash) {
    return <Login onLogin={() => {}} />;
  }

  return (
    <div className="min-h-[100dvh] bg-[#0A0A0B] flex flex-col selection:bg-[#00D4FF]/30 selection:text-[#00D4FF] relative overflow-x-hidden">
      {/* Background Ambience merged into main layout */}
      <div className="fixed top-[-100px] left-[-100px] w-[400px] h-[400px] bg-[#00D4FF] opacity-10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-50px] right-[-50px] w-[300px] h-[300px] bg-[#00D4FF] opacity-5 rounded-full blur-[100px] pointer-events-none z-0" />
      <div className="fixed inset-0 opacity-[0.1] bg-dot-pattern pointer-events-none z-0" />

      {/* Brand Text Accent in background (only on large screens) */}
      <div className="fixed right-[5%] top-[15%] text-right opacity-5 pointer-events-none hidden lg:block z-0">
        <h3 className="text-9xl font-black italic text-white uppercase tracking-tighter">Himalyx</h3>
        <p className="text-xl font-light tracking-[1em] text-white">AUTHENTIC PREMIUM AI</p>
      </div>

      <AnimatePresence mode="wait">
        {showSplash ? (
          <SplashScreen key="splash" onComplete={() => setShowSplash(false)} />
        ) : (
          <motion.main
            key="main-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="flex-1 flex flex-col relative z-10"
          >
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-visible">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  transition={{ 
                    duration: 0.4,
                    ease: [0.25, 0.46, 0.45, 0.94]
                  }}
                >
                  {renderScreen()}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Analytics Shortcut Button (Floating) */}
            <button 
              onClick={() => setActiveTab('analytics')}
              className="fixed top-24 right-6 w-10 h-10 glass-card flex items-center justify-center text-zinc-500 hover:text-[#00D4FF] z-40 border-white/5"
            >
              <BarChart3 size={18} />
            </button>

            <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
            
            {/* Safe Area bottom spacing for scrolling */}
            <div className="h-32 w-full flex-shrink-0" />
          </motion.main>
        )}
      </AnimatePresence>
    </div>
  );
}

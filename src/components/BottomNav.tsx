import React from 'react';
import { motion } from 'motion/react';
import { Home, Folder, Shield, CheckSquare, MessageCircle } from 'lucide-react';
import { cn } from '../lib/utils';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const navItems = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'projects', icon: Folder, label: 'Projects' },
  { id: 'ai', icon: null, label: 'AI' }, // Special center button
  { id: 'tasks', icon: CheckSquare, label: 'Tasks' },
  { id: 'vault', icon: Shield, label: 'Vault' },
];

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-[380px] z-50">
      <div className="h-[64px] bg-[#1A1A1D]/95 backdrop-blur-md border border-white/5 rounded-full flex items-center justify-between px-6 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] relative">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          if (item.id === 'ai') {
            return (
              <motion.button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                whileTap={{ scale: 0.9 }}
                className={cn(
                  "relative -translate-y-4 w-14 h-14 rounded-full bg-gradient-to-br from-[#00D4FF] to-cyan-600 flex items-center justify-center shadow-[0_0_20px_rgba(0,212,255,0.4)] border-4 border-[#0A0A0B] transition-transform",
                  activeTab === 'ai' && "scale-110"
                )}
              >
                <MessageCircle size={24} className="text-white" />
              </motion.button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className="flex flex-col items-center justify-center flex-1 transition-all duration-300"
            >
              <div className="relative flex flex-col items-center gap-1">
                {Icon && (
                  <Icon
                    size={20}
                    strokeWidth={isActive ? 2.5 : 2}
                    className={cn(
                      "transition-all duration-300",
                      isActive ? "text-[#00D4FF] opacity-100" : "text-[#6B7280] opacity-50"
                    )}
                  />
                )}
                {isActive && (
                  <motion.div
                    layoutId="nav-dot"
                    className="w-1 h-1 rounded-full bg-[#00D4FF]"
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

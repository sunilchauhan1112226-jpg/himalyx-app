import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, Sparkles, Zap, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { db } from '../../lib/firebase';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { askHimalyxStream } from '../../services/geminiService';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export const AIAssistant: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: "HIMALYX AI initialized. I have synchronized with your Projects, Vault, and Ecosystem. How can I assist your agency today?", timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  // App Context - Using ref for "background" fetching to optimize AI response time and UI stability
  const contextRef = React.useRef<any>({
    projects: [],
    tasks: [],
    linkedApps: [],
    vaultItems: []
  });

  useEffect(() => {
    const unsubProjects = onSnapshot(collection(db, 'projects'), (snap) => {
      contextRef.current.projects = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    });
    const unsubTasks = onSnapshot(collection(db, 'tasks'), (snap) => {
      contextRef.current.tasks = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    });
    const unsubApps = onSnapshot(collection(db, 'linkedApps'), (snap) => {
      contextRef.current.linkedApps = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    });
    const unsubVault = onSnapshot(collection(db, 'vaultItems'), (snap) => {
      contextRef.current.vaultItems = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    });

    return () => {
      unsubProjects();
      unsubTasks();
      unsubApps();
      unsubVault();
    };
  }, []);

  const sendMessage = async () => {
    if (!inputValue.trim() || isTyping) return;
    
    console.log("HIMALYX sending message:", inputValue);
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newUserMsg: Message = { id: Date.now().toString(), role: 'user', content: inputValue, timestamp: time };
    
    setMessages(prev => [...prev, newUserMsg]);
    const currentQuery = inputValue;
    setInputValue('');
    setIsTyping(true);

    const aiMessageId = (Date.now() + 1).toString();
    const aiMsgPlaceholder: Message = { 
      id: aiMessageId, 
      role: 'assistant', 
      content: '...', 
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    };
    setMessages(prev => [...prev, aiMsgPlaceholder]);

    try {
      await askHimalyxStream(currentQuery, contextRef.current, (text) => {
        setMessages(prev => prev.map(m => m.id === aiMessageId ? { ...m, content: text } : m));
      });
    } catch (err) {
      console.error("AI Error:", err);
      const errorMsg: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: "I've encountered a neural drift. Please re-synchronize.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert("Speech recognition not supported in this browser.");
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      console.log("Speech result:", transcript);
      setInputValue(transcript);
      setIsListening(false);
      // Auto-send after a small delay to let UI update
      setTimeout(() => {
        if (transcript.trim()) {
           sendMessage();
        }
      }, 500);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  return (
    <div className="flex flex-col h-screen pb-40">
      {/* Header */}
      <header className="pt-6 px-6 mb-8 text-center">
        <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">HIMALYX AI</h2>
        <div className="flex items-center justify-center gap-2 mt-1">
          <div className="w-1.5 h-1.5 rounded-full bg-[#00D4FF] animate-pulse glow-cyan" />
          <span className="text-[10px] font-bold text-[#00D4FF] uppercase tracking-[0.3em]">Neural Link Online</span>
        </div>
      </header>

      {/* Main Orb Area */}
      <div className="flex flex-col items-center justify-center mb-8">
        <div className="relative w-32 h-32 flex items-center justify-center">
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: 360,
              borderRadius: ["50% 50% 50% 50%", "40% 60% 60% 40%", "50% 50% 50% 50%"]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 bg-gradient-to-tr from-[#00D4FF] via-[#0055FF] to-[#00D4FF] opacity-30 blur-2xl"
          />
          <div className="relative w-28 h-28 rounded-full border border-dashed border-[#00D4FF]/30 animate-spin-slow" />
          <div className="absolute inset-2 bg-gradient-to-tr from-[#00D4FF] to-[#0055FF] rounded-full flex items-center justify-center shadow-[0_0_60px_rgba(0,212,255,0.5)] overflow-hidden group">
             <div className="w-full h-full bg-white/10 backdrop-blur-3xl animate-pulse-glow" />
             <Sparkles size={40} className="absolute text-white drop-shadow-[0_0_15px_white] animate-bounce" />
          </div>
        </div>
        <p className="mt-6 text-zinc-600 text-[9px] font-bold uppercase tracking-[0.4em] animate-pulse">Synchronizing Data Streams</p>
      </div>


      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-6 space-y-6 no-scrollbar pb-10 max-w-5xl mx-auto w-full">
        {messages.map((msg) => (
          <div key={msg.id} className={cn("flex flex-col", msg.role === 'user' ? "items-end" : "items-start")}>
            <div className={cn(
               "max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed",
               msg.role === 'user' 
                ? "bg-[#00D4FF] text-black font-medium rounded-tr-none shadow-[0_8px_20px_rgba(0,212,255,0.2)]" 
                : "glass-card text-zinc-300 rounded-tl-none border-[#00D4FF]/10"
            )}>
              {msg.content}
            </div>
            <span className="text-[9px] text-zinc-600 font-bold mt-2 uppercase tracking-tighter px-1">
              {msg.timestamp}
            </span>
          </div>
        ))}
        {isTyping && (
          <div className="flex gap-1.5 p-4 glass-card w-fit rounded-2xl rounded-tl-none">
            <div className="w-1.5 h-1.5 rounded-full bg-[#00D4FF] animate-bounce" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#00D4FF] animate-bounce [animation-delay:0.2s]" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#00D4FF] animate-bounce [animation-delay:0.4s]" />
          </div>
        )}
      </div>

      {/* Input Bar */}
      <div className="fixed bottom-32 left-0 right-0 z-50 flex justify-center px-6">
        <div className="glass-card h-16 bg-white/[0.05] p-2 flex items-center gap-2 border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] w-full max-w-2xl">
          <button 
            type="button"
            onClick={startListening}
            className={cn(
              "h-12 w-12 flex items-center justify-center rounded-xl transition-all",
              isListening ? "bg-red-500/20 text-red-500 animate-pulse" : "bg-white/5 text-zinc-400 hover:text-[#00D4FF]"
            )}
          >
            <Mic size={20} className={cn(isListening && "scale-110")} />
          </button>
          <input 
            type="text" 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder={isListening ? "Listening..." : "Ask HIMALYX AI anything..."}
            className="flex-1 bg-transparent border-none outline-none text-white text-sm font-medium px-2"
          />
          <button 
            type="button"
            onClick={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            disabled={!inputValue.trim() || isTyping}
            className={cn(
              "h-12 w-12 flex items-center justify-center rounded-xl bg-[#00D4FF] text-black shadow-[0_0_15px_rgba(0,212,255,0.4)] transition-all",
              (!inputValue.trim() || isTyping) && "opacity-50 grayscale cursor-not-allowed"
            )}
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};


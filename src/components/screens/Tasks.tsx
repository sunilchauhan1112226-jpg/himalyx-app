import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, RotateCcw, CheckCircle2, Circle, Sparkles, Mic, Send, Calendar, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { db } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';

export const Tasks: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState('Today');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  useEffect(() => {
    const q = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setTasks(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsub;
  }, []);

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;
    try {
      await addDoc(collection(db, 'tasks'), {
        title: newTaskTitle,
        priority: 'normal',
        completed: false,
        createdAt: serverTimestamp(),
        projectName: 'General'
      });
      setNewTaskTitle('');
    } catch (e) {
      console.error(e);
    }
  };

  const toggleTask = async (id: string, completed: boolean) => {
    try {
      await updateDoc(doc(db, 'tasks', id), { completed: !completed });
    } catch (e) {
      console.error(e);
    }
  };

  const deleteTask = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'tasks', id));
    } catch (e) {
      console.error(e);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = (timeLeft / (25 * 60)) * 100;

  return (
    <div className="flex flex-col gap-6 pb-48 pt-6 px-6">
      <header>
        <div className="flex justify-between items-end mb-4">
          <div>
            <h2 className="text-3xl font-bold text-white">Tasks</h2>
            <p className="text-zinc-500 text-sm">Focus on what matters</p>
          </div>
        </div>
        
        {/* Filter Selection */}
        <div className="glass-card p-1 flex">
          {['Today', 'This Week', 'All'].map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={cn(
                "flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-300",
                activeFilter === f ? "bg-white/10 text-white" : "text-zinc-500"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </header>

      {/* Focus Timer Widget */}
      <div className="glass-card p-6 relative overflow-hidden group">
        <div className="relative z-10 flex flex-col items-center">
           <span className="text-[10px] font-bold text-[#00D4FF] uppercase tracking-[0.2em] mb-2">Focus Mode</span>
           
           <div className="relative w-40 h-40 flex items-center justify-center mb-6">
              <svg className="w-full h-full -rotate-90">
                <circle cx="80" cy="80" r="74" fill="none" stroke="white" strokeWidth="2" className="opacity-5" />
                <motion.circle
                  cx="80"
                  cy="80"
                  r="74"
                  fill="none"
                  stroke="#00D4FF"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={465}
                  animate={{ strokeDashoffset: 465 * (1 - progress/100) }}
                  className="drop-shadow-[0_0_8px_#00D4FF]"
                />
              </svg>
              <div className="absolute text-4xl font-bold text-white tracking-widest tabular-nums">
                {formatTime(timeLeft)}
              </div>
           </div>

           <div className="flex gap-4">
              <button 
                onClick={() => setIsActive(!isActive)}
                className="w-12 h-12 rounded-full glass-card flex items-center justify-center text-white hover:bg-white/10 transition-colors"
              >
                {isActive ? <Pause size={20} /> : <Play size={20} className="ml-1" />}
              </button>
              <button 
                onClick={() => { setTimeLeft(25 * 60); setIsActive(false); }}
                className="w-12 h-12 rounded-full glass-card flex items-center justify-center text-zinc-500 hover:text-white transition-colors"
              >
                <RotateCcw size={20} />
              </button>
           </div>
        </div>
        
        {/* Subtle background glow */}
        <div className={cn(
          "absolute inset-0 bg-[#00D4FF] transition-opacity duration-1000 -z-0 blur-[100px]",
          isActive ? "opacity-10" : "opacity-0"
        )} />
      </div>

      {/* Task List */}
      <div className="flex flex-col gap-4">
        <h3 className="text-xs font-bold text-zinc-600 uppercase tracking-widest">Priority Queue</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.length > 0 ? (
            tasks.map(task => (
              <TaskItem 
                key={task.id} 
                id={task.id}
                title={task.title} 
                project={task.projectName || 'General'} 
                priority={task.priority} 
                completed={task.completed}
                onToggle={() => toggleTask(task.id, task.completed)}
                onDelete={() => deleteTask(task.id)}
              />
            ))
          ) : (
            <div className="col-span-full p-8 glass-card border-dashed text-center text-zinc-600 text-sm">
              Zero pending tasks. Good job.
            </div>
          )}
        </div>
      </div>

      {/* AI Suggestions */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={14} className="text-[#00D4FF]" />
          <h3 className="text-xs font-bold text-zinc-600 uppercase tracking-widest">AI Suggestions</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <SuggestionChip label="Schedule client call" />
          <SuggestionChip label="Review pending invoices" />
          <SuggestionChip label="Optimize asset pipeline" />
        </div>
      </div>

      {/* Floating Task Input */}
      <div className="fixed bottom-32 left-6 right-6 z-40">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleAddTask(); }}
          className="glass-card h-14 bg-white/[0.03] backdrop-blur-2xl px-4 flex items-center gap-3 border-[#00D4FF]/20 shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
        >
           <div className="w-5 h-5 rounded-full border-2 border-zinc-700" />
           <input 
             type="text" 
             value={newTaskTitle}
             onChange={(e) => setNewTaskTitle(e.target.value)}
             placeholder="Add quick task..."
             className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-white placeholder-zinc-600"
           />
           <button type="button" className="text-zinc-500 p-1 hover:text-[#00D4FF] transition-colors"><Mic size={18} /></button>
           <button type="submit" className="bg-[#00D4FF] text-black p-1.5 rounded-lg shadow-[0_0_10px_#00D4FF50]"><Send size={16} /></button>
        </form>
      </div>
    </div>
  );
};

const TaskItem = ({ title, project, priority, completed, onToggle, onDelete }: any) => {
  const priorityColor = {
    urgent: 'bg-red-500',
    high: 'bg-amber-500',
    normal: 'bg-[#00D4FF]'
  }[priority as 'urgent' | 'high' | 'normal'] || 'bg-zinc-500';

  return (
    <div className={cn(
      "glass-card p-4 group cursor-pointer hover:border-[#00D4FF]/20 transition-all",
      completed && "opacity-40"
    )}>
      <div className="flex items-start gap-4">
        <button onClick={onToggle} className="mt-1">
          {completed ? (
            <CheckCircle2 className="text-[#00D4FF]" size={20} />
          ) : (
            <Circle className="text-zinc-700 group-hover:text-[#00D4FF] transition-colors" size={20} />
          )}
        </button>
        <div className="flex-1" onClick={onToggle}>
          <div className="flex justify-between items-start mb-1">
            <h4 className={cn(
              "text-sm font-semibold text-white group-hover:text-[#00D4FF] transition-colors",
              completed && "line-through"
            )}>{title}</h4>
            <div className={cn("px-2 py-0.5 rounded text-[8px] font-bold uppercase text-white shadow-sm", priorityColor)}>
              {priority}
            </div>
          </div>
          <p className="text-[11px] text-zinc-500 mb-2 font-medium">{project}</p>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="opacity-0 group-hover:opacity-100 p-2 text-zinc-700 hover:text-red-500 transition-all"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};

const SuggestionChip = ({ label }: { label: string }) => (
  <button className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-[11px] font-bold text-zinc-400 hover:bg-[#00D4FF]/10 hover:text-[#00D4FF] hover:border-[#00D4FF]/20 transition-all whitespace-nowrap">
    {label}
  </button>
);

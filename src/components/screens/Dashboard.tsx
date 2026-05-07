import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Activity, Zap, DollarSign, Plus, X, Globe, Link, Briefcase, ExternalLink, Clock, Trash2 } from 'lucide-react';
import { db, auth } from '../../lib/firebase';
import { collection, query, limit, onSnapshot, orderBy, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { getHimalyxDeepInsights } from '../../services/geminiService';
import { cn } from '../../lib/utils';

export const Dashboard: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [linkedApps, setLinkedApps] = useState<any[]>([]);
  const [vaultItems, setVaultItems] = useState<any[]>([]);
  const [userName, setUserName] = useState('Alex');
  const [user, setUser] = useState<any>(null);
  const [aiInsight, setAiInsight] = useState({ insight: "HIMALYX AI is initializing...", score: 0 });
  const [isLoadingAi, setIsLoadingAi] = useState(true);
  
  // Modals
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [isAddingActivity, setIsAddingActivity] = useState(false);
  
  const [newProject, setNewProject] = useState({ name: '', url: '', client: '', budget: '' });
  const [newActivity, setNewActivity] = useState({ title: '', description: '', type: 'human' });

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((u) => {
      setUser(u);
      if (u?.displayName) {
        setUserName(u.displayName.split(' ')[0]);
      } else {
        setUserName('Guest');
      }
    });

    // Projects listener
    const pQuery = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
    const unsubProjects = onSnapshot(pQuery, (snap) => {
      setProjects(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => console.error("Snapshot error (projects):", err));

    // Tasks listener
    const tQuery = query(collection(db, 'tasks'));
    const unsubTasks = onSnapshot(tQuery, (snap) => {
      setTasks(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => console.error("Snapshot error (tasks):", err));

    // Activities listener
    const actQuery = query(collection(db, 'activities'), orderBy('createdAt', 'desc'), limit(5));
    const unsubActivities = onSnapshot(actQuery, (snap) => {
      setActivities(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => console.error("Snapshot error (activities):", err));

    // Linked Apps listener
    const appsQuery = query(collection(db, 'linkedApps'));
    const unsubApps = onSnapshot(appsQuery, (snap) => {
      setLinkedApps(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => console.error("Snapshot error (apps):", err));

    // Vault Items listener
    const vaultQuery = query(collection(db, 'vaultItems'));
    const unsubVault = onSnapshot(vaultQuery, (snap) => {
      setVaultItems(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => console.error("Snapshot error (vault):", err));

    return () => {
      unsubAuth();
      unsubProjects();
      unsubTasks();
      unsubActivities();
      unsubApps();
      unsubVault();
    };
  }, []);

  const handleLogin = async () => {
    try {
      const { signInWithPopup, GoogleAuthProvider } = await import('firebase/auth');
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  // Update AI Insights when data changes
  useEffect(() => {
    const updateInsights = async () => {
      if (tasks.length > 0 || projects.length > 0) {
        setIsLoadingAi(true);
        const result = await getHimalyxDeepInsights(tasks, projects, linkedApps, vaultItems);
        setAiInsight(result);
        setIsLoadingAi(false);
      } else {
        setAiInsight({ insight: "Add ecosystem data to unlock HIMALYX AI momentum tracking.", score: 0 });
        setIsLoadingAi(false);
      }
    };
    updateInsights();
  }, [tasks.length, projects.length, linkedApps.length, vaultItems.length]);

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.name) return;
    try {
      await addDoc(collection(db, 'projects'), {
        ...newProject,
        budget: parseFloat(newProject.budget) || 0,
        progress: 0,
        status: 'planning',
        createdAt: serverTimestamp()
      });
      setIsAddingProject(false);
      setNewProject({ name: '', url: '', client: '', budget: '' });
    } catch (err) { console.error(err); }
  };

  const handleDeleteProject = async (id: string) => {
    console.log("Dashboard: Requesting deletion for project", id);
    if (!window.confirm("Delete project? This action cannot be undone.")) return;
    try {
      await deleteDoc(doc(db, 'projects', id));
      console.log("Dashboard: Project deleted successfully", id);
    } catch (err: any) { 
      console.error("Dashboard: Database deletion failed:", err); 
      alert("Neural failure: Could not delete project. " + err.message);
    }
  };

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActivity.title) return;
    try {
      await addDoc(collection(db, 'activities'), {
        ...newActivity,
        createdAt: serverTimestamp()
      });
      setIsAddingActivity(false);
      setNewActivity({ title: '', description: '', type: 'human' });
    } catch (err) { console.error(err); }
  };

  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="flex flex-col gap-6 pb-32 pt-6 overflow-x-hidden">
      {/* Header */}
      <header className="flex justify-between items-center px-6">
        <div>
          <h2 className="text-2xl font-semibold text-white">Good Morning, {userName}</h2>
          <p className="text-zinc-500 text-sm">{today}</p>
        </div>
        <div className="relative">
          {user ? (
            <div className="w-10 h-10 rounded-full border border-[#00D4FF]/30 p-0.5 glow-cyan overflow-hidden bg-white/5">
               <img 
                 src={user.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop"} 
                 className="w-full h-full rounded-full object-cover"
                 alt="Profile"
               />
            </div>
          ) : (
            <button 
              onClick={handleLogin}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold text-[#00D4FF] uppercase tracking-widest hover:bg-[#00D4FF10] transition-all"
            >
              Neural Link
            </button>
          )}
        </div>
      </header>

      {/* Stats horizontal scroll */}
      <div className="flex overflow-x-auto no-scrollbar gap-4 px-6 snap-x">
        <div className="min-w-[120px] p-3 glass-card bg-white/[0.02] border-white/5 rounded-2xl flex-1">
          <p className="text-[9px] text-[#6B7280] uppercase tracking-tight font-bold mb-1">Projects</p>
          <p className="text-xl font-bold text-white">{projects.length < 10 ? `0${projects.length}` : projects.length}</p>
        </div>
        <div className="min-w-[120px] p-3 glass-card bg-white/[0.02] border-white/5 rounded-2xl flex-1">
          <p className="text-[9px] text-[#6B7280] uppercase tracking-tight font-bold mb-1">Tasks</p>
          <p className="text-xl font-bold text-[#00D4FF]">{tasks.length < 10 ? `0${tasks.length}` : tasks.length}</p>
        </div>
      </div>

      {/* Productivity Ring */}
      <div className="flex flex-col items-center justify-center p-6 bg-radial-gradient from-[#00D4FF05] to-transparent">
        <div className="relative w-48 h-48 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90">
            <circle
              cx="96"
              cy="96"
              r="76"
              fill="none"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="12"
            />
            <motion.circle
              cx="96"
              cy="96"
              r="76"
              fill="none"
              stroke="#00D4FF"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={477}
              initial={{ strokeDashoffset: 477 }}
              animate={{ strokeDashoffset: 477 * (1 - (aiInsight.score / 100)) }}
              transition={{ duration: 2, ease: "easeOut" }}
              className="drop-shadow-[0_0_10px_#00D4FF]"
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-5xl font-bold text-white tracking-tighter"
            >
              {aiInsight.score}%
            </motion.span>
            <span className="text-[9px] text-[#A1A1AA] uppercase tracking-[0.2em] font-bold">Real Efficiency</span>
          </div>
        </div>
      </div>

      {/* AI Insight Card */}
      <div className="px-6">
        <div className="glass-card p-5 border-l-2 border-l-[#00D4FF] relative overflow-hidden group min-h-[140px] flex flex-col justify-center">
          <div className="absolute top-0 right-0 p-3 opacity-20 transition-opacity group-hover:opacity-100">
            <Sparkles size={40} className="text-[#00D4FF]" />
          </div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-[#00D4FF]/10">
              <Sparkles size={18} className={cn("text-[#00D4FF]", isLoadingAi && "animate-pulse")} />
            </div>
            <h3 className="font-semibold text-white uppercase tracking-tighter">HIMALYX AI Deep Audit</h3>
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed italic">
            {isLoadingAi ? "HIMALYX AI is processing neural pathways..." : `"${aiInsight.insight}"`}
          </p>
        </div>
      </div>

      {/* Active Projects */}
      <div className="px-6">
        <div className="flex justify-between items-end mb-4">
          <h3 className="text-lg font-semibold text-white">Active Projects</h3>
          <button 
            onClick={() => setIsAddingProject(true)}
            className="text-xs h-8 px-3 rounded-full bg-white/5 text-zinc-400 flex items-center gap-2 hover:bg-[#00D4FF10] hover:text-[#00D4FF] transition-all"
          >
            <Plus size={14} /> Manual Add
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.length > 0 ? (
            projects.map(p => (
              <ProjectCard 
                key={p.id} 
                id={p.id}
                name={p.name} 
                client={p.client} 
                progress={p.progress} 
                due={p.due || "TBD"}
                url={p.url}
                onDelete={() => handleDeleteProject(p.id)}
              />
            ))
          ) : (
            <div className="col-span-full p-8 glass-card border-dashed text-center text-zinc-600 text-sm">
              No active projects found.
            </div>
          )}
        </div>
      </div>

      {/* Live Activity Feed */}
      <div className="px-6 pb-12">
        <div className="flex justify-between items-end mb-4">
          <h3 className="text-lg font-semibold text-white">Live Activity</h3>
          <button 
            onClick={() => setIsAddingActivity(true)}
            className="text-xs h-8 px-3 rounded-full bg-white/5 text-zinc-400 flex items-center gap-2 hover:bg-[#10B98110] hover:text-[#10B981] transition-all"
          >
            <Plus size={14} /> Log Event
          </button>
        </div>
        <div className="flex flex-col gap-6">
          {activities.length > 0 ? (
            activities.map(act => (
              <ActivityItem 
                key={act.id} 
                status={act.type === 'human' ? 'success' : 'primary'} 
                title={act.title}
                text={act.description} 
                time={act.createdAt?.toDate() ? new Date(act.createdAt.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'} 
              />
            ))
          ) : (
            <div className="py-8 glass-card border-dashed text-center text-zinc-700 text-xs">
              No recent logs. Start manually tracking activities.
            </div>
          )}
        </div>
      </div>

      {/* Manual Modals */}
      <AnimatePresence>
        {isAddingProject && (
          <Modal title="New Project" onClose={() => setIsAddingProject(false)}>
            <form onSubmit={handleAddProject} className="space-y-4">
              <Input label="Project Name" placeholder="Himalyx MVP" value={newProject.name} onChange={v => setNewProject({...newProject, name: v})} icon={Briefcase} />
              <Input label="Website URL" placeholder="https://..." value={newProject.url} onChange={v => setNewProject({...newProject, url: v})} icon={Globe} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Client Name" placeholder="Client Co." value={newProject.client} onChange={v => setNewProject({...newProject, client: v})} icon={Briefcase} />
                <Input label="Budget (NRS)" placeholder="5000" value={newProject.budget} onChange={v => setNewProject({...newProject, budget: v})} icon={DollarSign} />
              </div>
              <button type="submit" className="w-full h-12 bg-[#00D4FF] text-black font-bold uppercase text-xs tracking-widest rounded-xl">Create Project</button>
            </form>
          </Modal>
        )}

        {isAddingActivity && (
          <Modal title="Log Activity" onClose={() => setIsAddingActivity(false)}>
            <form onSubmit={handleAddActivity} className="space-y-4">
              <Input label="Activity Title" placeholder="Database Migration" value={newActivity.title} onChange={v => setNewActivity({...newActivity, title: v})} icon={Activity} />
              <textarea 
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-zinc-700 text-sm outline-none focus:border-[#10B981]/30 transition-all min-h-[100px]"
                placeholder="Brief description..."
                value={newActivity.description}
                onChange={e => setNewActivity({...newActivity, description: e.target.value})}
              />
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setNewActivity({...newActivity, type: 'human'})} className={cn("h-10 rounded-lg text-[10px] font-bold uppercase tracking-widest border", newActivity.type === 'human' ? "bg-[#10B98120] border-[#10B98150] text-[#10B981]" : "border-white/5 text-zinc-500")}>Manual</button>
                <button type="button" onClick={() => setNewActivity({...newActivity, type: 'ai'})} className={cn("h-10 rounded-lg text-[10px] font-bold uppercase tracking-widest border", newActivity.type === 'ai' ? "bg-[#00D4FF20] border-[#00D4FF50] text-[#00D4FF]" : "border-white/5 text-zinc-500")}>Automated</button>
              </div>
              <button type="submit" className="w-full h-12 bg-[#10B981] text-black font-bold uppercase text-xs tracking-widest rounded-xl">Save Log</button>
            </form>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
};

const Modal = ({ title, children, onClose }: any) => (
  <motion.div 
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    className="fixed inset-0 z-[70] bg-[#0A0A0B]/90 backdrop-blur-xl flex items-end sm:items-center justify-center p-4"
    onClick={onClose}
  >
    <motion.div 
      initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
      className="w-full max-w-[400px] glass-card bg-[#111113] border-white/10 p-6 rounded-3xl"
      onClick={e => e.stopPropagation()}
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-white uppercase tracking-tighter">{title}</h3>
        <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white transition-colors"><X size={20}/></button>
      </div>
      {children}
    </motion.div>
  </motion.div>
);

const Input = ({ label, placeholder, value, onChange, icon: Icon }: any) => (
  <div>
    <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest ml-1 mb-2 block">{label}</label>
    <div className="relative">
      <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700" size={16} />
      <input 
        type="text" 
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-12 bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 text-white placeholder-zinc-800 outline-none focus:border-[#00D4FF]/30 transition-all text-sm font-medium"
      />
    </div>
  </div>
);

const ProjectCard = ({ name, client, progress, due, url, onDelete }: any) => (
  <div className="glass-card p-4 hover:scale-[1.01] transition-all duration-300 border-white/5 hover:border-[#00D4FF]/20 group relative overflow-hidden">
    <div className="flex justify-between items-start mb-4">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-0.5 justify-between pr-8">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-white tracking-tight group-hover:text-[#00D4FF] transition-colors">{name}</h4>
            {url && (
              <a href={url} target="_blank" rel="noopener noreferrer" className="text-zinc-600 hover:text-[#00D4FF]" onClick={e => e.stopPropagation()}>
                <ExternalLink size={12} />
              </a>
            )}
          </div>
        </div>
        <p className="text-[11px] text-zinc-500 font-medium">{client}</p>
      </div>
      <span className="text-xs font-bold text-[#00D4FF] tracking-tighter">{progress}%</span>

      {/* Delete Icon - High visibility and z-index */}
      <button 
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onDelete();
        }}
        className="absolute top-2 right-2 p-2.5 text-red-500 hover:bg-red-500/20 rounded-xl z-[60] bg-white/5 border border-white/10 shadow-lg transition-all active:scale-90"
        title="Delete Project"
      >
        <Trash2 size={16} />
      </button>
    </div>
    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        className="h-full bg-[#00D4FF] shadow-[0_0_8px_#00D4FF50]"
      />
    </div>
    <div className="mt-3 flex justify-between items-center text-[9px] text-zinc-600 uppercase tracking-[0.15em] font-bold">
      <div className="flex items-center gap-1">
        <Clock size={10} />
        <span>Due {due}</span>
      </div>
      <div className="flex items-center gap-1 text-[#00D4FF]/60">
        <div className="w-1 h-1 rounded-full bg-[#00D4FF] animate-pulse" />
        <span>Active Track</span>
      </div>
    </div>
  </div>
);

const ActivityItem = ({ status, title, text, time }: any) => (
  <div className="flex gap-4 group">
    <div className="relative flex flex-col items-center">
      <div className={cn(
        "w-2.5 h-2.5 rounded-full relative z-10 transition-transform group-hover:scale-125",
        status === 'success' ? 'bg-[#10B981]' : 'bg-[#00D4FF]',
        status === 'success' ? 'shadow-[0_0_8px_#10B981]' : 'shadow-[0_0_8px_#00D4FF]'
      )} />
      <div className="w-px h-full absolute top-2.5 bottom-0 bg-white/5" />
    </div>
    <div className="-mt-1.5 flex-1 pb-2">
      <div className="flex justify-between items-start mb-0.5">
        <h5 className="text-[11px] font-bold text-white uppercase tracking-wider">{title}</h5>
        <p className="text-[9px] text-zinc-700 font-bold uppercase tabular-nums">{time}</p>
      </div>
      <p className="text-xs text-zinc-500 leading-snug">{text}</p>
    </div>
  </div>
);

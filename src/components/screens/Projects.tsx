import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Calendar, Layers, CheckCircle2, Clock, PlayCircle, Plus, Trash2, ExternalLink, Globe } from 'lucide-react';
import { cn } from '../../lib/utils';
import { db } from '../../lib/firebase';
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';

interface Project {
  id: string;
  name: string;
  client: string;
  status: 'planning' | 'in-progress' | 'review' | 'delivered';
  phase?: string;
  progress: number;
  due: string;
  url?: string;
}

const statusConfig = {
  planning: { color: 'bg-zinc-400', label: 'Planning', icon: Clock },
  'in-progress': { color: 'bg-[#00D4FF]', label: 'In Progress', icon: PlayCircle },
  review: { color: 'bg-amber-500', label: 'Review', icon: Layers },
  delivered: { color: 'bg-emerald-500', label: 'Delivered', icon: CheckCircle2 },
};

export const Projects: React.FC = () => {
  const [filter, setFilter] = useState('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [projectsList, setProjectsList] = useState<Project[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', client: '', budget: '', url: '', status: 'planning' as const });

  useEffect(() => {
    const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setProjectsList(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project)));
    });
    return unsub;
  }, []);

  const handleAddProject = async () => {
    if (!newProject.name || !newProject.client) return;
    try {
      await addDoc(collection(db, 'projects'), {
        ...newProject,
        budget: parseFloat(newProject.budget) || 0,
        progress: 0,
        createdAt: serverTimestamp(),
      });
      setNewProject({ name: '', client: '', budget: '', url: '', status: 'planning' });
      setIsAdding(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteProject = async (id: string) => {
    console.log("Projects: Requesting deletion for", id);
    if (!window.confirm("Are you sure you want to delete this project? This action cannot be undone.")) return;
    try {
      await deleteDoc(doc(db, 'projects', id));
      console.log("Projects: Successfully deleted", id);
      if (expandedId === id) setExpandedId(null);
    } catch (e: any) {
      console.error("Delete project error:", e);
      alert("Database error: Could not remove project. " + e.message);
    }
  };

  const filters = ['All', 'In Progress', 'Review', 'Delivered'];

  const filteredProjects = projectsList.filter(p => 
    filter === 'All' || p.status.replace('-', ' ').toLowerCase() === filter.toLowerCase()
  );

  return (
    <div className="flex flex-col gap-6 pb-32 pt-6 px-6">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white">Projects</h2>
          <p className="text-zinc-500 text-sm">Your active engagements</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="w-10 h-10 rounded-full bg-[#00D4FF]/10 text-[#00D4FF] flex items-center justify-center border border-[#00D4FF]/20"
        >
          <Plus size={20} />
        </button>
      </header>

      {/* Filter Pills */}
      <div className="flex overflow-x-auto no-scrollbar gap-2 py-2">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 border",
              filter === f 
                ? "bg-[#00D4FF] border-[#00D4FF] text-black glow-cyan shadow-[0_0_15px_rgba(0,212,255,0.3)]" 
                : "bg-transparent border-white/5 text-zinc-400 hover:border-white/20"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Project Cards Stack */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProjects.length > 0 ? (
          filteredProjects.map((project) => (
            <ProjectListItem 
              key={project.id} 
              project={project} 
              isExpanded={expandedId === project.id}
              onToggle={() => setExpandedId(expandedId === project.id ? null : project.id)}
              onDelete={() => handleDeleteProject(project.id)}
            />
          ))
        ) : (
          <div className="col-span-full p-12 glass-card border-dashed text-center text-zinc-600 text-sm">
            No projects found matching the filter.
          </div>
        )}
      </div>

      {/* Add Project Modal */}
      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-[#0A0A0B]/90 backdrop-blur-xl flex items-center justify-center p-6"
            onClick={() => setIsAdding(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-[400px] glass-card p-6 bg-[#111113] border-white/10"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-white mb-6">New Agency Project</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1 mb-2 block">Project Name</label>
                  <input 
                    type="text" 
                    value={newProject.name}
                    onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                    placeholder="e.g. Himalyx Redesign"
                    className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-white placeholder-zinc-700 outline-none focus:border-[#00D4FF]/30 transition-all font-medium"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1 mb-2 block">Client Name</label>
                  <input 
                    type="text" 
                    value={newProject.client}
                    onChange={(e) => setNewProject({...newProject, client: e.target.value})}
                    placeholder="e.g. Sunil Chauhan"
                    className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-white placeholder-zinc-700 outline-none focus:border-[#00D4FF]/30 transition-all font-medium"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1 mb-2 block">Budget (NRS)</label>
                  <input 
                    type="number" 
                    value={newProject.budget}
                    onChange={(e) => setNewProject({...newProject, budget: e.target.value})}
                    placeholder="e.g. 1500"
                    className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-white placeholder-zinc-700 outline-none focus:border-[#00D4FF]/30 transition-all font-medium"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1 mb-2 block">Website URL (Optional)</label>
                  <input 
                    type="text" 
                    value={newProject.url}
                    onChange={(e) => setNewProject({...newProject, url: e.target.value})}
                    placeholder="https://..."
                    className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-white placeholder-zinc-700 outline-none focus:border-[#00D4FF]/30 transition-all font-medium"
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => setIsAdding(false)}
                    className="flex-1 h-12 rounded-xl border border-white/5 text-zinc-500 font-bold text-sm uppercase tracking-widest"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleAddProject}
                    className="flex-1 h-12 rounded-xl bg-[#00D4FF] text-black font-bold text-sm uppercase tracking-widest shadow-[0_0_15px_#00D4FF30]"
                  >
                    Create
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ProjectListItem: React.FC<{ project: Project, isExpanded: boolean, onToggle: () => void, onDelete: () => void }> = ({ project, isExpanded, onToggle, onDelete }) => {
  const config = statusConfig[project.status];

  return (
    <div className="glass-card overflow-hidden transition-all duration-500 relative group">
      <div 
        className="p-5 cursor-pointer active:scale-[0.99] transition-transform"
        onClick={onToggle}
      >
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full", config.color)} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              {config.label}
            </span>
          </div>
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onDelete();
            }}
            className="p-2.5 text-red-500 hover:bg-red-500/20 rounded-xl transition-all z-[60] bg-white/5 border border-white/10"
            title="Delete Project"
          >
            <Trash2 size={18} />
          </button>
        </div>
        
        <div className="flex justify-between items-start mb-1">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-semibold text-white tracking-tight">{project.name}</h3>
            {project.url && (
              <a 
                href={project.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                onClick={(e) => e.stopPropagation()}
                className="p-1 px-2 rounded-lg bg-[#00D4FF]/10 text-[#00D4FF] hover:bg-[#00D4FF]/20 transition-all"
              >
                <ExternalLink size={14} />
              </a>
            )}
          </div>
          <ChevronDown size={20} className={cn("text-zinc-600 transition-transform duration-300", isExpanded && "rotate-180")} />
        </div>
        <p className="text-sm text-zinc-500 mb-6">{project.client}</p>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-zinc-600 font-bold uppercase">Phase</span>
            <span className="text-xs text-zinc-300 font-medium">{project.phase || "Active"}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-zinc-600 font-bold uppercase">Progress</span>
            <span className="text-xs text-[#00D4FF] font-bold">{project.progress}%</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-zinc-600 font-bold uppercase">Due</span>
            <span className="text-xs text-zinc-300 font-medium">{project.due}</span>
          </div>
        </div>

        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${project.progress}%` }}
            className={cn("h-full", config.color)}
          />
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            className="border-t border-white/5 bg-white/[0.02]"
          >
            <div className="p-5 flex flex-col gap-5">
              <div className="flex justify-between items-center">
                <span className="text-xs text-zinc-400 font-semibold">Team Members</span>
                <div className="flex -space-x-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-[#111113] overflow-hidden">
                      <img src={`https://i.pravatar.cc/150?u=${project.id}${i}`} alt="Avatar" />
                    </div>
                  ))}
                  <div className="w-8 h-8 rounded-full border-2 border-[#111113] bg-[#1A1A1D] flex items-center justify-center text-[10px] text-zinc-400">+2</div>
                </div>
              </div>

              <div className="flex gap-2 mt-2">
                <button className="flex-1 py-2.5 rounded-xl bg-[#00D4FF]/10 text-[#00D4FF] text-xs font-bold border border-[#00D4FF]/20">
                  Project Details
                </button>
                <button className="flex-1 py-2.5 rounded-xl bg-white/5 text-white text-xs font-bold border border-white/5">
                  Update Logs
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

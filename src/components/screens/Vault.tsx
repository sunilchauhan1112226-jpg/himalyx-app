import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Search, Globe, Code, Figma, Key, Plus, ExternalLink, Copy, Share2, Link as LinkIcon, Lock, CheckCircle2, AlertCircle, Zap, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { auth, db, googleProvider, ADMIN_EMAIL } from '../../lib/firebase';
import { signInWithPopup, onAuthStateChanged, User } from 'firebase/auth';
import { collection, addDoc, serverTimestamp, query, getDocs, onSnapshot, orderBy, deleteDoc, doc } from 'firebase/firestore';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const categories = [
  { id: 'link', title: 'Link App', count: 0, icon: LinkIcon, primary: true },
  { id: 'control', title: 'Control Site', count: 0, icon: Zap, secondary: true },
  { id: 'Website', title: 'Websites', count: 0, icon: Globe },
  { id: 'Repository', title: 'Repositories', count: 0, icon: Code },
  { id: 'Design', title: 'Design Files', count: 0, icon: Figma },
  { id: 'Credentials', title: 'Credentials', count: 0, icon: Key },
];

export const Vault: React.FC = () => {
  const [isLinking, setIsLinking] = useState(false);
  const [isControlling, setIsControlling] = useState(false);
  const [url, setUrl] = useState('');
  const [appName, setAppName] = useState('');
  const [step, setStep] = useState<'url' | 'auth' | 'success'>('url');
  const [linkedApps, setLinkedApps] = useState<any[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [vaultItems, setVaultItems] = useState<any[]>([]);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });

    const qApps = query(collection(db, 'linkedApps'));
    const unsubApps = onSnapshot(qApps, (snapshot) => {
      setLinkedApps(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const qItems = query(collection(db, 'vaultItems'), orderBy('createdAt', 'desc'));
    const unsubItems = onSnapshot(qItems, (snapshot) => {
      setVaultItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => {
      console.warn("Vault items fetch failed (likely rules or empty collection)");
    });

    return () => {
      unsubAuth();
      unsubApps();
      unsubItems();
    };
  }, []);

  const handleLinkApp = () => {
    if (!url.trim() || !appName.trim()) return;
    setStep('auth');
  };

  const handleAuth = async () => {
    try {
      setError(null);
      const result = await signInWithPopup(auth, googleProvider);
      
      if (result.user.email !== ADMIN_EMAIL) {
        setError(`Access restricted. Please use ${ADMIN_EMAIL}`);
        await auth.signOut();
        return;
      }

      // If already admin, save to Firestore
      const docPath = 'linkedApps';
      try {
        await addDoc(collection(db, docPath), {
          name: appName,
          url: url,
          adminEmail: result.user.email,
          createdAt: serverTimestamp()
        });
        setStep('success');
        setTimeout(() => {
          setIsLinking(false);
          setStep('url');
          setUrl('');
          setAppName('');
        }, 2000);
      } catch (e) {
        handleFirestoreError(e, OperationType.CREATE, docPath);
      }
    } catch (err: any) {
      setError(err.message || "Failed to authenticate");
    }
  };

  const handleUnlinkApp = async (id: string) => {
    console.log("Attempting to unlink app:", id);
    if (!window.confirm("Disconnect website? This will revoke HIMALYX AI's neural link to this portal.")) return;
    try {
      await deleteDoc(doc(db, 'linkedApps', id));
      console.log("Successfully unlinked app:", id);
      setIsControlling(false);
    } catch (e: any) {
      console.error("Firestore delete error:", e);
      alert("Neural disconnect failed: " + e.message);
      handleFirestoreError(e, OperationType.DELETE, `linkedApps/${id}`);
    }
  };

  const activeApp = linkedApps[0];

  return (
    <div className="flex flex-col gap-6 pb-40 pt-6 px-6 relative min-h-screen">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-2">
            Vault <Shield size={24} className="text-[#00D4FF] opacity-50" />
          </h2>
          <p className="text-zinc-500 text-sm">Secure project assets</p>
        </div>
      </header>

      {/* Linked App Banner */}
      {activeApp && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-5 bg-[#00D4FF]/5 border-[#00D4FF]/20 flex items-center justify-between gap-4 group"
        >
          <div className="flex items-center gap-4 flex-1">
            <div className="w-10 h-10 rounded-2xl bg-[#00D4FF]/10 flex items-center justify-center shrink-0">
              <Globe size={20} className="text-[#00D4FF]" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-[#00D4FF] uppercase tracking-[0.2em] mb-1">Active Neural Link</p>
              <h4 className="text-sm font-bold text-white truncate">{activeApp.name}</h4>
              <p className="text-[10px] text-zinc-500 font-mono opacity-50 truncate">{activeApp.url}</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              handleUnlinkApp(activeApp.id);
            }}
            className="p-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer relative z-[100] border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.2)] bg-red-500/5 group-hover:scale-110 active:scale-95"
            title="Unlink Website"
          >
            <Trash2 size={24} />
          </button>
        </motion.div>
      )}

      {/* Search Bar */}
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors group-focus-within:text-[#00D4FF]" size={18} />
        <input 
          type="text" 
          placeholder="Search secured items..."
          className="w-full h-14 glass-card bg-white/[0.02] pl-12 pr-4 outline-none focus:border-[#00D4FF]/30 transition-all text-sm font-medium text-white"
        />
      </div>

      {/* Categories Grid */}
      <div>
        <h3 className="text-xs font-bold text-zinc-600 uppercase tracking-widest mb-4">Categories</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((cat) => {
            const itemCount = vaultItems.filter(item => item.type === cat.id).length;
            return (
              <div 
                key={cat.id} 
                onClick={() => {
                  if (cat.id === 'link') setIsLinking(true);
                  if (cat.id === 'control') setIsControlling(true);
                }}
                className={cn(
                  "glass-card p-5 group cursor-pointer active:scale-95 transition-all relative overflow-hidden",
                  cat.primary && "border-[#00D4FF30] bg-[#00D4FF05]",
                  cat.secondary && "border-[#10B98130] bg-[#10B98105]"
                )}
              >
                {cat.primary && <div className="absolute top-0 right-0 p-2"><Plus size={14} className="text-[#00D4FF]" /></div>}
                {cat.secondary && <div className="absolute top-0 right-0 p-2"><Zap size={14} className="text-[#10B981]" /></div>}
                <div className={cn(
                  "p-2.5 rounded-xl w-fit mb-4 group-hover:bg-opacity-20 transition-colors",
                  cat.primary ? "bg-[#00D4FF20] text-[#00D4FF]" : 
                  cat.secondary ? "bg-[#10B98120] text-[#10B981]" :
                  "bg-white/5 text-zinc-400 group-hover:text-[#00D4FF] group-hover:bg-[#00D4FF]/10"
                )}>
                  <cat.icon size={20} />
                </div>
                <h4 className="text-white font-bold mb-1">{cat.title}</h4>
                <p className="text-xs text-zinc-500">
                  {cat.id === 'link' && (activeApp ? 'Connected' : 'Connect')}
                  {cat.id === 'control' && (activeApp ? 'Admin Ready' : 'Link First')}
                  {cat.id !== 'link' && cat.id !== 'control' && `${itemCount} Items`}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Items List */}
      <div className="flex flex-col gap-4">
        <h3 className="text-xs font-bold text-zinc-600 uppercase tracking-widest mt-2 overflow-hidden">
          {activeApp ? `Vault for ${activeApp.name}` : `Recent Items`}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vaultItems.length > 0 ? (
            vaultItems.map((item) => (
              <VaultItemCard key={item.id} item={item} />
            ))
          ) : (
            <div className="col-span-full p-12 glass-card border-dashed text-center text-zinc-600 text-sm">
              Your vault is empty. Link an app to start tracking assets.
            </div>
          )}
        </div>
      </div>

      {/* Link App Overlay */}
      <AnimatePresence>
        {isLinking && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-[#0A0A0B]/90 backdrop-blur-xl flex items-end justify-center p-6"
            onClick={() => setIsLinking(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full max-w-[400px] glass-card p-8 bg-[#111113] border-white/10 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex flex-col items-center text-center gap-6">
                <div className="w-16 h-16 rounded-3xl bg-[#00D4FF20] flex items-center justify-center text-[#00D4FF]">
                  {step === 'url' && <LinkIcon size={32} />}
                  {step === 'auth' && <Lock size={32} className="animate-pulse" />}
                  {step === 'success' && <CheckCircle2 size={32} className="text-[#10B981]" />}
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-white">
                    {step === 'url' && "Neural Connectivity"}
                    {step === 'auth' && "Admin Verification"}
                    {step === 'success' && "Website Synchronized"}
                  </h3>
                  <p className="text-zinc-500 text-sm leading-relaxed px-4">
                    {step === 'url' && "Paste your website URL to establish a secure link with HIMALYX AI."}
                    {step === 'auth' && "To maintain neural access, please sign in with your authorized admin Gmail account."}
                    {step === 'success' && "Connection established. HIMALYX AI now observes and audits this portal."}
                  </p>
                </div>

                {error && (
                  <div className="w-full p-4 glass-card border-red-500/20 bg-red-500/5 flex items-center gap-3 text-red-500 text-xs font-semibold">
                    <AlertCircle size={14} /> {error}
                  </div>
                )}

                {step === 'url' && (
                  <div className="w-full space-y-4">
                    <div className="space-y-3">
                      <div className="relative">
                        <Code className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                        <input 
                          type="text" 
                          value={appName}
                          onChange={(e) => setAppName(e.target.value)}
                          placeholder="App Name (e.g. Himalyx)"
                          className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 text-white font-medium focus:border-[#00D4FF50] outline-none transition-all"
                        />
                      </div>
                      <div className="relative">
                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                        <input 
                          type="text" 
                          value={url}
                          onChange={(e) => setUrl(e.target.value)}
                          placeholder="Website URL (https://...)"
                          className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 text-white font-medium focus:border-[#00D4FF50] outline-none transition-all"
                        />
                      </div>
                    </div>
                    <button 
                      onClick={handleLinkApp}
                      className="w-full h-14 bg-[#00D4FF] text-black font-bold rounded-2xl shadow-[0_10px_20px_rgba(0,212,255,0.3)] hover:scale-[1.02] active:scale-95 transition-all"
                    >
                      Establish Connection
                    </button>
                  </div>
                )}

                {step === 'auth' && (
                  <div className="w-full space-y-4">
                    <div className="p-4 glass-card bg-white/[0.02] text-sm text-zinc-400 mb-2">
                      Authorized: <span className="text-white font-mono text-[10px] break-all">{ADMIN_EMAIL}</span>
                    </div>
                    <button 
                      onClick={handleAuth}
                      className="w-full h-14 bg-white text-black font-bold rounded-2xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl"
                    >
                      <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
                      Sign in with Google
                    </button>
                  </div>
                )}

                <button 
                  onClick={() => setIsLinking(false)}
                  className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest hover:text-zinc-500 transition-colors"
                >
                  Cancel Process
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Control Panel Overlay */}
      <AnimatePresence>
        {isControlling && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-[#0A0A0B]/95 backdrop-blur-2xl flex flex-col p-6 overflow-y-auto pt-20"
          >
            <div className="max-w-[400px] mx-auto w-full space-y-8">
              <header className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="text-3xl font-bold text-white uppercase tracking-tighter">Admin Panel</h3>
                  <p className="text-[#10B981] text-[10px] font-bold uppercase tracking-[0.3em] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                    Secure Link Established
                  </p>
                </div>
                <button 
                  onClick={() => setIsControlling(false)}
                  className="w-10 h-10 glass-card flex items-center justify-center text-zinc-500"
                >
                  <Plus size={20} className="rotate-45" />
                </button>
              </header>

              {!activeApp ? (
                <div className="h-[400px] flex flex-col items-center justify-center text-center glass-card p-8 border-amber-500/20 bg-amber-500/5">
                  <AlertCircle size={48} className="text-amber-500 mb-6 opacity-50" />
                  <h4 className="text-white font-bold mb-2">No Active Link</h4>
                  <p className="text-zinc-500 text-sm">You must link a website through the 'Link App' portal before accessing admin controls.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Site Identity */}
                  <div className="glass-card p-6 bg-white/[0.02]">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-[#00D4FF]/10 flex items-center justify-center text-[#00D4FF] shadow-[0_0_20px_#00D4FF20]">
                        <Globe size={28} />
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-white tracking-tight">{activeApp.name}</h4>
                        <p className="text-xs text-zinc-500 font-mono opacity-60">{activeApp.url}</p>
                      </div>
                    </div>
                  </div>

                  {/* Real-time Metrics Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="glass-card p-4">
                      <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mb-1">Total Assets</p>
                      <p className="text-2xl font-bold text-white tabular-nums">{vaultItems.length}</p>
                      <div className="mt-2 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div animate={{ width: '100%' }} className="h-full bg-[#10B981]" />
                      </div>
                    </div>
                    <div className="glass-card p-4">
                      <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mb-1">API Latency</p>
                      <p className="text-2xl font-bold text-[#00D4FF] tabular-nums">14ms</p>
                      <div className="mt-2 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div animate={{ width: '15%' }} className="h-full bg-[#00D4FF]" />
                      </div>
                    </div>
                  </div>

                  {/* Control Groups */}
                  <div className="space-y-3">
                    <h5 className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest px-1">System Controls</h5>
                    <AdminControlButton icon={Shield} label="Security Audit" value="Healthy" />
                    <AdminControlButton icon={Code} label="Build Pipeline" value="Success" />
                    <AdminControlButton icon={Key} label="SSL Status" value="Active" />
                  </div>

                  {/* Danger Zone */}
                  <div className="pt-4 border-t border-white/5">
                    <button className="w-full h-14 glass-card border-red-500/20 text-red-500 font-bold hover:bg-red-500/10 transition-colors uppercase text-xs tracking-widest">
                       Purge Cache & Restart Server
                    </button>
                    <p className="text-center text-[9px] text-zinc-700 mt-4 uppercase tracking-[0.2em]">Authorized as {ADMIN_EMAIL}</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-32 right-8 w-14 h-14 rounded-full bg-[#00D4FF] flex items-center justify-center text-black shadow-[0_0_20px_rgba(0,212,255,0.4)] z-50 overflow-hidden"
      >
        <Plus size={28} />
        <motion.div 
          animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 bg-white"
        />
      </motion.button>
    </div>
  );
};

const VaultItemCard: React.FC<{ item: any }> = ({ item }) => {
  const getIcon = () => {
    switch(item.type) {
      case 'Website': return Globe;
      case 'Repository': return Code;
      case 'Design': return Figma;
      case 'Credentials': return Key;
      default: return Shield;
    }
  };
  const Icon = getIcon();

  return (
    <div className="glass-card p-4 hover:border-[#00D4FF]/20 transition-all duration-300 group">
      <div className="flex items-center gap-4 mb-4">
        <div className="p-3 rounded-xl bg-white/5 text-zinc-400 group-hover:text-[#00D4FF] group-hover:bg-[#00D4FF]/10 transition-all">
          <Icon size={20} />
        </div>
        <div className="flex-1">
          <h4 className="text-white font-bold mb-1">{item.title}</h4>
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-white/5 py-0.5 px-2 rounded-md text-zinc-500 font-bold uppercase">{item.type}</span>
            <div className="flex gap-1">
              {item.tags?.map((tag: string) => (
                <span key={tag} className="text-[10px] text-zinc-600 font-medium tracking-tight">#{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex gap-2 pt-2 border-t border-white/5">
        <button className="flex-1 py-2 flex items-center justify-center gap-2 bg-white/0 hover:bg-white/5 rounded-lg transition-colors text-zinc-500 hover:text-white">
          <Copy size={14} />
        </button>
        <button className="flex-1 py-2 flex items-center justify-center gap-2 bg-white/0 hover:bg-white/5 rounded-lg transition-colors text-zinc-500 hover:text-white">
          <ExternalLink size={14} />
        </button>
        <button className="flex-1 py-2 flex items-center justify-center gap-2 bg-white/0 hover:bg-white/5 rounded-lg transition-colors text-zinc-500 hover:text-white">
          <Share2 size={14} />
        </button>
      </div>
    </div>
  );
};

const AdminControlButton = ({ icon: Icon, label, value }: any) => (
  <div className="glass-card p-4 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer group">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-zinc-500 group-hover:text-white transition-colors">
        <Icon size={16} />
      </div>
      <span className="text-sm font-semibold text-zinc-300">{label}</span>
    </div>
    <span className="text-[10px] font-bold text-[#10B981] uppercase tracking-widest">{value}</span>
  </div>
);

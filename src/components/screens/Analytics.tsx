import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, Target, Activity, Calendar } from 'lucide-react';
import { cn } from '../../lib/utils';
import { db } from '../../lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

export const Analytics: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    activeProjects: 0,
    avgValue: 0,
    retention: 94 // Keep as placeholder or compute if we have clients collection
  });

  useEffect(() => {
    const qProjects = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
    const unsubProjects = onSnapshot(qProjects, (snap) => {
      const pList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProjects(pList);
      
      const projectRev = pList.reduce((acc, curr: any) => acc + (curr.budget || 0), 0);
      const active = pList.filter((p: any) => p.status !== 'delivered').length;
      const avg = pList.length > 0 ? projectRev / pList.length : 0;
      
      setStats(prev => ({
        ...prev,
        totalRevenue: projectRev, // Default to projects if no manual revenue
        activeProjects: active,
        avgValue: avg,
      }));
    });

    const qRevenue = query(collection(db, 'revenueData'), orderBy('createdAt', 'asc'));
    const unsubRevenue = onSnapshot(qRevenue, (snap) => {
      const rList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMonthlyRevenue(rList);
      
      if (rList.length > 0) {
        const totalManualRev = rList.reduce((acc, curr: any) => acc + (curr.amount || 0), 0);
        setStats(prev => ({ ...prev, totalRevenue: totalManualRev }));
      }
    });

    return () => {
      unsubProjects();
      unsubRevenue();
    };
  }, []);

  // Compute Top Clients
  const clientData = projects.reduce((acc: any, curr: any) => {
    if (!curr.client) return acc;
    if (!acc[curr.client]) {
      acc[curr.client] = { name: curr.client, projects: 0, value: 0 };
    }
    acc[curr.client].projects += 1;
    acc[curr.client].value += (curr.budget || 0);
    return acc;
  }, {});

  const topClients = Object.values(clientData)
    .sort((a: any, b: any) => b.value - a.value)
    .slice(0, 5);

  // Simple Pipeline Calculation
  const pipeline = [
    { stage: 'Planning', count: projects.filter(p => p.status === 'planning').length, width: '100%', color: 'rgba(255,255,255,0.05)' },
    { stage: 'In Progress', count: projects.filter(p => p.status === 'in-progress').length, width: '80%', color: 'rgba(0,212,255,0.1)' },
    { stage: 'Review', count: projects.filter(p => p.status === 'review').length, width: '60%', color: 'rgba(0,212,255,0.2)' },
    { stage: 'Delivered', count: projects.filter(p => p.status === 'delivered').length, width: '40%', color: 'rgba(0,212,255,0.4)' },
  ];

  // Map manual revenue or projects to chart
  const revenueChartData = monthlyRevenue.length > 0 
    ? monthlyRevenue.map((r: any) => ({ name: r.month, value: r.amount }))
    : [
        { name: 'Start', value: stats.totalRevenue * 0.4 },
        { name: 'Phase 2', value: stats.totalRevenue * 0.6 },
        { name: 'Phase 3', value: stats.totalRevenue * 0.8 },
        { name: 'Current', value: stats.totalRevenue },
      ];

  return (
    <div className="flex flex-col gap-6 pb-40 pt-6 px-6">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white">Analytics</h2>
          <p className="text-zinc-500 text-sm">Real-time performance</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 glass-card text-[10px] font-bold text-[#00D4FF] uppercase tracking-widest border-[#00D4FF]/20">
          <Activity size={14} className="animate-pulse" /> LIVE SYNC
        </div>
      </header>

      {/* Revenue Chart */}
      <div className="glass-card p-6 h-[300px] flex flex-col">
        <h3 className="text-xs font-bold text-zinc-600 uppercase tracking-widest mb-6">Revenue Scaling</h3>
        <div className="flex-1 -ml-8">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueChartData}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00D4FF" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#00D4FF" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#4B5563', fontSize: 10, fontWeight: 700 }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#4B5563', fontSize: 10, fontWeight: 700 }}
                tickFormatter={(value) => `Rs.${value}`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#111113', 
                  border: '1px solid rgba(255,255,255,0.1)', 
                  borderRadius: '12px',
                  fontSize: '12px'
                }}
                itemStyle={{ color: '#00D4FF' }}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#00D4FF" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorValue)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <StatItem label="Total Revenue" value={`Rs.${stats.totalRevenue.toLocaleString()}`} change={stats.totalRevenue > 0 ? "+100%" : "0%"} icon={TrendingUp} up />
        <StatItem label="Active Projects" value={stats.activeProjects} change={`+${stats.activeProjects}`} icon={Activity} up />
        <StatItem label="Avg Proj. Value" value={`Rs.${stats.avgValue.toFixed(0).toLocaleString()}`} icon={Target} />
        <StatItem label="Retention Rate" value={`${stats.retention}%`} icon={Users} />
      </div>

      {/* Project Pipeline */}
      <div>
        <h3 className="text-xs font-bold text-zinc-600 uppercase tracking-widest mb-4">Live Pipeline</h3>
        <div className="flex flex-col gap-3">
          {pipeline.map((item) => (
            <div key={item.stage} className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                 <span className="text-zinc-500">{item.stage}</span>
                 <span className="text-white">{item.count}</span>
              </div>
              <div className="h-4 w-full bg-white/5 rounded-md overflow-hidden relative border border-white/5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: item.count > 0 ? "100%" : "0%" }}
                  className="h-full absolute left-0 top-0 transition-all duration-1000 border-r border-[#00D4FF10]" 
                  style={{ backgroundColor: `rgba(0, 212, 255, ${Math.min(0.1 + (item.count * 0.1), 0.6)})` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Clients Section */}
      <div className="pb-10">
        <h3 className="text-xs font-bold text-zinc-600 uppercase tracking-widest mb-4">Top Clients</h3>
        <div className="flex flex-col gap-3">
          {topClients.length > 0 ? (
            topClients.map((client: any) => (
              <ClientItem key={client.name} name={client.name} projects={client.projects} value={`Rs.${client.value.toLocaleString()}`} />
            ))
          ) : (
            <div className="glass-card p-8 border-dashed text-center text-zinc-700 text-[10px] font-bold uppercase tracking-widest">
              No client data detected.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatItem = ({ label, value, change, icon: Icon, up }: any) => (
  <div className="glass-card p-4">
    <div className="flex justify-between items-start mb-4">
       <div className="p-2 rounded-lg bg-white/5 text-[#00D4FF]">
          <Icon size={16} />
       </div>
       {change && (
         <div className={cn("text-[9px] font-bold uppercase", up ? "text-[#10B981]" : "text-red-500")}>
           {change}
         </div>
       )}
    </div>
    <div className="text-xl font-bold text-white mb-1 tabular-nums">{value}</div>
    <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest truncate">{label}</div>
  </div>
);

const ClientItem = ({ name, projects, value }: any) => (
  <div className="glass-card p-4 flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-[10px] font-bold text-zinc-400 bg-white/5">
        {name[0]}
      </div>
      <div>
        <h4 className="text-xs font-bold text-white">{name}</h4>
        <p className="text-[10px] text-zinc-500 font-medium">{projects} Projects</p>
      </div>
    </div>
    <div className="text-xs font-bold text-[#00D4FF]">{value}</div>
  </div>
);

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const RiskMap = ({ tasks = [] }) => {
  const activeTasks = tasks
    .filter(task => task.status !== "Done")
    .map(task => ({
      name: task.title,
      risk: task.priority?.includes('Critical') ? 90 : 
            task.priority?.includes('High') ? 65 : 35
    }));

  const getBarColor = (score) => score > 80 ? '#ef4444' : (score > 50 ? '#f59e0b' : '#10b981');

  if (activeTasks.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200 h-80 flex flex-col items-center justify-center text-center">
        <div className="bg-green-100 p-4 rounded-full mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-800">Sprint Stabilized</h2>
        <p className="text-slate-500 text-sm mt-2">All high-risk bottlenecks have been cleared.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900">Execution Risk Map</h2>
        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-1">Bottleneck Impact Analysis</p>
      </div>
      
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={activeTasks} margin={{ bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="name" 
              angle={-45} 
              textAnchor="end" 
              interval={0} 
              tick={{fill: '#64748b', fontSize: 10}} 
              height={60} 
            />
            <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
            <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '12px', border: 'none' }} />
            <Bar dataKey="risk" radius={[6, 6, 0, 0]} barSize={40}>
              {activeTasks.map((entry, index) => <Cell key={`c-${index}`} fill={getBarColor(entry.risk)} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RiskMap;
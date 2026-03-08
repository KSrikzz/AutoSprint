import React from 'react';

const RiskMap = ({ tasks }) => {
  const activeTasks = tasks.filter(t => t.status !== "Done");
  const highRiskTasks = activeTasks.filter(task => task.priority >= 4);
  const medRiskTasks = activeTasks.filter(task => task.priority === 3);
  const lowRiskTasks = activeTasks.filter(task => task.priority <= 2);

  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
      <h2 className="text-xl font-bold text-slate-800 mb-4 uppercase tracking-tight">AI Risk Heatmap</h2>
      
      <div className="grid grid-cols-3 gap-2 h-32 mb-6">
        <div className={`rounded-lg flex flex-col items-center justify-center border-2 ${highRiskTasks.length > 0 ? 'bg-red-50 border-red-200 text-red-600 animate-pulse' : 'bg-slate-50 border-slate-100 text-slate-300'}`}>
          <span className="text-2xl font-black">{highRiskTasks.length}</span>
          <span className="text-[10px] font-bold uppercase">Critical</span>
        </div>

        <div className="bg-orange-50 border-2 border-orange-100 rounded-lg flex flex-col items-center justify-center text-orange-600">
          <span className="text-2xl font-black">{medRiskTasks.length}</span>
          <span className="text-[10px] font-bold uppercase">Active</span>
        </div>

        <div className="bg-green-50 border-2 border-green-100 rounded-lg flex flex-col items-center justify-center text-green-600">
          <span className="text-2xl font-black">{lowRiskTasks.length}</span>
          <span className="text-[10px] font-bold uppercase">Stable</span>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Risk Distribution</p>
        {highRiskTasks.map(task => (
          <div key={task.id} className="text-xs bg-red-100 text-red-700 p-2 rounded border border-red-200 font-medium">
            ⚠️ {task.title}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RiskMap;
import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { fetchPrioritizedTasks } from '../services/api';

const RiskMap = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetchPrioritizedTasks();
        const tasks = response.prioritized_tasks || [];
        
        setData(tasks.map(task => ({
          name: task.title,
          risk: task.priority_score || (task.priority.includes('Critical') ? 90 : 40),
          hours: task.estimated_hours
        })));
      } catch (err) {
        console.error("Risk Map Error:", err);
      }
    };
    loadData();
  }, []);

  const getBarColor = (score) => score > 80 ? '#ef4444' : (score > 50 ? '#f59e0b' : '#10b981');

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-xl font-bold mb-4 text-slate-800">Execution Risk Map</h2>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart key={data.length} data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" hide />
            <YAxis />
            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
            <Bar dataKey="risk" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => <Cell key={`c-${index}`} fill={getBarColor(entry.risk)} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RiskMap;

import React from 'react';
import { InfographicData } from '../../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Props {
  data: InfographicData;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6366f1'];

const InfographicView: React.FC<Props> = ({ data }) => {
  if (!data) return null;

  return (
    <div className="h-full flex flex-col p-6 bg-slate-50 overflow-y-auto custom-scrollbar">
       {/* Header */}
       <div className="mb-6">
         <h2 className="text-3xl font-bold text-slate-800 tracking-tight">{data.title || "Untitled Dashboard"}</h2>
         <p className="text-slate-600 mt-3 text-lg leading-relaxed border-l-4 border-blue-500 pl-4 bg-white p-4 rounded-r shadow-sm">
           {data.summary || "No summary available."}
         </p>
       </div>

       {/* Key Metrics */}
       <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
         {(data.metrics || []).map((m, i) => (
           <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col hover:shadow-md transition-shadow">
             <span className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-2">{m.label}</span>
             <div className="mt-auto flex items-end justify-between">
               <span className="text-2xl font-bold text-slate-800">{m.value}</span>
               {m.trend === 'up' && <TrendingUp size={20} className="text-emerald-500" />}
               {m.trend === 'down' && <TrendingDown size={20} className="text-red-500" />}
               {m.trend === 'neutral' && <Minus size={20} className="text-slate-400" />}
             </div>
           </div>
         ))}
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-[400px]">
          {/* Process Flow */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col">
            <h3 className="text-lg font-bold text-slate-800 mb-6 border-b pb-2">Process Analysis Flow</h3>
            <div className="flex-1 space-y-0">
              {(data.processFlow || []).map((step, i) => (
                <div key={i} className="relative flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 border-2 border-blue-200 flex items-center justify-center font-bold text-sm z-10">
                      {i + 1}
                    </div>
                    {i !== (data.processFlow || []).length - 1 && (
                      <div className="w-0.5 h-full bg-slate-200 my-1"></div>
                    )}
                  </div>
                  <div className="pb-8 pt-1">
                    <h4 className="font-semibold text-slate-800 text-base">{step.step}</h4>
                    <p className="text-sm text-slate-500 mt-1 leading-relaxed">{step.description}</p>
                  </div>
                </div>
              ))}
              {(!data.processFlow || data.processFlow.length === 0) && (
                <div className="text-slate-400 text-center py-10 italic">Waiting for analysis...</div>
              )}
            </div>
          </div>

          {/* Chart */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col">
             <h3 className="text-lg font-bold text-slate-800 mb-6 border-b pb-2">{data.chartTitle || 'Metric Visualization'}</h3>
             <div className="flex-1 w-full min-h-[300px]">
                {data.chartData && data.chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.chartData} layout="vertical" margin={{ left: 10, right: 30, top: 10, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12, fill: '#64748b'}} interval={0} />
                      <Tooltip 
                        cursor={{fill: '#f1f5f9'}} 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24} animationDuration={1000}>
                        {data.chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400">
                    <div className="p-4 bg-slate-50 rounded-full mb-3">
                        <TrendingUp size={24} className="text-slate-300"/>
                    </div>
                    <p className="italic">No chart data available yet.</p>
                  </div>
                )}
             </div>
          </div>
       </div>
    </div>
  );
};

export default InfographicView;

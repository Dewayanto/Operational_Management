import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { EOQResult } from '../../types';

const EOQCalculator: React.FC = () => {
  const [demand, setDemand] = useState<number>(1000);
  const [orderingCost, setOrderingCost] = useState<number>(10);
  const [holdingCost, setHoldingCost] = useState<number>(2);
  const [result, setResult] = useState<EOQResult | null>(null);

  useEffect(() => {
    calculateEOQ();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demand, orderingCost, holdingCost]);

  const calculateEOQ = () => {
    if (demand <= 0 || orderingCost <= 0 || holdingCost <= 0) return;

    const eoq = Math.sqrt((2 * demand * orderingCost) / holdingCost);
    const totalCost = (demand / eoq) * orderingCost + (eoq / 2) * holdingCost;
    
    // Generate data points for the chart
    const points = [];
    const step = Math.max(1, Math.round(eoq * 2 / 20)); 
    for (let q = step; q <= eoq * 2.5; q += step) {
      const hCost = (q / 2) * holdingCost;
      const oCost = (demand / q) * orderingCost;
      points.push({
        q: Math.round(q),
        totalCost: Math.round(hCost + oCost),
        holdingCost: Math.round(hCost),
        orderingCost: Math.round(oCost),
      });
    }

    setResult({
      eoq: Math.round(eoq),
      totalCost: Math.round(totalCost),
      holdingCost: Math.round((eoq / 2) * holdingCost),
      orderingCost: Math.round((demand / eoq) * orderingCost),
      points
    });
  };

  return (
    <div className="h-full flex flex-col p-4 bg-white rounded-lg shadow-sm">
      <h2 className="text-xl font-bold mb-4 text-slate-800 border-b pb-2">Economic Order Quantity (EOQ) Model</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Annual Demand (D)</label>
          <input 
            type="number" 
            value={demand} 
            onChange={(e) => setDemand(Number(e.target.value))}
            className="w-full border border-slate-300 rounded px-3 py-2 text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Ordering Cost (S)</label>
          <input 
            type="number" 
            value={orderingCost} 
            onChange={(e) => setOrderingCost(Number(e.target.value))}
            className="w-full border border-slate-300 rounded px-3 py-2 text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Holding Cost (H)</label>
          <input 
            type="number" 
            value={holdingCost} 
            onChange={(e) => setHoldingCost(Number(e.target.value))}
            className="w-full border border-slate-300 rounded px-3 py-2 text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      {result && (
        <div className="flex-1 flex flex-col">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div className="text-center">
              <span className="block text-xs text-slate-500 uppercase">Optimal Qty (Q*)</span>
              <span className="text-2xl font-bold text-blue-600">{result.eoq}</span>
              <span className="text-xs text-slate-400 ml-1">units</span>
            </div>
            <div className="text-center">
              <span className="block text-xs text-slate-500 uppercase">Total Cost</span>
              <span className="text-2xl font-bold text-emerald-600">${result.totalCost}</span>
            </div>
            <div className="text-center">
              <span className="block text-xs text-slate-500 uppercase">Holding Cost</span>
              <span className="text-lg font-semibold text-slate-700">${result.holdingCost}</span>
            </div>
            <div className="text-center">
              <span className="block text-xs text-slate-500 uppercase">Ordering Cost</span>
              <span className="text-lg font-semibold text-slate-700">${result.orderingCost}</span>
            </div>
          </div>

          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={result.points}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="q" 
                  label={{ value: 'Order Quantity (Q)', position: 'insideBottom', offset: -5 }} 
                  stroke="#64748b"
                />
                <YAxis 
                  label={{ value: 'Cost ($)', angle: -90, position: 'insideLeft' }} 
                  stroke="#64748b"
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '4px' }}
                />
                <Legend verticalAlign="top" height={36}/>
                <Line type="monotone" dataKey="totalCost" stroke="#059669" name="Total Cost" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="holdingCost" stroke="#3b82f6" name="Holding Cost" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                <Line type="monotone" dataKey="orderingCost" stroke="#f59e0b" name="Ordering Cost" strokeWidth={2} dot={false} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-slate-400 mt-2 text-center italic">
            *Analysis based on Basic EOQ Assumptions: Constant demand, constant lead time, instantaneous receipt.
          </p>
        </div>
      )}
    </div>
  );
};

export default EOQCalculator;

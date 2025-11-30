import React, { useState } from 'react';
import { SIPOCData } from '../../types';

const SIPOCBuilder: React.FC = () => {
  const [data, setData] = useState<SIPOCData>({
    suppliers: 'Raw Material Vendor\nLogistics Provider',
    inputs: 'Steel Sheets\nPaint\nEnergy',
    process: '1. Cutting\n2. Stamping\n3. Painting\n4. Assembly',
    outputs: 'Car Chassis\nScrap Metal',
    customers: 'Assembly Plant\nRecycling Center'
  });

  const handleChange = (field: keyof SIPOCData, value: string) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="h-full flex flex-col p-4 bg-white rounded-lg shadow-sm overflow-y-auto">
      <div className="flex justify-between items-center mb-4 border-b pb-2">
        <h2 className="text-xl font-bold text-slate-800">SIPOC Analysis</h2>
        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Process Diagnosis</span>
      </div>

      <p className="text-sm text-slate-600 mb-6">
        Define the high-level process scope. Useful for scoping DMAIC projects and understanding value flow.
      </p>

      <div className="grid grid-cols-5 gap-2 h-full min-h-[400px]">
        {/* Suppliers */}
        <div className="flex flex-col bg-slate-50 p-2 rounded border border-slate-200">
          <div className="text-center font-bold text-slate-700 bg-slate-200 py-2 rounded mb-2">SUPPLIERS</div>
          <textarea 
            className="flex-1 w-full bg-white p-2 text-sm border border-slate-200 rounded resize-none focus:ring-1 focus:ring-blue-500 outline-none"
            value={data.suppliers}
            onChange={(e) => handleChange('suppliers', e.target.value)}
            placeholder="Who provides inputs?"
          />
        </div>

        {/* Inputs */}
        <div className="flex flex-col bg-slate-50 p-2 rounded border border-slate-200">
          <div className="text-center font-bold text-slate-700 bg-slate-200 py-2 rounded mb-2">INPUTS</div>
          <textarea 
            className="flex-1 w-full bg-white p-2 text-sm border border-slate-200 rounded resize-none focus:ring-1 focus:ring-blue-500 outline-none"
            value={data.inputs}
            onChange={(e) => handleChange('inputs', e.target.value)}
            placeholder="Resources required?"
          />
        </div>

        {/* Process */}
        <div className="flex flex-col bg-blue-50 p-2 rounded border border-blue-200">
          <div className="text-center font-bold text-blue-800 bg-blue-200 py-2 rounded mb-2">PROCESS</div>
          <textarea 
            className="flex-1 w-full bg-white p-2 text-sm border border-blue-200 rounded resize-none focus:ring-1 focus:ring-blue-500 outline-none"
            value={data.process}
            onChange={(e) => handleChange('process', e.target.value)}
            placeholder="High-level steps (5-7 max)"
          />
        </div>

        {/* Outputs */}
        <div className="flex flex-col bg-slate-50 p-2 rounded border border-slate-200">
          <div className="text-center font-bold text-slate-700 bg-slate-200 py-2 rounded mb-2">OUTPUTS</div>
          <textarea 
            className="flex-1 w-full bg-white p-2 text-sm border border-slate-200 rounded resize-none focus:ring-1 focus:ring-blue-500 outline-none"
            value={data.outputs}
            onChange={(e) => handleChange('outputs', e.target.value)}
            placeholder="Results/Products?"
          />
        </div>

        {/* Customers */}
        <div className="flex flex-col bg-slate-50 p-2 rounded border border-slate-200">
          <div className="text-center font-bold text-slate-700 bg-slate-200 py-2 rounded mb-2">CUSTOMERS</div>
          <textarea 
            className="flex-1 w-full bg-white p-2 text-sm border border-slate-200 rounded resize-none focus:ring-1 focus:ring-blue-500 outline-none"
            value={data.customers}
            onChange={(e) => handleChange('customers', e.target.value)}
            placeholder="Who receives output?"
          />
        </div>
      </div>
    </div>
  );
};

export default SIPOCBuilder;

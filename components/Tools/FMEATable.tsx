import React, { useState } from 'react';
import { FMEARow } from '../../types';
import { Trash2, Plus } from 'lucide-react';

const FMEATable: React.FC = () => {
  const [rows, setRows] = useState<FMEARow[]>([
    { id: '1', processStep: 'Baking', failureMode: 'Overcooked', effect: 'Scrap/Taste deviation', severity: 7, occurrence: 4, detection: 3, rpn: 84 },
    { id: '2', processStep: 'Packaging', failureMode: 'Label Misalignment', effect: 'Customer complaint', severity: 3, occurrence: 2, detection: 8, rpn: 48 },
  ]);

  const addRow = () => {
    const newRow: FMEARow = {
      id: Math.random().toString(36).substr(2, 9),
      processStep: '',
      failureMode: '',
      effect: '',
      severity: 1,
      occurrence: 1,
      detection: 1,
      rpn: 1
    };
    setRows([...rows, newRow]);
  };

  const deleteRow = (id: string) => {
    setRows(rows.filter(r => r.id !== id));
  };

  const updateRow = (id: string, field: keyof FMEARow, value: string | number) => {
    setRows(rows.map(row => {
      if (row.id === id) {
        const updated = { ...row, [field]: value };
        // Recalculate RPN if SOD changes
        if (field === 'severity' || field === 'occurrence' || field === 'detection') {
          updated.rpn = Number(updated.severity) * Number(updated.occurrence) * Number(updated.detection);
        }
        return updated;
      }
      return row;
    }));
  };

  return (
    <div className="h-full flex flex-col p-4 bg-white rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-4 border-b pb-2">
        <h2 className="text-xl font-bold text-slate-800">Failure Mode & Effects Analysis (FMEA)</h2>
        <button 
          onClick={addRow}
          className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
        >
          <Plus size={16} /> Add Risk Item
        </button>
      </div>

      <div className="overflow-auto flex-1">
        <table className="min-w-full text-sm text-left text-slate-600">
          <thead className="text-xs text-slate-700 uppercase bg-slate-100 sticky top-0">
            <tr>
              <th className="px-3 py-3 rounded-tl-lg">Process Step</th>
              <th className="px-3 py-3">Failure Mode</th>
              <th className="px-3 py-3">Potential Effect</th>
              <th className="px-3 py-3 w-16 text-center" title="Severity (1-10)">S</th>
              <th className="px-3 py-3 w-16 text-center" title="Occurrence (1-10)">O</th>
              <th className="px-3 py-3 w-16 text-center" title="Detection (1-10)">D</th>
              <th className="px-3 py-3 w-16 text-center font-bold text-red-600">RPN</th>
              <th className="px-3 py-3 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="bg-white border-b hover:bg-slate-50">
                <td className="px-2 py-2">
                  <input 
                    type="text" 
                    value={row.processStep} 
                    onChange={(e) => updateRow(row.id, 'processStep', e.target.value)}
                    className="w-full bg-transparent border-b border-transparent focus:border-blue-500 outline-none"
                    placeholder="Step..."
                  />
                </td>
                <td className="px-2 py-2">
                  <input 
                    type="text" 
                    value={row.failureMode} 
                    onChange={(e) => updateRow(row.id, 'failureMode', e.target.value)}
                    className="w-full bg-transparent border-b border-transparent focus:border-blue-500 outline-none"
                    placeholder="Mode..."
                  />
                </td>
                <td className="px-2 py-2">
                  <input 
                    type="text" 
                    value={row.effect} 
                    onChange={(e) => updateRow(row.id, 'effect', e.target.value)}
                    className="w-full bg-transparent border-b border-transparent focus:border-blue-500 outline-none"
                    placeholder="Effect..."
                  />
                </td>
                <td className="px-1 py-2">
                  <input 
                    type="number" min="1" max="10"
                    value={row.severity} 
                    onChange={(e) => updateRow(row.id, 'severity', Number(e.target.value))}
                    className="w-full text-center bg-slate-50 rounded border-none focus:ring-1 focus:ring-blue-500"
                  />
                </td>
                <td className="px-1 py-2">
                   <input 
                    type="number" min="1" max="10"
                    value={row.occurrence} 
                    onChange={(e) => updateRow(row.id, 'occurrence', Number(e.target.value))}
                    className="w-full text-center bg-slate-50 rounded border-none focus:ring-1 focus:ring-blue-500"
                  />
                </td>
                <td className="px-1 py-2">
                   <input 
                    type="number" min="1" max="10"
                    value={row.detection} 
                    onChange={(e) => updateRow(row.id, 'detection', Number(e.target.value))}
                    className="w-full text-center bg-slate-50 rounded border-none focus:ring-1 focus:ring-blue-500"
                  />
                </td>
                <td className="px-2 py-2 text-center font-bold text-slate-800">
                  {row.rpn}
                </td>
                <td className="px-2 py-2 text-center">
                  <button onClick={() => deleteRow(row.id)} className="text-slate-400 hover:text-red-500">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 text-xs text-slate-500 border-t pt-2">
        <p>RPN (Risk Priority Number) = Severity × Occurrence × Detection. High RPN items require immediate corrective action.</p>
      </div>
    </div>
  );
};

export default FMEATable;

import React from 'react';
import { ImportedStudentMarks } from './seeImportTypes';

interface SEEPreviewTableProps {
  data: ImportedStudentMarks[];
}

const SEEPreviewTable: React.FC<SEEPreviewTableProps> = ({ data }) => {
  // Defensive check for null/undefined or empty data
  if (!data || !Array.isArray(data) || data.length === 0 || !data[0]) {
    return null;
  }

  // Identify dynamic question columns and reserve standard ones
  const allKeys = Object.keys(data[0] || {});

  // Normalize column mapping (handling variations like 'USN', 'usn', 'Student Name', 'student_name')
  const normalizeKey = (keys: string[], targets: string[]) => {
    return keys.find(k => targets.includes(k.toLowerCase().replace(/[\s_]/g, ''))) || targets[0];
  };

  const usnKey = normalizeKey(allKeys, ['usn', 'pnr', 'regno', 'studentusn']);
  const nameKey = normalizeKey(allKeys, ['studentname', 'name', 'fullname']);
  const totalKey = normalizeKey(allKeys, ['total', 'totalmarks', 'grandtotal']);
  const remarksKey = normalizeKey(allKeys, ['remarks', 'remark', 'error', 'status']);

  const reservedKeys = [usnKey, nameKey, totalKey, remarksKey];
  const questionKeys = allKeys.filter(k => !reservedKeys.includes(k));

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-2 px-1">
        <span className="w-1.5 h-4 bg-emerald-500 rounded-full"></span>
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Imported Student Data Preview</h3>
      </div>
      
      <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 uppercase text-[10px] text-slate-500 font-bold tracking-widest leading-none border-b">
              <tr>
                <th className="px-6 py-4 text-left border-r border-slate-200 w-16">Sl No</th>
                <th className="px-6 py-4 text-left border-r border-slate-200 min-w-[120px]">PNR / USN</th>
                <th className="px-6 py-4 text-left border-r border-slate-200 min-w-[200px]">Student Name</th>
                {questionKeys.map((q) => (
                  <th key={q} className="px-4 py-4 text-center border-r border-slate-200 min-w-[80px]">
                    {q}
                  </th>
                ))}
                <th className="px-6 py-4 text-center border-r border-slate-200 min-w-[100px]">Total</th>
                <th className="px-6 py-4 text-left min-w-[150px]">Remarks</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100 text-slate-600 font-medium">
              {data.map((row, idx) => (
                <tr key={row[usnKey] || idx} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-3.5 border-r border-slate-100 text-slate-400 font-mono text-xs">{idx + 1}</td>
                  <td className="px-6 py-3.5 border-r border-slate-100 font-bold text-slate-700">{row[usnKey]}</td>
                  <td className="px-6 py-3.5 border-r border-slate-100">{row[nameKey]}</td>
                  {questionKeys.map((q) => (
                    <td key={q} className="px-4 py-3.5 text-center border-r border-slate-100 font-bold text-slate-800">
                      {row[q] !== null && row[q] !== undefined ? row[q] : '-'}
                    </td>
                  ))}
                  <td className="px-6 py-3.5 text-center border-r border-slate-100 font-bold text-[#4a8494]">
                    {row[totalKey] ?? '-'}
                  </td>
                  <td className={`px-6 py-3.5 text-xs ${row[remarksKey] ? 'text-red-500 font-semibold italic' : 'text-slate-400'}`}>
                    {row[remarksKey] || 'No remarks'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SEEPreviewTable;

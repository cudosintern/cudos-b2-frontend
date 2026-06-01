import React, { useState } from 'react';
import { FaTimes, FaPlus, FaSave, FaExclamationCircle, FaLink } from 'react-icons/fa';

interface Props {
    onClose: () => void;
    onSave: (mappings: any) => void;
    questions: any[];
    initialMappings: any[];
}

const CiaOrMappingModal: React.FC<Props> = ({ onClose, onSave, questions, initialMappings }) => {
    const [mappings, setMappings] = useState<any[]>(initialMappings.length > 0 ? initialMappings : [{ q1: '', q2: '' }]);

    const addRow = () => setMappings([...mappings, { q1: '', q2: '' }]);
    const removeRow = (idx: number) => setMappings(mappings.filter((_, i) => i !== idx));
    const updateMapping = (idx: number, field: string, value: string) => {
        const newMappings = [...mappings];
        newMappings[idx][field] = value;
        setMappings(newMappings);
    };

    const mandatoryQuestions = questions.filter(q => q.is_mandatory).map(q => q.qp_mq_code).join(', ') || '--';

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-6 md:p-8">
            <div className="bg-white rounded shadow-2xl w-full max-w-7xl max-h-[92vh] flex flex-col overflow-hidden animate-scale-in border border-slate-200">
                {/* Header */}
                <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-white">
                    <h2 className="text-lg font-bold text-[#4a8494] flex items-center gap-3 uppercase tracking-tight">
                         OR Questions Mapping
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-red-500 transition-colors p-2">
                        <FaTimes size={18} />
                    </button>
                </div>

                <div className="flex-grow overflow-y-auto p-10 space-y-8">
                    {/* Note Box */}
                    <div className="bg-[#fffbeb] border border-amber-200/50 rounded p-5">
                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-white/50 text-amber-600 rounded border border-amber-100"><FaExclamationCircle size={14} /></div>
                            <div className="space-y-1">
                                <h4 className="text-[10px] font-black text-amber-900 uppercase">Note: Mandatory questions are not allowed to be mapped with OR option.</h4>
                                <p className="text-[10px] text-amber-700 font-medium">Mandatory questions are: <span className="font-bold underline decoration-amber-200 underline-offset-4">{mandatoryQuestions}</span></p>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button className="px-5 py-2 bg-[#4a8494] hover:bg-[#3d6d7a] text-white rounded text-[10px] font-bold uppercase tracking-widest shadow-sm transition-all flex items-center gap-2" onClick={addRow}>
                            <FaPlus size={10} /> Add more rows
                        </button>
                    </div>

                    <div className="border border-slate-200 rounded overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center w-[44%] border-r border-slate-200">Question Set - I</th>
                                    <th className="p-4 text-[10px] font-bold text-blue-400 uppercase tracking-widest text-center w-[12%] border-r border-slate-200 italic">OR</th>
                                    <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center w-[44%] border-r border-slate-200">Question Set - II</th>
                                    <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center w-24">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {mappings.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-0">
                                        <td className="p-5 border-r border-slate-100">
                                            <select 
                                                className="w-full border-slate-200 focus:border-[#4a8494] py-2 px-3 text-[11px] font-bold bg-white rounded shadow-sm outline-none transition-all cursor-pointer"
                                                value={row.q1}
                                                onChange={(e) => updateMapping(idx, 'q1', e.target.value)}
                                            >
                                                <option value="">Select Question</option>
                                                {questions.filter(q => !q.is_mandatory).map((q, qidx) => (
                                                    <option key={qidx} value={q.qp_mq_code}>
                                                        {q.qp_mq_code} ({parseFloat(q.qp_subq_marks).toFixed(2)} | {q.mappings[0]?.actual_mapped_id || 'N/A'})
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="p-4 text-center border-r border-slate-100">
                                            <span className="text-[10px] font-bold text-slate-300 uppercase bg-slate-50/50 px-2 py-0.5 rounded border border-slate-100 italic">OR</span>
                                        </td>
                                        <td className="p-5 border-r border-slate-100">
                                            <select 
                                                className="w-full border-slate-200 focus:border-[#4a8494] py-2 px-3 text-[11px] font-bold bg-white rounded shadow-sm outline-none transition-all cursor-pointer"
                                                value={row.q2}
                                                onChange={(e) => updateMapping(idx, 'q2', e.target.value)}
                                            >
                                                <option value="">Select Question</option>
                                                {questions.filter(q => !q.is_mandatory).map((q, qidx) => (
                                                    <option key={qidx} value={q.qp_mq_code}>
                                                        {q.qp_mq_code} ({parseFloat(q.qp_subq_marks).toFixed(2)} | {q.mappings[0]?.actual_mapped_id || 'N/A'})
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="p-4 text-center">
                                            <button onClick={() => removeRow(idx)} className="p-2 text-red-600 hover:bg-red-50 rounded transition-all">
                                                <FaTimes size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                 {mappings.length === 0 && (
                                    <tr><td colSpan={4} className="py-24 text-center text-slate-300 italic uppercase text-[10px] tracking-widest font-bold">No OR mappings defined yet</td></tr>
                                 )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-10 py-6 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-3 shadow-[0_-1px_3px_rgba(0,0,0,0.02)]">
                    <button 
                        onClick={onClose} 
                        className="px-6 py-2 bg-[#ef4444] hover:bg-red-600 text-white font-medium rounded transition-all shadow-sm active:scale-95 text-sm"
                    >
                        Close
                    </button>
                    <button onClick={() => onSave(mappings)} className="px-8 py-2 bg-[#4a8494] hover:bg-[#3d6d7a] text-white font-medium rounded transition-all shadow-sm active:scale-95 text-sm flex items-center gap-2">
                        <FaSave /> Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CiaOrMappingModal;

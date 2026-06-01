import React, { useState } from 'react';
import { FaTimes, FaQuestionCircle, FaArrowAltCircleDown, FaSearch, FaSave } from 'react-icons/fa';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onImport: (questions: any[]) => void;
}

const CiaQuestionImportModal: React.FC<Props> = ({ isOpen, onClose, onImport }) => {
    const [importType, setImportType] = useState('assignment'); // review, assignment, bank
    const [searchQuery, setSearchQuery] = useState('');
    const [pageSize, setPageSize] = useState(20);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[10000] flex items-center justify-center p-6 md:p-8">
            <div className="bg-white rounded shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden animate-scale-in border border-slate-200">
                
                {/* Header - EXACT match with Add Question Modal */}
                <div className="bg-white px-8 py-5 border-b border-slate-100 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-[#4a8494] flex items-center gap-3 uppercase tracking-tight">
                        Review / Assignment Questions
                    </h2>
                    <div className="flex items-center gap-4">
                        <a href="#" className="flex items-center gap-1.5 text-blue-400 text-[10px] font-bold uppercase hover:underline">
                            Help / Instructions <FaQuestionCircle size={14} />
                        </a>
                        <button onClick={onClose} className="text-slate-400 hover:text-red-500 transition-colors p-2 ml-4">
                            <FaTimes size={18} />
                        </button>
                    </div>
                </div>

                <div className="flex-grow overflow-y-auto p-8 space-y-8 bg-white text-slate-700">
                    {/* Top Selection Area - Matched style */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center pb-8 border-b border-slate-50">
                        <label className="text-[11px] font-black text-slate-700 uppercase tracking-tight">Search Category :</label>
                        <div className="md:col-span-3 flex gap-12">
                            {[
                                { id: 'review', label: 'Review Questions' },
                                { id: 'assignment', label: 'Assignment Questions' },
                                { id: 'bank', label: 'Question Bank' }
                            ].map((type) => (
                                <label key={type.id} className="flex items-center gap-3 cursor-pointer group">
                                    <input 
                                        type="radio" 
                                        name="importType" 
                                        className="w-4.5 h-4.5 text-[#4a8494] focus:ring-[#4a8494]/20 border-slate-300 accent-[#4a8494]"
                                        checked={importType === type.id}
                                        onChange={() => setImportType(type.id)}
                                    />
                                    <span className={`text-[11px] font-bold uppercase transition-colors tracking-tight ${importType === type.id ? 'text-[#4a8494]' : 'text-slate-500 group-hover:text-slate-900'}`}>
                                        {type.label}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Question List Content */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 border-l-4 border-[#4a8494] pl-3 py-1">
                            <h3 className="text-[12px] font-black text-slate-800 uppercase tracking-tighter">Question List</h3>
                        </div>

                        <div className="flex justify-between items-center text-[11px]">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-400">SHOW</span>
                                <select 
                                    className="border-slate-200 rounded px-2 py-1.5 outline-none text-slate-700 bg-slate-50 font-bold h-8 focus:ring-1 focus:ring-blue-400/20"
                                    value={pageSize}
                                    onChange={(e) => setPageSize(Number(e.target.value))}
                                >
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                </select>
                                <span className="font-bold text-slate-400">ENTRIES</span>
                            </div>

                            <div className="flex items-center gap-3">
                                <span className="font-bold text-slate-400">SEARCH:</span>
                                <input 
                                    type="text" 
                                    className="border border-slate-200 rounded px-3 py-1.5 outline-none w-72 focus:ring-1 focus:ring-[#4a8494]/20 focus:border-[#4a8494] transition-all text-slate-700 text-[11px] font-medium placeholder:text-slate-300 shadow-sm"
                                    value={searchQuery}
                                    placeholder="Filter by question text..."
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Question Table - Aligned with main table styles */}
                        <div className="border border-slate-200 rounded overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.03)]">
                            <table className="w-full text-left text-[11px] border-collapse bg-white">
                                <thead>
                                    <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                                        <th className="px-6 py-4 font-black uppercase tracking-widest w-64 border-r border-slate-200">
                                            Select Question <span className="text-[9px] opacity-40 ml-1">▼</span>
                                        </th>
                                        <th className="px-6 py-4 font-black uppercase tracking-widest">
                                            Question Description
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td colSpan={2} className="px-6 py-24 text-center text-slate-300 font-bold bg-white italic text-[13px] tracking-wide">
                                            No data available in table
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Area */}
                        <div className="flex justify-between items-center text-[10px] text-slate-400 font-black uppercase tracking-widest pt-4">
                            <p>Showing 0 to 0 of 0 entries</p>
                            <div className="flex gap-2">
                                <button className="px-5 py-2 hover:bg-slate-50 text-slate-400 rounded-sm transition-colors bg-white font-bold border border-slate-200 disabled:opacity-30 disabled:cursor-not-allowed">Previous</button>
                                <button className="px-5 py-2 hover:bg-slate-50 text-slate-400 rounded-sm transition-colors bg-white font-bold border border-slate-200 disabled:opacity-30 disabled:cursor-not-allowed">Next</button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer - EXACT match with Add Question Modal Buttons */}
                <div className="bg-slate-50/80 px-8 py-5 flex justify-end gap-3 border-t border-slate-100">
                    <button 
                        className="bg-[#007bff] hover:bg-[#0069d9] text-white px-8 py-2.5 rounded text-[11px] font-bold uppercase tracking-widest flex items-center gap-2.5 transition-all shadow-md active:scale-95"
                    >
                        <FaSave /> Import Selected
                    </button>
                    <button 
                        onClick={onClose}
                        className="bg-[#d9534f] hover:bg-[#c9302c] text-white px-8 py-2.5 rounded text-[11px] font-bold uppercase tracking-widest flex items-center gap-2.5 transition-all shadow-md active:scale-95"
                    >
                        <FaTimes /> Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CiaQuestionImportModal;

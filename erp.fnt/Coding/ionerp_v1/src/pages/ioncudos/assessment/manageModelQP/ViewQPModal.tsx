import React, { useMemo } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { FaTimes } from "react-icons/fa";
import { ModelQPApi, UnitApi, QuestionGroupApi, QuestionApi } from "./types";
import { HHMMToHours } from "./utils/qpMappers";

interface ViewQPModalProps {
    qp: ModelQPApi;
    onClose: () => void;
}

const COLORS = ["#00C49F", "#0088FE", "#FFBB28", "#FF8042", "#8884D8", "#82ca9d", "#ffc658"];

const ViewQPModal: React.FC<ViewQPModalProps> = ({ qp, onClose }) => {
    // Helper: H:M format
    const formatDuration = (hours: number) => {
        const h = Math.floor(hours);
        const m = Math.round((hours - h) * 60);
        return `${h}:${m.toString().padStart(2, "0")}`;
    };

    const durationHours = useMemo(() => HHMMToHours(qp.total_duration), [qp.total_duration]);

    // Distribution Calculations
    const { coDistribution, bloomsDistribution, totalCoMarks, totalBloomMarks } = useMemo(() => {
        const coMap: Record<string, number> = {};
        const bloomMap: Record<string, number> = {};

        const units = qp.units || qp.sections || [];
        units.forEach((unit: UnitApi) => {
            (unit.questions || []).forEach((group: QuestionGroupApi) => {
                (group.questions || []).forEach((q: QuestionApi) => {
                    const coKey = q.co_id ? `CO${q.co_id}` : "Unmapped";
                    const bloomKey = q.bloom_level || "Unknown";
                    
                    coMap[coKey] = (coMap[coKey] || 0) + (q.marks || 0);
                    bloomMap[bloomKey] = (bloomMap[bloomKey] || 0) + (q.marks || 0);
                });
            });
        });

        const totalCo = Object.values(coMap).reduce((a: number, b: number) => a + b, 0);
        const totalBloom = Object.values(bloomMap).reduce((a: number, b: number) => a + b, 0);

        // Dynamically build lists from captured maps
        const coList = Object.entries(coMap)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

        const bloomList = Object.entries(bloomMap)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

        return { 
            coDistribution: coList, 
            bloomsDistribution: bloomList,
            totalCoMarks: totalCo,
            totalBloomMarks: totalBloom
        };
    }, [qp]);

    return (
        <Transition show={true} as={React.Fragment}>
            <Dialog as="div" className="fixed inset-0 z-[120] overflow-y-auto" onClose={onClose}>
                <div className="min-h-screen px-4 text-center font-sans backdrop-blur-sm bg-black/40">
                    <Transition.Child
                        as={React.Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black/40 transition-opacity" />
                    </Transition.Child>

                    <span className="inline-block h-screen align-middle" aria-hidden="true">&#8203;</span>

                    <Transition.Child
                        as={React.Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0 scale-95"
                        enterTo="opacity-100 scale-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100 scale-100"
                        leaveTo="opacity-0 scale-95"
                    >
                        <div className="inline-block w-full max-w-6xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white rounded-xl shadow-2xl relative border border-gray-100">
                            
                            {/* Premium Header */}
                            <div className="px-6 py-4 flex justify-between items-center text-gray-800">
                                <span className="text-lg font-bold tracking-wide flex items-center gap-2">
                                    <div className="w-1 h-5 bg-gray-400 rounded-full"></div>
                                    MODEL QUESTION PAPER REPORT
                                </span>
                                <button onClick={onClose} className="text-gray-500 hover:text-gray-800 transition-colors p-1 hover:bg-gray-100 rounded-full">
                                    <FaTimes size={24} />
                                </button>
                            </div>

                            {/* Content Area */}
                            <div className="p-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
                                
                                <div className="bg-[#f0f9ff] border border-[#bae6fd] rounded-lg p-6 mb-8 shadow-sm">
                                    <h4 className="text-xl font-bold text-[#0c4a6e] mb-4 uppercase text-center border-b border-[#bae6fd] pb-3">
                                        {qp.title}
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm font-semibold text-[#0369a1]">
                                        <div className="bg-white/60 p-3 rounded-md border border-white flex flex-col items-center">
                                            <span className="text-[10px] uppercase text-[#7dd3fc]">Total Duration (H:M)</span>
                                            <span className="text-lg">{formatDuration(durationHours)}</span>
                                        </div>
                                        <div className="bg-white/60 p-3 rounded-md border border-white flex flex-col items-center">
                                            <span className="text-[10px] uppercase text-[#7dd3fc]">Maximum Marks</span>
                                            <span className="text-lg">{(qp.max_marks || 0).toFixed(2)}</span>
                                        </div>
                                        <div className="bg-white/60 p-3 rounded-md border border-white flex flex-col items-center">
                                            <span className="text-[10px] uppercase text-[#7dd3fc]">Course Target Marks</span>
                                            <span className="text-lg">{(qp.grand_total || 0).toFixed(2)}</span>
                                        </div>
                                    </div>
                                    <p className="mt-4 text-xs italic text-blue-600/70 text-center font-medium">
                                        <strong>Note:</strong> {qp.note || "Please follow the instructions on the question paper."}
                                    </p>
                                </div>

                                <div className="mb-12">
                                    <div className="mb-3 flex items-center gap-2">
                                        <div className="h-4 w-1 bg-[#4a8494] rounded-full"></div>
                                        <h5 className="text-sm font-bold text-gray-700 uppercase tracking-widest">Question Matrix</h5>
                                    </div>
                                    <div className="overflow-hidden border border-gray-200 rounded-lg shadow-sm">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-[#f8fafc]">
                                                <tr>
                                                    <th className="px-4 py-3 text-center text-[10px] font-bold text-gray-500 uppercase tracking-wider border-r border-gray-100 w-20">Q. No.</th>
                                                    <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider border-r border-gray-100">Question Detail</th>
                                                    <th className="px-3 py-3 text-center text-[10px] font-bold text-gray-500 uppercase tracking-wider border-r border-gray-100 w-20">COs</th>
                                                    <th className="px-3 py-3 text-center text-[10px] font-bold text-gray-500 uppercase tracking-wider border-r border-gray-100 w-20">Level</th>
                                                    <th className="px-4 py-3 text-center text-[10px] font-bold text-gray-500 uppercase tracking-wider border-r border-gray-100 w-24">PI Code</th>
                                                    <th className="px-4 py-3 text-center text-[10px] font-bold text-gray-500 uppercase tracking-wider w-24">Marks</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {(qp.units || qp.sections || []).map((section: UnitApi, sIdx: number) => (
                                                    <React.Fragment key={section.qp_unitd_id || section.id || sIdx}>
                                                        <tr className="bg-gray-50">
                                                            <td className="px-4 py-2 border-r border-gray-100"></td>
                                                            <td className="px-6 py-2 border-r border-gray-100 font-bold text-[#4a8494] text-xs uppercase underline">
                                                                {section.unit_name || section.module_name || section.section_name || `Section ${sIdx + 1}`}
                                                            </td>
                                                            <td colSpan={3} className="px-4 py-2 border-r border-gray-100 text-right text-[10px] text-gray-400 font-medium italic">
                                                                Section Points Allocation
                                                            </td>
                                                            <td className="px-4 py-2 text-center text-xs font-bold text-[#4a8494]">
                                                                {(section.max_marks || 0).toFixed(2)}
                                                            </td>
                                                        </tr>
                                                        {(section.questions || []).map((group: QuestionGroupApi, gIdx: number) => (
                                                            <React.Fragment key={gIdx}>
                                                                {(group.questions || []).map((q: QuestionApi, qIdx: number) => (
                                                                    <tr key={qIdx} className="hover:bg-blue-50/30 transition-colors">
                                                                        <td className="px-4 py-3 border-r border-gray-100 text-center font-bold text-gray-500 text-xs">
                                                                            {gIdx + 1}{String.fromCharCode(97 + qIdx)}
                                                                        </td>
                                                                        <td className="px-6 py-3 border-r border-gray-100 text-sm text-gray-700 leading-relaxed text-left">
                                                                            {q.question_text || "—"}
                                                                        </td>
                                                                        <td className="px-3 py-3 border-r border-gray-100 text-center">
                                                                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-bold">
                                                                                {q.co_id ? `CO${q.co_id}` : "—"}
                                                                            </span>
                                                                        </td>
                                                                        <td className="px-3 py-3 border-r border-gray-100 text-center">
                                                                            <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-[10px] font-bold">
                                                                                {q.bloom_level || "—"}
                                                                            </span>
                                                                        </td>
                                                                        <td className="px-4 py-3 border-r border-gray-100 text-center text-[10px] font-medium text-gray-500">
                                                                            {q.pi_code || "—"}
                                                                        </td>
                                                                        <td className="px-4 py-3 text-center text-sm font-bold text-gray-800">
                                                                            {(q.marks || 0).toFixed(2)}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                                {gIdx < (section.questions?.length || 0) - 1 && (
                                                                    <tr className="bg-slate-50/50">
                                                                        <td colSpan={6} className="px-4 py-1 text-center text-[9px] font-black text-gray-300 uppercase tracking-[0.3em]">
                                                                            ( or )
                                                                        </td>
                                                                    </tr>
                                                                )}
                                                            </React.Fragment>
                                                        ))}
                                                    </React.Fragment>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="space-y-10">
                                    <div className="bg-white border-[1px] border-gray-200 rounded-sm p-0 overflow-hidden shadow-sm">
                                        <div className="bg-[#f8fafc] px-4 py-2 border-b border-gray-200">
                                            <h6 className="text-[11px] font-bold text-[#334155] uppercase underline">Course Outcome Marks Distribution</h6>
                                        </div>
                                        <div className="p-6 flex flex-col md:flex-row gap-8 items-start">
                                            <div className="w-full md:w-2/5 flex flex-col items-center">
                                                <div className="w-full h-[220px] border-[1px] border-gray-100 p-2 flex items-center justify-center">
                                                    {totalCoMarks > 0 ? (
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <PieChart>
                                                                <Pie 
                                                                    data={coDistribution.filter(d => d.value > 0)} 
                                                                    dataKey="value" 
                                                                    nameKey="name" 
                                                                    cx="50%" 
                                                                    cy="50%" 
                                                                    outerRadius={80} 
                                                                    stroke="none"
                                                                >
                                                                    {coDistribution.filter(d => d.value > 0).map((_entry, index) => (
                                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                                    ))}
                                                                </Pie>
                                                                <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '4px', border: '1px solid #e2e8f0' }} />
                                                                <Legend iconType="circle" align="left" verticalAlign="middle" layout="vertical" wrapperStyle={{ fontSize: '11px', paddingLeft: '10px' }} />
                                                            </PieChart>
                                                        </ResponsiveContainer>
                                                    ) : (
                                                        <span className="text-gray-300 text-xs italic">No data mapped</span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="w-full md:w-3/5">
                                                <table className="w-full text-[11px] border-collapse border border-gray-200">
                                                    <thead className="bg-[#f8fafc] text-gray-600 uppercase font-bold border-b border-gray-200 text-left">
                                                        <tr>
                                                            <th className="p-2 border-r border-gray-200 font-sans tracking-tight">COS Level</th>
                                                            <th className="p-2 border-r border-gray-200 text-center font-sans tracking-tight">Marks (X)</th>
                                                            <th className="p-2 text-center font-sans tracking-tight">% Distribution</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100">
                                                        {coDistribution.map((co, i) => (
                                                            <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                                                                <td className="p-2 border-r border-gray-200 text-gray-700 font-medium">{co.name}</td>
                                                                <td className="p-2 border-r border-gray-200 text-center text-gray-600">{co.value.toFixed(2)}</td>
                                                                <td className="p-2 text-center text-gray-600">
                                                                    {totalCoMarks > 0 ? ((co.value / totalCoMarks) * 100).toFixed(2) : "0.00"}%
                                                                </td>
                                                            </tr>
                                                        ))}
                                                        <tr className="bg-[#f1f5f9] font-bold text-[#1e293b] border-t border-gray-300">
                                                            <td className="p-2 border-r border-gray-200 uppercase tracking-tight text-[10px]">Total (Y)</td>
                                                            <td className="p-2 border-r border-gray-200 text-center">{totalCoMarks.toFixed(2)}</td>
                                                            <td className="p-2 text-center text-blue-700 underline underline-offset-4 decoration-blue-300">
                                                                {totalCoMarks > 0 ? "100.00" : "0.00"}%
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                        <div className="px-6 py-3 bg-gray-50/30 border-t border-gray-100">
                                            <p className="text-[9px] text-gray-500 italic leading-snug">
                                                <strong>Note:</strong> The above pie chart depicts the individual Course Outcome marks percentage distribution as in the question paper. X = Individual Course Outcome marks, Y = Sum of all Course Outcome marks, % = (X/Y)*100
                                            </p>
                                        </div>
                                    </div>

                                    <div className="bg-white border-[1px] border-gray-200 rounded-sm p-0 overflow-hidden shadow-sm">
                                        <div className="bg-[#f8fafc] px-4 py-2 border-b border-gray-200">
                                            <h6 className="text-[11px] font-bold text-[#334155] uppercase underline">Bloom's Level Marks Distribution</h6>
                                        </div>
                                        <div className="p-6 flex flex-col md:flex-row gap-8 items-start">
                                            <div className="w-full md:w-2/5 flex flex-col items-center">
                                                <div className="w-full h-[220px] border-[1px] border-gray-100 p-2 flex items-center justify-center">
                                                    {totalBloomMarks > 0 ? (
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <PieChart>
                                                                <Pie 
                                                                    data={bloomsDistribution.filter(d => d.value > 0)} 
                                                                    dataKey="value" 
                                                                    nameKey="name" 
                                                                    cx="50%" 
                                                                    cy="50%" 
                                                                    outerRadius={80} 
                                                                    stroke="none"
                                                                >
                                                                    {bloomsDistribution.filter(d => d.value > 0).map((_entry, index) => (
                                                                        <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                                                                    ))}
                                                                </Pie>
                                                                <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '4px', border: '1px solid #e2e8f0' }} />
                                                                <Legend iconType="circle" align="left" verticalAlign="middle" layout="vertical" wrapperStyle={{ fontSize: '11px', paddingLeft: '10px' }} />
                                                            </PieChart>
                                                        </ResponsiveContainer>
                                                    ) : (
                                                        <span className="text-gray-300 text-xs italic">No data mapped</span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="w-full md:w-3/5">
                                                <table className="w-full text-[11px] border-collapse border border-gray-200">
                                                    <thead className="bg-[#f8fafc] text-gray-600 uppercase font-bold border-b border-gray-200 text-left">
                                                        <tr>
                                                            <th className="p-2 border-r border-gray-200 font-sans tracking-tight">Level</th>
                                                            <th className="p-2 border-r border-gray-200 text-center font-sans tracking-tight">Marks (X)</th>
                                                            <th className="p-2 text-center font-sans tracking-tight">% Distribution</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100">
                                                        {bloomsDistribution.map((b, i) => (
                                                            <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                                                                <td className="p-2 border-r border-gray-200 text-gray-700 font-medium">{b.name}</td>
                                                                <td className="p-2 border-r border-gray-200 text-center text-gray-600">{b.value.toFixed(2)}</td>
                                                                <td className="p-2 text-center text-gray-600">
                                                                    {totalBloomMarks > 0 ? ((b.value / totalBloomMarks) * 100).toFixed(2) : "0.00"}%
                                                                </td>
                                                            </tr>
                                                        ))}
                                                        <tr className="bg-[#f1f5f9] font-bold text-[#1e293b] border-t border-gray-300">
                                                            <td className="p-2 border-r border-gray-200 uppercase tracking-tight text-[10px]">Total (Y)</td>
                                                            <td className="p-2 border-r border-gray-200 text-center">{totalBloomMarks.toFixed(2)}</td>
                                                            <td className="p-2 text-center text-blue-700 underline underline-offset-4 decoration-blue-300">
                                                                {totalBloomMarks > 0 ? "100.00" : "0.00"}%
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                        <div className="px-6 py-3 bg-gray-50/30 border-t border-gray-100">
                                            <p className="text-[9px] text-gray-500 italic leading-snug">
                                                <strong>Note:</strong> The above pie chart depicts the individual Bloom's Level marks percentage distribution as in the question paper. X = Individual Bloom's Level marks, Y = Sum of all Bloom's Level marks, % = (X/Y)*100
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="px-8 py-4 border-t border-gray-100 flex justify-end bg-gray-50/50">
                                <button 
                                    onClick={onClose} 
                                    className="px-8 py-2.5 bg-[#df2c2c] hover:bg-red-700 text-white rounded-md text-xs font-bold uppercase tracking-widest shadow-lg transition-all active:scale-95 flex items-center gap-2"
                                >
                                    <FaTimes size={14} /> Close Report
                                </button>
                            </div>
                        </div>
                    </Transition.Child>
                </div>
            </Dialog>
        </Transition>
    );
};

export default ViewQPModal;

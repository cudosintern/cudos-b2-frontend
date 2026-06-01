import React, { useMemo } from 'react';
import { FaTimes, FaQuestionCircle, FaChartPie } from 'react-icons/fa';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './CiaQp.css';
import '../cia/cia.css';

interface Props {
    qpData: any;
    selectedAo: any;
    onClose: () => void;
}

interface DistributionItem {
    name: string;
    value: number;
}

const CHART_COLORS = ['#4eb6c1', '#f0a53d', '#a9b388', '#5e967a', '#859c5d', '#d9534f', '#5bc0de'];

const CiaViewQpModal: React.FC<Props> = ({ qpData, selectedAo, onClose }) => {
    const distributionData = useMemo<{
        bloom: DistributionItem[];
        co: DistributionItem[];
        total: number;
    }>(() => {
        if (!qpData || !qpData.units) return { bloom: [], co: [], total: 0 };
        const bloomMap: Record<string, number> = {};
        const coMap: Record<string, number> = {};
        let total = 0;

        qpData.units.forEach((u: any) => {
            const questions = u.questions || u.main_questions || [];
            questions.forEach((q: any) => {
                const marks = Number(q.marks || q.qp_subq_marks || 0);
                total += marks;
                const b = q.bloom_level || q.level || 'N/A';
                bloomMap[b] = (bloomMap[b] || 0) + marks;
                const c = q.co_code || q.course_outcome || 'N/A';
                coMap[c] = (coMap[c] || 0) + marks;
            });
        });

        return {
            bloom: Object.entries(bloomMap).map(([name, value]) => ({ name, value })),
            co: Object.entries(coMap).map(([name, value]) => ({ name, value })),
            total
        };
    }, [qpData]);

    if (!qpData || !qpData.units || qpData.units.length === 0) {
        return (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-6">
                <div className="bg-white rounded-[1.5rem] shadow-2xl w-full max-w-lg p-10 flex flex-col items-center animate-scale-in border border-white">
                    <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-6">
                        <FaQuestionCircle size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2 uppercase tracking-tighter">no qp to display</h3>
                    <p className="text-slate-500 text-center mb-8">This assessment occasion does not have a configured question paper yet.</p>
                    <button className="px-10 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl transition-all shadow-md active:scale-95 uppercase text-xs tracking-widest" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 md:p-10">
            <div className="bg-white rounded-[0.5rem] shadow-2xl w-full max-w-[95vw] max-h-[92vh] flex flex-col overflow-hidden animate-scale-in border border-slate-700">
                {/* Header - Standardized White/Teal Style */}
                <div className="px-10 py-6 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
                    <h2 className="text-xl font-bold text-[#4a8494] flex items-center gap-3">
                        CIA Question Paper View
                    </h2>
                    <div className="flex items-center gap-4 text-slate-400">
                        <FaQuestionCircle size={20} className="hover:text-blue-500 cursor-pointer transition-colors" />
                        <button className="hover:text-red-500 transition-colors" onClick={onClose}>
                            <FaTimes size={20} />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-10 bg-white">
                    <div className="max-w-[1400px] mx-auto space-y-12">
                        {/* Summary Section */}
                        <div className="p-8 bg-slate-50 border border-slate-100 rounded-2xl shadow-sm">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-y-8 gap-x-12">
                                <div className="col-span-1 md:col-span-2 flex flex-col gap-1">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Question Paper Title</span>
                                    <span className="text-lg font-bold text-slate-700">{qpData.qp_name || qpData.qpd_title}</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Duration (H:M)</span>
                                    <span className="text-lg font-bold text-slate-700">{qpData.qpd_timing}</span>
                                </div>
                                <div className="flex flex-col gap-1 lg:items-end">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Maximum Marks</span>
                                    <span className="text-3xl font-black text-[#4a8494]">{Number(selectedAo?.max_marks || qpData.max_marks).toFixed(2)}</span>
                                </div>
                                
                                <div className="col-span-1 md:col-span-2 flex flex-col gap-1">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Course Details</span>
                                    <span className="text-sm font-bold text-slate-600">{selectedAo?.crs_title} ({selectedAo?.crs_code})</span>
                                </div>
                                <div className="col-span-1 md:col-span-2 flex flex-col gap-1 lg:items-end">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Special Note</span>
                                    <span className="text-xs italic font-medium text-slate-500">{qpData.qpd_instructions || 'Answer all questions.'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Question Table */}
                        <div className="space-y-6">
                            <h4 className="text-xs font-bold text-[#4a8494] uppercase tracking-widest border-b border-slate-100 pb-4 italic">
                                Question Paper Structure
                            </h4>
                            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                                <table className="w-full text-sm border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/50 border-b border-slate-200">
                                            <th className="px-6 py-4 text-center text-slate-500 font-bold w-24">Q.No</th>
                                            <th className="px-6 py-4 text-left text-slate-500 font-bold">Question Description</th>
                                            <th className="px-6 py-4 text-center text-slate-500 font-bold w-24">COs</th>
                                            <th className="px-6 py-4 text-center text-slate-500 font-bold w-24">Level</th>
                                            <th className="px-6 py-4 text-center text-slate-500 font-bold w-32">PI Code</th>
                                            <th className="px-6 py-4 text-right text-slate-500 font-bold w-24">Marks</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {qpData.units?.map((unit: any, uIdx: number) => (
                                            <React.Fragment key={uIdx}>
                                                <tr className="bg-slate-50/30 border-b border-slate-100">
                                                    <td colSpan={6} className="px-6 py-3 font-bold text-blue-600 uppercase tracking-widest text-[10px]">
                                                        {unit.unit_name || unit.qp_unit_code}
                                                    </td>
                                                </tr>
                                                {(unit.questions || unit.main_questions)?.map((q: any, qIdx: number) => (
                                                    <tr key={qIdx} className="border-b border-slate-50 last:border-b-0 hover:bg-slate-50/50 transition-colors">
                                                        <td className="px-6 py-5 text-center text-slate-400 font-bold">{q.question_no || q.qp_mq_code}</td>
                                                        <td className="px-6 py-5">
                                                            <div className="text-slate-600 leading-relaxed font-medium" dangerouslySetInnerHTML={{ __html: q.question_text || q.qp_content || '' }} />
                                                        </td>
                                                        <td className="px-6 py-5 text-center font-bold text-[#4a8494]">{q.co_code || q.course_outcome || '-'}</td>
                                                        <td className="px-6 py-5 text-center font-bold text-slate-400">{q.bloom_level || q.level || '-'}</td>
                                                        <td className="px-6 py-5 text-center font-medium text-slate-400">{q.pi_code || q.mappings?.[0]?.pi_code || '-'}</td>
                                                        <td className="px-6 py-5 text-right font-bold text-slate-700">{Number(q.marks || q.qp_subq_marks).toFixed(2)}</td>
                                                    </tr>
                                                ))}
                                            </React.Fragment>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-slate-50 border-t border-slate-200">
                                            <td colSpan={5} className="px-10 py-5 text-right font-bold text-[10px] uppercase tracking-widest text-slate-500">Total Question Paper Marks</td>
                                            <td className="px-6 py-5 text-right font-black text-xl text-[#4a8494]">{distributionData.total.toFixed(2)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>

                        {/* Distributions Section */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                            {/* Bloom's Distribution */}
                            <div className="space-y-6">
                                <h4 className="text-xs font-bold text-[#4a8494] uppercase tracking-widest border-b border-slate-100 pb-4 italic">
                                    Bloom's Level Weightage
                                </h4>
                                <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm flex flex-col items-center">
                                    <div className="w-full h-[280px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie data={distributionData.bloom} dataKey="value" cx="50%" cy="50%" innerRadius={0} outerRadius={100}>
                                                    {distributionData.bloom.map((_: any, idx: number) => <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />)}
                                                </Pie>
                                                <Tooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="w-full mt-8 border border-slate-100 rounded-2xl overflow-hidden">
                                        <table className="w-full text-[11px]">
                                            <thead className="bg-slate-50 border-b border-slate-100 text-slate-400">
                                                <tr>
                                                    <th className="px-5 py-3 text-left font-bold uppercase">Level</th>
                                                    <th className="px-5 py-3 text-center font-bold uppercase">Marks (X)</th>
                                                    <th className="px-5 py-3 text-right font-bold uppercase">% Weight</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {distributionData.bloom.map((item, idx) => (
                                                    <tr key={idx}>
                                                        <td className="px-5 py-3 font-bold text-slate-700">{item.name}</td>
                                                        <td className="px-5 py-3 text-center font-bold text-slate-500">{item.value.toFixed(2)}</td>
                                                        <td className="px-5 py-3 text-right font-black text-blue-600">{((item.value / distributionData.total) * 100).toFixed(2)}%</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* CO Distribution */}
                            <div className="space-y-6">
                                <h4 className="text-xs font-bold text-[#4a8494] uppercase tracking-widest border-b border-slate-100 pb-4 italic">
                                    CO Outcome Weightage
                                </h4>
                                <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm flex flex-col items-center">
                                    <div className="w-full h-[280px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie data={distributionData.co} dataKey="value" cx="50%" cy="50%" innerRadius={0} outerRadius={100}>
                                                    {distributionData.co.map((_: any, idx: number) => <Cell key={idx} fill={CHART_COLORS[(idx + 2) % CHART_COLORS.length]} />)}
                                                </Pie>
                                                <Tooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="w-full mt-8 border border-slate-100 rounded-2xl overflow-hidden">
                                        <table className="w-full text-[11px]">
                                            <thead className="bg-slate-50 border-b border-slate-100 text-slate-400">
                                                <tr>
                                                    <th className="px-5 py-3 text-left font-bold uppercase">CO</th>
                                                    <th className="px-5 py-3 text-center font-bold uppercase">Marks (X)</th>
                                                    <th className="px-5 py-3 text-right font-bold uppercase">% Weight</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {distributionData.co.map((item, idx) => (
                                                    <tr key={idx}>
                                                        <td className="px-5 py-3 font-bold text-slate-700">{item.name}</td>
                                                        <td className="px-5 py-3 text-center font-bold text-slate-500">{item.value.toFixed(2)}</td>
                                                        <td className="px-5 py-3 text-right font-black text-emerald-600">{((item.value / distributionData.total) * 100).toFixed(2)}%</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-10 py-6 bg-slate-50/50 border-t border-slate-100 flex justify-end shrink-0">
                    <button 
                        className="px-6 py-2 bg-[#ef4444] hover:bg-red-600 text-white font-medium rounded transition-all shadow-sm active:scale-95 text-sm" 
                        onClick={onClose}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CiaViewQpModal;

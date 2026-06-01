import React, { useState, useEffect } from 'react';
import axiosInstance from '../../../../utils/api';
import '../../assessment/cia/cia.css';
import './CiaDataImport.css';
import { FaTimes } from 'react-icons/fa';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';

interface CiaViewQpModalProps {
  data: any;            // row from assessment occasions
  onClose: () => void;
}

// Custom colors matching the demo (blue/aqua for CO, orange/yellow for Bloom)
const CO_COLORS = ['#4eb6c1', '#f0a53d', '#a9b388', '#5e967a', '#859c5d'];
const BLOOM_COLORS = ['#4eb6c1', '#f0a53d', '#a9b388', '#5e967a', '#859c5d'];

const CiaViewQpModal: React.FC<CiaViewQpModalProps> = ({ data, onClose }) => {
  const [qpData, setQpData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (data?.ao_id) fetchData();
  }, [data]);

  const fetchData = async () => {
    setLoading(true);
    setNotFound(false);
    try {
      const res = await axiosInstance.get(
        `/attainment/cce_data_import/view-qp?ao_id=${data.ao_id}`
      );
      
      const resData = (res.data as any);
      if (resData && resData.status === true) {
        setQpData(resData.data);
      } else {
        setNotFound(true);
      }
    } catch (err) {
      console.error('Failed to fetch QP details:', err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  if (!data) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col h-[92vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center shrink-0">
          <h3 className="text-[#437880] text-xl font-bold tracking-tight">
            Cce question paper
          </h3>
          <button className="text-gray-400 hover:text-gray-600 transition-colors" onClick={onClose}>
            <FaTimes size={22} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-10">
          {loading ? (
            <div className="text-center py-20 text-gray-400 italic animate-pulse text-lg">
              Loading question paper and charts...
            </div>
          ) : notFound || !qpData ? (
            <div className="text-center py-20 text-red-500 italic font-semibold border-2 border-dashed border-red-100 rounded-lg">
              No question paper found for this assessment occasion.
            </div>
          ) : (
            <>
              {/* Header Info Banner */}
              <div className="mb-6 p-4 bg-blue-50/40 rounded-lg border border-blue-100 shadow-sm">
                <h4 className="text-[#1d4ed8] font-bold text-xl mb-3 flex items-center gap-2">
                  <span className="w-1 h-6 bg-blue-600 rounded-full" />
                  {qpData.qp_title || 'Question Paper (Lab Test)'}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-[13px]">
                   <div className="bg-white p-2 rounded border border-blue-50 flex flex-col items-center">
                    <span className="text-gray-400 uppercase text-[9px] font-black tracking-widest mb-1">Curriculum / Term</span>
                    <span className="font-bold text-gray-700 italic">{qpData.program || 'N/A'} / {qpData.term || 'N/A'}</span>
                  </div>
                  <div className="bg-white p-2 rounded border border-blue-50 flex flex-col items-center">
                    <span className="text-gray-400 uppercase text-[9px] font-black tracking-widest mb-1">Course</span>
                    <span className="font-bold text-gray-700">{data.course_code || qpData.crs_code} - {qpData.crs_title}</span>
                  </div>
                  <div className="bg-white p-2 rounded border border-blue-50 flex flex-col items-center">
                    <span className="text-gray-400 uppercase text-[9px] font-black tracking-widest mb-1">Max Marks</span>
                    <span className="font-bold text-emerald-600 text-lg">{qpData.max_marks} Marks</span>
                  </div>
                  <div className="bg-white p-2 rounded border border-blue-50 flex flex-col items-center">
                    <span className="text-gray-400 uppercase text-[9px] font-black tracking-widest mb-1">Duration</span>
                    <span className="font-bold text-gray-700">{qpData.duration}</span>
                  </div>
                </div>
              </div>

              {/* 1. QUESTION STRUCTURE */}
              <div className="mb-10">
                <h5 className="text-[14px] font-black text-slate-700 mb-4 flex items-center gap-2">
                  <div className="w-2.5 h-6 bg-blue-600 rounded-sm shadow-sm"></div>
                  QUESTION PAPER STRUCTURE
                </h5>
                <div className="border border-slate-300 rounded-lg overflow-hidden shadow-md">
                  <table className="w-full text-[13px] border-collapse">
                    <thead className="bg-[#f8fafc] font-black text-slate-600 border-b border-slate-300">
                      <tr>
                        <th className="w-12 p-3 border-r border-slate-200 text-center">SL.</th>
                        <th className="p-3 border-r border-slate-200 text-left">QUESTION DESCRIPTION</th>
                        <th className="w-24 p-3 border-r border-slate-200 text-center">COs</th>
                        <th className="w-28 p-3 border-r border-slate-200 text-center">BLOOM LEVEL</th>
                        <th className="w-24 p-3 text-center">MARKS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(qpData.sections || []).map((sec: any, sIdx: number) => (
                        <React.Fragment key={sIdx}>
                          <tr className="bg-blue-50/50 border-b border-slate-200">
                            <td colSpan={5} className="p-2 px-4 font-black text-blue-800 text-sm">
                              {sec.section_name}
                            </td>
                          </tr>
                          {(sec.questions || []).map((q: any, qIdx: number) => (
                            <tr key={`${sIdx}-${qIdx}`} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors">
                              <td className="p-3 border-r border-slate-100 text-center text-slate-400 font-medium">{q.q_no}</td>
                              <td className="p-3 border-r border-slate-100 leading-relaxed text-slate-700">
                                <div dangerouslySetInnerHTML={{ __html: q.question || '' }} />
                              </td>
                              <td className="p-3 border-r border-slate-100 text-center">
                                <span className="text-blue-600 font-bold">{q.co || '-'}</span>
                              </td>
                              <td className="p-3 border-r border-slate-100 text-center">
                                <span className="text-slate-500 font-bold">{q.level || '-'}</span>
                              </td>
                              <td className="p-3 text-center font-black text-slate-800">{q.marks}</td>
                            </tr>
                          ))}
                          <tr className="bg-slate-50/30 font-black text-[11px] border-b border-slate-200 last:border-b-0">
                            <td colSpan={4} className="p-2 pr-6 border-r border-slate-200 text-right text-slate-400 uppercase italic">SECTION TOTAL:</td>
                            <td className="p-2 text-center text-slate-600">{sec.section_marks}</td>
                          </tr>
                        </React.Fragment>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-[#1e293b] text-white font-black border-t-2 border-slate-400">
                        <td colSpan={4} className="p-4 text-right pr-6 uppercase tracking-widest text-[12px]">QUESTION PAPER GRAND TOTAL:</td>
                        <td className="p-4 text-center text-lg">{qpData.max_marks}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* 2. CO DISTRIBUTION */}
              <div className="mb-12">
                <h5 className="text-[14px] font-black text-slate-700 mb-4 flex items-center gap-2 uppercase tracking-wide">
                  <div className="w-2.5 h-6 bg-emerald-500 rounded-sm shadow-sm"></div>
                  CO DISTRIBUTION
                </h5>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left: Pie Chart */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-lg flex flex-col items-center">
                    <div className="w-full h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={qpData.co_distribution || []}
                            cx="50%"
                            cy="50%"
                            innerRadius={0}
                            outerRadius={100}
                            paddingAngle={2}
                            dataKey="marks"
                            nameKey="name"
                            label={({ name, percentage }) => `${name}: ${Number(percentage).toFixed(1)}%`}
                            stroke="#fff"
                            strokeWidth={2}
                          >
                            {(qpData.co_distribution || []).map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={CO_COLORS[index % CO_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            formatter={(value: any, name: any) => [`${value} Marks`, name]}
                          />
                          <Legend verticalAlign="middle" align="right" layout="vertical" iconType="rect" />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Right: Table */}
                  <div className="bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden h-fit">
                    <table className="w-full text-[12px] border-collapse">
                      <thead className="bg-slate-50 font-black text-slate-600 border-b border-slate-200">
                        <tr>
                          <th className="p-3 border-r border-slate-100 text-left">CO Level</th>
                          <th className="p-3 border-r border-slate-100 text-center uppercase tracking-tighter">Marks Distribution (X)</th>
                          <th className="p-3 text-center uppercase tracking-tighter">% Distribution</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(qpData.co_distribution || []).map((co: any, idx: number) => (
                          <tr key={idx} className="border-b border-slate-50 hover:bg-emerald-50/20 transition-colors">
                            <td className="p-3 border-r border-slate-100 font-black text-slate-700">{co.name}</td>
                            <td className="p-3 border-r border-slate-100 text-center font-bold text-slate-500">{co.marks}.00</td>
                            <td className="p-3 text-center font-black text-blue-600">{(Number(co.percentage) || 0).toFixed(2)} %</td>
                          </tr>
                        ))}
                        <tr className="bg-slate-50 font-black text-slate-900 border-t border-slate-200">
                          <td className="p-3 border-r border-slate-200">Total</td>
                          <td className="p-3 border-r border-slate-200 text-center underline decoration-slate-300">{qpData.max_marks}.00 (Y)</td>
                          <td className="p-3 text-center">100.00 %</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Note Box */}
                <div className="mt-4 p-5 bg-slate-50/80 border border-slate-200 rounded-xl shadow-inner">
                   <div className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Note:</div>
                   <div className="space-y-2 text-[12px] text-slate-600 leading-relaxed font-medium">
                      <p className="p-2 border-l-4 border-emerald-400 bg-white rounded-r shadow-sm">
                        The above pie chart depicts the individual Course Outcome(CO) wise actual marks percentage distribution as in the question paper.
                      </p>
                      <div className="pl-3 mt-3 space-y-1">
                        <p><strong>X</strong> = Individual Course Outcome marks</p>
                        <p><strong>Y</strong> = Sum of all Course Outcomes marks</p>
                        <p><strong>% Distribution</strong> = (X / Y) * 100</p>
                      </div>
                   </div>
                </div>
              </div>

              {/* 3. BLOOM DISTRIBUTION */}
              <div className="mb-12">
                <h5 className="text-[14px] font-black text-slate-700 mb-4 flex items-center gap-2 uppercase tracking-wide">
                  <div className="w-2.5 h-6 bg-purple-500 rounded-sm shadow-sm"></div>
                  BLOOM LEVEL DISTRIBUTION
                </h5>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left: Pie Chart */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-lg flex flex-col items-center">
                    <div className="w-full h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={qpData.level_distribution || []}
                            cx="50%"
                            cy="50%"
                            innerRadius={0}
                            outerRadius={100}
                            paddingAngle={2}
                            dataKey="marks"
                            nameKey="name"
                            label={({ name, percentage }) => `${name}: ${Number(percentage).toFixed(1)}%`}
                            stroke="#fff"
                            strokeWidth={2}
                          >
                            {(qpData.level_distribution || []).map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={BLOOM_COLORS[index % BLOOM_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            formatter={(value: any, name: any) => [`${value} Marks`, name]}
                          />
                          <Legend verticalAlign="middle" align="right" layout="vertical" iconType="rect" />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Right: Table */}
                  <div className="bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden h-fit">
                    <table className="w-full text-[12px] border-collapse">
                      <thead className="bg-slate-50 font-black text-slate-600 border-b border-slate-200">
                        <tr>
                          <th className="p-3 border-r border-slate-100 text-left">Level</th>
                          <th className="p-3 border-r border-slate-100 text-center uppercase tracking-tighter">Marks Distribution (X)</th>
                          <th className="p-3 text-center uppercase tracking-tighter">% Distribution</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(qpData.level_distribution || []).map((bl: any, idx: number) => (
                          <tr key={idx} className="border-b border-slate-50 hover:bg-purple-50/20 transition-colors">
                            <td className="p-3 border-r border-slate-100 font-black text-slate-700">{bl.name}</td>
                            <td className="p-3 border-r border-slate-100 text-center font-bold text-slate-500">{bl.marks}.00</td>
                            <td className="p-3 text-center font-black text-blue-600">{(Number(bl.percentage) || 0).toFixed(2)} %</td>
                          </tr>
                        ))}
                        <tr className="bg-slate-50 font-black text-slate-900 border-t border-slate-200">
                          <td className="p-3 border-r border-slate-200">Total</td>
                          <td className="p-3 border-r border-slate-200 text-center underline decoration-slate-300">{qpData.max_marks}.00 (Y)</td>
                          <td className="p-3 text-center">100.00 %</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Note Box */}
                <div className="mt-4 p-5 bg-slate-50/80 border border-slate-200 rounded-xl shadow-inner">
                   <div className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Note:</div>
                   <div className="space-y-2 text-[12px] text-slate-600 leading-relaxed font-medium">
                      <p className="p-2 border-l-4 border-purple-400 bg-white rounded-r shadow-sm">
                        The above pie chart depicts the individual Bloom's Level actual marks percentage distribution as in the question paper.
                      </p>
                      <div className="pl-3 mt-3 space-y-1">
                        <p><strong>X</strong> = Individual Bloom's Level marks</p>
                        <p><strong>Y</strong> = Sum of all Bloom's Level marks</p>
                        <p><strong>% Distribution</strong> = (X / Y) * 100</p>
                      </div>
                   </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-10 py-6 bg-white border-t border-gray-100 flex justify-end shrink-0">
          <button
            className="px-10 py-2.5 bg-[#d9534f] text-white rounded-lg font-bold text-sm hover:bg-[#c9302c] transition-all shadow-md shadow-rose-200"
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

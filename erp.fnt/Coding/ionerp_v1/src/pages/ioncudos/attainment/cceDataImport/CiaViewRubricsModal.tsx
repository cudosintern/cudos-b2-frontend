import React, { useState, useEffect } from 'react';
import axiosInstance from '../../../../utils/api';
import '../../assessment/cia/cia.css';
import './CiaDataImport.css';
import { FaFilePdf, FaQuestionCircle, FaTimes } from 'react-icons/fa';

interface CiaViewRubricsModalProps {
  data: any;
  onClose: () => void;
}

const CiaViewRubricsModal: React.FC<CiaViewRubricsModalProps> = ({ data, onClose }) => {
  const [rubrics, setRubrics] = useState<any[]>([]);
  const [rubricsData, setRubricsData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  /* Try to fetch rubrics from backend; fall back to data.rubrics if present */
  useEffect(() => {
    if (data?.ao_id) {
      fetchRubrics();
    } else if (data?.rubrics) {
      setRubrics(data.rubrics);
    }
    // Fetch only when the selected modal data changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const fetchRubrics = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ ao_id: String(data.ao_id) });
      if (data.section_id) params.append('section_id', String(data.section_id));
      const res = await axiosInstance.get<any>(
        `/attainment/cce_data_import/view-rubrics?${params.toString()}`
      );
      if (res.data.status) {
          setRubricsData(res.data.data);
          const raw = res.data.data.criteria_list || [];
          setRubrics(raw);
      }
    } catch (err) {
      console.error(err);
      setRubrics(data?.rubrics || []);
    } finally {
      setLoading(false);
    }
  };

  /* Normalise each rubric row to a consistent shape */
  const rubricsList = rubrics.map((r: any, index: number) => ({
    slNo: index + 1,
    criteria:    r.criteria || r.criteria_description || 'N/A',
    coCode:      r.co_code  || r.co || 'N/A',
    scaleRanges: r.scales?.map((s: any) => s.range) || [],
    scaleValues: r.scales?.map((s: any) => s.name) || [],
    descriptions: r.scales?.map((s: any) => s.description) || []
  }));

  const maxScaleCount = Math.max(2, ...rubricsList.map((rubric: any) => Math.max(rubric.scaleRanges.length, rubric.scaleValues.length, rubric.descriptions.length)));

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[99999] flex items-center justify-center p-4 md:p-10">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center shrink-0">
            <h2 className="text-[#437880] text-xl font-bold tracking-tight">
                Rubrics preview: {data.ao_name || data.sub_occasion_type}
            </h2>
            <button className="text-gray-400 hover:text-gray-600 transition-colors" onClick={onClose}>
                <FaTimes size={22} />
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 p-6 bg-slate-50/50 rounded-xl border border-gray-100">
            <div className="space-y-1">
                <div className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Curriculum / Term</div>
                <div className="font-bold text-slate-800 text-sm italic">
                  {rubricsData?.program || data.curriculum_code || 'N/A'} / {rubricsData?.term || data.term_name || 'N/A'}
                </div>
            </div>
            <div className="space-y-1">
                <div className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Course / Section</div>
                <div className="font-bold text-slate-800 text-sm">{rubricsData?.course || data.crs_code || 'N/A'} / {rubricsData?.section || data.section || 'A'}</div>
            </div>
            <div className="space-y-1">
                <div className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Assessment Occasion</div>
                <div className="font-bold text-blue-600 text-sm">{rubricsData?.ao || data.ao_name || 'N/A'}</div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-400 italic animate-pulse">Loading rubrics...</div>
          ) : (
            <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-[#f8fafc]">
                  <tr>
                    <th rowSpan={2} className="px-4 py-4 text-center text-xs font-bold text-[#334155] uppercase tracking-wider border-r border-gray-200 w-16">Sl No.</th>
                    <th rowSpan={2} className="px-4 py-4 text-left text-xs font-bold text-[#334155] uppercase tracking-wider border-r border-gray-200">Criteria</th>
                    <th rowSpan={2} className="px-4 py-4 text-center text-xs font-bold text-[#334155] uppercase tracking-wider border-r border-gray-200 w-24">CO</th>
                    <th className="px-4 py-2 text-center text-[10px] font-black text-[#94a3b8] uppercase tracking-[0.2em] border-b border-gray-200 bg-slate-50" colSpan={maxScaleCount}>
                        Scale of Assessment
                    </th>
                  </tr>
                  <tr className="bg-slate-50/50">
                    {Array.from({ length: maxScaleCount }).map((_, i) => (
                        <th key={i} className="px-4 py-2 text-center text-[9px] font-bold text-slate-400 uppercase border-r last:border-r-0 border-gray-100">
                            Scale {i + 1}
                        </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {rubricsList.length > 0 ? rubricsList.map(rubric => (
                    <React.Fragment key={rubric.slNo}>
                    <tr className="hover:bg-blue-50/30 transition-colors">
                      <td rowSpan={2} className="px-4 py-4 whitespace-nowrap text-sm font-bold text-[#334155] border-r border-gray-200 text-center bg-slate-50/30">
                        {rubric.slNo}
                      </td>
                      <td rowSpan={2} className="px-4 py-4 text-sm text-slate-800 border-r border-gray-200 font-bold align-top leading-relaxed">
                        {rubric.criteria}
                      </td>
                      <td rowSpan={2} className="px-4 py-4 whitespace-nowrap text-center border-r border-gray-200 align-top pt-5">
                        <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-md font-black text-[11px] uppercase shadow-sm">
                            {rubric.coCode}
                        </span>
                      </td>
                      {Array.from({ length: maxScaleCount }).map((_, i) => (
                        <td key={`range-${i}`} className="px-4 py-4 text-center border-r last:border-r-0 border-gray-100 bg-blue-50/10">
                            <div className="text-[10px] font-black text-blue-500 uppercase mb-1">{rubric.scaleValues[i] || `Scale ${i+1}`}</div>
                            <div className="text-sm font-black text-slate-800">{rubric.scaleRanges[i] || '-'}</div>
                        </td>
                      ))}
                    </tr>
                    <tr className="bg-white border-b border-gray-100 last:border-b-0 hover:bg-blue-50/30 transition-colors">
                      {Array.from({ length: maxScaleCount }).map((_, i) => (
                        <td key={`desc-${i}`} className="px-4 py-3 text-[11px] italic text-slate-500 border-r last:border-r-0 border-gray-100 leading-relaxed max-w-[200px]">
                          {rubric.descriptions[i] || rubric.scaleValues[i] || '-'}
                        </td>
                      ))}
                    </tr>
                    </React.Fragment>
                  )) : (
                    <tr>
                      <td colSpan={3 + maxScaleCount} className="p-12 text-center text-gray-400 italic">
                        No rubrics available for this occasion.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="px-10 py-6 bg-white border-t border-gray-100 flex justify-end gap-3 shrink-0">
          <button className="px-8 py-2.5 bg-[#437880] text-white rounded-lg font-bold text-sm hover:bg-[#386269] transition-all flex items-center gap-2 shadow-sm">
            <FaFilePdf size={13} /> Export .pdf
          </button>
          <button className="px-10 py-2.5 bg-[#d9534f] text-white rounded-lg font-bold text-sm hover:bg-[#c9302c] transition-all shadow-md shadow-rose-200" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CiaViewRubricsModal;

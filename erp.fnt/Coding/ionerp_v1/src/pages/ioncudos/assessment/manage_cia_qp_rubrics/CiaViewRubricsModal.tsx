import React, { useState, useEffect } from 'react';
import axiosInstance from '../../../../utils/api';
import '../cia/cia.css';
import '../../attainment/cceDataImport/CiaDataImport.css';
import { FaFilePdf, FaQuestionCircle, FaTimes } from 'react-icons/fa';

interface CiaViewRubricsModalProps {
  data: any;
  onClose: () => void;
}

const CiaViewRubricsModal: React.FC<CiaViewRubricsModalProps> = ({ data, onClose }) => {
  const [rubrics, setRubrics] = useState<any[]>([]);
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
      const res = await axiosInstance.get<any>(
        `/attainment/cce_data_import/view-rubrics?ao_id=${data.ao_id}`
      );
      if (res.data.status) {
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
      <div className="bg-white rounded-[1.5rem] shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-in border border-white">
        {/* Header */}
        <div className="px-10 py-6 border-b border-gray-100 flex justify-between items-center bg-white">
            <h2 className="text-xl font-bold text-[#4a8494]">
                Rubrics Preview: {data.ao_name || data.sub_occasion_type}
            </h2>
            <button className="text-slate-400 hover:text-red-500 transition-colors" onClick={onClose}>
                <FaTimes size={20} />
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-10 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 p-6 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
            <div className="space-y-1">
                <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Curriculum / Term</div>
                <div className="font-bold text-slate-700 text-sm italic">{data.academic_batch_code || data.curriculum || 'N/A'} / {data.term_name || 'N/A'}</div>
            </div>
            <div className="space-y-1">
                <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Course / Section</div>
                <div className="font-bold text-slate-700 text-sm">{data.crs_code || 'N/A'} / {data.section || 'A'}</div>
            </div>
            <div className="space-y-1">
                <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Assessment Occasion</div>
                <div className="font-bold text-[#4a8494] text-sm">{data.ao_name || 'N/A'}</div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-400 italic animate-pulse">Loading rubrics...</div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th rowSpan={2} className="px-6 py-5 text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest border-r border-slate-200 w-16">Sl No.</th>
                    <th rowSpan={2} className="px-6 py-5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest border-r border-slate-200">Criteria</th>
                    <th rowSpan={2} className="px-6 py-5 text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest border-r border-slate-200 w-24">CO</th>
                    <th className="px-6 py-3 text-center text-[10px] font-bold text-[#4a8494] uppercase tracking-[0.2em] border-b border-slate-200 bg-blue-50/30" colSpan={maxScaleCount}>
                        Scale of Assessment
                    </th>
                  </tr>
                  <tr className="bg-slate-50/50">
                    {Array.from({ length: maxScaleCount }).map((_, i) => (
                        <th key={i} className="px-4 py-3 text-center text-[9px] font-bold text-slate-400 uppercase border-r last:border-r-0 border-slate-100">
                            Scale {i + 1}
                        </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {rubricsList.length > 0 ? rubricsList.map(rubric => (
                    <React.Fragment key={rubric.slNo}>
                    <tr className="hover:bg-blue-50/10 transition-colors">
                      <td rowSpan={2} className="px-6 py-5 whitespace-nowrap text-sm font-bold text-slate-700 border-r border-slate-100 text-center bg-slate-50/20">
                        {rubric.slNo}
                      </td>
                      <td rowSpan={2} className="px-6 py-5 text-sm text-slate-800 border-r border-slate-100 font-bold align-top leading-relaxed">
                        {rubric.criteria}
                      </td>
                      <td rowSpan={2} className="px-6 py-5 whitespace-nowrap text-center border-r border-slate-100 align-top pt-8">
                        <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg font-bold text-[11px] uppercase shadow-sm tracking-tight">
                            {rubric.coCode}
                        </span>
                      </td>
                      {Array.from({ length: maxScaleCount }).map((_, i) => (
                        <td key={`range-${i}`} className="px-6 py-6 text-center border-r last:border-r-0 border-slate-50 bg-slate-50/10">
                            <div className="text-[10px] font-bold text-[#4a8494] uppercase mb-1.5 tracking-wider">{rubric.scaleValues[i] || `Scale ${i+1}`}</div>
                            <div className="text-sm font-bold text-slate-800">{rubric.scaleRanges[i] || '-'}</div>
                        </td>
                      ))}
                    </tr>
                    <tr className="bg-white border-b border-slate-50 last:border-b-0 hover:bg-blue-50/5 transition-colors">
                      {Array.from({ length: maxScaleCount }).map((_, i) => (
                        <td key={`desc-${i}`} className="px-6 py-4 text-[11px] font-medium text-slate-500 border-r last:border-r-0 border-slate-50 leading-relaxed max-w-[200px]">
                          {rubric.descriptions[i] || rubric.scaleValues[i] || '-'}
                        </td>
                      ))}
                    </tr>
                    </React.Fragment>
                  )) : (
                    <tr>
                      <td colSpan={3 + maxScaleCount} className="p-16 text-center text-slate-400 italic text-sm font-medium">
                        No rubrics available for this occasion.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-10 py-6 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-3">
          <button className="px-8 py-2 bg-[#4a8494] hover:bg-[#3d6d7a] text-white font-medium rounded transition-all shadow-sm flex items-center gap-2 text-sm active:scale-95">
            <FaFilePdf size={16} /> Export PDF
          </button>
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

export default CiaViewRubricsModal;

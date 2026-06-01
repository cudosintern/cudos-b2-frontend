import React, { useState, useEffect } from 'react';
import axiosInstance from '../../../../utils/api';
import '../../assessment/cia/cia.css';
import './CiaDataImport.css';
import { FaTimes } from 'react-icons/fa';
import CiaViewQpModal from './CiaViewQpModal';
import CiaViewRubricsModal from './CiaViewRubricsModal';

interface CiaOccasionModalProps {
  data: any;
  onClose: () => void;
}

const CiaOccasionModal: React.FC<CiaOccasionModalProps> = ({ data, onClose }) => {
  const [occasions, setOccasions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  /* ---- child modals ---- */
  const [qpRow, setQpRow]           = useState<any | null>(null);
  const [rubricsRow, setRubricsRow] = useState<any | null>(null);

  useEffect(() => { fetchOccasions(); }, [data]);

  const fetchOccasions = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(
        `/assessments/manage_cia_occasion/assessment-occasion/grid-data?course_id=${data?.crs_id || data?.id}`
      );
      setOccasions((res.data as any).data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col h-[85vh] animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center shrink-0">
            <h3 className="text-[#437880] text-xl font-bold tracking-tight">
              Comprehensive continuous evaluation occasions list
            </h3>
            <button className="text-gray-400 hover:text-gray-600 transition-colors" onClick={onClose}>
              <FaTimes size={22} />
            </button>
          </div>

          <div className="overflow-y-auto flex-1 p-8">
            {/* Course info bar - Refined aesthetic */}
            <div className="mb-8 space-y-1">
              <div className="flex gap-2 text-sm">
                <span className="font-bold text-gray-700">Course:</span>
                <span className="text-gray-600">{data.course_title} ({data.code})</span>
              </div>
              <div className="flex gap-2 text-sm">
                <span className="font-bold text-gray-700">Section:</span>
                <span className="text-[#437880] font-bold">{data.section || 'All'}</span>
              </div>
              <div className="flex gap-2 text-sm">
                <span className="font-bold text-gray-700">Instructor:</span>
                <span className="text-gray-600">{data.instructor || '-'}</span>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-20 italic text-gray-400">Loading occasions...</div>
            ) : (
              <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-[#f8fafc] text-gray-700 font-bold text-[11px] tracking-tight border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 border-r border-gray-100 text-center w-20">SL NO</th>
                      <th className="px-6 py-4 border-r border-gray-100 uppercase">AO description</th>
                      <th className="px-6 py-4 border-r border-gray-100 uppercase">Method</th>
                      <th className="px-6 py-4 border-r border-gray-100 text-center uppercase">Type</th>
                      <th className="px-6 py-4 border-r border-gray-100 text-center w-32 uppercase">CCE max</th>
                      <th className="px-6 py-4 text-center uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {occasions.length > 0 ? occasions.map((row, idx) => (
                      <tr key={row.ao_id || idx} className="hover:bg-[#f9fafb] transition-colors">
                        <td className="px-6 py-4 text-xs font-bold text-gray-400 text-center border-r border-gray-50">{row.sl_no || idx + 1}</td>
                        <td className="px-6 py-4 border-r border-gray-50">
                          <div className="text-xs font-bold text-gray-700">
                            {row.sub_occasion_type || row.main_occasion_type}
                          </div>
                          {row.sub_occasion_type && row.main_occasion_type && (
                            <div className="text-[10px] text-gray-400 uppercase tracking-tight mt-0.5">{row.main_occasion_type}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-600 border-r border-gray-50">{row.ao_method}</td>
                        <td className="px-6 py-4 text-center border-r border-gray-50">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight ${row.assessment_type === 'QP' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                            {row.assessment_type || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-[#437880] text-xs border-r border-gray-50">{row.max_marks}</td>

                        <td className="px-6 py-4 text-center">
                           <div className="flex items-center justify-center gap-4">
                              {(row.assessment_type === 'QP' || row.assessment_type === 'Individual') ? (
                                <button className="text-[11px] font-bold text-sky-600 hover:underline uppercase tracking-tight" onClick={() => setQpRow(row)}>
                                  View QP
                                </button>
                              ) : null}
                              {row.assessment_type === 'Rubrics' ? (
                                <button className="text-[11px] font-bold text-violet-600 hover:underline uppercase tracking-tight" onClick={() => setRubricsRow(row)}>
                                  View Rubrics
                                </button>
                              ) : null}
                              {row.assessment_type !== 'QP' && row.assessment_type !== 'Individual' && row.assessment_type !== 'Rubrics' && (
                                <span className="text-gray-300 text-[10px] italic">No Mapping</span>
                              )}
                           </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={6} className="text-center py-20 text-sm text-gray-400 italic bg-gray-50">
                          No CCE occasions configured for this course.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-10 py-6 bg-white border-t border-gray-100 flex justify-end shrink-0">
             <button className="px-10 py-2.5 bg-[#d9534f] text-white rounded-lg font-bold text-sm hover:bg-[#c9302c] transition-all shadow-md shadow-rose-200" onClick={onClose}>
               Close
             </button>
          </div>
        </div>
      </div>

      {/* QP sub-modal */}
      {qpRow && (
        <CiaViewQpModal
          data={{ 
            ...qpRow, 
            course_code: data.code,
            curriculum_code: data.curriculum_code,
            term_name: data.term_name
          }}
          onClose={() => setQpRow(null)}
        />
      )}

      {/* Rubrics sub-modal */}
      {rubricsRow && (
        <CiaViewRubricsModal
          data={{
            ...rubricsRow,
            academic_batch_code: data.curriculum_code,
            term_name: data.term_name,
            crs_code: data.code,
            section_id: data.section_id,
            ao_name: rubricsRow.sub_occasion_type || rubricsRow.main_occasion_type
          }}
          onClose={() => setRubricsRow(null)}
        />
      )}
    </>
  );
};

export default CiaOccasionModal;

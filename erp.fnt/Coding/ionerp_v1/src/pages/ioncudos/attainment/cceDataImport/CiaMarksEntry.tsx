import React, { useState, useEffect } from 'react';
import axiosInstance from '../../../../utils/api';
import '../../assessment/cia/cia.css';
import './CiaDataImport.css';
import { FaDownload, FaTimes, FaQuestionCircle } from 'react-icons/fa';
import CiaMarksImport from './CiaMarksImport';
import CiaMarksView from './CiaMarksView';
import CiaDataAnalysis from './CiaDataAnalysis';

interface CiaMarksEntryProps {
  data: any;   // course row + term_id, program_id, curriculum_id, section_id
  onBack: () => void;
}

const CiaMarksEntry: React.FC<CiaMarksEntryProps> = ({ data, onBack }) => {
  const [occasionData, setOccasionData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  const [currentView, setCurrentView] = useState<'LIST' | 'IMPORT' | 'VIEW' | 'ANALYSIS'>('LIST');
  const [selectedAo, setSelectedAo] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalTitle, setModalTitle] = useState('CCE Marks Entry');
  const [isError, setIsError] = useState(false);

  const courseId = data.crs_id || data.id;
  const sectionId = data.section_id || null;
  const termId = data.term_id || null;
  const programId = data.program_id || null;
  const curriculumId = data.curriculum_id || null;

  useEffect(() => {
    if (currentView === 'LIST') {
      fetchOccasions();
    }
  }, [currentView]);

  const fetchOccasions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (courseId) params.append('course_id', String(courseId));
      if (programId) params.append('program_id', String(programId));
      if (curriculumId) params.append('curriculum_id', String(curriculumId));
      if (termId) params.append('term_id', String(termId));
      if (sectionId) params.append('section_id', String(sectionId));

      const res = await axiosInstance.get(
        `/attainment/cce_data_import/manage-cce-marks?${params.toString()}`
      );
      setOccasionData((res.data as any).data || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (aoId: number) => {
    try {
      const res = await axiosInstance.get(`/attainment/cce_data_import/download-marks-template?ao_id=${aoId}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data as any]));
      const a = document.createElement('a');
      a.href = url;
      const disposition = res.headers['content-disposition'];
      let filename = `CCE_Marks_Template_${aoId}.xlsx`;
      if (disposition && disposition.indexOf('filename=') !== -1) {
        const matches = disposition.match(/filename="?([^"]+)"?/);
        if (matches != null && matches[1]) { 
          filename = matches[1];
        }
      }
      a.setAttribute('download', filename);
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
      setModalTitle('Download Failed');
      setModalMessage('Failed to download template. Please try again.');
      setIsError(true);
      setShowModal(true);
    }
  };

  if (currentView === 'IMPORT' && selectedAo) {
    return (
      <CiaMarksImport 
        aoData={selectedAo} 
        sectionId={sectionId} 
        contextInfo={occasionData}
        onBack={() => setCurrentView('LIST')} 
      />
    );
  }

  if (currentView === 'VIEW' && selectedAo) {
    return (
      <CiaMarksView 
        aoData={selectedAo} 
        contextInfo={occasionData}
        onBack={() => setCurrentView('LIST')} 
        onReImport={() => setCurrentView('IMPORT')} 
        onDataAnalysis={() => setCurrentView('ANALYSIS')} 
      />
    );
  }

  if (currentView === 'ANALYSIS' && selectedAo) {
    return <CiaDataAnalysis aoData={selectedAo} onBack={() => setCurrentView('VIEW')} />;
  }

  return (
    <div className="">
      <h3 className="text-lg font-semibold pb-5 text-[#437880]">
        Manage Comprehensive Continuous Evaluation (CCE) Occasions Marks
      </h3>

      <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm mb-8">
        {/* Course Info Section */}
        <h3 className="text-[#437880] text-base font-semibold border-b border-gray-100 pb-3 mb-6">Course Context Information</h3>
        {loading ? (
             <div className="text-center py-10 italic text-gray-400">Loading information...</div>
        ) : occasionData ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 bg-[#f8fafc] p-6 rounded-xl border border-gray-100 mb-10">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">School</label>
                <span className="text-sm font-bold text-gray-700">{occasionData.school}</span>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Program</label>
                <span className="text-sm font-bold text-gray-700">{occasionData.program}</span>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Curriculum</label>
                <span className="text-sm font-bold text-gray-700">{occasionData.curriculum}</span>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Term</label>
                <span className="text-sm font-bold text-gray-700">{occasionData.term}</span>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Course</label>
                <span className="text-sm font-bold text-gray-700">{occasionData.course}</span>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Section</label>
                <span className="text-sm font-bold text-gray-700">{occasionData.section}</span>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">No. of Occasions</label>
                <span className="text-sm font-bold text-[#437880]">{occasionData.no_of_occasions}</span>
              </div>
            </div>

            <h3 className="text-[#437880] text-base font-semibold border-b border-gray-100 pb-3 mb-6">Assessment Occasions List</h3>
            <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm mb-6">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#f2f4f6] text-[#6b7280] font-bold text-[10px] tracking-widest uppercase border-b border-gray-300">
                  <tr>
                    <th className="px-6 py-4 border-r border-gray-200">Sl.No.</th>
                    <th className="px-6 py-4 border-r border-gray-200 text-center">Description</th>
                    <th className="px-6 py-4 border-r border-gray-200">Method</th>
                    <th className="px-6 py-4 border-r border-gray-200">Assessment Type</th>
                    <th className="px-6 py-4 border-r border-gray-200 text-right">Max Marks</th>
                    <th className="px-6 py-4 text-center">Import CCE Marks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {occasionData.occasions && occasionData.occasions.length > 0 ? (
                    occasionData.occasions.map((occ: any, idx: number) => (
                      <tr key={idx} className="hover:bg-[#f9fafb] transition-colors">
                        <td className="px-6 py-4 text-xs font-bold text-gray-400 border-r border-gray-50">{occ.sl_no}</td>
                        <td className="px-6 py-4 text-xs font-semibold text-gray-700 border-r border-gray-50">{occ.occasion_description}</td>
                        <td className="px-6 py-4 text-xs text-gray-600 border-r border-gray-50">{occ.occasion_method}</td>
                        <td className="px-6 py-4 text-xs text-gray-600 border-r border-gray-50">{occ.assessment_type}</td>
                        <td className="px-6 py-4 text-xs font-bold text-[#437880] border-r border-gray-50 text-right">{Number(occ.cce_max_marks).toFixed(2)}</td>
                        <td className="px-6 py-4 text-center">
                           {occ.import_cce_marks === 'QP is not defined .' || occ.import_cce_marks === 'Rubrics not defined .' ? (
                             <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight italic">{occ.import_cce_marks}</span>
                           ) : (
                             <div className="flex items-center justify-center gap-4">
                               <button className="text-[11px] font-bold text-[#437880] hover:underline uppercase tracking-tight" onClick={() => handleDownload(occ.ao_id)}>Download</button>
                               <span className="text-gray-300 text-xs">|</span>
                               <button className="text-[11px] font-bold text-emerald-600 hover:underline uppercase tracking-tight" onClick={() => { setSelectedAo(occ); setCurrentView('IMPORT'); }}>Import</button>
                               <span className="text-gray-300 text-xs">|</span>
                               <button className="text-[11px] font-bold text-sky-600 hover:underline uppercase tracking-tight" onClick={() => { setSelectedAo(occ); setCurrentView('VIEW'); }}>View</button>
                             </div>
                           )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-10 py-12 text-center text-sm text-gray-400 italic bg-gray-50">No occasions found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="text-center py-20 text-rose-500 font-bold">Failed to load course information</div>
        )}

        <div className="flex justify-end mt-10 border-t border-gray-100 pt-8">
          <button className="px-8 py-2.5 bg-[#d9534f] text-white rounded font-bold text-sm hover:bg-[#c9302c] transition-all flex items-center gap-2 shadow-sm" onClick={onBack}>
            <FaTimes size={13} /> Close
          </button>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
           <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
             <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white">
               <span className="font-bold text-lg text-[#437880] tracking-tight">{modalTitle}</span>
               <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><FaTimes size={18} /></button>
             </div>
             <div className="p-10">
               <p className="text-sm font-semibold text-gray-600 leading-relaxed text-center">{modalMessage}</p>
               <div className="mt-10 flex justify-center">
                 <button onClick={() => setShowModal(false)} className="px-10 py-2.5 bg-[#d9534f] text-white rounded-lg font-bold text-sm hover:bg-[#c9302c] transition-all shadow-md">Close</button>
               </div>
             </div>
           </div>
        </div>
      )}
    </div>
  );
};


export default CiaMarksEntry;


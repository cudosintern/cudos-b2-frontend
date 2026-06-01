import React, { useState, useEffect } from 'react';
import axiosInstance from '../../../../utils/api';
import { FaCheck, FaSync, FaChartBar, FaTimes, FaDownload, FaQuestionCircle } from 'react-icons/fa';

interface CiaMarksViewProps {
  aoData: any;
  contextInfo?: any;
  onBack: () => void;
  onReImport: () => void;
  onDataAnalysis: () => void;
}

const CiaMarksView: React.FC<CiaMarksViewProps> = ({ aoData, contextInfo, onBack, onReImport, onDataAnalysis }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [discarding, setDiscarding] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalTitle, setModalTitle] = useState('CCE Marks View');
  const [isError, setIsError] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmCallback, setConfirmCallback] = useState<(() => void) | null>(null);

  useEffect(() => {
    fetchViewData();
  }, []);

  const fetchViewData = async () => {
    setLoading(true);
    try {
      let url = `/attainment/cce_data_import/view-marks?ao_id=${aoData.ao_id}`;
      // Logic for semester_id (term_id) and section_id fallback from context
      const section_id = aoData.section_id || (window as any)._currentSectionId;
      const term_id = aoData.semester_id || (window as any)._currentTermId; 
      const pgm_id = aoData.program_id || (window as any)._currentProgramId;
      const curr_id = aoData.curriculum_id || (window as any)._currentCurriculumId;
      
      if (section_id) url += `&section_id=${section_id}`;
      if (term_id) url += `&term_id=${term_id}`;
      if (pgm_id) url += `&program_id=${pgm_id}`;
      if (curr_id) url += `&curriculum_id=${curr_id}`;
      
      const res = await axiosInstance.get(url);
      setData((res.data as any).data);
    } catch (err) {
      console.error('Failed to fetch view data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDiscard = async () => {
    setModalTitle('Discard Marks');
    setModalMessage('Are you sure you want to discard this data? This will permanently delete the uploaded marks.');
    setIsError(false);
    setConfirmCallback(() => async () => {
      setShowConfirm(false);
      setDiscarding(true);
      try {
        await axiosInstance.post(`/attainment/cce_data_import/discard-marks?ao_id=${aoData.ao_id}`);
        setModalTitle('Discard Success');
        setModalMessage("Data discarded successfully.");
        setIsError(false);
        setShowModal(true);
      } catch (err: any) {
        console.error('Discard error:', err);
        setModalTitle('Discard Failed');
        setModalMessage(err.response?.data?.message || "Failed to discard data.");
        setIsError(true);
        setShowModal(true);
      } finally {
        setDiscarding(false);
      }
    });
    setShowConfirm(true);
  };

  const handleDownloadTemplate = async () => {
    try {
      const res = await axiosInstance.get(`/attainment/cce_data_import/download-marks-template?ao_id=${aoData.ao_id}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data as any]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `CCE_Marks_Template_${aoData.ao_id}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Download failed', err);
      setModalTitle('Download Failed');
      setModalMessage('Failed to download template.');
      setIsError(true);
      setShowModal(true);
    }
  };

  if (loading) {
     return (
        <div className="cia-container p-4" style={{ backgroundColor: '#f3f4f6', minHeight: '100vh', fontFamily: '"Open Sans", sans-serif' }}>
          <div className="mx-auto text-center py-20 italic text-gray-500" style={{ maxWidth: '1200px', backgroundColor: '#fff', borderRadius: '15px', border: '1px solid #d1d5db' }}>
            Loading marks data...
          </div>
        </div>
      );
  }

  if (!data) {
    return (
      <div className="cia-container p-4" style={{ backgroundColor: '#f3f4f6', minHeight: '100vh', fontFamily: '"Open Sans", sans-serif' }}>
        <div className="mx-auto text-center py-20 text-red-500" style={{ maxWidth: '1200px', backgroundColor: '#fff', borderRadius: '15px', border: '1px solid #d1d5db' }}>
          Data not found.
          <div className="mt-4">
             <button onClick={onBack} className="bg-gray-500 text-white px-4 py-2 rounded">Go Back</button>
          </div>
        </div>
      </div>
    );
  }

  const { header, columns, students } = data;
  const fileNamePattern = header ? `${header.curriculum}_${header.course_code}_${header.section}_${header.ao_name}.xls` : "Marks_File.xls";

  return (
    <div className="cia-container p-4" style={{ backgroundColor: '#f3f4f6', minHeight: '100vh', fontFamily: '"Open Sans", sans-serif' }}>
      <div className="mx-auto" style={{ maxWidth: '1260px', backgroundColor: '#fff', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.15)', overflow: 'hidden', border: '1px solid #d1d5db' }}>
        
        {/* Rounded Blue Header */}
        <div style={{ backgroundColor: '#2b3e50', color: '#fff', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTopLeftRadius: '15px', borderTopRightRadius: '15px', margin: '5px' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold' }}>Comprehensive Continuous Evaluation Assessment Data Import Details</h3>
          <FaQuestionCircle style={{ color: '#4fc3f7', fontSize: '1.4rem', cursor: 'pointer' }} />
        </div>

        <div style={{ padding: '20px' }}>
          
          {/* Metadata Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px 20px', marginBottom: '25px', fontSize: '0.85rem' }}>
            <div><span className="text-gray-500">School:</span> <span className="text-blue-600 font-semibold">{(header?.school && header.school !== 'N/A') ? header.school : (contextInfo?.school || '-')}</span></div>
            <div><span className="text-gray-500">Program:</span> <span className="text-blue-600 font-semibold">{(header?.program && header.program !== 'N/A') ? header.program : (contextInfo?.program || '-')}</span></div>
            <div><span className="text-gray-500">Curriculum:</span> <span className="text-blue-600 font-semibold">{(header?.curriculum && header.curriculum !== 'N/A') ? header.curriculum : (contextInfo?.curriculum || '-')}</span></div>
            <div><span className="text-gray-500">Term:</span> <span className="text-blue-600 font-semibold">{(header?.term && header.term !== 'N/A') ? header.term : (contextInfo?.term || '-')}</span></div>
            <div>
              <span className="text-gray-500">Course:</span> 
              <span className="text-blue-600 font-semibold">
                {(header?.course_title && header.course_title !== 'N/A') 
                  ? `${header.course_title} (${header.course_code})` 
                  : (contextInfo?.course || '-')}
              </span>
            </div>
            <div><span className="text-gray-500">Section:</span> <span className="text-blue-600 font-semibold">{(header?.section && header.section !== 'All') ? header.section : (contextInfo?.section || 'All')}</span></div>
            <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span className="text-gray-500">File Name:</span> 
              <span className="text-blue-600 font-semibold">{fileNamePattern}</span>
              <FaDownload style={{ color: '#333', cursor: 'pointer', fontSize: '0.9rem' }} onClick={handleDownloadTemplate} />
            </div>
          </div>

          {/* Consolidated Marks Table */}
          <div style={{ overflowX: 'auto', border: '1px solid #e5e7eb', borderRadius: '3px', marginBottom: '25px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #d1d5db' }}>
                  <th rowSpan={2} style={{ padding: '12px 8px', textAlign: 'center', borderRight: '1px solid #d1d5db', width: '60px' }}>SL NO</th>
                  <th rowSpan={2} style={{ padding: '12px 10px', textAlign: 'left', borderRight: '1px solid #d1d5db', width: '150px' }}>PNR/USN</th>
                  <th rowSpan={2} style={{ padding: '12px 10px', textAlign: 'left', borderRight: '1px solid #d1d5db', minWidth: '200px' }}>STUDENT NAME</th>
                  {columns.map((col: any) => (
                    <th key={col.qp_mq_id} style={{ padding: '10px', textAlign: 'center', borderRight: '1px solid #d1d5db', backgroundColor: '#f3f4f6' }}>
                      <div className="font-bold">{col.label}({col.max_marks.toFixed(2)})</div>
                    </th>
                  ))}
                </tr>
                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #d1d5db' }}>
                  {columns.map((col: any) => (
                    <th key={`co-${col.qp_mq_id}`} style={{ padding: '5px', textAlign: 'center', borderRight: '1px solid #d1d5db', fontSize: '0.75rem', color: '#4b5563', fontWeight: 'bold' }}>
                      {col.co_code || '—'}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students && students.length > 0 ? (
                  students.map((student: any, idx: number) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: (idx % 2 === 0 ? '#fff' : '#fafafa') }}>
                      <td style={{ padding: '10px 8px', textAlign: 'center', borderRight: '1px solid #e5e7eb', color: '#4b5563' }}>{idx + 1}</td>
                      <td style={{ padding: '10px', borderRight: '1px solid #e5e7eb', color: '#4b5563' }}>{student.student_usn}</td>
                      <td style={{ padding: '10px', borderRight: '1px solid #e5e7eb', color: '#4b5563' }}>{student.student_name}</td>
                      {columns.map((col: any) => {
                        const markVal = student.marks[String(col.qp_mq_id)];
                        return (
                          <td key={col.qp_mq_id} style={{ padding: '10px', textAlign: 'center', borderRight: '1px solid #e5e7eb', color: '#4b5563' }}>
                            {markVal !== null && markVal !== undefined ? Number(markVal).toFixed(2) : '-'}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3 + columns.length} style={{ padding: '30px', textAlign: 'center', color: '#9ca3af', fontStyle: 'italic' }}>
                      No marks data found for this assessment.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Action Buttons Bar */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button 
              onClick={onBack}
              style={{
                backgroundColor: '#0056b3',
                color: '#fff',
                border: 'none',
                padding: '8px 18px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '0.85rem'
              }}
              className="hover:opacity-90 transition"
            >
              <FaCheck /> Return to Manage CCE
            </button>

            <button 
              onClick={onReImport}
              style={{
                backgroundColor: '#5cb85c',
                color: '#fff',
                border: 'none',
                padding: '8px 18px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '0.85rem'
              }}
              className="hover:opacity-90 transition"
            >
              <FaSync /> Re-import
            </button>

            <button 
              onClick={onDataAnalysis}
              style={{
                backgroundColor: '#5cb85c',
                color: '#fff',
                border: 'none',
                padding: '8px 18px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '0.85rem'
              }}
              className="hover:opacity-90 transition"
            >
              <FaChartBar /> Data Analysis
            </button>

            <button 
              onClick={handleDiscard}
              disabled={discarding}
              style={{
                backgroundColor: discarding ? '#9ca3af' : '#d9534f',
                color: '#fff',
                border: 'none',
                padding: '8px 18px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: discarding ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                fontSize: '0.85rem'
              }}
              className="hover:opacity-90 transition"
            >
              <FaTimes /> {discarding ? 'Discarding...' : 'Discard Data'}
            </button>
          </div>

        </div>
      </div>
      {/* Custom Modal (Pic 2 style) */}
      {showModal && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded w-[500px] shadow-2xl overflow-hidden border border-gray-300">
            <div className={`text-white p-3 flex justify-between items-center ${isError ? 'bg-red-800' : 'bg-[#1e293b]'}`}>
              <span className="font-bold text-[13px] uppercase tracking-wide">{modalTitle}</span>
              <FaQuestionCircle className="text-blue-300" />
            </div>
            <div className="p-6 border-b border-gray-200 min-h-[100px] flex items-center">
              <p className="text-[13px] text-gray-700 leading-relaxed uppercase">
                {modalMessage}
              </p>
            </div>
            <div className="bg-white p-3 flex justify-end">
              <button 
                onClick={() => {
                  setShowModal(false);
                  if (!isError && modalMessage.includes('successfully')) onBack();
                }}
                className={`text-white px-4 py-1.5 rounded text-[12px] font-bold flex items-center gap-1 transition-colors shadow-sm ${isError ? 'bg-red-600 hover:bg-red-700' : 'bg-[#d9534f] hover:bg-red-700'}`}
              >
                <FaTimes /> Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black bg-opacity-40 font-['Open_Sans']">
          <div className="bg-white rounded w-[500px] shadow-2xl overflow-hidden border border-gray-300">
            <div className="bg-[#1e293b] text-white p-3 flex justify-between items-center bg-gradient-to-r from-[#1e293b] to-[#334155]">
              <span className="font-bold text-[13px] uppercase tracking-wide">{modalTitle}</span>
              <FaQuestionCircle className="text-blue-300" />
            </div>
            <div className="p-6 border-b border-gray-200 min-h-[100px] flex items-center">
              <p className="text-[13px] text-gray-700 leading-relaxed">
                {modalMessage}
              </p>
            </div>
            <div className="bg-white p-3 flex justify-end gap-2">
              <button 
                onClick={() => {
                  if (confirmCallback) (confirmCallback as any)();
                }}
                className="bg-[#1e40af] text-white px-4 py-1.5 rounded text-[12px] font-bold flex items-center gap-1 hover:bg-blue-800 transition-colors shadow-sm"
              >
                <FaCheck /> Confirm
              </button>
              <button 
                onClick={() => setShowConfirm(false)}
                className="bg-[#d9534f] text-white px-4 py-1.5 rounded text-[12px] font-bold flex items-center gap-1 hover:bg-red-700 transition-colors shadow-sm"
              >
                <FaTimes /> Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CiaMarksView;

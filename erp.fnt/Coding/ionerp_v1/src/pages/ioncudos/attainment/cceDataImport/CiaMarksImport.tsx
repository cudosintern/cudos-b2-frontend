import React, { useState, useEffect } from 'react';
import axiosInstance from '../../../../utils/api';
import { FaTimes, FaUpload, FaCheck, FaTrash, FaQuestionCircle } from 'react-icons/fa';

interface CiaMarksImportProps {
  aoData: any;
  sectionId?: any;
  contextInfo?: any;
  onBack: () => void;
}

const CiaMarksImport: React.FC<CiaMarksImportProps> = ({ aoData, sectionId, contextInfo, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);
  const [validationErrors, setValidationErrors] = useState<any[]>([]);
  const [readyToAccept, setReadyToAccept] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalTitle, setModalTitle] = useState('CCE Marks Import');
  const [isError, setIsError] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    fetchImportData();
  }, []);

  const fetchImportData = async () => {
    setLoading(true);
    try {
      let url = `/attainment/cce_data_import/import-marks-data?ao_id=${aoData.ao_id}`;
      // Logic for semester_id (term_id) and section_id fallback
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
      console.error('Failed to fetch import data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      // Reset preview
      setPreviewData(null);
      setValidationErrors([]);
      setReadyToAccept(false);
    }
  };

  const handlePreview = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setValidationErrors([]);
    
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      const ao_id = parseInt(aoData.ao_id, 10);
      if (isNaN(ao_id)) {
        throw new Error(`Invalid Assessment Occasion ID: ${aoData.ao_id}`);
      }

      let url = `/attainment/cce_data_import/upload-marks-excel?ao_id=${ao_id}`;
      
      // Only append section_id if it's a valid number
      const s_id = parseInt(sectionId, 10);
      if (!isNaN(s_id) && s_id > 0) {
        url += `&section_id=${s_id}`;
      }

      console.log('Uploading marks file to:', url);

      const res = await axiosInstance.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      const resData = (res.data as any).data;
      console.log('Upload response data:', resData);

      setPreviewData(resData.preview || []);
      setValidationErrors(resData.validation_errors || []);
      setReadyToAccept(resData.ready_to_accept === true);
      
    } catch (err: any) {
      console.error('Upload Error Details:', err.response?.data || err);
      const errMsg = err.response?.data?.message || err.message || 'Error occurred during file preview.';
      const detail = err.response?.data?.detail;
      const detailStr = detail ? (typeof detail === 'string' ? detail : JSON.stringify(detail)) : '';
      
      setModalTitle('Upload Failed');
      setModalMessage(`${errMsg} ${detailStr ? `(${detailStr})` : ''}`);
      setIsError(true);
      setShowModal(true);
    } finally {
      setUploading(false);
    }
  };

  const handleDiscard = () => {
    setSelectedFile(null);
    setPreviewData(null);
    setValidationErrors([]);
    setReadyToAccept(false);
    setShowConfirm(false);
    onBack();
  };

  const handleAccept = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const ao_id = parseInt(aoData.ao_id, 10);
      if (isNaN(ao_id)) {
        throw new Error(`Invalid Assessment Occasion ID: ${aoData.ao_id}`);
      }

      let url = `/attainment/cce_data_import/accept-marks-excel?ao_id=${ao_id}`;
      
      const s_id = parseInt(sectionId, 10);
      if (!isNaN(s_id) && s_id > 0) {
        url += `&section_id=${s_id}`;
      }

      console.log('Accepting marks via:', url);

      const res = await axiosInstance.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setModalTitle('CCE Marks Import');
      setModalMessage((res.data as any).message || 'Marks imported successfully!');
      setIsError(false);
      setShowModal(true);
      // Wait for user to close modal before onBack? 
      // Actually, better to stay on page or navigate after close.
      // I'll stick to navigation after close logic.
      onBack();
    } catch (err: any) {
      console.error('Accept Error Details:', err.response?.data || err);
      const errMsg = err.response?.data?.message || err.message || 'Failed to save marks.';
      const detail = err.response?.data?.detail;
      const detailStr = detail ? (typeof detail === 'string' ? detail : JSON.stringify(detail)) : '';
      
      setModalTitle('Accept Failed');
      setModalMessage(`${errMsg} ${detailStr ? `(${detailStr})` : ''}`);
      setIsError(true);
      setShowModal(true);
    } finally {
      setUploading(false);
    }
  };

  const showingPreview = previewData !== null;
  const tableData = showingPreview ? previewData : (data?.students || []);
  const questions = data?.questions || [];

  // Metadata resolution: API data first, then parent context fallback
  const displaySchool = (data?.school && data.school !== 'N/A') ? data.school : (contextInfo?.school || '-');
  const displayProgram = (data?.program && data.program !== 'N/A') ? data.program : (contextInfo?.program || '-');
  const displayCurriculum = (data?.curriculum && data.curriculum !== 'N/A') ? data.curriculum : (contextInfo?.curriculum || '-');
  const displayTerm = (data?.term && data.term !== 'N/A') ? data.term : (contextInfo?.term || '-');
  const displayCourse = (data?.course && !data.course.includes('N/A')) ? data.course : (contextInfo?.course || '-');
  const displaySection = (data?.section && data.section !== 'All') ? data.section : (contextInfo?.section || 'All');

  return (
    <div className="cia-container p-4" style={{ backgroundColor: '#f3f4f6', minHeight: '100vh', fontFamily: '"Open Sans", sans-serif' }}>
      <div className="mx-auto" style={{ maxWidth: '1200px', backgroundColor: '#fff', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.15)', overflow: 'hidden', border: '1px solid #d1d5db' }}>
        
        {/* Rounded Blue Header */}
        <div style={{ backgroundColor: '#2b3e50', color: '#fff', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTopLeftRadius: '15px', borderTopRightRadius: '15px', margin: '5px' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold' }}>Comprehensive Continuous Evaluation Data Import - Student(s) Marks</h3>
          <FaQuestionCircle style={{ color: '#4fc3f7', fontSize: '1.4rem', cursor: 'pointer' }} />
        </div>

        <div style={{ padding: '20px' }}>
          {loading ? (
            <div className="text-center py-10 italic text-gray-500">Loading data...</div>
          ) : data ? (
            <>
              {/* Context Info Details */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px 20px', marginBottom: '20px', fontSize: '0.85rem' }}>
                <div><span className="text-gray-500">School:</span> <span className="text-blue-600 font-semibold">{displaySchool}</span></div>
                <div><span className="text-gray-500">Program:</span> <span className="text-blue-600 font-semibold">{displayProgram}</span></div>
                <div><span className="text-gray-500">Curriculum:</span> <span className="text-blue-600 font-semibold">{displayCurriculum}</span></div>
                <div><span className="text-gray-500">Term:</span> <span className="text-blue-600 font-semibold">{displayTerm}</span></div>
                <div><span className="text-gray-500">Course:</span> <span className="text-blue-600 font-semibold">{displayCourse}</span></div>
                <div><span className="text-gray-500">Section:</span> <span className="text-blue-600 font-semibold">{displaySection}</span></div>
                <div style={{ gridColumn: 'span 2' }}>
                  <span className="text-gray-500">File Name:</span> <span className="text-blue-600 font-semibold">{selectedFile ? selectedFile.name : (data.file_name || '-')}</span>
                </div>
              </div>

              {/* Instructions Section */}
              <div style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '15px', marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', fontWeight: 'bold', color: '#374151' }}>Steps:</h4>
                <div style={{ fontSize: '0.82rem', color: '#4b5563', lineHeight: '1.8' }}>
                  <div>1) Click on "<span style={{color: '#d9534f', fontWeight: 'bold'}}>Upload</span>" button to upload the .xls file. Make sure that the <span className="font-bold">file name</span> and <span className="font-bold">file headers</span> are not altered.</div>
                  <div>2) Upon upload, curriculum, student USN, sub questions with their marks and remarks will be displayed.</div>
                  <div>3) Click on "<span style={{color: '#5cb85c', fontWeight: 'bold'}}>Accept</span>" button to save the student data and return back to list page. Make sure that all the <span style={{color: '#d9534f', fontWeight: 'bold'}}>remarks are resolved</span> before proceeding.</div>
                  <div>4) Click on "<span style={{color: '#d9534f', fontWeight: 'bold'}}>Cancel</span>" button to discard (if any file has been uploaded) and return back to list page.</div>
                  <div>5) To replace students' data follow step 1.</div>
                </div>
                
                <div style={{ marginTop: '15px' }}>
                  <div style={{ color: '#d9534f', fontWeight: 'bold', fontSize: '0.85rem' }}>Note:</div>
                  <p style={{ fontSize: '0.8rem', color: '#4b5563', margin: '3px 0 0 0', textAlign: 'justify' }}>
                    For OR/choice-based Question Paper, if in case of OR option between multiple sets of questions (eg. Q1 and Q2 OR Q3 and Q4) while uploading student-secured marks in the template. Please make sure that student marks are provided for all the questions within one set of multiple questions, you shouldn't leave blank if the student has unattempted any questions within the one set of multiple questions, please enter zero (0) for such questions and upload the template, as it has an impact on the CO attainment calculations.
                  </p>
                </div>
              </div>

              {/* Upload Input */}
              <div style={{ marginBottom: '20px' }}>
                 <input 
                  type="file" 
                  accept=".xls,.xlsx" 
                  onChange={handleFileChange}
                  style={{ fontSize: '0.85rem' }}
                />
              </div>

              {/* Validation Errors Panel */}
              {validationErrors && validationErrors.length > 0 && (
                <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#fef2f2', border: '1px solid #f87171', borderRadius: '4px' }}>
                  <h4 style={{ color: '#b91c1c', fontWeight: 'bold', margin: '0 0 5px 0', fontSize: '0.9rem' }}>Validation Errors:</h4>
                  <ul style={{ color: '#991b1b', fontSize: '0.8rem', margin: 0, paddingLeft: '18px' }}>
                    {validationErrors.map((err, i) => (
                      <li key={i}>Row {err.row} (USN: {err.usn}): {err.issues.join(', ')}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Preview Table Section */}
              {showingPreview && (
                <div style={{ overflowX: 'auto', border: '1px solid #e5e7eb', borderRadius: '3px', marginBottom: '20px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f3f4f6', borderBottom: '1px solid #d1d5db' }}>
                        <th style={{ padding: '8px', textAlign: 'center', borderRight: '1px solid #d1d5db', width: '40px' }}>Sl No</th>
                        <th style={{ padding: '8px', textAlign: 'left', borderRight: '1px solid #d1d5db' }}>Roll Number</th>
                        <th style={{ padding: '8px', textAlign: 'left', borderRight: '1px solid #d1d5db' }}>USN</th>
                        <th style={{ padding: '8px', textAlign: 'left', borderRight: '1px solid #d1d5db' }}>Student Name</th>
                        {questions.map((q: any) => (
                          <th key={q.qp_mq_id} style={{ padding: '8px', textAlign: 'center', borderRight: '1px solid #d1d5db' }}>
                            {q.label}
                          </th>
                        ))}
                        <th style={{ padding: '8px', textAlign: 'center' }}>Total Marks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableData.map((row: any, idx: number) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                          <td style={{ padding: '8px', textAlign: 'center', borderRight: '1px solid #e5e7eb' }}>{row.sl_no || (idx + 1)}</td>
                          <td style={{ padding: '8px', borderRight: '1px solid #e5e7eb' }}>{row.roll_number}</td>
                          <td style={{ padding: '8px', borderRight: '1px solid #e5e7eb' }}>{row.student_usn}</td>
                          <td style={{ padding: '8px', borderRight: '1px solid #e5e7eb' }}>{row.student_name}</td>
                          {questions.map((q: any) => (
                            <td key={q.qp_mq_id} style={{ padding: '8px', textAlign: 'center', borderRight: '1px solid #e5e7eb' }}>
                              {row.question_marks[String(q.qp_mq_id)]?.secured_marks ?? '-'}
                            </td>
                          ))}
                          <td style={{ padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>{row.total_marks ?? '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Action Buttons Row */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  onClick={handlePreview}
                  disabled={!selectedFile || uploading}
                  style={{
                    backgroundColor: '#5cb85c',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 18px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: !selectedFile || uploading ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold',
                    fontSize: '0.85rem'
                  }}
                  className="hover:opacity-90"
                >
                  <FaUpload /> {uploading && !showingPreview ? 'Uploading...' : 'Upload .xls'}
                </button>

                <button 
                  onClick={handleAccept}
                  disabled={!readyToAccept || uploading}
                  style={{
                    backgroundColor: !readyToAccept || uploading ? '#9ca3af' : '#5cb85c',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 18px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: !readyToAccept || uploading ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold',
                    fontSize: '0.85rem'
                  }}
                  className="hover:opacity-90"
                >
                  <FaCheck /> {uploading && showingPreview ? 'Accepting...' : 'Accept .xls'}
                </button>

                <button 
                  onClick={() => setShowConfirm(true)}
                  style={{
                    backgroundColor: '#d9534f',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 18px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '0.85rem'
                  }}
                  className="hover:opacity-90"
                >
                  <FaTimes /> Cancel
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-10 text-red-500 font-semibold">Failed to load mandatory import context.</div>
          )}
        </div>
      </div>
      {/* Custom Modal (Pic 2 style) */}
      {showModal && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg w-[500px] shadow-2xl overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200">
            <div className={`p-4 border-b border-gray-100 flex justify-between items-center bg-white`}>
              <span className="font-bold text-[#437880] text-lg tracking-tight">{modalTitle}</span>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <FaTimes size={18} />
              </button>
            </div>
            <div className="p-8 min-h-[100px] flex items-center">
              <p className="text-sm text-gray-600 leading-relaxed">
                {modalMessage}
              </p>
            </div>
            <div className="bg-white px-8 py-5 border-t border-gray-50 flex justify-end">
              <button 
                onClick={() => {
                  setShowModal(false);
                  if (!isError && modalMessage.toLowerCase().includes('successfully')) onBack();
                }}
                className={`text-white px-8 py-2 rounded-lg text-sm font-bold transition-all shadow-md ${isError ? 'bg-[#d9534f] hover:bg-[#c9302c]' : 'bg-[#d9534f] hover:bg-[#c9302c]'}`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Custom Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black bg-opacity-40 font-sans">
          <div className="bg-white rounded-lg w-[500px] shadow-2xl overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white">
              <span className="font-bold text-[#437880] text-lg tracking-tight">Discard data confirmation</span>
              <button onClick={() => setShowConfirm(false)} className="text-gray-400 hover:text-gray-600">
                <FaTimes size={18} />
              </button>
            </div>
            <div className="p-8">
              <p className="text-sm text-gray-600 leading-relaxed">
                Are you sure you want to discard this data and return to list page?
              </p>
            </div>
            <div className="bg-white px-8 py-5 border-t border-gray-50 flex justify-end gap-3">
              <button 
                onClick={handleDiscard}
                className="bg-[#437880] text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-[#386269] transition-all shadow-md"
              >
                Ok
              </button>
              <button 
                onClick={() => setShowConfirm(false)}
                className="bg-[#d9534f] text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-[#c9302c] transition-all shadow-md"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CiaMarksImport;

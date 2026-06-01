import React, { useState, useEffect } from 'react';
import axiosInstance from '../../../../utils/api';
import '../../assessment/cia/cia.css';
import './CiaDataImport.css';
import { FaArrowLeft, FaCheck, FaFilePdf, FaFileExcel, FaQuestionCircle, FaTimes } from 'react-icons/fa';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface CiaFinalisePageProps {
  data: any;
  onBack: () => void;
}

const CiaFinalisePage: React.FC<CiaFinalisePageProps> = ({ data, onBack }) => {
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Modal states
  const [showFinaliseConfirm, setShowFinaliseConfirm] = useState(false);
  const [showRollbackConfirm, setShowRollbackConfirm] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [modalTitle, setModalTitle] = useState('CCE Marks Finalisation');

  const courseId = data.crs_id || data.id;
  const sectionId = data.section_id || null;
  const termId = data.term_id || null;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('crs_id', String(courseId));
      params.append('semester_id', String(termId));
      if (sectionId && sectionId !== 0) params.append('section_id', String(sectionId));

      const res = await axiosInstance.get(`/attainment/cce_data_import/view-finalise-cce-marks?${params.toString()}`);
      setReportData((res.data as any).data);
    } catch (err) {
      console.error('Failed to fetch finalise data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFinalise = async () => {
    setSaving(true);
    setShowFinaliseConfirm(false);
    try {
      const params = new URLSearchParams();
      params.append('crs_id', String(courseId));
      params.append('semester_id', String(termId));
      if (sectionId && sectionId !== 0) params.append('section_id', String(sectionId));

      const res = await axiosInstance.post(`/attainment/cce_data_import/finalise-cce-marks?${params.toString()}`);
      setSuccessMessage((res.data as any).message || 'CCE marks finalised.');
      setModalTitle('CCE Marks Finalisation');
      setShowSuccessModal(true);
      fetchData(); // Refresh to update button state
    } catch (err) {
      console.error(err);
      alert('Finalisation failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleRollback = async () => {
    setSaving(true);
    setShowRollbackConfirm(false);
    try {
      const params = new URLSearchParams();
      params.append('crs_id', String(courseId));
      params.append('semester_id', String(termId));
      if (sectionId && sectionId !== 0) params.append('section_id', String(sectionId));

      const res = await axiosInstance.post(`/attainment/cce_data_import/modify-cce-marks?${params.toString()}`);
      setSuccessMessage((res.data as any).message || 'CCE marks finalisation rolled back successfully.');
      setModalTitle('CCE Marks Rollback');
      setShowSuccessModal(true);
      fetchData(); // Refresh to update button state
    } catch (err) {
      console.error(err);
      alert('Rollback failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const exportPDF = () => {
    if (!reportData) return;
    const { header, occasion_groups, students } = reportData;
    const doc = new jsPDF('landscape');

    // ── Build Header ── 
    doc.setFontSize(16);
    doc.setTextColor(30, 41, 59); // #1e293b
    doc.text('Consolidated Marks Report for EMS', 14, 15);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`School: ${header.school} | Program: ${header.program} | Curriculum: ${header.curriculum}`, 14, 22);
    doc.text(`Course: ${header.course} | Term: ${header.term} | Section: ${header.section}`, 14, 27);
    doc.line(14, 30, 280, 30);

    // ── Prepare Table Data ──
    const headRow1: string[] = ['SI No.', 'Student USN', 'Student Name'];
    const headRow2: string[] = ['', '', ''];

    occasion_groups.forEach((grp: any) => {
      headRow1.push(`${grp.group_name} (${grp.group_max})`);
      for (let i = 0; i < grp.sub_occasions.length; i++) {
        headRow1.push(''); // Fill empty columns for span
      }
      
      grp.sub_occasions.forEach((ao: any) => {
        headRow2.push(`${ao.ao_name}\n(${ao.max_marks.toFixed(2)})`);
      });
      headRow2.push(`Total\n(${grp.group_max?.toFixed(2)})`);
    });
    
    headRow1.push(`Overall CCE Total marks (50.00)`);
    headRow1.push(`Final CCE Marks Round off(50)`);
    headRow2.push('');
    headRow2.push('');

    const bodyRows = students.map((s: any, idx: number) => {
      const row = [idx + 1, s.student_usn, s.student_name];
      occasion_groups.forEach((grp: any) => {
        grp.sub_occasions.forEach((ao: any) => {
          const m = s.per_ao_marks?.[String(ao.ao_id)];
          row.push(m !== null && m !== undefined ? Number(m).toFixed(2) : '-');
        });
        row.push(s.group_totals?.[grp.group_name]?.toFixed(2) || '0.00');
      });
      row.push(s.overall_total?.toFixed(2) || '0.00');
      row.push(s.final_cce_marks || '0');
      return row;
    });

    autoTable(doc, {
      startY: 35,
      head: [headRow1, headRow2],
      body: bodyRows,
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontSize: 8, halign: 'center' },
      bodyStyles: { fontSize: 8 },
      didParseCell: (data) => {
        // Handle multi-row header grouping logic if needed in future
      }
    });

    doc.save(`${header.file_name.split('.')[0]}.pdf`);
  };

  const exportExcel = () => {
    if (!reportData) return;
    const { header, students, occasion_groups } = reportData;
    
    // Create flat header for Excel
    const flatHeader = ['SI No.', 'Student USN', 'Student Name'];
    occasion_groups.forEach((grp: any) => {
      grp.sub_occasions.forEach((ao: any) => flatHeader.push(`${ao.ao_name} (${ao.max_marks})`));
      flatHeader.push(`${grp.group_name} Total`);
    });
    flatHeader.push('Overall CCE Total');
    flatHeader.push('Final Rounded Marks');

    const data = students.map((s: any, idx: number) => {
      const row: any[] = [idx + 1, s.student_usn, s.student_name];
      occasion_groups.forEach((grp: any) => {
        grp.sub_occasions.forEach((ao: any) => row.push(s.per_ao_marks?.[String(ao.ao_id)] ?? '-'));
        row.push(s.group_totals?.[grp.group_name] ?? 0);
      });
      row.push(s.overall_total ?? 0);
      row.push(s.final_cce_marks ?? 0);
      return row;
    });

    const worksheet = XLSX.utils.aoa_to_sheet([flatHeader, ...data]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Consolidated Marks');
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const finalData = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(finalData, `${header.file_name.split('.')[0]}.xlsx`);
  };

  if (loading) {
    return (
      <div className="cia-container text-center py-20 text-gray-400 italic">
        Loading Marks Report...
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="cia-container text-center py-20 text-red-400">
        Failed to load marks data.
      </div>
    );
  }

  const { header, occasion_groups, students } = reportData;
  const isFinalised = header.is_finalised;

  return (
    <div className="cia-container max-w-full">
      {/* ── Page Header (Pic 3 style) ── */}
      <div className="bg-[#1e293b] text-white p-3 rounded-t shadow-lg flex justify-between items-center mb-0">
        <h2 className="text-sm font-bold uppercase tracking-wide">
          Consolidated Marks Report for EMS
        </h2>
        <div className="flex gap-2">
          <FaQuestionCircle size={18} className="cursor-pointer text-blue-300" />
        </div>
      </div>

      <div className="bg-white border-x border-b p-4 shadow-sm mb-6">
        {/* Metadata Grid (Pic 3 Layout) */}
        <div className="grid grid-cols-4 gap-x-2 gap-y-3 text-[12px] mb-6">
          <div className="flex gap-2">
            <span className="font-semibold text-gray-500">School:</span>
            <span className="text-blue-600 font-medium">{header.school}</span>
          </div>
          <div className="flex gap-2 col-span-1">
            <span className="font-semibold text-gray-500">Program:</span>
            <span className="text-blue-600 font-medium">{header.program}</span>
          </div>
          <div className="flex gap-2">
            <span className="font-semibold text-gray-500">Curriculum:</span>
            <span className="text-blue-600 font-medium">{header.curriculum}</span>
          </div>
          <div className="flex gap-2">
            <span className="font-semibold text-gray-500">Term:</span>
            <span className="text-blue-600 font-medium">{header.term}</span>
          </div>
          <div className="flex gap-2">
            <span className="font-semibold text-gray-500">Course:</span>
            <span className="text-blue-600 font-medium">{header.course}</span>
          </div>
          <div className="flex gap-2">
            <span className="font-semibold text-gray-500">Section:</span>
            <span className="text-blue-600 font-medium">{header.section}</span>
          </div>
          <div className="flex gap-2 col-span-2">
            <span className="font-semibold text-gray-500">File Name:</span>
            <span 
              className="text-blue-600 font-medium flex items-center gap-1 cursor-pointer hover:underline"
              onClick={exportExcel}
            >
              {header.file_name}
              <FaFileExcel size={12} className="text-green-700" />
            </span>
          </div>
        </div>

        {/* Action Buttons Header (Pic 3) */}
        <div className="flex justify-end gap-3 mb-4">
          {!isFinalised ? (
            <button 
              className="flex items-center gap-2 bg-[#5cb85c] text-white px-3 py-1.5 rounded text-[12px] font-bold shadow hover:bg-green-700 transition-colors"
              onClick={() => setShowFinaliseConfirm(true)}
              disabled={saving}
            >
              <FaCheck /> {saving ? 'Finalising...' : 'CCE marks finalise'}
            </button>
          ) : (
            <button 
              className="flex items-center gap-2 bg-[#5cb85c] text-white px-3 py-1.5 rounded text-[12px] font-bold shadow hover:bg-green-700 transition-colors"
              onClick={() => setShowRollbackConfirm(true)}
              disabled={saving}
            >
              Modify CCE Marks
            </button>
          )}

          <button 
            onClick={onBack}
            className="flex items-center gap-2 bg-[#0284c7] text-white px-3 py-1.5 rounded text-[12px] font-bold shadow hover:bg-blue-700 transition-colors"
          >
            <FaCheck size={14} /> Return to List Page
          </button>
        </div>

        {/* Export Button Row (Pic 3) */}
        <div className="flex justify-end mb-4">
          <button 
            onClick={exportPDF}
            className="flex items-center gap-2 bg-[#5cb85c] text-white px-3 py-1.5 rounded text-[12px] font-bold shadow hover:bg-green-700"
          >
            <FaFilePdf size={14} /> Export .pdf
          </button>
        </div>

        {/* ── Consolidated Table ── */}
        <div className="overflow-x-auto border rounded shadow-sm">
          <table className="cia-table-consolidated w-full border-collapse" style={{ fontSize: '11px' }}>
            <thead>
              <tr className="bg-gray-50 font-bold border-b text-center">
                <th className="p-2 border-r min-w-[50px]">SI No.</th>
                <th className="p-2 border-r min-w-[100px]">Student USN</th>
                <th className="p-2 border-r min-w-[200px]">Student Name</th>
                {occasion_groups.map((grp: any, gIdx: number) => (
                  <th key={gIdx} colSpan={grp.sub_occasions.length + 1} className="p-2 border-r uppercase bg-gray-100">
                    {grp.group_name} ({grp.group_max})
                  </th>
                ))}
                <th className="p-2 border-r min-w-[100px] bg-gray-100">Overall CCE Total marks (50.00)</th>
                <th className="p-2 min-w-[100px] bg-gray-100 uppercase">Final CCE Marks Round off(50)</th>
              </tr>
              <tr className="bg-white border-b text-center font-semibold text-gray-700">
                <th colSpan={3} className="border-r"></th>
                {occasion_groups.map((grp: any, gIdx: number) => (
                  <React.Fragment key={gIdx}>
                    {grp.sub_occasions.map((ao: any, aIdx: number) => (
                      <th key={aIdx} className="p-2 border-r">
                        {ao.ao_name} ({ao.max_marks.toFixed(2)})
                      </th>
                    ))}
                    <th className="p-2 border-r bg-blue-50 font-bold">Total ({grp.group_max?.toFixed(2)})</th>
                  </React.Fragment>
                ))}
                <th colSpan={2} className="border-l"></th>
              </tr>
            </thead>
            <tbody>
              {students.map((s: any, idx: number) => (
                <tr key={idx} className="hover:bg-blue-50 border-b border-gray-200">
                  <td className="p-2 border-r text-center text-gray-500">{idx + 1}</td>
                  <td className="p-2 border-r font-mono text-gray-600">{s.student_usn}</td>
                  <td className="p-2 border-r text-gray-700 font-medium">{s.student_name}</td>
                    {occasion_groups.map((grp: any, gIdx: number) => (
                      <React.Fragment key={gIdx}>
                        {grp.sub_occasions.map((ao: any, aIdx: number) => {
                          const m = s.per_ao_marks?.[String(ao.ao_id)];
                          return (
                            <td key={aIdx} className="p-2 border-r text-center text-gray-600">
                              {m !== null && m !== undefined ? Number(m).toFixed(2) : '—'}
                            </td>
                          );
                        })}
                        <td className="p-2 border-r text-center font-bold text-gray-700 bg-blue-50">
                          {s.group_totals?.[grp.group_name]?.toFixed(2) || '0.00'}
                        </td>
                      </React.Fragment>
                    ))}
                  <td className="p-2 border-r text-center font-bold text-[#1e40af]">
                    {s.overall_total?.toFixed(2) || '0.00'}
                  </td>
                  <td className="p-2 text-center font-bold text-gray-800">
                    {s.final_cce_marks || '0'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Buttons (Pic 3) */}
        <div className="mt-8 flex justify-end gap-3">
          {!isFinalised ? (
            <button 
              className="flex items-center gap-2 bg-[#5cb85c] text-white px-3 py-1.5 rounded text-[12px] font-bold shadow hover:bg-green-700"
              onClick={() => setShowFinaliseConfirm(true)}
              disabled={saving}
            >
              <FaCheck /> {saving ? 'Finalising...' : 'CCE marks finalise'}
            </button>
          ) : (
             <button 
              className="flex items-center gap-2 bg-[#5cb85c] text-white px-3 py-1.5 rounded text-[12px] font-bold shadow hover:bg-green-700"
              onClick={() => setShowRollbackConfirm(true)}
              disabled={saving}
            >
              Modify CCE Marks
            </button>
          )}

          <button 
            onClick={onBack}
            className="flex items-center gap-2 bg-[#0284c7] text-white px-3 py-1.5 rounded text-[12px] font-bold shadow hover:bg-blue-700"
          >
            <FaCheck size={14} /> Return to List Page
          </button>
        </div>
      </div>

      {/* ── Custom Confirmation Modals (Pic 4 & 5) ── */}

      {/* Finalise Confirmation */}
      {showFinaliseConfirm && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded w-[600px] shadow-2xl overflow-hidden border border-gray-300">
            <div className="bg-[#1e293b] text-white p-3 flex justify-between items-center">
              <span className="font-bold text-[13px] uppercase tracking-wide">CCE - Marks Finalise Confirmation !!!</span>
              <FaQuestionCircle className="text-blue-300" />
            </div>
            <div className="p-6 border-b border-gray-200">
              <p className="text-[13px] text-gray-700 leading-relaxed">
                Are you sure you want to finalise the selected Section/Division - CCE marks? Once marks are finalised, they cannot be modified or deleted unless a rollback event is initiated for the EMS application.
              </p>
            </div>
            <div className="bg-[#f8fafc] p-3 flex justify-end gap-2">
              <button 
                onClick={handleFinalise}
                className="bg-[#0284c7] text-white px-3 py-1.5 rounded text-[12px] font-bold flex items-center gap-1 hover:bg-blue-700"
              >
                <FaCheck /> Ok
              </button>
              <button 
                onClick={() => setShowFinaliseConfirm(false)}
                className="bg-[#d9534f] text-white px-3 py-1.5 rounded text-[12px] font-bold flex items-center gap-1 hover:bg-red-700"
              >
                <FaTimes /> Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rollback Confirmation */}
      {showRollbackConfirm && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded w-[600px] shadow-2xl overflow-hidden border border-gray-300">
            <div className="bg-[#1e293b] text-white p-3 flex justify-between items-center">
              <span className="font-bold text-[13px] uppercase tracking-wide">CCE - Marks Rollback Confirmation !!!</span>
              <FaQuestionCircle className="text-blue-300" />
            </div>
            <div className="p-6 border-b border-gray-200">
              <p className="text-[13px] text-gray-700 leading-relaxed uppercase font-light">
                CCE marks finalisation will be rolled back. You can modify marks and finalise again.
              </p>
            </div>
            <div className="bg-[#f8fafc] p-3 flex justify-end gap-2">
              <button 
                onClick={handleRollback}
                className="bg-[#0284c7] text-white px-3 py-1.5 rounded text-[12px] font-bold flex items-center gap-1 hover:bg-blue-700"
              >
                <FaCheck /> Ok
              </button>
              <button 
                onClick={() => setShowRollbackConfirm(false)}
                className="bg-[#d9534f] text-white px-3 py-1.5 rounded text-[12px] font-bold flex items-center gap-1 hover:bg-red-700"
              >
                <FaTimes /> Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Success Modal (Pic 2 style) */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded w-[500px] shadow-2xl overflow-hidden border border-gray-300">
            <div className="bg-[#1e293b] text-white p-3 flex justify-between items-center bg-gradient-to-r from-[#1e293b] to-[#334155]">
              <span className="font-bold text-[13px] uppercase tracking-wide">{modalTitle}</span>
              <FaQuestionCircle className="text-blue-300" />
            </div>
            <div className="p-6 border-b border-gray-200 min-h-[100px] flex items-center">
              <p className="text-[13px] text-gray-700 leading-relaxed">
                {successMessage}
              </p>
            </div>
            <div className="bg-white p-3 flex justify-end">
              <button 
                onClick={() => setShowSuccessModal(false)}
                className="bg-[#d9534f] text-white px-4 py-1.5 rounded text-[12px] font-bold flex items-center gap-1 hover:bg-red-700 transition-colors shadow-sm"
              >
                <FaTimes /> Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CiaFinalisePage;

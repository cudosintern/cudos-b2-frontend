import React, { useState, useEffect } from 'react';
import axiosInstance from '../../../../utils/api';
import '../../assessment/cia/cia.css';
import './CiaDataImport.css';
import { FaArrowLeft, FaFileExcel, FaCheck, FaFilePdf } from 'react-icons/fa';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface CiaReportViewProps {
  data: any;
  onBack: () => void;
}

const CiaReportView: React.FC<CiaReportViewProps> = ({ data, onBack }) => {
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const courseId = data.crs_id || data.id;
  const sectionId = data.section_id || null;
  const termId = data.term_id || null;
  const curriculumId = data.curriculum_id || null;

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('crs_id', String(courseId));
      if (sectionId && sectionId !== 0) params.append('section_id', String(sectionId));
      if (termId) params.append('semester_id', String(termId));
      if (curriculumId) params.append('academic_batch_id', String(curriculumId));

      const res = await axiosInstance.get(`/attainment/cce_data_import/consolidated-report?${params.toString()}`);
      setReportData((res.data as any).data);
    } catch (err) {
      console.error('Failed to fetch consolidated report:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = () => {
    if (!reportData) return;
    const { header, occasions, students, summary } = reportData;
    const doc = new jsPDF('landscape');

    doc.setFontSize(16);
    doc.setTextColor(30, 41, 59);
    doc.text('Consolidated CCE Assessment Data Import - Student(s) Marks', 14, 15);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`School: ${header.school} | Program: ${header.program} | Curriculum: ${header.curriculum}`, 14, 22);
    doc.text(`Course: ${header.course} | Term: ${header.term} | Section: ${header.section}`, 14, 27);
    doc.line(14, 30, 280, 30);

    const allQuestions = occasions.flatMap((occ: any) => 
      occ.questions.map((q: any) => ({ ...q, ao_name: occ.ao_name }))
    );

    const head1 = ['Sl No.', 'Student USN', 'Student Name'];
    const head2 = ['', '', ''];
    const head3 = ['', '', ''];
    const head4 = ['', '', ''];

    occasions.forEach((occ: any) => {
      head1.push(`${occ.ao_name} (${occ.max_marks}M)`);
      for (let i = 1; i < occ.questions.length; i++) head1.push('');
      occ.questions.forEach((q: any) => {
        head2.push(`${q.label} (${q.max_marks}M)`);
        head3.push((q.co_mapping || []).join(', '));
        head4.push((q.bloom_level || []).join(', '));
      });
    });

    const bodyRows = students.map((s: any, idx: number) => {
      const row = [idx + 1, s.student_usn, s.student_name];
      allQuestions.forEach((q: any) => {
        const m = s.marks?.[String(q.qp_mq_id)];
        row.push(m !== null && m !== undefined ? Number(m).toFixed(2) : '-');
      });
      return row;
    });

    // Summary Rows
    const attemptedRow = ['No.of Students Attempted(N)', '', ''];
    const thresholdRow = ['No. of Students secured marks >= Threshold%(A)', '', ''];
    const percentageRow = ['% of Students (A/N)* 100', '', ''];

    allQuestions.forEach((q: any) => {
      const summ = summary[String(q.qp_mq_id)];
      attemptedRow.push(String(summ?.attempted || 0));
      thresholdRow.push(String(summ?.above_threshold || 0));
      percentageRow.push(String(summ?.percentage || 0));
    });

    autoTable(doc, {
      startY: 35,
      head: [head1, head2, head3, head4],
      body: [...bodyRows, attemptedRow, thresholdRow, percentageRow],
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59], fontSize: 7, halign: 'center' },
      bodyStyles: { fontSize: 7 },
      margin: { top: 35 }
    });

    doc.save(`Consolidated_CCE_Report_${header.course.split(' ')[0]}.pdf`);
  };

  const exportExcel = () => {
    if (!reportData) return;
    const { header, students, occasions } = reportData;
    const allQuestions = occasions.flatMap((occ: any) => occ.questions);
    
    const flatHeader = ['SI No.', 'Student USN', 'Student Name'];
    allQuestions.forEach((q: any) => flatHeader.push(`${q.label} (${q.max_marks})`));

    const data = students.map((s: any, idx: number) => {
      const row: any[] = [idx + 1, s.student_usn, s.student_name];
      allQuestions.forEach((q: any) => row.push(s.marks?.[String(q.qp_mq_id)] ?? '-'));
      return row;
    });

    const worksheet = XLSX.utils.aoa_to_sheet([flatHeader, ...data]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'CCE Report');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([excelBuffer], { type: 'application/octet-stream' }), `CCE_Report_${header.course.split(' ')[0]}.xlsx`);
  };

  if (loading) {
    return (
      <div className="cia-container">
        <div className="text-center py-20 text-gray-400 italic">
          Loading Consolidated Report...
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="cia-container">
        <button onClick={onBack} className="cia-btn cia-btn-outline mb-4">
          <FaArrowLeft /> Back to List
        </button>
        <div className="text-center py-20 text-red-400">
          Failed to load report data.
        </div>
      </div>
    );
  }

  const { header, occasions, students, summary } = reportData;

  // Flatten all questions across occasions for horizontal mapping
  const allQuestions = occasions.flatMap((occ: any) => 
    occ.questions.map((q: any) => ({ ...q, ao_name: occ.ao_name, ao_max: occ.max_marks }))
  );

  return (
    <div className="cia-container max-w-full">
      {/* ── Page Header (Pic 2 style) ── */}
      <div className="bg-[#1e293b] text-white p-3 rounded-t shadow-lg flex justify-between items-center mb-0">
        <h2 className="text-sm font-bold uppercase tracking-wide">
          Consolidated CCE_SEE Assessment Data Import - Student(s) Marks
        </h2>
        <div className="flex gap-2">
          <span className="cursor-pointer hover:text-blue-300">
            <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="18" width="18" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          </span>
        </div>
      </div>

      <div className="bg-white border-x border-b p-4 shadow-sm mb-6">
        {/* Metadata Grid (Pic 2 Layout) */}
        <div className="grid grid-cols-4 gap-4 text-[12px] mb-4">
          <div className="flex gap-2">
            <span className="font-semibold text-gray-500">School:</span>
            <span className="text-blue-600 font-medium">{header.school}</span>
          </div>
          <div className="flex gap-2">
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
              {header.curriculum}_{header.course.split(' ')[0]}_CCE_SEE.xls
              <FaFileExcel size={12} className="text-green-700" />
            </span>
          </div>
        </div>

        {/* Action Button Area (Pic 2 style) */}
        <div className="flex justify-end mb-4">
          <button 
            onClick={exportPDF}
            className="flex items-center gap-2 bg-[#5cb85c] text-white px-3 py-1.5 rounded text-[12px] font-bold shadow hover:bg-green-700"
          >
            <FaFilePdf size={14} /> Export .pdf
          </button>
        </div>
        <div className="overflow-x-auto border rounded shadow-sm">
          <table className="cia-table-consolidated w-full border-collapse" style={{ fontSize: '11px' }}>
            <thead>
              {/* Row 1: Indicators / Occasions */}
              <tr className="bg-gray-50 font-bold border-b">
                <th colSpan={3} className="p-2 border-r text-left bg-gray-100 uppercase tracking-widest text-[#1e293b]">
                  Indicators
                </th>
                {occasions.map((occ: any) => (
                  <th key={occ.ao_id} colSpan={occ.questions.length} className="p-2 border-r text-center">
                    {occ.ao_name} ({occ.max_marks}M)
                  </th>
                ))}
              </tr>

              {/* Row 2: Description (Labels) */}
              <tr className="bg-white border-b">
                <th colSpan={3} className="p-2 border-r text-left text-gray-600 font-semibold bg-gray-50">
                  Description
                </th>
                {allQuestions.map((q: any, idx: number) => (
                  <th key={idx} className="p-2 border-r text-center font-bold text-gray-700">
                    {q.label} ({q.max_marks.toFixed(2)}M)
                  </th>
                ))}
              </tr>

              {/* Row 3: CO Mapping */}
              <tr className="bg-gray-50 border-b">
                <th colSpan={3} className="p-2 border-r text-left text-gray-600 font-semibold">
                  CO Mapping
                </th>
                {allQuestions.map((q: any, idx: number) => (
                  <th key={idx} className="p-2 border-r text-center text-blue-800 italic">
                    {(q.co_mapping || []).join(', ') || '—'}
                  </th>
                ))}
              </tr>

              {/* Row 4: PO Mapping */}
              <tr className="bg-white border-b">
                <th colSpan={3} className="p-2 border-r text-left text-gray-600 font-semibold bg-gray-50">
                  PO Mapping
                </th>
                {allQuestions.map((q: any, idx: number) => (
                  <th key={idx} className="p-2 border-r text-center text-green-700">
                    {(q.po_mapping || []).join(', ') || '—'}
                  </th>
                ))}
              </tr>

              {/* Row 5: Bloom's Level */}
              <tr className="bg-gray-50 border-b-2">
                <th colSpan={3} className="p-2 border-r text-left text-gray-600 font-semibold">
                  Bloom's Level
                </th>
                {allQuestions.map((q: any, idx: number) => (
                  <th key={idx} className="p-2 border-r text-center text-purple-700">
                    {(q.bloom_level || []).join(', ') || '—'}
                  </th>
                ))}
              </tr>

              {/* Row 6: Static headers for student data */}
              <tr className="bg-gray-100 text-gray-700 font-bold border-b">
                <th className="p-2 border-r w-[50px] text-center">Sl No.</th>
                <th className="p-2 border-r w-[120px] text-left">Student USN</th>
                <th className="p-2 border-r text-left">Student Name</th>
                {allQuestions.map((q: any, idx: number) => (
                  <th key={idx} className="p-2 border-r text-center bg-[#f8fafc]">
                    {q.label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {students.map((s: any, sIdx: number) => (
                <tr key={sIdx} className="hover:bg-blue-50 border-b border-gray-200">
                  <td className="p-2 border-r text-center text-gray-500">{sIdx + 1}</td>
                  <td className="p-2 border-r font-mono text-gray-600">{s.student_usn}</td>
                  <td className="p-2 border-r text-gray-700 font-medium">{s.student_name}</td>
                    {allQuestions.map((q: any, qIdx: number) => {
                      const mark = s.marks?.[String(q.qp_mq_id)];
                      return (
                        <td key={qIdx} className="p-2 border-r text-center text-gray-600">
                          {mark !== null && mark !== undefined ? Number(mark).toFixed(2) : '—'}
                        </td>
                      );
                    })}
                </tr>
              ))}
            </tbody>

            {/* Footer Summary (Pic 2 style) */}
            <tfoot className="bg-gray-50 font-medium">
              <tr className="border-t border-gray-300">
                <td colSpan={3} className="p-2 border-r text-left font-bold text-gray-700">
                  No.of Students Attempted(N)
                </td>
                {allQuestions.map((q: any, idx: number) => (
                  <td key={idx} className="p-2 border-r text-center text-blue-600 font-bold">
                    {summary[String(q.qp_mq_id)]?.attempted || 0}
                  </td>
                ))}
              </tr>
              <tr className="border-t border-gray-300">
                <td colSpan={3} className="p-2 border-r text-left font-bold text-gray-700">
                  No. of Students secured marks &gt;= Threshold%(A)
                </td>
                {allQuestions.map((q: any, idx: number) => (
                  <td key={idx} className="p-2 border-r text-center text-green-600 font-bold">
                    {summary[String(q.qp_mq_id)]?.above_threshold || 0}
                  </td>
                ))}
              </tr>
              <tr className="border-t border-gray-300">
                <td colSpan={3} className="p-2 border-r text-left font-bold text-gray-700 uppercase tracking-tighter">
                  % of Students (A/N)* 100
                </td>
                {allQuestions.map((q: any, idx: number) => (
                  <td key={idx} className="p-2 border-r text-center text-orange-600 font-bold">
                    {summary[String(q.qp_mq_id)]?.percentage || 0}
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Back Button Footer (Pic 2 style) */}
        <div className="mt-8 flex justify-end">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 bg-[#1e40af] text-white px-4 py-2 rounded text-sm font-bold shadow hover:bg-blue-800 transition-colors"
          >
            <FaCheck size={14} /> Return to List Page
          </button>
        </div>
      </div>
    </div>
  );
};

export default CiaReportView;

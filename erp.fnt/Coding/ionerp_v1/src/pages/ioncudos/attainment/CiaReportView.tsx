import React, { useState, useEffect } from 'react';
import axiosInstance from '../../../utils/api';
import { FaArrowLeft, FaFileDownload, FaPrint } from 'react-icons/fa';

interface CiaReportViewProps {
  data: any;
  onBack: () => void;
}

const CiaReportView: React.FC<CiaReportViewProps> = ({ data, onBack }) => {
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await axiosInstance.get(`/assessments/manage_cia_report/view?crs_id=${data.crs_id}&semester_id=${data.term_id}`);
        setReportData((res.data as any).data || null);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [data]);

  return (
    <div className="bg-white p-8 rounded-xl shadow-xl border border-gray-100 max-w-full mx-auto mt-4 font-sans animate-page-in">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-[#4a8494] hover:text-[#3a6a77] font-bold text-sm mb-4 transition-colors"
          >
            <FaArrowLeft /> Back to Course List
          </button>
          <h3 className="text-2xl font-bold text-[#4a8494] mb-1">
            Consolidated Assessment Report - {data.course_title}
          </h3>
          <p className="text-sm text-gray-500">
            View student performance across all CCE occasions
          </p>
        </div>
        <div className="flex gap-3">
           <button className="px-4 py-2 border border-gray-300 rounded font-bold text-xs text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm">
             <FaFileDownload /> Export PDF
           </button>
           <button className="px-4 py-2 border border-gray-300 rounded font-bold text-xs text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm">
             <FaPrint /> Print
           </button>
        </div>
      </div>

      <div className="border-b border-gray-100 my-6" />

      {/* Report Container */}
      <div className="bg-[#f8fafc] p-10 border border-gray-200 rounded-lg">
         {loading ? (
            <div className="text-center py-20 text-gray-500 italic">Generating consolidated report...</div>
         ) : (
            <div className="bg-white p-8 shadow-inner border border-gray-100 min-h-[500px]">
               <div className="text-center mb-10">
                  <h4 className="text-xl font-bold uppercase tracking-widest text-gray-800">Consolidated CCE Report</h4>
                  <div className="text-xs text-gray-500 mt-2 uppercase tracking-tighter">Academic Session: 2023-24 | Semester: {data.term_name || 'N/A'}</div>
               </div>
               
               <div className="grid grid-cols-2 gap-8 mb-10 text-xs">
                  <div>
                    <div className="p-2 border-b flex justify-between"><span className="text-gray-400">Course Code:</span><span className="font-bold">{data.crs_code}</span></div>
                    <div className="p-2 border-b flex justify-between"><span className="text-gray-400">Course Title:</span><span className="font-bold">{data.course_title}</span></div>
                  </div>
                  <div>
                    <div className="p-2 border-b flex justify-between"><span className="text-gray-400">Instructor:</span><span className="font-bold">{data.instructor}</span></div>
                    <div className="p-2 border-b flex justify-between"><span className="text-gray-400">Total Students:</span><span className="font-bold">{data.total_students || '0'}</span></div>
                  </div>
               </div>

               <div className="text-center py-20 bg-gray-50 text-gray-400 italic rounded">
                  Report visualization placeholder.
                  <br/>Data represents aggregated marks from all assessment occasions.
               </div>
            </div>
         )}
      </div>
    </div>
  );
};

export default CiaReportView;

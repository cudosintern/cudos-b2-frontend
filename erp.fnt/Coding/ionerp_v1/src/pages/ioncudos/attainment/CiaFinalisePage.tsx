import React, { useState } from 'react';
import axiosInstance from '../../../utils/api';
import { FaArrowLeft, FaCheckDouble, FaLock } from 'react-icons/fa';

interface CiaFinalisePageProps {
  data: any;
  onBack: () => void;
}

const CiaFinalisePage: React.FC<CiaFinalisePageProps> = ({ data, onBack }) => {
  const [finalising, setFinalising] = useState(false);
  const [isFinalised, setIsFinalised] = useState(false);

  const handleFinalise = async () => {
    if (!window.confirm("Are you sure you want to finalise the marks? Once finalised, you will not be able to modify them without administrator approval.")) return;
    
    setFinalising(true);
    try {
      await axiosInstance.post(`/assessments/manage_cia_marks/finalise`, {
        crs_id: data.crs_id,
        semester_id: data.term_id
      });
      setIsFinalised(true);
      alert('Marks finalised successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to finalise marks. Please check if all occasions are completed.');
    } finally {
      setFinalising(false);
    }
  };

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
            View & Finalise CCE Marks - {data.course_title}
          </h3>
          <p className="text-sm text-gray-500">
            Review the summary and lock the marks for the current term
          </p>
        </div>
      </div>

      <div className="border-b border-gray-100 my-6" />

      {/* Summary Section */}
      <div className="max-w-4xl mx-auto">
         <div className="bg-blue-50 border border-blue-200 p-8 rounded-xl shadow-sm mb-10">
            <h4 className="text-lg font-bold text-[#1e40af] mb-6 flex items-center gap-2">
               <FaCheckDouble /> Finalisation Summary
            </h4>
            <div className="grid grid-cols-2 gap-10">
               <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                     <span className="text-gray-500">Total Students:</span>
                     <span className="font-bold text-gray-800">{data.total_students || '0'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                     <span className="text-gray-500">Marks Entered:</span>
                     <span className="font-bold text-gray-800">{data.marks_entered || '0'}</span>
                  </div>
               </div>
               <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                     <span className="text-gray-500">Completion Status:</span>
                     <span className="font-bold text-green-600">READY</span>
                  </div>
                  <div className="flex justify-between text-sm">
                     <span className="text-gray-500">Missing Marks:</span>
                     <span className="font-bold text-red-600">0</span>
                  </div>
               </div>
            </div>
         </div>

         <div className="bg-amber-50 border border-amber-200 p-8 rounded-xl mb-10">
            <h4 className="text-sm font-bold text-amber-800 mb-2 uppercase tracking-wide">Important Notice</h4>
            <p className="text-xs text-amber-700 leading-relaxed">
               Finalising marks will submit them to the controller of examinations. 
               This action is irreversible and will lock the marks entry for this course. 
               Please ensure all data is correct before proceeding.
            </p>
         </div>

         <div className="flex justify-center">
            <button 
              onClick={handleFinalise}
              disabled={finalising || isFinalised}
              className={`px-12 py-4 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center gap-4 ${
                isFinalised 
                  ? 'bg-gray-400 text-white cursor-default' 
                  : 'bg-[#4a8494] text-white hover:bg-[#3a6a77] hover:scale-105'
              }`}
            >
              <FaLock /> {finalising ? 'Finalising...' : isFinalised ? 'Finalisation Completed' : 'Finalise CCE Marks'}
            </button>
         </div>
      </div>
    </div>
  );
};

export default CiaFinalisePage;

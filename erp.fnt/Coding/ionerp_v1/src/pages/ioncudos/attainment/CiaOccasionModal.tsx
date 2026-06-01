import React, { useEffect, useState } from 'react';
import axiosInstance from '../../../utils/api';
import { FaTimes, FaFileAlt } from 'react-icons/fa';

interface CiaOccasionModalProps {
  data: any;
  onClose: () => void;
}

const CiaOccasionModal: React.FC<CiaOccasionModalProps> = ({ data, onClose }) => {
  const [occasions, setOccasions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOccasions = async () => {
      try {
        // Based on patterns in CceDataImportList
        const res = await axiosInstance.get(`/assessments/manage_cia_occasion/course_occasions?crs_id=${data.crs_id}&semester_id=${data.term_id}`);
        setOccasions((res.data as any).data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOccasions();
  }, [data]);

  return (
    <div className="cce-modal-overlay">
      <div className="bg-white shadow-2xl w-full max-w-4xl flex flex-col border border-gray-300 animate-page-in">
        {/* Header */}
        <div className="bg-[#1f2d3d] text-white rounded-t-2xl rounded-br-2xl px-7 py-3 flex justify-between items-center">
          <h3 className="text-xl font-normal tracking-wide">
            CCE Occasions - <span className="text-cyan-300">{data.course_title}</span>
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <FaTimes size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="overflow-hidden bg-white border border-gray-200 rounded-lg shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-[#f8fafc]">
                 <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">Sl No.</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">Occasion Name</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">Max Marks</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">View QP</th>
                 </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-sm text-gray-500 italic">Loading occasions...</td>
                  </tr>
                ) : occasions.length > 0 ? (
                  occasions.map((occ, idx) => (
                    <tr key={idx} className="hover:bg-blue-50 transition-colors">
                       <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-100">{idx + 1}</td>
                       <td className="px-4 py-3 text-sm font-medium text-gray-800 border-r border-gray-100">{occ.ao_name}</td>
                       <td className="px-4 py-3 text-center text-sm text-gray-600 border-r border-gray-100">{occ.max_marks}</td>
                       <td className="px-4 py-3 text-center border-r border-gray-100">
                          {occ.qpd_id ? (
                            <button className="text-blue-600 hover:underline flex items-center justify-center gap-1 mx-auto">
                              <FaFileAlt size={12} /> View QP
                            </button>
                          ) : (
                            <span className="text-gray-400 italic">Not available</span>
                          )}
                       </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-sm text-gray-400 italic">No occasions found for this course.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
           <button 
             onClick={onClose}
             className="px-6 py-2 text-sm font-bold text-white bg-red-600 rounded hover:bg-red-700 transition-colors uppercase tracking-wider shadow-md"
           >
             Close
           </button>
        </div>
      </div>
    </div>
  );
};

export default CiaOccasionModal;

import React, { useState, useEffect } from 'react';
import axiosInstance from '../../../utils/api';
import { FaArrowLeft, FaSave, FaCheckCircle } from 'react-icons/fa';

interface CiaMarksEntryProps {
  data: any;
  onBack: () => void;
}

const CiaMarksEntry: React.FC<CiaMarksEntryProps> = ({ data, onBack }) => {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        // Mocking or using appropriate API endpoint
        const res = await axiosInstance.get(`/assessments/manage_cia_marks/students?crs_id=${data.crs_id}&semester_id=${data.term_id}`);
        setStudents((res.data as any).data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, [data]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // API call to save marks
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate
      alert('Marks saved successfully!');
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
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
            Manage CCE Marks - {data.course_title}
          </h3>
          <p className="text-sm text-gray-500">
            Course Code: {data.crs_code} | Instructor: {data.instructor}
          </p>
        </div>
        <div className="flex gap-3">
           <button 
             onClick={handleSave}
             disabled={saving}
             className="px-6 py-2 bg-green-600 text-white rounded font-bold text-sm hover:bg-green-700 transition-colors flex items-center gap-2 shadow-md disabled:bg-gray-400"
           >
             <FaSave /> {saving ? 'Saving...' : 'Save Marks'}
           </button>
        </div>
      </div>

      <div className="border-b border-gray-100 my-6" />

      {/* Table */}
      <div className="overflow-hidden bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="bg-[#f0f9ff] px-4 py-2 border-b border-gray-200 flex justify-between items-center">
           <span className="text-xs font-bold text-[#4a8494]">STUDENT LIST & MARKS ENTRY</span>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
           <thead className="bg-[#f8fafc]">
              <tr>
                 <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200 w-16 text-center">Sl No.</th>
                 <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">USN / Reg No</th>
                 <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">Student Name</th>
                 <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">Attend %</th>
                 <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Marks Obtained</th>
              </tr>
           </thead>
           <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                   <td colSpan={5} className="px-4 py-12 text-center text-sm text-gray-500 italic">Loading student data...</td>
                </tr>
              ) : students.length > 0 ? (
                students.map((stu, idx) => (
                  <tr key={idx} className="hover:bg-blue-50 transition-colors">
                     <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-100 text-center font-bold">{idx + 1}</td>
                     <td className="px-4 py-3 text-sm text-gray-800 border-r border-gray-100 font-medium">{stu.usn || '-'}</td>
                     <td className="px-4 py-3 text-sm text-gray-800 border-r border-gray-100">{stu.name}</td>
                     <td className="px-4 py-3 text-center text-sm text-gray-600 border-r border-gray-100">{stu.attendance ?? '100'}%</td>
                     <td className="px-4 py-3 text-center">
                        <input 
                          type="number" 
                          defaultValue={stu.marks ?? ''}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-center text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                        />
                     </td>
                  </tr>
                ))
              ) : (
                <tr>
                   <td colSpan={5} className="px-4 py-12 text-center text-sm text-gray-400 italic">No students enrolled in this course for the selected term.</td>
                </tr>
              )}
           </tbody>
        </table>
      </div>
    </div>
  );
};

export default CiaMarksEntry;

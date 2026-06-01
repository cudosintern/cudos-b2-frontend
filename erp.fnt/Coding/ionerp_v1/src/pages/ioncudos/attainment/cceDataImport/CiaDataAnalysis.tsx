import React, { useState, useEffect } from 'react';
import axiosInstance from '../../../../utils/api';
import { FaQuestionCircle, FaTimes } from 'react-icons/fa';

interface CiaDataAnalysisProps {
  aoData: any;
  onBack: () => void;
}

const CiaDataAnalysis: React.FC<CiaDataAnalysisProps> = ({ aoData, onBack }) => {
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchViewData();
  }, []);

  const fetchViewData = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/attainment/cce_data_import/view-marks?ao_id=${aoData.ao_id}`);
      setAnalysisData((res.data as any).data);
    } catch (err) {
      console.error('Failed to fetch data analysis', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="cia-container p-4 min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-pulse text-slate-400 font-bold italic">Loading analysis...</div>
      </div>
    );
  }

  if (!analysisData || !analysisData.columns) {
    return (
      <div className="cia-container p-4 min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <div className="text-red-500 font-bold">Failed to load analysis or no data available.</div>
        <button onClick={onBack} className="bg-slate-500 text-white px-6 py-2 rounded-lg shadow-md transition-all hover:bg-slate-600">Go Back</button>
      </div>
    );
  }

  const { columns, students, header } = analysisData;

  // Calculation Logic: Map each column (Question) to its metrics
  const questionAnalysis = columns.map((col: any) => {
    const qidStr = String(col.qp_mq_id);
    const scores = students
      .map((s: any) => s.marks[qidStr])
      .filter((v: any) => v !== null && v !== undefined && v !== '')
      .map((v: any) => Number(v));

    const numAttempts = scores.length;
    const sum = scores.reduce((a: number, b: number) => a + b, 0);
    const average = numAttempts > 0 ? sum / numAttempts : 0;
    
    // Standard Deviation calculation
    const variance = numAttempts > 0 
      ? scores.map((x: number) => Math.pow(x - average, 2)).reduce((a: number, b: number) => a + b, 0) / numAttempts 
      : 0;
    const sd = Math.sqrt(variance);

    const min = numAttempts > 0 ? Math.min(...scores) : 0;
    const max = numAttempts > 0 ? Math.max(...scores) : 0;
    const attemptPercentage = students.length > 0 ? (numAttempts / students.length) * 100 : 0;
    const attainmentPercentage = col.max_marks > 0 ? (average / col.max_marks) * 100 : 0;

    return {
      label: col.label,
      bloomLevel: col.bloom_level || 'N/A',
      co: col.co_code || 'N/A',
      maxMarks: col.max_marks,
      average: average.toFixed(2),
      sd: sd.toFixed(2),
      minInRange: min,
      maxInRange: max,
      numAttempts: numAttempts,
      percentageAttempt: attemptPercentage.toFixed(0),
      percentageAttainment: attainmentPercentage.toFixed(1)
    };
  });

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[1px] z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-in border border-slate-200">
        
        {/* Modal Header */}
        <div className="bg-[#2b3e50] text-white px-6 py-4 flex justify-between items-center shrink-0">
          <h3 className="text-lg font-bold flex items-center gap-2">
            Imported Student Data Analysis
          </h3>
          <div className="bg-blue-400/20 p-1.5 rounded-full cursor-help hover:bg-blue-400/40 transition-colors">
            <FaQuestionCircle className="text-blue-200" size={18} />
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-white custom-scrollbar">
          
          <h2 className="text-blue-600 text-2xl font-semibold mb-8 text-center tracking-tight">
            Question Level Analysis
          </h2>

          {/* Analysis Table */}
          <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm mb-8">
            <table className="min-w-full border-collapse">
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 min-w-[200px] border-r border-gray-200 sticky left-0 z-10">Bloom's Level</td>
                  {questionAnalysis.map((q: any, i: number) => (
                    <td key={i} className="px-6 py-3 text-sm font-bold text-slate-800 text-center border-r last:border-r-0 min-w-[120px]">{q.bloomLevel}</td>
                  ))}
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 border-r border-gray-200 sticky left-0 z-10">Question</td>
                  {questionAnalysis.map((q: any, i: number) => (
                    <td key={i} className="px-6 py-3 text-sm text-slate-600 text-center border-r last:border-r-0">{q.label}</td>
                  ))}
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 border-r border-gray-200 sticky left-0 z-10">CO</td>
                  {questionAnalysis.map((q: any, i: number) => (
                    <td key={i} className="px-6 py-3 text-sm text-slate-600 text-center border-r last:border-r-0 italic">{q.co}</td>
                  ))}
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 border-r border-gray-200 sticky left-0 z-10">Marks</td>
                  {questionAnalysis.map((q: any, i: number) => (
                    <td key={i} className="px-6 py-3 text-sm text-slate-600 text-center border-r last:border-r-0">{q.maxMarks}</td>
                  ))}
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 border-r border-gray-200 sticky left-0 z-10">Average</td>
                  {questionAnalysis.map((q: any, i: number) => (
                    <td key={i} className="px-6 py-3 text-sm font-bold text-slate-700 text-center border-r last:border-r-0">{q.average}</td>
                  ))}
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 border-r border-gray-200 sticky left-0 z-10">Standard Deviation</td>
                  {questionAnalysis.map((q: any, i: number) => (
                    <td key={i} className="px-6 py-3 text-sm text-slate-600 text-center border-r last:border-r-0">{q.sd}</td>
                  ))}
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 border-r border-gray-200 sticky left-0 z-10">Min In Range</td>
                  {questionAnalysis.map((q: any, i: number) => (
                    <td key={i} className="px-6 py-3 text-sm text-slate-600 text-center border-r last:border-r-0">{q.minInRange}</td>
                  ))}
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 border-r border-gray-200 sticky left-0 z-10">Max in Range</td>
                  {questionAnalysis.map((q: any, i: number) => (
                    <td key={i} className="px-6 py-3 text-sm text-slate-600 text-center border-r last:border-r-0">{q.maxInRange}</td>
                  ))}
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 border-r border-gray-200 sticky left-0 z-10">Number of attempts</td>
                  {questionAnalysis.map((q: any, i: number) => (
                    <td key={i} className="px-6 py-3 text-sm text-slate-600 text-center border-r last:border-r-0">{q.numAttempts}</td>
                  ))}
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 border-r border-gray-200 sticky left-0 z-10">Percentage of Attempt</td>
                  {questionAnalysis.map((q: any, i: number) => (
                    <td key={i} className="px-6 py-3 text-sm text-slate-600 text-center border-r last:border-r-0">{q.percentageAttempt}</td>
                  ))}
                </tr>
                <tr>
                  <td className="bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 border-r border-gray-200 sticky left-0 z-10">Percentage of Attainment</td>
                  {questionAnalysis.map((q: any, i: number) => (
                    <td key={i} className="px-6 py-3 text-sm font-bold text-slate-700 text-center border-r last:border-r-0">{q.percentageAttainment}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Footer Notes */}
          <div className="space-y-3 pt-6 border-t border-gray-100">
            <h5 className="font-bold text-sm text-slate-800">Note:</h5>
            <p className="text-[13px] text-gray-600 leading-relaxed">
              <span className="font-black text-slate-700">Standard Deviation -</span> Take the mean of the data(secured marks for each question), then add the squared differences of the each data and mean. Further divide the result by count of data set, fetch the square root of the resulting value.
            </p>
            <p className="text-[13px] text-gray-600 leading-relaxed">
              <span className="font-black text-slate-700">Percentage of Attainment -</span> (Average * 100 / Marks).
            </p>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-8 py-6 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 px-8 py-2.5 bg-[#dc2626] hover:bg-[#b91c1c] text-white font-bold rounded shadow-md transition-all active:scale-95 text-sm uppercase tracking-wider"
          >
            <FaTimes /> Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CiaDataAnalysis;

import React from 'react';
import { FaCalculator } from 'react-icons/fa';
import { useCiaAttainment } from './useCiaAttainment';
import CiaAttainmentFilters from './CiaAttainmentFilters';
import { AttainmentData } from './ciaAttainmentTypes';

const CiaAttainmentPage: React.FC = () => {
  const {
    curriculums, terms, courses, sections, occasions,
    filters, attainmentData, loading, calculationLoading,
    handleFilterChange, calculateAttainment,
  } = useCiaAttainment();

  const renderAttainmentResults = (data: AttainmentData) => (
    <div className="mt-8 space-y-6">
      {data.status === "Rolled0ut" ? (
        <>
          <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-sm">
            <h4 className="text-lg font-semibold text-gray-700 mb-3">Target Levels</h4>
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Level</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Value</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Direct %</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Target %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.levels.map((l, i) => (
                  <tr key={i}>
                    <td className="px-4 py-2">{l.name}</td>
                    <td className="px-4 py-2">{l.value}</td>
                    <td className="px-4 py-2">{l.direct_percentage}%</td>
                    <td className="px-4 py-2">{l.target_percentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-sm">
            <h4 className="text-lg font-semibold text-gray-700 mb-3">CO Attainment</h4>
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">CO</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Threshold Attainment</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Avg Attainment</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.co_attainment.map((co) => (
                  <tr key={co.co_id}>
                    <td className="px-4 py-2 font-bold">{co.co_code}</td>
                    <td className="px-4 py-2">{co.threshold_attainment.toFixed(2)}%</td>
                    <td className="px-4 py-2">{co.average_attainment.toFixed(2)}%</td>
                    <td className="px-4 py-2">{co.attainment_level}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-blue-50 p-4 border border-blue-200 rounded-lg flex justify-between items-center">
             <div>
               <p className="text-sm text-blue-700">Course Attainment</p>
               <p className="text-2xl font-bold text-blue-900">{data.course_attainment.toFixed(2)}%</p>
             </div>
             <div className="text-right">
               <p className="text-sm text-blue-700">After Weightage</p>
               <p className="text-2xl font-bold text-blue-900">{data.course_attainment_after_weightage.toFixed(2)}%</p>
             </div>
          </div>

          <div className="bg-gray-50 h-64 rounded-lg border border-dashed border-gray-300 flex items-center justify-center text-gray-400 italic">
            Chart Visualization Placeholder
          </div>
        </>
      ) : (
        <div className="bg-red-50 p-6 rounded-lg border border-red-200 text-red-800">
          <p className="font-bold mb-2">Calculation Blocked: {data.status}</p>
          <ul className="list-disc list-inside text-sm">
            {data.blocking_messages.map((m, i) => <li key={i}>{m}</li>)}
          </ul>
        </div>
      )}
    </div>
  );

  return (
    <div className="w-full p-8 font-sans">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-gray-800">CO Attainment (CIA) Analysis</h3>
        <button
          onClick={calculateAttainment}
          disabled={calculationLoading || !filters.sectionId || filters.occasionIds.length === 0}
          className="px-6 py-2 bg-[#4a8494] text-white rounded-lg font-bold hover:bg-[#3a6a77] transition-all flex items-center gap-2 disabled:bg-gray-300"
        >
          <FaCalculator /> {calculationLoading ? 'Calculating...' : 'Calculate Attainment'}
        </button>
      </div>

      <CiaAttainmentFilters
        curriculums={curriculums}
        terms={terms}
        courses={courses}
        sections={sections}
        occasions={occasions}
        filters={filters}
        onFilterChange={handleFilterChange}
        loading={loading}
      />

      {calculationLoading && (
        <div className="flex flex-col items-center justify-center py-20 animate-pulse">
          <div className="w-12 h-12 border-4 border-[#4a8494] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-500 font-medium">Crunching attainment data...</p>
        </div>
      )}

      {!calculationLoading && attainmentData && renderAttainmentResults(attainmentData)}
      
      {!calculationLoading && !attainmentData && (
        <div className="py-20 text-center text-gray-400 italic">
          Select filters and click Calculate to view attainment analysis.
        </div>
      )}
    </div>
  );
};

export default CiaAttainmentPage;
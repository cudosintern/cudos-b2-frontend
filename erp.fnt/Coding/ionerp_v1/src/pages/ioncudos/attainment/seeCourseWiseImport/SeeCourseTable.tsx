import React from 'react';
import { Course } from './seeImportTypes';

interface SeeCourseTableProps {
  courses: Course[];
  totalCourses: number;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  onUploadQP: (course: Course) => void;
  onViewQP: (course: Course) => void;
  onDownload: (course: Course) => void;
  onImport: (course: Course) => void;
  onViewImport: (course: Course) => void;
}

const SeeCourseTable: React.FC<SeeCourseTableProps> = ({
  courses,
  totalCourses,
  pageSize,
  onPageSizeChange,
  onUploadQP,
  onViewQP,
  onDownload,
  onImport,
  onViewImport,
}) => {

  return (
    <div className="border border-slate-300 rounded-md overflow-hidden bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-100 text-[11px] text-slate-700 uppercase font-bold border-b border-slate-300">
            <tr>
              <th className="px-3 py-2 border-r border-slate-200">Sl No</th>
              <th className="px-3 py-2 border-r border-slate-200">Code</th>
              <th className="px-3 py-2 border-r border-slate-200">Course Title</th>
              <th className="px-3 py-2 border-r border-slate-200 text-center">Core / Elective</th>
              <th className="px-3 py-2 border-r border-slate-200 text-center">Credits</th>
              <th className="px-3 py-2 border-r border-slate-200 text-center">Total Marks</th>
              <th className="px-3 py-2 border-r border-slate-200">Course Owner</th>
              <th className="px-3 py-2 border-r border-slate-200">Mode</th>
              <th className="px-3 py-2 border-r border-slate-200 text-center">Upload QP / View QP</th>
              <th className="px-3 py-2 text-center">Template Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {courses.length === 0 ? (
              <tr>
                <td colSpan={11} className="text-center py-10 text-slate-400 font-medium italic">
                  No data available for the selected criteria
                </td>
              </tr>
            ) : (
              courses.map((course, index) => (
                <tr key={course.course_id} className="hover:bg-slate-50 transition-colors text-sm group">
                  <td className="px-3 py-2 border-r border-slate-100 text-slate-500 font-mono text-xs">{index + 1}</td>
                  <td className="px-3 py-2 border-r border-slate-100 font-bold text-slate-700">{course.course_code}</td>
                  <td className="px-3 py-2 border-r border-slate-100 text-slate-600 font-medium">{course.course_title}</td>
                  <td className="px-3 py-2 border-r border-slate-100 text-center text-slate-600 font-medium">{course.course_type}</td>
                  <td className="px-3 py-2 border-r border-slate-100 text-center text-slate-600 font-medium">{course.credits}</td>
                  <td className="px-3 py-2 border-r border-slate-100 text-center text-slate-600 font-medium">{course.total_marks}</td>
                  <td className="px-3 py-2 border-r border-slate-100 text-slate-600 font-medium">{course.course_owner}</td>
                  <td className="px-3 py-2 border-r border-slate-100 text-slate-600 font-medium">{course.mode}</td>

                  {/* Upload QP / View QP */}
                  <td className="px-3 py-2 border-r border-slate-100">
                    <div className="flex items-center justify-center gap-2 text-blue-600 text-[13px] font-bold">
                      <span
                        onClick={() => onUploadQP(course)}
                        className="cursor-pointer hover:underline hover:text-blue-800 transition-colors"
                      >
                        Upload
                      </span>
                      <span className="text-slate-300 font-normal">|</span>
                      <span
                        onClick={() => onViewQP(course)}
                        className="cursor-pointer hover:underline hover:text-blue-800 transition-colors"
                      >
                        View
                      </span>
                    </div>
                  </td>

                  {/* Template Actions: Download | Import | View */}
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-center gap-2 text-blue-600 text-[13px] font-bold">
                      <span 
                        onClick={() => onDownload(course)}
                        className="cursor-pointer hover:underline hover:text-blue-800 transition-colors"
                      >
                        Download
                      </span>
                      <span className="text-slate-300 font-normal">|</span>
                      <span 
                        onClick={() => onImport(course)}
                        className="cursor-pointer hover:underline hover:text-blue-800 transition-colors"
                      >
                        Import
                      </span>
                      <span className="text-slate-300 font-normal">|</span>
                      <span 
                        onClick={() => onViewImport(course)}
                        className="cursor-pointer hover:underline hover:text-blue-800 transition-colors"
                      >
                        View
                      </span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer - Right Aligned to match reference */}
      <div className="flex justify-end items-center px-4 py-2 border-t bg-slate-50 text-[13px] text-slate-800 gap-8 h-12">
        <div className="flex items-center gap-2">
          <span>Page Size:</span>
          <select 
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="border border-slate-300 rounded px-2 py-0.5 text-xs outline-none focus:ring-1 focus:ring-blue-500 bg-white cursor-pointer shadow-sm min-w-[50px]"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>

        <div className="font-bold">
          {courses.length > 0 ? 1 : 0} to {courses.length} of {totalCourses}
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button disabled className="p-1 px-1.5 text-slate-400 hover:text-blue-600 cursor-not-allowed">
              <span className="text-sm font-mono tracking-tighter">|&lt;</span>
            </button>
            <button disabled className="p-1 px-1.5 text-slate-400 hover:text-blue-600 cursor-not-allowed">
              <span className="text-sm font-mono tracking-tighter">&lt;</span>
            </button>
          </div>

          <div className="flex items-center whitespace-nowrap">
            Page <span className="font-bold mx-1.5">1 of 1</span>
          </div>

          <div className="flex items-center gap-1">
            <button disabled className="p-1 px-1.5 text-slate-400 hover:text-blue-600 cursor-not-allowed">
              <span className="text-sm font-mono tracking-tighter">&gt;</span>
            </button>
            <button disabled className="p-1 px-1.5 text-slate-400 hover:text-blue-600 cursor-not-allowed">
              <span className="text-sm font-mono tracking-tighter">&gt;|</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeeCourseTable;
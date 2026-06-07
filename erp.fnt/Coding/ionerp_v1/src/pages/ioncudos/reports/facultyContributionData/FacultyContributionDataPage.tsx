import React, { useEffect, useState } from "react";
import axios from "axios";

interface ReportRow {
  department: string;

  // Journal
  journal_communicated: number;
  journal_published: number;
  journal_accepted: number;

  // Conference
  conference_communicated: number;
  conference_published: number;
  conference_accepted: number;

  // Sponsored Projects
  sponsored_completed: number;
  sponsored_ongoing: number;
  sponsored_submitted: number;

  // Patent
  patent_submitted: number;
  patent_published: number;
  patent_granted: number;

  // Consultancy
  consultancy_completed: number;
  consultancy_ongoing: number;
  consultancy_submitted: number;

  // Others
  awards: number;
  books: number;
  book_chapters: number;
  scholarships: number;
  workshop_organised: number;
  workshop_attended: number;
  research_projects: number;
}

const FacultyContributionDataPage: React.FC = () => {
  const [academicYears, setAcademicYears] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [reportData, setReportData] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAcademicYears();
  }, []);

  const fetchAcademicYears = async () => {
    try {
      const response = await axios.get<string[]>(
        "http://localhost:8000/faculty-contribution-data/academic-years",
      );

      setAcademicYears(response.data);
    } catch (error) {
      console.error("Academic year fetch error:", error);
    }
  };

  const fetchReport = async (year: string) => {
    if (!year) {
      setReportData([]);
      return;
    }

    try {
      setLoading(true);

      const response = await axios.get<ReportRow[]>(
        "http://localhost:8000/faculty-contribution-data/report",
        {
          params: {
            academic_year: year,
          },
        },
      );

      setReportData(response.data);
    } catch (error) {
      console.error("Report fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    if (!selectedYear) {
      alert("Please select Academic Year");
      return;
    }

    try {
      const response = await axios.get<Blob>(
        "http://localhost:8000/faculty-contribution-data/export/excel",
        {
          params: {
            academic_year: selectedYear,
          },
          responseType: "blob",
        },
      );

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;

      link.setAttribute(
        "download",
        `Faculty_Contribution_Report_${selectedYear}.xlsx`,
      );

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Excel export error:", error);
    }
  };

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <div className="bg-white p-6 rounded-md shadow-sm">
        {/* Header */}
        <div className="text-[#4f7f82] mb-6">
          <h2 className="text-lg font-semibold">Faculty Contribution Data</h2>
        </div>

        {/* Filter */}
        <div className="flex justify-between items-end mb-6">
          <div>
            <label className="text-sm font-medium block mb-1">
              Academic Year
            </label>

            <select
              value={selectedYear}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedYear(value);
                fetchReport(value);
              }}
              className="border px-3 py-2 rounded w-56"
            >
              <option value="">Select Academic Year</option>

              {academicYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {reportData.length > 0 && (
            <button
              onClick={handleExportExcel}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Export .xlsx
            </button>
          )}
        </div>

        {/* Academic Year */}
        {selectedYear && (
          <div className="mb-4 font-semibold">
            Academic Year : {selectedYear}
          </div>
        )}

        {/* Loader */}
        {loading && (
          <div className="text-center py-5 text-gray-500">Loading...</div>
        )}

        {/* Table */}
        {!loading && (
          <div className="overflow-x-auto">
            <table className="min-w-[1800px] border border-gray-300 text-sm w-full">
              <thead>
                <tr className="bg-gray-100 text-center">
                  <th className="border px-3 py-2">Department</th>

                  <th className="border px-3 py-2">Journal Papers</th>

                  <th className="border px-3 py-2">Conference Papers</th>

                  <th className="border px-3 py-2">Sponsored Projects</th>

                  <th className="border px-3 py-2">Patent Innovation</th>

                  <th className="border px-3 py-2">
                    Consultancy / Testing Projects
                  </th>

                  <th className="border px-3 py-2">Award & Honors</th>

                  <th className="border px-3 py-2">Book Published</th>

                  <th className="border px-3 py-2">Book Chapter</th>

                  <th className="border px-3 py-2">Fellowship / Scholarship</th>

                  <th className="border px-3 py-2">FDP / Workshop Organised</th>

                  <th className="border px-3 py-2">FDP / Workshop Attended</th>

                  <th className="border px-3 py-2">Research Project</th>
                </tr>
              </thead>

              <tbody>
                {reportData.length > 0
                  ? reportData.map((row, index) => (
                      <tr key={index} className="text-center hover:bg-gray-50">
                        {/* Department */}
                        <td className="border px-3 py-2 text-left font-medium">
                          {row.department}
                        </td>

                        {/* Journal */}
                        <td className="border px-3 py-2 text-left">
                          Communicated : {row.journal_communicated}
                          <br />
                          Published : {row.journal_published}
                          <br />
                          Accepted : {row.journal_accepted}
                        </td>

                        {/* Conference */}
                        <td className="border px-3 py-2 text-left">
                          Communicated : {row.conference_communicated}
                          <br />
                          Published : {row.conference_published}
                          <br />
                          Accepted : {row.conference_accepted}
                        </td>

                        {/* Sponsored */}
                        <td className="border px-3 py-2 text-left">
                          Completed : {row.sponsored_completed}
                          <br />
                          On Going : {row.sponsored_ongoing}
                          <br />
                          Submitted : {row.sponsored_submitted}
                        </td>

                        {/* Patent */}
                        <td className="border px-3 py-2 text-left">
                          Submitted : {row.patent_submitted}
                          <br />
                          Published : {row.patent_published}
                          <br />
                          Granted : {row.patent_granted}
                        </td>

                        {/* Consultancy */}
                        <td className="border px-3 py-2 text-left">
                          Completed : {row.consultancy_completed}
                          <br />
                          On Going : {row.consultancy_ongoing}
                          <br />
                          Submitted : {row.consultancy_submitted}
                        </td>

                        {/* Awards */}
                        <td className="border px-3 py-2">{row.awards}</td>

                        {/* Books */}
                        <td className="border px-3 py-2">{row.books}</td>

                        {/* Book Chapters */}
                        <td className="border px-3 py-2">
                          {row.book_chapters}
                        </td>

                        {/* Scholarship */}
                        <td className="border px-3 py-2">{row.scholarships}</td>

                        {/* Workshop Organised */}
                        <td className="border px-3 py-2">
                          {row.workshop_organised}
                        </td>

                        {/* Workshop Attended */}
                        <td className="border px-3 py-2">
                          {row.workshop_attended}
                        </td>

                        {/* Research */}
                        <td className="border px-3 py-2">
                          {row.research_projects}
                        </td>
                      </tr>
                    ))
                  : selectedYear && (
                      <tr>
                        <td colSpan={13} className="text-center py-5 border">
                          No Data Found
                        </td>
                      </tr>
                    )}
              </tbody>
            </table>
          </div>
        )}
        {reportData.length > 0 && (
          <div className="border-t border-gray-300 mt-4 pt-4 flex justify-end">
            <button
              onClick={handleExportExcel}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Export .xlsx
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FacultyContributionDataPage;

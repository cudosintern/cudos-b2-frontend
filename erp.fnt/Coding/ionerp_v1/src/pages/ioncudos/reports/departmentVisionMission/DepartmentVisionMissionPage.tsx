import React, { useEffect, useState } from "react";
import { FileText, Calendar, FileText as WordIcon } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const API = "http://localhost:8000/department-vision-mission";

type Department = {
  dept_id: number;
  dept_name: string;
};

type Report = {
  vision: string;
  mission: string;
  mission_elements: string[];
  is_valid: boolean;
};

const DepartmentVisionMissionPage = () => {
  const [selectedDept, setSelectedDept] = useState("");
  const [year, setYear] = useState<Date | null>(new Date());

  const [departments, setDepartments] = useState<Department[]>([]);
  const [vision, setVision] = useState("");
  const [mission, setMission] = useState("");
  const [missionElements, setMissionElements] = useState<string[]>([]);

  // ✅ ONLY CONTROL FLAG (NO UI CHANGE)
  const showReport = selectedDept !== "" && year !== null;

  // ---------------- LOAD DEPARTMENTS ----------------
  useEffect(() => {
    fetch(`${API}/departments`)
      .then((res) => res.json())
      .then((data) => setDepartments(data));
  }, []);

  // ---------------- LOAD REPORT ----------------
  useEffect(() => {
    if (!showReport) return;

    fetch(`${API}/report?dept_id=${selectedDept}&year=${year!.getFullYear()}`)
      .then((res) => res.json())
      .then((data: Report) => {
        if (data.is_valid) {
          setVision(data.vision);
          setMission(data.mission);
          setMissionElements(data.mission_elements);
        } else {
          setVision("");
          setMission("");
          setMissionElements([]);
        }
      });
  }, [selectedDept, year]);

  // ---------------- EXPORT PDF ----------------
  const handleExportPDF = () => {
    if (!showReport) return;

    window.open(
      `${API}/export/pdf?dept_id=${selectedDept}&year=${year!.getFullYear()}`,
      "_blank",
    );
  };

  // ---------------- EXPORT DOC ----------------
  const handleExportDoc = async () => {
    if (!showReport) return;

    const res = await fetch(
      `${API}/export/doc?dept_id=${selectedDept}&year=${year!.getFullYear()}`,
    );

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "department-report.docx";

    document.body.appendChild(a);
    a.click();
    a.remove();

    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#efefef] p-4">
      <div className="bg-white border border-gray-300 rounded shadow-sm">
        {/* HEADER */}
        <div className="text-[#4f7f82] px-6 py-3 rounded-t justify-between items-center">
          <h2 className="text-[18px] font-semibold">
            Department Vision & Mission Report
          </h2>
        </div>

        {/* FILTERS */}
        <div className="flex justify-between items-center px-6 py-4">
          <div className="flex items-center gap-20">
            {/* Department */}
            <div className="flex items-center gap-2">
              <label className="text-sm whitespace-nowrap">
                Department :<span className="text-red-500">*</span>
              </label>

              <select
                className="border border-gray-300 rounded px-3 py-2 text-sm w-[250px] bg-white outline-none"
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
              >
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept.dept_id} value={dept.dept_id}>
                    {dept.dept_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Year */}
            <div className="flex items-center gap-2">
              <label className="text-sm whitespace-nowrap">
                Year :<span className="text-red-500">*</span>
              </label>

              <div className="relative w-[250px]">
                <DatePicker
                  selected={year}
                  onChange={(date) => setYear(date)}
                  showYearPicker
                  dateFormat="yyyy"
                  className="border border-gray-300 rounded px-3 py-2 text-sm w-full bg-gray-100 text-gray-600 cursor-pointer focus:outline-none"
                />

                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                  <Calendar size={18} />
                </div>
              </div>
            </div>
          </div>

          {/* EXPORT (HIDDEN UNTIL BOTH SELECTED) */}
          {showReport && (
            <div className="relative group">
              <button className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-1 rounded">
                Export
              </button>

              <div className="absolute right-0 top-full mt-1 w-20 bg-white border shadow-lg rounded-md z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <button
                  onClick={handleExportPDF}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 rounded-t-md"
                >
                  <FileText size={16} className="text-red-600" />
                  .pdf
                </button>

                <button
                  onClick={handleExportDoc}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 rounded-b-md"
                >
                  <WordIcon size={16} className="text-blue-600" />
                  .doc
                </button>
              </div>
            </div>
          )}
        </div>

        {/* VISION */}
        {showReport && (
          <div className="px-6 pb-5">
            <div className="border rounded">
              <div className="border-b py-2 text-center font-semibold bg-gray-50">
                Department Vision
              </div>
              <div className="p-3 text-[15px] leading-8">{vision}</div>
            </div>
          </div>
        )}

        {/* MISSION */}
        {showReport && (
          <div className="px-6 pb-5">
            <div className="border rounded">
              <div className="border-b py-2 text-center font-semibold bg-gray-50">
                Department Mission
              </div>
              <div className="p-3 text-[15px] leading-8 whitespace-pre-line">
                {mission}
              </div>
            </div>
          </div>
        )}

        {/* MISSION ELEMENTS */}
        {showReport && (
          <div className="px-6 pb-6">
            <div className="border rounded overflow-hidden">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border-b border-r px-4 py-3 text-center w-[150px] font-semibold">
                      Sl No.
                    </th>
                    <th className="border-b px-4 py-3 text-center font-semibold">
                      Department Mission Elements
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {missionElements.map((item, index) => (
                    <tr key={index}>
                      <td className="border-b border-r px-4 py-3">
                        ME {index + 1}
                      </td>
                      <td className="border-b px-4 py-3 leading-8">{item}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {/* FOOTER EXPORT */}
        {showReport && (
          <div className="px-6 pb-4 flex justify-end">
            <div className="relative group">
              <button className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-1 rounded">
                Export
              </button>

              <div className="absolute right-0 bottom-full mb-1 w-20 bg-white border shadow-lg rounded-md z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <button
                  onClick={handleExportPDF}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 rounded-t-md"
                >
                  <FileText size={16} className="text-red-600" />
                  .pdf
                </button>

                <button
                  onClick={handleExportDoc}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 rounded-b-md"
                >
                  <WordIcon size={16} className="text-blue-600" />
                  .doc
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DepartmentVisionMissionPage;

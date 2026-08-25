import React, { useEffect, useState } from "react";
import { FileText, File } from "lucide-react";
import Select from "react-select";
const DROPDOWN_API = "http://localhost:8000/department-curriculum/dropdown";

const DETAILS_API = "http://localhost:8000/department-curriculum/details";

const EXPORT_PDF_API =
  "http://localhost:8000/department-curriculum/export/pdf";

const EXPORT_DOC_API =
  "http://localhost:8000/department-curriculum/export/doc";

const DepartmentCurriculumDetailsListPage = () => {

  const [loading, setLoading] = useState(true);

  const [curriculumList, setCurriculumList] = useState<any[]>([]);

  // const [selectedBatchId, setSelectedBatchId] = useState("");
  const [selectedBatchId, setSelectedBatchId] = useState<any>(undefined);
  const [curriculumData, setCurriculumData] = useState<any>({
    curriculum_name: "",
    vision: "",
    mission: [],
    mission_elements: [],
    peos: [],
    attendees: "",
    meeting_notes: "",
    pos: [],
    blooms: [],
  });

  // =====================================================
  // LOAD DROPDOWN
  // =====================================================

  useEffect(() => {
    fetchDropdownData();
  }, []);

  const fetchDropdownData = async () => {

    try {

      setLoading(true);

      const response = await fetch(DROPDOWN_API);

      const data = await response.json();

      setCurriculumList(data || []);

    } catch (error) {

      console.error("Dropdown API Error:", error);

    } finally {

      setLoading(false);
    }
  };

  // =====================================================
  // FETCH DETAILS
  // =====================================================

  const fetchCurriculumDetails = async (
    academicBatchId: any
  ) => {

    try {

      setLoading(true);

      const response = await fetch(
        `${DETAILS_API}/${academicBatchId}`
      );

      const data = await response.json();

      setCurriculumData({
        curriculum_name: data?.curriculum_name || "",
        vision: data?.vision || "",
        mission: data?.mission || [],
        mission_elements: data?.mission_elements || [],
        peos: data?.peos || [],
        attendees: data?.attendees || "",
        meeting_notes: data?.meeting_notes || "",
        pos: data?.pos || [],
        blooms: data?.blooms || [],
      });

    } catch (error) {

      console.error("Details API Error:", error);

    } finally {

      setLoading(false);
    }
  };

  // =====================================================
  // DROPDOWN CHANGE
  // =====================================================

  const handleCurriculumChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {

    const batchId = e.target.value;

    setSelectedBatchId(batchId);

    if (!batchId) {
      return;
    }

    fetchCurriculumDetails(batchId);
  };
  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {

    return (
      <div className="p-5 text-center text-gray-600">
        Loading...
      </div>
    );
  }
  const curriculumOptions = curriculumList.flatMap((department: any) => [
    {
      value: `header-${department.department_name}`,
      label: department.department_name,
      isDisabled: true,
    },

    ...(department.curriculums || [])
      .filter(
        (item: any) =>
          item.curriculum_name &&
          item.curriculum_name.trim() !== ""
      )
      .map((item: any) => ({
        value: item.academic_batch_id,
        label: item.curriculum_name,
      })),
  ]);

  const handleExportPDF = () => {

    if (!selectedBatchId) return;

    window.open(
      `${EXPORT_PDF_API}/${selectedBatchId}`,
      "_blank"
    );
  };

  // =====================================================
  // EXPORT DOC
  // =====================================================

  const handleExportDoc = async () => {

    if (!selectedBatchId) return;

    const res = await fetch(
      `${EXPORT_DOC_API}/${selectedBatchId}`
    );

    const blob = await res.blob();

    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");

    a.href = url;

    a.download =
      "Department_Curriculum_Details.docx";

    document.body.appendChild(a);

    a.click();

    a.remove();

    window.URL.revokeObjectURL(url);
  };

  return (

    <div className="min-h-screen bg-[#efefef] p-4">

      <div className="bg-white border border-[#d4d4d4] shadow-sm">

        {/* HEADER */}

        <div className="flex items-center justify-between px-5 py-3 border border-[#d9d9d9]">

          <h1 className="text-[18px] font-semibold text-[#4f7f82]">
            Department / Curriculum (Regulation) Details List
          </h1>

        </div>

        {/* BODY */}

        <div className="text-[13px] text-[#222] leading-6">

          {/* CURRICULUM DROPDOWN */}

          <div className="border-b border-[#d7d7d7]">

            <div className="px-4 py-4 flex items-center justify-between">

              {/* LEFT: Dropdown */}
              <div className="flex items-center gap-3">
                <label className="font-semibold whitespace-nowrap">
                  Curriculum <span className="text-red-600">*</span> :
                </label>

                <Select
                  className="w-[250px]"
                  options={curriculumOptions}
                  value={curriculumOptions.find(
                    (option) => option.value === selectedBatchId
                  )}
                  onChange={(selectedOption: any) => {
                    const batchId = selectedOption?.value;

                    setSelectedBatchId(batchId);

                    if (batchId && !String(batchId).startsWith("header-")) {
                      fetchCurriculumDetails(batchId);
                    }
                  }}
                  isOptionDisabled={(option) => option.isDisabled}
                  styles={{
                    control: (base) => ({
                      ...base,
                      minHeight: "32px",
                      height: "32px",
                    }),

                    valueContainer: (base) => ({
                      ...base,
                      height: "32px",
                      padding: "0 8px",
                    }),

                    input: (base) => ({
                      ...base,
                      margin: "0px",
                      padding: "0px",
                    }),

                    indicatorsContainer: (base) => ({
                      ...base,
                      height: "32px",
                    }),

                    menuList: (base) => ({
                      ...base,
                      padding: 0,
                      margin: 0,
                    }),

                    option: (base, state) => ({
                      ...base,
                      minHeight: "28px",
                      padding: state.data.isDisabled
                        ? "6px 10px"
                        : "4px 10px",
                      lineHeight: "16px",

                      backgroundColor: state.data.isDisabled
                        ? "#d1d5db"
                        : state.isSelected
                          ? "#2563eb"
                          : state.isFocused
                            ? "#f3f4f6"
                            : "#ffffff",

                      color: state.data.isDisabled
                        ? "#000000"
                        : state.isSelected
                          ? "#ffffff"
                          : "#000000",

                      fontWeight: state.data.isDisabled ? 600 : 400,
                      cursor: state.data.isDisabled ? "default" : "pointer",
                    }),

                    singleValue: (base) => ({
                      ...base,
                      fontSize: "13px",
                    }),
                  }}
                />
              </div>

              {/* RIGHT: Export Button */}
              <div className="relative group">
                <button className="bg-[#4f7f82] hover:bg-[#4f7f82] text-white text-sm px-4 py-2 rounded">
                  Export
                </button>

                <div className="absolute right-0 top-full mt-1 w-24 bg-white border border-gray-300 shadow-lg rounded-md z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">

                  <button onClick={handleExportPDF} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 rounded-t-md">
                    <FileText size={16} className="text-red-600" />
                    .pdf
                  </button>

                  <button onClick={handleExportDoc} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 rounded-b-md">
                    <File size={16} className="text-blue-600" />
                    .doc
                  </button>

                </div>
              </div>

            </div>
          </div>

          {/* VISION */}

          {curriculumData.vision && (

            <div className="border-b border-[#d7d7d7]">

              <div className="bg-[#f7f7f7] px-4 py-2 font-semibold border-b border-[#d7d7d7]">
                Vision
              </div>

              <div className="px-4 py-4">
                {curriculumData.vision}
              </div>

            </div>

          )}

          {/* MISSION */}

          {curriculumData.mission?.length > 0 && (

            <div className="border-b border-[#d7d7d7]">

              <div className="bg-[#f7f7f7] px-4 py-2 font-semibold border-b border-[#d7d7d7]">
                Mission
              </div>

              <div className="px-4 py-4 space-y-3">

                {curriculumData.mission.map(
                  (item: string, index: number) => (
                    <p key={index}>
                      {index + 1}. {item}
                    </p>
                  )
                )}

              </div>

            </div>

          )}

          {/* MISSION ELEMENTS */}

          {curriculumData.mission_elements?.length > 0 && (

            <div className="border-b border-[#d7d7d7]">

              <div className="bg-[#f7f7f7] px-4 py-2 font-semibold border-b border-[#d7d7d7]">
                Mission Elements
              </div>

              <table className="w-full border-collapse">

                <tbody>

                  {curriculumData.mission_elements.map(
                    (item: string, idx: number) => (
                      <tr key={idx}>
                        <td className="border border-[#d7d7d7] px-4 py-3">
                          {item}
                        </td>
                      </tr>
                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

          {/* PEO */}

          {curriculumData.peos?.length > 0 && (

            <div className="border-b border-[#d7d7d7]">

              <div className="bg-[#f7f7f7] px-4 py-2 font-semibold border-b border-[#d7d7d7]">
                Program Educational Objectives
              </div>

              <table className="w-full border-collapse">

                <tbody>

                  {curriculumData.peos.map(
                    (item: string, index: number) => (
                      <tr key={index}>

                        <td className="border border-[#d7d7d7] px-4 py-3 w-[120px] font-semibold bg-[#fafafa] align-top">
                          PEO {index + 1}
                        </td>

                        <td className="border border-[#d7d7d7] px-4 py-3">
                          {item}
                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

          {/* ATTENDEES */}

          {curriculumData.attendees && (

            <div className="border-b border-[#d7d7d7]">

              <div className="bg-[#f7f7f7] px-4 py-2 font-semibold border-b border-[#d7d7d7]">
                Attendees Name
              </div>

              <table className="w-full border-collapse">

                <tbody>

                  <tr>

                    <td className="border border-[#d7d7d7] px-4 py-3">
                      {curriculumData.attendees}
                    </td>

                  </tr>

                </tbody>

              </table>

            </div>

          )}

          {/* MEETING NOTES */}

          {curriculumData.meeting_notes && (

            <div className="border-b border-[#d7d7d7]">

              <div className="bg-[#f7f7f7] px-4 py-2 font-semibold border-b border-[#d7d7d7]">
                Meeting Notes
              </div>

              <table className="w-full border-collapse">

                <tbody>

                  <tr>

                    <td className="border border-[#d7d7d7] px-4 py-3">
                      {curriculumData.meeting_notes}
                    </td>

                  </tr>

                </tbody>

              </table>

            </div>

          )}

          {/* PROGRAM OUTCOMES */}

          {curriculumData.pos?.length > 0 && (

            <div className="border-b border-[#d7d7d7]">

              <div className="bg-[#f7f7f7] px-4 py-2 font-semibold border-b border-[#d7d7d7]">
                Program Outcomes
              </div>

              <table className="w-full border-collapse">

                <tbody>

                  {curriculumData.pos.map(
                    (item: any, index: number) => (
                      <tr key={index}>

                        <td className="border border-[#d7d7d7] px-4 py-3 w-[140px] font-semibold bg-[#fafafa] align-top">
                          {item.code}
                        </td>

                        <td className="border border-[#d7d7d7] px-4 py-3">
                          {item.text}
                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

          {/* BLOOMS */}

          {curriculumData.blooms?.length > 0 && (

            <div>

              <div className="bg-[#f7f7f7] px-4 py-2 font-semibold border-b border-[#d7d7d7]">
                Bloom&apos;s Level Taxonomy
              </div>

              <div className="overflow-x-auto">

                <table className="w-full border-collapse">

                  <thead>

                    <tr>

                      <th className="border border-[#d7d7d7] px-4 py-3 text-left bg-[#fafafa] font-semibold">
                        Sr. No.
                      </th>

                      <th className="border border-[#d7d7d7] px-4 py-3 text-left bg-[#fafafa] font-semibold">
                        Level
                      </th>

                      <th className="border border-[#d7d7d7] px-4 py-3 text-left bg-[#fafafa] font-semibold">
                        Characteristics
                      </th>

                      <th className="border border-[#d7d7d7] px-4 py-3 text-left bg-[#fafafa] font-semibold">
                        Verbs
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {curriculumData.blooms.map((item: any) => (

                      <tr key={item.no}>

                        <td className="border border-[#d7d7d7] px-4 py-3">
                          {item.no}
                        </td>

                        <td className="border border-[#d7d7d7] px-4 py-3">
                          {item.level}
                        </td>

                        <td className="border border-[#d7d7d7] px-4 py-3">
                          {item.characteristics}
                        </td>

                        <td className="border border-[#d7d7d7] px-4 py-3">
                          {item.verbs}
                        </td>

                      </tr>

                    ))}

                  </tbody>

                </table>

              </div>

            </div>

          )}

        </div>

        {/* FOOTER */}

        <div className="border-t border-[#d7d7d7] px-5 py-3 flex justify-end">

          <div className="relative group">

            <button className="bg-[#4f7f82] hover:bg-[#4f7f82] text-white text-sm px-4 py-2 rounded">
              Export
            </button>

            <div className="absolute right-0 bottom-full mb-1 w-24 bg-white border border-gray-300 shadow-lg rounded-md z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">

              <button onClick={handleExportPDF} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 rounded-t-md">
                <FileText size={16} className="text-red-600" />
                .pdf
              </button>

              <button onClick={handleExportDoc} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 rounded-b-md">
                <File size={16} className="text-blue-600" />
                .doc
              </button>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
};

export default DepartmentCurriculumDetailsListPage;
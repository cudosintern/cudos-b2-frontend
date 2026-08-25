import React, { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import { FileText, File } from "lucide-react";

const CURRICULUM_API =
  "http://localhost:8000/mapping-report/curriculum-dropdown";

const TERM_API =
  "http://localhost:8000/mapping-report/term-dropdown";

const COURSE_API =
  "http://localhost:8000/mapping-report/course-dropdown";

const REPORT_API =
  "http://localhost:8000/mapping-report/mapping-report";

const MappingReport = () => {

  /* -------------------------------------------------------------------------- */
  /*                                    STATE                                   */
  /* -------------------------------------------------------------------------- */

  const [curriculumList, setCurriculumList] =
    useState<any[]>([]);

  const [termOptions, setTermOptions] =
    useState<any[]>([]);

  const [courseOptions, setCourseOptions] =
    useState<any[]>([]);

  const [selectedCurriculum, setSelectedCurriculum] =
    useState<any>(null);

  const [selectedTerm, setSelectedTerm] =
    useState<any>(null);

  const [selectedCourse, setSelectedCourse] =
    useState<any>(null);

  const [mappedOnly, setMappedOnly] =
    useState(false);

  const [showJustificationModal, setShowJustificationModal] =
    useState(false);

  const [selectedJustification, setSelectedJustification] =
    useState("");

  const [reportData, setReportData] =
    useState<any>({
      peos: [],
      po_headers: [],
      po_peo_mapping: [],
      co_po_mapping: [],
    });

  const selectOptions = [
    {
      label: "All ( POs & PSOs )",
      value: "ALL",
    },
    {
      label: "Program Outcomes (POs)",
      value: "PO",
    },
    {
      label: "Program Specific Outcomes (PSOs)",
      value: "PSO",
    },
  ];

  const [selectedOption, setSelectedOption] =
    useState(selectOptions[0]);

  /* -------------------------------------------------------------------------- */
  /*                         OPEN JUSTIFICATION MODAL                           */
  /* -------------------------------------------------------------------------- */

  const openJustificationModal = (
    justification: string
  ) => {

    setSelectedJustification(
      justification || "No justification needed"
    );

    setShowJustificationModal(true);

  };

  /* -------------------------------------------------------------------------- */
  /*                              FETCH CURRICULUM                              */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {

    fetch(CURRICULUM_API)

      .then((res) => res.json())

      .then((data) => {

        setCurriculumList(data);

      })

      .catch((err) => {

        console.log(err);

      });

  }, []);
  const curriculumOptions = curriculumList.flatMap(
    (department: any) => [
      {
        value: `header-${department.department_name}`,
        label: department.department_name,
        isDisabled: true,
      },

      ...(department.curriculums || []).map((item: any) => ({
        value: item.academic_batch_id,
        label: item.curriculum_name,
      })),
    ]
  );

  /* -------------------------------------------------------------------------- */
  /*                                  FETCH TERM                                */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {

    if (!selectedCurriculum) return;

    fetch(
      `${TERM_API}/${selectedCurriculum.value}`
    )

      .then((res) => res.json())

      .then((data) => {

        setTermOptions(data);

        setSelectedTerm(null);

        setCourseOptions([]);

        setSelectedCourse(null);

      })

      .catch((err) => {

        console.log(err);

      });

  }, [selectedCurriculum]);

  /* -------------------------------------------------------------------------- */
  /*                                FETCH COURSE                                */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {

    if (
      !selectedCurriculum ||
      !selectedTerm
    ) return;

    fetch(
      `${COURSE_API}/${selectedCurriculum.value}/${selectedTerm.value}`
    )

      .then((res) => res.json())

      .then((data) => {

        setCourseOptions(data);

        setSelectedCourse(null);

      })

      .catch((err) => {

        console.log(err);

      });

  }, [selectedCurriculum, selectedTerm]);

  /* -------------------------------------------------------------------------- */
  /*                               FETCH REPORT                                 */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {

    if (
      !selectedCurriculum ||
      !selectedTerm ||
      !selectedCourse
    ) return;

    fetch(
      `${REPORT_API}/${selectedCurriculum.value}/${selectedTerm.value}/${selectedCourse.value}`
    )

      .then((res) => res.json())

      .then((data) => {

        setReportData(data);

      })

      .catch((err) => {

        console.log(err);

      });

  }, [
    selectedCurriculum,
    selectedTerm,
    selectedCourse
  ]);

  /* -------------------------------------------------------------------------- */
  /*                                  EXPORTS                                   */
  /* -------------------------------------------------------------------------- */

  const handleExportPDF = () => {

    if (!selectedCurriculum || !selectedTerm || !selectedCourse) {
      alert("Please select Curriculum, Term and Course");
      return;
    }

    const url =
      `http://localhost:8000/mapping-report/export/pdf/` +
      `${selectedCurriculum.value}/` +
      `${selectedTerm.value}/` +
      `${selectedCourse.value}` +
      `?option=${selectedOption.value}` +
      `&mapped_only=${mappedOnly}`;

    window.open(url, "_blank");
  };

  const handleExportDoc = () => {

    if (!selectedCurriculum || !selectedTerm || !selectedCourse) {
      alert("Please select Curriculum, Term and Course");
      return;
    }

    const url =
      `http://localhost:8000/mapping-report/export/doc/` +
      `${selectedCurriculum.value}/` +
      `${selectedTerm.value}/` +
      `${selectedCourse.value}` +
      `?option=${selectedOption.value}` +
      `&mapped_only=${mappedOnly}`;

    window.open(url, "_blank");
  };

  /* -------------------------------------------------------------------------- */
  /*                         FILTER PO / PSO HEADERS                            */
  /* -------------------------------------------------------------------------- */

  const filteredPoHeaders = useMemo(() => {

    if (selectedOption.value === "ALL") {

      return reportData.po_headers;

    }

    return reportData.po_headers.filter((po: any) => {

      const ref = po.po_reference?.toUpperCase();

      if (selectedOption.value === "PO") {

        return ref?.startsWith("PO");

      }

      if (selectedOption.value === "PSO") {

        return ref?.startsWith("PSO");

      }

      return true;

    });

  }, [reportData.po_headers, selectedOption]);

  /* -------------------------------------------------------------------------- */
  /*                     GET DISPLAY COLUMN INDEXES                             */
  /* -------------------------------------------------------------------------- */

  const displayColumnIndexes = useMemo(() => {

    const indexes: number[] = [];

    reportData.po_headers.forEach(
      (po: any, index: number) => {

        const ref = po.po_reference?.toUpperCase();

        let allowed = false;

        if (selectedOption.value === "ALL") {

          allowed = true;

        } else if (
          selectedOption.value === "PO"
        ) {

          allowed = ref?.startsWith("PO");

        } else if (
          selectedOption.value === "PSO"
        ) {

          allowed = ref?.startsWith("PSO");

        }

        if (!allowed) return;

        if (mappedOnly) {

          const hasMapped = reportData.co_po_mapping.some(
            (row: any) =>
              row.values[index]?.map_level !== ""
          );

          if (hasMapped) {

            indexes.push(index);

          }

        } else {

          indexes.push(index);

        }

      }
    );

    return indexes;

  }, [
    reportData,
    selectedOption,
    mappedOnly
  ]);

  /* -------------------------------------------------------------------------- */
  /*                         FILTER ONLY MAPPED ROWS                            */
  /* -------------------------------------------------------------------------- */

  const filteredCoRows = useMemo(() => {

    return reportData.co_po_mapping.filter(
      (row: any) => {

        return row.values.some(
          (value: any, index: number) => {

            if (
              !displayColumnIndexes.includes(index)
            ) {
              return false;
            }

            return value.map_level !== "";

          }
        );

      }
    );

  }, [
    reportData.co_po_mapping,
    displayColumnIndexes
  ]);

  /* -------------------------------------------------------------------------- */
  /*                      FILTER PO -> PEO ROWS                                 */
  /* -------------------------------------------------------------------------- */

  const filteredPoPeoRows = useMemo(() => {

    return reportData.po_peo_mapping.filter(
      (row: any) => {

        const poName =
          row.po_name?.toUpperCase();

        if (
          selectedOption.value === "ALL"
        ) {

          return true;

        }

        if (
          selectedOption.value === "PO"
        ) {

          return poName?.startsWith("PO");

        }

        if (
          selectedOption.value === "PSO"
        ) {

          return poName?.startsWith("PSO");

        }

        return true;

      }
    );

  }, [
    reportData.po_peo_mapping,
    selectedOption
  ]);

  /* -------------------------------------------------------------------------- */
  /*                             REACT SELECT STYLE                             */
  /* -------------------------------------------------------------------------- */

  const customSelectStyles = {

    control: (provided: any) => ({
      ...provided,
      minHeight: "36px",
      height: "36px",
      fontSize: "14px",
      borderColor: "#c7c7c7",
      boxShadow: "none",
    }),

    valueContainer: (provided: any) => ({
      ...provided,
      height: "36px",
      padding: "0px 8px",
    }),

    indicatorsContainer: (provided: any) => ({
      ...provided,
      height: "36px",
    }),

    input: (provided: any) => ({
      ...provided,
      margin: "0px",
      padding: "0px",
    }),

    option: (provided: any) => ({
      ...provided,
      fontSize: "14px",
    }),

    menu: (provided: any) => ({
      ...provided,
      zIndex: 9999,
    }),

  };

  /* -------------------------------------------------------------------------- */
  /*                                   RETURN                                   */
  /* -------------------------------------------------------------------------- */

  return (

    <div className="bg-[#f3f3f3] min-h-screen p-4">
      {/* TOP SECTION */}

      <div className="bg-white border border-gray-300 rounded-md p-4 mb-4">
        <div className="text-[#4f7f82] px-3 py-3 rounded-t justify-between items-center border-b border-[#d9d9d9]">
          <h2 className="text-[18px] font-semibold">
            Mapping Report
          </h2>
        </div>
        {/* EXPORT */}

        <div className="flex justify-end mb-4">

          <div className="relative group">

            <button
              className="
                bg-[#4f7f82]
                hover:bg-[#4f7f82]
                text-white
                text-sm
                px-4
                py-2
                rounded
                flex
                items-center
                gap-2
              "
            >

              <FileText size={16} />

              Export

            </button>

            <div
              className="
                absolute
                right-0
                top-full
                mt-1
                w-24
                bg-white
                border
                border-gray-300
                shadow-lg
                rounded-md
                z-50
                opacity-0
                invisible
                group-hover:opacity-100
                group-hover:visible
                transition-all
                duration-200
              "
            >

              <button
                onClick={handleExportPDF}
                className="
                  w-full
                  flex
                  items-center
                  gap-2
                  px-3
                  py-2
                  text-sm
                  hover:bg-gray-100
                  rounded-t-md
                "
              >

                <FileText
                  size={16}
                  className="text-red-600"
                />

                .pdf

              </button>

              <button
                onClick={handleExportDoc}
                className="
                  w-full
                  flex
                  items-center
                  gap-2
                  px-3
                  py-2
                  text-sm
                  hover:bg-gray-100
                  rounded-b-md
                "
              >

                <File
                  size={16}
                  className="text-blue-600"
                />

                .doc

              </button>

            </div>

          </div>

        </div>

        {/* DROPDOWNS */}

        <div className="grid grid-cols-4 gap-10">

          <div>

            <label className="text-[13px] font-medium block mb-2">
              Curriculum:
              <span className="text-red-600 ml-1">*</span>
            </label>

            <Select
              className="w-full"
              options={curriculumOptions}
              value={curriculumOptions.find(
                (option) =>
                  option.value === selectedCurriculum?.value
              )}
              onChange={(selectedOption: any) => {

                if (
                  !selectedOption ||
                  String(selectedOption.value).startsWith("header-")
                ) {
                  return;
                }

                setSelectedCurriculum(selectedOption);
              }}
              isOptionDisabled={(option) => option.isDisabled}
              styles={{
                control: (base) => ({
                  ...base,
                  minHeight: "36px",
                  height: "36px",
                  borderColor: "#c7c7c7",
                  boxShadow: "none",
                }),

                valueContainer: (base) => ({
                  ...base,
                  height: "36px",
                  padding: "0 8px",
                }),

                indicatorsContainer: (base) => ({
                  ...base,
                  height: "36px",
                }),

                input: (base) => ({
                  ...base,
                  margin: 0,
                  padding: 0,
                }),

                menu: (base) => ({
                  ...base,
                  zIndex: 9999,
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

                  backgroundColor: state.data.isDisabled
                    ? "#d1d5db"
                    : state.isSelected
                      ? "#2563eb"
                      : state.isFocused
                        ? "#f3f4f6"
                        : "#fff",

                  color: state.data.isDisabled
                    ? "#000"
                    : state.isSelected
                      ? "#fff"
                      : "#000",

                  fontWeight: state.data.isDisabled ? 600 : 400,
                  cursor: state.data.isDisabled ? "default" : "pointer",
                  fontSize: "13px",
                }),

                singleValue: (base) => ({
                  ...base,
                  fontSize: "13px",
                }),
              }}
            />

          </div>

          <div>

            <label className="text-[13px] font-medium block mb-2">
              Term:
              <span className="text-red-600 ml-1">*</span>
            </label>

            <Select
              options={termOptions}
              value={selectedTerm}
              onChange={(value) =>
                setSelectedTerm(value)
              }
              styles={customSelectStyles}
            />

          </div>

          <div>

            <label className="text-[13px] font-medium block mb-2">
              Course:
              <span className="text-red-600 ml-1">*</span>
            </label>

            <Select
              options={courseOptions}
              value={selectedCourse}
              onChange={(value) =>
                setSelectedCourse(value)
              }
              styles={customSelectStyles}
            />

          </div>

          <div>

            <label className="text-[13px] font-medium block mb-2">
              Select Option:
            </label>

            <Select
              options={selectOptions}
              value={selectedOption}
              onChange={(value) =>
                setSelectedOption(value!)
              }
              styles={customSelectStyles}
            />

          </div>

        </div>

      </div>

      {/* PO TO PEO */}

      <div className="bg-white border border-gray-300 rounded-md p-4 mb-4 overflow-auto">

        <h2 className="text-center text-[15px] font-semibold mb-4">
          Program Outcomes (POs) to Program Educational Objectives (PEOs) Mapping
        </h2>

        <table className="w-full border-collapse text-[11px]">

          <thead>

            <tr>

              <th className="border border-gray-300 p-2 text-left w-[60%]">

                Program Outcomes (POs) /
                Program Educational Objectives (PEOs)

              </th>

              {reportData.peos.map(
                (peo: any, index: number) => (

                  <th
                    key={index}
                    className="border border-gray-300 p-2 min-w-[90px]"
                  >

                    {peo.peo_reference}

                  </th>

                )
              )}

            </tr>

          </thead>

          <tbody>

            {filteredPoPeoRows.map(
              (row: any, rowIndex: number) => (

                <tr key={rowIndex}>

                  <td className="border border-gray-300 p-2">

                    {row.po_name}

                  </td>

                  {row.values.map(
                    (value: any, index: number) => (

                      <td
                        key={index}
                        className="
                          border
                          border-gray-300
                          text-center
                        "
                      >

                        {value.map_level && (

                          <div className="flex flex-col items-center">

                            <span>
                              {value.map_level}
                            </span>

                            <span
                              className="
                                text-blue-600
                                text-[10px]
                                cursor-pointer
                                hover:underline
                              "
                              title={
                                value.justification ||
                                "No justification needed"
                              }
                              onClick={() =>
                                openJustificationModal(
                                  value.justification
                                )
                              }
                            >

                              Justify

                            </span>

                          </div>

                        )}

                      </td>

                    )
                  )}

                </tr>

              )
            )}

          </tbody>

        </table>

      </div>

      {/* CO TO PO */}

      <div className="bg-white border border-gray-300 rounded-md p-4 mb-4 overflow-auto">

        <div className="flex items-center gap-2 mb-3">

          <span className="text-[12px] font-medium">

            Mapped POs:

          </span>

          <input
            type="checkbox"
            checked={mappedOnly}
            onChange={(e) =>
              setMappedOnly(e.target.checked)
            }
          />

        </div>

        <h2 className="text-center text-[15px] font-semibold mb-4">

          Mapping of Course Outcomes (COs)
          with Program Outcomes (POs)

        </h2>

        <table className="w-full border-collapse text-[10px]">

          <thead>

            <tr>

              <th className="border border-gray-300 p-2 text-left w-[88%]">

                Course Outcomes (COs) /
                Program Outcomes (POs)

              </th>

              {displayColumnIndexes.map(
                (index: number) => {

                  const po =
                    reportData.po_headers[index];

                  return (

                    <th
                      key={index}
                      className="
                        border
                        border-gray-300
                        p-1
                        min-w-[28px]
                      "
                    >

                      {po.po_reference}

                    </th>

                  );

                }
              )}

            </tr>

          </thead>

          <tbody>

            {filteredCoRows.map(
              (row: any, rowIndex: number) => (

                <tr key={rowIndex}>

                  <td className="border border-gray-300 p-2">

                    {row.clo_statement}

                  </td>

                  {displayColumnIndexes.map(
                    (index: number) => {

                      const value =
                        row.values[index];

                      return (

                        <td
                          key={index}
                          className="
                            border
                            border-gray-300
                            text-center
                          "
                        >

                          {value?.map_level && (

                            <div className="flex flex-col items-center">

                              <span>
                                {value.map_level}
                              </span>

                              <span
                                className="
                                  text-blue-600
                                  text-[9px]
                                  cursor-pointer
                                  hover:underline
                                "
                                title={
                                  value.justification ||
                                  "No justification needed"
                                }
                                onClick={() =>
                                  openJustificationModal(
                                    value.justification
                                  )
                                }
                              >

                                Justify

                              </span>

                            </div>

                          )}

                        </td>

                      );

                    }
                  )}

                </tr>

              )
            )}

          </tbody>

        </table>

      </div>

      {/* PEO DESCRIPTION */}

      <div className="bg-white border border-gray-300 rounded-md p-4">

        <h2 className="text-center text-[15px] font-semibold mb-4">

          Program Educational Outcomes (PEOs)

        </h2>

        <div className="space-y-3 text-[11px]">

          {reportData.peos.map(
            (item: any, index: number) => (

              <div key={index}>

                <span className="font-semibold">

                  {item.peo_reference} :

                </span>{" "}

                {item.peo_statement}

              </div>

            )
          )}

        </div>

      </div>

      {/* JUSTIFICATION MODAL */}

      {
        showJustificationModal && (

          <div
            className="
              fixed
              inset-0
              bg-black/40
              flex
              items-center
              justify-center
              z-50
            "
          >

            <div
              className="
                bg-white
                rounded-md
                shadow-lg
                w-[450px]
                max-w-[90%]
                p-5
              "
            >

              <div className="flex justify-between items-center mb-4">

                <h2 className="text-[16px] font-semibold">

                  Justification

                </h2>

                <button
                  onClick={() =>
                    setShowJustificationModal(false)
                  }
                  className="
                    text-gray-500
                    hover:text-red-600
                    text-[18px]
                    font-bold
                  "
                >

                  ×

                </button>

              </div>

              <div
                className="
                  text-[13px]
                  text-gray-700
                  leading-6
                  max-h-[300px]
                  overflow-auto
                  whitespace-pre-wrap
                "
              >

                {selectedJustification}

              </div>

              <div className="flex justify-end mt-5">

                <button
                  onClick={() =>
                    setShowJustificationModal(false)
                  }
                  className="
                    bg-red-600
                    hover:bg-red-700
                    text-white
                    px-4
                    py-2
                    rounded
                    text-sm
                  "
                >

                  Close

                </button>

              </div>

            </div>

          </div>

        )
      }

    </div>

  );
};

export default MappingReport;
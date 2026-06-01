import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
//import { FaPlus, FaEdit, FaTrash, FaSave, FaTimes, FaFileImport } from "react-icons/fa";
import { FaPlus, FaSave, FaTimes, FaFileImport } from "react-icons/fa";
import { GoPencil } from "react-icons/go";
import { MdOutlineDoNotDisturbAlt } from "react-icons/md";
import { manageMteService } from "./manageMteService";
import { toast } from "react-toastify";
import type { CourseOutcome } from "./responseInterface";
import ConfirmDialog from "../../../../components/Dialog/ConfirmDialog";
import ImportRubricsModal from "./ImportRubricsModal";
import DataTable from "../../../../components/Table/DataTable";

const DefineRubricsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as any) || {};

  const {
    course = {},
    filters = {},
    ao_id: state_ao_id,
    crs_id: state_crs_id,
    academic_batch_id: state_batch_id,
    term_id: state_term_id,
    crs_title: state_crs_title
  } = state;

  const crs_id = state_crs_id || course?.crs_id || course?.id || null;
  const academic_batch_id = state_batch_id || filters.academic_batch_id;
  const term_id = state_term_id || filters.semester_id;
  const crs_title = state_crs_title || course.crs_title || course.qpd_title;
  const academic_batch_code = state.academic_batch_code || filters.academic_batch_code;
  const term_name = state.term_name || filters.term_name;
  const ao_id = state_ao_id || filters.ao_id;

  const [criteriaType, setCriteriaType] = useState<"custom" | "co">("custom");
  const [scaleCount, setScaleCount] = useState<number>(0);
  const [showGenerator, setShowGenerator] = useState(false);

  // Table state
  const [rubricsList, setRubricsList] = useState<any[]>([]);
  const [cos, setCos] = useState<CourseOutcome[]>([]);
  const [loading, setLoading] = useState(false);

  const [dynamicTableData, setDynamicTableData] = useState({
    criteria: "",
    scales: [] as { range: string; description: string }[],
    co: "",
  });

  const [aoMethodId, setAoMethodId] = useState<number>(0);
  const [editingCriteriaId, setEditingCriteriaId] = useState<number | string | null>(null);

  const [errors, setErrors] = useState<any>({});
  const [showReGenConfirm, setShowReGenConfirm] = useState(false);
  const [showFinaliseConfirm, setShowFinaliseConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteCriteriaId, setDeleteCriteriaId] = useState<number | string | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const fetchInitialData = async () => {
    if (!crs_id) {
      console.warn("DefineRubricsPage: crs_id is missing, cannot fetch data.");
      return;
    }

    // Clear stale state specifically for fresh course load
    setRubricsList([]);
    setCos([]);
    setAoMethodId(0);
    setEditingCriteriaId(null);
    setShowGenerator(false);
    setDynamicTableData({ criteria: "", scales: [], co: "" });
    setScaleCount(0);
    setErrors({});

    console.log("DefineRubricsPage: fetching initial data for", { crs_id, academic_batch_id, term_id });

    setLoading(true);
    try {
      const [coRes, rubRes] = await Promise.all([
        manageMteService.getCOs(crs_id, academic_batch_id, term_id),
        manageMteService.getRubrics(academic_batch_id, term_id, crs_id)
      ]);

      let formattedCos: CourseOutcome[] = [];
      if (coRes.status === 1) {
        const resData: any = coRes.data;
        let rawArray: any[] = [];

        if (Array.isArray(resData)) {
          rawArray = resData;
        } else if (resData && Array.isArray(resData.data)) {
          rawArray = resData.data;
        }

        formattedCos = rawArray.map((item: any) => ({
          co_id: item.co_id || item.clo_id || item.id,
          co_code: item.co_code || item.clo_code || item.code || "CO",
          co_statement: item.co_statement || item.clo_statement || item.description || ""
        }));

        setCos(formattedCos);
      }

      if (rubRes.status === 1) {
        setAoMethodId(rubRes.data.ao_method_id || 0);
        const data = rubRes.data;
        if (data.rubrics) {
          setRubricsList(data.rubrics.map((r: any) => {
            // If criteria text EXACTLY matches a CO code, we treat it as CO-based
            const matchedCo = formattedCos.find((c: any) => c.co_code === r.criteria);
            return {
              id: r.rubrics_criteria_id || r.criteria_id,
              criteria: matchedCo ? (matchedCo.co_statement || matchedCo.co_code) : r.criteria,
              co: matchedCo ? matchedCo.co_code : "N/A",
              scales: (r.ranges || []).map((rg: any) => ({
                range: rg.criteria_range,
                description: r.descriptions?.find((d: any) => d.rubrics_range_id === rg.rubrics_range_id)?.criteria_description || ""
              }))
            };
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching initial data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [crs_id]);

  const handleGenerateTable = () => {
    if (scaleCount > 0) {
      setErrors((prev: any) => { const { scaleCount, ...rest } = prev; return rest; });
      const newScales = Array.from({ length: scaleCount }, () => ({
        range: "",
        description: "",
      }));
      setDynamicTableData({ ...dynamicTableData, scales: newScales });
      setShowGenerator(true);
    } else {
      setErrors((prev: any) => ({ ...prev, scaleCount: "Please enter a valid number of columns." }));
    }
  };

  const handleSaveCriteria = async () => {
    const newErrors: any = {};
    if (!dynamicTableData.criteria && criteriaType === "custom") {
      newErrors.criteria = "Criteria is required.";
    }
    if (criteriaType === "co" && !dynamicTableData.co) {
      newErrors.co = "Please select a Course Outcome.";
    }

    const rangeRegex = /^\d+-\d+$/;
    dynamicTableData.scales.forEach((s, i) => {
      if (!s.range || s.range.trim() === "") {
        newErrors[`range_${i}`] = "Range required.";
      } else if (!rangeRegex.test(s.range.trim())) {
        newErrors[`range_${i}`] = "Invalid format (e.g. 1-2).";
      }

      if (!s.description || s.description.trim() === "") {
        newErrors[`description_${i}`] = "Desc. required.";
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      // const payload = {
      //   ao_method_id: ao_id, // Local logic might need adaptation if ao_method_id differs from ao_id
      //   criteria_type: criteriaType,
      //   criteria_text: criteriaType === "custom" ? dynamicTableData.criteria : "",
      //   co_id: criteriaType === "co" ? cos.find(c => c.co_code === dynamicTableData.co)?.co_id : null,
      //   ranges: dynamicTableData.scales.map((s, idx) => ({
      //     criteria_range_name: `Scale ${idx + 1}`,
      //     criteria_range: s.range,
      //     description: s.description
      //   }))
      // };

      // 🔥 ADD THIS LINE ABOVE payload
      const selectedCo = cos.find(c => c.co_code === dynamicTableData.co);

      // 🔥 REPLACE payload WITH THIS
      const payload = {
        //ao_method_id: Number(ao_id),
        //ao_method_id: aoMethodId || ao_id,
        ao_method_id: aoMethodId && aoMethodId !== 0 ? aoMethodId : ao_id ? ao_id : 1,

        criteria_type: criteriaType.toLowerCase(),

        criteria_text:
          criteriaType === "custom"
            ? dynamicTableData.criteria
            : dynamicTableData.criteria || "CO Based Criteria",

        co_id:
          criteriaType === "co"
            ? (selectedCo ? selectedCo.co_id : null)
            : null,

        crs_id,
        academic_batch_id,
        term_id,

        ranges: dynamicTableData.scales
          .filter(s => s.range && s.range.trim() !== "")
          .map((s, idx) => ({
            criteria_range_name: `Scale ${idx + 1}`,
            criteria_range: s.range,
            description: s.description || ""
          }))
      };

      console.log("FINAL PAYLOAD:", payload);

      const res = editingCriteriaId && typeof editingCriteriaId === "number"
        ? await manageMteService.updateRubricCriteria(editingCriteriaId, payload)
        : await manageMteService.saveRubricsCriteria(payload);

      if (res.status === 1) {
        toast.success(editingCriteriaId ? "Rubrics updated successfully" : "Rubrics saved successfully");
        fetchInitialData(); // Refresh list
        // Reset
        setShowGenerator(false);
        setDynamicTableData({ criteria: "", scales: [], co: "" });
        setScaleCount(0);
        setEditingCriteriaId(null);
      } else {
        toast.error(res.message || "Failed to save rubrics");
      }
    } catch (error) {
      toast.error("Error saving rubrics");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRubric = useCallback((id: number | string) => {
    setDeleteCriteriaId(id);
    setShowDeleteConfirm(true);
  }, []);

  const handleEditRubric = useCallback((item: any) => {
    setEditingCriteriaId(item.id);
    const isCo = item.co !== "N/A";
    setCriteriaType(isCo ? "co" : "custom");

    setDynamicTableData({
      criteria: isCo ? "" : (item.criteria || ""),
      co: isCo ? (item.co || "") : "",
      scales: (item.scales || []).map((s: any) => ({
        range: s.range || "",
        description: s.description || ""
      }))
    });

    setScaleCount((item.scales || []).length);
    setShowGenerator(true);
    window.scrollTo({ top: 400, behavior: 'smooth' });
  }, []);

  const rubricsColumnDefs = React.useMemo(() => [
    {
      headerName: "Sl No.",
      valueGetter: "node.rowIndex + 1",
      width: 80,
      minWidth: 80,
      maxWidth: 80,
      suppressMovable: true,
      sortable: false,
      filter: false,
      cellStyle: { borderRight: "1px solid #e2e8f0", textAlign: "center" },
    },
    {
      headerName: "Criteria",
      field: "criteria",
      sortable: true,
      filter: true,
      minWidth: 200,
      flex: 1,
      cellStyle: { borderRight: "1px solid #e2e8f0", whiteSpace: "normal", lineHeight: "1.4" },
      autoHeight: true,
    },
    {
      headerName: "CO Code",
      field: "co",
      sortable: true,
      filter: true,
      width: 120,
      minWidth: 120,
      maxWidth: 120,
      // cellRenderer: (params: any) => {
      //   const item = params.data;
      //   if (!item) return null;
      //   return (
      //     <span className={`px-2.5 py-1 rounded text-[12px] font-extrabold border shadow-sm ${item.co !== "N/A" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-gray-50 text-gray-400 border-gray-200"}`}>
      //       {item.co}
      //     </span>
      //   );
      // },
      cellRenderer: (params: any) => {
  const item = params.data;
  if (!item) return null;

  return (
    <span className="text-[12px] font-semibold text-blue-700">
   
      {item.co}
    </span>
  );
},    cellStyle: {
  borderRight: "1px solid #e2e8f0",
  textAlign: "center"
},
      //cellStyle: { borderRight: "1px solid #e2e8f0", textAlign: "center" as const },
    },
    {
      headerName: "Scale of Assessment",
      cellRenderer: (params: any) => {
        const item = params.data;
        if (!item) return null;
        return (
          <div className="flex flex-col gap-1.5 py-2">
            {item.scales.map((s: any, i: number) => (
              <div key={i} className="text-[13px] leading-snug flex gap-2 items-start">
                <span className="font-bold text-blue-1000 whitespace-nowrap min-w-[35px]">{s.range}:</span>
                <span className="text-gray-900 font-medium">
                  {s.description || <span className="text-gray-300 italic">No description</span>}
                </span>
              </div>
            ))}
          </div>
        );
      },
      sortable: false,
      filter: false,
      flex: 2,
      minWidth: 300,
      cellStyle: { borderRight: "1px solid #e2e8f0", whiteSpace: "normal", lineHeight: "1.4" },
      autoHeight: true,
    },
    {
      headerName: "Action",
      cellRenderer: (params: any) => {
        const item = params.data;
        if (!item) return null;
        return (
          // <div className="flex justify-center items-center h-full gap-2">
          //   <button
          //     onClick={() => handleEditRubric(item)}
          //     className="text-blue-600 hover:text-blue-800 p-1.5 hover:bg-blue-50 rounded-full transition-all"
          //     title="Edit Criteria"
          //   >
          //     <FaEdit className="w-4 h-4" />
          //   </button>
          //   <button
          //     onClick={() => handleDeleteRubric(item.id)}
          //     className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-full transition-all"
          //     title="Delete Criteria"
          //   >
          //     <FaTrash className="w-4 h-4" />
          //   </button>
          // </div>

          <div className="flex space-x-3 justify-center items-center h-full">
  <GoPencil
    size={20}
    onClick={() => handleEditRubric(item)}
    className="cursor-pointer text-yellow-600"
    title="Edit Criteria"
  />

  <MdOutlineDoNotDisturbAlt
    size={18}
    onClick={() => handleDeleteRubric(item.id)}
    className="cursor-pointer text-red-600"
    title="Delete Criteria"
  />
</div>
        );
      },
      width: 100,
      minWidth: 100,
      maxWidth: 100,
      cellStyle: { textAlign: "center" as const },
      filter: false,
      sortable: false,
    }
  ], [handleEditRubric, handleDeleteRubric]);

  return (
    <>
      <div className="p-6 bg-gray-100 min-h-screen overflow-y-auto">
        {/* 1. Header & Static Info */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 mb-6">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800">Rubrics List</h2>
          </div>
          <div className="p-6">
            <div className="flex flex-wrap gap-8 text-sm items-center">
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-500 uppercase tracking-tighter">Curriculum :</span>
                <span className="font-semibold text-blue-700">{academic_batch_code || "N/A"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-500 uppercase tracking-tighter">Term :</span>
                <span className="font-semibold text-blue-700">{term_name || "N/A"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-500 uppercase tracking-tighter">Course :</span>
                <span className="font-semibold text-blue-700">{crs_title || "N/A"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Rubrics Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <style>{`
            .ag-body-horizontal-scroll, .ag-body-vertical-scroll { display: none !important; }
            .ag-body-viewport { overflow-x: hidden !important; overflow-y: auto !important; -ms-overflow-style: none !important; scrollbar-width: none !important; }
            .ag-body-viewport::-webkit-scrollbar { display: none !important; }
            .ag-row:hover, .ag-row-selected { background-color: transparent !important; }
          `}</style>

          <div className="mt-4">
            <DataTable
              rowData={rubricsList}
              columnDefs={rubricsColumnDefs}
              headerFilter={false}
              //pageSize={10}
              pagination={false}
            />
          </div>

          {/* New Action Buttons */}
          <div className="flex justify-end gap-3 p-6 bg-gray-50 border-t border-gray-200">
            <button
              onClick={() => setShowReGenConfirm(true)}
              className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 shadow-sm transition-all flex items-center gap-2"
            >
              Re-Generate Rubrics
            </button>
            <button
              onClick={() => setShowFinaliseConfirm(true)}
              className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 shadow-sm transition-all flex items-center gap-2"
            >
              Rubrics Finalised
            </button>
          </div>
        </div>

        {/* 3. Add/Edit Criteria Section */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">{editingCriteriaId ? "Edit Criteria" : "Add/Edit Criteria"}</h2>
          </div>
          <div className="p-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-8">
              {/* Radios */}
              <div className="flex gap-6 items-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="criteriaType"
                    checked={criteriaType === "custom"}
                    onChange={() => setCriteriaType("custom")}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="text-sm font-semibold text-gray-700">Custom Criteria</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="criteriaType"
                    checked={criteriaType === "co"}
                    onChange={() => setCriteriaType("co")}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="text-sm font-semibold text-gray-700">CO as Criteria</span>
                </label>
              </div>

              {/* Scale Input */}
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full md:w-auto">
                <div className="flex flex-col gap-1 w-full md:w-64">
                  <label className="text-xs font-bold text-gray-500 uppercase">Enter No. of Columns (Scale of Assessment) for Rubrics <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    value={scaleCount || ""}
                    onChange={(e) => setScaleCount(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded font-medium text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <button
                  onClick={handleGenerateTable}
                  className="mt-4 md:mt-0 px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700 shadow-sm transition-all flex items-center gap-2"
                >
                  Generate Rubrics table
                </button>
              </div>
            </div>

            {/* 4. Dynamic Generated Table */}
            {showGenerator && (
              <div className="mt-8 border border-gray-200 rounded-lg overflow-x-auto bg-gray-50 p-4">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100 border-b">
                      <th className="p-3 border text-left text-xs font-bold text-gray-600 min-w-[250px]">Criteria</th>
                      {Array.from({ length: scaleCount }).map((_, i) => (
                        <th key={i} className="p-3 border text-center text-xs font-bold text-gray-600 min-w-[200px]">
                          Scale {i + 1}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-3 border align-top">
                        {criteriaType === "custom" ? (
                          <>
                            <textarea
                              placeholder="Enter Criteria..."
                              value={dynamicTableData.criteria}
                              onChange={(e) => {
                                setDynamicTableData({ ...dynamicTableData, criteria: e.target.value });
                                if (errors.criteria) setErrors((prev: any) => { const { criteria, ...rest } = prev; return rest; });
                              }}
                              rows={4}
                              className={`w-full px-3 py-2 border ${errors.criteria ? "border-red-500" : "border-gray-300"} rounded text-sm outline-none focus:ring-1 focus:ring-blue-500 resize-none font-medium text-gray-800`}
                            />
                            {errors.criteria && <p className="text-xs text-red-500 mt-1">{errors.criteria}</p>}
                          </>
                        ) : (
                          <>
                            <select
                              value={dynamicTableData.co}
                              onChange={(e) => {
                                setDynamicTableData({ ...dynamicTableData, co: e.target.value, criteria: `Assessment based on ${e.target.value}` });
                                if (errors.co) setErrors((prev: any) => { const { co, ...rest } = prev; return rest; });
                              }}
                              className={`w-full px-3 py-2 border ${errors.co ? "border-red-500" : "border-gray-300"} rounded text-sm outline-none focus:ring-1 focus:ring-blue-500 bg-white font-medium text-gray-800`}
                            >
                              <option value="">Select CO</option>
                              {cos.map(co => (
                                <option key={co.co_id} value={co.co_code}>{co.co_code}</option>
                              ))}
                            </select>
                            {errors.co && <p className="text-xs text-red-500 mt-1">{errors.co}</p>}
                          </>
                        )}
                      </td>
                      {dynamicTableData.scales.map((scale, i) => (
                        <td key={i} className="p-3 border align-top space-y-3 bg-white">
                          <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Range <span className="text-red-500">*</span></label>
                            <input
                              type="text"
                              placeholder="e.g. 0-2"
                              value={scale.range}
                              onChange={(e) => {
                                const newScales = [...dynamicTableData.scales];
                                newScales[i].range = e.target.value;
                                setDynamicTableData({ ...dynamicTableData, scales: newScales });
                                if (errors[`range_${i}`]) setErrors((prev: any) => { const { [`range_${i}`]: _, ...rest } = prev; return rest; });
                              }}
                              className={`w-full px-2 py-1.5 border ${errors[`range_${i}`] ? "border-red-500" : "border-gray-300"} rounded text-sm outline-none focus:ring-1 focus:ring-blue-500 font-medium text-gray-800`}
                            />
                            {errors[`range_${i}`] && <p className="text-[10px] text-red-500 mt-0.5">{errors[`range_${i}`]}</p>}
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Description <span className="text-red-500">*</span></label>
                            <textarea
                              placeholder="Description..."
                              value={scale.description}
                              onChange={(e) => {
                                const newScales = [...dynamicTableData.scales];
                                newScales[i].description = e.target.value;
                                setDynamicTableData({ ...dynamicTableData, scales: newScales });
                                if (errors[`description_${i}`]) setErrors((prev: any) => { const { [`description_${i}`]: _, ...rest } = prev; return rest; });
                              }}
                              rows={3}
                              className={`w-full px-2 py-1.5 border ${errors[`description_${i}`] ? "border-red-500" : "border-gray-300"} rounded text-sm outline-none focus:ring-1 focus:ring-blue-500 resize-none font-medium text-gray-700`}
                            />
                            {errors[`description_${i}`] && <p className="text-[10px] text-red-500 mt-0.5">{errors[`description_${i}`]}</p>}
                          </div>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>

                {criteriaType === "custom" && (
                  <div className="mt-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-lg border border-gray-100">
                    <div className="w-full md:w-80">
                      <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1 tracking-tight">Map to Course Outcome (CO) - Optional</label>
                      <select
                        value={dynamicTableData.co}
                        onChange={(e) => setDynamicTableData({ ...dynamicTableData, co: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm outline-none focus:ring-1 focus:ring-blue-500 bg-white shadow-sm"
                      >
                        <option value="">Select CO</option>
                        {cos.map(co => (
                          <option key={co.co_id} value={co.co_code}>{co.co_code}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 mt-10 pt-6 border-t border-gray-100">
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700 shadow-sm transition-all flex items-center gap-2"
              >
                <FaFileImport className="w-3.5 h-3.5" />
                Import
              </button>
              <button
                onClick={handleSaveCriteria}
                disabled={loading}
                className="px-6 py-2 text-sm font-bold text-white bg-[#437880] rounded-md hover:bg-[#356169] shadow-sm flex items-center gap-2 disabled:opacity-50"
              >
                <FaSave className="w-3.5 h-3.5" />
                {loading ? "Processing..." : (editingCriteriaId ? "Update" : "Save")}
              </button>
              <button
                onClick={() => navigate(-1)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-md hover:bg-red-600 flex items-center gap-2 transition-colors"
              >
                <FaTimes className="w-3.5 h-3.5" />
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
      <ConfirmDialog
        isOpen={showReGenConfirm}
        onClose={() => setShowReGenConfirm(false)}
        onConfirm={async () => {
          setShowReGenConfirm(false);
          setLoading(true);
          try {
            // Delete all existing rubrics criteria
            if (rubricsList.length > 0) {
              const deletePromises = rubricsList.map(item => manageMteService.deleteRubricCriteria(item.id));
              await Promise.all(deletePromises);
            }

            // Reset states
            setRubricsList([]);
            setDynamicTableData({ criteria: "", scales: [], co: "" });
            setScaleCount(0);
            setShowGenerator(false);
            setEditingCriteriaId(null);
            setErrors({});

            toast.success("Existing rubrics deleted");
          } catch (error) {
            console.error("Error during re-generation:", error);
            toast.error("Failed to delete some existing criteria. Please try again.");
          } finally {
            setLoading(false);
          }
        }}
        title="Re-Generate Rubrics"
        message="Redefining rubrics will delete ALL previously defined criteria and assessment scales for this course. This action cannot be undone. Are you sure you want to proceed?"
      />
      <ConfirmDialog
        isOpen={showFinaliseConfirm}
        onClose={() => setShowFinaliseConfirm(false)}
        onConfirm={() => {
          setShowFinaliseConfirm(false);
          toast.success("Rubrics finalised successfully");
        }}
        title="Finalise Rubrics"
        message="Do you want to finalise the defined rubrics? Finalised rubrics will be available under MTE assessment import."
      />

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={async () => {
          if (deleteCriteriaId) {
            setLoading(true);
            try {
              // It's a real numeric ID
              const res = await manageMteService.deleteRubricCriteria(deleteCriteriaId as number);
              if (res.status === 1) {
                toast.success("Criteria deleted successfully");
                fetchInitialData();
              } else {
                toast.error(res.message || "Failed to delete criteria");
              }
            } catch (error) {
              toast.error("Error deleting criteria");
            } finally {
              setLoading(false);
              setShowDeleteConfirm(false);
            }
          }
        }}
        title="Delete Criteria"
        message="Are you sure you want to delete this criteria? This action cannot be undone."
      />

      <ImportRubricsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => fetchInitialData()}
        targetAoMethodId={aoMethodId || ao_id || 0}
        targetCourse={{
          crs_id: crs_id,
          academic_batch_id: academic_batch_id,
          term_id: term_id
        }}
        currentContext={{
          curriculum: academic_batch_code || "N/A",
          term: term_name || "N/A",
          course: crs_title || "N/A"
        }}
      />
    </>
  );
};




export default DefineRubricsPage;

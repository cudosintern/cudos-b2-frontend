import React, { useState, useEffect, useMemo } from "react";
import DataTable from "../../../../components/Table/DataTable";
import { SectionTitle, TableWrapper } from "./commonComponents";
import ConfirmDialog from "../../../../components/Dialog/ConfirmDialog";
import { toast } from "react-toastify";
import axiosInstance from "../../../../utils/api";
import Select from "../../../../components/FormBuilder/fields/Select";
import {
  DirectAttainmentLevel,
  IndirectTargetLevel,
  CloThreshold,
  BloomThreshold,
} from "./responseInterface";

interface Props {
  selectedBatch: number | "";
  selectedBatchLabel?: string;
}

const AttainmentTargetsForCourse: React.FC<Props> = ({ selectedBatch, selectedBatchLabel }) => {
  /* ===== CONFIRM DIALOG ===== */
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);

  /* ===== TERM / COURSE FILTERS ===== */
  const [termOptions, setTermOptions] = useState<{ value: number; label: string; semester?: number | null }[]>([]);
  const [courseOptions, setCourseOptions] = useState<{ value: number; label: string }[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<number | "">("");
  const [selectedCourse, setSelectedCourse] = useState<number | "">("");

  /* ===== DIRECT ATTAINMENT ===== */
  const [directData, setDirectData] = useState<DirectAttainmentLevel[]>([]);
  const [directLoading, setDirectLoading] = useState(false);
  const [searchTerm1, setSearchTerm1] = useState("");

  /* ===== INDIRECT TARGET ===== */
  const [indirectData, setIndirectData] = useState<IndirectTargetLevel[]>([]);
  const [indirectLoading, setIndirectLoading] = useState(false);
  const [searchTerm2, setSearchTerm2] = useState("");

  /* ===== CO-WISE THRESHOLD ===== */
  const [cloData, setCloData] = useState<CloThreshold[]>([]);
  const [cloEdits, setCloEdits] = useState<Record<number, Partial<CloThreshold>>>({});
  const [cloLoading, setCloLoading] = useState(false);
  const [cloSaving, setCloSaving] = useState(false);

  /* ===== BLOOM THRESHOLD ===== */
  const [bloomData, setBloomData] = useState<BloomThreshold[]>([]);
  const [bloomEdits, setBloomEdits] = useState<Record<number, Partial<BloomThreshold>>>({});
  const [bloomLoading, setBloomLoading] = useState(false);
  const [bloomSaving, setBloomSaving] = useState(false);

  /* ========================================================
     LOAD TERM DROPDOWN
  ======================================================== */
  useEffect(() => {
    axiosInstance
      .get("co_po_mapping/get_semester_dropdown")
      .then((res: any) => {
        const d = res.data;
        if (d?.status && Array.isArray(d.data)) {
          setTermOptions(
            d.data.map((s: any, idx: number) => {
              const label = s.label ?? s.semester_desc ?? "";
              let semester = s.semester;
              if (!semester) {
                // 1. Try parsing digit
                const digitMatch = label.match(/\d+/);
                if (digitMatch) {
                  semester = Number(digitMatch[0]);
                } else {
                  // 2. Handle Roman numerals with word boundaries
                  const upperLabel = label.toUpperCase();
                  if (/\bVIII\b/.test(upperLabel)) semester = 8;
                  else if (/\bVII\b/.test(upperLabel)) semester = 7;
                  else if (/\bVI\b/.test(upperLabel)) semester = 6;
                  else if (/\bIV\b/.test(upperLabel)) semester = 4;
                  else if (/\bV\b/.test(upperLabel)) semester = 5;
                  else if (/\bIII\b/.test(upperLabel)) semester = 3;
                  else if (/\bII\b/.test(upperLabel)) semester = 2;
                  else if (/\bI\b/.test(upperLabel)) semester = 1;
                  // 3. Handle Words
                  else if (upperLabel.includes("EIGHTH")) semester = 8;
                  else if (upperLabel.includes("SEVENTH")) semester = 7;
                  else if (upperLabel.includes("SIXTH")) semester = 6;
                  else if (upperLabel.includes("FOURTH")) semester = 4;
                  else if (upperLabel.includes("FIFTH")) semester = 5;
                  else if (upperLabel.includes("THIRD")) semester = 3;
                  else if (upperLabel.includes("SECOND")) semester = 2;
                  else if (upperLabel.includes("FIRST")) semester = 1;
                }
              }
              // 4. Ultimate Fallback: Use index in the list (1-indexed)
              // Most ERPs return semesters in chronological order.
              if (!semester) {
                semester = idx + 1;
              }
              return {
                value: s.value ?? s.semester_id,
                label: label,
                semester: semester,
              };
            })
          );
        }
      })
      .catch(() => toast.error("Failed to load term options"));
  }, []);

  /* ========================================================
     LOAD COURSE DROPDOWN when batch or term changes
  ======================================================== */
  useEffect(() => {
    if (!selectedBatch || !selectedTerm) {
      setCourseOptions([]);
      setSelectedCourse("");
      clearAllData();
      return;
    }
    axiosInstance
      .get("co_po_mapping/get_course_dropdown")
      .then((res: any) => {
        const d = res.data;
        if (d?.status && Array.isArray(d.data)) {
          const filtered = d.data
            .filter(
              (c: any) =>
                c.academic_batch_id === Number(selectedBatch) &&
                (c.semester_id === Number(selectedTerm) || !c.semester_id)
            )
            .map((c: any) => ({
              value: c.crs_id,
              label: c.course || c.crs_code || c.crs_title || String(c.crs_id),
            }));
          setCourseOptions(filtered);
        }
      })
      .catch(() => toast.error("Failed to load course options"));
    setSelectedCourse("");
    clearAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBatch, selectedTerm]);

  /* ========================================================
     FETCH ALL DATA when all three filters are selected
  ======================================================== */
  useEffect(() => {
    if (!selectedBatch || !selectedTerm || !selectedCourse) {
      clearAllData();
      return;
    }
    fetchDirectData();
    fetchIndirectData();
    fetchCloThresholds();
    fetchBloomThresholds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBatch, selectedTerm, selectedCourse]);

  const clearAllData = () => {
    setDirectData([]);
    setIndirectData([]);
    setCloData([]);
    setBloomData([]);
    setCloEdits({});
    setBloomEdits({});
  };

  /* ===== FETCH DIRECT ===== */
  const fetchDirectData = async () => {
    setDirectLoading(true);
    try {
      const res = await axiosInstance.get(
        `attainment_threshold_level/direct/${selectedBatch}/${selectedTerm}/${selectedCourse}`
      ) as any;
      if (res.data?.data?.items) setDirectData(res.data.data.items);
      else setDirectData([]);
    } catch {
      toast.error("Failed to fetch direct attainment levels");
    } finally {
      setDirectLoading(false);
    }
  };

  /* ===== FETCH INDIRECT TARGET ===== */
  const fetchIndirectData = async () => {
    setIndirectLoading(true);
    try {
      const res = await axiosInstance.get(
        `attainment_threshold_level/indirect-target/${selectedBatch}/${selectedTerm}/${selectedCourse}`
      ) as any;
      if (res.data?.data?.items) setIndirectData(res.data.data.items);
      else setIndirectData([]);
    } catch {
      toast.error("Failed to fetch indirect attainment target levels");
    } finally {
      setIndirectLoading(false);
    }
  };

  /* ===== FETCH CO-WISE THRESHOLD ===== */
  const fetchCloThresholds = async () => {
    setCloLoading(true);
    try {
      const res = await axiosInstance.get("attainment_threshold_level/co-wise-threshold", {
        params: {
          academic_batch_id: selectedBatch,
          semester_id: selectedTerm,
          crs_id: selectedCourse,
        },
      }) as any;
      const items = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
      setCloData(items);
      setCloEdits({});
    } catch {
      toast.error("Failed to fetch CO-wise threshold data");
    } finally {
      setCloLoading(false);
    }
  };

  /* ===== FETCH BLOOM THRESHOLDS ===== */
  const fetchBloomThresholds = async () => {
    setBloomLoading(true);
    try {
      const res = await axiosInstance.get(
        `attainment_threshold_level/bloom-thresholds/${selectedBatch}/${selectedTerm}/${selectedCourse}`
      ) as any;
      const d = res.data?.data ?? res.data;
      const items = Array.isArray(d?.items) ? d.items : [];
      setBloomData(items);
      setBloomEdits({});
    } catch {
      toast.error("Failed to fetch Bloom's level threshold data");
    } finally {
      setBloomLoading(false);
    }
  };

  /* ===== RECALCULATE ATTAINMENT ===== */
  const handleRecalculate = async () => {
    if (!selectedBatch || !selectedTerm || !selectedCourse) {
      toast.warning("Please select Batch, Term, and Course first");
      return;
    }

    // Dynamically derive actual semester from termOptions to avoid issues with state resets
    const termObj = termOptions.find((t) => t.value === selectedTerm);
    const actualSemester = termObj?.semester;

    if (!actualSemester) {
      toast.error("Unable to determine actual semester for recalculation");
      return;
    }

    setIsRecalculating(true);
    try {
      await axiosInstance.post(
        `attainment_threshold_level/indirect-target/recalculate/${selectedBatch}/${actualSemester}/${selectedCourse}`
      );
      toast.success("Attainment recalculated successfully");
      fetchDirectData();
      fetchIndirectData();
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to recalculate attainment";
      toast.error(msg);
    } finally {
      setIsRecalculating(false);
      setIsConfirmOpen(false);
    }
  };

  /* ===== SAVE CO-WISE THRESHOLDS ===== */
  const handleSaveCloThresholds = async () => {
    if (cloData.length === 0) return;

    // Transform edits into payload
    const payload = cloData.map((row) => ({
      clo_id: row.clo_id,
      CEE: cloEdits[row.clo_id]?.CEE ?? row.CEE ?? null,
      MTE: cloEdits[row.clo_id]?.MTE ?? row.MTE ?? null,
      SEE: cloEdits[row.clo_id]?.SEE ?? row.SEE ?? null,
      justify: cloEdits[row.clo_id]?.justify ?? row.justify ?? "",
      modified_by: 1, // Hardcoded user_id as per project pattern
    }));

    setCloSaving(true);
    try {
      await axiosInstance.put("attainment_threshold_level/co-wise-threshold", payload);
      toast.success("CO-wise thresholds updated successfully");
      setCloEdits({});
      fetchCloThresholds();
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.response?.data?.detail || "Failed to save CO-wise thresholds";
      toast.error(msg);
    } finally {
      setCloSaving(false);
    }
  };

  /* ===== SAVE BLOOM'S LEVEL THRESHOLDS ===== */
  const handleSaveBloomThresholds = async () => {
    if (bloomData.length === 0) return;

    // Transform Bloom level fields to backend-expected names
    const payload = bloomData.map((row) => ({
      bloom_id: row.bloom_id,
      CEE: bloomEdits[row.bloom_id]?.cia_bloomlevel_minthreshhold ?? row.cia_bloomlevel_minthreshhold ?? 0,
      MTE: bloomEdits[row.bloom_id]?.mte_bloomlevel_minthreshhold ?? row.mte_bloomlevel_minthreshhold ?? 0,
      SEE: bloomEdits[row.bloom_id]?.tee_bloomlevel_minthreshhold ?? row.tee_bloomlevel_minthreshhold ?? 0,
      student_threshold: bloomEdits[row.bloom_id]?.bloomlevel_studentthreshhold ?? row.bloomlevel_studentthreshhold ?? 0,
      justify: bloomEdits[row.bloom_id]?.justify ?? row.justify ?? "",
      modified_by: 1, // Hardcoded user_id as per project pattern
    }));

    setBloomSaving(true);
    try {
      await axiosInstance.put(
        `attainment_threshold_level/bloom-thresholds/${selectedBatch}/${selectedTerm}/${selectedCourse}`,
        payload
      );
      toast.success("Bloom level thresholds updated successfully");
      setBloomEdits({});
      fetchBloomThresholds();
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.response?.data?.detail || "Failed to save Bloom's level thresholds";
      toast.error(msg);
    } finally {
      setBloomSaving(false);
    }
  };

  /* ===== DIRECT TABLE COLUMNS ===== */
  const directColumnDefs = [
    { headerName: "Sl No.", valueGetter: "node.rowIndex + 1", width: 70, headerClass: "font-bold ag-header-cell-bottom", cellStyle: { textAlign: "center", fontSize: "14px" } },
    {
      headerName: "Attainment Level Name",
      field: "attainment_level_name",
      minWidth: 200,
      flex: 1,
      wrapText: true,
      autoHeight: true,
      headerClass: "font-bold ag-header-cell-bottom-center",
      cellStyle: { fontSize: "14px", lineHeight: "1.5" }
    },
    { headerName: "Attainment Level Value", field: "attainment_level_value", width: 120, headerClass: "font-bold ag-header-cell-bottom-center", cellStyle: { textAlign: "center", fontSize: "14px" } },

    { headerName: "CCE Direct Attainment % of Students", field: "cia_direct_percentage", width: 140, headerClass: "font-bold ag-header-cell-bottom-center", cellStyle: { textAlign: "center", fontSize: "14px" } },
    { headerName: " ", cellRenderer: () => "≥", width: 40, headerClass: "font-bold ag-header-cell-bottom-center", cellStyle: { textAlign: "center", fontSize: "18px", fontWeight: "bold", color: "#000" }, suppressHeaderMenuButton: true, suppressMovable: true },
    { headerName: "CCE Target % (University average % marks)", field: "cia_target_percentage", width: 160, headerClass: "font-bold ag-header-cell-bottom-center", cellStyle: { textAlign: "center", fontSize: "14px" } },

    { headerName: "MTE Direct Attainment % of Students", field: "mte_direct_percentage", width: 140, headerClass: "font-bold ag-header-cell-bottom-center", cellStyle: { textAlign: "center", fontSize: "14px" } },
    { headerName: " ", cellRenderer: () => "≥", width: 40, headerClass: "font-bold ag-header-cell-bottom-center", cellStyle: { textAlign: "center", fontSize: "18px", fontWeight: "bold", color: "#000" }, suppressHeaderMenuButton: true, suppressMovable: true },
    { headerName: "MTE Target % (University average % marks)", field: "mte_target_percentage", width: 160, headerClass: "font-bold ag-header-cell-bottom-center", cellStyle: { textAlign: "center", fontSize: "14px" } },

    { headerName: "SEE Direct Attainment % of Students", field: "tee_direct_percentage", width: 140, headerClass: "font-bold ag-header-cell-bottom-center", cellStyle: { textAlign: "center", fontSize: "14px" } },
    { headerName: " ", cellRenderer: () => "≥", width: 40, headerClass: "font-bold ag-header-cell-bottom-center", cellStyle: { textAlign: "center", fontSize: "18px", fontWeight: "bold", color: "#000" }, suppressHeaderMenuButton: true, suppressMovable: true },
    { headerName: "SEE Target % (University average % marks)", field: "tee_target_percentage", width: 160, headerClass: "font-bold ag-header-cell-bottom-center", cellStyle: { textAlign: "center", fontSize: "14px" } },

    {
      headerName: "Justification",
      field: "justify",
      minWidth: 250,
      flex: 1.5,
      wrapText: true,
      autoHeight: true,
      headerClass: "font-bold ag-header-cell-bottom-center",
      cellStyle: { fontSize: "14px", lineHeight: "1.5" }
    },
  ];

  /* ===== INDIRECT TABLE COLUMNS ===== */
  const indirectColumnDefs = [
    { headerName: "Sl No.", field: "si_no", width: 70, cellStyle: { textAlign: "center", fontSize: "14px" } },
    {
      headerName: "Attainment Level Name",
      field: "attainment_level_name",
      minWidth: 200,
      flex: 1,
      wrapText: true,
      autoHeight: true,
      cellStyle: { fontSize: "14px", lineHeight: "1.5" }
    },
    { headerName: "Attainment Level Value", field: "attainment_level_value", width: 100, cellStyle: { textAlign: "center", fontSize: "14px" } },
    { headerName: "Indirect Attainment %", field: "indirect_attainment_percentage", width: 160, cellStyle: { textAlign: "center", fontSize: "14px" } },
    { headerName: " ", cellRenderer: () => "≥", width: 50, cellStyle: { textAlign: "center", fontSize: "18px", fontWeight: "bold", color: "#000" } },
    { headerName: "Target %", field: "target_percentage", width: 120, cellStyle: { textAlign: "center", fontSize: "14px" } },
  ];

  /* ===== SEARCH-FILTERED DATA ===== */
  const filteredDirect = useMemo(() => {
    if (!searchTerm1) return directData;
    const lo = searchTerm1.toLowerCase();
    return directData.filter(
      (r) =>
        r.attainment_level_name?.toLowerCase().includes(lo) ||
        String(r.attainment_level_value).includes(lo)
    );
  }, [directData, searchTerm1]);

  const filteredIndirect = useMemo(() => {
    if (!searchTerm2) return indirectData;
    const lo = searchTerm2.toLowerCase();
    return indirectData.filter(
      (r) =>
        r.attainment_level_name?.toLowerCase().includes(lo) ||
        String(r.attainment_level_value ?? "").includes(lo)
    );
  }, [indirectData, searchTerm2]);

  const canFetch = !!selectedBatch && !!selectedTerm && !!selectedCourse;

  return (
    <div className="mt-4">
      <style>
        {`
          .ag-header-cell-bottom .ag-header-cell-label {
            align-items: flex-end !important;
            padding-bottom: 8px !important;
          }
          .ag-header-cell-bottom-center .ag-header-cell-label {
            align-items: flex-end !important;
            justify-content: center !important;
            padding-bottom: 8px !important;
            text-align: center !important;
          }
          .ag-header-cell-bottom-center .ag-header-cell-text {
            text-align: center !important;
            width: 100% !important;
          }
        `}
      </style>
      {/* ===== HEADER SECTION: FILTERS & ACTIONS ===== */}
      <div className="flex flex-wrap items-end justify-start gap-6 mb-6">
        <div className="w-[260px]">
          <Select
            label="Term"
            required
            value={selectedTerm}
            onChange={(val) => {
              const termId = Number(val);
              setSelectedTerm(termId);
            }}
            options={termOptions}
            placeholder="Select Term"
          />
        </div>
        <div className="w-[260px]">
          <Select
            label="Course"
            required
            value={selectedCourse}
            onChange={(val) => setSelectedCourse(Number(val))}
            options={courseOptions}
            placeholder={!selectedTerm ? "Select Term first" : "Select Course"}
          />
        </div>

        <div className="flex-1 flex justify-end">
          <button
            onClick={() => setIsConfirmOpen(true)}
            disabled={!canFetch || isRecalculating}
            className="bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white px-6 py-2 rounded text-sm font-semibold shadow-md transition-all h-[38px] flex items-center justify-center whitespace-nowrap"
          >
            {isRecalculating ? "Recalculating..." : "Recalculate Attainment"}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* ===== DIRECT ATTAINMENT SECTION ===== */}
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-base font-semibold text-gray-800">1. Direct Attainment Level for Course</h4>
            <div className="w-64">
              <input
                type="text"
                placeholder="Search levels..."
                value={searchTerm1}
                onChange={(e: any) => setSearchTerm1(e.target.value)}
                className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
          <TableWrapper>
            {directLoading ? (
              <p className="text-center text-sm text-gray-500 py-4">Loading...</p>
            ) : (
              <DataTable
                rowData={filteredDirect}
                columnDefs={directColumnDefs}
                headerFilter={false}
                pageSize={10}
                pagination={false}
                wrapHeaders={true}
              />
            )}
          </TableWrapper>
        </div>

        {/* ===== INDIRECT ATTAINMENT SECTION ===== */}
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-base font-semibold text-gray-800">2. Indirect Attainment / Target Levels for Course</h4>
            <div className="w-64">
              <input
                type="text"
                placeholder="Search levels..."
                value={searchTerm2}
                onChange={(e: any) => setSearchTerm2(e.target.value)}
                className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
          <TableWrapper>
            {indirectLoading ? (
              <p className="text-center text-sm text-gray-500 py-4">Loading...</p>
            ) : (
              <DataTable
                rowData={filteredIndirect}
                columnDefs={indirectColumnDefs}
                headerFilter={false}
                pageSize={10}
                pagination={false}
                wrapHeaders={true}
              />
            )}
          </TableWrapper>
        </div>

        {/* ===== CO-WISE THRESHOLD SECTION ===== */}
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="mb-4">
            <h4 className="text-base font-bold text-gray-800">3. Manage CO-Wise Threshold</h4>
            {canFetch && (
              <div className="mt-2 flex flex-wrap gap-x-8 gap-y-2 p-3 bg-gray-50 border border-gray-100 rounded text-[14px]">
                <div className="flex gap-2">
                  <span className="text-gray-500 font-semibold tracking-tight">Curriculum:</span>
                  <span className="text-gray-900 font-bold">{selectedBatchLabel || "N/A"}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-gray-500 font-semibold tracking-tight">Term:</span>
                  <span className="text-gray-900 font-bold">{termOptions.find(t => t.value === selectedTerm)?.label || "N/A"}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-gray-500 font-semibold tracking-tight">Course:</span>
                  <span className="text-gray-900 font-bold">{courseOptions.find(c => c.value === selectedCourse)?.label || "N/A"}</span>
                </div>
              </div>
            )}
          </div>
          <div className="overflow-x-auto border border-gray-200 rounded-md">
            <table className="w-full text-sm border-collapse table-fixed">
              <thead>
                <tr className="bg-[#f8f9fa] border-b border-gray-200">
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 border-r border-gray-200 w-[100px] text-[14px]">CO Code</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 border-r border-gray-200 w-[300px] text-[14px]">CO Statement</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700 border-r border-gray-200 w-[100px] text-[14px]">CCE Threshold(%)</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700 border-r border-gray-200 w-[100px] text-[14px]">MTE Threshold (%)</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700 border-r border-gray-200 w-[100px] text-[14px]">SEE Threshold (%)</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 text-[14px]">Justification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {cloLoading ? (
                  <tr><td colSpan={6} className="p-6 text-center text-gray-500 italic">Loading...</td></tr>
                ) : cloData.length === 0 ? (
                  <tr><td colSpan={6} className="p-6 text-center text-gray-500 italic">
                    {canFetch ? "No CO threshold data found" : "Select filters to view data"}
                  </td></tr>
                ) : (
                  cloData.map((row) => {
                    const edit = cloEdits[row.clo_id] ?? {};
                    return (
                      <tr key={row.clo_id} className="hover:bg-blue-50 transition-colors">
                        <td className="px-4 py-3 font-semibold text-gray-800 border-r border-gray-100 align-top text-[14px]">{row.clo_code}</td>
                        <td className="px-4 py-3 text-gray-700 border-r border-gray-100 align-top whitespace-normal break-words text-[14px] leading-relaxed" title={row.clo_statement}>{row.clo_statement}</td>
                        <td className="px-3 py-2 border-r border-gray-100 text-center align-top">
                          <input
                            type="number"
                            className="w-16 border border-gray-300 rounded px-1.5 py-1 text-[14px] text-center focus:ring-1 focus:ring-blue-400 outline-none"
                            value={edit.CEE ?? row.CEE ?? ""}
                            onChange={(e) =>
                              setCloEdits((prev) => ({
                                ...prev,
                                [row.clo_id]: { ...prev[row.clo_id], CEE: e.target.value === "" ? null : Number(e.target.value) },
                              }))
                            }
                          />
                        </td>
                        <td className="px-3 py-2 border-r border-gray-100 text-center align-top">
                          <input
                            type="number"
                            className="w-16 border border-gray-300 rounded px-1.5 py-1 text-[14px] text-center focus:ring-1 focus:ring-blue-400 outline-none"
                            value={edit.MTE ?? row.MTE ?? ""}
                            onChange={(e) =>
                              setCloEdits((prev) => ({
                                ...prev,
                                [row.clo_id]: { ...prev[row.clo_id], MTE: e.target.value === "" ? null : Number(e.target.value) },
                              }))
                            }
                          />
                        </td>
                        <td className="px-3 py-2 border-r border-gray-100 text-center align-top">
                          <input
                            type="number"
                            className="w-16 border border-gray-300 rounded px-1.5 py-1 text-[14px] text-center focus:ring-1 focus:ring-blue-400 outline-none"
                            value={edit.SEE ?? row.SEE ?? ""}
                            onChange={(e) =>
                              setCloEdits((prev) => ({
                                ...prev,
                                [row.clo_id]: { ...prev[row.clo_id], SEE: e.target.value === "" ? null : Number(e.target.value) },
                              }))
                            }
                          />
                        </td>
                        <td className="px-4 py-2">
                          <textarea
                            className="w-full border border-gray-300 rounded px-3 py-2 text-[14px] focus:ring-1 focus:ring-blue-400 outline-none resize-y min-h-[38px] bg-white text-gray-700"
                            value={edit.justify ?? row.justify ?? ""}
                            rows={1}
                            placeholder="Enter justification..."
                            onChange={(e) =>
                              setCloEdits((prev) => ({
                                ...prev,
                                [row.clo_id]: { ...prev[row.clo_id], justify: e.target.value },
                              }))
                            }
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {cloData.length > 0 && (
            <div className="flex justify-end mt-3">
              <button
                onClick={handleSaveCloThresholds}
                disabled={cloSaving}
                className="px-6 py-1.5 text-sm font-semibold text-white bg-[#437880] rounded hover:bg-[#386269] shadow transition-all disabled:opacity-50"
              >
                {cloSaving ? "Saving..." : "Update"}
              </button>
            </div>
          )}
        </div>

        {/* ===== BLOOM'S LEVEL THRESHOLD SECTION ===== */}
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="mb-4">
            <h4 className="text-base font-bold text-gray-800">4. Manage Bloom's Level Threshold</h4>
            {canFetch && (
              <div className="mt-2 flex flex-wrap gap-x-8 gap-y-2 p-3 bg-gray-50 border border-gray-100 rounded text-[14px]">
                <div className="flex gap-2">
                  <span className="text-gray-500 font-semibold tracking-tight">Curriculum:</span>
                  <span className="text-gray-900 font-bold">{selectedBatchLabel || "N/A"}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-gray-500 font-semibold tracking-tight">Term:</span>
                  <span className="text-gray-900 font-bold">{termOptions.find(t => t.value === selectedTerm)?.label || "N/A"}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-gray-500 font-semibold tracking-tight">Course:</span>
                  <span className="text-gray-900 font-bold">{courseOptions.find(c => c.value === selectedCourse)?.label || "N/A"}</span>
                </div>
              </div>
            )}
          </div>
          <div className="overflow-x-auto border border-gray-200 rounded-md mb-2">
            <table className="w-full text-sm border-collapse table-fixed">
              <thead>
                <tr className="bg-[#f8f9fa] border-b border-gray-200">
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 border-r border-gray-200 w-[120px] text-[14px]">Level</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 border-r border-gray-200 w-[240px] text-[14px]">Action Verbs</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700 border-r border-gray-200 w-[90px] text-[14px]">CCE Attainment Threshold (%)</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700 border-r border-gray-200 w-[90px] text-[14px]">MTE Attainment Threshold (%)</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700 border-r border-gray-200 w-[90px] text-[14px]">SEE Attainment Threshold(%)</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700 border-r border-gray-200 w-[110px] text-[14px]">%of students ≥ Threshold(%)</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 text-[14px]">Justification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {bloomLoading ? (
                  <tr><td colSpan={7} className="p-6 text-center text-gray-500 italic">Loading...</td></tr>
                ) : bloomData.length === 0 ? (
                  <tr><td colSpan={7} className="p-6 text-center text-gray-500 italic">
                    {canFetch ? "No Bloom's threshold data found" : "Select filters to view data"}
                  </td></tr>
                ) : (
                  bloomData.map((row) => {
                    const edit = bloomEdits[row.bloom_id] ?? {};
                    return (
                      <tr key={row.bloom_id} className="hover:bg-blue-50 transition-colors">
                        <td className="px-4 py-3 font-semibold text-gray-800 border-r border-gray-100 align-top text-[14px]">{row.level}</td>
                        <td className="px-4 py-3 text-gray-700 border-r border-gray-100 align-top whitespace-normal break-words text-[14px] leading-relaxed" title={row.bloom_actionverbs}>{row.bloom_actionverbs}</td>
                        <td className="px-3 py-2 border-r border-gray-100 text-center align-top">
                          <input
                            type="number"
                            className="w-16 border border-gray-300 rounded px-1.5 py-1 text-[14px] text-center focus:ring-1 focus:ring-blue-400 outline-none"
                            value={edit.cia_bloomlevel_minthreshhold ?? row.cia_bloomlevel_minthreshhold ?? ""}
                            onChange={(e) =>
                              setBloomEdits((prev) => ({
                                ...prev,
                                [row.bloom_id]: { ...prev[row.bloom_id], cia_bloomlevel_minthreshhold: Number(e.target.value) },
                              }))
                            }
                          />
                        </td>
                        <td className="px-3 py-2 border-r border-gray-100 text-center align-top">
                          <input
                            type="number"
                            className="w-16 border border-gray-300 rounded px-1.5 py-1 text-[14px] text-center focus:ring-1 focus:ring-blue-400 outline-none"
                            value={edit.mte_bloomlevel_minthreshhold ?? row.mte_bloomlevel_minthreshhold ?? ""}
                            onChange={(e) =>
                              setBloomEdits((prev) => ({
                                ...prev,
                                [row.bloom_id]: { ...prev[row.bloom_id], mte_bloomlevel_minthreshhold: Number(e.target.value) },
                              }))
                            }
                          />
                        </td>
                        <td className="px-3 py-2 border-r border-gray-100 text-center align-top">
                          <input
                            type="number"
                            className="w-16 border border-gray-300 rounded px-1.5 py-1 text-[14px] text-center focus:ring-1 focus:ring-blue-400 outline-none"
                            value={edit.tee_bloomlevel_minthreshhold ?? row.tee_bloomlevel_minthreshhold ?? ""}
                            onChange={(e) =>
                              setBloomEdits((prev) => ({
                                ...prev,
                                [row.bloom_id]: { ...prev[row.bloom_id], tee_bloomlevel_minthreshhold: Number(e.target.value) },
                              }))
                            }
                          />
                        </td>
                        <td className="px-3 py-2 border-r border-gray-100 text-center align-top">
                          <input
                            type="number"
                            className="w-16 border border-gray-300 rounded px-1.5 py-1 text-[14px] text-center focus:ring-1 focus:ring-blue-400 outline-none"
                            value={edit.bloomlevel_studentthreshhold ?? row.bloomlevel_studentthreshhold ?? ""}
                            onChange={(e) =>
                              setBloomEdits((prev) => ({
                                ...prev,
                                [row.bloom_id]: { ...prev[row.bloom_id], bloomlevel_studentthreshhold: Number(e.target.value) },
                              }))
                            }
                          />
                        </td>
                        <td className="px-4 py-2">
                          <textarea
                            className="w-full border border-gray-300 rounded px-3 py-2 text-[14px] focus:ring-1 focus:ring-blue-400 outline-none resize-y min-h-[38px] bg-white text-gray-700"
                            value={edit.justify ?? row.justify ?? ""}
                            rows={1}
                            placeholder="Enter justification..."
                            onChange={(e) =>
                              setBloomEdits((prev) => ({
                                ...prev,
                                [row.bloom_id]: { ...prev[row.bloom_id], justify: e.target.value },
                              }))
                            }
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {bloomData.length > 0 && (
            <div className="flex justify-end mt-3">
              <button
                onClick={handleSaveBloomThresholds}
                disabled={bloomSaving}
                className="px-6 py-1.5 text-sm font-semibold text-white bg-[#437880] rounded hover:bg-[#386269] shadow transition-all disabled:opacity-50"
              >
                {bloomSaving ? "Saving..." : "Update"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ===== CONFIRM DIALOG ===== */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleRecalculate}
        title="Confirm Recalculation"
        message="Are you sure you want to Re-Calculate Attainment for this course? This action may take a moment."
      />
    </div>
  );
};

export default AttainmentTargetsForCourse;
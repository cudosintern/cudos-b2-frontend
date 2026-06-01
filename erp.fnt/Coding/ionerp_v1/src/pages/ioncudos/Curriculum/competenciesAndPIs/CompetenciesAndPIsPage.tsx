import React, { useEffect, useState, useMemo, useCallback } from "react";
import "./CompetenciesAndPIs.css";
import { FaSave, FaSync, FaTimes, FaCheck, FaPencilAlt } from "react-icons/fa";
import { 
  getCurriculumList, getPoList, viewCPIs, manageCompetency, 
  deleteCompetency, managePI, deletePI 
} from "./competenciesAndPIsSchema";
import { Curriculum, ProgramOutcome, Competency, PerformanceIndicator, ViewCPIsResponse } from "./types";
import DataTable from "../../../../components/Table/DataTable";
import UIButton from "../../../../components/FormBuilder/fields/Button";

const emptyCompForm = { pi_statement: "" };
const emptyPIForm = { msr_statement: "", pi_codes: "" };

interface ConfirmDialogState {
  open: boolean;
  message: string;
  onConfirm: () => void;
}

const CompetenciesAndPIsPage = () => {
  const [viewMode, setViewMode] = useState<"list" | "manageCompetency" | "managePI">("list");
  const [showViewModal, setShowViewModal] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    open: false,
    message: "",
    onConfirm: () => {},
  });

  const openConfirm = (message: string, onConfirm: () => void) => {
    setConfirmDialog({ open: true, message, onConfirm });
  };

  const closeConfirm = () => {
    setConfirmDialog({ open: false, message: "", onConfirm: () => {} });
  };

  const handleConfirmOk = () => {
    confirmDialog.onConfirm();
    closeConfirm();
  };
  
  // States
  const [curriculumList, setCurriculumList] = useState<Curriculum[]>([]);
  const [selectedCurriculumId, setSelectedCurriculumId] = useState<number | "">(() => {
    const saved = sessionStorage.getItem('cpi_selected_curriculum');
    return saved ? Number(saved) : "";
  });
  
  const [poList, setPoList] = useState<ProgramOutcome[]>([]);
  const [selectedPo, setSelectedPo] = useState<ProgramOutcome | null>(null);
  
  const [competencyList, setCompetencyList] = useState<Competency[]>([]);
  const [selectedCompetency, setSelectedCompetency] = useState<Competency | null>(null);
  
  const [piList, setPiList] = useState<PerformanceIndicator[]>([]);
  const [viewData, setViewData] = useState<ViewCPIsResponse | null>(null);

  // Forms
  const [compForm, setCompForm] = useState(emptyCompForm);
  const [compEditingId, setCompEditingId] = useState<number | null>(null);
  
  const [piForm, setPiForm] = useState(emptyPIForm);
  const [piEditingId, setPiEditingId] = useState<number | null>(null);

  // Pagination & Search
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");

  // Load curriculums on mount only
  useEffect(() => {
    loadCurriculums();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reactively reload POs whenever selected curriculum changes
  useEffect(() => {
    if (selectedCurriculumId) {
      sessionStorage.setItem('cpi_selected_curriculum', String(selectedCurriculumId));
      setPoList([]);
      loadPOs(Number(selectedCurriculumId));
    } else {
      sessionStorage.removeItem('cpi_selected_curriculum');
      setPoList([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCurriculumId]);

  const loadCurriculums = async () => {
    const res = await getCurriculumList();
    if (res.status && res.data) {
      setCurriculumList(res.data);
    }
  };

  const handleCurriculumChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    // Reset all downstream state first
    setSelectedPo(null);
    setSelectedCompetency(null);
    setCompetencyList([]);
    setPiList([]);
    setViewMode("list");
    // This triggers the useEffect above which reloads POs
    setSelectedCurriculumId(val ? Number(val) : "");
  };

  const loadPOs = async (batchId: number) => {
    try {
      const res = await getPoList(batchId);
      console.log("loadPOs fetched:", res.data);
      if (res.status && res.data) {
        setPoList(res.data);
      } else {
        setPoList([]);
      }
    } catch(err) {
      console.error("Error loading POs", err);
      setPoList([]);
    }
  };

  /* ================= NAVIGATION ACTIONS ================= */
  const openManageCompetency = async (po: ProgramOutcome) => {
    setSelectedPo(po);
    await loadCompetencies(po.po_id);
    setCompForm(emptyCompForm);
    setCompEditingId(null);
    setViewMode("manageCompetency");
  };

  const openManagePI = async (comp: Competency) => {
    setSelectedCompetency(comp);
    await loadPIs(comp.pi_id); // DB uses pi_id for competency
    setPiForm(emptyPIForm);
    setPiEditingId(null);
    setViewMode("managePI");
  };

  const openView = async (po: ProgramOutcome) => {
    const res = await viewCPIs(po.po_id);
    if (res.status && res.data) {
      if (Array.isArray(res.data)) {
        // Legacy: array response — use row data for PO info
        setViewData({ po_code: po.po_code, po_statement: po.po_statement, competencies: res.data as any });
      } else {
        // New: structured response — API provides po_code/po_statement directly
        // This prevents cross-curriculum data contamination
        const d = res.data as any;
        setViewData({
          po_code: d.po_code || po.po_code,
          po_statement: d.po_statement || po.po_statement,
          competencies: d.competencies || []
        });
      }
      setShowViewModal(true);
    } else {
      setViewData({ po_code: po.po_code, po_statement: po.po_statement, competencies: [] });
      setShowViewModal(true);
    }
  };

  /* ================= COMPETENCY ACTIONS ================= */
  const loadCompetencies = async (poId: number) => {
    // We get competencies by viewing CPIs for the PO, since there's no standalone get
    const res = await viewCPIs(poId);
    let comps: Competency[] = [];
    if (res.status && res.data) {
      if (Array.isArray(res.data)) {
        const arr = res.data as unknown as any[];
        comps = arr.map(c => ({
          pi_id: c.pi_id,
          po_id: poId,
          pi_statement: c.pi_statement
        }));
      } else {
        const viewData = res.data as unknown as any;
        comps = (viewData.competencies || []).map((c: any) => ({
          pi_id: c.pi_id,
          po_id: poId,
          pi_statement: c.pi_statement
        }));
      }
    }
    setCompetencyList(comps);
  };

  const handleSaveCompetency = async () => {
    if (!compForm.pi_statement.trim()) {
      alert("Competency statement cannot be empty");
      return;
    }
    try {
      if (compEditingId) {
        await manageCompetency({ pi_id: compEditingId, po_id: selectedPo?.po_id || 0, pi_statement: compForm.pi_statement });
      } else {
        await manageCompetency({ po_id: selectedPo?.po_id || 0, pi_statement: compForm.pi_statement });
      }
      setCompForm(emptyCompForm);
      setCompEditingId(null);
      if (selectedPo) await loadCompetencies(selectedPo.po_id);
    } catch (e) {
      alert("Failed to save competency");
    }
  };

  const handleEditCompetency = (c: Competency) => {
    setCompEditingId(c.pi_id);
    setCompForm({ pi_statement: c.pi_statement });
  };

  const handleDeleteCompetency = (id: number) => {
    openConfirm("Are you sure you want to Delete this competency?", async () => {
      try {
        await deleteCompetency(id);
        if (selectedPo) await loadCompetencies(selectedPo.po_id);
      } catch (e) {
        openConfirm("Failed to delete competency", () => {});
      }
    });
  };

  /* ================= PI ACTIONS ================= */
  const loadPIs = async (compId: number) => {
    // PIs are nested inside competencies, fetch via ViewCPIs using the selected PO
    if (!selectedPo) return;
    const res = await viewCPIs(selectedPo.po_id);
    let pis: PerformanceIndicator[] = [];
    if (res.status && res.data) {
       let compList: any[] = [];
       if (Array.isArray(res.data)) {
           compList = res.data as unknown as any[];
       } else {
           const viewData = res.data as unknown as ViewCPIsResponse;
           compList = viewData.competencies || [];
       }
       
       const comp = compList.find((c: any) => c.pi_id === compId);
       if (comp && comp.performance_indicators) {
           pis = comp.performance_indicators.map((p: any) => ({
               msr_id: p.msr_id,
               pi_id: compId,
               pi_codes: p.pi_codes,
               msr_statement: p.msr_statement
           }));
       }
    }
    setPiList(pis);
  };

  const handleSavePI = async () => {
    if (!piForm.msr_statement.trim()) {
      alert("Performance indicator cannot be empty");
      return;
    }
    try {
      if (piEditingId) {
        await managePI({ 
            msr_id: piEditingId, 
            pi_id: selectedCompetency?.pi_id || 0, 
            msr_statement: piForm.msr_statement,
            pi_codes: piForm.pi_codes
        });
      } else {
        await managePI({ 
            pi_id: selectedCompetency?.pi_id || 0, 
            msr_statement: piForm.msr_statement,
            pi_codes: piForm.pi_codes
        });
      }
      setPiForm(emptyPIForm);
      setPiEditingId(null);
      if (selectedCompetency) await loadPIs(selectedCompetency.pi_id);
    } catch (e) {
      alert("Failed to save PI");
    }
  };

  const handleEditPI = (p: PerformanceIndicator) => {
    setPiEditingId(p.msr_id);
    setPiForm({ msr_statement: p.msr_statement, pi_codes: p.pi_codes || "" });
  };

  const handleDeletePI = (id: number) => {
    openConfirm("Are you sure you want to Delete this performance indicator?", async () => {
      try {
        await deletePI(id);
        if (selectedCompetency) await loadPIs(selectedCompetency.pi_id);
      } catch (e) {
        openConfirm("Failed to delete PI", () => {});
      }
    });
  };

  /* ================= CONFIRM DIALOG ================= */
  const renderConfirmDialog = () => {
    if (!confirmDialog.open) return null;
    return (
      <div style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.45)",
        zIndex: 2000,
        display: "flex", alignItems: "center", justifyContent: "center"
      }}>
        <div style={{
          background: "#fff",
          borderRadius: 6,
          boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
          minWidth: 380,
          maxWidth: 480,
          overflow: "hidden"
        }}>
          {/* Header */}
          <div style={{
            background: "linear-gradient(90deg,#2c3e50 80%,#34495e 100%)",
            padding: "10px 18px",
            display: "flex", alignItems: "center", justifyContent: "space-between"
          }}>
            <span style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>Delete Confirmation</span>
            <span style={{
              background: "#2980b9", color: "#fff",
              borderRadius: "50%", width: 22, height: 22,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 700, cursor: "default"
            }}>?</span>
          </div>
          {/* Body */}
          <div style={{ padding: "24px 24px 12px 24px", fontSize: 14, color: "#333" }}>
            {confirmDialog.message}
          </div>
          {/* Separator */}
          <div style={{ borderTop: "1px solid #e5e7eb", margin: "0 0 0 0" }} />
          {/* Footer */}
          <div style={{
            padding: "14px 20px",
            display: "flex", justifyContent: "flex-end", gap: 10,
            background: "#f9fafb"
          }}>
            <button
              onClick={handleConfirmOk}
              style={{
                background: "#2980b9", color: "#fff",
                border: "none", borderRadius: 4,
                padding: "7px 22px", fontWeight: 600,
                fontSize: 13, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 5
              }}
            >
              <FaCheck size={12} /> Ok
            </button>
            <button
              onClick={closeConfirm}
              style={{
                background: "#e74c3c", color: "#fff",
                border: "none", borderRadius: 4,
                padding: "7px 22px", fontWeight: 600,
                fontSize: 13, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 5
              }}
            >
              <FaTimes size={12} /> Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  /* ================= VIEW C & PIs MODAL ================= */
  const renderViewModal = () => {
    if (!showViewModal || !viewData) return null;

    return (
      <div style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.45)",
        zIndex: 1000,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16
      }}>
        <div style={{
          background: "#fff",
          borderRadius: 6,
          boxShadow: "0 6px 32px rgba(0,0,0,0.18)",
          width: "100%", maxWidth: 780,
          maxHeight: "90vh",
          display: "flex", flexDirection: "column",
          overflow: "hidden"
        }}>
          {/* Modal Header - dark style matching pic 4 */}
          <div style={{
            background: "linear-gradient(90deg,#2c3e50 80%,#34495e 100%)",
            padding: "11px 18px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexShrink: 0
          }}>
            <span style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>
              Program Outcomes(POs), C &amp; PIs
            </span>
            <span style={{
              background: "#2980b9", color: "#fff",
              borderRadius: "50%", width: 22, height: 22,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 700, cursor: "default"
            }}>?</span>
          </div>

          {/* Modal Content - Scrollable */}
          <div style={{ padding: "18px 24px", overflowY: "auto", flexGrow: 1 }}>
            {/* PO Statement in red bold */}
            <div style={{ marginBottom: 16, fontSize: 13 }}>
              <span style={{ fontWeight: 700, color: "#c0392b" }}>Program Outcome (PO): </span>
              <span style={{ color: "#c0392b", fontWeight: 600 }}>
                {viewData.po_code} - {viewData.po_statement}
              </span>
            </div>

            {viewData.competencies?.map((c, cIdx) => (
              <div key={c.pi_id} style={{ marginBottom: 18 }}>
                {/* Competency row */}
                <div style={{
                  display: "flex", justifyContent: "space-between",
                  alignItems: "flex-start", marginBottom: 6
                }}>
                  <span style={{ fontSize: 13, color: "#2980b9", fontWeight: 600 }}>
                    <span style={{ fontWeight: 700 }}>Competency {cIdx + 1}:</span>{" "}
                    {c.pi_statement}
                  </span>
                  <span style={{
                    color: "#2980b9", fontWeight: 600, fontSize: 12,
                    whiteSpace: "nowrap", marginLeft: 16, cursor: "pointer"
                  }}>PI Codes</span>
                </div>

                {/* PIs table */}
                {c.performance_indicators && c.performance_indicators.length > 0 && (
                  <table style={{
                    width: "100%", borderCollapse: "collapse",
                    fontSize: 13, marginBottom: 4
                  }}>
                    <tbody>
                      {c.performance_indicators.map((p, pIdx) => (
                        <tr key={p.msr_id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                          <td style={{
                            padding: "7px 12px", color: "#333", width: "85%"
                          }}>
                            <span style={{ fontWeight: 700 }}>Performance Indicator {pIdx + 1}:</span>{" "}
                            {p.msr_statement}
                          </td>
                          <td style={{
                            padding: "7px 12px", textAlign: "right",
                            fontWeight: 700, color: "#333", whiteSpace: "nowrap"
                          }}>
                            {p.pi_codes || `${cIdx + 1}.${pIdx + 1}`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {(!c.performance_indicators || c.performance_indicators.length === 0) && (
                  <div style={{ fontSize: 12, color: "#aaa", padding: "4px 12px" }}>No performance indicators.</div>
                )}
              </div>
            ))}
            {(!viewData.competencies || viewData.competencies.length === 0) && (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#aaa", fontSize: 13 }}>
                No competencies found for this Program Outcome.
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div style={{
            padding: "12px 20px",
            borderTop: "1px solid #e5e7eb",
            display: "flex", justifyContent: "flex-end",
            flexShrink: 0
          }}>
            <button
              onClick={() => setShowViewModal(false)}
              style={{
                background: "#e74c3c", color: "#fff",
                border: "none", borderRadius: 4,
                padding: "7px 22px", fontWeight: 600,
                fontSize: 13, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 5
              }}
            >
              <FaTimes size={12} /> Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Use stable inline refs to avoid stale closure in AG Grid cell renderers
  const openViewRef = React.useRef(openView);
  const openManageRef = React.useRef(openManageCompetency);
  React.useEffect(() => { openViewRef.current = openView; });
  React.useEffect(() => { openManageRef.current = openManageCompetency; });

  const columnDefs = useMemo(() => [
    {
      headerName: "PO Code",
      field: "po_code",
      sortable: true,
      filter: true,
      flex: 1,
      minWidth: 100,
    },
    {
      headerName: "Approved Program Outcomes (POs)",
      field: "po_statement",
      sortable: true,
      filter: true,
      flex: 3,
      minWidth: 300,
      cellRenderer: (params: any) => (
        <div className="py-2 text-sm text-gray-600 break-words leading-relaxed">
          {params.value}
        </div>
      ),
    },
    {
      headerName: "View C & PIs",
      field: "view",
      cellRenderer: (params: any) => (
        <div className="flex justify-start items-center h-full px-4">
          <span
            className="text-blue-600 hover:text-blue-800 font-semibold no-underline hover:underline cursor-pointer transition-all underline-offset-4 whitespace-nowrap"
            onClick={() => openViewRef.current(params.data)}
          >
            View C &amp; PIs
          </span>
        </div>
      ),
      width: 250,
      sortable: false,
      filter: false,
    },
    {
      headerName: "BoS Comments",
      field: "bos_comments",
      sortable: true,
      filter: true,
      flex: 2,
      minWidth: 200,
      cellRenderer: (params: any) => (
        <div className="py-2 text-sm text-gray-500">
          {params.value || "-"}
        </div>
      )
    },
    {
      headerName: "Manage C & PIs",
      field: "manage",
      cellStyle: { textAlign: "center" },
      cellRenderer: (params: any) => (
        <div className="flex justify-center items-center h-full">
           <span
             className="text-blue-600 hover:text-blue-800 font-semibold no-underline hover:underline cursor-pointer transition-all underline-offset-4"
             onClick={() => openManageRef.current(params.data)}
           >
             Add / Edit
           </span>
        </div>
      ),
      width: 140,
      sortable: false,
      filter: false,
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], []);

  const filteredPOs = useMemo(() => {
    return poList.filter(po => 
      po.po_code?.toLowerCase().includes(search.toLowerCase()) || 
      po.po_statement?.toLowerCase().includes(search.toLowerCase()) ||
      po.bos_comments?.toLowerCase().includes(search.toLowerCase())
    );
  }, [poList, search]);

  const compColumnDefs = useMemo(() => [
    {
      headerName: "SL No",
      valueGetter: "node.rowIndex + 1",
      width: 80,
    },
    {
      headerName: "Competency Statement",
      field: "pi_statement",
      flex: 3,
      minWidth: 300,
    },
    {
      headerName: "Performance Indicators",
      field: "manage_pis",
      cellStyle: { textAlign: "center" },
      cellRenderer: (params: any) => (
        <span 
          className="text-blue-600 hover:text-blue-800 font-semibold no-underline hover:underline cursor-pointer transition-all underline-offset-4"
          onClick={() => openManagePI(params.data)}
        >
          Add/Edit PI's
        </span>
      ),
      width: 150,
    },
    {
      headerName: "Action",
      field: "action",
      cellStyle: { textAlign: "center" },
      cellRenderer: (params: any) => (
        <div className="flex justify-center gap-4 h-full items-center">
          <FaPencilAlt 
            onClick={() => handleEditCompetency(params.data)} 
            className="text-amber-600 cursor-pointer hover:scale-110 transition-transform" 
            size={18} 
          />
          <FaTimes 
            onClick={() => handleDeleteCompetency(params.data.pi_id)} 
            className="text-rose-500 cursor-pointer hover:scale-110 transition-transform" 
            size={18} 
          />
        </div>
      ),
      width: 120,
    }
  ], [openManagePI]);

  const piColumnDefs = useMemo(() => [
    {
      headerName: "SL No",
      valueGetter: "node.rowIndex + 1",
      width: 80,
    },
    {
      headerName: "PI Statement",
      field: "msr_statement",
      flex: 3,
      minWidth: 300,
    },
    {
      headerName: "Action",
      field: "action",
      cellStyle: { textAlign: "center" },
      cellRenderer: (params: any) => (
        <div className="flex justify-center gap-4 h-full items-center">
          <FaPencilAlt 
            onClick={() => handleEditPI(params.data)} 
            className="text-amber-600 cursor-pointer hover:scale-110 transition-transform" 
            size={18} 
          />
          <FaTimes 
            onClick={() => handleDeletePI(params.data.msr_id)} 
            className="text-rose-500 cursor-pointer hover:scale-110 transition-transform" 
            size={18} 
          />
        </div>
      ),
      width: 120,
    }
  ], [handleEditPI, handleDeletePI]);

  /* ================= RENDER LIST ================= */
  if (viewMode === "list") {
    return (
      <div className="p-0 min-h-[600px]">
        {renderViewModal()}
        {renderConfirmDialog()}
        
          <h3 className="text-lg leading-6 font-medium pb-5 text-[#4a8494]">
            Competencies and Performance Indicators (PIs)
          </h3>

        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8 shadow-sm">
          <div className="max-w-xl">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Curriculum <span className="text-red-500">*</span>
            </label>
            <select 
              value={selectedCurriculumId || ""}
              onChange={handleCurriculumChange}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#4a8494] focus:border-[#4a8494] sm:text-sm bg-white text-gray-700 transition-all cursor-pointer"
            >
              <option value="">Select Curriculum</option>
              {curriculumList.map((c) => (
                <option key={c.academic_batch_id || c.curriculum_id} value={c.academic_batch_id || c.curriculum_id}>
                  {c.academic_batch_code || c.curriculum_name || c.name || `Batch ${c.academic_batch_id || c.curriculum_id}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-6 flex justify-between items-end">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <span>Show</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="border border-gray-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#4a8494]/20 focus:border-[#4a8494] transition-all bg-white font-medium"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>entries</span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 font-medium">Search:</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4a8494]/20 focus:border-[#4a8494] w-64 bg-white transition-all caret-[#4a8494]"
              placeholder="Search Program Outcomes..."
            />
          </div>
        </div>

        <div className="relative">
          {!selectedCurriculumId ? (
            <div className="flex flex-col items-center justify-center py-20 bg-gray-50/30 rounded-xl border border-dashed border-gray-200">
               <p className="text-gray-400 font-medium">Please select a curriculum to view Program Outcomes</p>
            </div>
          ) : (
            <DataTable
              key={selectedCurriculumId}
              columnDefs={columnDefs}
              rowData={filteredPOs}
              showAddButton={false}
              showExportButton={false}
              headerFilter={true}
              pageSize={pageSize}
              showSearch={false}
              showEntries={false}
            />
          )}
        </div>
                
        <div className="flex justify-end mt-12 pt-6 border-t border-gray-100">
          <UIButton 
            variant="primary"
            className="bg-[#5cb85c] hover:bg-[#4cae4c] text-white px-8 py-2.5 rounded-lg font-bold flex items-center shadow-lg shadow-green-600/10 transform transition-all active:scale-95 group"
          >
            <FaCheck className="mr-2 group-hover:scale-125 transition-transform" /> Proceed to Course
          </UIButton>
        </div>
      </div>
    );
  }

  /* ================= MANAGE COMPETENCY ================= */
  if (viewMode === "manageCompetency") {
    return (
      <div className="p-0 fade-in">
        {renderConfirmDialog()}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg leading-6 font-medium text-[#4a8494]">Manage Competencies</h3>
        </div>

        <div className="bg-[#f8fafc] border border-gray-200 rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Program Outcome (PO) Statement:</label>
              <div className="bg-white border border-gray-200 rounded-lg p-4 min-h-[100px] text-gray-600 text-sm leading-relaxed shadow-sm">
                {selectedPo?.po_statement}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">BoS Comments:</label>
              <div className="bg-white border border-gray-200 rounded-lg p-4 min-h-[100px] text-gray-600 text-sm leading-relaxed shadow-sm italic">
                {selectedPo?.bos_comments || "No BoS Comments"}
              </div>
            </div>
          </div>
        </div>
        
        <div className="mb-10">
          <DataTable
            columnDefs={compColumnDefs}
            rowData={competencyList}
            showAddButton={false}
            showExportButton={false}
            headerFilter={true}
            pageSize={10}
          />
        </div>

        <div className="mt-12">
          <h4 className="text-lg leading-6 font-medium pb-5 text-[#4a8494]">
            Add / Edit Competencies Statement:
          </h4>
          <div className="flex flex-col md:flex-row gap-6">
            <label className="shrink-0 w-48 text-sm font-bold text-gray-700 pt-3">Competency Statement :</label>
            <div className="flex-grow">
              <textarea
                className="block w-full px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-[#4a8494]/20 focus:border-[#4a8494] sm:text-sm min-h-[120px] transition-all bg-white"
                value={compForm.pi_statement}
                onChange={(e) => setCompForm({ ...compForm, pi_statement: e.target.value })}
                placeholder="Enter Competency Statement"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-10">
          <UIButton 
            variant="primary"
            className="bg-[#4a8494] hover:bg-[#3d6d7a] text-white px-8 py-2.5 rounded-lg font-bold flex items-center shadow-md border-none transition-all active:scale-95"
            onClick={handleSaveCompetency}
          >
            <FaSave className="mr-2" /> Save
          </UIButton>
          <UIButton 
            variant="secondary"
            className="bg-[#eefbff] hover:bg-[#e0f7fa] text-[#4a8494] border border-[#4a8494] px-8 py-2.5 rounded-lg font-bold flex items-center transition-all active:scale-95"
            onClick={() => setCompForm(emptyCompForm)}
          >
            <FaSync className="mr-2" /> Reset
          </UIButton>
          <UIButton 
            variant="primary" 
            className="bg-[#d9534f] hover:bg-[#c9302c] text-white px-8 py-2.5 rounded-lg font-bold flex items-center shadow-md border-none transition-all active:scale-95"
            onClick={() => { setViewMode("list"); setCompForm(emptyCompForm); setCompEditingId(null); }}
          >
            <FaTimes className="mr-2" /> Close
          </UIButton>
        </div>
      </div>
    );
  }

  /* ================= MANAGE PI ================= */
  if (viewMode === "managePI") {
    return (
      <div className="p-0 fade-in">
        {renderConfirmDialog()}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg leading-6 font-medium text-[#4a8494]">Performance Indicators</h3>
        </div>

        <div className="bg-[#f8fafc] border border-gray-200 rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Competency Statement:</label>
              <div className="bg-white border border-gray-200 rounded-lg p-4 min-h-[100px] text-gray-600 text-sm leading-relaxed shadow-sm">
                {selectedCompetency?.pi_statement}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Competency Code:</label>
              <div className="bg-white border border-gray-200 rounded-lg p-4 min-h-[100px] text-gray-600 text-sm font-bold shadow-sm">
                PI-{selectedCompetency?.pi_id}
              </div>
            </div>
          </div>
        </div>
        
        <div className="mb-10">
          <DataTable
            columnDefs={piColumnDefs}
            rowData={piList}
            showAddButton={false}
            showExportButton={false}
            headerFilter={true}
            pageSize={10}
          />
        </div>

        <div className="mt-12">
          <h4 className="text-lg leading-6 font-medium pb-5 text-[#4a8494]">
            Add / Edit Performance Indicator Statement:
          </h4>
          <div className="flex flex-col md:flex-row gap-6">
            <label className="shrink-0 w-48 text-sm font-bold text-gray-700 pt-3">PI Statement :</label>
            <div className="flex-grow">
              <textarea
                className="block w-full px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-[#4a8494]/20 focus:border-[#4a8494] sm:text-sm min-h-[120px] transition-all bg-white"
                value={piForm.msr_statement}
                onChange={(e) => setPiForm({ ...piForm, msr_statement: e.target.value })}
                placeholder="Enter Performance Indicator Statement"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-10">
          <UIButton 
            variant="primary"
            className="bg-[#4a8494] hover:bg-[#3d6d7a] text-white px-8 py-2.5 rounded-lg font-bold flex items-center shadow-md border-none transition-all active:scale-95"
            onClick={handleSavePI}
          >
            <FaSave className="mr-2" /> Save
          </UIButton>
          <UIButton 
            variant="secondary"
            className="bg-[#eefbff] hover:bg-[#e0f7fa] text-[#4a8494] border border-[#4a8494] px-8 py-2.5 rounded-lg font-bold flex items-center transition-all active:scale-95"
            onClick={() => setPiForm(emptyPIForm)}
          >
            <FaSync className="mr-2" /> Reset
          </UIButton>
          <UIButton 
            variant="primary" 
            className="bg-[#d9534f] hover:bg-[#c9302c] text-white px-8 py-2.5 rounded-lg font-bold flex items-center shadow-md border-none transition-all active:scale-95"
            onClick={() => { setViewMode("manageCompetency"); setPiForm(emptyPIForm); setPiEditingId(null); }}
          >
            <FaTimes className="mr-2" /> Close
          </UIButton>
        </div>
      </div>
    );
  }

  return null;
};

export default CompetenciesAndPIsPage;
import React, { useState, useMemo, useEffect } from "react";
import { GoPencil } from "react-icons/go";
import { MdOutlineDoNotDisturbAlt } from "react-icons/md";
import { FaCheckCircle, FaTimes, FaPlus } from "react-icons/fa";
import { toast } from "react-toastify";
import DataTable from "../../../../components/Table/DataTable";
import ConfirmDialog from "../../../../components/Dialog/ConfirmDialog";
import axiosInstance from "../../../../utils/api";
import { StakeholderDetail } from "./stakeholderInterface";
import BulkImportStakeholder from "./BulkImportStakeholder";
import StakeholderForm from "./StakeholderForm";
import { ApiEndpoint } from "../../../../utils/ApiEndpoint/emsapiEndpoint";

const ManageStakeholderPage: React.FC = () => {
  const [stakeholders, setStakeholders] = useState<StakeholderDetail[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const [viewMode, setViewMode] = useState<"list" | "add" | "edit" | "import">(
    "list",
  );
  const [editingData, setEditingData] = useState<StakeholderDetail | null>(
    null,
  );

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [statusDialog, setStatusDialog] = useState<{
    id: number;
    status: number;
  } | null>(null);

  // Dropdown Filter States
  const [filterGroup, setFilterGroup] = useState<string>("");
  const [filterSchool, setFilterSchool] = useState<string>("");
  const [filterProgram, setFilterProgram] = useState<string>("");
  const [filterCurriculum, setFilterCurriculum] = useState<string>("");

  // Dropdown Data States
  const [groups, setGroups] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [curriculums, setCurriculums] = useState<any[]>([]);

  // 1. Fetch Static Dropdowns (Groups & Schools) using ApiEndpoint
  useEffect(() => {
    axiosInstance
      .get<any>(ApiEndpoint.survey.stakeholder.groups)
      .then((res) => {
        if (res.data?.status) {
          const activeGroups = res.data.data.filter((g: any) => g.status === 1);
          setGroups(activeGroups);
        }
      })
      .catch((err) => console.error("Group API Error", err));

    axiosInstance
      .get<any>(ApiEndpoint.survey.stakeholder.schools)
      .then((res) => {
        if (res.data?.status) setSchools(res.data.data);
      })
      .catch((err) => console.error("School API Error", err));
  }, []);

  // 2. Fetch Programs on School Filter Change
  useEffect(() => {
    if (filterSchool) {
      axiosInstance
        .get<any>(
          `${ApiEndpoint.survey.stakeholder.programs}?dept_id=${filterSchool}`,
        )
        .then((res) => {
          if (res.data?.status) setPrograms(res.data.data);
        })
        .catch((err) => console.error("Program API Error", err));
    } else {
      setPrograms([]);
    }
  }, [filterSchool]);

  // 3. Fetch Curriculums on Program Filter Change
  useEffect(() => {
    if (filterProgram) {
      axiosInstance
        .get<any>(
          `${ApiEndpoint.survey.stakeholder.curriculum}?pgm_id=${filterProgram}`,
        )
        .then((res) => {
          if (res.data?.status) setCurriculums(res.data.data);
        })
        .catch((err) => console.error("Curriculum API Error", err));
    } else {
      setCurriculums([]);
    }
  }, [filterProgram]);

  // --- API Fetch List ---
  const fetchStakeholders = async () => {
    // NEW LOGIC: Only fetch data if ALL four filters are selected.
    // Otherwise, empty the table and stop the function.
    if (!filterGroup || !filterSchool || !filterProgram || !filterCurriculum) {
      setStakeholders([]);
      return;
    }

    try {
      const params = new URLSearchParams();
      params.append("stakeholder_group_id", filterGroup);
      params.append("dept_id", filterSchool);
      params.append("pgm_id", filterProgram);
      params.append("academic_batch_id", filterCurriculum);

      const res = await axiosInstance.get<any>(
        `${ApiEndpoint.survey.stakeholder.base}/list?${params.toString()}`,
      );
      if (res.data?.status) {
        setStakeholders(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch stakeholders", error);
    }
  };

  useEffect(() => {
    fetchStakeholders();
  }, [filterGroup, filterSchool, filterProgram, filterCurriculum]);

  // --- Validation Logic ---
  const validateDropdownsSelected = () => {
    if (!filterGroup || !filterSchool || !filterProgram || !filterCurriculum) {
      toast.warning("Select All the dropdowns before proceeding.");
      return false;
    }
    return true;
  };

  // --- Handlers ---
  const handleAddClick = () => {
    if (validateDropdownsSelected()) {
      setEditingData(null);
      setViewMode("add");
    }
  };

  const handleBulkImportClick = () => {
    if (validateDropdownsSelected()) {
      setViewMode("import");
    }
  };

  const handleEditClick = (data: StakeholderDetail) => {
    setEditingData(data);
    setViewMode("edit");
  };

  const executeToggleStatus = async () => {
    if (!statusDialog) return;
    try {
      const newStatus = statusDialog.status === 1 ? 0 : 1;
      const res = await axiosInstance.post<any>(
        `${ApiEndpoint.survey.stakeholder.base}/toggle-status`,
        {
          record_id: statusDialog.id,
          status: newStatus,
        },
      );
      if (res.data?.status) {
        toast.success(
          `Stakeholder ${newStatus === 1 ? "enabled" : "disabled"} successfully`,
        );
        fetchStakeholders();
      } else {
        toast.error(res.data?.message || "Failed to update status");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error updating status");
    } finally {
      setStatusDialog(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await axiosInstance.delete<any>(
        `${ApiEndpoint.survey.stakeholder.base}/delete/${deleteId}`,
      );
      if (res.data?.status) {
        toast.success("Stakeholder permanently deleted");
        setDeleteId(null);
        fetchStakeholders();
      } else {
        toast.error(res.data?.message || "Failed to delete record");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error deleting record");
    }
  };

  const handleFormSubmit = async (formData: any) => {
    try {
      if (editingData) {
        const res = await axiosInstance.put<any>(
          `${ApiEndpoint.survey.stakeholder.base}/update/${editingData.stakeholder_detail_id}`,
          formData,
        );
        if (res.data?.status) {
          toast.success("Stakeholder updated successfully");
          setViewMode("list");
          fetchStakeholders();
        } else {
          toast.error(res.data?.message || "Failed to update Stakeholder");
        }
      } else {
        const res = await axiosInstance.post<any>(
          `${ApiEndpoint.survey.stakeholder.base}/save`,
          formData,
        );
        if (res.data?.status) {
          toast.success("Stakeholder added successfully");
          setViewMode("list");
          fetchStakeholders();
        } else {
          toast.error(res.data?.message || "Failed to add Stakeholder");
        }
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "An error occurred while saving",
      );
    }
  };

  const handleFilterChange = (type: string, value: string) => {
    if (type === "group") setFilterGroup(value);
    if (type === "school") {
      setFilterSchool(value);
      setFilterProgram("");
      setFilterCurriculum("");
    }
    if (type === "program") {
      setFilterProgram(value);
      setFilterCurriculum("");
    }
    if (type === "curriculum") setFilterCurriculum(value);
  };

  const filteredData = useMemo(() => {
    if (!searchTerm) return stakeholders;
    const lowerSearch = searchTerm.toLowerCase();
    return stakeholders.filter(
      (item) =>
        item.first_name.toLowerCase().includes(lowerSearch) ||
        item.last_name.toLowerCase().includes(lowerSearch) ||
        item.email.toLowerCase().includes(lowerSearch),
    );
  }, [stakeholders, searchTerm]);

  const columnDefs = useMemo(
    () => [
      {
        headerName: "Sl No.",
        valueGetter: "node.rowIndex + 1",
        width: 70,
        maxWidth: 80,
        sortable: false,
        filter: false,
        cellStyle: { textAlign: "center", borderRight: "1px solid #e2e8f0" },
      },
      {
        headerName: "Stakeholder",
        valueGetter: (params: any) =>
          `${params.data.first_name} ${params.data.last_name}`,
        flex: 1.5,
        minWidth: 150,
        sortable: true,
        filter: true,
        cellStyle: { borderRight: "1px solid #e2e8f0" },
      },
      {
        headerName: "Email",
        field: "email",
        flex: 2,
        minWidth: 200,
        sortable: true,
        filter: true,
        cellStyle: { borderRight: "1px solid #e2e8f0" },
      },
      {
        headerName: "Contact Number",
        field: "contact",
        flex: 1.5,
        minWidth: 150,
        sortable: true,
        filter: true,
        cellStyle: { borderRight: "1px solid #e2e8f0" },
      },
      {
        headerName: "Edit",
        cellRenderer: (params: any) => (
          <div className="flex justify-center items-center h-full">
            <GoPencil
              size={18}
              onClick={() => handleEditClick(params.data)}
              className="cursor-pointer text-yellow-600 hover:text-yellow-700"
              title="Edit"
            />
          </div>
        ),
        width: 70,
        maxWidth: 80,
        cellStyle: { textAlign: "center", borderRight: "1px solid #e2e8f0" },
        sortable: false,
        filter: false,
      },
      {
        headerName: "Status",
        cellRenderer: (params: any) => (
          <div className="flex justify-center items-center h-full">
            {params.data.status === 1 ? (
              <FaCheckCircle
                size={17}
                onClick={() =>
                  setStatusDialog({
                    id: params.data.stakeholder_detail_id,
                    status: params.data.status,
                  })
                }
                className="cursor-pointer text-green-600 hover:text-green-800"
                title="Active (Click to Disable)"
              />
            ) : (
              <MdOutlineDoNotDisturbAlt
                size={19}
                onClick={() =>
                  setStatusDialog({
                    id: params.data.stakeholder_detail_id,
                    status: params.data.status,
                  })
                }
                className="cursor-pointer text-gray-500 hover:text-gray-700"
                title="Inactive (Click to Enable)"
              />
            )}
          </div>
        ),
        width: 70,
        maxWidth: 80,
        cellStyle: { textAlign: "center", borderRight: "1px solid #e2e8f0" },
        sortable: false,
        filter: false,
      },
      {
        headerName: "Delete",
        cellRenderer: (params: any) => (
          <div className="flex justify-center items-center h-full">
            <FaTimes
              size={18}
              onClick={() => setDeleteId(params.data.stakeholder_detail_id)}
              className="cursor-pointer text-gray-800 hover:text-red-600 font-bold"
              title="Delete"
            />
          </div>
        ),
        width: 70,
        maxWidth: 80,
        cellStyle: { textAlign: "center" as const },
        filter: false,
        sortable: false,
      },
    ],
    [],
  );

  return (
    <>
      <style>{`
        .ag-body-horizontal-scroll, .ag-body-vertical-scroll { display: none !important; }
        .ag-body-viewport { overflow-x: hidden !important; overflow-y: auto !important; -ms-overflow-style: none !important; scrollbar-width: none !important; }
        .ag-body-viewport::-webkit-scrollbar { display: none !important; }
        .ag-row:hover, .ag-row-selected { background-color: transparent !important; }
      `}</style>

      {viewMode === "list" && (
        <div className="animate-fade-in bg-white rounded-md shadow-sm border border-gray-200">
          <div className="bg-[#1f3b4d] text-white px-4 py-2.5 rounded-t-md flex justify-between items-center">
            <h2 className="text-sm font-semibold">Stakeholder List</h2>
          </div>

          <div className="p-4">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-4 mb-6">
              {/* Dynamic Dropdown Filters */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-700 mb-1">
                    Stakeholder Group : <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={filterGroup}
                    onChange={(e) =>
                      handleFilterChange("group", e.target.value)
                    }
                    className="border border-gray-300 rounded px-3 py-1.5 text-sm w-48 focus:outline-none focus:border-[#437880]"
                  >
                    <option value="">Select Group</option>
                    {groups.map((g) => (
                      <option
                        key={g.stakeholder_group_id}
                        value={g.stakeholder_group_id}
                      >
                        {g.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-700 mb-1">
                    School : <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={filterSchool}
                    onChange={(e) =>
                      handleFilterChange("school", e.target.value)
                    }
                    className="border border-gray-300 rounded px-3 py-1.5 text-sm w-48 focus:outline-none focus:border-[#437880]"
                  >
                    <option value="">Select School</option>
                    {schools.map((s) => (
                      <option key={s.dept_id} value={s.dept_id}>
                        {s.dept_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-700 mb-1">
                    Program : <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={filterProgram}
                    onChange={(e) =>
                      handleFilterChange("program", e.target.value)
                    }
                    className="border border-gray-300 rounded px-3 py-1.5 text-sm w-48 focus:outline-none focus:border-[#437880]"
                    disabled={!filterSchool}
                  >
                    <option value="">Select Program</option>
                    {programs.map((p) => (
                      <option key={p.pgm_id} value={p.pgm_id}>
                        {p.pgm_title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-700 mb-1">
                    Curriculum : <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={filterCurriculum}
                    onChange={(e) =>
                      handleFilterChange("curriculum", e.target.value)
                    }
                    className="border border-gray-300 rounded px-3 py-1.5 text-sm w-48 focus:outline-none focus:border-[#437880]"
                    disabled={!filterProgram}
                  >
                    <option value="">Select Curriculum</option>
                    {curriculums.map((c) => (
                      <option
                        key={c.academic_batch_id}
                        value={c.academic_batch_id}
                      >
                        {c.academic_batch_code}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-2 shrink-0">
                <button
                  onClick={handleBulkImportClick}
                  className="bg-[#5cb85c] hover:bg-[#4cae4c] text-white px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-1"
                >
                  <FaPlus size={12} /> Bulk Import
                </button>
                <button
                  onClick={handleAddClick}
                  className="bg-[#0066cc] hover:bg-[#0052a3] text-white px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-1"
                >
                  <FaPlus size={12} /> Add
                </button>
              </div>
            </div>

            <div className="flex justify-end mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Search:</span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-48 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#437880]"
                />
              </div>
            </div>

            <DataTable
              columnDefs={columnDefs}
              rowData={filteredData}
              showAddButton={false}
              headerFilter={false}
              pageSize={20}
            />
          </div>
        </div>
      )}

      {viewMode === "import" && (
        <BulkImportStakeholder
          onCancel={() => setViewMode("list")}
          selectedFilters={{
            group_id: filterGroup,
            dept_id: filterSchool,
            pgm_id: filterProgram,
            academic_batch_id: filterCurriculum,
          }}
          onSuccess={() => {
            setViewMode("list");
            fetchStakeholders();
          }}
        />
      )}

      {(viewMode === "add" || viewMode === "edit") && (
        <StakeholderForm
          initialData={editingData}
          selectedFilters={{
            group_id: filterGroup,
            dept_id: filterSchool,
            pgm_id: filterProgram,
            academic_batch_id: filterCurriculum,
          }}
          onSave={handleFormSubmit}
          onCancel={() => setViewMode("list")}
        />
      )}

      <ConfirmDialog
        isOpen={statusDialog !== null}
        title={
          statusDialog?.status === 1
            ? "Disable Confirmation"
            : "Enable Confirmation"
        }
        message={`Are you sure you want to ${statusDialog?.status === 1 ? "Disable" : "Enable"}?`}
        onConfirm={executeToggleStatus}
        onClose={() => setStatusDialog(null)}
      />

      <ConfirmDialog
        isOpen={deleteId !== null}
        title="Confirm Delete"
        message="Are you sure you want to permanently delete this stakeholder?"
        onConfirm={confirmDelete}
        onClose={() => setDeleteId(null)}
      />
    </>
  );
};

export default ManageStakeholderPage;

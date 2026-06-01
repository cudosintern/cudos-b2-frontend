import React, { useState, useEffect, useMemo } from "react";
import { GoPencil } from "react-icons/go";
import { FaTimes, FaPlus, FaCheckCircle } from "react-icons/fa";
import { MdOutlineDoNotDisturbAlt } from "react-icons/md";
import { toast } from "react-toastify";
import DataTable from "../../../../components/Table/DataTable";
import ConfirmDialog from "../../../../components/Dialog/ConfirmDialog";
import axiosInstance from "../../../../utils/api";
import { ApiEndpoint } from "../../../../utils/ApiEndpoint/emsapiEndpoint";
import SurveyTemplateForm from "./SurveyTemplateForm";

const ManageSurveyTemplatePage: React.FC = () => {
  // --- States ---
  const [viewMode, setViewMode] = useState<"list" | "add" | "edit">("list");
  const [templates, setTemplates] = useState<any[]>([]);
  const [editingData, setEditingData] = useState<any | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Filter States
  const [filterSchool, setFilterSchool] = useState<string>("");
  const [filterProgram, setFilterProgram] = useState<string>("");
  const [filterTemplateType, setFilterTemplateType] = useState<string>("");

  // Master Data States
  const [schools, setSchools] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);

  // Static Template Types based on the backend mappings
  const templateTypes = [
    { id: 1, name: "Outcome Attainment Template" },
    { id: 2, name: "Improvement Template" },
  ];

  // --- Initial Data Fetching ---
  useEffect(() => {
    axiosInstance
      .get<any>(ApiEndpoint.survey.stakeholder.schools)
      .then((res) => {
        if (res.data?.status) setSchools(res.data.data);
      })
      .catch((err) => console.error("School API Error", err));
  }, []);

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

  // --- Fetch List ---
  const fetchTemplates = async () => {
    // Only fetch if school and program are selected, to prevent massive un-filtered data dumps
    if (!filterSchool || !filterProgram) {
      setTemplates([]);
      return;
    }

    try {
      const params = new URLSearchParams();
      params.append("dept_id", filterSchool);
      params.append("pgm_id", filterProgram);
      // Note: If you want to filter by template type on the backend, you can append it here.
      // For now, we will filter it locally if selected.

      const res = await axiosInstance.get<any>(
        `${ApiEndpoint.survey.template.base}/list?${params.toString()}`,
      );
      if (res.data?.status) {
        setTemplates(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch templates", error);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [filterSchool, filterProgram]);

  // --- Handlers ---
  const handleAddClick = () => {
    setEditingData(null);
    setViewMode("add");
  };

  const handleEditClick = async (templateId: number) => {
    try {
      // Fetch the FULL nested template data before switching to edit mode
      const res = await axiosInstance.get<any>(
        `${ApiEndpoint.survey.template.base}/get/${templateId}`,
      );
      if (res.data?.status) {
        setEditingData(res.data.data);
        setViewMode("edit");
      } else {
        toast.error("Failed to fetch template details.");
      }
    } catch (error) {
      toast.error("An error occurred while fetching the template.");
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await axiosInstance.delete<any>(
        `${ApiEndpoint.survey.template.base}/delete/${deleteId}`,
      );
      if (res.data?.status) {
        toast.success("Template deleted successfully");
        fetchTemplates();
      } else {
        toast.error(res.data?.message || "Failed to delete template");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error deleting template");
    } finally {
      setDeleteId(null);
    }
  };

  const handleFormSubmit = async (formData: any) => {
    try {
      if (viewMode === "edit" && editingData) {
        const res = await axiosInstance.put<any>(
          `${ApiEndpoint.survey.template.base}/update/${editingData.template_id}`,
          formData,
        );
        if (res.data?.status) {
          toast.success("Template updated successfully");
          setViewMode("list");
          fetchTemplates();
        } else {
          toast.error(res.data?.message || "Failed to update template");
        }
      } else {
        const res = await axiosInstance.post<any>(
          `${ApiEndpoint.survey.template.base}/save`,
          formData,
        );
        if (res.data?.status) {
          toast.success("Template added successfully");
          setViewMode("list");
          fetchTemplates();
        } else {
          toast.error(res.data?.message || "Failed to add template");
        }
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "An error occurred while saving",
      );
    }
  };

  // --- DataTable Configuration ---
  const filteredData = useMemo(() => {
    let data = templates;

    // Apply local template type filter if selected
    if (filterTemplateType) {
      // Assuming su_for 1-4 is Outcome (type 1) and 5-8 is Improvement (type 2) based on earlier logic
      data = data.filter((t) => {
        const typeId = [1, 2, 3, 4].includes(t.su_for) ? 1 : 2;
        return String(typeId) === filterTemplateType;
      });
    }

    // Apply Search
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      data = data.filter(
        (item) =>
          item.name.toLowerCase().includes(lowerSearch) ||
          item.description.toLowerCase().includes(lowerSearch),
      );
    }
    return data;
  }, [templates, searchTerm, filterTemplateType]);

  const columnDefs = useMemo(
    () => [
      {
        headerName: "Template Title",
        field: "name",
        flex: 1.5,
        minWidth: 200,
        sortable: true,
        filter: true,
        cellStyle: { borderRight: "1px solid #e2e8f0" },
      },
      {
        headerName: "Description",
        field: "description",
        flex: 2,
        minWidth: 250,
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
              onClick={() => handleEditClick(params.data.template_id)}
              className="cursor-pointer text-gray-700 hover:text-black"
              title="Edit"
            />
          </div>
        ),
        width: 80,
        maxWidth: 100,
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
                className="text-green-600"
                size={17}
                title="Active"
              />
            ) : (
              <MdOutlineDoNotDisturbAlt
                className="text-gray-500"
                size={19}
                title="Inactive"
              />
            )}
          </div>
        ),
        width: 80,
        maxWidth: 100,
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
              onClick={() => setDeleteId(params.data.template_id)}
              className="cursor-pointer text-gray-800 hover:text-red-600 font-bold"
              title="Delete"
            />
          </div>
        ),
        width: 80,
        maxWidth: 100,
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
            <h2 className="text-sm font-semibold">Template List</h2>
          </div>

          <div className="p-4">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-4 mb-6">
              {/* Dropdown Filters */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-700 mb-1">
                    School: <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={filterSchool}
                    onChange={(e) => {
                      setFilterSchool(e.target.value);
                      setFilterProgram("");
                    }}
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
                    Program: <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={filterProgram}
                    onChange={(e) => setFilterProgram(e.target.value)}
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
                    Survey Template Type:
                  </label>
                  <select
                    value={filterTemplateType}
                    onChange={(e) => setFilterTemplateType(e.target.value)}
                    className="border border-gray-300 rounded px-3 py-1.5 text-sm w-56 focus:outline-none focus:border-[#437880]"
                  >
                    <option value="">Select template type</option>
                    {templateTypes.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Add Button */}
              <div className="flex shrink-0">
                <button
                  onClick={handleAddClick}
                  className="bg-[#0066cc] hover:bg-[#0052a3] text-white px-4 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
                >
                  <FaPlus size={12} /> Add
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex justify-end mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Search:</span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-56 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#437880]"
                />
              </div>
            </div>

            {/* Data Table */}
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

      {/* Form View for Add/Edit */}
      {(viewMode === "add" || viewMode === "edit") && (
        <SurveyTemplateForm
          initialData={editingData}
          onSave={handleFormSubmit}
          onCancel={() => setViewMode("list")}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        title="Confirm Delete"
        message="Are you sure you want to delete this template? This will permanently remove all associated questions and options."
        onConfirm={confirmDelete}
        onClose={() => setDeleteId(null)}
      />
    </>
  );
};

export default ManageSurveyTemplatePage;

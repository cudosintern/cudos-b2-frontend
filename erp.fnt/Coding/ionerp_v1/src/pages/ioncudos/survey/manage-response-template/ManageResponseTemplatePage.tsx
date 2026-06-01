import React, { useState, useMemo, useEffect } from "react";
import { GoPencil } from "react-icons/go";
import { MdOutlineDoNotDisturbAlt } from "react-icons/md";
import { FaCheckCircle } from "react-icons/fa";
import { toast } from "react-toastify";
import DataTable from "../../../../components/Table/DataTable";
import ConfirmDialog from "../../../../components/Dialog/ConfirmDialog";
import UIButton from "../../../../components/FormBuilder/fields/Button";
import axiosInstance from "../../../../utils/api";
import { ResponseTemplate } from "./responseInterface";
import ResponseTemplateForm from "./ResponseTemplateForm";

const API_BASE_URL = "/cudos/survey/response_template";

const ManageResponseTemplatePage: React.FC = () => {
  const [templates, setTemplates] = useState<ResponseTemplate[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [viewMode, setViewMode] = useState<"list" | "add" | "edit">("list");
  const [editingData, setEditingData] = useState<ResponseTemplate | null>(null);
  
  const [statusDialog, setStatusDialog] = useState<{ id: number; status: number } | null>(null);

  const fetchTemplates = async () => {
    try {
      const res = await axiosInstance.get<any>(`${API_BASE_URL}/list`);
      if (res.data?.status) {
        setTemplates(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch templates", error);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleAddClick = () => {
    setEditingData(null);
    setViewMode("add");
  };

  const handleEditClick = (data: ResponseTemplate) => {
    setEditingData(data);
    setViewMode("edit");
  };

  const executeToggleStatus = async () => {
    if (!statusDialog) return;
    try {
      const newStatus = statusDialog.status === 1 ? 0 : 1;
      const res = await axiosInstance.post<any>(`${API_BASE_URL}/toggle-status`, {
        record_id: statusDialog.id,
        status: newStatus
      });
      if (res.data?.status) {
        toast.success(`Response Template ${newStatus === 1 ? 'disabled' : 'enabled'} successfully`);
        fetchTemplates();
      } else {
        toast.error(res.data?.message || "Failed to update status");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error updating status");
    } finally {
      setStatusDialog(null);
    }
  };

  const handleSave = async (savedTemplate: ResponseTemplate) => {
    try {
      if (viewMode === "edit") {
        const res = await axiosInstance.put<any>(`${API_BASE_URL}/update/${savedTemplate.answer_template_id}`, savedTemplate);
        if (res.data?.status) {
          toast.success("Response Template updated successfully");
          setViewMode("list");
          fetchTemplates();
        } else {
          toast.error(res.data?.message || "Failed to update Response Template");
        }
      } else {
        const res = await axiosInstance.post<any>(`${API_BASE_URL}/save`, savedTemplate);
        if (res.data?.status) {
          toast.success("Response Template added successfully");
          setViewMode("list");
          fetchTemplates();
        } else {
          toast.error(res.data?.message || "Failed to add Response Template");
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "An error occurred while saving");
    }
  };

  const filteredData = useMemo(() => {
    let data = [...templates];

    if (searchTerm) {
      data = data.filter((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return data.sort((a, b) => {
      if (a.feedbk_flag !== b.feedbk_flag) {
        return a.feedbk_flag - b.feedbk_flag;
      }
      return b.answer_template_id - a.answer_template_id;
    });
  }, [templates, searchTerm]);

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
        headerName: "Survey Type",
        valueGetter: (params: any) => params.data.feedbk_flag === 1 ? "Outcome Attainment Survey" : "Improvement Survey",
        flex: 1.2,
        minWidth: 220,
        sortable: true,
        filter: true,
        cellStyle: (params: any) => ({
          borderRight: "1px solid #e2e8f0",
          fontWeight: "600",
          color: params.data.feedbk_flag === 1 ? "#0066cc" : "#e67e22"
        }),
      },
      {
        headerName: "Response Template Name",
        field: "name",
        flex: 3, 
        minWidth: 300,
        sortable: true,
        filter: true,
        cellStyle: { borderRight: "1px solid #e2e8f0", fontWeight: "500" },
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
                onClick={() => setStatusDialog({ id: params.data.answer_template_id, status: params.data.status })}
                className="cursor-pointer text-green-600 hover:text-green-800"
                title="Active (Click to Disable)"
              />
            ) : (
              <MdOutlineDoNotDisturbAlt
                size={19}
                onClick={() => setStatusDialog({ id: params.data.answer_template_id, status: params.data.status })}
                className="cursor-pointer text-gray-500 hover:text-gray-700"
                title="Inactive (Click to Enable)"
              />
            )}
          </div>
        ),
        width: 70,
        maxWidth: 80,
        cellStyle: { textAlign: "center" },
        sortable: false,
        filter: false,
      },
    ],
    []
  );

  return (
    <>
      <style>{`
        .ag-body-horizontal-scroll, .ag-body-vertical-scroll { display: none !important; }
        .ag-body-viewport { overflow-x: hidden !important; overflow-y: auto !important; -ms-overflow-style: none !important; scrollbar-width: none !important; }
        .ag-body-viewport::-webkit-scrollbar { display: none !important; }
        .ag-row:hover, .ag-row-selected { background-color: transparent !important; }
      `}</style>

      {viewMode === "list" ? (
        <div className="animate-fade-in">
          <div className="flex justify-between items-end pb-5">
            <h3 className="text-lg leading-6 font-medium">Response Template List</h3>

            <div className="flex flex-col items-end space-y-3">
              <UIButton onClick={handleAddClick}>Add</UIButton>
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#437880]"
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
      ) : (
        <div className="animate-fade-in">
          <ResponseTemplateForm
            initialData={editingData}
            onSave={handleSave}
            onCancel={() => setViewMode("list")}
          />
        </div>
      )}

      <ConfirmDialog
        isOpen={statusDialog !== null}
        title={statusDialog?.status === 1 ? "Disable Confirmation" : "Enable Confirmation"}
        message={`Are you sure you want to ${statusDialog?.status === 1 ? "Disable" : "Enable"}?`}
        onConfirm={executeToggleStatus}
        onClose={() => setStatusDialog(null)}
      />
    </>
  );
};

export default ManageResponseTemplatePage;
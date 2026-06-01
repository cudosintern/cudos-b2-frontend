import React, { useState, useMemo, useEffect } from "react";
import { GoPencil } from "react-icons/go";
import { MdOutlineDoNotDisturbAlt } from "react-icons/md";
import { FaCheckCircle, FaTimes } from "react-icons/fa";
import { toast } from "react-toastify";
import DataTable from "../../../../components/Table/DataTable";
import ModalWithForm from "../../../../components/Modal/ModalWithForm";
import ConfirmDialog from "../../../../components/Dialog/ConfirmDialog";
import UIButton from "../../../../components/FormBuilder/fields/Button";
import axiosInstance from "../../../../utils/api";
import {
  StakeholderGroupSchema,
  StakeholderGroupFields,
} from "./stakeholderGroupSchema";
import { StakeholderGroup } from "./responseInterface";

const API_BASE_URL = "/cudos/survey/stakeholder_group";

const ManageStakeholderGroupPage: React.FC = () => {
  const [stakeholderGroups, setStakeholderGroups] = useState<
    StakeholderGroup[]
  >([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingData, setEditingData] = useState<StakeholderGroup | null>(null);

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [statusDialog, setStatusDialog] = useState<{
    id: number;
    status: number;
  } | null>(null);

  const fetchStakeholderGroups = async () => {
    try {
      const res = await axiosInstance.get<any>(`${API_BASE_URL}/list`);
      if (res.data?.status) {
        setStakeholderGroups(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch data", error);
    }
  };

  useEffect(() => {
    fetchStakeholderGroups();
  }, []);

  // --- Handlers ---
  const handleOpenModal = () => {
    setEditingData(null);
    setIsModalOpen(true);
  };

  const handleEdit = (data: StakeholderGroup) => {
    setEditingData(data);
    setIsModalOpen(true);
  };

  const handleDeleteTrigger = (id: number) => {
    setDeleteId(id);
  };

  const executeToggleStatus = async () => {
    if (!statusDialog) return;
    try {
      const newStatus = statusDialog.status === 1 ? 0 : 1;
      const res = await axiosInstance.post<any>(
        `${API_BASE_URL}/toggle-status`,
        {
          record_id: statusDialog.id,
          status: newStatus,
        },
      );
      if (res.data?.status) {
        toast.success(
          `Stakeholder Group ${newStatus === 1 ? "enabled" : "disabled"} successfully`,
        );
        fetchStakeholderGroups();
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
        `${API_BASE_URL}/delete/${deleteId}`,
      );
      if (res.data?.status) {
        toast.success("Stakeholder Group permanently deleted");
        setDeleteId(null);
        fetchStakeholderGroups();
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
          `${API_BASE_URL}/update/${editingData.stakeholder_group_id}`,
          formData,
        );
        if (res.data?.status) {
          toast.success("Stakeholder Group updated successfully");
          setIsModalOpen(false);
          fetchStakeholderGroups();
        } else {
          toast.error(
            res.data?.message || "Failed to update Stakeholder Group",
          );
        }
      } else {
        const res = await axiosInstance.post<any>(
          `${API_BASE_URL}/save`,
          formData,
        );
        if (res.data?.status) {
          toast.success("Stakeholder Group added successfully");
          setIsModalOpen(false);
          fetchStakeholderGroups();
        } else {
          toast.error(res.data?.message || "Failed to add Stakeholder Group");
        }
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "An error occurred while saving",
      );
    }
  };

  const filteredData = useMemo(() => {
    if (!searchTerm) return stakeholderGroups;
    return stakeholderGroups.filter(
      (item) =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description &&
          item.description.toLowerCase().includes(searchTerm.toLowerCase())),
    );
  }, [stakeholderGroups, searchTerm]);

  const columnDefs = useMemo(
    () => [
      {
        headerName: "Sl No.",
        valueGetter: "node.rowIndex + 1",
        width: 80,
        maxWidth: 100,
        sortable: false,
        filter: false,
        cellStyle: { textAlign: "center", borderRight: "1px solid #e2e8f0" },
      },
      {
        headerName: "StakeholderGroup Title",
        field: "title",
        flex: 1,
        minWidth: 200,
        sortable: true,
        filter: true,
        cellStyle: { borderRight: "1px solid #e2e8f0", fontWeight: "500" },
      },
      {
        headerName: "Description",
        field: "description",
        flex: 2,
        minWidth: 300,
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
              onClick={() => handleEdit(params.data)}
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
                    id: params.data.stakeholder_group_id,
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
                    id: params.data.stakeholder_group_id,
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
        headerName: "Action",
        cellRenderer: (params: any) => (
          <div className="flex justify-center items-center h-full">
            <FaTimes
              size={18}
              onClick={() =>
                handleDeleteTrigger(params.data.stakeholder_group_id)
              }
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

      <div className="animate-fade-in">
        <div className="flex justify-between items-end pb-5">
          <h3 className="text-lg leading-6 font-medium">
            Manage Stakeholder Group
          </h3>

          <div className="flex flex-col items-end space-y-3">
            <UIButton onClick={handleOpenModal}>Add</UIButton>
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
          pageSize={filteredData.length || 10}
        />
      </div>

      {isModalOpen && (
        <ModalWithForm
          title="Stakeholder Group"
          isOpen={isModalOpen}
          onSubmit={handleFormSubmit}
          onClose={() => setIsModalOpen(false)}
          formFields={StakeholderGroupFields}
          schema={StakeholderGroupSchema}
          initialValues={editingData || {}}
          resetbuttonName="Reset"
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
        message="Are you sure you want to permanently delete this stakeholder group?"
        onConfirm={confirmDelete}
        onClose={() => setDeleteId(null)}
      />
    </>
  );
};

export default ManageStakeholderGroupPage;

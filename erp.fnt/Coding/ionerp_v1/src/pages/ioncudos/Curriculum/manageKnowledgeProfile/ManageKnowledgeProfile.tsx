import React, { useState, useEffect, useMemo, useCallback } from "react";
import { FaTimes, FaSave, FaSync } from "react-icons/fa";
import { GoPencil } from "react-icons/go";
import { toast } from "react-toastify";
import ConfirmDialog from "../../../../components/Dialog/ConfirmDialog";
import UIButton from "../../../../components/FormBuilder/fields/Button";
import DataTable from "../../../../components/Table/DataTable";
import {
    getProgramsDropdown,
    getKPList,
    createKP,
    updateKP,
    deleteKP
} from "./manageKnowledgeProfileService";
import { KP, Program, FormType } from "./manageKnowledgeProfile.types";

const emptyForm: FormType = {
  pkp_attr_code: "",
  pkp_attr_description: "",
};

const ManageKnowledgeProfile: React.FC = () => {
    // --- State ---
    const [programs, setPrograms] = useState<Program[]>([]);
    const [selectedProgram, setSelectedProgram] = useState<number | null>(() => {
        const saved = sessionStorage.getItem('kp_selected_program');
        return saved ? Number(saved) : null;
    });
    const [kpList, setKpList] = useState<KP[]>([]);
    
    // View & Form State
    const [form, setForm] = useState<FormType>(emptyForm);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    
    // List Pagination/Search
    const [search, setSearch] = useState("");
    const [pageSize, setPageSize] = useState(20);

    // --- Loading ---
    useEffect(() => {
        loadPrograms();
        if (selectedProgram) {
            loadKPs(selectedProgram);
        }
    }, [selectedProgram]);

    useEffect(() => {
        if (selectedProgram) {
            sessionStorage.setItem('kp_selected_program', String(selectedProgram));
        } else {
            sessionStorage.removeItem('kp_selected_program');
        }
    }, [selectedProgram]);

    const loadPrograms = async () => {
        try {
            const res = await getProgramsDropdown();
            if (res.status !== false) {
                 setPrograms(res.data || []);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const loadKPs = async (pgmId: number) => {
        try {
            const res = await getKPList(pgmId);
            if (res.status !== false) {
                setKpList(res.data || []);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleProgramChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = Number(e.target.value);
        if (val) {
            setSelectedProgram(val);
            loadKPs(val);
            setEditingId(null);
            setForm(emptyForm);
            setErrors({});
            setShowForm(false);
        } else {
            setSelectedProgram(null);
            setKpList([]);
        }
    };

    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [kpToDelete, setKpToDelete] = useState<number | null>(null);

    // --- Form Handlers ---
    const validate = () => {
        const newErrors: { [key: string]: string } = {};
        if (!form.pkp_attr_code.trim()) newErrors.pkp_attr_code = "This field is required.";
        if (!form.pkp_attr_description.trim()) newErrors.pkp_attr_description = "This field is required.";
        else if (form.pkp_attr_description.length > 2000) newErrors.pkp_attr_description = "Description cannot exceed 2000 characters";
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!selectedProgram) {
            toast.warning("Please select a program first.");
            return;
        }
        if (!validate()) return;

        try {
            const payload = {
                pgm_id: selectedProgram,
                pkp_attr_code: form.pkp_attr_code,
                pkp_attr_description: form.pkp_attr_description
            };

            if (editingId) {
                const res = await updateKP(editingId, payload);
                if (res.status !== false) {
                    toast.success("Knowledge Profile Updated Successfully!");
                    loadKPs(selectedProgram);
                    handleCancelEdit();
                } else {
                    toast.error(res.message || "Failed to update Knowledge Profile");
                }
            } else {
                const res = await createKP(payload);
                if (res.status !== false) {
                    toast.success("Knowledge Profile Saved Successfully!");
                    loadKPs(selectedProgram);
                    handleReset();
                    setShowForm(false);
                } else {
                    toast.error(res.message || "Failed to create Knowledge Profile");
                }
            }
        } catch (e) {
            toast.error("An error occurred while saving");
            console.error(e);
        }
    };

    const handleEditClick = useCallback((id: number) => {
        const kp = kpList.find(x => x.pkp_id === id);
        if (!kp) return;
        setEditingId(kp.pkp_id);
        setForm({
            pkp_attr_code: kp.pkp_attr_code,
            pkp_attr_description: kp.pkp_attr_description
        });
        setErrors({});
        setShowForm(true);
        setTimeout(() => {
            const formElement = document.getElementById("kp-form-section");
            if (formElement) formElement.scrollIntoView({ behavior: "smooth" });
        }, 100);
    }, [kpList]);

    const handleDeleteClick = useCallback((id: number) => {
        setKpToDelete(id);
        setIsDeleteDialogOpen(true);
    }, []);

    const confirmDelete = async () => {
        if (!kpToDelete) return;
        try {
            const res = await deleteKP(kpToDelete);
            if (res.status !== false) {
                 toast.success("Knowledge Profile Deleted Successfully!");
                 if (selectedProgram) loadKPs(selectedProgram);
            } else {
                 toast.error(res.message || "Failed to delete Knowledge Profile");
            }
        } catch (e) {
            toast.error("An error occurred while deleting");
            console.error(e);
        } finally {
            setIsDeleteDialogOpen(false);
            setKpToDelete(null);
        }
    };

    const handleReset = () => {
        setForm(emptyForm);
        setErrors({});
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setForm(emptyForm);
        setErrors({});
        setShowForm(false);
    };

    const columnDefs = useMemo(() => [
        {
            headerName: "Sl No.",
            valueGetter: "node.rowIndex + 1",
            width: 80,
            flex: 0
        },
        {
            headerName: "Attribute Code",
            field: "pkp_attr_code",
            sortable: true,
            filter: true,
            flex: 1
        },
        {
            headerName: "Attribute Description",
            field: "pkp_attr_description",
            sortable: true,
            filter: true,
            flex: 2
        },
        {
            headerName: "Action",
            field: "action",
            cellRenderer: (params: any) => (
                <div className="flex space-x-3 justify-left items-center h-full">
                    <GoPencil
                        size={20}
                        onClick={() => handleEditClick(params.data.pkp_id)}
                        className="cursor-pointer text-yellow-600"
                        title="Edit"
                    />
                    <FaTimes
                        className="cursor-pointer text-red-600"
                        size={18}
                        title="Delete"
                        onClick={() => handleDeleteClick(params.data.pkp_id)}
                    />
                </div>
            ),
            width: 100,
            flex: 0
        }
    ], [handleEditClick, handleDeleteClick]);

    const filtered = useMemo(() => {
        return kpList.filter(x => 
            x.pkp_attr_code.toLowerCase().includes(search.toLowerCase()) || 
            x.pkp_attr_description.toLowerCase().includes(search.toLowerCase())
        );
    }, [kpList, search]);

    return (
        <div className="">
            <ConfirmDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                onConfirm={confirmDelete}
                title="Confirm Delete"
                message="Are you sure you want to delete this record?"
            />

            <h3 className="text-lg font-medium pb-5">Manage Knowledge Profile</h3>

            {/* Program Selection */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Program <span className="text-red-500">*</span>
                        </label>
                        <select 
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            value={selectedProgram || ""}
                            onChange={handleProgramChange}
                        >
                            <option value="">Select Program</option>
                            {programs.map(p => <option key={p.pgm_id} value={p.pgm_id}>{p.pgm_title}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {selectedProgram && (
                <>
                    {/* LIST SECTION */}
                    <h3 className="text-lg font-medium pb-5">Knowledge Profile List</h3>
                    
                    <div className="flex justify-between items-end mb-4">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <span>Show</span>
                            <select 
                                value={pageSize}
                                onChange={(e) => setPageSize(Number(e.target.value))}
                                className="border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#437880]"
                            >
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                            </select>
                            <span>entries</span>
                        </div>

                        <div className="flex flex-col items-end space-y-4">
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-600">Search:</span>
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#437880] focus:border-[#437880] w-64"
                                    placeholder="Search records..."
                                />
                            </div>
                        </div>
                    </div>

                    <DataTable
                        columnDefs={columnDefs}
                        rowData={filtered}
                        pageSize={pageSize}
                        autoHeight={true}
                        showSearch={false}
                        showEntries={false}
                    />

                    <div className="flex justify-end mt-4">
                        <UIButton
                            variant="primary"
                            size="sm"
                            onClick={() => {
                                setEditingId(null);
                                setForm(emptyForm);
                                setShowForm(true);
                                setTimeout(() => {
                                    const formElement = document.getElementById("kp-form-section");
                                    if (formElement) formElement.scrollIntoView({ behavior: "smooth" });
                                }, 100);
                            }}
                        >
                            Add
                        </UIButton>
                    </div>

                    <hr className="my-8 border-gray-200" />

                    {/* FORM SECTION */}
                    {showForm && (
                        <div id="kp-form-section">
                            <h3 className="text-lg font-medium pb-5">
                                {editingId ? "Edit" : "Add New"} Knowledge and Attitude Profile (KP)
                            </h3>

                        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8 shadow-sm">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Attribute Code <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${errors.pkp_attr_code ? 'border-red-500' : 'border-gray-300'}`}
                                        value={form.pkp_attr_code}
                                        onChange={(e) => {
                                            setForm({ ...form, pkp_attr_code: e.target.value });
                                            if (errors.pkp_attr_code) setErrors({ ...errors, pkp_attr_code: "" });
                                        }}
                                        placeholder="Enter Attribute Code"
                                    />
                                    {errors.pkp_attr_code && <p className="text-red-500 text-xs mt-1 font-medium">{errors.pkp_attr_code}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Attribute Description <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <textarea
                                            className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm resize-none ${errors.pkp_attr_description ? 'border-red-500' : 'border-gray-300'}`}
                                            rows={3}
                                            value={form.pkp_attr_description}
                                            onChange={(e) => {
                                                setForm({ ...form, pkp_attr_description: e.target.value });
                                                if (errors.pkp_attr_description) setErrors({ ...errors, pkp_attr_description: "" });
                                            }}
                                            maxLength={2000}
                                            placeholder="Enter Attribute Description"
                                        />
                                        <div className="text-right text-xs text-gray-400 mt-1">
                                            {(form.pkp_attr_description || "").length} / 2000
                                        </div>
                                        {errors.pkp_attr_description && <p className="text-red-500 text-xs mt-1 font-medium">{errors.pkp_attr_description}</p>}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-8">
                                <UIButton
                                    className="button-bg"
                                    onClick={handleSave}
                                >
                                    <FaSave className="mr-2" /> {editingId ? "Update" : "Save"}
                                </UIButton>
                                <UIButton
                                    className="panel-bg-1 main-page-text-color border border-[#437880] !shadow-none"
                                    onClick={handleReset}
                                >
                                    <FaSync className="mr-2" /> Reset
                                </UIButton>
                            </div>
                        </div>
                    </div>
                    )}
                </>
            )}
        </div>
    );
};

export default ManageKnowledgeProfile;

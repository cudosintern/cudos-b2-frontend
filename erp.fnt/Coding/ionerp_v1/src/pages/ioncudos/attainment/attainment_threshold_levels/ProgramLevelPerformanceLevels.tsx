import React, { useState, useEffect, useMemo } from "react";
import { SectionTitle, TableWrapper, EditIcon, DeleteIcon, SearchBar } from "./commonComponents";
import DataTable from "../../../../components/Table/DataTable";
import { toast } from "react-toastify";
import axiosInstance from "../../../../utils/api";
import { PerformanceLevel } from "./responseInterface";
import Select from "../../../../components/FormBuilder/fields/Select";
import TextInput from "../../../../components/FormBuilder/fields/TextInput";
import ModalContainer from "../../../../components/Modal/ModalContainer";
import ConfirmDialog from "../../../../components/Dialog/ConfirmDialog";
import { useForm, Controller } from "react-hook-form";

/* ================= TYPES ================= */
type RowType = PerformanceLevel;

interface Props {
  selectedBatch: number | "";
}

const ProgramLevelPerformanceLevels: React.FC<Props> = ({ selectedBatch }) => {
  const [open, setOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  /* ================= FILTERS ================= */
  const [selectedPo, setSelectedPo] = useState<number | "">("");
  const [selectedPoLabel, setSelectedPoLabel] = useState("");
  const [searchTerm, setSearchTerm] = useState("");


  /* ================= FORM HANDLING ================= */
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      performance_level_name: "",
      performance_level_value: "",
      start_range: "",
      end_range: "",
      description: "",
    },
  });

  /* ================= DATA STATE ================= */
  const [data, setData] = useState<RowType[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async (poId?: number) => {
    const targetPo = poId || selectedPo;
    if (!selectedBatch || !targetPo) {
      setData([]);
      return;
    }
    setLoading(true);
    try {
      const res = await axiosInstance.get(`attainment_threshold_level/po_lvl/po/${targetPo}/performance_levels`, {
        params: { academic_batch_id: selectedBatch }
      }) as any;
      if (res.data?.data?.items) {
        setData(res.data.data.items);
      }
    } catch (error) {
      toast.error("Failed to fetch performance levels");
    } finally {
      setLoading(false);
    }
  };


  const onSave = async (formData: any) => {
    if (!selectedBatch || !selectedPo) {
      toast.warning("Please select Academic Batch and PO first");
      return;
    }

    const payload: PerformanceLevel = {
      academic_batch_id: Number(selectedBatch),
      po_id: Number(selectedPo),
      performance_level_name: formData.performance_level_name,
      performance_level_value: Number(formData.performance_level_value),
      start_range: Number(formData.start_range),
      end_range: Number(formData.end_range),
      conditional_opr: ">=",
      description: formData.description,
      created_by: 1,
    };

    try {
      await axiosInstance.post("attainment_threshold_level/po_lvl", payload);
      toast.success("Performance level created successfully");
      handleReset();
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create performance level");
    }
  };

  const handleEdit = (row: RowType) => {
    reset({
      performance_level_name: row.performance_level_name,
      performance_level_value: String(row.performance_level_value),
      start_range: String(row.start_range),
      end_range: String(row.end_range),
      description: row.description || "",
    });
    setEditId(row.plp_id || null);
  };

  const onUpdate = async (formData: any) => {
    if (!editId) return;

    const payload = {
      performance_level_name: formData.performance_level_name,
      performance_level_value: Number(formData.performance_level_value),
      start_range: Number(formData.start_range),
      end_range: Number(formData.end_range),
      conditional_opr: ">=",
      description: formData.description,
      modified_by: 1,
    };

    try {
      await axiosInstance.put(`attainment_threshold_level/po_lvl/${editId}`, payload, {
        params: { academic_batch_id: selectedBatch, po_id: selectedPo }
      });
      toast.success("Performance level updated successfully");
      handleReset();
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update performance level");
    }
  };

  const handleReset = () => {
    reset({
      performance_level_name: "",
      performance_level_value: "",
      start_range: "",
      end_range: "",
      description: "",
    });
    setEditId(null);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await axiosInstance.delete(`attainment_threshold_level/po_lvl/${deleteId}`);
      toast.success("Performance level deleted successfully");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete performance level");
    } finally {
      setIsConfirmOpen(false);
      setDeleteId(null);
    }
  };

  /* ================= TABLE ================= */
  const columnDefs = [
    { headerName: "PO Reference No.", field: "po_code" },
    {
      headerName: "Program Outcome (PO) Statements",
      field: "po_statement",
      flex: 2,
    },
    {
      headerName: "Manage Performance Levels",
      cellRenderer: (p: any) => (
        <span
          className="text-blue-600 cursor-pointer"
          onClick={() => {
            setSelectedPo(p.data.po_id);
            setSelectedPoLabel(p.data.po_code);
            fetchData(p.data.po_id);
             setOpen(true);
          }}
        >
          Add / Edit
        </span>
      ),
    },
    {
      headerName: "View Performance Levels",
      cellRenderer: (p: any) => (
        <span
          className="text-blue-600 cursor-pointer"
          onClick={() => {
            setSelectedPo(p.data.po_id);
            setSelectedPoLabel(p.data.po_code);
            fetchData(p.data.po_id);
            setViewOpen(true);
          }}
        >
          View Levels
        </span>
      ),
    },
  ];

  // For the main table, we actually need the list of POs for the selected batch
  const [mainRowData, setMainRowData] = useState<any[]>([]);
  useEffect(() => {
    if (selectedBatch) {
       axiosInstance.get(`attainment_threshold_level/po/by_academic_batch/${selectedBatch}`)
        .then((res: any) => {
          if (res.data?.data?.items) {
            setMainRowData(res.data.data.items);
          }
        });
    } else {
        setMainRowData([]);
    }
  }, [selectedBatch]);
  
  const filteredRowData = useMemo(() => {
    if (!searchTerm) return mainRowData;
    const lower = searchTerm.toLowerCase();
    return mainRowData.filter((item: any) => 
      item.po_code?.toLowerCase().includes(lower) || 
      item.po_statement?.toLowerCase().includes(lower)
    );
  }, [mainRowData, searchTerm]);

  return (
    <div className="mt-8">
      <SectionTitle title="Program Outcomes (POs) Level Performances Levels" />

      <p className="text-sm text-black-600 mb-3 font-bold">
        Note : This feature is useful for Chairman or Program Owner to define,
        modify and set different performance levels
      </p>

      <SearchBar value={searchTerm} onChange={(e: any) => setSearchTerm(e.target.value)} />

      <TableWrapper>
        <DataTable
          rowData={filteredRowData}
          columnDefs={columnDefs}
          pagination={true}
        />
      </TableWrapper>

      {/* ================= ADD / EDIT MODAL ================= */}
      <ModalContainer 
        isOpen={open} 
        onClose={() => setOpen(false)} 
        title="Add / Edit Performance Levels"
        size="5xl"
      >
        <div className="p-0 text-sm">
          <div className="bg-gray-100 p-4 rounded-lg mb-6 border border-gray-200">
            <p className="font-bold text-gray-700">Program Outcome: {selectedPoLabel || "Selected PO"}</p>
          </div>

          <form onSubmit={handleSubmit(editId ? onUpdate : onSave)}>
            <div className="overflow-x-auto border border-[#d9dee7] rounded-lg mb-4">
              <table className="w-full text-sm border-collapse">
                <thead className="bg-[#f8fafc]">
                  <tr className="text-center">
                    <th className="px-4 py-2 h-[42px] align-middle text-left text-[13px] font-semibold text-black border-r border-[#d9dee7]">Level Name <span className="text-red-500">*</span></th>
                    <th className="px-4 py-2 h-[42px] align-middle text-left text-[13px] font-semibold text-black border-r border-[#d9dee7]">Value <span className="text-red-500">*</span></th>
                    <th className="px-4 py-2 h-[42px] align-middle text-left text-[13px] font-semibold text-black border-r border-[#d9dee7]">Start Range <span className="text-red-500">*</span></th>
                    <th className="px-4 py-2 h-[42px] align-middle text-left text-[13px] font-semibold text-black border-r border-[#d9dee7]"></th>
                    <th className="px-4 py-2 h-[42px] align-middle text-left text-[13px] font-semibold text-black border-r border-[#d9dee7]">End Range <span className="text-red-500">*</span></th>
                    <th className="px-4 py-2 h-[42px] align-middle text-left text-[13px] font-semibold text-black">Justification <span className="text-red-500">*</span></th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-gray-50 text-center">
                    <td className="p-3 border-r border-[#e2e8f0]">
                      <Controller
                        name="performance_level_name"
                        control={control}
                        rules={{ required: "This field is required." }}
                        render={({ field }) => (
                          <TextInput {...field} placeholder="Level Name" error={errors.performance_level_name} required />
                        )}
                      />
                    </td>
                    <td className="p-3 border-r border-[#e2e8f0]">
                      <Controller
                        name="performance_level_value"
                        control={control}
                        rules={{ required: "This field is required." }}
                        render={({ field }) => (
                          <TextInput {...field} placeholder="Value" type="number" error={errors.performance_level_value} required />
                        )}
                      />
                    </td>
                    <td className="p-3 border-r border-[#e2e8f0]">
                      <Controller
                        name="start_range"
                        control={control}
                        rules={{ required: "This field is required." }}
                        render={({ field }) => (
                          <TextInput {...field} placeholder="Start Range" type="number" error={errors.start_range} required />
                        )}
                      />
                    </td>
                    <td className="p-3 border-r border-[#e2e8f0] font-bold text-xl text-gray-700">
                      ≥
                    </td>
                    <td className="p-3 border-r border-[#e2e8f0]">
                      <Controller
                        name="end_range"
                        control={control}
                        rules={{ required: "This field is required." }}
                        render={({ field }) => (
                          <TextInput {...field} placeholder="End Range" type="number" error={errors.end_range} required />
                        )}
                      />
                    </td>
                    <td className="p-3">
                      <Controller
                        name="description"
                        control={control}
                        render={({ field }) => (
                          <TextInput {...field} placeholder="Justification" />
                        )}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-gray-100 bg-gray-50 p-6 -mx-6 -mb-6">
              <button
                type="submit"
                className="px-6 py-2 text-sm font-bold text-white bg-[#437880] rounded-md hover:bg-[#386269] shadow-md transition-all"
              >
                {editId ? "Update Item" : "Save"}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="px-6 py-2 text-sm font-bold text-white bg-yellow-600 rounded-md hover:bg-yellow-700 shadow-md transition-all focus:outline-none"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-6 py-2 text-sm font-bold text-white bg-red-600 rounded-md hover:bg-red-700 shadow-md transition-all"
              >
                Close
              </button>
            </div>
          </form>

          {/* TABLE */}
          <div className="mt-8 border border-[#d9dee7] rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#f8fafc]">
                <tr>
                  <th className="px-4 py-2 h-[42px] align-middle text-left text-[13px] font-semibold text-black border-r border-[#d9dee7]">Sl No.</th>
                  <th className="px-4 py-2 h-[42px] align-middle text-left text-[13px] font-semibold text-black border-r border-[#d9dee7]">Level Name</th>
                  <th className="px-4 py-2 h-[42px] align-middle text-left text-[13px] font-semibold text-black border-r border-[#d9dee7]">Level Value</th>
                  <th className="px-4 py-2 h-[42px] align-middle text-left text-[13px] font-semibold text-black border-r border-[#d9dee7]">Start Range</th>
                  <th className="px-4 py-2 h-[42px] align-middle text-left text-[13px] font-semibold text-black border-r border-[#d9dee7]"></th>
                  <th className="px-4 py-2 h-[42px] align-middle text-left text-[13px] font-semibold text-black border-r border-[#d9dee7]">End Range</th>
                  <th className="px-4 py-2 h-[42px] align-middle text-left text-[13px] font-semibold text-black border-r border-[#d9dee7]">Justification</th>
                  <th className="px-4 py-2 h-[42px] align-middle text-center text-[13px] font-semibold text-black">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr><td colSpan={8} className="p-6 text-center text-gray-500">Loading...</td></tr>
                ) : data.length === 0 ? (
                  <tr><td colSpan={8} className="p-6 text-center text-gray-500">No performance levels found</td></tr>
                ) : (
                  data.map((row, i) => (
                    <tr key={i} className="hover:bg-[#d9ebf7] transition-colors duration-150">
                      <td className="px-4 py-2 whitespace-nowrap text-[14px] font-normal text-black border-r border-[#e2e8f0] text-center">{i + 1}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-[14px] font-normal text-black border-r border-[#e2e8f0]">{row.performance_level_name}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-[14px] font-normal text-black border-r border-[#e2e8f0] text-center">{row.performance_level_value}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-[14px] font-normal text-black border-r border-[#e2e8f0] text-center">{row.start_range}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-[14px] font-bold text-lg text-gray-700 border-r border-[#e2e8f0] text-center">≥</td>
                      <td className="px-4 py-2 whitespace-nowrap text-[14px] font-normal text-black border-r border-[#e2e8f0] text-center">{row.end_range}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-[14px] text-gray-600 italic border-r border-[#e2e8f0]">{row.description}</td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="flex justify-center gap-4">
                          <EditIcon onClick={() => handleEdit(row)} />
                          <DeleteIcon onClick={() => {
                            if (row.plp_id) {
                              setDeleteId(row.plp_id);
                              setIsConfirmOpen(true);
                            }
                          }} />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </ModalContainer>

      {/* ================= VIEW MODAL ================= */}
      <ModalContainer 
        isOpen={viewOpen} 
        onClose={() => setViewOpen(false)} 
        title="View Performance Levels"
        size="5xl"
      >
        <div className="p-0 text-sm">
          <div className="bg-gray-100 p-4 rounded-lg mb-6 border border-gray-200">
            <p className="font-bold text-gray-700">Program Outcome: {selectedPoLabel || "Selected PO"}</p>
          </div>

          <div className="border border-[#d9dee7] rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#f8fafc]">
                <tr className="text-center">
                  <th className="px-4 py-2 h-[42px] align-middle text-left text-[13px] font-semibold text-black border-r border-[#d9dee7]">Sl No.</th>
                  <th className="px-4 py-2 h-[42px] align-middle text-left text-[13px] font-semibold text-black border-r border-[#d9dee7]">Level Name</th>
                  <th className="px-4 py-2 h-[42px] align-middle text-left text-[13px] font-semibold text-black border-r border-[#d9dee7]">Level Value</th>
                  <th className="px-4 py-2 h-[42px] align-middle text-left text-[13px] font-semibold text-black border-r border-[#d9dee7]">Start Range</th>
                  <th className="px-4 py-2 h-[42px] align-middle text-left text-[13px] font-semibold text-black border-r border-[#d9dee7]"></th>
                  <th className="px-4 py-2 h-[42px] align-middle text-left text-[13px] font-semibold text-black border-r border-[#d9dee7]">End Range</th>
                  <th className="px-4 py-2 h-[42px] align-middle text-left text-[13px] font-semibold text-black">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr><td colSpan={7} className="p-6 text-center text-gray-500">Loading...</td></tr>
                ) : data.length === 0 ? (
                  <tr><td colSpan={7} className="p-6 text-center text-gray-500">No performance levels found</td></tr>
                ) : (
                  data.map((row, i) => (
                    <tr key={i} className="hover:bg-[#d9ebf7] transition-colors duration-150">
                      <td className="px-4 py-2 whitespace-nowrap text-[14px] font-normal text-black border-r border-[#e2e8f0] text-center">{i + 1}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-[14px] font-normal text-black border-r border-[#e2e8f0]">{row.performance_level_name}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-[14px] font-normal text-black border-r border-[#e2e8f0] text-center">{row.performance_level_value}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-[14px] font-normal text-black border-r border-[#e2e8f0] text-center">{row.start_range}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-[14px] font-bold text-lg text-gray-700 border-r border-[#e2e8f0] text-center">≥</td>
                      <td className="px-4 py-2 whitespace-nowrap text-[14px] font-normal text-black border-r border-[#e2e8f0] text-center">{row.end_range}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-[14px] text-gray-600 italic">{row.description}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-gray-100 bg-gray-50 p-6 -mx-6 -mb-6">
            <button
              onClick={() => setViewOpen(false)}
              className="px-6 py-2 text-sm font-bold text-white bg-red-600 rounded-md hover:bg-red-700 shadow-md transition-all focus:outline-none"
            >
              Close
            </button>
          </div>
        </div>
      </ModalContainer>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Confirmation"
        message="Are you sure you want to delete this performance level?"
      />
    </div>
  );
};

export default ProgramLevelPerformanceLevels;
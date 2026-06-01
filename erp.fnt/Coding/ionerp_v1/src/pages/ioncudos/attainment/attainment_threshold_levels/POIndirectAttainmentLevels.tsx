import React, { useState, useEffect, useMemo } from "react";
import { SectionTitle, TableWrapper, EditIcon, DeleteIcon, SearchBar } from "./commonComponents";
import DataTable from "../../../../components/Table/DataTable";
import { toast } from "react-toastify";
import axiosInstance from "../../../../utils/api";
import { IndirectAttainmentLevel } from "./responseInterface";
import TextInput from "../../../../components/FormBuilder/fields/TextInput";
import ModalContainer from "../../../../components/Modal/ModalContainer";
import ConfirmDialog from "../../../../components/Dialog/ConfirmDialog";
import { useForm, Controller } from "react-hook-form";

type RowType = IndirectAttainmentLevel;

interface Props {
  selectedBatch: number | "";
}

const POIndirectAttainmentLevels: React.FC<Props> = ({ selectedBatch }) => {
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
    formState: { errors },
  } = useForm({
    defaultValues: {
      attainment_level_name: "",
      attainment_level_value: "",
      indirect_percentage: "",
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
      const res = await axiosInstance.get(`attainment_threshold_level/indirect/${selectedBatch}/${targetPo}`) as any;
      if (res.data?.data?.items) {
        setData(res.data.data.items);
      }
    } catch (error) {
      toast.error("Failed to fetch indirect attainment levels");
    } finally {
      setLoading(false);
    }
  };


  const onSave = async (formData: any) => {
    if (!selectedBatch || !selectedPo) {
      toast.warning("Please select Academic Batch and PO first");
      return;
    }

    const payload: IndirectAttainmentLevel = {
      academic_batch_id: Number(selectedBatch),
      po_id: Number(selectedPo),
      attainment_level_name: formData.attainment_level_name,
      attainment_level_value: Number(formData.attainment_level_value),
      indirect_percentage: Number(formData.indirect_percentage),
      conditional_opr: ">=",
      created_by: 1,
    };

    try {
      await axiosInstance.post(`attainment_threshold_level/indirect/${selectedBatch}/${selectedPo}`, payload);
      toast.success("Indirect attainment level created successfully");
      handleReset();
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create indirect attainment level");
    }
  };

  const handleEdit = (row: RowType) => {
    reset({
      attainment_level_name: row.attainment_level_name,
      attainment_level_value: String(row.attainment_level_value),
      indirect_percentage: String(row.indirect_percentage),
    });
    setEditId(row.indirect_level_id || null);
  };

  const onUpdate = async (formData: any) => {
    if (!editId) return;

    const payload = {
      attainment_level_name: formData.attainment_level_name,
      attainment_level_value: Number(formData.attainment_level_value),
      indirect_percentage: Number(formData.indirect_percentage),
      conditional_opr: ">=",
      modified_by: 1,
    };

    try {
      await axiosInstance.put(`attainment_threshold_level/indirect/${selectedBatch}/${selectedPo}/${editId}`, payload);
      toast.success("Indirect attainment level updated successfully");
      handleReset();
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update indirect attainment level");
    }
  };

  const handleReset = () => {
    reset({
      attainment_level_name: "",
      attainment_level_value: "",
      indirect_percentage: "",
    });
    setEditId(null);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await axiosInstance.delete(`attainment_threshold_level/indirect/${selectedBatch}/${selectedPo}/${deleteId}`);
      toast.success("Indirect attainment level deleted successfully");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete indirect attainment level");
    } finally {
      setIsConfirmOpen(false);
      setDeleteId(null);
    }
  };

  /* ================= TABLE ================= */
  const columnDefs = [
    { headerName: "PO Reference No.", field: "po_code" },
    { headerName: "Program Outcome (PO) Statements", field: "po_statement", flex: 2 },
    {
      headerName: "Manage PO Levels",
      cellRenderer: (p: any) => (
        <span className="text-blue-600 cursor-pointer" onClick={() => {
            setSelectedPo(p.data.po_id);
            setSelectedPoLabel(p.data.po_code);
            fetchData(p.data.po_id);
            setOpen(true);
        }}>
          Add / Edit
        </span>
      ),
    },
    {
      headerName: "View PO Levels",
      cellRenderer: (p: any) => (
        <span className="text-blue-600 cursor-pointer" onClick={() => {
            setSelectedPo(p.data.po_id);
            setSelectedPoLabel(p.data.po_code);
            fetchData(p.data.po_id);
            setViewOpen(true);
        }}>
          View Levels
        </span>
      ),
    },
  ];

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
      <SectionTitle title="Program Outcome(PO) Indirect Attainment Levels" />

       <p className="text-sm text-black-600 mb-3 font-bold">
        Note : This feature is useful for Chairman or Program Owner to define,
        modify and set different set different Indirect PO levels for each Program Outcomes (POs)
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
        title="Add / Edit PO Indirect Attainment Levels"
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
                  <tr>
                    <th className="px-4 py-2 h-[42px] align-middle text-left text-[13px] font-semibold text-black border-r border-[#d9dee7]">Attainmnent Level Name <span className="text-red-500">*</span></th>
                    <th className="px-4 py-2 h-[42px] align-middle text-left text-[13px] font-semibold text-black border-r border-[#d9dee7]">Attainment Level Value <span className="text-red-500">*</span></th>
                    <th className="px-4 py-2 h-[42px] align-middle text-left text-[13px] font-semibold text-black border-r border-[#d9dee7]">Actual Percentage</th>
                    <th className="px-4 py-2 h-[42px] align-middle text-left text-[13px] font-semibold text-black border-r border-[#d9dee7]"></th>
                    <th className="px-4 py-2 h-[42px] align-middle text-left text-[13px] font-semibold text-black">Indirect Attainment % <span className="text-red-500">*</span></th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white text-center">
                    <td className="p-3 border-r border-[#e2e8f0]">
                      <Controller
                        name="attainment_level_name"
                        control={control}
                        rules={{ required: "This field is required." }}
                        render={({ field }) => (
                          <TextInput {...field} placeholder="Level Name" error={errors.attainment_level_name} required />
                        )}
                      />
                    </td>
                    <td className="p-3 border-r border-[#e2e8f0]">
                      <Controller
                        name="attainment_level_value"
                        control={control}
                        rules={{ required: "This field is required." }}
                        render={({ field }) => (
                          <TextInput {...field} placeholder="Level Value" type="number" error={errors.attainment_level_value} required />
                        )}
                      />
                    </td>
                    <td className="p-3 border-r border-[#e2e8f0] text-gray-500 italic">
                      Actual %
                    </td>
                    <td className="p-3 border-r border-[#e2e8f0] font-bold text-xl text-gray-700">
                      ≥
                    </td>
                    <td className="p-3">
                      <Controller
                        name="indirect_percentage"
                        control={control}
                        rules={{ 
                          required: "This field is required.",
                          min: { value: 0, message: "Minimum 0%" },
                          max: { value: 100, message: "Maximum 100%" }
                        }}
                        render={({ field }) => (
                          <TextInput {...field} placeholder="Indirect %" type="number" error={errors.indirect_percentage} required />
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
                  <th className="px-4 py-2 h-[42px] align-middle text-left text-[13px] font-semibold text-black border-r border-[#d9dee7]">Attainment Level Name</th>
                  <th className="px-4 py-2 h-[42px] align-middle text-left text-[13px] font-semibold text-black border-r border-[#d9dee7]">Attainment Level Value</th>
                  <th className="px-4 py-2 h-[42px] align-middle text-left text-[13px] font-semibold text-black border-r border-[#d9dee7]">Actual Percentage</th>
                  <th className="px-4 py-2 h-[42px] align-middle text-left text-[13px] font-semibold text-black border-r border-[#d9dee7]"></th>
                  <th className="px-4 py-2 h-[42px] align-middle text-left text-[13px] font-semibold text-black border-r border-[#d9dee7]">Indirect Attainment</th>
                  <th className="px-4 py-2 h-[42px] align-middle text-center text-[13px] font-semibold text-black">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr><td colSpan={7} className="p-6 text-center text-gray-500">Loading...</td></tr>
                ) : data.length === 0 ? (
                  <tr><td colSpan={7} className="p-6 text-center text-gray-500">No indirect levels found</td></tr>
                ) : (
                  data.map((row, i) => (
                    <tr key={i} className="hover:bg-[#d9ebf7] transition-colors duration-150">
                      <td className="px-4 py-2 whitespace-nowrap text-[14px] font-normal text-black border-r border-[#e2e8f0] text-center">{i + 1}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-[14px] font-normal text-black border-r border-[#e2e8f0]">{row.attainment_level_name}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-[14px] font-normal text-black border-r border-[#e2e8f0] text-center">{row.attainment_level_value}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-[14px] font-normal text-black border-r border-[#e2e8f0] text-center italic text-gray-500">Actual %</td>
                      <td className="px-4 py-2 whitespace-nowrap text-[14px] font-bold text-lg text-gray-700 border-r border-[#e2e8f0] text-center">≥</td>
                      <td className="px-4 py-2 whitespace-nowrap text-[14px] font-normal text-black border-r border-[#e2e8f0] text-center">{row.indirect_percentage}</td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="flex justify-center gap-4">
                          <EditIcon onClick={() => handleEdit(row)} />
                          <DeleteIcon onClick={() => {
                            if (row.indirect_level_id) {
                              setDeleteId(row.indirect_level_id);
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
        title="View PO Indirect Attainment Levels"
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
                  <th className="px-4 py-2 h-[42px] align-middle text-left text-[13px] font-semibold text-black border-r border-[#d9dee7]">Attainment Level Name</th>
                  <th className="px-4 py-2 h-[42px] align-middle text-left text-[13px] font-semibold text-black border-r border-[#d9dee7]">Attainment Level Value</th>
                  <th className="px-4 py-2 h-[42px] align-middle text-left text-[13px] font-semibold text-black border-r border-[#d9dee7]">Actual Percentage</th>
                  <th className="px-4 py-2 h-[42px] align-middle text-left text-[13px] font-semibold text-black border-r border-[#d9dee7]"></th>
                  <th className="px-4 py-2 h-[42px] align-middle text-left text-[13px] font-semibold text-black">Indirect Attainment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr><td colSpan={6} className="p-6 text-center text-gray-500">Loading...</td></tr>
                ) : data.length === 0 ? (
                  <tr><td colSpan={6} className="p-6 text-center text-gray-500">No indirect levels found</td></tr>
                ) : (
                  data.map((row, i) => (
                    <tr key={i} className="hover:bg-[#d9ebf7] transition-colors duration-150">
                      <td className="px-4 py-2 whitespace-nowrap text-[14px] font-normal text-black border-r border-[#e2e8f0] text-center">{i + 1}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-[14px] font-normal text-black border-r border-[#e2e8f0]">{row.attainment_level_name}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-[14px] font-normal text-black border-r border-[#e2e8f0] text-center">{row.attainment_level_value}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-[14px] font-normal text-black border-r border-[#e2e8f0] text-center italic text-gray-500">Actual %</td>
                      <td className="px-4 py-2 whitespace-nowrap text-[14px] font-bold text-lg text-gray-700 border-r border-[#e2e8f0] text-center">≥</td>
                      <td className="px-4 py-2 whitespace-nowrap text-[14px] font-normal text-black text-center">{row.indirect_percentage}</td>
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
        message="Are you sure you want to delete this indirect attainment level?"
      />
    </div>
  );
};

export default POIndirectAttainmentLevels;
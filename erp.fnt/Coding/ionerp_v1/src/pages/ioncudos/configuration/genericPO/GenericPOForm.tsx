import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./GenericPO.css";
import { FaSave, FaSync, FaTimes, FaTrash, FaMinusCircle } from "react-icons/fa";
import { toast } from "react-toastify";
import UIButton from "../../../../components/FormBuilder/fields/Button";
import { 
    getAccreditationTypes, 
    createAccreditationType, 
    updateAccreditationType, 
    getPoTypes,
    getPoCodes
} from "./genericPOSchema";
import { AccreditationType, PoType, PoCode } from "./genericPOResponseInterface";

const GenericPOForm: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEdit = Boolean(id);

    // --- State ---
    const [loading, setLoading] = useState(false);
    const [poTypes, setPoTypes] = useState<PoType[]>([]);
    const [poCodes, setPoCodes] = useState<PoCode[]>([]);
    
    // Form State
    const [typeForm, setTypeForm] = useState({ atype_name: "", atype_description: "" });
    const [formPos, setFormPos] = useState<any[]>([
        { po_code: "", po_reference: "", po_type_id: null, po_statement: "", po_description: "", crclm_id: 1 }
    ]);

    // Used to track the original object for updates if needed
    const [editingType, setEditingType] = useState<AccreditationType | null>(null);

    // --- Effects ---
    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [typesRes, poTypesRes, poCodesRes] = await Promise.all([
                getAccreditationTypes(),
                getPoTypes(),
                getPoCodes()
            ]);

            if (poTypesRes.status) {
                setPoTypes(poTypesRes.data || []);
            }
            if (poCodesRes.status) {
                setPoCodes(poCodesRes.data || []);
            }

            if (isEdit && typesRes.status) {
                const types = typesRes.data || [];
                const type = types.find(t => t.atype_id === Number(id));
                if (type) {
                    setEditingType(type);
                    setTypeForm({ atype_name: type.atype_name, atype_description: type.atype_description });
                    
                    if (type.pos && type.pos.length > 0) {
                        setFormPos(type.pos.map(p => ({
                            po_id: p.po_id,
                            po_code: p.po_code,
                            po_reference: p.po_reference || "",
                            po_type_id: p.po_type_id,
                            po_statement: p.po_statement,
                            po_description: p.po_description || "",
                            crclm_id: p.crclm_id || 1
                        })));
                    } else {
                        // Keep default empty row if no POs
                        const defaultPoTypeId = poTypesRes.data && poTypesRes.data.length > 0 ? poTypesRes.data[0].po_type_id : null;
                         setFormPos([{ po_code: "", po_reference: "", po_type_id: defaultPoTypeId, po_statement: "", po_description: "", crclm_id: 1 }]);
                    }
                } else {
                    toast.error("Accreditation Type not found");
                    navigate("..");
                }
            } else if (!isEdit) {
                 // Initialize default for Add
                 if (poTypesRes.data && poTypesRes.data.length > 0) {
                     setFormPos([{ po_code: "", po_reference: "", po_type_id: poTypesRes.data[0].po_type_id, po_statement: "", po_description: "", crclm_id: 1 }]);
                 }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // --- Handlers ---
    const addFormPoRow = () => {
        const defaultPoTypeId = poTypes.length > 0 ? poTypes[0].po_type_id : null;
        setFormPos([...formPos, { po_code: "", po_reference: "", po_type_id: defaultPoTypeId, po_statement: "", po_description: "", crclm_id: 1 }]);
    };
    
    const removeFormPoRow = (index: number) => {
        const newPos = formPos.filter((_, i) => i !== index);
        setFormPos(newPos);
    };

    const handleFormPoChange = (index: number, field: string, value: any) => {
        const newPos = [...formPos];
        newPos[index] = { ...newPos[index], [field]: value };
        setFormPos(newPos);
    };

    const handleSave = async () => {
        if (!typeForm.atype_name) {
            toast.warning("Accreditation Type Name is required");
            return;
        }

        // Validate PO rows before filtering
        for (let i = 0; i < formPos.length; i++) {
            const po = formPos[i];
            const hasData = po.po_code || po.po_statement || po.po_reference || po.po_type_id;
            
            // If row has any data, enforce required fields
            if (hasData) {
                if (!po.po_code) {
                    toast.warning(`Row ${i+1}: PO Code is required`);
                    return;
                }
                if (!po.po_statement) {
                    toast.warning(`Row ${i+1}: PO Statement is required`);
                    return;
                }
                if (!po.po_type_id) {
                    toast.warning(`Row ${i+1}: PO Type is required`);
                    return;
                }
            }
        }

        try {
            const payload: any = {
                ...typeForm,
                entity_id: 1, // REQUIRED
            };

            if (formPos.length > 0) {
                 const validPos = formPos.filter(p => p.po_code && p.po_statement).map(p => ({
                    ...p,
                    crclm_id: p.crclm_id || 1
                }));
                // For edit, we send the list even if empty (to delete all), for add we check if valid
                if (validPos.length > 0 || isEdit) {
                     payload.pos = validPos;
                }
            } else if (isEdit) {
                payload.pos = []; 
            }

            if (isEdit && editingType) {
                await updateAccreditationType(editingType.atype_id, payload);
                toast.success("Accreditation Type updated successfully");
            } else {
                await createAccreditationType(payload);
                toast.success("PO created successfully");
            }

            navigate("/po"); // Navigate back to list
        } catch (e: any) {
            console.error(e);
            toast.error("Failed to save: " + (e.response?.data?.detail || e.message));
        }
    };

     const handleReset = () => {
        if(isEdit && editingType) {
             // Reload data implies reset
             setTypeForm({ atype_name: editingType.atype_name, atype_description: editingType.atype_description });
             if (editingType.pos && editingType.pos.length > 0) {
                setFormPos(editingType.pos.map(p => ({
                    po_id: p.po_id,
                    po_code: p.po_code,
                    po_reference: p.po_reference || "",
                    po_type_id: p.po_type_id,
                    po_statement: p.po_statement,
                    po_description: p.po_description || "",
                    crclm_id: p.crclm_id || 1
                })));
            }
        } else {
            setTypeForm({ atype_name: "", atype_description: "" });
            const defaultPoTypeId = poTypes.length > 0 ? poTypes[0].po_type_id : null;
            setFormPos([{ po_code: "", po_reference: "", po_type_id: defaultPoTypeId, po_statement: "", po_description: "", crclm_id: 1 }]);
        }
    };

    if (loading) return <div className="p-4">Loading...</div>;

    return (
        <div className="">
            <h3 className="text-lg font-medium pb-5 text-teal-700">
                {isEdit ? "Edit" : "Add New"} Accreditation Type & Generic Program Outcomes (POs)
            </h3>

            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Accreditation Type Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Accreditation Type <span className="text-red-500">*</span>
                        </label>
                        <input 
                            type="text"
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            value={typeForm.atype_name}
                            onChange={(e) => setTypeForm({...typeForm, atype_name: e.target.value})}
                            placeholder="Enter accreditation type"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>
                        <div className="relative">
                             <textarea
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm resize-none"
                                rows={3}
                                value={typeForm.atype_description}
                                onChange={(e) => setTypeForm({...typeForm, atype_description: e.target.value})}
                                maxLength={2000}
                                placeholder="Enter description"
                            />
                            <div className="text-right text-xs text-gray-400 mt-1">
                                {typeForm.atype_description.length} / 2000
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* PO Details Section */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 shadow-sm">
                <div className="flex justify-between items-center mb-6 border-b pb-3">
                     <h4 className="text-md font-medium text-gray-800">Generic Program Outcome (PO) Details</h4>
                </div>
                
                {formPos.map((po, index) => (
                    <div key={index} className={`mb-6 pb-6 ${index !== formPos.length - 1 ? 'border-b border-gray-100' : ''}`}>
                        <div className="flex justify-between items-start mb-2">
                             {/* Entry header removed per request */}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    PO Code <span className="text-red-500">*</span>
                                </label>
                                <select
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    value={po.po_code}
                                    onChange={(e) => handleFormPoChange(index, "po_code", e.target.value)}
                                >
                                    <option value="">Select Code</option>
                                    {poCodes
                                        .filter(c => !formPos.some((p, i) => i !== index && p.po_code === c.mt_details_name))
                                        .map(c => (
                                        <option key={c.mt_details_id} value={c.mt_details_name}>{c.mt_details_name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    PO Reference <span className="text-red-500">*</span>
                                </label>
                                <input 
                                    type="text"
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    value={po.po_reference} 
                                    onChange={(e) => handleFormPoChange(index, "po_reference", e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    PO Type <span className="text-red-500">*</span>
                                </label>
                                <select
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    value={po.po_type_id || ""}
                                    onChange={(e) => handleFormPoChange(index, "po_type_id", Number(e.target.value))}
                                >
                                    <option value="">Select PO Type</option>
                                    {poTypes.map(type => (
                                        <option key={type.po_type_id} value={type.po_type_id}>
                                            {type.po_type_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Program Outcome (PO) Statement <span className="text-red-500">*</span>
                            </label>
                             <div className="relative">
                                <textarea
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm resize-none"
                                    value={po.po_statement}
                                    onChange={(e) => handleFormPoChange(index, "po_statement", e.target.value)}
                                    maxLength={2000}
                                    rows={4}
                                    placeholder="Enter statement"
                                />
                                <div className="text-right text-xs text-gray-400 mt-1">
                                    {po.po_statement ? po.po_statement.length : 0} / 2000
                                </div>
                            </div>
                        </div>

                        {/* Remove Row Button Below Statement - Entry #1 is mandatory and cannot be deleted */}
                        {index !== 0 && (
                            <div className="flex justify-end mt-2">
                                <UIButton
                                    className="bg-[#d9534f]"
                                    size="sm"
                                    onClick={() => removeFormPoRow(index)}
                                >
                                    <FaMinusCircle className="mr-2" /> Delete PO
                                </UIButton>
                            </div>
                        )}
                    </div>
                ))}
                
                {formPos.length === 0 && (
                    <div className="text-center p-6 text-gray-500 bg-gray-50 rounded-lg dashed-border">
                        No POs added yet. Click "Add PO" to start.
                    </div>
                )}
            </div>

            <div className="flex justify-end gap-3 mt-8">
                <UIButton
                    variant="primary"
                    size="sm"
                    onClick={addFormPoRow}
                >
                    Add More PO
                </UIButton>
                <UIButton
                    className="button-bg"
                    onClick={handleSave}
                >
                    <FaSave className="mr-2" /> {isEdit ? "Update" : "Save"}
                </UIButton>
                <UIButton
                    className="panel-bg-1 main-page-text-color border border-[#437880] !shadow-none"
                    onClick={handleReset}
                >
                    <FaSync className="mr-2" /> Reset
                </UIButton>
                <UIButton
                    className="bg-[#d9534f]"
                    onClick={() => navigate("/po")}
                >
                    <FaTimes className="mr-2" /> Cancel
                </UIButton>
            </div>
        </div>
    );
};

export default GenericPOForm;

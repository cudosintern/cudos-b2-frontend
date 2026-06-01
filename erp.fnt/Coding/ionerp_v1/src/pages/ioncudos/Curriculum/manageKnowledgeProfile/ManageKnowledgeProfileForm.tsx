import React, { useEffect, useState } from "react";
import { FaSave, FaSync, FaTimes, FaUndo } from "react-icons/fa";
import { KP, FormType } from "./manageKnowledgeProfile.types";

interface Props {
  initialData?: KP | null;
  onSave: (data: any) => void;
  onCancel: () => void;
  isEditMode: boolean;
}

const emptyForm: FormType = {
  pkp_attr_code: "",
  pkp_attr_description: "",
};

const ManageKnowledgeProfileForm: React.FC<Props> = ({
  initialData,
  onSave,
  onCancel,
  isEditMode,
}) => {
  const [form, setForm] = useState<FormType>(emptyForm);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (initialData && isEditMode) {
      setForm({
        pkp_attr_code: initialData.pkp_attr_code,
        pkp_attr_description: initialData.pkp_attr_description,
      });
    } else {
      setForm(emptyForm);
    }
  }, [initialData, isEditMode]);

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!form.pkp_attr_code.trim()) {
      newErrors.pkp_attr_code = "Attribute Code is required";
    }
    if (!form.pkp_attr_description.trim()) {
      newErrors.pkp_attr_description = "Attribute Description is required";
    } else if (form.pkp_attr_description.length > 2000) {
      newErrors.pkp_attr_description = "Description cannot exceed 2000 characters";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validate()) {
      onSave(form);
    }
  };

  const handleReset = () => {
    setForm(emptyForm);
    setErrors({});
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
      <div className="bg-gray-800 text-white p-3 rounded-t-lg mb-4 -mx-6 -mt-6">
        <h3 className="text-lg font-semibold px-4">
            {isEditMode ? "Edit Knowledge and Attitude Profile (KP)" : "Add Knowledge and Attitude Profile (KP)"}
        </h3>
      </div>
      
      <div className="grid grid-cols-1 gap-6 mb-6">
        {/* Attribute Code */}
        <div className="flex items-center">
            <label className="w-1/4 text-right pr-4 text-sm font-medium text-gray-700">
                Attribute Code: <span className="text-red-500">*</span>
            </label>
            <div className="w-3/4">
                <input
                    type="text"
                    className={`block w-full px-3 py-2 border ${errors.pkp_attr_code ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                    value={form.pkp_attr_code}
                    onChange={(e) => setForm({ ...form, pkp_attr_code: e.target.value })}
                    placeholder="Enter Attribute Code"
                />
                {errors.pkp_attr_code && <p className="text-red-500 text-xs mt-1">{errors.pkp_attr_code}</p>}
            </div>
        </div>

        {/* Attribute Description */}
        <div className="flex items-start">
           <label className="w-1/4 text-right pr-4 text-sm font-medium text-gray-700 mt-2">
                Attribute Description: <span className="text-red-500">*</span>
            </label>
            <div className="w-3/4 relative">
                <textarea
                    className={`block w-full px-3 py-2 border ${errors.pkp_attr_description ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm resize-none`}
                    rows={4}
                    value={form.pkp_attr_description}
                    onChange={(e) => setForm({ ...form, pkp_attr_description: e.target.value })}
                    maxLength={2000}
                    placeholder="Enter Attribute Description"
                />
                <div className="text-right text-xs text-gray-400 mt-1">
                    {form.pkp_attr_description.length} / 2000
                </div>
                {errors.pkp_attr_description && <p className="text-red-500 text-xs mt-1">{errors.pkp_attr_description}</p>}
            </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6 border-t pt-4">
        {isEditMode ? (
            <button
            onClick={onCancel}
            className="inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
            <FaTimes className="mr-2" /> Cancel
            </button>
        ) : (
            <button
            onClick={handleReset}
            className="inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-teal-500 hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
            >
            <FaSync className="mr-2" /> Reset
            </button>
        )}
        
        <button
            onClick={handleSave}
            className="inline-flex justify-center items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
            <FaSave className="mr-2" /> {isEditMode ? "Update" : "Save"}
        </button>
      </div>
    </div>
  );
};

export default ManageKnowledgeProfileForm;

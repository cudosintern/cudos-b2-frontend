import React, { useState } from "react";
import { FaPlus, FaTimes, FaSave, FaExchangeAlt } from "react-icons/fa";
import UIButton from "../../../../components/FormBuilder/fields/Button";
import { ResponseTemplate, ScaleOption } from "./responseInterface";
import { toast } from "react-toastify";

interface Props {
  initialData: ResponseTemplate | null;
  onSave: (data: ResponseTemplate) => void;
  onCancel: () => void;
}

const ResponseTemplateForm: React.FC<Props> = ({
  initialData,
  onSave,
  onCancel,
}) => {
  const [templateName, setTemplateName] = useState(initialData?.name || "");
  const [isOutcomeAttainment, setIsOutcomeAttainment] = useState(
    initialData?.feedbk_flag === 1,
  );

  const [options, setOptions] = useState<ScaleOption[]>(
    initialData?.options_list && initialData.options_list.length > 0
      ? initialData.options_list
      : [
          { options: "", option_val: 0 },
          { options: "", option_val: 0 },
          { options: "", option_val: 0 },
        ],
  );

  const handleAddRow = () => {
    setOptions([...options, { options: "", option_val: 0 }]);
  };

  const handleRemoveRow = (index: number) => {
    if (options.length === 1) {
      toast.warning("At least one option is required");
      return;
    }
    const newOptions = options.filter((_, i) => i !== index);
    setOptions(newOptions);
  };

  const handleOptionChange = (
    index: number,
    field: keyof ScaleOption,
    value: any,
  ) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setOptions(newOptions);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!templateName.trim()) {
      toast.error("Template Name is required");
      return;
    }

    const hasEmptyLabels = options.some((opt) => !opt.options.trim());
    if (hasEmptyLabels) {
      toast.error("All answer options must be filled");
      return;
    }

    const payload: ResponseTemplate = {
      answer_template_id: initialData?.answer_template_id || 0,
      name: templateName,
      feedbk_flag: isOutcomeAttainment ? 1 : 0,
      options_list: options,
    };

    onSave(payload);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-6">
        <h2 className="text-xl font-bold text-gray-800">
          {initialData ? "Edit Response Template" : "Add Response Template"}
        </h2>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <FaTimes size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="flex flex-col md:flex-row gap-8 mb-8 items-end">
          <div className="flex-1 md:max-w-md">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Response Template Name: <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#437880] focus:border-[#437880] outline-none transition-all text-sm"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
            />
          </div>

          <div className="flex-1 pb-2">
            <label className="flex items-center gap-2 cursor-pointer group">
              <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
                Only for Outcome Attainment Survey:
              </span>
              <input
                type="checkbox"
                checked={isOutcomeAttainment}
                onChange={(e) => setIsOutcomeAttainment(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-[#437880] focus:ring-[#437880] focus:ring-offset-0 cursor-pointer"
              />
            </label>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <label className="block text-sm font-bold text-gray-700">
              Answer Options <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={handleAddRow}
              className="flex items-center gap-2 text-xs font-bold text-white bg-[#0066cc] px-3 py-1.5 rounded hover:bg-[#0052a3] transition-colors"
            >
              <FaPlus /> Add Options
            </button>
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded-md">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 w-16 text-center">Sl No.</th>
                  <th className="px-4 py-3">
                    Answer Option <span className="text-red-500">*</span>
                  </th>
                  <th className="px-4 py-3 w-48">
                    Weightage <span className="text-red-500">*</span>
                  </th>
                  <th className="px-4 py-3 w-20 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {options.map((opt, index) => (
                  <tr key={index} className="hover:bg-gray-50/50">
                    <td className="px-4 py-2 text-center text-gray-500 font-medium">
                      {index + 1}
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-[#437880] outline-none text-sm"
                        value={opt.options}
                        onChange={(e) =>
                          handleOptionChange(index, "options", e.target.value)
                        }
                        required
                      />
                    </td>
                    <td className="px-4 py-2">
                      <select
                        className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-[#437880] outline-none text-sm bg-white"
                        value={opt.option_val}
                        onChange={(e) =>
                          handleOptionChange(
                            index,
                            "option_val",
                            Number(e.target.value),
                          )
                        }
                        required
                      >
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((val) => (
                          <option key={val} value={val}>
                            {val}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(index)}
                        className="text-gray-800 hover:text-red-600 p-1.5 rounded-md transition-colors"
                      >
                        <FaTimes size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t border-gray-200 font-bold text-gray-700">
                <tr>
                  <td colSpan={2} className="px-4 py-3 text-right">
                    Total Summary:
                  </td>
                  <td className="px-4 py-3 text-left text-[#437880] pl-6">
                    {options.reduce(
                      (sum, o) => sum + Number(o.option_val || 0),
                      0,
                    )}
                  </td>
                  <td
                    colSpan={1}
                    className="px-4 py-3 text-center text-xs text-gray-500 font-normal"
                  >
                    ({options.length} options)
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
          <UIButton
            type="submit"
            className="bg-[#0066cc] !border-none hover:bg-[#0052a3]"
          >
            <FaSave className="mr-2" /> {initialData ? "Update" : "Save"}
          </UIButton>
          <UIButton
            type="button"
            className="bg-[#5bc0de] !border-none hover:bg-[#31b0d5]"
            onClick={() => {
              setTemplateName("");
              setIsOutcomeAttainment(false);
              setOptions([
                { options: "", option_val: 0 },
                { options: "", option_val: 0 },
                { options: "", option_val: 0 },
              ]);
            }}
          >
            <FaExchangeAlt className="mr-2" /> Reset
          </UIButton>
          <UIButton
            type="button"
            className="bg-[#d9534f] !border-none hover:bg-[#c9302c]"
            onClick={onCancel}
          >
            <FaTimes className="mr-2" /> Cancel
          </UIButton>
        </div>
      </form>
    </div>
  );
};

export default ResponseTemplateForm;

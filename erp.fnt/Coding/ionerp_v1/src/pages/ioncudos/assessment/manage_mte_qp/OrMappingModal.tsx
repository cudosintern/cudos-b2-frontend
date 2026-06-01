import React, { useState, useEffect, useMemo } from "react";
import { X, Plus, Trash2, AlertCircle, Save, RotateCcw } from "lucide-react";
import MultiSelect from "../../../../components/FormBuilder/fields/MultiSelect";
import { toast } from "react-toastify";

interface OrMappingRow {
  question_one: string[];
  question_two: string[];
  or_type: number;
  errors?: {
    question_one?: string;
    question_two?: string;
    general?: string;
  };
}

interface OrMappingModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: any[];
  onSave: (mappings: OrMappingRow[]) => void;
  initialMappings?: any[];
}

const OrMappingModal: React.FC<OrMappingModalProps> = ({
  isOpen,
  onClose,
  questions,
  onSave,
  initialMappings = [],
}) => {
  const [mappings, setMappings] = useState<OrMappingRow[]>([]);

  // Identify mandatory questions
  const mandatoryQuestions = useMemo(() => 
    questions.filter((q: any) => 
      String(q.is_mandatory) === '1' || q.is_mandatory === 1 || q.is_mandatory === true ||
      String(q.isMandatory) === '1' || q.isMandatory === 1 || q.isMandatory === true ||
      String(q.mandatory) === '1' || q.mandatory === 1 || q.mandatory === true
    ),
    [questions]
  );

  const mandatoryLabels = useMemo(() => 
    mandatoryQuestions.length > 0 
      ? mandatoryQuestions.map(q => q.questionNo || `Q${q.id}`).join(", ")
      : "--",
    [mandatoryQuestions]
  );

  const mandatoryIds = useMemo(() => 
    new Set(mandatoryQuestions.map(q => String(q.id))),
    [mandatoryQuestions]
  );

  // Filter question options to exclude mandatory questions and format label: "1b (25.00 | CO1)"
  const allQuestionOptions = useMemo(() => 
    questions
      .filter((q: any) => !mandatoryIds.has(String(q.id)))
      .map((q: any) => ({
        label: `${q.questionNo || `Q${q.id}`} (${Number(q.marks).toFixed(2)} | ${q.cos || "N/A"})`,
        value: String(q.id),
        unit_id: q.unit_id,
        marks: Number(q.marks),
      })),
    [questions, mandatoryIds]
  );

  useEffect(() => {
    if (isOpen) {
      let currentMappings: OrMappingRow[] = [];
      
      if (initialMappings && initialMappings.length > 0) {
        // const validMappings = initialMappings.filter(
        //   m => (Array.isArray(m.question_one) && m.question_one.filter((q: any) => String(q).trim() !== '').length > 0) || 
        //        (typeof m.question_one === 'string' && m.question_one.trim() !== '' && m.question_one !== '[]') ||
        //        (Array.isArray(m.question_two) && m.question_two.filter((q: any) => String(q).trim() !== '').length > 0) ||
        //        (typeof m.question_two === 'string' && m.question_two.trim() !== '' && m.question_two !== '[]')
        // );

        const existingQuestionIds = new Set(
  questions.map((q: any) => String(q.id))
);

const validMappings = initialMappings.filter((m) => {

  const q1Raw = Array.isArray(m.question_one)
    ? m.question_one.map(String)
    : String(m.question_one)
        .split(",")
        .map((x: string) => x.trim())
        .filter(Boolean);

  const q2Raw = Array.isArray(m.question_two)
    ? m.question_two.map(String)
    : String(m.question_two)
        .split(",")
        .map((x: string) => x.trim())
        .filter(Boolean);

  // remove mandatory/deleted questions
  const q1Filtered = q1Raw.filter(
    (id: string) =>
      existingQuestionIds.has(id) &&
      !mandatoryIds.has(id)
  );

  const q2Filtered = q2Raw.filter(
    (id: string) =>
      existingQuestionIds.has(id) &&
      !mandatoryIds.has(id)
  );

  // reject empty mappings
  if (
    q1Filtered.length === 0 ||
    q2Filtered.length === 0
  ) {
    return false;
  }

  // prevent self mapping
  const duplicate = q1Filtered.find((id: string) =>
    q2Filtered.includes(id)
  );

  if (duplicate) {
    return false;
  }

  // ERP marks validation
  const q1Marks = q1Filtered.reduce((sum: number, id: string) => {
    const q = questions.find(q => String(q.id) === id);
    return sum + (q ? Number(q.marks) : 0);
  }, 0);

  const q2Marks = q2Filtered.reduce((sum: number, id: string) => {
    const q = questions.find(q => String(q.id) === id);
    return sum + (q ? Number(q.marks) : 0);
  }, 0);

  return q1Marks === q2Marks;
});

        if (validMappings.length > 0) {
          let hadMandatory = false;
          currentMappings = validMappings.map((m) => {
            const q1Raw = Array.isArray(m.question_one)
              ? m.question_one.map(String)
              : String(m.question_one).split(",").filter(Boolean);
            
            const q2Raw = Array.isArray(m.question_two)
              ? m.question_two.map(String)
              : String(m.question_two).split(",").filter(Boolean);

            // Filter out mandatory questions if they somehow got in
            const q1Filtered = q1Raw.filter((id: string) => !mandatoryIds.has(id));
            const q2Filtered = q2Raw.filter((id: string) => !mandatoryIds.has(id));

            if (q1Filtered.length !== q1Raw.length || q2Filtered.length !== q2Raw.length) {
              hadMandatory = true;
            }

            return {
              question_one: q1Filtered,
              question_two: q2Filtered,
              or_type: m.or_type || 0,
            };
          });

          if (hadMandatory) {
            toast.warn("Mandatory questions were removed from existing mappings.");
          }
        } else {
          currentMappings = [{ question_one: [], question_two: [], or_type: 0 }];
        }
      } else {
        currentMappings = [{ question_one: [], question_two: [], or_type: 0 }];
      }
      setMappings(currentMappings);
    }
  }, [isOpen, initialMappings, mandatoryIds]);

  const handleAddMapping = () => {
    setMappings([...mappings, { question_one: [], question_two: [], or_type: 0 }]);
  };

  const handleRemoveMapping = (index: number) => {
    setMappings(mappings.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, field: keyof OrMappingRow, value: any) => {
    const updated = [...mappings];
    const currentRow = { ...updated[index], [field]: value };
    
    // Clear previous errors for this row
    currentRow.errors = { ...currentRow.errors, [field]: undefined, general: undefined };

    // Real-time validation for the current row
    const q1Marks = currentRow.question_one.reduce((sum, id) => {
      const q = questions.find(q => String(q.id) === id);
      return sum + (q ? Number(q.marks) : 0);
    }, 0);

    const q2Marks = currentRow.question_two.reduce((sum, id) => {
      const q = questions.find(q => String(q.id) === id);
      return sum + (q ? Number(q.marks) : 0);
    }, 0);

    if (currentRow.question_one.length > 0 && currentRow.question_two.length > 0) {
      if (q1Marks !== q2Marks) {
        currentRow.errors.general = `Marks mismatch: Set I (${q1Marks.toFixed(2)}) vs Set II (${q2Marks.toFixed(2)}). Both sides must have equal marks.`;
      }
    }

    updated[index] = currentRow;
    setMappings(updated);
  };

  const validateAndSave = () => {
    const updatedMappings = [...mappings];
    let hasErrors = false;

    if (updatedMappings.length === 0) {
      toast.error("Add at least one mapping or discard changes");
      return;
    }

    for (let i = 0; i < updatedMappings.length; i++) {
      const m = updatedMappings[i];
      const rowErrors: any = {};

      if (m.question_one.length === 0) {
        rowErrors.question_one = "Question Set I is required.";
        hasErrors = true;
      }
      if (m.question_two.length === 0) {
        rowErrors.question_two = "Question Set II is required.";
        hasErrors = true;
      }

      if (m.question_one.length > 0 && m.question_two.length > 0) {
        const q1Marks = m.question_one.reduce((sum, id) => {
          const q = questions.find(q => String(q.id) === id);
          return sum + (q ? Number(q.marks) : 0);
        }, 0);

        const q2Marks = m.question_two.reduce((sum, id) => {
          const q = questions.find(q => String(q.id) === id);
          return sum + (q ? Number(q.marks) : 0);
        }, 0);

        if (q1Marks !== q2Marks) {
          rowErrors.general = `Marks mismatch: ${q1Marks.toFixed(2)} vs ${q2Marks.toFixed(2)}. Sets must have equal total marks.`;
          hasErrors = true;
        }

        // Self mapping check (though filtered in UI, double check)
        const q1Set = new Set(m.question_one);
        const duplicate = m.question_two.find(id => q1Set.has(id));
        if (duplicate) {
          rowErrors.general = "A question cannot be mapped with itself.";
          hasErrors = true;
        }
      }

      updatedMappings[i] = { ...m, errors: rowErrors };
    }

    setMappings(updatedMappings);

    if (hasErrors) {
      toast.error("Please fix validation errors before saving.");
      return;
    }

    // Prepare data for backend (remove errors object)
    const finalMappings = updatedMappings.map(({ errors, ...rest }) => rest);
    onSave(finalMappings);
  };

  const getFilteredOptions = (index: number, field: 'question_one' | 'question_two') => {
    // 1. Get all IDs selected in OTHER rows
    const otherRowIds = new Set<string>();
    mappings.forEach((m, i) => {
      if (i !== index) {
        m.question_one.forEach(id => otherRowIds.add(id));
        m.question_two.forEach(id => otherRowIds.add(id));
      }
    });

    // 2. Filter out mandatory and other row selections
    let options = allQuestionOptions.filter(opt => !otherRowIds.has(opt.value));

    // 3. Handle same-row restrictions
    const currentMapping = mappings[index];
    const otherField = field === 'question_one' ? 'question_two' : 'question_one';
    const otherFieldSelections = currentMapping[otherField];
    const sameFieldSelections = currentMapping[field];

    // Self-mapping prevention (exclude what's in the OTHER set of the same row)
    const otherSetIds = new Set(otherFieldSelections);
    options = options.filter(opt => !otherSetIds.has(opt.value));

    // // Section/Type restriction
    // let targetUnitId: number | null = null;
    // if (sameFieldSelections.length > 0) {
    //   const firstId = sameFieldSelections[0];
    //   targetUnitId = questions.find(q => String(q.id) === firstId)?.unit_id || null;
    // } else if (otherFieldSelections.length > 0) {
    //   const firstId = otherFieldSelections[0];
    //   targetUnitId = questions.find(q => String(q.id) === firstId)?.unit_id || null;
    // }

    // if (targetUnitId !== null) {
    //   options = options.filter(opt => opt.unit_id === targetUnitId);
    // }

    return options;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white dark:bg-gray-900 w-full max-w-5xl max-h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-[#437880] px-6 py-4 flex items-center justify-between border-b border-white/10 shadow-lg">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <AlertCircle size={22} className="text-teal-100" />
            OR Questions Mapping
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded-full transition-colors text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-8 pt-6 pb-2">
          {/* Note Section */}
          <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/50 rounded-lg p-5 shadow-sm flex items-start gap-4">
            <div className="bg-blue-100 dark:bg-blue-900/40 p-2 rounded-full text-blue-600 dark:text-blue-400">
              <AlertCircle size={20} />
            </div>
            <div>
              <p className="text-sm text-blue-900 dark:text-blue-200 font-semibold mb-1">
                Important Requirement:
              </p>
              <p className="text-sm text-blue-800/80 dark:text-blue-300/80 leading-relaxed">
                Mandatory questions are not allowed to be mapped with the OR option. 
                <br />
                Mandatory questions are: <span className="font-bold text-blue-900 dark:text-blue-100 underline decoration-blue-300 underline-offset-2">{mandatoryLabels}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar pt-2">
          <div className="flex items-center justify-end border-b border-gray-100 dark:border-gray-800 pb-4">
            <button
              onClick={handleAddMapping}
              className="px-5 py-2 text-sm font-bold text-white bg-[#437880] hover:bg-[#366168] rounded-md shadow-md transition-all flex items-center gap-2 active:scale-95"
            >
              <Plus size={18} />
              Add more rows
            </button>
          </div>

          <div className="space-y-6">
            {mappings.length === 0 ? (
              <div className="border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl p-16 text-center bg-gray-50/30">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                   <Plus size={32} />
                </div>
                <p className="text-gray-500 dark:text-gray-400 mb-6 text-lg font-medium">
                  No Choice mappings defined yet.
                </p>
                <button
                  onClick={handleAddMapping}
                  className="px-6 py-2 border-2 border-[#437880] text-[#437880] font-bold rounded-lg hover:bg-[#437880] hover:text-white transition-all"
                >
                  Create Your First Mapping
                </button>
              </div>
            ) : (
              mappings.map((mapping, index) => (
                <div
                  key={index}
                  className={`group relative border ${mapping.errors?.general ? 'border-red-300 bg-red-50/10' : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50'} rounded-xl p-6 hover:shadow-lg transition-all duration-300`}
                >
                  <div className={`absolute -left-[1px] top-8 w-1.5 h-16 ${mapping.errors?.general ? 'bg-red-500' : 'bg-[#437880]'} rounded-r-lg opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                  
                  <div className="flex items-start gap-6">
                    <div className="bg-gray-100 dark:bg-gray-800 w-10 h-10 rounded-full flex items-center justify-center text-sm font-black text-[#437880] shadow-inner mt-6 flex-shrink-0">
                      {String(index + 1).padStart(2, '0')}
                    </div>
                    
                    <div className="flex-1 flex flex-col gap-4">
                      <div className="flex items-center gap-6">
                        {/* Question Set - I */}
                        <div className="flex-1 space-y-2">
                          <label className="text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2 ml-1">
                            <span className="w-2 h-2 rounded-full bg-blue-500 shadow-sm shadow-blue-200"></span>
                            Question Set - I
                          </label>
                          <MultiSelect
                            label=""
                            options={getFilteredOptions(index, 'question_one')}
                            value={mapping.question_one}
                            onChange={(vals: string[]) => handleChange(index, "question_one", vals)}
                            placeholder="Select questions..."
                            className="min-h-[44px]"
                            isMulti
                          />
                          {mapping.errors?.question_one && (
                            <p className="text-[11px] text-red-500 font-bold mt-1 ml-1 flex items-center gap-1">
                              <AlertCircle size={12} /> {mapping.errors.question_one}
                            </p>
                          )}
                        </div>

                        {/* OR Separator */}
                        <div className="flex flex-col items-center justify-center pt-8 px-2 flex-shrink-0">
                          <div className="w-[1px] h-4 bg-gray-200 dark:bg-gray-700 mb-2"></div>
                          <span className="text-[10px] font-black text-[#437880] bg-[#437880]/10 px-2 py-1 rounded-md tracking-tighter">OR</span>
                          <div className="w-[1px] h-4 bg-gray-200 dark:bg-gray-700 mt-2"></div>
                        </div>

                        {/* Question Set - II */}
                        <div className="flex-1 space-y-2">
                          <label className="text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2 ml-1">
                            <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-sm shadow-indigo-200"></span>
                            Question Set - II
                          </label>
                          <MultiSelect
                            label=""
                            options={getFilteredOptions(index, 'question_two')}
                            value={mapping.question_two}
                            onChange={(vals: string[]) => handleChange(index, "question_two", vals)}
                            placeholder="Select questions..."
                            className="min-h-[44px]"
                            isMulti
                          />
                          {mapping.errors?.question_two && (
                            <p className="text-[11px] text-red-500 font-bold mt-1 ml-1 flex items-center gap-1">
                              <AlertCircle size={12} /> {mapping.errors.question_two}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Row-level Error Message */}
                      {mapping.errors?.general && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50 rounded-lg p-3 flex items-center gap-2 text-xs text-red-700 dark:text-red-400 font-bold animate-in slide-in-from-top-1 duration-200">
                          <AlertCircle size={14} className="flex-shrink-0" />
                          {mapping.errors.general}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleRemoveMapping(index)}
                      className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all mt-8"
                      title="Remove Choice Row"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 bg-gray-50/90 dark:bg-gray-800/90 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="text-xs text-gray-500 font-medium italic">
            * All Choice Sets must have equal total marks to maintain question paper balance.
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="px-6 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-all flex items-center gap-2 active:scale-95 shadow-md"
            >
              <RotateCcw size={18} />
              Cancel
            </button>
            <button
              onClick={validateAndSave}
              className="px-8 py-2.5 text-sm font-bold text-white bg-[#437880] hover:bg-[#366168] rounded-lg shadow-lg hover:shadow-[#437880]/40 transition-all flex items-center gap-2 active:scale-95"
            >
              <Save size={18} />
              Confirm & Save Mappings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default OrMappingModal;

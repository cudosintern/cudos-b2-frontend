import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { manageMteService } from "./manageMteService";
import { toast } from "react-toastify";

interface SectionPart {
  id: string;
  name: string;
  numberOfQuestions: string;
  maxMarks: string;
}

const CreateMteQpPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const stateAny: any = location.state || {};
  const course = stateAny.course || null;
  const filters = stateAny.filters || {};
  // ao_id may be passed directly or from the course/occasion context
  const aoId: number | undefined = stateAny.ao_id || course?.ao_id || undefined;
  const [sections, setSections] = useState<SectionPart[]>([]);
  const [title, setTitle] = useState<string>("");
  const [duration, setDuration] = useState<string>("02:00");
  const [maximumMarks, setMaximumMarks] = useState<number | "">(100);
  const [grandTotal, setGrandTotal] = useState<number | "">(100);
  const [note, setNote] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [showErrors, setShowErrors] = useState(false);

  // Display strings derived from navigation state
  const displayCurriculum = filters?.academic_batch_code || filters?.curriculum_name || filters?.pgm_title || stateAny.academic_batch_code || "N/A";
  const displayTerm = filters?.term_name || filters?.term || stateAny.term_name || "N/A";
  const displayCourse = course?.crs_title || course?.crs_name || course?.qpd_title || stateAny.crs_title || "N/A";

  const handleAddSection = () => {
    setSections([
      ...sections,
      { id: Math.random().toString(36).substring(7), name: "", numberOfQuestions: "", maxMarks: "" },
    ]);
  };

  const handleRemoveSection = (id: string) => {
    setSections(sections.filter((s) => s.id !== id));
  };

  const handleSectionChange = (id: string, field: keyof SectionPart, value: string) => {
    setSections(sections.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const validate = () => {
    const newErrors: any = {};
    const positiveNumericRegex = /^[1-9]\d*$/;
    const durationRegex = /^([0-9]{1,2}):([0-5][0-9])$/;

    if (!title?.trim()) newErrors.title = "This field is required.";
    if (!duration?.trim()) {
      newErrors.duration = "This field is required.";
    } else if (!durationRegex.test(duration)) {
      newErrors.duration = "Invalid format (HH:MM).";
    }

    if (maximumMarks === "" || maximumMarks === null) {
      newErrors.maximumMarks = "This field is required.";
    }
    if (grandTotal === "" || grandTotal === null) {
      newErrors.grandTotal = "This field is required.";
    }

    // if (maximumMarks !== "" && grandTotal !== "" && Number(maximumMarks) !== Number(grandTotal)) {
    //   newErrors.grandTotal = "Grand Total must match Maximum Marks.";
    // }
   
    // Grand Total can be greater than Maximum Marks.
// No strict equality validation required.
if (
  maximumMarks !== "" &&
  grandTotal !== "" &&
  Number(grandTotal) < Number(maximumMarks)
) {
  newErrors.grandTotal =
    "Grand Total should be greater than or equal to Maximum Marks.";
}
    const sectionErrors: Record<string, any> = {};
    let sumMaxMarks = 0;
    sections.forEach((s) => {
      const errs: any = {};
      if (!s.name?.trim()) errs.name = "This field is required.";
      if (!s.numberOfQuestions?.toString().trim()) errs.numberOfQuestions = "This field is required.";
      if (!s.maxMarks?.toString().trim()) {
        errs.maxMarks = "This field is required.";
      } else {
        sumMaxMarks += Number(s.maxMarks);
      }
      if (Object.keys(errs).length > 0) sectionErrors[s.id] = errs;
    });

    if (Object.keys(sectionErrors).length > 0) newErrors.sectionErrors = sectionErrors;

    // if (maximumMarks !== "" && sumMaxMarks > Number(maximumMarks)) {
    //   newErrors.sectionsSum = "Sum of Section Marks cannot exceed Maximum Marks.";
    // } else if (sumMaxMarks !== Number(grandTotal)) {
    //   newErrors.sectionsSum = "Total unit marks is not matching the grand total";
    // }

    // Total Unit Marks can be greater than Maximum Marks.
// Only validate that Unit Total is not less than Maximum Marks.
// Total Unit Marks must match Grand Total
if (
  grandTotal !== "" &&
  sumMaxMarks !== Number(grandTotal)
) {
  newErrors.sectionsSum =
    "Total Unit Marks must match Grand Total.";
}

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    validate();
  }, [title, duration, maximumMarks, grandTotal, sections]);

  return (
    <div className="p-6 bg-[#f4f7f9] min-h-screen">
      <div className="bg-white rounded-xl shadow-sm p-6 max-w-7xl mx-auto">
        <h3 className="text-xl leading-6 font-medium text-gray-900 border-b pb-4 mb-6">
          Create New MTE Question Paper
        </h3>

        {/* Header Section */}
        <div className="mb-8">
          <h4 className="text-md font-semibold text-gray-700 mb-4">Curriculum Details</h4>
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1">
              <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Curriculum</span>
              <p className="text-sm font-medium text-gray-900">{displayCurriculum}</p>
            </div>
            <div className="flex-1">
              <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Term</span>
              <p className="text-sm font-medium text-gray-900">{displayTerm}</p>
            </div>
            <div className="flex-1">
              <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Course</span>
              <p className="text-sm font-medium text-gray-900">{displayCourse}</p>
            </div>
          </div>
        </div>

        <div className="border hover:border-blue-300 transition-colors duration-200 rounded-lg p-5 mb-8 bg-gray-50/50">
          <h4 className="text-md font-semibold text-gray-700 mb-4 border-b pb-2">Add MTE Framework</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-[13px] font-semibold text-[#5c6773] mb-1">Question Paper Title <span className="text-red-500">*</span></label>
              <input
                type="text"
                placeholder="Enter title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (errors.title) setErrors((prev: any) => { const { title, ...rest } = prev; return rest; });
                }}
                className={`w-full px-3 py-2 text-sm border ${showErrors && errors.title ? "border-red-500" : "border-gray-300"} rounded-md focus:outline-none focus:ring-2 focus:ring-[#437880]`}
              />
              {showErrors && errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-[#5c6773] mb-1">Total Duration (H:M) <span className="text-red-500">*</span></label>
              <input
                type="text"
                placeholder="02:00"
                value={duration}
                onChange={(e) => {
                  setDuration(e.target.value);
                  if (errors.duration) setErrors((prev: any) => { const { duration, ...rest } = prev; return rest; });
                }}
                className={`w-full px-3 py-2 text-sm border ${showErrors && errors.duration ? "border-red-500" : "border-gray-300"} rounded-md focus:outline-none focus:ring-2 focus:ring-[#437880]`}
              />
              {showErrors && errors.duration && <p className="text-xs text-red-500 mt-1">{errors.duration}</p>}
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-[#5c6773] mb-1">Course</label>
              <input type="text" value={displayCourse} readOnly className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-gray-100 text-gray-500 focus:outline-none cursor-not-allowed" />
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-[#5c6773] mb-1">Maximum Marks <span className="text-red-500">*</span></label>
              <input
                type="text"
                placeholder="e.g. 100"
                value={maximumMarks}
                onChange={(e) => {
                  const val = e.target.value;
                  // Allow empty or numeric
                  if (val === "" || /^\d*$/.test(val)) {
                    setMaximumMarks(val === "" ? "" : Number(val));
                    if (errors.maximumMarks) setErrors((prev: any) => { const { maximumMarks, ...rest } = prev; return rest; });
                  }
                }}
                className={`w-full px-3 py-2 text-sm border ${showErrors && errors.maximumMarks ? "border-red-500" : "border-gray-300"} rounded-md focus:outline-none focus:ring-2 focus:ring-[#437880]`}
              />
              {showErrors && errors.maximumMarks && <p className="text-xs text-red-500 mt-1">{errors.maximumMarks}</p>}
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-[#5c6773] mb-1">Grand Total</label>
              <input
                type="text"
                placeholder="0"
                value={grandTotal}
                onChange={(e) => {
                  const val = e.target.value;
                  // Allow empty or numeric
                  if (val === "" || /^\d*$/.test(val)) {
                    setGrandTotal(val === "" ? "" : Number(val));
                    if (errors.grandTotal) setErrors((prev: any) => { const { grandTotal, ...rest } = prev; return rest; });
                    if (errors.sectionsSum) setErrors((prev: any) => { const { sectionsSum, ...rest } = prev; return rest; });
                  }
                }}
                className={`w-full px-3 py-2 text-sm border ${showErrors && errors.grandTotal ? "border-red-500" : "border-gray-300"} rounded-md focus:outline-none focus:ring-2 focus:ring-[#437880]`}
              />
              {showErrors && errors.grandTotal && <p className="text-xs text-red-500 mt-1">{errors.grandTotal}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-[13px] font-semibold text-[#5c6773] mb-1">Note</label>
              <textarea rows={3} placeholder="Add any specific instructions or notes..." value={note} onChange={(e) => setNote(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"></textarea>
            </div>
          </div>
        </div>

        {/* Dynamic Section Builder */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-md font-semibold text-gray-700">Sections / Parts Structure</h4>
            <button type="button" onClick={handleAddSection} className="px-4 py-2 text-sm font-medium text-white button-bg rounded-md hover:opacity-90 focus:ring-2 focus:ring-blue-500 transition-colors flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
              Add Section / Parts (Units)
            </button>
          </div>

          <div className="space-y-4">
            {sections.length === 0 && (
              <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">No sections added yet. Click the button above to add a section.</div>
            )}
            {showErrors && (errors.sections || errors.sectionsSum) && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-md">
                {errors.sections && <p className="text-sm text-red-500">{errors.sections}</p>}
                {errors.sectionsSum && <p className="text-sm text-red-500">{errors.sectionsSum}</p>}
              </div>
            )}
            {sections.map((section, index) => (
              <div key={section.id} className="flex flex-col md:flex-row gap-4 items-start md:items-end bg-white p-4 rounded-lg border border-gray-200 shadow-sm relative group transition-all hover:shadow-md hover:border-gray-300">
                <div className="flex-1 w-full">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Section/Parts (Units) Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    placeholder={`e.g. Section ${String.fromCharCode(65 + index)}`}
                    value={section.name}
                    onChange={(e) => handleSectionChange(section.id, "name", e.target.value)}
                    className={`w-full px-3 py-2 text-sm border ${showErrors && errors.sectionErrors?.[section.id]?.name ? "border-red-500" : "border-gray-300"} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                  {showErrors && errors.sectionErrors?.[section.id]?.name && (<p className="text-xs text-red-500 mt-1">{errors.sectionErrors[section.id].name}</p>)}
                </div>
                <div className="flex-1 w-full">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Number of Questions <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    placeholder="Enter count"
                    value={section.numberOfQuestions}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "" || /^\d*$/.test(val)) {
                        handleSectionChange(section.id, "numberOfQuestions", val);
                      }
                    }}
                    className={`w-full px-3 py-2 text-sm border ${showErrors && errors.sectionErrors?.[section.id]?.numberOfQuestions ? "border-red-500" : "border-gray-300"} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                  {showErrors && errors.sectionErrors?.[section.id]?.numberOfQuestions && (<p className="text-xs text-red-500 mt-1">{errors.sectionErrors[section.id].numberOfQuestions}</p>)}
                </div>
                <div className="flex-1 w-full">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Section/Parts Max Marks <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    placeholder="Enter marks"
                    value={section.maxMarks}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "" || /^\d*$/.test(val)) {
                        handleSectionChange(section.id, "maxMarks", val);
                      }
                    }}
                    className={`w-full px-3 py-2 text-sm border ${showErrors && errors.sectionErrors?.[section.id]?.maxMarks ? "border-red-500" : "border-gray-300"} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                  {showErrors && errors.sectionErrors?.[section.id]?.maxMarks && (<p className="text-xs text-red-500 mt-1">{errors.sectionErrors[section.id].maxMarks}</p>)}
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveSection(section.id)}
                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-all self-end sm:mb-[2px]"
                  title="Remove Section"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t mt-8">
          <button type="button" onClick={() => navigate("/assessment/manage_mte_qp")} className="px-5 py-2 text-sm font-medium text-white bg-red-500 rounded-md transition-colors hover:bg-red-600 shadow-sm">Close</button>
          <button type="button" onClick={async () => {
            // Validate before attempting to save
            setShowErrors(true);
            if (!validate()) return;
            setSaving(true);
            try {
              const builtUnits = sections.map(s => ({
                unit_name: s.name || `Unit ${sections.indexOf(s) + 1}`,
                no_of_questions: Number(s.numberOfQuestions) || 1,
                unit_max_marks: Number(s.maxMarks) || Number(maximumMarks) || 0
              }));

              const unitsToSend = (builtUnits.length > 0) ? builtUnits : [{ unit_name: "Unit 1", no_of_questions: 1, unit_max_marks: Number(maximumMarks) || 100 }];

              // Ensure we send a valid course_code (backend looks up by crs_code)
              if (!course?.crs_code) {
                toast.error("Course code is missing. Ensure you selected a valid course before creating the framework.");
                setSaving(false);
                return;
              }

              const payload: any = {
                question_paper_title: title || `QP - ${course?.qpd_title || "New"}`,
                total_duration: duration,
                course_code: course?.crs_code,
                maximum_marks: Number(maximumMarks) || 100,
                grand_total: Number(grandTotal) || Number(maximumMarks) || 100,
                note,
                qpf_type: "MTE",
                units: unitsToSend,
                ...(aoId ? { ao_id: aoId } : {})  // include ao_id if available for qp_definition linkage
              };

              const res = await manageMteService.createMteFramework(payload);
              if (res.status === 1 && res.data && res.data.qpf_id) {
                toast.success("Created Successfully");
                navigate("/assessment/manage_mte_qp/details", {
                  state: {
                    qpf_id: res.data.qpf_id,
                    ao_id: aoId || res.data.ao_id,
                    qpd_id: res.data.qpd_id || course?.qpd_id,
                    course,
                    filters
                  }
                });
              } else {
                toast.error(res.message || "Failed to create framework");
              }
            } catch (err) {
              console.error(err);
              toast.error("Failed to create framework");
            } finally {
              setSaving(false);
            }
          }} disabled={saving || (showErrors && Object.keys(errors).length > 0)} className="px-5 py-2 text-sm font-medium text-white button-bg rounded-md transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed">{saving ? "Saving..." : "Save and Create QP"}</button>
        </div>
      </div>
    </div>
  );
};

export default CreateMteQpPage;

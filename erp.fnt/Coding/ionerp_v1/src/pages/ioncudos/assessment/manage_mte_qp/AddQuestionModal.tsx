import React, { useState, useEffect, useMemo } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Editor } from "@tinymce/tinymce-react";
import { FaTimes, FaSave } from "react-icons/fa";
import { manageMteService } from "./manageMteService";
import { toast } from "react-toastify";
import ImportQuestionModal from "./ImportQuestionModal";

interface AddQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (questionData: any, isEdit?: boolean) => void;
  mode: 'add' | 'edit';
  editingQuestion?: any | null;
  units: { id: string; name: string }[];
  qpfId?: number | null;
  courseId?: number;
  batchId?: number;
  termId?: number;
  questions?: any[];
  sections?: any[];
  maxMarks?: number | "";
  grandTotal?: number | "";
  curriculumName?: string;
  termName?: string;
}

const AddQuestionModal: React.FC<AddQuestionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  mode,
  editingQuestion,
  units,
  qpfId,
  courseId,
  batchId,
  termId,
  questions = [],
  sections = [],
  maxMarks = 0,
  grandTotal = 0,
  curriculumName = "N/A",
  termName = "N/A"
}) => {
  const [formData, setFormData] = useState({
    unitId: "",
    mainQNo: "",
    subQNo: "",
    coId: "",
    bloomId: "",
    marks: "",
    content: "",
    is_mandatory: false,
  });

  const [bloomLevels, setBloomLevels] = useState<any[]>([]);
  const [courseOutcomes, setCourseOutcomes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [noCOsMessage, setNoCOsMessage] = useState("");
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showErrors, setShowErrors] = useState(mode === "edit");

  useEffect(() => {
    if (isOpen) {
      fetchMetadata();
      setShowErrors(mode === "edit");
      if (mode === 'edit' && editingQuestion) {
        const isMandatoryVal = editingQuestion.is_mandatory ?? editingQuestion.isMandatory ?? editingQuestion.mandatory ?? editingQuestion.is_mandatory_flag ?? 0;
        setFormData({
          unitId: String(editingQuestion.unit_id ?? editingQuestion.qpf_unit_id ?? ""),
          mainQNo: String(editingQuestion.main_question_no ?? ""),
          subQNo: String(editingQuestion.sub_question_no ?? ""),
          coId: String(editingQuestion.rawCoId ?? editingQuestion.course_outcome_id ?? ""),
          bloomId: String(editingQuestion.rawBloomId ?? editingQuestion.bloom_level_id ?? ""),
          marks: String(editingQuestion.marks ?? ""),
          content: editingQuestion.question || editingQuestion.question_text || "",
          is_mandatory: Number(isMandatoryVal) === 1 || isMandatoryVal === true || String(isMandatoryVal).toLowerCase() === 'true',
        });
      } else {
        setFormData({
          unitId: "",
          mainQNo: "",
          subQNo: "",
          coId: "",
          bloomId: "",
          marks: "",
          content: "",
          is_mandatory: false,
        });
      }
      setErrors({});
    }
  }, [isOpen, mode, editingQuestion]);

  const fetchMetadata = async () => {
    try {
      const [bRes, cRes] = await Promise.all([
        manageMteService.getBloomLevels(),
        (courseId && batchId && termId) ? manageMteService.getCOs(courseId, batchId, termId) : Promise.resolve({ status: 1, data: [] })
      ]);
      if (bRes.status === 1) setBloomLevels(bRes.data);
      if (cRes.status === 1) {
        setCourseOutcomes(cRes.data);
        if (cRes.data.length === 0 && courseId && batchId && termId) {
          setNoCOsMessage("No Course Outcomes defined for this course yet");
        } else {
          setNoCOsMessage("");
        }
      }
    } catch (error) {
      console.error("Error fetching metadata", error);
    }
  };

  const stats = useMemo(() => {
    const currentMarks = Number(formData.marks) || 0;
    const currentUnitId = Number(formData.unitId);
    
    const otherQuestions = questions.filter(q => 
      mode === 'edit' && editingQuestion 
        ? q.id !== editingQuestion.id.toString() 
        : true
    );

    const unitAccumulated = otherQuestions
      .filter(q => Number(q.unit_id) === currentUnitId)
      .reduce((acc, q) => acc + (Number(q.marks) || 0), 0);

    const totalAccumulated = otherQuestions
      .reduce((acc, q) => acc + (Number(q.marks) || 0), 0);

    const unitMax = Number(sections.find(s => Number(s.id) === currentUnitId)?.maxMarks) || 0;

    return {
      unitConsumed: unitAccumulated + currentMarks,
      unitMax,
      totalConsumed: totalAccumulated + currentMarks,
      totalMax: Number(grandTotal) || 0
    };
  }, [formData.marks, formData.unitId, questions, sections, grandTotal, mode, editingQuestion]);

  const validate = (data = formData, isSilent = false): boolean => {
    const newErrors: any = {};
    if (!data.unitId) newErrors.unitId = "This field is required.";
    if (!data.mainQNo) newErrors.mainQNo = "This field is required.";
    if (!data.subQNo) newErrors.subQNo = "This field is required.";

    const consumed = stats;
    if (data.marks && !isNaN(Number(data.marks))) {
      const m = Number(data.marks);
      if (consumed.unitMax > 0 && consumed.unitConsumed > consumed.unitMax) {
        newErrors.marks = "Marks exceed the Unit/Section limit.";
      }
    } else {
      newErrors.marks = "This field is required.";
    }

    if (!data.content || data.content.replace(/<[^>]*>/g, "").trim() === "") {
      newErrors.content = "Question content is required.";
    }

    if (!data.coId) newErrors.coId = "This field is required.";

    if (data.unitId && data.mainQNo && data.subQNo) {
      const isDuplicate = questions.some(q => {
        if (mode === 'edit' && editingQuestion && q.id === editingQuestion.id.toString()) return false;
        return (
          Number(q.unit_id) === Number(data.unitId) &&
          Number(q.main_question_no) === Number(data.mainQNo) &&
          (q.sub_question_no || "").toString().toLowerCase() === (data.subQNo || "").toString().toLowerCase()
        );
      });
      if (isDuplicate) {
        newErrors.mainQNo = "Duplicate question combination.";
        if (!isSilent) toast.error("This question number combination already exists in the selected unit.");
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    if (isOpen) {
      validate(formData, true);
    }
  }, [formData, stats, isOpen]);

  const displayQuestionNo = useMemo(() => {
    const unit = units.find(u => u.id === formData.unitId);
    if (unit && formData.mainQNo) {
      let qNo = `${unit.name}-Q${formData.mainQNo}`;
      if (formData.subQNo) qNo += `.${formData.subQNo}`;
      return qNo;
    }
    return "—";
  }, [formData.unitId, formData.mainQNo, formData.subQNo, units]);

  const handleImportQuestion = (q: any) => {
    const updated = {
      ...formData,
      content: q.question_text || q.question || "",
      marks: q.marks?.toString() || "",
      coId: q.course_outcome_id?.toString() || q.rawCoId?.toString() || "",
      bloomId: q.bloom_level_id?.toString() || q.rawBloomId?.toString() || "",
    };
    setFormData(updated);
  };

  const handleSave = async () => {
    setShowErrors(true);
    if (validate(formData, false)) {
      if (qpfId && formData.unitId) {
        setLoading(true);
        try {
          const unit = units.find(u => u.id === formData.unitId);
          const isEditMode = mode === 'edit' && editingQuestion;
          
          const payload: any = {
            qpf_id: qpfId,
            qpf_unit_id: Number(formData.unitId),
            unit_name: unit?.name || "",
            main_question_no: Number(formData.mainQNo),
            question_text: formData.content,
            marks: Number(formData.marks),
            is_mandatory: formData.is_mandatory ? 1 : 0,
            mandatory: formData.is_mandatory ? 1 : 0,
          };

          if (formData.subQNo) payload.sub_question_no = formData.subQNo;
          if (formData.coId) payload.course_outcome_id = Number(formData.coId);
          if (formData.bloomId) payload.bloom_level_id = Number(formData.bloomId);

          if (isEditMode) {
            payload.qpf_mq_id = Number(editingQuestion.id || editingQuestion.qpf_mq_id);
          }

          const res = await (isEditMode 
            ? manageMteService.editMteQuestion(qpfId, Number(formData.unitId), payload)
            : manageMteService.addQuestion(qpfId, Number(formData.unitId), payload)
          );

          if (res.status === 1) {
             toast.success(res.message || (isEditMode ? "Question updated" : "Question added"));
             onSave(res.data || payload, isEditMode);
             onClose();
          } else {
             toast.error(res.message || "Failed to save question");
          }
        } catch (error: any) {
          toast.error(error?.response?.data?.message || "An unexpected error occurred.");
        } finally {
          setLoading(false);
        }
      }
    }
  };

  const isSaveDisabled = loading;

  return (
    <Transition show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="fixed inset-0 z-[110] overflow-y-auto" onClose={onClose}>
        <div className="min-h-screen px-4 text-center">
          <Transition.Child as={React.Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black opacity-50" />
          </Transition.Child>
          <span className="inline-block h-screen align-middle" aria-hidden="true">&#8203;</span>
          <Transition.Child as={React.Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
            <div className="inline-block w-full max-w-4xl overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl relative">
              <div className="bg-white px-6 py-4 flex justify-between items-center border-b border-gray-200">
                <Dialog.Title as="h3" className="text-xl font-bold text-gray-800">
                  {mode === 'edit' ? 'Edit' : 'Add'} Question
                </Dialog.Title>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-full">
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  <div className="flex flex-col gap-1">
                    <label className="text-[13px] font-semibold text-[#5c6773]">Section / Parts (Units) <span className="text-red-500">*</span></label>
                    <select
                      value={formData.unitId}
                      onChange={(e) => setFormData({ ...formData, unitId: e.target.value })}
                      className={`w-full px-3 py-2 text-sm border ${showErrors && errors.unitId ? "border-red-500" : "border-gray-300"} rounded-md focus:outline-none focus:ring-2 focus:ring-[#437880]`}
                    >
                      <option value="">Select Unit</option>
                      {units.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                    {showErrors && errors.unitId && <p className="text-xs text-red-500 mt-1">{errors.unitId}</p>}
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[13px] font-semibold text-[#5c6773]">Main Q.No. <span className="text-red-500">*</span></label>
                    <select
                      value={formData.mainQNo}
                      onChange={(e) => setFormData({ ...formData, mainQNo: e.target.value })}
                      className={`w-full px-3 py-2 text-sm border ${showErrors && errors.mainQNo ? "border-red-500" : "border-gray-300"} rounded-md focus:outline-none focus:ring-2 focus:ring-[#437880]`}
                    >
                      <option value="">Select</option>
                      {["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"].map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                    {showErrors && errors.mainQNo && <p className="text-xs text-red-500 mt-1">{errors.mainQNo}</p>}
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[13px] font-semibold text-[#5c6773]">Sub Q.No. <span className="text-red-500">*</span></label>
                    <select
                      value={formData.subQNo}
                      onChange={(e) => setFormData({ ...formData, subQNo: e.target.value })}
                      className={`w-full px-3 py-2 text-sm border ${showErrors && errors.subQNo ? "border-red-500" : "border-gray-300"} rounded-md focus:outline-none focus:ring-2 focus:ring-[#437880]`}
                    >
                      <option value="">Select</option>
                      {["a", "b", "c", "d", "e", "f", "i", "ii", "iii", "iv", "v"].map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                    {showErrors && errors.subQNo && <p className="text-xs text-red-500 mt-1">{errors.subQNo}</p>}
                  </div>
                  <div className="pt-6 text-right">
                    <button type="button" onClick={() => setIsImportModalOpen(true)} className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors flex items-center gap-2 ml-auto shadow-sm">
                      Import Question
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-4 space-y-4">
                    <div className="flex items-center gap-2">
                       <input 
                         type="checkbox" 
                         id="mandatory" 
                         checked={!!formData.is_mandatory} 
                         onChange={(e) => setFormData({ ...formData, is_mandatory: e.target.checked })} 
                         className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-[#437880]" 
                       />
                       <label htmlFor="mandatory" className="text-[13px] font-semibold text-[#5c6773] cursor-pointer">
                         Mandatory
                       </label>
                    </div>
                    <div>
                      <label className="block text-[13px] font-semibold text-[#5c6773] mb-1">Question No.</label>
                      <input type="text" value={displayQuestionNo} readOnly className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-gray-100 text-gray-500 cursor-not-allowed" />
                    </div>
                    <div>
                      <label className="block text-[13px] font-semibold text-[#5c6773] mb-1">Course Outcome <span className="text-red-500">*</span></label>
                      <select value={formData.coId} onChange={(e) => setFormData({ ...formData, coId: e.target.value })} className={`w-full px-3 py-2 text-sm border ${showErrors && errors.coId ? "border-red-500" : "border-gray-300"} rounded-md focus:outline-none focus:ring-2 focus:ring-[#437880]`}>
                        <option value="">{noCOsMessage || "Select CO"}</option>
                        {courseOutcomes.map((co) => <option key={co.clo_id || co.co_id} value={co.clo_id || co.co_id}>{co.clo_code || co.co_code}</option>)}
                      </select>
                      {showErrors && errors.coId && <p className="text-xs text-red-500 mt-1">{errors.coId}</p>}
                    </div>
                    <div>
                      <label className="block text-[13px] font-semibold text-[#5c6773] mb-1">Bloom's Level</label>
                      <select value={formData.bloomId} onChange={(e) => setFormData({ ...formData, bloomId: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#437880]">
                        <option value="">Select Level</option>
                        {bloomLevels.map((l) => <option key={l.bloom_level_id} value={l.bloom_level_id}>{l.bloom_level}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[13px] font-semibold text-[#5c6773] mb-1">Marks <span className="text-red-500">*</span></label>
                      <input type="number" min="1" value={formData.marks} onChange={(e) => setFormData({ ...formData, marks: e.target.value })} placeholder="Enter marks" className={`w-full px-3 py-2 text-sm border ${showErrors && errors.marks ? "border-red-500" : "border-gray-300"} rounded-md focus:outline-none focus:ring-2 focus:ring-[#437880]`} />
                      {showErrors && errors.marks && <p className="text-xs text-red-500 mt-1">{errors.marks}</p>}
                    </div>
                  </div>
                  <div className="lg:col-span-8 flex flex-col gap-2">
                    <label className="text-sm font-bold text-gray-700 uppercase tracking-tight">Enter Question in below textarea : <span className="text-red-500">*</span></label>
                    <div className={`border ${showErrors && errors.content ? "border-red-500" : "border-gray-300"} rounded-md overflow-hidden bg-white`}>
                       <Editor apiKey="no-api-key" tinymceScriptSrc="/tinymce/tinymce.min.js" value={formData.content} onEditorChange={(content) => setFormData(prev => ({ ...prev, content }))} init={{ height: 400, menubar: "file edit insert view format table tools", plugins: ["advlist", "autolink", "lists", "link", "image", "charmap", "preview", "anchor", "searchreplace", "visualblocks", "code", "fullscreen", "insertdatetime", "media", "table", "wordcount"], toolbar: "undo redo | formatselect | bold italic underline | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image table | code fullscreen", branding: false, promotion: false, statusbar: true, resize: true }} />
                    </div>
                    {showErrors && errors.content && <p className="text-xs text-red-500 mt-1">{errors.content}</p>}
                  </div>
                </div>
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mt-4 pt-6 border-t border-gray-200">
                  <div className="flex gap-8">
                     <div>
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Section / Parts (Units) Marks</span>
                        <p className={`text-lg font-bold ${stats.unitConsumed > stats.unitMax ? "text-red-600" : "text-gray-800"}`}>{stats.unitConsumed} / {stats.unitMax}</p>
                     </div>
                     <div>
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Grand Total Marks</span>
                        <p className={`text-lg font-bold ${stats.totalConsumed > stats.totalMax ? "text-red-600" : "text-gray-800"}`}>{stats.totalConsumed} / {stats.totalMax}</p>
                     </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={handleSave} disabled={isSaveDisabled} className="px-6 py-2 button-bg text-white rounded-md text-sm font-bold hover:shadow-md transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                      <FaSave /> {loading ? "Saving..." : "Save"}
                    </button>
                    <button onClick={onClose} className="px-6 py-2 bg-red-500 text-white rounded-md text-sm font-bold hover:bg-red-600 transition-all shadow-md flex items-center gap-2">
                      <FaTimes /> Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
      <ImportQuestionModal
         isOpen={isImportModalOpen}
         onClose={() => setIsImportModalOpen(false)}
         onImport={handleImportQuestion}
         courseId={courseId}
         curriculumName={curriculumName}
         termName={termName}
       />
    </Transition>
  );
};

export default AddQuestionModal;

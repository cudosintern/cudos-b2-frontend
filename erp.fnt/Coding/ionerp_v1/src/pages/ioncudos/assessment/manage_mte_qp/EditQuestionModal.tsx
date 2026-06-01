import React, { useState, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Editor } from "@tinymce/tinymce-react";
import { FaTimes, FaSave } from "react-icons/fa";
import { manageMteService } from "./manageMteService";
import { toast } from "react-toastify";
import ImportQuestionModal from "./ImportQuestionModal";

interface Question {
  id: string;
  question: string;
  cos: string;
  rawCoId?: number;
  blooms: string;
  rawBloomId?: number;
  marks: number;
}

interface EditQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (questionData: any, isEdit?: boolean) => void;
  mode: 'add' | 'edit';
  editingQuestion?: Question | null;
  units: { id: string; name: string }[];
  qpfId?: number | null;
  courseId?: number;
  batchId?: number;
  termId?: number;
  coMap: Record<number, string>;
  bloomMap: Record<number, string>;
}

const EditQuestionModal: React.FC<EditQuestionModalProps> = ({
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
  coMap,
  bloomMap
}) => {
  const [formData, setFormData] = useState({
    unitId: "",
    mainQNo: "",
    subQNo: "",
    isMandatory: true,
    questionNo: "", 
    coId: "",
    bloomId: "",
    marks: "",
    content: "",
  });

  const [bloomLevels, setBloomLevels] = useState<any[]>([]);
  const [courseOutcomes, setCourseOutcomes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [noCOsMessage, setNoCOsMessage] = useState("");
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchMetadata();
      if (mode === 'edit' && editingQuestion) {
        // Prefill for edit
        const unitId = units.find(u => u.name === editingQuestion?.cos.split(' ')[0])?.id || "";
        setFormData({
          unitId,
          mainQNo: "1", // Default - derive from questionNo if possible
          subQNo: "",
          isMandatory: true,
          questionNo: editingQuestion.question.substring(0, 10), 
          coId: editingQuestion.rawCoId?.toString() || "",
          bloomId: editingQuestion.rawBloomId?.toString() || "",
          marks: editingQuestion.marks.toString(),
          content: editingQuestion.question,
        });
      } else {
        // Reset for add
        setFormData({
          unitId: "",
          mainQNo: "",
          subQNo: "",
          isMandatory: true,
          questionNo: "", 
          coId: "",
          bloomId: "",
          marks: "",
          content: "",
        });
      }
    }
  }, [isOpen, mode, editingQuestion, units]);

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

  // Auto-generate question number
  useEffect(() => {
    const unit = units.find(u => u.id === formData.unitId);
    if (unit && formData.mainQNo) {
      let qNo = `${unit.name}-Q${formData.mainQNo}`;
      if (formData.subQNo) qNo += `.${formData.subQNo}`;
      setFormData(prev => ({ ...prev, questionNo: qNo }));
    }
  }, [formData.unitId, formData.mainQNo, formData.subQNo, units]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.unitId) newErrors.unitId = "This field is required";
    if (!formData.mainQNo) newErrors.mainQNo = "This field is required";
    if (!formData.content.trim()) newErrors.content = "Question content required";
    if (!formData.marks || Number(formData.marks) <= 0) newErrors.marks = "Valid marks required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImportQuestion = (q: any) => {
    setFormData({
      ...formData,
      content: q.question_text || q.question || "",
      marks: q.marks?.toString() || "",
      coId: q.course_outcome_id?.toString() || q.rawCoId?.toString() || "",
      bloomId: q.bloom_level_id?.toString() || q.rawBloomId?.toString() || "",
    });
    toast.info("Question imported successfully");
  };

  const handleSave = async () => {
    if (validate() && qpfId && formData.unitId) {
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
          is_mandatory: formData.isMandatory ? 1 : 0
        };

        if (formData.subQNo) payload.sub_question_no = formData.subQNo;
        if (formData.coId) payload.course_outcome_id = Number(formData.coId);
        if (formData.bloomId) payload.bloom_level_id = Number(formData.bloomId);
        
        if (isEditMode) {
          payload.qpf_mq_id = Number(editingQuestion!.id);
        }

        console.log(`${isEditMode ? 'Edit' : 'Add'} payload:`, payload);

        const res = await (isEditMode 
          ? manageMteService.editMteQuestion(qpfId, Number(formData.unitId), payload)
          : manageMteService.addQuestion(qpfId, Number(formData.unitId), payload)
        );

        if (res.status === 1) {
          toast.success(res.message || (isEditMode ? "Updated" : "Added") + " successfully");
          if (res.data?.warning) {
            const unwantedMsg = "Bloom's Level A1 selected is not relevant/incorrect for the defined Question";
            if (!res.data.warning.includes(unwantedMsg)) {
               toast.warning(res.data.warning);
            }
          }
          onSave(payload, !!isEditMode);
          onClose();
        }
      } catch (error) {
        toast.error("Failed to save question");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Transition show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="fixed inset-0 z-[110] overflow-y-auto" onClose={onClose}>
        <div className="min-h-screen px-4 text-center">
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black opacity-50" />
          </Transition.Child>

          <span className="inline-block h-screen align-middle" aria-hidden="true">
            &#8203;
          </span>

          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <div className="inline-block w-full max-w-6xl overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl relative">
              
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 flex justify-between items-center text-white border-b border-blue-400">
                <Dialog.Title as="h3" className="text-xl font-bold">
                  {mode === 'edit' ? 'Edit' : 'Add'} Question
                </Dialog.Title>
                <button onClick={onClose} className="text-white hover:text-gray-200 transition-colors p-1 hover:bg-white/20 rounded-full">
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8 space-y-6 max-h-[80vh] overflow-y-auto">
                
                {/* Top Row: Dropdowns */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  <div className="flex flex-col gap-1">
                    <label className="text-[13px] font-semibold text-[#5c6773]">Section / Parts (Units) <span className="text-red-500">*</span></label>
                    <select
                      value={formData.unitId}
                      onChange={(e) => setFormData({ ...formData, unitId: e.target.value })}
                      className={`w-full px-3 py-2 text-sm border ${errors.unitId ? "border-red-500" : "border-gray-300"} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    >
                      <option value="">Select Unit</option>
                      {units.map((u) => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                    {errors.unitId && <span className="text-xs text-red-500">{errors.unitId}</span>}
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[13px] font-semibold text-[#5c6773]">Main Q.No. <span className="text-red-500">*</span></label>
                    <select
                      value={formData.mainQNo}
                      onChange={(e) => setFormData({ ...formData, mainQNo: e.target.value })}
                      className={`w-full px-3 py-2 text-sm border ${errors.mainQNo ? "border-red-500" : "border-gray-300"} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    >
                      <option value="">Select</option>
                      {["1", "2", "3", "4", "5"].map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                    {errors.mainQNo && <span className="text-xs text-red-500">{errors.mainQNo}</span>}
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[13px] font-semibold text-[#5c6773]">Sub Q.No.</label>
                    <select
                      value={formData.subQNo}
                      onChange={(e) => setFormData({ ...formData, subQNo: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">None</option>
                      {["a", "b", "c", "d", "i", "ii", "iii", "iv"].map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                  <div className="pt-6 text-right">
                    <button
                      type="button"
                      onClick={() => setIsImportModalOpen(true)}
                      className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors flex items-center gap-2 ml-auto"
                    >
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                      Import Question
                    </button>
                  </div>
                </div>

                <ImportQuestionModal 
                  isOpen={isImportModalOpen}
                  onClose={() => setIsImportModalOpen(false)}
                  onImport={handleImportQuestion}
                  courseId={courseId}
                />

                {/* Main Form */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Left: Metadata */}
                  <div className="lg:col-span-4 space-y-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="mandatory"
                        checked={formData.isMandatory}
                        onChange={(e) => setFormData({ ...formData, isMandatory: e.target.checked })}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="mandatory" className="text-[13px] font-semibold text-[#5c6773]">Mandatory</label>
                    </div>
                    <div>
                      <label className="block text-[13px] font-semibold text-[#5c6773] mb-1">Question No.</label>
                      <input
                        type="text"
                        value={formData.questionNo}
                        readOnly
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-gray-100 text-gray-500 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] font-semibold text-[#5c6773] mb-1">Course Outcome</label>
                      <select
                        value={formData.coId}
                        onChange={(e) => setFormData({ ...formData, coId: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">{noCOsMessage || "Select CO"}</option>
                        {courseOutcomes.map((co) => (
                          <option key={co.clo_id || co.co_id} value={co.clo_id || co.co_id}>
                            {co.clo_code || co.co_code}
                          </option>
                        ))}
                      </select>
                      {noCOsMessage && (
                        <p className="text-xs text-yellow-600 mt-1 italic bg-yellow-50 p-1 rounded">
                          {noCOsMessage}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-[13px] font-semibold text-[#5c6773] mb-1">Bloom's Level</label>
                      <select
                        value={formData.bloomId}
                        onChange={(e) => setFormData({ ...formData, bloomId: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Level</option>
                        {bloomLevels.map((l) => (
                          <option key={l.bloom_level_id} value={l.bloom_level_id}>{l.bloom_level}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[13px] font-semibold text-[#5c6773] mb-1">Marks <span className="text-red-500">*</span></label>
                      <input
                        type="number"
                        min="1"
                        value={formData.marks}
                        onChange={(e) => setFormData({ ...formData, marks: e.target.value })}
                        className={`w-full px-3 py-2 text-sm border ${errors.marks ? "border-red-500" : "border-gray-300"} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      />
                      {errors.marks && <span className="text-xs text-red-500">{errors.marks}</span>}
                    </div>
                  </div>

                  {/* Right: Editor */}
                  <div className="lg:col-span-8">
                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Question Content</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-2 bg-white focus-within:border-blue-500">
                      <Editor
                        apiKey="no-api-key"
                        tinymceScriptSrc="/tinymce/tinymce.min.js"
                        value={formData.content}
                        onEditorChange={(content) => setFormData({ ...formData, content })}
                        init={{
                          height: 400,
                          menubar: false,
                          plugins: ["advlist", "autolink", "lists", "link", "image", "charmap", "preview", "anchor", "searchreplace", "visualblocks", "code", "fullscreen", "insertdatetime", "media", "table", "help", "wordcount"],
                          toolbar: "undo redo | blocks | bold italic forecolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | help",
                          content_style: "body { font-family: Arial, sans-serif; font-size:14px; }",
                          branding: false,
                          statusbar: false,
                          resize: true,
                          // Disable paste HTML for security
                          paste_data_images: false,
                          automatic_uploads: false,
                        }}
                      />
                      {errors.content && <span className="text-xs text-red-500 block mt-1">{errors.content}</span>}
                    </div>
                  </div>
                </div>

                {/* Stats + Actions */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mt-6 pt-4 border-t border-gray-200">
                  <div className="flex gap-6 text-sm">
                    <div>
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide block">Unit Marks</span>
                      <p className="text-lg font-bold text-gray-900">15 / 25</p>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide block">Total Marks</span>
                      <p className="text-lg font-bold text-gray-900">85 / 100</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleSave}
                      disabled={loading}
                      className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg text-sm font-bold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FaSave />
                      {loading ? "Saving..." : (mode === 'edit' ? 'Update' : 'Save') + " Question"}
                    </button>
                    <button
                      onClick={onClose}
                      className="px-8 py-3 bg-gray-500 text-white rounded-lg text-sm font-bold hover:bg-gray-600 transition-all shadow-lg flex items-center gap-2"
                    >
                      <FaTimes />
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
};

export default EditQuestionModal;


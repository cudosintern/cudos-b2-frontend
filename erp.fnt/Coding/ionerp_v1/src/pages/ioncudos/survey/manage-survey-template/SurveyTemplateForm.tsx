import React, { useState, useEffect } from "react";
import {
  FaSave,
  FaTimes,
  FaQuestionCircle,
  FaPlus,
  FaMinus,
} from "react-icons/fa";
import { toast } from "react-toastify";
import axiosInstance from "../../../../utils/api";
import { ApiEndpoint } from "../../../../utils/ApiEndpoint/emsapiEndpoint";

interface Props {
  initialData?: any | null;
  onSave: (data: any) => void;
  onCancel: () => void;
}

const SurveyTemplateForm: React.FC<Props> = ({
  initialData,
  onSave,
  onCancel,
}) => {
  // Master Data States
  const [schools, setSchools] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [surveyForOptions, setSurveyForOptions] = useState<any[]>([]);
  const [questionTypes, setQuestionTypes] = useState<any[]>([]);
  const [answerTemplates, setAnswerTemplates] = useState<any[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    dept_id: initialData?.dept_id || "",
    pgm_id: initialData?.pgm_id || "",
    su_for: initialData?.su_for || "",
    su_type_id: initialData?.su_type_id || "", // 1: Outcome Attainment, 2: Improvement
    answer_template_id: initialData?.answer_template_id || "",
    status: initialData?.status || 0,
  });

  // Dynamic Questions State
  const [questions, setQuestions] = useState<any[]>(
    initialData?.questions || [
      {
        question_type_id: "",
        question: "",
        is_multiple_choice: "", // 0: Single, 1: Multiple, 595: Descriptive
        is_option_type: 0,
        options: [
          { option: "", option_val: 1 },
          { option: "", option_val: 1 },
        ],
      },
    ],
  );

  // 1. Fetch Initial Master Data
  useEffect(() => {
    // Schools
    axiosInstance
      .get<any>(ApiEndpoint.survey.stakeholder.schools)
      .then((res) => {
        if (res.data?.status) setSchools(res.data.data);
      });
    // Survey For Options (Static mapping from backend)
    axiosInstance
      .get<any>(`${ApiEndpoint.survey.template.base}/survey-for-options`)
      .then((res) => {
        if (res.data?.status) setSurveyForOptions(res.data.data);
      });
    // Question Types
    axiosInstance
      .get<any>(`${ApiEndpoint.survey.template.base}/question-types`)
      .then((res) => {
        if (res.data?.status) setQuestionTypes(res.data.data);
      });
    // Answer Templates (Feedback Options)
    axiosInstance
      .get<any>(`${ApiEndpoint.survey.template.base}/answer-templates`)
      .then((res) => {
        if (res.data?.status) setAnswerTemplates(res.data.data);
      });
  }, []);

  // 2. Fetch Programs on School Change
  useEffect(() => {
    if (formData.dept_id) {
      axiosInstance
        .get<any>(
          `${ApiEndpoint.survey.stakeholder.programs}?dept_id=${formData.dept_id}`,
        )
        .then((res) => {
          if (res.data?.status) setPrograms(res.data.data);
        });
    } else {
      setPrograms([]);
    }
  }, [formData.dept_id]);

  // 3. Handle Parent Form Changes
  const handleFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    let updatedData = { ...formData, [name]: value };

    // Auto-set Survey Template Type based on "Survey For" selection
    if (name === "su_for") {
      const selectedOption = surveyForOptions.find(
        (opt) => String(opt.id) === String(value),
      );
      if (selectedOption) {
        updatedData.su_type_id = selectedOption.type_id;
        // Reset answer_template_id if switching to Improvement Template
        if (selectedOption.type_id === 2) updatedData.answer_template_id = "";
      } else {
        updatedData.su_type_id = "";
      }
    }

    if (name === "dept_id") updatedData.pgm_id = "";

    setFormData(updatedData);
  };

  // 4. Dynamic Question Handlers
  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        question_type_id: "",
        question: "",
        is_multiple_choice: "",
        is_option_type: 0,
        options: [
          { option: "", option_val: 1 },
          { option: "", option_val: 1 },
        ],
      },
    ]);
  };

  const handleRemoveQuestion = (index: number) => {
    const updated = [...questions];
    updated.splice(index, 1);
    setQuestions(updated);
  };

  const handleQuestionChange = (index: number, field: string, value: any) => {
    const updated = [...questions];
    updated[index][field] = value;

    // Auto-clear options if switching to Descriptive (595)
    if (field === "is_multiple_choice" && String(value) === "595") {
      updated[index].options = [];
    } else if (
      field === "is_multiple_choice" &&
      updated[index].options.length === 0
    ) {
      updated[index].options = [
        { option: "", option_val: 1 },
        { option: "", option_val: 1 },
      ];
    }
    setQuestions(updated);
  };

  const handleAddOption = (qIndex: number) => {
    const updated = [...questions];
    updated[qIndex].options.push({ option: "", option_val: 1 });
    setQuestions(updated);
  };

  const handleRemoveOption = (qIndex: number, optIndex: number) => {
    const updated = [...questions];
    updated[qIndex].options.splice(optIndex, 1);
    setQuestions(updated);
  };

  const handleOptionChange = (
    qIndex: number,
    optIndex: number,
    value: string,
  ) => {
    const updated = [...questions];
    updated[qIndex].options[optIndex].option = value;
    setQuestions(updated);
  };

  // 5. Submit Validation
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.dept_id ||
      !formData.pgm_id ||
      !formData.su_for ||
      !formData.name ||
      !formData.description
    ) {
      toast.error("Please fill all mandatory fields in the template details.");
      return;
    }
    if (formData.su_type_id === 1 && !formData.answer_template_id) {
      toast.error(
        "Please select a Feedback Option for the Outcome Attainment template.",
      );
      return;
    }
    if (questions.length === 0) {
      toast.error("Please add at least one question.");
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].question_type_id || !questions[i].question.trim()) {
        toast.error(`Please complete Question ${i + 1} type and description.`);
        return;
      }
      if (
        formData.su_type_id === 2 &&
        !String(questions[i].is_multiple_choice)
      ) {
        toast.error(`Please select an Answer Section for Question ${i + 1}.`);
        return;
      }
      if (
        formData.su_type_id === 2 &&
        ["0", "1"].includes(String(questions[i].is_multiple_choice))
      ) {
        for (let j = 0; j < questions[i].options.length; j++) {
          if (!questions[i].options[j].option.trim()) {
            toast.error(`Please fill all options for Question ${i + 1}.`);
            return;
          }
        }
      }
    }

    const payload = {
      ...formData,
      dept_id: Number(formData.dept_id),
      pgm_id: Number(formData.pgm_id),
      su_for: Number(formData.su_for),
      su_type_id: Number(formData.su_type_id),
      answer_template_id: formData.answer_template_id
        ? Number(formData.answer_template_id)
        : null,
      questions: questions.map((q) => ({
        ...q,
        question_type_id: Number(q.question_type_id),
        is_multiple_choice:
          q.is_multiple_choice !== "" ? Number(q.is_multiple_choice) : 0,
      })),
    };

    onSave(payload);
  };

  return (
    <div className="bg-white rounded-md border border-gray-300 shadow-sm animate-fade-in mb-6">
      <div className="bg-[#1f3b4d] text-white px-4 py-2.5 rounded-t-md flex justify-between items-center">
        <h2 className="text-sm font-semibold">
          {initialData ? "Edit Template" : "Add Template"}
        </h2>
        <FaQuestionCircle
          className="text-[#5bc0de] cursor-pointer hover:text-white transition-colors"
          size={16}
        />
      </div>

      <form onSubmit={handleSubmit} className="p-6 bg-gray-50/50">
        {/* Template Header Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 mb-8">
          <div className="flex items-center">
            <label className="w-1/3 text-sm text-gray-700 text-right pr-4">
              Survey For: <span className="text-red-500">*</span>
            </label>
            <select
              name="su_for"
              value={formData.su_for}
              onChange={handleFormChange}
              className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#437880]"
            >
              <option value="">Select Survey For</option>
              {surveyForOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center">
            <label className="w-1/3 text-sm text-gray-700 text-right pr-4">
              Survey Template Type: <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              readOnly
              className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm bg-gray-100 cursor-not-allowed"
              value={
                surveyForOptions.find(
                  (opt) => String(opt.id) === String(formData.su_for),
                )?.type_name || "Select Survey For first"
              }
            />
          </div>

          <div className="flex items-center">
            <label className="w-1/3 text-sm text-gray-700 text-right pr-4">
              School Name: <span className="text-red-500">*</span>
            </label>
            <select
              name="dept_id"
              value={formData.dept_id}
              onChange={handleFormChange}
              className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#437880]"
            >
              <option value="">Select School</option>
              {schools.map((s) => (
                <option key={s.dept_id} value={s.dept_id}>
                  {s.dept_name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center">
            <label className="w-1/3 text-sm text-gray-700 text-right pr-4">
              Program: <span className="text-red-500">*</span>
            </label>
            <select
              name="pgm_id"
              value={formData.pgm_id}
              onChange={handleFormChange}
              disabled={!formData.dept_id}
              className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#437880] disabled:bg-gray-100"
            >
              <option value="">Select Program</option>
              {programs.map((p) => (
                <option key={p.pgm_id} value={p.pgm_id}>
                  {p.pgm_title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center">
            <label className="w-1/3 text-sm text-gray-700 text-right pr-4">
              Survey Template Name: <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleFormChange}
              className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#437880]"
            />
          </div>

          <div className="flex items-start">
            <label className="w-1/3 text-sm text-gray-700 text-right pr-4 mt-1">
              Description: <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleFormChange}
              rows={3}
              className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#437880] resize-none"
            ></textarea>
          </div>
        </div>

        {/* Template Questions Section */}
        <div className="border border-gray-300 rounded-md bg-white">
          <div className="bg-[#1f3b4d] text-white px-4 py-2 flex justify-between items-center rounded-t-sm">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold">Template Questions</h3>
              <FaQuestionCircle
                className="text-[#5bc0de] cursor-pointer"
                size={14}
              />
            </div>
            <button
              type="button"
              onClick={handleAddQuestion}
              className="bg-[#0066cc] hover:bg-[#0052a3] text-white px-3 py-1 rounded text-xs font-medium flex items-center gap-1"
            >
              <FaPlus /> Add Question
            </button>
          </div>

          <div className="p-4 space-y-4 bg-gray-50">
            {/* Global Feedback Option (Outcome Attainment Only) */}
            {String(formData.su_type_id) === "1" && (
              <div className="flex items-center mb-6 pb-4 border-b border-gray-200">
                <label className="w-1/4 text-sm text-gray-700 text-right pr-4 font-semibold">
                  Feedback Option: <span className="text-red-500">*</span>
                </label>
                <select
                  name="answer_template_id"
                  value={formData.answer_template_id}
                  onChange={handleFormChange}
                  className="w-1/3 border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#437880]"
                >
                  <option value="">Select Feedback Option</option>
                  {answerTemplates.map((at) => (
                    <option key={at.id} value={at.id}>
                      {at.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Question Builder Mapping */}
            {questions.map((q, qIndex) => (
              <div
                key={qIndex}
                className="bg-white border border-gray-200 rounded p-4 relative shadow-sm"
              >
                {questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveQuestion(qIndex)}
                    className="absolute top-4 right-4 text-red-500 hover:text-red-700 transition-colors"
                  >
                    <FaMinus size={18} />
                  </button>
                )}

                <div className="flex items-center mb-4 pr-10">
                  <label className="w-1/4 text-sm text-gray-700 text-right pr-4">
                    Question Type: <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={q.question_type_id}
                    onChange={(e) =>
                      handleQuestionChange(
                        qIndex,
                        "question_type_id",
                        e.target.value,
                      )
                    }
                    className="w-1/3 border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#437880]"
                  >
                    <option value="">Select Question Type</option>
                    {questionTypes.map((qt) => (
                      <option key={qt.id} value={qt.id}>
                        {qt.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-start mb-4 pr-10">
                  <label className="w-1/4 text-sm text-gray-700 text-right pr-4 mt-1">
                    Question: <span className="text-red-500">*</span>
                  </label>
                  <div className="flex-1">
                    <textarea
                      value={q.question}
                      onChange={(e) =>
                        handleQuestionChange(qIndex, "question", e.target.value)
                      }
                      rows={2}
                      className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#437880] resize-none"
                      placeholder="Enter Question"
                    ></textarea>
                    <div className="text-right text-xs text-gray-500 mt-1">
                      {q.question.length} of 1000.
                    </div>
                  </div>
                </div>

                {/* Per-Question Answer Section (Improvement Template Only) */}
                {String(formData.su_type_id) === "2" && (
                  <div className="mb-2">
                    <div className="flex items-center mb-3 pr-10">
                      <label className="w-1/4 text-sm text-gray-700 text-right pr-4 font-semibold">
                        Answer Section:
                      </label>
                      <select
                        value={q.is_multiple_choice}
                        onChange={(e) =>
                          handleQuestionChange(
                            qIndex,
                            "is_multiple_choice",
                            e.target.value,
                          )
                        }
                        className="w-1/3 border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#437880]"
                      >
                        <option value="">Select Option Type</option>
                        <option value="0">Single type</option>
                        <option value="1">Multiple type</option>
                        <option value="595">Descriptive type</option>
                      </select>
                    </div>

                    {/* Options Builder for Single/Multiple Type */}
                    {["0", "1"].includes(String(q.is_multiple_choice)) && (
                      <div className="ml-[25%] pr-10 bg-gray-50 p-3 rounded border border-gray-200">
                        {q.options.map((opt: any, optIndex: number) => (
                          <div
                            key={optIndex}
                            className="flex items-center gap-3 mb-2"
                          >
                            <span className="text-red-500 text-xs">*</span>
                            <input
                              type="text"
                              value={opt.option}
                              onChange={(e) =>
                                handleOptionChange(
                                  qIndex,
                                  optIndex,
                                  e.target.value,
                                )
                              }
                              className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#437880]"
                            />
                            {q.options.length > 2 && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleRemoveOption(qIndex, optIndex)
                                }
                                className="text-red-500 hover:text-red-700"
                              >
                                <FaMinus size={14} />
                              </button>
                            )}
                          </div>
                        ))}
                        <div className="flex justify-end mt-2">
                          <button
                            type="button"
                            onClick={() => handleAddOption(qIndex)}
                            className="bg-[#0066cc] hover:bg-[#0052a3] text-white px-2 py-1 rounded text-xs font-medium flex items-center gap-1"
                          >
                            <FaPlus /> Add Options
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Bottom Add Question Button */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleAddQuestion}
                className="bg-[#0066cc] hover:bg-[#0052a3] text-white px-3 py-1.5 rounded text-sm font-medium flex items-center gap-1 shadow-sm"
              >
                <FaPlus /> Add Question
              </button>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-200">
          <button
            type="submit"
            className="flex items-center gap-2 bg-[#0066cc] hover:bg-[#0052a3] text-white px-4 py-1.5 rounded text-sm font-medium transition-colors"
          >
            <FaSave /> Save
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-2 bg-[#d9534f] hover:bg-[#c9302c] text-white px-4 py-1.5 rounded text-sm font-medium transition-colors"
          >
            <FaTimes /> Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default SurveyTemplateForm;

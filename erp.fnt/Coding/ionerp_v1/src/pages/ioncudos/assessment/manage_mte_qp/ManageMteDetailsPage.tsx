import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { PieChart, Pie, Tooltip, Legend, Cell, ResponsiveContainer } from "recharts";
import AddQuestionModal from "./AddQuestionModal";
import OrMappingModal from "./OrMappingModal";
import { manageMteService } from "./manageMteService";
import { FaTimes, FaSave } from "react-icons/fa";
import { toast } from "react-toastify";
import { FaPlus, FaCheck, FaQuestionCircle } from "react-icons/fa";
import { GoPencil } from "react-icons/go";
import { MdOutlineDoNotDisturbAlt } from "react-icons/md";
import ConfirmDialog from "../../../../components/Dialog/ConfirmDialog";
// import DataTable from "../../../../components/Table/DataTable";

interface SectionPart {
  id: string;
  name: string;
  numberOfQuestions: string;
  maxMarks: string;
}

interface Question {
  id: string;
  question: string;
  cos: string;
  rawCoId?: number;
  blooms: string;
  rawBloomId?: number;
  marks: number;
  unit_id?: number;
  main_question_no?: number;
  sub_question_no?: string;
  is_mandatory?: number;
  questionNo?: string;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#FF6B6B"];

const ManageMteDetailsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const stateAny = (location.state as any) || {};
  const { ao_name, qpf_id: initialQpfId } = stateAny;
  const ao_id = stateAny.ao_id ? parseInt(stateAny.ao_id) : 0;
  const qpd_id = stateAny.qpd_id ? parseInt(stateAny.qpd_id) : 0;
  const resolvedCourseData = stateAny.courseData || stateAny.course || null;
  const filters = stateAny.filters || {};

  // Standard State
  const [curriculumName, setCurriculumName] = useState(filters?.academic_batch_code || filters?.curriculum_name || stateAny.academic_batch_code || stateAny.curriculum_name || "N/A");
  const [termName, setTermName] = useState(filters?.term_name || stateAny.term_name || "N/A");
  const [courseName, setCourseName] = useState(resolvedCourseData?.crs_title || stateAny.crs_title || "N/A");

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    framework: true,
    questions: false,
    analysis: false,
  });

  const [loading, setLoading] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [qpfId, setQpfId] = useState<number | null>(null);
  const [qpdId, setQpdId] = useState<number | null>(qpd_id || null);
  const [frameworkData, setFrameworkData] = useState<any>(null);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [errors, setErrors] = useState<any>({});
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Framework/Questions State
  const [frameworkForm, setFrameworkForm] = useState({
    title: "",
    duration: "02:00",
    maxMarks: 100 as number | "",
    grandTotal: 100 as number | "",
    note: ""
  });
  const [sections, setSections] = useState<SectionPart[]>([]);
  const [newSection, setNewSection] = useState({
    name: "",
    numberOfQuestions: "",
    maxMarks: "",
  });

  const [questions, setQuestions] = useState<Question[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [coMap, setCoMap] = useState<Record<number, string>>({});
  const [bloomMap, setBloomMap] = useState<Record<number, string>>({});

  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [isOrMappingModalOpen, setIsOrMappingModalOpen] = useState(false);
  const [existingMappings, setExistingMappings] = useState<any[]>([]);

  // Search and Pagination State
  const [searchTerm, setSearchTerm] = useState("");
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  const handleDefineRubrics = () => {
    navigate("/define-rubrics", {
      state: {
        ao_id: ao_id,
        crs_id: resolvedCourseData?.crs_id,
        academic_batch_id: resolvedCourseData?.academic_batch_id,
        term_id: resolvedCourseData?.term_id,
        crs_title: resolvedCourseData?.crs_title,
        academic_batch_code: resolvedCourseData?.academic_batch_code,
        term_name: resolvedCourseData?.term_name
      }
    });
  };

  const handleMapOrQuestions = async () => {
    const targetId = qpdId;
    if (targetId) {
      setLoading(true);
      try {
        const res = await manageMteService.getOrMappings(targetId);
        if (res.status === 1) {
          setExistingMappings(res.data || []);
          setIsOrMappingModalOpen(true);
        } else {
          toast.error("Failed to fetch existing mappings.");
        }
      } catch (err) {
        toast.error("Error fetching OR mappings.");
      } finally {
        setLoading(false);
      }
    } else {
      toast.error("Question Paper ID is missing.");
    }
  };

  const handleMapOrQuestionsSave = async (mappings: any[]) => {
    const targetId = qpdId;
    if (targetId) {
      try {
        const res = await manageMteService.mapOrQuestions({
          qpd_id: targetId,
          mappings: mappings.map(m => ({
            question_one: m.question_one,
            question_two: m.question_two,
            or_type: m.or_type ?? 0
          }))
        });
        if (res.status === 1) {
          toast.success(res.message || "OR Mappings saved successfully");
          setIsOrMappingModalOpen(false);
          if (qpfId) fetchDetails(qpfId);
        } else {
          toast.error(res.message || "Failed to save OR Mappings");
        }
      } catch (err: any) {
        toast.error("An error occurred while saving mapping.");
      }
    } else {
      toast.error("Cannot save mapping: Question Paper ID is missing.");
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const validateFramework = (): boolean => {
    const newErrors: any = {};
    if (!frameworkForm.title?.trim()) newErrors.title = "This field is required.";
    if (!frameworkForm.duration?.trim()) newErrors.duration = "This field is required.";
    if (frameworkForm.maxMarks === "" || frameworkForm.maxMarks === null) newErrors.maxMarks = "This field is required.";
    if (frameworkForm.grandTotal === "" || frameworkForm.grandTotal === null) newErrors.grandTotal = "This field is required.";

    // if (frameworkForm.maxMarks !== "" && frameworkForm.grandTotal !== "" && Number(frameworkForm.maxMarks) !== Number(frameworkForm.grandTotal)) {
    //   newErrors.grandTotal = "Grand Total must match Maximum Marks.";
    // }

    // Grand Total can be greater than Maximum Marks.
// Only prevent Grand Total from being less than Maximum Marks.
if (
  frameworkForm.maxMarks !== "" &&
  frameworkForm.grandTotal !== "" &&
  Number(frameworkForm.grandTotal) < Number(frameworkForm.maxMarks)
) {
  newErrors.grandTotal =
    "Grand Total should be greater than or equal to Maximum Marks.";
}
    setErrors((prev: any) => ({ ...prev, ...newErrors }));
    return !newErrors.title && !newErrors.duration && !newErrors.maxMarks && !newErrors.grandTotal;
  };

  const validateNewSection = () => {
    const newErrors: any = {};
    const positiveNumericRegex = /^[1-9]\d*$/;

    if (!newSection.name?.trim()) {
      newErrors.newName = "This field is required.";
    } else {
      const isDuplicate = sections.some(s => s.name.trim().toLowerCase() === newSection.name.trim().toLowerCase());
      if (isDuplicate) newErrors.newName = "Duplicate section name.";
    }

    if (!newSection.numberOfQuestions?.trim()) {
      newErrors.newNumberOfQuestions = "This field is required.";
    } else if (!positiveNumericRegex.test(newSection.numberOfQuestions)) {
      newErrors.newNumberOfQuestions = "Must be positive.";
    }

    if (!newSection.maxMarks?.trim()) {
      newErrors.newMaxMarks = "This field is required.";
    } else if (!positiveNumericRegex.test(newSection.maxMarks)) {
      newErrors.newMaxMarks = "Must be positive.";
    } else {
      const existingSum = sections.reduce((acc, s) => acc + (Number(s.maxMarks) || 0), 0);
      // if (frameworkForm.maxMarks !== "" && existingSum + Number(newSection.maxMarks) > Number(frameworkForm.maxMarks)) {
      //   newErrors.newMaxMarks = "Sum exceeds Maximum Marks.";
      // }

      if (
  frameworkForm.grandTotal !== "" &&
  existingSum + Number(newSection.maxMarks) > Number(frameworkForm.grandTotal)
) {
  newErrors.newMaxMarks = "Total Section Marks cannot exceed Grand Total.";
}
    }

    setErrors((prev: any) => ({ ...prev, ...newErrors }));
    return !newErrors.newName && !newErrors.newNumberOfQuestions && !newErrors.newMaxMarks;
  };

  const validateTableSections = () => {
    const sectionErrors: Record<string, any> = {};
    const positiveNumericRegex = /^[1-9]\d*$/;
    let sumMaxMarks = 0;

    sections.forEach((s) => {
      const errs: any = {};
      if (!s.name?.trim()) errs.name = "This field is required.";
      if (!s.numberOfQuestions?.toString().trim()) {
        errs.numberOfQuestions = "This field is required.";
      } else if (!positiveNumericRegex.test(s.numberOfQuestions.toString())) {
        errs.numberOfQuestions = "Must be positive.";
      }

      if (!s.maxMarks?.toString().trim()) {
        errs.maxMarks = "This field is required.";
      } else if (!positiveNumericRegex.test(s.maxMarks.toString())) {
        errs.maxMarks = "Must be positive.";
      } else {
        sumMaxMarks += Number(s.maxMarks);
      }
      if (Object.keys(errs).length > 0) sectionErrors[s.id] = errs;
    });

    const newErrors: any = {};
    if (Object.keys(sectionErrors).length > 0) newErrors.tableSectionErrors = sectionErrors;

    // if (frameworkForm.maxMarks !== "" && sumMaxMarks > Number(frameworkForm.maxMarks)) {
    //   newErrors.sectionsSum = "Sum of Section Marks cannot exceed Maximum Marks.";
    // } else if (sumMaxMarks !== Number(frameworkForm.grandTotal)) {
    //   newErrors.sectionsSum = "Total unit marks is not matching the grand total";
    // }

    // Total Unit Marks can be greater than Maximum Marks.
// Only validate that Unit Total is not less than Maximum Marks.
  // Total Unit Marks must match Grand Total
if (
  frameworkForm.grandTotal !== "" &&
  sumMaxMarks > Number(frameworkForm.grandTotal)
) {
  newErrors.sectionsSum =
    "Total Section Marks cannot exceed Grand Total.";
}

    setErrors((prev: any) => ({ ...prev, ...newErrors }));
    return Object.keys(sectionErrors).length === 0 && !newErrors.sectionsSum;
  };

  useEffect(() => {
    validateFramework();
  }, [frameworkForm]);

  useEffect(() => {
    validateTableSections();
  }, [sections, frameworkForm.maxMarks, frameworkForm.grandTotal]);

  const handleSaveNewSection = async () => {
    setShowErrors(true);
    if (!validateNewSection()) return;
    if (newSection.name.trim() && qpfId) {
      setLoading(true);
      try {
        const res = await manageMteService.addMteUnits(qpfId, [
          {
            unit_name: newSection.name,
            no_of_questions: Number(newSection.numberOfQuestions),
            unit_max_marks: Number(newSection.maxMarks)
          }
        ]);
        if (res.status === 1) {
          toast.success("Unit added successfully");
          fetchDetails(qpfId);
          setNewSection({ name: "", numberOfQuestions: "", maxMarks: "" });
        }
      } catch (error) {
        toast.error("Failed to add unit");
      } finally {
        setLoading(false);
      }
    } else if (!qpfId) {
      // Local add if framework not yet created
      setSections([
        ...sections,
        {
          id: Math.random().toString(36).substring(7),
          name: newSection.name,
          numberOfQuestions: newSection.numberOfQuestions,
          maxMarks: newSection.maxMarks,
        },
      ]);
      setNewSection({ name: "", numberOfQuestions: "", maxMarks: "" });
    }
  };

  const handleUpdateSections = async () => {
    setShowErrors(true);
    if (!validateTableSections()) return;
    if (qpfId) {
      setLoading(true);
      try {
        const unitsToUpdate = sections.map(s => ({
          qpf_unit_id: Number(s.id),
          unit_name: s.name,
          no_of_questions: Number(s.numberOfQuestions),
          unit_max_marks: Number(s.maxMarks)
        }));
        const res = await manageMteService.updateMteUnits(qpfId, unitsToUpdate);
        if (res.status === 1) {
          toast.success("Units updated successfully");
          fetchDetails(qpfId);
        }
      } catch (error) {
        toast.error("Failed to update units");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSaveAndCreateQP = async () => {
    if (sections.length === 0) {
      toast.error("Please add at least one unit before saving.");
      return;
    }
    handleSaveFramework();
  };

  const handleSaveFramework = async () => {
    setShowErrors(true);
    if (!validateFramework()) return;
    setLoading(true);
    try {
      if (qpfId) {
        // Update
        const res = await manageMteService.updateMteFramework(qpfId, {
          question_paper_title: frameworkForm.title,
          total_duration: frameworkForm.duration,
          maximum_marks: frameworkForm.maxMarks,
          grand_total: frameworkForm.grandTotal,
          note: frameworkForm.note
        });
        if (res.status === 1) {
          toast.success("Framework updated");
          fetchDetails(qpfId);
        }
      } else {
        // Create - ensure course_code is present (backend requires crs_code lookup)
        if (!resolvedCourseData?.crs_code) {
          toast.error("Course code missing. Cannot create framework.");
          return;
        }

        const res = await manageMteService.createMteFramework({
          question_paper_title: frameworkForm.title,
          total_duration: frameworkForm.duration,
          course_code: resolvedCourseData?.crs_code,
          maximum_marks: frameworkForm.maxMarks,
          grand_total: frameworkForm.grandTotal,
          note: frameworkForm.note,
          units: sections.map(s => ({
            unit_name: s.name,
            no_of_questions: Number(s.numberOfQuestions),
            unit_max_marks: Number(s.maxMarks)
          })),
          ...(ao_id ? { ao_id } : {})  // pass ao_id for cudos_qp_definition linkage
        });
        if (res.status === 1) {
          toast.success("Framework created");
          setQpfId(res.data.qpf_id);
          fetchDetails(res.data.qpf_id);
        }
      }
    } catch (error) {
      toast.error("Operation failed");
    } finally {
      setLoading(false);
    }
  };

  const fetchIdAndDetails = async () => {
    if (!ao_id) return;
    setLoading(true);
    try {
      const idRes = await manageMteService.getMteFrameworkId(ao_id);
      if (idRes.status === 1 && idRes.data.qpf_id) {
        setQpfId(idRes.data.qpf_id);
        setQpdId(idRes.data.qpd_id);
        fetchDetails(idRes.data.qpf_id);
      }
    } catch (error) {
      console.error("Error fetching ID", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewQP = (row: any) => {
    toast.info("Question paper preview is available from the main list view.");
  };

  const fetchDetails = async (id: number) => {
    try {
      const [fRes, qRes, coRes, bloomRes] = await Promise.all([
        manageMteService.getMteFrameworkDetails(id),
        manageMteService.getMteQuestions(id),
        (resolvedCourseData?.crs_id && filters?.academic_batch_id && filters?.semester_id)
          ? manageMteService.getCOs(resolvedCourseData.crs_id, filters.academic_batch_id, filters.semester_id)
          : Promise.resolve({ status: 1, data: [] }),
        manageMteService.getBloomLevels()
      ]);

      // Update maps
      const newCoMap: Record<number, string> = {};
      const newBloomMap: Record<number, string> = {};

      (coRes.data || []).forEach((co: any) => {
        const id = Number(co.co_id || co.clo_id || co.id);
        if (!isNaN(id)) {
          newCoMap[id] = co.co_code || co.clo_code || co.code || `CO${id}`;
        }
      });
      (bloomRes.data || []).forEach((bl: any) => {
        const id = Number(bl.bloom_level_id || bl.bloom_id || bl.id);
        if (!isNaN(id)) {
          newBloomMap[id] = bl.bloom_level || bl.bloom_level_name || bl.level || `L${id}`;
        }
      });

      setCoMap(newCoMap);
      setBloomMap(newBloomMap);

      if (fRes.status === 1) {
        const f = fRes.data;
        setFrameworkData(f);
        setCurriculumName(f.academic_batch_code || f.pgm_title || filters?.curriculum_name || stateAny.curriculum_name || "N/A");
        setTermName(f.term_name || f.semester_name || filters?.term_name || stateAny.term_name || "N/A");
        setCourseName(f.crs_title || f.crs_name || resolvedCourseData?.crs_title || stateAny.crs_title || "N/A");

        setFrameworkForm({
          title: f.qpf_title || f.question_paper_title || "",
          duration: f.total_duration || "02:00",
          maxMarks: f.maximum_marks || 0,
          grandTotal: f.grand_total || 0,
          note: f.note || ""
        });
        setSections((f.units || []).map((u: any) => ({
          id: u.qpf_unit_id.toString(),
          name: u.unit_name,
          numberOfQuestions: u.no_of_questions.toString(),
          maxMarks: u.unit_max_marks.toString()
        })));
      }

      if (qRes.status === 1) {
        setQuestions(qRes.data.map((q: any) => {
          return {
            id: q.qpf_mq_id.toString(),
            question: q.question_text,
            cos: q.co_code || "-",
            rawCoId: q.course_outcome_id,
            blooms: q.bloom_code || "-",
            rawBloomId: q.bloom_level_id,
            marks: q.marks,
            unit_id: q.unit_id,
            course_outcome_id: q.course_outcome_id,
            bloom_level_id: q.bloom_level_id,
            main_question_no: q.main_question_no,
            sub_question_no: q.sub_question_no,
            is_mandatory: (Number(q.is_mandatory ?? q.mandatory ?? q.isMandatory ?? q.is_mandatory_flag ?? 0) === 1 || q.is_mandatory === true || q.mandatory === true) ? 1 : 0,
            questionNo: `${fRes.data.units.find((u: any) => u.qpf_unit_id === q.unit_id)?.unit_name || ""}-Q${q.main_question_no || ""}${q.sub_question_no ? `.${q.sub_question_no}` : ""}`
          };
        }));
      }

      // Fetch Analysis
      if (id) {
        fetchAnalysis(id);
      }
    } catch (error) {
      toast.error("Failed to load details");
    }
  };

  const fetchAnalysis = async (id: number) => {
    try {
      const res = await manageMteService.getQpAnalysis(id);
      if (res.status === 1) {
        setAnalysisData(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch analysis", error);
    }
  };


  useEffect(() => {
    if (filters?.academic_batch_id && filters?.semester_id) {
      setCurriculumName(filters.curriculum_name || filters.academic_batch_code || 'N/A');
      setTermName(filters.term_name || 'N/A');
    }

    // Always fetch IDs if ao_id is present to ensure we have qpdId for OR mapping
    if (ao_id) {
      fetchIdAndDetails();
    } else if (initialQpfId) {
      setQpfId(initialQpfId);
      fetchDetails(initialQpfId);
    }
  }, [ao_id, initialQpfId]);

  const handleRemoveSection = (id: string) => {
    setConfirmConfig({
      title: "Remove Section",
      message: "Are you sure you want to remove this section? All associated data might be lost.",
      onConfirm: async () => {
        if (qpfId && /^\d+$/.test(id)) {
          setLoading(true);
          try {
            const res = await manageMteService.deleteMteUnit(qpfId, Number(id));
            if (res.status === 1) {
              toast.success("Unit removed successfully");
              fetchDetails(qpfId);
            } else {
              toast.error(res.message || "Failed to remove unit");
            }
          } catch (error) {
            toast.error("Unit contains questions. Delete them first.");
          } finally {
            setLoading(false);
          }
        } else {
          setSections(sections.filter((s) => s.id !== id));
          toast.success("Unit removed locally");
        }
        setIsConfirmOpen(false);
      }
    });
    setIsConfirmOpen(true);
  };

  const handleSectionChange = (id: string, field: keyof SectionPart, value: string) => {
    setSections(sections.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };


  const handleAddQuestion = () => {
    setModalMode('add');
    setEditingQuestion(null);
    setIsQuestionModalOpen(true);
  };

  const handleRemoveQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };



  const handleSaveQuestion = async (questionData: any, isEdit = false) => {
    if (qpfId) {
      await fetchDetails(qpfId);
    }
    setEditingQuestion(null);
    setIsQuestionModalOpen(false);
  };

  const handleEdit = (question: any) => {
    setModalMode('edit');
    setEditingQuestion(question);
    setIsQuestionModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setConfirmConfig({
      title: "Delete Question",
      message: "Are you sure you want to delete this question?",
      onConfirm: async () => {
        try {
          // Optimistic local update for faster feedback
          setQuestions(prev => prev.filter(q => q.id !== id));
          
          const res = await manageMteService.deleteMteQuestion(Number(id));
          if (res.status === 1) {
            toast.success("Question deleted");
            // Full refresh to ensure consistency
            await fetchDetails(qpfId!);
          } else {
            toast.error(res.message || "Delete failed");
            // Re-fetch to restore if needed
            await fetchDetails(qpfId!); 
          }
        } catch (err) {
          toast.error("Delete failed");
          await fetchDetails(qpfId!);
        }
        setIsConfirmOpen(false);
      }
    });
    setIsConfirmOpen(true);
  };

  // 3. Derived Analysis State
  const getBloomsEqualData = () => {
    if (analysisData?.bloom_equal && Array.isArray(analysisData.bloom_equal) && analysisData.bloom_equal.length > 0) {
      return (analysisData.bloom_equal as any[])
        .map((d: any) => ({
          name: d.bloom_level,
          value: Number(d.marks) || 0
        }))
        .filter(d => d.value > 0);
    }
    return [];
  };

  const getBloomsActualData = () => {
    if (analysisData?.bloom_actual && Array.isArray(analysisData.bloom_actual) && analysisData.bloom_actual.length > 0) {
      return (analysisData.bloom_actual as any[])
        .map((d: any) => ({
          name: d.bloom_level,
          value: Number(d.marks) || 0
        }))
        .filter(d => d.value > 0);
    }

    if (questions.length === 0) return [];

    const counts = questions.reduce((acc, q) => {
      const b = q.blooms || "N/A";
      acc[b] = (acc[b] || 0) + (Number(q.marks) || 0);
      return acc;
    }, {} as Record<string, number>);

    return Object.keys(counts)
      .map((key) => ({
        name: key,
        value: counts[key],
      }))
      .filter(d => d.value > 0);
  };

  const getCOData = () => {
    if (analysisData?.co_distribution && Array.isArray(analysisData.co_distribution) && analysisData.co_distribution.length > 0) {
      return (analysisData.co_distribution as any[])
        .map((d: any) => ({
          name: d.co_code,
          value: Number(d.marks) || 0
        }))
        .filter(d => d.value > 0);
    }

    if (questions.length === 0) return [];

    const counts = questions.reduce((acc, q) => {
      const c = q.cos || "N/A";
      acc[c] = (acc[c] || 0) + (Number(q.marks) || 0);
      return acc;
    }, {} as Record<string, number>);

    return Object.keys(counts)
      .map((key) => ({
        name: key,
        value: counts[key],
      }))
      .filter(d => d.value > 0);
  };

  const bloomsEqualData = getBloomsEqualData();
  const bloomsData = getBloomsActualData();
  const coData = getCOData();

  // Reusable Chevron Icon
  const ChevronIcon = ({ expanded }: { expanded: boolean }) => (
    <svg
      className={`w-6 h-6 transform transition-transform duration-200 ${expanded ? "rotate-180" : ""
        }`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M19 9l-7 7-7-7"
      ></path>
    </svg>
  );

  const totalQuestionMarks = React.useMemo(() => {
    return questions.reduce((acc, q) => acc + (Number(q.marks) || 0), 0);
  }, [questions]);

  // Filtering and Grouping Logic
  const filteredQuestions = React.useMemo(() => {
    if (!searchTerm) return questions;
    const term = searchTerm.toLowerCase();
    return questions.filter(q => 
      q.question.toLowerCase().includes(term) ||
      q.cos.toLowerCase().includes(term) ||
      q.blooms.toLowerCase().includes(term) ||
      q.questionNo?.toLowerCase().includes(term)
    );
  }, [questions, searchTerm]);

  const groupedQuestions = React.useMemo(() => {
    const groups: Record<string, Question[]> = {};
    sections.forEach(s => {
      groups[s.id] = filteredQuestions.filter(q => String(q.unit_id) === s.id);
    });
    return groups;
  }, [sections, filteredQuestions]);

  const calculateSectionMarks = React.useCallback((unitId: string) => {
    const sectionQuestions = questions.filter(q => String(q.unit_id) === unitId);
    return sectionQuestions.reduce((acc, q) => acc + (Number(q.marks) || 0), 0);
  }, [questions]);

  const totalPages = Math.ceil(filteredQuestions.length / pageSize);
  const paginatedQuestions = React.useMemo(() => {
    // Note: Since we are grouping by section, pagination might be tricky if we want to paginate the "sections" or the "questions".
    // Old module seems to paginate the total questions list but display them in their sections.
    // However, if we paginate questions, some sections might disappear or be partially shown.
    // Usually, in these ERP modules, the pagination applies to the whole set of questions.
    return filteredQuestions.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [filteredQuestions, currentPage, pageSize]);

  // const questionsColumnDefs = React.useMemo(() => [
  //   {
  //     headerName: "Sl No.",
  //     valueGetter: "node.rowIndex + 1",
  //     width: 80,
  //     minWidth: 80,
  //     maxWidth: 80,
  //     suppressMovable: true,
  //     sortable: false,
  //     filter: false,
  //     cellStyle: { borderRight: "1px solid #e2e8f0", textAlign: "center" },
  //   },
  //   {
  //     headerName: "Question",
  //     field: "question",
  //     sortable: true,
  //     filter: true,
  //     flex: 2,
  //     minWidth: 400,
  //     cellStyle: { borderRight: "1px solid #e2e8f0", whiteSpace: "normal", lineHeight: "1.6", padding: "12px 8px" },
  //     autoHeight: true,
  //     wrapText: true,
  //   },
  //   {
  //     headerName: "Course Outcome",
  //     field: "cos",
  //     sortable: true,
  //     filter: true,
  //     flex: 1,
  //     minWidth: 150,
  //     cellStyle: { borderRight: "1px solid #e2e8f0" },
  //   },
  //   {
  //     headerName: "Bloom's Level",
  //     field: "blooms",
  //     sortable: true,
  //     filter: true,
  //     flex: 1,
  //     minWidth: 150,
  //     cellStyle: { borderRight: "1px solid #e2e8f0" },
  //   },
  //   {
  //     headerName: "Marks",
  //     field: "marks",
  //     sortable: true,
  //     filter: true,
  //     width: 100,
  //     minWidth: 100,
  //     cellStyle: { borderRight: "1px solid #e2e8f0", textAlign: "center" },
  //   },
  //   {
  //     headerName: "Action",
  //     cellRenderer: (params: any) => {
  //       if (!params || !params.data) return null;
  //       const q = params.data;
  //       return (
  //         //  <div className="flex space-x-2 justify-center items-center h-full"> 
  //         //     <button
  //         //       onClick={() => handleEdit(q)}
  //         //       className="text-blue-600 hover:text-blue-800 p-1.5 hover:bg-blue-50 rounded-full transition-all"
  //         //       title="Edit Question"
  //         //     >
  //         //       <FaEdit className="w-4 h-4" />
  //         //     </button>
  //         //     <button
  //         //       onClick={() => handleDelete(q.id)}
  //         //       className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-full transition-all"
  //         //       title="Delete Question"
  //         //     >
  //         //       <FaTrash className="w-4 h-4" />
  //         //     </button>
  //         //   </div>

  //         <div className="flex space-x-3 justify-center items-center h-full">
  //           <GoPencil
  //             size={20}
  //             onClick={() => handleEdit(q)}
  //             className="cursor-pointer text-yellow-600"
  //             title="Edit Question"
  //           />

  //           <MdOutlineDoNotDisturbAlt
  //             size={18}
  //             onClick={() => handleDelete(q.id)}
  //             className="cursor-pointer text-red-600"
  //             title="Delete Question"
  //           />
  //         </div>
  //       );
  //     },
  //     width: 100,
  //     minWidth: 100,
  //     maxWidth: 100,
  //     cellStyle: { textAlign: "center" as const },
  //     filter: false,
  //     sortable: false,
  //   }
  // ], []);

  return (
    <div className="p-6 bg-[#f4f7f9] min-h-screen">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">

        {/* Header Title */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-2">
          <div className="flex justify-between items-center">
            <h2 className="text-xl leading-6 font-medium text-gray-900 border-b pb-4 w-full">
              Manage MTE Question Paper Details
            </h2>
            <div className="flex gap-3 ml-auto">
              <button
                onClick={() => navigate("/assessment/manage_mte_qp")}
                className="px-6 py-2 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-md shadow-sm transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>

        {/* SECTION 1: Edit MTE Framework */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
          <button
            type="button"
            className="w-full px-6 py-4 flex justify-between items-center bg-gray-50 border-b hover:bg-gray-100 transition-colors"
            onClick={() => toggleSection("framework")}
          >
            <h3 className="text-lg font-semibold text-gray-800">
              Edit MTE Framework
            </h3>
            <ChevronIcon expanded={expandedSections.framework} />
          </button>

          {expandedSections.framework && (
            <div className="p-6">
              {/* Header Details (Dynamic) */}
              <div className="mb-8">
                <h4 className="text-md font-semibold text-gray-700 mb-4 border-b pb-2">
                  Curriculum Details
                </h4>
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="flex-1">
                    <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Curriculum
                    </span>
                    <p className="text-md font-medium text-gray-900 border-b border-gray-200 pb-1">
                      <span className="font-bold">{curriculumName}</span>
                    </p>
                  </div>
                  <div className="flex-1">
                    <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Term
                    </span>
                    <p className="text-md font-medium text-gray-900 border-b border-gray-200 pb-1">
                      <span className="font-bold">{termName}</span>
                    </p>
                  </div>
                  <div className="flex-1">
                    <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Course
                    </span>
                    <p className="text-md font-medium text-gray-900 border-b border-gray-200 pb-1">
                      {resolvedCourseData?.crs_code || frameworkData?.crs_code || ""} - <span className="font-bold">{courseName}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Add MTE Framework Form Base */}
              <div className="bg-gray-50/50 border hover:border-blue-300 transition-colors duration-200 rounded-lg p-5 mb-8">
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                  <h4 className="text-md font-semibold text-gray-700">
                    {qpfId ? "Update MTE Framework" : "Add MTE Framework"}
                  </h4>
                  <button
                    onClick={handleSaveFramework}
                    disabled={loading || !!errors.title || !!errors.duration || !!errors.maxMarks || !!errors.grandTotal}
                    className="px-4 py-1.5 text-xs font-semibold text-white button-bg rounded-md shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Saving..." : "Save"}
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Title */}
                  <div className="md:col-span-2">
                    <label className="block text-[13px] font-semibold text-[#5c6773] mb-1">
                      Question Paper Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={frameworkForm.title}
                      onChange={(e) => {
                        setFrameworkForm({ ...frameworkForm, title: e.target.value });
                        if (errors.title) setErrors((prev: any) => { const { title, ...rest } = prev; return rest; });
                      }}
                      className={`w-full px-3 py-2 text-sm border ${showErrors && errors.title ? "border-red-500" : "border-gray-300"} rounded-md focus:outline-none focus:ring-2 focus:ring-[#437880]`}
                    />
                    {showErrors && errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
                  </div>

                  {/* Row 2: Duration & Course */}
                  <div>
                    <label className="block text-[13px] font-semibold text-[#5c6773] mb-1">
                      Total Duration (H:M) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={frameworkForm.duration}
                      onChange={(e) => {
                        setFrameworkForm({ ...frameworkForm, duration: e.target.value });
                        if (errors.duration) setErrors((prev: any) => { const { duration, ...rest } = prev; return rest; });
                      }}
                      className={`w-full px-3 py-2 text-sm border ${showErrors && errors.duration ? "border-red-500" : "border-gray-300"} rounded-md focus:outline-none focus:ring-2 focus:ring-[#437880]`}
                    />
                    {showErrors && errors.duration && <p className="text-xs text-red-500 mt-1">{errors.duration}</p>}
                  </div>
                  <div>
                    <label className="block text-[13px] font-semibold text-[#5c6773] mb-1">
                      Course
                    </label>
                    <input
                      type="text"
                      value={resolvedCourseData?.crs_code || ""}
                      readOnly
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-gray-100 text-gray-500 focus:outline-none cursor-not-allowed"
                    />
                  </div>

                  {/* Row 3: Maximum Marks & Grand Total */}
                  <div>
                    <label className="block text-[13px] font-semibold text-[#5c6773] mb-1">
                      Maximum Marks <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={frameworkForm.maxMarks}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "" || /^\d*$/.test(val)) {
                          setFrameworkForm({ ...frameworkForm, maxMarks: val === "" ? "" : Number(val) });
                          if (errors.maxMarks) setErrors((prev: any) => { const { maxMarks, ...rest } = prev; return rest; });
                        }
                      }}
                      className={`w-full px-3 py-2 text-sm border ${showErrors && errors.maxMarks ? "border-red-500" : "border-gray-300"} rounded-md focus:outline-none focus:ring-2 focus:ring-[#437880]`}
                    />
                    {showErrors && errors.maxMarks && <p className="text-xs text-red-500 mt-1">{errors.maxMarks}</p>}
                  </div>
                  <div>
                    <label className="block text-[13px] font-semibold text-[#5c6773] mb-1">
                      Grand Total
                    </label>
                    <input
                      type="text"
                      value={frameworkForm.grandTotal}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "" || /^\d*$/.test(val)) {
                          setFrameworkForm({ ...frameworkForm, grandTotal: val === "" ? "" : Number(val) });
                          if (errors.grandTotal) setErrors((prev: any) => { const { grandTotal, ...rest } = prev; return rest; });
                          if (errors.sectionsSum) setErrors((prev: any) => { const { sectionsSum, ...rest } = prev; return rest; });
                        }
                      }}
                      className={`w-full px-3 py-2 text-sm border ${showErrors && errors.grandTotal ? "border-red-500" : "border-gray-300"} rounded-md focus:outline-none focus:ring-2 focus:ring-[#437880]`}
                    />
                    {showErrors && errors.grandTotal && <p className="text-xs text-red-500 mt-1">{errors.grandTotal}</p>}
                  </div>

                  {/* Note */}
                  <div className="md:col-span-2">
                    <label className="block text-[13px] font-semibold text-[#5c6773] mb-1">
                      Note
                    </label>
                    <textarea
                      rows={3}
                      value={frameworkForm.note}
                      onChange={(e) => setFrameworkForm({ ...frameworkForm, note: e.target.value })}
                      placeholder="Add any specific instructions or notes..."
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#437880] resize-none"
                    ></textarea>
                  </div>
                </div>
              </div>

              {/* Sections / Parts Builder Upper Table */}
              <div className="mb-8">
                <h4 className="text-md font-semibold text-gray-700 mb-4">
                  Manage Section / Parts (Units) Distribution
                </h4>
                <div className="bg-white border border-gray-200 rounded-lg p-5">
                  <div className="overflow-x-auto mb-4">
                    <table className="w-full text-sm text-left text-gray-500">
                      <thead className="text-[13px] font-semibold text-[#5c6773] tracking-normal bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th scope="col" className="px-4 py-3 border-r w-16 text-center">Sl No.</th>
                          <th scope="col" className="px-4 py-3 border-r">Section Name</th>
                          <th scope="col" className="px-4 py-3 border-r">No. of Questions</th>
                          <th scope="col" className="px-4 py-3 border-r">Max Marks</th>
                          <th scope="col" className="px-4 py-3 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sections.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-[13px] text-[#5c6773]">
                              No units added yet.
                            </td>
                          </tr>
                        ) : (
                          sections.map((section, index) => (
                            <tr key={section.id} className="border-b hover:bg-gray-50">
                              <td className="px-4 py-3 border-r font-medium text-gray-900 text-center">
                                {index + 1}
                              </td>
                              <td className="px-4 py-2 border-r">
                                <input
                                  type="text"
                                  value={section.name}
                                  onChange={(e) => {
                                    handleSectionChange(section.id, "name", e.target.value);
                                    if (errors.tableSectionErrors?.[section.id]?.name) {
                                      const newTableErrs = { ...errors.tableSectionErrors };
                                      delete newTableErrs[section.id].name;
                                      if (Object.keys(newTableErrs[section.id]).length === 0) delete newTableErrs[section.id];
                                      setErrors((prev: any) => ({ ...prev, tableSectionErrors: newTableErrs }));
                                    }
                                  }}
                                  className={`w-full px-2 py-1 text-sm border-0 bg-transparent focus:ring-1 ${showErrors && errors.tableSectionErrors?.[section.id]?.name ? "focus:ring-red-500 text-red-600" : "focus:ring-blue-500"} rounded`}
                                />
                                {showErrors && errors.tableSectionErrors?.[section.id]?.name && <p className="text-[10px] text-red-500">{errors.tableSectionErrors[section.id].name}</p>}
                              </td>
                              <td className="px-4 py-2 border-r">
                                <input
                                  type="text"
                                  value={section.numberOfQuestions}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === "" || /^\d*$/.test(val)) {
                                      handleSectionChange(section.id, "numberOfQuestions", val);
                                      if (errors.tableSectionErrors?.[section.id]?.numberOfQuestions) {
                                        const newTableErrs = { ...errors.tableSectionErrors };
                                        delete newTableErrs[section.id].numberOfQuestions;
                                        if (Object.keys(newTableErrs[section.id]).length === 0) delete newTableErrs[section.id];
                                        setErrors((prev: any) => ({ ...prev, tableSectionErrors: newTableErrs }));
                                      }
                                    }
                                  }}
                                  className={`w-full px-2 py-1 text-sm border-0 bg-transparent focus:ring-1 ${showErrors && errors.tableSectionErrors?.[section.id]?.numberOfQuestions ? "focus:ring-red-500 text-red-600" : "focus:ring-blue-500"} rounded`}
                                />
                                {showErrors && errors.tableSectionErrors?.[section.id]?.numberOfQuestions && <p className="text-[10px] text-red-500">{errors.tableSectionErrors[section.id].numberOfQuestions}</p>}
                              </td>
                              <td className="px-4 py-2 border-r">
                                <input
                                  type="text"
                                  value={section.maxMarks}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === "" || /^\d*$/.test(val)) {
                                      handleSectionChange(section.id, "maxMarks", val);
                                      if (errors.tableSectionErrors?.[section.id]?.maxMarks) {
                                        const newTableErrs = { ...errors.tableSectionErrors };
                                        delete newTableErrs[section.id].maxMarks;
                                        if (Object.keys(newTableErrs[section.id]).length === 0) delete newTableErrs[section.id];
                                        setErrors((prev: any) => ({ ...prev, tableSectionErrors: newTableErrs }));
                                      }
                                      if (errors.sectionsSum) setErrors((prev: any) => { const { sectionsSum, ...rest } = prev; return rest; });
                                    }
                                  }}
                                  className={`w-full px-2 py-1 text-sm border-0 bg-transparent focus:ring-1 ${showErrors && errors.tableSectionErrors?.[section.id]?.maxMarks ? "focus:ring-red-500 text-red-600" : "focus:ring-[#437880]"} rounded`}
                                />
                                {showErrors && errors.tableSectionErrors?.[section.id]?.maxMarks && <p className="text-[10px] text-red-500">{errors.tableSectionErrors[section.id].maxMarks}</p>}
                              </td>
                              <td className="px-4 py-2">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSection(section.id)}
                                  className="text-red-500 hover:text-red-700 font-medium px-2"
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  {showErrors && errors.sectionsSum && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-md">
                      <p className="text-sm text-red-500">{errors.sectionsSum}</p>
                    </div>
                  )}
                  <div className="flex justify-end pt-2 border-t border-gray-100">
                    <button
                      disabled={loading || (showErrors && (!!errors.sectionsSum || (errors.tableSectionErrors && Object.keys(errors.tableSectionErrors).length > 0)))}
                      onClick={handleUpdateSections}
                      className="px-5 py-2 text-sm font-medium text-white button-bg rounded-md transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Update
                    </button>
                  </div>
                </div>
              </div>

              {/* Add Unit Form Section */}
              <div>
                <h4 className="text-md font-semibold text-gray-700 mb-4">
                  Add Unit
                </h4>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
                  <div className="flex flex-col md:flex-row gap-4 items-end mb-4">
                    <div className="flex-1 w-full">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Section/Parts Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Section B"
                        value={newSection.name}
                        onChange={(e) => {
                          setNewSection({ ...newSection, name: e.target.value });
                          if (errors.newName) setErrors((prev: any) => { const { newName, ...rest } = prev; return rest; });
                        }}
                        className={`w-full px-3 py-2 text-sm border ${showErrors && errors.newName ? "border-red-500" : "border-gray-300"} rounded-md focus:outline-none focus:ring-2 focus:ring-[#437880] bg-white`}
                      />
                      {showErrors && errors.newName && <p className="text-xs text-red-500 mt-1">{errors.newName}</p>}
                    </div>
                    <div className="flex-1 w-full">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        No. of Questions <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Enter count"
                        value={newSection.numberOfQuestions}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "" || /^\d*$/.test(val)) {
                            setNewSection({ ...newSection, numberOfQuestions: val });
                            if (errors.newNumberOfQuestions) setErrors((prev: any) => { const { newNumberOfQuestions, ...rest } = prev; return rest; });
                          }
                        }}
                        className={`w-full px-3 py-2 text-sm border ${showErrors && errors.newNumberOfQuestions ? "border-red-500" : "border-gray-300"} rounded-md focus:outline-none focus:ring-2 focus:ring-[#437880] bg-white`}
                      />
                      {showErrors && errors.newNumberOfQuestions && <p className="text-xs text-red-500 mt-1">{errors.newNumberOfQuestions}</p>}
                    </div>
                    <div className="flex-1 w-full">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Max Marks <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Enter marks"
                        value={newSection.maxMarks}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "" || /^\d*$/.test(val)) {
                            setNewSection({ ...newSection, maxMarks: val });
                            if (errors.newMaxMarks) setErrors((prev: any) => { const { newMaxMarks, ...rest } = prev; return rest; });
                            if (errors.sectionsSum) setErrors((prev: any) => { const { sectionsSum, ...rest } = prev; return rest; });
                          }
                        }}
                        className={`w-full px-3 py-2 text-sm border ${showErrors && errors.newMaxMarks ? "border-red-500" : "border-gray-300"} rounded-md focus:outline-none focus:ring-2 focus:ring-[#437880] bg-white`}
                      />
                      {showErrors && errors.newMaxMarks && <p className="text-xs text-red-500 mt-1">{errors.newMaxMarks}</p>}
                    </div>
                  </div>
                  <div className="flex justify-end pt-4 border-t border-gray-200 mt-2">
                    <button
                      onClick={handleSaveNewSection}
                      className="px-5 py-2 text-sm font-medium text-white button-bg rounded-md transition-colors shadow-sm"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 2: Manage Questions */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
          <button
            type="button"
            className="w-full px-6 py-4 flex justify-between items-center bg-gray-50 border-b hover:bg-gray-100 transition-colors"
            onClick={() => toggleSection("questions")}
          >
            <h3 className="text-lg font-semibold text-gray-800">
              Manage Questions
            </h3>
            <ChevronIcon expanded={expandedSections.questions} />
          </button>

          {expandedSections.questions && (
            <div className="p-6">
              <div 
                className="text-center text-[#0056b3] text-[11px] font-bold uppercase tracking-tight py-2 bg-blue-50/30 rounded border border-blue-100/50 mb-4"
                dangerouslySetInnerHTML={{ __html: '<marquee direction="right" scrollamount="5">Questions can be mapped with OR feature.</marquee>' }}
              />

              <div className="flex justify-between items-center mb-6">
                <h4 className="text-md font-semibold text-gray-700">
                  Questions List
                </h4>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (questions.length === 0) {
                        toast.info("Please add at least two questions before mapping.");
                        return;
                      }
                      handleMapOrQuestions();
                    }}
                    className="px-4 py-2 text-sm font-bold text-white button-bg rounded-md shadow-sm transition-all flex items-center gap-2"
                  >
                    Map OR Questions
                  </button>
                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="px-4 py-2 text-sm font-bold text-white button-bg rounded-md shadow-sm transition-all flex items-center gap-2"
                  >
                    Add Question
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center mb-5 text-sm text-slate-500">
                <div className="flex items-center gap-2 font-semibold">
                  Show 
                  <select 
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="border border-slate-300 rounded px-2 py-1 bg-white focus:outline-none text-slate-700"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  entries
                </div>
                <div className="flex items-center gap-2 font-semibold">
                  Search: 
                  <input 
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="border border-slate-300 rounded px-2 py-1 focus:outline-none w-52" 
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse border border-slate-200">
                  <thead className="bg-[#f4f7f9]">
                    <tr>
                      <th className="p-3 border border-slate-200 text-sm font-bold text-slate-700 w-20 text-center uppercase">Q.No.</th>
                      <th className="p-3 border border-slate-200 text-sm font-bold text-slate-700 px-4 uppercase">Question</th>
                      <th className="p-3 border border-slate-200 text-sm font-bold text-slate-700 uppercase">Course Outcome</th>
                      <th className="p-3 border border-slate-200 text-sm font-bold text-slate-700 uppercase">Bloom's Level</th>
                      <th className="p-3 border border-slate-200 text-sm font-bold text-slate-700 w-28 text-center uppercase">Marks</th>
                      <th className="p-3 border border-slate-200 text-sm font-bold text-slate-700 w-20 text-center uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sections.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-gray-500 italic text-sm">No sections defined.</td>
                      </tr>
                    ) : (
                      sections.map((section, sIdx) => {
                        const sectionQuestions = paginatedQuestions.filter(q => String(q.unit_id) === section.id);
                        if (sectionQuestions.length === 0 && !searchTerm) return null; // Hide empty sections unless searching

                        const sectionTotalMarks = calculateSectionMarks(section.id);

                        return (
                          <React.Fragment key={section.id}>
                            <tr className="bg-gray-50 border-t border-slate-200">
                              <td colSpan={6} className="p-2.5 border border-slate-200 text-sm font-bold text-slate-800 uppercase tracking-widest px-4 bg-gray-100">
                                {section.name}
                              </td>
                            </tr>
                            <tr className="bg-white">
                              <td colSpan={4} className="p-0 border border-slate-200"></td>
                              <td colSpan={1} className="p-2 border border-slate-200 text-sm font-bold text-slate-500 text-right whitespace-nowrap">
                                Section Marks : <span className="text-[#0056b3]">{sectionTotalMarks.toFixed(2)} / {parseFloat(section.maxMarks || "0").toFixed(2)}</span>
                              </td>
                              <td colSpan={1} className="p-2 border border-slate-200 text-sm font-bold text-slate-500 text-right whitespace-nowrap">
                                Grand Total Marks : <span className="text-[#0056b3]">{totalQuestionMarks.toFixed(2)} / {parseFloat(String(frameworkForm.grandTotal || "0")).toFixed(2)}</span>
                              </td>
                            </tr>
                            {sectionQuestions.map((q, qIdx) => (
                              <tr key={q.id} className="bg-white hover:bg-slate-50 transition-colors">
                                <td className="p-3 border border-slate-200 text-sm text-slate-600 text-center font-medium">
                                <span>{q.main_question_no}{q.sub_question_no}</span>
                                </td>
                                <td className="p-3 border border-slate-200 text-sm text-slate-600 px-4">
                                  <div dangerouslySetInnerHTML={{ __html: q.question }} />
                                </td>
                                <td className="p-3 border border-slate-200 text-sm text-slate-600">
                                  {q.cos}
                                </td>
                                <td className="p-3 border border-slate-200 text-sm text-[#007bff] font-bold">
                                  {q.blooms}
                                </td>
                                <td className="p-3 border border-slate-200 text-sm text-slate-900 font-bold text-center">
                                  {Number(q.marks).toFixed(2)}
                                </td>
                                <td className="p-3 border border-slate-200 text-center">
                                  <div className="flex space-x-3 justify-center items-center">
                                    <GoPencil
                                      size={18}
                                      onClick={() => handleEdit(q)}
                                      className="cursor-pointer text-yellow-600 hover:scale-110 transition-transform"
                                      title="Edit Question"
                                    />
                                    <MdOutlineDoNotDisturbAlt
                                      size={18}
                                      onClick={() => handleDelete(q.id)}
                                      className="cursor-pointer text-red-600 hover:scale-110 transition-transform"
                                      title="Delete Question"
                                    />
                                  </div>
                                </td>
                              </tr>
                            ))}
                            {sectionQuestions.length === 0 && searchTerm && (
                              <tr>
                                <td colSpan={6} className="p-4 text-center text-gray-400 italic text-[11px]">No matching questions in this section.</td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                    )}
                    {filteredQuestions.length === 0 && searchTerm && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-gray-500 font-medium">No results found for "{searchTerm}"</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center mt-6 text-sm text-slate-500 font-medium pb-2">
                <span>
                  Showing {filteredQuestions.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to {Math.min(currentPage * pageSize, filteredQuestions.length)} of {filteredQuestions.length} entries
                </span>
                <div className="flex items-center -space-x-px">
                  <button 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    className="px-4 py-2 bg-white text-slate-400 border border-slate-200 rounded-l hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold text-xs tracking-tight"
                  >
                    ← Previous
                  </button>
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button 
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`px-4 py-2 border border-slate-200 font-bold text-xs ${currentPage === i + 1 ? "bg-slate-100 text-slate-700" : "bg-white text-slate-500 hover:bg-slate-50"}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button 
                    disabled={currentPage === totalPages || totalPages === 0}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    className="px-4 py-2 bg-white text-slate-400 border border-slate-200 rounded-r hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold text-xs tracking-tight"
                  >
                    Next →
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 3: Question Paper Analysis */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
          <button
            type="button"
            className="w-full px-6 py-4 flex justify-between items-center bg-gray-100 hover:bg-gray-200 transition-colors"
            onClick={() => toggleSection("analysis")}
          >
            <h3 className="text-lg font-semibold text-gray-800">
              Question Paper Analysis
            </h3>
            <ChevronIcon expanded={expandedSections.analysis} />
          </button>

          {expandedSections.analysis && (
            <div className="p-6 flex flex-col gap-10">

              {/* 1. Bloom's Level Marks Distribution based on equal Weightage % */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-100 px-4 py-3 border-b border-gray-200">
                  <h4 className="text-sm font-bold text-gray-700 uppercase tracking-tight">
                    Bloom's Level Marks Distribution based on equal Weightage %
                  </h4>
                </div>
                <div className="p-5 flex flex-col lg:flex-row gap-8 items-center lg:items-start">
                  {/* Left Chart */}
                  <div className="w-full lg:w-1/2 h-[300px]">

                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={bloomsEqualData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="45%"
                          outerRadius={120}
                          fill="#8884d8"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {bloomsEqualData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Right Table */}
                  <div className="w-full lg:w-1/2">
                    <table className="w-full text-sm text-left text-gray-500 border border-gray-200 rounded-lg overflow-hidden">
                      <thead className="text-[13px] font-semibold text-[#5c6773] tracking-normal bg-gray-50 border-b">
                        <tr>
                          <th className="px-4 py-3 border-r">Bloom's Level</th>
                          <th className="px-4 py-3 border-r">Marks Distribution (X)</th>
                          <th className="px-4 py-3 text-center">% Distribution</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bloomsEqualData.length === 0 ? (
                          <tr><td colSpan={3} className="px-4 py-8 text-center text-[13px] text-[#5c6773]">No Data</td></tr>
                        ) : (
                          bloomsEqualData.map((item, idx) => (
                            <tr key={idx} className="border-b">
                              <td className="px-4 py-3 font-medium border-r">{item.name}</td>
                              <td className="px-4 py-3 border-r">{(item.value).toFixed(2)}</td>
                              <td className="px-4 py-3 font-semibold text-blue-600">
                                {((item.value / bloomsEqualData.reduce((acc, i) => acc + i.value, 0)) * 100).toFixed(2)} %
                              </td>
                            </tr>
                          ))
                        )}
                        <tr className="bg-gray-50 font-bold border-t-2 border-gray-200">
                          <td className="px-4 py-3 border-r">Total</td>
                          <td className="px-4 py-3 border-r">
                            {(bloomsEqualData.reduce((acc, i) => acc + i.value, 0)).toFixed(2)} ({(bloomsEqualData.reduce((acc, i) => acc + i.value, 0)).toFixed(2)})
                          </td>
                          <td className="px-4 py-3 text-blue-700">100.00 %</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* 2. Bloom's Level Marks Distribution based on actual Weightage % */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-100 px-4 py-3 border-b border-gray-200">
                  <h4 className="text-sm font-bold text-gray-700 uppercase tracking-tight">
                    Bloom's Level Marks Distribution based on actual Weightage %
                  </h4>
                </div>
                <div className="p-5 flex flex-col lg:flex-row gap-8 items-center lg:items-start">

                  {/* Left Chart */}
                  <div className="w-full lg:w-1/2 h-[350px] min-h-[300px] flex items-center justify-center">
                    {bloomsData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={bloomsData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="45%"
                            outerRadius={120}
                            fill="#8884d8"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {bloomsData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-gray-400 gap-2">
                        <FaQuestionCircle className="w-12 h-12 opacity-20" />
                        <p className="text-sm italic">No Bloom's actual data available</p>
                      </div>
                    )}
                  </div>

                  {/* Right Table */}
                  <div className="w-full lg:w-1/2">
                    <table className="w-full text-sm text-left text-gray-500 border border-gray-200 rounded-lg overflow-hidden">
                      <thead className="text-[13px] font-semibold text-[#5c6773] tracking-normal bg-gray-50 border-b">
                        <tr>
                          <th className="px-4 py-3 border-r">Bloom's Level</th>
                          <th className="px-4 py-3 border-r">Marks Distribution (X)</th>
                          <th className="px-4 py-3 text-center">% Distribution</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bloomsData.length === 0 ? (
                          <tr><td colSpan={3} className="px-4 py-4 text-center">No Data</td></tr>
                        ) : (
                          bloomsData.map((item, idx) => (
                            <tr key={idx} className="border-b">
                              <td className="px-4 py-3 font-medium border-r">{item.name}</td>
                              <td className="px-4 py-3 border-r">{(item.value).toFixed(2)}</td>
                              <td className="px-4 py-3 font-semibold text-blue-600">
                                {((item.value / bloomsData.reduce((acc, i) => acc + i.value, 0)) * 100).toFixed(2)} %
                              </td>
                            </tr>
                          ))
                        )}
                        <tr className="bg-gray-50 font-bold border-t-2 border-gray-200">
                          <td className="px-4 py-3 border-r">Total</td>
                          <td className="px-4 py-3 border-r">
                            {(bloomsData.reduce((acc, i) => acc + i.value, 0)).toFixed(2)} ({bloomsData.reduce((acc, i) => acc + i.value, 0).toFixed(2)})
                          </td>
                          <td className="px-4 py-3 text-blue-700">100.00 %</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="px-5 pb-5">
                  <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                    <p className="text-xs text-blue-800 leading-relaxed font-medium">
                      <span className="font-bold underline mr-2 italic">Note:</span>
                      The above pie chart depicts the individual Bloom's Level actual marks percentage distribution as in the question paper. X = Individual Bloom's Level marks, Y = Sum of all Bloom's Level marks, % Distribution = (X / Y) * 100
                    </p>
                  </div>
                </div>
              </div>

              {/* 3. Course Outcome Marks Distribution */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-100 px-4 py-3 border-b border-gray-200">
                  <h4 className="text-sm font-bold text-gray-700 uppercase tracking-tight">
                    Course Outcome Marks Distribution
                  </h4>
                </div>
                <div className="p-5 flex flex-col lg:flex-row gap-8 items-center lg:items-start">

                  {/* Left Chart */}
                  <div className="w-full lg:w-1/2 h-[350px] min-h-[300px] flex items-center justify-center">
                    {coData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={coData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="45%"
                            outerRadius={120}
                            fill="#82ca9d"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {coData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-gray-400 gap-2">
                        <FaCheck className="w-12 h-12 opacity-20" />
                        <p className="text-sm italic">No Course Outcome data available</p>
                      </div>
                    )}
                  </div>

                  {/* Right Table */}
                  <div className="w-full lg:w-1/2">
                    <table className="w-full text-sm text-left text-gray-500 border border-gray-200 rounded-lg overflow-hidden">
                      <thead className="text-[13px] font-semibold text-[#5c6773] tracking-normal bg-gray-50 border-b">
                        <tr>
                          <th className="px-4 py-3 border-r">COs Level</th>
                          <th className="px-4 py-3 border-r">Marks Distribution (X)</th>
                          <th className="px-4 py-3 text-center">% Distribution</th>
                        </tr>
                      </thead>
                      <tbody>
                        {coData.length === 0 ? (
                          <tr><td colSpan={3} className="px-4 py-4 text-center">No Data</td></tr>
                        ) : (
                          coData.map((item, idx) => (
                            <tr key={idx} className="border-b">
                              <td className="px-4 py-3 font-medium border-r">{item.name}</td>
                              <td className="px-4 py-3 border-r">{(item.value).toFixed(2)}</td>
                              <td className="px-4 py-3 font-semibold text-green-600">
                                {((item.value / coData.reduce((acc, i) => acc + i.value, 0)) * 100).toFixed(2)} %
                              </td>
                            </tr>
                          ))
                        )}
                        <tr className="bg-gray-50 font-bold border-t-2 border-gray-200">
                          <td className="px-4 py-3 border-r">Total</td>
                          <td className="px-4 py-3 border-r">
                            {(coData.reduce((acc, i) => acc + i.value, 0)).toFixed(2)} ({coData.reduce((acc, i) => acc + i.value, 0).toFixed(2)})
                          </td>
                          <td className="px-4 py-3 text-green-700">100.00 %</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="px-5 pb-5">
                  <div className="bg-green-50/50 p-4 rounded-lg border border-green-100">
                    <p className="text-xs text-green-800 leading-relaxed font-medium">
                      <span className="font-bold underline mr-2 italic">Note:</span>
                      The above pie chart depicts the individual Course Outcome(COs) wise actual marks percentage distribution as in the question paper. X = Individual Course Outcome marks, Y = Sum of all Course Outcomes marks, % Distribution = (X / Y) * 100
                    </p>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>

      </div>

      {/* Edit/Add Question Modal */}
      {isQuestionModalOpen && (
        <AddQuestionModal
          isOpen={isQuestionModalOpen}
          onClose={() => {
            setIsQuestionModalOpen(false);
            setEditingQuestion(null);
          }}
          onSave={handleSaveQuestion}
          mode={modalMode}
          editingQuestion={editingQuestion}
          units={sections.map(s => ({ id: s.id, name: s.name }))}
          qpfId={qpfId}
          courseId={resolvedCourseData?.crs_id}
          batchId={resolvedCourseData?.academic_batch_id || filters?.academic_batch_id}
          termId={resolvedCourseData?.semester_id || filters?.semester_id}
          questions={questions}
          sections={sections}
          maxMarks={frameworkForm.maxMarks}
          grandTotal={frameworkForm.grandTotal}
          curriculumName={curriculumName}
          termName={termName}
        />
      )}
      <OrMappingModal
        isOpen={isOrMappingModalOpen}
        onClose={() => setIsOrMappingModalOpen(false)}
        onSave={handleMapOrQuestionsSave}
        questions={questions}
        initialMappings={existingMappings}
      />

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmConfig?.onConfirm || (() => { })}
        title={confirmConfig?.title || "Confirmation"}
        message={confirmConfig?.message || "Are you sure?"}
      />
    </div>
  );
};

export default ManageMteDetailsPage;

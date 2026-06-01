import React, { useEffect, useState, useCallback, useMemo } from "react";
import "./CourseOutcome.css";
import {
  FaPlus,
  FaExchangeAlt,
  FaPencilAlt,
  FaCheck,
  FaQuestionCircle,
  FaTimes,
  FaDownload,
} from "react-icons/fa";
import { MdOutlineDoNotDisturbAlt } from "react-icons/md";
import { GoPencil } from "react-icons/go";
import { useNavigate } from "react-router-dom";
import DynamicFormBuilder, {
  DynamicFormHandle,
} from "../../../../components/FormBuilder/DynamicFormBuilder";
import {
  getCurriculumList,
  getSemesterList,
  getCourseList,
  getCoCodes,
  getBloomLevels,
  getDeliveryMethods,
  getCourseOutcomeList,
  saveCourseOutcome,
  editCourseOutcome,
  deleteCourseOutcome,
  getValidationSchema,
  normalize,
  SchemaFields,
  SchemaColumnDefs,
} from "./courseOutcomeSchema";
import {
  Curriculum,
  Semester,
  Course,
  BloomLevel,
  DeliveryMethod,
} from "./types";
import { toast } from "react-toastify";
import DataTable from "../../../../components/Table/DataTable";
import ConfirmDialog from "../../../../components/Dialog/ConfirmDialog";
import CourseDataImportModal from "./CourseDataImportModal";

const CourseOutcomePage = () => {
  const navigate = useNavigate();
  const formRef = React.useRef<DynamicFormHandle>(null);
  const [isPreReqOpen, setIsPreReqOpen] = useState(false);
  const [preReqText, setPreReqText] = useState("");

  // Base Data Lists
  const [curriculumList, setCurriculumList] = useState<Curriculum[]>([]);
  const [semesterList, setSemesterList] = useState<Semester[]>([]);
  const [courseList, setCourseList] = useState<Course[]>([]);
  const [coCodeList, setCoCodeList] = useState<any[]>([]);
  const [bloomLevelList, setBloomLevelList] = useState<BloomLevel[]>([]);
  const [deliveryMethodList, setDeliveryMethodList] = useState<
    DeliveryMethod[]
  >([]);

  // Selection States with Session Persistence
  const [filters, setFilters] = useState(() => {
    const saved = sessionStorage.getItem("course_outcome_filters");
    return saved
      ? JSON.parse(saved)
      : {
          curriculum_id: "",
          semester_id: "",
          course_id: "",
        };
  });

  useEffect(() => {
    sessionStorage.setItem("course_outcome_filters", JSON.stringify(filters));
  }, [filters]);

  // Table Data
  const [courseOutcomes, setCourseOutcomes] = useState<any[]>([]);

  // Modal & Dialog States
  const [viewMode, setViewMode] = useState<"list" | "add" | "edit">("list");
  const [editingData, setEditingData] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<any | null>(null);
  const [confirmMessage, setConfirmMessage] = useState("");

  // Course Data Import Modal State
  const [showImportModal, setShowImportModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [targetContext, setTargetContext] = useState<{
    curriculum: string;
    term: string;
    courseName: string;
    courseMode: string;
    target_course_id: number;
    target_batch_id: number;
    target_semester_id: number;
  } | null>(null);

  useEffect(() => {
    loadBaseData();
  }, []);

  const schema = useMemo(() => {
    return getValidationSchema(courseOutcomes, editingData?.id);
  }, [courseOutcomes, editingData]);

  useEffect(() => {
    if (filters.curriculum_id && filters.semester_id && filters.course_id) {
      loadCourseOutcomes(
        Number(filters.curriculum_id),
        Number(filters.semester_id),
        Number(filters.course_id),
      );
    } else {
      setCourseOutcomes([]);
    }
  }, [filters.curriculum_id, filters.semester_id, filters.course_id]);

  const loadBaseData = async () => {
    const curRes = await getCurriculumList();
    if (curRes.status && curRes.data) setCurriculumList(curRes.data);

    // Hydrate sequentially if filters are present in session
    if (filters.curriculum_id) {
      const semRes = await getSemesterList(Number(filters.curriculum_id));
      if (semRes.status && semRes.data) setSemesterList(semRes.data);

      if (filters.semester_id) {
        const crsRes = await getCourseList(
          Number(filters.curriculum_id),
          Number(filters.semester_id),
        );
        if (crsRes.status && crsRes.data) setCourseList(crsRes.data);
      }
    }

    const coRes = await getCoCodes();
    if (coRes.status && coRes.data) setCoCodeList(coRes.data);

    const bloRes = await getBloomLevels();
    if (bloRes.status && bloRes.data) setBloomLevelList(bloRes.data);

    const delRes = await getDeliveryMethods();
    if (delRes.status && delRes.data) setDeliveryMethodList(delRes.data);
  };

  const handleBatchChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const newFilters = {
      ...filters,
      curriculum_id: val ? Number(val) : "",
      semester_id: "",
      course_id: "",
    };
    setFilters(newFilters);

    if (val) {
      const semRes = await getSemesterList(Number(val));
      if (semRes.status && semRes.data) setSemesterList(semRes.data);
    } else {
      setSemesterList([]);
      setCourseList([]);
    }
  };

  const handleSemesterChange = async (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const val = e.target.value;
    const newFilters = {
      ...filters,
      semester_id: val ? Number(val) : "",
      course_id: "",
    };
    setFilters(newFilters);

    if (val && filters.curriculum_id) {
      const crsRes = await getCourseList(
        Number(filters.curriculum_id),
        Number(val),
      );
      if (crsRes.status && crsRes.data) setCourseList(crsRes.data);
    } else {
      setCourseList([]);
    }
  };

  const handleCourseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setFilters({ ...filters, course_id: val ? Number(val) : "" });
  };

  const loadCourseOutcomes = async (
    batchId: number,
    semId: number,
    crsId: number,
  ) => {
    const res = await getCourseOutcomeList(batchId, semId, crsId);
    if (res.status && res.data) {
      // Pre-process for DataTable display
      const processed = res.data.map((row: any) => ({
        ...row,
        bloom_levels_names: Array.isArray(row.bloom_levels)
          ? row.bloom_levels.map((b: any) => b.bloom_level_name || b).join(", ")
          : "",
        delivery_methods_names: Array.isArray(row.delivery_methods)
          ? row.delivery_methods
              .map((d: any) => d.delivery_method_name || d)
              .join(", ")
          : "",
      }));
      setCourseOutcomes(processed);
    } else {
      setCourseOutcomes([]);
    }
  };

  const openForm = () => {
    if (!filters.curriculum_id || !filters.semester_id || !filters.course_id) {
      toast.warning("Please select Curriculum, Term, and Course first.");
      return;
    }
    setEditingData(null);
    setViewMode("add");
  };

  const handleEdit = useCallback(
    (data: any) => {
      const bloomIds = Array.isArray(data.bloom_levels)
        ? data.bloom_levels.map((b: any) => b.id)
        : [];
      const dmIds = Array.isArray(data.delivery_methods)
        ? data.delivery_methods.map((d: any) => d.id)
        : [];

      const matchedCode = coCodeList.find((c: any) => {
        const codeInList =
          typeof c === "string" ? c : c.code || String(c.id || c);
        return String(codeInList).trim() === String(data.co_code).trim();
      });
      const coCodeId = matchedCode
        ? typeof matchedCode === "string"
          ? matchedCode
          : matchedCode.id !== undefined
            ? matchedCode.id
            : matchedCode
        : data.co_code;

      setEditingData({
        id: data.id,
        co_code_id: coCodeId,
        co_statement: data.co_statement,
        bloom_level_ids: bloomIds,
        delivery_method_ids: dmIds,
        assigned_bloom_levels: data.bloom_levels || [],
        assigned_delivery_methods: data.delivery_methods || [],
      });
      setViewMode("edit");
    },
    [coCodeList],
  );

  const handleDelete = useCallback((co: any) => {
    setDeleteId(co.id);
    setConfirmMessage(
      `Are you sure you want to delete Course Outcome ${co.co_code}?`,
    );
  }, []);

  const confirmDelete = async () => {
    if (deleteId) {
      const res = await deleteCourseOutcome(deleteId); // Triggers hard delete
      if (res.status) {
        toast.success("Course Outcome deleted successfully");
        setDeleteId(null);
        await loadCourseOutcomes(
          Number(filters.curriculum_id),
          Number(filters.semester_id),
          Number(filters.course_id),
        );
        setRefreshKey((k) => k + 1);
      } else {
        toast.error(res.message || "Failed to delete Course Outcome");
      }
    }
  };

  const handleFormSubmit = async (data: any) => {
    const coCodeEntry = coCodeList.find(
      (c: any) => (c.id || c) == data.co_code_id,
    );
    const coCodeStr =
      typeof coCodeEntry === "string"
        ? coCodeEntry
        : coCodeEntry?.code || String(data.co_code_id);

    const payload: any = {
      academic_batch_id: Number(filters.curriculum_id),
      semester_id: Number(filters.semester_id),
      crs_id: Number(filters.course_id),
      co_code: coCodeStr,
      co_statement: data.co_statement,
      bloom_levels: data.bloom_level_ids,
      delivery_methods: data.delivery_method_ids.map((id: number) => {
        const dm =
          deliveryMethodList.find((d: any) => d.id === id) ||
          editingData?.assigned_delivery_methods?.find((d: any) => d.id === id);
        return dm?.delivery_method_name || String(id);
      }),
    };

    if (editingData?.id) {
      payload.clo_id = editingData.id;
    }

    const res = editingData?.id
      ? await editCourseOutcome(payload)
      : await saveCourseOutcome(payload);
    if (res.status) {
      toast.success(
        editingData?.id
          ? "Course Outcome updated successfully"
          : "Course Outcome saved successfully",
      );
      setViewMode("list");
      setEditingData(null);
      loadCourseOutcomes(
        Number(filters.curriculum_id),
        Number(filters.semester_id),
        Number(filters.course_id),
      );
    } else {
      if (res.data && typeof res.data === "object") {
        const backendErrors = res.data;
        if (backendErrors.co_code) {
          formRef.current?.setError("co_code_id", {
            message: backendErrors.co_code,
          });
        }
        if (backendErrors.co_statement) {
          formRef.current?.setError("co_statement", {
            message: backendErrors.co_statement,
          });
        }

        const errorMsgs = Object.values(backendErrors).join("\n");
        toast.error(
          errorMsgs || res.message || "Failed to save Course Outcome",
        );
      } else {
        toast.error(res.message || "Failed to save Course Outcome");
      }
    }
  };

  const columnDefs = useMemo(
    () => [
      ...SchemaColumnDefs,
      {
        headerName: "Action",
        field: "action",
        cellRenderer: (params: any) => (
          <div className="flex space-x-3 justify-center items-center h-full">
            <GoPencil
              size={18}
              onClick={() => handleEdit(params.data)}
              className="cursor-pointer text-yellow-600 hover:text-yellow-700"
              title="Edit"
            />
            <MdOutlineDoNotDisturbAlt
              size={18}
              onClick={() => handleDelete(params.data)}
              className="cursor-pointer text-red-600 hover:text-red-800"
              title="Delete"
            />
          </div>
        ),
        width: 90,
        maxWidth: 100,
        cellStyle: { textAlign: "center" },
        filter: false,
        editable: false,
        sortable: false,
        flex: 0,
      },
    ],
    [handleEdit, handleDelete],
  );

  const dynamicFormFields = useMemo(() => {
    const fields = JSON.parse(JSON.stringify(SchemaFields));
    const groupFields = fields[0].fields as any[];

    // Inject options for CO Codes, excluding ones already used
    const coCodeField = groupFields.find((f) => f.name === "co_code_id");
    if (coCodeField) {
      // Get all normalized CO codes already added to the table
      const usedCoCodes = courseOutcomes.map((co) => normalize(co.co_code));

      coCodeField.options = coCodeList
        .filter((c) => {
          if (!c) return false;
          const codeStr =
            typeof c === "string" ? c : c.code || String(c.id || c);
          if (codeStr.trim() === "") return false;

          const normalizedCode = normalize(codeStr);

          // If we are editing, always keep the currently selected code available
          if (
            editingData &&
            normalize(String(editingData.co_code_id)) === normalizedCode
          ) {
            return true;
          }

          // Exclude codes that are already added
          if (usedCoCodes.includes(normalizedCode)) {
            return false;
          }

          return true;
        })
        .map((c) => ({
          label: typeof c === "string" ? c : c.code,
          value: typeof c === "string" ? c : c.id || c,
        }));
    }

    const bloomField = groupFields.find((f) => f.name === "bloom_level_ids");
    if (bloomField) {
      const options = bloomLevelList.map((b) => ({
        label: b.bloom_level_name,
        value: b.id,
      }));
      if (editingData?.assigned_bloom_levels) {
        editingData.assigned_bloom_levels.forEach((b: any) => {
          if (!options.find((o) => o.value === b.id)) {
            options.push({
              label: `${b.bloom_level_name} (Inactive)`,
              value: b.id,
            });
          }
        });
      }
      bloomField.options = options;
    }

    const dmField = groupFields.find((f) => f.name === "delivery_method_ids");
    if (dmField) {
      const options = deliveryMethodList.map((d) => ({
        label: d.delivery_method_name,
        value: d.id,
      }));
      if (editingData?.assigned_delivery_methods) {
        editingData.assigned_delivery_methods.forEach((d: any) => {
          if (!options.find((o) => o.value === d.id)) {
            options.push({
              label: `${d.delivery_method_name} (Inactive)`,
              value: d.id,
            });
          }
        });
      }
      dmField.options = options;
    }

    return fields;
  }, [
    coCodeList,
    bloomLevelList,
    deliveryMethodList,
    editingData,
    courseOutcomes,
  ]);

  const handleOpenPreReq = () => setIsPreReqOpen(true);
  const handleClosePreReq = () => setIsPreReqOpen(false);
  const handleSavePreReq = () => {
    toast.success("Pre-requisites updated successfully!");
    handleClosePreReq();
  };

  const getCurriculumLabel = (): string => {
    const cur = curriculumList.find(
      (c) => Number(c.id) === Number(filters.curriculum_id),
    );
    return cur ? cur.name : "-";
  };

  const getTermLabel = (): string => {
    const term = semesterList.find(
      (s) => Number(s.id) === Number(filters.semester_id),
    );
    return term ? term.name : "-";
  };

  const getCourseLabel = (): string => {
    const course = courseList.find(
      (c) => Number(c.id) === Number(filters.course_id),
    );
    return course ? course.name : "-";
  };

  const handleBackToList = () => {
    setViewMode("list");
    setEditingData(null);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center pb-5">
        <h3 className="text-lg leading-6 font-medium">
          Course Outcomes (COs) List
        </h3>
      </div>

      {viewMode === "list" ? (
        <>
          <div className="filter-row mb-4 bg-gray-50/30 p-4 rounded-xl border border-gray-100">
            <div className="filter-left">
              <div className="flex items-center gap-2">
                <label className="whitespace-nowrap text-sm font-bold text-gray-700">
                  Curriculum: <span className="text-red-500">*</span>
                </label>
                <select
                  value={filters.curriculum_id || ""}
                  onChange={handleBatchChange}
                  className="w-full sm:w-[250px] px-3 py-1.5 border border-gray-300 rounded shadow-sm text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                >
                  <option value="">Select Curriculum</option>
                  {curriculumList.map((c, index) => (
                    <option key={c.id || index} value={c.id}>
                      {c.name || `Batch ${index + 1}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="whitespace-nowrap text-sm font-bold text-gray-700">
                  Term: <span className="text-red-500">*</span>
                </label>
                <select
                  value={filters.semester_id || ""}
                  onChange={handleSemesterChange}
                  disabled={!filters.curriculum_id}
                  className="w-full sm:w-[150px] px-3 py-1.5 border border-gray-300 rounded shadow-sm text-sm focus:ring-1 focus:ring-blue-500 outline-none disabled:bg-gray-100"
                >
                  <option value="">Select Term</option>
                  {semesterList.map((s, index) => (
                    <option key={s.id || index} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="whitespace-nowrap text-sm font-bold text-gray-700">
                  Course: <span className="text-red-500">*</span>
                </label>
                <select
                  value={filters.course_id || ""}
                  onChange={handleCourseChange}
                  disabled={!filters.semester_id}
                  className="w-full sm:w-[300px] px-3 py-1.5 border border-gray-300 rounded shadow-sm text-sm focus:ring-1 focus:ring-blue-500 outline-none disabled:bg-gray-100"
                >
                  <option value="">Select Course</option>
                  {courseList.map((c, index) => (
                    <option key={c.id || index} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="filter-right">
              <button
                onClick={openForm}
                className="bg-[#4a8494] hover:bg-[#3a6a78] text-white px-6 py-1.5 rounded text-sm font-bold shadow-sm transition-all"
              >
                Add
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center mb-2 px-1">
            <button
              onClick={handleOpenPreReq}
              disabled={!filters.course_id}
              className="text-[#4a8494] hover:bg-[#3a6a78] hover:text-white px-3 py-1.5 rounded text-sm font-bold flex items-center gap-2 transition-all disabled:text-gray-400 disabled:hover:bg-transparent"
            >
              <FaPencilAlt size={13} /> Add / Edit Course Pre-requisites
            </button>
            <button
              onClick={() => {
                setTargetContext({
                  curriculum: getCurriculumLabel(),
                  term: getTermLabel(),
                  courseName: getCourseLabel(),
                  courseMode: "Theory",
                  target_course_id: Number(filters.course_id),
                  target_batch_id: Number(filters.curriculum_id),
                  target_semester_id: Number(filters.semester_id),
                });
                setShowImportModal(true);
              }}
              disabled={!filters.course_id}
              className="text-[#4a8494] hover:bg-[#3a6a78] hover:text-white px-3 py-1.5 rounded text-sm font-bold flex items-center gap-2 transition-all disabled:text-gray-400 disabled:hover:bg-transparent"
            >
              <FaDownload size={13} /> Course Data Import
            </button>
          </div>

          <div className="text-red-600 font-bold text-sm text-center mb-2">
            Review Status : Completed
          </div>

          <DataTable
            key={refreshKey}
            columnDefs={columnDefs}
            rowData={courseOutcomes}
            showAddButton={false}
            headerFilter={false}
          />

          {filters.course_id && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={() =>
                  navigate("/curriculum/co_po_mapping", {
                    state: {
                      passedFilters: {
                        academic_batch_id: filters.curriculum_id,
                        semester_id: filters.semester_id,
                        course_id: filters.course_id,
                      },
                    },
                  })
                }
                className="bg-[#4a8494] hover:bg-[#3a6a78] text-white px-6 py-1.5 rounded text-sm font-bold shadow-sm transition-all"
              >
                Proceed CO to PO Mapping
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              {viewMode === "edit"
                ? "Edit Course Outcome"
                : "Add Course Outcome"}
            </h2>
            <button
              onClick={handleBackToList}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center gap-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
            >
              <FaTimes /> Back to List
            </button>
          </div>

          <div className="bg-[#f8fafc] p-6 rounded-xl mb-8 border border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-6 shadow-sm">
            <div>
              <p className="text-[10px] uppercase font-bold text-gray-400 mb-1 tracking-widest">
                Selected Curriculum
              </p>
              <p className="text-base font-bold text-gray-700 truncate">
                {getCurriculumLabel()}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-gray-400 mb-1 tracking-widest">
                Selected Term
              </p>
              <p className="text-base font-bold text-gray-700">
                {getTermLabel()}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-gray-400 mb-1 tracking-widest">
                Selected Course
              </p>
              <p className="text-base font-bold text-gray-700 truncate">
                {getCourseLabel()}
              </p>
            </div>
          </div>

          <div className="max-w-4xl">
            <DynamicFormBuilder
              ref={formRef}
              key={JSON.stringify(editingData || {})}
              fields={dynamicFormFields}
              schema={schema}
              onSubmit={handleFormSubmit}
              onClose={handleBackToList}
              columnLayout={1}
              initialValues={editingData || {}}
              submitbuttonName={editingData ? "Update Outcome" : "Save Outcome"}
              closebuttonName="Cancel"
            />
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Confirm Delete"
        message={confirmMessage}
      />

      {/* Pre-requisites Modal */}
      {isPreReqOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4 transition-all animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-100 flex flex-col transform transition-all scale-100">
            <div className="bg-white px-6 py-5 flex justify-between items-center text-[#4a8494] relative border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="bg-[#4a8494]/10 p-2 rounded-lg">
                  <FaPencilAlt className="text-[#4a8494]" size={18} />
                </div>
                <h3 className="text-xl font-bold tracking-tight text-[#4a8494]">
                  Course Pre-requisites
                </h3>
              </div>
              <button
                onClick={handleClosePreReq}
                className="hover:bg-gray-100 p-2 rounded-full transition-all duration-200"
              >
                <FaTimes className="text-gray-400" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="bg-blue-50/50 border-l-4 border-blue-400 p-5 rounded-r-xl flex gap-4 items-start">
                <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                  <FaQuestionCircle size={20} />
                </div>
                <p className="text-sm text-blue-800 font-semibold leading-relaxed">
                  Enter the mandatory prerequisites required for this specific
                  course. These details will be helpful for students to
                  understand the baseline knowledge needed.
                </p>
              </div>

              <textarea
                className="w-full h-56 p-5 border-2 border-gray-100 rounded-xl focus:border-[#4a8494] focus:ring-4 focus:ring-[#4a8494]/10 transition-all outline-none text-gray-700 font-medium text-base resize-none"
                placeholder="Ex: Fundamentals of programming, Basic mathematics..."
                value={preReqText}
                onChange={(e) => setPreReqText(e.target.value)}
              />

              <div className="flex justify-end gap-4 pt-6 border-t border-gray-50 items-center">
                <button
                  onClick={handleClosePreReq}
                  className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-800 transition-all uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePreReq}
                  className="bg-[#4a8494] hover:bg-[#3a6a78] text-white px-10 py-3 rounded-xl text-sm font-bold shadow-xl transition-all active:scale-95 uppercase tracking-widest flex items-center gap-2"
                >
                  <FaCheck /> Update Prerequisites
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showImportModal && targetContext && (
        <CourseDataImportModal
          targetContext={targetContext}
          onClose={() => setShowImportModal(false)}
          onSuccess={() => {
            loadCourseOutcomes(
              Number(filters.curriculum_id),
              Number(filters.semester_id),
              Number(filters.course_id),
            );
            setRefreshKey((k) => k + 1);
          }}
          existingCOCount={courseOutcomes.length}
        />
      )}
    </div>
  );
};

export default CourseOutcomePage;

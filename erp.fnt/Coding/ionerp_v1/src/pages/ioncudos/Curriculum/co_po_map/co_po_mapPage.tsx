import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { FaSync, FaPaperPlane, FaCheck, FaTimes } from "react-icons/fa";
import axiosInstance from "../../../../utils/api";
import { toast } from "react-toastify";
import {
  ApiResponse,
  CoPoMapItem,
  CurriculumOption,
  CourseOption,
  CloOption,
  PoOption,
  CoPoMappingData,
  CloPoSavePayload,
  PIMeasuresResponse,
} from "./responseInterface";
import { MAP_LEVEL_OPTIONS } from "./co_po_mapSchema";

// ==================== API FUNCTIONS ====================

const fetchCurriculumOptions = async (): Promise<CurriculumOption[]> => {
  try {
    const response = await axiosInstance.get<ApiResponse<CurriculumOption[]>>(
      "co_po_mapping/get_academic_batch_dropdown",
    );
    const data = response.data;
    if (data && data.status && Array.isArray(data.data)) {
      return data.data;
    }
    return [];
  } catch (error) {
    console.error("Error fetching curriculum options:", error);
    return [];
  }
};

const fetchSemesterOptions = async (
  academicBatchId?: number,
): Promise<{ value: number; label: string }[]> => {
  try {
    // FIXED: Passing academic_batch_id to the API call
    const response = await axiosInstance.get<
      ApiResponse<{ value: number; label: string }[]>
    >("co_po_mapping/get_semester_dropdown", {
      params: { academic_batch_id: academicBatchId },
    });
    const data = response.data;
    if (data && data.status && Array.isArray(data.data)) {
      return data.data;
    }
    return [];
  } catch (error) {
    console.error("Error fetching semester options:", error);
    return [];
  }
};

const fetchCourseOptions = async (
  academicBatchId?: number,
  semesterId?: number,
): Promise<CourseOption[]> => {
  try {
    // FIXED: Passing both parameters to the API call
    const response = await axiosInstance.get<ApiResponse<any[]>>(
      "co_po_mapping/get_course_dropdown",
      {
        params: { academic_batch_id: academicBatchId, semester_id: semesterId },
      },
    );
    const data = response.data;
    if (data && data.status && Array.isArray(data.data)) {
      return data.data.map((c: any) => ({
        crs_id: c.crs_id,
        crs_code: c.crs_code,
        label: c.course || c.crs_code,
      }));
    }
    return [];
  } catch (error) {
    console.error("Error fetching course options:", error);
    return [];
  }
};

interface CoPoDataResponse {
  cos: any[];
  pos: any[];
}

const fetchCoPoData = async (
  academicBatchId?: number,
  crsId?: number,
  semesterId?: number,
): Promise<{ clos: CloOption[]; pos: PoOption[] }> => {
  try {
    const payload: any = {};
    if (academicBatchId) payload.academic_batch_id = academicBatchId;
    if (crsId) payload.crs_id = crsId;
    if (semesterId) payload.semester_id = semesterId;

    const response = await axiosInstance.post<ApiResponse<CoPoDataResponse>>(
      "co_po_mapping/get_co_po",
      payload,
    );
    const data = response.data;

    if (data && data.status && data.data) {
      const clos = (data.data.cos || []).map((c: any) => ({
        clo_id: c.clo_id,
        clo_code: c.clo_code,
        clo_statement: c.clo_statement,
      }));

      const pos = (data.data.pos || []).map((p: any) => ({
        po_id: p.po_id,
        po_code: p.po_code,
      }));

      return { clos, pos };
    }
    return { clos: [], pos: [] };
  } catch (error) {
    console.error("Error fetching CO/PO data:", error);
    return { clos: [], pos: [] };
  }
};

const fetchExistingMappings = async (
  academicBatchId?: number,
  crsId?: number,
): Promise<CoPoMapItem[]> => {
  try {
    const payload: any = {};
    if (academicBatchId) payload.academic_batch_id = academicBatchId;
    if (crsId) payload.crs_id = crsId;

    const response = await axiosInstance.post<ApiResponse<CoPoMapItem[]>>(
      "co_po_mapping/fetch_co_po_mappings",
      payload,
    );
    const data = response.data;

    if (data && data.status && Array.isArray(data.data)) {
      return data.data;
    }
    return [];
  } catch (error) {
    console.error("Error fetching existing mappings:", error);
    return [];
  }
};

interface SaveResponseData {
  created: number;
  updated: number;
}

const saveCoPoMapping = async (
  mappings: CloPoSavePayload[],
  action?: string,
): Promise<{ created: number; updated: number }> => {
  try {
    const payload = {
      action: action || "save",
      mappings: mappings.map((m) => ({
        clo_id: m.clo_id,
        po_id: m.po_id,
        academic_batch_id: m.academic_batch_id,
        crs_id: m.crs_id,
        map_level: m.map_level,
        justification: m.justification,
        pi_id: m.pi_id,
        msr_id: m.msr_id,
      })),
    };

    const response = await axiosInstance.post<ApiResponse<SaveResponseData>>(
      "co_po_mapping/submit_clo_po_mappings",
      payload,
    );
    const data = response.data;

    if (data && data.status && data.data) {
      return {
        created: data.data.created || 0,
        updated: data.data.updated || 0,
      };
    }
    return { created: 0, updated: 0 };
  } catch (error) {
    console.error("Error saving CLO-PO mappings:", error);
    throw error;
  }
};

const fetchPIMeasures = async (
  poId: number,
): Promise<PIMeasuresResponse | null> => {
  try {
    const response = await axiosInstance.post<ApiResponse<PIMeasuresResponse>>(
      "co_po_mapping/get_pi_measures",
      { po_id: poId },
    );
    const data = response.data;
    if (data && data.status && data.data) {
      return data.data;
    }
    return null;
  } catch (error) {
    console.error("Error fetching PI measures:", error);
    return null;
  }
};

interface MappingCell {
  level: number;
  justification: string;
  clo_po_id: number | null;
  pi_id?: number | null;
  msr_id?: number | null;
}

const CoPoMapPage: React.FC = () => {
  const location = useLocation();

  const [editMode, setEditMode] = useState<boolean>(false);
  const [mappingStatus, setMappingStatus] = useState<string>("Not Initiated");

  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  const [selectedCurriculum, setSelectedCurriculum] = useState<string>(() => {
    try {
      const saved = sessionStorage.getItem("coPoMappingSession");
      return saved ? JSON.parse(saved).selectedCurriculum || "" : "";
    } catch {
      return "";
    }
  });
  const [selectedTerm, setSelectedTerm] = useState<string>(() => {
    try {
      const saved = sessionStorage.getItem("coPoMappingSession");
      return saved ? JSON.parse(saved).selectedTerm || "" : "";
    } catch {
      return "";
    }
  });
  const [selectedCourse, setSelectedCourse] = useState<string>(() => {
    try {
      const saved = sessionStorage.getItem("coPoMappingSession");
      return saved ? JSON.parse(saved).selectedCourse || "" : "";
    } catch {
      return "";
    }
  });

  useEffect(() => {
    sessionStorage.setItem(
      "coPoMappingSession",
      JSON.stringify({ selectedCurriculum, selectedTerm, selectedCourse }),
    );
  }, [selectedCurriculum, selectedTerm, selectedCourse]);

  // Router State Catcher
  useEffect(() => {
    if (location.state && location.state.passedFilters) {
      const { academic_batch_id, semester_id, course_id } =
        location.state.passedFilters;
      if (academic_batch_id)
        setSelectedCurriculum(academic_batch_id.toString());
      if (semester_id) setSelectedTerm(semester_id.toString());
      if (course_id) setSelectedCourse(course_id.toString());
    }
  }, [location.state]);

  const [curriculumOptions, setCurriculumOptions] = useState<
    CurriculumOption[]
  >([]);
  const [termOptions, setTermOptions] = useState<
    { value: number; label: string }[]
  >([]);
  const [courseOptions, setCourseOptions] = useState<CourseOption[]>([]);
  const [selectedCourseData, setSelectedCourseData] =
    useState<CourseOption | null>(null);

  const [cloList, setCloList] = useState<CloOption[]>([]);
  const [poList, setPoList] = useState<PoOption[]>([]);

  const [mappings, setMappings] = useState<CoPoMappingData>({});

  const [showJustifyModal, setShowJustifyModal] = useState(false);
  const [showRemapModal, setShowRemapModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [showPIModal, setShowPIModal] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [activeCell, setActiveCell] = useState<{
    cloId: number;
    poId: number;
  } | null>(null);
  const [tempJustification, setTempJustification] = useState("");

  const [invalidRows, setInvalidRows] = useState<number[]>([]);
  const [hasExistingMappings, setHasExistingMappings] =
    useState<boolean>(false);
  const [piMeasuresData, setPiMeasuresData] =
    useState<PIMeasuresResponse | null>(null);
  const [loadingPIMeasures, setLoadingPIMeasures] = useState(false);
  const [selectedPI, setSelectedPI] = useState<{
    pi_id: number;
    pi_statement: string;
  } | null>(null);
  const [selectedMeasure, setSelectedMeasure] = useState<{
    msr_id: number;
    msr_statement: string;
  } | null>(null);

  useEffect(() => {
    const loadCurriculums = async () => {
      setLoading(true);
      try {
        const opts = await fetchCurriculumOptions();
        setCurriculumOptions(opts);
      } catch (err) {
        console.error("Failed to load curriculum options", err);
        toast.error("Failed to load curriculum options");
      } finally {
        setLoading(false);
      }
    };
    loadCurriculums();
  }, []);

  // FIXED: Load semesters based on selected curriculum (Prevents fetching all terms)
  useEffect(() => {
    const loadSemesters = async () => {
      if (!selectedCurriculum) {
        setTermOptions([]);
        return;
      }
      try {
        const semesters = await fetchSemesterOptions(
          Number(selectedCurriculum),
        );
        setTermOptions(semesters);
      } catch (err) {
        console.error("Failed to load semesters", err);
      }
    };
    loadSemesters();
  }, [selectedCurriculum]);

  useEffect(() => {
    const loadCourses = async () => {
      if (!selectedCurriculum || !selectedTerm) {
        setCourseOptions([]);
        return;
      }
      setLoading(true);
      try {
        const courses = await fetchCourseOptions(
          Number(selectedCurriculum),
          Number(selectedTerm),
        );
        setCourseOptions(courses);
      } catch (err) {
        console.error("Failed to load courses", err);
        toast.error("Failed to load courses");
      } finally {
        setLoading(false);
      }
    };
    loadCourses();
  }, [selectedCurriculum, selectedTerm]);

  useEffect(() => {
    const restoreSavedMapping = async () => {
      if (
        selectedCurriculum &&
        selectedTerm &&
        selectedCourse &&
        courseOptions.length > 0
      ) {
        setLoading(true);

        const selectedCourseObj = courseOptions.find(
          (course) => course.crs_id === Number(selectedCourse),
        );

        setSelectedCourseData(selectedCourseObj || null);

        await loadMappingData(Number(selectedCourse));

        setLoading(false);
      }
    };

    restoreSavedMapping();
  }, [selectedCurriculum, selectedTerm, selectedCourse, courseOptions]);

  const loadMappingData = async (crs_id: number) => {
    try {
      const academicBatchId = selectedCurriculum
        ? Number(selectedCurriculum)
        : undefined;
      const semesterId = selectedTerm ? Number(selectedTerm) : undefined;

      const [coPoData, existingMap] = await Promise.all([
        fetchCoPoData(academicBatchId, crs_id, semesterId),
        fetchExistingMappings(academicBatchId, crs_id),
      ]);

      const closData = coPoData.clos;
      const posData = coPoData.pos;

      const sortedPos = [...posData].sort((a, b) => {
        const isAPso = a.po_code.startsWith("PSO");
        const isBPso = b.po_code.startsWith("PSO");
        if (isAPso && !isBPso) return 1;
        if (!isAPso && isBPso) return -1;
        return a.po_code.localeCompare(b.po_code, undefined, {
          numeric: true,
          sensitivity: "base",
        });
      });

      setCloList(closData);
      setPoList(sortedPos);

      const initMappings: CoPoMappingData = {};
      for (const clo of closData) {
        initMappings[clo.clo_id] = {};
        for (const po of posData) {
          initMappings[clo.clo_id][po.po_id] = {
            level: 0,
            justification: "",
            clo_po_id: null,
          };
        }
      }

      const mappingsFound = existingMap.length > 0;
      setHasExistingMappings(mappingsFound);

      if (mappingsFound) {
        existingMap.forEach((m: CoPoMapItem) => {
          if (initMappings[m.clo_id] && initMappings[m.clo_id][m.po_id]) {
            initMappings[m.clo_id][m.po_id] = {
              level: Number(m.map_level) || 0,
              justification: m.justification || "",
              clo_po_id: m.clo_po_id,
            };
          }
        });
        setEditMode(false);
      } else {
        setEditMode(true);
        setMappingStatus("In Progress");
      }

      setMappings(initMappings);
    } catch (err) {
      console.error("Failed to load CO/PO data", err);
      toast.error("Failed to load CO/PO mapping data");
    }
  };

  const handleCourseChange = async (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const crs_id = e.target.value;
    setSelectedCourse(crs_id);

    const course = courseOptions.find((c) => c.crs_id === Number(crs_id));
    setSelectedCourseData(course || null);

    setEditMode(false);
    setMappings({});
    setMappingStatus("Not Initiated");

    if (!crs_id) {
      setCloList([]);
      setPoList([]);
      return;
    }

    setLoading(true);
    await loadMappingData(Number(crs_id));
    setLoading(false);
  };

  const handleRemapClick = () => {
    setShowRemapModal(true);
  };

  const confirmRemap = () => {
    setEditMode(true);
    setShowRemapModal(false);
    setMappingStatus("In Progress");
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setMappings({});
    setMappingStatus("Not Initiated");
  };

  const handleLevelChange = (cloId: number, poId: number, level: number) => {
    setMappings((prev) => {
      const updatedRow = {
        ...prev[cloId],
        [poId]: {
          level,
          justification: prev?.[cloId]?.[poId]?.justification || "",
          clo_po_id: prev?.[cloId]?.[poId]?.clo_po_id || null,
        },
      };

      const hasAnyMapping = Object.values(updatedRow).some(
        (cell) => Number(cell.level) > 0,
      );
      if (hasAnyMapping) {
        setInvalidRows((prevInvalid) => {
          const index = cloList.findIndex((c) => c.clo_id === cloId);
          return prevInvalid.filter((i) => i !== index);
        });
      }

      return {
        ...prev,
        [cloId]: updatedRow,
      };
    });
  };

  const openJustifyModal = (cloId: number, poId: number) => {
    const existing = mappings?.[cloId]?.[poId]?.justification || "";
    setTempJustification(existing);
    setActiveCell({ cloId, poId });
    setShowJustifyModal(true);
  };

  const saveJustification = () => {
    if (!activeCell) return;

    setMappings((prev) => ({
      ...prev,
      [activeCell.cloId]: {
        ...prev[activeCell.cloId],
        [activeCell.poId]: {
          ...prev[activeCell.cloId]?.[activeCell.poId],
          level: prev[activeCell.cloId]?.[activeCell.poId]?.level || 0,
          justification: tempJustification,
        },
      },
    }));

    setShowJustifyModal(false);
    setTempJustification("");
    setActiveCell(null);
  };

  const openPIModal = async (cloId: number, poId: number) => {
    setActiveCell({ cloId, poId });
    setLoadingPIMeasures(true);
    setShowPIModal(true);
    setSelectedPI(null);
    setSelectedMeasure(null);

    try {
      const data = await fetchPIMeasures(poId);
      setPiMeasuresData(data);
    } catch (error) {
      console.error("Error loading PI measures:", error);
      toast.error("Failed to load PI measures");
    } finally {
      setLoadingPIMeasures(false);
    }
  };

  const savePISelection = () => {
    if (!activeCell || !selectedMeasure) return;

    setMappings((prev) => ({
      ...prev,
      [activeCell.cloId]: {
        ...prev[activeCell.cloId],
        [activeCell.poId]: {
          ...prev[activeCell.cloId]?.[activeCell.poId],
          level: prev[activeCell.cloId]?.[activeCell.poId]?.level || 0,
          justification:
            prev[activeCell.cloId]?.[activeCell.poId]?.justification || "",
          pi_id: selectedPI?.pi_id || null,
          msr_id: selectedMeasure.msr_id || null,
        },
      },
    }));

    setShowPIModal(false);
    setSelectedPI(null);
    setSelectedMeasure(null);
    setActiveCell(null);
    toast.success("PI Measure selected successfully");
  };

  const validateMappingData = (): boolean => {
    let hasMappings = false;
    for (const cloId in mappings) {
      for (const poId in mappings[cloId]) {
        if (mappings[cloId][poId].level > 0) {
          hasMappings = true;
          break;
        }
      }
      if (hasMappings) break;
    }

    if (!hasMappings) {
      toast.warning("Please fill at least one mapping level before saving");
      return false;
    }

    return true;
  };

  const validateAllRowsMapped = (): boolean => {
    const invalid: number[] = [];

    cloList.forEach((clo, index) => {
      const rowMappings = mappings[clo.clo_id] || {};
      const hasMapping = Object.values(rowMappings).some(
        (cell) => Number(cell.level) > 0,
      );

      if (!hasMapping) {
        invalid.push(index);
      }
    });

    setInvalidRows(invalid);
    return invalid.length === 0;
  };

  const handleSendForReview = () => {
    const isAllMapped = validateAllRowsMapped();
    if (!isAllMapped) {
      setShowValidationModal(true);
      return;
    }
    toast.info("Sending for review...");
  };

  const handleSendForApproval = () => {
    const isAllMapped = validateAllRowsMapped();
    if (!isAllMapped) {
      setShowValidationModal(true);
      return;
    }

    if (!validateMappingData()) {
      return;
    }
    setShowApprovalModal(true);
  };

  const handleSkipApprovalClick = () => {
    setShowApprovalModal(false);
    setShowSkipModal(true);
  };

  const buildSavePayload = (): CloPoSavePayload[] => {
    if (!selectedCurriculum) {
      toast.error("Please select Curriculum");
      return [];
    }

    const payload: CloPoSavePayload[] = [];
    const crs_id = Number(selectedCourse);
    const academic_batch_id = Number(selectedCurriculum);

    Object.entries(mappings).forEach(([cloId, poMap]) => {
      Object.entries(poMap).forEach(([poId, cell]) => {
        const cellData = cell as MappingCell;

        if (cellData.level > 0) {
          payload.push({
            clo_po_id: cellData.clo_po_id,
            clo_id: Number(cloId),
            po_id: Number(poId),
            crs_id: crs_id,
            academic_batch_id: academic_batch_id,
            map_level: String(cellData.level),
            justification: cellData.justification || "",
            pi_id: cellData.pi_id || null,
            msr_id: cellData.msr_id || null,
          });
        }
      });
    });

    return payload;
  };

  const confirmPublish = async () => {
    const payload = buildSavePayload();

    setSaving(true);
    try {
      const result = await saveCoPoMapping(payload, "save_and_publish");
      await loadMappingData(Number(selectedCourse));

      setEditMode(false);
      setMappingStatus("Approved");
      setShowSkipModal(false);
      toast.success(
        `Mapping saved successfully! Created: ${result.created}, Updated: ${result.updated}`,
      );
    } catch (err) {
      console.error("Failed to save mapping", err);
      toast.error("Failed to save mapping. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="curriculum-container p-6 bg-white rounded-xl shadow-sm border border-gray-100 relative">
      <div className="curriculum-card">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 mb-6">
          <h3 className="text-xl font-bold text-gray-800">
            Mapping between Course Outcomes (COs) and Program Outcomes (POs)
          </h3>
        </div>

        <div className="mb-6 px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Curriculum <span className="text-red-500">*</span>
              </label>
              <select
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={selectedCurriculum}
                onChange={(e) => {
                  setSelectedCurriculum(e.target.value);
                  setSelectedTerm("");
                  setSelectedCourse("");
                  setCourseOptions([]);
                  setCloList([]);
                  setPoList([]);
                  setMappings({});
                }}
                disabled={loading}
              >
                <option value="">
                  {loading ? "Loading..." : "Select Curriculum"}
                </option>
                {curriculumOptions.map((opt) => (
                  <option
                    key={opt.value || opt.academic_batch_id}
                    value={opt.value || opt.academic_batch_id}
                  >
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Term <span className="text-red-500">*</span>
              </label>
              <select
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={selectedTerm}
                onChange={(e) => {
                  setSelectedTerm(e.target.value);
                  setSelectedCourse("");
                  setCloList([]);
                  setPoList([]);
                  setMappings({});
                }}
                disabled={loading || !selectedCurriculum}
              >
                <option value="">
                  {loading ? "Loading..." : "Select Term"}
                </option>
                {termOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Course <span className="text-red-500">*</span>
              </label>
              <select
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={selectedCourse}
                onChange={handleCourseChange}
                disabled={loading || !selectedTerm}
              >
                <option value="">
                  {loading ? "Loading..." : "Select Course"}
                </option>
                {courseOptions.map((opt) => (
                  <option key={opt.crs_id} value={opt.crs_id}>
                    {opt.crs_code ? `${opt.crs_code} - ` : ""}
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedCourse && selectedCourseData && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <span className="text-sm font-semibold text-blue-800">
                Course:{" "}
                {selectedCourseData.crs_code
                  ? `${selectedCourseData.crs_code} - `
                  : ""}
                {selectedCourseData.label}
              </span>
            </div>
          )}
        </div>

        {loading && selectedCourse && (
          <div className="px-6 mb-4 text-sm text-gray-500">
            Loading CO and PO data...
          </div>
        )}

        {selectedCourse && !loading && (
          <div className="px-6">
            {cloList.length === 0 || poList.length === 0 ? (
              <div className="text-sm text-gray-500 mb-6 p-4 border border-gray-200 rounded-md bg-gray-50">
                {cloList.length === 0 && poList.length === 0
                  ? "No COs or POs found for this course/curriculum."
                  : cloList.length === 0
                    ? "No Course Outcomes (COs) found for this course."
                    : "No Program Outcomes (POs) found for this curriculum."}
              </div>
            ) : (
              <div className="overflow-x-auto mb-6 border border-gray-300 rounded-lg">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-white">
                      <th
                        className="border border-gray-300 px-4 py-3 text-left text-black font-bold sticky left-0 bg-white z-10"
                        style={{ minWidth: "300px", width: "300px" }}
                      >
                        Course Outcomes (COs)
                      </th>
                      {poList.map((po) => (
                        <th
                          key={po.po_id}
                          className="border border-gray-300 px-2 py-3 text-center text-black font-bold"
                          style={{ minWidth: "80px", width: "80px" }}
                        >
                          {po.po_code}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cloList.map((clo, idx) => (
                      <tr
                        key={clo.clo_id}
                        className={`${invalidRows.includes(idx) ? "bg-red-50" : idx % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                      >
                        <td
                          className={`border border-gray-300 px-4 py-3 ${invalidRows.includes(idx) ? "border-red-300" : ""}`}
                        >
                          <strong>{clo.clo_code || `CO${clo.clo_id}`}.</strong>{" "}
                          {clo.clo_statement}
                        </td>
                        {poList.map((po) => {
                          const cell = mappings?.[clo.clo_id]?.[po.po_id];
                          const level = cell?.level || 0;

                          return (
                            <td
                              key={po.po_id}
                              className="border border-gray-300 text-center align-middle h-20"
                            >
                              {editMode ? (
                                <div className="flex flex-col items-center justify-center gap-1">
                                  <select
                                    value={level}
                                    onChange={(e) =>
                                      handleLevelChange(
                                        clo.clo_id,
                                        po.po_id,
                                        Number(e.target.value),
                                      )
                                    }
                                    className="w-14 border border-gray-300 rounded px-1 py-1 text-sm focus:ring-2 focus:ring-blue-500"
                                  >
                                    {MAP_LEVEL_OPTIONS.map((opt) => (
                                      <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                      </option>
                                    ))}
                                  </select>
                                  {level > 0 && (
                                    <>
                                      <button
                                        onClick={() =>
                                          openJustifyModal(clo.clo_id, po.po_id)
                                        }
                                        className="text-xs text-blue-600 hover:underline"
                                      >
                                        Justify
                                      </button>
                                      <button
                                        onClick={() =>
                                          openPIModal(clo.clo_id, po.po_id)
                                        }
                                        className="text-xs text-blue-600 hover:underline"
                                      >
                                        C & PI
                                      </button>
                                    </>
                                  )}
                                </div>
                              ) : (
                                <div className="flex flex-col items-center justify-center gap-1">
                                  {level > 0 && (
                                    <>
                                      <div className="font-semibold text-base">
                                        {level}
                                      </div>
                                      <button
                                        onClick={() =>
                                          openJustifyModal(clo.clo_id, po.po_id)
                                        }
                                        className="text-xs text-blue-600 hover:underline cursor-pointer"
                                      >
                                        Justify
                                      </button>
                                      <button
                                        onClick={() =>
                                          openPIModal(clo.clo_id, po.po_id)
                                        }
                                        className="text-xs text-blue-600 hover:underline cursor-pointer"
                                      >
                                        C & PI
                                      </button>
                                    </>
                                  )}
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mb-6">
              <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Overall Justification
                    </label>
                    <textarea
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter text here..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Overall Reviewer Comments
                    </label>
                    <textarea
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter text here..."
                    />
                  </div>
                </div>

                <div className="flex justify-end mt-4">
                  <button
                    onClick={editMode ? handleSendForReview : undefined}
                    disabled={!editMode}
                    className={`px-6 py-2 rounded-md transition-colors shadow-sm text-sm font-medium ${
                      editMode
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    Send for Review
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center border-t border-gray-100 pt-6">
                {!editMode ? (
                  <button
                    onClick={handleRemapClick}
                    disabled={
                      !selectedCourse ||
                      !hasExistingMappings ||
                      cloList.length === 0 ||
                      poList.length === 0
                    }
                    className={`px-6 py-2 rounded-md transition-colors shadow-sm text-sm font-medium flex items-center gap-2 ${
                      !selectedCourse ||
                      !hasExistingMappings ||
                      cloList.length === 0 ||
                      poList.length === 0
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-green-600 text-white hover:bg-green-700"
                    }`}
                  >
                    <FaSync className="w-4 h-4" />
                    Re-map
                  </button>
                ) : (
                  <button
                    onClick={handleCancelEdit}
                    className="px-6 py-2 bg-red-600 text-white border border-red-600 rounded-md hover:bg-red-700 transition-colors shadow-sm text-sm font-medium"
                  >
                    Cancel
                  </button>
                )}

                <button
                  onClick={editMode ? handleSendForApproval : undefined}
                  disabled={!editMode}
                  className={`px-6 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors shadow-sm ${
                    editMode
                      ? "button-bg text-white hover:opacity-90 cursor-pointer"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  <FaPaperPlane className="w-4 h-4" />
                  Save & Publish
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showRemapModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Confirm Re-mapping
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to remap entire mapping between COs and POs?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowRemapModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmRemap}
                className="px-4 py-2 button-bg text-white rounded-md text-sm font-medium"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {showJustifyModal && activeCell && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-base font-semibold text-gray-700 mb-3">
              Justification:
            </h3>
            <div className="mb-4">
              <div className="text-xs text-gray-500 mb-2">
                CO{activeCell.cloId} - PO{activeCell.poId}
              </div>
              <textarea
                value={tempJustification}
                disabled={!editMode}
                onChange={(e) => setTempJustification(e.target.value)}
                rows={5}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 ${
                  !editMode ? "bg-gray-100 cursor-not-allowed" : ""
                }`}
                placeholder={
                  editMode ? "Enter justification for this mapping..." : ""
                }
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowJustifyModal(false)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium flex items-center gap-1"
              >
                <FaTimes className="w-3 h-3" />
                Close
              </button>
              {editMode && (
                <button
                  onClick={saveJustification}
                  className="px-4 py-2 button-bg text-white rounded-md text-sm font-medium flex items-center gap-1"
                >
                  <FaCheck className="w-3 h-3" />
                  Save
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showApprovalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-lg w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Save & Publish Mapping
            </h3>
            <div className="space-y-3 text-sm text-gray-700 mb-6">
              <p>
                <strong>Current step:</strong> Mapping between COs and POs has
                been completed.
              </p>
              <p>
                <strong>Next step:</strong> The mapping will be saved and
                published.
              </p>
              <p className="text-blue-600">
                Click "Confirm" to save the mapping data.
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowApprovalModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSkipApprovalClick}
                className="px-4 py-2 button-bg text-white rounded-md text-sm font-medium"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {showSkipModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Confirm Publication
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Mapping between Course Outcomes and Program Outcomes will be saved
              and published.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowSkipModal(false)}
                disabled={saving}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmPublish}
                disabled={saving}
                className="px-4 py-2 button-bg text-white rounded-md text-sm font-medium disabled:opacity-50"
              >
                {saving ? "Saving..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPIModal && activeCell && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                {editMode
                  ? "Select Competency & Performance Indicators"
                  : "Selected C & Performance Indicators"}
              </h3>
              <button
                onClick={() => {
                  setShowPIModal(false);
                  setSelectedPI(null);
                  setSelectedMeasure(null);
                  setActiveCell(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-gray-500 mb-4">
              CO{activeCell.cloId} - PO{activeCell.poId}
            </div>

            {loadingPIMeasures ? (
              <div className="flex justify-center items-center py-8">
                <div className="text-gray-500">Loading PI Measures...</div>
              </div>
            ) : piMeasuresData &&
              Object.keys(piMeasuresData.performance_indicators).length > 0 ? (
              <div className="overflow-y-auto flex-1 pr-2">
                {Object.entries(piMeasuresData.performance_indicators).map(
                  ([compKey, piData]: [string, any]) => (
                    <div key={compKey} className="mb-4">
                      {!editMode ? (
                        <>
                          <div className="bg-blue-50 border-l-4 border-blue-500 px-4 py-3 rounded-r-lg mb-3">
                            <span className="text-sm font-semibold text-blue-800">
                              Competency Statement:
                            </span>
                            <p className="text-sm text-blue-700 mt-1">
                              {compKey}
                            </p>
                          </div>

                          <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <table className="w-full text-sm">
                              <thead className="bg-gray-100 border-b border-gray-200">
                                <tr>
                                  <th className="px-4 py-2 text-left font-semibold text-gray-700">
                                    Performance Indicator Statements
                                  </th>
                                  <th className="px-4 py-2 text-right font-semibold text-gray-700 w-32">
                                    PI Codes
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {piData.measures &&
                                Object.keys(piData.measures).length > 0 ? (
                                  Object.entries(piData.measures).map(
                                    (
                                      [msrKey, measure]: [string, any],
                                      idx: number,
                                    ) => (
                                      <tr
                                        key={msrKey}
                                        className={
                                          idx % 2 === 0
                                            ? "bg-white"
                                            : "bg-gray-50"
                                        }
                                      >
                                        <td className="px-4 py-3 text-gray-700 border-b border-gray-100">
                                          {measure.msr_statement}
                                        </td>
                                        <td className="px-4 py-3 text-right border-b border-gray-100">
                                          <span className="inline-block bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium">
                                            {measure.pi_codes ||
                                              `PI-${measure.msr_id}`}
                                          </span>
                                        </td>
                                      </tr>
                                    ),
                                  )
                                ) : (
                                  <tr>
                                    <td
                                      colSpan={2}
                                      className="px-4 py-3 text-center text-gray-500 italic"
                                    >
                                      No measures available
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </>
                      ) : (
                        <div className="mb-4 border border-gray-200 rounded-lg overflow-hidden">
                          <div
                            className={`px-4 py-3 border-b border-gray-200 ${editMode ? "bg-blue-50" : "bg-gray-50"}`}
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className={`font-semibold ${editMode ? "text-blue-800" : "text-gray-800"}`}
                              >
                                PI Code:
                              </span>
                              <span
                                className={`${editMode ? "text-blue-700" : "text-gray-700"}`}
                              >
                                {piData.pi_id}
                              </span>
                            </div>
                            <div className="mt-1">
                              <span className="font-semibold text-gray-700">
                                Competency Statement:
                              </span>
                              <p className="text-sm text-gray-600 mt-1">
                                {compKey}
                              </p>
                            </div>
                          </div>

                          <div className="px-4 py-3 bg-white">
                            <div className="font-semibold text-sm text-gray-700 mb-2">
                              Performance Indicators & Measures:
                            </div>
                            {piData.measures &&
                            Object.keys(piData.measures).length > 0 ? (
                              <div className="space-y-2">
                                {Object.entries(piData.measures).map(
                                  ([msrKey, measure]: [string, any]) => {
                                    const isSelected =
                                      selectedMeasure?.msr_id ===
                                      measure.msr_id;

                                    return (
                                      <div
                                        key={msrKey}
                                        onClick={() => {
                                          if (editMode) {
                                            setSelectedPI({
                                              pi_id: piData.pi_id,
                                              pi_statement: compKey,
                                            });
                                            setSelectedMeasure({
                                              msr_id: measure.msr_id,
                                              msr_statement:
                                                measure.msr_statement,
                                            });
                                          }
                                        }}
                                        className={`p-3 border rounded-lg ${
                                          editMode
                                            ? isSelected
                                              ? "border-blue-500 bg-blue-50 cursor-pointer"
                                              : "border-gray-200 hover:border-blue-300 hover:bg-gray-50 cursor-pointer"
                                            : "border-gray-100 bg-gray-50"
                                        }`}
                                      >
                                        <div className="flex items-start gap-3">
                                          {editMode ? (
                                            <div
                                              className={`w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 ${
                                                isSelected
                                                  ? "border-blue-500 bg-blue-500"
                                                  : "border-gray-300"
                                              }`}
                                            >
                                              {isSelected && (
                                                <div className="w-full h-full flex items-center justify-center">
                                                  <div className="w-2 h-2 bg-white rounded-full"></div>
                                                </div>
                                              )}
                                            </div>
                                          ) : (
                                            <div className="w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 border-gray-300 bg-gray-200"></div>
                                          )}
                                          <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                              <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                                                {measure.pi_codes ||
                                                  `PI-${measure.msr_id}`}
                                              </span>
                                            </div>
                                            <p className="text-sm text-gray-700">
                                              {measure.msr_statement}
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  },
                                )}
                              </div>
                            ) : (
                              <div className="text-sm text-gray-500 italic py-2">
                                No measures available
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ),
                )}
              </div>
            ) : (
              <div className="flex justify-center items-center py-8">
                <div className="text-gray-500">
                  No Performance Indicators found for this PO
                </div>
              </div>
            )}

            {selectedMeasure && editMode && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm font-semibold text-blue-800 mb-1">
                  Selected:
                </div>
                <div className="text-sm text-gray-700">
                  <span className="font-medium">PI:</span>{" "}
                  {selectedPI?.pi_statement}
                </div>
                <div className="text-sm text-gray-700">
                  <span className="font-medium">Measure:</span>{" "}
                  {selectedMeasure.msr_statement}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowPIModal(false);
                  setSelectedPI(null);
                  setSelectedMeasure(null);
                  setActiveCell(null);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium transition-colors"
              >
                {editMode ? "Cancel" : "Close"}
              </button>
              {editMode && (
                <button
                  onClick={savePISelection}
                  disabled={!selectedMeasure}
                  className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 ${
                    selectedMeasure
                      ? "button-bg text-white"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  <FaCheck className="w-3 h-3" />
                  Save Selection
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showValidationModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">
              Mapping between Course Outcomes and Program Outcomes Status
            </h3>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed text-center">
              Entire mapping between Course Outcomes and Program Outcomes has to
              be completed before sending it for approval.
            </p>
            <div className="flex justify-center">
              <button
                onClick={() => setShowValidationModal(false)}
                className="px-10 py-2 bg-[#2A4DD0] text-white rounded-md hover:opacity-90 text-sm font-medium shadow-sm transition-all"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        }
        .modal-box {
            background: white;
            padding: 30px;
            border-radius: 12px;
            width: 500px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        }
           
    `}</style>
    </div>
  );
};

export default CoPoMapPage;

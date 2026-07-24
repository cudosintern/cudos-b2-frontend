import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getCourses,
  getCurricula,
  getDataAnalysisReport,
  getOccasions,
  getPrograms,
  getSchools,
  getSections,
  getTerms,
  getTypes,
} from "./dataAnalysisApi";
import {
  DataAnalysisFiltersState,
  DataAnalysisOccasionsRequest,
  DataAnalysisReportRequest,
  DataAnalysisReportState,
  DataAnalysisSectionsRequest,
  DataAnalysisType,
  SelectOption,
} from "./dataAnalysisTypes";

const initialFilters: DataAnalysisFiltersState = {
  schoolId: "",
  programId: "",
  curriculumId: "",
  termId: "",
  courseId: "",
  type: "",
  sectionId: "",
  occasionId: "",
};

const initialReportState: DataAnalysisReportState = { kind: "idle" };

const isDataAnalysisType = (value: string): value is DataAnalysisType =>
  value === "CCE" || value === "MTE" || value === "SEE";

const normalizeError = (error: unknown) =>
  error instanceof Error ? error.message : "Unable to load data analysis details.";

export const useDataAnalysis = () => {
  const [filters, setFilters] = useState<DataAnalysisFiltersState>(initialFilters);
  const [schools, setSchools] = useState<SelectOption[]>([]);
  const [programs, setPrograms] = useState<SelectOption[]>([]);
  const [curricula, setCurricula] = useState<SelectOption[]>([]);
  const [terms, setTerms] = useState<SelectOption[]>([]);
  const [courses, setCourses] = useState<SelectOption[]>([]);
  const [types, setTypes] = useState<SelectOption[]>([]);
  const [sections, setSections] = useState<SelectOption[]>([]);
  const [occasions, setOccasions] = useState<SelectOption[]>([]);
  const [reportState, setReportState] = useState<DataAnalysisReportState>(initialReportState);
  const [pageLoading, setPageLoading] = useState(false);
  const [occasionRequired, setOccasionRequired] = useState(false);

  const resetReport = useCallback(() => {
    setReportState(initialReportState);
  }, []);

  const clearFromProgram = useCallback(() => {
    setPrograms([]);
    setCurricula([]);
    setTerms([]);
    setCourses([]);
    setTypes([]);
    setSections([]);
    setOccasions([]);
    setOccasionRequired(false);
  }, []);

  const clearFromCurriculum = useCallback(() => {
    setCurricula([]);
    setTerms([]);
    setCourses([]);
    setTypes([]);
    setSections([]);
    setOccasions([]);
    setOccasionRequired(false);
  }, []);

  const clearFromTerm = useCallback(() => {
    setTerms([]);
    setCourses([]);
    setTypes([]);
    setSections([]);
    setOccasions([]);
    setOccasionRequired(false);
  }, []);

  const clearFromCourse = useCallback(() => {
    setCourses([]);
    setTypes([]);
    setSections([]);
    setOccasions([]);
    setOccasionRequired(false);
  }, []);

  const clearFromType = useCallback(() => {
    setTypes([]);
    setSections([]);
    setOccasions([]);
    setOccasionRequired(false);
  }, []);

  const clearFromSection = useCallback(() => {
    setSections([]);
    setOccasions([]);
    setOccasionRequired(false);
  }, []);

  const clearOccasions = useCallback(() => {
    setOccasions([]);
  }, []);

  const loadReport = useCallback(async (params: DataAnalysisReportRequest) => {
    setReportState({ kind: "loading" });
    try {
      const response = await getDataAnalysisReport(params);
      if (response.status === "success") {
        setReportState({ kind: "success", data: response.data });
        return;
      }
      setReportState({ kind: "validation", message: response.message });
    } catch (error) {
      setReportState({ kind: "error", message: normalizeError(error) });
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadInitialData = async () => {
      setPageLoading(true);
      try {
        const response = await getSchools();
        if (isMounted) {
          setSchools(response);
        }
      } catch (error) {
        if (isMounted) {
          setReportState({ kind: "error", message: normalizeError(error) });
        }
      } finally {
        if (isMounted) {
          setPageLoading(false);
        }
      }
    };

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleFilterChange = useCallback(
    async <K extends keyof DataAnalysisFiltersState>(key: K, value: DataAnalysisFiltersState[K]) => {
      resetReport();

      if (key === "schoolId") {
        setPageLoading(true);
        setFilters({
          ...initialFilters,
          schoolId: value as string,
        });
        clearFromProgram();

        try {
          const nextPrograms = value ? await getPrograms(value as string) : [];
          setPrograms(nextPrograms);
        } catch (error) {
          setReportState({ kind: "error", message: normalizeError(error) });
        } finally {
          setPageLoading(false);
        }
        return;
      }

      if (key === "programId") {
        setPageLoading(true);
        setFilters((current) => ({
          ...current,
          programId: value as string,
          curriculumId: "",
          termId: "",
          courseId: "",
          type: "",
          sectionId: "",
          occasionId: "",
        }));
        clearFromCurriculum();

        try {
          const nextCurricula = value ? await getCurricula(value as string) : [];
          setCurricula(nextCurricula);
        } catch (error) {
          setReportState({ kind: "error", message: normalizeError(error) });
        } finally {
          setPageLoading(false);
        }
        return;
      }

      if (key === "curriculumId") {
        setPageLoading(true);
        setFilters((current) => ({
          ...current,
          curriculumId: value as string,
          termId: "",
          courseId: "",
          type: "",
          sectionId: "",
          occasionId: "",
        }));
        clearFromTerm();

        try {
          const nextTerms = value ? await getTerms(value as string) : [];
          setTerms(nextTerms);
        } catch (error) {
          setReportState({ kind: "error", message: normalizeError(error) });
        } finally {
          setPageLoading(false);
        }
        return;
      }

      if (key === "termId") {
        setPageLoading(true);
        setFilters((current) => ({
          ...current,
          termId: value as string,
          courseId: "",
          type: "",
          sectionId: "",
          occasionId: "",
        }));
        clearFromCourse();

        try {
          const nextCourses =
            value && filters.curriculumId
              ? await getCourses(value as string, filters.curriculumId)
              : [];
          setCourses(nextCourses);
        } catch (error) {
          setReportState({ kind: "error", message: normalizeError(error) });
        } finally {
          setPageLoading(false);
        }
        return;
      }

      if (key === "courseId") {
        setPageLoading(true);
        setFilters((current) => ({
          ...current,
          courseId: value as string,
          type: "",
          sectionId: "",
          occasionId: "",
        }));
        clearFromType();

        try {
          const nextTypes = value ? await getTypes(value as string) : [];
          setTypes(nextTypes);
        } catch (error) {
          setReportState({ kind: "error", message: normalizeError(error) });
        } finally {
          setPageLoading(false);
        }
        return;
      }

      if (key === "type") {
        if (!isDataAnalysisType(String(value))) {
          setFilters((current) => ({
            ...current,
            type: "",
            sectionId: "",
            occasionId: "",
          }));
          clearFromSection();
          return;
        }

        setPageLoading(true);
        const nextType = value as DataAnalysisType;
        setFilters((current) => ({
          ...current,
          type: nextType,
          sectionId: "",
          occasionId: "",
        }));
        clearFromSection();

        try {
          const sectionParams: DataAnalysisSectionsRequest = {
            schoolId: filters.schoolId,
            programId: filters.programId,
            curriculumId: filters.curriculumId,
            termId: filters.termId,
            courseId: filters.courseId,
            type: nextType,
          };
          const nextSections = await getSections(sectionParams);
          setSections(nextSections);
        } catch (error) {
          setReportState({ kind: "error", message: normalizeError(error) });
        } finally {
          setPageLoading(false);
        }
        return;
      }

      if (key === "sectionId") {
        if (!filters.type) {
          return;
        }

        const nextSectionId = value as string;
        setPageLoading(true);
        setFilters((current) => ({
          ...current,
          sectionId: nextSectionId,
          occasionId: "",
        }));
        clearOccasions();
        setOccasionRequired(false);

        try {
          const occasionParams: DataAnalysisOccasionsRequest = {
            schoolId: filters.schoolId,
            programId: filters.programId,
            curriculumId: filters.curriculumId,
            termId: filters.termId,
            courseId: filters.courseId,
            type: filters.type,
            sectionId: nextSectionId,
          };
          const occasionResponse = await getOccasions(occasionParams);
          setOccasions(occasionResponse.options);
          setOccasionRequired(occasionResponse.required);

          if (!occasionResponse.required && nextSectionId) {
            await loadReport({
              ...occasionParams,
            });
          }
        } catch (error) {
          setReportState({ kind: "error", message: normalizeError(error) });
        } finally {
          setPageLoading(false);
        }
        return;
      }

      if (key === "occasionId") {
        if (!filters.type || !filters.sectionId) {
          return;
        }

        const nextOccasionId = value as string;
        setFilters((current) => ({
          ...current,
          occasionId: nextOccasionId,
        }));

        if (!nextOccasionId) {
          return;
        }

        await loadReport({
          schoolId: filters.schoolId,
          programId: filters.programId,
          curriculumId: filters.curriculumId,
          termId: filters.termId,
          courseId: filters.courseId,
          type: filters.type,
          sectionId: filters.sectionId,
          occasionId: nextOccasionId,
        });
      }
    },
    [
      clearFromCourse,
      clearFromCurriculum,
      clearFromProgram,
      clearFromSection,
      clearFromTerm,
      clearFromType,
      clearOccasions,
      filters.courseId,
      filters.curriculumId,
      filters.programId,
      filters.schoolId,
      filters.sectionId,
      filters.termId,
      filters.type,
      loadReport,
      resetReport,
    ]
  );

  const showSection = Boolean(filters.type);
  const showOccasion = Boolean(filters.sectionId && occasionRequired);

  const canExport = reportState.kind === "success" && reportState.data.questions.length > 0;

  const filterOptions = useMemo(
    () => ({
      schools,
      programs,
      curricula,
      terms,
      courses,
      types,
      sections,
      occasions,
    }),
    [courses, curricula, occasions, programs, schools, sections, terms, types]
  );

  return {
    filters,
    filterOptions,
    reportState,
    pageLoading,
    occasionRequired,
    showSection,
    showOccasion,
    canExport,
    handleFilterChange,
  };
};

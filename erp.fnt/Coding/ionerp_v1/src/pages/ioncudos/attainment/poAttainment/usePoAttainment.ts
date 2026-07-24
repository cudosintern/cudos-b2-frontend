import { useEffect, useMemo, useState } from "react";
import { poAttainmentApi } from "./poAttainmentApi";
import {
  Curriculum,
  PoActivityAttainmentResponse,
  PoActivityOption,
  PoAttainmentMethod,
  PoAttainmentRow,
  PoDirectIndirectSourceOption,
  PoDrilldownResponse,
  PoIndirectAttainmentResponse,
  PoIndirectSurveyOption,
  PoAttainmentFilters,
  PoActivitiesResponse,
  PoIndirectSurveyOptionsResponse,
  PoPerformanceLevelsResponse,
  PoAttainmentResponse,
  PoWeightagesResponse,
  TabKey,
  Term,
} from "./poAttainmentTypes";

const defaultFilters: PoAttainmentFilters = {
  curriculumId: "",
  termIds: [],
  coreCoursesOnly: false,
};

const normalizeMethod = (method: string) => method.trim().toLowerCase().replace(/[\s-]+/g, "_");
const directMethodConfigByKey: Record<string, PoAttainmentMethod> = {
  avg_po_attainment: {
    key: "avg_po_attainment",
    label: "Average PO Attainment",
    dataKey: "avg_po_attainment",
    levelKey: "average_po_direct_attainment_level",
  },
  po_threshold_attainment: {
    key: "po_threshold_attainment",
    label: "PO Threshold Attainment",
    dataKey: "po_threshold_attainment",
    levelKey: "average_da_level",
  },
  hml_weighted_average_da_avg: {
    key: "hml_weighted_average_da_avg",
    label: "HML Weighted Average DA",
    dataKey: "hml_weighted_average_da_avg",
    levelKey: "hml_weighted_average_da_level",
  },
  hml_weighted_multiply_maplevel_da_avg: {
    key: "hml_weighted_multiply_maplevel_da_avg",
    label: "HML Weighted Multiply Map Level DA",
    dataKey: "hml_weighted_multiply_maplevel_da_avg",
    levelKey: "hml_weighted_multiply_maplevel_da_level",
  },
};

const mapSupportedDirectMethods = (methods: string[]): PoAttainmentMethod[] =>
  methods
    .map(normalizeMethod)
    .map((methodKey) => directMethodConfigByKey[methodKey])
    .filter((method): method is PoAttainmentMethod => Boolean(method));

const getResolvedTermIds = (terms: Term[], selectedTermIds: string[]) =>
  terms
    .filter((term) => selectedTermIds.includes(term.id))
    .map((term) => Number(term.id))
    .filter((termId) => Number.isFinite(termId) && termId > 0);

export const usePoAttainment = () => {
  const [curriculums, setCurriculums] = useState<Curriculum[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [filters, setFilters] = useState<PoAttainmentFilters>(defaultFilters);
  const [activeTab, setActiveTab] = useState<TabKey>("direct");
  const [data, setData] = useState<PoAttainmentResponse["data"] | null>(null);
  const [exportOptions, setExportOptions] = useState<Array<{ id: "pdf" | "docx"; label: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [activityOptions, setActivityOptions] = useState<PoActivityOption[]>([]);
  const [directIndirectSourceOptions, setDirectIndirectSourceOptions] = useState<PoDirectIndirectSourceOption[]>([]);
  const [selectedActivityIds, setSelectedActivityIds] = useState<string[]>([]);
  const [activityData, setActivityData] = useState<PoActivityAttainmentResponse["data"] | null>(null);
  const [activityLoading, setActivityLoading] = useState(false);
  const [indirectSurveyOptions, setIndirectSurveyOptions] = useState<PoIndirectSurveyOption[]>([]);
  const [selectedIndirectSurveyId, setSelectedIndirectSurveyId] = useState("");
  const [indirectData, setIndirectData] = useState<PoIndirectAttainmentResponse["data"] | null>(null);
  const [indirectLoading, setIndirectLoading] = useState(false);
  const [drilldownData, setDrilldownData] = useState<PoDrilldownResponse["data"] | null>(null);
  const [performanceLevelsData, setPerformanceLevelsData] = useState<PoPerformanceLevelsResponse["data"] | null>(null);
  const [popupLoading, setPopupLoading] = useState(false);
  const [supportedDirectAttainmentMethods, setSupportedDirectAttainmentMethods] = useState<string[]>([]);
  const [initialAvgPoAttainmentFlag, setInitialAvgPoAttainmentFlag] = useState(0);
  const [, setPoWeightages] = useState<PoWeightagesResponse["data"]>([]);

  const selectedTermIds = useMemo(
    () => getResolvedTermIds(terms, filters.termIds),
    [terms, filters.termIds]
  );

  const hasValidFilters = Boolean(filters.curriculumId && selectedTermIds.length > 0);

  useEffect(() => {
    let active = true;

    const loadInitialData = async () => {
      setLoading(true);
      try {
        const response = await poAttainmentApi.getPoAttainmentInitialData();
        if (!active) return;
        setCurriculums(response.data.filters.curriculums);
        setExportOptions(response.data.filters.exportOptions);
        setDirectIndirectSourceOptions(poAttainmentApi.getPoDirectIndirectSourceOptions());
      } catch {
        if (!active) return;
        setCurriculums([]);
        setExportOptions([]);
        setDirectIndirectSourceOptions([]);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadInitialData();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    if (!filters.curriculumId) {
      setTerms([]);
      setFilters((current) => ({ ...current, termIds: [] }));
      setData(null);
      setActivityOptions([]);
      setIndirectSurveyOptions([]);
      setSelectedActivityIds([]);
      setSelectedIndirectSurveyId("");
      setActivityData(null);
      setIndirectData(null);
      setPoWeightages([]);
      setSupportedDirectAttainmentMethods([]);
      setInitialAvgPoAttainmentFlag(0);
      return;
    }

    const loadCurriculumData = async () => {
      setLoading(true);
      try {
        setData(null);
        setActivityData(null);
        setIndirectData(null);
        setSelectedActivityIds([]);
        setSelectedIndirectSurveyId("");
        const [response, bootstrapResponse, surveysResponse, weightagesResponse] = await Promise.all([
          poAttainmentApi.getTermsByCurriculum(filters.curriculumId),
          poAttainmentApi.getBootstrap(filters.curriculumId),
          poAttainmentApi.getPoIndirectSurveyOptions(filters.curriculumId),
          poAttainmentApi.getPoWeightages(filters.curriculumId),
        ]);
        if (!active) return;
        const nextTerms = response.data.terms;
        setTerms(nextTerms);
        setInitialAvgPoAttainmentFlag(Number(bootstrapResponse.data.initialAvgPoAttainmentFlag) || 0);
        setSupportedDirectAttainmentMethods(bootstrapResponse.status !== false ? bootstrapResponse.data.supportedDirectAttainmentMethods : []);
        setIndirectSurveyOptions(surveysResponse.status !== false ? surveysResponse.data.surveys : []);
        setPoWeightages(weightagesResponse.status !== false ? weightagesResponse.data : []);
        setFilters((current) => ({
          ...current,
          termIds: current.termIds.filter((termId) => nextTerms.some((term) => term.id === termId)),
        }));
      } catch {
        if (!active) return;
        setTerms([]);
        setIndirectSurveyOptions([]);
        setPoWeightages([]);
        setSupportedDirectAttainmentMethods([]);
        setInitialAvgPoAttainmentFlag(0);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadCurriculumData();

    return () => {
      active = false;
    };
  }, [filters.curriculumId]);

  useEffect(() => {
    let active = true;

    if (!filters.curriculumId || selectedTermIds.length === 0) {
      setActivityOptions([]);
      setSelectedActivityIds([]);
      setActivityData(null);
      return;
    }

    const loadActivities = async () => {
      setLoading(true);
      try {
        setActivityData(null);
        setSelectedActivityIds([]);
        const activityResponse: PoActivitiesResponse = await poAttainmentApi.getPoActivities(filters.curriculumId, selectedTermIds);
        if (!active) return;
        setActivityOptions(activityResponse.status !== false ? activityResponse.data.activities : []);
      } catch {
        if (!active) return;
        setActivityOptions([]);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadActivities();

    return () => {
      active = false;
    };
  }, [filters.curriculumId, selectedTermIds]);

  useEffect(() => {
    let active = true;

    if (!hasValidFilters) {
      setData(null);
      return;
    }

    const loadResults = async () => {
      setResultsLoading(true);
      try {
        const response = await poAttainmentApi.getPoAttainmentData(filters, selectedTermIds);
        if (active) {
          const methods = response.data?.methods?.length
            ? response.data.methods
            : mapSupportedDirectMethods(supportedDirectAttainmentMethods);
          setData(response.status !== false ? {
            ...response.data,
            methods,
          } : null);
        }
      } catch {
        if (active) {
          setData(null);
        }
      } finally {
        if (active) {
          setResultsLoading(false);
        }
      }
    };

    loadResults();

    return () => {
      active = false;
    };
  }, [filters, hasValidFilters, selectedTermIds, supportedDirectAttainmentMethods]);

  useEffect(() => {
    let active = true;

    if (activeTab !== "extracurricular" || selectedActivityIds.length === 0) {
      setActivityData(null);
      return;
    }

    const loadActivityData = async () => {
      setActivityLoading(true);
      try {
        const response = await poAttainmentApi.getPoActivityAttainmentData(filters.curriculumId, selectedActivityIds);
        if (active) {
          setActivityData(response.status !== false ? response.data : null);
        }
      } catch {
        if (active) {
          setActivityData(null);
        }
      } finally {
        if (active) {
          setActivityLoading(false);
        }
      }
    };

    loadActivityData();

    return () => {
      active = false;
    };
  }, [activeTab, filters.curriculumId, selectedActivityIds]);

  useEffect(() => {
    let active = true;

    if (activeTab !== "indirect" || !selectedIndirectSurveyId) {
      setIndirectData(null);
      return;
    }

    const loadIndirectData = async () => {
      setIndirectLoading(true);
      try {
        const response = await poAttainmentApi.getPoIndirectAttainmentData(filters.curriculumId, selectedIndirectSurveyId);
        if (active) {
          setIndirectData(response.status !== false ? response.data : null);
        }
      } catch {
        if (active) {
          setIndirectData(null);
        }
      } finally {
        if (active) {
          setIndirectLoading(false);
        }
      }
    };

    loadIndirectData();

    return () => {
      active = false;
    };
  }, [activeTab, filters.curriculumId, selectedIndirectSurveyId]);

  useEffect(() => {
    setDirectIndirectSourceOptions(poAttainmentApi.getPoDirectIndirectSourceOptions(indirectSurveyOptions, activityOptions));
  }, [activityOptions, indirectSurveyOptions]);

  const setFilterValue = <K extends keyof PoAttainmentFilters>(key: K, value: PoAttainmentFilters[K]) => {
    if (key === "curriculumId") {
      setTerms([]);
      setData(null);
      setActivityData(null);
      setIndirectData(null);
      setActivityOptions([]);
      setSelectedActivityIds([]);
      setSelectedIndirectSurveyId("");
      setFilters((current) => ({
        ...current,
        curriculumId: value as string,
        termIds: [],
      }));
      return;
    }

    if (key === "termIds") {
      setData(null);
      setActivityData(null);
      setIndirectData(null);
      setSelectedActivityIds([]);
    }

    setFilters((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const openDrilldown = async (row: PoAttainmentRow, methodKey: string) => {
    if (!row.poId) {
      setDrilldownData({
        po: {
          poId: row.poReference,
          poStatement: row.poStatement || "",
        },
        chart: {
          categories: [],
          series: [{ name: "PO Attainment %", data: [] }],
          tooltips: [],
        },
        rows: [],
        notes: ["PO drilldown is unavailable because the backend PO id was not returned for this row."],
      });
      return;
    }

    setPopupLoading(true);
    try {
      const response = await poAttainmentApi.getPoDrilldownData(filters, selectedTermIds, row.poId, methodKey);
      setDrilldownData(response.status !== false ? response.data : null);
    } catch {
      setDrilldownData(null);
    } finally {
      setPopupLoading(false);
    }
  };

  const closeDrilldown = () => {
    setDrilldownData(null);
  };

  const openPerformanceLevels = async (row: PoAttainmentRow, levelKey: string, _levelValue: number | null) => {
    const displayPoId = row.poReference || row.poId || "";
    const displayPoStatement = row.poStatement || "";

    if (!row.poId) {
      setPerformanceLevelsData({
        po: {
          poId: displayPoId,
          poStatement: displayPoStatement,
        },
        levels: [],
      });
      return;
    }

    setPopupLoading(true);
    try {
      const response = await poAttainmentApi.getPoPerformanceLevels(filters.curriculumId, row.poId, levelKey);
      setPerformanceLevelsData(response.status !== false ? {
        ...response.data,
        po: {
          poId: response.data.po.poId || displayPoId,
          poStatement: response.data.po.poStatement || displayPoStatement,
        },
      } : {
        po: {
          poId: displayPoId,
          poStatement: displayPoStatement,
        },
        levels: [],
      });
    } catch {
      setPerformanceLevelsData({
        po: {
          poId: displayPoId,
          poStatement: displayPoStatement,
        },
        levels: [],
      });
    } finally {
      setPopupLoading(false);
    }
  };

  const closePerformanceLevels = () => {
    setPerformanceLevelsData(null);
  };

  const setSelectedActivities = (activityIds: string[]) => {
    setSelectedActivityIds(activityIds);
    if (!activityIds.length) {
      setActivityData(null);
    }
  };

  const setSelectedIndirectSurvey = (surveyId: string) => {
    setSelectedIndirectSurveyId(surveyId);
    if (!surveyId) {
      setIndirectData(null);
    }
  };

  return {
    activeTab,
    activityData,
    activityLoading,
    activityOptions,
    curriculums,
    data,
    directIndirectSourceOptions,
    drilldownData,
    exportOptions,
    filters,
    hasValidFilters,
    indirectData,
    indirectLoading,
    indirectSurveyOptions,
    loading,
    initialAvgPoAttainmentFlag,
    performanceLevelsData,
    popupLoading,
    resultsLoading,
    selectedTermIds,
    setActiveTab,
    setFilterValue,
    setSelectedActivities,
    setSelectedIndirectSurvey,
    selectedIndirectSurveyId,
    selectedActivityIds,
    terms,
    openDrilldown,
    closeDrilldown,
    openPerformanceLevels,
    closePerformanceLevels,
  };
};

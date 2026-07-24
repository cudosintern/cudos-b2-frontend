import axiosInstance from "../../../../utils/api";
import {
  ChartSeries,
  PoActivityAttainmentResponse,
  PoActivitiesResponse,
  PoAttainmentBootstrapResponse,
  PoAttainmentMethod,
  Curriculum,
  PoAttainmentFilters,
  PoAttainmentInitialDataResponse,
  PoExportMetadata,
  PoAttainmentMetricCell,
  PoAttainmentResponse,
  PoDirectIndirectPayload,
  PoDirectIndirectResponse,
  PoDirectIndirectSourceOption,
  PoDrilldownResponse,
  PoIndirectAttainmentResponse,
  PoIndirectSurveyOptionsResponse,
  PoPerformanceLevelsResponse,
  PoWeightagesResponse,
  Term,
  TermsByCurriculumResponse,
} from "./poAttainmentTypes";

const BASE_URL = "/po-attainment";
const PERFORMANCE_LEVELS_BASE_URL = "/attainment_threshold_level";
const staticExportOptions: Array<{ id: "pdf" | "docx"; label: string }> = [
  { id: "pdf", label: ".pdf" },
  { id: "docx", label: ".doc" },
];
const CURRICULUMS_URL = "co_po_mapping/get_academic_batch_dropdown";
const TERMS_URL = "/attainment/cce_data_import/terms";

const unwrap = <T>(response: { data: T }): T => response.data;
const asArray = <T>(value: T[] | undefined | null): T[] => Array.isArray(value) ? value : [];
const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};
const toStringValue = (value: unknown, fallback = "") => {
  if (value === null || value === undefined) {
    return fallback;
  }
  return String(value);
};
const toPositiveInteger = (value: unknown) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};
const toNullableNumber = (value: unknown) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};
const toStringArray = (value: string[] | undefined | null) => asArray<string>(value).map((item) => toStringValue(item));
const mapTooltipLabel = (tooltip: any, fallbackParts: Array<string | undefined> = []) => {
  if (typeof tooltip === "string") {
    return tooltip;
  }

  const courseCode = toStringValue(tooltip?.courseCode ?? tooltip?.course_code);
  const courseTitle = toStringValue(tooltip?.courseTitle ?? tooltip?.course_title);
  if (courseCode || courseTitle) {
    return [courseCode, courseTitle].filter(Boolean).join(" - ");
  }

  const values = [
    toStringValue(tooltip?.poReference ?? tooltip?.po_reference ?? tooltip?.poCode ?? tooltip?.po_code),
    toStringValue(tooltip?.poStatement ?? tooltip?.po_statement),
    ...fallbackParts.map((value) => toStringValue(value)),
  ].filter(Boolean);

  const uniqueValues = values.filter((value, index) => values.indexOf(value) === index);

  return uniqueValues.join(" - ");
};
const requireCurriculumId = (curriculumId: string | number) => {
  const parsed = toPositiveInteger(curriculumId);
  if (!parsed) {
    throw new Error("A valid curriculum id is required.");
  }
  return parsed;
};
const normalizeTermIds = (termIds: Array<string | number>) =>
  termIds
    .map((termId) => toPositiveInteger(termId))
    .filter((termId): termId is number => termId !== null);

const defaultNotes: PoAttainmentResponse["data"]["notes"] = {
  note:
    "The above bar graph depicts the overall class performance with respect to the Threshold % for individual Program Outcomes (POs). The Attainment % for respective columns is calculated using the below formula.",
  formulas: [
    {
      title: "For Attainment based on Threshold method % = X / Y",
      formula: "X / Y",
      lines: [
        "X = Sum of all the Course Outcomes(COs) Threshold based Attainment % mapped to the respective PO",
        "Y = Count of Course Outcomes(COs) mapped to respective PO",
      ],
    },
    {
      title: "For Attainment based on Weighted Average Method % = X / Y",
      formula: "X / Y",
      lines: [
        "X = Sum of all the Course Outcomes(COs) Threshold based Attainment % * Map Level Weighted Attainment % mapped to respective PO",
        "Y = Count of Course Outcomes(COs) mapped to respective PO",
      ],
    },
    {
      title: "For Attainment based on Relative Weighted Average Method % = X / Y",
      formula: "X / Y",
      lines: [
        "X = Sum of all the Course Outcomes(COs) Threshold based Attainment % * Map Level Weighted Attainment % * Mapped Value",
        "Y = Sum of all Mapped Value of the respective PO",
      ],
    },
  ],
};

const normalizeMethodKey = (methodKey: string) => methodKey.trim().toLowerCase().replace(/[\s-]+/g, "_");
const directMethodConfigByKey: Record<string, { label: string; dataKey: string; levelKey: string }> = {
  avg_po_attainment: {
    label: "Average PO Attainment",
    dataKey: "avg_po_attainment",
    levelKey: "average_po_direct_attainment_level",
  },
  po_threshold_attainment: {
    label: "PO Threshold Attainment",
    dataKey: "po_threshold_attainment",
    levelKey: "average_da_level",
  },
  hml_weighted_average_da_avg: {
    label: "HML Weighted Average DA",
    dataKey: "hml_weighted_average_da_avg",
    levelKey: "hml_weighted_average_da_level",
  },
  hml_weighted_multiply_maplevel_da_avg: {
    label: "HML Weighted Multiply Map Level DA",
    dataKey: "hml_weighted_multiply_maplevel_da_avg",
    levelKey: "hml_weighted_multiply_maplevel_da_level",
  },
};

const formatMethodLabel = (methodKey: string) =>
  methodKey
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const getDirectMethodConfig = (method: unknown): PoAttainmentMethod | null => {
  if (typeof method === "string") {
    const methodKey = normalizeMethodKey(method);
    const config = directMethodConfigByKey[methodKey];

    return config ? { key: methodKey, ...config } : null;
  }

  if (!method || typeof method !== "object") {
    return null;
  }

  const rawMethod = method as Record<string, unknown>;
  const methodKey = normalizeMethodKey(
    toStringValue(rawMethod.key ?? rawMethod.method_key ?? rawMethod.dataKey ?? rawMethod.data_key)
  );
  const fallbackConfig = directMethodConfigByKey[methodKey];
  const dataKey = toStringValue(rawMethod.dataKey ?? rawMethod.data_key, fallbackConfig?.dataKey ?? methodKey);
  const levelKey = toStringValue(rawMethod.levelKey ?? rawMethod.level_key, fallbackConfig?.levelKey ?? "");

  if (!dataKey || !levelKey) {
    return null;
  }

  return {
    key: methodKey || normalizeMethodKey(dataKey),
    label: toStringValue(rawMethod.label ?? rawMethod.name ?? rawMethod.method_name, fallbackConfig?.label ?? formatMethodLabel(dataKey)),
    dataKey,
    levelKey,
  };
};

const normalizeDirectMethods = (methods: unknown): PoAttainmentMethod[] =>
  (Array.isArray(methods) ? methods : [])
    .map(getDirectMethodConfig)
    .filter((method): method is PoAttainmentMethod => Boolean(method));

const getMetric = (row: any, keys: string[]): PoAttainmentMetricCell => {
  const valueKey = keys.find((key) => row?.[key] !== undefined);
  const value = toNumber(valueKey ? row[valueKey] : undefined);
  return {
    value,
    drilldownKey: toStringValue(row?.method_key ?? valueKey ?? keys[0]),
  };
};

const getLevel = (row: any, valueKeys: string[], labelKeys: string[], fallbackKey: string) => {
  const valueKey = valueKeys.find((key) => row?.[key] !== undefined);
  const labelKey = labelKeys.find((key) => row?.[key] !== undefined);
  return {
    value: toNumber(valueKey ? row[valueKey] : undefined),
    label: toStringValue(labelKey ? row[labelKey] : undefined, "View Level"),
    levelKey: toStringValue(row?.level_key ?? fallbackKey),
  };
};

const getDirectMethodCells = (row: any, methods: PoAttainmentMethod[] = []): PoAttainmentResponse["data"]["rows"][number]["methodCells"] =>
  methods.reduce<NonNullable<PoAttainmentResponse["data"]["rows"][number]["methodCells"]>>((cells, method) => {
    cells[method.dataKey] = {
      percentage: {
        value: row?.[method.dataKey] === null || row?.[method.dataKey] === undefined ? null : toNumber(row?.[method.dataKey]),
        drilldownKey: method.dataKey,
      },
      level: {
        value: row?.[method.levelKey] === null || row?.[method.levelKey] === undefined ? null : toNumber(row?.[method.levelKey]),
        label: "View Level",
        levelKey: method.levelKey,
      },
    };

    return cells;
  }, {});

const normalizeDirectRows = (rows: any[] = [], methods: PoAttainmentMethod[] = []): PoAttainmentResponse["data"]["rows"] =>
  rows.map((row, index) => {
    const thresholdMethod = getMetric(row, ["thresholdMethod", "threshold_method", "threshold_attainment_percentage", "threshold_attainment", "threshold"]);
    const weightedAverageMethod = getMetric(row, ["weightedAverageMethod", "weighted_average_method", "weighted_average_attainment_percentage", "weighted_average"]);
    const relativeWeightedAverageMethod = getMetric(row, ["relativeWeightedAverageMethod", "relative_weighted_average_method", "relative_weighted_average_attainment_percentage", "relative_weighted_average"]);

    return {
      slNo: toNumber(row?.slNo ?? row?.sl_no, index + 1),
      poId: toStringValue(row?.poId ?? row?.po_id ?? row?.poReference ?? row?.po_reference ?? row?.po_code, `PO${index + 1}`),
      poReference: toStringValue(row?.poReference ?? row?.po_reference ?? row?.po_code ?? row?.po_id, `PO${index + 1}`),
      poStatement: toStringValue(row?.poStatement ?? row?.po_statement ?? row?.statement),
      methodCells: getDirectMethodCells(row, methods),
      thresholdMethod,
      thresholdLevel: getLevel(row, ["thresholdLevel", "threshold_level", "threshold_attainment_level"], ["thresholdLevelLabel", "threshold_level_label", "threshold_level_name"], "threshold"),
      weightedAverageMethod,
      weightedAverageLevel: getLevel(row, ["weightedAverageLevel", "weighted_average_level", "weighted_average_attainment_level"], ["weightedAverageLevelLabel", "weighted_average_level_label", "weighted_average_level_name"], "weighted_average"),
      relativeWeightedAverageMethod,
      relativeWeightedAverageLevel: getLevel(row, ["relativeWeightedAverageLevel", "relative_weighted_average_level", "relative_weighted_average_attainment_level"], ["relativeWeightedAverageLevelLabel", "relative_weighted_average_level_label", "relative_weighted_average_level_name"], "relative_weighted_average"),
    };
  });

const normalizeSeries = (series: any[] = []): ChartSeries[] =>
  series.map((item, index) => ({
    name: toStringValue(item?.name, `Series ${index + 1}`),
    color: toStringValue(item?.color, ["#55bfd6", "#f59e0b", "#64748b"][index] ?? "#55bfd6"),
    data: asArray<number>(item?.data).map((value) => toNumber(value)),
  }));

const mapDirectSummary = (payload: any, filters: PoAttainmentFilters): PoAttainmentResponse => {
  const data = payload?.data ?? payload;
  const methods = normalizeDirectMethods(data?.methods);
  const responseNotes = data?.notes ?? {};
  return {
    status: payload?.status ?? true,
    message: toStringValue(payload?.message),
    data: {
      methods,
      filters: {
        curriculumId: filters.curriculumId,
        curriculumLabel: "",
        termIds: filters.termIds,
        termLabels: filters.termIds,
        coreCoursesOnly: filters.coreCoursesOnly,
      },
      chart: {
        categories: toStringArray(data?.chart?.categories),
        series: normalizeSeries(data?.chart?.series),
      },
      rows: normalizeDirectRows(data?.rows, methods),
      notes: {
        note: toStringValue(responseNotes?.note, defaultNotes.note),
        formulas: Array.isArray(responseNotes?.formulas) && responseNotes.formulas.length
          ? responseNotes.formulas
          : defaultNotes.formulas,
      },
    },
  };
};

const mapActivitySummary = (payload: any, selectedActivities: string[]): PoActivityAttainmentResponse => {
  const data = payload?.data ?? payload;
  const rows = asArray<any>(data?.rows).map((row) => ({
    criteria: toStringValue(row?.criteria ?? row?.criteria_name),
    poCode: toStringValue(row?.poCode ?? row?.poReference ?? row?.po_reference ?? row?.po_code ?? row?.po_id),
    poStatement: toStringValue(row?.poStatement ?? row?.po_statement ?? row?.statement),
    attainmentPercentage: toNumber(row?.attainmentPercentage ?? row?.attainment_percentage ?? row?.attainment),
    attainmentLevel: toNullableNumber(row?.attainmentLevel ?? row?.attainment_level),
  }));
  const criteriaLabel = rows.find((row) => row.criteria)?.criteria ?? "";
  return {
    status: payload?.status ?? true,
    message: toStringValue(payload?.message),
    data: {
      selectedActivities,
      criteriaLabel,
      chart: {
        categories: toStringArray(data?.chart?.categories),
        series: [{ name: toStringValue(data?.chart?.series?.[0]?.name, "Attainment %"), data: asArray<number>(data?.chart?.series?.[0]?.data).map((value) => toNumber(value)) }],
        tooltips: asArray<any>(data?.chart?.tooltips).map((tooltip, index) =>
          mapTooltipLabel(tooltip, [rows[index]?.poCode, rows[index]?.poStatement])
        ),
      },
      rows,
      table: data?.table ?? { showEntriesOptions: [20, 50, 100] },
    },
  };
};

const mapIndirectSummary = (payload: any, selectedSurveyId: string): PoIndirectAttainmentResponse => {
  const data = payload?.data ?? payload;
  const rows = asArray<any>(data?.rows).map((row) => ({
    poReference: toStringValue(row?.poReference ?? row?.po_reference ?? row?.po_code ?? row?.po_id),
    poStatement: toStringValue(row?.poStatement ?? row?.po_statement ?? row?.statement),
    attainmentPercentage: toNumber(
      row?.attainmentPercentage ?? row?.ia_percentage ?? row?.attainment_percentage ?? row?.attainment
    ),
    attainmentLevel: toNullableNumber(row?.attainmentLevel ?? row?.attainment_level),
  }));
  return {
    status: payload?.status ?? true,
    message: toStringValue(payload?.message),
    data: {
      selectedSurveyId,
      selectedSurveyLabel: toStringValue(data?.selectedSurveyLabel ?? data?.selected_survey_label),
      surveyStatus: data?.surveyStatus ?? data?.survey_status ?? (rows.length ? "closed" : "empty"),
      chart: {
        title: toStringValue(data?.chart?.title, "Program Outcome (POs) Indirect Attainment Analysis"),
        categories: toStringArray(data?.chart?.categories),
        series: [{ name: toStringValue(data?.chart?.series?.[0]?.name, "Attainment %"), data: asArray<number>(data?.chart?.series?.[0]?.data).map((value) => toNumber(value)) }],
        tooltips: asArray<any>(data?.chart?.tooltips).map((tooltip, index) =>
          mapTooltipLabel(tooltip, [rows[index]?.poReference, rows[index]?.poStatement])
        ),
      },
      rows,
      warningMessage: data?.warningMessage ?? data?.warning_message ?? null,
    },
  };
};

const mapDirectDrilldown = (payload: any): PoDrilldownResponse => {
  const data = payload?.data ?? payload;
  const rows = asArray<any>(data?.rows).map((row) => ({
    courseCode: toStringValue(row?.courseCode ?? row?.course_code),
    courseTitle: toStringValue(row?.courseTitle ?? row?.course_title),
    attainmentPercentage: toNullableNumber(
      row?.attainmentPercentage ?? row?.attainment_percentage ?? row?.attainment_value ?? row?.attainment
    ),
    attainmentLevel: toNullableNumber(row?.attainmentLevel ?? row?.attainment_level),
  }));
  const chartCategories = toStringArray(data?.chart?.categories);
  const normalizedCategories = chartCategories.length
    ? chartCategories
    : rows.map((row) => row.courseCode || row.courseTitle);
  const chartSeriesData = asArray<number>(data?.chart?.series?.[0]?.data).map((value) =>
    toNullableNumber(value)
  );
  const normalizedChartData = rows.length
    ? rows.map((row, index) => row.attainmentPercentage ?? chartSeriesData[index] ?? null)
    : chartSeriesData;

  return {
    status: payload?.status ?? true,
    message: toStringValue(payload?.message),
    data: {
      po: {
        poId: toStringValue(
          data?.po?.poReference ?? data?.po?.po_reference ?? data?.po?.poCode ?? data?.po?.po_code ?? data?.po?.poId ?? data?.po?.po_id
        ),
        poStatement: toStringValue(data?.po?.poStatement ?? data?.po?.po_statement ?? data?.po?.statement),
      },
      chart: {
        categories: normalizedCategories,
        series: [{
          name: toStringValue(data?.chart?.series?.[0]?.name, "PO Attainment %"),
          data: normalizedChartData.map((value) => value ?? 0),
        }],
        tooltips: asArray<any>(data?.chart?.tooltips).map((tooltip, index) => {
          const courseCode = rows[index]?.courseCode;
          const courseTitle = rows[index]?.courseTitle;
          return mapTooltipLabel(tooltip, [courseCode, courseTitle]);
        }),
      },
      rows,
      notes: toStringArray(data?.notes),
    },
  };
};

const mapDirectIndirectResponse = (payload: any): PoDirectIndirectResponse => {
  const data = payload?.data ?? payload;
  const rows = asArray<any>(data?.rows).map((row) => ({
    poReference: toStringValue(row?.poReference ?? row?.po_reference ?? row?.PO),
    actualDirectAttainmentPercentage: toNumber(row?.actualDirectAttainmentPercentage ?? row?.actual_direct_attainment_pct),
    actualDirectAttainmentLevel: toNumber(row?.actualDirectAttainmentLevel ?? row?.actual_direct_attainment_level),
    actualIndirectAttainmentPercentage: toNumber(row?.actualIndirectAttainmentPercentage ?? row?.actual_indirect_attainment_pct),
    actualIndirectAttainmentLevel: toNumber(row?.actualIndirectAttainmentLevel ?? row?.actual_indirect_attainment_level),
    actualActivityAttainmentPercentage: toNullableNumber(row?.actualActivityAttainmentPercentage ?? row?.actual_activity_attainment_pct),
    actualActivityAttainmentLevel: toNullableNumber(row?.actualActivityAttainmentLevel ?? row?.actual_activity_attainment_level),
    directAttainmentWeightagePercentage: toNumber(row?.directAttainmentWeightagePercentage ?? row?.direct_attainment_weightage_pct),
    indirectAttainmentWeightagePercentage: toNumber(row?.indirectAttainmentWeightagePercentage ?? row?.indirect_attainment_weightage_pct),
    activityAttainmentWeightagePercentage: toNullableNumber(row?.activityAttainmentWeightagePercentage ?? row?.activity_attainment_weightage_pct),
    afterWeightageDirectAttainmentPercentage: toNumber(row?.afterWeightageDirectAttainmentPercentage ?? row?.after_weightage_average_direct_attainment_pct),
    afterWeightageDirectAttainmentLevel: toNumber(row?.afterWeightageDirectAttainmentLevel ?? row?.after_weightage_average_direct_attainment_level),
    afterWeightageIndirectAttainmentPercentage: toNumber(row?.afterWeightageIndirectAttainmentPercentage ?? row?.after_weightage_average_indirect_attainment_pct),
    afterWeightageIndirectAttainmentLevel: toNumber(row?.afterWeightageIndirectAttainmentLevel ?? row?.after_weightage_average_indirect_attainment_level),
    afterWeightageActivityAttainmentPercentage: toNullableNumber(row?.afterWeightageActivityAttainmentPercentage ?? row?.after_weightage_activity_attainment_pct),
    afterWeightageActivityAttainmentLevel: toNullableNumber(row?.afterWeightageActivityAttainmentLevel ?? row?.after_weightage_activity_attainment_level),
    overallAttainmentPercentage: toNumber(row?.overallAttainmentPercentage ?? row?.overall_attainment_pct),
    attainmentLevel: toNumber(row?.attainmentLevel ?? row?.attainment_level),
  }));

  return {
    status: payload?.status ?? true,
    message: toStringValue(payload?.message),
    data: {
      chart: {
        title: toStringValue(data?.chart?.title, "Program Outcome (PO) Direct and Indirect Attainment Analysis"),
        categories: toStringArray(data?.chart?.categories),
        series: [{
          name: toStringValue(data?.chart?.series?.[0]?.name, "PO Attainment %"),
          data: asArray<number>(data?.chart?.series?.[0]?.data).map((value) => toNumber(value)),
        }],
        tooltips: asArray<any>(data?.chart?.tooltips).map((tooltip, index) =>
          mapTooltipLabel(tooltip, [rows[index]?.poReference])
        ),
      },
      rows,
      note: toStringValue(data?.note),
      exportStatus: toNumber(data?.exportStatus ?? data?.export_status),
    },
  };
};

const buildFinalWeightedRequestPayload = (payload: PoDirectIndirectPayload) => {
  const resolvedRows = payload.surveyRows.map((row) => {
    const parsed = parseCombinedSourceOptionId(row.sourceId);
    return {
      ...row,
      sourceType: row.sourceType ?? parsed.sourceType,
      sourceId: parsed.rawId,
    };
  });
  const surveyRows = resolvedRows.filter((row) => row.sourceType === "survey");
  const activityRows = resolvedRows.filter((row) => row.sourceType === "activity");

  return {
    crclm_id: requireCurriculumId(payload.curriculumId),
    term_ids: normalizeTermIds(payload.termIds),
    core_crs_id: payload.coreCoursesOnly ? 1 : 0,
    direct_attainment: payload.directWeight,
    indirect_attainment: payload.indirectWeight,
    act_attainment: payload.activityWeight,
    survey_ids: surveyRows.map((row) => Number(row.sourceId)),
    survey_weightages: surveyRows.map((row) => Number(row.weightage)),
    survey_type_flags: surveyRows.map(() => 0),
    activity_ids: activityRows.map((row) => Number(row.sourceId)),
    activity_weightages: activityRows.map((row) => Number(row.weightage)),
    activity_type_flags: activityRows.map(() => 1),
    avg_po_attnt_flag: payload.avgPoAttntFlag ?? 0,
    weightage_mode: "overall",
  };
};

const getFilenameFromDisposition = (contentDisposition: string | undefined, fallback: string) => {
  if (!contentDisposition) {
    return fallback;
  }
  const match = contentDisposition.match(/filename="?([^"]+)"?/i);
  return match?.[1] || fallback;
};

const parseBlobErrorMessage = async (blob: Blob, fallback: string) => {
  try {
    const text = await blob.text();
    const parsed = JSON.parse(text);
    return parsed?.message || parsed?.detail || fallback;
  } catch {
    return fallback;
  }
};

const buildCombinedSourceOptionId = (sourceType: "survey" | "activity", rawId: string) => `${sourceType}:${rawId}`;

const parseCombinedSourceOptionId = (value: string) => {
  const [sourceType, ...rest] = String(value || "").split(":");
  return {
    sourceType: sourceType === "activity" ? "activity" as const : "survey" as const,
    rawId: rest.join(":"),
  };
};

const mapPerformanceLevels = (payload: any, _poId: string): PoPerformanceLevelsResponse => {
  const data = payload?.data ?? payload;
  const items = asArray<any>(data?.items ?? data?.levels);

  return {
    status: payload?.status ?? true,
    message: toStringValue(payload?.message),
    data: {
      po: {
        poId: toStringValue(data?.po?.poReference ?? data?.po?.po_reference ?? data?.po?.poCode ?? data?.po?.po_code),
        poStatement: toStringValue(data?.po?.poStatement ?? data?.po?.po_statement),
      },
      levels: items.map((item, index) => ({
        slNo: toNumber(item?.slNo ?? item?.sl_no, index + 1),
        levelName: toStringValue(item?.levelName ?? item?.performance_level_name ?? item?.performance_level_name_alias),
        levelValue: toNumber(item?.levelValue ?? item?.performance_level_value),
        startRange: toNumber(item?.startRange ?? item?.start_range),
        comparator: toStringValue(item?.comparator ?? item?.conditional_opr, ">=") as ">=",
        endRange: toNumber(item?.endRange ?? item?.end_range),
        description: toStringValue(item?.description),
      })),
    },
  };
};

const mapCurriculumOptions = (payload: any): Curriculum[] =>
  asArray<any>(payload?.data)
    .map((item) => {
      const id = toPositiveInteger(item?.value ?? item?.academic_batch_id ?? item?.id);
      const label = toStringValue(
        item?.label
          ?? item?.academic_batch_code
          ?? item?.academic_batch_name
          ?? item?.academic_batch_desc
          ?? item?.name
      );

      return id && label ? { id: String(id), label } : null;
    })
    .filter((item): item is Curriculum => Boolean(item));

const mapTermOptions = (payload: any): Term[] =>
  asArray<any>(payload?.data)
    .map((item) => {
      const id = toPositiveInteger(item?.semester_id ?? item?.term_id ?? item?.value ?? item?.id);
      const label = toStringValue(
        item?.display_name
          ?? item?.term_name
          ?? item?.semester_desc
          ?? item?.semester_name
          ?? item?.semester_code
          ?? item?.label
          ?? item?.name
      );

      return id && label ? { id: String(id), label } : null;
    })
    .filter((item): item is Term => Boolean(item));

export const poAttainmentApi = {
  async getPoAttainmentInitialData(): Promise<PoAttainmentInitialDataResponse> {
    const response = unwrap<any>(await axiosInstance.get(CURRICULUMS_URL));
    return {
      status: response?.status ?? true,
      message: toStringValue(response?.message),
      data: {
        filters: {
          curriculums: mapCurriculumOptions(response),
          exportOptions: staticExportOptions,
        },
      },
    };
  },

  async getTermsByCurriculum(curriculumId: string): Promise<TermsByCurriculumResponse> {
    const response = unwrap<any>(await axiosInstance.get(TERMS_URL, {
      params: { academic_batch_id: requireCurriculumId(curriculumId) },
    }));
    return {
      status: response?.status ?? true,
      message: toStringValue(response?.message),
      data: {
        curriculumId,
        terms: mapTermOptions(response),
      },
    };
  },

  async getBootstrap(curriculumId: string): Promise<PoAttainmentBootstrapResponse> {
    return unwrap(await axiosInstance.get(`${BASE_URL}/bootstrap`, { params: { crclm_id: requireCurriculumId(curriculumId) } }));
  },

  async getPoWeightages(curriculumId: string): Promise<PoWeightagesResponse> {
    return unwrap(await axiosInstance.get(`${BASE_URL}/po-weightages`, { params: { crclm_id: requireCurriculumId(curriculumId) } }));
  },

  async getPoAttainmentData(filters: PoAttainmentFilters, termIds: number[]): Promise<PoAttainmentResponse> {
    const response = unwrap<any>(await axiosInstance.get(`${BASE_URL}/direct-summary`, {
      params: {
        crclm_id: requireCurriculumId(filters.curriculumId),
        term_ids: normalizeTermIds(termIds).join(","),
        core_crs_id: filters.coreCoursesOnly ? 1 : 0,
      },
    }));
    return mapDirectSummary(response, filters);
  },

  async getPoDrilldownData(filters: PoAttainmentFilters, termIds: number[], poId: string, methodKey: string): Promise<PoDrilldownResponse> {
    const response = unwrap<any>(await axiosInstance.get(`${BASE_URL}/direct-drilldown`, {
      params: {
        crclm_id: requireCurriculumId(filters.curriculumId),
        term_ids: normalizeTermIds(termIds).join(","),
        po_id: poId,
        core_crs_id: filters.coreCoursesOnly ? 1 : 0,
        method_key: methodKey,
      },
    }));
    return mapDirectDrilldown(response);
  },

  async getPoPerformanceLevels(curriculumId: string, poId: string, _levelKey: string): Promise<PoPerformanceLevelsResponse> {
    const response = unwrap<any>(await axiosInstance.get(`${PERFORMANCE_LEVELS_BASE_URL}/po_lvl/po/${poId}/performance_levels`, {
      params: {
        academic_batch_id: requireCurriculumId(curriculumId),
      },
    }));
    return mapPerformanceLevels(response, poId);
  },

  async getPoActivities(curriculumId?: string, termIds: number[] = []): Promise<PoActivitiesResponse> {
    if (!curriculumId) {
      return {
        status: true,
        message: "",
        data: {
          activities: [],
        },
      };
    }
    const response = unwrap<any>(await axiosInstance.get(`${BASE_URL}/activities`, {
      params: { crclm_id: requireCurriculumId(curriculumId), term_ids: normalizeTermIds(termIds).join(",") },
    }));
    return {
      status: response.status ?? true,
      message: response.message,
      data: {
        activities: asArray<any>(response.data).map((item) => ({
          id: toStringValue(item?.po_extca_id),
          label: toStringValue(item?.activity_name),
        })),
      },
    };
  },

  async getPoActivityAttainmentData(curriculumId: string, selectedActivities: string[]): Promise<PoActivityAttainmentResponse> {
    const activityId = selectedActivities[0] ?? "";
    const response = unwrap<any>(await axiosInstance.get(`${BASE_URL}/activity-summary`, {
      params: { crclm_id: requireCurriculumId(curriculumId), activity_id: activityId },
    }));
    return mapActivitySummary(response, selectedActivities);
  },

  async getPoIndirectSurveyOptions(curriculumId?: string): Promise<PoIndirectSurveyOptionsResponse> {
    if (!curriculumId) {
      return {
        status: true,
        message: "",
        data: {
          surveys: [],
        },
      };
    }
    const response = unwrap<any>(await axiosInstance.get(`${BASE_URL}/surveys`, {
      params: { crclm_id: requireCurriculumId(curriculumId) },
    }));
    return {
      status: response.status ?? true,
      message: response.message,
      data: {
        surveys: asArray<any>(response.data).map((item) => ({
          id: toStringValue(item?.survey_id),
          label: toStringValue(item?.name),
        })),
      },
    };
  },

  async getPoIndirectAttainmentData(curriculumId: string, selectedSurveyId: string): Promise<PoIndirectAttainmentResponse> {
    const response = unwrap<any>(await axiosInstance.get(`${BASE_URL}/indirect-summary`, {
      params: { crclm_id: requireCurriculumId(curriculumId), survey_id: selectedSurveyId },
    }));
    return mapIndirectSummary(response, selectedSurveyId);
  },

  getPoDirectIndirectSourceOptions(surveyOptions: PoIndirectSurveyOptionsResponse["data"]["surveys"] = [], activityOptions: PoActivitiesResponse["data"]["activities"] = []): PoDirectIndirectSourceOption[] {
    return [
      ...surveyOptions.map((survey) => ({
        id: buildCombinedSourceOptionId("survey", survey.id),
        label: survey.label,
        sourceType: "survey" as const,
      })),
      ...activityOptions.map((activity) => ({
        id: buildCombinedSourceOptionId("activity", activity.id),
        label: activity.label,
        sourceType: "activity" as const,
      })),
    ];
  },

  async getPoDirectIndirectAttainmentData(payload: PoDirectIndirectPayload): Promise<PoDirectIndirectResponse> {
    const response = unwrap<any>(await axiosInstance.post(`${BASE_URL}/final-weighted`, buildFinalWeightedRequestPayload(payload)));
    return mapDirectIndirectResponse(response);
  },

  async exportPoAttainment(payload: {
    activeTab: "direct" | "activity" | "indirect" | "direct_indirect";
    exportType: "pdf" | "docx";
    curriculumId: string;
    termIds: number[];
    coreCoursesOnly: boolean;
    directWeight?: number;
    indirectWeight?: number;
    actWeight?: number;
    surveyIds?: string[];
    surveyWeightages?: number[];
    activityIds?: string[];
    activityWeightages?: number[];
    avgPoAttntFlag?: number;
    latestGeneratedReport?: unknown;
    exportStatus?: number;
    surveyId?: string;
    latestChartImage?: string | null;
    exportMetadata?: PoExportMetadata;
  }): Promise<{ blob: Blob; filename: string }> {
    const requestPayload = {
      crclm_id: requireCurriculumId(payload.curriculumId),
      term_ids: normalizeTermIds(payload.termIds),
      core_crs_id: payload.coreCoursesOnly ? 1 : 0,
      direct_attainment: payload.directWeight ?? 0,
      indirect_attainment: payload.indirectWeight ?? 0,
      act_attainment: payload.actWeight ?? 0,
      survey_ids: payload.surveyIds?.map((value) => Number(value)) ?? [],
      survey_weightages: payload.surveyWeightages ?? [],
      survey_type_flags: payload.surveyIds?.map(() => 0) ?? [],
      activity_ids: payload.activityIds?.map((value) => Number(value)) ?? [],
      activity_weightages: payload.activityWeightages ?? [],
      activity_type_flags: payload.activityIds?.map(() => 1) ?? [],
      avg_po_attnt_flag: payload.avgPoAttntFlag ?? 0,
      weightage_mode: "overall",
      active_tab: payload.activeTab,
      export_type: payload.exportType,
      latest_generated_report: payload.latestGeneratedReport,
      latest_chart_image: payload.latestChartImage ?? undefined,
      export_metadata: payload.exportMetadata ?? undefined,
      export_status: payload.exportStatus,
      survey_id: payload.surveyId ? Number(payload.surveyId) : undefined,
    };

    const response = await axiosInstance.post<Blob>(`${BASE_URL}/export`, requestPayload, {
      responseType: "blob",
    });
    const responseBlob = response.data as Blob;
    const contentType = String(response.headers["content-type"] ?? "");
    if (contentType.includes("application/json")) {
      throw new Error(await parseBlobErrorMessage(responseBlob, "PO Attainment export failed."));
    }

    return {
      blob: responseBlob,
      filename: getFilenameFromDisposition(
        response.headers["content-disposition"],
        `po_attainment_${payload.activeTab}.${payload.exportType === "pdf" ? "pdf" : "docx"}`
      ),
    };
  },
};

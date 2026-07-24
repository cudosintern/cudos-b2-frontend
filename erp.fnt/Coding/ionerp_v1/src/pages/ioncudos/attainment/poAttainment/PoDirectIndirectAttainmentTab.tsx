import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Customized,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { poAttainmentApi } from "./poAttainmentApi";
import {
  PoAttainmentFilters,
  PoDirectIndirectFormState,
  PoDirectIndirectResponse,
  PoDirectIndirectSourceOption,
  PoDirectIndirectSurveyRow,
} from "./poAttainmentTypes";

interface PoDirectIndirectAttainmentTabProps {
  filters: PoAttainmentFilters;
  termIds: number[];
  initialAvgPoAttainmentFlag: number;
  sourceOptions: PoDirectIndirectSourceOption[];
  onReportChange: (report: {
    result: PoDirectIndirectResponse["data"];
    directWeight: number;
    indirectWeight: number;
    activityWeight: number;
    surveyRows: Array<{
      sourceId: string;
      sourceType: "survey" | "activity";
      weightage: number;
    }>;
  } | null) => void;
}

interface RowErrors {
  sourceId?: string;
  weightage?: string;
}

const selectClassName =
  "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#437880]";
const inputClassName =
  "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#437880]";
const outputHeaderCellClassName =
  "border border-gray-200 bg-slate-50 px-3 py-3 text-center text-xs font-semibold text-slate-700";
const outputHeaderStyle = { textTransform: "none" as const };
const directOnlyNote = "Note: Below analysis is based purely on Direct Attainment as you have not selected any survey.";
const chartLegendColor = "#2f80ed";

const DirectIndirectChartLegend: React.FC = (props) => {
  const width = typeof (props as { width?: number }).width === "number" ? (props as { width?: number }).width ?? 0 : 0;

  return (
    <g transform={`translate(${Math.max(0, width - 92)}, 18)`}>
      <rect width="10" height="10" fill={chartLegendColor} />
      <text x="16" y="9" fill="#475569" fontSize="11">PO Attainment %</text>
    </g>
  );
};

const normalizeIntegerInput = (value: string) => {
  const digitsOnly = value.replace(/\D/g, "");
  if (!digitsOnly) {
    return 0;
  }

  return Number.parseInt(digitsOnly, 10);
};

const createRow = (id: string, weightage: number | "" = ""): PoDirectIndirectSurveyRow => ({
  id,
  sourceId: "",
  weightage,
});

const parseCombinedSourceOptionId = (value: string) => {
  const [sourceType, ...rest] = String(value || "").split(":");
  return {
    sourceType: sourceType === "activity" ? ("activity" as const) : ("survey" as const),
    rawId: rest.join(":"),
  };
};

const toNullableNumber = (value: unknown) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const weightedAverage = (values: Array<{ value: number | null; weight: number }>) => {
  let numerator = 0;
  let denominator = 0;
  values.forEach((item) => {
    if (item.value === null) {
      return;
    }
    numerator += item.value * item.weight;
    denominator += item.weight;
  });
  if (denominator === 0) {
    return null;
  }
  return Number((numerator / denominator).toFixed(2));
};

const normalizeSelectedWeights = (rows: PoDirectIndirectSurveyRow[], useAverage: boolean) => {
  if (!rows.length) {
    return [];
  }
  if (useAverage) {
    const equalWeight = Number((100 / rows.length).toFixed(6));
    return rows.map(() => equalWeight);
  }
  return rows.map((row) => (typeof row.weightage === "number" ? row.weightage : 0));
};

const getDirectRowMetric = (row: any) => {
  const methodCells = row?.methodCells ?? {};
  const methods = [
    "po_threshold_attainment",
    "avg_po_attainment",
    "hml_weighted_average_da_avg",
    "hml_weighted_multiply_maplevel_da_avg",
  ];

  for (const methodKey of methods) {
    const methodCell = methodCells[methodKey];
    const percentage = toNullableNumber(methodCell?.percentage?.value ?? row?.[methodKey]);
    const level = toNullableNumber(methodCell?.level?.value ?? row?.[`${methodKey}_level`]);
    if (percentage !== null || level !== null) {
      return {
        percentage,
        level,
      };
    }
  }

  return {
    percentage: toNullableNumber(row?.thresholdMethod?.value ?? row?.threshold_method?.value ?? row?.threshold_attainment ?? row?.threshold_attainment_percentage),
    level: toNullableNumber(row?.thresholdLevel?.value ?? row?.threshold_level?.value ?? row?.threshold_attainment_level),
  };
};

const buildLocalFinalWeightedReport = async (
  filters: PoAttainmentFilters,
  termIds: number[],
  directWeight: number,
  indirectWeight: number,
  activityWeight: number,
  avgPoAttntFlag: number,
  hasSelectedSources: boolean,
  surveyRows: PoDirectIndirectSurveyRow[],
  activityRows: PoDirectIndirectSurveyRow[]
): Promise<PoDirectIndirectResponse["data"]> => {
  const [directResponse, surveyResponses, activityResponses] = await Promise.all([
    poAttainmentApi.getPoAttainmentData(filters, termIds),
    Promise.all(
      surveyRows.map((row) =>
        poAttainmentApi.getPoIndirectAttainmentData(filters.curriculumId, parseCombinedSourceOptionId(row.sourceId).rawId)
      )
    ),
    Promise.all(
      activityRows.map((row) =>
        poAttainmentApi.getPoActivityAttainmentData(filters.curriculumId, [parseCombinedSourceOptionId(row.sourceId).rawId])
      )
    ),
  ]);

  const directRows = directResponse.data.rows ?? [];
  const surveyWeights = normalizeSelectedWeights(surveyRows, avgPoAttntFlag === 1);
  const activityWeights = normalizeSelectedWeights(activityRows, avgPoAttntFlag === 1);

  const byPoReference = new Map<
    string,
    {
      poStatement?: string;
      surveyPercentages: Array<{ value: number | null; weight: number }>;
      surveyLevels: Array<{ value: number | null; weight: number }>;
      activityPercentages: Array<{ value: number | null; weight: number }>;
      activityLevels: Array<{ value: number | null; weight: number }>;
    }
  >();

  surveyResponses.forEach((response, index) => {
    const weight = surveyWeights[index] ?? 0;
    response.data.rows.forEach((row) => {
      const poReference = row.poReference;
      if (!poReference) {
        return;
      }
      const bucket = byPoReference.get(poReference) ?? {
        poStatement: row.poStatement,
        surveyPercentages: [],
        surveyLevels: [],
        activityPercentages: [],
        activityLevels: [],
      };
      bucket.surveyPercentages.push({ value: toNullableNumber(row.attainmentPercentage), weight });
      bucket.surveyLevels.push({ value: toNullableNumber(row.attainmentLevel), weight });
      byPoReference.set(poReference, bucket);
    });
  });

  activityResponses.forEach((response, index) => {
    const weight = activityWeights[index] ?? 0;
    response.data.rows.forEach((row) => {
      const poReference = row.poCode;
      if (!poReference) {
        return;
      }
      const bucket = byPoReference.get(poReference) ?? {
        poStatement: row.poStatement,
        surveyPercentages: [],
        surveyLevels: [],
        activityPercentages: [],
        activityLevels: [],
      };
      bucket.activityPercentages.push({ value: toNullableNumber(row.attainmentPercentage), weight });
      bucket.activityLevels.push({ value: toNullableNumber(row.attainmentLevel), weight });
      byPoReference.set(poReference, bucket);
    });
  });

  const rows = directRows.map((directRow) => {
    const poReference = directRow.poReference || directRow.poId || "";
    const bucket = byPoReference.get(poReference);
    const directMetric = getDirectRowMetric(directRow);
    const actualIndirectAttainmentPercentage = bucket ? weightedAverage(bucket.surveyPercentages) : null;
    const actualIndirectAttainmentLevel = bucket ? weightedAverage(bucket.surveyLevels) : null;
    const actualActivityAttainmentPercentage = bucket ? weightedAverage(bucket.activityPercentages) : null;
    const actualActivityAttainmentLevel = bucket ? weightedAverage(bucket.activityLevels) : null;

    const afterWeightageDirectAttainmentPercentage = directMetric.percentage === null ? null : Number(((directMetric.percentage * directWeight) / 100).toFixed(2));
    const afterWeightageDirectAttainmentLevel = directMetric.level === null ? null : Number(((directMetric.level * directWeight) / 100).toFixed(2));
    const afterWeightageIndirectAttainmentPercentage = actualIndirectAttainmentPercentage === null ? null : Number(((actualIndirectAttainmentPercentage * indirectWeight) / 100).toFixed(2));
    const afterWeightageIndirectAttainmentLevel = actualIndirectAttainmentLevel === null ? null : Number(((actualIndirectAttainmentLevel * indirectWeight) / 100).toFixed(2));
    const afterWeightageActivityAttainmentPercentage = actualActivityAttainmentPercentage === null ? null : Number(((actualActivityAttainmentPercentage * activityWeight) / 100).toFixed(2));
    const afterWeightageActivityAttainmentLevel = actualActivityAttainmentLevel === null ? null : Number(((actualActivityAttainmentLevel * activityWeight) / 100).toFixed(2));

    const overallAttainmentPercentage = Number(
      (
        (afterWeightageDirectAttainmentPercentage ?? 0) +
        (afterWeightageIndirectAttainmentPercentage ?? 0) +
        (afterWeightageActivityAttainmentPercentage ?? 0)
      ).toFixed(2)
    );
    const attainmentLevel = Number(
      (
        (afterWeightageDirectAttainmentLevel ?? 0) +
        (afterWeightageIndirectAttainmentLevel ?? 0) +
        (afterWeightageActivityAttainmentLevel ?? 0)
      ).toFixed(2)
    );

    return {
      poReference,
      actualDirectAttainmentPercentage: directMetric.percentage ?? 0,
      actualDirectAttainmentLevel: directMetric.level ?? 0,
      actualIndirectAttainmentPercentage: actualIndirectAttainmentPercentage ?? 0,
      actualIndirectAttainmentLevel: actualIndirectAttainmentLevel ?? 0,
      actualActivityAttainmentPercentage,
      actualActivityAttainmentLevel,
      directAttainmentWeightagePercentage: directWeight,
      indirectAttainmentWeightagePercentage: indirectWeight,
      activityAttainmentWeightagePercentage: activityWeight > 0 ? activityWeight : null,
      afterWeightageDirectAttainmentPercentage: afterWeightageDirectAttainmentPercentage ?? 0,
      afterWeightageDirectAttainmentLevel: afterWeightageDirectAttainmentLevel ?? 0,
      afterWeightageIndirectAttainmentPercentage: afterWeightageIndirectAttainmentPercentage ?? 0,
      afterWeightageIndirectAttainmentLevel: afterWeightageIndirectAttainmentLevel ?? 0,
      afterWeightageActivityAttainmentPercentage,
      afterWeightageActivityAttainmentLevel,
      overallAttainmentPercentage,
      attainmentLevel,
    };
  });

  const chartRows = rows.length > 0 ? rows : directRows.map((row) => ({
    poReference: row.poReference,
    overallAttainmentPercentage: 0,
  } as PoDirectIndirectResponse["data"]["rows"][number]));

  return {
    chart: {
      title: "Program Outcome (PO) Direct and Indirect Attainment Analysis",
      categories: chartRows.map((row) => row.poReference),
      series: [
        {
          name: "PO Attainment %",
          data: chartRows.map((row) => row.overallAttainmentPercentage),
        },
      ],
      tooltips: chartRows.map((row) => row.poReference),
    },
    rows,
    note: hasSelectedSources ? undefined : "Analysis is purely based on Direct Attainment because no survey is selected.",
    exportStatus: 1,
  };
};

const getNextRowId = (rows: PoDirectIndirectSurveyRow[]) => {
  const nextIndex = rows.length + 1;
  return `row-${Date.now()}-${nextIndex}`;
};

const toDisplayNumber = (value: number | null | undefined) => (value === null || value === undefined ? "-" : value.toFixed(2));

const PoDirectIndirectAttainmentTab: React.FC<PoDirectIndirectAttainmentTabProps> = ({
  filters,
  termIds,
  initialAvgPoAttainmentFlag,
  sourceOptions,
  onReportChange,
}) => {
  const [formState, setFormState] = useState<PoDirectIndirectFormState>({
    directWeight: 0,
    indirectWeight: 0,
    activityWeight: 0,
    surveyRows: [createRow("row-1", 100)],
  });
  const [rowErrors, setRowErrors] = useState<Record<string, RowErrors>>({});
  const [topError, setTopError] = useState("");
  const [result, setResult] = useState<PoDirectIndirectResponse["data"] | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const chartWrapperRef = useRef<HTMLDivElement | null>(null);

  const clearSubmittedResult = () => {
    setResult(null);
    onReportChange(null);
  };

  const totalWeightage = useMemo(
    () =>
      formState.surveyRows.reduce((sum, row) => sum + (typeof row.weightage === "number" ? row.weightage : 0), 0),
    [formState.surveyRows]
  );

  const chartData = useMemo(() => {
    if (!result) {
      return [];
    }

    return result.chart.categories.map((category, index) => ({
      category,
      value: result.chart.series[0].data[index],
      tooltip: result.chart.tooltips[index],
    }));
  }, [result]);

  const selectedSourceIds = useMemo(
    () => formState.surveyRows.map((row) => row.sourceId).filter(Boolean),
    [formState.surveyRows]
  );
  const selectedRows = useMemo(
    () =>
      formState.surveyRows
        .filter((row) => row.sourceId)
        .map((row) => ({
          ...row,
          sourceType: sourceOptions.find((option) => option.id === row.sourceId)?.sourceType ?? "survey",
          numericWeightage: typeof row.weightage === "number" ? row.weightage : 0,
        })),
    [formState.surveyRows, sourceOptions]
  );
  const selectedSurveyRows = useMemo(
    () => selectedRows.filter((row) => row.sourceType === "survey"),
    [selectedRows]
  );
  const selectedActivityRows = useMemo(
    () => selectedRows.filter((row) => row.sourceType === "activity"),
    [selectedRows]
  );

  const allUniqueOptionsUsed = sourceOptions.length > 0 && selectedSourceIds.length >= sourceOptions.length;
  const hasSelectedSources = selectedSourceIds.length > 0;
  const hasSelectedActivities = selectedActivityRows.length > 0;
  const isDirectOnlyMode = !hasSelectedSources;
  const surveyRowWeightage = selectedSurveyRows.reduce((sum, row) => sum + row.numericWeightage, 0);
  const activityRowWeightage = selectedActivityRows.reduce((sum, row) => sum + row.numericWeightage, 0);
  const hasActivityWeightConfigured = formState.activityWeight > 0;
  const shouldValidateRowWeightages = initialAvgPoAttainmentFlag !== 1;

  const hasActivityColumns = useMemo(
    () =>
      Boolean(
        result?.rows.some(
          (row) =>
            (row.activityAttainmentWeightagePercentage !== null
              && row.activityAttainmentWeightagePercentage !== undefined
              && row.activityAttainmentWeightagePercentage !== 0)
            || (row.afterWeightageActivityAttainmentPercentage !== null
              && row.afterWeightageActivityAttainmentPercentage !== undefined
              && row.afterWeightageActivityAttainmentPercentage !== 0)
        )
      ),
    [result]
  );

  useEffect(() => {
    if (!result || !chartWrapperRef.current) {
      return;
    }

    const svg = chartWrapperRef.current.querySelector("svg");
    if (!svg) {
      return;
    }

    const svgWidth = Math.max(1, Math.round(svg.clientWidth || Number(svg.getAttribute("width")) || 0));
    const svgHeight = Math.max(1, Math.round(svg.clientHeight || Number(svg.getAttribute("height")) || 0));
    svg.setAttribute("viewBox", `0 0 ${svgWidth} ${svgHeight}`);
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  }, [result, chartData]);

  const updateRow = (rowId: string, key: "sourceId" | "weightage", value: string) => {
    clearSubmittedResult();

    setFormState((current) => ({
      ...current,
      surveyRows: current.surveyRows.map((row) =>
        row.id === rowId
          ? {
              ...row,
              [key]: key === "weightage" ? (value === "" ? "" : normalizeIntegerInput(value)) : value,
            }
          : row
      ),
    }));

    setRowErrors((current) => {
      if (!current[rowId]) {
        return current;
      }

      return {
        ...current,
        [rowId]: {
          ...current[rowId],
          [key]: undefined,
        },
      };
    });
  };

  const addRow = () => {
    if (allUniqueOptionsUsed) {
      return;
    }
    clearSubmittedResult();
    setFormState((current) => ({
      ...current,
      surveyRows: [...current.surveyRows, createRow(getNextRowId(current.surveyRows))],
    }));
  };

  const deleteRow = (rowId: string) => {
    clearSubmittedResult();
    setFormState((current) => {
      if (current.surveyRows.length === 1) {
        return {
          ...current,
          surveyRows: [createRow(current.surveyRows[0].id)],
        };
      }

      return {
        ...current,
        surveyRows: current.surveyRows.filter((row) => row.id !== rowId),
      };
    });

    setRowErrors((current) => {
      const nextErrors = { ...current };
      delete nextErrors[rowId];
      return nextErrors;
    });
  };

  const handleSubmit = async () => {
    const nextRowErrors: Record<string, RowErrors> = {};

    if (hasSelectedSources) {
      formState.surveyRows.forEach((row) => {
        const errors: RowErrors = {};

        if (!row.sourceId) {
          errors.sourceId = "This field is required.";
        }

        if (row.weightage === "") {
          errors.weightage = "This field is required.";
        }

        if (errors.sourceId || errors.weightage) {
          nextRowErrors[row.id] = errors;
        }
      });
    }

    const duplicateSourceIds = selectedSourceIds.filter((sourceId, index) => selectedSourceIds.indexOf(sourceId) !== index);
    if (hasSelectedSources && duplicateSourceIds.length) {
      formState.surveyRows.forEach((row) => {
        if (row.sourceId && duplicateSourceIds.includes(row.sourceId)) {
          nextRowErrors[row.id] = {
            ...nextRowErrors[row.id],
            sourceId: "Duplicate survey/activity selections are not allowed.",
          };
        }
      });
    }

    const hasMissingRowFields = Object.keys(nextRowErrors).length > 0;
    const activityWeightActive = hasSelectedActivities && hasActivityWeightConfigured;
    const hasMissingActivitySelection = hasActivityWeightConfigured && !hasSelectedActivities;
    const hasMissingActivityWeight = hasSelectedActivities && formState.activityWeight <= 0;
    const hasInvalidOverallSum =
      activityWeightActive
        ? formState.directWeight + formState.indirectWeight + formState.activityWeight !== 100
        : formState.directWeight + formState.indirectWeight !== 100 || formState.activityWeight !== 0;
    const hasInvalidSurveyWeightageSum = shouldValidateRowWeightages && selectedSurveyRows.length > 0 && surveyRowWeightage !== 100;
    const hasInvalidActivityWeightageSum = shouldValidateRowWeightages && activityWeightActive && activityRowWeightage !== 100;

    setRowErrors(nextRowErrors);
    setResult(null);
    onReportChange(null);

    if (
      hasMissingRowFields
      || hasMissingActivitySelection
      || hasMissingActivityWeight
      || hasInvalidOverallSum
      || hasInvalidSurveyWeightageSum
      || hasInvalidActivityWeightageSum
    ) {
      if (hasInvalidSurveyWeightageSum) {
        setTopError("Error!!! Please make sure that sum of Survey Weightage is 100.");
      } else if (hasInvalidActivityWeightageSum) {
        setTopError("Error!!! Please make sure that sum of Activity Weightage is 100.");
      } else if (hasMissingActivitySelection) {
        setTopError("Error!!! Please select at least one activity row when Activity Attainment is greater than 0.");
      } else if (hasMissingActivityWeight) {
        setTopError("Error!!! Please enter Activity Attainment when an activity row is selected.");
      } else if (hasInvalidOverallSum) {
        setTopError(
          activityWeightActive
            ? "Error!!! Direct Attainment, Indirect Attainment and Activity Attainment sum should be 100."
            : "Error!!! Direct Attainment and Indirect Attainment sum should be 100."
        );
      } else {
        setTopError("");
      }

      return;
    }

    setTopError("");
    setSubmitting(true);

    try {
      const payload = {
        curriculumId: filters.curriculumId,
        termIds,
        coreCoursesOnly: filters.coreCoursesOnly,
        directWeight: formState.directWeight,
        indirectWeight: formState.indirectWeight,
        activityWeight: activityWeightActive ? formState.activityWeight : 0,
        avgPoAttntFlag: initialAvgPoAttainmentFlag,
        surveyRows: isDirectOnlyMode
          ? []
          : formState.surveyRows
              .filter((row) => {
                const sourceType = sourceOptions.find((option) => option.id === row.sourceId)?.sourceType ?? "survey";
                return sourceType !== "activity" || activityWeightActive;
              })
              .map((row) => ({
                sourceId: row.sourceId,
                sourceType: sourceOptions.find((option) => option.id === row.sourceId)?.sourceType ?? "survey",
                weightage: Number(row.weightage),
              })),
      };

      const response = await poAttainmentApi.getPoDirectIndirectAttainmentData(payload);
      const hasRenderableRows = Boolean(response.status !== false && response.data?.rows?.length);
      const nextResult = hasRenderableRows
        ? response.data
        : await buildLocalFinalWeightedReport(
            filters,
            termIds,
            formState.directWeight,
            formState.indirectWeight,
            activityWeightActive ? formState.activityWeight : 0,
            initialAvgPoAttainmentFlag,
            hasSelectedSources,
            selectedRows.filter((row) => row.sourceType === "survey"),
            selectedRows.filter((row) => row.sourceType === "activity")
          );

      setResult(nextResult);
      onReportChange({
        result: nextResult,
        directWeight: formState.directWeight,
        indirectWeight: formState.indirectWeight,
        activityWeight: activityWeightActive ? formState.activityWeight : 0,
        surveyRows: payload.surveyRows,
      });
    } catch (error) {
      setTopError(error instanceof Error ? error.message : "Direct and Indirect Attainment backend integration is not available.");
      setResult(null);
      onReportChange(null);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-6">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <span>
            Direct Attainment <span className="text-red-500">*</span>
          </span>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={String(formState.directWeight)}
            onChange={(event) =>
              {
                clearSubmittedResult();
                setFormState((current) => ({
                  ...current,
                  directWeight: normalizeIntegerInput(event.target.value),
                }));
              }
            }
            className="w-20 rounded-md border border-gray-300 bg-white px-3 py-2 text-right text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#437880]"
          />
          <span>%</span>
        </label>

        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <span>
            Indirect Attainment <span className="text-red-500">*</span>
          </span>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={String(formState.indirectWeight)}
            onChange={(event) =>
              {
                clearSubmittedResult();
                setFormState((current) => ({
                  ...current,
                  indirectWeight: normalizeIntegerInput(event.target.value),
                }));
              }
            }
            className="w-20 rounded-md border border-gray-300 bg-white px-3 py-2 text-right text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#437880]"
          />
          <span>%</span>
        </label>

        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <span>
            Activity Attainment <span className="text-red-500">*</span>
          </span>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={String(formState.activityWeight)}
            onChange={(event) =>
              {
                clearSubmittedResult();
                setFormState((current) => ({
                  ...current,
                  activityWeight: normalizeIntegerInput(event.target.value),
                }));
              }
            }
            className="w-20 rounded-md border border-gray-300 bg-white px-3 py-2 text-right text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#437880]"
          />
          <span>%</span>
        </label>
      </div>

      {topError && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">
          {topError}
        </div>
      )}

      <div className="overflow-x-auto rounded-md border border-gray-200">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border border-gray-200 bg-slate-50 px-3 py-3 text-center text-sm font-semibold text-slate-700">
                Sl No.
              </th>
              <th className="border border-gray-200 bg-slate-50 px-3 py-3 text-center text-sm font-semibold text-slate-700">
                Survey / Extracurricular Activity Name: <span className="text-red-500">*</span>
              </th>
              <th className="border border-gray-200 bg-slate-50 px-3 py-3 text-center text-sm font-semibold text-slate-700">
                Weightage %: <span className="text-red-500">*</span>
              </th>
              <th className="border border-gray-200 bg-slate-50 px-3 py-3 text-center text-sm font-semibold text-slate-700">
                Delete
              </th>
            </tr>
          </thead>
          <tbody>
            {formState.surveyRows.map((row, index) => (
              <React.Fragment key={row.id}>
                <tr>
                  <td className="border border-gray-200 px-3 py-3 text-center text-sm text-slate-700">
                    {index + 1}.
                  </td>
                  <td className="border border-gray-200 px-3 py-3">
                    <div className="mx-auto max-w-xs">
                      <select
                        value={row.sourceId}
                        onChange={(event) => updateRow(row.id, "sourceId", event.target.value)}
                        className={selectClassName}
                      >
                        <option value="">Select Survey/Activity</option>
                        {sourceOptions.map((option) => (
                          <option
                            key={option.id}
                            value={option.id}
                            disabled={option.id !== row.sourceId && selectedSourceIds.includes(option.id)}
                          >
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td className="border border-gray-200 px-3 py-3">
                    <div className="mx-auto flex max-w-xs items-center gap-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={row.weightage}
                        onChange={(event) => updateRow(row.id, "weightage", event.target.value)}
                        className={`${inputClassName} text-right`}
                      />
                      <span className="text-sm text-slate-700">%</span>
                    </div>
                  </td>
                  <td className="border border-gray-200 px-3 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => deleteRow(row.id)}
                      className="text-base text-slate-700 transition hover:text-red-600"
                      title="Delete row"
                    >
                      <span aria-hidden="true" className="inline-block leading-none">x</span>
                    </button>
                  </td>
                </tr>
                {!isDirectOnlyMode && (rowErrors[row.id]?.sourceId || rowErrors[row.id]?.weightage) && (
                  <tr>
                    <td className="border border-gray-200 px-3 py-2" />
                    <td className="border border-gray-200 px-3 py-2 text-sm text-red-600">
                      {rowErrors[row.id]?.sourceId ?? ""}
                    </td>
                    <td className="border border-gray-200 px-3 py-2 text-sm text-red-600">
                      {rowErrors[row.id]?.weightage ?? ""}
                    </td>
                    <td className="border border-gray-200 px-3 py-2" />
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <span>Total:</span>
          <input
            type="text"
            readOnly
            value={totalWeightage}
            className="w-20 rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-700"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={addRow}
          disabled={allUniqueOptionsUsed}
          className="inline-flex items-center gap-2 rounded bg-[#1c75d8] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1560b3] disabled:cursor-not-allowed disabled:opacity-70"
        >
          <span aria-hidden="true" className="inline-block text-base leading-none">+</span> Add more rows
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded bg-[#437880] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#3a6a71] disabled:cursor-not-allowed disabled:opacity-70"
        >
          Submit
        </button>
      </div>

      {submitting && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
          Loading direct and indirect attainment data...
        </div>
      )}

      {result && (
        <div className="space-y-5">
          {isDirectOnlyMode && (
            <div className="rounded-md border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">
              {directOnlyNote}
            </div>
          )}

          <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 bg-slate-50 px-5 py-3">
              <h2 className="text-sm font-semibold text-slate-800">{result.chart.title}</h2>
            </div>
            <div className="p-5">
              <div ref={chartWrapperRef} className="h-[320px] rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 16, right: 104, left: 12, bottom: 10 }}>
                    <CartesianGrid stroke="#d1d5db" vertical={false} />
                    <XAxis dataKey="category" tick={{ fontSize: 12, fill: "#475569" }} />
                    <YAxis
                      domain={[0, 100]}
                      tickFormatter={(value) => `${Number(value).toFixed(2)}%`}
                      tick={{ fontSize: 12, fill: "#64748b" }}
                    />
                    <Tooltip
                      cursor={false}
                      wrapperStyle={{ outline: "none" }}
                      contentStyle={{ fontSize: 11, padding: "6px 8px" }}
                      itemStyle={{ fontSize: 11 }}
                      labelStyle={{ fontSize: 11 }}
                      formatter={(value: number | string) => `${Number(value).toFixed(2)}%`}
                      labelFormatter={(_, payload) => payload?.[0]?.payload?.tooltip ?? ""}
                    />
                    <Customized component={DirectIndirectChartLegend} />
                    <Bar dataKey="value" name="PO Attainment %" barSize={18} maxBarSize={18}>
                      <LabelList
                        dataKey="value"
                        position="top"
                        formatter={(value: number | string) => `${Number(value).toFixed(2)}%`}
                        style={{ fontSize: 11, fill: "#475569" }}
                      />
                      {chartData.map((entry) => (
                        <Cell key={entry.category} fill="#55bfd6" />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-md border border-gray-200 bg-white shadow-sm">
            <table className="cia-table-consolidated w-full border-collapse" style={outputHeaderStyle}>
              <thead>
                <tr>
                  <th className={outputHeaderCellClassName} style={outputHeaderStyle}>PO Reference</th>
                  <th className={outputHeaderCellClassName} style={outputHeaderStyle}>Actual Direct Attainment %</th>
                  <th className={outputHeaderCellClassName} style={outputHeaderStyle}>Actual Direct Attainment Level</th>
                  <th className={outputHeaderCellClassName} style={outputHeaderStyle}>Actual Indirect Attainment %</th>
                  <th className={outputHeaderCellClassName} style={outputHeaderStyle}>Actual Indirect Attainment Level</th>
                  {hasActivityColumns && <th className={outputHeaderCellClassName} style={outputHeaderStyle}>Actual Activity Attainment %</th>}
                  {hasActivityColumns && <th className={outputHeaderCellClassName} style={outputHeaderStyle}>Actual Activity Attainment Level</th>}
                  <th className={outputHeaderCellClassName} style={outputHeaderStyle}>Direct Attainment Weightage %</th>
                  <th className={outputHeaderCellClassName} style={outputHeaderStyle}>Indirect Attainment Weightage %</th>
                  {hasActivityColumns && <th className={outputHeaderCellClassName} style={outputHeaderStyle}>Activity Attainment Weightage %</th>}
                  <th className={outputHeaderCellClassName} style={outputHeaderStyle}>After Weightage/Average Direct Attainment %</th>
                  <th className={outputHeaderCellClassName} style={outputHeaderStyle}>After Weightage/Average Direct Attainment Level</th>
                  <th className={outputHeaderCellClassName} style={outputHeaderStyle}>After Weightage/Average Indirect Attainment %</th>
                  <th className={outputHeaderCellClassName} style={outputHeaderStyle}>After Weightage/Average Indirect Attainment Level</th>
                  {hasActivityColumns && <th className={outputHeaderCellClassName} style={outputHeaderStyle}>After Weightage/Average Activity Attainment %</th>}
                  {hasActivityColumns && <th className={outputHeaderCellClassName} style={outputHeaderStyle}>After Weightage/Average Activity Attainment Level</th>}
                  <th className={outputHeaderCellClassName} style={outputHeaderStyle}>Overall Attainment %</th>
                  <th className={outputHeaderCellClassName} style={outputHeaderStyle}>Attainment Level</th>
                </tr>
              </thead>
              <tbody>
                {result.rows.map((row) => (
                  <tr key={row.poReference}>
                    <td className="border border-gray-200 px-3 py-2 text-center text-xs text-slate-700">{row.poReference}</td>
                    <td className="border border-gray-200 px-3 py-2 text-center text-xs text-slate-700">{toDisplayNumber(row.actualDirectAttainmentPercentage)}</td>
                    <td className="border border-gray-200 px-3 py-2 text-center text-xs text-slate-700">{toDisplayNumber(row.actualDirectAttainmentLevel)}</td>
                    <td className="border border-gray-200 px-3 py-2 text-center text-xs text-slate-700">{toDisplayNumber(row.actualIndirectAttainmentPercentage)}</td>
                    <td className="border border-gray-200 px-3 py-2 text-center text-xs text-slate-700">{toDisplayNumber(row.actualIndirectAttainmentLevel)}</td>
                    {hasActivityColumns && <td className="border border-gray-200 px-3 py-2 text-center text-xs text-slate-700">{toDisplayNumber(row.actualActivityAttainmentPercentage)}</td>}
                    {hasActivityColumns && <td className="border border-gray-200 px-3 py-2 text-center text-xs text-slate-700">{toDisplayNumber(row.actualActivityAttainmentLevel)}</td>}
                    <td className="border border-gray-200 px-3 py-2 text-center text-xs text-slate-700">{toDisplayNumber(row.directAttainmentWeightagePercentage)}</td>
                    <td className="border border-gray-200 px-3 py-2 text-center text-xs text-slate-700">{toDisplayNumber(row.indirectAttainmentWeightagePercentage)}</td>
                    {hasActivityColumns && <td className="border border-gray-200 px-3 py-2 text-center text-xs text-slate-700">{toDisplayNumber(row.activityAttainmentWeightagePercentage)}</td>}
                    <td className="border border-gray-200 px-3 py-2 text-center text-xs text-slate-700">{toDisplayNumber(row.afterWeightageDirectAttainmentPercentage)}</td>
                    <td className="border border-gray-200 px-3 py-2 text-center text-xs text-slate-700">{toDisplayNumber(row.afterWeightageDirectAttainmentLevel)}</td>
                    <td className="border border-gray-200 px-3 py-2 text-center text-xs text-slate-700">{toDisplayNumber(row.afterWeightageIndirectAttainmentPercentage)}</td>
                    <td className="border border-gray-200 px-3 py-2 text-center text-xs text-slate-700">{toDisplayNumber(row.afterWeightageIndirectAttainmentLevel)}</td>
                    {hasActivityColumns && <td className="border border-gray-200 px-3 py-2 text-center text-xs text-slate-700">{toDisplayNumber(row.afterWeightageActivityAttainmentPercentage)}</td>}
                    {hasActivityColumns && <td className="border border-gray-200 px-3 py-2 text-center text-xs text-slate-700">{toDisplayNumber(row.afterWeightageActivityAttainmentLevel)}</td>}
                    <td className="border border-gray-200 px-3 py-2 text-center text-xs text-slate-700">{toDisplayNumber(row.overallAttainmentPercentage)}</td>
                    <td className="border border-gray-200 px-3 py-2 text-center text-xs text-slate-700">{toDisplayNumber(row.attainmentLevel)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PoDirectIndirectAttainmentTab;

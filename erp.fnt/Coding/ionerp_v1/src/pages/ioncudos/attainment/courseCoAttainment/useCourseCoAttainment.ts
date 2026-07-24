import { useEffect, useMemo, useRef, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "react-toastify";
import { courseCoAttainmentApi } from "./courseCoAttainmentApi";
import { createAttainmentDocBuilder, downloadWordDocument } from "./attainmentDocTemplate";
import { createAttainmentPdfBuilder, openPdfPreview } from "./attainmentPdfTemplate";
import {
  CourseCoAttainmentFilterCatalogResponse,
  CourseCoAttainmentFilterOptionsResponse,
  CourseCoAttainmentFiltersState,
  CourseCoAttainmentCourseOption,
  CourseCoAttainmentBloomsPreviewData,
  CourseCoAttainmentCombinedPreviewData,
  CourseCoAttainmentDirectIndirectPreviewData,
  DirectIndirectAttainmentRow,
  DirectIndirectChartPoint,
  CourseCoAttainmentInitialState,
  CourseCoAttainmentModuleFlags,
  CourseCoAttainmentOption,
  CourseCoAttainmentOverviewData,
  CourseCoAttainmentRawRecord,
  CourseCoAttainmentSectionBlock,
  CourseCoAttainmentTabDataResponse,
  CourseCoAttainmentTabId,
  CourseCoAttainmentHookResult,
  CourseCoAttainmentTermOption,
  CourseCoAttainmentExportFormat,
  BloomLevelRow,
  CompactChartPoint,
  FinalizeCourseOverviewRow,
  FinalizeOccasionOption,
  FinalizeStatusMessage,
  CoAttainmentRow,
  TargetLevelRow,
  CoPoMatrixRow,
  ProgramOutcomeAttainmentRow,
  MapLevelWeightageRow,
  FormulaCard,
} from "./courseCoAttainmentTypes";

const emptyFilters: CourseCoAttainmentFiltersState = {
  curriculumId: "",
  termId: "",
  courseId: "",
};

const exportableTabs: CourseCoAttainmentTabId[] = ["cce", "mte", "finalize", "directIndirect"];
const exportTabLabels: Record<CourseCoAttainmentTabId, string> = {
  cce: "CCE - COs Attainment",
  mte: "MTE - COs Attainment",
  finalize: "Finalize Course - COs Attainment",
  blooms: "Bloom's Level Attainment",
  directIndirect: "Direct and Indirect Attainment",
};

const organisationName = "Demo Organization";
const moduleTitle = "Course CO Attainment (CIA, MTE, TEE)";

const emptyFilterCatalog: CourseCoAttainmentFilterCatalogResponse = {
  curriculums: [],
  terms: [],
  courses: [],
};

const emptyTabData = (): CourseCoAttainmentTabDataResponse => ({
  cce: {
    title: "CCE - COs Attainment List",
    sections: [],
    finalizeLinkText: "Click here to Finalize course.",
  },
  mte: {
    title: "MTE - COs Attainment List",
    sections: [],
    finalizeLinkText: "Click here to Finalize course MTE data",
  },
  targetLevels: {
    title: "Direct Attainment / Target Levels",
    rows: [],
    publishButtonLabel: "Finalize Course CIA for Publish",
  },
  noteSection: {
    note:
      "The above bar graph depicts the overall class performance with respect to the Threshold % for individual Course Outcome (COs). The Threshold based Attainment % & Average based Attainment % is calculated using the below formula.",
    formulas: [
      {
        title: "For Threshold based Attainment % = ( x / y ) * 100",
        lines: [
          "x = Count of Students >= to Threshold %",
          "y = Total number of Students Attempted .",
        ],
      },
      {
        title: "For Average based Attainment % = ( x / y ) *100",
        lines: [
          "x = Average Secured marks of Attempted Students",
          "y = Maximum Marks .",
        ],
      },
    ],
  },
  finalize: {
    typeOptions: [{ id: "all-selected", label: "Select All" }],
    defaultTypeId: "",
    note: "Note : Select all Occasions to Finalize COs Attainment",
    finalizedTableTitle: "Overall Course Outcomes COs Attainments are Finalized",
    finalizedRows: [],
    coPoMatrixTitle: "Course - Course Outcomes (COs) to Program Outcomes (POs) Attainment Matrix",
    coPoMatrixColumns: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"],
    coPoMatrixRows: [],
    programOutcomesTitle: "Program Outcomes POs Attainment by the Course",
    programOutcomeRows: [],
    mapLevelWeightageTitle: "Map Level Weightage",
    mapLevelWeightageRows: [],
    calculationNotes: [
      {
        title: "For Attainment based on Threshold method % = X / Y",
        lines: [
          "X = Sum of all the Course Outcomes(COs) Threshold based Attainment % mapped to the respective Program Outcome(PO)",
          "Y = Count of Course Outcomes(COs) mapped to respective PO",
        ],
      },
      {
        title: "For Attainment based on Weighted Average Method % = X / Y",
        lines: [
          "X = Sum of all the Course Outcomes(COs) Attainment % * Map Level Weighted Attainment % mapped to the respective Program Outcome(PO)",
          "Y = Count of Course Outcomes(COs) mapped to respective PO",
        ],
      },
      {
        title: "For Attainment based on Relative Weighted Average Method % = X / Y",
        lines: [
          "X = Sum of all the Course Outcomes(COs) Attainment % * Map Level Weighted * Mapped Value",
          "Y = Sum of all Mapped Value of the respective Program Outcome(PO)",
        ],
      },
    ],
  },
  blooms: {
    typeOptions: [
      { id: "", label: "Select Type" },
      { id: "cia", label: "CCE/CIA" },
      { id: "tee", label: "SEE/TEE" },
    ],
    sectionOptions: [{ id: "", label: "Select Section" }],
    occasionOptions: [
      { id: "", label: "Select Occassion" },
      { id: "all_occasion", label: "All Occasion" },
    ],
    studentOptions: [{ id: "", label: "Select Student" }],
    defaultTypeId: "",
    defaultSectionId: "",
    defaultOccasionId: "",
    defaultStudentId: "",
    chartTitle: "Bloom's Level Attainment",
    chartPoints: [],
    rows: [],
    messages: [],
  },
  directIndirect: {
    surveyOptions: [],
    defaultSurveyId: "",
    directWeight: "80",
    indirectWeight: "20",
    note: "Survey needs to be closed to view indirect attainment.",
    submitButtonLabel: "Submit",
    validationMessage: "",
    previewMessages: [],
    selectedSurveyLabel: "",
    rows: [],
    chartTitle: "Direct and Indirect Attainment",
    chartPoints: [],
    previewReady: false,
    canFinalize: false,
    finalizeButtonLabel: "Finalize Direct & Indirect",
    finalizeMessage: "",
  },
});

const asArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

const asRecord = (value: unknown): CourseCoAttainmentRawRecord | null =>
  typeof value === "object" && value !== null ? (value as CourseCoAttainmentRawRecord) : null;

const readCollection = (value: unknown, field: string): unknown[] => {
  if (Array.isArray(value)) {
    return value;
  }

  const record = asRecord(value);
  if (!record) {
    return [];
  }

  const directValue = record[field];
  if (Array.isArray(directValue)) {
    return directValue;
  }

  const nestedRecord = asRecord(record.data);
  const nestedValue = nestedRecord?.[field];
  return Array.isArray(nestedValue) ? nestedValue : [];
};

const toStringId = (value: unknown) => (value === null || value === undefined ? "" : String(value));

const toArrayValue = (value: unknown): string[] =>
  asArray<unknown>(value).map((item) => String(item)).filter((item) => item.length > 0);

const parseAvailableAssessmentTypes = (value: unknown): string[] =>
  asArray<unknown>(value)
    .flatMap((item) => {
      if (typeof item === "string") {
        return [item];
      }

      const record = asRecord(item);
      if (!record) {
        return [];
      }

      const availableValue = record.available ?? record.is_available;
      if (availableValue !== undefined && availableValue !== null && !toBool(availableValue)) {
        return [];
      }

      const code = readString(record, "code", "assessment_type", "type", "label", "name");
      return code ? [code] : [];
    })
    .filter((item, index, items) => items.indexOf(item) === index);

const readString = (record: CourseCoAttainmentRawRecord, ...keys: string[]) => {
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null && String(value).length > 0) {
      return String(value);
    }
  }
  return "";
};

const readPercentString = (record: CourseCoAttainmentRawRecord, ...keys: string[]) => {
  const value = readString(record, ...keys);
  if (!value) {
    return "";
  }

  return value.includes("%") ? value : `${value}%`;
};

const formatPercentageDisplay = (value: unknown): string => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return `${value.toFixed(2)}%`;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return "";
    }

    const numericValue = Number(trimmed.replace("%", "").trim());
    return Number.isFinite(numericValue) ? `${numericValue.toFixed(2)}%` : trimmed;
  }

  return "";
};

const readNumber = (record: CourseCoAttainmentRawRecord, ...keys: string[]) => {
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null && value !== "") {
      const parsed = Number(value);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }
  }
  return 0;
};

const readBoolean = (record: CourseCoAttainmentRawRecord, ...keys: string[]) => {
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null) {
      return value === true || value === 1 || value === "1" || value === "true";
    }
  }
  return false;
};

const mapCurriculumsFromInitial = (curriculums: unknown[]): CourseCoAttainmentFilterCatalogResponse["curriculums"] =>
  curriculums
    .map((item) => {
      const record = asRecord(item);
      if (!record) {
        return null;
      }
      return {
        id: toStringId(record.curriculum_id ?? record.academic_batch_id ?? record.id ?? record.value),
        label: readString(
          record,
          "label",
          "name",
          "curriculum_name",
          "academic_batch_code",
          "academic_batch_name",
          "curriculum_code",
          "batch_code",
          "code",
          "academic_batch_desc",
          "curriculum_description"
        ),
      };
    })
    .filter((item): item is CourseCoAttainmentFilterCatalogResponse["curriculums"][number] => Boolean(item?.id && item.label));

const readInitialCollection = (initial: unknown, ...fields: string[]): unknown[] => {
  const record = asRecord(initial);
  if (!record) {
    return [];
  }

  for (const field of fields) {
    const value = record[field];
    if (Array.isArray(value)) {
      return value;
    }
  }

  const nestedRecord = asRecord(record.data);
  if (!nestedRecord) {
    return [];
  }

  for (const field of fields) {
    const value = nestedRecord[field];
    if (Array.isArray(value)) {
      return value;
    }
  }

  return [];
};

const mapTerms = (terms: unknown[], fallbackCurriculumId = ""): CourseCoAttainmentTermOption[] =>
  terms
    .map((item) => {
      const record = asRecord(item);
      if (!record) {
        return null;
      }
      return {
        id: toStringId(record.term_id ?? record.semester_id ?? record.id ?? record.value),
        label: readString(record, "semester_desc", "term_name", "label", "name", "semester", "semester_name"),
        curriculumId: toStringId(record.curriculum_id ?? record.academic_batch_id ?? record.curriculumId ?? fallbackCurriculumId),
      };
    })
    .filter((item): item is CourseCoAttainmentTermOption => Boolean(item?.id && item.label));

const mapCourses = (
  courses: unknown[],
  fallbackCurriculumId = "",
  fallbackTermId = ""
): CourseCoAttainmentCourseOption[] =>
  courses
    .map((item) => {
      const record = asRecord(item);
      if (!record) {
        return null;
      }
      const courseCode = readString(record, "course_code", "code", "course");
      const courseTitle = readString(record, "course_title", "course_name", "name");
      const label = readString(record, "label") || [courseCode, courseTitle].filter(Boolean).join(" - ");
      return {
        id: toStringId(record.course_id ?? record.crs_id ?? record.id ?? record.value),
        label,
        curriculumId: toStringId(record.curriculum_id ?? record.academic_batch_id ?? record.curriculumId ?? fallbackCurriculumId),
        termId: toStringId(record.term_id ?? record.semester_id ?? record.termId ?? fallbackTermId),
      };
    })
    .filter((item): item is CourseCoAttainmentCourseOption => Boolean(item?.id && item.label));

const formatPercentValue = (value: unknown): string => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return `${value.toFixed(2)}%`;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return "0.00%";
    }
    const numericValue = Number(trimmed.replace("%", ""));
    return Number.isFinite(numericValue) ? `${numericValue.toFixed(2)}%` : trimmed;
  }

  return "0.00%";
};

const readRawValue = (record: CourseCoAttainmentRawRecord, ...keys: string[]) => {
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null) {
      if (typeof value !== "string" || value.trim().length > 0) {
        return value;
      }
    }
  }
  return undefined;
};

const readMappedPercentValue = (record: CourseCoAttainmentRawRecord, ...keys: string[]) => {
  const value = readRawValue(record, ...keys);
  return value === undefined ? "0.00%" : formatPercentValue(value);
};

const hasAnyMappedValue = (record: CourseCoAttainmentRawRecord, ...keys: string[]) =>
  readRawValue(record, ...keys) !== undefined;

const toNumericPercent = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value.replace("%", "").trim());
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

const normalizeAssessmentType = (value: string): "CIA" | "MTE" | "TEE" | "" => {
  const normalised = value.trim().toUpperCase();
  if (["CIA", "CIE", "CCE"].includes(normalised)) {
    return "CIA";
  }
  if (normalised === "MTE") {
    return "MTE";
  }
  if (["TEE", "SEE", "ESE"].includes(normalised)) {
    return "TEE";
  }
  return "";
};

const assessmentTypeForApi = (value: string): string => {
  return normalizeAssessmentType(value) || "CIA";
};

const isBloomCiaType = (value: string) => assessmentTypeForApi(value) === "CIA";

const BLOOM_ALL_OCCASION_ID = "all_occasion";
const BLOOM_SELECT_SECTION_OPTION: CourseCoAttainmentOption = { id: "", label: "Select Section" };
const BLOOM_SELECT_OCCASION_OPTION: CourseCoAttainmentOption = { id: "", label: "Select Occassion" };
const BLOOM_ALL_OCCASION_OPTION: CourseCoAttainmentOption = { id: BLOOM_ALL_OCCASION_ID, label: "All Occasion" };
const BLOOM_SELECT_STUDENT_OPTION: CourseCoAttainmentOption = { id: "", label: "Select Student" };

const mapSectionOptions = (sections: unknown[]): CourseCoAttainmentOption[] =>
  [
    BLOOM_SELECT_SECTION_OPTION,
    ...sections.flatMap((section) => {
      const record = asRecord(section);
      if (!record) {
        return [];
      }

      const id = toStringId(record.id ?? record.section_id ?? record.sectionId);
      const label =
        readString(record, "label", "section_name", "sectionName", "section", "division", "section_code") ||
        id;

      return id ? [{ id, label }] : [];
    }),
  ];

const mapOccasionOptions = (occasions: unknown[]): CourseCoAttainmentOption[] =>
  [
    BLOOM_SELECT_OCCASION_OPTION,
    BLOOM_ALL_OCCASION_OPTION,
    ...occasions.flatMap((occasion) => {
      const record = asRecord(occasion);
      if (!record) {
        return [];
      }

      const id = toStringId(record.id ?? record.occasion_id ?? record.occasionId ?? record.ao_id ?? record.qpd_id);
      const label =
        readString(record, "label", "occasion_name", "occasionName", "occasion_code", "name") ||
        id;

      return id ? [{ id, label }] : [];
    }),
  ].filter((option, index, options) => options.findIndex((item) => item.id === option.id) === index);

const mapSurveyOptions = (surveys: unknown[]): CourseCoAttainmentOption[] =>
  surveys.flatMap((survey) => {
    const record = asRecord(survey);
    if (!record) {
      return [];
    }

    const id = toStringId(record.id ?? record.survey_id ?? record.surveyId);
    const label = readString(record, "label", "survey_name", "surveyName", "survey_title", "name") || id;

    return id ? [{ id, label }] : [];
  });

const mapStudentOptions = (students: unknown[]): CourseCoAttainmentOption[] => {
  const options = students.flatMap((student) => {
    const record = asRecord(student);
    if (!record) {
      return [];
    }

    const id = toStringId(record.student_usn ?? record.usn ?? record.id ?? record.value);
    const studentName = readString(record, "student_name", "name");
    const rollNumber = readString(record, "roll_number", "roll_no");
    const dedupedParts = [rollNumber, studentName, id].filter(
      (part, index, parts) => Boolean(part) && parts.indexOf(part) === index
    );
    const label = readString(record, "label") || dedupedParts.join(" - ");

    return id ? [{ id, label: label || id }] : [];
  });
  return [BLOOM_SELECT_STUDENT_OPTION, ...options];
};

const toBool = (value: unknown) => value === true || value === 1 || value === "1" || value === "true";

const formatGeneratedAt = (date: Date) =>
  date.toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

const sanitizeFilePart = (value: string) =>
  value
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || "NA";

const extractCourseCode = (courseLabel: string, fallbackCourseId: string) => {
  const prefix = courseLabel.split(" - ")[0]?.trim();
  return sanitizeFilePart(prefix || fallbackCourseId || "course");
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const buildHtmlTable = (headers: string[], rows: string[][]) => `
  <table>
    <thead>
      <tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr>
    </thead>
    <tbody>
      ${rows
        .map(
          (row) =>
            `<tr>${row.map((cell) => `<td>${escapeHtml(cell || "-")}</td>`).join("")}</tr>`
        )
        .join("")}
    </tbody>
  </table>
`;

const buildMetadataRows = (metadata: Array<[string, string]>) =>
  metadata.map(([label, value]) => [label, value || "-"]);

const drawPdfHeader = (
  doc: jsPDF,
  metadata: Array<[string, string]>
) => {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(organisationName, 14, 18);
  doc.setFontSize(13);
  doc.text(moduleTitle, 14, 26);
  autoTable(doc, {
    startY: 32,
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 40 },
      1: { cellWidth: 58 },
      2: { fontStyle: "bold", cellWidth: 32 },
      3: { cellWidth: 58 },
    },
    body: [
      [metadata[0][0], metadata[0][1], metadata[1][0], metadata[1][1]],
      [metadata[2][0], metadata[2][1], metadata[3][0], metadata[3][1]],
      [metadata[4][0], metadata[4][1], metadata[5][0], metadata[5][1]],
    ],
  });
  return (doc as jsPDF & { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? 32;
};

const ensurePdfPageSpace = (doc: jsPDF, currentY: number, requiredHeight: number) => {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (currentY + requiredHeight <= pageHeight - 12) {
    return currentY;
  }
  doc.addPage();
  return 18;
};

const renderPdfSectionTable = (
  doc: jsPDF,
  title: string,
  status: string,
  rows: string[][],
  summary: Array<[string, string]>,
  startY: number
) => {
  let nextY = ensurePdfPageSpace(doc, startY, 40);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(title, 14, nextY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Status: ${status || "-"}`, 14, nextY + 6);
  autoTable(doc, {
    startY: nextY + 10,
    theme: "grid",
    head: [["CO Code", "Threshold based Attainment %", "Attainment Level", "Average based Attainment %"]],
    body: rows,
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [230, 236, 244], textColor: 20 },
  });
  nextY = ((doc as jsPDF & { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? nextY + 10) + 6;
  summary.forEach(([label, value], index) => {
    doc.setFont("helvetica", "bold");
    doc.text(`${label}:`, 14 + index * 92, nextY);
    doc.setFont("helvetica", "normal");
    doc.text(value || "-", 14 + index * 92 + 38, nextY);
  });
  return nextY + 8;
};

const renderPdfSimpleTable = (
  doc: jsPDF,
  title: string,
  headers: string[],
  rows: string[][],
  startY: number
) => {
  const nextY = ensurePdfPageSpace(doc, startY, 28);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(title, 14, nextY);
  autoTable(doc, {
    startY: nextY + 4,
    theme: "grid",
    head: [headers],
    body: rows.length ? rows : [["No data available."]],
    styles: { fontSize: 8.5, cellPadding: 2 },
    headStyles: { fillColor: [230, 236, 244], textColor: 20 },
  });
  return (((doc as jsPDF & { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? nextY + 4) + 8);
};

const renderPdfChart = (doc: jsPDF, title: string, points: CompactChartPoint[], startY: number) => {
  if (!points.length) {
    return startY;
  }

  let nextY = ensurePdfPageSpace(doc, startY, 90);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(title, 14, nextY);

  const chartTop = nextY + 8;
  const chartHeight = 48;
  const chartBottom = chartTop + chartHeight;
  const chartLeft = 22;
  const chartRight = 182;
  const barAreaWidth = chartRight - chartLeft;
  const stepWidth = barAreaWidth / Math.max(points.length, 1);

  doc.setDrawColor(180);
  for (const axis of [0, 20, 40, 60, 80, 100]) {
    const y = chartBottom - (axis / 100) * chartHeight;
    doc.line(chartLeft, y, chartRight, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`${axis}%`, 14, y + 1.5);
  }

  points.forEach((point, index) => {
    const barHeight = Math.max(0, Math.min(100, point.attainmentPercent ?? point.thresholdPercent));
    const x = chartLeft + index * stepWidth + stepWidth * 0.25;
    const width = stepWidth * 0.5;
    const y = chartBottom - (barHeight / 100) * chartHeight;
    doc.setFillColor(78, 163, 184);
    doc.rect(x, y, width, (barHeight / 100) * chartHeight, "F");
    doc.setFontSize(7.5);
    doc.text(`${barHeight.toFixed(2)}%`, x, y - 2);
    doc.text(point.label, x, chartBottom + 6);
  });

  return chartBottom + 14;
};

const buildDocShell = (title: string, metadataTable: string, sections: string[]) => `
  <html>
    <head>
      <meta charset="utf-8" />
      <title>${escapeHtml(title)}</title>
      <style>
        body { font-family: Calibri, Arial, sans-serif; color: #1f2937; margin: 24px; font-size: 12px; }
        h1 { font-size: 20px; margin: 0 0 4px; }
        h2 { font-size: 16px; margin: 18px 0 8px; }
        h3 { font-size: 14px; margin: 16px 0 8px; }
        p { margin: 4px 0; }
        table { width: 100%; border-collapse: collapse; margin: 8px 0 14px; }
        th, td { border: 1px solid #cbd5e1; padding: 6px 8px; vertical-align: top; }
        th { background: #eef2f7; text-align: left; }
        .meta td:first-child, .meta td:nth-child(3) { font-weight: 700; width: 16%; }
        .summary { margin: 6px 0 12px; font-weight: 700; }
        .chart-row { margin: 8px 0; }
        .chart-label { display: inline-block; width: 72px; font-weight: 700; }
        .chart-bar-wrap { display: inline-block; width: 280px; height: 14px; background: #e5e7eb; vertical-align: middle; margin-right: 8px; }
        .chart-bar { display: block; height: 14px; background: #4ea3b8; }
        .muted { color: #475569; }
      </style>
    </head>
    <body>
      <h1>${escapeHtml(organisationName)}</h1>
      <p class="muted">${escapeHtml(moduleTitle)}</p>
      ${metadataTable}
      ${sections.join("")}
    </body>
  </html>
`;

const buildTargetDescription = (record: CourseCoAttainmentRawRecord) => {
  const threshold = readString(record, "cia_direct_percentage", "direct_percentage");
  const target = readString(record, "cia_target_percentage", "target_percentage");
  const condition = readString(record, "conditional_opr") || ">=";
  if (!threshold && !target) {
    return readString(record, "target", "target_percent", "description");
  }

  const normalizedTarget = target || "0";
  const normalizedThreshold = threshold || "0";
  return `${normalizedTarget}% students scoring ${condition} ${normalizedThreshold}% marks out of relevant maximum marks.`;
};

const mapAssessmentTypeOptions = (availableAssessmentTypes: string[]): CourseCoAttainmentOption[] => {
  const normalizedTypes = availableAssessmentTypes
    .map(normalizeAssessmentType)
    .filter((type): type is "CIA" | "MTE" | "TEE" => Boolean(type))
    .filter((type, index, types) => types.indexOf(type) === index);

  const options: CourseCoAttainmentOption[] = [{ id: "", label: "Select Type" }];
  if (normalizedTypes.includes("CIA")) {
    options.push({ id: "cia", label: "CCE/CIA" });
  }
  if (normalizedTypes.includes("TEE")) {
    options.push({ id: "tee", label: "SEE/TEE" });
  }
  return options;
};

const mapFinalizeTypeOptions = (availableAssessmentTypes: string[]): FinalizeOccasionOption[] => {
  const allOptions: Record<string, FinalizeOccasionOption> = {
    CIA: { id: "cia", label: "CCE/CIA" },
    MTE: { id: "mte", label: "MTE" },
    TEE: { id: "tee", label: "SEE/TEE" },
  };

  return availableAssessmentTypes
    .map(normalizeAssessmentType)
    .filter((type): type is "CIA" | "MTE" | "TEE" => Boolean(type))
    .filter((type, index, types) => types.indexOf(type) === index)
    .map((type) => allOptions[type])
    .filter((option): option is FinalizeOccasionOption => Boolean(option));
};

const mapTargetLevels = (rows?: unknown[]): TargetLevelRow[] => {
  const dedupedRows = new Map<number, TargetLevelRow>();

  asArray<unknown>(rows).forEach((row) => {
    const record = asRecord(row);
    if (!record) {
      return;
    }

    const attainmentLevelValue = readNumber(
      record,
      "attainmentLevelValue",
      "attainment_level_value",
      "level_value",
      "value"
    );
    const attainmentLevelName = readString(
      record,
      "attainmentLevelName",
      "attainment_level_name",
      "level_name",
      "name"
    );

    if (!attainmentLevelName) {
      return;
    }

    if (!dedupedRows.has(attainmentLevelValue)) {
      dedupedRows.set(attainmentLevelValue, {
        attainmentLevelName,
        attainmentLevelValue,
        target: buildTargetDescription(record),
      });
    }
  });

  return Array.from(dedupedRows.values()).sort(
    (firstRow, secondRow) => firstRow.attainmentLevelValue - secondRow.attainmentLevelValue
  );
};

const mapFinalizeMessages = (overview: CourseCoAttainmentOverviewData | null): FinalizeStatusMessage | undefined => {
  const prerequisiteLines = overview?.prerequisites?.lines ?? [];
  if (!prerequisiteLines.length) {
    return undefined;
  }

  const lines: string[] = [];
  const hasCceNotFinalized = prerequisiteLines.includes("CCE is not Finalized for this course.");
  const hasMteNotFinalized = prerequisiteLines.includes("MTE Attainment is not Finalized for this course.");
  const hasSeeNotUploaded = prerequisiteLines.includes("SEE marks not uploaded for this course.");

  if (hasCceNotFinalized) {
    lines.push("CCE is not Finalized for this course.");
    lines.push(
      'Kindly refer the first tab "CCE - COs Attainment (Section/Division wise)" to know the Course CCE Finalize status.'
    );
    lines.push("Click here to Finalize course.");
  }

  if (hasMteNotFinalized) {
    lines.push("MTE Attainment is not Finalized for this course.");
    lines.push("Click here to Finalize course MTE data.");
  }

  if (hasSeeNotUploaded) {
    lines.push("SEE marks not uploaded for this course.");
    lines.push("Click here to Upload Marks.");
  }

  const fallbackLines = lines.length ? lines : prerequisiteLines;
  return {
    lines: fallbackLines,
    linkText: fallbackLines.find((line) => line.startsWith("Click here")) ?? "",
  };
};

const mapRows = (rows: unknown[]): CoAttainmentRow[] =>
  rows.flatMap((row) => {
    const record = asRecord(row);
    if (!record) {
      return [];
    }
    return [
      {
        coId: toStringId(record.coId ?? record.co_id ?? record.clo_id),
        coCode: readString(record, "coCode", "co_code", "code"),
        thresholdBasedAttainmentPercent:
          formatPercentageDisplay(
            readString(record, "thresholdBasedAttainmentPercent", "threshold_based_attainment_percent", "threshold_attainment")
          ) || "0.00%",
        attainmentLevel: readString(record, "attainmentLevel", "attainment_level", "level"),
        averageBasedAttainmentPercent:
          formatPercentageDisplay(
            readString(record, "averageBasedAttainmentPercent", "average_based_attainment_percent", "average_attainment")
          ) || "0.00%",
      },
    ];
  });

const mapSectionBlock = (
  section: unknown,
  fallbackSection: string,
  fallbackStatusText: string,
  weightagePercent?: number
): CourseCoAttainmentSectionBlock | null => {
  const record = asRecord(section);
  if (!record) {
    return null;
  }

  const rows = mapRows(asArray<unknown>(record.rows));
  const summaryRecord = asRecord(record.summary);
  const statusText = readString(record, "statusText", "status_text") || fallbackStatusText;
  const summaryActualCourseAttainment =
    formatPercentageDisplay(
      readPercentString(summaryRecord ?? record, "actualCourseAttainment", "actual_course_attainment")
    ) || (rows.length ? `${(rows.reduce((sum, row) => sum + toNumericPercent(row.thresholdBasedAttainmentPercent), 0) / rows.length).toFixed(2)}%` : "0.00%");
  const numericActualCourseAttainment = toNumericPercent(summaryActualCourseAttainment);

  return {
    id: toStringId(record.id ?? record.section_id ?? record.sectionLabel ?? fallbackSection),
    sectionLabel: readString(record, "sectionLabel", "section_label", "section", "division") || fallbackSection,
    batchLabel: record.batchLabel ? String(record.batchLabel) : undefined,
    statusText,
    statusTone: statusText.includes("not Finalized") ? "warning" : "success",
    rows,
    summary: {
      actualCourseAttainment: summaryActualCourseAttainment,
      courseAttainmentAfterWeightage:
        formatPercentageDisplay(
          typeof weightagePercent === "number"
            ? (numericActualCourseAttainment * weightagePercent) / 100
            : readPercentString(summaryRecord ?? record, "courseAttainmentAfterWeightage", "course_attainment_after_weightage")
        ) || "0.00%",
    },
  };
};

const mapSections = (
  sections: unknown[],
  fallbackSection: string,
  fallbackStatusText: string,
  weightagePercent?: number
): CourseCoAttainmentSectionBlock[] =>
  sections.flatMap((section) => {
    const mapped = mapSectionBlock(section, fallbackSection, fallbackStatusText, weightagePercent);
    return mapped ? [mapped] : [];
  });

const mapRowsToSections = (
  rows: unknown[],
  fallbackSection: string,
  fallbackStatusText: string,
  weightagePercent?: number
): CourseCoAttainmentSectionBlock[] => {
  if (!rows.length) {
    return [];
  }

  const firstRecord = asRecord(rows[0]);
  const groupedRows = rows.reduce<Record<string, unknown[]>>((accumulator, row) => {
    const record = asRecord(row);
    if (!record) {
      return accumulator;
    }

    const sectionLabel = readString(record, "sectionLabel", "section_label", "section", "division") || fallbackSection;
    if (!accumulator[sectionLabel]) {
      accumulator[sectionLabel] = [];
    }
    accumulator[sectionLabel].push(row);
    return accumulator;
  }, {});

  const getAverageThresholdPercent = (sectionRowsForSummary: unknown[]): number =>
    sectionRowsForSummary.reduce<number>((sum: number, row: unknown) => {
      const record = asRecord(row);
      if (!record) {
        return sum;
      }

      const value = readString(record, "thresholdBasedAttainmentPercent", "threshold_based_attainment_percent");
      const numericValue = Number(String(value).replace("%", "").trim());
      return Number.isFinite(numericValue) ? sum + numericValue : sum;
    }, 0) / Math.max(sectionRowsForSummary.length, 1);
  const statusTone: "warning" | "success" = (
    ((firstRecord && readString(firstRecord, "statusText", "status_text")) || fallbackStatusText).includes("not Finalized")
  )
    ? "warning"
    : "success";

  return Object.entries(groupedRows).flatMap(([sectionLabel, sectionRows]) => [
    {
      id: sectionLabel,
      sectionLabel,
      batchLabel: undefined,
      statusText:
        (firstRecord && readString(firstRecord, "statusText", "status_text")) || fallbackStatusText,
      statusTone,
      rows: mapRows(sectionRows),
      summary: {
        actualCourseAttainment:
          formatPercentageDisplay(
            firstRecord && readPercentString(firstRecord, "actualCourseAttainment", "actual_course_attainment")
          ) ||
          (typeof weightagePercent === "number"
            ? `${getAverageThresholdPercent(sectionRows).toFixed(2)}%`
            : "0.00%"),
        courseAttainmentAfterWeightage:
          formatPercentageDisplay(
            firstRecord &&
              readPercentString(firstRecord, "courseAttainmentAfterWeightage", "course_attainment_after_weightage")
          ) ||
          (typeof weightagePercent === "number"
            ? `${(getAverageThresholdPercent(sectionRows) * (weightagePercent / 100)).toFixed(2)}%`
            : "0.00%"),
      },
    },
  ]);
};

const mapOverviewTable = (value: unknown): CourseCoAttainmentOverviewData["cce"] => {
  const record = asRecord(value);
  if (!record) {
    return undefined;
  }

  return {
    title: readString(record, "title"),
    sections: asArray<CourseCoAttainmentSectionBlock>(record.sections),
    rows: asArray<CoAttainmentRow>(record.rows),
    finalizeLinkText: readString(record, "finalizeLinkText", "finalize_link_text"),
  };
};

const buildAttainmentStatusText = (type: "cce" | "mte", isFinalized: boolean) =>
  `${type === "cce" ? "CCE" : "MTE"} Attainment is ${isFinalized ? "Finalized" : "not Finalized"}`;

const buildDerivedSectionBlock = (
  sectionLabel: string,
  type: "cce" | "mte",
  isFinalized: boolean
): CourseCoAttainmentSectionBlock => ({
  id: sectionLabel,
  sectionLabel,
  statusText: buildAttainmentStatusText(type, isFinalized),
  statusTone: isFinalized ? "success" : "warning",
  rows: [],
  summary: {
    actualCourseAttainment: "0.00%",
    courseAttainmentAfterWeightage: "0.00%",
  },
});

const normalizeOverviewData = (overview: unknown): CourseCoAttainmentOverviewData => {
  const record = asRecord(overview);
  const flagsRecord = asRecord(record?.flags);
  const prerequisitesRecord = asRecord(record?.prerequisites);
  const targetLevelsSource = record?.targetLevels ?? record?.target_levels;
  const targetLevelsRecord = Array.isArray(targetLevelsSource) ? null : asRecord(targetLevelsSource);
  const targetLevelsRows = Array.isArray(targetLevelsSource)
    ? asArray<TargetLevelRow>(targetLevelsSource)
    : asArray<TargetLevelRow>(targetLevelsRecord?.rows);
  const hasTargetLevels = targetLevelsRows.length > 0 || Boolean(targetLevelsRecord);
  const finalizedSource =
    record?.finalizedOverallCourseAttainment ?? record?.finalized_overall_course_attainment;
  const finalizedRecord = Array.isArray(finalizedSource) ? null : asRecord(finalizedSource);
  const finalizedRows = Array.isArray(finalizedSource)
    ? asArray<FinalizeCourseOverviewRow>(finalizedSource)
    : asArray<FinalizeCourseOverviewRow>(finalizedRecord?.finalizedRows ?? finalizedRecord?.finalized_rows);
  const coPoMatrixColumns = toArrayValue(finalizedRecord?.coPoMatrixColumns ?? finalizedRecord?.co_po_matrix_columns);
  const coPoMatrixRows = asArray<CoPoMatrixRow>(finalizedRecord?.coPoMatrixRows ?? finalizedRecord?.co_po_matrix_rows);
  const programOutcomeRows = asArray<ProgramOutcomeAttainmentRow>(
    finalizedRecord?.programOutcomeRows ?? finalizedRecord?.program_outcome_rows
  );
  const mapLevelWeightageRows = asArray<MapLevelWeightageRow>(
    finalizedRecord?.mapLevelWeightageRows ?? finalizedRecord?.map_level_weightage_rows
  );
  const calculationNotes = asArray<FormulaCard>(finalizedRecord?.calculationNotes ?? finalizedRecord?.calculation_notes);
  const hasFinalizedData =
    finalizedRows.length > 0 ||
    coPoMatrixColumns.length > 0 ||
    coPoMatrixRows.length > 0 ||
    programOutcomeRows.length > 0 ||
    mapLevelWeightageRows.length > 0 ||
    calculationNotes.length > 0 ||
    Boolean(finalizedRecord);

  return {
    availableAssessmentTypes: parseAvailableAssessmentTypes(
      record?.availableAssessmentTypes ?? record?.available_assessment_types
    )
      .map(normalizeAssessmentType)
      .filter((type): type is "CIA" | "MTE" | "TEE" => Boolean(type))
      .filter((type, index, types) => types.indexOf(type) === index),
    flags: {
      ciaFinalized: readBoolean(flagsRecord ?? {}, "ciaFinalized", "cia_finalized"),
      mteFinalized: readBoolean(flagsRecord ?? {}, "mteFinalized", "mte_finalized"),
      teeAvailable: readBoolean(flagsRecord ?? {}, "teeAvailable", "tee_available"),
      canFinalizeCourse: readBoolean(flagsRecord ?? {}, "canFinalizeCourse", "can_finalize_course"),
    },
    prerequisites: {
      lines: toArrayValue(prerequisitesRecord?.lines ?? prerequisitesRecord?.messages),
    },
    course: asRecord(record?.course) ?? undefined,
    cce: mapOverviewTable(record?.cce ?? record?.cia),
    mte: mapOverviewTable(record?.mte),
    targetLevels: hasTargetLevels
      ? {
          title: readString(targetLevelsRecord ?? {}, "title"),
          rows: targetLevelsRows,
          publishButtonLabel: readString(targetLevelsRecord ?? {}, "publishButtonLabel", "publish_button_label"),
        }
      : undefined,
    finalizedOverallCourseAttainment: hasFinalizedData
      ? {
          finalizedTableTitle: readString(finalizedRecord ?? {}, "finalizedTableTitle", "finalized_table_title"),
          finalizedRows,
          coPoMatrixTitle: readString(finalizedRecord ?? {}, "coPoMatrixTitle", "co_po_matrix_title"),
          coPoMatrixColumns,
          coPoMatrixRows,
          programOutcomesTitle: readString(finalizedRecord ?? {}, "programOutcomesTitle", "program_outcomes_title"),
          programOutcomeRows,
          mapLevelWeightageTitle: readString(finalizedRecord ?? {}, "mapLevelWeightageTitle", "map_level_weightage_title"),
          mapLevelWeightageRows,
          calculationNotes,
        }
      : undefined,
  };
};

const buildOverviewTabData = (
  fallback: CourseCoAttainmentTabDataResponse,
  overview: CourseCoAttainmentOverviewData | null,
  courseId: string
): CourseCoAttainmentTabDataResponse => {
  if (!overview) {
    return fallback;
  }

  const cceSourceSections = asArray<unknown>(overview.cce?.sections);
  const mteSourceSections = asArray<unknown>(overview.mte?.sections);
  const cceRows = asArray<unknown>(overview.cce?.rows);
  const mteRows = asArray<unknown>(overview.mte?.rows);
  const finalizedOverview = overview.finalizedOverallCourseAttainment;
  const finalizedRows = asArray<unknown>(finalizedOverview?.finalizedRows);
  const finalizedCoPoMatrixColumns = toArrayValue(finalizedOverview?.coPoMatrixColumns);
  const finalizedCoPoMatrixRows = asArray<unknown>(finalizedOverview?.coPoMatrixRows);
  const finalizedProgramOutcomeRows = asArray<unknown>(finalizedOverview?.programOutcomeRows);
  const finalizedMapLevelWeightageRows = asArray<unknown>(finalizedOverview?.mapLevelWeightageRows);
  const finalizedCalculationNotes = asArray<unknown>(finalizedOverview?.calculationNotes);
  const hasCceBackendTable = Boolean(overview.cce);
  const hasMteBackendTable = Boolean(overview.mte);
  const assessmentTypeOptions = mapAssessmentTypeOptions(overview.availableAssessmentTypes);
  const finalizeTypeOptions = mapFinalizeTypeOptions(overview.availableAssessmentTypes);
  const overviewCourseRecord = asRecord(overview.course);
  const ciaWeightagePercent = readNumber(
    overviewCourseRecord ?? {},
    "total_cia_weightage",
    "totalCiaWeightage",
    "cia_weightage",
    "ciaWeightage"
  );
  const mteWeightagePercent = readNumber(
    overviewCourseRecord ?? {},
    "total_mte_weightage",
    "totalMteWeightage",
    "mte_weightage",
    "mteWeightage"
  );
  const cceStatusText = buildAttainmentStatusText("cce", overview.flags.ciaFinalized);
  const mteStatusText = buildAttainmentStatusText("mte", overview.flags.mteFinalized);
  const cceFinalizeLinkText = overview.flags.ciaFinalized ? "" : "Click here to Finalize course CCE data";
  const mteFinalizeLinkText = overview.flags.mteFinalized ? "" : "Click here to Finalize course MTE data";
  const defaultFinalizeNotes = fallback.finalize.calculationNotes.length
    ? fallback.finalize.calculationNotes
    : emptyTabData().finalize.calculationNotes;

  return {
    ...fallback,
    cce: {
      ...fallback.cce,
      title: String(overview.cce?.title ?? fallback.cce.title),
      sections: cceSourceSections.length
        ? mapSections(cceSourceSections, "A", cceStatusText, ciaWeightagePercent)
        : cceRows.length
          ? mapRowsToSections(cceRows, "A", cceStatusText, ciaWeightagePercent)
        : hasCceBackendTable
          ? [buildDerivedSectionBlock("A", "cce", overview.flags.ciaFinalized)]
          : fallback.cce.sections,
      finalizeLinkText: cceFinalizeLinkText,
    },
    mte: {
      ...fallback.mte,
      title: String(overview.mte?.title ?? fallback.mte.title),
      sections: mteSourceSections.length
        ? mapSections(mteSourceSections, "A", mteStatusText)
        : mteRows.length
          ? mapRowsToSections(mteRows, "A", mteStatusText, mteWeightagePercent)
          : hasMteBackendTable
          ? [buildDerivedSectionBlock("A", "mte", overview.flags.mteFinalized)]
          : fallback.mte.sections,
      finalizeLinkText: mteFinalizeLinkText,
    },
    targetLevels: overview.targetLevels?.rows?.length
      ? {
          ...fallback.targetLevels,
          title: String(overview.targetLevels.title || fallback.targetLevels.title),
          rows: mapTargetLevels(overview.targetLevels.rows),
          publishButtonLabel: String(overview.targetLevels.publishButtonLabel || fallback.targetLevels.publishButtonLabel),
        }
      : fallback.targetLevels,
    finalize: {
      ...fallback.finalize,
      typeOptions: [{ id: "all-selected", label: "Select All" }, ...finalizeTypeOptions],
      defaultTypeId: "",
      statusMessage: mapFinalizeMessages(overview),
      finalizedTableTitle: String(finalizedOverview?.finalizedTableTitle || fallback.finalize.finalizedTableTitle),
      finalizedRows: finalizedRows.length
        ? finalizedRows.flatMap((row) => {
            const record = asRecord(row);
            if (!record) {
              return [];
            }
            return [
              {
                coCode: readString(record, "coCode", "co_code"),
                coStatement: readString(record, "coStatement", "co_statement"),
                thresholdBasedAttainmentPercent:
                  readPercentString(record, "thresholdBasedAttainmentPercent", "threshold_based_attainment_percent") ||
                  "0.00 %",
                attainmentLevel:
                  readString(record, "attainmentLevel", "attainment_level", "average_attainment_level", "threshold_attainment_level") || "0",
                averageBasedThresholdPercent:
                  readPercentString(
                    record,
                    "averageBasedThresholdPercent",
                    "average_based_threshold_percent",
                    "average_based_attainment_percent"
                  ) ||
                  "0.00 %",
              },
            ];
          })
        : [],
      coPoMatrixTitle: String(finalizedOverview?.coPoMatrixTitle || fallback.finalize.coPoMatrixTitle),
      coPoMatrixColumns: finalizedCoPoMatrixColumns.length
        ? finalizedCoPoMatrixColumns
        : fallback.finalize.coPoMatrixColumns,
      coPoMatrixRows: finalizedCoPoMatrixRows.length
        ? finalizedCoPoMatrixRows.flatMap((row) => {
            const record = asRecord(row);
            if (!record) {
              return [];
            }

            return [
              {
                coCode: readString(record, "coCode", "co_code"),
                values: toArrayValue(record.values),
              },
            ];
          })
        : [],
      programOutcomesTitle: String(finalizedOverview?.programOutcomesTitle || fallback.finalize.programOutcomesTitle),
      programOutcomeRows: finalizedProgramOutcomeRows.length
        ? finalizedProgramOutcomeRows.flatMap((row) => {
            const record = asRecord(row);
            if (!record) {
              return [];
            }

            return [
              {
                serialNo: readNumber(record, "serialNo", "serial_no"),
                programOutcome: readString(record, "programOutcome", "program_outcome"),
                thresholdMethodPercent: readPercentString(record, "thresholdMethodPercent", "threshold_method_percent") || "0.00%",
                thresholdMethodLevel: readString(record, "thresholdMethodLevel", "threshold_method_level") || "0",
                weightedAveragePercent: readPercentString(record, "weightedAveragePercent", "weighted_average_percent") || "0.00%",
                weightedAverageLevel: readString(record, "weightedAverageLevel", "weighted_average_level") || "0",
                relativeWeightedAveragePercent:
                  readPercentString(record, "relativeWeightedAveragePercent", "relative_weighted_average_percent") || "0.00%",
                relativeWeightedAverageLevel:
                  readString(record, "relativeWeightedAverageLevel", "relative_weighted_average_level") || "0",
              },
            ];
          })
        : [],
      mapLevelWeightageTitle: String(
        finalizedOverview?.mapLevelWeightageTitle || fallback.finalize.mapLevelWeightageTitle
      ),
      mapLevelWeightageRows: finalizedMapLevelWeightageRows.length
        ? finalizedMapLevelWeightageRows.flatMap((row) => {
            const record = asRecord(row);
            if (!record) {
              return [];
            }

            return [
              {
                serialNo: readNumber(record, "serialNo", "serial_no"),
                mapLevel: readString(record, "mapLevel", "map_level"),
                value: readString(record, "value") || "0",
                mapLevelWeightage: readPercentString(record, "mapLevelWeightage", "map_level_weightage") || "0.00%",
              },
            ];
          })
        : [],
      calculationNotes: finalizedCalculationNotes.length
        ? finalizedCalculationNotes.flatMap((note) => {
            const record = asRecord(note);
            if (!record) {
              return [];
            }

            return [
              {
                title: readString(record, "title"),
                lines: toArrayValue(record.lines),
              },
            ];
          })
        : defaultFinalizeNotes,
    },
    blooms: {
      ...fallback.blooms,
      typeOptions: assessmentTypeOptions.length ? assessmentTypeOptions : fallback.blooms.typeOptions,
      defaultTypeId: "",
      sectionOptions: [BLOOM_SELECT_SECTION_OPTION],
      occasionOptions: [BLOOM_SELECT_OCCASION_OPTION, BLOOM_ALL_OCCASION_OPTION],
      studentOptions: [BLOOM_SELECT_STUDENT_OPTION],
      chartPoints: [],
      rows: [],
      messages: [],
    },
    directIndirect: {
      ...fallback.directIndirect,
      directWeight: readString(overview?.course ?? {}, "direct_percentage") || fallback.directIndirect.directWeight,
      indirectWeight: readString(overview?.course ?? {}, "indirect_percentage") || fallback.directIndirect.indirectWeight,
    },
    noteSection: fallback.noteSection,
  };
};

const mapBloomRows = (rows: unknown[]): BloomLevelRow[] =>
  rows.flatMap((row, index) => {
    const record = asRecord(row);
    if (!record) {
      return [];
    }

    const bloomLevel =
      readString(record, "bloomLevel", "bloom_level", "blooms_level", "level", "label") || `L${index + 1}`;

    return [
      {
        serialNo: readNumber(record, "serialNo", "serial_no", "sl_no") || index + 1,
        bloomLevel,
        threshold: formatPercentValue(record.threshold ?? record.thresholdPercent ?? record.threshold_percent),
        attainment: formatPercentValue(record.attainment ?? record.attainmentPercent ?? record.attainment_percent),
      },
    ];
  });

const seriesValuesByName = (
  series: Array<{ name?: string; values?: Array<number | string> }> | undefined,
  match: string
): Array<number | string> => {
  const lowerMatch = match.toLowerCase();
  return series?.find((item) => item.name?.toLowerCase().includes(lowerMatch))?.values ?? [];
};

const mapBloomPreview = (
  fallback: CourseCoAttainmentTabDataResponse,
  preview: CourseCoAttainmentBloomsPreviewData
): CourseCoAttainmentTabDataResponse => {
  const previewRecord = asRecord(preview);
  const rows = mapBloomRows(asArray<unknown>(preview.rows ?? previewRecord?.rows));
  const chartRecord = asRecord(preview.chart ?? previewRecord?.chart);
  const prerequisitesRecord = asRecord(preview.prerequisites ?? previewRecord?.prerequisites);
  const messageLines = toArrayValue(prerequisitesRecord?.lines ?? prerequisitesRecord?.messages);
  const labels = toArrayValue(chartRecord?.labels);
  const chartSeries = asArray<{ name?: string; values?: Array<number | string> }>(chartRecord?.series);
  const thresholdValues = seriesValuesByName(chartSeries, "threshold");
  const attainmentValues = seriesValuesByName(chartSeries, "attainment");
  const chartPoints: CompactChartPoint[] = labels.map((label, index) => ({
    label,
    thresholdPercent: toNumericPercent(thresholdValues[index] ?? rows[index]?.threshold),
    attainmentPercent: toNumericPercent(attainmentValues[index] ?? rows[index]?.attainment),
  }));

  return {
    ...fallback,
    blooms: {
      ...fallback.blooms,
      chartPoints,
      rows,
      messages: messageLines,
    },
  };
};

const mapCombinedPreview = (
  fallback: CourseCoAttainmentTabDataResponse,
  preview: CourseCoAttainmentCombinedPreviewData
): CourseCoAttainmentTabDataResponse => {
  const previewRecord = asRecord(preview);
  const prerequisitesRecord = asRecord(preview.prerequisites ?? previewRecord?.prerequisites);
  const messageLines = toArrayValue(prerequisitesRecord?.lines ?? prerequisitesRecord?.messages);
  const nextStatusMessage = messageLines.length
    ? {
        lines: messageLines,
        linkText: messageLines.find((line) => line.startsWith("Click here")) ?? "",
      }
    : undefined;
  const graphRecord = asRecord(preview.graph ?? previewRecord?.graph);
  const labels = toArrayValue(graphRecord?.labels);
  const chartSeries = asArray<{ name?: string; values?: Array<number | string> }>(graphRecord?.series);
  const thresholdValues = seriesValuesByName(chartSeries, "threshold");
  const averageValues = seriesValuesByName(chartSeries, "average");
  const previewRowsSource = asArray<unknown>(preview.coRows ?? previewRecord?.coRows ?? previewRecord?.co_rows);
  const previewRows = previewRowsSource.flatMap((row) => {
    const record = asRecord(row);
    if (!record) {
      return [];
    }

    return [
      {
        ...mapRows([row])[0],
        coStatement: readString(record, "coStatement", "co_statement"),
        drillDownAvailable: readBoolean(record, "drillDownAvailable", "drill_down_available"),
      },
    ];
  });
  const selectedAssessmentTypes = toArrayValue(
    preview.selectedAssessmentTypes ?? previewRecord?.selectedAssessmentTypes ?? previewRecord?.selected_assessment_types
  );
  const chartLabels = labels.length ? labels : previewRows.map((row) => row.coCode);
  const targetLevelsRecord = asRecord(preview.targetLevels ?? previewRecord?.targetLevels ?? previewRecord?.target_levels);
  const previewTargetColumns = asArray<unknown>(targetLevelsRecord?.columns).flatMap((column) => {
    const record = asRecord(column);
    if (!record) {
      return [];
    }

    return [
      {
        assessmentType: readString(record, "assessmentType", "assessment_type"),
        label: readString(record, "label"),
      },
    ];
  });
  const previewTargetRows = asArray<unknown>(targetLevelsRecord?.rows).flatMap((row) => {
    const record = asRecord(row);
    if (!record) {
      return [];
    }

    return [
      {
        serialNo: readNumber(record, "serialNo", "serial_no"),
        attainmentLevelName: readString(record, "attainmentLevelName", "attainment_level_name"),
        attainmentLevelValue: readNumber(record, "attainmentLevelValue", "attainment_level_value"),
        targets: asArray<unknown>(record.targets).flatMap((target) => {
          const targetRecord = asRecord(target);
          if (!targetRecord) {
            return [];
          }

          return [
            {
              assessmentType: readString(targetRecord, "assessmentType", "assessment_type"),
              label: readString(targetRecord, "label"),
              value: readString(targetRecord, "value"),
            },
          ];
        }),
      },
    ];
  });
  const fallbackTargetColumns = selectedAssessmentTypes.map((assessmentType) => ({
    assessmentType,
    label:
      assessmentType === "CIA" ? "CCE Target %" : assessmentType === "MTE" ? "MTE Target %" : "SEE Target %",
  }));
  const fallbackTargetRows = fallback.targetLevels.rows.map((row, index) => ({
    serialNo: index + 1,
    attainmentLevelName: row.attainmentLevelName,
    attainmentLevelValue: row.attainmentLevelValue,
    targets: fallbackTargetColumns.map((column) => ({
      assessmentType: column.assessmentType,
      label: column.label,
      value: row.target,
    })),
  }));
  const pendingPreview = previewRows.length
    ? {
        title: "Preview Graph",
        legendLabel: "Threshold Direct Attainment %",
        chartPoints: chartLabels.map((label, index) => ({
          label,
          thresholdPercent: toNumericPercent(thresholdValues[index] ?? previewRows[index]?.thresholdBasedAttainmentPercent),
          attainmentPercent: toNumericPercent(averageValues[index] ?? previewRows[index]?.averageBasedAttainmentPercent),
        })),
        targetLevels: {
          title: readString(targetLevelsRecord ?? {}, "title") || "Direct Attainment / Target Levels",
          columns: previewTargetColumns.length ? previewTargetColumns : fallbackTargetColumns,
          rows: previewTargetRows.length ? previewTargetRows : fallbackTargetRows,
        },
        overallCourseOutcomesTitle: "Overall Course Outcomes (COs) Attainment",
        overallCourseOutcomesRows: previewRows,
      }
    : undefined;

  return {
    ...fallback,
    finalize: {
      ...fallback.finalize,
      statusMessage: nextStatusMessage,
      pendingPreview,
    },
  };
};

const mapDirectIndirectPreview = (
  fallback: CourseCoAttainmentTabDataResponse,
  preview: CourseCoAttainmentDirectIndirectPreviewData
): CourseCoAttainmentTabDataResponse => {
  const previewRecord = asRecord(preview);
  const prerequisitesRecord = asRecord(preview.prerequisites ?? previewRecord?.prerequisites);
  const messageLines = toArrayValue(prerequisitesRecord?.lines ?? prerequisitesRecord?.messages);
  const flagsRecord = asRecord(preview.flags ?? previewRecord?.flags);
  const selectedSurveyRecord = asRecord(preview.selectedSurvey ?? preview.selected_survey ?? previewRecord?.selectedSurvey ?? previewRecord?.selected_survey);
  const topLevelDirectWeight = readRawValue(previewRecord ?? {}, "direct_weight", "directWeight");
  const topLevelIndirectWeight = readRawValue(previewRecord ?? {}, "indirect_weight", "indirectWeight");
  const rowSource = asArray<unknown>(preview.rows ?? previewRecord?.rows);
  const rows: DirectIndirectAttainmentRow[] = rowSource.flatMap((row, index) => {
    const record = asRecord(row);
    if (!record) {
      return [];
    }

    return [
      {
        serialNo: readNumber(record, "serialNo", "serial_no", "sl_no") || index + 1,
        coCode: readString(record, "coCode", "clo_code", "cloCode", "co_code") || `CO${index + 1}`,
        coStatement: readString(record, "coStatement", "clo_statement", "cloStatement", "co_statement"),
        actualDirectAttainmentPercent: readMappedPercentValue(
          record,
          "directAttaintment",
          "direct_attainment",
          "totalDirectAttaintment",
          "totalDirectAttainment",
          "actualDirectAttainmentPercent",
          "actual_direct_attainment_percent"
        ),
        actualDirectAttainmentLevel: readString(
          record,
          "directAttaintment_level",
          "direct_attaintment_level",
          "directAttainmentLevel",
          "direct_attainment_level",
          "co_direct_attainment_level",
          "actualDirectAttainmentLevel",
          "actual_direct_attainment_level"
        ),
        actualIndirectAttainmentPercent: readMappedPercentValue(
          record,
          "indirectAttaintment",
          "indirect_attainment",
          "AttaintmentPercentage",
          "attaintment_percentage",
          "attainmentPercentage",
          "attainment_percentage",
          "actualIndirectAttainmentPercent",
          "actual_indirect_attainment_percent"
        ),
        actualIndirectAttainmentLevel: readString(
          record,
          "indirectAttaintment_level",
          "indirect_attaintment_level",
          "indirectAttainmentLevel",
          "indirect_attainment_level",
          "co_indirect_attainment_level",
          "actualIndirectAttainmentLevel",
          "actual_indirect_attainment_level"
        ),
        directPercentage: readMappedPercentValue(
          {
            ...record,
            directWeight: record.directWeight ?? topLevelDirectWeight,
            direct_weight: record.direct_weight ?? topLevelDirectWeight,
          },
          "directWeight",
          "direct_weight",
          "directPercentage",
          "direct_percentage"
        ),
        indirectPercentage: readMappedPercentValue(
          {
            ...record,
            indirectWeight: record.indirectWeight ?? topLevelIndirectWeight,
            indirect_weight: record.indirect_weight ?? topLevelIndirectWeight,
          },
          "indirectWeight",
          "indirect_weight",
          "indirectPercentage",
          "indirect_percentage"
        ),
        afterWeightageDirectAttainmentPercent: readMappedPercentValue(
          record,
          "directPercentage",
          "direct_percentage",
          "afterWeightageDirectAttainmentPercent",
          "after_weightage_direct_attainment_percent",
          "directAttaintment",
          "direct_attaintment"
        ),
        afterWeightageDirectAttainmentLevel: readString(
          record,
          "directAttainmentWeightedLevel",
          "direct_attainment_weighted_level",
          "afterWeightageDirectAttainmentLevel",
          "after_weightage_direct_attainment_level",
          "directAttaintment_level",
          "direct_attaintment_level",
          "directAttainmentLevel",
          "direct_attainment_level"
        ),
        afterWeightageIndirectAttainmentPercent: readMappedPercentValue(
          record,
          "indirectPercentage",
          "indirect_percentage",
          "afterWeightageIndirectAttainmentPercent",
          "after_weightage_indirect_attainment_percent",
          "indirectAttaintment",
          "indirect_attaintment"
        ),
        afterWeightageIndirectAttainmentLevel: readString(
          record,
          "indirectAttainmentWeightedLevel",
          "indirect_attainment_weighted_level",
          "afterWeightageIndirectAttainmentLevel",
          "after_weightage_indirect_attainment_level",
          "indirectAttaintment_level",
          "indirect_attaintment_level",
          "indirectAttainmentLevel",
          "indirect_attainment_level"
        ),
        overallAttainment: readMappedPercentValue(
          record,
          "Attaintment",
          "attaintment",
          "overallAttainment",
          "overall_attainment",
          "attainment",
          "attainment_percent"
        ),
        attainmentLevel: readString(
          record,
          "Attaintment_level",
          "attaintment_level",
          "attainmentLevel",
          "overallAttainmentLevel",
          "overall_attainment_level",
          "attainment_level"
        ),
      },
    ];
  });
  const chartRecord = asRecord(preview.chart ?? previewRecord?.chart);
  const labels = toArrayValue(chartRecord?.labels);
  const series = asArray<{ name?: string; values?: Array<number | string> }>(chartRecord?.series);
  const overallValues = seriesValuesByName(series, "overall");
  const rowByCoCode = new Map(rows.map((row) => [row.coCode, row]));
  const chartPoints: DirectIndirectChartPoint[] = (labels.length ? labels : rows.map((row) => row.coCode)).map((label, index) => {
    const matchedRow = rowByCoCode.get(label) ?? rows[index];
    return {
      label,
      value: toNumericPercent(overallValues[index] ?? matchedRow?.overallAttainment),
      coCode: matchedRow?.coCode ?? label,
      coStatement: matchedRow?.coStatement,
    };
  });
  const previewReady =
    readBoolean(flagsRecord ?? {}, "previewReady", "preview_ready") || rows.length > 0;
  const canFinalize = readBoolean(flagsRecord ?? {}, "canFinalize", "can_finalize");
  const validationMessage =
    !rows.length && messageLines.length ? messageLines.join(" ") : "";

  return {
    ...fallback,
    directIndirect: {
      ...fallback.directIndirect,
      directWeight:
        readString(previewRecord ?? {}, "directWeight", "direct_weight") || fallback.directIndirect.directWeight,
      indirectWeight:
        readString(previewRecord ?? {}, "indirectWeight", "indirect_weight") || fallback.directIndirect.indirectWeight,
      note: fallback.directIndirect.note,
      validationMessage,
      previewMessages: [],
      selectedSurveyLabel:
        readString(selectedSurveyRecord ?? {}, "label", "name", "survey_name") ||
        fallback.directIndirect.selectedSurveyLabel,
      rows,
      chartPoints,
      previewReady,
      canFinalize,
      finalizeMessage: rows.length ? "Preview generated successfully." : fallback.directIndirect.finalizeMessage,
    },
  };
};

const resetDirectIndirectPreview = (
  fallback: CourseCoAttainmentTabDataResponse,
  updates: Partial<CourseCoAttainmentTabDataResponse["directIndirect"]> = {}
): CourseCoAttainmentTabDataResponse => ({
  ...fallback,
  directIndirect: {
    ...fallback.directIndirect,
    validationMessage: "",
    previewMessages: [],
    selectedSurveyLabel: "",
    rows: [],
    chartPoints: [],
    previewReady: false,
    canFinalize: false,
    finalizeMessage: "",
    ...updates,
  },
});

const resetBloomPreview = (
  fallback: CourseCoAttainmentTabDataResponse,
  updates: Partial<CourseCoAttainmentTabDataResponse["blooms"]> = {}
): CourseCoAttainmentTabDataResponse => ({
  ...fallback,
  blooms: {
    ...fallback.blooms,
    chartPoints: [],
    rows: [],
    messages: [],
    ...updates,
  },
});

export const useCourseCoAttainment = (): CourseCoAttainmentHookResult => {
  const [activeTab, setActiveTab] = useState<CourseCoAttainmentTabId>("cce");
  const [filters, setFilters] = useState<CourseCoAttainmentFiltersState>(emptyFilters);
  const [tabData, setTabData] = useState<CourseCoAttainmentTabDataResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedFinalizeTypeIds, setSelectedFinalizeTypeIds] = useState<string[]>([]);
  const [selectedBloomType, setSelectedBloomType] = useState("");
  const [selectedBloomSection, setSelectedBloomSection] = useState("");
  const [selectedBloomOccasion, setSelectedBloomOccasion] = useState("");
  const [selectedBloomStudent, setSelectedBloomStudent] = useState("");
  const [selectedSurveyId, setSelectedSurveyId] = useState("");
  const [filterCatalog, setFilterCatalog] = useState<CourseCoAttainmentFilterCatalogResponse>(emptyFilterCatalog);
  const [moduleFlags, setModuleFlags] = useState<CourseCoAttainmentModuleFlags>({
    mteFlag: false,
    emsIntegration: false,
  });
  const [overviewData, setOverviewData] = useState<CourseCoAttainmentOverviewData | null>(null);
  const initialisedRef = useRef(false);
  const loadedCoursesRequestKeyRef = useRef("");
  const loadedSectionsKeyRef = useRef("");
  const readySectionsKeyRef = useRef("");
  const loadedOccasionsKeyRef = useRef("");
  const readyOccasionsKeyRef = useRef("");
  const loadedSurveysKeyRef = useRef("");
  const loadedCombinedPreviewKeyRef = useRef("");
  const loadedBloomPreviewKeyRef = useRef("");
  const loadedStudentsKeyRef = useRef("");

  const resetTabSelections = () => {
    setSelectedFinalizeTypeIds([]);
    setSelectedBloomType("");
    setSelectedBloomSection("");
    setSelectedBloomOccasion("");
    setSelectedBloomStudent("");
    setSelectedSurveyId("");
  };

  const handleDirectIndirectSurveyChange = (value: string) => {
    setSelectedSurveyId(value);
    setTabData((prev) => (prev ? resetDirectIndirectPreview(prev) : prev));
  };

  const handleDirectIndirectWeightChange = (field: "directWeight" | "indirectWeight", value: string) => {
    const sanitizedValue = value.replace(/[^\d.]/g, "");
    setTabData((prev) =>
      prev
        ? resetDirectIndirectPreview(prev, {
            [field]: sanitizedValue,
          })
        : prev
    );
  };

  const applyTabDefaults = (data: CourseCoAttainmentTabDataResponse) => {
    setSelectedFinalizeTypeIds(data.finalize.defaultTypeId ? [data.finalize.defaultTypeId] : []);
    setSelectedBloomType(data.blooms.defaultTypeId);
    setSelectedBloomSection(data.blooms.defaultSectionId);
    setSelectedBloomOccasion(data.blooms.defaultOccasionId);
    setSelectedBloomStudent(data.blooms.defaultStudentId);
    setSelectedSurveyId(data.directIndirect.defaultSurveyId);
  };

  const resetPreviewLoadKeys = () => {
    loadedSectionsKeyRef.current = "";
    readySectionsKeyRef.current = "";
    loadedOccasionsKeyRef.current = "";
    readyOccasionsKeyRef.current = "";
    loadedSurveysKeyRef.current = "";
    loadedCombinedPreviewKeyRef.current = "";
    loadedBloomPreviewKeyRef.current = "";
    loadedStudentsKeyRef.current = "";
  };

  const loadTabFallback = (courseId: string) => {
    const fallback = emptyTabData();
    setTabData(fallback);
    applyTabDefaults(fallback);
  };

  const loadOverview = async (curriculumId: string, termId: string, courseId: string) => {
    if (!curriculumId || !termId || !courseId) {
      setOverviewData(null);
      loadTabFallback(courseId);
      return;
    }

    setIsLoading(true);
    try {
      const overview = await courseCoAttainmentApi.getOverview(curriculumId, termId, courseId);
      const normalised = normalizeOverviewData(overview);
      setOverviewData(normalised);
      resetPreviewLoadKeys();
      const fallback = emptyTabData();
      const merged = buildOverviewTabData(fallback, normalised, courseId);
      setTabData(merged);
      applyTabDefaults(merged);
    } catch {
      setOverviewData(null);
      loadTabFallback(courseId);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSectionsForBloom = async () => {
    if (!filters.curriculumId || !filters.termId || !filters.courseId || !isBloomCiaType(selectedBloomType)) {
      return;
    }

    const key = `${filters.curriculumId}:${filters.termId}:${filters.courseId}`;
    if (loadedSectionsKeyRef.current === key) {
      return;
    }

    loadedSectionsKeyRef.current = key;
    try {
      const sections = await courseCoAttainmentApi.getSections(filters.curriculumId, filters.termId, filters.courseId);
      const sectionOptions = mapSectionOptions(sections);
      setTabData((prev) => {
        if (!prev) {
          return prev;
        }
        return resetBloomPreview(prev, {
          sectionOptions,
        });
      });
      readySectionsKeyRef.current = key;
    } catch {
      loadedSectionsKeyRef.current = "";
      readySectionsKeyRef.current = "";
    }
  };

  const loadOccasionsForBloom = async () => {
    if (
      !filters.curriculumId ||
      !filters.termId ||
      !filters.courseId ||
      !selectedBloomSection ||
      !selectedBloomType ||
      !isBloomCiaType(selectedBloomType)
    ) {
      return;
    }

    const assessmentType = assessmentTypeForApi(selectedBloomType);
    const sectionKey = `${filters.curriculumId}:${filters.termId}:${filters.courseId}`;
    if (readySectionsKeyRef.current !== sectionKey) {
      return;
    }

    const key = `${filters.curriculumId}:${filters.termId}:${filters.courseId}:${selectedBloomSection}:${assessmentType}`;
    if (loadedOccasionsKeyRef.current === key) {
      return;
    }

    loadedOccasionsKeyRef.current = key;
    try {
      const occasions = await courseCoAttainmentApi.getOccasions(
        filters.curriculumId,
        filters.termId,
        filters.courseId,
        selectedBloomSection,
        assessmentType
      );
      const occasionOptions = mapOccasionOptions(occasions);
      setTabData((prev) => {
        if (!prev) {
          return prev;
        }
        return resetBloomPreview(prev, {
          occasionOptions,
        });
      });
      readyOccasionsKeyRef.current = key;
    } catch {
      loadedOccasionsKeyRef.current = "";
      readyOccasionsKeyRef.current = "";
    }
  };

  const loadStudentsForBloom = async () => {
    if (
      !filters.curriculumId ||
      !filters.termId ||
      !filters.courseId ||
      !selectedBloomType
    ) {
      return;
    }

    if (isBloomCiaType(selectedBloomType) && (!selectedBloomOccasion || !selectedBloomSection)) {
      return;
    }

    const key = [
      filters.curriculumId,
      filters.termId,
      filters.courseId,
      selectedBloomSection,
      selectedBloomType,
      selectedBloomOccasion,
    ].join(":");
    if (loadedStudentsKeyRef.current === key) {
      return;
    }

    loadedStudentsKeyRef.current = key;
    try {
      const students = await courseCoAttainmentApi.getStudents(
        filters.curriculumId,
        filters.termId,
        filters.courseId,
        {
          occasionId:
            selectedBloomOccasion === BLOOM_ALL_OCCASION_ID ? undefined : selectedBloomOccasion,
          sectionId: isBloomCiaType(selectedBloomType) ? selectedBloomSection : undefined,
          assessmentType: assessmentTypeForApi(selectedBloomType),
        }
      );
      const studentOptions = mapStudentOptions(students);
      setTabData((prev) => {
        if (!prev) {
          return prev;
        }
        return resetBloomPreview(prev, {
          studentOptions,
        });
      });
    } catch {
      loadedStudentsKeyRef.current = "";
    }
  };

  const loadSurveysForDirectIndirect = async () => {
    if (!filters.courseId) {
      return;
    }

    const key = filters.courseId;
    if (loadedSurveysKeyRef.current === key) {
      return;
    }

    loadedSurveysKeyRef.current = key;
    try {
      const surveys = await courseCoAttainmentApi.getSurveys(filters.courseId);
      const surveyOptions = mapSurveyOptions(surveys);
      setTabData((prev) => {
        if (!prev) {
          return prev;
        }
        return {
          ...prev,
          directIndirect: {
            ...prev.directIndirect,
            surveyOptions,
            defaultSurveyId: surveyOptions[0]?.id ?? "",
            selectedSurveyLabel: surveyOptions[0]?.label ?? "",
            validationMessage: surveyOptions.length ? "" : "No closed surveys are available for the selected course.",
          },
        };
      });

      if (surveyOptions.length && !surveyOptions.some((option) => option.id === selectedSurveyId)) {
        setSelectedSurveyId(surveyOptions[0].id);
      }
      if (!surveyOptions.length) {
        setSelectedSurveyId("");
      }
    } catch {
      loadedSurveysKeyRef.current = "";
    }
  };

  const loadCombinedPreview = async () => {
    if (!filters.curriculumId || !filters.termId || !filters.courseId) {
      return;
    }

    if (!selectedFinalizeTypeIds.length) {
      setTabData((prev) =>
        prev
          ? {
              ...prev,
              finalize: {
                ...prev.finalize,
                statusMessage: undefined,
                pendingPreview: undefined,
              },
            }
          : prev
      );
      loadedCombinedPreviewKeyRef.current = "";
      return;
    }

    const assessmentTypes = selectedFinalizeTypeIds
      .filter((typeId) => typeId !== "all-selected")
      .map(assessmentTypeForApi);
    const key = `${filters.curriculumId}:${filters.termId}:${filters.courseId}:${assessmentTypes.join(",")}`;
    if (loadedCombinedPreviewKeyRef.current === key) {
      return;
    }

    loadedCombinedPreviewKeyRef.current = key;
    try {
      const preview = await courseCoAttainmentApi.previewCombinedAttainment(
        filters.curriculumId,
        filters.termId,
        filters.courseId,
        assessmentTypes
      );
      setTabData((prev) => (prev ? mapCombinedPreview(prev, preview) : prev));
    } catch {
      loadedCombinedPreviewKeyRef.current = "";
    }
  };

  const loadBloomPreview = async () => {
    if (!filters.curriculumId || !filters.termId || !filters.courseId || !selectedBloomType) {
      loadedBloomPreviewKeyRef.current = "";
      setTabData((prev) => (prev ? resetBloomPreview(prev) : prev));
      return;
    }

    const assessmentType = assessmentTypeForApi(selectedBloomType);
    if (assessmentType === "CIA") {
      if (!selectedBloomSection || !selectedBloomOccasion) {
        loadedBloomPreviewKeyRef.current = "";
        setTabData((prev) => (prev ? resetBloomPreview(prev) : prev));
        return;
      }

      const occasionKey = `${filters.curriculumId}:${filters.termId}:${filters.courseId}:${selectedBloomSection}:${assessmentType}`;
      if (selectedBloomOccasion !== BLOOM_ALL_OCCASION_ID && readyOccasionsKeyRef.current !== occasionKey) {
        return;
      }
    }

    const key = [
      filters.curriculumId,
      filters.termId,
      filters.courseId,
      selectedBloomSection,
      assessmentType,
      selectedBloomOccasion,
      selectedBloomStudent,
    ].join(":");
    if (loadedBloomPreviewKeyRef.current === key) {
      return;
    }

    loadedBloomPreviewKeyRef.current = key;
    try {
      const preview = await courseCoAttainmentApi.previewBlooms({
        curriculumId: filters.curriculumId,
        termId: filters.termId,
        courseId: filters.courseId,
        sectionId: assessmentType === "CIA" ? selectedBloomSection : undefined,
        assessmentType,
        occasionId:
          assessmentType === "CIA" && selectedBloomOccasion !== BLOOM_ALL_OCCASION_ID
            ? selectedBloomOccasion
            : undefined,
        studentUsn: selectedBloomStudent || undefined,
      });
      setTabData((prev) => (prev ? mapBloomPreview(prev, preview) : prev));
    } catch {
      loadedBloomPreviewKeyRef.current = "";
    }
  };

  const loadCourses = async (curriculumId: string, termId: string): Promise<void> => {
    if (!curriculumId || !termId) {
      loadedCoursesRequestKeyRef.current = "";
      setFilterCatalog((prev) => ({
        ...prev,
        courses: [] as CourseCoAttainmentCourseOption[],
      }));
      setFilters((prev) => ({
        ...prev,
        courseId: "",
      }));
      setTabData(null);
      resetTabSelections();
      return;
    }

    const requestKey = `${curriculumId}:${termId}`;
    loadedCoursesRequestKeyRef.current = requestKey;

    try {
      const courses = await courseCoAttainmentApi.getCourses(curriculumId, termId);
      if (loadedCoursesRequestKeyRef.current !== requestKey) {
        return;
      }

      const mappedCourses = mapCourses(courses, curriculumId, termId).filter(
        (course) => course.curriculumId === curriculumId && course.termId === termId
      );

      setFilterCatalog((prev) => ({
        ...prev,
        courses: mappedCourses,
      }));
      setFilters((prev) => ({
        ...prev,
        courseId: "",
      }));
    } catch {
      if (loadedCoursesRequestKeyRef.current !== requestKey) {
        return;
      }

      setFilterCatalog((prev) => ({
        ...prev,
        courses: [] as CourseCoAttainmentCourseOption[],
      }));
      setFilters((prev) => ({
        ...prev,
        courseId: "",
      }));
    }
  };

  const loadTerms = async (curriculumId: string): Promise<void> => {
    if (!curriculumId) {
      setFilterCatalog((prev) => ({
        ...prev,
        terms: [] as CourseCoAttainmentTermOption[],
        courses: [] as CourseCoAttainmentCourseOption[],
      }));
      setFilters({
        curriculumId: "",
        termId: "",
        courseId: "",
      });
      setTabData(null);
      resetTabSelections();
      return;
    }

    try {
      const termsResponse = await courseCoAttainmentApi.getTerms(curriculumId);
      const mappedTerms = mapTerms(readCollection(termsResponse, "terms"), curriculumId);
      setFilterCatalog((prev) => ({
        ...prev,
        terms: mappedTerms,
        courses: [] as CourseCoAttainmentCourseOption[],
      }));
      setFilters((prev) => ({
        ...prev,
        termId: "",
        courseId: "",
      }));
    } catch {
      setFilterCatalog((prev) => ({
        ...prev,
        terms: [] as CourseCoAttainmentTermOption[],
        courses: [] as CourseCoAttainmentCourseOption[],
      }));
      setFilters((prev) => ({
        ...prev,
        termId: "",
        courseId: "",
      }));
    }
  };

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      try {
        const initial = await courseCoAttainmentApi.getInitial();
        if (!isMounted) {
          return;
        }

        const mappedCurriculums = mapCurriculumsFromInitial(readInitialCollection(initial, "curricula", "curriculums"));
        const curriculums = mappedCurriculums;
        setModuleFlags({
          mteFlag: toBool(initial.organisation_flags?.mte_flag),
          emsIntegration: toBool(initial.organisation_flags?.ems_integration),
        });

        const initialSelected = initial.selected_state ?? initial.selected;
        const selectedState: CourseCoAttainmentInitialState = {
          curriculumId: toStringId(initialSelected?.curriculum_id),
          termId: toStringId(initialSelected?.term_id),
          courseId: toStringId(initialSelected?.course_id),
        };

        const nextCurriculumId = selectedState.curriculumId || curriculums[0]?.id || "";
        const initialTerms = mapTerms(readInitialCollection(initial, "terms", "semesters"), nextCurriculumId);
        setFilterCatalog((prev) => ({
          ...prev,
          curriculums,
          terms: initialTerms,
          courses: [] as CourseCoAttainmentCourseOption[],
        }));
        setFilters({
          curriculumId: nextCurriculumId,
          termId: "",
          courseId: "",
        });

        if (nextCurriculumId && !initialTerms.length) {
          await loadTerms(nextCurriculumId);
        }

        initialisedRef.current = true;
      } catch {
        if (!isMounted) {
          return;
        }

        setFilterCatalog(emptyFilterCatalog);
        setModuleFlags({
          mteFlag: false,
          emsIntegration: false,
        });
        setFilters({
          curriculumId: "",
          termId: "",
          courseId: "",
        });
        initialisedRef.current = true;
      }
    };

    bootstrap();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!initialisedRef.current) {
      return;
    }
    if (!filters.curriculumId) {
      return;
    }
    loadTerms(filters.curriculumId);
    setTabData(null);
    resetTabSelections();
  }, [filters.curriculumId]);

  useEffect(() => {
    if (!initialisedRef.current) {
      return;
    }
    if (!filters.curriculumId || !filters.termId) {
      return;
    }
    loadCourses(filters.curriculumId, filters.termId);
    setTabData(null);
    resetTabSelections();
  }, [filters.curriculumId, filters.termId]);

  useEffect(() => {
    if (!initialisedRef.current) {
      return;
    }
    if (!filters.curriculumId || !filters.termId || !filters.courseId) {
      return;
    }
    loadOverview(filters.curriculumId, filters.termId, filters.courseId);
  }, [filters.curriculumId, filters.termId, filters.courseId]);

  useEffect(() => {
    if (activeTab !== "blooms" || !filters.courseId || !isBloomCiaType(selectedBloomType)) {
      return;
    }
    loadSectionsForBloom();
  }, [activeTab, filters.courseId, selectedBloomType]);

  useEffect(() => {
    if (activeTab !== "blooms" || !isBloomCiaType(selectedBloomType)) {
      return;
    }
    loadOccasionsForBloom();
  }, [activeTab, selectedBloomSection, selectedBloomType]);

  useEffect(() => {
    if (activeTab !== "blooms" || !selectedBloomType) {
      return;
    }
    loadStudentsForBloom();
  }, [activeTab, selectedBloomOccasion, selectedBloomSection, selectedBloomType]);

  useEffect(() => {
    if (activeTab !== "blooms") {
      return;
    }
    loadBloomPreview();
  }, [activeTab, selectedBloomSection, selectedBloomType, selectedBloomOccasion, selectedBloomStudent]);

  useEffect(() => {
    if (activeTab !== "blooms" || isBloomCiaType(selectedBloomType)) {
      return;
    }

    loadedBloomPreviewKeyRef.current = "";
  }, [activeTab, selectedBloomType]);

  useEffect(() => {
    if (activeTab !== "blooms") {
      return;
    }

    loadedBloomPreviewKeyRef.current = "";
    setTabData((prev) => (prev ? resetBloomPreview(prev) : prev));
  }, [selectedBloomStudent]);

  useEffect(() => {
    if (activeTab !== "blooms") {
      return;
    }

    loadedBloomPreviewKeyRef.current = "";
    loadedStudentsKeyRef.current = "";
    setSelectedBloomStudent("");
    setTabData((prev) =>
      prev
        ? resetBloomPreview(prev, {
            studentOptions: [BLOOM_SELECT_STUDENT_OPTION],
          })
        : prev
    );
  }, [selectedBloomOccasion]);

  useEffect(() => {
    if (activeTab !== "blooms") {
      return;
    }

    loadedBloomPreviewKeyRef.current = "";
    loadedOccasionsKeyRef.current = "";
    readyOccasionsKeyRef.current = "";
    loadedStudentsKeyRef.current = "";
    setSelectedBloomOccasion("");
    setSelectedBloomStudent("");
    setTabData((prev) =>
      prev
        ? resetBloomPreview(prev, {
            occasionOptions: isBloomCiaType(selectedBloomType)
              ? [BLOOM_SELECT_OCCASION_OPTION, BLOOM_ALL_OCCASION_OPTION]
              : prev.blooms.occasionOptions,
            studentOptions: [BLOOM_SELECT_STUDENT_OPTION],
          })
        : prev
    );
  }, [selectedBloomSection, selectedBloomType]);

  useEffect(() => {
    if (activeTab !== "finalize" || !filters.courseId) {
      return;
    }
    loadCombinedPreview();
  }, [activeTab, filters.courseId, selectedFinalizeTypeIds.join(",")]);

  useEffect(() => {
    if (activeTab !== "directIndirect" || !filters.courseId) {
      return;
    }
    loadSurveysForDirectIndirect();
  }, [activeTab, filters.courseId]);

  const availableTerms = useMemo(
    () => (filters.curriculumId ? filterCatalog.terms.filter((term) => term.curriculumId === filters.curriculumId) : []),
    [filterCatalog.terms, filters.curriculumId]
  );

  const availableCourses = useMemo(
    () =>
      filters.curriculumId && filters.termId
        ? filterCatalog.courses.filter(
            (course) => course.curriculumId === filters.curriculumId && course.termId === filters.termId
          )
        : [],
    [filterCatalog.courses, filters.curriculumId, filters.termId]
  );

  const filterOptions: CourseCoAttainmentFilterOptionsResponse = useMemo(
    () => ({
      curriculums: filterCatalog.curriculums,
      terms: availableTerms,
      courses: availableCourses,
    }),
    [availableCourses, availableTerms, filterCatalog.curriculums]
  );

  const selectedCurriculumLabel =
    filterCatalog.curriculums.find((curriculum) => curriculum.id === filters.curriculumId)?.label || "";
  const selectedTermLabel = availableTerms.find((term) => term.id === filters.termId)?.label || "";
  const selectedCourseLabel = availableCourses.find((course) => course.id === filters.courseId)?.label || "";

  const buildExportMetadata = (format: CourseCoAttainmentExportFormat) =>
    [
      ["Curriculum", selectedCurriculumLabel || "-"],
      ["Term", selectedTermLabel || "-"],
      ["Course", selectedCourseLabel || "-"],
      ["Active Tab", exportTabLabels[activeTab]],
      ["Generated At", formatGeneratedAt(new Date())],
      ["Export Format", format.toUpperCase()],
    ] as Array<[string, string]>;

  const buildMetadataTableHtml = (metadata: Array<[string, string]>) =>
    buildHtmlTable(
      ["Field", "Value", "Field", "Value"],
      [
        [metadata[0][0], metadata[0][1], metadata[1][0], metadata[1][1]],
        [metadata[2][0], metadata[2][1], metadata[3][0], metadata[3][1]],
        [metadata[4][0], metadata[4][1], metadata[5][0], metadata[5][1]],
      ]
    ).replace("<table>", '<table class="meta">');

  const exportFileName = (format: CourseCoAttainmentExportFormat) =>
    `Course_CO_Attainment_${sanitizeFilePart(activeTab.toUpperCase())}_${extractCourseCode(
      selectedCourseLabel,
      filters.courseId
    )}.${format}`;

  const exportCurrentTabToPdf = (previewWindow?: Window | null) => {
    if (!tabData) {
      return;
    }

    const metadata = buildExportMetadata("pdf");
    const builder = createAttainmentPdfBuilder({
      moduleTitle,
      reportTitle: exportTabLabels[activeTab],
      metadata: metadata.map(([label, value]) => ({ label, value })),
    });

    if (activeTab === "cce" || activeTab === "mte") {
      const tab = activeTab === "cce" ? tabData.cce : tabData.mte;

      const chartPoints = tab.sections[0]?.rows.map((row) => ({
        label: row.coCode,
        value: toNumericPercent(row.thresholdBasedAttainmentPercent),
      })) || [];
      builder.addChartSection(
        tab.title || exportTabLabels[activeTab],
        chartPoints,
        tabData.targetLevels.rows.map((row, index) => ({
          label: row.attainmentLevelName,
          value: row.attainmentLevelValue,
          color: ([
            [95, 147, 235],
            [244, 216, 78],
            [106, 219, 100],
          ][index] || [148, 163, 184]) as [number, number, number],
        }))
      );

      tab.sections.forEach((section) => {
        builder.addTableSection({
          title: `Section / Division - ${section.sectionLabel}`,
          headers: ["CO Code", "Threshold based Attainment %", "Attainment Level", "Average based Attainment %"],
          rows: section.rows.map((row) => [
            row.coCode,
            row.thresholdBasedAttainmentPercent,
            row.attainmentLevel,
            row.averageBasedAttainmentPercent,
          ]),
          summary: [
            ["Status", section.statusText],
            ["Actual Course Attainment", section.summary.actualCourseAttainment],
            ["Course Attainment After Weightage", section.summary.courseAttainmentAfterWeightage],
          ],
        });
      });

      if (tabData.targetLevels.rows.length) {
        builder.addTableSection({
          title: tabData.targetLevels.title,
          headers: ["Attainment Level Name", "Attainment Level Value", "Target"],
          rows: tabData.targetLevels.rows.map((row) => [
            row.attainmentLevelName,
            String(row.attainmentLevelValue),
            row.target,
          ]),
        });
      }
    }

    if (activeTab === "finalize") {
      const selectedTypeLabels = selectedFinalizeTypeIds
        .map((typeId) => tabData.finalize.typeOptions.find((option) => option.id === typeId)?.label)
        .filter(Boolean)
        .join(", ");

      builder.addTableSection({
        title: exportTabLabels.finalize,
        headers: ["Field", "Value"],
        rows: [["Selected Assessment Types", selectedTypeLabels || "None selected"]],
      });

      if (tabData.finalize.statusMessage?.lines.length) {
        builder.addMessageSection({
          title: "Status / Messages",
          lines: tabData.finalize.statusMessage.lines,
          tone: "warning",
        });
      }

      if (tabData.finalize.pendingPreview) {
        const pendingPreview = tabData.finalize.pendingPreview;
        builder.addChartSection(
          pendingPreview.title,
          pendingPreview.chartPoints.map((point) => ({
            label: point.label,
            value: point.thresholdPercent,
            secondaryValue: point.attainmentPercent,
          })),
          [],
          "Threshold Direct Attainment %",
          "Average based Attainment %"
        );
        builder.addTableSection({
          title: pendingPreview.targetLevels.title,
          headers: [
            "Sl No.",
            "Attainment Level Name",
            "Attainment Level Value",
            ...pendingPreview.targetLevels.columns.map((column) => column.label),
          ],
          rows: pendingPreview.targetLevels.rows.map((row) => [
            String(row.serialNo),
            row.attainmentLevelName,
            String(row.attainmentLevelValue),
            ...pendingPreview.targetLevels.columns.map(
              (column) => row.targets.find((target) => target.assessmentType === column.assessmentType)?.value || "-"
            ),
          ]),
        });
        builder.addTableSection({
          title: pendingPreview.overallCourseOutcomesTitle,
          headers: [
            "Sl No.",
            "CO Code",
            "Threshold based Attainment %",
            "Attainment Level",
            "Average based Attainment %",
          ],
          rows: pendingPreview.overallCourseOutcomesRows.map((row, index) => [
            String(index + 1),
            row.coCode,
            row.thresholdBasedAttainmentPercent,
            row.attainmentLevel,
            row.averageBasedAttainmentPercent,
          ]),
        });
      }

      builder.addTableSection({
        title: tabData.finalize.finalizedTableTitle,
        headers: [
          "CO Code",
          "CO Statement",
          "Threshold based Attainment %",
          "Attainment Level",
          "Average based Threshold %",
        ],
        rows: tabData.finalize.finalizedRows.map((row) => [
          row.coCode,
          row.coStatement,
          row.thresholdBasedAttainmentPercent,
          row.attainmentLevel,
          row.averageBasedThresholdPercent,
        ]),
      });
      builder.addTableSection({
        title: tabData.finalize.coPoMatrixTitle,
        headers: ["CO", ...tabData.finalize.coPoMatrixColumns],
        rows: tabData.finalize.coPoMatrixRows.map((row) => [row.coCode, ...row.values]),
        fontSize: 7.7,
      });
      builder.addTableSection({
        title: tabData.finalize.programOutcomesTitle,
        headers: [
          "Sl No.",
          "Program Outcomes",
          "Threshold method %",
          "Threshold level",
          "Weighted average %",
          "Weighted level",
          "Relative weighted average %",
          "Relative level",
        ],
        rows: tabData.finalize.programOutcomeRows.map((row) => [
          String(row.serialNo),
          row.programOutcome,
          row.thresholdMethodPercent,
          row.thresholdMethodLevel,
          row.weightedAveragePercent,
          row.weightedAverageLevel,
          row.relativeWeightedAveragePercent,
          row.relativeWeightedAverageLevel,
        ]),
        fontSize: 7.6,
      });
      builder.addTableSection({
        title: tabData.finalize.mapLevelWeightageTitle,
        headers: ["Sl No.", "Map Level", "Value", "Map Level Weightage"],
        rows: tabData.finalize.mapLevelWeightageRows.map((row) => [
          String(row.serialNo),
          row.mapLevel,
          row.value,
          row.mapLevelWeightage,
        ]),
      });

      if (tabData.finalize.calculationNotes.length) {
        builder.addTableSection({
          title: "Calculation Notes",
          headers: ["Title", "Details"],
          rows: tabData.finalize.calculationNotes.map((note) => [note.title, note.lines.join(" ")]),
        });
      }
    }

    if (activeTab === "directIndirect") {
      builder.addChartSection(
        tabData.directIndirect.chartTitle,
        tabData.directIndirect.chartPoints.map((point) => ({
          label: point.label,
          value: point.value,
        })),
        [],
        "Overall Attainment %"
      );
      builder.addTableSection({
        title: "Direct and Indirect Attainment Table",
        headers: [
          "COs Code",
          "Actual Direct Attainment %",
          "Actual Direct Attainment Level",
          "Actual Indirect Attainment %",
          "Actual Indirect Attainment Level",
          "Direct Attainment Weightage %",
          "Indirect Attainment Weightage %",
          "After Weightage Direct Attainment %",
          "After Weightage Direct Attainment Level",
          "After Weightage Indirect Attainment %",
          "After Weightage Indirect Attainment Level",
          "Overall Attainment %",
          "Attainment Level",
        ],
        rows: tabData.directIndirect.rows.map((row) => [
          row.coCode,
          row.actualDirectAttainmentPercent,
          row.actualDirectAttainmentLevel,
          row.actualIndirectAttainmentPercent,
          row.actualIndirectAttainmentLevel,
          row.directPercentage,
          row.indirectPercentage,
          row.afterWeightageDirectAttainmentPercent,
          row.afterWeightageDirectAttainmentLevel,
          row.afterWeightageIndirectAttainmentPercent,
          row.afterWeightageIndirectAttainmentLevel,
          row.overallAttainment,
          row.attainmentLevel,
        ]),
        fontSize: 7.4,
      });
    }

    const doc = builder.finalize();
    const pdfBlob = doc.output("blob");
    if (!pdfBlob || pdfBlob.size === 0) {
      throw new Error("Generated PDF is empty");
    }
    openPdfPreview(pdfBlob, exportFileName("pdf"), previewWindow);
  };

  const exportCurrentTabToDoc = async () => {
    if (!tabData) {
      return;
    }

    const metadata = buildExportMetadata("doc");
    const builder = createAttainmentDocBuilder({
      moduleTitle,
      reportTitle: exportTabLabels[activeTab],
      metadata: metadata.map(([label, value]) => ({ label, value })),
    });

    if (activeTab === "cce" || activeTab === "mte") {
      const tab = activeTab === "cce" ? tabData.cce : tabData.mte;
      const chartPoints = tab.sections[0]?.rows.map((row) => ({
        label: row.coCode,
        value: toNumericPercent(row.thresholdBasedAttainmentPercent),
      })) || [];
      builder.addChartSection(
        tab.title || exportTabLabels[activeTab],
        chartPoints,
        tabData.targetLevels.rows.map((row, index) => ({
          label: row.attainmentLevelName,
          value: row.attainmentLevelValue,
          color: ([
            [95, 147, 235],
            [244, 216, 78],
            [106, 219, 100],
          ][index] || [148, 163, 184]) as [number, number, number],
        }))
      );

      tab.sections.forEach((section) => {
        builder.addTableSection({
          title: `Section / Division - ${section.sectionLabel}`,
          headers: ["CO Code", "Threshold based Attainment %", "Attainment Level", "Average based Attainment %"],
          rows: section.rows.map((row) => [
            row.coCode,
            row.thresholdBasedAttainmentPercent,
            row.attainmentLevel,
            row.averageBasedAttainmentPercent,
          ]),
          summary: [
            ["Status", section.statusText],
            ["Actual Course Attainment", section.summary.actualCourseAttainment],
            ["Course Attainment After Weightage", section.summary.courseAttainmentAfterWeightage],
          ],
        });
      });

      if (tabData.targetLevels.rows.length) {
        builder.addTableSection({
          title: tabData.targetLevels.title,
          headers: ["Attainment Level Name", "Attainment Level Value", "Target"],
          rows: tabData.targetLevels.rows.map((row) => [
            row.attainmentLevelName,
            String(row.attainmentLevelValue),
            row.target,
          ]),
        });
      }
    }

    if (activeTab === "finalize") {
      const selectedTypeLabels = selectedFinalizeTypeIds
        .map((typeId) => tabData.finalize.typeOptions.find((option) => option.id === typeId)?.label)
        .filter(Boolean)
        .join(", ");

      builder.addTableSection({
        title: exportTabLabels.finalize,
        headers: ["Field", "Value"],
        rows: [["Selected Assessment Types", selectedTypeLabels || "None selected"]],
      });

      if (tabData.finalize.statusMessage?.lines.length) {
        builder.addMessageSection({
          title: "Status / Messages",
          lines: tabData.finalize.statusMessage.lines,
        });
      }

      if (tabData.finalize.pendingPreview) {
        const pendingPreview = tabData.finalize.pendingPreview;
        builder.addChartSection(
          pendingPreview.title,
          pendingPreview.chartPoints.map((point) => ({
            label: point.label,
            value: point.thresholdPercent,
            secondaryValue: point.attainmentPercent,
          })),
          [],
          "Threshold Direct Attainment %",
          "Average based Attainment %"
        );
        builder.addTableSection({
          title: pendingPreview.targetLevels.title,
          headers: [
            "Sl No.",
            "Attainment Level Name",
            "Attainment Level Value",
            ...pendingPreview.targetLevels.columns.map((column) => column.label),
          ],
          rows: pendingPreview.targetLevels.rows.map((row) => [
            String(row.serialNo),
            row.attainmentLevelName,
            String(row.attainmentLevelValue),
            ...pendingPreview.targetLevels.columns.map(
              (column) => row.targets.find((target) => target.assessmentType === column.assessmentType)?.value || "-"
            ),
          ]),
        });
        builder.addTableSection({
          title: pendingPreview.overallCourseOutcomesTitle,
          headers: [
            "Sl No.",
            "CO Code",
            "Threshold based Attainment %",
            "Attainment Level",
            "Average based Attainment %",
          ],
          rows: pendingPreview.overallCourseOutcomesRows.map((row, index) => [
            String(index + 1),
            row.coCode,
            row.thresholdBasedAttainmentPercent,
            row.attainmentLevel,
            row.averageBasedAttainmentPercent,
          ]),
        });
      }

      builder.addTableSection({
        title: tabData.finalize.finalizedTableTitle,
        headers: [
          "CO Code",
          "CO Statement",
          "Threshold based Attainment %",
          "Attainment Level",
          "Average based Threshold %",
        ],
        rows: tabData.finalize.finalizedRows.map((row) => [
          row.coCode,
          row.coStatement,
          row.thresholdBasedAttainmentPercent,
          row.attainmentLevel,
          row.averageBasedThresholdPercent,
        ]),
      });
      builder.addTableSection({
        title: tabData.finalize.coPoMatrixTitle,
        headers: ["CO", ...tabData.finalize.coPoMatrixColumns],
        rows: tabData.finalize.coPoMatrixRows.map((row) => [row.coCode, ...row.values]),
        fontSize: 7.7,
      });
      builder.addTableSection({
        title: tabData.finalize.programOutcomesTitle,
        headers: [
          "Sl No.",
          "Program Outcomes",
          "Threshold method %",
          "Threshold level",
          "Weighted average %",
          "Weighted level",
          "Relative weighted average %",
          "Relative level",
        ],
        rows: tabData.finalize.programOutcomeRows.map((row) => [
          String(row.serialNo),
          row.programOutcome,
          row.thresholdMethodPercent,
          row.thresholdMethodLevel,
          row.weightedAveragePercent,
          row.weightedAverageLevel,
          row.relativeWeightedAveragePercent,
          row.relativeWeightedAverageLevel,
        ]),
        fontSize: 7.6,
      });
      builder.addTableSection({
        title: tabData.finalize.mapLevelWeightageTitle,
        headers: ["Sl No.", "Map Level", "Value", "Map Level Weightage"],
        rows: tabData.finalize.mapLevelWeightageRows.map((row) => [
          String(row.serialNo),
          row.mapLevel,
          row.value,
          row.mapLevelWeightage,
        ]),
      });

      if (tabData.finalize.calculationNotes.length) {
        builder.addTableSection({
          title: "Calculation Notes",
          headers: ["Title", "Details"],
          rows: tabData.finalize.calculationNotes.map((note) => [note.title, note.lines.join(" ")]),
        });
      }
    }

    if (activeTab === "directIndirect") {
      builder.addChartSection(
        tabData.directIndirect.chartTitle,
        tabData.directIndirect.chartPoints.map((point) => ({
          label: point.label,
          value: point.value,
        })),
        [],
        "Overall Attainment %"
      );
      builder.addTableSection({
        title: "Direct and Indirect Attainment Table",
        headers: [
          "COs Code",
          "Actual Direct Attainment %",
          "Actual Direct Attainment Level",
          "Actual Indirect Attainment %",
          "Actual Indirect Attainment Level",
          "Direct Attainment Weightage %",
          "Indirect Attainment Weightage %",
          "After Weightage Direct Attainment %",
          "After Weightage Direct Attainment Level",
          "After Weightage Indirect Attainment %",
          "After Weightage Indirect Attainment Level",
          "Overall Attainment %",
          "Attainment Level",
        ],
        rows: tabData.directIndirect.rows.map((row) => [
          row.coCode,
          row.actualDirectAttainmentPercent,
          row.actualDirectAttainmentLevel,
          row.actualIndirectAttainmentPercent,
          row.actualIndirectAttainmentLevel,
          row.directPercentage,
          row.indirectPercentage,
          row.afterWeightageDirectAttainmentPercent,
          row.afterWeightageDirectAttainmentLevel,
          row.afterWeightageIndirectAttainmentPercent,
          row.afterWeightageIndirectAttainmentLevel,
          row.overallAttainment,
          row.attainmentLevel,
        ]),
        fontSize: 7.4,
      });
    }

    await downloadWordDocument(
      builder.finalize(),
      exportFileName("doc").replace(/\.doc$/, ".docx")
    );
  };

  const handleExport = async (format: CourseCoAttainmentExportFormat) => {
    if (!filters.courseId || !tabData) {
      toast.info("Select Curriculum, Term, and Course before exporting.");
      return;
    }

    if (!exportableTabs.includes(activeTab)) {
      toast.info("Export is available only for CCE, MTE, Finalize, and Direct and Indirect tabs.");
      return;
    }

    if (activeTab === "directIndirect" && !tabData.directIndirect.previewReady) {
      toast.info("Submit Direct and Indirect Attainment successfully before exporting.");
      return;
    }

    const previewWindow = format === "pdf" ? window.open("", "_blank") : null;
    if (format === "pdf" && !previewWindow) {
      toast.error("Allow pop-ups to preview the PDF export.");
      return;
    }
    if (previewWindow) {
      previewWindow.document.open();
      previewWindow.document.write('<p style="font-family: Arial, sans-serif; padding: 24px;">Generating PDF preview...</p>');
      previewWindow.document.close();
    }

    setIsExporting(true);
    try {
      if (format === "pdf") {
        exportCurrentTabToPdf(previewWindow);
        toast.success("PDF preview opened successfully.");
      } else {
        await exportCurrentTabToDoc();
        toast.success("DOC export downloaded successfully.");
      }
    } catch (error) {
      previewWindow?.close();
      console.error("Failed to export PDF preview:", error);
      toast.error(format === "pdf" ? "PDF preview could not be generated. Please check the console." : `Unable to export ${format.toUpperCase()} right now.`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleFilterChange = (key: keyof CourseCoAttainmentFiltersState, value: string) => {
    if (key === "curriculumId") {
      setFilters({
        curriculumId: value,
        termId: "",
        courseId: "",
      });
      setTabData(null);
      resetPreviewLoadKeys();
      setActiveTab("cce");
      resetTabSelections();
      return;
    }

    if (key === "termId") {
      setFilters((prev) => ({
        ...prev,
        termId: value,
        courseId: "",
      }));
      setTabData(null);
      resetPreviewLoadKeys();
      setActiveTab("cce");
      resetTabSelections();
      return;
    }

    setFilters((prev) => ({
      ...prev,
      courseId: value,
    }));
    setTabData((prev) => (prev ? resetDirectIndirectPreview(prev) : prev));
    resetPreviewLoadKeys();
    resetTabSelections();
  };

  const handleDirectIndirectSubmit = async () => {
    if (!filters.courseId || !tabData) {
      return;
    }

    const directWeight = Number(tabData.directIndirect.directWeight);
    const indirectWeight = Number(tabData.directIndirect.indirectWeight);

    if (!selectedSurveyId) {
      setTabData((prev) =>
        prev
          ? resetDirectIndirectPreview(prev, {
              validationMessage: "Select a closed survey before previewing direct and indirect attainment.",
            })
          : prev
      );
      return;
    }

    if (
      !Number.isFinite(directWeight) ||
      !Number.isFinite(indirectWeight) ||
      Math.abs(directWeight + indirectWeight - 100) > 0.001
    ) {
      setTabData((prev) =>
        prev
          ? resetDirectIndirectPreview(prev, {
              validationMessage: "Direct weight and indirect weight must add up to exactly 100.",
            })
          : prev
      );
      return;
    }

    try {
      const preview = await courseCoAttainmentApi.previewDirectIndirect({
        courseId: filters.courseId,
        assessmentType: "BOTH",
        directWeight: tabData.directIndirect.directWeight,
        indirectWeight: tabData.directIndirect.indirectWeight,
        surveyId: selectedSurveyId,
      });
      setTabData((prev) => (prev ? mapDirectIndirectPreview(prev, preview) : prev));
    } catch {
      setTabData((prev) =>
        prev
          ? resetDirectIndirectPreview(prev, {
              validationMessage: "Unable to load the direct and indirect attainment preview right now.",
            })
          : prev
      );
    }
  };

  const handleDirectIndirectFinalize = async () => {
    if (!filters.courseId || !tabData?.directIndirect.previewReady || !selectedSurveyId) {
      return;
    }

    try {
      const response = await courseCoAttainmentApi.finalizeDirectIndirect({
        courseId: filters.courseId,
        assessmentType: "BOTH",
        directWeight: tabData.directIndirect.directWeight,
        indirectWeight: tabData.directIndirect.indirectWeight,
        surveyId: selectedSurveyId,
      });
      const responseRecord = asRecord(response);
      const message = readString(responseRecord ?? {}, "message");
      const dataRecord = asRecord(responseRecord?.data);
      const messages = toArrayValue(dataRecord?.messages);
      setTabData((prev) =>
        prev
          ? {
              ...prev,
              directIndirect: {
                ...prev.directIndirect,
                finalizeMessage: [message, ...messages].filter(Boolean).join(" "),
              },
            }
          : prev
      );
    } catch {
      setTabData((prev) =>
        prev
          ? {
              ...prev,
              directIndirect: {
                ...prev.directIndirect,
                finalizeMessage: "Direct and indirect finalization could not be completed.",
              },
            }
          : prev
      );
    }
  };

  return {
    activeTab,
    filters,
    filterOptions,
    isLoading,
    isExporting,
    tabData,
    hasCourseSelected: Boolean(filters.courseId),
    isTermDisabled: !filters.curriculumId,
    isCourseDisabled: !filters.termId,
    selectedFinalizeTypeIds,
    selectedBloomType,
    selectedBloomSection,
    selectedBloomOccasion,
    selectedBloomStudent,
    selectedSurveyId,
    moduleFlags,
    overviewData,
    setActiveTab,
    handleFilterChange,
    loadCurrentTabData: loadOverview,
    setSelectedFinalizeTypeIds,
    setSelectedBloomType,
    setSelectedBloomSection,
    setSelectedBloomOccasion,
    setSelectedBloomStudent,
    handleDirectIndirectSurveyChange,
    handleDirectIndirectWeightChange,
    handleDirectIndirectSubmit,
    handleDirectIndirectFinalize,
    handleExport,
  };
};

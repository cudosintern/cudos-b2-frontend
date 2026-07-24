import { useState, useEffect, useCallback } from 'react';
import { ciaAttainmentApi } from './ciaAttainmentApi';
import { DropdownOption, CiaAttainmentFilters, CalculateAttainmentPayload, AttainmentData, CiaAttainmentSelectionContext, CoAssessmentDetails, CoDrilldownDetails, ExportAttainmentResponse } from './ciaAttainmentTypes';
import { toast } from 'react-toastify';
import { createAttainmentDocBuilder, downloadWordDocument } from '../courseCoAttainment/attainmentDocTemplate';
import { createAttainmentPdfBuilder, openPdfPreview } from '../courseCoAttainment/attainmentPdfTemplate';

const backendMessage = (error: any, fallback: string) => (
  error?.response?.data?.message || error?.response?.data?.detail || fallback
);

const sanitizeFilePart = (value: string) => (
  value
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'NA'
);

const buildDocxExportDocument = (res: ExportAttainmentResponse, attainmentData: AttainmentData | null) => {
  const workflowRows =
    attainmentData?.workflow_co_attainment?.length
      ? attainmentData.workflow_co_attainment
      : attainmentData?.co_attainment?.length
        ? attainmentData.co_attainment
        : (res.calculated.co_attainment || []);
  const finalizedRows = res.finalized?.co_attainment || [];
  const levels = attainmentData?.levels || res.levels || [];

  const builder = createAttainmentDocBuilder({
    moduleTitle: 'CIA Attainment',
    reportTitle: 'IA - Course Outcomes (COs) Attainment',
    metadata: [
      { label: 'Curriculum', value: res.filters.curriculum_name || '-' },
      { label: 'Term', value: res.filters.term_name || '-' },
      { label: 'Course', value: res.filters.course_name || '-' },
      { label: 'Section', value: res.filters.section_name || '-' },
      { label: 'Occasion(s)', value: res.filters.occasion_names.join(', ') || '-' },
      { label: 'Generated At', value: new Date().toLocaleString('en-IN') },
    ],
  });

  if ((attainmentData?.blocking_messages || []).length) {
    builder.addMessageSection({
      title: 'Status / Messages',
      lines: attainmentData?.blocking_messages || [],
    });
  }

  if (workflowRows.length) {
    builder.addChartSection(
      'Course Outcome(COs) Attainment',
      workflowRows.map((co) => ({
        label: co.co_code,
        value: Number(co.threshold_attainment || 0),
      })),
      levels.map((level, index) => ({
        label: level.name,
        value: Number(level.target_percentage || 0),
        color: ([
          [169, 53, 114],
          [121, 200, 102],
          [109, 173, 126],
        ][index] || [148, 163, 184]) as [number, number, number],
      }))
    );
  }

  builder.addTableSection({
    title: 'Direct Attainment / Target Levels',
    headers: ['Sl No.', 'Attainment Level Name', 'Attainment Level Value', 'Target'],
    rows: levels.map((level, index) => [
      String(index + 1),
      level.name,
      String(level.value),
      `${Number(level.target_percentage).toFixed(0)}% students scoring >= 50% marks out of relevant maximum marks.`,
    ]),
  });

  builder.addTableSection({
    title: 'Calculated CO Attainment',
    headers: ['Sl No.', 'CO Code', 'Threshold based Attainment %', 'Attainment Level', 'Average based Attainment %'],
    rows: (res.calculated.co_attainment || []).map((co, index) => [
      String(index + 1),
      co.co_code,
      `${Number(co.threshold_attainment).toFixed(2)}%`,
      Number(co.attainment_level).toFixed(2),
      `${Number(co.average_attainment).toFixed(2)}%`,
    ]),
    summary: [
      ['Status', attainmentData?.status || '-'],
      ['Actual Course Attainment', `${Number(res.calculated.course_attainment || 0).toFixed(2)}%`],
      ['Course Attainment After Weightage', `${Number(res.calculated.course_attainment_after_weightage || 0).toFixed(2)}%`],
    ],
  });

  if (finalizedRows.length) {
    builder.addTableSection({
      title: 'Finalized CO Attainment',
      headers: ['Sl No.', 'CO Code', 'CO Statement', 'Threshold based Attainment %', 'Attainment Level', 'Average based Attainment %'],
      rows: finalizedRows.map((co, index) => [
        String(index + 1),
        co.co_code,
        co.co_statement || '-',
        `${Number(co.threshold_attainment).toFixed(2)}%`,
        Number(co.attainment_level).toFixed(2),
        `${Number(co.average_attainment).toFixed(2)}%`,
      ]),
    });
  }

  builder.addNotesSection('Calculation Notes', [
    'The chart represents the visible threshold direct attainment percentage for each CO.',
    res.notes?.threshold_formula
      ? `${res.notes.threshold_formula}: x = Count of Students >= Threshold %, y = Total number of Students Attempted.`
      : 'For Threshold based Attainment % = (x / y) * 100.',
    res.notes?.average_formula
      ? `${res.notes.average_formula}: x = Average Secured marks of Attempted Students, y = Maximum Marks.`
      : 'For Average based Attainment % = (x / y) * 100.',
  ]);

  return builder.finalize();
};

export const useCiaAttainment = () => {
  const [curriculums, setCurriculums] = useState<DropdownOption[]>([]);
  const [terms, setTerms] = useState<DropdownOption[]>([]);
  const [courses, setCourses] = useState<DropdownOption[]>([]);
  const [sections, setSections] = useState<DropdownOption[]>([]);
  const [occasions, setOccasions] = useState<DropdownOption[]>([]);

  const [filters, setFilters] = useState<CiaAttainmentFilters>({
    curriculumId: null,
    termId: null,
    courseId: null,
    sectionId: null,
    occasionIds: [],
  });

  const [attainmentData, setAttainmentData] = useState<AttainmentData | null>(null);
  const [assessmentDetails, setAssessmentDetails] = useState<CoAssessmentDetails | null>(null);
  const [drilldownDetails, setDrilldownDetails] = useState<CoDrilldownDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [calculationLoading, setCalculationLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const hasRequiredFilters = Boolean(
    filters.curriculumId &&
    filters.termId &&
    filters.courseId &&
    filters.sectionId &&
    filters.occasionIds.length > 0
  );

  useEffect(() => {
    const fetchCurriculums = async () => {
      setLoading(true);
      try {
        const data = await ciaAttainmentApi.getCurriculums();
        setCurriculums(data);
      } catch (error) {
        console.error("Failed to fetch curriculums:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCurriculums();
  }, []);

  useEffect(() => {
    if (filters.curriculumId) {
      setLoading(true);
      ciaAttainmentApi.getTerms(filters.curriculumId)
        .then(setTerms)
        .catch(() => setTerms([]))
        .finally(() => setLoading(false));
    } else {
      setTerms([]);
    }
  }, [filters.curriculumId]);

  useEffect(() => {
    if (filters.termId) {
      setLoading(true);
      ciaAttainmentApi.getCourses(filters.termId)
        .then(setCourses)
        .catch(() => setCourses([]))
        .finally(() => setLoading(false));
    } else {
      setCourses([]);
    }
  }, [filters.termId]);

  useEffect(() => {
    if (filters.curriculumId && filters.termId && filters.courseId) {
      setLoading(true);
      ciaAttainmentApi.getSections(filters.curriculumId, filters.termId, filters.courseId)
        .then(setSections)
        .catch(() => setSections([]))
        .finally(() => setLoading(false));
    } else {
      setSections([]);
    }
  }, [filters.curriculumId, filters.termId, filters.courseId]);

  useEffect(() => {
    if (filters.curriculumId && filters.termId && filters.courseId && filters.sectionId) {
      setLoading(true);
      ciaAttainmentApi.getOccasions(filters.curriculumId, filters.termId, filters.courseId, filters.sectionId)
        .then(setOccasions)
        .catch(() => setOccasions([]))
        .finally(() => setLoading(false));
    } else {
      setOccasions([]);
    }
  }, [filters.curriculumId, filters.termId, filters.courseId, filters.sectionId]);

  useEffect(() => {
    if (!hasRequiredFilters) {
      setAttainmentData(null);
      return;
    }

    let active = true;
    const fetchAttainment = async () => {
      setCalculationLoading(true);
      try {
        const payload: CalculateAttainmentPayload = {
          course_id: filters.courseId as string | number,
          section_id: filters.sectionId as string | number,
          occasion_ids: filters.occasionIds,
          assessment_type: "CIA",
        };
        const data = await ciaAttainmentApi.calculateAttainment(payload);
        if (active) setAttainmentData(data);
      } catch (error) {
        console.error("Failed to load attainment:", error);
        if (active) {
          setAttainmentData({
            status: "blocked",
            co_calculation_type: 3,
            levels: [],
            co_attainment: [],
            course_attainment: 0,
            course_attainment_after_weightage: 0,
            finalize_allowed: false,
            blocking_messages: [backendMessage(
              error,
              "The CIA attainment request could not be completed. Check the backend connection or session and try again.",
            )],
          });
        }
      } finally {
        if (active) setCalculationLoading(false);
      }
    };

    fetchAttainment();
    return () => {
      active = false;
    };
  }, [hasRequiredFilters, filters.courseId, filters.sectionId, filters.occasionIds]);

  const handleFilterChange = useCallback((key: keyof CiaAttainmentFilters, value: any) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      if (key === 'curriculumId') {
        newFilters.termId = null;
        newFilters.courseId = null;
        newFilters.sectionId = null;
        newFilters.occasionIds = [];
      } else if (key === 'termId') {
        newFilters.courseId = null;
        newFilters.sectionId = null;
        newFilters.occasionIds = [];
      } else if (key === 'courseId') {
        newFilters.sectionId = null;
        newFilters.occasionIds = [];
      } else if (key === 'sectionId') {
        newFilters.occasionIds = [];
      }
      return newFilters;
    });
    setAttainmentData(null);
    setAssessmentDetails(null);
    setDrilldownDetails(null);
  }, []);

  const calculateAttainment = useCallback(async () => {
    if (!filters.courseId || !filters.sectionId || filters.occasionIds.length === 0) {
      toast.warn("Please select Course, Section, and at least one CIA Occasion.");
      return;
    }

    setCalculationLoading(true);
    setAttainmentData(null);
    try {
      const payload: CalculateAttainmentPayload = {
        course_id: filters.courseId,
        section_id: filters.sectionId,
        occasion_ids: filters.occasionIds,
        assessment_type: "CIA",
      };
      const data = await ciaAttainmentApi.calculateAttainment(payload);
      setAttainmentData(data);
      if (data.status === "Rolled0ut") {
        toast.success("Attainment calculated successfully!");
      } else {
        toast.error("Calculation blocked: " + data.status);
      }
    } catch (error) {
      console.error("Failed to calculate attainment:", error);
      toast.error("Failed to calculate attainment.");
    } finally {
      setCalculationLoading(false);
    }
  }, [filters]);

  const loadAssessmentDetails = useCallback(async (coId: string | number) => {
    setActionLoading(true);
    try {
      const details = await ciaAttainmentApi.getCoAssessmentDetails(coId);
      setAssessmentDetails(details);
    } catch (error) {
      console.error("Failed to load CO assessment details:", error);
      toast.error("Failed to load CO assessment details.");
    } finally {
      setActionLoading(false);
    }
  }, []);

  const closeAssessmentDetails = useCallback(() => {
    setAssessmentDetails(null);
  }, []);

  const loadDrilldownDetails = useCallback(async (coId: string | number) => {
    setActionLoading(true);
    try {
      const details = await ciaAttainmentApi.getCoDrilldownDetails(coId);
      setDrilldownDetails(details);
    } catch (error) {
      console.error("Failed to load CO drill down details:", error);
      toast.error("Failed to load CO drill down details.");
    } finally {
      setActionLoading(false);
    }
  }, []);

  const closeDrilldownDetails = useCallback(() => {
    setDrilldownDetails(null);
  }, []);

  const getOptionName = useCallback((options: DropdownOption[], id: string | number | null, formatter?: (option: DropdownOption) => string) => {
    const match = options.find((option) => String(option.id) === String(id));
    if (!match) {
      return '';
    }
    return formatter ? formatter(match) : match.name;
  }, []);

  const selectionContext: CiaAttainmentSelectionContext = {
    curriculumName: getOptionName(curriculums, filters.curriculumId),
    termName: getOptionName(terms, filters.termId),
    courseName: getOptionName(courses, filters.courseId, (course) => (
      course.course_code && !course.name.startsWith(course.course_code)
        ? `${course.course_code} - ${course.name}`
        : course.name
    )),
    sectionName: getOptionName(sections, filters.sectionId),
  };

  const finalizeAttainment = useCallback(async () => {
    if (!hasRequiredFilters) {
      toast.warn("Please complete all filters before finalizing.");
      return;
    }
    setActionLoading(true);
    try {
      const payload: CalculateAttainmentPayload = {
        course_id: filters.courseId as string | number,
        section_id: filters.sectionId as string | number,
        occasion_ids: filters.occasionIds,
        assessment_type: "CIA",
      };
      const res = await ciaAttainmentApi.finalizeAttainment(payload);
      toast.success(res.message);
    } catch (error) {
      console.error("Failed to finalize attainment:", error);
      toast.error("Failed to finalize attainment.");
    } finally {
      setActionLoading(false);
    }
  }, [filters, hasRequiredFilters]);

  const exportAttainment = useCallback(async (exportType: 'pdf' | 'doc') => {
    if (!hasRequiredFilters) {
      toast.warn("Please complete all filters before exporting.");
      return;
    }
    const previewWindow = exportType === 'pdf' ? window.open('', '_blank') : null;
    if (exportType === 'pdf' && !previewWindow) {
      toast.error('Allow pop-ups to preview the PDF export.');
      return;
    }
    if (previewWindow) {
      previewWindow.document.open();
      previewWindow.document.write('<p style="font-family: Arial, sans-serif; padding: 24px;">Generating PDF preview...</p>');
      previewWindow.document.close();
    }
    setActionLoading(true);
    try {
      const payload = {
        course_id: filters.courseId as string | number,
        section_id: filters.sectionId as string | number,
        occasion_ids: filters.occasionIds,
        assessment_type: "CIA" as const,
        export_type: exportType,
      };
      const res = await ciaAttainmentApi.exportAttainment(payload);
      if (exportType === 'pdf') {
        const workflowRows =
          attainmentData?.workflow_co_attainment?.length
            ? attainmentData.workflow_co_attainment
            : attainmentData?.co_attainment?.length
              ? attainmentData.co_attainment
              : (res.calculated.co_attainment || []);
        const finalizedRows = res.finalized?.co_attainment || [];
        const levels = attainmentData?.levels || res.levels || [];
        const builder = createAttainmentPdfBuilder({
          moduleTitle: 'CIA Attainment',
          reportTitle: 'IA - Course Outcomes (COs) Attainment',
          metadata: [
            { label: 'Curriculum', value: res.filters.curriculum_name || '-' },
            { label: 'Term', value: res.filters.term_name || '-' },
            { label: 'Course', value: res.filters.course_name || '-' },
            { label: 'Section', value: res.filters.section_name || '-' },
            { label: 'Occasion(s)', value: res.filters.occasion_names.join(', ') || '-' },
            { label: 'Generated At', value: new Date().toLocaleString('en-IN') },
          ],
        });

        if ((attainmentData?.blocking_messages || []).length) {
          builder.addMessageSection({
            title: 'Status / Messages',
            lines: attainmentData?.blocking_messages || [],
            tone: attainmentData?.status?.toLowerCase() === 'blocked' ? 'danger' : 'warning',
          });
        }

        if (workflowRows.length) {
          builder.addChartSection(
            'Course Outcome(COs) Attainment',
            workflowRows.map((co) => ({
              label: co.co_code,
              value: Number(co.threshold_attainment || 0),
            })),
            levels.map((level, index) => ({
              label: level.name,
              value: Number(level.target_percentage || 0),
              color: ([
                [169, 53, 114],
                [121, 200, 102],
                [109, 173, 126],
              ][index] || [148, 163, 184]) as [number, number, number],
            }))
          );
        }

        builder.addTableSection({
          title: 'Direct Attainment / Target Levels',
          headers: ['Sl No.', 'Attainment Level Name', 'Attainment Level Value', 'Target'],
          rows: levels.map((level, index) => [
            String(index + 1),
            level.name,
            String(level.value),
            `${Number(level.target_percentage).toFixed(0)}% students scoring >= 50% marks out of relevant maximum marks.`,
          ]),
        });

        builder.addTableSection({
          title: 'Calculated CO Attainment',
          headers: ['Sl No.', 'CO Code', 'Threshold based Attainment %', 'Attainment Level', 'Average based Attainment %'],
          rows: (res.calculated.co_attainment || []).map((co, index) => [
            String(index + 1),
            co.co_code,
            `${Number(co.threshold_attainment).toFixed(2)}%`,
            Number(co.attainment_level).toFixed(2),
            `${Number(co.average_attainment).toFixed(2)}%`,
          ]),
          summary: [
            ['Status', attainmentData?.status || '-'],
            ['Actual Course Attainment', `${Number(res.calculated.course_attainment || 0).toFixed(2)}%`],
            ['Course Attainment After Weightage', `${Number(res.calculated.course_attainment_after_weightage || 0).toFixed(2)}%`],
          ],
        });

        if (finalizedRows.length) {
          builder.addTableSection({
            title: 'Finalized CO Attainment',
            headers: ['Sl No.', 'CO Code', 'CO Statement', 'Threshold based Attainment %', 'Attainment Level', 'Average based Attainment %'],
            rows: finalizedRows.map((co, index) => [
              String(index + 1),
              co.co_code,
              co.co_statement || '-',
              `${Number(co.threshold_attainment).toFixed(2)}%`,
              Number(co.attainment_level).toFixed(2),
              `${Number(co.average_attainment).toFixed(2)}%`,
            ]),
          });
        }

        builder.addNotesSection('Calculation Notes', [
          'The chart represents the visible threshold direct attainment percentage for each CO.',
          res.notes?.threshold_formula
            ? `${res.notes.threshold_formula}: x = Count of Students >= Threshold %, y = Total number of Students Attempted.`
            : 'For Threshold based Attainment % = (x / y) * 100.',
          res.notes?.average_formula
            ? `${res.notes.average_formula}: x = Average Secured marks of Attempted Students, y = Maximum Marks.`
            : 'For Average based Attainment % = (x / y) * 100.',
        ]);

        const doc = builder.finalize();
        const fileName = `CIA_CO_Attainment_${sanitizeFilePart(res.filters.course_name)}_${sanitizeFilePart(res.filters.section_name)}.pdf`;
        const pdfBlob = doc.output('blob');
        if (!pdfBlob || pdfBlob.size === 0) {
          throw new Error('Generated PDF is empty');
        }
        openPdfPreview(pdfBlob, fileName, previewWindow);
        toast.success('PDF preview opened successfully.');
      } else {
        await downloadWordDocument(
          buildDocxExportDocument(res, attainmentData),
          `CIA_CO_Attainment_${sanitizeFilePart(res.filters.course_name)}_${sanitizeFilePart(res.filters.section_name)}.docx`
        );
        toast.success(res.message);
      }
    } catch (error) {
      previewWindow?.close();
      console.error("Failed to export attainment:", error);
      toast.error(exportType === 'pdf' ? "PDF preview could not be generated. Please check the console." : "DOC export could not be generated. Please check the console.");
    } finally {
      setActionLoading(false);
    }
  }, [attainmentData, filters, hasRequiredFilters]);

  return {
    curriculums,
    terms,
    courses,
    sections,
    occasions,
    filters,
    attainmentData,
    assessmentDetails,
    drilldownDetails,
    selectionContext,
    hasRequiredFilters,
    loading,
    calculationLoading,
    actionLoading,
    handleFilterChange,
    calculateAttainment,
    loadAssessmentDetails,
    closeAssessmentDetails,
    loadDrilldownDetails,
    closeDrilldownDetails,
    finalizeAttainment,
    exportAttainment,
  };
};

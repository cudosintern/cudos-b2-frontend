import { useState, useEffect, useCallback } from 'react';
import { ciaAttainmentApi } from './ciaAttainmentApi';
import { DropdownOption, CiaAttainmentFilters, CalculateAttainmentPayload, AttainmentData } from './ciaAttainmentTypes';
import { toast } from 'react-toastify';

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
  const [loading, setLoading] = useState(false);
  const [calculationLoading, setCalculationLoading] = useState(false);

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

  return {
    curriculums,
    terms,
    courses,
    sections,
    occasions,
    filters,
    attainmentData,
    loading,
    calculationLoading,
    handleFilterChange,
    calculateAttainment,
  };
};
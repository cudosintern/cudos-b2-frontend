// hooks/useMTEAtainment.ts
import { useState, useCallback } from 'react';
import {
    Curriculum,
    Term,
    Course,
    Occasion,
    AttainmentLevel,
    CalculateResponse,
    FinalizedRow,
    CalculatePayload,
} from '../types/mteAttainment.types';
import { mteAttainmentApi } from '../services/mteAttainmentApi';

interface UseMTEAtainmentReturn {
    // State
    curricula: Curriculum[];
    terms: Term[];
    courses: Course[];
    occasions: Occasion[];
    selectedCurriculum: Curriculum | null;
    selectedTerm: Term | null;
    selectedCourse: Course | null;
    selectedOccasionIds: number[];
    attainmentLevels: AttainmentLevel[];
    calculatedData: CalculateResponse | null;
    finalizedData: FinalizedRow[];
    isLoading: boolean;
    error: string | null;
    // Actions
    loadCurricula: () => Promise<void>;
    loadTerms: (curriculumId: number) => Promise<void>;
    loadCourses: (termId: number) => Promise<void>;
    loadOccasions: (courseId: number) => Promise<void>;
    loadFinalized: (curriculumId: number, termId: number, courseId: number) => Promise<void>;
    loadAttainmentLevels: (courseId: number) => Promise<void>;
    calculateAttainment: (payload: CalculatePayload) => Promise<void>;
    finalizeAttainment: (payload: CalculatePayload) => Promise<void>;
    setSelectedCurriculum: (curriculum: Curriculum | null) => void;
    setSelectedTerm: (term: Term | null) => void;
    setSelectedCourse: (course: Course | null) => void;
    setSelectedOccasionIds: (ids: number[]) => void;
    clearCalculated: () => void;
}

export const useMTEAtainment = (): UseMTEAtainmentReturn => {
    const [curricula, setCurricula] = useState<Curriculum[]>([]);
    const [terms, setTerms] = useState<Term[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [occasions, setOccasions] = useState<Occasion[]>([]);
    const [selectedCurriculum, setSelectedCurriculum] = useState<Curriculum | null>(null);
    const [selectedTerm, setSelectedTerm] = useState<Term | null>(null);
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [selectedOccasionIds, setSelectedOccasionIds] = useState<number[]>([]);
    const [attainmentLevels, setAttainmentLevels] = useState<AttainmentLevel[]>([]);
    const [calculatedData, setCalculatedData] = useState<CalculateResponse | null>(null);
    const [finalizedData, setFinalizedData] = useState<FinalizedRow[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const loadCurricula = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await mteAttainmentApi.getCurricula();
            setCurricula(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load curricula');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const loadTerms = useCallback(async (curriculumId: number) => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await mteAttainmentApi.getTerms(curriculumId);
            setTerms(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load terms');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const loadCourses = useCallback(async (termId: number) => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await mteAttainmentApi.getCourses(termId);
            setCourses(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load courses');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const loadOccasions = useCallback(async (courseId: number) => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await mteAttainmentApi.getOccasions(courseId);
            setOccasions(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load occasions');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const loadFinalized = useCallback(async (curriculumId: number, termId: number, courseId: number) => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await mteAttainmentApi.getFinalized(curriculumId, termId, courseId);
            setFinalizedData(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load finalized data');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const loadAttainmentLevels = useCallback(async (courseId: number) => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await mteAttainmentApi.getCourseLevels(courseId);
            setAttainmentLevels(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load attainment levels');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const calculateAttainment = useCallback(async (payload: CalculatePayload) => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await mteAttainmentApi.calculate(payload);
            setCalculatedData(data);
        } catch (err: any) {
            setError(err.message || 'Calculation failed');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const finalizeAttainment = useCallback(async (payload: CalculatePayload) => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await mteAttainmentApi.finalize(payload);
            if (result.success) {
                await loadFinalized(payload.curriculum_id, payload.term_id, payload.course_id);
            } else {
                setError(result.message || 'Finalization failed');
            }
        } catch (err: any) {
            setError(err.message || 'Finalization failed');
        } finally {
            setIsLoading(false);
        }
    }, [loadFinalized]);

    const clearCalculated = useCallback(() => {
        setCalculatedData(null);
    }, []);

    return {
        curricula,
        terms,
        courses,
        occasions,
        selectedCurriculum,
        selectedTerm,
        selectedCourse,
        selectedOccasionIds,
        attainmentLevels,
        calculatedData,
        finalizedData,
        isLoading,
        error,
        loadCurricula,
        loadTerms,
        loadCourses,
        loadOccasions,
        loadFinalized,
        loadAttainmentLevels,
        calculateAttainment,
        finalizeAttainment,
        setSelectedCurriculum,
        setSelectedTerm,
        setSelectedCourse,
        setSelectedOccasionIds,
        clearCalculated,
    };
};
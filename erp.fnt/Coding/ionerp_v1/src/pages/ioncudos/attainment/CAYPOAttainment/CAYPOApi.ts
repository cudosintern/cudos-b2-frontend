// ================= TYPES =================
export interface School {
    dept_id: number;
    dept_name: string;
}

export interface Program {
    pgm_id: number;
    pgm_title: string;
}

export interface AcademicYear {
    academic_batch_id: number;
    academic_batch_code: string;
    academic_batch_desc?: string;
}

export interface CAYPOAttainmentRow {
    po_code: string;
    series_name: string;
    threshold_pct: number | null;
    method1_pct: number | null; // Threshold method
    level1: number | null;
    method2_pct: number | null; // Weighted Average method
    level2: number | null;
    method3_pct: number | null; // Relative Weighted Average method
    level3: number | null;
}

// ================= MOCK DATA HIERARCHY =================

const mockSchools: School[] = [
    { dept_id: 1, dept_name: 'School of Engineering & Technology' },
    { dept_id: 2, dept_name: 'School of Computer Applications' },
    { dept_id: 3, dept_name: 'School of Business Studies' }
];

const mockPrograms: { [key: number]: Program[] } = {
    1: [
        { pgm_id: 11, pgm_title: 'B.E. in Computer Science & Engineering' },
        { pgm_id: 12, pgm_title: 'B.E. in Electronics & Communication Engineering' }
    ],
    2: [
        { pgm_id: 21, pgm_title: 'Master of Computer Applications (M.C.A.)' },
        { pgm_id: 22, pgm_title: 'Bachelor of Computer Applications (B.C.A.)' }
    ],
    3: [
        { pgm_id: 31, pgm_title: 'Master of Business Administration (M.B.A.)' },
        { pgm_id: 32, pgm_title: 'Bachelor of Business Administration (B.B.A.)' }
    ]
};

// Generate 5 academic years per program dynamically
const generateAcademicYears = (pgmId: number): AcademicYear[] => {
    return [
        { academic_batch_id: pgmId * 10 + 1, academic_batch_code: '2021-2025', academic_batch_desc: 'Batch 2021' },
        { academic_batch_id: pgmId * 10 + 2, academic_batch_code: '2022-2026', academic_batch_desc: 'Batch 2022' },
        { academic_batch_id: pgmId * 10 + 3, academic_batch_code: '2023-2027', academic_batch_desc: 'Batch 2023' },
        { academic_batch_id: pgmId * 10 + 4, academic_batch_code: '2024-2025', academic_batch_desc: 'Batch 2024' },
        { academic_batch_id: pgmId * 10 + 5, academic_batch_code: '2025-2029', academic_batch_desc: 'Batch 2025' }
    ];
};

// Base Mock Attainment data (specifically for B.E. CSE 2024-2025)
// Values match the reference images exactly
const baseAttainmentData: CAYPOAttainmentRow[] = [
    // --- Series 1: BE in Test 2021-2025(1 - Semester,2 - Semester) ---
    {
        po_code: 'PO1',
        series_name: 'BE in Test 2021-2025(1 - Semester,2 - Semester)',
        threshold_pct: 50,
        method1_pct: 77.50,
        level1: 3.00,
        method2_pct: 77.50,
        level2: 3.00,
        method3_pct: 77.50,
        level3: 3.00
    },
    {
        po_code: 'PO2',
        series_name: 'BE in Test 2021-2025(1 - Semester,2 - Semester)',
        threshold_pct: 50,
        method1_pct: 75.00,
        level1: 2.75,
        method2_pct: 45.00,
        level2: 1.65,
        method3_pct: 45.00,
        level3: 1.65
    },
    {
        po_code: 'PO3',
        series_name: 'BE in Test 2021-2025(1 - Semester,2 - Semester)',
        threshold_pct: 50,
        method1_pct: 70.84,
        level1: 2.75,
        method2_pct: 28.34,
        level2: 1.10,
        method3_pct: 28.34,
        level3: 1.10
    },
    {
        po_code: 'PO4',
        series_name: 'BE in Test 2021-2025(1 - Semester,2 - Semester)',
        threshold_pct: 50,
        method1_pct: 63.75,
        level1: 1.75,
        method2_pct: 63.75,
        level2: 1.75,
        method3_pct: 63.75,
        level3: 1.75
    },
    {
        po_code: 'PO5',
        series_name: 'BE in Test 2021-2025(1 - Semester,2 - Semester)',
        threshold_pct: 50,
        method1_pct: 62.50,
        level1: 1.75,
        method2_pct: 37.50,
        level2: 1.05,
        method3_pct: 37.50,
        level3: 1.05
    },
    {
        po_code: 'PO6',
        series_name: 'BE in Test 2021-2025(1 - Semester,2 - Semester)',
        threshold_pct: null,
        method1_pct: null,
        level1: null,
        method2_pct: null,
        level2: null,
        method3_pct: null,
        level3: null
    },

    // --- Series 2: BE in Test 2020-2024(3 - Semester,4 - Semester) ---
    {
        po_code: 'PO1',
        series_name: 'BE in Test 2020-2024(3 - Semester,4 - Semester)',
        threshold_pct: 50,
        method1_pct: 66.12,
        level1: 2.17,
        method2_pct: 66.12,
        level2: 2.17,
        method3_pct: 66.12,
        level3: 2.17
    },
    {
        po_code: 'PO2',
        series_name: 'BE in Test 2020-2024(3 - Semester,4 - Semester)',
        threshold_pct: 50,
        method1_pct: 63.62,
        level1: 2.17,
        method2_pct: 48.17,
        level2: 1.61,
        method3_pct: 48.17,
        level3: 1.61
    },
    {
        po_code: 'PO3',
        series_name: 'BE in Test 2020-2024(3 - Semester,4 - Semester)',
        threshold_pct: 50,
        method1_pct: 78.25,
        level1: 2.80,
        method2_pct: 31.30,
        level2: 1.12,
        method3_pct: 31.30,
        level3: 1.12
    },
    {
        po_code: 'PO4',
        series_name: 'BE in Test 2020-2024(3 - Semester,4 - Semester)',
        threshold_pct: 50,
        method1_pct: 78.25,
        level1: 2.80,
        method2_pct: 46.95,
        level2: 1.68,
        method3_pct: 46.95,
        level3: 1.68
    },
    {
        po_code: 'PO5',
        series_name: 'BE in Test 2020-2024(3 - Semester,4 - Semester)',
        threshold_pct: 50,
        method1_pct: 79.50,
        level1: 2.80,
        method2_pct: 79.50,
        level2: 2.80,
        method3_pct: 79.50,
        level3: 2.80
    },
    {
        po_code: 'PO6',
        series_name: 'BE in Test 2020-2024(3 - Semester,4 - Semester)',
        threshold_pct: null,
        method1_pct: null,
        level1: null,
        method2_pct: null,
        level2: null,
        method3_pct: null,
        level3: null
    }
];

// Helper to scale percentages and levels to simulate dynamic year-specific changes
const clamp = (val: number, min: number, max: number): number => {
    return Math.min(Math.max(val, min), max);
};

const clampLevel = (val: number): number => {
    return Number(Math.min(Math.max(val, 0), 3).toFixed(2));
};

// ================= API SIMULATION =================

export const getSchools = async (): Promise<School[]> => {
    return mockSchools;
};

export const getPrograms = async (deptId: number): Promise<Program[]> => {
    return mockPrograms[deptId] || [];
};

export const getAcademicYears = async (pgmId: number): Promise<AcademicYear[]> => {
    return generateAcademicYears(pgmId);
};

export const fetchCAYPOAttainment = async (
    schoolId: number,
    programId: number,
    academicYearId: number
): Promise<CAYPOAttainmentRow[]> => {
    // Generate distinct data dynamically based on academicYearId to make it year-specific
    const yearCode = academicYearId % 10; // returns 1, 2, 3, 4, 5
    
    // For academic year ending in 3 (which is 2023-2027): return EXACT base dataset (Method2 and Method3 are identical)
    if (yearCode === 3) {
        return baseAttainmentData;
    }
    
    // Scale factor based on selected year (ranges from 0.75 to 1.15)
    const factor = 0.65 + (yearCode * 0.1); 

    return baseAttainmentData.map((row) => {
        if (row.po_code === 'PO6') {
            return { ...row }; // keep nulls for PO6
        }

        return {
            ...row,
            // Scale and clamp values dynamically to produce unique combinations per year.
            // For other years we also apply different offsets so all 3 graphs look unique.
            method1_pct: Number(clamp((row.method1_pct || 0) * factor, 10, 100).toFixed(2)),
            level1: clampLevel((row.level1 || 0) * factor),
            method2_pct: Number(clamp((row.method2_pct || 0) * factor * 0.95, 10, 100).toFixed(2)),
            level2: clampLevel((row.level2 || 0) * factor * 0.95),
            method3_pct: Number(clamp((row.method3_pct || 0) * factor * 1.05, 10, 100).toFixed(2)),
            level3: clampLevel((row.level3 || 0) * factor * 1.05)
        };
    });
};

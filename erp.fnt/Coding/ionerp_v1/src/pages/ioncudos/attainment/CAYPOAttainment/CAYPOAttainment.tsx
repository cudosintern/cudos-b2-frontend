import React, { useState, useEffect, useRef } from 'react';
import { HelpCircle, Book, ChevronDown, FileText, X } from 'lucide-react';
import { toast } from 'react-toastify';
import CAYPOWebHelpModal from './CAYPOWebHelpModal';
import {
    getSchools,
    getPrograms,
    getAcademicYears,
    fetchCAYPOAttainment,
    School,
    Program,
    AcademicYear,
    CAYPOAttainmentRow
} from './CAYPOApi';
import CAYPOTable from './CAYPOTable';
import CAYPOChart from './CAYPOChart';

const CAYPOAttainmentPage: React.FC = () => {
    // ----- Filter States -----
    const [schools, setSchools] = useState<School[]>([]);
    const [programs, setPrograms] = useState<Program[]>([]);
    const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);

    const [selectedSchool, setSelectedSchool] = useState<number | null>(null);
    const [selectedProgram, setSelectedProgram] = useState<number | null>(null);
    const [selectedYear, setSelectedYear] = useState<number | null>(null);

    const [attainmentData, setAttainmentData] = useState<CAYPOAttainmentRow[]>([]);

    // ----- UI States -----
    const [exporting, setExporting] = useState<boolean>(false);
    const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
    const [isHelpModalOpen, setIsHelpModalOpen] = useState<boolean>(false);

    const exportDropdownRef = useRef<HTMLDivElement>(null);

    // ----- Load Schools on Mount -----
    useEffect(() => {
        const loadSchools = async () => {
            try {
                const data = await getSchools();
                setSchools(data);
            } catch (err) {
                console.error('Failed to load schools:', err);
                toast.error('Failed to load school filter list.');
            }
        };
        loadSchools();
    }, []);

    // ----- Handle Click Outside for Export Dropdown -----
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target as Node)) {
                setIsExportOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // ----- Event Handlers -----
    const handleSchoolChange = async (schoolId: number | null) => {
        setSelectedSchool(schoolId);
        setSelectedProgram(null);
        setSelectedYear(null);
        setPrograms([]);
        setAcademicYears([]);

        if (schoolId) {
            try {
                const data = await getPrograms(schoolId);
                setPrograms(data);
            } catch (err) {
                console.error('Failed to load programs:', err);
                toast.error('Failed to load program filter options.');
            }
        }
    };

    const handleProgramChange = async (programId: number | null) => {
        setSelectedProgram(programId);
        setSelectedYear(null);
        setAcademicYears([]);

        if (programId) {
            try {
                const data = await getAcademicYears(programId);
                setAcademicYears(data);
            } catch (err) {
                console.error('Failed to load academic years:', err);
                toast.error('Failed to load academic year filter options.');
            }
        }
    };

    // ----- Load Attainment Data -----
    useEffect(() => {
        const loadAttainment = async () => {
            if (selectedSchool && selectedProgram && selectedYear) {
                try {
                    const data = await fetchCAYPOAttainment(selectedSchool, selectedProgram, selectedYear);
                    setAttainmentData(data);
                } catch (err) {
                    console.error('Failed to load attainment:', err);
                    setAttainmentData([]);
                }
            } else {
                setAttainmentData([]);
            }
        };
        loadAttainment();
    }, [selectedSchool, selectedProgram, selectedYear]);

    const handleExport = (format: 'pdf' | 'docx') => {
        setIsExportOpen(false);
        setExporting(true);
        setTimeout(() => {
            setExporting(false);
            toast.success(`CAY PO Attainment Report (${format === 'pdf' ? '.pdf' : '.doc'}) exported successfully!`);
        }, 1000);
    };

    const isReady = selectedSchool !== null && selectedProgram !== null && selectedYear !== null;

    return (
        <div className="w-full font-['Inter'] p-8 max-w-full mx-auto mt-4 min-h-screen text-left">
            {/* Page Header */}
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-[#4a8494]">
                    Current Academic Year(CAY) PO Attainment
                </h3>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsHelpModalOpen(true)}
                        className="p-1.5 rounded-full hover:bg-gray-100 text-[#4a8494] transition-colors flex items-center justify-center"
                        title="Web Help"
                    >
                        <HelpCircle size={18} />
                    </button>
                </div>
            </div>

            {/* CARD: Filters & Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 text-left">
                {/* Selectors Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    {/* School Dropdown */}
                    <div className="w-full">
                        <label className="block text-sm font-semibold text-gray-700 mb-1 text-left">
                            School <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={selectedSchool || ''}
                            onChange={(e) => handleSchoolChange(e.target.value ? Number(e.target.value) : null)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white h-[38px]"
                        >
                            <option value="">Select School</option>
                            {schools.map((s) => (
                                <option key={s.dept_id} value={s.dept_id}>
                                    {s.dept_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Program Dropdown */}
                    <div className="w-full">
                        <label className="block text-sm font-semibold text-gray-700 mb-1 text-left">
                            Program <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={selectedProgram || ''}
                            onChange={(e) => handleProgramChange(e.target.value ? Number(e.target.value) : null)}
                            disabled={!selectedSchool}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white h-[38px] disabled:bg-gray-100 disabled:cursor-not-allowed"
                        >
                            <option value="">Select Program</option>
                            {programs.map((p) => (
                                <option key={p.pgm_id} value={p.pgm_id}>
                                    {p.pgm_title}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Academic Year Dropdown */}
                    <div className="w-full">
                        <label className="block text-sm font-semibold text-gray-700 mb-1 text-left">
                            Academic Year <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={selectedYear || ''}
                            onChange={(e) => setSelectedYear(e.target.value ? Number(e.target.value) : null)}
                            disabled={!selectedProgram}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white h-[38px] disabled:bg-gray-100 disabled:cursor-not-allowed"
                        >
                            <option value="">Select Year</option>
                            {academicYears.map((y) => (
                                <option key={y.academic_batch_id} value={y.academic_batch_id}>
                                    {y.academic_batch_code}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Export Dropdown Button Row (positioned lower matching reference design) */}
                <div className="flex justify-end mt-4">
                    <div className="relative" ref={exportDropdownRef}>
                        <button
                            type="button"
                            onClick={() => setIsExportOpen(!isExportOpen)}
                            disabled={!isReady || exporting}
                            className={`inline-flex items-center gap-2 px-5 py-2 rounded-md font-semibold transition h-[38px] ${
                                !isReady || exporting
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-[#4a8494] text-white hover:bg-[#3a6a77] focus:outline-none focus:ring-2 focus:ring-[#4a8494] focus:ring-offset-2 active:scale-95 shadow-sm'
                            }`}
                        >
                            <Book size={18} />
                            <span>{exporting ? 'Exporting...' : 'Export'}</span>
                            <ChevronDown size={16} className={`transition-transform duration-200 ${isExportOpen ? 'transform rotate-180' : ''}`} />
                        </button>

                        {isExportOpen && (
                            <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 focus:outline-none">
                                <div className="py-1" role="menu" aria-orientation="vertical">
                                    <button
                                        type="button"
                                        onClick={() => handleExport('pdf')}
                                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 flex items-center gap-2 transition"
                                        role="menuitem"
                                    >
                                        <FileText className="text-red-500" size={16} />
                                        <span>.pdf</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleExport('docx')}
                                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 flex items-center gap-2 transition"
                                        role="menuitem"
                                    >
                                        <FileText className="text-blue-500" size={16} />
                                        <span>.doc</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Visualizations Container (combined into a single card: charts first, table below) */}
            {isReady && (
                attainmentData.length > 0 ? (
                    <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-8">
                        {/* Three graphs at the top */}
                        <CAYPOChart data={attainmentData} />

                        {/* Divider */}
                        <div className="border-t border-gray-200 pt-6">
                            {/* Data table below the graphs */}
                            <CAYPOTable data={attainmentData} />
                        </div>
                    </div>
                ) : (
                    <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-5 text-center text-amber-800 text-sm shadow-sm leading-relaxed">
                        No CAY PO attainment data found for this selection.<br />
                        Please select <strong>School of Engineering & Technology</strong> &rarr;{' '}
                        <strong>B.E. in Computer Science & Engineering</strong> &rarr;{' '}
                        <strong>2023-2027</strong> to view mock attainment data.
                    </div>
                )
            )}

            {/* Help Support Modal */}
            <CAYPOWebHelpModal
                open={isHelpModalOpen}
                onClose={() => setIsHelpModalOpen(false)}
            />
        </div>
    );
};

export default CAYPOAttainmentPage;

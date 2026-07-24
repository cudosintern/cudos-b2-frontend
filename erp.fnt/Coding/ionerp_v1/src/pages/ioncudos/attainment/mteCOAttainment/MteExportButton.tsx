import React, { useState, useRef, useEffect } from 'react';
import { saveAs } from 'file-saver';
import { exportReportNew } from './MteCoApi';
import { ChevronDown, FileText, Book } from 'lucide-react';

interface Props {
    curriculumId: number | null;
    termId: number | null;
    courseId: number | null;
    courseCode?: string;
    sectionId?: number | null;
    occasionIds: number[];
    disabled: boolean;
}

const MteExportButton: React.FC<Props> = ({
    curriculumId,
    termId,
    courseId,
    courseCode = '',
    sectionId,
    occasionIds,
    disabled,
}) => {
    const [exporting, setExporting] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Do not render the button if any essential selection is missing
    if (!curriculumId || !termId || !courseId || occasionIds.length === 0) {
        return null;
    }

    const handleExport = async (format: 'pdf' | 'docx') => {
        setIsOpen(false);
        setExporting(true);

        try {
            const blob = await exportReportNew({
                curriculum_id: curriculumId,
                term_id: termId,
                course_id: courseId,
                selected_occasion_ids: occasionIds,
                section_id: sectionId ?? null,
                format: format,
            });

            if (format === 'pdf') {
                const url = window.URL.createObjectURL(blob);
                window.open(url, '_blank');
            } else {
                const suffix = courseCode || String(courseId);
                saveAs(blob, `MTE_CO_Attainment_Report_${suffix}.docx`);
            }
        } catch (error) {
            console.error(`${format.toUpperCase()} generation error:`, error);
            alert(`Failed to generate ${format.toUpperCase()} report. Please try again.`);
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="relative inline-block text-left" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                disabled={disabled || exporting}
                className={`inline-flex items-center gap-2 px-5 py-2 rounded-md font-semibold transition ${disabled || exporting
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-[#4a8494] text-white hover:bg-[#3a6a77] focus:outline-none focus:ring-2 focus:ring-[#4a8494] focus:ring-offset-2'
                    }`}
            >
                <Book size={18} />
                <span>{exporting ? 'Exporting...' : 'Export'}</span>
                <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} />
            </button>

            {isOpen && (
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
    );
};

export default MteExportButton;

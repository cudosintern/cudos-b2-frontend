// src/pages/ioncudos/attainment/consolidatedPOAttainment/ConsolidatedPOAttainment.tsx

import React, { useState, useEffect, useRef } from 'react';
import { HelpCircle, FileText, ChevronDown, Book } from 'lucide-react';
import { toast } from 'react-toastify';
import ConsolidatedPOSelectors from './ConsolidatedPOSelectors';
import ConsolidatedPOChart from './ConsolidatedPOChart';
import ConsolidatedPOTable from './ConsolidatedPOTable';
import ConsolidatedPOWebHelpModal from './ConsolidatedPOWebHelpModal';
import ConsolidatedPODrilldownModal from './ConsolidatedPODrilldownModal';
import ConsolidatedPOPerformanceLevelsModal from './ConsolidatedPOPerformanceLevelsModal';
import {
    fetchCurricula,
    fetchTermsForCurriculum,
    fetchFirstYearCurricula,
    fetchPOAttainment,
    exportDirectReport,
    Curriculum,
    Term,
    FirstYearCurriculum,
    POConsolidatedAttainmentData
} from './ConsolidatedPOApi';

const ConsolidatedPOAttainment: React.FC = () => {
    // ----- State Definitions -----
    const [curricula, setCurricula] = useState<Curriculum[]>([]);
    const [availableTerms, setAvailableTerms] = useState<Term[]>([]);
    const [firstYearCurricula, setFirstYearCurricula] = useState<FirstYearCurriculum[]>([]);

    const [selectedCurriculum, setSelectedCurriculum] = useState<number | null>(null);
    const [selectedTerms, setSelectedTerms] = useState<number[]>([]);
    const [selectedFirstYearCurriculum, setSelectedFirstYearCurriculum] = useState<number | null>(null);

    const [hasFirstYearDependency, setHasFirstYearDependency] = useState<boolean>(false);
    const [attainmentData, setAttainmentData] = useState<POConsolidatedAttainmentData[]>([]);
    const [enabledMethods, setEnabledMethods] = useState<any[]>([]);
    const [exporting, setExporting] = useState<boolean>(false);
    const [showExportMenu, setShowExportMenu] = useState<boolean>(false);
    const exportMenuRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
                setShowExportMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);
    
    // UI Panels / Modals
    const [activeTab, setActiveTab] = useState<'direct'>('direct');
    const [isHelpModalOpen, setIsHelpModalOpen] = useState<boolean>(false);

    // Lifted Modal States
    const [isDrilldownOpen, setIsDrilldownOpen] = useState(false);
    const [isPerfModalOpen, setIsPerfModalOpen] = useState(false);
    const [selectedPoId, setSelectedPoId] = useState<number | null>(null);
    const [selectedPoCode, setSelectedPoCode] = useState('');
    const [selectedPoStatement, setSelectedPoStatement] = useState('');
    const [selectedMethod, setSelectedMethod] = useState<'threshold' | 'weighted' | 'relative'>('threshold');
    const [selectedStatus, setSelectedStatus] = useState('');

    const handleDrilldownClick = (
        poId: number, 
        poCode: string, 
        method: 'threshold' | 'weighted' | 'relative',
        poStatement: string
    ) => {
        setSelectedPoId(poId);
        setSelectedPoCode(poCode);
        setSelectedPoStatement(poStatement);
        setSelectedMethod(method);
        setIsDrilldownOpen(true);
    };

    const handleStatusClick = (
        poId: number, 
        poCode: string, 
        status: string,
        poStatement: string
    ) => {
        setSelectedPoId(poId);
        setSelectedPoCode(poCode);
        setSelectedPoStatement(poStatement);
        setSelectedStatus(status);
        setIsPerfModalOpen(true);
    };

    // ----- Load Curricula on Mount -----
    useEffect(() => {
        const loadCurricula = async () => {
            try {
                const data = await fetchCurricula();
                setCurricula(data);
            } catch (err) {
                console.error("Failed to load curricula:", err);
                toast.error("Failed to load curricula filter list.");
            }
        };
        loadCurricula();
    }, []);

    // ----- Event Handlers -----
    const handleCurriculumChange = async (id: number | null) => {
        setSelectedCurriculum(id);
        setSelectedTerms([]);
        setSelectedFirstYearCurriculum(null);
        setAvailableTerms([]);
        setFirstYearCurricula([]);
        setAttainmentData([]);
        setEnabledMethods([]);
        setHasFirstYearDependency(false);
        setError('');

        if (id) {
            try {
                // Fetch first-year dependency dynamically from backend
                const fyCurricula = await fetchFirstYearCurricula(id);
                if (fyCurricula && fyCurricula.length > 0) {
                    setHasFirstYearDependency(true);
                    setFirstYearCurricula(fyCurricula);
                } else {
                    setHasFirstYearDependency(false);
                    // For standard Curriculum (no dependency), load terms directly.
                    const terms = await fetchTermsForCurriculum(id, null);
                    setAvailableTerms(terms);
                }
            } catch (err) {
                console.error("Failed to load filter dependencies:", err);
                toast.error("Failed to load selectors options.");
            }
        }
    };

    const handleTermsChange = (ids: number[]) => {
        setSelectedTerms(ids);
    };

    const handleFirstYearCurriculumChange = async (id: number | null) => {
        setSelectedFirstYearCurriculum(id);
        setSelectedTerms([]);
        setAvailableTerms([]);
        setAttainmentData([]);
        setEnabledMethods([]);
        setError('');

        if (id && selectedCurriculum) {
            try {
                // Fetch consolidated terms (branch + selected first year curriculum)
                const terms = await fetchTermsForCurriculum(selectedCurriculum, id);
                setAvailableTerms(terms);
            } catch (err) {
                console.error("Failed to load terms for first year curriculum:", err);
                toast.error("Failed to load term options.");
            }
        }
    };

    // Determine if all required filters are selected
    const isFirstYearSelected = hasFirstYearDependency;
    const isReady = selectedCurriculum !== null &&
                    selectedTerms.length > 0 &&
                    (!isFirstYearSelected || selectedFirstYearCurriculum !== null);

    // ----- Fetch Chart Data on Filters Selection -----
    useEffect(() => {
        if (isReady && selectedCurriculum !== null) {
            const loadAttainmentData = async () => {
                setLoading(true);
                setError('');
                try {
                    const res = await fetchPOAttainment(
                        selectedCurriculum,
                        selectedTerms,
                        selectedFirstYearCurriculum
                    );
                    setAttainmentData(res.rows);
                    setEnabledMethods(res.enabledMethods);
                } catch (err: any) {
                    console.error("Failed to load PO attainment data:", err);
                    setError(err.message || "Failed to load PO attainment chart data.");
                } finally {
                    setLoading(false);
                }
            };
            loadAttainmentData();
        } else {
            setAttainmentData([]);
            setEnabledMethods([]);
            setError('');
        }
    }, [isReady, selectedCurriculum, selectedTerms, selectedFirstYearCurriculum]);

    // ----- Export Functionality -----
    const handleExport = async (format: 'pdf' | 'docx') => {
        if (!isReady || selectedCurriculum === null) return;
        setExporting(true);
        setShowExportMenu(false);
        try {
            const canvas = document.getElementById("consolidated-po-chart-canvas") as HTMLCanvasElement | null;
            const chartImage = canvas ? canvas.toDataURL('image/png') : null;

            const activeTabLabel = activeTab === 'direct' ? 'Direct Attainment' : activeTab;
            const baseFileName = activeTabLabel.toLowerCase().replace(/\s+/g, '_');
            const downloadFileName = `${baseFileName}.${format}`;

            toast.info(`Generating ${format.toUpperCase()} report...`);
            const blob = await exportDirectReport(
                selectedCurriculum,
                selectedTerms,
                selectedFirstYearCurriculum,
                chartImage,
                format,
                activeTabLabel
            );
            const url = window.URL.createObjectURL(blob);
            if (format === 'pdf') {
                window.open(url, '_blank');
                toast.success(`${activeTabLabel} Report opened in a new tab.`);
            } else {
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', downloadFileName);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
                toast.success(`${activeTabLabel} Report exported as ${format.toUpperCase()} successfully!`);
            }
        } catch (err) {
            console.error(`Failed to export ${format.toUpperCase()}:`, err);
            toast.error("Failed to export report.");
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="w-full font-['Inter'] p-8 max-w-full mx-auto mt-4 min-h-screen text-left">
            {/* Page Title outside the card */}
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-[#4a8494]">
                    Consolidated Program Outcome (PO) Attainment (CCE & SEE)
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

            {/* CARD: Filters & Content */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                {/* Selector Fields */}
                <ConsolidatedPOSelectors
                    curricula={curricula}
                    availableTerms={availableTerms}
                    firstYearCurricula={firstYearCurricula}
                    selectedCurriculum={selectedCurriculum}
                    selectedTerms={selectedTerms}
                    selectedFirstYearCurriculum={selectedFirstYearCurriculum}
                    onCurriculumChange={handleCurriculumChange}
                    onTermsChange={handleTermsChange}
                    onFirstYearCurriculumChange={handleFirstYearCurriculumChange}
                />

                {/* Tab Bar and Export Button */}
                <div className="flex justify-between items-center border-b border-gray-200 mb-6 mt-4 text-left bg-white">
                    <div className="flex">
                        <button
                            onClick={() => setActiveTab('direct')}
                            className={`px-5 py-2.5 font-bold text-sm border-b-2 transition-all duration-200 ${
                                activeTab === 'direct'
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Direct Attainment
                        </button>
                    </div>

                    {/* Export Dropdown Button */}
                    <div className="relative inline-block text-left" ref={exportMenuRef}>
                        <button
                            type="button"
                            onClick={() => setShowExportMenu(!showExportMenu)}
                            disabled={!isReady || exporting}
                            className={`inline-flex items-center gap-2 px-5 py-2 rounded-md font-semibold text-sm transition-all ${
                                !isReady || exporting
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-[#4a8494] text-white hover:bg-[#3a6a77] focus:outline-none focus:ring-2 focus:ring-[#4a8494] focus:ring-offset-2 shadow-sm'
                            }`}
                        >
                            <Book size={16} />
                            <span>{exporting ? 'Exporting...' : 'Export'}</span>
                            <ChevronDown size={14} className={`transition-transform duration-200 ${showExportMenu ? 'transform rotate-180' : ''}`} />
                        </button>

                        {showExportMenu && (
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
                                        <span>.docx</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Attainment Content Area */}
                <div className="mt-4">


                    {isReady && loading && attainmentData.length === 0 && (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 text-left mt-6">
                            <div className="text-gray-500 text-left">Loading...</div>
                        </div>
                    )}

                    {isReady && !loading && error && (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 text-left mt-6">
                            <div className="w-full p-8 text-center border border-dashed border-red-200 rounded-lg bg-red-50 text-red-700">
                                <p className="font-semibold text-lg">{error}</p>
                            </div>
                        </div>
                    )}

                    {isReady && !loading && attainmentData.length === 0 && !error && (
                        <div className="p-6 text-center bg-white border border-gray-200 shadow-sm rounded-lg min-h-[300px] flex flex-col justify-center items-center mt-6" role="alert">
                            <p className="text-red-600 font-semibold text-base max-w-2xl">
                                PO attainment can be viewed only after Course-Course Outcome attainment is finalized and courses are finalized.
                            </p>
                        </div>
                    )}

                    {isReady && attainmentData.length > 0 && !error ? (
                        <div className={`border border-gray-200 rounded-lg bg-white p-5 shadow-sm text-left mt-6 ${loading ? 'opacity-60 pointer-events-none' : ''} transition-opacity duration-200`}>
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-[#4a8494] text-left">Program Outcome (PO) Attainment</h3>
                                <HelpCircle onClick={() => setIsHelpModalOpen(true)} className="w-4.5 h-4.5 cursor-pointer text-[#4a8494] opacity-80 hover:opacity-100 transition-opacity" />
                            </div>
                            <div className="border border-gray-200 rounded-lg overflow-hidden bg-white p-2">
                                <ConsolidatedPOChart data={attainmentData} isFirstYear={isFirstYearSelected} enabledMethods={enabledMethods} onBarClick={handleDrilldownClick} />
                            </div>
                            <ConsolidatedPOTable 
                                data={attainmentData} 
                                isFirstYear={isFirstYearSelected}
                                enabledMethods={enabledMethods}
                                curriculumId={selectedCurriculum}
                                termIds={selectedTerms}
                                firstYearCurriculumId={selectedFirstYearCurriculum}
                                onDrilldownClick={handleDrilldownClick}
                                onStatusClick={handleStatusClick}
                            />
                        </div>
                    ) : null}
                </div>
            </div>

            {/* Support Help Modal */}
            <ConsolidatedPOWebHelpModal
                open={isHelpModalOpen}
                onClose={() => setIsHelpModalOpen(false)}
            />

            {/* Drilldown Modal */}
            <ConsolidatedPODrilldownModal
                open={isDrilldownOpen}
                onClose={() => setIsDrilldownOpen(false)}
                poCode={selectedPoCode}
                poStatement={selectedPoStatement}
                method={selectedMethod}
                curriculumId={selectedCurriculum}
                termIds={selectedTerms}
                firstYearCurriculumId={selectedFirstYearCurriculum}
                poId={selectedPoId}
            />

            {/* Performance Levels Modal */}
            <ConsolidatedPOPerformanceLevelsModal
                open={isPerfModalOpen}
                onClose={() => setIsPerfModalOpen(false)}
                poId={selectedPoId}
                poCode={selectedPoCode}
                poStatement={selectedPoStatement}
                status={selectedStatus}
            />
        </div>
    );
};

export default ConsolidatedPOAttainment;
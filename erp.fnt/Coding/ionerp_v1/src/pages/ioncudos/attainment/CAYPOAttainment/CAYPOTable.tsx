import React, { useState } from 'react';
import { CAYPOAttainmentRow } from './CAYPOApi';
import CAYPOPerformanceLevelsModal from './CAYPOPerformanceLevelsModal';
import CAYPODrilldownModal from './CAYPODrilldownModal';

interface Props {
    data: CAYPOAttainmentRow[];
}

const CAYPOTable: React.FC<Props> = ({ data }) => {
    // Group rows by series_name
    const seriesNames = Array.from(new Set(data.map((d) => d.series_name)));

    // Modal state
    const [isLevelModalOpen, setIsLevelModalOpen] = useState(false);
    const [isDrilldownOpen, setIsDrilldownOpen] = useState(false);
    const [selectedPoCode, setSelectedPoCode] = useState('');
    const [selectedSeriesName, setSelectedSeriesName] = useState('');
    const [selectedMethod, setSelectedMethod] = useState<'threshold' | 'weighted' | 'relative'>('threshold');
    const [selectedClickedPct, setSelectedClickedPct] = useState(0);

    const handleMethodClick = (
        poCode: string,
        seriesName: string,
        method: 'threshold' | 'weighted' | 'relative',
        value: number | null
    ) => {
        if (value !== null) {
            setSelectedPoCode(poCode);
            setSelectedSeriesName(seriesName);
            setSelectedMethod(method);
            setSelectedClickedPct(value);
            setIsDrilldownOpen(true);
        }
    };

    const handleLevelClick = (poCode: string, seriesName: string) => {
        setSelectedPoCode(poCode);
        setSelectedSeriesName(seriesName);
        setIsLevelModalOpen(true);
    };

    return (
        <div className="space-y-6">
            {/* Side-by-Side Tables Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {seriesNames.map((seriesName) => {
                    const seriesRows = data
                        .filter((d) => d.series_name === seriesName)
                        .sort((a, b) => {
                            const numA = parseInt(a.po_code.replace('PO', ''), 10);
                            const numB = parseInt(b.po_code.replace('PO', ''), 10);
                            return numA - numB;
                        });

                    return (
                        <div key={seriesName} className="border border-slate-300 rounded-md overflow-hidden bg-white shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left border-collapse">
                                    <thead>
                                        {/* Main Series Header */}
                                        <tr className="bg-slate-100 border-b border-slate-300">
                                            <th colSpan={8} className="px-3 py-2 text-left text-xs font-bold text-slate-700 uppercase tracking-wider pl-3">
                                                {seriesName}
                                            </th>
                                        </tr>
                                        {/* Columns Subheader */}
                                        <tr className="bg-slate-50 text-[10px] text-slate-600 uppercase font-bold border-b border-slate-300">
                                            <th className="px-2 py-2 border-r border-slate-200 text-left pl-3 w-12">PO</th>
                                            <th className="px-2 py-2 border-r border-slate-200 text-left pl-3">Threshold</th>
                                            <th className="px-2 py-2 border-r border-slate-200 text-left pl-3">Method1</th>
                                            <th className="px-2 py-2 border-r border-slate-200 text-left pl-3">Level1</th>
                                            <th className="px-2 py-2 border-r border-slate-200 text-left pl-3">Method2</th>
                                            <th className="px-2 py-2 border-r border-slate-200 text-left pl-3">Level2</th>
                                            <th className="px-2 py-2 border-r border-slate-200 text-left pl-3">Method3</th>
                                            <th className="px-2 py-2 text-left pl-3">Level3</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {seriesRows.map((row) => {
                                            const isPO6 = row.po_code === 'PO6';
                                            return (
                                                <tr key={row.po_code} className="hover:bg-slate-50 transition-colors text-[12px] h-9">
                                                    <td className="px-2 py-1.5 border-r border-slate-200 text-left pl-3 font-bold text-slate-700">
                                                        {row.po_code}
                                                    </td>
                                                    <td className="px-2 py-1.5 border-r border-slate-100 text-left pl-3 text-slate-600">
                                                        {isPO6 || row.threshold_pct === null ? '-' : `${row.threshold_pct}%`}
                                                    </td>
                                                    <td className="px-2 py-1.5 border-r border-slate-100 text-left pl-3">
                                                        {isPO6 || row.method1_pct === null ? (
                                                            '-'
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleMethodClick(row.po_code, row.series_name, 'threshold', row.method1_pct)}
                                                                className="text-blue-600 hover:text-blue-800 hover:underline font-semibold focus:outline-none text-left"
                                                            >
                                                                {row.method1_pct.toFixed(2)}%
                                                            </button>
                                                        )}
                                                    </td>
                                                    <td className="px-2 py-1.5 border-r border-slate-100 text-left pl-3">
                                                        {isPO6 || row.level1 === null ? (
                                                            '-'
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleLevelClick(row.po_code, row.series_name)}
                                                                className="text-blue-600 hover:text-blue-800 hover:underline font-semibold focus:outline-none text-left"
                                                            >
                                                                {row.level1.toFixed(2)}
                                                            </button>
                                                        )}
                                                    </td>
                                                    <td className="px-2 py-1.5 border-r border-slate-100 text-left pl-3">
                                                        {isPO6 || row.method2_pct === null ? (
                                                            '-'
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleMethodClick(row.po_code, row.series_name, 'weighted', row.method2_pct)}
                                                                className="text-blue-600 hover:text-blue-800 hover:underline font-semibold focus:outline-none text-left"
                                                            >
                                                                {row.method2_pct.toFixed(2)}%
                                                            </button>
                                                        )}
                                                    </td>
                                                    <td className="px-2 py-1.5 border-r border-slate-100 text-left pl-3">
                                                        {isPO6 || row.level2 === null ? (
                                                            '-'
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleLevelClick(row.po_code, row.series_name)}
                                                                className="text-blue-600 hover:text-blue-800 hover:underline font-semibold focus:outline-none text-left"
                                                            >
                                                                {row.level2.toFixed(2)}
                                                            </button>
                                                        )}
                                                    </td>
                                                    <td className="px-2 py-1.5 border-r border-slate-100 text-left pl-3">
                                                        {isPO6 || row.method3_pct === null ? (
                                                            '-'
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleMethodClick(row.po_code, row.series_name, 'relative', row.method3_pct)}
                                                                className="text-blue-600 hover:text-blue-800 hover:underline font-semibold focus:outline-none text-left"
                                                            >
                                                                {row.method3_pct.toFixed(2)}%
                                                            </button>
                                                        )}
                                                    </td>
                                                    <td className="px-2 py-1.5 text-left pl-3">
                                                        {isPO6 || row.level3 === null ? (
                                                            '-'
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleLevelClick(row.po_code, row.series_name)}
                                                                className="text-blue-600 hover:text-blue-800 hover:underline font-semibold focus:outline-none text-left"
                                                            >
                                                                {row.level3.toFixed(2)}
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Formulas / Note Section */}
            <div className="p-4 border border-gray-200 bg-[#f8f8f6] rounded-lg text-[11px] text-left shadow-sm leading-relaxed mt-4">
                <div className="font-semibold text-gray-700 mb-2 border-b border-gray-200 pb-2">
                    <span className="font-bold text-gray-800">Note: </span>
                    The above bar graph depicts the overall class performance with respect to the Threshold % for Individual Program Outcomes ((POs)). The Attainment % for respective columns is calculated using the below formula.
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">
                    <div>
                        <div className="font-bold text-gray-800 mb-1">
                            Method1
                        </div>
                        <div className="text-gray-600">
                            For Attainment based on Threshold method % = Average of all the Course Outcomes(COs) Threshold based Attainment % mapped to the respective (PO) (as per the COs to (POs) mapping matrix).
                        </div>
                    </div>
                    <div>
                        <div className="font-bold text-gray-800 mb-1">
                            Method2
                        </div>
                        <div className="text-gray-600">
                            For Attainment based on Weighted Average Method % = Average of all the Course Outcomes(COs) Attainment % (Map Level Weighted Attainment %) mapped to the respective PO (as per the COs to POs mapping matrix).
                        </div>
                    </div>
                    <div>
                        <div className="font-bold text-gray-800 mb-1">
                            Method3
                        </div>
                        <div className="text-gray-600">
                            For Attainment based on Relative Weighted Average Method % = Sum of all the Course Outcomes(COs) Attainment % (Map Level Weighted * Mapped Value) / Sum of all Mapped Values of the respective (PO) (as per the COs to POs mapping matrix).
                        </div>
                    </div>
                </div>
            </div>

            {/* Performance Levels Details Modal */}
            {isLevelModalOpen && (
                <CAYPOPerformanceLevelsModal
                    open={isLevelModalOpen}
                    onClose={() => setIsLevelModalOpen(false)}
                    poCode={selectedPoCode}
                    seriesName={selectedSeriesName}
                />
            )}

            {/* Course Drilldown Details Modal */}
            {isDrilldownOpen && (
                <CAYPODrilldownModal
                    open={isDrilldownOpen}
                    onClose={() => setIsDrilldownOpen(false)}
                    poCode={selectedPoCode}
                    seriesName={selectedSeriesName}
                    method={selectedMethod}
                    clickedPct={selectedClickedPct}
                />
            )}
        </div>
    );
};

export default CAYPOTable;

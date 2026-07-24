// src/pages/ioncudos/attainment/consolidatedPOAttainment/ConsolidatedPOTable.tsx

import React from 'react';
import { POConsolidatedAttainmentData } from './ConsolidatedPOApi';

interface ConsolidatedPOTableProps {
    data: POConsolidatedAttainmentData[];
    isFirstYear?: boolean;
    enabledMethods?: any[];
    curriculumId: number | null;
    termIds: number[];
    firstYearCurriculumId: number | null;
    onDrilldownClick: (poId: number, poCode: string, method: 'threshold' | 'weighted' | 'relative', poStatement: string) => void;
    onStatusClick: (poId: number, poCode: string, status: string, poStatement: string) => void;
}

const ConsolidatedPOTable: React.FC<ConsolidatedPOTableProps> = ({ 
    data, 
    isFirstYear = false,
    enabledMethods = [],
    curriculumId,
    termIds,
    firstYearCurriculumId,
    onDrilldownClick,
    onStatusClick
}) => {
    // Modal controls are lifted to parent component ConsolidatedPOAttainment.tsx

    const showThreshold = enabledMethods.length === 0 || enabledMethods.some(m => m.id === 'threshold_method');
    const showWeighted = enabledMethods.length === 0 || enabledMethods.some(m => m.id === 'weighted_average');
    const showRelative = enabledMethods.length === 0 || enabledMethods.some(m => m.id === 'relative_weighted');

    return (
        <div className="space-y-6 mt-6">
            {/* Table Container */}
            <div className="border border-slate-300 rounded-md overflow-hidden bg-white shadow-sm">
                <div className="overflow-x-auto">
                    {isFirstYear ? (
                        <table className="w-full text-sm text-center border-collapse">
                            <thead className="bg-slate-100 text-[11px] text-slate-700 uppercase font-bold border-b border-slate-300">
                                <tr>
                                    <th className="px-3 py-3 border-r border-slate-200 text-center w-16">SI No.</th>
                                    <th className="px-3 py-3 border-r border-slate-200 text-center">PO Reference</th>
                                    <th className="px-3 py-3 text-center">Attainment based on Actual Secured Marks %</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {data.map((row, idx) => (
                                    <tr key={row.po_code} className="hover:bg-slate-50 transition-colors text-sm group">
                                        {/* SI No */}
                                        <td className="px-3 py-2.5 border-r border-slate-100 text-center text-slate-500 font-mono text-xs">
                                            {idx + 1}
                                        </td>
                                        
                                        {/* PO Reference */}
                                        <td className="px-3 py-2.5 border-r border-slate-100 text-center text-slate-700 font-bold">
                                            {row.po_code}
                                        </td>
                                        
                                        {/* Attainment based on Actual Secured Marks % */}
                                        <td className="px-3 py-2.5 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <span className="text-slate-800 font-medium">{row.avg_po_attainment.toFixed(2)} %</span>
                                                <button
                                                    type="button"
                                                    onClick={() => onDrilldownClick(row.po_id, row.po_code, 'threshold', row.po_statement)}
                                                    className="text-xs text-blue-600 hover:text-blue-800 underline cursor-pointer font-semibold mt-1"
                                                >
                                                    drill down
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <table className="w-full text-sm text-center border-collapse">
                            <thead className="bg-slate-100 text-[11px] text-slate-700 uppercase font-bold border-b border-slate-300">
                                <tr>
                                    <th className="px-3 py-3 border-r border-slate-200 text-center w-16">SI No.</th>
                                    <th className="px-3 py-3 border-r border-slate-200 text-center">PO Reference</th>
                                    {showThreshold && (
                                        <>
                                            <th className="px-3 py-3 border-r border-slate-200 text-center">Attainment based on Threshold method %</th>
                                            <th className="px-3 py-3 border-r border-slate-200 text-center w-32">Attainment Level</th>
                                        </>
                                    )}
                                    {showWeighted && (
                                        <>
                                            <th className="px-3 py-3 border-r border-slate-200 text-center">Attainment based on Weighted Average Method %</th>
                                            <th className="px-3 py-3 border-r border-slate-200 text-center w-32">Attainment Level</th>
                                        </>
                                    )}
                                    {showRelative && (
                                        <>
                                            <th className="px-3 py-3 border-r border-slate-200 text-center">Attainment based on Relative Weighted Average Method %</th>
                                            <th className="px-3 py-3 text-center w-32">Attainment Level</th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {data.map((row, idx) => (
                                    <tr key={row.po_code} className="hover:bg-slate-50 transition-colors text-sm group">
                                        {/* SI No */}
                                        <td className="px-3 py-2.5 border-r border-slate-100 text-center text-slate-500 font-mono text-xs">
                                            {idx + 1}
                                        </td>
                                        
                                        {/* PO Reference */}
                                        <td className="px-3 py-2.5 border-r border-slate-100 text-center text-slate-700 font-bold">
                                            {row.po_code}
                                        </td>
                                        
                                        {/* Threshold method % */}
                                        {showThreshold && (
                                            <>
                                                <td className="px-3 py-2.5 border-r border-slate-100 text-center">
                                                    <div className="flex flex-col items-center justify-center">
                                                        <span className="text-slate-800 font-medium">{row.threshold_pct.toFixed(2)} %</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => onDrilldownClick(row.po_id, row.po_code, 'threshold', row.po_statement)}
                                                            className="text-xs text-blue-600 hover:text-blue-800 underline cursor-pointer font-semibold mt-1"
                                                        >
                                                            drill down
                                                        </button>
                                                    </div>
                                                </td>
                                                
                                                {/* Threshold Level */}
                                                <td className="px-3 py-2.5 border-r border-slate-100 text-center">
                                                    <div className="flex flex-col items-center justify-center">
                                                        <span className="text-slate-800 font-medium">{row.threshold_level.toFixed(2)}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => onStatusClick(row.po_id, row.po_code, row.threshold_status, row.po_statement)}
                                                            className="text-xs text-blue-600 hover:text-blue-800 underline cursor-pointer font-semibold mt-1"
                                                        >
                                                            {row.threshold_status}
                                                        </button>
                                                    </div>
                                                </td>
                                            </>
                                        )}
                                        
                                        {/* Weighted Average Method % */}
                                        {showWeighted && (
                                            <>
                                                <td className="px-3 py-2.5 border-r border-slate-100 text-center">
                                                    <div className="flex flex-col items-center justify-center">
                                                        <span className="text-slate-800 font-medium">{row.weighted_pct.toFixed(2)} %</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => onDrilldownClick(row.po_id, row.po_code, 'weighted', row.po_statement)}
                                                            className="text-xs text-blue-600 hover:text-blue-800 underline cursor-pointer font-semibold mt-1"
                                                        >
                                                            drill down
                                                        </button>
                                                    </div>
                                                </td>
                                                
                                                {/* Weighted Level */}
                                                <td className="px-3 py-2.5 border-r border-slate-100 text-center">
                                                    <div className="flex flex-col items-center justify-center">
                                                        <span className="text-slate-800 font-medium">{row.weighted_level.toFixed(2)}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => onStatusClick(row.po_id, row.po_code, row.weighted_status, row.po_statement)}
                                                            className="text-xs text-blue-600 hover:text-blue-800 underline cursor-pointer font-semibold mt-1"
                                                        >
                                                            {row.weighted_status}
                                                        </button>
                                                    </div>
                                                </td>
                                            </>
                                        )}
                                        
                                        {/* Relative Weighted Average Method % */}
                                        {showRelative && (
                                            <>
                                                <td className="px-3 py-2.5 border-r border-slate-100 text-center">
                                                    <div className="flex flex-col items-center justify-center">
                                                        <span className="text-slate-800 font-medium">{row.relative_pct.toFixed(2)} %</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => onDrilldownClick(row.po_id, row.po_code, 'relative', row.po_statement)}
                                                            className="text-xs text-blue-600 hover:text-blue-800 underline cursor-pointer font-semibold mt-1"
                                                        >
                                                            drill down
                                                        </button>
                                                    </div>
                                                </td>
                                                
                                                {/* Relative Level */}
                                                <td className="px-3 py-2.5 text-center">
                                                    <div className="flex flex-col items-center justify-center">
                                                        <span className="text-slate-800 font-medium">{row.relative_level.toFixed(2)}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => onStatusClick(row.po_id, row.po_code, row.relative_status, row.po_statement)}
                                                            className="text-xs text-blue-600 hover:text-blue-800 underline cursor-pointer font-semibold mt-1"
                                                        >
                                                            {row.relative_status}
                                                        </button>
                                                    </div>
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Note Section */}
            {isFirstYear ? (
                <div className="p-4 border border-gray-200 bg-[#f8f8f6] rounded-lg text-sm text-left shadow-sm">
                    <div className="font-semibold text-gray-700 mb-2">
                        <span className="font-bold text-gray-800">Note: </span>
                        The above bar graph depicts the overall class performance with respect to the Threshold % for individual Program Outcomes (POs). The Attainment % for respective columns is calculated using the below formula.
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-200">
                        <div className="font-bold text-gray-800 mb-1">
                            For Attainment based on Actual Secured Marks % = Average of all the Course Outcomes (COs) Attainment % mapped to the respective PO (as per the COs to POs mapping matrix).
                        </div>
                    </div>
                </div>
            ) : (
                <div className="p-4 border border-gray-200 bg-[#f8f8f6] rounded-lg text-sm text-left shadow-sm">
                    <div className="font-semibold text-gray-700 mb-2">
                        <span className="font-bold text-gray-800">Note: </span>
                        The above bar graph depicts the overall class performance with respect to the Threshold % for individual Program Outcomes (POs). The Attainment % for respective columns is calculated using the below formula.
                    </div>
                    <div className={`grid grid-cols-1 ${
                        [showThreshold, showWeighted, showRelative].filter(Boolean).length === 2 ? 'md:grid-cols-2' : 
                        [showThreshold, showWeighted, showRelative].filter(Boolean).length === 1 ? 'md:grid-cols-1' : 'md:grid-cols-3'
                    } gap-6 mt-4 pt-3 border-t border-gray-200`}>
                        {showThreshold && (
                            <div>
                                <div className="font-bold text-gray-800 mb-1">
                                    For Attainment based on Threshold method %
                                </div>
                                <div className="text-gray-600 text-xs mt-1">
                                    = Average of all the Course Outcomes (COs) Threshold based Attainment % mapped to the respective PO (as per the COs to POs mapping matrix).
                                </div>
                            </div>
                        )}
                        {showWeighted && (
                            <div>
                                <div className="font-bold text-gray-800 mb-1">
                                    For Attainment based on Weighted Average Method %
                                </div>
                                <div className="text-gray-600 text-xs mt-1">
                                    = Average of all the Course Outcomes (COs) Attainment % (Map Level Weighted Attainment %) mapped to the respective PO (as per the COs to POs mapping matrix).
                                </div>
                            </div>
                        )}
                        {showRelative && (
                            <div>
                                <div className="font-bold text-gray-800 mb-1">
                                    For Attainment based on Relative Weighted Average Method %
                                </div>
                                <div className="text-gray-600 text-xs mt-1">
                                    = Sum of all the Course Outcomes (COs) Attainment % (Map Level Weighted * Mapped Value) / Sum of all Mapped Value of the respective PO (as per the COs to POs mapping matrix).
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConsolidatedPOTable;

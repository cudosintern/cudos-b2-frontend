import React from 'react';
import { CORow } from './MteCoApi';

interface Props {
    rows: CORow[];
    actualCourseAttainment?: number;
    courseAttainmentAfterWeightage?: number;
    levels: any[];
    onMappedQuestionsClick: (cloId: number, cloCode: string) => void;
    onDrilldownClick: (cloId: number, cloCode: string, cloStatement: string) => void;
    showDrilldown?: boolean;
}

const MteCalculatedTable: React.FC<Props> = ({
    rows,
    actualCourseAttainment = 0,
    courseAttainmentAfterWeightage = 0,
    levels,
    onMappedQuestionsClick,
    onDrilldownClick,
    showDrilldown = true,
}) => {
    const getLevelName = (val: number) => {
        const rounded = Math.round(val);
        const match = levels.find(l => Math.round(l.level_value) === rounded);
        if (match) return match.level_name;
        if (rounded === 0) return 'Zero';
        if (rounded === 1) return 'Low';
        if (rounded === 2) return 'Medium';
        if (rounded === 3) return 'High';
        return '-';
    };

    return (
        <div className="w-full text-left">
            <div className="border border-slate-300 rounded-md overflow-hidden bg-white shadow-sm mb-4">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-100 text-[11px] text-slate-700 uppercase font-bold border-b border-slate-300">
                            <tr>
                                <th className="px-3 py-2 border-r border-slate-200 w-16">Sl No</th>
                                <th className="px-3 py-2 border-r border-slate-200">Course Outcomes (COs)</th>
                                <th className="px-3 py-2 border-r border-slate-200">Threshold Based Attainment</th>
                                <th className="px-3 py-2 border-r border-slate-200">Attainment Level</th>
                                <th className="px-3 py-2">Average Based Attainment %</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {rows.map((row, index) => (
                                <tr key={index} className="hover:bg-slate-50 transition-colors text-sm group">
                                    <td className="px-3 py-2 border-r border-slate-100 text-slate-500 font-mono text-xs">{index + 1}</td>
                                    <td className="px-3 py-2 border-r border-slate-100 text-slate-700 font-medium">
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-gray-800 leading-snug">{row.clo_code}</span>
                                            <button
                                                onClick={() => onMappedQuestionsClick(row.clo_id, row.clo_code)}
                                                className="text-blue-600 hover:text-blue-800 text-xs font-medium transition text-left w-fit hover:underline mt-0.5"
                                            >
                                                View details
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-3 py-2 border-r border-slate-100 text-slate-700 font-medium">
                                        <div className="flex flex-col">
                                            <span className="font-medium leading-snug">{row.threshold_direct_attainment_display}</span>
                                            {showDrilldown && (
                                                <button
                                                    onClick={() => onDrilldownClick(row.clo_id, row.clo_code, row.clo_statement)}
                                                    className="text-blue-600 hover:text-blue-800 text-xs font-medium transition text-left w-fit hover:underline mt-0.5"
                                                >
                                                    drill down
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-3 py-2 border-r border-slate-100 text-slate-700 font-medium">{row.attainment_level}</td>
                                    <td className="px-3 py-2 text-slate-600 font-medium">{row.average_direct_attainment_display}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Summary values */}
            <div className="mt-4 flex flex-wrap gap-6 text-sm text-left">
                <div>
                    <span className="font-bold text-gray-800">Actual Course Attainment: </span>
                    <span className="text-gray-700">{actualCourseAttainment.toFixed(2)}%</span>
                </div>
                <div>
                    <span className="font-bold text-gray-800">Course Attainment After Weightage : </span>
                    <span className="text-gray-700">{courseAttainmentAfterWeightage.toFixed(2)}%</span>
                </div>
            </div>
        </div>
    );
};

export default MteCalculatedTable;

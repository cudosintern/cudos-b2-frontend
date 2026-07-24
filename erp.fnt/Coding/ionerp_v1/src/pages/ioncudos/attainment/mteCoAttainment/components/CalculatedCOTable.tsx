import React from 'react';
import { CORow } from '../types/mteAttainment.types';

interface CalculatedCOTableProps {
    coRows: CORow[];
    onViewDetails: (cloId: number, initialTab?: 'mapped' | 'drilldown') => void;
}

const CalculatedCOTable: React.FC<CalculatedCOTableProps> = ({ coRows, onViewDetails }) => {
    if (coRows.length === 0) return null;

    const avgThreshold =
        coRows.reduce((sum, row) => sum + row.threshold_direct_attainment, 0) / coRows.length;
    const avgWeighted =
        coRows.reduce((sum, row) => sum + row.weighted_threshold_attainment, 0) / coRows.length;

    return (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="rounded-t-2xl bg-slate-800 px-5 py-3">
                <h3 className="text-lg font-semibold text-white">Course Outcomes (COs) Attainment</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">SI No.</th>
                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Course Outcomes (COs)</th>
                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Threshold based Attainment</th>
                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Attainment Level</th>
                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Average based Attainment %</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {coRows.map((row, idx) => (
                            <tr key={row.clo_id}>
                                <td className="px-5 py-3 text-sm text-slate-700">{idx + 1}</td>
                                <td className="px-5 py-3 text-sm text-slate-700">
                                    <div className="font-semibold text-slate-800">{row.clo_code}</div>
                                    <div className="mt-1 max-w-md text-xs leading-5 text-slate-500">
                                        {row.clo_statement}
                                    </div>
                                    <div className="mt-2 flex gap-3 text-xs">
                                        <button
                                            onClick={() => onViewDetails(row.clo_id, 'mapped')}
                                            className="font-medium text-sky-700 underline underline-offset-2 hover:text-sky-900"
                                        >
                                            View details
                                        </button>
                                        <button
                                            onClick={() => onViewDetails(row.clo_id, 'drilldown')}
                                            className="font-medium text-sky-700 underline underline-offset-2 hover:text-sky-900"
                                        >
                                            Drill down
                                        </button>
                                    </div>
                                </td>
                                <td className="px-5 py-3 text-sm font-medium text-slate-700">
                                    {row.threshold_direct_attainment_display}
                                </td>
                                <td className="px-5 py-3 text-sm text-slate-700">{row.attainment_level}</td>
                                <td className="px-5 py-3 text-sm text-slate-700">{row.average_direct_attainment_display}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="border-t border-slate-200 px-5 py-4 text-sm text-slate-700">
                <div className="flex flex-wrap gap-6">
                    <div>
                        <span className="font-semibold text-slate-900">Actual Course Attainment:</span>{' '}
                        {avgThreshold.toFixed(2)}%
                    </div>
                    <div>
                        <span className="font-semibold text-slate-900">Course Attainment After Weightage:</span>{' '}
                        {avgWeighted.toFixed(2)}%
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CalculatedCOTable;

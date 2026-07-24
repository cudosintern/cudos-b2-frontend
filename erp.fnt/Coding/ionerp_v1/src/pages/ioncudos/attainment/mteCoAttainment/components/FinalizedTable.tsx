import React from 'react';
import { FinalizedRow } from '../types/mteAttainment.types';

interface FinalizedTableProps {
    finalizedRows: FinalizedRow[];
}

const FinalizedTable: React.FC<FinalizedTableProps> = ({ finalizedRows }) => {
    if (finalizedRows.length === 0) return null;

    const avgThreshold =
        finalizedRows.reduce((sum, row) => sum + row.threshold_based_attainment, 0) /
        finalizedRows.length;
    const avgWeighted =
        finalizedRows.reduce((sum, row) => sum + row.weighted_threshold_attainment, 0) /
        finalizedRows.length;

    return (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="rounded-t-2xl bg-slate-800 px-5 py-3">
                <h3 className="text-lg font-semibold text-white">Course Outcomes (COs) Attainment</h3>
            </div>
            <div className="border-b border-emerald-200 bg-emerald-50 px-5 py-3">
                <p className="text-sm font-semibold text-emerald-700">Status: CO Attainment is Finalized</p>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">CO Code</th>
                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Threshold based Attainment %</th>
                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Attainment Level</th>
                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Average based Attainment %</th>
                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Weighted Threshold Attainment</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {finalizedRows.map((row) => (
                            <tr key={row.clo_id}>
                                <td className="px-5 py-3 text-sm font-medium text-slate-700">{row.clo_code}</td>
                                <td className="px-5 py-3 text-sm text-slate-700">{row.threshold_based_attainment.toFixed(2)}%</td>
                                <td className="px-5 py-3 text-sm text-slate-700">{row.attainment_level}</td>
                                <td className="px-5 py-3 text-sm text-slate-700">{row.average_based_attainment.toFixed(2)}%</td>
                                <td className="px-5 py-3 text-sm text-slate-700">{row.weighted_threshold_attainment.toFixed(2)}%</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="border-t border-slate-200 px-5 py-4 text-sm text-slate-700">
                <div className="flex flex-wrap gap-6">
                    <div>
                        <strong className="text-slate-900">Actual Course Attainment:</strong>{' '}
                        {avgThreshold.toFixed(2)}%
                    </div>
                    <div>
                        <strong className="text-slate-900">Course Attainment After Weightage:</strong>{' '}
                        {avgWeighted.toFixed(2)}%
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FinalizedTable;

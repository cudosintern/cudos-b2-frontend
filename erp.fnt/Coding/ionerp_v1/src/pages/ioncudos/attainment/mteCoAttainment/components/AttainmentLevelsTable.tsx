import React from 'react';
import { AttainmentLevel } from '../types/mteAttainment.types';

interface AttainmentLevelsTableProps {
    levels: AttainmentLevel[];
}

const AttainmentLevelsTable: React.FC<AttainmentLevelsTableProps> = ({ levels }) => {
    if (levels.length === 0) return null;

    return (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="rounded-t-2xl bg-slate-800 px-5 py-3">
                <h3 className="text-lg font-semibold text-white">Direct Attainment / Target Levels</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">SI No.</th>
                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Attainment Level Name</th>
                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Attainment Level Value</th>
                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Target</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {levels.map((level, idx) => (
                            <tr key={`${level.level_name}-${level.level_value}`}>
                                <td className="px-5 py-3 text-sm text-slate-700">{idx + 1}</td>
                                <td className="px-5 py-3 text-sm text-slate-700">{level.level_name}</td>
                                <td className="px-5 py-3 text-sm text-slate-700">{level.level_value}</td>
                                <td className="px-5 py-3 text-sm leading-6 text-slate-700">
                                    {level.direct_percentage}% students scoring {level.operator} {level.target_percentage}% marks out of relevant maximum marks.
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AttainmentLevelsTable;

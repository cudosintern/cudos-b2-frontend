import React from 'react';
import { FinalizedRow } from './MteCoApi';

interface Props {
    rows: FinalizedRow[];
    levels: any[];
}

const MteFinalizedTable: React.FC<Props> = ({ rows, levels }) => {
    if (!rows.length) return null;

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
        <div className="border border-slate-300 rounded-md overflow-hidden bg-white shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-100 text-[11px] text-slate-700 uppercase font-bold border-b border-slate-300">
                        <tr>
                            <th className="px-3 py-2 border-r border-slate-200">CO Code</th>
                            <th className="px-3 py-2 border-r border-slate-200">Threshold based attainment %</th>
                            <th className="px-3 py-2 border-r border-slate-200">Attainment Level</th>
                            <th className="px-3 py-2 border-r border-slate-200">Average based attainment %</th>
                            <th className="px-3 py-2">Weighted threshold attainment</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {rows.map((row, index) => (
                            <tr key={index} className="hover:bg-slate-50 transition-colors text-sm group">
                                <td className="px-3 py-2 border-r border-slate-100 font-bold text-slate-700">{row.clo_code}</td>
                                <td className="px-3 py-2 border-r border-slate-100 text-slate-700 font-medium">{row.threshold_based_attainment}%</td>
                                <td className="px-3 py-2 border-r border-slate-100 text-slate-700 font-medium">{row.attainment_level}</td>
                                <td className="px-3 py-2 border-r border-slate-100 text-slate-700 font-medium">{row.average_based_attainment}%</td>
                                <td className="px-3 py-2 text-slate-600 font-medium">{row.weighted_threshold_attainment.toFixed(2)}%</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MteFinalizedTable;

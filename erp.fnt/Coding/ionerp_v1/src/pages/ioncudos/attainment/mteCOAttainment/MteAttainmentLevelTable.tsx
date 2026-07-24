import React from 'react';

interface AttainmentLevel {
    sl_no?: number;
    level_name: string;
    level_value: number;
    target_text: string;
}

interface Props {
    levels: AttainmentLevel[];
    showSlNo?: boolean;
}

const MteAttainmentLevelTable: React.FC<Props> = ({ levels, showSlNo = true }) => {
    if (!levels.length) {
        return (
            <div className="p-4 text-gray-500 text-left text-sm italic">
                No attainment levels configured for this course.
            </div>
        );
    }

    return (
        <div className="border border-slate-300 rounded-md overflow-hidden bg-white shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-100 text-[11px] text-slate-700 uppercase font-bold border-b border-slate-300">
                        <tr>
                            {showSlNo && <th className="px-3 py-2 border-r border-slate-200 w-16">Sl No</th>}
                            <th className="px-3 py-2 border-r border-slate-200">Attainment Level Name</th>
                            <th className="px-3 py-2 border-r border-slate-200">Attainment Level Value</th>
                            <th className="px-3 py-2">Target</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {levels.map((level, index) => (
                            <tr key={index} className="hover:bg-slate-50 transition-colors text-sm group">
                                {showSlNo && <td className="px-3 py-2 border-r border-slate-100 text-slate-500 font-mono text-xs">{level.sl_no ?? index + 1}</td>}
                                <td className="px-3 py-2 border-r border-slate-100 text-slate-700 font-medium">{level.level_name}</td>
                                <td className="px-3 py-2 border-r border-slate-100 text-slate-700 font-medium">{level.level_value}</td>
                                <td className="px-3 py-2 text-slate-600 font-medium">{level.target_text}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MteAttainmentLevelTable;

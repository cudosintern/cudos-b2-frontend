import React, { useState, useEffect } from 'react';
import { getDrilldown, DrilldownRow } from './MteCoApi';
import ModalContainer from '../../../../components/Modal/ModalContainer';

interface Props {
    open: boolean;
    onClose: () => void;
    cloId: number | null;
    cloCode: string;
    cloStatement: string;
    courseId: number | null;
    sectionId: number | null;
    occasionIds: number[];
    totalMteWeightage?: number;
    curriculumName?: string;
    termName?: string;
    courseName?: string;
}

const MteDrilldownModal: React.FC<Props> = ({
    open,
    onClose,
    cloId,
    cloCode,
    cloStatement,
    courseId,
    sectionId,
    occasionIds,
    totalMteWeightage = 0,
    curriculumName = '',
    termName = '',
    courseName = '',
}) => {
    const [drilldown, setDrilldown] = useState<DrilldownRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (open && cloId && courseId && occasionIds.length) {
            setLoading(true);
            setError('');
            getDrilldown(cloId, courseId, occasionIds, sectionId ?? undefined)
                .then(setDrilldown)
                .catch((err) => setError(err.message))
                .finally(() => setLoading(false));
        }
    }, [open, cloId, courseId, occasionIds, sectionId]);

    const totalAttainment = drilldown.length
        ? (drilldown.reduce((sum, d) => sum + d.attainment_percentage, 0) / drilldown.length).toFixed(2)
        : '0.00';
    const totalLevel = drilldown.length
        ? (drilldown.reduce((sum, d) => sum + d.attainment_level, 0) / drilldown.length).toFixed(2)
        : '0.00';

    return (
        <ModalContainer
            isOpen={open}
            onClose={onClose}
            title="Course Outcomes (COs) drill down"
            size="5xl"
        >
            {loading && <p className="text-center py-8">Loading drilldown details...</p>}
            {error && <p className="text-center text-red-600 py-8">{error}</p>}
            {!loading && !error && drilldown.length === 0 && (
                <p className="text-center text-gray-500 py-8">No occasion data found.</p>
            )}
            {!loading && !error && drilldown.length > 0 && (
                <div className="flex flex-col text-left">
                    {/* Metadata Section */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-y-3 gap-x-6 text-sm text-left text-gray-700 mb-3">
                        <div>
                            <span className="font-semibold text-gray-600">Curriculum:</span>{' '}
                            <span className="text-blue-600 font-medium">{curriculumName || 'N/A'}</span>
                        </div>
                        <div>
                            <span className="font-semibold text-gray-600">Term:</span>{' '}
                            <span className="text-blue-600 font-medium">{termName || 'N/A'}</span>
                        </div>
                        <div>
                            <span className="font-semibold text-gray-600">Course:</span>{' '}
                            <span className="text-blue-600 font-medium">{courseName || 'N/A'}</span>
                        </div>
                    </div>
                    <div className="text-left text-sm text-gray-800 mb-4 font-bold">
                        MTE Weightage: {totalMteWeightage.toFixed(2)}%
                    </div>

                    <hr className="mb-5 border-gray-200" />

                    {/* CO Statement */}
                    <div className="text-left mb-6">
                        <div className="text-sm font-semibold text-gray-500 mb-1">CO Statement :</div>
                        <div className="text-sm font-bold text-gray-800">
                            {cloCode}: {cloStatement}
                        </div>
                    </div>

                    {/* Custom HTML Table */}
                    <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
                        <table className="min-w-full divide-y divide-gray-200 bg-white">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">SI No.</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">CO Code</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Occassion</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actual Attainment %</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actual Attainment Level</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {drilldown.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50 transition">
                                        <td className="px-4 py-3 text-sm text-gray-700 text-left">{idx + 1}</td>
                                        <td className="px-4 py-3 text-sm text-gray-700 text-left font-medium">{cloCode}</td>
                                        <td className="px-4 py-3 text-sm text-gray-700 text-left">{row.occasion_name}</td>
                                        <td className="px-4 py-3 text-sm text-gray-700 text-right font-medium">
                                            {row.attainment_percentage.toFixed(2)}%
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-700 text-right font-medium">
                                            {row.attainment_level.toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                                {/* Footer row */}
                                <tr className="bg-gray-50 font-bold text-gray-800 border-t-2 border-gray-200">
                                    <td colSpan={3} className="px-4 py-3"></td>
                                    <td className="px-4 py-3 text-right whitespace-nowrap">
                                        Total Attainment %: {totalAttainment}%
                                    </td>
                                    <td className="px-4 py-3 text-right whitespace-nowrap">
                                        Total Attainment Level: {totalLevel}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Red Close Button */}
                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={onClose}
                            className="flex items-center gap-2 px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-semibold transition shadow-sm"
                        >
                            <span className="font-bold text-sm">✖</span> Close
                        </button>
                    </div>
                </div>
            )}
        </ModalContainer>
    );
};

export default MteDrilldownModal;

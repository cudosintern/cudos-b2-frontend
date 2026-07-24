// components/modals/CODrilldownModal.tsx
import React, { useEffect, useState } from 'react';
import { DrilldownResponse } from '../../types/mteAttainment.types';
import { mteAttainmentApi } from '../../services/mteAttainmentApi';

interface CODrilldownModalProps {
    isOpen: boolean;
    onClose: () => void;
    cloId: number;
    courseId: number;
    occasionIds: number[];
}

const CODrilldownModal: React.FC<CODrilldownModalProps> = ({
    isOpen,
    onClose,
    cloId,
    courseId,
    occasionIds,
}) => {
    const [data, setData] = useState<DrilldownResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && cloId) {
            const fetchDrilldown = async () => {
                setLoading(true);
                setError(null);
                try {
                    const response = await mteAttainmentApi.getDrilldown(cloId, courseId, occasionIds);
                    setData(response);
                } catch (err: any) {
                    setError(err.message || 'Failed to load drilldown data');
                } finally {
                    setLoading(false);
                }
            };
            fetchDrilldown();
        }
    }, [isOpen, cloId, courseId, occasionIds]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4">
                <div className="fixed inset-0 bg-black opacity-50" onClick={onClose}></div>
                <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] overflow-y-auto">
                    <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                        <h3 className="text-lg font-semibold">CO Drilldown</h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 focus:outline-none">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <div className="p-6">
                        {loading && <p className="text-gray-500">Loading...</p>}
                        {error && <p className="text-red-500">{error}</p>}
                        {data && (
                            <div>
                                <div className="mb-4">
                                    <p><strong>CO Code:</strong> {data.co_code}</p>
                                    <p><strong>Statement:</strong> {data.co_statement}</p>
                                    <p><strong>MTE Weightage:</strong> {data.mte_weightage}%</p>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Occasion</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attainment %</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attainment Level</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {data.occasion_data.map((occ, idx) => (
                                                <tr key={idx}>
                                                    <td className="px-4 py-2 text-sm text-gray-700">{occ.occasion_name}</td>
                                                    <td className="px-4 py-2 text-sm text-gray-700">{occ.attainment_percentage.toFixed(2)}%</td>
                                                    <td className="px-4 py-2 text-sm text-gray-700">{occ.attainment_level}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-gray-50">
                                            <tr>
                                                <td className="px-4 py-2 text-sm font-semibold text-gray-700">Average</td>
                                                <td className="px-4 py-2 text-sm font-semibold text-gray-700">{data.average_attainment_percentage.toFixed(2)}%</td>
                                                <td className="px-4 py-2 text-sm font-semibold text-gray-700">{data.average_attainment_level}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CODrilldownModal;
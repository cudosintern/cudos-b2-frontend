import React, { useEffect, useState } from 'react';
import { MappedQuestion, DrilldownResponse } from '../../types/mteAttainment.types';
import { mteAttainmentApi } from '../../services/mteAttainmentApi';

interface ViewDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    cloId: number;
    courseId: number;
    occasionIds: number[];
    initialTab?: 'mapped' | 'drilldown';
}

const ViewDetailsModal: React.FC<ViewDetailsModalProps> = ({
    isOpen,
    onClose,
    cloId,
    courseId,
    occasionIds,
    initialTab = 'mapped',
}) => {
    const [activeTab, setActiveTab] = useState<'mapped' | 'drilldown'>(initialTab);
    const [mappedQuestions, setMappedQuestions] = useState<MappedQuestion[]>([]);
    const [drilldownData, setDrilldownData] = useState<DrilldownResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setActiveTab(initialTab);
    }, [initialTab, cloId]);

    useEffect(() => {
        if (isOpen && cloId) {
            const fetchData = async () => {
                setLoading(true);
                setError(null);
                try {
                    const [questions, drilldown] = await Promise.all([
                        mteAttainmentApi.getMappedQuestions(cloId, courseId, occasionIds),
                        mteAttainmentApi.getDrilldown(cloId, courseId, occasionIds),
                    ]);
                    setMappedQuestions(questions);
                    setDrilldownData(drilldown);
                } catch (err: any) {
                    setError(err.message || 'Failed to load details');
                } finally {
                    setLoading(false);
                }
            };
            fetchData();
        }
    }, [isOpen, cloId, courseId, occasionIds]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center px-4">
                <div className="fixed inset-0 bg-black opacity-50" onClick={onClose}></div>
                <div className="relative max-h-[80vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-xl">
                    <div className="sticky top-0 flex items-center justify-between border-b bg-white px-6 py-4">
                        <h3 className="text-lg font-semibold text-slate-900">CO Details</h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <div className="border-b border-gray-200">
                        <nav className="flex -mb-px">
                            <button
                                onClick={() => setActiveTab('mapped')}
                                className={`px-6 py-3 text-sm font-medium ${
                                    activeTab === 'mapped'
                                        ? 'border-b-2 border-sky-600 text-sky-700'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                Mapped Questions
                            </button>
                            <button
                                onClick={() => setActiveTab('drilldown')}
                                className={`px-6 py-3 text-sm font-medium ${
                                    activeTab === 'drilldown'
                                        ? 'border-b-2 border-sky-600 text-sky-700'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                Occasion-wise Attainment
                            </button>
                        </nav>
                    </div>
                    <div className="p-6">
                        {loading && <p className="text-gray-500">Loading...</p>}
                        {error && <p className="text-red-500">{error}</p>}
                        {!loading && !error && activeTab === 'mapped' && (
                            <div className="overflow-x-auto">
                                <table className="min-w-full rounded-lg border border-gray-200 bg-white">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Q. No.</th>
                                            <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Sub Q.</th>
                                            <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Marks</th>
                                            <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Mapped Marks</th>
                                            <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Mapped %</th>
                                            <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">CO</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {mappedQuestions.map((q, idx) => (
                                            <tr key={`${q.question_sequence}-${idx}`} className="border-t">
                                                <td className="px-4 py-2 text-sm text-slate-700">{q.question_sequence}</td>
                                                <td className="px-4 py-2 text-sm text-slate-700">{q.sub_question_no || '-'}</td>
                                                <td className="px-4 py-2 text-sm text-slate-700">{q.marks}</td>
                                                <td className="px-4 py-2 text-sm text-slate-700">{q.mapped_marks}</td>
                                                <td className="px-4 py-2 text-sm text-slate-700">{q.mapped_percentage}%</td>
                                                <td className="px-4 py-2 text-sm text-slate-700">{q.co_code}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        {!loading && !error && activeTab === 'drilldown' && drilldownData && (
                            <div>
                                <p className="text-sm text-slate-700">
                                    <strong className="text-slate-900">MTE Weightage:</strong> {drilldownData.mte_weightage}%
                                </p>
                                <table className="mt-3 min-w-full border border-slate-200">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Occasion</th>
                                            <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Attainment %</th>
                                            <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Level</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {drilldownData.occasion_data.map((occ, idx) => (
                                            <tr key={`${occ.occasion_name}-${idx}`} className="border-t">
                                                <td className="px-4 py-2 text-sm text-slate-700">{occ.occasion_name}</td>
                                                <td className="px-4 py-2 text-sm text-slate-700">{occ.attainment_percentage.toFixed(2)}%</td>
                                                <td className="px-4 py-2 text-sm text-slate-700">{occ.attainment_level}</td>
                                            </tr>
                                        ))}
                                        <tr className="bg-slate-50">
                                            <td className="px-4 py-2 text-sm font-semibold text-slate-900">Average</td>
                                            <td className="px-4 py-2 text-sm text-slate-700">{drilldownData.average_attainment_percentage.toFixed(2)}%</td>
                                            <td className="px-4 py-2 text-sm text-slate-700">{drilldownData.average_attainment_level}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewDetailsModal;

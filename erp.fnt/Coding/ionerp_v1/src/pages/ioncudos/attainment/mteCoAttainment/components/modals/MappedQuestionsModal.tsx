// components/modals/MappedQuestionsModal.tsx
import React, { useEffect, useState } from 'react';
import { MappedQuestion } from '../../types/mteAttainment.types';
import { mteAttainmentApi } from '../../services/mteAttainmentApi';

interface MappedQuestionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    cloId: number;
    courseId: number;
    occasionIds: number[];
}

const MappedQuestionsModal: React.FC<MappedQuestionsModalProps> = ({
    isOpen,
    onClose,
    cloId,
    courseId,
    occasionIds,
}) => {
    const [questions, setQuestions] = useState<MappedQuestion[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && cloId) {
            const fetchQuestions = async () => {
                setLoading(true);
                setError(null);
                try {
                    const data = await mteAttainmentApi.getMappedQuestions(cloId, courseId, occasionIds);
                    setQuestions(data);
                } catch (err: any) {
                    setError(err.message || 'Failed to load mapped questions');
                } finally {
                    setLoading(false);
                }
            };
            fetchQuestions();
        }
    }, [isOpen, cloId, courseId, occasionIds]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4">
                <div className="fixed inset-0 bg-black opacity-50" onClick={onClose}></div>
                <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                    <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                        <h3 className="text-lg font-semibold">Questions Mapped to CO {cloId}</h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 focus:outline-none">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <div className="p-6">
                        {loading && <p className="text-gray-500">Loading...</p>}
                        {error && <p className="text-red-500">{error}</p>}
                        {!loading && !error && (
                            <div className="overflow-x-auto">
                                <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Q. No.</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sub Q.</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marks</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mapped Marks</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mapped %</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CO</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {questions.map((q, idx) => (
                                            <tr key={idx}>
                                                <td className="px-4 py-2 text-sm text-gray-700">{q.question_sequence}</td>
                                                <td className="px-4 py-2 text-sm text-gray-700">{q.sub_question_no || '-'}</td>
                                                <td className="px-4 py-2 text-sm text-gray-700">{q.marks}</td>
                                                <td className="px-4 py-2 text-sm text-gray-700">{q.mapped_marks}</td>
                                                <td className="px-4 py-2 text-sm text-gray-700">{q.mapped_percentage}%</td>
                                                <td className="px-4 py-2 text-sm text-gray-700">{q.co_code}</td>
                                            </tr>
                                        ))}
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

export default MappedQuestionsModal;
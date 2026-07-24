import React, { useState, useEffect } from 'react';
import { getMappedQuestions, QuestionMapping } from './MteCoApi';
import ModalContainer from '../../../../components/Modal/ModalContainer';
import DataTable from '../../../../components/Table/DataTable';

interface Props {
    open: boolean;
    onClose: () => void;
    cloId: number | null;
    cloCode: string;
    cloStatement?: string;
    courseId: number | null;
    sectionId: number | null;    // added
    occasionIds: number[];
}

const MteMappedQuestionsModal: React.FC<Props> = ({
    open,
    onClose,
    cloId,
    cloCode,
    cloStatement = '',
    courseId,
    sectionId,
    occasionIds,
}) => {
    const [questions, setQuestions] = useState<QuestionMapping[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (open && cloId && courseId && occasionIds.length) {
            setLoading(true);
            setError('');
            getMappedQuestions(cloId, courseId, occasionIds, sectionId ?? undefined)
                .then(setQuestions)
                .catch((err) => setError(err.message))
                .finally(() => setLoading(false));
        }
    }, [open, cloId, courseId, occasionIds, sectionId]);

    const getQuestionNo = (q: QuestionMapping) => {
        let code = q.qp_mq_code || "";
        // Strip HTML tags if any
        code = code.replace(/<[^>]*>/g, "");
        // If code contains a dot (e.g. Q1.a -> Q1)
        if (code.includes(".")) {
            const parts = code.split(".");
            code = parts[0];
        }
        // If code contains hyphen (e.g. gdgdg-Q1 -> Q1)
        if (code.includes("-")) {
            const parts = code.split("-");
            code = parts[parts.length - 1];
        }
        // Remove Q prefix (e.g. Q1 -> 1)
        code = code.replace(/^Q/i, "");
        
        const sub = q.qp_subq_code || "";
        return `${code}${sub}`;
    };

    const displayStatement = cloStatement || (questions.length > 0 ? questions[0].clo_statement : '');

    return (
        <ModalContainer
            isOpen={open}
            onClose={onClose}
            title="Course Outcomes (COs) Assessment details"
            size="5xl"
        >
            {loading && <p className="text-center py-8">Loading mapped questions...</p>}
            {error && <p className="text-center text-red-600 py-8">{error}</p>}
            {!loading && !error && questions.length === 0 && (
                <p className="text-center text-gray-500 py-8">
                    No mapped questions found for this CO on the selected MTE occasions.
                </p>
            )}
            {!loading && !error && questions.length > 0 && (
                <div className="flex flex-col text-left">
                    {/* CO Code and Statement */}
                    {displayStatement && (
                        <div className="text-sm font-semibold text-gray-800 mb-6 text-left border-b pb-2">
                            {cloCode}: {displayStatement}
                        </div>
                    )}

                    {/* Custom HTML Table */}
                    <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
                        <table className="min-w-full divide-y divide-gray-200 bg-white">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Assessment</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Q No.</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Question Content</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Marks</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {questions.map((q, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50 transition">
                                        <td className="px-4 py-3 text-sm text-gray-700 text-left whitespace-nowrap">{q.ao_name || "MTE"}</td>
                                        <td className="px-4 py-3 text-sm text-gray-900 text-left whitespace-nowrap font-medium">{getQuestionNo(q)}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600 text-left">
                                            <div dangerouslySetInnerHTML={{ __html: q.qp_content || "" }} />
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-700 text-right whitespace-nowrap font-medium">
                                            {parseFloat(String(q.qp_subq_marks || 0)).toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
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

export default MteMappedQuestionsModal;

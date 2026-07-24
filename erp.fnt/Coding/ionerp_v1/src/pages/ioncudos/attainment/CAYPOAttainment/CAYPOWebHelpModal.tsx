import React, { useState } from 'react';
import { X, ChevronDown, ChevronRight } from 'lucide-react';
import ModalContainer from '../../../../components/Modal/ModalContainer';

interface Props {
    open: boolean;
    onClose: () => void;
}

const CAYPOWebHelpModal: React.FC<Props> = ({ open, onClose }) => {
    const [expandedTopic, setExpandedTopic] = useState<string | null>(null);

    const toggleTopic = (topic: string) => {
        setExpandedTopic(expandedTopic === topic ? null : topic);
    };

    return (
        <ModalContainer
            isOpen={open}
            onClose={onClose}
            title="IonCUDOS Help And Support - CAY PO Attainment"
            size="lg"
        >
            <div className="flex flex-col text-left space-y-6">
                {/* Intro Description */}
                <div className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <div className="font-bold text-gray-800 mb-1 border-b pb-1">
                        CAY PO Attainment
                    </div>
                    The User gets the PO Attainment report, for the selected Current Year, that is, for the two consecutive Semesters as Semester 1 – Semester 2, Semester 3 – Semester 4 ...etc.
                </div>

                {/* Help Topics */}
                <div>
                    <h4 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wider">Help Topics:</h4>
                    <div className="space-y-3">
                        <div className="border border-gray-200 rounded-lg overflow-hidden transition-all shadow-sm">
                            <button
                                onClick={() => toggleTopic('list_attainment')}
                                className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 transition text-sm font-semibold text-blue-600 focus:outline-none"
                            >
                                <div className="flex items-center gap-2">
                                    {expandedTopic === 'list_attainment' ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                    <span>List CAY PO Attainment</span>
                                </div>
                            </button>
                            {expandedTopic === 'list_attainment' && (
                                <div className="p-4 bg-gray-50 text-xs text-gray-600 border-t border-gray-200 leading-relaxed space-y-3">
                                    <ol className="list-decimal pl-4 space-y-1.5">
                                        <li>Select the department from the ‘Department’ drop-down list.</li>
                                        <li>Select the program from the ‘Program’ drop-down list.</li>
                                        <li>Select the academic year from the ‘Academic Year’ drop-down list, which displays the Attainment value for the selected Academic Year and the Attainment value is based on the calculation Method selected by the Admin.</li>
                                    </ol>
                                    <div className="font-semibold text-gray-700 pl-4">
                                        NOTE: <span className="font-normal text-gray-600">Upon clicking the value which is appearing in the blue color, the PO Attainment value for the individual Course will be displayed.</span>
                                    </div>
                                    <ol className="list-decimal pl-4 space-y-1.5" start={4}>
                                        <li>Select the attainment value (which is displayed in blue color), which displays the PO Attainment for individual courses of the selected Curriculum.</li>
                                        <li>Select the ‘Export’ button to export the displayed data in the PDF or WORD document.</li>
                                    </ol>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Other Links */}
                <div>
                    <h4 className="text-sm font-bold text-gray-800 mb-2 uppercase tracking-wider">Other Links:</h4>
                    <div className="text-xs text-gray-500 pl-2">
                        Individual PO Attainment
                    </div>
                </div>

                {/* Close Button */}
                <div className="flex justify-end pt-4 border-t">
                    <button
                        onClick={onClose}
                        className="flex items-center gap-2 px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-semibold transition active:scale-95 shadow-sm"
                    >
                        <X size={14} className="stroke-[3]" /> Close
                    </button>
                </div>
            </div>
        </ModalContainer>
    );
};

export default CAYPOWebHelpModal;

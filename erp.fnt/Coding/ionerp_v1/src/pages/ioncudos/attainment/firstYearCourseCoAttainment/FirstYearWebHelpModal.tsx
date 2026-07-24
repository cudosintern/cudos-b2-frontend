import React, { useState } from 'react';
import ModalContainer from '../../../../components/Modal/ModalContainer';
import { ChevronDown, ChevronRight, X } from 'lucide-react';
import { toast } from 'react-toastify';

interface Props {
    open: boolean;
    onClose: () => void;
}

const FirstYearWebHelpModal: React.FC<Props> = ({ open, onClose }) => {
    const [expandedTopic, setExpandedTopic] = useState<string | null>(null);

    const toggleTopic = (topic: string) => {
        setExpandedTopic(expandedTopic === topic ? null : topic);
    };

    const handleOtherLinkClick = (e: React.MouseEvent) => {
        e.preventDefault();
        toast.info("Navigating to Course - CO Attainment (CIA, MTE, TEE/ESE)...");
    };

    return (
        <ModalContainer
            isOpen={open}
            onClose={onClose}
            title="IonCUDOS Help And Support - First Year Course - CO Attainemnt (CIA, TEE/E"
            size="lg"
        >
            <div className="flex flex-col text-left space-y-6">
                {/* Intro Description */}
                <div className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <div className="font-bold text-gray-800 mb-1 border-b pb-1">
                        First Year Course - CO Attainment (CIA, TEE/ESE)
                    </div>
                    The User is allowed to calculate the First Year Course - CO Attainment for the respective Course.
                </div>

                {/* Help Topics */}
                <div>
                    <h4 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wider">Help Topics:</h4>
                    <div className="space-y-3">
                        {/* Topic 1: List CO Attainment (CIA, TEE/ESE) */}
                        <div className="border border-gray-200 rounded-lg overflow-hidden transition-all shadow-sm">
                            <button
                                onClick={() => toggleTopic('list_co')}
                                className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 transition text-sm font-semibold text-blue-600 focus:outline-none"
                            >
                                <div className="flex items-center gap-2">
                                    {expandedTopic === 'list_co' ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                    <span>List CO Attainment (CIA, TEE/ESE)</span>
                                </div>
                            </button>
                            {expandedTopic === 'list_co' && (
                                <div className="p-4 bg-gray-50 text-xs text-gray-600 border-t border-gray-200 leading-relaxed space-y-3 animate-fadeIn">
                                    <ol className="list-decimal pl-4 space-y-1.5">
                                        <li>Select the curriculum from the 'Curriculum' drop-down list.</li>
                                        <li>Select the term from the 'Term' drop-down list.</li>
                                        <li>Select the course from the 'Course' drop-down list.</li>
                                        <li>Two different tabs are displayed.</li>
                                    </ol>
                                </div>
                            )}
                        </div>

                        {/* Topic 2: a. CIA Attainment */}
                        <div className="border border-gray-200 rounded-lg overflow-hidden transition-all shadow-sm">
                            <button
                                onClick={() => toggleTopic('cia_attainment')}
                                className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 transition text-sm font-semibold text-blue-600 focus:outline-none"
                            >
                                <div className="flex items-center gap-2">
                                    {expandedTopic === 'cia_attainment' ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                    <span>a. CIA Attainment</span>
                                </div>
                            </button>
                            {expandedTopic === 'cia_attainment' && (
                                <div className="p-4 bg-gray-50 text-xs text-gray-600 border-t border-gray-200 leading-relaxed space-y-3 animate-fadeIn">
                                    <ol className="list-decimal pl-4 space-y-1.5">
                                        <li>Select the Section from the drop-down list.</li>
                                        <li>Select the CIA (Internal Activities) Occasion from the drop-down list.</li>
                                        <li>Select the Student Department from the drop-down list.</li>
                                        <li>Select the 'View Student Details' link at the right top corner which navigated to the Student Details section.</li>
                                        <li>Click on 'View details' link in the column 'CO Code' under the 'Course Outcome (COs) Attainment' section to view the Course Outcome (COs) Assessment Details.</li>
                                    </ol>
                                </div>
                            )}
                        </div>

                        {/* Topic 3: b. Course - Attainment */}
                        <div className="border border-gray-200 rounded-lg overflow-hidden transition-all shadow-sm">
                            <button
                                onClick={() => toggleTopic('course_attainment')}
                                className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 transition text-sm font-semibold text-blue-600 focus:outline-none"
                            >
                                <div className="flex items-center gap-2">
                                    {expandedTopic === 'course_attainment' ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                    <span>b. Course - Attainment</span>
                                </div>
                            </button>
                            {expandedTopic === 'course_attainment' && (
                                <div className="p-4 bg-gray-50 text-xs text-gray-600 border-t border-gray-200 leading-relaxed space-y-3 animate-fadeIn">
                                    <ol className="list-decimal pl-4 space-y-1.5">
                                        <li>Select the Occasion Type from the 'Type' drop-down list.</li>
                                        <li>Select the Student Department from the drop-down list.</li>
                                        <li>Select the 'Export .doc' button to export the attainment details in the Word format.</li>
                                    </ol>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Other Links */}
                <div className="pt-2">
                    <h4 className="text-sm font-bold text-gray-800 mb-2 uppercase tracking-wider">Other Links:</h4>
                    <div className="flex justify-center py-2">
                        <a
                            href="#"
                            onClick={handleOtherLinkClick}
                            className="text-sm text-blue-600 hover:text-blue-800 hover:underline font-semibold"
                        >
                            Course - CO Attainment (CIA, MTE, TEE/ESE)
                        </a>
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

export default FirstYearWebHelpModal;

// src/pages/ioncudos/attainment/consolidatedPOAttainment/ConsolidatedPOWebHelpModal.tsx

import React, { useState } from 'react';
import ModalContainer from '../../../../components/Modal/ModalContainer';
import { ChevronDown, ChevronRight, X } from 'lucide-react';

interface Props {
    open: boolean;
    onClose: () => void;
}

const ConsolidatedPOWebHelpModal: React.FC<Props> = ({ open, onClose }) => {
    const [expandedTopic, setExpandedTopic] = useState<string | null>(null);

    const toggleTopic = (topic: string) => {
        setExpandedTopic(expandedTopic === topic ? null : topic);
    };

    return (
        <ModalContainer
            isOpen={open}
            onClose={onClose}
            title="IonCUDOS Help And Support - Consolidated PO Level Attainment"
            size="lg"
        >
            <div className="flex flex-col text-left space-y-6">
                {/* Intro Description */}
                <div className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <div className="font-bold text-gray-800 mb-1 border-b pb-1">
                        Consolidated PO Level Attainment
                    </div>
                    The User is allowed to calculate the Consolidate Attainment of PO for the respective Term.
                </div>

                {/* Help Topics */}
                <div>
                    <h4 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wider">Help Topics:</h4>
                    <div className="space-y-3">
                        {/* Topic: List Consolidated Attainment */}
                        <div className="border border-gray-200 rounded-lg overflow-hidden transition-all shadow-sm">
                            <button
                                onClick={() => toggleTopic('list_attainment')}
                                className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 transition text-sm font-semibold text-blue-600 focus:outline-none"
                            >
                                <div className="flex items-center gap-2">
                                    {expandedTopic === 'list_attainment' ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                    <span>List Consolidated Attainment</span>
                                </div>
                            </button>
                            {expandedTopic === 'list_attainment' && (
                                <div className="p-4 bg-gray-50 text-xs text-gray-600 border-t border-gray-200 leading-relaxed space-y-3 animate-fadeIn">
                                    <ol className="list-decimal pl-4 space-y-2">
                                        <li>Select the curriculum from the 'Curriculum' drop-down list.</li>
                                        <li>Select the First Year Curriculum from the drop-down list.</li>
                                        <li>Select the term from the 'Term' drop-down list, which displays the PO Attainment.</li>
                                        <li>Select the drill down link, which displays the PO Attainment value for individual courses.</li>
                                    </ol>
                                </div>
                            )}
                        </div>
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

export default ConsolidatedPOWebHelpModal;

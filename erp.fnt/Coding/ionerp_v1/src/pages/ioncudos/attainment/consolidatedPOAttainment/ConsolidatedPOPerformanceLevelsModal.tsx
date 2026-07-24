// src/pages/ioncudos/attainment/consolidatedPOAttainment/ConsolidatedPOPerformanceLevelsModal.tsx

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import ModalContainer from '../../../../components/Modal/ModalContainer';
import ConsolidatedPOWebHelpModal from './ConsolidatedPOWebHelpModal';
import { fetchPerformanceLevels, PerformanceLevel } from './ConsolidatedPOApi';
import { toast } from 'react-toastify';

interface Props {
    open: boolean;
    onClose: () => void;
    poId: number | null;
    poCode: string;
    poStatement: string;
    status?: string;
}

const poTitleMap: Record<string, string> = {
    PO1: '1 : Knowledge Base for Engineering',
    PO2: '2 : Problem Analysis',
    PO3: '3 : Design/Development of Solutions',
    PO4: '4 : Conduct Investigations of Complex Problems',
    PO5: '5 : Modern Tool Usage',
    '1': '1 : Knowledge Base for Engineering',
    '2': '2 : Problem Analysis',
    '3': '3 : Design/Development of Solutions',
    '5': '5 : Modern Tool Usage',
    '10': '10 : Communication',
    '14': '14 : Life-long Learning'
};

const ConsolidatedPOPerformanceLevelsModal: React.FC<Props> = ({
    open,
    onClose,
    poId,
    poCode,
    poStatement,
    status
}) => {
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [levels, setLevels] = useState<PerformanceLevel[]>([]);
    const isViewLevels = status ? status.toLowerCase().includes('view') : false;

    useEffect(() => {
        if (open && poId !== null) {
            const loadData = async () => {
                setLoading(true);
                try {
                    const data = await fetchPerformanceLevels(poId);
                    setLevels(data);
                } catch (err) {
                    console.error("Failed to load performance levels:", err);
                    toast.error("Failed to load performance level details.");
                } finally {
                    setLoading(false);
                }
            };
            loadData();
        } else {
            setLevels([]);
        }
    }, [open, poId]);

    return (
        <>
            <ModalContainer
                isOpen={open}
                onClose={onClose}
                title="View Performance Levels"
                size="xl"
                onHelpClick={() => setIsHelpOpen(true)}
            >
                <div className="text-left space-y-6">
                    {/* Subtitle / Context Header */}
                    <div>
                        <span className="text-sm font-bold text-gray-800 uppercase tracking-wide block">Program Outcome:</span>
                        <div className="text-sm font-semibold text-gray-700 mt-1">
                            {poTitleMap[poCode] || `${poCode} : ${poStatement}`}
                        </div>
                    </div>

                    <div className="border-t border-gray-200" />

                    {loading ? (
                        <div className="py-12 flex items-center justify-center">
                            <span className="text-sm font-bold text-gray-500">Loading performance levels...</span>
                        </div>
                    ) : isViewLevels || levels.length === 0 ? (
                        <div className="py-12 flex items-center justify-center">
                            <span className="text-sm font-bold text-gray-500">
                                No Performance Levels found for this Program Outcome (PO)
                            </span>
                        </div>
                    ) : (
                        /* Levels Data Table */
                        <div className="border border-slate-300 rounded-md overflow-hidden bg-white shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-center border-collapse">
                                    <thead className="bg-slate-100 text-[11px] text-slate-700 uppercase font-bold border-b border-slate-300">
                                        <tr>
                                            <th className="px-3 py-3 border-r border-slate-200 text-center w-16">Sl.No</th>
                                            <th className="px-3 py-3 border-r border-slate-200 text-center">Level Name</th>
                                            <th className="px-3 py-3 border-r border-slate-200 text-center">Level Value</th>
                                            <th className="px-3 py-3 border-r border-slate-200 text-center">Start Range</th>
                                            <th className="px-3 py-3 border-r border-slate-200 text-center w-12"></th>
                                            <th className="px-3 py-3 border-r border-slate-200 text-center">End Range</th>
                                            <th className="px-3 py-3 text-center">Description</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {levels.map((lvl, index) => (
                                            <tr key={lvl.performance_level_name_alias + index} className="hover:bg-slate-50 transition-colors text-sm">
                                                <td className="px-3 py-2.5 border-r border-slate-100 text-center text-slate-500 font-mono text-xs">
                                                    {index + 1}
                                                </td>
                                                <td className="px-3 py-2.5 border-r border-slate-100 text-center text-slate-700 font-medium">
                                                    {lvl.performance_level_name_alias}
                                                </td>
                                                <td className="px-3 py-2.5 border-r border-slate-100 text-center text-slate-800 font-semibold">
                                                    {lvl.performance_level_value}
                                                </td>
                                                <td className="px-3 py-2.5 border-r border-slate-100 text-center text-slate-600 font-medium">
                                                    {lvl.start_range.toFixed(2)}
                                                </td>
                                                <td className="px-2 py-2.5 border-r border-slate-100 text-center text-slate-400 font-bold text-xs">
                                                    {lvl.conditional_opr}
                                                </td>
                                                <td className="px-3 py-2.5 border-r border-slate-100 text-center text-slate-600 font-medium">
                                                    {lvl.end_range.toFixed(2)}
                                                </td>
                                                <td className="px-3 py-2.5 text-center text-slate-700">
                                                    {lvl.description}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Bottom Red Close Button */}
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

            {/* Support Help Modal */}
            <ConsolidatedPOWebHelpModal
                open={isHelpOpen}
                onClose={() => setIsHelpOpen(false)}
            />
        </>
    );
};

export default ConsolidatedPOPerformanceLevelsModal;

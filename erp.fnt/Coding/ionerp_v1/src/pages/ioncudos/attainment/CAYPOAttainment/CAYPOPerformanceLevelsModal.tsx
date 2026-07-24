import React, { useState } from 'react';
import { X } from 'lucide-react';
import ModalContainer from '../../../../components/Modal/ModalContainer';
import CAYPOWebHelpModal from './CAYPOWebHelpModal';

interface Props {
    open: boolean;
    onClose: () => void;
    poCode: string;
    seriesName: string;
}

const CAYPOPerformanceLevelsModal: React.FC<Props> = ({
    open,
    onClose,
    poCode,
    seriesName
}) => {
    const [isHelpOpen, setIsHelpOpen] = useState(false);

    // Performance Level Definitions Data matching the user's reference image
    const levels = [
        { sl: 1, name: 'Exceeds Criterion', value: 3, start: '2.50', op: '>=', end: '3.00', desc: 'Exceeds Criterion' },
        { sl: 2, name: 'Meets Criterion', value: 2, start: '2.00', op: '>=', end: '2.50', desc: 'Meets Criterion' },
        { sl: 3, name: 'Progressing', value: 1, start: '1.00', op: '>=', end: '1.50', desc: 'Progressing' },
        { sl: 4, name: 'Below Criterion', value: 0, start: '0.00', op: '>=', end: '1.00', desc: 'Below Criterion' }
    ];

    const poNumber = poCode.replace('PO', '');

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
                    {/* Curriculum & Program Outcome Info */}
                    <div className="space-y-4">
                        <div>
                            <div className="text-sm font-semibold text-gray-700">
                                Curriculum : <span className="font-normal text-gray-600">{seriesName}</span>
                            </div>
                        </div>
                        <div>
                            <span className="text-sm font-bold text-gray-800 uppercase tracking-wide block">
                                Program Outcome:
                            </span>
                            <div className="text-sm font-semibold text-gray-700 mt-1">
                                {poCode} : PO Statement: {poNumber}
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-200" />

                    {/* Levels Data Table */}
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
                                    {levels.map((lvl) => (
                                        <tr key={lvl.sl} className="hover:bg-slate-50 transition-colors text-sm">
                                            <td className="px-3 py-2.5 border-r border-slate-100 text-center text-slate-500 font-mono text-xs">
                                                {lvl.sl}
                                            </td>
                                            <td className="px-3 py-2.5 border-r border-slate-100 text-center text-slate-700 font-medium">
                                                {lvl.name}
                                            </td>
                                            <td className="px-3 py-2.5 border-r border-slate-100 text-center text-slate-800 font-semibold">
                                                {lvl.value}
                                            </td>
                                            <td className="px-3 py-2.5 border-r border-slate-100 text-center text-slate-600 font-medium">
                                                {lvl.start}
                                            </td>
                                            <td className="px-2 py-2.5 border-r border-slate-100 text-center text-slate-400 font-bold text-xs">
                                                {lvl.op}
                                            </td>
                                            <td className="px-3 py-2.5 border-r border-slate-100 text-center text-slate-600 font-medium">
                                                {lvl.end}
                                            </td>
                                            <td className="px-3 py-2.5 text-center text-slate-700">
                                                {lvl.desc}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Bottom Red Close Button */}
                    <div className="flex justify-end pt-4 border-t border-gray-200">
                        <button
                            onClick={onClose}
                            className="flex items-center gap-2 px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-semibold transition active:scale-95 shadow-sm"
                        >
                            <X size={14} className="stroke-[3]" /> Close
                    </button>
                    </div>
                </div>
            </ModalContainer>

            <CAYPOWebHelpModal
                open={isHelpOpen}
                onClose={() => setIsHelpOpen(false)}
            />
        </>
    );
};

export default CAYPOPerformanceLevelsModal;

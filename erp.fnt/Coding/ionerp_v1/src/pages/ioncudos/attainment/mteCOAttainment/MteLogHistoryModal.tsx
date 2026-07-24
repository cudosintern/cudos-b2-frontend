import React from 'react';
import ModalContainer from '../../../../components/Modal/ModalContainer';

interface Props {
    open: boolean;
    onClose: () => void;
    logs?: any[];
}

const MteLogHistoryModal: React.FC<Props> = ({ open, onClose, logs = [] }) => {
    return (
        <ModalContainer
            isOpen={open}
            onClose={onClose}
            title="Log History for CO Attainment (MTE)"
            size="xl"
        >
            <div className="flex flex-col text-left">
                {logs.length === 0 ? (
                    <div className="py-6 text-sm font-semibold text-gray-900 border-b pb-4 mb-4">
                        Log history not available.
                    </div>
                ) : (
                    <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm mb-4">
                        <table className="min-w-full divide-y divide-gray-200 bg-white">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Action</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">User</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {logs.map((log: any, idx: number) => (
                                    <tr key={idx} className="hover:bg-gray-50 transition">
                                        <td className="px-4 py-3 text-sm text-gray-700">{log.action}</td>
                                        <td className="px-4 py-3 text-sm text-gray-950 font-medium">{log.username}</td>
                                        <td className="px-4 py-3 text-sm text-gray-500">{log.date}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Close Button */}
                <div className="flex justify-end">
                    <button
                        onClick={onClose}
                        className="flex items-center gap-2 px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-semibold transition shadow-sm"
                    >
                        <span className="font-bold text-sm">✖</span> Close
                    </button>
                </div>
            </div>
        </ModalContainer>
    );
};

export default MteLogHistoryModal;

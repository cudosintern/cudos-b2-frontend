import React from 'react';
import { FaCheck, FaTimes, FaSpinner } from 'react-icons/fa';

interface ActionFooterProps {
    onAccept: () => void;
    onCancel: () => void;
    canAccept: boolean;
    isProcessing: boolean;
}

const ActionFooter: React.FC<ActionFooterProps> = ({
    onAccept,
    onCancel,
    canAccept,
    isProcessing
}) => {
    return (
        <div className="px-10 py-6 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-4">
            <button
                onClick={onCancel}
                disabled={isProcessing}
                className="px-6 py-2.5 bg-white hover:bg-red-50 text-red-500 border border-red-100 font-bold rounded-xl transition-all shadow-sm active:scale-95 text-sm flex items-center gap-2 hover:border-red-200"
            >
                <FaTimes size={14} />
                Cancel & Back
            </button>
            
            <button
                onClick={onAccept}
                disabled={!canAccept || isProcessing}
                className={`px-8 py-2.5 rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2 text-sm
                    ${canAccept && !isProcessing ? "bg-[#4a8494] hover:bg-[#3d6d7a] text-white active:scale-95 hover:shadow-lg" : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none border border-slate-300"}
                `}
            >
                {isProcessing ? (
                    <FaSpinner className="animate-spin" size={14} />
                ) : (
                    <FaCheck size={14} />
                )}
                {isProcessing ? 'Processing...' : 'Accept & Finalize'}
            </button>
        </div>
    );
};

export default ActionFooter;

import React from 'react';
// Triggering re-compile
import { FaCloudUploadAlt, FaTimes } from 'react-icons/fa';

interface MTEUploadHeaderProps {
    title: string;
    onClose: () => void;
    data: {
        academic_batch_code?: string;
        term_name?: string;
        crs_code?: string;
        section?: string;
        ao_name?: string;
        school?: string;
        program?: string;
        curriculum?: string;
        term?: string;
        course?: string;
    } | null;
}

const MTEUploadHeader: React.FC<MTEUploadHeaderProps> = ({ title, onClose, data }) => {
    return (
        <div className="flex flex-col">
            {/* Title Bar - Matching the dark gradient seen in Manage MTE Page */}
            <div className="px-10 py-4 bg-gradient-to-br from-[#1e293b] to-[#334155] flex justify-between items-center shadow-lg">
                <h2 className="text-base font-bold text-white flex items-center gap-3">
                    <FaCloudUploadAlt className="text-[#4a8494]" /> {title}
                </h2>
                <button 
                    className="text-white opacity-60 hover:opacity-100 transition-all bg-white/10 hover:bg-white/20 p-2 rounded-full" 
                    onClick={onClose}
                    title="Close and go back"
                >
                    <FaTimes size={16} />
                </button>
            </div>

            {/* Metadata Info Grid */}
            <div className="px-10 py-8 bg-white">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="space-y-1">
                        <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider font-mono">Curriculum / Term</div>
                        <div className="font-bold text-slate-700 text-sm">
                            {data?.academic_batch_code || data?.curriculum || 'N/A'} / {data?.term_name || data?.term || 'N/A'}
                        </div>
                    </div>
                    <div className="space-y-1">
                        <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider font-mono">Course / Section</div>
                        <div className="font-bold text-slate-700 text-sm">
                            {data?.crs_code || data?.course || 'N/A'} / {data?.section || 'All Sections'}
                        </div>
                    </div>
                    <div className="space-y-1">
                        <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider font-mono">Assessment Occasion</div>
                        <div className="font-bold text-[#4a8494] text-sm">{data?.ao_name || 'MTE (Mid-Term Exam)'}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MTEUploadHeader;

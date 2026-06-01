import React from 'react';
import { FaCloudUploadAlt, FaFileExcel, FaSpinner } from 'react-icons/fa';

interface FileUploadZoneProps {
    selectedFile: File | null;
    isUploading: boolean;
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onUpload: () => void;
}

const FileUploadZone: React.FC<FileUploadZoneProps> = ({
    selectedFile,
    isUploading,
    onFileChange,
    onUpload
}) => {
    return (
        <div className="px-10 pb-10">
            <div className="max-w-4xl mx-auto">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 block ml-1 font-mono">
                    Student Marks Data (.xls / .xlsx)
                </label>
                
                <div className="flex flex-col md:flex-row gap-4 p-8 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 group hover:border-[#4a8494] transition-all duration-300 shadow-inner">
                    <div className="flex-1 bg-white border border-slate-200 rounded-[1.25rem] px-5 py-3.5 flex items-center justify-between shadow-sm group-hover:border-blue-100 transition-colors">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <FaFileExcel className={selectedFile ? "text-emerald-500 shrink-0" : "text-slate-300 shrink-0"} size={18} />
                            <span className={selectedFile ? "text-slate-700 font-bold text-sm truncate" : "text-slate-400 italic text-sm truncate"}>
                                {selectedFile ? selectedFile.name : "Select your student marks file..."}
                            </span>
                        </div>
                        
                        <label className={`cursor-pointer px-5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm border
                            ${isUploading ? "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed" : "bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200"}
                        `}>
                            Choose File
                            <input 
                                type="file" 
                                className="hidden" 
                                accept=".xls,.xlsx" 
                                onChange={onFileChange} 
                                disabled={isUploading}
                            />
                        </label>
                    </div>
                    
                    <button
                        onClick={onUpload}
                        disabled={!selectedFile || isUploading}
                        className={`px-8 py-3 rounded-2xl font-bold transition-all shadow-md flex items-center justify-center gap-3 text-sm min-w-[160px]
                            ${selectedFile && !isUploading ? "bg-[#4a8494] hover:bg-[#3d6d7a] text-white active:scale-95 hover:shadow-lg" : "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"}
                        `}
                    >
                        {isUploading ? (
                            <FaSpinner className="animate-spin" size={18} />
                        ) : (
                            <FaCloudUploadAlt size={20} />
                        )}
                        {isUploading ? 'Processing...' : 'Upload Now'}
                    </button>
                </div>

                {selectedFile && !isUploading && (
                    <div className="mt-4 flex items-center justify-center gap-2 animate-pulse">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-tighter">File ready for validation</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FileUploadZone;

import React, { useState } from 'react';
import { FaTimes, FaCloudUploadAlt, FaFileDownload, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import { uploadQpFile } from './CiaQpApi';

interface CiaQpUploadModalProps {
    data: any;
    onClose: () => void;
    onUploadSuccess: () => void;
}

const CiaQpUploadModal: React.FC<CiaQpUploadModalProps> = ({ data, onClose, onUploadSuccess }) => {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setMessage(null);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setMessage({ type: 'error', text: 'Please select a file first' });
            return;
        }

        setUploading(true);
        setMessage(null);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('qp_id', data.qpd_id || data.ao_id); // Fallback to ao_id if qpd_id not present

        try {
            const res = await uploadQpFile(formData);
            if (res.status) {
                setMessage({ type: 'success', text: 'Question Paper uploaded successfully!' });
                setTimeout(() => {
                    onUploadSuccess();
                    onClose();
                }, 1500);
            } else {
                setMessage({ type: 'error', text: res.message || 'Upload failed' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Server error during upload. Please try again.' });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[9999] flex items-center justify-center p-4 md:p-10">
            <div className="bg-white rounded-[1.5rem] shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-in border border-white">
                {/* Header */}
                <div className="px-10 py-6 border-b border-gray-100 flex justify-between items-center bg-white">
                    <h2 className="text-xl font-bold text-[#4a8494] flex items-center gap-3">
                        <FaCloudUploadAlt className="text-[#4a8494]" /> Upload CIA Question Paper
                    </h2>
                    <button className="text-slate-400 hover:text-red-500 transition-colors" onClick={onClose}>
                        <FaTimes size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-10">
                    {/* Breadcrumbs Info Bar */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10 p-6 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                        <div className="space-y-1">
                            <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Curriculum / Term</div>
                            <div className="font-bold text-slate-700 text-sm">
                                {data.academic_batch_code || 'N/A'} / {data.term_name || 'N/A'}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Course / Section</div>
                            <div className="font-bold text-slate-700 text-sm">
                                {data.crs_code || 'N/A'} / {data.section || 'All'}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Assessment Occasion</div>
                            <div className="font-bold text-[#4a8494] text-sm">{data.ao_name || 'N/A'}</div>
                        </div>
                    </div>

                    {/* Steps Section */}
                    <div className="mb-12">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-1.5 h-6 bg-[#4a8494] rounded-full"></div>
                            <h3 className="text-lg font-bold text-slate-700">Steps to follow:</h3>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="flex gap-4 p-5 rounded-2xl border border-slate-100 bg-white hover:border-blue-100 transition-all group">
                                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold shrink-0">1</div>
                                <div>
                                    <p className="text-slate-600 leading-relaxed">
                                        Click here to <a 
                                            href="/Standard_Question_Paper_Template.xls" 
                                            download="Standard_Question_Paper_Template.xls"
                                            className="font-bold text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1"
                                        >
                                            <FaFileDownload size={12} /> Download Question Paper Template
                                        </a>
                                    </p>
                                    <p className="text-[11px] text-slate-400 mt-1 italic font-medium">(File name: Standard_Question_Paper_Template.xls)</p>
                                </div>
                            </div>

                            <div className="flex gap-4 p-5 rounded-2xl border border-slate-100 bg-white hover:border-blue-100 transition-all">
                                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold shrink-0">2</div>
                                <div>
                                    <p className="text-slate-600 leading-relaxed">
                                        Enter the <span className="font-bold text-slate-800 underline decoration-slate-200 underline-offset-4">Course Code, Exam Type (CIA, MTE, TEE)</span>, Questions and corresponding mappings (COs, Bloom Level, Topic) and Click on "Choose File" button below.
                                    </p>
                                    <p className="text-[11px] text-rose-500 mt-2 font-bold flex items-center gap-1.5 uppercase tracking-tight">
                                        <FaExclamationCircle /> Discard previous downloaded file before downloading new file
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4 p-5 rounded-2xl border border-slate-100 bg-white hover:border-blue-100 transition-all">
                                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold shrink-0">3</div>
                                <p className="text-slate-600 leading-relaxed py-1.5">
                                    Click on <span className="font-bold text-slate-800">"Upload"</span> button to upload the Questions Paper.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Upload Field Area */}
                    <div className="max-w-3xl mx-auto mb-6">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 block ml-1">Question Paper File (.xls)</label>
                        <div className="flex flex-col md:flex-row gap-4 p-8 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 group hover:border-[#4a8494] transition-all duration-300">
                            <div className="flex-1 bg-white border border-slate-200 rounded-[1.25rem] px-5 py-3.5 flex items-center justify-between shadow-sm">
                                <span className={file ? "text-slate-700 font-bold text-sm" : "text-slate-400 italic text-sm"}>
                                    {file ? file.name : "No file selected..."}
                                </span>
                                <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-600 px-5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm border border-slate-200">
                                    Choose File
                                    <input type="file" className="hidden" accept=".xls,.xlsx" onChange={handleFileChange} />
                                </label>
                            </div>
                            
                            <button
                                onClick={handleUpload}
                                disabled={!file || uploading}
                                className={`px-8 py-2 rounded font-medium transition-all shadow-sm flex items-center justify-center gap-2 text-sm
                                    ${file && !uploading ? "bg-[#4a8494] hover:bg-[#3d6d7a] text-white active:scale-95" : "bg-slate-100 text-slate-400 cursor-not-allowed"}
                                `}
                            >
                                {uploading ? (
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                ) : (
                                    <FaCloudUploadAlt size={16} />
                                )}
                                {uploading ? 'Processing...' : 'Upload Now'}
                            </button>
                        </div>
                        
                        {message && (
                            <div className={`mt-8 p-5 rounded-2xl flex items-center gap-4 animate-slide-up-fade shadow-sm
                                ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}
                            `}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${message.type === 'success' ? 'bg-emerald-100' : 'bg-red-100'}`}>
                                    {message.type === 'success' ? <FaCheckCircle /> : <FaExclamationCircle />}
                                </div>
                                <span className="font-bold text-sm tracking-tight">{message.text}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-10 py-6 bg-slate-50/50 border-t border-slate-100 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-[#ef4444] hover:bg-red-600 text-white font-medium rounded transition-all shadow-sm active:scale-95 text-sm"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CiaQpUploadModal;

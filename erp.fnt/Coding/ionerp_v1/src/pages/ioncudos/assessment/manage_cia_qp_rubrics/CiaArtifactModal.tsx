import React, { useState, useEffect } from 'react';
import './CiaQp.css';
import '../cia/cia.css';
import { 
    FaTimes, FaCloudUploadAlt, FaFilePdf, 
    FaEye, FaExclamationCircle, FaFolderOpen 
} from 'react-icons/fa';
import { deleteQpFile, getQpFileUrl, uploadQpFile } from './CiaQpApi';

interface CiaArtifactModalProps {
    targetAo: any;
    onClose: () => void;
}

const CiaArtifactModal: React.FC<CiaArtifactModalProps> = ({ targetAo, onClose }) => {
    const [uploading, setUploading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [artifacts, setArtifacts] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (targetAo.qp_file) {
            setArtifacts([targetAo.qp_file]);
        }
    }, [targetAo]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError(null);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setError("Please select a file to upload.");
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('ao_id', targetAo.ao_id);
        formData.append('crs_id', targetAo.crs_id);
        formData.append('academic_batch_id', targetAo.academic_batch_id);
        formData.append('semester_id', targetAo.semester_id);
        formData.append('qpd_type', targetAo.ao_type_id);
        if (targetAo.qpd_id) formData.append('qpd_id', targetAo.qpd_id);

        try {
            const res = await uploadQpFile(formData);
            if (res.status) {
                const newArtifact = {
                    id: res.data.doc_id || res.data.id,
                    file_name: res.data.file_name || file.name,
                    upload_date: new Date().toLocaleDateString()
                };
                setArtifacts(prev => [...prev, newArtifact]);
                setFile(null);
                alert("File uploaded successfully.");
            } else {
                setError(res.message || "Upload failed.");
            }
        } catch (err: any) {
            setError(err.response?.data?.detail || "An error occurred during upload.");
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (docId: number) => {
        if (!window.confirm("Are you sure you want to delete this artifact?")) return;
        try {
            const res = await deleteQpFile(docId);
            if (res.status) {
                setArtifacts(prev => prev.filter(a => (a.id || a.doc_id) !== docId));
                alert("Artifact deleted successfully.");
            }
        } catch (err) { alert("Failed to delete artifact."); }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-6">
            <div className="bg-white rounded-[1.5rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col animate-scale-in border border-white">
                {/* Header */}
                <div className="px-10 py-6 border-b border-gray-100 flex justify-between items-center bg-white">
                    <h2 className="text-xl font-bold text-[#4a8494] flex items-center gap-3">
                        <FaFolderOpen className="text-[#4a8494]" /> ARTIFACT REPOSITORY
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <FaTimes size={20} />
                    </button>
                </div>

                <div className="p-10">
                    <div className="bg-slate-50 p-5 rounded-2xl mb-8 border border-slate-100 flex items-center justify-between">
                        <div>
                            <div className="text-[10px] font-bold text-[#4a8494] uppercase tracking-widest mb-1">Context Assessment</div>
                            <div className="text-sm font-bold text-gray-900">{targetAo.ao_name}</div>
                        </div>
                        <span className="px-4 py-1.5 bg-white rounded-xl text-[10px] font-bold text-[#4a8494] border border-slate-200 shadow-sm uppercase">
                            {targetAo.crs_code}
                        </span>
                    </div>

                    <div className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all ${file ? 'border-emerald-400 bg-emerald-50/20' : 'border-slate-200 hover:border-[#4a8494] hover:bg-slate-50'}`}>
                        <input type="file" id="artifact-upload" className="hidden" onChange={handleFileChange} accept=".pdf,.doc,.docx" />
                        <label htmlFor="artifact-upload" className="cursor-pointer flex flex-col items-center">
                            <FaCloudUploadAlt className={`text-5xl mb-4 ${file ? 'text-emerald-500' : 'text-slate-300'}`} />
                            <div className="text-sm font-bold text-slate-700">{file ? file.name : 'Click to select or drag & drop file'}</div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase mt-2">Accepted: PDF, DOCX (Max 10MB)</div>
                        </label>
                    </div>

                    {error && (
                        <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-xs font-bold animate-shake">
                            <FaExclamationCircle /> {error}
                        </div>
                    )}

                    <button className="w-full mt-8 py-4 bg-[#4a8494] hover:bg-[#3d6d7a] text-white rounded-xl font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2 group" onClick={handleUpload} disabled={!file || uploading}>
                        {uploading ? (
                            <span className="flex items-center gap-2">Processing...</span>
                        ) : (
                            <>Upload Artifact</>
                        )}
                    </button>

                    <div className="mt-12">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-5 border-b border-slate-100 pb-3 flex justify-between items-center">
                            <span>Documents Discovery</span>
                            <span className="text-[#4a8494] bg-slate-100 px-3 py-1 rounded-full">{artifacts.length} Found</span>
                        </div>
                        <div className="space-y-4 max-h-52 overflow-y-auto pr-2 custom-scrollbar">
                            {artifacts.map((art, i) => (
                                <div key={i} className="flex justify-between items-center bg-white border border-slate-100 p-4 rounded-2xl shadow-sm hover:shadow-md transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-[#4a8494] group-hover:bg-[#4a8494] group-hover:text-white transition-colors">
                                            <FaFilePdf size={20} />
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-slate-800 truncate max-w-[200px]">{art.file_name || 'Generic Artifact'}</div>
                                            <div className="text-[10px] text-slate-400 font-bold uppercase">{art.upload_date || 'Internal Ref'}</div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="p-2.5 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all" title="View" onClick={() => window.open(getQpFileUrl(art.id || art.doc_id), '_blank')}><FaEye size={16} /></button>
                                        <button className="p-2.5 text-slate-300 hover:text-red-600 hover:bg-rose-50 rounded-lg transition-all" title="Delete" onClick={() => handleDelete(art.id || art.doc_id)}><FaTimes size={16} /></button>
                                    </div>
                                </div>
                            ))}
                            {artifacts.length === 0 && (
                                <div className="text-center py-10 text-slate-300 italic text-sm font-medium border-2 border-dashed border-slate-50 rounded-2xl">No reference artifacts discovered.</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-10 py-6 bg-slate-50/50 border-t border-slate-100 flex justify-end">
                    <button 
                        className="px-6 py-2 bg-[#ef4444] hover:bg-red-600 text-white font-medium rounded transition-all shadow-sm active:scale-95 text-sm" 
                        onClick={onClose}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CiaArtifactModal;

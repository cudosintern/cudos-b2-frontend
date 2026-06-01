import React, { useState, useEffect } from 'react';
import axiosInstance from '../../../../utils/api';
import './cia.css';
import { FaArrowLeft, FaSave, FaTimes, FaSync } from 'react-icons/fa';
import { GoPencil } from 'react-icons/go';
import { toast } from 'react-toastify';
import ConfirmDialog from '../../../../components/Dialog/ConfirmDialog';
import CiaAssessmentOccasion from './CiaAssessmentOccasion';

interface CiaMainOccasionProps {
  data: any;
  onBack: () => void;
}

const CiaMainOccasion: React.FC<CiaMainOccasionProps> = ({ data, onBack }) => {
  const [mainOccasions, setMainOccasions] = useState<any[]>([]);
  const [occasionTypes, setOccasionTypes] = useState<any[]>([]);
  const [nextSlNo, setNextSlNo] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  
  const [formData, setFormData] = useState({
    ao_id: null,
    occasion_id: '',
    max_marks: '',
    min_marks: '',
    weightage: ''
  });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({
    cmot_id: null as number | null,
    occasion_id: '',
    max_marks: '',
    min_marks: '',
    weightage: ''
  });

  useEffect(() => {
    fetchMainOccasions();
    fetchOccasionTypes();
    fetchNextSlNo();
  }, [data]);

  const fetchMainOccasions = async () => {
    try {
      const res = await axiosInstance.get(`/assessments/manage_cia_occasion/main-occasion/grid-data?course_id=${data.crs_id || data.id}`);
      setMainOccasions((res.data as any).data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchOccasionTypes = async () => {
    try {
      const res = await axiosInstance.get('/assessments/manage_cia_occasion/cia-occasion-types');
      setOccasionTypes((res.data as any).data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchNextSlNo = async () => {
    try {
      const res = await axiosInstance.get(`/assessments/manage_cia_occasion/main-occasion/next-slno?course_id=${data.crs_id || data.id}`);
      setNextSlNo((res.data as any).data?.next_sl_no || '');
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async () => {
    if (!formData.occasion_id || !formData.max_marks) {
      toast.warning("Please fill required fields");
      return;
    }
    
    try {
      const payload = {
        cia_occasion_type_id: Number(formData.occasion_id),
        max_marks: Number(formData.max_marks),
        min_marks: Number(formData.min_marks) || 0,
        weightage: Number(formData.weightage) || 0,
        course_id: data.crs_id || data.id,
        term_id: data.term_id,
        section_id: data.section_id || null
      };

      await axiosInstance.post('/assessments/manage_cia_occasion/main-occasion/create', payload);
      resetForm();
      fetchMainOccasions();
      setRefreshKey(prev => prev + 1);
      toast.success("Main Occasion Saved Successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save main occasion");
    }
  };

  const handleUpdate = async () => {
    if (!editFormData.max_marks || !editFormData.min_marks || !editFormData.weightage) {
      toast.warning("Please fill required fields");
      return;
    }
    
    try {
      const payload = {
        cia_occasion_type_id: Number(editFormData.occasion_id),
        max_marks: Number(editFormData.max_marks),
        min_marks: Number(editFormData.min_marks) || 0,
        weightage: Number(editFormData.weightage) || 0,
        course_id: data.crs_id || data.id,
        term_id: data.term_id,
        section_id: data.section_id || null
      };

      if (editFormData.cmot_id) {
        await axiosInstance.put(`/assessments/manage_cia_occasion/main-occasion/update/${editFormData.cmot_id}`, payload);
        setIsEditModalOpen(false);
        fetchMainOccasions();
        setRefreshKey(prev => prev + 1);
        toast.success("Main Occasion Updated Successfully!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update main occasion");
    }
  };

  const handleEditOpen = (item: any) => {
    setEditFormData({
      cmot_id: item.cmot_id,
      occasion_id: item.cia_occasion_type_id?.toString() || '',
      max_marks: item.max_marks || '',
      min_marks: item.min_marks || '',
      weightage: item.weightage || ''
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = (id: any) => {
    setDeleteTargetId(id);
    setIsDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await axiosInstance.delete(`/assessments/manage_cia_occasion/main-occasion/delete/${deleteTargetId}`);
      fetchMainOccasions();
      setIsDeleteModalOpen(false);
      setDeleteTargetId(null);
      setRefreshKey(prev => prev + 1);
      toast.success("Main Occasion Deleted Successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete main occasion");
    }
  };

  const resetForm = () => {
    setFormData({ ao_id: null, occasion_id: '', max_marks: '', min_marks: '', weightage: '' });
    fetchNextSlNo();
  };

  return (
    <div className="">
      <h3 className="text-lg font-medium pb-5">
        Add / Edit Comprehensive Continuous Evaluation (CCE) Occasions
      </h3>

      <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm mb-8">
        {/* Course Info Section */}
        <h3 className="text-[#437880] text-base font-semibold border-b border-gray-100 pb-3 mb-6">Course Context Information</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 bg-[#f8fafc] p-6 rounded-xl border border-gray-100">
          <div>
            <label className="text-[10px] font-bold text-gray-400 tracking-widest block mb-1">Curriculum</label>
            <span className="text-sm font-bold text-gray-700">{data.curriculum || 'BE in Test 2021-2025'}</span>
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 tracking-widest block mb-1">Term</label>
            <span className="text-sm font-bold text-gray-700">{data.term_name || '1 - Semester'}</span>
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 tracking-widest block mb-1">Course</label>
            <span className="text-sm font-bold text-gray-700">{data.course_title} ({data.code})</span>
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 tracking-widest block mb-1">Course Type</label>
            <span className="text-sm font-bold text-gray-700">{data.course_type}</span>
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 tracking-widest block mb-1">Section/Division</label>
            <span className="text-sm font-bold text-gray-700">{data.section || 'A'}</span>
          </div>
        </div>

        {/* Main Occasion Types Section */}
        <h3 className="text-[#437880] text-base font-semibold border-b border-gray-100 pb-3 mb-6 mt-12">Main Occasion Types List</h3>
        <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm mb-8">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#f2f4f6] text-[#6b7280] font-bold text-[10px] tracking-widest uppercase border-b border-gray-300">
              <tr>
                <th className="px-6 py-4 border-r border-gray-200">Sl No.</th>
                <th className="px-6 py-4 border-r border-gray-200">Occasions</th>
                <th className="px-6 py-4 border-r border-gray-200">Max. Marks</th>
                <th className="px-6 py-4 border-r border-gray-200">Min. Marks</th>
                <th className="px-6 py-4 border-r border-gray-200">Weightage</th>
                <th className="px-6 py-4 border-r border-gray-200 text-center">Edit</th>
                <th className="px-6 py-4 text-center">Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {mainOccasions.map((row, idx) => (
                <tr key={row.cmot_id || idx} className="hover:bg-[#f9fafb] transition-colors group">
                  <td className="px-6 py-4 text-xs font-bold text-gray-400 border-r border-gray-50">{row.sl_no || idx + 1}</td>
                  <td className="px-6 py-4 text-xs font-semibold text-gray-700 border-r border-gray-50">{row.occasions}</td>
                  <td className="px-6 py-4 text-xs text-gray-600 border-r border-gray-50">{row.max_marks}</td>
                  <td className="px-6 py-4 text-xs text-gray-600 border-r border-gray-50">{row.min_marks}</td>
                  <td className="px-6 py-4 text-xs font-bold text-[#437880] border-r border-gray-50">{row.weightage}%</td>
                  <td className="px-6 py-4 text-center border-r border-gray-50">
                    <GoPencil 
                      size={18} 
                      className="cursor-pointer text-yellow-600 hover:scale-110 transition-transform mx-auto" 
                      onClick={() => handleEditOpen(row)} 
                    />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <FaTimes 
                      size={18} 
                      className="cursor-pointer text-rose-500 hover:scale-110 transition-transform mx-auto" 
                      onClick={() => handleDelete(row.cmot_id)} 
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add Main Occasion Section */}
        <h3 className="text-[#437880] text-base font-semibold border-b border-gray-100 pb-3 mb-6 mt-12">Add Main Occasion Type</h3>
        <div className="p-4 bg-amber-50 border-l-4 border-amber-400 rounded-r-lg mb-8">
          <p className="text-[11px] text-amber-800 leading-relaxed font-medium transition-all">
            <span className="font-bold uppercase tracking-tight">Note:</span> Course level max marks : 50 | 
            The Allocated Main Occasion max marks sum should be equal to the Course level max marks.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-start">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-600 tracking-tight">SI No. *</label>
            <input className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded text-sm text-gray-500 font-bold outline-none" value={nextSlNo} readOnly />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-600 tracking-tight">Occasions *</label>
            <select className="w-full px-3 py-2 bg-white border border-gray-300 rounded outline-none text-sm transition-all focus:border-[#437880] focus:ring-1 focus:ring-[#437880]" value={formData.occasion_id} onChange={(e) => setFormData({...formData, occasion_id: e.target.value})}>
              <option value="">Select Main Occasion</option>
              {occasionTypes.map(t => <option key={t.cia_occasion_type_id} value={t.cia_occasion_type_id}>{t.cia_occasion_type_code}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-600 tracking-tight">Max. Marks *</label>
            <input className="w-full px-3 py-2 bg-white border border-gray-300 rounded outline-none text-sm transition-all focus:border-[#437880] focus:ring-1 focus:ring-[#437880]" value={formData.max_marks} onChange={(e) => setFormData({...formData, max_marks: e.target.value})} type="number" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-600 tracking-tight">Min. Marks *</label>
            <input className="w-full px-3 py-2 bg-white border border-gray-300 rounded outline-none text-sm transition-all focus:border-[#437880] focus:ring-1 focus:ring-[#437880]" value={formData.min_marks} onChange={(e) => setFormData({...formData, min_marks: e.target.value})} type="number" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-600 tracking-tight">Weightage *</label>
            <input className="w-full px-3 py-2 bg-white border border-gray-300 rounded outline-none text-sm transition-all focus:border-[#437880] focus:ring-1 focus:ring-[#437880]" value={formData.weightage} onChange={(e) => setFormData({...formData, weightage: e.target.value})} type="number" />
          </div>
        </div>
        <div className="flex justify-end mt-10 gap-3 border-t border-gray-100 pt-8">
          <button className="px-6 py-2 bg-[#437880] text-white rounded font-bold text-sm hover:bg-[#386269] transition-all flex items-center gap-2 shadow-sm" onClick={handleSave}>
            <FaSave /> Save
          </button>
          <button className="px-6 py-2 bg-[#d48c00] text-white rounded font-bold text-sm hover:bg-[#b87a00] transition-all flex items-center gap-2 shadow-sm" onClick={resetForm}>
            <FaSync size={14} /> Reset
          </button>
          <button className="px-6 py-2 bg-[#d9534f] text-white rounded font-bold text-sm hover:bg-[#c9302c] transition-all shadow-sm" onClick={onBack}>
            Cancel
          </button>
        </div>
      </div>

      {/* Assessment Occasions Nested Module */}
      <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
        <CiaAssessmentOccasion key={refreshKey} data={data} onBack={onBack} />
      </div>

      {/* Edit Main Occasion Form Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
             <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-[#f2f4f6]">
                <h4 className="text-sm font-semibold text-[#437880] uppercase tracking-wider">Edit Main Occasion Type</h4>
                <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-rose-500 transition-colors">
                  <FaTimes size={18} />
                </button>
             </div>
             
             <div className="p-8">
                <div className="space-y-6">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-600 uppercase tracking-tight text-gray-400">Max Marks <span className="text-red-500">*</span></label>
                    <input className="w-full px-3 py-2 border border-gray-300 rounded outline-none transition-all focus:border-[#437880] focus:ring-1 focus:ring-[#437880]" value={editFormData.max_marks} onChange={(e) => setEditFormData({...editFormData, max_marks: e.target.value})} type="number" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-600 uppercase tracking-tight text-gray-400">Min Marks <span className="text-red-500">*</span></label>
                    <input className="w-full px-3 py-2 border border-gray-300 rounded outline-none transition-all focus:border-[#437880] focus:ring-1 focus:ring-[#437880]" value={editFormData.min_marks} onChange={(e) => setEditFormData({...editFormData, min_marks: e.target.value})} type="number" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-600 uppercase tracking-tight text-gray-400">Weightage <span className="text-red-500">*</span></label>
                    <input className="w-full px-3 py-2 border border-gray-300 rounded outline-none transition-all focus:border-[#437880] focus:ring-1 focus:ring-[#437880]" value={editFormData.weightage} onChange={(e) => setEditFormData({...editFormData, weightage: e.target.value})} type="number" />
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 mt-10 pt-6 border-t border-gray-100">
                  <button type="button" className="px-6 py-2 bg-[#437880] text-white rounded font-bold text-sm hover:bg-[#386269] transition-all flex items-center gap-2 shadow-sm" onClick={handleUpdate}>
                    <FaSave /> Update
                  </button>
                  <button type="button" className="px-6 py-2 bg-[#d9534f] text-white rounded font-bold text-sm hover:bg-[#c9302c] transition-all" onClick={() => setIsEditModalOpen(false)}>
                    Cancel
                  </button>
                </div>
             </div>
          </div>
        </div>
      )}
      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={() => { setIsDeleteModalOpen(false); setDeleteTargetId(null); }}
        onConfirm={executeDelete}
        title="Confirm Delete"
        message="Are you sure you want to delete this record?"
      />
    </div>
  );
};

export default CiaMainOccasion;

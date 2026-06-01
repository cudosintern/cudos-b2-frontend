import React, { useState, useEffect } from 'react';
import axiosInstance from '../../../../utils/api';
import { useNavigate } from 'react-router-dom';
import './cia.css';
import { FaSave, FaTimes, FaUndo, FaArrowLeft, FaSync } from 'react-icons/fa';
import { GoPencil } from 'react-icons/go';
import { toast } from 'react-toastify';
import DataTable from '../../../../components/Table/DataTable';
import ConfirmDialog from '../../../../components/Dialog/ConfirmDialog';

interface CiaAssessmentOccasionProps {
  data: any;
  onBack: () => void;
}

const CiaAssessmentOccasion: React.FC<CiaAssessmentOccasionProps> = ({ data, onBack }) => {
  const navigate = useNavigate();
  const [listData, setListData] = useState<any[]>([]);
  const [aoMethods, setAoMethods] = useState<any[]>([]);
  const [assessmentTypes, setAssessmentTypes] = useState<any[]>([]);
  const [coMapping, setCoMapping] = useState<any[]>([]);
  const [bloomLevels, setBloomLevels] = useState<any[]>([]);
  const [mainOccasionTypes, setMainOccasionTypes] = useState<any[]>([]);
  const [subOccasionTypes, setSubOccasionTypes] = useState<any[]>([]);
  const [nextSlNo, setNextSlNo] = useState('');

  const [formData, setFormData] = useState({
    ao_id: null as number | null,
    main_ao_id: '',
    sub_ao_id: '',
    ao_method_id: '',
    assessment_type_id: '',
    co_ids: [] as number[],
    bl_ids: [] as number[],
    max_marks: '',
    direct: 1,
    section_id: data?.section_id || ''
  });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<any>(null);
  const [editSubOccasionTypes, setEditSubOccasionTypes] = useState<any[]>([]);
  const [editFormData, setEditFormData] = useState({
    sl_no: '',
    ao_id: null as number | null,
    main_ao_id: '',
    sub_ao_id: '',
    ao_method_id: '',
    assessment_type_id: '',
    co_ids: [] as number[],
    bl_ids: [] as number[],
    max_marks: '',
    direct: 1,
    section_id: data?.section_id || ''
  });

  const [showCoDropdown, setShowCoDropdown] = useState(false);
  const [showBlDropdown, setShowBlDropdown] = useState(false);
  const [showEditCoDropdown, setShowEditCoDropdown] = useState(false);
  const [showEditBlDropdown, setShowEditBlDropdown] = useState(false);

  const columnDefsGrid = React.useMemo(() => [
    { headerName: "Sl.No", valueGetter: "node.rowIndex + 1", width: 70, minWidth: 70, cellStyle: { textAlign: "center" }, pinned: 'left' },
    { headerName: "Main Occasion Type", field: "main_occasion_type", flex: 1.5, minWidth: 140 },
    { headerName: "Sub Occasion Type", field: "sub_occasion_type", flex: 1.5, minWidth: 140 },
    { headerName: "AO Method", field: "ao_method", flex: 1.2, minWidth: 120 },
    { headerName: "Assessment Type", field: "assessment_type", flex: 1.2, minWidth: 120 },
    { 
      headerName: "CO Mapping", 
      field: "co_mapping", 
      width: 150,
      cellRenderer: (params: any) => {
        const isPending = params.value === "CO Mapping Pending";
        return isPending ? (
          <span
            className="px-3 py-1 bg-orange-50 text-orange-600 text-[10px] font-bold rounded border border-orange-200 cursor-pointer hover:bg-orange-100 transition-colors"
            onClick={() => navigate('/assessment/manage_cia_qp')}
            title="Click to map COs"
          >
            {params.value}
          </span>
        ) : (
          <span className="px-3 py-1 bg-sky-50 text-sky-700 text-[10px] font-bold rounded border border-sky-100">{params.value}</span>
        );
      }
    },
    { 
      headerName: "BL Mapping", 
      field: "bl_mapping", 
      width: 150,
      cellRenderer: (params: any) => {
        const isPending = params.value === "BL Mapping Pending";
        return isPending ? (
          <span
            className="px-3 py-1 bg-orange-50 text-orange-600 text-[10px] font-bold rounded border border-orange-200 cursor-pointer hover:bg-orange-100 transition-colors"
            onClick={() => navigate('/assessment/manage_cia_qp')}
            title="Click to map BLs"
          >
            {params.value}
          </span>
        ) : (
          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded border border-emerald-100">{params.value}</span>
        );
      }
    },
    { headerName: "Max. Marks", field: "max_marks", width: 100 },
    { headerName: "Direct/Indirect", field: "direct_indirect", width: 120 },
    {
      headerName: "Edit",
      field: "edit",
      width: 60,
      cellRenderer: (params: any) => (
        <GoPencil
          size={18}
          onClick={() => handleEditOpen(params.data)}
          className='cursor-pointer text-yellow-600 hover:scale-110 transition-transform mx-auto'
        />
      ),
      cellStyle: { textAlign: "center" },
      filter: false,
      sortable: false,
    },
    {
      headerName: "Delete",
      field: "delete",
      width: 70,
      cellRenderer: (params: any) => (
        <FaTimes
          size={20}
          onClick={() => handleDelete(params.data.ao_id)}
          className='cursor-pointer text-rose-500 hover:scale-110 transition-transform mx-auto'
        />
      ),
      cellStyle: { textAlign: "center" },
      filter: false,
      sortable: false,
    }
  ], [coMapping, bloomLevels]);

  const getSelectedTypeName = (id: string, types: any[]) => {
    const type = types.find(t => t.assessment_type_id.toString() === id);
    return type ? type.assessment_type_name : '';
  };

  useEffect(() => {
    fetchListData();
    fetchDropdowns();
    fetchNextSlNo();
  }, [data]);

  const fetchListData = async () => {
    try {
      const res = await axiosInstance.get(`/assessments/manage_cia_occasion/assessment-occasion/grid-data?course_id=${data?.crs_id || data?.id}`);
      const fetchedData = (res.data as any).data || [];
      setListData(fetchedData.map((item: any, idx: number) => ({
        ...item,
        idX: `ao_${item.ao_id}_${idx}`
      })));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDropdowns = async () => {
    try {
      const urls = [
        '/assessments/manage_cia_occasion/ao-methods',
        '/assessments/manage_cia_occasion/assessment-types',
        `/assessments/manage_cia_occasion/co?course_id=${data?.crs_id || data?.id}`,
        '/assessments/manage_cia_occasion/bloom-level',
        `/assessments/manage_cia_occasion/main-occasion/grid-data?course_id=${data?.crs_id || data?.id}`
      ];
      
      const responses = await Promise.all(urls.map(url => axiosInstance.get(url)));
      
      setAoMethods((responses[0].data as any).data || []);
      setAssessmentTypes((responses[1].data as any).data || []);
      setCoMapping((responses[2].data as any).data || []);
      setBloomLevels((responses[3].data as any).data || []);
      setMainOccasionTypes((responses[4].data as any).data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchNextSlNo = async () => {
    try {
      const res = await axiosInstance.get(`/assessments/manage_cia_occasion/assessment-occasion/next-slno?course_id=${data?.crs_id || data?.id}`); 
      setNextSlNo((res.data as any).data?.next_sl_no || '');
    } catch (err) {
      console.error(err);
    }
  };

  const loadSubOccasions = (cmot_id: any, setter: any, current_ao_id?: number) => {
      const mapped = mainOccasionTypes.find(o => o.cmot_id && o.cmot_id.toString() === cmot_id.toString());
      const mot_id = mapped ? mapped.mot_id || mapped.cia_occasion_type_id : null;
      
      const params = new URLSearchParams();
      if (mot_id) params.append('mot_id', mot_id); else params.append('mot_id', cmot_id);
      
      const courseId = data?.crs_id || data?.id;
      if (courseId) params.append('course_id', String(courseId));
      
      const sectionId = data?.section_id;
      if (sectionId) params.append('section_id', String(sectionId));

      // For edit mode: exclude current record so its sot_id still shows
      if (current_ao_id) params.append('current_ao_id', String(current_ao_id));

      axiosInstance.get(`/assessments/manage_cia_occasion/sub-occasion-types?${params.toString()}`)
        .then(res => setter((res.data as any).data || []))
        .catch(err => console.error("Error loading sub occasions:", err));
  };

  useEffect(() => {
    if (formData.main_ao_id) loadSubOccasions(formData.main_ao_id, setSubOccasionTypes);
    else setSubOccasionTypes([]);
  }, [formData.main_ao_id, data]);

  useEffect(() => {
    if (editFormData.main_ao_id) loadSubOccasions(editFormData.main_ao_id, setEditSubOccasionTypes, editFormData.ao_id || undefined);
    else setEditSubOccasionTypes([]);
  }, [editFormData.main_ao_id, data]);

  const handleUpdate = async () => {
    if (!editFormData.main_ao_id || !editFormData.max_marks || !editFormData.ao_method_id) {
       toast.warning("Please fill required fields");
       return;
    }
    try {
      const payload = {
        cmot_id: Number(editFormData.main_ao_id),
        sot_id: editFormData.sub_ao_id ? Number(editFormData.sub_ao_id) : undefined,
        ao_method_id: Number(editFormData.ao_method_id),
        assessment_type_id: Number(editFormData.assessment_type_id),
        co_ids: editFormData.co_ids,
        bloom_levels: editFormData.bl_ids,
        direct: editFormData.direct,
        max_marks: Number(editFormData.max_marks),
        course_id: data?.crs_id || data?.id,
        section_id: data?.section_id ? Number(data.section_id) : 0
      };
      await axiosInstance.put(`/assessments/manage_cia_occasion/assessment-occasion/update/${editFormData.ao_id}`, payload);
      setIsEditModalOpen(false); fetchListData(); if (formData.main_ao_id) loadSubOccasions(formData.main_ao_id, setSubOccasionTypes); toast.success("Assessment Occasion Updated Successfully!");
    } catch (err) { console.error(err); toast.error("Failed to update assessment occasion"); }
  };

  const handleSave = async () => {
    if (!formData.main_ao_id || !formData.max_marks || !formData.ao_method_id) {
       toast.warning("Please fill required fields");
       return;
    }
    try {
      const payload = {
        cmot_id: Number(formData.main_ao_id), sot_id: Number(formData.sub_ao_id), ao_method_id: Number(formData.ao_method_id),
        assessment_type_id: Number(formData.assessment_type_id), co_ids: formData.co_ids, bloom_levels: formData.bl_ids,
        direct: formData.direct, max_marks: Number(formData.max_marks), course_id: data?.crs_id || data?.id,
        section_id: data?.section_id ? Number(data.section_id) : 0
      };
      await axiosInstance.post('/assessments/manage_cia_occasion/assessment-occasion/create', payload);
      resetForm(); fetchListData(); if (formData.main_ao_id) loadSubOccasions(formData.main_ao_id, setSubOccasionTypes); toast.success("Assessment Occasion Saved Successfully!");
    } catch (err) { console.error(err); toast.error("Failed to save assessment occasion"); }
  };

  const handleEditOpen = (item: any) => {
    try {
      const mainAo = mainOccasionTypes.find(o => String(o.occasions || '').trim().toLowerCase() === String(item.main_occasion_type || '').trim().toLowerCase());
      const method = aoMethods.find(m => String(m.ao_method_name || '').trim().toLowerCase() === String(item.ao_method || '').trim().toLowerCase());
      const aType = assessmentTypes.find(t => String(t.assessment_type_name || '').trim().toLowerCase() === String(item.assessment_type || '').trim().toLowerCase());
      let coIds: number[] = [];
      if (item.co_mapping && item.co_mapping !== "CO Mapping Pending") {
        const codes = item.co_mapping.split(',').map((s: string) => s.trim().toLowerCase());
        coIds = coMapping.filter(c => c.clo_code && codes.includes(c.clo_code.toString().trim().toLowerCase())).map(c => Number(c.clo_id));
      }
      let blIds: number[] = [];
      if (item.bl_mapping && item.bl_mapping !== "BL Mapping Pending") {
        const levels = item.bl_mapping.split(',').map((s: string) => s.trim().toLowerCase());
        blIds = bloomLevels.filter(b => b.level && levels.includes(b.level.toString().trim().toLowerCase())).map(b => Number(b.bloom_id));
      }
      const initialEditData = {
        sl_no: item.sl_no || '', ao_id: item.ao_id || null, main_ao_id: mainAo ? mainAo.cmot_id.toString() : '', sub_ao_id: '',
        ao_method_id: method ? method.ao_method_id.toString() : '', assessment_type_id: aType ? aType.assessment_type_id.toString() : '',
        co_ids: coIds, bl_ids: blIds, direct: item.direct_indirect === "Direct" ? 1 : 0, max_marks: item.max_marks || '', section_id: item.section_id || data?.section_id || ''
      };
      setEditFormData(initialEditData); setIsEditModalOpen(true);
      if (mainAo) {
        // Pass current ao_id so the currently-assigned sub occasion stays in the dropdown
        loadSubOccasions(mainAo.cmot_id, (subs: any[]) => {
          setEditSubOccasionTypes(subs);
          const sub = subs.find(s => String(s.sub_occasion_type_name || '').trim().toLowerCase() === String(item.sub_occasion_type || '').trim().toLowerCase());
          if (sub) setEditFormData(prev => ({ ...prev, sub_ao_id: String(sub.sub_occasion_type_id) }));
        }, item.ao_id);
      }
    } catch (err: any) { console.error(err); }
  };

  const handleDelete = (id: any) => { setDeleteTargetId(id); setIsDeleteModalOpen(true); };

  const executeDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await axiosInstance.delete(`/assessments/manage_cia_occasion/assessment-occasion/delete/${deleteTargetId}`);
      fetchListData(); setIsDeleteModalOpen(false); setDeleteTargetId(null); if (formData.main_ao_id) loadSubOccasions(formData.main_ao_id, setSubOccasionTypes); toast.success("Assessment Occasion Deleted Successfully!");
    } catch (err) { console.error(err); toast.error("Failed to delete record"); }
  };

  const resetForm = () => {
    setFormData({ ao_id: null, main_ao_id: '', sub_ao_id: '', ao_method_id: '', assessment_type_id: '', co_ids: [], bl_ids: [], max_marks: '', direct: 1, section_id: data?.section_id || '' });
    fetchNextSlNo();
  };

  return (
    <div className="mt-12">
      <h3 className="text-[#437880] text-base font-semibold border-b border-gray-100 pb-3 mb-8">
        Assessment Occasions (AO) for Comprehensive Continuous Evaluation (CCE)
      </h3>
      
      {/* Note & Weightage Distribution Section */}
      <div className="flex flex-col lg:flex-row gap-8 mb-8 items-start">
        <div className="flex-1 space-y-4">
          <div className="p-4 bg-sky-50 border-l-4 border-sky-400 rounded-r-lg">
            <p className="text-[11px] text-sky-800 leading-relaxed font-medium italic">
              Note: Please enter minimum and maximum marks as whole numbers. <br/>
              Any assessment added in one section will be replicated in all sections of the course.
            </p>
          </div>
          <p className="text-[11px] text-gray-500 italic pl-1 font-medium">
            Note: A maximum number of 20 occasions can be created for the Course.
          </p>
        </div>
        
        {/* Weightage Section Without Dark Header */}
        <div className="w-full lg:w-[650px] bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="p-4">
            <div className="mb-4">
              <span className="text-[12px] font-bold text-[#437880] uppercase tracking-wider">
                Individual Course (CCE) (SEE) Weightage Distribution
              </span>
            </div>
            
            <div className="border border-gray-200 rounded overflow-hidden">
              <table className="w-full border-collapse">
                <thead className="bg-[#fcfdfd]">
                  <tr className="divide-x divide-gray-200 text-left">
                    <th className="px-4 py-3 text-[12px] font-bold text-gray-700">Comprehensive Continuous Evaluation (CCE)</th>
                    <th className="px-4 py-3 text-[12px] font-bold text-gray-700">Semester End Examination (SEE)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr className="divide-x divide-gray-200 bg-[#f8fafc]/50">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-[#eeeeee] border border-gray-300 rounded px-3 py-1.5 text-sm text-gray-600 font-medium">
                          {data?.cee_weightage || "50.00"}
                        </div>
                        <span className="text-sm text-blue-600 font-medium">%</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-[#eeeeee] border border-gray-300 rounded px-3 py-1.5 text-sm text-gray-600 font-medium">
                          {data?.see_weightage || "50.00"}
                        </div>
                        <span className="text-sm text-blue-600 font-medium">%</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* AO Form Section */}
      <div className="bg-[#f8fafc] p-8 rounded-lg border border-gray-100 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 items-start">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-600 tracking-tight">Sl No. *</label>
            <input className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded text-sm text-gray-500 font-bold outline-none" value={listData.length + 1} readOnly disabled />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-600 tracking-tight">Main occasion *</label>
            <select className="w-full px-3 py-2 bg-white border border-gray-300 rounded outline-none text-sm transition-all focus:border-[#437880] focus:ring-1 focus:ring-[#437880]" value={formData.main_ao_id} onChange={(e) => setFormData({...formData, main_ao_id: e.target.value})}>
              <option value="">Select main occasion</option>
              {mainOccasionTypes.map(o => <option key={o.cmot_id} value={o.cmot_id.toString()}>{o.occasions}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-600 tracking-tight">Sub occasion *</label>
            <select className="w-full px-3 py-2 bg-white border border-gray-300 rounded outline-none text-sm transition-all focus:border-[#437880] focus:ring-1 focus:ring-[#437880]" value={formData.sub_ao_id} onChange={(e) => setFormData({...formData, sub_ao_id: e.target.value})}>
              <option value="">Select sub occasion</option>
              {subOccasionTypes.map(s => <option key={s.sub_occasion_type_id} value={s.sub_occasion_type_id.toString()}>{s.sub_occasion_type_name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-600 tracking-tight">AO method *</label>
            <select className="w-full px-3 py-2 bg-white border border-gray-300 rounded outline-none text-sm transition-all focus:border-[#437880] focus:ring-1 focus:ring-[#437880]" value={formData.ao_method_id} onChange={(e) => setFormData({...formData, ao_method_id: e.target.value})}>
              <option value="">Select method</option>
              {aoMethods.map(m => <option key={m.ao_method_id} value={m.ao_method_id.toString()}>{m.ao_method_name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-600 tracking-tight">Type *</label>
            <select className="w-full px-3 py-2 bg-white border border-gray-300 rounded outline-none text-sm transition-all focus:border-[#437880] focus:ring-1 focus:ring-[#437880]" value={formData.assessment_type_id} onChange={(e) => setFormData({...formData, assessment_type_id: e.target.value})}>
              <option value="">Select type</option>
              {assessmentTypes.map(t => <option key={t.assessment_type_id} value={t.assessment_type_id.toString()}>{t.assessment_type_name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-600 tracking-tight">Max marks *</label>
            <input className="w-full px-3 py-2 bg-white border border-gray-300 rounded outline-none text-sm transition-all focus:border-[#437880] focus:ring-1 focus:ring-[#437880]" value={formData.max_marks} onChange={(e) => setFormData({...formData, max_marks: e.target.value})} type="number" />
          </div>
        </div>

        <div className="mt-6 flex flex-col md:flex-row gap-6">
          {getSelectedTypeName(formData.assessment_type_id, assessmentTypes) === 'Individual' && (
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-600 tracking-tight">CO Mapping *</label>
                <div className="relative">
                  <button type="button" className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm flex justify-between items-center transition-all focus:border-[#437880] focus:ring-1 focus:ring-[#437880]" onClick={() => setShowCoDropdown(!showCoDropdown)}>
                    {formData.co_ids.length > 0 ? (
                      <span className="text-[#437880] font-bold">{formData.co_ids.length} Selected</span>
                    ) : <span className="text-gray-400">Select COs</span>}
                    <span className="text-gray-400 text-[10px]">▼</span>
                  </button>
                  {showCoDropdown && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded shadow-xl max-h-48 overflow-y-auto">
                      {coMapping.map(c => (
                        <label key={c.clo_id} className="flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer gap-3 text-sm transition-colors border-b border-gray-50 last:border-0 font-medium text-gray-700">
                          <input type="checkbox" className="rounded-md border-gray-300 text-[#437880] focus:ring-[#437880]" checked={formData.co_ids.includes(Number(c.clo_id))} onChange={(e) => {
                            const id = Number(c.clo_id);
                            const newIds = e.target.checked ? [...formData.co_ids, id] : formData.co_ids.filter(x => x !== id);
                            setFormData({...formData, co_ids: newIds});
                          }} />
                          {c.clo_code}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-600 uppercase tracking-tight">BL Mapping *</label>
                <div className="relative">
                  <button type="button" className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm flex justify-between items-center transition-all focus:border-[#437880] focus:ring-1 focus:ring-[#437880]" onClick={() => setShowBlDropdown(!showBlDropdown)}>
                    {formData.bl_ids.length > 0 ? (
                      <span className="text-[#437880] font-bold">{formData.bl_ids.length} Selected</span>
                    ) : <span className="text-gray-400">Select BLs</span>}
                    <span className="text-gray-400 text-[10px]">▼</span>
                  </button>
                  {showBlDropdown && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded shadow-xl max-h-48 overflow-y-auto">
                      {bloomLevels.map(b => (
                        <label key={b.bloom_id} className="flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer gap-3 text-sm transition-colors border-b border-gray-50 last:border-0 font-medium text-gray-700">
                          <input type="checkbox" className="rounded-md border-gray-300 text-[#437880] focus:ring-[#437880]" checked={formData.bl_ids.includes(Number(b.bloom_id))} onChange={(e) => {
                            const id = Number(b.bloom_id);
                            const newIds = e.target.checked ? [...formData.bl_ids, id] : formData.bl_ids.filter(x => x !== id);
                            setFormData({...formData, bl_ids: newIds});
                          }} />
                          {b.level}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {(getSelectedTypeName(formData.assessment_type_id, assessmentTypes) === 'QP' || getSelectedTypeName(formData.assessment_type_id, assessmentTypes) === 'Rubrics') && (
            <div className="flex-1 flex items-center h-10 bg-gray-50 rounded px-4 border border-gray-200 gap-3">
              <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-[#437880] focus:ring-[#437880]" checked={formData.direct === 1} onChange={(e) => setFormData({...formData, direct: e.target.checked ? 1 : 0})} />
              <div className="text-[11px] font-bold text-gray-600 tracking-tight">
                Enable Direct Method of Attainment
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-10 pt-6 border-t border-gray-200/50">
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

      <div className="mb-5 mt-12 border-b border-gray-100 pb-3">
        <h3 className="text-[#437880] text-base font-semibold uppercase tracking-wider">Assessment Occasions List</h3>
      </div>
      <DataTable 
        columnDefs={columnDefsGrid} 
        rowData={listData} 
        showAddButton={false} 
        showExportButton={false} 
        headerFilter={false} 
        pagination={true} 
        pageSize={10} 
        showSearch={false}
        showEntries={false}
        autoHeight={true}
      />

      <div className="flex justify-end mb-8">
        <button className="px-6 py-2 bg-emerald-600 text-white rounded font-bold text-sm hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-sm">
          <FaUndo size={13} /> Rollback
        </button>
      </div>

      {isEditModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-[#2e4a5a]">
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider">Edit Assessment Occasion</h4>
              <button onClick={() => setIsEditModalOpen(false)} className="text-white/70 hover:text-white transition-colors">
                <FaTimes size={18} />
              </button>
            </div>
            <div className="p-8">
              {/* Row 1: Sl No + Main + Sub + Method + Type + Max Marks */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6 items-end">
                <div className="space-y-1.5 opacity-60">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-tight block truncate">Sl No. *</label>
                  <input className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded text-sm font-bold outline-none" value={editFormData.sl_no} readOnly />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-600 uppercase tracking-tight block truncate">Main Occasion *</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded outline-none text-sm transition-all focus:border-[#437880] focus:ring-1 focus:ring-[#437880]" value={editFormData.main_ao_id} onChange={(e) => {
                    const val = e.target.value;
                    setEditFormData({...editFormData, main_ao_id: val, sub_ao_id: ''});
                    if (val) loadSubOccasions(val, setEditSubOccasionTypes, editFormData.ao_id || undefined);
                    else setEditSubOccasionTypes([]);
                  }}>
                    <option value="">Select Main Occasion</option>
                    {mainOccasionTypes.map(o => <option key={o.cmot_id} value={o.cmot_id.toString()}>{o.occasions}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-600 uppercase tracking-tight block truncate">Sub Occasion *</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded outline-none text-sm transition-all focus:border-[#437880] focus:ring-1 focus:ring-[#437880]" value={editFormData.sub_ao_id} onChange={(e) => setEditFormData({...editFormData, sub_ao_id: e.target.value})}>
                    <option value="">Select Sub Occasion</option>
                    {editSubOccasionTypes.map(s => <option key={s.sub_occasion_type_id} value={s.sub_occasion_type_id.toString()}>{s.sub_occasion_type_name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-600 uppercase tracking-tight block truncate">AO Method *</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded outline-none text-sm transition-all focus:border-[#437880] focus:ring-1 focus:ring-[#437880]" value={editFormData.ao_method_id} onChange={(e) => setEditFormData({...editFormData, ao_method_id: e.target.value})}>
                    <option value="">Select Method</option>
                    {aoMethods.map(m => <option key={m.ao_method_id} value={m.ao_method_id.toString()}>{m.ao_method_name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-600 uppercase tracking-tight block truncate">Asmt. Type *</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded outline-none text-sm transition-all focus:border-[#437880] focus:ring-1 focus:ring-[#437880]" value={editFormData.assessment_type_id} onChange={(e) => setEditFormData({...editFormData, assessment_type_id: e.target.value})}>
                    <option value="">Select Type</option>
                    {assessmentTypes.map(t => <option key={t.assessment_type_id} value={t.assessment_type_id.toString()}>{t.assessment_type_name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-600 uppercase tracking-tight block truncate">Max Marks *</label>
                  <input className="w-full px-3 py-2 border border-gray-300 rounded outline-none text-sm transition-all focus:border-[#437880] focus:ring-1 focus:ring-[#437880]" value={editFormData.max_marks} onChange={(e) => setEditFormData({...editFormData, max_marks: e.target.value})} type="number" />
                </div>
              </div>

              {/* CO / BL Mapping for Individual type */}
              {getSelectedTypeName(editFormData.assessment_type_id, assessmentTypes) === 'Individual' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-600 tracking-tight">CO Mapping *</label>
                    <div className="relative">
                      <button type="button" className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm flex justify-between items-center transition-all focus:border-[#437880]" onClick={() => setShowEditCoDropdown(!showEditCoDropdown)}>
                        {editFormData.co_ids.length > 0 ? <span className="text-[#437880] font-bold">{editFormData.co_ids.length} Selected</span> : <span className="text-gray-400">Select COs</span>}
                        <span className="text-gray-400 text-[10px]">▼</span>
                      </button>
                      {showEditCoDropdown && (
                        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded shadow-xl max-h-48 overflow-y-auto">
                          {coMapping.map(c => (
                            <label key={c.clo_id} className="flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer gap-3 text-sm border-b border-gray-50 last:border-0 font-medium text-gray-700">
                              <input type="checkbox" className="rounded border-gray-300 text-[#437880]" checked={editFormData.co_ids.includes(Number(c.clo_id))} onChange={(e) => {
                                const id = Number(c.clo_id);
                                const newIds = e.target.checked ? [...editFormData.co_ids, id] : editFormData.co_ids.filter(x => x !== id);
                                setEditFormData({...editFormData, co_ids: newIds});
                              }} />
                              {c.clo_code}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-600 uppercase tracking-tight">BL Mapping *</label>
                    <div className="relative">
                      <button type="button" className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm flex justify-between items-center transition-all focus:border-[#437880]" onClick={() => setShowEditBlDropdown(!showEditBlDropdown)}>
                        {editFormData.bl_ids.length > 0 ? <span className="text-[#437880] font-bold">{editFormData.bl_ids.length} Selected</span> : <span className="text-gray-400">Select BLs</span>}
                        <span className="text-gray-400 text-[10px]">▼</span>
                      </button>
                      {showEditBlDropdown && (
                        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded shadow-xl max-h-48 overflow-y-auto">
                          {bloomLevels.map(b => (
                            <label key={b.bloom_id} className="flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer gap-3 text-sm border-b border-gray-50 last:border-0 font-medium text-gray-700">
                              <input type="checkbox" className="rounded border-gray-300 text-[#437880]" checked={editFormData.bl_ids.includes(Number(b.bloom_id))} onChange={(e) => {
                                const id = Number(b.bloom_id);
                                const newIds = e.target.checked ? [...editFormData.bl_ids, id] : editFormData.bl_ids.filter(x => x !== id);
                                setEditFormData({...editFormData, bl_ids: newIds});
                              }} />
                              {b.level}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Direct Method toggle for QP / Rubrics */}
              {(getSelectedTypeName(editFormData.assessment_type_id, assessmentTypes) === 'QP' || getSelectedTypeName(editFormData.assessment_type_id, assessmentTypes) === 'Rubrics') && (
                <div className="mb-6 flex items-center h-10 bg-gray-50 rounded px-4 border border-gray-200 gap-3">
                  <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-[#437880] focus:ring-[#437880]" checked={editFormData.direct === 1} onChange={(e) => setEditFormData({...editFormData, direct: e.target.checked ? 1 : 0})} />
                  <div className="text-[11px] font-bold text-gray-600 tracking-tight">
                    Will practice the Direct Method of Attainment. If not selected considered as Indirect Method of Attainment.
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-100">
                <button type="button" className="px-6 py-2 bg-[#437880] text-white rounded text-sm font-bold hover:bg-[#386269] flex items-center gap-2 shadow-sm" onClick={handleUpdate}>
                  <FaSave /> Update
                </button>
                <button type="button" className="px-6 py-2 bg-[#d9534f] text-white rounded text-sm font-bold hover:bg-[#c9302c] shadow-sm" onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <ConfirmDialog isOpen={isDeleteModalOpen} onClose={() => { setIsDeleteModalOpen(false); setDeleteTargetId(null); }} onConfirm={executeDelete} title="Confirm Delete" message="Are you sure you want to delete this record?" />
    </div>
  );
};

export default CiaAssessmentOccasion;

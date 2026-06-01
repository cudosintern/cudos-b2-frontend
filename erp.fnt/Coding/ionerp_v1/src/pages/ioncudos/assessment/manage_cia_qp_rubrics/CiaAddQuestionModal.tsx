import React, { useState, useEffect } from 'react';
import { 
    FaTimes, FaSave, FaQuestionCircle, FaArrowAltCircleDown,
    FaAlignLeft, FaAlignCenter, FaAlignRight, FaAlignJustify,
    FaListUl, FaListOl, FaIndent, FaOutdent, FaUndo, FaRedo,
    FaLink, FaImage, FaFileAlt, FaPrint, FaCut, FaCopy, FaPaste, FaTerminal, FaSpellCheck
} from 'react-icons/fa';
import CiaQuestionImportModal from './CiaQuestionImportModal';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => void;
    units: any[];
    dropdownData: any;
    maxMarks: number;
    grandTotalMarks: number;
}

const MenuButton: React.FC<{ label: string, items: any[], isToolbar?: boolean }> = ({ label, items, isToolbar }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeSub, setActiveSub] = useState<number | null>(null);

    return (
        <div className="relative" onMouseEnter={() => setIsOpen(true)} onMouseLeave={() => { setIsOpen(false); setActiveSub(null); }}>
            <button className={`${isToolbar ? 'bg-white border border-slate-300 px-3 py-1 rounded text-slate-600' : 'px-2 py-1 text-slate-600'} text-[11px] font-medium hover:bg-slate-100 rounded flex items-center gap-1.5 transition-colors`}>
                {label} <span className="text-[8px] opacity-30">▼</span>
            </button>
            {isOpen && (
                <div className="absolute top-full left-0 w-52 bg-white border border-slate-200 shadow-2xl rounded py-1 z-[10000] animate-in fade-in slide-in-from-top-1 duration-150">
                    {items.map((item, i) => item.divider ? (
                        <div key={i} className="my-1 border-t border-slate-100" />
                    ) : (
                        <div key={i} className="relative group/sub" onMouseEnter={() => setActiveSub(i)}>
                            <button 
                                onClick={() => { if(!item.subItems) { item.action?.(); setIsOpen(false); } }}
                                className={`w-full flex justify-between items-center px-4 py-1.5 hover:bg-slate-50 transition-colors ${item.disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="w-4 text-center text-xs">{item.icon}</span>
                                    <span className="text-[11px] text-slate-700">{item.label}</span>
                                </div>
                                {item.subItems && <span className="text-[8px] opacity-40">▶</span>}
                                {item.shortcut && <span className="text-[9px] text-slate-400 font-medium">{item.shortcut}</span>}
                            </button>
                            
                            {item.subItems && activeSub === i && (
                                <div className="absolute top-0 left-full w-48 bg-white border border-slate-200 shadow-2xl rounded py-1 -ml-0.5 animate-in fade-in slide-in-from-left-1 duration-150">
                                    {item.subItems.map((sub: any, si: number) => (
                                        <button key={si} className="w-full text-left px-4 py-1.5 hover:bg-slate-50 text-[11px] text-slate-700">
                                            {sub.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const CiaAddQuestionModal: React.FC<Props> = ({ isOpen, onClose, onSave, units, dropdownData, maxMarks, grandTotalMarks }) => {
    const [isSourceMode, setIsSourceMode] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        unit_id: '',
        main_q_no: '',
        sub_q_no: '',
        is_mandatory: false,
        question_no: '',
        co_id: '',
        bloom_id: '',
        pi_id: '',
        marks: '',
        content: ''
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-6 md:p-8">
            <div className="bg-white rounded shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-in border border-slate-200">
                
                {/* Header */}
                <div className="bg-white px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-white">
                    <h2 className="text-lg font-bold text-[#4a8494] flex items-center gap-3 uppercase tracking-tight">
                         Add Question
                    </h2>
                    <div className="flex items-center gap-4">
                        <a href="#" className="flex items-center gap-1.5 text-blue-400 text-[10px] font-bold uppercase hover:underline">
                            Mathematical Editor <FaQuestionCircle size={14} />
                        </a>
                        <button onClick={onClose} className="text-slate-400 hover:text-red-500 transition-colors p-2 ml-4">
                            <FaTimes size={18} />
                        </button>
                    </div>
                </div>

                <div className="flex-grow overflow-y-auto p-8 space-y-6">
                    {/* Top Control Bar */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end pb-6 border-b border-slate-100">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-700">Section / Parts (Units)<span className="text-red-500 font-black">*</span> :</label>
                            <select 
                                className="w-full border-slate-200 rounded px-3 py-1.5 text-[11px] font-medium focus:ring-1 focus:ring-blue-500/20 focus:border-blue-400 outline-none shadow-sm"
                                value={formData.unit_id}
                                onChange={(e) => setFormData({...formData, unit_id: e.target.value})}
                            >
                                <option value="">Select</option>
                                {units.map((u, i) => <option key={i} value={u.qp_unit_code}>{u.qp_unit_code}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-700">Main Q.No.<span className="text-red-500 font-black">*</span> :</label>
                            <select 
                                className="w-full border-slate-200 rounded px-3 py-1.5 text-[11px] font-medium focus:ring-1 focus:ring-blue-500/20 focus:border-blue-400 outline-none shadow-sm"
                                value={formData.main_q_no}
                                onChange={(e) => setFormData({...formData, main_q_no: e.target.value})}
                            >
                                <option value="">Select</option>
                                {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-700">Sub Q.No. :</label>
                            <select 
                                className="w-full border-slate-200 rounded px-3 py-1.5 text-[11px] font-medium focus:ring-1 focus:ring-blue-500/20 focus:border-blue-400 outline-none shadow-sm"
                                value={formData.sub_q_no}
                                onChange={(e) => setFormData({...formData, sub_q_no: e.target.value})}
                            >
                                <option value="">Select</option>
                                {['a','b','c','d','e','f'].map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                        </div>
                        <div className="flex justify-end pt-5">
                            <button 
                                onClick={() => setIsImportModalOpen(true)}
                                className="bg-[#5cb85c] hover:bg-[#4cae4c] text-white px-5 py-2.5 rounded text-[11px] font-bold uppercase tracking-tight flex items-center gap-2 shadow-sm transition-colors mt-auto"
                            >
                                <FaArrowAltCircleDown /> Import Question
                            </button>
                        </div>
                    </div>

                    {/* Main Form Body */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Left Column Fields */}
                        <div className="lg:col-span-4 space-y-4 pt-4 border-r border-slate-50 pr-8">
                            <div className="flex items-center gap-4">
                                <label className="text-[11px] font-bold text-slate-500 w-32">Mandatory :</label>
                                <input 
                                    type="checkbox" 
                                    className="w-4 h-4 rounded border-slate-300 accent-blue-600"
                                    checked={formData.is_mandatory}
                                    onChange={(e) => setFormData({...formData, is_mandatory: e.target.checked})}
                                />
                            </div>

                            <div className="flex items-center gap-4">
                                <label className="text-[11px] font-bold text-slate-500 w-32">Question No.<span className="text-red-500">*</span> :</label>
                                <input 
                                    type="text" 
                                    className="flex-1 bg-slate-50 border border-slate-200 rounded px-3 py-2 text-[11px] text-slate-400 font-medium outline-none"
                                    placeholder="Question No."
                                    readOnly
                                    value={formData.question_no}
                                />
                            </div>

                            <div className="flex items-center gap-4">
                                <label className="text-[11px] font-bold text-slate-500 w-32">Course Outcome<span className="text-red-500">*</span> :</label>
                                <select 
                                    className="flex-1 border-slate-200 rounded px-2 py-2 text-[11px] font-medium outline-none shadow-sm focus:border-blue-400 cursor-pointer"
                                    value={formData.co_id}
                                    onChange={(e) => setFormData({...formData, co_id: e.target.value})}
                                >
                                    <option value="">Select CO</option>
                                    {dropdownData.course_outcomes?.map((co: any) => <option key={co.id} value={co.id}>{co.name}</option>)}
                                </select>
                            </div>

                            <div className="flex items-center gap-4">
                                <label className="text-[11px] font-bold text-slate-500 w-32">Bloom's Level :</label>
                                <select 
                                    className="flex-1 border-slate-200 rounded px-2 py-2 text-[11px] font-medium outline-none shadow-sm focus:border-blue-400 cursor-pointer"
                                    value={formData.bloom_id}
                                    onChange={(e) => setFormData({...formData, bloom_id: e.target.value})}
                                >
                                    <option value="">Select level</option>
                                    {dropdownData.bloom_levels?.map((bl: any) => <option key={bl.id} value={bl.id}>{bl.name}</option>)}
                                </select>
                            </div>

                            <div className="flex items-center gap-4">
                                <label className="text-[11px] font-bold text-slate-500 w-32">Performance Indicator :</label>
                                <select 
                                    className="flex-1 border-slate-200 rounded px-2 py-2 text-[11px] font-medium outline-none shadow-sm focus:border-blue-400 cursor-pointer"
                                    value={formData.pi_id}
                                    onChange={(e) => setFormData({...formData, pi_id: e.target.value})}
                                >
                                    <option value="">Select PI</option>
                                    {dropdownData.performance_indicators?.map((pi: any) => (
                                        <option key={pi.id} value={pi.id}>{pi.name || pi.code}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center gap-4">
                                <label className="text-[11px] font-bold text-slate-500 w-32">Marks<span className="text-red-500">*</span> :</label>
                                <input 
                                    type="number" 
                                    className="flex-1 border border-slate-200 rounded px-3 py-2 text-[11px] font-bold text-slate-800 outline-none shadow-sm focus:border-blue-400"
                                    value={formData.marks}
                                    placeholder="Enter marks"
                                    onChange={(e) => setFormData({...formData, marks: e.target.value})}
                                />
                            </div>
                        </div>

                        {/* Right Column: High-Fidelity Custom Editor (Non-TinyMCE) */}
                        <div className="lg:col-span-8 space-y-2 flex flex-col relative">
                            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-tight">Enter Question in below textarea :</label>
                            
                            <div className="border border-slate-300 rounded shadow-sm flex flex-col bg-white overflow-hidden">
                                {/* Menu Bar */}
                                <div className="bg-white px-2 py-1 flex gap-2 border-b border-slate-200 relative">
                                    <MenuButton label="File" items={[
                                         { label: 'New document', icon: <FaFileAlt size={11} />, shortcut: 'Ctrl+N', action: () => setFormData({...formData, content: ''}) },
                                         { label: 'Print', icon: <FaPrint size={11} />, shortcut: 'Ctrl+P', action: () => window.print() },
                                     ]} />
                                     <MenuButton label="Edit" items={[
                                         { label: 'Undo', icon: <FaUndo size={10} />, shortcut: 'Ctrl+Z', action: () => document.execCommand('undo') },
                                         { label: 'Redo', icon: <FaRedo size={10} />, shortcut: 'Ctrl+Y', action: () => document.execCommand('redo') },
                                         { divider: true },
                                         { label: 'Cut', icon: <FaCut size={11} />, shortcut: 'Ctrl+X', action: () => document.execCommand('cut') },
                                         { label: 'Copy', icon: <FaCopy size={11} />, shortcut: 'Ctrl+C', action: () => document.execCommand('copy') },
                                         { label: 'Paste', icon: <FaPaste size={11} />, shortcut: 'Ctrl+V', action: () => document.execCommand('paste') },
                                     ]} />
                                     <MenuButton label="Insert" items={[
                                         { label: 'Insert video', icon: '📹' },
                                         { label: 'Insert image', icon: <FaImage size={11} /> },
                                         { label: 'Insert link', icon: <FaLink size={11} />, shortcut: 'Ctrl+K' },
                                     ]} />
                                     <MenuButton label="View" items={[
                                         { label: 'Show blocks' },
                                         { label: 'Visual aids' },
                                     ]} />
                                     <MenuButton label="Format" items={[
                                         { label: 'Bold', icon: 'B', shortcut: 'Ctrl+B', action: () => document.execCommand('bold') },
                                         { label: 'Italic', icon: 'I', shortcut: 'Ctrl+I', action: () => document.execCommand('italic') },
                                         { label: 'Underline', icon: 'U', shortcut: 'Ctrl+U', action: () => document.execCommand('underline') },
                                     ]} />
                                     <MenuButton label="Table" items={[
                                         { label: 'Insert table', icon: '📅', subItems: [ {label: '1x1'}, {label: '2x2'} ] },
                                         { label: 'Table properties', disabled: true },
                                         { label: 'Delete table', disabled: true },
                                         { divider: true },
                                         { label: 'Cell', subItems: [ {label: 'Insert cell'} ] },
                                         { label: 'Row', subItems: [ {label: 'Insert row before'} ] },
                                         { label: 'Column', subItems: [ {label: 'Insert column before'} ] },
                                     ]} />
                                     <MenuButton label="Tools" items={[
                                         { label: 'Source code', icon: <FaTerminal size={11} />, action: () => setIsSourceMode(!isSourceMode) },
                                         { label: 'Spellcheck', icon: <FaSpellCheck size={11} /> },
                                     ]} />
                                </div>

                                {/* Toolbar Row 2 */}
                                <div className="bg-slate-50 border-b border-slate-200 p-1 flex flex-wrap gap-1 items-center shadow-inner">
                                    <div className="flex bg-white border border-slate-300 rounded overflow-hidden">
                                        <button onClick={() => document.execCommand('undo')} className="p-2 hover:bg-slate-50 border-r border-slate-100" title="Undo"><FaUndo size={11} className="text-slate-500" /></button>
                                        <button onClick={() => document.execCommand('redo')} className="p-2 hover:bg-slate-50" title="Redo"><FaRedo size={11} className="text-slate-500" /></button>
                                    </div>
                                    
                                    <MenuButton label="Formats" items={[
                                        { label: 'Headings', subItems: [{label: 'Heading 1'}, {label: 'Heading 2'}] },
                                        { label: 'Inline', subItems: [{label: 'Bold'}, {label: 'Italic'}] },
                                        { label: 'Blocks', subItems: [{label: 'Paragraph'}] },
                                        { label: 'Alignment', subItems: [{label: 'Left'}, {label: 'Center'}] },
                                    ]} isToolbar={true} />

                                    <div className="flex bg-white border border-slate-300 rounded overflow-hidden divide-x divide-slate-100">
                                        <button onClick={() => document.execCommand('bold')} className="px-3.5 py-1.5 font-bold text-xs hover:bg-slate-50 text-slate-700">B</button>
                                        <button onClick={() => document.execCommand('italic')} className="px-3.5 py-1.5 italic hover:bg-slate-50 text-slate-700">I</button>
                                    </div>

                                    <div className="flex bg-white border border-slate-300 rounded overflow-hidden divide-x divide-slate-100">
                                        {[
                                            { cmd: 'justifyLeft', icon: <FaAlignLeft size={10} /> },
                                            { cmd: 'justifyCenter', icon: <FaAlignCenter size={10} /> },
                                            { cmd: 'justifyRight', icon: <FaAlignRight size={10} /> },
                                            { cmd: 'justifyFull', icon: <FaAlignJustify size={10} /> }
                                        ].map((b, i) => (
                                            <button key={i} onClick={() => document.execCommand(b.cmd)} className="p-2 hover:bg-slate-50 text-slate-400">{b.icon}</button>
                                        ))}
                                    </div>

                                    <div className="flex bg-white border border-slate-300 rounded overflow-hidden divide-x divide-slate-100">
                                        <button onClick={() => document.execCommand('insertUnorderedList')} className="p-2 hover:bg-slate-50 text-slate-500"><FaListUl size={11} /></button>
                                        <button onClick={() => document.execCommand('insertOrderedList')} className="p-2 hover:bg-slate-50 text-slate-500"><FaListOl size={11} /></button>
                                        <button onClick={() => document.execCommand('outdent')} className="p-2 hover:bg-slate-50 text-slate-500"><FaOutdent size={11} /></button>
                                        <button onClick={() => document.execCommand('indent')} className="p-2 hover:bg-slate-50 text-slate-500"><FaIndent size={11} /></button>
                                    </div>

                                    <div className="flex gap-1 ml-auto mr-1">
                                        <button className="p-2 hover:bg-blue-50 text-blue-500 rounded transition-colors" title="Insert Link"><FaLink size={11} /></button>
                                        <button className="p-2 hover:bg-emerald-50 text-emerald-500 rounded transition-colors" title="Insert Image"><FaImage size={11} /></button>
                                        <button className="bg-white border border-slate-300 px-3 py-1.5 rounded text-[10px] font-bold text-slate-600 flex items-center gap-2 hover:bg-slate-50">
                                           Upload <FaArrowAltCircleDown size={11} className="text-slate-400" />
                                        </button>
                                        <button className="bg-slate-200 border border-slate-300 px-4 py-1.5 rounded text-[11px] font-bold text-slate-800 hover:bg-slate-300 transition-colors">ƒx</button>
                                    </div>
                                </div>

                                {/* Content Surface */}
                                {isSourceMode ? (
                                    <textarea 
                                        className="w-full h-[320px] p-6 text-[11px] font-mono bg-slate-900 text-emerald-400 outline-none resize-none"
                                        value={formData.content}
                                        onChange={(e) => setFormData({...formData, content: e.target.value})}
                                    />
                                ) : (
                                    <div 
                                        className="w-full h-[320px] p-6 text-sm font-medium outline-none overflow-y-auto"
                                        contentEditable={true}
                                        onInput={(e: any) => setFormData({...formData, content: e.currentTarget.innerHTML})}
                                        dangerouslySetInnerHTML={{ __html: formData.content }}
                                    />
                                )}

                                {/* Status Bar */}
                                <div className="bg-slate-50 border-t border-slate-200 px-4 py-1.5 flex items-center text-[10px] text-slate-400">
                                    body » p
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Lower Status Bar */}
                    <div className="flex justify-end items-center gap-12 pt-8">
                        <div className="flex items-center gap-3">
                            <span className="text-[11px] font-black text-slate-600">Section / Parts (Units) Marks</span>
                            <div className="w-32 py-1.5 px-3 bg-slate-100 border border-slate-200 rounded text-center text-xs font-bold text-slate-600">
                                0.00
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-[11px] font-black text-slate-600">Grand Total Marks</span>
                            <div className="w-32 py-1.5 px-3 bg-slate-100 border border-slate-200 rounded text-center text-xs font-bold text-slate-600">
                                {Number(maxMarks).toFixed(2)} / {Number(maxMarks).toFixed(2)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="bg-slate-50/80 px-8 py-5 flex justify-end gap-3 border-t border-slate-100">
                    <button 
                        className="bg-[#007bff] hover:bg-[#0069d9] text-white px-6 py-2 rounded text-[11px] font-bold flex items-center gap-2 shadow-sm transition-colors"
                        onClick={() => onSave(formData)}
                    >
                        <FaSave /> Save
                    </button>
                    <button 
                        onClick={onClose}
                        className="bg-[#d9534f] hover:bg-[#c9302c] text-white px-6 py-2 rounded text-[11px] font-bold flex items-center gap-2 shadow-sm transition-colors"
                    >
                        <FaTimes /> Close
                    </button>
                </div>
            </div>

            <CiaQuestionImportModal 
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImport={(q) => {
                    console.log('Importing', q);
                    setIsImportModalOpen(false);
                }}
            />
        </div>
    );
};

export default CiaAddQuestionModal;

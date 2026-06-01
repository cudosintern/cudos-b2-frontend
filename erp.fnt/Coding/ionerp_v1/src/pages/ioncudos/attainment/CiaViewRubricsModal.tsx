import React from "react";
import { Dialog, Transition } from "@headlessui/react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface CiaViewRubricsModalProps {
  onClose: () => void;
  data?: any;
}

const CiaViewRubricsModal: React.FC<CiaViewRubricsModalProps> = ({ onClose, data }) => {
  // Use isOpen logic internally or expect the parent to mount/unmount. 
  // Based on CiaQpList usage: {showRubricsModal && selectedAo && <CiaViewRubricsModal data={selectedAo} onClose={() => setShowRubricsModal(false)} />}
  // It doesn't pass isOpen, it just mounts it. So we treat it as always open when mounted.

  const rubricsHeader = {
    curriculum: data?.academic_batch_code || "N/A",
    term: data?.term_name || "N/A",
    course: data?.ao_name || "N/A",
  };

  const rubricsList = data?.rubrics?.map((r: any, index: number) => ({
    slNo: index + 1,
    criteria: r.criteria || r.criteria_description || "N/A",
    coCode: r.co_code || r.co || "N/A",
    scaleHeaders: r.ranges?.map((ra: any) => ra.criteria_range) || r.range?.map((ra: any) => ra.range_description) || [],
    scaleValues: r.ranges?.map((ra: any) => ra.classification || "") || r.range?.map((ra: any) => ra.classification) || [],
    descriptions: r.descriptions?.map((d: any) => d.criteria_description) || r.range?.map((ra: any) => ra.criteria_desc_name) || []
  })) || [];

  const handleExportPDF = () => {
    const doc = new jsPDF("p", "mm", "a4");
    
    // Header
    doc.setFontSize(16);
    doc.setTextColor(31, 41, 55);
    doc.text("CIA Rubrics Report", 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Curriculum: ${rubricsHeader.curriculum}`, 14, 30);
    doc.text(`Term: ${rubricsHeader.term}`, 14, 35);
    doc.text(`Course: ${rubricsHeader.course}`, 14, 40);

    // Table
    const tableData = rubricsList.flatMap((rubric: any) => {
      return rubric.scaleHeaders.map((header: string, i: number) => [
        i === 0 ? rubric.slNo : "",
        i === 0 ? rubric.criteria : "",
        i === 0 ? rubric.coCode : "",
        header,
        rubric.scaleValues[i],
        rubric.descriptions[i] || ""
      ]);
    });

    autoTable(doc, {
      startY: 45,
      head: [["Sl No.", "Criteria Description", "CO Code", "Scale Range", "Classification", "Description"]],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: [31, 41, 55], textColor: [255, 255, 255], fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 40 },
        2: { cellWidth: 20 },
      },
    });

    doc.save(`CIA_Rubrics_${rubricsHeader.course.replace(/\s+/g, "_")}.pdf`);
  };

  return (
    <Transition show={true} as={React.Fragment}>
      <Dialog as="div" className="fixed inset-0 z-[120] overflow-y-auto" onClose={onClose}>
        <div className="min-h-screen px-4 text-center font-sans">
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/40" />
          </Transition.Child>

          <span className="inline-block h-screen align-middle" aria-hidden="true">&#8203;</span>

          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <div className="inline-block w-full max-w-6xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white border border-gray-400 rounded-lg shadow-xl relative font-sans">
              {/* Header */}
              <div className="bg-[#1f2937] px-6 py-3 flex justify-between items-center text-white border-b border-gray-600 font-sans">
                <span className="text-base font-semibold uppercase tracking-wide">CIA Rubrics Details</span>
                <button onClick={onClose} className="text-gray-300 hover:text-white transition-colors text-sm font-bold uppercase">
                  Close [X]
                </button>
              </div>

              {/* Content */}
              <div className="p-8 pb-4 font-sans max-h-[70vh] overflow-y-auto">
                {/* Info Bar */}
                <div className="flex justify-between items-center bg-gray-50 p-4 border border-gray-200 rounded-md mb-8 text-xs font-semibold uppercase tracking-wider text-gray-600 font-sans">
                  <div className="flex gap-2">
                     <span className="text-gray-400">Curriculum:</span>
                     <span className="text-gray-900">{rubricsHeader.curriculum}</span>
                  </div>
                  <div className="flex gap-2">
                     <span className="text-gray-400">Term:</span>
                     <span className="text-gray-900">{rubricsHeader.term}</span>
                  </div>
                  <div className="flex gap-2">
                     <span className="text-gray-400">Course:</span>
                     <span className="text-gray-900">{rubricsHeader.course}</span>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto border border-gray-300 rounded overflow-hidden">
                    <table className="w-full text-xs border-collapse font-sans">
                      <thead className="bg-[#f3f4f6] font-bold border-b border-gray-300 text-gray-700 font-sans">
                        <tr>
                          <th className="w-16 p-3 border-r border-gray-300 text-center font-sans">Sl No.</th>
                          <th className="p-3 border-r border-gray-300 text-left font-sans">Criteria Description</th>
                          <th className="w-24 p-3 border-r border-gray-300 text-center uppercase font-sans">CO Code</th>
                          <th className="p-0 text-left font-sans">
                             <div className="w-full h-full flex flex-col font-sans">
                                <div className="p-3 border-b border-gray-300 text-center uppercase tracking-wider font-sans bg-gray-100/50">Scale of Assessment</div>
                                <div className="flex divide-x divide-gray-300 font-sans">
                                   <div className="flex-1 p-2 text-center italic font-sans text-gray-500">Scale Ranges</div>
                                   <div className="flex-1 p-2 text-center italic font-sans text-gray-500">Classification</div>
                                </div>
                             </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-300 font-sans bg-white">
                        {rubricsList.length > 0 ? rubricsList.map((rubric: any) => (
                          <tr key={rubric.slNo} className="hover:bg-gray-50 transition-colors">
                            <td className="p-3 border-r border-gray-300 text-center font-bold text-gray-900">{rubric.slNo}</td>
                            <td className="p-3 border-r border-gray-300 text-gray-800 leading-relaxed font-medium">{rubric.criteria}</td>
                            <td className="p-3 border-r border-gray-300 text-center font-bold text-blue-700">{rubric.coCode}</td>
                            <td className="p-0 align-top font-sans">
                               <table className="w-full border-collapse h-full">
                                  <tbody className="divide-y divide-gray-200">
                                     {rubric.scaleHeaders.map((header: string, i: number) => (
                                        <tr key={i} className="flex divide-x divide-gray-200">
                                           <td className="flex-1 p-2.5 font-mono text-center bg-gray-50/50 border-r border-gray-200">{header}</td>
                                           <td className="flex-1 p-2.5 text-center font-semibold text-gray-900">{rubric.scaleValues[i]}</td>
                                        </tr>
                                     ))}
                                     {rubric.descriptions.map((desc: string, i: number) => (
                                        desc && (
                                          <tr key={`desc-${i}`} className="flex border-t border-gray-100 font-sans text-[10px]">
                                             <td colSpan={2} className="w-full p-2 text-gray-500 italic text-center font-normal tracking-tight bg-blue-50/20">
                                                {desc}
                                             </td>
                                          </tr>
                                        )
                                     ))}
                                  </tbody>
                               </table>
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan={4} className="p-8 text-center text-gray-500 italic">No rubrics available for this occasion.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                </div>
              </div>

              {/* Footer */}
              <div className="px-8 py-5 bg-gray-50 border-t border-gray-200 flex justify-end gap-3 font-sans rounded-b-lg">
                <button
                  onClick={handleExportPDF}
                  className="px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-green-600 hover:bg-green-700 transition-all flex items-center gap-2 rounded shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export PDF
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-red-600 hover:bg-red-700 transition-all rounded shadow-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
};

export default CiaViewRubricsModal;

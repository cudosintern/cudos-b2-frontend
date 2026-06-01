import React, { useState, useMemo, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { FaTimes, FaSearch } from "react-icons/fa";
import { manageMteService } from "./manageMteService";
import { toast } from "react-toastify";

interface ImportQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (question: any) => void;
  courseId?: number;
  curriculumName?: string;
  termName?: string;
}

const ImportQuestionModal: React.FC<ImportQuestionModalProps> = ({
  isOpen,
  onClose,
  onImport,
  courseId,
  curriculumName = "N/A",
  termName = "N/A"
}) => {
  const [activeTab, setActiveTab] = useState<"review" | "assignment" | "bank">("review");
  const [searchTerm, setSearchTerm] = useState("");
  const [courseSearch, setCourseSearch] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    if (isOpen) {
      setCurrentPage(1);
    }
  }, [activeTab, debouncedSearch, entriesPerPage]);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, activeTab, debouncedSearch, currentPage, entriesPerPage, courseSearch]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await manageMteService.getImportQuestions({
        mode: activeTab,
        crs_id: courseId,
        search: debouncedSearch || (activeTab === "bank" ? courseSearch : undefined),
        page: currentPage,
        page_size: entriesPerPage
      });
      
      if (res.status === 1) {
        setQuestions(res.data?.items || []);
        setTotalItems(res.data?.total || 0);
      } else {
        setQuestions([]);
        setTotalItems(0);
      }
    } catch (error) {
      console.error("Failed to fetch import questions:", error);
      setQuestions([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(totalItems / entriesPerPage);

  const handleImport = (q: any) => {
    onImport(q);
    onClose();
  };

  return (
    <Transition show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="fixed inset-0 z-[120] overflow-y-auto" onClose={onClose}>
        <div className="min-h-screen px-4 text-center">
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black opacity-50" />
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
            <div className="inline-block w-full max-w-6xl overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl relative">
              
              {/* Header */}
              <div className="bg-white px-6 py-4 flex flex-col border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <Dialog.Title as="h3" className="text-xl font-bold text-gray-800">
                    Review/Assignment Questions
                  </Dialog.Title>
                  <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-full">
                    <FaTimes className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex gap-4 mt-2 text-sm text-gray-500 font-medium italic">
                  <span>Curriculum: <span className="text-[#437880]">{curriculumName}</span></span>
                  <span className="text-gray-300">|</span>
                  <span>Term: <span className="text-[#437880]">{termName}</span></span>
                </div>
              </div>

              <div className="p-6">
                
                {/* Radio Tabs */}
                <div className="flex gap-6 mb-8 border-b border-gray-100 pb-4">
                  {[
                    { id: "review", label: "Review Questions" },
                    { id: "assignment", label: "Assignment Questions" },
                    { id: "bank", label: "Question Bank" }
                  ].map(tab => (
                    <label key={tab.id} className="flex items-center gap-2 cursor-pointer group">
                      <input 
                        type="radio" 
                        name="importType" 
                        checked={activeTab === tab.id}
                        onChange={() => setActiveTab(tab.id as any)}
                        className="w-4 h-4 text-[#437880] border-gray-300 focus:ring-[#437880]"
                      />
                      <span className={`text-sm font-medium transition-colors ${activeTab === tab.id ? "text-[#437880]" : "text-gray-600 group-hover:text-gray-800"}`}>
                        {tab.label}
                      </span>
                    </label>
                  ))}
                </div>

                {/* Conditional Course Input for Bank */}
                {activeTab === "bank" && (
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-1 italic">Type the Course name:</label>
                    <input 
                      type="text"
                      value={courseSearch}
                      onChange={(e) => setCourseSearch(e.target.value)}
                      placeholder="Enter Course Name"
                      className="w-full md:w-1/3 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#437880] transition-all shadow-sm"
                    />
                  </div>
                )}

                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="p-4 bg-gray-50 flex flex-col md:flex-row justify-between items-center gap-4">
                    <h4 className="text-md font-bold text-gray-800 uppercase tracking-tight">Question List</h4>
                    
                    <div className="flex items-center gap-4 w-full md:w-auto">
                       <div className="flex items-center gap-2 text-sm text-gray-600">
                         <span>Show</span>
                         <select 
                           value={entriesPerPage}
                           onChange={(e) => setEntriesPerPage(Number(e.target.value))}
                           className="px-2 py-1 border border-gray-300 rounded focus:outline-none"
                         >
                            {[10, 25, 50, 100].map(v => <option key={v} value={v}>{v}</option>)}
                         </select>
                         <span>Entries</span>
                       </div>
                       
                       <div className="relative">
                         <input 
                           type="text" 
                           placeholder="Search..."
                           value={searchTerm}
                           onChange={(e) => setSearchTerm(e.target.value)}
                           className="pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#437880] w-48 md:w-64"
                         />
                         <FaSearch className="absolute left-2.5 top-2.5 text-gray-400 w-3 h-3" />
                       </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto min-h-[300px]">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-[#f8f9fa] border-y border-gray-200 text-gray-700 font-bold">
                        {activeTab === "bank" ? (
                          <tr>
                            <th className="px-4 py-3 border-r">Select</th>
                            <th className="px-4 py-3 border-r">Question(s)</th>
                            <th className="px-4 py-3 border-r">Topic(s)</th>
                            <th className="px-4 py-3 border-r">Course Outcome(s)</th>
                            <th className="px-4 py-3 border-r">Bloom's Level</th>
                            <th className="px-4 py-3 border-r">Difficulty Level</th>
                            <th className="px-4 py-3">Question Type</th>
                          </tr>
                        ) : (
                          <tr>
                            <th className="px-4 py-3 border-r text-center w-20">Sl No.</th>
                            <th className="px-4 py-3 border-r text-center w-20">Select Question</th>
                            <th className="px-4 py-3">Question</th>
                          </tr>
                        )}
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {loading ? (
                          <tr><td colSpan={activeTab === "bank" ? 7 : 3} className="text-center py-20 italic text-gray-500">Loading questions...</td></tr>
                        ) : questions.length === 0 ? (
                          <tr><td colSpan={activeTab === "bank" ? 7 : 3} className="text-center py-20 italic text-gray-500">No questions found matching your criteria.</td></tr>
                        ) : (
                          questions.map((q, idx) => (
                            <tr key={q.mq_id || q.id || idx} className="hover:bg-blue-50/50 transition-colors border-b">
                              {activeTab === "bank" ? (
                                <>
                                  <td className="px-4 py-3 border-r text-center">
                                    <input type="radio" name="importSelection" onChange={() => handleImport(q)} className="w-4 h-4 text-[#437880] focus:ring-[#437880] cursor-pointer" />
                                  </td>
                                  <td className="px-4 py-3 border-r" dangerouslySetInnerHTML={{ __html: q.question_text }} />
                                  <td className="px-4 py-3 border-r">{q.topic_name || "N/A"}</td>
                                  <td className="px-4 py-3 border-r">{q.co_code || "N/A"}</td>
                                  <td className="px-4 py-3 border-r">{q.bloom_level || "N/A"}</td>
                                  <td className="px-4 py-3 border-r">{q.difficulty_level || "Medium"}</td>
                                  <td className="px-4 py-3">{q.question_type || "Descriptive"}</td>
                                </>
                              ) : (
                                <>
                                  <td className="px-4 py-3 border-r text-center font-medium">{(currentPage - 1) * entriesPerPage + idx + 1}</td>
                                  <td className="px-4 py-3 border-r text-center">
                                    <input type="radio" name="importSelection" onChange={() => handleImport(q)} className="w-4 h-4 text-[#437880] focus:ring-[#437880] cursor-pointer" />
                                  </td>
                                  <td className="px-4 py-3" dangerouslySetInnerHTML={{ __html: q.question_text }} />
                                </>
                              )}
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Footer Stats / Pagination */}
                  <div className="px-6 py-4 bg-gray-50 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-600 border-t border-gray-200">
                    <div>
                      Showing {totalItems === 0 ? 0 : (currentPage - 1) * entriesPerPage + 1} to {Math.min(totalItems, currentPage * entriesPerPage)} of {totalItems} entries
                    </div>
                    <div className="flex gap-1">
                       <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1} className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50">Previous</button>
                       {Array.from({ length: totalPages }).map((_, i) => (
                         <button 
                           key={i} 
                           onClick={() => setCurrentPage(i+1)}
                           className={`px-3 py-1 border rounded ${currentPage === i+1 ? "bg-[#437880] text-white border-[#437880]" : "bg-white border-gray-300 hover:bg-gray-100"}`}
                         >
                           {i+1}
                         </button>
                       ))}
                       <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages} className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50">Next</button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
                  <button
                    onClick={onClose}
                    className="px-6 py-2.5 text-sm font-bold text-white bg-red-600 rounded-md hover:bg-red-700 transition-all shadow-md uppercase tracking-tight"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={true}
                    className="px-6 py-2.5 text-sm font-bold text-white button-bg rounded-md shadow-md uppercase tracking-tight disabled:opacity-50 transition-all hover:shadow-[#437880]/30"
                  >
                    Import
                  </button>
                </div>
              </div>

            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ImportQuestionModal;

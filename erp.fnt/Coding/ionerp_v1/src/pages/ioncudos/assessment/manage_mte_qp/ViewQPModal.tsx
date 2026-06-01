import React, { useState, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { manageMteService } from "./manageMteService";
import { FaQuestionCircle } from "react-icons/fa";

interface ViewQPModalProps {
  isOpen: boolean;
  onClose: () => void;
  data?: any;
}

const COLORS = ["#00C49F", "#0088FE", "#FFBB28", "#FF8042", "#8884D8", "#82ca9d", "#ffc658"];

const ViewQPModal: React.FC<ViewQPModalProps> = ({ isOpen, onClose, data }) => {
  const [qpDetails, setQpDetails] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && data?.ao_id) {
      fetchData();
    }
  }, [isOpen, data]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const idRes = await manageMteService.getMteFrameworkId(data.ao_id);
      if (idRes.status === 1 && idRes.data.qpf_id) {
        const qpfId = idRes.data.qpf_id;
        const [fRes, qRes, aRes] = await Promise.all([
          manageMteService.getMteFrameworkDetails(qpfId),
          manageMteService.getMteQuestions(qpfId),
          manageMteService.getQpAnalysis(qpfId, true)
        ]);

        if (fRes.status === 1) setQpDetails(fRes.data);
        if (qRes.status === 1) setQuestions(qRes.data);
        if (aRes.status === 1) setAnalysisData(aRes.data);
      }
    } catch (error) {
      console.error("Error fetching QP details", error);
    } finally {
      setLoading(false);
    }
  };

  // Group questions by section/unit
  const sections = qpDetails?.units || [];
  const groupedQuestions = sections.map((u: any) => ({
    ...u,
    questions: questions.filter(q => q.qpf_unit_id === u.qpf_unit_id || q.unit_id === u.qpf_unit_id)
  }));

  // Map Backend Data Directly (No calculations dynamically derived from frontend questions as per req)
  const getBloomsEqualData = () => {
    if (analysisData?.bloom_equal && Array.isArray(analysisData.bloom_equal) && analysisData.bloom_equal.length > 0) {
      return (analysisData.bloom_equal as any[])
        .map((d: any) => ({
          name: d.bloom_level,
          value: Number(d.marks) || 0
        }))
        .filter(d => d.value > 0);
    }
    return [];
  };

  const getBloomsActualData = () => {
    if (analysisData?.bloom_actual && Array.isArray(analysisData.bloom_actual) && analysisData.bloom_actual.length > 0) {
      return (analysisData.bloom_actual as any[])
        .map((d: any) => ({
          name: d.bloom_level,
          value: Number(d.marks) || 0
        }))
        .filter(d => d.value > 0);
    }
    return [];
  };

  const getCOData = () => {
    if (analysisData?.co_distribution && Array.isArray(analysisData.co_distribution) && analysisData.co_distribution.length > 0) {
      return (analysisData.co_distribution as any[])
        .map((d: any) => ({
          name: d.co_code,
          value: Number(d.marks) || 0
        }))
        .filter(d => d.value > 0);
    }
    return [];
  };

  const bloomsEqualData = getBloomsEqualData();
  const bloomsData = getBloomsActualData();
  const coData = getCOData();

  return (
    <Transition show={isOpen} as={React.Fragment}>
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
            <div className="inline-block w-full max-w-6xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white border border-gray-300 rounded-none shadow-none relative font-sans">
              <div className="bg-[#1f2937] px-4 py-2 flex justify-between items-center text-white border-b border-gray-400">
                <span className="text-sm font-bold uppercase tracking-tight font-sans">View Question Paper</span>
                <button onClick={onClose} className="text-gray-300 hover:text-white transition-colors text-xs font-bold uppercase font-sans">
                  Close [X]
                </button>
              </div>

              <div className="p-6 font-sans leading-relaxed text-gray-900 min-h-[400px]">
                {loading ? (
                  <div className="flex justify-center items-center h-64">
                    <p className="text-gray-500 animate-pulse">Loading Question Paper...</p>
                  </div>
                ) : !qpDetails ? (
                  <div className="flex justify-center items-center h-64 text-red-500">
                    No framework found for this occasion.
                  </div>
                ) : (
                  <>
                    {/* Academic Header Details */}
                    <div className="mb-6 space-y-2 border-b border-gray-200 pb-4">
                      <p className="text-sm border-b border-gray-100 pb-1 font-sans">
                        <strong>Question Paper Title:</strong> {qpDetails.question_paper_title || qpDetails.qpf_title}
                      </p>
                      <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-wider font-sans">
                        <span className="w-1/3">Total Duration (H:M): {qpDetails.total_duration || qpDetails.duration}</span>
                        <span className="w-1/3 text-center italic underline text-blue-800">
                          Course: {qpDetails.crs_title || qpDetails.crs_code || data?.course_code || "N/A"}
                        </span>
                        <span className="w-1/3 text-right">Maximum Marks: {qpDetails.maximum_marks || qpDetails.max_marks}</span>
                      </div>
                      <p className="text-xs pt-1 italic text-gray-700 font-sans">
                        <strong>Note:</strong> {qpDetails.note || "N/A"}
                      </p>
                    </div>

                    {/* Section-wise Question Table */}
                    <div className="mb-10 font-sans">
                      <table className="w-full text-xs border border-gray-300 border-collapse table-fixed font-sans">
                        <thead className="bg-[#f8fafc] font-bold border-b border-gray-300">
                          <tr>
                            <th className="w-16 p-2 border-r border-gray-300 font-sans">Q. No.</th>
                            <th className="p-2 border-r border-gray-300 text-left font-sans">Question Detail</th>
                            <th className="w-16 p-2 border-r border-gray-300 font-sans">COs</th>
                            <th className="w-16 p-2 border-r border-gray-300 font-sans">Level</th>
                            <th className="w-20 p-2 border-r border-gray-300 font-sans">PI Code</th>
                            <th className="w-20 p-2 font-sans">Marks</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 font-sans">
                          {groupedQuestions.map((section: any, idx: number) => (
                            <React.Fragment key={idx}>
                              {/* Section Row */}
                              <tr className="bg-gray-100 border-b border-gray-300">
                                <td colSpan={6} className="p-2 font-bold text-gray-800 uppercase tracking-wider">
                                  {section.unit_name || section.qpf_unit_code || `Section ${idx + 1}`}
                                </td>
                              </tr>
                              {/* Section Questions */}
                              {section.questions.map((q: any, qIdx: number) => (
                                <tr key={`q-${qIdx}`} className="font-sans">
                                  <td className="p-2 border-r border-gray-200 text-center font-sans">
                                    {q.main_question_no}{q.sub_question_no ? String.fromCharCode(96 + q.sub_question_no) : ""}
                                  </td>
                                  <td className="p-2 border-r border-gray-200 text-justify leading-snug font-sans">
                                    <div dangerouslySetInnerHTML={{ __html: q.question_text }} />
                                  </td>
                                  <td className="p-2 border-r border-gray-200 text-center font-sans">{q.co_code || q.course_outcome_id || "-"}</td>
                                  <td className="p-2 border-r border-gray-200 text-center font-sans font-bold">{q.bloom_code || q.bloom_level_id || "-"}</td>
                                  <td className="p-2 border-r border-gray-200 text-center font-sans">-</td>
                                  <td className="p-2 text-center font-bold font-sans">{q.marks}</td>
                                </tr>
                              ))}
                              {/* Section Total */}
                              <tr className="border-t border-gray-200 font-semibold bg-[#fcfcfc]">
                                <td colSpan={5} className="p-2 border-r border-gray-200 text-right uppercase tracking-wider text-[11px] text-gray-600">
                                  Section Total:
                                </td>
                                <td className="p-2 text-center text-xs">{section.unit_max_marks || section.qpf_utotal_marks || "-"}</td>
                              </tr>
                            </React.Fragment>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t-2 border-gray-400 font-bold bg-[#f1f5f9] font-sans">
                            <td colSpan={5} className="p-3 border-r border-gray-300 text-right uppercase tracking-[0.1em] text-[12px] text-gray-900 font-sans">
                              Grand Total Marks:
                            </td>
                            <td className="p-3 text-center text-sm font-sans text-blue-800">{qpDetails.grand_total || qpDetails.maximum_marks}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {/* Question Paper Analysis — Two Charts Only */}
                    <div className="space-y-8 mt-8">
                      <h3 className="text-sm font-bold text-gray-800 uppercase tracking-tight border-b border-gray-200 pb-2">
                        Question Paper Analysis
                      </h3>

                      {/* 1. Course Outcome Marks Distribution */}
                      <div className="border border-gray-200 rounded-none overflow-hidden">
                        <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
                          <h4 className="text-xs font-bold text-gray-700 uppercase tracking-tight">
                            Course Outcome Marks Distribution
                          </h4>
                        </div>
                        <div className="p-4 flex flex-col lg:flex-row gap-6 items-start">
                          {/* Pie */}
                          <div className="w-full lg:w-1/2 h-[280px] flex items-center justify-center">
                            {coData.length > 0 ? (
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={coData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={95}
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(2)}%`}
                                    labelLine={true}
                                  >
                                    {coData.map((entry, index) => (
                                      <Cell key={`cell-co-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                  </Pie>
                                  <Tooltip formatter={(value: number) => [`${value.toFixed(2)}`, "Marks"]} />
                                  <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                              </ResponsiveContainer>
                            ) : (
                              <div className="flex flex-col items-center justify-center text-gray-400 gap-2">
                                <FaQuestionCircle className="w-10 h-10 opacity-20" />
                                <p className="text-xs italic">No Course Outcome data available</p>
                              </div>
                            )}
                          </div>
                          {/* Table */}
                          <div className="w-full lg:w-1/2">
                            <table className="w-full text-xs text-left border border-gray-200 border-collapse">
                              <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                  <th className="px-3 py-2 border-r border-gray-200 font-semibold text-gray-700">COs Level</th>
                                  <th className="px-3 py-2 border-r border-gray-200 font-semibold text-gray-700">Marks Distribution (X)</th>
                                  <th className="px-3 py-2 font-semibold text-gray-700">% Distribution</th>
                                </tr>
                              </thead>
                              <tbody>
                                {coData.length === 0 ? (
                                  <tr><td colSpan={3} className="px-3 py-3 text-center text-gray-400">No Data</td></tr>
                                ) : (
                                  coData.map((item, idx) => {
                                    const total = coData.reduce((acc, i) => acc + i.value, 0);
                                    return (
                                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="px-3 py-2 border-r border-gray-200 font-medium text-gray-800">{item.name}</td>
                                        <td className="px-3 py-2 border-r border-gray-200 text-gray-700">{item.value.toFixed(2)}</td>
                                        <td className="px-3 py-2 font-semibold text-blue-600">
                                          {total > 0 ? ((item.value / total) * 100).toFixed(2) : "0.00"} %
                                        </td>
                                      </tr>
                                    );
                                  })
                                )}
                              </tbody>
                              {coData.length > 0 && (
                                <tfoot>
                                  <tr className="bg-gray-100 font-bold border-t-2 border-gray-300">
                                    <td className="px-3 py-2 border-r border-gray-200 text-gray-800">Total</td>
                                    <td className="px-3 py-2 border-r border-gray-200 text-gray-800">
                                      {coData.reduce((acc, i) => acc + i.value, 0).toFixed(2)}{" "}
                                      <span className="text-gray-500 font-normal">(Y)</span>
                                    </td>
                                    <td className="px-3 py-2 text-blue-700">100.00 %</td>
                                  </tr>
                                </tfoot>
                              )}
                            </table>
                          </div>
                        </div>
                        {/* Note */}
                        <div className="px-4 pb-4">
                          <div className="bg-blue-50 border border-blue-100 rounded p-3 text-xs text-blue-800 leading-relaxed">
                            <span className="font-bold italic underline mr-1">Note:</span>
                            The above pie chart depicts the individual Course Outcome(CO) wise actual marks percentage distribution as in the question paper.{" "}
                            <strong>X</strong> = Individual Course Outcome marks&nbsp;&nbsp;
                            <strong>Y</strong> = Sum of all Course Outcomes marks&nbsp;&nbsp;
                            <strong>% Distribution</strong> = (X / Y) * 100
                          </div>
                        </div>
                      </div>

                      {/* 2. Bloom's Level Marks Distribution */}
                      <div className="border border-gray-200 rounded-none overflow-hidden">
                        <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
                          <h4 className="text-xs font-bold text-gray-700 uppercase tracking-tight">
                            Bloom's Level Marks Distribution
                          </h4>
                        </div>
                        <div className="p-4 flex flex-col lg:flex-row gap-6 items-start">
                          {/* Pie */}
                          <div className="w-full lg:w-1/2 h-[280px] flex items-center justify-center">
                            {bloomsData.length > 0 ? (
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={bloomsData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={95}
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(2)}%`}
                                    labelLine={true}
                                  >
                                    {bloomsData.map((entry, index) => (
                                      <Cell key={`cell-bl-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                  </Pie>
                                  <Tooltip formatter={(value: number) => [`${value.toFixed(2)}`, "Marks"]} />
                                  <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                              </ResponsiveContainer>
                            ) : (
                              <div className="flex flex-col items-center justify-center text-gray-400 gap-2">
                                <FaQuestionCircle className="w-10 h-10 opacity-20" />
                                <p className="text-xs italic">No Bloom's Level data available</p>
                              </div>
                            )}
                          </div>
                          {/* Table */}
                          <div className="w-full lg:w-1/2">
                            <table className="w-full text-xs text-left border border-gray-200 border-collapse">
                              <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                  <th className="px-3 py-2 border-r border-gray-200 font-semibold text-gray-700">Bloom's Level</th>
                                  <th className="px-3 py-2 border-r border-gray-200 font-semibold text-gray-700">Marks Distribution (X)</th>
                                  <th className="px-3 py-2 font-semibold text-gray-700">% Distribution</th>
                                </tr>
                              </thead>
                              <tbody>
                                {bloomsData.length === 0 ? (
                                  <tr><td colSpan={3} className="px-3 py-3 text-center text-gray-400">No Data</td></tr>
                                ) : (
                                  bloomsData.map((item, idx) => {
                                    const total = bloomsData.reduce((acc, i) => acc + i.value, 0);
                                    return (
                                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="px-3 py-2 border-r border-gray-200 font-medium text-gray-800">{item.name}</td>
                                        <td className="px-3 py-2 border-r border-gray-200 text-gray-700">{item.value.toFixed(2)}</td>
                                        <td className="px-3 py-2 font-semibold text-blue-600">
                                          {total > 0 ? ((item.value / total) * 100).toFixed(2) : "0.00"} %
                                        </td>
                                      </tr>
                                    );
                                  })
                                )}
                              </tbody>
                              {bloomsData.length > 0 && (
                                <tfoot>
                                  <tr className="bg-gray-100 font-bold border-t-2 border-gray-300">
                                    <td className="px-3 py-2 border-r border-gray-200 text-gray-800">Total</td>
                                    <td className="px-3 py-2 border-r border-gray-200 text-gray-800">
                                      {bloomsData.reduce((acc, i) => acc + i.value, 0).toFixed(2)}{" "}
                                      <span className="text-gray-500 font-normal">(Y)</span>
                                    </td>
                                    <td className="px-3 py-2 text-blue-700">100.00 %</td>
                                  </tr>
                                </tfoot>
                              )}
                            </table>
                          </div>
                        </div>
                        {/* Note */}
                        <div className="px-4 pb-4">
                          <div className="bg-blue-50 border border-blue-100 rounded p-3 text-xs text-blue-800 leading-relaxed">
                            <span className="font-bold italic underline mr-1">Note:</span>
                            The above pie chart depicts the individual Bloom's Level actual marks percentage distribution as in the question paper.{" "}
                            <strong>X</strong> = Individual Bloom's Level marks&nbsp;&nbsp;
                            <strong>Y</strong> = Sum of all Bloom's Level marks&nbsp;&nbsp;
                            <strong>% Distribution</strong> = (X / Y) * 100
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Minimal Footer */}
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 bg-white font-sans">
                <button onClick={onClose} className="px-5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white bg-red-600 hover:bg-red-700 transition-colors font-sans shadow-sm rounded-sm">
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

export default ViewQPModal;

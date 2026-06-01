import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, Transition } from "@headlessui/react";
import { GoPencil } from "react-icons/go";
import { FaCheckCircle } from "react-icons/fa";
import { MdOutlineDoNotDisturbAlt } from "react-icons/md";
import ViewQPModal from "./ViewQPModal";
import ViewRubricsModal from "./ViewRubricsModal";
import { manageMteService } from "./manageMteService";
import type { CurriculumOption, TermOption, ApiResponse } from "./responseInterface";
import { AssessmentItem } from "./responseInterface";

interface ManageMteModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseData: AssessmentItem | null;
  filters: {
    academic_batch_id?: number;
    academic_batch_code?: string;
    semester_id?: number;
    term_name?: string;
  };
}

const ManageMteModal: React.FC<ManageMteModalProps> = ({ isOpen, onClose, courseData, filters }) => {
  const navigate = useNavigate();

  // States for new modals
  const [isViewQPModalOpen, setIsViewQPModalOpen] = useState(false);
  const [isViewRubricsModalOpen, setIsViewRubricsModalOpen] = useState(false);
  const [selectedQP, setSelectedQP] = useState<any>(null);
  const [selectedRubric, setSelectedRubric] = useState<any>(null);

  const [qpData, setQpData] = useState<any[]>([]);
  const [rubricsData, setRubricsData] = useState<any[]>([]);
  const [curriculums, setCurriculums] = useState<CurriculumOption[]>([]);
  const [terms, setTerms] = useState<TermOption[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch Occasions
  useEffect(() => {
    if (isOpen && courseData) {
      const fetchOccasions = async () => {
        setLoading(true);
        try {
          const res = await manageMteService.getAssessmentOccasions({
            batchId: filters.academic_batch_id,
            termId: filters.semester_id,
            courseCode: courseData.crs_id?.toString()
          });

          // Defensive handling: if backend returned object wrapper, try to extract array
          if (res && res.status === 1) {
            // Robustly extract array data, handling potential nesting as requested by user
            // Use type casting to avoid TS2339 when accessing potentially nested .data
            const finalData = (res.data as any)?.data || res.data || [];
            setQpData(Array.isArray(finalData) ? finalData : [finalData]);
          } else {
            console.warn("getAssessmentOccasions returned no data", res);
            setQpData([]);
          }
        } catch (error) {
          console.error("Error fetching occasions", error);
        } finally {
          setLoading(false);
        }
      };
      fetchOccasions();
    }
  }, [isOpen, courseData, filters]);

  // Fetch Rubrics separately
  useEffect(() => {
    if (isOpen && courseData && filters.academic_batch_id && filters.semester_id) {
      const fetchRubrics = async () => {
        try {
          const res = await manageMteService.getRubrics(
            filters.academic_batch_id!,
            filters.semester_id!,
            courseData.crs_id!
          );
          if (res.status === 1 && res.data && res.data.rubrics && res.data.rubrics.length > 0) {
            // Map the rubrics to each actual occasion from qpData for consistency
            const mappedRubrics = qpData.map(ao => ({
              ...ao, // Carry over ao_name, created_date, created_by_name from QP List
              //rubrics_title: `MTE Rubrics - ${(courseData as any).crs_code || 'N/A'}`,
              rubrics_title: `MTE Rubrics -1`,
              ...res.data // Original rubric data (criteria, ao_method_id)
            }));
            setRubricsData(mappedRubrics);
          } else {
            setRubricsData([]);
          }
        } catch (error) {
          console.error("Error fetching rubrics:", error);
          setRubricsData([]);
        }
      };
      fetchRubrics();
    }
  }, [isOpen, courseData, filters, qpData]);

  // Fetch curriculums and terms for filter enhancement
  useEffect(() => {
    if (isOpen && filters.academic_batch_id) {
      const fetchData = async () => {
        try {
          // Fetch curriculums (use pgmId=0 to get all/fallback)
          const currRes = await manageMteService.getCurriculums(0);
          if (currRes.status === 1) {
            setCurriculums(currRes.data);
          }

          // Fetch terms for the specific batch
          const termsRes = await manageMteService.getTerms(filters.academic_batch_id!);
          if (termsRes.status === 1) {
            setTerms(termsRes.data);
          }
        } catch (error) {
          console.error("Failed to fetch curriculums/terms:", error);
        }
      };
      fetchData();
    }
  }, [isOpen, filters.academic_batch_id]);

  return (
    <>
      <Transition show={isOpen} as={React.Fragment}>
        <Dialog as='div' className='fixed inset-0 z-[100] overflow-y-auto' onClose={onClose}>
          <div className='min-h-screen px-4 text-center'>
            <Transition.Child
              as={React.Fragment}
              enter='ease-out duration-300'
              enterFrom='opacity-0'
              enterTo='opacity-100'
              leave='ease-in duration-200'
              leaveFrom='opacity-100'
              leaveTo='opacity-0'
            >
              <div className='fixed inset-0 bg-black opacity-50' />
            </Transition.Child>

            <span className='inline-block h-screen align-middle' aria-hidden='true'>&#8203;</span>

            <Transition.Child
              as={React.Fragment}
              enter='ease-out duration-300'
              enterFrom='opacity-0 scale-95'
              enterTo='opacity-100 scale-100'
              leave='ease-in duration-200'
              leaveFrom='opacity-100 scale-100'
              leaveTo='opacity-0 scale-95'
            >
              <div className='inline-block w-full max-w-5xl my-8 overflow-hidden text-left align-middle transition-all transform bg-[#f4f7f9] shadow-xl rounded-xl relative'>
                <div className='bg-white p-6'>
                  <div className='mb-6 border-b pb-4 flex justify-between items-start'>
                    <div>
                      <h3 className='text-lg leading-6 font-medium text-gray-800 focus:outline-none'>
                        Manage MTE QP {courseData && `- ${courseData.qpd_title}`}
                      </h3>
                      <p className='text-sm text-gray-500 mt-1'>Manage MTE question papers and rubrics for the selected course</p>
                    </div>
                    <button
                      onClick={onClose}
                      className='text-gray-400 hover:text-gray-600 transition-colors focus:outline-none'
                      aria-label='Close modal'
                    >
                      <svg className='h-6 w-6' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                      </svg>
                    </button>
                  </div>

                  <div className="flex flex-col gap-6 max-h-[70vh] overflow-y-auto px-1 pb-4">
                    {/* Top Section */}
                    <div>
                      <div className="mb-4 mt-2 pb-2 border-b border-gray-100">
                        <h4 className="text-lg font-medium text-[#4a8494]">MTE QP List</h4>
                      </div>
                      {/* <div className="overflow-hidden bg-white border border-gray-200 rounded-lg shadow-sm">
                        <div className="overflow-hidden bg-white border border-[#d9dee7]"></div>
                        <div className="overflow-x-auto"> */}
                        <div className="overflow-hidden bg-white border border-[#d9dee7]">
  <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                           <thead className="bg-[#f8fafc]">
  <tr>
    {[
      "Occasion Name",
      "QP Title",
      "Created Date",
      "Created By",
      "Action",
      "View QP",
      "Upload QP"
    ].map((h, i) => (
      <th
        key={i}
        className="
          px-4
          py-0
          h-[42px]
          align-middle
          text-left
          text-[13px]
          font-semibold
          text-black
          border-r
          border-[#d9dee7]
          last:border-r-0
        "
      >
        {h}
      </th>
    ))}
  </tr>
</thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {qpData.length > 0 ? qpData.map((row, i) => (
                                //<tr key={i} className="hover:bg-gray-50 transition-colors duration-150">
                                <tr key={i} className="hover:bg-[#d9ebf7] transition-colors duration-150">
                                  <td className="px-4 py-2 whitespace-nowrap text-[14px] font-normal text-black border-r border-[#e2e8f0]">{row.ao_name}</td>
                                 <td className="px-4 py-2 whitespace-nowrap text-[14px] font-normal text-black border-r border-[#e2e8f0]">{row.qpd_title}</td>
                                  <td className="px-4 py-2 whitespace-nowrap text-[14px] font-normal text-black border-r border-[#e2e8f0]">{row.created_date}</td>
                                  <td className="px-4 py-2 whitespace-nowrap text-[14px] font-normal text-black border-r border-[#e2e8f0]">{row.created_by_name}</td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm border-r border-[#e2e8f0]">
                                    <div className="flex  justify-center items-center ">
                                      <GoPencil
                                        size={18}
                                        className="cursor-pointer text-yellow-600"
                                        title="Edit QP"
                                        onClick={() => {
                                          const enhancedFilters = {
                                            ...filters,
                                            curriculum_name: curriculums?.find((c: CurriculumOption) => c.academic_batch_id === filters.academic_batch_id)?.academic_batch_code || filters.academic_batch_code || 'N/A',
                                            term_name: terms?.find((t: TermOption) => t.semester_id === filters.semester_id)?.term_name || filters.term_name || 'N/A'
                                          };
                                          navigate("/assessment/manage_mte_qp/details", { state: { qpf_id: row.qpf_id, ao_id: row.ao_id, qpd_id: row.qpd_id, course: courseData, filters: enhancedFilters } });
                                        }}
                                      />
                                    </div>
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm border-r border-[#e2e8f0]">
                                    <span
                                      className="text-blue-600 hover:underline cursor-pointer font-medium"
                                      onClick={() => {
                                        setSelectedQP(row);
                                        setIsViewQPModalOpen(true);
                                      }}
                                    >
                                      View QP
                                    </span>
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm">
                                    <span className="text-gray-600 font-sans text-xs">
                                      <span
                                        className="text-blue-600 hover:underline cursor-pointer"
                                        onClick={() => {
                                          const enhancedFilters = {
                                            ...filters,
                                            curriculum_name: curriculums?.find((c: CurriculumOption) => c.academic_batch_id === filters.academic_batch_id)?.academic_batch_code || filters.academic_batch_code || 'N/A',
                                            term_name: terms?.find((t: TermOption) => t.semester_id === filters.semester_id)?.term_name || filters.term_name || 'N/A'
                                          };
                                          navigate("/assessment/manage_mte_qp/import", { state: { row, filters: enhancedFilters } });
                                        }}
                                      >
                                        Uploaded
                                      </span> |
                                      <span className="text-blue-600 hover:underline cursor-pointer mx-1">View</span>
                                    </span>
                                  </td>
                                </tr>
                              )) : (
                                <tr>
                                  <td colSpan={7} className="px-4 py-8 text-center text-[13px] text-[#5c6773]">
                                    No rows to show
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Section */}
                    <div>
                      <div className="mb-4 mt-2 pb-2 border-b border-gray-100">
                        <h4 className="text-lg font-medium text-[#4a8494]">MTE Rubrics List</h4>
                      </div>
                      {/* //<div className="overflow-hidden bg-white border border-gray-200 rounded-lg shadow-sm">
                        <div className="overflow-hidden bg-white border border-[#d9dee7]"></div>
                        <div className="overflow-x-auto"> */}
                        <div className="overflow-hidden bg-white border border-[#d9dee7]">
  <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                           <thead className="bg-[#f8fafc]">
  <tr>
    {[
      "Occasion Name",
      "Rubrics Title",
      "Created Date",
      "Created By",
      "Action",
      "Finalize Rubrics",
      "View Rubrics",
      "Upload QP"
    ].map((h, i) => (
      <th
        key={i}
        className="
          px-4
          py-0
          h-[42px]
          align-middle
          text-left
          text-[13px]
          font-semibold
          text-black
          border-r
          border-[#d9dee7]
          last:border-r-0
        "
      >
        {h}
      </th>
    ))}
  </tr>
</thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {rubricsData.length > 0 ? rubricsData.map((row, i) => (
                                //<tr key={i} className="hover:bg-gray-50 transition-colors duration-150">
                                <tr key={i} className="hover:bg-[#d9ebf7] transition-colors duration-150">
                                 <td className="px-4 py-2 whitespace-nowrap text-[14px] font-normal text-black border-r border-[#e2e8f0]">{row.ao_name}</td>
                                 <td className="px-4 py-2 whitespace-nowrap text-[14px] font-normal text-black border-r border-[#e2e8f0]">{row.rubrics_title}</td>
                                 <td className="px-4 py-2 whitespace-nowrap text-[14px] font-normal text-black border-r border-[#e2e8f0]">{row.created_date}</td>
                                  <td className="px-4 py-2 whitespace-nowrap text-[14px] font-normal text-black border-r border-[#e2e8f0]">{row.created_by_name}</td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm border-r border-[#e2e8f0]">
                                    <div className="flex  justify-center items-center ">
                                      <GoPencil
                                        size={18}
                                        className="cursor-pointer text-yellow-600"
                                        title="Edit Rubric"
                                        onClick={() => {
                                          navigate("/assessment/manage_mte_qp/rubrics", { state: { course: courseData, filters, ao_id: row.ao_id, qpd_id: row.qpd_id, rubrics: row } });
                                        }}
                                      />
                                    </div>
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm border-r border-[#e2e8f0]">
                                    <span className="text-blue-600 hover:underline cursor-pointer font-medium">Finalize Rubrics</span>
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm border-r border-[#e2e8f0]">
                                    <span
                                      className="text-blue-600 hover:underline cursor-pointer font-medium"
                                      onClick={() => {
                                        setSelectedRubric(row);
                                        setIsViewRubricsModalOpen(true);
                                      }}
                                    >
                                      View Rubrics
                                    </span>
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm">
                                    <span className="text-gray-600 font-sans text-xs">
                                      <span
                                        className="text-blue-600 hover:underline cursor-pointer"
                                        onClick={() => {
                                          const enhancedFilters = {
                                            ...filters,
                                            curriculum_name: curriculums?.find((c: CurriculumOption) => c.academic_batch_id === filters.academic_batch_id)?.academic_batch_code || filters.academic_batch_code || 'N/A',
                                            term_name: terms?.find((t: TermOption) => t.semester_id === filters.semester_id)?.term_name || filters.term_name || 'N/A'
                                          };
                                          navigate("/assessment/manage_mte_qp/import", { state: { row, filters: enhancedFilters } });
                                        }}
                                      >
                                        Uploaded
                                      </span> |
                                      <span className="text-blue-600 hover:underline cursor-pointer mx-1">View</span>
                                    </span>
                                  </td>
                                </tr>
                              )) : (
                                <tr>
                                  <td colSpan={8} className="px-4 py-8 text-center text-[13px] text-[#5c6773]">
                                    No rows to show
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className='flex justify-end gap-3 mt-6 pt-5 border-t border-gray-100 bg-gray-50 p-6 -mx-6 -mb-6'>
                    <button
                      onClick={() => {
                        onClose();
                        navigate("/assessment/manage_mte_qp/rubrics", { state: { course: courseData, filters } });
                      }}
                      className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 shadow-sm transition-all focus:outline-none"
                    >
                      Define Rubrics
                    </button>
                    <button
                      onClick={() => {
                        onClose();
                        const enhancedFilters = {
                          ...filters,
                          curriculum_name: curriculums?.find((c: CurriculumOption) => c.academic_batch_id === filters.academic_batch_id)?.academic_batch_code || 'N/A',
                          term_name: terms?.find((t: TermOption) => t.semester_id === filters.semester_id)?.term_name || 'N/A'
                        };
                        const firstAoId = qpData.length > 0 ? qpData[0].ao_id : undefined;
                        navigate('/assessment/manage_mte_qp/create', { state: { course: courseData, filters: enhancedFilters, ao_id: firstAoId } });
                      }}
                      className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md transition-all hover:bg-blue-700 shadow-sm focus:outline-none"
                    >
                      Create New MTE
                    </button>
                    <button
                      onClick={onClose}
                      className="px-6 py-2 text-sm font-medium text-white bg-red-500 rounded-md transition-all hover:bg-red-600 shadow-sm focus:outline-none"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </Transition.Child>
          </div>

        </Dialog>
      </Transition>

      {/* New View Modals */}
      <ViewQPModal
        isOpen={isViewQPModalOpen}
        onClose={() => setIsViewQPModalOpen(false)}
        data={selectedQP}
      />
      <ViewRubricsModal
        isOpen={isViewRubricsModalOpen}
        onClose={() => setIsViewRubricsModalOpen(false)}
        data={selectedRubric}
      />
    </>
  );
};

export default ManageMteModal;


import React, { useState } from 'react';
import { FaBook, FaCheck, FaChevronRight, FaFilePdf, FaFileWord, FaList, FaQuestionCircle, FaTimes } from 'react-icons/fa';
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useCiaAttainment } from './useCiaAttainment';
import CiaAttainmentFilters from './CiaAttainmentFilters';
import { AttainmentData, CiaAttainmentSelectionContext, CoAssessmentDetails, CoDrilldownDetails } from './ciaAttainmentTypes';
import '../../assessment/cia/cia.css';
import '../cceDataImport/CiaDataImport.css';

const ciaTealActionButtonClass =
  'inline-flex items-center gap-1.5 rounded-[5px] border border-[#437880] bg-[#437880] px-5 py-2 text-[13px] font-semibold text-white transition hover:border-[#3a6a71] hover:bg-[#3a6a71] disabled:cursor-not-allowed disabled:opacity-60';

const CIA_MARKS_UPLOAD_ROUTE = '/attainment/cce_data_import';
const CIA_QUESTION_PAPER_ROUTE = '/assessment/manage_cia_qp';
const CIA_BLOCKED_HEADING =
  'You cannot Finalize the Course - CIA-Course Outcomes(COs) Attainment for this Section/Division . Kindly complete the below activities :';

const classifyBlockedMessage = (messages: string[] = []) => {
  const combined = messages.join(' ').toLowerCase();

  if (
    combined.includes('question paper')
    || combined.includes('finalized cia question paper')
    || combined.includes('qp ')
    || combined.includes(' qp')
  ) {
    return 'CIA question paper is not created/finalized for these Occasions :';
  }

  if (
    combined.includes('marks')
    || combined.includes('assessment data')
    || combined.includes('student assessment')
  ) {
    return 'Assessment data (student marks) are not imported/uploaded for these Occasions :';
  }

  if (
    combined.includes('mapping')
    || combined.includes('co mappings')
    || combined.includes('attainment rows')
  ) {
    return 'CO mapping / attainment data is not available for this Section/Division :';
  }

  return null;
};

const CoAssessmentDetailsModal: React.FC<{
  details: CoAssessmentDetails | null;
  onClose: () => void;
  onHelpClick: () => void;
}> = ({ details, onClose, onHelpClick }) => {
  if (!details) return null;

  return (
    <div className="cce-modal-overlay">
      <div className="cce-modal-box cce-modal-box-md">
        <div className="cce-modal-header border-b border-gray-200" style={{ backgroundColor: '#f8fafc', color: '#437880' }}>
          <span className="cce-modal-title">Course Outcomes (COs) Assessment details</span>
          <button type="button" onClick={onHelpClick} title="Web Help" className="text-[#437880] hover:text-[#315f68] cursor-pointer">
            <FaQuestionCircle />
          </button>
        </div>
        <div className="cce-modal-body">
          <div className="mb-4 text-[13px] text-gray-700">
            <div className="font-bold text-gray-900">{details.co_code}: {details.co_statement}</div>
          </div>
          {details.blocking_message && (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded p-3 mb-4 text-sm">
              {details.blocking_message}
            </div>
          )}
          <div className="overflow-hidden border border-gray-200 rounded">
            <table className="cia-table-consolidated w-full border-collapse" style={{ fontSize: '13px' }}>
              <thead>
                <tr>
                  <th>Assessment</th>
                  <th>Q<br />No.</th>
                  <th>Question Content</th>
                  <th>Marks</th>
                </tr>
              </thead>
              <tbody>
                {details.questions.map((question, index) => (
                  <tr key={`${question.question_no}-${index}`}>
                    <td className="align-top">{question.assessment}</td>
                    <td className="align-top">{question.question_no}</td>
                    <td className="align-top">{question.question_content}</td>
                    <td className="text-right align-top">{Number(question.marks).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="cce-modal-footer">
          <button type="button" onClick={onClose} className="bg-red-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-red-700">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const DrilldownModal: React.FC<{
  details: CoDrilldownDetails | null;
  context: CiaAttainmentSelectionContext;
  onClose: () => void;
  onHelpClick: () => void;
}> = ({ details, context, onClose, onHelpClick }) => {
  if (!details) return null;

  const curriculumName = details.curriculum_name || context.curriculumName;
  const termName = details.term_name || context.termName;
  const courseName = details.course_name || context.courseName;
  const iaWeightage = Number(details.ia_weightage || 0).toFixed(2);

  return (
    <div className="cce-modal-overlay">
      <div className="cce-modal-box cce-modal-box-lg">
        <div className="cce-modal-header border-b border-gray-200" style={{ backgroundColor: '#f8fafc', color: '#437880' }}>
          <span className="cce-modal-title">Course Outcomes (COs) drill down</span>
          <button type="button" onClick={onHelpClick} title="Web Help" className="text-[#437880] hover:text-[#315f68] cursor-pointer">
            <FaQuestionCircle />
          </button>
        </div>
        <div className="cce-modal-body text-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[13px] text-gray-700 mb-5">
            <div><span className="font-semibold text-gray-900">Curriculum:</span> {curriculumName || '-'}</div>
            <div><span className="font-semibold text-gray-900">Term:</span> {termName || '-'}</div>
            <div><span className="font-semibold text-gray-900">Course:</span> {courseName || '-'}</div>
          </div>
          <div className="mb-6 text-[13px] text-gray-700">
            <span className="font-semibold text-gray-900">IA Weightage:</span> {iaWeightage}%
          </div>
          {details.blocking_message && (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded p-3 mb-5 text-sm">
              {details.blocking_message}
            </div>
          )}
          <div className="border-t border-gray-200 pt-5">
            <div className="text-[13px] text-gray-700 mb-2">CO Statement :</div>
            <div className="font-bold text-[14px] text-gray-900 mb-4">{details.co_code}: {details.co_statement}</div>
          </div>
          <div className="overflow-hidden border border-gray-200 rounded">
            <table className="cia-table-consolidated w-full border-collapse" style={{ fontSize: '13px' }}>
              <thead>
                <tr>
                  <th style={{ width: 76 }}>Sl No.</th>
                  <th>CO Code</th>
                  <th>Occasion</th>
                  <th>Actual Attainment %</th>
                  <th>Actual Attainment Level</th>
                </tr>
              </thead>
              <tbody>
                {details.rows.map((row, index) => (
                  <tr key={`${row.occasion}-${index}`}>
                    <td className="text-right align-top">{row.sl_no || index + 1}</td>
                    <td className="text-center align-top">{row.co_code}</td>
                    <td className="text-center align-top">{row.occasion}</td>
                    <td className="text-right align-top">{Number(row.actual_attainment_percentage).toFixed(2)}%</td>
                    <td className="text-right align-top">{Number(row.actual_attainment_level).toFixed(2)}</td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={3} />
                  <td className="text-right align-top font-bold">Total Attainment %: {Number(details.total_attainment_percentage).toFixed(2)}%</td>
                  <td className="text-right align-top font-bold">Total Attainment Level: {Number(details.total_attainment_level).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div className="cce-modal-footer">
          <button type="button" onClick={onClose} className="bg-red-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-red-700">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const CiaSimpleModal: React.FC<{
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  footer: React.ReactNode;
  size?: 'md' | 'lg';
  onHelpClick?: () => void;
  showHeaderClose?: boolean;
}> = ({ title, children, onClose, footer, size = 'md', onHelpClick, showHeaderClose = false }) => (
  <div className="cce-modal-overlay">
    <div className={`cce-modal-box ${size === 'lg' ? 'cce-modal-box-lg' : 'cce-modal-box-md'}`}>
      <div className="cce-modal-header border-b border-gray-200" style={{ backgroundColor: '#f8fafc', color: '#437880' }}>
        <span className="cce-modal-title">{title}</span>
        {showHeaderClose ? (
          <button type="button" onClick={onClose} title="Close" className="text-gray-300 hover:text-gray-400 cursor-pointer">
            <FaTimes />
          </button>
        ) : onHelpClick ? (
          <button type="button" onClick={onHelpClick} title="Web Help" className="text-[#437880] hover:text-[#315f68] cursor-pointer">
            <FaQuestionCircle />
          </button>
        ) : (
          <FaQuestionCircle title="Web Help" className="text-[#437880]" />
        )}
      </div>
      <div className="cce-modal-body">
        {children}
      </div>
      <div className="cce-modal-footer">
        {footer}
      </div>
    </div>
  </div>
);

const CiaAttainmentPage: React.FC = () => {
  const {
    curriculums, terms, courses, sections, occasions,
    filters, attainmentData, assessmentDetails, drilldownDetails, selectionContext, hasRequiredFilters, loading, actionLoading,
    handleFilterChange, loadAssessmentDetails, closeAssessmentDetails, loadDrilldownDetails, closeDrilldownDetails, exportAttainment,
  } = useCiaAttainment();
  const [exportOpen, setExportOpen] = useState(false);
  const [showFinalizeWarning, setShowFinalizeWarning] = useState(false);
  const [showLogHistory, setShowLogHistory] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [activeHelpTopic, setActiveHelpTopic] = useState<'list' | 'calculation' | null>(null);

  const displayData = attainmentData;
  const shouldShowResults = hasRequiredFilters && Boolean(displayData);
  const isBlocked = displayData?.status?.toLowerCase() === 'blocked';
  const pct = (value: number) => `${Number(value || 0).toFixed(2)}%`;
  const workflowRows = displayData?.workflow_co_attainment || displayData?.co_attainment || [];
  const workflowCourseAttainment = displayData?.workflow_course_attainment ?? displayData?.course_attainment ?? 0;
  const workflowWeightedAttainment = displayData?.workflow_course_attainment_after_weightage ?? displayData?.course_attainment_after_weightage ?? 0;

  const renderSectionHeader = (title: string, className = '') => (
    <div className={`cia-attainment-section-header ${className}`}>
      <h3 className="cia-attainment-section-title">{title}</h3>
    </div>
  );

  const renderTargetLevelsTable = (showSerialNo = false) => (
    <div className="overflow-hidden border border-gray-200 rounded">
      <table className="cia-table-consolidated w-full border-collapse" style={{ fontSize: '13px' }}>
        <thead>
          <tr>
            {showSerialNo && <th className="text-left" style={{ width: 64 }}>Sl No.</th>}
            <th className="text-left">Attainment<br />Level Name</th>
            <th className="text-left">Attainment<br />Level Value</th>
            <th>Target</th>
          </tr>
        </thead>
        <tbody>
          {(displayData?.levels || []).map((level, index) => (
            <tr key={level.value}>
              {showSerialNo && <td className="text-right align-top">{index + 1}</td>}
              <td className={showSerialNo ? 'align-top' : 'text-center align-top'}>{level.name}</td>
              <td className="text-right align-top">{level.value}</td>
              <td>
                {Number(level.target_percentage).toFixed(0)}% students scoring &gt;= 50% marks out of relevant<br />
                maximum marks.
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderWorkflow = () => {
    const chartData = workflowRows.map((co) => ({
      coCode: co.co_code,
      threshold: Number(co.threshold_attainment || 0),
    }));
    const thresholdColors = ['#a93572', '#c7ffc0', '#a8c5a6'];

    return (
      <div className="mt-5">
        {renderSectionHeader('Course Outcome(COs) Attainment')}
        <div className="cia-attainment-chart-shell">
          <div className="h-[360px] max-w-[1120px] mx-auto">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 24, right: 24, left: 6, bottom: 34 }}>
              <CartesianGrid stroke="#d4d4d4" />
              <XAxis dataKey="coCode" tick={{ fontSize: 13, fontWeight: 700, fill: '#777' }} />
              <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} tick={{ fontSize: 12, fontWeight: 700, fill: '#777' }} />
              <Tooltip formatter={(value: number) => [`${Number(value).toFixed(2)}%`, 'Threshold Direct Attainment %']} />
              {(displayData?.levels || []).map((level, index) => (
                <ReferenceLine key={level.value} y={level.target_percentage} stroke={thresholdColors[index] || '#94a3b8'} strokeWidth={1.5} />
              ))}
              <Bar dataKey="threshold" name="Threshold Direct Attainment %" fill="#42b8c8" barSize={18}>
                <LabelList dataKey="threshold" position="top" formatter={(value: number) => Number(value).toFixed(2)} style={{ fontSize: 12, fill: '#555' }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        </div>
        <div className="flex justify-center mt-4">
          <div className="cia-attainment-chart-legend-box">
            <span className="w-3 h-3 inline-block bg-[#42b8c8]" />
            Threshold Direct Attainment %
          </div>
        </div>
        <div className="flex justify-center gap-20 mt-10 mb-7 text-[13px] text-gray-700 flex-wrap">
          {(displayData?.levels || []).map((level, index) => (
            <span key={level.value} className="inline-flex items-center gap-2">
              <span className="w-4 h-4 inline-block" style={{ backgroundColor: thresholdColors[index] || '#94a3b8' }} />
              {level.name} ({Number(level.target_percentage).toFixed(2)}%)
            </span>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div>
            {renderSectionHeader('Direct Attainment / Target Levels')}
            {renderTargetLevelsTable(true)}
          </div>
          <div>
            {renderSectionHeader('Course Outcomes(COs) Attainment')}
            <div className="overflow-hidden border border-gray-200 rounded">
              <table className="cia-table-consolidated w-full border-collapse" style={{ fontSize: '13px' }}>
                <thead>
                  <tr>
                    <th className="text-left" style={{ width: 64 }}>Sl No.</th>
                    <th>Course Outcomes<br />(COs)</th>
                    <th>Threshold based<br />Attainment</th>
                    <th>Attainment<br />Level</th>
                    <th>Average based<br />Attainment %</th>
                  </tr>
                </thead>
                <tbody>
                  {workflowRows.map((co, index) => (
                    <tr key={co.co_id}>
                      <td className="text-right align-top">{index + 1}</td>
                      <td className="text-center align-top">
                        {co.co_code}<br />
                        <button
                          type="button"
                          className="cce-link-btn cce-link-btn-blue cursor-pointer hover:underline"
                          onClick={() => loadAssessmentDetails(co.co_id)}
                        >
                          View details
                        </button>
                      </td>
                      <td className="text-center align-top">
                        {pct(co.threshold_attainment)}<br />
                        <button
                          type="button"
                          className="cce-link-btn cce-link-btn-blue cursor-pointer hover:underline"
                          onClick={() => loadDrilldownDetails(co.co_id)}
                        >
                          drill down
                        </button>
                      </td>
                      <td className="text-right align-top">{co.attainment_level}</td>
                      <td className="text-right align-top">{pct(co.average_attainment)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap gap-x-7 gap-y-2 mt-3 text-[13px] text-gray-700">
              <span><strong>Actual Course Attainment :</strong>{pct(workflowCourseAttainment)}</span>
              <span><strong>Course Attainment After Weightage:</strong> {pct(workflowWeightedAttainment)}</span>
            </div>
          </div>
        </div>

        <div className="cia-attainment-note-box">
          <div className="cia-attainment-note-head">
            <strong>Note:</strong> The above bar graph depicts the overall class performance with respect to the Threshold % for individual Course Outcomes (COs). The Threshold based Attainment % and Average based Attainment % is calculated using the below formula.
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="cia-attainment-note-col md:border-r md:border-gray-200">
              <strong>For Threshold based Attainment % = ( x / y ) * 100</strong><br />
              x = Count of Students &gt;= to Threshold %<br />
              y = Total number of Students Attempted .
            </div>
            <div className="cia-attainment-note-col">
              <strong>For Average based Attainment % = ( x / y ) *100</strong><br />
              x = Average Secured marks of Attempted Students<br />
              y = Maximum Marks .
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAttainmentResults = (data: AttainmentData) => {
    if (isBlocked) {
      const blockingMessages = data.blocking_messages || [];
      const matchedReason = classifyBlockedMessage(blockingMessages);
      const fallbackMessage = matchedReason ? null : blockingMessages[0];

      return (
        <div className="w-full mt-5 rounded border border-gray-200 bg-white p-8 text-sm shadow-sm">
          <div className="mx-auto max-w-4xl text-center">
            <p className="font-bold text-red-600">
              {CIA_BLOCKED_HEADING}
            </p>
            {matchedReason && (
              <p className="mt-8 text-[15px] font-bold text-red-600">
                {`>> ${matchedReason}`}
              </p>
            )}
            <div className="mt-4 flex flex-col items-center justify-center gap-3">
              <a href={CIA_MARKS_UPLOAD_ROUTE} className="inline-block text-[#0b78d1] underline hover:text-[#095fa6]">
                Click here to upload course CIA data
              </a>
              <div className="font-medium text-gray-700">OR</div>
              <a href={CIA_QUESTION_PAPER_ROUTE} className="inline-block text-[#0b78d1] underline hover:text-[#095fa6]">
                Click here to Create QP course CIA data
              </a>
            </div>
            {fallbackMessage && (
              <p className="mt-4 text-[12px] text-red-600">
                {fallbackMessage}
              </p>
            )}
          </div>
        </div>
      );
    }

    return (
      <>
      {(data.blocking_messages || []).length > 0 && (
        <div className="bg-amber-50 p-4 rounded border border-amber-200 text-amber-900 text-sm mt-5">
          <ul className="list-disc list-inside">
            {data.blocking_messages.map((message, index) => <li key={index}>{message}</li>)}
          </ul>
        </div>
      )}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-5">
        <div>
          {renderSectionHeader('Course Outcomes(COs) Attainment')}
          <div className="overflow-hidden border border-gray-200 rounded">
            <table className="cia-table-consolidated w-full border-collapse" style={{ fontSize: '13px' }}>
              <thead>
                <tr>
                  <th className="text-left" style={{ width: '23%' }}>Section /Division -<br />A</th>
                  <th colSpan={3} className="text-left">
                    Status: <span className="text-[#00cc00] font-bold">{data.status}</span>
                  </th>
                </tr>
                <tr>
                  <th className="text-left">CO Code</th>
                  <th>Threshold based<br />Attainment %</th>
                  <th className="text-left">Attainment<br />Level</th>
                  <th>Average based<br />Attainment %</th>
                </tr>
              </thead>
              <tbody>
                {data.co_attainment.map((co) => (
                  <tr key={co.co_id}>
                    <td className="font-medium">{co.co_code}</td>
                    <td>{pct(co.threshold_attainment)}</td>
                    <td>{co.attainment_level}</td>
                    <td>{pct(co.average_attainment)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-2 mt-3 text-[13px] text-gray-700">
            <span><strong>Actual Course Attainment:</strong> {pct(data.course_attainment)}</span>
            <span><strong>Course Attainment After Weightage :</strong> {pct(data.course_attainment_after_weightage)}</span>
          </div>
        </div>

        <div>
          {renderSectionHeader('Direct Attainment / Target Levels')}
          {renderTargetLevelsTable()}
        </div>
      </div>
      </>
    );
  };

  return (
    <div className="cia-container max-w-full">
      <div className="flex items-center justify-between pb-5">
        <h3 className="cia-page-title mb-0">
          IA - Course Outcomes (COs) Attainment
        </h3>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setShowLogHistory(true)} title="Click to view Log History" className="text-[#437880] hover:text-[#315f68] cursor-pointer">
            <FaList size={18} />
          </button>
          <button type="button" onClick={() => setShowHelp(true)} title="Web Help" className="text-[#437880] hover:text-[#315f68] cursor-pointer">
            <FaQuestionCircle size={18} />
          </button>
        </div>
      </div>

      <div className="cia-attainment-card mb-8">
        <div className="flex flex-col gap-6">
          <CiaAttainmentFilters
            curriculums={curriculums}
            terms={terms}
            courses={courses}
            sections={sections}
            occasions={occasions}
            filters={filters}
            onFilterChange={handleFilterChange}
            noteActive={hasRequiredFilters}
            loading={loading}
          />

          <div className="flex justify-end gap-3">
            {hasRequiredFilters && (
              <button
                type="button"
                onClick={() => setShowFinalizeWarning(true)}
                disabled={actionLoading}
                className={ciaTealActionButtonClass}
              >
                <FaCheck /> Finalize Attainment
              </button>
            )}
            {hasRequiredFilters && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setExportOpen((open) => !open)}
                  disabled={actionLoading}
                  className={ciaTealActionButtonClass}
                >
                  <FaBook /> Export <span className="text-[10px]">▼</span>
                </button>
                {exportOpen && (
                  <div className="absolute right-0 top-[38px] z-50 bg-white border border-gray-200 rounded shadow-md min-w-[104px] py-2 text-sm">
                    <button type="button" onClick={() => { setExportOpen(false); exportAttainment('pdf'); }} className="w-full px-4 py-1.5 text-left hover:bg-gray-50 flex items-center gap-2">
                      <FaFilePdf className="text-red-600" /> .pdf
                    </button>
                    <button type="button" onClick={() => { setExportOpen(false); exportAttainment('doc'); }} className="w-full px-4 py-1.5 text-left hover:bg-gray-50 flex items-center gap-2">
                      <FaFileWord className="text-blue-600" /> .doc
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {shouldShowResults && displayData && (
        <div className="cia-attainment-card">
          <>
            {!isBlocked && workflowRows.length > 0 && renderWorkflow()}
            {renderAttainmentResults(displayData)}
          </>
        </div>
      )}
      {showFinalizeWarning && (
        <CiaSimpleModal
          title="CIA Finalise Warning !!!"
          onClose={() => setShowFinalizeWarning(false)}
          onHelpClick={() => setShowHelp(true)}
          footer={(
            <button type="button" onClick={() => setShowFinalizeWarning(false)} className="cce-btn-export">
              <FaCheck /> OK
            </button>
          )}
        >
          <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
            <p>
              Finalise the CIA marks under the CIA Data Import menu, then proceed to the section-wise CO attainment (CIA) finalisation option.
            </p>
            <a href="/attainment/cce_data_import" className="cce-link-btn cce-link-btn-blue">
              Click this link to finalise CIA marks.
            </a>
          </div>
        </CiaSimpleModal>
      )}
      {showLogHistory && (
        <CiaSimpleModal
          title="Log History for CO Attainment (IA)"
          onClose={() => setShowLogHistory(false)}
          onHelpClick={() => setShowHelp(true)}
          footer={(
            <button type="button" onClick={() => setShowLogHistory(false)} className="bg-red-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-red-700 inline-flex items-center gap-2">
              <FaTimes /> Close
            </button>
          )}
          size="lg"
        >
          <p className="text-sm font-bold text-gray-800">Log history not available.</p>
        </CiaSimpleModal>
      )}
      <CoAssessmentDetailsModal details={assessmentDetails} onClose={closeAssessmentDetails} onHelpClick={() => setShowHelp(true)} />
      <DrilldownModal details={drilldownDetails} context={selectionContext} onClose={closeDrilldownDetails} onHelpClick={() => setShowHelp(true)} />
      {showHelp && (
        <CiaSimpleModal
          title="IonCUDOS Help And Support - CO Attainment (CIA)"
          onClose={() => setShowHelp(false)}
          showHeaderClose
          footer={(
            <button type="button" onClick={() => setShowHelp(false)} className="bg-red-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-red-700 inline-flex items-center gap-2">
              <FaTimes /> Close
            </button>
          )}
          size="lg"
        >
          <div className="text-sm text-gray-700">
            <p className="mb-8">
              The User is allowed to calculate the CO Attainment(CIA) for the respective Course.
            </p>
            <p className="font-bold mb-4">Help Topics:</p>
            <div className="space-y-4">
              <div>
                <button
                  type="button"
                  className="cce-link-btn cce-link-btn-blue inline-flex items-center gap-2"
                  onClick={() => setActiveHelpTopic(activeHelpTopic === 'list' ? null : 'list')}
                >
                  <FaChevronRight className={activeHelpTopic === 'list' ? 'rotate-90 transition-transform' : 'transition-transform'} />
                  List Course Outcome (CO) Attainment CIA
                </button>
                {activeHelpTopic === 'list' && (
                  <div className="mt-2 ml-6 border border-gray-200 rounded bg-gray-50 p-4 text-gray-700 leading-6">
                    <ol className="list-decimal ml-5 space-y-1">
                      <li>Select the curriculum from the `Curriculum` drop-down list.</li>
                      <li>Select the term from the `Term` drop-down list.</li>
                      <li>Select the course from the `Course` drop-down list.</li>
                      <li>Select the section from the `Section` drop-down list.</li>
                      <li>Select the CIA occasion from the `CIA Occasion` drop-down list.</li>
                      <li>Select `View details` to display the `Course Outcome (CO) Assessment Details` window.</li>
                      <li>Select the `drill down` link to display the `CO Attainment Assessment Occasion wise` window.</li>
                      <li>Select the `Finalize Attainment` button to finalize the calculated attainment values.</li>
                      <li>Select the `Export` button to export the CO attainment details in Word or PDF format.</li>
                    </ol>
                    <p className="mt-4">
                      <strong>NOTE:</strong> The user can select all the occasions or just one or two as per the requirement. Depending upon the selected occasion, the CO attainment is displayed.
                    </p>
                    <p className="mt-4">
                      <strong>NOTE:</strong> If for any Occasion in the Occasion list, the marks are not uploaded to it, then the note is displayed saying that either the process is incomplete, i.e. marks has not been uploaded or the Question Paper for the respective Occasion is not defined. In these cases we cannot finalize the Occasions.
                    </p>
                  </div>
                )}
              </div>
              <div>
                <button
                  type="button"
                  className="cce-link-btn cce-link-btn-blue inline-flex items-center gap-2"
                  onClick={() => setActiveHelpTopic(activeHelpTopic === 'calculation' ? null : 'calculation')}
                >
                  <FaChevronRight className={activeHelpTopic === 'calculation' ? 'rotate-90 transition-transform' : 'transition-transform'} />
                  Calculation
                </button>
                {activeHelpTopic === 'calculation' && (
                  <div className="mt-2 ml-6 border border-gray-200 rounded bg-gray-50 p-4 text-gray-700 leading-6 space-y-4">
                    <div>
                      <div className="font-semibold text-gray-900 mb-1">1. Threshold Based Attainment (Default Method)</div>
                      <p>
                        Consider the set of 10 Students for 10 marks exam, if threshold percentage is 60, then 60% of 10 Student = 6 and 60% of 10 marks = 6. So, in this example, consider 7 Students have secured equal or more that threshold percentage. Now considering,
                      </p>
                      <p className="mt-2">
                        x = count of students &gt;= threshold value = 7
                      </p>
                      <p className="mt-2">
                        y = total no. of Students attempted = 10
                      </p>
                      <p className="mt-2">
                        As per the formula,
                      </p>
                      <p className="mt-2">
                        Threshold based Attainment = (x/y) * 100 = (7/10) * 100 = 70
                      </p>
                      <p className="mt-2 font-semibold text-gray-900">
                        Threshold based Attainment value is 70%.
                      </p>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 mb-1">2. Average Method Attainment</div>
                      <p>
                        Consider the set of 10 students for this calculation. Here we don&apos;t consider the Threshold percentage, the total test mark is 10, no. of students who have attempted this Question is 8.
                      </p>
                      <p className="mt-2">
                        Let&apos;s say the average secured marks of Attempted Students,
                      </p>
                      <p className="mt-2">
                        x = Average secured marks of Attempted Students
                      </p>
                      <p className="mt-2">
                        = Sum of secured marks / Total number of Attempted students
                      </p>
                      <p className="mt-2">
                        = 9+8+7+5+8+6+7+8 / 8
                      </p>
                      <p className="mt-2 font-semibold text-gray-900">
                        x = 7.25
                      </p>
                      <p className="mt-2">
                        y = Maximum Marks
                      </p>
                      <p className="mt-2 font-semibold text-gray-900">
                        y = 10
                      </p>
                      <p className="mt-2">
                        As per formula,
                      </p>
                      <p className="mt-2">
                        Average Based Attainment = (x/y) * 100 = (7.25 / 10) * 100 = 72.5
                      </p>
                      <p className="mt-2 font-semibold text-gray-900">
                        Average Based Attainment = 72.5%
                      </p>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 mb-1">3. Finalize button operation</div>
                      <p>
                        Upon selecting all the occasions, the `Finalize Attainment` button is displayed.
                      </p>
                      <p className="mt-2">
                        Overall CIA attainment for CO1 can be calculated as, assumes if CO1 is mapped to the Activity1 and Activity2. The CO Attainment value for Activity1 is 50% and for the Activity2 is 70%. Then the overall attainment value for CO1 is,
                      </p>
                      <p className="mt-2">
                        Overall CIA Attainment for CO1 = (Activity1 + Activity2) / 2
                      </p>
                      <p className="mt-2">
                        = (50 + 70) / 2 = 120 / 2
                      </p>
                      <p className="mt-2 font-semibold text-gray-900">
                        Overall CIA Attainment for CO1 = 60%
                      </p>
                      <p className="mt-2">
                        <strong>NOTE:</strong> These methods in the Application depend on the setting set by the Admin.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CiaSimpleModal>
      )}
    </div>
  );
};

export default CiaAttainmentPage;

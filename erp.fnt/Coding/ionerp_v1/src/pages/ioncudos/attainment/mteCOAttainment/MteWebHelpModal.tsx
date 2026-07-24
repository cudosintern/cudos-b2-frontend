import React, { useState } from 'react';
import ModalContainer from '../../../../components/Modal/ModalContainer';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface Props {
    open: boolean;
    onClose: () => void;
}

const MteWebHelpModal: React.FC<Props> = ({ open, onClose }) => {
    const [expandedTopic, setExpandedTopic] = useState<string | null>(null);

    const toggleTopic = (topic: string) => {
        setExpandedTopic(expandedTopic === topic ? null : topic);
    };

    return (
        <ModalContainer
            isOpen={open}
            onClose={onClose}
            title="IonCUDOS Help And Support - CO Attainment (MTE)"
            size="lg"
        >
            <div className="flex flex-col text-left space-y-6">
                {/* Intro Description */}
                <div className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-lg border border-gray-100">
                    The User is allowed to calculate the MTE Attainment for the respective Course.
                </div>

                {/* Help Topics */}
                <div>
                    <h4 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wider">Help Topics:</h4>
                    <div className="space-y-3">
                        {/* Topic 1: List Course Outcome (CO) Attainment MTE */}
                        <div className="border border-gray-200 rounded-lg overflow-hidden transition-all shadow-sm">
                            <button
                                onClick={() => toggleTopic('list')}
                                className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 transition text-sm font-semibold text-blue-600 focus:outline-none"
                            >
                                <div className="flex items-center gap-2">
                                    {expandedTopic === 'list' ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                    <span>List Course Outcome (CO) Attainment MTE</span>
                                </div>
                            </button>
                            {expandedTopic === 'list' && (
                                <div className="p-4 bg-gray-50 text-xs text-gray-600 border-t border-gray-200 leading-relaxed space-y-3">
                                    <ol className="list-decimal pl-4 space-y-1.5">
                                        <li>Select the curriculum from the 'Curriculum' drop-down list.</li>
                                        <li>Select the term from the 'Term' drop-down list.</li>
                                        <li>Select the course from the 'Course' drop-down list.</li>
                                        <li>Select the MTE Occasion from the 'MTE Occasions' drop-down list.</li>
                                    </ol>
                                    <div className="font-semibold text-gray-700">
                                        NOTE: <span className="font-normal text-gray-600">The User can select all the occasions or just one or two as per the requirement. Depending upon the selected Occasion, the COs Attainment is displayed.</span>
                                    </div>
                                    <ol className="list-decimal pl-4 space-y-1.5" start={5}>
                                        <li>Select 'View details' link to view the 'Course Outcome (CO) Assessment Details' popup window.</li>
                                        <li>Select the 'drill down' link, to display the 'CO Attainment Assessment Occasion wise' window.</li>
                                        <li>Select the 'Finalize Attainment' button to finalize the calculated Attainment values.</li>
                                    </ol>
                                    <div className="font-semibold text-gray-700">
                                        NOTE: <span className="font-normal text-gray-600">If for any Occasion in the Occasion list, the marks are not uploaded to it. Then the Note is displayed, saying that either the process is incomplete .i.e. <span className="font-bold">marks has not been uploaded</span> or <span className="font-bold">the Question Paper for the respective Occasion is not defined</span>. In these cases we cannot finalize the Occasions.</span>
                                    </div>
                                    <ol className="list-decimal pl-4 space-y-1.5" start={8}>
                                        <li>Select the 'Export' button to export the CO attainment details in the Word or PDF format.</li>
                                    </ol>
                                </div>
                            )}
                        </div>

                        {/* Topic 2: Calculation */}
                        <div className="border border-gray-200 rounded-lg overflow-hidden transition-all shadow-sm">
                            <button
                                onClick={() => toggleTopic('calc')}
                                className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 transition text-sm font-semibold text-blue-600 focus:outline-none"
                            >
                                <div className="flex items-center gap-2">
                                    {expandedTopic === 'calc' ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                    <span>Calculation</span>
                                </div>
                            </button>
                            {expandedTopic === 'calc' && (
                                <div className="p-4 bg-gray-50 text-xs text-gray-600 border-t border-gray-200 leading-relaxed space-y-4">
                                    {/* Section 1 */}
                                    <div className="space-y-2">
                                        <div className="font-bold text-gray-800 text-sm">1. Threshold Based Attainment (Default Method)</div>
                                        <p>Consider the set of 10 Students for 10 marks exam, if threshold percentage is 60, then 60% of 10 Student = 6 and 60% of 10 marks = 6. So, in this example, consider 7 Students have secured equal or more that <span className="font-bold">threshold percentage</span>. Now considering,</p>
                                        <div className="pl-4 font-mono text-gray-700 space-y-1">
                                            <div>x = count of students &gt;= threshold value = 7</div>
                                            <div>y = total no. of Students attempted = 10</div>
                                        </div>
                                        <p className="mt-2">As per the formula,</p>
                                        <p>Threshold based Attainment = (x/y) * 100 = (7/10) * 100 = 70</p>
                                        <div className="font-bold text-gray-850">Threshold based Attainment value is 70%.</div>
                                    </div>

                                    {/* Section 2 */}
                                    <div className="space-y-2">
                                        <div className="font-bold text-gray-800 text-sm">2. Average Method Attainment</div>
                                        <p>Consider the set of 10 students for this calculation. Here we don't consider the Threshold percentage, the total test mark is 10, no. of students who have attempted this Question is 8.</p>
                                        <p>Let's say the average secured marks of Attempted Students,</p>
                                        <div className="pl-4 font-mono text-gray-700 space-y-1">
                                            <div>x = Average secured marks of Attempted Students</div>
                                            <div className="pl-2">= Sum of secured marks / Total number of Attempted students</div>
                                            <div className="pl-2">= 9+8+7+5+8+6+7+8 / 8</div>
                                            <div className="font-bold">x = 7.25</div>
                                            <div>y = Maximum Marks</div>
                                            <div className="font-bold">y = 10</div>
                                        </div>
                                        <p className="mt-2">As per formula,</p>
                                        <p>Average Based Attainment = (x/y) * 100 = (7.25 / 10) * 100 = 72.5</p>
                                        <div className="font-bold text-gray-850">Average Based Attainment = 72.5%</div>
                                    </div>

                                    {/* Section 3 */}
                                    <div className="space-y-2">
                                        <div className="font-bold text-gray-800 text-sm">3. Finalize button operation</div>
                                        <p className="pl-4">Upon selecting all the Occasions, 'Finalize' button is displayed.</p>
                                        <p>Overall CIA attainment for CO1 can be calculated as, assumes if CO1 is mapped to the Activity1 and Activity2. The CO Attainment value for Activity1 is 50% and for the Activity2 is 70%. Then the overall attainment value for CO1 is,</p>
                                        <div className="pl-4 font-mono text-gray-700 space-y-1">
                                            <div>Overall CIA Attainment for CO1 = (Activity1 + Activity2) / 2</div>
                                            <div className="pl-2">= (50 + 70) / 2 = 120 / 2</div>
                                            <div className="font-bold">Overall CIA Attainment for CO1 = 60%</div>
                                        </div>
                                    </div>

                                    <div className="font-bold text-gray-700 pt-2 border-t">
                                        NOTE: <span className="font-normal text-gray-600">These methods in the Application depend on the setting set by the Admin.</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Close Button */}
                <div className="flex justify-end pt-4 border-t">
                    <button
                        onClick={onClose}
                        className="flex items-center gap-2 px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-semibold transition shadow-sm"
                    >
                        <span className="font-bold text-sm">✖</span> Close
                    </button>
                </div>
            </div>
        </ModalContainer>
    );
};

export default MteWebHelpModal;

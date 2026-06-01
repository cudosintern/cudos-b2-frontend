import React from 'react';
import { FaFileDownload, FaExclamationCircle } from 'react-icons/fa';

const MTEInstructions: React.FC = () => {
    const steps = [
        {
            id: 1,
            content: (
                <p className="text-slate-600 leading-relaxed">
                    Click here to <a 
                        href="/MTE_Student_Marks_Template.xls" 
                        download="MTE_Student_Marks_Template.xls"
                        className="font-bold text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1"
                    >
                        <FaFileDownload size={12} /> Download MTE Student Marks Template
                    </a>
                </p>
            ),
            subContent: "(File name: MTE_Student_Marks_Template.xls)"
        },
        {
            id: 2,
            content: (
                <p className="text-slate-600 leading-relaxed">
                    Fill the student marks in the template. <span className="font-bold text-slate-800 underline decoration-slate-200 underline-offset-4">Do not modify or delete</span> the file headers or existing USN data.
                </p>
            ),
            warning: "Discard previous downloaded file before downloading new file"
        },
        {
            id: 3,
            content: (
                <p className="text-slate-600 leading-relaxed py-1.5">
                    Click on the <span className="font-bold text-slate-800">"Choose File"</span> button to select your filled .xls/.xlsx file and click <span className="font-bold text-[#4a8494]">"Upload Now"</span>.
                </p>
            )
        },
        {
            id: 4,
            content: (
                <p className="text-slate-600 leading-relaxed py-1.5">
                    Verify the imported data in the <span className="font-bold text-slate-800">Preview Table</span> that appears below the upload section.
                </p>
            )
        },
        {
            id: 5,
            content: (
                <p className="text-slate-600 leading-relaxed py-1.5">
                    Click on the <span className="font-bold text-[#4a8494]">"Accept"</span> button in the footer to finalize the marks import.
                </p>
            )
        }
    ];

    return (
        <div className="px-10 pb-12">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-1.5 h-6 bg-[#4a8494] rounded-full"></div>
                <h3 className="text-lg font-bold text-slate-700">Steps to follow:</h3>
            </div>
            
            <div className="space-y-4">
                {steps.map((step) => (
                    <div key={step.id} className="flex gap-4 p-5 rounded-2xl border border-slate-100 bg-white hover:border-blue-100 transition-all group shadow-sm hover:shadow-md">
                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold shrink-0 border border-blue-100">
                            {step.id}
                        </div>
                        <div className="flex-1">
                            {step.content}
                            {step.subContent && (
                                <p className="text-[11px] text-slate-400 mt-1 italic font-medium">{step.subContent}</p>
                            )}
                            {step.warning && (
                                <p className="text-[11px] text-rose-500 mt-2 font-bold flex items-center gap-1.5 uppercase tracking-tight">
                                    <FaExclamationCircle /> {step.warning}
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MTEInstructions;

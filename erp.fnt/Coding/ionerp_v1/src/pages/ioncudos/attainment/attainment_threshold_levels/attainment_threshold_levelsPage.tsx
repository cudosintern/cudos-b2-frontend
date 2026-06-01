import React, { useState } from "react";

import ProgramLevelPerformanceLevels from "./ProgramLevelPerformanceLevels";
import POIndirectAttainmentLevels from "./POIndirectAttainmentLevels";
import AttainmentTargetsForCourse from "./AttainmentTargetsForCourse";
import AttainmentTargetsForCurriculum from "./AttainmentTargetsForCurriculum";
import { EditIcon } from "./commonComponents";
import Select from "../../../../components/FormBuilder/fields/Select";
import { useAxios } from "../../../../hooks/useAxios";
import { CurriculumOption } from "./responseInterface";

const AttainmentThresholdLevelsPage = () => {
  const [activeTab, setActiveTab] = useState("program");
  const [selectedBatch, setSelectedBatch] = useState<number | "">("");

  const { responseData: batchData } = useAxios<any, CurriculumOption[]>(
    "cudos/po/get_academic_batch_dropdown",
    { method: "get", shouldFetch: true, loader: false }
  );

  // ================= COURSE TABLE =================

  // const directColumnDefs = [
  //   {
  //     //headerName: "General",
      
  //       { headerName: "Sl No.", valueGetter: "node.rowIndex + 1", width: 50, cellStyle: { textAlign: 'center' } },
  //       { headerName: "Attainment Level Name", field: "name", width: 100 },
  //       { headerName: "Attainment Level Value", field: "val", width: 60, cellStyle: { textAlign: 'center' } },
      
  //   },
  //   {
  //     //headerName: "CCE Attainment",
      
  //       { headerName: "CCE Direct Attainment% Of Students", field: "c1", width: 150 },
  //       { headerName: "Target %", field: "c2", width: 90 },
      
  //   },
  //   {
  //     //headerName: "MTE Attainment",
      
  //       { headerName: "Direct %", field: "m1", width: 90 },
  //       { headerName: "Target %", field: "m2", width: 90 },
  
  //   },
  //   {
  //     headerName: "SEE Attainment",
      
  //       { headerName: "Direct %", field: "s1", width: 90 },
  //       { headerName: "Target %", field: "s2", width: 90 },
      
  //   },
  //   { headerName: "Justification", field: "justification", minWidth: 150, flex: 1 },
  //   {
  //     headerName: "Action",
  //     cellRenderer: (p: any) => <EditIcon onClick={() => console.log("Edit Direct", p.data)} />,
  //     width: 70,
  //     cellStyle: { textAlign: "center" },
  //   },
  // ];
  // ================= CURRICULUM =================


  const currColumnDefs = [
  { headerName: "Sl No.", valueGetter: "node.rowIndex + 1", width: 80 },

  { headerName: "Attainment Level Name", field: "name", width: 150 },

  { headerName: "Attainment Level Value", field: "val", width: 120 },

  { headerName: "CCE Direct Attainment % of Students", field: "c1", width: 100 },
  
  
    { 
  headerName: "", 
  field: "cond1", 
  width: 60, 

   headerComponent: () => null,   // 🔥 removes header content
  suppressHeaderMenuButton: true, // 🔥 removes filter icon space

  cellStyle: { textAlign: "center" },

},

  { headerName: "CCE Target %(University average% marks)", field: "m1", width: 100 },

  { headerName: "MTE Direct  Attainment% of students", field: "s1", width: 100 },
    { 
  headerName: "", 
  field: "cond1", 
  width: 60, 
  cellStyle: { textAlign: "center" } 
},

  { headerName: "MTE Target %(University average% of marks)", field: "i1", width: 120 },

  //{ headerName: "≥", field: "cond1", width: 80 },

  { headerName: "SEE Direct Attainment % of Students", field: "c2", width: 120 },
    { 
  headerName: "", 
  field: "cond1", 
  width: 60, 
  cellStyle: { textAlign: "center" } 
},

  { headerName: "SEE Target %(University average% of marks", field: "m2", width: 120 },

  //{ headerName: "SEE Target", field: "s2", width: 120 },

  { headerName: "Justification", field: "justification", width: 250 },
];

  const currRowData = [
    { name: "Low", val: "L", c1: "50", m1: "50", s1: "50", i1: "50", cond1: ">=", c2: "40", m2: "40", s2: "40", justification: "Min" },
    { name: "Medium", val: "M", c1: "60", m1: "60", s1: "60", i1: "60", cond1: ">=", c2: "50", m2: "50", s2: "50", justification: "Avg" },
    { name: "High", val: "H", c1: "70", m1: "70", s1: "70", i1: "70", cond1: ">=", c2: "60", m2: "60", s2: "60", justification: "Max" },
  ];

  // ================= CURRICULUM INDIRECT =================

  const currIndirectColumnDefs = [
    { headerName: "Sl No.", valueGetter: "node.rowIndex + 1", width: 80 },
    { headerName: "Attainment Level Name", field: "name" },
    { headerName: "Attainment Level Value", field: "val" },
    { headerName: "Indirect Attainment %", field: "pct1" },
    { headerName: "", field: "cond" },
    { headerName: "Target %", field: "pct2" },
    {
      headerName: "Action",
      cellRenderer: (p: any) => <EditIcon onClick={() => console.log("Edit Curric Indirect", p.data)} />,
      width: 80,
      cellStyle: { textAlign: "center" },
    },
  ];

  const currIndirectRowData = [
    { name: "L", val: 10, pct1: "Actual %", cond: ">=", pct2: "20%" },
  ];

  // 👉 KEEP YOUR ORIGINAL columnDefs + rowData HERE (IMPORTANT)

  return (
    <div className="p-6 bg-[#f4f7f9] min-h-screen">
      <div className="bg-white rounded-xl shadow-sm p-6">
        {/* GLOBAL FILTER */}
        <div className="mb-6 max-w-sm">
          <Select
            label="Academic Batch"
            required={true}
            value={selectedBatch}
            onChange={(val) => setSelectedBatch(Number(val))}
            options={batchData?.map(b => ({ label: b.label, value: b.value })) || []}
            placeholder="Select Batch"
          />
        </div>

        {/* TABS */}
        <div className="flex border-b">
          {[
            { key: "program", label: "Program Level Performance Levels" },
            { key: "po", label: "PO Indirect Attainment Levels" },
            { key: "course", label: "Attainment Targets for Individual Course" },
            { key: "curriculum", label: "Attainment Targets for Curriculum" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm ${activeTab === tab.key
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* CONTENT */}
        {activeTab === "program" && <ProgramLevelPerformanceLevels selectedBatch={selectedBatch} />}
        {activeTab === "po" && <POIndirectAttainmentLevels selectedBatch={selectedBatch} />}

        {activeTab === "course" && (
          <AttainmentTargetsForCourse
            selectedBatch={selectedBatch}
            selectedBatchLabel={batchData?.find(b => b.value === selectedBatch)?.label || ""}
          />
        )}

        {activeTab === "curriculum" && (
          <AttainmentTargetsForCurriculum
            currColumnDefs={currColumnDefs}
            currRowData={currRowData}
            currIndirectColumnDefs={currIndirectColumnDefs}
            currIndirectRowData={currIndirectRowData}
          />
        )}
      </div>
    </div>
  );
};

export default AttainmentThresholdLevelsPage;
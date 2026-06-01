import React from "react";
import DataTable from "../../../../components/Table/DataTable";
import { SectionTitle, TableWrapper, SearchBar } from "./commonComponents";
import ConfirmDialog from "../../../../components/Dialog/ConfirmDialog";

const AttainmentTargetsForCurriculum = ({
  currColumnDefs,
  currRowData,
  currIndirectColumnDefs,
  currIndirectRowData,
}: any) => {
  const [data, setData] = React.useState(currRowData);
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
  const [form, setForm] = React.useState({
    name: "",
    val: "",
    c1: "",
    m1: "",
    s1: "",
    i1: "",
    c2: "",
    m2: "",
    s2: "",
    justification: "",
  });

  const [errors, setErrors] = React.useState<any>({});

  const handleChange = (field: string, value: string) => {
    setForm({ ...form, [field]: value });
    if (errors[field]) {
      setErrors((prev: any) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validate = () => {
    const newErrors: any = {};
    const required = ["name", "val", "c1", "m1", "s1", "i1", "c2", "m2", "s2"];
    required.forEach((f) => {
      if (!form[f as keyof typeof form]) {
        newErrors[f] = "Required";
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validate()) {
      setData([...data, { ...form, cond1: ">=" }]);
      handleReset();
    }
  };

  const handleReset = () => {
    setForm({
      name: "",
      val: "",
      c1: "",
      m1: "",
      s1: "",
      i1: "",
      c2: "",
      m2: "",
      s2: "",
      justification: "",
    });
    setErrors({});
  };

  const handleSubmit = () => {
    alert("Data submitted successfully!");
  };

  const [searchTerm1, setSearchTerm1] = React.useState("");
  const [searchTerm2, setSearchTerm2] = React.useState("");

  const filteredData1 = React.useMemo(() => {
    if (!searchTerm1) return data;
    const lower = searchTerm1.toLowerCase();
    return data.filter((item: any) => 
      item.name?.toLowerCase().includes(lower) || 
      item.val?.toString().toLowerCase().includes(lower)
    );
  }, [data, searchTerm1]);

  const filteredData2 = React.useMemo(() => {
    if (!searchTerm2) return currIndirectRowData;
    const lower = searchTerm2.toLowerCase();
    return currIndirectRowData.filter((item: any) => 
      item.name?.toLowerCase().includes(lower) || 
      item.val?.toString().toLowerCase().includes(lower)
    );
  }, [currIndirectRowData, searchTerm2]);

  return (
    <div className="mt-8 overflow-x-hidden">
      {/* BUTTON */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setIsConfirmOpen(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded text-sm font-medium shadow-sm transition-all"
        >
          Recalculate Attainment
        </button>
      </div>

      {/* MAIN TABLE */}
      <SearchBar value={searchTerm1} onChange={(e: any) => setSearchTerm1(e.target.value)} />
      <TableWrapper>
        <DataTable
          rowData={filteredData1}
          columnDefs={currColumnDefs}
          headerFilter={false}
          pageSize={10}
          pagination={false}
          wrapHeaders={true}
          autoHeight={true}
        />
      </TableWrapper>

      {/* INPUT ROW */}
      <div className="bg-white border-x border-b border-[#dde2eb]">
        <div className="flex items-start">
          {/* Sl No */}
          <div style={{ width: "50px" }} className="flex-shrink-0 text-center pt-2.5 text-gray-500 text-xs border-r border-[#dde2eb] h-full flex items-center justify-center">-</div>

          {/* Level Name */}
          <div style={{ width: "110px" }} className="flex-shrink-0 px-2 py-2 border-r border-[#dde2eb]">
            <input
              placeholder="Name*"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className={`w-full border rounded px-2 py-1 text-xs ${errors.name ? "border-red-500" : "border-gray-300"}`}
            />
            {errors.name && <p className="text-[10px] text-red-500 mt-1 leading-tight">{errors.name}</p>}
          </div>

          {/* Value */}
          <div style={{ width: "80px" }} className="flex-shrink-0 px-2 py-2 border-r border-[#dde2eb]">
            <input
              placeholder="Value*"
              value={form.val}
              onChange={(e) => handleChange("val", e.target.value)}
              className={`w-full border rounded px-2 py-1 text-xs ${errors.val ? "border-red-500" : "border-gray-300"}`}
            />
            {errors.val && <p className="text-[10px] text-red-500 mt-1 leading-tight">{errors.val}</p>}
          </div>

          {[
            { id: "c1", label: "CCE*", placeholder: "%" },
            { id: "m1", label: "MTE*", placeholder: "%" },
            { id: "s1", label: "SEE*", placeholder: "%" },
            { id: "i1", label: "Ind*", placeholder: "%" },
          ].map((field) => (
            <div key={field.id} style={{ width: "80px" }} className="flex-shrink-0 px-2 py-2 border-r border-[#dde2eb]">
              <input
                placeholder={field.label}
                value={(form as any)[field.id]}
                onChange={(e) => handleChange(field.id, e.target.value)}
                className={`w-full border rounded px-2 py-1 text-xs ${(errors as any)[field.id] ? "border-red-500" : "border-gray-300"}`}
              />
              {(errors as any)[field.id] && <p className="text-[10px] text-red-500 mt-1 leading-tight">{(errors as any)[field.id]}</p>}
            </div>
          ))}

          {/* Centered >= symbol */}
          <div style={{ width: "40px" }} className="flex-shrink-0 flex justify-center pt-3 border-r border-[#dde2eb]">
            <span className="text-sm font-bold leading-none">≥</span>
          </div>

          {[
            { id: "c2", label: "CCE*", placeholder: "%" },
            { id: "m2", label: "MTE*", placeholder: "%" },
            { id: "s2", label: "SEE*", placeholder: "%" },
          ].map((field) => (
            <div key={field.id} style={{ width: "80px" }} className="flex-shrink-0 px-2 py-2 border-r border-[#dde2eb]">
              <input
                placeholder={field.label}
                value={(form as any)[field.id]}
                onChange={(e) => handleChange(field.id, e.target.value)}
                className={`w-full border rounded px-2 py-1 text-xs ${(errors as any)[field.id] ? "border-red-500" : "border-gray-300"}`}
              />
              {(errors as any)[field.id] && <p className="text-[10px] text-red-500 mt-1 leading-tight">{(errors as any)[field.id]}</p>}
            </div>
          ))}

          {/* Justification & Buttons */}
          <div className="flex-grow flex flex-col p-2 space-y-2">
            <textarea
              placeholder="Justification"
              value={form.justification}
              onChange={(e) => handleChange("justification", e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1 text-xs h-[32px] resize-none"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={handleSave}
                className="button-bg text-white px-3 py-1 rounded text-xs font-medium hover:opacity-90 transition-all shadow-sm"
              >
                Save
              </button>
              <button
                onClick={handleReset}
                className="bg-yellow-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-yellow-700 transition-all shadow-sm"
              >
                Reset
              </button>
              <button
                onClick={handleSubmit}
                className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-blue-700 transition-all shadow-sm"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* INDIRECT */}
      <div className="mt-12">
        <SectionTitle title="Indirect Attainment Level for Curriculum" />
        <SearchBar value={searchTerm2} onChange={(e: any) => setSearchTerm2(e.target.value)} />
        <TableWrapper>
          <DataTable
            rowData={filteredData2}
            columnDefs={currIndirectColumnDefs}
            headerFilter={false}
            pageSize={10}
            pagination={false}
            wrapHeaders={true}
          />
        </TableWrapper>
      </div>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={() => setIsConfirmOpen(false)}
        title="Confirm"
        message="Are you sure you want to Re-Calculate Attainment for this course?"
      />
    </div>
  );
};

export default AttainmentTargetsForCurriculum;
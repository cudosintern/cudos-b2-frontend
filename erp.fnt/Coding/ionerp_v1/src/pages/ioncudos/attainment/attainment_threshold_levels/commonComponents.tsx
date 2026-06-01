import { GoPencil } from "react-icons/go";
import DataTable from "../../../../components/Table/DataTable";

import { MdOutlineDoNotDisturbAlt } from "react-icons/md";

export const EditIcon = ({ onClick }: any) => (
  <GoPencil
    size={18}
    onClick={onClick}
    className="cursor-pointer text-yellow-600 inline-block"
    title="Edit"
  />
);

export const DeleteIcon = ({ onClick }: any) => (
  <MdOutlineDoNotDisturbAlt
    size={22}
    onClick={onClick}
    className="cursor-pointer text-red-600 inline-block"
    title="Delete"
  />
);

export const SectionTitle = ({ title }: any) => (
  <div className="mb-4 mt-8 pb-2 border-b border-gray-100">
    <h4 className="text-lg font-medium text-gray-800">{title}</h4>
  </div>
);

export const Dropdown = ({ label, value }: any) => (
  <div className="w-full md:w-[48%]">
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label} <span className="text-red-500">*</span>
    </label>
    <select className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md">
      <option>{value}</option>
    </select>
  </div>
);

export const TableWrapper = ({ children }: any) => (
  <div className="overflow-hidden bg-white border border-gray-200 rounded-lg shadow-sm mt-4">
    {children}
  </div>
);

export const SearchBar = ({ value, onChange }: any) => (
  <div className="flex justify-end mb-4">
    <input
      type="text"
      placeholder="Search..."
      value={value}
      onChange={onChange}
      className="w-64 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  </div>
);

//export const InputTable = ({ headers, bloom }: any) => {
export const InputTable = ({ headers, bloom, showReset = true }: any) => {
  // const columnDefs = headers.map((header: string, index: number) => {
  //   if (index === 0) {
  //     return {
  //       headerName: header,
  //       valueGetter: (p: any) => (bloom ? `L${p.node.rowIndex + 1}` : "CO1"),
  //       width: 100,
  //     };
  //   }
  //   if (index === 1) {
  //     return {
  //       headerName: header,
  //       valueGetter: () => (bloom ? "Action Verb Sample Text" : "Course Outcome Statement"),
  //       flex: 2,
  //     };
  //   }
  //   if (header.includes("Justification")) {
  //     return {
  //       headerName: header,
  //       cellRenderer: () => (
  //         <textarea className="w-full border rounded px-2 py-1 mt-1 text-sm h-10 min-w-[200px]" defaultValue="" />
  //       ),
  //       flex: 2,
  //     };
  //   }
  //   return {
  //     headerName: header,
  //     cellRenderer: () => (
  //       <div className="flex items-center gap-2">
  //         {header.includes(">=") || header.includes("≥") ? (
  //           <span className="text-lg font-bold">≥</span>
  //         ) : (
  //           <input
  //             type="text"
  //             defaultValue="50"
  //             className="w-full border rounded px-2 py-1 text-sm text-center"
  //           />
  //         )}
  //       </div>
  //     ),
  //     width: 150,
  //   };
  // });

  const columnDefs = headers.map((header: string, index: number) => {
  if (index === 0) {
    return {
      headerName: header,
      valueGetter: (p: any) => (bloom ? `L${p.node.rowIndex + 1}` : "CO1"),
      width: 120,
      headerStyle: { whiteSpace: "normal", textAlign: "center" },
    };
  }

  if (index === 1) {
    return {
      headerName: header,
      valueGetter: () =>
        bloom ? "Action Verb Sample Text" : "Course Outcome Statement",
      width: 300, // 🔥 important
      headerStyle: { whiteSpace: "normal", textAlign: "center" },
    };
  }

  if (header.includes("Justification")) {
    return {
      headerName: header,
      cellRenderer: () => (
        <textarea className="w-full border rounded px-2 py-1 mt-1 text-sm h-10 min-w-[200px]" />
      ),
      width: 260,
      headerStyle: { whiteSpace: "normal", textAlign: "center" },
    };
  }

  return {
    headerName: header,
    cellRenderer: () => (
      <div className="flex items-center gap-2">
        {header.includes(">=") || header.includes("≥") ? (
          <span className="text-lg font-bold">≥</span>
        ) : (
          <input
            type="text"
            defaultValue="50"
            className="w-full border rounded px-2 py-1 text-sm text-center"
          />
        )}
      </div>
    ),
    width: 220, // 🔥 important
    headerStyle: {
      whiteSpace: "normal",
      textAlign: "center",
    },
  };
});

  return (
    <div className="mt-4">
      <DataTable
        rowData={[{}, {}, {}, {}]}
        columnDefs={columnDefs}
        headerFilter={false}
        pagination={false}
      />
      {/* <div className="flex justify-end gap-2 mt-4">
        <button className="bg-yellow-600 px-4 py-2 text-white rounded text-sm font-medium hover:bg-yellow-700 transition-all">
          Reset
        </button>
        <button className="button-bg px-4 py-2 text-white rounded text-sm font-medium transition-colors">
          Update
        </button>
      </div> */}

      <div className="flex justify-end gap-2 mt-4">
  {showReset && (
    <button className="bg-yellow-600 px-4 py-2 text-white rounded text-sm font-medium hover:bg-yellow-700 transition-all">
      Reset
    </button>
  )}

  <button className="button-bg px-4 py-2 text-white rounded text-sm font-medium transition-colors">
    Update
  </button>
</div>
    </div>
  );
};

export const SimpleTable = ({ headers, rows }: any) => {
  const columnDefs = headers.map((h: any, i: number) => ({
    headerName: h,
    field: `col_${i}`,
    flex: i === 1 ? 2 : 1,
  }));

  const rowData = rows.map((row: any) => {
    const obj: any = {};
    row.forEach((cell: any, i: number) => {
      obj[`col_${i}`] = cell;
    });
    return obj;
  });

  return (
    <DataTable
      rowData={rowData}
      columnDefs={columnDefs}
      pagination={false}
    />
  );
};
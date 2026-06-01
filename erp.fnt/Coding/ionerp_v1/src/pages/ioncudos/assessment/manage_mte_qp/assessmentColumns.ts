/**
 * Table Column Definitions (UPDATED to match DB)
 */
export const AssessmentColumnDefs = [
  {
    headerName: "Sl No",
    field: "sl_no",
    valueGetter: "node.rowIndex + 1",
    width: 80,
  },
  { headerName: "QP Title", field: "qpd_title" },
  { headerName: "Max Marks", field: "qpd_max_marks" },
  { headerName: "Units", field: "qpd_num_units" },
  { headerName: "Timing", field: "qpd_timing" },
];
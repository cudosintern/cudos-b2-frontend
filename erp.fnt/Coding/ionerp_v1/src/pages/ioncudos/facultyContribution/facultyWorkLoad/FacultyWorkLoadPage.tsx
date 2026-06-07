import { Calendar } from "lucide-react";
import DatePicker from "react-datepicker";
import "./FacultyWorkloadPage.css";
import "react-datepicker/dist/react-datepicker.css";
import { forwardRef } from "react";
import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
//import "react-datepicker/dist/react-datepicker.css";
import { Pencil, Trash2, Filter } from "lucide-react";
import {
  getWorkloadDropdowns,
  getFacultyWorkloadList,
  saveFacultyWorkload,
  updateFacultyWorkload,
  deleteFacultyWorkload,
} from "./facultyWorkloadApi";
const Input = React.memo(({ error, ...props }: any) => (
  <div>
    <input
      {...props}
      className={`w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2
      ${error ? "border-red-500 focus:ring-red-500" : "focus:ring-blue-500"}`}
    />
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
));

const Select = React.memo(({ error, children, ...props }: any) => (
  <div>
    <select
      {...props}
      className={`w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2
      ${error ? "border-red-500 focus:ring-red-500" : "focus:ring-blue-500"}`}
    >
      {children}
    </select>
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
));
type ColumnKey =
  | "school"
  | "programType"
  | "program"
  | "category"
  | "workType"
  | "semester"
  | "workloadPercent"
  | "workloadHrs";
type FilterType =
  | "contains"
  | "notContains"
  | "equals"
  | "notEquals"
  | "startsWith"
  | "endsWith"
  | "blank"
  | "notBlank";

const FacultyWorkLoadPage = () => {
  const formRef = React.useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const handleClickOutside = () => {
      setActiveFilter("");
    };

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);
  const [activeFilter, setActiveFilter] = useState<ColumnKey | "">("");

  const [filterType, setFilterType] = useState<Record<ColumnKey, FilterType>>(
    {} as Record<ColumnKey, FilterType>,
  );
  const [errors, setErrors] = useState<any>({});
  const [tableData, setTableData] = useState<any[]>([]);
  const loadTableData = async () => {
    try {
      const res = await getFacultyWorkloadList(userId);

      if (res?.status) {
        setTableData(res.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const userId = Number(localStorage.getItem("user_id")) || 1;
  const validateForm = () => {
    let newErrors: any = {};

    if (!formData.department) newErrors.department = "Department is required";
    if (!formData.programType)
      newErrors.programType = "Program Type is required";
    if (!formData.program) newErrors.program = "Program is required";
    if (!formData.category) newErrors.category = "Program Category is required";
    if (!formData.academicYear)
      newErrors.academicYear = "Academic Year is required";
    if (!formData.workType) newErrors.workType = "Type of Work is required";
    if (!formData.semester) newErrors.semester = "Semester is required";

    // workload percent validation
    if (formData.workloadPercent !== "") {
      const percent = Number(formData.workloadPercent);

      if (isNaN(percent)) {
        newErrors.workloadPercent = "Must be a number";
      } else if (percent < 0) {
        newErrors.workloadPercent = "Cannot be negative";
      }
    }

    // workload hours validation
    if (formData.workloadHrs !== "") {
      const hrs = Number(formData.workloadHrs);

      if (isNaN(hrs)) {
        newErrors.workloadHrs = "Must be a number";
      } else if (hrs < 0) {
        newErrors.workloadHrs = "Cannot be negative";
      }
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const [editId, setEditId] = useState<number | null>(null);
  const handleSave = async () => {
    if (!validateForm()) return;

    const selectedWorkType = dropdowns.work_types.find(
      (w: any) => w.id == formData.workType,
    );

    try {
      const payload = {
        user_id: userId,
        dept_id: Number(formData.department),
        program_type: Number(formData.programType),
        program: Number(formData.program),
        program_category: formData.category,

        academic_year: formData.academicYear, // ✔ correct

        work_type: Number(formData.workType),
        type_of_work: selectedWorkType?.name || "",

        semester: Number(formData.semester), // ✔ stored in DB "year"

        workload_percent: Number(formData.workloadPercent || 0),
        workload_hours: Number(formData.workloadHrs || 0),
      };
      let res = editId
        ? await updateFacultyWorkload(editId, payload)
        : await saveFacultyWorkload(payload);

      if (res?.status) {
        toast.success(editId ? "Updated Successfully" : "Saved Successfully");
        loadTableData();
        handleReset();
      } else {
        toast.error(res?.message || "Something went wrong");
      }
    } catch (err) {
      toast.error("Server error");
    }
  };

  const handleEdit = (row: any) => {
    console.log("EDIT ROW:", row); // 👈 keep for debug

    setEditId(row.my_wid);

    // ✅ FIRST filter programs
    const filtered = dropdowns.programs.filter(
      (p: any) => p.dept_id == row.dept_id,
    );
    setFilteredPrograms(filtered);

    // ✅ THEN set form
    setFormData({
      department: row.dept_id?.toString() || "",
      programType: row.program_type?.toString() || "",
      program: row.program_id?.toString() || "",
      category: row.category_id?.toString() || "",

      // ✅ FIX: convert "2023-2024" → "2023"
      academicYear: row.academic_year
        ? row.academic_year.split("-")[0] // "2023-2024" → "2023"
        : "",

      // ✅ MUST BE ID (NOT name)
      workType: row.work_type?.toString() || "",

      semester: row.semester_id?.toString() || "",
      workloadPercent: row.workloadPercent?.toString() || "",
      workloadHrs: row.workloadHrs?.toString() || "",
    });
    setTimeout(() => {
      formRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  };
  const YearInput = forwardRef<HTMLInputElement, any>(
    ({ value, onClick, error }, ref) => (
      <div className="flex">
        <input
          ref={ref}
          value={value || ""}
          onClick={onClick}
          readOnly
          placeholder="Select Year"
          className={`w-full px-3 py-2 border rounded-l text-sm focus:outline-none
        ${error ? "border-red-500" : "border-gray-300"}`}
        />

        <span
          onClick={onClick}
          className="flex items-center px-3 border border-l-0 rounded-r bg-gray-100 cursor-pointer"
        >
          <Calendar size={16} />
        </span>
      </div>
    ),
  );
  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      const res = await deleteFacultyWorkload(deleteId);

      if (res?.status) {
        toast.success("Deleted Successfully");
        loadTableData();
      } else {
        toast.error(res?.message || "Delete failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong while deleting");
    } finally {
      setShowDeleteModal(false);
      setDeleteId(null);
    }
  };
  const [columnFilters, setColumnFilters] = useState<Record<ColumnKey, string>>(
    {
      school: "",
      programType: "",
      program: "",
      category: "",
      workType: "",
      semester: "",
      workloadPercent: "",
      workloadHrs: "",
    },
  );
  const handleReset = () => {
    setFormData({
      department: "",
      programType: "",
      program: "",
      category: "",
      academicYear: "",
      workType: "",
      semester: "",
      workloadPercent: "",
      workloadHrs: "",
    });

    setEditId(null);
    setFilteredPrograms([]);
  };

  const [filteredPrograms, setFilteredPrograms] = useState<any[]>([]);
  const [dropdowns, setDropdowns] = useState<any>({
    departments: [],
    program_types: [],
    programs: [],
    years: [],
    work_types: [],
    program_categories: [],
  });

  useEffect(() => {
    loadDropdowns();
    loadTableData();
  }, []);

  const [userDeptId, setUserDeptId] = useState<number | null>(null);

  const loadDropdowns = async () => {
    try {
      const res = await getWorkloadDropdowns(userId); // 👈 pass userId

      if (res?.status === true) {
        setDropdowns(res.data);

        // ✅ store user dept id
        setUserDeptId(res.data.user_dept_id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const [search, setSearch] = useState("");
  const [entries, setEntries] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isOpen, setIsOpen] = useState(true);

  // Form states
  const [formData, setFormData] = useState({
    department: "",
    programType: "",
    program: "",
    category: "",
    academicYear: "",
    workType: "",
    semester: "",
    workloadPercent: "",
    workloadHrs: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target; // ✅ FIX: declare first

    // ✅ ONLY DIGITS VALIDATION
    if (name === "workloadPercent" || name === "workloadHrs") {
      if (!/^\d*$/.test(value)) {
        setErrors((prev: any) => ({
          ...prev,
          [name]: "Only digits are allowed",
        }));
        return;
      }
    }

    // clear error
    setErrors((prev: any) => {
      const updated = { ...prev };
      delete updated[name];
      return updated;
    });

    // ✅ DEPARTMENT CHANGE LOGIC (PHP equivalent)
    if (name === "department") {
      const filtered = dropdowns.programs.filter(
        (p: any) => p.dept_id == value,
      );

      setFilteredPrograms(filtered);

      const userDept = userDeptId; // ✅ FIXED

      let selectedCategory = "";

      if (userDept === Number(value)) {
        selectedCategory =
          dropdowns.program_categories?.[0]?.id?.toString() || "";
      } else {
        selectedCategory =
          dropdowns.program_categories?.[1]?.id?.toString() || "";
      }

      setFormData({
        ...formData,
        department: value,
        program: "",
        category: selectedCategory,
      });

      return;
    }

    // ✅ NORMAL UPDATE
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  // Filter
  const filteredData = tableData.filter((row) => {
    // global search
    const matchesSearch = Object.values(row)
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase());

    // column filters
    const matchesColumnFilters = (
      Object.keys(columnFilters) as ColumnKey[]
    ).every((key) => {
      const filterValue = columnFilters[key]?.toLowerCase();
      if (!filterValue) return true;

      const cellValue = (row[key] || "").toString().toLowerCase();

      const type = filterType[key] || "contains";

      switch (type) {
        case "contains":
          return cellValue.includes(filterValue);

        case "notContains":
          return !cellValue.includes(filterValue);

        case "equals":
          return cellValue === filterValue;

        case "notEquals":
          return cellValue !== filterValue;

        case "startsWith":
          return cellValue.startsWith(filterValue);

        case "endsWith":
          return cellValue.endsWith(filterValue);

        case "blank":
          return cellValue === "";

        case "notBlank":
          return cellValue !== "";

        default:
          return true;
      }

      // default = contains
      return cellValue.includes(filterValue);
    });

    return matchesSearch && matchesColumnFilters;
  });

  // Pagination
  const totalPages = Math.ceil(filteredData.length / entries);
  const startIndex = (currentPage - 1) * entries;
  const paginatedData = filteredData.slice(startIndex, startIndex + entries);
  const groupedData = Object.values(
    paginatedData.reduce((acc: any, row: any) => {
      if (!acc[row.academic_year]) {
        acc[row.academic_year] = {
          year: row.academic_year,
          rows: [],
        };
      }
      acc[row.academic_year].rows.push(row);
      return acc;
    }, {}),
  );
  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      {/* HEADER */}
      <div className="text-[#4f7f82] px-4 py-2 rounded-t flex justify-between mb-6">
        <h2 className="text-lg font-semibold">Faculty Workload</h2>
      </div>

      {/* COLLAPSIBLE TITLE */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white border p-3 font-semibold text-[#4f7f82] cursor-pointer flex items-center gap-2"
      >
        <span>{isOpen ? "▼" : "▶"}</span>
        Faculty Workload
      </div>

      {isOpen && (
        <div className="bg-white border p-4">
          {/* TABLE SECTION */}
          <div className="flex justify-between mb-3">
            <div>
              Show{" "}
              <select
                value={entries}
                onChange={(e) => {
                  setEntries(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border px-2 py-1"
              >
                {[10, 20, 50, 100].map((num) => (
                  <option key={num}>{num}</option>
                ))}
              </select>{" "}
              entries
            </div>

            <div>
              Search:{" "}
              <input
                type="text"
                className="border px-2 py-1"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>

          <div className="w-full overflow-x-auto">
            <table className="min-w-[1200px] border mb-20">
              <thead className="bg-[#f3f3f3]">
                <tr>
                  {(
                    [
                      { key: "school", label: "School" },
                      { key: "programType", label: "Program Type" },
                      { key: "program", label: "Program" },
                      { key: "category", label: "Program Category" },
                      { key: "workType", label: "Work Type" },
                      { key: "semester", label: "Workload Distribution" },
                      { key: "workloadPercent", label: "Workload(%)" },
                      { key: "workloadHrs", label: "Workload(Hrs)" },
                    ] as { key: ColumnKey; label: string }[]
                  ).map((col) => (
                    <th
                      key={col.key}
                      className="p-2 border relative text-sm font-medium"
                    >
                      <div className="flex items-center justify-between">
                        <span>{col.label}</span>

                        <Filter
                          className="w-4 h-4 min-w-4 min-h-4 mt-1 text-black hover:text-blue-600 cursor-pointer flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();

                            setActiveFilter(
                              activeFilter === col.key ? "" : col.key,
                            );
                          }}
                        />
                      </div>

                      {/* FILTER DROPDOWN */}
                      {activeFilter === col.key && (
                        <div
                          className="absolute z-50 bg-white border shadow p-2 mt-2 w-44"
                          onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
                        >
                          <select
                            className="w-full border px-1 py-1 mb-2 text-sm"
                            onChange={(e) =>
                              setFilterType((prev: any) => ({
                                ...prev,
                                [col.key]: e.target.value,
                              }))
                            }
                          >
                            <option value="contains">Contains</option>
                            <option value="notContains">
                              Does not contain
                            </option>
                            <option value="equals">Equals</option>
                            <option value="notEquals">Does not equal</option>
                            <option value="startsWith">Begins with</option>
                            <option value="endsWith">Ends with</option>
                            <option value="blank">Blank</option>
                            <option value="notBlank">Not blank</option>
                          </select>

                          {filterType[col.key] !== "blank" &&
                            filterType[col.key] !== "notBlank" && (
                              <input
                                type="text"
                                placeholder="Filter..."
                                value={columnFilters[col.key] || ""}
                                onChange={(e) =>
                                  setColumnFilters((prev: any) => ({
                                    ...prev,
                                    [col.key]: e.target.value,
                                  }))
                                }
                                className="w-full border px-2 py-1 text-sm"
                              />
                            )}
                        </div>
                      )}
                    </th>
                  ))}

                  <th className="p-2 border">Edit</th>
                  <th className="p-2 border">Delete</th>
                </tr>
              </thead>

              <tbody>
                {groupedData.map((group: any, i: number) => (
                  <React.Fragment key={i}>
                    {/* Academic Year Header */}
                    <tr>
                      <td
                        colSpan={10}
                        className="bg-gray-300 font-semibold p-2"
                      >
                        Academic Year: {group.year}
                      </td>
                    </tr>

                    {/* Rows under that year */}
                    {group.rows.map((row: any, j: number) => (
                      <tr key={j}>
                        <td className="border p-2">{row.school}</td>
                        <td className="border p-2">{row.programType}</td>
                        <td className="border p-2">{row.program}</td>
                        <td className="border p-2">{row.category}</td>
                        <td className="border p-2">{row.workType}</td>
                        <td className="border p-2">{row.semester}</td>
                        <td className="border p-2">{row.workloadPercent}</td>
                        <td className="border p-2">{row.workloadHrs}</td>

                        <td className="border p-2 text-center">
                          <button
                            onClick={() => handleEdit(row)}
                            className="text-yellow-600 hover:text-yellow-800"
                          >
                            <Pencil size={18} />
                          </button>
                        </td>

                        <td className="border p-2 text-center">
                          <button
                            onClick={() => {
                              setDeleteId(row.my_wid);
                              setShowDeleteModal(true);
                            }}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* FORM BELOW TABLE */}
          <div ref={formRef} className="border mt-6">
            <div className="grid grid-cols-5 border">
              {/* Row 1 */}
              <div className="border p-3 bg-gray-100">
                <label className="text-sm font-semibold">
                  Department <span className="text-red-500">*</span>
                </label>
                <Select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  error={errors.department}
                >
                  <option value="">Select Department</option>
                  {dropdowns.departments?.map((d: any) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="border p-3 bg-gray-100">
                <label className="text-sm font-semibold">
                  Program Type <span className="text-red-500">*</span>
                </label>
                <Select
                  name="programType"
                  value={formData.programType}
                  onChange={handleChange}
                  error={errors.programType}
                >
                  <option value="">Select Program Type</option>
                  {dropdowns.program_types?.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="border p-3 bg-gray-100">
                <label className="text-sm font-semibold">
                  Program <span className="text-red-500">*</span>
                </label>
                <Select
                  name="program"
                  value={formData.program}
                  onChange={handleChange}
                  error={errors.program}
                >
                  <option value="">Select Program</option>

                  {filteredPrograms.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="border p-3 bg-gray-100">
                <label className="text-sm font-semibold">
                  Program Category <span className="text-red-500">*</span>
                </label>
                <Select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  error={errors.category}
                  disabled // ✅ disable like PHP readonly
                >
                  <option value="">Select Category</option>
                  {dropdowns.program_categories?.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="border p-3 bg-gray-100">
                <label className="text-sm font-semibold">
                  Workload Distribution (Semester-wise)
                  <span className="text-red-500">*</span>
                </label>
                <Select
                  name="semester"
                  value={formData.semester}
                  onChange={handleChange}
                  className="w-full mt-1 border px-2 py-1 rounded bg-white"
                  error={errors.semester}
                >
                  <option value="">Select Semester</option>
                  {dropdowns.semesters?.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </Select>
              </div>

              {/* Row 2 */}
              <div className="border p-3 bg-gray-100">
                <label className="text-sm font-semibold">
                  Academic Year <span className="text-red-500">*</span>
                </label>
                <div>
                  <div className={formData.academicYear ? "year-selected" : ""}>
                    <div className="relative w-full">
                      <DatePicker
                        selected={
                          formData.academicYear
                            ? new Date(Number(formData.academicYear), 0)
                            : null
                        }
                        onChange={(date: Date | null) => {
                          if (!date) return;

                          setFormData({
                            ...formData,
                            academicYear: date.getFullYear().toString(),
                          });
                        }}
                        showYearPicker
                        dateFormat="yyyy"
                        placeholderText="Select Year"
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded text-sm bg-white"
                        popperClassName="custom-year-popper"
                        calendarClassName="custom-year-picker"
                        popperPlacement="bottom-start"
                      />

                      <Calendar
                        size={18}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                      />
                    </div>
                  </div>

                  {errors.academicYear && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.academicYear}
                    </p>
                  )}
                </div>
              </div>

              <div className="border p-3 bg-gray-100">
                <label className="text-sm font-semibold">
                  Type of work <span className="text-red-500">*</span>
                </label>
                <Select
                  name="workType"
                  value={formData.workType}
                  onChange={handleChange}
                  error={errors.workType}
                >
                  <option value="">Select Work Type</option>
                  {dropdowns.work_types?.map((w: any) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="border p-3 bg-gray-100">
                <label className="text-sm font-semibold">Workload(%)</label>
                <Input
                  type="text" // ✅ IMPORTANT (not number)
                  inputMode="numeric" // mobile keypad
                  name="workloadPercent"
                  value={formData.workloadPercent}
                  onChange={handleChange}
                  error={errors.workloadPercent}
                />
              </div>

              <div className="border p-3 bg-gray-100">
                <label className="text-sm font-semibold">Workload(Hrs)</label>
                <Input
                  type="text" // ✅ IMPORTANT (not number)
                  inputMode="numeric" // mobile keypad
                  name="workloadHrs"
                  value={formData.workloadHrs}
                  onChange={handleChange}
                  error={errors.workloadHrs}
                />
              </div>

              <div className="border p-3 bg-gray-100"></div>
            </div>
          </div>

          {/* BUTTONS */}
          <div className="flex justify-end gap-3 mt-5">
            <button
              onClick={handleSave}
              className="bg-[#4f7f82] hover:bg-[#4f7f82] text-white px-5 py-2 rounded font-medium"
            >
              {editId ? "Update" : "Save"}
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 text-sm rounded bg-amber-600 text-white hover:bg-amber-500"
            >
              Reset
            </button>
          </div>
          {showDeleteModal && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded w-[400px]">
                <h2 className="text-lg font-semibold mb-4">Delete Workload</h2>

                <p className="mb-6">
                  Are you sure you want to delete this record?
                </p>

                <div className="flex justify-end gap-3">
                  <button
                    className="px-4 py-2 bg-red-600 text-white rounded"
                    onClick={() => setShowDeleteModal(false)}
                  >
                    Cancel
                  </button>

                  <button
                    className="px-4 py-2 bg-[#4f7f82] text-white rounded"
                    onClick={confirmDelete}
                  >
                    Ok
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FacultyWorkLoadPage;

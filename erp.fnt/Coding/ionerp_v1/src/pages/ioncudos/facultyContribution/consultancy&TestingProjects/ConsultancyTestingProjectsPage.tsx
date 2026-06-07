import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { Editor } from "@tinymce/tinymce-react";
import {
  Pencil,
  Trash2,
  Upload,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import {
  getDropdowns,
  getConsultancyProjects,
  saveConsultancyProject,
  updateConsultancyProject,
  deleteConsultancyProject,
  getInnovativeProjects,
  saveInnovativeProject,
  updateInnovativeProject,
  deleteInnovativeProject,
} from "./consultancyTestingProjectsApi";
interface ConsultancyForm {
  projectTitle: string;
  projectCode: string;
  consultingAgency: string;
  revenue: string;
  commencementDate: string;
  completionDate: string;
  status: string;
  role: string;
  coconsultants: string;
  abstract: string;
}

interface InnovativeForm {
  eventName: string;
  placeOfEvent: string;
  dateOfEvent: string;
  websiteLink: string;
}

type ConsultancyColumnKey =
  | "projectTitle"
  | "projectCode"
  | "consultingAgency"
  | "role"
  | "commencementDate"
  | "completionDate"
  | "status";

type InnovativeColumnKey =
  | "eventName"
  | "dateOfEvent"
  | "placeOfEvent"
  | "websiteLink";

const ConsultancyTestingProjectsPage: React.FC = () => {
  const formRef = useRef<HTMLDivElement | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const [showUploadDeleteModal, setShowUploadDeleteModal] = useState(false);

  const [selectedUploadId, setSelectedUploadId] = useState<number | null>(null);
  const [selectedUploadType, setSelectedUploadType] = useState("");
  const [uploadType, setUploadType] = useState<"consultancy" | "innovative">(
    "consultancy",
  );

  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);

  const [editableFiles, setEditableFiles] = useState<any[]>([]);

  const [uploadDeleteId, setUploadDeleteId] = useState<number | null>(null);
  const loadUploadedFiles = async (type: string, id: number) => {
    try {
      const response = await fetch(
        `http://localhost:8000/consultancy-testing-projects/upload-list/${type}/${id}`,
      );

      const data = await response.json();

      if (data.status) {
        setUploadedFiles(data.data);
        setEditableFiles(data.data);
      }
    } catch (error) {
      toast.error("Failed to load files");
    }
  };
  const loadDropdowns = async () => {
    try {
      const res = await getDropdowns();

      console.log("Dropdown API response:", res);

      const roles = res.levels || [];
      const status = res.types || [];

      setRoleDropdown(roles);
      setStatusDropdown(status);

      setConsultancyForm((prev) => ({
        ...prev,
        status: status[0]?.id || "",
        role: roles[0]?.id || "",
      }));
    } catch (error) {
      console.error("Dropdown load failed", error);
    }
  };

  const loadConsultancyProjects = async () => {
    try {
      const res: any = await getConsultancyProjects();

      setConsultancyData(res || []);
    } catch (error) {
      //toast.error("Failed to load consultancy projects");
    }
  };

  const loadInnovativeProjects = async () => {
    try {
      const res: any = await getInnovativeProjects();

      setInnovativeData(res || []);
    } catch (error) {
      //toast.error("Failed to load innovative projects");
    }
  };
  const [activeFilter, setActiveFilter] = useState<string>("");

  const [columnFilters, setColumnFilters] = useState<Record<string, string>>(
    {},
  );

  const [filterType, setFilterType] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<"consultancy" | "innovative">(
    "consultancy",
  );

  const [search, setSearch] = useState("");
  const [entries, setEntries] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  const [isOpen, setIsOpen] = useState(true);

  // DUMMY DATA
  const [consultancyData, setConsultancyData] = useState<any[]>([]);
  const [innovativeData, setInnovativeData] = useState<any[]>([]);
  const [editingConsultancyId, setEditingConsultancyId] = useState<
    number | null
  >(null);

  const [editingInnovativeId, setEditingInnovativeId] = useState<number | null>(
    null,
  );
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    id: null as number | null,
    type: "",
  });
  const [statusDropdown, setStatusDropdown] = useState<any[]>([]);
  const [roleDropdown, setRoleDropdown] = useState<any[]>([]);
  useEffect(() => {
    loadDropdowns();
    loadConsultancyProjects();
    loadInnovativeProjects();
  }, []);

  const handleConsultancyEdit = (item: any) => {
    setEditingConsultancyId(Number(item.c_id));

    setConsultancyForm({
      projectTitle: item.project_title,
      projectCode: item.project_code,
      consultingAgency: item.client,
      revenue: item.amount,
      commencementDate: item.year,
      completionDate: item.completion_year,
      status: item.status,
      role: item.user_role,
      coconsultants: item.co_consultant,
      abstract: item.abstract,
    });

    formRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };
  const handleDelete = async () => {
    try {
      if (deleteModal.type === "consultancy") {
        await deleteConsultancyProject(deleteModal.id);
        loadConsultancyProjects();
      } else {
        await deleteInnovativeProject(deleteModal.id);
        loadInnovativeProjects();
      }

      toast.success("Deleted Successfully");

      setDeleteModal({
        open: false,
        id: null,
        type: "",
      });
    } catch (error) {
      toast.error("Delete Failed");
    }
  };
  // CURRENT TAB DATA
  const currentData = Array.isArray(
    activeTab === "consultancy" ? consultancyData : innovativeData,
  )
    ? activeTab === "consultancy"
      ? consultancyData
      : innovativeData
    : [];

  // SEARCH FILTER
  const filteredData = currentData.filter((item: any) => {
    // Global Search
    const matchesSearch = Object.values(item)
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase());

    // Column Filters
    const matchesColumnFilters = Object.keys(columnFilters).every((key) => {
      const filterValue = columnFilters[key]?.toLowerCase();

      if (!filterValue) return true;

      const itemValue = String(item[key] || "").toLowerCase();

      const type = filterType[key];

      switch (type) {
        case "startsWith":
          return itemValue.startsWith(filterValue);

        case "endsWith":
          return itemValue.endsWith(filterValue);

        case "notContains":
          return !itemValue.includes(filterValue);

        default:
          return itemValue.includes(filterValue);
      }
    });

    return matchesSearch && matchesColumnFilters;
  });

  // PAGINATION
  const totalPages = Math.ceil(filteredData.length / entries);

  const startIndex = (currentPage - 1) * entries;

  const paginatedData = filteredData.slice(startIndex, startIndex + entries);

  // PAGE CHANGE
  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };
  // const [activeTab, setActiveTab] = useState<"consultancy" | "innovative">(
  //   "consultancy",
  // );

  // const [search, setSearch] = useState("");
  // const [entries, setEntries] = useState(20);
  // const [currentPage, setCurrentPage] = useState(1);

  // const [isOpen, setIsOpen] = useState(true);

  const [consultancyForm, setConsultancyForm] = useState<ConsultancyForm>({
    projectTitle: "",
    projectCode: "",
    consultingAgency: "",
    revenue: "",
    commencementDate: "",
    completionDate: "",
    status: "",
    role: "",
    coconsultants: "",
    abstract: "",
  });

  const [innovativeForm, setInnovativeForm] = useState<InnovativeForm>({
    eventName: "",
    placeOfEvent: "",
    dateOfEvent: "",
    websiteLink: "",
  });

  const [errors, setErrors] = useState<any>({});

  // VALIDATION
  const validateConsultancy = () => {
    const newErrors: any = {};

    if (!consultancyForm.projectTitle.trim()) {
      newErrors.projectTitle = "Project Title is required";
    }

    if (!consultancyForm.commencementDate) {
      newErrors.commencementDate = "Commencement Date is required";
    }

    if (!consultancyForm.status) {
      newErrors.status = "Status is required";
    }

    if (!consultancyForm.role) {
      newErrors.role = "Role is required";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const validateInnovative = () => {
    const newErrors: any = {};

    if (!innovativeForm.eventName.trim()) {
      newErrors.eventName = "Event Name is required";
    }

    if (!innovativeForm.placeOfEvent.trim()) {
      newErrors.placeOfEvent = "Place of Event is required";
    }

    if (!innovativeForm.dateOfEvent) {
      newErrors.dateOfEvent = "Date of Event is required";
    }

    // URL VALIDATION
    if (innovativeForm.websiteLink.trim()) {
      const urlPattern =
        /^(https?:\/\/)?([\w\-])+\.{1}([a-zA-Z]{2,63})([\/\w\-.~:?#[\]@!$&'()*+,;=]*)?$/;

      if (!urlPattern.test(innovativeForm.websiteLink)) {
        newErrors.websiteLink = "Please enter a valid URL";
      }
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // SAVE
  const handleConsultancySave = async () => {
    if (!validateConsultancy()) return;

    try {
      const payload = {
        project_code: consultancyForm.projectCode,
        project_title: consultancyForm.projectTitle,
        client: consultancyForm.consultingAgency,
        user_role: Number(consultancyForm.role),
        consultant: consultancyForm.consultingAgency,
        co_consultant: consultancyForm.coconsultants,
        amount: Number(consultancyForm.revenue || 0),
        abstract: consultancyForm.abstract,
        status: Number(consultancyForm.status),
        year: consultancyForm.commencementDate,
        completion_year: consultancyForm.completionDate || null,
      };

      let res;

      if (editingConsultancyId !== null) {
        res = await updateConsultancyProject(editingConsultancyId, payload);
      } else {
        res = await saveConsultancyProject(payload);
      }

      if (res?.success) {
        toast.success(res.message);

        await loadConsultancyProjects();

        setConsultancyForm({
          projectTitle: "",
          projectCode: "",
          consultingAgency: "",
          revenue: "",
          commencementDate: "",
          completionDate: "",
          status: statusDropdown[0]?.mt_details_id || "",
          role: roleDropdown[0]?.mt_details_id || "",
          coconsultants: "",
          abstract: "",
        });

        setEditingConsultancyId(null);
      } else {
        toast.error(res.message || "Operation failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Server error");
    }
  };
  const handleInnovativeSave = async () => {
    if (!validateInnovative()) return;

    try {
      const payload = {
        event_name: innovativeForm.eventName,
        place_of_event: innovativeForm.placeOfEvent,
        date_of_event: innovativeForm.dateOfEvent,
        website: innovativeForm.websiteLink,
      };

      // ✅ FIX HERE
      let res;

      if (editingInnovativeId !== null) {
        res = await updateInnovativeProject(editingInnovativeId, payload);
      } else {
        res = await saveInnovativeProject(payload);
      }

      if (res?.success) {
        toast.success(res.message);

        await loadInnovativeProjects();

        setInnovativeForm({
          eventName: "",
          placeOfEvent: "",
          dateOfEvent: "",
          websiteLink: "",
        });

        setEditingInnovativeId(null);
      } else {
        toast.error(res.message || "Operation failed");
      }
    } catch (error) {
      console.error(error);
      toast.error("Server Error");
    }
  };
  const handleInnovativeEdit = (item: any) => {
    setEditingInnovativeId(item.fcsip_id);

    setInnovativeForm({
      eventName: item.event_name,
      placeOfEvent: item.place_of_event,
      dateOfEvent: item.date_of_event,
      websiteLink: item.website,
    });

    formRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <div className="p-4 bg-[#efefef] min-h-screen">
      {/* HEADER */}
      <div className="text-[#4f7f82] px-4 py-2 rounded-t flex justify-between mb-6">
        <h2 className="text-lg font-semibold">
          Consultancy / Testing Projects
        </h2>
      </div>

      <div
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white border p-3 font-semibold text-[#4f7f82] cursor-pointer flex items-center gap-2"
      >
        <span>{isOpen ? "▼" : "▶"}</span>
        Consultancy / Testing Projects
      </div>

      {/* BODY */}
      {isOpen && (
        <div className="bg-white border border-t-0">
          {/* TABS */}
          <div className="flex border-b px-3 pt-3 gap-2">
            <button
              onClick={() => setActiveTab("consultancy")}
              className={`px-4 py-2 text-[13px] border rounded-t ${
                activeTab === "consultancy"
                  ? "bg-white border-b-white text-[#4f7f82] font-semibold"
                  : "bg-[#f3f3f3]"
              }`}
            >
              Consultancy / Testing
            </button>

            <button
              onClick={() => setActiveTab("innovative")}
              className={`px-4 py-2 text-[13px] border rounded-t ${
                activeTab === "innovative"
                  ? "bg-white border-b-white text-[#4f7f82] font-semibold"
                  : "bg-[#f3f3f3]"
              }`}
            >
              Innovative Projects
            </button>
          </div>

          {/* TABLE SECTION */}
          <div className="p-4">
            {/* CONTROLS */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2 text-sm">
                <span>Show</span>

                <select
                  value={entries}
                  onChange={(e) => setEntries(Number(e.target.value))}
                  className="border px-2 py-1 text-sm"
                >
                  {[10, 20, 50, 100].map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>

                <span>entries</span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <span>Search:</span>

                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="border px-2 py-1 w-[200px]"
                />
              </div>
            </div>

            {/* TABLE */}
            {activeTab === "consultancy" ? (
              <div className="overflow-x-auto border">
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-[#f3f3f3]">
                    <tr>
                      <th className="border px-3 py-2">Sl No.</th>

                      {[
                        { label: "Project Title", key: "project_title" },
                        { label: "Project Code", key: "project_code" },
                        { label: "Client", key: "client" },
                        { label: "Your Role", key: "user_role" },
                        { label: "Commencement Year", key: "year" },
                        { label: "Completion Year", key: "completion_year" },
                        { label: "Status", key: "status" },
                      ].map((col: any) => (
                        <th key={col.key} className="border px-3 py-2 relative">
                          <div className="flex items-center justify-between gap-2">
                            <span>{col.label}</span>

                            <button
                              onClick={() =>
                                setActiveFilter(
                                  activeFilter === col.key ? "" : col.key,
                                )
                              }
                            >
                              <Filter size={14} />
                            </button>
                          </div>

                          {activeFilter === col.key && (
                            <div className="absolute top-full right-0 z-50 bg-white border shadow-lg rounded p-3 mt-1 w-52">
                              <input
                                type="text"
                                placeholder="Filter value"
                                value={columnFilters[col.key] || ""}
                                onChange={(e) =>
                                  setColumnFilters({
                                    ...columnFilters,
                                    [col.key]: e.target.value,
                                  })
                                }
                                className="w-full border px-2 py-1 text-sm mb-2"
                              />

                              <select
                                value={filterType[col.key] || "contains"}
                                onChange={(e) =>
                                  setFilterType({
                                    ...filterType,
                                    [col.key]: e.target.value,
                                  })
                                }
                                className="w-full border px-2 py-1 text-sm"
                              >
                                <option value="contains">Contains</option>
                                <option value="startsWith">Starts With</option>
                                <option value="endsWith">Ends With</option>
                                <option value="notContains">
                                  Does Not Contain
                                </option>
                              </select>
                            </div>
                          )}
                        </th>
                      ))}

                      <th className="border px-3 py-2">Upload</th>
                      <th className="border px-3 py-2">Edit</th>
                      <th className="border px-3 py-2">Delete</th>
                    </tr>
                  </thead>

                  <tbody>
                    {paginatedData.length > 0 ? (
                      paginatedData.map((item: any, index: number) => (
                        <tr key={index}>
                          <td className="border px-3 py-2">
                            {startIndex + index + 1}
                          </td>

                          <td className="border px-3 py-2">
                            {item.project_title}
                          </td>

                          <td className="border px-3 py-2">
                            {item.project_code}
                          </td>

                          <td className="border px-3 py-2">{item.client}</td>

                          <td className="border px-3 py-2">
                            {roleDropdown.find(
                              (role) =>
                                Number(role.id) === Number(item.user_role),
                            )?.name || item.user_role}
                          </td>

                          <td className="border px-3 py-2">{item.year}</td>

                          <td className="border px-3 py-2">
                            {item.completion_year}
                          </td>

                          <td className="border px-3 py-2">
                            {statusDropdown.find(
                              (status) =>
                                Number(status.id) === Number(item.status),
                            )?.name || item.status}
                          </td>

                          <td className="border px-3 py-2 text-center text-[#4f7f82]">
                            <div
                              className="flex items-center justify-center gap-1 cursor-pointer"
                              onClick={() => {
                                setSelectedUploadId(item.c_id);

                                setSelectedUploadType("consultancy");

                                setShowUploadModal(true);

                                loadUploadedFiles("consultancy", item.c_id);
                              }}
                            >
                              <Upload size={16} />
                              <span>Upload</span>
                            </div>
                          </td>
                          <td className="border px-3 py-2 text-center">
                            <Pencil
                              size={16}
                              className="cursor-pointer text-yellow-600"
                              onClick={() => handleConsultancyEdit(item)}
                            />
                          </td>

                          <td className="border px-3 py-2 text-center">
                            <Trash2
                              size={16}
                              className="cursor-pointer text-red-600"
                              onClick={() =>
                                setDeleteModal({
                                  open: true,
                                  id: item.c_id,
                                  type: "consultancy",
                                })
                              }
                            />
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={11} className="text-center py-2 border">
                          No Data to Display.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="overflow-x-auto border">
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-[#f3f3f3]">
                    <tr>
                      <th className="border px-3 py-2">Sl No.</th>

                      {[
                        { label: "Name of the Event", key: "event_name" },
                        { label: "Date of Event", key: "date_of_event" },
                        { label: "Place of Event", key: "place_of_event" },
                        { label: "Website Link (If Any)", key: "website" },
                      ].map((col: any) => (
                        <th key={col.key} className="border px-3 py-2 relative">
                          <div className="flex items-center justify-between gap-2">
                            <span>{col.label}</span>

                            <button
                              onClick={() =>
                                setActiveFilter(
                                  activeFilter === col.key ? "" : col.key,
                                )
                              }
                            >
                              <Filter size={14} />
                            </button>
                          </div>

                          {activeFilter === col.key && (
                            <div className="absolute top-full right-0 z-50 bg-white border shadow-lg rounded p-3 mt-1 w-52">
                              <input
                                type="text"
                                placeholder="Filter value"
                                value={columnFilters[col.key] || ""}
                                onChange={(e) =>
                                  setColumnFilters({
                                    ...columnFilters,
                                    [col.key]: e.target.value,
                                  })
                                }
                                className="w-full border px-2 py-1 text-sm mb-2"
                              />

                              <select
                                value={filterType[col.key] || "contains"}
                                onChange={(e) =>
                                  setFilterType({
                                    ...filterType,
                                    [col.key]: e.target.value,
                                  })
                                }
                                className="w-full border px-2 py-1 text-sm"
                              >
                                <option value="contains">Contains</option>
                                <option value="startsWith">Starts With</option>
                                <option value="endsWith">Ends With</option>
                                <option value="notContains">
                                  Does Not Contain
                                </option>
                              </select>
                            </div>
                          )}
                        </th>
                      ))}

                      <th className="border px-3 py-2">Upload</th>
                      <th className="border px-3 py-2">Edit</th>
                      <th className="border px-3 py-2">Delete</th>
                    </tr>
                  </thead>

                  <tbody>
                    {paginatedData.length > 0 ? (
                      paginatedData.map((item: any, index: number) => (
                        <tr key={index}>
                          <td className="border px-3 py-2">
                            {startIndex + index + 1}
                          </td>

                          <td className="border px-3 py-2">
                            {item.event_name}
                          </td>

                          <td className="border px-3 py-2">
                            {item.date_of_event}
                          </td>

                          <td className="border px-3 py-2">
                            {item.place_of_event}
                          </td>

                          <td className="border px-3 py-2">{item.website}</td>

                          <td className="border px-3 py-2 text-center text-[#4f7f82]">
                            <div
                              className="flex items-center justify-center gap-1 cursor-pointer"
                              onClick={() => {
                                setSelectedUploadId(item.fcsip_id);

                                setSelectedUploadType("innovative");

                                setShowUploadModal(true);

                                loadUploadedFiles("innovative", item.fcsip_id);
                              }}
                            >
                              <Upload size={16} />
                              <span>Upload</span>
                            </div>
                          </td>

                          <td className="border px-3 py-2 text-center">
                            <Pencil
                              size={16}
                              className="cursor-pointer text-yellow-600"
                              onClick={() => handleInnovativeEdit(item)}
                            />
                          </td>

                          <td className="border px-3 py-2 text-center">
                            <Trash2
                              size={16}
                              className="cursor-pointer text-red-600"
                              onClick={() =>
                                setDeleteModal({
                                  open: true,
                                  id: item.fcsip_id,
                                  type: "innovative",
                                })
                              }
                            />
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="text-center py-2 border">
                          No Data to Display.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* PAGINATION */}
            <div className="flex justify-between items-center mt-4 text-sm">
              <p>
                Showing {filteredData.length === 0 ? 0 : startIndex + 1} to{" "}
                {Math.min(startIndex + entries, filteredData.length)} of{" "}
                {filteredData.length} entries
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevious}
                  disabled={currentPage === 1}
                  className={`border px-3 py-1 flex items-center gap-1 ${
                    currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <ChevronLeft size={14} />
                  Previous
                </button>

                {Array.from({ length: totalPages || 1 }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`border px-3 py-1 rounded ${
                      currentPage === i + 1
                        ? "bg-[#4f7f82] text-white"
                        : "bg-[#f3f3f3] hover:bg-gray-200"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}

                <button
                  onClick={handleNext}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className={`border px-3 py-1 flex items-center gap-1 ${
                    currentPage === totalPages || totalPages === 0
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                >
                  Next
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* FORM SECTION */}
          <div ref={formRef} className="border-t p-6">
            {activeTab === "consultancy" ? (
              <>
                <h2 className="text-lg font-semibold text-[#4f7f82] mb-5">
                  Add / Edit Consultancy/Testing
                </h2>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* LEFT */}
                  <div className="space-y-5">
                    {/* Project Title */}
                    <div>
                      <label className="text-sm">
                        Project Title :<span className="text-red-500">*</span>
                      </label>

                      <textarea
                        rows={2}
                        value={consultancyForm.projectTitle}
                        onChange={(e) =>
                          setConsultancyForm({
                            ...consultancyForm,
                            projectTitle: e.target.value,
                          })
                        }
                        className="w-full border px-3 py-2 text-sm"
                        placeholder="Enter Project Title"
                      />

                      {errors.projectTitle && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.projectTitle}
                        </p>
                      )}
                    </div>

                    {/* Project Code */}
                    <div>
                      <label className="text-sm">Project Code:</label>

                      <input
                        type="text"
                        value={consultancyForm.projectCode}
                        onChange={(e) =>
                          setConsultancyForm({
                            ...consultancyForm,
                            projectCode: e.target.value,
                          })
                        }
                        className="w-full border px-3 py-2 text-sm"
                        placeholder="Enter Project Code"
                      />
                    </div>

                    {/* Consulting Agency */}
                    <div>
                      <label className="text-sm">Consulting Agency:</label>

                      <textarea
                        rows={2}
                        value={consultancyForm.consultingAgency}
                        onChange={(e) =>
                          setConsultancyForm({
                            ...consultancyForm,
                            consultingAgency: e.target.value,
                          })
                        }
                        className="w-full border px-3 py-2 text-sm"
                        placeholder="Enter Consulting Agency"
                      />
                    </div>

                    {/* Revenue */}
                    <div>
                      <label className="text-sm">Revenue earned(in ₹):</label>

                      <input
                        type="text"
                        value={consultancyForm.revenue}
                        onChange={(e) => {
                          const value = e.target.value;

                          setConsultancyForm({
                            ...consultancyForm,
                            revenue: value,
                          });

                          // validation
                          if (!/^\d*$/.test(value)) {
                            setErrors((prev: any) => ({
                              ...prev,
                              revenue: "Only digits are allowed",
                            }));
                          } else {
                            setErrors((prev: any) => ({
                              ...prev,
                              revenue: "",
                            }));
                          }
                        }}
                        className="w-full border px-3 py-2 text-sm"
                        placeholder="Enter Amount"
                      />

                      {errors.revenue && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.revenue}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* CENTER */}
                  <div className="space-y-5">
                    {/* Commencement */}
                    <div>
                      <label className="text-sm">
                        Commencement Date :
                        <span className="text-red-500">*</span>
                      </label>

                      <input
                        type="date"
                        value={consultancyForm.commencementDate}
                        onChange={(e) =>
                          setConsultancyForm({
                            ...consultancyForm,
                            commencementDate: e.target.value,
                          })
                        }
                        className="w-full border px-3 py-2 text-sm"
                      />

                      {errors.commencementDate && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.commencementDate}
                        </p>
                      )}
                    </div>

                    {/* Completion */}
                    <div>
                      <label className="text-sm">Completion Date:</label>

                      <input
                        type="date"
                        value={consultancyForm.completionDate}
                        onChange={(e) =>
                          setConsultancyForm({
                            ...consultancyForm,
                            completionDate: e.target.value,
                          })
                        }
                        className="w-full border px-3 py-2 text-sm"
                      />
                    </div>

                    {/* Status */}
                    <div>
                      <label className="text-sm">
                        Status :<span className="text-red-500">*</span>
                      </label>

                      <select
                        value={consultancyForm.status}
                        onChange={(e) =>
                          setConsultancyForm({
                            ...consultancyForm,
                            status: e.target.value,
                          })
                        }
                        className="w-full border px-3 py-2 text-sm"
                      >
                        <option value="">Select Status</option>

                        {statusDropdown.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Role */}
                    <div>
                      <label className="text-sm">
                        Your Role :<span className="text-red-500">*</span>
                      </label>

                      <select
                        value={consultancyForm.role}
                        onChange={(e) =>
                          setConsultancyForm({
                            ...consultancyForm,
                            role: e.target.value,
                          })
                        }
                        className="w-full border px-3 py-2 text-sm"
                      >
                        <option value="">Select Role</option>

                        {roleDropdown.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </select>

                      {errors.role && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.role}
                        </p>
                      )}
                    </div>

                    {/* Co consultants */}
                    <div>
                      <label className="text-sm">Co-consultant(s):</label>

                      <textarea
                        rows={2}
                        value={consultancyForm.coconsultants}
                        onChange={(e) =>
                          setConsultancyForm({
                            ...consultancyForm,
                            coconsultants: e.target.value,
                          })
                        }
                        className="w-full border px-3 py-2 text-sm"
                        placeholder="Enter consultant's name"
                      />
                    </div>
                  </div>

                  {/* RIGHT */}
                  <div className="flex flex-col justify-between">
                    <div>
                      <label className="text-sm">Abstract:</label>

                      <Editor
                        apiKey="no-api-key"
                        tinymceScriptSrc="/tinymce/tinymce.min.js"
                        value={consultancyForm.abstract}
                        onEditorChange={(content: string) => {
                          setConsultancyForm({
                            ...consultancyForm,
                            abstract: content,
                          });

                          setErrors({
                            ...errors,
                            abstract: "",
                          });
                        }}
                        init={{
                          height: 300,
                          menubar:
                            "file edit view insert format tools table help",
                          plugins: [
                            "advlist",
                            "autolink",
                            "lists",
                            "link",
                            "image",
                            "charmap",
                            "preview",
                            "anchor",
                            "searchreplace",
                            "visualblocks",
                            "code",
                            "fullscreen",
                            "insertdatetime",
                            "media",
                            "table",
                            "wordcount",
                          ],
                          toolbar:
                            "undo redo | formatselect | bold italic underline | " +
                            "alignleft aligncenter alignright alignjustify | " +
                            "bullist numlist outdent indent | link image table | " +
                            "code fullscreen",
                          branding: false,
                          promotion: false,
                          statusbar: true,
                          resize: true,
                        }}
                      />
                    </div>

                    {/* BUTTONS */}
                    <div className="flex justify-end gap-3 mt-4">
                      <button
                        onClick={handleConsultancySave}
                        className="bg-[#4f7f82] hover:bg-[#4f7f82] text-white px-5 py-2 rounded text-sm"
                      >
                        {editingConsultancyId !== null ? "Update" : "Save"}
                      </button>

                      <button
                        className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2 rounded text-sm"
                        onClick={() => {
                          setConsultancyForm({
                            projectTitle: "",
                            projectCode: "",
                            consultingAgency: "",
                            revenue: "",
                            commencementDate: "",
                            completionDate: "",
                            status: "",
                            role: "",
                            coconsultants: "",
                            abstract: "",
                          });

                          setEditingConsultancyId(null);
                        }}
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-lg font-semibold text-[#4f7f82] mb-5">
                  Add / Edit Innovative Projects
                </h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  {/* LEFT */}
                  <div className="space-y-6">
                    <div>
                      <label className="text-sm">
                        Name of the Event :
                        <span className="text-red-500">*</span>
                      </label>

                      <input
                        type="text"
                        value={innovativeForm.eventName}
                        onChange={(e) =>
                          setInnovativeForm({
                            ...innovativeForm,
                            eventName: e.target.value,
                          })
                        }
                        className="w-full border px-3 py-2 text-sm"
                        placeholder="Enter Event Name"
                      />

                      {errors.eventName && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.eventName}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="text-sm">
                        Place of the Event :
                        <span className="text-red-500">*</span>
                      </label>

                      <input
                        type="text"
                        value={innovativeForm.placeOfEvent}
                        onChange={(e) =>
                          setInnovativeForm({
                            ...innovativeForm,
                            placeOfEvent: e.target.value,
                          })
                        }
                        className="w-full border px-3 py-2 text-sm"
                        placeholder="Enter Place of Event"
                      />

                      {errors.placeOfEvent && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.placeOfEvent}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* RIGHT */}
                  <div className="space-y-6">
                    <div>
                      <label className="text-sm">
                        Date of the Event :
                        <span className="text-red-500">*</span>
                      </label>

                      <input
                        type="date"
                        value={innovativeForm.dateOfEvent}
                        onChange={(e) =>
                          setInnovativeForm({
                            ...innovativeForm,
                            dateOfEvent: e.target.value,
                          })
                        }
                        className="w-full border px-3 py-2 text-sm"
                      />

                      {errors.dateOfEvent && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.dateOfEvent}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="text-sm">Website Link(If Any):</label>

                      <input
                        type="text"
                        value={innovativeForm.websiteLink}
                        onChange={(e) =>
                          setInnovativeForm({
                            ...innovativeForm,
                            websiteLink: e.target.value,
                          })
                        }
                        className="w-full border px-3 py-2 text-sm"
                        placeholder="Enter Website"
                      />

                      {errors.websiteLink && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.websiteLink}
                        </p>
                      )}
                    </div>

                    {/* BUTTONS */}
                    <div className="flex justify-end gap-3 pt-6">
                      <button
                        onClick={handleInnovativeSave}
                        className="bg-[#4f7f82] hover:bg-[#4f7f82] text-white px-5 py-2 rounded text-sm"
                      >
                        {editingInnovativeId !== null ? "Update" : "Save"}
                      </button>

                      <button
                        className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2 rounded text-sm"
                        onClick={() => {
                          setInnovativeForm({
                            eventName: "",
                            placeOfEvent: "",
                            dateOfEvent: "",
                            websiteLink: "",
                          });

                          setEditingInnovativeId(null);
                        }}
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {deleteModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-lg p-6 w-[350px]">
            <h2 className="text-lg font-semibold mb-4">Confirm Delete</h2>

            <p className="text-sm mb-5">
              Are you sure you want to delete this record?
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() =>
                  setDeleteModal({
                    open: false,
                    id: null,
                    type: "",
                  })
                }
                className="px-4 py-2 bg-red-600 border rounded"
              >
                Cancel
              </button>

              <button
                onClick={handleDelete}
                className="bg-[#4f7f82] text-white px-4 py-2 rounded"
              >
                Ok
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ================= UPLOAD MODAL ================= */}

      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="w-[1000px] bg-white rounded shadow-2xl border flex flex-col max-h-[90vh]">
            {/* HEADER */}

            <div className="px-5 py-3 flex justify-between items-center rounded-t">
              <h2 className="text-[18px] text-[#4f7f82] font-semibold">
                Uploaded Files
              </h2>

              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setSelectedUploadId(null);
                  setUploadedFiles([]);
                }}
                className="text-xl text-black"
              >
                ✖
              </button>
            </div>

            {/* BODY */}

            <div className="p-5 overflow-y-auto flex-1">
              <h3 className="font-semibold text-[18px] mb-4">
                {selectedUploadType === "consultancy"
                  ? "Consultancy Projects"
                  : "Innovative Projects"}
              </h3>

              <div className="border rounded overflow-hidden">
                <table className="w-full border-collapse">
                  <thead className="bg-[#f7f7f7]">
                    <tr>
                      <th className="border px-3 py-2">Select</th>

                      <th className="border px-3 py-2">Sl No.</th>

                      <th className="border px-3 py-2">File Name</th>

                      <th className="border px-3 py-2">Description</th>

                      <th className="border px-3 py-2">Date</th>

                      <th className="border px-3 py-2">Delete</th>
                    </tr>
                  </thead>

                  <tbody>
                    {uploadedFiles.length > 0 ? (
                      uploadedFiles.map((file: any, index: number) => (
                        <tr key={file.id}>
                          <td className="border px-3 py-2 text-center">
                            <input type="checkbox" />
                          </td>

                          <td className="border px-3 py-2">{index + 1}</td>

                          <td className="border px-3 py-2">
                            <a
                              href={file.file_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 underline"
                            >
                              {file.file_name}
                            </a>
                          </td>

                          <td className="border px-3 py-2">
                            <textarea
                              className="w-full border rounded px-2 py-1"
                              value={file.description}
                              onChange={(e) => {
                                const updated = [...uploadedFiles];

                                updated[index].description = e.target.value;

                                setUploadedFiles(updated);
                                setEditableFiles(updated);
                              }}
                            />
                          </td>

                          <td className="border px-3 py-2">
                            <input
                              type="date"
                              className="w-full border px-2 py-1 rounded"
                              value={file.actual_date || ""}
                              onChange={(e) => {
                                const updated = [...uploadedFiles];

                                updated[index].actual_date = e.target.value;

                                setUploadedFiles(updated);
                                setEditableFiles(updated);
                              }}
                            />
                          </td>

                          <td className="border px-3 py-2 text-center">
                            <button
                              onClick={() => {
                                setUploadDeleteId(file.id);
                                setShowUploadDeleteModal(true);
                              }}
                              className="text-red-600"
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="text-center py-2 border">
                          No Data to Display
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* NOTE */}

              <div className="mt-6">
                <p className="text-[16px]">
                  <span className="font-semibold">Upload Note :</span>{" "}
                  Sanctioning Letter
                </p>
              </div>

              <div className="mt-6 border rounded bg-[#fafafa] px-4 py-4">
                <p>
                  <b>Note :</b> Files allowed are .doc, .docx, .xls, .xlsx,
                  .jpg, .png, .txt, .ppt, .pptx, .pdf, .odt, .rtf.
                </p>

                <p className="ml-12">Maximum file size allowed is 10MB.</p>
              </div>
            </div>

            {/* FOOTER */}

            <div className="bg-[#f5f5f5] border-t px-5 py-4 flex justify-end gap-3">
              <label className="bg-[#4f7f82] text-white px-5 py-2 rounded cursor-pointer">
                {uploadedFiles.length > 0 ? "Upload more" : "Upload"}

                <input
                  type="file"
                  hidden
                  onChange={async (e) => {
                    const file = e.target.files?.[0];

                    if (!file || !selectedUploadId) return;

                    const today = new Date().toISOString().split("T")[0];

                    const formData = new FormData();

                    formData.append("file", file);

                    formData.append("table_ref_id", String(selectedUploadId));

                    formData.append("tab_ref_id", selectedUploadType);

                    formData.append(
                      "table_name",
                      selectedUploadType === "consultancy"
                        ? "cudos_consultancy_projects"
                        : "cudos_fc_stud_innovative_projects",
                    );

                    formData.append("user_id", "1");

                    formData.append("actual_date", today);

                    const response = await fetch(
                      "http://localhost:8000/consultancy-testing-projects/upload",
                      {
                        method: "POST",
                        body: formData,
                      },
                    );

                    const data = await response.json();

                    if (data.status) {
                      toast.success("Uploaded Successfully");

                      loadUploadedFiles(selectedUploadType, selectedUploadId);
                    } else {
                      toast.error(data.message);
                    }
                  }}
                />
              </label>

              {/* SAVE */}

              <label
                onClick={async () => {
                  try {
                    for (const file of editableFiles) {
                      const formData = new FormData();

                      formData.append("description", file.description || "");

                      formData.append("actual_date", file.actual_date || "");

                      await fetch(
                        `http://localhost:8000/consultancy-testing-projects/upload/update/${file.id}`,
                        {
                          method: "PUT",
                          body: formData,
                        },
                      );
                    }

                    toast.success("Updated Successfully");

                    if (selectedUploadId) {
                      loadUploadedFiles(selectedUploadType, selectedUploadId);
                    }
                  } catch (error) {
                    toast.error("Failed to update");
                  }
                }}
                className="bg-[#4f7f82] text-white px-5 py-2 rounded"
              >
                Save
              </label>

              {/* CLOSE */}

              <label
                className="bg-red-600 text-white px-5 py-2 rounded"
                onClick={() => {
                  setShowUploadModal(false);
                  setSelectedUploadId(null);
                  setUploadedFiles([]);
                }}
              >
                Close
              </label>
            </div>
          </div>
        </div>
      )}
      {showUploadDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded shadow-xl w-[350px] p-6">
            <h2 className="text-lg font-semibold mb-4">Confirm Delete</h2>

            <p className="text-sm mb-6">
              Are you sure you want to delete this uploaded file?
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowUploadDeleteModal(false);
                  setUploadDeleteId(null);
                }}
                className="border px-4 py-2 bg-red-600 rounded"
              >
                Cancel
              </button>

              <button
                onClick={async () => {
                  try {
                    const response = await fetch(
                      `http://localhost:8000/consultancy-testing-projects/upload/${uploadDeleteId}`,
                      {
                        method: "DELETE",
                      },
                    );

                    const data = await response.json();

                    if (data.status) {
                      toast.success("File Deleted Successfully");

                      setShowUploadDeleteModal(false);
                      setUploadDeleteId(null);

                      if (selectedUploadId) {
                        loadUploadedFiles(selectedUploadType, selectedUploadId);
                      }
                    } else {
                      toast.error(data.message || "Delete failed");
                    }
                  } catch (error) {
                    toast.error("Failed to delete file");
                  }
                }}
                className="bg-[#4f7f82] text-white px-4 py-2 rounded"
              >
                Ok
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsultancyTestingProjectsPage;

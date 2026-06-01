import React, { useState, useEffect, useMemo } from "react";
import { FaSave, FaUndo, FaTrash, FaUserPlus, FaUsers } from "react-icons/fa";
import { toast } from "react-toastify";
import {
  fetchSchools,
  fetchUsersBySchool,
  SchoolOption,
  UserOption,
} from "./curriculumSettingsApi";
import CourseSpecializationPage from "./courseSpecialization/CourseSpecialization";
import CurriculumDeliveryMethod from "./curriculumDeliveryMethod/CurriculumDeliveryMethod";
import DataTable from "../../../../components/Table/DataTable";
import UIButton from "../../../../components/FormBuilder/fields/Button";
import Select from "../../../../components/FormBuilder/fields/Select";
import TextInput from "../../../../components/FormBuilder/fields/TextInput";
import Checkbox from "../../../../components/FormBuilder/fields/Checkbox";
// ==================== INTERFACES ====================

interface ImportedUser {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  fromDept: string;
  fromDeptId: number;
  designation_id: number;
  designation_name: string;
  email: string;
  assignedRole: string;
}

// ==================== MAIN COMPONENT ====================

const CurriculumSettingsPage: React.FC = () => {
  // ==================== STATE ====================

  const [activeTab, setActiveTab] = useState<string>("importUser");

  // Section 1 — Imported User List
  const [selectedSchoolFilter, setSelectedSchoolFilter] = useState<string>("");
  const [importedUsers, setImportedUsers] = useState<ImportedUser[]>([]);
  const [entriesPerPage, setEntriesPerPage] = useState<number>(20);

  // Section 2 — Add User Form
  const [selectedSchool, setSelectedSchool] = useState<string>("");
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [sendEmail, setSendEmail] = useState<boolean>(true);
  const [formErrors, setFormErrors] = useState<{ school?: string; user?: string; duplicate?: string }>({});
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  // API data
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loadingSchools, setLoadingSchools] = useState<boolean>(false);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);

  // ==================== EFFECTS ====================

  useEffect(() => {
    setLoadingSchools(true);
    fetchSchools()
      .then(setSchools)
      .catch((err) => console.error("Failed to fetch schools", err))
      .finally(() => setLoadingSchools(false));
  }, []);

  // ==================== COMPUTED VALUES ====================

  const displayedUsers = importedUsers.filter((user) => {
    return !selectedSchoolFilter || user.fromDeptId === Number(selectedSchoolFilter);
  });

  // ==================== HANDLERS ====================

  const handleSchoolFilterChange = (deptId: string | number) => {
    setSelectedSchoolFilter(String(deptId));
  };

  const handleSchoolChange = async (deptId: string | number) => {
    const val = String(deptId);
    setSelectedSchool(val);
    setSelectedUser("");
    setUserEmail("");
    setUsers([]);

    if (!val) return;

    setLoadingUsers(true);
    try {
      const data = await fetchUsersBySchool(Number(val));
      setUsers(data);
    } catch (err) {
      console.error("Failed to fetch users", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleUserChange = (userId: string | number) => {
    const val = String(userId);
    setSelectedUser(val);
    const user = users.find((u) => u.value === Number(val));
    setUserEmail(user?.email || "");
  };

  const handleSave = () => {
    const errors: { school?: string; user?: string; duplicate?: string } = {};
    if (!selectedSchool) errors.school = "Please select a School.";
    if (!selectedUser) errors.user = "Please select a User.";
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const school = schools.find((s) => s.value === Number(selectedSchool));
    const user = users.find((u) => u.value === Number(selectedUser));

    if (!school || !user) {
      setFormErrors({ school: "Invalid selection. Please try again." });
      return;
    }

    // Prevent duplicates
    const alreadyAdded = importedUsers.some((u) => u.userId === user.value);
    if (alreadyAdded) {
      setFormErrors({ duplicate: "This user has already been added to the list." });
      return;
    }

    setFormErrors({});

    // Split full name into first / last
    const parts = user.label.trim().split(" ");
    const firstName = parts[0] || user.label;
    const lastName = parts.slice(1).join(" ");

    const newUser: ImportedUser = {
      id: Date.now(),
      userId: user.value,
      firstName,
      lastName,
      fromDept: school.label,
      fromDeptId: school.value,
      designation_id: user.designation_id,
      designation_name: user.designation_name,
      email: user.email,
      assignedRole: "Course Owner",
    };

    setImportedUsers((prev) => [...prev, newUser]);

    // Reset Section 1 filter to "All" so the new row is always visible
    setSelectedSchoolFilter("");

    toast.success(`${user.label} has been added as Course Owner successfully!`);

    // Log payload for future backend integration
    console.log("=== SAVE PAYLOAD ===", {
      dept_id: Number(selectedSchool),
      user_id: Number(selectedUser),
      send_email: sendEmail,
    });

    handleReset();
  };

  const handleReset = () => {
    setSelectedSchool("");
    setSelectedUser("");
    setUserEmail("");
    setSendEmail(true);
    setFormErrors({});
    // NOTE: users (dropdown options) is intentionally NOT cleared here
    // so the user can quickly add another person from the same department.
  };

  const handleRemove = (id: number) => {
    setConfirmDeleteId(id);
  };

  const handleConfirmDelete = () => {
    if (confirmDeleteId !== null) {
      setImportedUsers((prev) => prev.filter((u) => u.id !== confirmDeleteId));
      setConfirmDeleteId(null);
      toast.success("User removed from Course Owner list.");
    }
  };

  const handleCancelDelete = () => {
    setConfirmDeleteId(null);
  };

  const columnDefs = useMemo(() => [
    {
      headerName: "Sl No.",
      valueGetter: "node.rowIndex + 1",
      width: 80,
    },
    {
      headerName: "First Name",
      field: "firstName",
      sortable: true,
      filter: true,
      flex: 1,
    },
    {
      headerName: "Last Name",
      field: "lastName",
      sortable: true,
      filter: true,
      flex: 1,
    },
    {
      headerName: "From Department",
      field: "fromDept",
      sortable: true,
      filter: true,
      flex: 1.5,
    },
    {
      headerName: "Designation",
      field: "designation_name",
      sortable: true,
      filter: true,
      flex: 1,
    },
    {
      headerName: "Email",
      field: "email",
      sortable: true,
      filter: true,
      flex: 1.5,
    },
    {
      headerName: "Assigned Role",
      field: "assignedRole",
      sortable: true,
      filter: true,
      flex: 1,
    },
    {
      headerName: "Action",
      field: "action",
      cellRenderer: (params: any) => (
        <div className="flex justify-center items-center h-full">
          <button
            onClick={() => handleRemove(params.data.id)}
            className="text-red-500 hover:text-red-700 p-1"
            title="Remove user"
          >
            <FaTrash size={14} />
          </button>
        </div>
      ),
      width: 90,
      filter: false,
    }
  ], []);

  // ==================== RENDER ====================

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-full mx-auto bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* ==================== HEADER ==================== */}
        <div className="flex justify-between items-center px-8 py-5 border-b border-gray-100 bg-white">
          <div>
            <h3 className="text-xl font-bold text-[#4c8491]">
              Curriculum Settings
            </h3>
          </div>
        </div>

        {/* ==================== TAB NAVIGATION ==================== */}
        <div className="px-8 mt-4">
          <div className="flex gap-1 border-b border-gray-200">
            {[
              { key: "importUser", label: "Import User" },
              { key: "deliveryMethod", label: "Curriculum Delivery Method" },
              { key: "specialization", label: "Course Specialization" },
              { key: "assessment", label: "Assessment Method" },
              { key: "importStudent", label: "Import Student List" },
            ].map((tab) => (
              <button
                key={tab.key}
                className={`px-5 py-3 text-sm font-bold border-b-2 transition-all duration-200 ${
                  activeTab === tab.key
                    ? "border-[#4c8491] text-[#4c8491] bg-blue-50/30"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ==================== CONTENT ==================== */}
        <div className="p-8">
          {activeTab === "importUser" && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* ========== SECTION 1: IMPORTED USER LIST ========== */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Section Title Header */}
                <div className="px-6 py-4 border-b border-gray-100 bg-[#f8fafc] flex items-center gap-2">
                  <FaUsers className="text-[#4c8491]" />
                  <h4 className="text-sm font-bold text-gray-800">
                    Imported User List ( Course Owner )
                  </h4>
                </div>

                {/* Filter Toolbar */}
                <div className="px-6 py-3 border-b border-gray-100 bg-white flex items-center justify-between gap-4">
                  {/* Department Dropdown */}
                  <div className="relative w-72">
                    <select
                      value={selectedSchoolFilter}
                      onChange={(e) => handleSchoolFilterChange(e.target.value)}
                      disabled={loadingSchools}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none bg-white shadow-sm text-gray-700"
                    >
                      <option value="">Show All Departments</option>
                      {schools.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  </div>

                <div className="p-0">
                  <DataTable
                    columnDefs={columnDefs}
                    rowData={displayedUsers}
                    showAddButton={false}
                    showExportButton={false}
                    headerFilter={false}
                    pageSize={entriesPerPage}
                  />
                  
                  <div className="p-6 border-t border-gray-100 text-xs text-gray-500 italic">
                    <strong>Note:</strong> Multi-department users can be included here as Course Owners.
                  </div>
                </div>
              </div>

              {/* ========== SECTION 2: ADD USER FORM ========== */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-[#f8fafc] flex items-center gap-2">
                  <FaUserPlus className="text-[#4c8491]" />
                  <h4 className="text-sm font-bold text-gray-800">
                    Add User as Course Owner from other Department
                  </h4>
                </div>

                {/* Form Body */}
                <div className="px-6 py-5">
                  {formErrors.duplicate && (
                    <div className="mb-4 px-4 py-3 bg-yellow-50 border border-yellow-300 text-yellow-800 rounded-lg text-sm font-medium flex items-center gap-2">
                      ⚠️ {formErrors.duplicate}
                    </div>
                  )}

                  {/* Single-row inline form */}
                  <div className="flex flex-wrap items-start gap-8">
                    {/* From School */}
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                          From School: <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={selectedSchool}
                          onChange={(e) => { handleSchoolChange(e.target.value); setFormErrors(prev => ({ ...prev, school: undefined, duplicate: undefined })); }}
                          disabled={loadingSchools}
                          className={`px-3 py-1.5 border rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white w-52 ${
                            formErrors.school ? 'border-red-400' : 'border-gray-300'
                          }`}
                        >
                          <option value="">{loadingSchools ? "Loading..." : "Select School"}</option>
                          {schools.map((s) => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                      </div>
                      {formErrors.school && (
                        <p className="text-[11px] text-red-500 font-medium ml-28">{formErrors.school}</p>
                      )}
                    </div>

                    {/* User */}
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                          User: <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={selectedUser}
                          onChange={(e) => { handleUserChange(e.target.value); setFormErrors(prev => ({ ...prev, user: undefined, duplicate: undefined })); }}
                          disabled={!selectedSchool || loadingUsers}
                          className={`px-3 py-1.5 border rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white w-52 disabled:bg-gray-50 disabled:text-gray-400 ${
                            formErrors.user ? 'border-red-400' : 'border-gray-300'
                          }`}
                        >
                          <option value="">
                            {loadingUsers ? "Loading..." : !selectedSchool ? "Select School first" : "Select User"}
                          </option>
                          {users.map((u) => (
                            <option key={u.value} value={u.value}>{u.label}</option>
                          ))}
                        </select>
                      </div>
                      {formErrors.user && (
                        <p className="text-[11px] text-red-500 font-medium ml-12">{formErrors.user}</p>
                      )}
                      {userEmail && (
                        <p className="text-[11px] font-bold text-red-500 ml-12">Email-Id: {userEmail}</p>
                      )}
                    </div>

                    {/* Send Email Checkbox */}
                    <div className="flex items-center gap-2 pt-1">
                      <label className="text-sm font-semibold text-gray-700 whitespace-nowrap flex items-center gap-2 cursor-pointer">
                        Send the email to Chairman(HoD):
                        <input
                          type="checkbox"
                          checked={sendEmail}
                          onChange={(e) => setSendEmail(e.target.checked)}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Action Buttons - Bottom Right */}
                  <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                    <button
                      onClick={handleSave}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-bold flex items-center gap-2 shadow-sm transition-all"
                    >
                      <FaSave size={14} /> Save
                    </button>
                    <button
                      onClick={handleReset}
                      className="px-5 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-md text-sm font-bold flex items-center gap-2 shadow-sm transition-all"
                    >
                      <FaUndo size={13} /> Reset
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================== OTHER TABS ==================== */}
          {activeTab === "deliveryMethod" && (
            <div className="animate-in fade-in duration-300">
              <CurriculumDeliveryMethod />
            </div>
          )}
          {activeTab === "specialization" && (
            <div className="animate-in fade-in duration-300">
              <CourseSpecializationPage />
            </div>
          )}
          {activeTab === "assessment" && (
            <div className="py-20 text-center text-gray-400 italic">
              <p className="text-lg">Assessment Method configuration is coming soon.</p>
            </div>
          )}
          {activeTab === "importStudent" && (
            <div className="py-20 text-center text-gray-400 italic">
              <p className="text-lg">Student Import functionality is coming soon.</p>
            </div>
          )}
        </div>
      </div>

      {/* ==================== CONFIRM DELETE MODAL ==================== */}
      {confirmDeleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={handleCancelDelete}
          />
          {/* Dialog Box */}
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 pt-6 pb-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <FaTrash className="text-red-500" size={16} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Remove User</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Are you sure you want to remove this user from the Course Owner list?
                  </p>
                </div>
              </div>
            </div>
            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg shadow-sm transition-all"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CurriculumSettingsPage;

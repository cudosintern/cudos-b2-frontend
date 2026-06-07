import React, { useEffect, useState, useMemo } from "react";
import { toast } from "react-toastify";
import { FileText, FileSpreadsheet } from "lucide-react";
import {
  getDepartments,
  getUsers,
  getFacultyProfile,
} from "./facultyReportsProfileApi";

const FacultyReportsProfilePage = () => {
  const [facultyData, setFacultyData] = useState<any>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(false);
  const handleExportPDF = async () => {
    if (!selectedDept || !selectedUser) {
      alert("Please select Department and User");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8000/faculty-reports-profile/export/pdf?dept_id=${selectedDept}&user_id=${selectedUser}`,
        {
          method: "GET",
        },
      );

      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);

      window.open(url, "_blank");
    } catch (error) {
      console.error(error);
    }
  };

  const handleExportExcel = async () => {
    try {
      if (!selectedDept || !selectedUser) {
        toast.error("Please select Department and User");
        return;
      }

      const response = await fetch(
        `http://localhost:8000/faculty-reports-profile/export/excel?dept_id=${selectedDept}&user_id=${selectedUser}`,
        {
          method: "GET",
          headers: {
            Accept:
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          },
        },
      );

      if (!response.ok) {
        const errorText = await response.text();

        console.log("Excel API Error:", errorText);

        throw new Error("Failed to download excel");
      }

      const blob = await response.blob();

      // ===== GET FILENAME FROM BACKEND =====
      let fileName = "Profile.xlsx";

      const disposition = response.headers.get("content-disposition");

      if (disposition) {
        // UTF-8 filename support (BEST)
        const utf8Match = disposition.match(/filename\*=UTF-8''(.+)/);

        if (utf8Match?.[1]) {
          fileName = decodeURIComponent(utf8Match[1]);
        } else {
          // fallback normal filename
          const normalMatch = disposition.match(/filename="?([^"]+)"?/);

          if (normalMatch?.[1]) {
            fileName = normalMatch[1];
          }
        }
      }

      // ===== CREATE DOWNLOAD =====
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;

      link.download = fileName;

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

      window.URL.revokeObjectURL(url);

      toast.success("Excel downloaded successfully");
    } catch (error) {
      console.log(error);

      toast.error("Excel download failed");
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      const response = await getDepartments();
      setDepartments(response.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDepartmentChange = async (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const deptId = e.target.value;

    setSelectedDept(deptId);
    setSelectedUser("");
    setFacultyData(null);

    try {
      const response = await getUsers(Number(deptId));
      setUsers(response.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const handleUserChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const userId = e.target.value;

    setSelectedUser(userId);

    if (!selectedDept || !userId) return;

    try {
      setLoadingProfile(true);

      const response = await getFacultyProfile(
        Number(selectedDept),
        Number(userId),
      );

      setFacultyData(response.data || null);
    } catch (error) {
      console.error(error);
      setFacultyData(null);
    } finally {
      setLoadingProfile(false);
    }
  };
  const thClass = "border px-2 py-1 text-left bg-[#f1f1f1] font-semibold";

  const tdClass = "border px-2 py-1";
  const [showRecordsModal, setShowRecordsModal] = useState(false);

  const [recordTitle, setRecordTitle] = useState("");

  const [recordFiles, setRecordFiles] = useState<any[]>([]);

  const [loadingRecords, setLoadingRecords] = useState(false);

  const handleViewRecords = async (
    tableName: string,
    tableRefId: number,
    title: string,
  ) => {
    try {
      setLoadingRecords(true);

      setRecordTitle(title);

      setShowRecordsModal(true);

      const response = await fetch(
        `http://localhost:8000/faculty-reports-profile/uploaded-files?table_name=${tableName}&table_ref_id=${tableRefId}&user_id=${selectedUser}`,
      );

      const data = await response.json();

      setRecordFiles(data.data || []);
    } catch (error) {
      console.error(error);

      setRecordFiles([]);
    } finally {
      setLoadingRecords(false);
    }
  };

  const groupedBooks = useMemo(() => {
    return (facultyData?.books ?? []).reduce((acc: any, item: any) => {
      const key = item.bookType || "--";

      if (!acc[key]) acc[key] = [];
      acc[key].push(item);

      return acc;
    }, {});
  }, [facultyData]);

  const groupedPublications = useMemo(() => {
    return (facultyData?.publications ?? []).reduce((acc: any, item: any) => {
      const key = item.publicationLevelName || "--";

      if (!acc[key]) acc[key] = [];
      acc[key].push(item);

      return acc;
    }, {});
  }, [facultyData]);

  const groupedOrganizedWorkshops = useMemo(() => {
    return (facultyData?.organizedWorkshops ?? []).reduce(
      (acc: any, item: any) => {
        const key = item.typeName || "--";

        if (!acc[key]) acc[key] = [];
        acc[key].push(item);

        return acc;
      },
      {} as any,
    );
  }, [facultyData]);

  const groupedAttendedWorkshops = useMemo(() => {
    return (facultyData?.attendedWorkshops ?? []).reduce(
      (acc: any, item: any) => {
        const key = item.typeName || "--";

        if (!acc[key]) acc[key] = [];
        acc[key].push(item);

        return acc;
      },
      {} as any,
    );
  }, [facultyData]);

  return (
    <div className="min-h-screen bg-[#efefef] p-2">
      <div className="border bg-white shadow">
        {/* Header */}
        <div className="text-[#4f7f82] px-4 py-2 font-bold text-lg rounded-t">
          Faculty Profile
        </div>

        {/* Filters */}
        <div className="flex justify-between items-center px-4 py-3 border-b">
          <div className="flex gap-8">
            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold">Department :</label>

              <select
                className="border rounded px-2 py-1 text-sm"
                value={selectedDept}
                onChange={handleDepartmentChange}
              >
                <option value="">Select Department</option>

                {departments.map((dept: any) => (
                  <option key={dept.dept_id} value={dept.dept_id}>
                    {dept.dept_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold">User :</label>

              <select
                className="border rounded px-2 py-1 text-sm"
                value={selectedUser}
                onChange={handleUserChange}
              >
                <option value="">Select User</option>

                {users.map((user: any) => (
                  <option key={user.id} value={user.id}>
                    {user.user_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Export Button */}
          {selectedDept && selectedUser && (
            <div className="relative group">
              <button className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-1 rounded">
                Export
              </button>

              <div
                className="
        absolute right-0
        top-full mt-1 w-20
        bg-white border border-gray-200
        shadow-lg rounded-md z-50
        opacity-0 invisible
        group-hover:opacity-100
        group-hover:visible
        transition-all duration-200
      "
              >
                {/* PDF */}
                <button
                  onClick={handleExportPDF}
                  className="
          w-full flex items-center gap-2
          px-4 py-2 text-sm
          hover:bg-gray-100 rounded-t-md
        "
                >
                  <FileText size={16} className="text-red-600" />
                  .pdf
                </button>

                {/* EXCEL */}
                <button
                  onClick={handleExportExcel}
                  className="
          w-full flex items-center gap-2
          px-4 py-2 text-sm
          hover:bg-gray-100 rounded-b-md
        "
                >
                  <FileSpreadsheet size={16} className="text-green-600" />
                  .xlsx
                </button>
              </div>
            </div>
          )}
        </div>

        {!facultyData && <div className="p-1 text-center text-gray-500"></div>}

        {facultyData && (
          <>
            {/* Main Details */}
            <div className="p-4 border-b">
              <div className="grid grid-cols-12 gap-6">
                {/* Image */}
                <div className="col-span-2">
                  <div className="w-36 h-36 bg-gray-300 overflow-hidden border">
                    <img
                      src={
                        facultyData?.userPic
                          ? `http://localhost:8000/uploads/profile/${facultyData.userPic}`
                          : "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                      }
                      alt="faculty"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Personal Details */}
                <div className="col-span-5">
                  <table className="text-sm border-collapse">
                    <tbody>
                      <tr>
                        <td className="font-bold py-1 pr-3 whitespace-nowrap">
                          Name :
                        </td>
                        <td>{facultyData?.name}</td>
                      </tr>

                      <tr>
                        <td className="font-bold py-1 pr-3 whitespace-nowrap">
                          Contact :
                        </td>
                        <td>{facultyData?.contact}</td>
                      </tr>

                      <tr>
                        <td className="font-bold py-1 pr-3 whitespace-nowrap">
                          Email :
                        </td>
                        <td>{facultyData?.email}</td>
                      </tr>

                      <tr>
                        <td className="font-bold py-1 pr-3 whitespace-nowrap">
                          Website :
                        </td>
                        <td>{facultyData?.website}</td>
                      </tr>

                      <tr>
                        <td className="font-bold py-1 pr-3 whitespace-nowrap">
                          Date of Birth :
                        </td>
                        <td>{facultyData?.dob}</td>
                      </tr>

                      <tr>
                        <td className="font-bold py-1 pr-3 whitespace-nowrap">
                          Blood Group :
                        </td>
                        <td>{facultyData?.bloodGroup}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Address */}
                <div className="col-span-5">
                  <table className="text-sm border-collapse">
                    <tbody>
                      <tr>
                        <td className="font-bold py-1 pr-3 whitespace-nowrap">
                          Aadhaar No :
                        </td>
                        <td>{facultyData?.aadhaar}</td>
                      </tr>

                      <tr>
                        <td className="font-bold py-1 pr-3 whitespace-nowrap align-top">
                          Present Address :
                        </td>
                        <td>{facultyData?.address}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Professional Details */}
            <div className="p-4 border-b">
              <h2 className="text-[#4f7f82] font-bold mb-3">
                Professional Details:
              </h2>

              <div className="flex gap-28 text-sm w-full">
                {/* Table 1 */}
                <table className="border-collapse">
                  <tbody>
                    <tr>
                      <td className="font-bold py-1 pr-3 whitespace-nowrap">
                        Employee No :
                      </td>
                      <td>{facultyData?.employeeNo}</td>
                    </tr>

                    <tr>
                      <td className="font-bold py-1 pr-3 whitespace-nowrap">
                        Date of Joining :
                      </td>
                      <td>{facultyData?.joiningDate}</td>
                    </tr>

                    <tr>
                      <td className="font-bold py-1 pr-3 whitespace-nowrap">
                        Teaching Experience :
                      </td>
                      <td>{facultyData?.teachingExperience}</td>
                    </tr>

                    <tr>
                      <td className="font-bold py-1 pr-3 whitespace-nowrap">
                        Faculty Serving :
                      </td>
                      <td>{facultyData?.facultyServing}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Table 2 */}
                <table className="border-collapse">
                  <tbody>
                    <tr>
                      <td className="font-bold py-1 pr-3 whitespace-nowrap">
                        Faculty Type :
                      </td>
                      <td>{facultyData?.facultyType}</td>
                    </tr>

                    <tr>
                      <td className="font-bold py-1 pr-3 whitespace-nowrap">
                        Relieving Date :
                      </td>
                      <td>{facultyData?.relievingDate}</td>
                    </tr>

                    <tr>
                      <td className="font-bold py-1 pr-3 whitespace-nowrap">
                        Industrial Experience :
                      </td>
                      <td>{facultyData?.industrialExperience}</td>
                    </tr>

                    <tr>
                      <td className="font-bold py-1 pr-3 whitespace-nowrap">
                        Last Promotion :
                      </td>
                      <td>{facultyData?.lastPromotion}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Table 3 */}
                <table className="border-collapse">
                  <tbody>
                    <tr>
                      <td className="font-bold py-1 pr-3 whitespace-nowrap">
                        Current Designation :
                      </td>
                      <td>{facultyData?.designation}</td>
                    </tr>

                    <tr>
                      <td className="font-bold py-1 pr-3 whitespace-nowrap">
                        Retirement Date :
                      </td>
                      <td>{facultyData?.retirementDate}</td>
                    </tr>

                    <tr>
                      <td className="font-bold py-1 pr-3 whitespace-nowrap">
                        Total Experience :
                      </td>
                      <td>{facultyData?.totalExperience}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Qualification Details */}
            <div className="p-4 border-b">
              <h2 className="text-[#4f7f82] font-bold mb-3">
                Qualification Details:
              </h2>

              <div className="flex gap-32 text-sm">
                {/* Left Table */}
                <table className="border-collapse">
                  <tbody>
                    <tr>
                      <td className="font-bold py-1 pr-3 whitespace-nowrap">
                        Highest Qualification :
                      </td>
                      <td>{facultyData?.highestQualification}</td>
                    </tr>

                    <tr>
                      <td className="font-bold py-1 pr-3 whitespace-nowrap">
                        Research Interest :
                      </td>
                      <td>{facultyData?.researchInterest}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Right Table */}
                <table className="border-collapse">
                  <tbody>
                    <tr>
                      <td className="font-bold py-1 pr-3 whitespace-nowrap">
                        Specialization :
                      </td>
                      <td>{facultyData?.specialization}</td>
                    </tr>

                    <tr>
                      <td className="font-bold py-1 pr-3 whitespace-nowrap">
                        Skills :
                      </td>
                      <td>{facultyData?.skills}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* PhD Details */}
            <div className="p-4">
              <h2 className="text-[#4f7f82] font-bold mb-3">Ph.D Details:</h2>

              <div className="flex gap-28 text-sm">
                {/* Left Table */}
                <table className="border-collapse">
                  <tbody>
                    <tr>
                      <td className="font-bold py-1 pr-3 whitespace-nowrap">
                        Name of University :
                      </td>
                      <td>{facultyData?.universityName}</td>
                    </tr>

                    <tr>
                      <td className="font-bold py-1 pr-3 whitespace-nowrap">
                        Supervisor(s) :
                      </td>
                      <td>{facultyData?.supervisor}</td>
                    </tr>

                    <tr>
                      <td className="font-bold py-1 pr-3 whitespace-nowrap">
                        Ph.D during assessment year :
                      </td>
                      <td>{facultyData?.assessmentYear}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Right Table */}
                <table className="border-collapse">
                  <tbody>
                    <tr>
                      <td className="font-bold py-1 pr-3 whitespace-nowrap">
                        Year of Registration :
                      </td>
                      <td>{facultyData?.registrationYear}</td>
                    </tr>

                    <tr>
                      <td className="font-bold py-1 pr-3 whitespace-nowrap">
                        Topic on Ph.D :
                      </td>
                      <td>{facultyData?.phdTopic}</td>
                    </tr>

                    <tr>
                      <td className="font-bold py-1 pr-3 whitespace-nowrap">
                        Ph.D Status :
                      </td>
                      <td>{facultyData?.phdStatus}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Guidance */}
              <div className="mt-6">
                <h3 className="text-red-700 font-bold mb-2 text-sm">
                  Ph.D Guidance Detail(s):
                </h3>

                <div className="flex gap-28 text-sm">
                  {/* Left */}
                  <table className="border-collapse">
                    <tbody>
                      <tr>
                        <td className="font-bold py-1 pr-3 whitespace-nowrap">
                          Candidate(s) within organization :
                        </td>
                        <td>{facultyData?.candidatesWithin}</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Right */}
                  <table className="border-collapse">
                    <tbody>
                      <tr>
                        <td className="font-bold py-1 pr-3 whitespace-nowrap">
                          Candidate(s) outside organization :
                        </td>
                        <td>{facultyData?.candidatesOutside}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
        {/* =========================================================
    FACULTY WORKLOAD
========================================================= */}
        {facultyData?.workload && facultyData.workload.length > 0 && (
          <div className="px-4 pb-2">
            <h2 className="text-[#4f7f82] font-bold text-sm mb-2">
              Faculty Workload:
            </h2>

            <div className="overflow-x-auto border border-gray-300">
              <table className="w-full border-collapse text-[12px]">
                <thead className="bg-[#f1f1f1]">
                  <tr>
                    <th className="border px-2 py-1 text-left w-[60px]">
                      Sl No.
                    </th>

                    <th className="border px-2 py-1 text-left">Department</th>

                    <th className="border px-2 py-1 text-left">Program Type</th>

                    <th className="border px-2 py-1 text-left">Program</th>

                    <th className="border px-2 py-1 text-left">
                      Program Category
                    </th>

                    <th className="border px-2 py-1 text-left">
                      Workload Distribution (Semester-wise)
                    </th>

                    <th className="border px-2 py-1 text-left">
                      Academic Year
                    </th>

                    <th className="border px-2 py-1 text-left">Workload(%)</th>
                  </tr>
                </thead>

                <tbody>
                  {facultyData.workload.map((item: any, index: number) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border px-2 py-1">{index + 1}</td>

                      <td className="border px-2 py-1">
                        {item.department || "--"}
                      </td>

                      <td className="border px-2 py-1">
                        {item.programType || "--"}
                      </td>

                      <td className="border px-2 py-1">
                        {item.program || "--"}
                      </td>

                      <td className="border px-2 py-1">
                        {item.programCategory || "--"}
                      </td>

                      <td className="border px-2 py-1">
                        {item.semester || "--"}
                      </td>

                      <td className="border px-2 py-1">
                        {item.academicYear || "--"}
                      </td>

                      <td className="border px-2 py-1">
                        {item.workloadPercent || "--"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =========================================================
    RESEARCH PUBLICATION
========================================================= */}
        {facultyData?.publications && facultyData.publications.length > 0 && (
          <div className="px-4 pb-2">
            <h2 className="text-[#4f7f82] font-bold text-sm mb-2">
              Research Publication:
            </h2>

            <div className="overflow-x-auto border border-gray-300">
              <table className="w-full border-collapse text-[12px]">
                <thead className="bg-[#f1f1f1]">
                  <tr>
                    <th className="border px-2 py-1 text-left">Paper Title</th>

                    <th className="border px-2 py-1 text-left">
                      Publication / Journal Title
                    </th>

                    <th className="border px-2 py-1 text-left">
                      Publication Level
                    </th>

                    <th className="border px-2 py-1 text-left">Author(s)</th>

                    <th className="border px-2 py-1 text-left">Page No.</th>

                    <th className="border px-2 py-1 text-left">
                      Publication Year
                    </th>

                    <th className="border px-2 py-1 text-left">Publisher</th>

                    <th className="border px-2 py-1 text-left">Volume No.</th>

                    <th className="border px-2 py-1 text-left">ISSN / ISBN</th>

                    <th className="border px-2 py-1 text-left">
                      Scopus / SCI / Peer Reviewed
                    </th>

                    <th className="border px-2 py-1 text-left">DOI</th>

                    <th className="border px-2 py-1 text-left">
                      Impact Factor
                    </th>
                    <th className="border px-2 py-1 text-left">View</th>
                  </tr>
                </thead>

                <tbody>
                  {Object.entries(groupedPublications).map(
                    ([level, items]: any) => (
                      <React.Fragment key={level}>
                        {/* LEVEL HEADER ROW (same style as bookType) */}
                        <tr className="bg-gray-200 font-semibold">
                          <td
                            colSpan={14}
                            className="border px-3 py-2 text-left"
                          >
                            {level}
                          </td>
                        </tr>

                        {/* ROWS UNDER EACH LEVEL */}
                        {items.map((item: any, index: number) => (
                          <tr key={index}>
                            <td className="border px-2 py-1">
                              {item.paperTitle || "--"}
                            </td>
                            <td className="border px-2 py-1">
                              {item.journalTitle || "--"}
                            </td>
                            <td className="border px-2 py-1">
                              {item.publicationLevelName || "--"}
                            </td>
                            <td className="border px-2 py-1">
                              {item.authors || "--"}
                            </td>
                            <td className="border px-2 py-1">
                              {item.pageNo || "--"}
                            </td>
                            <td className="border px-2 py-1">
                              {item.publicationYear || "--"}
                            </td>
                            <td className="border px-2 py-1">
                              {item.publisher || "--"}
                            </td>
                            <td className="border px-2 py-1">
                              {item.volumeNo || "--"}
                            </td>
                            <td className="border px-2 py-1">
                              {item.issn || "--"}
                            </td>
                            <td className="border px-2 py-1">
                              {item.scopus || "--"}
                            </td>
                            <td className="border px-2 py-1">
                              {item.doi || "--"}
                            </td>
                            <td className="border px-2 py-1">
                              {item.impactFactor || "--"}
                            </td>

                            <td className="border px-2 py-1">
                              <button
                                onClick={() =>
                                  handleViewRecords(
                                    item.tableName,
                                    item.tableRefId,
                                    "Records",
                                  )
                                }
                                className="bg-[#4f7f82] hover:bg-[#4f7f82] text-white px-2 py-1 rounded text-xs font-semibold"
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =========================================================
    SPONSORED PROJECTS
========================================================= */}
        {facultyData?.sponsoredProjects &&
          facultyData.sponsoredProjects.length > 0 && (
            <div className="px-4 pb-2">
              <h2 className="text-[#4f7f82] font-bold text-sm mb-2">
                Sponsored Projects:
              </h2>

              <div className="overflow-x-auto border border-gray-300">
                <table className="w-full border-collapse text-[12px]">
                  <thead className="bg-[#f1f1f1]">
                    <tr>
                      <th className="border px-2 py-1">Sl No.</th>

                      <th className="border px-2 py-1">Project Title</th>

                      <th className="border px-2 py-1">
                        Principal Investigator
                      </th>

                      <th className="border px-2 py-1">Co-Investigator</th>

                      <th className="border px-2 py-1">
                        Sponsoring Organization
                      </th>

                      <th className="border px-2 py-1">
                        Collaborating Organization
                      </th>

                      <th className="border px-2 py-1">Year</th>

                      <th className="border px-2 py-1">Status</th>
                      <th className="border px-2 py-1 text-left">View</th>
                    </tr>
                  </thead>

                  <tbody>
                    {facultyData.sponsoredProjects.map(
                      (item: any, index: number) => (
                        <tr key={index}>
                          <td className="border px-2 py-1">{index + 1}</td>

                          <td className="border px-2 py-1">
                            {item.projectTitle || "--"}
                          </td>

                          <td className="border px-2 py-1">
                            {item.principalInvestigator || "--"}
                          </td>

                          <td className="border px-2 py-1">
                            {item.coInvestigator || "--"}
                          </td>

                          <td className="border px-2 py-1">
                            {item.sponsoringOrganization || "--"}
                          </td>

                          <td className="border px-2 py-1">
                            {item.collaboratingOrganization || "--"}
                          </td>

                          <td className="border px-2 py-1">
                            {item.year || "--"}
                          </td>

                          <td className="border px-2 py-1">
                            {item.status || "--"}
                          </td>
                          <td className="border px-2 py-1">
                            <button
                              onClick={() =>
                                handleViewRecords(
                                  item.tableName,
                                  item.tableRefId,
                                  "Records",
                                )
                              }
                              className="bg-[#4f7f82] hover:bg-[#4f7f82] text-white px-2 py-1 rounded text-xs font-semibold"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        {/* =========================================================
    PATENT & INNOVATION
========================================================= */}
        {facultyData?.patents && facultyData.patents.length > 0 && (
          <div className="px-4 pb-3">
            <h2 className="text-[#4f7f82] font-bold text-[15px] mb-2">
              Patent & Innovation:
            </h2>

            <div className="overflow-x-auto border border-gray-300">
              <table className="w-full border-collapse text-[12px]">
                <thead className="bg-[#f1f1f1]">
                  <tr>
                    <th className={thClass}>Sl No.</th>

                    <th className={thClass}>Title</th>

                    <th className={thClass}>Patent No.</th>

                    <th className={thClass}>Year</th>

                    <th className={thClass}>Status</th>
                    <th className="border px-2 py-1 text-left">View</th>
                  </tr>
                </thead>

                <tbody>
                  {facultyData.patents.map((item: any, index: number) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className={tdClass}>{index + 1}</td>

                      <td className={tdClass}>{item.title || "--"}</td>

                      <td className={tdClass}>{item.patentNo || "--"}</td>

                      <td className={tdClass}>{item.year || "--"}</td>

                      <td className={tdClass}>{item.status || "--"}</td>
                      <td className="border px-2 py-1">
                        <button
                          onClick={() =>
                            handleViewRecords(
                              item.tableName,
                              item.tableRefId,
                              "Records",
                            )
                          }
                          className="bg-[#4f7f82] hover:bg-[#4f7f82] text-white px-2 py-1 rounded text-xs font-semibold"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {facultyData?.consultancyProjects?.length > 0 && (
          <div className="px-4 pb-2">
            <h2 className="text-[#4f7f82] font-bold text-[15px] mb-2">
              Consultancy / Testing Projects:
            </h2>

            <div className="overflow-x-auto border border-gray-300">
              <table className="w-full border-collapse text-[12px]">
                <thead className="bg-[#f1f1f1]">
                  <tr>
                    <th className={thClass}>Sl No.</th>
                    <th className={thClass}>Project Title</th>
                    <th className={thClass}>Project Code</th>
                    <th className={thClass}>Client</th>
                    <th className={thClass}>Consultant</th>
                    <th className={thClass}>Co-consultant(s)</th>
                    <th className={thClass}>Commencement Year</th>
                    <th className={thClass}>Completion Year</th>
                    <th className={thClass}>Status</th>
                    <th className={thClass}>View</th>
                  </tr>
                </thead>

                <tbody>
                  {facultyData.consultancyProjects.map(
                    (item: any, index: number) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className={tdClass}>{index + 1}</td>
                        <td className={tdClass}>{item.projectTitle || "--"}</td>
                        <td className={tdClass}>{item.projectCode || "--"}</td>
                        <td className={tdClass}>{item.client || "--"}</td>
                        <td className={tdClass}>{item.consultant || "--"}</td>
                        <td className={tdClass}>{item.coConsultant || "--"}</td>
                        <td className={tdClass}>
                          {item.commencementYear || "--"}
                        </td>
                        <td className={tdClass}>
                          {item.completionYear || "--"}
                        </td>
                        <td className={tdClass}>{item.status || "--"}</td>

                        <td className={tdClass}>
                          <button
                            onClick={() =>
                              handleViewRecords(
                                item.tableName,
                                item.tableRefId,
                                "Consultancy / Testing Projects",
                              )
                            }
                            className="bg-[#4f7f82] hover:bg-[#4f7f82] text-white px-2 py-1 rounded text-xs font-semibold"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {facultyData?.awards?.length > 0 && (
          <div className="px-4 pb-2">
            <h2 className="text-[#4f7f82] font-bold text-[15px] mb-2">
              Award & Honors:
            </h2>

            <div className="overflow-x-auto border border-gray-300">
              <table className="w-full border-collapse text-[12px]">
                <thead className="bg-[#f1f1f1]">
                  <tr>
                    <th className={thClass}>Sl No.</th>
                    <th className={thClass}>Award Name</th>
                    <th className={thClass}>Award For</th>
                    <th className={thClass}>Sponsored Organization</th>
                    <th className={thClass}>Year</th>
                    <th className={thClass}>Remarks</th>
                    <th className={thClass}>View</th>
                  </tr>
                </thead>

                <tbody>
                  {facultyData.awards.map((item: any, index: number) => (
                    <tr key={index}>
                      <td className={tdClass}>{index + 1}</td>
                      <td className={tdClass}>{item.awardName || "--"}</td>
                      <td className={tdClass}>{item.awardFor || "--"}</td>
                      <td className={tdClass}>
                        {item.sponsoredOrganization || "--"}
                      </td>
                      <td className={tdClass}>{item.year || "--"}</td>
                      <td className={tdClass}>{item.remarks || "--"}</td>

                      <td className={tdClass}>
                        <button
                          onClick={() =>
                            handleViewRecords(
                              item.tableName,
                              item.tableRefId,
                              "Award & Honors",
                            )
                          }
                          className="bg-[#4f7f82] hover:bg-[#4f7f82] text-white px-2 py-1 rounded text-xs font-semibold"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {facultyData?.fellowships?.length > 0 && (
          <div className="px-4 pb-2">
            <h2 className="text-[#4f7f82] font-bold text-[15px] mb-2">
              Fellowship / Scholarship:
            </h2>

            <div className="overflow-x-auto border border-gray-300">
              <table className="w-full border-collapse text-[12px]">
                <thead className="bg-[#f1f1f1]">
                  <tr>
                    <th className={thClass}>Sl No.</th>
                    <th className={thClass}>Fellowship / Scholarship For</th>
                    <th className={thClass}>Awarded By</th>
                    <th className={thClass}>Date</th>
                    <th className={thClass}>Type</th>
                    <th className={thClass}>View</th>
                  </tr>
                </thead>

                <tbody>
                  {facultyData.fellowships.map((item: any, index: number) => (
                    <tr key={index}>
                      <td className={tdClass}>{index + 1}</td>

                      <td className={tdClass}>{item.scholarshipFor || "--"}</td>

                      <td className={tdClass}>{item.awardedBy || "--"}</td>

                      <td className={tdClass}>{item.date || "--"}</td>

                      <td className={tdClass}>{item.type || "--"}</td>

                      <td className={tdClass}>
                        <button
                          onClick={() =>
                            handleViewRecords(
                              item.tableName,
                              item.tableRefId,
                              "Fellowship / Scholarship",
                            )
                          }
                          className="bg-[#4f7f82] hover:bg-[#4f7f82] text-white px-2 py-1 rounded text-xs font-semibold"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {facultyData?.books?.length > 0 && (
          <div className="px-4 pb-4">
            <h2 className="text-[#4f7f82] font-bold text-[15px] mb-2">
              Book Published:
            </h2>

            <div className="overflow-x-auto border border-gray-300">
              <table className="w-full border-collapse text-[12px]">
                <thead className="bg-[#f1f1f1]">
                  <tr>
                    <th className={thClass}>Book Title</th>
                    <th className={thClass}>Author</th>
                    <th className={thClass}>Co-author(s)</th>
                    <th className={thClass}>ISBN No</th>
                    <th className={thClass}>Year of publication</th>
                    <th className={thClass}>View</th>
                  </tr>
                </thead>

                <tbody>
                  {Object.entries(groupedBooks).map(
                    ([bookType, books]: any) => (
                      <React.Fragment key={bookType}>
                        {/* BOOK TYPE HEADER ONCE */}
                        <tr className="bg-gray-200 font-semibold">
                          <td className={tdClass} colSpan={6}>
                            {bookType}
                          </td>
                        </tr>

                        {/* BOOKS UNDER THAT TYPE */}
                        {books.map((item: any, index: number) => (
                          <tr key={index}>
                            <td className={tdClass}>
                              {item.bookTitle || "--"}
                            </td>
                            <td className={tdClass}>{item.author || "--"}</td>
                            <td className={tdClass}>
                              {item.coAuthors || "--"}
                            </td>
                            <td className={tdClass}>{item.isbnNo || "--"}</td>
                            <td className={tdClass}>
                              {item.publicationYear || "--"}
                            </td>
                            <td className={tdClass}>
                              <button
                                onClick={() =>
                                  handleViewRecords(
                                    item.tableName,
                                    item.tableRefId,
                                    "Book Published",
                                  )
                                }
                                className="bg-[#4f7f82] hover:bg-[#4f7f82] text-white px-2 py-1 rounded text-xs font-semibold"
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {facultyData?.organizedWorkshops?.length > 0 && (
          <div className="px-4 pb-2">
            <h2 className="text-[#4f7f82] font-bold text-[15px] mb-2">
              Conference / Seminar / Training / Development / Workshop
              Organized:
            </h2>

            <div className="overflow-x-auto border border-gray-300">
              <table className="w-full border-collapse text-[12px]">
                <thead className="bg-[#f1f1f1]">
                  <tr>
                    <th className={thClass}>Program Title</th>
                    <th className={thClass}>Level</th>
                    <th className={thClass}>Event Organizer</th>
                    <th className={thClass}>Collaboration</th>
                    <th className={thClass}>Date</th>
                    <th className={thClass}>Sponsored by</th>
                    <th className={thClass}>Your Role</th>
                    <th className={thClass}>View</th>
                  </tr>
                </thead>

                <tbody>
                  {Object.entries(groupedOrganizedWorkshops).map(
                    ([level, items]: any) => (
                      <React.Fragment key={level}>
                        {/* GROUP HEADER */}
                        <tr className="bg-gray-200 font-semibold">
                          <td
                            colSpan={8}
                            className="border px-3 py-2 text-left"
                          >
                            {level}
                          </td>
                        </tr>

                        {/* ROWS */}
                        {items.map((item: any, index: number) => (
                          <tr key={index}>
                            <td className={tdClass}>
                              {item.programTitle || "--"}
                            </td>
                            <td className={tdClass}>{item.level || "--"}</td>
                            <td className={tdClass}>
                              {item.eventOrganizer || "--"}
                            </td>
                            <td className={tdClass}>
                              {item.collaboration || "--"}
                            </td>
                            <td className={tdClass}>{item.date || "--"}</td>
                            <td className={tdClass}>
                              {item.sponsoredBy || "--"}
                            </td>
                            <td className={tdClass}>{item.yourRole || "--"}</td>

                            <td className={tdClass}>
                              <button
                                onClick={() =>
                                  handleViewRecords(
                                    item.tableName,
                                    item.tableRefId,
                                    "Workshop Organized",
                                  )
                                }
                                className="bg-[#4f7f82] hover:bg-[#4f7f82] text-white px-2 py-1 rounded text-xs font-semibold"
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {facultyData?.attendedWorkshops?.length > 0 && (
          <div className="px-4 pb-2">
            <h2 className="text-[#4f7f82] font-bold text-[15px] mb-2">
              Seminar / Training / Development / Workshop Attended:
            </h2>

            <div className="overflow-x-auto border border-gray-300">
              <table className="w-full border-collapse text-[12px]">
                <thead className="bg-[#f1f1f1]">
                  <tr>
                    <th className={thClass}>Program Title</th>
                    <th className={thClass}>Level</th>
                    <th className={thClass}>Event Organizer</th>
                    <th className={thClass}>Date</th>
                    <th className={thClass}>Your Role</th>
                    <th className={thClass}>View</th>
                  </tr>
                </thead>

                <tbody>
                  {Object.entries(groupedAttendedWorkshops).map(
                    ([level, items]: any) => (
                      <React.Fragment key={level}>
                        {/* GROUP HEADER */}
                        <tr className="bg-gray-200 font-semibold">
                          <td
                            colSpan={6}
                            className="border px-3 py-2 text-left"
                          >
                            {level}
                          </td>
                        </tr>

                        {/* ROWS */}
                        {items.map((item: any, index: number) => (
                          <tr key={index}>
                            <td className={tdClass}>
                              {item.programTitle || "--"}
                            </td>
                            <td className={tdClass}>{item.level || "--"}</td>
                            <td className={tdClass}>
                              {item.eventOrganizer || "--"}
                            </td>
                            <td className={tdClass}>{item.date || "--"}</td>
                            <td className={tdClass}>{item.yourRole || "--"}</td>

                            <td className={tdClass}>
                              <button
                                onClick={() =>
                                  handleViewRecords(
                                    item.tableName,
                                    item.tableRefId,
                                    "Workshop Attended",
                                  )
                                }
                                className="bg-[#4f7f82] hover:bg-[#4f7f82] text-white px-2 py-1 rounded text-xs font-semibold"
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {facultyData?.userDepartments?.length > 0 && (
          <div className="px-4 pb-4">
            <h2 className="text-[#4f7f82] font-bold text-[15px] mb-2">
              User Department:
            </h2>

            <div className="overflow-x-auto border border-gray-300">
              <table className="w-full border-collapse text-[12px]">
                <thead className="bg-[#f1f1f1]">
                  <tr>
                    <th className={thClass}>Sl No.</th>
                    <th className={thClass}>Department</th>
                    <th className={thClass}>Designation</th>
                    <th className={thClass}>Year</th>
                  </tr>
                </thead>

                <tbody>
                  {facultyData.userDepartments.map(
                    (item: any, index: number) => (
                      <tr key={index}>
                        <td className={tdClass}>{index + 1}</td>

                        <td className={tdClass}>{item.department || "--"}</td>

                        <td className={tdClass}>{item.designation || "--"}</td>

                        <td className={tdClass}>{item.year || "--"}</td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {showRecordsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-lg shadow-xl w-[950px] max-h-[85vh] flex flex-col overflow-hidden">
              {/* Header */}
              <div className="text-[#4f7f82]  px-5 py-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold truncate">
                  {recordTitle || "Records"}
                </h2>

                <button
                  onClick={() => setShowRecordsModal(false)}
                  className="text-black text-2xl font-semibold hover:text-black transition"
                >
                  ✕
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-auto p-4">
                <table className="w-full border-collapse border text-sm">
                  <thead className="bg-gray-100 sticky top-0 z-10">
                    <tr>
                      <th className="border px-3 py-2 text-left w-[70px]">
                        Sl No.
                      </th>

                      <th className="border px-3 py-2 text-left">File Name</th>

                      <th className="border px-3 py-2 text-left">
                        Description
                      </th>

                      <th className="border px-3 py-2 text-left w-[140px]">
                        Date
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {loadingRecords ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="border px-3 py-5 text-center text-[#4f7f82]"
                        >
                          Loading records...
                        </td>
                      </tr>
                    ) : recordFiles.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="border px-3 py-5 text-center text-gray-500"
                        >
                          No Data To Display
                        </td>
                      </tr>
                    ) : (
                      recordFiles.map((file: any, index: number) => (
                        <tr key={index} className="hover:bg-gray-50 transition">
                          <td className="border px-3 py-2">{index + 1}</td>

                          <td className="border px-3 py-2 break-words">
                            {file.file_name || "--"}
                          </td>

                          <td className="border px-3 py-2 break-words">
                            {file.description || "--"}
                          </td>

                          <td className="border px-3 py-2">
                            {file.actualDate || "--"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div className="border-t bg-white px-5 py-4 flex justify-end">
                <button
                  onClick={() => setShowRecordsModal(false)}
                  className="bg-[#4f7f82] hover:bg-[#4f7f82] text-white px-6 py-2 rounded-md transition"
                >
                  Ok
                </button>
              </div>
            </div>
          </div>
        )}
        {selectedDept && selectedUser && (
          <div className="border-t border-gray-300 mt-4 pt-4 flex justify-end">
            <div className="relative group">
              <button className="bg-green-600 hover:bg-green-700 m-2 text-white text-sm px-4 py-2 rounded">
                Export
              </button>

              <div
                className="
          absolute right-0 bottom-full mb-1 w-24
          bg-white border border-gray-200
          shadow-lg rounded-md z-50
          opacity-0 invisible
          group-hover:opacity-100
          group-hover:visible
          transition-all duration-200
        "
              >
                {/* PDF */}
                <button
                  onClick={handleExportPDF}
                  className="
            w-full flex items-center gap-2
            px-3 py-2 text-sm
            hover:bg-gray-100 rounded-t-md
          "
                >
                  <FileText size={16} className="text-red-600" />
                  PDF
                </button>

                {/* EXCEL */}
                <button
                  onClick={handleExportExcel}
                  className="
            w-full flex items-center gap-2
            px-3 py-2 text-sm
            hover:bg-gray-100 rounded-b-md
          "
                >
                  <FileSpreadsheet size={16} className="text-green-600" />
                  XLSX
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FacultyReportsProfilePage;

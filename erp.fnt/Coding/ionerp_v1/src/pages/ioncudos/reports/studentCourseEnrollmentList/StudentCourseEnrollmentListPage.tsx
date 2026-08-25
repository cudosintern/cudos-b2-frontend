import React, { useState } from "react";

const StudentCourseEnrollmentListPage = () => {
  const [searchBy, setSearchBy] = useState("student_name");
  const [searchKey, setSearchKey] = useState("-Pruthvi");

  // MANUAL DATA
  const studentInfo = {
    program: "Bachelor in Architecture",
    curriculum: "B in ARCH 2024-2029",
    usn: "1",
    student_name: "- Pruthvi",
    email: "pruthvi@gmail.com",
  };

  const enrollmentData = [
    {
      department: "Architecture",
      curriculum: "B in ARCH 2024-2029",
      courses: [
        {
          course: "c_202 (c_202)",
          course_type: "Studio",
          credits: 2,
          course_mode: "Theory",
          section: "A",
          instructor: "Mr.Abhishek Patil",
          status: "Pending",
        },
      ],
    },

    {
      department: "Computer Science & Engineering",
      curriculum: "B. E in CSE 2017-2021",
      courses: [
        {
          course: "cc (cccc)",
          course_type: "Core",
          credits: 0,
          course_mode: "Theory",
          section: "A",
          instructor: "Mr.BALAJI N",
          status: "Pending",
        },
      ],
    },

    {
      department: "EMS_FLOW_Test",
      curriculum: "ems-flow in EFT 2026-2030",
      courses: [
        {
          course: "ems_flow_crs1 (ems_flow_crs1)",
          course_type: "Core",
          credits: 0,
          course_mode: "Theory with Lab",
          section: "A",
          instructor: "MissSeema",
          status: "Pending",
        },
      ],
    },
  ];

  return (
    <div className="w-full min-h-screen bg-[#efefef] p-4">
      <div className="bg-white border border-gray-300 rounded-md overflow-hidden">
        {/* HEADER */}
        <div className="bg-[#f3f3f3] text-[#4f7f82] text-[18px] font-semibold px-5 py-3">
          Student - Course Registered / Enrollment List
        </div>

        <div className="p-5">
          {/* SEARCH BY */}
          <div className="mb-6">
            <div className="font-semibold text-sm mb-4">Search By:</div>

            <div className="flex items-center gap-20 mb-5">
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input
                  type="radio"
                  checked={searchBy === "student_usn"}
                  onChange={() => setSearchBy("student_usn")}
                />
                Student USN
              </label>

              <label className="flex items-center gap-2 text-sm font-semibold">
                <input
                  type="radio"
                  checked={searchBy === "student_name"}
                  onChange={() => setSearchBy("student_name")}
                />
                Student Name
              </label>
            </div>

            {/* SEARCH KEY */}
            <div className="flex items-center gap-4">
              <label className="font-semibold text-sm">
                Search Key : <span className="text-red-500">*</span>
              </label>

              <input
                type="text"
                value={searchKey}
                onChange={(e) => setSearchKey(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 w-[260px] text-sm"
              />
            </div>
          </div>

          {/* STUDENT INFO */}
          <div className="border border-gray-300 rounded overflow-hidden mb-5">
            <div className="bg-[#f8f8f8] px-3 py-2 text-[#4f7f82] font-semibold">
              Student Information
            </div>

            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#f4f4f4]">
                  <th className="border px-3 py-2 text-left text-sm">
                    Program
                  </th>

                  <th className="border px-3 py-2 text-left text-sm">
                    Base Curriculum
                  </th>

                  <th className="border px-3 py-2 text-left text-sm">
                    Student USN
                  </th>

                  <th className="border px-3 py-2 text-left text-sm">
                    Student Name
                  </th>

                  <th className="border px-3 py-2 text-left text-sm">
                    Email
                  </th>
                </tr>
              </thead>

              <tbody>
                <tr>
                  <td className="border px-3 py-2 text-sm">
                    {studentInfo.program}
                  </td>

                  <td className="border px-3 py-2 text-sm">
                    {studentInfo.curriculum}
                  </td>

                  <td className="border px-3 py-2 text-sm">
                    {studentInfo.usn}
                  </td>

                  <td className="border px-3 py-2 text-sm">
                    {studentInfo.student_name}
                  </td>

                  <td className="border px-3 py-2 text-sm">
                    {studentInfo.email}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ENROLLMENT LIST */}
          <div className="border border-gray-300 rounded overflow-hidden">
            <div className="bg-[#f8f8f8] px-3 py-2 text-[#4f7f82] font-semibold">
              Student - Course Enrollment List
            </div>

            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#f4f4f4]">
                  <th className="border px-3 py-2 text-left text-sm">
                    Course
                  </th>

                  <th className="border px-3 py-2 text-left text-sm">
                    Course Type
                  </th>

                  <th className="border px-3 py-2 text-left text-sm">
                    Credits
                  </th>

                  <th className="border px-3 py-2 text-left text-sm">
                    Course Mode
                  </th>

                  <th className="border px-3 py-2 text-left text-sm">
                    Section/Division
                  </th>

                  <th className="border px-3 py-2 text-left text-sm">
                    Course Instructor
                  </th>

                  <th className="border px-3 py-2 text-center text-sm">
                    Course Attainment Finalized
                  </th>
                </tr>
              </thead>

              <tbody>
                {enrollmentData.map((dept, index) => (
                  <React.Fragment key={index}>
                    {/* DEPARTMENT */}
                    <tr className="bg-[#cfcfcf]">
                      <td
                        colSpan={7}
                        className="border px-3 py-2 font-semibold text-sm"
                      >
                        Department - {dept.department}
                      </td>
                    </tr>

                    {/* CURRICULUM */}
                    <tr className="bg-[#ece7e7]">
                      <td
                        colSpan={7}
                        className="border px-3 py-2 font-semibold text-sm"
                      >
                        Curriculum: {dept.curriculum}
                      </td>
                    </tr>

                    {/* COURSE ROWS */}
                    {dept.courses.map((course, courseIndex) => (
                      <tr key={courseIndex}>
                        <td className="border px-3 py-2 text-sm">
                          {course.course}
                        </td>

                        <td className="border px-3 py-2 text-sm">
                          {course.course_type}
                        </td>

                        <td className="border px-3 py-2 text-sm">
                          {course.credits}
                        </td>

                        <td className="border px-3 py-2 text-sm">
                          {course.course_mode}
                        </td>

                        <td className="border px-3 py-2 text-sm">
                          {course.section}
                        </td>

                        <td className="border px-3 py-2 text-sm">
                          {course.instructor}
                        </td>

                        <td className="border px-3 py-2 text-center">
                          <span className="bg-orange-400 text-white text-sm px-5 py-1 rounded">
                            {course.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentCourseEnrollmentListPage;
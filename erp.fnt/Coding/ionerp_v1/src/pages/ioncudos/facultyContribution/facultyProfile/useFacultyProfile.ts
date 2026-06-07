// useFacultyProfile.ts

import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  getDropdowns,
  saveFaculty,
  getDesignations,
  getFacultyDetails,
  uploadProfileImage,
  getDepartments,              // ✅ ADD THIS
  getUserDesignationList,
  getPhdGuidanceList,
  savePhdGuidance,
  getQualificationList,      // ✅ ADD THIS
  saveQualification 
} from "./facultyProfileApi";

export const useFacultyProfile = (deptId: number, userId: number) => {
  const [showUploadModal, setShowUploadModal] = useState(false);
const [uploadQualId, setUploadQualId] = useState<number | null>(null);
const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [qualificationTable, setQualificationTable] = useState<any[]>([]);
  const [editId, setEditId] = useState<number | null>(null);
const [deleteId, setDeleteId] = useState<number | null>(null);
const [showDeleteModal, setShowDeleteModal] = useState(false);
const loadQualification = async () => {
  const res = await getQualificationList(userId);
  setQualificationTable(res.data || []);
};
useEffect(() => {
  if (userId) {
    loadQualification();
  }
}, [userId]);
const [qualificationForm, setQualificationForm] = useState({
  degree: "",
  specialization: "",
  university: "",
  year: ""
});

const [qualificationEditId, setQualificationEditId] = useState<number | null>(null);

const handleSaveQualification = async () => {
  try {
    let data;

    if (qualificationEditId) {
      // UPDATE
      const res = await fetch(
        `http://localhost:8000/faculty-profile/qualification/update/${qualificationEditId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            user_id: userId,
            ...qualificationForm
          })
        }
      );

      data = await res.json();

    } else {
      // INSERT
      data = await saveQualification({
        user_id: userId,
        ...qualificationForm
      });
    }

    console.log("QUALIFICATION RESPONSE:", data);

    if (data?.status || data?.success) {

      toast.success(
        qualificationEditId
          ? "Updated Successfully"
          : "Saved Successfully"
      );

      await loadQualification();

      setQualificationForm({
        degree: "",
        specialization: "",
        university: "",
        year: ""
      });

      setQualificationEditId(null);

    } else {
      toast.error(data?.message || "Save Failed");
    }

  } catch (error) {
    console.error(error);
    toast.error("Something went wrong");
  }
};
  const handleImageUpload = async (file: File) => {
  try {
    const res = await uploadProfileImage(userId, file);

    if (res.status) {
      setProfileImage(res.data.url + "?t=" + new Date().getTime());
      toast.success("Image Uploaded");
    } else {
      toast.error("Upload Failed");
    }
  } catch (error) {
    toast.error("Upload Error");
  }
};
type Department = {
  id: number;
  name: string;
};

const [departmentList, setDepartmentList] = useState<Department[]>([]);
const [designationTable, setDesignationTable] = useState([]);

useEffect(() => {
  const loadData = async () => {
    if (!userId) return;

    // Departments
    const deptRes = await getDepartments();
    const departments =
      deptRes?.data?.data ?? deptRes?.data ?? [];

    setDepartmentList(departments);

    // Designations
    const desigRes = await getDesignations();
    const designations = desigRes?.data || [];

    setDesignationList(designations);

    // User Rows
    const userRes = await getUserDesignationList(userId);

    const mapped = (userRes?.data || []).map((item: any) => {
  const matchedDept = departments.find(
    (d: any) =>
      d.name?.trim().toLowerCase() ===
      item.department?.trim().toLowerCase()
  );

  return {
    ...item,

    id: item.id,

    // convert name -> id
    dept_id: matchedDept?.id || "",

    designation_id: item.designation,

    department_name: item.department,

    designation_name:
      designations.find(
        (d: any) => d.id == item.designation
      )?.name || item.designation,

    year: item.year
  };
});

    setDesignationTable(mapped);
  };

  loadData();
}, [userId]);
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [dropdowns, setDropdowns] = useState<any>({});
  const [designationList, setDesignationList] = useState<any[]>([]);
  const [facultyMode, setFacultyMode] = useState(0);
  const [errors, setErrors] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [profileImage, setProfileImage] = useState("");
  const [formData, setFormData] = useState<any>({
    title: "",
    first_name: "",
    last_name: "",
    email: "",
    mobile: "",
    aadhaar: "",
    present_address: "",
    permanent_address: "",
    website: "",
    dob: "",
    blood_group: "",

    employee_no: "",
    faculty_type: "",
    doj: "",
    relieving_date: "",
    teaching_exp: "",
    industrial_exp: "",
    faculty_serving: "",
    last_promotion: "",
    remarks: "",
    responsibilities: "",
    designation: "",
    total_exp: "",
    retirement_date: "",
    salary: "",

    highest_qualification: "",
    research_interest: "",
    specialization: "",
    skills: "",

    phd_university: "",
    phd_registration_year: "",
    phd_supervisor: "",
    phd_topic: "",
    phd_url: "",
    phd_year: "",
    phd_status: "",
    phd_inside_count: 0,
    phd_outside_count: 0
  });

  // Dropdowns
  useEffect(() => {
getDropdowns().then((res) =>
  setDropdowns(res?.data || {})
);    
getDesignations().then((res) =>
  setDesignationList(res?.data || [])
);  }, []);

  // Fetch_details
  useEffect(() => {
    if (!userId) return;

    getFacultyDetails(userId).then((res) => {
      if (res.status && res.data) {
        const d = res.data;
const matchedTitle = dropdowns[50]?.find(
      (t: any) => t.name === d.title
    );
        setFormData({
          title: matchedTitle?.id || "",
          first_name: d.first_name || "",
          last_name: d.last_name || "",
          email: d.email || "",
          mobile: d.mobile || "",
          aadhaar: d.aadhaar || "",
          present_address: d.present_address || "",
          permanent_address: d.permanent_address || "",
          website: d.website || "",
          dob: d.dob || "",
          blood_group: d.blood_group || "",

          employee_no: d.employee_no || "",
          faculty_type: d.faculty_type || "",
          doj: d.year_of_joining || "",
          relieving_date: d.resign_date || "",
          teaching_exp: d.teach_experiance || "",
          industrial_exp: d.indurtrial_experiance || "",
          faculty_serving: d.faculty_serving || "",
          last_promotion: d.last_promotion || "",
          remarks: d.remarks || "",
          responsibilities: d.responsibilities || "",
          designation: d.designation || "",
          total_exp: d.user_experience || "",
          retirement_date: d.retirement_date || "",
          salary: d.salary || "",

          highest_qualification: d.highest_qualification || "",
          research_interest: d.research_interest || "",
          specialization: d.specialization || "",
          skills: d.skills || "",

          phd_university: d.phd_university || "",
          phd_registration_year: d.phd_registration_year || "",
          phd_supervisor: d.phd_supervisor || "",
          phd_year: d.phd_year || "",
          phd_inside_count: d.phd_inside_count || 0,
          phd_outside_count: d.phd_outside_count || 0,
          phd_topic: d.phd_topic || "",
          phd_url: d.phd_url || "",
          phd_status: d.phd_status || "",
          university: d.university || "",
          user_qualification: d.user_qualification || "",
          phd_status_data: d.phd_status_data || ""
        });

        setFacultyMode(d.faculty_mode || 0);
        setProfileImage(d.profile_pic_url || "");
      }

      setLoading(false);
    });
  }, [userId, dropdowns]);

  const handleChange = (e: any) => {
    const { name, value } = e.target;

    setFormData((prev: any) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
  try {
    const payload = {
  id: userId,
  base_dept_id: deptId,
  user_dept_id: deptId,

  title: dropdowns[50]?.find((t:any)=>t.id==formData.title)?.name || null,

  first_name: formData.first_name,
  last_name: formData.last_name,
  email: formData.email,
  mobile: formData.mobile,

  aadhar_number: formData.aadhaar || null,
  DOB: formData.dob || null,

  present_address: formData.present_address || null,
  permanent_address: formData.permanent_address || null,
  user_website: formData.website || null,
  blood_group: formData.blood_group || null,

  emp_no: formData.employee_no || null,
  faculty_type: Number(formData.faculty_type) || null,

  year_of_joining: formData.doj || null,
  resign_date: formData.relieving_date || null,

  teach_experiance: Number(formData.teaching_exp) || 0,
  indurtrial_experiance: Number(formData.industrial_exp) || 0,
  user_experience: Number(formData.total_exp) || 0,

  faculty_serving: Number(formData.faculty_serving) || null,

  // 🔥 FIXED
  designation:
  formData.designation !== "" && formData.designation !== null
    ? Number(formData.designation)
    : null,

  salary_pay: formData.salary ? Number(formData.salary) : null,

  last_promotion: formData.last_promotion || null,
  retirement_date: formData.retirement_date || null,

  remarks: formData.remarks || null,
  responsibilities: formData.responsibilities || null,

  heighest_qualification: Number(formData.highest_qualification) || null,
  research_interrest: formData.research_interest || null,
  user_specialization: formData.specialization || null,
  skills: formData.skills || null,

  phd_from: formData.phd_university || null,
  university: formData.university || null,
  superviser: formData.phd_supervisor || null,
  phd_topic: formData.phd_topic || null,
  phd_url: formData.phd_url || null,
  phd_status: Number(formData.phd_status) || null,

  // 🔥 VERY IMPORTANT FIX
  registration_year: formData.phd_registration_year
    ? Number(formData.phd_registration_year)
    : null,

  phd_assessment_year: formData.phd_year
    ? Number(formData.phd_year)
    : null,

  guidance_within_org: Number(formData.phd_inside_count) || 0,
  guidance_outside_org: Number(formData.phd_outside_count) || 0,

  faculty_mode: facultyMode,

  user_qualification: Number(formData.highest_qualification) || null,
  phd_status_data: Number(formData.phd_status) || null
};

    const res = await saveFaculty(payload);

    if (res.status) {
      toast.success("Saved Successfully");
    } else {
      toast.error(res.message || "Save Failed");
    }

  } catch (error) {
    console.log(error);
    toast.error("Server Error");
  }
};

 return {
 formData,
 setFormData,
 handleChange,
 handleSave,
 dropdowns,
 designationList,
 facultyMode,
 setFacultyMode,
 errors,
 loading,
 profileImage,
 setProfileImage,
 handleImageUpload,
 departmentList,
 designationTable,
 editId,
  setEditId,
  deleteId,
  setDeleteId,
  showDeleteModal,
  setShowDeleteModal,
  setDesignationTable,
  qualificationTable,
  qualificationForm,
  setQualificationForm,
  qualificationEditId,
  setQualificationEditId,
  handleSaveQualification,
  loadQualification,
  setErrors
};
};
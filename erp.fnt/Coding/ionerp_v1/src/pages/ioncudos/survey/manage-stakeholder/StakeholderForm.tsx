import React, { useState, useEffect } from "react";
import {
  FaSave,
  FaExchangeAlt,
  FaTimes,
  FaQuestionCircle,
} from "react-icons/fa";
import UIButton from "../../../../components/FormBuilder/fields/Button";
import axiosInstance from "../../../../utils/api";
import { toast } from "react-toastify";
import { ApiEndpoint } from "../../../../utils/ApiEndpoint/emsapiEndpoint";

interface Props {
  initialData: any | null;
  selectedFilters: {
    group_id: string;
    dept_id: string;
    pgm_id: string;
    academic_batch_id: string;
  };
  onSave: (data: any) => void;
  onCancel: () => void;
}

const StakeholderForm: React.FC<Props> = ({
  initialData,
  selectedFilters,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    stakeholder_group_id:
      initialData?.stakeholder_group_id || selectedFilters.group_id || "",
    dept_id: initialData?.dept_id || selectedFilters.dept_id || "",
    pgm_id: initialData?.pgm_id || selectedFilters.pgm_id || "",
    academic_batch_id:
      initialData?.academic_batch_id || selectedFilters.academic_batch_id || "",
    first_name: initialData?.first_name || "",
    last_name: initialData?.last_name || "",
    email: initialData?.email || "",
    contact: initialData?.contact || "",
  });

  const [groups, setGroups] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [curriculums, setCurriculums] = useState<any[]>([]);

  // 1. Initial Fetch: Groups & Schools
  useEffect(() => {
    axiosInstance
      .get<any>(ApiEndpoint.survey.stakeholder.groups)
      .then((res) => {
        if (res.data?.status) {
          const activeGroups = res.data.data.filter((g: any) => g.status === 1);
          setGroups(activeGroups);
        }
      })
      .catch(() => console.error("Failed to fetch stakeholder groups"));

    axiosInstance
      .get<any>(ApiEndpoint.survey.stakeholder.schools)
      .then((res) => {
        if (res.data?.status) setSchools(res.data.data);
      })
      .catch(() => console.error("Failed to fetch schools"));
  }, []);

  // 2. Fetch Programs when School changes
  useEffect(() => {
    if (formData.dept_id) {
      axiosInstance
        .get<any>(`${ApiEndpoint.survey.stakeholder.programs}?dept_id=${formData.dept_id}`)
        .then((res) => {
          if (res.data?.status) setPrograms(res.data.data);
        })
        .catch(() => console.error("Failed to fetch programs"));
    } else {
      setPrograms([]);
    }
  }, [formData.dept_id]);

  // 3. Fetch Curriculums when Program changes
  useEffect(() => {
    if (formData.pgm_id) {
      axiosInstance
        .get<any>(`${ApiEndpoint.survey.stakeholder.curriculum}?pgm_id=${formData.pgm_id}`)
        .then((res) => {
          if (res.data?.status) setCurriculums(res.data.data);
        })
        .catch(() => console.error("Failed to fetch curriculums"));
    } else {
      setCurriculums([]);
    }
  }, [formData.pgm_id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const updated = { ...prev, [name]: value };

      // Cascading Reset Logic
      if (name === "dept_id") {
        updated.pgm_id = "";
        updated.academic_batch_id = "";
      } else if (name === "pgm_id") {
        updated.academic_batch_id = "";
      }

      return updated;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.dept_id ||
      !formData.pgm_id ||
      !formData.academic_batch_id ||
      !formData.stakeholder_group_id
    ) {
      toast.error("Please fill all mandatory dropdowns.");
      return;
    }
    if (!formData.first_name.trim() || !formData.email.trim()) {
      toast.error("First Name and Email are mandatory.");
      return;
    }

    // --- Strict Field Validations ---
    const nameRegex = /^[a-zA-Z\s]+$/;
    
    if (!nameRegex.test(formData.first_name)) {
      toast.error("First Name can only contain letters. Numbers and special characters are not allowed.");
      return;
    }

    if (formData.last_name && formData.last_name.trim() !== "" && !nameRegex.test(formData.last_name)) {
      toast.error("Last Name can only contain letters. Numbers and special characters are not allowed.");
      return;
    }

    if (formData.contact && String(formData.contact).trim() !== "") {
      const contactStr = String(formData.contact).trim();
      if (!/^\d{10}$/.test(contactStr)) {
        toast.error("Contact Number must be exactly 10 digits.");
        return;
      }
    }
    // --------------------------------

    onSave(formData);
  };

  return (
    <div className="bg-white rounded-md border border-gray-300 shadow-sm animate-fade-in max-w-6xl mx-auto">
      <div className="bg-[#1f3b4d] text-white px-4 py-2.5 rounded-t-md flex justify-between items-center">
        <h2 className="text-sm font-semibold">
          {initialData ? "Edit Stakeholder" : "Add Stakeholder"}
        </h2>
        <FaQuestionCircle
          className="text-[#5bc0de] cursor-pointer hover:text-white"
          size={16}
        />
      </div>

      <form onSubmit={handleSubmit} className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6">
          <div className="flex flex-col space-y-6">
            <div className="flex items-center">
              <label className="w-1/3 text-sm text-gray-700 text-right pr-4">
                School: <span className="text-red-500">*</span>
              </label>
              <select
                name="dept_id"
                value={formData.dept_id}
                onChange={handleChange}
                className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#437880] bg-gray-50"
                required
              >
                <option value="">Select School</option>
                {schools.map((s) => (
                  <option key={s.dept_id} value={s.dept_id}>
                    {s.dept_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center">
              <label className="w-1/3 text-sm text-gray-700 text-right pr-4">
                Curriculum: <span className="text-red-500">*</span>
              </label>
              <select
                name="academic_batch_id"
                value={formData.academic_batch_id}
                onChange={handleChange}
                className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#437880] bg-gray-50"
                required
                disabled={!formData.pgm_id}
              >
                <option value="">Select Curriculum</option>
                {curriculums.map((c) => (
                  <option key={c.academic_batch_id} value={c.academic_batch_id}>
                    {c.academic_batch_code}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center">
              <label className="w-1/3 text-sm text-gray-700 text-right pr-4">
                First Name: <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#437880]"
                required
              />
            </div>

            <div className="flex items-center">
              <label className="w-1/3 text-sm text-gray-700 text-right pr-4">
                Last Name:
              </label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#437880]"
              />
            </div>
          </div>

          <div className="flex flex-col space-y-6">
            <div className="flex items-center">
              <label className="w-1/3 text-sm text-gray-700 text-right pr-4">
                Program: <span className="text-red-500">*</span>
              </label>
              <select
                name="pgm_id"
                value={formData.pgm_id}
                onChange={handleChange}
                className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#437880] bg-gray-50"
                required
                disabled={!formData.dept_id}
              >
                <option value="">Select Program</option>
                {programs.map((p) => (
                  <option key={p.pgm_id} value={p.pgm_id}>
                    {p.pgm_title}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center">
              <label className="w-1/3 text-sm text-gray-700 text-right pr-4">
                Stakeholder Group: <span className="text-red-500">*</span>
              </label>
              <select
                name="stakeholder_group_id"
                value={formData.stakeholder_group_id}
                onChange={handleChange}
                className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#437880] bg-gray-50"
                required
              >
                <option value="">Select Group</option>
                {groups.map((g) => (
                  <option
                    key={g.stakeholder_group_id}
                    value={g.stakeholder_group_id}
                  >
                    {g.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center">
              <label className="w-1/3 text-sm text-gray-700 text-right pr-4">
                Email Id: <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#437880]"
                required
              />
            </div>

            <div className="flex items-center">
              <label className="w-1/3 text-sm text-gray-700 text-right pr-4">
                Contact Number:
              </label>
              <input
                type="number"
                name="contact"
                value={formData.contact}
                onChange={handleChange}
                className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#437880]"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-10 pt-4 border-t border-gray-100 bg-gray-50 p-4 -mx-8 -mb-8 rounded-b-md">
          <UIButton
            type="submit"
            className="bg-[#0066cc] !border-none hover:bg-[#0052a3]"
          >
            <FaSave className="mr-2" /> Save
          </UIButton>
          <UIButton
            type="button"
            className="bg-[#5bc0de] !border-none hover:bg-[#31b0d5]"
            onClick={() =>
              setFormData({
                ...formData,
                first_name: "",
                last_name: "",
                email: "",
                contact: "",
              })
            }
          >
            <FaExchangeAlt className="mr-2" /> Reset
          </UIButton>
          <UIButton
            type="button"
            className="bg-[#d9534f] !border-none hover:bg-[#c9302c]"
            onClick={onCancel}
          >
            <FaTimes className="mr-2" /> Cancel
          </UIButton>
        </div>
      </form>
    </div>
  );
};

export default StakeholderForm;
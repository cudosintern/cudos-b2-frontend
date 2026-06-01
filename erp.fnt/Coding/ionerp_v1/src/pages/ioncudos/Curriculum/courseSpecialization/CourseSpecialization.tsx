import React, { useState, useEffect } from "react";
import {
  getDepartmentDropdown,
  getCourseDomains,
  saveCourseDomain,
  deleteCourseDomain,
  CourseSpecializationData,
} from "./courseSpecializationService";

const CourseSpecialization = () => {
  // --- State Variables ---
  const [deptId, setDeptId] = useState<number>(0);
  const [deptOptions, setDeptOptions] = useState<any[]>([]);
  const [tableData, setTableData] = useState<CourseSpecializationData[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Form State
  const [formData, setFormData] = useState<CourseSpecializationData>({
    dept_id: 0,
    crs_domain_name: "",
    crs_domain_description: "",
  });

  // --- 1. INITIAL LOAD (Fetch Departments) ---
  useEffect(() => {
    const loadDropdown = async () => {
      const result = await getDepartmentDropdown();
      if (result.status === 1 && result.data.length > 0) {
        setDeptOptions(result.data);
        // Automatically select the first department
        setDeptId(result.data[0].value);
      } else {
        console.error("Failed to load departments");
      }
    };
    loadDropdown();
  }, []);

  // --- 2. FETCH TABLE DATA (When Department Changes) ---
  useEffect(() => {
    if (deptId !== 0) {
      fetchTableData(deptId);
    } else {
      setTableData([]);
    }
  }, [deptId]);

  const fetchTableData = async (id: number) => {
    setLoading(true);
    try {
      const result = await getCourseDomains(id);
      if (result.status === 1) {
        setTableData(result.data);
      } else {
        setTableData([]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLERS ---
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleEdit = (row: CourseSpecializationData) => {
    setFormData({
      crs_domain_id: row.crs_domain_id,
      dept_id: row.dept_id,
      crs_domain_name: row.crs_domain_name,
      crs_domain_description: row.crs_domain_description || "",
    });
    // Scroll to form
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    setMessage("");
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this Specialization?"))
      return;
    try {
      const res = await deleteCourseDomain(id);
      if (res.status === 1) {
        alert("Deleted Successfully");
        fetchTableData(deptId);
      } else {
        alert("Failed to delete: " + res.message);
      }
    } catch (error) {
      console.error(error);
      alert("Error deleting");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.crs_domain_name) {
      alert("Course Specialization Name is required!");
      return;
    }

    try {
      const payload = {
        ...formData,
        dept_id: deptId, // Ensure it saves to the currently selected department
      };
      const res = await saveCourseDomain(payload);

      if (res.status === 1) {
        setMessage("Saved Successfully!");
        fetchTableData(deptId); // Refresh table
        // Reset Form (keep current department)
        setFormData({
          dept_id: deptId,
          crs_domain_name: "",
          crs_domain_description: "",
        });
      } else {
        setMessage(`Error: ${res.message}`);
      }
    } catch (error) {
      console.error(error);
      setMessage("Error Saving Data");
    }
  };

  const handleReset = () => {
    setFormData({
      dept_id: deptId,
      crs_domain_name: "",
      crs_domain_description: "",
    });
    setMessage("");
  };

  // --- STYLES (Matching previous page) ---
  const styles = {
    container: {
      padding: "20px",
      fontFamily: "Segoe UI, sans-serif",
      background: "#f4f7fa",
      minHeight: "100vh",
    },
    card: {
      background: "white",
      borderRadius: "5px",
      boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
      marginBottom: "20px",
      overflow: "hidden",
    },
    header: {
      background: "#2c3e50",
      color: "white",
      padding: "10px 15px",
      fontWeight: "bold" as "bold",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse" as "collapse",
      fontSize: "14px",
    },
    th: {
      background: "#f8f9fa",
      padding: "12px",
      textAlign: "left" as "left",
      borderBottom: "2px solid #ddd",
      fontWeight: "600",
    },
    td: {
      padding: "12px",
      borderBottom: "1px solid #eee",
      color: "#333",
    },
    input: {
      width: "100%",
      padding: "8px",
      border: "1px solid #ccc",
      borderRadius: "4px",
    },
    label: {
      display: "block",
      marginBottom: "5px",
      fontWeight: "600" as "600",
      fontSize: "14px",
    },
    btnSave: {
      background: "#007bff",
      color: "white",
      border: "none",
      padding: "8px 20px",
      borderRadius: "4px",
      cursor: "pointer",
      fontWeight: "bold" as "bold",
    },
    btnReset: {
      background: "#17a2b8",
      color: "white",
      border: "none",
      padding: "8px 20px",
      borderRadius: "4px",
      cursor: "pointer",
      marginLeft: "10px",
      fontWeight: "bold" as "bold",
    },
    actionBtn: {
      border: "none",
      background: "none",
      cursor: "pointer",
      fontSize: "16px",
    },
  };

  return (
    <div style={styles.container}>
      {/* 1. SELECTION CARD */}
      <div style={styles.card}>
        <div style={styles.header}>Course Specialization Settings</div>
        <div
          style={{
            padding: "20px",
            display: "flex",
            alignItems: "center",
            gap: "15px",
          }}
        >
          <label style={{ fontWeight: "bold" }}>
            Department: <span style={{ color: "red" }}>*</span>
          </label>
          <select
            style={{ ...styles.input, width: "300px" }}
            value={deptId}
            onChange={(e) => setDeptId(Number(e.target.value))}
          >
            <option value="0">Select Department</option>
            {deptOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. TABLE CARD */}
      <div style={styles.card}>
        <div style={styles.header}>
          Course Specialization (School Verticals) List
        </div>
        <div style={{ padding: "0" }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{ ...styles.th, width: "60px" }}>Sl No.</th>
                <th style={styles.th}>Course Specialization Name</th>
                <th style={styles.th}>Course Specialization Description</th>
                <th
                  style={{ ...styles.th, width: "60px", textAlign: "center" }}
                >
                  Edit
                </th>
                <th
                  style={{ ...styles.th, width: "60px", textAlign: "center" }}
                >
                  Delete
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    style={{ padding: "20px", textAlign: "center" }}
                  >
                    Loading...
                  </td>
                </tr>
              ) : tableData.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    style={{ padding: "20px", textAlign: "center" }}
                  >
                    No data found
                  </td>
                </tr>
              ) : (
                tableData.map((row, index) => (
                  <tr key={row.crs_domain_id}>
                    <td style={styles.td}>{index + 1}</td>
                    <td style={styles.td}>{row.crs_domain_name}</td>
                    <td style={styles.td}>{row.crs_domain_description}</td>
                    <td style={{ ...styles.td, textAlign: "center" }}>
                      <button
                        onClick={() => handleEdit(row)}
                        style={styles.actionBtn}
                      >
                        ✏️
                      </button>
                    </td>
                    <td style={{ ...styles.td, textAlign: "center" }}>
                      <button
                        onClick={() => handleDelete(row.crs_domain_id!)}
                        style={{ ...styles.actionBtn, color: "red" }}
                      >
                        ✖
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. ADD/EDIT FORM CARD */}
      <div style={styles.card}>
        <div style={styles.header}>
          Add Course Specialization (School Verticals)
        </div>
        <div style={{ padding: "20px" }}>
          <form onSubmit={handleSave}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "20px",
              }}
            >
              {/* Name Field */}
              <div>
                <label style={styles.label}>
                  Course Specialization Name:{" "}
                  <span style={{ color: "red" }}>*</span>
                </label>
                <input
                  type="text"
                  name="crs_domain_name"
                  value={formData.crs_domain_name}
                  onChange={handleInputChange}
                  style={styles.input}
                  placeholder="Enter Specialization Name"
                />
              </div>

              {/* Description Field */}
              <div>
                <label style={styles.label}>
                  Course Specialization Description:
                </label>
                <textarea
                  name="crs_domain_description"
                  value={formData.crs_domain_description}
                  onChange={handleInputChange}
                  style={{ ...styles.input, height: "38px", resize: "none" }} // Matching height to input roughly
                />
              </div>
            </div>

            <div style={{ marginTop: "20px", textAlign: "right" }}>
              <span
                style={{
                  marginRight: "15px",
                  color: message.includes("Error") ? "red" : "green",
                  fontWeight: "bold",
                }}
              >
                {message}
              </span>
              <button type="submit" style={styles.btnSave}>
                Save
              </button>
              <button
                type="button"
                style={styles.btnReset}
                onClick={handleReset}
              >
                Reset
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CourseSpecialization;

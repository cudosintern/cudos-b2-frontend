import React, { useState, useEffect } from "react";

// import { getAcademicBatches } from "../../../../../services/academicBatchService";
// import { getDeliveryMethods } from "../../../../../services/deliveryMethodService";

import {
  getMappedDeliveryMethods,
  saveCurriculumDeliveryMethod,
  deleteCurriculumDeliveryMethod
} from "./curriculumDeliveryService"; 

interface MasterMethod {
  delivery_mtd_id: number;
  delivery_mtd: string;
  description: string;
}

interface MappedMethod {
  crclm_dm_id: number;
  crclm_id: number;
  delivery_mtd_name: string;
  delivery_mtd_desc: string;
}

const CurriculumDeliveryMethod = () => {
  const [batches, setBatches] = useState<any[]>([]);
  const [masterMethods, setMasterMethods] = useState<MasterMethod[]>([]);
  const [mappedData, setMappedData] = useState<MappedMethod[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<number | "">("");
  
  const [formData, setFormData] = useState({
    crclm_dm_id: null as number | null,
    delivery_mtd_name: "",
    delivery_mtd_desc: ""
  });

  // Load Initial Data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      // const batchRes = await getAcademicBatches();
      // const masterRes = await getDeliveryMethods();
      // if (batchRes?.data) setBatches(batchRes.data);
      // if (masterRes?.data) setMasterMethods(masterRes.data);
    } catch (error) {
      console.error("Initialization Error:", error);
    }
  };

  // Load Mapped Methods when Curriculum changes
  useEffect(() => {
    if (selectedBatch) {
      fetchMappedMethods(Number(selectedBatch));
    } else {
      setMappedData([]);
    }
  }, [selectedBatch]);

  const fetchMappedMethods = async (id: number) => {
  try {
    // We cast the response to 'any' or a specific interface to satisfy TypeScript
    const res: any = await getMappedDeliveryMethods(id);
    if (res && res.data) { 
      setMappedData(res.data);
    }
  } catch (error) {
    console.error("Error fetching mappings:", error);
  }
};

  const handleMasterSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedName = e.target.value;
    const method = masterMethods.find(m => m.delivery_mtd === selectedName);
    setFormData({
      ...formData,
      delivery_mtd_name: selectedName,
      delivery_mtd_desc: method ? method.description : ""
    });
  };

  const handleSave = async () => {
    if (!selectedBatch || !formData.delivery_mtd_name) {
      alert("Please select a Curriculum and a Delivery Method");
      return;
    }

    try {
      const payload = {
        ...formData,
        crclm_id: Number(selectedBatch)
      };
      const res: any = await saveCurriculumDeliveryMethod(payload);
      if (res?.status) {
        alert("Saved Successfully");
        fetchMappedMethods(Number(selectedBatch));
        setFormData({ crclm_dm_id: null, delivery_mtd_name: "", delivery_mtd_desc: "" });
      }
    } catch (error) {
      alert("Error saving data");
    }
  };

  return (
    <div style={{ padding: "20px", background: "#f4f7f6" }}>
      {/* SELECTION CARD */}
      <div style={{ background: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
        <h2 style={{ fontSize: "18px", borderBottom: "1px solid #eee", paddingBottom: "10px" }}>Curriculum Settings</h2>
        
        <div style={{ marginTop: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
          <label>Curriculum: <span style={{ color: "red" }}>*</span></label>
          <select 
            value={selectedBatch} 
            onChange={(e) => setSelectedBatch(e.target.value ? Number(e.target.value) : "")}
            style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc", minWidth: "300px" }}
          >
            <option value="">-- Select Curriculum --</option>
            {batches.map(b => (
              <option key={b.academic_batch_id} value={b.academic_batch_id}>{b.academic_batch_name}</option>
            ))}
          </select>
        </div>

        {/* LIST TABLE (Matches Reference image_8c72e7) */}
        <div style={{ marginTop: "30px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
            <thead>
              <tr style={{ background: "#2c3e50", color: "white" }}>
                <th style={{ padding: "10px", textAlign: "left" }}>SL No.</th>
                <th style={{ padding: "10px", textAlign: "left" }}>Curriculum Delivery Method</th>
                <th style={{ padding: "10px", textAlign: "left" }}>Description</th>
                <th style={{ padding: "10px", textAlign: "center" }}>Edit</th>
                <th style={{ padding: "10px", textAlign: "center" }}>Delete</th>
              </tr>
            </thead>
            <tbody>
              {mappedData.map((row, idx) => (
                <tr key={row.crclm_dm_id} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "10px" }}>{idx + 1}</td>
                  <td style={{ padding: "10px" }}>{row.delivery_mtd_name}</td>
                  <td style={{ padding: "10px" }}>{row.delivery_mtd_desc}</td>
                  <td style={{ padding: "10px", textAlign: "center", cursor: "pointer" }}>✏️</td>
                  <td style={{ padding: "10px", textAlign: "center", cursor: "pointer", color: "red" }}>✖</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ADD FORM (Matches Reference image_8c72e7) */}
        <div style={{ marginTop: "40px", borderTop: "2px solid #2c3e50", paddingTop: "20px" }}>
          <h3 style={{ fontSize: "16px", background: "#2c3e50", color: "white", padding: "10px" }}>Add Delivery Method</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "20px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "5px" }}>Delivery Method Name: *</label>
              <select 
                value={formData.delivery_mtd_name}
                onChange={handleMasterSelect}
                style={{ width: "100%", padding: "8px" }}
              >
                <option value="">Select Bloom's Level</option>
                {masterMethods.map(m => (
                  <option key={m.delivery_mtd_id} value={m.delivery_mtd}>{m.delivery_mtd}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "5px" }}>Description:</label>
              <textarea 
                value={formData.delivery_mtd_desc}
                readOnly
                style={{ width: "100%", padding: "8px", background: "#f9f9f9" }}
              />
            </div>
          </div>
          <div style={{ marginTop: "20px", textAlign: "right" }}>
            <button 
              onClick={handleSave}
              style={{ padding: "10px 30px", background: "#007bff", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurriculumDeliveryMethod;
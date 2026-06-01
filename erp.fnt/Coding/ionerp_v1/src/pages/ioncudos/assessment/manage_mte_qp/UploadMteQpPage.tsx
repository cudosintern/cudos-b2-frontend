import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { manageMteService } from "./manageMteService";
import { FaCloudUploadAlt } from "react-icons/fa";

const UploadMteQpPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { row, filters } = location.state || {};

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (!file.name.match(/\.(xls|xlsx)$/i)) {
        toast.error("Invalid file format. Please upload only .xls or .xlsx files.");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file first");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);
    
    // Add identifiers needed by backend
    if (row?.qpd_id) formData.append("qp_id", String(row.qpd_id));
    else if (row?.ao_id) formData.append("qp_id", String(row.ao_id));
    // Based on MTE API params
    if (row?.ao_id) formData.append("ao_id", String(row.ao_id));

    try {
      const res = await manageMteService.uploadMteQp(formData);
      if (res.status === 1) {
        toast.success(res.message || "Question Paper uploaded successfully");
        setTimeout(() => {
          navigate("/assessment/manage_mte_qp", { state: location.state });
        }, 1000);
      } else {
        toast.error(res.message || "Upload failed");
      }
    } catch (err: any) {
      toast.error("An error occurred during upload. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    navigate("/assessment/manage_mte_qp", { state: location.state });
  };

  return (
    <div className="p-6 bg-[#f4f7f9] min-h-screen">
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 max-w-7xl mx-auto">
        
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl leading-6 font-medium text-gray-900 border-b pb-3 w-full">
            Import MTE Question Paper
          </h3>
        </div>

        {/* Top Header details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 text-sm bg-gray-50 p-4 rounded-md border border-gray-200">
          <div>
            <span className="font-semibold text-gray-700">Curriculum: </span>
            <span className="text-gray-600">{filters?.curriculum_name || "N/A"}</span>
          </div>
          <div>
            <span className="font-semibold text-gray-700">Term: </span>
            <span className="text-gray-600">{filters?.term_name || "N/A"}</span>
          </div>
          <div>
            <span className="font-semibold text-gray-700">Course: </span>
            <span className="text-gray-600">{row?.qpd_title || "N/A"}</span>
          </div>
        </div>

        {/* Instructions Container */}
        <div className="border border-blue-200 bg-blue-50/40 p-5 rounded-lg mb-8 shadow-sm">
          <h4 className="text-lg font-medium text-gray-800 mb-4 border-b border-gray-200 pb-2">
            Steps :
          </h4>

          <ol className="list-decimal pl-5 space-y-3 text-sm text-gray-700">

            {/* ✅ UPDATED DOWNLOAD LINK */}
            <li>
              Click Here to{" "}
              <a
                href="/MTE_Question_Paper_Template.xls"
                download
                className="text-blue-600 font-semibold hover:underline"
              >
                Download Question Paper Template
              </a>{" "}
              (File name: MTE_Question_Paper_Template.xls)
            </li>

            <li>
              <span className="block mb-1 font-medium">
                Enter the Course Code, Exam Type(TEE, MTE), Questions and Corresponding Mapping to COs, Bloom Level and Topic(optional) and Click on "Choose File" button to upload the .xls file. Make sure that the Course Code and Exam Type are entered properly.
              </span>
              
              <span className="text-red-500 font-medium italic mt-2 block">
                (Note: Discard previous downloaded file before downloading new file)
              </span>
            </li>

            <li>
              Click on "Upload" button to upload the Questions Paper.
            </li>

          </ol>
        </div>

        {/* Upload Form Box */}
        <div className="border border-gray-200 p-6 rounded-lg bg-white shadow-sm flex flex-col gap-6 w-full max-w-3xl">
          
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <label className="text-[13px] font-semibold text-[#5c6773] w-32 shrink-0">
              Question Paper :
            </label>

            <div className="flex-1 flex gap-3 items-center w-full relative">
              <input
                type="file"
                id="qp-upload"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="flex w-full items-center">
                <div className="flex-1 text-sm border border-gray-300 rounded-l-md px-3 py-2 bg-gray-50 truncate overflow-hidden min-h-[38px] text-gray-500">
                  {selectedFile ? selectedFile.name : "No file chosen"}
                </div>

                <label 
                  htmlFor="qp-upload" 
                  className="cursor-pointer bg-gray-100 hover:bg-gray-200 border border-l-0 border-gray-300 rounded-r-md px-4 py-[9px] text-sm font-medium text-gray-700 transition"
                >
                  Choose File
                </label>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            
            <button
              type="button"
              onClick={handleClose}
              disabled={uploading}
              className={`px-5 py-2 text-sm font-medium border border-transparent shadow-sm text-white bg-red-500 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${
                uploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-600'
              }`}
            >
              Close
            </button>

            <button
              type="button"
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className={`px-5 py-2 text-sm font-medium shadow-sm text-white bg-blue-600 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center gap-2 ${
                !selectedFile || uploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
              }`}
            >
              {uploading && (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              )}
              {uploading ? 'Processing...' : 'Upload'}
            </button>

          </div>
        </div>

      </div>
    </div>
  );
};

export default UploadMteQpPage;
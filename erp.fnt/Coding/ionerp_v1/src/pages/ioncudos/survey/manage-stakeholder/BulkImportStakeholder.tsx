import React, { useRef, useState } from "react";
import { FaUpload, FaCheck, FaTimes, FaQuestionCircle } from "react-icons/fa";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import axiosInstance from "../../../../utils/api";
import { ApiEndpoint } from "../../../../utils/ApiEndpoint/emsapiEndpoint";

interface Props {
  onCancel: () => void;
  selectedFilters: {
    group_id: string;
    dept_id: string;
    pgm_id: string;
    academic_batch_id: string;
  };
  onSuccess: () => void;
}

const EXPECTED_FILE_NAME = "stakeholders_template.xls";

const BulkImportStakeholder: React.FC<Props> = ({ onCancel, selectedFilters, onSuccess }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const handleDownloadTemplate = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Student Stakeholders Template");

    worksheet.columns = [
      { header: "Title", key: "title", width: 15, style: { font: { name: 'Calibri' } } },
      { header: "FirstName", key: "firstName", width: 25, style: { font: { name: 'Calibri' } } },
      { header: "LastName", key: "lastName", width: 25, style: { font: { name: 'Calibri' } } },
      { header: "Email", key: "email", width: 30, style: { font: { name: 'Calibri' } } },
      { header: "Contact", key: "contact", width: 20, style: { font: { name: 'Calibri' } } },
    ];

    worksheet.getRow(1).font = { name: 'Calibri', bold: true };

    for (let i = 2; i <= 500; i++) {
      const cell = worksheet.getCell(`A${i}`);
      cell.dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['"Mr.,Mrs.,Ms.,Miss.,Dr.,Prof."'],
        showErrorMessage: true,
        errorTitle: 'Invalid Title',
        error: 'Please pick a value from the drop-down list.',
      };
      if (i <= 101) {
        cell.value = 'Mr.';
      }
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.ms-excel" });
    saveAs(blob, EXPECTED_FILE_NAME);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name !== EXPECTED_FILE_NAME) {
      toast.error(`Invalid file name. Please upload exactly "${EXPECTED_FILE_NAME}".`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setSelectedFile(null);
      setPreviewData([]);
      return;
    }

    setSelectedFile(file);
    setIsValidating(true);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        
        const rawData = XLSX.utils.sheet_to_json(ws);
        const nameRegex = /^[a-zA-Z\s]+$/;
        const contactRegex = /^\d{10}$/;
        
        // 1. Filter valid rows and extract emails
        const validRows = rawData.filter((row: any) => {
          return row.FirstName && String(row.FirstName).trim() !== "" && row.Email && String(row.Email).trim() !== "";
        });

        const emailsToCheck = validRows.map((r: any) => String(r.Email).trim());
        let existingEmails: string[] = [];

        // 2. Call backend to see which emails already exist in this Group+Batch
        if (emailsToCheck.length > 0) {
          try {
            const res = await axiosInstance.post<any>(
              `${ApiEndpoint.survey.stakeholder.base}/check-duplicates`,
              {
                stakeholder_group_id: Number(selectedFilters.group_id),
                academic_batch_id: Number(selectedFilters.academic_batch_id),
                emails: emailsToCheck
              }
            );
            if (res.data?.status && res.data.data) {
              existingEmails = res.data.data;
            }
          } catch (err) {
            console.error("Failed to check duplicate emails", err);
          }
        }

        const processedData: any[] = [];
        const seenEmailsInFile = new Set<string>();

        validRows.forEach((row: any) => {
          const hasFirstName = row.FirstName && String(row.FirstName).trim() !== "";
          const hasLastName = row.LastName && String(row.LastName).trim() !== "";
          const hasEmail = row.Email && String(row.Email).trim() !== "";
          const hasContact = row.Contact && String(row.Contact).trim() !== "";
          const emailStr = hasEmail ? String(row.Email).trim() : "";

          let remarks: string[] = [];

          if (!hasFirstName) remarks.push("Cannot be blank First Name ;");
          if (!hasEmail) remarks.push("Cannot be blank Email Id ;");

          if (hasFirstName && !nameRegex.test(String(row.FirstName).trim())) {
            remarks.push("Invalid First Name (only letters allowed) ;");
          }
          if (hasLastName && !nameRegex.test(String(row.LastName).trim())) {
            remarks.push("Invalid Last Name (only letters allowed) ;");
          }
          if (hasContact && !contactRegex.test(String(row.Contact).trim())) {
            remarks.push("Contact Number must be exactly 10 digits ;");
          }

          // Duplicate Checks
          if (emailStr) {
            // Check if it exists in DB
            if (existingEmails.includes(emailStr)) {
              remarks.push("Email Id already exists within the stakeholder type ;");
            } 
            // Check if it's duplicated within the Excel file itself
            else if (seenEmailsInFile.has(emailStr)) {
              remarks.push("Duplicate Email Id found in the uploaded file ;");
            }
            seenEmailsInFile.add(emailStr);
          }

          processedData.push({
            Title: row.Title || "",
            FirstName: row.FirstName || "",
            LastName: row.LastName || "",
            Email: emailStr,
            Contact: row.Contact || "",
            Remarks: remarks.join(" ")
          });
        });

        if (processedData.length === 0) {
            toast.warning("No data found. Please ensure you have added valid stakeholder details.");
        } else {
            const hasRemarks = processedData.some(r => r.Remarks.length > 0);
            if (hasRemarks) {
              toast.warning("Remarks exists please check it and re-upload file");
            } else {
              toast.success("File Imported successfully. Please check the data and click Accept.");
            }
        }
        
        setPreviewData(processedData);

      } catch (error) {
        toast.error("Failed to read the Excel file.");
      } finally {
        setIsValidating(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsBinaryString(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleAcceptImport = async () => {
    if (previewData.length === 0) return;

    const hasRemarks = previewData.some(row => row.Remarks && row.Remarks.length > 0);
    if (hasRemarks) {
        toast.warning("Remarks exists please check it and re-upload file");
        return;
    }

    setIsSaving(true);

    try {
      const payload = previewData.map((row) => ({
        stakeholder_group_id: Number(selectedFilters.group_id),
        dept_id: Number(selectedFilters.dept_id),
        pgm_id: Number(selectedFilters.pgm_id),
        academic_batch_id: Number(selectedFilters.academic_batch_id),
        first_name: String(row.FirstName).trim(),
        last_name: String(row.LastName).trim(),
        email: String(row.Email).trim(),
        contact: row.Contact ? Number(String(row.Contact).trim()) : null,
      }));

      const response = await axiosInstance.post<any>(
        `${ApiEndpoint.survey.stakeholder.base}/bulk-save`,
        payload
      );

      if (response.data?.status) {
        toast.success(response.data.message || "Bulk import successful");
        onSuccess(); 
      } else {
        toast.error(response.data?.message || "Failed to import stakeholders");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "An error occurred during bulk import");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-md border border-gray-300 shadow-sm animate-fade-in">
      <div className="bg-[#1f3b4d] text-white px-4 py-2.5 rounded-t-md flex justify-between items-center">
        <h2 className="text-sm font-semibold">Stakeholder Import</h2>
        <FaQuestionCircle className="text-[#5bc0de] cursor-pointer hover:text-white transition-colors" size={16} />
      </div>

      <div className="p-4 border-b border-gray-200 bg-gray-50/50">
        <h3 className="font-bold text-gray-800 text-sm mb-2">Steps:</h3>
        <ol className="text-sm text-gray-700 space-y-3 bg-white border border-gray-200 rounded p-4 shadow-sm">
          <li>
            1) Click here to <a href="#" onClick={handleDownloadTemplate} className="text-[#0066cc] hover:underline font-semibold">Download Template</a>
          </li>
          <li className="leading-relaxed">
            2) Select <span className="font-bold text-[#8a1f11]">Stakeholder type, School, Program, Curriculum</span> and Click on <span className="font-bold text-[#8a1f11]">"Upload"</span> button to upload the .xls file. Make sure that the <span className="font-bold text-[#8a1f11]">file name</span> and <span className="font-bold text-[#8a1f11]">file headers</span> are not altered.
            <br />
            <span className="text-gray-500 ml-4">(Note: <span className="font-bold text-[#8a1f11]">Discard previously downloaded .xls file</span> before downloading new .xls file)</span>
          </li>
          <li>
            3) Title, First Name, Email fields are mandatory and cannot be left blank.
          </li>
          <li>
            4) Upon upload, the table with all the stakeholder details are shown below along with remarks. Make sure that all the remarks are resolved and reupload same .xls file.
          </li>
          <li>
            5) Click on <span className="font-bold text-[#8a1f11]">"Accept"</span> button to save the stakeholder details permanently. Click on <span className="font-bold text-[#8a1f11]">"Cancel"</span> to discard the uploaded data.
          </li>
          <li>
            6) Click on <span className="font-bold text-[#8a1f11]">"Cancel"</span> button to return back to list page.
          </li>
        </ol>
      </div>

      {selectedFile && previewData.length === 0 && !isValidating && (
        <div className="p-8 text-center text-gray-500 bg-white">
          <p className="font-semibold text-lg mb-1">No data found</p>
        </div>
      )}

      {isValidating && (
         <div className="p-8 text-center text-gray-500 bg-white">
           <p className="font-semibold text-sm">Validating file...</p>
         </div>
      )}

      {previewData.length > 0 && !isValidating && (
        <div className="p-4 max-h-[400px] overflow-auto bg-white">
          <table className="w-full text-sm text-left border-collapse border border-gray-200">
            <thead className="bg-gray-100 text-gray-700 sticky top-0">
              <tr>
                <th className="border border-gray-200 px-3 py-2 bg-gray-100 whitespace-nowrap">Sl.No</th>
                <th className="border border-gray-200 px-3 py-2 bg-gray-100">Remarks</th>
                <th className="border border-gray-200 px-3 py-2 bg-gray-100">Title</th>
                <th className="border border-gray-200 px-3 py-2 bg-gray-100 whitespace-nowrap">First Name</th>
                <th className="border border-gray-200 px-3 py-2 bg-gray-100 whitespace-nowrap">Last Name</th>
                <th className="border border-gray-200 px-3 py-2 bg-gray-100">Email</th>
                <th className="border border-gray-200 px-3 py-2 bg-gray-100 whitespace-nowrap">Contact Number</th>
              </tr>
            </thead>
            <tbody>
              {previewData.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-gray-50">
                  <td className="border border-gray-200 px-3 py-2 text-center">{rowIndex + 1}</td>
                  <td className={`border border-gray-200 px-3 py-2 text-xs font-medium min-w-[200px] ${row.Remarks ? 'text-red-600' : 'text-green-600'}`}>
                    {row.Remarks || "No Remarks"}
                  </td>
                  <td className="border border-gray-200 px-3 py-2">{row.Title}</td>
                  <td className="border border-gray-200 px-3 py-2">{row.FirstName}</td>
                  <td className="border border-gray-200 px-3 py-2">{row.LastName}</td>
                  <td className="border border-gray-200 px-3 py-2">{row.Email}</td>
                  <td className="border border-gray-200 px-3 py-2">{row.Contact}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <input 
        type="file" 
        accept=".xls,.xlsx" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        className="hidden" 
      />

      <div className="bg-gray-100 p-3 rounded-b-md flex justify-end gap-2 border-t border-gray-300">
        <button 
          onClick={triggerFileInput}
          disabled={isSaving || isValidating}
          className="flex items-center gap-2 bg-[#5cb85c] hover:bg-[#4cae4c] text-white px-3 py-1.5 rounded text-sm font-medium transition-colors disabled:opacity-50"
        >
          <FaUpload /> Upload .xls
        </button>
        <button 
          onClick={handleAcceptImport}
          disabled={previewData.length === 0 || isSaving || isValidating}
          className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors ${(previewData.length > 0 && !isSaving && !isValidating) ? "bg-[#5cb85c] hover:bg-[#4cae4c] text-white" : "bg-gray-300 text-gray-500 cursor-not-allowed"}`}
        >
          <FaCheck /> {isSaving ? "Saving..." : "Accept .xls"}
        </button>
        <button 
          onClick={onCancel}
          disabled={isSaving || isValidating}
          className="flex items-center gap-2 bg-[#d9534f] hover:bg-[#c9302c] text-white px-3 py-1.5 rounded text-sm font-medium transition-colors disabled:opacity-50"
        >
          <FaTimes /> Cancel
        </button>
      </div>
    </div>
  );
};

export default BulkImportStakeholder;
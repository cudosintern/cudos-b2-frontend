import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export const downloadResearchPublicationTemplate = async (dropdowns: any) => {
  const workbook = new ExcelJS.Workbook();

  const sheet = workbook.addWorksheet("ResearchPublication");

  const headers = [
    "Type",
    "Title of Paper",
    "Publication/Journal Title",
    "Indexing Scopus/SCI/Peer Reviewed",
    "Status",
    "Level/Status",
    "Publication Year",
    "Publisher",

    "Author(s)",
    "Page No.",
    "Scimago h-Index",
    "i10-Index Author",
    "Scopus SNIP",
    "DOI",
    "ISSN / ISBN",
    "Published URL",
    "Index Terms",
    "Volume No.",
    "Issue No.",
    "Scopus SJR Index",
    "Impact Factor",
    "Conference Name",
    "Event Organizer",
  ];

  sheet.addRow(headers);

  sheet.addRow([
    dropdowns.types?.[0]?.mt_details_name || "",
    "",
    "",
    "",
    dropdowns.status?.[0]?.mt_details_name || "",
    dropdowns.levels?.[0]?.mt_details_name || "",
    "", // yyyy-mm
    "",

    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
  ]);

  sheet.columns = headers.map(() => ({
    width: 35,
  }));

  const typeList = dropdowns.types.map((x: any) => x.mt_details_name).join(",");

  const statusList = dropdowns.status
    .map((x: any) => x.mt_details_name)
    .join(",");

  const levelList = dropdowns.levels
    .map((x: any) => x.mt_details_name)
    .join(",");

  for (let i = 2; i <= 500; i++) {
    // TYPE
    sheet.getCell(`A${i}`).dataValidation = {
      type: "list",
      allowBlank: false,
      formulae: [`"${typeList}"`],
    };

    // STATUS
    sheet.getCell(`E${i}`).dataValidation = {
      type: "list",
      allowBlank: false,
      formulae: [`"${statusList}"`],
    };

    // LEVEL
    sheet.getCell(`F${i}`).dataValidation = {
      type: "list",
      allowBlank: false,
      formulae: [`"${levelList}"`],
    };
  }

  // ================= HEADER STYLES =================

  const mandatoryHeaders = [
    "Type",
    "Title of Paper",
    "Publication/Journal Title",
    "Indexing Scopus/SCI/Peer Reviewed",
    "Status",
    "Level/Status",
    "Publication Year",
    "Publisher",
  ];

  sheet.getRow(1).eachCell((cell, colNumber) => {
    const headerText = headers[colNumber - 1];

    // ✅ ALL HEADERS GRAY BACKGROUND
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "D9D9D9" },
    };

    // ✅ FONT
    cell.font = {
      bold: true,

      // mandatory headers = maroon text
      color: mandatoryHeaders.includes(headerText)
        ? { argb: "800000" } // maroon
        : { argb: "000000" }, // black
    };

    // ✅ ALIGNMENT
    cell.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };

    // ✅ BORDER
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });

  const buffer = await workbook.xlsx.writeBuffer();

  saveAs(new Blob([buffer]), "research_publication.xlsx");
};

export const validateResearchPublicationExcel = (
  rows: any[],
  dropdowns: any,
) => {
  const validTypes = dropdowns.types.map((x: any) => x.mt_details_name);

  const validStatus = dropdowns.status.map((x: any) => x.mt_details_name);

  const validLevels = dropdowns.levels.map((x: any) => x.mt_details_name);

  const validatedRows: any[] = [];

  rows.forEach((row, index) => {
    let remarks: string[] = [];

    const yearRegex = /^\d{4}-(0[1-9]|1[0-2])$/;

    // ================= REQUIRED =================

    if (!String(row["Type"] || "").trim()) {
      remarks.push("Type required");
    }

    if (!String(row["Title of Paper"] || "").trim()) {
      remarks.push("Title required");
    }

    if (!String(row["Publication/Journal Title"] || "").trim()) {
      remarks.push("Publication Title required");
    }

    if (!String(row["Indexing Scopus/SCI/Peer Reviewed"] || "").trim()) {
      remarks.push("Scopus required");
    }

    if (!String(row["Status"] || "").trim()) {
      remarks.push("Status required");
    }

    if (!String(row["Level/Status"] || "").trim()) {
      remarks.push("Level required");
    }

    if (!String(row["Publication Year"] || "").trim()) {
      remarks.push("Publication Year required");
    }

    if (
      row["Publication Year"] &&
      !yearRegex.test(String(row["Publication Year"]).trim())
    ) {
      remarks.push("Publication Year should be in yyyy-mm format");
    }

    if (!String(row["Publisher"] || "").trim()) {
      remarks.push("Publisher required");
    }

    // ================= DROPDOWN VALIDATION =================

    if (row["Type"] && !validTypes.includes(String(row["Type"]).trim())) {
      remarks.push("Invalid Type");
    }

    if (row["Status"] && !validStatus.includes(String(row["Status"]).trim())) {
      remarks.push("Invalid Status");
    }

    if (
      row["Level/Status"] &&
      !validLevels.includes(String(row["Level/Status"]).trim())
    ) {
      remarks.push("Invalid Level");
    }

    // ================= H-INDEX =================

    if (
      row["Scimago h-Index"] &&
      !/^\d+$/.test(String(row["Scimago h-Index"]))
    ) {
      remarks.push("Invalid h-Index");
    }

    // ================= i10 INDEX =================

    if (
      row["i10-Index Author"] &&
      !/^\d+$/.test(String(row["i10-Index Author"]))
    ) {
      remarks.push("Invalid i10-Index");
    }

    // ================= DOI =================

    if (row["DOI"] && String(row["DOI"]).length > 100) {
      remarks.push("DOI too long");
    }

    // ================= PUSH ROW =================

    validatedRows.push({
      "Sl No.": index + 1,

      Remarks: remarks.join(", "),

      Type: row["Type"] || "",

      "Title of Paper": row["Title of Paper"] || "",

      "Publication/Journal Title": row["Publication/Journal Title"] || "",

      "Indexing Scopus/SCI/Peer Reviewed":
        row["Indexing Scopus/SCI/Peer Reviewed"] || "",

      Status: row["Status"] || "",

      "Level/Status": row["Level/Status"] || "",

      "Publication Year": row["Publication Year"] || "",

      Publisher: row["Publisher"] || "",
    });
  });

  return validatedRows;
};

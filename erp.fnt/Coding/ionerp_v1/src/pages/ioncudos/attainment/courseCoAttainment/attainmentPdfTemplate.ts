import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type RgbColor = [number, number, number];

export interface AttainmentPdfMetadataItem {
  label: string;
  value: string;
}

export interface AttainmentPdfChartPoint {
  label: string;
  value: number;
  secondaryValue?: number;
}

export interface AttainmentPdfChartThreshold {
  label: string;
  value: number;
  color?: RgbColor;
}

export interface AttainmentPdfTableSection {
  title: string;
  headers: string[];
  rows: string[][];
  summary?: Array<[string, string]>;
  fontSize?: number;
}

export interface AttainmentPdfMessageSection {
  title: string;
  lines: string[];
  tone?: "info" | "success" | "warning" | "danger";
}

interface AttainmentPdfBuilderOptions {
  moduleTitle: string;
  reportTitle: string;
  metadata: AttainmentPdfMetadataItem[];
}

const BRAND = {
  black: [0, 0, 0] as RgbColor,
  darkGray: [70, 70, 70] as RgbColor,
  midGray: [140, 140, 140] as RgbColor,
  lightGray: [235, 235, 235] as RgbColor,
  paperGrid: [224, 224, 224] as RgbColor,
  teal: [66, 184, 200] as RgbColor,
  bloomGreen: [57, 239, 99] as RgbColor,
  greenLine: [100, 214, 119] as RgbColor,
  yellowLine: [239, 232, 90] as RgbColor,
  blueLine: [120, 166, 245] as RgbColor,
  border: [120, 120, 120] as RgbColor,
  text: [20, 20, 20] as RgbColor,
  muted: [85, 85, 85] as RgbColor,
  warning: [20, 20, 20] as RgbColor,
  danger: [20, 20, 20] as RgbColor,
};

const PAGE = {
  left: 14,
  right: 14,
  top: 47,
  bottom: 18,
};

const ORGANISATION_NAME = "IonIdea Institute of Technology and Management, Bangalore";
const FOOTER_TEXT_TOP = "Powered by";
const FOOTER_TEXT_BOTTOM = "www.ioncudos.com";

const drawDummyLogo = (doc: jsPDF, x: number, y: number) => {
  doc.setDrawColor(...BRAND.black);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(x, y, 23, 21, 1.2, 1.2, "S");
  doc.setLineDashPattern([1, 1], 0);
  doc.roundedRect(x + 0.8, y + 0.8, 21.4, 19.4, 1, 1, "S");
  doc.setLineDashPattern([], 0);
  doc.setTextColor(...BRAND.black);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("YOUR", x + 11.5, y + 5.8, { align: "center" });
  doc.setTextColor(...BRAND.greenLine);
  doc.setFontSize(10.5);
  doc.text("LOGO", x + 11.5, y + 11.2, { align: "center" });
  doc.setTextColor(...BRAND.black);
  doc.setFontSize(8);
  doc.text("HERE", x + 11.5, y + 16.4, { align: "center" });
};

const drawPageChrome = (doc: jsPDF, options: AttainmentPdfBuilderOptions, pageNumber: number, pageCount: number) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  drawDummyLogo(doc, PAGE.left + 1, 10);

  doc.setTextColor(...BRAND.text);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.text(ORGANISATION_NAME, pageWidth / 2 + 8, 16.5, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(ORGANISATION_NAME, pageWidth / 2 + 8, 21.8, { align: "center" });
  doc.setDrawColor(...BRAND.midGray);
  doc.line(PAGE.left, 31.5, pageWidth - PAGE.right, 31.5);

  doc.setDrawColor(...BRAND.border);
  doc.line(PAGE.left, pageHeight - 12, pageWidth - PAGE.right, pageHeight - 12);
  doc.setTextColor(...BRAND.black);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.8);
  doc.text(FOOTER_TEXT_TOP, pageWidth / 2, pageHeight - 7.8, { align: "center" });
  doc.text(FOOTER_TEXT_BOTTOM, pageWidth / 2, pageHeight - 3.9, { align: "center" });
  doc.text(`Page ${pageNumber} of ${pageCount}`, pageWidth - PAGE.right, pageHeight - 7.2, { align: "right" });
};

const normaliseRows = (headers: string[], rows: string[][]) => {
  if (!rows.length) {
    return [headers.map((_, index) => (index === 0 ? "No data available." : ""))];
  }

  return rows.map((row) =>
    headers.map((_, index) => {
      const value = row[index] ?? "";
      return String(value);
    })
  );
};

const renderEmbedFallback = (targetWindow: Window, pdfUrl: string, filename: string) => {
  targetWindow.document.open();
  targetWindow.document.write(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${filename}</title>
  </head>
  <body style="margin:0;background:#f5f5f5;">
    <embed src="${pdfUrl}" type="application/pdf" width="100%" height="100%" style="height:100vh;" />
  </body>
</html>`);
  targetWindow.document.close();
};

export const openPdfPreview = (blob: Blob, filename: string, previewWindow?: Window | null) => {
  const targetWindow = previewWindow ?? window.open("", "_blank");
  if (!targetWindow) {
    throw new Error("PDF preview was blocked by the browser.");
  }

  const pdfBlob = blob.type === "application/pdf" ? blob : new Blob([blob], { type: "application/pdf" });
  if (!pdfBlob.size) {
    throw new Error("Generated PDF is empty");
  }

  const blobUrl = URL.createObjectURL(pdfBlob);

  try {
    targetWindow.location.replace(blobUrl);
    targetWindow.setTimeout(() => {
      if (targetWindow.location.href === "about:blank") {
        renderEmbedFallback(targetWindow, blobUrl, filename);
      }
    }, 1200);
  } catch (error) {
    try {
      renderEmbedFallback(targetWindow, blobUrl, filename);
    } catch (fallbackError) {
      URL.revokeObjectURL(blobUrl);
      throw fallbackError instanceof Error ? fallbackError : error;
    }
  }

  targetWindow.setTimeout(() => {
    URL.revokeObjectURL(blobUrl);
  }, 300000);
};

export const createAttainmentPdfBuilder = (options: AttainmentPdfBuilderOptions) => {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  let currentY = PAGE.top;

  const pageWidth = () => doc.internal.pageSize.getWidth();
  const pageHeight = () => doc.internal.pageSize.getHeight();
  const contentWidth = () => pageWidth() - PAGE.left - PAGE.right;
  const tableMargin = {
    top: PAGE.top,
    left: PAGE.left,
    right: PAGE.right,
    bottom: PAGE.bottom,
  };

  const ensureSpace = (requiredHeight: number) => {
    if (currentY + requiredHeight <= pageHeight() - PAGE.bottom) {
      return;
    }
    doc.addPage();
    currentY = PAGE.top;
  };

  const addMetadata = () => {
    const rows: string[][] = [];
    for (let index = 0; index < options.metadata.length; index += 2) {
      const left = options.metadata[index];
      const right = options.metadata[index + 1];
      rows.push([
        left?.label || "",
        left?.value || "-",
        right?.label || "",
        right?.value || (right ? "-" : ""),
      ]);
    }

    autoTable(doc, {
      startY: currentY,
      margin: tableMargin,
      theme: "grid",
      body: rows,
      styles: {
        fontSize: 8.5,
        cellPadding: 1.6,
        textColor: BRAND.text,
        lineColor: BRAND.border,
        lineWidth: 0.2,
      },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 26 },
        1: { cellWidth: 70 },
        2: { fontStyle: "bold", cellWidth: 24 },
        3: { cellWidth: 64 },
      },
    });
    currentY = (((doc as jsPDF & { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? currentY) + 10);
  };

  const addMessageSection = ({ title, lines, tone = "info" }: AttainmentPdfMessageSection) => {
    if (!lines.length) {
      return;
    }

    ensureSpace(24);
    doc.setTextColor(...BRAND.black);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.text(title, PAGE.left, currentY);

    autoTable(doc, {
      startY: currentY + 4,
      margin: tableMargin,
      theme: "grid",
      head: [["Message"]],
      body: lines.map((line) => [line]),
      styles: {
        fontSize: 8.6,
        cellPadding: 1.8,
        textColor: BRAND.text,
        lineColor: BRAND.border,
        lineWidth: 0.2,
      },
      headStyles: { fillColor: [255, 255, 255], textColor: BRAND.black, fontStyle: "bold" },
    });
    currentY = (((doc as jsPDF & { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? currentY) + 7);
  };

  const addChartSection = (
    title: string,
    points: AttainmentPdfChartPoint[],
    thresholds: AttainmentPdfChartThreshold[] = [],
    legendLabel = "Threshold Direct Attainment %",
    secondaryLegendLabel?: string
  ) => {
    if (!points.length) {
      return;
    }

    ensureSpace(86);

    doc.setTextColor(...BRAND.black);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11.5);
    doc.text(title, PAGE.left + 4, currentY);

    const chartTop = currentY + 5;
    const chartHeight = 44;
    const chartBottom = chartTop + chartHeight;
    const chartLeft = PAGE.left + 9;
    const chartRight = Math.min(PAGE.left + 92, pageWidth() - PAGE.right - 22);
    const barAreaWidth = chartRight - chartLeft;
    const stepWidth = barAreaWidth / Math.max(points.length, 1);

    doc.setDrawColor(...BRAND.border);
    doc.rect(chartLeft, chartTop, chartRight - chartLeft, chartHeight);

    doc.setDrawColor(...BRAND.paperGrid);
    [0, 25, 50, 75, 100].forEach((axis) => {
      const y = chartBottom - (axis / 100) * chartHeight;
      doc.line(chartLeft, y, chartRight, y);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(5.8);
      doc.setTextColor(...BRAND.muted);
      doc.text(`${axis.toFixed(2)}${axis === 100 ? "%" : "%"}`, chartLeft - 8, y + 1.3);
    });

    thresholds.forEach((threshold) => {
      const clampedValue = Math.max(0, Math.min(100, threshold.value));
      const y = chartBottom - (clampedValue / 100) * chartHeight;
      doc.setDrawColor(...(threshold.color || BRAND.greenLine));
      doc.line(chartLeft, y, chartRight, y);
    });

    points.forEach((point, index) => {
      const value = Math.max(0, Math.min(100, point.value));
      const hasSecondarySeries = typeof point.secondaryValue === "number";
      const primaryOffset = hasSecondarySeries ? 0.28 : 0.38;
      const x = chartLeft + index * stepWidth + stepWidth * primaryOffset;
      const width = Math.max(3, stepWidth * (hasSecondarySeries ? 0.12 : 0.14));
      const barHeight = (value / 100) * chartHeight;
      const y = chartBottom - barHeight;

      doc.setFillColor(...BRAND.teal);
      doc.rect(x, y, width, barHeight, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(5.6);
      doc.setTextColor(...BRAND.text);
      doc.text(value.toFixed(2), x + width / 2, y - 1.6, { align: "center" });

      const labelLines = doc.splitTextToSize(point.label, Math.max(12, stepWidth * 0.8));
      doc.setFont("helvetica", "normal");
      doc.setFontSize(5.8);
      doc.text(labelLines, x + width / 2, chartBottom + 4.5, { align: "center" });

      if (hasSecondarySeries) {
        const secondaryValue = Math.max(0, Math.min(100, Number(point.secondaryValue)));
        const secondaryX = x + width + stepWidth * 0.08;
        const secondaryBarHeight = (secondaryValue / 100) * chartHeight;
        const secondaryY = chartBottom - secondaryBarHeight;

        doc.setFillColor(...BRAND.bloomGreen);
        doc.rect(secondaryX, secondaryY, width, secondaryBarHeight, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(5.6);
        doc.setTextColor(...BRAND.text);
        doc.text(secondaryValue.toFixed(2), secondaryX + width / 2, secondaryY - 1.6, { align: "center" });
      }
    });

    const legendY = chartBottom + 11;
    doc.setFillColor(...BRAND.teal);
    doc.rect(pageWidth() / 2 - 20, legendY - 2.8, 3.4, 3.4, "F");
    doc.setTextColor(...BRAND.muted);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.4);
    doc.text(legendLabel, pageWidth() / 2 - 15, legendY - 0.1);

    if (secondaryLegendLabel) {
      doc.setFillColor(...BRAND.bloomGreen);
      doc.rect(pageWidth() / 2 + 14, legendY - 2.8, 3.4, 3.4, "F");
      doc.text(secondaryLegendLabel, pageWidth() / 2 + 19, legendY - 0.1);
    }

    let thresholdLegendX = PAGE.left;
    if (thresholds.length) {
      thresholdLegendX = PAGE.left + 4;
      thresholds.forEach((threshold) => {
        doc.setFillColor(...(threshold.color || BRAND.greenLine));
        doc.rect(thresholdLegendX, chartBottom + 17, 3.4, 3.4, "F");
        doc.setFontSize(5.4);
        doc.text(
          `${threshold.label} (${Math.max(0, Math.min(100, threshold.value)).toFixed(2)}%)`,
          thresholdLegendX + 6,
          chartBottom + 19.8
        );
        thresholdLegendX += 42;
      });
    }

    currentY = chartBottom + (thresholds.length ? 25 : 15) + (secondaryLegendLabel ? 3 : 0);
  };

  const addTableSection = ({ title, headers, rows, summary, fontSize = 8.5 }: AttainmentPdfTableSection) => {
    ensureSpace(26);

    doc.setTextColor(...BRAND.black);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11.2);
    doc.text(title, PAGE.left, currentY);

    autoTable(doc, {
      startY: currentY + 4,
      margin: tableMargin,
      theme: "grid",
      head: [headers],
      body: normaliseRows(headers, rows),
      styles: {
        fontSize,
        cellPadding: 1.7,
        textColor: BRAND.text,
        lineColor: BRAND.border,
        lineWidth: 0.2,
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: BRAND.black,
        fontStyle: "bold",
      },
    });
    currentY = (((doc as jsPDF & { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? currentY) + 5);

    if (summary?.length) {
      autoTable(doc, {
        startY: currentY,
        margin: tableMargin,
        theme: "grid",
        body: summary.map(([label, value]) => [label, value]),
        styles: {
          fontSize: 8.6,
          cellPadding: 1.7,
          textColor: BRAND.text,
          lineColor: BRAND.border,
          lineWidth: 0.2,
        },
        columnStyles: {
          0: { fontStyle: "bold", cellWidth: 56 },
          1: { cellWidth: contentWidth() - 56 },
        },
      });
      currentY = (((doc as jsPDF & { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? currentY) + 6);
    } else {
      currentY += 2;
    }
  };

  const addNotesSection = (title: string, paragraphs: string[]) => {
    if (!paragraphs.length) {
      return;
    }

    ensureSpace(20);
    doc.setTextColor(...BRAND.black);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.text(title, PAGE.left, currentY);
    currentY += 5;

    autoTable(doc, {
      startY: currentY,
      margin: tableMargin,
      theme: "grid",
      body: [paragraphs],
      styles: {
        fontSize: 8.4,
        cellPadding: 2,
        textColor: BRAND.text,
        lineColor: BRAND.border,
        lineWidth: 0.2,
        overflow: "linebreak",
      },
    });

    currentY = (((doc as jsPDF & { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? currentY) + 4);
  };

  const finalize = () => {
    const pageCount = doc.getNumberOfPages();
    for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
      doc.setPage(pageNumber);
      drawPageChrome(doc, options, pageNumber, pageCount);
    }
    return doc;
  };

  addMetadata();

  return {
    doc,
    addChartSection,
    addMessageSection,
    addNotesSection,
    addTableSection,
    finalize,
  };
};

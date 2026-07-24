import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  ImageRun,
  Packer,
  PageNumber,
  Paragraph,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from "docx";

type RgbColor = [number, number, number];
type DocxBlock = Paragraph | Table;

export interface AttainmentDocMetadataItem {
  label: string;
  value: string;
}

export interface AttainmentDocChartPoint {
  label: string;
  value: number;
  secondaryValue?: number;
}

export interface AttainmentDocChartThreshold {
  label: string;
  value: number;
  color?: RgbColor;
}

export interface AttainmentDocTableSection {
  title: string;
  headers: string[];
  rows: string[][];
  summary?: Array<[string, string]>;
  fontSize?: number;
}

export interface AttainmentDocMessageSection {
  title: string;
  lines: string[];
}

interface AttainmentDocBuilderOptions {
  moduleTitle: string;
  reportTitle: string;
  metadata: AttainmentDocMetadataItem[];
}

const BRAND = {
  black: [0, 0, 0] as RgbColor,
  border: [120, 120, 120] as RgbColor,
  bloomGreen: [57, 239, 99] as RgbColor,
  greenLine: [100, 214, 119] as RgbColor,
  midGray: [140, 140, 140] as RgbColor,
  muted: [85, 85, 85] as RgbColor,
  paperGrid: [224, 224, 224] as RgbColor,
  teal: [66, 184, 200] as RgbColor,
  text: [20, 20, 20] as RgbColor,
};

const ORGANISATION_NAME = "IonIdea Institute of Technology and Management, Bangalore";
const FOOTER_TEXT_TOP = "Powered by";
const FOOTER_TEXT_BOTTOM = "www.ioncudos.com";

const rgbToHex = ([r, g, b]: RgbColor) =>
  [r, g, b]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();

const textValue = (value: unknown) => String(value ?? "").trim() || "-";

const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number) => {
  const words = text.split(/\s+/).filter(Boolean);
  if (!words.length) {
    return [text];
  }

  const lines: string[] = [];
  let currentLine = words[0];
  for (let index = 1; index < words.length; index += 1) {
    const candidate = `${currentLine} ${words[index]}`;
    if (ctx.measureText(candidate).width <= maxWidth) {
      currentLine = candidate;
    } else {
      lines.push(currentLine);
      currentLine = words[index];
    }
  }
  lines.push(currentLine);
  return lines;
};

const dataUrlToBytes = (dataUrl: string) => {
  const [, base64 = ""] = dataUrl.split(",");
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
};

const createDummyLogoBytes = () => {
  if (typeof document === "undefined") {
    return null;
  }

  const canvas = document.createElement("canvas");
  canvas.width = 180;
  canvas.height = 110;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return null;
  }

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = `#${rgbToHex(BRAND.black)}`;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(8, 8, 164, 94, 8);
  ctx.stroke();
  ctx.setLineDash([4, 3]);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(14, 14, 152, 82, 6);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = `#${rgbToHex(BRAND.text)}`;
  ctx.textAlign = "center";
  ctx.font = "bold 24px Arial";
  ctx.fillText("YOUR", 90, 36);
  ctx.fillStyle = `#${rgbToHex(BRAND.greenLine)}`;
  ctx.font = "bold 30px Arial";
  ctx.fillText("LOGO", 90, 61);
  ctx.fillStyle = `#${rgbToHex(BRAND.text)}`;
  ctx.font = "bold 24px Arial";
  ctx.fillText("HERE", 90, 84);

  return dataUrlToBytes(canvas.toDataURL("image/png"));
};

const renderChartImageDataUrl = (
  title: string,
  points: AttainmentDocChartPoint[],
  thresholds: AttainmentDocChartThreshold[],
  legendLabel: string,
  secondaryLegendLabel?: string
) => {
  if (!points.length || typeof document === "undefined") {
    return "";
  }

  const canvas = document.createElement("canvas");
  canvas.width = 1040;
  canvas.height = thresholds.length ? 620 : 560;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return "";
  }

  const chartLeft = 96;
  const chartTop = 72;
  const chartWidth = 760;
  const chartHeight = 290;
  const chartBottom = chartTop + chartHeight;
  const stepWidth = chartWidth / Math.max(points.length, 1);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = `#${rgbToHex(BRAND.black)}`;
  ctx.font = "bold 30px Arial";
  ctx.fillText(title, 42, 42);

  ctx.strokeStyle = `#${rgbToHex(BRAND.border)}`;
  ctx.lineWidth = 2;
  ctx.strokeRect(chartLeft, chartTop, chartWidth, chartHeight);

  [0, 25, 50, 75, 100].forEach((axis) => {
    const y = chartBottom - (axis / 100) * chartHeight;
    ctx.strokeStyle = `#${rgbToHex(BRAND.paperGrid)}`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(chartLeft, y);
    ctx.lineTo(chartLeft + chartWidth, y);
    ctx.stroke();

    ctx.fillStyle = `#${rgbToHex(BRAND.muted)}`;
    ctx.font = "16px Arial";
    ctx.fillText(`${axis.toFixed(2)}%`, 12, y + 5);
  });

  thresholds.forEach((threshold) => {
    const value = Math.max(0, Math.min(100, threshold.value));
    const y = chartBottom - (value / 100) * chartHeight;
    ctx.strokeStyle = `#${rgbToHex(threshold.color || BRAND.greenLine)}`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(chartLeft, y);
    ctx.lineTo(chartLeft + chartWidth, y);
    ctx.stroke();
  });

  points.forEach((point, index) => {
    const primaryValue = Math.max(0, Math.min(100, point.value));
    const hasSecondary = typeof point.secondaryValue === "number";
    const barWidth = Math.max(18, stepWidth * (hasSecondary ? 0.18 : 0.22));
    const primaryX = chartLeft + index * stepWidth + stepWidth * (hasSecondary ? 0.24 : 0.38);
    const primaryHeight = (primaryValue / 100) * chartHeight;
    const primaryY = chartBottom - primaryHeight;

    ctx.fillStyle = `#${rgbToHex(BRAND.teal)}`;
    ctx.fillRect(primaryX, primaryY, barWidth, primaryHeight);

    ctx.fillStyle = `#${rgbToHex(BRAND.text)}`;
    ctx.font = "bold 15px Arial";
    ctx.textAlign = "center";
    ctx.fillText(primaryValue.toFixed(2), primaryX + barWidth / 2, primaryY - 10);

    if (hasSecondary) {
      const secondaryValue = Math.max(0, Math.min(100, Number(point.secondaryValue)));
      const secondaryHeight = (secondaryValue / 100) * chartHeight;
      const secondaryX = primaryX + barWidth + stepWidth * 0.08;
      const secondaryY = chartBottom - secondaryHeight;

      ctx.fillStyle = `#${rgbToHex(BRAND.bloomGreen)}`;
      ctx.fillRect(secondaryX, secondaryY, barWidth, secondaryHeight);
      ctx.fillStyle = `#${rgbToHex(BRAND.text)}`;
      ctx.font = "bold 15px Arial";
      ctx.fillText(secondaryValue.toFixed(2), secondaryX + barWidth / 2, secondaryY - 10);
    }

    const labelMaxWidth = Math.max(70, stepWidth * 0.82);
    const lines = wrapText(ctx, point.label, labelMaxWidth);
    ctx.fillStyle = `#${rgbToHex(BRAND.text)}`;
    ctx.font = "16px Arial";
    lines.slice(0, 3).forEach((line, lineIndex) => {
      ctx.fillText(line, primaryX + barWidth / 2, chartBottom + 28 + lineIndex * 18);
    });
  });

  ctx.textAlign = "left";
  const legendY = chartBottom + 92;
  ctx.fillStyle = `#${rgbToHex(BRAND.teal)}`;
  ctx.fillRect(290, legendY, 18, 18);
  ctx.fillStyle = `#${rgbToHex(BRAND.muted)}`;
  ctx.font = "16px Arial";
  ctx.fillText(legendLabel, 320, legendY + 14);

  if (secondaryLegendLabel) {
    ctx.fillStyle = `#${rgbToHex(BRAND.bloomGreen)}`;
    ctx.fillRect(560, legendY, 18, 18);
    ctx.fillStyle = `#${rgbToHex(BRAND.muted)}`;
    ctx.fillText(secondaryLegendLabel, 590, legendY + 14);
  }

  let thresholdLegendX = 42;
  thresholds.forEach((threshold) => {
    const color = threshold.color || BRAND.greenLine;
    ctx.fillStyle = `#${rgbToHex(color)}`;
    ctx.fillRect(thresholdLegendX, legendY + 42, 18, 18);
    ctx.fillStyle = `#${rgbToHex(BRAND.muted)}`;
    ctx.fillText(
      `${threshold.label} (${Math.max(0, Math.min(100, threshold.value)).toFixed(2)}%)`,
      thresholdLegendX + 28,
      legendY + 56
    );
    thresholdLegendX += 260;
  });

  return canvas.toDataURL("image/png");
};

const createTextParagraph = (
  text: string,
  options?: {
    alignment?: (typeof AlignmentType)[keyof typeof AlignmentType];
    bold?: boolean;
    color?: string;
    fontSize?: number;
    italics?: boolean;
    pageBreakBefore?: boolean;
    spacingAfter?: number;
    spacingBefore?: number;
  }
) =>
  new Paragraph({
    alignment: options?.alignment,
    children: [
      new TextRun({
        text,
        bold: options?.bold,
        color: options?.color,
        italics: options?.italics,
        size: options?.fontSize ? Math.round(options.fontSize * 2) : undefined,
      }),
    ],
    pageBreakBefore: options?.pageBreakBefore,
    spacing: {
      before: options?.spacingBefore,
      after: options?.spacingAfter ?? 80,
    },
  });

const createCell = (
  text: string,
  options?: {
    alignment?: (typeof AlignmentType)[keyof typeof AlignmentType];
    backgroundColor?: string;
    bold?: boolean;
    columnSpan?: number;
    fontSize?: number;
    margins?: { top?: number; bottom?: number; left?: number; right?: number };
    widthPercent?: number;
  }
) =>
  new TableCell({
    children: [
      new Paragraph({
        alignment: options?.alignment,
        children: [
          new TextRun({
            text: textValue(text),
            bold: options?.bold,
            size: Math.round((options?.fontSize ?? 8.5) * 2),
            color: rgbToHex(BRAND.text),
          }),
        ],
      }),
    ],
    columnSpan: options?.columnSpan,
    shading: options?.backgroundColor ? { fill: options.backgroundColor } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    width: options?.widthPercent
      ? { size: options.widthPercent, type: WidthType.PERCENTAGE }
      : undefined,
    margins: options?.margins ?? {
      top: 70,
      bottom: 70,
      left: 70,
      right: 70,
    },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: rgbToHex(BRAND.border) },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: rgbToHex(BRAND.border) },
      left: { style: BorderStyle.SINGLE, size: 1, color: rgbToHex(BRAND.border) },
      right: { style: BorderStyle.SINGLE, size: 1, color: rgbToHex(BRAND.border) },
    },
  });

const buildMetadataTable = (metadata: AttainmentDocMetadataItem[]) => {
  const rows: TableRow[] = [];

  for (let index = 0; index < metadata.length; index += 2) {
    const left = metadata[index];
    const right = metadata[index + 1];

    rows.push(
      new TableRow({
        children: [
          createCell(left?.label || "", {
            bold: true,
            widthPercent: 20,
          }),
          createCell(left?.value || "-", { widthPercent: 30 }),
          createCell(right?.label || "", {
            bold: true,
            widthPercent: 20,
          }),
          createCell(right?.value || (right ? "-" : ""), { widthPercent: 30 }),
        ],
      })
    );
  }

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows,
  });
};

const buildDataTable = (headers: string[], rows: string[][], fontSize = 8.5) => {
  const normalizedRows = rows.length
    ? rows.map((row) => headers.map((_, index) => textValue(row[index] ?? "")))
    : [headers.map((_, index) => (index === 0 ? "No data available." : ""))];

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: [
      new TableRow({
        tableHeader: true,
        children: headers.map((header) =>
          createCell(header, {
            alignment: AlignmentType.CENTER,
            bold: true,
            fontSize,
          })
        ),
      }),
      ...normalizedRows.map(
        (row) =>
          new TableRow({
            children: row.map((cell) =>
              createCell(cell, {
                alignment: AlignmentType.LEFT,
                fontSize,
              })
            ),
          })
      ),
    ],
  });
};

const buildSummaryTable = (summary: Array<[string, string]>) =>
  new Table({
    width: { size: 60, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: summary.map(
      ([label, value]) =>
        new TableRow({
          children: [
            createCell(label, {
              bold: true,
              widthPercent: 50,
            }),
            createCell(value, { widthPercent: 50 }),
          ],
        })
    ),
  });

const createHeader = () => {
  const logoBytes = createDummyLogoBytes();

  return new Header({
    children: [
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        layout: TableLayoutType.FIXED,
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 16, type: WidthType.PERCENTAGE },
                borders: {
                  top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                  bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                  left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                  right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                },
                children: [
                  new Paragraph({
                    children: logoBytes
                      ? [
                          new ImageRun({
                            data: logoBytes,
                            type: "png",
                            transformation: { width: 64, height: 39 },
                          }),
                        ]
                      : [new TextRun({ text: "LOGO", bold: true, size: 24 })],
                  }),
                ],
              }),
              new TableCell({
                width: { size: 84, type: WidthType.PERCENTAGE },
                verticalAlign: VerticalAlign.CENTER,
                borders: {
                  top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                  bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                  left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                  right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: ORGANISATION_NAME,
                        bold: true,
                        size: 21,
                        color: rgbToHex(BRAND.text),
                      }),
                    ],
                    spacing: { after: 60 },
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      new Paragraph({
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 2, color: rgbToHex(BRAND.border) },
        },
        spacing: { after: 80 },
      }),
    ],
  });
};

const createFooter = () =>
  new Footer({
    children: [
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        layout: TableLayoutType.FIXED,
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 78, type: WidthType.PERCENTAGE },
                verticalAlign: VerticalAlign.CENTER,
                borders: {
                  top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                  bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                  left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                  right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 0 },
                    children: [new TextRun({ text: FOOTER_TEXT_TOP, size: 16, color: rgbToHex(BRAND.text) })],
                  }),
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 0 },
                    children: [new TextRun({ text: FOOTER_TEXT_BOTTOM, size: 16, color: rgbToHex(BRAND.text) })],
                  }),
                ],
              }),
              new TableCell({
                width: { size: 22, type: WidthType.PERCENTAGE },
                verticalAlign: VerticalAlign.CENTER,
                borders: {
                  top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                  bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                  left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                  right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    children: [
                      new TextRun({ text: "Page ", size: 16, color: rgbToHex(BRAND.text) }),
                      new TextRun({
                        children: [PageNumber.CURRENT],
                        size: 16,
                        color: rgbToHex(BRAND.text),
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

export const downloadWordDocument = async (blobOrPromise: Blob | Promise<Blob>, filename: string) => {
  const blob = await blobOrPromise;
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
};

export const createAttainmentDocBuilder = (options: AttainmentDocBuilderOptions) => {
  const sections: DocxBlock[] = [
    buildMetadataTable(options.metadata),
    new Paragraph({ spacing: { after: 120 } }),
  ];

  const addChartSection = (
    title: string,
    points: AttainmentDocChartPoint[],
    thresholds: AttainmentDocChartThreshold[] = [],
    legendLabel = "Threshold Direct Attainment %",
    secondaryLegendLabel?: string
  ) => {
    if (!points.length) {
      return;
    }

    sections.push(
      createTextParagraph(title, {
        bold: true,
        color: rgbToHex(BRAND.black),
        fontSize: 11,
        spacingBefore: 80,
        spacingAfter: 80,
      })
    );

    const imageDataUrl = renderChartImageDataUrl(
      title,
      points,
      thresholds,
      legendLabel,
      secondaryLegendLabel
    );

    if (imageDataUrl) {
      sections.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 },
          children: [
            new ImageRun({
              data: dataUrlToBytes(imageDataUrl),
              type: "png",
              transformation: { width: 490, height: thresholds.length ? 292 : 264 },
            }),
          ],
        })
      );
      return;
    }

    const fallbackRows = points.map((point) => [
      point.label,
      `${point.value.toFixed(2)}%`,
      typeof point.secondaryValue === "number" ? `${Number(point.secondaryValue).toFixed(2)}%` : "-",
    ]);

    sections.push(
      buildDataTable(
        ["Label", legendLabel, secondaryLegendLabel || "Secondary series"],
        fallbackRows
      ),
      new Paragraph({ spacing: { after: 120 } })
    );
  };

  const addMessageSection = ({ title, lines }: AttainmentDocMessageSection) => {
    if (!lines.length) {
      return;
    }

    sections.push(
      createTextParagraph(title, {
        bold: true,
        color: rgbToHex(BRAND.black),
        fontSize: 10.5,
        spacingBefore: 80,
        spacingAfter: 80,
      }),
      buildDataTable(["Message"], lines.map((line) => [line]), 8.6),
      new Paragraph({ spacing: { after: 120 } })
    );
  };

  const addNotesSection = (title: string, paragraphs: string[]) => {
    if (!paragraphs.length) {
      return;
    }

    sections.push(
      createTextParagraph(title, {
        bold: true,
        color: rgbToHex(BRAND.black),
        fontSize: 10.5,
        spacingBefore: 80,
        spacingAfter: 80,
      }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        layout: TableLayoutType.FIXED,
        rows: [
          new TableRow({
            children: [
              new TableCell({
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 1, color: rgbToHex(BRAND.border) },
                  bottom: { style: BorderStyle.SINGLE, size: 1, color: rgbToHex(BRAND.border) },
                  left: { style: BorderStyle.SINGLE, size: 1, color: rgbToHex(BRAND.border) },
                  right: { style: BorderStyle.SINGLE, size: 1, color: rgbToHex(BRAND.border) },
                },
                margins: { top: 100, bottom: 100, left: 100, right: 100 },
                children: paragraphs.map((paragraph) =>
                  createTextParagraph(textValue(paragraph), {
                    fontSize: 8.6,
                    spacingAfter: 60,
                  })
                ),
              }),
            ],
          }),
        ],
      }),
      new Paragraph({ spacing: { after: 120 } })
    );
  };

  const addTableSection = ({ title, headers, rows, summary, fontSize = 8.5 }: AttainmentDocTableSection) => {
    sections.push(
      createTextParagraph(title, {
        bold: true,
        color: rgbToHex(BRAND.black),
        fontSize: 11,
        spacingBefore: 80,
        spacingAfter: 80,
      }),
      buildDataTable(headers, rows, fontSize)
    );

    if (summary?.length) {
      sections.push(new Paragraph({ spacing: { after: 60 } }), buildSummaryTable(summary));
    }

    sections.push(new Paragraph({ spacing: { after: 120 } }));
  };

  const finalize = async () => {
    const document = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 1080,
                right: 720,
                bottom: 900,
                left: 720,
                header: 540,
                footer: 540,
              },
            },
          },
          headers: {
            default: createHeader(),
          },
          footers: {
            default: createFooter(),
          },
          children: sections,
        },
      ],
    });

    return Packer.toBlob(document);
  };

  return {
    addChartSection,
    addMessageSection,
    addNotesSection,
    addTableSection,
    finalize,
  };
};

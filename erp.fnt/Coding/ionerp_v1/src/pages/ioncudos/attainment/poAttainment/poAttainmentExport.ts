export const openPdfPreview = (blob: Blob, filename: string, previewWindow?: Window | null) => {
  const targetWindow = previewWindow ?? window.open("", "_blank");
  if (!targetWindow) {
    throw new Error("PDF preview was blocked by the browser.");
  }

  const pdfBlob = blob.type === "application/pdf" ? blob : new Blob([blob], { type: "application/pdf" });
  if (!pdfBlob.size) {
    throw new Error("Generated PDF is empty.");
  }

  const blobUrl = URL.createObjectURL(pdfBlob);

  const renderEmbedFallback = () => {
    targetWindow.document.open();
    targetWindow.document.write(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${filename}</title>
  </head>
  <body style="margin:0;background:#f5f5f5;">
    <embed src="${blobUrl}" type="application/pdf" width="100%" height="100%" style="height:100vh;" />
  </body>
</html>`);
    targetWindow.document.close();
  };

  try {
    targetWindow.location.replace(blobUrl);
    targetWindow.setTimeout(() => {
      if (targetWindow.location.href === "about:blank") {
        renderEmbedFallback();
      }
    }, 1200);
  } catch {
    renderEmbedFallback();
  }

  targetWindow.setTimeout(() => {
    URL.revokeObjectURL(blobUrl);
  }, 300000);
};

export const downloadExportBlob = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
};

const svgMarkupToPng = async (svgMarkup: string, width: number, height: number) => {
  const svgBlob = new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" });
  const svgUrl = URL.createObjectURL(svgBlob);

  try {
    const image = new Image();
    image.decoding = "async";

    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Unable to render chart image for export."));
      image.src = svgUrl;
    });

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width * 2));
    canvas.height = Math.max(1, Math.round(height * 2));
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Unable to prepare chart export canvas.");
    }

    context.scale(2, 2);
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
};

export const captureChartImage = async (container: HTMLElement | null) => {
  if (!container) {
    return null;
  }

  const svg = container.querySelector("svg");
  if (!svg) {
    return null;
  }

  const bounds = container.getBoundingClientRect();
  const width = Math.max(1, Math.round(bounds.width || svg.clientWidth || 900));
  const height = Math.max(1, Math.round(bounds.height || svg.clientHeight || 320));
  const clonedSvg = svg.cloneNode(true) as SVGSVGElement;

  clonedSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clonedSvg.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
  clonedSvg.setAttribute("width", String(width));
  clonedSvg.setAttribute("height", String(height));
  clonedSvg.setAttribute("viewBox", clonedSvg.getAttribute("viewBox") || `0 0 ${width} ${height}`);
  clonedSvg.style.background = "#ffffff";

  return svgMarkupToPng(new XMLSerializer().serializeToString(clonedSvg), width, height);
};

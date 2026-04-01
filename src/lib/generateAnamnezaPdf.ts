import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import React from "react";
import { createRoot } from "react-dom/client";
import PdfReportTemplate from "@/components/PdfReportTemplate";

type FormData = Record<string, string>;

interface InstitutionInfo {
  institution_name?: string;
  institution_address?: string;
  institution_city?: string;
  institution_country?: string;
  institution_logo_url?: string;
  doctor_name?: string;
}

export async function generateAnamnezaPdf(
  form: FormData,
  lang = "sr",
  institution?: InstitutionInfo
) {
  // 1. Create a hidden container
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.zIndex = "-9999";
  container.style.width = "794px"; // A4 at 96dpi
  container.style.background = "#fff";
  document.body.appendChild(container);

  // 2. Render the React template into the container
  const root = createRoot(container);
  root.render(
    React.createElement(PdfReportTemplate, { form, lang, institution })
  );

  // Wait for render + images to load
  await new Promise((resolve) => setTimeout(resolve, 500));

  try {
    // 3. Capture with html2canvas
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      width: 794,
      windowWidth: 794,
    });

    // 4. Create PDF from canvas image
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    const pdfW = 210;
    const pdfH = 297;

    // Scale image to fit A4
    const canvasRatio = canvas.height / canvas.width;
    const imgH = pdfW * canvasRatio;

    if (imgH <= pdfH) {
      // Fits on one page
      pdf.addImage(imgData, "PNG", 0, 0, pdfW, imgH);
    } else {
      // Multi-page: slice the canvas
      const pageCanvasHeight = (pdfH / pdfW) * canvas.width;
      let remainingHeight = canvas.height;
      let srcY = 0;
      let pageNum = 0;

      while (remainingHeight > 0) {
        if (pageNum > 0) pdf.addPage();

        const sliceH = Math.min(pageCanvasHeight, remainingHeight);
        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = canvas.width;
        pageCanvas.height = sliceH;
        const ctx = pageCanvas.getContext("2d")!;
        ctx.drawImage(canvas, 0, srcY, canvas.width, sliceH, 0, 0, canvas.width, sliceH);

        const pageImg = pageCanvas.toDataURL("image/png");
        const sliceRatio = sliceH / canvas.width;
        pdf.addImage(pageImg, "PNG", 0, 0, pdfW, pdfW * sliceRatio);

        srcY += sliceH;
        remainingHeight -= sliceH;
        pageNum++;
      }
    }

    // 5. Open PDF
    const blob = pdf.output("blob");
    const url = URL.createObjectURL(blob);
    const opened = window.open(url, "_blank");
    if (!opened) {
      const a = document.createElement("a");
      a.href = url;
      a.download = `Anamneza_${(form.patientName || "patient").replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  } finally {
    // 6. Cleanup
    root.unmount();
    document.body.removeChild(container);
  }
}

import jsPDF from "jspdf";

type FormData = Record<string, string>;

interface SystemCategory {
  id: string;
  label: string;
  fields: { key: string; label: string }[];
}

const SYSTEM_CATEGORIES: SystemCategory[] = [
  {
    id: "cardiovascular", label: "Kardiovaskularni / Respiratorni",
    fields: [
      { key: "chestPain", label: "Bol u grudima" },
      { key: "swelling", label: "Otoci" },
      { key: "pressure", label: "Pritisak" },
      { key: "veins", label: "Vene" },
    ],
  },
  {
    id: "gastrointestinal", label: "Gastrointestinalni (GIT)",
    fields: [
      { key: "appetite", label: "Apetit" },
      { key: "nausea", label: "Mučnina" },
      { key: "swallowing", label: "Gutanje" },
      { key: "bloating", label: "Nadutost" },
      { key: "stool", label: "Stolica" },
    ],
  },
  {
    id: "urogenital", label: "Urogenitalni (URO)",
    fields: [
      { key: "urination", label: "Mokrenje" },
      { key: "flankPain", label: "Bol u slabinama" },
    ],
  },
  {
    id: "locomotor", label: "Lokomotorni & CNS",
    fields: [
      { key: "jointPain", label: "Bol u zglobovima" },
      { key: "visionHearing", label: "Vid / Sluh" },
      { key: "dizziness", label: "Vrtoglavica" },
      { key: "headaches", label: "Glavobolje" },
    ],
  },
];

const OBJECTIVE_FIELDS = [
  { key: "bloodPressure", label: "TA (krvni pritisak)" },
  { key: "pulse", label: "Puls" },
  { key: "temperature", label: "Temperatura" },
  { key: "respiration", label: "Respiracija / SpO2" },
  { key: "lungSounds", label: "Auskultacija pluca" },
  { key: "heartSounds", label: "Srcani tonovi" },
  { key: "abdominalExam", label: "Pregled abdomena" },
  { key: "skinExam", label: "Koza" },
  { key: "meningealSigns", label: "Meningealni znaci" },
  { key: "otherFindings", label: "Ostali nalazi" },
];

const today = () => {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}.`;
};

/* Strip diacritics for jsPDF default font compatibility */
function stripDiacritics(text: string): string {
  const map: Record<string, string> = {
    "č": "c", "ć": "c", "đ": "dj", "š": "s", "ž": "z",
    "Č": "C", "Ć": "C", "Đ": "Dj", "Š": "S", "Ž": "Z",
    "ü": "u", "ö": "o", "ä": "a", "ë": "e",
  };
  return text.replace(/[čćđšžČĆĐŠŽüöäë]/g, (ch) => map[ch] || ch);
}

export function generateAnamnezaPdf(form: FormData) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = 210;
  const marginL = 18;
  const marginR = 18;
  const contentW = pageW - marginL - marginR;
  let y = 18;

  const s = (t: string) => stripDiacritics(t);

  function checkPage(needed = 12) {
    if (y + needed > 280) {
      doc.addPage();
      y = 18;
    }
  }

  function sectionTitle(title: string) {
    checkPage(14);
    y += 4;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(s(title), pageW / 2, y, { align: "center" });
    y += 2;
    doc.setLineWidth(0.3);
    doc.line(marginL, y, pageW - marginR, y);
    y += 6;
  }

  function fieldLine(label: string, value: string) {
    checkPage(10);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(s(label) + ":", marginL, y);
    doc.setFont("helvetica", "normal");
    const labelW = doc.getTextWidth(s(label) + ": ");
    const val = value || "___";
    const lines = doc.splitTextToSize(s(val), contentW - labelW - 2);
    doc.text(lines, marginL + labelW + 1, y);
    y += Math.max(lines.length * 4, 5);
  }

  function textBlock(label: string, value: string) {
    checkPage(16);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(s(label) + ":", marginL, y);
    y += 4.5;
    doc.setFont("helvetica", "normal");
    const val = value || "___";
    const lines = doc.splitTextToSize(s(val), contentW - 4);
    doc.text(lines, marginL + 2, y);
    y += lines.length * 4 + 3;
  }

  /* ===== HEADER ===== */
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Republika Srbija", pageW / 2, y, { align: "center" });
  y += 5;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Univerzitetski Klinicki Centar Srbije", pageW / 2, y, { align: "center" });
  y += 5;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Pasterova 2, Savski venac, 11000 Beograd", pageW / 2, y, { align: "center" });
  y += 6;
  doc.setLineWidth(0.4);
  doc.line(marginL, y, pageW - marginR, y);
  y += 4;

  doc.setFontSize(8);
  doc.text("Br. istorije bolesti: ___________", marginL, y);
  doc.text("Datum: " + today(), pageW - marginR, y, { align: "right" });
  y += 8;

  /* ===== PACIJENT ===== */
  sectionTitle("PACIJENT");
  fieldLine("Ime i prezime", form.patientName || "");
  fieldLine("Godiste / Starost", form.patientAge || "");
  fieldLine("Zanimanje", form.patientOccupation || "");
  fieldLine("Socijalni status", form.patientSocialStatus || "");

  /* ===== ANAMNEZA ===== */
  sectionTitle("ANAMNEZA");

  textBlock("Radne dijagnoze (ICD-10)", form.diagnosisCodes || "");
  textBlock("Glavne tegobe", form.chiefComplaints || "");
  textBlock("Sadasnja bolest", form.presentIllness || "");
  textBlock("Klinicka hronologija", form.clinicalTimeline || "");

  /* ===== ANAMNEZA PO SISTEMIMA ===== */
  sectionTitle("ANAMNEZA PO SISTEMIMA");
  for (const cat of SYSTEM_CATEGORIES) {
    checkPage(10);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(s(cat.label), marginL, y);
    y += 5;
    for (const f of cat.fields) {
      fieldLine(f.label, form[f.key] || "");
    }
    y += 2;
  }

  /* ===== LICNA ANAMNEZA ===== */
  sectionTitle("LICNA ANAMNEZA");
  fieldLine("Alergije", form.allergies || "");
  fieldLine("Hronicne bolesti", form.chronicDiseases || "");
  fieldLine("Hirurske intervencije", form.surgeries || "");
  fieldLine("Redovna terapija", form.medications || "");

  /* ===== PORODICNA ANAMNEZA ===== */
  sectionTitle("PORODICNA ANAMNEZA");
  textBlock("Porodicna anamneza", form.familyHistory || "");

  /* ===== SOCIO-EPIDEMIOLOSKA ===== */
  sectionTitle("SOCIO-EPIDEMIOLOSKA ANAMNEZA");
  fieldLine("Uslovi zivota", form.livingConditions || "");
  fieldLine("Pusenje / Alkohol", form.smokingAlcohol || "");
  fieldLine("Epidemioloski podaci", form.epidemiological || "");

  /* ===== STATUS PRAESENS ===== */
  sectionTitle("STATUS PRAESENS");
  for (const f of OBJECTIVE_FIELDS) {
    fieldLine(f.label, form[f.key] || "");
  }

  /* ===== FOOTER ===== */
  checkPage(35);
  y += 10;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");

  // Stamp box
  doc.text(s("Pecat ustanove:"), marginL, y);
  doc.rect(marginL, y + 2, 30, 25);

  // Signature
  doc.text(s("Potpis lekara:"), pageW - marginR - 50, y);
  y += 20;
  doc.line(pageW - marginR - 55, y, pageW - marginR, y);
  y += 4;
  doc.text("Dr. ___________________________", pageW - marginR - 55, y);
  y += 4;
  doc.setFontSize(7);
  doc.text("Faksimil", pageW - marginR - 55, y);

  /* ===== SAVE ===== */
  const name = form.patientName ? s(form.patientName).replace(/\s+/g, "_") : "pacijent";
  doc.save(`Anamneza_${name}_${today().replace(/\./g, "")}.pdf`);
}

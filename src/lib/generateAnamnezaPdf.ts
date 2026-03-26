import jsPDF from "jspdf";
import { RobotoRegularBase64 } from "./Roboto-Regular.b64";
import { RobotoBoldBase64 } from "./Roboto-Bold.b64";

type FormData = Record<string, string>;

interface SystemCategory {
  id: string;
  label: string;
  fields: { key: string; label: string }[];
}

const SYSTEM_CATEGORIES: SystemCategory[] = [
  {
    id: "cardiovascular", label: "Кардиоваскуларни / Респираторни",
    fields: [
      { key: "chestPain", label: "Бол у грудима" },
      { key: "swelling", label: "Отоци" },
      { key: "pressure", label: "Притисак" },
      { key: "veins", label: "Вене" },
    ],
  },
  {
    id: "gastrointestinal", label: "Гастроинтестинални (ГИТ)",
    fields: [
      { key: "appetite", label: "Апетит" },
      { key: "nausea", label: "Мучнина" },
      { key: "swallowing", label: "Гутање" },
      { key: "bloating", label: "Надутост" },
      { key: "stool", label: "Столица" },
    ],
  },
  {
    id: "urogenital", label: "Урогенитални (УРО)",
    fields: [
      { key: "urination", label: "Мокрење" },
      { key: "flankPain", label: "Бол у слабинама" },
    ],
  },
  {
    id: "locomotor", label: "Локомоторни & ЦНС",
    fields: [
      { key: "jointPain", label: "Бол у зглобовима" },
      { key: "visionHearing", label: "Вид / Слух" },
      { key: "dizziness", label: "Вртоглавица" },
      { key: "headaches", label: "Главобоље" },
    ],
  },
];

const OBJECTIVE_FIELDS = [
  { key: "bloodPressure", label: "ТА (крвни притисак)" },
  { key: "pulse", label: "Пулс" },
  { key: "temperature", label: "Температура" },
  { key: "respiration", label: "Респирација / SpO2" },
  { key: "lungSounds", label: "Аускултација плућа" },
  { key: "heartSounds", label: "Срчани тонови" },
  { key: "abdominalExam", label: "Преглед абдомена" },
  { key: "skinExam", label: "Кожа" },
  { key: "meningealSigns", label: "Менингеални знаци" },
  { key: "otherFindings", label: "Остали налази" },
];

const today = () => {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}.`;
};

function setupFonts(doc: jsPDF) {
  doc.addFileToVFS("Roboto-Regular.ttf", RobotoRegularBase64);
  doc.addFileToVFS("Roboto-Bold.ttf", RobotoBoldBase64);
  doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
  doc.addFont("Roboto-Bold.ttf", "Roboto", "bold");
}

export function generateAnamnezaPdf(form: FormData) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  setupFonts(doc);

  const pageW = 210;
  const marginL = 18;
  const marginR = 18;
  const contentW = pageW - marginL - marginR;
  let y = 18;

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
    doc.setFont("Roboto", "bold");
    doc.text(title, pageW / 2, y, { align: "center" });
    y += 2;
    doc.setLineWidth(0.3);
    doc.line(marginL, y, pageW - marginR, y);
    y += 6;
  }

  function fieldLine(label: string, value: string) {
    checkPage(10);
    doc.setFontSize(8);
    doc.setFont("Roboto", "bold");
    doc.text(label + ":", marginL, y);
    doc.setFont("Roboto", "normal");
    const labelW = doc.getTextWidth(label + ": ");
    const val = value || "___";
    const lines = doc.splitTextToSize(val, contentW - labelW - 2);
    doc.text(lines, marginL + labelW + 1, y);
    y += Math.max(lines.length * 4, 5);
  }

  function textBlock(label: string, value: string) {
    checkPage(16);
    doc.setFontSize(8);
    doc.setFont("Roboto", "bold");
    doc.text(label + ":", marginL, y);
    y += 4.5;
    doc.setFont("Roboto", "normal");
    const val = value || "___";
    const lines = doc.splitTextToSize(val, contentW - 4);
    doc.text(lines, marginL + 2, y);
    y += lines.length * 4 + 3;
  }

  /* ===== ЗАГЛАВЉЕ ===== */
  doc.setFontSize(9);
  doc.setFont("Roboto", "normal");
  doc.text("Република Србија", pageW / 2, y, { align: "center" });
  y += 5;
  doc.setFontSize(11);
  doc.setFont("Roboto", "bold");
  doc.text("Универзитетски Клинички Центар Србије", pageW / 2, y, { align: "center" });
  y += 5;
  doc.setFontSize(8);
  doc.setFont("Roboto", "normal");
  doc.text("Пастерова 2, Савски венац, 11000 Београд", pageW / 2, y, { align: "center" });
  y += 6;
  doc.setLineWidth(0.4);
  doc.line(marginL, y, pageW - marginR, y);
  y += 4;

  doc.setFontSize(8);
  doc.text("Бр. историје болести: ___________", marginL, y);
  doc.text("Датум: " + today(), pageW - marginR, y, { align: "right" });
  y += 8;

  /* ===== ПАЦИЈЕНТ ===== */
  sectionTitle("ПАЦИЈЕНТ");
  fieldLine("Име и презиме", form.patientName || "");
  fieldLine("Годиште / Старост", form.patientAge || "");
  fieldLine("Занимање", form.patientOccupation || "");
  fieldLine("Социјални статус", form.patientSocialStatus || "");

  /* ===== АНАМНЕЗА ===== */
  sectionTitle("АНАМНЕЗА");
  textBlock("Радне дијагнозе (ICD-10)", form.diagnosisCodes || "");
  textBlock("Главне тегобе", form.chiefComplaints || "");
  textBlock("Садашња болест", form.presentIllness || "");
  textBlock("Клиничка хронологија", form.clinicalTimeline || "");

  /* ===== АНАМНЕЗА ПО СИСТЕМИМА ===== */
  sectionTitle("АНАМНЕЗА ПО СИСТЕМИМА");
  for (const cat of SYSTEM_CATEGORIES) {
    checkPage(10);
    doc.setFontSize(9);
    doc.setFont("Roboto", "bold");
    doc.text(cat.label, marginL, y);
    y += 5;
    for (const f of cat.fields) {
      fieldLine(f.label, form[f.key] || "");
    }
    y += 2;
  }

  /* ===== ЛИЧНА АНАМНЕЗА ===== */
  sectionTitle("ЛИЧНА АНАМНЕЗА");
  fieldLine("Алергије", form.allergies || "");
  fieldLine("Хроничне болести", form.chronicDiseases || "");
  fieldLine("Хируршке интервенције", form.surgeries || "");
  fieldLine("Редовна терапија", form.medications || "");

  /* ===== ПОРОДИЧНА АНАМНЕЗА ===== */
  sectionTitle("ПОРОДИЧНА АНАМНЕЗА");
  textBlock("Породична анамнеза", form.familyHistory || "");

  /* ===== СОЦИО-ЕПИДЕМИОЛОШКА ===== */
  sectionTitle("СОЦИО-ЕПИДЕМИОЛОШКА АНАМНЕЗА");
  fieldLine("Услови живота", form.livingConditions || "");
  fieldLine("Пушење / Алкохол", form.smokingAlcohol || "");
  fieldLine("Епидемиолошки подаци", form.epidemiological || "");

  /* ===== STATUS PRAESENS ===== */
  sectionTitle("STATUS PRAESENS");
  for (const f of OBJECTIVE_FIELDS) {
    fieldLine(f.label, form[f.key] || "");
  }

  /* ===== ПОТПИС ===== */
  checkPage(35);
  y += 10;
  doc.setFontSize(8);
  doc.setFont("Roboto", "normal");

  doc.text("Печат установе:", marginL, y);
  doc.rect(marginL, y + 2, 30, 25);

  doc.text("Потпис лекара:", pageW - marginR - 50, y);
  y += 20;
  doc.line(pageW - marginR - 55, y, pageW - marginR, y);
  y += 4;
  doc.text("Др. ___________________________", pageW - marginR - 55, y);
  y += 4;
  doc.setFontSize(7);
  doc.text("Факсимил", pageW - marginR - 55, y);

  /* ===== САЧУВАЈ ===== */
  const name = form.patientName ? form.patientName.replace(/\s+/g, "_") : "пацијент";
  doc.save(`Анамнеза_${name}_${today().replace(/\./g, "")}.pdf`);
}

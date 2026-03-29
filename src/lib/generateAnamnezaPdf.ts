import jsPDF from "jspdf";
import { RobotoRegularBase64 } from "./Roboto-Regular.b64";
import { RobotoBoldBase64 } from "./Roboto-Bold.b64";

type FormData = Record<string, string>;

interface InstitutionInfo {
  institution_name?: string;
  institution_address?: string;
  institution_city?: string;
  institution_logo_url?: string;
  doctor_name?: string;
}

interface Translations {
  country: string;
  patient: string;
  nameSurname: string;
  yearAge: string;
  occupation: string;
  socialStatus: string;
  anamnesis: string;
  workingDiagnoses: string;
  chiefComplaints: string;
  presentIllness: string;
  clinicalTimeline: string;
  systemAnamnesis: string;
  personalHistory: string;
  allergies: string;
  chronicDiseases: string;
  surgeries: string;
  regularTherapy: string;
  familyHistory: string;
  socioEpidemiological: string;
  livingConditions: string;
  smokingAlcohol: string;
  epidemiological: string;
  statusPraesens: string;
  stampLabel: string;
  signatureLabel: string;
  facsimile: string;
  date: string;
  historyNo: string;
  jmbg: string;
  address: string;
  cardNo: string;
  // System categories
  cardiovascular: string;
  chestPain: string;
  swelling: string;
  pressure: string;
  veins: string;
  gastrointestinal: string;
  appetite: string;
  nausea: string;
  swallowing: string;
  bloating: string;
  stool: string;
  urogenital: string;
  urination: string;
  flankPain: string;
  locomotor: string;
  jointPain: string;
  visionHearing: string;
  dizziness: string;
  headaches: string;
  // Objective
  bloodPressure: string;
  pulse: string;
  temperature: string;
  respiration: string;
  lungSounds: string;
  heartSounds: string;
  abdominalExam: string;
  skinExam: string;
  meningealSigns: string;
  otherFindings: string;
}

const SR: Translations = {
  country: "Република Србија",
  patient: "ПАЦИЈЕНТ",
  nameSurname: "Име и презиме",
  yearAge: "Годиште / Старост",
  occupation: "Занимање",
  socialStatus: "Социјални статус",
  anamnesis: "АНАМНЕЗА И STATUS PRAESENS",
  workingDiagnoses: "Радне дијагнозе",
  chiefComplaints: "Главне тегобе",
  presentIllness: "Садашња болест",
  clinicalTimeline: "Клиничка хронологија",
  systemAnamnesis: "АНАМНЕЗА ПО СИСТЕМИМА",
  personalHistory: "ЛИЧНА АНАМНЕЗА",
  allergies: "ЛА",
  chronicDiseases: "Хроничне болести",
  surgeries: "Хируршке интервенције",
  regularTherapy: "Редовна терапија",
  familyHistory: "ПОРОДИЧНА АНАМНЕЗА",
  socioEpidemiological: "СОЦИО-ЕПИДЕМИОЛОШКА АНАМНЕЗА",
  livingConditions: "Услови живота",
  smokingAlcohol: "Пушење / Алкохол",
  epidemiological: "Епидемиолошки подаци",
  statusPraesens: "STATUS PRAESENS",
  stampLabel: "Печат установе",
  signatureLabel: "Потпис и факсимил лекара:",
  facsimile: "Факсимил",
  date: "Датум",
  historyNo: "Број историје болести:",
  jmbg: "ЈМБГ:",
  address: "Адреса:",
  cardNo: "Број картона:",
  cardiovascular: "КАРДИО",
  chestPain: "Бол у грудима",
  swelling: "Отоци",
  pressure: "Притисак",
  veins: "Вене",
  gastrointestinal: "ГИТ",
  appetite: "Апетит",
  nausea: "Мучнина",
  swallowing: "Гутање",
  bloating: "Надутост",
  stool: "Столица",
  urogenital: "УРО",
  urination: "Мокрење",
  flankPain: "Бол у слабинама",
  locomotor: "ЛОК / ЦНС",
  jointPain: "Бол у зглобовима",
  visionHearing: "Вид / Слух",
  dizziness: "Вртоглавица",
  headaches: "Главобоље",
  bloodPressure: "ТА (крвни притисак)",
  pulse: "Пулс",
  temperature: "Температура",
  respiration: "Респирација / SpO2",
  lungSounds: "Аускултација плућа",
  heartSounds: "Срчани тонови",
  abdominalExam: "Преглед абдомена",
  skinExam: "Кожа",
  meningealSigns: "Менингеални знаци",
  otherFindings: "Остали налази",
};

const EN: Translations = {
  country: "Republic of Serbia",
  patient: "PATIENT",
  nameSurname: "Full Name",
  yearAge: "Year of Birth / Age",
  occupation: "Occupation",
  socialStatus: "Social Status",
  anamnesis: "ANAMNESIS AND STATUS PRAESENS",
  workingDiagnoses: "Working Diagnoses",
  chiefComplaints: "Chief Complaints",
  presentIllness: "Present Illness",
  clinicalTimeline: "Clinical Timeline",
  systemAnamnesis: "REVIEW OF SYSTEMS",
  personalHistory: "PERSONAL HISTORY",
  allergies: "Allergies",
  chronicDiseases: "Chronic Diseases",
  surgeries: "Surgical History",
  regularTherapy: "Regular Therapy",
  familyHistory: "FAMILY HISTORY",
  socioEpidemiological: "SOCIO-EPIDEMIOLOGICAL HISTORY",
  livingConditions: "Living Conditions",
  smokingAlcohol: "Smoking / Alcohol",
  epidemiological: "Epidemiological Data",
  statusPraesens: "STATUS PRAESENS",
  stampLabel: "Institution Stamp",
  signatureLabel: "Physician Signature:",
  facsimile: "Facsimile",
  date: "Date",
  historyNo: "Medical Record No.:",
  jmbg: "National ID:",
  address: "Address:",
  cardNo: "Card No.:",
  cardiovascular: "CARDIO",
  chestPain: "Chest Pain",
  swelling: "Swelling",
  pressure: "Blood Pressure",
  veins: "Veins",
  gastrointestinal: "GI",
  appetite: "Appetite",
  nausea: "Nausea",
  swallowing: "Swallowing",
  bloating: "Bloating",
  stool: "Stool",
  urogenital: "URO",
  urination: "Urination",
  flankPain: "Flank Pain",
  locomotor: "MSK / CNS",
  jointPain: "Joint Pain",
  visionHearing: "Vision / Hearing",
  dizziness: "Dizziness",
  headaches: "Headaches",
  bloodPressure: "BP (Blood Pressure)",
  pulse: "Pulse",
  temperature: "Temperature",
  respiration: "Respiration / SpO2",
  lungSounds: "Lung Auscultation",
  heartSounds: "Heart Sounds",
  abdominalExam: "Abdominal Exam",
  skinExam: "Skin",
  meningealSigns: "Meningeal Signs",
  otherFindings: "Other Findings",
};

const FR: Translations = {
  ...EN,
  country: "République de Serbie",
  patient: "PATIENT",
  nameSurname: "Nom complet",
  yearAge: "Année / Âge",
  anamnesis: "ANAMNÈSE ET STATUS PRAESENS",
  workingDiagnoses: "Diagnostics de travail",
  chiefComplaints: "Plaintes principales",
  presentIllness: "Maladie actuelle",
  clinicalTimeline: "Chronologie clinique",
  statusPraesens: "STATUS PRAESENS",
  signatureLabel: "Signature du médecin:",
  date: "Date",
};

function getTranslations(lang: string): Translations {
  if (lang === "sr") return SR;
  if (lang === "fr") return FR;
  return EN;
}

interface SystemCategory {
  labelKey: keyof Translations;
  fields: { key: string; labelKey: keyof Translations }[];
}

const SYSTEM_CATEGORIES: SystemCategory[] = [
  {
    labelKey: "cardiovascular",
    fields: [
      { key: "chestPain", labelKey: "chestPain" },
      { key: "swelling", labelKey: "swelling" },
      { key: "pressure", labelKey: "pressure" },
      { key: "veins", labelKey: "veins" },
    ],
  },
  {
    labelKey: "gastrointestinal",
    fields: [
      { key: "appetite", labelKey: "appetite" },
      { key: "nausea", labelKey: "nausea" },
      { key: "swallowing", labelKey: "swallowing" },
      { key: "bloating", labelKey: "bloating" },
      { key: "stool", labelKey: "stool" },
    ],
  },
  {
    labelKey: "urogenital",
    fields: [
      { key: "urination", labelKey: "urination" },
      { key: "flankPain", labelKey: "flankPain" },
    ],
  },
  {
    labelKey: "locomotor",
    fields: [
      { key: "jointPain", labelKey: "jointPain" },
      { key: "visionHearing", labelKey: "visionHearing" },
      { key: "dizziness", labelKey: "dizziness" },
      { key: "headaches", labelKey: "headaches" },
    ],
  },
];

const OBJECTIVE_FIELDS: { key: string; labelKey: keyof Translations }[] = [
  { key: "bloodPressure", labelKey: "bloodPressure" },
  { key: "pulse", labelKey: "pulse" },
  { key: "temperature", labelKey: "temperature" },
  { key: "respiration", labelKey: "respiration" },
  { key: "lungSounds", labelKey: "lungSounds" },
  { key: "heartSounds", labelKey: "heartSounds" },
  { key: "abdominalExam", labelKey: "abdominalExam" },
  { key: "skinExam", labelKey: "skinExam" },
  { key: "meningealSigns", labelKey: "meningealSigns" },
  { key: "otherFindings", labelKey: "otherFindings" },
];

const today = () => {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}.`;
};

/** Check if a value is empty / "not mentioned" */
function isEmpty(val: string | undefined): boolean {
  if (!val || !val.trim()) return true;
  const lower = val.trim().toLowerCase();
  const skip = [
    "nije pomenuto", "not mentioned", "non mentionné",
    "negativno", "negative", "denied", "negira",
    "nije pregledano", "not examined", "___",
  ];
  return skip.some((s) => lower.includes(s));
}

function setupFonts(doc: jsPDF) {
  doc.addFileToVFS("Roboto-Regular.ttf", RobotoRegularBase64);
  doc.addFileToVFS("Roboto-Bold.ttf", RobotoBoldBase64);
  doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
  doc.addFont("Roboto-Bold.ttf", "Roboto", "bold");
}

async function loadImageAsBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function generateAnamnezaPdf(
  form: FormData,
  lang = "sr",
  institution?: InstitutionInfo
) {
  const t = getTranslations(lang);
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  setupFonts(doc);

  const pageW = 210;
  const marginL = 18;
  const marginR = 18;
  const contentW = pageW - marginL - marginR;
  let y = 14;

  function checkPage(needed = 12) {
    if (y + needed > 280) {
      doc.addPage();
      y = 14;
    }
  }

  function sectionTitle(title: string) {
    checkPage(14);
    y += 5;
    doc.setFontSize(10);
    doc.setFont("Roboto", "bold");
    doc.text(title, pageW / 2, y, { align: "center" });
    y += 2;
    doc.setLineWidth(0.3);
    doc.line(marginL, y, pageW - marginR, y);
    y += 5;
  }

  function fieldLine(label: string, value: string) {
    checkPage(10);
    doc.setFontSize(8);
    doc.setFont("Roboto", "bold");
    doc.text(label + ":", marginL, y);
    doc.setFont("Roboto", "normal");
    const labelW = doc.getTextWidth(label + ": ");
    const lines = doc.splitTextToSize(value, contentW - labelW - 2);
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
    const lines = doc.splitTextToSize(value, contentW - 4);
    doc.text(lines, marginL + 2, y);
    y += lines.length * 4 + 3;
  }

  /** Draw a table cell border */
  function tableCell(x: number, yy: number, w: number, h: number, text: string, bold = false, fontSize = 7.5) {
    doc.setLineWidth(0.2);
    doc.rect(x, yy, w, h);
    doc.setFontSize(fontSize);
    doc.setFont("Roboto", bold ? "bold" : "normal");
    doc.text(text, x + 1.5, yy + h / 2 + 1);
  }

  /* ===== HEADER WITH LOGO & TABLE ===== */
  const instName = institution?.institution_name || "";
  const instAddr = institution?.institution_address || "";
  const instCity = institution?.institution_city || "";
  const logoUrl = institution?.institution_logo_url || "";

  // Logo
  let logoLoaded = false;
  if (logoUrl) {
    const base64 = await loadImageAsBase64(logoUrl);
    if (base64) {
      try {
        doc.addImage(base64, "PNG", marginL, y - 2, 22, 22);
        logoLoaded = true;
      } catch { /* logo failed, skip */ }
    }
  }

  const logoOffset = logoLoaded ? 26 : 0;
  const headerTextX = marginL + logoOffset;
  const headerTextW = 80 - logoOffset;

  // Institution name & address (left side)
  if (instName) {
    doc.setFontSize(9);
    doc.setFont("Roboto", "bold");
    const nameLines = doc.splitTextToSize(instName, headerTextW);
    doc.text(nameLines, headerTextX, y + 2);
    y += nameLines.length * 4;
  }
  if (instAddr) {
    doc.setFontSize(7.5);
    doc.setFont("Roboto", "normal");
    doc.text(instAddr, headerTextX, y + 2);
    y += 4;
  }
  if (instCity) {
    doc.setFontSize(7.5);
    doc.setFont("Roboto", "normal");
    doc.text(instCity, headerTextX, y + 2);
  }

  // Right-side table (Br. istorije bolesti, JMBG, Adresa, Br. kartona)
  const tableX = 115;
  const labelColW = 35;
  const valColW = 42;
  const rowH = 6;
  let tY = 14;

  const rightTableRows = [
    { label: t.historyNo, value: "___________" },
    { label: t.jmbg, value: "___________" },
    { label: t.address, value: "___________" },
    { label: t.cardNo, value: "___________" },
  ];

  for (const row of rightTableRows) {
    tableCell(tableX, tY, labelColW, rowH, row.label, true, 7);
    tableCell(tableX + labelColW, tY, valColW, rowH, row.value, false, 7);
    tY += rowH;
  }

  y = Math.max(y + 6, tY + 4);

  // Horizontal line
  doc.setLineWidth(0.4);
  doc.line(marginL, y, pageW - marginR, y);
  y += 6;

  /* ===== ANAMNEZA I STATUS PRAESENS title ===== */
  doc.setFontSize(12);
  doc.setFont("Roboto", "bold");
  doc.text(t.anamnesis, pageW / 2, y, { align: "center" });
  y += 8;

  /* ===== PATIENT ===== */
  doc.setFontSize(8);
  doc.setFont("Roboto", "bold");
  doc.text(t.patient, marginL, y);
  doc.setFont("Roboto", "normal");
  const patientLine = `${form.patientName || "___"} - ${form.patientAge || "___"}`;
  doc.text(patientLine, marginL + doc.getTextWidth(t.patient + "   ") + 5, y);
  y += 3;
  doc.setLineWidth(0.3);
  doc.line(marginL, y, pageW - marginR, y);
  y += 6;

  /* ===== RADNE DIJAGNOZE ===== */
  if (!isEmpty(form.diagnosisCodes)) {
    textBlock(t.workingDiagnoses + " (ICD-10)", form.diagnosisCodes!);
  }

  /* ===== NARRATIVE BLOCK — combine chief complaints, present illness, clinical timeline ===== */
  // Following the reference image: the anamnesis body is a continuous narrative
  const narrativeParts: string[] = [];
  if (!isEmpty(form.chiefComplaints)) {
    narrativeParts.push(`${t.chiefComplaints}: ${form.chiefComplaints}`);
  }
  if (!isEmpty(form.presentIllness)) {
    narrativeParts.push(`${t.presentIllness}: ${form.presentIllness}`);
  }
  if (!isEmpty(form.clinicalTimeline)) {
    narrativeParts.push(form.clinicalTimeline!);
  }

  if (narrativeParts.length > 0) {
    checkPage(20);
    doc.setFontSize(8);
    doc.setFont("Roboto", "normal");
    const narrative = narrativeParts.join("\n");
    const lines = doc.splitTextToSize(narrative, contentW - 2);
    doc.text(lines, marginL + 1, y);
    y += lines.length * 3.8 + 4;
  }

  /* ===== ANAMNEZA PO SISTEMIMA (filtered) ===== */
  const hasAnySystems = SYSTEM_CATEGORIES.some((cat) =>
    cat.fields.some((f) => !isEmpty(form[f.key]))
  );

  if (hasAnySystems) {
    // Following the reference: inline format like "OPŠTE TEGOBE: ...\nRESP: ...\nKARDIO: ..."
    checkPage(10);
    y += 2;

    for (const cat of SYSTEM_CATEGORIES) {
      const filledFields = cat.fields.filter((f) => !isEmpty(form[f.key]));
      if (filledFields.length === 0) continue;

      checkPage(8);
      doc.setFontSize(8);
      doc.setFont("Roboto", "bold");
      const catLabel = t[cat.labelKey] + ": ";
      doc.text(catLabel, marginL, y);

      doc.setFont("Roboto", "normal");
      const catLabelW = doc.getTextWidth(catLabel);
      const fieldTexts = filledFields.map((f) => `${t[f.labelKey].toLowerCase()} ${form[f.key]}`).join(", ");
      const lines = doc.splitTextToSize(fieldTexts, contentW - catLabelW - 2);
      doc.text(lines, marginL + catLabelW, y);
      y += Math.max(lines.length * 3.8, 5);
    }
    y += 2;
  }

  /* ===== LIČNA ANAMNEZA (filtered) ===== */
  const personalFields = [
    { key: "allergies", labelKey: "allergies" as const },
    { key: "chronicDiseases", labelKey: "chronicDiseases" as const },
    { key: "surgeries", labelKey: "surgeries" as const },
    { key: "medications", labelKey: "regularTherapy" as const },
  ];
  const filledPersonal = personalFields.filter((f) => !isEmpty(form[f.key]));

  if (filledPersonal.length > 0) {
    checkPage(10);
    doc.setFontSize(8);
    doc.setFont("Roboto", "bold");
    const laLabel = t.personalHistory + ": ";
    doc.text("ЛА:", marginL, y);
    doc.setFont("Roboto", "normal");
    const laContent = filledPersonal.map((f) => `${t[f.labelKey].toLowerCase()} ${form[f.key]}`).join(". ");
    const laLines = doc.splitTextToSize(laContent, contentW - doc.getTextWidth("ЛА: ") - 2);
    doc.text(laLines, marginL + doc.getTextWidth("ЛА: "), y);
    y += Math.max(laLines.length * 3.8, 5) + 2;
  }

  /* ===== PORODIČNA ANAMNEZA ===== */
  if (!isEmpty(form.familyHistory)) {
    fieldLine(t.familyHistory, form.familyHistory!);
  }

  /* ===== SOCIO-EPIDEMIOLOŠKA ===== */
  const socioFields = [
    { key: "livingConditions", labelKey: "livingConditions" as const },
    { key: "smokingAlcohol", labelKey: "smokingAlcohol" as const },
    { key: "epidemiological", labelKey: "epidemiological" as const },
  ];
  const filledSocio = socioFields.filter((f) => !isEmpty(form[f.key]));
  if (filledSocio.length > 0) {
    for (const f of filledSocio) {
      fieldLine(t[f.labelKey], form[f.key]!);
    }
  }

  /* ===== STATUS PRAESENS (filtered) ===== */
  const filledObjective = OBJECTIVE_FIELDS.filter((f) => !isEmpty(form[f.key]));
  if (filledObjective.length > 0) {
    sectionTitle(t.statusPraesens);
    // Narrative style like the reference
    doc.setFontSize(8);
    doc.setFont("Roboto", "normal");
    const statusParts = filledObjective.map((f) => `${t[f.labelKey]}: ${form[f.key]}`);
    const statusText = statusParts.join(". ") + ".";
    const statusLines = doc.splitTextToSize(statusText, contentW - 2);
    checkPage(statusLines.length * 4 + 4);
    doc.text(statusLines, marginL + 1, y);
    y += statusLines.length * 3.8 + 4;
  }

  /* ===== FOOTER / SIGNATURE ===== */
  checkPage(40);
  y += 8;

  // Date and city on left
  const cityForFooter = instCity ? instCity.split(",").pop()?.trim() || "Beograd" : "Beograd";
  doc.setFontSize(8);
  doc.setFont("Roboto", "normal");
  doc.text(`${cityForFooter}, ${today()}`, marginL, y);

  // Stamp placeholder
  doc.text("М.П.", pageW / 2, y, { align: "center" });

  // Doctor signature on right
  doc.text(t.signatureLabel, pageW - marginR - 55, y);
  y += 12;
  doc.line(pageW - marginR - 55, y, pageW - marginR, y);
  y += 4;

  const doctorName = institution?.doctor_name || "";
  if (doctorName) {
    doc.setFont("Roboto", "normal");
    doc.text(doctorName, pageW - marginR - 55, y);
  }

  /* ===== CONSENT FOOTER ===== */
  y += 12;
  checkPage(20);
  doc.setLineWidth(0.3);
  doc.line(marginL, y, pageW - marginR, y);
  y += 4;
  doc.setFontSize(6);
  doc.setFont("Roboto", "normal");
  const consent = lang === "sr"
    ? "OBAVEŠTENA sam o dijagnozi i prognozi bolesti, kratkim opisom, cilju i koristi od predložene medicinske mere, trajanju i mogućim posledicama preduzimanja, odnosno nepreduzimanja predložene medicinske mere, vrsti i verovatnoći mogućih rizika, bolnim i drugim sporednim ili trajnim posledicama, alternativnim metodama lečenja, mogućim promenama stanja posle preduzimanja predložene medicinske mere, kao i mogućnostima nužne promene u načinu života, dejstvu lekova i mogućim sporednim posledicama tog dejstva i PRISTAJEM NA PREDLOŽENU MEDICINSKU MERU, shodno članu 11 i članu 15 Zakona o pravima pacijenata."
    : "I have been informed about the diagnosis and prognosis, the purpose and benefits of the proposed medical procedure, its duration and possible consequences, the nature and probability of possible risks, painful and other side or permanent effects, alternative methods of treatment, and I CONSENT TO THE PROPOSED MEDICAL PROCEDURE in accordance with applicable laws.";
  const consentLines = doc.splitTextToSize(consent, contentW);
  doc.text(consentLines, marginL, y);

  /* ===== OPEN IN NEW TAB ===== */
  const blobUrl = doc.output("bloburl");
  window.open(String(blobUrl), "_blank");
}

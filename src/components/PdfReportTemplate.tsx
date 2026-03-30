import React from "react";

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
  date: string;
  historyNo: string;
  jmbg: string;
  address: string;
  cardNo: string;
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
  consent: string;
  age: string;
  occupation: string;
  socialStatus: string;
  drug: string;
  legalNote: string;
  footerCity: string;
  footerDay: string;
}

const SR: Translations = {
  country: "Република Србија",
  patient: "ПАЦИЈЕНТ",
  nameSurname: "Име и презиме:",
  anamnesis: "АНАМНЕЗА И STATUS PRAESENS",
  workingDiagnoses: "Радне дијагнозе",
  chiefComplaints: "Главне тегобе",
  presentIllness: "Садашња болест",
  clinicalTimeline: "Клиничка хронологија",
  systemAnamnesis: "АНАМНЕЗА ПО СИСТЕМИМА",
  personalHistory: "ЛИЧНА АНАМНЕЗА",
  allergies: "Алергије (ЛА)",
  chronicDiseases: "Хроничне болести",
  surgeries: "Хируршке интервенције",
  regularTherapy: "Редовна терапија",
  familyHistory: "ПОРОДИЧНА АНАМНЕЗА",
  socioEpidemiological: "СОЦИО-ЕПИДЕМИОЛОШКА АНАМНЕЗА",
  livingConditions: "Услови живота",
  smokingAlcohol: "Пушење / Алкохол",
  epidemiological: "Епидемиолошки подаци",
  statusPraesens: "STATUS PRAESENS — ОБЈЕКТИВНИ НАЛАЗ",
  stampLabel: "М.П.",
  signatureLabel: "Потпис и факсимил лекара:",
  date: "Датум",
  historyNo: "Бр. ист. болести:",
  jmbg: "ЈМБГ:",
  address: "Адреса:",
  cardNo: "Бр. картона:",
  cardiovascular: "Кардиоваскуларни",
  chestPain: "Бол у грудима",
  swelling: "Отоци",
  pressure: "Притисак",
  veins: "Вене",
  gastrointestinal: "Гастроинтестинални",
  appetite: "Апетит",
  nausea: "Мучнина",
  swallowing: "Гутање",
  bloating: "Надутост",
  stool: "Столица",
  urogenital: "Урогенитални",
  urination: "Мокрење",
  flankPain: "Бол у слабинама",
  locomotor: "Локомоторни / ЦНС",
  jointPain: "Бол у зглобовима",
  visionHearing: "Вид / Слух",
  dizziness: "Вртоглавица",
  headaches: "Главобоље",
  bloodPressure: "ТА (крвни притисак)",
  pulse: "Пулс",
  temperature: "Температура",
  respiration: "Респирација / SpO₂",
  lungSounds: "Аускултација плућа",
  heartSounds: "Срчани тонови",
  abdominalExam: "Преглед абдомена",
  skinExam: "Кожа",
  meningealSigns: "Менингеални знаци",
  otherFindings: "Остали налази",
  consent: "ОБАВЕШТЕНА сам о дијагнози и прогнози болести, кратким описом, циљу и користи од предложене медицинске мере, трајању и могућим последицама предузимања, односно непредузимања предложене медицинске мере, врсти и вероватноћи могућих ризика, болним и другим споредним или трајним последицама, алтернативним методама лечења, могућим променама стања после предузимања предложене медицинске мере, као и могућностима нужне промене у начину живота, дејству лекова и могућим споредним последицама тог дејства и ПРИСТАЈЕМ НА ПРЕДЛОЖЕНУ МЕДИЦИНСКУ МЕРУ, сходно члану 11 и члану 15 Закона о правима пацијената.",
  age: "Година:",
  occupation: "Занимање:",
  socialStatus: "Социјални статус:",
  drug: "Лек:",
  legalNote: "Овај документ је валидан уз потпис и печат овлашћеног лекара.",
  footerCity: "У",
  footerDay: "дана:",
};

const EN: Translations = {
  country: "Republic of Serbia",
  patient: "PATIENT",
  nameSurname: "Full Name:",
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
  statusPraesens: "STATUS PRAESENS — OBJECTIVE FINDINGS",
  stampLabel: "Stamp",
  signatureLabel: "Physician Signature:",
  date: "Date",
  historyNo: "Medical Record No.:",
  jmbg: "National ID:",
  address: "Address:",
  cardNo: "Card No.:",
  cardiovascular: "Cardiovascular",
  chestPain: "Chest Pain",
  swelling: "Swelling",
  pressure: "Blood Pressure",
  veins: "Veins",
  gastrointestinal: "Gastrointestinal",
  appetite: "Appetite",
  nausea: "Nausea",
  swallowing: "Swallowing",
  bloating: "Bloating",
  stool: "Stool",
  urogenital: "Urogenital",
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
  respiration: "Respiration / SpO₂",
  lungSounds: "Lung Auscultation",
  heartSounds: "Heart Sounds",
  abdominalExam: "Abdominal Exam",
  skinExam: "Skin",
  meningealSigns: "Meningeal Signs",
  otherFindings: "Other Findings",
  consent: "I have been informed about the diagnosis and prognosis, the purpose and benefits of the proposed medical procedure, its duration and possible consequences, the nature and probability of possible risks, and I CONSENT TO THE PROPOSED MEDICAL PROCEDURE in accordance with applicable laws.",
  age: "Age:",
  occupation: "Occupation:",
  socialStatus: "Social Status:",
  drug: "Drug:",
  legalNote: "This document is valid with the signature and stamp of the authorized physician.",
  footerCity: "In",
  footerDay: "on:",
};

const FR: Translations = {
  ...EN,
  country: "République de Serbie",
  anamnesis: "ANAMNÈSE ET STATUS PRAESENS",
  workingDiagnoses: "Diagnostics de travail",
  chiefComplaints: "Plaintes principales",
  presentIllness: "Maladie actuelle",
  clinicalTimeline: "Chronologie clinique",
  statusPraesens: "STATUS PRAESENS — EXAMEN OBJECTIF",
  signatureLabel: "Signature du médecin:",
  date: "Date",
  legalNote: "Ce document est valide avec la signature et le cachet du médecin autorisé.",
  footerCity: "À",
  footerDay: "le:",
};

function getT(lang: string): Translations {
  if (lang === "sr") return SR;
  if (lang === "fr") return FR;
  return EN;
}

function isEmpty(val: string | undefined): boolean {
  if (!val || !val.trim()) return true;
  const lower = val.trim().toLowerCase();
  const skip = [
    "nije pomenuto", "not mentioned", "non mentionné",
    "negativno", "negative", "denied", "negira",
    "nije pregledano", "not examined", "nije određeno", "___",
  ];
  return skip.some((s) => lower.includes(s));
}

const today = () => {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}.`;
};

interface SystemCat {
  labelKey: keyof Translations;
  fields: { key: string; labelKey: keyof Translations }[];
}

const SYSTEM_CATEGORIES: SystemCat[] = [
  { labelKey: "cardiovascular", fields: [
    { key: "chestPain", labelKey: "chestPain" }, { key: "swelling", labelKey: "swelling" },
    { key: "pressure", labelKey: "pressure" }, { key: "veins", labelKey: "veins" },
  ]},
  { labelKey: "gastrointestinal", fields: [
    { key: "appetite", labelKey: "appetite" }, { key: "nausea", labelKey: "nausea" },
    { key: "swallowing", labelKey: "swallowing" }, { key: "bloating", labelKey: "bloating" },
    { key: "stool", labelKey: "stool" },
  ]},
  { labelKey: "urogenital", fields: [
    { key: "urination", labelKey: "urination" }, { key: "flankPain", labelKey: "flankPain" },
  ]},
  { labelKey: "locomotor", fields: [
    { key: "jointPain", labelKey: "jointPain" }, { key: "visionHearing", labelKey: "visionHearing" },
    { key: "dizziness", labelKey: "dizziness" }, { key: "headaches", labelKey: "headaches" },
  ]},
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

const PERSONAL_FIELDS: { key: string; labelKey: keyof Translations }[] = [
  { key: "allergies", labelKey: "allergies" },
  { key: "chronicDiseases", labelKey: "chronicDiseases" },
  { key: "surgeries", labelKey: "surgeries" },
  { key: "medications", labelKey: "regularTherapy" },
];

const SOCIO_FIELDS: { key: string; labelKey: keyof Translations }[] = [
  { key: "livingConditions", labelKey: "livingConditions" },
  { key: "smokingAlcohol", labelKey: "smokingAlcohol" },
  { key: "epidemiological", labelKey: "epidemiological" },
];

/* ====== Styles ====== */
const C = {
  border: "#444",
  borderLight: "#aaa",
  headerBg: "#f0f0f0",
  labelBg: "#f7f7f7",
  sectionBg: "#e8e8e8",
};

const S = {
  page: {
    width: "794px",
    minHeight: "1123px",
    padding: "36px 44px 40px 44px",
    fontFamily: "'Segoe UI', 'DejaVu Sans', 'Arial', sans-serif",
    fontSize: "10.5px",
    lineHeight: "1.55",
    color: "#111",
    background: "#fff",
    boxSizing: "border-box" as const,
  },
  /* Header - institution block */
  headerWrap: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "stretch",
    gap: "16px",
    marginBottom: "6px",
  },
  instBlock: {
    flex: "1",
    paddingTop: "2px",
  },
  instCountry: {
    fontSize: "9px",
    color: "#555",
    letterSpacing: "0.5px",
    textTransform: "uppercase" as const,
    marginBottom: "3px",
  },
  instName: {
    fontSize: "13px",
    fontWeight: "700" as const,
    color: "#111",
    marginBottom: "2px",
    lineHeight: "1.3",
  },
  instDetail: {
    fontSize: "9.5px",
    color: "#444",
    lineHeight: "1.4",
  },
  /* Patient data table (top-right) */
  patientTable: {
    borderCollapse: "collapse" as const,
    fontSize: "9.5px",
    border: `1.5px solid ${C.border}`,
  },
  ptTdLabel: {
    border: `1px solid ${C.border}`,
    padding: "3px 8px",
    fontWeight: "600" as const,
    background: C.headerBg,
    whiteSpace: "nowrap" as const,
    color: "#222",
    width: "120px",
  },
  ptTdVal: {
    border: `1px solid ${C.border}`,
    padding: "3px 10px",
    minWidth: "140px",
    color: "#111",
    fontWeight: "500" as const,
  },
  /* Divider */
  hrThick: {
    border: "none",
    borderTop: `2px solid ${C.border}`,
    margin: "8px 0",
  },
  hrThin: {
    border: "none",
    borderTop: `1px solid ${C.borderLight}`,
    margin: "6px 0",
  },
  /* Title */
  mainTitle: {
    textAlign: "center" as const,
    fontSize: "14px",
    fontWeight: "800" as const,
    margin: "6px 0 4px 0",
    letterSpacing: "1.5px",
    textTransform: "uppercase" as const,
    color: "#111",
  },
  /* Patient info row below title */
  patientRow: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: "0px 24px",
    padding: "6px 10px",
    background: C.labelBg,
    border: `1px solid ${C.borderLight}`,
    borderRadius: "2px",
    marginBottom: "8px",
    fontSize: "10px",
  },
  patientField: {
    display: "flex",
    gap: "4px",
  },
  /* Section headers */
  sectionHeader: {
    fontSize: "10.5px",
    fontWeight: "700" as const,
    color: "#111",
    padding: "4px 10px",
    background: C.sectionBg,
    border: `1px solid ${C.borderLight}`,
    borderRadius: "1px",
    margin: "10px 0 5px 0",
    letterSpacing: "0.8px",
    textTransform: "uppercase" as const,
  },
  subSectionHeader: {
    fontSize: "10px",
    fontWeight: "600" as const,
    color: "#333",
    borderBottom: `1px solid ${C.borderLight}`,
    paddingBottom: "2px",
    margin: "8px 0 4px 0",
  },
  /* Content blocks */
  contentBlock: {
    padding: "4px 10px 6px 10px",
    fontSize: "10.5px",
    lineHeight: "1.6",
    color: "#222",
    whiteSpace: "pre-wrap" as const,
  },
  /* Field grid for objective findings */
  fieldGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "2px 16px",
    padding: "4px 10px",
  },
  fieldItem: {
    display: "flex",
    gap: "6px",
    padding: "2px 0",
    fontSize: "10px",
    borderBottom: `1px dotted #ddd`,
  },
  fieldLabel: {
    fontWeight: "600" as const,
    color: "#333",
    minWidth: "130px",
    flexShrink: 0,
  },
  fieldValue: {
    color: "#111",
  },
  /* Diagnosis box */
  diagBox: {
    padding: "6px 10px",
    background: "#fafafa",
    border: `1.5px solid ${C.border}`,
    borderRadius: "2px",
    marginBottom: "6px",
    fontSize: "10.5px",
  },
  diagLabel: {
    fontWeight: "700" as const,
    color: "#111",
    marginBottom: "2px",
    fontSize: "10px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
  },
  /* Personal history list */
  personalList: {
    padding: "4px 10px",
    fontSize: "10.5px",
  },
  personalItem: {
    display: "flex",
    gap: "6px",
    padding: "3px 0",
    borderBottom: `1px dotted #ddd`,
  },
  /* Systems review compact */
  systemRow: {
    padding: "3px 10px",
    fontSize: "10px",
    display: "flex",
    gap: "6px",
  },
  systemLabel: {
    fontWeight: "600" as const,
    color: "#444",
    minWidth: "100px",
    textTransform: "uppercase" as const,
    fontSize: "9px",
    letterSpacing: "0.3px",
  },
  systemValue: {
    color: "#222",
    flex: "1",
  },
  /* Footer */
  footer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: "50px",
    paddingTop: "16px",
    fontSize: "11px",
    fontFamily: "'Times New Roman', 'Georgia', 'DejaVu Serif', serif",
  },
  footerLeft: {
    flex: "1",
    fontFamily: "'Times New Roman', 'Georgia', 'DejaVu Serif', serif",
    fontSize: "11px",
  },
  stampBox: {
    width: "100px",
    height: "100px",
    border: "1.5px dashed #999",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "10px",
    color: "#999",
    fontFamily: "'Times New Roman', 'Georgia', 'DejaVu Serif', serif",
    margin: "0 16px",
    borderRadius: "2px",
  },
  footerRight: {
    textAlign: "center" as const,
    fontFamily: "'Times New Roman', 'Georgia', 'DejaVu Serif', serif",
    fontSize: "11px",
  },
  signLine: {
    borderTop: "1px solid #333",
    width: "200px",
    marginTop: "36px",
    paddingTop: "6px",
    textAlign: "center" as const,
  },
  legalNote: {
    fontSize: "7px",
    color: "#666",
    marginTop: "14px",
    fontFamily: "'Times New Roman', 'Georgia', 'DejaVu Serif', serif",
    textAlign: "center" as const,
    fontStyle: "italic" as const,
  } as React.CSSProperties,
  consent: {
    fontSize: "7.5px",
    color: "#444",
    borderTop: `1px solid ${C.borderLight}`,
    marginTop: "10px",
    paddingTop: "6px",
    lineHeight: "1.4",
  },
};

interface Props {
  form: FormData;
  lang: string;
  institution?: InstitutionInfo;
}

const PdfReportTemplate: React.FC<Props> = ({ form, lang, institution }) => {
  const t = getT(lang);
  const instName = institution?.institution_name || "";
  const instAddr = institution?.institution_address || "";
  const instCity = institution?.institution_city || "";
  const doctorName = institution?.doctor_name || "";
  const cityForFooter = instCity ? (instCity.split(",").pop()?.trim() || "Beograd") : "Beograd";

  // Narrative sections
  const chiefComplaintsText = !isEmpty(form.chiefComplaints) ? form.chiefComplaints : "";
  const presentIllnessText = !isEmpty(form.presentIllness) ? form.presentIllness : "";
  const clinicalTimelineText = !isEmpty(form.clinicalTimeline) ? form.clinicalTimeline : "";

  // Systems
  const filledSystems = SYSTEM_CATEGORIES.map(cat => ({
    ...cat,
    filledFields: cat.fields.filter(f => !isEmpty(form[f.key])),
  })).filter(cat => cat.filledFields.length > 0);

  // Personal
  const filledPersonal = PERSONAL_FIELDS.filter(f => !isEmpty(form[f.key]));

  // Socio
  const filledSocio = SOCIO_FIELDS.filter(f => !isEmpty(form[f.key]));

  // Objective
  const filledObjective = OBJECTIVE_FIELDS.filter(f => !isEmpty(form[f.key]));

  const patientName = form.patientName || "___";
  const patientAge = form.patientAge || "";
  const patientOccupation = form.patientOccupation || "";
  const patientSocialStatus = form.patientSocialStatus || "";

  return (
    <div style={S.page}>
      {/* ===== HEADER ===== */}
      <div style={S.headerWrap}>
        {/* Left: Institution */}
        <div style={S.instBlock}>
          <div style={S.instCountry}>{t.country}</div>
          {instName && <div style={S.instName}>{instName}</div>}
          {instAddr && <div style={S.instDetail}>{instAddr}</div>}
          {instCity && <div style={S.instDetail}>{instCity}</div>}
        </div>

        {/* Right: Patient data table */}
        <table style={S.patientTable}>
          <tbody>
            <tr>
              <td style={S.ptTdLabel}>{t.nameSurname}</td>
              <td style={S.ptTdVal}>{patientName}</td>
            </tr>
            <tr>
              <td style={S.ptTdLabel}>{t.age}</td>
              <td style={S.ptTdVal}>{patientAge || "—"}</td>
            </tr>
            <tr>
              <td style={S.ptTdLabel}>{t.jmbg}</td>
              <td style={S.ptTdVal}>{form.jmbg || ""}</td>
            </tr>
            <tr>
              <td style={S.ptTdLabel}>{t.address}</td>
              <td style={S.ptTdVal}>{form.patientAddress || ""}</td>
            </tr>
            <tr>
              <td style={S.ptTdLabel}>{t.occupation}</td>
              <td style={S.ptTdVal}>{patientOccupation || "—"}</td>
            </tr>
            <tr>
              <td style={S.ptTdLabel}>{t.historyNo}</td>
              <td style={S.ptTdVal}>{form.historyNo || ""}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <hr style={S.hrThick} />

      {/* ===== TITLE ===== */}
      <div style={S.mainTitle}>{t.anamnesis}</div>

      <hr style={S.hrThin} />

      {/* ===== DIAGNOSES ===== */}
      {!isEmpty(form.diagnosisCodes) && (
        <div style={S.diagBox}>
          <div style={S.diagLabel}>{t.workingDiagnoses} (ICD-10):</div>
          <div>{form.diagnosisCodes}</div>
        </div>
      )}

      {/* ===== CHIEF COMPLAINTS ===== */}
      {chiefComplaintsText && (
        <>
          <div style={S.sectionHeader}>{t.chiefComplaints}</div>
          <div style={S.contentBlock}>{chiefComplaintsText}</div>
        </>
      )}

      {/* ===== PRESENT ILLNESS ===== */}
      {presentIllnessText && (
        <>
          <div style={S.sectionHeader}>{t.presentIllness}</div>
          <div style={S.contentBlock}>{presentIllnessText}</div>
        </>
      )}

      {/* ===== CLINICAL TIMELINE ===== */}
      {clinicalTimelineText && (
        <>
          <div style={S.subSectionHeader}>{t.clinicalTimeline}</div>
          <div style={S.contentBlock}>{clinicalTimelineText}</div>
        </>
      )}

      {/* ===== REVIEW OF SYSTEMS ===== */}
      {filledSystems.length > 0 && (
        <>
          <div style={S.sectionHeader}>{t.systemAnamnesis}</div>
          {filledSystems.map((cat) => (
            <div key={cat.labelKey} style={S.systemRow}>
              <span style={S.systemLabel}>{t[cat.labelKey]}:</span>
              <span style={S.systemValue}>
                {cat.filledFields.map(f => `${t[f.labelKey]}: ${form[f.key]}`).join(" · ")}
              </span>
            </div>
          ))}
        </>
      )}

      {/* ===== PERSONAL HISTORY ===== */}
      {filledPersonal.length > 0 && (
        <>
          <div style={S.sectionHeader}>{t.personalHistory}</div>
          <div style={S.personalList}>
            {filledPersonal.map(f => (
              <div key={f.key} style={S.personalItem}>
                <span style={S.fieldLabel}>{t[f.labelKey]}:</span>
                <span style={S.fieldValue}>{form[f.key]}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ===== FAMILY HISTORY ===== */}
      {!isEmpty(form.familyHistory) && (
        <>
          <div style={S.sectionHeader}>{t.familyHistory}</div>
          <div style={S.contentBlock}>{form.familyHistory}</div>
        </>
      )}

      {/* ===== SOCIO-EPIDEMIOLOGICAL ===== */}
      {filledSocio.length > 0 && (
        <>
          <div style={S.sectionHeader}>{t.socioEpidemiological}</div>
          <div style={S.personalList}>
            {filledSocio.map(f => (
              <div key={f.key} style={S.personalItem}>
                <span style={S.fieldLabel}>{t[f.labelKey]}:</span>
                <span style={S.fieldValue}>{form[f.key]}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ===== STATUS PRAESENS ===== */}
      {filledObjective.length > 0 && (
        <>
          <div style={S.sectionHeader}>{t.statusPraesens}</div>
          <div style={S.fieldGrid}>
            {filledObjective.map(f => (
              <div key={f.key} style={S.fieldItem}>
                <span style={S.fieldLabel}>{t[f.labelKey]}:</span>
                <span style={S.fieldValue}>{form[f.key]}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ===== THERAPY (drug) ===== */}
      {!isEmpty(form.drug) && (
        <>
          <div style={S.subSectionHeader}>{t.drug}</div>
          <div style={S.contentBlock}>{form.drug}</div>
        </>
      )}

      {/* ===== FOOTER ===== */}
      <div style={S.footer}>
        <div style={S.footerLeft}>
          <div>{t.footerCity} {cityForFooter}, {t.footerDay} {today()}</div>
        </div>
        <div style={S.stampBox}>
          {t.stampLabel}
        </div>
        <div style={S.footerRight}>
          <div style={S.signLine}>
            <div>{t.signatureLabel}</div>
            {doctorName && <div style={{ marginTop: "4px", fontWeight: "bold" as const }}>{doctorName}</div>}
          </div>
        </div>
      </div>

      {/* LEGAL NOTE */}
      <div style={S.legalNote}>
        {t.legalNote}
      </div>

      {/* CONSENT */}
      <div style={S.consent}>{t.consent}</div>
    </div>
  );
};

export default PdfReportTemplate;
export type { FormData as PdfFormData, InstitutionInfo as PdfInstitutionInfo };

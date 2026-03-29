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
}

const SR: Translations = {
  country: "Република Србија",
  patient: "ПАЦИЈЕНТ",
  nameSurname: "Име и презиме",
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
  stampLabel: "М.П.",
  signatureLabel: "Потпис и факсимил лекара:",
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
  consent: "ОБАВЕШТЕНА сам о дијагнози и прогнози болести, кратким описом, циљу и користи од предложене медицинске мере, трајању и могућим последицама предузимања, односно непредузимања предложене медицинске мере, врсти и вероватноћи могућих ризика, болним и другим споредним или трајним последицама, алтернативним методама лечења, могућим променама стања после предузимања предложене медицинске мере, као и могућностима нужне промене у начину живота, дејству лекова и могућим споредним последицама тог дејства и ПРИСТАЈЕМ НА ПРЕДЛОЖЕНУ МЕДИЦИНСКУ МЕРУ, сходно члану 11 и члану 15 Закона о правима пацијената.",
};

const EN: Translations = {
  country: "Republic of Serbia",
  patient: "PATIENT",
  nameSurname: "Full Name",
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
  stampLabel: "Stamp",
  signatureLabel: "Physician Signature:",
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
  consent: "I have been informed about the diagnosis and prognosis, the purpose and benefits of the proposed medical procedure, its duration and possible consequences, the nature and probability of possible risks, and I CONSENT TO THE PROPOSED MEDICAL PROCEDURE in accordance with applicable laws.",
};

const FR: Translations = {
  ...EN,
  country: "République de Serbie",
  anamnesis: "ANAMNÈSE ET STATUS PRAESENS",
  workingDiagnoses: "Diagnostics de travail",
  chiefComplaints: "Plaintes principales",
  presentIllness: "Maladie actuelle",
  clinicalTimeline: "Chronologie clinique",
  statusPraesens: "STATUS PRAESENS",
  signatureLabel: "Signature du médecin:",
  date: "Date",
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

/* ====== Styles (inline for html2canvas) ====== */
const S = {
  page: {
    width: "794px",
    minHeight: "1123px",
    padding: "40px 50px",
    fontFamily: "'Segoe UI', 'DejaVu Sans', 'Arial', sans-serif",
    fontSize: "11px",
    lineHeight: "1.5",
    color: "#111",
    background: "#fff",
    boxSizing: "border-box" as const,
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "12px",
  },
  headerLeft: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    flex: "1",
  },
  instName: {
    fontSize: "13px",
    fontWeight: "bold" as const,
    marginBottom: "2px",
  },
  instDetail: {
    fontSize: "10px",
    color: "#333",
  },
  rightTable: {
    borderCollapse: "collapse" as const,
    fontSize: "10px",
  },
  td: {
    border: "1px solid #333",
    padding: "3px 8px",
    minWidth: "90px",
  },
  tdLabel: {
    border: "1px solid #333",
    padding: "3px 8px",
    fontWeight: "bold" as const,
    background: "#f5f5f5",
    whiteSpace: "nowrap" as const,
  },
  hr: {
    border: "none",
    borderTop: "1.5px solid #333",
    margin: "10px 0",
  },
  title: {
    textAlign: "center" as const,
    fontSize: "14px",
    fontWeight: "bold" as const,
    margin: "10px 0",
    letterSpacing: "1px",
  },
  sectionTitle: {
    fontSize: "11px",
    fontWeight: "bold" as const,
    margin: "12px 0 4px 0",
    borderBottom: "1px solid #999",
    paddingBottom: "2px",
    textAlign: "center" as const,
  },
  fieldRow: {
    marginBottom: "3px",
  },
  boldLabel: {
    fontWeight: "bold" as const,
  },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: "60px",
    paddingTop: "20px",
    fontSize: "11px",
    fontFamily: "'Times New Roman', 'Georgia', 'DejaVu Serif', serif",
  },
  footerLeft: {
    flex: "1",
    fontFamily: "'Times New Roman', 'Georgia', 'DejaVu Serif', serif",
    fontSize: "11px",
  },
  stampBox: {
    width: "113px",
    height: "113px",
    border: "1px dashed #999",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "10px",
    color: "#999",
    fontFamily: "'Times New Roman', 'Georgia', 'DejaVu Serif', serif",
    margin: "0 20px",
  },
  footerRight: {
    textAlign: "center" as const,
    fontFamily: "'Times New Roman', 'Georgia', 'DejaVu Serif', serif",
    fontSize: "11px",
  },
  signLine: {
    borderTop: "1px solid #333",
    width: "200px",
    marginTop: "40px",
    paddingTop: "6px",
    textAlign: "center" as const,
  },
  legalNote: {
    fontSize: "7px",
    color: "#666",
    marginTop: "16px",
    fontFamily: "'Times New Roman', 'Georgia', 'DejaVu Serif', serif",
    textAlign: "center" as const,
    fontStyle: "italic" as const,
  },
  consent: {
    fontSize: "8px",
    color: "#444",
    borderTop: "1px solid #999",
    marginTop: "12px",
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
  const logoUrl = institution?.institution_logo_url || "";
  const doctorName = institution?.doctor_name || "";
  const cityForFooter = instCity ? (instCity.split(",").pop()?.trim() || "Beograd") : "Beograd";

  // Narrative
  const narrativeParts: string[] = [];
  if (!isEmpty(form.chiefComplaints)) narrativeParts.push(`${t.chiefComplaints}: ${form.chiefComplaints}`);
  if (!isEmpty(form.presentIllness)) narrativeParts.push(`${t.presentIllness}: ${form.presentIllness}`);
  if (!isEmpty(form.clinicalTimeline)) narrativeParts.push(form.clinicalTimeline);

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

  return (
    <div style={S.page}>
      {/* HEADER */}
      <div style={S.headerRow}>
        <div style={S.headerLeft}>
          {logoUrl && <img src={logoUrl} style={S.logo} crossOrigin="anonymous" />}
          <div>
            {instName && <div style={S.instName}>{instName}</div>}
            {instAddr && <div style={S.instDetail}>{instAddr}</div>}
            {instCity && <div style={S.instDetail}>{instCity}</div>}
          </div>
        </div>
        <table style={S.rightTable}>
          <tbody>
            <tr><td style={S.tdLabel}>{t.historyNo}</td><td style={S.td}></td></tr>
            <tr><td style={S.tdLabel}>{t.jmbg}</td><td style={S.td}></td></tr>
            <tr><td style={S.tdLabel}>{t.address}</td><td style={S.td}></td></tr>
            <tr><td style={S.tdLabel}>{t.cardNo}</td><td style={S.td}></td></tr>
          </tbody>
        </table>
      </div>

      <hr style={S.hr} />

      {/* TITLE */}
      <div style={S.title}>{t.anamnesis}</div>

      {/* PATIENT LINE */}
      <div style={S.fieldRow}>
        <span style={S.boldLabel}>{t.patient}: </span>
        {form.patientName || "___"} — {form.patientAge || "___"}
      </div>

      <hr style={S.hr} />

      {/* DIAGNOSES */}
      {!isEmpty(form.diagnosisCodes) && (
        <div style={S.fieldRow}>
          <span style={S.boldLabel}>{t.workingDiagnoses} (ICD-10): </span>
          {form.diagnosisCodes}
        </div>
      )}

      {/* NARRATIVE */}
      {narrativeParts.length > 0 && (
        <div style={{ ...S.fieldRow, whiteSpace: "pre-wrap", marginTop: "8px" }}>
          {narrativeParts.join("\n")}
        </div>
      )}

      {/* SYSTEMS */}
      {filledSystems.length > 0 && (
        <div style={{ marginTop: "8px" }}>
          {filledSystems.map((cat) => (
            <div key={cat.labelKey} style={S.fieldRow}>
              <span style={S.boldLabel}>{t[cat.labelKey]}: </span>
              {cat.filledFields.map(f => `${t[f.labelKey].toLowerCase()} ${form[f.key]}`).join(", ")}
            </div>
          ))}
        </div>
      )}

      {/* PERSONAL HISTORY */}
      {filledPersonal.length > 0 && (
        <div style={S.fieldRow}>
          <span style={S.boldLabel}>{t.personalHistory}: </span>
          {filledPersonal.map(f => `${t[f.labelKey].toLowerCase()} ${form[f.key]}`).join(". ")}
        </div>
      )}

      {/* FAMILY HISTORY */}
      {!isEmpty(form.familyHistory) && (
        <div style={S.fieldRow}>
          <span style={S.boldLabel}>{t.familyHistory}: </span>
          {form.familyHistory}
        </div>
      )}

      {/* SOCIO-EPIDEMIOLOGICAL */}
      {filledSocio.length > 0 && filledSocio.map(f => (
        <div key={f.key} style={S.fieldRow}>
          <span style={S.boldLabel}>{t[f.labelKey]}: </span>
          {form[f.key]}
        </div>
      ))}

      {/* STATUS PRAESENS */}
      {filledObjective.length > 0 && (
        <>
          <div style={S.sectionTitle}>{t.statusPraesens}</div>
          <div style={S.fieldRow}>
            {filledObjective.map(f => `${t[f.labelKey]}: ${form[f.key]}`).join(". ")}.
          </div>
        </>
      )}

      {/* FOOTER */}
      <div style={S.footer}>
        <div>
          <div>{cityForFooter}, {today()}</div>
        </div>
        <div style={{ textAlign: "center" as const }}>{t.stampLabel}</div>
        <div>
          <div style={S.signLine}>
            {doctorName && <div>{doctorName}</div>}
            <div>{t.signatureLabel}</div>
          </div>
        </div>
      </div>

      {/* CONSENT */}
      <div style={S.consent}>{t.consent}</div>
    </div>
  );
};

export default PdfReportTemplate;
export type { FormData as PdfFormData, InstitutionInfo as PdfInstitutionInfo };

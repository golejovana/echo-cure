import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FIELDS = [
  "patientName", "patientAge", "patientOccupation", "patientSocialStatus",
  "chiefComplaints", "presentIllness", "clinicalTimeline",
  "diagnosisCodes",
  "chestPain", "swelling", "pressure", "veins",
  "appetite", "nausea", "swallowing", "bloating", "stool",
  "urination", "flankPain",
  "jointPain", "visionHearing", "dizziness", "headaches",
  "allergies", "chronicDiseases", "surgeries", "medications",
  "familyHistory",
  "livingConditions", "smokingAlcohol", "epidemiological",
  "bloodPressure", "pulse", "temperature", "respiration",
  "lungSounds", "heartSounds", "abdominalExam", "skinExam", "meningealSigns", "otherFindings",
  "diarizedTranscript",
] as const;

type OutputLanguage = "Serbian" | "English" | "French";

const REPORT_PROPERTIES = {
  patientName: { type: "string", description: "Patient full name / Ime i prezime" },
  patientAge: { type: "string", description: "Age or year of birth / Godište" },
  patientOccupation: { type: "string", description: "Occupation / Zanimanje" },
  patientSocialStatus: { type: "string", description: "Social/marital status, living situation" },
  chiefComplaints: { type: "string", description: "Glavne tegobe / Chief complaints" },
  presentIllness: { type: "string", description: "Sadašnja bolest / Present illness - detailed narrative" },
  clinicalTimeline: { type: "string", description: "Timeline: onset, hospitals, treatments, procedures" },
  diagnosisCodes: { type: "string", description: "ICD-10 codes, one per line: CODE - Description" },
  chestPain: { type: "string" },
  swelling: { type: "string" },
  pressure: { type: "string" },
  veins: { type: "string" },
  appetite: { type: "string" },
  nausea: { type: "string" },
  swallowing: { type: "string" },
  bloating: { type: "string" },
  stool: { type: "string" },
  urination: { type: "string" },
  flankPain: { type: "string" },
  jointPain: { type: "string" },
  visionHearing: { type: "string" },
  dizziness: { type: "string" },
  headaches: { type: "string" },
  allergies: { type: "string", description: "Alergije" },
  chronicDiseases: { type: "string", description: "Hronične bolesti" },
  surgeries: { type: "string", description: "Hirurške intervencije" },
  medications: { type: "string", description: "Redovna terapija" },
  familyHistory: { type: "string", description: "Porodična anamneza" },
  livingConditions: { type: "string", description: "Uslovi života, kućni ljubimci, putovanja" },
  smokingAlcohol: { type: "string", description: "Pušenje i alkohol" },
  epidemiological: { type: "string", description: "Epidemiološki podaci - kontakt sa obolelima, ubodi, rizici" },
  bloodPressure: { type: "string", description: "TA value" },
  pulse: { type: "string", description: "Pulse rate and character" },
  temperature: { type: "string", description: "Body temperature" },
  respiration: { type: "string", description: "Respiratory rate, SpO2" },
  lungSounds: { type: "string", description: "Lung auscultation findings" },
  heartSounds: { type: "string", description: "Heart auscultation findings" },
  abdominalExam: { type: "string", description: "Abdominal examination findings" },
  skinExam: { type: "string", description: "Skin examination findings" },
  meningealSigns: { type: "string", description: "Meningeal signs assessment" },
  otherFindings: { type: "string", description: "Any other objective findings" },
  diarizedTranscript: { type: "string", description: "Full transcript reformatted as a dialogue with 'Doktor:' and 'Pacijent:' labels on each line" },
};

const REPORT_TOOL = {
  type: "function",
  function: {
    name: "fill_medical_report",
    description: "Fill the structured medical report (Anamneza i Status Praesens) extracted from the transcript",
    parameters: {
      type: "object",
      properties: REPORT_PROPERTIES,
      required: [...FIELDS],
      additionalProperties: false,
    },
  },
} as const;

const ENGLISH_MARKERS = /\b(Denies|Negative|Not mentioned|Not examined|Present|Normal|married|years old|Father|Mother|lives|Smoked|Conscious|Pulse|Appendectomy|cataract|surgery|house|village)\b/i;
const SERBIAN_MARKERS = /\b(negira|nije pomenuto|nije pregledano|prisutan|prisutna|prisutno|normalan|normalna|udata|oženjen|godina|otac|majka|živi|pušila|svestan|svesna|puls)\b/i;
const FRENCH_MARKERS = /\b(nie|non mentionné|non examiné|présent|présente|normal|marié|mariée|ans|père|mère|vit|fumait|conscient|consciente)\b/i;

function detectFallbackOutputLanguage(transcript: string): OutputLanguage {
  const sample = (transcript || "").slice(0, 200);
  const cyrillicCount = (sample.match(/[\u0400-\u04FF]/g) || []).length;
  const latinCount = (sample.match(/[a-zA-Z]/g) || []).length;
  const serbianLatinIndicators = /[čćšžđČĆŠŽĐ]|\b(je|su|nije|negira|pacijent|pacijentkinja|tegobe|bol|bolovi|prisutan|prisutna|normalan|normalna|povišena|porodična|anamneza|pregled|stolica|mokrenje|vrtoglavica|glavobolja|pušila|alkohol|slezina|koža|bolest|udata|oženjen|dece|godine)\b/gi;
  const serbianLatinCount = (sample.match(serbianLatinIndicators) || []).length;
  const frenchIndicators = /[\u00e0\u00e2\u00e7\u00e8\u00e9\u00ea\u00ee\u00f4\u00f9\u00fb\u00fc\u0153]|\b(le|la|les|un|une|des|du|est|sont|dans|avec|pour|qui|que|nous|vous|ils|elles|cette|mais)\b/gi;
  const frenchCount = (sample.match(frenchIndicators) || []).length;

  if (cyrillicCount > 0 || serbianLatinCount >= 3) return "Serbian";
  if (frenchCount > 5) return "French";
  if (latinCount > 0) return "English";
  return "Serbian";
}

function resolveOutputLanguage(rawOutputLanguage: unknown, transcript: string): OutputLanguage {
  if (rawOutputLanguage === "Serbian" || rawOutputLanguage === "English" || rawOutputLanguage === "French") {
    return rawOutputLanguage;
  }
  return detectFallbackOutputLanguage(transcript);
}

function getLanguagePhrases(outputLang: OutputLanguage) {
  switch (outputLang) {
    case "Serbian":
      return {
        notMentioned: "Nije pomenuto u transkriptu",
        notDetermined: "Nije određeno iz transkripta",
        denied: "Negativno / Negira",
        deniesAllergies: "Negira alergije",
        noSurgeries: "Nije imao/la hirurške intervencije",
        notExamined: "Nije pregledano / Nije pomenuto",
        directive: `Write ALL extracted field values EXCLUSIVELY in Serbian, using Serbian Latin script. The selected UI language is the source of truth. Do NOT output English or French sentences in any field. Translate every extracted value into Serbian when needed. Examples: "Denies allergies" -> "Negira alergije", "Not mentioned in transcript" -> "Nije pomenuto u transkriptu", "Present" -> "Prisutno", "married, three children" -> "udata, troje dece", "48 years old, born 1977" -> "48 godina, rođena 1977.".`,
      };
    case "French":
      return {
        notMentioned: "Non mentionné dans la transcription",
        notDetermined: "Non déterminé à partir de la transcription",
        denied: "Négatif / Négation",
        deniesAllergies: "Nie les allergies",
        noSurgeries: "Aucune intervention chirurgicale antérieure",
        notExamined: "Non examiné / Non mentionné",
        directive: "Write ALL extracted field values exclusively in French. The selected UI language is the source of truth. Do not output Serbian or English sentences in any field.",
      };
    default:
      return {
        notMentioned: "Not mentioned in transcript",
        notDetermined: "Not determined from transcript",
        denied: "Negative / Denied",
        deniesAllergies: "Denies allergies",
        noSurgeries: "No previous surgeries",
        notExamined: "Not examined / Not mentioned",
        directive: "Write ALL extracted field values exclusively in English. The selected UI language is the source of truth. Do not output Serbian or French sentences in any field.",
      };
  }
}

function buildExtractionPrompt(outputLang: OutputLanguage): string {
  const phrases = getLanguagePhrases(outputLang);

  return `You are a senior clinical information extractor working in a Serbian university hospital. You receive a raw voice transcript from a doctor describing a patient case — possibly in Serbian, English, French, or a mix. Your job is to extract ALL available information and map it into a structured medical report following the standard Serbian "Anamneza i Status Praesens" format.

Do NOT invent or hallucinate data. Only extract what is explicitly stated or clearly implied.

UI LANGUAGE OVERRIDE: The requested output language is ${outputLang}. This explicit UI selection is the PRIMARY signal and OVERRIDES transcript language detection.

CRITICAL LANGUAGE RULE: ${phrases.directive}

You may read a transcript written in one language and STILL must return the final field values in ${outputLang}. Do not keep the output in the transcript's language if the requested output language is different.

EXTRACTION RULES:

1. PATIENT IDENTITY: Extract name, age/year of birth, occupation, social/marital status. If not mentioned, set to "${phrases.notMentioned}".

2. RADNE DIJAGNOZE (ICD-10): If the doctor mentions or implies specific diagnoses, provide ICD-10 codes formatted as "CODE - Description". One per line. The description must be in ${outputLang}. If uncertain, "${phrases.notDetermined}".

3. GLAVNE TEGOBE (Chief Complaints): The patient's primary reason for the visit. Brief, 1-3 sentences.

4. SADAŠNJA BOLEST (Present Illness): Full detailed narrative of the current illness — progression, context, lab results mentioned, imaging results, treatments tried. Write as a coherent clinical narrative paragraph.

5. KLINIČKA HRONOLOGIJA (Clinical Timeline): Extract the history — when illness started, which hospitals they visited, what medications were prescribed, what procedures were done. Write as a coherent timeline.

6. ANAMNEZA PO SISTEMIMA (Systems Review): Map symptoms to the correct category. For denied symptoms, write "${phrases.denied}" — do NOT leave blank. For symptoms not discussed at all, write "${phrases.notMentioned}".

7. LIČNA ANAMNEZA (Personal History):
   - allergies: Allergies to medications, food, environment. If denied, "${phrases.deniesAllergies}".
   - chronicDiseases: Known chronic conditions.
   - surgeries: Previous surgical interventions. If none, "${phrases.noSurgeries}".
   - medications: Current regular therapy/medications.

8. PORODIČNA ANAMNEZA (Family History): Chronic diseases in the family. If not mentioned, "${phrases.notMentioned}".

9. SOCIO-EPIDEMIOLOŠKA ANAMNEZA:
   - livingConditions: Living situation, pets, travel history.
   - smokingAlcohol: Smoking and alcohol habits. If denied, state clearly.
   - epidemiological: Contact with sick people, insect bites, blood-borne pathogen risk.

10. STATUS PRAESENS / OBJECTIVE FINDINGS: If clinical examination findings are mentioned (temperature, BP, pulse, respiration/SpO2, lung auscultation, heart sounds, abdominal exam, skin, meningeal signs), extract them precisely. Use exact values when given. If not mentioned, "${phrases.notExamined}".

11. FORMATTING: Be concise and clinical. Use standard medical abbreviations where appropriate. Write narratives as coherent paragraphs, not bullet points.

12. SPEAKER DIARIZATION: Analyze the transcript and identify which parts were spoken by the Doctor and which by the Patient. Format the diarized transcript as a dialogue with "Doktor:" and "Pacijent:" labels, each on a new line. If you cannot distinguish speakers for a segment, label it "Doktor:" by default.

FINAL CHECK BEFORE RETURNING THE TOOL CALL: verify that EVERY field value is written in ${outputLang}. If any value is in another language, translate it to ${outputLang} before returning the tool arguments.`;
}

function buildNormalizationPrompt(outputLang: OutputLanguage): string {
  const phrases = getLanguagePhrases(outputLang);
  const serbianLatinRule = outputLang === "Serbian" ? "Use Serbian Latin script, not Cyrillic." : "";

  return `You are a clinical language normalizer. You will receive a JSON medical report. Rewrite EVERY VALUE in ${outputLang}. Preserve all keys exactly as they are. Do not omit any information. Keep patient names, place names, medication names, proper nouns, and ICD-10 codes unchanged. ${serbianLatinRule} For missing values and denied findings, prefer these exact phrases when appropriate: "${phrases.notMentioned}", "${phrases.denied}", and "${phrases.notExamined}". Return the result only through the fill_medical_report tool.`;
}

async function callReportTool(messages: Array<{ role: "system" | "user"; content: string }>) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages,
      tools: [REPORT_TOOL],
      tool_choice: { type: "function", function: { name: "fill_medical_report" } },
    }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("Rate limited. Please try again shortly.");
    }
    if (response.status === 402) {
      throw new Error("AI credits exhausted. Please add funds.");
    }
    const text = await response.text();
    console.error("AI gateway error:", response.status, text);
    throw new Error("AI gateway error");
  }

  const data = await response.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) throw new Error("No tool call in response");

  return JSON.parse(toolCall.function.arguments) as Record<string, string>;
}

function needsNormalization(formData: Record<string, string>, outputLang: OutputLanguage, explicitOutputLanguage: boolean) {
  if (!explicitOutputLanguage) return false;

  const combined = FIELDS
    .map((field) => (typeof formData[field] === "string" ? formData[field] : ""))
    .join(" ");

  if (outputLang === "Serbian") return ENGLISH_MARKERS.test(combined) || FRENCH_MARKERS.test(combined);
  if (outputLang === "French") return ENGLISH_MARKERS.test(combined) || SERBIAN_MARKERS.test(combined);
  return SERBIAN_MARKERS.test(combined) || FRENCH_MARKERS.test(combined);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { transcript, outputLanguage } = await req.json();

    if (!transcript?.trim()) {
      return new Response(JSON.stringify({ error: "No transcript provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const explicitOutputLanguage = outputLanguage === "Serbian" || outputLanguage === "English" || outputLanguage === "French";
    const outputLang = resolveOutputLanguage(outputLanguage, transcript);

    let formData = await callReportTool([
      {
        role: "system",
        content: buildExtractionPrompt(outputLang),
      },
      {
        role: "user",
        content: `Extract all medical information from this transcript and return the completed medical report in ${outputLang}:\n\n${transcript}`,
      },
    ]);

    if (needsNormalization(formData, outputLang, explicitOutputLanguage)) {
      formData = await callReportTool([
        {
          role: "system",
          content: buildNormalizationPrompt(outputLang),
        },
        {
          role: "user",
          content: `Normalize this medical report so that every value is in ${outputLang}, while preserving the exact same keys:\n\n${JSON.stringify(formData)}`,
        },
      ]);
    }

    return new Response(JSON.stringify({ formData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-transcript error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

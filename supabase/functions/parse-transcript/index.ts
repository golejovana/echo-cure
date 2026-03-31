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
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { transcript, lang, diarize } = await req.json();
    const outputLang = lang === "sr-RS" ? "Serbian" : "English";
    if (!transcript?.trim()) {
      return new Response(JSON.stringify({ error: "No transcript provided" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
        messages: [
          {
            role: "system",
            content: `You are a senior clinical information extractor working in a Serbian university hospital. You receive a raw voice transcript from a doctor describing a patient case — possibly in Serbian, English, or a mix. Your job is to extract ALL available information and map it into a structured medical report following the standard Serbian "Anamneza i Status Praesens" format.

Do NOT invent or hallucinate data. Only extract what is explicitly stated or clearly implied.

OUTPUT LANGUAGE: "${outputLang}". You MUST write ALL field values in ${outputLang}. If the transcript is in a different language, translate the extracted data into ${outputLang}. Keep proper nouns (patient names, hospital names, place names) in their original form.

EXTRACTION RULES:

1. PATIENT IDENTITY: Extract name, age/year of birth, occupation, social/marital status. If not mentioned, set to "${outputLang === "Serbian" ? "Nije pomenuto u transkriptu" : "Not mentioned in transcript"}".

2. RADNE DIJAGNOZE (ICD-10): If the doctor mentions or implies specific diagnoses, provide ICD-10 codes formatted as "CODE - Description" (e.g. "I10 - ${outputLang === "Serbian" ? "Esencijalna hipertenzija" : "Essential hypertension"}"). One per line. If uncertain, "${outputLang === "Serbian" ? "Nije određeno iz transkripta" : "Not determined from transcript"}".

3. GLAVNE TEGOBE (Chief Complaints): The patient's primary reason for the visit. Brief, 1-3 sentences.

4. SADAŠNJA BOLEST (Present Illness): Full detailed narrative of the current illness — progression, context, lab results mentioned, imaging results, treatments tried. Write as a coherent clinical narrative paragraph, similar to a formal Serbian anamneza.

5. KLINIČKA HRONOLOGIJA (Clinical Timeline): Extract the history — when illness started, which hospitals they visited, what medications were prescribed, what procedures were done. Write as a coherent timeline.

6. ANAMNEZA PO SISTEMIMA (Systems Review): Map symptoms to the correct category. For DENIED symptoms (e.g. "negira bol", "no chest pain", "nema mučnine"), write "${outputLang === "Serbian" ? "Negativno / Negira" : "Negative / Denied"}" — do NOT leave blank. For symptoms not discussed at all, write "${outputLang === "Serbian" ? "Nije pomenuto u transkriptu" : "Not mentioned in transcript"}".

7. LIČNA ANAMNEZA (Personal History):
   - allergies: Allergies to medications, food, environment. If denied, "${outputLang === "Serbian" ? "Negira alergije" : "Denies allergies"}".
   - chronicDiseases: Known chronic conditions.
   - surgeries: Previous surgical interventions. If none, "${outputLang === "Serbian" ? "Nije imao/la hirurške intervencije" : "No previous surgeries"}".
   - medications: Current regular therapy/medications.

8. PORODIČNA ANAMNEZA (Family History): Chronic diseases in the family. If not mentioned, "${outputLang === "Serbian" ? "Nije pomenuto u transkriptu" : "Not mentioned in transcript"}".

9. SOCIO-EPIDEMIOLOŠKA ANAMNEZA:
   - livingConditions: Living situation, pets, travel history.
   - smokingAlcohol: Smoking and alcohol habits. If denied, state clearly.
   - epidemiological: Contact with sick people, insect bites, blood-borne pathogen risk.

10. STATUS PRAESENS / OBJECTIVE FINDINGS: If clinical examination findings are mentioned (temperature, BP, pulse, respiration/SpO2, lung auscultation, heart sounds, abdominal exam, skin, meningeal signs), extract them precisely. Use exact values when given (e.g. "TA 160/100 mmHg", "T: 38.2°C", "SpO2: 95%"). If not mentioned, "${outputLang === "Serbian" ? "Nije pregledano / Nije pomenuto" : "Not examined / Not mentioned"}".

11. FORMATTING: Be concise and clinical. Use standard medical abbreviations where appropriate. Write narratives as coherent paragraphs, not bullet points.

12. SPEAKER DIARIZATION: Analyze the transcript and identify which parts were spoken by the Doctor and which by the Patient. Use contextual clues: questions, instructions, and clinical observations are typically from the Doctor; symptom descriptions, answers, and personal history are from the Patient. Format the diarized transcript as a dialogue with "Doktor:" and "Pacijent:" labels, each on a new line. If you cannot distinguish speakers for a segment, label it "Doktor:" by default since it's the doctor's recording.`,
          },
          {
            role: "user",
            content: `Extract all medical information from this transcript:\n\n${transcript}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "fill_medical_report",
              description: "Fill the structured medical report (Anamneza i Status Praesens) extracted from the transcript",
              parameters: {
                type: "object",
                properties: {
                  patientName: { type: "string", description: "Patient full name / Ime i prezime" },
                  patientAge: { type: "string", description: "Age or year of birth / Godište" },
                  patientOccupation: { type: "string", description: "Occupation / Zanimanje" },
                  patientSocialStatus: { type: "string", description: "Social/marital status, living situation" },
                  chiefComplaints: { type: "string", description: "Glavne tegobe / Chief complaints" },
                  presentIllness: { type: "string", description: "Sadašnja bolest / Present illness - detailed narrative" },
                  clinicalTimeline: { type: "string", description: "Timeline: onset, hospitals, treatments, procedures" },
                  diagnosisCodes: { type: "string", description: "ICD-10 codes, one per line: CODE - Description" },
                  chestPain: { type: "string" }, swelling: { type: "string" },
                  pressure: { type: "string" }, veins: { type: "string" },
                  appetite: { type: "string" }, nausea: { type: "string" },
                  swallowing: { type: "string" }, bloating: { type: "string" }, stool: { type: "string" },
                  urination: { type: "string" }, flankPain: { type: "string" },
                  jointPain: { type: "string" }, visionHearing: { type: "string" },
                  dizziness: { type: "string" }, headaches: { type: "string" },
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
                },
                required: FIELDS,
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "fill_medical_report" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");

    const formData = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify({ formData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-transcript error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

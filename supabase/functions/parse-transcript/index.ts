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
  "allergies", "chronicDiseases", "smokingAlcohol",
  "bloodPressure", "pulse", "lungSounds", "heartSounds", "abdominalExam", "meningealSigns", "otherFindings",
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { transcript, lang } = await req.json();
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
            content: `You are a senior clinical information extractor. You receive a raw voice transcript from a doctor describing a patient case — possibly in Serbian, English, or a mix. Your job is to extract ALL available information and map it into a structured medical report. Do NOT invent or hallucinate data. Only extract what is explicitly stated or clearly implied.

RULES:
1. PATIENT IDENTITY: Extract name, age, occupation, social status ONLY if mentioned. If not mentioned, set to "Not mentioned in transcript".
2. CLINICAL TIMELINE: Extract the history — when illness started, hospitals visited, medications prescribed, procedures done. Write as a coherent narrative. If not mentioned, "Not mentioned in transcript".
3. CHIEF COMPLAINTS: The patient's primary reason for the visit. Brief, 1-2 sentences.
4. PRESENT ILLNESS: Full narrative of the current illness, progression, and context.
5. DIAGNOSIS CODES: If the doctor mentions or implies specific diagnoses, provide ICD-10 codes formatted as "CODE - Description" (e.g. "I10 - Essential hypertension"). One per line. If uncertain, "Not determined from transcript".
6. SYSTEMS REVIEW: Map symptoms to the correct category. For DENIED symptoms (e.g. "negira bol", "no chest pain", "nema mučnine"), write "Negative / Denied" — do NOT leave blank or say "Not reported". For symptoms not discussed at all, write "Not mentioned in transcript".
7. STATUS PRAESENS / OBJECTIVE FINDINGS: If clinical examination findings are mentioned (BP, pulse, lung auscultation, heart sounds, abdominal exam, meningeal signs), extract them precisely. Use exact values when given (e.g. "TA 160/100 mmHg"). If not mentioned, "Not examined / Not mentioned".
8. LANGUAGE: The transcript may be in Serbian. Always output field values in English medical terminology, but keep proper nouns (names, places) in their original form. For Serbian medical terms, translate to standard English equivalents.
9. FORMATTING: Be concise and clinical. Use standard medical abbreviations where appropriate.`,
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
              description: "Fill the structured medical report extracted from the transcript",
              parameters: {
                type: "object",
                properties: {
                  patientName: { type: "string", description: "Patient full name" },
                  patientAge: { type: "string", description: "Age / date of birth" },
                  patientOccupation: { type: "string", description: "Occupation" },
                  patientSocialStatus: { type: "string", description: "Social/marital status, living situation" },
                  chiefComplaints: { type: "string", description: "Chief complaints / Glavne tegobe" },
                  presentIllness: { type: "string", description: "Present illness narrative / Sadašnja bolest" },
                  clinicalTimeline: { type: "string", description: "Timeline: onset, hospitals, treatments, procedures" },
                  diagnosisCodes: { type: "string", description: "ICD-10 codes, one per line: CODE - Description" },
                  chestPain: { type: "string" }, swelling: { type: "string" },
                  pressure: { type: "string" }, veins: { type: "string" },
                  appetite: { type: "string" }, nausea: { type: "string" },
                  swallowing: { type: "string" }, bloating: { type: "string" }, stool: { type: "string" },
                  urination: { type: "string" }, flankPain: { type: "string" },
                  jointPain: { type: "string" }, visionHearing: { type: "string" },
                  dizziness: { type: "string" }, headaches: { type: "string" },
                  allergies: { type: "string" }, chronicDiseases: { type: "string" }, smokingAlcohol: { type: "string" },
                  bloodPressure: { type: "string", description: "Measured BP value" },
                  pulse: { type: "string", description: "Pulse rate and character" },
                  lungSounds: { type: "string", description: "Lung auscultation findings" },
                  heartSounds: { type: "string", description: "Heart auscultation findings" },
                  abdominalExam: { type: "string", description: "Abdominal examination findings" },
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

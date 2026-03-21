import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FIELDS = [
  "chiefComplaints",
  "presentIllness",
  "diagnosisCodes",
  "chestPain","swelling","pressure","veins",
  "appetite","nausea","swallowing","bloating","stool",
  "urination","flankPain",
  "jointPain","visionHearing","dizziness","headaches",
  "allergies","chronicDiseases","smokingAlcohol",
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { transcript } = await req.json();
    if (!transcript?.trim()) {
      return new Response(JSON.stringify({ error: "No transcript provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a senior medical transcript analyzer at the University Clinical Center of Serbia (Univerzitetski Klinički Centar Srbije). You analyze patient consultation transcripts and produce structured clinical data.

Your job:
1. Extract "Chief Complaints" (Glavne tegobe) — the patient's primary reason for visit in 1-2 sentences.
2. Extract "Present Illness" (Sadašnja bolest) — a narrative summary of the current illness, timeline, and progression.
3. Identify any ICD-10 diagnosis codes mentioned or strongly implied. Format each as "CODE - Description" (e.g. "I10 - Hypertension", "N18.4 - Chronic kidney disease, stage 4"). List multiple codes separated by newlines. If none can be determined, set to "Not reported".
4. Categorize symptoms into the systematic review fields below. For each, provide a concise clinical summary. If not mentioned, set to exactly "Not reported".

Systematic review fields:
- chestPain: Chest Pain (Bol u grudima)
- swelling: Swelling / Edema (Otoci)
- pressure: Blood Pressure / Pressure Sensation (Krvni pritisak)
- veins: Veins / Vascular (Vene / Vaskularno)
- appetite: Appetite (Apetit)
- nausea: Nausea / Vomiting (Mučnina / Povraćanje)
- swallowing: Swallowing (Gutanje)
- bloating: Bloating / Abdominal Pain (Nadutost / Bol u stomaku)
- stool: Stool / Bowel Habits (Stolica)
- urination: Urination Details (Mokrenje)
- flankPain: Flank Pain (Bol u slabinama)
- jointPain: Joint Pain / Mobility (Bol u zglobovima)
- visionHearing: Vision / Hearing (Vid / Sluh)
- dizziness: Dizziness / Vertigo (Vrtoglavica)
- headaches: Headaches (Glavobolje)
- allergies: Allergies (Alergije)
- chronicDiseases: Chronic Diseases & Medications (Hronične bolesti i terapija)
- smokingAlcohol: Smoking / Alcohol (Pušenje / Alkohol)`,
          },
          {
            role: "user",
            content: `Analyze this patient transcript and fill all fields:\n\n${transcript}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "fill_medical_form",
              description: "Fill the structured medical report from transcript analysis",
              parameters: {
                type: "object",
                properties: {
                  chiefComplaints: { type: "string", description: "Chief complaints / Glavne tegobe" },
                  presentIllness: { type: "string", description: "Present illness narrative / Sadašnja bolest" },
                  diagnosisCodes: { type: "string", description: "ICD-10 codes, one per line, format: CODE - Description" },
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
                  allergies: { type: "string" },
                  chronicDiseases: { type: "string" },
                  smokingAlcohol: { type: "string" },
                },
                required: FIELDS,
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "fill_medical_form" } },
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

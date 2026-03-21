import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FIELDS = [
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
            content: `You are a medical transcript analyzer. You will receive a patient consultation transcript. Your job is to extract and categorize the medical information into the following fields. For each field, provide a concise clinical summary. If information is not mentioned, set value to exactly "Not reported".

Fields:
- chestPain: Chest Pain details
- swelling: Swelling / Edema
- pressure: Blood Pressure / Pressure Sensation
- veins: Veins / Vascular
- appetite: Appetite
- nausea: Nausea / Vomiting
- swallowing: Swallowing
- bloating: Bloating / Abdominal Pain
- stool: Stool / Bowel Habits
- urination: Urination Details
- flankPain: Flank Pain
- jointPain: Joint Pain / Mobility
- visionHearing: Vision / Hearing
- dizziness: Dizziness / Vertigo
- headaches: Headaches
- allergies: Allergies
- chronicDiseases: Chronic Diseases (include medications)
- smokingAlcohol: Smoking / Alcohol`,
          },
          {
            role: "user",
            content: `Analyze this transcript and return the structured data:\n\n${transcript}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "fill_medical_form",
              description: "Fill the structured medical intake form from transcript analysis",
              parameters: {
                type: "object",
                properties: Object.fromEntries(
                  FIELDS.map((f) => [f, { type: "string" }])
                ),
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

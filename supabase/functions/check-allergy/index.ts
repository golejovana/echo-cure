import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { drugName, allergies, chronicDiseases, language } = await req.json();

    if (!drugName?.trim()) {
      return new Response(JSON.stringify({ warnings: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const hasAllergies = !!allergies?.trim();
    const hasChronic = !!chronicDiseases?.trim();

    if (!hasAllergies && !hasChronic) {
      return new Response(JSON.stringify({ warnings: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const lang = language === "en" ? "English" : language === "fr" ? "French" : "Serbian";

    const systemPrompt = `You are a clinical decision support system for physicians. Given a drug name, patient allergies, and patient chronic diseases, analyze ALL potential risks.

Check for:
1. ALLERGY RISKS: Direct allergy matches, drug class cross-reactions (e.g., Penicillin allergy → Amoxicillin, Ampicillin, Panklav, Augmentin), chemical group cross-reactions (e.g., sulfa allergy → sulfamethoxazole), food-drug interactions.
2. CONTRAINDICATION RISKS from chronic diseases:
   - Diabetes/Insulin resistance: flag drugs affecting blood sugar (corticosteroids like Dexamethasone, Prednisolone; thiazide diuretics)
   - Hypertension (Visok pritisak): flag drugs that increase BP (pseudoephedrine, decongestants, NSAIDs, stimulants)
   - Gastritis/Ulcer (Gastritis, Čir na želucu): flag NSAIDs (Brufen, Aspirin, Ibuprofen, Diklofenak)
   - Renal insufficiency (Bubrežna insuficijencija): flag nephrotoxic drugs (Metformin, aminoglycosides, NSAIDs)
   - Asthma: flag beta-blockers, aspirin
   - Liver disease (Hepatitis, Ciroza): flag hepatotoxic drugs (Paracetamol high dose, statins)
   - Heart failure: flag NSAIDs, calcium channel blockers (verapamil), thiazolidinediones
   - Bleeding disorders: flag anticoagulants, antiplatelets
   - Any other clinically relevant drug-disease interaction

For EACH risk found, return a warning object. If no risks, return empty array.

RESPOND ONLY in ${lang}. Use professional medical language suitable for a physician.
Respond ONLY with valid JSON (no markdown, no code blocks):
{
  "warnings": [
    {
      "type": "allergy" | "contraindication",
      "severity": "high" | "medium",
      "title": "short warning title",
      "explanation": "concise professional explanation (1-2 sentences)"
    }
  ]
}`;

    const userContent = `Drug: "${drugName}"
${hasAllergies ? `Patient allergies: "${allergies}"` : "Patient allergies: none reported"}
${hasChronic ? `Patient chronic diseases: "${chronicDiseases}"` : "Patient chronic diseases: none reported"}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ warnings: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const result = JSON.parse(cleaned);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch {
      console.error("Failed to parse AI response:", content);
      return new Response(JSON.stringify({ warnings: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (e) {
    console.error("check-allergy error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

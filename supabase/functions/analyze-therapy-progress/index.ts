import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { entries, patientName } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const entriesSummary = entries
      .map(
        (e: any) =>
          `Datum: ${e.date}, Raspoloženje: ${e.mood}/5, Simptomi: ${e.symptoms || "bez simptoma"}, Lek popijen: ${e.medication_taken ? "Da" : "Ne"}, Ozbiljno: ${e.is_severe ? "Da" : "Ne"}`
      )
      .join("\n");

    const systemPrompt = `Ti si medicinski AI asistent. Analiziraj dnevnik terapije pacijenta i daj kratak, profesionalan izveštaj o uspešnosti terapije.

Tvoj odgovor treba da bude na srpskom jeziku (latinica) i da sadrži:
1. Status terapije (uspešna / delimično uspešna / potrebna korekcija)
2. Trend raspoloženja (poboljšanje / stabilno / pogoršanje)
3. Adherencija na terapiju (procenat uzimanja lekova)
4. Upozorenja ako postoje ozbiljni simptomi
5. Kratka preporuka za dalje postupanje

Budi koncizan i profesionalan. Koristi medicinski jezik ali razumljiv.`;

    const userPrompt = `Pacijent: ${patientName || "Nepoznat"}\n\nDnevnik terapije (${entries.length} unosa):\n${entriesSummary}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
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
      throw new Error("AI gateway error");
    }

    const result = await response.json();
    const analysis = result.choices?.[0]?.message?.content || "Analiza nije dostupna.";

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-therapy-progress error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { texts, targetLang } = await req.json();

    if (!texts || !Array.isArray(texts) || texts.length === 0 || !targetLang) {
      return new Response(JSON.stringify({ error: "Missing texts array or targetLang" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Limit batch size
    const batch = texts.slice(0, 20);

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

    const langName = targetLang === "en" ? "English" : targetLang === "fr" ? "French" : "Serbian";

    const prompt = `Translate the following medical terms/phrases to ${langName}. 
Return ONLY a JSON array of translated strings in the same order. No explanations.
Do NOT translate proper nouns (patient names, city names, institution names).
Keep medical terminology accurate.

Input: ${JSON.stringify(batch)}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: "You are a medical translator. Return only valid JSON arrays. No markdown, no code blocks." },
          { role: "user", content: prompt },
        ],
        max_tokens: 1000,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      throw new Error(`AI API error: ${response.status} ${errText}`);
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content ?? "[]";

    // Strip markdown code blocks if present
    content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    let translations: string[];
    try {
      translations = JSON.parse(content);
    } catch {
      // Fallback: return originals
      translations = batch;
    }

    // Ensure same length
    while (translations.length < batch.length) {
      translations.push(batch[translations.length]);
    }

    return new Response(JSON.stringify({ translations }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Translation error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

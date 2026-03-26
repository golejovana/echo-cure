import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { diagnosis, formData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const medicalSummary = [
      diagnosis && `Dijagnoza: ${diagnosis}`,
      formData?.chiefComplaints && `Glavne tegobe: ${formData.chiefComplaints}`,
      formData?.presentIllness && `Sadašnja bolest: ${formData.presentIllness}`,
      formData?.clinicalTimeline && `Hronologija: ${formData.clinicalTimeline}`,
    ].filter(Boolean).join("\n");

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
            content: `Ti si AI asistent koji objašnjava medicinske nalaze pacijentima na jednostavnom srpskom jeziku.
Pravila:
- Koristi razumljiv, svakodnevni srpski jezik (ćirilica ili latinica kako dobiješ)
- Izbegavaj medicinski žargon, ili ga objasni u zagradama
- Budi empatičan i umirujući ali iskren
- Strukturiraj odgovor u kratke paragrafe
- Na kraju dodaj "Ako imate pitanja, obratite se svom lekaru."`,
          },
          {
            role: "user",
            content: `Molim te objasni mi sledeći medicinski nalaz na jednostavnom jeziku:\n\n${medicalSummary}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Previše zahteva, pokušajte ponovo za minut." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Potrebno je dopuniti kredite." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const explanation = data.choices?.[0]?.message?.content || "Nije moguće generisati objašnjenje.";

    return new Response(JSON.stringify({ explanation }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("simplify-diagnosis error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

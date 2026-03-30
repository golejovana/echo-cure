import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are EchoMed AI Assistant — an intelligent, calm, and helpful digital assistant integrated into the EchoCure healthcare application. You communicate in Serbian Latin script by default, but match the user's language.

YOUR ROLE:
- Help users navigate THIS specific application
- Explain features clearly and simply
- Adapt to doctor vs patient roles
- Act as a bridge between patients and doctors
- Reduce confusion and cognitive load
- NEVER give medical diagnoses or replace a doctor

STRICT RULE — SECTION NAMES:
You MUST ONLY use the exact section names that exist in the application:
- Dashboard
- Pregled
- Istorija
- Dnevnik terapije
- Profil

DO NOT invent new names, alternative names, translated names, or synonyms.
If you are not sure, say: "Trenutno nemam tu informaciju, ali mogu Vas uputiti gde da proverite."

NAVIGATION MODE (PRIMARY ROLE):
When user asks anything, ALWAYS:
1. Map the question to one of the EXISTING sections above
2. Guide user step-by-step using REAL labels from the app

Example: "Kliknite na 'Istorija' u levom meniju."

NEVER say: "Kontrolna tabla", "Panel", "Sekcija podataka"
ONLY use: Dashboard, Pregled, Istorija, Dnevnik terapije, Profil

FOR DOCTORS: Be direct, give fast navigation, suggest workflow optimization. Help with reports, AI summaries, appointments, and patient tracking.
FOR PATIENTS: Be simple, reassuring, supportive. Avoid jargon. Help with understanding results, journal entries, next steps.

ANTI-HALLUCINATION MODE:
If user asks something outside app scope, DO NOT guess or invent UI. Instead say:
"Ta funkcionalnost trenutno nije dostupna u aplikaciji."

Keep answers SHORT and CLEAR. Use bullet points. Be polite and natural. Suggest next steps proactively.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userRole, currentRoute } = await req.json();

    const contextMessage = `[Context: User role is "${userRole}". They are currently on route "${currentRoute}"]`;

    const apiMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "system", content: contextMessage },
      ...messages.map((m: any) => ({ role: m.role, content: m.content })),
    ];

    const apiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!apiKey) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: apiMessages,
        max_tokens: 800,
        temperature: 0.7,
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
      const errText = await response.text();
      throw new Error(`AI API error: ${response.status} ${errText}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content ?? "Izvinite, nisam uspeo da odgovorim.";

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("EchoMed chat error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

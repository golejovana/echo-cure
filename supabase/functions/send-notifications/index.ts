import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_PUBLIC_KEY = "BCt_2X-EE6r4Oto-weRunej9Zr5bD1P5eGrsjuW_U7NzZ40aoXNbQ95roqrpkn8X7JUG1SUYiXYAMXUcyHIoVaY";
const VAPID_SUBJECT = "mailto:echocure@example.com";

// --- Web Push crypto helpers ---

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

function base64UrlEncode(data: Uint8Array): string {
  let binary = "";
  for (const b of data) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function importPrivateKey(raw: Uint8Array) {
  return crypto.subtle.importKey(
    "pkcs8",
    raw,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );
}

async function importRawPublicKey(raw: Uint8Array) {
  return crypto.subtle.importKey(
    "raw",
    raw,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );
}

// Convert the VAPID private key from URL-safe base64 (32 bytes raw) to PKCS8
function rawPrivateKeyToPkcs8(rawKey: Uint8Array): Uint8Array {
  // PKCS8 header for P-256 EC key
  const header = new Uint8Array([
    0x30, 0x81, 0x87, 0x02, 0x01, 0x00, 0x30, 0x13,
    0x06, 0x07, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x02,
    0x01, 0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d,
    0x03, 0x01, 0x07, 0x04, 0x6d, 0x30, 0x6b, 0x02,
    0x01, 0x01, 0x04, 0x20,
  ]);
  const footer = new Uint8Array([
    0xa1, 0x44, 0x03, 0x42, 0x00,
  ]);
  const pubKeyRaw = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
  const result = new Uint8Array(header.length + rawKey.length + footer.length + pubKeyRaw.length);
  result.set(header, 0);
  result.set(rawKey, header.length);
  result.set(footer, header.length + rawKey.length);
  result.set(pubKeyRaw, header.length + rawKey.length + footer.length);
  return result;
}

async function createVapidJwt(audience: string): Promise<string> {
  const rawPriv = urlBase64ToUint8Array(VAPID_PRIVATE_KEY);
  const pkcs8 = rawPrivateKeyToPkcs8(rawPriv);
  const key = await importPrivateKey(pkcs8);

  const header = { typ: "JWT", alg: "ES256" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: audience,
    exp: now + 12 * 3600,
    sub: VAPID_SUBJECT,
  };

  const encodedHeader = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const encodedPayload = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;

  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    new TextEncoder().encode(unsignedToken)
  );

  // Convert DER signature to raw r||s (64 bytes)
  const sigBytes = new Uint8Array(signature);
  let r: Uint8Array, s: Uint8Array;
  if (sigBytes.length === 64) {
    r = sigBytes.slice(0, 32);
    s = sigBytes.slice(32);
  } else {
    // DER format
    const rLen = sigBytes[3];
    const rStart = 4;
    r = sigBytes.slice(rStart, rStart + rLen);
    const sLen = sigBytes[rStart + rLen + 1];
    const sStart = rStart + rLen + 2;
    s = sigBytes.slice(sStart, sStart + sLen);
    // Trim leading zeros / pad to 32 bytes
    if (r.length > 32) r = r.slice(r.length - 32);
    if (s.length > 32) s = s.slice(s.length - 32);
    if (r.length < 32) { const t = new Uint8Array(32); t.set(r, 32 - r.length); r = t; }
    if (s.length < 32) { const t = new Uint8Array(32); t.set(s, 32 - s.length); s = t; }
  }

  const rawSig = new Uint8Array(64);
  rawSig.set(r, 0);
  rawSig.set(s, 32);

  return `${unsignedToken}.${base64UrlEncode(rawSig)}`;
}

// --- Web Push encryption (aes128gcm) ---

async function encryptPayload(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: string
): Promise<{ body: Uint8Array; headers: Record<string, string> }> {
  const clientPublicKey = urlBase64ToUint8Array(subscription.keys.p256dh);
  const clientAuth = urlBase64ToUint8Array(subscription.keys.auth);

  // Generate server ECDH key pair
  const serverKeyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"]
  );

  const serverPublicKeyRaw = new Uint8Array(
    await crypto.subtle.exportKey("raw", serverKeyPair.publicKey)
  );

  const importedClientKey = await importRawPublicKey(clientPublicKey);

  // ECDH shared secret
  const sharedSecret = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "ECDH", public: importedClientKey },
      serverKeyPair.privateKey,
      256
    )
  );

  // Salt
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // HKDF-based key derivation
  const authInfo = new TextEncoder().encode("Content-Encoding: auth\0");
  const prkKey = await crypto.subtle.importKey("raw", clientAuth, { name: "HKDF" }, false, ["deriveBits"]);
  
  // IKM = HKDF(auth, sharedSecret, "Content-Encoding: auth\0", 32)
  const ikmBits = await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt: sharedSecret, info: authInfo },
    prkKey,
    256
  );
  const ikm = new Uint8Array(ikmBits);

  // Build context for CEK and nonce
  const keyLabel = new TextEncoder().encode("Content-Encoding: aes128gcm\0");
  const nonceLabel = new TextEncoder().encode("Content-Encoding: nonce\0");

  const ikmKey = await crypto.subtle.importKey("raw", ikm, { name: "HKDF" }, false, ["deriveBits"]);

  const cekBits = await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt, info: keyLabel },
    ikmKey,
    128
  );
  const nonceBits = await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt, info: nonceLabel },
    ikmKey,
    96
  );

  const cek = await crypto.subtle.importKey("raw", new Uint8Array(cekBits), { name: "AES-GCM" }, false, ["encrypt"]);

  // Pad payload: add \x02 delimiter
  const payloadBytes = new TextEncoder().encode(payload);
  const paddedPayload = new Uint8Array(payloadBytes.length + 1);
  paddedPayload.set(payloadBytes);
  paddedPayload[payloadBytes.length] = 2; // delimiter

  const encrypted = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: new Uint8Array(nonceBits) },
      cek,
      paddedPayload
    )
  );

  // Build aes128gcm body: salt(16) + rs(4) + idlen(1) + keyid(65) + encrypted
  const rs = 4096;
  const rsBytes = new Uint8Array(4);
  new DataView(rsBytes.buffer).setUint32(0, rs);

  const body = new Uint8Array(16 + 4 + 1 + serverPublicKeyRaw.length + encrypted.length);
  body.set(salt, 0);
  body.set(rsBytes, 16);
  body[20] = serverPublicKeyRaw.length;
  body.set(serverPublicKeyRaw, 21);
  body.set(encrypted, 21 + serverPublicKeyRaw.length);

  const endpoint = new URL(subscription.endpoint);
  const audience = `${endpoint.protocol}//${endpoint.host}`;
  const jwt = await createVapidJwt(audience);

  return {
    body,
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Encoding": "aes128gcm",
      TTL: "86400",
      Authorization: `vapid t=${jwt}, k=${VAPID_PUBLIC_KEY}`,
    },
  };
}

async function sendPush(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: { title: string; body: string; url?: string }
) {
  const { body, headers } = await encryptPayload(subscription, JSON.stringify(payload));

  const resp = await fetch(subscription.endpoint, {
    method: "POST",
    headers,
    body,
  });

  if (!resp.ok) {
    const text = await resp.text();
    console.error(`Push failed (${resp.status}): ${text}`);
  }
  return resp;
}

// --- Main handler ---

Deno.serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    // Determine which type of reminder based on query param or time
    const url = new URL(req.url);
    const type = url.searchParams.get("type") || "appointment";

    let sent = 0;

    if (type === "appointment") {
      // Tomorrow's appointments
      const { data: tomorrowApts } = await supabase
        .from("appointments")
        .select("*")
        .eq("appointment_date", tomorrowStr)
        .neq("priority", "cancelled");

      // Today's appointments
      const { data: todayApts } = await supabase
        .from("appointments")
        .select("*")
        .eq("appointment_date", todayStr)
        .neq("priority", "cancelled");

      const allApts = [
        ...(tomorrowApts || []).map((a: any) => ({ ...a, _type: "tomorrow" })),
        ...(todayApts || []).map((a: any) => ({ ...a, _type: "today" })),
      ];

      // Group by patient_id
      const byPatient = new Map<string, any[]>();
      for (const apt of allApts) {
        if (!apt.patient_id) continue;
        if (!byPatient.has(apt.patient_id)) byPatient.set(apt.patient_id, []);
        byPatient.get(apt.patient_id)!.push(apt);
      }

      // Fetch push subscriptions for those patients
      const patientIds = [...byPatient.keys()];
      if (patientIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, push_subscription")
          .in("user_id", patientIds);

        for (const profile of (profiles || [])) {
          const sub = profile.push_subscription;
          if (!sub || !sub.endpoint || !sub.keys) continue;

          const apts = byPatient.get(profile.user_id) || [];
          for (const apt of apts) {
            const timeStr = apt.appointment_time || "";
            const payload =
              apt._type === "tomorrow"
                ? {
                    title: "EchoCure — Podsetnik",
                    body: `Sutra${timeStr ? ` u ${timeStr}` : ""} imate termin: ${apt.title}`,
                    url: "/",
                  }
                : {
                    title: "EchoCure — Danas imate termin",
                    body: `Danas${timeStr ? ` u ${timeStr}` : ""}: ${apt.title}. Srećno!`,
                    url: "/",
                  };

            try {
              await sendPush(sub, payload);
              sent++;
            } catch (e) {
              console.error("Failed to send push:", e);
            }
          }
        }
      }
    } else if (type === "medication") {
      // Medication reminders: find patients with active medications
      // Query examinations with _medications in form_data
      const { data: exams } = await supabase
        .from("examinations")
        .select("patient_id, form_data, patient_name")
        .not("patient_id", "is", null);

      const patientMeds = new Map<string, string[]>();
      for (const exam of (exams || [])) {
        const fd = exam.form_data as any;
        if (fd?._medications?.length > 0 && exam.patient_id) {
          const meds = fd._medications.map((m: any) => m.name || m).filter(Boolean);
          if (meds.length > 0) {
            const existing = patientMeds.get(exam.patient_id) || [];
            patientMeds.set(exam.patient_id, [...new Set([...existing, ...meds])]);
          }
        }
      }

      const patientIds = [...patientMeds.keys()];
      if (patientIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, push_subscription")
          .in("user_id", patientIds);

        for (const profile of (profiles || [])) {
          const sub = profile.push_subscription;
          if (!sub || !sub.endpoint || !sub.keys) continue;

          const meds = patientMeds.get(profile.user_id) || [];
          const payload = {
            title: "EchoCure — Podsetnik za lek",
            body: `Ne zaboravite da uzmete: ${meds.join(", ")}`,
            url: "/",
          };

          try {
            await sendPush(sub, payload);
            sent++;
          } catch (e) {
            console.error("Failed to send medication push:", e);
          }
        }
      }
    }

    return new Response(JSON.stringify({ ok: true, sent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-notifications error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

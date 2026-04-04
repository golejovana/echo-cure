import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import ListenerPanel from "@/components/ListenerPanel";
import type { Lang, ListenerPanelHandle } from "@/components/ListenerPanel";
import SmartFormPanel, { type SmartFormPanelHandle } from "@/components/SmartFormPanel";

const DEMO_TRANSCRIPT = `Doktor: Dobro jutro, izvolite. Kako se zovete?
Pacijent: Dobro jutro doktore. Davidović Milan.
Doktor: Koliko imate godina i čime se bavite?
Pacijent: 40 godina, programer sam, radim od kuće.
Doktor: Šta vas dovodi danas?
Pacijent: Imam jako jaku glavobolju već 5 dana, u potiljku, ne mogu da funkcionišem. Boli me 7 od 10, pulsirajuće je, i mučno mi je, dvaput sam povraćao.
Doktor: Da li vam smeta svetlost ili buka?
Pacijent: Da, i jedno i drugo. Ne mogu ni da upalim lampu u sobi.
Doktor: Da li vas bol budi iz sna?
Pacijent: Da, probudim se zbog bola.
Doktor: Da li ste imali neke tegobe pre ovoga?
Pacijent: Pre nedelju dana sam imao jako zapaljenje grla, ali to je prošlo samo od sebe.
Doktor: Imate li neke alergije na lekove?
Pacijent: Da, alergičan sam na sulfonamide, dobijam jako loš osip i ne mogu da dišem. I na aspirin, dobijam urtikariju.
Doktor: Uzimate li neke lekove redovno?
Pacijent: Uzimam Karbamazepin 200 miligrama dva puta dnevno već 8 godina zbog epilepsije. I Alprazolam ponekad, 0.25 miligrama, zbog anksioznosti.
Doktor: Jeste li imali neke operacije ili povrede?
Pacijent: Prelomio sam ruku u detinjstvu, ništa drugo.
Doktor: Bolesti u porodici?
Pacijent: Majka ima migrenu, otac hipertenziju, brat takođe ima epilepsiju.
Doktor: Pušite li, pijete li alkohol?
Pacijent: Ne pušim, alkohol retko, jedno pivo nedeljno možda.
Doktor: Kako spavate, kako izgledaju vaši dani?
Pacijent: Spavam loše, često radim noću, sedeći posao, malo se krećem.
Doktor: Srce, pritisak, problemi sa disanjem?
Pacijent: Ne, sve je to u redu.
Doktor: Stomak, varenje, mokraća?
Pacijent: Mučno mi je zbog glavobolje, dvaput sam povraćao, apetit mi je smanjen. Ostalo je uredno.
Doktor: Na osnovu svega postavljam radnu dijagnozu migrena bez aure ICD-10 G43.0, epilepsija ICD-10 G40.9, anksiozni poremećaj ICD-10 F41.1.`;

export default function Examination() {
  const [transcript, setTranscript] = useState("");
  const [lang, setLang] = useState<Lang>("sr-RS");
  const [role, setRole] = useState<"doctor" | "patient">("doctor");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const examId = searchParams.get("examId") || undefined;
  const formRef = useRef<SmartFormPanelHandle>(null);
  const listenerRef = useRef<ListenerPanelHandle>(null);

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from("profiles").select("role").eq("user_id", user.id).single();
        if (data?.role === "patient") navigate("/");
        else if (data?.role) setRole(data.role);
      }
    };
    check();
  }, [navigate]);

  const handleTranscriptUpdate = useCallback((text: string) => {
    setTranscript(text);
  }, []);

  const handleDemo = useCallback(async () => {
    // 1. Fill the transcript
    setTranscript(DEMO_TRANSCRIPT);

    // 2. Wait 500ms then trigger extraction
    await new Promise((r) => setTimeout(r, 500));
    if (formRef.current) {
      await formRef.current.autoFill();
      // 3. After extraction, fill manual fields
      setTimeout(() => {
        formRef.current?.setField("jmbg", "1505985710023");
        formRef.current?.setField("patientAddress", "Ulica Kneza Miloša 24, Beograd");
        formRef.current?.setField("patientSocialStatus", "Neoženjen, živi sam, srednji prihodi");
        toast("Demo mode — podaci su učitani");
      }, 300);
    }
  }, []);

  return (
    <DashboardLayout role={role}>
      <motion.div
        initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 h-[calc(100vh-120px)]"
      >
        <div className="glass-card-elevated p-6 overflow-hidden flex flex-col">
          <ListenerPanel onTranscriptUpdate={handleTranscriptUpdate} onLangChange={setLang} onDemoClick={handleDemo} />
        </div>
        <div className="glass-card-elevated p-6 overflow-hidden flex flex-col">
          <SmartFormPanel ref={formRef} transcript={transcript} lang={lang} examId={examId} />
        </div>
      </motion.div>
    </DashboardLayout>
  );
}

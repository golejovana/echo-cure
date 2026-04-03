import { useState, useCallback, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import ListenerPanel from "@/components/ListenerPanel";
import type { Lang } from "@/components/ListenerPanel";
import SmartFormPanel from "@/components/SmartFormPanel";

export default function Examination() {
  const [transcript, setTranscript] = useState("");
  const [lang, setLang] = useState<Lang>("sr-RS");
  const [role, setRole] = useState<"doctor" | "patient">("doctor");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const examId = searchParams.get("examId") || undefined;

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

  return (
    <DashboardLayout role={role}>
      <motion.div
        initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 h-[calc(100vh-120px)]"
      >
        <div className="glass-card-elevated p-6 overflow-hidden flex flex-col">
          <ListenerPanel onTranscriptUpdate={handleTranscriptUpdate} onLangChange={setLang} />
        </div>
        <div className="glass-card-elevated p-6 overflow-hidden flex flex-col">
          <SmartFormPanel transcript={transcript} lang={lang} examId={examId} />
        </div>
      </motion.div>
    </DashboardLayout>
  );
}

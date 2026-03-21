import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import TopNav from "@/components/TopNav";
import ListenerPanel from "@/components/ListenerPanel";
import type { Lang } from "@/components/ListenerPanel";
import SmartFormPanel from "@/components/SmartFormPanel";

const Index = () => {
  const [transcript, setTranscript] = useState("");
  const [lang, setLang] = useState<Lang>("en-US");

  const handleTranscriptUpdate = useCallback((text: string) => {
    setTranscript(text);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <TopNav />

      <main className="flex-1 px-6 pb-6 lg:px-8 lg:pb-8">
        <motion.div
          initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 h-[calc(100vh-88px)]"
        >
          <div className="glass-card-elevated p-6 overflow-hidden flex flex-col">
            <ListenerPanel onTranscriptUpdate={handleTranscriptUpdate} onLangChange={setLang} />
          </div>

          <div className="glass-card-elevated p-6 overflow-hidden flex flex-col">
            <SmartFormPanel transcript={transcript} lang={lang} />
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Index;

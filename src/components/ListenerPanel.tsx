import { useState, useEffect, useCallback, useRef } from "react";
import { Mic, MicOff, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ListenerPanelProps {
  onTranscriptUpdate: (text: string) => void;
}

type Lang = "en-US" | "sr-RS";

const LANG_LABELS: Record<Lang, string> = {
  "en-US": "English",
  "sr-RS": "Srpski",
};

const ListenerPanel = ({ onTranscriptUpdate }: ListenerPanelProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [lines, setLines] = useState<string[]>([]);
  const [interimText, setInterimText] = useState("");
  const [lang, setLang] = useState<Lang>("en-US");
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Check browser support
  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) setSupported(false);
  }, []);

  const stopRecognition = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.onresult = null;
      recognitionRef.current.onerror = null;
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);
    setInterimText("");
  }, []);

  const startRecognition = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    const recognition = new SR();
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          setLines((prev) => [...prev, transcript.trim()]);
          setInterimText("");
        } else {
          interim += transcript;
        }
      }
      if (interim) setInterimText(interim);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error);
      if (event.error !== "no-speech") {
        stopRecognition();
      }
    };

    recognition.onend = () => {
      // Auto-restart if still recording (browser stops after silence)
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch {
          stopRecognition();
        }
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  }, [lang, stopRecognition]);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecognition();
    } else {
      setLines([]);
      setInterimText("");
      startRecognition();
    }
  }, [isRecording, stopRecognition, startRecognition]);

  const fullText = lines.join(" ");

  // Update parent with full transcript
  useEffect(() => {
    onTranscriptUpdate(fullText);
  }, [fullText, onTranscriptUpdate]);

  const handleManualEdit = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setLines(newText ? newText.split(/(?<=\.)\s+|(?<=\n)/).filter(Boolean) : []);
  };

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines, interimText]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopRecognition();
  }, [stopRecognition]);

  const toggleLang = () => {
    const wasRecording = isRecording;
    if (wasRecording) stopRecognition();
    setLang((l) => (l === "en-US" ? "sr-RS" : "en-US"));
    // If was recording, restart with new lang after state update
    if (wasRecording) {
      setTimeout(() => startRecognition(), 100);
    }
  };

  if (!supported) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <p className="text-sm text-destructive">
          Your browser does not support Speech Recognition. Please use Chrome or Edge.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Live Transcript
        </h2>
        <button
          onClick={toggleLang}
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors duration-200 active:scale-[0.96] px-2.5 py-1.5 rounded-full bg-muted/40"
        >
          <Globe size={13} strokeWidth={1.8} />
          {LANG_LABELS[lang]}
        </button>
      </div>

      {/* Record Button */}
      <div className="flex justify-center mb-8">
        <button
          onClick={toggleRecording}
          className="relative group active:scale-[0.95] transition-transform duration-150"
        >
          {isRecording && (
            <>
              <span className="absolute inset-0 rounded-full bg-destructive/30" style={{ animation: "pulse-ring 1.5s ease-out infinite" }} />
              <span className="absolute inset-0 rounded-full bg-destructive/20" style={{ animation: "pulse-ring 1.5s ease-out infinite 0.4s" }} />
            </>
          )}
          <div
            className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
              isRecording
                ? "bg-destructive text-destructive-foreground shadow-lg shadow-destructive/20"
                : "bg-primary text-primary-foreground shadow-md shadow-primary/15 group-hover:shadow-lg group-hover:shadow-primary/25"
            }`}
          >
            {isRecording ? <MicOff size={22} strokeWidth={1.8} /> : <Mic size={22} strokeWidth={1.8} />}
          </div>
        </button>
      </div>

      <p className="text-center text-xs text-muted-foreground mb-6">
        {isRecording ? "Listening…" : "Tap to begin recording"}
      </p>

      {/* Transcript area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 pr-1">
        <AnimatePresence>
          {lines.map((line, i) => (
            <motion.p
              key={`${i}-${line.slice(0, 20)}`}
              initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="text-sm leading-relaxed text-foreground/85"
            >
              {line}
            </motion.p>
          ))}
        </AnimatePresence>

        {interimText && (
          <p className="text-sm leading-relaxed text-muted-foreground/60 italic">
            {interimText}
            <span className="inline-block w-0.5 h-4 bg-primary ml-0.5 animate-pulse align-text-bottom" />
          </p>
        )}

        {lines.length === 0 && !isRecording && (
          <div className="flex items-center justify-center h-32">
            <p className="text-sm text-muted-foreground/60 italic">
              Transcript will appear here…
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ListenerPanel;

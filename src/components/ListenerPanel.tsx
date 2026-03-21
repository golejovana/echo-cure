import { useState, useEffect, useCallback } from "react";
import { Mic, MicOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const SAMPLE_TRANSCRIPT = [
  "Patient is a 52-year-old male presenting with persistent chest pain.",
  "Pain started approximately three days ago, radiating to the left arm.",
  "Patient reports a history of hypertension and type 2 diabetes.",
  "Current medications include Metformin 500mg twice daily and Lisinopril 10mg.",
  "Blood pressure measured at 145 over 92.",
  "Heart rate 88 beats per minute. Temperature 98.6°F.",
  "Oxygen saturation at 97 percent.",
  "Patient denies shortness of breath but reports mild dizziness.",
];

interface ListenerPanelProps {
  onTranscriptUpdate: (text: string) => void;
}

const ListenerPanel = ({ onTranscriptUpdate }: ListenerPanelProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [lines, setLines] = useState<string[]>([]);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);

  const toggleRecording = useCallback(() => {
    if (!isRecording) {
      setLines([]);
      setCurrentCharIndex(0);
      setCurrentLineIndex(0);
    }
    setIsRecording((r) => !r);
  }, [isRecording]);

  useEffect(() => {
    if (!isRecording || currentLineIndex >= SAMPLE_TRANSCRIPT.length) {
      if (currentLineIndex >= SAMPLE_TRANSCRIPT.length) setIsRecording(false);
      return;
    }

    const line = SAMPLE_TRANSCRIPT[currentLineIndex];
    if (currentCharIndex < line.length) {
      const timer = setTimeout(() => {
        setLines((prev) => {
          const copy = [...prev];
          copy[currentLineIndex] = line.slice(0, currentCharIndex + 1);
          return copy;
        });
        setCurrentCharIndex((c) => c + 1);
      }, 28 + Math.random() * 22);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        setCurrentLineIndex((l) => l + 1);
        setCurrentCharIndex(0);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isRecording, currentCharIndex, currentLineIndex]);

  useEffect(() => {
    onTranscriptUpdate(lines.join(" "));
  }, [lines, onTranscriptUpdate]);

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-6">
        Live Transcript
      </h2>

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
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        <AnimatePresence>
          {lines.map((line, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="text-sm leading-relaxed text-foreground/85"
            >
              {line}
              {i === currentLineIndex && isRecording && (
                <span className="inline-block w-0.5 h-4 bg-primary ml-0.5 animate-pulse align-text-bottom" />
              )}
            </motion.p>
          ))}
        </AnimatePresence>

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

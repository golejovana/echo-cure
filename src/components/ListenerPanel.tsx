import { useState, useCallback, useRef, useEffect } from "react";
import { Mic, MicOff, Pause, Play, Globe, RotateCcw, PenLine, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/i18n/LanguageContext";
import AudioWaveform from "@/components/AudioWaveform";
import RecordingTimer from "@/components/RecordingTimer";
import TranscriptDisplay, { type TranscriptSegment } from "@/components/TranscriptDisplay";

export type Lang = "en-US" | "sr-RS" | "fr-FR";

interface ListenerPanelProps {
  onTranscriptUpdate: (text: string) => void;
  onLangChange?: (lang: Lang) => void;
  onDemoClick?: () => void;
}

const LANG_MAP: Record<string, Lang> = {
  sr: "sr-RS",
  en: "en-US",
  fr: "fr-FR",
};

const LANG_LABELS: Record<Lang, string> = {
  "en-US": "English",
  "sr-RS": "Srpski",
  "fr-FR": "Français",
};

const LANG_CYCLE: Lang[] = ["sr-RS", "en-US", "fr-FR"];

const RECONNECT_DELAY = 200;

type RecordingState = "idle" | "recording" | "paused" | "processing";

let segmentCounter = 0;

const ListenerPanel = ({ onTranscriptUpdate, onLangChange }: ListenerPanelProps) => {
  const { t, language } = useTranslation();
  const sttLang = LANG_MAP[language] || "sr-RS";

  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [segments, setSegments] = useState<TranscriptSegment[]>([]);
  const [interimText, setInterimText] = useState("");
  const [lang, setLang] = useState<Lang>(sttLang);
  const [supported, setSupported] = useState(true);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualNote, setManualNote] = useState("");
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

  const recRef = useRef<any>(null);
  const manualStopRef = useRef(false);
  const recordingStateRef = useRef<RecordingState>(recordingState);
  const segmentsRef = useRef<TranscriptSegment[]>([]);

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) setSupported(false);
  }, []);

  // Sync refs
  useEffect(() => {
    segmentsRef.current = segments;
  }, [segments]);
  useEffect(() => {
    recordingStateRef.current = recordingState;
  }, [recordingState]);

  // Notify parent with full text
  useEffect(() => {
    const fullText = segments.map((s) => s.text).join("\n");
    onTranscriptUpdate(fullText);
  }, [segments, onTranscriptUpdate]);

  const pushSegment = useCallback((raw: string, confidence: number) => {
    const text = raw.trim();
    if (!text) return;
    const seg: TranscriptSegment = {
      id: `seg-${++segmentCounter}`,
      text,
      confidence,
      timestamp: Date.now(),
    };
    setSegments((prev) => [...prev, seg]);
  }, []);

  const cleanupWithAI = useCallback(async (segments: TranscriptSegment[]) => {
    const fullText = segments.map((s) => s.text).join("\n");
    if (!fullText.trim()) return;

    setRecordingState("processing");
    try {
      const { data, error } = await supabase.functions.invoke("cleanup-medical-terms", {
        body: { text: fullText, lang },
      });
      if (data?.cleaned && data.cleaned !== fullText) {
        const lines = data.cleaned.split("\n").filter((l: string) => l.trim());
        setSegments((prev) => {
          const updated = prev.map((seg, i) => ({
            ...seg,
            text: lines[i]?.trim() || seg.text,
          }));
          return updated;
        });
      }
    } catch (err) {
      console.warn("AI cleanup failed:", err);
    }
    setRecordingState("idle");
  }, [lang]);

  const acquireMic = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMediaStream(stream);
      return stream;
    } catch {
      return null;
    }
  }, []);

  const releaseMic = useCallback(() => {
    if (mediaStream) {
      mediaStream.getTracks().forEach((t) => t.stop());
      setMediaStream(null);
    }
  }, [mediaStream]);

  const startRecognition = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    if (recRef.current) {
      recRef.current.onresult = null;
      recRef.current.onerror = null;
      recRef.current.onend = null;
      try { recRef.current.stop(); } catch {}
      recRef.current = null;
    }

    const rec = new SR();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onresult = (e: SpeechRecognitionEvent) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i];
        const txt = result[0].transcript;
        const conf = result[0].confidence || 0.9;
        if (result.isFinal) {
          pushSegment(txt, conf);
          setInterimText("");
        } else {
          interim += txt;
        }
      }
      if (interim) setInterimText(interim);
    };

    rec.onerror = (e: SpeechRecognitionErrorEvent) => {
      const ignorable = ["no-speech", "network", "aborted"];
      if (!ignorable.includes(e.error)) {
        console.warn("STT fatal error:", e.error);
      }
      // Don't call rec.stop() here — let onend handle restart naturally
    };

    rec.onend = () => {
      if (!manualStopRef.current && recordingStateRef.current === "recording") {
        setTimeout(() => {
          if (!manualStopRef.current) startRecognition();
        }, RECONNECT_DELAY);
      }
    };

    recRef.current = rec;
    try {
      rec.start();
      manualStopRef.current = false;
      setRecordingState("recording");
    } catch {
      setTimeout(() => {
        if (!manualStopRef.current) startRecognition();
      }, RECONNECT_DELAY);
    }
  }, [lang, pushSegment]);

  const stopRecognition = useCallback(() => {
    manualStopRef.current = true;
    if (recRef.current) {
      recRef.current.onresult = null;
      recRef.current.onerror = null;
      recRef.current.onend = null;
      try { recRef.current.stop(); } catch {}
      recRef.current = null;
    }
    setInterimText("");
  }, []);

  const toggleRecording = useCallback(async () => {
    if (recordingState === "recording" || recordingState === "paused") {
      stopRecognition();
      releaseMic();
      const currentSegments = segmentsRef.current;
      // Run AI cleanup after stopping
      if (currentSegments.length > 0) {
        cleanupWithAI(currentSegments);
      } else {
        setRecordingState("idle");
      }
    } else if (recordingState === "idle") {
      setSegments([]);
      setInterimText("");
      segmentCounter = 0;
      await acquireMic();
      startRecognition();
    }
  }, [recordingState, stopRecognition, startRecognition, releaseMic, acquireMic, cleanupWithAI]);

  const togglePause = useCallback(() => {
    if (recordingState === "recording") {
      manualStopRef.current = true;
      if (recRef.current) {
        recRef.current.onend = null;
        try { recRef.current.stop(); } catch {}
        recRef.current = null;
      }
      setRecordingState("paused");
      setInterimText("");
    } else if (recordingState === "paused") {
      manualStopRef.current = false;
      startRecognition();
    }
  }, [recordingState, startRecognition]);

  const handleClearRestart = useCallback(() => {
    stopRecognition();
    releaseMic();
    setSegments([]);
    setInterimText("");
    segmentCounter = 0;
    setRecordingState("idle");
  }, [stopRecognition, releaseMic]);

  const handleInsertNote = useCallback(() => {
    if (!manualNote.trim()) return;
    pushSegment(manualNote.trim(), 1.0);
    setManualNote("");
    setShowManualInput(false);
  }, [manualNote, pushSegment]);

  const handleEditSegment = useCallback((id: string, newText: string) => {
    setSegments((prev) => prev.map((s) => (s.id === id ? { ...s, text: newText } : s)));
  }, []);

  // Sync STT lang with global language
  useEffect(() => {
    const newLang = LANG_MAP[language] || "sr-RS";
    if (newLang !== lang) {
      const wasActive = recordingState === "recording";
      if (wasActive) stopRecognition();
      setLang(newLang);
      onLangChange?.(newLang);
      if (wasActive) setTimeout(() => startRecognition(), 250);
    }
  }, [language]);

  const cycleLang = () => {
    const wasActive = recordingState === "recording";
    if (wasActive) stopRecognition();
    setLang((current) => {
      const idx = LANG_CYCLE.indexOf(current);
      const next = LANG_CYCLE[(idx + 1) % LANG_CYCLE.length];
      onLangChange?.(next);
      return next;
    });
    if (wasActive) setTimeout(() => startRecognition(), 250);
  };

  // Cleanup on unmount
  useEffect(() => () => {
    manualStopRef.current = true;
    stopRecognition();
  }, [stopRecognition]);

  if (!supported) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <p className="text-sm text-destructive">{t("listener.unsupported")}</p>
      </div>
    );
  }

  const isActive = recordingState === "recording";

  const statusLabel =
    recordingState === "recording"
      ? t("listener.listening")
      : recordingState === "paused"
      ? t("listener.paused")
      : recordingState === "processing"
      ? t("listener.processing")
      : t("listener.tapToRecord");

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          {t("listener.title")}
        </h2>
        <button
          onClick={cycleLang}
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors duration-200 active:scale-[0.96] px-2.5 py-1.5 rounded-full bg-muted/40"
        >
          <Globe size={13} strokeWidth={1.8} />
          {LANG_LABELS[lang]}
        </button>
      </div>

      {/* Main Controls */}
      <div className="flex justify-center items-center gap-4 mb-3">
        <button
          onClick={toggleRecording}
          disabled={recordingState === "processing"}
          className="relative group active:scale-[0.95] transition-transform duration-150 disabled:opacity-50"
        >
          {isActive && (
            <>
              <span className="absolute inset-0 rounded-full bg-destructive/30" style={{ animation: "pulse-ring 1.5s ease-out infinite" }} />
              <span className="absolute inset-0 rounded-full bg-destructive/20" style={{ animation: "pulse-ring 1.5s ease-out infinite 0.4s" }} />
            </>
          )}
          <div
            className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
              recordingState !== "idle"
                ? "bg-destructive text-destructive-foreground shadow-lg shadow-destructive/20"
                : "bg-primary text-primary-foreground shadow-md shadow-primary/15 group-hover:shadow-lg group-hover:shadow-primary/25"
            }`}
          >
            {recordingState !== "idle" ? <MicOff size={22} strokeWidth={1.8} /> : <Mic size={22} strokeWidth={1.8} />}
          </div>
        </button>

        <AnimatePresence>
          {(recordingState === "recording" || recordingState === "paused") && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={togglePause}
              className="active:scale-[0.95] transition-transform duration-150"
              title={recordingState === "paused" ? t("listener.resume") : t("listener.pause")}
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                  recordingState === "paused"
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/15"
                    : "bg-muted text-muted-foreground shadow-sm hover:bg-muted/80"
                }`}
              >
                {recordingState === "paused" ? <Play size={18} strokeWidth={1.8} /> : <Pause size={18} strokeWidth={1.8} />}
              </div>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Waveform + Timer */}
      <div className="flex flex-col items-center gap-1 mb-3 min-h-[40px]">
        <AudioWaveform isActive={isActive} barCount={7} stream={mediaStream} />
        <RecordingTimer isActive={isActive} />
      </div>

      {/* Status */}
      <AnimatePresence mode="wait">
        <motion.p
          key={recordingState}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          className={`text-center text-xs mb-4 ${
            recordingState === "processing"
              ? "text-primary animate-pulse"
              : "text-muted-foreground"
          }`}
        >
          {statusLabel}
        </motion.p>
      </AnimatePresence>

      {/* Transcript */}
      <TranscriptDisplay
        segments={segments}
        interimText={interimText}
        onEditSegment={handleEditSegment}
      />

      {/* Manual Note Input */}
      <AnimatePresence>
        {showManualInput && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 flex gap-2"
          >
            <input
              type="text"
              value={manualNote}
              onChange={(e) => setManualNote(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleInsertNote()}
              placeholder={t("listener.manualNotePlaceholder")}
              className="flex-1 text-xs px-3 py-2 rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              autoFocus
            />
            <button
              onClick={handleInsertNote}
              className="text-xs px-3 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {t("listener.addNote")}
            </button>
            <button
              onClick={() => { setShowManualInput(false); setManualNote(""); }}
              className="p-2 text-muted-foreground hover:text-foreground"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Controls */}
      <div className="flex items-center justify-center gap-3 mt-3 pt-3 border-t border-border/50">
        <button
          onClick={handleClearRestart}
          disabled={segments.length === 0 && recordingState === "idle"}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
        >
          <RotateCcw size={13} />
          {t("listener.clearRestart")}
        </button>
        <span className="w-px h-4 bg-border" />
        <button
          onClick={() => setShowManualInput(true)}
          disabled={showManualInput}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
        >
          <PenLine size={13} />
          {t("listener.insertNote")}
        </button>
      </div>
    </div>
  );
};

export default ListenerPanel;

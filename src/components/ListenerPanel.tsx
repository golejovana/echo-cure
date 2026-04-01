import { useState, useCallback, useRef, useEffect } from "react";
import { Mic, MicOff, Pause, Play, Globe } from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";
import AudioWaveform from "@/components/AudioWaveform";

export type Lang = "en-US" | "sr-RS";

interface ListenerPanelProps {
  onTranscriptUpdate: (text: string) => void;
  onLangChange?: (lang: Lang) => void;
}

const LANG_MAP: Record<string, Lang> = {
  sr: "sr-RS",
  en: "en-US",
  fr: "en-US", // fallback for French STT
};

const RECONNECT_DELAY = 200;

function cleanSegment(text: string): string {
  return text.trim();
}

const ListenerPanel = ({ onTranscriptUpdate, onLangChange }: ListenerPanelProps) => {
  const { t, language } = useTranslation();
  const sttLang = LANG_MAP[language] || "sr-RS";
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimText, setInterimText] = useState("");
  const [lang, setLang] = useState<Lang>(sttLang);
  const [supported, setSupported] = useState(true);

  const recRef = useRef<any>(null);
  const manualStopRef = useRef(false);
  const transcriptRef = useRef("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) setSupported(false);
  }, []);

  // Keep ref in sync with state
  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  // Notify parent
  useEffect(() => {
    onTranscriptUpdate(transcript);
  }, [transcript, onTranscriptUpdate]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript, interimText]);

  const pushSegment = useCallback((raw: string) => {
    const labeled = cleanSegment(raw);
    if (!labeled) return;
    const prev = transcriptRef.current;
    const next = prev ? `${prev}\n${labeled}` : labeled;
    transcriptRef.current = next;
    setTranscript(next);
  }, []);

  const startRecognition = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    // Cleanup previous
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
        const txt = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          // Immediately flush final result to permanent state
          pushSegment(txt);
          setInterimText("");
        } else {
          interim += txt;
        }
      }
      if (interim) setInterimText(interim);
    };

    rec.onerror = (e: SpeechRecognitionErrorEvent) => {
      console.warn("STT error:", e.error);
      // Let onend handle auto-restart
      if (e.error !== "aborted") {
        try { rec.stop(); } catch {}
      }
    };

    rec.onend = () => {
      // Silent auto-restart unless manually stopped
      if (!manualStopRef.current) {
        setTimeout(() => {
          if (!manualStopRef.current) {
            startRecognition();
          }
        }, RECONNECT_DELAY);
      }
    };

    recRef.current = rec;
    try {
      rec.start();
      manualStopRef.current = false;
      setIsRecording(true);
    } catch (err) {
      console.error("STT start failed:", err);
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
    setIsRecording(false);
    setIsPaused(false);
    setInterimText("");
  }, []);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecognition();
    } else {
      // Reset for new session
      transcriptRef.current = "";
      setTranscript("");
      setInterimText("");
      setIsPaused(false);
      startRecognition();
    }
  }, [isRecording, stopRecognition, startRecognition]);

  const togglePause = useCallback(() => {
    if (!isRecording) return;
    if (isPaused) {
      manualStopRef.current = false;
      startRecognition();
      setIsPaused(false);
    } else {
      manualStopRef.current = true;
      if (recRef.current) {
        recRef.current.onend = null;
        try { recRef.current.stop(); } catch {}
        recRef.current = null;
      }
      setIsPaused(true);
      setInterimText("");
    }
  }, [isRecording, isPaused, startRecognition]);

  const handleManualEdit = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    transcriptRef.current = val;
    setTranscript(val);
  };

  // Sync STT language with global language context
  useEffect(() => {
    const newLang = LANG_MAP[language] || "sr-RS";
    if (newLang !== lang) {
      const wasRecording = isRecording;
      if (wasRecording) stopRecognition();
      setLang(newLang);
      onLangChange?.(newLang);
      if (wasRecording) setTimeout(() => startRecognition(), 250);
    }
  }, [language]);

  const toggleLang = () => {
    const wasRecording = isRecording;
    if (wasRecording) stopRecognition();
    setLang((l) => {
      const next = l === "en-US" ? "sr-RS" : "en-US";
      onLangChange?.(next);
      return next;
    });
    if (wasRecording) setTimeout(() => startRecognition(), 250);
  };

  // Cleanup on unmount
  useEffect(() => () => { manualStopRef.current = true; stopRecognition(); }, [stopRecognition]);

  if (!supported) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <p className="text-sm text-destructive">{t("listener.unsupported")}</p>
      </div>
    );
  }

  const activeListening = isRecording && !isPaused;
  const displayText = transcript + (interimText ? (transcript ? "\n" : "") + `... ${interimText}` : "");

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">{t("listener.title")}</h2>
        <button onClick={toggleLang} className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors duration-200 active:scale-[0.96] px-2.5 py-1.5 rounded-full bg-muted/40">
          <Globe size={13} strokeWidth={1.8} />
          {lang === "en-US" ? t("listener.english") : t("listener.serbian")}
        </button>
      </div>

      <div className="flex justify-center items-center gap-4 mb-4">
        <button onClick={toggleRecording} className="relative group active:scale-[0.95] transition-transform duration-150">
          {activeListening && (
            <>
              <span className="absolute inset-0 rounded-full bg-destructive/30" style={{ animation: "pulse-ring 1.5s ease-out infinite" }} />
              <span className="absolute inset-0 rounded-full bg-destructive/20" style={{ animation: "pulse-ring 1.5s ease-out infinite 0.4s" }} />
            </>
          )}
          <div className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
            isRecording ? "bg-destructive text-destructive-foreground shadow-lg shadow-destructive/20" : "bg-primary text-primary-foreground shadow-md shadow-primary/15 group-hover:shadow-lg group-hover:shadow-primary/25"
          }`}>
            {isRecording ? <MicOff size={22} strokeWidth={1.8} /> : <Mic size={22} strokeWidth={1.8} />}
          </div>
        </button>

        {isRecording && (
          <button onClick={togglePause} className="active:scale-[0.95] transition-transform duration-150" title={isPaused ? t("listener.resume") : t("listener.pause")}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
              isPaused ? "bg-primary text-primary-foreground shadow-md shadow-primary/15" : "bg-muted text-muted-foreground shadow-sm hover:bg-muted/80"
            }`}>
              {isPaused ? <Play size={18} strokeWidth={1.8} /> : <Pause size={18} strokeWidth={1.8} />}
            </div>
          </button>
        )}
      </div>

      <div className="flex justify-center mb-4 h-6">
        <AudioWaveform isActive={activeListening} barCount={7} />
      </div>

      <p className="text-center text-xs text-muted-foreground mb-6">
        {isRecording ? (isPaused ? t("listener.paused") : t("listener.listening")) : t("listener.tapToRecord")}
      </p>

      <div ref={scrollRef} className="flex-1 overflow-y-auto pr-1">
        <textarea
          value={displayText}
          onChange={handleManualEdit}
          placeholder={t("listener.placeholder")}
          className="w-full h-full min-h-[120px] bg-transparent text-sm leading-relaxed text-foreground/85 placeholder:text-muted-foreground/50 placeholder:italic resize-none focus:outline-none"
          style={{ overflowWrap: "break-word" }}
        />
      </div>
    </div>
  );
};

export default ListenerPanel;

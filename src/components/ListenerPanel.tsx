import { useState, useEffect, useCallback, useRef } from "react";
import { Mic, MicOff, Pause, Play, Globe } from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";
import AudioWaveform from "@/components/AudioWaveform";

export type Lang = "en-US" | "sr-RS";

interface ListenerPanelProps {
  onTranscriptUpdate: (text: string) => void;
  onLangChange?: (lang: Lang) => void;
}

const LANG_LABELS: Record<Lang, string> = {
  "en-US": "English",
  "sr-RS": "Srpski",
};

const MAX_RECONNECT_ATTEMPTS = 50;
const RECONNECT_DELAY = 300;

const ListenerPanel = ({ onTranscriptUpdate, onLangChange }: ListenerPanelProps) => {
  const { t } = useTranslation();
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [lines, setLines] = useState<string[]>([]);
  const [interimText, setInterimText] = useState("");
  const [lang, setLang] = useState<Lang>("sr-RS");
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const shouldBeRecording = useRef(false);
  const reconnectAttempts = useRef(0);
  const isManuallyStopped = useRef(false);

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) setSupported(false);
  }, []);

  const stopRecognition = useCallback(() => {
    isManuallyStopped.current = true;
    shouldBeRecording.current = false;
    reconnectAttempts.current = 0;
    if (recognitionRef.current) {
      recognitionRef.current.onresult = null;
      recognitionRef.current.onerror = null;
      recognitionRef.current.onend = null;
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    setIsRecording(false);
    setIsPaused(false);
    setInterimText("");
  }, []);

  const startRecognition = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    // Clean up any existing instance
    if (recognitionRef.current) {
      recognitionRef.current.onresult = null;
      recognitionRef.current.onerror = null;
      recognitionRef.current.onend = null;
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }

    const recognition = new SR();
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

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
      console.warn("Speech recognition error:", event.error);
      // For "no-speech" and "audio-capture" errors, just let onend handle reconnection
      // Don't stop — the onend handler will auto-resume
      if (event.error === "aborted") {
        // Browser killed it, onend will fire
      }
    };

    recognition.onend = () => {
      // Auto-resume if we should still be recording (not manually stopped, not paused)
      if (shouldBeRecording.current && !isManuallyStopped.current) {
        if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts.current++;
          setTimeout(() => {
            if (shouldBeRecording.current && !isManuallyStopped.current) {
              startRecognition();
            }
          }, RECONNECT_DELAY);
        } else {
          console.error("Max reconnect attempts reached");
          stopRecognition();
        }
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      isManuallyStopped.current = false;
      shouldBeRecording.current = true;
      reconnectAttempts.current = 0;
      setIsRecording(true);
    } catch (e) {
      console.error("Failed to start recognition:", e);
      // Retry after delay
      setTimeout(() => {
        if (shouldBeRecording.current) startRecognition();
      }, RECONNECT_DELAY);
    }
  }, [lang, stopRecognition]);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecognition();
    } else {
      setLines([]);
      setInterimText("");
      setIsPaused(false);
      isManuallyStopped.current = false;
      startRecognition();
    }
  }, [isRecording, stopRecognition, startRecognition]);

  const togglePause = useCallback(() => {
    if (!isRecording) return;
    if (isPaused) {
      isManuallyStopped.current = false;
      startRecognition();
      setIsPaused(false);
    } else {
      shouldBeRecording.current = false;
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        try { recognitionRef.current.stop(); } catch {}
        recognitionRef.current = null;
      }
      setIsPaused(true);
      setInterimText("");
    }
  }, [isRecording, isPaused, startRecognition]);

  const fullText = lines.join(" ");

  useEffect(() => { onTranscriptUpdate(fullText); }, [fullText, onTranscriptUpdate]);

  const handleManualEdit = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setLines(newText ? newText.split(/(?<=\.)\s+|(?<=\n)/).filter(Boolean) : []);
  };

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [lines, interimText]);

  useEffect(() => { return () => { shouldBeRecording.current = false; stopRecognition(); }; }, [stopRecognition]);

  const toggleLang = () => {
    const wasRecording = isRecording;
    if (wasRecording) stopRecognition();
    setLang((l) => {
      const next = l === "en-US" ? "sr-RS" : "en-US";
      onLangChange?.(next);
      return next;
    });
    if (wasRecording) setTimeout(() => { isManuallyStopped.current = false; startRecognition(); }, 200);
  };

  if (!supported) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <p className="text-sm text-destructive">{t("listener.unsupported")}</p>
      </div>
    );
  }

  const activeListening = isRecording && !isPaused;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">{t("listener.title")}</h2>
        <button onClick={toggleLang} className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors duration-200 active:scale-[0.96] px-2.5 py-1.5 rounded-full bg-muted/40">
          <Globe size={13} strokeWidth={1.8} />
          {LANG_LABELS[lang]}
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

      {/* Waveform animation */}
      <div className="flex justify-center mb-4 h-6">
        <AudioWaveform isActive={activeListening} barCount={7} />
      </div>

      <p className="text-center text-xs text-muted-foreground mb-6">
        {isRecording ? (isPaused ? t("listener.paused") : t("listener.listening")) : t("listener.tapToRecord")}
      </p>

      <div ref={scrollRef} className="flex-1 overflow-y-auto pr-1">
        <textarea
          value={fullText + (interimText ? (fullText ? " " : "") + interimText : "")}
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

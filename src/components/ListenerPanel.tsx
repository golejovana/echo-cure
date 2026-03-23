import { useState, useCallback, useRef, useEffect } from "react";
import { Mic, MicOff, Globe, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export type Lang = "en-US" | "sr-RS";

interface ListenerPanelProps {
  onTranscriptUpdate: (text: string) => void;
  onLangChange?: (lang: Lang) => void;
}

const LANG_LABELS: Record<Lang, string> = {
  "en-US": "English",
  "sr-RS": "Srpski",
};

// Interval in ms to send audio chunks to Whisper
const CHUNK_INTERVAL = 5000;

const ListenerPanel = ({ onTranscriptUpdate, onLangChange }: ListenerPanelProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [lines, setLines] = useState<string[]>([]);
  const [lang, setLang] = useState<Lang>("en-US");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fullText = lines.join(" ");

  // Update parent with full transcript
  useEffect(() => {
    onTranscriptUpdate(fullText);
  }, [fullText, onTranscriptUpdate]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  const sendChunkToWhisper = useCallback(async (audioBlob: Blob) => {
    if (audioBlob.size < 1000) return; // Skip tiny chunks (silence)

    setIsTranscribing(true);
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "audio.webm");
      formData.append("lang", lang);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transcribe-audio`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const err = await response.json();
        console.error("Transcription error:", err.error);
        return;
      }

      const data = await response.json();
      if (data.transcript) {
        setLines((prev) => [...prev, data.transcript]);
      }
    } catch (e) {
      console.error("Failed to transcribe:", e);
    } finally {
      setIsTranscribing(false);
    }
  }, [lang]);

  const flushChunks = useCallback(() => {
    if (chunksRef.current.length === 0) return;
    const blob = new Blob(chunksRef.current, { type: "audio/webm;codecs=opus" });
    chunksRef.current = [];
    sendChunkToWhisper(blob);
  }, [sendChunkToWhisper]);

  const stopRecording = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    // Flush remaining chunks
    if (chunksRef.current.length > 0) {
      const blob = new Blob(chunksRef.current, { type: "audio/webm;codecs=opus" });
      chunksRef.current = [];
      sendChunkToWhisper(blob);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
    setIsRecording(false);
  }, [sendChunkToWhisper]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.start(1000); // Collect data every 1s
      setIsRecording(true);

      // Send chunks to Whisper every CHUNK_INTERVAL ms
      intervalRef.current = setInterval(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
          // Stop and restart to flush ondataavailable, then send
          mediaRecorderRef.current.stop();
          const blob = new Blob(chunksRef.current, { type: "audio/webm;codecs=opus" });
          chunksRef.current = [];
          sendChunkToWhisper(blob);
          mediaRecorderRef.current.start(1000);
        }
      }, CHUNK_INTERVAL);
    } catch (e) {
      console.error("Microphone access denied:", e);
    }
  }, [sendChunkToWhisper]);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      setLines([]);
      startRecording();
    }
  }, [isRecording, stopRecording, startRecording]);

  const handleManualEdit = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setLines(newText ? newText.split(/(?<=\.)\s+|(?<=\n)/).filter(Boolean) : []);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => stopRecording();
  }, [stopRecording]);

  const toggleLang = () => {
    const wasRecording = isRecording;
    if (wasRecording) stopRecording();
    setLang((l) => {
      const next = l === "en-US" ? "sr-RS" : "en-US";
      onLangChange?.(next);
      return next;
    });
    if (wasRecording) {
      setTimeout(() => startRecording(), 200);
    }
  };

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
        {isRecording
          ? isTranscribing
            ? "Transcribing…"
            : "Listening…"
          : "Tap to begin recording"}
      </p>

      {/* Transcript area - editable */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto pr-1">
        <textarea
          value={fullText}
          onChange={handleManualEdit}
          placeholder="Transcript will appear here… You can also type or edit directly."
          className="w-full h-full min-h-[120px] bg-transparent text-sm leading-relaxed text-foreground/85 placeholder:text-muted-foreground/50 placeholder:italic resize-none focus:outline-none"
          style={{ overflowWrap: "break-word" }}
        />
      </div>
    </div>
  );
};

export default ListenerPanel;

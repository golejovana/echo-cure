import { useEffect, useRef, useState, useCallback } from "react";

export interface TranscriptSegment {
  id: string;
  text: string;
  confidence: number;
  timestamp: number;
}

interface TranscriptDisplayProps {
  segments: TranscriptSegment[];
  interimText: string;
  onEditSegment: (id: string, newText: string) => void;
  onReplaceAllSegments?: (lines: string[]) => void;
}

const TranscriptDisplay = ({ segments, interimText, onEditSegment, onReplaceAllSegments }: TranscriptDisplayProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [localText, setLocalText] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  // Sync segments → localText when not focused
  useEffect(() => {
    if (!isFocused) {
      const combined = segments.map((s) => s.text).join("\n");
      const suffix = interimText ? `\n... ${interimText}` : "";
      setLocalText(combined + suffix);
    }
  }, [segments, interimText, isFocused]);

  // Auto-scroll when not focused
  useEffect(() => {
    if (!isFocused && textareaRef.current) {
      textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
    }
  }, [segments, interimText, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalText(e.target.value);
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (onReplaceAllSegments) {
      const lines = localText.split("\n").filter((l) => l.trim());
      onReplaceAllSegments(lines);
    }
  };

  return (
    <div className="flex-1 overflow-hidden">
      <textarea
        ref={textareaRef}
        value={localText}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={handleBlur}
        className="w-full h-full min-h-[120px] text-sm leading-relaxed text-foreground/85 bg-transparent border border-border/40 rounded-md px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50"
        placeholder="Transkript će se pojaviti ovde..."
      />
    </div>
  );
};

export default TranscriptDisplay;

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
}

const HIGHLIGHT_DURATION = 2000;

const TranscriptDisplay = ({ segments, interimText, onEditSegment }: TranscriptDisplayProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [recentIds, setRecentIds] = useState<Set<string>>(new Set());

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [segments, interimText]);

  // Track recently added segments for highlight
  useEffect(() => {
    if (segments.length === 0) return;
    const latest = segments[segments.length - 1];
    if (Date.now() - latest.timestamp < 500) {
      setRecentIds((prev) => new Set(prev).add(latest.id));
      const timer = setTimeout(() => {
        setRecentIds((prev) => {
          const next = new Set(prev);
          next.delete(latest.id);
          return next;
        });
      }, HIGHLIGHT_DURATION);
      return () => clearTimeout(timer);
    }
  }, [segments]);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto pr-1">
      <div className="text-sm leading-relaxed text-foreground/85 whitespace-pre-wrap">
        {segments.map((seg) => (
          <span
            key={seg.id}
            className={`transition-colors duration-1000 ${
              recentIds.has(seg.id) ? "bg-blue-100/60 dark:bg-blue-900/30" : ""
            }`}
          >
            {seg.text.split(" ").map((word, wi) => (
              <span
                key={wi}
                className={seg.confidence < 0.7 ? "underline decoration-orange-400 decoration-wavy underline-offset-2" : ""}
              >
                {word}{" "}
              </span>
            ))}
            {"\n"}
          </span>
        ))}
        {interimText && (
          <span className="text-muted-foreground/60 italic">... {interimText}</span>
        )}
      </div>
    </div>
  );
};

export default TranscriptDisplay;

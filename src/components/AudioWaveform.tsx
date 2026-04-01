import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

interface AudioWaveformProps {
  isActive: boolean;
  barCount?: number;
  stream?: MediaStream | null;
}

const AudioWaveform = ({ isActive, barCount = 7, stream }: AudioWaveformProps) => {
  const [amplitudes, setAmplitudes] = useState<number[]>(Array(barCount).fill(4));
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    if (!isActive || !stream) {
      setAmplitudes(Array(barCount).fill(4));
      return;
    }

    try {
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const tick = () => {
        analyser.getByteFrequencyData(dataArray);
        const step = Math.floor(dataArray.length / barCount);
        const bars: number[] = [];
        for (let i = 0; i < barCount; i++) {
          const val = dataArray[i * step] || 0;
          bars.push(Math.max(4, (val / 255) * 28));
        }
        setAmplitudes(bars);
        animRef.current = requestAnimationFrame(tick);
      };
      tick();

      return () => {
        cancelAnimationFrame(animRef.current);
        ctx.close();
        analyserRef.current = null;
      };
    } catch {
      // Fallback: no analyser available
    }
  }, [isActive, stream, barCount]);

  if (!isActive) return null;

  return (
    <div className="flex items-center justify-center gap-[3px] h-6">
      {amplitudes.map((h, i) => (
        <motion.div
          key={i}
          className="w-[3px] rounded-full bg-primary"
          animate={{ height: h }}
          transition={{ duration: 0.08, ease: "easeOut" }}
        />
      ))}
    </div>
  );
};

export default AudioWaveform;

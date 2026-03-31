import { motion } from "framer-motion";

interface AudioWaveformProps {
  isActive: boolean;
  barCount?: number;
}

const AudioWaveform = ({ isActive, barCount = 5 }: AudioWaveformProps) => {
  if (!isActive) return null;

  return (
    <div className="flex items-center justify-center gap-[3px] h-6">
      {Array.from({ length: barCount }).map((_, i) => (
        <motion.div
          key={i}
          className="w-[3px] rounded-full bg-primary"
          animate={{
            height: isActive ? [4, 16 + Math.random() * 8, 6, 20, 4] : [4],
          }}
          transition={{
            duration: 0.8 + Math.random() * 0.4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.1,
          }}
        />
      ))}
    </div>
  );
};

export default AudioWaveform;

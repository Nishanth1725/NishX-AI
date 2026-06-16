import { motion } from "framer-motion";
import { Scan } from "lucide-react";

export default function LoadingScanner({ message = "AI Processing..." }) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-16">
      <div className="relative h-32 w-full max-w-md overflow-hidden rounded-2xl border border-neon-cyan/30 bg-white/5">
        <motion.div
          className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-neon-cyan to-transparent shadow-glow"
          animate={{ top: ["0%", "100%"] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
        <div className="flex h-full items-center justify-center gap-3 text-neon-cyan">
          <Scan className="animate-pulse" size={28} />
          <span className="font-display text-sm tracking-widest uppercase">{message}</span>
        </div>
      </div>
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="h-2 w-2 rounded-full bg-neon-cyan"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
    </div>
  );
}

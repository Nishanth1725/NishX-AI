import { motion } from "framer-motion";

export default function AnimatedBackground({ variant = "default" }) {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-void via-deep to-[#0d1b2a]" />
      <motion.div
        className="absolute -top-1/2 -left-1/4 h-[800px] w-[800px] rounded-full bg-neon-cyan/10 blur-[120px]"
        animate={{ x: [0, 60, 0], y: [0, 40, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-1/4 -right-1/4 h-[700px] w-[700px] rounded-full bg-neon-purple/15 blur-[120px]"
        animate={{ x: [0, -50, 0], y: [0, -30, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-1/3 right-1/3 h-[400px] w-[400px] rounded-full bg-neon-blue/10 blur-[100px]"
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      {variant === "particles" &&
        Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-1 w-1 rounded-full bg-neon-cyan/60"
            style={{ left: `${(i * 17) % 100}%`, top: `${(i * 23) % 100}%` }}
            animate={{ opacity: [0.2, 0.8, 0.2], y: [0, -20, 0] }}
            transition={{ duration: 3 + (i % 5), repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,240,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,240,255,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px"
        }}
      />
    </div>
  );
}

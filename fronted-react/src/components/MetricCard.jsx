import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import GlassCard from "./GlassCard";

export default function MetricCard({ icon: Icon, label, value, suffix = "", delay = 0, color = "cyan" }) {
  const [count, setCount] = useState(0);
  const target = typeof value === "number" ? value : parseFloat(value) || 0;

  useEffect(() => {
    if (target === 0) {
      setCount(0);
      return;
    }
    let start = 0;
    const step = Math.ceil(target / 40);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 30);
    return () => clearInterval(timer);
  }, [target]);

  const colorMap = {
    cyan: "text-neon-cyan shadow-neon-cyan/30",
    purple: "text-neon-purple shadow-neon-purple/30",
    blue: "text-neon-blue",
    pink: "text-neon-pink"
  };

  return (
    <GlassCard delay={delay}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <motion.p
            className={`mt-2 font-display text-3xl font-bold ${colorMap[color]}`}
            key={count}
          >
            {typeof value === "string" ? value : count.toLocaleString()}
            {suffix}
          </motion.p>
        </div>
        <div className={`rounded-xl bg-white/5 p-3 ${colorMap[color]}`}>
          <Icon size={22} />
        </div>
      </div>
    </GlassCard>
  );
}

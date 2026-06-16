import { motion } from "framer-motion";

export default function GlassCard({ children, className = "", hover = true, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={`glass p-6 ${hover ? "glass-hover" : ""} ${className}`}
    >
      {children}
    </motion.div>
  );
}

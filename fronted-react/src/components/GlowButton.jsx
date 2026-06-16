import { motion } from "framer-motion";

export default function GlowButton({ children, onClick, variant = "primary", className = "", disabled = false, type = "button" }) {
  const base = variant === "primary" ? "glow-btn" : "glow-btn-outline";
  return (
    <motion.button
      type={type}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      onClick={onClick}
      disabled={disabled}
      className={`${base} disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </motion.button>
  );
}

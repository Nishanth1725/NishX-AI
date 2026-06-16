import { Bot } from "lucide-react";
import { motion } from "framer-motion";

export default function ChatLoadingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-3"
      role="status"
      aria-live="polite"
      aria-label="AI is generating a response"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-neon-cyan to-neon-purple">
        <Bot size={16} className="animate-pulse" />
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 animate-bounce rounded-full bg-neon-cyan [animation-delay:-0.3s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-neon-cyan [animation-delay:-0.15s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-neon-cyan" />
        </div>
      </div>
    </motion.div>
  );
}

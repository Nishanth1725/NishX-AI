import { motion } from "framer-motion";
import { Bell, Wifi } from "lucide-react";

export default function TopNavbar({ title, subtitle }) {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-30 mb-8 flex items-center justify-between rounded-2xl border border-white/10 bg-deep/60 px-6 py-4 backdrop-blur-xl"
    >
      <div>
        <h2 className="font-display text-xl font-bold text-white">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-slate-400">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          <span className="text-xs font-medium text-emerald-400">AI Online</span>
        </div>
        <div className="hidden items-center gap-2 text-slate-500 sm:flex">
          <Wifi size={16} />
          <span className="text-xs">Connected</span>
        </div>
        <button className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-400 transition hover:text-white">
          <Bell size={18} />
        </button>
      </div>
    </motion.header>
  );
}

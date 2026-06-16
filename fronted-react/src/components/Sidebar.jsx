import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Upload,
  BarChart3,
  MessageSquare,
  LogOut,
  Brain,
  Sparkles
} from "lucide-react";

const links = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/upload", icon: Upload, label: "Upload" },
  { to: "/analytics", icon: BarChart3, label: "Analytics" },
  { to: "/chat", icon: MessageSquare, label: "AI Assistant" }
];

export default function Sidebar({ onLogout, session }) {
  return (
    <motion.aside
      initial={{ x: -80, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-white/10 bg-deep/80 backdrop-blur-2xl"
    >
      <div className="flex items-center gap-3 border-b border-white/10 p-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-neon-cyan to-neon-purple shadow-glow">
          <Brain size={20} className="text-white" />
        </div>
        <div>
          <h1 className="font-display text-sm font-bold tracking-wider text-white">NishX AI</h1>
          <p className="text-[10px] text-slate-500 tracking-widest uppercase">Analytics Engine</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "sidebar-link-active" : ""}`
            }
          >
            <Icon size={18} />
            <span className="text-sm font-medium">{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="mb-3 rounded-xl bg-white/5 p-3">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-neon-cyan" />
            <span className="text-xs text-slate-400">Signed in as</span>
          </div>
          <p className="mt-1 truncate text-sm font-medium text-white">{session?.name}</p>
        </div>
        <button
          onClick={onLogout}
          className="sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
        >
          <LogOut size={18} />
          <span className="text-sm">Logout</span>
        </button>
      </div>
    </motion.aside>
  );
}

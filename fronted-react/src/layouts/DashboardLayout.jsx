import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu } from "lucide-react";
import AnimatedBackground from "../components/AnimatedBackground";
import Sidebar from "../components/Sidebar";

export default function DashboardLayout({ session, onLogout }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <AnimatedBackground />
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed left-4 top-4 z-50 rounded-xl border border-white/10 bg-deep/80 p-2 backdrop-blur-xl lg:hidden"
      >
        <Menu size={20} />
      </button>
      <div className={`${mobileOpen ? "block" : "hidden"} lg:block`}>
        <Sidebar session={session} onLogout={onLogout} />
      </div>
      <main className="min-h-screen p-4 pt-16 lg:ml-64 lg:p-8 lg:pt-8">
        <Outlet context={{ session }} />
      </main>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Database, TrendingUp, Zap, FileText, ArrowRight } from "lucide-react";
import api, { getApiError } from "../api/api";
import TopNavbar from "../components/TopNavbar";
import MetricCard from "../components/MetricCard";
import GlassCard from "../components/GlassCard";
import GlowButton from "../components/GlowButton";

export default function DashboardPage() {
  const { session } = useOutletContext();
  const navigate = useNavigate();
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/datasets/me")
      .then((res) => setDatasets(res.data))
      .catch((ex) => {
        console.error("[DashboardPage] Failed to load datasets:", getApiError(ex));
        setDatasets([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const totalRows = datasets.reduce((sum, d) => sum + (d.rowCount || 0), 0);

  return (
    <div>
      <TopNavbar
        title={`Welcome, ${session?.name?.split(" ")[0] || "Analyst"}`}
        subtitle="Your AI analytics command center"
      />

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Database} label="Datasets" value={datasets.length} delay={0} color="cyan" />
        <MetricCard icon={FileText} label="Total Rows" value={totalRows} delay={0.1} color="purple" />
        <MetricCard icon={TrendingUp} label="Models Trained" value={datasets.length > 0 ? datasets.length : 0} delay={0.2} color="blue" />
        <MetricCard icon={Zap} label="AI Status" value="Active" delay={0.3} color="pink" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <GlassCard delay={0.2}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-sm font-bold tracking-wider text-white uppercase">
              Recent Datasets
            </h3>
            <button
              onClick={() => navigate("/upload")}
              className="text-xs text-neon-cyan hover:underline"
            >
              Upload new →
            </button>
          </div>
          {loading ? (
            <p className="text-sm text-slate-500">Loading...</p>
          ) : datasets.length === 0 ? (
            <div className="py-8 text-center">
              <Database className="mx-auto mb-3 text-slate-600" size={32} />
              <p className="text-sm text-slate-500">No datasets yet</p>
              <GlowButton className="mt-4 !text-sm !px-4 !py-2" onClick={() => navigate("/upload")}>
                Upload First Dataset
              </GlowButton>
            </div>
          ) : (
            <div className="space-y-3">
              {datasets.slice(0, 5).map((d, i) => (
                <motion.div
                  key={d.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 transition hover:border-neon-cyan/20"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{d.fileName}</p>
                    <p className="text-xs text-slate-500">
                      {d.rowCount} rows · {d.columnCount} cols
                    </p>
                  </div>
                  <span className="rounded-full bg-neon-cyan/10 px-2 py-0.5 text-[10px] text-neon-cyan">
                    #{d.id}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </GlassCard>

        <GlassCard delay={0.3}>
          <h3 className="mb-4 font-display text-sm font-bold tracking-wider text-white uppercase">
            Quick Actions
          </h3>
          <div className="space-y-3">
            {[
              { label: "Upload Dataset", desc: "CSV or Excel files", path: "/upload", color: "from-neon-cyan/20 to-neon-blue/10" },
              { label: "Run Analytics", desc: "Charts & predictions", path: "/analytics", color: "from-neon-purple/20 to-neon-pink/10" },
              { label: "AI Assistant", desc: "Ask about your data", path: "/chat", color: "from-neon-blue/20 to-neon-cyan/10" }
            ].map((action) => (
              <motion.button
                key={action.path}
                whileHover={{ x: 4 }}
                onClick={() => navigate(action.path)}
                className={`flex w-full items-center justify-between rounded-xl border border-white/5 bg-gradient-to-r ${action.color} px-4 py-4 text-left transition hover:border-white/20`}
              >
                <div>
                  <p className="text-sm font-medium text-white">{action.label}</p>
                  <p className="text-xs text-slate-500">{action.desc}</p>
                </div>
                <ArrowRight size={16} className="text-slate-500" />
              </motion.button>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

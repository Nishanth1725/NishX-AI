import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Area, AreaChart
} from "recharts";
import { Sparkles, Play, TrendingUp } from "lucide-react";
import api, { getApiError } from "../api/api";
import TopNavbar from "../components/TopNavbar";
import GlassCard from "../components/GlassCard";
import GlowButton from "../components/GlowButton";
import LoadingScanner from "../components/LoadingScanner";

const tooltipStyle = {
  backgroundColor: "rgba(10, 15, 30, 0.95)",
  border: "1px solid rgba(0, 240, 255, 0.2)",
  borderRadius: "12px",
  color: "#fff"
};

export default function AnalyticsPage() {
  const [datasets, setDatasets] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/datasets/me").then((res) => {
      setDatasets(res.data);
      if (res.data.length > 0) setSelectedId(String(res.data[0].id));
    }).catch((ex) => {
      console.error("[AnalyticsPage] Failed to load datasets:", getApiError(ex));
    });
  }, []);

  const selected = datasets.find((d) => String(d.id) === String(selectedId));

  const shapeData = selected
    ? [
        { name: "Rows", value: selected.rowCount || 0 },
        { name: "Columns", value: selected.columnCount || 0 }
      ]
    : [];

  const predictionChart = prediction?.result?.predictions?.map((val, i) => ({
    index: `#${i + 1}`,
    value: Number(val.toFixed(2))
  })) || [];

  const runPrediction = async () => {
    if (!selectedId) return;
    setLoading(true);
    setError("");
    setPrediction(null);
    try {
      const { data } = await api.post(`/predictions/run?datasetId=${selectedId}`);
      setPrediction(data);
    } catch (ex) {
      setError(getApiError(ex, "Prediction failed. Is Python engine running?"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <TopNavbar title="Analytics" subtitle="Interactive visualizations & ML predictions" />

      <div className="mb-6 flex flex-wrap items-center gap-4">
        <select
          value={selectedId}
          onChange={(e) => { setSelectedId(e.target.value); setPrediction(null); }}
          className="input-futuristic w-auto min-w-[240px]"
        >
          <option value="">Select dataset</option>
          {datasets.map((d) => (
            <option key={d.id} value={d.id}>{d.fileName}</option>
          ))}
        </select>
        <GlowButton onClick={runPrediction} disabled={!selectedId || loading} className="flex items-center gap-2 !py-2.5">
          <Play size={16} /> Run Prediction
        </GlowButton>
      </div>

      {loading && <LoadingScanner message="Training ML Model..." />}

      {error && (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard delay={0}>
          <h3 className="mb-4 font-display text-sm font-bold tracking-wider uppercase text-slate-300">
            Dataset Shape
          </h3>
          {shapeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={shapeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" fill="url(#barGradient)" radius={[8, 8, 0, 0]} />
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00f0ff" />
                    <stop offset="100%" stopColor="#a855f7" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-16 text-center text-slate-500">Upload a dataset to view analytics</p>
          )}
        </GlassCard>

        <GlassCard delay={0.1}>
          <h3 className="mb-4 font-display text-sm font-bold tracking-wider uppercase text-slate-300">
            Prediction Output
          </h3>
          {predictionChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={predictionChart}>
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00f0ff" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="index" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="value" stroke="#00f0ff" fill="url(#areaGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-16 text-center text-slate-500">Run a prediction to see results</p>
          )}
        </GlassCard>
      </div>

      {prediction && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 grid gap-6 lg:grid-cols-2"
        >
          <GlassCard>
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp className="text-neon-cyan" size={20} />
              <h3 className="font-display text-sm font-bold uppercase">Model Metrics</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-white/5 p-4 text-center">
                <p className="text-xs text-slate-500">RMSE</p>
                <p className="mt-1 font-display text-2xl font-bold text-neon-cyan">
                  {prediction.result?.metrics?.rmse?.toFixed(4) ?? "—"}
                </p>
              </div>
              <div className="rounded-xl bg-white/5 p-4 text-center">
                <p className="text-xs text-slate-500">R² Score</p>
                <p className="mt-1 font-display text-2xl font-bold text-neon-purple">
                  {prediction.result?.metrics?.r2?.toFixed(4) ?? "—"}
                </p>
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="text-neon-purple" size={20} />
              <h3 className="font-display text-sm font-bold uppercase">AI Insights</h3>
            </div>
            <ul className="space-y-2">
              {(prediction.result?.insights || ["No insights available"]).map((insight, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-neon-cyan" />
                  {insight}
                </li>
              ))}
            </ul>
          </GlassCard>
        </motion.div>
      )}
    </div>
  );
}

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, X } from "lucide-react";
import api, { getApiError } from "../api/api";
import TopNavbar from "../components/TopNavbar";
import GlassCard from "../components/GlassCard";
import GlowButton from "../components/GlowButton";
import LoadingScanner from "../components/LoadingScanner";

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) setFile(dropped);
  }, []);

  const upload = async () => {
    if (!file) return;
    setLoading(true);
    setError("");
    setResult(null);
    const form = new FormData();
    form.append("file", file);
    try {
      const { data } = await api.post("/datasets/upload", form);
      setResult(data);
    } catch (ex) {
      setError(getApiError(ex, "Upload failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <TopNavbar title="Dataset Upload" subtitle="Import CSV or Excel files for AI analysis" />

      <div className="mx-auto max-w-3xl">
        <GlassCard hover={false}>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={`relative rounded-2xl border-2 border-dashed p-12 text-center transition-all duration-300 ${
              dragging
                ? "border-neon-cyan bg-neon-cyan/10 shadow-glow"
                : file
                ? "border-emerald-500/50 bg-emerald-500/5"
                : "border-white/20 hover:border-neon-cyan/40 hover:bg-white/[0.02]"
            }`}
          >
            {dragging && (
              <motion.div
                className="absolute inset-0 rounded-2xl border-2 border-neon-cyan"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}

            <Upload className={`mx-auto mb-4 ${dragging ? "text-neon-cyan" : "text-slate-500"}`} size={48} />
            <p className="font-display text-lg font-semibold text-white">
              {file ? file.name : "Drag & drop your dataset"}
            </p>
            <p className="mt-2 text-sm text-slate-500">or click to browse · CSV, XLSX, XLS</p>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              className="absolute inset-0 cursor-pointer opacity-0"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>

          {file && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="text-neon-cyan" size={20} />
                <div>
                  <p className="text-sm font-medium text-white">{file.name}</p>
                  <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <button onClick={() => setFile(null)} className="text-slate-500 hover:text-white">
                <X size={18} />
              </button>
            </motion.div>
          )}

          <div className="mt-6 flex justify-center">
            <GlowButton onClick={upload} disabled={!file || loading} className="min-w-[200px]">
              {loading ? "Uploading..." : "Upload & Analyze"}
            </GlowButton>
          </div>
        </GlassCard>

        <AnimatePresence>
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <LoadingScanner message="AI Scanning Dataset..." />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-6 flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-red-400"
            >
              <AlertCircle size={20} />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <GlassCard className="mt-6" delay={0}>
                <div className="flex items-center gap-3 text-emerald-400">
                  <CheckCircle size={24} />
                  <h3 className="font-display font-bold">Upload Successful</h3>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-4">
                  {[
                    { label: "File", value: result.fileName },
                    { label: "Rows", value: result.rowCount },
                    { label: "Columns", value: result.columnCount }
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl bg-white/5 p-4 text-center">
                      <p className="text-xs text-slate-500 uppercase">{item.label}</p>
                      <p className="mt-1 font-display text-lg font-bold text-white">{item.value}</p>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

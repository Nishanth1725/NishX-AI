import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Bot,
  User,
  Sparkles,
  MessageSquare,
  Trash2,
  Copy,
  Check,
  RotateCcw,
  Mic,
  MicOff,
  PanelLeft,
  X,
} from "lucide-react";
import api, { getApiError } from "../api/api";
import TopNavbar from "../components/TopNavbar";
import GlassCard from "../components/GlassCard";
import TypewriterText from "../components/TypewriterText";
import MarkdownMessage from "../components/MarkdownMessage";
import ChatLoadingIndicator from "../components/ChatLoadingIndicator";
import useSpeechRecognition from "../hooks/useSpeechRecognition";

function formatTimestamp(date) {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function HistoryPanel({ history, onSelect, onClose, className = "" }) {
  return (
    <GlassCard hover={false} className={`flex h-full flex-col !p-4 ${className}`}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-medium tracking-widest text-slate-500 uppercase">
          <MessageSquare size={14} /> Chat History
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-500 transition hover:bg-white/5 hover:text-white lg:hidden"
            aria-label="Close history"
          >
            <X size={16} />
          </button>
        )}
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto">
        {history.length === 0 ? (
          <p className="text-xs text-slate-600">No previous chats</p>
        ) : (
          history.slice(0, 30).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onSelect(item);
                onClose?.();
              }}
              className="w-full rounded-xl border border-white/5 bg-white/[0.02] p-3 text-left transition hover:border-neon-cyan/20 hover:bg-white/5"
            >
              <p className="truncate text-xs text-white">{item.message}</p>
              <p className="mt-1 text-[10px] text-slate-600">
                {formatTimestamp(item.createdAt)}
              </p>
            </button>
          ))
        )}
      </div>
    </GlassCard>
  );
}

function MessageActions({ content, onRegenerate, showRegenerate }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="mt-2 flex items-center gap-1 border-t border-white/5 pt-2">
      <button
        type="button"
        onClick={copy}
        className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] text-slate-500 transition hover:bg-white/5 hover:text-slate-300"
        aria-label="Copy response"
      >
        {copied ? <Check size={12} /> : <Copy size={12} />}
        {copied ? "Copied" : "Copy"}
      </button>
      {showRegenerate && (
        <button
          type="button"
          onClick={onRegenerate}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] text-slate-500 transition hover:bg-white/5 hover:text-slate-300"
          aria-label="Regenerate response"
        >
          <RotateCcw size={12} />
          Regenerate
        </button>
      )}
    </div>
  );
}

export default function ChatPage() {
  const [datasets, setDatasets] = useState([]);
  const [datasetId, setDatasetId] = useState("");
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [streamingId, setStreamingId] = useState(null);
  const [showMobileHistory, setShowMobileHistory] = useState(false);
  const [lastUserMessage, setLastUserMessage] = useState("");
  const bottomRef = useRef(null);
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);

  const refreshHistory = useCallback(() => {
    api.get("/ai/history").then((res) => setHistory(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    api.get("/datasets/me").then((res) => setDatasets(res.data)).catch((ex) => {
      setError(getApiError(ex, "Failed to load datasets"));
    });
    refreshHistory();
  }, [refreshHistory]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat, loading, streamingId]);

  const sendMessage = useCallback(async (text, { isRegenerate = false } = {}) => {
    const outgoing = text?.trim();
    if (!outgoing || loading) return;

    if (!isRegenerate) {
      const userMsg = {
        role: "user",
        content: outgoing,
        id: Date.now(),
        timestamp: new Date(),
      };
      setChat((prev) => [...prev, userMsg]);
      setMessage("");
    }

    setLastUserMessage(outgoing);
    setLoading(true);
    setError("");

    try {
      const { data } = await api.post("/ai/chat", {
        datasetId: datasetId ? Number(datasetId) : null,
        message: outgoing,
      });
      const aiId = Date.now() + 1;
      setStreamingId(aiId);
      setChat((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.response,
          id: aiId,
          streaming: true,
          timestamp: new Date(),
        },
      ]);
      refreshHistory();
    } catch (ex) {
      setError(getApiError(ex, "AI assistant unavailable"));
    } finally {
      setLoading(false);
    }
  }, [datasetId, loading, refreshHistory]);

  const send = () => sendMessage(message);

  const regenerate = () => {
    if (!lastUserMessage || loading) return;
    setChat((prev) => {
      const last = prev[prev.length - 1];
      if (last?.role === "assistant") return prev.slice(0, -1);
      return prev;
    });
    sendMessage(lastUserMessage, { isRegenerate: true });
  };

  const clearChat = () => {
    setChat([]);
    setStreamingId(null);
    setError("");
    setLastUserMessage("");
  };

  const loadHistoryItem = (item) => {
    setChat([
      {
        role: "user",
        content: item.message,
        id: item.id * 2,
        timestamp: item.createdAt,
      },
      {
        role: "assistant",
        content: item.response,
        id: item.id * 2 + 1,
        timestamp: item.createdAt,
      },
    ]);
    setLastUserMessage(item.message);
    if (item.datasetId) setDatasetId(String(item.datasetId));
    setStreamingId(null);
  };

  const { listening, supported, toggle: toggleMic } = useSpeechRecognition({
    onResult: (transcript) => setMessage((prev) => (prev ? `${prev} ${transcript}` : transcript)),
    onError: (msg) => setError(msg),
  });

  return (
    <div className="flex h-[calc(100dvh-4rem)] min-h-0 flex-col overflow-hidden">
      <TopNavbar title="AI Assistant" subtitle="Context-aware analytics copilot" />

      <div className="flex min-h-0 flex-1 gap-4 overflow-hidden p-0 sm:p-0">
        {/* Desktop history sidebar */}
        <div className="hidden w-64 shrink-0 flex-col lg:flex">
          <HistoryPanel history={history} onSelect={loadHistoryItem} />
        </div>

        {/* Mobile history overlay */}
        <AnimatePresence>
          {showMobileHistory && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-black/60 lg:hidden"
                onClick={() => setShowMobileHistory(false)}
              />
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="fixed inset-y-0 left-0 z-50 w-72 p-4 pt-20 lg:hidden"
              >
                <HistoryPanel
                  history={history}
                  onSelect={loadHistoryItem}
                  onClose={() => setShowMobileHistory(false)}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Chat area */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowMobileHistory(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 transition hover:text-white lg:hidden"
              aria-label="Open chat history"
            >
              <PanelLeft size={18} />
            </button>
            <select
              value={datasetId}
              onChange={(e) => setDatasetId(e.target.value)}
              className="input-futuristic min-w-0 flex-1 text-sm sm:max-w-xs"
              aria-label="Select dataset context"
            >
              <option value="">No dataset context</option>
              {datasets.map((d) => (
                <option key={d.id} value={d.id}>{d.fileName}</option>
              ))}
            </select>
            {chat.length > 0 && (
              <button
                type="button"
                onClick={clearChat}
                className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-400 transition hover:border-red-500/30 hover:text-red-400"
                aria-label="Clear chat"
              >
                <Trash2 size={14} />
                <span className="hidden sm:inline">Clear</span>
              </button>
            )}
          </div>

          <GlassCard hover={false} className="flex min-h-0 flex-1 flex-col overflow-hidden !p-0">
            <div
              ref={chatContainerRef}
              className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6"
            >
              {chat.length === 0 && !loading && (
                <div className="flex h-full min-h-[200px] flex-col items-center justify-center px-4 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20">
                    <Sparkles className="text-neon-cyan" size={28} />
                  </div>
                  <p className="font-display text-lg font-bold text-white">Nexus AI Assistant</p>
                  <p className="mt-2 max-w-sm text-sm text-slate-500">
                    Ask about your datasets, predictions, or analytics. Select a dataset for context-aware answers.
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <AnimatePresence initial={false}>
                  {chat.map((msg, index) => {
                    const isAssistant = msg.role === "assistant";
                    const isStreaming = isAssistant && msg.streaming && msg.id === streamingId;
                    const isLastAssistant = isAssistant && index === chat.length - 1;

                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex min-w-0 gap-2 sm:gap-3 ${
                          msg.role === "user" ? "justify-end" : "justify-start"
                        }`}
                      >
                        {isAssistant && (
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-neon-cyan to-neon-purple">
                            <Bot size={16} />
                          </div>
                        )}
                        <div
                          className={`min-w-0 max-w-[min(100%,85%)] sm:max-w-[min(100%,75%)] ${
                            msg.role === "user" ? "order-first sm:order-none" : ""
                          }`}
                        >
                          <div
                            className={`overflow-hidden rounded-2xl px-3 py-2.5 text-sm leading-relaxed sm:px-4 sm:py-3 ${
                              msg.role === "user"
                                ? "border border-neon-cyan/20 bg-gradient-to-r from-neon-cyan/20 to-neon-blue/20 text-white"
                                : "border border-white/10 bg-white/5 text-slate-200"
                            }`}
                          >
                            <div className="min-w-0 max-w-full overflow-hidden">
                              {isStreaming ? (
                                <TypewriterText
                                  text={msg.content}
                                  onComplete={() => setStreamingId(null)}
                                />
                              ) : isAssistant ? (
                                <MarkdownMessage content={msg.content} />
                              ) : (
                                <p className="break-words [overflow-wrap:anywhere] whitespace-pre-wrap">
                                  {msg.content}
                                </p>
                              )}
                            </div>
                            {isAssistant && !isStreaming && (
                              <MessageActions
                                content={msg.content}
                                onRegenerate={regenerate}
                                showRegenerate={isLastAssistant && !loading}
                              />
                            )}
                          </div>
                          {msg.timestamp && (
                            <p
                              className={`mt-1 text-[10px] text-slate-600 ${
                                msg.role === "user" ? "text-right" : "text-left"
                              }`}
                            >
                              {formatTimestamp(msg.timestamp)}
                            </p>
                          )}
                        </div>
                        {msg.role === "user" && (
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/10">
                            <User size={16} />
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {loading && <ChatLoadingIndicator />}
              </div>
              <div ref={bottomRef} />
            </div>

            {error && (
              <div
                className="mx-3 mb-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs text-red-400 sm:mx-4"
                role="alert"
              >
                {error}
              </div>
            )}

            <div className="shrink-0 border-t border-white/10 p-3 sm:p-4">
              <div className="flex gap-2 sm:gap-3">
                {supported && (
                  <button
                    type="button"
                    onClick={toggleMic}
                    disabled={loading}
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition sm:h-12 sm:w-12 ${
                      listening
                        ? "border-red-500/50 bg-red-500/10 text-red-400"
                        : "border-white/10 bg-white/5 text-slate-400 hover:border-neon-cyan/30 hover:text-neon-cyan"
                    } disabled:opacity-50`}
                    aria-label={listening ? "Stop recording" : "Start voice input"}
                    title={listening ? "Stop recording" : "Voice input"}
                  >
                    {listening ? <MicOff size={18} /> : <Mic size={18} />}
                  </button>
                )}
                <input
                  ref={inputRef}
                  className="input-futuristic min-w-0 flex-1"
                  placeholder="Ask about your data, predictions, or insights..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  disabled={loading}
                  aria-label="Chat message input"
                />
                <button
                  type="button"
                  onClick={send}
                  disabled={loading || !message.trim()}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-neon-cyan to-neon-purple text-white shadow-glow transition hover:scale-105 disabled:opacity-50 sm:h-12 sm:w-12"
                  aria-label="Send message"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

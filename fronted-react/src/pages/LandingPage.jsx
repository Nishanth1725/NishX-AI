import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Brain,
  BarChart3,
  Zap,
  Shield,
  MessageSquare,
  ArrowRight,
  Sparkles,
  Database
} from "lucide-react";
import AnimatedBackground from "../components/AnimatedBackground";
import GlassCard from "../components/GlassCard";
import GlowButton from "../components/GlowButton";

const features = [
  {
    icon: Database,
    title: "Big Data Processing",
    desc: "PySpark-powered pipeline handles massive datasets with distributed computing."
  },
  {
    icon: BarChart3,
    title: "Predictive Analytics",
    desc: "ML models deliver classification & regression insights in real-time."
  },
  {
    icon: MessageSquare,
    title: "AI Assistant",
    desc: "Context-aware chatbot explains your data and predictions like a data scientist."
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    desc: "JWT authentication, encrypted storage, and role-based access control."
  }
];

export default function LandingPage() {
  return (
    <div className="relative min-h-screen">
      <AnimatedBackground variant="particles" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-6 lg:px-12">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-neon-cyan to-neon-purple shadow-glow">
            <Brain size={20} />
          </div>
          <span className="font-display text-lg font-bold tracking-wider">NishX AI</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm text-slate-400 transition hover:text-white">
            Sign In
          </Link>
          <Link to="/login">
            <GlowButton className="!px-5 !py-2 text-sm">Get Started</GlowButton>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24 pt-16 text-center lg:pt-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-neon-cyan/30 bg-neon-cyan/10 px-4 py-1.5">
            <Sparkles size={14} className="text-neon-cyan" />
            <span className="text-xs font-medium tracking-widest text-neon-cyan uppercase">
              Next-Gen Analytics Platform
            </span>
          </div>

          <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-7xl">
            <span className="neon-text">AI-Powered</span>
            <br />
            Predictive Analytics Engine
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
            Upload datasets, train ML models, visualize insights, and chat with an AI assistant —
            all in one futuristic analytics command center.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link to="/login">
              <GlowButton className="flex items-center gap-2">
                Launch Dashboard <ArrowRight size={18} />
              </GlowButton>
            </Link>
            <a href="#features">
              <GlowButton variant="outline">Explore Features</GlowButton>
            </a>
          </div>
        </motion.div>

        {/* Floating elements */}
        <motion.div
          className="mx-auto mt-16 max-w-4xl"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          <div className="glass relative overflow-hidden p-1">
            <div className="absolute inset-0 bg-gradient-to-r from-neon-cyan/10 via-transparent to-neon-purple/10" />
            <div className="relative grid grid-cols-3 gap-4 rounded-xl bg-deep/80 p-6">
              {[
                { label: "Datasets Processed", val: "10K+", icon: Database },
                { label: "Predictions Run", val: "50K+", icon: Zap },
                { label: "AI Queries", val: "100K+", icon: MessageSquare }
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  className="text-center"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 4, repeat: Infinity, delay: i * 0.5 }}
                >
                  <stat.icon className="mx-auto mb-2 text-neon-cyan" size={24} />
                  <p className="font-display text-2xl font-bold text-white">{stat.val}</p>
                  <p className="text-xs text-slate-500">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 mx-auto max-w-6xl px-6 py-24">
        <div className="mb-12 text-center">
          <h2 className="font-display text-3xl font-bold">
            Built for the <span className="neon-text">Future of Data</span>
          </h2>
          <p className="mt-3 text-slate-400">Everything you need in one intelligent platform</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <GlassCard key={f.title} delay={i * 0.1}>
              <f.icon className="mb-4 text-neon-cyan" size={28} />
              <h3 className="font-display text-sm font-bold text-white">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-400">{f.desc}</p>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 mx-auto max-w-3xl px-6 pb-24 text-center">
        <GlassCard hover={false}>
          <h2 className="font-display text-2xl font-bold">Ready to unlock your data?</h2>
          <p className="mt-3 text-slate-400">Start analyzing in minutes. No credit card required.</p>
          <Link to="/login" className="mt-6 inline-block">
            <GlowButton>Start Free →</GlowButton>
          </Link>
        </GlassCard>
      </section>
    </div>
  );
}

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        void: "#030712",
        deep: "#0a0f1e",
        panel: "#0f1729",
        neon: {
          cyan: "#00f0ff",
          blue: "#3b82f6",
          purple: "#a855f7",
          pink: "#ec4899"
        }
      },
      fontFamily: {
        display: ["Orbitron", "sans-serif"],
        sans: ["Inter", "system-ui", "sans-serif"]
      },
      boxShadow: {
        glow: "0 0 20px rgba(0, 240, 255, 0.35)",
        "glow-purple": "0 0 25px rgba(168, 85, 247, 0.4)",
        glass: "0 8px 32px rgba(0, 0, 0, 0.4)"
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        pulseGlow: "pulseGlow 3s ease-in-out infinite",
        scan: "scan 2s linear infinite"
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" }
        },
        pulseGlow: {
          "0%, 100%": { opacity: 0.5 },
          "50%": { opacity: 1 }
        },
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" }
        }
      }
    }
  },
  plugins: []
};

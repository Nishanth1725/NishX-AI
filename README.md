# NexusAI — Big Data Predictive Analytics Platform

A full-stack AI analytics platform with a **futuristic dark UI**, Spring Boot backend, Python ML engine (PySpark), and AI assistant chat.

## Architecture

```
React UI (port 5173)
    ↓ JWT REST API
Spring Boot Backend (port 8080)
    ↓ HTTP
Python ML Engine (port 8000)
    ↓
PostgreSQL / H2 database
    ↓
External AI API (OpenRouter / OpenAI / Gemini)
```

## How It Works

1. **Landing Page** — Futuristic marketing page with animated gradients.
2. **Auth** — Register/login → backend returns a JWT token stored in browser.
3. **Upload** — CSV/Excel saved to disk; metadata stored in database.
4. **Analytics** — Select dataset → backend calls Python `/predict` → ML model trains on your data → charts + metrics displayed.
5. **AI Chat** — Your question + dataset summary + prediction results sent to external AI API → response shown with typewriter effect.

---

## Where to Put Your API Key

The AI chat uses an **external LLM provider** (OpenRouter-compatible by default).

### Option A — Environment variable (recommended)

**Windows PowerShell (before starting backend):**
```powershell
$env:AI_PROVIDER_KEY="sk-or-v1-your-openrouter-key-here"
```

**Windows CMD:**
```cmd
set AI_PROVIDER_KEY=sk-or-v1-your-openrouter-key-here
```

**Linux/macOS:**
```bash
export AI_PROVIDER_KEY=sk-or-v1-your-openrouter-key-here
```

### Option B — Edit backend config file

Open `backend-springboot/src/main/resources/application.properties` and set:

```properties
ai.provider.key=sk-or-v1-your-openrouter-key-here
```

> Do not commit real API keys to git. Use environment variables in production.

### Other AI settings (optional)

In the same `application.properties` or via env vars:

| Property | Env Variable | Default |
|----------|--------------|---------|
| `ai.provider.url` | `AI_PROVIDER_URL` | `https://openrouter.ai/api/v1/chat/completions` |
| `ai.provider.model` | `AI_PROVIDER_MODEL` | `openai/gpt-4o-mini` |

For **OpenAI directly**, set:
```properties
ai.provider.url=https://api.openai.com/v1/chat/completions
ai.provider.model=gpt-4o-mini
ai.provider.key=sk-your-openai-key
```

For **Google Gemini via OpenRouter**, use an OpenRouter key with a Gemini model name like `google/gemini-flash-1.5`.

Without an API key, chat still works but returns a fallback message with context preview.

---

## How to Run (Local Development)

Open **3 separate terminals**:

### Terminal 1 — Python ML Engine
```powershell
cd ai-engine-python
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

### Terminal 2 — Spring Boot Backend
```powershell
cd backend-springboot
$env:AI_PROVIDER_KEY="your-key-here"   # optional, for AI chat
.\mvnw spring-boot:run
```

### Terminal 3 — React Frontend
```powershell
cd fronted-react
npm install
npm run dev
```

### Open in browser
- **UI:** http://localhost:5173
- **Backend API:** http://localhost:8080/api/health
- **Python engine:** http://localhost:8000/health

---

## Run with Docker (all services)

```powershell
$env:AI_PROVIDER_KEY="your-key-here"
docker compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend | http://localhost:8080/api |
| Python | http://localhost:8000 |
| PostgreSQL | localhost:5432 |

---

## End-to-End Demo Script

With backend + Python running:

```powershell
.\scripts\demo.ps1
```

This registers a user, uploads `data/sample_sales.csv`, runs a prediction, and tests AI chat.

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React 18, TailwindCSS, Framer Motion, Recharts, Lucide Icons |
| Backend | Spring Boot 4, Spring Security, JWT, JPA, PostgreSQL |
| ML Engine | FastAPI, PySpark, scikit-learn, pandas |
| AI Chat | OpenRouter / OpenAI / Gemini compatible API |

## Pages

- `/` — Landing page (futuristic hero)
- `/login` — Auth (glass card UI)
- `/dashboard` — Metrics + quick actions
- `/upload` — Drag & drop dataset upload
- `/analytics` — Charts + ML predictions
- `/chat` — AI assistant (ChatGPT-style, dark theme)

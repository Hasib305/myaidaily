# ⚡ MyAIDaily · The AI Engineer's Daily Intelligence Wire

A high-signal, modern editorial platform built for **Software Engineers and AI Engineers** to stay continuously up to date with new AI technologies, architectures, and breakthroughs—without noise, without Twitter doomscrolling, and with **zero unnecessary token consumption**.

---

## 🌟 Key Features

- **⚡ Zero-Token Local NLP Engine**: Operates 100% locally with a heuristic summarizer, pillar classifier, tag detector, and relevance scorer. Runs at **$0 API cost** with 0 tokens consumed.
- **📅 Multi-Horizon Time Views**:
  - **Today (24h)**: Breaking updates and releases from the last 24 hours.
  - **This Week**: High-impact news from the last 7 days.
  - **Recent Month**: Aggregated monthly digest.
  - **Landmark Shifts (Recent Months)**: Curated architectural paradigm shifts (e.g., *KAG vs RAG*, *Model Context Protocol (MCP)*, *DeepSeek-R1 / GRPO*, *SGLang RadixAttention*, *BitNet 1.58b*).
  - **Saved (Bookmarks)**: Personal reading list persisted in browser `localStorage`.
- **🏛️ 6 Core Engineering Pillars**:
  1. 🧠 **Models & Reasoning** (DeepSeek R1, o1/o3, RLVR, GRPO, MoE, MLA, SLMs, Multimodal)
  2. 🤖 **Agents & MCP** (Model Context Protocol, LangGraph, Computer Use, Agent Swarms)
  3. ⚡ **Knowledge & Retrieval** (KAG, GraphRAG, Vector DBs, Hybrid Search, Embedding models)
  4. ⚙️ **Inference & Serving** (vLLM, SGLang, Quantization: AWQ/FP8/GGUF, Speculative Decoding)
  5. 🛠️ **DevTools & Coding** (Agentic IDEs, DSPy, Automated Evaluation: Ragas/DeepEval, Fine-Tuning)
  6. 🔬 **Frontier Research** (arXiv cs.AI/cs.CL/cs.LG, Hugging Face Daily Papers)
- **🔎 Instant Search & Dynamic Tagging**: Type `/` to search across titles, summaries, and 50+ auto-detected technical tags (`#KAG`, `#RAG`, `#MCP`, `#DeepSeek`, `#vLLM`, `#Reasoning`, `#Agents`, etc.).
- **🎨 Modern Developer UI**: Responsive dark/light theme, copyable TL;DR summaries, impact badges, and keyboard shortcuts.
- **🚀 Vercel Ready**: Powered by Next.js 14 App Router with Incremental Static Regeneration (`revalidate = 3600`), serving pages instantly from Vercel's global edge network.

---

## 🛠️ Local Development

```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🚀 One-Click Deploy to Vercel

AI Pulse requires **zero external API keys or database setup** to function out-of-the-box!

1. Push your repository to GitHub:
   ```bash
   git add .
   git commit -m "feat: complete MyAIDaily platform"
   git push origin main
   ```
2. Go to [Vercel](https://vercel.com) and click **"Add New Project"**.
3. Import your `myaidaily` repository and click **"Deploy"**.
4. Vercel automatically pre-renders the feed and refreshes it hourly via ISR (`export const revalidate = 3600`).

---

## 📂 Project Structure

```
myaidaily/
├── app/
│   ├── components/
│   │   ├── Navbar.js         # Top navigation, search '/', theme toggle, saved counter
│   │   ├── LandmarkRadar.js  # "Old Way vs New Paradigm" landmark breakdown
│   │   └── NewsCard.js       # Editorial news card with TL;DR, tags, bookmarking
│   ├── Feed.js               # Client controller with multi-horizon & topic filters
│   ├── globals.css           # Tailwind base styles and theme tokens
│   ├── layout.js             # Root layout with dark mode class
│   └── page.js               # Server component with ISR revalidation
├── lib/
│   ├── feeds.js              # Parallel RSS ingestion across 12+ sources
│   ├── landmarks.js          # Curated repository of recent months' paradigm shifts
│   └── nlp.js                # Zero-token local NLP extractor & classifier
├── package.json
└── tailwind.config.js
```

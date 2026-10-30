// lib/landmarks.js
// Curated repository of breakthrough AI technologies and architectural paradigm shifts from recent months.
// Designed specifically for Software Engineers and AI Engineers to stay updated at a glance.

export const LANDMARK_SHIFTS = [
  {
    id: "kag-vs-rag",
    title: "KAG (Knowledge-Augmented Generation) Supersedes Vanilla RAG",
    pillar: "knowledge-retrieval",
    pillarLabel: "Knowledge & Retrieval",
    date: "Recent Paradigm Shift",
    status: "Emerging Standard",
    badge: "🔥 Paradigm Shift",
    summary:
      "KAG bridges the fatal weakness of naive vector RAG—which fails at multi-hop logic and domain-specific relational reasoning—by combining LLMs with a dual-engine knowledge graph and logical form solver.",
    oldWay: {
      title: "Vanilla Vector RAG",
      desc: "Chunks text blindly into token windows, computes vector embeddings, and performs cosine similarity search. Hallucinates on complex relational queries, cannot guarantee logical deduction, and suffers from context dilution.",
    },
    newWay: {
      title: "KAG (Knowledge-Augmented Generation)",
      desc: "Integrates structured domain Knowledge Graphs (KG) with LLMs via mutually verifiable logical reasoning (OpenSPG). Uses logical form translation, symbolic deduction, and semantic verification to ensure factual accuracy.",
    },
    whyItMatters:
      "If your production AI application handles compliance, medical, legal, or complex enterprise schemas where 99.9% precision is required, simple embedding search is obsolete; hybrid graph-logic retrieval is the new architecture.",
    keyConcepts: [
      "OpenSPG",
      "Dual-Engine Architecture",
      "Logical Form Solver",
      "Mutual Verifiable Reasoning",
      "GraphRAG",
    ],
    links: [
      { label: "OpenSPG / KAG GitHub", url: "https://github.com/OpenSPG/KAG" },
      { label: "Paper on arXiv", url: "https://arxiv.org/abs/2409.13731" },
    ],
  },
  {
    id: "model-context-protocol-mcp",
    title: "Model Context Protocol (MCP): The USB-C for AI Applications",
    pillar: "agents-mcp",
    pillarLabel: "Agents & Protocols",
    date: "Recent Standard",
    status: "Industry Standard",
    badge: "⚡ Universal Protocol",
    summary:
      "Anthropic introduced the Model Context Protocol (MCP), an open universal standard for seamlessly connecting AI assistants and agents to external tools, databases, dev environments, and enterprise repositories.",
    oldWay: {
      title: "Custom Fragmented Tool Calling",
      desc: "Every AI framework, IDE, and model vendor invented proprietary plugin formats, custom REST wrappers, and ad-hoc function schemas that broke across different agents.",
    },
    newWay: {
      title: "MCP Client-Server Architecture",
      desc: "A standardized JSON-RPC protocol over stdio or SSE. Any MCP client (Claude Desktop, Cursor, IDEs) can instantly discover tools, resources, and prompt templates exposed by any MCP server.",
    },
    whyItMatters:
      "Instead of writing custom API adapters for Postgres, GitHub, Slack, or Docker for every agent you build, you write or use one MCP server and any agent can immediately interface with it safely.",
    keyConcepts: [
      "JSON-RPC 2.0",
      "stdio / SSE Transport",
      "Tools, Resources & Prompts Primitives",
      "MCP Host / Server",
    ],
    links: [
      { label: "Official MCP Spec & Docs", url: "https://modelcontextprotocol.io" },
      { label: "Anthropic MCP Announcement", url: "https://www.anthropic.com/news/model-context-protocol" },
    ],
  },
  {
    id: "deepseek-r1-reasoning-grpo",
    title: "DeepSeek-R1 & Test-Time Compute: Reasoning Without Massive Supervised Datasets",
    pillar: "models-reasoning",
    pillarLabel: "Models & Reasoning",
    date: "Recent Breakthrough",
    status: "Frontier Milestone",
    badge: "💥 Open Frontier",
    summary:
      "DeepSeek proved that frontier-grade reasoning (matching OpenAI o1) can emerge purely through large-scale Reinforcement Learning with Verifiable Rewards (RLVR) and GRPO, bypassing expensive human-labeled chain-of-thought traces.",
    oldWay: {
      title: "Supervised Pre-Training Scaling & Rejection Sampling",
      desc: "Models relied on millions of expensive human-curated step-by-step reasoning demonstrations (SFT) and separate, memory-intensive Critic models (PPO) during alignment.",
    },
    newWay: {
      title: "GRPO & Test-Time Reasoning RL",
      desc: "Group Relative Policy Optimization (GRPO) calculates relative advantages within sample groups directly, eliminating the Critic model. Models self-discover chain-of-thought, backtracking, and reflection solely through rule-based outcome rewards.",
    },
    whyItMatters:
      "Dramatically lowers the compute and data cost of training domain-specific reasoning models. Open weights + distilled models (1.5B to 70B) bring state-of-the-art math and coding reasoning to local devices.",
    keyConcepts: [
      "GRPO (Group Relative Policy Optimization)",
      "Test-Time Compute",
      "RLVR (Reinforcement Learning with Verifiable Rewards)",
      "Multi-Head Latent Attention (MLA)",
      "Distillation",
    ],
    links: [
      { label: "DeepSeek-R1 Paper", url: "https://arxiv.org/abs/2501.12948" },
      { label: "DeepSeek GitHub Repository", url: "https://github.com/deepseek-ai/DeepSeek-R1" },
    ],
  },
  {
    id: "sglang-vllm-inference",
    title: "High-Throughput Serving: SGLang RadixAttention & vLLM Chunked Prefill",
    pillar: "infra-serving",
    pillarLabel: "Inference & Serving",
    date: "Recent Performance Shift",
    status: "Production Essential",
    badge: "🚀 Infra Evolution",
    summary:
      "Serving LLMs in production moved from basic PagedAttention to hierarchical RadixAttention and chunked prefill, enabling 5x to 10x throughput gains for multi-turn agent conversations and complex prompt structures.",
    oldWay: {
      title: "Naive KV Caching & Static Prefill",
      desc: "Each request recomputed the prompt KV cache from scratch, causing GPU memory fragmentation and massive latency spikes when complex system prompts or few-shot examples were repeatedly used.",
    },
    newWay: {
      title: "RadixAttention & Dynamic Chunking",
      desc: "SGLang maintains a Radix Tree over the KV cache across multiple requests. Shared prefixes (like system prompts, multi-turn history, or RAG contexts) are cached globally across clients with zero redundant compute.",
    },
    whyItMatters:
      "Directly cuts cloud GPU bills by 50-80% for agentic workflows where identical system prompts and tool schemas are sent thousands of times per hour.",
    keyConcepts: [
      "RadixAttention",
      "PagedAttention v2",
      "Chunked Prefill",
      "Prefix Caching",
      "Speculative Decoding",
    ],
    links: [
      { label: "SGLang GitHub", url: "https://github.com/sgl-project/sglang" },
      { label: "vLLM Documentation", url: "https://docs.vllm.ai" },
    ],
  },
  {
    id: "agentic-coding-ides",
    title: "Autonomous Coding Agents: From Next-Token Autocomplete to Agentic Swarms",
    pillar: "devtools-coding",
    pillarLabel: "DevTools & Coding",
    date: "Recent Workflow Shift",
    status: "Daily Developer Tool",
    badge: "🛠️ Dev Revolution",
    summary:
      "AI programming tools transitioned from line-level completion (GitHub Copilot) to full-context agentic IDEs (Cursor, Windsurf, Claude Computer Use) that plan, execute terminal commands, edit multiple files, and self-debug in a continuous loop.",
    oldWay: {
      title: "Single-File In-Line Autocompletion",
      desc: "Developer wrote code while the model suggested the next 3 lines based solely on cursor position and open tabs without running tests or understanding project architectures.",
    },
    newWay: {
      title: "Agentic Loop with Tool Execution & LSP",
      desc: "Agents read git diffs, run terminal linters and compilers, inspect ASTs, search codebase symbols, propose multi-file edits, and iterate until tests pass.",
    },
    whyItMatters:
      "Engineers spend less time writing boilerplate and syntax, shifting their focus toward architectural design, system boundaries, and precise verification.",
    keyConcepts: [
      "Agentic Loop (ReAct)",
      "LSP / Symbol Indexing",
      "Multi-file Editing",
      "Terminal Tool Execution",
      "Context Engineering",
    ],
    links: [
      { label: "Anthropic Computer Use", url: "https://docs.anthropic.com/en/docs/build-with-claude/computer-use" },
      { label: "Windsurf & Flow Paradigm", url: "https://codeium.com/windsurf" },
    ],
  },
  {
    id: "edge-slms-local-ai",
    title: "Edge & Small Language Models (SLMs): 1B-8B Models Surpassing Last-Gen Giants",
    pillar: "models-reasoning",
    pillarLabel: "Models & Reasoning",
    date: "Recent Architecture Trend",
    status: "Production Viable",
    badge: "📱 Local AI",
    summary:
      "Sub-8B models (Llama 3.2 1B/3B, Gemma 2 2B/9B, Phi-3.5/Phi-4, Qwen 2.5) now match or exceed GPT-3.5 performance on code and reasoning, running locally on laptops, phones, and single consumer GPUs via 4-bit and FP8 quantization.",
    oldWay: {
      title: "API-Dependent Cloud Architectures",
      desc: "Every simple classification, extraction, or summarization step required an outbound HTTP request to proprietary cloud APIs, incurring latency, API costs, and privacy risks.",
    },
    newWay: {
      title: "Hybrid Local + Frontier Architecture",
      desc: "Small, specialized SLMs handle high-frequency tasks (filtering, routing, structured extraction, PII redaction) locally at near-zero latency, routing only high-complexity reasoning to frontier models.",
    },
    whyItMatters:
      "Enables zero-marginal-cost AI microservices, offline edge applications, and eliminates privacy bottlenecks for sensitive data pipelines.",
    keyConcepts: [
      "SLMs (Small Language Models)",
      "GGUF / llama.cpp",
      "AWQ / EXL2 Quantization",
      "On-Device NPU Acceleration",
      "Hybrid Routing",
    ],
    links: [
      { label: "Ollama Local Engine", url: "https://ollama.com" },
      { label: "Llama 3.2 on Hugging Face", url: "https://huggingface.co/meta-llama" },
    ],
  },
  {
    id: "bitnet-ternary-architectures",
    title: "1-Bit Architectures & Native Quantization (BitNet 1.58b)",
    pillar: "infra-serving",
    pillarLabel: "Inference & Serving",
    date: "Recent Research Shift",
    status: "Next-Gen Architecture",
    badge: "🔬 Hardware Frontier",
    summary:
      "Microsoft Research and the open-source community advanced 1-bit LLMs (BitNet b1.58), where every weight is strictly ternary {-1, 0, 1}, completely eliminating matrix multiplications (FP16/FP32 MACs) in favor of integer addition.",
    oldWay: {
      title: "Post-Training Quantization of FP16 Models",
      desc: "Models trained in 16-bit floating point are shoehorned into 4-bit or 8-bit, requiring complex matrix multiplication hardware (Tensor Cores) and substantial memory bandwidth.",
    },
    newWay: {
      title: "Native 1.58-bit Ternary Training",
      desc: "Models trained natively with {-1, 0, 1} weights. Replaces costly multiplication operations with simple additions, reducing memory footprint by up to 80% and drastically slashing DRAM power consumption.",
    },
    whyItMatters:
      "Signals a future where high-parameter LLMs can run on low-power IoT, CPUs, and specialized ASIC accelerators with dramatically reduced energy consumption.",
    keyConcepts: [
      "BitNet b1.58",
      "Ternary Weights {-1, 0, 1}",
      "Zero Matrix Multiplication",
      "Energy-Efficient Inference",
    ],
    links: [
      { label: "BitNet arXiv Paper", url: "https://arxiv.org/abs/2402.17764" },
      { label: "BitNet.cpp on GitHub", url: "https://github.com/microsoft/BitNet" },
    ],
  },
  {
    id: "multimodal-omni-models",
    title: "Native Omni-Modality: End-to-End Speech, Vision, and World Simulators",
    pillar: "models-reasoning",
    pillarLabel: "Models & Reasoning",
    date: "Recent Multimodal Shift",
    status: "Expanding Rapidly",
    badge: "👁️ Omni Frontier",
    summary:
      "Transition from pipeline-based architectures (Speech-to-Text ➔ LLM ➔ Text-to-Speech) to native omni-modal neural networks capable of real-time audio token streaming, video generation (Wan 2.1, Sora), and spatial perception.",
    oldWay: {
      title: "Cascaded Pipeline Architectures",
      desc: "Whisper STT ➔ GPT-4 ➔ ElevenLabs TTS. Resulted in 1500ms+ latency, complete loss of tone, emotion, interruptions, and background acoustic context.",
    },
    newWay: {
      title: "Native End-to-End Token Streams",
      desc: "Single unified model processes audio tokens directly with ~200ms latency, enabling natural conversation, expressive emotional modulation, and live screen/camera understanding.",
    },
    whyItMatters:
      "Voice interfaces and spatial video assistants finally feel natural and instantaneous, enabling hands-free engineering workflows and real-time screen debugging.",
    keyConcepts: [
      "Native Audio Tokenization",
      "Low Latency (<300ms)",
      "Diffusion Transformers (DiT)",
      "Flow Matching",
    ],
    links: [
      { label: "Gemini 2.0 Multimodal Live", url: "https://deepmind.google/technologies/gemini/" },
      { label: "OpenAI Realtime API", url: "https://platform.openai.com/docs/guides/realtime" },
    ],
  },
];


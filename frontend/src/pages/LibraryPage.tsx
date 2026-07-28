import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Search, Star, Trash2, Library as LibraryIcon,
  Clock, Wand2, Copy, Plus, X, LayoutGrid, List, Table, Filter, Tag, ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { getPrompts, deletePrompt, searchPrompts, toggleFavorite, getHistory, savePrompt } from '@/services/api';
import { usePromptContext } from '@/context/PromptContext';
import { copyToClipboard } from '@/utils';
import { pageTransition } from '@/animations/variants';
import type { SavedPrompt, HistoryEntry } from '@/types';
import { EmptyState } from '@/components/common/EmptyState';

const CATEGORIES = [
  'All',
  'Coding',
  'SQL',
  'Marketing',
  'Writing',
  'Customer Support',
  'Data Analysis',
  'Creative',
  'Education',
  'Business',
  'AI Architecture',
  'Security & Audit',
  'Other'
];

const DIFFICULTIES = ['All', 'Beginner', 'Intermediate', 'Advanced'];

// 42+ Pre-built template prompts for Instant Usage across all domain categories
const PRESET_TEMPLATES: SavedPrompt[] = [
  // --- CODING ---
  {
    id: 'preset-coding-1',
    title: 'Python Web Scraper & Error Handler',
    prompt_text: 'Act as a Senior Python Engineer. Write a modular BeautifulSoup & Requests script to scrape product titles and prices from an e-commerce website. Include exponential backoff retry handling, user-agent rotation, rate limiting, and export data to a validated CSV file.',
    category: 'Coding',
    is_favorite: true,
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    tags: ['Python', 'Scraper', 'Async', 'Resilience'],
    difficulty: 'Intermediate',
  },
  {
    id: 'preset-coding-2',
    title: 'React 19 Async Pipeline & Custom Hook Generator',
    prompt_text: 'Act as a Lead Frontend Architect. Write a production-ready React 19 custom hook (`useAsyncPipeline`) that manages complex async workflow states (idle, loading, streaming, success, error, retrying). Include cancellation support via AbortController, exponential backoff, strict TypeScript generics, and unit tests using React Testing Library.',
    category: 'Coding',
    is_favorite: true,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    tags: ['React 19', 'TypeScript', 'Hooks', 'Async'],
    difficulty: 'Advanced',
  },
  {
    id: 'preset-coding-3',
    title: 'FastAPI Async Microservice & OpenAPI Spec Generator',
    prompt_text: 'Act as a Senior Backend Systems Engineer. Design a modular FastAPI microservice endpoint handling high-throughput JSON payload processing. Use background tasks (`BackgroundTasks`), Pydantic v2 strict schema validation, Redis rate-limiting middleware, and comprehensive inline OpenAPI docstrings.',
    category: 'Coding',
    is_favorite: false,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    tags: ['FastAPI', 'Pydantic', 'REST', 'Backend'],
    difficulty: 'Intermediate',
  },
  {
    id: 'preset-coding-4',
    title: 'TypeScript Type-Safe Event Bus & Middleware Pattern',
    prompt_text: 'Act as a Principal TypeScript Architect. Implement an in-memory strongly-typed Event Bus class with type inference for event names and payload payloads. Add wildcard event subscriptions, priority handlers, async middleware chain execution, and subscriber error boundary handling.',
    category: 'Coding',
    is_favorite: false,
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    tags: ['TypeScript', 'Design Patterns', 'Event Bus'],
    difficulty: 'Advanced',
  },
  {
    id: 'preset-coding-5',
    title: 'Rust Concurrent Worker Pool & Channel Manager',
    prompt_text: 'Act as a Systems Programmer. Write a Rust multi-threaded worker pool using `tokio` channels (`mpsc`, `oneshot`) to process computational tasks with work-stealing scheduling, task timeout bounds, graceful shutdown signals (`SIGTERM`), and detailed execution telemetry metrics.',
    category: 'Coding',
    is_favorite: false,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    tags: ['Rust', 'Concurrency', 'Tokio', 'Systems'],
    difficulty: 'Advanced',
  },
  {
    id: 'preset-coding-6',
    title: 'Node.js Streaming CSV Transformer & Backpressure Controller',
    prompt_text: 'Act as a Node.js Backend Engineer. Construct a high-performance Node.js Stream pipeline using `Transform` streams to parse, validate, and clean 1GB+ CSV files without consuming excessive RAM. Implement explicit backpressure management and memory usage logging.',
    category: 'Coding',
    is_favorite: false,
    created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
    tags: ['Node.js', 'Streams', 'CSV', 'Performance'],
    difficulty: 'Intermediate',
  },

  // --- SQL & DATABASES ---
  {
    id: 'preset-sql-1',
    title: 'SQL Monthly Aggregation Query',
    prompt_text: 'Act as a PostgreSQL DBA. Write an indexed, high-performance aggregation query calculating monthly order count and total revenue per active user for Q3 2026. Return results ordered by total spending with EXPLAIN ANALYZE performance optimization hints.',
    category: 'SQL',
    is_favorite: true,
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    tags: ['PostgreSQL', 'Indexing', 'Aggregation'],
    difficulty: 'Intermediate',
  },
  {
    id: 'preset-sql-2',
    title: 'Zero-Downtime PostgreSQL Migration & Indexing Strategy',
    prompt_text: 'Act as a Principal Database Reliability Engineer. Write a zero-downtime PostgreSQL DDL migration script to create a partitioned composite index and update foreign key constraints on a 50M row table. Include safety checks (`CONCURRENTLY`), rollback strategies, and buffer usage analysis.',
    category: 'SQL',
    is_favorite: false,
    created_at: new Date(Date.now() - 86400000 * 8).toISOString(),
    tags: ['PostgreSQL', 'Migration', 'DBA', 'DevOps'],
    difficulty: 'Advanced',
  },
  {
    id: 'preset-sql-3',
    title: 'ChromaDB Vector & Hybrid Search Architect',
    prompt_text: 'Act as a Vector Database Specialist. Write a Python script demonstrating hybrid search combining dense vector embeddings (ChromaDB cosine similarity) with sparse BM25 keyword matching via Reciprocal Rank Fusion (RRF). Include score normalization and dynamic metadata filtering.',
    category: 'SQL',
    is_favorite: false,
    created_at: new Date(Date.now() - 86400000 * 9).toISOString(),
    tags: ['Vector DB', 'ChromaDB', 'Hybrid Search', 'RAG'],
    difficulty: 'Advanced',
  },
  {
    id: 'preset-sql-4',
    title: 'Redis Caching Strategy & Cache Stampede Prevention',
    prompt_text: 'Act as a Data Infrastructure Architect. Design a multi-level Redis caching strategy with TTL jitter, probabilistic early expiration (XFetch algorithm), and mutex locking to completely prevent Cache Stampede (Thundering Herd) during peak traffic spikes.',
    category: 'SQL',
    is_favorite: false,
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    tags: ['Redis', 'Caching', 'Performance', 'Architecture'],
    difficulty: 'Intermediate',
  },

  // --- MARKETING ---
  {
    id: 'preset-mkt-1',
    title: 'SaaS Product Launch Email Sequence',
    prompt_text: 'Act as a SaaS Copywriter. Write a 3-part product launch email drip sequence for an AI productivity app targeting software engineers. Include high-converting subject line variations, social proof hooks, and clear call-to-action triggers.',
    category: 'Marketing',
    is_favorite: false,
    created_at: new Date(Date.now() - 86400000 * 11).toISOString(),
    tags: ['SaaS', 'Copywriting', 'Email Drip'],
    difficulty: 'Beginner',
  },
  {
    id: 'preset-mkt-2',
    title: 'Viral Open-Source Tech Launch Strategy',
    prompt_text: 'Act as a Developer Growth Marketing Specialist. Formulate a 7-day launch blueprint for an open-source AI agent framework. Provide 5 distinct Twitter/X viral threads, a Product Hunt maker story arc, Hacker News submission guidelines, and community Discord onboarding scripts.',
    category: 'Marketing',
    is_favorite: true,
    created_at: new Date(Date.now() - 86400000 * 12).toISOString(),
    tags: ['Open Source', 'Growth', 'Launch', 'Community'],
    difficulty: 'Intermediate',
  },
  {
    id: 'preset-mkt-3',
    title: 'B2B Enterprise Positioning & Value Matrix',
    prompt_text: 'Act as a VP of Product Marketing. Build a comprehensive Positioning Matrix and Messaging Framework for an Enterprise RAG Knowledge Base. Detail buyer personas (CTO, CISO, Lead Architect), core pain points, competitive differentiators against legacy search, and ROI formulas.',
    category: 'Marketing',
    is_favorite: false,
    created_at: new Date(Date.now() - 86400000 * 13).toISOString(),
    tags: ['B2B', 'Enterprise', 'Positioning'],
    difficulty: 'Advanced',
  },
  {
    id: 'preset-mkt-4',
    title: 'SEO Content Pillar & Cluster Strategy Blueprint',
    prompt_text: 'Act as a Head of Content Strategy. Build an organic search content pillar plan around "Generative AI Systems Architecture". Output 1 core Pillar Page outline, 10 supporting Sub-topic Cluster articles, targeted keyword volume estimates, and internal linking hierarchy.',
    category: 'Marketing',
    is_favorite: false,
    created_at: new Date(Date.now() - 86400000 * 14).toISOString(),
    tags: ['SEO', 'Content Strategy', 'Organic Growth'],
    difficulty: 'Intermediate',
  },

  // --- WRITING ---
  {
    id: 'preset-writing-1',
    title: 'Deep-Dive Engineering Architecture Blog Post',
    prompt_text: 'Act as a Principal Technical Writer. Write a 1,500-word engineering blog post titled "How We Reduced RAG Query Latency by 70% using In-Memory Embedding Cache and Hybrid Search". Structure with clear Markdown headers, ASCII architecture diagrams, production code samples, and benchmark comparison tables.',
    category: 'Writing',
    is_favorite: true,
    created_at: new Date(Date.now() - 86400000 * 15).toISOString(),
    tags: ['Blog Post', 'Technical Writing', 'RAG'],
    difficulty: 'Intermediate',
  },
  {
    id: 'preset-writing-2',
    title: 'Executive Technical Briefing & Decision Matrix',
    prompt_text: 'Act as an Executive Technology Strategist. Synthesize a 20-page cloud migration proposal into a 1-page C-suite Executive Briefing. Include strategic objectives, architectural risk analysis, 3-year TCO cost projections, compliance impacts, and immediate go/no-go recommendation metrics.',
    category: 'Writing',
    is_favorite: false,
    created_at: new Date(Date.now() - 86400000 * 16).toISOString(),
    tags: ['Executive', 'Briefing', 'Decision Matrix'],
    difficulty: 'Advanced',
  },
  {
    id: 'preset-writing-3',
    title: 'Developer Documentation & SDK Integration Guide',
    prompt_text: 'Act as a Staff Developer Advocate. Draft complete API reference documentation and Quickstart guide for an AI SDK. Include authentication setup, code snippets in Python and TypeScript, error handling tables, and interactive cURL examples.',
    category: 'Writing',
    is_favorite: false,
    created_at: new Date(Date.now() - 86400000 * 17).toISOString(),
    tags: ['Docs', 'API', 'Developer Experience'],
    difficulty: 'Intermediate',
  },
  {
    id: 'preset-writing-4',
    title: 'RFC (Request for Comments) Architecture Proposal',
    prompt_text: 'Act as a Staff Systems Engineer. Write an RFC document titled "RFC-042: Migrating Monolithic Prompt Service to Distributed Event-Driven Microservices". Follow standard Uber/Google RFC format with Context, Alternatives Considered, Trade-offs, Rollout Plan, and Security Assessment.',
    category: 'Writing',
    is_favorite: false,
    created_at: new Date(Date.now() - 86400000 * 18).toISOString(),
    tags: ['RFC', 'Architecture', 'Engineering'],
    difficulty: 'Advanced',
  },

  // --- CUSTOMER SUPPORT ---
  {
    id: 'preset-cs-1',
    title: 'AI Customer Care Guardrail Agent',
    prompt_text: 'You are Customer Care AI for PromptForge. Always maintain a helpful, empathetic, and professional tone. Adhere strictly to refund and SLA policies detailed in system context, ask clarifying questions before escalating to human support, and output responses in structured JSON.',
    category: 'Customer Support',
    is_favorite: false,
    created_at: new Date(Date.now() - 86400000 * 19).toISOString(),
    tags: ['Customer Support', 'Guardrails', 'JSON'],
    difficulty: 'Beginner',
  },
  {
    id: 'preset-cs-2',
    title: 'Tier-3 Technical Outage Post-Mortem Communicator',
    prompt_text: 'Act as a Lead Site Reliability Engineer. Write an empathetic, highly technical post-incident report for enterprise customers detailing a 30-minute cloud database outage. Include incident timeline, root cause analysis (RCA), immediate remediation steps taken, and SLA credit request instructions.',
    category: 'Customer Support',
    is_favorite: true,
    created_at: new Date(Date.now() - 86400000 * 20).toISOString(),
    tags: ['SRE', 'Post-Mortem', 'Incident Response'],
    difficulty: 'Intermediate',
  },
  {
    id: 'preset-cs-3',
    title: 'De-escalation Script & Difficult Customer Handler',
    prompt_text: 'Act as a Customer Operations Manager. Draft a de-escalation response framework for an enterprise customer upset about a billing discrepancy. Provide 3 empathetic phrasing templates, clear boundary setting guidelines, and escalation resolution pathways.',
    category: 'Customer Support',
    is_favorite: false,
    created_at: new Date(Date.now() - 86400000 * 21).toISOString(),
    tags: ['De-escalation', 'Support', 'Operations'],
    difficulty: 'Beginner',
  },
  {
    id: 'preset-cs-4',
    title: 'Automated Ticket Categorization & Sentiment Classifier',
    prompt_text: 'Act as an NLP Operations Specialist. Process incoming customer support tickets and output a structured JSON classification containing: `sentiment` (positive, neutral, negative, urgent), `category` (billing, bug, feature_request, security), `urgency_score` (1-5), and `recommended_assignee`.',
    category: 'Customer Support',
    is_favorite: false,
    created_at: new Date(Date.now() - 86400000 * 22).toISOString(),
    tags: ['NLP', 'Classification', 'Automation'],
    difficulty: 'Intermediate',
  },

  // --- DATA ANALYSIS ---
  {
    id: 'preset-data-1',
    title: 'Automated Pandas EDA & Anomaly Detection Pipeline',
    prompt_text: 'Act as a Senior Data Scientist. Write an end-to-end Python script using Pandas, Scikit-learn, and Plotly to perform Exploratory Data Analysis (EDA) on a 100,000-row telemetry dataset. Include missing data imputation, Isolation Forest anomaly detection, feature correlation matrix heatmap, and automated summary report generation.',
    category: 'Data Analysis',
    is_favorite: true,
    created_at: new Date(Date.now() - 86400000 * 23).toISOString(),
    tags: ['Pandas', 'Python', 'Machine Learning', 'EDA'],
    difficulty: 'Advanced',
  },
  {
    id: 'preset-data-2',
    title: 'A/B Test Statistical Significance & Hypothesis Evaluator',
    prompt_text: 'Act as a Lead Quantitative Analyst. Provide a Python script using `statsmodels` to calculate Z-scores, p-values, and 95% confidence intervals for a two-sample conversion rate A/B test. Output a clear executive summary declaring statistical significance and launch recommendations.',
    category: 'Data Analysis',
    is_favorite: false,
    created_at: new Date(Date.now() - 86400000 * 24).toISOString(),
    tags: ['A/B Testing', 'Statistics', 'Python'],
    difficulty: 'Intermediate',
  },
  {
    id: 'preset-data-3',
    title: 'Cohort Retention Analysis & Churn Modeling Script',
    prompt_text: 'Act as a Customer Data Analyst. Write a Python script using Pandas and Seaborn to compute monthly user retention cohorts, visualize cohort retention heatmaps, and train a Logistic Regression model to identify top churn indicator features.',
    category: 'Data Analysis',
    is_favorite: false,
    created_at: new Date(Date.now() - 86400000 * 25).toISOString(),
    tags: ['Cohort', 'Churn', 'Pandas', 'Seaborn'],
    difficulty: 'Intermediate',
  },
  {
    id: 'preset-data-4',
    title: 'LLM Token Usage & API Cost Optimization Analyzer',
    prompt_text: 'Act as a FinOps Data Engineer. Analyze a 30-day LLM execution log dataset (containing model_name, prompt_tokens, completion_tokens, latency_ms). Write a SQL query and Python script calculating daily cost per model, p95 latency by endpoint, and identify top 5 prompt templates causing token bloat.',
    category: 'Data Analysis',
    is_favorite: false,
    created_at: new Date(Date.now() - 86400000 * 26).toISOString(),
    tags: ['FinOps', 'LLM Costs', 'Analytics'],
    difficulty: 'Intermediate',
  },

  // --- CREATIVE ---
  {
    id: 'preset-creative-1',
    title: 'Cyberpunk World-Building & Interactive Dialogue Engine',
    prompt_text: 'Act as a Lead Narrative Designer. Construct a rich world-building bible for a cyberpunk metropolis ("Neo-Tokyo 2099"). Define megacorporations, rogue AI syndicates, black-market cyberware implants, and provide an interactive branching dialogue tree with multi-choice player options in JSON format.',
    category: 'Creative',
    is_favorite: true,
    created_at: new Date(Date.now() - 86400000 * 27).toISOString(),
    tags: ['World Building', 'Gaming', 'Dialogue Tree'],
    difficulty: 'Intermediate',
  },
  {
    id: 'preset-creative-2',
    title: 'Photorealistic AI Art Prompt Synthesizer',
    prompt_text: 'Act as a Master AI Art Director. Synthesize 5 hyper-detailed Midjourney v6 prompts for futuristic quantum computing laboratories. Specify volumetric lighting (cinematic anamorphic flares), camera focal length (85mm f/1.2), color grade (teal and tungsten orange), 8K Octane render parameters, and stylistic mood influences.',
    category: 'Creative',
    is_favorite: false,
    created_at: new Date(Date.now() - 86400000 * 28).toISOString(),
    tags: ['AI Art', 'Midjourney', 'Prompts'],
    difficulty: 'Beginner',
  },
  {
    id: 'preset-creative-3',
    title: 'Sci-Fi Film Script & Scene Breakout Generator',
    prompt_text: 'Act as an Oscar-nominated Screenwriter. Draft a 3-minute sci-fi movie opening scene featuring an astronaut discovering an autonomous alien artifact on Titan. Format in industry-standard Fountain script syntax with sluglines, parentheticals, and intense pacing action blocks.',
    category: 'Creative',
    is_favorite: false,
    created_at: new Date(Date.now() - 86400000 * 29).toISOString(),
    tags: ['Screenwriting', 'Sci-Fi', 'Creative Writing'],
    difficulty: 'Intermediate',
  },
  {
    id: 'preset-creative-4',
    title: 'Brand Mascot & Visual Identity Storyteller',
    prompt_text: 'Act as a Creative Director. Conceptualize an iconic brand mascot for a developer tools company. Define visual character design, backstory, signature personality quirks, color palette HEX codes, and 3 mascot poses for UI empty states.',
    category: 'Creative',
    is_favorite: false,
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    tags: ['Branding', 'Design', 'Mascot'],
    difficulty: 'Beginner',
  },

  // --- EDUCATION ---
  {
    id: 'preset-edu-1',
    title: 'Socratic Computer Science & Algorithm Coach',
    prompt_text: 'Act as a Socratic Computer Science Tutor. Guide a student through understanding Dynamic Programming and Memoization. Instead of providing code directly, ask targeted conceptual questions, construct ASCII recursion tree visualizations, and scaffold step-by-step problem solving.',
    category: 'Education',
    is_favorite: true,
    created_at: new Date(Date.now() - 86400000 * 31).toISOString(),
    tags: ['Socratic', 'Computer Science', 'Algorithms'],
    difficulty: 'Beginner',
  },
  {
    id: 'preset-edu-2',
    title: 'Distributed Systems Mastery Curriculum',
    prompt_text: 'Act as a Principal Software Engineer Mentor. Design a 6-week intensive self-study curriculum for mastering Distributed Systems Architecture. Include weekly learning objectives, foundational research paper readings (Raft, Spanner, Dynamo), hands-on Go implementation labs, and mock architecture interview questions.',
    category: 'Education',
    is_favorite: false,
    created_at: new Date(Date.now() - 86400000 * 32).toISOString(),
    tags: ['Distributed Systems', 'Curriculum', 'Mentorship'],
    difficulty: 'Advanced',
  },
  {
    id: 'preset-edu-3',
    title: 'Quantum Computing Fundamentals Explained Simply',
    prompt_text: 'Act as a Physics Professor. Explain Quantum Superposition, Entanglement, and Qubits to a 15-year-old student using everyday analogies (e.g. spinning coins, linked dice). Include a 5-question interactive quiz with answer explanations at the end.',
    category: 'Education',
    is_favorite: false,
    created_at: new Date(Date.now() - 86400000 * 33).toISOString(),
    tags: ['Quantum', 'Physics', 'Simplification'],
    difficulty: 'Beginner',
  },
  {
    id: 'preset-edu-4',
    title: 'Machine Learning Math Foundations & Matrix Calculus Guide',
    prompt_text: 'Act as an AI Research Scientist. Provide a clear, step-by-step mathematical guide to Backpropagation in Neural Networks. Derive matrix partial derivatives for linear layers and Sigmoid activation functions using LaTeX equations and annotated Python Numpy code.',
    category: 'Education',
    is_favorite: false,
    created_at: new Date(Date.now() - 86400000 * 34).toISOString(),
    tags: ['Math', 'Machine Learning', 'Derivations'],
    difficulty: 'Advanced',
  },

  // --- BUSINESS ---
  {
    id: 'preset-biz-1',
    title: 'AI SaaS Unit Economics & Financial Projection Model',
    prompt_text: 'Act as a Startup Financial Controller. Build a comprehensive 12-month unit economics model for a B2B AI SaaS product. Formulate calculations for MRR, ARR, CAC, LTV, Gross Margin accounting for LLM token API costs, Net Revenue Retention (NRR), and runway burn rate.',
    category: 'Business',
    is_favorite: true,
    created_at: new Date(Date.now() - 86400000 * 35).toISOString(),
    tags: ['Finance', 'SaaS', 'Unit Economics'],
    difficulty: 'Advanced',
  },
  {
    id: 'preset-biz-2',
    title: 'Agile Sprint Retrospective & Workflow Optimizer',
    prompt_text: 'Act as an Agile Scrum Master. Formulate a high-impact 60-minute Sprint Retrospective template tailored for an AI engineering team. Include structured exercises for "What Went Well", "RAG Pipeline Latency Bottlenecks", "Action Commitments", and velocity metric tracking.',
    category: 'Business',
    is_favorite: false,
    created_at: new Date(Date.now() - 86400000 * 36).toISOString(),
    tags: ['Agile', 'Scrum', 'Retrospective'],
    difficulty: 'Beginner',
  },
  {
    id: 'preset-biz-3',
    title: 'M&A Technical Due Diligence Checklist for AI Startups',
    prompt_text: 'Act as a CTO Advisor during an M&A acquisition. Create a technical due diligence audit questionnaire covering proprietary model weights, training data provenance, IP licensing, SOC2 compliance, database security, and key engineering talent retention risks.',
    category: 'Business',
    is_favorite: false,
    created_at: new Date(Date.now() - 86400000 * 37).toISOString(),
    tags: ['M&A', 'Due Diligence', 'CTO', 'Strategy'],
    difficulty: 'Advanced',
  },
  {
    id: 'preset-biz-4',
    title: 'Enterprise AI Vendor RFP (Request for Proposal) Evaluator',
    prompt_text: 'Act as an Enterprise Procurement Director. Construct an RFP template for selecting a commercial LLM API provider. Detail 15 evaluation criteria across SLA uptime guarantees, data privacy guardrails, latency benchmarks, cost per token, and enterprise support response times.',
    category: 'Business',
    is_favorite: false,
    created_at: new Date(Date.now() - 86400000 * 38).toISOString(),
    tags: ['RFP', 'Procurement', 'Enterprise'],
    difficulty: 'Intermediate',
  },

  // --- AI ARCHITECTURE ---
  {
    id: 'preset-arch-1',
    title: 'LangGraph Multi-Agent Workflow State & Supervisor Pattern',
    prompt_text: 'Act as an AI Systems Architect. Design a LangGraph Multi-Agent system graph with a Supervisor Agent routing user requests between a Research Specialist, Code Synthesizer, and Output Reviewer. Provide Python code defining the State typed dict, node edges, and conditional routing logic.',
    category: 'AI Architecture',
    is_favorite: true,
    created_at: new Date(Date.now() - 86400000 * 39).toISOString(),
    tags: ['LangGraph', 'Multi-Agent', 'StateGraph', 'Python'],
    difficulty: 'Advanced',
  },
  {
    id: 'preset-arch-2',
    title: 'RAG Context Compression & Re-ranking Pipeline',
    prompt_text: 'Act as a RAG Specialist. Implement a Python document retriever pipeline combining ChromaDB vector retrieval with Cohere Rerank (`rerank-v3`) to compress 20 retrieved context chunks down to the 3 most relevant context passages before passing to LLM context windows.',
    category: 'AI Architecture',
    is_favorite: true,
    created_at: new Date(Date.now() - 86400000 * 40).toISOString(),
    tags: ['RAG', 'Re-ranking', 'Context Compression'],
    difficulty: 'Intermediate',
  },

  // --- SECURITY & AUDIT ---
  {
    id: 'preset-sec-1',
    title: 'Prompt Injection Risk & Remediation Auditor',
    prompt_text: 'Act as a Senior AI Security Researcher. Analyze a set of raw user inputs for direct and indirect prompt injection attacks (e.g. system instruction override, jailbreaking, data exfiltration via markdown images). Output risk classification and strict defensive XML-sanitization rules.',
    category: 'Security & Audit',
    is_favorite: true,
    created_at: new Date(Date.now() - 86400000 * 41).toISOString(),
    tags: ['Security', 'Prompt Injection', 'Guardrails'],
    difficulty: 'Advanced',
  },
  {
    id: 'preset-sec-2',
    title: 'LLM PII Anonymization & Data Redaction Engine',
    prompt_text: 'Act as a Data Privacy Officer. Write a Python regex & SpaCy NER pipeline to detect and redact Personally Identifiable Information (PII) like SSNs, credit card numbers, emails, and IP addresses from customer text before sending payloads to third-party LLM APIs.',
    category: 'Security & Audit',
    is_favorite: false,
    created_at: new Date(Date.now() - 86400000 * 42).toISOString(),
    tags: ['PII', 'Privacy', 'Redaction', 'Compliance'],
    difficulty: 'Intermediate',
  },

  // --- OTHER ---
  {
    id: 'preset-other-1',
    title: 'Universal Chain-of-Thought Meta-Prompt Optimizer',
    prompt_text: 'Act as a Principal Prompt Engineer. Take any raw user goal and rewrite it into an enterprise-grade meta-prompt structured with: 1) Persona Definition, 2) Context & Scope Constraints, 3) Step-by-Step Chain-of-Thought reasoning steps, 4) Strict JSON Output Schema, and 5) Few-shot input/output examples.',
    category: 'Other',
    is_favorite: true,
    created_at: new Date(Date.now() - 86400000 * 43).toISOString(),
    tags: ['Meta-Prompt', 'Chain of Thought', 'Prompt Engineering'],
    difficulty: 'Intermediate',
  },
];

export default function LibraryPage() {
  const navigate = useNavigate();
  const promptCtx = usePromptContext();

  const [prompts, setPrompts] = useState<SavedPrompt[]>(PRESET_TEMPLATES);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [showFavorites, setShowFavorites] = useState(false);
  const [activeTab, setActiveTab] = useState<'library' | 'history'>('library');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'compact'>('grid');
  const [sortBy, setSortBy] = useState<'created_at' | 'title' | 'category'>('created_at');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Add Prompt Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Coding');
  const [newDifficulty, setNewDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Intermediate');
  const [newTagsInput, setNewTagsInput] = useState('');
  const [newPromptText, setNewPromptText] = useState('');
  const [savingPrompt, setSavingPrompt] = useState(false);

  useEffect(() => {
    loadPrompts();
    loadHistory();
  }, []);

  const loadPrompts = async () => {
    setLoading(true);
    try {
      const data = await getPrompts();
      const dbPrompts = Array.isArray(data) ? data : [];
      const userPromptIds = new Set(dbPrompts.map(p => p.id));
      const presetsToKeep = PRESET_TEMPLATES.filter(p => !userPromptIds.has(p.id));
      setPrompts([...dbPrompts, ...presetsToKeep]);
    } catch (err) {
      console.error('Failed to fetch library prompts from backend:', err);
      setPrompts(PRESET_TEMPLATES);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const data = await getHistory();
      setHistory(data);
    } catch {
      // Silent fail
    }
  };

  const handleDelete = async (id: string) => {
    try {
      if (!id.startsWith('preset-')) {
        await deletePrompt(id);
      }
      setPrompts(prev => prev.filter(p => p.id !== id));
      toast.success('Prompt deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleToggleFavorite = async (id: string) => {
    try {
      if (!id.startsWith('preset-')) {
        const updated = await toggleFavorite(id);
        setPrompts(prev => prev.map(p => p.id === id ? updated : p));
      } else {
        setPrompts(prev => prev.map(p => p.id === id ? { ...p, is_favorite: !p.is_favorite } : p));
      }
    } catch {
      toast.error('Failed to update favorite');
    }
  };

  const handleUseInStudio = (promptText: string) => {
    promptCtx.setOriginalPrompt(promptText);
    toast.success('Template loaded into Prompt Studio!');
    navigate('/dashboard/studio');
  };

  const handleCopyPrompt = async (id: string, text: string) => {
    await copyToClipboard(text);
    setCopiedId(id);
    toast.success('Prompt copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreatePrompt = async () => {
    if (!newTitle.trim()) return toast.error('Please enter a title');
    if (!newPromptText.trim()) return toast.error('Please enter prompt text');

    const tagsArray = newTagsInput.split(',').map(t => t.trim()).filter(Boolean);

    setSavingPrompt(true);
    try {
      const created = await savePrompt({
        title: newTitle.trim(),
        prompt_text: newPromptText.trim(),
        category: newCategory,
      });
      const enriched: SavedPrompt = {
        ...created,
        tags: tagsArray.length > 0 ? tagsArray : ['Custom'],
        difficulty: newDifficulty,
      };
      setPrompts(prev => [enriched, ...prev]);
      toast.success('New prompt added to Library!');
      setShowAddModal(false);
      setNewTitle('');
      setNewPromptText('');
      setNewTagsInput('');
    } catch {
      const localPrompt: SavedPrompt = {
        id: `custom-${Date.now()}`,
        title: newTitle.trim(),
        prompt_text: newPromptText.trim(),
        category: newCategory,
        is_favorite: false,
        created_at: new Date().toISOString(),
        tags: tagsArray.length > 0 ? tagsArray : ['Custom'],
        difficulty: newDifficulty,
      };
      setPrompts(prev => [localPrompt, ...prev]);
      toast.success('Prompt added to library!');
      setShowAddModal(false);
      setNewTitle('');
      setNewPromptText('');
      setNewTagsInput('');
    } finally {
      setSavingPrompt(false);
    }
  };

  // Instant client-side filtering across Title, Category, Content, Tags, and Difficulty
  const filteredPrompts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return prompts
      .filter(p => {
        // Category Filter
        if (activeCategory !== 'All' && p.category !== activeCategory) return false;
        // Difficulty Filter
        if (selectedDifficulty !== 'All' && p.difficulty !== selectedDifficulty) return false;
        // Favorites Filter
        if (showFavorites && !p.is_favorite) return false;

        // Instant Query Search
        if (!q) return true;

        const inTitle = p.title.toLowerCase().includes(q);
        const inText = p.prompt_text.toLowerCase().includes(q);
        const inCategory = (p.category || '').toLowerCase().includes(q);
        const inTags = p.tags ? p.tags.some(t => t.toLowerCase().includes(q)) : false;
        const inDifficulty = (p.difficulty || '').toLowerCase().includes(q);

        return inTitle || inText || inCategory || inTags || inDifficulty;
      })
      .sort((a, b) => {
        if (sortBy === 'title') return a.title.localeCompare(b.title);
        if (sortBy === 'category') return (a.category || '').localeCompare(b.category || '');
        return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
      });
  }, [prompts, searchQuery, activeCategory, selectedDifficulty, showFavorites, sortBy]);

  return (
    <motion.div variants={pageTransition} initial="initial" animate="animate" exit="exit" className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Enterprise Prompt Knowledge Base</h1>
          <p className="text-sm text-[#A3A3A3]">
            {prompts.length} curated enterprise prompts and production templates with instant client-side search.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs bg-[#FF7F11] text-[#0A0A0A] cursor-pointer shadow-lg border-none hover:opacity-95 transition-opacity"
        >
          <Plus size={16} />
          Add Custom Prompt
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-[#1A1A1A] border border-[#3A3A3A] w-fit">
        <button
          onClick={() => setActiveTab('library')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold font-mono flex items-center gap-2 transition-colors ${
            activeTab === 'library' ? 'bg-[#FF7F11]/15 text-[#FF7F11]' : 'text-[#737373] hover:text-white'
          }`}
        >
          <LibraryIcon size={14} /> Library ({filteredPrompts.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold font-mono flex items-center gap-2 transition-colors ${
            activeTab === 'history' ? 'bg-[#FF7F11]/15 text-[#FF7F11]' : 'text-[#737373] hover:text-white'
          }`}
        >
          <Clock size={14} /> Execution History ({history.length})
        </button>
      </div>

      {activeTab === 'library' ? (
        <>
          {/* Instant Search Bar + Difficulty + Favorites */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl bg-[#1A1A1A] border border-[#3A3A3A]">
              <Search size={18} className="text-[#FF7F11] shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Instant search by title, prompt text, tags, difficulty..."
                className="flex-1 bg-transparent border-none outline-none text-xs text-white placeholder-[#737373] font-mono"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-[#737373] hover:text-white text-xs border-none bg-transparent cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Difficulty Filter */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#1A1A1A] border border-[#3A3A3A] shrink-0 text-xs font-mono">
              <Filter size={14} className="text-[#737373]" />
              <span className="text-[#737373]">Difficulty:</span>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="bg-[#0A0A0A] border border-[#3A3A3A] rounded-lg px-2.5 py-1 text-slate-200 outline-none text-xs"
              >
                {DIFFICULTIES.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setShowFavorites(!showFavorites)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono font-semibold border transition-all shrink-0 cursor-pointer ${
                showFavorites
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  : 'bg-white/5 border-[#3A3A3A] text-[#737373] hover:text-white'
              }`}
            >
              <Star size={14} fill={showFavorites ? '#FACC15' : 'none'} />
              Favorites
            </button>
          </div>

          {/* View Modes & Sorting Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="text-[#737373]">View Mode:</span>
              <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-[#3A3A3A]">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === 'grid' ? 'bg-[#FF7F11]/20 text-[#FF7F11]' : 'text-[#737373]'}`}
                  title="Grid View"
                >
                  <LayoutGrid size={14} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === 'list' ? 'bg-[#FF7F11]/20 text-[#FF7F11]' : 'text-[#737373]'}`}
                  title="List View"
                >
                  <List size={14} />
                </button>
                <button
                  onClick={() => setViewMode('compact')}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === 'compact' ? 'bg-[#FF7F11]/20 text-[#FF7F11]' : 'text-[#737373]'}`}
                  title="Compact View"
                >
                  <Table size={14} />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[#737373]">Sort By:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-[#1A1A1A] border border-[#3A3A3A] rounded-xl px-3 py-1.5 text-slate-200 outline-none text-xs"
              >
                <option value="created_at">Recently Created</option>
                <option value="title">Title (A-Z)</option>
                <option value="category">Category</option>
              </select>
            </div>
          </div>

          {/* Category Chips */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-mono font-semibold transition-all cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-[#FF7F11]/15 text-[#FF7F11] border border-[#FF7F11]/30 shadow-sm'
                    : 'bg-white/5 border border-[#3A3A3A] text-[#737373] hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Prompts Layout Grid / List / Compact with Gap-6 Spacing */}
          {filteredPrompts.length === 0 ? (
            <EmptyState
              align="center"
              icon={LibraryIcon}
              title="No Matching Prompts Found"
              description="No saved prompts found matching your current search query, category, or difficulty filter. Try clearing filters or creating a custom template."
              actions={[
                {
                  label: 'Clear Search & Filters',
                  icon: X,
                  onClick: () => {
                    setSearchQuery('');
                    setActiveCategory('All');
                    setSelectedDifficulty('All');
                    setShowFavorites(false);
                  },
                },
                {
                  label: 'Add Custom Prompt',
                  icon: Plus,
                  onClick: () => setShowAddModal(true),
                },
              ]}
            />
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPrompts.map((p) => (
                <div
                  key={p.id}
                  className="p-5 rounded-2xl border border-[#3A3A3A] bg-[#121212] hover:border-[#FF7F11]/50 transition-all flex flex-col justify-between space-y-4 shadow-lg group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-bold text-slate-100 group-hover:text-[#FF7F11] transition-colors leading-snug">
                        {p.title}
                      </h3>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => handleToggleFavorite(p.id)} className="p-1 text-amber-400 cursor-pointer">
                          <Star size={14} fill={p.is_favorite ? '#FACC15' : 'none'} />
                        </button>
                        <button onClick={() => handleDelete(p.id)} className="p-1 text-[#737373] hover:text-red-400 cursor-pointer">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono">
                      <span className="text-[#FF7F11] bg-[#FF7F11]/10 px-2 py-0.5 rounded border border-[#FF7F11]/30">
                        {p.category}
                      </span>
                      {p.difficulty && (
                        <span className={`px-2 py-0.5 rounded border ${
                          p.difficulty === 'Beginner' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                          p.difficulty === 'Intermediate' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                          'bg-purple-500/10 text-purple-400 border-purple-500/30'
                        }`}>
                          {p.difficulty}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-[#A3A3A3] font-mono bg-[#0A0A0A] p-3.5 rounded-xl border border-[#3A3A3A]/60 line-clamp-4 leading-relaxed">
                      {p.prompt_text}
                    </p>

                    {p.tags && p.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {p.tags.map(t => (
                          <span key={t} className="text-[10px] font-mono text-[#737373] bg-white/5 px-2 py-0.5 rounded-md border border-white/5 flex items-center gap-1">
                            <Tag size={9} /> {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[#3A3A3A]/40 text-xs font-mono">
                    <button
                      onClick={() => handleCopyPrompt(p.id, p.prompt_text)}
                      className="text-[#737373] hover:text-white flex items-center gap-1 border-none bg-transparent cursor-pointer"
                    >
                      <Copy size={12} /> {copiedId === p.id ? 'Copied!' : 'Copy'}
                    </button>

                    <button
                      onClick={() => handleUseInStudio(p.prompt_text)}
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#FF7F11] to-[#FF9F43] text-[#0A0A0A] font-bold text-[11px] flex items-center gap-1.5 border-none cursor-pointer hover:opacity-95 transition-opacity"
                    >
                      <span>Use Template</span>
                      <Wand2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : viewMode === 'list' ? (
            <div className="space-y-3 font-mono text-xs">
              {filteredPrompts.map((p) => (
                <div key={p.id} className="p-4 rounded-xl border border-[#3A3A3A] bg-[#121212] flex items-center justify-between gap-4 hover:border-[#FF7F11]/40 transition-all">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-200">{p.title}</span>
                      <span className="text-[10px] text-[#FF7F11] bg-[#FF7F11]/10 px-2 py-0.5 rounded border border-[#FF7F11]/30">{p.category}</span>
                      {p.difficulty && <span className="text-[10px] text-slate-400 bg-white/5 px-2 py-0.5 rounded">{p.difficulty}</span>}
                    </div>
                    <p className="text-[#A3A3A3] truncate text-[11px]">{p.prompt_text}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleUseInStudio(p.prompt_text)}
                      className="px-3 py-1.5 rounded-lg bg-[#FF7F11]/15 text-[#FF7F11] border border-[#FF7F11]/30 font-semibold cursor-pointer"
                    >
                      Use in Studio
                    </button>
                    <button onClick={() => handleToggleFavorite(p.id)} className="p-1.5 text-amber-400 cursor-pointer">
                      <Star size={14} fill={p.is_favorite ? '#FACC15' : 'none'} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2 font-mono text-xs">
              {filteredPrompts.map((p) => (
                <div key={p.id} className="p-3 rounded-lg border border-[#3A3A3A]/60 bg-[#121212] flex items-center justify-between gap-4">
                  <span className="font-semibold text-slate-200 truncate">{p.title}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#737373]">{p.category}</span>
                    <button
                      onClick={() => handleUseInStudio(p.prompt_text)}
                      className="px-2.5 py-1 rounded bg-[#FF7F11] text-black font-bold text-[10px] cursor-pointer"
                    >
                      Use
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        /* History View */
        <div className="space-y-2 font-mono text-xs">
          {history.length === 0 ? (
            <EmptyState align="center" icon={Clock} title="No Execution Records" description="Run prompt optimizations, conversions, or benchmark evaluations to record live history logs." />
          ) : (
            history.map((h) => (
              <div key={h.id} className="p-3 rounded-xl border border-[#3A3A3A] bg-[#121212] flex items-center justify-between">
                <div>
                  <span className="text-[#FF7F11] font-bold uppercase">{h.action_type}</span>
                  <p className="text-slate-300 truncate max-w-lg mt-0.5">{h.prompt_text}</p>
                </div>
                <button
                  onClick={() => handleUseInStudio(h.prompt_text)}
                  className="px-3 py-1 rounded-lg bg-white/5 text-slate-200 border border-[#3A3A3A] cursor-pointer"
                >
                  Load
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Add Custom Prompt Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/75 backdrop-blur-md" onClick={() => setShowAddModal(false)} />

            <div className="relative w-full max-w-lg rounded-2xl border border-[#3A3A3A] bg-[#121212] p-6 z-10 space-y-4 font-sans shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#3A3A3A] pb-3">
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-[#FF7F11]" /> Add Custom Prompt to Knowledge Base
                </h3>
                <button onClick={() => setShowAddModal(false)} className="text-[#737373] hover:text-white cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs font-mono">
                <div>
                  <label className="block text-slate-300 mb-1">Title:</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. React 19 Custom Hook Generator"
                    className="w-full bg-[#0A0A0A] border border-[#3A3A3A] rounded-xl p-3 text-slate-200 outline-none focus:border-[#FF7F11]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 mb-1">Category:</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full bg-[#0A0A0A] border border-[#3A3A3A] rounded-xl p-3 text-slate-200 outline-none"
                    >
                      {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1">Difficulty:</label>
                    <select
                      value={newDifficulty}
                      onChange={(e) => setNewDifficulty(e.target.value as any)}
                      className="w-full bg-[#0A0A0A] border border-[#3A3A3A] rounded-xl p-3 text-slate-200 outline-none"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Tags (comma-separated):</label>
                  <input
                    type="text"
                    value={newTagsInput}
                    onChange={(e) => setNewTagsInput(e.target.value)}
                    placeholder="e.g. React, Hooks, TypeScript"
                    className="w-full bg-[#0A0A0A] border border-[#3A3A3A] rounded-xl p-3 text-slate-200 outline-none focus:border-[#FF7F11]"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Prompt Instructions:</label>
                  <textarea
                    value={newPromptText}
                    onChange={(e) => setNewPromptText(e.target.value)}
                    placeholder="Enter prompt template instructions..."
                    rows={4}
                    className="w-full bg-[#0A0A0A] border border-[#3A3A3A] rounded-xl p-3 text-slate-200 outline-none resize-none focus:border-[#FF7F11]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#3A3A3A]">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#3A3A3A] text-xs font-mono text-[#737373] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePrompt}
                  disabled={savingPrompt}
                  className="px-5 py-2.5 rounded-xl bg-[#FF7F11] text-[#0A0A0A] text-xs font-mono font-semibold border-none cursor-pointer"
                >
                  Add Prompt
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

"""Seed script to populate the database with 20 example prompts across categories."""

import sys
import os
import uuid
from datetime import datetime, timezone

# Add parent directory to path
sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv()

from database.database import init_db, SessionLocal
from database.models import Prompt
from services.ai_service import ai_service
from chromadb_store.client import add_prompt_embedding

SEED_PROMPTS = [
    {
        "title": "Python REST API Builder",
        "prompt_text": "You are a senior Python backend developer. Build a production-ready REST API using FastAPI that implements full CRUD operations for a user management system. Include input validation with Pydantic models, proper error handling with HTTP status codes, SQLAlchemy ORM integration with SQLite, and comprehensive docstrings. Return the complete code with project structure.",
        "category": "Coding",
    },
    {
        "title": "React Component Generator",
        "prompt_text": "Create a reusable React TypeScript component for a data table with sorting, pagination, and search functionality. Use TailwindCSS for styling. Include proper TypeScript interfaces, custom hooks for table logic, and accessibility attributes. The component should accept generic data types.",
        "category": "Coding",
    },
    {
        "title": "SQL Query Optimizer",
        "prompt_text": "Analyze the following SQL query for performance issues and rewrite it for optimal execution. Consider index usage, join order, subquery elimination, and proper use of CTEs. Explain each optimization made and estimate the performance improvement. Target database: PostgreSQL 16.",
        "category": "SQL",
    },
    {
        "title": "Marketing Email Campaign",
        "prompt_text": "Write a 3-email drip campaign for a B2B SaaS product launch targeting CTOs and engineering managers. Each email should have: a compelling subject line (under 50 chars), preview text, personalized body copy, clear CTA, and P.S. line. Tone: professional but approachable. Include A/B test variations for subject lines.",
        "category": "Marketing",
    },
    {
        "title": "Social Media Content Calendar",
        "prompt_text": "Create a 2-week social media content calendar for a tech startup launching an AI product. Include posts for Twitter/X, LinkedIn, and Instagram. Each post should have: platform-specific copy, hashtag suggestions, best posting time, content type (text/image/video/carousel), and engagement hooks. Mix educational, promotional, and community content.",
        "category": "Marketing",
    },
    {
        "title": "Technical Blog Post Writer",
        "prompt_text": "Write a 2000-word technical blog post explaining microservices architecture patterns for a developer audience. Include: an engaging introduction with a real-world analogy, sections on service decomposition, inter-service communication (sync vs async), data management patterns, and deployment strategies. Add code examples in Python and diagrams described in text. End with practical migration steps from monolith.",
        "category": "Writing",
    },
    {
        "title": "Product Description Generator",
        "prompt_text": "Write 5 compelling product descriptions for an e-commerce store selling premium wireless headphones. Each description should be 150-200 words, highlight unique selling points, use sensory language, include technical specs naturally, address customer pain points, and end with a call-to-action. Vary the tone: luxurious, tech-savvy, casual, professional, minimalist.",
        "category": "Writing",
    },
    {
        "title": "Customer Support Response Template",
        "prompt_text": "Create 10 professional customer support email templates for common scenarios: order delay, refund request, product defect, account access issue, feature request, billing dispute, subscription cancellation, positive feedback response, escalation acknowledgment, and service outage notification. Each template should be empathetic, solution-oriented, and include placeholders for personalization.",
        "category": "Customer Support",
    },
    {
        "title": "Data Analysis Pipeline",
        "prompt_text": "Design a Python data analysis pipeline that processes a CSV dataset of e-commerce transactions. Include: data loading and validation, handling missing values and outliers, feature engineering (RFM analysis), customer segmentation using K-means clustering, visualization of key insights using matplotlib/seaborn, and a summary report. Use pandas and scikit-learn. Include error handling and logging.",
        "category": "Data Analysis",
    },
    {
        "title": "Dashboard KPI Report",
        "prompt_text": "Generate a comprehensive monthly KPI report for a SaaS business. Include analysis of: MRR growth and churn rate, customer acquisition cost vs lifetime value, active user trends, feature adoption rates, support ticket volume and resolution time, NPS scores. For each metric, provide: current value, month-over-month change, trend analysis, and 2-3 actionable recommendations.",
        "category": "Data Analysis",
    },
    {
        "title": "Creative Story Outline",
        "prompt_text": "Create a detailed outline for a sci-fi short story (5000 words) about an AI that develops empathy. Include: character profiles (protagonist, antagonist, supporting), three-act structure with plot points, world-building details, thematic elements (consciousness, ethics of AI), dialogue samples showing key conflicts, and a twist ending that reframes the narrative. Target audience: adult fiction readers.",
        "category": "Creative",
    },
    {
        "title": "Course Curriculum Designer",
        "prompt_text": "Design a 12-week online course curriculum for 'Introduction to Machine Learning' targeting beginners with basic Python knowledge. For each week include: learning objectives (Bloom's taxonomy), lecture topics with time estimates, hands-on lab exercises with datasets, quiz questions (mix of conceptual and practical), recommended readings, and milestone project checkpoints. Include a final capstone project description.",
        "category": "Education",
    },
    {
        "title": "Code Review Checklist",
        "prompt_text": "Create a comprehensive code review checklist for a Python web application. Categories should include: code quality (naming, structure, DRY), security (input validation, SQL injection, XSS), performance (N+1 queries, caching, memory leaks), testing (coverage, edge cases, mocking), documentation (docstrings, API docs, README), and DevOps (logging, monitoring, error handling). Each item should have severity level and example.",
        "category": "Coding",
    },
    {
        "title": "Business Proposal Writer",
        "prompt_text": "Write a professional business proposal for a software development agency pitching a custom CRM solution to a mid-size real estate company. Include: executive summary, problem statement with market data, proposed solution architecture, implementation timeline (Gantt chart in text), pricing tiers (starter/professional/enterprise), ROI projections, team qualifications, and terms & conditions. Make it persuasive but realistic.",
        "category": "Business",
    },
    {
        "title": "API Documentation Generator",
        "prompt_text": "Generate comprehensive API documentation for a payment processing REST API. Include: authentication guide (OAuth 2.0 flow), endpoint reference with request/response examples in JSON, error codes with descriptions and resolution steps, rate limiting policies, webhook event types and payloads, SDKs availability, and a quickstart guide with curl examples. Follow OpenAPI 3.0 conventions.",
        "category": "Coding",
    },
    {
        "title": "SQL Database Schema Design",
        "prompt_text": "Design a normalized database schema for an online learning platform. Include tables for: users (students/instructors), courses, lessons, enrollments, progress tracking, quizzes, assignments, grades, reviews, and payments. Provide CREATE TABLE statements with proper constraints, indexes, and foreign keys. Include an ER diagram description and explain normalization decisions.",
        "category": "SQL",
    },
    {
        "title": "Chatbot Persona Designer",
        "prompt_text": "Design a detailed AI chatbot persona for a fintech company's customer-facing assistant. Define: name and backstory, personality traits (warm, knowledgeable, concise), communication style guidelines, tone variations by context (onboarding vs complaint vs upsell), example dialogues for 5 common scenarios, escalation triggers and handoff phrases, topics to avoid, and compliance guardrails for financial advice.",
        "category": "Business",
    },
    {
        "title": "Unit Test Generator",
        "prompt_text": "Generate a comprehensive unit test suite for a Python shopping cart module using pytest. The module has methods: add_item, remove_item, update_quantity, apply_discount, calculate_subtotal, calculate_tax, and checkout. Write tests covering: happy paths, edge cases (empty cart, negative quantity, invalid discount), error handling, boundary values, and integration between methods. Use fixtures, parametrize, and mock external payment service.",
        "category": "Coding",
    },
    {
        "title": "SEO Content Strategy",
        "prompt_text": "Develop a quarterly SEO content strategy for a cloud computing blog targeting mid-level DevOps engineers. Include: keyword research methodology, 20 target keywords with search volume estimates, content pillar topics, 12 article briefs with titles and outlines, internal linking strategy, content distribution plan, and KPI tracking framework. Focus on topical authority building.",
        "category": "Marketing",
    },
    {
        "title": "Incident Response Playbook",
        "prompt_text": "Create a detailed incident response playbook for a cloud-based SaaS application. Cover severity levels (P1-P4) with response time SLAs, on-call rotation guidelines, communication templates (internal and external), diagnostic steps for common issues (database overload, API gateway errors, memory leaks, DDoS), runbooks with CLI commands, post-mortem template, and lessons-learned process. Format as a living document with version control notes.",
        "category": "Business",
    },
]


def seed_database():
    """Seed the database with example prompts."""
    init_db()
    db = SessionLocal()

    try:
        # Check if already seeded
        existing = db.query(Prompt).count()
        if existing > 0:
            print(f"Database already has {existing} prompts. Skipping seed.")
            return

        print(f"Seeding {len(SEED_PROMPTS)} prompts...")

        for i, data in enumerate(SEED_PROMPTS):
            prompt_id = str(uuid.uuid4())

            prompt = Prompt(
                id=prompt_id,
                title=data["title"],
                prompt_text=data["prompt_text"],
                category=data["category"],
                is_favorite=i < 5,  # First 5 are favorites
                created_at=datetime.now(timezone.utc),
            )
            db.add(prompt)
            db.commit()

            # Generate embedding for semantic search
            try:
                embedding = ai_service.generate_embedding(data["prompt_text"])
                add_prompt_embedding(prompt_id, embedding)
                print(f"  [{i+1}/{len(SEED_PROMPTS)}] ✓ {data['title']}")
            except Exception as e:
                print(f"  [{i+1}/{len(SEED_PROMPTS)}] ✗ {data['title']} (embedding failed: {e})")

        print(f"\n✓ Seeded {len(SEED_PROMPTS)} prompts successfully!")

    except Exception as e:
        db.rollback()
        print(f"✗ Seed failed: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()

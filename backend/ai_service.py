import httpx
import json
import os
import logging
from typing import Optional

logger = logging.getLogger(__name__)


AI_PROVIDER = os.getenv("AI_PROVIDER", "ollama").lower()  # ollama, openai, groq
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://ollama:11434/api/generate")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2:latest")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")

ALLOWED_CATEGORIES = [
    "Backend",
    "Frontend",
    "Security",
    "Database",
    "DevOps",
    "Documentation"
]

ALLOWED_RISKS = ["security", "performance", "scalability", "data_loss", "breaking_change"]


def build_prompt(title: str, description: str = "") -> str:
    return f"""[SYSTEM]
You are a Technical Project Manager and AI analyst. Analyze the task provided and output valid JSON.

[ALLOWED CATEGORIES]
You MUST classify the task into exactly one of these:
- Backend (for core application logic, API endpoints, utilities)
- Frontend (for user interfaces, components, styling, CSS, React, pages)
- Security (for auth, credentials, permissions, cryptography, CORS, safety)
- Database (for schemas, migrations, SQL queries, database configuration)
- DevOps (for CI/CD, Docker, pipelines, cloud deployment, server configuration)
- Documentation (for READMEs, code comments, markdown files, guides)

[PRIORITY CRITERIA]
- Priority 5: Security breach, data loss, or system crash.
- Priority 4: Core backend logic or database schema changes.
- Priority 3: API development or major feature implementation.
- Priority 2: UI/UX improvements or minor bug fixes.
- Priority 1: Documentation, styling, or chores.

[ESTIMATION LOGIC]
- Documentation/Styles: 1-2 hours.
- UI Components: 3-5 hours.
- Backend Logic/Security/Database: 5-10 hours.
- Critical Bug Fixes: 2-4 hours.

[RISK FLAGS]
Identify any applicable risks from this list: security, performance, scalability, data_loss, breaking_change.
Only include risks that genuinely apply. Return an empty list if none apply.

[SUBTASK SUGGESTIONS]
Suggest 2-4 concrete implementation subtasks that would help break this task down.

[CONFIDENCE]
Rate your confidence in this analysis from 0.0 to 1.0.
- 1.0 = very clear task with obvious classification
- 0.5 = ambiguous task, could go multiple ways
- Below 0.3 = insufficient information to analyze properly

[TASK TO ANALYZE]
Title: {title}
Description: {description}

[OUTPUT INSTRUCTIONS]
Return ONLY a JSON object. Do not include markdown formatting, backticks, preamble, or explanations.
{{
  "category": "exactly one of the ALLOWED CATEGORIES listed above",
  "priority": integer (1 to 5),
  "estimated_hours": integer (minimum 1),
  "confidence_score": float (0.0 to 1.0),
  "risk_flags": ["list", "of", "applicable", "risks"],
  "suggested_subtasks": ["subtask 1", "subtask 2"],
  "rationale": "Brief explanation of why you chose this category and priority"
}}"""


def fallback_categorize(title: str, description: str = "") -> dict:
    text = (title + " " + description).lower()

    if any(k in text for k in ["security", "auth", "login", "password", "jwt", "token", "permission", "cors", "cryptography"]):
        category = "Security"
        risk_flags = ["security"]
    elif any(k in text for k in ["database", "schema", "sql", "postgres", "migration", "table", "query", "db", "index"]):
        category = "Database"
        risk_flags = ["data_loss"]
    elif any(k in text for k in ["docker", "deploy", "ci/cd", "ci", "cd", "pipeline", "yaml", "compose", "kubernetes", "devops", "aws", "gcp"]):
        category = "DevOps"
        risk_flags = []
    elif any(k in text for k in ["css", "html", "frontend", "ui", "ux", "component", "button", "page", "react", "styling", "tailwind", "color"]):
        category = "Frontend"
        risk_flags = []
    elif any(k in text for k in ["readme", "document", "doc", "comments", "wiki", "guide", "markdown", "tutorial"]):
        category = "Documentation"
        risk_flags = []
    else:
        category = "Backend"
        risk_flags = []

    return {
        "category": category,
        "priority": 3,
        "estimated_hours": 4,
        "confidence_score": 0.3,
        "risk_flags": json.dumps(risk_flags),
        "suggested_subtasks": json.dumps(["Break down task requirements", "Implement core logic", "Write tests"]),
        "rationale": f"Fallback classification based on keyword matching. Category: {category}."
    }


async def call_ollama(prompt: str) -> str:
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(OLLAMA_URL, json={
            "model": OLLAMA_MODEL,
            "prompt": prompt,
            "stream": False,
            "options": {"temperature": 0.1},
            "format": "json"
        })
        response.raise_for_status()
        result = response.json()
        return result.get("response", "")


async def call_openai(prompt: str) -> str:
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENAI_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": OPENAI_MODEL,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.1,
                "response_format": {"type": "json_object"}
            }
        )
        response.raise_for_status()
        result = response.json()
        return result["choices"][0]["message"]["content"]


async def call_groq(prompt: str) -> str:
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": GROQ_MODEL,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.1,
                "response_format": {"type": "json_object"}
            }
        )
        response.raise_for_status()
        result = response.json()
        return result["choices"][0]["message"]["content"]


PROVIDERS = {
    "ollama": call_ollama,
    "openai": call_openai,
    "groq": call_groq,
}


def parse_ai_response(raw: str, fallback: dict) -> dict:
    """Parse and validate AI JSON response, falling back gracefully on any field."""
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        logger.warning("AI Response JSON Error: %s", raw[:200])
        return fallback

    result = {}

    cat = parsed.get("category", "").strip()
    matched_cat = next((c for c in ALLOWED_CATEGORIES if c.lower() == cat.lower()), None)
    result["category"] = matched_cat or fallback["category"]

    try:
        priority = int(parsed.get("priority", 3))
        result["priority"] = priority if 1 <= priority <= 5 else 3
    except (ValueError, TypeError):
        result["priority"] = 3

    try:
        hours = int(parsed.get("estimated_hours", 4))
        result["estimated_hours"] = max(1, hours)
    except (ValueError, TypeError):
        result["estimated_hours"] = 4

    try:
        conf = float(parsed.get("confidence_score", 0.5))
        result["confidence_score"] = max(0.0, min(1.0, conf))
    except (ValueError, TypeError):
        result["confidence_score"] = 0.5

    risk_raw = parsed.get("risk_flags", [])
    if isinstance(risk_raw, list):
        validated_risks = [r for r in risk_raw if isinstance(r, str) and r.lower() in ALLOWED_RISKS]
        result["risk_flags"] = json.dumps(validated_risks)
    else:
        result["risk_flags"] = json.dumps([])

    subtasks_raw = parsed.get("suggested_subtasks", [])
    if isinstance(subtasks_raw, list):
        validated_subtasks = [s for s in subtasks_raw if isinstance(s, str) and len(s.strip()) > 0][:6]
        result["suggested_subtasks"] = json.dumps(validated_subtasks)
    else:
        result["suggested_subtasks"] = json.dumps([])

    rationale = parsed.get("rationale", "")
    result["rationale"] = str(rationale)[:500] if rationale else ""

    return result


async def analyze_task_ai(title: str, description: str = ""):
    """Analyze a task using the configured AI provider. Returns a dict with
    category, priority, estimated_hours, confidence_score, risk_flags,
    suggested_subtasks, and rationale."""

    prompt = build_prompt(title, description)
    fallback = fallback_categorize(title, description)

    provider_fn = PROVIDERS.get(AI_PROVIDER)
    if not provider_fn:
        logger.warning("Unknown AI_PROVIDER '%s', using fallback.", AI_PROVIDER)
        return fallback

    if AI_PROVIDER == "openai" and not OPENAI_API_KEY:
        logger.warning("OPENAI_API_KEY not set, using fallback.")
        return fallback
    if AI_PROVIDER == "groq" and not GROQ_API_KEY:
        logger.warning("GROQ_API_KEY not set, using fallback.")
        return fallback

    try:
        raw_response = await provider_fn(prompt)
        result = parse_ai_response(raw_response, fallback)
        return result
    except Exception as e:
        logger.error("AI Service Error (%s): %s", AI_PROVIDER, e)
        return fallback
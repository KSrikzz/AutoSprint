import httpx
import json
import os
import logging

logger = logging.getLogger(__name__)

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://ollama:11434/api/generate")

async def analyze_task_ai(title: str, description: str = ""):
    prompt = f"""
    Act as a Senior Project Manager. Analyze this task:
    Title: {title}
    Description: {description}

    CRITERIA:
    - Priority 5: Critical Security, Data Loss, or System Crash.
    - Priority 4: Core Backend Logic or Database Schema.
    - Priority 3: API Endpoints or Major Features.
    - Priority 2: UI/UX Improvements or Minor Features.
    - Priority 1: Documentation or Styling.

    ESTIMATION RULES:
    - Documentation/Styles: 1-2 hours.
    - UI Components: 3-5 hours.
    - Database/Security/Backend Logic: 5-10 hours.
    - Critical Bug Fixes: 2-4 hours.

    Return ONLY a JSON object. Example: {{"category": "Backend", "priority": 4, "estimated_hours": 3}}
    """
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(OLLAMA_URL, json={
                "model": "llama3:latest",
                "prompt": prompt,
                "stream": False,
                "format": "json"
            })
            response.raise_for_status()
            result = response.json()
            try:
                return json.loads(result["response"])
            except json.JSONDecodeError:
                logger.warning("AI Response JSON Error: %s", result['response'])
                return {"category": "General", "priority": 1, "estimated_hours": 1}
    except Exception as e:
        logger.error("AI Service Error: %s", e)
        return {"category": "General", "priority": 1, "estimated_hours": 1}
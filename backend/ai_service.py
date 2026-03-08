import httpx
import json
import os

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://ollama:11434/api/generate")

async def analyze_task_ai(title: str, description: str = ""):
    prompt = f"""
    Analyze this software project task:
    Title: {title}
    Description: {description}
    
    Return ONLY a JSON object with these exact keys:
    "category": (e.g., Frontend, Backend, Database, DevOps, Testing),
    "priority": (an integer 1 to 5, where 5 is highest),
    "estimated_hours": (an integer estimate)
    """
    
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.post(OLLAMA_URL, json={
                "model": "llama3",
                "prompt": prompt,
                "stream": False,
                "format": "json"
            })
            result = response.json()
            return json.loads(result["response"])
    except Exception as e:
        print(f"AI Service Error: {e}")
        return {"category": "General", "priority": 1, "estimated_hours": 1}
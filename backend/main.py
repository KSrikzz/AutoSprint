from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(
    title="AutoSprint API",
    description="Backend for the Autonomous Execution Intelligence System",
    version="1.0.0"
)

class HealthResponse(BaseModel):
    status: str
    message: str

@app.get("/", response_model=HealthResponse)
def health_check():
    return {
        "status": "success",
        "message": "AutoSprint FastAPI backend is up and running!"
    }
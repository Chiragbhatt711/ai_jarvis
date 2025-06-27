# main.py - FastAPI Backend with Ollama (Python 3.13 Compatible)

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
import requests

# === CONFIG ===
OLLAMA_API_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "mistral"  # Or your custom model like "jarvis-ai"

# === FASTAPI INIT ===
app = FastAPI(title="Jarvis AI - Ollama", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === INPUT/OUTPUT MODELS ===
class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str
    status: str
    timestamp: str

# === MAIN ROUTE ===
@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    try:
        ollama_response = requests.post(OLLAMA_API_URL, json={
            "model": MODEL_NAME,
            "prompt": request.message,
            "stream": False
        })

        if ollama_response.status_code != 200:
            raise HTTPException(status_code=500, detail="Ollama error: " + ollama_response.text)

        data = ollama_response.json()
        return ChatResponse(
            response=data["response"],
            status="success",
            timestamp=datetime.now().isoformat()
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")

# === TEST ROUTE ===
@app.get("/")
def root():
    return {"message": "✅ Jarvis AI (Ollama) is running."}

# === ENTRY POINT ===
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000)

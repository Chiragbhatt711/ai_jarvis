# main.py - FastAPI Backend with Groq + Mistral (Python 3.13 Compatible)

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
import requests

# === CONFIG ===
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_API_KEY = "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"
MODEL_NAME = "mistral-saba-24b"

# === FASTAPI INIT ===
app = FastAPI(title="Rudra AI", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update this for production
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

# === MAIN CHAT ROUTE ===
@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    try:
        headers = {
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": MODEL_NAME,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You are Jarvis, an AI assistant created by Chirag Bhatt at Rudra Technovation. "
                        "Answer all questions normally. Only mention Chirag Bhatt if the user asks who developed you or something similar."
                    )
                },
                {
                    "role": "user",
                    "content": request.message
                }
            ]
        }

        response = requests.post(GROQ_API_URL, headers=headers, json=payload)

        if response.status_code != 200:
            raise HTTPException(status_code=500, detail=f"Groq API error: {response.text}")

        data = response.json()
        message_content = data["choices"][0]["message"]["content"]

        return ChatResponse(
            response=message_content,
            status="success",
            timestamp=datetime.now().isoformat()
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")

# === HEALTH CHECK ROUTE ===
@app.get("/")
def root():
    return {"message": "✅ Rudra AI (Groq + Mistral) is live."}

# === ENTRY POINT ===
if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Rudra AI Assistant...")
    uvicorn.run(app, host="0.0.0.0", port=8000)

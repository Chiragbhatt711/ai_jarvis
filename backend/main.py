# main.py - FastAPI Backend with Groq + Mistral (Python 3.13 Compatible)

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
import requests
from db import get_connection
import os
from dotenv import load_dotenv

load_dotenv()

# === CONFIG ===
GROQ_API_URL = os.getenv("GROQ_API_URL")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
MODEL_NAME = os.getenv("MODEL_NAME")

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
# === FASTAPI INIT ===
app = FastAPI(title=os.getenv("APP_NAME"), version=os.getenv("APP_VERSION"),debug=True)

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

class TokenData(BaseModel):
    token: str


class UserRequest(BaseModel):
    user_id: str

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
                        "You are Rudra GPT, an AI assistant created by Chirag Bhatt at Rudra Technovation. "
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
        print(f"Error in chat endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")

# === GOOGLE AUTHENTICAT ROUTE ===
@app.post("/google-verify-token")
def verify_google_token(data: TokenData):
    try:
        # Use Google's public API to verify the token
        response = requests.get(f"https://oauth2.googleapis.com/tokeninfo?id_token={data.token}")
        
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail="Invalid token")

        info = response.json()

        # Check that token is for your app
        if info.get("aud") != GOOGLE_CLIENT_ID:
            raise HTTPException(status_code=403, detail="Token audience mismatch")

        # Token is valid
        google_user = {
            "sub": info["sub"],
            "name": info.get("name"),
            "email": info["email"],
            "picture": info.get("picture")
        }

        user_id = save_google_user(google_user)
        return {
            "message": "Login successful",
            "status": "success",
            "timestamp": datetime.now().isoformat(),
            "user_id": user_id,
            "user": {
                "id": google_user["sub"],
                "name": google_user["name"],
                "email": google_user["email"],
                "profile_picture": google_user["picture"]
            }
        }

    except ValueError as e:
        # Token is invalid
        raise HTTPException(status_code=400, detail="Invalid token")

def save_google_user(google_data):
    conn = get_connection()
    cursor = conn.cursor()

    query = """
    INSERT INTO users (id, name, email, profile_picture)
    VALUES (%s, %s, %s, %s)
    ON CONFLICT (id) DO UPDATE
        SET name = EXCLUDED.name,
            email = EXCLUDED.email,
            profile_picture = EXCLUDED.profile_picture
    RETURNING id;
    """

    cursor.execute(query, (
        google_data["sub"],
        google_data.get("name"),
        google_data.get("email"),
        google_data.get("picture")
    ))

    user_id = cursor.fetchone()[0]

    conn.commit()
    cursor.close()
    conn.close()

    return user_id

@app.post("/get-user")
def get_user(payload: UserRequest):
    user_id = payload.user_id
    conn = get_connection()
    cursor = conn.cursor()

    query = "SELECT id, name, email, profile_picture FROM users WHERE id = %s;"
    cursor.execute(query, (user_id,))
    user = cursor.fetchone()

    cursor.close()
    conn.close()

    if user:
        return {
            "status": "success",
            "message": "User retrieved successfully",
            "timestamp": datetime.now().isoformat(),
            "user": {
                "id": user[0],
                "name": user[1],
                "email": user[2],
                "profile_picture": user[3]
            }
        }
    else:
        return {
            "status": "error",
            "message": "User not found",
            "timestamp": datetime.now().isoformat()
        }
# === HEALTH CHECK ROUTE ===
@app.get("/")
def root():
    return {"message": "✅ Rudra AI is live."}

# === ENTRY POINT ===
if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Rudra AI Assistant...")
    uvicorn.run(app, host="0.0.0.0", port=8000)

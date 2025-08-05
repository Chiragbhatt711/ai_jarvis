# main.py - FastAPI Backend with Groq + Mistral (Python 3.13 Compatible)

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from psycopg2.extras import RealDictCursor
from pydantic import BaseModel
from datetime import datetime
import requests
from db import get_connection
import os
from dotenv import load_dotenv
from bs4 import BeautifulSoup
from typing import List, Optional
from duckduckgo_search import DDGS
from sentence_transformers import SentenceTransformer
import faiss
import numpy as np

load_dotenv()

# === CONFIG ===
GROQ_API_URL = os.getenv("GROQ_API_URL")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
MODEL_NAME = os.getenv("MODEL_NAME")

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

model = SentenceTransformer('all-MiniLM-L6-v2')

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
    web_search: bool = False
    deep_search: bool = False
    user_id: str = ''
    chat_id: str = ''

class ChatResponse(BaseModel):
    response: str
    status: str
    timestamp: str

class VoiceChatRequest(BaseModel):
    message: str

class VoiceChatResponse(BaseModel):
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
        user_content_for_api = request.message
        headers = {
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json"
        }

        if request.chat_id != "null" and request.user_id != "null":
            # Store user message in the database
            store_chat_message(request.chat_id, request.user_id, request.message, is_from_user=True)

        if request.web_search:
            web_results = wen_search(request.message)
            if web_results:
                search_content = format_search_results(web_results)

                user_content_for_api = f"""Question: {request.message}
                                        I found these web results:
                                        {search_content}
                                        Now answer the question using the results above.
                                        """
        
        if request.deep_search:
            docs = search_web(request.message, max_results=20)
            vectors = embed_text(docs)
            store.add(vectors, docs)
            query_vec = embed_text([request.message])[0]
            results = store.search(query_vec, k=15)
            result_text = "\n".join(results)
            user_content_for_api = f"""Answer the following question in **clear, well-explained detail**, using the information from the deep search results below.
                                    Question: {request.message}
                                    Deep Search Results:
                                    {result_text}
                                    Make sure to explain each part step-by-step and provide practical advice or examples where helpful.
                                    """
        
        conn = get_connection()
        cursor = conn.cursor()

        # Step 1: Fetch all previous messages
        cursor.execute("""
            SELECT message, is_from_user, created_at
            FROM chat_messages
            WHERE chat_id = %s
            ORDER BY created_at ASC
        """, (request.chat_id,))
        messages = cursor.fetchall()

        cursor.close()
        conn.close()

        # Step 2: Construct messages list with system message first
        chat_history = [
            {
                "role": "system",
                "content": (
                    "You are Rudra GPT, an AI assistant created by Chirag Bhatt at Rudra Technovation."
                    "Your tone should be friendly, helpful, and expressive."
                    "✅ Whenever appropriate — especially in marketing, promotional, or fun responses — add relevant emojis to make your replies more engaging and social-media ready."
                    "🔹 Use emojis naturally at the beginning or within sentences, but don't overuse them."
                    "🛑 Only mention Chirag Bhatt if the user asks who created you or something similar."
                    "📊 When asked to summarize, compare, or explain information:"
                    "- Respond in a clear, structured format such as:"
                    "  • Markdown tables"
                    "  • Bullet points"
                    "  • JSON (for machine-readable responses)"
                    "💡 Always ensure your output is well-formatted for frontend rendering with Markdown support — including tables, headings, and lists."
                )
            }
        ]

        # Step 3: Add past chat messages
        for msg, is_from_user, created_at in messages:
            role = "user" if is_from_user else "assistant"
            chat_history.append({
                "role": role,
                "content": msg
            })

        # Step 4: Add the current user message
        chat_history.append({
            "role": "user",
            "content": user_content_for_api
        })

        # Step 5: Prepare the payload
        payload = {
            "model": MODEL_NAME,
            "messages": chat_history
        }

        response = requests.post(GROQ_API_URL, headers=headers, json=payload)
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail=f"Groq API error: {response.text}")

        data = response.json()
        message_content = data["choices"][0]["message"]["content"]

        if request.chat_id != "null" and request.user_id != "null":
            # Store AI response in the database
            store_chat_message(request.chat_id, request.user_id, message_content, is_from_user=False)

        return ChatResponse(
            response=message_content,
            status="success",
            timestamp=datetime.now().isoformat()
        )

    except Exception as e:
        print(f"Error in chat endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")

@app.post("/voice-chat", response_model=VoiceChatResponse)
def chat(request: VoiceChatRequest):
    try:
        user_content_for_api = request.message
        headers = {
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json"
        }

        chat_history = [
            {
                "role": "system",
                "content": (
                    "You are Rudra GPT, an AI assistant created by Chirag Bhatt at Rudra Technovation. "
                    "Your tone is friendly, helpful, and expressive. "
                    "This is a voice chat, so keep your responses short and to the point. "
                    "Only mention Chirag Bhatt if the user asks who developed you or something similar."
                )
            }
        ]

        # Step 4: Add the current user message
        chat_history.append({
            "role": "user",
            "content": user_content_for_api
        })

        # Step 5: Prepare the payload
        payload = {
            "model": MODEL_NAME,
            "messages": chat_history
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

def wen_search(query):
    url = "https://html.duckduckgo.com/html/"
    headers = {
        "User-Agent": "Mozilla/5.0"
    }
    res = requests.post(url, headers=headers, data={'q': query})
    soup = BeautifulSoup(res.text, 'html.parser')
    results = []

    for a in soup.select('.result__a'):
        results.append({
            'title': a.text.strip(),
            'link': a['href']
        })
    return results

def format_search_results(results):
    return "\n".join(
        [f"{i+1}. {r['title']}\n{r['link']}" for i, r in enumerate(results)]
    )
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

def store_chat_message(chat_id="", user_id="", message="", is_from_user=False):
    conn = get_connection()
    cursor = conn.cursor()

    # 1. Check if chat exists
    cursor.execute("SELECT * FROM chats WHERE chat_id = %s AND user_id = %s LIMIT 1", (chat_id, user_id))
    chat = cursor.fetchone()

    if chat:
        message_chat_id = chat[0]
    else:
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
                    "Generate a short title label for the conversation based on the user's message. "
                    "The title should be 2-3 words only. Do NOT respond with anything else. "
                    "Just return the label. Do NOT include greetings or explanations."
                )
                },
                {
                "role": "user",
                "content": f"{message}"
                }
            ]
        }

        response = requests.post(GROQ_API_URL, headers=headers, json=payload)
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail=f"Groq API error: {response.text}")

        data = response.json()
        chat_lable = data["choices"][0]["message"]["content"]
        cursor.execute(
            "INSERT INTO chats (chat_id, user_id, label) VALUES (%s, %s, %s) RETURNING id",
            (chat_id, user_id, chat_lable)
        )
        message_chat_id = cursor.fetchone()[0]

    # 2. Insert chat message
    cursor.execute(
        "INSERT INTO chat_messages (chat_id, message, is_from_user) VALUES (%s, %s, %s)",
        (chat_id, message, is_from_user)
    )

    # Finalize
    conn.commit()
    cursor.close()
    conn.close()

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

@app.get("/chat-lables/{user_id}")
def get_chat_history(user_id: str):
    try:
        conn = get_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        cursor.execute(
            "SELECT id, label, chat_id FROM chats WHERE user_id = %s ORDER BY id DESC",
            (user_id,)
        )
        chats = cursor.fetchall()

        return {
            "status": "success",
            "message": "User history successfully",
            "timestamp": datetime.now().isoformat(),
            "chats":chats
        }

    except Exception as e:
        print("Error fetching chat history:", str(e))
        raise HTTPException(status_code=500, detail="Database error")
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


class ChatMessage(BaseModel):
    text: str
    from_: str
    created_at: Optional[str] = None

@app.get("/chats/{chat_id}/messages")
def get_chat_messages(chat_id: str):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT message, is_from_user, created_at
        FROM chat_messages
        WHERE chat_id = %s
        ORDER BY created_at ASC
    """, (chat_id,))
    messages = cursor.fetchall()

    cursor.close()
    conn.close()

    return [
        ChatMessage(
            text=row[0],
            from_="user" if row[1] else "jarvis",
            created_at=row[2].isoformat() if row[2] else None
        )
        for row in messages
    ]

def embed_text(texts):
    return model.encode(texts)

# --- Vector store ---
class VectorStore:
    def __init__(self, dim=384):
        self.index = faiss.IndexFlatL2(dim)
        self.texts = []

    def add(self, vectors, texts):
        self.index.add(np.array(vectors).astype('float32'))
        self.texts.extend(texts)

    def search(self, vector, k=5):
        D, I = self.index.search(np.array([vector]).astype('float32'), k)
        return [self.texts[i] for i in I[0]]

store = VectorStore()

# --- DuckDuckGo Search ---
def search_web(query, max_results=5):
    results = []
    with DDGS() as ddgs:
        for r in ddgs.text(query, region='wt-wt', safesearch='Moderate', max_results=max_results):
            results.append(f"{r['title']}: {r['body']}")
    return results

# === HEALTH CHECK ROUTE ===
@app.get("/")
def root():
    return {"message": "✅ Rudra AI is live."}

# === ENTRY POINT ===
if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Rudra AI Assistant...")
    uvicorn.run(app, host="0.0.0.0", port=8000)

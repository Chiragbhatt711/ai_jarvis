# main.py - FastAPI Backend for Jarvis AI Assistant (Python 3.13 Compatible)
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, APIRouter
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai
from pydantic import BaseModel
import uvicorn
import asyncio
import json
import webbrowser
import subprocess
import os
import platform
import requests
from datetime import datetime
from typing import List, Dict , Any
from groq import Groq
import threading
import requests

router = APIRouter()

app = FastAPI(title="Jarvis AI Assistant API", version="1.0.0")
api_key = "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"
client = Groq(api_key=api_key)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class ChatMessage(BaseModel):
    message: str
    timestamp: str = None

class CommandRequest(BaseModel):
    command: str
    parameters: Dict[str, Any] = {}

class SearchRequest(BaseModel):
    query: str

# Global variables
connected_clients: List[WebSocket] = []
tts_engine = None
recognizer = None

# Feature availability flags
SPEECH_RECOGNITION_AVAILABLE = False
TTS_AVAILABLE = False

# Initialize optional features
def init_optional_features():
    global tts_engine, recognizer, SPEECH_RECOGNITION_AVAILABLE, TTS_AVAILABLE
    
    try:
        import pyttsx3
        tts_engine = pyttsx3.init()
        tts_engine.setProperty('rate', 150)
        tts_engine.setProperty('volume', 0.9)
        TTS_AVAILABLE = True
    except Exception as e:
        print(f"⚠️  TTS init failed: {e}")
    
    try:
        import speech_recognition as sr
        recognizer = sr.Recognizer()
        SPEECH_RECOGNITION_AVAILABLE = True
    except Exception as e:
        print(f"⚠️  Speech recognition init failed: {e}")

init_optional_features()

class JarvisCore:
    def __init__(self):
        pass

    async def process_command(self, command: str) -> Dict[str, Any]:
        command_lower = command.lower()

        try:
            if any(word in command_lower for word in ["open youtube", "youtube"]):
                return await self.open_youtube()
            elif any(word in command_lower for word in ["open chrome", "browser", "chrome"]):
                return await self.open_chrome()
            elif any(word in command_lower for word in ["open google", "google.com", "google"]):
                return await self.open_google()
            elif any(word in command_lower for word in ["notepad", "text editor"]):
                return await self.open_notepad()
            elif any(word in command_lower for word in ["calculator"]):
                return await self.open_calculator()
            elif any(word in command_lower for word in ["time", "what time"]):
                return await self.get_time()
            elif any(word in command_lower for word in ["date", "today"]):
                return await self.get_date()
            elif any(word in command_lower for word in ["system info", "system information"]):
                return await self.get_system_info()
            elif any(word in command_lower for word in ["hello", "hi", "hey"]):
                return {"status": "success", "message": "Hello! How can I help you today?", "type": "greeting"}
            elif any(word in command_lower for word in ["features", "what can you do", "help"]):
                return await self.get_features()
            elif "who made you" in command_lower or "who developed you" in command_lower or "your creator" in command_lower:
                return {
                    "status": "success",
                    "message": "I was developed by Chirag Bhatt 🧠",
                    "type": "info",
                    "query": command_lower,
                }
            elif "how are you" in command_lower or "how's it going" in command_lower or "what's up" in command_lower:
                return {
                    "status": "success",
                    "message": "I'm doing great, thanks for asking! 😊",
                    "type": "info",
                    "query": command_lower,
                }
            else:
                # Fallback to search
                return await self.ask_gemini(command_lower)
        except Exception as e:
            return {"status": "error", "message": f"Error processing command: {str(e)}", "type": "error"}

    async def get_features(self):
        features = [
            "🌐 Open websites (YouTube, Google)",
            "📱 Open applications (Chrome, Notepad, Calculator)",
            "🔍 Web search",
            "⏰ Get current time and date",
            "💻 System information",
        ]
        if TTS_AVAILABLE:
            features.append("🔊 Text-to-speech")
        if SPEECH_RECOGNITION_AVAILABLE:
            features.append("🎤 Voice recognition")

        return {
            "status": "success",
            "message": "Here's what I can do:\n\n" + "\n".join(features),
            "type": "info"
        }

    async def open_youtube(self):
        try:
            webbrowser.open("https://www.youtube.com")
            return {"status": "success", "message": "Opening YouTube", "type": "command"}
        except Exception as e:
            return {"status": "error", "message": str(e), "type": "error"}

    async def open_chrome(self):
        try:
            system = platform.system()
            if system == "Windows":
                subprocess.Popen(["start", "chrome"], shell=True)
            elif system == "Darwin":
                subprocess.Popen(["open", "-a", "Google Chrome"])
            else:
                subprocess.Popen(["google-chrome"])
            return {"status": "success", "message": "Opening Chrome", "type": "command"}
        except Exception as e:
            webbrowser.open("https://www.google.com")
            return {"status": "success", "message": "Fallback: Opening Google", "type": "command"}

    async def open_google(self):
        try:
            webbrowser.open("https://www.google.com")
            return {"status": "success", "message": "Opening Google", "type": "command"}
        except Exception as e:
            return {"status": "error", "message": str(e), "type": "error"}

    async def open_notepad(self):
        try:
            system = platform.system()
            if system == "Windows":
                subprocess.Popen(["notepad.exe"])
            elif system == "Darwin":
                subprocess.Popen(["open", "-a", "TextEdit"])
            else:
                subprocess.Popen(["gedit"])
            return {"status": "success", "message": "Opening Notepad", "type": "command"}
        except Exception as e:
            return {"status": "error", "message": str(e), "type": "error"}

    async def open_calculator(self):
        try:
            system = platform.system()
            if system == "Windows":
                subprocess.Popen(["calc.exe"])
            elif system == "Darwin":
                subprocess.Popen(["open", "-a", "Calculator"])
            else:
                subprocess.Popen(["gnome-calculator"])
            return {"status": "success", "message": "Opening Calculator", "type": "command"}
        except Exception as e:
            return {"status": "error", "message": str(e), "type": "error"}

    async def get_time(self):
        try:
            now = datetime.now().strftime("%I:%M %p")
            return {"status": "success", "message": f"The time is {now}", "type": "info"}
        except Exception as e:
            return {"status": "error", "message": str(e), "type": "error"}

    async def get_date(self):
        try:
            today = datetime.now().strftime("%A, %B %d, %Y")
            return {"status": "success", "message": f"Today is {today}", "type": "info"}
        except Exception as e:
            return {"status": "error", "message": str(e), "type": "error"}

    async def get_system_info(self):
        try:
            info = (
                f"System: {platform.system()} {platform.release()}\n"
                f"Architecture: {platform.machine()}\n"
                f"Processor: {platform.processor()}\n"
                f"Python Version: {platform.python_version()}"
            )
            return {"status": "success", "message": info, "type": "info"}
        except Exception as e:
            return {"status": "error", "message": str(e), "type": "error"}

    async def search_web(self, query: str):
        try:
            if not query.strip():
                return {"status": "error", "message": "Empty search query", "type": "error"}
            url = f"https://www.google.com/search?q={query.replace(' ', '+')}"
            webbrowser.open(url)
            return {"status": "success", "message": f"Searching: {query}", "type": "search"}
        except Exception as e:
            return {"status": "error", "message": str(e), "type": "error"}

    async def ask_gemini(self, query: str):
        try:
            secret_key = "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"
            model = "llama-3.3-70b-versatile"
            mode = await JarvisCore.detect_response_mode(query)
            prompt = await JarvisCore.build_prompt(query, mode)
            
            print(f"🔍 prompt: {prompt}")
            chat_completion = client.chat.completions.create(
                    messages=[
                        {
                            "role": "system",
                            "content": "You are a helpful assistant."
                        },
                    {
                        "role": "user",
                        "content": prompt,
                    }
                ],
                model=model,
            )
            message = chat_completion.choices[0].message.content

            return {
                "status": "success",
                "message": message,
                "type": "search",
                "query": query,
            }

        except Exception as e:
            return {
                "status": "error",
                "message": f"Groq API error: {str(e)}",
                "type": "error"
            }

    async def detect_response_mode(user_input: str):
        short_keywords = ["what is", "who is", "define", "shortcut", "syntax"]
        detailed_keywords = ["explain", "how", "why", "code", "write", "generate", "example"]

        lower_input = user_input.lower()
        
        if any(kw in lower_input for kw in detailed_keywords):
            return "detailed"
        if any(kw in lower_input for kw in short_keywords):
            return "short"
        return "short"  # Default fallback

    async def build_prompt(user_input, mode="short"):
        if mode == "short":
            return f"Answer briefly and only with the solution or key point.\nQuestion: {user_input}\nAnswer:"
        else:
            return f"Explain clearly with proper steps and code if needed.\nQuestion: {user_input}\nAnswer:"


# Initialize Jarvis core
jarvis = JarvisCore()

@router.get("/")
async def root():
    return {
        "message": "Jarvis AI Assistant API is running",
        "features": {
            "tts_available": TTS_AVAILABLE,
            "speech_recognition_available": SPEECH_RECOGNITION_AVAILABLE
        }
    }

@router.post("/chat")
async def chat(message: ChatMessage):
    try:
        response = await jarvis.process_command(message.message)
        return {
            "response": response["message"],
            "status": response["status"],
            "type": response["type"],
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Optional endpoints (not used if you want only `/chat`)
@app.post("/speak")
async def speak(message: ChatMessage):
    if TTS_AVAILABLE and tts_engine:
        def speak_now():
            tts_engine.say(message.message)
            tts_engine.runAndWait()
        threading.Thread(target=speak_now).start()
        return {"status": "success", "message": "Speaking text"}
    return {"status": "error", "message": "TTS not available"}
app.include_router(router, prefix="/backend")

if __name__ == "__main__":
    print("🚀 Starting Jarvis AI Assistant...")
    uvicorn.run(app, host="0.0.0.0", port=8000)

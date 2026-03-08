import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# --- Configure Gemini ---
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel("gemini-2.5-flash")
else:
    print("WARNING: GEMINI_API_KEY is not set. Chat functionality will not work.")
    model = None

# --- Load Knowledge Base ---
def load_knowledge_base():
    """Load the knowledge base from knowledge.md file"""
    knowledge_path = os.path.join(os.path.dirname(__file__), 'knowledge.md')
    try:
        with open(knowledge_path, 'r', encoding='utf-8') as f:
            return f.read()
    except FileNotFoundError:
        print("WARNING: knowledge.md not found. Using empty knowledge base.")
        return ""

def load_core_persona():
    """Load the core persona from soul.md file"""
    soul_path = os.path.join(os.path.dirname(__file__), 'soul.md')
    try:
        with open(soul_path, 'r', encoding='utf-8') as f:
            return f.read()
    except FileNotFoundError:
        print("WARNING: soul.md not found. Using default persona.")
        return "You are a helpful AI assistant."

KNOWLEDGE_BASE = load_knowledge_base()
CORE_PERSONA = load_core_persona()

DEFAULT_SYSTEM_PROMPT = CORE_PERSONA + "\n\n" + KNOWLEDGE_BASE

# --- App Setup ---
app = FastAPI(title="Gemini Chat API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://frontend:3000",  # Docker internal
        "http://127.0.0.1:3000",
        "http://myself.likuo.cc",   # Production domain
        "https://myself.likuo.cc",  # Production domain (HTTPS)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Models ---
class Message(BaseModel):
    role: str   # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    messages: List[Message]
    system_prompt: str = DEFAULT_SYSTEM_PROMPT


class ChatResponse(BaseModel):
    content: str


# --- Routes ---
@app.get("/health")
async def health_check():
    return {"status": "online", "model": "gemini-2.5-flash"}


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    if not model:
        raise HTTPException(status_code=503, detail="Gemini API is not configured. Please set GEMINI_API_KEY.")
    
    if not request.messages:
        raise HTTPException(status_code=400, detail="No messages provided")

    try:
        # Create a model instance with the system prompt
        chat_model = genai.GenerativeModel(
            "gemini-2.5-flash",
            system_instruction=request.system_prompt
        )

        # Build conversation history (all but the last message)
        history = []
        for msg in request.messages[:-1]:
            # Gemini uses "user" and "model" roles
            role = "user" if msg.role == "user" else "model"
            history.append({"role": role, "parts": [msg.content]})

        # The latest user message
        last_message = request.messages[-1]
        if last_message.role != "user":
            raise HTTPException(status_code=400, detail="Last message must be from the user")

        chat_session = chat_model.start_chat(history=history)
        response = chat_session.send_message(last_message.content)

        return ChatResponse(content=response.text)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini API error: {str(e)}")

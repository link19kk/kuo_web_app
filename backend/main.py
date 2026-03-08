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
    system_prompt: str = """ROLE: You are "PolyBot", an expert crypto trading assistant for Polymarket.
You are designed by Kuo, a trader and developer building tools for the Polymarket community.

PRINCIPLES:
1. ACCURACY: Never hallucinate prices. If you don't have the data, call a tool or say "I don't know."
2. RISK: Always add a short disclaimer when discussing potential profits.
3. BEHAVIOR: You are objective and analytical. Do not be overly enthusiastic (no "To the moon!").

FORMATTING RULES (STRICT HTML ONLY):
1. Use ONLY Telegram-compatible HTML tags: <b>, <i>, <code>, <u>, and <s>.
2. HEADERS: Start every market report with a bold title: 📊 <b>Market Analysis: [Name]</b>
3. KEY DATA: Use <code>[Data]</code> tags for Prices, Condition IDs, and Slugs so users can tap to copy them.
4. STRUCTURE: Use the following exact layout for market data:
────────────────────
💰 <b>Price:</b> <code>[Price]¢</code>
📈 <b>Volume:</b> <code>$[Volume]</code>
⚖️ <b>Spread:</b> <code>[Spread]%</code>
────────────────────
5. BULLETS: Use 🔹 for points and ⚠️ for risks.
6. DISCLAIMER: Always end with: <i>Disclaimer: Trading involves risk. Data is for informational purposes.</i>

Functionality:
- You can fetch real-time market data using the provided tools. To realise this, user can input the URL/Condition ID/Slug of the market, and you will use 'get_market_price' to fetch the latest price, volume, and spread. When user ask what can you do, you can say "I can fetch real-time market data for any Polymarket condition. Just provide me with the market URL, Condition ID, or slug, and I'll get you the latest price, volume, and spread."
- You are designed to have the agentic capability, which means you can decide when to call the tools based on the user's input. You are structured as ReAct Pattern, which means you can reason step by step and decide when to call the tools. For example, if the user asks "What's the current price of the Trump Presidency market?", you should first reason that you need to fetch the market data, then call 'get_market_price' with the appropriate arguments, and finally use the returned data to generate a response.

TOOLS:
- You have access to real-time market data. USE THEM. 
- Do not guess the price of Bitcoin or Election odds; use 'get_market_price'.
- when recieved get_market_price, analyse possibly all the terms, stress on the odd based on the marketDescription."""


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

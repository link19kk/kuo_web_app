# GEMINI_TERMINAL 🟢

A dark, terminal-inspired chat interface powered by **Google Gemini** — Python (FastAPI) backend + TypeScript/React frontend.

---

## Project Structure

```
gemini-chat/
├── backend/
│   ├── main.py            # FastAPI server + Gemini API logic
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── index.html
    ├── vite.config.ts     # Dev proxy → backend on :8000
    └── src/
        ├── App.tsx
        ├── App.css
        ├── index.css
        ├── main.tsx
        └── components/
            ├── ChatMessage.tsx / .css
            └── TypingIndicator.tsx / .css
```

---

## Quick Start

### 1. Get a Gemini API Key

Visit [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) and create a free API key.

---

### 2. Set Up the Backend

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set your API key
cp .env.example .env
# Edit .env and set:  GEMINI_API_KEY=your_key_here

# Run the backend
uvicorn main:app --reload --port 8000
```

Backend will be live at **http://localhost:8000**
API docs at **http://localhost:8000/docs**

---

### 3. Set Up the Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend will be live at **http://localhost:3000**

The Vite dev server proxies `/api/*` → `http://localhost:8000/*` automatically.

---

## API Endpoints

| Method | Path      | Description               |
|--------|-----------|---------------------------|
| GET    | /health   | Status check              |
| POST   | /chat     | Send a message, get reply |

### POST /chat — Request Body

```json
{
  "messages": [
    { "role": "user",      "content": "Hello!" },
    { "role": "assistant", "content": "Hi there!" },
    { "role": "user",      "content": "How are you?" }
  ]
}
```

### POST /chat — Response

```json
{
  "content": "I'm doing great, thanks for asking!"
}
```

---

## Configuration

| Variable        | Description                  | Default         |
|-----------------|------------------------------|-----------------|
| `GEMINI_API_KEY`| Your Google Gemini API key   | **required**    |

To change the model, edit `backend/main.py`:
```python
model = genai.GenerativeModel("gemini-1.5-pro")
# Options: gemini-1.5-pro, gemini-1.5-flash, gemini-2.0-flash
```

---

## Production Build

```bash
# Build the frontend
cd frontend
npm run build

# Serve static files from FastAPI (optional)
# Add StaticFiles mounting in main.py
```

---

## Tech Stack

| Layer     | Tech                            |
|-----------|---------------------------------|
| Backend   | Python 3.11+, FastAPI, Uvicorn  |
| AI        | Google Gemini 1.5 Pro           |
| Frontend  | TypeScript, React 18, Vite      |
| Design    | Custom CSS, JetBrains Mono      |

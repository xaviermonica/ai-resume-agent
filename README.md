# AI Study Notes Generator (Serverless, Pydantic AI)

A minimal, end-to-end study notes generator built with Next.js (App Router) and a serverless API route that calls a Python agent using Pydantic AI. It validates input and output with Pydantic models and uses OpenRouter's `openai/gpt-oss-20b:free` model.

- No traditional backend server
- No database
- No authentication
- Clean, responsive UI using CSS Modules

## Project Structure
```
/app
	/api/notes/route.ts
	/page.tsx
	/page.module.css
/agent
	agent.py
	schemas.py
/lib
	openrouter.ts
.env.example
README.md
```

## Requirements
- Node.js 18+
- Python 3.10+
- OpenRouter API key

## Environment Variables
Create `.env.local` with:
```
OPENROUTER_API_KEY=your_api_key_here
```

## Local Development
1. Install Node deps:
```bash
npm install
```
2. Ensure Python deps are available (recommended to create a virtual env):
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install pydantic-ai loguru pydantic
```
3. Run dev server:
```bash
npm run dev
```
Open http://localhost:3000

## Vercel Deployment (Serverless Only)
1. Push this repo to GitHub.
2. Import to Vercel.
3. Set environment variable in Vercel Project Settings → Environment Variables:
	 - `OPENROUTER_API_KEY`
4. Ensure Python is available during runtime. In **Build & Output Settings** set Install Command to also vendor Python dependencies:
	 - Install Command: `pip install pydantic-ai loguru pydantic -t agent/.python_packages && npm install`
	 - Build Command: `npm run build`
5. Optionally set `PYTHONPATH=agent/.python_packages` in Environment Variables so the serverless route can import vendored packages.

## Usage
- Paste study content
- Select `exam type` and `depth`
- Click Generate Notes
- Copy notes via the button

## Validation & Reliability
- Input and output schemas are strictly validated in Python via Pydantic
- Bullet-point-only output enforced by prompt and normalized post-process
- One retry on validation failure; clear error returned if still invalid
- Robust error handling in the serverless route (timeouts, JSON parsing, process errors)

## Model & Provider
- Provider: OpenRouter API (`https://openrouter.ai/api/v1`)
- Model: `openai/gpt-oss-20b:free`

## Notes
- This app uses a serverless Node route to call a Python agent (Pydantic AI). No persistent server or database is used.
- Ensure your Vercel project can run Python3. If unavailable, use Vercel’s Python Serverless Functions or vendor dependencies as described.
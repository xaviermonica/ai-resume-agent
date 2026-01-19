import os
import sys
import json
from loguru import logger
from typing import Any
from openrouter import OpenRouter
from schemas import InputSchema, OutputSchema

SYSTEM_PROMPT = (
    "You are an expert study-notes generator. "
    "Produce structured, exam-ready notes strictly following this schema: title, key_concepts[], important_points[], exam_tips[]. "
    "Rules: Output must be bullet-point only (each item a concise bullet). Do not add extra sections. "
    "Adapt depth to the requested level: short (very concise bullets), medium (balanced detail), detailed (deeper bullets, but still bullets). "
    "Return ONLY a valid JSON object with these exact keys: title, key_concepts, important_points, exam_tips. No markdown, no extra text."
)

MODEL_NAME = os.getenv("MODEL_NAME", "openai/gpt-oss-120b:free")
API_KEY = os.getenv("OPENROUTER_API_KEY", "")


def _normalize_bullets(items: list[str]) -> list[str]:
    norm = []
    for s in items:
        s = s.strip()
        if not s:
            continue
        if not (s.startswith("- ") or s.startswith("• ")):
            s = "- " + s
        norm.append(s)
    return norm


def _run_once(payload: InputSchema) -> OutputSchema:
    user_prompt = (
        f"Generate study notes for exam type '{payload.exam_type}' with depth '{payload.depth}'. "
        f"Use only bullets. Content:\n\n{payload.content}\n\n"
        f"Return a JSON object with: title (string), key_concepts (array of strings), "
        f"important_points (array of strings), exam_tips (array of strings)."
    )
    
    with OpenRouter(api_key=API_KEY) as client:
        response = client.chat.send(
            model=MODEL_NAME,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt}
            ]
        )
        
        # Extract content from response
        content = response.choices[0].message.content
        
        # Clean markdown code blocks if present
        if content.startswith("```json"):
            content = content.replace("```json", "").replace("```", "").strip()
        elif content.startswith("```"):
            content = content.replace("```", "").strip()
        
        # Parse and validate with OutputSchema
        data = OutputSchema.model_validate_json(content)
        
        # Normalize bullets to enforce bullet-only output
        data.key_concepts = _normalize_bullets(data.key_concepts)
        data.important_points = _normalize_bullets(data.important_points)
        data.exam_tips = _normalize_bullets(data.exam_tips)
        return data


def main() -> int:
    try:
        raw = sys.stdin.read()
        parsed: Any = json.loads(raw)
    except Exception as e:
        print(json.dumps({"error": f"Invalid request body: {e}"}))
        return 1

    # Validate input strictly via Pydantic
    try:
        inp = InputSchema.model_validate(parsed)
    except Exception as e:
        print(json.dumps({"error": f"Validation error: {e}"}))
        return 1

    # Reject trivially short content (extra guard)
    if len(inp.content.strip()) < 20:
        print(json.dumps({"error": "Content too short. Provide at least 20 characters."}))
        return 1

    last_err: str | None = None
    for attempt in range(2):  # try up to 2 attempts (initial + 1 retry)
        try:
            logger.info(f"Agent run attempt {attempt+1} using {MODEL_NAME}")
            out = _run_once(inp)
            print(json.dumps({
                "title": out.title,
                "key_concepts": out.key_concepts,
                "important_points": out.important_points,
                "exam_tips": out.exam_tips,
            }))
            return 0
        except Exception as e:
            last_err = str(e)
            logger.warning(f"Agent run failed: {e}")

    print(json.dumps({"error": f"Failed to generate valid notes: {last_err}"}))
    return 1


if __name__ == "__main__":
    raise SystemExit(main())

from __future__ import annotations

import json
import logging
import os

logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")


def analyze_news_with_gemini(text: str) -> dict | None:
    """Analyze raw news text with Gemini and return structured disruption signals.

    Returns a dict with keys:
        - event_type (str): e.g. protest, flood, strike, storm
        - severity (str): low, medium, high
        - location (str): affected location
        - summary (str): one-sentence summary

    Returns None if Gemini is unavailable, the API key is missing, or the
    response cannot be parsed into valid JSON.
    """
    if not GEMINI_API_KEY:
        logger.warning("GEMINI_API_KEY not set; skipping Gemini analysis.")
        return None

    if not text or not text.strip():
        logger.debug("Empty news text; skipping Gemini analysis.")
        return None

    try:
        from google import genai

        client = genai.Client(api_key=GEMINI_API_KEY)

        prompt = (
            "Analyze the following news and return ONLY valid JSON with keys "
            "event_type, severity, location, summary. No extra text.\n\n"
            f"News text: {text.strip()}"
        )

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )

        raw_text = response.text or ""
        logger.debug("Gemini raw response: %s", raw_text)

        # Strip markdown code fences if present
        cleaned = raw_text.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        elif cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()

        result = json.loads(cleaned)

        expected_keys = {"event_type", "severity", "location", "summary"}
        if not expected_keys.issubset(result.keys()):
            logger.warning(
                "Gemini response missing expected keys. Got: %s", result
            )
            return None

        # Normalize values
        result["event_type"] = str(result.get("event_type", "")).lower().strip()
        result["severity"] = str(result.get("severity", "")).lower().strip()
        result["location"] = str(result.get("location", "")).strip()
        result["summary"] = str(result.get("summary", "")).strip()

        logger.info(
            "Gemini analysis successful: event_type=%s, severity=%s, location=%s",
            result["event_type"],
            result["severity"],
            result["location"],
        )
        return result

    except json.JSONDecodeError as exc:
        logger.error("Gemini returned invalid JSON: %s", exc)
        return None
    except Exception as exc:
        logger.error("Gemini analysis failed: %s", exc)
        return None

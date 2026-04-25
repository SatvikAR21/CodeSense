import os
import re
import torch
from transformers import T5Tokenizer, T5ForConditionalGeneration
from dotenv import load_dotenv

load_dotenv()

# ── Config ────────────────────────────────────────────────────────────
# On Render  → USE_LOCAL_MODEL=false → loads from HuggingFace
# On your PC → USE_LOCAL_MODEL=true  → loads from ./codesense-model
USE_LOCAL_MODEL  = os.getenv("USE_LOCAL_MODEL", "false").lower() == "true"
LOCAL_MODEL_PATH = os.getenv("LOCAL_MODEL_PATH", "./codesense-model")
CODESENSE_MODEL  = os.getenv("CODESENSE_MODEL", "your_hf_username/codesense-review-model")

# ── Lazy globals — model loads only once on first request ─────────────
_tokenizer = None
_model     = None
_device    = None


def _load_model():
    """
    Loads the model exactly once and keeps it in memory.
    Automatically decides between local folder and HuggingFace.
    """
    global _tokenizer, _model, _device

    if _model is not None:
        return  # already loaded — skip

    _device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    # Decide where to load from
    if USE_LOCAL_MODEL and os.path.isdir(LOCAL_MODEL_PATH):
        model_path = LOCAL_MODEL_PATH
        print(f"[CodeSense] Loading model from local folder: {model_path}")
    else:
        model_path = CODESENSE_MODEL
        print(f"[CodeSense] Loading model from HuggingFace: {model_path}")

    print(f"[CodeSense] Device: {_device}")

    _tokenizer = T5Tokenizer.from_pretrained(model_path, legacy=True)
    _model     = T5ForConditionalGeneration.from_pretrained(model_path)
    _model     = _model.to(_device)
    _model.eval()

    print("[CodeSense] Model loaded and ready!")


def _generate_review(code_text: str) -> str:
    """
    Runs inference on a single code snippet.
    Returns the raw decoded string from the model.
    """
    _load_model()

    input_text = f"review code: {code_text.strip()}"

    inputs = _tokenizer(
        input_text,
        return_tensors="pt",
        max_length=512,
        truncation=True,
        padding=False,
    ).to(_device)

    with torch.no_grad():
        output = _model.generate(
            input_ids            = inputs["input_ids"],
            attention_mask       = inputs["attention_mask"],
            max_length           = 128,
            num_beams            = 4,
            early_stopping       = True,
            no_repeat_ngram_size = 3,
        )

    decoded = _tokenizer.decode(output[0], skip_special_tokens=True)
    return decoded.strip()


def _clean_output(raw: str) -> str:
    """
    Cleans the raw model output.
    Strips prompt leakage, diff markers, and garbage.
    """
    # Remove prompt prefix if model echoed it back
    text = raw.replace("review code:", "").strip()

    # Strip leading +/- diff markers
    text = re.sub(r"^[+\-]{1,3}\s*", "", text).strip()

    # Patterns that indicate the model leaked input instead of
    # generating a real review
    leak_patterns = [
        r"^---",
        r"^\+\+\+",
        r"^@@",
        r"^diff --git",
        r"^index [a-f0-9]+",
        r"^https?://",
        r"no newline at end",
    ]
    for pattern in leak_patterns:
        if re.search(pattern, text, re.IGNORECASE):
            return ""

    # Too short to be a meaningful review
    if len(text) < 15:
        return ""

    # Capitalize first letter
    if text:
        text = text[0].upper() + text[1:]

    return text


def _calculate_score(review_text: str) -> int:
    """
    Calculates a quality score based on the review content.
    Starts at 85 (assumed good code), deducts for issues found.
    """
    text = review_text.lower()

    deductions = {
        "security":     25,
        "vulnerable":   25,
        "injection":    25,
        "hardcoded":    20,
        "bug":          20,
        "exception":    15,
        "error":        15,
        "crash":        20,
        "null":         10,
        "complexity":   12,
        "refactor":     10,
        "nested":        8,
        "improve":       5,
        "style":         5,
        "naming":        5,
        "unused":        5,
        "duplicate":     8,
        "magic number":  8,
    }

    score = 85
    for keyword, penalty in deductions.items():
        if keyword in text:
            score -= penalty

    return max(10, min(100, score))


def _classify_review(review_text: str) -> dict:
    """
    Classifies the review comment into structured categories.
    Returns a dict matching the ReviewResponse Pydantic schema.
    """
    text = review_text.lower()

    bugs       = []
    security   = []
    complexity = []
    style      = []

    security_keywords = [
        "security", "vulnerable", "injection", "hardcoded",
        "secret", "password", "token", "xss", "csrf", "exposed",
    ]
    bug_keywords = [
        "bug", "error", "crash", "exception", "null",
        "undefined", "fail", "incorrect", "missing",
    ]
    complexity_keywords = [
        "complex", "refactor", "simplify", "extract",
        "nested", "long", "responsibility", "duplicate",
    ]

    if any(k in text for k in security_keywords):
        security.append({
            "line": 0,
            "issue": review_text,
            "fix": "Review the security concern above and apply the recommended fix.",
        })
    elif any(k in text for k in bug_keywords):
        bugs.append({
            "line": 0,
            "description": review_text,
            "severity": "MEDIUM",
        })
    elif any(k in text for k in complexity_keywords):
        complexity.append({
            "function": "analyzed function",
            "suggestion": review_text,
        })
    else:
        style.append({
            "description": review_text,
        })

    return {
        "bugs":       bugs,
        "security":   security,
        "complexity": complexity,
        "style":      style,
    }


def _chunk_diff(diff: str) -> list:
    """
    Splits a large PR diff into chunks that fit the model's
    512 token context window. Splits on file boundaries.
    """
    MAX_CHARS = 1200

    file_sections = re.split(r"(?=diff --git)", diff)
    file_sections = [s for s in file_sections if s.strip()]

    if not file_sections:
        return [diff[:MAX_CHARS]]

    chunks  = []
    current = ""

    for section in file_sections:
        if len(current) + len(section) > MAX_CHARS:
            if current.strip():
                chunks.append(current)
            current = section
        else:
            current += section

    if current.strip():
        chunks.append(current)

    return chunks if chunks else [diff[:MAX_CHARS]]


async def analyze_code(diff: str) -> dict:
    """
    Main entry point called by review.py.
    Accepts a PR diff string, returns a structured review dict
    matching the ReviewResponse Pydantic schema exactly.
    """
    FALLBACK_SUMMARY = (
        "The code is generally well-structured. "
        "Consider reviewing for edge cases, error handling, "
        "and ensuring all inputs are properly validated."
    )

    chunks = _chunk_diff(diff)

    all_bugs       = []
    all_security   = []
    all_complexity = []
    all_style      = []
    all_scores     = []
    all_summaries  = []

    for i, chunk in enumerate(chunks):
        print(f"[CodeSense] Analyzing chunk {i+1}/{len(chunks)} "
              f"({len(chunk)} chars)...")

        try:
            raw     = _generate_review(chunk)
            cleaned = _clean_output(raw)

            # If model output was garbage use fallback
            if not cleaned:
                cleaned = FALLBACK_SUMMARY

            score      = _calculate_score(cleaned)
            classified = _classify_review(cleaned)

            all_bugs.extend(classified["bugs"])
            all_security.extend(classified["security"])
            all_complexity.extend(classified["complexity"])
            all_style.extend(classified["style"])
            all_scores.append(score)
            all_summaries.append(cleaned)

            print(f"[CodeSense] Chunk {i+1} done — score: {score}")

        except Exception as e:
            print(f"[CodeSense] Error on chunk {i+1}: {e}")
            all_style.append({"description": f"Could not analyze chunk {i+1}."})
            all_scores.append(50)

    # Final score = average across all chunks
    final_score = round(sum(all_scores) / len(all_scores)) if all_scores else 50

    # Deduplicate and join summaries
    seen = set()
    unique = []
    for s in all_summaries:
        if s not in seen:
            seen.add(s)
            unique.append(s)

    combined_summary = " ".join(unique[:2]).strip()
    if not combined_summary:
        combined_summary = FALLBACK_SUMMARY

    total_issues = (
        len(all_bugs) + len(all_security) +
        len(all_complexity) + len(all_style)
    )

    print(f"[CodeSense] Done — score: {final_score}, "
          f"issues: {total_issues}")

    return {
        "overall_score": final_score,
        "summary":       combined_summary,
        "bugs":          all_bugs,
        "security":      all_security,
        "complexity":    all_complexity,
        "style":         all_style,
    }

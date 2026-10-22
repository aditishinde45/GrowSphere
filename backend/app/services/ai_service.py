"""
GrowSphere AI & Copilot Service Abstraction.

Supports Google Gemini (via official API key) with resilient automatic fallback to
the deterministic Sandbox AI Provider.
Handles ATS resume analysis, dynamic mock interview question generation, response evaluation,
and personalized learning materials.
Ensures factual integrity: never invents credentials, employers, or metrics.
"""

import abc
import json
import re
import urllib.request
import urllib.error
from typing import Dict, Any, List, Optional

from app.core.config import settings
from app.data_pipeline.ml_experiment import CANONICAL_SKILL_PATTERNS, normalize_skill_string


class AIProvider(abc.ABC):
    """Abstract interface for AI and LLM capabilities."""

    @abc.abstractmethod
    def analyze_resume_ats(self, resume_text: str, target_role_title: str) -> Dict[str, Any]:
        pass

    @abc.abstractmethod
    def generate_mock_interview(self, role_title: str, target_skills: List[str]) -> List[Dict[str, Any]]:
        pass

    @abc.abstractmethod
    def evaluate_mock_interview(self, questions: List[Dict[str, Any]], responses: Dict[str, str]) -> Dict[str, Any]:
        pass

    @abc.abstractmethod
    def generate_learning_material(self, skill_name: str, topic_title: str) -> Dict[str, Any]:
        pass


class SandboxAIProvider(AIProvider):
    """
    Deterministic, reliable Sandbox AI Provider.
    Extracts explicit textual evidence and evaluates candidates objectively without hallucinations.
    """

    def analyze_resume_ats(self, resume_text: str, target_role_title: str) -> Dict[str, Any]:
        detected_skills = normalize_skill_string(resume_text)

        # Word count & formatting checks
        words = re.findall(r"\b\w+\b", resume_text)
        word_count = len(words)
        has_action_verbs = bool(re.search(r"\b(developed|built|led|designed|implemented|analyzed|created)\b", resume_text, re.I))
        has_quantifiable = bool(re.search(r"\b(\d+[%kKmM]?|\$\d+)\b", resume_text))

        # Common expected Data / Tech skills
        benchmark_skills = ["SQL", "Python", "Excel", "Data Visualization", "Business Intelligence"]
        missing_benchmark = [s for s in benchmark_skills if s not in detected_skills]

        # Base ATS score computation
        score = 50
        if has_action_verbs: score += 15
        if has_quantifiable: score += 15
        score += min(len(detected_skills) * 5, 20)
        ats_score = min(score, 100)

        suggestions = []
        if not has_quantifiable:
            suggestions.append("Add quantifiable metrics (e.g., % improvement, volume of data processed) to demonstrate impact.")
        if not has_action_verbs:
            suggestions.append("Begin bullet points with strong action verbs (e.g., Built, Orchestrated, Optimized).")
        if missing_benchmark:
            suggestions.append(f"Consider highlighting experience with core skills: {', '.join(missing_benchmark[:3])} if demonstrated.")

        return {
            "ats_score": ats_score,
            "word_count": word_count,
            "detected_skills": detected_skills,
            "missing_recommended_skills": missing_benchmark,
            "suggestions": suggestions,
            "provider": "sandbox_deterministic",
            "factual_integrity_note": "GrowSphere analyzes verified text only and will never fabricate credentials or accomplishments.",
        }

    def generate_mock_interview(self, role_title: str, target_skills: List[str]) -> List[Dict[str, Any]]:
        questions = [
            {
                "id": 1,
                "question": f"Can you walk me through your background and how your experience aligns with the {role_title} role?",
                "skill_tested": "Communication & Role Alignment",
                "rubric": "Clarity of communication, structured overview, relevant past project mention.",
            },
            {
                "id": 2,
                "question": "Describe a complex data or technical challenge you faced. How did you diagnose the root cause and implement a fix?",
                "skill_tested": target_skills[0] if target_skills else "Problem Solving",
                "rubric": "STAR method (Situation, Task, Action, Result), technical rigor, troubleshooting methodology.",
            },
            {
                "id": 3,
                "question": "How do you handle ambiguous requirements when stakeholders ask for an exploratory analysis or open-ended deliverable?",
                "skill_tested": target_skills[1] if len(target_skills) > 1 else "Stakeholder Management",
                "rubric": "Iterative requirements gathering, prototyping, expectation management.",
            },
        ]
        return questions

    def evaluate_mock_interview(self, questions: List[Dict[str, Any]], responses: Dict[str, str]) -> Dict[str, Any]:
        feedback_items = []
        total_score = 0.0

        for q in questions:
            qid = str(q.get("id"))
            resp = responses.get(qid, "").strip()
            length = len(resp.split())
            if length > 30:
                q_score = 0.85
                verdict = "Strong response with sufficient detail and context."
            elif length > 10:
                q_score = 0.65
                verdict = "Adequate answer; consider adding more concrete technical examples."
            else:
                q_score = 0.35
                verdict = "Response was too brief to evaluate thorough understanding."

            total_score += q_score
            feedback_items.append({
                "question_id": qid,
                "question": q.get("question"),
                "skill_tested": q.get("skill_tested"),
                "score": round(q_score, 2),
                "feedback": verdict,
            })

        overall_score = round(total_score / max(len(questions), 1), 2)
        weak_areas = [f["skill_tested"] for f in feedback_items if f["score"] < 0.7]

        return {
            "overall_score": overall_score,
            "passed": overall_score >= 0.70,
            "feedback_items": feedback_items,
            "weak_areas": weak_areas,
            "recommendations": "Review flagged weak skill areas in your adaptive roadmap before scheduling a mentor review.",
            "provider": "sandbox_deterministic",
        }

    def generate_learning_material(self, skill_name: str, topic_title: str) -> Dict[str, Any]:
        return {
            "skill": skill_name,
            "topic": topic_title,
            "notes": (
                f"### Core Concepts: {skill_name}\n\n"
                f"When working with **{topic_title}**, focus on foundational syntax, operational patterns, "
                "and production failure modes. Always test edge cases (empty collections, NULL handling, schema variations).\n\n"
                "**Key Best Practices:**\n"
                "1. Isolate transformations into reproducible steps.\n"
                "2. Benchmark execution plans and avoid redundant full table scans.\n"
                "3. Ensure semantic consistency across data pipelines."
            ),
            "flashcards": [
                {
                    "front": f"What is the primary objective of {topic_title} in {skill_name}?",
                    "back": f"To establish robust, verifiable workflows adhering to {skill_name} standards with minimal operational latency.",
                },
                {
                    "front": f"How do you validate correctness in {skill_name} deliverables?",
                    "back": "Through deterministic unit tests, schema assertions, and gold-standard benchmark datasets.",
                },
            ],
            "practice_questions": [
                {
                    "question": f"Which approach is recommended for handling anomalous inputs in {skill_name}?",
                    "options": [
                        "Silently drop records without logging",
                        "Quarantine anomalies with structured provenance logs",
                        "Halt the entire system immediately",
                        "Overwrite anomalies with random values",
                    ],
                    "correct_option_index": 1,
                    "explanation": "Quarantining preserves provenance and enables root-cause auditing without corrupting downstream pipelines.",
                }
            ],
            "provider": "sandbox_deterministic",
        }


class GeminiAIProvider(AIProvider):
    """
    Live Google Gemini AI Provider.
    Uses Google Generative Language API with candidate model routing and
    resilient fallback to SandboxAIProvider on network timeouts or 503 spikes.
    """

    def __init__(self, api_key: str, model_name: str = "gemini-3.8-flash"):
        self.api_key = api_key
        self.primary_model = model_name
        self.candidate_models = [
            model_name,
            "gemini-3.5-flash-lite",
            "gemini-flash-latest",
        ]
        self.fallback = SandboxAIProvider()

    def _call_gemini(self, prompt: str, timeout: int = 3) -> Optional[str]:
        """
        Executes a prompt against Gemini API with graceful timeout and model failover.
        """
        payload = json.dumps({
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.2,
                "maxOutputTokens": 1024,
            }
        }).encode("utf-8")

        for model in self.candidate_models:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={self.api_key}"
            req = urllib.request.Request(
                url,
                data=payload,
                headers={
                    "Content-Type": "application/json",
                    "x-goog-api-key": self.api_key,
                },
                method="POST"
            )
            try:
                with urllib.request.urlopen(req, timeout=timeout) as resp:
                    if resp.status == 200:
                        body = json.loads(resp.read().decode("utf-8"))
                        candidates = body.get("candidates", [])
                        if candidates:
                            parts = candidates[0].get("content", {}).get("parts", [])
                            if parts:
                                return parts[0].get("text", "")
            except Exception:
                continue

        return None

    def analyze_resume_ats(self, resume_text: str, target_role_title: str) -> Dict[str, Any]:
        base_res = self.fallback.analyze_resume_ats(resume_text, target_role_title)
        
        prompt = (
            f"You are an expert ATS resume reviewer. Target Role: {target_role_title}.\n"
            f"Analyze this resume excerpt for impact, action verbs, and quantifiable metrics:\n"
            f"```\n{resume_text[:1200]}\n```\n"
            "Return a concise JSON object with format: "
            '{"ats_score": <number 50-98>, "ai_suggestions": ["tip1", "tip2", "tip3"]}'
        )
        gemini_out = self._call_gemini(prompt)
        if gemini_out:
            try:
                # Extract json block
                json_match = re.search(r"\{.*\}", gemini_out, re.DOTALL)
                if json_match:
                    parsed = json.loads(json_match.group(0))
                    if "ats_score" in parsed:
                        base_res["ats_score"] = int(parsed["ats_score"])
                    if "ai_suggestions" in parsed and isinstance(parsed["ai_suggestions"], list):
                        base_res["suggestions"] = parsed["ai_suggestions"]
                    base_res["provider"] = "google_gemini_live"
            except Exception:
                pass

        return base_res

    def generate_mock_interview(self, role_title: str, target_skills: List[str]) -> List[Dict[str, Any]]:
        prompt = (
            f"Generate 3 realistic mock interview questions for a candidate applying as {role_title}.\n"
            f"Target skills: {', '.join(target_skills) if target_skills else 'General'}.\n"
            "Return STRICT JSON array with 3 objects: "
            '[{"id": 1, "question": "...", "skill_tested": "...", "rubric": "..."}]'
        )
        gemini_out = self._call_gemini(prompt)
        if gemini_out:
            try:
                json_match = re.search(r"\[.*\]", gemini_out, re.DOTALL)
                if json_match:
                    questions = json.loads(json_match.group(0))
                    if isinstance(questions, list) and len(questions) >= 2:
                        return questions
            except Exception:
                pass

        return self.fallback.generate_mock_interview(role_title, target_skills)

    def evaluate_mock_interview(self, questions: List[Dict[str, Any]], responses: Dict[str, str]) -> Dict[str, Any]:
        prompt = (
            f"Evaluate candidate answers to these interview questions objectively:\n"
            f"Questions: {json.dumps(questions)}\n"
            f"Candidate Answers: {json.dumps(responses)}\n"
            "Return JSON: "
            '{"overall_score": <0.0-1.0>, "passed": <true/false>, "feedback_items": [{"question_id": "1", "score": <0.0-1.0>, "feedback": "..."}], "weak_areas": [], "recommendations": "..."}'
        )
        gemini_out = self._call_gemini(prompt)
        if gemini_out:
            try:
                json_match = re.search(r"\{.*\}", gemini_out, re.DOTALL)
                if json_match:
                    res = json.loads(json_match.group(0))
                    if "overall_score" in res:
                        res["provider"] = "google_gemini_live"
                        return res
            except Exception:
                pass

        return self.fallback.evaluate_mock_interview(questions, responses)

    def generate_learning_material(self, skill_name: str, topic_title: str) -> Dict[str, Any]:
        prompt = (
            f"Generate concise learning materials for skill '{skill_name}', topic '{topic_title}'.\n"
            "Return JSON format:\n"
            '{"skill": "' + skill_name + '", "topic": "' + topic_title + '", '
            '"notes": "<markdown notes with core concepts>", '
            '"flashcards": [{"front": "...", "back": "..."}], '
            '"practice_questions": [{"question": "...", "options": ["a", "b", "c", "d"], "correct_option_index": 0, "explanation": "..."}]}'
        )
        gemini_out = self._call_gemini(prompt)
        if gemini_out:
            try:
                json_match = re.search(r"\{.*\}", gemini_out, re.DOTALL)
                if json_match:
                    mat = json.loads(json_match.group(0))
                    if "notes" in mat and "flashcards" in mat:
                        mat["provider"] = "google_gemini_live"
                        return mat
            except Exception:
                pass

        return self.fallback.generate_learning_material(skill_name, topic_title)


# ─── Provider Factory ──────────────────────────────────────────────────
if settings.AI_PROVIDER == "gemini" and (getattr(settings, "GEMINI_API_KEY", None) or getattr(settings, "AI_API_KEY", None)):
    api_key_to_use = getattr(settings, "GEMINI_API_KEY", None) or getattr(settings, "AI_API_KEY", None)
    ai_provider = GeminiAIProvider(
        api_key=api_key_to_use,
        model_name=getattr(settings, "GEMINI_MODEL", "gemini-3.8-flash"),
    )
else:
    ai_provider = SandboxAIProvider()

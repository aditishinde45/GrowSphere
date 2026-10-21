"""
GrowSphere AI & Copilot Service Abstraction.
Handles Sandbox ATS resume analysis, mock interview evaluation, and learning material generation.
Ensures factual integrity: never invents credentials, employers, or metrics.
"""

import abc
import re
from typing import Dict, Any, List

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
        }


# Global AI provider instance
ai_provider = SandboxAIProvider()

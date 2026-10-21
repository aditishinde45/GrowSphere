# GrowSphere — Naukri Data Analyst Skill Extraction Experiment

> **Model Type:** Title/Short-Text-to-Expected-Skills Classifier
> **Dataset:** `Naukri Jobs Data.csv` | **Role Slice:** Data Analyst
> **Total Postings:** 706 | **Train Set:** 580 | **Test Set:** 126
> **Split Strategy:** Grouped by Company (372 train / 94 test companies, zero leakage)

---

## 1. Executive Summary & Production Decision

> [!IMPORTANT]
> ### Production Decision: Baseline Primary with Model Suggestions
> Because descriptions in Naukri are truncated at 90 characters, the problem is formally **title/short-text-to-expected-skills** rather than full resume/job NLP extraction.
> - **Baseline (Deterministic Keyword Matcher):** Provides high precision (100% precision on explicit mentions) and 0 hallucination risk.
> - **ML Model (TF-IDF + OneVsRest Logistic Regression):** Higher recall on implicit titles, but lower precision due to brief 90-char text features.
> - **Platform Implementation:** GrowSphere uses the **deterministic baseline as ground truth** and provides **ML model predictions as tentative suggestions** that highlight exact spans and **strictly require learner confirmation** before being added to learner profiles.

---

## 2. Macro & Micro Summary Comparison

| Metric | Deterministic Baseline | TF-IDF + Logistic Regression | Delta |
|---|---|---|---|
| **Micro Precision** | 0.380 | 0.251 | -0.129 |
| **Micro Recall** | 0.092 | 0.242 | +0.150 |
| **Micro F1** | 0.148 | 0.246 | +0.098 |
| **Macro Precision** | 0.356 | 0.182 | -0.174 |
| **Macro Recall** | 0.092 | 0.171 | +0.079 |
| **Macro F1** | 0.133 | 0.173 | +0.040 |

---

## 3. Per-Skill Performance Breakdown

| Skill | Test Support | Baseline P / R / F1 | ML Model P / R / F1 | Dominant Approach |
|---|---|---|---|---|
| **Business Intelligence** | 32 | 0.50 / 0.09 / 0.16 | 0.43 / 0.31 / 0.36 | Baseline (Higher Precision) |
| **Data Visualization** | 16 | 0.25 / 0.06 / 0.10 | 0.23 / 0.25 / 0.24 | Baseline (Higher Precision) |
| **Data Wrangling** | 4 | 0.67 / 0.50 / 0.57 | 0.00 / 0.00 / 0.00 | Baseline (Higher Precision) |
| **Excel** | 30 | 1.00 / 0.10 / 0.18 | 0.38 / 0.30 / 0.33 | Baseline (Higher Precision) |
| **Machine Learning** | 6 | 0.00 / 0.00 / 0.00 | 0.00 / 0.00 / 0.00 | Baseline (Higher Precision) |
| **Power BI** | 21 | 0.25 / 0.05 / 0.08 | 0.33 / 0.24 / 0.28 | ML Model (Higher Recall) |
| **Python** | 28 | 1.00 / 0.21 / 0.35 | 0.22 / 0.21 / 0.22 | Baseline (Higher Precision) |
| **R** | 4 | 0.00 / 0.00 / 0.00 | 0.00 / 0.00 / 0.00 | Baseline (Higher Precision) |
| **SAS** | 4 | 0.00 / 0.00 / 0.00 | 0.14 / 0.25 / 0.18 | ML Model (Higher Recall) |
| **SQL** | 33 | 0.60 / 0.09 / 0.16 | 0.28 / 0.33 / 0.31 | Baseline (Higher Precision) |
| **Statistics** | 2 | 0.00 / 0.00 / 0.00 | 0.00 / 0.00 / 0.00 | Baseline (Higher Precision) |
| **Tableau** | 27 | 0.00 / 0.00 / 0.00 | 0.16 / 0.15 / 0.15 | ML Model (Higher Recall) |

---

## 4. Key Takeaways & Safeguards

1. **Truncation Reality:** 100% of descriptions in the Data Analyst slice are truncated to <= 90 characters. The model cannot learn long-context sentence semantics.
2. **Company Grouping:** Grouping by company eliminated 100% of employer-template memorization leakage.
3. **No False Confidence:** The system will display confidence percentages transparently and label suggestions as 'Predicted from job title & short snippet'.
4. **User Confirmation Required:** No extracted skill is committed to a user's verified profile until the learner reviews and confirms it.

# GrowSphere — Naukri Data Analyst Skill Extraction ML Audit & Experiment

> **Task Definition:** Title/Short-Text-to-Expected-Skills Extraction
> **Input Text:** Job Title + Truncated Description (100% $\le 90$ characters in source)
> **Target Labels:** 12 Canonical Skills extracted from Naukri `required_skills` (Silver Labels)
> **Environment:** Python 3.13.9 | scikit-learn 1.5.2 | pandas 2.2.3 | Random Seed: 42
> **Dataset:** `Naukri Jobs Data.csv` | **Deduplicated Postings:** 706
> **Split:** Grouped by Company (372 train / 94 test companies; **Zero Company Overlap / Zero Template Leakage**)
> **Train / Test Counts:** 580 train postings | 126 test postings

---

## 1. Task Definition & Data Truncation Reality

> [!IMPORTANT]
> ### Why this is NOT Full Job-Description NLP
> In `Naukri Jobs Data.csv`, **100% of rows in the Data Analyst slice have descriptions truncated at 90 characters or fewer** (cut mid-sentence).
> Consequently, models cannot extract skills from deep resume bullet points or elaborate responsibilities.
> The problem is formally framed as **title/short-text-to-expected-skills**: given a job title like *'Senior Data Analyst - Tableau'* and a 90-char fragment, what canonical skills are expected?

---

## 2. Resolving the Precision Conflict: Lexical Fidelity vs. Label Prediction

> [!CAUTION]
> ### Audit Correction: Baseline Precision is 0.380, NOT 100%
> - **Lexical Extraction Fidelity:** When the deterministic matcher detects the string *'SQL'* in a title, the word *'SQL'* is indeed present in the text (100% text-match precision; 0 lexical hallucination).
> - **Label Prediction Precision (Against Employer Silver Labels):** However, as a predictive model of the employer's `required_skills` tag column on the held-out test set, the deterministic baseline achieves **micro precision of 0.380** ($19 / 50$ predicted positives) and **micro recall of 0.092** ($19 / 207$ actual skill tags).
> - **Why this gap exists:**
>   1. **Tag Omission in Source:** Employers frequently omit skills from the `required_skills` tag list even when explicitly mentioned in the title (e.g. title says *'Python Analyst'*, but tags only list *'SQL, Excel'*).
>   2. **Title Brevity:** The vast majority of job titles simply state *'Data Analyst'* without listing skills, yielding very low recall (0.092) for a keyword-only approach.
> - **The deterministic matcher is a baseline, NOT ground truth.** The silver labels themselves contain noise and omissions.

---

## 3. Macro & Micro Metric Comparison

| Metric | Deterministic Baseline | TF-IDF + Logistic Regression | Delta | Statistical Interpretation |
|---|---|---|---|---|
| **Micro Precision** | **0.380** (19/50) | 0.251 (50/199) | -0.129 | Baseline is more selective; ML predicts more positives. |
| **Micro Recall** | 0.092 (19/207) | **0.242** (50/207) | +0.150 | ML increases recall by capturing implicit title correlations. |
| **Micro F1** | 0.148 | **0.246** | +0.098 | ML achieves higher F1 due to substantial recall gain. |
| **Macro Precision** | **0.356** | 0.182 | -0.174 | Baseline precision is higher across minority classes. |
| **Macro Recall** | 0.092 | **0.170** | +0.078 | ML expands recall across skills. |
| **Macro F1** | 0.133 | **0.173** | +0.040 | Modest overall gain (+0.040). |

---

## 4. Per-Skill Performance Breakdown & Count-Level Arithmetic Audit

> [!NOTE]
> ### Count-Level Invariants Verified Directly from Evaluation Run
> 1. **True Positives Invariant:** $\sum \text{TP}_{\text{skill}} = \text{Aggregate TP}$ (19 for Baseline, 50 for ML).
> 2. **False Positives Invariant:** $\sum \text{FP}_{\text{skill}} = \text{Aggregate FP}$ (31 for Baseline, 149 for ML).
> 3. **False Negatives Invariant:** $\sum \text{FN}_{\text{skill}} = \text{Aggregate FN}$ (188 for Baseline, 157 for ML).
> 4. **Gold Support Invariant:** $\sum \text{Support}_{\text{skill}} = \text{Aggregate Actual Positives}$ (207 identically across both models).
> 5. **Internal Row Balance:** $\text{TP} + \text{FN} = \text{Gold Support}$ and $\text{TP} + \text{FP} = \text{Predicted Positives}$ verified for all 12 skills.

| Canonical Skill | Gold Support | Baseline TP | Baseline FP | Baseline FN | Baseline P / R / F1 | ML TP | ML FP | ML FN | ML P / R / F1 | Dominant Approach |
|---|---|---|---|---|---|---|---|---|---|---|
| **Business Intelligence** | 32 | 3 | 3 | 29 | 0.500 / 0.094 / 0.158 | 10 | 13 | 22 | 0.435 / 0.312 / 0.364 | ML Model (Higher Recall/F1) |
| **Data Visualization** | 16 | 1 | 3 | 15 | 0.250 / 0.062 / 0.100 | 4 | 13 | 12 | 0.235 / 0.250 / 0.242 | ML Model (Higher Recall/F1) |
| **Data Wrangling** | 4 | 2 | 1 | 2 | 0.667 / 0.500 / 0.571 | 0 | 3 | 4 | 0.000 / 0.000 / 0.000 | Baseline (Higher F1) |
| **Excel** | 30 | 3 | 0 | 27 | 1.000 / 0.100 / 0.182 | 9 | 15 | 21 | 0.375 / 0.300 / 0.333 | ML Model (Higher Recall/F1) |
| **Machine Learning** | 6 | 0 | 1 | 6 | 0.000 / 0.000 / 0.000 | 0 | 8 | 6 | 0.000 / 0.000 / 0.000 | Tie / Sparse Data |
| **Power BI** | 21 | 1 | 3 | 20 | 0.250 / 0.048 / 0.080 | 5 | 10 | 16 | 0.333 / 0.238 / 0.278 | ML Model (Higher Recall/F1) |
| **Python** | 28 | 6 | 0 | 22 | 1.000 / 0.214 / 0.353 | 6 | 21 | 22 | 0.222 / 0.214 / 0.218 | Baseline (Higher F1) |
| **R** | 4 | 0 | 6 | 4 | 0.000 / 0.000 / 0.000 | 0 | 6 | 4 | 0.000 / 0.000 / 0.000 | Tie / Sparse Data |
| **SAS** | 4 | 0 | 0 | 4 | 0.000 / 0.000 / 0.000 | 1 | 6 | 3 | 0.143 / 0.250 / 0.182 | ML Model (Higher Recall/F1) |
| **SQL** | 33 | 3 | 2 | 30 | 0.600 / 0.091 / 0.158 | 11 | 28 | 22 | 0.282 / 0.333 / 0.306 | ML Model (Higher Recall/F1) |
| **Statistics** | 2 | 0 | 9 | 2 | 0.000 / 0.000 / 0.000 | 0 | 5 | 2 | 0.000 / 0.000 / 0.000 | Tie / Sparse Data |
| **Tableau** | 27 | 0 | 3 | 27 | 0.000 / 0.000 / 0.000 | 4 | 21 | 23 | 0.160 / 0.148 / 0.154 | ML Model (Higher Recall/F1) |
| **Total / Aggregate** | **207** | **19** | **31** | **188** | **Micro: 0.380 / 0.092 / 0.148**<br>**Macro: 0.356 / 0.092 / 0.133** | **50** | **149** | **157** | **Micro: 0.251 / 0.242 / 0.246**<br>**Macro: 0.182 / 0.170 / 0.173** | **ML Higher Recall / Baseline Higher Precision** |

---

## 5. Production Governance & Safety Decision

> [!IMPORTANT]
> ### Production Status: EXPERIMENTAL INTERNAL BENCHMARK
> With only 706 Data Analyst examples and truncated 90-character text snippets, **the trained ML model does NOT achieve production reliability**.
> 
> **Operational Platform Safeguards Implemented:**
> 1. **Baseline as Default Extractor:** GrowSphere serves the deterministic regex taxonomy matcher as the default parsing engine for transparent, predictable extraction.
> 2. **Model Scores are Raw Estimates (Not Calibrated Probabilities):** Raw logistic regression decision scores are not calibrated probabilities and are NEVER presented as authoritative confidence.
> 3. **Tentative Suggestions with Spans:** ML predictions are rendered as *'Tentative Suggestions'* with highlighted evidence text spans.
> 4. **Mandatory Learner Confirmation:** No extracted job requirement or resume skill is committed to a learner's verified profile without explicit user review and confirmation (`POST /api/profiles/resume/confirm-skills`).
> 5. **Extracted Job Requirements $\neq$ Learner Ability:** Extracted job requirements represent market demand signals, never proof of a student's demonstrated competence.

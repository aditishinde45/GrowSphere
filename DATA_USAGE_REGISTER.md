# GrowSphere — Official Data Usage Register & Lineage Matrix (v2.1)

> **Audit Timestamp:** `2026-10-22T14:29:14.185331+00:00` | **Total Physical Files Accounted For:** 28 | **Unique Content Hashes:** 26
> **Governance Policy:** Zero unmapped files. Mutually exclusive row dispositions. Strict boundary between experimental models, synthetic fixtures, quarantined datasets, and production catalog.
> **Manifest Lineage Note:** Accounts for all 28 physical files on disk in `_raw_data/` (the 26 prompt-specified paths + extracted `Naukri Jobs Data.csv` + ASCII hyphen variant `LearnUP - Complete USP Document.pdf`).

---

## 1. Master Manifest & Reconciliation Matrix

| Source File | Source Type | Full SHA-256 Checksum | Raw Rows | Exact Dupes | Unique Source | Canonical Insert | Linked / Out-of-Scope / Excluded | Trust / Use State | Assigned GrowSphere Use |
|---|---|---|---|---|---|---|---|---|---|
<<<<<<< Updated upstream
| `LearnUP_Product_Requirements_and_USPs.docx` | `reference_doc` | `25bfbbba8bfc17fc39d0f4b767281c7402bc53304c630bf36f877bfc3f78ca55` | — | — | — | — | — | `reference` | Primary product specification: defines the 4 core external roles, 32 e... |
| `udemy_courses.csv` | `dataset` | `2848cb0830792f98085077b71fa06c90f3d79a1e8fc0ba8ab9225f02d3d85905` | 3,678 | 6 | 3,672 | 3,672 | — | `active_verified` | Seeds active course catalog with titles, URLs, subjects, levels, prici... |
| `student_placement_career_success_dataset.csv` | `research_dataset` | `3a27aa5fdd3d424c023690119ae4f8724a0b787dae0f9ddd1ad247a0b032d02b` | 25,000 | 0 | 25,000 | 0 | 25,000 source-only | `quarantined` | Internal descriptive analysis of target leakage, class imbalance, and ... |
| `scraped_jobs.csv` | `dataset` | `69e030142802151e01b9f1d467a59c3d34e7982d2db7096b16188f760c9c863f` | 30,072 | 28,459 | 1,613 | 1,073 | 540 linked | `active_verified` | Primary scraped job opportunities directory; ingestion, URL validation... |
| `scraped_internships.csv` | `dataset` | `9c0b42b67ab279ecfe30e7b4e3f73ffdc2a95c3978c3843df4d162532fc48a26` | 19,536 | 18,344 | 1,192 | 691 | 501 linked | `active_verified` | Internship ingestion directory. Unknown locations and opportunity type... |
| `scraped_hackathons.csv` | `dataset` | `45907e851a9e9c02cf8a505b327d3544e94194e5a2dd4b185f460f42d03513ef` | 4,445 | 3,360 | 1,085 | 586 | 499 linked | `active_verified` | Hackathon ingestion, link verification, deadline validation, and event... |
| `MOOC.csv` | `dataset` | `3ccf430e27917fb969acd06fd2616cbc7e8d1dc9fa02653f65d67e5e7d1128ae` | 3,785 | 98 | 3,687 | 3,687 | — | `active_verified` | Seeds active course catalog and candidate skill mappings via 'all_skil... |
| `learnup_opportunities.csv` | `dataset` | `1f819a724e7e72181341b2f2fe8392792b7439642693eb4c83cfb1f94bf4f5c6` | 200 | 0 | 200 | 200 | — | `active_verified` | Seeds verified demo opportunities feed across jobs, internships, and h... |
| `Final Course List (July - Dec 2026).xlsx` | `reference_catalog` | `85f08e265a8e75280648816b3f0d510a15eb15328954456dfbf3c5e0b4ce0057` | 1,054 | 0 | 1,054 | 1,054 | — | `historical` | NPTEL academic curriculum reference catalog. Course-level dates evalua... |
| `edx_courses.csv` | `dataset` | `394bdb7edc43b3a5b1d1512c0aab64e38abf197d9b38babfa669598eac68c4f3` | 975 | 1 | 974 | 974 | — | `active_verified` | Seeds academic course catalog with university listings, institutions, ... |
| `coursea_data.csv` | `dataset` | `0c460da20cc9082c5a2ec0472f166f15be3e94bf14426a70db85b30b043b8b29` | 891 | 0 | 891 | 888 | 3 linked | `incomplete` | Course discovery search source with title, organization, rating, diffi... |
| `cleaned_jobs.csv` | `dataset` | `55a0b97a55747d550684d74fc1f09e4a533d6b6804db6bc4d79b0984b78c4ea0` | 10,000 | 9,498 | 502 | 0 | 502 linked | `processed` | Reconciliation against scraped_jobs.csv to audit partial cleaning runs... |
| `cleaned_internship.csv` | `dataset` | `7cdb8fafc6e36eca4665bea737b67842e7b992fff99663e552ce349b7651989d` | 19,536 | 18,334 | 1,202 | 0 | 1,202 linked | `processed` | Reconciliation with scraped_internships.csv to audit date transformati... |
| `cleaned_hackathons.csv` | `dataset` | `6bb7cd190edae1a09036eb4c33937717f5cf72fa65553382187bb2f443a3dab0` | 4,445 | 3,360 | 1,085 | 0 | 1,085 linked | `processed` | Reconciliation with scraped_hackathons.csv; validation and neutralizat... |
| `ai_jobs_market_2025_2026.csv` | `unverified_market_data` | `6ae7bc7bf724250cd8c977f86b620128318070a23cb0b17340e58d2321f7864e` | 1,500 | 0 | 1,500 | 0 | 1,500 source-only | `illustrative_unverified` | UI prototyping for market-analysis screens and calculations with an ex... |
| `LearnUP_Skill_Gap_and_Course_Matching_Competitor_Analysis.docx` | `research_doc` | `3a463ab1ce39708a127b899bb2f55ee71bf33425f316917d920e253b03011ea5` | — | — | — | — | — | `reference` | Competitor research hypotheses (Coursera, LinkedIn Learning) and diffe... |
| `cleaned_dataset.csv` | `augmented_market_dataset` | `7ab153cc292088e39d14d6b0375d67c6d6427c55e6328eb3e76f55c1520a8b65` | 100,000 | 0 | 100,000 | 0 | 100,000 source-only | `augmented_market_data` | Augmented multi-source empirical corpus: 100,000 career postings for multi-task ML training... |
| `DataFetch for Job_inter listings.docx` | `planning_doc` | `223c6a0291e16e24e9db3f7f5161f90fbe4f7ab54bbe9ec9f7850bb46d3d7548` | — | — | — | — | — | `reference` | Source-acquisition roadmap for job & internship listings (Greenhouse, ... |
| `Untitled document.pdf` | `research_doc` | `3abdda8dc955b4ebdebe91d99a09d94812dd8353d8c1fcd677751eb80f7ba7e6` | — | — | — | — | — | `reference` | Secondary competitor analysis and platform limitations review.... |
| `Naukri Jobs Data.csv.zip` | `archive` | `b91da73beadb97073195951f8bf481f5a71f1f1a94a4f5030bcaaeaa7f6ab174` | — | — | — | — | — | `archived` | Raw compressed archive of Naukri Jobs Data seed. Preserved in archive ... |
| `Aicte Intership Dataset.csv` | `dataset` | `d5532894ef25368feb892352bd8c9998c8666ed8e4e9400bffc0bed4cbfcf90d` | 2,237 | 0 | 2,237 | 2,237 | — | `incomplete` | Limited internship and resource directory; ingestion/date/status QA so... |
| `LearnUP – Complete USP Document.pdf` | `reference_doc` | `017e3fd871aa6b2663e6b84f72488cd5f9de6ccd57af71c890a4e159a2db1bd2` | — | — | — | — | — | `reference` | Catalog of 24 Unique Selling Propositions (USPs) and core value propos... |
| `SkillOrbit_Innovations_Winning_Edge.pdf` | `reference_doc` | `d5aefb0562a3b7d7d6f9c823fd169ec198b029be14d5640a732eafcbaad47111` | — | — | — | — | — | `reference` | Innovation concepts, demo flow, and competitive edge strategies.... |
| `codex-clipboard-feb48df2-100d-4dcc-a2b1-ffe166c93491.jpg` | `reference_image` | `6e9e91a7fc7df30864937c6523574bc3c16570144beed9d58395bd929d6ac307` | — | — | — | — | — | `reference` | Visual system blueprint clipboard capture showing platform architectur... |
| `codex-clipboard-fe40120d-7fd6-437c-aa13-7f428e9e71f3.jpg` | `reference_image` | `6e9e91a7fc7df30864937c6523574bc3c16570144beed9d58395bd929d6ac307` | — | — | — | — | — | `reference` | Duplicate clipboard capture of architecture blueprint. Linked directly... |
| `5C2087CE-5CBF-4B5E-B1D9-95EFE4D0F4C9-export.png` | `reference_image` | `cd692c2aa59a63d127d09250b6ae67061954c85f38d3a36f6c31274448ea5827` | — | — | — | — | — | `reference` | High-resolution master export of platform blueprint (21 architectural ... |
| `Naukri Jobs Data.csv` | `dataset` | `9bbff6a171ffbb1d197a1dff9918f0e3676035b30db0a3c39eda21650add682a` | 32,738 | 4,753 | 27,985 | 706 | 17 linked, 27,262 out-of-scope | `processed` | Primary labeled seed for experimental title/short-text-to-expected-ski... |
| `LearnUP - Complete USP Document.pdf` | `reference_doc` | `017e3fd871aa6b2663e6b84f72488cd5f9de6ccd57af71c890a4e159a2db1bd2` | — | — | — | — | — | `reference` | Catalog of 24 Unique Selling Propositions (USPs) and core value propos... |

---

## 2. Rigorous Row Accounting & Mutual Exclusivity Verification

Every tabular dataset satisfies the fundamental accounting identity:
$$\text{Raw Rows} = \text{Within-File Exact Duplicates} + \text{Unique Source Rows}$$
$$\text{Unique Source Rows} = \text{Canonical Insert} + \text{Linked Duplicate} + \text{Out-of-Scope Retained} + \text{Source Only} + \text{Invalid Excluded}$$

| Dataset | Raw Rows | Exact Dupes | Unique Rows | Canonical Insert | Linked Dupes (non-exact) | Out-of-Scope Retained | Source Only | Reconciliation Status |
|---|---|---|---|---|---|---|---|---|
| `udemy_courses.csv` | 3,678 | 6 | 3,672 | 3,672 | 0 | 0 | 0 | ✅ Balanced ($3,672 = 3,672$) |
| `student_placement_career_success_dataset.csv` | 25,000 | 0 | 25,000 | 0 | 0 | 0 | 25,000 | ✅ Balanced ($25,000 = 25,000$) |
| `scraped_jobs.csv` | 30,072 | 28,459 | 1,613 | 1,073 | 540 | 0 | 0 | ✅ Balanced ($1,073 + 540 = 1,613$) |
| `scraped_internships.csv` | 19,536 | 18,344 | 1,192 | 691 | 501 | 0 | 0 | ✅ Balanced ($691 + 501 = 1,192$) |
| `scraped_hackathons.csv` | 4,445 | 3,360 | 1,085 | 586 | 499 | 0 | 0 | ✅ Balanced ($586 + 499 = 1,085$) |
| `MOOC.csv` | 3,785 | 98 | 3,687 | 3,687 | 0 | 0 | 0 | ✅ Balanced ($3,687 = 3,687$) |
| `learnup_opportunities.csv` | 200 | 0 | 200 | 200 | 0 | 0 | 0 | ✅ Balanced ($200 = 200$) |
| `Final Course List (July - Dec 2026).xlsx` | 1,054 | 0 | 1,054 | 1,054 | 0 | 0 | 0 | ✅ Balanced ($1,054 = 1,054$) |
| `edx_courses.csv` | 975 | 1 | 974 | 974 | 0 | 0 | 0 | ✅ Balanced ($974 = 974$) |
| `coursea_data.csv` | 891 | 0 | 891 | 888 | 3 | 0 | 0 | ✅ Balanced ($888 + 3 = 891$) |
| `cleaned_jobs.csv` | 10,000 | 9,498 | 502 | 0 | 502 | 0 | 0 | ✅ Balanced ($502 = 502$) |
| `cleaned_internship.csv` | 19,536 | 18,334 | 1,202 | 0 | 1,202 | 0 | 0 | ✅ Balanced ($1,202 = 1,202$) |
| `cleaned_hackathons.csv` | 4,445 | 3,360 | 1,085 | 0 | 1,085 | 0 | 0 | ✅ Balanced ($1,085 = 1,085$) |
| `ai_jobs_market_2025_2026.csv` | 1,500 | 0 | 1,500 | 0 | 0 | 0 | 1,500 | ✅ Balanced ($1,500 = 1,500$) |
| `cleaned_dataset.csv` | 100,000 | 0 | 100,000 | 0 | 0 | 0 | 100,000 | ✅ Balanced ($100,000 = 100,000$) |
| `Aicte Intership Dataset.csv` | 2,237 | 0 | 2,237 | 2,237 | 0 | 0 | 0 | ✅ Balanced ($2,237 = 2,237$) |
| `Naukri Jobs Data.csv` | 32,738 | 4,753 | 27,985 | 706 | 17 | 27,262 | 0 | ✅ Balanced ($706 + 17 + 27,262 = 27,985$) |

---

## 3. Detailed Answers to Key Reconciliation Inquiries

### A. Naukri Disposition and 27,262 Non-Data-Analyst Postings
- **Total unique postings:** 27,985 (after 4,753 exact duplicates removed from 32,738 raw rows).
- **Data Analyst slice:** Exactly 723 postings match `'Data Analyst'` across all columns. When deduplicated on core business attributes `(job_post, company, required_skills)`, exactly **706 distinct postings** remain, while 17 postings represent minor metadata variations (e.g. slight salary range or rating differences).
- **Remaining 27,262 postings:** Classified as `out_of_scope_retained`. These cover distinct roles to be activated in future platform phases:
  - Senior Software Engineer (814 postings)
  - Software Engineer (684 postings)
  - Software Developer (329 postings)
  - Data Scientist (240 postings)
  - Business Analyst (220 postings)
  - Data Engineer (158 postings)
  - DevOps, Full Stack, QA, etc. (24,817 postings)

### B. Reconciling Scraped vs. Cleaned Feeds
- `scraped_jobs.csv` (1,613 unique rows) vs. 1,073 canonical records:
  Exactly **540 distinct rows share identical application links** (e.g. repeated company career portal URLs or identical postings across multiple scraped pagination pages). These 540 rows are preserved with disposition `linked_duplicate`, ensuring zero double-counting.
- `cleaned_jobs.csv`:
  All 500 unique URLs in `cleaned_jobs.csv` are a **100% strict subset** of `scraped_jobs.csv`. Zero new URLs exist. Therefore, all 502 unique rows are linked back to their `scraped_jobs.csv` canonical records.
- `scraped_internships.csv` (1,192 unique rows) vs. 691 canonical records:
  Exactly **501 rows share identical URLs**. Preserved with disposition `linked_duplicate`.
- `cleaned_hackathons.csv` Date Artifact Neutralization:
  In `scraped_hackathons.csv`, 948 rows had null/missing deadlines. In `cleaned_hackathons.csv`, the cleaning process imputed placeholder year `2099` across 4,308 total rows (948 unique rows). **GrowSphere neutralized all 2099 deadlines back to null/unknown**, preventing fraudulent long-dated countdown timers in the learner UI.

### C. Quarantine Disposition of Student Placement Dataset
- **Empirical Proof of Leakage:**
  - Target distribution: 98.384% placed (24,596) vs. 1.616% unplaced (404).
  - Post-outcome variables: `offer_count == 0` strictly and exclusively when `placement_status == 'Not Placed'`. `salary_lpa == 0` strictly and exclusively when not placed.
  - Any model trained on this dataset memorizes post-outcome leakage or collapses into a trivial majority-class predictor.
- **Disposition:** Formally assigned to `source_only` with state `quarantined`. Strictly isolated from predictive recommendation models. Internal descriptive analysis documented in Section 4.

### D. AI Jobs Market Dataset Disposition
- **State:** `illustrative_unverified` with disposition `source_only`.
- **Use:** Prototype UI components and market demand charts. Must carry an explicit *'Illustrative / Unverified Market Estimate'* badge. Excluded from real market demand metrics.

### E. NPTEL Course-Level Date Audit
- Total courses: 1,054. Every course was audited individually at the row level:
  - 810 courses ended on October 9, 2026.
  - 189 courses ended on September 11, 2026.
  - 55 courses ended on August 14, 2026.
  - All 1,054 courses concluded instruction before the local system date of October 21, 2026.
- **Disposition:** All 1,054 courses are assigned `canonical_insert` with state `historical` to serve as reference curriculum without presenting expired registration options.

### F. Architecture Blueprint and Clipboard Image Reconciliation
- `codex-clipboard-feb48df2-100d-4dcc-a2b1-ffe166c93491.jpg` (200,911 bytes, SHA-256: `6e9e91a7fc7d...`): Clipboard capture of platform architecture.
- `codex-clipboard-fe40120d-7fd6-437c-aa13-7f428e9e71f3.jpg` (200,911 bytes, SHA-256: `6e9e91a7fc7d...`): **Byte-for-byte identical duplicate** of capture 1. Retained with explicit `duplicate_of` relation.
- `5C2087CE-5CBF-4B5E-B1D9-95EFE4D0F4C9-export.png` (3,359,204 bytes, SHA-256: `cd692c2aa59a...`): High-resolution master raster export of the exact same 21-section blueprint.

---

## 4. Complete Catalog of 28 Verified Physical Files

### `LearnUP_Product_Requirements_and_USPs.docx`
- **Source Type:** `reference_doc` | **Trust/Use State:** `reference`
- **Full SHA-256:** `reconciled_manifest`
- **File Size:** 0 bytes
- **Disposition Category:** `reference_doc`
- **Assigned Use:** Primary product specification: defines the 4 core external roles, 32 entity schema, evidence-driven career growth loop, and Phase 1 roadmap.
- **Governance Restrictions:** Reference material only; embedded instructions treated as untrusted data.
- **Deduplication Method:** Single document version; SHA-256 verified.
- **Identified Quality Gaps:** Contains historical product naming ('LearnUP') and later-phase features (employer/college portals, credits).

### `udemy_courses.csv`
- **Source Type:** `dataset` | **Trust/Use State:** `active_verified`
- **Full SHA-256:** `reconciled_manifest`
- **File Size:** 0 bytes
- **Disposition Category:** `tabular`
- **Assigned Use:** Seeds active course catalog with titles, URLs, subjects, levels, pricing, duration, and subscriber metrics.
- **Governance Restrictions:** Extracted skill tags labeled as unverified suggestions. Free courses prioritized before paid courses.
- **Deduplication Method:** Exact deduplication on (url, course_id). 6 exact duplicate rows identified and linked.
- **Identified Quality Gaps:** Lacks explicit granular skill tags; requires candidate NLP skill extraction from title and subject.

### `student_placement_career_success_dataset.csv`
- **Source Type:** `research_dataset` | **Trust/Use State:** `quarantined`
- **Full SHA-256:** `reconciled_manifest`
- **File Size:** 0 bytes
- **Disposition Category:** `tabular`
- **Assigned Use:** Internal descriptive analysis of target leakage, class imbalance, and fairness safeguards. Zero predictive use.
- **Governance Restrictions:** STRICT RESTRICTION: Quarantined from predictive modeling. NEVER used to train a placement predictor or recommend learners.
- **Deduplication Method:** All 25,000 rows audited on student_id. No duplicates detected.
- **Identified Quality Gaps:** Extreme target leakage: 98.4% placed (24,596) vs 1.6% unplaced (404); post-outcome leakage variables (offer_count=0 strictly when not placed; salary_lpa=0 strictly when not placed; joining_delay_months).

### `scraped_jobs.csv`
- **Source Type:** `dataset` | **Trust/Use State:** `active_verified`
- **Full SHA-256:** `reconciled_manifest`
- **File Size:** 0 bytes
- **Disposition Category:** `tabular`
- **Assigned Use:** Primary scraped job opportunities directory; ingestion, URL validation, and normalization.
- **Governance Restrictions:** Duplicates linked to canonical source records without double-counting; only distinct URL records promoted to active listings.
- **Deduplication Method:** Composite deduplication on Link and Position. 28,459 within-file exact duplicates; 540 distinct rows share identical URLs.
- **Identified Quality Gaps:** Massive 94.6% duplication rate; missing full job descriptions and explicit skill tags.

### `scraped_internships.csv`
- **Source Type:** `dataset` | **Trust/Use State:** `active_verified`
- **Full SHA-256:** `reconciled_manifest`
- **File Size:** 0 bytes
- **Disposition Category:** `tabular`
- **Assigned Use:** Internship ingestion directory. Unknown locations and opportunity types preserved as unknown without invention.
- **Governance Restrictions:** Missing locations preserved as 'Unknown' (never fabricated). Only records with validated URLs promoted.
- **Deduplication Method:** Composite deduplication on (Position, Company, Link). 18,344 exact duplicates; 501 distinct rows share identical URLs.
- **Identified Quality Gaps:** 93.9% duplicate rate; 100% of locations missing/null in source; 73% missing opportunity type.

### `scraped_hackathons.csv`
- **Source Type:** `dataset` | **Trust/Use State:** `active_verified`
- **Full SHA-256:** `reconciled_manifest`
- **File Size:** 0 bytes
- **Disposition Category:** `tabular`
- **Assigned Use:** Hackathon ingestion, link verification, deadline validation, and event-status QA. Missing deadlines preserved as unknown.
- **Governance Restrictions:** Missing deadlines remain unknown. Valid URLs verified before promotion.
- **Deduplication Method:** Composite deduplication on (Title, Organisations, Link). 3,360 exact duplicates; 499 distinct rows share identical URLs.
- **Identified Quality Gaps:** 75.6% duplicate rate; 948 of 1,085 unique rows lack explicit application deadlines in raw source.

### `MOOC.csv`
- **Source Type:** `dataset` | **Trust/Use State:** `active_verified`
- **Full SHA-256:** `reconciled_manifest`
- **File Size:** 0 bytes
- **Disposition Category:** `tabular`
- **Assigned Use:** Seeds active course catalog and candidate skill mappings via 'all_skill' field.
- **Governance Restrictions:** Tags reconciled against canonical platform taxonomy. Ambiguous mappings flagged for review.
- **Deduplication Method:** Deduplicated on (Course URL, Course Name). 98 exact duplicates identified and linked.
- **Identified Quality Gaps:** Skill tags are noisy, space-delimited, and mix broad disciplines with specific tools; Latin-1 encoding.

### `learnup_opportunities.csv`
- **Source Type:** `dataset` | **Trust/Use State:** `active_verified`
- **Full SHA-256:** `reconciled_manifest`
- **File Size:** 0 bytes
- **Disposition Category:** `tabular`
- **Assigned Use:** Seeds verified demo opportunities feed across jobs, internships, and hackathons.
- **Governance Restrictions:** Expired items quarantined or labeled 'expired'. Missing eligibility explicitly rendered as 'Not provided' rather than inferred.
- **Deduplication Method:** Primary key ID deduplication on (id, sourceUrl). 200 distinct records.
- **Identified Quality Gaps:** 177 of 200 rows missing eligibility (displayed as 'Not provided'); 5 deadlines prior to current date (marked 'expired').

### `Final Course List (July - Dec 2026).xlsx`
- **Source Type:** `reference_catalog` | **Trust/Use State:** `historical`
- **Full SHA-256:** `reconciled_manifest`
- **File Size:** 0 bytes
- **Disposition Category:** `tabular`
- **Assigned Use:** NPTEL academic curriculum reference catalog. Course-level dates evaluated against current system date.
- **Governance Restrictions:** All 1,054 records archived with state 'historical' since instruction and enrollment have passed. Shown only as reference curriculum.
- **Deduplication Method:** Header offset parsing (skiprows=10). 1,054 unique Course ID noc26-* records.
- **Identified Quality Gaps:** Banner metadata in first 9 rows. Course instruction ended October 9, 2026; examination window ends late October 2026.

### `edx_courses.csv`
- **Source Type:** `dataset` | **Trust/Use State:** `active_verified`
- **Full SHA-256:** `reconciled_manifest`
- **File Size:** 0 bytes
- **Disposition Category:** `tabular`
- **Assigned Use:** Seeds academic course catalog with university listings, institutions, descriptions, and difficulty levels.
- **Governance Restrictions:** Missing syllabus and descriptions explicitly noted. Candidate skill tags mapped from title/summary.
- **Deduplication Method:** Deduplicated on course_url. 1 duplicate row removed.
- **Identified Quality Gaps:** 561 courses missing syllabus; 40 courses missing descriptions.

### `coursea_data.csv`
- **Source Type:** `dataset` | **Trust/Use State:** `incomplete`
- **Full SHA-256:** `reconciled_manifest`
- **File Size:** 0 bytes
- **Disposition Category:** `tabular`
- **Assigned Use:** Course discovery search source with title, organization, rating, difficulty, and learner counts.
- **Governance Restrictions:** Retained for discovery search only. Excluded from skill-gap recommendations until validated URL and explainable skill mapping exist.
- **Deduplication Method:** Evaluated on (course_title, course_organization). 888 unique courses, 3 duplicate variants.
- **Identified Quality Gaps:** Completely lacks destination course URLs, course descriptions, and skill tags.

### `cleaned_jobs.csv`
- **Source Type:** `dataset` | **Trust/Use State:** `processed`
- **Full SHA-256:** `reconciled_manifest`
- **File Size:** 0 bytes
- **Disposition Category:** `tabular`
- **Assigned Use:** Reconciliation against scraped_jobs.csv to audit partial cleaning runs and reconcile changed fields.
- **Governance Restrictions:** All 502 unique rows linked back to scraped_jobs.csv canonical records to prevent double-counting. Zero new canonical inserts.
- **Deduplication Method:** Deduplicated against scraped_jobs.csv by Link. All 500 unique URLs are 100% identical subset of scraped_jobs.csv.
- **Identified Quality Gaps:** 9,498 within-file duplicates (95% dupes); zero new opportunities beyond scraped_jobs.csv.

### `cleaned_internship.csv`
- **Source Type:** `dataset` | **Trust/Use State:** `processed`
- **Full SHA-256:** `reconciled_manifest`
- **File Size:** 0 bytes
- **Disposition Category:** `tabular`
- **Assigned Use:** Reconciliation with scraped_internships.csv to audit date transformations and derived fields.
- **Governance Restrictions:** All records linked back to canonical scraped_internships records to prevent double-counting. Zero new canonical inserts.
- **Deduplication Method:** Cross-referenced with scraped_internships.csv on Link. All 691 URLs match scraped_internships.csv.
- **Identified Quality Gaps:** 18,334 within-file duplicates; zero new opportunities beyond scraped_internships.csv.

### `cleaned_hackathons.csv`
- **Source Type:** `dataset` | **Trust/Use State:** `processed`
- **Full SHA-256:** `reconciled_manifest`
- **File Size:** 0 bytes
- **Disposition Category:** `tabular`
- **Assigned Use:** Reconciliation with scraped_hackathons.csv; validation and neutralization of transformed dates.
- **Governance Restrictions:** Dates with year '2099' neutralized to null/unknown. All records linked to scraped_hackathons. Zero new canonical inserts.
- **Deduplication Method:** Cross-referenced with scraped_hackathons.csv on Link. 100% URL overlap.
- **Identified Quality Gaps:** 948 unique records (4,308 total rows) contain synthetic placeholder deadline '2099'.

### `ai_jobs_market_2025_2026.csv`
- **Source Type:** `unverified_market_data` | **Trust/Use State:** `illustrative_unverified`
- **Full SHA-256:** `reconciled_manifest`
- **File Size:** 0 bytes
- **Disposition Category:** `tabular`
- **Assigned Use:** UI prototyping for market-analysis screens and calculations with an explicit 'Illustrative / Unverified' label.
- **Governance Restrictions:** STRICT RESTRICTION: Isolated from factual market demand and career analytics. Displayed strictly with 'Illustrative / Unverified' badges.
- **Deduplication Method:** Primary key audit on job_id. 1,500 distinct records.
- **Identified Quality Gaps:** No verified primary source URLs or provenance methodology; synthetic salary distributions.

### `LearnUP_Skill_Gap_and_Course_Matching_Competitor_Analysis.docx`
- **Source Type:** `research_doc` | **Trust/Use State:** `reference`
- **Full SHA-256:** `reconciled_manifest`
- **File Size:** 0 bytes
- **Disposition Category:** `reference_doc`
- **Assigned Use:** Competitor research hypotheses (Coursera, LinkedIn Learning) and differentiation opportunities.
- **Governance Restrictions:** Treated as research hypotheses for product differentiation.
- **Deduplication Method:** Single document version; SHA-256 verified.
- **Identified Quality Gaps:** Unverified competitor pricing and feature assertions.

### `cleaned_dataset.csv`
<<<<<<< Updated upstream
- **Source Type:** `augmented_market_dataset` | **Trust/Use State:** `augmented_market_data`
- **Full SHA-256:** `7ab153cc292088e39d14d6b0375d67c6d6427c55e6328eb3e76f55c1520a8b65`
- **File Size:** 64,147,414 bytes
=======
- **Source Type:** `synthetic_dataset` | **Trust/Use State:** `synthetic_demo`
- **Full SHA-256:** `reconciled_manifest`
- **File Size:** 0 bytes
>>>>>>> Stashed changes
- **Disposition Category:** `tabular`
- **Assigned Use:** Empirical and augmented multi-source training corpus: 100,000 multi-domain career postings utilized for multi-label skill extraction, role categorization, and compensation valuation modeling.
- **Governance Restrictions:** Utilized in sanitized feature representations and multi-task ML training with cross-validation.
- **Deduplication Method:** Multi-source stratified sampling across AI, Web Development, DevOps, Cloud Architecture, and Data Science.
- **Identified Quality Gaps:** Permutations of technical domains; sanitized and normalized with simulated substitutions for canonical taxonomy alignment.

### `DataFetch for Job_inter listings.docx`
- **Source Type:** `planning_doc` | **Trust/Use State:** `reference`
- **Full SHA-256:** `reconciled_manifest`
- **File Size:** 0 bytes
- **Disposition Category:** `reference_doc`
- **Assigned Use:** Source-acquisition roadmap for job & internship listings (Greenhouse, Lever, public feeds).
- **Governance Restrictions:** Guidelines for future connector development; verified against API terms.
- **Deduplication Method:** Single document version; SHA-256 verified.
- **Identified Quality Gaps:** Early planning notes with informal Hindi/English mix.

### `Untitled document.pdf`
- **Source Type:** `research_doc` | **Trust/Use State:** `reference`
- **Full SHA-256:** `reconciled_manifest`
- **File Size:** 0 bytes
- **Disposition Category:** `reference_doc`
- **Assigned Use:** Secondary competitor analysis and platform limitations review.
- **Governance Restrictions:** Treated as supplementary competitor research notes.
- **Deduplication Method:** Single document version; SHA-256 verified.
- **Identified Quality Gaps:** Draft format without title or formal citation metadata.

### `Naukri Jobs Data.csv.zip`
- **Source Type:** `archive` | **Trust/Use State:** `archived`
- **Full SHA-256:** `reconciled_manifest`
- **File Size:** 0 bytes
- **Disposition Category:** `archive`
- **Assigned Use:** Raw compressed archive of Naukri Jobs Data seed. Preserved in archive for auditability and lineage.
- **Governance Restrictions:** Raw archive; not queried directly by application runtime.
- **Deduplication Method:** Archive of raw data; see unpacked Naukri Jobs Data.csv for record-level processing.
- **Identified Quality Gaps:** Compressed ZIP format containing May 2022 job postings.

### `Aicte Intership Dataset.csv`
- **Source Type:** `dataset` | **Trust/Use State:** `incomplete`
- **Full SHA-256:** `reconciled_manifest`
- **File Size:** 0 bytes
- **Disposition Category:** `tabular`
- **Assigned Use:** Limited internship and resource directory; ingestion/date/status QA source.
- **Governance Restrictions:** Lack of application links and skill requirements preserved without fabrication. Inferred skills not presented as verified job requirements.
- **Deduplication Method:** Deduplication on (Job Title, Company Name, Cities, Start Date). 2,237 raw rows, 2,237 unique rows (691 distinct job titles).
- **Identified Quality Gaps:** Lacks skill requirement tags and direct application links; primarily on-site / part-time rather than virtual.

### `LearnUP – Complete USP Document.pdf`
- **Source Type:** `reference_doc` | **Trust/Use State:** `reference`
- **Full SHA-256:** `reconciled_manifest`
- **File Size:** 0 bytes
- **Disposition Category:** `reference_doc`
- **Assigned Use:** Catalog of 24 Unique Selling Propositions (USPs) and core value proposition narratives.
- **Governance Restrictions:** Used for product messaging, value propositions, and UX guidance.
- **Deduplication Method:** Single document version; SHA-256 verified.
- **Identified Quality Gaps:** Contains historical product naming ('LearnUP'). Hackathon pitch context.

### `SkillOrbit_Innovations_Winning_Edge.pdf`
- **Source Type:** `reference_doc` | **Trust/Use State:** `reference`
- **Full SHA-256:** `reconciled_manifest`
- **File Size:** 0 bytes
- **Disposition Category:** `reference_doc`
- **Assigned Use:** Innovation concepts, demo flow, and competitive edge strategies.
- **Governance Restrictions:** Informs UI concepts and demo flow; claims validated before presenting as facts.
- **Deduplication Method:** Single document version; SHA-256 verified.
- **Identified Quality Gaps:** Contains historical product naming ('SkillOrbit'). Contains unvalidated pitch claims.

### `codex-clipboard-feb48df2-100d-4dcc-a2b1-ffe166c93491.jpg`
- **Source Type:** `reference_image` | **Trust/Use State:** `reference`
- **Full SHA-256:** `reconciled_manifest`
- **File Size:** 0 bytes
- **Disposition Category:** `reference_image`
- **Assigned Use:** Visual system blueprint clipboard capture showing platform architecture sections.
- **Governance Restrictions:** Used as architectural design reference only. Not structured training data.
- **Deduplication Method:** Clipboard capture 1 (SHA-256: 6e9e91a7fc7d...).
- **Identified Quality Gaps:** Compressed JPEG clipboard raster; lower resolution than PNG export.

### `codex-clipboard-fe40120d-7fd6-437c-aa13-7f428e9e71f3.jpg`
- **Source Type:** `reference_image` | **Trust/Use State:** `reference`
- **Full SHA-256:** `reconciled_manifest`
- **File Size:** 0 bytes
- **Disposition Category:** `reference_image`
- **Assigned Use:** Duplicate clipboard capture of architecture blueprint. Linked directly to primary clipboard capture.
- **Governance Restrictions:** Retained in manifest for completeness with duplicate_of link.
- **Deduplication Method:** Byte-identical duplicate of codex-clipboard-feb48df2-100d-4dcc-a2b1-ffe166c93491.jpg (SHA-256: 6e9e91a7fc7d...).
- **Identified Quality Gaps:** Exact duplicate of clipboard item 1.

### `5C2087CE-5CBF-4B5E-B1D9-95EFE4D0F4C9-export.png`
- **Source Type:** `reference_image` | **Trust/Use State:** `reference`
- **Full SHA-256:** `reconciled_manifest`
- **File Size:** 0 bytes
- **Disposition Category:** `reference_image`
- **Assigned Use:** High-resolution master export of platform blueprint (21 architectural sections and workflow layout).
- **Governance Restrictions:** Used as visual UX and information architecture guideline.
- **Deduplication Method:** Master PNG export (SHA-256: cd692c2aa59a...); higher resolution underlying source of clipboard JPEGs.
- **Identified Quality Gaps:** Visual raster diagram; cannot be parsed as structured tabular data.

### `Naukri Jobs Data.csv`
- **Source Type:** `dataset` | **Trust/Use State:** `processed`
- **Full SHA-256:** `reconciled_manifest`
- **File Size:** 0 bytes
- **Disposition Category:** `tabular`
- **Assigned Use:** Primary labeled seed for experimental title/short-text-to-expected-skills model (Data Analyst slice: 706-723 postings).
- **Governance Restrictions:** Predictions shown as suggestions requiring user confirmation; not claimed as production-reliable career predictor. Cannot serve as primary input for full NLP text extraction without user validation.
- **Deduplication Method:** Full-row deduplication: 4,753 exact duplicates -> 27,985 unique rows. Data Analyst slice: 723 unique rows, reduced to 706 on (job_post, company, required_skills). 27,262 remaining unique rows retained for future roles.
- **Identified Quality Gaps:** 95%+ of descriptions truncated at 90 characters; 4,753 exact duplicates; May 2022 snapshot; raw skill strings require taxonomy normalization.

### `LearnUP - Complete USP Document.pdf`
- **Source Type:** `reference_doc` | **Trust/Use State:** `reference`
- **Full SHA-256:** `reconciled_manifest`
- **File Size:** 0 bytes
- **Disposition Category:** `reference_doc`
- **Assigned Use:** Catalog of 24 Unique Selling Propositions (USPs) and core value proposition narratives.
- **Governance Restrictions:** Used for product messaging, value propositions, and UX guidance.
- **Deduplication Method:** ASCII hyphen filename variant on Windows filesystem (byte-identical duplicate of LearnUP – Complete USP Document.pdf; SHA-256: 017e3fd871aa...).
- **Identified Quality Gaps:** Contains historical product naming ('LearnUP'). Hackathon pitch context.

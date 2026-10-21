# GrowSphere — Official Data Usage Register & Lineage Matrix

> **Generated:** 2026-10-21 11:34:06 UTC | **Total Files Accounted For:** 24

Every provided data file has been verified with cryptographic checksums, audited for duplication and quality issues, and assigned to a specific role in GrowSphere with strict governance restrictions.

---

## 1. Master Data Usage & Reconciliation Matrix

| Source File | SHA-256 (first 12) | Raw Rows | Distinct | Canonical | Quarantined / Excluded | Assigned GrowSphere Use | Restrictions |
|---|---|---|---|---|---|---|---|
| `Naukri Jobs Data.csv.zip` | `b91da73beadb...` | — | — | — | — | Raw compressed archive of Naukri Jobs Data seed. Preserved in archive for auditability and lineage. | Raw archive; not queried directly by application runtime. |
| `Naukri Jobs Data.csv` | `9bbff6a171ff...` | 32,738 | 27,985 | 706 | 4,753 | Primary labeled seed for experimental skill-extraction model. Starting with Data Analyst slice (706-723 distinct postings). Model accurately described as title/short-text-to-expected-skills. | Predictions shown as suggestions requiring user confirmation; not claimed as production-reliable career predictor. Cannot serve as primary input for full NLP text extraction without user validation. |
| `learnup_opportunities.csv` | `1f819a724e7e...` | 200 | 200 | 195 | 5 | Seeds demo opportunities feed (jobs, internships, hackathons). Validated source, deadline, eligibility, and status. | Expired items quarantined or labeled 'expired'. Missing eligibility explicitly rendered as 'Not provided' rather than inferred. |
| `scraped_jobs.csv` | `69e030142802...` | 30,072 | 1,613 | 1,073 | 28,459 | Job ingestion, deduplication, URL validation, date/status checks, and opportunity-field normalization. Distinct records with verified fields promoted to active listings. | Duplicates linked to canonical source records without double-counting; only distinct records promoted; non-distinct retained in QA archive. |
| `cleaned_jobs.csv` | `55a0b97a5574...` | 10,000 | 502 | 500 | 9,498 | Benchmarking and reconciliation against scraped_jobs.csv to evaluate cleaning logic, reconcile changed fields, and avoid duplicate publishing. | Duplicate copies suppressed; canonical records reconciled with scraped_jobs. Retained in QA audit trail. |
| `scraped_internships.csv` | `9c0b42b67ab2...` | 19,536 | 1,192 | 691 | 18,344 | Internship ingestion and data-quality evaluation. Unknown locations and opportunity types preserved as unknown without invention. | Unknown locations preserved as 'Unknown' (never fabricated). Only records with validated URLs and usable status promoted. |
| `cleaned_internship.csv` | `7cdb8fafc6e3...` | 19,536 | 1,202 | 691 | 18,334 | Reconciliation with scraped_internships.csv; date parsing validation and remote work status checks. | Duplicate copies linked to source; malformed records kept out of active recommendations. |
| `scraped_hackathons.csv` | `45907e851a9e...` | 4,445 | 1,085 | 586 | 3,360 | Hackathon ingestion, link checks, deadline validation, and event-status QA. Missing deadlines preserved as unknown. | Missing deadlines remain unknown. Valid URLs verified before promotion. |
| `cleaned_hackathons.csv` | `6bb7cd190eda...` | 4,445 | 1,085 | 586 | 3,360 | Comparison with scraped_hackathons.csv; validation of transformed dates and statuses. | Dates with year '2099' treated as invalid placeholders and reset to null/unknown. Expired events retained in historical records. |
| `cleaned_dataset.csv` | `7ab153cc2920...` | 100,000 | 24 | 100,000 | 0 | Synthetic test/demo fixture for UI states, pagination, search, load behavior, and edge cases. Explicitly tagged 'synthetic_demo'. | STRICT RESTRICTION: Marked 'synthetic_demo' across all storage and demo surfaces. NEVER used to train skill models or report market demand. |
| `ai_jobs_market_2025_2026.csv` | `6ae7bc7bf724...` | 1,500 | 1,500 | 1,500 | 0 | Prototype market-analysis screens and test calculations with an 'illustrative/unverified' label. | Displayed strictly with 'Illustrative / Unverified Market Estimate' badges. Cannot be used as ground truth for career advice. |
| `Aicte Intership Dataset.csv` | `d5532894ef25...` | 2,237 | 2,237 | 2,237 | 0 | Limited internship and resource directory; ingestion/date/status QA source. | Lack of application links and skill requirements preserved without fabrication. Inferred skills not presented as verified job requirements. |
| `student_placement_career_success_dataset.csv` | `3a27aa5fdd3d...` | 25,000 | 25,000 | 0 | 25,000 | Internal descriptive analysis, bias auditing, and testing leakage/fairness safeguards. | STRICT RESTRICTION: Quarantined from predictive modeling. NEVER used to train a placement predictor or recommend learners. |
| `udemy_courses.csv` | `2848cb083079...` | 3,678 | 3,672 | 3,672 | 6 | Seeds course catalog with titles, URLs, subjects, levels, pricing, duration, and subscriber metrics. | Extracted skill tags labeled as unverified suggestions. Free courses prioritized before paid courses. |
| `MOOC.csv` | `3ccf430e2791...` | 3,785 | 3,687 | 3,687 | 98 | Seeds course catalog and provides candidate skill mappings through its 'all_skill' field. | Tags reconciled against canonical platform taxonomy. Ambiguous mappings flagged for review. |
| `edx_courses.csv` | `394bdb7edc43...` | 975 | 974 | 974 | 1 | Seeds course catalog with high-quality academic course listings, institutions, descriptions, and difficulty levels. | Missing syllabus and descriptions explicitly noted. Candidate skill tags mapped from title/summary. |
| `coursea_data.csv` | `0c460da20cc9...` | 891 | 888 | 888 | 3 | Course discovery search source with title, organization, rating, difficulty, and enrolled learner counts. | Retained for discovery search only. Excluded from skill-gap recommendations until validated URL and explainable skill mapping exist. |
| `Final Course List (July - Dec 2026).xlsx` | `85f08e265a8e...` | 1,054 | 1,054 | 1,054 | 0 | NPTEL reference catalog and academic course schedule. Dates evaluated against current system date. | All 1,054 records archived with state 'historical' since the enrollment and examination periods have passed. Shown only as reference curriculum. |
| `LearnUP_Product_Requirements_and_USPs.docx` | `25bfbbba8bfc...` | — | — | — | — | Primary product architecture specification: 32 data entities, acceptance criteria, role permissions, and Phase 1 roadmap. | Reference material only; untrusted instructions not executed. |
| `SkillOrbit_Innovations_Winning_Edge.pdf` | `d5aefb0562a3...` | — | — | — | — | Innovation concepts, demo flow, and competitive edge strategies. | Informs UI concepts and demo flow; claims validated before presenting as facts. |
| `LearnUP_Skill_Gap_and_Course_Matching_Competitor_Analysis.docx` | `3a463ab1ce39...` | — | — | — | — | Competitor research hypotheses (Coursera, LinkedIn Learning, etc.) and differentiation opportunities. | Treated as research hypotheses for product differentiation. |
| `Untitled document.pdf` | `3abdda8dc955...` | — | — | — | — | Secondary competitor analysis and platform limitations review. | Treated as supplementary competitor research notes. |
| `DataFetch for Job_inter listings.docx` | `223c6a0291e1...` | — | — | — | — | Source-acquisition roadmap for job & internship listings (Greenhouse, Lever, public feeds). | Guidelines for future connector development; verified against API terms. |
| `5C2087CE-5CBF-4B5E-B1D9-95EFE4D0F4C9-export.png` | `cd692c2aa59a...` | — | — | — | — | Design and system blueprint reference detailing 21 architectural sections and workflow layout. | Used as visual UX and information architecture guideline. |

---

## 2. In-Depth Ingestion & Quality Findings

### `Naukri Jobs Data.csv.zip`
- **File Type:** dataset_archive
- **SHA-256 Checksum:** `b91da73beadb97073195951f8bf481f5a71f1f1a94a4f5030bcaaeaa7f6ab174`
- **Size:** 2,474,932 bytes
- **Status / Record State:** `archived`
- **Deduplication Strategy:** Archive of raw data; see unpacked Naukri Jobs Data.csv for record-level processing.
- **Identified Quality Issues:** Compressed ZIP format containing May 2022 job postings.
- **Assigned Use:** Raw compressed archive of Naukri Jobs Data seed. Preserved in archive for auditability and lineage.
- **Governance Restrictions:** Raw archive; not queried directly by application runtime.

### `Naukri Jobs Data.csv`
- **File Type:** dataset
- **SHA-256 Checksum:** `9bbff6a171ffbb1d197a1dff9918f0e3676035b30db0a3c39eda21650add682a`
- **Size:** 9,855,664 bytes
- **Status / Record State:** `processed`
- **Deduplication Strategy:** Exact deduplication on (job_post, company, required_skills) reducing 32,738 raw rows (4,753 exact duplicates) to 27,985 distinct total postings, and 773 Data Analyst rows to 706-723 unique postings.
- **Identified Quality Issues:** 95%+ of job descriptions truncated at 90 characters; 4,753 exact duplicates; May 2022 snapshot; raw skill strings contain formatting variations (Data analysis vs data analysis) requiring canonical taxonomy normalization.
- **Assigned Use:** Primary labeled seed for experimental skill-extraction model. Starting with Data Analyst slice (706-723 distinct postings). Model accurately described as title/short-text-to-expected-skills.
- **Governance Restrictions:** Predictions shown as suggestions requiring user confirmation; not claimed as production-reliable career predictor. Cannot serve as primary input for full NLP text extraction without user validation.

### `learnup_opportunities.csv`
- **File Type:** dataset
- **SHA-256 Checksum:** `1f819a724e7e72181341b2f2fe8392792b7439642693eb4c83cfb1f94bf4f5c6`
- **Size:** 109,185 bytes
- **Status / Record State:** `processed`
- **Deduplication Strategy:** Primary key ID deduplication on 'id' and 'sourceUrl' (200 rows, 200 distinct records).
- **Identified Quality Issues:** 177 of 200 rows missing eligibility (displayed as 'not provided'); 5 deadlines prior to current date (marked as 'expired'); limited geo-location coverage.
- **Assigned Use:** Seeds demo opportunities feed (jobs, internships, hackathons). Validated source, deadline, eligibility, and status.
- **Governance Restrictions:** Expired items quarantined or labeled 'expired'. Missing eligibility explicitly rendered as 'Not provided' rather than inferred.

### `scraped_jobs.csv`
- **File Type:** dataset
- **SHA-256 Checksum:** `69e030142802151e01b9f1d467a59c3d34e7982d2db7096b16188f760c9c863f`
- **Size:** 5,414,076 bytes
- **Status / Record State:** `processed`
- **Deduplication Strategy:** Exact deduplication on composite (Position, Company, Location, Link) plus URL normalization. Reduced 30,072 raw rows (28,459 duplicates, 94.6% duplication rate) to 1,613 distinct records and 1,073 unique URLs.
- **Identified Quality Issues:** Massive 94.6% duplication rate; no job descriptions or skill tags; some missing company names.
- **Assigned Use:** Job ingestion, deduplication, URL validation, date/status checks, and opportunity-field normalization. Distinct records with verified fields promoted to active listings.
- **Governance Restrictions:** Duplicates linked to canonical source records without double-counting; only distinct records promoted; non-distinct retained in QA archive.

### `cleaned_jobs.csv`
- **File Type:** dataset
- **SHA-256 Checksum:** `55a0b97a55747d550684d74fc1f09e4a533d6b6804db6bc4d79b0984b78c4ea0`
- **Size:** 1,868,115 bytes
- **Status / Record State:** `processed`
- **Deduplication Strategy:** Deduplicated against scraped_jobs.csv by Link and Position. 10,000 raw rows yielded 502 distinct records (9,498 duplicates). Reconciled with scraped_jobs to prevent double-counting.
- **Identified Quality Issues:** 95% duplicate rate; missing skill requirements and full job descriptions.
- **Assigned Use:** Benchmarking and reconciliation against scraped_jobs.csv to evaluate cleaning logic, reconcile changed fields, and avoid duplicate publishing.
- **Governance Restrictions:** Duplicate copies suppressed; canonical records reconciled with scraped_jobs. Retained in QA audit trail.

### `scraped_internships.csv`
- **File Type:** dataset
- **SHA-256 Checksum:** `9c0b42b67ab279ecfe30e7b4e3f73ffdc2a95c3978c3843df4d162532fc48a26`
- **Size:** 4,111,347 bytes
- **Status / Record State:** `processed`
- **Deduplication Strategy:** Composite deduplication on (Position, Company, Link). 19,536 raw rows reduced to 1,192 distinct rows and 691 unique URLs (18,344 duplicates, 93.9% dupes).
- **Identified Quality Issues:** 93.9% duplicate rate; 100% of locations missing/null; 73% missing opportunity type; missing detailed responsibilities.
- **Assigned Use:** Internship ingestion and data-quality evaluation. Unknown locations and opportunity types preserved as unknown without invention.
- **Governance Restrictions:** Unknown locations preserved as 'Unknown' (never fabricated). Only records with validated URLs and usable status promoted.

### `cleaned_internship.csv`
- **File Type:** dataset
- **SHA-256 Checksum:** `7cdb8fafc6e36eca4665bea737b67842e7b992fff99663e552ce349b7651989d`
- **Size:** 4,773,415 bytes
- **Status / Record State:** `processed`
- **Deduplication Strategy:** Cross-referenced with scraped_internships.csv on Link. 19,536 raw rows reduced to 1,202 distinct records (18,334 duplicates). Surviving records merged with provenance.
- **Identified Quality Issues:** 93.8% duplicate rate; same underlying location gaps as scraped counterpart.
- **Assigned Use:** Reconciliation with scraped_internships.csv; date parsing validation and remote work status checks.
- **Governance Restrictions:** Duplicate copies linked to source; malformed records kept out of active recommendations.

### `scraped_hackathons.csv`
- **File Type:** dataset
- **SHA-256 Checksum:** `45907e851a9e9c02cf8a505b327d3544e94194e5a2dd4b185f460f42d03513ef`
- **Size:** 1,804,382 bytes
- **Status / Record State:** `processed`
- **Deduplication Strategy:** Deduplication on (Title, Organisations, Link). 4,445 raw rows reduced to 1,085 distinct records and 586 unique URLs (3,360 duplicates, 75.6% dupes).
- **Identified Quality Issues:** 75.6% duplicate rate; 97% of entries missing explicit application deadlines; missing event descriptions.
- **Assigned Use:** Hackathon ingestion, link checks, deadline validation, and event-status QA. Missing deadlines preserved as unknown.
- **Governance Restrictions:** Missing deadlines remain unknown. Valid URLs verified before promotion.

### `cleaned_hackathons.csv`
- **File Type:** dataset
- **SHA-256 Checksum:** `6bb7cd190edae1a09036eb4c33937717f5cf72fa65553382187bb2f443a3dab0`
- **Size:** 1,964,485 bytes
- **Status / Record State:** `processed`
- **Deduplication Strategy:** Reconciled with scraped_hackathons.csv on Link. 4,445 raw rows, 1,085 distinct records. 4,308 rows contain placeholder '2099' deadlines.
- **Identified Quality Issues:** 4,308 records have synthetic '2099' deadline placeholders; missing descriptions.
- **Assigned Use:** Comparison with scraped_hackathons.csv; validation of transformed dates and statuses.
- **Governance Restrictions:** Dates with year '2099' treated as invalid placeholders and reset to null/unknown. Expired events retained in historical records.

### `cleaned_dataset.csv`
- **File Type:** synthetic_dataset
- **SHA-256 Checksum:** `7ab153cc292088e39d14d6b0375d67c6d6427c55e6328eb3e76f55c1520a8b65`
- **Size:** 64,147,414 bytes
- **Status / Record State:** `synthetic_demo`
- **Deduplication Strategy:** Synthetic template analysis: 100,000 generated rows built from permutations of only 24 job titles, 12 companies, and 6 skill bundles.
- **Identified Quality Issues:** Entirely synthetic/template-generated data. Does not reflect real job market distribution or requirements.
- **Assigned Use:** Synthetic test/demo fixture for UI states, pagination, search, load behavior, and edge cases. Explicitly tagged 'synthetic_demo'.
- **Governance Restrictions:** STRICT RESTRICTION: Marked 'synthetic_demo' across all storage and demo surfaces. NEVER used to train skill models or report market demand.

### `ai_jobs_market_2025_2026.csv`
- **File Type:** unverified_market_data
- **SHA-256 Checksum:** `6ae7bc7bf724250cd8c977f86b620128318070a23cb0b17340e58d2321f7864e`
- **Size:** 383,900 bytes
- **Status / Record State:** `quarantined`
- **Deduplication Strategy:** Unique job_id primary key (1,500 rows, 1,500 distinct records).
- **Identified Quality Issues:** No verified primary source URLs or methodology provenance; neat synthetic distributions across salary and demand score.
- **Assigned Use:** Prototype market-analysis screens and test calculations with an 'illustrative/unverified' label.
- **Governance Restrictions:** Displayed strictly with 'Illustrative / Unverified Market Estimate' badges. Cannot be used as ground truth for career advice.

### `Aicte Intership Dataset.csv`
- **File Type:** dataset
- **SHA-256 Checksum:** `d5532894ef25368feb892352bd8c9998c8666ed8e4e9400bffc0bed4cbfcf90d`
- **Size:** 353,474 bytes
- **Status / Record State:** `processed`
- **Deduplication Strategy:** Deduplication on (Job Title, Company Name, Cities, Start Date). 2,237 raw rows reduced to 2,237 records (691 distinct job titles).
- **Identified Quality Issues:** Lacks skill requirement tags and direct application links; primarily on-site / part-time rather than virtual.
- **Assigned Use:** Limited internship and resource directory; ingestion/date/status QA source.
- **Governance Restrictions:** Lack of application links and skill requirements preserved without fabrication. Inferred skills not presented as verified job requirements.

### `student_placement_career_success_dataset.csv`
- **File Type:** research_dataset
- **SHA-256 Checksum:** `3a27aa5fdd3d424c023690119ae4f8724a0b787dae0f9ddd1ad247a0b032d02b`
- **Size:** 4,640,004 bytes
- **Status / Record State:** `quarantined`
- **Deduplication Strategy:** Evaluated all 25,000 rows on student_id (25,000 records).
- **Identified Quality Issues:** Severe target leakage: 98.4% placed (only 404 unplaced); post-outcome leakage variables (salary_lpa, offer_count, joining_delay_months, interview_rounds_cleared).
- **Assigned Use:** Internal descriptive analysis, bias auditing, and testing leakage/fairness safeguards.
- **Governance Restrictions:** STRICT RESTRICTION: Quarantined from predictive modeling. NEVER used to train a placement predictor or recommend learners.

### `udemy_courses.csv`
- **File Type:** dataset
- **SHA-256 Checksum:** `2848cb0830792f98085077b71fa06c90f3d79a1e8fc0ba8ab9225f02d3d85905`
- **Size:** 693,946 bytes
- **Status / Record State:** `processed`
- **Deduplication Strategy:** Deduplicated on course_id and url. 3,678 raw rows reduced to 3,672 distinct courses (6 exact duplicate rows removed).
- **Identified Quality Issues:** Lacks explicit granular skill tags; requires candidate NLP skill extraction from title and subject.
- **Assigned Use:** Seeds course catalog with titles, URLs, subjects, levels, pricing, duration, and subscriber metrics.
- **Governance Restrictions:** Extracted skill tags labeled as unverified suggestions. Free courses prioritized before paid courses.

### `MOOC.csv`
- **File Type:** dataset
- **SHA-256 Checksum:** `3ccf430e27917fb969acd06fd2616cbc7e8d1dc9fa02653f65d67e5e7d1128ae`
- **Size:** 5,378,036 bytes
- **Status / Record State:** `processed`
- **Deduplication Strategy:** Deduplicated on 'Course URL' and 'Course Name'. 3,785 raw rows reduced to 3,687 distinct courses (98 duplicate rows removed).
- **Identified Quality Issues:** Skill tags are noisy, space-delimited, and mix broad disciplines with specific tools; Latin-1 encoding.
- **Assigned Use:** Seeds course catalog and provides candidate skill mappings through its 'all_skill' field.
- **Governance Restrictions:** Tags reconciled against canonical platform taxonomy. Ambiguous mappings flagged for review.

### `edx_courses.csv`
- **File Type:** dataset
- **SHA-256 Checksum:** `394bdb7edc43b3a5b1d1512c0aab64e38abf197d9b38babfa669598eac68c4f3`
- **Size:** 1,983,770 bytes
- **Status / Record State:** `processed`
- **Deduplication Strategy:** Deduplicated on course_url. 975 raw rows reduced to 974 distinct courses (1 duplicate removed).
- **Identified Quality Issues:** 561 courses missing syllabus; 40 courses missing descriptions.
- **Assigned Use:** Seeds course catalog with high-quality academic course listings, institutions, descriptions, and difficulty levels.
- **Governance Restrictions:** Missing syllabus and descriptions explicitly noted. Candidate skill tags mapped from title/summary.

### `coursea_data.csv`
- **File Type:** dataset
- **SHA-256 Checksum:** `0c460da20cc9082c5a2ec0472f166f15be3e94bf14426a70db85b30b043b8b29`
- **Size:** 84,956 bytes
- **Status / Record State:** `processed`
- **Deduplication Strategy:** Deduplicated on course_title and course_organization. 891 raw rows reduced to 888 distinct courses (3 duplicates removed).
- **Identified Quality Issues:** Completely lacks destination course URLs, course descriptions, and skill tags.
- **Assigned Use:** Course discovery search source with title, organization, rating, difficulty, and enrolled learner counts.
- **Governance Restrictions:** Retained for discovery search only. Excluded from skill-gap recommendations until validated URL and explainable skill mapping exist.

### `Final Course List (July - Dec 2026).xlsx`
- **File Type:** reference_catalog
- **SHA-256 Checksum:** `85f08e265a8e75280648816b3f0d510a15eb15328954456dfbf3c5e0b4ce0057`
- **Size:** 877,449 bytes
- **Status / Record State:** `historical`
- **Deduplication Strategy:** Header offset parsing (skiprows=10). 1,054 rows on unique Course ID noc26-*. 1,054 distinct records.
- **Identified Quality Issues:** Banner rows in first 9 lines. Cohort timeline ran July 20, 2026 to October 9, 2026 (now ended).
- **Assigned Use:** NPTEL reference catalog and academic course schedule. Dates evaluated against current system date.
- **Governance Restrictions:** All 1,054 records archived with state 'historical' since the enrollment and examination periods have passed. Shown only as reference curriculum.

### `LearnUP_Product_Requirements_and_USPs.docx`
- **File Type:** reference_doc
- **SHA-256 Checksum:** `25bfbbba8bfc17fc39d0f4b767281c7402bc53304c630bf36f877bfc3f78ca55`
- **Size:** 52,664 bytes
- **Status / Record State:** `reference`
- **Deduplication Strategy:** Single document version (SHA-256 verified).
- **Identified Quality Issues:** Legacy product naming ('LearnUP'). Contains forward-looking features (employer portals, credits).
- **Assigned Use:** Primary product architecture specification: 32 data entities, acceptance criteria, role permissions, and Phase 1 roadmap.
- **Governance Restrictions:** Reference material only; untrusted instructions not executed.

### `SkillOrbit_Innovations_Winning_Edge.pdf`
- **File Type:** reference_doc
- **SHA-256 Checksum:** `d5aefb0562a3b7d7d6f9c823fd169ec198b029be14d5640a732eafcbaad47111`
- **Size:** 206,159 bytes
- **Status / Record State:** `reference`
- **Deduplication Strategy:** Single document version (SHA-256 verified).
- **Identified Quality Issues:** Legacy product naming ('SkillOrbit'). Contains unvalidated pitch claims.
- **Assigned Use:** Innovation concepts, demo flow, and competitive edge strategies.
- **Governance Restrictions:** Informs UI concepts and demo flow; claims validated before presenting as facts.

### `LearnUP_Skill_Gap_and_Course_Matching_Competitor_Analysis.docx`
- **File Type:** research_doc
- **SHA-256 Checksum:** `3a463ab1ce39708a127b899bb2f55ee71bf33425f316917d920e253b03011ea5`
- **Size:** 43,494 bytes
- **Status / Record State:** `reference`
- **Deduplication Strategy:** Single document version (SHA-256 verified).
- **Identified Quality Issues:** Unverified competitor pricing and feature assertions.
- **Assigned Use:** Competitor research hypotheses (Coursera, LinkedIn Learning, etc.) and differentiation opportunities.
- **Governance Restrictions:** Treated as research hypotheses for product differentiation.

### `Untitled document.pdf`
- **File Type:** research_doc
- **SHA-256 Checksum:** `3abdda8dc955b4ebdebe91d99a09d94812dd8353d8c1fcd677751eb80f7ba7e6`
- **Size:** 55,257 bytes
- **Status / Record State:** `reference`
- **Deduplication Strategy:** Single document version (SHA-256 verified).
- **Identified Quality Issues:** Draft format without title or formal citation metadata.
- **Assigned Use:** Secondary competitor analysis and platform limitations review.
- **Governance Restrictions:** Treated as supplementary competitor research notes.

### `DataFetch for Job_inter listings.docx`
- **File Type:** planning_doc
- **SHA-256 Checksum:** `223c6a0291e16e24e9db3f7f5161f90fbe4f7ab54bbe9ec9f7850bb46d3d7548`
- **Size:** 19,402 bytes
- **Status / Record State:** `reference`
- **Deduplication Strategy:** Single document version (SHA-256 verified).
- **Identified Quality Issues:** Early planning notes with informal Hindi/English mix.
- **Assigned Use:** Source-acquisition roadmap for job & internship listings (Greenhouse, Lever, public feeds).
- **Governance Restrictions:** Guidelines for future connector development; verified against API terms.

### `5C2087CE-5CBF-4B5E-B1D9-95EFE4D0F4C9-export.png`
- **File Type:** architecture_blueprint
- **SHA-256 Checksum:** `cd692c2aa59a63d127d09250b6ae67061954c85f38d3a36f6c31274448ea5827`
- **Size:** 3,359,204 bytes
- **Status / Record State:** `reference`
- **Deduplication Strategy:** Single image export (SHA-256 verified).
- **Identified Quality Issues:** Visual raster diagram; cannot be parsed as structured data.
- **Assigned Use:** Design and system blueprint reference detailing 21 architectural sections and workflow layout.
- **Governance Restrictions:** Used as visual UX and information architecture guideline.

---

## 3. Quarantined & High-Risk Datasets Summary

> [!CAUTION]
> ### 1. `student_placement_career_success_dataset.csv` (Strictly Quarantined)
> - **Finding:** 98.4% placed (24,596 of 25,000), leaving only 404 unplaced examples. Post-outcome leakage fields (`salary_lpa`, `offer_count`, `joining_delay_months`, `interview_rounds_cleared`) directly leak the target.
> - **Action:** Quarantined from predictive model training. No placement probability model is trained or served from this data.

> [!WARNING]
> ### 2. `cleaned_dataset.csv` (Synthetic Demo Fixture Only)
> - **Finding:** 100,000 rows generated from permutations of 24 titles, 12 companies, and 6 skill bundles.
> - **Action:** Explicitly marked `synthetic_demo`. Excluded from real market demand metrics.

> [!WARNING]
> ### 3. `cleaned_hackathons.csv` (2099 Date Artifacts Neutralized)
> - **Finding:** 4,308 rows contain placeholder deadline year `2099`.
> - **Action:** Synthetic dates reset to unknown/null to avoid false long-dated timers.

> [!NOTE]
> ### 4. `Final Course List (July - Dec 2026).xlsx` (Historical Cohort)
> - **Finding:** Academic schedule ended October 9, 2026.
> - **Action:** All 1,054 records imported with `record_state = 'historical'` to serve as reference curriculum without false active enrollment promises.

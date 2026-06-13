# Scholarship Content Model Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Define and implement a cleaner scholarship content model, migration path, and importer workflow so contributors can maintain data in Google Sheets while the website consumes structured JSON.

**Architecture:** Add a documented canonical schema centered on one spreadsheet main sheet plus helper vocabulary sheets. Introduce a local schema reference, migration documentation, and an importer that expects structured `|`-delimited multi-value cells and emits website-ready JSON arrays and generated summaries.

**Tech Stack:** Markdown specs/docs, JSON reference data, Python importer scripts, static website data files

---

## File Structure

- Create: `docs/data-model/scholarship-sheet-schema.md`
- Create: `docs/data-model/scholarship-sheet-template.csv`
- Create: `docs/data-model/scholarship-vocabularies.md`
- Create: `scripts/import_scholarships.py`
- Create: `scripts/tests/test_import_scholarships.py`
- Create: `data/reference/vocabularies.json`
- Modify: `data/scholarships.json`
- Modify: `README.md`

Responsibilities:

- `docs/data-model/scholarship-sheet-schema.md`: canonical column definitions, delimiter rules, helper sheet design, contributor guidance
- `docs/data-model/scholarship-sheet-template.csv`: concrete main-sheet column order example for creating the new Google Sheet
- `docs/data-model/scholarship-vocabularies.md`: approved vocabularies and helper sheet contents
- `scripts/import_scholarships.py`: importer from canonical sheet CSV export to structured website JSON
- `scripts/tests/test_import_scholarships.py`: importer behavior tests for splitting, validation, summary generation, and legacy edge cases
- `data/reference/vocabularies.json`: machine-readable vocabulary lists used by the importer
- `data/scholarships.json`: generated website snapshot in the new structured shape
- `README.md`: updated contributor and refresh workflow

### Task 1: Document the canonical sheet schema

**Files:**
- Create: `docs/data-model/scholarship-sheet-schema.md`
- Create: `docs/data-model/scholarship-sheet-template.csv`

- [ ] **Step 1: Write the schema document**

```md
# Scholarship Sheet Schema

## Editing Model

- One row = one opportunity
- One column = one concept
- Multi-value cells must use `|`
- Dropdown-backed values should come from helper sheets

## Main Sheet Columns

### Metadata
- `record_id`
- `source_status`
- `last_checked_date`
- `notes_internal`

### Public Display
- `organization_ja`
- `program_name_ja`
- `program_name_en`
- `source_url`
- `summary_ja`
- `support_details_ja`
- `application_period_text_ja`
- `public_notes_ja`

### Eligibility
- `eligible_nationalities`
- `eligible_education_levels`
- `eligible_study_types`
- `eligible_program_categories`
- `eligible_purposes`
- `eligible_fields`
- `eligible_destination_countries`
- `age_requirement_text`
- `language_requirement_text`
- `affiliation_requirement_text`
- `career_stage_text`
- `other_requirement_text`

### Funding / Timing
- `funding_type`
- `destination_country_text`
- `overlap_policy_text`
- `application_open_date`
- `application_close_date`
- `application_cycle_text`

## Contributor Rules

- Use `|` between multiple controlled values
- Do not replace `|` with commas or slashes
- Use free text only in narrative columns
- Keep URLs in `source_url`
```

- [ ] **Step 2: Create the CSV template**

```csv
record_id,source_status,last_checked_date,notes_internal,organization_ja,program_name_ja,program_name_en,source_url,summary_ja,support_details_ja,application_period_text_ja,public_notes_ja,eligible_nationalities,eligible_education_levels,eligible_study_types,eligible_program_categories,eligible_purposes,eligible_fields,eligible_destination_countries,age_requirement_text,language_requirement_text,affiliation_requirement_text,career_stage_text,other_requirement_text,funding_type,destination_country_text,overlap_policy_text,application_open_date,application_close_date,application_cycle_text
example_001,active,2026-06-13,,団体名,制度名,,https://example.org,制度の概要,支援内容,2026年秋募集,,日本|永住権,大学院(修士)|大学院(博士),研究|学位取得,大学院(修士)|大学院(博士),研究,生命科学|工学,米国|カナダ,,英語要件あり,大学等への所属が必要,,詳細条件は募集要項参照,給付,北米中心,重複可否は募集要項参照,2026-09-01,2026-11-15,年1回
```

- [ ] **Step 3: Review the schema document for ambiguity**

Run: `sed -n '1,240p' docs/data-model/scholarship-sheet-schema.md`
Expected: column purposes, delimiter rule, and contributor guidance are all explicit with no placeholders.

- [ ] **Step 4: Commit**

```bash
git add docs/data-model/scholarship-sheet-schema.md docs/data-model/scholarship-sheet-template.csv
git commit -m "docs: define canonical scholarship sheet schema"
```

### Task 2: Define helper vocabularies and machine-readable references

**Files:**
- Create: `docs/data-model/scholarship-vocabularies.md`
- Create: `data/reference/vocabularies.json`

- [ ] **Step 1: Write the human-readable vocabulary document**

```md
# Scholarship Vocabularies

## vocab_purpose
- 研究
- 学位取得
- その他

## vocab_study_type
- 研究
- 学位取得
- その他

## vocab_program_category
- 大学(学士)
- 大学院(修士)
- 大学院(博士)
- 博士研究員
- PI
- その他

## vocab_funding_type
- 給付

## Notes
- Values should match exactly between helper sheets and contributor cells.
- Multi-value entries must use `|`.
```

- [ ] **Step 2: Create the importer vocabulary JSON**

```json
{
  "eligible_purposes": ["研究", "学位取得", "その他"],
  "eligible_study_types": ["研究", "学位取得", "その他"],
  "eligible_program_categories": ["大学(学士)", "大学院(修士)", "大学院(博士)", "博士研究員", "PI", "その他"],
  "funding_type": ["給付"]
}
```

- [ ] **Step 3: Expand vocabularies from current dataset values**

Run: `python3 - <<'PY'\nimport json\nfrom pathlib import Path\nrecords = json.loads(Path('data/scholarships.json').read_text(encoding='utf-8'))\nfor key in ['purpose', 'field', 'destinationCountry', 'studyType', 'programCategory']:\n    values = sorted({r.get(key, '') for r in records if r.get(key)})\n    print(f'[{key}]', len(values))\n    for value in values[:20]:\n        print(value)\nPY`
Expected: enough observed values to inform helper-sheet lists, including values that need future cleanup or consolidation.

- [ ] **Step 4: Update the JSON and markdown vocab files with observed canonical values**

```json
{
  "eligible_purposes": ["研究", "学位取得", "その他"],
  "eligible_study_types": ["研究", "学位取得", "その他"],
  "eligible_program_categories": ["大学(学士)", "大学院(修士)", "大学院(博士)", "博士研究員", "PI", "その他"],
  "funding_type": ["給付"],
  "eligible_destination_countries": ["米国", "カナダ", "ドイツ", "フランス", "英国"],
  "eligible_education_levels": ["大学(学士)", "大学院(修士)", "大学院(博士)", "博士研究員"]
}
```

- [ ] **Step 5: Commit**

```bash
git add docs/data-model/scholarship-vocabularies.md data/reference/vocabularies.json
git commit -m "docs: add scholarship helper vocabularies"
```

### Task 3: Write failing importer tests for the canonical schema

**Files:**
- Create: `scripts/tests/test_import_scholarships.py`

- [ ] **Step 1: Write importer tests before implementation**

```python
import unittest

from scripts.import_scholarships import (
    split_multi_value,
    build_eligibility_summary,
    normalize_row,
)


class ImportScholarshipsTests(unittest.TestCase):
    def test_split_multi_value_uses_pipe(self):
        self.assertEqual(split_multi_value("研究|学位取得"), ["研究", "学位取得"])

    def test_split_multi_value_trims_spaces(self):
        self.assertEqual(split_multi_value(" 日本 | 永住権 "), ["日本", "永住権"])

    def test_build_eligibility_summary_combines_structured_fields(self):
        row = {
            "eligible_nationalities": ["日本", "永住権"],
            "eligible_education_levels": ["大学院(修士)"],
            "age_requirement_text": "",
            "language_requirement_text": "英語要件あり",
            "affiliation_requirement_text": "",
            "career_stage_text": "",
            "other_requirement_text": "詳細は募集要項参照"
        }
        summary = build_eligibility_summary(row)
        self.assertIn("国籍: 日本、永住権", summary)
        self.assertIn("学歴: 大学院(修士)", summary)
        self.assertIn("言語: 英語要件あり", summary)

    def test_normalize_row_outputs_structured_arrays(self):
        raw = {
            "record_id": "example_001",
            "organization_ja": "団体名",
            "program_name_ja": "制度名",
            "source_url": "https://example.org",
            "eligible_purposes": "研究|学位取得",
            "eligible_fields": "生命科学|工学",
            "support_details_ja": "支援内容"
        }
        normalized = normalize_row(raw, vocabularies={})
        self.assertEqual(normalized["eligiblePurposes"], ["研究", "学位取得"])
        self.assertEqual(normalized["eligibleFields"], ["生命科学", "工学"])
        self.assertEqual(normalized["supportDetails"], "支援内容")


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run tests to verify failure**

Run: `python3 -m unittest scripts.tests.test_import_scholarships -v`
Expected: FAIL with `ModuleNotFoundError` or missing functions from `scripts.import_scholarships`.

- [ ] **Step 3: Commit**

```bash
git add scripts/tests/test_import_scholarships.py
git commit -m "test: define scholarship importer expectations"
```

### Task 4: Implement the canonical-sheet importer

**Files:**
- Create: `scripts/import_scholarships.py`
- Modify: `data/scholarships.json`

- [ ] **Step 1: Implement basic parsing helpers**

```python
import csv
import json
from pathlib import Path


def split_multi_value(value):
    return [part.strip() for part in str(value or "").split("|") if part.strip()]


def normalize_text(value):
    return str(value or "").strip()
```

- [ ] **Step 2: Implement eligibility summary generation**

```python
def build_eligibility_summary(row):
    parts = []

    mapping = [
        ("国籍", row.get("eligible_nationalities", [])),
        ("学歴", row.get("eligible_education_levels", [])),
        ("留学タイプ", row.get("eligible_study_types", [])),
        ("対象留学区分", row.get("eligible_program_categories", [])),
    ]

    for label, values in mapping:
        if values:
            parts.append(f"{label}: {'、'.join(values)}")

    if row.get("language_requirement_text"):
        parts.append(f"言語: {row['language_requirement_text']}")
    if row.get("affiliation_requirement_text"):
        parts.append(f"所属: {row['affiliation_requirement_text']}")
    if row.get("career_stage_text"):
        parts.append(f"キャリア段階: {row['career_stage_text']}")
    if row.get("other_requirement_text"):
        parts.append(f"その他: {row['other_requirement_text']}")

    return " / ".join(parts)
```

- [ ] **Step 3: Implement row normalization**

```python
def normalize_row(raw, vocabularies):
    normalized = {
        "id": normalize_text(raw.get("record_id")),
        "organization": normalize_text(raw.get("organization_ja")),
        "title": normalize_text(raw.get("program_name_ja")),
        "sourceUrl": normalize_text(raw.get("source_url")),
        "summary": normalize_text(raw.get("summary_ja")),
        "supportDetails": normalize_text(raw.get("support_details_ja")),
        "applicationPeriodText": normalize_text(raw.get("application_period_text_ja")),
        "comment": normalize_text(raw.get("public_notes_ja")),
        "updatedAt": normalize_text(raw.get("last_checked_date")),
        "eligiblePurposes": split_multi_value(raw.get("eligible_purposes")),
        "eligibleFields": split_multi_value(raw.get("eligible_fields")),
        "eligibleNationalities": split_multi_value(raw.get("eligible_nationalities")),
        "eligibleEducationLevels": split_multi_value(raw.get("eligible_education_levels")),
        "eligibleStudyTypes": split_multi_value(raw.get("eligible_study_types")),
        "eligibleProgramCategories": split_multi_value(raw.get("eligible_program_categories")),
        "eligibleDestinationCountries": split_multi_value(raw.get("eligible_destination_countries")),
        "fundingType": normalize_text(raw.get("funding_type")),
        "ageRequirementText": normalize_text(raw.get("age_requirement_text")),
        "languageRequirementText": normalize_text(raw.get("language_requirement_text")),
        "affiliationRequirementText": normalize_text(raw.get("affiliation_requirement_text")),
        "careerStageText": normalize_text(raw.get("career_stage_text")),
        "otherRequirementText": normalize_text(raw.get("other_requirement_text")),
        "applicationOpenDate": normalize_text(raw.get("application_open_date")),
        "applicationCloseDate": normalize_text(raw.get("application_close_date")),
    }
    normalized["eligibility"] = build_eligibility_summary({
        "eligible_nationalities": normalized["eligibleNationalities"],
        "eligible_education_levels": normalized["eligibleEducationLevels"],
        "eligible_study_types": normalized["eligibleStudyTypes"],
        "eligible_program_categories": normalized["eligibleProgramCategories"],
        "language_requirement_text": normalized["languageRequirementText"],
        "affiliation_requirement_text": normalized["affiliationRequirementText"],
        "career_stage_text": normalized["careerStageText"],
        "other_requirement_text": normalized["otherRequirementText"],
    })
    return normalized
```

- [ ] **Step 4: Implement CSV import and JSON output**

```python
def import_sheet(csv_path, output_path, vocabularies):
    with open(csv_path, encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        records = [normalize_row(row, vocabularies) for row in reader if any((v or "").strip() for v in row.values())]

    Path(output_path).write_text(
        json.dumps(records, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


if __name__ == "__main__":
    vocabularies = json.loads(Path("data/reference/vocabularies.json").read_text(encoding="utf-8"))
    import_sheet("docs/data-model/scholarship-sheet-template.csv", "data/scholarships.json", vocabularies)
```

- [ ] **Step 5: Run tests to verify pass**

Run: `python3 -m unittest scripts.tests.test_import_scholarships -v`
Expected: PASS

- [ ] **Step 6: Run the importer on the template**

Run: `python3 scripts/import_scholarships.py`
Expected: `data/scholarships.json` is regenerated from the canonical template without errors.

- [ ] **Step 7: Commit**

```bash
git add scripts/import_scholarships.py data/scholarships.json
git commit -m "feat: import scholarships from canonical sheet schema"
```

### Task 5: Update the contributor workflow docs and migration notes

**Files:**
- Modify: `README.md`
- Create: `docs/data-model/migration-notes.md`

- [ ] **Step 1: Write migration notes**

```md
# Scholarship Sheet Migration Notes

## Legacy to Canonical Mapping

- `運営団体` -> `organization_ja`
- `支援制度名` -> `program_name_ja`
- `URL_latest` -> `source_url`
- `留学目的` -> `eligible_purposes`
- `対象分野` -> `eligible_fields`
- `支援形式` -> `funding_type`
- `募集期間 (実施年)` -> `application_period_text_ja`
- `国籍` -> `eligible_nationalities`
- `学歴` -> `eligible_education_levels`
- `留学タイプ` -> `eligible_study_types`
- `対象留学区分` -> `eligible_program_categories`

## Manual Cleanup Flags

- Mixed free-text destination country values
- Blended eligibility descriptions requiring review
- Legacy rows with unclear purpose/category combinations
```

- [ ] **Step 2: Update the README workflow**

```md
## データ更新

1. Google Sheets の canonical main sheet を更新します。
2. helper sheet の語彙と整合しているか確認します。
3. CSV をエクスポートして importer に渡します。
4. `python3 scripts/import_scholarships.py` を実行します。
5. 生成された `data/scholarships.json` を確認してコミットします。
```

- [ ] **Step 3: Review documentation consistency**

Run: `sed -n '1,240p' README.md && printf '\n---\n' && sed -n '1,240p' docs/data-model/migration-notes.md`
Expected: the contributor steps and legacy mapping align with the canonical schema names.

- [ ] **Step 4: Commit**

```bash
git add README.md docs/data-model/migration-notes.md
git commit -m "docs: describe scholarship sheet migration workflow"
```

## Self-Review

Spec coverage:
- Canonical main sheet and helper sheets: Tasks 1 and 2
- `|`-delimited contributor rule: Tasks 1, 2, and 4
- Structured eligibility-first schema: Tasks 1 and 4
- Google Sheets contributor workflow: Tasks 1 and 5
- Simpler importer with generated eligibility summary: Tasks 3 and 4
- Migration path from legacy data: Task 5

Placeholder scan:
- No `TODO`, `TBD`, or deferred placeholders remain in the plan.

Type consistency:
- Canonical sheet names remain consistent across schema docs, importer tests, importer implementation, and migration notes.

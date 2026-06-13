# Scholarship Sheet Schema

This document defines the canonical contributor-facing schema for the scholarship main sheet. Use this schema when creating or updating the Google Sheet that feeds the website.

## Editing Model

- One row represents one scholarship or funding opportunity.
- One column represents one concept only.
- Contributors should edit the main sheet, not the website JSON directly.
- Fields that allow multiple controlled values must store them in one cell using `|`.
- Columns backed by controlled vocabularies should use helper-sheet dropdown values where available.

## Delimiter Rule

Use `|` as the only delimiter for multi-value cells.

Valid examples:

- `研究|学位取得`
- `日本|永住権`
- `大学院(修士)|大学院(博士)`
- `米国|カナダ`

Do not use commas, slashes, Japanese punctuation, line breaks, or spaces as separators. If a column is not defined as multi-value below, keep it as a single value or free-text sentence.

## Contributor Guidance

- Put the official source page in `source_url`.
- Use controlled vocabulary values exactly as written in helper sheets.
- Keep narrative explanations in text columns such as `summary_ja`, `support_details_ja`, and requirement text columns.
- Leave a cell blank when information is unknown instead of guessing.
- Use ISO date format `YYYY-MM-DD` for date columns.
- Keep internal-only research notes in `notes_internal`; do not place them in public display columns.

## Main Sheet Columns

The canonical main-sheet columns must appear in this exact order.

Interpret these similarly named eligibility columns as follows:

- `eligible_education_levels`: broad applicant stage such as undergraduate or graduate level
- `eligible_program_categories`: program bucket such as master's, doctoral, postdoctoral, or PI-targeted
- `eligible_study_types`: what the opportunity supports doing, such as research or degree study
- `eligible_purposes`: the applicant's purpose for applying, such as research funding or degree pursuit

| Column | Group | Purpose | Input rule |
| --- | --- | --- | --- |
| `record_id` | Metadata | Stable internal identifier for this opportunity row. | Single value; unique per row. |
| `source_status` | Metadata | Current source tracking status such as `active`, `archived`, or `needs_review`. | Single controlled value. |
| `last_checked_date` | Metadata | Date the source information was last verified. | Single date in `YYYY-MM-DD`. |
| `notes_internal` | Metadata | Internal maintenance notes for contributors and reviewers. Not displayed publicly. | Free text. |
| `organization_ja` | Public Display | Japanese name of the organization offering the opportunity. | Free text. |
| `program_name_ja` | Public Display | Japanese display name of the scholarship or program. | Free text. |
| `program_name_en` | Public Display | English name of the scholarship or program when useful. | Free text; leave blank if unavailable. |
| `source_url` | Public Display | Canonical public source URL for the opportunity. | Single URL. |
| `summary_ja` | Public Display | Short Japanese overview used for public display and quick scanning. | Free text. |
| `support_details_ja` | Public Display | Japanese description of funding coverage or support details. | Free text. |
| `application_period_text_ja` | Public Display | Human-readable Japanese application timing summary shown to users. | Free text. |
| `public_notes_ja` | Public Display | Additional public notes that do not fit other display fields. | Free text. |
| `eligible_nationalities` | Eligibility | Nationality or residency categories that are eligible. | Multi-value with `|`. |
| `eligible_education_levels` | Eligibility | Education levels eligible to apply. | Multi-value with `|`. |
| `eligible_study_types` | Eligibility | Opportunity shape such as research or degree study. | Multi-value with `|`. |
| `eligible_program_categories` | Eligibility | Eligible program categories such as master's or doctoral programs. | Multi-value with `|`. |
| `eligible_purposes` | Eligibility | Applicant purpose categories supported by the opportunity. | Multi-value with `|`. |
| `eligible_fields` | Eligibility | Eligible academic or professional fields. | Multi-value with `|`. |
| `eligible_destination_countries` | Eligibility | Destination countries explicitly allowed by the opportunity. | Multi-value with `|`. |
| `age_requirement_text` | Eligibility | Age-related eligibility details if any. | Free text. |
| `language_requirement_text` | Eligibility | Language test or proficiency requirement details. | Free text. |
| `affiliation_requirement_text` | Eligibility | Affiliation or institutional enrollment requirements. | Free text. |
| `career_stage_text` | Eligibility | Career-stage constraints such as early-career or postdoctoral targeting. | Free text. |
| `other_requirement_text` | Eligibility | Other eligibility requirements not covered above. | Free text. |
| `funding_type` | Funding / Timing | Funding type category for the opportunity. | Single controlled value. |
| `destination_country_text` | Funding / Timing | Free-text explanation of destination coverage when a narrative note is needed. | Free text. |
| `overlap_policy_text` | Funding / Timing | Policy on overlapping funding or concurrent support. | Free text. |
| `application_open_date` | Funding / Timing | Structured application opening date when known. | Single date in `YYYY-MM-DD`. |
| `application_close_date` | Funding / Timing | Structured application closing date when known. | Single date in `YYYY-MM-DD`. |
| `application_cycle_text` | Funding / Timing | Human-readable cycle such as annual cadence or rolling basis. | Free text. |

## Helper Sheet Guidance

Helper sheets should provide approved values for controlled columns so contributors can select consistent entries from dropdowns instead of typing variants manually.

Recommended helper sheets:

- `vocab_purpose`
- `vocab_field`
- `vocab_destination_country`
- `vocab_study_type`
- `vocab_program_category`
- `vocab_funding_type`
- `vocab_nationality_scope` if needed
- `vocab_education_level` if needed

When a helper sheet exists for a column, contributors should use those values exactly and combine multiple selections with `|`.

## Review Checklist

Before adding or updating a row, confirm:

- the row still represents exactly one opportunity
- multi-value controlled fields use `|`
- URLs are only stored in `source_url`
- date fields use `YYYY-MM-DD`
- internal notes are kept out of public display columns

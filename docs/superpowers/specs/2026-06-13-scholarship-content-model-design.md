# Scholarship Content Model Design

## Summary

Redesign the scholarship database content model so contributors can keep updating a Google Spreadsheet, while the website consumes a cleaner, more structured dataset. The new workflow should make eligibility filtering more reliable, reduce input ambiguity, and keep spreadsheet editing approachable for non-technical contributors.

## Goals

- Make scholarship data easier to filter by eligibility on the website.
- Keep Google Sheets as the primary editing interface for contributors.
- Reduce ambiguous free-text input in fields that drive search and filtering.
- Establish a workflow where spreadsheet updates can be converted into website-ready structured data with minimal manual cleanup.

## Non-Goals

- No full relational database or backend admin panel in this phase.
- No requirement that contributors edit JSON directly.
- No attempt to perfectly auto-clean every legacy row without human review.

## Primary Outcome

The redesigned content model should prioritize eligibility filtering for end users. Contributor convenience matters, but the schema should be shaped by whether the site can reliably answer questions like:

- Can I apply as a master's student?
- Is this opportunity for research, degree study, or both?
- Is this open to my field?
- Is nationality restricted?
- Is the destination country limited?

## Recommended Overall Approach

Adopt a new canonical spreadsheet schema rather than continuing to evolve the legacy sheet in place. The old spreadsheet structure has too many blended fields, which makes both filtering and data cleanup unreliable. A cleaner v2 schema should become the long-term source of truth for contributors.

The new format should still remain spreadsheet-friendly:

- one main sheet for funding opportunities
- helper sheets for controlled vocabularies
- multi-value fields entered in a single cell using a standard delimiter

## Spreadsheet Structure

### Main Sheet

Create one main sheet where each row is exactly one opportunity. Each column should represent one concept only.

Suggested main-sheet groups:

- record metadata
- public display fields
- eligibility fields
- funding fields
- application timing fields
- maintenance/status fields

### Helper Sheets

Create helper sheets that define approved values for fields used in dropdowns or standard validation. These helper sheets should support consistency without forcing contributors into a database-like workflow.

Recommended helper sheets:

- `vocab_purpose`
- `vocab_field`
- `vocab_destination_country`
- `vocab_study_type`
- `vocab_program_category`
- `vocab_funding_type`
- `vocab_nationality_scope` if needed
- `vocab_education_level` if needed

These helper sheets should be used to power data validation rules in the main sheet where practical.

## Multi-Value Rule

For fields that may contain multiple values, contributors should enter values in a single cell using the delimiter `|`.

Examples:

- `研究|学位取得`
- `日本|永住権`
- `大学院(修士)|大学院(博士)`
- `米国|カナダ|英国`

The delimiter rule must be documented clearly in the sheet itself so contributors do not improvise commas, slashes, spaces, or line breaks.

## Canonical Main-Sheet Fields

The canonical sheet should separate concepts that are currently mixed together.

### Record Metadata

- `record_id`
- `source_status` such as active, archived, needs_review
- `last_checked_date`
- `notes_internal`

### Public Display Fields

- `organization_ja`
- `program_name_ja`
- `program_name_en` if useful
- `source_url`
- `summary_ja`
- `support_details_ja`
- `application_period_text_ja`
- `public_notes_ja`

### Eligibility Fields

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

### Funding / Opportunity Shape

- `funding_type`
- `destination_country_values`
- `destination_country_text` if a free-text explanation is needed
- `overlap_policy_text`

### Application Timing

- `application_open_date`
- `application_close_date`
- `application_cycle_text`

### Optional Status / Quality Fields

- `data_confidence`
- `needs_manual_review`
- `legacy_source_row_id`

## Field Design Principles

### Structured fields vs free text

Fields used for filtering should be structured and standardized. Fields meant for explanation should remain text.

Structured fields:

- purpose
- field
- nationality scope
- education level
- study type
- program category
- destination country
- funding type

Free-text fields:

- support details
- language requirement details
- affiliation requirement details
- age details
- notes

### Arrays at import time

The spreadsheet stays contributor-friendly, but the importer should convert delimited cells into arrays for the website JSON.

For example:

- sheet cell: `研究|学位取得`
- imported JSON: `["研究", "学位取得"]`

The website should filter against these arrays instead of trying to guess meaning from long combined strings.

### Generated display summary

The website may still show a combined `eligibility` summary, but that summary should be generated from the structured eligibility columns instead of being manually authored as one large mixed field.

## Contributor Workflow

The intended workflow is:

1. A contributor edits or adds a record in the Google Sheet.
2. They use dropdown choices where available.
3. They use `|` for fields that allow multiple values.
4. A sync/import script exports the sheet and converts the canonical sheet into structured JSON.
5. The website is updated from that JSON snapshot.

Contributors should not need to understand the website codebase or JSON schema directly.

## Validation Strategy

The spreadsheet should guide contributors gently instead of relying on perfect discipline.

Recommended validation:

- dropdown validation for controlled vocabularies
- header notes explaining the purpose of each column
- clear note that multi-value cells must use `|`
- optional formatting cues for required fields
- optional review/status columns for incomplete records

## Import Pipeline Expectations

The importer should be simpler than the current normalization logic because the canonical sheet will already separate concepts more cleanly.

The import step should:

- read the canonical sheet
- split `|`-delimited fields into arrays
- trim whitespace
- reject or flag unexpected vocabulary values where possible
- generate website JSON
- generate a human-readable eligibility summary from structured fields

## Migration Strategy

The migration should happen in phases.

### Phase 1: Define the canonical schema

- finalize field names
- finalize helper vocabularies
- document delimiter and validation rules

### Phase 2: Create the new Google Sheet layout

- add the new main sheet
- add helper sheets
- add dropdown validation and contributor notes

### Phase 3: Map legacy data into the new schema

- auto-map clean fields directly
- split multi-value legacy fields where possible
- flag rows that need manual cleanup

### Phase 4: Switch the website importer

- make the site importer read the canonical sheet format
- keep the generated JSON structure aligned with the website filters

## Risks

- Legacy rows contain blended text that will not convert perfectly without review.
- Controlled vocabularies can become too rigid if introduced without contributor guidance.
- If helper-sheet values are not curated, vocabulary drift can return quickly.

## Success Criteria

The redesign is successful when:

- contributors can add or edit a record in Google Sheets without special technical knowledge
- website filters operate on structured values instead of guessed text parsing
- eligibility-related filtering becomes more precise and predictable
- the importer becomes simpler and less fragile than the current cleanup step

## Implementation Boundary

This spec covers the content model and contributor workflow redesign. It does not yet define the exact migration script, Google Sheets automation, or deployment automation for synchronizing updates to GitHub Pages.

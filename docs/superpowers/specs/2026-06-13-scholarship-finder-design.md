# Scholarship Finder Design

## Summary

Build a static GitHub Pages website that helps Japanese students and researchers search for scholarships and fellowships they may be eligible for. The site will fetch the published Google Sheets CSV directly in the browser, reflect new spreadsheet edits without a repo data refresh, and provide fast client-side search and filtering with no backend.

## Goals

- Make the funding dataset easy to search and browse on desktop and mobile.
- Help users narrow opportunities by eligibility-related filters instead of scanning a spreadsheet manually.
- Keep deployment and maintenance simple enough for GitHub Pages.
- Let collaborators update the spreadsheet and have the website reflect those changes automatically.

## Non-Goals

- No user accounts, saved searches, or personalization in v1.
- No server-side database or dynamic API.
- No separate detail page per funding opportunity in v1.
- No admin UI inside the website.
- No write-back from the website to Google Sheets.

## Users

The first release targets both Japanese students and Japanese researchers looking for scholarships, fellowships, or related funding opportunities. Some users will browse broadly, while others will need to quickly filter by eligibility constraints such as education level, nationality, field, or study/research purpose.

## Source Data

The source is a published Google Sheets CSV containing scholarship and fellowship records. The deployed site will query that published CSV directly at runtime.

The canonical contributor-facing schema is documented in `docs/data-model/scholarship-sheet-schema.md`. The app should align to that schema first and tolerate partially filled rows or temporary missing columns gracefully.

Key columns expected from the current sheet include:

- `record_id`
- `source_status`
- `last_checked_date`
- `organization_ja`
- `program_name_ja`
- `program_name_en`
- `source_url`
- `summary_ja`
- `support_details_ja`
- `application_period_text_ja`
- `public_notes_ja`
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
- `funding_type`
- `destination_country_text`
- `overlap_policy_text`
- `application_open_date`
- `application_close_date`
- `application_cycle_text`

The app should ignore internal-only fields such as `notes_internal` and should skip unknown blank columns instead of failing.

## Runtime Data Model

The browser should parse the CSV header row dynamically and normalize each record into a consistent internal shape for filtering and rendering. The internal shape can use English code identifiers, but it should derive directly from the live schema:

- `id` from `record_id`
- `sourceStatus` from `source_status`
- `lastCheckedDate` from `last_checked_date`
- `organization` from `organization_ja`
- `title` from `program_name_ja`
- `titleEn` from `program_name_en`
- `sourceUrl` from `source_url`
- `summary` from `summary_ja`
- `supportDetails` from `support_details_ja`
- `applicationPeriodText` from `application_period_text_ja`
- `publicNotes` from `public_notes_ja`
- `nationalities` from `eligible_nationalities`
- `educationLevels` from `eligible_education_levels`
- `studyTypes` from `eligible_study_types`
- `programCategories` from `eligible_program_categories`
- `purposes` from `eligible_purposes`
- `fields` from `eligible_fields`
- `destinationCountries` from `eligible_destination_countries`
- `ageRequirementText` from `age_requirement_text`
- `languageRequirementText` from `language_requirement_text`
- `affiliationRequirementText` from `affiliation_requirement_text`
- `careerStageText` from `career_stage_text`
- `otherRequirementText` from `other_requirement_text`
- `fundingType` from `funding_type`
- `destinationCountryText` from `destination_country_text`
- `overlapPolicyText` from `overlap_policy_text`
- `applicationOpenDate` from `application_open_date`
- `applicationCloseDate` from `application_close_date`
- `applicationCycleText` from `application_cycle_text`

Multi-value controlled fields should be split on `|`, matching the schema guidance. Empty values should normalize to empty strings or empty arrays. Internal-only fields must not be rendered publicly.

For presentation purposes, the UI should also produce:

- `searchText`: one concatenated searchable string built from every public text field in the row
- `eligibilityBlocks`: labeled sections assembled from the structured eligibility columns

## Site Architecture

The project will be a plain HTML, CSS, and JavaScript static site suitable for GitHub Pages. The site will fetch the published CSV at runtime and render the full search interface in the browser.

Expected structure:

- `index.html` for the main page
- `styles.css` for layout and visual design
- `script.js` for CSV fetching, parsing, normalization, filtering, and rendering

No build framework is required for v1.

## User Experience

The homepage is the product. Users should immediately see:

- A search input for free-text matching
- A filter area for narrowing opportunities with tag-like categorical choices
- A results area that updates based on the current query and filters

The website UI should be in Japanese for the first release. Navigation labels, form labels, helper text, empty states, status messages, and result actions should all be written in Japanese. Internal code identifiers may remain English.

Results should display as stacked cards on both mobile and desktop in v1. Cards may become denser on wide screens, but the interface does not need a separate desktop table layout if that complicates the live-schema implementation.

Each result should show only the agreed public summary fields and should not expose the rest of the sheet contents in the visible card body.

The website should explicitly show these source-backed fields in the result UI:

- `運営団体`
- `プログラム名`
- `URL`
- `留学先国`
- `留学目的`
- `対象分野`
- `募集期限`

In the live sheet schema, the app should map these display fields from the currently published headers or their canonical equivalents:

- `運営団体` from `organization_ja` or the legacy Japanese header if the live sheet still uses it
- `プログラム名` from `program_name_ja` or the legacy Japanese header if the live sheet still uses it
- `URL` from `source_url` or the legacy Japanese header if the live sheet still uses it
- `留学先国` from `eligible_destination_countries`, `destination_country_text`, or the legacy Japanese header depending on the published sheet shape
- `留学目的` from `eligible_purposes` or the legacy Japanese header depending on the published sheet shape
- `対象分野` from `eligible_fields` or the legacy Japanese header depending on the published sheet shape
- `募集期限` from the most user-facing deadline field available in the live sheet, preferring an explicit deadline column if present

Fields with no data for a row should be omitted from that card instead of showing empty placeholders. Non-displayed public fields may still be used for search indexing and filter generation.

## Search Behavior

The keyword search should match across every public text field available in a row, not just the fields displayed in the visible card. This includes the displayed summary fields plus any additional public notes or eligibility-related text present in the live sheet.

Search should be case-insensitive where relevant and should support Japanese text naturally by using substring matching instead of English-centric token assumptions.

## Filters

The first release should auto-generate filters from stable categorical columns in the live sheet schema rather than relying on a frozen hand-maintained list. The initial visible filters should prioritize:

- `eligible_purposes`
- `eligible_fields`
- `funding_type`
- `eligible_destination_countries`
- `eligible_nationalities`
- `eligible_education_levels`
- `eligible_study_types`
- `eligible_program_categories`

The UI should present these as tags or chips that can be toggled on and off, rather than only as single-select dropdowns. Within one filter group, selecting multiple tags should behave as OR. Across different filter groups, active filters should combine as AND.

Even though the site may use additional live sheet columns for filtering and search, the public result presentation should stay limited to the seven visible fields above.

If a categorical column is completely absent or blank in the live sheet, the site should omit that filter group automatically.

## Live Data Refresh

The published Google Sheet is the canonical dataset for the deployed site. The refresh workflow should be:

1. A collaborator edits the main Google Sheet.
2. The published CSV reflects that change once Google publish output updates.
3. The website fetches the latest CSV on the next page load.

No repo data regeneration step is required for routine content updates.

## Error Handling

The site should fail gracefully:

- If the CSV cannot be loaded, show a clear error message instead of a blank page.
- If the CSV header changes unexpectedly, ignore unknown columns and continue rendering from recognized public columns when possible.
- If a record is missing a field, hide that field in the UI rather than showing broken placeholders.
- If filtering yields no matches, show a friendly empty-state message and encourage users to broaden filters.
- If the CSV contains quoted commas or line breaks, parsing logic must preserve row integrity instead of splitting incorrectly.

## Accessibility

The interface should be keyboard-usable and readable on both desktop and mobile. Form controls need clear labels, sufficient color contrast, and visible focus states. Expand/collapse interactions should use semantic buttons and accessible state indicators.

## Visual Direction

The interface should feel more like a focused research directory than a raw spreadsheet. It should be clean and efficient, with strong readability for dense text and a clear visual hierarchy between summary information and expanded details.

Because the audience is Japanese-speaking, typography and spacing should be chosen so Japanese text remains readable in long field values such as eligibility notes and target field descriptions.

## Testing

Before calling v1 complete, verify:

- The published CSV loads successfully on the static site.
- CSV parsing handles quoted values, commas, and multiline cells from Google Sheets output.
- Free-text search returns expected results for Japanese text.
- Free-word search covers every public text field in a row.
- Multiple tag filters combine correctly.
- The visible results show only the seven agreed fields.
- The site renders correctly under a GitHub Pages project path.
- Missing or partial data does not break rendering.
- Adding or editing a spreadsheet row is reflected on the site without updating repo data files.

## Open Decisions Resolved

- Hosting: GitHub Pages
- Stack: plain HTML, CSS, JavaScript
- Data source in deployed app: live published Google Sheets CSV
- Data refresh model: fetch live sheet on page load
- Audience: both students and researchers
- Result layout: responsive cards with no required expanded detail section
- Detail interaction: none required in v1 unless later needed for usability
- Search scope: every public text field in each row
- Filter strategy: auto-generated live tag filters from stable categorical columns

## Implementation Boundary

This spec covers a single v1 project and is focused enough for one implementation plan. It does not include spreadsheet authentication, collaborator permissions, multilingual UI expansion, or advanced ranking logic.

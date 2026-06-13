# Scholarship Finder Design

## Summary

Build a static GitHub Pages website that helps Japanese students and researchers search for scholarships and fellowships they may be eligible for. The site will use a repo-stored, cleaned JSON snapshot derived from the published spreadsheet and provide fast client-side search and filtering with no backend.

## Goals

- Make the funding dataset easy to search and browse on desktop and mobile.
- Help users narrow opportunities by eligibility-related filters instead of scanning a spreadsheet manually.
- Keep deployment and maintenance simple enough for GitHub Pages.

## Non-Goals

- No user accounts, saved searches, or personalization in v1.
- No server-side database or dynamic API.
- No separate detail page per funding opportunity in v1.
- No live sync with Google Sheets in v1.

## Users

The first release targets both Japanese students and Japanese researchers looking for scholarships, fellowships, or related funding opportunities. Some users will browse broadly, while others will need to quickly filter by eligibility constraints such as education level, nationality, field, or study/research purpose.

## Source Data

The source is a published Google Sheets CSV containing scholarship and fellowship records. The live sheet will not be queried directly by the deployed site in v1. Instead, the repo will contain a cleaned JSON snapshot generated from the spreadsheet.

Relevant source columns observed in the sheet include:

- `更新日`
- `CDWGdb_ID`
- `運営団体`
- `支援制度名`
- `URL_latest`
- `留学先国`
- `留学目的`
- `対象分野`
- `支援形式`
- `支援内容`
- `他助成との重複`
- `要件(抜粋)`
- `募集期間 (実施年)`
- `年齢`
- `国籍`
- `学歴`
- `言語`
- `その他`
- `募集開始`
- `募集終了`
- `コメント`
- `留学タイプ`
- `対象留学区分`

The source sheet also contains extra blank or noisy columns, so the app should only depend on a curated subset.

## Data Model

The cleaned JSON dataset should map each funding record into a consistent internal shape:

- `id`
- `updatedAt`
- `organization`
- `title`
- `sourceUrl`
- `destinationCountry`
- `purpose`
- `field`
- `fundingType`
- `supportDetails`
- `overlapPolicy`
- `eligibilitySummary`
- `applicationPeriodText`
- `ageRequirement`
- `nationalityRequirement`
- `educationRequirement`
- `languageRequirement`
- `otherRequirement`
- `applicationStart`
- `applicationEnd`
- `comment`
- `studyType`
- `programCategory`

Empty values should be normalized to empty strings or omitted in the rendered UI. The app should avoid exposing raw spreadsheet artifacts such as unnamed columns.

## Site Architecture

The project will be a plain HTML, CSS, and JavaScript static site suitable for GitHub Pages. The site will load a local JSON file at runtime and render the full search interface in the browser.

Expected structure:

- `index.html` for the main page
- `styles.css` for layout and visual design
- `script.js` for data loading, normalization, filtering, and rendering
- `data/*.json` for the cleaned funding dataset

No build framework is required for v1 unless a small local script is added later to regenerate the JSON snapshot.

## User Experience

The homepage is the product. Users should immediately see:

- A search input for free-text matching
- A filter area for narrowing opportunities
- A results area that updates based on the current query and filters

Results should display as:

- Mobile: stacked cards
- Desktop: compact table-like rows with expandable inline details

Each result should show the most useful summary fields first, such as title, organization, destination country, purpose, funding type, and date information. Expanding a result should reveal detailed eligibility and support information without navigating to a new page.

## Search Behavior

The keyword search should match across the most meaningful text fields, including:

- title
- organization
- purpose
- field
- eligibility summary
- support details
- comments

Search should be case-insensitive where relevant and should support Japanese text naturally by using substring matching instead of English-centric token assumptions.

## Filters

The first release should prioritize filters that help users determine eligibility quickly:

- Purpose (`留学目的`)
- Field (`対象分野`)
- Funding type (`支援形式`)
- Destination country (`留学先国`)
- Nationality requirement (`国籍`)
- Education requirement (`学歴`)
- Language requirement (`言語`)
- Study type (`留学タイプ`) if present and useful
- Program category (`対象留学区分`) if present and useful

If application start and end dates are consistent enough after cleaning, the UI may also include a simple application-status filter such as open, upcoming, closed, or unknown. If the date quality is too inconsistent, the first release should display dates without using them as a primary filter.

## Data Refresh Workflow

The JSON file in the repo is the canonical dataset for the deployed site. Updating the site should be a simple refresh flow:

1. Fetch or copy the latest spreadsheet data locally.
2. Clean and convert it into the repo JSON format.
3. Commit the updated data file.
4. Redeploy via GitHub Pages.

This manual workflow is acceptable for v1 and avoids adding fragile live integrations too early.

## Error Handling

The site should fail gracefully:

- If the JSON file cannot be loaded, show a clear error message instead of a blank page.
- If a record is missing a field, hide that field in the UI rather than showing broken placeholders.
- If filtering yields no matches, show a friendly empty-state message and encourage users to broaden filters.

## Accessibility

The interface should be keyboard-usable and readable on both desktop and mobile. Form controls need clear labels, sufficient color contrast, and visible focus states. Expand/collapse interactions should use semantic buttons and accessible state indicators.

## Visual Direction

The interface should feel more like a focused research directory than a raw spreadsheet. It should be clean and efficient, with strong readability for dense text and a clear visual hierarchy between summary information and expanded details.

## Testing

Before calling v1 complete, verify:

- The JSON dataset loads successfully on the static site.
- Free-text search returns expected results for Japanese text.
- Multiple filters combine correctly.
- Inline expand/collapse works on mobile and desktop.
- The site renders correctly under a GitHub Pages project path.
- Missing or partial data does not break rendering.

## Open Decisions Resolved

- Hosting: GitHub Pages
- Stack: plain HTML, CSS, JavaScript
- Data source in deployed app: local repo snapshot, not live Google Sheets
- Data format in repo: cleaned JSON
- Audience: both students and researchers
- Result layout: cards on mobile, table-like rows on desktop
- Detail interaction: inline expansion only

## Implementation Boundary

This spec covers a single v1 project and is focused enough for one implementation plan. It does not include future automation for syncing data, multilingual UI expansion, or advanced ranking logic.

# Scholarship Finder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Japanese-language static site that reads the published Google Sheet CSV at runtime, lets users filter with tags and free-word search, and shows only seven public fields in each result card.

**Architecture:** Keep the app as one HTML page with one stylesheet and one JavaScript module, but move data loading from repo JSON to a live published CSV fetch. Split the JavaScript into pure parsing and filtering helpers that can be tested with `node --test`, then use those helpers to drive the browser UI, auto-generated tag filters, and seven-field result cards.

**Tech Stack:** HTML, CSS, vanilla JavaScript modules, Node built-in test runner, static hosting via GitHub Pages

---

## File Structure

- Modify: `index.html`
- Modify: `styles.css`
- Modify: `script.js`
- Modify: `README.md`
- Create: `tests/script.test.js`

Responsibilities:

- `index.html`: page structure for keyword search, tag-filter groups, status region, and results region
- `styles.css`: responsive layout, chip-style tag filters, result-card presentation, focus states, and empty/error states
- `script.js`: published CSV fetch, CSV parsing, row normalization, live filter generation, keyword filtering, and card rendering
- `tests/script.test.js`: regression tests for CSV parsing, row normalization, free-word search, and tag filtering
- `README.md`: local preview instructions and explanation that the deployed site reads the published sheet directly

### Task 1: Reshape the page shell for live tags and seven-field cards

**Files:**
- Modify: `index.html`
- Modify: `styles.css`

- [ ] **Step 1: Write the failing DOM expectation in the test plan notes**

```txt
Expected DOM landmarks after this task:
- #keyword-input exists
- #filter-groups exists
- #results-count exists
- #status-message exists
- #results exists
- No hard-coded select elements for legacy snapshot fields remain
```

- [ ] **Step 2: Replace the filter sidebar markup in `index.html`**

```html
<main class="layout">
  <aside class="filters" aria-label="検索フィルター">
    <form id="search-form" class="filters-form">
      <label class="field">
        <span>フリーワード検索</span>
        <input
          id="keyword-input"
          name="keyword"
          type="search"
          placeholder="運営団体、プログラム名、留学先国、留学目的、対象分野、募集期限などで検索"
        />
      </label>

      <p class="filters-help">
        タグで絞り込みながら、フリーワードでも検索できます。
      </p>

      <div id="filter-groups" class="filter-groups" aria-live="polite"></div>

      <button type="button" id="clear-filters">条件をクリア</button>
    </form>
  </aside>

  <section class="results-panel" aria-labelledby="results-heading">
    <div class="results-toolbar">
      <div>
        <h2 id="results-heading">検索結果</h2>
        <p class="results-caption">公開中のスプレッドシートから最新データを表示します。</p>
      </div>
      <p id="results-count" aria-live="polite">データを読み込んでいます...</p>
    </div>

    <div id="status-message" class="status-message" role="status" hidden></div>
    <div id="results" class="results-list"></div>
  </section>
</main>
```

- [ ] **Step 3: Add chip-filter and seven-field card styles in `styles.css`**

```css
.filter-groups {
  display: grid;
  gap: 16px;
}

.filter-group {
  display: grid;
  gap: 10px;
}

.filter-group-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
}

.filter-chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.filter-chip {
  padding: 8px 12px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: #fffdf8;
  color: var(--ink);
}

.filter-chip[aria-pressed="true"] {
  border-color: var(--accent);
  background: rgba(31, 106, 82, 0.12);
  color: var(--accent-strong);
}

.result-card {
  display: grid;
  gap: 14px;
}

.result-title {
  margin: 0;
  font-size: 1.15rem;
  line-height: 1.4;
}

.result-grid {
  display: grid;
  gap: 10px;
}

.result-grid div {
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(214, 202, 181, 0.2);
}
```

- [ ] **Step 4: Run a local preview to verify the shell**

Run: `python3 -m http.server 8000`
Expected: the page loads at `http://localhost:8000` with one keyword box, an empty filter-group container, and no legacy hard-coded dropdowns.

- [ ] **Step 5: Commit**

```bash
git add index.html styles.css
git commit -m "feat: reshape scholarship finder shell for live filters"
```

### Task 2: Add parser and filtering tests first

**Files:**
- Create: `tests/script.test.js`
- Modify: `script.js`

- [ ] **Step 1: Write the failing parser and filter tests**

```js
import test from "node:test";
import assert from "node:assert/strict";
import {
  FILTER_DEFINITIONS,
  buildSearchText,
  filterRecords,
  normalizeRow,
  parseCsv
} from "../script.js";

const csvText = `運営団体,プログラム名,URL,留学先国,留学目的,対象分野,募集期限,メモ
"A Foundation","Program One","https://example.com/1","米国|カナダ","研究|大学院","生命科学|自然科学","2026-07-01","家族帯同可"
"B Foundation","Program Two","https://example.com/2","英国","学部","人文・社会科学","2026-08-15",""`; 

test("parseCsv handles headered Google Sheets CSV", () => {
  const rows = parseCsv(csvText);
  assert.equal(rows.length, 2);
  assert.equal(rows[0]["プログラム名"], "Program One");
  assert.equal(rows[0]["メモ"], "家族帯同可");
});

test("normalizeRow keeps only public display fields and searchable text", () => {
  const [row] = parseCsv(csvText);
  const record = normalizeRow(row);
  assert.equal(record.title, "Program One");
  assert.deepEqual(record.destinationCountries, ["米国", "カナダ"]);
  assert.match(record.searchText, /家族帯同可/);
});

test("filterRecords applies keyword and tag filters together", () => {
  const records = parseCsv(csvText).map(normalizeRow);
  const filtered = filterRecords(records, {
    keyword: "家族帯同可",
    activeFilters: {
      destinationCountries: new Set(["米国"]),
      purposes: new Set(["研究"])
    }
  });

  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].title, "Program One");
});

test("FILTER_DEFINITIONS describes the visible tag groups", () => {
  assert.deepEqual(
    FILTER_DEFINITIONS.map((definition) => definition.key),
    ["destinationCountries", "purposes", "fields"]
  );
});
```

- [ ] **Step 2: Run the tests to confirm they fail**

Run: `node --test tests/script.test.js`
Expected: FAIL with missing exports such as `parseCsv` or `filterRecords`.

- [ ] **Step 3: Export minimal testable helpers from `script.js`**

```js
export const FILTER_DEFINITIONS = [
  { key: "destinationCountries", label: "留学先国" },
  { key: "purposes", label: "留学目的" },
  { key: "fields", label: "対象分野" }
];

export function buildSearchText(parts) {
  return parts
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function parseCsv(csvText) {
  return [];
}

export function normalizeRow(row) {
  return {
    id: "",
    organization: "",
    title: "",
    sourceUrl: "",
    destinationCountries: [],
    purposes: [],
    fields: [],
    deadline: "",
    searchText: buildSearchText([])
  };
}

export function filterRecords(records, state) {
  return records;
}
```

- [ ] **Step 4: Re-run the tests and confirm the specific behavior failures**

Run: `node --test tests/script.test.js`
Expected: FAIL with assertion mismatches instead of missing export errors.

- [ ] **Step 5: Commit**

```bash
git add tests/script.test.js script.js
git commit -m "test: add scholarship finder parser and filter tests"
```

### Task 3: Implement live CSV parsing and row normalization

**Files:**
- Modify: `script.js`
- Test: `tests/script.test.js`

- [ ] **Step 1: Implement the CSV parser with quoted-field support**

```js
export function parseCsv(csvText) {
  const rows = [];
  const currentRow = [];
  let currentValue = "";
  let inQuotes = false;

  for (let index = 0; index < csvText.length; index += 1) {
    const char = csvText[index];
    const nextChar = csvText[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentValue += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      currentRow.push(currentValue);
      currentValue = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }
      currentRow.push(currentValue);
      rows.push(currentRow.slice());
      currentRow.length = 0;
      currentValue = "";
      continue;
    }

    currentValue += char;
  }

  if (currentValue || currentRow.length) {
    currentRow.push(currentValue);
    rows.push(currentRow.slice());
  }

  const [headerRow = [], ...bodyRows] = rows.filter((row) => row.some((cell) => cell.trim() !== ""));
  return bodyRows.map((row) =>
    Object.fromEntries(headerRow.map((header, index) => [header.trim(), String(row[index] || "").trim()]))
  );
}
```

- [ ] **Step 2: Add header aliasing and multi-value splitting in `normalizeRow`**

```js
const HEADER_ALIASES = {
  organization: ["organization_ja", "運営団体"],
  title: ["program_name_ja", "プログラム名"],
  sourceUrl: ["source_url", "URL"],
  destinationCountries: ["eligible_destination_countries", "留学先国"],
  purposes: ["eligible_purposes", "留学目的"],
  fields: ["eligible_fields", "対象分野"],
  deadline: ["application_close_date", "募集期限"]
};

function firstValue(row, keys) {
  return keys.map((key) => String(row[key] || "").trim()).find(Boolean) || "";
}

function splitMultiValue(value) {
  return String(value || "")
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);
}

export function normalizeRow(row) {
  const organization = firstValue(row, HEADER_ALIASES.organization);
  const title = firstValue(row, HEADER_ALIASES.title);
  const sourceUrl = firstValue(row, HEADER_ALIASES.sourceUrl);
  const destinationCountries = splitMultiValue(firstValue(row, HEADER_ALIASES.destinationCountries));
  const purposes = splitMultiValue(firstValue(row, HEADER_ALIASES.purposes));
  const fields = splitMultiValue(firstValue(row, HEADER_ALIASES.fields));
  const deadline = firstValue(row, HEADER_ALIASES.deadline);

  return {
    id: sourceUrl || `${organization}-${title}`,
    organization,
    title,
    sourceUrl,
    destinationCountries,
    purposes,
    fields,
    deadline,
    searchText: buildSearchText(Object.values(row))
  };
}
```

- [ ] **Step 3: Implement combined keyword and tag filtering**

```js
export function filterRecords(records, state) {
  const keyword = String(state.keyword || "").trim().toLowerCase();
  const activeFilters = state.activeFilters || {};

  return records.filter((record) => {
    if (keyword && !record.searchText.includes(keyword)) {
      return false;
    }

    return FILTER_DEFINITIONS.every(({ key }) => {
      const selected = activeFilters[key];
      if (!selected || selected.size === 0) {
        return true;
      }

      return record[key].some((value) => selected.has(value));
    });
  });
}
```

- [ ] **Step 4: Run the parser and filter tests**

Run: `node --test tests/script.test.js`
Expected: PASS with 4 passing tests.

- [ ] **Step 5: Commit**

```bash
git add script.js tests/script.test.js
git commit -m "feat: implement live csv parsing and filtering helpers"
```

### Task 4: Wire the browser app to the live published spreadsheet

**Files:**
- Modify: `script.js`

- [ ] **Step 1: Add the live published CSV URL and runtime state**

```js
const CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRDmhP7BnaG5zxWE0YcfTK50ihAyHHn0JVHImnHw7ppcKBb4oQ1-WI2LdYoZQzyqCK2cTx6ccwqauFQ/pub?gid=29113515&single=true&output=csv";

const resultsElement = document.getElementById("results");
const resultsCountElement = document.getElementById("results-count");
const statusMessageElement = document.getElementById("status-message");
const formElement = document.getElementById("search-form");
const filterGroupsElement = document.getElementById("filter-groups");
const clearFiltersButton = document.getElementById("clear-filters");

const appState = {
  records: [],
  activeFilters: {
    destinationCountries: new Set(),
    purposes: new Set(),
    fields: new Set()
  }
};
```

- [ ] **Step 2: Fetch and normalize the live sheet rows**

```js
async function loadRecords() {
  const response = await fetch(CSV_URL);
  if (!response.ok) {
    throw new Error(`Failed to load sheet: ${response.status}`);
  }

  const csvText = await response.text();
  return parseCsv(csvText)
    .map(normalizeRow)
    .filter((record) => record.title || record.organization);
}
```

- [ ] **Step 3: Render auto-generated tag filters for the three visible groups**

```js
function collectFilterOptions(records, key) {
  return [...new Set(records.flatMap((record) => record[key]))].sort((a, b) => a.localeCompare(b, "ja"));
}

function renderFilterGroups(records) {
  filterGroupsElement.innerHTML = FILTER_DEFINITIONS.map(({ key, label }) => {
    const values = collectFilterOptions(records, key);
    if (values.length === 0) {
      return "";
    }

    const chips = values
      .map(
        (value) => `
          <button class="filter-chip" type="button" data-filter-key="${key}" data-filter-value="${value}" aria-pressed="false">
            ${value}
          </button>
        `
      )
      .join("");

    return `
      <section class="filter-group" aria-labelledby="filter-group-${key}">
        <h3 class="filter-group-title" id="filter-group-${key}">${label}</h3>
        <div class="filter-chip-list">${chips}</div>
      </section>
    `;
  }).join("");
}
```

- [ ] **Step 4: Boot the app and surface fetch errors**

```js
async function init() {
  try {
    appState.records = await loadRecords();
    renderFilterGroups(appState.records);
    applyFilters();
  } catch (error) {
    showStatus("データの読み込みに失敗しました。時間をおいて再度お試しください。");
    resultsCountElement.textContent = "0件";
    resultsElement.innerHTML = "";
    console.error(error);
  }
}

if (resultsElement && resultsCountElement && statusMessageElement) {
  init();
}
```

- [ ] **Step 5: Verify the live fetch in the browser**

Run: `python3 -m http.server 8000`
Expected: the page loads live spreadsheet rows and shows tag chips populated from current sheet values.

- [ ] **Step 6: Commit**

```bash
git add script.js
git commit -m "feat: load scholarship records from live published sheet"
```

### Task 5: Render seven-field cards and interactive filtering

**Files:**
- Modify: `script.js`
- Modify: `styles.css`

- [ ] **Step 1: Add result-card rendering for only the seven public fields**

```js
function renderFact(label, value) {
  if (!value) {
    return "";
  }

  return `<div><dt>${label}</dt><dd>${value}</dd></div>`;
}

function renderResults(records) {
  if (records.length === 0) {
    resultsElement.innerHTML = `
      <article class="empty-state">
        <h3>該当する制度が見つかりませんでした</h3>
        <p>検索語を変えるか、タグ条件を減らしてお試しください。</p>
      </article>
    `;
    return;
  }

  resultsElement.innerHTML = records
    .map((record) => `
      <article class="result-card">
        <div class="result-meta">
          ${record.organization ? `<p class="result-organization">${record.organization}</p>` : ""}
          ${record.title ? `<h3 class="result-title">${record.title}</h3>` : ""}
          ${record.sourceUrl ? `<a class="result-link" href="${record.sourceUrl}" target="_blank" rel="noreferrer">公式ページ</a>` : ""}
        </div>
        <dl class="result-grid">
          ${renderFact("留学先国", record.destinationCountries.join(" / "))}
          ${renderFact("留学目的", record.purposes.join(" / "))}
          ${renderFact("対象分野", record.fields.join(" / "))}
          ${renderFact("募集期限", record.deadline)}
        </dl>
      </article>
    `)
    .join("");
}
```

- [ ] **Step 2: Implement chip toggling, clear-filters, and keyword filtering**

```js
function getKeyword() {
  return new FormData(formElement).get("keyword") || "";
}

function applyFilters() {
  const filtered = filterRecords(appState.records, {
    keyword: getKeyword(),
    activeFilters: appState.activeFilters
  });

  resultsCountElement.textContent = `${filtered.length}件`;
  renderResults(filtered);
}

filterGroupsElement.addEventListener("click", (event) => {
  const button = event.target.closest(".filter-chip");
  if (!button) {
    return;
  }

  const key = button.dataset.filterKey;
  const value = button.dataset.filterValue;
  const selected = appState.activeFilters[key];

  if (selected.has(value)) {
    selected.delete(value);
    button.setAttribute("aria-pressed", "false");
  } else {
    selected.add(value);
    button.setAttribute("aria-pressed", "true");
  }

  applyFilters();
});

formElement.addEventListener("input", applyFilters);

clearFiltersButton.addEventListener("click", () => {
  formElement.reset();
  Object.values(appState.activeFilters).forEach((selected) => selected.clear());
  filterGroupsElement.querySelectorAll(".filter-chip").forEach((chip) => chip.setAttribute("aria-pressed", "false"));
  applyFilters();
});
```

- [ ] **Step 3: Add styles for the four visible facts and empty state**

```css
.result-grid dt {
  font-weight: 700;
}

.result-grid dd {
  margin: 6px 0 0;
  color: var(--muted);
}

.empty-state {
  border-radius: 16px;
  padding: 20px;
  background: rgba(214, 202, 181, 0.18);
}
```

- [ ] **Step 4: Verify the interactive behavior locally**

Run: `python3 -m http.server 8000`
Expected: keyword input narrows results, chips toggle on and off, clear resets everything, and each card shows only organization, title, URL, destination, purpose, field, and deadline.

- [ ] **Step 5: Commit**

```bash
git add script.js styles.css
git commit -m "feat: render live scholarship cards with tag filters"
```

### Task 6: Update docs and final verification

**Files:**
- Modify: `README.md`
- Test: `tests/script.test.js`

- [ ] **Step 1: Update `README.md` for the live-sheet workflow**

```md
## データ更新

このサイトは、公開中の Google スプレッドシート CSV をページ読み込み時に直接取得します。

1. メインのスプレッドシートを更新します。
2. 公開済み CSV に変更が反映されるのを待ちます。
3. サイトを再読み込みすると最新内容が表示されます。

サイト上に表示する項目は次の 7 項目です。

- 運営団体
- プログラム名
- URL
- 留学先国
- 留学目的
- 対象分野
- 募集期限
```

- [ ] **Step 2: Run the automated test file**

Run: `node --test tests/script.test.js`
Expected: PASS with all tests green.

- [ ] **Step 3: Run the browser verification pass**

Run: `python3 -m http.server 8000`
Expected: the site loads live spreadsheet data, renders only the seven agreed fields per card, and updates results correctly with keyword search and tag filters.

- [ ] **Step 4: Check the final diff scope**

Run: `git diff --stat`
Expected: changes are limited to `index.html`, `styles.css`, `script.js`, `README.md`, and `tests/script.test.js` plus the approved planning/spec docs if still intentionally tracked.

- [ ] **Step 5: Commit**

```bash
git add README.md tests/script.test.js index.html styles.css script.js
git commit -m "docs: explain live scholarship sheet workflow"
```

## Self-Review

Spec coverage check:

- Live published CSV data source: Tasks 2 to 4
- Seven visible result fields only: Task 5
- Free-word search across public row text: Tasks 2 and 3
- Auto-generated tag filters: Tasks 3 to 5
- Graceful error handling: Task 4
- Local verification and automated regression checks: Tasks 2, 3, and 6

Placeholder scan:

- No `TODO`, `TBD`, or “implement later” placeholders remain.
- Every code-changing step includes concrete code blocks or exact commands.

Type consistency check:

- Filter keys are consistently `destinationCountries`, `purposes`, and `fields`.
- Public card fields are consistently `organization`, `title`, `sourceUrl`, `destinationCountries`, `purposes`, `fields`, and `deadline`.

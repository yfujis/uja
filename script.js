const CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRDmhP7BnaG5zxWE0YcfTK50ihAyHHn0JVHImnHw7ppcKBb4oQ1-WI2LdYoZQzyqCK2cTx6ccwqauFQ/pub?gid=29113515&single=true&output=csv";

export const FILTER_DEFINITIONS = [
  { key: "destinationCountries", label: "留学先国" },
  { key: "purposes", label: "留学目的" },
  { key: "fields", label: "対象分野" }
];

const DISPLAY_LABELS = {
  organization: "運営団体",
  title: "プログラム名",
  sourceUrl: "URL",
  destinationCountries: "留学先国",
  purposes: "留学目的",
  fields: "対象分野",
  deadline: "募集期限"
};

const HEADER_ALIASES = {
  organization: ["organization_ja", "運営団体"],
  title: ["program_name_ja", "プログラム名"],
  sourceUrl: ["source_url", "URL"],
  destinationCountries: ["eligible_destination_countries", "留学先国"],
  purposes: ["eligible_purposes", "留学目的"],
  fields: ["eligible_fields", "対象分野"],
  deadline: ["application_close_date", "募集期限", "application_period_text_ja", "募集期間", "募集期間 (実施年)"]
};

const hasDocument = typeof document !== "undefined";

const resultsElement = hasDocument ? document.getElementById("results") : null;
const resultsCountElement = hasDocument ? document.getElementById("results-count") : null;
const statusMessageElement = hasDocument ? document.getElementById("status-message") : null;
const dataWarningElement = hasDocument ? document.getElementById("data-warning") : null;
const formElement = hasDocument ? document.getElementById("search-form") : null;
const filterGroupsElement = hasDocument ? document.getElementById("filter-groups") : null;
const clearFiltersButton = hasDocument ? document.getElementById("clear-filters") : null;

const appState = {
  records: [],
  activeFilters: Object.fromEntries(FILTER_DEFINITIONS.map(({ key }) => [key, new Set()]))
};

function normalizeValue(value) {
  return String(value || "").trim();
}

function escapeHtml(value) {
  return normalizeValue(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function showStatus(message) {
  if (!statusMessageElement) {
    return;
  }

  statusMessageElement.hidden = false;
  statusMessageElement.textContent = message;
}

function clearStatus() {
  if (!statusMessageElement) {
    return;
  }

  statusMessageElement.hidden = true;
  statusMessageElement.textContent = "";
}

function firstValue(row, keys) {
  return keys.map((key) => normalizeValue(row[key])).find(Boolean) || "";
}

function splitMultiValue(value) {
  return normalizeValue(value)
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);
}

export function buildSearchText(parts) {
  return parts
    .map((value) => normalizeValue(value))
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function parseCsv(csvText) {
  const rows = [];
  let currentRow = [];
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
      rows.push(currentRow);
      currentRow = [];
      currentValue = "";
      continue;
    }

    currentValue += char;
  }

  if (currentValue || currentRow.length) {
    currentRow.push(currentValue);
    rows.push(currentRow);
  }

  const normalizedRows = rows.filter((row) => row.some((cell) => normalizeValue(cell)));
  const [headerRow = [], ...bodyRows] = normalizedRows;
  const headers = headerRow.map((header) => normalizeValue(header));

  return bodyRows.map((row) =>
    Object.fromEntries(headers.map((header, index) => [header, normalizeValue(row[index])]))
  );
}

function getDeadlineValue(row) {
  const closeDate = firstValue(row, ["application_close_date", "募集期限"]);
  if (closeDate) {
    return closeDate;
  }

  return firstValue(row, ["application_period_text_ja", "募集期間", "募集期間 (実施年)"]);
}

export function normalizeRow(row) {
  const organization = firstValue(row, HEADER_ALIASES.organization);
  const title = firstValue(row, HEADER_ALIASES.title);
  const sourceUrl = firstValue(row, HEADER_ALIASES.sourceUrl);
  const destinationCountries = splitMultiValue(firstValue(row, HEADER_ALIASES.destinationCountries));
  const purposes = splitMultiValue(firstValue(row, HEADER_ALIASES.purposes));
  const fields = splitMultiValue(firstValue(row, HEADER_ALIASES.fields));
  const deadline = getDeadlineValue(row);

  return {
    id: normalizeValue(row.record_id) || sourceUrl || `${organization}-${title}`,
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

export function filterRecords(records, state) {
  const keyword = normalizeValue(state.keyword).toLowerCase();
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

function toSafeUrl(value) {
  const raw = normalizeValue(value);
  if (!raw) {
    return "";
  }

  try {
    const url = new URL(raw);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
}

function renderFact(label, value) {
  if (!value) {
    return "";
  }

  return `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`;
}

function renderResults(records) {
  if (!resultsElement) {
    return;
  }

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
    .map((record) => {
      const safeUrl = toSafeUrl(record.sourceUrl);

      return `
        <article class="result-card">
          <div class="result-meta">
            ${record.organization ? `<p class="result-organization">${escapeHtml(record.organization)}</p>` : ""}
            ${record.title ? `<h3 class="result-title">${escapeHtml(record.title)}</h3>` : ""}
            ${safeUrl ? `<a class="result-link" href="${escapeHtml(safeUrl)}" target="_blank" rel="noreferrer">公式ページ</a>` : ""}
          </div>
          <dl class="result-grid">
            ${renderFact(DISPLAY_LABELS.destinationCountries, record.destinationCountries.join(" / "))}
            ${renderFact(DISPLAY_LABELS.purposes, record.purposes.join(" / "))}
            ${renderFact(DISPLAY_LABELS.fields, record.fields.join(" / "))}
            ${renderFact(DISPLAY_LABELS.deadline, record.deadline)}
          </dl>
        </article>
      `;
    })
    .join("");
}

function collectFilterOptions(records, key) {
  return [...new Set(records.flatMap((record) => record[key]).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "ja")
  );
}

function renderFilterGroups(records) {
  if (!filterGroupsElement) {
    return;
  }

  filterGroupsElement.innerHTML = FILTER_DEFINITIONS.map(({ key, label }) => {
    const values = collectFilterOptions(records, key);
    if (values.length === 0) {
      return "";
    }

    const chips = values
      .map(
        (value) => `
          <button
            class="filter-chip"
            type="button"
            data-filter-key="${escapeHtml(key)}"
            data-filter-value="${escapeHtml(value)}"
            aria-pressed="false"
          >
            ${escapeHtml(value)}
          </button>
        `
      )
      .join("");

    return `
      <section class="filter-group" aria-labelledby="filter-group-${escapeHtml(key)}">
        <h3 class="filter-group-title" id="filter-group-${escapeHtml(key)}">${escapeHtml(label)}</h3>
        <div class="filter-chip-list">${chips}</div>
      </section>
    `;
  }).join("");
}

function updateDataWarning(records) {
  if (!dataWarningElement) {
    return;
  }

  const latest = records
    .map((record) => record.deadline)
    .find(Boolean);

  dataWarningElement.textContent = latest
    ? `公開中のスプレッドシートをもとに表示しています。募集期限は ${latest} など、応募前に必ず公式サイトの最新情報をご確認ください。`
    : "公開中のスプレッドシートをもとに表示しています。応募前に必ず公式サイトの最新情報をご確認ください。";
}

function getKeyword() {
  if (!formElement) {
    return "";
  }

  return normalizeValue(new FormData(formElement).get("keyword"));
}

function applyFilters() {
  if (!resultsCountElement) {
    return;
  }

  const filtered = filterRecords(appState.records, {
    keyword: getKeyword(),
    activeFilters: appState.activeFilters
  });

  resultsCountElement.textContent = `${filtered.length}件`;
  renderResults(filtered);
}

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

function bindEvents() {
  formElement?.addEventListener("input", applyFilters);

  clearFiltersButton?.addEventListener("click", () => {
    formElement?.reset();
    Object.values(appState.activeFilters).forEach((selected) => selected.clear());
    filterGroupsElement?.querySelectorAll(".filter-chip").forEach((chip) => {
      chip.setAttribute("aria-pressed", "false");
    });
    applyFilters();
  });

  filterGroupsElement?.addEventListener("click", (event) => {
    const button = event.target.closest(".filter-chip");
    if (!button) {
      return;
    }

    const { filterKey: key, filterValue: value } = button.dataset;
    const selected = appState.activeFilters[key];
    if (!selected) {
      return;
    }

    if (selected.has(value)) {
      selected.delete(value);
      button.setAttribute("aria-pressed", "false");
    } else {
      selected.add(value);
      button.setAttribute("aria-pressed", "true");
    }

    applyFilters();
  });
}

async function initializeApp() {
  if (!resultsElement || !resultsCountElement || !statusMessageElement) {
    return;
  }

  clearStatus();
  resultsElement.innerHTML = "";
  resultsCountElement.textContent = "データを読み込んでいます...";

  try {
    appState.records = await loadRecords();
    updateDataWarning(appState.records);
    renderFilterGroups(appState.records);
    applyFilters();
  } catch (error) {
    console.error(error);
    showStatus("データの読み込みに失敗しました。時間をおいて再度お試しください。");
    resultsCountElement.textContent = "0件";
    renderResults([]);
  }
}

if (hasDocument) {
  bindEvents();
  initializeApp();
}

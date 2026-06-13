const DATA_PATH = "./data/scholarships.json";

const resultsElement = document.getElementById("results");
const resultsCountElement = document.getElementById("results-count");
const statusMessageElement = document.getElementById("status-message");
const dataWarningElement = document.getElementById("data-warning");
const formElement = document.getElementById("search-form");
const clearFiltersButton = document.getElementById("clear-filters");

const filterConfig = [
  ["purpose-filter", "purpose"],
  ["field-filter", "field"],
  ["funding-type-filter", "fundingType"],
  ["destination-filter", "destinationCountry"],
  ["nationality-filter", "nationalityRequirement"],
  ["education-filter", "educationRequirement"],
  ["language-filter", "languageRequirement"],
  ["study-type-filter", "studyType"],
  ["program-category-filter", "programCategory"]
];

let scholarships = [];

function showStatus(message) {
  statusMessageElement.hidden = false;
  statusMessageElement.textContent = message;
}

function clearStatus() {
  statusMessageElement.hidden = true;
  statusMessageElement.textContent = "";
}

function normalizeValue(value) {
  return String(value || "").trim();
}

function normalizeScholarship(record) {
  return {
    id: normalizeValue(record.id),
    organization: normalizeValue(record.organization),
    title: normalizeValue(record.title),
    sourceUrl: normalizeValue(record.sourceUrl),
    destinationCountry: normalizeValue(record.destinationCountry),
    purpose: normalizeValue(record.purpose),
    field: normalizeValue(record.field),
    fundingType: normalizeValue(record.fundingType),
    applicationPeriodText: normalizeValue(record.applicationPeriodText),
    nationalityRequirement: normalizeValue(record.nationalityRequirement),
    educationRequirement: normalizeValue(record.educationRequirement),
    languageRequirement: normalizeValue(record.languageRequirement),
    studyType: normalizeValue(record.studyType),
    programCategory: normalizeValue(record.programCategory),
    updatedAt: normalizeValue(record.updatedAt),
    eligibility: normalizeValue(record.eligibility),
    supportDetails: normalizeValue(record.supportDetails),
    comment: normalizeValue(record.comment)
  };
}

function escapeHtml(value) {
  return normalizeValue(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function loadScholarships() {
  const response = await fetch(DATA_PATH);
  if (!response.ok) {
    throw new Error(`Failed to load dataset: ${response.status}`);
  }

  const data = await response.json();
  if (!Array.isArray(data)) {
    throw new Error("Dataset format is invalid.");
  }

  return data.map(normalizeScholarship);
}

function splitFilterValues(value, key = "") {
  const delimiter = key === "studyType" || key === "programCategory"
    ? /\s*\/\s*|\s*[;,，]\s*|\n+|\s{1,}/
    : /\s*\/\s*|\s*[;,，]\s*|\n+/;

  return normalizeValue(value)
    .split(delimiter)
    .map((part) => part.trim())
    .filter(Boolean);
}

function populateSelectOptions(records) {
  for (const [elementId, key] of filterConfig) {
    const select = document.getElementById(elementId);
    const values = [...new Set(records.flatMap((record) => splitFilterValues(record[key], key)))]
      .filter(Boolean)
      .sort((a, b) =>
      a.localeCompare(b, "ja")
    );

    for (const value of values) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      select.append(option);
    }
  }
}

function getActiveFilters() {
  const formData = new FormData(formElement);
  return Object.fromEntries(formData.entries());
}

function matchesScholarship(record, filters) {
  const keyword = normalizeValue(filters.keyword).toLowerCase();
  const haystack = [
    record.title,
    record.organization,
    record.purpose,
    record.field,
    record.eligibility,
    record.supportDetails,
    record.comment
  ]
    .join(" ")
    .toLowerCase();

  if (keyword && !haystack.includes(keyword)) {
    return false;
  }

  for (const [, key] of filterConfig) {
    const selected = normalizeValue(filters[key]);
    if (selected && !splitFilterValues(record[key], key).includes(selected)) {
      return false;
    }
  }

  return true;
}

function renderFactItem(label, value) {
  if (!normalizeValue(value)) {
    return "";
  }

  return `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`;
}

function renderDetailBlock(label, value) {
  if (!normalizeValue(value)) {
    return "";
  }

  return `
    <div class="detail-block">
      <h4>${escapeHtml(label)}</h4>
      <p>${escapeHtml(value)}</p>
    </div>
  `;
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

function updateDataWarning(records) {
  const latest = records
    .map((record) => normalizeValue(record.updatedAt))
    .filter(Boolean)
    .map((value) => {
      const match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (!match) {
        return { raw: value, time: Number.NEGATIVE_INFINITY };
      }

      const [, month, day, year] = match;
      return {
        raw: value,
        time: new Date(Number(year), Number(month) - 1, Number(day)).getTime()
      };
    })
    .sort((a, b) => a.time - b.time)
    .at(-1)?.raw;

  if (latest) {
    dataWarningElement.textContent = `このデータは ${latest} 時点の公開情報をもとにしています。応募前に必ず公式サイトの最新募集要項をご確認ください。`;
  }
}

function renderEmptyState() {
  resultsElement.innerHTML = `
    <article class="empty-state">
      <h3>該当する制度が見つかりませんでした</h3>
      <p>検索語を変えるか、条件を減らしてお試しください。</p>
    </article>
  `;
}

function renderResults(records) {
  resultsElement.innerHTML = records
    .map((record) => {
      const recordId = escapeHtml(record.id || `record-${Math.random().toString(36).slice(2)}`);
      const detailsId = `details-${recordId}`;
      const safeUrl = toSafeUrl(record.sourceUrl);

      return `
        <article class="result-card" data-id="${recordId}">
          <div class="result-summary">
            <div class="result-meta">
              ${record.organization ? `<p class="result-organization">${escapeHtml(record.organization)}</p>` : ""}
              ${record.title ? `<h3 class="result-title">${escapeHtml(record.title)}</h3>` : ""}
            </div>
            ${
              safeUrl
                ? `<a class="result-link" href="${escapeHtml(safeUrl)}" target="_blank" rel="noreferrer">公式情報を見る</a>`
                : ""
            }
          </div>
          <dl class="result-facts">
            ${renderFactItem("留学先国", record.destinationCountry)}
            ${renderFactItem("留学目的", record.purpose)}
            ${renderFactItem("対象分野", record.field)}
            ${renderFactItem("支援形式", record.fundingType)}
            ${renderFactItem("募集期間", record.applicationPeriodText)}
          </dl>

          <button class="details-toggle" type="button" aria-expanded="false" aria-controls="${detailsId}">
            応募条件を表示
          </button>

          <div class="result-details" id="${detailsId}" hidden>
            ${renderDetailBlock("応募条件", record.eligibility)}
            ${renderDetailBlock("支援内容", record.supportDetails)}
          </div>
        </article>
      `;
    })
    .join("");
}

function applyFilters() {
  const filters = getActiveFilters();
  const filtered = scholarships.filter((record) => matchesScholarship(record, filters));
  resultsCountElement.textContent = `${filtered.length}件`;

  if (filtered.length === 0) {
    renderEmptyState();
    return;
  }

  renderResults(filtered);
}

async function initializeApp() {
  resultsElement.innerHTML = "";
  resultsCountElement.textContent = "データを読み込んでいます...";
  clearStatus();

  try {
    scholarships = await loadScholarships();
    updateDataWarning(scholarships);
    populateSelectOptions(scholarships);
    applyFilters();
  } catch (error) {
    console.error(error);
    showStatus("奨学金データを読み込めませんでした。時間をおいてもう一度お試しください。");
    resultsCountElement.textContent = "0件";
  }
}

formElement.addEventListener("input", applyFilters);
formElement.addEventListener("change", applyFilters);

clearFiltersButton.addEventListener("click", () => {
  formElement.reset();
  applyFilters();
});

resultsElement.addEventListener("click", (event) => {
  const toggle = event.target.closest(".details-toggle");
  if (!toggle) {
    return;
  }

  const card = toggle.closest(".result-card");
  const details = card.querySelector(".result-details");
  const expanded = toggle.getAttribute("aria-expanded") === "true";

  toggle.setAttribute("aria-expanded", String(!expanded));
  toggle.textContent = expanded ? "応募条件を表示" : "応募条件を閉じる";
  details.hidden = expanded;
});

initializeApp();

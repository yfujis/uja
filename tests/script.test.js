import test from "node:test";
import assert from "node:assert/strict";
import {
  FILTER_DEFINITIONS,
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
      purposes: new Set(["研究"]),
      fields: new Set()
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

import { h, data, fmt, claimLinks } from "./util.js";
import { figure } from "./figure.js";
import { heatmap } from "./charts.js";

export const short = (label) => label.replace(/\s*\(.*\)$/, "");

const VIEW_FOR = { H1: ["#/types", "See the groups"], H2: ["methods.html#C15", "See the evidence"], H3: ["methods.html#C21", "See the evidence"], H5: ["#/forecast", "See the forecast lab"] };

const strip = (s) => s.replace(/[.\s]+$/, "");

export function hypothesisCard(hyp, meta) {
  const [href, text] = VIEW_FOR[hyp.id];
  return h(
    "div",
    { class: "card" },
    h("div", { class: "how" }, `Hypothesis ${hyp.id}, written down before the analysis`),
    h("p", {}, hyp.statement),
    h("p", {}, "Result: ", h("span", { class: "verdict" }, hyp.verdict)),
    meta ? h("p", { class: "how" }, strip(meta.claims[hyp.claim_id].claim), ". ") : null,
    h("a", { href }, text),
  );
}

function coverageTable(cov, labels) {
  let sortKey = "mean";
  let dir = 1;
  let indicator = "mean";
  let query = "";
  const body = h("tbody");
  const head = h("tr");
  const tableEl = h("table", {}, h("caption", {}, `Share of years ${cov.years[0]} to ${cov.years[cov.years.length - 1]} with a value, by economy`), h("thead", {}, head), body);
  const sel = h(
    "select",
    { id: "cov-ind" },
    h("option", { value: "mean" }, `Average of all ${cov.indicators.length} indicators`),
    cov.indicators.map((k) => h("option", { value: k }, short(labels[k].label))),
  );
  const search = h("input", { type: "search", id: "cov-q", autocomplete: "off" });
  const value = (e) => (indicator === "mean" ? d3.mean(Object.values(e.coverage)) : e.coverage[indicator]);
  const cols = [
    { key: "name", label: "Economy", left: true },
    { key: "region", label: "Region", left: true },
    { key: "income", label: "Income group", left: true },
    { key: "mean", label: "Years with data" },
  ];
  function draw() {
    head.replaceChildren(
      ...cols.map((c) =>
        h(
          "th",
          { scope: "col", class: c.left ? "l" : "", "aria-sort": sortKey === c.key ? (dir === 1 ? "ascending" : "descending") : "none" },
          h("button", { type: "button", onclick: () => { dir = sortKey === c.key ? -dir : 1; sortKey = c.key; draw(); } }, c.label, sortKey === c.key ? (dir === 1 ? " ▲" : " ▼") : ""),
        ),
      ),
    );
    const q = query.trim().toLowerCase();
    const rows = cov.economies
      .filter((e) => !q || e.name.toLowerCase().includes(q) || e.iso3.toLowerCase() === q)
      .map((e) => ({ ...e, mean: value(e) }))
      .sort((a, b) => (sortKey === "mean" ? (a.mean - b.mean) * dir : String(a[sortKey]).localeCompare(String(b[sortKey])) * dir));
    body.replaceChildren(
      ...rows.map((e) =>
        h("tr", {}, h("th", { scope: "row", class: "l" }, h("a", { href: `#/country?e=${e.iso3}` }, e.name)), h("td", { class: "l" }, e.region), h("td", { class: "l" }, e.income), h("td", {}, fmt.pct(e.mean))),
      ),
    );
    count.textContent = `${rows.length} of ${cov.economies.length} economies`;
  }
  const count = h("p", { class: "how", role: "status" });
  sel.addEventListener("change", () => { indicator = sel.value; draw(); });
  search.addEventListener("input", () => { query = search.value; draw(); });
  draw();
  return h(
    "div",
    {},
    h("div", { class: "controls" }, h("div", {}, h("label", { for: "cov-ind" }, "Indicator"), sel), h("div", {}, h("label", { for: "cov-q" }, "Find an economy"), search)),
    count,
    h("div", { class: "tablewrap", tabindex: "0", role: "region", "aria-label": "Coverage by economy, scrollable table" }, tableEl),
  );
}

export function coverageFigure(meta, cov) {
  const labels = Object.fromEntries(meta.indicators.map((i) => [i.key, i]));
  const last = cov.years.length - 1;
  const at = cov.indicators.map((k) => ({ k, v: cov.by_year[k][last] })).sort((a, b) => b.v - a.v);
  const hi = at[0];
  const lo = at[at.length - 1];
  return figure({
    title: "How many economies have data, by indicator and year",
    takeaway: `In ${cov.years[last]}, ${short(labels[hi.k].label).toLowerCase()} is available for ${fmt.pct(hi.v)} of economies and ${short(labels[lo.k].label).toLowerCase()} for ${fmt.pct(lo.v)}.`,
    how: `Each row is an indicator, each column a year, and each cell shows the percentage of the ${meta.counts.economies} economies with a value. Darker means more complete.`,
    alt: `Heatmap of the percentage of economies with data for each of ${cov.indicators.length} indicators from ${cov.years[0]} to ${cov.years[last]}. In ${cov.years[last]}, ${short(labels[hi.k].label)} is the most complete and ${short(labels[lo.k].label)} the sparsest. The same numbers are in the table.`,
    wide: true,
    provenance: cov.provenance,
    claims: ["C1", "C2", "C3"],
    draw: (el) => heatmap(el, { years: cov.years, rows: cov.indicators.map((k) => ({ label: short(labels[k].label), values: cov.by_year[k] })) }),
    table: () => ({
      caption: "Share of economies with a value (0 to 1)",
      columns: [{ key: "year", label: "Year", header: true }, ...cov.indicators.map((k) => ({ label: short(labels[k].label), value: (r) => cov.by_year[k][r.i], fmt: (v) => v.toFixed(3) }))],
      rows: cov.years.map((year, i) => ({ year, i })),
    }),
  });
}

export async function overview() {
  const [meta, cov] = await Promise.all([data("meta"), data("coverage")]);
  const labels = Object.fromEntries(meta.indicators.map((i) => [i.key, i]));
  const counts = d3.rollup(meta.hypotheses, (v) => v.length, (x) => x.verdict);
  const tally = [...counts].map(([v, n]) => `${n} ${v}`).join(", ");
  const heat = coverageFigure(meta, cov);
  const legend = h("div", { class: "legend", "aria-hidden": "true" }, Array.from({ length: 5 }, (_, i) => `${i * 20}–${i === 4 ? 100 : i * 20 + 19}%`).map((t, i) => h("span", {}, h("i", { class: `s${i}` }), t)));
  const caveats = ["C2", "C3", "C4", "C5"].map((id) => meta.claims[id]);
  return h(
    "div",
    {},
    h("h1", {}, "How much do the data cover, and what do they show?"),
    h("p", { class: "lede" }, `${meta.counts.economies} economies, ${meta.counts.indicators} indicators, ${meta.vintage.window[0]} to ${meta.vintage.window[1]}. This explorer starts with what the data cover, then looks at one economy at a time, at whether economies fall into stable groups, and at how well next year’s inflation and growth can be forecast. Every chart has a table of the same numbers and a note on where they came from.`),
    h("h2", {}, "Four questions I asked before looking"),
    h("p", { class: "how" }, `Each was written down, with the result that would prove it wrong, before any analysis. Results: ${tally}.`),
    h("div", { class: "cards" }, meta.hypotheses.map((x) => hypothesisCard(x, meta))),
    h("h2", {}, "What data exist"),
    heat,
    legend,
    h("h2", {}, "Which economies have the least data"),
    h("p", { class: "how" }, "“Economy” includes territories and special regions, not only countries. Economies with little data are mostly small ones, so gaps are not random."),
    coverageTable(cov, labels),
    h(
      "div",
      { class: "note" },
      h("h3", {}, "Read the gaps before the charts"),
      caveats.map((c) => h("p", {}, `${strip(c.claim)}. Caveat: ${strip(c.caveat)}.`)),
      h("p", {}, "Claims: ", claimLinks(["C2", "C3", "C4", "C5"])),
    ),
  );
}

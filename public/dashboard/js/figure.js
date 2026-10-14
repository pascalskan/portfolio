// A figure = title, one-sentence takeaway, how to read it, the chart, a table of the same numbers,
// and a "data and source" panel naming the JSON file, the output files and the checked claims.
import { h, claimLinks } from "./util.js";

let counter = 0;

export function buildTable(spec) {
  const { caption, columns, rows } = spec;
  const head = h(
    "tr",
    {},
    columns.map((c) => h("th", { scope: "col", class: c.left ? "l" : "" }, c.label)),
  );
  const body = rows.map((r) =>
    h(
      "tr",
      {},
      columns.map((c, i) => {
        const v = typeof c.value === "function" ? c.value(r) : r[c.key];
        const cell = c.fmt ? c.fmt(v, r) : v == null ? "no data" : v;
        return i === 0 && c.header
          ? h("th", { scope: "row", class: "l" }, cell)
          : h("td", { class: c.left ? "l" : "" }, cell);
      }),
    ),
  );
  return h(
    "table",
    {},
    caption ? h("caption", {}, caption) : null,
    h("thead", {}, head),
    h("tbody", {}, body),
  );
}

// opts: title, takeaway, how, alt, draw(plotEl), table (spec or function), provenance, wide, headingLevel
export function figure(opts) {
  const id = `fig${++counter}`;
  const level = opts.headingLevel || "h3";
  const plot = h("div", { class: `plot${opts.wide ? " wide" : ""}`, id: `${id}-plot` });
  if (opts.wide) {
    plot.setAttribute("tabindex", "0");
    plot.setAttribute("role", "region");
    plot.setAttribute("aria-label", `${opts.title}, scrollable chart`);
  }
  const tableHolder = h("div", { id: `${id}-table`, hidden: true });
  let tableBuilt = false;
  const toggle = h(
    "button",
    { type: "button", "aria-pressed": "false", "aria-controls": `${id}-table` },
    "Show as table",
  );
  toggle.addEventListener("click", () => {
    const on = toggle.getAttribute("aria-pressed") !== "true";
    toggle.setAttribute("aria-pressed", String(on));
    toggle.textContent = on ? "Hide table" : "Show as table";
    if (on && !tableBuilt) {
      const spec = typeof opts.table === "function" ? opts.table() : opts.table;
      tableHolder.append(h("div", { class: "tablewrap", tabindex: "0", role: "region", "aria-label": `${opts.title}, table` }, buildTable(spec)));
      tableBuilt = true;
    }
    tableHolder.hidden = !on;
  });
  const p = opts.provenance;
  const source = p
    ? h(
        "details",
        { class: "src" },
        h("summary", {}, "Data and source"),
        h(
          "ul",
          {},
          h("li", {}, "Loaded from ", h("code", {}, `data/${p.file}`), `, built ${p.built.slice(0, 10)}`),
          h("li", {}, "Made from: ", p.sources.map((s) => h("code", { class: "chipcode" }, s + " "))),
          p.claims.length ? h("li", {}, "Claims: ", claimLinks(opts.claims || p.claims)) : null,
          h("li", {}, p.note),
        ),
      )
    : null;
  const fig = h(
    "figure",
    { class: "chart fade", id },
    h(
      "figcaption",
      {},
      h(level, {}, opts.title, opts.badge ? [" ", h("span", { class: "chip", title: opts.badgeTitle || "" }, opts.badge)] : null),
      opts.takeaway ? h("p", { class: "takeaway" }, opts.takeaway) : null,
      opts.how ? h("p", { class: "how" }, "How to read this: ", opts.how) : null,
      opts.note ? h("p", { class: "how" }, opts.note) : null,
    ),
    plot,
    h("div", { class: "tools" }, toggle, source),
    tableHolder,
  );
  // draw after the node exists so d3 can measure it
  const svg = opts.draw(plot);
  if (svg) {
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", opts.alt || opts.title);
  }
  return fig;
}

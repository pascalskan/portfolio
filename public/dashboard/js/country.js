import { h, data, setParams, indicatorValue, fmt, claimLinks } from "./util.js";
import { figure } from "./figure.js";
import { lineChart } from "./charts.js";
import { short } from "./overview.js";

export const MODEL_NAMES = {
  ridge_level: "Ridge regression (level)",
  ridge_change: "Ridge regression (change)",
  lgbm_level: "LightGBM (level)",
  lgbm_change: "LightGBM (change)",
  persistence: "Same as last year",
  trailing_mean: "Five-year average",
  peer_median: "Income-group median",
  ar1: "Per-economy autoregression",
};

const SCALE = { gdp_per_capita_ppp: "log", population: "log", inflation_cpi: "symlog" };
const ZERO = new Set(["gdp_growth", "current_account_pct_gdp"]);
const EVENT_ON = { recession: "gdp_growth", inflation_spike: "inflation_cpi", debt_jump: "gen_govt_gross_debt_pct_gdp" };
let EVENT_NAME = {};
function eventNames(c) {
  const e = c.events;
  return {
    recession: `Recession (growth below ${e.recession.max_growth_pct}%)`,
    inflation_spike: `Inflation spike (${e.inflation_spike.min_level_pct}% or more, up ${e.inflation_spike.min_rise_pp} points)`,
    debt_jump: `Debt jump (${e.debt_jump.min_rise_pp} points of GDP or more in one year)`,
  };
}

const compact = d3.format("~s");
function tickFmt(key) {
  if (key === "population") return (d) => compact(d).replace("G", "bn");
  if (key === "gdp_per_capita_ppp") return (d) => "$" + compact(d);
  return (d) => d3.format("~s")(d);
}

function summaryCards(meta, e, med, panel) {
  const last = panel.years.length - 1;
  return meta.indicators.map((ind) => {
    const s = e.series[ind.key];
    let i = last;
    while (i >= 0 && s[i] == null) i--;
    const m = i >= 0 ? med[ind.key][i] : null;
    return h(
      "div",
      { class: "card" },
      h("div", { class: "how" }, short(ind.label)),
      h("div", { class: "big" }, i >= 0 ? indicatorValue(ind, s[i]) : "no data"),
      i >= 0
        ? h("div", { class: "how" }, `in ${panel.years[i]}; income-group median ${m == null ? "not available" : indicatorValue(ind, m)}`)
        : h("div", { class: "how" }, "No value recorded for this economy"),
    );
  });
}

function profileCharts(meta, panel, e, med) {
  const grid = h("div", { class: "grid" });
  for (const ind of meta.indicators) {
    const s = e.series[ind.key];
    const m = med[ind.key];
    const have = s.map((v, i) => [panel.years[i], v]).filter(([, v]) => v != null);
    const events = e.events
      .filter(([, type]) => EVENT_ON[type] === ind.key)
      .map(([year, type]) => ({ year, series: 0, label: EVENT_NAME[type] }));
    let takeaway;
    if (have.length === 0) takeaway = "No values recorded for this economy.";
    else {
      const [y0, v0] = have[0];
      const [y1, v1] = have[have.length - 1];
      takeaway = have.length === 1 ? `Only ${y0} is recorded: ${indicatorValue(ind, v0)}.` : `${indicatorValue(ind, v0)} in ${y0}; ${indicatorValue(ind, v1)} in ${y1}.`;
      if (events.length) takeaway += ` ${events.length} marked event${events.length > 1 ? "s" : ""}.`;
    }
    const scaleNote = SCALE[ind.key] === "log" ? " Log scale." : SCALE[ind.key] === "symlog" ? " Compressed scale for very large values." : "";
    grid.append(
      figure({
        title: short(ind.label),
        badge: ind.status === "estimated" ? "estimate" : "reported",
        badgeTitle: ind.status === "estimated" ? "Survey- or model-based estimate, not a direct count" : "Reported by statistical offices",
        takeaway,
        note: ind.caveats ? `Caveat: ${ind.caveats}` : null,
        alt: `${short(ind.label)} for ${e.name}, ${panel.years[0]} to ${panel.years[panel.years.length - 1]}, against the ${e.income} median.${scaleNote} ${takeaway}`,
        provenance: panel.provenance,
        claims: ["C1", "C2"],
        draw: (el) =>
          lineChart(el, {
            years: panel.years,
            series: [
              { cls: "line-main", values: s, label: e.name.length > 18 ? e.iso3 : e.name },
              { cls: "line-ref", values: m, label: "Income-group median" },
            ],
            events,
            scale: SCALE[ind.key] || "linear",
            zeroLine: ZERO.has(ind.key),
            labelFmt: tickFmt(ind.key),
          }),
        table: {
          caption: `${short(ind.label)}, ${ind.unit}`,
          columns: [
            { key: "year", label: "Year", header: true },
            { label: e.name, value: (r) => s[r.i], fmt: (v) => (v == null ? "no data" : indicatorValue(ind, v)) },
            { label: `${e.income} median`, value: (r) => m[r.i], fmt: (v) => (v == null ? "no data" : indicatorValue(ind, v)) },
            { label: "Event", value: (r) => events.filter((x) => x.year === panel.years[r.i]).map((x) => x.label).join("; ") || "", fmt: (v) => v },
          ],
          rows: panel.years.map((year, i) => ({ year, i })),
        },
      }),
    );
  }
  return grid;
}

function forecastFigure(fe, iso, name, target, meta) {
  const c = meta.constants;
  const level = fmt.pct(c.interval_level);
  const tgt = fe[target];
  const e = tgt.economies[iso];
  const label = target === "inflation" ? "Inflation" : "GDP growth";
  if (!e) {
    return h("p", { class: "note" }, `${name} has no walk-forward forecasts for ${label.toLowerCase()}: too little history in the test years.`);
  }
  const back = target === "inflation" ? Math.sinh : (v) => v;
  const conv = (arr) => arr.map((v) => (v == null ? null : back(v)));
  const best = MODEL_NAMES[tgt.best_model];
  const actual = conv(e.actual);
  const mdl = conv(e.best);
  const per = conv(e.persistence);
  const lo = conv(e.lower);
  const hi = conv(e.upper);
  const nIv = lo.filter((v) => v != null).length;
  const inside = e.actual.filter((v, i) => e.lower[i] != null && v >= e.lower[i] && v <= e.upper[i]).length;
  const takeaway = nIv
    ? `${name}’s actual ${label.toLowerCase()} fell inside the ${level} interval in ${inside} of ${nIv} years with an interval (${c.interval_first_year} onward).`
    : `No interval is available for ${name}.`;
  return figure({
    title: `${label}: what the models predicted a year ahead, and what happened`,
    takeaway,
    how: `The dashed orange line and the grey line are forecasts made one year earlier, using only data up to that year; the blue line is what happened. The shaded band is a ${level} interval around the best model. ${target === "inflation" ? "Inflation was modelled on a compressed (asinh) scale and is shown here converted back to percent." : ""}`,
    alt: `${label} for ${name}, ${e.years[0]} to ${e.years[e.years.length - 1]}: actual values, one-year-ahead forecasts from ${best}, the same-as-last-year forecast, and a ${level} interval. ${takeaway}`,
    provenance: fe.provenance,
    claims: ["C24", "C26", "C28"],
    draw: (el) =>
      lineChart(el, {
        years: e.years,
        series: [
          { cls: "line-main", values: actual, label: "Actual" },
          { cls: "line-ref", values: mdl, label: `Best model: ${best}` },
          { cls: "line-grey", values: per, label: "Same as last year" },
        ],
        band: { lo, hi },
        width: 640,
        height: 260,
        unit: "%",
        zeroLine: true,
        scale: target === "inflation" ? "symlog" : "linear",
        labelFmt: d3.format("~s"),
      }),
    wide: true,
    table: {
      caption: `${label} (% per year), forecasts made one year earlier`,
      columns: [
        { key: "year", label: "Year", header: true },
        { label: "Actual", value: (r) => actual[r.i], fmt: (v) => fmt.num(v, 2) },
        { label: best, value: (r) => mdl[r.i], fmt: (v) => fmt.num(v, 2) },
        { label: "Same as last year", value: (r) => per[r.i], fmt: (v) => fmt.num(v, 2) },
        { label: `${level} interval low`, value: (r) => lo[r.i], fmt: (v) => fmt.num(v, 2) },
        { label: `${level} interval high`, value: (r) => hi[r.i], fmt: (v) => fmt.num(v, 2) },
      ],
      rows: e.years.map((year, i) => ({ year, i })),
    },
  });
}

export async function country(params) {
  const [meta, panel] = await Promise.all([data("meta"), data("panel")]);
  EVENT_NAME = eventNames(meta.constants);
  const byIso = new Map(panel.economies.map((e) => [e.iso3, e]));
  let iso = params.get("e");
  if (!byIso.has(iso)) iso = byIso.has("GBR") ? "GBR" : panel.economies[0].iso3;
  let target = params.get("t") === "growth" ? "growth" : "inflation";

  const out = h("div", {});
  const body = h("div", {});
  const forecastSlot = h("div", {});
  const select = h("select", { id: "econ" });
  const regions = d3.group(panel.economies, (e) => e.region);
  for (const [region, list] of [...regions].sort((a, b) => a[0].localeCompare(b[0]))) {
    select.append(h("optgroup", { label: region }, list.sort((a, b) => a.name.localeCompare(b.name)).map((e) => h("option", { value: e.iso3 }, e.name))));
  }
  select.value = iso;
  const radios = h(
    "fieldset",
    { class: "radios" },
    h("legend", {}, "Forecast target"),
    ["inflation", "growth"].map((t) =>
      h("label", {}, h("input", { type: "radio", name: "target", value: t, checked: t === target, onchange: () => { target = t; setParams({ t }); drawForecast(); } }), t === "inflation" ? "Inflation" : "GDP growth"),
    ),
  );
  const reset = h("button", { type: "button", onclick: () => { select.value = "GBR"; target = "inflation"; radios.querySelectorAll("input").forEach((r) => (r.checked = r.value === "inflation")); setParams({ e: null, t: null }); iso = byIso.has("GBR") ? "GBR" : panel.economies[0].iso3; select.value = iso; drawBody(); drawForecast(); } }, "Reset");

  async function drawForecast() {
    const e = byIso.get(iso);
    const fe = await data("forecast_econ");
    forecastSlot.replaceChildren(forecastFigure(fe, iso, e.name, target, meta));
  }
  function drawBody() {
    const e = byIso.get(iso);
    const med = panel.income_median[e.income] || {};
    const eventTypes = [...new Set(e.events.map(([, t]) => t))];
    body.replaceChildren(
      h("h2", {}, e.name),
      h("p", { class: "lede" }, `${e.region}. World Bank income group: ${e.income}. The dashed line in each chart is the median of the economies in the same income group, so it is a rough yardstick.`),
      h("h3", {}, "Latest values"),
      h("div", { class: "cards" }, summaryCards(meta, e, med, panel)),
      h("h2", {}, "Thirty years, indicator by indicator"),
      h("p", { class: "how" }, `Solid line: ${e.name}. Dashed line: income-group median. Open circles mark events defined before the analysis${eventTypes.length ? ` (here: ${eventTypes.map((t) => EVENT_NAME[t]).join("; ")})` : ""}. Gaps in a line mean no value was recorded.`),
      profileCharts(meta, panel, e, med),
      h("h2", {}, "Looking one year ahead"),
      h("p", { class: "how" }, "A forecast test, not a forecast: each point was predicted using only earlier years. These models are not fit for decisions about real places (see Methods and limits)."),
    );
  }
  select.addEventListener("change", () => {
    iso = select.value;
    setParams({ e: iso });
    drawBody();
    drawForecast();
  });
  drawBody();
  await drawForecast();
  out.append(
    h("h1", {}, "One economy at a time"),
    h("p", { class: "lede" }, `Pick an economy to see its ${meta.counts.indicators} indicators over ${panel.years[0]} to ${panel.years[panel.years.length - 1]} next to the median of its income group, the events flagged by simple rules, and how well a one-year-ahead forecast would have done.`),
    h("div", { class: "controls" }, h("div", {}, h("label", { for: "econ" }, "Economy"), select), radios, reset),
    body,
    forecastSlot,
    h("p", { class: "how" }, "Claims behind this page: ", claimLinks(["C1", "C2", "C15", "C17", "C24", "C26", "C28"])),
  );
  return out;
}

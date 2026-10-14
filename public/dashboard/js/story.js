// Fills the chart slots of the static story page from the same JSON the explorer uses.
import { h, data, fmt } from "./util.js";
import { figure } from "./figure.js";
import { lineChart, dotInterval } from "./charts.js";
import { coverageFigure } from "./overview.js";
import { stabilityFigure } from "./types.js";
import { panels } from "./forecast.js";

const TYPE_LABEL = { recession: "Recessions", debt_jump: "Debt jumps", inflation_spike: "Inflation spikes" };
const list = (a) => (a.length ? a.join(", ") : "none");

function shocksFigure(sh) {
  const order = ["recession", "debt_jump", "inflation_spike"];
  const years = sh.types.recession.yearly.map((r) => r.year);
  const cls = { recession: "line-main", debt_jump: "line-ref", inflation_spike: "line-grey" };
  const series = order.map((t) => ({ cls: cls[t], values: sh.types[t].yearly.map((r) => r.share), label: TYPE_LABEL[t] }));
  const takeaway = `Years that stand out above chance: ${order.map((t) => `${TYPE_LABEL[t].toLowerCase()} ${list(sh.types[t].global_years)}`).join("; ")}.`;
  return figure({
    title: "When shocks hit many economies at once",
    takeaway,
    how: "Each line is the share of economies with an event in that year. A year counts as shared only if its share is above what shuffling the years within each economy would produce (a stricter test than just being high).",
    alt: `Line chart of the share of economies with a recession, debt jump or inflation spike in each year from ${years[0]} to ${years[years.length - 1]}. ${takeaway}`,
    provenance: sh.provenance,
    claims: ["C15", "C16", "C17"],
    wide: true,
    draw: (el) => lineChart(el, { years, series, width: 640, height: 260, labelFmt: d3.format(".0%") }),
    table: {
      caption: "Share of economies with an event, by year (main thresholds)",
      columns: [
        { key: "year", label: "Year", header: true },
        ...order.flatMap((t) => [
          { label: `${TYPE_LABEL[t]} share`, value: (r) => sh.types[t].yearly[r.i].share, fmt: (v) => fmt.pct(v, 1) },
          { label: `${TYPE_LABEL[t]} chance level (95th percentile)`, value: (r) => sh.types[t].yearly[r.i].null_p95, fmt: (v) => fmt.pct(v, 1) },
          { label: `${TYPE_LABEL[t]} shared year`, value: (r) => (sh.types[t].yearly[r.i].global_year ? "yes" : ""), fmt: (v) => v },
        ]),
      ],
      rows: years.map((year, i) => ({ year, i })),
    },
  });
}

function convergenceFigure(cv, meta) {
  const boot = fmt.pct(meta.constants.bootstrap_level);
  const [, mid, late, whole] = cv.global;
  const takeaway = `Poorer economies grew faster in ${mid.period} (slope ${mid.slope.toFixed(2)}) but not in ${late.period} (${late.slope.toFixed(2)}); over the whole period ${whole.period} the slope is ${whole.slope.toFixed(2)}.`;
  return figure({
    title: "Catch-up depended on the decade",
    takeaway,
    how: `Each dot is the slope of growth on starting income: points of annual growth per unit of log starting income. Below zero means poorer economies grew faster. The line is a ${boot} interval; if it crosses zero the data cannot tell.`,
    alt: `Dot and interval chart of the catch-up slope for ${cv.global.map((r) => r.period).join(", ")}. ${takeaway}`,
    provenance: cv.provenance,
    claims: ["C19", "C20"],
    draw: (el) =>
      dotInterval(el, {
        items: cv.global.map((r) => ({ label: r === cv.global[cv.global.length - 1] ? `Whole period ${r.period}` : r.period, value: r.slope, lo: r.lo, hi: r.hi })),
        domain: [Math.min(-1.2, d3.min(cv.global, (r) => r.lo) - 0.1), Math.max(0.5, d3.max(cv.global, (r) => r.hi) + 0.1)],
        ref: 0,
        refLabel: "0 = no catch-up",
        labelW: 200,
      }),
    table: {
      caption: "Catch-up slope by period, all economies with data",
      columns: [
        { key: "period", label: "Period", header: true },
        { key: "slope", label: "Slope", fmt: (v) => v.toFixed(2) },
        { key: "lo", label: `${boot} low`, fmt: (v) => v.toFixed(2) },
        { key: "hi", label: `${boot} high`, fmt: (v) => v.toFixed(2) },
        { key: "n", label: "Economies", fmt: fmt.int },
      ],
      rows: cv.global,
    },
  });
}

function sigmaFigure(cv) {
  const years = cv.sigma.map((r) => r.year);
  const first = cv.sigma[0];
  const last = cv.sigma[cv.sigma.length - 1];
  const takeaway = `The spread of incomes across economies (standard deviation of log income) was ${first.sd.toFixed(2)} in ${first.year} and ${last.sd.toFixed(2)} in ${last.year}.`;
  return figure({
    title: "The spread of incomes barely narrowed",
    takeaway,
    how: "One line: how far apart economies’ incomes are, in logarithms. Falling means incomes grew closer together.",
    alt: `Line chart of the spread of log income per person across economies, ${first.year} to ${last.year}. ${takeaway}`,
    provenance: cv.provenance,
    claims: ["C22"],
    draw: (el) => lineChart(el, { years, series: [{ cls: "line-main", values: cv.sigma.map((r) => r.sd) }], width: 640, height: 240, labelFmt: d3.format(".2f") }),
    wide: true,
    table: {
      caption: "Standard deviation of log income per person",
      columns: [
        { key: "year", label: "Year", header: true },
        { key: "sd", label: "Spread", fmt: (v) => v.toFixed(3) },
        { key: "n", label: "Economies", fmt: fmt.int },
      ],
      rows: cv.sigma,
    },
  });
}

const BUILD = {
  coverage: async () => coverageFigure(...(await Promise.all([data("meta"), data("coverage")]))),
  stability: async () => stabilityFigure(...(await Promise.all([data("typology"), data("meta")]))),
  shocks: async () => shocksFigure(await data("shocks")),
  convergence: async () => convergenceFigure(...(await Promise.all([data("convergence"), data("meta")]))),
  sigma: async () => sigmaFigure(await data("convergence")),
  "forecast-mae": async () => {
    const [meta, fc] = await Promise.all([data("meta"), data("forecast")]);
    return panels(fc, "inflation", meta)[0];
  },
  "forecast-relative": async () => {
    const [meta, fc] = await Promise.all([data("meta"), data("forecast")]);
    return panels(fc, "inflation", meta)[1];
  },
};

for (const slot of document.querySelectorAll("[data-chart]")) {
  const make = BUILD[slot.dataset.chart];
  if (!make) continue;
  make()
    .then((fig) => slot.replaceChildren(fig))
    .catch((err) => slot.replaceChildren(h("p", { class: "note" }, `This chart could not be loaded: ${err.message}`)));
}

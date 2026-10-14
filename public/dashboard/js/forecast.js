import { h, data, setParams, fmt, claimLinks } from "./util.js";
import { figure } from "./figure.js";
import { barChart, dotInterval, lineChart } from "./charts.js";
import { MODEL_NAMES } from "./country.js";

const strip = (s) => s.replace(/[.\s]+$/, "");
const BASELINES = ["persistence", "trailing_mean", "peer_median", "ar1"];

export function panels(fc, target, meta, headLevel = "h3") {
  const t = fc[target];
  const best = t.best_model;
  const label = target === "inflation" ? "inflation" : "GDP growth";
  const unit = target === "inflation" ? "units of a compressed (asinh) scale for inflation" : "percentage points of growth";
  const pooled = [...t.pooled].sort((a, b) => a.mae - b.mae);
  const base = pooled.filter((r) => BASELINES.includes(r.method))[0];
  const per = t.pooled.find((r) => r.method === "persistence");
  const bestRow = t.pooled.find((r) => r.method === best);
  const c = meta.constants;
  const span = (a) => `${a[0]} to ${a[1]}`;
  const tests = span(c.test_years);
  const shocks = span(c.blocks.shocks);
  const shockScope = `${c.blocks.shocks[0]}-${c.blocks.shocks[1]}`;
  const calmScope = `${c.blocks.calm[0]}-${c.blocks.calm[1]}`;
  const level = fmt.pct(c.interval_level);
  const boot = fmt.pct(c.bootstrap_level);
  const out = [];

  out.push(
    figure({
      headingLevel: headLevel,
      title: `Average error by method: ${label}`,
      takeaway: `The best learned model (${MODEL_NAMES[best]}) has an average error of ${bestRow.mae.toFixed(target === "inflation" ? 3 : 2)}; “same as last year” has ${per.mae.toFixed(target === "inflation" ? 3 : 2)}; the strongest simple method (${MODEL_NAMES[base.method]}) has ${base.mae.toFixed(target === "inflation" ? 3 : 2)}.`,
      how: `Shorter bars are better forecasts. Average absolute error over test years ${tests}, measured in ${unit}. Grey: simple baselines. Blue: learned models. Each forecast uses only data up to the year before.`,
      alt: `Bar chart of average forecast error for eight methods for ${label}. ${MODEL_NAMES[pooled[0].method]} has the lowest error. Values are in the table.`,
      provenance: fc.provenance,
      claims: target === "inflation" ? ["C24", "C25"] : ["C26"],
      draw: (el) =>
        barChart(el, {
          items: pooled.map((r) => ({ label: MODEL_NAMES[r.method] + (r.method === best ? " (best learned)" : ""), value: r.mae, hl: !BASELINES.includes(r.method) })),
          format: d3.format(target === "inflation" ? ".3f" : ".2f"),
          labelW: 230,
        }),
      table: {
        caption: `Pooled forecast error, ${label}, test years ${tests}`,
        columns: [
          { label: "Method", value: (r) => MODEL_NAMES[r.method], header: true },
          { key: "n", label: "Forecasts", fmt: fmt.int },
          { key: "mae", label: "Mean absolute error", fmt: (v) => v.toFixed(3) },
          { key: "rmse", label: "Root mean squared error", fmt: (v) => v.toFixed(3) },
        ],
        rows: pooled,
      },
    }),
  );

  const sel = fc.selection.find((r) => r.target === target && r.rule === "any method");
  const fmtErr = d3.format(target === "inflation" ? ".3f" : ".2f");
  const selItems = [
    { label: "Same as last year", value: sel.mae_persistence },
    { label: `${MODEL_NAMES[sel.strongest_baseline]} (strongest simple method)`, value: sel.mae_strongest_baseline },
    { label: "Method picked from earlier years’ errors", value: sel.mae_selected, hl: true },
    { label: `${MODEL_NAMES[sel.hindsight_method]} (picked in hindsight)`, value: sel.mae_hindsight },
  ];
  const beats = sel.relative_to_persistence < 1;
  out.push(
    figure({
      headingLevel: headLevel,
      title: `What if the method had to be chosen in advance? ${label}`,
      takeaway: `Picked each year from the errors of earlier years, the method scores ${fmtErr(sel.mae_selected)}, against ${fmtErr(sel.mae_persistence)} for “same as last year” (ratio ${sel.relative_to_persistence.toFixed(2)}, ${boot} interval ${sel.rel_lo.toFixed(2)} to ${sel.rel_hi.toFixed(2)}). The model picked in hindsight scores ${fmtErr(sel.mae_hindsight)}. ${beats ? "The rule still beats persistence." : "The rule does not beat persistence."}`,
      how: `Every other chart here uses the model that did best on the test years, which is only known afterwards. This chart uses a rule that could have been run at the time: each year, take the method with the lowest error in earlier test years and score it on that year. It starts in ${sel.first_test_year}, once three earlier years exist. Shorter bars are better.`,
      alt: `Bar chart of average forecast error for ${label} from ${sel.first_test_year}: same as last year ${fmtErr(sel.mae_persistence)}, the strongest simple method ${fmtErr(sel.mae_strongest_baseline)}, a method picked from earlier years ${fmtErr(sel.mae_selected)}, and the hindsight winner ${fmtErr(sel.mae_hindsight)}. Values are in the table.`,
      provenance: fc.provenance,
      claims: ["C31"],
      draw: (el) => barChart(el, { items: selItems, format: fmtErr, labelW: 290, width: 700 }),
      table: {
        caption: `Average error from ${sel.first_test_year}, ${label}, on identical forecasts (${fmt.int(sel.n)} rows)`,
        columns: [
          { label: "Rule", value: (r) => r.label, header: true },
          { key: "value", label: "Mean absolute error", fmt: (v) => fmtErr(v) },
        ],
        rows: selItems,
      },
    }),
  );

  const rel = t.relative.filter((r) => r.method === best);
  const order = ["all years", calmScope, shockScope, "High income", "Upper middle income", "Lower middle income", "Low income"];
  rel.sort((a, b) => order.indexOf(a.scope) - order.indexOf(b.scope));
  const clear = rel.filter((r) => r.scope_type === "group" && r.hi < 1).length;
  const groups = rel.filter((r) => r.scope_type === "group").length;
  out.push(
    figure({
      headingLevel: headLevel,
      title: `Is the best model better than “same as last year”? ${label}`,
      takeaway: `Compared with “same as last year”, the best model’s error is ${fmt.num((1 - rel[0].ratio) * 100, 0)}% lower overall, and the whole interval is below 1 in ${clear} of ${groups} income groups.`,
      how: `Each dot is the best model’s average error divided by “same as last year”’s. Below 1 means the model did better. The line is a ${boot} interval from resampling economies. If the line crosses 1, the data cannot separate them.`,
      alt: `Dot and interval chart of relative error for ${label} overall, in two periods and in four income groups. Values are in the table.`,
      provenance: fc.provenance,
      claims: target === "inflation" ? ["C24", "C27"] : ["C26"],
      draw: (el) =>
        dotInterval(el, {
          items: rel.map((r) => ({ label: r.scope_type === "group" ? r.scope : r.scope_type === "block" ? `Years ${r.scope}` : "All test years", value: r.ratio, lo: r.lo, hi: r.hi })),
          domain: [Math.min(0.6, d3.min(rel, (r) => r.lo) - 0.05), Math.max(1.3, d3.max(rel, (r) => r.hi) + 0.05)],
          ref: 1,
          refLabel: "1 = same as last year",
          labelW: 190,
        }),
      table: {
        caption: `Best model (${MODEL_NAMES[best]}) error relative to persistence`,
        columns: [
          { key: "scope", label: "Scope", header: true },
          { key: "ratio", label: "Relative error", fmt: (v) => v.toFixed(3) },
          { key: "lo", label: `${boot} low`, fmt: (v) => v.toFixed(3) },
          { key: "hi", label: `${boot} high`, fmt: (v) => v.toFixed(3) },
          { key: "n", label: "Forecasts", fmt: fmt.int },
          { key: "n_economies", label: "Economies", fmt: fmt.int },
        ],
        rows: rel,
      },
    }),
  );

  const strongest = base.method === "persistence" ? "trailing_mean" : base.method;
  const years = t.yearly.map((r) => r.year);
  const hi20 = t.yearly.filter((r) => r.year >= c.blocks.shocks[0]);
  const wins = t.yearly.filter((r) => r[best] < r.persistence).length;
  const winsLate = hi20.filter((r) => r[best] < r.persistence).length;
  out.push(
    figure({
      headingLevel: headLevel,
      title: `Error by year: ${label}`,
      takeaway: `In ${wins} of ${years.length} test years the best model had a smaller average error than “same as last year”; in ${shocks} it did so in ${winsLate} of ${hi20.length}.`,
      how: `Each line is the average absolute error across economies in that test year. The grey band marks ${shocks}, the years after the pandemic shock, which were unlike most of the earlier years.`,
      alt: `Line chart of yearly forecast error for ${label} for three methods, ${tests}, with ${shocks} shaded. Values are in the table.`,
      provenance: fc.provenance,
      claims: ["C26", "C28"],
      wide: true,
      draw: (el) =>
        lineChart(el, {
          years,
          series: [
            { cls: "line-grey", values: t.yearly.map((r) => r.persistence), label: "Same as last year" },
            { cls: "line-ref", values: t.yearly.map((r) => r[strongest]), label: MODEL_NAMES[strongest] },
            { cls: "line-main", values: t.yearly.map((r) => r[best]), label: MODEL_NAMES[best] },
          ],
          shade: c.blocks.shocks,
          width: 640,
          height: 260,
          labelFmt: d3.format(".2~f"),
        }),
      table: {
        caption: `Mean absolute error by test year, ${label}`,
        columns: [
          { key: "year", label: "Year", header: true },
          { label: "Same as last year", value: (r) => r.persistence, fmt: (v) => v.toFixed(3) },
          { label: MODEL_NAMES[strongest], value: (r) => r[strongest], fmt: (v) => v.toFixed(3) },
          { label: MODEL_NAMES[best], value: (r) => r[best], fmt: (v) => v.toFixed(3) },
        ],
        rows: t.yearly,
      },
    }),
  );

  const cov = t.coverage.filter((r) => r.method === best || r.method === "persistence");
  const covItems = cov
    .sort((a, b) => a.scope_type.localeCompare(b.scope_type) || a.scope.localeCompare(b.scope) || a.method.localeCompare(b.method))
    .map((r) => ({ label: `${r.scope_type === "all" ? "All intervals" : r.scope} · ${r.method === "persistence" ? "last year" : "model"}`, value: r.coverage, hl: r.method !== "persistence" }));
  out.push(
    figure({
      headingLevel: headLevel,
      title: `Do the nominal ${level} intervals contain ${level} of outcomes? ${label}`,
      takeaway: `Overall the intervals contain ${fmt.pct(cov.find((r) => r.scope_type === "all" && r.method === best).coverage)} of outcomes; in ${shocks} they contain ${fmt.pct(cov.find((r) => r.scope === shockScope && r.method === best).coverage)}.`,
      how: `Bars show the share of actual outcomes that landed inside the interval. The dashed line is the ${level} target. Intervals are built from errors in the previous ${c.interval_calibration_years} years, so they lag a sudden shock. They exist from ${c.interval_first_year}.`,
      alt: `Bar chart of interval coverage for ${label}, overall, by period and by income group, for the best model and for “same as last year”, against a ${level} target. Values are in the table.`,
      provenance: fc.provenance,
      claims: ["C28"],
      draw: (el) => barChart(el, { items: covItems, format: d3.format(".0%"), ref: c.interval_level, refLabel: `${level} target`, max: 1, labelW: 260 }),
      table: {
        caption: `Share of outcomes inside the ${level} interval, ${label}`,
        columns: [
          { label: "Scope", value: (r) => (r.scope_type === "all" ? "All intervals" : r.scope), header: true },
          { label: "Method", value: (r) => MODEL_NAMES[r.method], left: true },
          { key: "n", label: "Intervals", fmt: fmt.int },
          { key: "coverage", label: "Coverage", fmt: (v) => fmt.pct(v, 1) },
          { key: "mean_width", label: "Mean width", fmt: (v) => v.toFixed(2) },
        ],
        rows: cov,
      },
    }),
  );
  return out;
}

function headline(fc) {
  const inf = fc.inflation;
  const r = inf.relative.find((x) => x.method === inf.best_model && x.scope_type === "all");
  const gr = fc.growth;
  const strongest = gr.pooled.filter((x) => BASELINES.includes(x.method)).sort((a, b) => a.mae - b.mae)[0];
  const bestL = gr.pooled.find((x) => x.method === gr.best_model);
  const growthLine = bestL.mae < strongest.mae ? `For GDP growth the best model (${MODEL_NAMES[gr.best_model]}) beat every simple method.` : `For GDP growth no model beat the simple ${MODEL_NAMES[strongest.method].toLowerCase()}.`;
  const s = fc.selection.find((x) => x.target === "inflation" && x.rule === "any method");
  const rule = s.relative_to_persistence < 1 ? "a rule that picks the model from earlier years also beats it" : "a rule that picks the model from earlier years does not";
  return `For next-year inflation, the model that did best on the test years made about ${fmt.num((1 - r.ratio) * 100, 0)}% smaller errors than repeating this year’s value, but that model is only known in hindsight: ${rule}. ${growthLine} Simple methods are hard to beat.`;
}

export async function forecast(params) {
  const [meta, fc] = await Promise.all([data("meta"), data("forecast")]);
  let target = params.get("t") === "growth" ? "growth" : "inflation";
  const slot = h("div", {});
  const hyp = meta.hypotheses.find((x) => x.id === "H5");
  function draw() {
    slot.replaceChildren(...panels(fc, target, meta, "h2"));
  }
  const radios = h(
    "fieldset",
    { class: "radios" },
    h("legend", {}, "What to forecast"),
    ["inflation", "growth"].map((t) =>
      h("label", {}, h("input", { type: "radio", name: "tg", value: t, checked: t === target, onchange: () => { target = t; setParams({ t: t === "inflation" ? null : t }); draw(); } }), t === "inflation" ? "Next-year inflation" : "Next-year GDP growth"),
    ),
  );
  draw();
  return h(
    "div",
    {},
    h("h1", {}, "How well can next year be forecast?"),
    h("p", { class: "lede" }, headline(fc)),
    h("p", {}, `This is a test of forecasting methods on past data, in which every forecast uses only earlier years of today’s data release. It is a backtest, not a record of what forecasters knew at the time, and not a forecast of the future, and no forecast beyond ${meta.constants.test_years[1]} is shown.`),
    h("div", { class: "note" }, h("h2", {}, `Hypothesis H5 for inflation: ${hyp.verdict}`), h("p", {}, strip(meta.claims.C27.claim) + "."), h("p", {}, "Caveat: " + strip(meta.claims.C27.caveat) + "."), h("p", {}, "Claims: ", claimLinks(["C24", "C25", "C26", "C27", "C28", "C29", "C30"]))),
    h("div", { class: "controls" }, radios),
    slot,
    h("h2", {}, "Where the models fail"),
    h("ul", {}, [meta.claims.C28, meta.claims.C29, meta.claims.C30].map((c) => h("li", {}, `${strip(c.claim)}. Caveat: ${strip(c.caveat)}.`))),
    h("p", { class: "how" }, "The full model card (intended use, what it is not for, evaluation protocol) is docs/MODEL_CARD.md in the repository."),
  );
}

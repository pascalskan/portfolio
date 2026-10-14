import { h, data, setParams, fmt, claimLinks } from "./util.js";
import { figure } from "./figure.js";
import { barChart, scatter, bucket } from "./charts.js";

const CROP = 0.02; // each axis is cropped to the central 1 - 2 x CROP of economies
const strip = (s) => s.replace(/[.\s]+$/, "");

export function stabilityFigure(ty, meta, level = "h3") {
  const c = meta.constants.typology;
  const rows = ty.selection;
  return figure({
    headingLevel: level,
    title: "How stable are the groups when economies are resampled?",
    takeaway: `Agreement between groups found in resamples and in the full sample stays well below the bar of ${ty.h1.bar} that I set in advance, for every number of groups.`,
    how: `Bars show the average adjusted Rand index (1 means identical groupings, 0 means no better than chance) over ${c.resamples} resamples of the economies. The dashed line is the pre-registered bar. I had named ${c.pre_registered_k[0]} to ${c.pre_registered_k[1]} groups.`,
    alt: `Bar chart of mean adjusted Rand index for 3 to 8 groups, all between ${d3.min(rows, (r) => r.mean_ari).toFixed(2)} and ${d3.max(rows, (r) => r.mean_ari).toFixed(2)}, all below the bar of 0.8.`,
    provenance: ty.provenance,
    claims: ["C10", "C11"],
    draw: (el) =>
      barChart(el, {
        items: rows.map((r) => ({ label: `${r.k} groups${r.k >= c.pre_registered_k[0] && r.k <= c.pre_registered_k[1] ? " (pre-registered range)" : ""}`, value: r.mean_ari, hl: r.k >= c.pre_registered_k[0] && r.k <= c.pre_registered_k[1] })),
        format: d3.format(".2f"),
        ref: ty.h1.bar,
        refLabel: `bar ${ty.h1.bar}`,
        max: 1,
        labelW: 230,
      }),
    table: {
      caption: `Stability by number of groups, ${ty.window}, ${c.economies} economies`,
      columns: [
        { key: "k", label: "Groups", header: true },
        { key: "mean_ari", label: "Mean ARI", fmt: (v) => v.toFixed(2) },
        { key: "ari_lo", label: "Lowest resample", fmt: (v) => v.toFixed(2) },
        { key: "ari_hi", label: "Highest resample", fmt: (v) => v.toFixed(2) },
        { key: "silhouette", label: "Silhouette", fmt: (v) => v.toFixed(2) },
      ],
      rows,
    },
  });
}

function profileTable(ty) {
  const cols = [
    ["income", "Income per person ($)", fmt.int],
    ["growth_mean", "Growth (% a year)", (v) => fmt.num(v, 1)],
    ["growth_sd", "Growth swings (points)", (v) => fmt.num(v, 1)],
    ["inflation", "Inflation (%)", (v) => fmt.num(v, 1)],
    ["unemployment", "Unemployment (%)", (v) => fmt.num(v, 1)],
    ["debt", "Government debt (% GDP)", (v) => fmt.num(v, 0)],
    ["current_account", "Current account (% GDP)", (v) => fmt.num(v, 1)],
  ];
  return h(
    "div",
    { class: "tablewrap", tabindex: "0", role: "region", "aria-label": "Group profiles, scrollable table" },
    h(
      "table",
      {},
      h("caption", {}, `Median profile of each group, ${ty.window}. Names are tentative descriptions, not types.`),
      h("thead", {}, h("tr", {}, h("th", { scope: "col", class: "l" }, "Group"), h("th", { scope: "col" }, "Economies"), h("th", { scope: "col" }, "Core members"), cols.map(([, l]) => h("th", { scope: "col" }, l)))),
      h(
        "tbody",
        {},
        ty.groups.map((g) =>
          h("tr", {}, h("th", { scope: "row", class: "l" }, `${g.id}: ${g.name}`), h("td", {}, g.n), h("td", {}, g.n_core), cols.map(([k, , f]) => h("td", {}, f(g.profile_display[k])))),
        ),
      ),
    ),
  );
}

function transitionTable(ty, idx) {
  const t = ty.transitions[idx];
  const [a, b] = t.windows.split(" to ");
  const total = d3.sum(t.matrix, (r) => d3.sum(r));
  const rowSum = t.matrix.map((r) => d3.sum(r));
  return h(
    "div",
    {},
    h("p", {}, `Agreement between the two windows (adjusted Rand index): ${t.ari == null ? "not available" : t.ari.toFixed(2)}, over ${t.n_common} economies present in both. Resampling within one window gives about ${ty.selection.find((r) => r.k === 5).mean_ari.toFixed(2)}, which is higher than every between-window value shown, but the samples differ, so how much of the gap is real change is not known. The instability inside one window alone means this cannot be read as economies moving between types.`),
    h(
      "div",
      { class: "tablewrap", tabindex: "0", role: "region", "aria-label": "Transition counts, scrollable table" },
      h(
        "table",
        {},
        h("caption", {}, `Economies in each group in ${a} (rows) and in ${b} (columns). ${total} economies are counted. Shading shows the share of each row.`),
        h("thead", {}, h("tr", {}, h("th", { scope: "col", class: "l" }, `${a} \\ ${b}`), t.labels.map((l) => h("th", { scope: "col" }, `Group ${l}`)))),
        h(
          "tbody",
          {},
          t.matrix.map((row, i) =>
            h("tr", {}, h("th", { scope: "row", class: "l" }, `Group ${t.labels[i]}`), row.map((v) => h("td", { class: `s${bucket(rowSum[i] ? v / rowSum[i] : 0)}` }, v))),
          ),
        ),
      ),
    ),
  );
}

export async function types(params) {
  const [meta, ty] = await Promise.all([data("meta"), data("typology")]);
  const hyp = meta.hypotheses.find((x) => x.id === "H1");
  const tc = meta.constants.typology;
  const coreless = ty.groups.filter((g) => g.n_core === 0).map((g) => `Group ${g.id} (“${g.name}”)`).join(" and ");
  const smallest = [...ty.groups].sort((a, b) => a.n - b.n)[0];
  const byIso = new Map(ty.economies.map((e) => [e.iso3, e]));
  let group = params.get("g") === "all" ? "all" : Number.isInteger(+params.get("g")) && params.get("g") !== null && ty.groups.some((g) => g.id === +params.get("g")) ? +params.get("g") : 0;
  let econ = byIso.has(params.get("e")) ? params.get("e") : "";
  let tIdx = Math.min(Math.max(+params.get("w") || 0, 0), ty.transitions.length - 1);

  const scatterSlot = h("div", {});
  const infoSlot = h("div", { role: "status", "aria-live": "polite" });
  const transSlot = h("div", {});
  const groupName = (id) => ty.groups.find((g) => g.id === id)?.name ?? `Group ${id}`;

  const q = (key, p) => d3.quantile(ty.economies.map((e) => e[key]).sort(d3.ascending), p);
  const pad = (lo, hi) => [lo - (hi - lo) * 0.08, hi + (hi - lo) * 0.08];
  const xDomain = d3.scaleLinear().domain(pad(q("pc1", CROP), q("pc1", 1 - CROP))).nice().domain();
  const yDomain = d3.scaleLinear().domain(pad(q("pc2", CROP), q("pc2", 1 - CROP))).nice().domain();
  const outside = ty.economies.filter((e) => e.pc1 < xDomain[0] || e.pc1 > xDomain[1] || e.pc2 < yDomain[0] || e.pc2 > yDomain[1]);

  function drawScatter() {
    const points = ty.economies.map((e) => {
      let cls = "";
      if (group !== "all" && e.group === group) cls = e.role === "core" ? "core" : "boundary";
      else if (group === "all") cls = e.role === "core" ? "core" : "boundary";
      if (e.iso3 === econ) cls += " sel";
      return { x: e.pc1, y: e.pc2, cls, id: e.iso3, name: e.name, label: `${e.name}: ${groupName(e.group)} (${e.role === "core" ? "core member" : "boundary"})` };
    });
    const hl = group === "all" ? "all groups" : `group ${group}, “${groupName(group)}”`;
    scatterSlot.replaceChildren(
      figure({
        title: `Economies laid out by their ${ty.window} profile`,
        takeaway: "Groups overlap: dots from different groups sit among one another. A two-dimensional picture can only hint at the instability measured above.",
        how: `Each dot is an economy; closer dots have more similar profiles on ${tc.features} measures (income, growth, growth swings, inflation, unemployment, debt, current account). Showing ${hl}: filled dots are core members (same group in at least ${fmt.pct(tc.core_threshold)} of resamples), hollow dots are boundary members, grey dots belong to other groups. The axes are summaries (principal components), not measures with units. The view is cropped to the central ${fmt.pct(1 - 2 * CROP, 0)} on each axis, so ${outside.length} economies with extreme profiles are not drawn (${outside.map((e) => e.name).join(", ")}); they are in the table.`,
        alt: `Scatter plot of ${tc.economies} economies on two principal components. ${hl} highlighted. The groups overlap. All values are in the table.`,
        provenance: ty.provenance,
        claims: ["C10", "C11", "C12"],
        wide: true,
        draw: (el) =>
          scatter(el, {
            points,
            xDomain,
            yDomain,
            xLabel: `First component (${fmt.pct(ty.pca.variance[0], 0)} of variation)`,
            yLabel: `Second component (${fmt.pct(ty.pca.variance[1], 0)})`,
            onSelect: (iso) => { econ = iso; sync(); },
          }),
        table: {
          caption: `${tc.economies} economies, ${ty.window}`,
          columns: [
            { label: "Economy", value: (r) => r.name, header: true },
            { label: "Group", value: (r) => `${r.group}: ${groupName(r.group)}`, left: true },
            { key: "role", label: "Role", left: true },
            { key: "core_share", label: "Share of resamples in same group", fmt: (v) => fmt.pct(v) },
            { key: "pc1", label: "Component 1", fmt: (v) => v.toFixed(2) },
            { key: "pc2", label: "Component 2", fmt: (v) => v.toFixed(2) },
          ],
          rows: ty.economies,
        },
      }),
    );
    const hidden = outside.filter((e) => group !== "all" && e.group === group);
    if (hidden.length) {
      scatterSlot.append(h("p", { class: "how", role: "status" }, `${hidden.length} of the ${ty.groups.find((g) => g.id === group).n} economies in this group lie outside the cropped view: ${hidden.map((e) => e.name).join(", ")}. They are in the table.`));
    }
    if (econ) {
      const e = byIso.get(econ);
      infoSlot.replaceChildren(
        h(
          "div",
          { class: "card" },
          h("h3", {}, e.name),
          h("p", {}, `Group ${e.group} (${groupName(e.group)}), ${e.role === "core" ? "a core member" : "a boundary member"}: in the same group in ${fmt.pct(e.core_share)} of resamples.`),
          h("p", { class: "how" }, "Group by five-year window (labels are matched across windows by centre, so a change of number is not always a real move):"),
          h("ul", {}, ty.windows.map((w, i) => h("li", {}, `${w}: ${e.history[i] == null ? "not clustered (missing data)" : "group " + e.history[i]}`))),
          h("a", { href: `#/country?e=${e.iso3}` }, `Open ${e.name}’s profile`),
        ),
      );
    } else infoSlot.replaceChildren();
  }
  function drawTrans() {
    const t = ty.transitions[tIdx];
    out.querySelector("#w-out").textContent = `From ${t.windows.replace(" to ", " to ")}`;
    out.querySelector("#w").setAttribute("aria-valuetext", t.windows);
    transSlot.replaceChildren(transitionTable(ty, tIdx));
  }
  function sync() {
    setParams({ g: group === 0 ? null : group, e: econ || null });
    drawScatter();
    out.querySelector("#econ-pick").value = econ;
  }

  const radios = h(
    "fieldset",
    { class: "radios" },
    h("legend", {}, "Highlight"),
    [...ty.groups.map((g) => ({ v: g.id, t: `${g.id}: ${g.name} (${g.n})` })), { v: "all", t: "All groups" }].map((o) =>
      h("label", {}, h("input", { type: "radio", name: "grp", value: o.v, checked: String(o.v) === String(group), onchange: () => { group = o.v === "all" ? "all" : +o.v; sync(); } }), o.t),
    ),
  );
  const pick = h(
    "select",
    { id: "econ-pick", onchange: (ev) => { econ = ev.target.value; sync(); } },
    h("option", { value: "" }, "None selected"),
    [...ty.economies].sort((a, b) => a.name.localeCompare(b.name)).map((e) => h("option", { value: e.iso3 }, e.name)),
  );
  pick.value = econ;
  const slider = h("input", {
    type: "range",
    id: "w",
    min: 0,
    max: ty.transitions.length - 1,
    step: 1,
    value: tIdx,
    oninput: (ev) => { tIdx = +ev.target.value; setParams({ w: tIdx || null }); drawTrans(); },
  });
  const reset = h("button", { type: "button", onclick: () => { group = 0; econ = ""; tIdx = 0; slider.value = 0; setParams({ g: null, e: null, w: null }); radios.querySelectorAll("input").forEach((r) => (r.checked = r.value === "0")); pick.value = ""; drawScatter(); drawTrans(); } }, "Reset");

  const out = h(
    "div",
    {},
    h("h1", {}, "Do economies fall into stable types? Not by my test."),
    h("p", { class: "lede" }, `${strip(meta.claims[hyp.claim_id].claim)}. (The adjusted Rand index, ARI, scores how closely two groupings agree: 1 is identical.) A grouping method always returns groups; the question is whether they hold up when the sample changes. The bar of 0.80 was chosen in advance, and these groups fall well below it.`),
    h("div", { class: "note" }, h("h2", {}, "What this means"), h("p", {}, `Hypothesis H1 (${strip(hyp.statement).replace(/^./, (c) => c.toLowerCase())}) was ${hyp.verdict}. Group names below are tentative labels for regions of a continuum. Treat them as a way to describe, not as types of economy.`), h("p", {}, "Claims: ", claimLinks(["C10", "C11", "C12", "C13", "C14"]))),
    stabilityFigure(ty, meta, "h2"),
    h("h2", {}, "The groups, as far as they go"),
    h("div", { class: "controls" }, radios, h("div", {}, h("label", { for: "econ-pick" }, "Find an economy"), pick), reset),
    scatterSlot,
    infoSlot,
    h("h2", {}, "What each group looks like"),
    profileTable(ty),
    h("p", { class: "how" }, `Median values of the ${ty.window} window.${coreless ? ` ${coreless} ${ty.groups.filter((g) => g.n_core === 0).length === 1 ? "has" : "have"} no core members.` : ""} The smallest group, “${smallest.name}”, has ${smallest.n} economies.`),
    h("h2", {}, "Do groups persist from one period to the next?"),
    h("div", { class: "controls" }, h("div", {}, h("label", { for: "w" }, "Compare two windows"), slider), h("output", { id: "w-out", for: "w" })),
    transSlot,
    h("p", { class: "how" }, `${ty.windows.length} five-year windows from ${ty.windows[0].split("-")[0]} to ${ty.windows[ty.windows.length - 1].split("-")[1]}. Economies missing data in a window are left out of it, so counts differ.`),
  );
  drawScatter();
  drawTrans();
  return out;
}

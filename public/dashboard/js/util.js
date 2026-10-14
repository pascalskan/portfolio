// Small helpers: DOM builder, cached JSON loading, URL state, number formatting.
// No analysis happens here; numbers come from the exported JSON files.

export function h(tag, attrs, ...kids) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === false || v == null) continue;
    if (k === "class") node.className = v;
    else if (k === "text") node.textContent = v;
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
    else if (v === true) node.setAttribute(k, "");
    else node.setAttribute(k, v);
  }
  for (const kid of kids.flat()) {
    if (kid == null || kid === false) continue;
    node.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
  return node;
}

const cache = new Map();
export function data(name) {
  if (!cache.has(name)) {
    cache.set(
      name,
      fetch(`data/${name}.json`, { cache: "no-cache" }).then((r) => {
        if (!r.ok) throw new Error(`Could not load data/${name}.json (${r.status})`);
        return r.json();
      }),
    );
  }
  return cache.get(name);
}

// URL state lives in the hash: #/route?key=value. Updating it does not re-render the view.
export function route() {
  const raw = location.hash.replace(/^#\/?/, "");
  const [name, query] = raw.split("?");
  return { name: name || "overview", params: new URLSearchParams(query || "") };
}
export function setParams(updates) {
  const { name, params } = route();
  for (const [k, v] of Object.entries(updates)) {
    if (v == null || v === "") params.delete(k);
    else params.set(k, v);
  }
  const q = params.toString();
  history.replaceState(null, "", `#/${name}${q ? "?" + q : ""}`);
}

export const fmt = {
  int: (v) => (v == null ? "no data" : d3.format(",.0f")(v)),
  num: (v, p = 1) => (v == null ? "no data" : d3.format(`,.${p}f`)(v)),
  pct: (v, p = 0) => (v == null ? "no data" : `${d3.format(`.${p}f`)(v * 100)}%`),
  sig: (v) => (v == null ? "no data" : d3.format(",.3~s")(v).replace("G", "bn").replace("M", "m")),
};

export function indicatorValue(ind, v) {
  if (v == null) return "no data";
  const unit = ind.unit;
  if (ind.key === "population") return d3.format(",.0f")(v);
  if (ind.key === "gdp_per_capita_ppp") return `$${d3.format(",.0f")(v)}`;
  if (ind.key === "life_expectancy") return `${d3.format(".1f")(v)} years`;
  if (unit.startsWith("%")) return `${d3.format(",.1f")(v)}%`;
  return d3.format(",.1f")(v);
}

export function claimLinks(ids) {
  return ids.map((id) => h("a", { class: "chip", href: `methods.html#${id}` }, id));
}

export function announce(text) {
  const live = document.getElementById("live");
  if (live) live.textContent = text;
}

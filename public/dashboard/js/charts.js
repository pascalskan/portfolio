// D3 chart builders. Each takes a container element and returns the <svg>. Styling is by CSS class
// so that light and dark themes apply; colour is never the only carrier (direct labels, values, shapes).

function svgIn(plot, w, h) {
  return d3
    .select(plot)
    .append("svg")
    .attr("viewBox", `0 0 ${w} ${h}`)
    .attr("preserveAspectRatio", "xMidYMid meet");
}

export function bucket(share) {
  // five equal steps of coverage; 0 is its own visible step via the label, not just colour
  return Math.min(4, Math.floor(share * 5));
}

export function heatmap(plot, { years, rows, cellW = 26, cellH = 24, labelW = 190 }) {
  const w = labelW + years.length * cellW + 6;
  const hh = 22 + rows.length * cellH + 4;
  const svg = svgIn(plot, w, hh);
  svg
    .append("g")
    .selectAll("text")
    .data(years)
    .join("text")
    .attr("x", (_, i) => labelW + i * cellW + cellW / 2)
    .attr("y", 14)
    .attr("text-anchor", "middle")
    .attr("class", "muted")
    .text((y) => (y % 5 === 0 || y === years[years.length - 1] ? y : ""));
  const row = svg
    .selectAll("g.row")
    .data(rows)
    .join("g")
    .attr("class", "row")
    .attr("transform", (_, i) => `translate(0,${22 + i * cellH})`);
  row
    .append("text")
    .attr("x", labelW - 8)
    .attr("y", cellH / 2 + 4)
    .attr("text-anchor", "end")
    .text((r) => r.label);
  row.each(function (r) {
    const g = d3.select(this);
    r.values.forEach((v, i) => {
      const b = bucket(v ?? 0);
      g.append("rect")
        .attr("class", `cell s${b}`)
        .attr("x", labelW + i * cellW)
        .attr("y", 0)
        .attr("width", cellW)
        .attr("height", cellH)
        .append("title")
        .text(`${r.label}, ${years[i]}: ${Math.round((v ?? 0) * 100)}% of economies have a value`);
      g.append("text")
        .attr("class", `t${b}`)
        .attr("x", labelW + i * cellW + cellW / 2)
        .attr("y", cellH / 2 + 4)
        .attr("text-anchor", "middle")
        .style("font-size", "9.5px")
        .text(Math.round((v ?? 0) * 100));
    });
  });
  return svg.node();
}

// series: [{key, cls, values (aligned to years, null allowed), label}]; band: {lo, hi} aligned arrays
export function lineChart(plot, opts) {
  const {
    years,
    series,
    band,
    events = [],
    shade,
    scale = "linear",
    width = 360,
    height = 190,
    unit = "",
    yTicks = 4,
    labelFmt,
    zeroLine = false,
  } = opts;
  const m = { l: 46, r: 8, t: 20, b: 24 };
  const svg = svgIn(plot, width, height);
  const x = d3.scaleLinear().domain([years[0], years[years.length - 1]]).range([m.l, width - m.r]);
  const all = series.flatMap((s) => s.values).concat(band ? band.lo.concat(band.hi) : []).filter((v) => v != null);
  if (!all.length) {
    svg.append("text").attr("x", m.l).attr("y", height / 2).text("No data for this economy");
    return svg.node();
  }
  let [lo, hi] = d3.extent(all);
  if (zeroLine) {
    lo = Math.min(lo, 0);
    hi = Math.max(hi, 0);
  }
  let y;
  if (scale === "log") y = d3.scaleLog().domain([Math.max(lo, 1e-6) * 0.95, hi * 1.05]).range([height - m.b, m.t]).nice();
  else if (scale === "symlog") y = d3.scaleSymlog().constant(10).domain([lo, hi]).range([height - m.b, m.t]).nice();
  else y = d3.scaleLinear().domain([lo - (hi - lo) * 0.05, hi + (hi - lo) * 0.05]).range([height - m.b, m.t]).nice();
  const yfmt = labelFmt || d3.format("~s");
  let ticks = y.ticks(yTicks);
  if (scale === "log") {
    // few, readable ticks: powers of ten when the axis spans three decades or more, else 1, 2, 5
    const decades = Math.log10(y.domain()[1] / y.domain()[0]);
    const keep = decades >= 3 ? [1] : [1, 2, 5];
    ticks = y.ticks().filter((d) => keep.includes(Math.round(d / 10 ** Math.floor(Math.log10(d)))));
    if (ticks.length > 6) ticks = ticks.filter((d) => Math.round(d / 10 ** Math.floor(Math.log10(d))) === 1);
  }
  svg
    .append("g")
    .attr("class", "grid")
    .selectAll("line")
    .data(ticks)
    .join("line")
    .attr("x1", m.l)
    .attr("x2", width - m.r)
    .attr("y1", (d) => y(d))
    .attr("y2", (d) => y(d));
  svg
    .append("g")
    .selectAll("text")
    .data(ticks)
    .join("text")
    .attr("class", "muted")
    .attr("x", m.l - 5)
    .attr("y", (d) => y(d) + 4)
    .attr("text-anchor", "end")
    .text((d) => yfmt(d) + unit);
  const xt = years.filter((yr) => yr % 10 === 5 || yr === years[0]);
  svg
    .append("g")
    .selectAll("text")
    .data(xt)
    .join("text")
    .attr("class", "muted")
    .attr("x", (d) => x(d))
    .attr("y", height - 6)
    .attr("text-anchor", "middle")
    .text((d) => d);
  if (shade) {
    svg
      .append("rect")
      .attr("class", "shade")
      .attr("x", x(shade[0]))
      .attr("width", x(shade[1]) - x(shade[0]))
      .attr("y", m.t)
      .attr("height", height - m.b - m.t);
  }
  if (zeroLine && y(0) >= m.t && y(0) <= height - m.b) {
    svg.append("line").attr("class", "zero").attr("x1", m.l).attr("x2", width - m.r).attr("y1", y(0)).attr("y2", y(0));
  }
  if (band) {
    const area = d3
      .area()
      .defined((_, i) => band.lo[i] != null && band.hi[i] != null)
      .x((_, i) => x(years[i]))
      .y0((_, i) => y(band.lo[i]))
      .y1((_, i) => y(band.hi[i]));
    svg.append("path").attr("class", "band").attr("d", area(years));
  }
  for (const s of series) {
    const line = d3
      .line()
      .defined((v) => v != null)
      .x((_, i) => x(years[i]))
      .y((v) => y(v));
    svg.append("path").attr("class", s.cls).attr("d", line(s.values));
    // isolated points would be invisible as a line; mark them
    s.values.forEach((v, i) => {
      if (v == null) return;
      const lonely = (i === 0 || s.values[i - 1] == null) && (i === s.values.length - 1 || s.values[i + 1] == null);
      if (lonely) svg.append("circle").attr("cx", x(years[i])).attr("cy", y(v)).attr("r", 2.5).attr("class", "dot");
    });
  }
  for (const e of events) {
    const idx = years.indexOf(e.year);
    const v = e.series != null ? series[e.series].values[idx] : null;
    if (idx < 0 || v == null) continue;
    svg.append("circle").attr("class", "ev").attr("cx", x(e.year)).attr("cy", y(v)).attr("r", 5).append("title").text(`${e.label}, ${e.year}`);
  }
  // legend drawn in the chart: line samples differ by pattern as well as colour
  const labelled = series.filter((s) => s.label);
  let lx = m.l;
  labelled.forEach((s) => {
    svg.append("line").attr("class", s.cls).attr("x1", lx).attr("x2", lx + 18).attr("y1", 6).attr("y2", 6);
    svg.append("text").attr("x", lx + 22).attr("y", 9.5).text(s.label);
    lx += 22 + s.label.length * 5.6 + 14; // the node is detached while drawing, so estimate the text width
  });
  return svg.node();
}

// items: [{label, value, hl}] horizontal bars with the value printed at the end
export function barChart(plot, { items, width = 640, rowH = 28, labelW = 190, format, ref, refLabel, max }) {
  const m = { l: labelW, r: 70, t: 8, b: 22 };
  const height = m.t + items.length * rowH + m.b;
  const svg = svgIn(plot, width, height);
  const top = max ?? d3.max(items, (d) => d.value) * 1.05;
  const x = d3.scaleLinear().domain([0, top]).range([m.l, width - m.r]);
  const ticks = x.ticks(5);
  svg.append("g").attr("class", "grid").selectAll("line").data(ticks).join("line").attr("x1", (d) => x(d)).attr("x2", (d) => x(d)).attr("y1", m.t).attr("y2", height - m.b);
  svg.append("g").selectAll("text").data(ticks).join("text").attr("class", "muted").attr("x", (d) => x(d)).attr("y", height - 6).attr("text-anchor", "middle").text((d) => format(d));
  const row = svg.selectAll("g.r").data(items).join("g").attr("transform", (_, i) => `translate(0,${m.t + i * rowH})`);
  row.append("text").attr("x", m.l - 8).attr("y", rowH / 2 + 4).attr("text-anchor", "end").text((d) => d.label);
  row.append("rect").attr("class", (d) => `bar${d.hl ? " hl" : ""}`).attr("x", m.l).attr("y", 4).attr("height", rowH - 10).attr("width", (d) => Math.max(1, x(d.value) - m.l));
  row.append("text").attr("x", (d) => x(d.value) + 6).attr("y", rowH / 2 + 4).text((d) => format(d.value));
  if (ref != null) {
    svg.append("line").attr("class", "refline").attr("x1", x(ref)).attr("x2", x(ref)).attr("y1", m.t).attr("y2", height - m.b);
    if (refLabel) svg.append("text").attr("x", x(ref) + 4).attr("y", m.t + 10).attr("class", "muted").text(refLabel);
  }
  return svg.node();
}

// items: [{label, value, lo, hi}] dots with interval whiskers and a reference line
export function dotInterval(plot, { items, width = 640, rowH = 34, labelW = 190, ref = 1, refLabel, domain, format = d3.format(".2f") }) {
  const m = { l: labelW, r: 20, t: 18, b: 24 };
  const height = m.t + items.length * rowH + m.b;
  const svg = svgIn(plot, width, height);
  const x = d3.scaleLinear().domain(domain).range([m.l, width - m.r]).nice();
  const ticks = x.ticks(6);
  svg.append("g").attr("class", "grid").selectAll("line").data(ticks).join("line").attr("x1", (d) => x(d)).attr("x2", (d) => x(d)).attr("y1", m.t).attr("y2", height - m.b);
  svg.append("g").selectAll("text").data(ticks).join("text").attr("class", "muted").attr("x", (d) => x(d)).attr("y", height - 6).attr("text-anchor", "middle").text((d) => format(d));
  svg.append("line").attr("class", "refline").attr("x1", x(ref)).attr("x2", x(ref)).attr("y1", m.t - 6).attr("y2", height - m.b);
  if (refLabel) svg.append("text").attr("x", x(ref) + 4).attr("y", 11).attr("class", "muted").text(refLabel);
  const row = svg.selectAll("g.r").data(items).join("g").attr("transform", (_, i) => `translate(0,${m.t + i * rowH})`);
  row.append("text").attr("x", m.l - 8).attr("y", rowH / 2 + 4).attr("text-anchor", "end").text((d) => d.label);
  row.append("line").attr("class", "ci").attr("x1", (d) => x(d.lo)).attr("x2", (d) => x(d.hi)).attr("y1", rowH / 2).attr("y2", rowH / 2);
  row.append("circle").attr("class", "dot").attr("cx", (d) => x(d.value)).attr("cy", rowH / 2).attr("r", 5);
  row.append("text").attr("x", (d) => x(d.hi) + 6).attr("y", rowH / 2 + 4).text((d) => `${format(d.value)} (${format(d.lo)} to ${format(d.hi)})`);
  return svg.node();
}

// points: [{x, y, cls, id, label}]
export function scatter(plot, { points, width = 640, height = 440, xLabel, yLabel, onSelect, xDomain, yDomain }) {
  const m = { l: 44, r: 12, t: 12, b: 38 };
  const svg = svgIn(plot, width, height);
  const x = d3.scaleLinear().domain(xDomain || d3.extent(points, (p) => p.x)).range([m.l, width - m.r]).nice();
  const y = d3.scaleLinear().domain(yDomain || d3.extent(points, (p) => p.y)).range([height - m.b, m.t]).nice();
  const inside = (p) => p.x >= x.domain()[0] && p.x <= x.domain()[1] && p.y >= y.domain()[0] && p.y <= y.domain()[1];
  points = points.filter(inside);
  svg.append("g").attr("class", "grid").selectAll("line.h").data(y.ticks(6)).join("line").attr("x1", m.l).attr("x2", width - m.r).attr("y1", (d) => y(d)).attr("y2", (d) => y(d));
  svg.append("g").selectAll("text.y").data(y.ticks(6)).join("text").attr("class", "muted").attr("x", m.l - 5).attr("y", (d) => y(d) + 4).attr("text-anchor", "end").text((d) => d);
  svg.append("g").selectAll("text.x").data(x.ticks(8)).join("text").attr("class", "muted").attr("x", (d) => x(d)).attr("y", height - 20).attr("text-anchor", "middle").text((d) => d);
  svg.append("text").attr("class", "muted").attr("x", (m.l + width - m.r) / 2).attr("y", height - 4).attr("text-anchor", "middle").text(xLabel);
  svg.append("text").attr("class", "muted").attr("transform", `translate(11,${(m.t + height - m.b) / 2}) rotate(-90)`).attr("text-anchor", "middle").text(yLabel);
  const dots = svg.append("g").selectAll("circle").data(points).join("circle")
    .attr("class", (p) => `pt ${p.cls}`)
    .attr("cx", (p) => x(p.x))
    .attr("cy", (p) => y(p.y))
    .attr("r", (p) => (p.cls.includes("sel") ? 7 : 4.5));
  dots.append("title").text((p) => p.label);
  if (onSelect) dots.style("cursor", "pointer").on("click", (_, p) => onSelect(p.id));
  const sel = points.filter((p) => p.cls.includes("sel"));
  svg.append("g").selectAll("text.lab").data(sel).join("text")
    .attr("x", (p) => x(p.x) + 10)
    .attr("y", (p) => y(p.y) + 4)
    .style("font-weight", "700")
    .text((p) => p.name);
  return svg.node();
}

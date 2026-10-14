// Router and page chrome. Views live in their own modules and render into #app.
import { h, data, route } from "./util.js";
import { overview } from "./overview.js";
import { country } from "./country.js";
import { types } from "./types.js";
import { forecast } from "./forecast.js";

const VIEWS = { overview, country, types, forecast };
const TITLES = {
  overview: "Overview and data coverage",
  country: "Country profile",
  types: "Groups of economies",
  forecast: "Forecast lab",
};

const app = document.getElementById("app");
let first = true;

async function render() {
  const { name, params } = route();
  const view = VIEWS[name] || overview;
  const key = VIEWS[name] ? name : "overview";
  document.querySelectorAll("nav.main a[data-route]").forEach((a) => {
    if (a.dataset.route === key) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
  app.replaceChildren(h("p", { id: "loading", role: "status" }, "Loading data…"));
  try {
    const content = await view(params);
    app.replaceChildren(content, h("div", { id: "live", class: "sr", "aria-live": "polite", role: "status" }));
    document.title = `${TITLES[key]} | Global Economic Analytics explorer`;
    const h1 = app.querySelector("h1");
    if (h1) {
      h1.setAttribute("tabindex", "-1");
      if (!first) h1.focus({ preventScroll: false });
    }
    if (!first) window.scrollTo(0, 0);
  } catch (err) {
    app.replaceChildren(
      h("h1", {}, "Something went wrong"),
      h("p", {}, `The data could not be loaded: ${err.message}. If you opened this file directly from disk, serve the site over HTTP instead.`),
    );
  }
  first = false;
}

async function footer() {
  const meta = await data("meta");
  const f = document.getElementById("footer");
  f.replaceChildren(
    h("p", {}, `Data retrieved ${meta.vintage.retrieved}; analysis window ${meta.vintage.window[0]} to ${meta.vintage.window[1]}. Descriptive analysis of one public panel: nothing here shows causes, ranks economies or is a forecast for decisions.`),
    ...meta.attribution.map((a) => h("p", {}, a)),
  );
}

// The skip link must not change the hash, which is the router's state.
document.querySelector(".skip")?.addEventListener("click", (e) => {
  e.preventDefault();
  const main = document.getElementById("main");
  main.focus();
  main.scrollIntoView();
});

window.addEventListener("hashchange", render);
render();
footer().catch(() => {});

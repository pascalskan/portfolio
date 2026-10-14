// Case-study content. Claims come from the project repositories and records (named in the commit), never from memory. No customer data, no commercial terms.
// `theme` mirrors each section's colours so the page reads as a continuation of the scene it came from.
export const CASE_ORDER = ['forecasting', 'ledger', 'twb', 'drivepro', 'dashboard'];

export const CASES = {
  forecasting: {
    n: '01',
    section: 'forecasting',
    title: 'Temporal evaluation in sports performance prediction',
    meta: 'Dissertation · Applied ML · 2026',
    theme: { bg: '#07122a', ink: '#e8f0ff', mut: '#94aad0', acc: '#4cd2ff', line: 'rgba(120,170,255,.22)', style: 'lab' },
    lede: "A reproducible Python research platform showing that <em>how</em> you test a model changes what you conclude about it. Predicting powerlifters' competition totals from 1.4M+ public records.",
    facts: [
      { n: '0.96 → 0.34\u2060–\u20600.57', l: 'R² from retrospective to walk-forward testing' },
      { n: '1.4M+', l: 'public competition records' },
      { n: '101,695', l: 'forward-in-time predictions evaluated' },
      { n: '86%', l: 'of the information gain from one feature: the previous total' },
    ],
    bars: {
      caption: 'Same models, same features. Only the test protocol changes.',
      rows: [
        { label: 'Retrospective', w: 97, val: 'R² ≈ 0.96' },
        { label: 'Walk-forward', w: 57, lo: 34, val: 'R² ≈ 0.34–0.57', warn: true },
      ],
      note: 'Raw cohort. Retrospective R² 0.955–0.970; walk-forward 0.342–0.570. MAE rises roughly five- to six-fold. The lighter part of the bar is the range across folds.',
    },
    sections: [
      { h: 'What it found', items: [
        'Under strict forward-in-time testing, no learned model beat the best simple baseline on MAE (Persistence 101.85 vs Gradient Boosting 103.37).',
        "One feature, the athlete's previous total, accounts for 86% of the total information gain.",
        'Comparing against 1RM equations only scores a subset of rows (59.1%). On a matched subset the apparent gap shrinks from 11.7 kg to 2.1 kg.',
      ] },
      { h: 'What I built', items: [
        'Expanding-window walk-forward validation with features recomputed inside each fold, over 101,695 predictions.',
        'Athlete-level cluster bootstrap with Holm–Bonferroni correction. A rewrite cut a 5,000-resample comparison from an estimated ~5 hours to ~11 seconds.',
        'Reproducibility: dataset SHA-256 fingerprinting, deterministic seeds, resumable checkpoints, and CI that runs every stage on a fixture.',
        'Found and fixed a silent filter bug that left a cohort at 496 records instead of 412,934. Unit tests could not catch it.',
      ] },
    ],
    stack: ['Python', 'pandas', 'scikit-learn', 'NumPy', 'SciPy', 'pytest', 'GitHub Actions'],
    links: [{ label: 'Repository', href: 'https://github.com/pascalskan/temporal-strength-performance-prediction' }],
  },

  ledger: {
    n: '02',
    section: 'ledger',
    title: 'The Ledger',
    meta: 'Founder project · Product & front-end · 2026',
    theme: { bg: '#dde7d8', ink: '#0d2a1f', mut: '#3a5546', acc: '#0a6a47', line: 'rgba(13,42,31,.28)', style: 'ledger' },
    lede: 'An operational-intelligence prototype for field-service businesses. Worker submissions only become financial records after a human approves them in a Review Centre.',
    facts: [
      { n: '1,036 → 9', l: 'automated accessibility violations after a structured audit' },
      { n: '1,961 → 399 KB', l: 'entry bundle with route-level code splitting' },
      { n: '4', l: 'governing rules: Approval, Audit, Job Attribution, Financial Integrity' },
    ],
    embed: { kind: 'app', src: 'https://the-ledger-pascalskan.replit.app/auth', host: 'the-ledger-pascalskan.replit.app', live: 'https://the-ledger-pascalskan.replit.app/', title: 'The Ledger: a live demo you can use. Choose a demo account to explore every role.', label: 'Live demo · choose a role and explore', note: 'This is a live demo with sample data. The Ledger is an ongoing project. Pick any demo account to explore it; for the full-size app, use Open live demo.' },
    flow: [['Operational data'], ['Review Centre', 1], ['Approval', 1], ['Financial records'], ['Reporting'], ['Accounting sync']],
    sections: [
      { h: 'What I built', items: [
        'Four governing rules: Approval, Audit, Job Attribution, Financial Integrity. They are written down and enforced by role-aware tests.',
        'Role-specific experiences for CEO, project managers, workers (including an offline queue) and a client portal.',
        'Ran a structured front-end audit across every route, role and viewport: automated accessibility violations fell from 1,036 to 9 and horizontal overflow on phone and tablet widths went to zero.',
        'Entry bundle cut from 1,961 KB to 399 KB with route-level code splitting.',
        'Backend is documented but deliberately not built yet. The approval and audit model is validated in a working interface first.',
      ] },
    ],
    shot: { mobile: 'shots/ledger-worker-mobile.webp', src: 'shots/ledger-review-centre.webp', alt: 'Screenshot of The Ledger Review Centre, shown with invented demo data' },
    stack: ['TypeScript', 'React 19', 'Vite', 'Tailwind', 'Zustand', 'TanStack Query', 'Playwright', 'axe-core'],
    links: [{ label: 'Repository', href: 'https://github.com/pascalskan/The-Ledger' }],
  },

  twb: {
    n: '03',
    section: 'twb',
    title: 'Travel Without Borders',
    meta: 'Freelance · WordPress · Live since 13 Aug 2026',
    theme: { bg: '#1e5630', ink: '#ffffff', mut: '#d3e4d8', acc: '#fed700', line: 'rgba(255,255,255,.28)', style: 'travel' },
    lede: "Redevelopment and ongoing maintenance of a UK specialist Germany-holiday company's live WordPress site, on a commercial theme and page builder that cannot be edited. Every customisation lives in an upgrade-safe child theme.",
    facts: [
      { n: '59', l: 'destination pages (6 regions, 53 towns) on one layout, all passing a 390px phone audit' },
      { n: '27 → 0', l: 'of 97 pages whose mobile content differed from desktop, before and after the fix' },
      { n: '−46%', l: 'desktop page weight from a card-image fix (5,162 → 2,802 KB)' },
      { n: '14', l: 'child-theme modules behind one loader, each loaded only where used' },
    ],
    sections: [
      { h: 'The constraint', items: [
        'A live business site on a commercial theme (Ave) and page builder (WPBakery). Neither can be edited, so all code lives in a child theme and all page content lives in the client\'s database.',
        'Backup-first on every change: a verified full backup and baseline screenshots before anything was touched, and proposed CSS measured against the live page before it was committed.',
        'Went live on 13 August 2026 as a selective migration, not a database import. Importing the local copy would have overwritten live customer records the local copy did not have.',
      ] },
      { h: 'What I built', items: [
        'Homepage: a 12-slide hero carousel, fully clickable destination cards, Special Interest and Special Events carousels, featured testimonials and blog cards.',
        'A testimonials system: custom page-builder elements and a dedicated page, built in four milestones to the hero\'s accessibility bar (keyboard, visible focus, reduced motion, WCAG AA colour).',
        'A Trade page in English and German, with its own enquiry form and an Individual/Business switch on the Contact page. Business enquiries reach the same inbox but are labelled three ways, and delivery was tested end to end.',
        '59 destination pages brought to one layout, plus the Special Interest and Special Events page families and a blog redesign with eight posts set to the client\'s copy.',
        'Consent-gated analytics, an EN/DE language switch, and marketing-consent state reported in every enquiry email.',
        'A first-party click counter. The client needed to know how many visitors followed a partner link; GA4 could not report it and Tag Manager access was not available, so the count runs on their own server and stores no personal data. Verified on the live site.',
        'A distance audit of all 53 destination pages against route planners. It found real errors, such as Hamburg quoted at 425 km (Cologne\'s figure) instead of about 769 km.',
      ] },
      { h: 'Working to a client list', items: [
        'The work was driven by the client\'s running task list across ten rounds of review. It was closed on 10 September, every item either delivered or explicitly closed by a decision not to build it.',
        'A full mobile audit: the site originally had no navigation bar on non-desktop views. Content parity between desktop and phone was then checked page by page across 97 pages.',
        'Where something looked wrong but was not mine to change, I raised it instead of altering it. About thirty pages carry a content column hidden at every breakpoint; it is with the client to decide.',
      ] },
      { h: 'What went wrong, written down', items: [
        'I kept a full error record. Five defects reached visitors and four were caught first. I also logged 11 claims of mine that turned out wrong and 10 measurements that gave false results.',
        'The image-weight fix I shipped first cut bytes by 13% but raised requests from 30 to 37, because the lazy-loader fetched two images per card. Fixing the image size itself gave the 46%.',
        'The theme\'s scroll animation left headings, text and photographs invisible on fifteen live pages. It took three passes, and the second came from a client noticing a page seemed short of photos: one image sat at opacity 0.00000001, which no check for hidden elements would catch.',
        '53 of the 59 destination pages never received their stylesheet, because the theme\'s page class names only the immediate parent. A class set by walking up the ancestors fixed it. Renaming two region slugs also broke 21 town pages, as the redirect plugin does not follow children.',
        'Rules that came out of it: reload before believing a save, purge the cache and re-check with a cache-buster, and measure what the visitor receives in bytes and requests on both desktop and phone.',
      ] },
      { h: 'Still open', items: [
        'The desktop menu clips its last items between about 1200 and 1520px. It is a parent-theme layout fault that predates this work, and I accepted it rather than forcing a fix that left the header broken.',
        'GA4 reporting for the direct tag is transmitting but unconfirmed; the first-party counter is the working answer.',
      ] },
    ],
    shot: { mobile: 'shots/twb-mobile.webp', src: 'shots/twb.webp', alt: 'Screenshot of the Travel Without Borders website' },
    embed: { kind: 'site', src: 'embeds/twb/index.html', host: 'travelwithoutborders.co.uk', minW: 1240, live: 'https://travelwithoutborders.co.uk/', title: 'Travel Without Borders home page: a saved copy that scrolls and responds like the live site', label: 'Home page · scroll and click around', note: 'Some parts of the page have been removed from this preview. For the full page, please visit the live site.' },
    stack: ['PHP', 'WordPress', 'WPBakery', 'CSS / JS', 'Quform', 'GA4'],
    links: [{ label: 'Destination research programme', href: '#/case/research' }, { label: 'Visit the live site', href: 'https://travelwithoutborders.co.uk' }],
  },

  research: {
    n: '03·2',
    parent: 'twb',
    section: 'twb',
    title: 'Destination research programme',
    meta: 'Travel Without Borders · Research method · 2026',
    theme: { bg: '#0f1b14', ink: '#eaf3ec', mut: '#a9c4b2', acc: '#fed700', line: 'rgba(234,243,236,.22)', style: 'lab' },
    lede: 'A method-first programme for evidencing UK demand for a German destination, piloted on Frankfurt. The rule is that no figure is used until it is traced to a primary source and recorded, and that anything an AI tool says is a lead, not evidence.',
    facts: [
      { n: '43', l: 'research questions in two layers: Germany-wide, and per destination' },
      { n: '414', l: 'sources registered for the Frankfurt pilot' },
      { n: '231 of 253', l: 'registered claims still unverified, shown as such' },
      { n: '74 / 84', l: 'top score in my 10-task test of research tools; one tool scored 50' },
    ],
    flow: [['Heard'], ['Registered'], ['Traced', 1], ['Checked', 1], ['Graded'], ['Usable']],
    sections: [
      { h: 'The question', items: [
        'The client plans bespoke holidays to Germany and wanted evidence about UK visitors to a German city: how long they stay, why they come, and how that has changed over 5 to 10 years and, ideally, about 40.',
        'The programme is built to be reused. A destination is a configuration with switchable modules, so a module that does not apply is reported as "not applicable", never as "no data".',
        'Research comes first. The analysis and any proposal are deliberately not started until the client has seen what the evidence says.',
      ] },
      { h: 'The method', items: [
        'The rule: no figure, date, quotation or ranking is used until it is traced to a primary source and recorded in a register.',
        'Every claim carries a status (unverified, extracted, conflicting, contradicted, unsupported, or verified) and a grade from A to D. Only verified figures reach an output, and grade D, meaning unopened, unsourced, inferred or AI-only, is never shown.',
        'Tracing means finding the original publisher, opening it rather than trusting a snippet or an AI summary, saving it with its URL, date and a SHA-256 hash, and reading the figure in context: table, unit, period, geography.',
        'German originals are kept and numbers are copied from the original, never retyped from a translation. When two sources disagree I keep both and log the conflict. I never average them, and an official source beats an AI or media one.',
        'Research runs in three steps: discovery, where AI chats produce leads only; extraction, where an AI reads one supplied document and nothing else; and checking, where I spot-check at least three figures or ten percent, whichever is more, and a single failure means checking them all.',
        'About 30 minutes per fact, then log the gap and move on. The data budget is zero, so a paywalled source is flagged for a decision, never bought.',
      ] },
      { h: 'Testing the tools before trusting them', items: [
        'Before using AI for discovery I ran a 10-task bake-off with answers the tools never saw, including a statistic that does not exist, to see whether a tool would invent it. Answers were blinded with random labels and scored 0 to 2 on six criteria.',
        'Perplexity and Claude each scored 74 of 84 and ChatGPT\'s deep research scored 50. All five of its research answers reported zero citations and zero searches, so they came from the model\'s own knowledge. I now use it for none of the discovery or checking work.',
        'Claude was one of the tools under test, so a fourth AI scored the answers, with safeguards: checks that its quotes were real, a sensitivity analysis, and an audit of the scorer itself.',
        'The audit found the scorer was wrong in places. Two fabrication flags were real figures that were only unlinked, and my own answer key was incomplete, so I re-judged that task with a corrected key. The rule I took: a fabrication flag is never used without checking against a source.',
        'I wrote down the limits of the test: one run per task per tool, one AI scorer, unequal plans, and I saw one reply before scoring it.',
      ] },
      { h: 'Where it stands', items: [
        'Frankfurt has 414 sources, 253 claims (231 unverified, 10 extracted, 4 contradicted, 4 conflicting, 3 unsupported, 1 arithmetic-checked), 118 open gaps and 60 logged conflicts. Every decision is dated and never edited afterwards.',
        '32 saved research answers cover 28 of the 43 questions. Fifteen questions have not been run.',
        'Nothing here counts as verified yet, because the spot-check of the first extractions is still mine to do. The tracker and the registers say so rather than rounding up.',
        'The programme is private to the client, not published and not deployed.',
      ] },
      { h: 'Related planning reports', items: [
        'Earlier, in September, I produced five internal planning reports: ten German destinations missing from the client\'s site with UK access times, research on the competing UK operators, research on the 63 other live pages, a 1 to 5 sponsorship score for nine existing pages against a stated scale, and a corrections report from the distance audit (5 high, 13 medium and 14 low priority errors).',
        'They predate the evidence-grading method, so I treat their figures as researched leads, not as checked facts.',
      ] },
    ],
    stack: ['Python', 'CSV registers', 'Source grading', 'SHA-256 hashing', 'AI-assisted research'],
    links: [{ label: 'Back to Travel Without Borders', href: '#/case/twb' }],
  },

  drivepro: {
    n: '04',
    section: 'drivepro',
    title: 'M.G. Drive Pro',
    meta: 'Freelance · Full-stack · Live',
    theme: { bg: '#111111', ink: '#fafaf8', mut: '#bdbdb8', acc: '#0ea5e9', line: 'rgba(250,250,248,.22)', style: 'road' },
    lede: 'A website and enquiry backend for an independent, DVSA-approved driving instructor in the East Midlands. The brief from the client was calm, patient and personal, not corporate, so the site had to read that way.',
    facts: [
      { n: '13', l: 'pages: eight core plus five town landing pages for local search' },
      { n: '148 / 148', l: 'backend tests passing at the release validation' },
      { n: '100 · 100 · 96', l: 'Lighthouse SEO, best practices and accessibility at the release audit' },
      { n: '8', l: 'numbered specifications, each delivered on its own branch' },
    ],
    sections: [
      { h: 'The brief', items: [
        'An independent instructor needed a website that sounds like him: patient, structured, specialist with nervous drivers. Business facts came from his own questionnaire, and anything unconfirmed was checked with him rather than guessed.',
        'Real content went in page by page. AI helped draft the content and a structure audit. I reviewed each suggestion and approved it before it went in, with structure and content in separate commits. I say so openly because the process is part of the work.',
        'No invented testimonials. Placeholder cards were labelled as placeholders until real reviews replaced them.',
      ] },
      { h: 'Decisions', items: [
        'I built the backend to eight numbered specifications before launching: foundation, persistence, enquiries, notifications, production hardening, a Facebook feed, deployment and release validation. Routes stay thin, logic sits in services and storage in repositories.',
        'Version 1 launched as a frontend-only static site. The booking, student portal, dashboard and platform concept pages were kept but made unreachable four ways: feature flags, a server-side redirect that works with JavaScript off, noindex, and robots.txt.',
        'The plan later changed. I wired the contact form and the Facebook feed to the backend, and moved from Netlify and Railway to one always-on Replit server where FastAPI serves both the API and the pages, because one project there publishes only one deployment.',
        'Oakham, Uppingham, Melton Mowbray and all mention of Rutland were removed from the site, because advertising an area he does not serve would only attract enquiries he cannot take.',
      ] },
      { h: 'What I built', items: [
        'Hand-written HTML, CSS and vanilla JavaScript with no framework or build step, one shared stylesheet of design tokens, clean URLs, and 301 redirects from every old path.',
        'Five town pages, each built around the real DVSA test centre learners use rather than a thin copy of the same text. Titles and descriptions lead with the towns served, there is structured data for a driving school, and 70 stale links were fixed.',
        'An enquiry API that validates and stores each message, then emails the instructor and confirms to the learner. A failed email never fails the request. Per-IP rate limiting, a request-size cap, security headers, a CORS allow-list and a production start-up check that refuses to boot on bad config.',
        'A Facebook feed read by the server, never the browser. It caches posts, refreshes in the background, and leaves the static cards in place if anything is empty or down.',
        'WCAG 2.1 AA work across the site: skip link, visible focus, several rounds of contrast fixes, and automated axe-core violations remediated. Images are resized WebP with set dimensions.',
      ] },
      { h: 'What went wrong', items: [
        'Moving to one host made the API address an empty string, and my code read empty as "not configured". The contact form and feed silently stayed on placeholders while the API worked, with no console error. An explicit enabled flag fixed it.',
        'A rename that matched links ending in .html left 70 links with anchors pointing the old way.',
        'A catch-all route turned wrong-method requests into 404s instead of 405s, and a cold cache meant the first visitor to the feed always saw it empty. Pre-warming and one retry fixed the second.',
        'Lessons I took: never use one value for two meanings, keep one source of truth for served files, keep release documents in step with scope changes, and say "unverified" when I cannot verify.',
      ] },
      { h: 'Still open', items: [
        'The release documents were written for the frontend-only first release and have not been rewritten for the combined deployment.',
      ] },
    ],
    shot: { mobile: 'shots/drivepro-mobile.webp', src: 'shots/drivepro.webp', alt: 'Screenshot of the M.G. Drive Pro website' },
    embed: { kind: 'site', src: 'embeds/drivepro/index.html', host: 'mgdrivepro.co.uk', live: 'https://mgdrivepro.co.uk/', title: 'M.G. Drive Pro home page: a saved copy that scrolls and responds like the live site', label: 'Home page · scroll and click around', note: 'Some parts of the page have been removed from this preview. For the full page, please visit the live site.' },
    stack: ['HTML / CSS / JS', 'Python', 'FastAPI', 'PostgreSQL', 'SQLAlchemy', 'pytest'],
    links: [{ label: 'Visit the site', href: 'https://mgdrivepro.co.uk' }],
  },

  dashboard: {
    n: '05',
    section: 'dashboard',
    title: 'Global Economic Analytics',
    meta: 'Personal project · Data analytics · Rebuilt from a 2025 coursework dashboard · 2026',
    theme: { bg: '#f4f1ea', ink: '#111111', mut: '#4d4a44', acc: '#b3190f', line: 'rgba(17,17,17,.25)', style: 'bauhaus' },
    lede: 'Four questions about 217 economies from 1995 to 2024, with the hypotheses written down before any result and every number traceable to its source. It began as a coursework dashboard whose figures nobody could trace.',
    facts: [
      { n: '217', l: 'economies, 1995 to 2024, from World Bank and IMF data' },
      { n: '4', l: 'hypotheses written first: 2 rejected, 1 confirmed but fragile, 1 inconclusive' },
      { n: '34', l: 'numbered claims, each with its evidence and caveat' },
      { n: '0.57–0.64', l: 'group stability against a bar of 0.80 set in advance' },
    ],
    sections: [
      { h: 'The problem', items: [
        'The coursework dashboard showed one snapshot of country data. Units were unlabelled, periods were mixed, part of the data had been scraped from other sites, and nobody, including me, could trace a number back to its source.',
        'I rebuilt it as an analysis someone else could rerun and try to break: real sources, a written plan, and results reported as they came out, including the rejections.',
      ] },
      { h: 'What I found', items: [
        'Stable types of economy: not by my test. Groups found in resamples agreed with the full-sample groups at 0.57 to 0.64 (adjusted Rand index) against a bar of 0.80. Rejected.',
        'Shared shocks: recessions and debt jumps cluster in 2009 and 2020 (and 1998 for debt). Inflation spikes much less: only 2008 is shared under the test fixed in advance (15% of spikes), and 1999 and 2022 join it with ten times as many shuffles (36%). Rejected.',
        'Catch-up: a little. Poorer economies grew slightly faster over 1995 to 2024, strongly in 2005 to 2014 and compatible with zero in 2015 to 2024. Confirmed by my rule, but it flips under two of three sensitivity checks.',
        'Forecasting: for inflation, the model that did best on the test years has 7% lower error than repeating last year, but only in hindsight; a rule that picks the method from earlier years does not beat it. For growth, nothing beat a five-year average. Inconclusive.',
      ] },
      { h: 'How it works', items: [
        'A pipeline downloads the World Bank and IMF files, logs each with its URL, time and SHA-256 hash, validates them against eleven written rules, and builds DuckDB and Parquet tables.',
        'Analysis modules produce the results and thin notebooks only call them. The explorer is static D3 reading exported JSON, with no external requests.',
        'Every figure links to its source files and to a claim in a register that records the evidence and the caveat. Tests rebuild the data from raw files and compare hashes, check that features contain no future information, and recompute the headline numbers with separate code.',
      ] },
      { h: 'Decisions I would defend', items: [
        'Pre-registration: thresholds sit in a config file committed before any event was counted, and checks added afterwards are labelled as added after the verdict.',
        'Stability as the test for clustering. A method always returns groups; the question is whether they survive resampling.',
        'Baselines first, then models. I knew choosing the best model on the test years favours the models, so I measured by how much.',
        'No forecasts beyond 2024. The models are saved but I did not publish forecasts for real places that could be read as advice.',
        'Accessible by construction: every chart has a table of its numbers. Lighthouse accessibility scores 100 on all 18 runs.',
      ] },
      { h: 'What went wrong', items: [
        'Several series used zero where a value was missing, such as Venezuela’s exports. They passed the range checks; an exact-zero scan found them, and I added a validation rule.',
        'Several sentences in my own reports overstated what the tables showed, for example calling a model “well above persistence” when its error was 4.15 against 4.37. I only caught them by checking each sentence against its numbers.',
        'A first outside review, by an AI model, found two places where I claimed more than I had shown. I corrected both and recorded the review.',
        'The largest forecast errors led me back to the data: of 16 World Bank inflation values below −5% that the IMF also reports, six are strongly contradicted by the IMF’s series. I left the data as published and say so.',
      ] },
      { h: 'Still open', items: [
        'No person has reviewed the methodology yet; so far only an AI model has. Testing was Chromium-only, with no screen-reader test.',
        'The debt and growth module is not built, and the inflation cross-check covers only values below −5%.',
        'I used an AI assistant to help with code, tests, drafts and wording, working from my own written plan. I approved each phase, treated everything it produced as a draft to review, and had every headline number checked a second way.',
      ] },
    ],
    embed: { src: 'dashboard/index.html', title: 'Interactive explorer for Global Economic Analytics' },
    stack: ['Python', 'pandas', 'DuckDB / Parquet', 'scikit-learn', 'LightGBM', 'D3', 'pytest / CI'],
    links: [{ label: 'Read the data story', href: 'dashboard/story.html' }, { label: 'Methods and limits', href: 'dashboard/methods.html' }],
  },
};

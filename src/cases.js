// Case-study content. Everything here is lifted from the existing sections of the site (no new claims).
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
        'Found and fixed a silent filter bug that had left a cohort at 496 records, fixed to 412,934, which unit tests could not catch.',
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
    meta: 'Freelance · WordPress · Live',
    theme: { bg: '#1e5630', ink: '#ffffff', mut: '#d3e4d8', acc: '#fed700', line: 'rgba(255,255,255,.28)', style: 'travel' },
    lede: "Front-end rebuild of a UK specialist Germany-holiday company's live WordPress site, delivered as an upgrade-safe child theme.",
    facts: [
      { n: '59', l: 'destination pages on one layout, all re-audited on mobile' },
      { n: '46%', l: 'less desktop image weight from a card-image fix' },
    ],
    sections: [
      { h: 'What I built', items: [
        'An upgrade-safe child theme, so the live site can keep receiving updates.',
        'A design-token layer and a namespaced component library.',
        'Consent-gated analytics, an EN/DE switch, and a first-party click counter that stores no personal data.',
      ] },
    ],
    shot: { mobile: 'shots/twb-mobile.webp', src: 'shots/twb.webp', alt: 'Screenshot of the Travel Without Borders website' },
    embed: { kind: 'site', src: 'embeds/twb/index.html', host: 'travelwithoutborders.co.uk', minW: 1240, live: 'https://travelwithoutborders.co.uk/', title: 'Travel Without Borders home page: a saved copy that scrolls and responds like the live site', label: 'Home page · scroll and click around', note: 'Some parts of the page have been removed from this preview. For the full page, please visit the live site.' },
    stack: ['PHP', 'WordPress', 'CSS / JS', 'GA4'],
    links: [{ label: 'Visit the live site', href: 'https://travelwithoutborders.co.uk' }],
  },

  drivepro: {
    n: '04',
    section: 'drivepro',
    title: 'M.G. Drive Pro',
    meta: 'Freelance · Full-stack · Live',
    theme: { bg: '#111111', ink: '#fafaf8', mut: '#bdbdb8', acc: '#0ea5e9', line: 'rgba(250,250,248,.22)', style: 'road' },
    lede: 'A website and enquiry backend for an independent driving instructor in the East Midlands.',
    facts: [
      { n: '13', l: 'pages: eight core plus five town landing pages for local search' },
      { n: '140+', l: 'backend tests across the enquiry API' },
    ],
    sections: [
      { h: 'What I built', items: [
        'FastAPI enquiry backend with email notifications, rate limiting and security headers.',
        'WCAG AA contrast fixes, WebP images and clean URLs.',
        'Moved to one combined deployment when the two-service plan didn\'t fit the host.',
      ] },
    ],
    shot: { mobile: 'shots/drivepro-mobile.webp', src: 'shots/drivepro.webp', alt: 'Screenshot of the M.G. Drive Pro website' },
    embed: { kind: 'site', src: 'embeds/drivepro/index.html', host: 'mgdrivepro.co.uk', live: 'https://mgdrivepro.co.uk/', title: 'M.G. Drive Pro home page: a saved copy that scrolls and responds like the live site', label: 'Home page · scroll and click around', note: 'Some parts of the page have been removed from this preview. For the full page, please visit the live site.' },
    stack: ['HTML / CSS / JS', 'Python', 'FastAPI', 'PostgreSQL'],
    links: [{ label: 'Visit the site', href: 'https://mgdrivepro.co.uk' }],
  },

  dashboard: {
    n: '05',
    section: 'dashboard',
    title: 'Global Economic Dashboard',
    meta: 'Coursework · Data visualisation · 2025',
    theme: { bg: '#f4f1ea', ink: '#111111', mut: '#4d4a44', acc: '#b3190f', line: 'rgba(17,17,17,.25)', style: 'bauhaus' },
    lede: 'An interactive, multi-view dashboard for non-experts to explore economic indicators across 173 countries.',
    facts: [
      { n: '173', l: 'countries and territories explored' },
      { n: '3', l: 'coordinated views' },
    ],
    sections: [
      { h: 'How it works', items: [
        'Three coordinated views: a regional world map, a budget-balance vs inflation bubble chart sized by population, and regional small multiples.',
        'Clicking a country or region highlights it across all views and greys out the rest.',
        'Designed around progressive disclosure for a non-expert audience, with prototypes in Figma and a written design rationale.',
      ] },
      { h: 'About the data', items: [
        '173 countries and territories in five regions: Africa 50, Americas 29, Asia 48, Europe 41, Oceania 5.',
        "The original source and year of the data file weren't recorded, so the dashboard says so in its own \"About the data\" panel rather than implying a source it can't back up.",
        'Missing values show as hatched \"No data\" areas and are never counted as zero; medians ignore them, and no country is dropped from any view.',
        'Fourteen countries have no shape on the 110m world map, so a small-countries strip keeps them visible and clickable.',
      ] },
    ],
    embed: { src: 'dashboard/index.html', title: 'Interactive Global Economic Dashboard' },
    stack: ['Python', 'pandas', 'D3', 'Figma'],
    links: [],
  },
};

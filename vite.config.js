import { defineConfig } from 'vite';

// Emit a classic (non-module) script so dist/index.html also opens by double-click from disk.
const classicScript = () => ({
  name: 'classic-script',
  enforce: 'post',
  transformIndexHtml(html) {
    html = html.replace(/ crossorigin/g, '');
    const m = html.match(/<script type="module"[^>]*src="([^"]+)"[^>]*><\/script>/);
    if (!m) return html;
    return html.replace(m[0], '').replace('</body>', `<script defer src="${m[1]}"></script>\n</body>`);
  },
});

export default defineConfig({
  base: './',
  build: {
    cssCodeSplit: false,
    assetsInlineLimit: 0,
    rollupOptions: { output: { format: 'iife', inlineDynamicImports: true } },
  },
  plugins: [classicScript()],
});

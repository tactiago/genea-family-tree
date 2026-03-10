import type { Plugin } from "vite";

/**
 * Converte links de stylesheet do build (assets/*.css) para carregamento assíncrono.
 * Reduz o tempo de renderização inicial e melhora o LCP.
 * Ignora links externos (ex: Google Fonts).
 */
export function nonblockingCss(): Plugin {
  return {
    name: "vite-plugin-nonblocking-css",
    apply: "build",
    transformIndexHtml(html) {
      return html.replace(
        /<link ([^>]*?)rel="stylesheet"([^>]*?)>/gi,
        (match) => {
          const hrefMatch = match.match(/href="([^"]+)"/);
          if (!hrefMatch) return match;
          const href = hrefMatch[1];
          // Só transforma CSS do build (assets/) - não fontes externas
          if (!href.includes("/assets/") && !href.startsWith("/assets/")) {
            return match;
          }
          return `<link rel="preload" as="style" href="${href}" onload="this.onload=null;this.rel='stylesheet'"><noscript><link rel="stylesheet" href="${href}"></noscript>`;
        }
      );
    },
  };
}

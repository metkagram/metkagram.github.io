import { mkdir, writeFile } from "node:fs/promises";

await mkdir("dist", { recursive: true });

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,follow"><meta name="description" content="This Metkagram page does not exist. Continue to the pattern atlas, practice, research, or AI/developer surfaces."><title>Page not found | Metkagram</title><link rel="icon" href="/favicon.ico"></head><body><main style="max-width:760px;margin:12vh auto;padding:0 24px;font-family:system-ui,sans-serif"><p style="font-weight:700;letter-spacing:.08em;text-transform:uppercase">404 · Page not found</p><h1>This route is not part of Metkagram.</h1><p>The page may have moved, been removed, or never existed. Continue from a maintained public surface.</p><p><a href="/">Home</a> · <a href="/patterns/">Pattern atlas</a> · <a href="/practice/">Practice</a> · <a href="/research/">Research</a></p></main></body></html>`;

await writeFile("dist/404.html", html);
console.log("Generated dist/404.html as a noindex error surface without canonical identity.");

import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const root = path.join(process.cwd(), "dist");
const port = Number(process.env.PORT || 4173);
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".xml": "application/xml; charset=utf-8", ".txt": "text/plain; charset=utf-8" };

http.createServer((request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  let relative = decodeURIComponent(url.pathname).replace(/^\/+/, "");
  let file = path.join(root, relative);
  if (url.pathname.endsWith("/")) file = path.join(file, "index.html");
  if (!path.extname(file) && fs.existsSync(path.join(file, "index.html"))) file = path.join(file, "index.html");
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(root, "404.html");
  response.statusCode = file.endsWith("404.html") ? 404 : 200;
  response.setHeader("Content-Type", types[path.extname(file)] || "application/octet-stream");
  response.end(fs.readFileSync(file));
}).listen(port, () => console.log(`Metkagram static site: http://127.0.0.1:${port}`));

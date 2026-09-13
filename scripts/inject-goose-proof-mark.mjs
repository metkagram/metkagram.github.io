import fs from "node:fs";
import path from "node:path";

const output = path.resolve(process.cwd(), process.argv[2] || "dist");
const homepage = path.join(output, "index.html");
if (!fs.existsSync(homepage)) throw new Error(`Missing public homepage: ${homepage}`);
let html = fs.readFileSync(homepage, "utf8");
if (html.includes('data-goose-arwp-proof-mark="0.1"')) process.exit(0);
const product = "https://dkharlanau.github.io/agent-ready-web-profile/product/";
const contract = "https://github.com/dkharlanau/agent-ready-web-profile/blob/main/docs/PROOF-MARK.md";
const mark = `<span data-goose-arwp-proof-mark="0.1" data-arwp-coverage="partial" role="group" aria-label="Goose ARWP Proof Mark: partial audit scope" title="ARWP evidence is present; whole-site audit scope remains incomplete." style="display:inline-flex;max-width:100%;min-height:38px;border:1px solid #080c0b;border-radius:4px;overflow:hidden;background:#fafaf7;color:#080c0b;font:10px/1.15 Arial,sans-serif;vertical-align:middle"><a href="${product}" aria-label="Open Goose ARWP" style="padding:8px 9px;background:#080c0b;color:#fafaf7;text-decoration:none;border-right:4px solid #173bea;font-weight:700;letter-spacing:.06em">GOOSE ARWP</a><a href="${contract}" aria-label="Read Proof Mark contract: partial scope" style="padding:8px 9px;color:#080c0b;text-decoration:none"><strong>PARTIAL</strong> · <span style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace">scope incomplete</span></a></span>`;
const block = `<span data-goose-arwp-proof-mark-slot="footer" style="display:block;margin-top:12px">${mark}</span>`;
if (/<\/footer>/i.test(html)) html = html.replace(/<\/footer>/i, `${block}</footer>`);
else if (/<\/body>/i.test(html)) html = html.replace(/<\/body>/i, `<footer aria-label="Site quality evidence" style="padding:20px">${block}</footer></body>`);
else throw new Error("Public homepage has no footer or closing body for Goose ARWP Proof Mark");
fs.writeFileSync(homepage, html);
console.log("Goose ARWP Proof Mark staged: PARTIAL (scope incomplete)");

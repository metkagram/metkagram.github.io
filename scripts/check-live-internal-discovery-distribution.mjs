const arg = process.argv.find((value) => value.startsWith('--base-url='));
const base = (arg ? arg.slice('--base-url='.length) : 'https://metkagram.github.io/').replace(/\/?$/, '/');
const manifestUrl = new URL('data/internal-discovery.json', base);
const manifestResponse = await fetch(manifestUrl, { headers: { 'user-agent': 'MetkagramInternalDiscoveryCheck/1.0' } });
if (!manifestResponse.ok) throw new Error(`Live Internal Discovery manifest returned ${manifestResponse.status}`);
const manifest = await manifestResponse.json();
if (manifest.arwpRevision !== '793483e3404a97f7892e86bcda3fd317d5c7427c') throw new Error('Live Internal Discovery manifest revision mismatch');
const routes = [...new Set([...manifest.continuationPages.slice(0, 4), ...manifest.utilityPages.slice(0, 2)])];
if (routes.length < 3) throw new Error('Live Internal Discovery sample is unexpectedly small');
for (const canonicalUrl of routes) {
  const canonicalPath = new URL(canonicalUrl).pathname;
  const url = new URL(canonicalPath.replace(/^\//, ''), base);
  const response = await fetch(url, { headers: { 'user-agent': 'MetkagramInternalDiscoveryCheck/1.0' } });
  if (!response.ok) throw new Error(`${canonicalPath}: live fetch returned ${response.status}`);
  const html = await response.text();
  if (!html.includes('src="/assets/internal-discovery.js"')) throw new Error(`${canonicalPath}: helper JS missing live`);
  const isContinuation = manifest.continuationPages.includes(canonicalUrl);
  const isUtility = manifest.utilityPages.includes(canonicalUrl);
  if (isContinuation && !html.includes('data-internal-discovery-continuation')) throw new Error(`${canonicalPath}: continuation missing live`);
  if (isUtility && (!html.includes('data-save-page') || !html.includes('data-cite-page'))) throw new Error(`${canonicalPath}: Save/Cite extension missing live`);
}
console.log(`Live Internal Discovery & Distribution passed on ${routes.length} representative Metkagram learning pages.`);

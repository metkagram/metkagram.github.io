// Keep the library discoverable in the existing primary navigation without
// depending on a decorative homepage section or changing its reviewed copy.
export function markHomepageLibraryEntry(html, locale) {
  const label = { en: "Patterns", ru: "Паттерны" }[locale];
  const href = `/${locale}/practice/`;
  const fail = () => { throw new Error(`Homepage library CTA contract changed for ${locale}`); };
  const navs = [...html.matchAll(/<nav\b[^>]*\bid="site-nav"[^>]*>[\s\S]*?<\/nav>/g)];
  if (!label || navs.length !== 1) fail();

  const nav = navs[0][0];
  const links = [...nav.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)]
    .filter((match) => match[1].match(/\bhref="([^"]*)"/)?.[1] === href);
  if (links.length !== 1) fail();
  const [anchor, , content] = links[0];
  const text = content.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  if (text !== label) fail();

  const marked = anchor.replace(/\bhref=/, 'data-product-entry="library" href=');
  return html.replace(nav, nav.replace(anchor, marked));
}

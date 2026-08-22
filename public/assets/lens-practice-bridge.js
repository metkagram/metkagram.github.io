const root = document.querySelector('[data-pattern-lens]');
const results = root?.querySelector('[data-lens-results]');
const locale = document.documentElement.lang === 'ru' ? 'ru' : 'en';

if (results) {
  const enhance = () => {
    results.querySelectorAll('.lens-card-foot a').forEach((link) => {
      if (!link.getAttribute('href')?.includes('/practice/')) return;
      const url = new URL(link.getAttribute('href'), window.location.origin);
      url.hash = 'active-practice';
      const href = `${url.pathname}${url.hash}`;
      const label = locale === 'ru' ? 'Попробовать паттерн →' : 'Practise this pattern →';
      // The observer also sees this link's own text node. Only mutate when a
      // value actually changes, otherwise an arriving result creates a loop.
      if (link.getAttribute('href') !== href) link.setAttribute('href', href);
      if (link.textContent !== label) link.textContent = label;
    });
  };
  const observer = new MutationObserver(enhance);
  observer.observe(results, { childList: true, subtree: true });
  enhance();
}

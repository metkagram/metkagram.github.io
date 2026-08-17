const root = document.querySelector('[data-pattern-lens]');
const results = root?.querySelector('[data-lens-results]');
const locale = document.documentElement.lang === 'ru' ? 'ru' : 'en';

if (results) {
  const enhance = () => {
    results.querySelectorAll('.lens-card-foot a').forEach((link) => {
      if (!link.getAttribute('href')?.includes('/practice/')) return;
      const url = new URL(link.getAttribute('href'), window.location.origin);
      url.hash = 'active-practice';
      link.setAttribute('href', `${url.pathname}${url.hash}`);
      link.textContent = locale === 'ru' ? 'Попробовать паттерн →' : 'Practise this pattern →';
    });
  };
  const observer = new MutationObserver(enhance);
  observer.observe(results, { childList: true, subtree: true });
  enhance();
}

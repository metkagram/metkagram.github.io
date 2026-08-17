const locale = document.documentElement.lang === "ru" ? "ru" : "en";
const licensingHref = `/${locale}/licensing/`;

function addFooterLicensingLink() {
  document.querySelectorAll(".footer-legal").forEach((nav) => {
    if (nav.querySelector(`a[href="${licensingHref}"]`)) return;
    const link = document.createElement("a");
    link.href = licensingHref;
    link.textContent = locale === "ru" ? "Права" : "Licensing";
    nav.prepend(link);
  });
}

function replaceLegacyLicenseLinks() {
  document.querySelectorAll('a[href="/LICENSE"]').forEach((link) => {
    if (!/CC BY-NC 4\.0/i.test(link.textContent || "")) return;
    link.href = licensingHref;
    link.textContent = locale === "ru" ? "Права и лицензирование →" : "Licensing & rights →";
  });
}

function updateAboutLicenseCopy() {
  const section = document.querySelector(".about-sections #license");
  if (!section) return;
  const text = section.querySelector("p");
  const link = section.querySelector("a");
  if (text) {
    text.textContent = locale === "ru"
      ? "Metkagram открыт для просмотра и обычного учебного использования сайта, но код, новые версии корпуса, схема разметки и исследовательские материалы по умолчанию не являются open source или open data. Для существенного повторного использования, исследований с копией корпуса и коммерческой интеграции требуется отдельное разрешение."
      : "Metkagram is publicly inspectable and the hosted learning site remains available to end users, but the source code, new corpus revisions, annotation scheme and research materials are not open source or open data by default. Substantial reuse, corpus-based research and commercial integration require separate permission.";
  }
  if (link) {
    link.href = licensingHref;
    link.textContent = locale === "ru" ? "Права и лицензирование →" : "Licensing & rights →";
  }
}

function updateTermsCopy() {
  if (!window.location.pathname.endsWith("/legal/terms/")) return;
  const sections = [...document.querySelectorAll(".legal-document > section")];
  const contentSection = sections[2];
  const text = contentSection?.querySelector("p");
  if (!text) return;
  text.textContent = locale === "ru"
    ? "Учебный сайт Metkagram доступен для обычного личного использования. Исходный код, новые версии датасетов, система разметки и существенные части корпуса опубликованы для прозрачности, но по умолчанию не имеют открытой лицензии. Копирование, распространение, производные датасеты, обучение моделей на существенном материале и коммерческая интеграция требуют разрешения, кроме случаев, прямо разрешённых законом. Актуальные условия приведены на странице «Права и лицензирование»."
    : "The hosted Metkagram learning site is available for ordinary personal end-user use. Source code, new dataset revisions, annotation materials and substantial corpus content are published for transparency but are not openly licensed by default. Copying, redistribution, derived datasets, model training on substantial material and commercial integration require permission except where applicable law independently permits the use. See the Licensing & Rights page for the current terms.";

  const related = document.querySelector(".legal-related nav");
  if (related && !related.querySelector(`a[href="${licensingHref}"]`)) {
    const link = document.createElement("a");
    link.href = licensingHref;
    link.innerHTML = `${locale === "ru" ? "Права и лицензирование" : "Licensing & rights"} <span aria-hidden="true">→</span>`;
    related.prepend(link);
  }
}

function addAiRightsLink() {
  if (!window.location.pathname.endsWith("/ai/")) return;
  const attribution = document.querySelector("#attribution .legal-note");
  if (!attribution) return;
  const old = attribution.querySelector('a[href="/LICENSE"]');
  if (old) {
    old.href = licensingHref;
    old.textContent = locale === "ru" ? "Текущие права" : "Current rights";
  }
  if (!attribution.querySelector('a[href="/rights.json"]')) {
    attribution.append(" · ");
    const rights = document.createElement("a");
    rights.href = "/rights.json";
    rights.textContent = "rights.json";
    attribution.append(rights);
  }
}

addFooterLicensingLink();
replaceLegacyLicenseLinks();
updateAboutLicenseCopy();
updateTermsCopy();
addAiRightsLink();

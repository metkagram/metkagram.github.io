(function () {
  "use strict";
  var key = "portfolio_analytics_consent";
  var measurementId = "G-T2TS9NCN2N";
  function load() {
    if (document.querySelector("script[data-portfolio-ga]")) return;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", measurementId, { anonymize_ip: true });
    var script = document.createElement("script");
    script.async = true;
    script.dataset.portfolioGa = "";
    script.src = "https://www.googletagmanager.com/gtag/js?id=" + measurementId;
    document.head.appendChild(script);
  }
  function prompt() {
    var ru = document.documentElement.lang === "ru";
    var box = document.createElement("div");
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-label", ru ? "Настройки аналитики" : "Analytics settings");
    box.style.cssText = "position:fixed;z-index:2147483647;left:1rem;right:1rem;bottom:1rem;max-width:44rem;margin:auto;padding:1rem;border-radius:12px;background:#111;color:#fff;font:16px/1.45 system-ui;box-shadow:0 8px 30px #0008";
    box.innerHTML = (ru ? "Мы используем необязательную аналитику, чтобы улучшать сайт. " : "We use optional analytics to improve this site. ") + "<button type=button data-analytics-yes>" + (ru ? "Разрешить" : "Allow") + "</button> <button type=button data-analytics-no>" + (ru ? "Отклонить" : "Decline") + "</button>";
    box.addEventListener("click", function (event) {
      if (event.target.matches("[data-analytics-yes]")) { localStorage.setItem(key, "yes"); box.remove(); load(); }
      if (event.target.matches("[data-analytics-no]")) { localStorage.setItem(key, "no"); box.remove(); }
    });
    document.body.appendChild(box);
  }
  var consent = localStorage.getItem(key);
  if (consent === "yes") load();
  else if (consent !== "no") document.addEventListener("DOMContentLoaded", prompt);
})();

(function () {
  const storageKey = "mininione_demo_notice_dismissed";

  if (!document.body || document.body.dataset.demoNoticeMounted === "1") {
    return;
  }

  if (localStorage.getItem(storageKey) === "1") {
    document.body.dataset.demoNoticeMounted = "1";
    return;
  }

  const notice = document.createElement("aside");
  notice.className = "demo-notice";
  notice.setAttribute("role", "status");
  notice.setAttribute("aria-live", "polite");
  notice.innerHTML = `
    <div class="demo-notice__badge">Démo</div>
    <div class="demo-notice__content">
      <strong>Site de démonstration</strong>
      <span>Navigation et paiement simulés, aucune transaction réelle.</span>
    </div>
    <button type="button" class="demo-notice__close" aria-label="Masquer l'encart de démonstration">×</button>
  `;

  notice.querySelector(".demo-notice__close")?.addEventListener("click", () => {
    localStorage.setItem(storageKey, "1");
    notice.remove();
  });

  document.body.dataset.demoNoticeMounted = "1";
  document.body.appendChild(notice);
})();

// GA4 events carried over from the old Vite site's client/src/lib/analytics.ts.
// Page views are left to the gtag config in the page head. This file covers
// the events that still match this site: quote clicks, the quote form,
// mailto/tel links, scroll depth, and time on page.
(function () {
  if (typeof window.gtag !== "function") return;

  var ctaKeywords = [
    "request a quote",
    "request my quote",
    "contact us",
    "get started",
    "request",
    "agriculture quote",
    "reclamation quote",
  ];

  function event(name, params) {
    window.gtag("event", name, params);
  }

  document.addEventListener("click", function (e) {
    var target = e.target && e.target.closest ? e.target : e.target && e.target.parentElement;
    if (!target || !target.closest) return;
    var link = target.closest("a[href]");
    if (link) {
      var href = link.getAttribute("href") || "";
      if (href.indexOf("mailto:") === 0) {
        event("qualified_lead", {
          event_category: "engagement",
          event_label: "email",
          method: "email",
          value: 100,
          email_address: href.replace(/^mailto:/i, ""),
          link_url: href,
        });
      } else if (href.indexOf("tel:") === 0) {
        event("qualified_lead", {
          event_category: "engagement",
          event_label: "phone",
          method: "phone",
          value: 100,
          phone_number: href.replace(/^tel:/i, ""),
          link_url: href,
        });
      }
    }

    var control = target.closest("button, a.btn, a.q");
    if (!control || (control.tagName === "BUTTON" && control.type === "submit")) return;
    var text = (control.textContent || "").replace(/\s+/g, " ").trim();
    var lower = text.toLowerCase();
    if (!ctaKeywords.some(function (keyword) { return lower.indexOf(keyword) !== -1; })) return;
    event("cta_click", {
      event_category: "engagement",
      event_label: text,
      button_text: text,
      destination: control.getAttribute("href") || "",
      location: window.location.pathname,
      value: 25,
    });
  });

  var form = document.getElementById("quote-form");
  if (form) {
    form.addEventListener("submit", function () {
      var type = form.querySelector('[name="type"]');
      var company = form.querySelector('[name="company"]');
      var inquiry = type && type.options && type.selectedIndex >= 0
        ? type.options[type.selectedIndex].text
        : "";
      event("qualified_lead", {
        event_category: "engagement",
        event_label: "form",
        method: "form",
        value: 100,
        form_name: "contact_form",
        inquiry_type: inquiry,
        company: company ? company.value : "",
      });
    });
  }

  var thresholds = [25, 50, 75, 90];
  var triggered = {};
  var scrollTimer;
  function checkScroll() {
    var scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollHeight <= 0) return;
    var percent = (window.scrollY / scrollHeight) * 100;
    thresholds.forEach(function (threshold) {
      if (percent < threshold || triggered[threshold]) return;
      triggered[threshold] = true;
      event("scroll_depth", {
        event_category: "engagement",
        event_label: threshold + "%",
        percent_scrolled: threshold,
        page_path: window.location.pathname,
      });
    });
  }
  window.addEventListener("scroll", function () {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(checkScroll, 300);
  }, { passive: true });

  var start = Date.now();
  function timeOnPage() {
    var seconds = Math.round((Date.now() - start) / 1000);
    if (seconds <= 10) return;
    event("time_on_page", {
      event_category: "engagement",
      event_label: window.location.pathname,
      time_seconds: seconds,
      page_path: window.location.pathname,
    });
  }
  window.addEventListener("pagehide", timeOnPage);
})();

/*
 * Tiny DE/EN switcher shared by the concept pages.
 *   <span data-i18n="key">       -> textContent
 *   <span data-i18n-html="key">  -> innerHTML (trusted page strings only)
 *   <a data-i18n-aria="key">     -> aria-label
 *   <button data-lang="en">      -> switches language
 * Pages listen for the "langchange" event to re-render data-driven parts.
 */
(function () {
  var KEY = "jpweb-lang";
  var lang = null;
  try { lang = localStorage.getItem(KEY); } catch (e) {}
  if (lang !== "de" && lang !== "en") {
    lang = (navigator.language || "de").toLowerCase().indexOf("de") === 0 ? "de" : "en";
  }

  var I18N = {
    dict: { de: {}, en: {} },
    get lang() { return lang; },

    // Pick the right language from a { de, en } pair, or pass plain strings through.
    L: function (v) {
      if (v == null) return "";
      if (typeof v === "object") return v[lang] != null ? v[lang] : (v.de || "");
      return String(v);
    },

    t: function (key) {
      var d = I18N.dict[lang] || {};
      if (d[key] != null) return d[key];
      return (I18N.dict.de && I18N.dict.de[key] != null) ? I18N.dict.de[key] : key;
    },

    formatDate: function (iso, opts) {
      var d = new Date(iso + "T12:00:00");
      return d.toLocaleDateString(lang === "de" ? "de-DE" : "en-GB", opts);
    },

    set: function (next) {
      if (next !== "de" && next !== "en") return;
      lang = next;
      try { localStorage.setItem(KEY, lang); } catch (e) {}
      apply();
    },

    init: function (dict) {
      I18N.dict = dict;
      document.addEventListener("click", function (e) {
        var b = e.target.closest("[data-lang]");
        if (b) { e.preventDefault(); I18N.set(b.getAttribute("data-lang")); }
      });
      apply();
    }
  };

  function apply() {
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      el.textContent = I18N.t(el.getAttribute("data-i18n"));
    });
    document.querySelectorAll("[data-i18n-html]").forEach(function (el) {
      el.innerHTML = I18N.t(el.getAttribute("data-i18n-html"));
    });
    document.querySelectorAll("[data-i18n-aria]").forEach(function (el) {
      el.setAttribute("aria-label", I18N.t(el.getAttribute("data-i18n-aria")));
    });
    document.querySelectorAll("[data-lang]").forEach(function (el) {
      el.setAttribute("aria-pressed", String(el.getAttribute("data-lang") === lang));
    });
    document.dispatchEvent(new CustomEvent("langchange", { detail: { lang: lang } }));
  }

  window.I18N = I18N;
})();

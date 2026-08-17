/* ============================================================
   leads.js — UTM capture + lead payload helper.
   Loaded in <head> on every page, before any tracking pixels
   and before the brochure form can submit.

   On the first visit that carries UTM params in the URL, we stash
   each one in localStorage so the values survive the visitor browsing
   several pages before submitting a form. We never overwrite an
   existing value on a later visit — the first-touch attribution is
   the one that matters for ads.

   getUtmPayload() returns an object the brochure form merges into its
   webhook POST so the lead carries its attribution with it.
   ============================================================ */
(function (global) {
  "use strict";

  var UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];
  var PREFIX = "affinityUtm_";

  function lsGet(key) {
    try { return localStorage.getItem(key) || ""; } catch (e) { return ""; }
  }
  function lsSet(key, value) {
    try { localStorage.setItem(key, value); } catch (e) {}
  }

  /* Capture from the current URL on this visit. First-touch wins: a
     param already in localStorage is left untouched. */
  try {
    var params = new URLSearchParams(global.location.search);
    UTM_KEYS.forEach(function (k) {
      var val = (params.get(k) || "").trim();
      if (val && !lsGet(PREFIX + k)) {
        lsSet(PREFIX + k, val);
      }
    });
  } catch (e) {}

  function getUtmPayload() {
    var out = {};
    UTM_KEYS.forEach(function (k) {
      var v = lsGet(PREFIX + k);
      if (v) out[k] = v;
    });
    return out;
  }

  global.AffinityLeads = { getUtmPayload: getUtmPayload };
})(window);
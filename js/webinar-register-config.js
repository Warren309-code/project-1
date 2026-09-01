/**
 * webinar-register-config.js — the single "env var" layer for the Free
 * Live Webinar funnel (webinar-register.html, single URL with a
 * client-side A/B split).
 *
 * Renamed from the standalone build's config.js, and the global it sets
 * is __WEBINAR_CONFIG__ rather than __CONFIG__, so it can't collide with
 * anything the rest of the site (or a future page) defines under that
 * more generic name. Both A/B variants render from this one file, so a
 * change here (e.g. filling in the real webhook URLs) applies to both
 * at once.
 *
 * Meta Pixel (1550787015646145) and the Hyros script are loaded directly
 * in each page's <head>, matching register.html's existing tracking —
 * not through this config — so there's no META_PIXEL_ID key here. GA4
 * stays here as an opt-in extra, off by default.
 */
window.__WEBINAR_CONFIG__ = {
  // ---- Form -----------------------------------------------------------
  // "built-in"  → use the page's own registration form (default)
  // "embedded"  → replace the form with EMBED_SNIPPET / EMBED_URL instead
  FORM_MODE: "built-in",

  // Raw HTML/script markup for a third-party embed, used only when
  // FORM_MODE = "embedded". Provider-agnostic on purpose — drop in whatever
  // webinar platform is used (WebinarKit, EverWebinar, GHL, Zoom, etc).
  EMBED_SNIPPET: "",
  // Alternative to EMBED_SNIPPET: if you only have a URL, this renders it in
  // an iframe instead. Leave blank if you're using EMBED_SNIPPET.
  EMBED_URL: "",

  // ---- Webhooks ---------------------------------------------------------
  // TODO(Razvan): fill in the real endpoints before this goes live behind
  // paid traffic — see CONTENT-TODO in the PR description.
  WEBHOOK_PRIMARY_URL: "",
  WEBHOOK_FALLBACK_URL: "",
  // "fallback"  → fallback only fires if primary fails (default, matches spec)
  // "duplicate" → NOT YET IMPLEMENTED. Stubbed here so a future "always send
  //               to both" mode is a one-line change in webinar-form.js.
  WEBHOOK_MODE: "fallback",
  WEBHOOK_TIMEOUT_MS: 5000,

  // ---- Event date / countdown -------------------------------------------
  // See js/webinar-countdown.js for how these combine. All time math is
  // done in EVENT_TIMEZONE (a real IANA zone), so BST/GMT is handled
  // automatically — never hardcode a UTC offset here.
  EVENT_WEEKDAY: 3,                 // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  EVENT_HOUR: 19,                   // 24h clock, in EVENT_TIMEZONE
  EVENT_MINUTE: 0,
  ROLLOVER_MINUTES_AFTER_START: 30, // once this many minutes past start, the
                                     // page flips to advertising next week's date
  EVENT_TIMEZONE: "Europe/London",

  // ---- Optional analytics (no-op if left blank) --------------------------
  GA4_ID: "",
};

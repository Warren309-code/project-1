/**
 * webinar-form.js — built-in registration form for the Free Live Webinar
 * funnel (webinar-register.html / webinar-register-b.html): validation,
 * attribution capture, and dual-webhook submission with fallback.
 *
 * Renamed from the standalone build's form.js to avoid colliding with the
 * site's existing js/main.js and to make it obvious at a glance which
 * page this belongs to.
 *
 * UTM capture reuses the site's existing js/leads.js (AffinityLeads —
 * first-touch, localStorage-backed, already loaded sitewide) instead of
 * re-capturing utm_* params from scratch, so attribution stays consistent
 * with every other funnel on the site. leads.js only tracks the five
 * utm_* keys though, so ad click-ids (fbclid/gclid/ttclid/msclkid/
 * cmc_adid) are captured here on top of it — this funnel runs behind paid
 * traffic and losing those is a real cost.
 *
 * The FORM_MODE swap itself (built-in vs. embedded) happens in a small
 * inline script in the page, positioned immediately after the form
 * container so it runs synchronously before that part of the page paints.
 * Everything in THIS file only matters when FORM_MODE is "built-in".
 */

const CLICK_ID_PARAMS = ["fbclid", "gclid", "ttclid", "msclkid", "cmc_adid"];
const QUEUE_KEY = "affinityWebinarLeadQueue_v1";

/** utm_* (via the shared AffinityLeads capture) + this visit's click-ids. */
function captureAttribution() {
  const attribution = (window.AffinityLeads && typeof window.AffinityLeads.getUtmPayload === "function")
    ? window.AffinityLeads.getUtmPayload()
    : {};
  const params = new URLSearchParams(window.location.search);
  for (const key of CLICK_ID_PARAMS) {
    const value = params.get(key);
    if (value) attribution[key] = value;
  }
  attribution.landing_url = window.location.href;
  attribution.referrer = document.referrer || "";
  return attribution;
}

function isValidEmail(value) {
  // Deliberately simple — good enough to catch typos without the false
  // negatives a stricter regex tends to produce.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function setFieldError(fieldEl, message) {
  const wrapper = fieldEl.closest("[data-field]");
  if (!wrapper) return;
  wrapper.classList.toggle("wr-has-error", Boolean(message));
  const errorEl = wrapper.querySelector(".wr-field-error");
  if (errorEl) errorEl.textContent = message || "";
}

function validateForm(form) {
  let valid = true;
  const firstName = form.querySelector("#wr-first-name");
  const lastName = form.querySelector("#wr-last-name");
  const email = form.querySelector("#wr-email");
  const phone = form.querySelector("#wr-phone");

  if (!firstName.value.trim()) { setFieldError(firstName, "Enter your first name"); valid = false; }
  else setFieldError(firstName, "");

  if (!lastName.value.trim()) { setFieldError(lastName, "Enter your last name"); valid = false; }
  else setFieldError(lastName, "");

  if (!isValidEmail(email.value.trim())) { setFieldError(email, "Enter a valid email address"); valid = false; }
  else setFieldError(email, "");

  if (!phone.value.trim() || phone.value.trim().length < 6) { setFieldError(phone, "Enter a valid phone number"); valid = false; }
  else setFieldError(phone, "");

  return valid;
}

async function postWithTimeout(url, payload, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Sequential fallback (WEBHOOK_MODE="fallback", the only mode implemented —
 * see webinar-register-config.js for why "duplicate" is stubbed but not
 * built). Never silently drops a lead: if both webhooks fail, the payload
 * is queued in localStorage and retried on the next page load, and the
 * user sees a clear, calm inline message rather than a spinner that never
 * resolves.
 */
async function submitLead(payload, config) {
  if (config.WEBHOOK_PRIMARY_URL) {
    const primaryOk = await postWithTimeout(config.WEBHOOK_PRIMARY_URL, payload, config.WEBHOOK_TIMEOUT_MS);
    if (primaryOk) return { ok: true, via: "primary" };
  }
  if (config.WEBHOOK_FALLBACK_URL) {
    const fallbackOk = await postWithTimeout(config.WEBHOOK_FALLBACK_URL, payload, config.WEBHOOK_TIMEOUT_MS);
    if (fallbackOk) return { ok: true, via: "fallback" };
  }
  queueLead(payload);
  return { ok: false, via: "queued" };
}

function queueLead(payload) {
  try {
    const existing = JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
    existing.push({ ...payload, queued_at: new Date().toISOString() });
    localStorage.setItem(QUEUE_KEY, JSON.stringify(existing));
  } catch {
    // localStorage unavailable (private mode, quota, etc.) — nothing more we
    // can do client-side; the visible error message is the honest fallback.
  }
}

/** Best-effort retry of any leads stranded by a previous failed session. */
async function flushQueuedLeads(config) {
  let queue;
  try {
    queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
  } catch {
    return;
  }
  if (!queue.length) return;

  const stillFailed = [];
  for (const payload of queue) {
    const result = await submitLead(payload, config);
    if (!result.ok) stillFailed.push(payload);
  }
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(stillFailed));
  } catch {
    /* best-effort only */
  }
}

/** Meta Pixel + Hyros are loaded directly in <head> on this page (matching
 *  register.html), not via config — so this fires unconditionally rather
 *  than gating on a config.META_PIXEL_ID that no longer drives the pixel. */
function trackConversion(config) {
  try {
    if (typeof window.fbq === "function") window.fbq("track", "Lead");
    if (config.GA4_ID && typeof window.gtag === "function") window.gtag("event", "generate_lead");
  } catch {
    /* analytics must never break the registration flow */
  }
}

function showSuccessState(form) {
  const wrapper = form.closest("[data-form-panel]") || form.parentElement;
  const successEl = wrapper.querySelector("[data-form-success]");
  form.hidden = true;
  if (successEl) successEl.hidden = false;
}

function showSubmitError(form, message) {
  const banner = form.querySelector("[data-form-banner]");
  if (banner) {
    banner.textContent = message;
    banner.hidden = false;
  }
}

function initBuiltInForm(config) {
  const form = document.querySelector("#wr-registration-form");
  if (!form) return; // embedded mode — nothing to wire up

  const attribution = captureAttribution();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    // Honeypot: a real visitor never fills this hidden field.
    const honeypot = form.querySelector("#wr-company");
    if (honeypot && honeypot.value.trim()) return;

    if (!validateForm(form)) return;

    const submitBtn = form.querySelector("button[type=submit]");
    if (submitBtn) { submitBtn.disabled = true; submitBtn.dataset.loading = "true"; }

    const payload = {
      first_name: form.querySelector("#wr-first-name").value.trim(),
      last_name: form.querySelector("#wr-last-name").value.trim(),
      email: form.querySelector("#wr-email").value.trim(),
      phone: `${form.querySelector("#wr-phone-country").value}${form.querySelector("#wr-phone").value.trim()}`,
      event_weekday: config.EVENT_WEEKDAY,
      event_hour: config.EVENT_HOUR,
      event_timezone: config.EVENT_TIMEZONE,
      funnel: document.body.dataset.page || "",
      submitted_at: new Date().toISOString(),
      ...attribution,
    };

    const result = await submitLead(payload, config);

    if (submitBtn) { submitBtn.disabled = false; submitBtn.dataset.loading = "false"; }

    if (result.ok) {
      trackConversion(config);
      showSuccessState(form);
    } else {
      showSubmitError(form, "We couldn't confirm your spot just yet — your details are saved and we'll keep trying. Please also try submitting again in a moment.");
    }
  });
}

export function initForm(config) {
  initBuiltInForm(config);
  // Fire-and-forget: don't block page interactivity on retrying old leads.
  flushQueuedLeads(config);
}

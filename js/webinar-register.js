/**
 * webinar-register.js — page bootstrap for the Free Live Webinar funnel
 * (webinar-register.html, single URL with a client-side A/B split):
 * countdown render loop, FAQ accordion, scroll-reveal, and form wiring.
 *
 * Renamed from the standalone build's main.js to avoid colliding with the
 * site's existing js/main.js — both are loaded together on this page
 * (js/main.js for shared nav/marquee/etc. site behavior, this file for
 * funnel-specific behavior), so the names must not clash.
 */
import { computeEventTarget, msUntilStart, isLiveNow, breakdown, formatEventDateLine, weekdayName } from "./webinar-countdown.js";
import { initForm } from "./webinar-form.js";

const config = window.__WEBINAR_CONFIG__ || {};

/* ---- Countdown + date line -------------------------------------------- */
function pad(n) { return String(n).padStart(2, "0"); }

function renderEventDate() {
  const now = new Date();
  const target = computeEventTarget(now, config);
  const dateLine = formatEventDateLine(target, config);

  document.querySelectorAll("#wr-event-date-line, #wr-event-date-line-2").forEach((el) => {
    if (el.textContent !== dateLine) el.textContent = dateLine;
  });

  const formLine = document.getElementById("wr-form-event-line");
  if (formLine) {
    const short = `${target.label === "this" ? "This" : "Next"} ${weekdayName(target.weekday)} · ${dateLine.split("· ")[1]} · Online via Zoom`;
    if (formLine.textContent !== short) formLine.textContent = short;
  }

  const urgencyDay = document.getElementById("wr-urgency-day");
  if (urgencyDay) {
    const text = `THIS ${weekdayName(config.EVENT_WEEKDAY).toUpperCase()}`;
    if (urgencyDay.textContent !== text) urgencyDay.textContent = text;
  }

  const live = isLiveNow(target, now);
  document.body.classList.toggle("wr-is-live", live);

  if (!live) {
    const remaining = breakdown(msUntilStart(target, now));
    setText("wr-cd-days", pad(remaining.days));
    setText("wr-cd-hours", pad(remaining.hours));
    setText("wr-cd-minutes", pad(remaining.minutes));
    setText("wr-cd-seconds", pad(remaining.seconds));
  }
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el && el.textContent !== value) el.textContent = value;
}

renderEventDate();
setInterval(renderEventDate, 1000);

/* ---- FAQ accordion (single-open, accessible) ----------------------------- */
document.querySelectorAll(".wr-faq-item").forEach((item, index) => {
  const button = item.querySelector(".wr-faq-item__question");
  const answer = item.querySelector(".wr-faq-item__answer");
  const answerId = `wr-faq-answer-${index}`;
  answer.id = answerId;
  button.setAttribute("aria-controls", answerId);

  button.addEventListener("click", () => {
    const isOpen = item.getAttribute("data-open") === "true";
    // Single-open: close any sibling that's currently open.
    document.querySelectorAll(".wr-faq-item[data-open='true']").forEach((openItem) => {
      if (openItem !== item) {
        openItem.setAttribute("data-open", "false");
        openItem.querySelector(".wr-faq-item__question").setAttribute("aria-expanded", "false");
      }
    });
    item.setAttribute("data-open", String(!isOpen));
    button.setAttribute("aria-expanded", String(!isOpen));
  });
});

/* ---- Scroll reveal (progressive enhancement only) --------------------------
   Content is visible by default in the HTML/CSS with no JS at all. Only once
   we get here — JS has loaded and run — do we opt sections into the hidden
   starting state, immediately before observing them, so there's never a
   window where content is hidden with nothing watching to reveal it. */
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("wr-is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll(".wr-reveal").forEach((el) => {
    el.classList.add("wr-reveal-pending");
    observer.observe(el);
  });
}
// No else needed: without IntersectionObserver support, .wr-reveal-pending is
// simply never added, and the sections stay in their default visible state.

/* ---- Optional GA4 loader (no-op unless configured) --------------------------
   Meta Pixel is loaded directly in <head> on this page (matching
   register.html's tracking) rather than through config, so only GA4 stays
   here as an opt-in hook. */
function loadGa4(measurementId) {
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag("js", new Date());
  window.gtag("config", measurementId);
}

if (config.GA4_ID) loadGa4(config.GA4_ID);

/* ---- Form wiring ------------------------------------------------------------ */
initForm(config);

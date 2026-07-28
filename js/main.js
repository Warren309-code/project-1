(function () {
  var body = document.body;
  body.classList.add("js-anim");

  /* mobile nav */
  var toggle = document.querySelector("[data-mob-toggle]");
  if (toggle) {
    toggle.addEventListener("click", function () {
      var open = body.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
  }

  /* dropdowns (click for touch/mobile; hover handled in CSS) */
  document.querySelectorAll("[data-drop]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var item = btn.closest(".menu-item");
      document.querySelectorAll(".menu-item.open").forEach(function (other) {
        if (other !== item) other.classList.remove("open");
      });
      item.classList.toggle("open");
    });
  });

  document.addEventListener("click", function (e) {
    if (!e.target.closest(".menu-item")) {
      document.querySelectorAll(".menu-item.open").forEach(function (item) {
        item.classList.remove("open");
      });
    }
  });

  /* scroll reveals with gentle stagger */
  var revealed = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var delay = parseFloat(el.dataset.rvDelay || 0);
        setTimeout(function () {
          el.classList.add("in");
        }, delay);
        revealed.unobserve(el);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -4% 0px" }
  );

  document.querySelectorAll(".rv").forEach(function (el, i) {
    revealed.observe(el);
  });

  /* auto-stagger siblings inside marked groups */
  document.querySelectorAll("[data-stagger]").forEach(function (group) {
    Array.prototype.forEach.call(group.children, function (child, i) {
      child.classList.add("rv");
      child.dataset.rvDelay = String(Math.min(i * 80, 240));
      revealed.observe(child);
    });
  });

  /* counters */
  var counted = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        counted.unobserve(el);
        var target = parseFloat(el.dataset.count);
        var prefix = el.dataset.prefix || "";
        var suffix = el.dataset.suffix || "";
        var dur = 1600;
        var t0 = null;
        function frame(t) {
          if (!t0) t0 = t;
          var p = Math.min((t - t0) / dur, 1);
          var eased = 1 - Math.pow(1 - p, 4);
          var val = Math.round(target * eased);
          el.innerHTML = prefix + val.toLocaleString("en-IE") + '<span class="accent">' + suffix + "</span>";
          if (p < 1) requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
      });
    },
    { threshold: 0.5 }
  );

  document.querySelectorAll("[data-count]").forEach(function (el) {
    counted.observe(el);
  });

  /* story rail arrows */
  document.querySelectorAll("[data-rail-wrap]").forEach(function (wrap) {
    var rail = wrap.querySelector("[data-rail]");
    if (!rail) return;
    function step(dir) {
      var card = rail.querySelector(".story");
      var w = card ? card.getBoundingClientRect().width + 22 : 380;
      rail.scrollBy({ left: w * dir, behavior: "smooth" });
    }
    var prev = wrap.querySelector("[data-rail-prev]");
    var next = wrap.querySelector("[data-rail-next]");
    if (prev) prev.addEventListener("click", function () { step(-1); });
    if (next) next.addEventListener("click", function () { step(1); });
  });

  /* duplicate marquee tracks so the loop is seamless (-50% translate lands
     exactly one set over). Logos decode async so the duplicated set never
     blocks first paint. */
  document.querySelectorAll("[data-marquee]").forEach(function (track) {
    track.innerHTML += track.innerHTML;
    track.querySelectorAll("img").forEach(function (img) { img.decoding = "async"; });
  });

  /* header condenses once the page is scrolled past the hero edge */
  var head = document.querySelector(".site-head");
  if (head) {
    var syncHead = function () {
      head.classList.toggle("scrolled", window.scrollY > 40);
    };
    syncHead();
    window.addEventListener("scroll", syncHead, { passive: true });
  }

  /* home hero: stagger the wrap's children on load instead of lifting the block */
  document.querySelectorAll(".hero .wrap.rv").forEach(function (wrap) {
    wrap.classList.remove("rv");
    Array.prototype.forEach.call(wrap.children, function (child, i) {
      child.classList.add("rv");
      if (child.tagName === "H1") child.classList.add("rv-blur");
      child.dataset.rvDelay = String(Math.min(i * 90, 360));
      revealed.observe(child);
    });
  });

  /* Motion is intentionally restrained: the homepage hero is the one
     orchestrated entrance (handled above). Everything else simply
     appears — no scroll parallax, no side-entrance transforms. The
     .rv class is a no-op outside .hero by design (see main.css). */
})();

/* js/brochure-modal.js
 * Shared brochure opt-in modal. Included on register.html and the general
 * pages (home, programmes, graduates, how-it-works). If the page already
 * carries the #brochure-modal markup inline (register.html does), this just
 * wires it up; otherwise it injects the markup (generating the country-code
 * <select> from COUNTRY_CODES) and then wires it. Triggers are any element
 * with [data-brochure-open] — both <button> and <a href="…"> (the href is a
 * no-JS fallback; a click is preventDefaulted so the popup opens in-page).
 * On submit the lead is POSTed as JSON to the make.com webhook and the
 * visitor is forwarded to window.AFFINITY_BROCHURE_REDIRECT (default
 * "open-day-brochure.html"). */
(function () {
  var COUNTRY_CODES = [
    ["+353","Ireland +353"],
    ["+93","Afghanistan +93"],
    ["+355","Albania +355"],
    ["+213","Algeria +213"],
    ["+1","American Samoa +1"],
    ["+376","Andorra +376"],
    ["+244","Angola +244"],
    ["+1","Anguilla +1"],
    ["+1","Antigua and Barbuda +1"],
    ["+54","Argentina +54"],
    ["+374","Armenia +374"],
    ["+297","Aruba +297"],
    ["+61","Australia +61"],
    ["+43","Austria +43"],
    ["+994","Azerbaijan +994"],
    ["+1","Bahamas +1"],
    ["+973","Bahrain +973"],
    ["+880","Bangladesh +880"],
    ["+1","Barbados +1"],
    ["+375","Belarus +375"],
    ["+32","Belgium +32"],
    ["+501","Belize +501"],
    ["+229","Benin +229"],
    ["+1","Bermuda +1"],
    ["+975","Bhutan +975"],
    ["+591","Bolivia +591"],
    ["+387","Bosnia and Herzegovina +387"],
    ["+267","Botswana +267"],
    ["+55","Brazil +55"],
    ["+1","British Virgin Islands +1"],
    ["+673","Brunei +673"],
    ["+359","Bulgaria +359"],
    ["+226","Burkina Faso +226"],
    ["+257","Burundi +257"],
    ["+855","Cambodia +855"],
    ["+237","Cameroon +237"],
    ["+1","Canada +1"],
    ["+238","Cape Verde +238"],
    ["+1","Cayman Islands +1"],
    ["+236","Central African Republic +236"],
    ["+235","Chad +235"],
    ["+56","Chile +56"],
    ["+86","China +86"],
    ["+57","Colombia +57"],
    ["+269","Comoros +269"],
    ["+682","Cook Islands +682"],
    ["+506","Costa Rica +506"],
    ["+225","Côte d'Ivoire +225"],
    ["+385","Croatia +385"],
    ["+53","Cuba +53"],
    ["+357","Cyprus +357"],
    ["+420","Czech Republic +420"],
    ["+243","DR Congo +243"],
    ["+45","Denmark +45"],
    ["+253","Djibouti +253"],
    ["+1","Dominica +1"],
    ["+1","Dominican Republic +1"],
    ["+593","Ecuador +593"],
    ["+20","Egypt +20"],
    ["+503","El Salvador +503"],
    ["+240","Equatorial Guinea +240"],
    ["+291","Eritrea +291"],
    ["+372","Estonia +372"],
    ["+268","Eswatini +268"],
    ["+251","Ethiopia +251"],
    ["+500","Falkland Islands +500"],
    ["+298","Faroe Islands +298"],
    ["+679","Fiji +679"],
    ["+358","Finland +358"],
    ["+33","France +33"],
    ["+594","French Guiana +594"],
    ["+689","French Polynesia +689"],
    ["+241","Gabon +241"],
    ["+220","Gambia +220"],
    ["+995","Georgia +995"],
    ["+49","Germany +49"],
    ["+233","Ghana +233"],
    ["+350","Gibraltar +350"],
    ["+30","Greece +30"],
    ["+299","Greenland +299"],
    ["+1","Grenada +1"],
    ["+590","Guadeloupe +590"],
    ["+1","Guam +1"],
    ["+502","Guatemala +502"],
    ["+44","Guernsey +44"],
    ["+224","Guinea +224"],
    ["+245","Guinea-Bissau +245"],
    ["+592","Guyana +592"],
    ["+509","Haiti +509"],
    ["+504","Honduras +504"],
    ["+852","Hong Kong +852"],
    ["+36","Hungary +36"],
    ["+354","Iceland +354"],
    ["+91","India +91"],
    ["+62","Indonesia +62"],
    ["+98","Iran +98"],
    ["+964","Iraq +964"],
    ["+972","Israel +972"],
    ["+39","Italy +39"],
    ["+1","Jamaica +1"],
    ["+81","Japan +81"],
    ["+44","Jersey +44"],
    ["+962","Jordan +962"],
    ["+7","Kazakhstan +7"],
    ["+254","Kenya +254"],
    ["+686","Kiribati +686"],
    ["+383","Kosovo +383"],
    ["+965","Kuwait +965"],
    ["+996","Kyrgyzstan +996"],
    ["+856","Laos +856"],
    ["+371","Latvia +371"],
    ["+961","Lebanon +961"],
    ["+266","Lesotho +266"],
    ["+231","Liberia +231"],
    ["+218","Libya +218"],
    ["+423","Liechtenstein +423"],
    ["+370","Lithuania +370"],
    ["+352","Luxembourg +352"],
    ["+853","Macau +853"],
    ["+389","North Macedonia +389"],
    ["+261","Madagascar +261"],
    ["+265","Malawi +265"],
    ["+60","Malaysia +60"],
    ["+960","Maldives +960"],
    ["+223","Mali +223"],
    ["+356","Malta +356"],
    ["+692","Marshall Islands +692"],
    ["+596","Martinique +596"],
    ["+222","Mauritania +222"],
    ["+230","Mauritius +230"],
    ["+262","Mayotte +262"],
    ["+52","Mexico +52"],
    ["+691","Micronesia +691"],
    ["+373","Moldova +373"],
    ["+377","Monaco +377"],
    ["+976","Mongolia +976"],
    ["+382","Montenegro +382"],
    ["+1","Montserrat +1"],
    ["+212","Morocco +212"],
    ["+258","Mozambique +258"],
    ["+95","Myanmar +95"],
    ["+264","Namibia +264"],
    ["+674","Nauru +674"],
    ["+977","Nepal +977"],
    ["+31","Netherlands +31"],
    ["+599","Netherlands Antilles +599"],
    ["+687","New Caledonia +687"],
    ["+64","New Zealand +64"],
    ["+505","Nicaragua +505"],
    ["+227","Niger +227"],
    ["+234","Nigeria +234"],
    ["+683","Niue +683"],
    ["+1","Northern Mariana Islands +1"],
    ["+47","Norway +47"],
    ["+968","Oman +968"],
    ["+92","Pakistan +92"],
    ["+680","Palau +680"],
    ["+970","Palestine +970"],
    ["+507","Panama +507"],
    ["+675","Papua New Guinea +675"],
    ["+595","Paraguay +595"],
    ["+51","Peru +51"],
    ["+63","Philippines +63"],
    ["+48","Poland +48"],
    ["+351","Portugal +351"],
    ["+1","Puerto Rico +1"],
    ["+974","Qatar +974"],
    ["+242","Republic of the Congo +242"],
    ["+262","Réunion +262"],
    ["+40","Romania +40"],
    ["+7","Russia +7"],
    ["+250","Rwanda +250"],
    ["+1","Saint Kitts and Nevis +1"],
    ["+1","Saint Lucia +1"],
    ["+508","Saint Pierre and Miquelon +508"],
    ["+1","Saint Vincent and the Grenadines +1"],
    ["+685","Samoa +685"],
    ["+378","San Marino +378"],
    ["+239","São Tomé and Príncipe +239"],
    ["+966","Saudi Arabia +966"],
    ["+221","Senegal +221"],
    ["+381","Serbia +381"],
    ["+248","Seychelles +248"],
    ["+232","Sierra Leone +232"],
    ["+65","Singapore +65"],
    ["+1","Sint Maarten +1"],
    ["+421","Slovakia +421"],
    ["+386","Slovenia +386"],
    ["+677","Solomon Islands +677"],
    ["+252","Somalia +252"],
    ["+27","South Africa +27"],
    ["+82","South Korea +82"],
    ["+211","South Sudan +211"],
    ["+34","Spain +34"],
    ["+94","Sri Lanka +94"],
    ["+249","Sudan +249"],
    ["+597","Suriname +597"],
    ["+47","Svalbard +47"],
    ["+46","Sweden +46"],
    ["+41","Switzerland +41"],
    ["+963","Syria +963"],
    ["+886","Taiwan +886"],
    ["+992","Tajikistan +992"],
    ["+255","Tanzania +255"],
    ["+66","Thailand +66"],
    ["+670","Timor-Leste +670"],
    ["+228","Togo +228"],
    ["+690","Tokelau +690"],
    ["+676","Tonga +676"],
    ["+1","Trinidad and Tobago +1"],
    ["+216","Tunisia +216"],
    ["+90","Turkey +90"],
    ["+993","Turkmenistan +993"],
    ["+1","Turks and Caicos Islands +1"],
    ["+688","Tuvalu +688"],
    ["+256","Uganda +256"],
    ["+380","Ukraine +380"],
    ["+971","United Arab Emirates +971"],
    ["+44","United Kingdom +44"],
    ["+1","United States +1"],
    ["+598","Uruguay +598"],
    ["+1","US Virgin Islands +1"],
    ["+998","Uzbekistan +998"],
    ["+678","Vanuatu +678"],
    ["+379","Vatican City +379"],
    ["+58","Venezuela +58"],
    ["+84","Vietnam +84"],
    ["+681","Wallis and Futuna +681"],
    ["+967","Yemen +967"],
    ["+260","Zambia +260"],
    ["+263","Zimbabwe +263"],

  ];

  var LEAD_ENDPOINT = "https://hook.eu2.make.com/fgtoz24rfm2gm2yoqprv99qc5hld7s3b";
  var REDIRECT_URL = window.AFFINITY_BROCHURE_REDIRECT || "open-day-brochure.html";

  function buildOptions() {
    return COUNTRY_CODES.map(function (c, i) {
      return '<option value="' + c[0] + '"' + (i === 0 ? " selected" : "") +
        ">" + c[1] + "</option>";
    }).join("");
  }

  var MODAL_HTML =
    '<div class="modal-overlay" id="brochure-modal" role="dialog" aria-modal="true" aria-labelledby="brochure-title" aria-hidden="true">' +
      '<div class="modal" role="document">' +
        '<button class="modal-close" type="button" aria-label="Close">&times;</button>' +
        '<h3 id="brochure-title">Get Your Free Open Virtual Day Brochure</h3>' +
        '<p class="modal-sub">Drop your details in and we will send the brochure straight over.</p>' +
        '<div class="modal-error" id="brochure-error">Something went wrong sending your request. Please try again. Your details are still here.</div>' +
        '<form id="brochure-form" novalidate>' +
          '<div class="field-row">' +
            '<div class="field">' +
              '<label for="bf-first">First name</label>' +
              '<input type="text" id="bf-first" name="firstName" autocomplete="given-name" required>' +
              '<span class="err">Please enter your first name.</span>' +
            '</div>' +
            '<div class="field">' +
              '<label for="bf-last">Last name</label>' +
              '<input type="text" id="bf-last" name="lastName" autocomplete="family-name" required>' +
              '<span class="err">Please enter your last name.</span>' +
            '</div>' +
          '</div>' +
          '<div class="field">' +
            '<label for="bf-email">Email address</label>' +
            '<input type="email" id="bf-email" name="email" autocomplete="email" required>' +
            '<span class="err">Please enter a valid email address.</span>' +
          '</div>' +
          '<div class="field">' +
            '<label for="bf-phone">Phone number</label>' +
            '<div class="phone-row">' +
              '<select id="bf-prefix" name="prefix" autocomplete="tel-country-code" aria-label="Country code"></select>' +
              '<input type="tel" id="bf-phone" name="phone" autocomplete="tel" inputmode="tel" placeholder="086 123 4567" required>' +
            '</div>' +
            '<span class="err">Please enter a valid phone number.</span>' +
          '</div>' +
          '<label class="field-check" id="bf-consent-wrap">' +
            '<input type="checkbox" id="bf-consent" name="consent" required>' +
            '<span>I agree to be contacted about the Virtual Open Day and future updates. See our <a href="index.html#apply">privacy policy</a>.</span>' +
          '</label>' +
          '<button class="btn orange" type="submit">Send Me The Brochure</button>' +
        '</form>' +
      '</div>' +
    '</div>';

  var overlay = document.getElementById("brochure-modal");
  if (!overlay) {
    var holder = document.createElement("div");
    holder.innerHTML = MODAL_HTML;
    overlay = holder.firstElementChild;
    document.body.appendChild(overlay);
    var sel0 = overlay.querySelector("#bf-prefix");
    if (sel0) sel0.innerHTML = buildOptions();
  } else {
    var sel1 = overlay.querySelector("#bf-prefix");
    if (sel1 && !sel1.children.length) sel1.innerHTML = buildOptions();
  }

  var form = document.getElementById("brochure-form");
  var errorBox = document.getElementById("brochure-error");
  var lastFocus = null;
  var focusables = [];

  function getFocusables() {
    return Array.prototype.slice.call(
      overlay.querySelectorAll('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])')
    ).filter(function (el) { return el.offsetParent !== null; });
  }

  function openModal(trigger) {
    lastFocus = trigger || document.activeElement;
    overlay.classList.add("open");
    overlay.setAttribute("aria-hidden", "false");
    document.body.classList.remove("nav-open"); /* close mobile menu if open */
    document.documentElement.classList.add("nav-open"); /* locks scroll */
    focusables = getFocusables();
    if (focusables.length) focusables[0].focus();
    document.addEventListener("keydown", onKeydown);
  }

  function closeModal() {
    overlay.classList.remove("open");
    overlay.setAttribute("aria-hidden", "true");
    document.documentElement.classList.remove("nav-open");
    document.removeEventListener("keydown", onKeydown);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function onKeydown(e) {
    if (e.key === "Escape") { e.preventDefault(); closeModal(); return; }
    if (e.key === "Tab") {
      focusables = getFocusables();
      if (!focusables.length) return;
      var first = focusables[0], last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }

  /* open triggers: every [data-brochure-open] button or link. The href on
     a link is a no-JS fallback; with JS we stop it so the popup opens here. */
  document.querySelectorAll("[data-brochure-open]").forEach(function (btn) {
    btn.addEventListener("click", function (e) { e.preventDefault(); openModal(btn); });
  });
  overlay.querySelector(".modal-close").addEventListener("click", closeModal);
  overlay.addEventListener("click", function (e) { if (e.target === overlay) closeModal(); });

  /* Auto-open when another page sent the visitor here with ?autoopen=1. */
  try {
    if (new URLSearchParams(location.search).get("autoopen") === "1") {
      openModal(null);
    }
  } catch (e) {}

  function emailOk(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
  function phoneOk(v) {
    var cleaned = v.replace(/[\s().-]/g, "");
    return /^[0-9]{6,15}$/.test(cleaned);
  }

  function validate() {
    var ok = true;
    var first = form.firstName, last = form.lastName, email = form.email, phone = form.phone;
    var consent = form.consent, consentWrap = document.getElementById("bf-consent-wrap");

    [[first, !!first.value.trim()], [last, !!last.value.trim()],
     [email, emailOk(email.value.trim())], [phone, phoneOk(phone.value.trim())]]
      .forEach(function (pair) {
        var field = pair[0], valid = pair[1];
        var wrap = field.closest(".field");
        if (!valid) { wrap.classList.add("invalid"); ok = false; }
        else wrap.classList.remove("invalid");
      });

    if (!consent.checked) { consentWrap.classList.add("invalid"); ok = false; }
    else consentWrap.classList.remove("invalid");

    return ok;
  }

  form.querySelectorAll("input, select").forEach(function (el) {
    el.addEventListener("input", function () {
      var wrap = el.closest(".field");
      if (wrap) wrap.classList.remove("invalid");
      var cw = document.getElementById("bf-consent-wrap");
      if (cw) cw.classList.remove("invalid");
      errorBox.classList.remove("show");
    });
  });
  var prefixSel = document.getElementById("bf-prefix");
  if (prefixSel) prefixSel.addEventListener("change", function () {
    var wrap = prefixSel.closest(".field");
    if (wrap) wrap.classList.remove("invalid");
    errorBox.classList.remove("show");
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    errorBox.classList.remove("show");
    if (!validate()) return;

    var btn = form.querySelector('button[type="submit"]');
    var originalLabel = btn.textContent;
    btn.disabled = true;
    btn.textContent = "Sending…";

    var prefixSel = form.prefix;
    var prefix = prefixSel.value;
    var rawPhone = form.phone.value.trim();
    var local = rawPhone.replace(/^0+/, "");
    var fullPhone = prefix + " " + local;

    var first = form.firstName.value.trim();
    var last = form.lastName.value.trim();
    var payload = {
      fullName: (first + " " + last).trim(),
      firstName: first,
      lastName: last,
      email: form.email.value.trim(),
      phone: fullPhone,
      prefix: prefix,
      localPhone: local
    };
    try {
      if (window.AffinityLeads) Object.assign(payload, window.AffinityLeads.getUtmPayload());
    } catch (e) {}

    fetch(LEAD_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).then(function (res) {
      if (!res.ok) throw new Error("lead failed");
      forward();
    }).catch(function () {
      errorBox.classList.add("show");
      btn.disabled = false;
      btn.textContent = originalLabel;
    });

    function forward() {
      try {
        localStorage.setItem("affinityVodSignup", "1");
        localStorage.setItem("affinityName", payload.firstName);
        localStorage.setItem("affinityEmail", payload.email);
        localStorage.setItem("affinityLead", JSON.stringify(payload));
      } catch (e) {}
      window.location.href = REDIRECT_URL;
    }
  });
})();

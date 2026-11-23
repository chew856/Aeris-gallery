/*
  Aeris Gallery site script.

  RECEIVING BOOKINGS
  Set FORM_ENDPOINT to a form service URL (for example a free Formspree form,
  "https://formspree.io/f/xxxxxxx"). Every enquiry, including the short
  "Is your date open?" form, is then emailed straight to you.
  While it is empty, the final step opens the visitor's own email app with
  the request written out and addressed to BUSINESS_EMAIL. That works, but
  some visitors will not press send, so connect a form service before launch.
*/
const FORM_ENDPOINT = "";
const BUSINESS_EMAIL = "aerisgallery@outlook.com";
const DRAFT_KEY = "aeris-booking-draft";

document.documentElement.classList.remove("no-js");

/* Analytics hook: pushes events to Google Tag Manager / GA4 if installed. */
const track = (event, data = {}) => {
  try { (window.dataLayer = window.dataLayer || []).push({ event, ...data }); } catch (e) {}
};

const today = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};
document.querySelectorAll('input[type="date"]').forEach((el) => { el.min = today(); });

/* ---------- Navigation ---------- */
(() => {
  const nav = document.querySelector(".nav--over");
  if (nav) {
    const onScroll = () => nav.classList.toggle("is-solid", window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }
  const menu = document.getElementById("menu");
  const open = document.querySelector("[data-menu-open]");
  const close = document.querySelector("[data-menu-close]");
  if (!menu || !open || !close) return;
  const set = (on) => {
    menu.classList.toggle("is-open", on);
    menu.setAttribute("aria-hidden", String(!on));
    open.setAttribute("aria-expanded", String(on));
    document.body.classList.toggle("menu-open", on);
    (on ? close : open).focus();
  };
  open.addEventListener("click", () => set(true));
  close.addEventListener("click", () => set(false));
  menu.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => set(false)));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && menu.classList.contains("is-open")) set(false); });
})();

/* ---------- Reveal on scroll ---------- */
(() => {
  const els = document.querySelectorAll(".reveal");
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
    els.forEach((el) => el.classList.add("is-in"));
    return;
  }
  const io = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
  }), { rootMargin: "0px 0px -8% 0px" });
  els.forEach((el) => io.observe(el));
})();

/* ---------- Track call and CTA clicks ---------- */
document.addEventListener("click", (e) => {
  const a = e.target.closest("a");
  if (!a) return;
  if (a.href.startsWith("tel:")) track("click_call");
  else if (a.href.startsWith("mailto:")) track("click_email");
  else if (a.pathname && a.pathname.endsWith("book.html")) track("click_check_date", { from: location.pathname });
});

const post = async (data) => {
  const res = await fetch(FORM_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(data) });
  if (!res.ok) throw new Error("send failed");
};

const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

/* ---------- Quick "Is your date open?" form ---------- */
document.querySelectorAll("form.qf").forEach((form) => {
  const err = form.querySelector(".err");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const date = form.elements.date.value;
    const booth = form.elements.booth.value;
    const email = form.elements.email.value.trim();
    if (!date || !isEmail(email)) {
      err.textContent = !date ? "Choose your event date" : "Enter a valid email";
      (!date ? form.elements.date : form.elements.email).focus();
      return;
    }
    err.textContent = "";
    track("quick_check_submit", { booth });
    const btn = form.querySelector("button");
    btn.disabled = true;
    // Capture the lead first, so it is not lost if they leave the next page.
    if (FORM_ENDPOINT) {
      try { await post({ _subject: `Date check: ${date}`, type: "Quick date check", date, booth, email }); } catch (e2) {}
    }
    const q = new URLSearchParams({ date, booth, email });
    location.href = `book.html?${q}`;
  });
});

/* ---------- Booking form (two steps) ---------- */
(() => {
  const form = document.getElementById("booking");
  if (!form) return;
  const steps = [...form.querySelectorAll(".step")];
  const bar = [...document.querySelectorAll(".progress li")];
  const status = form.querySelector(".status");
  let current = 0;
  let busy = false;

  // Prefill: saved draft first, then anything passed in the URL.
  const fill = (obj) => Object.entries(obj).forEach(([k, v]) => {
    const els = form.querySelectorAll(`[name="${k}"]`);
    els.forEach((el) => {
      if (el.type === "radio" || el.type === "checkbox") el.checked = Array.isArray(v) ? v.includes(el.value) : el.value === v;
      else if (v) el.value = v;
    });
  });
  try { const d = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null"); if (d) fill(d); } catch (e) {}
  const params = Object.fromEntries(new URLSearchParams(location.search));
  if (params.booth === "unsure") params.booth = "help";
  fill(params);

  const collect = () => {
    const out = {};
    new FormData(form).forEach((v, k) => {
      if (out[k] !== undefined) out[k] = [].concat(out[k], v);
      else out[k] = typeof v === "string" ? v.trim() : v;
    });
    return out;
  };
  const save = () => { try { localStorage.setItem(DRAFT_KEY, JSON.stringify(collect())); } catch (e) {} };
  form.addEventListener("input", save);
  form.addEventListener("change", save);

  const msg = (el) => {
    const v = el.validity;
    if (v.valid) return "";
    if (v.valueMissing) return el.type === "radio" ? "Choose one" : "Required";
    if (v.typeMismatch && el.type === "email") return "Enter a valid email";
    if (v.rangeUnderflow) return "Choose a future date";
    if (v.patternMismatch) return "Check this number";
    return "Check this";
  };
  const check = (el) => {
    const field = el.closest(".field");
    if (!field) return el.validity.valid;
    const m = msg(el);
    field.classList.toggle("is-invalid", !!m);
    const out = field.querySelector(".err");
    if (out) out.textContent = m;
    return !m;
  };
  form.addEventListener("change", (e) => { if (e.target.closest(".field.is-invalid")) check(e.target); });
  form.addEventListener("input", (e) => { if (e.target.closest(".field.is-invalid")) check(e.target); });

  const validStep = (i) => {
    let first = null;
    steps[i].querySelectorAll("input, select, textarea").forEach((el) => {
      if (el.type !== "radio" && el.type !== "checkbox" && typeof el.value === "string") el.value = el.value.trim();
      if (!check(el) && !first) first = el;
    });
    if (first) { first.focus(); return false; }
    return true;
  };

  const show = (i) => {
    current = i;
    steps.forEach((s, n) => { s.hidden = n !== i; });
    bar.forEach((b, n) => b.classList.toggle("is-on", n <= i));
    status.textContent = "";
    status.className = "status";
    const head = document.getElementById("form-top");
    if (head && head.getBoundingClientRect().top < 0) head.scrollIntoView({ behavior: "smooth" });
  };

  form.querySelector("[data-next]").addEventListener("click", () => {
    if (!validStep(0)) return;
    track("booking_step_1_complete");
    show(1);
    const firstInput = steps[1].querySelector("input");
    if (firstInput) firstInput.focus({ preventScroll: true });
  });
  form.querySelector("[data-back]").addEventListener("click", () => show(0));

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (busy) return;
    if (current === 0) { form.querySelector("[data-next]").click(); return; }
    if (!validStep(1)) { status.className = "status is-error"; status.textContent = "A couple of details are missing. They are marked above."; return; }

    const d = collect();
    const boothName = { mirrored: "The Mirrored Booth", glam: "The Glam Booth", both: "Both booths", help: "Not sure yet" }[d.booth] || d.booth;
    const extras = [].concat(d.extras || []).join(", ") || "None";
    const summary = [
      `Name: ${d.name}`, `Email: ${d.email}`, `Phone: ${d.phone}`, "",
      `Booth: ${boothName}`, `Date: ${d.date}`, `Start time: ${d.time || "Not set"}`, `Hours: ${d.hours}`,
      `Venue / city: ${d.venue}`, `Guests: ${d.guests || "Not given"}`, `Event type: ${d.event_type || "Not given"}`,
      `Extras: ${extras}`, `Budget: ${d.budget || "Not given"}`, `Found us: ${d.source || "Not given"}`, "",
      "Notes:", d.message || "(none)",
    ];

    busy = true;
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    status.className = "status";
    status.textContent = "Sending your request…";

    try {
      if (FORM_ENDPOINT) {
        await post({ _subject: `Booking request: ${boothName}, ${d.date}`, _replyto: d.email, ...d, booth: boothName, extras });
      } else {
        location.href = `mailto:${BUSINESS_EMAIL}?subject=${encodeURIComponent(`Booking request: ${boothName}, ${d.date}`)}&body=${encodeURIComponent(summary.join("\n"))}`;
      }
      track("booking_submit", { booth: d.booth });
      try { localStorage.removeItem(DRAFT_KEY); } catch (e2) {}
      const done = document.getElementById("done");
      form.hidden = true;
      document.querySelector(".progress").hidden = true;
      done.querySelector("[data-name]").textContent = d.name.split(" ")[0];
      if (!FORM_ENDPOINT) done.querySelector("[data-mailto-note]").hidden = false;
      done.hidden = false;
      done.focus();
    } catch (err) {
      status.className = "status is-error";
      status.textContent = `That did not send. Please try again, or call or email us and we will take it from there.`;
    } finally {
      busy = false;
      btn.disabled = false;
    }
  });

  show(0);
})();

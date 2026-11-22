/*
  Aeris Gallery site script.

  FORM DELIVERY
  Set FORM_ENDPOINT to a form service URL (for example a Formspree endpoint
  like "https://formspree.io/f/xxxxxxx") to receive bookings and newsletter
  sign-ups by email without the visitor's mail app.
  While it is empty, submitting opens the visitor's email app with a
  pre-written message to BUSINESS_EMAIL instead.
*/
const FORM_ENDPOINT = "";
const BUSINESS_EMAIL = "aerisgallery@outlook.com";

document.documentElement.classList.remove("no-js");

/* ---------- Navigation ---------- */
(() => {
  const nav = document.querySelector(".nav");
  if (nav && nav.classList.contains("nav--over")) {
    const onScroll = () => nav.classList.toggle("is-solid", window.scrollY > window.innerHeight * 0.6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  const menu = document.getElementById("menu");
  const openBtn = document.querySelector("[data-menu-open]");
  const closeBtn = document.querySelector("[data-menu-close]");
  if (!menu || !openBtn || !closeBtn) return;

  const setOpen = (open) => {
    menu.classList.toggle("is-open", open);
    menu.setAttribute("aria-hidden", String(!open));
    openBtn.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("menu-open", open);
    if (open) closeBtn.focus();
    else openBtn.focus();
  };
  openBtn.addEventListener("click", () => setOpen(true));
  closeBtn.addEventListener("click", () => setOpen(false));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && menu.classList.contains("is-open")) setOpen(false);
  });
  menu.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setOpen(false)));
})();

/* ---------- Reveal on scroll ---------- */
(() => {
  const items = document.querySelectorAll(".reveal");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-in"));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-in");
        io.unobserve(entry.target);
      }
    });
  }, { rootMargin: "0px 0px -10% 0px" });
  items.forEach((el) => io.observe(el));
})();

/* ---------- Helpers ---------- */
const send = async (form, subject, lines) => {
  if (FORM_ENDPOINT) {
    const data = new FormData(form);
    data.append("_subject", subject);
    const res = await fetch(FORM_ENDPOINT, { method: "POST", body: data, headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error("Request failed");
    return "sent";
  }
  const href = `mailto:${BUSINESS_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
  window.location.href = href;
  return "mailto";
};

/* ---------- Booking form ---------- */
(() => {
  const form = document.getElementById("booking");
  if (!form) return;

  // No past dates
  const date = form.querySelector("#date");
  if (date) {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    date.min = d.toISOString().slice(0, 10);
  }

  // Preselect booth from ?booth=mirrored|glam
  const booth = new URLSearchParams(location.search).get("booth");
  if (booth) {
    const radio = form.querySelector(`input[name="booth"][value="${booth}"]`);
    if (radio) radio.checked = true;
  }

  const messages = {
    valueMissing: "Required",
    typeMismatch: "Please check this",
    patternMismatch: "Please check this",
    rangeUnderflow: "Please choose a future date",
  };

  const fieldOf = (el) => el.closest(".field");
  const showError = (el) => {
    const field = fieldOf(el);
    if (!field) return;
    const out = field.querySelector(".error");
    const v = el.validity;
    let msg = "";
    if (!v.valid) {
      for (const key of Object.keys(messages)) if (v[key]) { msg = messages[key]; break; }
      if (!msg) msg = "Please check this";
    }
    field.classList.toggle("is-invalid", !!msg);
    if (out) out.textContent = msg;
  };

  form.querySelectorAll("input, select, textarea").forEach((el) => {
    el.addEventListener("blur", () => { if (el.value || el.type === "radio") showError(el); });
    el.addEventListener("input", () => { if (fieldOf(el)?.classList.contains("is-invalid")) showError(el); });
    el.addEventListener("change", () => showError(el));
  });

  const status = form.querySelector(".status");
  const button = form.querySelector("button[type=submit]");
  let busy = false;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (busy) return;

    // trim whitespace-only entries so they count as empty
    form.querySelectorAll("input[type=text], input[type=email], input[type=tel], textarea").forEach((el) => { el.value = el.value.trim(); });

    let first = null;
    form.querySelectorAll("input, select, textarea").forEach((el) => {
      showError(el);
      if (!el.validity.valid && !first) first = el;
    });
    if (first) {
      status.className = "status status--error";
      status.textContent = "A few details are missing. They are marked above.";
      first.focus();
      return;
    }

    const get = (n) => (form.elements[n] && form.elements[n].value) || "";
    const boothName = { mirrored: "The Mirrored Booth", glam: "The Glam Booth", both: "Both booths" }[get("booth")] || "";
    const lines = [
      `Name: ${get("first_name")} ${get("last_name")}`,
      `Email: ${get("email")}`,
      `Phone: ${get("phone")}`,
      "",
      `Booth: ${boothName}`,
      `Date: ${get("date")}`,
      `Start time: ${get("time")}`,
      `Duration: ${get("duration")}`,
      `Venue address: ${get("address")}`,
      `Budget: ${get("budget")}`,
      `Prints: ${get("printer")}`,
      `LED sign: ${get("led")}`,
      `Heard about us: ${get("source") || "Not given"}`,
      "",
      "About the event:",
      get("message") || "(none)",
    ];

    busy = true;
    button.disabled = true;
    status.className = "status";
    status.textContent = "Sending your request…";

    try {
      const how = await send(form, `Booking request: ${boothName}, ${get("date")}`, lines);
      if (how === "sent") {
        form.innerHTML = `
          <div class="sent" role="status" tabindex="-1">
            <p class="kicker">Request received</p>
            <h2 class="display">Thank you, ${get("first_name").replace(/[<>&"]/g, "")}.</h2>
            <p>Your date is noted. We will be in touch at the email you gave us with availability and a quote.</p>
          </div>`;
        form.querySelector(".sent").focus();
      } else {
        status.textContent = `Your email app should now open with your request ready to send. If it did not, write to us at ${BUSINESS_EMAIL}.`;
      }
    } catch (err) {
      status.className = "status status--error";
      status.textContent = `We could not send that just now. Please try again, or email ${BUSINESS_EMAIL}.`;
    } finally {
      busy = false;
      if (document.body.contains(button)) button.disabled = false;
    }
  });
})();

/* ---------- Newsletter ---------- */
(() => {
  document.querySelectorAll("form.signup").forEach((form) => {
    const out = form.querySelector(".signup__status");
    const input = form.querySelector("input[type=email]");
    let busy = false;
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (busy) return;
      input.value = input.value.trim();
      if (!input.checkValidity()) {
        out.textContent = input.value ? "That email address does not look right." : "Please enter your email address.";
        input.focus();
        return;
      }
      busy = true;
      try {
        const how = await send(form, "Subscribe me to The Gallery Letter", [`Please add ${input.value} to The Gallery Letter.`]);
        out.textContent = how === "sent"
          ? "You are on the list. The next letter will find you."
          : "Your email app should open with your sign-up ready to send.";
        if (how === "sent") form.reset();
      } catch (err) {
        out.textContent = "That did not go through. Please try again.";
      } finally {
        busy = false;
      }
    });
  });
})();

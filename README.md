# Aeris Gallery

Website for Aeris Gallery, luxury mirror and glam photo booth rentals in Winnipeg.

Plain static site (HTML, CSS, a little JavaScript), no build step. Host it on Vercel, Netlify, GitHub Pages or Cloudflare Pages.

## Pages

| File | Page |
| --- | --- |
| `index.html` | Home |
| `mirrored-booth.html` | The Mirrored Booth |
| `glam-booth.html` | The Glam Booth |
| `book.html` | Two-step booking request ("Check your date") |
| `faq.html` | FAQ |
| `privacy.html` | Privacy |

## How the site turns visitors into bookings

- **"Check your date" everywhere.** In the nav, the hero, every booth card and both booth pages. On phones a bar fixed to the bottom of the screen always shows Call and Check your date.
- **A short form first.** "Is your date open?" asks for only a date, a booth and an email, then carries those answers into the full booking form.
- **A two-step booking form.** Step 1 is about the event, step 2 is contact details. Answers are saved in the visitor's browser, so leaving and coming back doesn't lose them. Booth and package buttons pre-select the right options (`book.html?booth=glam&extras=Prints`).
- **Trust next to every ask.** 5.0 Google rating, real Google reviews, partner logos, "no payment needed", what happens next, and a phone number.

## Before launch: connect the form (important)

Open `assets/js/main.js` and set `FORM_ENDPOINT` to a form service URL. A free [Formspree](https://formspree.io) form works. Every booking request and date check is then emailed to you automatically, including the email address from the short form, even if the visitor never finishes the long one.

Until then, the booking form falls back to opening the visitor's email app with the request written out. Some people will not press send, so connect a form service before you share the site.

## Analytics

`main.js` sends events (`quick_check_submit`, `booking_step_1_complete`, `booking_submit`, `click_call`, `click_check_date`) to `window.dataLayer`. Add Google Tag Manager or GA4 to every page and they will show up as conversions.

## Photos and logos

Photos are in `assets/img` (full size plus a `-sm` 1200px version). Partner logos are in `assets/img/partners`: `*-colour.png` is used on the site, and the one-colour versions are kept as alternates.

## Preview locally

Run `python3 -m http.server` in this folder and open http://localhost:8000.

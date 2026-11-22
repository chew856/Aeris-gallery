# Aeris Gallery

The website for Aeris Gallery, luxury photo booth rentals in Winnipeg.

It is a plain static site (HTML, CSS and a little JavaScript) with no build step, so it can be hosted anywhere: Vercel, Netlify, GitHub Pages or Cloudflare Pages.

## Pages

| File | Page |
| --- | --- |
| `index.html` | Home: the magazine cover |
| `mirrored-booth.html` | The Mirrored Booth |
| `glam-booth.html` | The Glam Booth |
| `book.html` | Reservation form (`?booth=mirrored` or `?booth=glam` preselects a booth) |
| `faq.html` | Questions |
| `privacy.html` | Privacy policy |

## Receiving booking requests

Open `assets/js/main.js` and set `FORM_ENDPOINT` at the top to a form service URL, for example a free [Formspree](https://formspree.io) form endpoint. Bookings and newsletter sign-ups are then emailed to you directly.

While `FORM_ENDPOINT` is empty, the forms open the visitor's own email app with the request already written and addressed to `aerisgallery@outlook.com`.

## Photos

Photos live in `assets/img`. Each one has a full-size version and a `-sm` version (1200 px wide) for phones. `mirror-summer-cut.webp` is a cut-out of the couple on the cover. It sits in front of the AERIS masthead, so if you change the cover photo, remove that layer from `index.html` or make a new cut-out.

To preview locally, run `python3 -m http.server` in this folder and open http://localhost:8000.

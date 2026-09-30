# Sumit Banik: personal academic website

Live at **https://sumitbanikgit.github.io**

A static site: `index.html` plus `assets/`. No framework and no external
requests at runtime apart from Google Fonts.

## Pages
Home (`index.html`), Research, Publications, Talks, Funding, Teaching
and CV, plus a 404 page, `sitemap.xml` and `robots.txt`. All of them are
generated together; the page list is `PAGES` in `build.py`.

## Updating the content
All text and data (papers, talks, funding, teaching, news, journey map
stops, links) live in `build.py`.

```bash
python3 build.py              # regenerates index.html
python3 -m http.server 8000   # preview at http://localhost:8000
git add -A && git commit -m "Update site" && git push   # publishes in about a minute
```

- **CV:** replace `assets/cv/Sumit_Banik_CV.pdf`.
- **Portrait:** replace `assets/portrait.jpg` (4:5 crop).
- **Logos:** `assets/logos/*.png`.
- **World map:** generated once by `python3 tools/make_world_dots.py`
  from Natural Earth data (public domain).
- **Header animations:** the home page draws a collider event display
  (inside `build.py`). Every inner page has its own scene in
  `assets/scenes.js`: triangulations (Research), a constellation of the
  papers (Publications), talks on a world map (Talks), a toy di-photon
  spectrum (Funding), a blackboard (Teaching), a bubble chamber (CV) and
  two-source interference (Contact). The captions and hints are set in
  `page_scenes()` in `build.py`, and talk cities in `CITY_GEO`.

## Custom domain (optional)
Buy a domain, add a `CNAME` file containing it, point its DNS at GitHub
Pages (repository Settings, Pages, Custom domain), enable HTTPS, and set
`PROFILE["url"]` in `build.py`.

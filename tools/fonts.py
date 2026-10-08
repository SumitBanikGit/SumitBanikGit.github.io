#!/usr/bin/env python3
"""Fetches the site's three typefaces from Google Fonts once and keeps them with the site, in assets/fonts/:
Cormorant Garamond (the name and headings), Source Serif 4 (reading) and Inter (labels), all under the
SIL Open Font License, with the licence texts beside them. Writes assets/fonts/fonts.css, which the pages
load instead of Google's stylesheet, so no request leaves the site and the fonts show wherever Google is blocked.
Run again only to change the families or weights below; build.py then picks up the new fonts.css."""
import os, re, urllib.request

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
OUT = os.path.join(ROOT, "assets", "fonts")
CSS = ("https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500"
       "&family=Inter:wght@400;500;600&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;0,8..60,700;1,8..60,400"
       "&display=swap")
LICENCES = {"Cormorant-Garamond": "cormorantgaramond", "Inter": "inter", "Source-Serif-4": "sourceserif4"}
UA = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36"}

def get(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60).read()

def main():
    os.makedirs(OUT, exist_ok=True)
    css = get(CSS).decode("utf-8")
    faces = re.findall(r"/\*\s*([\w-]+)\s*\*/\s*@font-face\s*\{(.*?)\}", css, re.S)
    by_url = {}
    for subset, body in faces:
        family = re.search(r"font-family:\s*'([^']+)'", body).group(1)
        style = re.search(r"font-style:\s*(\w+)", body).group(1)
        url = re.search(r"url\((https://[^)]+\.woff2)\)", body).group(1)
        by_url.setdefault(url, []).append((family, style, subset, body))
    # one file per font, subset and style: the variable fonts serve every weight from the same file
    names, out = {}, ["/* The site's typefaces, kept with the site (tools/fonts.py). SIL Open Font License, see the OFL files here. */"]
    for url, uses in by_url.items():
        family, style, subset, _ = uses[0]
        weights = sorted({re.search(r"font-weight:\s*(\d+)", b).group(1) for _, _, _, b in uses})
        name = "%s-%s-%s.woff2" % (family.lower().replace(" ", "-"), style, subset)
        if name in names.values():
            name = name.replace(".woff2", "-" + "-".join(weights) + ".woff2")
        names[url] = name
        open(os.path.join(OUT, name), "wb").write(get(url))
    for subset, body in faces:
        url = re.search(r"url\((https://[^)]+\.woff2)\)", body).group(1)
        rule = re.sub(r"url\(https://[^)]+\.woff2\)", "url(%s)" % names[url], body.strip())
        rule = re.sub(r"\s*\n\s*", " ", rule)
        out.append("/* %s */\n@font-face { %s }" % (subset, rule))
    open(os.path.join(OUT, "fonts.css"), "w", encoding="utf-8").write("\n".join(out) + "\n")
    for label, folder in LICENCES.items():
        text = get("https://raw.githubusercontent.com/google/fonts/main/ofl/%s/OFL.txt" % folder)
        open(os.path.join(OUT, "OFL-%s.txt" % label), "wb").write(text)
    print("%d font files, %d faces, written to assets/fonts/" % (len(names), len(faces)))
    for n in sorted(names.values()):
        print("  ", n, os.path.getsize(os.path.join(OUT, n)))

if __name__ == "__main__":
    main()

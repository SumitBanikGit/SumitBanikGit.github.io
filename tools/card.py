#!/usr/bin/env python3
"""Draws assets/card.png, the 1200 x 630 picture that LinkedIn, Slack, email and messengers show when someone
shares a link to the site: the name, role and line of the home page in the site's own fonts and colours,
beside the collider emblem of the icon. Needs rsvg-convert and fontTools (with brotli) for the fonts in
assets/fonts/. Run again after changing the wording below, which follows the home page word for word."""
import os, shutil, subprocess, tempfile
from fontTools.ttLib import TTFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
FONTS = os.path.join(ROOT, "assets", "fonts")
OUT = os.path.join(ROOT, "assets", "card.png")

NAME = "Sumit Banik"
ROLE = "Postdoctoral Researcher, Fundamental Physics Directorate"
PLACE = "SLAC National Accelerator Laboratory · Stanford University"
LINE = ("From the mathematics of Feynman integrals", "to search for physics beyond the Standard Model.")
FOOT = ("SUMITBANIKGIT.GITHUB.IO", "THEORETICAL PARTICLE PHYSICS")

CARDINAL, BLACK, GREY, FOG = "#8c1515", "#2e2d29", "#53565a", "#b6b1a9"

SVG = """<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#ffffff"/>
  <rect width="1200" height="10" fill="{CARDINAL}"/>
  <g transform="translate(1036 268) scale(4.6) translate(-32 -32)" fill="none" stroke-linecap="round">
    <circle cx="32" cy="32" r="31" stroke="{FOG}" stroke-width=".5" opacity=".6"/>
    <circle cx="32" cy="32" r="23" stroke="{FOG}" stroke-width=".9" opacity=".8"/>
    <circle cx="32" cy="32" r="13" stroke="{FOG}" stroke-width=".7" opacity=".6"/>
    <path d="M32 32A21 21 0 0 1 51.5 18.5" stroke="{CARDINAL}" stroke-width="1.2"/>
    <path d="M32 32A27 27 0 0 0 12.5 49.5" stroke="{CARDINAL}" stroke-width="1.2"/>
    <path d="M32 32A13 13 0 0 1 21 12" stroke="{BLACK}" stroke-width="1" opacity=".7"/>
    <path d="M32 32L53 43" stroke="{BLACK}" stroke-width="1.3" opacity=".45"/>
    <circle cx="32" cy="32" r="1.8" fill="{CARDINAL}" stroke="none"/>
  </g>
  <text x="86" y="196" font-family="Cormorant Garamond" font-weight="600" font-size="116" fill="{CARDINAL}">{NAME}</text>
  <rect x="90" y="232" width="72" height="2" fill="{FOG}"/>
  <text x="88" y="292" font-family="Source Serif 4" font-weight="600" font-size="{role_size}" fill="{BLACK}">{ROLE}</text>
  <text x="88" y="334" font-family="Source Serif 4" font-weight="400" font-size="{role_size}" fill="{GREY}">{PLACE}</text>
  <text x="88" y="412" font-family="Cormorant Garamond" font-style="italic" font-weight="500" font-size="40" fill="{CARDINAL}">{LINE0}</text>
  <text x="88" y="458" font-family="Cormorant Garamond" font-style="italic" font-weight="500" font-size="40" fill="{CARDINAL}">{LINE1}</text>
  <rect y="548" width="1200" height="82" fill="{CARDINAL}"/>
  <text x="88" y="597" font-family="Inter" font-weight="500" font-size="19" letter-spacing="3.4" fill="#ffffff">{FOOT0}</text>
  <text x="1112" y="597" text-anchor="end" font-family="Inter" font-weight="500" font-size="19" letter-spacing="3.4" fill="#ffffff" opacity=".78">{FOOT1}</text>
</svg>
"""

def main():
    tmp = tempfile.mkdtemp()
    try:
        for name in ("cormorant-garamond-normal-latin", "cormorant-garamond-italic-latin",
                     "source-serif-4-normal-latin", "inter-normal-latin"):
            font = TTFont(os.path.join(FONTS, name + ".woff2"))
            font.flavor = None                       # woff2 -> a plain font file that fontconfig reads
            if name.startswith("cormorant"):         # its default instance calls the family "Cormorant Garamond Light"
                for rec in font["name"].names:
                    if rec.nameID in (1, 16):
                        rec.string = "Cormorant Garamond"
            font.save(os.path.join(tmp, name + ".ttf"))
        conf = os.path.join(tmp, "fonts.conf")
        open(conf, "w").write('<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "fonts.dtd"><fontconfig>'
                              '<dir>%s</dir><cachedir>%s</cachedir></fontconfig>' % (tmp, os.path.join(tmp, "cache")))
        svg = SVG.format(CARDINAL=CARDINAL, BLACK=BLACK, GREY=GREY, FOG=FOG, NAME=NAME, ROLE=ROLE, PLACE=PLACE,
                         LINE0=LINE[0], LINE1=LINE[1], FOOT0=FOOT[0], FOOT1=FOOT[1], role_size=27)
        src = os.path.join(tmp, "card.svg")
        open(src, "w", encoding="utf-8").write(svg)
        env = dict(os.environ, FONTCONFIG_FILE=conf, PANGOCAIRO_BACKEND="fc")   # on macOS Pango would ask CoreText otherwise
        rsvg = "/opt/homebrew/bin/rsvg-convert" if os.path.exists("/opt/homebrew/bin/rsvg-convert") else "rsvg-convert"
        subprocess.run([rsvg, "-w", "1200", "-h", "630", "-b", "white", src, "-o", OUT], check=True, env=env)
        print("wrote", OUT, os.path.getsize(OUT), "bytes")
    finally:
        shutil.rmtree(tmp, ignore_errors=True)

if __name__ == "__main__":
    main()

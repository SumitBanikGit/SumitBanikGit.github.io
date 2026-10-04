"""Collect the details shown when a publication is opened on the Publications page: the abstract (from
INSPIRE, preferring the arXiv version), the number of pages, figures and tables (as the authors give them in
the arXiv comments, else the page count on INSPIRE), the preprint (report) numbers, the arXiv category, the BibTeX entry and how often it has been cited on INSPIRE
(with the date of that count).

Run from the site folder:  python3 tools/pub_details.py
It writes tools/pub_details.json, which build.py reads. Nothing on the site changes until the next build.
It also says where a reference in build.py looks out of date: a journal volume, page or year, or a DOI, that
INSPIRE has and the site does not (as when a paper listed as accepted has since come out).
"""
import json
import re
import sys
import time
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
import build  # noqa: E402  (only the data is used)

OUT = ROOT / "tools" / "pub_details.json"


def get(url, accept="application/json"):
    req = urllib.request.Request(url, headers={"Accept": accept, "User-Agent": "sumitbanik-site/1.0"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode("utf-8")


def arxiv_comments(ids):
    """Comments and primary categories from the arXiv API, by arXiv id."""
    out = {}
    if not ids:
        return out
    xml = get("https://export.arxiv.org/api/query?max_results=100&id_list=" + ",".join(ids), "application/atom+xml")
    ns = {"a": "http://www.w3.org/2005/Atom", "x": "http://arxiv.org/schemas/atom"}
    for e in ET.fromstring(xml).findall("a:entry", ns):
        aid = re.sub(r"v\d+$", "", e.find("a:id", ns).text.split("/abs/")[-1])
        c, pc = e.find("x:comment", ns), e.find("x:primary_category", ns)
        out[aid] = dict(comment=" ".join(c.text.split()) if c is not None and c.text else "",
                        cat=pc.get("term") if pc is not None else "")
    return out


def main():
    pubs = [p for p in build.PUBS if p.get("inspire")]
    arx = arxiv_comments([p["arxiv"] for p in pubs if p.get("arxiv")])
    data, stale = {}, []
    for p in pubs:
        url = (f"https://inspirehep.net/api/literature/{p['inspire']}"
               "?fields=abstracts,number_of_pages,report_numbers,arxiv_eprints,citation_count,citation_count_without_self_citations,"
               "publication_info,dois")
        m = json.loads(get(url))["metadata"]
        abstracts = m.get("abstracts", [])
        pick = next((a for a in abstracts if a.get("source") == "arXiv"), abstracts[0] if abstracts else None)
        reports = []
        for r in m.get("report_numbers", []):
            reports += [x.strip() for x in r.get("value", "").split(",") if x.strip()]
        a = arx.get(p.get("arxiv", ""), {})
        cat = a.get("cat") or next(iter((m.get("arxiv_eprints") or [{}])[0].get("categories", [])), "")
        bib = get(f"https://inspirehep.net/api/literature/{p['inspire']}?format=bibtex", "application/x-bibtex").strip()
        data[p["inspire"]] = dict(abstract=pick["value"] if pick else "", pages=m.get("number_of_pages"),
                                  reports=reports, comment=a.get("comment", ""), cat=cat, bibtex=bib,
                                  cited=m.get("citation_count", 0), cited_others=m.get("citation_count_without_self_citations", 0),
                                  cited_on=time.strftime("%Y-%m-%d"))
        ref = re.sub(r"<[^>]+>", "", p.get("ref", ""))
        pub = next((x for x in m.get("publication_info", []) if x.get("journal_title") and x.get("material", "publication") == "publication"), None)
        if pub:
            for what, part in (("volume", pub.get("journal_volume")), ("page", pub.get("artid") or pub.get("page_start")),
                               ("year", str(pub.get("year") or ""))):
                if what == "year" and not re.search(r"\b(19|20)\d\d\b", ref.replace(part, "")):
                    continue                  # (the PoS volumes and the review give no year, on purpose)
                if part and part not in ref:
                    stale.append(f"{p.get('arxiv') or p['inspire']}: INSPIRE gives the {what} {part}, the site says \"{ref}\"")
        dois = [x["value"] for x in m.get("dois", []) if x.get("material", "publication") == "publication"]
        if dois and not p.get("doi"):
            stale.append(f"{p.get('arxiv') or p['inspire']}: INSPIRE has the DOI {dois[0]}, the site has none")
        time.sleep(0.4)
    for line in stale:
        print("check build.py:", line)
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"wrote {OUT.name} with {len(data)} publications")


if __name__ == "__main__":
    main()

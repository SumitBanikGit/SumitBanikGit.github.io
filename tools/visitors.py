"""Fetch the visit count and the visitors' countries from GoatCounter for the footer map.

Run by the GitHub Action in .github/workflows/visitors.yml, with a GoatCounter API key
(the "Read statistics" permission is enough) in the repository secret GOATCOUNTER_TOKEN.
Writes assets/visitors.json: the total number of visits since counting began and the
visits per country, each with its place on the map (from assets/map/countries.json,
which build.py writes). Only aggregate numbers per country are published.

    GOATCOUNTER_TOKEN=... python3 tools/visitors.py
"""
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

API = "https://sumitbanik.goatcounter.com/api/v0"
START = "2026-10-01T00:00:00Z"                 # the day the counting script went live
OUT = Path("assets/visitors.json")


class Failed(Exception):
    """GoatCounter could not be read: the message says why, and what to check."""


def get(path, token, **params):
    url = API + path + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"Authorization": "Bearer " + token, "Content-Type": "application/json",
                                               "User-Agent": "sumitbanikgit.github.io visitor statistics"})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:         # say what GoatCounter answered (a wrong key is the usual cause)
        body = e.read().decode("utf-8", "replace")
        try:
            why = json.loads(body).get("error") or e.reason
        except ValueError:
            m = re.search(r"<p>(.*?)</p>", body, re.S)
            why = " ".join(m.group(1).split()) if m else e.reason
        hint = {401: " Check the GOATCOUNTER_TOKEN secret: GoatCounter does not accept this key.",
                403: " The key needs the Read statistics permission, with access to sumitbanik.goatcounter.com."}.get(e.code, "")
        raise Failed(f"GoatCounter answered {e.code} ({why}) for {path}.{hint}") from None
    except urllib.error.URLError as e:
        raise Failed(f"Could not reach GoatCounter: {e.reason}.") from None


def collect(token):
    end = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0) + timedelta(hours=1)
    span = dict(start=START, end=end.strftime("%Y-%m-%dT%H:%M:%SZ"))   # up to the end of the current hour
    total = int(get("/stats/total", token, **span).get("total") or 0)
    where = json.loads(Path("assets/map/countries.json").read_text(encoding="utf-8"))
    countries, offset = {}, 0
    while True:                                 # visitors per location, a page at a time
        page = get("/stats/locations", token, limit=100, offset=offset, **span)
        for s in page.get("stats") or []:
            sid = (s.get("id") or "").upper()
            code = sid[:2]                      # a region such as "US-CA" counts for its country
            if len(code) != 2 or not code.isalpha():
                continue
            c = countries.setdefault(code, {"c": code, "n": where[code][2] if code in where else code, "v": 0})
            if code not in where and sid == code and s.get("name"):
                c["n"] = s["name"]
            c["v"] += int(s.get("count") or 0)
        if not page.get("more"):
            break
        offset += 100
    for code, c in countries.items():
        if code in where:
            c["x"], c["y"] = where[code][:2]
    ranked = sorted((c for c in countries.values() if c["v"] > 0), key=lambda c: (-c["v"], c["n"]))
    return dict(total=total, since=START[:10], countries=ranked)


def report(line, level="notice"):
    """Print a line, and show it on the workflow run too (as a notice or an error, and in the summary)."""
    print(f"::{level} title=Visitor statistics::{line}" if os.environ.get("GITHUB_ACTIONS") else line)
    if os.environ.get("GITHUB_STEP_SUMMARY"):
        with open(os.environ["GITHUB_STEP_SUMMARY"], "a", encoding="utf-8") as f:
            f.write(line + "\n")


def main():
    token = (os.environ.get("GOATCOUNTER_TOKEN") or "").strip()     # (a key pasted with a space or line break still works)
    if not token:
        report("The GOATCOUNTER_TOKEN secret is not set, so there is nothing to fetch.")
        return
    try:
        data = collect(token)
    except Failed as e:
        report(str(e), "error")
        sys.exit(1)
    found = f"{data['total']} visits from {len(data['countries'])} countries since {data['since']}."
    old = json.loads(OUT.read_text(encoding="utf-8")) if OUT.exists() else {}
    if {k: old.get(k) for k in data} == data:
        report(found + " Nothing new since the last update.")
        return
    data["updated"] = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    OUT.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    report(found)


if __name__ == "__main__":
    main()

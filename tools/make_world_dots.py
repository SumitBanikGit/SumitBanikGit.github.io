#!/usr/bin/env python3
"""
Builds the dotted world map used by the "Academic journey" section.

Reads Natural Earth land outlines (public domain; TopoJSON from the
world-atlas package, tools/land-110m.json), projects them with the
Natural Earth projection, and samples a grid of dots over land.
Writes assets/map/world-dots.json, which build.py turns into inline SVG.

Run once (or whenever the map settings below change):
    python3 tools/make_world_dots.py
"""
import json
import math
from pathlib import Path

from PIL import Image, ImageDraw

WIDTH = 1200            # SVG width in user units
LAT_TOP, LAT_BOTTOM = 76, -52   # crop away the polar regions
SPACING = 8.2           # distance between dots
SUPERSAMPLE = 3         # raster resolution for the land mask


def natural_earth(lon, lat):
    """Natural Earth I projection (same polynomial as d3.geoNaturalEarth1)."""
    lam, phi = math.radians(lon), math.radians(lat)
    p2 = phi * phi
    p4 = p2 * p2
    x = lam * (0.8707 - 0.131979 * p2 + p4 * (-0.013791 + p4 * (0.003971 * p2 - 0.001529 * p4)))
    y = phi * (1.007226 + p2 * (0.015085 + p4 * (-0.044475 + 0.028874 * p2 - 0.005916 * p4)))
    return x, y


def frame():
    """Projected bounds of the cropped map and the scale to user units."""
    x_min, _ = natural_earth(-180, 0)
    x_max, _ = natural_earth(180, 0)
    _, y_top = natural_earth(0, LAT_TOP)
    _, y_bot = natural_earth(0, LAT_BOTTOM)
    scale = WIDTH / (x_max - x_min)
    height = (y_top - y_bot) * scale
    return x_min, y_top, scale, height


def to_svg(lon, lat, x_min, y_top, scale):
    x, y = natural_earth(lon, lat)
    return (x - x_min) * scale, (y_top - y) * scale


def decode_rings(topo):
    """Decode the TopoJSON arcs of the land MultiPolygon into lon/lat rings."""
    sx, sy = topo["transform"]["scale"]
    tx, ty = topo["transform"]["translate"]
    arcs = []
    for arc in topo["arcs"]:
        x = y = 0
        pts = []
        for dx, dy in arc:
            x += dx
            y += dy
            pts.append((x * sx + tx, y * sy + ty))
        arcs.append(pts)

    def ring(indices):
        out = []
        for i in indices:
            pts = arcs[i] if i >= 0 else list(reversed(arcs[~i]))
            out.extend(pts if not out else pts[1:])
        return out

    rings = []
    for geom in topo["objects"]["land"]["geometries"]:
        for polygon in geom["arcs"]:
            for r in polygon:
                rings.append(ring(r))
    return rings


def simplify(pts, tol):
    """Douglas-Peucker line simplification (tol in SVG units)."""
    if len(pts) < 3:
        return pts
    keep = [False] * len(pts)
    keep[0] = keep[-1] = True
    stack = [(0, len(pts) - 1)]
    while stack:
        a, b = stack.pop()
        (x1, y1), (x2, y2) = pts[a], pts[b]
        dx, dy = x2 - x1, y2 - y1
        norm = (dx * dx + dy * dy) ** 0.5 or 1e-9
        best, idx = 0.0, -1
        for i in range(a + 1, b):
            x0, y0 = pts[i]
            d = abs(dy * x0 - dx * y0 + x2 * y1 - y2 * x1) / norm
            if d > best:
                best, idx = d, i
        if best > tol and idx > 0:
            keep[idx] = True
            stack += [(a, idx), (idx, b)]
    return [q for q, k in zip(pts, keep) if k]


def simplify_ring(pts, tol):
    """Closed rings start and end at the same point, which gives Douglas-Peucker
    a zero-length baseline. Split at the point farthest from the start instead."""
    x0, y0 = pts[0]
    k = max(range(len(pts)), key=lambda i: (pts[i][0] - x0) ** 2 + (pts[i][1] - y0) ** 2)
    if k in (0, len(pts) - 1):
        return pts
    return simplify(pts[:k + 1], tol) + simplify(pts[k:], tol)[1:]


def path_of(rings):
    out = []
    for r in rings:
        if len(r) < 3:
            continue
        out.append("M" + "L".join(f"{x:.1f} {y:.1f}" for x, y in r) + "Z")
    return "".join(out)


def main():
    here = Path(__file__).resolve().parent
    topo = json.loads((here / "land-110m.json").read_text())
    x_min, y_top, scale, height = frame()

    land_rings = []
    W, H = int(WIDTH * SUPERSAMPLE), int(height * SUPERSAMPLE)
    mask = Image.new("L", (W, H), 0)
    draw = ImageDraw.Draw(mask)
    for ring in decode_rings(topo):
        if max(lat for _, lat in ring) < LAT_BOTTOM:      # Antarctica
            continue
        # Rings that cross the antimeridian (Eurasia at Chukotka, Fiji, Wrangel)
        # jump from +180 to -180. Unwrap the longitudes so each ring is
        # continuous, then draw it at -360/0/+360 so both halves land in frame.
        unwrapped, prev = [], None
        for lon, lat in ring:
            if prev is not None:
                while lon - prev > 180:
                    lon -= 360
                while lon - prev < -180:
                    lon += 360
            unwrapped.append((lon, lat))
            prev = lon
        for shift in (-360, 0, 360):
            pts = [to_svg(lon + shift, lat, x_min, y_top, scale) for lon, lat in unwrapped]
            if max(x for x, _ in pts) < 0 or min(x for x, _ in pts) > WIDTH:
                continue
            draw.polygon([(x * SUPERSAMPLE, y * SUPERSAMPLE) for x, y in pts], fill=255)
            simple = simplify_ring(pts, 0.9)
            if len(simple) >= 4:
                land_rings.append(simple)

    px = mask.load()
    dots = []
    row = 0
    y = SPACING / 2
    while y < height:
        x = SPACING / 2 + (SPACING / 2 if row % 2 else 0)
        while x < WIDTH:
            if px[min(W - 1, int(x * SUPERSAMPLE)), min(H - 1, int(y * SUPERSAMPLE))]:
                dots.append((round(x, 1), round(y, 1)))
            x += SPACING
        y += SPACING * 0.866          # hexagonal packing
        row += 1

    d = "".join(f"M{x:g} {y:g}h0" for x, y in dots)
    # graticule: parallels and meridians every 30 degrees
    grat = []
    for lat in range(-30, 76, 30):
        pts = [to_svg(lon, lat, x_min, y_top, scale) for lon in range(-180, 181, 3)]
        grat.append("M" + "L".join(f"{x:.1f} {y:.1f}" for x, y in pts))
    for lon in range(-180, 181, 30):
        pts = [to_svg(lon, lat, x_min, y_top, scale) for lat in range(LAT_BOTTOM, LAT_TOP + 1, 2)]
        grat.append("M" + "L".join(f"{x:.1f} {y:.1f}" for x, y in pts))
    land = path_of(land_rings)
    out = {"width": WIDTH, "height": round(height, 1), "lat_top": LAT_TOP, "lat_bottom": LAT_BOTTOM,
           "spacing": SPACING, "dots": len(dots), "path": d, "land": land, "graticule": "".join(grat)}
    dest = here.parent / "assets" / "map" / "world-dots.json"
    dest.write_text(json.dumps(out))
    print(f"{len(dots)} dots ({len(d) // 1024} KB), land {len(land) // 1024} KB, map {WIDTH} x {height:.0f}")


if __name__ == "__main__":
    main()

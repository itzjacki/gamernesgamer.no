"""Draws the power-up and curse illustrations (243x162 SVG).

The style and the process live in the power-up-art skill
(.claude/skills/power-up-art/SKILL.md); this file implements them. One function per slug in ART below; a new power-up
gets a new function. Writes to public/images/power-ups/<slug>.svg.

    python scripts/power-up-art/draw.py            # every slug
    python scripts/power-up-art/draw.py wide-net   # just these
    node scripts/power-up-art/preview.mjs          # contact sheet + bounds
"""
import math, os, sys

OUT = os.path.join(os.path.dirname(__file__), '..', '..', 'public', 'images', 'power-ups')
W, H = 243, 162

SURFACE = '#1c1d1f'     # --color-surface
GRID = '#222120'        # --color-border
DARK = '#111214'        # --color-display
BG = '#17181a'          # --color-bg
TEXT = '#e6e1db'        # --color-text
MUTED = '#8a847e'       # --color-text-muted
ACCENT = '#e8334a'      # --color-accent
ACCENT_DIM = '#4a2028'  # --color-border-accent

C30, S30 = math.cos(math.pi / 6), 0.5
HEAVY, THIN = 1.8, 0.7


class Pal:
    def __init__(self, line, side):
        self.line, self.side = line, side


POWER = Pal(MUTED, DARK)
CURSE = Pal(ACCENT, ACCENT_DIM)


def f(v):
    return f'{v:.2f}'.rstrip('0').rstrip('.')


def pts(ps):
    return ' '.join(f'{f(x)},{f(y)}' for x, y in ps)


class Iso:
    def __init__(self, ox, oy, k=1.0):
        self.ox, self.oy, self.k = ox, oy, k

    def __call__(self, x, y, z=0):
        k = self.k
        return (self.ox + (x - y) * C30 * k, self.oy + ((x + y) * S30 - z) * k)


class Art:
    def __init__(self, pal):
        self.p = pal
        self.defs = []
        self.body = []
        self.n = 0

    def add(self, s):
        self.body.append(s)

    def poly(self, ps, fill='none', stroke=None, w=HEAVY, extra=''):
        stroke = stroke or self.p.line
        self.add(f'<polygon points="{pts(ps)}" fill="{fill}" stroke="{stroke}" stroke-width="{w}" stroke-linejoin="round" {extra}/>')

    def line(self, ps, stroke=None, w=HEAVY, extra=''):
        stroke = stroke or self.p.line
        self.add(f'<polyline points="{pts(ps)}" fill="none" stroke="{stroke}" stroke-width="{w}" stroke-linejoin="round" stroke-linecap="round" {extra}/>')

    def dashed(self, ps, stroke=None, w=THIN, dash='2.5 2.5'):
        self.line(ps, stroke, w, f'stroke-dasharray="{dash}"')

    def path(self, d, fill='none', stroke=None, w=HEAVY, extra=''):
        stroke = stroke or self.p.line
        self.add(f'<path d="{d}" fill="{fill}" stroke="{stroke}" stroke-width="{w}" stroke-linejoin="round" stroke-linecap="round" {extra}/>')

    def circle(self, cx, cy, r, fill='none', stroke=None, w=HEAVY, extra=''):
        stroke = stroke or self.p.line
        self.add(f'<circle cx="{f(cx)}" cy="{f(cy)}" r="{f(r)}" fill="{fill}" stroke="{stroke}" stroke-width="{w}" {extra}/>')

    def hatch(self, angle=60, gap=3.2, color=None, w=0.75, ground=DARK):
        self.n += 1
        pid = f'h{self.n}'
        color = color or self.p.line
        self.defs.append(
            f'<pattern id="{pid}" width="{gap}" height="{gap}" patternUnits="userSpaceOnUse" patternTransform="rotate({angle})">'
            f'<rect width="{gap}" height="{gap}" fill="{ground}"/>'
            f'<line x1="0" y1="0" x2="0" y2="{gap}" stroke="{color}" stroke-width="{w}"/></pattern>')
        return f'url(#{pid})'

    def shadow(self, ps):
        """A hatched ground shadow, no outline."""
        self.add(f'<polygon points="{pts(ps)}" fill="{self.hatch(-40, 5, self.p.line, 0.5, SURFACE)}"/>')

    # Isometric solids ------------------------------------------------------
    def faces(self, iso, x, y, z, dx, dy, dz):
        t = z + dz
        P = iso
        top = [P(x, y, t), P(x + dx, y, t), P(x + dx, y + dy, t), P(x, y + dy, t)]
        left = [P(x, y + dy, z), P(x + dx, y + dy, z), P(x + dx, y + dy, t), P(x, y + dy, t)]
        right = [P(x + dx, y, z), P(x + dx, y + dy, z), P(x + dx, y + dy, t), P(x + dx, y, t)]
        return top, left, right

    def box(self, iso, x, y, z, dx, dy, dz, top=BG, left='hatch', right=None, stroke=None, w=HEAVY, extra=''):
        tf, lf, rf = self.faces(iso, x, y, z, dx, dy, dz)
        if left == 'hatch':
            left = self.hatch()
        self.poly(lf, left, stroke, w, extra)
        self.poly(rf, right or self.p.side, stroke, w, extra)
        self.poly(tf, top, stroke, w, extra)
        return tf, lf, rf

    def ring(self, iso, cx, cy, cz, r, plane='z', n=48):
        out = []
        for i in range(n):
            t = 2 * math.pi * i / n
            if plane == 'z':
                out.append(iso(cx + r * math.cos(t), cy + r * math.sin(t), cz))
            elif plane == 'x':
                out.append(iso(cx, cy + r * math.cos(t), cz + r * math.sin(t)))
            else:
                out.append(iso(cx + r * math.cos(t), cy, cz + r * math.sin(t)))
        return out

    def svg(self):
        grid = ''.join(f'<line x1="{x}" y1="0" x2="{x}" y2="{H}"/>' for x in range(1, W, 20))
        grid += ''.join(f'<line x1="0" y1="{y}" x2="{W}" y2="{y}"/>' for y in range(1, H, 20))
        return (
            f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" fill="none">\n'
            f'<defs>{"".join(self.defs)}</defs>\n'
            f'<rect width="{W}" height="{H}" fill="{SURFACE}"/>\n'
            f'<g stroke="{GRID}" stroke-width="1">{grid}</g>\n'
            + '\n'.join(self.body) + '\n</svg>\n')


# ---------------------------------------------------------------------------
# Shared pieces


def arrow_head(a, tip, direction, size=5.5, color=None, w=1.4):
    dx, dy = direction
    l = math.hypot(dx, dy)
    dx, dy = dx / l, dy / l
    px, py = -dy, dx
    b = (tip[0] - dx * size, tip[1] - dy * size)
    a.line([(b[0] + px * size * 0.6, b[1] + py * size * 0.6), tip,
            (b[0] - px * size * 0.6, b[1] - py * size * 0.6)], color or a.p.line, w)


def arrow(a, ps, color=None, w=1.4, dash=None, size=5.5):
    """A polyline ending in an arrowhead along its last segment."""
    if dash:
        a.dashed(ps, color, w, dash)
    else:
        a.line(ps, color, w)
    (x0, y0), (x1, y1) = ps[-2], ps[-1]
    arrow_head(a, ps[-1], (x1 - x0, y1 - y0), size, color, w)


def bezier(p0, p1, p2, n=32):
    return [((1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0],
             (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1])
            for t in [i / n for i in range(n + 1)]]


def trim(ps, start=0.0, end=0.0):
    """Shortens a polyline by a screen distance at each end."""
    def cut(seq, d):
        out = list(seq)
        while d > 0 and len(out) > 1:
            (x0, y0), (x1, y1) = out[0], out[1]
            seg = math.hypot(x1 - x0, y1 - y0)
            if seg > d:
                k = d / seg
                out[0] = (x0 + (x1 - x0) * k, y0 + (y1 - y0) * k)
                break
            d -= seg
            out.pop(0)
        return out
    ps = cut(ps, start)
    return cut(ps[::-1], end)[::-1]


def coin(a, iso, x, y, z, r, edge=3.5, face=BG, stroke=None, side=None, dash=None):
    """A coin lying on the ground plane (an iso ellipse over its edge band)."""
    stroke = stroke or a.p.line
    cx, cy = iso(x, y, z + edge)
    rx, ry = r * 1.2247 * iso.k, r * 0.7071 * iso.k
    side = side or a.hatch(60, 2.6, stroke, 0.6)
    d = f'stroke-dasharray="{dash}"' if dash else ''
    a.path(f'M{f(cx - rx)} {f(cy)} v{edge} a{f(rx)} {f(ry)} 0 0 0 {f(2 * rx)} 0 v{-edge}', side, stroke, 1.4, d)
    a.add(f'<ellipse cx="{f(cx)}" cy="{f(cy)}" rx="{f(rx)}" ry="{f(ry)}" fill="{face}" stroke="{stroke}" stroke-width="1.4" {d}/>')
    if not dash:
        a.add(f'<ellipse cx="{f(cx)}" cy="{f(cy)}" rx="{f(rx * 0.6)}" ry="{f(ry * 0.6)}" stroke="{stroke}" stroke-width="{THIN}"/>')
    return cx, cy


def die(a, iso, x, y, s, top, left, right, pip=None):
    """A die on the ground: pip layouts as lists of (u, v) on each face."""
    tf, lf, rf = a.box(iso, x, y, 0, s, s, s, left=DARK)
    pip = pip or a.p.line
    r = s * 0.085
    for u, v in top:
        a.poly(a.ring(iso, x + u * s, y + v * s, s, r, 'z', 24), pip, pip, 0.4)
    for u, v in left:
        a.poly(a.ring(iso, x + u * s, y + s, s - v * s, r, 'y', 24), pip, pip, 0.4)
    for u, v in right:
        a.poly(a.ring(iso, x + s, y + s - u * s, s - v * s, r, 'x', 24), pip, pip, 0.4)


def face_left(iso, x0, y_face, z0, w, h):
    """Glyph coords (u right, v down, 0..1) on a front-left face."""
    return lambda u, v: iso(x0 + u * w, y_face, z0 + (1 - v) * h)


def face_right(iso, x_face, y0, z0, w, h):
    """Glyph coords on a front-right face (screen-right is -y)."""
    return lambda u, v: iso(x_face, y0 + (1 - u) * w, z0 + (1 - v) * h)


def glyph_q(a, face, color, w=2.4):
    arc = [(0.5 + 0.2 * math.cos(math.radians(t)), 0.34 - 0.18 * math.sin(math.radians(t)))
           for t in range(180, -95, -10)]
    arc += [(0.5, 0.6)]
    a.line([face(u, v) for u, v in arc], color, w)
    a.line([face(0.5, 0.77), face(0.5, 0.79)], color, w + 0.8)


def glyph_zero(a, face, color, w=2.2):
    a.line([face(0.5 + 0.18 * math.cos(t), 0.5 + 0.28 * math.sin(t))
            for t in [2 * math.pi * i / 40 for i in range(41)]], color, w)


def glyph_minus(a, x, y, color, s=5, w=1.8):
    a.line([(x - s, y), (x + s, y)], color, w)


def dim_v(a, x, y0, y1, tick=3.5, mid=False):
    a.line([(x, y0), (x, y1)], a.p.line, THIN)
    for y in (y0, y1):
        a.line([(x - tick, y), (x + tick, y)], a.p.line, THIN)
    if mid:
        m = (y0 + y1) / 2
        a.line([(x - tick * 0.6, m), (x + tick * 0.6, m)], a.p.line, THIN)


def hull(ps):
    ps = sorted(set((round(x, 2), round(y, 2)) for x, y in ps))

    def half(seq):
        out = []
        for p in seq:
            while len(out) >= 2 and ((out[-1][0] - out[-2][0]) * (p[1] - out[-2][1]) - (out[-1][1] - out[-2][1]) * (p[0] - out[-2][0])) <= 0:
                out.pop()
            out.append(p)
        return out
    lo, hi = half(ps), half(ps[::-1])
    return lo[:-1] + hi[:-1]


def cylinder_x(a, iso, x0, x1, y, z, r, body=BG, cap=None):
    """A cylinder lying along x; the near (x1) cap faces the viewer."""
    e0, e1 = a.ring(iso, x0, y, z, r, 'x'), a.ring(iso, x1, y, z, r, 'x')
    a.poly(hull(e0 + e1), body)
    a.poly(e1, cap or a.p.side)
    return e0, e1


C = (0.5, 0.5)
PIPS = {
    1: [C],
    2: [(0.27, 0.27), (0.73, 0.73)],
    3: [(0.25, 0.25), C, (0.75, 0.75)],
    4: [(0.27, 0.27), (0.73, 0.27), (0.27, 0.73), (0.73, 0.73)],
    5: [(0.25, 0.25), (0.75, 0.25), C, (0.25, 0.75), (0.75, 0.75)],
}


# ---------------------------------------------------------------------------
# Power-ups


def double_up():
    a = Art(POWER)
    iso = Iso(121, 108)
    a.box(iso, -52, -4, 0, 22, 22, 26)
    a.box(iso, 8, -36, 0, 22, 22, 52, top=TEXT)
    # Honest dimensions: the short prism's left edge, the tall one's right.
    x0, yb0 = iso(-52, 18, 0)
    _, yt0 = iso(-52, 18, 26)
    dim_v(a, x0 - 8, yb0, yt0)
    x1, yb1 = iso(30, -36, 0)
    _, yt1 = iso(30, -36, 52)
    dim_v(a, x1 + 8, yb1, yt1, mid=True)
    return a


def safety_net():
    a = Art(POWER)
    iso = Iso(121, 98)
    Wn, Dn, Hn, sag = 104, 48, 26, 22
    a.shadow([iso(-Wn / 2, -Dn / 2), iso(Wn / 2, -Dn / 2), iso(Wn / 2, Dn / 2), iso(-Wn / 2, Dn / 2)])

    def Z(u, v):
        return Hn - sag * math.sin(math.pi * u) * math.sin(math.pi * v)

    def P(u, v):
        return iso(u * Wn - Wn / 2, v * Dn - Dn / 2, Z(u, v))

    def post(u, v):
        x, y = u * Wn - Wn / 2, v * Dn - Dn / 2
        a.line([iso(x, y, 0), iso(x, y, Hn + 5)], a.p.line, HEAVY)

    N, M = 12, 6

    def mesh(v0, v1):
        """The mesh between two depths: rails heavy, the rest thin."""
        steps = 12
        for i in range(N + 1):
            a.line([P(i / N, v0 + (v1 - v0) * j / steps) for j in range(steps + 1)], a.p.line, HEAVY if i in (0, N) else 0.55)
        for j in range(M + 1):
            v = j / M
            if v0 <= v <= v1:
                a.line([P(i / 48, v) for i in range(49)], a.p.line, HEAVY if j in (0, M) else 0.55)

    # Back half, the ball lying in the dip, then the front half over it.
    post(0, 0)
    post(1, 0)
    mesh(0, 0.5)
    r = 8
    bx, by = iso(0, 0, Hn - sag + r)
    a.circle(bx, by, r, a.hatch(60, 2.6), TEXT, HEAVY)
    mesh(0.5, 1)
    post(0, 1)
    post(1, 1)
    # Where it fell from.
    a.circle(bx, 34, r, 'none', a.p.line, 1.2, 'stroke-dasharray="2.5 2"')
    a.dashed([(bx, 34 + r + 3), (bx, by - r - 4)])
    arrow_head(a, (bx, by - r - 3), (0, 1), 5, a.p.line, THIN)
    return a


def pawn(a, iso, x, y, stroke=None, h=26):
    """A player pawn: base disc, tapered body, round head."""
    stroke = stroke or a.p.line
    a.poly(hull(a.ring(iso, x, y, 0, 9) + a.ring(iso, x, y, 4, 9)), a.hatch(), stroke, HEAVY)
    a.poly(a.ring(iso, x, y, 4, 9), BG, stroke, HEAVY)
    a.poly(hull(a.ring(iso, x, y, 4, 5.5) + a.ring(iso, x, y, h - 6, 3)), DARK, stroke, HEAVY)
    hx, hy = iso(x, y, h)
    a.circle(hx, hy, 6.5, BG, stroke, HEAVY)


def gamba_time():
    a = Art(POWER)
    iso = Iso(108, 105)
    # Four players lined up; the bet stacked in front of one of them.
    xs = (-48, -18, 12, 42)
    for i, x in enumerate(xs):
        pawn(a, iso, x, -18, TEXT if i == 2 else None)
    for k in range(3):
        coin(a, iso, 15, 5, k * 4, 9, edge=4, stroke=TEXT if k == 2 else None)
    return a


def double_edged_sword():
    a = Art(POWER)
    iso = Iso(111, 76, 1.3)
    # Lying flat along x: pommel, grip, guard, blade (back to front).
    a.box(iso, -50, -6, 0, 8, 12, 7)
    tf, _, _ = a.box(iso, -42, -3.5, 0, 26, 7, 5, top=DARK)
    for k in range(1, 6):
        xx = -42 + k * 26 / 6
        a.line([iso(xx - 1.5, -3.5, 5), iso(xx + 1.5, 3.5, 5)], a.p.line, THIN)
    a.box(iso, -16, -22, 0, 5, 44, 6)
    # Blade: a flat plate with a point, 2.5 thick.
    bt = 2.5
    top = [(-11, -7), (48, -7), (64, 0), (48, 7), (-11, 7)]
    a.poly([iso(-11, 7, 0), iso(48, 7, 0), iso(48, 7, bt), iso(-11, 7, bt)], a.hatch())
    a.poly([iso(48, 7, 0), iso(64, 0, 0), iso(64, 0, bt), iso(48, 7, bt)], a.hatch())
    a.poly([iso(x, y, bt) for x, y in top], BG)
    a.line([iso(-7, 0, bt), iso(44, 0, bt)], a.p.line, THIN)
    # Both edges are the point: highlighted.
    a.line([iso(-11, -7, bt), iso(48, -7, bt), iso(64, 0, bt)], TEXT, HEAVY)
    a.line([iso(-11, 7, bt), iso(48, 7, bt), iso(64, 0, bt)], TEXT, HEAVY)
    # One edge costs (a spent coin, dashed); the other doubles.
    e1 = iso(28, -7, bt)
    a.dashed([e1, (e1[0] + 20, e1[1] - 16)])
    ci = Iso(e1[0] + 32, e1[1] - 24)
    cx1, cy1 = coin(a, ci, 0, 0, 0, 10, edge=4, face=DARK, side=DARK, dash='2.5 2')
    glyph_minus(a, cx1, cy1, MUTED, 4, 1.6)
    e2 = iso(28, 7, bt)
    a.dashed([e2, (e2[0] - 20, e2[1] + 16)])
    gi = Iso(e2[0] - 32, e2[1] + 30)
    a.box(gi, -7.5, -7.5, 0, 15, 15, 8, top=BG)
    a.box(gi, -7.5, -7.5, 9, 15, 15, 8, top=TEXT)
    return a


def crystal_ballin():
    a = Art(POWER)
    cx, cy, r = 121, 69, 32
    iso = Iso(cx, cy + r + 10)
    # Base: a low collar.
    rb, rt, hb = 27, 23, 9
    band = [iso(rb * math.cos(t), rb * math.sin(t), 0) for t in [math.pi * 0.75 - math.pi * i / 24 for i in range(25)]]
    band += [iso(rt * math.cos(t), rt * math.sin(t), hb) for t in [-math.pi * 0.25 + math.pi * i / 24 for i in range(25)]]
    a.poly(band, a.hatch())
    top = a.ring(iso, 0, 0, hb, rt)
    a.poly(top, DARK)
    # Ball, then the collar's front rim over its foot.
    a.circle(cx, cy, r, BG, a.p.line, HEAVY)
    a.add(f'<ellipse cx="{cx}" cy="{cy}" rx="{f(r * 0.55)}" ry="{r}" stroke="{MUTED}" stroke-width="0.55"/>')
    front = [p for p in top if p[1] >= iso(0, 0, hb)[1]]
    front.sort(key=lambda p: p[0])
    a.poly(front + [front[-1]], DARK, a.p.line, HEAVY)
    # Inside, the order it foresees: a 2-1-3-4 podium.
    pi = Iso(cx, cy + 10)
    for x, h in ((-15, 11), (-5, 17), (5, 7), (15, 4)):
        a.box(pi, x, -5, 0, 10, 10, h, top=DARK, left=DARK, right=DARK, stroke=TEXT, w=1.2)
    # Glint and sparkles.
    a.path(f'M{cx + 8} {cy - 25} A25 25 0 0 1 {cx + 22} {cy - 12}', 'none', a.p.line, 1.6)
    for sx, sy, s in ((174, 32, 6), (70, 40, 4)):
        a.path(f'M{sx} {sy - s} Q{sx} {sy} {sx + s} {sy} Q{sx} {sy} {sx} {sy + s} Q{sx} {sy} {sx - s} {sy} Q{sx} {sy} {sx} {sy - s}Z',
               'none', a.p.line, 1)
    return a


def accounting_error():
    a = Art(POWER)
    iso = Iso(113, 81, 1.3)
    Wd, L = 46, 82  # across, along
    o = (-Wd / 2, -L / 2)
    P = lambda u, v, z=0: iso(o[0] + u, o[1] + v, z)
    # The slip lies on the desk; its far end is torn.
    teeth = [(Wd - i * Wd / 10, L + (0 if i % 2 == 0 else -4)) for i in range(11)]
    a.poly([P(0, 0), P(Wd, 0)] + [P(u, v) for u, v in teeth], BG)
    a.poly([P(0, 0), P(Wd, 0), P(Wd, 10), P(0, 10)], DARK)
    a.line([P(4, 5), P(Wd - 4, 5)], a.p.line, THIN)
    for i in range(5):
        v = 20 + i * 10
        a.line([P(5, v), P(15, v)], a.p.line, 1.4)
        a.dashed([P(18, v), P(31, v)], a.p.line, THIN, '1 2')
        a.line([P(34, v), P(42, v)], TEXT if i == 2 else a.p.line, 2)
    a.line([P(26, 72), P(42, 72)], a.p.line, THIN)
    a.line([P(26, 74.5), P(42, 74.5)], a.p.line, THIN)
    # The fudged figure: ringed, and nudged up off the page.
    a.line([P(38 + 8 * math.cos(t), 40 + 5.5 * math.sin(t)) for t in [2 * math.pi * i / 40 for i in range(41)]], TEXT, 1.4)
    arrow(a, [P(38, 40, 0), P(38, 40, 26)], TEXT, 1.4)
    # A pencil beside it.
    px, py = Wd / 2 + 16, -L / 2 + 14
    a.box(iso, px, py, 0, 6, 40, 6, top=DARK)
    a.poly([iso(px, py + 40, 0), iso(px + 6, py + 40, 0), iso(px + 3, py + 50, 3), iso(px, py + 40, 6)], BG)
    a.box(iso, px, py - 6, 0, 6, 6, 6, top=DARK, left=a.hatch(0, 2.2))
    return a


def tax_scene(curse):
    a = Art(CURSE if curse else POWER)
    iso = Iso(144 if curse else 121, 98)
    # The barrier: a striped arm along x, pivoting on a post.
    a.box(iso, -46, -1.5, 23, 76, 3, 5, left=BG, top=BG)
    for i in range(0, 8, 2):
        x0 = 30 - (i + 1) * 76 / 8
        a.poly([iso(x0, 1.5, 23), iso(x0 + 76 / 8, 1.5, 23), iso(x0 + 76 / 8, 1.5, 28), iso(x0, 1.5, 28)], a.p.line, a.p.line, 0.4)
    a.box(iso, 30, -4, 0, 8, 8, 32)
    pc = iso(34, 4, 25.5)
    a.circle(pc[0], pc[1], 2.2, DARK, a.p.line, 1.2)
    # Its far rest.
    a.line([iso(-44, 0, 0), iso(-44, 0, 23)], a.p.line, 1.2)
    A = (-62, 18)
    if not curse:
        B = (58, -22)
        path = [iso(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, 10 + 190 * t * (1 - t) - 2 * t) for t in [i / 40 for i in range(41)]]
        coin(a, iso, *A, 0, 10)
        arrow(a, trim(path, 10, 5), a.p.line, 1.1, '3 3')
        coin(a, iso, *B, 0, 10, stroke=TEXT)
    else:
        hit = (-8, 0)
        A = (-40, 46)
        path = [iso(A[0] + (hit[0] - A[0]) * t, A[1] + (hit[1] - A[1]) * t, 7 + 150 * t * (1 - t) * (1 - t) + 23 * t) for t in [i / 30 for i in range(31)]]
        coin(a, iso, *A, 0, 10)
        a.dashed(trim(path, 10, 2), a.p.line, 1.1, '3 3')
        h = iso(hit[0], hit[1], 30)
        h = (h[0] - 9, h[1] - 2)
        for ang in (-150, -110, -70, -30):
            t = math.radians(ang)
            a.line([(h[0] + 5 * math.cos(t), h[1] + 5 * math.sin(t)), (h[0] + 11 * math.cos(t), h[1] + 11 * math.sin(t))], TEXT, 1.6)
        drop = [iso(hit[0] - 4 * t, hit[1] + 22 * t, 30 * (1 - t * t)) for t in [i / 12 for i in range(13)]]
        arrow(a, trim(drop, 6, 8), a.p.line, 1.1, '3 3')
        coin(a, iso, -2, 30, 0, 10)
    return a


def power_up_cloner():
    a = Art(POWER)

    def cart(iso, solid):
        x, y, dx, dy, dz = -20, -5, 40, 10, 52
        tf, lf, rf = a.faces(iso, x, y, 0, dx, dy, dz)
        dash = '' if solid else 'stroke-dasharray="3 2.5"'
        w = HEAVY if solid else 1.3
        a.poly(lf, DARK, None, w, dash)
        a.poly(rf, DARK, None, w, dash)
        a.poly(tf, BG if solid else DARK, None, w, dash)
        win = face_left(iso, x + 7, y + dy, 16, 26, 28)
        a.poly([win(0, 0), win(1, 0), win(1, 1), win(0, 1)], 'none', None, 1.2, dash)
        bolt = [(0.56, 0.12), (0.34, 0.56), (0.5, 0.56), (0.42, 0.88), (0.68, 0.42), (0.52, 0.42)]
        a.poly([win(u, v) for u, v in bolt], TEXT if solid else 'none', TEXT, 1.2, dash)
        for k in range(6):
            cx0 = x + 6 + k * 5.6
            a.line([iso(cx0, y + dy, 3), iso(cx0, y + dy, 9)], a.p.line, 1.2)

    cart(Iso(78, 112), True)
    cart(Iso(164, 112), False)
    # The copy: one arrow across.
    arrow(a, [(110, 76), (136, 76)], TEXT, 1.6, size=6)
    # A small "?": it has to be foreseen.
    glyph_q(a, lambda u, v: (122 + (u - 0.5) * 12, 51 + v * 16), a.p.line, 1.4)
    return a


def wide_net():
    a = Art(POWER)
    iso = Iso(122, 102)
    # Four places in a row, 1st to 4th: slabs marked with their place.
    xs = [-58, -28, 2, 32]
    for i, x in enumerate(xs):
        tf, lf, rf = a.box(iso, x, -12, 0, 24, 24, 8)
        for k in range(i + 1):
            px = x + 12 - i * 2 + k * 4
            a.line([iso(px, -6, 8), iso(px, 6, 8)], a.p.line, 1.2)
    # 1st: down. Every other place: up.
    for i, x in enumerate(xs):
        c = iso(x + 12, 0, 8)
        if i == 0:
            arrow(a, [(c[0], c[1] - 44), (c[0], c[1] - 12)], TEXT, 1.8)
        else:
            arrow(a, [(c[0], c[1] - 12), (c[0], c[1] - 32)], TEXT, 1.8)
    # The net cast wide over 2nd to 4th: a span with extension lines.
    l, r = iso(-32, -4, 54), iso(52, -4, 54)
    a.line([l, r], a.p.line, THIN)
    for p in (l, r):
        a.dashed([p, (p[0], p[1] + 16)], a.p.line, 0.5, '1 2')
    arrow_head(a, l, (l[0] - r[0], l[1] - r[1]), 4.5, a.p.line, THIN)
    arrow_head(a, r, (r[0] - l[0], r[1] - l[1]), 4.5, a.p.line, THIN)
    return a


def back_to_back():
    a = Art(POWER)
    l, r = Iso(80, 114), Iso(162, 114)
    for iso in (l, r):
        a.box(iso, -16, -16, 0, 32, 32, 34, left=DARK)
        # Same place in both: the same mark, on a plain face.
        face = face_left(iso, -16, 16, 0, 32, 34)
        for u in (0.4, 0.6):
            a.line([face(u, 0.3), face(u, 0.7)], TEXT, 2)
    # Equal heights: a dashed level line between the near top corners.
    p, q = l(16, -16, 34), r(-16, 16, 34)
    a.dashed([(p[0] + 4, p[1]), (q[0] - 4, q[1])], a.p.line, THIN)
    # One game, then the next: from one cube's peak to the other's.
    p0, p2 = l(-16, -16, 34), r(-16, -16, 34)
    arc = bezier((p0[0] + 2, p0[1] - 5), ((p0[0] + p2[0]) / 2, p0[1] - 34), (p2[0] - 2, p2[1] - 6))
    arrow(a, arc, a.p.line, 1.2, '3 3')
    return a


def sucks_to_suck():
    a = Art(CURSE)
    iso = Iso(128, 108)
    heights = (52, 42, 32, 22)
    w = 22
    for place in range(4):
        x, y, h = -50 + place * w, -11, heights[place]
        if place >= 2:
            a.box(iso, x, y, 0, w, w, h, top=DARK, left=DARK, right=DARK, w=1.3, extra='stroke-dasharray="3 2.5"')
            glyph_zero(a, face_left(iso, x, y + w, 1, w, 20), TEXT, 2)
        else:
            a.box(iso, x, y, 0, w, w, h)
    return a


def not_beating_the_allegations():
    a = Art(CURSE)
    iso = Iso(121, 108)
    # The sound block, its target ringed.
    a.box(iso, -26, -14, 0, 52, 28, 8)
    tc = iso(0, 0, 8)
    a.poly(a.ring(iso, 0, 0, 8, 8), 'none', TEXT, 1.6)
    a.circle(tc[0], tc[1], 1.4, TEXT, 'none', 0)
    # Gavel mid-strike: handle trailing up-right (−y), head along x.
    hz = 40
    a.box(iso, -2.5, -62, hz - 2, 5, 56, 4, top=DARK)
    cylinder_x(a, iso, -20, 20, 0, hz, 8, BG)
    for xx in (-13, 13):
        band = a.ring(iso, xx, 0, hz, 8, 'x')
        a.line(band[len(band) // 4: 3 * len(band) // 4 + 1], a.p.line, THIN)
    # Motion: short strokes above the head, along its fall.
    for k, xx in enumerate((-14, 0, 14)):
        p = iso(xx, 0, hz + 14)
        a.line([(p[0], p[1] - 4 - 3 * (k % 2)), (p[0], p[1] - 12 - 3 * (k % 2))], a.p.line, 1.2)
    # Three accusations, converging on the target.
    for sx, sy, stop in ((40, 62, 15), (44, 134, 36), (204, 132, 44)):
        dx, dy = tc[0] - sx, tc[1] - sy
        d = math.hypot(dx, dy)
        end = (tc[0] - dx / d * stop, tc[1] - dy / d * stop)
        arrow(a, [(sx, sy), end], a.p.line, 1.1, '3 2.5', 5)
        a.circle(sx, sy, 2.4, a.p.line, 'none', 0)
    return a


def curse_of_the_gambler():
    a = Art(CURSE)
    # The others' curses, fanned: the die draws one of them.
    for rot in (-16, -4, 8):
        a.add(f'<rect x="54" y="78" width="24" height="34" transform="rotate({rot} 66 120)" fill="{DARK}" '
              f'stroke="{ACCENT}" stroke-width="1.3" stroke-dasharray="3 2.5"/>')
    iso = Iso(156, 82)
    a.add(f'<ellipse cx="156" cy="138" rx="26" ry="6" fill="{a.hatch(-40, 3.2, ACCENT, 0.55, SURFACE)}"/>')
    s = 40
    x, y = -20, -20
    tf, lf, rf = a.faces(iso, x, y, 0, s, s, s)
    a.poly(lf, DARK)
    a.poly(rf, ACCENT_DIM)
    a.poly(tf, BG)
    for u, v in PIPS[2]:
        a.poly(a.ring(iso, x + u * s, y + s, s - v * s, s * 0.085, 'y', 24), ACCENT, ACCENT, 0.4)
    for u, v in PIPS[3]:
        a.poly(a.ring(iso, x + u * s, y + v * s, s, s * 0.085, 'z', 24), ACCENT, ACCENT, 0.4)
    glyph_q(a, face_right(iso, x + s, y, 0, s, s), TEXT, 2.6)
    arc = bezier((74, 72), (84, 40), (114, 50))
    arrow(a, arc, ACCENT, 1.2, '3 3', 6)
    return a


ART = {
    'double-up': double_up,
    'safety-net': safety_net,
    'gamba-time': gamba_time,
    'double-edged-sword': double_edged_sword,
    'crystal-ballin': crystal_ballin,
    'accounting-error': accounting_error,
    'successful-tax-evasion': lambda: tax_scene(False),
    'power-up-cloner': power_up_cloner,
    'wide-net': wide_net,
    'back-to-back': back_to_back,
    'unsuccessful-tax-evasion': lambda: tax_scene(True),
    'sucks-to-suck': sucks_to_suck,
    'not-beating-the-allegations': not_beating_the_allegations,
    'curse-of-the-gambler': curse_of_the_gambler,
}

only = sys.argv[1:] or list(ART)
for name in only:
    with open(os.path.join(OUT, f'{name}.svg'), 'w', encoding='utf-8') as fh:
        fh.write(ART[name]().svg())
print('wrote', len(only))

'use client';

import { useEffect, useRef } from 'react';
import type { Mode } from './trophyScene';

/*
 * PROTOTYPE — "Lysbrudd": the trophy backlit, light breaking through its
 * cut-outs. One fragment shader (raw WebGL, no library).
 *
 * The scene is computed once as LIGHT (a fog of god rays from a source behind
 * the trophy, plus a rim where the light grazes its edge) and then rendered
 * through ONE mechanism, so the trophy is made of the same stuff as the light
 * rather than sitting in front of a pattern:
 *
 * - haze:     the first pass — smooth volumetric fog (round 1).
 * - grille:   the fog, behind the 40px grid treated as a physical grille: the
 *             grid bars block the light and each cell reads as its own lit pane.
 * - contours: the fog quantised into flat bands with 1px contour lines between
 *             them — a technical drawing of the light.
 * - dots:     everything as a halftone of square dots on a 5px pitch aligned
 *             to the grid (8 per cell); dot size carries brightness.
 * - lines:    everything as a horizontal line screen (engraving), pitch 5px;
 *             line thickness carries brightness.
 */

export type RayStyle = 'haze' | 'grille' | 'contours' | 'dots' | 'lines';

interface Props {
  mode: Mode;
  style: RayStyle;
}

const STYLE_ID: Record<RayStyle, number> = {
  haze: 0,
  grille: 1,
  contours: 2,
  dots: 3,
  lines: 4,
};

const VS = `attribute vec2 p; varying vec2 uv; void main(){ uv = p * .5 + .5; gl_Position = vec4(p, 0., 1.); }`;
const FS = `#extension GL_OES_standard_derivatives : enable
  precision highp float;
  varying vec2 uv;
  uniform sampler2D mask; uniform vec2 res; uniform float dpr; uniform vec2 origin;
  uniform vec2 light; uniform float power; uniform vec3 tint; uniform float t;
  uniform int style;

  const vec3 BG = vec3(23., 24., 26.) / 255.;
  const vec3 TEXT = vec3(230., 225., 219.) / 255.;
  const vec3 GRIDC = vec3(232., 216., 216.) / 255.;

  float m(vec2 q){ return texture2D(mask, q).r; }

  // God rays: march from this pixel toward the light; open samples near the
  // source add light.
  float march(vec2 at){
    vec2 d = light - at;
    float acc = 0.0, w = 1.0;
    vec2 q = at;
    for (int i = 0; i < 72; i++) {
      q += d / 72.0;
      acc += (1.0 - m(q)) * exp(-length((q - light) * vec2(res.x / res.y, 1.0)) * 8.0) * w;
      w *= 0.985;
    }
    // Fade toward the canvas edges so the light never ends in a hard seam.
    float fade = smoothstep(0.0, 0.18, at.y) * smoothstep(0.0, 0.18, 1.0 - at.y)
               * smoothstep(0.0, 0.12, at.x) * smoothstep(0.0, 0.12, 1.0 - at.x);
    return acc / 72.0 * power * 16.0 * fade;
  }

  // CSS px (grid-aligned) <-> uv
  vec2 toUv(vec2 c){ return vec2((c.x - origin.x) * dpr / res.x, 1.0 - (c.y - origin.y) * dpr / res.y); }

  void main(){
    vec2 css = vec2(gl_FragCoord.x, res.y - gl_FragCoord.y) / dpr + origin;
    // Halftones sample the scene once per cell (dots) or row (lines), so each
    // mark is a clean square / bar; the other styles sample every pixel.
    vec2 at = uv;
    if (style == 3) at = toUv(floor(css / 5.0) * 5.0 + 2.5);
    if (style == 4) at = toUv(vec2(css.x, floor(css.y / 5.0) * 5.0 + 2.5));
    float rays = march(at);
    vec2 g = mod(css, 40.0);
    float onGrid = (g.x < 1.0 || g.y < 1.0) ? 1.0 : 0.0;
    float inside = m(at);
    vec2 toL = normalize(light - at);
    vec2 px = dpr / res;

    // Rim: trophy pixels whose neighbour toward the light is open.
    float rimThin = clamp(inside - m(at + toL * px * 2.0), 0.0, 1.0);
    float rimWide = clamp(inside - m(at + toL * px * 6.0), 0.0, 1.0);

    // Scene light, 0..1: fog outside, rim (and a faint body) inside.
    float fog = clamp(rays * 0.42, 0.0, 1.0);
    // A faint all-round edge so the whole silhouette reads, not just the side
    // facing the light.
    float around = clamp(inside * 4.0 - (m(at + vec2(px.x * 3.0, 0.0)) + m(at - vec2(px.x * 3.0, 0.0))
                         + m(at + vec2(0.0, px.y * 3.0)) + m(at - vec2(0.0, px.y * 3.0))), 0.0, 1.0);
    float body = 0.09 + around * 0.3 + rimWide * 0.55 * power + rimThin * 0.4 * power;
    // Tone curve for the halftones and contours: roll off the highlights and
    // keep the shadows dark, so only beams and rim carry marks.
    float tone = pow(1.0 - exp(-rays * 0.22), 1.7);
    float L = inside > 0.5 ? clamp(body, 0.0, 1.0) : tone;

    vec3 col = BG;
    vec3 ink = mix(TEXT, tint, 0.65);

    if (style == 0) {
      // haze (round 1)
      col = mix(BG, GRIDC, onGrid * clamp(0.04 + rays * 0.18, 0.0, 0.16));
      col += tint * min(rays, 1.2) * 0.075;
      col = mix(col, vec3(0.055, 0.058, 0.062), inside);
      col += tint * rimThin * (0.08 + power * 0.45);
      col += (fract(sin(dot(gl_FragCoord.xy + t, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * 0.018;
    } else if (style == 1) {
      // grille: each 40px cell is a pane lit from behind; its edges fall off a
      // little, and the grid bars themselves block the light.
      vec2 e = min(g, 40.0 - g);
      float pane = mix(0.55, 1.0, smoothstep(0.0, 14.0, min(e.x, e.y)));
      col = BG + tint * fog * fog * 0.2 * pane;
      if (onGrid > 0.5) col = mix(mix(BG, GRIDC, 0.04), BG * 0.8, smoothstep(0.02, 0.2, fog));
      col = mix(col, vec3(0.055, 0.058, 0.062), inside);
      col += tint * rimThin * (0.08 + power * 0.45);
    } else if (style == 2) {
      // contours: 7 flat bands, 1px line where the band changes
      float band = floor(L * 7.0);
      float edge = fwidth(band) > 0.0 ? 1.0 : 0.0;
      col = mix(BG, ink, band / 7.0 * 0.22);
      if (edge > 0.5) col = mix(BG, ink, 0.25 + band / 7.0 * 0.6);
      if (inside > 0.5 && band < 1.0) col = BG * 0.65;
      if (onGrid > 0.5 && band < 1.0 && inside < 0.5) col = mix(BG, GRIDC, 0.04);
    } else if (style == 3) {
      // dots: square halftone, 5px pitch aligned to the grid
      vec2 c = mod(css, 5.0) - 2.5;
      float hs = 2.5 * sqrt(L);
      col = (abs(c.x) < hs && abs(c.y) < hs && L > 0.03) ? ink : BG;
    } else {
      // lines: horizontal line screen, 5px pitch, thickness carries light
      float y = mod(css.y, 5.0);
      col = (abs(y - 2.5) < 2.5 * L && L > 0.03) ? ink : BG;
    }

    gl_FragColor = vec4(col, 1.0);
  }`;

export default function LightRays({ mode, style }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const live = useRef({ mode, style });
  useEffect(() => {
    live.current = { mode, style };
  }, [mode, style]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const gl = canvas.getContext('webgl');
    if (!gl) return;
    gl.getExtension('OES_standard_derivatives');
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const sh = (type: number, src: string) => {
      const x = gl.createShader(type)!;
      gl.shaderSource(x, src);
      gl.compileShader(x);
      if (!gl.getShaderParameter(x, gl.COMPILE_STATUS))
        throw new Error(gl.getShaderInfoLog(x) ?? '');
      return x;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = (n: string) => gl.getUniformLocation(prog, n);

    const tex = gl.createTexture();
    const mask = document.createElement('canvas');
    const img = new Image();
    img.src = '/images/branding/trophy.svg';
    let ready = false;
    let box = { x: 0, y: 0, w: 1, h: 1 };

    function layout() {
      const w = canvas.width;
      const h = canvas.height;
      const mobile = innerWidth <= 700;
      const th = h * (mobile ? 0.66 : 0.76);
      const tw = th * (935 / 1080);
      box = {
        x: mobile ? (w - tw) / 2 : w * 0.66 - tw / 2,
        y: h * 0.12,
        w: tw,
        h: th,
      };
    }

    function drawMask() {
      mask.width = canvas.width;
      mask.height = canvas.height;
      const c = mask.getContext('2d')!;
      c.fillStyle = '#000';
      c.fillRect(0, 0, mask.width, mask.height);
      c.filter = 'invert(1)';
      c.drawImage(img, box.x, box.y, box.w, box.h);
      gl!.bindTexture(gl!.TEXTURE_2D, tex);
      gl!.pixelStorei(gl!.UNPACK_FLIP_Y_WEBGL, true);
      gl!.texImage2D(
        gl!.TEXTURE_2D,
        0,
        gl!.RGBA,
        gl!.RGBA,
        gl!.UNSIGNED_BYTE,
        mask,
      );
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, gl!.LINEAR);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, gl!.CLAMP_TO_EDGE);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, gl!.CLAMP_TO_EDGE);
    }

    function resize() {
      const dpr = Math.min(devicePixelRatio, 1.5);
      const r = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, r.width * dpr);
      canvas.height = Math.max(1, r.height * dpr);
      gl!.viewport(0, 0, canvas.width, canvas.height);
      gl!.uniform2f(U('res'), canvas.width, canvas.height);
      gl!.uniform1f(U('dpr'), dpr);
      const grid =
        document.querySelector<HTMLElement>('[data-site-grid]') ??
        document.body;
      const g = grid.getBoundingClientRect();
      gl!.uniform2f(
        U('origin'),
        r.left - g.left - (g.width / 2 + 20) + 40000,
        r.top - g.top - (g.height / 2 + 20) + 40000,
      );
      layout();
      if (ready) drawMask();
    }

    img.onload = () => {
      ready = true;
      resize();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const t0 = performance.now();
    const ease = (x: number) =>
      1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
    let raf = 0;
    const draw = (now: number) => {
      if (!ready) return;
      const { mode: m, style: st } = live.current;
      const sec = (now - t0) / 1000;
      const rise = reduce ? 1 : ease(sec / 3);
      const ph = reduce ? 0.6 : sec * 0.12;
      const cx = (box.x + box.w / 2) / canvas.width;
      const cy = 1 - (box.y + box.h * 0.42) / canvas.height;
      const power =
        (m === 'countdown' ? 0.25 : m === 'crowned' ? 1.25 : 1) *
        (0.6 + 0.4 * rise);
      const tint = m === 'crowned' ? [0.91, 0.2, 0.29] : [1.0, 0.95, 0.88];
      gl.uniform2f(
        U('light'),
        cx + Math.sin(ph) * 0.07,
        cy + 0.05 - (1 - rise) * 0.5,
      );
      gl.uniform1f(U('power'), power);
      gl.uniform3f(U('tint'), tint[0], tint[1], tint[2]);
      gl.uniform1f(U('t'), sec);
      gl.uniform1i(U('style'), STYLE_ID[st]);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      draw(now);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden='true'
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    />
  );
}

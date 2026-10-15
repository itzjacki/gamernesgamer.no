'use client';

import { useEffect, useRef } from 'react';

/*
 * PROTOTYPE — "Lysbrudd" (Lag + Støv), the front-page hero direction chosen in
 * the refinement round (see working-docs/front-page-and-nav.md). Kept as the
 * starting point for refinement; not yet production code.
 *
 * The trophy is backlit: a light hidden behind it breaks through its
 * cut-outs into a fog. The site grid is a PHYSICAL part of that scene, as
 * stacked sheets of glass:
 * - a fine sheet far behind, lit by the light where the beams reach it;
 * - the page grid itself in the middle (in register with the rest of the page);
 * - a coarse sheet in front, its bars reading dark against the fog.
 * The sheets drift apart with the pointer (parallax). Dust motes drift
 * through the scene and show only where they cross a beam, so the light reads
 * as a volume.
 *
 * One fragment shader, raw WebGL, no library. The trophy silhouette comes from
 * `public/images/branding/trophy.svg`, rasterised into a mask texture.
 */

/** Lifecycle states the scene reacts to: dimmed while counting down, accent-red when a champion is crowned. */
export type LysbruddMode = 'idle' | 'countdown' | 'crowned';

interface Props {
  mode?: LysbruddMode;
  dust?: boolean;
}

const VS = `attribute vec2 p; varying vec2 uv; void main(){ uv = p * .5 + .5; gl_Position = vec4(p, 0., 1.); }`;
const FS = `#extension GL_OES_standard_derivatives : enable
  precision highp float;
  varying vec2 uv;
  uniform sampler2D mask; uniform vec2 res; uniform float dpr; uniform vec2 origin;
  uniform vec2 light; uniform float power; uniform vec3 tint; uniform float t;
  uniform float dust; uniform vec2 pointer;
  uniform vec2 centre; // css px: the trophy's centre, the sheets' parallax origin

  const vec3 BG = vec3(23., 24., 26.) / 255.;
  const vec3 GRIDC = vec3(232., 216., 216.) / 255.;

  float m(vec2 q){ return texture2D(mask, q).r; }
  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

  // God rays: march from this pixel toward the light; open samples near the
  // source add light. Fades toward the canvas edges so it never ends in a seam.
  float march(){
    vec2 d = light - uv;
    float acc = 0.0, w = 1.0;
    vec2 q = uv;
    for (int i = 0; i < 72; i++) {
      q += d / 72.0;
      acc += (1.0 - m(q)) * exp(-length((q - light) * vec2(res.x / res.y, 1.0)) * 8.0) * w;
      w *= 0.985;
    }
    float fade = smoothstep(0.0, 0.18, uv.y) * smoothstep(0.0, 0.18, 1.0 - uv.y)
               * smoothstep(0.0, 0.12, uv.x) * smoothstep(0.0, 0.12, 1.0 - uv.x);
    return acc / 72.0 * power * 16.0 * fade;
  }

  // A grid line \`px\` screen pixels wide in a scaled coordinate system:
  // fwidth converts it to that system's units.
  float gridLine(float v, float px){
    return mod(v, 40.0) < max(fwidth(v), 1e-4) * px ? 1.0 : 0.0;
  }

  // Dust motes: one per random cell, drifting up with a slow wobble.
  float motes(vec2 css, float cell, float speed, float seed){
    vec2 q = css + vec2(sin(t * 0.25 + seed) * 6.0, t * speed);
    vec2 id = floor(q / cell);
    float h = hash(id + seed);
    if (h > 0.07) return 0.0;
    vec2 c = id * cell + 1.0 + vec2(hash(id + 3.1), hash(id + 7.7)) * (cell - 2.0);
    vec2 d = abs(q - c);
    float twinkle = 0.55 + 0.45 * sin(t * (0.7 + h * 4.0) + h * 40.0);
    return (max(d.x, d.y) < 0.9) ? twinkle : 0.0;
  }

  void main(){
    float rays = march();
    vec2 css = vec2(gl_FragCoord.x, res.y - gl_FragCoord.y) / dpr + origin;
    vec2 g = mod(css, 40.0);
    float onGrid = (g.x < 1.0 || g.y < 1.0) ? 1.0 : 0.0;
    float inside = m(uv);
    vec2 px = dpr / res;
    float rim = clamp(inside - m(uv + normalize(light - uv) * px * 2.0), 0.0, 1.0);
    float haze = min(rays, 1.2);

    // Back sheet: finer (far away), lit by the light; parallax away from the pointer.
    vec2 back = (css - centre) / 0.55 + centre - pointer * 14.0;
    float bl = max(gridLine(back.x + 4000.0, 1.0), gridLine(back.y + 4000.0, 1.0));
    vec3 col = BG + tint * haze * 0.06;
    col = mix(col, mix(GRIDC, tint, 0.4), bl * clamp(rays * rays * 0.12, 0.0, 0.26));
    // Middle sheet: the page grid itself.
    col = mix(col, GRIDC, onGrid * clamp(0.04 + rays * 0.12, 0.0, 0.12));

    // The trophy: a dark surface with a rim where the light grazes it.
    col = mix(col, vec3(0.055, 0.058, 0.062), inside);
    col += tint * rim * (0.08 + power * 0.45);

    // Front sheet: coarse bars in front of everything, dark against the fog.
    vec2 front = (css - centre) / 1.7 + centre + pointer * 26.0;
    float bars = max(gridLine(front.x + 4000.0, 3.0), gridLine(front.y + 4000.0, 3.0));
    col = mix(col, BG * 0.7, bars * smoothstep(0.25, 0.9, rays));

    if (dust > 0.5 && inside < 0.5) {
      float lit = clamp(rays * rays * 0.5, 0.0, 1.0);
      float d1 = motes(css, 9.0, 4.0, 0.0);
      float d2 = motes(css, 15.0, 7.5, 11.0) * 1.3;
      col += tint * (d1 * 0.35 + d2 * 0.5) * lit;
    }

    // A whisper of grain.
    col += (fract(sin(dot(gl_FragCoord.xy + t, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * 0.014;
    gl_FragColor = vec4(col, 1.0);
  }`;

export default function Lysbrudd({ mode = 'idle', dust = true }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const live = useRef({ mode, dust });
  useEffect(() => {
    live.current = { mode, dust };
  }, [mode, dust]);

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
    let dpr = 1;
    let originCss = { x: 0, y: 0 };
    // Trophy box in canvas px.
    let box = { x: 0, y: 0, w: 1, h: 1 };

    function layout() {
      const w = canvas.width;
      const h = canvas.height;
      const mobile = innerWidth <= 700;
      const th = h * (mobile ? 0.66 : 0.74);
      const tw = th * (935 / 1080);
      const cx = mobile ? w / 2 : w * 0.66;
      box = { x: cx - tw / 2, y: h * 0.88 - th, w: tw, h: th };
      gl!.uniform2f(
        U('centre'),
        cx / dpr + originCss.x,
        (box.y + th * 0.45) / dpr + originCss.y,
      );
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
      dpr = Math.min(devicePixelRatio, 1.5);
      const r = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, r.width * dpr);
      canvas.height = Math.max(1, r.height * dpr);
      gl!.viewport(0, 0, canvas.width, canvas.height);
      gl!.uniform2f(U('res'), canvas.width, canvas.height);
      gl!.uniform1f(U('dpr'), dpr);
      // Keep the shader's grid in register with the site grid.
      const grid =
        document.querySelector<HTMLElement>('[data-site-grid]') ??
        document.body;
      const g = grid.getBoundingClientRect();
      originCss = {
        x: r.left - g.left - (g.width / 2 + 20) + 40000,
        y: r.top - g.top - (g.height / 2 + 20) + 40000,
      };
      gl!.uniform2f(U('origin'), originCss.x, originCss.y);
      layout();
      if (ready) drawMask();
    }

    img.onload = () => {
      ready = true;
      resize();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    const onPointer = (e: PointerEvent) => {
      pointer.tx = (e.clientX / innerWidth) * 2 - 1;
      pointer.ty = (e.clientY / innerHeight) * 2 - 1;
    };
    addEventListener('pointermove', onPointer);

    const t0 = performance.now();
    const ease = (x: number) =>
      1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
    let raf = 0;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!ready) return;
      const { mode: m, dust: du } = live.current;
      const sec = (now - t0) / 1000;
      // On load the light rises into place behind the trophy, then drifts.
      const rise = reduce ? 1 : ease(sec / 3);
      const ph = reduce ? 0.6 : sec * 0.12;
      if (!reduce) {
        pointer.x += (pointer.tx - pointer.x) * 0.05;
        pointer.y += (pointer.ty - pointer.y) * 0.05;
      }
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
      gl.uniform1f(U('t'), reduce ? 0 : sec);
      gl.uniform1f(U('dust'), du ? 1 : 0);
      gl.uniform2f(U('pointer'), pointer.x, pointer.y);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      removeEventListener('pointermove', onPointer);
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

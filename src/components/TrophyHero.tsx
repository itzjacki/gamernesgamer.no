'use client';

import { useEffect, useRef, useState } from 'react';
import type { SiteState } from '@/lib/site-state';
import { FS, VS } from './trophy-hero-shader';

/*
 * The front page's backlit trophy (raw WebGL, shaders in
 * trophy-hero-shader.ts). The server renders a static poster (silhouette,
 * glow, fold line) that the canvas paints over once it runs; if WebGL is
 * missing, the shader fails or the context is lost, the poster simply stays.
 * Rendering pauses while off-screen or in a hidden tab, and reduced motion
 * draws single frames only when something changes.
 */

/** Where the trophy stands on desktop; phones always centre it. */
export type TrophyHeroAlign = 'right' | 'centre';

interface Props {
  state: SiteState;
  align: TrophyHeroAlign;
}

/**
 * One red light throughout; the states differ in intensity. `pulse` is the
 * light's swing (a share of `power`) over `period` seconds, echoing the
 * header logo (pulse while upcoming, faster while live). `dust` scales the
 * motes and `drift` their rise speed. `flash` scales the occasional
 * spotlight flashes, live only.
 */
interface Look {
  power: number;
  dust: number;
  drift: number;
  pulse: number;
  period: number;
  flash: number;
}

const LOOK: Record<SiteState, Look> = {
  dormant: { power: 0.8, dust: 0, drift: 1, pulse: 0, period: 1, flash: 0 },
  upcoming: {
    power: 1.05,
    dust: 0.6,
    drift: 1,
    pulse: 0.25,
    period: 4,
    flash: 0,
  },
  live: {
    power: 1.35,
    dust: 1.2,
    drift: 1.8,
    pulse: 0.12,
    period: 1.4,
    flash: 1,
  },
  justCrowned: {
    power: 1.8,
    dust: 1.6,
    drift: 1,
    pulse: 0,
    period: 1,
    flash: 0,
  },
};

// --color-accent's hue, a little more saturated: light added over the grey
// background otherwise reads washed out.
const RED = [0.95, 0.14, 0.24];

/*
 * Layout, shared by the shader and the poster (keep the poster's classes in
 * step): the trophy's foot sits 74% down the stage; it is 62% of the stage
 * tall on desktop, 56% on phones but never wider than 55% of the screen.
 */
const FOOT = 0.74;
const HEIGHT = 0.62;
const HEIGHT_PHONE = 0.56;
const MAX_WIDTH_PHONE = 0.55;
const ASPECT = 935 / 1080; // trophy.svg
const PHONE = 700;

export default function TrophyHero({ state, align }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const foldRef = useRef<HTMLDivElement>(null);
  const live = useRef({ state, align });
  // Redraws a frame on demand (reduced motion has no loop to pick changes up).
  const kick = useRef<() => void>(() => {});
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    live.current = { state, align };
    kick.current();
  }, [state, align]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const fail = (why: string) => {
      // Loud in dev, so a shader bug can't hide behind the poster.
      if (process.env.NODE_ENV === 'development')
        console.error(`TrophyHero: ${why}`);
      setFailed(true);
    };

    const gl = canvas.getContext('webgl');
    if (!gl) return fail('WebGL is unavailable');
    gl.getExtension('OES_standard_derivatives');

    const shader = (type: number, src: string) => {
      const s = gl.createShader(type);
      if (!s) return null;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (gl.getShaderParameter(s, gl.COMPILE_STATUS)) return s;
      fail(gl.getShaderInfoLog(s) ?? 'shader compile failed');
      return null;
    };
    const vs = shader(gl.VERTEX_SHADER, VS);
    const fs = vs && shader(gl.FRAGMENT_SHADER, FS);
    const prog = gl.createProgram();
    if (!vs || !fs || !prog) return;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS))
      return fail(gl.getProgramInfoLog(prog) ?? 'program link failed');
    gl.useProgram(prog);

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const attr = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(attr);
    gl.vertexAttribPointer(attr, 2, gl.FLOAT, false, 0, 0);
    const locations = new Map<string, WebGLUniformLocation | null>();
    const U = (name: string) => {
      if (!locations.has(name))
        locations.set(name, gl.getUniformLocation(prog, name));
      return locations.get(name)!;
    };

    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const tex = gl.createTexture();
    const mask = document.createElement('canvas');
    const img = new Image();
    let ready = false;
    let dpr = 1;
    let originCss = { x: 0, y: 0 };
    let box = { x: 0, y: 0, w: 1, h: 1 }; // canvas px
    let laidOutAlign = live.current.align;

    function layout() {
      const w = canvas.width;
      const h = canvas.height;
      const phone = innerWidth <= PHONE;
      const th = phone
        ? Math.min(h * HEIGHT_PHONE, (w * MAX_WIDTH_PHONE) / ASPECT)
        : h * HEIGHT;
      const tw = th * ASPECT;
      const cx = phone || live.current.align === 'centre' ? w / 2 : w * 0.66;
      // The foot snaps to a grid row: the trophy stands on the fold's
      // hairline, which lies on a page grid line. Phones (where grid
      // alignment is texture only) snap to the stage's own 40px rows, as
      // the page's CSS does for what sits on the hero.
      const foldLocal = phone
        ? Math.round((h * FOOT) / dpr / 40) * 40
        : Math.round((h * FOOT) / dpr / 40 + originCss.y / 40) * 40 -
          originCss.y;
      const fold = foldLocal + originCss.y;
      box = { x: cx - tw / 2, y: foldLocal * dpr - th, w: tw, h: th };
      gl!.uniform2f(
        U('centre'),
        cx / dpr + originCss.x,
        (box.y + th * 0.45) / dpr + originCss.y,
      );
      gl!.uniform1f(U('fold'), fold);
      gl!.uniform1f(U('sides'), phone ? 0 : 1);
      gl!.uniform1f(U('bottom'), h / dpr + originCss.y);
      if (foldRef.current) foldRef.current.style.top = `${foldLocal}px`;
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
      laidOutAlign = live.current.align;
      // The shader marches 72 samples per pixel: phones render at 1x.
      dpr = Math.min(devicePixelRatio, innerWidth <= PHONE ? 1 : 1.5);
      const r = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(r.width * dpr));
      canvas.height = Math.max(1, Math.round(r.height * dpr));
      gl!.viewport(0, 0, canvas.width, canvas.height);
      gl!.uniform2f(U('res'), canvas.width, canvas.height);
      gl!.uniform1f(U('dpr'), dpr);
      // Keep the shader's grid in register with the site grid.
      const grid =
        document.querySelector<HTMLElement>('[data-site-grid]') ??
        document.body;
      const g = grid.getBoundingClientRect();
      originCss = {
        // The page grid's `calc(50% + 20px)` is 50% of (width − 40px), so
        // its columns fall on width / 2.
        x: r.left - g.left - g.width / 2 + 40000,
        y: r.top - g.top - 8 + 40000,
      };
      gl!.uniform2f(U('origin'), originCss.x, originCss.y);
      layout();
      if (ready) drawMask();
      kick.current();
    }

    const t0 = performance.now();
    const ease = (x: number) =>
      1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
    // Eased toward the state's look, so a state change glides rather than
    // jumps.
    const cur = { ...LOOK[live.current.state] };
    let last = t0;
    // Two spotlights, one each side, each firing at random intervals from
    // low on the floor (uv y is up), aimed up at the trophy: a quick rise, a
    // soft fade.
    const flashes = [-1, 1].map((side) => ({
      side,
      start: -1e9,
      next: 1 + Math.random() * 3,
      x: 0,
      y: 0,
      ax: 0,
      ay: 0,
    }));
    const flashEnvelope = (age: number) =>
      age < 0 ? 0 : age < 0.08 ? age / 0.08 : Math.exp(-(age - 0.08) / 0.35);

    function draw(now: number) {
      const { state: st, align: al } = live.current;
      if (al !== laidOutAlign) resize();
      const sec = (now - t0) / 1000;
      const k = reduce ? 1 : 1 - Math.exp(-(now - last) / 400);
      last = now;
      const look = LOOK[st];
      for (const key of ['power', 'dust', 'drift', 'pulse', 'flash'] as const)
        cur[key] += (look[key] - cur[key]) * k;
      cur.period = look.period;
      const rise = reduce ? 1 : ease(sec / 3);
      const ph = reduce ? 0.6 : sec * 0.12;
      const cx = (box.x + box.w / 2) / canvas.width;
      const cy = 1 - (box.y + box.h * 0.42) / canvas.height;
      const breath = reduce
        ? 0
        : cur.pulse * Math.sin((sec / cur.period) * Math.PI * 2);
      const power = cur.power * (1 + breath) * (0.6 + 0.4 * rise);
      gl!.uniform2f(
        U('light'),
        cx + Math.sin(ph) * 0.07,
        cy + 0.05 - (1 - rise) * 0.17,
      );
      gl!.uniform1f(U('power'), power);
      gl!.uniform3f(U('tint'), RED[0], RED[1], RED[2]);
      gl!.uniform1f(U('t'), reduce ? 0 : sec);
      gl!.uniform1f(U('dust'), cur.dust);
      gl!.uniform1f(U('drift'), cur.drift);
      flashes.forEach((f, i) => {
        if (sec >= f.next) {
          f.start = sec;
          f.next = sec + 2.5 + Math.random() * 4;
          f.x = cx + f.side * (0.18 + Math.random() * 0.14);
          f.y = 0.14 + Math.random() * 0.08;
          f.ax = cx + (Math.random() - 0.5) * 0.08;
          f.ay = cy + (Math.random() - 0.5) * 0.2;
        }
        const strength = reduce
          ? 0
          : flashEnvelope(sec - f.start) * cur.flash * cur.power * 0.8;
        gl!.uniform3f(
          U(i === 0 ? 'flashA' : 'flashB'),
          f.x,
          f.y,
          strength < 0.002 ? 0 : strength,
        );
        gl!.uniform2f(U(i === 0 ? 'aimA' : 'aimB'), f.ax, f.ay);
      });
      gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
    }

    // The loop runs only while the stage is on screen in a visible tab;
    // reduced motion never loops and draws one frame per kick instead.
    let raf = 0;
    let onScreen = true;
    let lost = false;
    const running = () =>
      ready && !lost && onScreen && document.visibilityState === 'visible';
    const loop = (now: number) => {
      raf = 0;
      if (!running()) return;
      draw(now);
      if (!reduce) raf = requestAnimationFrame(loop);
    };
    kick.current = () => {
      if (!raf && running()) {
        last = performance.now();
        raf = requestAnimationFrame(loop);
      }
    };

    img.onload = () => {
      ready = true;
      resize();
    };
    img.onerror = () => fail('trophy.svg failed to load');
    img.src = '/images/branding/trophy.svg';

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      kick.current();
    });
    io.observe(canvas);
    const onVisibility = () => kick.current();
    document.addEventListener('visibilitychange', onVisibility);
    const onLost = (e: Event) => {
      e.preventDefault();
      lost = true;
      fail('WebGL context lost');
    };
    canvas.addEventListener('webglcontextlost', onLost);

    return () => {
      cancelAnimationFrame(raf);
      kick.current = () => {};
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.removeEventListener('webglcontextlost', onLost);
      img.onload = img.onerror = null;
    };
  }, []);

  const centred = align === 'centre';

  return (
    <>
      {/* Poster: what the scene shows before WebGL draws, or instead of it.
          Same layout as the shader (see the constants above). */}
      <div aria-hidden='true' className='pointer-events-none absolute inset-0'>
        <div
          className={`absolute bottom-[26%] [aspect-ratio:935/1080] h-[min(56%,63.5vw)] -translate-x-1/2 bg-[radial-gradient(closest-side,var(--color-border-accent),transparent)] min-[701px]:h-[62%] ${
            centred ? 'left-1/2' : 'left-1/2 min-[701px]:left-[66%]'
          }`}
        />
        <div
          className={`bg-display absolute bottom-[26%] [aspect-ratio:935/1080] h-[min(56%,63.5vw)] -translate-x-1/2 [mask:url(/images/branding/trophy.svg)_center/contain_no-repeat] min-[701px]:h-[62%] ${
            centred ? 'left-1/2' : 'left-1/2 min-[701px]:left-[66%]'
          }`}
        />
      </div>
      <canvas
        ref={canvasRef}
        aria-hidden='true'
        className={`absolute inset-0 h-full w-full ${failed ? 'hidden' : ''}`}
      />
      {/* The fold's hairline, on a grid row (placed exactly by layout; the
          poster's 74% is its server-side estimate): the trophy stands on it. */}
      <div
        ref={foldRef}
        aria-hidden='true'
        className='bg-border pointer-events-none absolute inset-x-0 top-[74%] h-px'
      />
      {/* Under the floor: its closing line on the stage's bottom grid row,
          then one row with no vertical lines (it masks the page grid's)
          before the page grid carries on. */}
      <div
        aria-hidden='true'
        className='border-border bg-bg pointer-events-none absolute inset-x-0 top-full h-10 border-t'
      />
    </>
  );
}

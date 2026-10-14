'use client';

import { useEffect, useRef } from 'react';
import s from '../proto.module.css';

/*
 * PROTOTYPE — the zero-library alternative: 28 stacked copies of trophy.svg in
 * Z fake an extrusion; a pointer-tracked gradient fakes the specular.
 */

interface Props {
  winners: string[];
}

const LAYERS = 28;
const NS = 'http://www.w3.org/2000/svg';

export default function CssTrophy({ winners }: Props) {
  const objRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const obj = objRef.current!;
    let raf = 0;
    let stopped = false;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const target = { x: 0, y: 0 };
    const cur = { x: 0, y: 0 };
    const onMove = (e: PointerEvent) => {
      target.x = (e.clientX / innerWidth) * 2 - 1;
      target.y = (e.clientY / innerHeight) * 2 - 1;
    };

    fetch('/images/branding/trophy.svg')
      .then((r) => r.text())
      .then((txt) => {
        if (stopped) return;
        const doc = new DOMParser().parseFromString(txt, 'image/svg+xml');
        const d = [...doc.querySelectorAll('path')].map(
          (p) => p.getAttribute('d') ?? '',
        );
        obj.replaceChildren();
        for (let i = LAYERS; i >= 0; i--) {
          const front = i === 0;
          const svg = document.createElementNS(NS, 'svg');
          svg.setAttribute('viewBox', '0 0 935 1080');
          svg.style.transform = `translateZ(${-i * 1.1}px)`;
          const shade = front
            ? 'url(#css-spec)'
            : `hsl(40 ${55 - i}% ${34 - i * 0.6}%)`;
          const plates = winners
            .map((w, n) => {
              const x = 296 + (n % 3) * 124;
              const y = n < 3 ? 905 : 945;
              return `<text x="${x}" y="${y}">${String(n + 1).padStart(2, '0')} ${w.toUpperCase()}</text>`;
            })
            .join('');
          svg.innerHTML =
            (front
              ? `<defs><linearGradient id="css-spec" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="935" y2="1080">
                   <stop offset="0" stop-color="#8a6a2c"/><stop offset=".35" stop-color="#c79c48"/>
                   <stop offset=".5" stop-color="#fff1c9"/><stop offset=".62" stop-color="#d4a84f"/>
                   <stop offset="1" stop-color="#6e5222"/></linearGradient></defs>`
              : '') +
            `<path fill-rule="evenodd" fill="${shade}" d="${d[0]}"/>` +
            `<path fill-rule="evenodd" fill="${front ? '#1c1d1f' : '#0f1012'}" d="${d[2]}"/>` +
            `<path fill-rule="evenodd" fill="${front ? '#b89250' : '#5a4520'}" d="${d[3]}"/>` +
            (front
              ? `<g font-family="Neue Montreal" font-weight="800" font-size="17" fill="#2a2010">${plates}</g>`
              : '');
          obj.appendChild(svg);
        }
        const stops = [...obj.querySelectorAll('#css-spec stop')].slice(1, 4);
        const loop = () => {
          cur.x += (target.x - cur.x) * 0.1;
          cur.y += (target.y - cur.y) * 0.1;
          if (!reduce)
            obj.style.transform = `rotateY(${-14 + cur.x * 22}deg) rotateX(${4 - cur.y * 10}deg)`;
          const c = 0.5 + cur.x * 0.3;
          stops[0]?.setAttribute('offset', String(c - 0.15));
          stops[1]?.setAttribute('offset', String(c));
          stops[2]?.setAttribute('offset', String(c + 0.12));
          raf = requestAnimationFrame(loop);
        };
        loop();
      });
    addEventListener('pointermove', onMove);
    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      removeEventListener('pointermove', onMove);
    };
  }, [winners]);

  return (
    <div className={s.cssStage}>
      <div
        ref={objRef}
        className={s.cssObj}
        style={{ transform: 'rotateY(-14deg) rotateX(4deg)' }}
      />
    </div>
  );
}

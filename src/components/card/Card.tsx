'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import type { CardData, CardStats } from '@/types/card';
import { CARD_TYPES } from './card-types';
import { MATTE_GRAIN } from './card-art';
import CardEtch from './CardEtch';
import styles from './Card.module.css';

export interface Props {
  /**
   * The card's face. Without one the card is sealed (an unrevealed season):
   * it shows only the back and can't be flipped, and no data reaches the
   * client.
   */
  card?: CardData;
}

const MAX_TILT = 14;
const STAT_ORDER: Exclude<keyof CardStats, 'overall'>[] = [
  'focus',
  'strategy',
  'mechanics',
  'mental',
  'versatility',
  'consistency',
  'tactics',
];

function capitalizeFirst(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** 50–99 maps onto the gauge; anything outside it pins to an end. */
function gaugeWidth(value: number) {
  return `${Math.min(100, Math.max(0, ((value - 50) / 49) * 100))}%`;
}

/**
 * A physical card: flat, like a real one. Everything that moves is light on
 * its surface (sheen, foil, gloss, the lit edge), driven by CSS variables the
 * tilt sets, so a card type is styling only. Clicking flips it to the shared
 * back.
 */
export default function Card({ card }: Props) {
  const showBack = !card;
  const skin = card ? CARD_TYPES[card.type] : undefined;

  const cardRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const startFlip = showBack ? 180 : 0;
  const target = useRef({ x: 0, y: 0, flip: startFlip });
  const current = useRef({ x: 0, y: 0, flip: startFlip });

  useEffect(
    () => () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    },
    [],
  );

  function reducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function paint() {
    const el = cardRef.current;
    if (!el) return;
    const t = target.current;
    const c = current.current;
    const still = reducedMotion();
    c.x += (t.x - c.x) * (still ? 1 : 0.12);
    c.y += (t.y - c.y) * (still ? 1 : 0.12);
    c.flip += (t.flip - c.flip) * (still ? 1 : 0.16);

    // -1..1 on each axis; the light sits opposite the side tilted away.
    const nx = c.y / MAX_TILT;
    const ny = -c.x / MAX_TILT;
    el.style.setProperty(
      '--card-transform',
      `perspective(900px) rotateX(${c.x}deg) rotateY(${c.y + c.flip}deg)`,
    );
    el.style.setProperty('--card-mx', `${50 + nx * 50}%`);
    el.style.setProperty('--card-my', `${50 + ny * 50}%`);
    el.style.setProperty(
      '--card-tilt',
      String(Math.min(1, Math.hypot(nx, ny))),
    );
    el.style.setProperty(
      '--card-light',
      `${(Math.atan2(ny, nx) * 180) / Math.PI + 90}deg`,
    );
    // The light's direction, -1..1; at rest it falls from above.
    el.style.setProperty('--card-lx', String(nx));
    el.style.setProperty('--card-ly', String(Math.max(-1, ny - 0.6)));
    el.dataset.side =
      Math.cos((c.flip * Math.PI) / 180) >= 0 ? 'front' : 'back';

    const settled =
      Math.abs(t.x - c.x) < 0.01 &&
      Math.abs(t.y - c.y) < 0.01 &&
      Math.abs(t.flip - c.flip) < 0.05;
    rafRef.current = settled ? null : requestAnimationFrame(paint);
  }

  function schedule() {
    rafRef.current ??= requestAnimationFrame(paint);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (reducedMotion()) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    const clamp = (v: number) => Math.max(-1, Math.min(1, v * 2));
    target.current.x = -clamp(py) * MAX_TILT;
    target.current.y = clamp(px) * MAX_TILT;
    schedule();
  }

  function handlePointerLeave() {
    target.current.x = 0;
    target.current.y = 0;
    schedule();
  }

  function handleFlip() {
    target.current.flip = target.current.flip === 0 ? 180 : 0;
    schedule();
  }

  return (
    // The listener sits on an untransformed wrapper, so the tilting card
    // never moves its own hit box out from under the pointer.
    <div
      className={styles.wrapper}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onPointerCancel={handlePointerLeave}
      onPointerUp={(e) => e.pointerType === 'touch' && handlePointerLeave()}
    >
      <div
        ref={cardRef}
        className={styles.card}
        data-side={showBack ? 'back' : 'front'}
        data-stock={skin?.stock}
        data-ink={skin?.ink}
        data-bleed={skin?.bleed || undefined}
        style={
          {
            '--card-grain': MATTE_GRAIN,
            ...(showBack && {
              '--card-transform': 'perspective(900px) rotateY(180deg)',
            }),
          } as React.CSSProperties
        }
      >
        {card && <Front card={card} />}

        <div className={styles.back} aria-hidden='true'>
          <div className={styles.backLogo} />
        </div>

        <div className={styles.edge} aria-hidden='true' />
      </div>

      {card ? (
        <button
          type='button'
          className={styles.flipButton}
          onClick={handleFlip}
          aria-label={`Snu kortet til ${card.name}`}
        />
      ) : (
        <span
          className={styles.flipButton}
          role='img'
          aria-label='Forseglet kort'
        />
      )}
    </div>
  );
}

function Front({ card }: { card: CardData }) {
  const skin = CARD_TYPES[card.type];
  const pad = (n: number) => String(n).padStart(2, '0');
  const serial = [
    `GG-${card.season}`,
    skin.code,
    `${pad(card.number)}/${pad(card.of)}`,
  ].join(' · ');
  const stats = STAT_ORDER.map((key) => [key, card.stats[key]] as const);
  const delta = card.overallChange;

  return (
    <div className={styles.front}>
      <div className={styles.stock} aria-hidden='true' />
      <p className={styles.seasonFigure} aria-hidden='true'>
        {card.season}
      </p>
      <div className={styles.portrait}>
        <Image
          src={card.imagePath}
          alt=''
          fill
          sizes='300px'
          className={styles.portraitImage}
        />
      </div>

      <div className={styles.overall}>
        <p className={styles.overallFigure}>{card.stats.overall}</p>
        <p className={styles.overallLabel}>Overall</p>
        <p className={styles.overallLabel}>
          S{Number(card.season)}
          {delta !== undefined && (
            <span className={styles.delta}>
              {delta > 0 ? '▲' : delta < 0 ? '▼' : '±'}
              {Math.abs(delta)}
            </span>
          )}
        </p>
      </div>

      <div className={styles.panel}>
        <p className={styles.name}>
          {card.name}
          {card.titles !== undefined && (
            <span
              className={styles.stars}
              aria-label={`${card.titles} mestertitler`}
            >
              {Array.from({ length: card.titles }, (_, i) => (
                <span key={i} className={styles.star} />
              ))}
            </span>
          )}
        </p>
        <p className={styles.nickname}>{card.nickname}</p>
        <dl className={styles.stats}>
          {stats.map(([key, value]) => (
            <div key={key} className={styles.stat}>
              <dt>{capitalizeFirst(key)}</dt>
              <dd>{value}</dd>
              <span className={styles.gauge} aria-hidden='true'>
                <span style={{ width: gaugeWidth(value) }} />
              </span>
            </div>
          ))}
        </dl>
        <p className={styles.serial}>
          <span className={styles.serialText}>{serial}</span>
          {/* The wrapper carries the bite's shadows: a filter on the
                  masked mark itself would be masked away. */}
          <span className={styles.markBite} aria-hidden='true'>
            <span className={styles.markFoil} />
          </span>
        </p>
      </div>

      {skin.foil === 'texture' && (
        <>
          <CardEtch
            imagePath={card.imagePath}
            season={card.season}
            points={card.points}
          />
          <div className={styles.panelEtch} aria-hidden='true' />
        </>
      )}
      <div className={styles.sheen} aria-hidden='true' />
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import s from '../proto.module.css';

/*
 * PROTOTYPE — the /vs index picker. A plain GET form to /proto/vs (which
 * redirects to /vs/[a]/[b]), so it works without JS; with JS it navigates
 * directly. Each list disables the player chosen on the other side and any
 * player who never shared a season with them.
 */

export interface PickerPlayer {
  slug: string;
  name: string;
  image: string;
}

interface Props {
  players: PickerPlayer[];
  /** "a|b" for every ordered pair that has a /vs page. */
  pairs: string[];
  initialA?: string;
  initialB?: string;
  compact?: boolean;
}

export default function VsPicker({
  players,
  pairs,
  initialA = '',
  initialB = '',
  compact = false,
}: Props) {
  const router = useRouter();
  const [a, setA] = useState(initialA);
  const [b, setB] = useState(initialB);
  const valid = new Set(pairs);
  const ok = !!a && !!b && valid.has(`${a}|${b}`);
  const pa = players.find((p) => p.slug === a);
  const pb = players.find((p) => p.slug === b);

  const options = (other: string) =>
    players.map((p) => (
      <option
        key={p.slug}
        value={p.slug}
        disabled={
          !!other && (p.slug === other || !valid.has(`${other}|${p.slug}`))
        }
      >
        {p.name}
      </option>
    ));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (ok) router.push(`/proto/vs/${a}/${b}`);
  };

  if (compact) {
    return (
      <form
        className={s.compact}
        action='/proto/vs'
        method='get'
        onSubmit={submit}
      >
        <select
          name='a'
          aria-label='Spiller A'
          value={a}
          onChange={(e) => setA(e.target.value)}
        >
          <option value=''>Spiller A</option>
          {options(b)}
        </select>
        <span className={s.slash} aria-hidden='true' />
        <select
          name='b'
          aria-label='Spiller B'
          value={b}
          onChange={(e) => setB(e.target.value)}
        >
          <option value=''>Spiller B</option>
          {options(a)}
        </select>
        <button type='submit' disabled={!ok}>
          <span className={s.ph}>[Gå]</span>
        </button>
      </form>
    );
  }

  return (
    <form className={s.vs} action='/proto/vs' method='get' onSubmit={submit}>
      <div className={s.halves}>
        <div className={s.side}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {pa ? <img src={pa.image} alt='' /> : null}
          <label htmlFor='vs-a' className={s.ph}>
            [spiller A]
          </label>
          <select
            id='vs-a'
            name='a'
            value={a}
            data-empty={!a}
            onChange={(e) => setA(e.target.value)}
            required
          >
            <option value='' disabled hidden>
              [VELG]
            </option>
            {options(b)}
          </select>
        </div>
        <div className={`${s.side} ${s.sideB}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {pb ? <img src={pb.image} alt='' /> : null}
          <label htmlFor='vs-b' className={s.ph}>
            [spiller B]
          </label>
          <select
            id='vs-b'
            name='b'
            value={b}
            data-empty={!b}
            onChange={(e) => setB(e.target.value)}
            required
            autoFocus={!!initialA && !initialB}
          >
            <option value='' disabled hidden>
              [VELG]
            </option>
            {options(a)}
          </select>
        </div>
        <svg
          className={s.diag}
          viewBox='0 0 100 100'
          preserveAspectRatio='none'
          aria-hidden='true'
        >
          <line
            x1='58'
            y1='0'
            x2='42'
            y2='100'
            style={{ stroke: 'var(--color-accent)' }}
            strokeWidth='1'
            vectorEffect='non-scaling-stroke'
          />
        </svg>
      </div>
      <div className={s.foot}>
        <button
          type='button'
          className={s.swap}
          onClick={() => {
            setA(b);
            setB(a);
          }}
        >
          <span className={s.ph}>[Bytt]</span>
        </button>
        <button type='submit' className={s.go} disabled={!ok}>
          <span className={s.ph}>[se oppgjøret]</span>
        </button>
      </div>
    </form>
  );
}

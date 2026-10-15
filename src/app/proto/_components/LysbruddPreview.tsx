'use client';

import { useState } from 'react';
import Lysbrudd, { type LysbruddMode } from './Lysbrudd';

/*
 * PROTOTYPE — a preview stage for the Lysbrudd hero: full-bleed at hero size,
 * with a small panel to switch the lifecycle state and the dust.
 */

const MODES: [LysbruddMode, string][] = [
  ['idle', 'Hvile'],
  ['countdown', 'Nedtelling'],
  ['crowned', 'Kronet'],
];

const BUTTON =
  'border-border-accent text-text-muted aria-pressed:border-accent aria-pressed:text-text cursor-pointer border px-1.5 py-1';

export default function LysbruddPreview() {
  const [mode, setMode] = useState<LysbruddMode>('idle');
  const [dust, setDust] = useState(true);

  return (
    <>
      <section className='relative h-[min(calc(100svh-180px),760px)] min-h-[520px]'>
        {/* The stage bleeds to the viewport edges. */}
        <div className='absolute inset-y-0 right-[calc((100%-100vw)/2)] left-[calc((100%-100vw)/2)]'>
          <Lysbrudd mode={mode} dust={dust} />
        </div>
      </section>
      <div className='border-border bg-bg fixed right-3 bottom-3 z-50 grid gap-1.5 border p-2.5 font-mono text-[10px]'>
        <b className='text-text-muted font-normal uppercase'>
          Prototype · Lysbrudd
        </b>
        <div className='flex gap-1'>
          {MODES.map(([m, label]) => (
            <button
              key={m}
              type='button'
              aria-pressed={mode === m}
              onClick={() => setMode(m)}
              className={BUTTON}
            >
              {label}
            </button>
          ))}
          <button
            type='button'
            aria-pressed={dust}
            onClick={() => setDust(!dust)}
            className={BUTTON}
          >
            Støv
          </button>
        </div>
      </div>
    </>
  );
}

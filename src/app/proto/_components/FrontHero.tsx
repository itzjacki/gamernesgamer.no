'use client';

import { useEffect, useState } from 'react';
import s from '../proto.module.css';
import TrophyStage from './TrophyStage';
import CssTrophy from './CssTrophy';
import LightRays, { type RayStyle } from './LightRays';
import type { Fx, Metal, Mode, Output } from './trophyScene';

/*
 * PROTOTYPE — the front page's top fold in its four lifecycle states, with a
 * control panel to switch state, hero variant, metal and effects. Idle uses
 * real data; countdown / live / crowned use demo values (labelled).
 * Every bracketed label is placeholder copy.
 */

export interface HeroData {
  champion: string;
  seasonNumber: number;
  dateLabel: string;
  points: number;
  margin: number;
  titles: number;
  daysAsChampion: number;
  nextSeasonNumber: number;
  winners: string[];
  /** Latest season's final standings — stand-in rows for the live demo. */
  liveStandings: { name: string; points: number }[];
  /** Demo name for the "crowned" state. */
  newWinner: string;
  modelUrl: string | null;
}

type Variant = '3d' | 'css' | 'rays';

const STATES: [Mode, string][] = [
  ['idle', 'Hvile'],
  ['countdown', 'Nedtelling'],
  ['live', 'Live'],
  ['crowned', 'Kronet'],
];
const VARIANTS: [Variant, string][] = [
  ['3d', '3D'],
  ['css', 'CSS'],
  ['rays', 'Lysbrudd'],
];
const RAY_STYLES: [RayStyle, string][] = [
  ['grille', 'Gitter'],
  ['contours', 'Konturer'],
  ['dots', 'Punkter'],
  ['lines', 'Linjer'],
  ['haze', 'Dis (runde 1)'],
];
const OUTPUTS: [Output, string][] = [
  ['shaded', 'Skyggelagt'],
  ['dots', 'Punkter'],
  ['lines', 'Linjer'],
];
const METALS: [Metal, string][] = [
  ['gold', 'Gull'],
  ['steel', 'Stål'],
  ['graphite', 'Grafitt'],
];

function Countdown() {
  // Demo target: 34 days from first render. Rendered after mount (no hydration mismatch).
  const [now, setNow] = useState<number | null>(null);
  const [target] = useState(() => Date.now() + 34 * 864e5 + 4 * 36e5);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);
  if (now === null) return <div className={s.count}>&nbsp;</div>;
  const left = Math.max(0, target - now) / 1000;
  const pad = (n: number) => String(Math.floor(n)).padStart(2, '0');
  return (
    <div className={s.count}>
      {Math.floor(left / 86400)}d {pad((left % 86400) / 3600)}:
      {pad((left % 3600) / 60)}:{pad(left % 60)}
    </div>
  );
}

export default function FrontHero({ data }: { data: HeroData }) {
  const [mode, setMode] = useState<Mode>('idle');
  const [variant, setVariant] = useState<Variant>('rays');
  const [rayStyle, setRayStyle] = useState<RayStyle>('grille');
  const [output, setOutput] = useState<Output>('dots');
  const [metal, setMetal] = useState<Metal>('gold');
  const [fx, setFx] = useState<Fx>({ bloom: true, grain: true, rim: true });
  const [replayKey, setReplayKey] = useState(0);
  const [open, setOpen] = useState(true);
  const next = `S${data.nextSeasonNumber}`;

  const chooseMode = (m: Mode) => {
    setMode(m);
    // Countdown reads as "unlit": graphite until someone wins it again.
    if (m === 'countdown' && metal === 'gold') setMetal('graphite');
    if (m !== 'countdown' && metal === 'graphite') setMetal('gold');
  };

  const copy = {
    idle: (
      <>
        <p className={s.eyebrow}>
          <span className={s.ph}>[regjerende mester]</span> · S
          {data.seasonNumber}
        </p>
        <h1 className={s.name}>{data.champion}</h1>
        <div className={s.readout}>
          <div>
            <span className={s.ph}>[poeng]</span>
            <b className={s.acc}>{data.points}</b>
          </div>
          <div>
            <span className={s.ph}>[margin]</span>
            <b>+{data.margin}</b>
          </div>
          <div>
            <span className={s.ph}>[titler]</span>
            <b>{data.titles}</b>
          </div>
          <div>
            <span className={s.ph}>[dager som mester]</span>
            <b>{data.daysAsChampion}</b>
          </div>
        </div>
      </>
    ),
    countdown: (
      <>
        <p className={s.eyebrow}>
          <span className={s.ph}>[{next} starter om]</span> · demo
        </p>
        <Countdown />
        <div className={s.readout}>
          <div>
            <span className={s.ph}>[forsvarer]</span>
            <b>{data.champion}</b>
          </div>
          <div>
            <span className={s.ph}>[spill]</span>
            <b>10</b>
          </div>
          <div>
            <span className={s.ph}>[avslørt]</span>
            <b>3/10</b>
          </div>
        </div>
      </>
    ),
    live: (
      <>
        <p className={s.eyebrow}>
          <span className={s.ph}>[stillingen nå]</span> · Spill 6/9 · demo-data
        </p>
        <table className={s.liveBoard}>
          <tbody>
            {data.liveStandings.map((r, i) => (
              <tr key={r.name}>
                <td>{String(i + 1).padStart(2, '0')}</td>
                <td>{r.name}</td>
                <td>{r.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </>
    ),
    crowned: (
      <>
        <p className={s.eyebrow}>
          <span className={s.ph}>[ny mester]</span> · {next} · demo
        </p>
        <h1 className={s.name}>{data.newWinner}</h1>
        <div className={s.readout}>
          <div>
            <span className={s.ph}>[poeng]</span>
            <b className={s.acc}>52</b>
          </div>
          <div>
            <span className={s.ph}>[margin]</span>
            <b>+5</b>
          </div>
          <div>
            <span className={s.ph}>[første tittel]</span>
            <b>1</b>
          </div>
        </div>
      </>
    ),
  }[mode];

  const group = <T extends string>(
    items: [T, string][],
    value: T,
    set: (v: T) => void,
  ) => (
    <div className={s.row}>
      {items.map(([v, label]) => (
        <button
          key={v}
          type='button'
          aria-pressed={v === value}
          onClick={() => set(v)}
        >
          {label}
        </button>
      ))}
    </div>
  );
  const toggle = (k: keyof Fx, label: string) => (
    <button
      type='button'
      aria-pressed={fx[k]}
      onClick={() => setFx({ ...fx, [k]: !fx[k] })}
    >
      {label}
    </button>
  );

  return (
    <>
      <section className={s.hero} data-mode={mode}>
        <div className={s.copy}>{copy}</div>
        {variant === '3d' ? (
          <TrophyStage
            mode={mode}
            metal={metal}
            output={output}
            fx={fx}
            winners={data.winners}
            newWinner={data.newWinner}
            modelUrl={data.modelUrl}
            replayKey={replayKey}
          />
        ) : (
          <div className={s.stage}>
            {variant === 'css' ? (
              <CssTrophy winners={data.winners} />
            ) : (
              <LightRays mode={mode} style={rayStyle} />
            )}
          </div>
        )}
      </section>

      <div className={s.controls}>
        <div className={s.controlsHead}>
          <b>Prototype · forside</b>
          <button
            type='button'
            onClick={() => setOpen(!open)}
            aria-expanded={open}
          >
            {open ? '–' : '+'}
          </button>
        </div>
        {open ? (
          <>
            <b>Tilstand</b>
            {group(STATES, mode, chooseMode)}
            <b>Helt</b>
            {group(VARIANTS, variant, setVariant)}
            {variant === 'rays' ? (
              <>
                <b>Lysstil</b>
                {group(RAY_STYLES, rayStyle, setRayStyle)}
              </>
            ) : null}
            {variant === '3d' ? (
              <>
                <b>Visning</b>
                {group(OUTPUTS, output, setOutput)}
                <b>Metall{data.modelUrl ? ' (kun ekstrudert)' : ''}</b>
                {group(METALS, metal, setMetal)}
                <b>Effekter</b>
                <div className={s.row}>
                  {toggle('bloom', 'Bloom')}
                  {toggle('grain', 'Korn')}
                  {toggle('rim', 'Rødt kantlys')}
                  <button
                    type='button'
                    onClick={() => setReplayKey((k) => k + 1)}
                  >
                    Spill intro igjen
                  </button>
                </div>
              </>
            ) : null}
            <b>
              {data.modelUrl
                ? 'Modell: skannet GLB'
                : 'Modell: ekstrudert trophy.svg'}
            </b>
          </>
        ) : null}
      </div>
    </>
  );
}

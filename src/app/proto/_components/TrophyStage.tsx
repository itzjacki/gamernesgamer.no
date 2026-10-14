'use client';

import { useEffect, useRef, useState } from 'react';
import s from '../proto.module.css';
import type { Fx, Metal, Mode, Output, TrophyScene } from './trophyScene';

/*
 * PROTOTYPE — hosts the 3D trophy. Renders a cheap poster on the server, then
 * lazy-imports three.js (its own chunk) once mounted, if WebGL2 exists.
 */

interface Props {
  mode: Mode;
  metal: Metal;
  output: Output;
  fx: Fx;
  winners: string[];
  newWinner: string;
  /** A scanned model in public/, when one exists; else the SVG is extruded. */
  modelUrl: string | null;
  replayKey: number;
}

export default function TrophyStage({
  mode,
  metal,
  output,
  fx,
  winners,
  newWinner,
  modelUrl,
  replayKey,
}: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const diagRef = useRef<SVGLineElement>(null);
  const sceneRef = useRef<TrophyScene | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  // The latest props, for the scene to pick up once it has loaded.
  const latest = useRef({ mode, metal, fx, output });
  useEffect(() => {
    latest.current = { mode, metal, fx, output };
  }, [mode, metal, fx, output]);

  useEffect(() => {
    let cancelled = false;
    const canvas = canvasRef.current!;
    if (!canvas.getContext('webgl2')) {
      setFailed(true);
      return;
    }
    import('./trophyScene')
      .then(({ createTrophyScene }) =>
        createTrophyScene({
          canvas,
          stage: stageRef.current!,
          grid: document.querySelector<HTMLElement>('[data-site-grid]'),
          diagonal: diagRef.current,
          winners,
          newWinner,
          modelUrl,
          offsetRight: () => innerWidth > 700,
        }),
      )
      .then((scene) => {
        if (cancelled) return scene.dispose();
        sceneRef.current = scene;
        scene.setMetal(latest.current.metal);
        scene.setFx(latest.current.fx);
        scene.setOutput(latest.current.output);
        scene.setMode(latest.current.mode);
        setReady(true);
      })
      .catch((e) => {
        console.error(e);
        setFailed(true);
      });
    return () => {
      cancelled = true;
      sceneRef.current?.dispose();
      sceneRef.current = null;
    };
    // The scene is built once; later prop changes go through the setters below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => sceneRef.current?.setMode(mode), [mode]);
  useEffect(() => sceneRef.current?.setMetal(metal), [metal]);
  useEffect(() => sceneRef.current?.setFx(fx), [fx]);
  useEffect(() => sceneRef.current?.setOutput(output), [output]);
  useEffect(() => {
    if (replayKey) sceneRef.current?.replay();
  }, [replayKey]);

  return (
    <div ref={stageRef} className={s.stage}>
      {!ready ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className={s.poster} src='/images/branding/trophy.svg' alt='' />
      ) : null}
      <canvas
        ref={canvasRef}
        aria-hidden='true'
        style={{ opacity: ready ? 1 : 0, transition: 'opacity .3s' }}
      />
      <svg
        className={s.diag}
        viewBox='0 0 100 100'
        preserveAspectRatio='none'
        aria-hidden='true'
      >
        <line
          ref={diagRef}
          x1='80'
          y1='0'
          x2='52'
          y2='100'
          style={{ stroke: 'var(--color-accent)' }}
          strokeWidth='1'
          vectorEffect='non-scaling-stroke'
        />
      </svg>
      {failed ? (
        <p
          className={s.eyebrow}
          style={{ position: 'absolute', bottom: 8, right: 16 }}
        >
          WebGL2 utilgjengelig: viser plakat
        </p>
      ) : null}
    </div>
  );
}

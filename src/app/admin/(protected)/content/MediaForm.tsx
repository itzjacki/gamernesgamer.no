'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import { parseYoutubeId } from '@/lib/media/youtube';
import { MEDIA_KIND_ORDER, type MediaKind } from '@/lib/media/view-models';
import { lookupYoutube, saveMedia, type YoutubeLookup } from './actions';
import { KIND_LABELS, STATUS_LABELS } from './labels';

export interface FormOptions {
  seasons: {
    number: number;
    games: { slug: string; title: string }[];
    playerSlugs: string[];
  }[];
  players: { slug: string; name: string }[];
  images: string[];
}

export interface MediaFormValues {
  id: string | null;
  kind: MediaKind;
  source: 'youtube' | 'image';
  youtube: string;
  imageFile: string;
  vertical: boolean;
  title: string;
  alt: string;
  season: number | null;
  gameSlug: string | null;
  playerSlugs: string[];
}

interface Props {
  initial: MediaFormValues | null;
  options: FormOptions;
}

const EMPTY: MediaFormValues = {
  id: null,
  kind: 'player_intro',
  source: 'youtube',
  youtube: '',
  imageFile: '',
  vertical: false,
  title: '',
  alt: '',
  season: null,
  gameSlug: null,
  playerSlugs: [],
};

const fieldClass =
  'border-border bg-surface text-text focus-visible:outline-accent h-11 w-full border px-3 text-sm transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50';
const labelClass = 'text-text-muted text-sm';
const checkboxClass =
  'border-text-muted bg-bg checked:border-accent checked:bg-accent focus-visible:outline-accent size-4 shrink-0 cursor-pointer appearance-none border transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2';

/**
 * Controlled on purpose: React resets uncontrolled fields after a form action,
 * which would wipe a half-filled form when a save fails.
 */
export default function MediaForm({ initial, options }: Props) {
  const router = useRouter();
  const [values, setValues] = useState<MediaFormValues>(initial ?? EMPTY);
  // The YouTube title only prefills a title nobody has typed.
  const [titleTouched, setTitleTouched] = useState(Boolean(initial));
  const [lastLookup, setLookup] = useState<YoutubeLookup | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const set = <K extends keyof MediaFormValues>(
    key: K,
    value: MediaFormValues[K],
  ) => setValues((v) => ({ ...v, [key]: value }));

  const parsed =
    values.source === 'youtube' ? parseYoutubeId(values.youtube) : null;
  const parsedId = parsed?.id ?? null;
  // A lookup only counts for the id now in the field.
  const lookup = lastLookup && lastLookup.id === parsedId ? lastLookup : null;

  useEffect(() => {
    if (!parsedId) return;
    let cancelled = false;
    lookupYoutube(parsedId).then((result) => {
      if (cancelled) return;
      setLookup(result);
      if (result.title && !titleTouched) {
        setValues((v) => ({ ...v, title: result.title ?? v.title }));
      }
    });
    return () => {
      cancelled = true;
    };
    // Only a new id should trigger a lookup.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsedId]);

  const season = options.seasons.find((s) => s.number === values.season);
  const pickablePlayers = season
    ? options.players.filter((p) => season.playerSlugs.includes(p.slug))
    : options.players;
  const isImageKind = values.kind === 'photo' || values.kind === 'meme';

  function changeYoutube(value: string) {
    const next = parseYoutubeId(value);
    setValues((v) => ({
      ...v,
      youtube: value,
      vertical: next?.isShort ? true : v.vertical,
    }));
  }

  function changeSeason(value: string) {
    const number = value ? Number(value) : null;
    const nextSeason = options.seasons.find((s) => s.number === number);
    setValues((v) => ({
      ...v,
      season: number,
      gameSlug: null,
      playerSlugs: nextSeason
        ? v.playerSlugs.filter((slug) => nextSeason.playerSlugs.includes(slug))
        : v.playerSlugs,
    }));
  }

  function togglePlayer(slug: string) {
    setValues((v) => ({
      ...v,
      playerSlugs: v.playerSlugs.includes(slug)
        ? v.playerSlugs.filter((s) => s !== slug)
        : [...v.playerSlugs, slug],
    }));
  }

  function handleSubmit() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await saveMedia(values);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (values.id) {
        router.push('/admin/content');
      } else {
        setValues({ ...EMPTY, kind: values.kind, season: values.season });
        setTitleTouched(false);
        setSaved(true);
      }
    });
  }

  return (
    <form action={handleSubmit} className='mt-4 flex flex-col gap-6'>
      <fieldset className='flex flex-col gap-3'>
        <legend className={labelClass}>Kilde</legend>
        <div className='flex gap-6'>
          {(['youtube', 'image'] as const).map((source) => (
            <label
              key={source}
              className='text-text flex min-h-11 cursor-pointer items-center gap-3 text-sm'
            >
              <input
                type='radio'
                name='source'
                checked={values.source === source}
                onChange={() => set('source', source)}
                className={`${checkboxClass} rounded-full`}
              />
              {source === 'youtube' ? 'YouTube-video' : 'Bilde fra repoet'}
            </label>
          ))}
        </div>
      </fieldset>

      {values.source === 'youtube' ? (
        <div className='flex flex-col gap-2'>
          <label htmlFor='media-youtube' className={labelClass}>
            YouTube-lenke
          </label>
          <input
            id='media-youtube'
            value={values.youtube}
            onChange={(e) => changeYoutube(e.target.value)}
            placeholder='https://youtu.be/…'
            className={fieldClass}
            autoComplete='off'
          />
          {values.youtube && !parsed ? (
            <span className='text-text-accent font-mono text-xs' role='alert'>
              {STATUS_LABELS.invalid}
            </span>
          ) : lookup && lookup.status !== 'ok' ? (
            <span className='text-text-accent font-mono text-xs' role='alert'>
              {STATUS_LABELS[lookup.status]}
            </span>
          ) : parsedId ? (
            <span className='text-text-muted font-mono text-xs'>
              Video-ID {parsedId}
            </span>
          ) : null}
        </div>
      ) : (
        <div className='flex flex-col gap-2'>
          <label htmlFor='media-image' className={labelClass}>
            Bilde
          </label>
          {options.images.length === 0 ? (
            <p className='text-text-muted text-sm leading-relaxed'>
              Ingen bilder i <code>public/images/media/</code> ennå. Legg dem
              til i koden og deploy, så dukker de opp her.
            </p>
          ) : (
            <select
              id='media-image'
              value={values.imageFile}
              onChange={(e) => set('imageFile', e.target.value)}
              className={fieldClass}
            >
              <option value='' disabled>
                Velg et bilde …
              </option>
              {options.images.map((file) => (
                <option key={file} value={file}>
                  {file}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      <div className='grid gap-6 sm:grid-cols-2'>
        <div className='flex flex-col gap-2'>
          <label htmlFor='media-kind' className={labelClass}>
            Type
          </label>
          <select
            id='media-kind'
            value={values.kind}
            onChange={(e) => set('kind', e.target.value as MediaKind)}
            className={fieldClass}
          >
            {MEDIA_KIND_ORDER.map((kind) => (
              <option key={kind} value={kind}>
                {KIND_LABELS[kind]}
              </option>
            ))}
          </select>
        </div>

        <label className='text-text flex min-h-11 cursor-pointer items-center gap-3 self-end text-sm'>
          <input
            type='checkbox'
            checked={values.vertical}
            onChange={(e) => set('vertical', e.target.checked)}
            className={checkboxClass}
          />
          Portrettformat (Shorts/høye bilder)
        </label>
      </div>

      <div className='flex flex-col gap-2'>
        <label htmlFor='media-title' className={labelClass}>
          Tittel
        </label>
        <input
          id='media-title'
          value={values.title}
          onChange={(e) => {
            setTitleTouched(true);
            set('title', e.target.value);
          }}
          className={fieldClass}
          autoComplete='off'
        />
      </div>

      {values.source === 'image' ? (
        <div className='flex flex-col gap-2'>
          <label htmlFor='media-alt' className={labelClass}>
            Alt-tekst{isImageKind ? '' : ' (valgfri)'}
          </label>
          <textarea
            id='media-alt'
            value={values.alt}
            onChange={(e) => set('alt', e.target.value)}
            rows={3}
            className={`${fieldClass} h-auto py-2 leading-relaxed`}
          />
          <span className='text-text-muted font-mono text-xs'>
            Hva bildet viser. For memes: teksten i memen.
          </span>
        </div>
      ) : null}

      <div className='grid gap-6 sm:grid-cols-2'>
        <div className='flex flex-col gap-2'>
          <label htmlFor='media-season' className={labelClass}>
            Sesong
          </label>
          <select
            id='media-season'
            value={values.season ?? ''}
            onChange={(e) => changeSeason(e.target.value)}
            className={fieldClass}
          >
            <option value=''>Ingen sesong</option>
            {options.seasons.map((s) => (
              <option key={s.number} value={s.number}>
                Sesong {s.number}
              </option>
            ))}
          </select>
        </div>

        <div className='flex flex-col gap-2'>
          <label htmlFor='media-game' className={labelClass}>
            Spill
          </label>
          <select
            id='media-game'
            value={values.gameSlug ?? ''}
            onChange={(e) => set('gameSlug', e.target.value || null)}
            disabled={!season}
            className={fieldClass}
          >
            <option value=''>Ingen spill</option>
            {season?.games.map((g) => (
              <option key={g.slug} value={g.slug}>
                {g.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <fieldset className='flex flex-col gap-2'>
        <legend className={labelClass}>Spillere</legend>
        <div className='flex flex-wrap gap-x-6'>
          {pickablePlayers.map((p) => (
            <label
              key={p.slug}
              className='text-text flex min-h-11 cursor-pointer items-center gap-3 text-sm'
            >
              <input
                type='checkbox'
                checked={values.playerSlugs.includes(p.slug)}
                onChange={() => togglePlayer(p.slug)}
                className={checkboxClass}
              />
              {p.name}
            </label>
          ))}
        </div>
      </fieldset>

      <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
        <Button type='submit' disabled={isPending}>
          {isPending ? 'Lagrer …' : values.id ? 'Lagre endringer' : 'Legg til'}
        </Button>
        {values.id ? (
          <Button as='link' href='/admin/content'>
            Avbryt
          </Button>
        ) : null}
        {saved ? (
          <span className='text-text-muted font-mono text-xs' role='status'>
            Lagret. Det er live nå.
          </span>
        ) : null}
      </div>

      {error ? (
        <span className='text-text-accent font-mono text-xs' role='alert'>
          {error}
        </span>
      ) : null}
    </form>
  );
}

'use client';

import { useState } from 'react';
import {
  HEADLINE_KINDS,
  MEDIA_KIND_ORDER,
  type MediaItemView,
  type MediaKind,
} from '@/lib/media/view-models';
import { byKind } from '@/lib/media/select';
import { KIND_HEADINGS } from '@/lib/media/labels';
import { MediaGrid } from './MediaSection';
import SectionLabel from './SectionLabel';

interface Props {
  items: MediaItemView[];
  /** Newest first. */
  seasons: number[];
  /** Only players some item links to. */
  players: { slug: string; name: string }[];
}

interface Group {
  key: string;
  label: string;
  items: MediaItemView[];
}

const selectClass =
  'border-border bg-bg text-text focus-visible:outline-accent h-11 w-full border px-3 font-mono text-xs uppercase transition-colors duration-150 hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2';

/**
 * /content: the headline pieces first, then season by season (newest first),
 * then what belongs to no season. The filters run in the browser over the
 * full list: it is small, and reading searchParams would make the page
 * per-request. Every item appears once, so each tile carries its anchor.
 */
export default function MediaBrowser({ items, seasons, players }: Props) {
  const [kind, setKind] = useState<MediaKind | ''>('');
  const [season, setSeason] = useState<number | null>(null);
  const [player, setPlayer] = useState('');

  const shown = items.filter(
    (i) =>
      (!kind || i.kind === kind) &&
      (season === null || i.season === season) &&
      (!player || i.playerSlugs.includes(player)),
  );
  const isHeadline = (i: MediaItemView) => HEADLINE_KINDS.includes(i.kind);

  const groups: Group[] = [
    {
      key: 'headline',
      label: 'Fremhevet',
      items: shown
        .filter(isHeadline)
        .sort((a, b) => (b.season ?? 0) - (a.season ?? 0)),
    },
    ...seasons.map((n) => ({
      key: `s${n}`,
      label: `Sesong ${n}`,
      items: byKind(shown.filter((i) => i.season === n && !isHeadline(i))),
    })),
    {
      key: 'none',
      label: 'Sesonguavhengig',
      items: byKind(shown.filter((i) => i.season === null && !isHeadline(i))),
    },
  ].filter((group) => group.items.length > 0);

  const kinds = MEDIA_KIND_ORDER.filter((k) => items.some((i) => i.kind === k));

  return (
    <>
      <div className='grid grid-cols-1 gap-6 sm:grid-cols-3'>
        <FilterSelect
          id='filter-kind'
          label='Kategori'
          value={kind}
          onChange={(v) => setKind(v as MediaKind | '')}
          options={kinds.map((k) => ({ value: k, label: KIND_HEADINGS[k] }))}
        />
        <FilterSelect
          id='filter-season'
          label='Sesong'
          value={season === null ? '' : String(season)}
          onChange={(v) => setSeason(v ? Number(v) : null)}
          options={seasons.map((n) => ({ value: String(n), label: `S${n}` }))}
        />
        <FilterSelect
          id='filter-player'
          label='Spiller'
          value={player}
          onChange={setPlayer}
          options={players.map((p) => ({ value: p.slug, label: p.name }))}
        />
      </div>

      {groups.length === 0 ? (
        <p className='text-text-muted font-mono text-xs tracking-wide uppercase sm:tracking-widest'>
          Ingen treff
        </p>
      ) : (
        groups.map((group) => (
          <section key={group.key} className='flex flex-col gap-6'>
            <SectionLabel as='h2'>{group.label}</SectionLabel>
            <MediaGrid
              anchor
              lead={group.items.filter(
                (i) => !i.vertical && (isHeadline(i) || i.kind === 'welcome'),
              )}
              landscape={group.items.filter(
                (i) => !i.vertical && !isHeadline(i) && i.kind !== 'welcome',
              )}
              vertical={group.items.filter((i) => i.vertical)}
            />
          </section>
        ))
      )}
    </>
  );
}

function FilterSelect({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className='flex flex-col gap-3'>
      <label
        htmlFor={id}
        className='text-text-muted font-mono text-xs tracking-wide uppercase sm:tracking-widest'
      >
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={selectClass}
      >
        <option value=''>Alle</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

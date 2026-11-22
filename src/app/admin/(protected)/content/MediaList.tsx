import Link from 'next/link';
import type { MediaKind } from '@/lib/media/view-models';
import type { YoutubeStatus } from '@/lib/media/oembed';
import DeleteMediaButton from './DeleteMediaButton';
import { KIND_LABELS, STATUS_LABELS } from './labels';

export interface MediaListRow {
  id: string;
  kind: MediaKind;
  title: string;
  season: number | null;
  gameSlug: string | null;
  players: string[];
  /** The YouTube id or the image filename. */
  source: string;
  youtubeStatus: YoutubeStatus | null;
  /** Public pages drop it: its game, player or image doesn't resolve. */
  hidden: boolean;
  isToday: boolean;
}

interface Props {
  rows: MediaListRow[];
}

/** Newest first: what was just added is what gets checked. */
export default function MediaList({ rows }: Props) {
  if (rows.length === 0) {
    return (
      <p className='text-text-muted mt-4 text-sm'>Ingenting lagt inn ennå.</p>
    );
  }

  return (
    <ul className='mt-4 flex flex-col'>
      {[...rows].reverse().map((row) => {
        const meta = [
          KIND_LABELS[row.kind],
          row.season ? `S${row.season}` : null,
          row.gameSlug,
          row.players.join(', ') || null,
          row.source,
        ].filter(Boolean);
        const problem =
          row.youtubeStatus && row.youtubeStatus !== 'ok'
            ? STATUS_LABELS[row.youtubeStatus]
            : row.hidden
              ? 'Vises ikke: spill, spiller eller bildefil finnes ikke'
              : null;

        return (
          <li
            key={row.id}
            className='border-border flex items-start justify-between gap-4 border-t py-4 first:border-t-0 first:pt-0'
          >
            <div className='flex min-w-0 flex-col gap-0.5'>
              <span className='text-text text-sm font-semibold'>
                {row.title}
                {row.isToday ? (
                  <span className='text-text-accent ml-2 font-mono text-xs font-normal uppercase'>
                    På forsiden i dag
                  </span>
                ) : null}
              </span>
              <span className='text-text-muted font-mono text-xs break-all'>
                {meta.join(' · ')}
              </span>
              {problem ? (
                <span className='text-text-accent font-mono text-xs'>
                  {problem}
                </span>
              ) : null}
            </div>

            <div className='flex shrink-0 items-start gap-4'>
              <Link
                href={`/admin/content?rediger=${row.id}`}
                className='text-text-muted hover:text-text focus-visible:text-text focus-visible:outline-accent -m-2 p-2 font-mono text-xs transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2'
              >
                Rediger
              </Link>
              <DeleteMediaButton id={row.id} title={row.title} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

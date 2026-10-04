interface Row {
  label: string;
  value: string;
}

interface Props {
  seasons: number;
  games: number;
  signedInUsers: number;
  currentSeason: string;
}

/**
 * A read-only "is the data intact?" readout — a motorsport timing-sheet glance,
 * not a KPI dashboard. Four labeled rows: label left, monospace figure right,
 * hairline rules between. Figures use body color, NOT accent — "the data
 * exists" is not a status, and accent is reserved for real status/interaction.
 */
export default function DbOverview({
  seasons,
  games,
  signedInUsers,
  currentSeason,
}: Props) {
  const rows: Row[] = [
    { label: 'Sesonger', value: String(seasons) },
    { label: 'Spill', value: String(games) },
    { label: 'Brukere opprettet', value: String(signedInUsers) },
    { label: 'Gjeldende sesong', value: `Sesong ${Number(currentSeason)}` },
  ];

  return (
    <div className='border-border bg-bg border p-6 sm:p-10'>
      <p className='text-text-muted font-mono text-xs tracking-wider uppercase'>
        Database
      </p>

      <dl className='mt-4 flex flex-col'>
        {rows.map((row) => (
          <div
            key={row.label}
            className='border-border flex items-baseline justify-between gap-4 border-t py-3 first:border-t-0 first:pt-0'
          >
            <dt className='text-text-muted text-sm'>{row.label}</dt>
            <dd className='text-text font-mono text-sm tabular-nums'>
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

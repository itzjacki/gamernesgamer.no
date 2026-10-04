import Panel from '@/components/Panel';
import { StatList, StatRow } from '@/components/StatList';

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
    <Panel label='Database'>
      <StatList className='mt-4'>
        {rows.map((row) => (
          <StatRow key={row.label} label={row.label} value={row.value} />
        ))}
      </StatList>
    </Panel>
  );
}

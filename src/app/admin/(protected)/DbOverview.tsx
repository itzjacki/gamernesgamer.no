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
 * A glance that the seeded data is intact. Figures stay body colour: "the data
 * exists" is not a status, and accent is for real status.
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

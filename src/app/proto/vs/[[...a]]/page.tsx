import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import VsPicker from '../../_components/VsPicker';
import { getPickerPlayers } from '../../_components/data';
import s from '../../proto.module.css';

// PROTOTYPE — the /vs index, testing the routing Jakob proposed: `/vs` and
// `/vs/jakob` (pre-filled left side) both land here via an optional
// catch-all; `/vs/jakob/tobias` is a separate two-slug route (../[a]/[b]).
// `?a=&b=` is only the no-JS form submit, which redirects to the pair page.

export default async function ProtoVsPage({
  params,
  searchParams,
}: PageProps<'/proto/vs/[[...a]]'>) {
  const { a: path = [] } = await params;
  const query = await searchParams;
  const { players, pairs } = getPickerPlayers();

  const qa = typeof query.a === 'string' ? query.a : '';
  const qb = typeof query.b === 'string' ? query.b : '';
  if (qa && qb && pairs.includes(`${qa}|${qb}`)) {
    redirect(`/proto/vs/${qa}/${qb}`);
  }

  // Only `/vs` and `/vs/<known player>` belong here.
  const [a = ''] = path;
  if (path.length > 1 || (a && !players.some((p) => p.slug === a))) notFound();

  return (
    <>
      <div className={s.page}>
        <p className={s.note}>
          /proto/vs and /proto/vs/jakob are one route (optional catch-all);
          /proto/vs/jakob/tobias is a separate two-slug route. Try{' '}
          <Link href='/proto/vs/jakob'>/proto/vs/jakob</Link>.
        </p>
        <div style={{ marginTop: 24 }}>
          <VsPicker key={a} players={players} pairs={pairs} initialA={a} />
        </div>
      </div>
    </>
  );
}

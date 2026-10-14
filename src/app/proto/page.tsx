import Link from 'next/link';
import s from './proto.module.css';

// PROTOTYPE — index of the front-page/nav prototypes.

const ITEMS = [
  {
    href: '/proto/forside',
    title: 'Forside',
    note: 'The full front page. The panel (bottom right) switches lifecycle state (idle / countdown / live / crowned), hero variant (3D / CSS / Lysbrudd), metal and effects. Real data; demo values are labelled.',
  },
  {
    href: '/proto/vs/jakob',
    title: 'VS-velger',
    note: 'The /vs index: two selects, swap, pre-fill from a career page. Navigates to the real /vs/[a]/[b] pages. The VS key in the real header has the compact version.',
  },
];

export default function ProtoIndex() {
  return (
    <>
      <div className={s.page}>
        <h1 className={s.pageTitle}>Prototyper</h1>
        <p className={s.note}>
          Throwaway routes for the front-page and navigation round. Bracketed
          text is placeholder copy. Synthesis and open questions:{' '}
          <b>working-docs/front-page-and-nav.md</b>.
        </p>
        <ol className={s.list}>
          {ITEMS.map((item, i) => (
            <li key={item.href}>
              <Link href={item.href}>
                <span className={s.seasonNum}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span>
                  <b>{item.title}</b>
                  <span
                    className={s.note}
                    style={{ display: 'block', marginTop: 8 }}
                  >
                    {item.note}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </>
  );
}

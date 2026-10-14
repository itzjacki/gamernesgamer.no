import type { Metadata } from 'next';

// PROTOTYPE — throwaway routes for the front-page/nav refinement. Not linked
// from the site; see working-docs/front-page-and-nav.md.

export const metadata: Metadata = {
  title: 'Prototype',
  robots: { index: false, follow: false },
};

export default function ProtoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className='proto-root'>{children}</div>;
}

import type { Metadata } from 'next';
import LysbruddPreview from '../_components/LysbruddPreview';

// PROTOTYPE — the chosen front-page hero direction (Lysbrudd: Lag + Støv),
// kept for refinement. See working-docs/front-page-and-nav.md.

export const metadata: Metadata = {
  title: 'Prototype · Lysbrudd',
  robots: { index: false, follow: false },
};

export default function LysbruddPage() {
  return <LysbruddPreview />;
}

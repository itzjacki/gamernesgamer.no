import type { Metadata } from 'next';
import TrophyHeroPreview from '../_components/TrophyHeroPreview';

// PROTOTYPE — see working-docs/front-page-and-nav.md.

export const metadata: Metadata = {
  title: 'Prototype · Trofé',
  robots: { index: false, follow: false },
};

export default function TrophyHeroPage() {
  return <TrophyHeroPreview />;
}

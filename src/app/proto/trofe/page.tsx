import type { Metadata } from 'next';
import TrophyHeroPreview from '../_components/TrophyHeroPreview';

// PROTOTYPE — open work in TODO.md ("Trophy hero").

export const metadata: Metadata = {
  title: 'Prototype · Trofé',
  robots: { index: false, follow: false },
};

export default function TrophyHeroPage() {
  return <TrophyHeroPreview />;
}

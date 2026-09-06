import { redirect } from 'next/navigation';
import { currentSeason } from '@/data/sesong';

export default function HomePage() {
  redirect(`/sesong/${currentSeason}`);
}

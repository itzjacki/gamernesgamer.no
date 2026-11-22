import type { CardData } from '@/types/card';
import Checkbox from '../Checkbox';
import Card from './Card';

interface Props {
  /** One gamer's cards in a season, base card first (`gamerCards`). */
  cards: CardData[];
}

/**
 * A gamer's card, with a switch to their MESTER card when they won the
 * season. Server-rendered: CSS swaps the two on the checkbox's `:checked`.
 */
export default function GamerCards({ cards }: Props) {
  const [base, special] = cards;
  if (!base) return null;
  if (!special) return <Card card={base} />;

  return (
    <div className='group/mester flex flex-col items-center gap-3'>
      <div className='group-has-[input:checked]/mester:hidden'>
        <Card card={base} />
      </div>
      <div className='hidden group-has-[input:checked]/mester:block'>
        <Card card={special} />
      </div>
      <Checkbox>Vinnerkort</Checkbox>
    </div>
  );
}

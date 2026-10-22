import Heading from './Heading';

/**
 * Beside the trophy in the dormant state (under it on phones), so most of
 * the year: the name, large, straight on the scene (design.md, "On the
 * hero"). No box, no other text. It is the page's visible h1 in this state,
 * so the page drops its sr-only one. "Gamernes / Gamer" on two lines from
 * 701px; on phones it wraps where it must.
 */
export default function GgIntro() {
  return (
    <Heading as='h1'>
      <span className='min-[701px]:block'>Gamernes</span> Gamer
    </Heading>
  );
}

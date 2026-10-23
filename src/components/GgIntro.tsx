import Heading from './Heading';

/** The visible h1 in the dormant state; the page drops its sr-only one. */
export default function GgIntro() {
  return (
    <Heading as='h1'>
      <span className='min-[701px]:block'>Gamernes</span> Gamer
    </Heading>
  );
}

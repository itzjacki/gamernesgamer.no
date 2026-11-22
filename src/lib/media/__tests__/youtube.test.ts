import { describe, expect, it } from 'vitest';
import { parseYoutubeId } from '../youtube';

const ID = 'p-JmssuWe08';

describe('parseYoutubeId', () => {
  it.each([
    ID,
    `https://www.youtube.com/watch?v=${ID}`,
    `https://www.youtube.com/watch?v=${ID}&t=42s&list=PL123&si=abc`,
    `https://www.youtube.com/watch?feature=share&v=${ID}`,
    `youtube.com/watch?v=${ID}`,
    `https://m.youtube.com/watch?v=${ID}`,
    `https://music.youtube.com/watch?v=${ID}`,
    `https://youtu.be/${ID}`,
    `https://youtu.be/${ID}?si=gbioTwQtvy1ygeO7`,
    `https://www.youtube.com/embed/${ID}?si=gbioTwQtvy1ygeO7`,
    `https://www.youtube-nocookie.com/embed/${ID}`,
    `https://www.youtube.com/live/${ID}?feature=shared`,
    `  https://youtu.be/${ID}  `,
  ])('reads the id from %s', (input) => {
    expect(parseYoutubeId(input)).toEqual({ id: ID, isShort: false });
  });

  it('flags a Shorts link', () => {
    expect(parseYoutubeId(`https://www.youtube.com/shorts/${ID}`)).toEqual({
      id: ID,
      isShort: true,
    });
    expect(
      parseYoutubeId(`https://youtube.com/shorts/${ID}?si=xyz`)?.isShort,
    ).toBe(true);
  });

  it.each([
    '',
    'hello world',
    'p-JmssuWe0',
    'p-JmssuWe08x',
    'https://www.youtube.com/@GamernesGamer',
    'https://www.youtube.com/watch?v=short',
    'https://www.youtube.com/playlist?list=PL123',
    `https://vimeo.com/${ID}`,
    `https://example.com/watch?v=${ID}`,
    `https://notyoutube.com/embed/${ID}`,
  ])('rejects %s', (input) => {
    expect(parseYoutubeId(input)).toBeNull();
  });
});

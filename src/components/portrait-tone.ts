/**
 * Portraits are greyscale at rest, so photos from different seasons read as
 * one set (design.md, Portraits). Champion pictures have their own tone
 * (`CHAMPION_TONE`).
 */
export const PORTRAIT_TONE = 'brightness-90 contrast-125 grayscale';

/**
 * A portrait inside a `group`: its own colour returns on hover/focus. No
 * duration: add one (the pair hero matches its 150ms name field).
 */
export const PORTRAIT_TONE_HOVER =
  'brightness-90 contrast-125 grayscale transition group-hover:brightness-100 group-hover:contrast-100 group-hover:grayscale-0 group-focus-visible:brightness-100 group-focus-visible:contrast-100 group-focus-visible:grayscale-0 motion-reduce:transition-none';

/** A portrait inside a `group` link. */
export const PORTRAIT_TONE_LINK = `${PORTRAIT_TONE_HOVER} duration-300`;

/**
 * Dagens content's thumbnail, set on its frame: greyscale and dimmed at rest so
 * it doesn't outshout the front page, full colour on hover/focus so it still
 * invites the click.
 */
export const MUTED_THUMB_TONE =
  '[&_img]:brightness-75 [&_img]:grayscale [&_img]:transition [&_img]:duration-300 hover:[&_img]:brightness-100 hover:[&_img]:grayscale-0 focus-within:[&_img]:brightness-100 focus-within:[&_img]:grayscale-0 motion-reduce:[&_img]:transition-none';

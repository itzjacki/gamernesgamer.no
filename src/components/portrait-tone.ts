/**
 * Portraits are greyscale at rest, so photos from different seasons read as
 * one set (design.md, Portraits). Champion pictures have their own tone
 * (`CHAMPION_TONE`).
 */
export const PORTRAIT_TONE = 'brightness-90 contrast-125 grayscale';

/** A portrait inside a `group` link: its own colour returns on hover/focus. */
export const PORTRAIT_TONE_LINK =
  'brightness-90 contrast-125 grayscale transition duration-300 group-hover:brightness-100 group-hover:contrast-100 group-hover:grayscale-0 group-focus-visible:brightness-100 group-focus-visible:contrast-100 group-focus-visible:grayscale-0 motion-reduce:transition-none';

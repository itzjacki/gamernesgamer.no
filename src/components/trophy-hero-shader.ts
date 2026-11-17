/*
 * The trophy hero's shaders (WebGL 1). One fragment shader draws the whole
 * scene: god rays from a light behind the trophy (marched over a mask of its
 * silhouette), the page grid as the back wall in register with the site
 * grid, a perspective floor below the trophy's foot, dust in the beams and,
 * while live, two spotlight flashes. The mask's red channel is the trophy,
 * green the countdown numerals standing in front of it: lit solids that
 * throw a red glow onto the trophy behind them. Coordinates named `css` are
 * page-grid
 * css px (offset by +40000 so mod() never sees negatives).
 */

export const VS = `attribute vec2 p; varying vec2 uv; void main(){ uv = p * .5 + .5; gl_Position = vec4(p, 0., 1.); }`;

export const FS = `#extension GL_OES_standard_derivatives : enable
  precision highp float;
  varying vec2 uv;
  uniform sampler2D mask; uniform vec2 res; uniform float dpr; uniform vec2 origin;
  uniform vec2 light; uniform float power; uniform vec3 tint; uniform float t;
  uniform float dust; uniform float drift;
  uniform vec2 centre; // css px: the trophy's centre, the floor's vanishing point
  uniform float fold;  // css px: where the wall folds into the floor (the trophy's foot)
  uniform float bottom; // css px: the canvas's bottom edge
  uniform vec3 flashA; uniform vec3 flashB; // live's flashes: uv position, strength
  uniform vec2 aimA; uniform vec2 aimB;     // where each flash points (uv)
  uniform float sides; // 1: fade the light at the side edges too; 0 (phones): top and bottom only

  const vec3 BG = vec3(23., 24., 26.) / 255.;      // --color-bg
  const vec3 GRIDC = vec3(232., 216., 216.) / 255.;
  const vec3 TEXT = vec3(230., 225., 219.) / 255.;  // --color-text
  const float CORNER = 0.35; // the light mask's corner radius, canvas heights

  // Anything solid (trophy or numerals): blocks the light.
  float m(vec2 q){ vec4 k = texture2D(mask, q); return max(k.r, k.g); }
  float numeral(vec2 q){ return texture2D(mask, q).g; }

  // The numerals' glow on the trophy behind them: their shape blurred over
  // two rings (6 and 14 css px), shifted a little down, away from the light
  // above.
  float halo(){
    vec2 px = dpr / res;
    vec2 q = uv + vec2(0.0, 4.0) * px;
    float acc = 0.0;
    for (int i = 0; i < 12; i++) {
      float a = float(i) * 0.5236;
      vec2 d = vec2(cos(a), sin(a)) * px;
      acc += numeral(q + d * 6.0) + numeral(q + d * 14.0) * 0.6;
    }
    return acc / 19.2;
  }
  // No sin(): the cell ids are large (the +40000 grid offset), where a
  // sin-based hash loses precision and lines the motes up diagonally.
  float hash(vec2 p){
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  // Fades the light in from the canvas edges, measured to a rounded
  // rectangle (in canvas-height units) so the lit area's corners are round
  // and the light never ends in a seam. Phones fade only top and bottom:
  // the stage is full-bleed there, so the light runs edge to edge.
  float edgeFade(){
    vec2 extent = vec2(res.x / res.y, 1.0) * 0.5;
    vec2 rc = abs((uv - 0.5) * vec2(res.x / res.y, 1.0)) - extent + CORNER;
    float inset = -(length(max(rc, 0.0)) + min(max(rc.x, rc.y), 0.0) - CORNER);
    float vertical = min(uv.y, 1.0 - uv.y);
    return smoothstep(0.0, 0.18, mix(vertical, inset, sides));
  }

  // God rays from the main light behind the trophy.
  float march(){
    vec2 d = light - uv;
    float acc = 0.0, w = 1.0;
    vec2 q = uv;
    for (int i = 0; i < 72; i++) {
      q += d / 72.0;
      acc += (1.0 - m(q)) * exp(-length((q - light) * vec2(res.x / res.y, 1.0)) * 8.0) * w;
      w *= 0.985;
    }
    return acc / 72.0 * power * 16.0;
  }

  // A flash: a spotlight from f.xy toward aim, lighting only a narrow cone
  // (the trophy still shadows it). Fewer samples than the main light, since
  // it is brief.
  float flashRays(vec3 f, vec2 aim){
    vec2 asp = vec2(res.x / res.y, 1.0);
    vec2 dir = normalize((aim - f.xy) * asp);
    vec2 to = (uv - f.xy) * asp;
    float along = dot(to, dir);
    if (along <= 0.0) return 0.0;
    float across = abs(to.x * dir.y - to.y * dir.x);
    // 40 css px wide at the source, widening at the same angle as before;
    // a wide soft edge between inner and outer.
    float base = 20.0 * dpr / res.y;
    float cone = 1.0 - smoothstep(base * 0.6 + along * 0.1, base * 1.4 + along * 0.21, across);
    if (cone <= 0.0) return 0.0;
    vec2 d = f.xy - uv;
    float acc = 0.0, w = 1.0;
    vec2 q = uv;
    for (int i = 0; i < 24; i++) {
      q += d / 24.0;
      // A gentler falloff than the main light's, so the beam carries down.
      acc += (1.0 - m(q)) * exp(-length((q - f.xy) * asp) * 2.5) * w;
      w *= 0.955;
    }
    return acc / 24.0 * f.z * 4.0 * cone;
  }

  // A grid line \`px\` screen pixels wide in a scaled coordinate system:
  // fwidth converts it to that system's units.
  float gridLine(float v, float px){
    return mod(v, 40.0) < max(fwidth(v), 1e-4) * px ? 1.0 : 0.0;
  }

  float motes(vec2 css, float cell, float speed, float seed){
    vec2 q = css + vec2(sin(t * 0.25 + seed) * 6.0, t * speed * drift);
    vec2 id = floor(q / cell);
    float h = hash(id + seed);
    if (h > 0.07) return 0.0;
    vec2 c = id * cell + 1.0 + vec2(hash(id + vec2(3.1, 17.3)), hash(id + vec2(41.7, 7.7))) * (cell - 2.0);
    vec2 d = abs(q - c);
    float twinkle = 0.55 + 0.45 * sin(t * (0.7 + h * 4.0) + h * 40.0);
    return (max(d.x, d.y) < 0.9) ? twinkle : 0.0;
  }

  void main(){
    float rays = march();
    if (flashA.z > 0.001) rays += flashRays(flashA, aimA);
    if (flashB.z > 0.001) rays += flashRays(flashB, aimB);
    rays *= edgeFade();
    vec2 css = vec2(gl_FragCoord.x, res.y - gl_FragCoord.y) / dpr + origin;
    vec2 g = mod(css, 40.0);
    float onGrid = (g.x < 1.0 || g.y < 1.0) ? 1.0 : 0.0;
    float inside = m(uv);
    float trophy = texture2D(mask, uv).r;
    float num = numeral(uv);
    vec2 px = dpr / res;
    float rim = clamp(inside - m(uv + normalize(light - uv) * px * 2.0), 0.0, 1.0);
    float haze = min(rays, 1.2);

    vec3 col;
    col = BG + tint * haze * 0.075;
    if (css.y < fold) {
      // The light lifts the lines only slightly: they stay one quiet colour.
      col = mix(col, GRIDC, onGrid * clamp(0.04 + rays * 0.04, 0.0, 0.07));
    } else {
      // A perspective grid can never meet the flat page grid, so the floor
      // runs to the stage's edge and is closed off below it (see the JSX).
      // s is 1 at the fold and falls toward the bottom.
      vec2 vp = centre;
      float s = (fold - vp.y) / (css.y - vp.y);
      float fx = vp.x + (css.x - vp.x) * s;
      float fz = (fold - vp.y) * (1.0 - s);
      float fl = max(gridLine(fx + 40000.0, 1.0), gridLine(fz + 40000.0, 1.0));
      float pool = exp(-length(vec2(fx - centre.x, fz * 2.2)) / 260.0);
      vec3 lit = mix(GRIDC, tint, 0.35);
      // The red light fades out before the bottom edge, so its pool stays
      // round instead of being cut square by the closing line.
      float depth = (css.y - fold) / max(bottom - fold, 1.0);
      float edge = 1.0 - smoothstep(0.55, 1.0, depth);
      col += tint * pool * edge * power * 0.062;
      col = mix(col, lit, fl * edge * clamp(0.05 + pool * power * 0.06, 0.0, 0.1));
      // The lines themselves (neutral, not lit) firm up toward the bottom to
      // the closing line's strength, so they meet it instead of fading.
      col = mix(col, GRIDC, fl * smoothstep(0.35, 1.0, depth) * 0.07);
    }

    col = mix(col, vec3(0.055, 0.058, 0.062), trophy);
    // The numerals: text-coloured faces in front of the trophy, which takes
    // their red glow (it breathes with the light).
    if (trophy > 0.0) col += tint * halo() * trophy * (1.0 - num) * (0.12 + power * 0.3);
    vec3 face = TEXT * (0.86 + 0.14 * clamp(haze, 0.0, 1.0));
    col = mix(col, face, num);
    col += tint * rim * (0.08 + power * 0.45);
    // Their own rim on the side facing the light: over the trophy the
    // silhouette rim above never reaches them.
    float numRim = clamp(num - numeral(uv + normalize(light - uv) * px * 2.0), 0.0, 1.0);
    col += tint * numRim * (0.08 + power * 0.45);

    if (dust > 0.0 && inside < 0.5) {
      float lit = clamp(rays * rays * 0.5, 0.0, 1.0);
      float d1 = motes(css, 9.0, 4.0, 0.0);
      float d2 = motes(css, 15.0, 7.5, 11.0) * 1.3;
      col += tint * (d1 * 0.35 + d2 * 0.5) * lit * dust;
    }

    col += (fract(sin(dot(gl_FragCoord.xy + t, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * 0.014;
    gl_FragColor = vec4(col, 1.0);
  }`;

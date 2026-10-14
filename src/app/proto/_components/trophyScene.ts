/*
 * PROTOTYPE — the 3D trophy for the front-page exploration (see
 * working-docs/front-page-and-nav.md). Imperative three.js, imported lazily
 * from TrophyStage so three never lands in any other route's bundle.
 *
 * The real trophy.svg is extruded: path 0 = wreath + controller, path 1 = a
 * near-duplicate (skipped), path 2 = plinth with a hole, path 3 = plaque. The
 * plaque face carries a canvas texture engraved with the season winners.
 */
import * as THREE from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export type Mode = 'idle' | 'countdown' | 'live' | 'crowned';
export type Metal = 'gold' | 'steel' | 'graphite';
/** How the rendered frame reaches the screen: as-is, or as a halftone. */
export type Output = 'shaded' | 'dots' | 'lines';

export interface Fx {
  bloom: boolean;
  grain: boolean;
  rim: boolean;
}

export interface TrophySceneOptions {
  canvas: HTMLCanvasElement;
  /** The element the canvas fills; its size drives the renderer. */
  stage: HTMLElement;
  /** The site's grid layer, so the canvas can paint the grid behind the trophy in register. */
  grid: HTMLElement | null;
  /** The accent diagonal; the intro sends a "signal light" down it. */
  diagonal: SVGLineElement | null;
  /** Season winners in season order — one engraved plate each. */
  winners: string[];
  /** The demo name engraved in the "crowned" state. */
  newWinner: string;
  /**
   * A scanned/modelled trophy (GLB) to use instead of extruding trophy.svg.
   * Its own materials are kept (the metal switch only affects the extrusion);
   * the engraved plaque is laid on as a plate on the front of the base.
   */
  modelUrl: string | null;
  /** When true the camera frames the trophy right of the copy (desktop). */
  offsetRight: () => boolean;
}

export interface TrophyScene {
  setMode(mode: Mode): void;
  setMetal(metal: Metal): void;
  setFx(fx: Fx): void;
  setOutput(output: Output): void;
  replay(): void;
  dispose(): void;
}

const ACCENT = new THREE.Color('#e8334a');
const METALS: Record<Metal, { color: THREE.Color; roughness: number }> = {
  gold: { color: new THREE.Color().setRGB(1.0, 0.76, 0.33), roughness: 0.2 },
  steel: { color: new THREE.Color().setRGB(0.86, 0.87, 0.9), roughness: 0.16 },
  graphite: {
    color: new THREE.Color().setRGB(0.16, 0.165, 0.18),
    roughness: 0.32,
  },
};

const ease = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);

export async function createTrophyScene(
  opts: TrophySceneOptions,
): Promise<TrophyScene> {
  const { canvas, stage } = opts;
  const state = {
    mode: 'idle' as Mode,
    metal: 'gold' as Metal,
    fx: { bloom: true, grain: true, rim: true } as Fx,
  };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------------- Renderer ----------------
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    premultipliedAlpha: false,
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(26, 1, 10, 20000);

  // Studio environment: softboxes for the metal to reflect. Without them gold reads as dull bronze.
  function studioEnv(withRed: boolean) {
    const env = new THREE.Scene();
    env.background = new THREE.Color(0x030303);
    const box = (
      w: number,
      h: number,
      color: number,
      k: number,
      pos: [number, number, number],
    ) => {
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(w, h),
        new THREE.MeshBasicMaterial({
          color: new THREE.Color(color).multiplyScalar(k),
          side: THREE.DoubleSide,
        }),
      );
      m.position.set(...pos);
      m.lookAt(0, 0, 0);
      env.add(m);
    };
    box(6, 2, 0xffffff, 5, [0, 6, 2]); // overhead key
    box(1, 8, 0xfff3e6, 3.5, [-6, 1, 3]); // left strip
    box(1, 8, 0xe6efff, 2.0, [6, 1, 3]); // right strip
    box(14, 1.2, 0xffffff, 0.25, [0, -3, 4]); // floor bounce
    box(5, 3.5, 0xfff6ea, 1.6, [1.5, 1.2, 7]); // broad frontal softbox (flat faces)
    box(0.6, 6, 0xffffff, 2.5, [-2.5, 0, 6.5]); // thin front strip (crisp highlight)
    if (withRed) box(1.2, 8, 0xe8334a, 1.4, [-3, 1, -6]); // accent strip behind
    const pm = new THREE.PMREMGenerator(renderer);
    const tex = pm.fromScene(env, 0.015).texture;
    pm.dispose();
    return tex;
  }
  const envRed = studioEnv(true);
  const envPlain = studioEnv(false);
  scene.environment = envRed;

  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(700, 1200, 1400);
  scene.add(key);
  const rim = new THREE.DirectionalLight(ACCENT, 2.5);
  rim.position.set(-900, 400, -900);
  scene.add(rim);
  const glint = new THREE.PointLight(0xffffff, 0, 2600, 1.2);
  glint.position.set(-1200, 300, 600);
  scene.add(glint);

  // ---------------- Materials ----------------
  const trophyMat = new THREE.MeshPhysicalMaterial({
    metalness: 1,
    clearcoat: 0.4,
    clearcoatRoughness: 0.2,
  });
  const plinthMat = new THREE.MeshPhysicalMaterial({
    color: 0x0f1012,
    metalness: 0.6,
    roughness: 0.42,
    clearcoat: 0.6,
    clearcoatRoughness: 0.35,
  });

  const plaqueCanvas = document.createElement('canvas');
  plaqueCanvas.width = 2048;
  plaqueCanvas.height = Math.round(2048 * (98 / 383));
  const pctx = plaqueCanvas.getContext('2d')!;
  const plaqueTex = new THREE.CanvasTexture(plaqueCanvas);
  plaqueTex.colorSpace = THREE.SRGBColorSpace;
  plaqueTex.anisotropy = 8;
  // Extrude cap UVs are raw SVG coordinates (y down). Map the plinth's visible
  // window (x 282–665, y 865–963) to 0–1, top-down, so the canvas lands upright.
  plaqueTex.flipY = false;
  plaqueTex.repeat.set(1 / 383, 1 / 98);
  plaqueTex.offset.set(-282 / 383, -865 / 98);
  const plaqueFace = new THREE.MeshPhysicalMaterial({
    map: plaqueTex,
    metalness: 0.75,
    roughness: 0.42,
    clearcoat: 0.3,
  });
  const plaqueSide = new THREE.MeshPhysicalMaterial({
    metalness: 1,
    roughness: 0.3,
  });

  let engrave = { names: [...opts.winners], newIdx: -1, progress: 1 };
  // Brushed-metal streaks, fixed per scene so redraws don't shimmer.
  const streaks = Array.from({ length: 900 }, () => ({
    y: Math.random(),
    light: Math.random() > 0.5,
  }));

  function drawPlaque() {
    const W = plaqueCanvas.width;
    const H = plaqueCanvas.height;
    pctx.fillStyle = '#' + METALS[state.metal].color.getHexString();
    pctx.fillRect(0, 0, W, H);
    pctx.globalAlpha = 0.06;
    for (const s of streaks) {
      pctx.fillStyle = s.light ? '#fff' : '#000';
      pctx.fillRect(0, s.y * H, W, 1);
    }
    pctx.globalAlpha = 1;
    // 3 × 2 plates; empty ones wait for future winners.
    const cols = 3;
    const rows = 2;
    const pad = 24;
    const cw = (W - pad * 2) / cols;
    const ch = (H - pad * 2) / rows;
    pctx.textBaseline = 'middle';
    const ink =
      state.metal === 'graphite' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.78)';
    for (let i = 0; i < cols * rows; i++) {
      const x = pad + (i % cols) * cw;
      const y = pad + Math.floor(i / cols) * ch;
      pctx.strokeStyle =
        state.metal === 'graphite'
          ? 'rgba(255,255,255,0.25)'
          : 'rgba(0,0,0,0.55)';
      pctx.lineWidth = 4;
      pctx.strokeRect(x + 12, y + 12, cw - 24, ch - 24);
      pctx.fillStyle = ink;
      pctx.font = '400 44px "Martian Mono", monospace';
      pctx.fillText(String(i + 1).padStart(2, '0'), x + 36, y + ch / 2);
      const name = engrave.names[i];
      if (!name) continue;
      pctx.font = '800 92px "Neue Montreal", sans-serif';
      const text = name.toUpperCase();
      const tx = x + 128;
      if (i === engrave.newIdx && engrave.progress < 1) {
        const full = pctx.measureText(text).width;
        pctx.save();
        pctx.beginPath();
        pctx.rect(tx, y, full * engrave.progress, ch);
        pctx.clip();
        pctx.fillText(text, tx, y + ch / 2 + 6);
        pctx.restore();
        pctx.fillStyle = '#ff5a6e'; // laser head
        pctx.fillRect(tx + full * engrave.progress - 3, y + 30, 6, ch - 60);
      } else {
        pctx.fillText(text, tx, y + ch / 2 + 6);
      }
    }
    plaqueTex.needsUpdate = true;
  }

  function applyMetal() {
    const m = METALS[state.metal];
    trophyMat.color.copy(m.color);
    trophyMat.roughness = m.roughness;
    plaqueSide.color.copy(m.color);
    drawPlaque();
  }

  // ---------------- Geometry: a scanned GLB when present, else the extruded trophy.svg ----------------
  const trophy = new THREE.Group();
  const pivot = new THREE.Group();
  pivot.add(trophy);
  scene.add(pivot);
  let plaqueMesh: THREE.Object3D;
  let size: THREE.Vector3;

  if (opts.modelUrl) {
    const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
    const gltf = await new GLTFLoader().loadAsync(opts.modelUrl);
    const model = gltf.scene;
    // Normalise to the extrusion's scale (1080 units tall) and centre it.
    const raw = new THREE.Box3().setFromObject(model);
    const k = 1080 / raw.getSize(new THREE.Vector3()).y;
    model.scale.setScalar(k);
    trophy.add(model);
    const box = new THREE.Box3().setFromObject(pivot);
    trophy.position.sub(box.getCenter(new THREE.Vector3()));
    size = box.getSize(new THREE.Vector3());
    // The engraved plate, on the front of the base. Calibrate PLATE_* to the scan.
    const PLATE_Y = -0.36; // fraction of height from centre
    const PLATE_W = 0.42; // fraction of width
    plaqueTex.flipY = true;
    plaqueTex.repeat.set(1, 1);
    plaqueTex.offset.set(0, 0);
    const w = size.x * PLATE_W;
    const plate = new THREE.Mesh(
      new THREE.PlaneGeometry(w, w * (98 / 383)),
      plaqueFace,
    );
    plate.position.set(0, size.y * PLATE_Y, size.z / 2 + 2);
    pivot.add(plate);
    plaqueMesh = plate;
  } else {
    const data = new SVGLoader().parse(
      await (await fetch('/images/branding/trophy.svg')).text(),
    );
    const parts = [
      {
        i: 0,
        depth: 70,
        z: 0,
        mats: [trophyMat, trophyMat],
        bevel: [16, 7, 6],
      },
      {
        i: 2,
        depth: 190,
        z: -10,
        mats: [plinthMat, plinthMat],
        bevel: [6, 4, 3],
      },
      {
        i: 3,
        depth: 150,
        z: -2,
        mats: [plaqueFace, plaqueSide],
        bevel: [3, 2, 2],
      },
    ];
    for (const p of parts) {
      const geo = new THREE.ExtrudeGeometry(
        SVGLoader.createShapes(data.paths[p.i]),
        {
          depth: p.depth,
          bevelEnabled: true,
          bevelThickness: p.bevel[0],
          bevelSize: p.bevel[1],
          bevelSegments: p.bevel[2],
          curveSegments: 16,
        },
      );
      geo.translate(0, 0, p.z - p.depth / 2);
      geo.computeVertexNormals();
      trophy.add(new THREE.Mesh(geo, p.mats));
    }
    // SVG y points down. Rotate (never mirror) so face winding and normals stay correct.
    trophy.rotation.x = Math.PI;
    const box = new THREE.Box3().setFromObject(pivot);
    trophy.position.sub(box.getCenter(new THREE.Vector3()));
    size = box.getSize(new THREE.Vector3());
    plaqueMesh = trophy.children[2];
  }
  const camBase = new THREE.Vector3();
  const lookAt = new THREE.Vector3();

  // ---------------- Sparks (crowned only) ----------------
  const SPARKS = 420;
  const sparkGeo = new THREE.BufferGeometry();
  const sp = new Float32Array(SPARKS * 3);
  const sv = new Float32Array(SPARKS * 3);
  const sc = new Float32Array(SPARKS * 3);
  sparkGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  sparkGeo.setAttribute('color', new THREE.BufferAttribute(sc, 3));
  const sparkMat = new THREE.PointsMaterial({
    size: 9,
    vertexColors: true,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  scene.add(new THREE.Points(sparkGeo, sparkMat));
  let sparkT = -1;
  function fireSparks() {
    for (let i = 0; i < SPARKS; i++) {
      sp.set([(Math.random() - 0.5) * 120, size.y * 0.32, 60], i * 3);
      const a = Math.random() * Math.PI * 2;
      const s = 300 + Math.random() * 900;
      sv.set(
        [
          Math.cos(a) * s * 0.9,
          500 + Math.random() * 1100,
          Math.sin(a) * s * 0.5,
        ],
        i * 3,
      );
      const c = Math.random() > 0.35 ? new THREE.Color(1, 0.85, 0.6) : ACCENT;
      sc.set([c.r * 3, c.g * 3, c.b * 3], i * 3);
    }
    sparkGeo.attributes.color.needsUpdate = true;
    sparkT = 0;
  }

  // ---------------- Post: specular-only bloom, then grid + grain ----------------
  const composer = new EffectComposer(
    renderer,
    new THREE.WebGLRenderTarget(1, 1, {
      type: THREE.HalfFloatType,
      samples: 4,
    }),
  );
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.38, 0.5, 0.92);
  composer.addPass(bloom);
  // Bloom normally writes alpha = 1 everywhere; keep the scene's alpha so the
  // trophy can be composited onto the page background below.
  Object.assign(bloom.blendMaterial, {
    blending: THREE.CustomBlending,
    blendSrc: THREE.OneFactor,
    blendDst: THREE.OneFactor,
    blendSrcAlpha: THREE.ZeroFactor,
    blendDstAlpha: THREE.OneFactor,
  });
  composer.addPass(new OutputPass());
  // After tone mapping: paint the page bg and the 40px grid (in register with
  // the site grid) behind the trophy, plus a little film grain on the object.
  const finish = new ShaderPass({
    uniforms: {
      tDiffuse: { value: null },
      uTime: { value: 0 },
      uGrain: { value: 0.03 },
      uOrigin: { value: new THREE.Vector2() },
      uDpr: { value: 1 },
      uH: { value: 1 },
      uW: { value: 1 },
      uOut: { value: 0 },
    },
    vertexShader: /* glsl */ `varying vec2 vUv;
      void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
    fragmentShader: /* glsl */ `uniform sampler2D tDiffuse; uniform float uTime; uniform float uGrain;
      uniform vec2 uOrigin; uniform float uDpr; uniform float uH; uniform float uW; uniform int uOut;
      varying vec2 vUv;
      const vec3 TEXT = vec3(230., 225., 219.) / 255.;
      float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      vec2 toUv(vec2 c){ return vec2((c.x - uOrigin.x) * uDpr / uW, 1. - (c.y - uOrigin.y) * uDpr / uH); }
      void main(){
        vec2 css = vec2(gl_FragCoord.x, uH - gl_FragCoord.y) / uDpr + uOrigin;
        vec2 g = mod(css, 40.);
        float line = (g.x < 1. || g.y < 1.) ? 1. : 0.;
        vec3 bg = mix(vec3(23., 24., 26.) / 255., vec3(232., 216., 216.) / 255., 0.04 * line);
        if (uOut == 0) {
          vec4 c = texture2D(tDiffuse, vUv);
          vec3 col = c.rgb + bg * (1. - c.a);
          col += (h(vUv * 1000. + uTime) - .5) * uGrain * c.a;
          gl_FragColor = vec4(col, 1.);
          return;
        }
        // Halftone: sample the frame once per 5px cell (dots) or row (lines),
        // grid-aligned; mark size carries brightness, colour keeps the hue.
        vec2 at = uOut == 1 ? floor(css / 5.) * 5. + 2.5 : vec2(css.x, floor(css.y / 5.) * 5. + 2.5);
        vec4 c = texture2D(tDiffuse, toUv(at));
        float L = clamp(dot(c.rgb, vec3(0.2126, 0.7152, 0.0722)) * 1.25, 0., 1.) * c.a;
        float peak = max(max(c.r, c.g), c.b);
        vec3 ink = mix(TEXT, c.rgb / max(peak, 1e-3), 0.5);
        bool on;
        if (uOut == 1) {
          vec2 d = abs(mod(css, 5.) - 2.5);
          float hs = 2.5 * sqrt(L);
          on = d.x < hs && d.y < hs;
        } else {
          on = abs(mod(css.y, 5.) - 2.5) < 2.5 * L;
        }
        gl_FragColor = vec4(on && L > 0.04 ? ink : bg, 1.);
      }`,
  });
  composer.addPass(finish);

  function syncGrid() {
    const r = canvas.getBoundingClientRect();
    const g = (opts.grid ?? document.body).getBoundingClientRect();
    // The site grid's lines sit at (w/2 + 20) + k·40 from its box, both axes.
    finish.uniforms.uOrigin.value.set(
      r.left - g.left - (g.width / 2 + 20) + 40000,
      r.top - g.top - (g.height / 2 + 20) + 40000,
    );
    finish.uniforms.uDpr.value = renderer.getPixelRatio();
    finish.uniforms.uH.value = canvas.height;
    finish.uniforms.uW.value = canvas.width;
  }

  function resize() {
    const r = stage.getBoundingClientRect();
    const w = Math.max(1, r.width);
    const h = Math.max(1, r.height);
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    bloom.setSize(w, h);
    camera.aspect = w / h;
    // The canvas spans the whole hero so nothing clips; shift the framing so
    // the trophy sits right of the copy on desktop.
    const right = opts.offsetRight();
    camera.setViewOffset(w, h, right ? -w * 0.2 : 0, 0, w, h);
    const effW = right ? w * 0.55 : w;
    const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const dist = Math.max(
      (size.y * 1.32) / 2 / tan,
      (size.x * 1.25) / 2 / tan / (effW / h),
    );
    camBase.set(0, size.y * 0.04, dist);
    camera.position.copy(camBase);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    syncGrid();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(stage);
  if (opts.grid) ro.observe(opts.grid);
  addEventListener('scroll', syncGrid, { passive: true });
  resize();

  // ---------------- Motion ----------------
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  const onPointer = (e: PointerEvent) => {
    pointer.tx = (e.clientX / innerWidth) * 2 - 1;
    pointer.ty = (e.clientY / innerHeight) * 2 - 1;
  };
  addEventListener('pointermove', onPointer);

  let introT = 0;
  let simT = 0;
  function replay() {
    introT = 0;
    engrave =
      state.mode === 'crowned'
        ? {
            names: [...opts.winners, opts.newWinner],
            newIdx: opts.winners.length,
            progress: 0,
          }
        : { names: [...opts.winners], newIdx: -1, progress: 1 };
    drawPlaque();
    const line = opts.diagonal;
    if (line && !reduce) {
      // Signal light: one short dash travelling down the diagonal.
      line.style.strokeDasharray = '6 2000';
      line
        .animate([{ strokeDashoffset: 0 }, { strokeDashoffset: -1000 }], {
          duration: 1100,
          easing: 'cubic-bezier(.6,0,.4,1)',
        })
        .finished.then(() => (line.style.strokeDasharray = ''))
        .catch(() => {});
    }
  }

  const clock = new THREE.Clock();
  const plaqueCenter = new THREE.Vector3();
  const dollyTo = new THREE.Vector3();
  const origin = new THREE.Vector3();
  let raf = 0;
  let visible = true;

  function step(dt: number) {
    introT += dt;
    simT += dt;
    pointer.x += (pointer.tx - pointer.x) * 0.06;
    pointer.y += (pointer.ty - pointer.y) * 0.06;

    // Intro: swing in from the side and settle at a 3/4 pose; then breathe + pointer tilt.
    const settle = reduce ? 1 : ease(introT / 2.6);
    const rest = state.mode === 'crowned' ? 0 : -0.32;
    const breathe = reduce ? 0 : Math.sin(simT * 0.4) * 0.07 * settle;
    pivot.rotation.y =
      THREE.MathUtils.lerp(-1.3, rest, settle) +
      breathe +
      (reduce ? 0 : pointer.x * 0.35);
    pivot.rotation.x = reduce ? 0 : pointer.y * 0.1;

    // Glint: a white light sweeps across once the signal light lands.
    const g = (introT - 1.0) / 1.0;
    glint.intensity =
      g > 0 && g < 1 && !reduce ? Math.sin(g * Math.PI) * 9e5 : 0;
    glint.position.x = THREE.MathUtils.lerp(
      -1400,
      1400,
      Math.min(1, Math.max(0, g)),
    );

    const cd = state.mode === 'countdown';
    key.intensity = THREE.MathUtils.lerp(key.intensity, cd ? 0.35 : 1.6, 0.05);
    const pulse = cd ? 0.6 + 0.6 * Math.sin(simT * 1.6) : 0;
    rim.intensity = THREE.MathUtils.lerp(
      rim.intensity,
      !state.fx.rim ? 0 : cd ? pulse : state.mode === 'crowned' ? 5 : 2.5,
      0.08,
    );
    scene.environment = state.fx.rim && !cd ? envRed : envPlain;
    renderer.toneMappingExposure = THREE.MathUtils.lerp(
      renderer.toneMappingExposure,
      cd ? 0.45 : 1,
      0.05,
    );

    // Crowned: engrave the new name, then sparks.
    if (
      engrave.newIdx >= 0 &&
      engrave.progress < 1 &&
      introT > (reduce ? 0 : 2.3)
    ) {
      engrave.progress = reduce ? 1 : Math.min(1, engrave.progress + dt / 1.8);
      drawPlaque();
      if (engrave.progress >= 1 && !reduce) fireSparks();
    }
    if (sparkT >= 0) {
      sparkT += dt;
      for (let i = 0; i < SPARKS; i++) {
        sv[i * 3 + 1] -= 1800 * dt;
        sp[i * 3] += sv[i * 3] * dt;
        sp[i * 3 + 1] += sv[i * 3 + 1] * dt;
        sp[i * 3 + 2] += sv[i * 3 + 2] * dt;
      }
      sparkGeo.attributes.position.needsUpdate = true;
      sparkMat.opacity = Math.max(0, 1 - sparkT / 1.8);
      if (sparkT > 1.8) sparkT = -1;
    }

    // Crowned: dolly in to the plaque while engraving, then pull back.
    let dolly = 0;
    if (state.mode === 'crowned' && !reduce) {
      dolly = ease((introT - 1.0) / 1.2) * (1 - ease((introT - 5.2) / 1.8));
    }
    new THREE.Box3().setFromObject(plaqueMesh).getCenter(plaqueCenter);
    dollyTo.set(plaqueCenter.x, plaqueCenter.y + 60, plaqueCenter.z + 1300);
    camera.position.lerpVectors(camBase, dollyTo, dolly);
    lookAt.lerpVectors(origin, plaqueCenter, dolly);
    camera.lookAt(lookAt);

    bloom.enabled = state.fx.bloom;
    finish.uniforms.uGrain.value = state.fx.grain ? 0.03 : 0;
    finish.uniforms.uTime.value = simT;
  }

  function frame() {
    raf = requestAnimationFrame(frame);
    if (!visible) return;
    step(Math.min(clock.getDelta(), 0.05));
    composer.render();
  }

  // Pause entirely while the hero is scrolled out of view.
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    clock.getDelta();
  });
  io.observe(stage);

  await document.fonts.load('800 92px "Neue Montreal"');
  await document.fonts.load('400 44px "Martian Mono"');
  applyMetal();
  replay();
  frame();

  // Test hook (prototype only): advance the simulation deterministically.
  (window as unknown as { __advance?: (s: number) => void }).__advance = (
    sec,
  ) => {
    for (let i = 0; i < sec * 60; i++) step(1 / 60);
    composer.render();
  };

  return {
    setMode(mode) {
      state.mode = mode;
      replay();
    },
    setMetal(metal) {
      state.metal = metal;
      applyMetal();
    },
    setOutput(output) {
      finish.uniforms.uOut.value =
        output === 'shaded' ? 0 : output === 'dots' ? 1 : 2;
    },
    setFx(fx) {
      state.fx = fx;
    },
    replay,
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      removeEventListener('scroll', syncGrid);
      removeEventListener('pointermove', onPointer);
      composer.dispose();
      renderer.dispose();
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh || o instanceof THREE.Points)
          o.geometry.dispose();
      });
      plaqueTex.dispose();
      envRed.dispose();
      envPlain.dispose();
    },
  };
}

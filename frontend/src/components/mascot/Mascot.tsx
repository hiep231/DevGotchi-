import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import { MascotProps, MascotMood, MascotType } from './types';
import { tg } from '../../utils/telegram';
import { spawnFloatingReaction } from '../ui/TapEffectOverlay';

const INK = '#1B2A4A';
const RED = '#E8505B';
const CREAM = '#FFF1D6';

const st = (w = 5) => `stroke="${INK}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;
const limb = (d: string, w: number, fill: string, wig: string) =>
  `<g data-w="${wig}"><path d="${d}" fill="none" stroke="${INK}" stroke-width="${w}" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${fill}" stroke-width="${w - 10}" stroke-linecap="round"/></g>`;
const hl = (x: number, y: number, r = 14) =>
  `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r / 2.8}" transform="rotate(-35 ${x} ${y})" fill="#fff" opacity=".85"/><circle cx="${x - 14}" cy="${y + 14}" r="3.5" fill="#fff" opacity=".85"/>`;
const blush = (a: number, b: number, y: number, c = '#FF8FA3') =>
  `<ellipse cx="${a}" cy="${y}" rx="11" ry="6" fill="${c}" opacity=".6"/><ellipse cx="${b}" cy="${y}" rx="11" ry="6" fill="${c}" opacity=".6"/>`;

/* ---------- 4 Mascot Character SVG Generators from Code ---------- */
const CAT = () => {
  const P = '#B79CF0';
  return `<g id="rig">
 ${limb('M200 252 C252 258 266 208 240 192 C227 184 214 198 226 206', 22, P, '204,250,9,2.4,0,0').replace(
   '<g data-w="204,250,9,2.4,0,0">',
   '<g id="tail" data-w="204,250,9,2.4,0,0">'
 )}
 <g id="bodyg"><ellipse cx="150" cy="232" rx="60" ry="54" fill="${P}" ${st()}/><ellipse cx="150" cy="244" rx="34" ry="36" fill="${CREAM}"/>
  <ellipse cx="93" cy="238" rx="11" ry="20" transform="rotate(14 93 238)" fill="${P}" ${st()}/><ellipse cx="207" cy="238" rx="11" ry="20" transform="rotate(-14 207 238)" fill="${P}" ${st()}/></g>
 <ellipse cx="124" cy="282" rx="21" ry="12" fill="${P}" ${st()}/><ellipse cx="176" cy="282" rx="21" ry="12" fill="${P}" ${st()}/>
 <g id="headg">
  <g data-w="112,100,0,0,0,1"><path d="M86 114 L76 50 Q75 41 84 45 L138 74Z" fill="${P}" ${st()}/><path d="M91 100 L86 66 L120 84Z" fill="#FF9FB8"/></g>
  <g data-w="188,100,0,0,0,-1"><path d="M214 114 L224 50 Q225 41 216 45 L162 74Z" fill="${P}" ${st()}/><path d="M209 100 L214 66 L180 84Z" fill="#FF9FB8"/></g>
  <ellipse cx="150" cy="128" rx="80" ry="66" fill="${P}" ${st()}/>
  <path d="M72 128 C70 56 230 56 228 128" fill="none" stroke="${INK}" stroke-width="14" stroke-linecap="round"/><path d="M72 128 C70 56 230 56 228 128" fill="none" stroke="#4A5AA8" stroke-width="7" stroke-linecap="round"/>
  <ellipse cx="68" cy="130" rx="13" ry="21" fill="#FFE7B3" ${st()}/><ellipse cx="232" cy="130" rx="13" ry="21" fill="#FFE7B3" ${st()}/>
  ${hl(98, 110)}<ellipse cx="150" cy="162" rx="27" ry="17" fill="${CREAM}"/>
  <g id="face">${blush(96, 204, 156)}<path d="M144 152 Q150 148 156 152 Q150 160 144 152Z" fill="#FF7F9C" ${st(2.5)}/><g id="eyes"></g><g id="mouth"></g><g id="extra"></g></g>
 </g></g>`;
};

const OCTO = () => {
  const C = '#F5705F';
  const mir = (d: string) =>
    d.replace(/(-?\d+(\.\d+)?) (-?\d+)/g, (_m, x, _, y) => `${300 - Number(x)} ${y}`);
  const L1 = 'M112 222 C78 232 52 262 70 282 C84 294 106 284 98 270 C93 262 83 267 88 274';
  const L2 = 'M134 226 C122 254 126 282 144 286 C152 288 156 280 150 276';
  return `<g id="rig"><g id="bodyg">
 ${limb(L1, 26, C, '112,222,5,2.2,0')}${limb(mir(L1), 26, C, '188,222,5,2.2,1.6')}${limb(L2, 26, C, '134,226,4,2.6,.8')}${limb(mir(L2), 26, C, '166,226,4,2.6,2.2')}</g>
 <g data-w="214,186,7,3,0"><circle cx="248" cy="132" r="15" fill="#CFEFFF" ${st(4)}/><path d="M240 126 q3 -6 9 -7" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M214 186 C242 190 252 170 247 150" fill="none" stroke="${INK}" stroke-width="20" stroke-linecap="round"/><path d="M214 186 C242 190 252 170 247 150" fill="none" stroke="${C}" stroke-width="11" stroke-linecap="round"/></g>
 <g id="headg"><ellipse cx="150" cy="146" rx="78" ry="72" fill="${C}" ${st()}/><ellipse cx="150" cy="200" rx="26" ry="10" fill="${CREAM}"/>
  <circle cx="118" cy="98" r="7" fill="#FFD2C2"/><circle cx="142" cy="88" r="5" fill="#FFD2C2"/><circle cx="178" cy="100" r="6" fill="#FFD2C2"/>${hl(104, 108, 16)}
  <g id="face">${blush(92, 208, 170, '#FFB3C1')}<g id="eyes"></g><g id="mouth"></g><g id="extra"></g></g></g></g>`;
};

const PUFFER = () => {
  const T = '#2FB7B3';
  const D = '#1E8F99';
  const spikes = [-120, -90, -60, -30, 0, 30, 60, 90, 120]
    .map((a) => {
      const r = (a * Math.PI) / 180;
      return `<path transform="translate(${150 + 84 * Math.sin(r)} ${170 - 84 * Math.cos(r)}) rotate(${a})" d="M-10 5 L0 -17 L10 5Z" fill="#FF9F45" ${st(4)}/>`;
    })
    .join('');
  const pins = Array.from(
    { length: 10 },
    (_, i) => `<rect x="${112 + i * 8}" y="236" width="5" height="5" fill="#FFC93C"/>`
  ).join('');
  return `<g id="rig"><g id="bodyg">
 <g data-w="228,176,10,2.8,0"><path d="M226 170 C256 140 286 146 292 170 C286 198 256 206 226 184Z" fill="${D}" ${st()}/><path d="M250 170 L282 165 M250 177 L281 182" stroke="${INK}" stroke-width="3" opacity=".45" stroke-linecap="round"/></g>
 <g data-w="98,200,12,3.2,1"><ellipse cx="84" cy="206" rx="20" ry="11" transform="rotate(-25 84 206)" fill="${D}" ${st()}/></g>
 <g data-w="204,208,-12,3.2,0"><ellipse cx="216" cy="210" rx="20" ry="11" transform="rotate(25 216 210)" fill="${D}" ${st()}/></g></g>
 <g id="headg"><defs><clipPath id="pb_mascot"><circle cx="150" cy="170" r="84"/></clipPath></defs>${spikes}
  <circle cx="150" cy="170" r="84" fill="${T}" ${st()}/><g clip-path="url(#pb_mascot)"><ellipse cx="150" cy="240" rx="70" ry="48" fill="#FFF1B8"/></g><circle cx="150" cy="170" r="84" fill="none" ${st()}/>
  <rect x="108" y="214" width="84" height="22" rx="4" fill="#3DAA5C" ${st(3.5)}/><rect x="118" y="219" width="16" height="11" rx="2" fill="${INK}"/><rect x="142" y="219" width="16" height="11" rx="2" fill="${INK}"/><rect x="166" y="219" width="16" height="11" rx="2" fill="${INK}"/>${pins}
  ${hl(104, 118, 17)}
  <g id="face">${blush(94, 206, 178)}<circle cx="120" cy="150" r="21" fill="#fff" fill-opacity=".25" ${st(4)}/><circle cx="180" cy="150" r="21" fill="#fff" fill-opacity=".25" ${st(4)}/><path d="M141 148 Q150 143 159 148" fill="none" ${st(4)}/><g id="eyes"></g><g id="mouth"></g><g id="extra"></g></g></g></g>`;
};

const DINO = () => {
  const M = '#7ED9A6';
  const plates = [
    [92, 88, -38],
    [208, 88, 38],
    [72, 116, -62],
    [228, 116, 62],
  ]
    .map(
      ([x, y, r], i) =>
        `<g data-w="${x},${y},4,2.4,${i}"><path transform="translate(${x} ${y}) rotate(${r})" d="M-16 6 Q0 -34 16 6Z" fill="#FFD79A" ${st(4.5)}/></g>`
    )
    .join('');
  return `<g id="rig"><g id="bodyg">
 <g data-w="200,250,6,2.2,0"><path d="M198 222 C242 226 272 248 278 280 C252 272 226 278 196 276Z" fill="${M}" ${st()}/></g>
 <ellipse cx="150" cy="236" rx="56" ry="52" fill="${M}" ${st()}/><ellipse cx="150" cy="248" rx="32" ry="36" fill="${CREAM}"/>
  <ellipse cx="97" cy="242" rx="10" ry="18" transform="rotate(16 97 242)" fill="${M}" ${st()}/><ellipse cx="203" cy="242" rx="10" ry="18" transform="rotate(-16 203 242)" fill="${M}" ${st()}/></g>
 <ellipse cx="122" cy="282" rx="21" ry="12" fill="${M}" ${st()}/><ellipse cx="178" cy="282" rx="21" ry="12" fill="${M}" ${st()}/>
 <g id="headg">${plates}<ellipse cx="150" cy="134" rx="78" ry="64" fill="${M}" ${st()}/>${hl(100, 112, 15)}
  <path d="M94 96 C92 50 208 50 206 96Z" fill="#4CC9F0" ${st()}/><path d="M188 92 C214 88 238 96 242 106 C222 110 198 106 186 100Z" fill="#2AA8D8" ${st()}/>
  <text x="150" y="84" text-anchor="middle" font-family="Nunito, sans-serif" font-weight="700" font-size="17" fill="#fff">{ }</text>
  <g id="face">${blush(94, 206, 162)}<circle cx="142" cy="158" r="2.4" fill="${INK}" opacity=".7"/><circle cx="158" cy="158" r="2.4" fill="${INK}" opacity=".7"/><g id="eyes"></g><g id="mouth"></g><g id="extra"></g></g></g></g>`;
};

interface MascotCharacter {
  name: string;
  tagline: string;
  svg: () => string;
  hp: [number, number]; // head pivot
  f: {
    ex: [number, number];
    ey: number;
    mx: number;
    my: number;
    s: number;
    am: [number, number];
    zz: [number, number];
  };
}

const CHARACTERS: Record<'cat' | 'octo' | 'puffer' | 'dino', MascotCharacter> = {
  cat: {
    name: 'Bytey',
    tagline: 'Hay quên nhưng đáng yêu',
    svg: CAT,
    hp: [150, 190],
    f: { ex: [118, 182], ey: 138, mx: 150, my: 166, s: 1, am: [196, 88], zz: [206, 94] },
  },
  octo: {
    name: 'Octy',
    tagline: 'Soi ra bug trước cả khi bạn chạy code',
    svg: OCTO,
    hp: [150, 200],
    f: { ex: [120, 180], ey: 148, mx: 150, my: 174, s: 1.05, am: [200, 92], zz: [208, 100] },
  },
  puffer: {
    name: 'Puffy',
    tagline: 'Ăn bao nhiêu RAM cũng chưa no',
    svg: PUFFER,
    hp: [150, 200],
    f: { ex: [120, 180], ey: 150, mx: 150, my: 182, s: 0.95, am: [206, 96], zz: [208, 104] },
  },
  dino: {
    name: 'Dino',
    tagline: 'Đội mũ ngược, code xuôi',
    svg: DINO,
    hp: [150, 190],
    f: { ex: [118, 182], ey: 142, mx: 150, my: 172, s: 1, am: [196, 110], zz: [212, 100] },
  },
};

const normalizeType = (t?: MascotType): 'cat' | 'octo' | 'puffer' | 'dino' => {
  if (!t) return 'puffer';
  const lower = t.toLowerCase();
  if (lower === 'cat' || lower === 'bytey') return 'cat';
  if (lower === 'octo' || lower === 'octy') return 'octo';
  if (lower === 'dino' || lower === 'golemy') return 'dino';
  return 'puffer';
};

export const Mascot: React.FC<MascotProps> = ({
  type = 'puffer',
  mood = 'idle',
  size = 280,
  interactive = true,
  swipeOffset = 0,
  enableEyeTracking = true,
  enableParallax = true,
  enableBreathing = true,
  enableBlink = true,
  speechBubble = null,
  onPoke,
  onDizzy,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const slotRef = useRef<SVGGElement>(null);
  const shadowRef = useRef<SVGEllipseElement>(null);

  const activeCharKey = normalizeType(type);
  const charConfig = useMemo(() => CHARACTERS[activeCharKey], [activeCharKey]);

  // Animation & Physics Tracking References
  const stateRef = useRef({
    gx: 0,
    gy: 0,
    tx: 0,
    ty: 0,
    lastPtr: -1e9,
    nextGlance: 0,
    sq: -1e9,
    twitch: 0,
    nextBlink: 2500,
    blinkAt: -1e9,
    tapTimes: [] as number[],
  });

  // Cached DOM Node elements inside the SVG
  const domNodesRef = useRef<{
    rig: SVGElement | null;
    bodyg: SVGElement | null;
    headg: SVGElement | null;
    face: SVGElement | null;
    eyes: SVGElement | null;
    mouth: SVGElement | null;
    extra: SVGElement | null;
    wigs: { e: SVGElement; px: number; py: number; amp: number; sp: number; ph: number; tw: number }[];
  }>({
    rig: null,
    bodyg: null,
    headg: null,
    face: null,
    eyes: null,
    mouth: null,
    extra: null,
    wigs: [],
  });

  // Render Character SVG & update facial features
  const updateFace = useCallback((m: MascotMood) => {
    const nodes = domNodesRef.current;
    if (!nodes.eyes || !nodes.mouth || !nodes.extra) return;

    const F = charConfig.f;
    const { ex, ey, mx, my, am, zz, s } = F;
    const [ax, ay] = am;
    const [zx, zy] = zz;

    const eyeAt = (x: number, inner: string) => `<g class="eye" data-cx="${x}" data-cy="${ey}">${inner}</g>`;
    const dot = (x: number) =>
      eyeAt(
        x,
        `<ellipse cx="${x}" cy="${ey}" rx="${11 * s}" ry="${14 * s}" fill="${INK}"/><circle class="hl" cx="${x - 3.5}" cy="${ey - 6}" r="4.6" fill="#fff"/><circle class="hl" cx="${x + 3.5}" cy="${ey + 5}" r="2.3" fill="#fff"/>`
      );
    const arc = (d: number) => (x: number) =>
      eyeAt(x, `<path d="M${x - 12} ${ey + d} Q${x} ${ey - d * 1.6} ${x + 12} ${ey + d}" fill="none" ${st(5.5)}/>`);
    const star = (x: number) =>
      eyeAt(
        x,
        `<path transform="translate(${x} ${ey})" d="M0 -15 L4 -4 L15 0 L4 4 L0 15 L-4 4 L-15 0 L-4 -4Z" fill="#FFD166" ${st(2.5)}/>`
      );
    const spiral = (x: number) =>
      eyeAt(
        x,
        `<path d="M${x - 8} ${ey} A8 8 0 0 1 ${x + 8} ${ey} A6 6 0 0 1 ${x - 6} ${ey} A4 4 0 0 1 ${x + 4} ${ey}" fill="none" ${st(3)}/>`
      );

    const both = (fn: (x: number) => string) => ex.map(fn).join('');

    // Mouth
    let mo = `<path d="M${mx - 12} ${my} Q${mx - 6} ${my + 8} ${mx} ${my} Q${mx + 6} ${my + 8} ${mx + 12} ${my}" fill="none" ${st(3)}/>`;
    if (m === 'happy') {
      mo = `<path d="M${mx - 11} ${my - 1} Q${mx} ${my + 18} ${mx + 11} ${my - 1}Z" fill="${RED}" ${st(3)}/>`;
    } else if (m === 'hungry') {
      mo = `<ellipse cx="${mx}" cy="${my + 4}" rx="7" ry="6" fill="${RED}" ${st(3)}/>`;
    } else if (m === 'sleepy') {
      mo = `<ellipse cx="${mx}" cy="${my + 3}" rx="4" ry="3.5" fill="none" ${st(3)}/>`;
    } else if (m === 'eating') {
      mo = `<path d="M${mx - 14} ${my - 2} Q${mx} ${my + 24} ${mx + 14} ${my - 2}Z" fill="${RED}" ${st(3)}/>`;
    } else if (m === 'dizzy') {
      mo = `<path d="M${mx - 10} ${my + 4} Q${mx} ${my - 5} ${mx + 10} ${my + 4}" fill="none" ${st(3)}/>`;
    } else if (m === 'focus') {
      mo = `<path d="M${mx - 8} ${my + 2} L${mx + 8} ${my + 2}" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`;
    }

    // Eyes
    let eyes = both(dot);
    if (m === 'happy') eyes = both(arc(7));
    else if (m === 'sleepy') eyes = both(arc(-5));
    else if (m === 'eating') eyes = both(star);
    else if (m === 'dizzy') eyes = both(spiral);
    else if (m === 'focus') eyes = both(dot);

    // Extra
    let extra = '';
    if (m === 'hungry') {
      extra = `<path d="M${ex[0] - 15} ${ey - 20} L${ex[0] + 12} ${ey - 12} M${ex[1] + 15} ${ey - 20} L${ex[1] - 12} ${ey - 12}" fill="none" ${st(5)}/><path d="M${ax} ${ay} q6 2 6 8 M${ax + 18} ${ay} q-6 2 -6 8 M${ax} ${ay + 16} q6 -2 6 -8 M${ax + 18} ${ay + 16} q-6 -2 -6 -8" fill="none" stroke="${RED}" stroke-width="3.5" stroke-linecap="round"/>`;
    } else if (m === 'sleepy') {
      extra = `<text x="${zx}" y="${zy}" font-family="Nunito, sans-serif" font-weight="700" font-size="24" fill="#6B6890">Z</text><text x="${zx + 22}" y="${zy - 22}" font-family="Nunito, sans-serif" font-weight="700" font-size="16" fill="#6B6890">z</text>`;
    } else if (m === 'dizzy') {
      extra = `<text x="${ex[0] - 10}" y="${ey - 22}" font-size="18">💫</text><text x="${ex[1] - 4}" y="${ey - 26}" font-size="18">✨</text>`;
    } else if (m === 'focus') {
      extra = `<text x="${ex[1] + 14}" y="${ey - 18}" font-size="18">🔥</text>`;
    }

    nodes.eyes.innerHTML = eyes;
    nodes.mouth.innerHTML = mo;
    nodes.extra.innerHTML = extra;
  }, [charConfig]);

  // Mount SVG structure into slot
  useEffect(() => {
    if (!slotRef.current) return;
    slotRef.current.innerHTML = charConfig.svg();

    const slot = slotRef.current;
    domNodesRef.current = {
      rig: slot.querySelector('#rig'),
      bodyg: slot.querySelector('#bodyg'),
      headg: slot.querySelector('#headg'),
      face: slot.querySelector('#face'),
      eyes: slot.querySelector('#eyes'),
      mouth: slot.querySelector('#mouth'),
      extra: slot.querySelector('#extra'),
      wigs: Array.from(slot.querySelectorAll('[data-w]')).map((el) => {
        const [px, py, amp, sp, ph, tw] = (el.getAttribute('data-w') || '0,0,0,0,0,0')
          .split(',')
          .map(Number);
        return { e: el as SVGElement, px, py, amp, sp, ph, tw: tw || 0 };
      }),
    };

    updateFace(mood);
    stateRef.current.sq = performance.now();
    stateRef.current.twitch = 1;
  }, [charConfig, mood, updateFace]);

  // Aim towards pointer coordinates
  const aim = useCallback((clientX: number, clientY: number) => {
    if (!enableEyeTracking || !svgRef.current) return;
    const r = svgRef.current.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height * 0.4;
    const rawX = (clientX - cx) / (r.width * 0.6);
    const rawY = (clientY - cy) / (r.height * 0.6);
    stateRef.current.tx = Math.max(-1, Math.min(1, rawX));
    stateRef.current.ty = Math.max(-1, Math.min(1, rawY));
    stateRef.current.lastPtr = performance.now();
  }, [enableEyeTracking]);

  // Pointer event listeners
  useEffect(() => {
    if (!interactive) return;

    const handlePointerMove = (e: PointerEvent) => aim(e.clientX, e.clientY);
    const handlePointerDown = (e: PointerEvent) => aim(e.clientX, e.clientY);

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown, { passive: true });

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [interactive, aim]);

  // Squash & Stretch click / poke handler
  const handleClick = (e: React.MouseEvent) => {
    if (!interactive) return;
    e.stopPropagation();

    const now = performance.now();
    stateRef.current.sq = now;
    stateRef.current.twitch = 1;

    // Detect rapid 5 clicks -> trigger dizzy
    const taps = stateRef.current.tapTimes.filter((t) => now - t < 2000);
    taps.push(now);
    stateRef.current.tapTimes = taps;

    if (taps.length >= 5) {
      tg.haptic.impact('rigid');
      stateRef.current.tapTimes = [];
      onDizzy?.();
    } else {
      tg.haptic.impact('medium');
      if (typeof window !== 'undefined') {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX || rect.left + rect.width / 2;
        const y = e.clientY || rect.top + rect.height / 2;
        spawnFloatingReaction(x, y, '+3 💖', '#FF6B8B', '💖');
      }
      onPoke?.();
    }
  };

  // 60FPS RAF animation loop
  useEffect(() => {
    let raf: number;
    const headPivot = charConfig.hp;

    const frame = (t: number) => {
      const s = t / 1000;
      const st = stateRef.current;
      const nodes = domNodesRef.current;

      // Random glance if idle
      if (t - st.lastPtr > 3000 && t > st.nextGlance) {
        st.tx = (Math.random() * 2 - 1) * 0.8;
        st.ty = (Math.random() * 2 - 1) * 0.45;
        st.nextGlance = t + 2000 + Math.random() * 2500;
      }

      // Smooth dampening
      st.gx += (st.tx - st.gx) * 0.15;
      st.gy += (st.ty - st.gy) * 0.15;

      // Idle breathing & floating
      const br = enableBreathing ? 1 + 0.022 * Math.sin(s * 2.1) : 1;
      const fy = enableBreathing ? Math.sin(s * 1.5) * 3 : 0;

      // Squash and jump physics
      const e = (t - st.sq) / 380;
      const on = e >= 0 && e < 1;
      const q = on ? Math.sin(e * Math.PI * 2) * (1 - e) : 0;
      const jump = on ? 12 * Math.sin(e * Math.PI) : 0;

      st.twitch *= 0.93;
      const ta = Math.sin(t / 35) * 9 * st.twitch;

      // Apply transforms
      if (nodes.rig) {
        nodes.rig.setAttribute(
          'transform',
          `translate(0 ${fy - jump}) translate(150 286) scale(${1 + 0.07 * q} ${1 - 0.1 * q}) translate(-150 -286)`
        );
      }

      if (nodes.bodyg) {
        nodes.bodyg.setAttribute(
          'transform',
          `translate(150 286) scale(1 ${br}) translate(-150 -286)`
        );
      }

      if (nodes.headg) {
        const parallaxX = enableParallax ? st.gx * 2 : 0;
        const parallaxY = enableParallax ? -(br - 1) * 70 + st.gy * 1.5 : 0;
        const tiltDeg = enableParallax ? st.gx * 3.5 + swipeOffset * 8 : 0;
        nodes.headg.setAttribute(
          'transform',
          `translate(${parallaxX} ${parallaxY}) rotate(${tiltDeg} ${headPivot[0]} ${headPivot[1]})`
        );
      }

      if (nodes.face) {
        const fx = enableParallax ? st.gx * 3.5 : 0;
        const fyVal = enableParallax ? st.gy * 2.5 : 0;
        nodes.face.setAttribute('transform', `translate(${fx} ${fyVal})`);
      }

      if (nodes.eyes) {
        const ex = enableEyeTracking ? st.gx * 3 : 0;
        const ey = enableEyeTracking ? st.gy * 2 : 0;
        nodes.eyes.setAttribute('transform', `translate(${ex} ${ey})`);
      }

      // Wiggle limbs, tentacles, fins, plates
      nodes.wigs.forEach((w) => {
        const angle = w.amp * Math.sin(s * w.sp + w.ph) + w.tw * ta;
        w.e.setAttribute('transform', `rotate(${angle} ${w.px} ${w.py})`);
      });

      // Shadow reacts to jumping
      if (shadowRef.current) {
        shadowRef.current.setAttribute('rx', `${62 * (1 + (fy - jump) / 80)}`);
      }

      // Auto-blink
      if (enableBlink && t > st.nextBlink) {
        st.blinkAt = t;
        st.nextBlink = t + 3000 + Math.random() * 3200;
      }

      const b = (t - st.blinkAt) / 140;
      const sc = b >= 0 && b < 1 ? 1 - 0.9 * Math.sin(b * Math.PI) : 1;

      if (nodes.eyes) {
        nodes.eyes.querySelectorAll('.eye').forEach((g) => {
          const el = g as SVGElement;
          const x = el.getAttribute('data-cx') || '0';
          const y = el.getAttribute('data-cy') || '0';
          el.setAttribute('transform', `translate(${x} ${y}) scale(1 ${sc}) translate(${-Number(x)} ${-Number(y)})`);
        });

        nodes.eyes.querySelectorAll('.hl').forEach((h) => {
          const el = h as SVGElement;
          el.setAttribute('transform', `translate(${-st.gx * 0.9} ${-st.gy * 0.9})`);
        });
      }

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [charConfig, enableBreathing, enableParallax, enableEyeTracking, enableBlink, swipeOffset]);

  const sizeStyle = typeof size === 'number' ? `${size}px` : size;

  return (
    <div
      ref={containerRef}
      className={`relative flex items-center justify-center select-none ${className}`}
      style={{
        width: sizeStyle,
        height: sizeStyle,
        touchAction: 'none',
      }}
    >
      {/* Speech Bubble (Sticker Card) */}
      {speechBubble && (
        <div className="absolute -top-10 max-w-[260px] px-3.5 py-1.5 bg-white border-2 border-[var(--ink)] rounded-2xl shadow-[0_3px_0_var(--ink)] text-xs font-heading font-black text-[var(--ink)] text-center animate-float-gentle z-40 pointer-events-none">
          <span>{speechBubble}</span>
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white border-r-2 border-b-2 border-[var(--ink)] rotate-45" />
        </div>
      )}

      {/* Pure Vector Puppet SVG */}
      <svg
        ref={svgRef}
        viewBox="0 0 300 330"
        className="w-full h-full cursor-pointer overflow-visible"
        onClick={handleClick}
      >
        {/* Ground Shadow */}
        <ellipse ref={shadowRef} cx="150" cy="291" rx="62" ry="8" fill="#1B2A4A" opacity="0.18" />
        {/* Dynamic Character Slot */}
        <g ref={slotRef} />
      </svg>
    </div>
  );
};

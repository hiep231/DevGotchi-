// node scripts/gen_food_icons.mjs  -> frontend/public/foods/*.svg + tests/foods_preview.html
import fs from 'node:fs';
import path from 'node:path';

const INK = '#1B2A4A';
const ST = (w = 4) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const ell = (cx, cy, rx, ry) => `M${cx - rx} ${cy} a${rx} ${ry} 0 1 0 ${2 * rx} 0 a${rx} ${ry} 0 1 0 ${-2 * rx} 0 Z`;

// flat 3-tone shape: base + darker bottom (curved edge) + outline on top
const solid = (id, d, base, shade, y) =>
  `<clipPath id="${id}"><path d="${d}"/></clipPath><path d="${d}" fill="${base}"/>` +
  `<g clip-path="url(#${id})"><ellipse cx="64" cy="${y + 70}" rx="95" ry="70" fill="${shade}"/></g>` +
  `<path d="${d}" fill="none" ${ST()}/>`;

const face = (cx, cy, blush = '#FF8FA3') =>
  `<ellipse cx="${cx - 16}" cy="${cy + 4}" rx="4.5" ry="2.6" fill="${blush}" opacity=".75"/>` +
  `<ellipse cx="${cx + 16}" cy="${cy + 4}" rx="4.5" ry="2.6" fill="${blush}" opacity=".75"/>` +
  `<circle cx="${cx - 9}" cy="${cy}" r="2.8" fill="${INK}"/><circle cx="${cx + 9}" cy="${cy}" r="2.8" fill="${INK}"/>` +
  `<path d="M${cx - 4} ${cy + 4} q4 4 8 0" fill="none" ${ST(2.4)}/>`;

const hl = (x, y) =>
  `<rect x="${x}" y="${y}" width="14" height="5" rx="2.5" fill="#fff" opacity=".9" transform="rotate(-35 ${x} ${y})"/><circle cx="${x - 5}" cy="${y + 11}" r="2.4" fill="#fff" opacity=".9"/>`;

const steam = d => `<path d="${d}" fill="none" stroke="#9FB0D8" stroke-width="3.5" stroke-linecap="round"/>`;
const sparkle = (x, y, s = 7, c = '#FFE98A') => `<path transform="translate(${x} ${y})" d="M0-${s}L${s * .28} -${s * .28} ${s} 0 ${s * .28} ${s * .28} 0 ${s} -${s * .28} ${s * .28} -${s} 0 -${s * .28} -${s * .28}Z" fill="${c}" ${ST(2)}/>`;

const wrap = body =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">` +
  `<ellipse cx="64" cy="118" rx="36" ry="5" fill="${INK}" opacity=".14"/><g transform="rotate(5 64 64)">${body}</g></svg>`;

const ICONS = {};

// 1 ─ Bánh bao ladybug
ICONS.bao =
  steam('M48 34 q-7 -6 0 -12 q7 -6 0 -12') + steam('M66 32 q-7 -6 0 -12 q7 -6 0 -12') + steam('M84 34 q-7 -6 0 -12 q7 -6 0 -12') +
  solid('bao', ell(64, 74, 40, 33), '#FFF1D6', '#EBCB93', 86) +
  `<path d="M64 42 q-3 7 -1 13 M64 42 q4 6 3 13" fill="none" stroke="#D9B27A" stroke-width="2.5" stroke-linecap="round"/>` +
  [[44, 62, 5], [84, 60, 5], [64, 52, 4.5], [96, 76, 4], [32, 78, 4]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${INK}"/>`).join('') +
  hl(40, 54) + face(64, 84);

// 2 ─ Mì ly ">_"
ICONS.noodle_cup =
  `<path d="M42 40 L54 28 L42 16" fill="none" stroke="#9FB0D8" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M62 38 H80" fill="none" stroke="#9FB0D8" stroke-width="4" stroke-linecap="round"/>` +
  `<path d="M38 64 q6 -18 13 0 q6 -18 13 0 q6 -18 13 0 q6 -18 13 0" fill="none" stroke="${INK}" stroke-width="10" stroke-linecap="round"/><path d="M38 64 q6 -18 13 0 q6 -18 13 0 q6 -18 13 0 q6 -18 13 0" fill="none" stroke="#FFE08A" stroke-width="5.5" stroke-linecap="round"/>` +
  `<path d="M104 62 Q118 50 106 38 Q98 40 100 54 Z" fill="#FFF1D6" ${ST(3.5)}/>` +
  solid('cup', 'M28 62 L100 62 L90 114 L38 114 Z', '#FF5A5F', '#D63E4A', 100) +
  `<clipPath id="band"><path d="M28 62 L100 62 L90 114 L38 114 Z"/></clipPath><g clip-path="url(#band)"><rect x="0" y="78" width="128" height="22" fill="#FFD23F"/></g><path d="M28 62 L100 62 L90 114 L38 114 Z" fill="none" ${ST()}/>` +
  `<path d="M26 62 Q64 52 102 62 L102 68 Q64 58 26 68 Z" fill="#FFF1D6" ${ST(3.5)}/>` +
  hl(40, 76) + face(64, 90, '#FF8FA3');

// 3 ─ Trà sữa trân châu vuông
const bolt = (cx, cy) => `<path d="M${cx + 1} ${cy - 4} L${cx - 2} ${cy + .5} L${cx} ${cy + .5} L${cx - 1} ${cy + 4.5} L${cx + 2} ${cy - 1} L${cx} ${cy - 1} Z" fill="#FFD23F"/>`;
const pearl = (cx, cy) => `<rect x="${cx - 5.5}" y="${cy - 5.5}" width="11" height="11" rx="2.5" fill="#5B4663" ${ST(2.5)}/>${bolt(cx, cy)}`;
ICONS.bubble_tea =
  `<path d="M68 26 L80 4" fill="none" stroke="${INK}" stroke-width="9" stroke-linecap="round"/><path d="M68 26 L80 4" fill="none" stroke="#FF8FB8" stroke-width="4.5" stroke-linecap="round"/>` +
  solid('tea', 'M40 42 L88 42 L82 116 L46 116 Z', '#F3DCC8', '#DDB894', 92) +
  `<path d="M36 42 Q64 4 92 42 Z" fill="#E8F6FF" ${ST()}/><path d="M48 34 Q56 20 66 16" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".9"/>` +
  [[51, 108], [64, 108], [77, 108], [57, 96], [71, 96]].map(([x, y]) => pearl(x, y)).join('') +
  face(64, 66);

// 4 ─ Onigiri + git branch
const oni = 'M64 22 Q70 22 76 32 L104 92 Q108 108 94 110 L34 110 Q20 108 24 92 L52 32 Q58 22 64 22 Z';
ICONS.onigiri =
  solid('oni', oni, '#FFFDF5', '#E3DDC8', 76) +
  `<clipPath id="nori"><path d="${oni}"/></clipPath><g clip-path="url(#nori)"><rect x="0" y="84" width="128" height="30" fill="#2F5D3A"/></g><path d="${oni}" fill="none" ${ST()}/>` +
  `<path d="M44 96 H60 M60 96 L72 89 M60 96 L72 103" fill="none" stroke="#FFFDF5" stroke-width="2.6" stroke-linecap="round"/>` +
  [[44, 96], [76, 87], [76, 105]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.4" fill="#FFFDF5"/>`).join('') +
  hl(52, 44) + face(64, 62);

// 5 ─ Kem 2 vị + merge
ICONS.ice_cream =
  `<path d="M64 38 L64 22" fill="none" stroke="${INK}" stroke-width="9" stroke-linecap="round"/><path d="M64 38 L64 22" fill="none" stroke="#E8C07A" stroke-width="4.5" stroke-linecap="round"/>` +
  `<rect x="46" y="2" width="36" height="18" rx="6" fill="#fff" ${ST(3)}/><path d="M55 8 L64 13 L73 8 M64 13 V17" fill="none" ${ST(2.6)}/>` +
  solid('cone', 'M42 70 L64 118 L86 70 Z', '#E8B26A', '#C98F45', 100) +
  `<path d="M52 80 L72 106 M64 74 L78 94 M46 76 L64 100 M76 78 L56 106" fill="none" stroke="#C98F45" stroke-width="2.4" stroke-linecap="round"/><path d="M42 70 L64 118 L86 70 Z" fill="none" ${ST()}/>` +
  solid('mint', ell(50, 58, 22, 20), '#8FE3C9', '#5FC8A8', 64) +
  solid('pink', ell(78, 58, 22, 20), '#FFA8C5', '#F27AA3', 64) +
  `<path d="M64 40 C57 50 71 58 64 72" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".9"/>` +
  `<path d="M34 76 q2 12 8 6 q2 -4 0 -6Z" fill="#8FE3C9" ${ST(3)}/><path d="M86 76 q3 14 9 6 q1 -4 -1 -6Z" fill="#FFA8C5" ${ST(3)}/>` +
  hl(38, 46) + face(64, 64);

// 6 ─ Pizza ✓ + cờ
ICONS.pizza =
  `<path d="M70 108 L98 80" fill="none" stroke="${INK}" stroke-width="7" stroke-linecap="round"/><path d="M70 108 L98 80" fill="none" stroke="#E8C07A" stroke-width="3" stroke-linecap="round"/><path d="M98 80 L116 76 L106 90 Z" fill="#fff" ${ST(3)}/><circle cx="106" cy="82" r="2.5" fill="#E5484D"/>` +
  solid('pz', 'M20 38 Q64 16 108 38 L68 108 Q64 114 60 108 Z', '#FFC857', '#F2A93B', 80) +
  `<path d="M16 36 Q64 10 112 36 L108 46 Q64 24 20 46 Z" fill="#E39B4A" ${ST()}/>` +
  `<path d="M36 52 q2 12 8 5 q2 -4 0 -5Z M82 54 q3 13 9 4 q1 -4 -1 -4Z" fill="#FFD97A" ${ST(2.6)}/>` +
  [[50, 70], [58, 80], [66, 88], [78, 72], [86, 62]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6.5" fill="#E5484D" ${ST(2.8)}/>`).join('') +
  `<path d="M48 70 L58 80 L66 88 L78 72 L88 60" fill="none" stroke="${INK}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><path d="M48 70 L58 80 L66 88 L78 72 L88 60" fill="none" stroke="#3DDC84" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>` +
  hl(40, 40) + face(64, 50);

// 7 ─ Bánh mì chất tầng
const leaf = (x, y, r) => `<path transform="translate(${x} ${y}) rotate(${r})" d="M0 0 Q-7 -9 0 -16 Q7 -9 0 0Z" fill="#5ED38A" ${ST(2.4)}/>`;
const cuc = (x, y) => `<circle cx="${x}" cy="${y}" r="7" fill="#9BE564" ${ST(2.6)}/><circle cx="${x}" cy="${y}" r="3" fill="#CFF5A8"/>`;
ICONS.banh_mi =
  `<path d="M70 58 Q96 40 112 62 Q108 78 82 76 Z" fill="#F2B85B" ${ST()}/>` +
  `<g transform="translate(0 12)">` +
  `<path d="M24 66 Q64 54 104 66 L104 80 Q64 70 24 80 Z" fill="#B5733C" ${ST(3.5)}/>` +
  [[34, 60], [46, 54], [58, 60], [72, 54], [84, 60]].map(([x, y]) => `<path d="M${x} ${y} l4 -14" fill="none" stroke="${INK}" stroke-width="8" stroke-linecap="round"/><path d="M${x} ${y} l4 -14" fill="none" stroke="#FF9F43" stroke-width="4" stroke-linecap="round"/>`).join('') +
  cuc(44, 42) + cuc(64, 38) + cuc(82, 44) +
  `<path d="M52 30 q4 -6 8 0 M74 28 q4 -6 8 0" fill="none" stroke="#E5484D" stroke-width="5" stroke-linecap="round"/>` +
  leaf(54, 26, -20) + leaf(66, 22, 5) + leaf(78, 26, 25) +
  `</g>` +
  cuc(18, 30) + leaf(106, 22, 40) + `<ellipse cx="98" cy="10" rx="5" ry="2.8" fill="#E5484D" ${ST(2.2)} transform="rotate(-30 98 10)"/>` +
  solid('bm', 'M16 84 Q64 72 112 84 Q116 112 100 116 L28 116 Q12 112 16 84 Z', '#F2B85B', '#D9923A', 102) +
  hl(30, 88) + face(64, 100);

// 8 ─ Táo vàng + bọ rùa
ICONS.golden_apple =
  `<path d="M64 38 Q62 26 68 16" fill="none" stroke="${INK}" stroke-width="7" stroke-linecap="round"/><path d="M64 38 Q62 26 68 16" fill="none" stroke="#8B5A2B" stroke-width="3" stroke-linecap="round"/>` +
  `<path d="M68 26 Q84 8 100 20 Q86 36 68 26 Z" fill="#5ED38A" ${ST()}/><path d="M72 26 Q84 20 94 21" fill="none" stroke="#2F9E62" stroke-width="2.4" stroke-linecap="round"/>` +
  solid('ap', 'M64 38 C48 26 20 36 22 68 C24 96 44 114 64 108 C84 114 104 96 106 68 C108 36 80 26 64 38 Z', '#FFD23F', '#F0A818', 84) +
  hl(36, 52) + face(64, 72, '#FF9F6B') +
  sparkle(14, 34, 8) + sparkle(116, 96, 8) + sparkle(22, 104, 6) + sparkle(94, 8, 6) +
  `<g transform="translate(114 52)"><ellipse cx="-7" cy="-8" rx="5" ry="8" transform="rotate(-25 -7 -8)" fill="#fff" opacity=".85" ${ST(2)}/><ellipse cx="7" cy="-8" rx="5" ry="8" transform="rotate(25 7 -8)" fill="#fff" opacity=".85" ${ST(2)}/>` +
  `<ellipse cx="0" cy="0" rx="7" ry="8" fill="#E5484D" ${ST(2.4)}/><path d="M0 -8 V8" ${ST(2)}/><circle cx="-3" cy="-1" r="1.6" fill="${INK}"/><circle cx="3" cy="3" r="1.6" fill="${INK}"/><circle cx="0" cy="-10" r="4" fill="${INK}"/>` +
  `<path d="M-2 -13 l-3 -4 M2 -13 l3 -4" ${ST(1.6)}/><path d="M-6 2 q-9 -2 -10 -10" fill="none" ${ST(2.4)}/><circle cx="-16" cy="-10" r="2.4" fill="${INK}"/></g>`;

// write ------------------------------------------------------------------------
const out = path.resolve('frontend/public/foods');
fs.mkdirSync(out, { recursive: true });
for (const [k, v] of Object.entries(ICONS)) fs.writeFileSync(path.join(out, `${k}.svg`), wrap(v));

const names = { bao: 'Bánh bao', noodle_cup: 'Mì ly >_', bubble_tea: 'Trà sữa', onigiri: 'Onigiri git', ice_cream: 'Kem merge', pizza: 'Pizza ✓', banh_mi: 'Bánh mì', golden_apple: 'Táo vàng' };
fs.mkdirSync('tests', { recursive: true });
fs.writeFileSync('tests/foods_preview.html', `<!doctype html><meta charset="utf-8"><body style="margin:0;background:#FFF6E5;font-family:sans-serif"><div style="display:grid;grid-template-columns:repeat(4,200px);gap:14px;padding:14px">${Object.keys(ICONS).map(k => `<div style="background:#fff;border:2px solid #2D2A4A;border-radius:20px;padding:8px;text-align:center"><img src="../frontend/public/foods/${k}.svg" width="176"><div style="font-weight:700;color:#2D2A4A">${names[k]}</div></div>`).join('')}</div>`);
console.log('wrote', Object.keys(ICONS).length, 'icons');

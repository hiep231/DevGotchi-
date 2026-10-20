// Usage: node scripts/gen_mascots.mjs
// Reuses the animation engine of mascot_demo/cache-cat.html (eye tracking, blink, breathing,
// tail wag, squash, moods) and swaps ONLY the character drawing + copy.
import fs from 'node:fs';
import path from 'node:path';

const dir = path.resolve('mascot_demo');
const src = fs.readFileSync(path.join(dir, 'cache-cat.html'), 'utf8');
const INK = '#1B2A4A';
const S = (w = 5) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;

// shared pieces ------------------------------------------------------------
const highlight = `<ellipse cx="98" cy="110" rx="14" ry="5" transform="rotate(-35 98 110)" fill="#fff" opacity=".85"/><circle cx="84" cy="124" r="3.5" fill="#fff" opacity=".85"/>`;
const blush = c => `<ellipse cx="96" cy="156" rx="11" ry="6" fill="${c}" opacity=".6"/><ellipse cx="204" cy="156" rx="11" ry="6" fill="${c}" opacity=".6"/>`;
const feet = (c) => `<ellipse cx="124" cy="282" rx="21" ry="12" fill="${c}" ${S()}/><ellipse cx="176" cy="282" rx="21" ry="12" fill="${c}" ${S()}/>`;
const armPair = c => `<ellipse cx="93" cy="238" rx="11" ry="20" transform="rotate(14 93 238)" fill="${c}" ${S()}/><ellipse cx="207" cy="238" rx="11" ry="20" transform="rotate(-14 207 238)" fill="${c}" ${S()}/>`;

function rig({ tail, body, feetSvg, earL, earR, headFill, preHead = '', muzzle = '', nose = '', blushC = '#FF8FA3', faceExtra = '', headTop = '', headShape }) {
  return `<g id="rig">
    <g id="tail">${tail}</g>
    <g id="bodyg">${body}</g>
    ${feetSvg}
    <g id="headg">
      <g id="earL">${earL}</g>
      <g id="earR">${earR}</g>
      ${preHead}
      ${headShape || `<ellipse cx="150" cy="128" rx="80" ry="66" fill="${headFill}" ${S()}/>`}
      ${highlight}
      ${muzzle}
      ${headTop}
      <g id="face">
        ${blush(blushC)}
        ${nose}
        <g id="eyes"></g>
        <g id="mouth"></g>
        <g id="extra"></g>
        ${faceExtra}
      </g>
    </g>
  </g>`;
}

const thickTail = (d, outer, inner, w1 = 22, w2 = 12) =>
  `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${w1}" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${inner}" stroke-width="${w2}" stroke-linecap="round"/>`;

// 1) PUFFY — pufferfish ------------------------------------------------------
const T = '#2BA6A0', TD = '#1F8F8C', TL = '#7ED9CF', OR = '#FF9F43';
const spike = (x, y, r) => `<path d="M${x - 8} ${y} L${x} ${y - 18} L${x + 8} ${y} Z" transform="rotate(${r} ${x} ${y})" fill="${OR}" ${S(3)}/>`;
const pins = Array.from({ length: 7 }, (_, i) => `<rect x="${121 + i * 8.5}" y="262" width="4" height="6" rx="1" fill="#FFD166" stroke="${INK}" stroke-width="1.5"/>`).join('');
const puffy = rig({
  tail: `<path d="M204 238 C236 204 274 196 290 212 C282 230 284 246 292 264 C262 274 226 264 204 250 Z" fill="${TD}" ${S()}/><path d="M214 244 C240 232 262 226 280 224 M216 250 C242 250 262 254 280 256" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`,
  body: `${[ [96,206,-40],[204,206,40],[88,240,-70],[212,240,70] ].map(([x,y,r]) => spike(x,y,r)).join('')}
    <ellipse cx="150" cy="232" rx="62" ry="54" fill="${T}" ${S()}/>
    <ellipse cx="150" cy="250" rx="44" ry="30" fill="${TL}"/>
    <rect x="116" y="238" width="68" height="28" rx="4" fill="#4FB86B" ${S(3)}/>
    ${[124,146,168].map(x => `<rect x="${x}" y="243" width="14" height="13" rx="2" fill="#2E8B4A"/>`).join('')}${pins}`,
  feetSvg: feet(T),
  earL: `<ellipse cx="66" cy="150" rx="16" ry="23" transform="rotate(-12 66 150)" fill="${T}" ${S()}/>`,
  earR: `<ellipse cx="234" cy="150" rx="16" ry="23" transform="rotate(12 234 150)" fill="${T}" ${S()}/>`,
  preHead: [[110,70,-25],[150,64,0],[190,70,25],[80,92,-50],[220,92,50]].map(([x,y,r]) => spike(x,y,r)).join(''),
  headFill: T,
  muzzle: `<ellipse cx="150" cy="164" rx="28" ry="17" fill="${TL}"/>`,
  blushC: '#FF8FA3',
  faceExtra: `<circle cx="118" cy="138" r="25" fill="#fff" opacity=".07" ${S(4)}/><circle cx="182" cy="138" r="25" fill="#fff" opacity=".07" ${S(4)}/><path d="M142 135 Q150 129 158 135" fill="none" ${S(3.5)}/>`
});

// 2) DINO — baby dinosaur ----------------------------------------------------
const M = '#7FD6A8', CR = '#FFE7B3';
const plate = (cx, cy, rx, ry, r) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" transform="rotate(${r} ${cx} ${cy})" fill="${CR}" ${S()}/>`;
const dino = rig({
  tail: thickTail('M200 252 C246 264 272 238 262 212', INK, M, 28, 18),
  body: `${plate(90,196,13,17,-25)}${plate(81,226,13,17,-15)}${plate(86,256,12,15,-5)}
    <ellipse cx="150" cy="232" rx="60" ry="54" fill="${M}" ${S()}/>
    <ellipse cx="150" cy="244" rx="34" ry="36" fill="#FFF1D6"/>${armPair(M)}`,
  feetSvg: feet(M),
  earL: plate(86, 92, 11, 15, -30),
  earR: plate(214, 92, 11, 15, 30),
  headFill: M,
  blushC: '#FF8FA3',
  headTop: `<path d="M196 84 Q238 80 248 94 Q228 104 198 100 Z" fill="#4A5AA8" ${S()}/><path d="M98 94 C100 48 200 48 202 94 Q150 108 98 94 Z" fill="#FFD9A0" ${S()}/><rect x="132" y="62" width="30" height="20" rx="3" fill="#9ADBF5" ${S(3)}/><path d="M128 86 H166" ${S(3)} fill="none"/>`
});

// 3) OCTY — octopus ----------------------------------------------------------
const C = '#FF8A80';
const dots = (cx, cy) => `<circle cx="${cx}" cy="${cy}" r="3" fill="#FFF1D6"/>`;
const curl = (x, y) => `<ellipse cx="${x}" cy="${y}" rx="17" ry="12" fill="${C}" ${S()}/>${dots(x - 6, y + 2)}${dots(x + 5, y - 1)}`;
const octy = rig({
  tail: thickTail('M196 262 C252 278 278 236 256 214 C246 206 232 218 242 228', INK, C, 22, 12),
  body: `<ellipse cx="150" cy="232" rx="54" ry="50" fill="${C}" ${S()}/>
    <ellipse cx="150" cy="246" rx="28" ry="34" fill="#FFF1D6"/>
    <ellipse cx="97" cy="240" rx="11" ry="20" transform="rotate(14 97 240)" fill="${C}" ${S()}/>
    <path d="M198 242 L226 214" fill="none" stroke="${INK}" stroke-width="18" stroke-linecap="round"/><path d="M198 242 L226 214" fill="none" stroke="${C}" stroke-width="9" stroke-linecap="round"/>
    <circle cx="238" cy="200" r="13" fill="#BFE6FF" ${S(4)}/><ellipse cx="234" cy="196" rx="4" ry="2.4" fill="#fff" opacity=".9"/>`,
  feetSvg: [curl(108, 284), curl(136, 290), curl(164, 290), curl(192, 284)].join(''),
  earL: '',
  earR: `<path d="M168 68 Q172 46 188 38" fill="none" stroke="${INK}" stroke-width="9" stroke-linecap="round"/><path d="M168 68 Q172 46 188 38" fill="none" stroke="${C}" stroke-width="4.5" stroke-linecap="round"/><circle cx="190" cy="36" r="9" fill="${C}" ${S(4)}/>`,
  headFill: C,
  headTop: `<circle cx="196" cy="90" r="8" fill="#FFF1D6"/><circle cx="214" cy="108" r="5" fill="#FFF1D6"/><circle cx="178" cy="78" r="4" fill="#FFF1D6"/>`,
  blushC: '#FF6F7A'
});

// build -----------------------------------------------------------------------
const CHARS = [
  { file: 'puffy-ram.html', name: 'Puffy RAM', sub: 'Cá nóc đeo kính, bụng gắn thanh RAM. Vẽ hoàn toàn bằng SVG và code, không dùng ảnh.', aria: 'Puffy RAM, chú cá nóc xanh ngọc đeo kính, mắt nhìn theo con trỏ', art: puffy, tail: '206 244', l: '80 150', r: '220 150',
    say: { idle: 'Blub~', happy: 'Hihi!', hungry: 'Đói quá!', sleepy: 'Zzz…', eating: 'Ngon ghê!' }, taps: ['Phồng má!', 'Hihi!', 'Blub~', 'Cho ăn đi!'] },
  { file: 'dino-deploy.html', name: 'Dino Deploy', sub: 'Khủng long mũ ngược, deploy không sợ rollback. Vẽ hoàn toàn bằng SVG và code, không dùng ảnh.', aria: 'Dino Deploy, chú khủng long xanh bạc hà đội mũ ngược, mắt nhìn theo con trỏ', art: dino, tail: '204 250', l: '86 92', r: '214 92',
    say: { idle: 'Rawr~', happy: 'Yay!', hungry: 'Đói quá!', sleepy: 'Zzz…', eating: 'Ngon ghê!' }, taps: ['Nhột quá!', 'Rawr!', 'Deploy nào!', 'Cho ăn đi!'] },
  { file: 'octy-bug.html', name: 'Octy Bug', sub: 'Bạch tuộc cầm kính lúp săn bug. Vẽ hoàn toàn bằng SVG và code, không dùng ảnh.', aria: 'Octy Bug, chú bạch tuộc hồng san hô cầm kính lúp, mắt nhìn theo con trỏ', art: octy, tail: '204 250', l: '130 66', r: '170 66',
    say: { idle: 'Bloop~', happy: 'Pass hết!', hungry: 'Đói quá!', sleepy: 'Zzz…', eating: 'Ngon ghê!' }, taps: ['Nhột quá!', 'Bloop!', 'Thấy bug rồi!', 'Cho ăn đi!'] }
];

const a = src.indexOf('<g id="rig">');
const b = src.indexOf('</svg>', a);
for (const c of CHARS) {
  let out = src.slice(0, a) + c.art + '\n</svg>' + src.slice(b + 6);
  out = out
    .replace('<title>Cache Cat – mascot vẽ bằng code</title>', `<title>${c.name} – mascot vẽ bằng code</title>`)
    .replace('<h1>Cache Cat</h1>', `<h1>${c.name}</h1>`)
    .replace(/<p class="sub">.*?<\/p>/, `<p class="sub">${c.sub}</p>`)
    .replace(/aria-label="Cache Cat[^"]*"/, `aria-label="${c.aria}"`)
    .replace('rotate(${Math.sin(s * 2.4) * 9 * k + (mood === \'hungry\' ? -8 : 0)} 204 250)', `rotate(\${Math.sin(s * 2.4) * 9 * k + (mood === 'hungry' ? -8 : 0)} ${c.tail})`)
    .replace('rotate(${ta} 112 100)', `rotate(\${ta} ${c.l})`)
    .replace('rotate(${-ta} 188 100)', `rotate(\${-ta} ${c.r})`)
    .replace("const TAPS = ['Nhột quá!', 'Hihi!', 'Meo~', 'Cho ăn đi!'];", `const TAPS = ${JSON.stringify(c.taps)};`)
    .replace("say:'Meo~'", `say:'${c.say.idle}'`).replace("say:'Hihi!'", `say:'${c.say.happy}'`);
  fs.writeFileSync(path.join(dir, c.file), out);
  console.log('wrote', c.file);
}

import { MascotConfig, MascotType } from './types';

export const MASCOT_CONFIGS: Record<string, MascotConfig> = {
  puffer: {
    id: 'puffer',
    displayName: 'Puffy',
    roleTitle: 'The Product Strategist & Tech Master',
    viewBox: '0 0 400 400',
    themeColor: '#0D9488',
    secondaryColor: '#FFB703',
    eyes: {
      centerL: { x: 165, y: 175 },
      centerR: { x: 235, y: 175 },
      rx: 26,
      ry: 32,
      pupilRadius: 16,
      maxPupilClamp: 12,
    },
    layers: [
      { id: 'shadow', name: 'Ground Shadow', depth: 0.3, zIndex: 1 },
      { id: 'body', name: 'Teal Puffer Mascot', depth: 1.0, src: '/mascots/puffy_clean.png', zIndex: 4 },
    ],
    tailWag: {
      pivot: { x: 78, y: 54 },
      amplitudeDeg: 8,
      speedSec: 2.2,
    },
    finFlap: {
      pivot: { x: 24, y: 55 },
      amplitudeDeg: 10,
      speedSec: 1.6,
    },
    quotes: {
      idle: [
        'Đeo kính soi bug, không một lỗi nào lọt qua!',
        'Bụng gắn RAM mạ vàng lưu trữ mọi metric!',
        'Sẵn sàng cho một phiên tập trung mới chưa sen?',
      ],
      happy: [
        'Tuyệt cú mèo! Cảm giác hoàn thành công việc thật đã!',
        'Cảm ơn sen đã chăm sóc bé chu đáo nha! 🥰',
        'Tâm trạng 10/10, năng lượng dồi dào!',
      ],
      hungry: [
        'Đói meo rồi... cho bé xin chút Tôm Debug đi sen! 🥺',
        'Bụng kêu ùng ục rồi nè, nạp năng lượng thôi!',
      ],
      sleepy: [
        'Khò khò... trẫm chợp mắt chút nạp lại RAM nha Zzz',
        'Mắt díp lại rồi... chúc sen ngủ ngon!',
      ],
      focus: [
        'Đang tập trung cao độ, cùng chạy nước rút nào! 🔥',
        'Kính lúp khóa mục tiêu, hoàn thành task đúng hạn!',
      ],
      eating: [
        'OẰM! Tôm Debug giòn rụm ngon nhức nách! 😋',
        'Nham nham... ngon tuyệt đỉnh!',
      ],
      dizzy: [
        'Ôi mẹ ơi... nhiều bug quá, hoa hết cả mắt rồi @@!',
        'Chóng mặt quá... sen bấm "Hết bug" giải cứu bé với!',
      ],
    },
  },

  dino: {
    id: 'dino',
    displayName: 'Dino',
    roleTitle: 'The Code Architect & DevOps Warrior',
    viewBox: '0 0 400 400',
    themeColor: '#2EC4B6',
    secondaryColor: '#FFB703',
    eyes: {
      centerL: { x: 170, y: 185 },
      centerR: { x: 240, y: 185 },
      rx: 24,
      ry: 28,
      pupilRadius: 15,
      maxPupilClamp: 11,
    },
    layers: [
      { id: 'shadow', name: 'Ground Shadow', depth: 0.3, zIndex: 1 },
      { id: 'body', name: 'Mint Dino Mascot', depth: 1.0, src: '/mascots/dino_clean.png', zIndex: 4 },
    ],
    tailWag: {
      pivot: { x: 76, y: 68 },
      amplitudeDeg: 7,
      speedSec: 2.0,
    },
    quotes: {
      idle: [
        'Mũ ngược laptop sẵn sàng, deploy không sợ rollback!',
        'Server êm như ru, không một lỗi 500 nào lọt qua!',
      ],
      happy: [
        'Clean code thơm phức, test unit pass 100%!',
        'Yayyy! Bé vui quá, nhảy tưng bừng nè!',
      ],
      hungry: [
        'Bụng réo rồi sen ơi, thèm Thạch Docker mát lạnh quá!',
        'Đói cồn cào rồi, cho bé đớp món đi sen!',
      ],
      sleepy: [
        'Zzz... server cứ để trẫm canh, ngủ xíu thôi...',
        'Oa... ngáp một cái dài, buồn ngủ quá đi!',
      ],
      focus: [
        'Deep Work chế độ bật! Không phân tâm!',
        'Gõ phím liên tục, đánh bay mọi deadline!',
      ],
      eating: [
        'OẰM! Thạch Docker béo ngậy ngon tuyệt! 😋',
        'Ngon quá xá, nạp đầy bình năng lượng rồi!',
      ],
      dizzy: [
        'Trời đất quay cuồng... ai ném bug vào đầu bé vậy @@!',
        'Cứu trẫm! Chóng mặt quay vòng vòng rồi!',
      ],
    },
  },

  cat: {
    id: 'cat',
    displayName: 'Bytey',
    roleTitle: 'The Figma Wizard & UI Crafter',
    viewBox: '0 0 400 400',
    themeColor: '#A855F7',
    secondaryColor: '#F472B6',
    eyes: {
      centerL: { x: 160, y: 180 },
      centerR: { x: 240, y: 180 },
      rx: 24,
      ry: 30,
      pupilRadius: 15,
      maxPupilClamp: 11,
    },
    layers: [
      { id: 'shadow', name: 'Ground Shadow', depth: 0.3, zIndex: 1 },
      { id: 'body', name: 'Lavender Cat Mascot', depth: 1.0, src: '/mascots/cat_clean.png', zIndex: 4 },
    ],
    tailWag: {
      pivot: { x: 78, y: 64 },
      amplitudeDeg: 9,
      speedSec: 1.8,
    },
    quotes: {
      idle: [
        'Đeo headphone nghe lofi, đuôi ngoặc { nắn từng pixel!',
        'Auto-layout chuẩn 8pt grid, nhìn là thấy mê!',
      ],
      happy: [
        'Giao diện ngọt ngào như kẹo, user thích mê!',
        'Meo meo~ được xoa đầu thích ghê!',
      ],
      hungry: [
        'Meo đói bụng rồi, thèm Bánh Cá RAM giòn rụm!',
        'Cho bé đớp miếng bánh cá đi sen ơi 🐟!',
      ],
      sleepy: [
        'Cuộn tròn ngủ trưa, nhạc lofi ru êm đềm Zzz...',
        'Meo... mắt díp lại rồi, trẫm đi ngủ nạp pin đây...',
      ],
      focus: [
        'Figma flow mượt mà, không giật lag!',
        'Tập trung vẽ prototype đỉnh cao nào!',
      ],
      eating: [
        'Nhoàm nhoàm! Bánh cá RAM giòn tan đậm vị silicon! 😋',
        'Ngon tuyệt cú mèo! Cảm ơn sen nha!',
      ],
      dizzy: [
        'Mắt xoáy vòng vòng rồi, ai đổi component set lung tung vậy @@!',
        'Hoa mắt chóng mặt quá meo meo!',
      ],
    },
  },

  octo: {
    id: 'octo',
    displayName: 'Octy',
    roleTitle: 'The Quality Guardian & Bug Hunter',
    viewBox: '0 0 400 400',
    themeColor: '#FF6B6B',
    secondaryColor: '#FFE66D',
    eyes: {
      centerL: { x: 175, y: 190 },
      centerR: { x: 235, y: 190 },
      rx: 22,
      ry: 26,
      pupilRadius: 14,
      maxPupilClamp: 10,
    },
    layers: [
      { id: 'shadow', name: 'Ground Shadow', depth: 0.3, zIndex: 1 },
      { id: 'body', name: 'Coral Octopus Mascot', depth: 1.0, src: '/mascots/octo_clean.png', zIndex: 4 },
    ],
    tailWag: {
      pivot: { x: 75, y: 72 },
      amplitudeDeg: 8,
      speedSec: 1.7,
    },
    quotes: {
      idle: [
        'Kính lúp sẵn sàng soi 100 test case!',
        'Bạch tuộc 4 xúc tua test đồng thời 4 nền tảng!',
      ],
      happy: [
        'Regression test pass 100%, release thôi sen!',
        'Tuyệt cú mèo! Không một bug critical nào sống sót!',
      ],
      hungry: [
        'Sen ơi đói lả người rồi, nạp Donut Espresso cho bé đi!',
        'Đói bụng quá, cho trẫm chút bánh donut đi mà!',
      ],
      sleepy: [
        'Zzz... test suite đã lên lịch chạy đêm, ngủ thôi...',
        'Khò khò... mắt díp lại rồi...',
      ],
      focus: [
        'Tập trung viết automated test script!',
        'Chạy load test 10,000 CCU, giữ vững hệ thống!',
      ],
      eating: [
        'Ngoạm! Donut thơm lừng ngập caffeine tỉnh cả ngủ! 😋',
        'Ngon nhức nách! Nạp đầy năng lượng săn bug!',
      ],
      dizzy: [
        'Trời ơi bug everywhere... xoay mòng mòng rồi @@!',
        'Chóng mặt hoa mắt quá sen cứu với!',
      ],
    },
  },
};

export const getMascotConfig = (type: MascotType): MascotConfig => {
  return MASCOT_CONFIGS[type] || MASCOT_CONFIGS.puffer;
};

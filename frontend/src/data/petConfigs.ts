import { FoodItem, PetConfig } from '../types/pet';

export const STARTER_PETS: PetConfig[] = [
  {
    id: 'PUFFY',
    name: 'Puffy',
    species: 'Cá Nóc Biển (Pufferfish)',
    archetype: 'The Bug Hunter',
    tagline: 'Phồng to khi stress, xẹp xuống thở phào khi fix xong bug!',
    description: 'Thân hình cầu tròn xoe màu xanh biển, gai vàng cao su mềm mại. Cực kỳ nhạy cảm với deadline nhưng siêu đáng yêu khi được cho ăn tôm.',
    primaryColor: '#38bdf8',    // Cyan / Sky blue
    secondaryColor: '#fef08a',  // Pastel yellow
    accentColor: '#f43f5e',     // Coral pink lips
    favoriteFood: 'Tôm Debug',
    passivePerk: '+20% EXP khi hoàn thành phiên Pomodoro ngắn (15-25m)',
    stats: {
      focusBonus: 85,
      decayResistance: 70,
      initialHappiness: 90,
    },
  },
  {
    id: 'BYTEY',
    name: 'Bytey',
    species: 'Mèo Cyber (Cyber Cat)',
    archetype: 'The Frontend Ninja',
    tagline: 'Gật gù theo nhạc lofi, đuôi cáp USB đổi màu theo tâm trạng.',
    description: 'Mèo hạt đậu màu tím pastel với đôi tai nhọn và chiếc đuôi cáp USB cắm sạc. Rất thích giao diện đẹp và không chịu làm việc nếu thiếu nhạc.',
    primaryColor: '#c084fc',    // Purple pastel
    secondaryColor: '#f472b6',  // Pink
    accentColor: '#38bdf8',     // Cyan
    favoriteFood: 'Bánh Cá RAM',
    passivePerk: 'Nhận gấp đôi điểm Thân thiện (Happiness) sau mỗi 3 ngày streak',
    stats: {
      focusBonus: 80,
      decayResistance: 80,
      initialHappiness: 85,
    },
  },
  {
    id: 'GOLEMY',
    name: 'Golemy',
    species: 'Khối Đá Server (Server Golem)',
    archetype: 'The Backend Architect',
    tagline: 'Lì lợm, trầm tĩnh và kiên định trước mọi lỗi 500 Internal Error.',
    description: 'Khối lập phương bo tròn góc màu xanh rêu mát mắt, trên đỉnh đầu mọc một nhánh mầm cây nhỏ đung đưa. Đôi mắt LED đổi màu biểu cảm.',
    primaryColor: '#34d399',    // Emerald
    secondaryColor: '#64748b',  // Slate stone
    accentColor: '#fbbf24',     // Amber LED
    favoriteFood: 'Thạch Năng Lượng Docker',
    passivePerk: '+25% EXP cho các phiên Deep Work dài (>45 phút)',
    stats: {
      focusBonus: 95,
      decayResistance: 90,
      initialHappiness: 75,
    },
  },
  {
    id: 'OCTY',
    name: 'Octy',
    species: 'Bạch Tuộc Git (Git Kraken)',
    archetype: 'The Fullstack Multitasker',
    tagline: 'Nhiều xúc tu gõ nhiều bàn phím cùng lúc, thích uống espresso.',
    description: 'Bạch tuộc tròn ủng màu hồng dâu, xúc tu uốn lượn mềm mại. Thích học nhiều ngôn ngữ lập trình nhưng rất dễ bị quá tải nếu ôm đồm.',
    primaryColor: '#fb7185',    // Rose
    secondaryColor: '#fda4af',  // Soft pink
    accentColor: '#67e8f9',     // Cyan
    favoriteFood: 'Donut Cà Phê',
    passivePerk: 'Tốc độ hồi năng lượng Energy tăng 15% sau mỗi giờ nghỉ giải lao',
    stats: {
      focusBonus: 88,
      decayResistance: 75,
      initialHappiness: 80,
    },
  },
];

export const INITIAL_FOODS: FoodItem[] = [
  {
    id: 'shrimp',
    name: 'Tôm Debug',
    icon: '🦐',
    color: 'from-orange-400 to-rose-500',
    hungerRestored: 30,
    happinessBonus: 15,
    description: 'Món ăn khoái khẩu của Puffy, vừa béo vừa giòn giúp tiêu hóa hết bug!',
    count: 5,
  },
  {
    id: 'fish_ram',
    name: 'Bánh Cá RAM',
    icon: '🐟',
    color: 'from-blue-400 to-cyan-500',
    hungerRestored: 25,
    happinessBonus: 20,
    description: 'Giòn rụm đậm vị silicon, nạp đầy bộ nhớ tức thì cho Bytey.',
    count: 3,
  },
  {
    id: 'docker_jelly',
    name: 'Thạch Docker',
    icon: '🧊',
    color: 'from-emerald-400 to-teal-500',
    hungerRestored: 35,
    happinessBonus: 10,
    description: 'Mát lạnh, đóng gói nguyên vẹn dinh dưỡng cho Golemy.',
    count: 3,
  },
  {
    id: 'coffee_donut',
    name: 'Donut Espresso',
    icon: '🍩',
    color: 'from-amber-400 to-amber-700',
    hungerRestored: 20,
    happinessBonus: 25,
    description: 'Nạp caffeine cực mạnh để kéo mood tỉnh táo làm việc.',
    count: 4,
  },
];

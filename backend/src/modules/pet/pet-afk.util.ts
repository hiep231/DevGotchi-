import { Pet, PetType, User } from '@prisma/client';

export interface AfkLootItem {
  id: string;
  name: string;
  icon: string;
  count: number;
}

export interface AfkAdventureResult {
  hasReward: boolean;
  hoursAway: number;
  expGained: number;
  energyRestored: number;
  loot: AfkLootItem[];
  story: string;
}

const AFK_LOOT_POOL: Record<PetType, { id: string; name: string; icon: string }[]> = {
  GOLEMY: [
    { id: 'docker_jelly', name: 'Thạch Docker', icon: '🐳' },
    { id: 'bao', name: 'Bánh Bao Bug', icon: '🥟' },
    { id: 'noodle_cup', name: 'Mì Ly Terminal', icon: '🍜' },
  ],
  BYTEY: [
    { id: 'fish_ram', name: 'Bánh Cá RAM', icon: '🐟' },
    { id: 'bubble_tea', name: 'Trà Sữa Sét', icon: '🧋' },
    { id: 'ice_cream', name: 'Kem Ốc Quế CSS', icon: '🍦' },
  ],
  OCTY: [
    { id: 'coffee_donut', name: 'Donut Espresso', icon: '🍩' },
    { id: 'shrimp', name: 'Tôm Debug', icon: '🦐' },
    { id: 'onigiri', name: 'Cơm Nắm Git', icon: '🍙' },
  ],
  PUFFY: [
    { id: 'shrimp', name: 'Tôm Debug', icon: '🦐' },
    { id: 'pizza', name: 'Pizza Deadline', icon: '🍕' },
    { id: 'banh_mi', name: 'Bánh Mì Sài Gòn', icon: '🥖' },
  ],
};

const AFK_STORIES: Record<PetType, string[]> = {
  GOLEMY: [
    'Trẫm đi tuần tra quanh cụm Kubernetes cluster và nhặt được mấy hộp Thạch Docker rơi nè sen!',
    'Lúc sen vắng nhà, trẫm đi dạo qua phòng server sưởi ấm và đào được chút chiến lợi phẩm công nghệ!',
    'Trẫm vừa ghé thăm trạm DevOps và mang về cho sen mấy món ăn tiếp sức code xuyên đêm nè!',
  ],
  BYTEY: [
    'Trẫm đi lạc qua thư viện component Figma và nhặt được mấy món ăn ngon lành cực nghệ!',
    'Nghe nhạc lofi cả buổi chiều, trẫm đi dạo quanh canvas và tha về cho sen chút quà ngọt ngào!',
    'Sen đi đâu lâu thế? Trẫm buồn chân đi dạo quanh phòng design kiếm được đồ ăn ngon nè!',
  ],
  OCTY: [
    'Kính lúp Octy vừa soi qua đống test case cũ và bắt được mấy chú bug đổi ra đồ ăn xịn sò!',
    'Trẫm dùng 4 xúc tu đi lục lọi trong log database và tóm được mấy món ngon bồi bổ cho sen!',
    'Cả ngày vắng sen, trẫm đi săn lùng bug quanh hệ thống và nhặt được quà may mắn nè!',
  ],
  PUFFY: [
    'Trẫm vừa đi họp sprint gián điệp về, ký được hợp đồng tài trợ thức ăn thơm phức cho sen!',
    'Bụng gắn RAM mạ vàng của trẫm đã quét được kho lương thực bí mật trong server nè sen ơi!',
    'Lúc sen bận, trẫm bơi lượn quanh roadmap và thu thập được nguồn năng lượng thượng hạng!',
  ],
};

/**
 * Calculates whether an offline user is eligible for an AFK exploration reward (>= 4 hours)
 */
export function evaluateAfkAdventure(
  user: User,
  pet: Pet,
  now: Date = new Date()
): AfkAdventureResult {
  const lastActiveTime = user.lastActive ? new Date(user.lastActive).getTime() : now.getTime();
  const diffMs = now.getTime() - lastActiveTime;
  const diffHours = diffMs / (1000 * 60 * 60);

  // Must be away for at least 4 hours
  if (diffHours < 4) {
    return {
      hasReward: false,
      hoursAway: Math.floor(diffHours),
      expGained: 0,
      energyRestored: 0,
      loot: [],
      story: '',
    };
  }

  // Cap exploration at 24 hours
  const hoursAway = Math.min(24, Math.floor(diffHours));
  
  // EXP scales with hours: 20 EXP per 4 hours (up to 80 EXP)
  const expGained = Math.min(80, 20 * Math.max(1, Math.floor(hoursAway / 4)));

  // Pick 1-2 items from pet's preferred pool
  const pool = AFK_LOOT_POOL[pet.type] || AFK_LOOT_POOL.GOLEMY;
  const itemCount = hoursAway >= 8 ? 2 : 1;
  const loot: AfkLootItem[] = [];

  for (let i = 0; i < itemCount; i++) {
    const pick = pool[Math.floor(Math.random() * pool.length)];
    const existing = loot.find((item) => item.id === pick.id);
    if (existing) {
      existing.count += 1;
    } else {
      loot.push({ ...pick, count: 1 });
    }
  }

  const stories = AFK_STORIES[pet.type] || AFK_STORIES.GOLEMY;
  const story = stories[Math.floor(Math.random() * stories.length)];

  return {
    hasReward: true,
    hoursAway,
    expGained,
    energyRestored: 100, // Pet was exploring/resting, energy is fully recharged!
    loot,
    story,
  };
}

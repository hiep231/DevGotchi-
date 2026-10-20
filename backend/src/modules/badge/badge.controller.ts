import { Controller, Get, Header, Param } from '@nestjs/common';
import { PetService } from '../pet/pet.service';

@Controller('badge')
export class BadgeController {
  constructor(private readonly petService: PetService) {}

  @Get(':username.svg')
  @Header('Content-Type', 'image/svg+xml')
  @Header('Cache-Control', 'max-age=60, s-maxage=60')
  async getPetBadge(@Param('username') username: string): Promise<string> {
    const petRes = await this.petService.getMyPet();
    const pet = petRes.data;

    const petColors: Record<string, string> = {
      PUFFY: '#38bdf8',
      BYTEY: '#c084fc',
      GOLEMY: '#34d399',
      OCTY: '#fb7185',
    };
    const petType = pet?.type || 'PUFFY';
    const petName = pet?.name || username || 'DevGotchi';
    const petLevel = pet?.level || 1;
    const petMood = pet?.mood || 'HAPPY';
    const totalFocus = pet?.totalFocusMinutes || 0;
    const accent = petColors[petType] || '#38bdf8';

    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="400" height="120" viewBox="0 0 400 120" fill="none">
        <defs>
          <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0f172a"/>
            <stop offset="100%" stop-color="#020617"/>
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <!-- Card Container -->
        <rect width="400" height="120" rx="20" fill="url(#bgGrad)" stroke="#1e293b" stroke-width="2"/>

        <!-- Pet Avatar Circle -->
        <circle cx="55" cy="60" r="34" fill="${accent}" opacity="0.25" filter="url(#glow)"/>
        <circle cx="55" cy="60" r="28" fill="${accent}" stroke="#ffffff" stroke-width="2"/>
        <text x="55" y="67" text-anchor="middle" font-family="'Fredoka', system-ui, sans-serif" font-size="22" font-weight="bold" fill="#0f172a">
          ${petName[0]}
        </text>

        <!-- Pet Details -->
        <text x="105" y="42" font-family="'Fredoka', system-ui, sans-serif" font-size="18" font-weight="bold" fill="#ffffff">
          ${petName}
        </text>
        <rect x="105" y="48" width="52" height="18" rx="6" fill="#1e293b"/>
        <text x="131" y="61" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="10" font-weight="bold" fill="${accent}">
          Lv.${petLevel}
        </text>

        <text x="165" y="62" font-family="'Fredoka', system-ui, sans-serif" font-size="12" fill="#94a3b8">
          ${petType} • Mood: ${petMood}
        </text>

        <!-- Stats Row -->
        <text x="105" y="92" font-family="'JetBrains Mono', monospace" font-size="11" fill="#cbd5e1">
          ⚡ Focus: ${totalFocus}m
        </text>

        <!-- DevGotchi Tag -->
        <text x="380" y="105" text-anchor="end" font-family="'Fredoka', system-ui, sans-serif" font-size="10" font-weight="bold" fill="#475569">
          DevGotchi 3D Pet
        </text>
      </svg>
    `.trim();
  }
}

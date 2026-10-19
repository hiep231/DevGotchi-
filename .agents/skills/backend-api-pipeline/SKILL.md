---
name: backend-api-pipeline
description: >-
  Use this skill when developing NestJS backend modules, REST controllers,
  Prisma database schemas, AI pet speech endpoints, or dynamic GitHub SVG badges in DevGotchi.
---

# NestJS Backend API & Pipeline Development Guide

This skill standardizes how backend endpoints, database services, and AI integrations are built within the `backend/` directory.

---

## 🏗️ 1. NestJS Module Directory Convention

Every business domain in `backend/src/` must follow this structure:

```text
backend/src/modules/<feature_name>/
├── dto/
│   ├── create-<feature>.dto.ts   # Input validation with class-validator
│   └── update-<feature>.dto.ts
├── <feature>.controller.ts        # HTTP routes, request/response handling
├── <feature>.service.ts           # Business logic & calculations
├── <feature>.module.ts            # Dependency injection configuration
└── <feature>.service.spec.ts      # Unit tests
```

---

## 🛡️ 2. Controller & DTO Standards

Always enforce validation on inbound payloads:

```typescript
// backend/src/modules/session/dto/complete-session.dto.ts
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CompleteSessionDto {
  @IsInt()
  @Min(5)
  durationMinutes: number;

  @IsString()
  @IsNotEmpty()
  tag: string;
}
```

```typescript
// backend/src/modules/session/session.controller.ts
import { Body, Controller, Post, UsePipes, ValidationPipe } from '@nestjs/common';
import { SessionService } from './session.service';
import { CompleteSessionDto } from './dto/complete-session.dto';

@Controller('sessions')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Post('complete')
  @UsePipes(new ValidationPipe({ transform: true }))
  async completeSession(@Body() dto: CompleteSessionDto) {
    return this.sessionService.recordSession(dto);
  }
}
```

---

## 🤖 3. AI Pet Persona Integration (Gemini Flash)

To power intelligent pet speech bubbles based on time, mood, and recent work:

```typescript
// backend/src/modules/ai/ai.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class AiService {
  async generatePetDialogue(petName: string, petType: string, mood: string, lastTag: string): Promise<string> {
    const prompt = `You are ${petName}, a cute 3D ${petType} virtual pet living on a developer's desktop.
    Current mood: ${mood}. The developer just finished coding on: ${lastTag}.
    Give a short, punchy 1-sentence reaction in Vietnamese with cute emoji. Keep it under 20 words.`;

    // Call Google Gemini API (gemini-2.5-flash)
    // Return generated dialogue string
    return "Tuyệt vời ông mặt trời! Đã fix xong bug, thưởng trẫm con tôm đi! 🦐";
  }
}
```

---

## 🏷️ 4. Dynamic GitHub Profile SVG Badge Endpoint

DevGotchi allows users to showcase their live pet on their GitHub profile README via:
`GET /api/badge/:username.svg`

The controller must return an SVG string with `Content-Type: image/svg+xml`:

```typescript
@Get('badge/:username.svg')
@Header('Content-Type', 'image/svg+xml')
@Header('Cache-Control', 'max-age=60, s-maxage=60')
async getPetBadge(@Param('username') username: string): Promise<string> {
  const pet = await this.petService.getByUsername(username);
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="380" height="110" viewBox="0 0 380 110">
      <rect width="100%" height="100%" rx="16" fill="#0f172a" stroke="#334155" stroke-width="2"/>
      <circle cx="50" cy="55" r="32" fill="#38bdf8"/>
      <text x="100" y="42" fill="#ffffff" font-size="16" font-family="sans-serif" font-weight="bold">${pet.name} (Lv.${pet.level})</text>
      <text x="100" y="66" fill="#94a3b8" font-size="12" font-family="sans-serif">Streak: ${pet.streak} ngày • Mood: ${pet.mood}</text>
      <text x="100" y="88" fill="#38bdf8" font-size="11" font-family="sans-serif">Focus: ${pet.totalFocusMinutes} phút</text>
    </svg>
  `;
}
```

---

## 🚀 5. Checklist Before Committing Backend Code

1. Input payloads are strictly validated using `class-validator` DTOs.
2. Sensitive credentials (DB URI, API keys) are kept in `.env` and accessed via `@nestjs/config`.
3. Build succeeds without TypeScript compilation errors: `npm --prefix backend run build`.

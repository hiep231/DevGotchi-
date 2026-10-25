# DevGotchi Code Quality & Architectural Rules

## 1. Zero-Breaking-Change Guarantee
* Never delete or alter existing database columns or localStorage keys in ways that invalidate active user pets or inventory items.
* Always handle backward compatibility: if a field might be null for older pets (e.g. `energy`, `lastFedAt`, `isSleeping`), provide sensible fallbacks (`energy ?? 85`, `lastFedAt ? new Date(lastFedAt) : new Date()`).

## 2. Frontend Standards (`frontend/`)
* **Strict TypeScript**: Never use `any` unless strictly unavoidable with 3rd-party libraries.
* **Styling**: Tailwind CSS v4. No raw inline styles except for dynamic 3D hex color tints.
* **Typography**: Always use `'Nunito'` and `'Be Vietnam Pro'` with Vietnamese diacritics support.
* **Component Granularity**: Keep components focused. Extract complex logic into custom hooks (`usePetQueries`, `useTimerStore`).
* **Clean State Updates**: Zustand stores must use immutable spread operations. Never mutate state properties directly.
* **Three.js & Canvas Cleanliness**: Always dispose geometries, materials, textures, and cancel `requestAnimationFrame` loops on unmount.

## 3. Backend Standards (`backend/`)
* **Clean Architecture**: Strict separation of Controller -> Service -> Prisma Repository.
* **DTO Validation**: Every POST / PUT request must use a dedicated DTO with `class-validator` (`@IsString()`, `@IsInt()`, `@Min()`, etc.).
* **Safe Error Handling**: Use standard NestJS HTTP exceptions (`BadRequestException`, `NotFoundException`, `UnauthorizedException`).
* **Timezone Safety**: Daily checkins, streak resets, and decay calculations must be evaluated with UTC+7 (Vietnam Time) awareness.

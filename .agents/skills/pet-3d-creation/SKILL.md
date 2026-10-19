---
name: pet-3d-creation
description: >-
  Use this skill when designing, coding, animating, or optimizing 3D procedural
  virtual pets in Three.js within DevGotchi, including geometry assembly, clay materials,
  lighting, expressions, and interactive feeding/poking physics.
---

# 3D Procedural Pet Creation & Animation Runbook

This skill outlines the step-by-step procedure for crafting adorable, stylized 3D Chibi pets that run smoothly at 60 FPS in WebGL.

---

## 🎨 1. Aesthetic DNA: Stylized Clay Chibi

Every DevGotchi pet adheres to the following visual rules:
* **Geometry:** Built from primitive solids (Sphere, Cylinder, Torus, Cone, Beveled Box). Keep polycounts moderate (segments between 24 and 36).
* **Material Palette:** `THREE.MeshStandardMaterial`
  * `roughness`: `0.25 - 0.35` (creates a soft, touchable rubber/vinyl/clay appearance).
  * `metalness`: `0.05 - 0.1` (keeps colors vibrant without metallic reflection).
  * `emissive`: Used for LED eyes, glowing cables, or magic horns.
* **Palette:** Vibrant pastel tones (`#38bdf8` cyan, `#fef08a` butter yellow, `#f43f5e` coral pink, `#c084fc` purple).

---

## 💡 2. Standard 3-Point Studio Lighting Setup

Always illuminate the pet with this balanced lighting rig:

```typescript
// 1. Soft global ambient light
const ambient = new THREE.AmbientLight(0xffffff, 1.2);

// 2. Warm key light casting soft shadows
const keyLight = new THREE.DirectionalLight(0xfff7ed, 2.0);
keyLight.position.set(3, 5, 4);
keyLight.castShadow = true;

// 3. Cool fill light for subtle shadows
const fillLight = new THREE.DirectionalLight(0xbae6fd, 1.2);
fillLight.position.set(-4, -2, 2);

// 4. Back rim light for edge separation
const rimLight = new THREE.PointLight(0xffedd5, 1.5, 10);
rimLight.position.set(0, 3, -3);
```

---

## 🏃 3. Step-by-Step: Adding a New Pet

To create a new pet (e.g. `CYBER_FOX`):

1. **Add to Types & Configs:**
   - In `src/types/pet.ts`: Add `CYBER_FOX` to `PetType`.
   - In `src/data/petConfigs.ts`: Add description, favorite food, colors, and passive perk to `STARTER_PETS`.
2. **Implement Procedural Mesh Builder in `PetCanvas.tsx`:**
   ```typescript
   if (type === 'CYBER_FOX') {
     // 1. Main Head/Body
     const bodyGeo = new THREE.SphereGeometry(0.9, 32, 32);
     const bodyMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.3 });
     const body = new THREE.Mesh(bodyGeo, bodyMat);
     group.add(body);

     // 2. Ears
     const earGeo = new THREE.ConeGeometry(0.25, 0.5, 16);
     const earMat = new THREE.MeshStandardMaterial({ color: 0xea580c });
     // ... position and add to group

     // 3. Eyes with Mood Support
     addCuteEyes(group, leftEyeRef, rightEyeRef, mood, 0.35, 0.2, 0.82);
   }
   ```
3. **Handle Mood Expressions:**
   - **HAPPY:** Large shiny pupils with white glint highlight spheres.
   - **DIZZY / BUGGY:** Spiral geometry rotating continuously via `clock.getDelta()`.
   - **SLEEPING:** Slim curved or flat line mesh representing shut eyelids.
   - **FOCUSING:** Add miniature accessories (e.g., glasses, headphones).

---

## ✨ 4. Physics & Micro-Interactions

* **Mouse Parallax (Look-at):**
  Track mouse coordinates normalized `[-1, 1]` and lerp pet rotation:
  ```typescript
  petGroup.rotation.y += (targetRotY - petGroup.rotation.y) * 0.08;
  petGroup.rotation.x += (targetRotX - petGroup.rotation.x) * 0.08;
  ```
* **Poke Reaction (Squash & Stretch):**
  When poked, apply sinusoidal elastic scaling:
  ```typescript
  const bounce = Math.sin(pokeBounce * Math.PI * 4) * pokeBounce;
  petGroup.scale.set(1 - bounce * 0.25, 1 + bounce * 0.35, 1 - bounce * 0.25);
  ```
* **Feeding Trajectory:**
  Animate food mesh along an upward bezier/parabolic arc toward the pet's mouth, scaling down to 0 as the mouth opens.

---

## 🧹 5. Memory Disposal Hygiene

Whenever a 3D component unmounts:
* Cancel `requestAnimationFrame`.
* Remove all mouse and resize event listeners.
* Traverse the scene and invoke `.dispose()` on all geometries, materials, and textures.
* Call `renderer.dispose()` and remove the canvas from the DOM.
